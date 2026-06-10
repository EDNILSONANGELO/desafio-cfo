# Manual do Professor
## Arena Contábil — Business Accounting Simulator

**Versão:** 3.1 | **Plataforma:** https://desafio-cfo-gjpn.vercel.app

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
12. [Configurações da Rodada](#12-configurações-da-rodada)
13. [Painel Master (Administrador)](#13-painel-master-administrador)
14. [Mecânica da Simulação](#14-mecânica-da-simulação)
15. [Indicadores Financeiros](#15-indicadores-financeiros)
16. [Eventos Econômicos](#16-eventos-econômicos)
17. [Sistema de Pontuação — Cálculo Detalhado](#17-sistema-de-pontuação--cálculo-detalhado)
18. [Inteligência Competitiva Regional](#18-inteligência-competitiva-regional)
19. [Fluxo Completo de uma Rodada](#19-fluxo-completo-de-uma-rodada)
20. [Procedimentos Operacionais](#20-procedimentos-operacionais)

---

## 1. Visão Geral do Sistema

A **Arena Contábil** é um simulador empresarial gamificado voltado para o ensino de Ciências Contábeis. Os alunos formam grupos e atuam como gestores de empresas concorrentes do segmento de **garrafas sustentáveis (EcoBottle)**, tomando decisões financeiras a cada rodada de forma competitiva.

### Como funciona o jogo

- Cada **grupo** representa uma empresa com nome, região de atuação e características próprias de mercado.
- A cada **rodada**, os alunos preenchem um formulário com as decisões de gestão: produção, compras de matéria-prima, vendas por região, preços, inserções de marketing, contratações, máquinas e finanças.
- Ao encerrar a rodada, o professor processa os resultados e o sistema calcula automaticamente: DRE, Balanço Patrimonial, Fluxo de Caixa e 13 KPIs.
- As empresas são **ranqueadas** por pontuação calculada com base nos indicadores financeiros e convertida em **nota acadêmica** configurável.

### Conceito pedagógico

- Cada rodada = **um exercício fiscal completo** da empresa.
- O Balanço de encerramento de cada rodada vira o **Balanço de abertura** da próxima (carryover — Princípio da Continuidade Contábil).
- O aluno aprende na prática o impacto das decisões nos demonstrativos contábeis.

---

## 2. Acesso e Login

> **https://desafio-cfo-gjpn.vercel.app**

| Modo | Credencial | Acesso |
|------|------------|--------|
| **Professor** | E-mail + Senha | Gestão completa da turma |
| **Aluno** | RA + Senha | Formulário e resultados |
| **Master** | E-mail + Senha (admin) | Gestão de professores |

---

## 3. Painel Principal (Dashboard)

### KPI Cards

| Card | Descrição |
|------|-----------|
| Total de Alunos | Alunos cadastrados na turma |
| Grupos Ativos | Empresas configuradas |
| Rodada Atual | Nome e status da rodada em andamento |
| Envios Recebidos | Grupos que já enviaram na rodada ativa |

### Tracker de submissões

- **Cinza** — sem envio
- **Âmbar** — rascunho salvo (em edição)
- **Verde** — decisão enviada e bloqueada

### Gráficos

- **Score por Empresa** — barras ordenadas do maior para o menor score (com rótulo de valor)
- **Market Share** — pizza com fatia de receita líquida de cada empresa

---

## 4. Gerenciamento de Grupos e Empresas

Acesse: **Grupos**

| Campo | Descrição |
|-------|-----------|
| **Nome do grupo** | Identificação interna (ex: "Grupo 1") |
| **Nome da empresa** | Nome fictício (ex: "EcoBottle Norte") |
| **Região** | Nome da região de atuação |
| **Fator de demanda** | Multiplicador da demanda regional (1.0 = neutro) |
| **Fator de custo** | Multiplicador dos custos regionais (1.0 = neutro) |

---

## 5. Gerenciamento de Alunos

Acesse: **Alunos**

### Cadastro individual

Preencha: RA, nome, grupo, senha provisória → **Cadastrar Aluno**.

### Importação CSV

Arquivo com colunas: `ra`, `name`, `group_id`, `password`.

### Redefinir senha

1. Localize o aluno → ícone de chave (🔑).
2. Clique em **"Gerar Senha Temporária"**.
3. Informe verbalmente a senha gerada ao aluno (não é enviada por e-mail).
4. O aluno troca a senha no próximo login.

---

## 6. Rodadas

Acesse: **Rodadas**

| Status | Cor | Significado |
|--------|-----|-------------|
| **Não iniciada** | Cinza | Criada, aguardando abertura |
| **Aberta** | Verde | Alunos podem enviar decisões |
| **Encerrada** | Âmbar | Envios bloqueados, aguarda processamento |
| **Processada** | Ciano | Resultados publicados |

### Criar nova rodada

1. Clique em **Nova Rodada**.
2. Informe nome e evento econômico.
3. Clique em **Criar**.

---

## 7. Controle de uma Rodada

| Ação | Quando usar |
|------|-------------|
| **Abrir Rodada** | Iniciar período de envio |
| **Encerrar Rodada** | Bloquear novos envios |
| **Reabrir Rodada** | Permitir envios após encerramento |
| **Cancelar Envio de Grupo** | Desfazer envio de grupo específico |
| **Processar Resultados** | Calcular e publicar resultados |

**Atualização automática:** o tracker atualiza a cada 10 segundos.

---

## 8. Processamento de Resultados

Ao clicar em **"Processar Rodada"**, o sistema executa:

1. Carrega todas as submissões enviadas
2. Grupos sem envio recebem a decisão padrão automaticamente
3. Calcula preço médio de mercado
4. Aplica o evento econômico (fatores de demanda e custo)
5. **Distribui demanda competitivamente por região** (quando há vendas regionais)
6. Simula cada empresa: DRE, Balanço Patrimonial, Fluxo de Caixa, 13 KPIs
7. Calcula score ponderado para cada empresa
8. Gera ranking e converte em nota acadêmica
9. Atribui medalhas por destaque
10. Publica resultados e grava log de auditoria

### Após o processamento

- Status muda para **"Processada"**
- Alunos veem resultados em Resultados, Mercado e Notas
- Professor analisa em Relatórios, Mercado e Notas

---

## 9. Análise de Mercado

Acesse: **Mercado**

### Tabela "Perfil por Região — Comparativo Completo"

Exibe **todas as empresas** ordenadas por **Score** (melhor → pior) com todas as colunas: Score ★, Empresa, Região, Receita, Lucro, Margens, Liquidez, ROA, ROE, Ciclo e Market Share.

- Clique nas colunas para reordenar.
- Coluna **Score ★** fica logo após o `#` para visualização imediata.
- Exportação via botão **"Exportar Excel"**.

### Inteligência de Mercado Regional

Quando grupos usam vendas por região, aparece a seção com:
- **Card por região:** demanda total, total vendido, % de demanda não atendida
- **Tabela por empresa em cada região:** preço praticado, quantidade ofertada, quantidade vendida, market share e score competitivo
- Dados disponíveis após reprocessar com o novo motor competitivo

### Gráficos

- Score por empresa (barras com rótulos)
- Evolução histórica (linhas por empresa, múltiplas rodadas)

---

## 10. Relatórios

Acesse: **Relatórios**

### Seções disponíveis

**1. Ranking da rodada** — todos os indicadores, exportável

**2. Gráficos:** Score, Market Share, Balanço Patrimonial, Fluxo de Caixa

**3. DRE, Balanço e Fluxo de Caixa** por empresa — com exportação Excel por seção

**4. Relatório de Produção e Estoque**

| Coluna | Descrição |
|--------|-----------|
| Produção Efetiva | Unidades produzidas |
| Qtd. Vendida | Unidades efetivamente vendidas |
| Não Vendidas | Unidades em estoque |
| Estoque Final (R$) | `Unidades não vendidas × Custo unitário` (zerado quando tudo vendido) |

**5. Medalhas** por destaque

### Exportação

| Formato | Conteúdo |
|---------|----------|
| **PDF** | Relatório completo com gráficos e indicadores |
| **Excel (.xlsx)** | Múltiplas abas: ranking, DRE, balanço, fluxo de caixa, histórico |

---

## 11. Notas e Avaliação Acadêmica

Acesse: **Notas**

### Como as notas são calculadas — fluxo completo

```
Indicadores Financeiros → Pontuação (0-100) → Score ponderado → Grau → Nota
```

### Passo 1: Pontuação por indicador (0 a 100)

Cada indicador é convertido usando a fórmula e **teto de 100 pontos**. O multiplicador é calculado automaticamente: `multiplicador = 100 ÷ meta`.

**Metas e multiplicadores padrão:**

| Indicador | Fórmula padrão | Meta padrão | Multiplicador | Exemplo |
|-----------|---------------|-------------|---------------|---------|
| Liquidez Corrente | `min(LC × 66,67, 100)` | LC ≥ **1,5** | 66,67 | LC = 1,5 → 100 pts |
| Liquidez Seca | `min(LS × 66,67, 100)` | LS ≥ **1,5** | 66,67 | LS = 1,0 → 66,7 pts |
| Liquidez Imediata | `min(LI × 66,67, 100)` | LI ≥ **1,5** | 66,67 | LI = 0,75 → 50 pts |
| ROA | `min(ROA × 5, 100)` | ROA ≥ **20%** | 5,00 | ROA = 10% → 50 pts |
| Margem Líquida | `min(ML × 3, 100)` | ML ≥ **33,3%** | 3,00 | ML = 20% → 60 pts |
| Ciclo Financeiro | `max(0, 100 − max(0, ciclo))` | Ciclo ≤ **0 dias** | — | Ciclo 30d → 70 pts |

> **Regra:** indicadores negativos resultam em **0 pontos** naquele critério.
> **Ciclo Financeiro ≤ 0** sempre vale 100 pts. Para cada dia positivo, desconta-se 1 pt.

> **Metas configuráveis:** você pode personalizar as metas em **Configurações → Metas dos Indicadores**. O multiplicador é recalculado automaticamente. Após salvar, reprocesse as rodadas.

### Passo 2: Ponderação pelos pesos

Cada pontuação é multiplicada pelo peso configurado:

| Indicador | Peso padrão | Contribuição |
|-----------|-------------|-------------|
| ROA | 25% | pontuação × 0,25 |
| Liquidez Corrente | 20% | pontuação × 0,20 |
| Liquidez Seca | 15% | pontuação × 0,15 |
| Liquidez Imediata | 15% | pontuação × 0,15 |
| Margem Líquida | 15% | pontuação × 0,15 |
| Ciclo Financeiro | 10% | pontuação × 0,10 |

### Passo 3: Bônus de Market Share

```
Bônus = (Receita da empresa ÷ Maior receita da rodada) × 100 × 5%
```

Este bônus **não tem teto** — scores acima de 100 pts são possíveis.

### Passo 4: Conversão em nota

**Score Final = Σ(pontuação × peso) + Bônus Market Share**

| Score | Grau | Nota | Conceito |
|-------|------|------|---------|
| ≥ 75 | AAA | 10,0 | Excelente |
| ≥ 60 | AA | 8,5 | Muito Bom |
| ≥ 45 | A | 7,0 | Bom |
| ≥ 30 | B | 5,5 | Regular |
| ≥ 15 | C | 4,0 | Fraco |
| ≥ 0 | D | 2,0 | Crítico |

### Personalizar a escala de notas e pesos

1. Vá em **Notas → Metodologia de Pontuação**.
2. Ajuste **Score mínimo** e **Nota** para cada conceito.
3. Ajuste os **pesos** de cada indicador — a soma deve ser **100%**.
4. Clique em **Salvar**.

### Personalizar as metas dos indicadores

1. Vá em **Configurações → Metas dos Indicadores**.
2. Ajuste a **meta para 100 pontos** de cada indicador.
3. O sistema calcula o multiplicador automaticamente: `multiplicador = 100 ÷ meta`.
4. A fórmula gerada é exibida em tempo real na tabela.
5. Clique em **Salvar Metas**.

| Indicador | Meta padrão | Multiplicador padrão |
|-----------|------------|----------------------|
| Liquidez Corrente | 1,5 | 66,67 |
| Liquidez Seca | 1,5 | 66,67 |
| Liquidez Imediata | 1,5 | 66,67 |
| ROA | 20% | 5,00 |
| Margem Líquida | 33,33% | 3,00 |
| Ciclo Financeiro | 0 dias | — |

> **Após salvar novos pesos, metas ou escala, reprocesse as rodadas** para que os novos parâmetros sejam aplicados retroativamente.

> **Atenção:** as metas, os pesos e a escala configurados são exibidos para os alunos no menu **Notas** deles — isso é intencional para fins pedagógicos.

### Ajuste individual de nota

Na tabela de alunos, registre ajuste individual:
- **Nota ajustada** (pode ser maior ou menor que a nota do grupo)
- **Justificativa obrigatória** — visível para o aluno no menu Notas

### Painel de limiares (visível para professor e aluno)

A seção "Como o Aluno Atinge 100 Pontos" exibe os 6 cards com as regras de cada indicador — os alunos veem as mesmas regras no menu Notas deles.

---

## 12. Configurações da Rodada

Acesse: **Configurações → Configurações por Rodada**

Selecione a rodada e configure os seguintes parâmetros:

### Evento Econômico

Define o cenário de mercado para a rodada. Afeta fatores globais de demanda e custo (ver seção 16).

### Despesas Operacionais Travadas

| Campo | Efeito |
|-------|--------|
| Despesas Fixas | Aluno vê o valor mas não pode alterar |
| Transporte | Travado igualmente para todos |
| Manutenção | Travado igualmente para todos |
| Salário Médio | Travado igualmente para todos |

> Deixe em branco para que o aluno defina livremente.

### Custo de Materiais Travados

Trava os preços unitários de plástico, tampas, embalagem e rótulo. Útil para garantir que todos trabalhem com os mesmos insumos.

### Faixa de Preço de Venda

Define preço mínimo e/ou máximo que os alunos podem praticar.

### Marketing e Colaboradores

| Campo | Padrão | Descrição |
|-------|--------|-----------|
| Custo por inserção de marketing | R$ 1.500 | Valor pago pelo aluno por cada inserção |
| Colaboradores por 1.000 unid. | 3 | Mínimo de funcionários necessários |
| Encargos sobre folha (%) | 0% | FGTS, INSS patronal, etc. |

### Empréstimos — Limite e Taxa de Juros

| Campo | Padrão | Descrição |
|-------|--------|-----------|
| **Limite de empréstimo (R$)** | Sem limite | Valor máximo que cada grupo pode contrair |
| **Taxa de juros (%)** | Aluno define | Taxa mensal fixa aplicada aos empréstimos |

> Quando configurado, o aluno vê o limite e a taxa claramente no formulário. Se solicitar acima do limite, aparece a mensagem: *"Valor solicitado acima do limite permitido."*

### Adicional Inter-Regional

| Campo | Padrão | Descrição |
|-------|--------|-----------|
| **Custo por unidade (R$)** | R$ 3,00 | Custo adicional para vender fora da região de origem |

> Quando configurado, aparece mensagem informativa no formulário do aluno.

### SQL necessário no Supabase

Se os campos de Limite de Empréstimo, Taxa de Juros ou Inter-Regional não aparecerem na tela de Configurações, execute no **SQL Editor do Supabase** (Migration 010):

```sql
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS loan_limit          DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS inter_regional_cost DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS loan_rate           DECIMAL DEFAULT NULL;
```

> Esses campos já devem estar presentes em instalações novas. Execute somente se a tela exibir erro de coluna inexistente.

---

## 13. Painel Master (Administrador)

Acesse fazendo login com o **modo Master** (ícone de escudo).

- **Listar, criar, editar e excluir professores**
- **Vincular professores a polos/campi**
- **Redefinir senhas** de professores

### Como criar um professor

1. Clique em **Novo Professor**.
2. Preencha: nome, e-mail, senha inicial, polos.
3. Clique em **Salvar**.

---

## 14. Mecânica da Simulação

### Balanço de abertura (Rodada 1)

Todas as empresas iniciam com o mesmo balanço:

| Conta | Valor |
|-------|-------|
| Caixa e equivalentes | R$ 75.000 |
| Bancos | R$ 30.000 |
| Aplicações financeiras | R$ 20.000 |
| Clientes (a receber) | R$ 40.000 |
| **Estoques** | **R$ 0,00** |
| Imobilizado | R$ 150.000 |
| **Total Ativo** | **R$ 315.000** |
| Fornecedores | R$ 35.000 |
| Empréstimos | R$ 60.000 |
| **Capital Social** | **R$ 220.000** |

> **Estoque inicial = R$ 0,00:** se os alunos produzirem e venderem quantidades iguais, o estoque final será também R$ 0,00 (sem saldo fictício).

### Estoque — Fórmula correta

```
Estoque Final = (Estoque Inicial + Produção − Vendas Realizadas) × Custo Unitário
```

Se Produção = Vendas, Estoque Final = R$ 0,00.

### Imobilizado — apresentação contábil

O Balanço Patrimonial exibe separadamente:
- **Imobilizado (custo histórico)** — valor de aquisição acumulado
- **(−) Depreciação Acumulada** — 10% a.a. (método linear)
- **= Imobilizado Líquido**

### Carryover entre rodadas

| O que carrega | Como |
|---------------|------|
| Caixa | Saldo final → saldo inicial |
| Clientes | Parcelas a receber (prazo 30/60 dias) |
| Fornecedores | Parcelas a pagar (prazo 30/60 dias) |
| Estoques | Matéria-prima não usada + produto não vendido |
| Máquinas | Capacidade acumulada + parcelas de parcelamento |
| Funcionários | Quantidade líquida da rodada anterior |
| Patrimônio Líquido | Capital Social + resultado acumulado |

### Prazos de pagamento e recebimento

| Prazo | Efeito caixa atual | Próxima rodada | Posterior |
|-------|-------------------|----------------|-----------|
| 15 dias | 100% | — | — |
| 30 dias | 50% | 50% | — |
| 60 dias | 0% | 50% | 50% |

### Compra de máquinas

- **Máximo: 1 máquina por rodada** (sistema bloqueia automaticamente)
- **Operação imediata:** a máquina entra em operação na **mesma rodada** da compra
- **Pagamento:**
  - À vista: 100% pago nesta rodada
  - A prazo (3×): 33,33% nesta rodada + 33,33% na próxima + restante na seguinte (com juros de 2% a.m. sobre as 2 últimas parcelas)

| Máquina | Capacidade | Preço |
|---------|-----------|-------|
| ⚙️ Pequena | +10.000 unid./rodada | R$ 20.000 |
| 🏭 Média | +20.000 unid./rodada | R$ 40.000 |
| 🏗️ Grande | +60.000 unid./rodada | R$ 80.000 |

### Funcionários

- Padrão inicial: 6 funcionários
- Mínimo de funcionários necessários: `ceil(produção ÷ (1.000 ÷ machine_min_employees))` — padrão: 3 func./1.000 unid.
- Contratação: 1,5× salário (encargos + treinamento)
- Demissão: 1,2× salário (aviso prévio + multa FGTS)
- Quantidade líquida (após admissões e demissões) carrega para a próxima rodada

| Situação | Status | Efeito na produção |
|----------|--------|-------------------|
| < 65% dos necessários | 🔴 Greve | Produção cai 30% |
| < 85% dos necessários | 🟡 Alerta | Produção cai 10% |
| > 60% ociosos | 🔴 Greve | Greve por insatisfação |
| > 35% ociosos | 🟡 Alerta | Custo alto |

> **Dica pedagógica:** ajuste o campo **"Colaboradores por 1.000 unid."** nas Configurações para calibrar a dificuldade da gestão de pessoas ao longo do semestre.

### Marketing

- Custo padrão: R$ 1.500/inserção (configurável por rodada)
- Cada inserção: **+6% de boost na demanda regional** (cumulativo, cap em 8 inserções = +48%)
- Máximo: 8 inserções por região
- O boost de marketing regional também eleva a demanda total calculada pelo motor competitivo

---

## 15. Indicadores Financeiros

O sistema calcula automaticamente **13 indicadores** para cada empresa:

### Liquidez

| Indicador | Fórmula |
|-----------|---------|
| **Liquidez Corrente (LC)** | Ativo Circulante ÷ Passivo Circulante |
| **Liquidez Seca (LS)** | (AC − Estoques) ÷ Passivo Circulante |
| **Liquidez Imediata (LI)** | Caixa ÷ Passivo Circulante |

### Rentabilidade

| Indicador | Fórmula |
|-----------|---------|
| **Margem Bruta** | Lucro Bruto ÷ Receita Líquida × 100 |
| **Margem Operacional** | EBIT ÷ Receita Líquida × 100 |
| **Margem Líquida** | Lucro Líquido ÷ Receita Líquida × 100 |
| **ROA** | Lucro Líquido ÷ Total de Ativos × 100 |
| **ROE** | Lucro Líquido ÷ Patrimônio Líquido × 100 |

### Prazo Médio e Ciclo

| Indicador | Fórmula |
|-----------|---------|
| **PME** | Estoque ÷ CMV × 30 |
| **PMR** | Clientes ÷ Receita × 30 |
| **PMP** | Fornecedores ÷ Compras × 30 |
| **Ciclo Financeiro** | PME + PMR − PMP |

| Resultado | Classificação |
|-----------|--------------|
| ≤ 0 dias | Ótimo — empresa recebe antes de pagar |
| 1–30 dias | Bom |
| 31–60 dias | Aceitável |
| > 60 dias | Alto — requer capital de giro |

---

## 16. Eventos Econômicos

| Evento | Demanda | Custos | Quando usar pedagogicamente |
|--------|---------|--------|---------------------------|
| 📊 Mercado normal | ×1,00 | ×1,00 | Rodadas iniciais |
| 🚀 Crescimento econômico | +10% | — | Ensinar decisão de expansão |
| 📉 Crise econômica | −15% | — | Gestão de crise, corte de custos |
| 📈 Inflação alta | −6% | +10% | Repasse de custos ao preço |
| 💰 Incentivo fiscal | +6% | −4% | Momento de expansão |
| ⚠️ Escassez de matéria-prima | — | +20% | Gestão de estoque e fornecedores |
| 💵 Alta do dólar | — | +8% | Impacto de câmbio nos custos |
| ☀️ Alta temporada | +50% | — | Planejamento de capacidade |
| 🌧️ Baixa temporada | −30% | — | Gestão de caixa em períodos fracos |
| 🎁 Lançamento de produto | +25% | — | Aproveitamento de janela |
| 🏭 Concorrência externa | −10% | — | Diferenciação por preço/marketing |
| 🌿 Regulação ambiental | — | +15% | Custos de conformidade |
| ♻️ Campanha de sustentabilidade | +12% | — | Vantagem de nicho sustentável |

---

## 17. Sistema de Pontuação — Cálculo Detalhado

### Fórmula de conversão por indicador

```
Pontuação = min(valor × multiplicador, 100)
Multiplicador = 100 ÷ meta
```

**Valores padrão (configuráveis em Configurações → Metas dos Indicadores):**

| Indicador | Meta padrão | Multiplicador padrão | Limiar para 100 pts |
|-----------|------------|---------------------|---------------------|
| Liquidez Corrente | 1,5 | **66,67** | LC ≥ **1,5** |
| Liquidez Seca | 1,5 | **66,67** | LS ≥ **1,5** |
| Liquidez Imediata | 1,5 | **66,67** | LI ≥ **1,5** |
| ROA | 20% | **5,00** | ROA ≥ **20%** |
| Margem Líquida | 33,33% | **3,00** | ML ≥ **33,3%** |
| Ciclo Financeiro | 0 dias | — | Ciclo ≤ **0 dias** |

### Pontuação proporcional

Para valores abaixo da meta, a pontuação é proporcional:

| Exemplo | Cálculo (meta padrão 1,5) | Pontos |
|---------|--------------------------|--------|
| LC = 0,75 | 0,75 × 66,67 = 50 | **50 pts** |
| LC = 1,0 | 1,0 × 66,67 = 66,7 | **66,7 pts** |
| LC = 1,5 | 1,5 × 66,67 = 100 → meta | **100 pts** |
| ROA = 10% | 10 × 5 = 50 | **50 pts** |
| Ciclo = 30d | 100 − 30 = 70 | **70 pts** |
| Ciclo = −10d | max(0, 100 − max(0, −10)) = 100 | **100 pts** |

### Score final

```
Score = LC_pts × 0,20
      + LS_pts × 0,15
      + LI_pts × 0,15
      + ROA_pts × 0,25
      + ML_pts × 0,15
      + Ciclo_pts × 0,10
      + (Receita_empresa ÷ Maior_receita) × 100 × 0,05  ← bônus sem teto
```

> **Os pesos e as metas são os padrões e podem ser personalizados em Configurações → Pesos do Score e Metas dos Indicadores.**

### Exemplo de cálculo completo

| Indicador | Valor | Pontuação | Peso | Contribuição |
|-----------|-------|-----------|------|-------------|
| LC | 2,0 | min(2,0 × 66,67, 100) = 100 pts | 20% | 20,00 |
| LS | 1,5 | min(1,5 × 66,67, 100) = 100 pts | 15% | 15,00 |
| LI | 1,0 | 50 pts | 15% | 7,50 |
| ROA | 15% | 75 pts | 25% | 18,75 |
| ML | 25% | 75 pts | 15% | 11,25 |
| Ciclo | 20d | 80 pts | 10% | 8,00 |
| Market Share Bônus | 30% | — | +5% | +1,50 |
| **SCORE FINAL** | | | | **82,00 pts** |

Score 82,00 → **Grau AA → Nota 8,5**

---

## 18. Inteligência Competitiva Regional

Quando os alunos usam vendas por região, o sistema distribui a demanda de cada região de forma competitiva.

### Como o score competitivo funciona

Para cada região, o sistema calcula a pontuação competitiva de cada grupo:

| Fator | Peso | Fórmula |
|-------|------|---------|
| **Preço** | 50% | `(Preço max − Preço grupo) ÷ (Preço max − Preço min)` — menor preço = maior score |
| **Marketing** | 35% | `Inserções do grupo ÷ 8` |
| **Proximidade** | 15% | 1,0 se vende na própria região · 0,5 se fora |

```
Score Competitivo = 0,50 × priceScore + 0,35 × marketingScore + 0,15 × proximityScore
```

Score mínimo garantido: 0,05 (mesmo o grupo menos competitivo tem alguma chance).

### Distribuição da demanda

```
Demanda regional = Σ(quantidade ofertada) × fator_região × evento × boost_marketing
```

Cada grupo recebe uma fração da demanda proporcional ao seu score competitivo. O sistema redistribui automaticamente qualquer excedente para grupos com capacidade disponível.

### O que aparece no relatório de mercado

| Coluna | Descrição |
|--------|-----------|
| Qtd. Ofertada | O que o grupo colocou à venda naquela região |
| Qtd. Vendida | O que efetivamente vendeu após a distribuição competitiva |
| Market Share | % do total vendido na região |
| Score Competitivo | Força competitiva (0–100%) — barra colorida |

> **Verde ≥ 70%** · **Âmbar 40–69%** · **Vermelho < 40%**

---

## 19. Fluxo Completo de uma Rodada

```
1. Criar rodada + definir evento econômico
           ↓
2. Configurar parâmetros da rodada
   (travas, limites de empréstimo, taxa de juros, frete inter-regional)
           ↓
3. Abrir rodada → Status: "Aberta"
           ↓
4. Alunos preenchem e enviam decisões
   (o tracker mostra o status em tempo real)
           ↓
5. Encerrar rodada → Status: "Encerrada"
           ↓
6. Clicar em "Processar Rodada"
   → Distribuição competitiva regional
   → DRE, Balanço, Fluxo de Caixa
   → Score, Ranking, Notas, Medalhas
   → Status: "Processada"
           ↓
7. Resultados disponíveis para todos
   → Alunos: Resultados + Mercado + Notas
   → Professor: Relatórios + Mercado + Notas
```

---

## 20. Procedimentos Operacionais

### Migração do banco de dados (novos campos)

Se aparecer erro de coluna ao salvar configurações, execute no **Supabase SQL Editor**:

```sql
-- Migration 010 — Configurações de rodada (Ajustes 4, 7 e 10)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS loan_limit          DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS inter_regional_cost DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS loan_rate           DECIMAL DEFAULT NULL;
```

### Publicação de atualizações

```bash
git add .
git commit -m "descrição da mudança"
git push
```

A Vercel publica automaticamente em 1–2 minutos.

### Criação de dados iniciais (seed)

```
https://desafio-cfo-gjpn.vercel.app/api/seed?secret=arena2024
```

Cria: 1 professor · 1 turma · 4 grupos · 5 alunos de teste (RA: 1001–4001, senha: 123456) · 1 rodada inicial.

### Recuperação de senha do professor

1. Própria senha: **Configurações → Segurança**
2. Redefinição pelo Master: **Painel Admin → Professor → Redefinir senha**

### Contato com suporte técnico

Ao reportar um problema, informe:
1. O que estava fazendo no sistema
2. A mensagem de erro exibida (print ou cópia do texto)
3. O horário aproximado do ocorrido

---

---

## 21. Resumo das Configurações por Rodada

Referência rápida de todos os parâmetros configuráveis:

| Parâmetro | Campo no banco | Padrão | Efeito |
|-----------|---------------|--------|--------|
| Evento econômico | `event` | Mercado normal | Fatores de demanda e custo globais |
| Despesas fixas travadas | `fixed_expenses` | — | Aluno vê, não altera |
| Transporte travado | `transport` | — | Uniforme para todos |
| Manutenção travada | `maintenance` | — | Uniforme para todos |
| Salário médio travado | `labor_cost` | — | Uniforme para todos |
| Plástico (preço/kg) | `plastic_unit` | — | Trava o preço do material |
| Tampas (preço/unid.) | `caps_unit` | — | Trava o preço do material |
| Embalagem (preço/unid.) | `package_unit` | — | Trava o preço do material |
| Rótulo (preço/unid.) | `label_unit` | — | Trava o preço do material |
| Preço mínimo de venda | `min_sale_price` | — | Limite inferior do preço |
| Preço máximo de venda | `max_sale_price` | — | Limite superior do preço |
| Custo por inserção | `marketing_insertion_cost` | R$ 1.500 | Custo de cada inserção de marketing |
| Funcionários por 1.000 unid. | `machine_min_employees` | 3 | Mínimo de colaboradores necessários |
| Encargos sobre folha (%) | `payroll_charges_pct` | 0% | FGTS, INSS patronal, etc. |
| Limite de empréstimo (R$) | `loan_limit` | Sem limite | Valor máximo por rodada |
| Taxa de juros (%) | `loan_rate` | Aluno define | Taxa mensal fixa |
| Custo inter-regional (R$/unid.) | `inter_regional_cost` | R$ 3,00 | Logística fora da região de origem |

---

*Manual do Professor — Arena Contábil v3.1*
*Atualizado em junho de 2026*
