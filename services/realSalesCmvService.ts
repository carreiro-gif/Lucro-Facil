import type { 
  BrendiOrder, 
  SalesTransaction, 
  CanonicalSale, 
  Product, 
  Ingredient, 
  Combo, 
  PeriodCmvResult 
} from '../types';
import { 
  normalizeBrendiOrder, 
  normalizeSalesTransactionsGrouped,
  getCanonicalSaleOriginId 
} from './canonicalSaleAdapter';
import { calculatePeriodCmv } from './cmvEngine';
import { isCorruptedBrendiImportTransaction } from '../utils/brendiReportParser';

export interface CollectRealSalesParams {
  brendiOrders?: BrendiOrder[];
  salesTransactions?: SalesTransaction[];
  period?: string; // Formato 'YYYY-MM', ex: '2026-09'
  excludeCancelledBrendiOrders?: boolean; // Padrão: true
  excludeCorruptedTransactions?: boolean; // Padrão: true
}

export interface CollectRealSalesStats {
  totalInputBrendiOrders: number;
  validBrendiOrders: number;
  cancelledBrendiOrders: number;
  totalInputSalesTransactions: number;
  validSalesTransactions: number;
  corruptedTransactionsDiscarded: number;
  brendiOriginDuplicatesDiscarded: number;
  groupedSalesFromTransactions: number;
  totalCanonicalSales: number;
}

export interface CollectRealSalesResult {
  canonicalSales: CanonicalSale[];
  stats: CollectRealSalesStats;
  sourcesBreakdown: {
    brendi: number;
    manual: number;
    spreadsheet: number;
    other: number;
  };
}

/**
 * Coleta todas as vendas reais disponíveis no sistema (pedidos do webhook Brendi/OpenDelivery
 * e transações de venda importadas/manuais), aplicando:
 * 1. Filtragem estrita de período (YYYY-MM);
 * 2. Expurgo de pedidos cancelados;
 * 3. Expurgo de artefatos/transações corrompidas de relatórios antigos;
 * 4. Deduplicação determinística rigorosa por originId, priorizando dados nativos do webhook;
 * 5. Agrupamento de linhas de itens pertencentes ao mesmo pedido;
 * 6. Preservação estrita dos dados reais, sem inventar valores.
 */
