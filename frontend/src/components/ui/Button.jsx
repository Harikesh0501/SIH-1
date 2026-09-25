import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Institutional Government Button Component
 * Standardized for Defense Command, Medical Triage, and Jawan Portals.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium select-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";

  const variantStyles = {
    // Primary: Deep Black (#000000 / #09090B)
    primary: "bg-black text-white hover:bg-zinc-800 active:bg-zinc-950 focus:ring-black border border-black shadow-xs",
    
    // Monochrome Accent (replaces champagne): Sleek Dark Slate
    champagne: "bg-slate-900 text-white hover:bg-slate-800 active:bg-black focus:ring-slate-900 border border-slate-900 shadow-xs font-semibold",
    
    // Outline: Clean 1px border with Slate text
    outline: "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:text-black focus:ring-slate-400 shadow-2xs",
    
    // Secondary: Institutional Slate Neutral
    secondary: "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 focus:ring-slate-400",
    
    // Ghost: Seamless inline trigger
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300",
    
    // Destructive: Emergency / Flag / Rejection
    destructive: "bg-red-600 text-white border border-red-700 hover:bg-red-700 active:bg-red-800 focus:ring-red-600 shadow-xs",

    // Success / Resilient Tier
    success: "bg-slate-900 text-white border border-slate-950 hover:bg-slate-800 active:bg-black shadow-xs",
  };

  const sizeStyles = {
    xs: "text-xs px-2.5 py-1 rounded gap-1.5 h-7",
    sm: "text-xs px-3 py-1.5 rounded-md gap-1.5 h-8 font-medium",
    md: "text-sm px-4 py-2 rounded-md gap-2 h-9",
    lg: "text-base px-5 py-2.5 rounded-lg gap-2.5 h-11 font-semibold",
    icon: "p-2 rounded-md h-9 w-9 justify-center",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!isLoading && RightIcon && (
        <RightIcon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}

export default Button;
