"""
ThreatLens - Domain & Typosquatting Analysis Engine (Phase 3)

Implements Levenshtein distance, normalized string similarity, and brand impersonation
detection to identify lookalike and typosquatted domains targeting trusted entities.
"""

from typing import Dict, Any, Optional, Tuple, List

try:
    from backend.trusted_domains import TRUSTED_DOMAINS
except ImportError:
    from trusted_domains import TRUSTED_DOMAINS


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Computes the standard Levenshtein edit distance between two strings.
    Represents the minimum number of single-character edits (insertions,
    deletions, or substitutions) required to transform s1 into s2.
    """
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    # Initialize boundary conditions
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    # Compute edit distance via dynamic programming
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],      # Deletion
                    dp[i][j - 1],      # Insertion
                    dp[i - 1][j - 1]   # Substitution
                )

    return dp[m][n]


def calculate_string_similarity(s1: str, s2: str) -> float:
    """
    Calculates normalized Levenshtein similarity between 0.0 and 1.0.
    Formula: 1.0 - (levenshtein_distance(s1, s2) / max_len)
    """
    s1, s2 = s1.lower().strip(), s2.lower().strip()
    if s1 == s2:
        return 1.0

    max_len = max(len(s1), len(s2))
    if max_len == 0:
        return 1.0

    distance = levenshtein_distance(s1, s2)
    return round(1.0 - (distance / max_len), 2)


def extract_domain_parts(hostname: str) -> Tuple[str, str]:
    """
    Extracts the registrable domain (SLD+TLD) and base brand name from a hostname.
    Example:
      'micros0ft.com'             -> ('micros0ft.com', 'micros0ft')
      'microsoft-login.com'       -> ('microsoft-login.com', 'microsoft-login')
      'auth.login.paypa1.com'     -> ('paypa1.com', 'paypa1')
    """
    clean_host = hostname.lower().strip()
    parts = clean_host.split(".")

    if len(parts) >= 2:
        domain = ".".join(parts[-2:])
        base_name = parts[-2]
    else:
        domain = clean_host
        base_name = clean_host

    return domain, base_name


def check_brand_containment(target_base: str, trusted_base: str) -> float:
    """
    Checks if a trusted brand name is embedded/combosquatted in the target domain name.
    Example: 'microsoft-login', 'paypal-update', 'login-apple'
    """
    target = target_base.lower()
    trusted = trusted_base.lower()

    if trusted in target and target != trusted:
        return 0.85
    return 0.0


def analyze_typosquatting(
    hostname: str,
    trusted_list: Optional[List[str]] = None,
    similarity_threshold: float = 0.70
) -> Dict[str, Any]:
    """
    Evaluates whether the given hostname is a typosquat or impersonation of a trusted domain.

    Returns:
    {
        "detected": bool,
        "matched_domain": str or None,
        "similarity": float,
        "reason": str or None
    }
    """
    if not hostname:
        return {
            "detected": False,
            "matched_domain": None,
            "similarity": 0.0,
            "reason": None
        }

    trusted_domains = trusted_list or TRUSTED_DOMAINS
    target_clean = hostname.lower().strip()
    target_domain, target_base = extract_domain_parts(target_clean)

    # 1. Exact match check: if this is legitimately the authentic trusted domain or subdomain
    for trusted in trusted_domains:
        trusted_clean = trusted.lower().strip()
        if target_clean == trusted_clean or target_clean.endswith("." + trusted_clean):
            return {
                "detected": False,
                "matched_domain": None,
                "similarity": 0.0,
                "reason": None
            }

    best_match_domain: Optional[str] = None
    highest_similarity: float = 0.0

    # 2. Compare against each trusted domain
    for trusted in trusted_domains:
        trusted_clean = trusted.lower().strip()
        trusted_domain, trusted_base = extract_domain_parts(trusted_clean)

        sim = 0.0

        # Case A: Same base brand name on a different TLD (e.g. microsoft.xyz vs microsoft.com)
        if target_base == trusted_base and target_domain != trusted_clean:
            sim = 0.95

        # Case B: Combosquatting / Brand keyword containment (e.g. microsoft-login.com)
        elif check_brand_containment(target_base, trusted_base) > 0.0:
            sim = check_brand_containment(target_base, trusted_base)

        # Case C: Levenshtein distance on base domain name (SLD)
        else:
            base_dist = levenshtein_distance(target_base, trusted_base)
            max_len = max(len(target_base), len(trusted_base))
            base_sim = 1.0 - (base_dist / max_len)

            # 1-character typo/homoglyph (e.g. micros0ft.com, paypa1.com, amaz0n.com)
            if base_dist == 1:
                full_dist = levenshtein_distance(target_domain, trusted_clean)
                full_max = max(len(target_domain), len(trusted_clean))
                sim = round(1.0 - (full_dist / full_max), 2)

            # 2-character edit on longer brand names (e.g. g00gle.com)
            elif base_dist == 2 and len(trusted_base) >= 5 and base_sim >= 0.70:
                sim = round(base_sim, 2)
            else:
                sim = 0.0

        if sim > highest_similarity:
            highest_similarity = sim
            best_match_domain = trusted_clean

    # 3. Verdict based on similarity threshold
    if highest_similarity >= similarity_threshold and best_match_domain:
        return {
            "detected": True,
            "matched_domain": best_match_domain,
            "similarity": round(highest_similarity, 2),
            "reason": (
                f"Domain '{target_domain}' is highly similar to trusted domain '{best_match_domain}' "
                f"(similarity: {int(highest_similarity * 100)}%) and may indicate impersonation."
            )
        }

    return {
        "detected": False,
        "matched_domain": None,
        "similarity": 0.0,
        "reason": None
    }
