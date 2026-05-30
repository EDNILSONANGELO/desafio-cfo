"use strict";
const pptxgen = require("pptxgenjs");
const fs = require("fs");

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  DARK_BG:   "06101E",
  CARD_BG:   "0A1628",
  NAVY_CARD: "0D1F35",
  BLUE:      "4D8EF0",
  GOLD:      "C9A520",
  WHITE:     "FFFFFF",
  LIGHT:     "E8EDF5",
  DARK:      "0F172A",
  GRAY:      "64748B",
  BODY:      "334155",
  CARD:      "F8FAFC",
  BORDER:    "E2E8F0",
  BL_LIGHT:  "EFF6FF",
  BL_MED:    "DBEAFE",
};

const W = 13.33;
const H = 7.5;
const mkS = () => ({ type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.10 });

// ── Init ─────────────────────────────────────────────────────────────────────
let pres = new pptxgen();
pres.layout  = "LAYOUT_WIDE";
pres.title   = "Arena Contábil — Business Accounting Simulator";
pres.author  = "Prof. Ednilson Angelo";

let logoData = null;
try {
  const buf = fs.readFileSync("C:/Users/ednil/desafio-cfo/public/logo-unifecaf.png");
  logoData = "image/png;base64," + buf.toString("base64");
} catch (_) {}

// ── Helpers ──────────────────────────────────────────────────────────────────
function chrome(s) {
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:0.10, h:H, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
}

function title(s, txt, dark=false, y=0.30) {
  s.addText(txt, { x:0.45, y, w:W-0.9, h:0.68,
    fontSize:30, fontFace:"Calibri", bold:true,
    color: dark ? C.WHITE : C.DARK, align:"left", valign:"middle", margin:0 });
  s.addShape(pres.shapes.RECTANGLE, { x:0.45, y:y+0.73, w:2.4, h:0.04,
    fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
}

function sub(s, txt, dark=false, y=1.09) {
  s.addText(txt, { x:0.45, y, w:W-0.9, h:0.38,
    fontSize:13, fontFace:"Calibri", italic:true,
    color: dark ? "93C5FD" : C.GRAY, align:"left", valign:"middle", margin:0 });
}

function sig(s, dark=false) {
  s.addText("Arena Contábil — Sistema idealizado e desenvolvido por Prof. Ednilson Angelo", {
    x:0.5, y:H-0.36, w:W-1, h:0.28,
    fontSize:8.5, fontFace:"Calibri", color: dark ? "374151" : "94A3B8",
    align:"center", valign:"middle", margin:0 });
}

function card(s, x, y, w, h, {emoji="", ttl="", body="", ac=C.BLUE, ts=13, bs=10.5}={}) {
  s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:C.BL_LIGHT}, line:{color:C.BL_MED,width:1}, shadow:mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x,y, w:0.07,h, fill:{color:ac}, line:{color:ac,width:0} });
  if (emoji) {
    s.addText(emoji, { x, y:y+0.17, w:0.9, h:0.52, fontSize:20, align:"center", valign:"middle", margin:0 });
    if (ttl) s.addText(ttl, { x:x+0.88, y:y+0.13, w:w-0.98, h:0.48, fontSize:ts, fontFace:"Calibri", bold:true, color:C.DARK, align:"left", valign:"middle", margin:0 });
    if (body) s.addText(body, { x:x+0.88, y:y+0.65, w:w-0.98, h:h-0.78, fontSize:bs, fontFace:"Calibri", color:C.BODY, align:"left", valign:"top", margin:0 });
  } else {
    if (ttl) s.addText(ttl, { x:x+0.18, y:y+0.13, w:w-0.28, h:0.48, fontSize:ts, fontFace:"Calibri", bold:true, color:C.DARK, align:"left", valign:"middle", margin:0 });
    if (body) s.addText(body, { x:x+0.18, y:y+0.65, w:w-0.28, h:h-0.78, fontSize:bs, fontFace:"Calibri", color:C.BODY, align:"left", valign:"top", margin:0 });
  }
}

function darkCard(s, x, y, w, h, {ttl="", body="", ac=C.BLUE}={}) {
  s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:C.NAVY_CARD}, line:{color:ac,width:1}, shadow:mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x,y, w,h:0.05, fill:{color:ac}, line:{color:ac,width:0} });
  if (ttl) s.addText(ttl, { x:x+0.15, y:y+0.18, w:w-0.3, h:0.46, fontSize:13, fontFace:"Calibri", bold:true, color:ac, align:"left", valign:"middle", margin:0 });
  if (body) s.addText(body, { x:x+0.15, y:y+0.7, w:w-0.3, h:h-0.85, fontSize:10.5, fontFace:"Calibri", color:"94A3B8", align:"left", valign:"top", margin:0 });
}

