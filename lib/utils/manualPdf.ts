/**
 * Gerador de PDF do Manual — Arena Contábil
 * Usa jsPDF para gerar um documento formatado em português.
 */

// ─── Dados textuais dos manuais ────────────────────────────────────────────

export interface PdfBlock {
  type: "h1" | "h2" | "h3" | "body" | "bullet" | "tip" | "note" | "warn" | "kpi" | "spacer" | "divider";
  text?: string;
  sub?: string; // para kpi
}

export interface PdfSection {
  title: string;
  blocks: PdfBlock[];
}

export const PROFESSOR_PDF: PdfSection[] = [
  {
    title: "1. Visão Geral do Sistema",
    blocks: [
      { type: "h2", text: "Arena Contábil — Business Accounting Simulator" },
      { type: "body", text: "O Arena Contábil é um simulador de gestão empresarial gamificado voltado para Ciências Contábeis. Os alunos assumem o papel de Gestor Financeiro da EcoBottle, produtora de garrafas sustentáveis, tomando decisões financeiras e operacionais a cada rodada." },
      { type: "h3", text: "Como o jogo funciona" },
      { type: "bullet", text: "Cada grupo representa uma empresa EcoBottle em uma região diferente, com multiplicadores próprios de demanda e custo." },
      { type: "bullet", text: "A cada rodada os alunos preenchem decisões de produção, compra de materiais e máquinas, vendas por região, finanças e despesas." },
      { type: "bullet", text: "O professor controla o ritmo: cria rodadas, define eventos econômicos, aplica travas e processa os resultados." },
      { type: "bullet", text: "O sistema calcula automaticamente DRE, Balanço Patrimonial, Fluxo de Caixa e 13 indicadores financeiros para cada grupo." },
      { type: "bullet", text: "Os resultados geram ranking com score ponderado, medalhas e relatórios exportáveis." },
      { type: "note", text: "A partir da 2ª rodada, o BP final de uma rodada torna-se o saldo de abertura da próxima. Estoques de matérias-primas não consumidos também transitam entre rodadas (carryover)." },
      { type: "h3", text: "Fluxo típico de uma rodada" },
      { type: "bullet", text: "1. Criar rodada — Menu Rodadas → Nova Rodada." },
      { type: "bullet", text: "2. Configurar — evento econômico, travas de despesas/materiais e faixa de preço." },
      { type: "bullet", text: "3. Abrir — libera o formulário para os alunos." },
      { type: "bullet", text: "4. Acompanhar — painel de envios com polling automático a cada 15 segundos." },
      { type: "bullet", text: "5. Encerrar — bloqueia novos envios." },
      { type: "bullet", text: "6. Processar — calcula tudo, gera ranking e medalhas." },
      { type: "bullet", text: "7. Comentar — escreva feedback personalizado por grupo." },
    ],
  },
  {
    title: "2. Grupos e Empresas",
    blocks: [
      { type: "h2", text: "Gerenciando Grupos e Empresas" },
      { type: "body", text: "Acesse Menu → Grupos e Empresas. Cada grupo é uma empresa EcoBottle operando em uma região com características próprias de mercado." },
      { type: "h3", text: "Criar um grupo" },
      { type: "bullet", text: "Preencha o nome do grupo e clique em Criar grupo." },
      { type: "bullet", text: "A região e seus multiplicadores são atribuídos automaticamente." },
      { type: "bullet", text: "Personalize o nome da empresa — é o nome exibido no ranking." },
      { type: "h3", text: "Editar grupo" },
      { type: "bullet", text: "Clique no ícone de lápis no card do grupo." },
      { type: "bullet", text: "Edite o nome do grupo e/ou o nome da empresa." },
      { type: "h3", text: "Excluir grupo" },
      { type: "bullet", text: "Clique em Excluir no card do grupo." },
      { type: "bullet", text: "Alunos vinculados ficam sem grupo após a exclusão." },
      { type: "warn", text: "Exclua grupos somente antes de iniciar as rodadas. Excluir com resultados processados gera inconsistências." },
      { type: "tip", text: "Crie os grupos antes de cadastrar os alunos — assim você vincula cada aluno ao grupo já no momento do cadastro." },
    ],
  },
  {
    title: "3. Cadastro de Alunos",
    blocks: [
      { type: "h2", text: "Cadastrando e Gerenciando Alunos" },
      { type: "body", text: "Acesse Menu → Alunos. O login é feito com RA + senha. O Dashboard exibe o total de alunos cadastrados no card 'Alunos'." },
      { type: "h3", text: "Cadastro individual" },
      { type: "bullet", text: "Preencha: RA, Nome, Senha e selecione o Grupo." },
      { type: "bullet", text: "Sugestão: usar o próprio RA como senha inicial." },
      { type: "bullet", text: "O aluno pode ser editado depois para trocar de grupo ou redefinir a senha." },
      { type: "h3", text: "Importação via CSV" },
      { type: "bullet", text: "O CSV deve ter colunas: ra, name, password, group_id" },
      { type: "bullet", text: "Clique em Importar CSV e selecione o arquivo — o sistema cria em lote." },
      { type: "h3", text: "Trocar grupo de um aluno" },
      { type: "bullet", text: "Clique em Editar no registro do aluno, selecione o novo grupo e salve." },
      { type: "note", text: "Todos os alunos de um grupo compartilham o formulário e o resultado. Qualquer integrante pode salvar o rascunho; apenas um precisa enviar." },
    ],
  },
  {
    title: "4. Controle de Rodadas",
    blocks: [
      { type: "h2", text: "Criando e Controlando Rodadas" },
      { type: "body", text: "Acesse Menu → Rodadas. Cada rodada representa um período de gestão da empresa." },
      { type: "h3", text: "Estados da rodada" },
      { type: "bullet", text: "Não iniciada — em configuração; alunos não visualizam." },
      { type: "bullet", text: "Aberta — alunos podem preencher e enviar." },
      { type: "bullet", text: "Encerrada — novos envios bloqueados; aguardando processamento." },
      { type: "bullet", text: "Processada — resultados calculados e visíveis aos alunos." },
      { type: "h3", text: "Eventos econômicos disponíveis" },
      { type: "bullet", text: "Mercado normal · Crescimento econômico (+10% demanda) · Crise econômica (-15%)" },
      { type: "bullet", text: "Inflação alta (-6% demanda, +10% custos) · Incentivo fiscal (+6%)" },
      { type: "bullet", text: "Alta temporada (+50% demanda) · Baixa temporada (-30% demanda)" },
      { type: "bullet", text: "Lançamento de produto (+25%) · Concorrência externa (-10%)" },
      { type: "bullet", text: "Regulação ambiental (+15% custos) · Campanha de sustentabilidade (+12%)" },
      { type: "tip", text: "Mantenha o evento em segredo até processar — os alunos decidem sem saber o cenário exato, aumentando o realismo pedagógico." },
      { type: "h3", text: "Cancelar envio de um grupo" },
      { type: "bullet", text: "Na tela de controle, clique em Cancelar envio ao lado do grupo." },
      { type: "bullet", text: "O grupo volta ao status Pendente e pode reenviar." },
    ],
  },
  {
    title: "5. Travas e Configurações",
    blocks: [
      { type: "h2", text: "Travando Valores por Rodada" },
      { type: "body", text: "Na tela de controle de cada rodada você pode travar valores que os alunos não poderão alterar, forçando foco em outras variáveis de decisão." },
      { type: "h3", text: "Despesas operacionais" },
      { type: "bullet", text: "Despesas Fixas R$ — aluguel, energia, serviços gerais." },
      { type: "bullet", text: "Transporte R$ — logística de entrega." },
      { type: "bullet", text: "Manutenção R$ — conservação das máquinas." },
      { type: "bullet", text: "Salário Médio R$/colab. — valor pago por colaborador por mês." },
      { type: "h3", text: "Preços de materiais (novo)" },
      { type: "bullet", text: "Plastico R$/un. — preço unitário do plástico." },
      { type: "bullet", text: "Tampas R$/un. — preço unitário das tampas." },
      { type: "bullet", text: "Embalagem R$/un. — preço unitário da embalagem." },
      { type: "bullet", text: "Rótulo R$/un. — preço unitário do rótulo." },
      { type: "h3", text: "Faixa de preço de venda" },
      { type: "bullet", text: "Defina preço mínimo e/ou máximo para os alunos praticarem." },
      { type: "bullet", text: "Útil para simular regulação de mercado ou evitar guerra de preços." },
      { type: "body", text: "Deixe o campo em branco para o aluno definir livremente. Preencha para travar — o campo aparece no formulário com cadeado." },
      { type: "note", text: "Para habilitar as travas de preços de materiais, execute a migração SQL 003_material_price_locks.sql no Supabase SQL Editor." },
      { type: "tip", text: "Use travas progressivamente: nas primeiras rodadas, trave tudo para os alunos focarem em produção e preço. Nas avançadas, libere mais variáveis." },
    ],
  },
  {
    title: "6. Processando a Rodada",
    blocks: [
      { type: "h2", text: "Processando os Resultados da Rodada" },
      { type: "body", text: "Após encerrar a rodada, clique em PROCESSAR INFORMAÇÕES DA RODADA na tela de controle." },
      { type: "h3", text: "O que o processamento calcula" },
      { type: "bullet", text: "Capacidade efetiva — fábrica base (2.000 un.) + máquinas acumuladas de rodadas anteriores." },
      { type: "bullet", text: "Materiais disponíveis — compras da rodada + saldo de matérias-primas da rodada anterior." },
      { type: "bullet", text: "Produção efetiva — mínimo entre: quantidade planejada, capacidade e materiais disponíveis." },
      { type: "bullet", text: "Demanda — afetada por preço vs. mercado, marketing, região e evento econômico." },
      { type: "bullet", text: "Vendas reais — mínimo entre demanda e produção efetiva." },
      { type: "bullet", text: "DRE completa — receita, CMV, salários, armazenagem, EBIT, LAIR, IR (15%), CSLL (9%), lucro líquido." },
      { type: "bullet", text: "Balanço Patrimonial — ativo, passivo e PL, com saldo de abertura da rodada anterior." },
      { type: "bullet", text: "Fluxo de Caixa — FCO (operacional), FCI (máquinas), FCF (financiamento)." },
      { type: "bullet", text: "13 indicadores — liquidez, rentabilidade, ciclo financeiro." },
      { type: "bullet", text: "Ranking, score ponderado, market share e medalhas." },
      { type: "h3", text: "Empréstimo emergencial automático" },
      { type: "body", text: "Se uma empresa fechar com caixa negativo, o sistema aciona automaticamente um empréstimo emergencial para cobrir o déficit — com custo adicional. Aparece como alerta vermelho no resultado do grupo." },
      { type: "h3", text: "Comentários por grupo" },
      { type: "body", text: "Após processar, use o painel Comentários do Professor para escrever feedback personalizado. Os alunos verão o comentário na tela de resultados." },
      { type: "warn", text: "O processamento pode ser repetido antes de divulgar os resultados. Certifique-se de que evento e travas estão corretos antes de processar definitivamente." },
    ],
  },
  {
    title: "7. Relatórios e Análises",
    blocks: [
      { type: "h2", text: "Relatórios Consolidados" },
      { type: "body", text: "Acesse Menu → Relatórios para visão consolidada de todas as rodadas processadas." },
      { type: "h3", text: "Relatório por rodada" },
      { type: "bullet", text: "Selecione a rodada no seletor no topo da página." },
      { type: "bullet", text: "Visualize: ranking, gráfico de score, market share, indicadores, DRE, Fluxo de Caixa e BP." },
      { type: "bullet", text: "Exportação em CSV com todos os dados numéricos." },
      { type: "h3", text: "Ranking Acumulado" },
      { type: "bullet", text: "Soma os scores de todas as rodadas — reflete consistência, não apenas desempenho pontual." },
      { type: "bullet", text: "Exibe ouro, prata, bronze para as três melhores empresas no geral." },
      { type: "h3", text: "Evolução Histórica de KPIs" },
      { type: "bullet", text: "Disponível com 2 ou mais rodadas processadas." },
      { type: "bullet", text: "Selecione o indicador (Score, Lucro, Receita) para ver evolução em gráfico de linha." },
      { type: "h3", text: "Análise automática" },
      { type: "bullet", text: "O sistema gera texto de análise por empresa, destacando pontos fortes e fracos com dicas de melhoria." },
      { type: "tip", text: "Identifique grupos com alto custo de armazenagem (5% do estoque) — eles estão produzindo acima da demanda e precisam ajustar a estratégia." },
    ],
  },
  {
    title: "8. Indicadores e Pontuação",
    blocks: [
      { type: "h2", text: "Como o Score é Calculado" },
      { type: "body", text: "O score de cada empresa é calculado com 6 indicadores financeiros ponderados (máx. 100 pontos):" },
      { type: "kpi", text: "Liquidez Corrente — 20 pts", sub: "AC / PC. Capacidade de pagar dívidas de curto prazo. Ideal: acima de 1,5." },
      { type: "kpi", text: "Liquidez Seca — 15 pts", sub: "(AC - Estoques) / PC. Análise mais conservadora, exclui estoques." },
      { type: "kpi", text: "Liquidez Imediata — 15 pts", sub: "Caixa / PC. Disponibilidade imediata de recursos." },
      { type: "kpi", text: "ROA — 25 pts (maior peso)", sub: "Lucro Líquido / Ativo Total. Retorno sobre os ativos da empresa." },
      { type: "kpi", text: "Margem Líquida — 15 pts", sub: "Lucro Líquido / Receita. % do faturamento que vira lucro." },
      { type: "kpi", text: "Ciclo Financeiro — 10 pts", sub: "PME + PMR - PMP. Menor = melhor gestão do capital de giro." },
      { type: "h3", text: "Classificação (Grade)" },
      { type: "bullet", text: "AAA (>= 75 pts) — Excelente" },
      { type: "bullet", text: "AA (>= 60 pts) — Muito Bom" },
      { type: "bullet", text: "A (>= 45 pts) — Bom" },
      { type: "bullet", text: "B (>= 30 pts) — Regular" },
      { type: "bullet", text: "C (>= 15 pts) — Fraco" },
      { type: "bullet", text: "D (< 15 pts) — Crítico" },
      { type: "h3", text: "Medalhas por Rodada" },
      { type: "bullet", text: "Melhor Gestor — maior score geral da rodada." },
      { type: "bullet", text: "Melhor Liquidez — maior liquidez corrente." },
      { type: "bullet", text: "Melhor ROA — maior retorno sobre ativos." },
      { type: "bullet", text: "Melhor Margem — maior margem líquida." },
      { type: "bullet", text: "Ciclo mais Eficiente — menor ciclo financeiro." },
      { type: "bullet", text: "Maior Receita — maior receita líquida da rodada." },
    ],
  },
];

