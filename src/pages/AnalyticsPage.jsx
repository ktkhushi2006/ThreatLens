import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Globe, Shield, AlertTriangle, CheckCircle2, Activity, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { useAnalysis } from '../context/AnalysisContext';

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

function StatCard({ icon: Icon, label, value, sub, color = 'text-cyan-400' }) {
  return (
    <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-mono font-black text-white">{value}</p>
        <p className="text-xs font-mono text-slate-300 font-semibold">{label}</p>
        {sub && <p className="text-[10px] font-mono text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { analytics } = useAnalysis();

  if (!analytics) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" /> Threat Analytics
        </h1>
        <div className="rounded-2xl border border-slate-800 p-12 text-center text-slate-400 font-mono text-sm">
          Loading analytics...
        </div>
      </div>
    );
  }

  const { total_scans, high_risk, medium_risk, low_risk, threat_categories } = analytics;
  
  // Pie data
  const pieData = [
    { name: 'LOW', value: low_risk },
    { name: 'MEDIUM', value: medium_risk },
    { name: 'HIGH/CRITICAL', value: high_risk },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" /> Threat Analytics
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-0.5">
          Real-time SOC metrics — {total_scans} scan{total_scans !== 1 ? 's' : ''} analyzed total
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Scans" value={total_scans} sub="All time" color="text-cyan-400" />
        <StatCard icon={AlertTriangle} label="High Risk" value={high_risk} sub="HIGH + CRITICAL" color="text-rose-400" />
        <StatCard icon={Shield} label="Medium Risk" value={medium_risk} sub="MEDIUM level" color="text-amber-400" />
        <StatCard icon={CheckCircle2} label="Low Risk / Clean" value={low_risk} sub="LOW level" color="text-emerald-400" />
      </div>

      {total_scans === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center space-y-4">
          <BarChart3 className="h-14 w-14 text-slate-600 mx-auto" />
          <div>
            <p className="text-slate-300 font-mono text-sm font-semibold">No Analytics Data Yet</p>
            <p className="text-slate-500 font-mono text-xs mt-1">Charts will populate as you run URL scans.</p>
          </div>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition-all"
          >
            <Globe className="h-3.5 w-3.5" /> Start Scanning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Risk Distribution Pie */}
          <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" /> Risk Level Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name === 'HIGH/CRITICAL' ? 'HIGH' : entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1322', border: '1px solid #334155', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          {threat_categories && threat_categories.length > 0 ? (
            <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" /> Top Triggered Signals
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={threat_categories} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1322', border: '1px solid #334155', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Times Triggered" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl flex flex-col items-center justify-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="text-xs font-mono text-emerald-300 font-semibold text-center">All Signals Clean</p>
              <p className="text-[11px] font-mono text-slate-500 text-center">No heuristic signals triggered in any scanned URL.</p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] font-mono text-slate-500">
        Analytics are backed by the PostgreSQL persistence engine (Phase 7).
      </div>
    </div>
  );
}

export default AnalyticsPage;
