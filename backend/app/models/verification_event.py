"""VerificationEvent — tracks post-resolution health checks."""
from sqlalchemy import Column, String, Text, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.core.database import Base


class VerificationStatus(str, PyEnum):
    healthy = "healthy"
    degraded = "degraded"
    failed = "failed"
    pending = "pending"


class VerificationEvent(Base):
    __tablename__ = "verification_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)
    label = Column(String(128), nullable=False)   # e.g. "Day 1", "Day 30"
    description = Column(Text, nullable=True)
    status = Column(SAEnum(VerificationStatus), nullable=False, default=VerificationStatus.pending)
    timestamp = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="verification_events")
