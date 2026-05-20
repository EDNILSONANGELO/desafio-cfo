"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ClassItem {
  id: string;
  name: string;
  polo: string | null;
}

interface PoloCtx {
  /** Polos disponíveis do professor (da sessão) */
  professorPolos: string[];
  /** Polo ativo. null = "Todos" */
  selectedPolo: string | null;
  setSelectedPolo: (polo: string | null) => void;
  /** Turmas do professor (carregadas via API) */
  myClasses: ClassItem[];
  /** Recarrega a lista de turmas (útil após criar/renomear turma) */
  reloadClasses: () => void;
  /** ID da turma selecionada para configuração (armazenada no JWT da sessão) */
  activeClassId: string | null;
  /** Nome da turma selecionada para configuração */
  activeClassName: string | null;
  /**
   * IDs das turmas que pertencem ao polo selecionado.
   * Array vazio significa "todas as turmas" (sem filtro).
   */
  selectedClassIds: string[];
  /** String estável para usar como dependência em useCallback/useEffect */
  selectedClassIdsKey: string;
  /**
   * Query param pronto para filtrar alunos pelo campo polo.
   * Ex: "&polo=Norte" ou "" quando não há polo selecionado.
   * Use este para filtrar alunos diretamente (independente de turmas).
   */
  poloParam: string;
  isMaster: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const PoloContext = createContext<PoloCtx | null>(null);

const LS_KEY = "arena_polo_selected";

// ── Provider ─────────────────────────────────────────────────────────────────

interface PoloProviderProps {
  children: ReactNode;
  /** Valor de session.polo vindo do server (ex: "Polo Norte, Polo Sul") */
  professorPolo: string | null;
  isMaster: boolean;
  /** classId da sessão server-side (para inicializar activeClassId) */
  currentClassId?: string;
}

export function PoloProvider({ children, professorPolo, isMaster, currentClassId }: PoloProviderProps) {
  const professorPolos = useMemo<string[]>(() => {
    if (!professorPolo?.trim()) return [];
    return professorPolo.split(",").map((p) => p.trim()).filter(Boolean);
  }, [professorPolo]);

  const [selectedPolo, setSelState] = useState<string | null>(null);
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(currentClassId ?? null);

  // Hidrata do localStorage após o mount (evita mismatch SSR/CSR)
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored && (professorPolos.includes(stored) || professorPolos.length === 0)) {
      setSelState(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // roda só uma vez

  // Busca turmas (e activeClassId atual) para todos os menus
  const reloadClasses = useCallback(() => {
    if (isMaster) return;
    fetch("/api/professors/my-classes")
      .then((r) => r.json())
      .then((d) => {
        setMyClasses(d.classes ?? []);
        // Atualiza o activeClassId se a API retornar um valor
        if (d.activeClassId) setActiveClassId(d.activeClassId);
        else if (!activeClassId && d.classes?.length) setActiveClassId(d.classes[0].id);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaster]);

  useEffect(() => { reloadClasses(); }, [reloadClasses]);

  function setSelectedPolo(polo: string | null) {
    setSelState(polo);
    if (polo) localStorage.setItem(LS_KEY, polo);
    else localStorage.removeItem(LS_KEY);
  }

  // Nome da turma ativa
  const activeClassName = useMemo(
    () => myClasses.find((c) => c.id === activeClassId)?.name ?? null,
    [myClasses, activeClassId]
  );

  // IDs das turmas que batem com o polo selecionado
  const selectedClassIds = useMemo<string[]>(() => {
    if (!selectedPolo) return [];
    return myClasses
      .filter((c) => {
        if (!c.polo) return false;
        return c.polo.split(",").map((p) => p.trim()).includes(selectedPolo);
      })
      .map((c) => c.id);
  }, [selectedPolo, myClasses]);

  const selectedClassIdsKey = selectedClassIds.join(",");

  // Query param direto para filtrar alunos pelo campo polo (independe de turmas)
  const poloParam = selectedPolo ? `&polo=${encodeURIComponent(selectedPolo)}` : "";

  return (
    <PoloContext.Provider
      value={{
        professorPolos,
        selectedPolo,
        setSelectedPolo,
        myClasses,
        reloadClasses,
        activeClassId,
        activeClassName,
        selectedClassIds,
        selectedClassIdsKey,
        poloParam,
        isMaster,
      }}
    >
      {children}
    </PoloContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePoloContext(): PoloCtx {
  const ctx = useContext(PoloContext);
  if (!ctx) throw new Error("usePoloContext deve ser usado dentro de <PoloProvider>");
  return ctx;
}
