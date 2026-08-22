"""
ThreatLens - Data-Driven Risk Engine (Phase 5)

Architecture
------------
1. Receive the full analysis result dict from the existing analyzers.
2. Derive a flat "extended signals" dict from all Phase 2-4 outputs.
3. Load active risk rules from PostgreSQL.
4. Match signals → rules → accumulate weighted scores.
5. Clamp to [0, 100] and classify into LOW / MEDIUM / HIGH / CRITICAL.
6. Return a structured `risk` block appended to the analysis result.

Fallback
--------
If PostgreSQL is unavailable, the engine falls back to the Phase 2
hardcoded weights so the API never returns a 500. The response will
include `risk.db_available = false` so callers can detect degraded mode.

Signal derivation
-----------------
Extended signal keys consumed by this engine:

Phase 2 (from signals dict, produced by analyzer.py):
  ip_based            bool
  unusual_port        bool
  suspicious_keywords bool
  encoded_characters  bool
  unusual_subdomain   bool

Phase 3 (derived from typosquatting sub-result):
  typosquatting       bool   → True when typosquatting.detected == True

Phase 4/1 DNS:
  dns_failed          bool   → True when dns.resolved == False

Phase 4/3 Redirects:
  excessive_redirects bool   → True when redirects.redirect_count >= 3

Phase 4/4 TLS:
  tls_invalid         bool   → True when https + (not tls_valid or expired or not hostname_matches)
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ── Fallback weights (must match Phase 2 spec exactly) ───────────────────────
# Used when PostgreSQL is not available. These are the ONLY hardcoded weights
# in the entire system — they exist solely as a graceful degradation fallback.

FALLBACK_WEIGHTS: Dict[str, int] = {
    "ip_based":            30,
    "unusual_port":        20,
    "suspicious_keywords": 20,
    "unusual_subdomain":   20,
    "encoded_characters":  15,
    # Phase 3-4 signals have fallback weight 0 so regression tests pass even
    # in fallback mode (typosquatting etc. aren't in the Phase 2 baseline score).
    "typosquatting":       0,
    "dns_failed":          0,
    "excessive_redirects": 0,
    "tls_invalid":         0,
}


# ── Level classification ──────────────────────────────────────────────────────

def _score_to_level(score: int) -> str:
    if score >= 80:   return "CRITICAL"
    elif score >= 60: return "HIGH"
    elif score >= 30: return "MEDIUM"
    else:             return "LOW"


# ── Signal derivation ─────────────────────────────────────────────────────────

def _derive_extended_signals(analysis: Dict[str, Any]) -> Dict[str, bool]:
    """
    Flatten all Phase 2–4 analysis sub-results into a single
    {signal_key: bool} dict for rule matching.
    """
    raw_signals = analysis.get("signals", {})
    ext: Dict[str, bool] = {
        # Phase 2 — straight copy
        "ip_based":            bool(raw_signals.get("ip_based")),
        "unusual_port":        bool(raw_signals.get("unusual_port")),
        "suspicious_keywords": bool(raw_signals.get("suspicious_keywords")),
        "encoded_characters":  bool(raw_signals.get("encoded_characters")),
        "unusual_subdomain":   bool(raw_signals.get("unusual_subdomain")),

        # Phase 3 — typosquatting
        "typosquatting":       bool(
            analysis.get("typosquatting", {}).get("detected", False)
        ),

        # Phase 4/1 — DNS
        "dns_failed":          not bool(
            analysis.get("dns", {}).get("resolved", True)
        ),

        # Phase 4/3 — Redirects  (3 or more hops = suspicious)
        "excessive_redirects": (
            analysis.get("redirects", {}).get("redirect_count", 0) >= 3
        ),

        # Phase 4/4 — TLS (only flag when HTTPS was expected)
        "tls_invalid": _tls_is_invalid(analysis),
    }
    return ext


def _tls_is_invalid(analysis: Dict[str, Any]) -> bool:
    """
    Return True when the URL is HTTPS but TLS is absent, invalid, expired,
    or the hostname doesn't match the certificate.
    """
    from urllib.parse import urlparse
    url = analysis.get("url", "")
    scheme = urlparse(url).scheme.lower()
    if scheme != "https":
        return False   # HTTP — TLS not expected, no penalty

    tls = analysis.get("tls", {})
    if not tls.get("tls_available", False):
        return True    # HTTPS but couldn't establish TLS
    if not tls.get("tls_valid", True):
        return True    # Certificate failed CA verification
    if tls.get("expired"):
        return True    # Certificate is expired
    if tls.get("hostname_matches") is False:
        return True    # CN/SAN doesn't match hostname
    return False


# ── Rule loading from PostgreSQL ──────────────────────────────────────────────

def _load_rules_from_db() -> Optional[List[Dict[str, Any]]]:
    """
    Load all enabled rules from PostgreSQL.
    Returns None if the database is unreachable (triggers fallback).
    """
    try:
        from sqlalchemy import text
        try:
            from backend.database import get_connection
        except ImportError:
            from database import get_connection

        with get_connection() as conn:
            rows = conn.execute(text(
                "SELECT rule_name, signal_key, score, description, category "
                "FROM risk_rules "
                "WHERE enabled = TRUE "
                "ORDER BY score DESC"
            )).fetchall()

        return [
            {
                "rule_name":   row[0],
                "signal_key":  row[1],
                "score":       row[2],
                "description": row[3],
                "category":    row[4],
            }
            for row in rows
        ]

    except Exception as e:
        logger.warning("Could not load risk rules from database: %s", e)
        return None


# ── Core scoring ──────────────────────────────────────────────────────────────

def _apply_rules(
    extended_signals: Dict[str, bool],
    rules: List[Dict[str, Any]],
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Match extended_signals against rules, accumulate score, return
    (total_score, triggered_rule_list).
    """
    total = 0
    triggered = []
    for rule in rules:
        sig_key = rule["signal_key"]
        if extended_signals.get(sig_key, False):
            total += rule["score"]
            triggered.append({
                "rule_name":   rule["rule_name"],
                "signal_key":  sig_key,
                "score":       rule["score"],
                "category":    rule.get("category", ""),
                "description": rule.get("description", ""),
            })
    return min(total, 100), triggered


