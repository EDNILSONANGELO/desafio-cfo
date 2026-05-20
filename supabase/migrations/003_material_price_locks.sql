-- ============================================================
-- DESAFIO CFO – Migração 003: Travas de Preço de Materiais
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Preços unitários de materiais travados pelo professor por rodada
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS plastic_unit DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS caps_unit    DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS package_unit DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS label_unit   DECIMAL;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'rounds'
--   AND column_name IN ('plastic_unit','caps_unit','package_unit','label_unit');
