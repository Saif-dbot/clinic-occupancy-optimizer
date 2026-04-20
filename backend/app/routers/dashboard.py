from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query

from app.dependencies import require_roles
from app.schemas import DashboardKPIMetrics, DashboardKPIResponse, KPIAlert, Role
from app.store import store

router = APIRouter()


def _pct(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


def _avg(values: list[float]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 2)


@router.get("/dashboard/kpi", response_model=DashboardKPIResponse)
def get_dashboard_kpi(
    window_days: int = Query(default=14, ge=1, le=90),
    actor_role: Role = Depends(require_roles("admin", "secretaire")),
) -> DashboardKPIResponse:
    del actor_role

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=window_days)

    with store.lock:
        slots_in_window = [slot for slot in store.slots.values() if slot.starts_at >= window_start]
        slot_ids = {slot.id for slot in slots_in_window}

        appointments_in_window = [
            appointment
            for appointment in store.appointments.values()
            if appointment.slot_id in slot_ids or appointment.booked_at >= window_start
        ]

        no_show_count = sum(1 for appointment in appointments_in_window if appointment.status == "no_show")
        confirmed_base = sum(
            1
            for appointment in appointments_in_window
            if appointment.status in {"confirmed", "completed", "no_show"}
        )
        no_show_rate = _pct(no_show_count, confirmed_base)

        occupancy_numerator = sum(1 for slot in slots_in_window if slot.status in {"booked", "held"})
        occupancy_rate = _pct(occupancy_numerator, len(slots_in_window))

        cancelled_count = sum(1 for appointment in appointments_in_window if appointment.status == "cancelled")
        recovered_count = sum(
            1
            for entry in store.waitlist_entries.values()
            if entry.status in {"offered", "accepted"}
            and entry.created_at >= window_start
        )
        recovered_slots_rate = _pct(recovered_count, cancelled_count)

        lead_times: list[float] = []
        for appointment in appointments_in_window:
            slot = store.slots.get(appointment.slot_id)
            if slot is None:
                continue
            lead_days = (slot.starts_at - appointment.booked_at).total_seconds() / 86400
            lead_times.append(max(lead_days, 0.0))
        booking_lead_time_days = _avg(lead_times)

        reminders = [
            reminder
            for reminder in store.reminders.values()
            if reminder.scheduled_at >= window_start
        ]
        sent_like = [r for r in reminders if r.status in {"sent", "delivered", "failed"}]
        delivered = [r for r in reminders if r.status == "delivered"]
        reminder_delivery_rate = _pct(len(delivered), len(sent_like) if sent_like else len(reminders))

        high_risk_appointments = [
            appointment
            for appointment in appointments_in_window
            if (store.no_show_scores.get(appointment.id) and store.no_show_scores[appointment.id].score >= 70)
        ]
        high_risk_confirmed = [
            appointment
            for appointment in high_risk_appointments
            if appointment.status in {"confirmed", "completed"}
        ]
        high_risk_confirmation_rate = _pct(len(high_risk_confirmed), len(high_risk_appointments))

        cancellation_events = {
            str(log.entity_id): log
            for log in store.audit_logs.values()
            if log.action == "appointment_cancelled" and log.created_at >= window_start and log.entity_id is not None
        }
        refill_deltas_hours: list[float] = []
        for log in store.audit_logs.values():
            if log.action != "waitlist_offer_sent" or log.created_at < window_start:
                continue
            appointment_id = str(log.metadata.get("appointment_id", ""))
            cancelled_event = cancellation_events.get(appointment_id)
            if cancelled_event is None:
                continue
            delta_hours = (log.created_at - cancelled_event.created_at).total_seconds() / 3600
            refill_deltas_hours.append(max(delta_hours, 0.0))

        if refill_deltas_hours:
            slot_refill_time_hours = _avg(refill_deltas_hours)
        elif cancelled_count > 0:
            slot_refill_time_hours = 48.0
        else:
            slot_refill_time_hours = 0.0

        metrics = DashboardKPIMetrics(
            no_show_rate=no_show_rate,
            occupancy_rate=occupancy_rate,
            recovered_slots_rate=recovered_slots_rate,
            booking_lead_time_days=booking_lead_time_days,
            reminder_delivery_rate=reminder_delivery_rate,
            high_risk_confirmation_rate=high_risk_confirmation_rate,
            slot_refill_time_hours=slot_refill_time_hours,
        )

        alerts: list[KPIAlert] = []
        if metrics.no_show_rate > 20:
            alerts.append(
                KPIAlert(
                    type="no_show_rate",
                    severity="critical",
                    message="No-show rate above 20%",
                    value=metrics.no_show_rate,
                    threshold=20,
                )
            )
        if metrics.occupancy_rate < 70:
            alerts.append(
                KPIAlert(
                    type="occupancy_rate",
                    severity="warning",
                    message="Occupancy rate under 70%",
                    value=metrics.occupancy_rate,
                    threshold=70,
                )
            )
        if metrics.reminder_delivery_rate < 95:
            alerts.append(
                KPIAlert(
                    type="reminder_delivery",
                    severity="critical",
                    message="Reminder delivery rate under 95%",
                    value=metrics.reminder_delivery_rate,
                    threshold=95,
                )
            )
        if metrics.slot_refill_time_hours > 24:
            alerts.append(
                KPIAlert(
                    type="slot_refill",
                    severity="critical",
                    message="Slot refill time above 24h",
                    value=metrics.slot_refill_time_hours,
                    threshold=24,
                )
            )

        return DashboardKPIResponse(
            generated_at=now,
            window_days=window_days,
            metrics=metrics,
            alerts=alerts,
        )
