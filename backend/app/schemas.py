from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

Role = Literal["admin", "secretaire", "medecin", "client"]
SlotStatus = Literal["open", "held", "booked", "blocked"]
AppointmentStatus = Literal["scheduled", "confirmed", "cancelled", "no_show", "completed"]
WaitlistStatus = Literal["active", "offered", "accepted", "expired", "removed"]
ReminderChannel = Literal["sms", "email", "whatsapp"]
ReminderStatus = Literal["queued", "sent", "delivered", "failed"]
RiskLevel = Literal["low", "medium", "high"]
ConfirmationChannel = Literal["none", "sms", "email", "phone"]


class SiteRecord(BaseModel):
    id: UUID
    name: str
    timezone: str = "UTC"


class PractitionerRecord(BaseModel):
    id: UUID
    site_id: UUID
    full_name: str
    specialty: str


class PatientProfile(BaseModel):
    id: UUID
    full_name: str
    email: str | None = None
    phone: str | None = None
    no_show_history: int = 0
    last_visit_at: datetime | None = None


class AppointmentSlotRecord(BaseModel):
    id: UUID
    site_id: UUID
    practitioner_id: UUID
    starts_at: datetime
    ends_at: datetime
    status: SlotStatus = "open"


class AppointmentRecord(BaseModel):
    id: UUID
    slot_id: UUID
    patient_id: UUID
    status: AppointmentStatus = "scheduled"
    booked_at: datetime
    cancelled_at: datetime | None = None
    cancel_reason: str | None = None
    notes: str | None = None


class NoShowFactor(BaseModel):
    factor: str
    points: float
    rationale: str


class NoShowScoreRecord(BaseModel):
    appointment_id: UUID
    score: float = Field(ge=0, le=100)
    model_version: str
    factors: list[NoShowFactor] = Field(default_factory=list)
    risk_level: RiskLevel
    created_at: datetime


class ReminderMessageRecord(BaseModel):
    id: UUID
    appointment_id: UUID
    channel: ReminderChannel
    status: ReminderStatus = "queued"
    scheduled_at: datetime
    sent_at: datetime | None = None


class WaitlistEntryRecord(BaseModel):
    id: UUID
    site_id: UUID
    patient_id: UUID
    service_id: UUID | None = None
    preferred_practitioner_id: UUID | None = None
    earliest_time: datetime | None = None
    latest_time: datetime | None = None
    priority: int = Field(default=100, ge=1, le=999)
    status: WaitlistStatus = "active"
    created_at: datetime
    offered_slot_id: UUID | None = None
    offered_expires_at: datetime | None = None


class AuditLogRecord(BaseModel):
    id: UUID
    actor_role: Role
    action: str
    entity_type: str
    entity_id: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class AppointmentView(BaseModel):
    id: UUID
    slot_id: UUID
    patient_id: UUID
    status: AppointmentStatus
    booked_at: datetime
    cancelled_at: datetime | None = None
    cancel_reason: str | None = None
    notes: str | None = None


class NoShowScoreSnapshot(BaseModel):
    score: float
    risk_level: RiskLevel
    model_version: str
    factors: list[NoShowFactor]
    created_at: datetime


class AppointmentCreateRequest(BaseModel):
    slot_id: UUID
    patient_id: UUID
    notes: str | None = Field(default=None, max_length=500)
    confirmation_channel: ConfirmationChannel = "none"


class AppointmentCreateResponse(BaseModel):
    appointment: AppointmentView
    no_show: NoShowScoreSnapshot
    reminder_actions: list[str]


class AppointmentCancelRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=300)


class WaitlistOfferSummary(BaseModel):
    waitlist_entry_id: UUID
    patient_id: UUID
    slot_id: UUID
    expires_at: datetime


class AppointmentCancelResponse(BaseModel):
    appointment: AppointmentView
    waitlist_offer: WaitlistOfferSummary | None = None


class WaitlistEnqueueRequest(BaseModel):
    patient_id: UUID
    service_id: UUID | None = None
    preferred_practitioner_id: UUID | None = None
    earliest_time: datetime | None = None
    latest_time: datetime | None = None
    priority: int = Field(default=100, ge=1, le=999)


class WaitlistEnqueueResponse(BaseModel):
    entry: WaitlistEntryRecord


class DashboardKPIMetrics(BaseModel):
    no_show_rate: float
    occupancy_rate: float
    recovered_slots_rate: float
    booking_lead_time_days: float
    reminder_delivery_rate: float
    high_risk_confirmation_rate: float
    slot_refill_time_hours: float


class KPIAlert(BaseModel):
    type: Literal["no_show_rate", "occupancy_rate", "reminder_delivery", "slot_refill"]
    severity: Literal["warning", "critical"]
    message: str
    value: float
    threshold: float


class DashboardKPIResponse(BaseModel):
    generated_at: datetime
    window_days: int
    metrics: DashboardKPIMetrics
    alerts: list[KPIAlert]


class RiskRecomputeRequest(BaseModel):
    confirmation_channel: ConfirmationChannel = "none"


class RiskRecomputeResponse(BaseModel):
    appointment_id: UUID
    no_show: NoShowScoreSnapshot
    reminder_actions: list[str]


class ErrorResponse(BaseModel):
    detail: str
