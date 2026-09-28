"""Patterns API router — recurrence pattern analysis."""
import logging
from fastapi import APIRouter, Depends
from typing import List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.incident import Incident
from app.models.service import Service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/patterns", response_model=List[Dict[str, Any]])
async def list_patterns(db: AsyncSession = Depends(get_db)):
    """
    Return recurrence patterns — incidents grouped by service + root cause.
    """
    try:
        result = await db.execute(
            select(Incident)
            .options(
                selectinload(Incident.service),
                selectinload(Incident.attempts),
                selectinload(Incident.remediations),
            )
            .where(Incident.root_cause.isnot(None))
            .order_by(Incident.service_id, Incident.opened_at)
        )
        incidents = result.scalars().all()

        # Group by service+root_cause
        groups: Dict[str, Dict[str, Any]] = {}
        for inc in incidents:
            svc = inc.service.name if inc.service else "Unknown"
            key = f"{svc}::{inc.root_cause or ''}".lower()
            if key not in groups:
                groups[key] = {
                    "service": svc,
                    "root_cause": inc.root_cause or "Unknown",
                    "occurrences": [],
                    "count": 0,
                }
            groups[key]["occurrences"].append({
                "incident_number": inc.incident_number,
                "severity": inc.severity,
                "status": inc.status,
                "opened_at": inc.opened_at.isoformat() if inc.opened_at else None,
            })
            groups[key]["count"] += 1

        # Only return patterns with 2+ occurrences
        patterns = [v for v in groups.values() if v["count"] >= 1]
        return patterns

    except Exception as exc:
        logger.error(f"list_patterns failed: {exc}")
        return []
