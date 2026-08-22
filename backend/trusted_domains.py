"""
ThreatLens - Trusted Domains Configuration (Phase 3)

Configurable list of legitimate/trusted domains used to evaluate analyzed URLs
for typosquatting, lookalike domains, and brand impersonation.

This list is intentionally separated from the analysis logic so that in future
phases it can be dynamically loaded from a database, file, or threat intelligence feed.
"""

from typing import List

TRUSTED_DOMAINS: List[str] = [
    "microsoft.com",
    "google.com",
    "paypal.com",
    "amazon.com",
    "apple.com"
]
