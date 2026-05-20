-- Migration 004: Pesos customizáveis do score por turma
-- Adiciona coluna JSONB para armazenar os pesos configurados pelo professor

ALTER TABLE classes ADD COLUMN IF NOT EXISTS score_weights JSONB;

-- Comentário: estrutura esperada do JSONB
-- {
--   "currentRatio":   0.20,   -- Liquidez Corrente  (20%)
--   "quickRatio":     0.15,   -- Liquidez Seca      (15%)
--   "immediateRatio": 0.15,   -- Liquidez Imediata  (15%)
--   "roa":            0.25,   -- ROA                (25%)
--   "netMargin":      0.15,   -- Margem Líquida     (15%)
--   "cashCycle":      0.10    -- Ciclo Financeiro   (10%)
-- }
-- A soma dos valores deve ser 1.0 (= 100%).
-- O bônus de market share (+5%) não entra neste objeto — é fixo no engine.
