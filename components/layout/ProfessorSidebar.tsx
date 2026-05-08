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
} from "lucide-react";
import { cn } from "@/lib/utils/format";

const navItems = [
  { href: "/professor", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/professor/alunos", icon: Users, label: "Alunos" },
  { href: "/professor/grupos", icon: Building2, label: "Grupos" },
  { href: "/professor/rodadas", icon: PlayCircle, label: "Rodadas" },
  { href: "/professor/mercado", icon: Globe, label: "Mercado" },
  { href: "/professor/relatorios", icon: FileText, label: "Relatórios" },
  { href: "/professor/configuracoes", icon: Settings, label: "Config." },
];

export function ProfessorSidebar() {
  const pathname = usePathname();

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
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-cyan-400"
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
    </aside>
  );
}

// Mobile bottom nav for professor
export function ProfessorMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-cyan-400/10 bg-cfo-sidebar lg:hidden">
      {navItems.slice(0, 5).map(({ href, icon: Icon, label, exact }) => {
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
    </nav>
  );
}
