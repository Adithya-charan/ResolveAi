"""
Seed script — creates deterministic demo data:
  - INC-421: Payment Service historical incident (resolved + remediated + verified)
  - INC-482: Payment Service current incident (open/investigating)

Then retains INC-421 knowledge in Hindsight memory.

Run this once after `alembic upgrade head`:
  python seed.py
"""
import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from app.core.database import AsyncSessionLocal
from app.models.service import Service
from app.models.incident import Incident, IncidentStatus, IncidentSeverity
from app.models.incident_attempt import IncidentAttempt, AttemptOutcome
from app.models.incident_resolution import IncidentResolution, ResolutionOutcome
from app.models.remediation import Remediation, RemediationStatus
from app.models.verification_event import VerificationEvent, VerificationStatus
from app.services.hindsight_service import HindsightService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

NOW = datetime.utcnow()
SIX_MONTHS_AGO = NOW - timedelta(days=183)


async def seed():
    logger.info("Starting seed...")
    async with AsyncSessionLocal() as db:
        # ── Service ──────────────────────────────────────────────────────────
        from sqlalchemy import select
        result = await db.execute(
            select(Service).where(Service.name == "Payment Service")
        )
        svc = result.scalar_one_or_none()
        if not svc:
            svc = Service(
                name="Payment Service",
                description="Core payment processing and checkout service",
            )
            db.add(svc)
            await db.flush()
            logger.info("Created service: Payment Service")
        else:
            logger.info("Service already exists: Payment Service")

        # ── Additional services ───────────────────────────────────────────────
        for svc_name, svc_desc in [
            ("Auth Service", "Authentication and authorization service"),
            ("API Gateway", "Central API gateway and load balancer"),
            ("Notification Service", "Email and push notification delivery"),
            ("Database Cluster", "Primary PostgreSQL cluster"),
        ]:
            r = await db.execute(select(Service).where(Service.name == svc_name))
            if not r.scalar_one_or_none():
                db.add(Service(name=svc_name, description=svc_desc))
                logger.info(f"Created service: {svc_name}")

        await db.flush()

        # ── INC-421 ── Historical resolved incident ──────────────────────────
        r421 = await db.execute(
            select(Incident).where(Incident.incident_number == "INC-421")
        )
        inc421 = r421.scalar_one_or_none()

        if not inc421:
            inc421 = Incident(
                incident_number="INC-421",
                title="503 errors on Checkout API — Connection pool saturation",
                description=(
                    "503 errors began appearing on the Checkout API at 09:47, escalating to 38% "
                    "error rate within 15 minutes. Database connection pool reached 100% saturation. "
                    "Symptoms included connection timeouts and intermittent failures on payment processing."
                ),
                severity=IncidentSeverity.critical,
                status=IncidentStatus.closed,
                root_cause=(
                    "Database connection pool exhaustion caused by a connection leak "
                    "introduced in release v2.4.1. The payment state machine was not properly "
                    "releasing connections on transaction rollback, causing pool saturation over time."
                ),
                opened_at=SIX_MONTHS_AGO,
                resolved_at=SIX_MONTHS_AGO + timedelta(hours=3),
                service_id=svc.id,
            )
            db.add(inc421)
            await db.flush()

            # Attempts for INC-421
            db.add(IncidentAttempt(
                incident_id=inc421.id,
                description="Restart payment service pods",
                outcome=AttemptOutcome.failed,
                detail="Service restarted but connections re-saturated within 2 minutes due to the leak still being present.",
                timestamp=SIX_MONTHS_AGO + timedelta(minutes=20),
            ))
            db.add(IncidentAttempt(
                incident_id=inc421.id,
                description="Increase connection timeout threshold",
                outcome=AttemptOutcome.partial,
                detail="Latency decreased slightly but error rate remained high. Not a viable fix.",
                timestamp=SIX_MONTHS_AGO + timedelta(minutes=45),
            ))
            db.add(IncidentAttempt(
                incident_id=inc421.id,
                description="Rollback to v2.4.0 (prior release)",
                outcome=AttemptOutcome.success,
                detail="Service restored to healthy state. Error rate dropped to 0% within 3 minutes of rollback.",
                timestamp=SIX_MONTHS_AGO + timedelta(hours=1, minutes=30),
            ))

            # Resolution
            db.add(IncidentResolution(
                incident_id=inc421.id,
                description=(
                    "Rolled back payment service to v2.4.0. Root cause identified as connection leak "
                    "in v2.4.1 payment state machine. Permanent fix applied via PR #8821."
                ),
                outcome=ResolutionOutcome.succeeded,
                timestamp=SIX_MONTHS_AGO + timedelta(hours=3),
            ))

            # Permanent remediation
            db.add(Remediation(
                incident_id=inc421.id,
                action="Connection-pool monitoring agent + configuration correction (PR #8821)",
                detail=(
                    "Implemented connection pool monitoring with automatic alerting at 80% utilization. "
                    "Fixed the transaction rollback path in the payment state machine to properly "
                    "release connections. Added circuit breaker for DB connection failures."
                ),
                implemented_at=SIX_MONTHS_AGO + timedelta(days=3),
                status=RemediationStatus.verified,
            ))

            # Verification events
            for label, days_after, desc in [
                ("Day 1", 1, "Post-remediation check — service healthy, error rate < 0.1%"),
                ("Day 30", 30, "30-day stability check — sustained healthy operation"),
                ("Day 90", 90, "90-day verification — no recurrence observed"),
                ("Day 147", 147, "147-day verification — sustained healthy operation"),
            ]:
                db.add(VerificationEvent(
                    incident_id=inc421.id,
                    label=label,
                    description=desc,
                    status=VerificationStatus.healthy,
                    timestamp=SIX_MONTHS_AGO + timedelta(days=days_after),
                ))

            logger.info("Created INC-421 with full resolution history")
        else:
            logger.info("INC-421 already exists — skipping")

        # ── INC-482 ── Current open incident ──────────────────────────────────
        r482 = await db.execute(
            select(Incident).where(Incident.incident_number == "INC-482")
        )
        inc482 = r482.scalar_one_or_none()

        if not inc482:
            inc482 = Incident(
                incident_number="INC-482",
                title="503 errors ↑42% on Checkout API",
                description=(
                    "503 errors began at 14:32 on the Checkout API. Error rate escalated from "
                    "0.8% to 42.4% within 18 minutes. Database connection pool at 100% saturation. "
                    "P99 latency breaching SLO at 4.2s. Payment transactions failing intermittently."
                ),
                severity=IncidentSeverity.critical,
                status=IncidentStatus.investigating,
                root_cause=None,  # Under investigation
                opened_at=NOW - timedelta(hours=1),
                service_id=svc.id,
            )
            db.add(inc482)
            logger.info("Created INC-482 (current open incident)")
        else:
            logger.info("INC-482 already exists — skipping")

        await db.commit()
        logger.info("Database seed complete.")

    # ── Retain INC-421 knowledge in Hindsight ──────────────────────────────
    logger.info("Retaining INC-421 knowledge in Hindsight...")
    hindsight = HindsightService()

    retain_result = await hindsight.retain_incident(
        incident_number="INC-421",
        service="Payment Service",
        title="503 errors on Checkout API — Connection pool saturation",
        root_cause=(
            "Database connection pool exhaustion caused by a connection leak "
            "in the payment state machine (v2.4.1 regression). The transaction rollback "
            "path did not properly release connections, causing gradual pool saturation."
        ),
        attempts=[
            {
                "description": "Restart payment service pods",
                "outcome": "failed",
                "detail": "Connections re-saturated within 2 minutes — leak still present",
            },
            {
                "description": "Increase connection timeout threshold",
                "outcome": "partial",
                "detail": "Latency decreased slightly, error rate remained high",
            },
            {
                "description": "Rollback to v2.4.0",
                "outcome": "success",
                "detail": "Service restored to healthy state within 3 minutes",
            },
        ],
        resolution_summary=(
            "Successfully rolled back to v2.4.0. Service restored within 3 minutes. "
            "The connection leak in the payment state machine was the confirmed root cause."
        ),
        remediation=(
            "Implemented connection-pool monitoring agent with 80% utilization alerts. "
            "Fixed transaction rollback path in payment state machine (PR #8821). "
            "Added circuit breaker for DB connection failures."
        ),
        verification_summary=(
            "Day 1: healthy. Day 30: healthy. Day 90: healthy. Day 147: healthy. "
            "147 days of sustained healthy operation after remediation."
        ),
        recurrence_note=(
            "Similar symptoms (503 errors, connection pool saturation on Payment Service) "
            "should immediately trigger investigation of connection pool utilization and "
            "any recent payment service releases. Rollback is an effective interim fix."
        ),
    )
    logger.info(f"Hindsight retain result: {retain_result.get('status')}")

    if retain_result.get("status") == "retained":
        logger.info("✅ Hindsight retain succeeded — INC-421 knowledge stored in organizational memory")
    elif retain_result.get("status") == "skipped":
        logger.warning("⚠️  Hindsight retain skipped — HINDSIGHT_API_KEY not configured")
    else:
        logger.error(f"❌ Hindsight retain failed: {retain_result.get('error')}")

    logger.info("Seed complete. Ready for demo.")


if __name__ == "__main__":
    asyncio.run(seed())
