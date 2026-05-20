# Manual do Professor
## Arena Contábil — Business Accounting Simulator

**Versão:** 2.0 | **Plataforma:** https://desafio-cfo-gjpn.vercel.app

---

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Acesso e Login](#2-acesso-e-login)
3. [Painel Principal (Dashboard)](#3-painel-principal-dashboard)
4. [Gerenciamento de Grupos e Empresas](#4-gerenciamento-de-grupos-e-empresas)
5. [Gerenciamento de Alunos](#5-gerenciamento-de-alunos)
6. [Rodadas](#6-rodadas)
7. [Controle de uma Rodada](#7-controle-de-uma-rodada)
8. [Processamento de Resultados](#8-processamento-de-resultados)
9. [Análise de Mercado](#9-análise-de-mercado)
10. [Relatórios](#10-relatórios)
11. [Notas e Avaliação Acadêmica](#11-notas-e-avaliação-acadêmica)
12. [Configurações da Turma](#12-configurações-da-turma)
13. [Painel Master (Administrador)](#13-painel-master-administrador)
14. [Mecânica da Simulação](#14-mecânica-da-simulação)
15. [Indicadores Financeiros](#15-indicadores-financeiros)
16. [Eventos Econômicos](#16-eventos-econômicos)
17. [Sistema de Pontuação](#17-sistema-de-pontuação)
18. [Fluxo Completo de uma Rodada](#18-fluxo-completo-de-uma-rodada)
19. [Procedimentos Operacionais](#19-procedimentos-operacionais)

---

## 1. Visão Geral do Sistema

A **Arena Contábil** é um simulador empresarial gamificado voltado para o ensino de Ciências Contábeis. Os alunos formam grupos e atuam como gestores de empresas concorrentes do segmento de **garrafas sustentáveis (EcoBottle)**, tomando decisões financeiras a cada rodada de forma competitiva.

### Como funciona o jogo

- Cada **grupo** representa uma empresa com nome, região de atuação e características próprias de mercado.
- A cada **rodada**, os alunos preenchem um formulário com as decisões de gestão: produção, compras de matéria-prima, vendas, preços, contratações, marketing e investimentos em máquinas.
- Ao final de cada rodada, o professor processa os resultados e o sistema calcula automaticamente todos os demonstrativos financeiros (DRE, Balanço Patrimonial, Fluxo de Caixa) e os indicadores de desempenho (13 KPIs).
- As empresas são **ranqueadas** por uma pontuação calculada com base nos indicadores financeiros. O ranking é convertido em **nota acadêmica** configurável pelo professor.

### Conceito pedagógico

- Cada rodada equivale a **um exercício fiscal completo** da empresa.
- Os saldos de uma rodada tornam-se o **balanço de abertura** da rodada seguinte (carryover).
- O aluno aprende na prática o impacto de suas decisões nos demonstrativos contábeis.

---

## 2. Acesso e Login

### Endereço da plataforma

> **https://desafio-cfo-gjpn.vercel.app**

### Tipos de usuário

| Modo | Credencial | Acesso |
|------|------------|--------|
| **Professor** | E-mail + Senha | Gestão completa da turma |
| **Aluno** | RA + Senha | Formulário e resultados |
| **Master** | E-mail + Senha (admin) | Gestão de professores |

### Como fazer login como Professor

1. Acesse o endereço da plataforma.
2. A tela inicial abre no modo **Professor** (aba da esquerda).
3. Digite seu **e-mail** e **senha**.
4. Clique em **Entrar na plataforma**.

### Primeiro acesso

Na primeira utilização do sistema:

1. Acesse `/api/seed?secret=arena2024` para criar os dados iniciais de demonstração (professor padrão, turma, 4 grupos e 5 alunos de teste).
2. Faça login com as credenciais criadas pelo seed.
3. Altere a senha nas **Configurações → Segurança**.

---

## 3. Painel Principal (Dashboard)

O painel exibe uma visão executiva em tempo real da turma.

### Indicadores no topo (KPI Cards)

| Card | Descrição |
|------|-----------|
| **Total de Alunos** | Quantidade de alunos cadastrados na turma |
| **Grupos Ativos** | Quantidade de grupos/empresas configurados |
| **Rodada Atual** | Nome e status da rodada em andamento |
| **Envios Recebidos** | Número de grupos que já enviaram a decisão na rodada ativa |

### Tracker de submissões

Grid visual com todos os grupos mostrando:
- **Cinza** — Rodada não aberta ou grupo sem envio
- **Âmbar/Laranja** — Rascunho salvo (decisão em edição)
- **Verde** — Decisão enviada e bloqueada para edição
- Quem enviou, RA e horário do envio

### Gráficos do dashboard

- **Ranking de Score** — Gráfico de barras comparando a pontuação de cada empresa na última rodada processada.
- **Market Share** — Pizza mostrando a fatia de receita líquida de cada empresa.

### Botão rápido

O botão **"Ver Rodada Ativa"** leva diretamente para o painel de controle da rodada em andamento.

---

## 4. Gerenciamento de Grupos e Empresas

Acesse pelo menu lateral: **Grupos**.

### O que é um grupo?

Cada grupo representa uma **empresa concorrente** no mercado. Configurações do grupo:

| Campo | Descrição |
|-------|-----------|
| **Nome do grupo** | Identificação interna (ex: "Grupo 1") |
| **Nome da empresa** | Nome fictício da empresa (ex: "EcoBottle Norte") |
| **Região** | Nome da região de atuação (ex: "Norte") |
| **Característica da região** | Descrição narrativa para os alunos |
| **Fator de demanda regional** | Multiplicador da demanda (1.0 = neutro; 1.2 = +20% demanda) |
| **Fator de custo regional** | Multiplicador dos custos (1.0 = neutro; 0.9 = -10% custos) |

### Como criar um novo grupo

1. No campo **"Nome do grupo"**, digite o nome desejado.
2. Clique em **Criar Grupo**.
3. O grupo é criado com valores padrão e aparece na lista.
4. Clique no ícone de **edição (lápis)** para configurar nome da empresa, região e multiplicadores.
5. Clique em **Salvar** na linha do grupo.

### Cores dos grupos

O sistema atribui automaticamente cores para identificar cada empresa nos gráficos:
- Grupo 1: Verde esmeralda
- Grupo 2: Azul céu
- Grupo 3: Violeta
- Grupo 4: Âmbar/Laranja
- Grupos adicionais: cores variadas

### Excluir um grupo

Clique no ícone de **lixeira** ao lado do grupo. Atenção: a exclusão remove também os alunos vinculados (eles ficam sem grupo, não são deletados).

---

## 5. Gerenciamento de Alunos

Acesse pelo menu lateral: **Alunos**.

### Cadastro manual de aluno

1. Preencha o formulário no topo da página:
   - **RA** (Registro Acadêmico) — identificador único para login
   - **Nome completo**
   - **Grupo** — selecione o grupo ao qual o aluno pertence
   - **Senha provisória** — o aluno deverá trocá-la no primeiro acesso
2. Clique em **Cadastrar Aluno**.

### Importação em massa (CSV)

Para cadastrar muitos alunos de uma vez:

1. Clique em **Importar CSV**.
2. Prepare um arquivo `.csv` com as colunas: `ra`, `name`, `group_id` (ou `group_name`), `password`.
3. Carregue o arquivo e confirme a importação.
4. O sistema detecta duplicatas automaticamente (alunos com o mesmo RA não são importados novamente).

### Editar aluno

Clique no **ícone de lápis** ao lado do aluno para editar nome, grupo ou e-mail de contato.

### Redefinir senha temporária

Quando um aluno esquece a senha:

1. Localize o aluno na lista.
2. Clique no **ícone de chave (🔑)** ao lado do nome.
3. Um modal abrirá — clique em **"Gerar Senha Temporária"**.
4. O sistema gera uma senha aleatória de 6 dígitos e a exibe na tela.
5. **Anote ou informe a senha ao aluno verbalmente** — ela não é enviada por e-mail.
6. O aluno deverá trocar a senha no próximo login.

### Mover aluno de grupo

Edite o aluno e selecione o novo grupo no campo **Grupo**. Salve.

### Excluir aluno

Clique no ícone de **lixeira**. O aluno e suas submissões são removidos da turma.

---

## 6. Rodadas

Acesse pelo menu lateral: **Rodadas**.

### Status possíveis de uma rodada

| Status | Cor | Significado |
|--------|-----|-------------|
| **Não iniciada** | Cinza | Criada, mas ainda não aberta para envios |
| **Aberta** | Verde | Alunos podem preencher e enviar decisões |
| **Encerrada** | Âmbar | Período de envio encerrado; aguardando processamento |
| **Processada** | Azul/Ciano | Resultados calculados e disponíveis para alunos |
| **Cancelada** | Vermelho | Rodada cancelada |

### Criar uma nova rodada

1. Clique em **Nova Rodada**.
2. Preencha:
   - **Nome da rodada** (ex: "Rodada 1", "Rodada 2")
   - **Evento econômico** — escolha o cenário de mercado (ver seção 16)
3. Clique em **Criar**.

### Gerenciar rodadas existentes

Na lista de rodadas, cada item exibe:
- Nome, status e data de criação
- Botão **"Ver detalhes"** para entrar no painel de controle

---

## 7. Controle de uma Rodada

Acesse clicando em **"Ver detalhes"** na lista de rodadas ou em **"Ver Rodada Ativa"** no dashboard.

### Ações disponíveis

| Ação | Quando usar |
|------|-------------|
| **Abrir Rodada** | Para iniciar o período de envio de decisões pelos alunos |
| **Encerrar Rodada** | Para bloquear novos envios e preparar o processamento |
| **Reabrir Rodada** | Para permitir novos envios após encerramento (ex: aluno esqueceu de enviar) |
| **Cancelar Envio de Grupo** | Para desfazer o envio de um grupo específico, permitindo que editem novamente |
| **Processar Resultados** | Para calcular e publicar os resultados (ver seção 8) |

### Painel de submissões em tempo real

O grid central mostra o status de cada grupo:
- **Empresa / Região** — identificação do grupo
- **Status** — Não enviado / Rascunho / Enviado
- **Enviado por** — nome e RA do aluno que confirmou o envio
- **Data/hora do envio**

**Atualização automática:** O painel se atualiza a cada 10 segundos. Use o botão **"Atualizar"** para forçar a atualização imediata.

### Alerta de inconsistências

O sistema exibe um painel de alertas caso alguma decisão enviada tenha problemas detectados automaticamente:
- Produção maior que a capacidade de máquinas instaladas
- Matéria-prima insuficiente para a produção declarada
- Vendas planejadas maiores que a produção
- Número de funcionários inadequado para o volume de produção

---

## 8. Processamento de Resultados

O processamento é a etapa central do jogo. Ao clicar em **"Processar Rodada"**, o sistema executa automaticamente:

### Sequência de processamento

1. **Coleta de decisões** — Carrega todas as submissões enviadas da rodada.
2. **Decisão padrão** — Grupos sem envio recebem automaticamente a decisão-padrão do sistema (produção mínima, sem investimentos).
3. **Preço médio de mercado** — Calcula a média ponderada dos preços praticados por todos os grupos.
4. **Efeito do evento econômico** — Aplica os multiplicadores de demanda e custo do evento selecionado.
5. **Simulação de cada empresa** — Executa o motor de simulação para cada grupo, calculando DRE, Balanço, Fluxo de Caixa e 13 KPIs.
6. **Cálculo de score** — Pontua cada empresa com base nos pesos configurados.
7. **Ranking** — Ordena as empresas por pontuação e atribui posições.
8. **Conversão em nota** — Converte o score em nota acadêmica conforme a escala configurada.
9. **Medalhas** — Distribui medalhas por destaque em categorias específicas.
10. **Publicação** — Salva os resultados e os disponibiliza para os alunos.
11. **Registro de auditoria** — Grava o log do processamento.

### Após o processamento

- O status da rodada muda para **"Processada"**.
- Os alunos passam a ver os resultados em suas telas de **Resultados** e **Mercado**.
- O professor pode visualizar os resultados detalhados em **Relatórios**.

---

## 9. Análise de Mercado

Acesse pelo menu lateral: **Mercado**.

Esta tela exibe uma visão comparativa de **todas as empresas** em uma rodada selecionada.

### Funcionalidades

- **Seletor de rodada** — Escolha qual rodada processada analisar.
- **Tabela comparativa** — Exibe side-by-side todos os indicadores de todas as empresas:
  - Posição, empresa e região
  - Receita líquida e lucro líquido
  - Liquidez corrente, seca e imediata
  - ROA, ROE, margem líquida e bruta
  - Ciclo financeiro e market share
  - Score e nota acadêmica
- **Ordenação** — Clique em qualquer coluna para ordenar.
- **Gráfico de barras** — Comparativo visual dos indicadores selecionados por empresa.
- **Evolução histórica** — Gráfico de linha mostrando a evolução do score de cada empresa ao longo das rodadas.

### Filtro por polo/campus

Se a turma tiver múltiplos polos (configurado via Master), o seletor de polo filtra os grupos exibidos.

---

## 10. Relatórios

Acesse pelo menu lateral: **Relatórios**.

### Visão geral

A tela de relatórios consolida todos os resultados e oferece exportação em múltiplos formatos.

### Seções disponíveis

**1. Ranking da rodada**
- Tabela completa de todas as empresas com todos os indicadores
- Ordenação por qualquer coluna
- Destaque visual por posição (ouro, prata, bronze)

**2. Gráficos**
- Ranking de score (barras horizontais)
- Market share (pizza)
- Evolução de KPIs por rodada (linhas — histórico acumulado)
- Balanço Patrimonial por empresa (barras empilhadas)
- Fluxo de Caixa por empresa

**3. Medalhas**
- Painel de medalhas atribuídas por destaque em categorias:
  - 🏆 Melhor Score Geral
  - 💧 Melhor Liquidez
  - 💰 Maior Lucratividade
  - 📈 Maior ROA
  - 🔄 Melhor Ciclo Financeiro
  - 🌍 Maior Market Share

### Exportação

| Formato | Conteúdo |
|---------|----------|
| **PDF** | Relatório completo com logo, ranking, gráficos e indicadores de cada empresa |
| **Excel (.xlsx)** | Planilha com múltiplas abas: ranking, DRE por empresa, balanço por empresa, histórico de rodadas |

**Como exportar:**
1. Selecione a rodada desejada no seletor.
2. Clique em **"Exportar PDF"** ou **"Exportar Excel"**.
3. O arquivo é baixado automaticamente.

---

## 11. Notas e Avaliação Acadêmica

Acesse pelo menu lateral: **Notas**.

### Como as notas são calculadas

Cada empresa recebe uma **pontuação (score)** baseada em seus indicadores financeiros (ver seção 17). Essa pontuação é convertida em uma **nota acadêmica** conforme a **Escala de Notas** configurada pelo professor.

### Escala de Notas padrão

| Conceito | Símbolo | Score mínimo | Nota (0–10) |
|----------|---------|--------------|-------------|
| Excelente | AAA | ≥ 75 pontos | 10,0 |
| Muito Bom | AA | ≥ 60 pontos | 8,5 |
| Bom | A | ≥ 45 pontos | 7,0 |
| Regular | B | ≥ 30 pontos | 5,5 |
| Fraco | C | ≥ 15 pontos | 4,0 |
| Crítico | D | ≥ 0 pontos | 2,0 |

### Como personalizar a Escala de Notas

1. Vá em **Notas → Editor da Escala de Notas**.
2. Ajuste os valores de **Score mínimo** e **Nota** para cada conceito.
3. Clique em **Salvar Escala**.

### Ajustes de nota individuais

Na tabela de alunos, o professor pode registrar:
- **Ajuste de nota por aluno** — bônus ou penalidade adicional com justificativa.
- **Observações** — comentários por rodada por aluno.

### Exportação das notas

Botões de exportação disponíveis:
- **Imprimir** — versão de impressão do diário de notas
- **PDF** — relatório de notas da turma
- **Excel** — planilha de notas para lançamento no sistema acadêmico

---

## 12. Configurações da Turma

Acesse pelo menu lateral: **Configurações**.

### Dados da turma

- Alterar o nome da turma.
- Configurar despesas padrão que serão usadas quando o professor quiser travar valores para todos os grupos:
  - **Despesas fixas** (R$/rodada) — salários administrativos, aluguel, etc.
  - **Transporte** (R$/rodada) — custo logístico fixo da empresa
  - **Manutenção** (R$/rodada) — manutenção de equipamentos

> Quando esses valores são configurados, os campos correspondentes no formulário do aluno aparecem **travados** (exibidos, mas não editáveis). Isso garante que todos os grupos trabalhem com as mesmas condições.

### Pesos do Score

O professor pode customizar o peso de cada indicador na pontuação final:

| Indicador | Peso padrão |
|-----------|-------------|
| Liquidez Corrente | 20% |
| Liquidez Seca | 15% |
| Liquidez Imediata | 15% |
| ROA | 25% |
| Margem Líquida | 15% |
| Ciclo Financeiro | 10% |
| **Total** | **100%** |

**Como alterar os pesos:**
1. Ajuste os percentuais nos campos correspondentes.
2. A soma deve ser exatamente **100%** (o sistema valida automaticamente).
3. Clique em **Salvar Pesos**.

### Segurança (Troca de Senha)

- Altere sua própria senha de acesso ao sistema.
- Campos: senha atual, nova senha, confirmação.

### Eventos econômicos

Lista e descrição de todos os eventos disponíveis para uso nas rodadas (ver seção 16).

---

## 13. Painel Master (Administrador)

Acesse fazendo login com o **modo Master** na tela de login (ícone de escudo).

Este painel é exclusivo para o administrador institucional. Permite:

### Gestão de professores

- **Listar todos os professores** cadastrados na plataforma
- **Criar novo professor** — nome, e-mail, senha inicial e polos/campi vinculados
- **Editar professor** — alterar dados e polos
- **Redefinir senha** — gerar nova senha para o professor
- **Excluir professor** — remove o professor e todas as suas turmas

### Polos e campi

Cada professor pode ser vinculado a um ou mais **polos** (unidades da instituição). Isso permite que:
- O professor veja apenas os alunos e grupos de seus polos.
- Turmas de polos diferentes sejam gerenciadas de forma independente.

### Como criar um professor

1. Clique em **Novo Professor**.
2. Preencha:
   - Nome completo
   - E-mail institucional
   - Senha inicial
   - Polos (ex: "Polo A, Polo B")
3. Clique em **Salvar**.
4. O professor já pode fazer login imediatamente.

---

## 14. Mecânica da Simulação

### Balanço de abertura (Rodada 1)

Todas as empresas iniciam com o mesmo balanço patrimonial:

| Conta | Valor |
|-------|-------|
| Caixa | R$ 50.000 |
| Bancos | R$ 30.000 |
| Aplicações financeiras | R$ 20.000 |
| Clientes (a receber) | R$ 40.000 |
| Estoques | R$ 25.000 |
| Imobilizado | R$ 150.000 |
| **Total Ativo** | **R$ 315.000** |
| Fornecedores (a pagar) | R$ 35.000 |
| Empréstimos | R$ 60.000 |
| **Capital Social** | **R$ 220.000** |

### Carryover entre rodadas

Os seguintes saldos são carregados automaticamente de uma rodada para a próxima:
- **Caixa e bancos** — saldo final da rodada anterior
- **Aplicações financeiras** — saldo com rendimentos
- **Clientes** — valores a receber conforme prazo escolhido pelo aluno
- **Estoques** — matéria-prima não utilizada e produtos acabados não vendidos
- **Máquinas** — capacidade acumulada de todas as máquinas compradas
- **Funcionários** — quantidade de funcionários ao final da rodada
- **Fornecedores** — valores a pagar conforme prazo de compra

### Capacidade de produção

- Capacidade **base** da fábrica: **2.000 unidades/rodada**
- Aumentada pela compra de máquinas:

| Máquina | Capacidade adicional | Preço |
|---------|---------------------|-------|
| ⚙️ Pequena | +10.000 unidades | R$ 20.000 |
| 🏭 Média | +20.000 unidades | R$ 40.000 |
| 🏗️ Grande | +60.000 unidades | R$ 80.000 |

- Máquinas podem ser pagas **à vista** ou **a prazo** (financiamento com juros de 2% a.m.).

### Funcionários

- Quantidade **padrão inicial**: 6 funcionários
- Cada funcionário produz ~333 unidades/rodada
- **Contratação**: custa 1,5× o salário mensal (encargos + treinamento)
- **Demissão**: custa 1,2× o salário mensal (aviso prévio + multa FGTS)
- **Alerta**: funcionários insuficientes (<85% do necessário) geram queda de 10% na produtividade
- **Greve**: funcionários muito insuficientes (<65%) geram queda de 30% na produtividade
- **Alerta de ociosidade**: excesso de funcionários ociosos (>35%) gera alerta

### Marketing

- Cada **inserção de marketing** custa **R$ 1.500** por padrão (configurável pelo professor).
- Cada inserção adiciona **+6% de boost na demanda** da empresa.
- O efeito é acumulativo (ex: 3 inserções = +18% de demanda).

### Vendas regionais

- Alunos podem vender em **múltiplas regiões** simultaneamente.
- Vender fora da região de origem incorre em **custo de transporte de R$ 3,00/unidade**.
- Cada região tem seu próprio fator de demanda e custo.

### Determinação da demanda real

A quantidade efetivamente vendida é calculada pela seguinte lógica:
1. Demanda base = quantidade planejada pelo aluno
2. Ajuste pelo evento econômico (fator global)
3. Ajuste pelo fator regional de cada região de venda
4. Ajuste pelo preço praticado vs. preço médio de mercado:
   - Preço abaixo da média → maior demanda
   - Preço acima da média → menor demanda
5. Ajuste pelo marketing (inserções × +6%)
6. Limite: não pode vender mais do que produziu

---

## 15. Indicadores Financeiros

O sistema calcula automaticamente **13 indicadores** para cada empresa a cada rodada.

### Indicadores de Liquidez

| Indicador | Fórmula | Interpretação |
|-----------|---------|---------------|
| **Liquidez Corrente (LC)** | Ativo Circulante ÷ Passivo Circulante | LC > 1,0 = capacidade de pagar dívidas de curto prazo |
| **Liquidez Seca (LS)** | (Ativo Circulante − Estoque) ÷ Passivo Circulante | Mede liquidez sem depender dos estoques |
| **Liquidez Imediata (LI)** | (Caixa + Bancos + Aplicações) ÷ Passivo Circulante | Capacidade de pagamento imediata |

### Indicadores de Rentabilidade

| Indicador | Fórmula | Interpretação |
|-----------|---------|---------------|
| **Margem Bruta** | Lucro Bruto ÷ Receita Líquida × 100 | % de receita retida após custos de produção |
| **Margem Operacional** | EBIT ÷ Receita Líquida × 100 | % de receita retida após custos operacionais |
| **Margem Líquida** | Lucro Líquido ÷ Receita Líquida × 100 | % de receita convertida em lucro final |
| **ROA** | Lucro Líquido ÷ Total de Ativos × 100 | Retorno sobre o total de ativos |
| **ROE** | Lucro Líquido ÷ Patrimônio Líquido × 100 | Retorno sobre o capital dos sócios |

### Indicadores de Prazo Médio (Ciclo Operacional)

| Indicador | Fórmula | Interpretação |
|-----------|---------|---------------|
| **PME** (Prazo Médio de Estoques) | Estoque Médio ÷ CMV × 360 | Dias que o estoque fica na empresa |
| **PMR** (Prazo Médio de Recebimento) | Clientes ÷ Receita Bruta × 360 | Dias para receber dos clientes |
| **PMP** (Prazo Médio de Pagamento) | Fornecedores ÷ Compras × 360 | Dias para pagar os fornecedores |
| **Ciclo Financeiro** | PME + PMR − PMP | Dias que a empresa "financia" o ciclo por conta própria |

### Indicador Auxiliar

| Indicador | Descrição |
|-----------|-----------|
| **Compras** | Valor total de matéria-prima adquirida na rodada |

### Interpretação do Ciclo Financeiro

- **Ciclo negativo** → ótimo: empresa recebe antes de pagar (modelo de negócio eficiente)
- **Ciclo zero a 30 dias** → bom
- **Ciclo 31–60 dias** → aceitável
- **Ciclo >60 dias** → alto: empresa precisa de capital de giro próprio por muito tempo

---

## 16. Eventos Econômicos

O professor escolhe o evento no momento de criar ou editar uma rodada.

| Evento | Demanda | Custos | Estratégia sugerida |
|--------|---------|--------|---------------------|
| 📊 Mercado normal | ×1,00 | ×1,00 | Foco em eficiência operacional |
| 🚀 Crescimento econômico | +10% | ×1,00 | Aumentar produção e vendas |
| 📉 Crise econômica | -15% | ×1,00 | Reduzir produção, controlar custos |
| 📈 Inflação alta | -6% | +10% | Cuidado com margens; repassar custos |
| 💰 Incentivo fiscal | +6% | -4% | Bom momento para expandir |
| ⚠️ Escassez de matéria-prima | ×1,00 | +20% | Reduzir compras; otimizar estoque |
| 💵 Alta do dólar | ×1,00 | +8% | Pressão nos custos importados |
| ☀️ Alta temporada | +50% | ×1,00 | Máxima produção e vendas |
| 🌧️ Baixa temporada | -30% | ×1,00 | Minimizar produção; evitar estoque |
| 🎁 Lançamento de produto | +25% | ×1,00 | Aproveitar a janela de oportunidade |
| 🏭 Concorrência externa | -10% | ×1,00 | Diferenciar com marketing e preço |
| 🌿 Regulação ambiental | ×1,00 | +15% | Custos sobem; cuidado com margens |
| ♻️ Campanha de sustentabilidade | +12% | ×1,00 | Bom para vendas; explore o marketing |

---

## 17. Sistema de Pontuação

### Como o score é calculado

Cada empresa recebe uma pontuação de **0 a ~100 pontos** (mais bônus de market share).

**Fórmula base:**

```
Score = (LC × 20, máx 100) × 0,20
      + (LS × 22, máx 100) × 0,15
      + (LI × 30, máx 100) × 0,15
      + (ROA × 5, máx 100) × 0,25
      + (ML × 3, máx 100) × 0,15
      + max(0, 100 − Ciclo Financeiro) × 0,10
      + Market Share % × 0,05  ← bônus
```

*(Os pesos são os padrões; podem ser personalizados pelo professor nas Configurações)*

### Pesos padrão

| Indicador | Peso |
|-----------|------|
| Liquidez Corrente | 20% |
| Liquidez Seca | 15% |
| Liquidez Imediata | 15% |
| ROA | 25% |
| Margem Líquida | 15% |
| Ciclo Financeiro | 10% |
| Bônus Market Share | ~5% (fixo) |

### Conversão em nota

O score é convertido em nota acadêmica conforme a Escala de Notas (padrão ou personalizada).

---

## 18. Fluxo Completo de uma Rodada

```
┌─────────────────────────────────────────────────────┐
│  1. Professor cria rodada + define evento econômico  │
│     Status: "Não iniciada"                           │
└──────────────────────────┬──────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────┐
│  2. Professor abre a rodada                          │
│     Status: "Aberta"                                 │
│     Alunos são notificados e podem acessar o form    │
└──────────────────────────┬──────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────┐
│  3. Alunos preenchem o formulário de decisões        │
│     → Salvar rascunho (pode editar)                  │
│     → Enviar (bloqueia edição)                       │
└──────────────────────────┬──────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────┐
│  4. Professor acompanha envios em tempo real         │
│     Tracker atualiza a cada 10 segundos              │
└──────────────────────────┬──────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────┐
│  5. Professor encerra a rodada                       │
│     Status: "Encerrada"                              │
│     Novos envios não são mais aceitos                │
└──────────────────────────┬──────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────┐
│  6. Professor clica em "Processar Rodada"            │
│     Sistema calcula DRE, BP, KPIs, ranking, notas   │
│     Status: "Processada"                             │
└──────────────────────────┬──────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────┐
│  7. Resultados disponíveis para todos                │
│     Alunos veem: resultados, ranking, notas          │
│     Professor analisa: relatórios, gráficos, export  │
└─────────────────────────────────────────────────────┘
```

---

## 19. Procedimentos Operacionais

### Como atualizar o sistema

Sempre que uma nova versão for liberada pelo desenvolvedor:

```bash
git add .
git commit -m "descrição da mudança"
git push
```

A Vercel detecta o push e publica automaticamente em 1–2 minutos.

### Como verificar o status da publicação

Acesse **https://vercel.com** → faça login → procure o projeto **desafio-cfo** → veja o histórico de deploys.

### Se o sistema apresentar erro após atualização

1. Acesse o Vercel e veja os logs de build.
2. Se o erro for de banco de dados, acesse o **Supabase SQL Editor** e execute as migrations pendentes.

### Recuperação de senha do professor

O professor pode:
1. Trocar a própria senha em **Configurações → Segurança**.
2. Solicitar ao administrador Master a redefinição via **Painel Admin**.

### Criação de dados iniciais (seed)

Para criar dados de demonstração em produção:

Acesse no navegador:
```
https://desafio-cfo-gjpn.vercel.app/api/seed?secret=arena2024
```

Isso cria:
- 1 professor padrão
- 1 turma de demonstração
- 4 grupos com regiões diferentes
- 5 alunos de teste (RA: 1001, 1002, 2001, 3001, 4001 / Senha: 123456)
- 1 rodada inicial aberta

### Contato com suporte técnico

Em caso de problemas que não consigam ser resolvidos com este manual, registre:
1. O que estava fazendo no sistema
2. A mensagem de erro exibida (copie ou tire print)
3. O horário aproximado do ocorrido

---

*Manual do Professor — Arena Contábil v2.0*
*Atualizado em maio de 2026*
