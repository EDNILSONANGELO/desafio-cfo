"use client";

import { useRouter } from "next/navigation";
import { LogOut, Bell, Calculator } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TopBarProps {
  name: string;
  role: "teacher" | "student";
  subtitle?: string;
}

export function TopBar({ name, role, subtitle }: TopBarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-cyan-400/10 bg-cfo-sidebar/90 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400">
          <Calculator className="h-4 w-4 text-slate-950" />
        </div>
        <div>
          <span className="text-sm font-black text-white">Desafio CFO</span>
          {subtitle && (
            <span className="ml-2 text-xs text-slate-400">{subtitle}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-slate-400">
            {role === "teacher" ? "Professor" : "Aluno"}
          </p>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
