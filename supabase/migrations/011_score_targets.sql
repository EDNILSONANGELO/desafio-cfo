-- Migration 011: Adiciona coluna score_targets na tabela classes
-- Permite ao professor configurar metas personalizadas para cada indicador.
-- O multiplicador é calculado automaticamente: 100 ÷ meta.

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS score_targets JSONB DEFAULT NULL;

COMMENT ON COLUMN classes.score_targets IS
  'Metas configuráveis dos indicadores: { currentRatio, quickRatio, immediateRatio, roa, netMargin, cashCycle }. Padrões: LC/LS/LI = 1.5, ROA = 20, ML = 33.33, Ciclo = 0.';
