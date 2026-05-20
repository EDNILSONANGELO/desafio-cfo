-- Adiciona campo polo ao professor
-- O polo é cadastrado pelo master no momento do cadastro do professor

ALTER TABLE professors
  ADD COLUMN IF NOT EXISTS polo VARCHAR(100);

-- Índice para consultas por polo
CREATE INDEX IF NOT EXISTS idx_professors_polo ON professors(polo);
