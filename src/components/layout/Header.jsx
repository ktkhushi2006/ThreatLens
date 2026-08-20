import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Shield,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { threatLensApi } from '../../services/api';

export function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Load notifications from API service
  useEffect(() => {
    threatLensApi.getNotifications().then((res) => {
      if (res.success) {
        setNotifications(res.data);
      }
    });
  }, []);

  // Handle clicking outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return { title: 'Security Operations Dashboard', subtitle: 'Real-time telemetry and threat analysis overview' };
      case '/analyze':
        return { title: 'URL Deep Risk Analyzer', subtitle: 'Scan links for phishing heuristics, cloaking, and malware' };
      case '/report':
        return { title: 'Security Intelligence Report', subtitle: 'Detailed verdict, risk score, and threat indicators' };
      case '/technical':
        return { title: 'Technical & Network Telemetry', subtitle: 'DNS records, SSL handshake, headers & redirect hops' };
      case '/qr-scanner':
        return { title: 'Malicious QR Code Scanner', subtitle: 'Decode payloads, analyze embedded links & detect quishing' };
      case '/email-analyzer':
        return { title: 'Email & Phishing Header Analyzer', subtitle: 'Inspect raw emails, SPF/DKIM validation & extracted lures' };
      case '/history':
        return { title: 'Analysis Logs & History', subtitle: 'Search, filter, and review historical threat scans' };
      case '/analytics':
        return { title: 'Threat Intelligence Analytics', subtitle: 'Global attack vectors, target statistics, and volume trends' };
      case '/attack-replay':
        return { title: 'Phishing Attack Chain Replay', subtitle: 'Simulated visual step-by-step kill-chain pipeline' };
      case '/settings':
        return { title: 'System & Engine Settings', subtitle: 'Heuristic thresholds, API keys, and notification integrations' };
      default:
        return { title: 'ThreatLens Platform', subtitle: 'Phishing & Malicious Link Risk Analysis' };
    }
  };

  const currentInfo = getPageTitle(location.pathname);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // In later steps, this can route to URL analyzer with query prefilled
    navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-cyber-border bg-[#090E1A]/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-cyan-400">DEFENSE GRID</span>
            <span className="text-xs text-slate-500 font-mono">/</span>
            <h1 className="text-sm font-semibold text-slate-200">
              {currentInfo.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domain, IP, hash, or suspicious URL..."
            className="w-full rounded-lg bg-slate-900/90 py-1.5 pl-10 pr-16 text-xs text-slate-200 placeholder:text-slate-500 border border-slate-700/60 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right: Status Pill, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* System Health Pill */}
        <div className="hidden xl:flex items-center gap-2 rounded-full bg-emerald-950/40 px-3 py-1 border border-emerald-500/30">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold text-emerald-300">
            SYSTEMS NOMINAL (184ms)
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-cyber-card border border-cyber-border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white font-mono">
                    Threat Alerts ({notifications.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      {n.type === 'critical' ? (
                        <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                      ) : n.type === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {n.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 border border-cyan-400/30 text-white font-mono text-xs font-bold shadow-glow-cyan">
              TL
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200">SecOps Analyst</p>
              <p className="text-[10px] font-mono text-slate-400">SOC Tier-1</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-cyber-card border border-cyber-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 font-mono text-xs">
              <div className="px-3 py-2 border-b border-cyber-border mb-1">
                <p className="font-semibold text-slate-200">Analyst Console</p>
                <p className="text-[10px] text-cyan-400">threatlens-internal</p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Profile & API Keys
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                FastAPI Gateway Config
              </button>
              <div className="my-1 border-t border-cyber-border" />
              <div className="px-3 py-1.5 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Phase 1 Frontend</span>
                <span className="text-emerald-400">Ready</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
