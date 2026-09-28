"""Application configuration using Pydantic BaseSettings.
All values are read from environment variables; no secrets are hardcoded.
"""
import pathlib
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# The .env file lives in backend/
BACKEND_ROOT = pathlib.Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # PostgreSQL / Neon
    DATABASE_URL: str = Field(..., env="DATABASE_URL")

    # Hindsight
    HINDSIGHT_API_KEY: str = Field(default="", env="HINDSIGHT_API_KEY")
    HINDSIGHT_BANK_ID: str = Field(default="resolve", env="HINDSIGHT_BANK_ID")
    HINDSIGHT_BASE_URL: str = Field(
        default="https://api.hindsight.vectorize.io", env="HINDSIGHT_BASE_URL"
    )

    # LLM
    LLM_PROVIDER: str = Field(default="groq", env="LLM_PROVIDER")
    LLM_MODEL: str = Field(default="qwen/qwen3-32b", env="LLM_MODEL")
    LLM_API_KEY: str = Field(default="", env="LLM_API_KEY")

    # CORS
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000", env="ALLOWED_ORIGINS"
    )


settings = Settings()
