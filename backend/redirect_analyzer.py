"""
ThreatLens - Redirect Chain Analysis Module (Phase 4 — Step 3)

Follows HTTP redirects manually, one hop at a time, to guarantee that
every 3xx response is captured regardless of Python/OS urllib internals.

Design:
- redirect_follow=False disables automatic following inside urllib so we
  see every raw 3xx status ourselves.
- We extract the Location header, resolve relative URLs, and loop.
- A counter cap (MAX_REDIRECTS) prevents infinite loops.
- All network failures are caught and returned gracefully.
"""

import urllib.request
import urllib.error
import urllib.parse
import ssl
from typing import Dict, Any, List, Optional

DEFAULT_TIMEOUT = 5.0   # seconds per hop
MAX_REDIRECTS   = 10    # safety cap

# 3xx codes we treat as redirects (Location-bearing)
REDIRECT_CODES = {301, 302, 303, 307, 308}


# ── shared SSL context (permissive so we can follow even broken-cert sites) ──

def _ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


# ── opener that does NOT follow redirects automatically ──────────────────────

class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Prevents urllib from following redirects so we can capture each hop."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Return None → urllib sees no redirect → raises HTTPError with the
        # 3xx status code, which our loop then handles.
        return None


def _make_opener() -> urllib.request.OpenerDirector:
    opener = urllib.request.OpenerDirector()
    opener.addheaders = [
        ("User-Agent",
         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
         "AppleWebKit/537.36 (KHTML, like Gecko) "
         "Chrome/122.0.0.0 Safari/537.36 (ThreatLens-Security-Engine/1.0)"),
        ("Accept", "text/html,application/xhtml+xml,*/*;q=0.8"),
    ]
    opener.add_handler(_NoRedirectHandler())
    opener.add_handler(urllib.request.UnknownHandler())
    opener.add_handler(urllib.request.HTTPHandler())
    opener.add_handler(urllib.request.HTTPDefaultErrorHandler())
    opener.add_handler(urllib.request.HTTPSHandler(context=_ssl_context()))
    return opener


# ── public API ────────────────────────────────────────────────────────────────

def analyze_redirects(
    url: str,
    timeout: float = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    """
    Manually follows the redirect chain for *url* and returns:

    {
        "original_url":      str,
        "final_url":         str,
        "redirect_count":    int,
        "redirect_chain":    [{"from_url": str, "status_code": int, "to_url": str}, ...],
        "max_redirects_hit": bool,
        "error":             str | None
    }
    """
    clean_url = (url or "").strip()
    if not clean_url:
        return _failure(clean_url, "Empty or missing URL")

    opener = _make_opener()
    chain: List[Dict[str, Any]] = []
    current_url = clean_url
    max_redirects_hit = False

    for _ in range(MAX_REDIRECTS + 1):
        try:
            req = urllib.request.Request(current_url)
            with opener.open(req, timeout=timeout) as resp:
                status = resp.status

                # Some urllib builds return 3xx as a success object instead of
                # raising HTTPError when our NoRedirectHandler returns None.
                # Handle that here so we always capture the hop.
                if status in REDIRECT_CODES:
                    location = resp.headers.get("Location", "")
                    if not location:
                        return {
                            "original_url":      clean_url,
                            "final_url":         current_url,
                            "redirect_count":    len(chain),
                            "redirect_chain":    chain,
                            "max_redirects_hit": False,
                            "error":             f"Redirect {status} with no Location header",
                        }
                    to_url = urllib.parse.urljoin(current_url, location)
                    chain.append({
                        "from_url":    current_url,
                        "status_code": status,
                        "to_url":      to_url,
                    })
                    if len(chain) >= MAX_REDIRECTS:
                        return {
                            "original_url":      clean_url,
                            "final_url":         to_url,
                            "redirect_count":    len(chain),
                            "redirect_chain":    chain,
                            "max_redirects_hit": True,
                            "error":             f"Maximum redirect limit ({MAX_REDIRECTS}) reached",
                        }
                    current_url = to_url
                    continue  # follow next hop

                # Normal 2xx (or other non-redirect) — this is the final destination
                final_url = resp.geturl() or current_url
                return {
                    "original_url":      clean_url,
                    "final_url":         final_url,
                    "redirect_count":    len(chain),
                    "redirect_chain":    chain,
                    "max_redirects_hit": max_redirects_hit,
                    "error":             None,
                }

        except urllib.error.HTTPError as e:
            if e.code in REDIRECT_CODES:
                # Capture this hop
                location = e.headers.get("Location", "")
                if not location:
                    # Redirect with no Location — treat as terminal
                    return {
                        "original_url":      clean_url,
                        "final_url":         current_url,
                        "redirect_count":    len(chain),
                        "redirect_chain":    chain,
                        "max_redirects_hit": False,
                        "error":             f"Redirect {e.code} with no Location header",
                    }

                to_url = urllib.parse.urljoin(current_url, location)
                chain.append({
                    "from_url":    current_url,
                    "status_code": e.code,
                    "to_url":      to_url,
                })

                # Check cap AFTER appending so we record the hop
                if len(chain) >= MAX_REDIRECTS:
                    max_redirects_hit = True
                    return {
                        "original_url":      clean_url,
                        "final_url":         to_url,
                        "redirect_count":    len(chain),
                        "redirect_chain":    chain,
                        "max_redirects_hit": True,
                        "error":             f"Maximum redirect limit ({MAX_REDIRECTS}) reached",
                    }

                current_url = to_url
                continue  # follow next hop

            else:
                # Non-redirect HTTP error at the final hop (404, 403, 500 …)
                final_url = e.geturl() if (hasattr(e, "geturl") and e.geturl()) else current_url
                return {
                    "original_url":      clean_url,
                    "final_url":         final_url,
                    "redirect_count":    len(chain),
                    "redirect_chain":    chain,
                    "max_redirects_hit": False,
                    "error":             None,   # not an error — just a non-200 response
                }

        except urllib.error.URLError as e:
            return _failure(clean_url, f"Connection failed: {e.reason}", chain)

        except Exception as e:
            return _failure(clean_url, f"Redirect analysis failed: {str(e)}", chain)

    # Should only reach here if the loop exhausts (shouldn't, but be safe)
    return {
        "original_url":      clean_url,
        "final_url":         current_url,
        "redirect_count":    len(chain),
        "redirect_chain":    chain,
        "max_redirects_hit": True,
        "error":             f"Maximum redirect limit ({MAX_REDIRECTS}) reached",
    }


def _failure(
    url: str,
    error: str,
    partial_chain: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    return {
        "original_url":      url,
        "final_url":         url,
        "redirect_count":    len(partial_chain) if partial_chain else 0,
        "redirect_chain":    partial_chain or [],
        "max_redirects_hit": False,
        "error":             error,
    }
