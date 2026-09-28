"""Incidents API router — provides all incident endpoints."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.incident import (
    IncidentRead, IncidentListItem, IncidentAnalyzeRequest, IncidentAnalysisResponse
)
from app.services.incident_service import IncidentService

logger = logging.getLogger(__name__)
router = APIRouter()


def get_service(db: AsyncSession = Depends(get_db)) -> IncidentService:
    return IncidentService(db)


@router.get("/incidents", response_model=List[IncidentListItem])
async def list_incidents(service: IncidentService = Depends(get_service)):
    """List all incidents."""
    try:
        return await service.list_incidents()
    except Exception as exc:
        logger.error(f"list_incidents failed: {exc}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incidents")


@router.get("/incidents/{incident_id}", response_model=IncidentRead)
async def get_incident(incident_id: str, service: IncidentService = Depends(get_service)):
    """Get a single incident by incident number (e.g. INC-482)."""
    try:
        inc = await service.get_incident(incident_id)
        if not inc:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        return inc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"get_incident({incident_id}) failed: {exc}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incident")


@router.post("/incidents/analyze", response_model=IncidentAnalysisResponse)
async def analyze_incident(
    payload: IncidentAnalyzeRequest,
    service: IncidentService = Depends(get_service),
):
    """
    Full incident analysis pipeline:
    PostgreSQL history + Hindsight recall + Groq/Qwen3-32B reasoning.
    """
    try:
        return await service.analyze_incident(payload)
    except Exception as exc:
        logger.error(f"analyze_incident failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")


@router.get("/incidents/{incident_id}/memory")
async def get_incident_memory(
    incident_id: str, service: IncidentService = Depends(get_service)
):
    """Recall Hindsight memory for an incident."""
    try:
        return await service.get_memory(incident_id)
    except Exception as exc:
        logger.error(f"get_memory({incident_id}) failed: {exc}")
        return {
            "incident_id": incident_id,
            "memory_status": "unavailable",
            "message": "Historical memory could not be retrieved.",
            "memories": [],
        }


@router.get("/incidents/{incident_id}/resolution")
async def get_incident_resolution(
    incident_id: str, service: IncidentService = Depends(get_service)
):
    """Get resolution history for an incident from PostgreSQL."""
    try:
        return await service.get_resolution(incident_id)
    except Exception as exc:
        logger.error(f"get_resolution({incident_id}) failed: {exc}")
        raise HTTPException(status_code=500, detail="Failed to retrieve resolution data")


@router.get("/incidents/{incident_id}/remediation")
async def get_incident_remediation(
    incident_id: str, service: IncidentService = Depends(get_service)
):
    """Get remediation and verification history for an incident from PostgreSQL."""
    try:
        return await service.get_remediation(incident_id)
    except Exception as exc:
        logger.error(f"get_remediation({incident_id}) failed: {exc}")
        raise HTTPException(status_code=500, detail="Failed to retrieve remediation data")
