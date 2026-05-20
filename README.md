# 🏆 Arena Contábil — Manual do Sistema

Simulador empresarial gamificado para Ciências Contábeis. Grupos de alunos atuam como empresas concorrentes (EcoBottle), tomando decisões financeiras por rodadas. O professor administra e avalia o jogo.

---

## 📋 Índice

1. [Acesso ao Sistema](#acesso)
2. [Fluxo de uma Rodada](#fluxo)
3. [Decisões do Formulário](#decisoes)
4. [Motor de Simulação](#motor)
5. [Depreciação Linear](#depreciacao)
6. [Pontuação (Score)](#score)
7. [Classificação Acadêmica](#classificacao)
8. [Relatórios Contábeis](#relatorios)
9. [Gamificação e Medalhas](#gamificacao)
10. [Rodando o Projeto](#rodando)

---

## 🔐 Acesso ao Sistema <a name="acesso"></a>

| Perfil | Login | Senha padrão |
|---|---|---|
| **Professor** | professor@arenacontabil.com | admin123 |
| **Aluno** | RA (ex: `1001`) | 123456 |

> Para alterar o e-mail do professor no banco: `UPDATE professors SET email = 'novo@email.com' WHERE email = 'professor@arenacontabil.com';`

---

## 🔄 Fluxo de uma Rodada <a name="fluxo"></a>

```
Professor cria rodada → status "Não iniciada"
Professor abre rodada → status "Aberta"
Aluno preenche formulário → salva rascunho
Aluno envia decisões → status "Enviada" (bloqueado para edição)
Professor acompanha envios em tempo real (polling 15s)
Professor encerra rodada → status "Encerrada"
Professor processa rodada → status "Processada"
Resultados liberados para todos os grupos
```

---

## 📝 Decisões do Formulário <a name="decisoes"></a>

Cada rodada, os grupos tomam decisões nas seguintes dimensões:

### Produção
| Campo | Descrição |
|---|---|
| Quantidade a Produzir | Limitada pela capacidade efetiva da fábrica |
| Funcionários | Quantidade de colaboradores |
| Custo médio salarial | Valor do salário por funcionário (R$) |

### Materiais (por unidade)
| Material | Campo |
|---|---|
| Plástico | Quantidade + preço unitário |
| Tampas | Quantidade + preço unitário |
| Embalagem | Quantidade + preço unitário |
| Rótulo | Quantidade + preço unitário |

### Vendas
| Campo | Descrição |
|---|---|
| Preço de Venda | Comparado com a média do mercado para calcular demanda |
| Vendas Esperadas | Estimativa do grupo |
| Desconto (%) | Reduz o preço líquido praticado |
| Prazo de Recebimento | Impacta o fluxo de caixa e o PMR |
| Investimento em Marketing | Aumenta a demanda (até +45%) |

### Compras e Fornecedores
| Campo | Descrição |
|---|---|
| Prazo de Pagamento | Impacta o fluxo de caixa e o PMP |

### Financeiro
| Campo | Descrição |
|---|---|
| Empréstimo | Valor captado + taxa de juros |
| Despesas Fixas | Aluguel, energia, etc. |
| Transporte | Custo logístico |
| Manutenção | Manutenção das máquinas |

### Investimento em Máquinas
| Máquina | Capacidade | Preço |
|---|---|---|
| Pequena ⚙️ | +10.000 un./rodada | R$ 20.000 |
| Média 🏭 | +20.000 un./rodada | R$ 40.000 |
| Grande 🏗️ | +60.000 un./rodada | R$ 80.000 |

**Formas de pagamento:**
- **À vista:** paga tudo no ato
- **3× sem juros (entrada):** 1/3 no ato + 2 parcelas futuras com juros de 2% a.m.

---

## ⚙️ Motor de Simulação <a name="motor"></a>

### Capacidade Produtiva
```
Capacidade Base: 2.000 unidades/rodada (fábrica inicial)
Capacidade Efetiva = Capacidade Base + Capacidade Acumulada de Máquinas
Produção Efetiva = min(Quantidade Desejada, Capacidade Efetiva, Materiais Disponíveis)
```

### Demanda e Vendas
```
Fator Preço      = max(0,6 ; 1 + ((PreçoMédioMercado - PreçoPraticado) / PreçoMédio) × 0,55)
Fator Marketing  = 1 + min(Marketing / 50.000 ; 0,45)
Fator Evento     = definido pelo professor na rodada
Fator Região     = multiplicador fixo por região

Demanda = VendasEsperadas × FatorPreço × FatorMarketing × FatorRegião × FatorEvento
Vendas Reais = min(Demanda, Produção Efetiva)
```

### DRE — Estrutura
```
(+) Receita Líquida de Vendas    = Qtd. Vendida × Preço Líquido
(-) CMV                          = Custo Materiais + Depreciação
  ↳ Custo dos Materiais           = Qtd. Vendida × Custo Unitário
  ↳ Depreciação (10% a.a.)        = Imobilizado Total × (10% ÷ 12)
(=) Lucro Bruto
(-) Despesas Operacionais
  ↳ Salários                      = Nº Funcionários × Salário Médio
  ↳ Marketing
  ↳ Transporte
  ↳ Manutenção
  ↳ Despesas Fixas
  ↳ Custo de Armazenagem (5%)     = 5% sobre o estoque não vendido
(=) EBIT (Lucro Operacional)
(-) Despesa Financeira            = Juros do Empréstimo + Juros das Parcelas de Máquinas
(=) LAIR (Lucro Antes do IR)
(-) IR (15%) + CSLL (9%)          = 24% sobre LAIR positivo
(=) Lucro / Prejuízo Líquido
```

### Custo de Armazenagem
Unidades produzidas e não vendidas geram custo de **5% sobre o valor do estoque acumulado** no período. Incentiva o planejamento correto da produção.

### Empréstimo Emergencial
Se o caixa final for negativo, o sistema aciona automaticamente um empréstimo emergencial para zerar o deficit. O valor é adicionado ao passivo e penaliza o score de liquidez.

---

## 📉 Depreciação Linear <a name="depreciacao"></a>

O sistema aplica depreciação linear conforme **NBC TG 27**:

| Parâmetro | Valor |
|---|---|
| Taxa anual | 10% |
| Vida útil | 10 anos |
| Taxa mensal | 10% ÷ 12 = **0,8333% a.m.** |
| Base de cálculo | Imobilizado de abertura + novos investimentos da rodada |

**Fórmula:**
```
Depreciação do Período = (Imobilizado Inicial + Novos Investimentos) × (10% ÷ 12)

Exemplo — Imobilizado R$ 150.000:
  Depreciação Anual  = R$ 150.000 × 10%     = R$ 15.000 / ano
  Depreciação Mensal = R$ 15.000 ÷ 12       = R$ 1.250 / mês (por rodada)
```

**Impacto nos relatórios:**
- **DRE:** compõe o CMV como custo de fabricação
- **Balanço Patrimonial:** reduz o Ativo Não Circulante (Imobilizado líquido)
- **Fluxo de Caixa:** **não representa saída de caixa** (ajuste não-caixa)

---

## 🎯 Pontuação (Score) <a name="score"></a>

O score de cada empresa é calculado com base em **6 indicadores financeiros** mais um bônus:

| Indicador | Peso | Fórmula |
|---|---|---|
| Liquidez Corrente | 20% | `min(Liq. Corrente × 20, 100) × 0,20` |
| Liquidez Seca | 15% | `min(Liq. Seca × 22, 100) × 0,15` |
| Liquidez Imediata | 15% | `min(Liq. Imediata × 30, 100) × 0,15` |
| ROA | 25% | `min(ROA × 5, 100) × 0,25` |
| Margem Líquida | 15% | `min(Margem Líquida × 3, 100) × 0,15` |
| Ciclo Financeiro | 10% | `max(0, 100 − Ciclo) × 0,10` |
| **Bônus Market Share** | +5% | `(Receita ÷ Maior Receita) × 100 × 0,05` |

> **Regras:** cada parcela é limitada a 100 pts antes do peso. ROA e Margem negativos valem zero. Ciclo Financeiro: quanto menor, melhor. Score máximo teórico: **105 pontos**.

---

## 🎓 Classificação Acadêmica <a name="classificacao"></a>

O score empresarial é convertido automaticamente em nota acadêmica:

| Score | Grau | Conceito | Nota |
|---|---|---|---|
| ≥ 75 | **AAA** | Excelente | **10,0** |
| ≥ 60 | **AA** | Muito Bom | **8,5** |
| ≥ 45 | **A** | Bom | **7,0** |
| ≥ 30 | **B** | Regular | **5,5** |
| ≥ 15 | **C** | Fraco | **4,0** |
| < 15 | **D** | Crítico | **2,0** |

A tabela de classificação aparece no **dashboard do professor** após o processamento da rodada.

---

## 📊 Relatórios Contábeis <a name="relatorios"></a>

Disponíveis para professor (todas as empresas) e aluno (somente a sua empresa):

### Balanço Patrimonial
```
ATIVO
  Circulante
    Caixa e Disponíveis
    Duplicatas a Receber
    Estoques
  Não Circulante
    Imobilizado (líquido de depreciação)

PASSIVO
  Circulante
    Fornecedores
    Empréstimos CP (35%)
    Financiamento de Máquinas
  Não Circulante
    Empréstimos LP (65%)

PATRIMÔNIO LÍQUIDO
  Capital Social
  Reserva de Lucros / Prejuízo Acumulado
```

> O balanço inclui auto-correção para resultados processados com versão anterior do engine (juros capitalizados no passivo).

### DRE — Demonstração do Resultado do Exercício
Estrutura detalhada conforme descrito na seção Motor de Simulação.

### Fluxo de Caixa (Método Direto)
```
FCO — Atividades Operacionais
  (+) Recebimentos de clientes
  (-) Pagamentos a fornecedores
  (-) Mão de obra
  (-) Despesas operacionais
  (-) Juros pagos
  (-) IR / CSLL
FCI — Atividades de Investimento
  (-) Aquisição de imobilizado
FCF — Atividades de Financiamento
  (+) Empréstimos captados
= Variação Líquida de Caixa
= Saldo Final de Caixa
```

> A depreciação não aparece como saída de caixa — é um ajuste não-caixa que afeta apenas o resultado e o imobilizado.

### Indicadores Calculados (13 KPIs)
| Indicador | Fórmula |
|---|---|
| Liquidez Corrente | Ativo Circulante ÷ Passivo Circulante |
| Liquidez Seca | (AC − Estoques) ÷ PC |
| Liquidez Imediata | Caixa ÷ PC |
| Margem Bruta | Lucro Bruto ÷ Receita |
| Margem Operacional | EBIT ÷ Receita |
| Margem Líquida | Lucro Líquido ÷ Receita |
| ROA | Lucro Líquido ÷ Ativo Total |
| ROE | Lucro Líquido ÷ PL |
| PME | (Estoque ÷ CMV) × 30 |
| PMR | (Clientes ÷ Receita) × 30 |
| PMP | (Fornecedores ÷ Compras) × 30 |
| Ciclo Financeiro | PME + PMR − PMP |
| Compras | CMV + Estoque Final − Estoque Inicial |

### Relatório de Produção e Estoque
Mostra para cada empresa: Produção Efetiva, Qtd. Vendida, Unidades Não Vendidas, Estoque Final, Custo Unitário e Taxa de Venda com análise contextual automática:

| Taxa de Venda | Situação | Cor |
|---|---|---|
| ≥ 90% | Excelente absorção de mercado | 🟢 Verde |
| 70–89% | Estoque parado — atenção ao planejamento | 🟡 Âmbar |
| < 70% | Superprodução crítica — capital imobilizado | 🔴 Vermelho |

### Exportação Excel
Todos os painéis de relatório possuem botão **Excel** que exporta os dados formatados:
- Ranking, Indicadores Detalhados
- Produção e Estoque
- Balanço Patrimonial, DRE, Fluxo de Caixa
- Análise Automática, Ranking Acumulado

---

## 🏅 Gamificação e Medalhas <a name="gamificacao"></a>

Ao processar cada rodada, o sistema atribui medalhas automáticas:
- 🥇 **Melhor CFO** — maior score da rodada
- 💧 **Melhor Liquidez** — maior liquidez corrente
- 📈 **Maior Receita** — maior receita líquida
- 💰 **Maior Lucro** — maior lucro líquido

### Ranking Acumulado
Soma os scores de todas as rodadas processadas. Reflete consistência ao longo do jogo, não apenas desempenho pontual. Disponível na página de Relatórios.

---

## 🚀 Rodando o Projeto <a name="rodando"></a>

### Pré-requisitos
- Node.js 18+
- Conta no Supabase (banco já configurado)

### Instalação
```bash
cd C:\Users\ednil\desafio-cfo
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Variáveis de Ambiente (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
JWT_SECRET=minimo_32_caracteres_aqui
PROFESSOR_DEFAULT_EMAIL=professor@arenacontabil.com
PROFESSOR_DEFAULT_PASSWORD=admin123
```

### Seed inicial (dados de demonstração)
Após logar como professor, clique em **"Inicializar dados demo"** no dashboard ou acesse:
```
POST /api/seed
```
Cria 4 grupos, alunos de teste e uma turma padrão.

### Banco de Dados
Execute a migration no Supabase SQL Editor:
```
supabase/migrations/001_initial_schema.sql
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Estilo | Tailwind CSS + Framer Motion |
| Gráficos | Recharts |
| Backend | Next.js API Routes |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | JWT customizado (cookie HTTP-only) |
| Exportação | xlsx (Excel) |

---

*Arena Contábil — Simulador Empresarial para Ciências Contábeis*
