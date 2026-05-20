"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/format";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, value, ...props }, ref) => {
    // Campos numéricos com valor 0 aparecem em branco —
    // o usuário digita direto sem precisar apagar o zero primeiro.
    const displayValue =
      props.type === "number" && (value === 0 || value === "0") ? "" : value;

    return (
      <label className="block">
        {label && (
          <span className="mb-1 block text-xs font-semibold text-slate-300">
            {label}
          </span>
        )}
        <input
          ref={ref}
          value={displayValue}
          className={cn(
            // text-base (16px) evita zoom automático no iOS ao focar o campo
            "w-full rounded-xl border bg-slate-950/60 px-3 py-2.5 text-base sm:text-sm text-white outline-none transition-colors",
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
            // text-base (16px) evita zoom automático no iOS ao focar o campo
            "w-full rounded-xl border bg-slate-950/60 px-3 py-2.5 text-base sm:text-sm text-white outline-none transition-colors",
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
