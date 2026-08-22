"""
ThreatLens - Risk Rules Schema & Seeding (Phase 5)

Creates the `risk_rules` table in PostgreSQL and seeds it with the
default rules that mirror the Phase 2–4 heuristic signals already
implemented in the backend.

Schema
------
risk_rules
  id          SERIAL PRIMARY KEY
  rule_name   VARCHAR(100) UNIQUE NOT NULL  -- machine-readable key
  signal_key  VARCHAR(100) NOT NULL         -- matches the signal dict key produced by analyzers
  score       INTEGER NOT NULL              -- points added when signal is True
  description TEXT                          -- human-readable explanation
  category    VARCHAR(50)                   -- grouping: URL, NETWORK, TLS, PHISHING
  enabled     BOOLEAN DEFAULT TRUE          -- can disable without deleting
  created_at  TIMESTAMPTZ DEFAULT NOW()
  updated_at  TIMESTAMPTZ DEFAULT NOW()

Seed rules
----------
The initial weights exactly reproduce the Phase 2 deterministic scores
so existing regression tests continue to pass unchanged.
"""

import logging
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

try:
    from backend.database import get_connection
except ImportError:
    from database import get_connection

logger = logging.getLogger(__name__)

# ── DDL ───────────────────────────────────────────────────────────────────────

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS risk_rules (
    id          SERIAL PRIMARY KEY,
    rule_name   VARCHAR(100) UNIQUE NOT NULL,
    signal_key  VARCHAR(100) NOT NULL,
    score       INTEGER      NOT NULL DEFAULT 0,
    description TEXT,
    category    VARCHAR(50)  NOT NULL DEFAULT 'URL',
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
"""

# ── Seed data ─────────────────────────────────────────────────────────────────
# signal_key must match keys in the 'signals' dict returned by analyze_url_heuristics()
# plus the extra signal keys derived from Phase 3 / Phase 4 results.

SEED_RULES = [
    # ── Phase 2 URL heuristics ──────────────────────────────────────────────
    {
        "rule_name":   "ip_based_hostname",
        "signal_key":  "ip_based",
        "score":       30,
        "description": "Hostname is a raw IPv4/IPv6 address rather than a registered domain. "
                        "Phishing URLs frequently use raw IPs to bypass domain reputation filters.",
        "category":    "URL",
        "enabled":     True,
    },
    {
        "rule_name":   "unusual_port",
        "signal_key":  "unusual_port",
        "score":       20,
        "description": "URL specifies a non-standard network port (not 80 or 443). "
                        "Malicious servers often listen on alternate ports to evade network-layer filters.",
        "category":    "URL",
        "enabled":     True,
    },
    {
        "rule_name":   "suspicious_keywords",
        "signal_key":  "suspicious_keywords",
        "score":       20,
        "description": "URL path or hostname contains authentication/credential-harvesting keywords "
                        "(login, signin, verify, password, secure, account, etc.).",
        "category":    "PHISHING",
        "enabled":     True,
    },
    {
        "rule_name":   "encoded_characters",
        "signal_key":  "encoded_characters",
        "score":       15,
        "description": "URL contains percent-encoded characters (%xx) used to obfuscate "
                        "the true destination path or query parameters.",
        "category":    "URL",
        "enabled":     True,
    },
    {
        "rule_name":   "unusual_subdomain",
        "signal_key":  "unusual_subdomain",
        "score":       20,
        "description": "Hostname has an unusually deep subdomain hierarchy (4+ levels). "
                        "Attackers use deep subdomains to disguise the actual malicious domain.",
        "category":    "URL",
        "enabled":     True,
    },

    # ── Phase 3 — Typosquatting / Brand Impersonation ───────────────────────
    {
        "rule_name":   "typosquatting_detected",
        "signal_key":  "typosquatting",
        "score":       25,
        "description": "Domain shows high similarity to a known trusted brand via Levenshtein distance "
                        "or contains a trusted brand name in a combosquat pattern.",
        "category":    "PHISHING",
        "enabled":     True,
    },

    # ── Phase 4/1 — DNS ──────────────────────────────────────────────────────
    {
        "rule_name":   "dns_resolution_failed",
        "signal_key":  "dns_failed",
        "score":       10,
        "description": "DNS resolution failed for the target hostname. "
                        "Could indicate a newly registered or taken-down phishing domain.",
        "category":    "NETWORK",
        "enabled":     True,
    },

    # ── Phase 4/3 — Redirects ────────────────────────────────────────────────
    {
        "rule_name":   "excessive_redirects",
        "signal_key":  "excessive_redirects",
        "score":       15,
        "description": "URL chain contains 3 or more redirects, which is a common evasion technique "
                        "used to hide the true phishing destination from reputation scanners.",
        "category":    "NETWORK",
        "enabled":     True,
    },

    # ── Phase 4/4 — TLS ──────────────────────────────────────────────────────
    {
        "rule_name":   "tls_invalid_or_missing",
        "signal_key":  "tls_invalid",
        "score":       20,
        "description": "TLS certificate is absent, invalid, expired, or hostname does not match. "
                        "Legitimate HTTPS sites always present a valid, matching certificate.",
        "category":    "TLS",
        "enabled":     True,
    },
]

# ── Public API ────────────────────────────────────────────────────────────────

def create_and_seed_tables() -> None:
    """
    Create the risk_rules table (if it doesn't exist) and seed it with
    the default rules (using INSERT ... ON CONFLICT DO NOTHING so re-running
    is always safe).
    """
    with get_connection() as conn:
        # Create table
        conn.execute(text(CREATE_TABLE_SQL))
        conn.commit()
        logger.info("risk_rules table ensured.")

        # Seed rules (idempotent)
        insert_sql = text("""
            INSERT INTO risk_rules
                (rule_name, signal_key, score, description, category, enabled)
            VALUES
                (:rule_name, :signal_key, :score, :description, :category, :enabled)
            ON CONFLICT (rule_name) DO NOTHING
        """)
        for rule in SEED_RULES:
            conn.execute(insert_sql, rule)
        conn.commit()
        logger.info("Seeded %d risk rules.", len(SEED_RULES))
