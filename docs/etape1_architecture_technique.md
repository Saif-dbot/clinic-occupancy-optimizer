# Architecture technique V1

## 1) Choix de stack (recommande)
- Frontend: Next.js + TypeScript + Tailwind CSS.
- Backend: FastAPI (Python).
- Database: PostgreSQL.
- Queue/Cache: Redis.
- Jobs async: Celery.
- Notifications: Twilio (SMS) + SendGrid (email).
- Observabilite: Prometheus + Grafana + Sentry.
- IAM: Keycloak (RBAC).

## 2) Macro architecture
1. Portail web (patient + secretaire + admin).
2. API gateway (authentification + rate limiting).
3. Service rendez-vous (agenda, slot, booking, annulation).
4. Service no-show (scoring + actions automatiques).
5. Service notifications (templates, envoi, retry).
6. Service reporting (KPI + exports).
7. PostgreSQL + Redis + stockage logs.

## 3) Flux clefs
### Flux reservation
- Requete creation rendez-vous.
- Verrouillage transactionnel du slot.
- Creation rendez-vous + evenement audit.
- Planification rappels.

### Flux annulation
- Annulation rendez-vous.
- Liberation slot.
- Selection patient liste attente.
- Envoi proposition avec expiration.

### Flux scoring no-show
- Trigger a la creation/modification rendez-vous.
- Calcul score et persistance historique.
- Si score >= seuil: creation taches de rappel renforce.

## 4) Exigences non fonctionnelles
- SLO disponibilite: 99.5%.
- P95 API read: < 300 ms.
- P95 API write: < 500 ms.
- RPO: 15 min, RTO: 60 min.

## 5) Securite
- RBAC strict par role et par site.
- Chiffrement TLS obligatoire.
- Chiffrement des donnees sensibles au repos.
- Journal d audit non modifiable pour actions critiques.

## 6) Strategie de deploiement
- Environnements: dev, staging, prod.
- CI/CD: tests unitaires + tests integration + migration DB.
- Feature flags pour activer progressivement les regles no-show.

## 7) APIs prioritaires S3-S5
- POST /appointments
- PATCH /appointments/{id}/cancel
- POST /waitlist/{siteId}/enqueue
- GET /dashboard/kpi
- POST /risk-score/recompute/{appointmentId}
