"""Incident model — core entity for RESOLVE."""
from sqlalchemy import Column, String, Text, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.core.database import Base


class IncidentStatus(str, PyEnum):
    open = "open"
    investigating = "investigating"
    resolved = "resolved"
    closed = "closed"


class IncidentSeverity(str, PyEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_number = Column(String(20), nullable=False, unique=True)  # e.g. INC-482
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(SAEnum(IncidentSeverity), nullable=False)
    status = Column(SAEnum(IncidentStatus), nullable=False, default=IncidentStatus.open)
    root_cause = Column(Text, nullable=True)
    opened_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)

    service = relationship("Service", backref="incidents")
    attempts = relationship("IncidentAttempt", back_populates="incident", cascade="all, delete-orphan")
    resolutions = relationship("IncidentResolution", back_populates="incident", cascade="all, delete-orphan")
    remediations = relationship("Remediation", back_populates="incident", cascade="all, delete-orphan")
    verification_events = relationship("VerificationEvent", back_populates="incident", cascade="all, delete-orphan")
