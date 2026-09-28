"""Pydantic schemas for Incident resources."""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any, Dict
from uuid import UUID
from datetime import datetime


class AttemptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    description: str
    outcome: str
    detail: Optional[str] = None
    timestamp: datetime


class ResolutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    description: str
    outcome: str
    timestamp: datetime


class RemediationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    action: str
    detail: Optional[str] = None
    status: str
    implemented_at: Optional[datetime] = None


class VerificationEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    label: str
    description: Optional[str] = None
    status: str
    timestamp: datetime


class ServiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    description: Optional[str] = None


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    incident_number: str
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    root_cause: Optional[str] = None
    opened_at: datetime
    resolved_at: Optional[datetime] = None
    service: Optional[ServiceRead] = None
    attempts: List[AttemptRead] = []
    resolutions: List[ResolutionRead] = []
    remediations: List[RemediationRead] = []
    verification_events: List[VerificationEventRead] = []


class IncidentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    incident_number: str
    title: str
    severity: str
    status: str
    opened_at: datetime
    service: Optional[ServiceRead] = None


class IncidentAnalyzeRequest(BaseModel):
    incident_number: str = Field(..., description="Incident number e.g. INC-482")
    title: str
    description: Optional[str] = None
    severity: str
    service_name: str


class HistoricalMatch(BaseModel):
    incident_number: str
    title: str
    service: str
    similarity_evidence: str  # Honest description, not a fabricated % unless Hindsight provides one
    root_cause: Optional[str] = None
    resolution_summary: Optional[str] = None
    attempts: List[Dict[str, Any]] = []
    remediation: Optional[str] = None
    verification_summary: Optional[str] = None


class IncidentAnalysisResponse(BaseModel):
    incident_number: str
    service: str
    severity: str
    title: str
    symptoms: List[str]
    historical_matches: List[HistoricalMatch]
    root_cause_hypotheses: List[str]
    recommended_next_action: str
    recurrence_status: str
    memory_status: str  # "available" | "unavailable" | "degraded"
    analysis_status: str  # "complete" | "unavailable" | "partial"
    analysis_reasoning: Optional[str] = None
    raw_memory_count: int = 0
