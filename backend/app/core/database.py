"""SQLAlchemy async engine and session management."""
import logging
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base

from app.core.config import settings

logger = logging.getLogger(__name__)

# asyncpg requires postgresql+asyncpg:// scheme
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# asyncpg does not support channel_binding or sslmode param — strip them if present
if "channel_binding" in _db_url:
    import re
    _db_url = re.sub(r"[?&]channel_binding=[^&]*", "", _db_url)
    
if "sslmode" in _db_url:
    import re
    _db_url = re.sub(r"[?&]sslmode=[^&]*", "", _db_url)
    
# Clean up trailing ? or &
import re
_db_url = re.sub(r"[?&]$", "", _db_url)

engine: AsyncEngine = create_async_engine(
    _db_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args={"ssl": "require"},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
