import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal, Shield, Sparkles, Layers } from 'lucide-react';

export function PlaceholderPage({ title, stepNumber, description, features = [] }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan">
          <Layers className="h-3.5 w-3.5" /> Step {stepNumber} in Roadmap
        </span>
      </div>

      {/* Main Container */}
      <div className="relative overflow-hidden rounded-2xl bg-cyber-card/80 border border-cyber-border p-8 backdrop-blur-md">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Shield className="h-64 w-64 text-cyan-400" />
        </div>

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300 mb-4">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            Module Scheduled for Next Incremental Step
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            {description}
          </p>

          {features.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Planned Capabilities:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {features.map((feat, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 font-mono"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-cyber-border flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-cyan-500/20 px-5 py-2.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all shadow-glow-cyan"
            >
              Explore Active Dashboard (Step 1)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceholderPage;
