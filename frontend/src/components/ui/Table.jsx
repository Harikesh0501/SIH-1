import React from 'react';
import { cn } from '../../lib/utils';

export function Table({ children, className, striped = false, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
      <table
        className={cn("w-full text-left text-sm text-slate-800 border-collapse", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className, ...props }) {
  return (
    <thead
      className={cn("bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-600 select-none sticky top-0 z-10", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }) {
  return (
    <tbody
      className={cn("divide-y divide-slate-100", className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, isHighlighted = false, hoverable = true, ...props }) {
  return (
    <tr
      className={cn(
        "transition-colors duration-100",
        hoverable && "hover:bg-slate-50/80",
        isHighlighted && "bg-slate-50 font-medium",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className, align = 'left', ...props }) {
  const aligns = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th
      className={cn("py-3 px-4 font-semibold text-slate-700 whitespace-nowrap", aligns[align], className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, align = 'left', isMono = false, ...props }) {
  const aligns = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={cn(
        "py-3.5 px-4 text-sm text-slate-800 align-middle",
        aligns[align],
        isMono && "font-mono text-xs font-medium text-slate-900 tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableEmpty({ message = "No records found matching criteria.", colSpan = 8 }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-12 text-center text-sm text-slate-500 bg-slate-50/50"
      >
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="font-medium text-slate-700">{message}</p>
          <p className="text-xs text-slate-400">All data verified under audit compliance standards.</p>
        </div>
      </td>
    </tr>
  );
}

export default Table;
