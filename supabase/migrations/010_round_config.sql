-- Migration 010: Limite de empréstimo e custo inter-regional configuráveis por rodada
-- Ajuste 4 — loan_limit: limite máximo de empréstimo que os alunos podem solicitar na rodada
-- Ajuste 7 — inter_regional_cost: custo adicional por unidade para vendas fora da região de origem

ALTER TABLE rounds ADD COLUMN IF NOT EXISTS loan_limit DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS inter_regional_cost DECIMAL DEFAULT NULL;
