import type { 
  CanonicalSale, 
  CanonicalSaleItem, 
  CanonicalSaleCmvItemResult, 
  CanonicalSaleCmvResult, 
  PeriodCmvResult, 
  Product, 
  Ingredient, 
  Combo 
} from '../types';

/**
 * Calcula o custo unitário real de um ingrediente/insumo considerando:
 * - Quantidade líquida após rendimento e fator de perda (lossPercent);
 * - Sub-receitas recursivas compostas por outros ingredientes;
 * - Prevenção contra dependências circulares.
 * 
 * Esta é a única fonte de verdade para custo do insumo.
 */
export function getIngredientRealCost(
  ing: Ingredient, 
  allIngredients: Ingredient[], 
  visited = new Set<string>()
): number {
  if (!ing.packageQuantity || ing.packageQuantity <= 0) return 0;

  if (visited.has(ing.id)) return 0;
  visited.add(ing.id);

  let basePrice = Number(ing.price || 0);

  // Sub-receita composta por outros insumos
  if (ing.isSubRecipe && ing.ingredients && ing.ingredients.length > 0) {
    basePrice = ing.ingredients.reduce((total, item) => {
      const subIng = allIngredients.find(i => i.id === item.ingredientId);
      if (!subIng) return total;
      const realPrice = getIngredientRealCost(subIng, allIngredients, new Set(visited));
      return total + (realPrice * Number(item.quantity || 0));
    }, 0);
  }

  const lossFactor = 1 - (Number(ing.lossPercent || 0) / 100);
  const realQty = Number(ing.packageQuantity) * lossFactor;
  if (realQty <= 0) return 0;

  return Number((basePrice / realQty).toFixed(4));
}

/**
 * Calcula o CMV unitário real de um produto a partir de sua ficha técnica.
 * NÃO inventa custos, NÃO aplica 32% e NÃO utiliza percentual médio.
 */
export function calculateProductCmv(
  prod: Product, 
  allIngredients: Ingredient[]
): { unitCmv: number; hasValidFicha: boolean; reason?: string } {
  if (!prod.ingredients || prod.ingredients.length === 0) {
    return {
      unitCmv: 0,
      hasValidFicha: false,
      reason: 'Produto sem ficha técnica cadastrada'
    };
  }

  let totalCost = 0;
  let missingIngredientsCount = 0;

  for (const item of prod.ingredients) {
    const ing = allIngredients.find(i => i.id === item.ingredientId);
    if (!ing) {
      missingIngredientsCount++;
      continue;
    }
    const cost = getIngredientRealCost(ing, allIngredients);
    totalCost += cost * Number(item.quantity || 0);
  }

  if (missingIngredientsCount > 0) {
    return {
      unitCmv: 0,
      hasValidFicha: false,
      reason: `Ficha técnica incompleta (${missingIngredientsCount} insumo(s) não encontrado(s) no cadastro)`
    };
  }

  return {
    unitCmv: Number(totalCost.toFixed(2)),
    hasValidFicha: true
  };
}

/**
 * Calcula o CMV unitário real de um combo a partir dos produtos que o compõem.
 */
export function calculateComboCmv(
  combo: Combo, 
  products: Product[], 
  ingredients: Ingredient[]
): { unitCmv: number; hasValidFicha: boolean; reason?: string } {
  if (!combo.items || combo.items.length === 0) {
    return {
      unitCmv: 0,
      hasValidFicha: false,
      reason: 'Combo sem produtos cadastrados'
    };
  }

  const itemCosts: number[] = [];

  for (const item of combo.items) {
    const prod = products.find(p => p.id === item.productId);
    if (!prod) {
      return {
        unitCmv: 0,
        hasValidFicha: false,
        reason: `Produto (ID: ${item.productId}) do combo não encontrado no catálogo`
      };
    }

    const prodCmvRes = calculateProductCmv(prod, ingredients);
    if (!prodCmvRes.hasValidFicha) {
      return {
        unitCmv: 0,
        hasValidFicha: false,
        reason: `Item '${prod.name}' do combo sem ficha técnica válida: ${prodCmvRes.reason}`
      };
    }

    itemCosts.push(prodCmvRes.unitCmv * Number(item.quantity || 1));
  }

  let cmvCombo = 0;
  if (combo.type === 'free_choice') {
    const sortedCosts = [...itemCosts].sort((a, b) => b - a);
    const freeChoiceCount = Number(combo.freeChoiceCount || 2);
    cmvCombo = sortedCosts.slice(0, freeChoiceCount).reduce((acc, val) => acc + val, 0);
  } else {
    cmvCombo = itemCosts.reduce((acc, val) => acc + val, 0);
  }

  cmvCombo += Number(combo.customPackagingCost || 0);

  return {
    unitCmv: Number(cmvCombo.toFixed(2)),
    hasValidFicha: true
  };
}

