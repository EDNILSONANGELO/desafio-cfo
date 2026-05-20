-- ============================================================
-- DESAFIO CFO – Migração Phase 1 Improvements
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- 1. Coluna avg_salary na tabela rounds (salário médio travado pelo professor)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS avg_salary DECIMAL;

-- 2. Coluna price_min / price_max na tabela rounds (faixa de preço de venda)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS price_min DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS price_max DECIMAL;

-- 3. Colunas de despesas travadas na tabela rounds
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS fixed_expenses DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS transport DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS maintenance DECIMAL;

-- 4. Índice auxiliar para busca de rodadas processadas por class_id (carryover)
CREATE INDEX IF NOT EXISTS idx_rounds_class_status ON rounds(class_id, status, id);

-- 5. Índice auxiliar para busca de resultados por rodada (ranking acumulado)
CREATE INDEX IF NOT EXISTS idx_results_round_group ON results(round_id, group_id);

-- ============================================================
-- VERIFICAÇÃO (execute após as alterações)
-- ============================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'rounds'
-- ORDER BY ordinal_position;
