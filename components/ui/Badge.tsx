import { cn } from "@/lib/utils/format";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
}

const variants = {
  default: "bg-white/10 text-slate-300",
  success: "bg-emerald-500/20 text-emerald-300",
  warning: "bg-amber-500/20 text-amber-300",
  danger: "bg-rose-500/20 text-rose-300",
  info: "bg-cyan-500/20 text-cyan-300",
  purple: "bg-violet-500/20 text-violet-300",
};

const statusVariants: Record<string, BadgeProps["variant"]> = {
  "Não iniciada": "default",
  Aberta: "success",
  "Em preenchimento": "info",
  Enviada: "success",
  Encerrada: "warning",
  Processada: "purple",
  Rascunho: "warning",
  Pendente: "warning",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariants[status] || "default";
  return <Badge variant={variant}>{status}</Badge>;
}
