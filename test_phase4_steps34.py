"""
ThreatLens — Phase 4 (Steps 3 & 4) + Full Regression Test Suite
Tests: Redirect Analysis, TLS Analysis, HTTP, DNS, Typosquatting, Heuristics
"""

import urllib.request
import urllib.error
import json
import sys

API = "http://127.0.0.1:8000/api/analyze"
PASS = 0
FAIL = 0
FAILURES = []


def post(url):
    req = urllib.request.Request(
        API,
        data=json.dumps({"url": url}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def expect_400(url):
    req = urllib.request.Request(
        API,
        data=json.dumps({"url": url}).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req):
            return False, "Expected HTTP 400 but got 200"
    except urllib.error.HTTPError as e:
        if e.code == 400:
            return True, json.loads(e.read().decode()).get("detail", "")
        return False, f"Expected 400, got {e.code}"


# ─────────────────────────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────────────────────────

def ok(label):
    global PASS
    PASS += 1
    print(f"  [PASS] {label}")


def fail(label, msg=""):
    global FAIL
    FAIL += 1
    note = f": {msg}" if msg else ""
    print(f"  [FAIL] {label}{note}")
    FAILURES.append(f"{label}{note}")


def section(title):
    print(f"\n{'=' * 72}")
    print(f"  {title}")
    print(f"{'=' * 72}")


# ─────────────────────────────────────────────────────────────────
# TEST GROUPS
# ─────────────────────────────────────────────────────────────────

def test_redirects():
    section("PHASE 4 STEP 3 — REDIRECT ANALYSIS")

    # --- 1. No redirect (example.com returns 200 directly) ---
    print("\n[TEST] 1. URL with no redirects (https://example.com)")
    d = post("https://example.com")
    r = d.get("redirects", {})
    print(f"  redirect_count={r.get('redirect_count')}  chain={r.get('redirect_chain')}  final={r.get('final_url')}  error={r.get('error')}")
    if r.get("redirect_count") == 0:
        ok("redirect_count is 0 for a non-redirecting URL")
    else:
        fail("redirect_count should be 0", f"got {r.get('redirect_count')}")

    if r.get("final_url"):
        ok("final_url is present")
    else:
        fail("final_url should be present")

    if isinstance(r.get("redirect_chain"), list):
        ok("redirect_chain is a list")
    else:
        fail("redirect_chain should be a list")

    if r.get("error") is None:
        ok("no error on reachable URL")
    else:
        fail("unexpected error", r.get("error"))

    # --- 2. URL that redirects (http://google.com → https://www.google.com) ---
    print("\n[TEST] 2. URL with redirect (http://google.com)")
    d = post("http://google.com")
    r = d.get("redirects", {})
    print(f"  redirect_count={r.get('redirect_count')}  final={r.get('final_url')}  chain_len={len(r.get('redirect_chain', []))}  error={r.get('error')}")
    if r.get("redirect_count", 0) >= 1:
        ok("redirect_count >= 1 for http://google.com")
    else:
        fail("Expected at least 1 redirect from http://google.com", f"got {r.get('redirect_count')}")

    chain = r.get("redirect_chain", [])
    if chain:
        hop = chain[0]
        if "from_url" in hop and "to_url" in hop and "status_code" in hop:
            ok("redirect_chain hops have from_url, to_url, status_code")
        else:
            fail("redirect hop missing fields", str(hop))
        if hop.get("status_code") in (301, 302, 307, 308):
            ok(f"redirect status_code is a valid 3xx ({hop['status_code']})")
        else:
            fail(f"Expected 3xx status, got {hop.get('status_code')}")
    else:
        fail("redirect_chain is empty despite redirect_count >= 1")

    if r.get("final_url") and r.get("final_url") != "http://google.com":
        ok("final_url differs from original (redirect was followed)")
    else:
        fail("final_url should differ from original after redirects")

    # --- 3. Redirect count matches chain length ---
    print("\n[TEST] 3. redirect_count == len(redirect_chain)")
    d = post("http://google.com")
    r = d.get("redirects", {})
    cnt = r.get("redirect_count", -1)
    chain_len = len(r.get("redirect_chain", []))
    print(f"  redirect_count={cnt}  len(chain)={chain_len}")
    if cnt == chain_len:
        ok("redirect_count equals len(redirect_chain)")
    else:
        fail("mismatch", f"count={cnt} len={chain_len}")

    # --- 4. Unreachable URL handled gracefully ---
    print("\n[TEST] 4. Unreachable URL redirect handling (invalid domain)")
    d = post("https://this-domain-definitely-does-not-exist-123456789.invalid")
    r = d.get("redirects", {})
    print(f"  redirect_count={r.get('redirect_count')}  error={r.get('error')}")
    if r.get("error"):
        ok("error field populated for unreachable URL")
    else:
        fail("expected error for unreachable URL")

    if r.get("redirect_count") == 0:
        ok("redirect_count is 0 for unreachable URL")
    else:
        fail("expected redirect_count=0 for unreachable URL", str(r.get("redirect_count")))

    # --- 5. max_redirects_hit field always present ---
    print("\n[TEST] 5. max_redirects_hit field is always present")
    for url in ["https://example.com", "https://this-domain-does-not-exist-xyz.invalid"]:
        d = post(url)
        r = d.get("redirects", {})
        if "max_redirects_hit" in r:
            ok(f"max_redirects_hit present for {url}")
        else:
            fail(f"max_redirects_hit missing for {url}")


def test_tls():
    section("PHASE 4 STEP 4 — TLS / SSL CERTIFICATE ANALYSIS")

    # --- 6. HTTPS site — TLS available and valid ---
    print("\n[TEST] 6. HTTPS site with valid TLS (https://google.com)")
    d = post("https://google.com")
    t = d.get("tls", {})
    print(f"  tls_available={t.get('tls_available')}  tls_valid={t.get('tls_valid')}  subject={t.get('subject')}  issuer={t.get('issuer')}  expired={t.get('expired')}  hostname_matches={t.get('hostname_matches')}  error={t.get('error')}")
    if t.get("tls_available") is True:
        ok("tls_available=True for HTTPS site")
    else:
        fail("tls_available should be True", str(t.get("error")))

    if t.get("tls_valid") is True:
        ok("tls_valid=True for trusted CA cert")
    else:
        fail("tls_valid should be True", str(t.get("error")))

    if t.get("subject"):
        ok(f"subject extracted: {t['subject']}")
    else:
        fail("subject should be populated")

    if t.get("issuer"):
        ok(f"issuer extracted: {t['issuer']}")
    else:
        fail("issuer should be populated")

    if t.get("not_after"):
        ok(f"not_after (expiry) present: {t['not_after']}")
    else:
        fail("not_after should be present")

    if t.get("expired") is False:
        ok("cert is not expired")
    elif t.get("expired") is None:
        fail("expired field is None — could not determine expiry")
    else:
        fail("cert appears expired (unexpected for google.com)")

    if t.get("hostname_matches") is True:
        ok("hostname_matches=True")
    else:
        fail("hostname_matches should be True", str(t.get("hostname_matches")))

    if isinstance(t.get("san"), list):
        ok(f"san is a list ({len(t['san'])} entries)")
    else:
        fail("san should be a list")

    # --- 7. Certificate info for example.com ---
    print("\n[TEST] 7. TLS cert metadata (https://example.com)")
    d = post("https://example.com")
    t = d.get("tls", {})
    print(f"  tls_available={t.get('tls_available')}  subject={t.get('subject')}  not_before={t.get('not_before')}  not_after={t.get('not_after')}")
    if t.get("tls_available"):
        ok("TLS available for example.com")
    else:
        fail("TLS should be available for example.com")
    if t.get("not_before") and t.get("not_after"):
        ok("not_before and not_after present")
    else:
        fail("validity window fields missing")

    # --- 8. HTTP URL → TLS not applicable ---
    print("\n[TEST] 8. HTTP URL — TLS should report not applicable")
    d = post("http://example.com")
    t = d.get("tls", {})
    print(f"  tls_available={t.get('tls_available')}  error={t.get('error')}")
    if t.get("tls_available") is False:
        ok("tls_available=False for plain HTTP URL")
    else:
        fail("tls_available should be False for HTTP")
    if t.get("error") and "not applicable" in t.get("error", "").lower():
        ok("error message explains TLS not applicable")
    else:
        fail("error should say TLS not applicable", str(t.get("error")))

    # --- 9. Unreachable URL — graceful TLS failure ---
    print("\n[TEST] 9. Unreachable URL — graceful TLS failure")
    d = post("https://this-domain-definitely-does-not-exist-123456789.invalid")
    t = d.get("tls", {})
    print(f"  tls_available={t.get('tls_available')}  error={t.get('error')}")
    if t.get("tls_available") is False:
        ok("tls_available=False for unreachable host")
    else:
        fail("tls_available should be False for unreachable host")
    if t.get("error"):
        ok(f"error captured: {t['error'][:60]}")
    else:
        fail("error should describe what went wrong")


def test_http_regression():
    section("PHASE 4 STEP 2 — HTTP REGRESSION")

    cases = [
        ("https://example.com", 200, True),
        ("https://google.com",  200, True),
    ]
    for url, expected_status, expect_headers in cases:
        print(f"\n[TEST] HTTP: {url}")
        d = post(url)
        h = d.get("http", {})
        print(f"  status={h.get('status_code')}  error={h.get('error')}")
        if h.get("status_code") == expected_status:
            ok(f"HTTP {expected_status} for {url}")
        else:
            fail(f"Expected {expected_status}", f"got {h.get('status_code')}")
        if expect_headers and h.get("headers"):
            ok("Response headers present")
        elif expect_headers:
            fail("Expected headers but got empty dict")

    print("\n[TEST] HTTP: Unreachable (graceful failure)")
    d = post("https://this-domain-definitely-does-not-exist-123456789.invalid")
    h = d.get("http", {})
    print(f"  status={h.get('status_code')}  error={h.get('error')}")
    if h.get("status_code") is None and h.get("error"):
        ok("Graceful failure for unreachable host")
    else:
        fail("Expected None status + error string", str(h))


def test_dns_regression():
    section("PHASE 4 STEP 1 — DNS REGRESSION")

    cases = [
        ("https://google.com",  True),
        ("https://example.com", True),
        ("https://this-domain-definitely-does-not-exist-123456789.invalid", False),
    ]
    for url, expect_resolved in cases:
        print(f"\n[TEST] DNS: {url}")
        d = post(url)
        dns = d.get("dns", {})
        print(f"  resolved={dns.get('resolved')}  ips={dns.get('ip_addresses')}  error={dns.get('error')}")
        if dns.get("resolved") == expect_resolved:
            ok(f"dns.resolved={expect_resolved}")
        else:
            fail(f"Expected resolved={expect_resolved}", f"got {dns.get('resolved')}")


def test_typosquat_regression():
    section("PHASE 3 — TYPOSQUATTING REGRESSION")

    cases = [
        ("https://microsoft.com",       False, None),
        ("https://micros0ft.com",        True,  "microsoft.com"),
        ("https://paypa1.com",           True,  "paypal.com"),
        ("https://microsoft-login.com",  True,  "microsoft.com"),
        ("https://example.com",          False, None),
    ]
    for url, expect_detected, expect_match in cases:
        print(f"\n[TEST] Typosquat: {url}")
        d = post(url)
        ty = d.get("typosquatting", {})
        print(f"  detected={ty.get('detected')}  matched={ty.get('matched_domain')}")
        if ty.get("detected") == expect_detected:
            ok(f"detected={expect_detected}")
        else:
            fail(f"Expected detected={expect_detected}", f"got {ty.get('detected')}")
        if expect_match and ty.get("matched_domain") != expect_match:
            fail(f"Expected matched_domain={expect_match}", f"got {ty.get('matched_domain')}")
        elif expect_match:
            ok(f"matched_domain={expect_match}")


def test_phase2_regression():
    section("PHASE 2 — HEURISTIC SCORING REGRESSION")

    cases = [
        {
            "url": "http://192.168.1.10/login",
            "expected_score": 50,
            "expected_level": "MEDIUM",
            "signals": {"ip_based": True, "suspicious_keywords": True},
        },
        {
            "url": "https://example.com:8080/login",
            "expected_score": 40,
            "expected_level": "MEDIUM",
            "signals": {"unusual_port": True, "suspicious_keywords": True},
        },
        {
            "url": "https://example.com/login%20page%3Fid%3D1",
            "expected_score": 35,
            "expected_level": "MEDIUM",
            "signals": {"encoded_characters": True, "suspicious_keywords": True},
        },
        {
            "url": "https://example.com",
            "expected_score": 0,
            "expected_level": "LOW",
            "signals": {},
        },
    ]
    for tc in cases:
        url = tc["url"]
        print(f"\n[TEST] Heuristics: {url}")
        d = post(url)
        print(f"  score={d.get('risk_score')}  level={d.get('risk_level')}")
        if d.get("risk_score") == tc["expected_score"]:
            ok(f"risk_score={tc['expected_score']}")
        else:
            fail(f"Expected score {tc['expected_score']}", f"got {d.get('risk_score')}")
        if d.get("risk_level") == tc["expected_level"]:
            ok(f"risk_level={tc['expected_level']}")
        else:
            fail(f"Expected level {tc['expected_level']}", f"got {d.get('risk_level')}")
        sigs = d.get("signals", {})
        for k, v in tc["signals"].items():
            if sigs.get(k) == v:
                ok(f"signal.{k}={v}")
            else:
                fail(f"signal.{k} expected {v}", f"got {sigs.get(k)}")


def test_malformed_rejection():
    section("MALFORMED URL REJECTION (Expected HTTP 400)")

    cases = [
        ("ftp://bad-scheme.com", "Unsupported scheme"),
        ("   ", "Empty URL"),
    ]
    for url, label in cases:
        print(f"\n[TEST] 400 rejection: {label} ({repr(url)})")
        passed, detail = expect_400(url)
        print(f"  detail={detail}")
        if passed:
            ok(f"HTTP 400 for {label}")
        else:
            fail(f"Expected 400 for {label}", detail)


# ─────────────────────────────────────────────────────────────────
# RUNNER
# ─────────────────────────────────────────────────────────────────

def main():
    print()
    print("=" * 72)
    print("  THREATLENS — PHASE 4 (STEPS 3 & 4) + FULL REGRESSION TEST SUITE")
    print("  Tests: Redirect Analysis · TLS Analysis · HTTP · DNS ·")
    print("         Typosquatting · Heuristics · Malformed URL Rejection")
    print("=" * 72)

    test_redirects()
    test_tls()
    test_http_regression()
    test_dns_regression()
    test_typosquat_regression()
    test_phase2_regression()
    test_malformed_rejection()

    print()
    print("=" * 72)
    total = PASS + FAIL
    print(f"  RESULTS: {PASS}/{total} tests passed")
    if FAIL == 0:
        print("  >>> ALL TESTS PASSED (100%) <<<")
    else:
        print(f"  >>> {FAIL} TEST(S) FAILED <<<")
        for f in FAILURES:
            print(f"       ✗  {f}")
    print("=" * 72)
    sys.exit(0 if FAIL == 0 else 1)


if __name__ == "__main__":
    main()
