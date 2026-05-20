"use client";

import Link from "next/link";
import { BookOpen, AlertTriangle } from "lucide-react";
import { usePoloContext } from "@/contexts/PoloContext";

/**
 * Exibe um banner de aviso quando nenhuma turma está selecionada para configuração.
 * Usado em todas as páginas do professor que dependem de uma turma.
 */
export function NoClassBanner() {
  const { activeClassId, myClasses, isMaster } = usePoloContext();

  // Mestre não tem turma — não exibe o banner
  if (isMaster) return null;
  // Turma selecionada — tudo certo
  if (activeClassId) return null;
  // Ainda carregando (lista vazia e activeClassId ainda não chegou) — silencioso
  if (myClasses.length === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-300">
          Nenhuma turma selecionada para configuração
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Selecione uma turma antes de continuar. Configurações, rodadas e importações utilizam a turma selecionada.
        </p>
      </div>
      <Link
        href="/professor/configuracoes"
        className="shrink-0 flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Selecionar turma
      </Link>
    </div>
  );
}
