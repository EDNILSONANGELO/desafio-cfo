import { cn } from "@/lib/utils/format";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <svg
        className={cn("animate-spin text-cyan-400", sizes[size])}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
}

export function PageLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
