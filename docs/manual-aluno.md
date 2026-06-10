# Manual do Aluno
## Arena Contábil — Business Accounting Simulator

**Versão:** 3.1 | **Plataforma:** https://desafio-cfo-gjpn.vercel.app

---

## Sumário

1. [O que é a Arena Contábil?](#1-o-que-é-a-arena-contábil)
2. [Acesso e Primeiro Login](#2-acesso-e-primeiro-login)
3. [Painel do Aluno (Dashboard)](#3-painel-do-aluno-dashboard)
4. [Formulário de Decisões](#4-formulário-de-decisões)
   - 4.1 [Produção e Capacidade](#41-produção-e-capacidade)
   - 4.2 [Compra de Máquinas](#42-compra-de-máquinas)
   - 4.3 [Matéria-Prima](#43-matéria-prima)
   - 4.4 [Vendas Regionais](#44-vendas-regionais)
   - 4.5 [Marketing](#45-marketing)
   - 4.6 [Funcionários e RH](#46-funcionários-e-rh)
   - 4.7 [Gestão Financeira](#47-gestão-financeira)
   - 4.8 [Despesas Operacionais](#48-despesas-operacionais)
5. [Salvar e Enviar a Decisão](#5-salvar-e-enviar-a-decisão)
6. [Prévia dos Indicadores](#6-prévia-dos-indicadores)
7. [Tela de Resultados](#7-tela-de-resultados)
8. [Análise de Mercado](#8-análise-de-mercado)
9. [Indicadores Financeiros Explicados](#9-indicadores-financeiros-explicados)
10. [Como sua Nota é Calculada](#10-como-sua-nota-é-calculada)
    - 10.1 [Passo a passo do cálculo](#101-passo-a-passo-do-cálculo)
    - 10.2 [Exemplo completo](#102-exemplo-completo)
    - 10.3 [Tabela de metas para 100 pontos](#103-tabela-de-metas-para-100-pontos)
    - 10.4 [Conversão em nota](#104-conversão-em-nota)
    - 10.5 [Ajuste individual pelo professor](#105-ajuste-individual-pelo-professor)
11. [Menu Notas](#11-menu-notas)
12. [Dicas Estratégicas](#12-dicas-estratégicas)
13. [Regras do Jogo](#13-regras-do-jogo)
14. [Perguntas Frequentes](#14-perguntas-frequentes)

---

## 1. O que é a Arena Contábil?

A **Arena Contábil** é um simulador empresarial acadêmico em que você e seus colegas gerenciam empresas fictícias concorrentes do segmento de **garrafas sustentáveis (EcoBottle)**.

Você é o **CFO (Chief Financial Officer)** — o diretor financeiro da sua empresa. A cada rodada do jogo, você toma decisões reais de gestão:

- Quanto produzir de garrafas sustentáveis?
- Que materiais comprar e de quais fornecedores?
- Em quais regiões vender, a que preço e com quanto marketing?
- Contratar ou demitir funcionários?
- Investir em novas máquinas?

Ao final de cada rodada, o professor processa os resultados e o sistema gera automaticamente os **demonstrativos financeiros** da sua empresa: DRE, Balanço Patrimonial e Fluxo de Caixa. Você descobre sua **posição no ranking** e recebe sua **nota acadêmica**.

### Como você é avaliado?

A sua nota é calculada a partir dos seus **indicadores financeiros** — os mesmos usados por analistas de mercado e auditores no mundo real. Quanto melhor sua gestão, maiores os indicadores, maior o score e melhor a nota. Veja a seção 10 para o detalhamento completo do cálculo.

---

## 2. Acesso e Primeiro Login

### Endereço da plataforma

> **https://desafio-cfo-gjpn.vercel.app**

### Como fazer login

1. Acesse o endereço acima pelo computador, tablet ou celular.
2. Na tela de login, clique na aba **"Aluno (RA)"**.
3. Digite seu **RA** (Registro Acadêmico) — número de matrícula fornecido pelo professor.
4. Digite sua **senha** (inicial fornecida pelo professor).
5. Clique em **Entrar na plataforma**.

### Primeiro acesso — troca de senha obrigatória

Na primeira vez que entrar, o sistema redireciona automaticamente para a tela de **troca de senha**:

1. Digite a senha provisória que o professor lhe forneceu.
2. Digite uma nova senha de sua escolha (mínimo 6 caracteres).
3. Confirme a nova senha.
4. Clique em **Salvar nova senha**.

> **Guarde sua senha!** Se esquecê-la, somente o professor pode resetá-la.

---

## 3. Painel do Aluno (Dashboard)

Ao fazer login, você verá seu painel pessoal com:

- **Seu perfil:** nome, RA, turma, empresa, região e grupo
- **Card da rodada ativa:** status, evento econômico e botão "Preencher Formulário"
- **Resultado mais recente:** score, nota e posição no ranking
- **Histórico de rodadas:** todas as rodadas anteriores com link para resultados

---

## 4. Formulário de Decisões

O formulário é dividido em seções. Preencha todas antes de enviar.

> **Dica:** Salve rascunhos quantas vezes quiser. O envio definitivo só acontece ao clicar em "ENVIAR RODADA".

---

### 4.1 Produção e Capacidade

**Capacidade produtiva total**
Exibida automaticamente: capacidade base da fábrica + capacidade acumulada de todas as máquinas compradas em rodadas anteriores.

**Quantidade a produzir**
- Informe quantas garrafas deseja produzir nesta rodada.
- Não pode ultrapassar a capacidade total.
- Estoque da rodada anterior está incluído no total disponível para venda.

> **Fórmula do estoque final:**
> `Estoque Final = Estoque Inicial + Produção − Vendas Realizadas`
>
> Se produção = vendas e estoque inicial = 0, então estoque final = 0.

---

### 4.2 Compra de Máquinas

Para aumentar sua capacidade de produção, compre máquinas:

| Máquina | Capacidade adicional | Preço |
|---------|---------------------|-------|
| ⚙️ Pequena | +10.000 unidades/rodada | R$ 20.000 |
| 🏭 Média | +20.000 unidades/rodada | R$ 40.000 |
| 🏗️ Grande | +60.000 unidades/rodada | R$ 80.000 |

**Regras importantes:**
- **Máximo de 1 máquina por rodada.** Ao selecionar uma, os botões das outras ficam bloqueados.
- A máquina entra em operação **nesta mesma rodada** — a capacidade é imediata.

**Formas de pagamento:**

| Opção | Como funciona |
|-------|--------------|
| **À vista** | 100% pago nesta rodada |
| **A prazo (3×)** | 33,33% nesta rodada · 33,33% na próxima · restante na seguinte |

> O parcelamento tem incidência de juros (2% a.m.) sobre as 2 parcelas diferidas.

**Exemplo — Máquina R$ 90.000:**
- À vista: R$ 90.000 sai do caixa agora.
- A prazo: R$ 30.000 + R$ 30.000 (próx. rodada) + R$ 30.000 (rodada seguinte).

---

### 4.3 Matéria-Prima

Informe quanto de cada material deseja comprar para a produção desta rodada.

| Material | Unidade |
|----------|---------|
| Plástico reciclado | kg |
| Tampa | unidade |
| Embalagem | unidade |
| Rótulo | unidade |

**Prazo de pagamento ao fornecedor:**

| Prazo | Efeito no caixa |
|-------|----------------|
| **15 dias** | 100% pago nesta rodada |
| **30 dias** | 50% nesta rodada · 50% na próxima |
| **60 dias** | 0% nesta rodada · 50% na próxima · 50% na seguinte |

> Prazos mais longos melhoram o PMP e reduzem o Ciclo Financeiro, mas cuidado: com 60 dias não há saída de caixa imediata, mas a dívida existirá.

---

### 4.4 Vendas Regionais

Informe em quais regiões vender, quanto e a que preço.

| Campo | Descrição |
|-------|-----------|
| **Ativar a região** | Marque para vender naquela região |
| **Quantidade a vender** | Unidades planejadas para esta região |
| **Preço de venda (R$)** | Preço por garrafa nesta região |
| **Inserções de marketing** | 0 a 8 ações publicitárias nesta região |

**Competitividade regional:**
O sistema distribui a demanda de cada região proporcionalmente ao score competitivo de cada grupo que vende nela:

| Fator | Peso | Como funciona |
|-------|------|--------------|
| **Preço** | 50% | Preço menor = maior chance de venda |
| **Marketing** | 35% | Mais inserções = maior demanda |
| **Região de origem** | 15% | Vender na sua própria região dá vantagem |

**Custo inter-regional:**
Vender fora da sua região de origem gera custo adicional por unidade (valor definido pelo professor, padrão R$ 3,00/unidade).

**Prazo de recebimento dos clientes:**

| Prazo | Efeito no caixa |
|-------|----------------|
| **15 dias (à vista)** | 100% recebido nesta rodada |
| **30 dias** | 50% nesta rodada · 50% na próxima |
| **60 dias** | 0% nesta rodada · 50% na próxima · 50% na seguinte |

> Cuidado com prazo de 60 dias: sem receita em caixa nesta rodada, pode gerar déficit.

---

### 4.5 Marketing

**Inserções de marketing** representam ações publicitárias por região.

- **Custo padrão:** R$ 1.500 por inserção (pode ser diferente se o professor personalizou).
- **Efeito:** cada inserção adiciona **+6% de demanda** para o grupo naquela região.
- **Limite:** máximo de 8 inserções.

| Inserções | Boost de demanda |
|-----------|-----------------|
| 1–2 | +6% a +12% |
| 3–5 | +18% a +30% |
| 6–8 | +36% a +48% |

---

### 4.6 Funcionários e RH

**Funcionários atuais:** carregado da rodada anterior (rodada 1: começa com 6).

**Contratar / Demitir:**
- **Contratação:** custo = 1,5× salário médio por funcionário (encargos + treinamento).
- **Demissão:** custo = 1,2× salário médio por funcionário (aviso prévio + multa FGTS).

**Alertas do sistema:**

| Situação | Alerta | Efeito na produção |
|----------|--------|--------------------|
| < 65% dos necessários | 🔴 Greve | Produção cai 30% |
| < 85% dos necessários | 🟡 Alerta | Produção cai 10% |
| > 60% ociosos | 🔴 Greve | Greve por insatisfação |
| > 35% ociosos | 🟡 Alerta | Custo alto |

---

### 4.7 Gestão Financeira

**Empréstimos**
- Informe o valor de novos empréstimos (opcional).
- O professor pode configurar um **limite máximo** de empréstimo por rodada — o sistema mostrará esse limite abaixo do campo.
- Se o professor configurou uma **taxa de juros fixa**, ela aparece trancada no campo "Taxa de juros %".

> **Mensagem de alerta:** Se informar um valor acima do limite, aparecerá: *"Valor solicitado acima do limite permitido. Limite definido pelo professor: R$ X.XXX,XX"*

---

### 4.8 Despesas Operacionais

- **Despesas Fixas, Transporte, Manutenção:** se o professor travou um valor, aparece com badge "Fixo" (âmbar) e não pode ser alterado.
- **Salário médio:** valor pago por funcionário por rodada.

---

## 5. Salvar e Enviar a Decisão

### Salvar rascunho

- Clique em **"Salvar Rascunho"** a qualquer momento.
- Pode fechar e voltar depois sem perder nada.
- Editável enquanto a rodada estiver aberta e você não tiver enviado.

### Enviar a decisão (definitivo)

1. Verifique todos os campos.
2. Confira a **Prévia dos Indicadores**.
3. Clique em **"ENVIAR RODADA"**.
4. Confirme no modal de confirmação.

> **⚠️ Atenção:** Após confirmar o envio, a decisão fica **bloqueada para edição**. Somente o professor pode desfazer.

---

## 6. Prévia dos Indicadores

Enquanto você preenche o formulário, um painel exibe uma **prévia em tempo real** dos resultados estimados.

**DRE Estimada:** Receita → CMV → Lucro Bruto → Despesas → EBIT → Resultado Financeiro → Lucro Líquido

**Indicadores principais:** Liquidez Corrente/Seca/Imediata, Margens, ROA, ROE, Ciclo Financeiro

> Esta é uma estimativa baseada nas suas decisões. O resultado real depende também das decisões dos outros grupos (que afetam o preço médio de mercado).

---

## 7. Tela de Resultados

Acesse pelo menu lateral: **Resultados** (disponível após o professor processar a rodada).

### DRE — Demonstração do Resultado do Exercício

| Linha | Descrição |
|-------|-----------|
| Receita Líquida | Total de vendas × preço, após deduções |
| (−) CMV | Custo dos Materiais + Depreciação |
| = Lucro Bruto | Receita − CMV |
| (−) Despesas Operacionais | Fixas + Pessoal + Marketing + Armazenagem |
| = EBIT | Lucro Operacional |
| (±) Resultado Financeiro | Juros pagos/recebidos |
| = LAIR | Lucro Antes do IR |
| (−) IR + CSLL (24%) | 15% IR + 9% CSLL sobre LAIR positivo |
| = Lucro Líquido | Resultado final |

### Balanço Patrimonial

**Ativo Circulante:** Caixa · Clientes a Receber · Estoques  
**Ativo Não Circulante:**
- Imobilizado (custo histórico)
- (−) Depreciação Acumulada
- = Imobilizado Líquido

**Passivo Circulante:** Fornecedores · Empréstimos CP · Parcelas de Máquinas  
**Passivo Não Circulante:** Empréstimos LP  
**Patrimônio Líquido:** Capital Social + Resultado do Período

### Relatório de Produção e Estoque

| Coluna | Descrição |
|--------|-----------|
| Produção Efetiva | Unidades efetivamente produzidas |
| Qtd. Vendida | Unidades vendidas de fato |
| Não Vendidas | Unidades que foram para estoque |
| Estoque Final (R$) | `Unidades não vendidas × Custo unitário` |

> Se produção = vendas, Estoque Final = R$ 0,00.

### Fluxo de Caixa

**FCO** (Atividades Operacionais): recebimentos de clientes − pagamentos a fornecedores − mão de obra − despesas − IR/CSLL  
**FCI** (Investimentos): compra de máquinas + parcelas automáticas de máquinas anteriores  
**FCF** (Financiamento): empréstimos captados

---

## 8. Análise de Mercado

Acesse pelo menu lateral: **Mercado** (disponível após o professor processar a rodada).

### Tabela comparativa — Perfil por Região

Mostra **todos os grupos** ordenados por **Score** (do maior para o menor) com todos os indicadores.

A coluna **Score ★** aparece logo após o `#` — essa é a pontuação que determina sua nota.

### Inteligência de Mercado Regional

Se o professor usa vendas por região, aparece a seção **"Meu Desempenho Regional"** com:
- Quantidade ofertada vs. vendida em cada região
- Preço praticado e inserções de marketing
- **Score Competitivo** (0–100%): quanto mais alto, mais competitivo você foi naquela região
- Market Share por região

**Como o Score Competitivo é calculado:**

| Fator | Peso |
|-------|------|
| Preço (menor = melhor) | 50% |
| Inserções de marketing | 35% |
| Vender na própria região | 15% |

---

## 9. Indicadores Financeiros Explicados

### Liquidez

| Indicador | Fórmula | Meta |
|-----------|---------|------|
| **Liquidez Corrente (LC)** | Ativo Circulante ÷ Passivo Circulante | ≥ 2,0 |
| **Liquidez Seca (LS)** | (AC − Estoques) ÷ Passivo Circulante | ≥ 2,0 |
| **Liquidez Imediata (LI)** | Caixa ÷ Passivo Circulante | ≥ 2,0 |

### Rentabilidade

| Indicador | Fórmula |
|-----------|---------|
| **Margem Bruta** | Lucro Bruto ÷ Receita Líquida × 100 |
| **Margem Líquida** | Lucro Líquido ÷ Receita Líquida × 100 |
| **ROA** | Lucro Líquido ÷ Total do Ativo × 100 |
| **ROE** | Lucro Líquido ÷ Patrimônio Líquido × 100 |

### Ciclo Operacional

| Indicador | Fórmula | Meta |
|-----------|---------|------|
| **PME** (Prazo Médio Estoque) | Estoque ÷ CMV × 30 | Menor = melhor |
| **PMR** (Prazo Médio Recebimento) | Clientes ÷ Receita × 30 | Menor = melhor |
| **PMP** (Prazo Médio Pagamento) | Fornecedores ÷ Compras × 30 | Maior = melhor |
| **Ciclo Financeiro** | PME + PMR − PMP | Negativo = ótimo |

---

## 10. Como sua Nota é Calculada

A nota da Arena Contábil é 100% baseada nos **indicadores financeiros** da sua empresa — os mesmos utilizados por analistas de mercado e auditores no mundo real. Não há subjetividade: quanto melhor sua gestão financeira, maior o score e melhor a nota.

```
Indicadores Financeiros → Pontuação (0–100) → Score ponderado → Grau → Nota (0–10)
```

---

### 10.1 Passo a passo do cálculo

#### Passo 1 — O sistema calcula seus indicadores financeiros

Ao processar a rodada, o sistema gera automaticamente **6 indicadores** que serão usados na avaliação:

- Liquidez Corrente (LC)
- Liquidez Seca (LS)
- Liquidez Imediata (LI)
- ROA (Retorno sobre o Ativo)
- Margem Líquida (ML)
- Ciclo Financeiro (em dias)

---

#### Passo 2 — Cada indicador é convertido em pontuação (0 a 100)

Cada indicador tem uma **fórmula de conversão** e um **teto de 100 pontos**. Indicadores negativos valem 0 pontos.

| Indicador | Fórmula | Teto (100 pts) |
|-----------|---------|----------------|
| **Liquidez Corrente** | `LC × 50` | LC ≥ **2,0** |
| **Liquidez Seca** | `LS × 50` | LS ≥ **2,0** |
| **Liquidez Imediata** | `max(LI, 0) × 50` | LI ≥ **2,0** |
| **ROA** | `max(ROA, 0) × 5` | ROA ≥ **20%** |
| **Margem Líquida** | `max(ML, 0) × 3` | ML ≥ **33,3%** |
| **Ciclo Financeiro** | `max(0 ; 100 − max(0 ; ciclo))` | Ciclo ≤ **0 dias** |

**Exemplos rápidos:**

| Situação | Cálculo | Pontos |
|----------|---------|--------|
| LC = 1,5 | 1,5 × 50 = 75 | **75 pts** |
| LC = 2,0 ou mais | 2,0 × 50 = 100 → teto | **100 pts** |
| ROA = 8% | 8 × 5 = 40 | **40 pts** |
| ML = 25% | 25 × 3 = 75 | **75 pts** |
| Ciclo = 30 dias | 100 − 30 = 70 | **70 pts** |
| Ciclo = −5 dias | 100 − max(0,−5) = 100 | **100 pts** |
| ROA negativo | max(0, neg.) = 0 | **0 pts** |

---

#### Passo 3 — Cada pontuação é multiplicada pelo peso do critério

Os pesos determinam a importância relativa de cada indicador no score final:

| Indicador | Peso padrão | Fórmula da contribuição |
|-----------|-------------|------------------------|
| ROA | **25%** | Pontuação × 0,25 |
| Liquidez Corrente | **20%** | Pontuação × 0,20 |
| Liquidez Seca | **15%** | Pontuação × 0,15 |
| Liquidez Imediata | **15%** | Pontuação × 0,15 |
| Margem Líquida | **15%** | Pontuação × 0,15 |
| Ciclo Financeiro | **10%** | Pontuação × 0,10 |

> O professor pode personalizar os pesos para cada turma — os pesos vigentes são exibidos no menu **Notas**.

---

#### Passo 4 — Soma das contribuições + bônus de Market Share

```
Score Final = Σ(Pontuação × Peso) + Bônus Market Share
```

**Bônus de Market Share** (sem teto — scores acima de 100 são possíveis):

```
Bônus = (Receita da sua empresa ÷ Maior receita da rodada) × 100 × 5%
```

> Exemplo: sua receita corresponde a 60% da maior receita da rodada → Bônus = 60 × 5% = **3,0 pts**

---

### 10.2 Exemplo completo

Empresa com os seguintes resultados após uma rodada:

| Indicador | Valor apurado | Cálculo da pontuação | Pontuação | Peso | Contribuição |
|-----------|---------------|----------------------|-----------|------|-------------|
| Liquidez Corrente | 2,5 | min(2,5 × 50, 100) | **100** | 20% | **20,00** |
| Liquidez Seca | 2,0 | min(2,0 × 50, 100) | **100** | 15% | **15,00** |
| Liquidez Imediata | 1,0 | min(1,0 × 50, 100) | **50** | 15% | **7,50** |
| ROA | 15% | min(15 × 5, 100) | **75** | 25% | **18,75** |
| Margem Líquida | 25% | min(25 × 3, 100) | **75** | 15% | **11,25** |
| Ciclo Financeiro | 20 dias | max(0, 100 − 20) | **80** | 10% | **8,00** |
| **Subtotal** | | | | | **80,50** |
| Bônus Market Share | 30% da maior receita | 30 × 5% | — | — | **+1,50** |
| **SCORE FINAL** | | | | | **82,00 pts** |

Score **82,00** → Grau **AA** → **Nota 8,5**

---

### 10.3 Tabela de metas para 100 pontos

| Indicador | Meta para 100 pts | O que representa |
|-----------|-------------------|-----------------|
| Liquidez Corrente | LC ≥ **2,0** | Ativo Circulante = 2× o Passivo Circulante |
| Liquidez Seca | LS ≥ **2,0** | Mesma lógica, sem contar estoques |
| Liquidez Imediata | LI ≥ **2,0** | Só o caixa já cobre 2× o Passivo Circulante |
| ROA | ROA ≥ **20%** | Lucro = 20% do total de ativos |
| Margem Líquida | ML ≥ **33,3%** | 1 em cada 3 reais de receita vira lucro |
| Ciclo Financeiro | **≤ 0 dias** | Você recebe antes de precisar pagar |

---

### 10.4 Conversão em nota (escala padrão)

| Score | Grau | Nota (0–10) | Conceito |
|-------|------|-------------|----------|
| ≥ 75 pts | **AAA** | **10,0** | Excelente |
| ≥ 60 pts | **AA** | **8,5** | Muito Bom |
| ≥ 45 pts | **A** | **7,0** | Bom |
| ≥ 30 pts | **B** | **5,5** | Regular |
| ≥ 15 pts | **C** | **4,0** | Fraco |
| ≥ 0 pts | **D** | **2,0** | Crítico |

> A escala pode ser personalizada pelo professor. Os limiares vigentes são sempre exibidos no menu **Notas**.

---

### 10.5 Ajuste individual pelo professor

O professor pode ajustar sua nota individualmente (participação, pontualidade, qualidade das entregas). Quando isso ocorre:
- Sua nota individual aparece destacada em violeta no menu Notas
- A justificativa do ajuste é exibida para você

---

## 11. Menu Notas

Acesse pelo menu lateral: **Notas**.

### Cards exibidos

| Card | O que mostra |
|------|-------------|
| **Minha Nota Atual** | Nota mais recente (ajustada se houver ajuste individual) |
| **Posição no Ranking** | Sua posição e score na última rodada |
| **Score Médio** | Média de todas as rodadas |
| **Melhor Score** | Seu melhor desempenho |

### Formação da Nota do Grupo

Exibe a **tabela completa** de como o score foi calculado:
- Valor de cada indicador
- Pontuação obtida (0–100) com barra colorida
- Peso e contribuição de cada critério
- Fórmula de cálculo detalhada
- Pesos configurados pelo professor

### Como sua Nota é Calculada

Painel explicativo com 6 passos didáticos + **tabela de limiares** mostrando quando cada indicador atinge 100 pontos.

### Histórico por Rodada

Evolução completa com posição, score, grau, nota e lucro líquido em cada rodada.

> **Privacidade:** você visualiza **apenas sua nota e a nota do seu grupo**. As notas dos outros grupos não são exibidas.

---

## 12. Dicas Estratégicas

### Gestão de produção

- Produza próximo da demanda esperada — estoque gera custo (5% do valor).
- Se produção = vendas e estoque inicial = 0, o estoque final será **R$ 0,00**.
- Considere o evento econômico da rodada ao definir o volume.

### Política de preços e competitividade

- **Preço muito alto** → perde clientes para os concorrentes (50% do score competitivo).
- **Preço muito baixo** → atrai clientes mas pode destruir a margem de lucro.
- Combine preço competitivo com inserções de marketing para maximizar vendas.

### Gestão de prazos

- **Receber mais rápido** (PMR menor) → melhora o fluxo de caixa.
- **Pagar mais devagar** (PMP maior) → libera capital de giro.
- **Ciclo Financeiro ≤ 0 dias** → pontuação máxima (100 pts) neste critério.

### Para maximizar o score

| Indicador | Meta para 100 pts | Estratégia |
|-----------|-------------------|------------|
| Liquidez Corrente | LC ≥ **2,0** | Mantenha caixa e recebíveis altos; evite passivos desnecessários |
| Liquidez Seca | LS ≥ **2,0** | Produza próximo da demanda — estoque excessivo prejudica a LS |
| Liquidez Imediata | LI ≥ **2,0** | Prefira receber em 15 ou 30 dias para manter caixa alto |
| ROA | ROA ≥ **20%** | Gere lucro com ativos enxutos — evite máquinas desnecessárias |
| Margem Líquida | ML ≥ **33,3%** | Controle custos fixos e operacionais; ajuste o preço de venda |
| Ciclo Financeiro | ≤ **0 dias** | PMR curto (receber rápido) + PMP longo (pagar devagar) |

### Investimento em máquinas

- Máquina entra em operação **imediatamente** nesta rodada.
- Máximo **1 máquina por rodada**.
- Calcule se o aumento de produção/receita compensa o custo.
- Parcelamento gera juros nas 2 últimas parcelas.

---

## 13. Regras do Jogo

1. **Cada grupo envia apenas uma decisão por rodada.** Qualquer membro do grupo pode preencher e enviar.
2. **O envio é irreversível** — só o professor pode cancelar.
3. **Uma vez encerrada a rodada**, não é mais possível enviar.
4. **Grupos que não enviam** recebem automaticamente a decisão padrão (conservadora, nota baixa).
5. **Máximo 1 máquina por rodada** — o sistema bloqueia automaticamente.
6. **Empréstimo máximo por rodada** pode ser limitado pelo professor.
7. **Privacidade das notas:** você vê apenas sua nota e a do seu grupo.

---

## 14. Perguntas Frequentes

**P: Esqueci minha senha. O que faço?**
R: Fale com o professor. Ele pode gerar uma nova senha temporária.

**P: Posso editar o formulário depois de salvar o rascunho?**
R: Sim, enquanto a rodada estiver aberta e você não tiver enviado definitivamente.

**P: Posso editar depois de enviar?**
R: Não. Somente o professor pode cancelar o envio.

**P: O que acontece se meu grupo não enviar?**
R: O sistema usa a decisão padrão automaticamente. Geralmente resulta em nota baixa.

**P: A prévia dos indicadores é exata?**
R: É uma estimativa. O resultado real depende das decisões de todos os grupos e do evento econômico.

**P: Por que meu estoque final mostra R$ 0,00 se produzi e vendi igual?**
R: Correto! `Estoque Final = Produção − Vendas`. Se vendeu tudo, o estoque é zero.

**P: Por que meu score passou de 100?**
R: O bônus de Market Share não tem teto. Scores acima de 100 são possíveis e representam excelência total.

**P: Como vejo a formação da minha nota?**
R: Acesse o menu **Notas** → seção "Formação da Nota do Grupo". Lá você vê cada indicador, pontuação, peso e contribuição detalhados.

**P: Posso vender em mais de uma região?**
R: Sim! Ative múltiplas regiões na seção de Vendas Regionais. Vender fora da sua região de origem tem custo adicional definido pelo professor.

**P: O que é o Score Competitivo na análise de mercado?**
R: É uma pontuação de 0 a 100% que mostra o quanto você foi competitivo numa região comparado aos concorrentes. É baseado em preço (50%), marketing (35%) e proximidade regional (15%).

**P: Minha empresa pode ter prejuízo?**
R: Sim. Lucro negativo reduz o Patrimônio Líquido e afeta os indicadores negativamente. Use a prévia para evitar isso.

**P: O que acontece ao caixa entre rodadas?**
R: O saldo final vira saldo inicial da próxima rodada. O mesmo vale para estoques, clientes a receber, fornecedores a pagar, capacidade de máquinas e funcionários.

---

*Manual do Aluno — Arena Contábil v3.1*
*Atualizado em junho de 2026*
