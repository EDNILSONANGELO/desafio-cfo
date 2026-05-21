"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Detecta inatividade do usuário (sem cliques, teclas, mouse ou toque por 15 min)
 * e faz logout automático redirecionando para /login?expired=1.
 */
export function useInactivityLogout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // silencia erros de rede — ainda redireciona
        }
        router.push("/login?expired=1");
      }, INACTIVITY_MS);
    }

    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"] as const;

    // Inicia o timer imediatamente
    resetTimer();

    // Reinicia o timer a cada interação
    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [router]);
}
