"""
ThreatLens - HTTP/HTTPS Response Analysis Module (Phase 4 — Step 2)

Performs safe HTTP/HTTPS requests to inspect server status codes, response headers,
and final response URLs while safely managing timeouts and network errors.
"""

import urllib.request
import urllib.error
import ssl
from typing import Dict, Any, Optional

DEFAULT_TIMEOUT = 5.0  # seconds


def analyze_http(url: str, timeout: float = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Performs an HTTP/HTTPS probe against the target URL.

    Returns:
    {
        "status_code": int or None,
        "headers": dict of lowercase header keys and string values,
        "final_url": str or None,
        "error": str or None
    }
    """
    clean_url = (url or "").strip()
    if not clean_url:
        return {
            "status_code": None,
            "headers": {},
            "final_url": None,
            "error": "Empty or missing URL"
        }

    # Standard browser-style user-agent to prevent automated bot drops while identifying ThreatLens
    request_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36 (ThreatLens-Security-Engine/1.0)"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }

    req = urllib.request.Request(clean_url, headers=request_headers)

    # Permissive SSL context: probe can inspect targets even if SSL cert is self-signed/expired
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
            status_code = response.status
            final_url = response.geturl()
            res_headers = {k.lower(): v for k, v in response.headers.items()}

            return {
                "status_code": status_code,
                "headers": res_headers,
                "final_url": final_url,
                "error": None
            }

    except urllib.error.HTTPError as e:
        # Received an HTTP error response (e.g. 401, 403, 404, 500)
        res_headers = {k.lower(): v for k, v in e.headers.items()} if e.headers else {}
        return {
            "status_code": e.code,
            "headers": res_headers,
            "final_url": e.geturl() if hasattr(e, "geturl") else clean_url,
            "error": f"HTTP {e.code}: {e.reason}"
        }

    except urllib.error.URLError as e:
        # Connection failed (e.g., unreachable host, DNS failure, connection refused)
        return {
            "status_code": None,
            "headers": {},
            "final_url": None,
            "error": f"Connection failed: {str(e.reason)}"
        }

    except TimeoutError:
        return {
            "status_code": None,
            "headers": {},
            "final_url": None,
            "error": f"Connection timed out after {timeout}s"
        }

    except Exception as e:
        return {
            "status_code": None,
            "headers": {},
            "final_url": None,
            "error": f"HTTP request failed: {str(e)}"
        }
