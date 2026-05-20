"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  KeyRound,
  Mail,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Step = 1 | 2 | 3 | "done";

export default function RecuperarSenhaPage() {
  const router = useRouter();

  // Estado do fluxo
  const [step, setStep] = useState<Step>(1);

  // Etapa 1
  const [ra, setRa]       = useState("");
  const [email, setEmail] = useState("");
  const [step1Err, setStep1Err] = useState("");
  const [step1Loading, setStep1Loading] = useState(false);

  // Após etapa 1 — guardamos student_id e (dev) código
  const [studentId, setStudentId]   = useState("");
  const [devCode, setDevCode]       = useState<string | null>(null);

  // Etapa 2
  const [code, setCode]           = useState("");
  const [step2Err, setStep2Err]   = useState("");

  // Etapa 3
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [step3Err, setStep3Err]     = useState("");
  const [step3Loading, setStep3Loading] = useState(false);

  // ── Etapa 1: solicitar código ─────────────────────────────────────────────────
  async function submitStep1() {
    setStep1Err("");
    if (!ra.trim() || !email.trim()) {
      setStep1Err("Preencha o RA e o e-mail.");
      return;
    }
    setStep1Loading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ra: ra.trim(), email: email.trim() }),
      });
      const data = await res.json();

      // Por segurança, sempre avançamos para a etapa 2
      // Em dev, o código retorna na resposta
      if (data._dev_student_id) setStudentId(data._dev_student_id);
      if (data._dev_code) setDevCode(data._dev_code);

      setStep(2);
    } catch {
      setStep1Err("Erro de conexão. Tente novamente.");
    } finally {
      setStep1Loading(false);
    }
  }

  // ── Etapa 3: redefinir senha ──────────────────────────────────────────────────
  async function submitStep3() {
    setStep3Err("");
    if (newPw.length < 6) {
      setStep3Err("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPw !== confirmPw) {
      setStep3Err("As senhas não coincidem.");
      return;
    }
    setStep3Loading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          code: code.trim(),
          new_password: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStep3Err(data.error || "Erro ao redefinir senha.");
        return;
      }
      setStep("done");
    } catch {
      setStep3Err("Erro de conexão. Tente novamente.");
    } finally {
      setStep3Loading(false);
    }
  }

  // ── Layout base ───────────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cfo-bg p-4">
      {/* Gradientes de fundo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 shadow-lg shadow-cyan-500/30">
            <Calculator className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <p className="font-black text-white">Arena Contábil</p>
            <p className="text-xs text-slate-400">Recuperação de senha</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">

          {/* ── Indicador de etapas ── */}
          {step !== "done" && (
            <div className="mb-6 flex items-center gap-2">
              {([1, 2, 3] as const).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black transition-all ${
                    step === s
                      ? "bg-cyan-400 text-slate-950"
                      : (step as number) > s
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-slate-500"
                  }`}>
                    {(step as number) > s ? "✓" : s}
                  </div>
                  {s < 3 && <div className={`h-px flex-1 transition-all ${(step as number) > s ? "bg-emerald-500/50" : "bg-white/10"}`} style={{ width: 32 }} />}
                </div>
              ))}
              <div className="ml-2 text-xs text-slate-400">
                {step === 1 ? "RA + E-mail" : step === 2 ? "Código" : "Nova senha"}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════════════════ ETAPA 1 */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Recuperar senha</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Informe seu RA e o e-mail cadastrado pelo professor.
                  </p>
                </div>

                {step1Err && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {step1Err}
                  </div>
                )}

                <Input
                  label="RA (Registro Acadêmico)"
                  type="text"
                  value={ra}
                  onChange={(e) => setRa(e.target.value)}
                  placeholder="Ex: 123456"
                  autoComplete="username"
                  onKeyDown={(e) => e.key === "Enter" && submitStep1()}
                />
                <Input
                  label="E-mail cadastrado"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  onKeyDown={(e) => e.key === "Enter" && submitStep1()}
                />

                <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2.5 text-xs text-slate-400">
                  <ShieldCheck className="mb-1 h-3.5 w-3.5 text-cyan-400 inline mr-1" />
                  Por segurança, não informamos se o RA ou e-mail existem no sistema.
                </div>

                <Button onClick={submitStep1} loading={step1Loading} className="w-full" size="lg">
                  <Mail className="h-4 w-4" /> Enviar código de recuperação
                </Button>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════ ETAPA 2 */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Código de verificação</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Se os dados estiverem corretos, você receberá um código de 6 dígitos.
                    O código expira em <strong className="text-white">10 minutos</strong>.
                  </p>
                </div>

                {/* Banner dev-mode */}
                {devCode && (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm">
                    <p className="font-bold text-amber-300 mb-1">🧪 Modo desenvolvimento</p>
                    <p className="text-slate-400 text-xs mb-2">Em produção, este código seria enviado por e-mail.</p>
                    <div className="flex items-center gap-3 rounded-lg bg-black/30 px-3 py-2">
                      <p className="text-xl font-black font-mono text-amber-300 tracking-[0.25em]">
                        {devCode}
                      </p>
                      <button
                        type="button"
                        onClick={() => setCode(devCode)}
                        className="ml-auto text-xs text-amber-400 hover:text-amber-300 underline"
                      >
                        Usar
                      </button>
                    </div>
                  </div>
                )}

                {step2Err && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {step2Err}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setStep2Err(""); }}
                    placeholder="000000"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-black font-mono tracking-[0.4em] text-white placeholder-slate-700 focus:border-cyan-400/50 focus:outline-none"
                    onKeyDown={(e) => { if (e.key === "Enter" && code.length === 6) setStep(3); }}
                  />
                </div>

                <Button
                  onClick={() => {
                    setStep2Err("");
                    if (code.trim().length !== 6) { setStep2Err("O código deve ter 6 dígitos."); return; }
                    setStep(3);
                  }}
                  className="w-full"
                  size="lg"
                >
                  Verificar código
                </Button>

                <button
                  type="button"
                  onClick={() => { setCode(""); setDevCode(null); setStep(1); }}
                  className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Solicitar novo código
                </button>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════ ETAPA 3 */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Criar nova senha</h2>
                  <p className="mt-1 text-sm text-slate-400">Mínimo de 6 caracteres. Confirme a nova senha.</p>
                </div>

                {step3Err && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {step3Err}
                  </div>
                )}

                <div className="relative">
                  <Input
                    label="Nova senha"
                    type={showPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setStep3Err(""); }}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-white"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Input
                  label="Confirmar nova senha"
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setStep3Err(""); }}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  onKeyDown={(e) => e.key === "Enter" && submitStep3()}
                />

                {newPw && confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-rose-400">As senhas não coincidem.</p>
                )}
                {newPw.length > 0 && newPw.length < 6 && (
                  <p className="text-xs text-amber-400">Mínimo de 6 caracteres.</p>
                )}

                <Button
                  onClick={submitStep3}
                  loading={step3Loading}
                  className="w-full"
                  size="lg"
                  disabled={newPw.length < 6 || newPw !== confirmPw}
                >
                  <KeyRound className="h-4 w-4" /> Redefinir senha
                </Button>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════ CONCLUÍDO */}
            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-black text-white">Senha redefinida!</h2>
                <p className="text-sm text-slate-400">
                  Sua senha foi alterada com sucesso. Faça login com a nova senha.
                </p>
                <Button onClick={() => router.push("/login")} className="mt-2 w-full" size="lg">
                  Ir para o login
                </Button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Link de voltar */}
          {step !== "done" && (
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Voltar para o login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
