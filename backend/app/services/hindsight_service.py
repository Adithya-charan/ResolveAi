"""
HindsightService — real integration with Hindsight Cloud.

Uses the official hindsight-client library (hindsight_client.Hindsight).
All Hindsight calls go through this service layer — never scatter them across API routes.
"""
import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_client():
    """Build a Hindsight client instance."""
    try:
        from hindsight_client import Hindsight  # type: ignore
        return Hindsight(
            base_url=settings.HINDSIGHT_BASE_URL,
            api_key=settings.HINDSIGHT_API_KEY,
        )
    except ImportError:
        logger.warning("hindsight_client not installed — using HTTP fallback")
        return None


class HindsightService:
    """Service abstraction over Hindsight Cloud memory bank."""

    def __init__(self):
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self.api_key = settings.HINDSIGHT_API_KEY
        self.base_url = settings.HINDSIGHT_BASE_URL.rstrip("/")

    def _is_configured(self) -> bool:
        return bool(self.api_key) and bool(self.bank_id)

    async def retain_incident(
        self,
        incident_number: str,
        service: str,
        title: str,
        root_cause: str,
        attempts: List[Dict[str, Any]],
        resolution_summary: str,
        remediation: str,
        verification_summary: str,
        recurrence_note: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retain a completed incident's knowledge in Hindsight memory.
        Returns the retain result dict.
        """
        if not self._is_configured():
            logger.warning("Hindsight not configured — skipping retain")
            return {"status": "skipped", "reason": "Hindsight not configured"}

        attempts_text = "\n".join(
            f"  - {a.get('description', '')} → Outcome: {a.get('outcome', '')}. {a.get('detail', '')}"
            for a in attempts
        )

        memory_content = f"""Incident: {incident_number}
Service: {service}
Title: {title}

Root Cause:
{root_cause}

Resolution Attempts:
{attempts_text}

Final Resolution:
{resolution_summary}

Permanent Remediation:
{remediation}

Verification History:
{verification_summary}
"""
        if recurrence_note:
            memory_content += f"\nRecurrence Note:\n{recurrence_note}"

        metadata = {
            "incident_number": incident_number,
            "service": service,
            "type": "incident_resolution",
        }

        try:
            client = _get_client()
            if client:
                result = await client.aretain(
                    bank_id=self.bank_id,
                    content=memory_content,
                    metadata=metadata,
                )
                logger.info(f"Hindsight retain succeeded for {incident_number}: {result}")
                return {"status": "retained", "result": str(result)}

            # HTTP fallback
            import httpx
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=30.0) as hclient:
                resp = await hclient.post(
                    f"{self.base_url}/v1/banks/{self.bank_id}/memories",
                    headers=headers,
                    json={"content": memory_content, "metadata": metadata},
                )
                resp.raise_for_status()
                return {"status": "retained", "result": resp.json()}

        except Exception as exc:
            logger.error(f"Hindsight retain failed for {incident_number}: {exc}")
            return {"status": "failed", "error": str(exc)}

    async def recall_similar_incidents(
        self, query: str, top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Recall memories from Hindsight relevant to the query.
        Returns actual Hindsight results or empty list on failure.
        """
        if not self._is_configured():
            logger.warning("Hindsight not configured — cannot recall")
            return []

        try:
            client = _get_client()
            if client:
                result = await client.arecall(
                    bank_id=self.bank_id,
                    query=query,
                    max_tokens=4096,
                    budget="mid",
                )
                # RecallResponse has a list of RecallResult objects
                memories = []
                try:
                    # Try iterating directly
                    for item in result:
                        if hasattr(item, "content"):
                            memories.append({"content": item.content, "score": getattr(item, "score", None)})
                        elif hasattr(item, "text"):
                            memories.append({"content": item.text, "score": getattr(item, "score", None)})
                        else:
                            memories.append({"content": str(item)})
                except TypeError:
                    # result might be a single object
                    if hasattr(result, "results"):
                        for item in result.results:
                            memories.append({
                                "content": getattr(item, "content", getattr(item, "text", str(item))),
                                "score": getattr(item, "score", None),
                            })
                    elif hasattr(result, "content"):
                        memories.append({"content": result.content})
                    else:
                        # Convert to prompt string if available
                        if hasattr(result, "to_prompt_string"):
                            memories.append({"content": result.to_prompt_string()})
                        else:
                            memories.append({"content": str(result)})

                logger.info(f"Hindsight recall returned {len(memories)} results for: {query[:60]}")
                return memories

            # HTTP fallback
            import httpx
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=30.0) as hclient:
                resp = await hclient.post(
                    f"{self.base_url}/v1/banks/{self.bank_id}/recall",
                    headers=headers,
                    json={"query": query, "max_tokens": 4096},
                )
                resp.raise_for_status()
                data = resp.json()
                memories = data.get("results", data.get("memories", []))
                return memories

        except Exception as exc:
            logger.error(f"Hindsight recall failed: {exc}")
            return []

    async def recall_resolution_history(self, service: str) -> List[Dict[str, Any]]:
        """Recall resolution memories for a specific service."""
        return await self.recall_similar_incidents(
            f"resolution history for {service} service incidents", top_k=5
        )

    async def recall_remediation_history(self, service: str) -> List[Dict[str, Any]]:
        """Recall remediation memories for a specific service."""
        return await self.recall_similar_incidents(
            f"permanent remediation for {service} service", top_k=3
        )

    async def recall_recurrence_patterns(
        self, incident_title: str, service: str
    ) -> List[Dict[str, Any]]:
        """Recall recurrence pattern memories for a service/symptom combination."""
        return await self.recall_similar_incidents(
            f"recurrence pattern {service} {incident_title}", top_k=3
        )
