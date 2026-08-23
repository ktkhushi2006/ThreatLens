"""
ThreatLens - Database Schema for Phase 7

Creates the tables for Phase 7 persistence:
users, analyses, analysis_signals, redirects
"""
import logging
from sqlalchemy import text
try:
    from backend.database import get_connection
except ImportError:
    from database import get_connection

logger = logging.getLogger(__name__)

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    analysis_type VARCHAR(50) DEFAULT 'URL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dns_resolved BOOLEAN,
    tls_valid BOOLEAN
);

CREATE TABLE IF NOT EXISTS analysis_signals (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    signal_name VARCHAR(100) NOT NULL,
    signal_value BOOLEAN,
    score_contribution INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS redirects (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    hop_number INTEGER NOT NULL,
    source_url TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

def create_phase7_tables():
    with get_connection() as conn:
        conn.execute(text(CREATE_TABLES_SQL))
        conn.commit()
        logger.info("Phase 7 tables (analyses, analysis_signals, redirects, users) ensured.")
