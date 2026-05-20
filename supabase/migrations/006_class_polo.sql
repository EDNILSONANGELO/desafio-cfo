-- Migration 006: adiciona campo polo à tabela classes
-- Permite associar cada turma a um polo/campus específico
-- Isso habilita o filtro por polo na listagem de alunos

ALTER TABLE classes ADD COLUMN IF NOT EXISTS polo VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_classes_polo ON classes(polo);

COMMENT ON COLUMN classes.polo IS 'Polo/campus ao qual esta turma pertence (opcional)';
