-- Adiciona coluna semestre à tabela students
-- Valores válidos: 1 a 8 (semestres do curso) — NULL = não informado

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS semestre SMALLINT
    CHECK (semestre IS NULL OR (semestre >= 1 AND semestre <= 8));
