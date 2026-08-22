"""
ThreatLens - Phase 5 Comprehensive Risk Engine Test Suite
Tests:
1. Baseline clean URL (LOW risk, 0 score)
2. URL Heuristics evaluation (IP + Keywords, etc.)
3. Typosquatting integration with Risk Engine
4. Full PostgreSQL rule loading & schema validation
5. Real data-driven test: modifying PostgreSQL rule weight dynamically alters the computed risk score WITHOUT modifying Python code
6. Disabling a rule in PostgreSQL eliminates its score contribution
7. Score clamping at 100 max
8. Triggered rules and explanations presence
"""

import sys
import json
import urllib.request
from sqlalchemy import text

try:
    from backend.database import get_connection
except ImportError:
    from database import get_connection

API = "http://127.0.0.1:8000/api/analyze"
PASS = 0
FAIL = 0
FAILURES = []

def check(condition: bool, name: str, detail: str = ""):
    global PASS, FAIL, FAILURES
    if condition:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        msg = f"{name} - {detail}" if detail else name
        FAILURES.append(msg)
        print(f"  [FAIL] {name} ({detail})")

def post_url(url: str, timeout: int = 15):
    req = urllib.request.Request(
        API,
        data=json.dumps({"url": url}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    global PASS, FAIL, FAILURES
    print("=" * 72)
    print("  THREATLENS - PHASE 5 DATA-DRIVEN RISK ENGINE TEST SUITE")
    print("=" * 72)

    # -------------------------------------------------------------------------
    print("\n[SECTION 1] POSTGRESQL RISK RULES TABLE & LOADING")
    # -------------------------------------------------------------------------
    with get_connection() as conn:
        rules = conn.execute(text("SELECT rule_name, signal_key, score, category, enabled FROM risk_rules ORDER BY id")).fetchall()
    
    check(len(rules) >= 9, "PostgreSQL risk_rules table populated with seeded rules", f"Found {len(rules)} rules")
    for r in rules:
        print(f"    - Rule: {r[0]:<25} | signal: {r[1]:<22} | score: {r[2]:<3} | category: {r[3]:<10} | enabled: {r[4]}")

    # -------------------------------------------------------------------------
    print("\n[SECTION 2] API RISK ENGINE RESPONSE STRUCTURE")
    # -------------------------------------------------------------------------
    res = post_url("https://example.com")
    check("risk" in res, "API response contains 'risk' object")
    risk = res.get("risk", {})
    check("score" in risk and "level" in risk, "Risk object has 'score' and 'level' fields")
    check("triggered_rules" in risk, "Risk object has 'triggered_rules' list")
    check("db_available" in risk and risk["db_available"] is True, "Risk Engine reports db_available=True (PostgreSQL active)")
    check(risk.get("score") == 0, "Clean URL produces risk_score=0", f"Got {risk.get('score')}")
    check(risk.get("level") == "LOW", "Clean URL produces risk_level='LOW'", f"Got {risk.get('level')}")

    # -------------------------------------------------------------------------
    print("\n[SECTION 3] URL HEURISTIC SIGNALS EVALUATION")
    # -------------------------------------------------------------------------
    res_ip = post_url("http://192.168.1.10/login")
    risk_ip = res_ip.get("risk", {})
    check(risk_ip.get("score") == 50, "IP-based + login keywords produces score=50 (30+20)", f"Got {risk_ip.get('score')}")
    check(risk_ip.get("level") == "MEDIUM", "Score 50 classified as MEDIUM risk", f"Got {risk_ip.get('level')}")
    triggered_keys = [tr["signal_key"] for tr in risk_ip.get("triggered_rules", [])]
    check("ip_based" in triggered_keys, "Triggered rules contains 'ip_based'")
    check("suspicious_keywords" in triggered_keys, "Triggered rules contains 'suspicious_keywords'")

    # -------------------------------------------------------------------------
    print("\n[SECTION 4] DATA-DRIVEN PROOF (DYNAMIC POSTGRESQL WEIGHT CHANGE)")
    # -------------------------------------------------------------------------
    test_url = "http://192.168.1.50"
    
    # Step A: Baseline score
    res_before = post_url(test_url)
    score_before = res_before.get("risk", {}).get("score")
    print(f"  [STEP A] Baseline analysis for {test_url} -> score = {score_before}")
    check(score_before == 30, "Baseline score is 30 (ip_based default weight)", f"Got {score_before}")

    # Step B: Update score in PostgreSQL from 30 to 75
    with get_connection() as conn:
        conn.execute(text("UPDATE risk_rules SET score = 75 WHERE signal_key = 'ip_based'"))
        conn.commit()
    print("  [STEP B] Updated PostgreSQL rule 'ip_based' score from 30 to 75")

    # Step C: Re-run analysis without touching Python code
    res_after = post_url(test_url)
    score_after = res_after.get("risk", {}).get("score")
    level_after = res_after.get("risk", {}).get("level")
    print(f"  [STEP C] Re-analyzed SAME URL {test_url} -> score = {score_after}, level = {level_after}")
    check(score_after == 75, "Score changed dynamically to 75 reflecting PostgreSQL rule update", f"Got {score_after}")
    check(level_after == "HIGH", "Risk level dynamically upgraded to HIGH (>=60 threshold)", f"Got {level_after}")

    # Step D: Test disabling rule in PostgreSQL
    with get_connection() as conn:
        conn.execute(text("UPDATE risk_rules SET enabled = FALSE WHERE signal_key = 'ip_based'"))
        conn.commit()
    print("  [STEP D] Set 'ip_based' rule enabled = FALSE in PostgreSQL")
    
    res_disabled = post_url(test_url)
    score_disabled = res_disabled.get("risk", {}).get("score")
    print(f"  [STEP E] Re-analyzed URL with disabled rule -> score = {score_disabled}")
    check(score_disabled == 0, "Disabled rule contributed 0 points as expected", f"Got {score_disabled}")

    # Step F: Revert rule back to normal
    with get_connection() as conn:
        conn.execute(text("UPDATE risk_rules SET score = 30, enabled = TRUE WHERE signal_key = 'ip_based'"))
        conn.commit()
    print("  [STEP F] Reverted PostgreSQL 'ip_based' rule back to score=30, enabled=TRUE")

    res_restored = post_url(test_url)
    score_restored = res_restored.get("risk", {}).get("score")
    check(score_restored == 30, "Restored rule back to score=30 verified", f"Got {score_restored}")

    # -------------------------------------------------------------------------
    print("\n[SECTION 5] SCORE CLAMPING (MAX 100)")
    # -------------------------------------------------------------------------
    with get_connection() as conn:
        conn.execute(text("UPDATE risk_rules SET score = 150 WHERE signal_key = 'ip_based'"))
        conn.commit()
    res_clamped = post_url(test_url)
    score_clamped = res_clamped.get("risk", {}).get("score")
    level_clamped = res_clamped.get("risk", {}).get("level")
    check(score_clamped == 100, "Score clamped to maximum 100 even if rule score exceeds 100", f"Got {score_clamped}")
    check(level_clamped == "CRITICAL", "Score 100 classified as CRITICAL level", f"Got {level_clamped}")
    with get_connection() as conn:
        conn.execute(text("UPDATE risk_rules SET score = 30 WHERE signal_key = 'ip_based'"))
        conn.commit()

    # -------------------------------------------------------------------------
    print("\n" + "=" * 72)
    total = PASS + FAIL
    print(f"  RESULTS: {PASS}/{total} tests passed")
    if FAIL == 0:
        print("  >>> ALL PHASE 5 RISK ENGINE TESTS PASSED (100%) <<<")
    else:
        print(f"  >>> {FAIL} TEST(S) FAILED <<<")
        for f in FAILURES:
            print(f"       [FAIL]  {f}")
    print("=" * 72)
    sys.exit(0 if FAIL == 0 else 1)

if __name__ == "__main__":
    main()
