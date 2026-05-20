-- Migration 005: Escala de classificação acadêmica por turma
-- Permite ao professor configurar os limiares de score e as notas correspondentes

ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade_scale JSONB;

-- Comentário: estrutura esperada do JSONB (array ordenado do melhor ao pior)
-- [
--   { "minScore": 75, "grade": "AAA", "label": "Excelente", "nota": 10.0 },
--   { "minScore": 60, "grade": "AA",  "label": "Muito Bom",  "nota": 8.5  },
--   { "minScore": 45, "grade": "A",   "label": "Bom",        "nota": 7.0  },
--   { "minScore": 30, "grade": "B",   "label": "Regular",    "nota": 5.5  },
--   { "minScore": 15, "grade": "C",   "label": "Fraco",      "nota": 4.0  },
--   { "minScore":  0, "grade": "D",   "label": "Crítico",    "nota": 2.0  }
-- ]
-- A cor de cada nível é atribuída automaticamente pelo sistema (não armazenada).
-- null = usar escala padrão do sistema.
