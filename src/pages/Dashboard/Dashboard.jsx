import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Zap,
  QrCode,
  Mail,
  Globe,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Clock,
  Server,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

import { StatCard } from '../../components/common/StatCard';
import { RiskBadge } from '../../components/common/RiskBadge';
import { threatLensApi } from '../../services/api';
import { mockQuickScanPresets } from '../../data/mockData';

export function Dashboard() {
  const navigate = useNavigate();

  // State management for API / Mock data
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [threatCategories, setThreatCategories] = useState([]);
  const [volumeTrends, setVolumeTrends] = useState([]);
  const [engineStatus, setEngineStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick scan interactive state
  const [scanUrl, setScanUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [quickScanResult, setQuickScanResult] = useState(null);

  // Table filter state
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Load initial data through API service
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [statsRes, scansRes, categoriesRes, trendsRes, enginesRes] = await Promise.all([
          threatLensApi.getDashboardStats(),
          threatLensApi.getRecentScans('ALL'),
          threatLensApi.getThreatCategories(),
          threatLensApi.getScanVolumeTrends(),
          threatLensApi.getEngineStatus()
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (scansRes.success) setRecentScans(scansRes.data);
        if (categoriesRes.success) setThreatCategories(categoriesRes.data);
        if (trendsRes.success) setVolumeTrends(trendsRes.data);
        if (enginesRes.success) setEngineStatus(enginesRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard telemetry', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter table data
  const handleFilterChange = async (filter) => {
    setActiveFilter(filter);
    const res = await threatLensApi.getRecentScans(filter);
    if (res.success) {
      setRecentScans(res.data);
    }
  };

  // Quick scan handler
  const handleQuickScan = async (e) => {
    e?.preventDefault();
    if (!scanUrl.trim()) return;

    setIsScanning(true);
    setQuickScanResult(null);

    try {
      const res = await threatLensApi.quickAnalyzeUrl(scanUrl.trim());
      if (res.success) {
        setQuickScanResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePresetClick = (presetUrl) => {
    setScanUrl(presetUrl);
    setQuickScanResult(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Hero Quick Scan Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyber-card via-[#0F1829] to-[#0A101D] p-6 sm:p-8 border border-cyber-border/90 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
                <Zap className="h-3.5 w-3.5" /> Rapid Heuristic Threat Scanner
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Analyze Suspicious Link or Domain
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time scanning for homographs, phishing lures, cloaked redirects, and malicious payload distribution.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Heuristic Engine Ready
              </span>
            </div>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleQuickScan} className="mt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  placeholder="Enter target URL (e.g., https://micros0ft-security-auth.portal.com/login)"
                  className="w-full rounded-xl bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none font-mono shadow-inner transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isScanning || !scanUrl.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-cyan font-mono"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Scanning Engine...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analyze Target
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Presets */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Sample Targets:
            </span>
            {mockQuickScanPresets.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePresetClick(preset.url)}
                className="rounded-md bg-slate-900/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    preset.expectedRisk === 'CRITICAL'
                      ? 'bg-rose-400'
                      : preset.expectedRisk === 'HIGH'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                {preset.label}
              </button>
            ))}
          </div>

          {/* Quick Scan Result Banner */}
          {quickScanResult && (
            <div className="mt-5 p-4 rounded-xl bg-slate-950/90 border border-cyber-border animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <RiskBadge level={quickScanResult.riskLevel} score={quickScanResult.riskScore} size="lg" />
                  <div>
                    <p className="text-xs font-mono text-slate-300 font-semibold truncate max-w-md">
                      {quickScanResult.target}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Category: <span className="text-cyan-400">{quickScanResult.category}</span> • Scan ID: {quickScanResult.scanId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/report')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono hover:bg-cyan-500/30 transition-colors shadow-glow-cyan"
                  >
                    View Security Report <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Analyzer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* URL Deep Scanner */}
        <div
          onClick={() => navigate('/analyze')}
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-cyber-card p-5 border border-cyber-border hover:border-cyan-500/40 transition-all duration-300 hover:shadow-glow-cyan"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Globe className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              URL Engine
            </span>
          </div>
          <h3 className="mt-4 text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
            URL Deep Scanner
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Multi-layered inspection of SSL certs, DNS records, domain reputation, and full redirect chains.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-mono text-cyan-400 font-semibold">
            Launch Analyzer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* QR Code Scanner */}
        <div
          onClick={() => navigate('/qr-scanner')}
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-cyber-card p-5 border border-cyber-border hover:border-cyan-500/40 transition-all duration-300 hover:shadow-glow-cyan"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <QrCode className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Quishing Defense
            </span>
          </div>
          <h3 className="mt-4 text-base font-bold text-white group-hover:text-purple-300 transition-colors">
            Malicious QR Scanner
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Upload or scan QR payloads to detect hidden phishing redirects, obfuscated shortlinks, and WiFi exploits.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-mono text-purple-400 font-semibold">
            Launch QR Engine <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Email Analyzer */}
        <div
          onClick={() => navigate('/email-analyzer')}
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-cyber-card p-5 border border-cyber-border hover:border-cyan-500/40 transition-all duration-300 hover:shadow-glow-cyan"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Mail className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              BEC & Lures
            </span>
          </div>
          <h3 className="mt-4 text-base font-bold text-white group-hover:text-amber-300 transition-colors">
            Email & Header Analyzer
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Validate SPF, DKIM, DMARC alignment, inspect suspicious urgency cues, and extract embedded threat links.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-mono text-amber-400 font-semibold">
            Inspect Headers <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Scanned Entities"
          value={stats?.totalScans?.toLocaleString() || '14,892'}
          delta={stats?.scansDelta || '+12.4%'}
          deltaType="positive"
          subtitle="vs last week"
          icon={Activity}
          accentColor="cyan"
        />
        <StatCard
          title="High / Critical Threats"
          value={stats?.highRisk?.toLocaleString() || '1,842'}
          delta={stats?.highRiskDelta || '+5.1%'}
          deltaType="danger"
          subtitle="Malicious verdicts"
          icon={ShieldAlert}
          accentColor="rose"
        />
        <StatCard
          title="Suspicious Detections"
          value={stats?.suspicious?.toLocaleString() || '3,120'}
          delta={stats?.suspiciousDelta || '-2.8%'}
          deltaType="neutral"
          subtitle="Requires analyst triage"
          icon={AlertTriangle}
          accentColor="amber"
        />
        <StatCard
          title="Clean & Verified"
          value={stats?.clean?.toLocaleString() || '9,930'}
          delta={stats?.cleanDelta || '+18.2%'}
          deltaType="positive"
          subtitle="Legitimate domains"
          icon={ShieldCheck}
          accentColor="emerald"
        />
      </div>

      {/* Threat Statistics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Activity Trend Chart */}
        <div className="lg:col-span-8 rounded-xl bg-cyber-card p-5 border border-cyber-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  7-Day Threat Scan Activity
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Volume of scanned traffic categorized by threat severity
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" /> Total
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Malicious
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Clean
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0E1524',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="malicious"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMalicious)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution Donut */}
        <div className="lg:col-span-4 rounded-xl bg-cyber-card p-5 border border-cyber-border flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Threat Breakdown
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Distribution of verified threat categories
            </p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {threatCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0E1524" strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0E1524',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            {threatCategories.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-400 font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Recent Analyses Stream Table */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border overflow-hidden">
        <div className="p-5 border-b border-cyber-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Recent Threat Analyses
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live stream of URLs, QR codes, and emails inspected by ThreatLens
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 self-start sm:self-auto font-mono text-xs">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('HIGH_RISK')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'HIGH_RISK'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High Risk
            </button>
            <button
              onClick={() => handleFilterChange('SUSPICIOUS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'SUSPICIOUS'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Suspicious
            </button>
            <button
              onClick={() => handleFilterChange('CLEAN')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'CLEAN'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Clean
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-cyber-border uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Target Entity / Link</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Risk Verdict</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Origin / IP</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">{scan.id}</span>
                      <p className="font-medium text-slate-100 truncate max-w-xs sm:max-w-sm">
                        {scan.target}
                      </p>
                    </div>
                    {scan.detectedThreats?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scan.detectedThreats.map((threat, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-1.5 py-0.2 rounded text-[9px] bg-rose-950/40 text-rose-300 border border-rose-800/40"
                          >
                            {threat}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {scan.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <RiskBadge level={scan.riskLevel} score={scan.riskScore} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">
                    {scan.category}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">
                    <div>{scan.location || 'Unknown'}</div>
                    <span className="text-[10px] text-slate-500">{scan.ipAddress}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                    {scan.timestamp}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate('/report')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                    >
                      Report <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Engine Telemetry Bar */}
      <div className="rounded-xl bg-cyber-card p-5 border border-cyber-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Security Engine Telemetry & Health
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Cluster: us-east-grid-01 (All Systems Operational)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {engineStatus.map((engine, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between font-mono"
            >
              <div>
                <p className="text-xs font-semibold text-slate-200">{engine.name}</p>
                <p className="text-[10px] text-slate-500">{engine.version}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {engine.status}
                </span>
                <p className="text-[10px] text-slate-400">{engine.latency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
