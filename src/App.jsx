import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Server,
  ArrowRight,
  Code2,
  Globe,
  Radio,
  ExternalLink
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Check FastAPI backend connection on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    const targetUrl = url.trim();
    if (!targetUrl) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // POST /api/analyze to FastAPI backend
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setBackendOnline(true);
    } catch (err) {
      console.error('Analysis request error:', err);
      setError(
        err.message.includes('Failed to fetch')
          ? 'Cannot connect to FastAPI backend at http://localhost:8000. Ensure the backend server is running.'
          : err.message
      );
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const setSampleUrl = (sample) => {
    setUrl(sample);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#0C121E]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wider text-white font-mono">
                  THREAT<span className="text-cyan-400">LENS</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  PHASE 1
                </span>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Phishing & Malicious Link Risk Analysis
              </p>
            </div>
          </div>

          {/* Backend Status Indicator */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={checkBackendHealth}
              title="Click to re-check backend connection"
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-400 animate-pulse'
                    : backendOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300">
                FastAPI:{' '}
                <span
                  className={
                    backendOnline === true
                      ? 'text-emerald-400 font-semibold'
                      : backendOnline === false
                      ? 'text-rose-400 font-semibold'
                      : 'text-amber-400'
                  }
                >
                  {backendOnline === true ? 'ONLINE (8000)' : backendOnline === false ? 'OFFLINE' : 'CHECKING...'}
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:py-16 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            Phase 1 Integration Test: React ↔ FastAPI
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Analyze URL for Phishing & Malicious Risk
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Send a URL to the FastAPI backend at <code className="text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">POST /api/analyze</code> and receive real-time risk telemetry.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="rounded-2xl bg-[#0E1524]/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label htmlFor="url-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                Target URL or Domain
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Globe className="h-5 w-5 text-cyan-400" />
                </div>
                <input
                  id="url-input"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-xl bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none font-mono transition-all"
                  required
                />
              </div>
            </div>

            {/* Sample URLs */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider">Try Samples:</span>
              <button
                type="button"
                onClick={() => setSampleUrl('https://example.com')}
                className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
              >
                https://example.com
              </button>
              <button
                type="button"
                onClick={() => setSampleUrl('https://micros0ft-verify-secure.co/login')}
                className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
              >
                https://micros0ft-verify-secure.co/login
              </button>
              <button
                type="button"
                onClick={() => setSampleUrl('https://github.com/security')}
                className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
              >
                https://github.com/security
              </button>
            </div>

            {/* Analyze Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] font-mono"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending Request to FastAPI...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analyze URL
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 flex items-start gap-3 text-xs font-mono animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-200 uppercase">Analysis Request Failed</p>
                <p className="mt-1 text-red-300/90">{error}</p>
                {backendOnline === false && (
                  <p className="mt-2 text-slate-400">
                    Tip: Start the backend by running <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">uvicorn backend.main:app --reload --port 8000</code> in your terminal.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    FastAPI Response Received
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  HTTP 200 OK
                </span>
              </div>

              {/* Analysis Overview Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <span className="text-slate-400">Target URL:</span>
                  <span className="font-semibold text-cyan-300 break-all">{result.url}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Level:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
                      result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL'
                        ? 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                        : result.risk_level === 'MEDIUM'
                        ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {result.risk_level}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-bold text-white text-sm">{result.risk_score} / 100</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        result.risk_score > 70
                          ? 'bg-rose-500'
                          : result.risk_score > 30
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(result.risk_score, 5)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-slate-400 block mb-1.5">Detected Reasons / Flags:</span>
                  {result.reasons && result.reasons.length > 0 ? (
                    <ul className="space-y-1">
                      {result.reasons.map((reason, idx) => (
                        <li key={idx} className="p-1.5 rounded bg-slate-900 text-rose-300 border border-rose-900/40 text-[11px]">
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">
                      [] (No threat indicators reported in Phase 1 dummy response)
                    </p>
                  )}
                </div>
              </div>

              {/* Raw JSON Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showRawJson ? 'Hide Raw JSON Payload' : 'View Raw FastAPI JSON Response'}
                </button>

                {showRawJson && (
                  <pre className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phase 1 Contract & Pipeline Telemetry Box */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 font-mono text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <span>Endpoint Contract: <code className="text-slate-200">POST http://localhost:8000/api/analyze</code></span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>React</span>
            <ArrowRight className="h-3 w-3 text-cyan-500" />
            <span>FastAPI</span>
            <ArrowRight className="h-3 w-3 text-cyan-500" />
            <span>JSON</span>
            <ArrowRight className="h-3 w-3 text-cyan-500" />
            <span>UI Render</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs font-mono text-slate-600">
        ThreatLens Platform • Phase 1 Core Pipeline Test • React + Vite + FastAPI
      </footer>
    </div>
  );
}

export default App;
