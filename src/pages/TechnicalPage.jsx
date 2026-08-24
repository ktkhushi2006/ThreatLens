import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Network, Globe, Server, CornerDownRight, Lock, ArrowLeft,
  ArrowRight, Check, XCircle, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

function TechCard({ icon: Icon, title, badge, badgeClass, children }) {
  return (
    <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl font-mono">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">{title}</h3>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value, valueClass = 'text-slate-200 font-semibold' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-900/60 last:border-0 text-xs">
      <span className="text-slate-500 shrink-0 min-w-[120px]">{label}</span>
      <span className={`text-right break-all ${valueClass}`}>{value || '—'}</span>
    </div>
  );
}

export function TechnicalPage() {
  const navigate = useNavigate();
  const { latestResult, loadAnalysisById, loading: contextLoading } = useAnalysis();
  const [showAllHeaders, setShowAllHeaders] = useState(false);
  const [searchParams] = useSearchParams();
  const [fetchLoading, setFetchLoading] = React.useState(false);

  const analysisIdFromUrl = searchParams.get('id');

  React.useEffect(() => {
    if (analysisIdFromUrl) {
      const idNum = parseInt(analysisIdFromUrl, 10);
      if (!isNaN(idNum) && (!latestResult || latestResult.analysis_id !== idNum)) {
        setFetchLoading(true);
        loadAnalysisById(idNum).finally(() => setFetchLoading(false));
      }
    }
  }, [analysisIdFromUrl, latestResult, loadAnalysisById]);

  const result = latestResult;

  if (fetchLoading || (contextLoading && !result)) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-700 p-12 text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mx-auto" />
          <p className="text-slate-300 font-mono text-sm font-semibold">Loading Analysis...</p>
          <p className="text-slate-500 font-mono text-xs">Fetching report from backend.</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/analyze')} className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to URL Scanner
        </button>
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center space-y-3">
          <Network className="h-12 w-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-mono text-sm font-semibold">No Analysis Data</p>
          <p className="text-slate-500 font-mono text-xs">Scan a URL first to view technical network analysis.</p>
          <button onClick={() => navigate('/analyze')} className="mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition-all">
            <Globe className="h-3.5 w-3.5" /> Go to URL Scanner
          </button>
        </div>
      </div>
    );
  }

  const { dns, http, redirects, tls } = result;
  const headers = http?.headers || {};
  const headerEntries = Object.entries(headers);
  const visibleHeaders = showAllHeaders ? headerEntries : headerEntries.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Network className="h-5 w-5 text-cyan-400" /> Technical Analysis
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            DNS · HTTP Headers · Redirect Chain · TLS Certificate
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(analysisIdFromUrl ? `/report?id=${analysisIdFromUrl}` : '/report')} className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Report
          </button>
          <button onClick={() => navigate('/attack-replay')} className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
            Attack Replay <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Target Info */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-4 font-mono text-xs">
        <span className="text-slate-500 uppercase tracking-wider">Analyzed Target: </span>
        <span className="text-cyan-300 font-bold">{result.url}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* DNS */}
        <TechCard
          icon={Network}
          title="DNS Network Resolution"
          badge={dns?.resolved ? `RESOLVED · ${dns.ip_addresses?.length || 0} IPs` : 'FAILED'}
          badgeClass={dns?.resolved ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border-rose-500/30'}
        >
          <DataRow label="Hostname" value={dns?.hostname} />
          <DataRow
            label="Resolution Status"
            value={dns?.resolved ? 'Resolved' : 'Failed'}
            valueClass={dns?.resolved ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}
          />

          {dns?.resolved && dns.ip_addresses?.length > 0 && (
            <div className="pt-2 mt-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Resolved IP Addresses</p>
              <div className="flex flex-wrap gap-2">
                {dns.ip_addresses.map((ip, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-cyan-300 font-mono text-[11px]">{ip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dns?.error && (
            <div className="mt-2 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2">
              <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {dns.error}
            </div>
          )}
        </TechCard>

        {/* HTTP Response */}
        <TechCard
          icon={Server}
          title="HTTP / HTTPS Response"
          badge={http?.status_code ? `HTTP ${http.status_code}` : 'UNREACHABLE'}
          badgeClass={
            !http?.status_code ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
            : http.status_code >= 200 && http.status_code < 300 ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
          }
        >
          <DataRow label="Status Code" value={String(http?.status_code || 'N/A')} />
          <DataRow label="Final URL" value={http?.final_url} valueClass="text-cyan-300 font-semibold break-all" />
          <DataRow label="Server" value={headers?.['server'] || 'Not disclosed'} />
          <DataRow label="Content-Type" value={headers?.['content-type']?.split(';')[0] || 'N/A'} />
          <DataRow label="Content-Encoding" value={headers?.['content-encoding'] || 'None'} />

          {http?.error && (
            <div className="mt-2 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px]">{http.error}</div>
          )}

          {/* Headers Expander */}
          {headerEntries.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Response Headers</p>
                {headerEntries.length > 5 && (
                  <button
                    onClick={() => setShowAllHeaders(v => !v)}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {showAllHeaders ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showAllHeaders ? 'Show less' : `+${headerEntries.length - 5} more`}
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {visibleHeaders.map(([k, v]) => (
                  <div key={k} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 py-1 border-b border-slate-900/60 last:border-0 text-[10px]">
                    <span className="text-cyan-400 font-semibold shrink-0">{k}:</span>
                    <span className="text-slate-300 break-all text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TechCard>

        {/* Redirect Chain */}
        <TechCard
          icon={CornerDownRight}
          title="Redirect Chain"
          badge={`${redirects?.redirect_count || 0} Hop${(redirects?.redirect_count || 0) !== 1 ? 's' : ''}`}
          badgeClass={
            (redirects?.redirect_count || 0) >= 3 ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
            : (redirects?.redirect_count || 0) > 0 ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
            : 'bg-slate-900 text-slate-400 border-slate-700'
          }
        >
          <DataRow label="Original URL" value={redirects?.original_url || latestResult.url} />
          <DataRow label="Final URL" value={redirects?.final_url || latestResult.url} valueClass="text-cyan-300 font-semibold" />
          <DataRow label="Hop Count" value={String(redirects?.redirect_count || 0)} />

          {redirects?.max_redirects_hit && (
            <div className="mt-2 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Maximum redirect limit reached — potential redirect loop or evasion technique.
            </div>
          )}

          {redirects?.redirect_chain?.length > 0 ? (
            <div className="mt-3 space-y-2">
              {redirects.redirect_chain.map((hop, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-bold">HOP #{i + 1}</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">{hop.status_code}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] overflow-hidden">
                    <span className="text-slate-400 truncate max-w-[40%]" title={hop.from_url}>{hop.from_url}</span>
                    <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span className="text-slate-100 font-semibold truncate max-w-[40%]" title={hop.to_url}>{hop.to_url}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Direct destination — no redirects detected.
            </div>
          )}
        </TechCard>

        {/* TLS / SSL */}
        <TechCard
          icon={Lock}
          title="TLS / SSL Certificate"
          badge={
            !tls?.tls_available ? 'NOT AVAILABLE'
            : tls.tls_valid && !tls.expired ? 'TLS VALID'
            : 'INVALID / EXPIRED'
          }
          badgeClass={
            !tls?.tls_available ? 'bg-slate-900 text-slate-400 border-slate-700'
            : tls?.tls_valid && !tls?.expired ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
          }
        >
          {tls?.tls_available ? (
            <>
              <DataRow label="Subject CN" value={tls.subject} />
              <DataRow label="Issuer Organization" value={tls.issuer} />
              <DataRow label="Valid From" value={tls.not_before?.split('T')[0]} />
              <DataRow
                label="Valid Until"
                value={tls.not_after?.split('T')[0]}
                valueClass={tls.expired ? 'text-rose-400 font-semibold' : 'text-emerald-300 font-semibold'}
              />
              <DataRow
                label="Hostname Match"
                value={tls.hostname_matches ? 'Verified ✓' : 'Mismatch ✗'}
                valueClass={tls.hostname_matches ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}
              />
              <DataRow label="Certificate Expired" value={tls.expired ? 'YES' : 'No'} valueClass={tls.expired ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'} />

              {tls.san?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                    Subject Alternative Names ({tls.san.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {tls.san.map((name, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300/80 border border-slate-700 text-[10px]">{name}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400">
              {tls?.error || 'TLS not applicable (HTTP URL or handshake failure).'}
            </div>
          )}
        </TechCard>
      </div>
    </div>
  );
}

export default TechnicalPage;
