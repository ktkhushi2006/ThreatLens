from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

try:
    from backend.analyzer import analyze_url_heuristics
except ImportError:
    from analyzer import analyze_url_heuristics

app = FastAPI(
    title="ThreatLens API",
    version="4.4.0",
    description=(
        "ThreatLens Phishing & Malicious Link Risk Analysis API — "
        "Phase 4: URL Heuristics, Typosquatting, DNS, HTTP, "
        "Redirect Chain & TLS Analysis"
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request ───────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    url: str


# ── Sub-schemas ───────────────────────────────────────────────────────────────

class SignalsSchema(BaseModel):
    ip_based: bool
    unusual_port: bool
    suspicious_keywords: bool
    encoded_characters: bool
    unusual_subdomain: bool


class TyposquattingSchema(BaseModel):
    detected: bool
    matched_domain: Optional[str] = None
    similarity: float = 0.0
    reason: Optional[str] = None


class DnsSchema(BaseModel):
    hostname: str
    resolved: bool
    ip_addresses: List[str] = []
    error: Optional[str] = None


class HttpSchema(BaseModel):
    status_code: Optional[int] = None
    headers: Dict[str, str] = {}
    final_url: Optional[str] = None
    error: Optional[str] = None


class RedirectHopSchema(BaseModel):
    from_url: str
    status_code: int
    to_url: str


class RedirectSchema(BaseModel):
    original_url: str
    final_url: str
    redirect_count: int
    redirect_chain: List[RedirectHopSchema] = []
    max_redirects_hit: bool = False
    error: Optional[str] = None


class TlsSchema(BaseModel):
    tls_available: bool
    tls_valid: bool
    subject: Optional[str] = None
    issuer: Optional[str] = None
    san: List[str] = []
    not_before: Optional[str] = None
    not_after: Optional[str] = None
    expired: Optional[bool] = None
    hostname_matches: Optional[bool] = None
    error: Optional[str] = None


# ── Response ──────────────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    url: str
    risk_score: int
    risk_level: str
    reasons: List[str]
    signals: SignalsSchema
    typosquatting: TyposquattingSchema
    dns: DnsSchema
    http: HttpSchema
    redirects: RedirectSchema
    tls: TlsSchema


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {
        "service": "ThreatLens API",
        "status":  "online",
        "phase":   "4.4",
        "engine":  (
            "URL Heuristics, Typosquatting, DNS, "
            "HTTP, Redirect Chain & TLS Analysis"
        )
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_url(payload: AnalyzeRequest):
    raw_url = payload.url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    try:
        result = analyze_url_heuristics(raw_url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")