export function collectRealSales(params: CollectRealSalesParams): CollectRealSalesResult {
  const {
    brendiOrders = [],
    salesTransactions = [],
    period,
    excludeCancelledBrendiOrders = true,
    excludeCorruptedTransactions = true
  } = params;

  const canonicalSalesMap = new Map<string, CanonicalSale>();
  const knownBrendiIds = new Set<string>();

  let cancelledBrendiOrders = 0;
  let validBrendiOrders = 0;

  // 1. Processar BrendiOrders (Fonte primária de dados reais de integração)
  for (const order of brendiOrders) {
    if (period) {
      const orderMonth = (order.createdAt || '').slice(0, 7);
      if (orderMonth !== period) {
        continue;
      }
    }

    const isCancelled = order.status === 'CANCELLED' || order.status === 'CANCELLATION_REQUESTED';
    if (excludeCancelledBrendiOrders && isCancelled) {
      cancelledBrendiOrders++;
      continue;
    }

    validBrendiOrders++;

    // Registrar identificadores conhecidos para bloquear duplicatas vindas de importação
    if (order.id) knownBrendiIds.add(order.id.trim().toLowerCase());
    if (order.orderId) knownBrendiIds.add(order.orderId.trim().toLowerCase());
    if (order.displayId) knownBrendiIds.add(order.displayId.trim().toLowerCase());

    const canonicalSale = normalizeBrendiOrder(order);
    canonicalSalesMap.set(canonicalSale.originId, canonicalSale);
  }

  // 2. Processar SalesTransactions (Planilhas importadas e vendas manuais)
  let validSalesTransactions = 0;
  let corruptedTransactionsDiscarded = 0;
  let brendiOriginDuplicatesDiscarded = 0;

  const candidateTransactions: SalesTransaction[] = [];

  for (const tx of salesTransactions) {
    if (period) {
      const txMonth = (tx.date || '').slice(0, 7);
      if (txMonth !== period) {
        continue;
      }
    }

    if (excludeCorruptedTransactions && isCorruptedBrendiImportTransaction(tx)) {
      corruptedTransactionsDiscarded++;
      continue;
    }

    validSalesTransactions++;

    // Verificar se a transação representa um pedido Brendi que já existe na integração nativa
    const rawOrderId = (tx.orderId || '').trim();
    const rawTxId = (tx.id || '').trim();
    const isBrendiTagged = Boolean(
      rawTxId.startsWith('brendi_') || 
      rawOrderId.startsWith('BRD-') || 
      (tx as any).channel === 'brendi'
    );

    const cleanOrderId = rawOrderId ? rawOrderId.replace(/^brendi_/, '').trim().toLowerCase() : '';
    const cleanTxId = rawTxId ? rawTxId.replace(/^brendi_/, '').trim().toLowerCase() : '';

    const isDuplicateOfBrendi = isBrendiTagged && (
      (cleanOrderId && knownBrendiIds.has(cleanOrderId)) ||
      (cleanTxId && knownBrendiIds.has(cleanTxId)) ||
      (cleanOrderId && canonicalSalesMap.has(getCanonicalSaleOriginId('brendi', cleanOrderId)))
    );

    if (isDuplicateOfBrendi) {
      brendiOriginDuplicatesDiscarded++;
      continue;
    }

    candidateTransactions.push(tx);
  }

  // Agrupar transações com mesmo orderId em pedidos compostos
  const normalizedFromTransactions = normalizeSalesTransactionsGrouped(candidateTransactions);
  const groupedSalesFromTransactions = normalizedFromTransactions.length;

  for (const sale of normalizedFromTransactions) {
    // Evitar sobreposição caso originId já tenha sido registrado
    if (!canonicalSalesMap.has(sale.originId)) {
      canonicalSalesMap.set(sale.originId, sale);
    } else {
      brendiOriginDuplicatesDiscarded++;
    }
  }

  // Ordenar vendas cronologicamente
  const canonicalSales = Array.from(canonicalSalesMap.values()).sort((a, b) => {
    const dateA = a.orderDate || a.createdAt || '';
    const dateB = b.orderDate || b.createdAt || '';
    return dateA.localeCompare(dateB);
  });

  const sourcesBreakdown = {
    brendi: 0,
    manual: 0,
    spreadsheet: 0,
    other: 0
  };

  for (const s of canonicalSales) {
    if (s.source === 'brendi') sourcesBreakdown.brendi++;
    else if (s.source === 'manual') sourcesBreakdown.manual++;
    else if (s.source === 'spreadsheet') sourcesBreakdown.spreadsheet++;
    else sourcesBreakdown.other++;
  }

  return {
    canonicalSales,
    stats: {
      totalInputBrendiOrders: brendiOrders.length,
      validBrendiOrders,
      cancelledBrendiOrders,
      totalInputSalesTransactions: salesTransactions.length,
      validSalesTransactions,
      corruptedTransactionsDiscarded,
      brendiOriginDuplicatesDiscarded,
      groupedSalesFromTransactions,
      totalCanonicalSales: canonicalSales.length
    },
    sourcesBreakdown
  };
}

export interface CalculateRealSalesPeriodCmvParams extends CollectRealSalesParams {
  catalog: {
    products: Product[];
    ingredients: Ingredient[];
    combos?: Combo[];
  };
}

export interface RealSalesPeriodCmvOutput {
  period?: string;
  cmvResult: PeriodCmvResult;
  canonicalSales: CanonicalSale[];
  collectionStats: CollectRealSalesStats;
  sourcesBreakdown: CollectRealSalesResult['sourcesBreakdown'];
}

/**
 * Executa a integração ponta a ponta do cálculo de CMV Real:
 * 1. Coleta e normaliza as vendas reais de todas as fontes disponíveis;
 * 2. Deduplica deterministamente evitando duplicação entre webhook e relatórios importados;
 * 3. Envia o conjunto seguro de CanonicalSale ao cmvEngine;
 * 4. Retorna o resultado exato de CMV ponderado pelo mix real e volume vendido.
 * 
 * NÃO altera nenhuma variável ou fórmula do motor financeiro global do sistema.
 */
export function calculateRealSalesPeriodCmv(
  params: CalculateRealSalesPeriodCmvParams
): RealSalesPeriodCmvOutput {
  const { catalog, period, ...collectParams } = params;

  // 1. Coleta e normalização segura
  const collectionResult = collectRealSales({
    ...collectParams,
    period
  });

  // 2. Execução pura do motor de CMV Real
  const cmvResult = calculatePeriodCmv(
    collectionResult.canonicalSales, 
    catalog, 
    { period }
  );

  return {
    period,
    cmvResult,
    canonicalSales: collectionResult.canonicalSales,
    collectionStats: collectionResult.stats,
    sourcesBreakdown: collectionResult.sourcesBreakdown
  };
}
