import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Institutional Government Card Component
 * Crisp 1px border, white canvas, subtle institutional shadow.
 */
export function Card({
  children,
  className,
  accent,
  hoverable = false,
  ...props
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-150",
        hoverable && "hover:shadow-sm hover:border-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, action, ...props }) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4",
        className
      )}
      {...props}
    >
      <div className="space-y-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className, subtitle, ...props }) {
  return (
    <div className={className}>
      <h3
        className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2"
        {...props}
      >
        {children}
      </h3>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p
      className={cn("text-xs text-slate-500 font-normal leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className, noPadding = false, ...props }) {
  return (
    <div
      className={cn(!noPadding && "p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
