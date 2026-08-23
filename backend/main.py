from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import logging

try:
    from backend.analyzer import analyze_url_heuristics
    from backend.schema import create_phase7_tables
    from backend.history import save_analysis, get_recent_analyses, get_analytics
    from backend.risk_rules_schema import create_and_seed_tables
except ImportError:
    from analyzer import analyze_url_heuristics
    from schema import create_phase7_tables
    from history import save_analysis, get_recent_analyses, get_analytics
    from risk_rules_schema import create_and_seed_tables

logger = logging.getLogger(__name__)

app = FastAPI(
    title="ThreatLens API",
    version="6.0.0",
    description="ThreatLens Phishing & Malicious Link Risk Analysis API - Phase 6/7"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    try:
        create_and_seed_tables()
        create_phase7_tables()
        logger.info("Database schemas initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

# ── Request ───────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    url: str

# ── Sub-schemas ───────────────────────────────────────────────────────────────
# (Keeping exact schemas as requested to not break frontend)

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

class TriggeredRuleSchema(BaseModel):
    rule_name: str
    signal_key: str
    score: int
    category: str = ""
    description: str = ""

class RiskSchema(BaseModel):
    score: int
    level: str
    triggered_rules: List[TriggeredRuleSchema] = []
    db_available: bool
    explanation: str = ""

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
    risk: RiskSchema
    analysis_id: Optional[int] = None

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {
        "service": "ThreatLens API",
        "status":  "online",
        "phase":   "7.0",
        "engine":  "PostgreSQL-backed Risk Engine & Analytics"
    }

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_url(payload: AnalyzeRequest):
    raw_url = payload.url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    try:
        result = analyze_url_heuristics(raw_url)
        
        # Phase 7: Persist analysis
        analysis_id = None
        try:
            analysis_id = save_analysis(result)
            result['analysis_id'] = analysis_id
        except Exception as db_err:
            logger.error(f"Failed to persist analysis: {db_err}")
            
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")

@app.get("/api/history")
def get_history():
    try:
        return get_recent_analyses()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/history/{analysis_id}")
def get_history_detail(analysis_id: int):
    try:
        from backend.history import get_analysis
        res = get_analysis(analysis_id)
        if not res:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/history/{analysis_id}")
def delete_history(analysis_id: int):
    try:
        from backend.history import delete_analysis
        success = delete_analysis(analysis_id)
        if not success:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/analytics")
def get_analytics_data():
    try:
        return get_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
