"""
LLM Provider abstraction.

All LLM calls happen here. The frontend never receives API keys.
Initial provider: Groq with qwen/qwen3-32b.
Provider is replaceable via LLM_PROVIDER env var.
"""
import json
import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_groq_client():
    try:
        from groq import Groq  # type: ignore
        return Groq(api_key=settings.LLM_API_KEY)
    except ImportError:
        return None


class LLMProvider:
    """Abstraction over LLM providers. Currently Groq / qwen3-32b."""

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.model = settings.LLM_MODEL
        self._client = _build_groq_client() if self.provider == "groq" else None

    def _is_configured(self) -> bool:
        return bool(settings.LLM_API_KEY) and self._client is not None

    def _chat(self, messages: List[Dict[str, str]], temperature: float = 0.3) -> str:
        """Synchronous chat call to the configured LLM."""
        if not self._is_configured():
            raise RuntimeError("LLM not configured")

        response = self._client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=2048,
        )
        return response.choices[0].message.content

    def analyze_incident(
        self,
        incident_number: str,
        title: str,
        service: str,
        severity: str,
        description: Optional[str],
        hindsight_memories: List[Dict[str, Any]],
        db_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Analyze an incident using current evidence + Hindsight memory + DB history.
        Returns structured analysis.
        """
        if not self._is_configured():
            return {"status": "unavailable", "reason": "LLM not configured"}

        memory_context = ""
        if hindsight_memories:
            memory_context = "\n\n=== HINDSIGHT ORGANIZATIONAL MEMORY ===\n"
            for i, m in enumerate(hindsight_memories[:5], 1):
                content = m.get("content", m.get("text", str(m)))
                memory_context += f"\n[Memory {i}]:\n{content}\n"

        db_context = ""
        if db_history:
            db_context = "\n\n=== DATABASE HISTORICAL INCIDENTS ===\n"
            for inc in db_history[:5]:
                db_context += f"\nIncident: {inc.get('incident_number')} — {inc.get('title')}\n"
                db_context += f"Root Cause: {inc.get('root_cause', 'Unknown')}\n"
                if inc.get("attempts"):
                    for a in inc["attempts"]:
                        db_context += f"  Attempt: {a.get('description')} → {a.get('outcome')}\n"
                if inc.get("remediations"):
                    for r in inc["remediations"]:
                        db_context += f"  Remediation: {r.get('action')} [{r.get('status')}]\n"

        system_prompt = """You are RESOLVE, an incident response intelligence system.
Your job is to analyze incidents using current evidence, organizational memory from Hindsight, and historical database records.
You identify root causes, recall what failed and worked previously, and produce actionable recommendations.
Be honest about what you know and don't know.
Respond ONLY with valid JSON matching the required schema."""

        user_prompt = f"""Analyze this incident and return a JSON object.

CURRENT INCIDENT:
- Number: {incident_number}
- Title: {title}
- Service: {service}
- Severity: {severity}
- Description: {description or 'No description provided'}
{memory_context}
{db_context}

Return a JSON object with these exact keys:
{{
  "symptoms": ["list of observed symptoms"],
  "root_cause_hypotheses": ["primary hypothesis", "alternative hypothesis if any"],
  "recommended_next_action": "single most important action to take right now",
  "recurrence_status": "one of: new_incident | possible_recurrence | confirmed_recurrence | no_history",
  "analysis_reasoning": "2-3 sentence explanation of the analysis, citing historical evidence if found",
  "historical_matches": [
    {{
      "incident_number": "INC-XXX",
      "similarity_evidence": "description of why this is similar",
      "root_cause": "root cause from that incident",
      "resolution_summary": "what ultimately worked",
      "remediation": "permanent fix applied"
    }}
  ]
}}

Only include historical_matches if you found actual matching evidence in the memories or database above.
Do not fabricate incidents or similarity scores."""

        try:
            raw = self._chat([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ])

            # Extract JSON from response (handles markdown code blocks)
            raw = raw.strip()
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()

            result = json.loads(raw)
            result["status"] = "complete"
            return result

        except json.JSONDecodeError as exc:
            logger.error(f"LLM returned non-JSON. Error: {exc}. Raw: {raw[:200]}")
            return {
                "status": "parse_error",
                "symptoms": [title],
                "root_cause_hypotheses": ["Unable to determine — LLM response parse error"],
                "recommended_next_action": "Escalate to on-call engineer",
                "recurrence_status": "no_history",
                "analysis_reasoning": "AI analysis partially available but response could not be parsed.",
                "historical_matches": [],
            }
        except Exception as exc:
            logger.error(f"LLM analyze_incident failed: {exc}")
            return {"status": "unavailable", "reason": str(exc)}

    def answer_copilot(
        self,
        question: str,
        incident_number: str,
        incident_context: Dict[str, Any],
        hindsight_memories: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Answer a Copilot question grounded in incident context and memory."""
        if not self._is_configured():
            return {
                "status": "unavailable",
                "answer": "AI Copilot is currently unavailable. Please check LLM configuration.",
                "sources": [],
            }

        memory_context = ""
        if hindsight_memories:
            memory_context = "\nOrganizational Memory:\n"
            for m in hindsight_memories[:3]:
                content = m.get("content", m.get("text", str(m)))
                memory_context += f"\n{content[:500]}\n"

        ctx_text = f"""Incident: {incident_number}
Title: {incident_context.get('title', '')}
Service: {incident_context.get('service', '')}
Severity: {incident_context.get('severity', '')}
Status: {incident_context.get('status', '')}
Root Cause: {incident_context.get('root_cause', 'Under investigation')}
{memory_context}"""

        system_prompt = """You are the RESOLVE Incident Copilot.
Answer questions about incidents using the provided incident context and organizational memory.
Be specific, concise, and cite the historical evidence when relevant.
If you don't have evidence for something, say so honestly."""

        try:
            answer = self._chat([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{ctx_text}\n\nQuestion: {question}"},
            ])

            sources = []
            if hindsight_memories:
                sources.append(f"Hindsight Memory ({len(hindsight_memories)} records retrieved)")
            if incident_context.get("root_cause"):
                sources.append(f"Incident {incident_number} structured data")

            return {
                "status": "complete",
                "answer": answer,
                "sources": sources,
                "memory_used": bool(hindsight_memories),
            }
        except Exception as exc:
            logger.error(f"Copilot LLM call failed: {exc}")
            return {
                "status": "unavailable",
                "answer": "AI analysis is currently unavailable. Please consult historical records directly.",
                "sources": [],
                "memory_used": False,
            }

    def summarize_memory(self, memories: List[Dict[str, Any]], topic: str) -> str:
        """Summarize a list of Hindsight memories into a coherent narrative."""
        if not self._is_configured() or not memories:
            return ""

        combined = "\n\n".join(
            m.get("content", m.get("text", str(m)))[:400] for m in memories[:5]
        )
        try:
            return self._chat([
                {"role": "system", "content": "Summarize organizational incident memory concisely."},
                {"role": "user", "content": f"Topic: {topic}\n\nMemories:\n{combined}\n\nProvide a 2-3 sentence summary."},
            ])
        except Exception:
            return ""
