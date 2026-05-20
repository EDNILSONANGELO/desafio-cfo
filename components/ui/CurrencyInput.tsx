"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/format";

export interface CurrencyInputProps {
  label?: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  helper?: string;
  error?: string;
  className?: string;
}

/** Formata número para exibição: 26000.5 → "26.000,50" | 0 ou null → "" */
export function numToDisplay(n: number | null | undefined): string {
  if (n == null || n === 0 || isNaN(n)) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte string (editada ou formatada) para número: "26.000,50" ou "26000,50" → 26000.5 */
export function displayToNum(s: string): number | null {
  if (!s.trim()) return null;
  // Remove separadores de milhar (.) e troca vírgula decimal por ponto
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalized);
  if (isNaN(n) || n < 0) return null;
  return n;
}

/** Filtra teclas inválidas durante a digitação */
function applyEditMask(raw: string): string {
  // Mantém apenas dígitos e vírgula (separador decimal pt-BR)
  let cleaned = raw.replace(/[^\d,]/g, "");
  // Garante no máximo uma vírgula e máximo 2 casas decimais
  const commaIdx = cleaned.indexOf(",");
  if (commaIdx !== -1) {
    const beforeComma = cleaned.slice(0, commaIdx);
    const afterComma = cleaned.slice(commaIdx + 1).replace(/,/g, "").slice(0, 2);
    cleaned = beforeComma + "," + afterComma;
  }
  return cleaned;
}

/**
 * Input monetário com máscara brasileira (R$).
 *
 * - Exibe prefixo "R$" fixo à esquerda
 * - Durante digitação aceita apenas dígitos e vírgula
 * - Ao perder foco formata com separador de milhar: "26.000,50"
 * - value: number | null  (null = vazio / não definido)
 * - onChange devolve number | null
 */
export function CurrencyInput({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "0,00",
  helper,
  error,
  className,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => numToDisplay(value));
  const [focused, setFocused] = useState(false);
  const externalValue = useRef(value);

  // Sincroniza quando o valor externo muda (e o campo não está em foco)
  useEffect(() => {
    if (!focused && value !== externalValue.current) {
      externalValue.current = value;
      setDisplay(numToDisplay(value));
    }
  }, [value, focused]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyEditMask(e.target.value);
    setDisplay(masked);
    onChange(displayToNum(masked));
  }

  function handleFocus() {
    setFocused(true);
    // Remove separadores de milhar para facilitar edição: "26.000,50" → "26000,50"
    setDisplay((prev) => prev.replace(/\./g, ""));
  }

  function handleBlur() {
    setFocused(false);
    const num = displayToNum(display);
    externalValue.current = num;
    onChange(num);
    // Formata com separadores de milhar ao sair do campo
    setDisplay(numToDisplay(num));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowed = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight",
      "ArrowUp", "ArrowDown", "Tab", "Home", "End", "Enter",
    ];
    if (allowed.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return; // Ctrl+A, Ctrl+C, Ctrl+V, etc.
    if (/^\d$/.test(e.key)) return;
    if (e.key === ",") return; // separador decimal pt-BR
    e.preventDefault();
  }

  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-xs font-semibold text-slate-300">
          {label}
        </span>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm font-semibold text-slate-400">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={display}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            // text-base (16px) evita zoom automático no iOS ao focar o campo
            "w-full rounded-xl border bg-slate-950/60 py-2.5 pl-9 pr-3 text-base sm:text-sm text-white outline-none transition-colors",
            "placeholder:text-slate-500",
            error
              ? "border-rose-500 focus:border-rose-400"
              : "border-white/10 focus:border-cyan-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </label>
  );
}
