from __future__ import annotations

from datetime import datetime, timedelta, timezone
from threading import RLock
from typing import Any
from uuid import UUID, uuid4

from app.schemas import (
    AppointmentRecord,
    AppointmentSlotRecord,
    AuditLogRecord,
    PatientProfile,
    PractitionerRecord,
    ReminderMessageRecord,
    Role,
    SiteRecord,
    WaitlistEntryRecord,
    NoShowScoreRecord,
)
from app.services.no_show import compute_no_show_score


class InMemoryStore:
    def __init__(self) -> None:
        self.lock = RLock()
        self.reset()

    def reset(self) -> None:
        with self.lock:
            self.sites: dict[UUID, SiteRecord] = {}
            self.practitioners: dict[UUID, PractitionerRecord] = {}
            self.patients: dict[UUID, PatientProfile] = {}
            self.slots: dict[UUID, AppointmentSlotRecord] = {}
            self.appointments: dict[UUID, AppointmentRecord] = {}
            self.no_show_scores: dict[UUID, NoShowScoreRecord] = {}
            self.reminders: dict[UUID, ReminderMessageRecord] = {}
            self.waitlist_entries: dict[UUID, WaitlistEntryRecord] = {}
            self.audit_logs: dict[UUID, AuditLogRecord] = {}
            self._seed_data()

    def add_audit(
        self,
        actor_role: Role,
        action: str,
        entity_type: str,
        entity_id: UUID | None,
        metadata: dict[str, Any] | None = None,
    ) -> AuditLogRecord:
        entry = AuditLogRecord(
            id=uuid4(),
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata or {},
            created_at=datetime.now(timezone.utc),
        )
        self.audit_logs[entry.id] = entry
        return entry

    def _seed_data(self) -> None:
        now = datetime.now(timezone.utc)

        site = SiteRecord(id=uuid4(), name="Clinique Saint-Michel", timezone="Europe/Paris")
        self.sites[site.id] = site

        practitioner_a = PractitionerRecord(
            id=uuid4(),
            site_id=site.id,
            full_name="Dr Jean Lefevre",
            specialty="Medecine generale",
        )
        practitioner_b = PractitionerRecord(
            id=uuid4(),
            site_id=site.id,
            full_name="Dr Claire Moreau",
            specialty="Cardiologie",
        )
        self.practitioners[practitioner_a.id] = practitioner_a
        self.practitioners[practitioner_b.id] = practitioner_b

        patient_a = PatientProfile(
            id=uuid4(),
            full_name="Lucas Martin",
            email="lucas.martin@email.fr",
            phone="0612345678",
            no_show_history=0,
            last_visit_at=now - timedelta(days=20),
        )
        patient_b = PatientProfile(
            id=uuid4(),
            full_name="Lea Durand",
            email="lea.durand@email.fr",
            phone="0667890123",
            no_show_history=3,
            last_visit_at=now - timedelta(days=190),
        )
        patient_c = PatientProfile(
            id=uuid4(),
            full_name="Louis Richard",
            email="louis.richard@email.fr",
            phone="0656789012",
            no_show_history=1,
            last_visit_at=now - timedelta(days=90),
        )
        patient_d = PatientProfile(
            id=uuid4(),
            full_name="Emma Bernard",
            email="emma.bernard@email.fr",
            phone="0623456789",
            no_show_history=2,
            last_visit_at=now - timedelta(days=60),
        )

        self.patients[patient_a.id] = patient_a
        self.patients[patient_b.id] = patient_b
        self.patients[patient_c.id] = patient_c
        self.patients[patient_d.id] = patient_d

        slot_1 = AppointmentSlotRecord(
            id=uuid4(),
            site_id=site.id,
            practitioner_id=practitioner_a.id,
            starts_at=(now + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0),
            ends_at=(now + timedelta(days=1)).replace(hour=9, minute=30, second=0, microsecond=0),
            status="open",
        )
        slot_2 = AppointmentSlotRecord(
            id=uuid4(),
            site_id=site.id,
            practitioner_id=practitioner_a.id,
            starts_at=(now + timedelta(days=1)).replace(hour=9, minute=30, second=0, microsecond=0),
            ends_at=(now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0),
            status="booked",
        )
        slot_3 = AppointmentSlotRecord(
            id=uuid4(),
            site_id=site.id,
            practitioner_id=practitioner_a.id,
            starts_at=(now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0),
            ends_at=(now + timedelta(days=1)).replace(hour=10, minute=30, second=0, microsecond=0),
            status="open",
        )
        slot_4 = AppointmentSlotRecord(
            id=uuid4(),
            site_id=site.id,
            practitioner_id=practitioner_b.id,
            starts_at=(now + timedelta(days=1)).replace(hour=14, minute=0, second=0, microsecond=0),
            ends_at=(now + timedelta(days=1)).replace(hour=14, minute=30, second=0, microsecond=0),
            status="open",
        )
        slot_5 = AppointmentSlotRecord(
            id=uuid4(),
            site_id=site.id,
            practitioner_id=practitioner_b.id,
            starts_at=(now + timedelta(days=2)).replace(hour=9, minute=0, second=0, microsecond=0),
            ends_at=(now + timedelta(days=2)).replace(hour=9, minute=30, second=0, microsecond=0),
            status="open",
        )

        for slot in (slot_1, slot_2, slot_3, slot_4, slot_5):
            self.slots[slot.id] = slot

        appointment = AppointmentRecord(
            id=uuid4(),
            slot_id=slot_2.id,
            patient_id=patient_b.id,
            status="confirmed",
            booked_at=now - timedelta(days=2),
            notes="Controle de suivi",
        )
        self.appointments[appointment.id] = appointment

        score, risk_level, factors = compute_no_show_score(
            patient=patient_b,
            slot_start=slot_2.starts_at,
            confirmation_channel="sms",
        )
        self.no_show_scores[appointment.id] = NoShowScoreRecord(
            appointment_id=appointment.id,
            score=score,
            model_version="v0.1",
            factors=factors,
            risk_level=risk_level,
            created_at=now,
        )

        reminder = ReminderMessageRecord(
            id=uuid4(),
            appointment_id=appointment.id,
            channel="sms",
            status="delivered",
            scheduled_at=slot_2.starts_at - timedelta(days=2),
            sent_at=now - timedelta(days=1),
        )
        self.reminders[reminder.id] = reminder

        waitlist_entry = WaitlistEntryRecord(
            id=uuid4(),
            site_id=site.id,
            patient_id=patient_c.id,
            preferred_practitioner_id=practitioner_a.id,
            earliest_time=(now + timedelta(days=1)).replace(hour=8, minute=0, second=0, microsecond=0),
            latest_time=(now + timedelta(days=1)).replace(hour=11, minute=30, second=0, microsecond=0),
            priority=20,
            status="active",
            created_at=now - timedelta(hours=6),
        )
        self.waitlist_entries[waitlist_entry.id] = waitlist_entry

        self.add_audit(
            actor_role="admin",
            action="seed_initialized",
            entity_type="system",
            entity_id=None,
            metadata={"appointments": len(self.appointments), "slots": len(self.slots)},
        )


store = InMemoryStore()
