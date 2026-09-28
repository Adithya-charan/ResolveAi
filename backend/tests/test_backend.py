"""
RESOLVE backend integration tests.
Run from backend/ directory: pytest tests/
"""
import pytest
import pytest_asyncio


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_health_endpoint():
    """Verify health endpoint response shape."""
    # This is an import-level test — verifies app can be imported
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "hindsight_configured" in data
    assert "llm_configured" in data


def test_settings_load():
    """Verify settings can be loaded."""
    from app.core.config import settings
    assert settings.HINDSIGHT_BANK_ID  # Should be 'resolve'
    assert settings.LLM_MODEL  # Should be 'qwen/qwen3-32b'
    assert settings.LLM_PROVIDER  # Should be 'groq'


def test_hindsight_service_init():
    """Verify HindsightService can be instantiated."""
    from app.services.hindsight_service import HindsightService
    svc = HindsightService()
    assert svc.bank_id == "resolve"
    assert svc.base_url == "https://api.hindsight.vectorize.io"


def test_llm_provider_init():
    """Verify LLMProvider can be instantiated."""
    from app.services.llm_provider import LLMProvider
    provider = LLMProvider()
    assert provider.provider == "groq"
    assert provider.model == "qwen/qwen3-32b"


def test_incident_schemas():
    """Verify Pydantic schemas are well-formed."""
    from app.schemas.incident import IncidentAnalyzeRequest, IncidentAnalysisResponse
    req = IncidentAnalyzeRequest(
        incident_number="INC-482",
        title="503 errors test",
        severity="critical",
        service_name="Payment Service",
    )
    assert req.incident_number == "INC-482"
    assert req.service_name == "Payment Service"


def test_database_url_conversion():
    """Verify DATABASE_URL is converted correctly for asyncpg."""
    from app.core.database import engine
    assert engine is not None
    # URL should be postgresql+asyncpg://
    assert "asyncpg" in str(engine.url)
