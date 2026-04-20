# Backend OFS - MediPlan

This backend is a FastAPI starter aligned with project priorities:

- POST /appointments
- PATCH /appointments/{id}/cancel
- POST /waitlist/{siteId}/enqueue
- GET /dashboard/kpi
- POST /risk-score/recompute/{appointmentId}

## Run locally

1. Create and activate a Python virtual environment.
2. Install dependencies.
3. Start the API server.

```bash
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Open:

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Notes

- Data is in-memory (seeded at startup).
- Role-based access is simulated via header: `x-role`.
- Default role when header is missing: `admin`.

Example headers:

- `x-role: admin`
- `x-role: secretaire`
- `x-role: client`

## Next step to productionize

- Replace in-memory store with PostgreSQL repositories.
- Add auth (Keycloak/JWT) and site-scoped RBAC.
- Add integration tests and background jobs for reminders.
- Add idempotency and transactional guarantees around booking/cancel flow.