export interface MatchResult {
  matchType: 'product' | 'combo' | 'none';
  product?: Product;
  combo?: Combo;
  isAmbiguous?: boolean;
  reason?: string;
}

/**
 * Localiza produto ou combo no catálogo interno respeitando rigorosamente a ordem de prioridades:
 * 1. productId direto;
 * 2. sourceItemId direto;
 * 3. Nome exato normalizado (trim + lowercase).
 * 
 * PROIBIDO aceitar correspondência aproximada ambígua (ex: "X-Bacon" vs "X-Bacon Especial").
 */
export function findProductOrCombo(
  itemName: string, 
  productId: string | undefined, 
  sourceItemId: string | undefined, 
  products: Product[], 
  combos: Combo[] = []
): MatchResult {
  // Prioridade 1: productId
  if (productId) {
    const prodById = products.find(p => p.id === productId);
    if (prodById) return { matchType: 'product', product: prodById };

    const comboById = combos.find(c => c.id === productId);
    if (comboById) return { matchType: 'combo', combo: comboById };
  }

  // Prioridade 2: sourceItemId
  if (sourceItemId) {
    const prodBySource = products.find(p => p.id === sourceItemId);
    if (prodBySource) return { matchType: 'product', product: prodBySource };

    const comboBySource = combos.find(c => c.id === sourceItemId);
    if (comboBySource) return { matchType: 'combo', combo: comboBySource };
  }

  // Prioridade 3: Nome exato normalizado
  const cleanName = (itemName || '').trim().toLowerCase();
  if (!cleanName) {
    return { matchType: 'none', reason: 'Nome do item vazio' };
  }

  const matchingProducts = products.filter(p => p.name.trim().toLowerCase() === cleanName);
  const matchingCombos = combos.filter(c => c.name.trim().toLowerCase() === cleanName);

  const totalMatches = matchingProducts.length + matchingCombos.length;

  if (totalMatches === 1) {
    if (matchingProducts.length === 1) {
      return { matchType: 'product', product: matchingProducts[0] };
    }
    return { matchType: 'combo', combo: matchingCombos[0] };
  }

  if (totalMatches > 1) {
    return {
      matchType: 'none',
      isAmbiguous: true,
      reason: `Ambiguidade: múltiplos itens cadastrados com o nome exato '${itemName}'`
    };
  }

  // Sem correspondência exata. NUNCA fazer fuzzy guessing ambíguo.
  return {
    matchType: 'none',
    reason: `Produto ou combo não identificado no catálogo ('${itemName}')`
  };
}

/**
 * Calcula o CMV Real de uma venda canônica item por item.
 * Separa com transparência os valores identificados (com ficha técnica) dos pendentes.
 */
export function calculateCanonicalSaleCmv(
  sale: CanonicalSale, 
  catalog: { products: Product[]; ingredients: Ingredient[]; combos?: Combo[] }
): CanonicalSaleCmvResult {
  const products = catalog.products || [];
  const ingredients = catalog.ingredients || [];
  const combos = catalog.combos || [];

  const itemsResults: CanonicalSaleCmvItemResult[] = [];

  let totalCmv = 0;
  let matchedAmount = 0;
  let pendingAmount = 0;

  for (const it of sale.items || []) {
    const qty = Number(it.quantity || 1);
    const unitPrice = Number(it.unitPrice || 0);
    const saleTotal = typeof it.totalPrice === 'number' && !isNaN(it.totalPrice)
      ? it.totalPrice
      : Number((unitPrice * qty).toFixed(2));

    const match = findProductOrCombo(
      it.productName, 
      it.productId, 
      it.sourceItemId, 
      products, 
      combos
    );

    if (match.matchType === 'product' && match.product) {
      const prod = match.product;
      const fichaResult = calculateProductCmv(prod, ingredients);

      if (fichaResult.hasValidFicha) {
        const itemTotalCmv = Number((fichaResult.unitCmv * qty).toFixed(2));
        totalCmv += itemTotalCmv;
        matchedAmount += saleTotal;

        itemsResults.push({
          sourceItemName: it.productName,
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice,
          saleTotal,
          unitCmv: fichaResult.unitCmv,
          totalCmv: itemTotalCmv,
          status: 'complete'
        });
      } else {
        pendingAmount += saleTotal;
        itemsResults.push({
          sourceItemName: it.productName,
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice,
          saleTotal,
          status: 'pending',
          reason: fichaResult.reason || 'Produto sem ficha técnica válida'
        });
      }
    } else if (match.matchType === 'combo' && match.combo) {
      const combo = match.combo;
      const fichaResult = calculateComboCmv(combo, products, ingredients);

      if (fichaResult.hasValidFicha) {
        const itemTotalCmv = Number((fichaResult.unitCmv * qty).toFixed(2));
        totalCmv += itemTotalCmv;
        matchedAmount += saleTotal;

        itemsResults.push({
          sourceItemName: it.productName,
          comboId: combo.id,
          comboName: combo.name,
          quantity: qty,
          unitPrice,
          saleTotal,
          unitCmv: fichaResult.unitCmv,
          totalCmv: itemTotalCmv,
          status: 'complete'
        });
      } else {
        pendingAmount += saleTotal;
        itemsResults.push({
          sourceItemName: it.productName,
          comboId: combo.id,
          comboName: combo.name,
          quantity: qty,
          unitPrice,
          saleTotal,
          status: 'pending',
          reason: fichaResult.reason || 'Combo sem ficha técnica válida'
        });
      }
    } else {
      pendingAmount += saleTotal;
      itemsResults.push({
        sourceItemName: it.productName,
        quantity: qty,
        unitPrice,
        saleTotal,
        status: 'unmatched',
        reason: match.reason || 'Produto não identificado no catálogo'
      });
    }
  }

  // Determinação do status da venda
  const completeCount = itemsResults.filter(i => i.status === 'complete').length;
  let status: 'COMPLETE' | 'PARTIAL' | 'PENDING' = 'PENDING';

  if (itemsResults.length > 0) {
    if (completeCount === itemsResults.length) {
      status = 'COMPLETE';
    } else if (completeCount > 0) {
      status = 'PARTIAL';
    } else {
      status = 'PENDING';
    }
  }

  return {
    saleId: sale.id,
    originId: sale.originId,
    source: sale.source,
    orderDate: sale.orderDate,
    grossAmount: sale.grossAmount,
    totalAmount: sale.totalAmount,
    totalCmv: Number(totalCmv.toFixed(2)),
    matchedAmount: Number(matchedAmount.toFixed(2)),
    pendingAmount: Number(pendingAmount.toFixed(2)),
    status,
    items: itemsResults
  };
}

