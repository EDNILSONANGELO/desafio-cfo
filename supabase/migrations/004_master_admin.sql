-- Adiciona suporte ao usuário MASTER (admin institucional)
-- O master pode gerenciar professores e redefinir senhas

ALTER TABLE professors
  ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT false;

-- Comentário: apenas UMA conta deve ter is_master = true por instituição.
-- Para promover um professor existente a master:
--   UPDATE professors SET is_master = true WHERE email = 'admin@instituicao.edu.br';
--
-- Para criar um novo master via seed (use a API /api/seed ou insira diretamente):
--   INSERT INTO professors (email, name, password_hash, is_master)
--   VALUES ('admin@instituicao.edu.br', 'Administrador', '<bcrypt_hash>', true);
