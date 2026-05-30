-- Migration 010: Configurações por rodada (Ajustes 4, 7 e 10)
-- ─────────────────────────────────────────────────────────────────────────────
-- Ajuste 4  — loan_limit:          Limite máximo de empréstimo que os alunos podem solicitar
-- Ajuste 7  — inter_regional_cost: Custo adicional por unidade para vendas fora da região de origem
-- Ajuste 10 — loan_rate:           Taxa de juros do empréstimo configurada pelo professor (%)
-- ─────────────────────────────────────────────────────────────────────────────
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TABLE rounds ADD COLUMN IF NOT EXISTS loan_limit          DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS inter_regional_cost DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS loan_rate           DECIMAL DEFAULT NULL;
