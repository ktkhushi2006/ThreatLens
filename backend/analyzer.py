"""
ThreatLens - URL Analysis Engine
(Phases 1, 2, 3 & Phase 4 Steps 1, 2, 3, 4)

Pipeline:
  Phase 2  — URL rule-based heuristics & deterministic risk scoring
  Phase 3  — Levenshtein distance & domain typosquatting detection
  Phase 4/1 — DNS resolution and IP address discovery
  Phase 4/2 — HTTP/HTTPS status code & response header inspection
  Phase 4/3 — HTTP redirect chain analysis
  Phase 4/4 — TLS/SSL certificate inspection
"""

import re
import ipaddress
from urllib.parse import urlparse
from typing import Dict, List, Any, Tuple

try:
    from backend.typosquat         import analyze_typosquatting
    from backend.dns_analyzer      import resolve_dns
    from backend.http_analyzer     import analyze_http
    from backend.redirect_analyzer import analyze_redirects
    from backend.tls_analyzer      import analyze_tls
    from backend.risk_engine       import compute_risk
except ImportError:
    from typosquat         import analyze_typosquatting
    from dns_analyzer      import resolve_dns
    from http_analyzer     import analyze_http
    from redirect_analyzer import analyze_redirects
    from tls_analyzer      import analyze_tls
    from risk_engine       import compute_risk


# ── Configurable keyword list (Phase 2) ──────────────────────────────────────
SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "verification",
    "secure", "account", "update", "password", "confirm",
    "banking", "wallet", "auth", "security", "credential",
    "invoice", "billing"
]

STANDARD_PORTS = {80, 443}


# ── URL validation ────────────────────────────────────────────────────────────

def validate_and_parse_url(raw_url: str):
    """
    Safely validates and parses a raw URL string.
    Ensures a valid HTTP/HTTPS scheme and non-empty hostname.
    """
    trimmed = raw_url.strip()
    if not trimmed:
        raise ValueError("URL cannot be empty")

    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", trimmed):
        trimmed = f"https://{trimmed}"

    parsed = urlparse(trimmed)

    if parsed.scheme.lower() not in {"http", "https"}:
        raise ValueError(
            f"Unsupported URL scheme '{parsed.scheme}'. "
            "Only http:// and https:// are supported."
        )

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Malformed URL: could not extract a valid hostname.")

    return parsed, trimmed


# ── Phase 2 heuristics ────────────────────────────────────────────────────────

def check_ip_based(hostname: str) -> Tuple[bool, str]:
    try:
        ipaddress.ip_address(hostname)
        return True, f"Hostname is a raw IP address ({hostname}) instead of a registered domain"
    except ValueError:
        return False, ""


def check_unusual_port(parsed_url) -> Tuple[bool, str]:
    port = parsed_url.port
    if port is not None and port not in STANDARD_PORTS:
        return True, f"URL specifies a non-standard network port ({port})"
    return False, ""


def check_suspicious_keywords(url_string: str) -> Tuple[bool, List[str], str]:
    url_lower = url_string.lower()
    matched = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url_lower]
    if matched:
        return True, matched, f"Contains sensitive auth/security keywords: {', '.join(matched)}"
    return False, [], ""


def check_encoded_characters(raw_url: str) -> Tuple[bool, str]:
    if re.search(r"%[0-9a-fA-F]{2}", raw_url):
        return True, "URL contains percent-encoded / obfuscated characters"
    return False, ""


def check_unusual_subdomain(hostname: str, is_ip: bool) -> Tuple[bool, str]:
    if is_ip:
        return False, ""
    parts = [p for p in hostname.split(".") if p]
    if len(parts) >= 4:
        return True, f"Unusually deep subdomain hierarchy ({len(parts)} levels in {hostname})"
    return False, ""


# ── Risk scoring ──────────────────────────────────────────────────────────────