export const STUDENT_PDF: PdfSection[] = [
  {
    title: "1. O que é o Arena Contábil",
    blocks: [
      { type: "h2", text: "Bem-vindo ao Arena Contábil!" },
      { type: "body", text: "Você é o Gestor Financeiro da EcoBottle, produtora de garrafas sustentáveis. Junto com seu grupo, você toma decisões financeiras e operacionais a cada rodada, competindo com os outros grupos da turma." },
      { type: "h3", text: "Objetivo do jogo" },
      { type: "bullet", text: "Maximizar o lucro líquido e os indicadores financeiros da sua empresa." },
      { type: "bullet", text: "Manter boa liquidez — capacidade de pagar suas dívidas." },
      { type: "bullet", text: "Gerir bem o capital de giro (ciclo financeiro curto)." },
      { type: "bullet", text: "Subir no ranking acumulado ao longo de todas as rodadas." },
      { type: "h3", text: "Como funciona uma rodada" },
      { type: "bullet", text: "O professor abre a rodada — você acessa o formulário." },
      { type: "bullet", text: "Seu grupo preenche as decisões e salva o rascunho." },
      { type: "bullet", text: "Um integrante envia a rodada — o formulário fica bloqueado para todos." },
      { type: "bullet", text: "O professor processa — você vê DRE, BP, Fluxo de Caixa e ranking." },
      { type: "bullet", text: "O saldo final vira o saldo de abertura da próxima rodada (carryover)." },
      { type: "note", text: "Qualquer integrante pode salvar o rascunho. Apenas um precisa clicar em ENVIAR RODADA — depois ninguém mais consegue alterar." },
    ],
  },
  {
    title: "2. Preenchendo o Formulário",
    blocks: [
      { type: "h2", text: "Como Preencher o Formulário da Rodada" },
      { type: "body", text: "Acesse Menu → Rodada Atual. Acima do formulário aparece o Saldo de Abertura — valores herdados da rodada anterior (caixa, duplicatas a receber, estoque, empréstimos, PL)." },
      { type: "h3", text: "Seção 1: Produção" },
      { type: "bullet", text: "Qtd. a produzir — quantas unidades a fábrica tentará produzir." },
      { type: "bullet", text: "Capacidade produtiva — calculada automaticamente: 2.000 un. base + máquinas acumuladas." },
      { type: "bullet", text: "Colaboradores — número de trabalhadores na produção." },
      { type: "bullet", text: "Salário médio R$/colab. — valor pago por colaborador por mês." },
      { type: "tip", text: "A produção real é o menor valor entre: quantidade planejada, capacidade da fábrica e materiais disponíveis. Planejar com folga evita gargalos!" },
      { type: "h3", text: "Seção 2: Compra de Materiais" },
      { type: "bullet", text: "Cada produto consome 1 unidade de: plástico, tampas, embalagem e rótulo." },
      { type: "bullet", text: "O sistema exibe o saldo de materiais da rodada anterior — você só compra o complemento." },
      { type: "bullet", text: "Preços travados pelo professor aparecem com cadeado e não podem ser alterados." },
      { type: "h3", text: "Seção 3: Compra de Máquinas" },
      { type: "bullet", text: "Máquina Pequena — R$ 20.000 → +10.000 unidades de capacidade." },
      { type: "bullet", text: "Máquina Média — R$ 40.000 → +20.000 unidades de capacidade." },
      { type: "bullet", text: "Máquina Grande — R$ 80.000 → +60.000 unidades de capacidade." },
      { type: "bullet", text: "Pagamento à vista (15 dias) ou parcelado em 3× com juros de 2% a.m." },
      { type: "h3", text: "Seção 4: Vendas por Região" },
      { type: "bullet", text: "Tabela transposta: regiões como colunas, campos (Vender?, Quantidade, Preço) como linhas." },
      { type: "bullet", text: "Marque as regiões onde deseja vender e defina quantidade e preço para cada uma." },
      { type: "bullet", text: "Marketing aumenta a demanda da sua empresa." },
      { type: "bullet", text: "Prazo de recebimento maior = mais dinheiro em Duplicatas a Receber (ativo circulante), menos em caixa." },
      { type: "h3", text: "Seção 5: Gestão Financeira" },
      { type: "bullet", text: "Empréstimo — entra no caixa mas gera despesa financeira." },
      { type: "bullet", text: "Prazo com fornecedores — maior prazo = mais caixa no curto prazo." },
      { type: "h3", text: "Seção 6: Despesas Operacionais" },
      { type: "bullet", text: "Despesas fixas, transporte e manutenção." },
      { type: "bullet", text: "Campos travados pelo professor aparecem com cadeado." },
      { type: "warn", text: "Se aparecerem Inconsistencias abaixo do formulário, revise seus dados antes de enviar." },
    ],
  },
  {
    title: "3. Compra de Máquinas",
    blocks: [
      { type: "h2", text: "Investindo em Capacidade Produtiva" },
      { type: "body", text: "Comprar máquinas é a única forma de aumentar a capacidade da fábrica além das 2.000 unidades base. O investimento vira Ativo Imobilizado e é depreciado em 60 meses." },
      { type: "h3", text: "Catálogo de Máquinas" },
      { type: "kpi", text: "Maquina Pequena — R$ 20.000", sub: "+10.000 unidades de capacidade produtiva por rodada." },
      { type: "kpi", text: "Maquina Média — R$ 40.000", sub: "+20.000 unidades de capacidade produtiva por rodada." },
      { type: "kpi", text: "Maquina Grande — R$ 80.000", sub: "+60.000 unidades de capacidade produtiva por rodada." },
      { type: "h3", text: "Formas de Pagamento" },
      { type: "bullet", text: "A vista (15 dias) — valor total sai do caixa nesta rodada. Sem juros." },
      { type: "bullet", text: "3x parcelado — 1/3 pago agora; restante em 2 parcelas com juros de 2% a.m." },
      { type: "bullet", text: "O parcelamento gera Financiamento de máquinas no Passivo Circulante." },
      { type: "h3", text: "Acumulação de Capacidade" },
      { type: "bullet", text: "A capacidade das máquinas acumula entre rodadas via carryover." },
      { type: "bullet", text: "Capacidade efetiva = 2.000 (base) + total acumulado de todas as máquinas compradas." },
      { type: "bullet", text: "O painel de capacidade mostra: Base / Máquinas acumuladas / Total efetivo." },
      { type: "tip", text: "Comprar uma Maquina Grande parcelada pode ser vantajoso: preserva o caixa e paga com a receita futura gerada pela maior produção." },
      { type: "warn", text: "Certifique-se de ter caixa para o pagamento a vista (ou 1/3 do parcelado). Caixa negativo aciona empréstimo emergencial automático." },
    ],
  },
  {
    title: "4. Materiais e Estoque",
    blocks: [
      { type: "h2", text: "Compra de Matérias-Primas e Estoque" },
      { type: "body", text: "Cada unidade produzida consome 1 unidade de cada matéria-prima: plástico, tampas, embalagem e rótulo." },
      { type: "h3", text: "Estoque de matérias-primas (carryover)" },
      { type: "bullet", text: "Se sobrou material da rodada anterior, o sistema mostra o saldo disponível." },
      { type: "bullet", text: "Esses materiais estão prontos para produção — você só compra o complemento necessário." },
      { type: "bullet", text: "Exemplo: sobrou 500 un. de plástico e quer produzir 1.000 → compre apenas 500." },
      { type: "h3", text: "Preços travados pelo professor" },
      { type: "bullet", text: "Se o professor definiu o preço unitário, o campo aparece com cadeado e não pode ser alterado." },
      { type: "bullet", text: "Isso garante que todos os grupos paguem o mesmo preço, focando em outras variáveis." },
      { type: "h3", text: "Como planejar as compras" },
      { type: "bullet", text: "Compre pelo menos a mesma quantidade que pretende produzir (descontando estoque existente)." },
      { type: "bullet", text: "Comprar a menos limita a produção efetiva." },
      { type: "bullet", text: "Comprar a mais gera sobra — o excedente vai para o estoque da próxima rodada." },
      { type: "tip", text: "Excesso de material parado representa caixa imobilizado sem retorno imediato. Compre próximo do necessário." },
    ],
  },
  {
    title: "5. Estratégias e Dicas",
    blocks: [
      { type: "h2", text: "Dicas Estratégicas para o Gestor" },
      { type: "h3", text: "Precificação" },
      { type: "bullet", text: "Preço abaixo da média do mercado → mais demanda, margem menor." },
      { type: "bullet", text: "Preço acima da média → menos demanda, margem maior." },
      { type: "bullet", text: "Encontre o equilíbrio: preço que maximiza receita sem perder volume." },
      { type: "h3", text: "Produção e Estoque" },
      { type: "bullet", text: "Produza próximo da demanda esperada — estoque parado gera armazenagem de 5%." },
      { type: "bullet", text: "Considere o saldo de materiais do período anterior antes de comprar novos insumos." },
      { type: "h3", text: "Investimento em Máquinas" },
      { type: "bullet", text: "Máquinas aumentam a capacidade permanentemente — planeje crescimento progressivo." },
      { type: "bullet", text: "Se a produção está travada pela capacidade, investir em máquinas é prioritário." },
      { type: "bullet", text: "Use o parcelamento 3x para preservar caixa quando o investimento for grande." },
      { type: "warn", text: "Caixa negativo ativa empréstimo emergencial automaticamente, aumentando passivo e reduzindo liquidez. Evite!" },
      { type: "h3", text: "Liquidez" },
      { type: "bullet", text: "Mantenha Liquidez Corrente acima de 1,5 — garante pagamento de dívidas de curto prazo." },
      { type: "bullet", text: "Evite empréstimos excessivos — aumentam o passivo e reduzem a liquidez." },
      { type: "bullet", text: "Prazo de recebimento curto + prazo com fornecedor longo = melhor gestão do caixa." },
      { type: "h3", text: "Marketing" },
      { type: "bullet", text: "Marketing aumenta a demanda (até +45% com investimento máximo)." },
      { type: "bullet", text: "Retorno decrescente: R$ 0→10k tem muito impacto; acima de R$ 30k o ganho é pequeno." },
      { type: "h3", text: "Ciclo Financeiro" },
      { type: "bullet", text: "PME + PMR - PMP = Ciclo Financeiro. Menor = melhor. Negativo = excelente!" },
      { type: "tip", text: "Nas primeiras rodadas foque em entender as métricas. Nas seguintes, ajuste com base nos resultados anteriores." },
    ],
  },
  {
    title: "6. Entendendo os Resultados",
    blocks: [
      { type: "h2", text: "Interpretando os Resultados" },
      { type: "body", text: "Após o professor processar a rodada, acesse Menu → Resultados." },
      { type: "h3", text: "DRE — Demonstração do Resultado do Exercício" },
      { type: "bullet", text: "Receita Líquida = unidades vendidas × preço × (1 - desconto%)." },
      { type: "bullet", text: "CMV = custo unitário de produção × unidades vendidas + depreciação." },
      { type: "bullet", text: "Lucro Bruto = Receita Líquida − CMV." },
      { type: "bullet", text: "Despesas Operacionais = salários + marketing + fixas + transporte + manutenção + armazenagem." },
      { type: "bullet", text: "EBIT = Lucro Bruto − Despesas Operacionais." },
      { type: "bullet", text: "LAIR = EBIT − Despesa Financeira (juros dos empréstimos)." },
      { type: "bullet", text: "Lucro Líquido = LAIR − IR (15%) − CSLL (9%)." },
      { type: "h3", text: "Balanço Patrimonial" },
      { type: "bullet", text: "Ativo Circulante = caixa + duplicatas a receber + estoques." },
      { type: "bullet", text: "Ativo Não Circulante = imobilizado (máquinas acumuladas − depreciação)." },
      { type: "bullet", text: "Passivo Circulante = fornecedores + empréstimos CP + financiamento de máquinas." },
      { type: "bullet", text: "Patrimônio Líquido = capital social + resultado acumulado." },
      { type: "note", text: "Equação fundamental: Ativo Total = Passivo Total + PL. Deve ser sempre verificada!" },
      { type: "h3", text: "Fluxo de Caixa" },
      { type: "bullet", text: "FCO — atividades operacionais (recebimentos menos pagamentos do dia a dia)." },
      { type: "bullet", text: "FCI — atividades de investimento (pagamento de máquinas)." },
      { type: "bullet", text: "FCF — atividades de financiamento (empréstimos captados)." },
      { type: "h3", text: "Feedback e Evolução" },
      { type: "bullet", text: "O sistema gera análise automática com pontos fortes, fracos e dicas de melhoria." },
      { type: "bullet", text: "Com 2+ rodadas, aparece gráfico de evolução do score, lucro e receita." },
    ],
  },
  {
    title: "7. Indicadores Financeiros",
    blocks: [
      { type: "h2", text: "Os 13 Indicadores do Arena Contábil" },
      { type: "h3", text: "Liquidez" },
      { type: "kpi", text: "Liquidez Corrente = AC / PC", sub: "Ideal > 1,5. Capacidade de pagar dívidas de curto prazo com ativos circulantes." },
      { type: "kpi", text: "Liquidez Seca = (AC − Estoques) / PC", sub: "Ideal > 1,0. Exclui estoques. Análise mais conservadora." },
      { type: "kpi", text: "Liquidez Imediata = Caixa / PC", sub: "Ideal > 0,3. % do passivo coberto pelo caixa disponível imediatamente." },
      { type: "h3", text: "Rentabilidade" },
      { type: "kpi", text: "Margem Bruta = Lucro Bruto / Receita × 100", sub: "% do faturamento que sobra após o custo de produção (CMV)." },
      { type: "kpi", text: "Margem Operacional = EBIT / Receita × 100", sub: "% que vira lucro operacional antes de juros e impostos." },
      { type: "kpi", text: "Margem Líquida = Lucro Líquido / Receita × 100", sub: "% que vira lucro após todos os custos, despesas e impostos." },
      { type: "kpi", text: "ROA = Lucro Líquido / Ativo Total × 100", sub: "Retorno gerado pelos ativos totais. Maior peso no score (25 pts)." },
      { type: "kpi", text: "ROE = Lucro Líquido / PL × 100", sub: "Retorno sobre o capital dos sócios." },
      { type: "h3", text: "Ciclo Operacional e Financeiro" },
      { type: "kpi", text: "PME = (Estoque / CMV) × 30", sub: "Prazo Médio de Estocagem — dias que o produto fica no estoque." },
      { type: "kpi", text: "PMR = (Duplicatas a Receber / Receita) × 30", sub: "Prazo Médio de Recebimento — dias para receber dos clientes." },
      { type: "kpi", text: "PMP = (Fornecedores / Compras) × 30", sub: "Prazo Médio de Pagamento — dias para pagar os fornecedores." },
      { type: "kpi", text: "Ciclo Financeiro = PME + PMR − PMP", sub: "Quanto menor (ou negativo), melhor a gestão do capital de giro." },
      { type: "kpi", text: "Compras = CMV + Estoque Final − Estoque Inicial", sub: "Volume total de compras do período pela fórmula contábil." },
    ],
  },
  {
    title: "8. Ranking e Medalhas",
    blocks: [
      { type: "h2", text: "Como Funciona o Ranking" },
      { type: "body", text: "Score máximo = 100 pontos, calculado com 6 indicadores ponderados:" },
      { type: "kpi", text: "ROA — 25 pts (maior peso individual)", sub: "Eficiência no uso dos ativos totais." },
      { type: "kpi", text: "Liquidez Corrente — 20 pts", sub: "Saúde financeira de curto prazo." },
      { type: "kpi", text: "Liquidez Seca — 15 pts", sub: "Análise conservadora da capacidade de pagamento." },
      { type: "kpi", text: "Liquidez Imediata — 15 pts", sub: "Disponibilidade de caixa imediata." },
      { type: "kpi", text: "Margem Líquida — 15 pts", sub: "% do faturamento convertida em lucro." },
      { type: "kpi", text: "Ciclo Financeiro — 10 pts", sub: "Eficiência na gestão do capital de giro." },
      { type: "h3", text: "Ranking Acumulado" },
      { type: "body", text: "Os scores de todas as rodadas são somados. Quem for consistente ao longo do jogo vence o Arena Contábil!" },
      { type: "h3", text: "Medalhas disponíveis por rodada" },
      { type: "bullet", text: "Melhor Gestor — maior score geral da rodada." },
      { type: "bullet", text: "Melhor Liquidez — maior liquidez corrente." },
      { type: "bullet", text: "Melhor ROA — maior retorno sobre ativos." },
      { type: "bullet", text: "Melhor Margem — maior margem líquida." },
      { type: "bullet", text: "Ciclo mais Eficiente — menor ciclo financeiro." },
      { type: "bullet", text: "Maior Receita — maior receita líquida da rodada." },
      { type: "tip", text: "Mesmo sem liderar o ranking geral, você pode ganhar medalhas por excelência em indicadores específicos. Identifique seu ponto forte e domine-o!" },
    ],
  },
  {
    title: "9. Glossário Contábil",
    blocks: [
      { type: "h2", text: "Glossário de Termos Contábeis" },
      { type: "kpi", text: "Ativo", sub: "Tudo que a empresa possui: caixa, duplicatas a receber, estoques, máquinas." },
      { type: "kpi", text: "Passivo", sub: "Tudo que a empresa deve: fornecedores, empréstimos, financiamento de máquinas." },
      { type: "kpi", text: "Patrimônio Líquido (PL)", sub: "Capital dos sócios = Ativo − Passivo. O valor líquido da empresa." },
      { type: "kpi", text: "CMV", sub: "Custo das Mercadorias Vendidas — custo unitário × unidades vendidas." },
      { type: "kpi", text: "EBIT", sub: "Lucro Operacional — antes de juros e impostos." },
      { type: "kpi", text: "LAIR", sub: "Lucro Antes do IR — após deduzir despesas financeiras (juros)." },
      { type: "kpi", text: "IR", sub: "Imposto de Renda — 15% sobre o LAIR positivo." },
      { type: "kpi", text: "CSLL", sub: "Contribuição Social — 9% sobre o LAIR positivo." },
      { type: "kpi", text: "Depreciação", sub: "Perda de valor das máquinas no tempo — 1/60 do investimento por mês." },
      { type: "kpi", text: "Capital de Giro", sub: "Recursos para financiar o ciclo operacional: produzir → vender → receber." },
      { type: "kpi", text: "Market Share", sub: "% da receita da empresa sobre o total faturado por todos os grupos." },
      { type: "kpi", text: "Carryover", sub: "BP final de uma rodada vira saldo de abertura da próxima." },
      { type: "kpi", text: "Armazenagem", sub: "Custo de 5% do valor do estoque de produto acabado não vendido." },
      { type: "kpi", text: "Empréstimo Emergencial", sub: "Acionado automaticamente quando o caixa fecha negativo — cobre o déficit com custo adicional." },
    ],
  },
];

