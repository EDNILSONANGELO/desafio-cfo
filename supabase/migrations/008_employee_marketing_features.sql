-- ============================================================
-- Migration 008: Employee admit/dismiss + Marketing Insertions
-- Adds professor-configurable fields to rounds table
-- ============================================================

-- Custo unitário por inserção de marketing (R$ por inserção)
-- NULL = usa o padrão do sistema (R$ 1.500 por inserção)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS marketing_insertion_cost DECIMAL DEFAULT NULL;

-- Funcionários mínimos por 1.000 unidades produzidas
-- NULL = usa a razão padrão (3 funcionários por 1.000 unidades)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS machine_min_employees INTEGER DEFAULT NULL;

-- Comentário explicativo das colunas
COMMENT ON COLUMN rounds.marketing_insertion_cost IS
  'Custo unitário por inserção de marketing (R$). NULL = padrão do sistema (R$ 1.500).';

COMMENT ON COLUMN rounds.machine_min_employees IS
  'Mínimo de funcionários por 1.000 unidades de produção. NULL = padrão (3 por 1.000 un.).';