/**
 * Calcula o CMV Real do período somando os custos reais das vendas,
 * ponderado rigorosamente pelo mix e volume vendido, com proteção de duplicidade por originId.
 */
export function calculatePeriodCmv(
  sales: CanonicalSale[], 
  catalog: { products: Product[]; ingredients: Ingredient[]; combos?: Combo[] },
  options?: { period?: string }
): PeriodCmvResult {
  const seenOriginIds = new Set<string>();
  const salesResults: CanonicalSaleCmvResult[] = [];

  let totalRevenue = 0;
  let matchedRevenue = 0;
  let pendingRevenue = 0;
  let totalCmv = 0;

  let completeSalesCount = 0;
  let partialSalesCount = 0;
  let pendingSalesCount = 0;

  let completeItemsCount = 0;
  let pendingFichaItemsCount = 0;
  let unmatchedItemsCount = 0;

  for (const sale of sales || []) {
    // Deduplicação pelo originId determinístico
    if (sale.originId) {
      if (seenOriginIds.has(sale.originId)) {
        continue; // Ignora venda duplicada
      }
      seenOriginIds.add(sale.originId);
    }

    const saleResult = calculateCanonicalSaleCmv(sale, catalog);
    salesResults.push(saleResult);

    totalRevenue += Number(sale.totalAmount || 0);
    matchedRevenue += saleResult.matchedAmount;
    pendingRevenue += saleResult.pendingAmount;
    totalCmv += saleResult.totalCmv;

    if (saleResult.status === 'COMPLETE') completeSalesCount++;
    else if (saleResult.status === 'PARTIAL') partialSalesCount++;
    else pendingSalesCount++;

    for (const it of saleResult.items) {
      if (it.status === 'complete') completeItemsCount++;
      else if (it.status === 'pending') pendingFichaItemsCount++;
      else if (it.status === 'unmatched') unmatchedItemsCount++;
    }
  }

  const coveragePercent = totalRevenue > 0
    ? Number(((matchedRevenue / totalRevenue) * 100).toFixed(2))
    : 0;

  // CMV% real ponderado sobre a receita identificada
  const cmvPercent = matchedRevenue > 0
    ? Number(((totalCmv / matchedRevenue) * 100).toFixed(2))
    : 0;

  // CMV% global sobre o total de faturamento
  const cmvPercentOverall = totalRevenue > 0
    ? Number(((totalCmv / totalRevenue) * 100).toFixed(2))
    : 0;

  return {
    period: options?.period,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    matchedRevenue: Number(matchedRevenue.toFixed(2)),
    pendingRevenue: Number(pendingRevenue.toFixed(2)),
    coveragePercent,
    totalCmv: Number(totalCmv.toFixed(2)),
    cmvPercent,
    cmvPercentOverall,
    salesCount: salesResults.length,
    completeSalesCount,
    partialSalesCount,
    pendingSalesCount,
    completeItemsCount,
    pendingFichaItemsCount,
    unmatchedItemsCount,
    sales: salesResults
  };
}
