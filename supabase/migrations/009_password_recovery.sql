-- Migration 009: Password recovery + first_access flag
-- Run in Supabase SQL Editor: https://supabase.com/dashboard

-- 1. Coluna first_access nos alunos
--    DEFAULT false → alunos já existentes não são forçados a trocar senha.
--    Novos alunos importados/criados devem ter first_access = true explicitamente.
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_access BOOLEAN NOT NULL DEFAULT false;

-- 2. Tabela de tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id           SERIAL PRIMARY KEY,
  student_id   UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  code         CHAR(6)     NOT NULL,          -- código numérico de 6 dígitos
  expires_at   TIMESTAMPTZ NOT NULL,           -- validade de 10 minutos
  attempts     INTEGER     NOT NULL DEFAULT 0, -- max 5 tentativas
  used         BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_student   ON password_reset_tokens(student_id);
CREATE INDEX IF NOT EXISTS idx_prt_expires   ON password_reset_tokens(expires_at);

-- Notifica o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
