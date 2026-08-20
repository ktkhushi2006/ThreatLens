import React from 'react';

export function StatCard({
  title,
  value,
  delta,
  deltaType = 'neutral', // 'positive' | 'negative' | 'neutral' | 'danger'
  subtitle,
  icon: Icon,
  accentColor = 'cyan' // 'cyan' | 'rose' | 'amber' | 'emerald'
}) {
  const accentGlow = {
    cyan: 'border-cyan-500/20 group-hover:border-cyan-500/50 hover:shadow-glow-cyan',
    rose: 'border-rose-500/20 group-hover:border-rose-500/50 hover:shadow-glow-rose',
    amber: 'border-amber-500/20 group-hover:border-amber-500/50 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]',
    emerald: 'border-emerald-500/20 group-hover:border-emerald-500/50 hover:shadow-glow-emerald'
  };

  const iconBg = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  };

  const deltaColors = {
    positive: 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20',
    negative: 'text-rose-400 bg-rose-950/40 border border-rose-500/20',
    danger: 'text-rose-400 bg-rose-950/40 border border-rose-500/20',
    neutral: 'text-slate-400 bg-slate-800/40 border border-slate-700/30'
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-cyber-card/90 p-5 border backdrop-blur-md transition-all duration-300 ${accentGlow[accentColor] || accentGlow.cyan}`}
    >
      {/* Subtle top indicator bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] opacity-60 transition-opacity group-hover:opacity-100 ${
          accentColor === 'rose'
            ? 'bg-gradient-to-r from-transparent via-rose-500 to-transparent'
            : accentColor === 'amber'
            ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
            : accentColor === 'emerald'
            ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
            : 'bg-gradient-to-r from-transparent via-cyan-500 to-transparent'
        }`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-extrabold text-white tracking-tight font-mono">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg transition-transform duration-300 group-hover:scale-110 ${iconBg[accentColor]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {delta && (
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${deltaColors[deltaType]}`}>
            {delta}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-slate-400 font-normal truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