def calculate_risk(signals: Dict[str, bool], _reasons: List[str]) -> Tuple[int, str]:
    """
    Deterministic Phase 2 risk score — unchanged.
    Weights: ip_based +30, unusual_port +20, suspicious_keywords +20,
             unusual_subdomain +20, encoded_characters +15.
    """
    score = 0
    if signals.get("ip_based"):            score += 30
    if signals.get("unusual_port"):        score += 20
    if signals.get("suspicious_keywords"): score += 20
    if signals.get("unusual_subdomain"):   score += 20
    if signals.get("encoded_characters"):  score += 15
    score = min(score, 100)

    if score >= 80:   level = "CRITICAL"
    elif score >= 60: level = "HIGH"
    elif score >= 30: level = "MEDIUM"
    else:             level = "LOW"

    return score, level


# ── Main analysis entry-point ─────────────────────────────────────────────────

def analyze_url_heuristics(raw_url: str) -> Dict[str, Any]:
    """
    Full analysis pipeline:
      Phase 2 heuristics → Phase 3 typosquatting → DNS → HTTP → Redirects → TLS
    """
    parsed, normalized_url = validate_and_parse_url(raw_url)
    hostname = parsed.hostname or ""
    scheme   = parsed.scheme.lower()
    port     = parsed.port or (443 if scheme == "https" else 80)

    signals: Dict[str, bool] = {
        "ip_based": False,
        "unusual_port": False,
        "suspicious_keywords": False,
        "encoded_characters": False,
        "unusual_subdomain": False,
    }
    reasons: List[str] = []

    # Phase 2 — heuristics
    is_ip, ip_reason = check_ip_based(hostname)
    if is_ip:
        signals["ip_based"] = True
        reasons.append(ip_reason)

    is_unusual_port, port_reason = check_unusual_port(parsed)
    if is_unusual_port:
        signals["unusual_port"] = True
        reasons.append(port_reason)

    has_kw, _, kw_reason = check_suspicious_keywords(normalized_url)
    if has_kw:
        signals["suspicious_keywords"] = True
        reasons.append(kw_reason)

    has_encoded, enc_reason = check_encoded_characters(raw_url)
    if has_encoded:
        signals["encoded_characters"] = True
        reasons.append(enc_reason)

    has_deep_sub, sub_reason = check_unusual_subdomain(hostname, is_ip)
    if has_deep_sub:
        signals["unusual_subdomain"] = True
        reasons.append(sub_reason)

    # Phase 2 — deterministic risk score (UNCHANGED by later phases)
    risk_score, risk_level = calculate_risk(signals, reasons)

    # Phase 3 — typosquatting
    typosquatting = analyze_typosquatting(hostname)
    if typosquatting.get("detected") and typosquatting.get("reason"):
        reasons.append(typosquatting["reason"])

    # Phase 4/1 — DNS
    dns_result = resolve_dns(hostname)

    # Phase 4/2 — HTTP/HTTPS headers
    http_result = analyze_http(normalized_url)

    # Phase 4/3 — Redirect chain
    redirect_result = analyze_redirects(normalized_url)

    # Phase 4/4 — TLS certificate
    tls_port   = parsed.port if parsed.port else DEFAULT_TLS_PORT_FOR(scheme)
    tls_result = analyze_tls(scheme, hostname, port=tls_port)

    result = {
        "url":           raw_url.strip(),
        "risk_score":    risk_score,
        "risk_level":    risk_level,
        "reasons":       reasons,
        "signals":       signals,
        "typosquatting": typosquatting,
        "dns":           dns_result,
        "http":          http_result,
        "redirects":     redirect_result,
        "tls":           tls_result,
    }

    # Phase 5 — Data-Driven Risk Engine
    # compute_risk reads all sub-results, queries PostgreSQL for active rules,
    # and returns an enriched risk score. Falls back gracefully if DB is down.
    risk_data = compute_risk(result)
    result["risk"] = risk_data

    # Overwrite top-level fields so existing frontend and regression tests
    # automatically use the new Phase 5 data-driven score without breaking.
    result["risk_score"] = risk_data["score"]
    result["risk_level"] = risk_data["level"]
    if risk_data.get("triggered_rules"):
        result["reasons"] = [r["description"] for r in risk_data["triggered_rules"] if r.get("description")]

    return result


def DEFAULT_TLS_PORT_FOR(scheme: str) -> int:
    return 443 if scheme == "https" else 80
