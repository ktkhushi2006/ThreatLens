"""
ThreatLens - Database Connection Module (Phase 5)

Manages the PostgreSQL connection pool for the Risk Engine.
Uses SQLAlchemy for connection pooling and a psycopg2 backend.

Connection settings are read from environment variables with sane defaults
for local development. In production, set THREATLENS_DB_URL.
"""

import os
import logging
from typing import Optional

try:
    from sqlalchemy import create_engine, text, pool
    from sqlalchemy.exc import SQLAlchemyError
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

logger = logging.getLogger(__name__)

# ── Connection config ─────────────────────────────────────────────────────────

DEFAULT_DB_URL = (
    "postgresql+psycopg2://"
    "{user}:{password}@{host}:{port}/{dbname}"
).format(
    user    = os.getenv("PG_USER",     "postgres"),
    password= os.getenv("PG_PASSWORD", "postgres"),
    host    = os.getenv("PG_HOST",     "127.0.0.1"),
    port    = os.getenv("PG_PORT",     "5432"),
    dbname  = os.getenv("PG_DBNAME",   "threatlens"),
)

DB_URL = os.getenv("THREATLENS_DB_URL", DEFAULT_DB_URL)

_engine = None   # Module-level singleton


def get_engine():
    """Return (or lazily create) the SQLAlchemy engine singleton."""
    global _engine
    if _engine is not None:
        return _engine

    if not SQLALCHEMY_AVAILABLE:
        raise RuntimeError("SQLAlchemy is not installed. Run: pip install sqlalchemy psycopg2-binary")

    _engine = create_engine(
        DB_URL,
        poolclass          = pool.QueuePool,
        pool_size          = 5,
        max_overflow       = 10,
        pool_pre_ping      = True,   # verify connections before use
        pool_recycle       = 300,    # recycle after 5 minutes
        connect_args       = {"connect_timeout": 5},
    )
    return _engine


def get_connection():
    """Return a raw connection from the pool for use in WITH statements."""
    return get_engine().connect()


def test_connection() -> bool:
    """Return True if the database is reachable, False otherwise."""
    try:
        with get_connection() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning("Database connectivity check failed: %s", e)
        return False
