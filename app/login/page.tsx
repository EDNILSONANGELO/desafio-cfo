"use client";

import Image from "next/image";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Trophy,
  Building2,
  ClipboardList,
  Lock,
  GraduationCap,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ── Modal de redefinição de senha do aluno ─────────────────────────────────────
function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const [resetRa, setResetRa]           = useState("");
  const [newPw, setNewPw]               = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);

  async function handleReset() {
    setError("");

    if (!resetRa.trim()) {
      setError("Informe seu RA.");
      return;
    }
    if (!newPw || newPw.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/student-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ra: resetRa.trim(), newPassword: newPw }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao alterar a senha. Tente novamente.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl"
      >
        {/* Botão fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {!success ? (
          <>
            {/* Cabeçalho */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 border border-cyan-400/20">
                <KeyRound className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Redefinir senha</h2>
                <p className="text-xs text-slate-400">Informe seu RA e escolha uma nova senha</p>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* RA */}
              <Input
                label="RA (Registro Acadêmico)"
                type="text"
                value={resetRa}
                onChange={(e) => { setResetRa(e.target.value); setError(""); }}
                placeholder="Ex: 123456"
                autoComplete="username"
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
              />

              {/* Nova senha */}
              <div className="relative">
                <Input
                  label="Nova senha"
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-white"
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Confirmar senha */}
              <div className="relative">
                <Input
                  label="Confirmar nova senha"
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />
              </div>

              {/* Hints inline */}
              {newPw.length > 0 && newPw.length < 6 && (
                <p className="text-xs text-amber-400">Mínimo de 6 caracteres.</p>
              )}
              {newPw.length >= 6 && confirmPw.length > 0 && newPw !== confirmPw && (
                <p className="text-xs text-rose-400">As senhas não coincidem.</p>
              )}

              <Button
                onClick={handleReset}
                loading={loading}
                disabled={!resetRa.trim() || newPw.length < 6 || newPw !== confirmPw}
                className="w-full"
                size="lg"
              >
                <KeyRound className="h-4 w-4" />
                Salvar nova senha
              </Button>
            </div>
          </>
        ) : (
          /* Tela de sucesso */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-4 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Senha alterada!</h2>
              <p className="mt-2 text-sm text-slate-400">
                Senha alterada com sucesso. Faça login novamente.
              </p>
            </div>
            <Button onClick={onClose} className="mt-2 w-full" size="lg">
              Fechar e fazer login
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ── Página de login ────────────────────────────────────────────────────────────
function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const [mode, setMode] = useState<"professor" | "aluno" | "master">("professor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ra, setRa] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal de redefinição de senha
  const [showResetModal, setShowResetModal] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");

    try {
      let body: Record<string, string>;
      if (mode === "professor") {
        body = { role: "teacher", email, password };
      } else if (mode === "master") {
        body = { role: "master", email, password };
      } else {
        body = { role: "student", ra, password: studentPassword };
      }

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
        router.push(data.user.isMaster ? "/professor/admin" : "/professor");
      } else {
        router.push(data.user.firstAccess ? "/trocar-senha" : "/aluno");
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Modal de redefinição de senha */}
      <AnimatePresence>
        {showResetModal && (
          <ResetPasswordModal onClose={() => setShowResetModal(false)} />
        )}
      </AnimatePresence>

      <div className="relative flex min-h-screen flex-col bg-cfo-bg">
        {/* Background gradients — overflow-hidden apenas nesta camada */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>

        {/* Área central — flex-1 para empurrar o rodapé para baixo */}
        <div className="relative flex flex-1 items-center justify-center p-4">
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
                  <h1 className="text-xl font-black text-white">Arena Contábil</h1>
                  <p className="text-xs text-slate-400">Business Accounting Simulator</p>
                </div>
              </div>

              <h2 className="mt-10 text-4xl font-black leading-tight text-white">
                Aprenda contabilidade <span className="text-cyan-400">competindo</span>
              </h2>
              <p className="mt-4 text-slate-300">
                Gerencie uma empresa de garrafas sustentáveis, tome decisões financeiras
                e contábeis estratégicas e supere seus concorrentes no mercado.
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
            </div>

            {/* Right: Login form */}
            <div className="border-l border-white/10 bg-slate-900/50 p-8 md:p-12">
              {/* Toggle — 3 modos */}
              <div className="mb-8 flex rounded-2xl bg-slate-950/70 p-1.5 gap-1">
                <button
                  onClick={() => { setMode("professor"); setError(""); }}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    mode === "professor"
                      ? "bg-cyan-400 text-slate-950 shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Professor
                </button>
                <button
                  onClick={() => { setMode("aluno"); setError(""); }}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    mode === "aluno"
                      ? "bg-cyan-400 text-slate-950 shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Aluno (RA)
                </button>
                <button
                  onClick={() => { setMode("master"); setError(""); }}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === "master"
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Master
                </button>
              </div>

              {sessionExpired && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Sua sessão expirou por inatividade. Faça login novamente.</span>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* ── Professor ── */}
                {mode === "professor" && (
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
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-8 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </>
                )}

                {/* ── Aluno ── */}
                {mode === "aluno" && (
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
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-8 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Link "Esqueci minha senha" → abre modal */}
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowResetModal(true)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  </>
                )}

                {/* ── Master ── */}
                {mode === "master" && (
                  <>
                    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
                      <ShieldCheck className="mb-2 h-6 w-6 text-violet-300" />
                      <p className="text-sm font-semibold text-white">Administrador Institucional</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Acesso exclusivo para o administrador master da instituição.
                        Gerencie professores e redefina senhas.
                      </p>
                    </div>
                    <Input
                      label="E-mail institucional"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@instituicao.edu.br"
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
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-8 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleLogin}
                  loading={loading}
                  className={`w-full ${mode === "master" ? "bg-violet-500 hover:bg-violet-400 text-white shadow-violet-500/20" : ""}`}
                  size="lg"
                >
                  {loading
                    ? "Entrando..."
                    : mode === "master"
                    ? "Entrar como Master"
                    : "Entrar na plataforma"}
                </Button>
              </div>

              <p className="mt-6 text-center text-xs text-slate-500">
                EcoBottle Ind. de Garrafas Sustentáveis · Simulação acadêmica
              </p>
            </div>
          </div>
        </motion.div>
        </div>{/* fim área central */}

        {/* Assinatura institucional — no fluxo normal, sempre visível */}
        <div className="relative flex flex-col items-center gap-2 pb-5 pt-3 px-4 select-none">
          <Image
            src="/logo-unifecaf.png"
            alt="UNIFECAF"
            width={88}
            height={36}
            className="opacity-35 hover:opacity-55 transition-opacity duration-300"
            style={{ objectFit: "contain" }}
          />
          <p className="text-center text-[11px] text-slate-600/70">
            Arena Contábil &mdash; Sistema idealizado e desenvolvido por Prof. Ednilson Angelo
          </p>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
