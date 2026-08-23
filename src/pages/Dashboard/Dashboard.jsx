import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Shield, AlertTriangle, Globe, QrCode, Mail,
  ArrowRight, Activity, CheckCircle2, RefreshCw, Clock,
  Server, Database, Zap, TrendingUp, BarChart3, ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';

function getRiskBadgeClass(level) {
  switch (level) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'MEDIUM': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
}

function StatCard({ icon: Icon, label, value, iconColor = 'text-cyan-400', borderColor = 'border-cyan-500/20' }) {
  return (
    <div className={`rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl flex items-center gap-4 hover:${borderColor} transition-all`}>
      <div className="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0">
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-mono font-black text-white">{value}</p>
        <p className="text-xs font-mono text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

const QUICK_PRESETS = [
  { label: 'Clean URL', url: 'https://example.com', risk: 'LOW' },
  { label: 'IP Login', url: 'http://192.168.1.10/login', risk: 'MEDIUM' },
  { label: 'Typosquat', url: 'https://micros0ft.com', risk: 'HIGH' },
  { label: 'Non-Std Port', url: 'https://example.com:8080/login', risk: 'MEDIUM' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { analyzeUrl, latestResult, history, loading, error, backendOnline, checkHealth } = useAnalysis();
  const [scanUrl, setScanUrl] = useState('');

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleQuickScan = async (e) => {
    e?.preventDefault();
    if (!scanUrl.trim()) return;
    const result = await analyzeUrl(scanUrl);
    if (result) navigate('/analyze');
  };

  const handlePresetScan = async (url) => {
    setScanUrl(url);
    const result = await analyzeUrl(url);
    if (result) navigate('/analyze');
  };

  // Compute stats from real history
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  history.forEach(item => {
    const l = item.risk?.level ?? item.risk_level ?? 'LOW';
    if (counts[l] !== undefined) counts[l]++;
  });
  const highRiskCount = counts.HIGH + counts.CRITICAL;

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Hero: URL Quick Scanner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1322] via-[#0F1829] to-[#0A101D] p-6 sm:p-8 border border-slate-800/90 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
                <Shield className="h-3.5 w-3.5" /> ThreatLens — Phase 6 Dashboard
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Analyze a Suspicious Threat
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
                Heuristics · Typosquatting · DNS · HTTP · TLS · Redirect · PostgreSQL Risk Engine
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={checkHealth}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono transition-all hover:border-slate-600"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${
                  backendOnline === true ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                  : backendOnline === false ? 'bg-rose-500'
                  : 'bg-amber-400'
                }`} />
                <span className={backendOnline === true ? 'text-emerald-400' : backendOnline === false ? 'text-rose-400' : 'text-amber-400'}>
                  {backendOnline === true ? 'Engine Online' : backendOnline === false ? 'Offline' : 'Checking...'}
                </span>
              </button>
            </div>
          </div>

          {/* URL Input */}
          <form onSubmit={handleQuickScan} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/70 pointer-events-none" />
              <input
                type="text"
                value={scanUrl}
                onChange={e => setScanUrl(e.target.value)}
                placeholder="https://example.com or http://192.168.1.1/login..."
                className="w-full rounded-xl bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none font-mono transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !scanUrl.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] font-mono whitespace-nowrap"
            >
              {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Scanning...</> : <><Search className="h-4 w-4" /> Analyze URL</>}
            </button>
          </form>

          {/* Quick Presets */}
          <div className="mt-4 flex flex-wrap gap-2 items-center pt-3 border-t border-slate-800/60">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Quick Presets:</span>
            {QUICK_PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePresetScan(p.url)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors disabled:opacity-50"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  p.risk === 'HIGH' ? 'bg-rose-400'
                  : p.risk === 'MEDIUM' ? 'bg-amber-400'
                  : 'bg-emerald-400'
                }`} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Globe, label: 'URL Scan', desc: 'Full multi-vector URL analysis', path: '/analyze', color: 'text-cyan-400', border: 'hover:border-cyan-500/40' },
          { icon: QrCode, label: 'QR Scanner', desc: 'Extract & analyze QR code URLs', path: '/qr-scanner', color: 'text-violet-400', border: 'hover:border-violet-500/40' },
          { icon: Mail, label: 'Email Analyzer', desc: 'Extract links from email content', path: '/email-analyzer', color: 'text-emerald-400', border: 'hover:border-emerald-500/40' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className={`rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 text-left shadow-xl transition-all ${action.border} group`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-mono font-bold text-white group-hover:text-slate-100">{action.label}</p>
                <p className="text-[10px] font-mono text-slate-500">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Risk Overview Stats */}
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-cyan-400" /> Session Risk Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Total Scans" value={history.length} iconColor="text-cyan-400" />
          <StatCard icon={ShieldAlert} label="High / Critical" value={highRiskCount} iconColor="text-rose-400" />
          <StatCard icon={AlertTriangle} label="Medium Risk" value={counts.MEDIUM} iconColor="text-amber-400" />
          <StatCard icon={ShieldCheck} label="Low Risk / Clean" value={counts.LOW} iconColor="text-emerald-400" />
        </div>
      </div>

      {/* Recent Scans + Latest Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Latest Result */}
        <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Latest Analysis</h3>
            </div>
            {latestResult && (
              <button
                onClick={() => navigate('/analyze')}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                View full <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {latestResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Globe className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="flex-1 text-xs font-mono text-slate-200 truncate">{latestResult.url}</span>
                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getRiskBadgeClass(latestResult.risk?.level ?? latestResult.risk_level ?? 'LOW')}`}>
                  {latestResult.risk?.level ?? latestResult.risk_level ?? 'LOW'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                  <span className="text-slate-500">Score</span>
                  <span className="text-white font-bold">{latestResult.risk?.score ?? latestResult.risk_score ?? 0}/100</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                  <span className="text-slate-500">DNS</span>
                  <span className={latestResult.dns?.resolved ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {latestResult.dns?.resolved ? '✓ OK' : '✗ Fail'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                  <span className="text-slate-500">TLS</span>
                  <span className={
                    !latestResult.tls?.tls_available ? 'text-slate-500'
                    : latestResult.tls?.tls_valid ? 'text-emerald-400 font-bold'
                    : 'text-rose-400 font-bold'
                  }>
                    {!latestResult.tls?.tls_available ? 'N/A' : latestResult.tls?.tls_valid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                  <span className="text-slate-500">Redirects</span>
                  <span className="text-cyan-300 font-bold">{latestResult.redirects?.redirect_count ?? 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => navigate('/report')} className="flex-1 text-xs font-mono py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all">
                  Security Report
                </button>
                <button onClick={() => navigate('/technical')} className="flex-1 text-xs font-mono py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all">
                  Technical
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Shield className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-500">No analysis yet. Scan a URL to see results.</p>
            </div>
          )}
        </div>

        {/* Recent Scan History */}
        <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Recent Scans</h3>
            </div>
            {history.length > 0 && (
              <button onClick={() => navigate('/history')} className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="space-y-2">
              {history.slice(0, 6).map((item, i) => {
                const level = item.risk?.level ?? item.risk_level ?? 'LOW';
                const score = item.risk?.score ?? item.risk_score ?? 0;
                return (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all">
                    <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="flex-1 text-[11px] font-mono text-slate-300 truncate">{item.url}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">{score}</span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getRiskBadgeClass(level)}`}>
                      {level}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Clock className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-500">No scans yet. History will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Engine Status */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Server className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Engine Status</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'FastAPI', status: backendOnline, name: 'FastAPI Backend' },
            { label: 'PostgreSQL', status: latestResult?.risk?.db_available ?? (backendOnline === true ? true : null), name: 'Risk Rules DB' },
            { label: 'DNS Engine', status: true, name: 'DNS Resolver' },
            { label: 'HTTP Probe', status: true, name: 'HTTP Analyzer' },
            { label: 'TLS Scan', status: true, name: 'TLS Inspector' },
            { label: 'Heuristics', status: true, name: 'Heuristic Engine' },
          ].map(({ label, status, name }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className={`h-2.5 w-2.5 rounded-full ${
                status === true ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                : status === false ? 'bg-rose-500'
                : 'bg-slate-600'
              }`} />
              <p className="text-[10px] font-mono font-bold text-slate-200">{label}</p>
              <p className="text-[9px] font-mono text-slate-500">{
                status === true ? 'Active' : status === false ? 'Offline' : 'Unknown'
              }</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
