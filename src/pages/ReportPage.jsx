import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Shield, Globe, Server, Network, Lock, CornerDownRight,
  AlertTriangle, Check, XCircle, CheckCircle2, Database, ArrowLeft,
  ArrowRight, AlertCircle
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

function getRiskColors(level) {
  switch (level) {
    case 'CRITICAL': return { text: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
    case 'HIGH': return { text: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-500/40', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
    case 'MEDIUM': return { text: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    default: return { text: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
}

function SectionCard({ icon: Icon, title, status, statusClass, children }) {
  return (
    <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl font-mono space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">{title}</h3>
        </div>
        {status && <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusClass}`}>{status}</span>}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, valueClass = 'text-slate-200' }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-900/80 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-[11px] font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

export function ReportPage() {
  const navigate = useNavigate();
  const { latestResult } = useAnalysis();

  if (!latestResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          <button onClick={() => navigate('/analyze')} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to URL Scanner
          </button>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center space-y-3">
          <FileText className="h-12 w-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-mono text-sm font-semibold">No Analysis Available</p>
          <p className="text-slate-500 font-mono text-xs">Scan a URL first to generate a security report.</p>
          <button onClick={() => navigate('/analyze')} className="mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition-all">
            <Globe className="h-3.5 w-3.5" /> Go to URL Scanner
          </button>
        </div>
      </div>
    );
  }

  const result = latestResult;
  const riskScore = result?.risk?.score ?? result?.risk_score ?? 0;
  const riskLevel = result?.risk?.level ?? result?.risk_level ?? 'LOW';
  const triggeredRules = result?.risk?.triggered_rules || [];
  const riskExplanation = result?.risk?.explanation || '';
  const styles = getRiskColors(riskLevel);

  const analyzedAt = result.analyzedAt
    ? new Date(result.analyzedAt).toLocaleString()
    : 'Just now';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" /> Security Report
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">Generated: {analyzedAt}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/analyze')} className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Scan Again
          </button>
          <button onClick={() => navigate('/technical')} className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
            Technical <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top: Target + Risk Score */}
      <div className={`rounded-2xl border p-5 ${styles.bg} ${styles.border} shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Target URL</p>
            <p className="text-sm font-mono font-bold text-white break-all">{result.url}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-3xl font-mono font-black text-white">{riskScore}</p>
              <p className="text-[10px] font-mono text-slate-400">/ 100 Risk Score</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border text-sm font-mono font-black uppercase tracking-wider ${styles.bg} ${styles.text} ${styles.border}`}>
              {riskLevel} RISK
            </div>
          </div>
        </div>
        {riskExplanation && (
          <p className="mt-3 pt-3 border-t border-slate-700/50 text-xs font-mono text-slate-300 leading-relaxed">
            {riskExplanation}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Domain */}
        <SectionCard
          icon={Globe}
          title="Domain Analysis"
          status={result.typosquatting?.detected ? 'SUSPICIOUS' : 'CLEAN'}
          statusClass={result.typosquatting?.detected ? 'bg-rose-950/60 text-rose-300 border-rose-500/30' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'}
        >
          <InfoRow label="Target Domain" value={result.dns?.hostname || result.url} />
          <InfoRow
            label="Typosquatting"
            value={result.typosquatting?.detected ? 'DETECTED' : 'Clean'}
            valueClass={result.typosquatting?.detected ? 'text-rose-400' : 'text-emerald-400'}
          />
          {result.typosquatting?.detected && (
            <>
              <InfoRow label="Matched Brand" value={result.typosquatting.matched_domain || '-'} valueClass="text-amber-300" />
              <InfoRow label="Similarity" value={`${Math.round((result.typosquatting.similarity || 0) * 100)}%`} valueClass="text-amber-300" />
            </>
          )}
          {result.typosquatting?.reason && (
            <div className="mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              {result.typosquatting.reason}
            </div>
          )}
        </SectionCard>

        {/* DNS */}
        <SectionCard
          icon={Network}
          title="DNS Resolution"
          status={result.dns?.resolved ? `RESOLVED (${result.dns.ip_addresses?.length} IPs)` : 'FAILED'}
          statusClass={result.dns?.resolved ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border-rose-500/30'}
        >
          <InfoRow label="Hostname" value={result.dns?.hostname || '-'} />
          <InfoRow
            label="Status"
            value={result.dns?.resolved ? 'Resolved' : 'Failed'}
            valueClass={result.dns?.resolved ? 'text-emerald-400' : 'text-rose-400'}
          />
          {result.dns?.resolved && result.dns.ip_addresses?.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] text-slate-500 mb-1">IP Addresses:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.dns.ip_addresses.map((ip, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 text-[11px]">{ip}</span>
                ))}
              </div>
            </div>
          )}
          {result.dns?.error && (
            <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] mt-1">{result.dns.error}</div>
          )}
        </SectionCard>

        {/* TLS */}
        <SectionCard
          icon={Lock}
          title="TLS / SSL Certificate"
          status={result.tls?.tls_available ? (result.tls.tls_valid && !result.tls.expired ? 'VALID' : 'INVALID') : 'N/A'}
          statusClass={
            !result.tls?.tls_available
              ? 'bg-slate-900 text-slate-400 border-slate-700'
              : result.tls?.tls_valid && !result.tls?.expired
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
          }
        >
          {result.tls?.tls_available ? (
            <>
              <InfoRow label="Subject CN" value={result.tls.subject || '-'} />
              <InfoRow label="Issuer" value={result.tls.issuer || '-'} />
              <InfoRow label="Valid Until" value={result.tls.not_after?.split('T')[0] || '-'} valueClass={result.tls.expired ? 'text-rose-400' : 'text-emerald-300'} />
              <InfoRow
                label="Hostname Match"
                value={result.tls.hostname_matches ? 'Verified' : 'Mismatch'}
                valueClass={result.tls.hostname_matches ? 'text-emerald-400' : 'text-rose-400'}
              />
              <InfoRow
                label="Expired"
                value={result.tls.expired ? 'YES' : 'No'}
                valueClass={result.tls.expired ? 'text-rose-400' : 'text-emerald-400'}
              />
              {result.tls.san?.length > 0 && (
                <InfoRow label="SANs" value={`${result.tls.san.length} registered`} valueClass="text-cyan-300" />
              )}
            </>
          ) : (
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400">
              {result.tls?.error || 'TLS not applicable (plain HTTP or handshake failed).'}
            </div>
          )}
        </SectionCard>

        {/* Redirects */}
        <SectionCard
          icon={CornerDownRight}
          title="Redirect Analysis"
          status={`${result.redirects?.redirect_count || 0} Hops`}
          statusClass={
            (result.redirects?.redirect_count || 0) >= 3
              ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
              : (result.redirects?.redirect_count || 0) > 0
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-700'
          }
        >
          <InfoRow label="Original URL" value={result.redirects?.original_url || result.url} />
          <InfoRow label="Final URL" value={result.redirects?.final_url || result.url} valueClass="text-cyan-300" />
          <InfoRow label="Redirect Count" value={String(result.redirects?.redirect_count || 0)} />
          {result.redirects?.max_redirects_hit && (
            <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2 mt-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Max redirect limit reached (potential loop)
            </div>
          )}
          {result.redirects?.redirect_chain?.length > 0 && (
            <div className="space-y-1.5 mt-1">
              {result.redirects.redirect_chain.map((hop, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-slate-950/50 border border-slate-900">
                  <span className="text-slate-500">#{i + 1}</span>
                  <span className="text-slate-400 truncate">{hop.from_url}</span>
                  <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="text-slate-200 truncate">{hop.to_url}</span>
                  <span className="ml-auto shrink-0 text-cyan-300">{hop.status_code}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* HTTP */}
        <SectionCard
          icon={Server}
          title="HTTP / Webpage"
          status={result.http?.status_code ? `HTTP ${result.http.status_code}` : 'UNREACHABLE'}
          statusClass={
            !result.http?.status_code
              ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
              : result.http.status_code >= 200 && result.http.status_code < 300
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
          }
        >
          <InfoRow label="Status Code" value={String(result.http?.status_code || 'N/A')} />
          <InfoRow label="Final URL" value={result.http?.final_url || '-'} valueClass="text-cyan-300" />
          <InfoRow label="Server" value={result.http?.headers?.['server'] || 'N/A'} />
          <InfoRow label="Content-Type" value={result.http?.headers?.['content-type']?.split(';')[0] || 'N/A'} />
          {result.http?.error && (
            <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] mt-1">{result.http.error}</div>
          )}
        </SectionCard>

        {/* Heuristic Signals Summary */}
        <SectionCard icon={Shield} title="Heuristic Signals">
          {[
            { key: 'ip_based', label: 'Raw IP Hostname' },
            { key: 'unusual_port', label: 'Non-Standard Port' },
            { key: 'suspicious_keywords', label: 'Phishing Keywords' },
            { key: 'encoded_characters', label: 'Encoded Obfuscation' },
            { key: 'unusual_subdomain', label: 'Deep Subdomain' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-900/80 last:border-0 text-[11px]">
              <span className="text-slate-400">{label}</span>
              {result.signals?.[key] ? (
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <AlertTriangle className="h-3 w-3" /> Flagged
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Check className="h-3 w-3" /> Clean
                </span>
              )}
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Why is it Risky? */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl font-mono">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Database className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Why Is It Risky? — PostgreSQL Risk Rules</h3>
          <span className="ml-auto text-[10px] text-slate-500">{triggeredRules.length} rule(s) triggered</span>
        </div>

        {triggeredRules.length > 0 ? (
          <div className="space-y-3">
            {triggeredRules.map((rule, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-white">{rule.rule_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                      {rule.category || 'SIGNAL'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rule.description}</p>
                </div>
                <div className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-extrabold text-sm text-center min-w-[4rem]">
                  +{rule.score}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">No Risk Rules Triggered</p>
            <p className="text-[11px] text-slate-400">All checks passed. Target appears safe.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportPage;
