# Matrice KPI - Projet No-Show

## Objectif
Suivre des indicateurs actionnables qui prouvent la valeur metier de la plateforme.

| KPI | Formule | Baseline initiale | Cible pilote (8-12 sem.) | Source | Frequence | Owner |
|---|---|---:|---:|---|---|---|
| No-show rate | rdv_non_honores / rdv_confirmes | 18% | <= 14% | appointments | Hebdo | Ops manager |
| Occupancy rate | creneaux_reserves / creneaux_ouverts | 72% | >= 82% | appointment_slots | Quotidien | Responsable site |
| Recovered slots rate | creneaux_reaffectes / creneaux_annules | 10% | >= 35% | waitlist + appointments | Hebdo | Secretaire lead |
| Booking lead time | moyenne(jours entre reservation et rdv) | 9 jours | 6 jours | appointments | Hebdo | Ops manager |
| Reminder delivery rate | rappels_livres / rappels_envoyes | 85% | >= 97% | reminder_messages | Quotidien | Tech ops |
| High-risk confirmation rate | confirmations_risque_haut / rdv_risque_haut | 40% | >= 70% | no_show_scores + events | Hebdo | Secretaire lead |
| Slot refill time | delai moyen entre annulation et nouveau booking | 38 h | <= 12 h | appointments | Hebdo | Responsable site |
| Revenue per practitioner day | CA_journalier / nb_praticiens_actifs | A definir | +8% vs baseline | BI finance | Hebdo | Finance |

## Notes de mesure
- Une baseline doit etre mesuree sur 4 semaines avant de figer la cible finale.
- Les KPI doivent etre ventiles par site, specialite et plage horaire.
- Tout KPI doit avoir un seuil d alerte et un plan d action associe.

## Seuils d alerte proposes
- No-show rate > 20% (alerte rouge).
- Occupancy rate < 70% pendant 5 jours consecutifs.
- Reminder delivery rate < 95% sur 24h.
- Slot refill time > 24h sur une semaine glissante.
