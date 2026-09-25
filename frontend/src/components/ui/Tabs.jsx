"use client";

import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext(null);

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : uncontrolledValue;

  const setActiveValue = (val) => {
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue }}>
      <div className={cn("w-full space-y-4", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className, variant = 'underline' }) {
  const variants = {
    underline: "flex items-center gap-2 border-b border-slate-200 overflow-x-auto scroll-snap-x",
    pills: "inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 gap-1",
  };

  return (
    <div className={cn(variants[variant] || variants.underline, className)} role="tablist">
      {children}
    </div>
  );
}

export function TabTrigger({
  value,
  children,
  icon: Icon,
  badge,
  className,
  variant = 'underline',
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabTrigger must be used within Tabs");

  const isActive = context.activeValue === value;

  const activeStyles = {
    underline: "border-emerald-900 text-emerald-950 font-bold border-b-2 bg-emerald-50/20",
    pills: "bg-white text-emerald-950 font-bold shadow-xs border border-slate-200/80",
  };

  const inactiveStyles = {
    underline: "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium",
    pills: "text-slate-600 hover:text-slate-900 font-medium",
  };

  const baseStyles = {
    underline: "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap transition-all duration-150 -mb-[1px] select-none",
    pills: "flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all duration-150 select-none",
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => context.setActiveValue(value)}
      className={cn(
        baseStyles[variant],
        isActive ? activeStyles[variant] : inactiveStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {badge !== undefined && (
        <span className={cn(
          "ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full",
          isActive ? "bg-emerald-900 text-white" : "bg-slate-200 text-slate-700"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

export function TabContent({ value, children, className }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabContent must be used within Tabs");

  if (context.activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn("animate-in fade-in-50 duration-150", className)}
    >
      {children}
    </div>
  );
}

export default Tabs;
