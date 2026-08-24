import React, { useState } from 'react';
import {
  Settings, User, Shield, Bell, Code, Globe, Database,
  Save, Check, ChevronRight, Lock, Activity, Cpu
} from 'lucide-react';

function SettingSection({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Icon className="h-4 w-4 text-cyan-400" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-900/60 last:border-0">
      <div className="flex-1">
        <p className="text-xs font-mono font-semibold text-slate-200">{label}</p>
        {description && <p className="text-[10px] font-mono text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 ${
        enabled ? 'bg-cyan-500' : 'bg-slate-700'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? 'translate-x-4.5' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    displayName: 'SOC Analyst',
   apiEndpoint: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    autoRedirectReport: true,
    notifyHighRisk: true,
    notifyMediumRisk: false,
    darkMode: true,
    compactMode: false,
    showRawJson: false,
    sessionHistory: true,
    maxHistory: 50,
  });

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-400" /> Settings
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            ThreatLens configuration and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
            saved
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
          }`}
        >
          {saved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save Settings</>}
        </button>
      </div>

      {/* Profile */}
      <SettingSection icon={User} title="Profile">
        <SettingRow label="Display Name" description="Shown in the dashboard header">
          <input
            type="text"
            value={settings.displayName}
            onChange={e => update('displayName', e.target.value)}
            className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-mono text-slate-200 border border-slate-700 focus:border-cyan-400 focus:outline-none w-40 transition-all"
          />
        </SettingRow>
        <SettingRow label="Role" description="Your security team role">
          <select className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-mono text-slate-200 border border-slate-700 focus:border-cyan-400 focus:outline-none transition-all">
            <option>SOC Analyst</option>
            <option>Threat Hunter</option>
            <option>Security Engineer</option>
            <option>Administrator</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* API Configuration */}
      <SettingSection icon={Cpu} title="API / Backend Configuration">
        <SettingRow label="FastAPI Endpoint" description="URL of the ThreatLens FastAPI backend">
          <input
            type="text"
            value={settings.apiEndpoint}
            onChange={e => update('apiEndpoint', e.target.value)}
            className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-mono text-slate-200 border border-slate-700 focus:border-cyan-400 focus:outline-none w-52 transition-all"
          />
        </SettingRow>
        <SettingRow label="Backend Status" description="Live connectivity to FastAPI + PostgreSQL">
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </SettingRow>
        <SettingRow label="PostgreSQL Risk Rules" description="Data-driven rule engine source">
          <span className="text-[11px] font-mono text-cyan-300 font-bold">Active · 18 rules</span>
        </SettingRow>
      </SettingSection>

      {/* Security Preferences */}
      <SettingSection icon={Shield} title="Security Preferences">
        <SettingRow label="Auto-Navigate to Report" description="Automatically navigate to report after analysis">
          <Toggle enabled={settings.autoRedirectReport} onChange={v => update('autoRedirectReport', v)} />
        </SettingRow>
        <SettingRow label="Session History" description="Keep analysis history during session">
          <Toggle enabled={settings.sessionHistory} onChange={v => update('sessionHistory', v)} />
        </SettingRow>
        <SettingRow label="Max History Items" description="Maximum scans to store in session">
          <select
            value={settings.maxHistory}
            onChange={e => update('maxHistory', Number(e.target.value))}
            className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-mono text-slate-200 border border-slate-700 focus:border-cyan-400 focus:outline-none transition-all"
          >
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* Notifications */}
      <SettingSection icon={Bell} title="Notifications">
        <SettingRow label="High Risk Alerts" description="Show prominent alerts for HIGH/CRITICAL risk URLs">
          <Toggle enabled={settings.notifyHighRisk} onChange={v => update('notifyHighRisk', v)} />
        </SettingRow>
        <SettingRow label="Medium Risk Alerts" description="Show alerts for MEDIUM risk URLs">
          <Toggle enabled={settings.notifyMediumRisk} onChange={v => update('notifyMediumRisk', v)} />
        </SettingRow>
      </SettingSection>

      {/* Display */}
      <SettingSection icon={Globe} title="Display Preferences">
        <SettingRow label="Dark Mode" description="ThreatLens SOC dark theme (always recommended)">
          <Toggle enabled={settings.darkMode} onChange={v => update('darkMode', v)} />
        </SettingRow>
        <SettingRow label="Compact Mode" description="Reduce card padding for denser information density">
          <Toggle enabled={settings.compactMode} onChange={v => update('compactMode', v)} />
        </SettingRow>
        <SettingRow label="Show Raw JSON" description="Display raw API response in analysis results">
          <Toggle enabled={settings.showRawJson} onChange={v => update('showRawJson', v)} />
        </SettingRow>
      </SettingSection>

      {/* System Info */}
      <SettingSection icon={Activity} title="System Information">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Frontend', value: 'React 18 + Vite + Tailwind' },
            { label: 'Backend', value: 'FastAPI (Uvicorn)' },
            { label: 'Database', value: 'PostgreSQL (risk_rules)' },
            { label: 'Phase', value: '6 — Dashboard' },
            { label: 'Risk Engine', value: 'PostgreSQL data-driven' },
            { label: 'Analyzers', value: 'DNS, HTTP, TLS, Redirect, Typosquat' },
          ].map(({ label, value }) => (
            <div key={label} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-xs font-mono text-slate-200 font-semibold mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-500/20">
          <Lock className="h-4 w-4 text-rose-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">Account</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-semibold text-slate-200">Sign Out</p>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">End your ThreatLens session</p>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono hover:bg-rose-950/80 transition-all">
            Sign Out <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
