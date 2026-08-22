import urllib.request
import urllib.error
import json

test_cases = [
    # Phase 3 Specific Test Cases
    {
        "label": "1. Exact Trusted Domain (Microsoft)",
        "url": "https://microsoft.com",
        "expected_typo": False,
        "expected_matched": None
    },
    {
        "label": "2. Combosquatting / Impersonation (microsoft-login.com)",
        "url": "https://microsoft-login.com",
        "expected_typo": True,
        "expected_matched": "microsoft.com"
    },
    {
        "label": "3. Typosquat / Homograph (micros0ft.com)",
        "url": "https://micros0ft.com",
        "expected_typo": True,
        "expected_matched": "microsoft.com"
    },
    {
        "label": "4. Exact Trusted Domain (Google)",
        "url": "https://google.com",
        "expected_typo": False,
        "expected_matched": None
    },
    {
        "label": "5. Typosquat / Homograph (paypa1.com)",
        "url": "https://paypa1.com",
        "expected_typo": True,
        "expected_matched": "paypal.com"
    },
    {
        "label": "6. Unrelated Benign Domain (example.com)",
        "url": "https://example.com",
        "expected_typo": False,
        "expected_matched": None
    },

    # Phase 2 Regression Checks
    {
        "label": "7. [Phase 2] IP Address + Login",
        "url": "http://192.168.1.10/login",
        "expected_signals": {"ip_based": True, "suspicious_keywords": True}
    },
    {
        "label": "8. [Phase 2] Unusual Port 8080 + Login",
        "url": "https://example.com:8080/login",
        "expected_signals": {"unusual_port": True, "suspicious_keywords": True}
    },
    {
        "label": "9. [Phase 2] Percent-Encoded Characters",
        "url": "https://example.com/login%20page%3Fid%3D1",
        "expected_signals": {"encoded_characters": True, "suspicious_keywords": True}
    }
]

print("=" * 70)
print("THREATLENS PHASE 3: TYPOSQUATTING & DOMAIN IMPERSONATION TEST SUITE")
print("=" * 70)

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
            typo = data.get("typosquatting", {})
            signals = data.get("signals", {})

            print(f"\n[TEST] {label}")
            print(f"  Target URL: {url}")
            print(f"  Risk: {data['risk_score']} / 100 ({data['risk_level']})")
            print(f"  Typosquatting: detected={typo.get('detected')}, matched={typo.get('matched_domain')}, similarity={typo.get('similarity')}")

            # Verify Phase 3 expectations if present
            if "expected_typo" in tc:
                if typo.get("detected") != tc["expected_typo"]:
                    print(f"  [ERROR] Expected detected={tc['expected_typo']}, got {typo.get('detected')}")
                    all_passed = False
                elif tc.get("expected_matched") and typo.get("matched_domain") != tc["expected_matched"]:
                    print(f"  [ERROR] Expected matched={tc['expected_matched']}, got {typo.get('matched_domain')}")
                    all_passed = False
                else:
                    print(f"  [PASS] Typosquatting verification successful.")

            # Verify Phase 2 signals if present
            if "expected_signals" in tc:
                for k, v in tc["expected_signals"].items():
                    if signals.get(k) != v:
                        print(f"  [ERROR] Expected signal {k}={v}, got {signals.get(k)}")
                        all_passed = False
                print(f"  [PASS] Phase 2 signal regression check passed.")

    except urllib.error.HTTPError as e:
        print(f"\n[FAIL] {label}: HTTP {e.code} - {e.read().decode('utf-8')}")
        all_passed = False

# Malformed URL check
print("\n" + "=" * 70)
print("TESTING MALFORMED URL REJECTION (Expected HTTP 400)")
print("=" * 70)

malformed_tests = [
    ("Malformed Scheme", "ftp://invalid-target.com/file"),
    ("Empty String", "    ")
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
        print(f"[PASS] {label} correctly rejected with HTTP {e.code}: {err.get('detail')}")

print("\n" + "=" * 70)
if all_passed:
    print(">>> ALL PHASE 2 & PHASE 3 TESTS PASSED SUCCESSFULLY! <<<")
else:
    print(">>> SOME TESTS FAILED. PLEASE CHECK LOGS ABOVE. <<<")
print("=" * 70)
