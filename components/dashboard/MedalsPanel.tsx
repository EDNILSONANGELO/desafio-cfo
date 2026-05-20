"use client";

import { motion } from "framer-motion";
import type { Medal } from "@/types";

interface Props {
  medals: Medal[];
}

const MEDAL_LABELS: Record<string, string> = {
  melhor_cfo:        "Melhor Gestor",
  melhor_gestor:     "Melhor Gestor",
  melhor_liquidez:   "Melhor Liquidez",
  melhor_roi:        "Melhor ROI",
  melhor_margem:     "Melhor Margem",
  melhor_receita:    "Maior Receita",
  melhor_market_share: "Maior Market Share",
  menor_ciclo:       "Menor Ciclo Financeiro",
};

function medalLabel(type: string): string {
  return (
    MEDAL_LABELS[type] ??
    type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

export function MedalsPanel({ medals }: Props) {
  if (!medals.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {medals.map((medal, idx) => (
        <motion.div
          key={medal.id ?? `${medal.group_id}-${medal.type}-${idx}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.08 }}
          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <span className="text-3xl">{medal.icon}</span>
          <div>
            <p className="text-sm font-bold text-white">{medalLabel(medal.type)}</p>
            <p className="mt-0.5 text-xs text-slate-400">{medal.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
