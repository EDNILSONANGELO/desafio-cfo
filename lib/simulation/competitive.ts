/**
 * Arena Contábil — Motor de Competitividade Regional
 *
 * Distribui a demanda de cada região entre os grupos que ofertam nela,
 * proporcionalmente à pontuação competitiva de cada um.
 *
 * Pesos do score competitivo:
 *   Preço:       50%  — menor preço relativo = maior score
 *   Marketing:   35%  — mais inserções = maior score
 *   Proximidade: 15%  — vender na própria região = vantagem de 1.0 vs 0.5
 */

import type { Group, Decision } from "@/types";

// ── Interfaces exportadas ────────────────────────────────────────────────────

/** Resultado de um grupo em uma região específica */
export interface RegionalCompetitorResult {
  groupId: number;
  groupName: string;
  company: string;
  region_name: string;       // nome da região (adicionado para carryover no grupo)
  isHomeRegion: boolean;
  offeredQty: number;
  soldQty: number;
  price: number;
  insertions: number;
  priceScore: number;
  marketingScore: number;
  proximityScore: number;
  competitiveScore: number;
  marketShare: number;       // soldQty / totalSold da região
}

/** Resultado da competição em uma região */
export interface RegionalCompetitionResult {
  region_name: string;
  demand_factor: number;
  totalDemand: number;       // demanda efetiva calculada para a região
  totalOffered: number;      // soma do ofertado por todos os grupos
  totalSold: number;         // total efetivamente vendido
  demandUnmet: number;       // demanda que não foi atendida
  competitors: RegionalCompetitorResult[];
}

/** Resultado competitivo agregado para um grupo (todas as regiões) */
export interface GroupCompetitiveResult {
  groupId: number;
  totalSoldQty: number;        // unidades vendidas no total
  totalNetRevenue: number;     // receita líquida total (preço × vendas × desconto)
  competitiveScore: number;    // score médio ponderado pelas vendas
  regionResults: RegionalCompetitorResult[];
}

// ── Entrada do algoritmo ─────────────────────────────────────────────────────

export interface CompetitiveEntry {
  group: Group;
  decision: Partial<Decision>;
  availableUnits: number;   // unidades disponíveis para venda nesta rodada
}

// ── Função principal ─────────────────────────────────────────────────────────

/**
 * Distribui a demanda regional competitivamente entre todos os grupos.
 *
 * Só é invocada quando pelo menos um grupo usa `regionalSales`.
 * Grupos sem regionalSales (salePrice + expectedSales plano) retornam
 * resultado neutro — o engine usa o cálculo individual existente.
 */
