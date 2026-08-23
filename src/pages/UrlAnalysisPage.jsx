import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Search, RefreshCw, AlertCircle, CheckCircle2,
  AlertTriangle, ArrowRight, Database, FileText, Network,
  Globe, Zap, Check, XCircle, Activity
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

const TEST_PRESETS = [
  { label: '1. Benign Clean URL', url: 'https://example.com', desc: 'Expected: LOW Risk • Clean' },
  { label: '2. IP + Login Keywords', url: 'http://192.168.1.10/login', desc: 'Expected: MEDIUM • IP & Auth' },
  { label: '3. Brand Typosquat', url: 'https://micros0ft.com', desc: 'Expected: HIGH • Typosquatting' },
  { label: '4. Combosquatting', url: 'https://microsoft-login.com', desc: 'Expected: Typosquatting + Auth' },
  { label: '5. Non-Standard Port', url: 'https://example.com:8080/login?auth=true', desc: 'Expected: Unusual Port' },
  { label: '6. Unreachable Domain', url: 'https://this-domain-definitely-does-not-exist-123456789.invalid', desc: 'Expected: DNS Failure' },
];

function getRiskStyles(level) {
  switch (level) {
    case 'CRITICAL': return { text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-950/40', bar: 'from-red-600 to-rose-500' };
    case 'HIGH': return { text: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-950/40', bar: 'from-orange-600 to-amber-500' };
    case 'MEDIUM': return { text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-950/30', bar: 'from-amber-600 to-yellow-500' };
    default: return { text: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-950/20', bar: 'from-emerald-600 to-teal-400' };
  }
}

export function UrlAnalysisPage() {
  const navigate = useNavigate();
  const { latestResult, loading, error, analyzeUrl, clearError } = useAnalysis();
  const [url, setUrl] = useState('https://example.com');

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    clearError();
    await analyzeUrl(url);
  }, [url, analyzeUrl, clearError]);

  const result = latestResult;
  const riskScore = result?.risk?.score ?? result?.risk_score ?? 0;
  const riskLevel = result?.risk?.level ?? result?.risk_level ?? 'LOW';
  const triggeredRules = result?.risk?.triggered_rules || [];
  const riskExplanation = result?.risk?.explanation || '';
  const dbAvailable = result?.risk?.db_available ?? false;
  const styles = getRiskStyles(riskLevel);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" />
            URL Threat Scanner
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Multi-vector analysis: Heuristics · Typosquatting · DNS · HTTP · TLS · Redirects
          </p>
        </div>
        {result && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/report')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              Security Report
            </button>
            <button
              onClick={() => navigate('/technical')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all"
            >
              <Network className="h-3.5 w-3.5 text-cyan-400" />
              Technical Analysis
            </button>
          </div>
        )}
      </div>

      {/* Scan Input */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 sm:p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-cyan-400" /> Target URL for Analysis
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400/70 pointer-events-none" />
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com or http://192.168.1.1/login"
                className="w-full rounded-xl bg-slate-950/95 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none font-mono transition-all"
                required
              />
            </div>
          </div>

          {/* Test Presets */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">Quick Test Presets:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TEST_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setUrl(p.url); clearError(); }}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 text-left transition-all group"
                >
                  <p className="text-xs font-mono font-semibold text-slate-200 group-hover:text-cyan-300 truncate">{p.label}</p>
                  <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">{p.url}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] font-mono"
          >
            {loading ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing Threat Vectors...</>
            ) : (
              <><Shield className="h-4 w-4" /> Analyze URL & Run Risk Engine</>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start gap-3 text-xs font-mono">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200 uppercase tracking-wider mb-0.5">Analysis Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Risk Verdict */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Score */}
            <div className={`rounded-2xl bg-[#0D1322]/95 border p-5 shadow-xl ${styles.border}`}>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" /> Risk Verdict
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
                  <Database className="h-3 w-3 text-cyan-400" />
                  {dbAvailable ? 'PostgreSQL' : 'Fallback'}
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono font-black uppercase tracking-wider border ${styles.bg} ${styles.text} ${styles.border}`}>
                  <span className="h-2 w-2 rounded-full bg-current animate-ping" />
                  {riskLevel} RISK
                </span>
                <div className="text-right">
                  <span className="text-3xl font-mono font-black text-white">{riskScore}</span>
                  <span className="text-xs text-slate-500 font-mono"> / 100</span>
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-1000 rounded-full bg-gradient-to-r ${styles.bar}`}
                    style={{ width: `${Math.max(riskScore, 3)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-600">
                  <span>0</span><span>30</span><span>60</span><span>80+</span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                {riskExplanation || 'No risk indicators detected.'}
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => navigate('/report')} className="flex-1 text-xs font-mono py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all">
                  Full Report →
                </button>
                <button onClick={() => navigate('/technical')} className="flex-1 text-xs font-mono py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all">
                  Technical →
                </button>
              </div>
            </div>

            {/* Triggered Rules */}
            <div className="lg:col-span-2 rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Triggered Risk Rules
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{triggeredRules.length} Rules</span>
              </div>

              {triggeredRules.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {triggeredRules.map((rule, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 font-mono">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                            {rule.category || 'SIGNAL'}
                          </span>
                          <span className="text-xs font-bold text-slate-200">{rule.rule_name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{rule.description}</p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-extrabold text-xs">
                        +{rule.score}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2 font-mono">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Zero Rules Triggered</p>
                  <p className="text-[11px] text-slate-400">All heuristics and network checks passed.</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between">
                <span>Source: PostgreSQL <code className="text-cyan-400">risk_rules</code></span>
                <span>Total: <span className="text-cyan-400 font-bold">{riskScore}</span> / 100</span>
              </div>
            </div>
          </div>

          {/* Heuristic Signals + Typosquatting Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Signals */}
            <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl font-mono">
              <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-slate-800">
                <Zap className="h-4 w-4 text-cyan-400" />
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Heuristic Signals</h4>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { key: 'ip_based', label: 'Raw IP Hostname' },
                  { key: 'unusual_port', label: 'Non-Standard Port' },
                  { key: 'suspicious_keywords', label: 'Phishing Keywords' },
                  { key: 'encoded_characters', label: 'Percent-Encoded Obfuscation' },
                  { key: 'unusual_subdomain', label: 'Deep Subdomain Hierarchy' },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      result.signals?.[key]
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span>{label}</span>
                    {result.signals?.[key] ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                        <AlertTriangle className="h-3 w-3" /> Flagged
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                        <Check className="h-3 w-3" /> Clean
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Typosquatting */}
            <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl font-mono">
              <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-slate-800">
                <Globe className="h-4 w-4 text-cyan-400" />
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Brand Impersonation</h4>
              </div>

              <div className={`p-4 rounded-xl border space-y-3 ${
                result.typosquatting?.detected
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  {result.typosquatting?.detected
                    ? <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    : <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  }
                  <span className="font-bold uppercase text-xs text-white">
                    {result.typosquatting?.detected ? 'Typosquatting Detected' : 'No Brand Impersonation'}
                  </span>
                  {result.typosquatting?.detected && (
                    <span className="ml-auto px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/30 font-bold">
                      {Math.round((result.typosquatting.similarity || 0) * 100)}% match
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {result.typosquatting?.reason || 'Domain clear of brand impersonation patterns.'}
                </p>
                {result.typosquatting?.matched_domain && (
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between text-xs">
                    <span className="text-slate-400">Targeted Brand:</span>
                    <span className="text-cyan-300 font-bold">{result.typosquatting.matched_domain}</span>
                  </div>
                )}
              </div>

              {/* DNS quick summary */}
              <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">DNS Resolution</span>
                {result.dns?.resolved ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> {result.dns.ip_addresses?.length || 0} IPs resolved
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> DNS Failed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="rounded-2xl border border-dashed border-slate-700/60 p-12 text-center space-y-3">
          <Shield className="h-12 w-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-mono text-sm">Enter a URL above to start threat analysis</p>
          <p className="text-slate-600 font-mono text-xs">Results will appear here and be shared across Report and Technical pages</p>
        </div>
      )}
    </div>
  );
}

export default UrlAnalysisPage;
