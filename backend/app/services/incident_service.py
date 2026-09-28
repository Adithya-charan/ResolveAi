"""
IncidentService — real database operations using SQLAlchemy async.

All DB access goes through this service layer. Never query the DB from API routes directly.
"""
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.models.incident import Incident, IncidentStatus, IncidentSeverity
from app.models.service import Service
from app.models.incident_attempt import IncidentAttempt
from app.models.incident_resolution import IncidentResolution
from app.models.remediation import Remediation
from app.models.verification_event import VerificationEvent
from app.schemas.incident import (
    IncidentRead, IncidentListItem, IncidentAnalyzeRequest,
    IncidentAnalysisResponse, HistoricalMatch
)
from app.services.hindsight_service import HindsightService
from app.services.llm_provider import LLMProvider

logger = logging.getLogger(__name__)


def _incident_to_dict(inc: Incident) -> Dict[str, Any]:
    """Convert ORM incident to plain dict for LLM context."""
    return {
        "incident_number": inc.incident_number,
        "title": inc.title,
        "service": inc.service.name if inc.service else "",
        "severity": inc.severity,
        "status": inc.status,
        "root_cause": inc.root_cause,
        "attempts": [
            {"description": a.description, "outcome": a.outcome, "detail": a.detail}
            for a in (inc.attempts or [])
        ],
        "resolutions": [
            {"description": r.description, "outcome": r.outcome}
            for r in (inc.resolutions or [])
        ],
        "remediations": [
            {"action": r.action, "detail": r.detail, "status": r.status}
            for r in (inc.remediations or [])
        ],
        "verification_events": [
            {"label": v.label, "status": v.status, "description": v.description}
            for v in (inc.verification_events or [])
        ],
    }


class IncidentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.hindsight = HindsightService()
        self.llm = LLMProvider()

    async def list_incidents(self) -> List[IncidentListItem]:
        result = await self.db.execute(
            select(Incident)
            .options(selectinload(Incident.service))
            .order_by(desc(Incident.opened_at))
            .limit(50)
        )
        incidents = result.scalars().all()
        return [IncidentListItem.model_validate(inc) for inc in incidents]

    async def get_incident(self, incident_number: str) -> Optional[IncidentRead]:
        result = await self.db.execute(
            select(Incident)
            .options(
                selectinload(Incident.service),
                selectinload(Incident.attempts),
                selectinload(Incident.resolutions),
                selectinload(Incident.remediations),
                selectinload(Incident.verification_events),
            )
            .where(Incident.incident_number == incident_number)
        )
        inc = result.scalar_one_or_none()
        if not inc:
            return None
        return IncidentRead.model_validate(inc)

    async def list_resolved_incidents_for_service(
        self, service_name: str
    ) -> List[Dict[str, Any]]:
        """Load resolved incidents for a service (used as DB history for LLM)."""
        result = await self.db.execute(
            select(Incident)
            .join(Service)
            .options(
                selectinload(Incident.service),
                selectinload(Incident.attempts),
                selectinload(Incident.resolutions),
                selectinload(Incident.remediations),
                selectinload(Incident.verification_events),
            )
            .where(Service.name == service_name)
            .where(Incident.status.in_(["resolved", "closed"]))
            .order_by(desc(Incident.opened_at))
            .limit(10)
        )
        incidents = result.scalars().all()
        return [_incident_to_dict(inc) for inc in incidents]

    async def analyze_incident(
        self, payload: IncidentAnalyzeRequest
    ) -> IncidentAnalysisResponse:
        """
        Full incident analysis pipeline:
        1. Load structured DB history
        2. Recall Hindsight memories
        3. Combine evidence
        4. LLM reasoning
        5. Return structured response
        """
        memory_status = "available"

        # 1. Load DB history
        db_history = await self.list_resolved_incidents_for_service(payload.service_name)
        logger.info(
            f"Loaded {len(db_history)} historical incidents from DB for {payload.service_name}"
        )

        # 2. Recall Hindsight memories
        recall_query = (
            f"{payload.severity} {payload.service_name} {payload.title} {payload.description or ''}"
        )
        hindsight_memories = await self.hindsight.recall_similar_incidents(
            recall_query, top_k=5
        )
        logger.info(
            f"Recalled {len(hindsight_memories)} memories from Hindsight for {payload.incident_number}"
        )

        if not hindsight_memories and not db_history:
            memory_status = "unavailable"
        elif not hindsight_memories:
            memory_status = "degraded"

        # 3. LLM analysis
        llm_result = self.llm.analyze_incident(
            incident_number=payload.incident_number,
            title=payload.title,
            service=payload.service_name,
            severity=payload.severity,
            description=payload.description,
            hindsight_memories=hindsight_memories,
            db_history=db_history,
        )

        analysis_status = llm_result.get("status", "unavailable")

        # 4. Build historical matches from LLM result + DB verification
        historical_matches: List[HistoricalMatch] = []
        for match in llm_result.get("historical_matches", [])[:5]:
            historical_matches.append(
                HistoricalMatch(
                    incident_number=match.get("incident_number", ""),
                    title=match.get("title", match.get("incident_number", "")),
                    service=payload.service_name,
                    similarity_evidence=match.get("similarity_evidence", ""),
                    root_cause=match.get("root_cause"),
                    resolution_summary=match.get("resolution_summary"),
                    remediation=match.get("remediation"),
                )
            )

        # Also cross-reference DB history for attempt details
        for match in historical_matches:
            for db_inc in db_history:
                if db_inc.get("incident_number") == match.incident_number:
                    match.attempts = db_inc.get("attempts", [])
                    match.verification_summary = ", ".join(
                        f"{v['label']}:{v['status']}"
                        for v in db_inc.get("verification_events", [])
                    )
                    break

        return IncidentAnalysisResponse(
            incident_number=payload.incident_number,
            service=payload.service_name,
            severity=payload.severity,
            title=payload.title,
            symptoms=llm_result.get("symptoms", [payload.title]),
            historical_matches=historical_matches,
            root_cause_hypotheses=llm_result.get(
                "root_cause_hypotheses", ["Unable to determine"]
            ),
            recommended_next_action=llm_result.get(
                "recommended_next_action", "Escalate to on-call engineer"
            ),
            recurrence_status=llm_result.get("recurrence_status", "no_history"),
            memory_status=memory_status,
            analysis_status=analysis_status,
            analysis_reasoning=llm_result.get("analysis_reasoning"),
            raw_memory_count=len(hindsight_memories),
        )

    async def get_memory(self, incident_number: str) -> Dict[str, Any]:
        """Recall Hindsight memory for a specific incident."""
        query = f"incident {incident_number} resolution root cause remediation"
        memories = await self.hindsight.recall_similar_incidents(query, top_k=5)
        return {
            "incident_id": incident_number,
            "memory_status": "available" if memories else "unavailable",
            "memories": memories,
            "raw_count": len(memories),
        }

    async def get_resolution(self, incident_number: str) -> Dict[str, Any]:
        """Get resolution data from DB for an incident."""
        result = await self.db.execute(
            select(Incident)
            .options(
                selectinload(Incident.service),
                selectinload(Incident.resolutions),
                selectinload(Incident.attempts),
            )
            .where(Incident.incident_number == incident_number)
        )
        inc = result.scalar_one_or_none()
        if not inc:
            return {"incident_number": incident_number, "resolutions": [], "attempts": []}

        return {
            "incident_number": incident_number,
            "resolutions": [
                {"description": r.description, "outcome": r.outcome}
                for r in inc.resolutions
            ],
            "attempts": [
                {"description": a.description, "outcome": a.outcome, "detail": a.detail}
                for a in inc.attempts
            ],
        }

    async def get_remediation(self, incident_number: str) -> Dict[str, Any]:
        """Get remediation data from DB for an incident."""
        result = await self.db.execute(
            select(Incident)
            .options(
                selectinload(Incident.remediations),
                selectinload(Incident.verification_events),
            )
            .where(Incident.incident_number == incident_number)
        )
        inc = result.scalar_one_or_none()
        if not inc:
            return {"incident_number": incident_number, "remediations": [], "verification_events": []}

        return {
            "incident_number": incident_number,
            "remediations": [
                {"action": r.action, "detail": r.detail, "status": r.status}
                for r in inc.remediations
            ],
            "verification_events": [
                {"label": v.label, "status": v.status, "description": v.description}
                for v in sorted(inc.verification_events, key=lambda x: x.timestamp)
            ],
        }
