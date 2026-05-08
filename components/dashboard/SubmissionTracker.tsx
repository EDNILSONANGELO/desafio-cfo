"use client";

import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import type { Group, Submission } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";

interface Props {
  groups: Group[];
  submissions: Submission[];
  onCancelSubmission?: (groupId: number) => void;
}

const groupColors = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-500",
  "from-green-500 to-emerald-600",
  "from-indigo-500 to-violet-600",
];

export function SubmissionTracker({ groups, submissions, onCancelSubmission }: Props) {
  const submitted = submissions.filter((s) => s.status === "Enviada").length;
  const total = groups.length;

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-slate-300">
            {submitted} de {total} grupos enviaram
          </span>
          <span className="text-sm font-bold text-cyan-400">
            {total ? Math.round((submitted / total) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${total ? (submitted / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group, idx) => {
          const submission = submissions.find(
            (s) => s.group_id === group.id
          );
          const isSubmitted = submission?.status === "Enviada";
          const isDraft = submission?.status === "Rascunho";

          return (
            <div
              key={group.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
            >
              <div
                className={`mb-3 h-1 rounded-full bg-gradient-to-r ${
                  group.color || groupColors[idx % groupColors.length]
                }`}
              />
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white">{group.company_name}</p>
                  <p className="text-xs text-slate-400">
                    {group.name} · Região {group.region_name}
                  </p>
                </div>
                <div>
                  {isSubmitted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : isDraft ? (
                    <Clock className="h-5 w-5 text-amber-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-slate-500" />
                  )}
                </div>
              </div>

              <div className="mt-3">
                <StatusBadge status={isSubmitted ? "Enviada" : isDraft ? "Rascunho" : "Pendente"} />
                {isSubmitted && submission && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-300">
                      Por <strong>{submission.sent_by_name}</strong>
                    </p>
                    <p className="text-xs text-slate-400">
                      RA {submission.sent_by_ra}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(submission.sent_at)}
                    </p>
                    {onCancelSubmission && (
                      <button
                        onClick={() => onCancelSubmission(group.id)}
                        className="mt-1 text-xs text-rose-400 hover:text-rose-300 underline"
                      >
                        Cancelar envio
                      </button>
                    )}
                  </div>
                )}
                {!isSubmitted && !isDraft && (
                  <p className="mt-2 text-xs text-slate-500">
                    Aguardando preenchimento
                  </p>
                )}
                {isDraft && (
                  <p className="mt-2 text-xs text-amber-400">
                    Rascunho salvo
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
