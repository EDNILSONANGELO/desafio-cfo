"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/format";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, ...props }, ref) => {
    return (
      <label className="block">
        {label && (
          <span className="mb-1 block text-xs font-semibold text-slate-300">
            {label}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition-colors",
            "placeholder:text-slate-500",
            error
              ? "border-rose-500 focus:border-rose-400"
              : "border-white/10 focus:border-cyan-400",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
        {helper && !error && (
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        )}
      </label>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <label className="block">
        {label && (
          <span className="mb-1 block text-xs font-semibold text-slate-300">
            {label}
          </span>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full rounded-xl border bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition-colors",
            error
              ? "border-rose-500 focus:border-rose-400"
              : "border-white/10 focus:border-cyan-400",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </label>
    );
  }
);
Select.displayName = "Select";
