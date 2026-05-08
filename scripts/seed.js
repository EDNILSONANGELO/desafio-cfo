#!/usr/bin/env node
/**
 * DESAFIO CFO – Script de Seed
 * Cria dados iniciais: professor, turma, 4 grupos, 5 alunos, 1 rodada aberta
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !key.startsWith('#')) {
      const value = rest.join('=').trim();
      if (!process.env[key.trim()]) process.env[key.trim()] = value;
    }
  });
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
const PROFESSOR_EMAIL = process.env.PROFESSOR_DEFAULT_EMAIL || 'professor@desafiocfo.com';
const PROFESSOR_PASSWORD = process.env.PROFESSOR_DEFAULT_PASSWORD || 'admin123';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrado no .env.local');
  process.exit(1);
}

// bcrypt hash para "admin123" e "123456"
// Gerado offline para evitar dependência circular
const ADMIN_HASH = '$2a$10$YWJjZGVmZ2hpamtsbW5vcC5xcnN0dXYuYWJjZGVmZ2hpamtsbW5v'; // placeholder
const STUDENT_HASH = '$2a$10$dGVzdGhhc2gudGVzdGhhc2gudGVzdGhhc2gudGVzdGhhc2gudGVzdA'; // placeholder

async function seed() {
  // Use bcryptjs to generate real hashes
  let bcrypt;
  try {
    bcrypt = require('bcryptjs');
  } catch (e) {
    console.error('❌ Instale bcryptjs: npm install bcryptjs');
    process.exit(1);
  }

  console.log('🔐 Gerando hashes de senha...');
  const professorHash = await bcrypt.hash(PROFESSOR_PASSWORD, 10);
  const studentHash = await bcrypt.hash('123456', 10);

  console.log('🔌 Conectando ao banco...');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado!\n');

    // Professor
    console.log('👨‍🏫 Criando professor...');
    const profResult = await client.query(`
      INSERT INTO professors (email, name, password_hash)
      VALUES ($1, 'Prof. Carlos Silva', $2)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
      RETURNING id
    `, [PROFESSOR_EMAIL, professorHash]);
    const profId = profResult.rows[0].id;
    console.log('  ✅ professor@desafiocfo.com / admin123');

    // Turma
    console.log('🏫 Criando turma...');
    const classResult = await client.query(`
      INSERT INTO classes (name, professor_id)
      VALUES ('Turma 2026/1 - Contabilidade', $1)
      RETURNING id
    `, [profId]);
    const classId = classResult.rows[0].id;
    console.log('  ✅ Turma 2026/1');

    // Grupos
    const groups = [
      { name: 'Grupo 1', company: 'EcoBottle Norte', region: 'Norte', trait: 'Alta demanda por produtos sustentáveis', demand: 1.15, cost: 1.05, color: 'from-emerald-500 to-teal-600' },
      { name: 'Grupo 2', company: 'EcoBottle Sul', region: 'Sul', trait: 'Mercado competitivo com alto poder aquisitivo', demand: 1.10, cost: 1.10, color: 'from-sky-500 to-blue-600' },
      { name: 'Grupo 3', company: 'EcoBottle Leste', region: 'Leste', trait: 'Região industrial com foco em custo-benefício', demand: 0.95, cost: 0.90, color: 'from-violet-500 to-purple-600' },
      { name: 'Grupo 4', company: 'EcoBottle Oeste', region: 'Oeste', trait: 'Mercado emergente com grande potencial', demand: 0.85, cost: 0.85, color: 'from-amber-500 to-orange-600' },
    ];

    console.log('🏢 Criando grupos...');
    const groupIds = [];
    for (const g of groups) {
      const res = await client.query(`
        INSERT INTO groups (name, company_name, region_name, region_trait, region_demand, region_cost, color, class_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [g.name, g.company, g.region, g.trait, g.demand, g.cost, g.color, classId]);
      groupIds.push(res.rows[0].id);
      console.log(`  ✅ ${g.name} (${g.company})`);
    }

    // Alunos
    const students = [
      { ra: '1001', name: 'Ana Silva', groupIdx: 0 },
      { ra: '1002', name: 'Bruno Costa', groupIdx: 0 },
      { ra: '2001', name: 'Carla Oliveira', groupIdx: 1 },
      { ra: '3001', name: 'Diego Santos', groupIdx: 2 },
      { ra: '4001', name: 'Elena Rodrigues', groupIdx: 3 },
    ];

    console.log('👩‍🎓 Criando alunos...');
    for (const s of students) {
      await client.query(`
        INSERT INTO students (ra, name, password_hash, group_id, class_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (ra) DO UPDATE SET name = $2, password_hash = $3, group_id = $4
      `, [s.ra, s.name, studentHash, groupIds[s.groupIdx], classId]);
      console.log(`  ✅ RA ${s.ra} – ${s.name} (senha: 123456)`);
    }

    // Rodada
    console.log('🎯 Criando rodada...');
    await client.query(`
      INSERT INTO rounds (name, status, event_type, demand_factor, cost_factor, class_id, opened_at)
      VALUES ('Rodada 1 – Aquecimento', 'Aberta', 'Mercado normal', 1.0, 1.0, $1, NOW())
    `, [classId]);
    console.log('  ✅ Rodada 1 – Aberta');

    console.log(`
🎉 Seed concluído com sucesso!

═══════════════════════════════════════════
CREDENCIAIS DE ACESSO
═══════════════════════════════════════════
👨‍🏫 PROFESSOR
   Email: ${PROFESSOR_EMAIL}
   Senha: ${PROFESSOR_PASSWORD}

👩‍🎓 ALUNOS (senha: 123456)
   RA 1001 – Ana Silva    → Grupo 1 (EcoBottle Norte)
   RA 1002 – Bruno Costa  → Grupo 1 (EcoBottle Norte)
   RA 2001 – Carla        → Grupo 2 (EcoBottle Sul)
   RA 3001 – Diego        → Grupo 3 (EcoBottle Leste)
   RA 4001 – Elena        → Grupo 4 (EcoBottle Oeste)
═══════════════════════════════════════════

Acesse: http://localhost:3000
    `);

  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
