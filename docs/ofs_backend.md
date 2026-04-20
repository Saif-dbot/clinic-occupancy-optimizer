# OFS Backend - V1

## Scope

This OFS defines backend behavior for the MVP flows:

1. Appointment booking with no double booking.
2. Appointment cancellation with waitlist offer.
3. Waitlist enqueue by site.
4. Operational KPI exposure.
5. No-show risk recomputation.

## Endpoints

### POST /appointments

Creates an appointment on an open slot.

Business rules:

- Slot must exist and be `open`.
- Slot cannot be booked twice.
- Patient must exist.
- No-show score is computed and persisted.
- Reminder actions are derived from score thresholds.
- Audit log entry is created.

### PATCH /appointments/{id}/cancel

Cancels an appointment.

Business rules:

- Appointment must exist and be cancellable.
- Slot is reopened.
- If a compatible active waitlist candidate exists, offer is created with expiration.
- Audit log entries are created for cancellation and offer.

### POST /waitlist/{siteId}/enqueue

Adds patient to waitlist for a site.

Business rules:

- Site and patient must exist.
- Preferred practitioner must exist when provided.
- Entry starts with status `active` and priority value.
- Audit log entry is created.

### GET /dashboard/kpi

Returns operational KPI metrics and threshold alerts.

Metrics covered:

- no_show_rate
- occupancy_rate
- recovered_slots_rate
- booking_lead_time_days
- reminder_delivery_rate
- high_risk_confirmation_rate
- slot_refill_time_hours

### POST /risk-score/recompute/{appointmentId}

Recomputes no-show risk for an appointment.

Business rules:

- Appointment, patient, and slot must exist.
- Score record is replaced with new snapshot.
- Reminder action plan is returned.
- Audit log entry is created.

## Security / RBAC (current stage)

- Simulated with `x-role` header.
- Allowed roles by endpoint are enforced server-side.
- Invalid role returns 400.
- Unauthorized role returns 403.

## Limits of V1 implementation

- In-memory persistence only.
- No background workers yet.
- No external notification provider integration yet.
