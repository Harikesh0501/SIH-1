import React from 'react';
import { cn, getRiskTierConfig } from '../../lib/utils';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Institutional Government Risk & Classification Badge
 * Standardized across Battalion Commander, Welfare Officer, and Jawan views.
 */
export function Badge({
  children,
  tier, // 'resilient' | 'fatigued' | 'vulnerable' | 'critical'
  variant = 'default', // 'default' | 'outline' | 'dot' | 'pill' | 'classification'
  classification, // 'SECRET' | 'CONFIDENTIAL' | 'RESTRICTED' | 'APAR-DECOUPLED'
  score,
  showIcon = true,
  size = 'md',
  className,
  ...props
}) {
  // If a risk tier is passed, configure according to military risk tiers
  if (tier) {
    const config = getRiskTierConfig(tier);
    
    const sizeClasses = {
      sm: "text-[11px] px-2 py-0.5 gap-1",
      md: "text-xs px-2.5 py-1 gap-1.5 font-medium",
      lg: "text-sm px-3 py-1.5 gap-2 font-semibold",
    };

    const icons = {
      resilient: CheckCircle2,
      fatigued: AlertTriangle,
      vulnerable: AlertTriangle,
      critical: ShieldAlert,
    };
    const IconComponent = icons[tier.toLowerCase()] || Shield;

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border tracking-wide select-none font-medium",
          config.badge,
          sizeClasses[size] || sizeClasses.md,
          className
        )}
        {...props}
      >
        {variant === 'dot' ? (
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
        ) : (
          showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{children || config.label}</span>
        {score !== undefined && (
          <span className="font-mono text-[10px] opacity-80 pl-1 border-l border-current/20">
            {score}
          </span>
        )}
      </span>
    );
  }

  // Security Classification Badges
  if (classification) {
    const classConfigs = {
      'SECRET': "bg-red-950 text-red-200 border-red-800 font-mono tracking-widest",
      'CONFIDENTIAL': "bg-amber-950 text-amber-200 border-amber-800 font-mono tracking-wider",
      'RESTRICTED': "bg-slate-900 text-slate-200 border-slate-700 font-mono tracking-wider",
      'APAR-DECOUPLED': "bg-black text-white border-slate-700 font-sans font-semibold",
      'GOV-APPROVED': "bg-black text-white border-slate-700 font-sans font-semibold",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center text-[10px] uppercase font-bold px-2 py-0.5 rounded border select-none shadow-xs",
          classConfigs[classification] || "bg-slate-100 text-slate-800 border-slate-300",
          className
        )}
        {...props}
      >
        {classification === 'APAR-DECOUPLED' && <Shield className="w-3 h-3 mr-1 text-slate-300" />}
        {children || classification}
      </span>
    );
  }

  // Standard generic badge variants
  const standardVariants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-900 border-emerald-200",
    champagne: "bg-black text-white border-slate-800 font-semibold",
    outline: "bg-white text-slate-700 border-slate-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border font-medium select-none",
        standardVariants[variant] || standardVariants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
