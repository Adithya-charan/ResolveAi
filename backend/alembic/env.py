"""Alembic environment configuration for RESOLVE backend."""
from __future__ import with_statement
import sys
import os
import re

# Add backend root to path so app.* imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import Base metadata and all models
from app.core.database import Base  # noqa
import app.models  # noqa — registers all ORM classes

target_metadata = Base.metadata

# Get sync DATABASE_URL from settings
from app.core.config import settings  # noqa

# Convert async URL to sync URL for Alembic (asyncpg -> psycopg2 style)
_url = settings.DATABASE_URL
if _url.startswith("postgresql+asyncpg://"):
    _url = _url.replace("postgresql+asyncpg://", "postgresql://", 1)

# Strip channel_binding param (not supported by psycopg2)
if "channel_binding" in _url:
    _url = re.sub(r"[?&]channel_binding=[^&]*", "", _url)
    _url = re.sub(r"\?$", "", _url)

DB_URL = _url


def run_migrations_offline() -> None:
    """Run in 'offline' mode (no engine connection needed)."""
    context.configure(
        url=DB_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run in 'online' mode (requires live DB connection)."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = DB_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
