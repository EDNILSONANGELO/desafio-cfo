"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calculator,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TrocarSenhaPage() {
  const router = useRouter();

  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);

  const isValid = newPw.length >= 6 && newPw === confirmPw;

  async function handleSubmit() {
    setError("");
    if (newPw.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPw, confirm_password: confirmPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar a nova senha.");
        return;
      }
      setDone(true);
      // Redireciona após 1.8s para dar tempo de ver a mensagem
      setTimeout(() => router.push("/aluno"), 1800);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

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
            <p className="text-xs text-slate-400">Primeiro acesso</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white">Senha definida!</h2>
              <p className="text-sm text-slate-400">
                Sua senha foi cadastrada com sucesso. Redirecionando para o sistema…
              </p>
              <div className="mt-2 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-cyan-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {/* Cabeçalho */}
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Troca de senha obrigatória
                </div>
                <h2 className="text-lg font-black text-white">Crie sua senha pessoal</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Por segurança, você precisa criar uma senha pessoal antes de acessar o sistema.
                  A senha temporária fornecida pelo professor não poderá ser usada novamente.
                </p>
              </div>

              {/* Erro */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {/* Campo nova senha */}
              <div className="relative">
                <Input
                  label="Nova senha"
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  onKeyDown={(e) => e.key === "Enter" && isValid && handleSubmit()}
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

              {/* Campo confirmar senha */}
              <Input
                label="Confirmar nova senha"
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                placeholder="Repita a senha"
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && isValid && handleSubmit()}
              />

              {/* Indicadores inline */}
              {newPw.length > 0 && newPw.length < 6 && (
                <p className="text-xs text-amber-400">Mínimo de 6 caracteres.</p>
              )}
              {newPw && confirmPw && newPw !== confirmPw && (
                <p className="text-xs text-rose-400">As senhas não coincidem.</p>
              )}
              {isValid && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Senhas conferem
                </p>
              )}

              {/* Botão */}
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={!isValid}
                className="w-full"
                size="lg"
              >
                <KeyRound className="h-4 w-4" />
                Definir minha senha e entrar
              </Button>

              {/* Regras */}
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Dicas para uma boa senha:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Mínimo de 6 caracteres</li>
                  <li>Use letras maiúsculas, minúsculas e números</li>
                  <li>Não use seu RA ou dados pessoais óbvios</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
