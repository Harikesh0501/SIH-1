import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Standard Single Progress Meter
 */
export function ProgressBar({
  value = 0,
  max = 100,
  label,
  sublabel,
  showValue = true,
  variant = 'emerald', // 'emerald' | 'champagne' | 'amber' | 'red' | 'dynamic-stress' | 'dynamic-readiness'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  className,
}) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  // Dynamic color assignments based on threshold
  let barColor = "bg-emerald-700";
  if (variant === 'dynamic-stress') {
    if (percentage >= 80) barColor = "bg-red-600";
    else if (percentage >= 65) barColor = "bg-orange-500";
    else if (percentage >= 45) barColor = "bg-amber-500";
    else barColor = "bg-emerald-600";
  } else if (variant === 'dynamic-readiness') {
    if (percentage >= 80) barColor = "bg-emerald-600";
    else if (percentage >= 65) barColor = "bg-amber-500";
    else barColor = "bg-red-600";
  } else if (variant === 'champagne') {
    barColor = "bg-slate-800";
  } else if (variant === 'mono') {
    barColor = "bg-black";
  } else if (variant === 'amber') {
    barColor = "bg-amber-500";
  } else if (variant === 'red') {
    barColor = "bg-red-600";
  }

  const heightStyles = {
    xs: "h-1.5",
    sm: "h-2",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              {label}
              {sublabel && <span className="font-normal text-slate-400">({sublabel})</span>}
            </span>
          )}
          {showValue && (
            <span className="font-mono font-bold text-slate-900 ml-auto">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}

      <div className={cn("w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-[1px]", heightStyles[size] || heightStyles.md)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Stacked Multi-Segment Risk Distribution Meter
 * Used for Battalion & Company Heatmaps (Resilient | Fatigued | Vulnerable | Critical).
 */
export function StackedProgressBar({
  segments = [], // [{ label, value, percentage, color, bgClass }]
  height = 'h-3',
  showLegend = true,
  className,
}) {
  const total = segments.reduce((sum, seg) => sum + (seg.value || 0), 0);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Stacked Progress Bar */}
      <div className={cn("w-full bg-slate-200 rounded-full overflow-hidden flex", height)}>
        {segments.map((seg, idx) => {
          const pct = seg.percentage !== undefined 
            ? seg.percentage 
            : total > 0 ? ((seg.value || 0) / total) * 100 : 0;
          if (pct <= 0) return null;

          return (
            <div
              key={idx}
              className={cn("h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full", seg.bgClass || "bg-slate-400")}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.value || pct.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Optional Inline Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", seg.bgClass)} />
              <span className="text-slate-600 font-medium">{seg.label}:</span>
              <span className="font-mono font-bold text-slate-900">{seg.value ?? `${(seg.percentage || 0).toFixed(0)}%`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
