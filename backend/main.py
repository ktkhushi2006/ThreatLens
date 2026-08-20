from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(
    title="ThreatLens API",
    version="1.0.0",
    description="ThreatLens Phishing & Malicious Link Risk Analysis API"
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

class AnalyzeResponse(BaseModel):
    url: str
    risk_score: int
    risk_level: str
    reasons: List[str]

@app.get("/")
def health_check():
    return {
        "service": "ThreatLens API",
        "status": "online",
        "phase": 1
    }

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_url(payload: AnalyzeRequest):
    raw_url = payload.url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="URL must not be empty")

    # Phase 1: Dummy analysis response proving React -> FastAPI pipeline
    return {
        "url": raw_url,
        "risk_score": 10,
        "risk_level": "LOW",
        "reasons": []
    }
