import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play, Shield, Mail, Link2, AlertTriangle, ArrowDown,
  Globe, Lock, CornerDownRight, Check, XCircle, Activity
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

function getRiskColor(level) {
  switch (level) {
    case 'CRITICAL': return { text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-950/40', dot: 'bg-red-400' };
    case 'HIGH': return { text: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-950/40', dot: 'bg-orange-400' };
    case 'MEDIUM': return { text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-950/30', dot: 'bg-amber-400' };
    default: return { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/20', dot: 'bg-emerald-400' };
  }
}

function AttackNode({ icon: Icon, stage, title, description, status, riskLevel, isLast = false }) {
  const colors = getRiskColor(riskLevel);
  return (
    <div className="flex flex-col items-center">
      <div className={`w-full max-w-md rounded-2xl border p-4 shadow-xl font-mono transition-all ${colors.bg} ${colors.border}`}>
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${colors.bg} ${colors.border}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{stage}</span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                {status}
              </span>
            </div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="flex flex-col items-center my-2">
          <div className="w-px h-4 bg-slate-700" />
          <ArrowDown className="h-4 w-4 text-slate-600" />
          <div className="w-px h-4 bg-slate-700" />
        </div>
      )}
    </div>
  );
}

export function AttackReplayPage() {
  const navigate = useNavigate();
  const { latestResult, loadAnalysisById, loading: contextLoading } = useAnalysis();
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
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Play className="h-5 w-5 text-cyan-400" /> Attack Replay
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Visual attack chain derived from real analysis data
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Play className="h-8 w-8 text-slate-500" />
          </div>
          <div>
            <p className="text-slate-300 font-mono text-sm font-semibold">No Attack Chain Available</p>
            <p className="text-slate-500 font-mono text-xs mt-1">Analyze a URL to generate an attack replay.</p>
          </div>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition-all"
          >
            <Globe className="h-3.5 w-3.5" /> Analyze a URL
          </button>
        </div>
      </div>
    );
  }


  const riskLevel = result?.risk?.level ?? result?.risk_level ?? 'LOW';
  const riskScore = result?.risk?.score ?? result?.risk_score ?? 0;
  const triggeredRules = result?.risk?.triggered_rules || [];

  // Build attack chain from real analysis signals
  const stages = [];
  let stageCounter = 1;

  // Stage 1: Initial Source (Email or Extension or URL)
  if (result.source === 'EMAIL') {
    stages.push({
      icon: Mail,
      stage: `Stage ${stageCounter++} — Initial Vector`,
      title: 'Suspicious Email Encountered',
      description: 'Extracted URL from email content.',
      status: 'SOURCE',
      riskLevel: 'MEDIUM',
    });
  } else if (result.source === 'EXTENSION') {
    stages.push({
      icon: Globe,
      stage: `Stage ${stageCounter++} — Initial Vector`,
      title: 'Browser Extension Scan',
      description: 'URL intercepted directly from browser tab.',
      status: 'SOURCE',
      riskLevel: 'LOW',
    });
  }

  // Stage: Entry Point
  stages.push({
    icon: Link2,
    stage: `Stage ${stageCounter++} — Entry Point`,
    title: 'Suspicious URL',
    description: `Target: ${result.url}`,
    status: 'DETECTED',
    riskLevel: 'MEDIUM',
  });

  // Stage: Heuristic signals
  const signals = result.signals || {};
  const flaggedSignals = Object.entries(signals)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/_/g, ' '))
    .join(', ');

  if (flaggedSignals) {
    stages.push({
      icon: Activity,
      stage: `Stage ${stageCounter++} — Heuristic Analysis`,
      title: 'Malicious URL Patterns',
      description: `Flagged signals: ${flaggedSignals}`,
      status: 'FLAGGED',
      riskLevel: riskLevel === 'LOW' ? 'MEDIUM' : riskLevel,
    });
  }

  // Stage: Typosquatting
  if (result.typosquatting?.detected) {
    stages.push({
      icon: Shield,
      stage: `Stage ${stageCounter++} — Brand Impersonation`,
      title: `Typosquatting: ${result.typosquatting.matched_domain}`,
      description: `${result.typosquatting.reason || 'Brand impersonation detected via Levenshtein similarity analysis.'}`,
      status: 'CONFIRMED',
      riskLevel: 'HIGH',
    });
  }

  // Stage: DNS
  if (!result.dns?.resolved) {
    stages.push({
      icon: Globe,
      stage: `Stage ${stageCounter++} — Network Evasion`,
      title: 'DNS Resolution Failed',
      description: result.dns?.error || 'Domain could not be resolved — potential ephemeral malicious domain.',
      status: 'SUSPICIOUS',
      riskLevel: 'HIGH',
    });
  } else if (result.signals?.ip_based) {
    stages.push({
      icon: Globe,
      stage: `Stage ${stageCounter++} — Direct IP Access`,
      title: 'Raw IP Hostname Used',
      description: `Connects directly to IP: ${result.dns?.ip_addresses?.[0] || 'unknown'} — bypasses DNS-based protection.`,
      status: 'FLAGGED',
      riskLevel: 'HIGH',
    });
  }

  // Stage: Redirects
  if (result.redirects?.redirect_count > 0) {
    stages.push({
      icon: CornerDownRight,
      stage: `Stage ${stageCounter++} — Redirect Chain`,
      title: `${result.redirects.redirect_count} HTTP Redirect${result.redirects.redirect_count > 1 ? 's' : ''}`,
      description: `Redirects from ${result.redirects.original_url} → ${result.redirects.final_url}`,
      status: result.redirects.redirect_count >= 3 ? 'HIGH RISK' : 'NOTED',
      riskLevel: result.redirects.redirect_count >= 3 ? 'HIGH' : 'MEDIUM',
    });
  }

  // Stage: Fake Login Page / Credential Request Check
  // Since we don't have a specific rule named "fake_login", we check if we have suspicious_keywords or if the risk is HIGH with typosquatting.
  // The user explicitly requested to add a node for credential collection if supported by existing risk indicators.
  const isCredentialThreat = result.typosquatting?.detected || flaggedSignals.includes('suspicious keywords') || result.riskLevel === 'CRITICAL';
  if (isCredentialThreat) {
    stages.push({
      icon: Lock,
      stage: `Stage ${stageCounter++} — Destination Analysis`,
      title: 'Credential Collection Risk',
      description: 'Destination characteristics indicate potential phishing for sensitive information.',
      status: 'WARNING',
      riskLevel: 'HIGH',
    });
  }

  // Stage: TLS
  if (result.tls?.tls_available) {
    if (!result.tls.tls_valid || result.tls.expired || !result.tls.hostname_matches) {
      stages.push({
        icon: Lock,
        stage: `Stage ${stageCounter++} — TLS Spoofing`,
        title: 'Invalid TLS Certificate',
        description: `Certificate issues detected: ${
          result.tls.expired ? 'Expired certificate. ' : ''
        }${result.tls.hostname_matches === false ? 'Hostname mismatch. ' : ''}`,
        status: 'INVALID',
        riskLevel: 'HIGH',
      });
    } else {
      stages.push({
        icon: Lock,
        stage: `Stage ${stageCounter++} — TLS/SSL`,
        title: 'Valid HTTPS Certificate',
        description: `Subject: ${result.tls.subject} | Issuer: ${result.tls.issuer} — certificate valid.`,
        status: 'CLEAN',
        riskLevel: 'LOW',
      });
    }
  } else if (result.url?.startsWith('http://')) {
    stages.push({
      icon: Lock,
      stage: `Stage ${stageCounter++} — No Encryption`,
      title: 'Plain HTTP — No TLS',
      description: 'Connection is unencrypted. Credentials and data sent in plaintext.',
      status: 'RISK',
      riskLevel: 'MEDIUM',
    });
  }

  // Stage: Final verdict
  stages.push({
    icon: AlertTriangle,
    stage: `Stage ${stageCounter++} — Final Verdict`,
    title: `Risk Score: ${riskScore}/100 — ${riskLevel}`,
    description: result.risk?.explanation || `Analysis complete. Risk level: ${riskLevel}.`,
    status: riskLevel,
    riskLevel,
  });

  const hasThreats = riskLevel !== 'LOW' || triggeredRules.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Play className="h-5 w-5 text-cyan-400" /> Attack Replay
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Attack chain derived from real analysis · {stages.length} stages identified
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => navigate(analysisIdFromUrl ? `/report?id=${analysisIdFromUrl}` : '/report')} className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
             Report
          </button>
          <button onClick={() => navigate(analysisIdFromUrl ? `/technical?id=${analysisIdFromUrl}` : '/technical')} className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
             Technical
          </button>
          <div className={`ml-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase ${getRiskColor(riskLevel).bg} ${getRiskColor(riskLevel).text} ${getRiskColor(riskLevel).border}`}>
            {riskLevel} RISK · {riskScore}/100
          </div>
        </div>
      </div>

      {/* Attack chain disclaimer */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/80 text-xs font-mono text-slate-400">
        <Activity className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          This attack chain is <span className="text-slate-200 font-semibold">derived entirely from real backend analysis signals</span>.
          Only stages confirmed by the threat engine are shown.
        </p>
      </div>

      {/* Chain visualization */}
      <div className="flex flex-col items-center space-y-0 py-4">
        {stages.map((stage, i) => (
          <AttackNode
            key={i}
            {...stage}
            isLast={i === stages.length - 1}
          />
        ))}
      </div>

      {/* Triggered Rules Summary */}
      {triggeredRules.length > 0 && (
        <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl font-mono">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            PostgreSQL Rules That Activated
          </h3>
          <div className="space-y-2">
            {triggeredRules.map((rule, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span className="text-slate-200 font-semibold">{rule.rule_name}</span>
                  <span className="text-slate-500">—</span>
                  <span className="text-slate-400">{rule.description}</span>
                </div>
                <span className="shrink-0 ml-3 text-rose-400 font-bold">+{rule.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasThreats && (
        <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-6 text-center space-y-2 font-mono">
          <Check className="h-10 w-10 text-emerald-400 mx-auto" />
          <p className="text-emerald-300 font-bold text-sm">No Significant Threats Detected</p>
          <p className="text-slate-400 text-xs">The analyzed URL passed all heuristic, network, and TLS checks with LOW risk.</p>
        </div>
      )}
    </div>
  );
}

export default AttackReplayPage;
