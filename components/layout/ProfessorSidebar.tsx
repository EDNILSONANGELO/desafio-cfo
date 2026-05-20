"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  PlayCircle,
  FileText,
  Settings,
  Calculator,
  Globe,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/format";
import { ClassSwitcher } from "./ClassSwitcher";

const baseNavItems = [
  { href: "/professor/configuracoes", icon: Settings, label: "Config." },
  { href: "/professor", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/professor/grupos", icon: Building2, label: "Grupos" },
  { href: "/professor/alunos", icon: Users, label: "Alunos" },
  { href: "/professor/rodadas", icon: PlayCircle, label: "Rodadas" },
  { href: "/professor/mercado", icon: Globe, label: "Mercado" },
  { href: "/professor/relatorios", icon: FileText, label: "Relatórios" },
  { href: "/professor/notas", icon: GraduationCap, label: "Notas" },
];

const masterNavItem = { href: "/professor/admin", icon: ShieldCheck, label: "Admin", exact: false };

interface SidebarProps {
  isMaster?: boolean;
  polo?: string;
  currentClassId?: string;
}

export function ProfessorSidebar({ isMaster = false, currentClassId }: SidebarProps) {
  const pathname = usePathname();
  // Master vê somente o item Admin; professor normal vê o menu completo
  const navItems = isMaster ? [masterNavItem] : baseNavItems;

  return (
    <aside className="hidden w-20 shrink-0 flex-col items-center border-r border-cyan-400/10 bg-cfo-sidebar py-4 lg:flex">
      {/* Logo */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400">
        <Calculator className="h-5 w-5 text-slate-950" />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const isMasterItem = href === "/professor/admin";
          return (
            <Link key={href} href={href} title={label}>
              <div
                className={cn(
                  "relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl transition-all duration-200",
                  active
                    ? isMasterItem
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                      : "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30"
                    : isMasterItem
                    ? "text-violet-400 hover:bg-violet-500/20 hover:text-violet-300"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className={cn(
                      "absolute inset-0 rounded-2xl",
                      isMasterItem ? "bg-violet-500" : "bg-cyan-400"
                    )}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative mt-0.5 text-[9px] font-bold leading-none">
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Switcher de turma — só para professor normal */}
      {!isMaster && (
        <div className="w-full border-t border-white/10 pt-2 mt-2">
          <ClassSwitcher currentClassId={currentClassId} />
        </div>
      )}
    </aside>
  );
}

// Mobile bottom nav for professor — rola horizontalmente para mostrar todos os itens
export function ProfessorMobileNav({ isMaster = false }: SidebarProps) {
  const pathname = usePathname();
  // Master vê somente o item Admin no mobile também
  const navItems = isMaster ? [masterNavItem] : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-cyan-400/10 bg-cfo-sidebar lg:hidden">
      <div className="scrollbar-hide flex overflow-x-auto">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 px-4 py-3 text-[10px] font-semibold transition-colors",
                active ? "text-cyan-400" : "text-slate-500"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
