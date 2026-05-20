"use client";

import { MapPin } from "lucide-react";
import { usePoloContext } from "@/contexts/PoloContext";

/**
 * Seletor global de Polo/Unidade.
 * Aparece abaixo do TopBar, acima do conteúdo, em TODAS as páginas do professor.
 * Quando o professor seleciona um polo, todos os dados de todas as páginas
 * são filtrados automaticamente para aquele polo.
 */
export function PoloSelector() {
  const { professorPolos, selectedPolo, setSelectedPolo, isMaster } = usePoloContext();

  // Não exibe para o master nem quando não há polos configurados
  if (isMaster || professorPolos.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0 mr-1">
        <MapPin className="h-3.5 w-3.5" />
        Filtrar polo
      </div>

      {/* Todos */}
      <button
        onClick={() => setSelectedPolo(null)}
        className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-all duration-150 ${
          !selectedPolo
            ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
            : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        Todos
      </button>

      {/* Um botão por polo */}
      {professorPolos.map((polo) => (
        <button
          key={polo}
          onClick={() => setSelectedPolo(polo)}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-semibold transition-all duration-150 ${
            selectedPolo === polo
              ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
              : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {polo}
        </button>
      ))}

      {/* Indicador de filtro ativo */}
      {selectedPolo && (
        <span className="ml-auto text-[11px] text-slate-500">
          Exibindo dados de <span className="font-bold text-cyan-400">{selectedPolo}</span>
        </span>
      )}
    </div>
  );
}
