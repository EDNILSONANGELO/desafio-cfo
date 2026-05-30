"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Calculator,
  Globe,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils/format";

const navItems = [
  { href: "/aluno",           icon: LayoutDashboard, label: "Início",     exact: true },
  { href: "/aluno/resultados",icon: BarChart3,        label: "Resultados"             },
  { href: "/aluno/mercado",   icon: Globe,            label: "Mercado"                },
  { href: "/aluno/notas",     icon: GraduationCap,   label: "Notas"                  },
];

/** Busca a rodada aberta do aluno para montar o link do formulário */
function useActiveRoundHref() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rounds", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const rounds: Array<{ id: number; status: string }> = data.rounds || [];
        // Prioridade: Aberta → Em preenchimento → Não iniciada → qualquer uma
        const open = rounds.find((r) => r.status === "Aberta")
          ?? rounds.find((r) => r.status === "Em preenchimento")
          ?? rounds.find((r) => r.status === "Não iniciada")
          ?? rounds[0];
        if (open) setHref(`/aluno/formulario/${open.id}`);
      })
      .catch(() => {});
  }, []);

  return href;
}

export function StudentSidebar() {
  const pathname = usePathname();
  const roundHref = useActiveRoundHref();
  const roundActive = pathname.startsWith("/aluno/formulario");

  return (
    <aside className="hidden w-20 shrink-0 flex-col items-center border-r border-cyan-400/10 bg-cfo-sidebar py-6 lg:flex">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400">
        <Calculator className="h-5 w-5 text-slate-950" />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} title={label}>
              <div
                className={cn(
                  "relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl transition-all duration-200",
                  active
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="student-sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-cyan-400"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative mt-0.5 text-[9px] font-bold leading-none">{label}</span>
              </div>
            </Link>
          );
        })}

        {/* Link dinâmico para o formulário da rodada ativa */}
        {roundHref ? (
          <Link href={roundHref} title="Formulário da Rodada">
            <div
              className={cn(
                "relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl transition-all duration-200",
                roundActive
                  ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              )}
            >
              {roundActive && (
                <motion.div
                  layoutId="student-sidebar-active"
                  className="absolute inset-0 rounded-2xl bg-cyan-400"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <ClipboardList className="relative h-5 w-5" />
              <span className="relative mt-0.5 text-[9px] font-bold leading-none">Rodada</span>
            </div>
          </Link>
        ) : (
          /* Sem rodada disponível — botão desabilitado com tooltip */
          <div
            title="Nenhuma rodada aberta no momento"
            className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl text-slate-600 cursor-not-allowed"
          >
            <ClipboardList className="h-5 w-5" />
            <span className="mt-0.5 text-[9px] font-bold leading-none">Rodada</span>
          </div>
        )}
      </nav>
    </aside>
  );
}

export function StudentMobileNav() {
  const pathname = usePathname();
  const roundHref = useActiveRoundHref();
  const roundActive = pathname.startsWith("/aluno/formulario");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-cyan-400/10 bg-cfo-sidebar lg:hidden">
      {navItems.map(({ href, icon: Icon, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition-colors",
              active ? "text-cyan-400" : "text-slate-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}

      {/* Rodada — mobile */}
      {roundHref ? (
        <Link
          href={roundHref}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition-colors",
            roundActive ? "text-cyan-400" : "text-slate-500"
          )}
        >
          <ClipboardList className="h-5 w-5" />
          Rodada
        </Link>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-semibold text-slate-700 cursor-not-allowed">
          <ClipboardList className="h-5 w-5" />
          Rodada
        </div>
      )}
    </nav>
  );
}
