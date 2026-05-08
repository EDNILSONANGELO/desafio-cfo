"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calculator,
  Trophy,
  Building2,
  ClipboardList,
  Lock,
  GraduationCap,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"professor" | "aluno">("professor");
  const [email, setEmail] = useState("professor@desafiocfo.com");
  const [password, setPassword] = useState("admin123");
  const [ra, setRa] = useState("1001");
  const [studentPassword, setStudentPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");

    try {
      const body =
        mode === "professor"
          ? { role: "teacher", email, password }
          : { role: "student", ra, password: studentPassword };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login");
        return;
      }

      if (data.user.role === "teacher") {
        router.push("/professor");
      } else {
        router.push("/aluno");
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cfo-bg p-4">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
      >
        <div className="grid md:grid-cols-2">
          {/* Left: Brand */}
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 shadow-lg shadow-cyan-500/30">
                <Calculator className="h-6 w-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Desafio CFO</h1>
                <p className="text-xs text-slate-400">Simulador Empresarial Contábil</p>
              </div>
            </div>

            <h2 className="mt-10 text-4xl font-black leading-tight text-white">
              Aprenda contabilidade <span className="text-cyan-400">competindo</span>
            </h2>
            <p className="mt-4 text-slate-300">
              Gerencie uma empresa de garrafas sustentáveis, tome decisões financeiras
              e vença seus concorrentes no mercado.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { icon: Trophy, label: "Ranking automático", color: "text-amber-300" },
                { icon: Building2, label: "Empresas por região", color: "text-cyan-300" },
                { icon: ClipboardList, label: "Rodadas online", color: "text-emerald-300" },
                { icon: Lock, label: "Segurança por grupo", color: "text-rose-300" },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  <span className="text-sm text-slate-300">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs font-semibold text-slate-400">
                🧪 Credenciais de teste
              </p>
              <div className="space-y-1 text-xs text-slate-300">
                <p>
                  <strong>Professor:</strong> professor@desafiocfo.com / admin123
                </p>
                <p>
                  <strong>Aluno:</strong> RA 1001, 2001, 3001, 4001 | Senha: 123456
                </p>
              </div>
            </div>
          </div>

          {/* Right: Login form */}
          <div className="border-l border-white/10 bg-slate-900/50 p-8 md:p-12">
            {/* Toggle */}
            <div className="mb-8 flex rounded-2xl bg-slate-950/70 p-1.5">
              <button
                onClick={() => setMode("professor")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  mode === "professor"
                    ? "bg-cyan-400 text-slate-950 shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Professor
              </button>
              <button
                onClick={() => setMode("aluno")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  mode === "aluno"
                    ? "bg-cyan-400 text-slate-950 shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Aluno (RA)
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {mode === "professor" ? (
                <>
                  <Input
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="professor@escola.com"
                    autoComplete="email"
                  />
                  <div className="relative">
                    <Input
                      label="Senha"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-slate-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                    <GraduationCap className="mb-2 h-6 w-6 text-cyan-300" />
                    <p className="text-sm font-semibold text-white">Login por RA</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Use o número de matrícula (RA) cadastrado pelo seu professor.
                    </p>
                  </div>
                  <Input
                    label="RA (Registro Acadêmico)"
                    type="text"
                    value={ra}
                    onChange={(e) => setRa(e.target.value)}
                    placeholder="Ex: 123456"
                    autoComplete="username"
                  />
                  <div className="relative">
                    <Input
                      label="Senha"
                      type={showPassword ? "text" : "password"}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-slate-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </>
              )}

              <Button
                onClick={handleLogin}
                loading={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Entrando..." : "Entrar na plataforma"}
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              EcoBottle Ind. de Garrafas Sustentáveis · Simulação acadêmica
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