function logo(s) {
  if (!logoData) return;
  s.addShape(pres.shapes.RECTANGLE, { x:0.55, y:0.28, w:2.75, h:0.87, fill:{color:C.WHITE}, line:{color:C.WHITE,width:0} });
  s.addImage({ data:logoData, x:0.62, y:0.33, w:2.60, h:0.77 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — CAPA
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.DARK_BG };
  s.addShape(pres.shapes.OVAL, { x:9.8, y:-1.8, w:6.2, h:6.2, fill:{color:C.BLUE,transparency:88}, line:{color:C.BLUE,width:0,transparency:85} });
  s.addShape(pres.shapes.OVAL, { x:-1.8, y:4.8, w:5.0, h:5.0, fill:{color:"7C3AED",transparency:91}, line:{color:"7C3AED",width:0,transparency:88} });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:W, h:0.07, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
  logo(s);
  s.addText("Arena Contábil", { x:1.0, y:1.85, w:11.33, h:1.45,
    fontSize:64, fontFace:"Calibri", bold:true, color:C.WHITE, align:"center", valign:"middle", margin:0 });
  s.addText("Business Accounting Simulator", { x:1.0, y:3.42, w:11.33, h:0.62,
    fontSize:24, fontFace:"Calibri", color:C.BLUE, align:"center", valign:"middle", margin:0 });
  s.addShape(pres.shapes.RECTANGLE, { x:5.0, y:4.18, w:3.33, h:0.05, fill:{color:C.GOLD}, line:{color:C.GOLD,width:0} });
  s.addShape(pres.shapes.RECTANGLE, { x:4.3, y:4.32, w:4.73, h:0.58,
    fill:{color:C.BLUE,transparency:84}, line:{color:C.BLUE,transparency:62,width:1} });
  s.addText("Simulador Empresarial Acadêmico", { x:4.3, y:4.32, w:4.73, h:0.58,
    fontSize:14, fontFace:"Calibri", color:C.LIGHT, align:"center", valign:"middle", margin:0 });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:6.85, w:W, h:0.65, fill:{color:"030B16"}, line:{color:"030B16",width:0} });
  s.addText("Sistema idealizado e desenvolvido por Prof. Ednilson Angelo  |  UniFECAF", {
    x:0.5, y:6.85, w:W-1, h:0.65,
    fontSize:11, fontFace:"Calibri", color:"475569", align:"center", valign:"middle", margin:0 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — OBJETIVO
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "O que é o Arena Contábil?");
  const items = [
    { emoji:"🎯", ttl:"Ensino Prático", body:"Simulação real de gestão empresarial em sala de aula — decisões financeiras com consequências reais no jogo." },
    { emoji:"🏆", ttl:"Competição entre Equipes", body:"Grupos competem como empresas rivais no mesmo mercado, disputando o ranking por score financeiro." },
    { emoji:"📊", ttl:"Decisões Integradas", body:"Produção, vendas, finanças, RH e máquinas — cada decisão impacta diretamente o resultado contábil: DRE, caixa e estrutura patrimonial." },
    { emoji:"🎓", ttl:"Contabilidade na Prática", body:"DRE, Balanço Patrimonial, DFC e 13 índices contábeis gerados automaticamente — regime de competência, equação patrimonial e análise de desempenho a cada rodada." },
  ];
  const cx=[0.3,6.95], cy=[1.4,3.98];
  items.forEach((it,i) => card(s, cx[i%2], cy[Math.floor(i/2)], 6.1, 2.35, {...it,ts:15,bs:12}));
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — ECOBOTTLE
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "A Empresa Simulada: EcoBottle");
  sub(s, "Cada grupo gerencia uma empresa concorrente em uma região diferente do mercado");

  s.addShape(pres.shapes.RECTANGLE, { x:0.28, y:1.52, w:5.6, h:5.25, fill:{color:C.BL_LIGHT}, line:{color:C.BL_MED,width:1}, shadow:mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x:0.28, y:1.52, w:0.07, h:5.25, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
  s.addText("EcoBottle", { x:0.55, y:1.65, w:5.0, h:0.55, fontSize:22, fontFace:"Calibri", bold:true, color:C.BLUE, align:"left", valign:"middle", margin:0 });
  s.addText("Ind. de Garrafas Sustentáveis", { x:0.55, y:2.23, w:5.0, h:0.32, fontSize:12, fontFace:"Calibri", color:C.GRAY, align:"left", valign:"middle", margin:0 });
  ["🏭  Produto: Garrafas sustentáveis ecológicas",
   "👥  Grupos ilimitados — o professor define quantas empresas competem",
   "🗺️  1 grupo = 1 região = 1 empresa concorrente",
   "⚙️  Capacidade base: 5.000 unidades/rodada",
   "📦  MP: Plástico, Tampa, Embalagem, Rótulo",
   "💰  Capital Social inicial: R$ 220.000,00"].forEach((t,i) => {
    s.addText(t, { x:0.55, y:2.65+i*0.55, w:5.1, h:0.46, fontSize:11.5, fontFace:"Calibri", color:C.BODY, align:"left", valign:"middle", margin:0 });
  });

  const regs = [
    {name:"Norte",  trait:"Alta demanda, custos elevados",    col:"10B981"},
    {name:"Sul",    trait:"Mercado estável e competitivo",    col:"3B82F6"},
    {name:"Leste",  trait:"Crescimento acelerado",            col:"8B5CF6"},
    {name:"Oeste",  trait:"Custo reduzido, demanda média",    col:C.GOLD  },
    {name:"Centro", trait:"Maior base de consumidores",       col:"EF4444"},
  ];
  regs.forEach((r,i) => {
    const rx = i===4 ? 8.0 : 6.22+(i%2)*3.35;
    const ry = i===4 ? 4.65 : 1.52+Math.floor(i/2)*1.55;
    s.addShape(pres.shapes.RECTANGLE, { x:rx, y:ry, w:3.15, h:1.3, fill:{color:C.CARD}, line:{color:C.BORDER,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x:rx, y:ry, w:0.06, h:1.3, fill:{color:r.col}, line:{color:r.col,width:0} });
    s.addText(r.name,  { x:rx+0.18, y:ry+0.15, w:2.85, h:0.42, fontSize:15, fontFace:"Calibri", bold:true,  color:C.DARK, align:"left", valign:"middle", margin:0 });
    s.addText(r.trait, { x:rx+0.18, y:ry+0.62, w:2.85, h:0.48, fontSize:10.5, fontFace:"Calibri", color:C.BODY, align:"left", valign:"top",   margin:0 });
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — LOGIN
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.DARK_BG };
  s.addShape(pres.shapes.OVAL, { x:10.2, y:-1.5, w:5.2, h:5.2, fill:{color:C.BLUE,transparency:90}, line:{color:C.BLUE,width:0,transparency:86} });
  title(s, "Acesso ao Sistema", true);
  sub(s, "Três perfis de acesso com áreas e permissões dedicadas", true);
  const profs = [
    {ttl:"Professor", emoji:"👨‍🏫", col:"4D8EF0", desc:"Controla o jogo: cria turmas, cadastra alunos, abre e encerra rodadas, define eventos econômicos e processa os resultados com um clique."},
    {ttl:"Aluno (RA)", emoji:"👨‍🎓", col:"10B981", desc:"Preenche as decisões da rodada, acompanha o ranking em tempo real e visualiza DRE, Balanço e indicadores da sua empresa."},
    {ttl:"Master",    emoji:"🛡️", col:"8B5CF6", desc:"Administrador geral — gerencia múltiplos professores, turmas e configurações institucionais de toda a plataforma."},
  ];
  profs.forEach((p,i) => {
    const px = 0.45+i*4.25, py=1.62, pw=4.0, ph=4.6;
    s.addShape(pres.shapes.RECTANGLE, { x:px, y:py, w:pw, h:ph, fill:{color:C.NAVY_CARD}, line:{color:p.col,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x:px, y:py, w:pw, h:0.06, fill:{color:p.col}, line:{color:p.col,width:0} });
    s.addText(p.emoji, { x:px, y:py+0.22, w:pw, h:0.78, fontSize:30, align:"center", valign:"middle", margin:0 });
    s.addText(p.ttl, { x:px, y:py+1.08, w:pw, h:0.50, fontSize:19, fontFace:"Calibri", bold:true, color:p.col, align:"center", valign:"middle", margin:0 });
    s.addText(p.desc, { x:px+0.18, y:py+1.72, w:pw-0.36, h:2.5, fontSize:11.5, fontFace:"Calibri", color:"94A3B8", align:"left", valign:"top", margin:0 });
  });
  s.addText("Login seguro com JWT  •  Professor: e-mail + senha  •  Aluno: RA (Registro Acadêmico) + senha", {
    x:0.5, y:6.45, w:W-1, h:0.38, fontSize:11, fontFace:"Calibri", color:"475569", align:"center", valign:"middle", margin:0 });
  sig(s, true);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — DASHBOARD PROFESSOR
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Dashboard do Professor");
  sub(s, "Visão executiva completa — KPIs, envios em tempo real e ranking");

  const kpis = [
    {lbl:"Alunos Ativos",      val:"32", col:"4D8EF0"},
    {lbl:"Grupos",             val:"8",  col:"10B981"},
    {lbl:"Rodada Ativa",       val:"3ª", col:C.GOLD  },
    {lbl:"Envios Recebidos",   val:"6/8",col:"8B5CF6"},
  ];
  kpis.forEach((k,i) => {
    const kx=0.28+i*3.2, ky=1.48;
    s.addShape(pres.shapes.RECTANGLE, { x:kx, y:ky, w:3.02, h:1.28, fill:{color:C.CARD}, line:{color:C.BORDER,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x:kx, y:ky, w:3.02, h:0.05, fill:{color:k.col}, line:{color:k.col,width:0} });
    s.addText(k.val, { x:kx+0.15, y:ky+0.10, w:2.75, h:0.62, fontSize:30, fontFace:"Calibri", bold:true, color:k.col, align:"left", valign:"middle", margin:0 });
    s.addText(k.lbl, { x:kx+0.15, y:ky+0.75, w:2.75, h:0.40, fontSize:10.5, fontFace:"Calibri", color:C.GRAY, align:"left", valign:"middle", margin:0 });
  });

  const feats = [
    {emoji:"⏱️", ttl:"Tracker de Envios", body:"Painel em tempo real — veja quem enviou, quem está em rascunho e quem está pendente. Atualizado automaticamente a cada 15 segundos."},
    {emoji:"📊", ttl:"Ranking Automático", body:"Score ponderado por 6 indicadores financeiros. Ranking atualizado a cada rodada processada com posições, medalhas e evolução."},
    {emoji:"🥧", ttl:"Market Share", body:"Gráfico de fatia de mercado por empresa — visualização imediata do posicionamento de cada grupo."},
    {emoji:"⚡", ttl:"Acesso Rápido", body:"Processar Rodada, Exportar Relatório, Gerenciar Alunos — tudo acessível a partir do dashboard principal."},
  ];
  const fc=[0.28,6.88], fr=[2.95,4.92];
  feats.forEach((f,i) => card(s, fc[i%2], fr[Math.floor(i/2)], 6.15, 1.75, {...f,ts:13,bs:10.5}));
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — TURMAS E GRUPOS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Turmas, Grupos e Alunos");
  sub(s, "Gestão completa de participantes — do cadastro ao vínculo com o grupo");

  const blks = [
    {n:"01", ttl:"Criar Turmas",       body:"Organize por disciplina ou semestre. Cada turma tem grupos, alunos e rodadas independentes.", col:"3B82F6"},
    {n:"02", ttl:"Criar Grupos",       body:"Cada grupo = uma empresa EcoBottle em uma região. Nome, empresa, cor e multiplicadores únicos.", col:"10B981"},
    {n:"03", ttl:"Cadastrar Alunos",   body:"Cadastro individual ou importação em massa via CSV. Cada aluno vinculado ao seu grupo.", col:"8B5CF6"},
    {n:"04", ttl:"Importar CSV",       body:"Carregue a lista completa da turma em segundos. Formato: RA, nome, senha, grupo_id.", col:C.GOLD},
    {n:"05", ttl:"Troca de Grupo",     body:"Mova alunos entre grupos quando necessário. Histórico de envios mantido.", col:"F97316"},
    {n:"06", ttl:"Reset de Senha",     body:"Professor redefine senhas diretamente pelo painel — sem dependência de e-mail externo.", col:"EF4444"},
  ];
  const bc=[0.28,4.58,8.88], br=[1.42,3.90];
  blks.forEach((b,i) => {
    const x=bc[i%3], y=br[Math.floor(i/3)], w=4.05, h=2.25;
    s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:C.NAVY_CARD}, line:{color:b.col,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x,y,w,h:0.05, fill:{color:b.col}, line:{color:b.col,width:0} });
    s.addShape(pres.shapes.OVAL, { x:x+(w-0.68)/2, y:y+0.18, w:0.68, h:0.68, fill:{color:b.col}, line:{color:b.col,width:0} });
    s.addText(b.n, { x:x+(w-0.68)/2, y:y+0.18, w:0.68, h:0.68, fontSize:17, fontFace:"Calibri", bold:true, color:C.WHITE, align:"center", valign:"middle", margin:0 });
    s.addText(b.ttl, { x:x+0.1, y:y+1.0, w:w-0.2, h:0.40, fontSize:13, fontFace:"Calibri", bold:true, color:b.col, align:"center", valign:"middle", margin:0 });
    s.addText(b.body, { x:x+0.1, y:y+1.42, w:w-0.2, h:0.72, fontSize:10, fontFace:"Calibri", color:"94A3B8", align:"center", valign:"top", margin:0 });
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — CONTROLE DE RODADAS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Controle de Rodadas");
  sub(s, "O Professor como Game Master — 6 etapas por rodada");

  const steps = [
    {n:"1", lbl:"CRIAR",       desc:"Nova rodada com nome e evento econômico",      col:"3B82F6"},
    {n:"2", lbl:"CONFIGURAR",  desc:"Travas de preços, encargos, parâmetros",       col:"8B5CF6"},
    {n:"3", lbl:"ABRIR",       desc:"Libera formulário para os alunos preencherem", col:"10B981"},
    {n:"4", lbl:"ACOMPANHAR",  desc:"Tracker de envios em tempo real — polling",    col:C.GOLD  },
    {n:"5", lbl:"ENCERRAR",    desc:"Bloqueia novos envios de todos os grupos",     col:"F97316"},
    {n:"6", lbl:"PROCESSAR",   desc:"Gera DRE, BP e DFC + 13 índices contábeis por empresa",      col:"EF4444"},
  ];
  const sw=1.92, aw=0.25, totalW=steps.length*sw+(steps.length-1)*aw;
  const sx=(W-totalW)/2, sy=1.52, sh=4.4;
  steps.forEach((st,i) => {
    const x=sx+i*(sw+aw);
    s.addShape(pres.shapes.RECTANGLE, { x,y:sy, w:sw,h:sh, fill:{color:C.CARD}, line:{color:st.col,width:2}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x,y:sy, w:sw,h:0.06, fill:{color:st.col}, line:{color:st.col,width:0} });
    s.addShape(pres.shapes.OVAL,      { x:x+(sw-0.7)/2, y:sy+0.22, w:0.7,h:0.7, fill:{color:st.col}, line:{color:st.col,width:0} });
    s.addText(st.n, { x:x+(sw-0.7)/2, y:sy+0.22, w:0.7,h:0.7, fontSize:18, fontFace:"Calibri", bold:true, color:C.WHITE, align:"center", valign:"middle", margin:0 });
    s.addText(st.lbl, { x:x+0.06, y:sy+1.10, w:sw-0.12, h:0.50, fontSize:11, fontFace:"Calibri", bold:true, color:st.col, align:"center", valign:"middle", margin:0 });
    s.addText(st.desc, { x:x+0.08, y:sy+1.70, w:sw-0.16, h:2.45, fontSize:10, fontFace:"Calibri", color:C.BODY, align:"center", valign:"top", margin:0 });
    if (i<steps.length-1) {
      s.addShape(pres.shapes.RECTANGLE, { x:x+sw+0.02, y:sy+sh/2-0.03, w:aw-0.04, h:0.06, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
    }
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — EVENTOS ECONÔMICOS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Eventos Econômicos");
  sub(s, "Simulando o mercado real — o professor escolhe; os alunos descobrem ao processar");

  const evts = [
    {emoji:"📈", name:"Crescimento econômico",     eff:"+10% demanda, +2% custos",  col:"10B981"},
    {emoji:"📉", name:"Crise econômica",            eff:"-15% demanda, +5% custos",  col:"EF4444"},
    {emoji:"💸", name:"Inflação alta",              eff:"-6% demanda, +10% custos",  col:"F97316"},
    {emoji:"🏛️", name:"Incentivo fiscal",           eff:"+6% demanda, -4% custos",  col:"3B82F6"},
    {emoji:"⚡", name:"Escassez de matéria-prima",  eff:"+20% custos",               col:"F59E0B"},
    {emoji:"💵", name:"Alta do dólar",              eff:"-3% demanda, +8% custos",   col:"6B7280"},
    {emoji:"🌟", name:"Alta temporada",             eff:"+50% demanda, +5% custos",  col:C.GOLD  },
    {emoji:"🌱", name:"Campanha de sustentabilidade",eff:"+12% demanda, +2% custos", col:"059669"},
  ];
  const ec=[0.28,3.57,6.85,10.13], er=[1.42,3.68];
  evts.forEach((e,i) => {
    const x=ec[i%4], y=er[Math.floor(i/4)], w=2.97, h=1.95;
    s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:C.CARD}, line:{color:C.BORDER,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x,y, w,h:0.05, fill:{color:e.col}, line:{color:e.col,width:0} });
    s.addText(e.emoji, { x, y:y+0.10, w, h:0.52, fontSize:20, align:"center", valign:"middle", margin:0 });
    s.addText(e.name,  { x:x+0.1, y:y+0.66, w:w-0.2, h:0.65, fontSize:11, fontFace:"Calibri", bold:true, color:C.DARK, align:"center", valign:"middle", margin:0 });
    s.addText(e.eff,   { x:x+0.1, y:y+1.38, w:w-0.2, h:0.42, fontSize:11, fontFace:"Calibri", bold:true, color:e.col,  align:"center", valign:"middle", margin:0 });
  });
  s.addText("Os alunos não sabem qual evento será aplicado — surpresa revelada apenas após o processamento da rodada.", {
    x:0.5, y:5.77, w:W-1, h:0.42, fontSize:11, fontFace:"Calibri", italic:true, color:C.GRAY, align:"center", valign:"middle", margin:0 });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — CONFIGURAÇÕES
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Configurações Avançadas da Rodada");
  sub(s, "Professor personaliza cada rodada com parâmetros pedagógicos específicos");
  const cfgs = [
    {emoji:"🔒", ttl:"Travas de Preços",    body:"Bloqueie os preços unitários de Plástico, Tampa, Embalagem e Rótulo — todos os grupos pagam o mesmo custo de MP.", ac:"3B82F6"},
    {emoji:"💰", ttl:"Custo de Inserção",   body:"Define o custo por inserção de marketing (ex.: R$ 600/inserção). Limita estratégias de marketing agressivas.", ac:"10B981"},
    {emoji:"👷", ttl:"Mín. por Máquina",    body:"Exige número mínimo de funcionários para cada máquina adicional — simula restrição real de RH.", ac:"8B5CF6"},
    {emoji:"📊", ttl:"Encargos sobre Folha",body:"Configure % de encargos trabalhistas (ex.: 28%). Calculado sobre a folha salarial total de cada empresa.", ac:C.GOLD},
    {emoji:"💹", ttl:"Faixa de Preço",      body:"Defina preço mínimo e máximo de venda por produto — evita estratégias extremas fora do mercado.", ac:"F97316"},
    {emoji:"🎯", ttl:"Evento Econômico",    body:"Escolha o evento que afetará demanda e custos nesta rodada — mantido em sigilo até o processamento.", ac:"EF4444"},
  ];
  const cc=[0.28,4.58,8.88], cr=[1.42,3.90];
  cfgs.forEach((c,i) => card(s, cc[i%3], cr[Math.floor(i/3)], 4.05, 2.30, {...c,ts:13,bs:10.5}));
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — FORMULÁRIO DO ALUNO
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.DARK_BG };
  s.addShape(pres.shapes.OVAL, { x:10.2, y:-1.5, w:5.5, h:5.5, fill:{color:C.BLUE,transparency:90}, line:{color:C.BLUE,width:0,transparency:86} });
  title(s, "Formulário de Decisão do Aluno", true);
  sub(s, "6 seções integradas — todas as decisões em uma única tela responsiva", true);

  const secs = [
    {n:"1", lbl:"PRODUÇÃO",   desc:"Qtd. a produzir, funcionários, contratar/demitir", col:"3B82F6"},
    {n:"2", lbl:"MATERIAIS",  desc:"Compra de MP: plástico, tampa, embalagem, rótulo",  col:"10B981"},
    {n:"3", lbl:"VENDAS",     desc:"Vendas por região, preço e marketing regional",      col:"8B5CF6"},
    {n:"4", lbl:"MARKETING",  desc:"Investimento em marketing e desconto comercial",     col:C.GOLD  },
    {n:"5", lbl:"MÁQUINAS",   desc:"Compra de máquinas para expandir capacidade",        col:"F97316"},
    {n:"6", lbl:"FINANÇAS",   desc:"Empréstimos, prazo de pagamento e recebimento",      col:"EF4444"},
  ];
  const sc=[0.45,4.62,8.80], sr=[1.65,3.68];
  secs.forEach((sec,i) => {
    const x=sc[i%3], y=sr[Math.floor(i/3)], w=3.85, h=1.75;
    s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:C.NAVY_CARD}, line:{color:sec.col,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.OVAL, { x:x+0.14, y:y+(h-0.68)/2, w:0.68,h:0.68, fill:{color:sec.col}, line:{color:sec.col,width:0} });
    s.addText(sec.n, { x:x+0.14, y:y+(h-0.68)/2, w:0.68,h:0.68, fontSize:18, fontFace:"Calibri", bold:true, color:C.WHITE, align:"center", valign:"middle", margin:0 });
    s.addText(sec.lbl, { x:x+0.96, y:y+0.18, w:w-1.06, h:0.46, fontSize:13, fontFace:"Calibri", bold:true, color:sec.col, align:"left", valign:"middle", margin:0 });
    s.addText(sec.desc, { x:x+0.96, y:y+0.70, w:w-1.06, h:0.85, fontSize:10.5, fontFace:"Calibri", color:"94A3B8", align:"left", valign:"top", margin:0 });
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.62, w:W, h:1.25, fill:{color:"030B16"}, line:{color:"030B16",width:0} });
  s.addText("✅  Prévia de DRE calculada em tempo real  •  Alertas de inconsistência automáticos  •  Envio bloqueado após confirmação", {
    x:0.5, y:5.68, w:W-1, h:0.50, fontSize:12, fontFace:"Calibri", color:"93C5FD", align:"center", valign:"middle", margin:0 });
  sig(s, true);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — DECISÃO DE PRODUÇÃO
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Decisão de Produção");
  sub(s, "Capacidade produtiva, gestão de pessoal e expansão via máquinas");

  s.addShape(pres.shapes.RECTANGLE, { x:0.28, y:1.45, w:4.05, h:5.30, fill:{color:C.BL_LIGHT}, line:{color:C.BL_MED,width:1}, shadow:mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x:0.28, y:1.45, w:0.07, h:5.30, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
  s.addText("5.000", { x:0.5, y:1.62, w:3.65, h:1.15, fontSize:52, fontFace:"Calibri", bold:true, color:C.BLUE, align:"center", valign:"middle", margin:0 });
  s.addText("unidades / rodada\ncapacidade base da fábrica", { x:0.5, y:2.82, w:3.65, h:0.78, fontSize:12, fontFace:"Calibri", color:C.GRAY, align:"center", valign:"middle", margin:0 });
  ["Capacidade adicional via compra de máquinas",
   "Funcionários atuais herdados da rodada anterior",
   "Contratar ou demitir nesta rodada",
   "Qtd. a produzir ≤ capacidade disponível",
   "Custo variável: R$ 10,60 por unidade",
   "Folha salarial e encargos calculados automaticamente"].forEach((t,i) => {
    s.addShape(pres.shapes.OVAL, { x:0.45, y:3.73+i*0.45, w:0.18,h:0.18, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
    s.addText(t, { x:0.72, y:3.68+i*0.45, w:3.4, h:0.36, fontSize:10.5, fontFace:"Calibri", color:C.BODY, align:"left", valign:"middle", margin:0 });
  });

  s.addText("Máquinas Disponíveis para Compra", { x:4.58, y:1.48, w:8.55, h:0.43, fontSize:14, fontFace:"Calibri", bold:true, color:C.DARK, align:"left", valign:"middle", margin:0 });
  [{name:"Pequena",cap:"+833 unid.",cost:"R$ 80.000",col:"3B82F6"},
   {name:"Média",  cap:"+1.666 unid.",cost:"R$ 150.000",col:"8B5CF6"},
   {name:"Grande", cap:"+2.500 unid.",cost:"R$ 210.000",col:"10B981"}].forEach((m,i) => {
    const mx=4.58+i*2.85, my=2.02, mw=2.65, mh=2.55;
    s.addShape(pres.shapes.RECTANGLE, { x:mx,y:my,w:mw,h:mh, fill:{color:C.CARD}, line:{color:C.BORDER,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x:mx,y:my,w:mw,h:0.05, fill:{color:m.col}, line:{color:m.col,width:0} });
    s.addText(m.name, { x:mx+0.1,y:my+0.18, w:mw-0.2,h:0.45, fontSize:14, fontFace:"Calibri", bold:true, color:C.DARK, align:"center", valign:"middle", margin:0 });
    s.addText(m.cap,  { x:mx+0.1,y:my+0.72, w:mw-0.2,h:0.52, fontSize:18, fontFace:"Calibri", bold:true, color:m.col,  align:"center", valign:"middle", margin:0 });
    s.addText(m.cost, { x:mx+0.1,y:my+1.32, w:mw-0.2,h:0.40, fontSize:12, fontFace:"Calibri", color:C.GRAY, align:"center", valign:"middle", margin:0 });
    s.addText("por rodada", { x:mx+0.1,y:my+1.72,w:mw-0.2,h:0.35, fontSize:9, fontFace:"Calibri", color:C.GRAY, align:"center", valign:"middle", margin:0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:4.58, y:4.78, w:8.55, h:1.95, fill:{color:C.BL_LIGHT}, line:{color:C.BL_MED,width:1} });
  s.addText("Estoque e Carryover entre Rodadas", { x:4.75, y:4.90, w:8.2, h:0.40, fontSize:13, fontFace:"Calibri", bold:true, color:C.DARK, align:"left", valign:"middle", margin:0 });
  s.addText("Produto acabado não vendido é estocado para a próxima rodada com custo de armazenagem de 5% do valor. Matérias-primas não consumidas também transitam entre rodadas (carryover contábil).", {
    x:4.75, y:5.34, w:8.2, h:1.05, fontSize:10.5, fontFace:"Calibri", color:C.BODY, align:"left", valign:"top", margin:0 });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 12 — VENDAS POR REGIÃO
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Vendas por Região");
  sub(s, "Estratégia de preço e marketing diferenciada por mercado regional");

  const hCols=[0.28,2.55,5.05,7.45,9.82,11.98];
  const hWidths=[2.18,2.40,2.30,2.27,2.06,1.23];
  const hdrs=["Região","Quantidade","Preço (R$)","Inserções","Receita Est.","Status"];
  hdrs.forEach((h,i) => {
    s.addShape(pres.shapes.RECTANGLE, { x:hCols[i], y:1.42, w:hWidths[i],h:0.44, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
    s.addText(h, { x:hCols[i]+0.06, y:1.42, w:hWidths[i]-0.12,h:0.44, fontSize:11, fontFace:"Calibri", bold:true, color:C.WHITE, align:"left", valign:"middle", margin:0 });
  });
  const rows=[
    {reg:"Norte", col:"10B981", qtd:"1.200",  price:"R$ 45,00",mkt:"3",rec:"R$ 54.000",ativo:true},
    {reg:"Sul",   col:"3B82F6", qtd:"800",    price:"R$ 42,00",mkt:"2",rec:"R$ 33.600",ativo:true},
    {reg:"Leste", col:"8B5CF6", qtd:"500",    price:"R$ 48,00",mkt:"1",rec:"R$ 24.000",ativo:true},
    {reg:"Oeste", col:C.GOLD,   qtd:"—",      price:"—",       mkt:"—",rec:"—",        ativo:false},
    {reg:"Centro",col:"EF4444", qtd:"—",      price:"—",       mkt:"—",rec:"—",        ativo:false},
  ];
  rows.forEach((r,i) => {
    const ry=1.88+i*0.60;
    s.addShape(pres.shapes.RECTANGLE, { x:0.28, y:ry, w:12.93,h:0.55, fill:{color:i%2===0?C.CARD:C.WHITE}, line:{color:C.BORDER,width:0} });
    s.addShape(pres.shapes.RECTANGLE, { x:0.28, y:ry, w:0.05,h:0.55, fill:{color:r.col}, line:{color:r.col,width:0} });
    [r.reg,r.qtd,r.price,r.mkt,r.rec].forEach((v,j) => {
      s.addText(v, { x:hCols[j]+0.08, y:ry, w:hWidths[j]-0.16,h:0.55, fontSize:11, fontFace:"Calibri",
        bold:j===0, color:j===0?C.DARK:(r.ativo?C.BODY:C.GRAY), align:"left", valign:"middle", margin:0 });
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:12.02,y:ry+0.10,w:1.1,h:0.33,
      fill:{color:r.ativo?"D1FAE5":"F1F5F9"}, line:{color:r.ativo?"10B981":C.BORDER,width:1}, rectRadius:0.14 });
    s.addText(r.ativo?"Ativa":"Inativa", { x:12.02,y:ry+0.10,w:1.1,h:0.33,
      fontSize:9.5, fontFace:"Calibri", bold:true, color:r.ativo?"059669":C.GRAY, align:"center", valign:"middle", margin:0 });
  });
  ["Preço praticado vs. média de mercado determina fator de demanda adicional para cada região.",
   "Marketing aumenta a demanda regional — cada inserção tem custo configurável pelo professor.",
   "Desconto comercial reduz o preço efetivo e atrai mais compradores — estratégia de volume."].forEach((t,i) => {
    s.addShape(pres.shapes.OVAL, { x:0.35,y:5.40+i*0.42,w:0.20,h:0.20, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
    s.addText(t, { x:0.65,y:5.35+i*0.42, w:12.4,h:0.35, fontSize:10.5, fontFace:"Calibri", color:C.BODY, align:"left", valign:"middle", margin:0 });
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 13 — DRE PRÉVIA
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "DRE — Prévia em Tempo Real");
  sub(s, "Demonstração do Resultado do Exercício (DRE) — regime de competência, calculada em tempo real");

  const dreRows = [
    {lbl:"(+) Receita Bruta de Vendas",             val:"R$ 111.600", bold:false, sub:true,  vCol:"10B981"},
    {lbl:"(-) Impostos sobre Vendas (18%)",         val:"(R$ 20.088)",bold:false, sub:false, vCol:"EF4444"},
    {lbl:"(=) Receita Líquida de Vendas",           val:"R$ 91.512",  bold:true,  sub:true,  vCol:"10B981"},
    {lbl:"(-) CPV — Custo dos Produtos Vendidos",   val:"(R$ 26.500)",bold:false, sub:false, vCol:"EF4444"},
    {lbl:"(=) Lucro Bruto",                         val:"R$ 65.012",  bold:true,  sub:true,  vCol:"10B981"},
    {lbl:"(-) Despesas Operacionais totais",         val:"(R$ 48.200)",bold:false, sub:false, vCol:"EF4444"},
    {lbl:"    Mktg + Salários + Encargos + Fixas...",val:"",           bold:false, sub:false, vCol:C.GRAY,  indent:true},
    {lbl:"(=) Resultado Operacional (EBITDA)",      val:"R$ 16.812",  bold:true,  sub:true,  vCol:"10B981"},
    {lbl:"(-) Despesas Financeiras / (+) Rec. Fin.", val:"(R$ 1.200)", bold:false, sub:false, vCol:"F97316"},
    {lbl:"(=) Resultado Antes do IR",               val:"R$ 15.612",  bold:true,  sub:true,  vCol:"10B981"},
    {lbl:"(-) IR + CSLL (34%)",                     val:"(R$ 5.308)", bold:false, sub:false, vCol:"EF4444"},
    {lbl:"(=) LUCRO LÍQUIDO",                       val:"R$ 10.304",  bold:true,  sub:false, vCol:"10B981", final:true},
  ];

  const tx=0.45, tw=8.62, rh=0.435;
  let ry=1.45;
  dreRows.forEach(r => {
    const bg = r.final ? "F0FDF4" : (r.sub ? C.CARD : C.WHITE);
    s.addShape(pres.shapes.RECTANGLE, { x:tx, y:ry, w:tw, h:rh, fill:{color:bg}, line:{color:r.final?"10B981":C.BORDER,width:r.final?1:0} });
    const lx = tx+0.12+(r.indent?0.22:0);
    s.addText(r.lbl, { x:lx, y:ry, w:tw-2.75-(r.indent?0.22:0), h:rh,
      fontSize:r.final?12:11, fontFace:"Calibri", bold:r.bold, color:r.indent?C.GRAY:C.BODY,
      align:"left", valign:"middle", margin:0 });
    if (r.val) s.addText(r.val, { x:tx+tw-2.55, y:ry, w:2.48, h:rh,
      fontSize:r.final?13:11, fontFace:"Calibri", bold:r.bold, color:r.vCol,
      align:"right", valign:"middle", margin:0 });
    ry += rh;
  });

  // Right note panel
  const npx=9.38, npy=1.45, npw=3.75, nph=5.22;
  s.addShape(pres.shapes.RECTANGLE, { x:npx,y:npy,w:npw,h:nph, fill:{color:C.BL_LIGHT}, line:{color:C.BL_MED,width:1}, shadow:mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x:npx,y:npy,w:0.07,h:nph, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
  [["ℹ️","Prévia estimada","Calculada com preço médio de R$ 42,00. Valores reais dependem das decisões de todos os grupos."],
   ["⚡","Tempo real","Atualizada a cada campo preenchido — impacto imediato de cada decisão visível ao aluno."],
   ["⚠️","Inconsistências","Alertas automáticos: produção acima da capacidade, caixa negativo, decisões inválidas."],
   ["🖨️","Impressão","O aluno pode imprimir ou salvar a prévia em PDF antes de confirmar o envio."]
  ].forEach(([ico,ttl,desc],i) => {
    const ny=npy+0.18+i*1.25;
    s.addText(ico,  { x:npx+0.1, y:ny, w:0.55,h:0.38, fontSize:14, align:"center",valign:"middle",margin:0 });
    s.addText(ttl,  { x:npx+0.68,y:ny, w:npw-0.82,h:0.38, fontSize:12, fontFace:"Calibri", bold:true, color:C.DARK, align:"left",valign:"middle",margin:0 });
    s.addText(desc, { x:npx+0.18,y:ny+0.42, w:npw-0.32,h:0.72, fontSize:9.5, fontFace:"Calibri", color:C.BODY, align:"left",valign:"top",margin:0 });
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 14 — RESULTADOS E RANKING
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Resultados e Ranking");
  sub(s, "Score ponderado por 6 indicadores financeiros — calculado automaticamente");

  // Score bars
  s.addText("Composição do Score (100 pts)", { x:0.28,y:1.45,w:5.6,h:0.40, fontSize:13, fontFace:"Calibri", bold:true, color:C.DARK, align:"left",valign:"middle",margin:0 });
  [["ROA",                25,"3B82F6"],["Liquidez Corrente",20,"10B981"],["Liquidez Seca",   15,"8B5CF6"],
   ["Liquidez Imediata", 15,C.GOLD  ],["Margem Líquida",   15,"F97316"],["Ciclo Financeiro",10,"EF4444"]
  ].forEach(([lbl,pts,col],i) => {
    const by=1.95+i*0.50, bx=0.28, mxW=5.3;
    s.addText(lbl, { x:bx, y:by, w:2.45,h:0.40, fontSize:11, fontFace:"Calibri", color:C.BODY, align:"left",valign:"middle",margin:0 });
    s.addShape(pres.shapes.RECTANGLE, { x:bx+2.52,y:by+0.07, w:mxW-2.52,h:0.25, fill:{color:C.BORDER}, line:{color:C.BORDER,width:0} });
    s.addShape(pres.shapes.RECTANGLE, { x:bx+2.52,y:by+0.07, w:(mxW-2.52)*(pts/100),h:0.25, fill:{color:col}, line:{color:col,width:0} });
    s.addText(pts+"pts", { x:bx+mxW+0.08,y:by, w:0.68,h:0.40, fontSize:11, fontFace:"Calibri", bold:true, color:col, align:"left",valign:"middle",margin:0 });
  });

  // Rating badges
  s.addText("Rating Automático", { x:0.28,y:5.0,w:5.6,h:0.38, fontSize:13, fontFace:"Calibri", bold:true, color:C.DARK, align:"left",valign:"middle",margin:0 });
  [["AAA","≥ 75 pts","10B981","D1FAE5"],["AA","≥ 60 pts","3B82F6","DBEAFE"],["A","≥ 45 pts","8B5CF6","EDE9FE"],
   ["B","≥ 30 pts","F97316","FEF3C7"],["C","< 30 pts","EF4444","FEE2E2"]].forEach(([lbl,rng,col,bg],i) => {
    const bx=0.28+i*1.12;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:bx,y:5.48,w:1.0,h:1.18, fill:{color:bg}, line:{color:col,width:1}, rectRadius:0.1 });
    s.addText(lbl, { x:bx,y:5.53,w:1.0,h:0.50, fontSize:18, fontFace:"Calibri", bold:true, color:col, align:"center",valign:"middle",margin:0 });
    s.addText(rng, { x:bx,y:6.05,w:1.0,h:0.52, fontSize:9.5, fontFace:"Calibri", color:col, align:"center",valign:"top",margin:0 });
  });

  // Ranking table
  s.addText("Ranking da Rodada — Exemplo", { x:6.2,y:1.45,w:6.95,h:0.40, fontSize:13, fontFace:"Calibri", bold:true, color:C.DARK, align:"left",valign:"middle",margin:0 });
  const hws=[0.72,2.52,1.32,1.78,1.38];
  const hdrs2=["Pos.","Empresa","Score","Marg. Líq.","Rating"];
  let hx2=6.2;
  hdrs2.forEach((h,i) => {
    s.addShape(pres.shapes.RECTANGLE, { x:hx2,y:1.95,w:hws[i],h:0.42, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
    s.addText(h, { x:hx2+0.04,y:1.95,w:hws[i]-0.08,h:0.42, fontSize:10.5, fontFace:"Calibri", bold:true, color:C.WHITE, align:"left",valign:"middle",margin:0 });
    hx2+=hws[i];
  });
  [["1º 🥇","EcoBottle Norte","78.4","12.3%","AAA",C.GOLD],["2º 🥈","EcoBottle Sul","65.2","9.8%","AA","94A3B8"],
   ["3º 🥉","EcoBottle Leste","58.9","7.1%","AA","CD7F32"],["4º","EcoBottle Oeste","47.3","4.2%","A",C.BODY],
   ["5º","EcoBottle Centro","31.1","1.8%","B",C.BODY]].forEach((r,i) => {
    const rry=2.40+i*0.58;
    s.addShape(pres.shapes.RECTANGLE, { x:6.2,y:rry,w:7.72,h:0.53, fill:{color:i%2===0?C.CARD:C.WHITE}, line:{color:C.BORDER,width:0} });
    let vx2=6.2;
    [r[0],r[1],r[2],r[3],r[4]].forEach((v,j) => {
      s.addText(v, { x:vx2+0.04,y:rry,w:hws[j]-0.08,h:0.53, fontSize:11, fontFace:"Calibri",
        bold:j===2, color:j===0?C.GOLD:(j===2?C.BLUE:(j===4?"10B981":C.BODY)),
        align:"left",valign:"middle",margin:0 });
      vx2+=hws[j];
    });
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 15 — 13 INDICADORES
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "13 Indicadores Financeiros");
  sub(s, "Análise contábil completa — liquidez, rentabilidade, atividade e estrutura patrimonial");

  [{ttl:"Liquidez",      col:"3B82F6",items:["Liquidez Corrente","Liquidez Seca","Liquidez Imediata"],              desc:"Capacidade de pagamento de curto prazo"},
   {ttl:"Rentabilidade", col:"10B981",items:["Margem Bruta","Margem Operacional","Margem Líquida","ROA","ROE"],      desc:"Eficiência na geração de lucro"},
   {ttl:"Atividade",     col:"8B5CF6",items:["PME — Prazo Médio Estoque","PMR — Prazo Médio Recebimento","PMP — Prazo Médio Pagamento","Ciclo Financeiro"], desc:"Eficiência operacional e ciclo de caixa"},
   {ttl:"Estrutura",     col:C.GOLD,  items:["Compras totais de materiais"],                                        desc:"Gestão de insumos e capital de giro"},
  ].forEach((g,i) => {
    const gx=0.28+i*3.25, gy=1.45, gw=3.05, gh=5.55;
    s.addShape(pres.shapes.RECTANGLE, { x:gx,y:gy,w:gw,h:gh, fill:{color:C.CARD}, line:{color:C.BORDER,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x:gx,y:gy,w:gw,h:0.06, fill:{color:g.col}, line:{color:g.col,width:0} });
    s.addText(g.ttl, { x:gx+0.1,y:gy+0.16,w:gw-0.2,h:0.48, fontSize:16, fontFace:"Calibri", bold:true, color:g.col, align:"center",valign:"middle",margin:0 });
    s.addText(g.desc, { x:gx+0.1,y:gy+0.70,w:gw-0.2,h:0.50, fontSize:9.5, fontFace:"Calibri", italic:true, color:C.GRAY, align:"center",valign:"middle",margin:0 });
    g.items.forEach((it,j) => {
      const iy=gy+1.33+j*0.73;
      s.addShape(pres.shapes.RECTANGLE, { x:gx+0.14,y:iy,w:gw-0.28,h:0.60, fill:{color:C.WHITE}, line:{color:C.BORDER,width:1} });
      s.addShape(pres.shapes.RECTANGLE, { x:gx+0.14,y:iy,w:0.05,h:0.60, fill:{color:g.col}, line:{color:g.col,width:0} });
      s.addText(it, { x:gx+0.26,y:iy,w:gw-0.40,h:0.60, fontSize:10.5, fontFace:"Calibri", color:C.BODY, align:"left",valign:"middle",margin:0 });
    });
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 16 — CONCEITOS CONTÁBEIS PRATICADOS (novo)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Conceitos Contábeis Praticados");
  sub(s, "O Arena Contábil como laboratório vivo de Ciências Contábeis");

  const concepts = [
    {emoji:"⚖️", ttl:"Regime de Competência", body:"Receitas e despesas reconhecidas no período em que ocorrem — independentemente do recebimento ou pagamento em caixa.",           ac:"3B82F6"},
    {emoji:"🔄", ttl:"Princípio da Continuidade", body:"O Balanço de encerramento de cada rodada é o Balanço de abertura da seguinte — a empresa é tratada como ente contínuo.",     ac:"10B981"},
    {emoji:"🏛️", ttl:"Equação Patrimonial", body:"Ativo = Passivo + Patrimônio Líquido verificada automaticamente após cada processamento — fundamento da partida dobrada.",       ac:"8B5CF6"},
    {emoji:"📉", ttl:"Custo Histórico e Depreciação", body:"Máquinas registradas pelo custo de aquisição; depreciação acumulada reconhecida por período — ativo imobilizado real.", ac:C.GOLD},
    {emoji:"📑", ttl:"Demonstrações Contábeis", body:"DRE (resultado), Balanço Patrimonial (posição) e DFC (fluxo de caixa) produzidas integralmente a cada rodada processada.",   ac:"F97316"},
    {emoji:"🔍", ttl:"Análise das Demonstrações", body:"PME, PMR, PMP, Ciclo Financeiro, ROA, ROE, margens e liquidez — leitura e interpretação dos índices contábeis na prática.", ac:"EF4444"},
  ];
  const cc=[0.28,4.58,8.88], cr=[1.42,3.90];
  concepts.forEach((c,i) => card(s, cc[i%3], cr[Math.floor(i/3)], 4.05, 2.30, {...c,ts:13,bs:10.5}));
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 17 — BALANÇO PATRIMONIAL
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Balanço Patrimonial");
  sub(s, "Estrutura contábil completa — Princípio da Continuidade: BP final vira abertura da próxima rodada");

  function bpCol(sx,sy,sw,sh,hdr,hCol,rows,totLbl,totVal) {
    s.addShape(pres.shapes.RECTANGLE, { x:sx,y:sy,w:sw,h:sh, fill:{color:C.CARD}, line:{color:C.BORDER,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x:sx,y:sy,w:sw,h:0.52, fill:{color:hCol}, line:{color:hCol,width:0} });
    s.addText(hdr, { x:sx+0.12,y:sy,w:sw-0.24,h:0.52, fontSize:13, fontFace:"Calibri", bold:true, color:C.WHITE, align:"left",valign:"middle",margin:0 });
    let ry=sy+0.62;
    rows.forEach(r => {
      if (r.sub) {
        s.addText(r.sub, { x:sx+0.12,y:ry,w:sw-0.24,h:0.30, fontSize:10, fontFace:"Calibri", bold:true, color:hCol, align:"left",valign:"middle",margin:0 });
        ry+=0.32;
      } else {
        s.addText(r.lbl, { x:sx+0.22,y:ry,w:sw-1.7,h:0.46, fontSize:10.5, fontFace:"Calibri", color:C.BODY, align:"left",valign:"middle",margin:0 });
        s.addText(r.val, { x:sx+sw-1.58,y:ry,w:1.48,h:0.46, fontSize:10.5, fontFace:"Calibri", bold:r.bold, color:r.bold?C.DARK:C.BODY, align:"right",valign:"middle",margin:0 });
        ry+=0.48;
      }
    });
    s.addShape(pres.shapes.RECTANGLE, { x:sx,y:sy+sh-0.58,w:sw,h:0.58, fill:{color:hCol,transparency:84}, line:{color:hCol,width:0} });
    s.addText(totLbl, { x:sx+0.12,y:sy+sh-0.58,w:sw-1.62,h:0.58, fontSize:12, fontFace:"Calibri", bold:true, color:C.DARK, align:"left",valign:"middle",margin:0 });
    s.addText(totVal, { x:sx+sw-1.58,y:sy+sh-0.58,w:1.48,h:0.58, fontSize:12, fontFace:"Calibri", bold:true, color:hCol, align:"right",valign:"middle",margin:0 });
  }

  bpCol(0.28,1.45,5.88,5.65,"ATIVO","3B82F6",[
    {sub:"Ativo Circulante"},
    {lbl:"Caixa e Equivalentes",        val:"R$ 28.500"},
    {lbl:"Contas a Receber (clientes)", val:"R$ 12.000"},
    {lbl:"Estoque de Matérias-Primas",  val:"R$ 4.800"},
    {lbl:"Estoque de Produto Acabado",  val:"R$ 6.200"},
    {sub:"Ativo Não Circulante"},
    {lbl:"Máquinas e Equipamentos",     val:"R$ 80.000"},
    {lbl:"(-) Depreciação Acumulada",   val:"(R$ 5.000)"},
  ],"TOTAL DO ATIVO","R$ 126.500");

  bpCol(6.52,1.45,6.53,5.65,"PASSIVO + PATRIMÔNIO LÍQUIDO","10B981",[
    {sub:"Passivo Circulante"},
    {lbl:"Fornecedores (MP a pagar)",val:"R$ 5.200"},
    {lbl:"Empréstimos CP",           val:"R$ 0"},
    {sub:"Passivo Não Circulante"},
    {lbl:"Empréstimos LP",           val:"R$ 15.000"},
    {sub:"Patrimônio Líquido"},
    {lbl:"Capital Social",           val:"R$ 96.000"},
    {lbl:"Lucros Acumulados",        val:"R$ 10.300", bold:true},
  ],"TOTAL PAS. + PL","R$ 126.500");

  s.addText("Ativo Total = Passivo Total + PL  |  Regime de Competência: receitas e despesas reconhecidas no período em que ocorrem, independentemente do pagamento  |  Princípio da Continuidade aplicado a cada rodada", {
    x:0.45, y:7.12, w:W-0.9, h:0.28, fontSize:9.5, fontFace:"Calibri", italic:true, color:C.GRAY, align:"center",valign:"middle",margin:0 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 17 — GAMIFICAÇÃO
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.DARK_BG };
  s.addShape(pres.shapes.OVAL, { x:9.8,y:-1.8,w:6.2,h:6.2, fill:{color:C.GOLD,transparency:92}, line:{color:C.GOLD,width:0,transparency:88} });
  title(s, "Gamificação e Medalhas", true);
  sub(s, "Engajamento, motivação e reconhecimento por performance financeira", true);

  [{ico:"🥇",ttl:"Melhor CFO",          desc:"Maior score geral da rodada — liderança financeira completa",          col:C.GOLD},
   {ico:"💧",ttl:"Melhor Liquidez",      desc:"Maior Liquidez Corrente — empresa mais solvente e segura",            col:"3B82F6"},
   {ico:"📈",ttl:"Maior Crescimento",    desc:"Maior crescimento de receita vs. rodada anterior",                    col:"10B981"},
   {ico:"💰",ttl:"Mais Lucrativo",       desc:"Maior margem líquida — eficiência máxima na geração de lucro",       col:"F97316"},
   {ico:"🏆",ttl:"Campeão de Vendas",    desc:"Maior receita total — domínio de mercado comprovado",                col:"8B5CF6"},
   {ico:"⭐",ttl:"Rating AAA",           desc:"Score ≥ 75 pontos — excelência financeira em todas as dimensões",    col:"EF4444"},
  ].forEach((m,i) => {
    const x=0.45+(i%3)*4.28, y=1.65+(Math.floor(i/3))*2.38, w=3.95, h=2.12;
    s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:C.NAVY_CARD}, line:{color:m.col,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x,y,w,h:0.05, fill:{color:m.col}, line:{color:m.col,width:0} });
    s.addText(m.ico, { x,y:y+0.13,w:0.88,h:0.64, fontSize:26, align:"center",valign:"middle",margin:0 });
    s.addText(m.ttl, { x:x+0.88,y:y+0.16,w:w-0.98,h:0.46, fontSize:13, fontFace:"Calibri", bold:true, color:m.col, align:"left",valign:"middle",margin:0 });
    s.addText(m.desc, { x:x+0.88,y:y+0.68,w:w-0.98,h:1.10, fontSize:10.5, fontFace:"Calibri", color:"94A3B8", align:"left",valign:"top",margin:0 });
  });
  s.addText("Medalhas acumuladas ao longo de todas as rodadas  •  Ranking geral sempre visível para todos os alunos da turma", {
    x:0.5,y:6.35,w:W-1,h:0.38, fontSize:11, fontFace:"Calibri", color:"475569", align:"center",valign:"middle",margin:0 });
  sig(s, true);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 18 — RELATÓRIOS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Relatórios e Exportação");
  sub(s, "Dados completos para análise, avaliação e portfólio acadêmico");
  [{emoji:"📊",ttl:"Ranking Consolidado",  body:"Posição, score e evolução de cada grupo por rodada e no ranking geral acumulado do semestre."},
   {emoji:"📋",ttl:"DRE + BP + Fluxo",    body:"Demonstrações financeiras completas de todos os grupos — geradas automaticamente após cada processamento."},
   {emoji:"📈",ttl:"Evolução Multi-Rodada",body:"Gráficos comparativos de Lucro, Receita e Liquidez ao longo de todas as rodadas do semestre."},
   {emoji:"📄",ttl:"Exportação em PDF",    body:"Documento formatado por grupo: DRE, BP, indicadores e comentário personalizado do professor."},
   {emoji:"📗",ttl:"Exportação em Excel",  body:"Planilha com dados brutos de todas as rodadas — ideal para análise estatística e pesquisa."},
   {emoji:"🥧",ttl:"Market Share",         body:"Gráfico de fatia de mercado por empresa — visualiza o domínio competitivo de cada grupo."},
  ].forEach((r,i) => {
    card(s, [0.28,4.58,8.88][i%3], [1.42,4.02][Math.floor(i/3)], 4.05, 2.30, {...r,ts:13,bs:10.5});
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 19 — DIFERENCIAIS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Por que o Arena Contábil?");
  sub(s, "Diferenciais que fazem a diferença na experiência de ensino e aprendizado");
  [{emoji:"🌐",ttl:"100% Online",         body:"Acesso de qualquer dispositivo com internet. Sem instalação, sem configuração.",                              ac:"3B82F6"},
   {emoji:"📱",ttl:"Mobile-First",        body:"Interface responsiva otimizada para celular — alunos acessam de qualquer lugar, a qualquer hora.",           ac:"10B981"},
   {emoji:"⚡",ttl:"Tempo Real",          body:"Resultados processados instantaneamente. Rankings e gráficos atualizados na hora.",                          ac:"F97316"},
   {emoji:"🔐",ttl:"Segurança",           body:"JWT por sessão, isolamento por turma — aluno acessa exclusivamente a sua própria empresa.",                  ac:"8B5CF6"},
   {emoji:"📚",ttl:"Manual Integrado",    body:"Manuais completos do professor e do aluno acessíveis dentro do sistema, com exportação em PDF.",             ac:C.GOLD  },
   {emoji:"🎯",ttl:"Pedagógico Completo", body:"13 índices contábeis + DRE + Balanço Patrimonial + DFC gerados conforme práticas de análise das demonstrações contábeis.",          ac:"EF4444"},
  ].forEach((d,i) => {
    card(s, [0.28,4.58,8.88][i%3], [1.42,4.02][Math.floor(i/3)], 4.05, 2.30, {...d,ts:13,bs:10.5});
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 20 — APLICAÇÃO ACADÊMICA
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.WHITE };
  chrome(s);
  title(s, "Aplicação em Sala de Aula");
  sub(s, "Metodologia ativa para Ciências Contábeis — aprendizado por competição");

  [{ico:"📚", ttl:"Disciplinas", col:"3B82F6",
    items:["Contabilidade Gerencial","Análise de Demonstrações","Custos e Formação de Preço","Finanças Empresariais","Gestão Estratégica"]},
   {ico:"👥", ttl:"Dinâmica da Turma", col:"10B981",
    items:["Grupos ilimitados — o professor define","Cada rodada = 1 período contábil","Decisões sigilosas por grupo","Resultados compartilhados ao final","Competição saudável e motivadora"]},
   {ico:"📊", ttl:"Avaliação", col:"8B5CF6",
    items:["Score financeiro pode compor a nota","Relatórios em PDF para portfólio","Histórico completo de decisões","Comentários do professor por grupo","Excel para análise estatística"]},
   {ico:"⏱️", ttl:"Duração e Flexibilidade", col:C.GOLD,
    items:["Jogo completo: 3 a 8 rodadas","Cada rodada: 30 a 60 minutos","Funciona em EAD/híbrido","Professor controla o ritmo total","Múltiplas turmas simultâneas"]},
  ].forEach((q,i) => {
    const qx=[0.28,6.78][i%2], qy=[1.42,4.02][Math.floor(i/2)], qw=6.2, qh=2.35;
    s.addShape(pres.shapes.RECTANGLE, { x:qx,y:qy,w:qw,h:qh, fill:{color:C.BL_LIGHT}, line:{color:C.BL_MED,width:1}, shadow:mkS() });
    s.addShape(pres.shapes.RECTANGLE, { x:qx,y:qy,w:0.07,h:qh, fill:{color:q.col}, line:{color:q.col,width:0} });
    s.addText(q.ico+" "+q.ttl, { x:qx+0.2,y:qy+0.10,w:qw-0.30,h:0.46, fontSize:14, fontFace:"Calibri", bold:true, color:q.col, align:"left",valign:"middle",margin:0 });
    q.items.forEach((it,j) => {
      s.addShape(pres.shapes.OVAL, { x:qx+0.21,y:qy+0.67+j*0.33,w:0.14,h:0.14, fill:{color:q.col}, line:{color:q.col,width:0} });
      s.addText(it, { x:qx+0.43,y:qy+0.62+j*0.33,w:qw-0.55,h:0.30, fontSize:10.5, fontFace:"Calibri", color:C.BODY, align:"left",valign:"middle",margin:0 });
    });
  });
  sig(s);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 21 — ENCERRAMENTO
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.DARK_BG };
  s.addShape(pres.shapes.OVAL, { x:9.5, y:-1.5, w:6.2,h:6.2, fill:{color:C.BLUE,transparency:87}, line:{color:C.BLUE,width:0,transparency:83} });
  s.addShape(pres.shapes.OVAL, { x:-2.0, y:4.5, w:5.2,h:5.2, fill:{color:"7C3AED",transparency:91}, line:{color:"7C3AED",width:0,transparency:87} });
  s.addShape(pres.shapes.OVAL, { x:5.5,  y:2.5, w:3.2,h:3.2, fill:{color:C.GOLD,transparency:94}, line:{color:C.GOLD,width:0,transparency:90} });
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:W,h:0.07, fill:{color:C.BLUE}, line:{color:C.BLUE,width:0} });
  logo(s);
  s.addText("Arena Contábil", { x:1.0,y:1.80,w:11.33,h:1.42, fontSize:62, fontFace:"Calibri", bold:true, color:C.WHITE, align:"center",valign:"middle",margin:0 });
  s.addText("Business Accounting Simulator", { x:1.0,y:3.30,w:11.33,h:0.60, fontSize:22, fontFace:"Calibri", color:C.BLUE, align:"center",valign:"middle",margin:0 });
  s.addShape(pres.shapes.RECTANGLE, { x:5.0,y:4.03,w:3.33,h:0.05, fill:{color:C.GOLD}, line:{color:C.GOLD,width:0} });
  s.addText("Transformando o ensino de Ciências Contábeis\natravés da competição e da prática.", {
    x:2.0,y:4.14,w:9.33,h:1.08, fontSize:16, fontFace:"Calibri", italic:true, color:C.LIGHT, align:"center",valign:"middle",margin:0 });
  s.addShape(pres.shapes.RECTANGLE, { x:3.7,y:5.38,w:5.93,h:0.58, fill:{color:C.BLUE,transparency:83}, line:{color:C.BLUE,transparency:62,width:1} });
  s.addText("Arena Contábil  |  UniFECAF", { x:3.7,y:5.38,w:5.93,h:0.58, fontSize:14, fontFace:"Calibri", bold:true, color:C.WHITE, align:"center",valign:"middle",margin:0 });
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:6.85,w:W,h:0.65, fill:{color:"030B16"}, line:{color:"030B16",width:0} });
  s.addText("Sistema idealizado e desenvolvido por Prof. Ednilson Angelo  |  UniFECAF", {
    x:0.5,y:6.85,w:W-1,h:0.65, fontSize:11, fontFace:"Calibri", color:"475569", align:"center",valign:"middle",margin:0 });
}

// ════════════════════════════════════════════════════════════════════════════
// SAVE
// ════════════════════════════════════════════════════════════════════════════
pres.writeFile({ fileName: "C:/Users/ednil/desafio-cfo/Arena-Contabil-Apresentacao-v2.pptx" })
  .then(() => console.log("Apresentação salva com sucesso!"))
  .catch(err => { console.error("Erro:", err); process.exit(1); });
