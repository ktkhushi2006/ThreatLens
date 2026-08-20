import React from 'react';

export function RiskBadge({ level = 'SAFE', score, showDot = true, size = 'md' }) {
  const normalizedLevel = (level || 'SAFE').toUpperCase();

  const config = {
    CRITICAL: {
      bg: 'bg-red-950/60',
      text: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-500',
      pulse: 'animate-ping',
      glow: 'shadow-[0_0_12px_rgba(239,68,68,0.25)]'
    },
    HIGH: {
      bg: 'bg-orange-950/60',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      dot: 'bg-orange-500',
      pulse: 'animate-pulse',
      glow: 'shadow-[0_0_10px_rgba(249,115,22,0.2)]'
    },
    MEDIUM: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
      pulse: '',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.15)]'
    },
    LOW: {
      bg: 'bg-cyan-950/60',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
      pulse: '',
      glow: ''
    },
    SAFE: {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
      pulse: '',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]'
    }
  };

  const style = config[normalizedLevel] || config.SAFE;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-bold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono uppercase tracking-wider transition-all duration-200 ${style.bg} ${style.text} ${style.border} ${style.glow} ${sizeClasses[size] || sizeClasses.md}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {style.pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot} ${style.pulse}`}
            />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${style.dot}`} />
        </span>
      )}
      <span>{normalizedLevel}</span>
      {score !== undefined && score !== null && (
        <span className="ml-1 opacity-75 font-normal">({score})</span>
      )}
    </span>
  );
}
export default RiskBadge;
