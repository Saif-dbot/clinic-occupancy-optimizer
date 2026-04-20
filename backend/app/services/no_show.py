from __future__ import annotations

from datetime import datetime, timezone

from app.schemas import ConfirmationChannel, NoShowFactor, PatientProfile, RiskLevel


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def get_risk_level(score: float) -> RiskLevel:
    if score >= 70:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def reminder_actions_for_score(score: float) -> list[str]:
    if score >= 70:
        return [
            "priority_reminder",
            "secretary_call",
            "assign_backup_candidate",
        ]
    if score >= 40:
        return [
            "reminder_j_minus_2",
            "reminder_j_minus_1",
            "active_confirmation",
        ]
    return ["reminder_j_minus_2"]


def compute_no_show_score(
    patient: PatientProfile,
    slot_start: datetime,
    confirmation_channel: ConfirmationChannel = "none",
) -> tuple[float, RiskLevel, list[NoShowFactor]]:
    now = datetime.now(timezone.utc)
    days_until = max((slot_start - now).days, 0)

    history_points = _clamp(patient.no_show_history * 10, 0, 40)

    if days_until <= 1:
        lead_time_points = 15
    elif days_until <= 3:
        lead_time_points = 10
    elif days_until <= 10:
        lead_time_points = 6
    else:
        lead_time_points = 3

    hour = slot_start.hour
    if hour < 10:
        slot_points = 10
    elif hour >= 17:
        slot_points = 7
    else:
        slot_points = 3

    channel_points_map: dict[ConfirmationChannel, float] = {
        "none": 10,
        "sms": 5,
        "email": 4,
        "phone": 2,
    }
    channel_points = channel_points_map[confirmation_channel]

    if patient.last_visit_at is None:
        visit_points = 10
    else:
        days_since_visit = max((now - patient.last_visit_at).days, 0)
        if days_since_visit <= 30:
            visit_points = 1
        elif days_since_visit <= 120:
            visit_points = 4
        elif days_since_visit <= 240:
            visit_points = 7
        else:
            visit_points = 10

    # Light static bias for site/specialty in v0 before model tuning.
    site_specialty_points = 5

    factors = [
        NoShowFactor(
            factor="historique_absences_patient",
            points=float(history_points),
            rationale=f"Historique de {patient.no_show_history} absence(s)",
        ),
        NoShowFactor(
            factor="delai_prise_rdv",
            points=float(lead_time_points),
            rationale=f"Delai avant rendez-vous: {days_until} jour(s)",
        ),
        NoShowFactor(
            factor="type_creneau",
            points=float(slot_points),
            rationale=f"Creneau a {slot_start.strftime('%H:%M')}",
        ),
        NoShowFactor(
            factor="canal_confirmation",
            points=float(channel_points),
            rationale=f"Canal de confirmation: {confirmation_channel}",
        ),
        NoShowFactor(
            factor="delai_depuis_derniere_visite",
            points=float(visit_points),
            rationale="Recence de la derniere visite",
        ),
        NoShowFactor(
            factor="specialite_site",
            points=float(site_specialty_points),
            rationale="Facteur contextuel site/specialite v0",
        ),
    ]

    score = _clamp(sum(factor.points for factor in factors), 0, 100)
    risk_level = get_risk_level(score)

    return float(round(score, 2)), risk_level, factors
