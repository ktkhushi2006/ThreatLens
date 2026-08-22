import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Server,
  ArrowRight,
  Code2,
  Globe,
  Radio,
  Zap,
  Check,
  XCircle,
  Network,
  Cpu
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const TEST_PRESETS = [
  {
    label: '1. Valid Domain (Example)',
    url: 'https://example.com',
    description: 'Expected: DNS Resolved (IPv4/IPv6)'
  },
  {
    label: '2. Valid Domain (Google)',
    url: 'https://google.com/login',
    description: 'Expected: DNS Resolved + Keyword flag'
  },
  {
    label: '3. Unresolvable / Invalid Domain',
    url: 'https://this-domain-definitely-does-not-exist-123456789.invalid',
    description: 'Expected: DNS Resolution Failed (handled gracefully)'
  },
  {
    label: '4. Typosquat (micros0ft)',
    url: 'https://micros0ft.com',
    description: 'Expected: Typosquat detected + DNS resolution'
  },
  {
    label: '5. IP Address + Login',
    url: 'http://192.168.1.10/login',
    description: 'Expected: IP-based signal + DNS self-resolution'
  },
  {
    label: '6. Combosquat (microsoft-login)',
    url: 'https://microsoft-login.com',
    description: 'Expected: Impersonation detected'
  }
];

