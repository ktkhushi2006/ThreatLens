"""
ThreatLens - DNS Analysis Module (Phase 4 — Step 1)

Performs standard DNS lookups to resolve hostnames into their associated IPv4/IPv6
addresses, gracefully catching resolution errors and network failures.
"""

import socket
from typing import Dict, Any, List, Optional


def resolve_dns(hostname: str) -> Dict[str, Any]:
    """
    Resolves a hostname to its corresponding IP addresses.
    
    Returns a structured dictionary:
      - hostname: The extracted domain or host
      - resolved: Boolean indicating whether DNS returned at least one IP
      - ip_addresses: List of discovered IP strings
      - error: Optional descriptive error message if resolution failed
    """
    clean_host = (hostname or "").strip().lower()

    if not clean_host:
        return {
            "hostname": "",
            "resolved": False,
            "ip_addresses": [],
            "error": "Empty or missing hostname"
        }

    try:
        # socket.getaddrinfo handles IPv4, IPv6, and raw IP addresses
        addr_info = socket.getaddrinfo(clean_host, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        
        # Deduplicate while preserving order
        discovered_ips: List[str] = []
        for item in addr_info:
            sockaddr = item[4]
            ip = sockaddr[0]
            if ip and ip not in discovered_ips:
                discovered_ips.append(ip)

        if not discovered_ips:
            return {
                "hostname": clean_host,
                "resolved": False,
                "ip_addresses": [],
                "error": "DNS resolution failed"
            }

        return {
            "hostname": clean_host,
            "resolved": True,
            "ip_addresses": discovered_ips
        }

    except socket.gaierror:
        return {
            "hostname": clean_host,
            "resolved": False,
            "ip_addresses": [],
            "error": "DNS resolution failed"
        }
    except Exception as e:
        return {
            "hostname": clean_host,
            "resolved": False,
            "ip_addresses": [],
            "error": f"DNS resolution failed: {str(e)}"
        }
