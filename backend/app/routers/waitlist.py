from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import require_roles
from app.schemas import Role, WaitlistEnqueueRequest, WaitlistEnqueueResponse, WaitlistEntryRecord
from app.store import store

router = APIRouter()


@router.post(
    "/waitlist/{site_id}/enqueue",
    response_model=WaitlistEnqueueResponse,
    status_code=status.HTTP_201_CREATED,
)
def enqueue_waitlist(
    site_id: UUID,
    payload: WaitlistEnqueueRequest,
    actor_role: Role = Depends(require_roles("admin", "secretaire", "client")),
) -> WaitlistEnqueueResponse:
    with store.lock:
        site = store.sites.get(site_id)
        if site is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

        patient = store.patients.get(payload.patient_id)
        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

        if payload.preferred_practitioner_id and payload.preferred_practitioner_id not in store.practitioners:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preferred practitioner not found",
            )

        entry = WaitlistEntryRecord(
            id=uuid4(),
            site_id=site.id,
            patient_id=patient.id,
            service_id=payload.service_id,
            preferred_practitioner_id=payload.preferred_practitioner_id,
            earliest_time=payload.earliest_time,
            latest_time=payload.latest_time,
            priority=payload.priority,
            status="active",
            created_at=datetime.now(timezone.utc),
            offered_slot_id=None,
            offered_expires_at=None,
        )
        store.waitlist_entries[entry.id] = entry

        store.add_audit(
            actor_role=actor_role,
            action="waitlist_enqueued",
            entity_type="waitlist",
            entity_id=entry.id,
            metadata={
                "site_id": str(site.id),
                "patient_id": str(patient.id),
                "priority": entry.priority,
            },
        )

        return WaitlistEnqueueResponse(entry=entry)
