"""FastAPI application entry point for RESOLVE backend."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api import incidents, memory, patterns, services

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RESOLVE Backend API",
    version="1.0.0",
    description="Incident response intelligence platform — powered by Neon, Hindsight, and Groq",
)

# CORS — restrict to configured origins, not wildcard in production
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(incidents.router, prefix="/api", tags=["incidents"])
app.include_router(memory.router, prefix="/api", tags=["memory"])
app.include_router(patterns.router, prefix="/api", tags=["patterns"])
app.include_router(services.router, prefix="/api", tags=["services"])


@app.get("/health", tags=["health"])
async def health_check():
    """Health endpoint — confirms FastAPI is running."""
    return {
        "status": "ok",
        "service": "RESOLVE Backend",
        "version": "1.0.0",
        "hindsight_configured": bool(settings.HINDSIGHT_API_KEY),
        "llm_configured": bool(settings.LLM_API_KEY),
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
    }


@app.on_event("startup")
async def on_startup():
    logger.info("RESOLVE backend starting...")
    logger.info(f"Hindsight bank: {settings.HINDSIGHT_BANK_ID}")
    logger.info(f"LLM provider: {settings.LLM_PROVIDER} / {settings.LLM_MODEL}")