def _apply_fallback(
    extended_signals: Dict[str, bool],
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Compute score using hardcoded FALLBACK_WEIGHTS when DB is unavailable.
    Produces the same numeric result as Phase 2 for the original 5 signals.
    """
    total = 0
    triggered = []
    for sig_key, weight in FALLBACK_WEIGHTS.items():
        if weight > 0 and extended_signals.get(sig_key, False):
            total += weight
            triggered.append({
                "rule_name":   sig_key,
                "signal_key":  sig_key,
                "score":       weight,
                "category":    "FALLBACK",
                "description": f"Fallback weight for {sig_key} (DB unavailable)",
            })
    return min(total, 100), triggered


# ── Public API ────────────────────────────────────────────────────────────────

def compute_risk(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point for the Phase 5 Risk Engine.

    Accepts the full analysis result dict from analyze_url_heuristics()
    and returns a `risk` sub-dict:

    {
        "score":          int (0-100),
        "level":          "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "triggered_rules": [...],
        "db_available":   bool,
        "explanation":    str
    }
    """
    extended_signals = _derive_extended_signals(analysis)
    rules = _load_rules_from_db()
    db_available = rules is not None

    if db_available and rules:
        score, triggered = _apply_rules(extended_signals, rules)
    else:
        score, triggered = _apply_fallback(extended_signals)

    level = _score_to_level(score)

    explanations = [r["description"] for r in triggered if r.get("description")]
    explanation = (
        "; ".join(explanations)
        if explanations
        else "No risk indicators detected."
    )

    return {
        "score":           score,
        "level":           level,
        "triggered_rules": triggered,
        "db_available":    db_available,
        "explanation":     explanation,
    }
