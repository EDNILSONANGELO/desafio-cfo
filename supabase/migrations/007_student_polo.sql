-- Migration 007: adiciona campo polo à tabela students
-- Permite identificar e filtrar alunos por polo/unidade diretamente
-- Campo obrigatório no cadastro manual e na importação CSV

ALTER TABLE students ADD COLUMN IF NOT EXISTS polo VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_students_polo ON students(polo);

COMMENT ON COLUMN students.polo IS 'Polo/unidade do aluno (ex: Polo Norte, EAD). Obrigatório no cadastro.';
