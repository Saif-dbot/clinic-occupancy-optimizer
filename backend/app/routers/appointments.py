from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import require_roles
from app.schemas import (
    AppointmentCancelRequest,
    AppointmentCancelResponse,
    AppointmentCreateRequest,
    AppointmentCreateResponse,
    AppointmentRecord,
    AppointmentSlotRecord,
    AppointmentView,
    NoShowScoreRecord,
    NoShowScoreSnapshot,
    ReminderChannel,
    ReminderMessageRecord,
    Role,
    WaitlistEntryRecord,
    WaitlistOfferSummary,
)
from app.services.no_show import compute_no_show_score, reminder_actions_for_score
from app.store import store

router = APIRouter()


def _build_reminders(
    appointment_id: UUID,
    slot: AppointmentSlotRecord,
    actions: list[str],
) -> list[ReminderMessageRecord]:
    reminders: list[ReminderMessageRecord] = []

    def add_reminder(channel: ReminderChannel, scheduled_at: datetime) -> None:
        reminders.append(
            ReminderMessageRecord(
                id=uuid4(),
                appointment_id=appointment_id,
                channel=channel,
                status="queued",
                scheduled_at=scheduled_at,
                sent_at=None,
            )
        )

    if "reminder_j_minus_2" in actions:
        add_reminder("sms", slot.starts_at - timedelta(days=2))
    if "reminder_j_minus_1" in actions:
        add_reminder("sms", slot.starts_at - timedelta(days=1))
    if "active_confirmation" in actions:
        add_reminder("email", slot.starts_at - timedelta(days=1, hours=-1))
    if "priority_reminder" in actions:
        add_reminder("sms", slot.starts_at - timedelta(days=1))
    if "secretary_call" in actions:
        add_reminder("whatsapp", slot.starts_at - timedelta(hours=18))

    return reminders


def _find_waitlist_candidate(slot: AppointmentSlotRecord) -> WaitlistEntryRecord | None:
    candidates = sorted(
        (
            entry
            for entry in store.waitlist_entries.values()
            if entry.status == "active" and entry.site_id == slot.site_id
        ),
        key=lambda e: (e.priority, e.created_at),
    )

    for entry in candidates:
        if entry.preferred_practitioner_id and entry.preferred_practitioner_id != slot.practitioner_id:
            continue
        if entry.earliest_time and slot.starts_at < entry.earliest_time:
            continue
        if entry.latest_time and slot.starts_at > entry.latest_time:
            continue
        return entry

    return None


@router.post(
    "/appointments",
    response_model=AppointmentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_appointment(
    payload: AppointmentCreateRequest,
    actor_role: Role = Depends(require_roles("admin", "secretaire", "client")),
) -> AppointmentCreateResponse:
    with store.lock:
        slot = store.slots.get(payload.slot_id)
        if slot is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

        if slot.status != "open":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot is not available",
            )

        patient = store.patients.get(payload.patient_id)
        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

        occupied = any(
            appointment.slot_id == payload.slot_id and appointment.status != "cancelled"
            for appointment in store.appointments.values()
        )
        if occupied:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot already booked",
            )

        appointment = AppointmentRecord(
            id=uuid4(),
            slot_id=payload.slot_id,
            patient_id=payload.patient_id,
            status="scheduled",
            booked_at=datetime.now(timezone.utc),
            notes=payload.notes,
        )
        store.appointments[appointment.id] = appointment
        slot.status = "booked"

        score, risk_level, factors = compute_no_show_score(
            patient=patient,
            slot_start=slot.starts_at,
            confirmation_channel=payload.confirmation_channel,
        )
        score_record = NoShowScoreRecord(
            appointment_id=appointment.id,
            score=score,
            model_version="v0.1",
            factors=factors,
            risk_level=risk_level,
            created_at=datetime.now(timezone.utc),
        )
        store.no_show_scores[appointment.id] = score_record

        reminder_actions = reminder_actions_for_score(score)
        reminders = _build_reminders(appointment.id, slot, reminder_actions)
        for reminder in reminders:
            store.reminders[reminder.id] = reminder

        store.add_audit(
            actor_role=actor_role,
            action="appointment_created",
            entity_type="appointment",
            entity_id=appointment.id,
            metadata={
                "slot_id": str(slot.id),
                "patient_id": str(patient.id),
                "risk_level": risk_level,
                "score": score,
            },
        )

        return AppointmentCreateResponse(
            appointment=AppointmentView.model_validate(appointment),
            no_show=NoShowScoreSnapshot(
                score=score_record.score,
                risk_level=score_record.risk_level,
                model_version=score_record.model_version,
                factors=score_record.factors,
                created_at=score_record.created_at,
            ),
            reminder_actions=reminder_actions,
        )


@router.patch(
    "/appointments/{appointment_id}/cancel",
    response_model=AppointmentCancelResponse,
)
def cancel_appointment(
    appointment_id: UUID,
    payload: AppointmentCancelRequest,
    actor_role: Role = Depends(require_roles("admin", "secretaire", "client")),
) -> AppointmentCancelResponse:
    with store.lock:
        appointment = store.appointments.get(appointment_id)
        if appointment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

        if appointment.status in {"cancelled", "completed", "no_show"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Appointment in status '{appointment.status}' cannot be cancelled",
            )

        appointment.status = "cancelled"
        appointment.cancel_reason = payload.reason or "unspecified"
        appointment.cancelled_at = datetime.now(timezone.utc)

        waitlist_offer: WaitlistOfferSummary | None = None
        slot = store.slots.get(appointment.slot_id)
        if slot is not None:
            slot.status = "open"
            candidate = _find_waitlist_candidate(slot)
            if candidate is not None:
                candidate.status = "offered"
                candidate.offered_slot_id = slot.id
                candidate.offered_expires_at = datetime.now(timezone.utc) + timedelta(hours=2)
                slot.status = "held"

                waitlist_offer = WaitlistOfferSummary(
                    waitlist_entry_id=candidate.id,
                    patient_id=candidate.patient_id,
                    slot_id=slot.id,
                    expires_at=candidate.offered_expires_at,
                )
                store.add_audit(
                    actor_role=actor_role,
                    action="waitlist_offer_sent",
                    entity_type="waitlist",
                    entity_id=candidate.id,
                    metadata={
                        "slot_id": str(slot.id),
                        "appointment_id": str(appointment.id),
                        "expires_at": candidate.offered_expires_at.isoformat(),
                    },
                )

        store.add_audit(
            actor_role=actor_role,
            action="appointment_cancelled",
            entity_type="appointment",
            entity_id=appointment.id,
            metadata={
                "reason": appointment.cancel_reason,
                "waitlist_offer_sent": waitlist_offer is not None,
            },
        )

        return AppointmentCancelResponse(
            appointment=AppointmentView.model_validate(appointment),
            waitlist_offer=waitlist_offer,
        )
