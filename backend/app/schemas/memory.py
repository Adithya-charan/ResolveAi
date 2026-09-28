"""Pydantic schemas for memory and copilot endpoints."""
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from uuid import UUID


class MemoryResponse(BaseModel):
    incident_id: str
    memory_status: str  # "available" | "unavailable"
    memories: List[Dict[str, Any]] = []
    summary: Optional[str] = None
    raw_count: int = 0


class CopilotRequest(BaseModel):
    incident_number: str
    question: str
    context: Optional[Dict[str, Any]] = None


class CopilotResponse(BaseModel):
    answer: str
    sources: List[str] = []
    memory_used: bool = False
    analysis_status: str = "complete"
