import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [latestResult, setLatestResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      setBackendOnline(res.ok);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    checkHealth();
    loadHistory();
    loadAnalytics();
  }, [checkHealth, loadHistory, loadAnalytics]);

  const analyzeUrl = useCallback(async (url, source = "URL") => {
    if (!url?.trim()) return null;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), source }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server responded with status ${response.status}`);
      }

      // Normalize result
      const result = {
        ...data,
        analyzedAt: new Date().toISOString(),
      };

      setLatestResult(result);
      setBackendOnline(true);
      
      // Refresh history and analytics from backend
      loadHistory();
      loadAnalytics();

      return result;
    } catch (err) {
      const msg = err.message.includes('Failed to fetch')
        ? 'Cannot connect to FastAPI backend at http://localhost:8000. Ensure uvicorn is running.'
        : err.message;
      setError(msg);
      setBackendOnline(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadHistory, loadAnalytics]);

  const loadAnalysisById = useCallback(async (id) => {
    if (!id) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${id}`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const rec = await response.json();
      
      const normalized = {
        url: rec.url,
        risk_score: rec.risk_score,
        risk_level: rec.risk_level,
        analysis_id: rec.id,
        source: rec.analysis_type,
        analyzedAt: rec.created_at,
        reasons: (rec.signals || []).map(s => s.signal_name),
        signals: {
          ip_based: (rec.signals || []).some(s => s.signal_name === 'ip_based_hostname'),
          unusual_port: (rec.signals || []).some(s => s.signal_name === 'unusual_port'),
          suspicious_keywords: (rec.signals || []).some(s => s.signal_name === 'suspicious_keywords'),
          encoded_characters: (rec.signals || []).some(s => s.signal_name === 'encoded_characters'),
          unusual_subdomain: (rec.signals || []).some(s => s.signal_name === 'unusual_subdomain'),
        },
        typosquatting: { detected: false },
        dns: {
          hostname: rec.url,
          resolved: rec.dns_resolved ?? false,
          ip_addresses: [],
        },
        tls: {
          tls_available: rec.tls_valid != null,
          tls_valid: rec.tls_valid ?? false,
        },
        http: { status_code: null },
        redirects: {
          original_url: rec.url,
          final_url: rec.url,
          redirect_count: (rec.redirects || []).length,
          redirect_chain: (rec.redirects || []).map(r => ({
            from_url: r.source_url,
            to_url: r.destination_url,
            status_code: r.status_code,
          })),
        },
        risk: {
          score: rec.risk_score,
          level: rec.risk_level,
          db_available: true,
          triggered_rules: (rec.signals || []).map(s => ({
            rule_name: s.signal_name,
            signal_key: s.signal_name,
            score: s.score_contribution,
            category: '',
            description: '',
          })),
          explanation: 'Loaded from PostgreSQL analysis history.',
        },
      };
      
      setLatestResult(normalized);
      return normalized;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearHistory = useCallback(() => setHistory([]), []);

  const value = {
    latestResult,
    history,
    analytics,
    loading,
    error,
    backendOnline,
    analyzeUrl,
    checkHealth,
    loadHistory,
    loadAnalytics,
    loadAnalysisById,
    clearError,
    clearHistory,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}

export default AnalysisContext;
