"""IncidentAttempt — a resolution attempt for an incident."""
from sqlalchemy import Column, String, Text, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.core.database import Base


class AttemptOutcome(str, PyEnum):
    failed = "failed"
    partial = "partial"
    success = "success"


class IncidentAttempt(Base):
    __tablename__ = "incident_attempts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)
    description = Column(Text, nullable=False)
    outcome = Column(SAEnum(AttemptOutcome), nullable=False)
    detail = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="attempts")
