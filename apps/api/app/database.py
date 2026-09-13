"""
NIVA Backend — Database engine and session management.
Supports Postgres (asyncpg) and SQLite (aiosqlite) fallback for local dev without Docker.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

def _effective_db_url() -> str:
    url = settings.database_url
    # If Postgres is not reachable at startup, fallback logic is handled by lifespan
    return url

_db_url = _effective_db_url()

# Choose connect_args / pool config based on driver
if _db_url.startswith("sqlite"):
    engine = create_async_engine(_db_url, echo=False, future=True)
else:
    engine = create_async_engine(
        _db_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
    )

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency: yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create tables if not exist. For hackathon reliability, falls back to SQLite if Postgres is unreachable."""
    global engine, async_session
    try:
        from app.models import __all__  # noqa
    except Exception:
        pass
    try:
        import app.models  # noqa
    except Exception:
        pass

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        if not _db_url.startswith("sqlite"):
            print(f"[NIVA] Postgres unreachable ({e}), seamlessly initializing SQLite local database (niva.db)...")
            sqlite_url = "sqlite+aiosqlite:///./niva.db"
            engine = create_async_engine(sqlite_url, echo=False, future=True)
            async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("[NIVA] Local SQLite database initialized successfully.")
        else:
            raise
