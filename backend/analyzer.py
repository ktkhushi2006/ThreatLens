"""
ThreatLens - URL Analysis Engine (Phases 1, 2, 3 & Phase 4 Step 1)

This module coordinates:
  - Phase 2: URL rule-based heuristics & deterministic risk scoring
  - Phase 3: Levenshtein distance & domain typosquatting detection
  - Phase 4 (Step 1): DNS resolution and IP address discovery
"""

import re
import ipaddress
from urllib.parse import urlparse, unquote
from typing import Dict, List, Any, Tuple

try:
    from backend.typosquat import analyze_typosquatting
    from backend.dns_analyzer import resolve_dns
except ImportError:
    from typosquat import analyze_typosquatting
    from dns_analyzer import resolve_dns


# Configurable list of keywords commonly found in phishing lures and auth theft
SUSPICIOUS_KEYWORDS = [
    "login",
    "signin",
    "verify",
    "verification",
    "secure",
    "account",
    "update",
    "password",
    "confirm",
    "banking",
    "wallet",
    "auth",
    "security",
    "credential",
    "invoice",
    "billing"
]

# Standard web ports that do not indicate port manipulation
STANDARD_PORTS = {80, 443}


def validate_and_parse_url(raw_url: str):
    """
    Safely validates and parses a raw URL string.
    Ensures a valid HTTP/HTTPS scheme and non-empty hostname.
    """
    trimmed = raw_url.strip()
    if not trimmed:
        raise ValueError("URL cannot be empty")

    # If scheme is missing, prefix with https:// to allow parsing
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", trimmed):
        trimmed = f"https://{trimmed}"

    parsed = urlparse(trimmed)

    # Validate scheme
    if parsed.scheme.lower() not in {"http", "https"}:
        raise ValueError(f"Unsupported URL scheme '{parsed.scheme}'. Only http:// and https:// are supported.")

    # Validate hostname
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Malformed URL: could not extract a valid hostname.")

    return parsed, trimmed


def check_ip_based(hostname: str) -> Tuple[bool, str]:
    """
    Heuristic 1: Detect whether the hostname is a direct IPv4 or IPv6 address.
    Phishing URLs frequently use raw IPs to bypass domain reputation filters.
    """
    try:
        ipaddress.ip_address(hostname)
        return True, f"Hostname is a raw IP address ({hostname}) instead of a registered domain"
    except ValueError:
        return False, ""


def check_unusual_port(parsed_url) -> Tuple[bool, str]:
    """
    Heuristic 2: Detect non-standard network ports.
    Standard web traffic uses port 80 (HTTP) or 443 (HTTPS).
    """
    port = parsed_url.port
    if port is not None and port not in STANDARD_PORTS:
        return True, f"URL specifies a non-standard network port ({port})"
    return False, ""


def check_suspicious_keywords(url_string: str) -> Tuple[bool, List[str], str]:
    """
    Heuristic 3: Detect sensitive authentication/banking keywords in path, query, or subdomains.
    """
    url_lower = url_string.lower()
    matched = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url_lower]

    if matched:
        return True, matched, f"Contains sensitive auth/security keywords: {', '.join(matched)}"
    return False, [], ""


def check_encoded_characters(raw_url: str) -> Tuple[bool, str]:
    """
    Heuristic 4: Detect percent-encoded characters (e.g., %20, %2F, %3D) used to conceal malicious payload targets.
    """
    if re.search(r"%[0-9a-fA-F]{2}", raw_url):
        return True, "URL contains percent-encoded / obfuscated characters"
    return False, ""


def check_unusual_subdomain(hostname: str, is_ip: bool) -> Tuple[bool, str]:
    """
    Heuristic 5: Detect unusually deep or complex subdomain hierarchies.
    e.g., a.b.c.d.example.com or fake-login.portal.target.xyz
    """
    if is_ip:
        return False, ""

    parts = [p for p in hostname.split(".") if p]
    # Standard domains: example.com (2 parts), www.example.com (3 parts)
    # Deep subdomains: 4 or more parts (e.g. login.secure.verify.example.com)
    if len(parts) >= 4:
        return True, f"Unusually deep subdomain hierarchy ({len(parts)} levels in {hostname})"
    return False, ""


def calculate_risk(signals: Dict[str, bool], reasons: List[str]) -> Tuple[int, str]:
    """
    Calculates deterministic risk score (0 - 100) and assigns risk level.
    Scoring Weights (Phase 2):
      - ip_based:            +30 points
      - unusual_port:        +20 points
      - suspicious_keywords: +20 points
      - unusual_subdomain:   +20 points
      - encoded_characters:  +15 points
    """
    score = 0
    if signals.get("ip_based"):
        score += 30
    if signals.get("unusual_port"):
        score += 20
    if signals.get("suspicious_keywords"):
        score += 20
    if signals.get("unusual_subdomain"):
        score += 20
    if signals.get("encoded_characters"):
        score += 15

    # Cap score at 100
    score = min(score, 100)

    # Determine risk level
    if score >= 80:
        level = "CRITICAL"
    elif score >= 60:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    return score, level


def analyze_url_heuristics(raw_url: str) -> Dict[str, Any]:
    """
    Main analysis entry point combining:
      - Phase 2: URL heuristics
      - Phase 3: Typosquatting / brand impersonation detection
      - Phase 4 Step 1: DNS IP resolution
    """
    parsed, normalized_url = validate_and_parse_url(raw_url)
    hostname = parsed.hostname or ""

    signals = {
        "ip_based": False,
        "unusual_port": False,
        "suspicious_keywords": False,
        "encoded_characters": False,
        "unusual_subdomain": False
    }
    reasons: List[str] = []

    # 1. IP Check
    is_ip, ip_reason = check_ip_based(hostname)
    if is_ip:
        signals["ip_based"] = True
        reasons.append(ip_reason)

    # 2. Port Check
    is_unusual_port, port_reason = check_unusual_port(parsed)
    if is_unusual_port:
        signals["unusual_port"] = True
        reasons.append(port_reason)

    # 3. Suspicious Keywords Check
    has_keywords, _, kw_reason = check_suspicious_keywords(normalized_url)
    if has_keywords:
        signals["suspicious_keywords"] = True
        reasons.append(kw_reason)

    # 4. Encoded Characters Check
    has_encoded, enc_reason = check_encoded_characters(raw_url)
    if has_encoded:
        signals["encoded_characters"] = True
        reasons.append(enc_reason)

    # 5. Unusual Subdomain Check
    has_deep_sub, sub_reason = check_unusual_subdomain(hostname, is_ip)
    if has_deep_sub:
        signals["unusual_subdomain"] = True
        reasons.append(sub_reason)

    # Calculate deterministic Phase 2 score
    risk_score, risk_level = calculate_risk(signals, reasons)

    # 6. Phase 3: Domain & Typosquatting / Impersonation Analysis
    typosquatting = analyze_typosquatting(hostname)
    if typosquatting.get("detected") and typosquatting.get("reason"):
        reasons.append(typosquatting["reason"])

    # 7. Phase 4 (Step 1): DNS Resolution
    dns_result = resolve_dns(hostname)

    return {
        "url": raw_url.strip(),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons,
        "signals": signals,
        "typosquatting": typosquatting,
        "dns": dns_result
    }