export function computeCompetitiveDistribution(
  entries: CompetitiveEntry[],
  eventDemandFactor: number = 1.0
): {
  groupResults: Map<number, GroupCompetitiveResult>;
  regionResults: RegionalCompetitionResult[];
} {
  // ── Coletar regiões únicas e demand_factors ──────────────────────────────
  const regionDemandFactors = new Map<string, number>();

  for (const { group, decision } of entries) {
    for (const rs of decision.regionalSales ?? []) {
      if (!rs.active || rs.qty <= 0 || rs.price <= 0) continue;
      // O demand_factor da região é registrado pelo grupo que mora nela
      if (group.region_name === rs.region_name) {
        regionDemandFactors.set(rs.region_name, group.region_demand ?? 1.0);
      }
    }
  }
  // Regiões onde nenhum grupo mora localmente: usa demand_factor do 1º grupo
  for (const { group, decision } of entries) {
    for (const rs of decision.regionalSales ?? []) {
      if (!regionDemandFactors.has(rs.region_name) && rs.active && rs.qty > 0) {
        regionDemandFactors.set(rs.region_name, group.region_demand ?? 1.0);
      }
    }
  }

  const allRegions = Array.from(regionDemandFactors.keys());
  const regionResults: RegionalCompetitionResult[] = [];

  // Rastrear unidades disponíveis restantes por grupo (decrementar conforme vende)
  const remainingUnits = new Map<number, number>(
    entries.map(({ group, availableUnits }) => [group.id, Math.max(0, availableUnits)])
  );

  // ── Processar cada região ────────────────────────────────────────────────
  for (const regionName of allRegions) {
    const demandFactor = regionDemandFactors.get(regionName) ?? 1.0;

    // Selecionar vendedores ativos nesta região
    type Seller = {
      entry: CompetitiveEntry;
      rs: NonNullable<Decision["regionalSales"]>[number];
    };
    const sellers: Seller[] = [];
    for (const entry of entries) {
      const rs = (entry.decision.regionalSales ?? []).find(
        (r) => r.region_name === regionName && r.active && r.qty > 0 && r.price > 0
      );
      if (rs) sellers.push({ entry, rs });
    }
    if (sellers.length === 0) continue;

    // ── Calcular scores competitivos ────────────────────────────────────
    const prices = sellers.map((s) => s.rs.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    const scoredSellers = sellers.map(({ entry, rs }) => {
      const isHome      = entry.group.region_name === regionName;
      const insertions  = Math.min(8, Math.max(0, Math.floor(Number(rs.insertions ?? 0))));

      // Score de preço [0, 1]: menor preço = score maior
      const priceScore = priceRange > 0
        ? (maxPrice - rs.price) / priceRange
        : 0.5;

      // Score de marketing [0, 1]: mais inserções = score maior
      const marketingScore = insertions / 8;

      // Score de proximidade: 1.0 se é a região de origem, 0.5 se não é
      const proximityScore = isHome ? 1.0 : 0.5;

      // Score composto (pesos: 50% preço | 35% marketing | 15% proximidade)
      const rawScore =
        0.50 * priceScore +
        0.35 * marketingScore +
        0.15 * proximityScore;

      // Score mínimo de 0.05: mesmo um concorrente fraco tem alguma chance
      const competitiveScore = Math.max(0.05, rawScore);

      return { entry, rs, isHome, insertions, priceScore, marketingScore, proximityScore, competitiveScore };
    });

    // ── Calcular demanda regional ────────────────────────────────────────
    // Demanda = total ofertado × fator_região × evento × boost_médio_marketing
    const totalOffered = sellers.reduce((s, { rs }) => s + rs.qty, 0);

    // Boost de marketing regional: média das inserções de todos os grupos nesta região
    const avgInsertions = sellers.reduce((s, { rs }) => s + Number(rs.insertions ?? 0), 0) / sellers.length;
    const marketingBoost = 1 + Math.min(avgInsertions * 0.06, 0.48); // +6% por inserção, cap 48%

    const regionalDemand = Math.round(totalOffered * demandFactor * eventDemandFactor * marketingBoost);

    // ── Distribuir demanda com redistribuição de excedente ───────────────
    const totalScore = scoredSellers.reduce((s, { competitiveScore }) => s + competitiveScore, 0);

    type Allocation = typeof scoredSellers[number] & {
      allocated: number;
      sold: number;
    };

    const allocations: Allocation[] = scoredSellers.map((ss) => ({
      ...ss,
      allocated: regionalDemand * ss.competitiveScore / totalScore,
      sold: 0,
    }));

    // Iteração de redistribuição: grupos que não absorvem sua alocação liberam o excedente
    for (let iter = 0; iter < 5; iter++) {
      let totalExcess = 0;
      let totalRemainingCapacity = 0;

      for (const a of allocations) {
        const available = Math.min(remainingUnits.get(a.entry.group.id) ?? 0, a.rs.qty);
        const capped    = Math.min(a.allocated, available);
        a.sold          = capped;
        totalExcess     += a.allocated - capped;
        totalRemainingCapacity += Math.max(0, available - capped);
      }

      if (totalExcess < 0.5 || totalRemainingCapacity < 0.5) break;

      // Redistribuir excedente proporcionalmente à capacidade restante
      for (const a of allocations) {
        const available   = Math.min(remainingUnits.get(a.entry.group.id) ?? 0, a.rs.qty);
        const remainCap   = Math.max(0, available - a.sold);
        if (remainCap > 0) {
          a.allocated += totalExcess * (remainCap / totalRemainingCapacity);
        }
      }
    }

    // ── Finalizar resultados da região ───────────────────────────────────
    const competitorResults: RegionalCompetitorResult[] = [];
    let totalSold = 0;

    for (const a of allocations) {
      const soldQty = Math.round(a.sold);
      totalSold += soldQty;

      // Decrementar disponível do grupo
      const prev = remainingUnits.get(a.entry.group.id) ?? 0;
      remainingUnits.set(a.entry.group.id, Math.max(0, prev - soldQty));

      competitorResults.push({
        groupId:          a.entry.group.id,
        groupName:        a.entry.group.name,
        company:          a.entry.group.company_name,
        region_name:      regionName,
        isHomeRegion:     a.isHome,
        offeredQty:       a.rs.qty,
        soldQty,
        price:            a.rs.price,
        insertions:       a.insertions,
        priceScore:       a.priceScore,
        marketingScore:   a.marketingScore,
        proximityScore:   a.proximityScore,
        competitiveScore: a.competitiveScore,
        marketShare:      0,  // calculado abaixo
      });
    }

    // Market share dentro da região
    for (const c of competitorResults) {
      c.marketShare = totalSold > 0 ? c.soldQty / totalSold : 0;
    }

    regionResults.push({
      region_name:  regionName,
      demand_factor: demandFactor,
      totalDemand:  regionalDemand,
      totalOffered,
      totalSold,
      demandUnmet:  Math.max(0, regionalDemand - totalSold),
      competitors:  competitorResults,
    });
  }

  // ── Agregar resultados por grupo ─────────────────────────────────────────
  const groupResults = new Map<number, GroupCompetitiveResult>();

  for (const { group, decision } of entries) {
    const myRegionResults: RegionalCompetitorResult[] = [];
    let totalSoldQty   = 0;
    let totalNetRevenue = 0;
    const discount = Number(decision.discount ?? 0) / 100;

    for (const rr of regionResults) {
      const mine = rr.competitors.find((c) => c.groupId === group.id);
      if (mine) {
        myRegionResults.push(mine);
        totalSoldQty   += mine.soldQty;
        totalNetRevenue += mine.soldQty * mine.price * (1 - discount);
      }
    }

    // Score médio ponderado pelas vendas em cada região
    const competitiveScore = totalSoldQty > 0
      ? myRegionResults.reduce((s, r) => s + r.competitiveScore * r.soldQty, 0) / totalSoldQty
      : 0;

    groupResults.set(group.id, {
      groupId: group.id,
      totalSoldQty,
      totalNetRevenue,
      competitiveScore,
      regionResults: myRegionResults,
    });
  }

  return { groupResults, regionResults };
}

// ── Verifica se algum grupo usa vendas regionais ─────────────────────────────

/**
 * Retorna true se pelo menos 1 grupo tem regionalSales ativos.
 * Se nenhum usa regionalSales, o motor competitivo não é invocado.
 */
export function hasRegionalSales(entries: CompetitiveEntry[]): boolean {
  return entries.some(({ decision }) =>
    (decision.regionalSales ?? []).some((rs) => rs.active && rs.qty > 0 && rs.price > 0)
  );
}
