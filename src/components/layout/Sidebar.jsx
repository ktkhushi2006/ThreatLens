import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  ShieldAlert,
  Network,
  QrCode,
  MailWarning,
  History,
  BarChart3,
  PlaySquare,
  Settings,
  ShieldCheck,
  Radio,
  ChevronRight,
  Terminal,
  X
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    {
      label: 'Main Dashboard',
      path: '/',
      icon: LayoutDashboard,
      badge: 'LIVE',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      label: 'URL Analyzer',
      path: '/analyze',
      icon: Globe,
      step: 'Step 2'
    },
    {
      label: 'Security Report',
      path: '/report',
      icon: ShieldAlert,
      step: 'Step 3'
    },
    {
      label: 'Technical Analysis',
      path: '/technical',
      icon: Network,
      step: 'Step 4'
    },
    {
      label: 'QR Scanner',
      path: '/qr-scanner',
      icon: QrCode,
      step: 'Step 5'
    },
    {
      label: 'Email Analyzer',
      path: '/email-analyzer',
      icon: MailWarning,
      step: 'Step 6'
    },
    {
      label: 'Analysis History',
      path: '/history',
      icon: History,
      step: 'Step 7'
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      step: 'Step 8'
    },
    {
      label: 'Attack Replay',
      path: '/attack-replay',
      icon: PlaySquare,
      step: 'Step 9'
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      step: 'Step 10'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-cyber-border bg-[#090E1A] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-cyber-border/80">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-blue-600/20 border border-cyan-500/40 shadow-glow-cyan">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-wider text-white font-mono">
                  THREAT<span className="text-cyan-400">LENS</span>
                </span>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Risk Analysis Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
              Core Modules
            </p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:bg-cyber-card-hover hover:text-slate-100 border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#06B6D4]" />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      isActive
                        ? 'text-cyan-400'
                        : 'text-slate-400 group-hover:text-cyan-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                ) : item.step ? (
                  <span className="text-[10px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors">
                    {item.step}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60 text-slate-400" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Engine Status Footer */}
        <div className="p-3 m-3 rounded-xl bg-cyber-card/90 border border-cyber-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold text-slate-300">
                Threat Engine
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Classifier:</span>
              <span className="text-slate-200">v3.8 (99.4%)</span>
            </div>
            <div className="flex justify-between">
              <span>Feed Sync:</span>
              <span className="text-cyan-400">18/18 Online</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Terminal className="h-3 w-3 text-cyan-400" />
              Phase 1 UI Mode
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
