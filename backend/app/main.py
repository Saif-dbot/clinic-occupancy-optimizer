from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.appointments import router as appointments_router
from app.routers.dashboard import router as dashboard_router
from app.routers.risk import router as risk_router
from app.routers.waitlist import router as waitlist_router

app = FastAPI(
    title="MediPlan Backend API",
    version="0.1.0",
    description=(
        "Backend OFS for appointment management, no-show reduction, waitlist reallocation, and KPI reporting."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appointments_router, tags=["appointments"])
app.include_router(waitlist_router, tags=["waitlist"])
app.include_router(dashboard_router, tags=["dashboard"])
app.include_router(risk_router, tags=["risk-score"])


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "mediplan-backend",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
