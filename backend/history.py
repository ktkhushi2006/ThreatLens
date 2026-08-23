from sqlalchemy import text
from typing import Dict, Any, List
try:
    from backend.database import get_connection
except ImportError:
    from database import get_connection
import json
import datetime

def save_analysis(result: Dict[str, Any]) -> int:
    """Save analysis result to PostgreSQL and return analysis_id"""
    with get_connection() as conn:
        # Insert analysis
        insert_analysis = text("""
            INSERT INTO analyses (url, risk_score, risk_level, analysis_type, dns_resolved, tls_valid)
            VALUES (:url, :risk_score, :risk_level, :analysis_type, :dns_resolved, :tls_valid)
            RETURNING id
        """)
        
        dns_resolved = result.get('dns', {}).get('resolved', False)
        tls_valid = result.get('tls', {}).get('tls_valid', False)
        
        res = conn.execute(insert_analysis, {
            "url": result.get("url"),
            "risk_score": result.get("risk", {}).get("score", 0),
            "risk_level": result.get("risk", {}).get("level", "LOW"),
            "analysis_type": "URL",
            "dns_resolved": dns_resolved,
            "tls_valid": tls_valid
        })
        analysis_id = res.scalar()

        # Insert triggered rules as signals
        triggered_rules = result.get("risk", {}).get("triggered_rules", [])
        if triggered_rules:
            insert_signal = text("""
                INSERT INTO analysis_signals (analysis_id, signal_name, signal_value, score_contribution)
                VALUES (:analysis_id, :signal_name, :signal_value, :score)
            """)
            for rule in triggered_rules:
                conn.execute(insert_signal, {
                    "analysis_id": analysis_id,
                    "signal_name": rule.get("rule_name"),
                    "signal_value": True,
                    "score": rule.get("score", 0)
                })

        # Insert redirects
        redirects = result.get("redirects", {}).get("redirect_chain", [])
        if redirects:
            insert_redirect = text("""
                INSERT INTO redirects (analysis_id, hop_number, source_url, destination_url, status_code)
                VALUES (:analysis_id, :hop_number, :source_url, :destination_url, :status_code)
            """)
            for i, hop in enumerate(redirects):
                conn.execute(insert_redirect, {
                    "analysis_id": analysis_id,
                    "hop_number": i + 1,
                    "source_url": hop.get("from_url"),
                    "destination_url": hop.get("to_url"),
                    "status_code": hop.get("status_code")
                })
        
        conn.commit()
        return analysis_id

def get_recent_analyses(limit: int = 50) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        query = text("""
            SELECT id, url, risk_score, risk_level, analysis_type, dns_resolved, tls_valid, created_at
            FROM analyses
            ORDER BY created_at DESC
            LIMIT :limit
        """)
        rows = conn.execute(query, {"limit": limit})
        
        results = []
        for row in rows:
            results.append({
                "id": row.id,
                "url": row.url,
                "risk_score": row.risk_score,
                "risk_level": row.risk_level,
                "analysis_type": row.analysis_type,
                "dns_resolved": row.dns_resolved,
                "tls_valid": row.tls_valid,
                "created_at": row.created_at.isoformat() if row.created_at else None
            })
        return results

def get_analytics() -> Dict[str, Any]:
    with get_connection() as conn:
        total = conn.execute(text("SELECT COUNT(*) FROM analyses")).scalar() or 0
        high = conn.execute(text("SELECT COUNT(*) FROM analyses WHERE risk_level IN ('HIGH', 'CRITICAL')")).scalar() or 0
        medium = conn.execute(text("SELECT COUNT(*) FROM analyses WHERE risk_level = 'MEDIUM'")).scalar() or 0
        low = conn.execute(text("SELECT COUNT(*) FROM analyses WHERE risk_level = 'LOW'")).scalar() or 0
        
        # Threat categories from signals
        cat_rows = conn.execute(text("""
            SELECT signal_name, COUNT(*) as count 
            FROM analysis_signals 
            GROUP BY signal_name 
            ORDER BY count DESC LIMIT 10
        """))
        categories = [{"name": row.signal_name, "count": row.count} for row in cat_rows]

        return {
            "total_scans": total,
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
            "threat_categories": categories
        }

def get_analysis(analysis_id: int) -> Dict[str, Any]:
    with get_connection() as conn:
        row = conn.execute(text("SELECT * FROM analyses WHERE id = :id"), {"id": analysis_id}).fetchone()
        if not row:
            return None
            
        result = {
            "id": row.id,
            "url": row.url,
            "risk_score": row.risk_score,
            "risk_level": row.risk_level,
            "analysis_type": row.analysis_type,
            "dns_resolved": row.dns_resolved,
            "tls_valid": row.tls_valid,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "signals": [],
            "redirects": []
        }
        
        sig_rows = conn.execute(text("SELECT * FROM analysis_signals WHERE analysis_id = :id"), {"id": analysis_id})
        for sig in sig_rows:
            result["signals"].append({
                "signal_name": sig.signal_name,
                "signal_value": sig.signal_value,
                "score_contribution": sig.score_contribution
            })
            
        red_rows = conn.execute(text("SELECT * FROM redirects WHERE analysis_id = :id ORDER BY hop_number"), {"id": analysis_id})
        for red in red_rows:
            result["redirects"].append({
                "hop_number": red.hop_number,
                "source_url": red.source_url,
                "destination_url": red.destination_url,
                "status_code": red.status_code
            })
            
        return result

def delete_analysis(analysis_id: int) -> bool:
    with get_connection() as conn:
        res = conn.execute(text("DELETE FROM analyses WHERE id = :id"), {"id": analysis_id})
        conn.commit()
        return res.rowcount > 0