// ─── Função geradora do PDF ────────────────────────────────────────────────

export async function generateManualPDF(role: "teacher" | "student") {
  const { jsPDF } = await import("jspdf");

  const sections = role === "teacher" ? PROFESSOR_PDF : STUDENT_PDF;
  const title    = role === "teacher" ? "Manual do Professor" : "Manual do Aluno";
  const filename = role === "teacher" ? "manual-professor-arena-contabil.pdf" : "manual-aluno-arena-contabil.pdf";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W      = doc.internal.pageSize.getWidth();
  const H      = doc.internal.pageSize.getHeight();
  const marginL = 18;
  const marginR = 18;
  const contentW = W - marginL - marginR;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function pageFooter(pageNum: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text("Arena Contábil — Business Accounting Simulator", marginL, H - 8);
    doc.text(`Página ${pageNum}`, W - marginR, H - 8, { align: "right" });
    doc.setDrawColor(60, 80, 120);
    doc.setLineWidth(0.3);
    doc.line(marginL, H - 12, W - marginR, H - 12);
  }

  function addWrapped(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    lines.forEach((line: string) => {
      if (y > H - 20) {
        pageCount++;
        pageFooter(pageCount - 1);
        doc.addPage();
        y = 20;
      }
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  let pageCount = 1;

  // ── Capa ─────────────────────────────────────────────────────────────────

  // Fundo escuro
  doc.setFillColor(10, 20, 40);
  doc.rect(0, 0, W, H, "F");

  // Faixa de cor topo
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 0, W, 4, "F");

  // Ícone placeholder
  doc.setFillColor(6, 182, 212, 0.15);
  doc.roundedRect(W / 2 - 16, 50, 32, 32, 6, 6, "F");
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.8);
  doc.roundedRect(W / 2 - 16, 50, 32, 32, 6, 6, "S");

  // "CFO" dentro do ícone
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(6, 182, 212);
  doc.text("AC", W / 2, 70, { align: "center" });

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("Arena Contábil", W / 2, 102, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(6, 182, 212);
  doc.text(title, W / 2, 114, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Simulador Empresarial Contábil", W / 2, 124, { align: "center" });

  // Divisor
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(marginL + 20, 132, W - marginR - 20, 132);

  // Subtítulo da seção
  doc.setFontSize(10);
  doc.setTextColor(100, 120, 150);
  doc.text(`Conteúdo: ${sections.length} seções`, W / 2, 142, { align: "center" });

  // Data
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(9);
  doc.setTextColor(80, 100, 130);
  doc.text(today, W / 2, 152, { align: "center" });

  // Faixa de cor rodapé
  doc.setFillColor(6, 182, 212);
  doc.rect(0, H - 4, W, 4, "F");

  // ── Sumário ───────────────────────────────────────────────────────────────

  pageCount++;
  doc.addPage();

  // Fundo escuro nas páginas internas
  doc.setFillColor(14, 22, 40);
  doc.rect(0, 0, W, H, "F");

  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, W, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Sumário", marginL, 22);

  doc.setDrawColor(6, 182, 212, 0.4);
  doc.setLineWidth(0.3);
  doc.line(marginL, 26, W - marginR, 26);

  let sy = 36;
  sections.forEach((sec, i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(6, 182, 212);
    doc.text(`${i + 1}.`, marginL, sy);
    doc.setTextColor(220, 225, 235);
    doc.text(sec.title.replace(/^\d+\.\s*/, ""), marginL + 8, sy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 100, 130);
    doc.text(`Página ${i + 3}`, W - marginR, sy, { align: "right" });
    sy += 9;
  });

  pageFooter(pageCount - 1);

  // ── Seções ────────────────────────────────────────────────────────────────

  sections.forEach((sec) => {
    pageCount++;
    doc.addPage();

    doc.setFillColor(14, 22, 40);
    doc.rect(0, 0, W, H, "F");
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 0, W, 1.5, "F");

    // Cabeçalho da seção
    doc.setFillColor(6, 182, 212, 0.12);
    doc.roundedRect(marginL - 2, 8, contentW + 4, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(6, 182, 212);
    doc.text(sec.title, marginL + 2, 18);

    let y = 30;

    for (const block of sec.blocks) {
      if (y > H - 20) {
        pageFooter(pageCount - 1);
        pageCount++;
        doc.addPage();
        doc.setFillColor(14, 22, 40);
        doc.rect(0, 0, W, H, "F");
        doc.setFillColor(6, 182, 212);
        doc.rect(0, 0, W, 1.5, "F");
        y = 18;
      }

      switch (block.type) {
        case "h2":
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(255, 255, 255);
          y = addWrapped(block.text!, marginL, y, contentW, 6);
          y += 2;
          break;

        case "h3":
          y += 2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(6, 182, 212);
          doc.text((block.text || "").toUpperCase(), marginL, y);
          y += 5;
          // Linha fina
          doc.setDrawColor(6, 182, 212, 0.3);
          doc.setLineWidth(0.2);
          doc.line(marginL, y - 1, W - marginR, y - 1);
          y += 1;
          break;

        case "body":
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(200, 210, 220);
          y = addWrapped(block.text!, marginL, y, contentW, 5);
          y += 2;
          break;

        case "bullet":
          doc.setFillColor(6, 182, 212);
          doc.circle(marginL + 2, y - 1.5, 0.9, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(200, 210, 220);
          y = addWrapped(block.text!, marginL + 6, y, contentW - 6, 5);
          y += 1;
          break;

        case "tip": {
          if (y > H - 30) {
            pageFooter(pageCount - 1);
            pageCount++;
            doc.addPage();
            doc.setFillColor(14, 22, 40);
            doc.rect(0, 0, W, H, "F");
            doc.setFillColor(6, 182, 212);
            doc.rect(0, 0, W, 1.5, "F");
            y = 18;
          }
          const lines = doc.splitTextToSize(`Dica: ${block.text}`, contentW - 10) as string[];
          const boxH = lines.length * 5 + 6;
          doc.setFillColor(180, 140, 0, 0.12);
          doc.setDrawColor(180, 140, 0, 0.5);
          doc.setLineWidth(0.3);
          doc.roundedRect(marginL, y - 2, contentW, boxH, 2, 2, "FD");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(250, 190, 30);
          doc.text("Dica:", marginL + 3, y + 2.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(240, 210, 140);
          const bodyLines = doc.splitTextToSize(block.text!, contentW - 18) as string[];
          bodyLines.forEach((ln: string, i: number) => {
            doc.text(ln, marginL + 14, y + 2.5 + i * 5);
          });
          y += boxH + 3;
          break;
        }

        case "note": {
          if (y > H - 30) {
            pageFooter(pageCount - 1);
            pageCount++;
            doc.addPage();
            doc.setFillColor(14, 22, 40);
            doc.rect(0, 0, W, H, "F");
            doc.setFillColor(6, 182, 212);
            doc.rect(0, 0, W, 1.5, "F");
            y = 18;
          }
          const lines = doc.splitTextToSize(block.text!, contentW - 10) as string[];
          const boxH = lines.length * 5 + 6;
          doc.setFillColor(6, 182, 212, 0.08);
          doc.setDrawColor(6, 182, 212, 0.5);
          doc.setLineWidth(0.3);
          doc.roundedRect(marginL, y - 2, contentW, boxH, 2, 2, "FD");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(6, 182, 212);
          doc.text("Importante:", marginL + 3, y + 2.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(150, 210, 230);
          const bodyLines = doc.splitTextToSize(block.text!, contentW - 26) as string[];
          bodyLines.forEach((ln: string, i: number) => {
            doc.text(ln, marginL + 26, y + 2.5 + i * 5);
          });
          y += boxH + 3;
          break;
        }

        case "warn": {
          if (y > H - 30) {
            pageFooter(pageCount - 1);
            pageCount++;
            doc.addPage();
            doc.setFillColor(14, 22, 40);
            doc.rect(0, 0, W, H, "F");
            doc.setFillColor(6, 182, 212);
            doc.rect(0, 0, W, 1.5, "F");
            y = 18;
          }
          const lines = doc.splitTextToSize(block.text!, contentW - 10) as string[];
          const boxH = lines.length * 5 + 6;
          doc.setFillColor(220, 40, 40, 0.1);
          doc.setDrawColor(220, 80, 80, 0.5);
          doc.setLineWidth(0.3);
          doc.roundedRect(marginL, y - 2, contentW, boxH, 2, 2, "FD");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(220, 80, 80);
          doc.text("Atenção:", marginL + 3, y + 2.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(240, 150, 150);
          const bodyLines = doc.splitTextToSize(block.text!, contentW - 22) as string[];
          bodyLines.forEach((ln: string, i: number) => {
            doc.text(ln, marginL + 22, y + 2.5 + i * 5);
          });
          y += boxH + 3;
          break;
        }

        case "kpi": {
          if (y > H - 24) {
            pageFooter(pageCount - 1);
            pageCount++;
            doc.addPage();
            doc.setFillColor(14, 22, 40);
            doc.rect(0, 0, W, H, "F");
            doc.setFillColor(6, 182, 212);
            doc.rect(0, 0, W, 1.5, "F");
            y = 18;
          }
          const subLines = block.sub ? doc.splitTextToSize(block.sub, contentW - 6) as string[] : [];
          const boxH = 6 + subLines.length * 4.5 + 2;
          doc.setFillColor(255, 255, 255, 0.03);
          doc.setDrawColor(255, 255, 255, 0.08);
          doc.setLineWidth(0.2);
          doc.roundedRect(marginL, y - 2, contentW, boxH, 1.5, 1.5, "FD");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);
          doc.text(block.text!, marginL + 3, y + 2.5);
          if (block.sub) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(140, 160, 185);
            subLines.forEach((ln: string, i: number) => {
              doc.text(ln, marginL + 3, y + 7.5 + i * 4.5);
            });
          }
          y += boxH + 3;
          break;
        }

        case "spacer":
          y += 4;
          break;

        case "divider":
          doc.setDrawColor(255, 255, 255, 0.1);
          doc.setLineWidth(0.2);
          doc.line(marginL, y, W - marginR, y);
          y += 4;
          break;
      }
    }

    pageFooter(pageCount - 1);
  });

  doc.save(filename);
}
