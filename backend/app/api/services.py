"""Services API router — monitored services registry."""
import logging
from fastapi import APIRouter, Depends
from typing import List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.service import Service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/services", response_model=List[Dict[str, Any]])
async def list_services(db: AsyncSession = Depends(get_db)):
    """List all monitored services."""
    try:
        result = await db.execute(select(Service).order_by(Service.name))
        services = result.scalars().all()
        return [
            {
                "id": str(svc.id),
                "name": svc.name,
                "description": svc.description,
            }
            for svc in services
        ]
    except Exception as exc:
        logger.error(f"list_services failed: {exc}")
        return []
