from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional

try:
    from backend.analyzer import analyze_url_heuristics
except ImportError:
    from analyzer import analyze_url_heuristics

app = FastAPI(
    title="ThreatLens API",
    version="3.0.0",
    description="ThreatLens Phishing & Malicious Link Risk Analysis API - Phase 3 Domain Typosquatting Engine"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    url: str

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

class AnalyzeResponse(BaseModel):
    url: str
    risk_score: int
    risk_level: str
    reasons: List[str]
    signals: SignalsSchema
    typosquatting: TyposquattingSchema

@app.get("/")
def health_check():
    return {
        "service": "ThreatLens API",
        "status": "online",
        "phase": 3,
        "engine": "URL Heuristic & Typosquatting Analysis Engine"
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
