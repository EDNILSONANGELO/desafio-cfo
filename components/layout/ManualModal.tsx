"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  ChevronRight,
  Users,
  Building2,
  PlayCircle,
  BarChart3,
  Trophy,
  FileText,
  Calculator,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Settings,
  Lock,
  Zap,
  CheckCircle2,
  Package,
  ShoppingCart,
  CreditCard,
  Download,
} from "lucide-react";
import { generateManualPDF } from "@/lib/utils/manualPdf";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componentes de formatação do manual
// ─────────────────────────────────────────────────────────────────────────────
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-black text-white">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-5 text-sm font-black text-cyan-400 uppercase tracking-wider">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm text-slate-300 leading-relaxed">{children}</p>;
}
function Li({ children }: { children: React.ReactNode }) {
  return <li className="mb-1.5 text-sm text-slate-300 leading-relaxed flex gap-2"><span className="mt-1 text-cyan-400 shrink-0">•</span><span>{children}</span></li>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 space-y-0.5">{children}</ul>;
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
      <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
      <p className="text-xs text-amber-200 leading-relaxed">{children}</p>
    </div>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
      <p className="text-xs text-cyan-200 leading-relaxed">{children}</p>
    </div>
  );
}
function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
      <p className="text-xs text-rose-200 leading-relaxed">{children}</p>
    </div>
  );
}
function Kpi({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="mb-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-xs font-bold text-white">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Seções do Manual do PROFESSOR
// ─────────────────────────────────────────────────────────────────────────────
const PROFESSOR_SECTIONS: Section[] = [
  {
    id: "visao-geral",
    icon: BookOpen,
    title: "Visão Geral do Sistema",
    content: (
      <>
        <H2>Arena Contábil — Business Accounting Simulator</H2>
        <P>
          O <strong className="text-white">Arena Contábil</strong> é um simulador de gestão empresarial
          gamificado voltado para Ciências Contábeis. Os alunos assumem o papel de Gestor Financeiro (Chief Financial
          Officer) da empresa <strong className="text-white">EcoBottle</strong>, produtora de garrafas
          sustentáveis, tomando decisões financeiras e operacionais a cada rodada.
        </P>
        <H3>Como o jogo funciona</H3>
        <Ul>
          <Li>Cada grupo representa uma empresa EcoBottle em uma <strong className="text-white">região diferente</strong> do mercado, com multiplicadores próprios de demanda e custo.</Li>
          <Li>A cada rodada os alunos preenchem decisões de produção, compra de materiais, vendas por região, máquinas, finanças e despesas.</Li>
          <Li>O professor controla o ritmo: cria rodadas, define eventos econômicos, aplica <strong className="text-white">travas</strong> de valores e processa os resultados.</Li>
          <Li>Após o processamento, o sistema calcula automaticamente DRE, BP, Fluxo de Caixa e 13 indicadores financeiros para cada grupo.</Li>
          <Li>Os resultados geram ranking com score ponderado, medalhas e relatórios exportáveis.</Li>
        </Ul>
        <Note>
          A partir da 2ª rodada, o Balanço Patrimonial final de cada rodada vira o <strong className="text-cyan-300">saldo de abertura</strong> da próxima — princípio contábil da continuidade aplicado ao jogo. Estoques de matérias-primas não consumidos também transitam entre rodadas.
        </Note>
        <H3>Fluxo típico de uma rodada</H3>
        <Ul>
          <Li><strong className="text-white">1. Criar rodada</strong> — Menu Rodadas → Nova Rodada.</Li>
          <Li><strong className="text-white">2. Configurar</strong> — evento econômico, travas de despesas/materiais e faixa de preço.</Li>
          <Li><strong className="text-white">3. Abrir</strong> — libera o formulário para os alunos preencherem.</Li>
          <Li><strong className="text-white">4. Acompanhar</strong> — painel de envios em tempo real, com polling automático.</Li>
          <Li><strong className="text-white">5. Encerrar</strong> — bloqueia novos envios.</Li>
          <Li><strong className="text-white">6. Processar</strong> — calcula tudo, gera ranking e medalhas.</Li>
          <Li><strong className="text-white">7. Comentar</strong> — escreva feedback personalizado por grupo.</Li>
        </Ul>
      </>
    ),
  },
  {
    id: "grupos",
    icon: Building2,
    title: "Grupos e Empresas",
    content: (
      <>
        <H2>Gerenciando Grupos e Empresas</H2>
        <P>
          Acesse <strong className="text-white">Menu → Grupos e Empresas</strong>. Cada grupo é uma empresa EcoBottle operando em uma região com características próprias de mercado.
        </P>
        <H3>Criar um grupo</H3>
        <Ul>
          <Li>Preencha o nome do grupo e clique em <strong className="text-white">Criar grupo</strong>.</Li>
          <Li>A região e seus multiplicadores de demanda/custo são atribuídos automaticamente.</Li>
          <Li>Personalize o nome da empresa (ex.: "EcoBottle Norte") — é o nome que aparece no ranking.</Li>
        </Ul>
        <H3>Editar grupo</H3>
        <Ul>
          <Li>Clique no ícone de lápis no card do grupo.</Li>
          <Li>Você pode alterar o nome do grupo e o nome da empresa.</Li>
        </Ul>
        <H3>Excluir grupo</H3>
        <Ul>
          <Li>Clique em <strong className="text-white">Excluir</strong> no card do grupo.</Li>
          <Li>Alunos vinculados ficam sem grupo após a exclusão.</Li>
        </Ul>
        <Warn>
          Exclua grupos somente antes de iniciar as rodadas. Excluir um grupo com resultados processados gera inconsistências nos relatórios.
        </Warn>
        <Tip>
          Crie os grupos antes de cadastrar os alunos — assim você vincula cada aluno ao grupo já no momento do cadastro.
        </Tip>
      </>
    ),
  },
  {
    id: "alunos",
    icon: Users,
    title: "Cadastro de Alunos",
    content: (
      <>
        <H2>Cadastrando e Gerenciando Alunos</H2>
        <P>
          Acesse <strong className="text-white">Menu → Alunos</strong>. O login dos alunos é feito com <strong className="text-white">RA + senha</strong> (sem e-mail). O Dashboard do professor exibe o total de alunos cadastrados no card "Alunos".
        </P>
        <H3>Cadastro individual</H3>
        <Ul>
          <Li>Preencha: RA, Nome, Senha e selecione o Grupo.</Li>
          <Li>A senha pode ser qualquer valor — sugestão: usar o próprio RA como senha inicial.</Li>
          <Li>O aluno pode ser editado posteriormente para trocar de grupo ou redefinir a senha.</Li>
        </Ul>
        <H3>Importação via CSV</H3>
        <Ul>
          <Li>O CSV deve ter colunas: <code className="text-cyan-400">ra, name, password, group_id</code></Li>
          <Li>Clique em <strong className="text-white">Importar CSV</strong> e selecione o arquivo.</Li>
          <Li>O sistema cria todos os alunos em lote automaticamente.</Li>
        </Ul>
        <H3>Trocar grupo de um aluno</H3>
        <Ul>
          <Li>Clique em <strong className="text-white">Editar</strong> no registro do aluno.</Li>
          <Li>Selecione o novo grupo e salve.</Li>
        </Ul>
        <Note>
          Todos os alunos de um mesmo grupo compartilham o formulário e o resultado. Qualquer integrante pode salvar o rascunho; apenas um precisa clicar em "Enviar Rodada".
        </Note>
      </>
    ),
  },
  {
    id: "rodadas",
    icon: PlayCircle,
    title: "Controle de Rodadas",
    content: (
      <>
        <H2>Criando e Controlando Rodadas</H2>
        <P>
          Acesse <strong className="text-white">Menu → Rodadas</strong>. Cada rodada representa um período de gestão da empresa.
        </P>
        <H3>Estados da rodada</H3>
        <Ul>
          <Li><strong className="text-white">Não iniciada</strong> — em configuração; alunos não visualizam.</Li>
          <Li><strong className="text-white">Aberta</strong> — alunos podem preencher e enviar.</Li>
          <Li><strong className="text-white">Encerrada</strong> — novos envios bloqueados; aguardando processamento.</Li>
          <Li><strong className="text-white">Processada</strong> — resultados calculados e visíveis aos alunos.</Li>
        </Ul>
        <H3>Evento econômico</H3>
        <Ul>
          <Li>Aplica multiplicadores de demanda e custo a <strong className="text-white">todos</strong> os grupos simultaneamente.</Li>
          <Li>Exemplos: Mercado normal, Crescimento econômico, Crise, Inflação alta, Alta temporada, Baixa temporada.</Li>
          <Li>Pode ser alterado a qualquer momento antes de processar.</Li>
        </Ul>
        <Tip>
          Mantenha o evento em segredo até processar — os alunos decidem sem saber o cenário exato, aumentando o realismo pedagógico.
        </Tip>
        <H3>Cancelar envio de um grupo</H3>
        <Ul>
          <Li>Na tela de controle da rodada, clique em <strong className="text-white">Cancelar envio</strong> ao lado do grupo.</Li>
          <Li>O grupo volta ao status "Pendente" e pode reenviar.</Li>
        </Ul>
        <H3>Comentários do professor</H3>
        <Ul>
          <Li>Após processar, escreva feedback personalizado para cada grupo no painel de comentários.</Li>
          <Li>Os alunos verão seu comentário na tela de resultados.</Li>
        </Ul>
      </>
    ),
  },
  {
    id: "travas",
    icon: Lock,
    title: "Travas e Configurações",
    content: (
      <>
        <H2>Travando Valores por Rodada</H2>
        <P>
          Na tela de controle de cada rodada, você pode <strong className="text-white">travar valores</strong> que os alunos não poderão alterar, forçando foco em outras variáveis de decisão.
        </P>
        <H3>Despesas operacionais</H3>
        <Ul>
          <Li><strong className="text-white">Despesas Fixas R$</strong> — aluguel, energia, serviços gerais.</Li>
          <Li><strong className="text-white">Transporte R$</strong> — logística de entrega.</Li>
          <Li><strong className="text-white">Manutenção R$</strong> — conservação das máquinas.</Li>
          <Li><strong className="text-white">Salário Médio R$/colab.</strong> — valor pago por colaborador por mês.</Li>
        </Ul>
        <H3>Preços de materiais (novo)</H3>
        <Ul>
          <Li><strong className="text-white">Plástico R$/un.</strong> — preço unitário do plástico.</Li>
          <Li><strong className="text-white">Tampas R$/un.</strong> — preço unitário das tampas.</Li>
          <Li><strong className="text-white">Embalagem R$/un.</strong> — preço unitário da embalagem.</Li>
          <Li><strong className="text-white">Rótulo R$/un.</strong> — preço unitário do rótulo.</Li>
        </Ul>
        <H3>Faixa de preço de venda</H3>
        <Ul>
          <Li>Defina preço mínimo e/ou máximo para os alunos praticarem.</Li>
          <Li>Útil para simular regulação de mercado ou evitar guerra de preços.</Li>
        </Ul>
        <P>
          Deixe o campo <strong className="text-white">em branco</strong> para o aluno definir livremente. Preencha para travar — o campo aparece no formulário do aluno com cadeado 🔒 e fica somente leitura.
        </P>
        <Tip>
          Use travas progressivamente: nas primeiras rodadas, trave tudo para os alunos focarem em produção e preço. Nas rodadas avançadas, libere mais variáveis para uma gestão completa.
        </Tip>
        <Note>
          Para habilitar as travas de preços de materiais, execute a migração SQL <code className="text-cyan-400">003_material_price_locks.sql</code> no Supabase SQL Editor.
        </Note>
      </>
    ),
  },
  {
    id: "processar",
    icon: Zap,
    title: "Processar Rodada",
    content: (
      <>
        <H2>Processando os Resultados da Rodada</H2>
        <P>
          Após encerrar a rodada, clique em <strong className="text-white">PROCESSAR INFORMAÇÕES DA RODADA</strong> na tela de controle.
        </P>
        <H3>O que o processamento calcula</H3>
        <Ul>
          <Li><strong className="text-white">Capacidade efetiva</strong> — fábrica base (2.000 un.) + máquinas acumuladas de rodadas anteriores.</Li>
          <Li><strong className="text-white">Materiais disponíveis</strong> — compras da rodada + saldo de estoque de matérias-primas não consumidas na rodada anterior.</Li>
          <Li><strong className="text-white">Produção efetiva</strong> — mínimo entre: quantidade planejada, capacidade e materiais disponíveis.</Li>
          <Li><strong className="text-white">Demanda</strong> — afetada por preço vs. mercado, marketing, região e evento econômico.</Li>
          <Li><strong className="text-white">Vendas reais</strong> — mínimo entre demanda e produção efetiva.</Li>
          <Li><strong className="text-white">DRE completa</strong> — receita, CMV, salários, armazenagem, EBIT, LAIR, IR (15%), CSLL (9%), lucro líquido.</Li>
          <Li><strong className="text-white">Balanço Patrimonial</strong> — ativo (caixa, duplicatas a receber, estoque, imobilizado), passivo e PL, com saldo de abertura da rodada anterior.</Li>
          <Li><strong className="text-white">Fluxo de Caixa</strong> — FCO (operacional), FCI (investimento em máquinas), FCF (financiamento).</Li>
          <Li><strong className="text-white">13 indicadores</strong> — liquidez, rentabilidade, ciclo financeiro.</Li>
          <Li><strong className="text-white">Ranking + score + medalhas</strong> — posicionamento comparativo entre grupos.</Li>
        </Ul>
        <H3>Empréstimo emergencial automático</H3>
        <P>
          Se uma empresa fechar com caixa negativo, o sistema aciona automaticamente um empréstimo emergencial para cobrir o déficit — com custo adicional. Aparece como alerta vermelho 🚨 no resultado do grupo.
        </P>
        <Warn>
          O processamento pode ser repetido antes de divulgar os resultados. Certifique-se de que evento econômico e travas estão corretos antes de processar definitivamente.
        </Warn>
      </>
    ),
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios e Análises",
    content: (
      <>
        <H2>Relatórios Consolidados</H2>
        <P>
          Acesse <strong className="text-white">Menu → Relatórios</strong> para visão consolidada de todas as rodadas processadas.
        </P>
        <H3>Relatório por rodada</H3>
        <Ul>
          <Li>Selecione a rodada no seletor do topo.</Li>
          <Li>Visualize: ranking completo, gráfico de score, market share, indicadores detalhados, DRE, Fluxo de Caixa e BP de cada empresa.</Li>
          <Li>Exportação em <strong className="text-white">CSV</strong> com todos os dados numéricos.</Li>
        </Ul>
        <H3>Ranking Acumulado</H3>
        <Ul>
          <Li>Soma os scores de todas as rodadas processadas.</Li>
          <Li>Exibe 🥇🥈🥉 para as três melhores empresas no geral.</Li>
          <Li>Reflete <strong className="text-white">consistência ao longo do jogo</strong> — não apenas desempenho pontual.</Li>
        </Ul>
        <H3>Evolução histórica de KPIs</H3>
        <Ul>
          <Li>Disponível com 2 ou mais rodadas processadas.</Li>
          <Li>Selecione o indicador (Score, Lucro, Receita) para ver a evolução de todas as empresas em gráfico de linha.</Li>
        </Ul>
        <H3>Análise automática</H3>
        <Ul>
          <Li>O sistema gera texto de análise por empresa, destacando pontos fortes e fracos de cada rodada com dicas de melhoria.</Li>
        </Ul>
        <Tip>
          Use os relatórios para identificar grupos que produziram muito acima da demanda — eles pagam armazenagem (5% do estoque não vendido) e precisam ajustar a estratégia.
        </Tip>
      </>
    ),
  },
  {
    id: "indicadores",
    icon: TrendingUp,
    title: "Indicadores e Pontuação",
    content: (
      <>
        <H2>Como o Score é Calculado</H2>
        <P>
          O score de cada empresa é calculado com base em 6 indicadores financeiros ponderados (total = 100 pontos):
        </P>
        <div className="space-y-1 mb-4">
          <Kpi label="Liquidez Corrente — 20 pts" desc="AC / PC. Mede capacidade de pagar dívidas de curto prazo. Ideal: acima de 1,5." />
          <Kpi label="Liquidez Seca — 15 pts" desc="(AC − Estoques) / PC. Análise mais conservadora, sem estoques." />
          <Kpi label="Liquidez Imediata — 15 pts" desc="Caixa / PC. Disponibilidade imediata de recursos." />
          <Kpi label="ROA — 25 pts" desc="Lucro Líquido / Ativo Total. Retorno sobre os ativos — maior peso no score." />
          <Kpi label="Margem Líquida — 15 pts" desc="Lucro Líquido / Receita. % do faturamento que vira lucro." />
          <Kpi label="Ciclo Financeiro — 10 pts" desc="PME + PMR − PMP. Quanto menor, melhor gestão do capital de giro." />
        </div>
        <H3>Classificação (Grade)</H3>
        <Ul>
          <Li><strong className="text-emerald-400">AAA (≥ 75 pts)</strong> — Excelente</Li>
          <Li><strong className="text-cyan-400">AA (≥ 60 pts)</strong> — Muito Bom</Li>
          <Li><strong className="text-sky-400">A (≥ 45 pts)</strong> — Bom</Li>
          <Li><strong className="text-amber-400">B (≥ 30 pts)</strong> — Regular</Li>
          <Li><strong className="text-orange-400">C (≥ 15 pts)</strong> — Fraco</Li>
          <Li><strong className="text-rose-400">D (&lt; 15 pts)</strong> — Crítico</Li>
        </Ul>
        <H3>Medalhas por rodada</H3>
        <Ul>
          <Li>🏆 <strong className="text-white">Melhor Gestor</strong> — maior score geral da rodada.</Li>
          <Li>💧 <strong className="text-white">Melhor Liquidez</strong> — maior liquidez corrente.</Li>
          <Li>📈 <strong className="text-white">Melhor ROA</strong> — maior retorno sobre ativos.</Li>
          <Li>💰 <strong className="text-white">Melhor Margem</strong> — maior margem líquida.</Li>
          <Li>⚡ <strong className="text-white">Ciclo mais Eficiente</strong> — menor ciclo financeiro.</Li>
          <Li>👑 <strong className="text-white">Maior Receita</strong> — maior receita líquida da rodada.</Li>
        </Ul>
      </>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seções do Manual do ALUNO
// ─────────────────────────────────────────────────────────────────────────────
const STUDENT_SECTIONS: Section[] = [
  {
    id: "introducao",
    icon: BookOpen,
    title: "O que é o Arena Contábil",
    content: (
      <>
        <H2>Bem-vindo ao Arena Contábil!</H2>
        <P>
          Você é o <strong className="text-white">Gestor Financeiro</strong> da{" "}
          <strong className="text-white">EcoBottle</strong>, empresa produtora de garrafas sustentáveis.
          Junto com seu grupo, você toma decisões financeiras e operacionais a cada rodada,
          competindo com os outros grupos da turma.
        </P>
        <H3>Objetivo do jogo</H3>
        <Ul>
          <Li>Maximizar o <strong className="text-white">lucro líquido</strong> e os indicadores financeiros da sua empresa.</Li>
          <Li>Manter boa <strong className="text-white">liquidez</strong> — capacidade de pagar suas dívidas.</Li>
          <Li>Gerir bem o <strong className="text-white">capital de giro</strong> — ciclo financeiro curto.</Li>
          <Li>Subir no <strong className="text-white">ranking</strong> acumulado ao longo das rodadas.</Li>
        </Ul>
        <H3>Como funciona uma rodada</H3>
        <Ul>
          <Li>O professor <strong className="text-white">abre a rodada</strong> — você acessa o formulário.</Li>
          <Li>Seu grupo <strong className="text-white">preenche as decisões</strong> e salva o rascunho.</Li>
          <Li>Um integrante <strong className="text-white">envia a rodada</strong> — o formulário fica bloqueado para todos.</Li>
          <Li>O professor <strong className="text-white">processa</strong> — você vê DRE, BP, Fluxo de Caixa e ranking.</Li>
          <Li>O saldo final desta rodada vira o <strong className="text-white">saldo de abertura</strong> da próxima (carryover).</Li>
        </Ul>
        <Note>
          Qualquer integrante pode salvar o rascunho. Apenas um precisa clicar em "ENVIAR RODADA" — depois disso, ninguém mais consegue alterar.
        </Note>
      </>
    ),
  },
  {
    id: "formulario",
    icon: Calculator,
    title: "Preenchendo o Formulário",
    content: (
      <>
        <H2>Como Preencher o Formulário da Rodada</H2>
        <P>
          Acesse <strong className="text-white">Menu → Rodada Atual</strong>. Acima do formulário você verá o <strong className="text-white">Saldo de Abertura</strong> — caixa, duplicatas a receber, estoque, imobilizado, empréstimos e PL herdados da rodada anterior.
        </P>
        <H3>1. Produção</H3>
        <Ul>
          <Li><strong className="text-white">Qtd. a produzir</strong> — quantas unidades a fábrica tentará produzir.</Li>
          <Li><strong className="text-white">Capacidade produtiva</strong> — calculada automaticamente: 2.000 unidades base + capacidade acumulada das máquinas compradas.</Li>
          <Li><strong className="text-white">Colaboradores</strong> — número de trabalhadores na produção.</Li>
          <Li><strong className="text-white">Salário médio R$/colab.</strong> — valor pago por colaborador por mês.</Li>
        </Ul>
        <Tip>
          A produção real é o menor valor entre: quantidade planejada, capacidade da fábrica e materiais disponíveis. Planejar com folga evita gargalos de produção!
        </Tip>
        <H3>2. Compra de Materiais</H3>
        <Ul>
          <Li>Cada produto requer 1 unidade de cada material: plástico, tampa, embalagem e rótulo.</Li>
          <Li>Se sobrou material da rodada anterior, o sistema exibe o <strong className="text-white">saldo do estoque anterior</strong> e já considera esse estoque na produção — você só precisa comprar o que falta.</Li>
          <Li>Se o professor travou o preço unitário (🔒), o campo aparece fixo e não pode ser alterado.</Li>
        </Ul>
        <H3>3. Compra de Máquinas</H3>
        <Ul>
          <Li><strong className="text-white">Máquina Pequena</strong> — R$ 20.000 → +10.000 unidades de capacidade.</Li>
          <Li><strong className="text-white">Máquina Média</strong> — R$ 40.000 → +20.000 unidades de capacidade.</Li>
          <Li><strong className="text-white">Máquina Grande</strong> — R$ 80.000 → +60.000 unidades de capacidade.</Li>
          <Li>Você pode comprar qualquer combinação e quantidade de máquinas.</Li>
          <Li><strong className="text-white">À vista (15 dias)</strong> — paga o valor total no caixa desta rodada.</Li>
          <Li><strong className="text-white">3× parcelado</strong> — 1/3 pago agora + 2/3 com juros de 2% a.m. nas próximas rodadas.</Li>
        </Ul>
        <Note>
          A capacidade das máquinas é acumulada entre rodadas. Uma máquina comprada na Rodada 1 continua aumentando sua capacidade na Rodada 2, 3 e assim por diante.
        </Note>
        <H3>4. Vendas por Região</H3>
        <Ul>
          <Li>A tabela de vendas mostra as <strong className="text-white">regiões como colunas</strong> e os campos (Vender?, Quantidade, Preço) como linhas — marque apenas as regiões onde deseja vender.</Li>
          <Li>Defina quantidade e preço de venda para cada região ativa.</Li>
          <Li>Se o professor definiu faixa de preço, campos fora da faixa ficam destacados em vermelho.</Li>
          <Li><strong className="text-white">Marketing R$</strong> — investimento para ampliar a demanda da sua empresa.</Li>
          <Li><strong className="text-white">Prazo de recebimento</strong> — quanto maior, mais dinheiro vai para "Duplicatas a Receber" no ativo circulante (e menos no caixa).</Li>
        </Ul>
        <H3>5. Gestão Financeira</H3>
        <Ul>
          <Li><strong className="text-white">Empréstimo R$</strong> — valor captado; entra no caixa mas gera despesa financeira.</Li>
          <Li><strong className="text-white">Prazo com fornecedores</strong> — quanto maior, mais prazo para pagar (melhora o caixa de curto prazo).</Li>
        </Ul>
        <H3>6. Despesas Operacionais</H3>
        <Ul>
          <Li>Despesas Fixas, Transporte e Manutenção — custos recorrentes da operação.</Li>
          <Li>Campos travados pelo professor (🔒) aparecem com valor fixo e não podem ser alterados.</Li>
        </Ul>
        <Warn>
          Se aparecerem <strong className="text-white">Inconsistências</strong> abaixo do formulário, revise seus dados antes de enviar — ex.: produzir mais do que a capacidade, ou materiais insuficientes.
        </Warn>
      </>
    ),
  },
  {
    id: "maquinas",
    icon: Package,
    title: "Compra de Máquinas",
    content: (
      <>
        <H2>Investindo em Capacidade Produtiva</H2>
        <P>
          Comprar máquinas é a única forma de aumentar a capacidade da sua fábrica além das 2.000 unidades base. O investimento é registrado no <strong className="text-white">Ativo Imobilizado</strong> e depreciado ao longo de 60 meses.
        </P>
        <H3>Catálogo de Máquinas</H3>
        <div className="space-y-2 mb-4">
          <Kpi label="⚙️ Máquina Pequena — R$ 20.000" desc="+10.000 unidades de capacidade produtiva por rodada." />
          <Kpi label="🏭 Máquina Média — R$ 40.000" desc="+20.000 unidades de capacidade produtiva por rodada." />
          <Kpi label="🏗️ Máquina Grande — R$ 80.000" desc="+60.000 unidades de capacidade produtiva por rodada." />
        </div>
        <H3>Formas de pagamento</H3>
        <Ul>
          <Li><strong className="text-white">À vista (15 dias)</strong> — valor total sai do caixa nesta rodada. Sem juros.</Li>
          <Li><strong className="text-white">3× parcelado</strong> — 1/3 pago agora; restante em 2 parcelas com juros de 2% a.m. Gera "Financiamento de máquinas" no Passivo Circulante.</Li>
        </Ul>
        <H3>Acumulação de capacidade</H3>
        <Ul>
          <Li>A capacidade das máquinas <strong className="text-white">acumula entre rodadas</strong> via carryover.</Li>
          <Li>Capacidade efetiva = 2.000 (base) + total de capacidade acumulada de todas as máquinas compradas até agora.</Li>
          <Li>O painel de capacidade no formulário mostra: Base / Máquinas acumuladas / Total.</Li>
        </Ul>
        <Tip>
          Comprar uma Máquina Grande parcelada pode ser mais vantajoso financeiramente: você preserva o caixa agora e paga com a receita futura gerada pela maior produção.
        </Tip>
        <Warn>
          Certifique-se de ter caixa suficiente para o pagamento à vista (ou a entrada de 1/3 no parcelado). Se o caixa ficar negativo, um empréstimo emergencial será acionado automaticamente.
        </Warn>
      </>
    ),
  },
  {
    id: "materiais",
    icon: ShoppingCart,
    title: "Materiais e Estoque",
    content: (
      <>
        <H2>Compra de Matérias-Primas e Estoque</H2>
        <P>
          Cada unidade produzida consome 1 unidade de cada matéria-prima: <strong className="text-white">plástico, tampas, embalagem e rótulo</strong>.
        </P>
        <H3>Estoque de matérias-primas (carryover)</H3>
        <Ul>
          <Li>Se sobrou material da rodada anterior, o sistema mostra o <strong className="text-white">saldo disponível</strong> em cada campo.</Li>
          <Li>Esses materiais já estão disponíveis para produção — você só compra o complemento necessário.</Li>
          <Li>Exemplo: sobrou 500 unidades de plástico e você quer produzir 1.000 → compre apenas 500 unidades de plástico.</Li>
        </Ul>
        <H3>Preços travados pelo professor</H3>
        <Ul>
          <Li>Se o professor definiu o preço unitário de um material, o campo aparece com cadeado 🔒 e não pode ser editado.</Li>
          <Li>Isso garante que todos os grupos paguem o mesmo preço pelo material, focando a competição em outras variáveis.</Li>
        </Ul>
        <H3>Como planejar as compras</H3>
        <Ul>
          <Li>Compre pelo menos a mesma quantidade que pretende produzir (descontando o estoque existente).</Li>
          <Li>Comprar a menos que a produção planejada limita a produção efetiva.</Li>
          <Li>Comprar a mais gera sobra — o excedente vai para o estoque da próxima rodada.</Li>
        </Ul>
        <Tip>
          Gerenciar bem o estoque de materiais evita desperdício de capital de giro. Compre próximo do necessário — excesso de material parado representa caixa imobilizado sem retorno imediato.
        </Tip>
      </>
    ),
  },
  {
    id: "estrategia",
    icon: Lightbulb,
    title: "Estratégias e Dicas",
    content: (
      <>
        <H2>Dicas Estratégicas para o Gestor</H2>
        <H3>Precificação</H3>
        <Ul>
          <Li>Preço <strong className="text-white">abaixo da média do mercado</strong> → mais demanda, mas margem menor.</Li>
          <Li>Preço <strong className="text-white">acima da média</strong> → menos demanda, mas margem maior.</Li>
          <Li>Encontre o equilíbrio: preço que maximiza receita sem perder volume de vendas.</Li>
        </Ul>
        <H3>Produção e Estoque</H3>
        <Ul>
          <Li>Produza próximo da demanda esperada — estoque de produto acabado gera custo de armazenagem de 5%.</Li>
          <Li>Se a demanda for maior que a produção, você perde vendas para a concorrência.</Li>
          <Li>Considere o saldo de materiais do período anterior antes de comprar novos insumos.</Li>
        </Ul>
        <H3>Investimento em máquinas</H3>
        <Ul>
          <Li>Máquinas aumentam a capacidade permanentemente — planeje o crescimento progressivo.</Li>
          <Li>Se sua produção está travada pela capacidade, investir em máquinas é prioritário.</Li>
          <Li>Use o parcelamento em 3× para preservar o caixa quando o investimento for grande.</Li>
        </Ul>
        <Warn>
          Se seu caixa projetado ficar negativo, o sistema ativa automaticamente um <strong className="text-white">empréstimo emergencial</strong>. Isso aumenta o passivo e reduz os indicadores de liquidez. Planeje o caixa com cuidado!
        </Warn>
        <H3>Liquidez</H3>
        <Ul>
          <Li>Mantenha <strong className="text-white">Liquidez Corrente acima de 1,5</strong> — garante capacidade de pagar dívidas de curto prazo.</Li>
          <Li>Evite empréstimos excessivos — aumentam o passivo circulante e reduzem a liquidez.</Li>
          <Li>Prazo de recebimento curto + prazo com fornecedor longo = melhor gestão do caixa.</Li>
        </Ul>
        <H3>Marketing</H3>
        <Ul>
          <Li>Marketing aumenta a demanda (até +45% com investimento máximo).</Li>
          <Li>O retorno é <strong className="text-white">decrescente</strong>: R$ 0→10k tem muito impacto; acima de R$ 30k o ganho marginal é pequeno.</Li>
        </Ul>
        <H3>Ciclo Financeiro</H3>
        <Ul>
          <Li>PME (estocagem) + PMR (recebimento) − PMP (pagamento) = Ciclo Financeiro.</Li>
          <Li><strong className="text-white">Ciclo menor = melhor.</strong> Ciclo negativo significa que você recebe antes de pagar os fornecedores!</Li>
        </Ul>
        <Tip>
          Nas primeiras rodadas, foque em entender as métricas. Nas rodadas seguintes, ajuste a estratégia com base nos resultados anteriores — o BP da rodada passada é seu ponto de partida!
        </Tip>
      </>
    ),
  },
  {
    id: "resultados",
    icon: BarChart3,
    title: "Entendendo os Resultados",
    content: (
      <>
        <H2>Interpretando os Resultados</H2>
        <P>
          Após o professor processar, acesse <strong className="text-white">Menu → Resultados</strong>.
        </P>
        <H3>DRE — Demonstração do Resultado do Exercício</H3>
        <Ul>
          <Li><strong className="text-white">Receita Líquida</strong> = unidades vendidas × preço × (1 − desconto%).</Li>
          <Li><strong className="text-white">CMV</strong> = custo unitário de produção × unidades vendidas + depreciação.</Li>
          <Li><strong className="text-white">Lucro Bruto</strong> = Receita Líquida − CMV.</Li>
          <Li><strong className="text-white">Despesas Operacionais</strong> = salários + marketing + fixas + transporte + manutenção + armazenagem.</Li>
          <Li><strong className="text-white">EBIT</strong> = Lucro Bruto − Despesas Operacionais.</Li>
          <Li><strong className="text-white">LAIR</strong> = EBIT − Despesa Financeira (juros dos empréstimos).</Li>
          <Li><strong className="text-white">Lucro Líquido</strong> = LAIR − IR (15%) − CSLL (9%).</Li>
        </Ul>
        <H3>Balanço Patrimonial</H3>
        <Ul>
          <Li><strong className="text-white">Ativo Circulante</strong> = caixa + duplicatas a receber + estoques.</Li>
          <Li><strong className="text-white">Ativo Não Circulante</strong> = imobilizado (máquinas acumuladas − depreciação).</Li>
          <Li><strong className="text-white">Passivo Circulante</strong> = fornecedores + empréstimos CP + financiamento de máquinas.</Li>
          <Li><strong className="text-white">Patrimônio Líquido</strong> = capital social + resultado acumulado.</Li>
        </Ul>
        <Note>
          Equação fundamental sempre verificada: <strong className="text-cyan-400">Ativo Total = Passivo Total + Patrimônio Líquido</strong>
        </Note>
        <H3>Fluxo de Caixa</H3>
        <Ul>
          <Li><strong className="text-white">FCO</strong> — fluxo das atividades operacionais (recebimentos − pagamentos do dia a dia).</Li>
          <Li><strong className="text-white">FCI</strong> — fluxo de investimentos (pagamento de máquinas).</Li>
          <Li><strong className="text-white">FCF</strong> — fluxo de financiamento (empréstimos captados).</Li>
        </Ul>
        <H3>Feedback automático e evolução histórica</H3>
        <Ul>
          <Li>O sistema gera análise automática destacando pontos fortes e fracos com dicas de melhoria.</Li>
          <Li>Com 2+ rodadas processadas, aparece gráfico de evolução do score, lucro e receita ao longo do jogo.</Li>
        </Ul>
      </>
    ),
  },
  {
    id: "indicadores",
    icon: TrendingUp,
    title: "Indicadores Financeiros",
    content: (
      <>
        <H2>Os 13 Indicadores do Arena Contábil</H2>
        <H3>Liquidez</H3>
        <Kpi label="Liquidez Corrente = AC / PC" desc="Ideal > 1,5. Capacidade de pagar dívidas de curto prazo com ativos circulantes." />
        <Kpi label="Liquidez Seca = (AC − Estoques) / PC" desc="Ideal > 1,0. Exclui estoques. Análise mais conservadora da liquidez." />
        <Kpi label="Liquidez Imediata = Caixa / PC" desc="Ideal > 0,3. % do passivo circulante coberto pelo caixa disponível imediatamente." />
        <H3>Rentabilidade</H3>
        <Kpi label="Margem Bruta = Lucro Bruto / Receita × 100" desc="% do faturamento que sobra após o custo de produção (CMV)." />
        <Kpi label="Margem Operacional = EBIT / Receita × 100" desc="% que vira lucro operacional antes de juros e impostos." />
        <Kpi label="Margem Líquida = Lucro Líquido / Receita × 100" desc="% que vira lucro após todos os custos, despesas e impostos." />
        <Kpi label="ROA = Lucro Líquido / Ativo Total × 100" desc="Retorno gerado pelos ativos totais. Maior peso no score (25 pts)." />
        <Kpi label="ROE = Lucro Líquido / PL × 100" desc="Retorno sobre o capital dos sócios. Quanto maior, melhor." />
        <H3>Ciclo Operacional e Financeiro</H3>
        <Kpi label="PME = (Estoque / CMV) × 30" desc="Prazo Médio de Estocagem — dias que o produto fica parado no estoque." />
        <Kpi label="PMR = (Duplicatas a Receber / Receita) × 30" desc="Prazo Médio de Recebimento — dias para receber dos clientes." />
        <Kpi label="PMP = (Fornecedores / Compras) × 30" desc="Prazo Médio de Pagamento — dias para pagar os fornecedores." />
        <Kpi label="Ciclo Financeiro = PME + PMR − PMP" desc="Quanto menor (ou negativo), melhor a gestão do capital de giro." />
        <H3>Compras</H3>
        <Kpi label="Compras = CMV + Estoque Final − Estoque Inicial" desc="Volume total de compras do período pela fórmula contábil." />
      </>
    ),
  },
  {
    id: "ranking",
    icon: Trophy,
    title: "Ranking e Medalhas",
    content: (
      <>
        <H2>Como Funciona o Ranking</H2>
        <P>
          O score de cada empresa é calculado com 6 indicadores ponderados (máx. 100 pontos):
        </P>
        <Ul>
          <Li><strong className="text-white">Liquidez Corrente</strong> — 20 pontos</Li>
          <Li><strong className="text-white">Liquidez Seca</strong> — 15 pontos</Li>
          <Li><strong className="text-white">Liquidez Imediata</strong> — 15 pontos</Li>
          <Li><strong className="text-white">ROA</strong> — 25 pontos (maior peso!)</Li>
          <Li><strong className="text-white">Margem Líquida</strong> — 15 pontos</Li>
          <Li><strong className="text-white">Ciclo Financeiro</strong> — 10 pontos</Li>
        </Ul>
        <H3>Ranking Acumulado</H3>
        <P>
          Os scores de todas as rodadas são somados. Quem for <strong className="text-white">consistente</strong> ao longo do jogo vence o Arena Contábil!
        </P>
        <H3>Medalhas disponíveis por rodada</H3>
        <Ul>
          <Li>🏆 <strong className="text-white">Melhor Gestor</strong> — maior score geral da rodada.</Li>
          <Li>💧 <strong className="text-white">Melhor Liquidez</strong> — maior liquidez corrente.</Li>
          <Li>📈 <strong className="text-white">Melhor ROA</strong> — maior retorno sobre ativos.</Li>
          <Li>💰 <strong className="text-white">Melhor Margem</strong> — maior margem líquida.</Li>
          <Li>⚡ <strong className="text-white">Ciclo mais Eficiente</strong> — menor ciclo financeiro.</Li>
          <Li>👑 <strong className="text-white">Maior Receita</strong> — maior receita líquida da rodada.</Li>
        </Ul>
        <Tip>
          Mesmo sem liderar o ranking geral, você pode ganhar medalhas por excelência em indicadores específicos. Identifique seu ponto forte e domine-o!
        </Tip>
      </>
    ),
  },
  {
    id: "glossario",
    icon: FileText,
    title: "Glossário Contábil",
    content: (
      <>
        <H2>Glossário de Termos Contábeis</H2>
        <div className="space-y-2">
          {[
            ["Ativo", "Tudo que a empresa possui: caixa, duplicatas a receber, estoques, máquinas."],
            ["Passivo", "Tudo que a empresa deve: fornecedores, empréstimos, financiamento de máquinas."],
            ["Patrimônio Líquido (PL)", "Capital dos sócios = Ativo − Passivo. O 'valor líquido' da empresa."],
            ["CMV", "Custo das Mercadorias Vendidas — custo unitário de produção × unidades vendidas."],
            ["EBIT", "Earnings Before Interest & Taxes — Lucro Operacional antes de juros e impostos."],
            ["LAIR", "Lucro Antes do Imposto de Renda — após deduzir as despesas financeiras (juros)."],
            ["IR", "Imposto de Renda — 15% sobre o LAIR positivo."],
            ["CSLL", "Contribuição Social sobre o Lucro Líquido — 9% sobre o LAIR positivo."],
            ["Depreciação", "Perda de valor do imobilizado no tempo — 1/60 do investimento em máquinas por mês."],
            ["Capital de Giro", "Recursos para financiar o ciclo operacional: produzir → vender → receber."],
            ["Market Share", "% da receita da empresa sobre o total faturado por todos os grupos na rodada."],
            ["Carryover", "Continuidade contábil — BP final de uma rodada vira saldo de abertura da próxima."],
            ["Armazenagem", "Custo de 5% do valor do estoque de produto acabado não vendido na rodada."],
            ["Empréstimo Emergencial", "Acionado automaticamente quando o caixa fecha negativo — cobre o déficit com custo adicional."],
          ].map(([term, def]) => (
            <div key={term} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs font-bold text-cyan-400">{term}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{def}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  role: "teacher" | "student";
}

export function ManualButton({ role }: Props) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const sections = role === "teacher" ? PROFESSOR_SECTIONS : STUDENT_SECTIONS;
  const [activeId, setActiveId] = useState(sections[0].id);
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];
  const title = role === "teacher" ? "Manual do Professor" : "Manual do Aluno";

  async function handleDownload() {
    setDownloading(true);
    try {
      await generateManualPDF(role);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      {/* Botão no TopBar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-400 transition-all hover:bg-cyan-400/20 hover:border-cyan-400/50"
        title={title}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Manual</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col bg-slate-900 shadow-2xl border-l border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/20 border border-cyan-400/30">
                    <BookOpen className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">{title}</h2>
                    <p className="text-xs text-slate-400">Arena Contábil — Business Accounting Simulator</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar de navegação */}
                <nav className="w-52 shrink-0 overflow-y-auto border-r border-white/10 bg-white/[0.02] py-3">
                  {sections.map((s) => {
                    const Icon = s.icon;
                    const active = s.id === activeId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveId(s.id)}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs transition-all ${
                          active
                            ? "bg-cyan-400/10 border-r-2 border-cyan-400 text-cyan-400 font-bold"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="leading-tight">{s.title}</span>
                        {active && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </nav>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {activeSection.content}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 flex items-center gap-3 border-t border-white/10 px-6 py-3 bg-white/[0.02]">
                <p className="text-[11px] text-slate-500">
                  Seção {sections.findIndex((s) => s.id === activeId) + 1} de {sections.length}
                </p>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-400 transition hover:bg-cyan-400/20 disabled:opacity-50"
                  title="Baixar manual em PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloading ? "Gerando PDF…" : "Baixar PDF"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
