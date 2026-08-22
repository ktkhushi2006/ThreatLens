"""
ThreatLens - TLS / SSL Certificate Analysis Module (Phase 4 — Step 4)

Establishes a real TLS handshake to the target hostname and extracts
certificate metadata:
  - Subject / Common Name
  - Issuer / Organization
  - Not-Before / Not-After validity window
  - Whether the certificate's hostname matches the requested hostname
  - Whether TLS is present and the certificate is currently valid

Design notes:
- Certificate verification is ENABLED so we can report real validity status.
  We catch ssl.SSLCertVerificationError and report tls_valid=False.
- HTTP (non-TLS) URLs are handled by returning tls_available=False immediately.
- All network/TLS errors are caught and returned gracefully; the API never
  crashes because of a TLS probe.
"""

import ssl
import socket
import datetime
from typing import Dict, Any, Optional


DEFAULT_TIMEOUT  = 5.0   # seconds for TLS handshake
DEFAULT_TLS_PORT = 443


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _parse_cert_field(cert_dict: dict, key: str) -> Optional[str]:
    """
    ssl.getpeercert() returns RDN sequences as nested tuples such as:
        (( ('commonName', 'example.com'), ), ...)
    This helper flattens a top-level field (e.g. 'subject') into a plain dict
    and returns the value for the requested key, or None.
    """
    raw = cert_dict.get(key, ())
    flat: Dict[str, str] = {}
    for rdn in raw:
        for attr_name, attr_value in rdn:
            flat[attr_name] = attr_value
    return flat.get("commonName") or flat.get("organizationName") or (
        next(iter(flat.values()), None) if flat else None
    )


def _parse_san(cert_dict: dict) -> list:
    """Extract Subject Alternative Names from the cert dict."""
    sans = []
    for entry in cert_dict.get("subjectAltName", []):
        type_, value = entry
        if type_.lower() == "dns":
            sans.append(value)
    return sans


def _parse_datetime(dt_str: Optional[str]) -> Optional[str]:
    """Convert ssl cert date string (e.g. 'Aug 15 00:00:00 2024 GMT') to ISO-8601."""
    if not dt_str:
        return None
    try:
        dt = datetime.datetime.strptime(dt_str, "%b %d %H:%M:%S %Y %Z")
        return dt.isoformat() + "Z"
    except ValueError:
        return dt_str  # return raw string if parsing fails


def _is_cert_expired(not_after_iso: Optional[str]) -> Optional[bool]:
    """Return True if the certificate has expired, False if still valid, None if unknown."""
    if not not_after_iso:
        return None
    try:
        expiry = datetime.datetime.fromisoformat(not_after_iso.rstrip("Z"))
        return datetime.datetime.utcnow() > expiry
    except ValueError:
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def analyze_tls(scheme: str, hostname: str, port: int = DEFAULT_TLS_PORT,
                timeout: float = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Performs a real TLS handshake against hostname:port and returns cert info.

    Return shape:
    {
        "tls_available":     bool,
        "tls_valid":         bool,
        "subject":           str | None,
        "issuer":            str | None,
        "san":               [str, ...],
        "not_before":        str | None,   # ISO-8601
        "not_after":         str | None,   # ISO-8601
        "expired":           bool | None,
        "hostname_matches":  bool | None,
        "error":             str | None
    }
    """
    # HTTP targets have no TLS — report clearly instead of failing
    if scheme.lower() != "https":
        return {
            "tls_available":    False,
            "tls_valid":        False,
            "subject":          None,
            "issuer":           None,
            "san":              [],
            "not_before":       None,
            "not_after":        None,
            "expired":          None,
            "hostname_matches": None,
            "error":            "TLS not applicable for non-HTTPS URLs"
        }

    clean_host = hostname.strip()
    if not clean_host:
        return _tls_failure("Empty hostname provided")

    # ── 1. Try with full certificate verification (reports real validity) ──────
    ctx_strict = ssl.create_default_context()   # verify=True, check_hostname=True

    try:
        with socket.create_connection((clean_host, port), timeout=timeout) as raw_sock:
            with ctx_strict.wrap_socket(raw_sock, server_hostname=clean_host) as tls_sock:
                cert = tls_sock.getpeercert()
                return _build_result(cert, clean_host, tls_valid=True, error=None)

    except ssl.SSLCertVerificationError as e:
        # Certificate exists but failed verification — still extract info
        return _extract_unverified(clean_host, port, timeout, error=str(e))

    except ssl.SSLError as e:
        return _tls_failure(f"TLS handshake error: {str(e)}")

    except socket.timeout:
        return _tls_failure(f"TLS connection timed out after {timeout}s")

    except OSError as e:
        return _tls_failure(f"Network error: {str(e)}")

    except Exception as e:
        return _tls_failure(f"TLS analysis failed: {str(e)}")


def _extract_unverified(hostname: str, port: int, timeout: float,
                         error: str) -> Dict[str, Any]:
    """
    When strict verification fails, reconnect with check_hostname=False
    to still extract certificate metadata for reporting purposes.
    """
    try:
        ctx_loose = ssl.create_default_context()
        ctx_loose.check_hostname = False
        ctx_loose.verify_mode = ssl.CERT_NONE

        with socket.create_connection((hostname, port), timeout=timeout) as raw_sock:
            with ctx_loose.wrap_socket(raw_sock, server_hostname=hostname) as tls_sock:
                cert = tls_sock.getpeercert()
                result = _build_result(cert, hostname, tls_valid=False, error=error)
                return result
    except Exception as e2:
        return _tls_failure(f"Cert verification failed ({error}); metadata extraction also failed: {str(e2)}")


def _build_result(cert: dict, hostname: str, tls_valid: bool,
                  error: Optional[str]) -> Dict[str, Any]:
    """Build the structured TLS result from a parsed cert dict."""
    if not cert:
        return _tls_failure("TLS handshake succeeded but no certificate was returned")

    subject  = _parse_cert_field(cert, "subject")
    issuer   = _parse_cert_field(cert, "issuer")
    san      = _parse_san(cert)
    not_before = _parse_datetime(cert.get("notBefore"))
    not_after  = _parse_datetime(cert.get("notAfter"))
    expired    = _is_cert_expired(not_after)

    # Hostname match: check both CN and SAN
    hostname_matches: Optional[bool] = None
    try:
        ssl.match_hostname(cert, hostname)
        hostname_matches = True
    except ssl.CertificateError:
        hostname_matches = False
    except Exception:
        hostname_matches = None

    return {
        "tls_available":    True,
        "tls_valid":        tls_valid,
        "subject":          subject,
        "issuer":           issuer,
        "san":              san,
        "not_before":       not_before,
        "not_after":        not_after,
        "expired":          expired,
        "hostname_matches": hostname_matches,
        "error":            error
    }


def _tls_failure(error: str) -> Dict[str, Any]:
    """Build a graceful failure result."""
    return {
        "tls_available":    False,
        "tls_valid":        False,
        "subject":          None,
        "issuer":           None,
        "san":              [],
        "not_before":       None,
        "not_after":        None,
        "expired":          None,
        "hostname_matches": None,
        "error":            error
    }