export function App() {
  const [url, setUrl] = useState('https://example.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

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
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server responded with status ${response.status}`);
      }

      setResult(data);
      setBackendOnline(true);
    } catch (err) {
      console.error('Analysis request error:', err);
      setError(
        err.message.includes('Failed to fetch')
          ? 'Cannot connect to FastAPI backend at http://localhost:8000. Ensure uvicorn is running.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelStyles = (level) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/60',
          text: 'text-red-400',
          border: 'border-red-500/40',
          badgeBg: 'bg-red-500/20',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]',
          barColor: 'bg-red-500'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/60',
          text: 'text-orange-400',
          border: 'border-orange-500/40',
          badgeBg: 'bg-orange-500/20',
          glow: 'shadow-[0_0_15px_rgba(249,115,22,0.25)]',
          barColor: 'bg-orange-500'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/60',
          text: 'text-amber-400',
          border: 'border-amber-500/40',
          badgeBg: 'bg-amber-500/20',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
          barColor: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-emerald-950/60',
          text: 'text-emerald-400',
          border: 'border-emerald-500/40',
          badgeBg: 'bg-emerald-500/20',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]',
          barColor: 'bg-emerald-500'
        };
    }
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
                  PHASE 4.1: DNS
                </span>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                URL Heuristics, Typosquatting & DNS Analysis Engine
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
                FastAPI Engine:{' '}
                <span
                  className={
                    backendOnline === true
                      ? 'text-emerald-400 font-semibold'
                      : backendOnline === false
                      ? 'text-rose-400 font-semibold'
                      : 'text-amber-400'
                  }
                >
                  {backendOnline === true ? 'ACTIVE (Port 8000)' : backendOnline === false ? 'OFFLINE' : 'CHECKING...'}
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-3">
            <Network className="h-3.5 w-3.5 text-cyan-400" />
            Phase 4 — Step 1: DNS Resolution & Network Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analyze URL for DNS, Typosquatting & Risk Signals
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Combines rule-based URL heuristics, brand typosquatting detection, and live DNS IP address resolution.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="rounded-2xl bg-[#0E1524]/95 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
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
                  className="w-full rounded-xl bg-slate-950/90 py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none font-mono transition-all"
                  required
                />
              </div>
            </div>

            {/* Test Presets Grid */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Test Presets (DNS & Impersonation):
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Click to auto-fill
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {TEST_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUrl(preset.url);
                      setError(null);
                    }}
                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850 text-left transition-all group"
                  >
                    <p className="text-xs font-mono font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                      {preset.label}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                      {preset.url}
                    </p>
                  </button>
                ))}
              </div>
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
                    Performing DNS Lookup & Analysis...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analyze URL & DNS
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 flex items-start gap-3 text-xs font-mono animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-200 uppercase">Analysis Error</p>
                <p className="mt-1 text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Analysis Results Display */}
          {result && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-5 animate-in fade-in duration-300">
              {/* Header with Risk Level and Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    Calculated Risk Verdict
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-extrabold uppercase tracking-wider border ${getRiskLevelStyles(result.risk_level).bg} ${getRiskLevelStyles(result.risk_level).text} ${getRiskLevelStyles(result.risk_level).border} ${getRiskLevelStyles(result.risk_level).glow}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                      {result.risk_level} RISK
                    </span>
                    <span className="text-xl font-mono font-black text-white">
                      {result.risk_score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                    </span>
                  </div>
                </div>

                <div className="sm:w-48">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Threat Severity</span>
                    <span>{result.risk_score}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${getRiskLevelStyles(result.risk_level).barColor}`}
                      style={{ width: `${Math.max(result.risk_score, 4)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Phase 4 Step 1: DNS Resolution Telemetry Card */}
              {result.dns && (
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-cyan-400" />
                      <h4 className="font-bold text-white uppercase tracking-wider text-xs">
                        DNS Network Resolution
                      </h4>
                    </div>
                    {result.dns.resolved ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="h-3 w-3" /> RESOLVED ({result.dns.ip_addresses?.length || 0} IPs)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> RESOLUTION FAILED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block">Target Hostname</span>
                      <span className="text-slate-200 font-semibold truncate block mt-0.5">
                        {result.dns.hostname || 'N/A'}
                      </span>
                    </div>

                    <div className="sm:col-span-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block">Discovered IP Addresses</span>
                      {result.dns.resolved && result.dns.ip_addresses?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {result.dns.ip_addresses.map((ip, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-[11px]"
                            >
                              {ip}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-rose-400 text-[11px] mt-0.5 block">
                          {result.dns.error || 'No IP addresses could be resolved'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 3: Typosquatting / Brand Impersonation Banner */}
              <div
                className={`p-4 rounded-xl border font-mono text-xs ${
                  result.typosquatting?.detected
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {result.typosquatting?.detected ? (
                      <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-white">
                          {result.typosquatting?.detected
                            ? 'Possible Brand Impersonation / Typosquatting'
                            : 'Authentic / No Typosquatting Detected'}
                        </span>
                        {result.typosquatting?.detected && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/40">
                            Similarity: {Math.round((result.typosquatting.similarity || 0) * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
                        {result.typosquatting?.detected
                          ? result.typosquatting.reason
                          : 'Domain does not exhibit high similarity or typosquatting patterns against trusted domains.'}
                      </p>
                    </div>
                  </div>

                  {result.typosquatting?.detected && result.typosquatting.matched_domain && (
                    <div className="shrink-0 text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 block">Targeting Brand</span>
                      <span className="text-xs font-bold text-cyan-300">
                        {result.typosquatting.matched_domain}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Analyzed Target Details */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-slate-400">Analyzed Target:</span>
                <span className="text-cyan-300 font-semibold break-all">{result.url}</span>
              </div>

              {/* Detected Heuristic Signals Grid (Phase 2) */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                  Heuristic Signals Assessment:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  {/* Signal 1: IP-based */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      result.signals?.ip_based
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span>IP-Based Hostname</span>
                    {result.signals?.ip_based ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                        <AlertTriangle className="h-3 w-3" /> Flagged (+30)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <Check className="h-3 w-3" /> Clean (0)
                      </span>
                    )}
                  </div>

                  {/* Signal 2: Unusual Port */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      result.signals?.unusual_port
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span>Non-Standard Port</span>
                    {result.signals?.unusual_port ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                        <AlertTriangle className="h-3 w-3" /> Flagged (+20)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <Check className="h-3 w-3" /> Clean (0)
                      </span>
                    )}
                  </div>

                  {/* Signal 3: Suspicious Keywords */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      result.signals?.suspicious_keywords
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span>Auth/Security Keywords</span>
                    {result.signals?.suspicious_keywords ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                        <AlertTriangle className="h-3 w-3" /> Flagged (+20)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <Check className="h-3 w-3" /> Clean (0)
                      </span>
                    )}
                  </div>

                  {/* Signal 4: Encoded Characters */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      result.signals?.encoded_characters
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span>Percent-Encoding Obfuscation</span>
                    {result.signals?.encoded_characters ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                        <AlertTriangle className="h-3 w-3" /> Flagged (+15)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <Check className="h-3 w-3" /> Clean (0)
                      </span>
                    )}
                  </div>

                  {/* Signal 5: Unusual Subdomain */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between sm:col-span-2 ${
                      result.signals?.unusual_subdomain
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span>Deep Subdomain Hierarchy (≥4 parts)</span>
                    {result.signals?.unusual_subdomain ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                        <AlertTriangle className="h-3 w-3" /> Flagged (+20)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <Check className="h-3 w-3" /> Clean (0)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reasons / Explanation List */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
                <span className="text-slate-400 block font-semibold">
                  Detected Explanations ({result.reasons?.length || 0}):
                </span>
                {result.reasons && result.reasons.length > 0 ? (
                  <ul className="space-y-1.5">
                    {result.reasons.map((reason, idx) => (
                      <li
                        key={idx}
                        className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 flex items-start gap-2 text-[11px]"
                      >
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 text-[11px] py-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>No threat indicators triggered. URL exhibits standard benign characteristics.</span>
                  </div>
                )}
              </div>

              {/* Raw JSON Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showRawJson ? 'Hide Raw JSON Response' : 'View Raw FastAPI JSON Response'}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs font-mono text-slate-600">
        ThreatLens Platform • Phase 4 (Step 1): DNS Resolution & Heuristics • React + FastAPI
      </footer>
    </div>
  );
}

export default App;
