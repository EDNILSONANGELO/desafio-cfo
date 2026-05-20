-- Ajustes de nota individual por professor
-- Permite ao professor sobrescrever a nota do grupo para um aluno específico
-- em uma rodada específica, com justificativa obrigatória.

CREATE TABLE IF NOT EXISTS grade_adjustments (
  id              SERIAL PRIMARY KEY,
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  round_id        INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
  adjusted_nota   DECIMAL(4,2) NOT NULL CHECK (adjusted_nota >= 0 AND adjusted_nota <= 10),
  justification   TEXT NOT NULL CHECK (char_length(justification) > 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, round_id)
);

-- Índice para busca rápida por rodada
CREATE INDEX IF NOT EXISTS idx_grade_adjustments_round ON grade_adjustments(round_id);
-- Índice para busca rápida por aluno
CREATE INDEX IF NOT EXISTS idx_grade_adjustments_student ON grade_adjustments(student_id);
