import urllib.request
import urllib.error
import json

test_urls = [
    ("1. Clean Domain", "https://example.com"),
    ("2. IP + Login", "http://192.168.1.10/login"),
    ("3. Unusual Port + Login", "https://example.com:8080/login"),
    ("4. Keywords (account, verify)", "https://example.com/account/verify"),
    ("5. Percent-Encoded Characters", "https://example.com/login%20page%3Fid%3D1"),
    ("6. Deep Subdomains + Update", "https://login.verify.security.auth.example.com/update")
]

print("=" * 60)
print("TESTING THREATLENS PHASE 2 HEURISTIC ENGINE")
print("=" * 60)

for label, url in test_urls:
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/analyze",
        data=json.dumps({"url": url}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            print(f"\n[PASS] {label}: {url}")
            print(f"  -> Risk Score : {data['risk_score']} / 100 ({data['risk_level']})")
            print(f"  -> Signals    : {data['signals']}")
            print(f"  -> Reasons    : {data['reasons']}")
    except urllib.error.HTTPError as e:
        print(f"\n[FAIL] {label}: {e.code} - {e.read().decode('utf-8')}")

# Test 7: Malformed URL Handling
print("\n" + "=" * 60)
print("TESTING MALFORMED URL (Expected 400 Bad Request)")
print("=" * 60)

malformed_url = "ftp://invalid-protocol.com/file"
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/analyze",
    data=json.dumps({"url": malformed_url}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req) as response:
        print(f"[UNEXPECTED] Received {response.status}")
except urllib.error.HTTPError as e:
    err_body = json.loads(e.read().decode("utf-8"))
    print(f"[PASS] Malformed URL rejected gracefully with HTTP {e.code}:")
    print(f"  -> Error Detail: {err_body.get('detail')}")

# Test 8: Empty URL Handling
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/analyze",
    data=json.dumps({"url": "   "}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req) as response:
        print(f"[UNEXPECTED] Received {response.status}")
except urllib.error.HTTPError as e:
    err_body = json.loads(e.read().decode("utf-8"))
    print(f"[PASS] Empty URL rejected gracefully with HTTP {e.code}:")
    print(f"  -> Error Detail: {err_body.get('detail')}")
