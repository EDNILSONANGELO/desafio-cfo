"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/format";
import { LucideIcon } from "lucide-react";

interface PanelProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

export function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  actions,
  noPadding = false,
}: PanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm",
        !noPadding && "p-6",
        className
      )}
    >
      {(title || actions) && (
        <div className={cn("flex items-center justify-between gap-3", !noPadding && "mb-5")}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
            )}
            {title && (
              <div>
                <h2 className="text-base font-black text-white">{title}</h2>
                {subtitle && (
                  <p className="text-xs text-slate-400">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}
