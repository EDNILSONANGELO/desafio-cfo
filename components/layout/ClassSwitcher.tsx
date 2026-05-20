"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, BookOpen, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils/format";
import Link from "next/link";

interface ClassItem {
  id: string;
  name: string;
}

interface ClassSwitcherProps {
  currentClassId?: string;
}

export function ClassSwitcher({ currentClassId }: ClassSwitcherProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [activeClass, setActiveClass] = useState<ClassItem | null>(null);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/professors/my-classes")
      .then((r) => r.json())
      .then((d) => {
        const list: ClassItem[] = d.classes ?? [];
        setClasses(list);
        const active = list.find((c) => c.id === (d.activeClassId ?? currentClassId));
        setActiveClass(active ?? list[0] ?? null);
      })
      .catch(() => {});
  }, [currentClassId]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function switchClass(cls: ClassItem) {
    if (cls.id === activeClass?.id) { setOpen(false); return; }
    setSwitching(true);
    try {
      const res = await fetch("/api/professors/switch-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: cls.id }),
      });
      if (res.ok) {
        setActiveClass(cls);
        setOpen(false);
        router.refresh(); // atualiza dados da página com nova turma
      }
    } finally {
      setSwitching(false);
    }
  }

  if (classes.length === 0) return null;

  return (
    <div ref={ref} className="relative w-full px-2 pb-2">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5",
          "text-left text-xs transition-colors hover:bg-white/10",
          switching && "opacity-60 cursor-wait"
        )}
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <span className="flex-1 truncate font-semibold text-white leading-tight">
          {activeClass?.name ?? "Selecionar turma"}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 overflow-hidden rounded-xl border border-white/15 bg-slate-900 shadow-2xl z-50">
          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Suas Turmas
          </p>

          <div className="max-h-52 overflow-y-auto">
            {classes.map((cls) => {
              const isActive = cls.id === activeClass?.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => switchClass(cls)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors",
                    isActive
                      ? "bg-cyan-400/10 text-cyan-300"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate font-medium">{cls.name}</span>
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-400" />}
                </button>
              );
            })}
          </div>

          {/* Link para criar nova turma */}
          <div className="border-t border-white/10">
            <Link
              href="/professor/configuracoes"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Gerenciar turmas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
