import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, Filter, Globe, ArrowRight, Inbox, Trash2 } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

function getRiskBadgeClass(level) {
  switch (level) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'MEDIUM': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { history, clearHistory, analyzeUrl } = useAnalysis();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filtered = history.filter(item => {
    const matchSearch = !search || item.url?.toLowerCase().includes(search.toLowerCase());
    const level = item.risk?.level ?? item.risk_level ?? 'LOW';
    const matchRisk = riskFilter === 'ALL' || level === riskFilter;
    return matchSearch && matchRisk;
  });

  const handleRerun = async (url) => {
    await analyzeUrl(url);
    navigate('/analyze');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-cyan-400" /> Analysis History
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            {history.length} scan{history.length !== 1 ? 's' : ''} recorded in database
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by URL..."
              className="w-full rounded-lg bg-slate-950/80 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:border-cyan-400 focus:outline-none font-mono transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase border transition-all ${
                  riskFilter === level
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  {['Target URL', 'Risk Level', 'Score', 'DNS', 'TLS', 'Date', 'Action'].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const level = item.risk?.level ?? item.risk_level ?? 'LOW';
                  const score = item.risk?.score ?? item.risk_score ?? 0;
                  const dnsOk = item.dns_resolved ?? item.dns?.resolved;
                  const tlsOk = item.tls_valid ?? (item.tls?.tls_available && item.tls?.tls_valid);
                  const date = item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : (item.analyzedAt ? new Date(item.analyzedAt).toLocaleString() : '—');

                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-900/80 hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span className="text-xs font-mono text-slate-200 truncate max-w-[200px]" title={item.url}>
                            {item.url}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getRiskBadgeClass(level)}`}>
                          {level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-bold text-white">{score}</span>
                        <span className="text-slate-600 font-mono text-xs">/100</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono font-bold ${dnsOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {dnsOk ? '✓ OK' : '✗ Fail'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono font-bold ${
                          tlsOk === null || tlsOk === undefined ? 'text-slate-500'
                          : tlsOk ? 'text-emerald-400'
                          : 'text-rose-400'
                        }`}>
                          {tlsOk === null || tlsOk === undefined ? 'N/A' : tlsOk ? '✓ Valid' : '✗ Invalid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono text-slate-500">{date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRerun(item.url)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Re-scan <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
            Showing {filtered.length} of {history.length} scans · Backed by PostgreSQL
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center space-y-3">
          <Inbox className="h-12 w-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-mono text-sm font-semibold">
            {history.length > 0 ? 'No Results Match Your Filters' : 'No Analysis History Yet'}
          </p>
          <p className="text-slate-500 font-mono text-xs">
            {history.length > 0 ? 'Try changing your search or filter.' : 'Scan some URLs to build your history.'}
          </p>
          {history.length === 0 && (
            <button
              onClick={() => navigate('/analyze')}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition-all"
            >
              <Globe className="h-3.5 w-3.5" /> Go to URL Scanner
            </button>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] font-mono text-slate-500">
        <strong className="text-slate-400">Note:</strong> History is persistent and securely stored in PostgreSQL (Phase 7).
      </div>
    </div>
  );
}

export default HistoryPage;
