"use client";

import { useRouter } from "next/navigation";
import { LogOut, Calculator, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ManualButton } from "@/components/layout/ManualModal";

interface TopBarProps {
  name: string;
  role: "teacher" | "student";
  subtitle?: string;
  isMaster?: boolean;
  polo?: string;
}

/** Divide a string de polos em array, removendo espaços extras */
function parsePolos(polo?: string): string[] {
  if (!polo?.trim()) return [];
  return polo.split(",").map((p) => p.trim()).filter(Boolean);
}

export function TopBar({ name, role, subtitle, isMaster = false, polo }: TopBarProps) {
  const router = useRouter();
  const polos = parsePolos(polo);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-cyan-400/10 bg-cfo-sidebar/90 px-4 backdrop-blur sm:h-16 sm:px-6">
      {/* Logo / título */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400">
          <Calculator className="h-4 w-4 text-slate-950" />
        </div>
        <div>
          <span className="text-sm font-black text-white">Arena Contábil</span>
          <p className="hidden text-[10px] text-slate-400 leading-none mt-0.5 sm:block">Business Accounting Simulator</p>
        </div>

        {/* Separador + logo institucional — apenas desktop */}
        <div className="hidden sm:flex items-center gap-2.5 ml-1">
          <div className="h-6 w-px bg-white/15" />
          <div className="rounded-lg bg-white px-2 py-1 shadow-sm shadow-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-unifecaf.png"
              alt="UNIFECAF"
              width={70}
              height={29}
              style={{ objectFit: "contain", display: "block", height: "29px", width: "70px" }}
            />
          </div>
        </div>
      </div>

      {/* Ações à direita */}
      <div className="flex items-center gap-3">

        {/* Badge(s) de polo — destacado para o professor saber em qual polo está */}
        {!isMaster && polos.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            {polos.map((p) => (
              <span
                key={p}
                className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300"
              >
                <MapPin className="h-3 w-3 shrink-0" />
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Nome + papel */}
        <div className="hidden text-right sm:block">
          <div className="flex items-center justify-end gap-1.5">
            <p className="text-sm font-semibold text-white leading-tight">{name}</p>
            {isMaster && (
              <span className="flex items-center gap-0.5 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-300">
                <ShieldCheck className="h-2.5 w-2.5" />
                Master
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-tight">
            {role === "teacher" ? "Professor" : "Aluno"}
            {isMaster && (
              <span className="ml-1.5 text-violet-400">Administrador Master</span>
            )}
            {!isMaster && subtitle && (
              <span className="ml-1.5 font-mono text-cyan-400">{subtitle}</span>
            )}
          </p>
        </div>

        {/* Botão de Manual — específico por perfil */}
        <ManualButton role={role} />

        {/* Logout */}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
