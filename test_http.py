import urllib.request
import urllib.error
import json

test_cases = [
    # 1. Phase 4 Step 2 HTTP/HTTPS Tests
    {
        "label": "1. Reachable Target (example.com)",
        "url": "https://example.com",
        "expected_http_status": 200,
        "expected_dns_resolved": True
    },
    {
        "label": "2. Reachable Target (google.com)",
        "url": "https://google.com",
        "expected_http_status": 200,
        "expected_dns_resolved": True
    },
    {
        "label": "3. Unreachable Target (invalid domain)",
        "url": "https://this-domain-definitely-does-not-exist-123456789.invalid",
        "expected_http_failed": True,
        "expected_dns_resolved": False
    },

    # 2. Phase 4 Step 1 DNS Regression Tests
    {
        "label": "4. [DNS Regression] Valid Hostname DNS Discovery",
        "url": "https://google.com",
        "expected_dns_resolved": True
    },

    # 3. Phase 3 Typosquatting Regression Tests
    {
        "label": "5. [Phase 3 Regression] Exact Trusted Domain (Microsoft)",
        "url": "https://microsoft.com",
        "expected_typo": False
    },
    {
        "label": "6. [Phase 3 Regression] Typosquat Domain (micros0ft.com)",
        "url": "https://micros0ft.com",
        "expected_typo": True,
        "expected_matched": "microsoft.com"
    },
    {
        "label": "7. [Phase 3 Regression] Typosquat Domain (paypa1.com)",
        "url": "https://paypa1.com",
        "expected_typo": True,
        "expected_matched": "paypal.com"
    },
    {
        "label": "8. [Phase 3 Regression] Combosquat Domain (microsoft-login.com)",
        "url": "https://microsoft-login.com",
        "expected_typo": True,
        "expected_matched": "microsoft.com"
    },

    # 4. Phase 2 Heuristics Regression Tests
    {
        "label": "9. [Phase 2 Regression] Raw IP Address + Login",
        "url": "http://192.168.1.10/login",
        "expected_signals": {"ip_based": True, "suspicious_keywords": True}
    },
    {
        "label": "10. [Phase 2 Regression] Non-Standard Port 8080 + Login",
        "url": "https://example.com:8080/login",
        "expected_signals": {"unusual_port": True, "suspicious_keywords": True}
    },
    {
        "label": "11. [Phase 2 Regression] Percent-Encoded Characters",
        "url": "https://example.com/login%20page%3Fid%3D1",
        "expected_signals": {"encoded_characters": True, "suspicious_keywords": True}
    }
]

print("=" * 80)
print("THREATLENS PHASE 4 (STEP 2): HTTP/HTTPS ANALYSIS & FULL REGRESSION TEST SUITE")
print("=" * 80)

all_passed = True

for tc in test_cases:
    url = tc["url"]
    label = tc["label"]
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/analyze",
        data=json.dumps({"url": url}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            http = data.get("http", {})
            dns = data.get("dns", {})
            typo = data.get("typosquatting", {})
            signals = data.get("signals", {})

            print(f"\n[TEST] {label}")
            print(f"  Target URL    : {url}")
            print(f"  Risk Verdict  : {data['risk_score']} / 100 ({data['risk_level']})")
            print(f"  HTTP Response : status={http.get('status_code')}, error={http.get('error')}, server={http.get('headers', {}).get('server')}")
            print(f"  DNS Status    : resolved={dns.get('resolved')}, ips={dns.get('ip_addresses')}")
            print(f"  Typosquatting : detected={typo.get('detected')}, matched={typo.get('matched_domain')}")

            # Verify HTTP expectations
            if "expected_http_status" in tc:
                if http.get("status_code") != tc["expected_http_status"]:
                    print(f"  [ERROR] Expected http.status_code={tc['expected_http_status']}, got {http.get('status_code')}")
                    all_passed = False
                elif not http.get("headers"):
                    print(f"  [ERROR] Expected HTTP headers, got empty headers dict")
                    all_passed = False
                else:
                    print(f"  [PASS] HTTP response analysis verified successfully.")

            if tc.get("expected_http_failed"):
                if http.get("status_code") is not None or not http.get("error"):
                    print(f"  [ERROR] Expected HTTP failure, got status={http.get('status_code')}")
                    all_passed = False
                else:
                    print(f"  [PASS] HTTP failure handled gracefully without crashing.")

            # Verify DNS expectations
            if "expected_dns_resolved" in tc:
                if dns.get("resolved") != tc["expected_dns_resolved"]:
                    print(f"  [ERROR] Expected dns.resolved={tc['expected_dns_resolved']}, got {dns.get('resolved')}")
                    all_passed = False
                else:
                    print(f"  [PASS] DNS status verified.")

            # Verify Typosquatting expectations
            if "expected_typo" in tc:
                if typo.get("detected") != tc["expected_typo"]:
                    print(f"  [ERROR] Expected typo.detected={tc['expected_typo']}, got {typo.get('detected')}")
                    all_passed = False
                elif tc.get("expected_matched") and typo.get("matched_domain") != tc["expected_matched"]:
                    print(f"  [ERROR] Expected matched={tc['expected_matched']}, got {typo.get('matched_domain')}")
                    all_passed = False
                else:
                    print(f"  [PASS] Phase 3 typosquatting verified.")

            # Verify Phase 2 signals
            if "expected_signals" in tc:
                for k, v in tc["expected_signals"].items():
                    if signals.get(k) != v:
                        print(f"  [ERROR] Expected signal {k}={v}, got {signals.get(k)}")
                        all_passed = False
                print(f"  [PASS] Phase 2 signals verified.")

    except urllib.error.HTTPError as e:
        print(f"\n[FAIL] {label}: HTTP {e.code} - {e.read().decode('utf-8')}")
        all_passed = False

# Malformed URL verification
print("\n" + "=" * 80)
print("TESTING MALFORMED URL REJECTION (Expected HTTP 400)")
print("=" * 80)

malformed_tests = [
    ("Unsupported Protocol", "ftp://invalid-target.com/file"),
    ("Empty String Input", "    ")
]

for label, m_url in malformed_tests:
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/analyze",
        data=json.dumps({"url": m_url}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[FAIL] {label}: Expected 400, got {resp.status}")
            all_passed = False
    except urllib.error.HTTPError as e:
        err = json.loads(e.read().decode("utf-8"))
        print(f"[PASS] {label} rejected gracefully with HTTP {e.code}: {err.get('detail')}")

print("\n" + "=" * 80)
if all_passed:
    print(">>> ALL HTTP, DNS, TYPOSQUATTING & REGRESSION TESTS PASSED (100%) <<<")
else:
    print(">>> SOME TESTS FAILED. PLEASE CHECK LOGS ABOVE. <<<")
print("=" * 80)
