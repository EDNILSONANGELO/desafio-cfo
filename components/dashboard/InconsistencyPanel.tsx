"use client";

import { AlertTriangle } from "lucide-react";
import type { SimulationResult } from "@/types";

interface Props {
  results: SimulationResult[];
}

export function InconsistencyPanel({ results }: Props) {
  const withIssues = results.filter((r) => r.inconsistencies.length > 0);

  if (!withIssues.length) return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        <h3 className="font-bold text-amber-300">
          Inconsistências detectadas ({withIssues.length} grupo
          {withIssues.length > 1 ? "s" : ""})
        </h3>
      </div>
      <div className="space-y-3">
        {withIssues.map((r) => (
          <div
            key={r.companyId}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <p className="mb-2 font-semibold text-white">
              {r.company}{" "}
              <span className="text-xs text-slate-400">({r.group})</span>
            </p>
            <ul className="list-disc space-y-1 pl-4">
              {r.inconsistencies.map((issue, i) => (
                <li key={i} className="text-sm text-amber-200">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
