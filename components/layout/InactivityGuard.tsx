"use client";

import { useInactivityLogout } from "@/hooks/useInactivityLogout";

/**
 * Componente invisível que ativa o logout automático por inatividade.
 * Inclua-o dentro de qualquer layout protegido (professor, aluno).
 */
export function InactivityGuard() {
  useInactivityLogout();
  return null;
}
