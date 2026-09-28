"""Memory and Copilot API router."""
import logging
from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.memory import CopilotRequest, CopilotResponse
from app.services.incident_service import IncidentService
from app.services.hindsight_service import HindsightService
from app.services.llm_provider import LLMProvider

logger = logging.getLogger(__name__)
router = APIRouter()


def get_service(db: AsyncSession = Depends(get_db)) -> IncidentService:
    return IncidentService(db)


@router.post("/copilot", response_model=CopilotResponse)
async def copilot_answer(
    payload: CopilotRequest,
    service: IncidentService = Depends(get_service),
):
    """
    Contextual Copilot — answers questions grounded in:
    - Current incident context from PostgreSQL
    - Hindsight organizational memory
    - Groq/Qwen3-32B reasoning
    """
    try:
        # Load incident context
        incident_data = await service.get_incident(payload.incident_number)
        if incident_data:
            ctx = {
                "title": incident_data.title,
                "service": incident_data.service.name if incident_data.service else "",
                "severity": incident_data.severity,
                "status": incident_data.status,
                "root_cause": incident_data.root_cause or "",
            }
        else:
            ctx = payload.context or {}

        # Recall Hindsight memory relevant to the question
        hindsight = HindsightService()
        recall_query = f"{payload.question} {payload.incident_number} {ctx.get('service', '')}"
        memories = await hindsight.recall_similar_incidents(recall_query, top_k=3)

        # LLM answer
        llm = LLMProvider()
        result = llm.answer_copilot(
            question=payload.question,
            incident_number=payload.incident_number,
            incident_context=ctx,
            hindsight_memories=memories,
        )

        return CopilotResponse(
            answer=result.get("answer", "Unable to generate answer."),
            sources=result.get("sources", []),
            memory_used=result.get("memory_used", False),
            analysis_status=result.get("status", "complete"),
        )

    except Exception as exc:
        logger.error(f"Copilot failed for {payload.incident_number}: {exc}")
        return CopilotResponse(
            answer="AI analysis is currently unavailable. Please consult historical records directly.",
            sources=[],
            memory_used=False,
            analysis_status="unavailable",
        )
