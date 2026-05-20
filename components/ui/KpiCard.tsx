"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/format";

interface KpiCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  accent?: "cyan" | "emerald" | "amber" | "rose" | "violet";
  className?: string;
}

const accents = {
  cyan: "text-cyan-300",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  rose: "text-rose-300",
  violet: "text-violet-300",
};

export function KpiCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  accent = "cyan",
  className,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 truncate">{title}</p>
          <h3 className="mt-1 text-xl sm:text-2xl font-black text-white leading-tight break-words">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-xs font-semibold",
                trend.value >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value).toFixed(1)}%{" "}
              {trend.label}
            </p>
          )}
        </div>
        <div className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Icon className={cn("h-5 w-5", accents[accent])} />
        </div>
      </div>
    </motion.div>
  );
}
