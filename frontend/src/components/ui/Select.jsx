import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, ChevronDown } from 'lucide-react';

export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  children,
  className,
  required = false,
  disabled = false,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-xs">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={cn(
            "w-full rounded-md border text-sm transition-all duration-150 bg-white py-2 pl-3 pr-10 appearance-none focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
            error
              ? "border-red-400 text-red-900 focus:ring-red-500 focus:border-red-500"
              : "border-slate-300 text-slate-900 focus:ring-emerald-800 focus:border-emerald-800",
            className
          )}
          {...props}
        >
          {children || options.map((opt) => {
            const value = typeof opt === 'object' ? opt.value : opt;
            const labelText = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
