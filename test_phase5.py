"""
ThreatLens - Phase 5 Tests (Risk Engine)
"""

import os
import urllib.request
import json
import sys

API = "http://127.0.0.1:8000/api/analyze"

def post(url):
    req = urllib.request.Request(
        API,
        data=json.dumps({"url": url}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

def run_tests():
    print("Running Phase 5 Risk Engine tests...")
    
    # 1. Clean URL (LOW risk)
    print("\nTest 1: Clean URL")
    res = post("https://example.com")
    risk = res.get("risk", {})
    print(f"Score: {risk.get('score')}, Level: {risk.get('level')}")
    assert risk.get("score") == 0
    assert risk.get("level") == "LOW"
    
    # 2. Heuristics (IP + Suspicious Keywords)
    print("\nTest 2: IP + Keywords")
    res = post("http://192.168.1.10/login")
    risk = res.get("risk", {})
    print(f"Score: {risk.get('score')}, Level: {risk.get('level')}")
    assert risk.get("score") == 50
    assert risk.get("level") == "MEDIUM"

    # 3. Typosquatting
    print("\nTest 3: Typosquatting")
    res = post("https://micros0ft.com")
    risk = res.get("risk", {})
    print(f"Score: {risk.get('score')}, Level: {risk.get('level')}")
    
    # Typosquatting adds 25 to the baseline, but DNS or TLS failure could add more
    assert risk.get("score") >= 25, f"Expected >= 25, got {risk.get('score')}"

    # 4. Prove Data-Driven
    # We will temporarily change a rule weight in the DB and see the score change
    print("\nTest 4: Data-Driven verification")
    try:
        from backend.database import get_connection
        from sqlalchemy import text
        with get_connection() as conn:
            conn.execute(text("UPDATE risk_rules SET score = 99 WHERE signal_key = 'ip_based'"))
            conn.commit()
            
        res = post("http://192.168.1.10")
        risk = res.get("risk", {})
        print(f"Score after DB update: {risk.get('score')}, Level: {risk.get('level')}")
        assert risk.get("score") == 99
        
        # Revert
        with get_connection() as conn:
            conn.execute(text("UPDATE risk_rules SET score = 30 WHERE signal_key = 'ip_based'"))
            conn.commit()
            
    except Exception as e:
        print(f"Error updating DB: {e}")
        sys.exit(1)

    print("\nAll Phase 5 tests passed!")

if __name__ == "__main__":
    run_tests()
