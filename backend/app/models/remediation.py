"""Remediation — permanent fix actions for an incident."""
from sqlalchemy import Column, String, Text, DateTime, Enum as SAEnum, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.core.database import Base


class RemediationStatus(str, PyEnum):
    pending = "pending"
    completed = "completed"
    verified = "verified"


class Remediation(Base):
    __tablename__ = "remediations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)
    action = Column(Text, nullable=False)
    detail = Column(Text, nullable=True)
    implemented_at = Column(DateTime, nullable=True)
    status = Column(SAEnum(RemediationStatus), nullable=False, default=RemediationStatus.pending)

    incident = relationship("Incident", back_populates="remediations")
