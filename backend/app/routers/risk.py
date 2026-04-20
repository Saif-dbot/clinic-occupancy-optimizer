from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import require_roles
from app.schemas import NoShowScoreRecord, NoShowScoreSnapshot, RiskRecomputeRequest, RiskRecomputeResponse, Role
from app.services.no_show import compute_no_show_score, reminder_actions_for_score
from app.store import store

router = APIRouter()


@router.post("/risk-score/recompute/{appointment_id}", response_model=RiskRecomputeResponse)
def recompute_risk_score(
    appointment_id: UUID,
    payload: RiskRecomputeRequest,
    actor_role: Role = Depends(require_roles("admin", "secretaire")),
) -> RiskRecomputeResponse:
    with store.lock:
        appointment = store.appointments.get(appointment_id)
        if appointment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

        slot = store.slots.get(appointment.slot_id)
        if slot is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment slot not found")

        patient = store.patients.get(appointment.patient_id)
        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

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

        store.add_audit(
            actor_role=actor_role,
            action="risk_score_recomputed",
            entity_type="appointment",
            entity_id=appointment.id,
            metadata={
                "score": score,
                "risk_level": risk_level,
                "confirmation_channel": payload.confirmation_channel,
            },
        )

        return RiskRecomputeResponse(
            appointment_id=appointment.id,
            no_show=NoShowScoreSnapshot(
                score=score_record.score,
                risk_level=score_record.risk_level,
                model_version=score_record.model_version,
                factors=score_record.factors,
                created_at=score_record.created_at,
            ),
            reminder_actions=reminder_actions,
        )
