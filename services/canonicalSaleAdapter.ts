import type { 
  BrendiOrder, 
  CanonicalSale, 
  CanonicalSaleItem, 
  CanonicalSaleSource, 
  CanonicalSaleSourceType,
  SalesTransaction
} from '../types';

/**
 * Retorna o identificador determinístico da venda canônica para evitar duplicidade.
 * O mesmo pedido/venda de uma mesma origem sempre produzirá exatamente o mesmo originId.
 */
export function getCanonicalSaleOriginId(source: string, externalId: string): string {
  const cleanSource = (source || 'unknown').trim().toLowerCase();
  const cleanId = (externalId || '').trim();

  if (cleanSource === 'brendi') {
    return `brendi_order_${cleanId}`;
  }
  if (cleanSource === 'manual') {
    return `manual_sale_${cleanId}`;
  }
  if (cleanSource === 'spreadsheet') {
    return `spreadsheet_${cleanId}`;
  }

  return `${cleanSource}_order_${cleanId}`;
}

/**
 * Adaptador de normalização para pedidos do Brendi / OpenDelivery.
 * Transforma uma instância de BrendiOrder em CanonicalSale, preservando
 * estritamente os dados reais capturados, sem calcular taxas paramétricas,
 * sem aplicar CFI, sem calcular CMV e sem inventar dados ausentes.
 */
export function normalizeBrendiOrder(order: BrendiOrder): CanonicalSale {
  const externalId = (order.orderId || order.id || '').trim();
  const originId = getCanonicalSaleOriginId('brendi', externalId);

  // Normalização estrita dos itens
  const items: CanonicalSaleItem[] = (order.items || []).map((item) => {
    const unitPrice = Number(item.unitPrice || 0);
    const quantity = Number(item.quantity || 1);
    const totalPrice = typeof item.totalPrice === 'number' && !isNaN(item.totalPrice)
      ? item.totalPrice
      : Number((unitPrice * quantity).toFixed(2));

    const canonicalItem: CanonicalSaleItem = {
      productName: item.name,
      quantity,
      unitPrice,
      totalPrice
    };

    if (item.id) {
      canonicalItem.sourceItemId = item.id;
    }
    if (item.notes) {
      canonicalItem.notes = item.notes;
    }

    return canonicalItem;
  });

  // Cálculo do grossAmount a partir de dados reais existentes
  let grossAmount: number;
  if (typeof order.subtotal === 'number' && !isNaN(order.subtotal)) {
    grossAmount = order.subtotal;
  } else if (items.length > 0) {
    const sumItems = items.reduce((acc, it) => acc + it.totalPrice, 0);
    grossAmount = Number(sumItems.toFixed(2));
  } else {
    grossAmount = Number(order.total || 0);
  }

  // Montagem do objeto canônico
  const canonicalSale: CanonicalSale = {
    id: order.id,
    originId,
    source: 'brendi',
    sourceType: 'integration',
    orderDate: order.createdAt,
    grossAmount,
    totalAmount: Number(order.total || 0),
    items
  };

  if (order.createdAt) {
    canonicalSale.createdAt = order.createdAt;
  }
  if (order.updatedAt) {
    canonicalSale.updatedAt = order.updatedAt;
  }
  if (order.status) {
    canonicalSale.status = order.status;
  }
  if (order.channel) {
    canonicalSale.channel = order.channel;
  }
  if (typeof order.discountAmount === 'number' && !isNaN(order.discountAmount) && order.discountAmount > 0) {
    canonicalSale.discountAmount = order.discountAmount;
  }
  if (typeof order.couponAmount === 'number' && !isNaN(order.couponAmount) && order.couponAmount > 0) {
    canonicalSale.couponAmount = order.couponAmount;
  }
  if (typeof order.deliveryFee === 'number' && !isNaN(order.deliveryFee) && order.deliveryFee >= 0) {
    canonicalSale.deliveryFee = order.deliveryFee;
  }
  if (typeof order.serviceFee === 'number' && !isNaN(order.serviceFee) && order.serviceFee >= 0) {
    canonicalSale.serviceFee = order.serviceFee;
  }
  if (order.payments && order.payments.length > 0) {
    canonicalSale.payments = order.payments;
  }
  if (order.fees && order.fees.length > 0) {
    canonicalSale.fees = order.fees;
  }
  if (order.customerName || order.customerPhone) {
    canonicalSale.customer = {
      name: order.customerName,
      phone: order.customerPhone
    };
  }
  if (order.deliveryType) {
    canonicalSale.deliveryType = order.deliveryType;
  }
  if (order.merchantId) {
    canonicalSale.merchantId = order.merchantId;
  }
  if (order.userId) {
    canonicalSale.userId = order.userId;
  }

  // Metadados auxiliares não-sensíveis
  const metadata: Record<string, any> = {};
  if (order.displayId) {
    metadata.displayId = order.displayId;
  }
  if (order.hasCoupon !== undefined) {
    metadata.hasCoupon = order.hasCoupon;
  }
  if (order.processed !== undefined) {
    metadata.processed = order.processed;
  }
  if (Object.keys(metadata).length > 0) {
    canonicalSale.metadata = metadata;
  }

  return canonicalSale;
}

/**
 * Adaptador de normalização para transações individuais de vendas (SalesTransaction).
 * Permite processar vendas manuais e importações de planilhas.
 * Se o registro foi derivado de um pedido Brendi (tendo orderId correspondente ou prefixo brendi_),
 * o adapter preserva o originId canônico 'brendi_order_{orderId}', garantindo a deduplicação.
 */
export function normalizeSalesTransaction(tx: SalesTransaction): CanonicalSale {
  const isFromBrendi = Boolean(
    tx.id?.startsWith('brendi_') || 
    (tx.orderId && tx.orderId.startsWith('BRD-'))
  );

  let source: CanonicalSaleSource = 'spreadsheet';
  let sourceType: CanonicalSaleSourceType = 'import';

  if (isFromBrendi) {
    source = 'brendi';
    sourceType = 'integration';
  } else if (tx.channel === 'store' || tx.id?.startsWith('manual_')) {
    source = 'manual';
    sourceType = 'manual';
  }

  const rawExtId = (tx.orderId || tx.id || '').trim();
  const cleanExtId = isFromBrendi ? rawExtId.replace(/^brendi_/, '') : rawExtId;
  const originId = getCanonicalSaleOriginId(source, cleanExtId);

  const qty = Number(tx.qty || 1);
  const unitPrice = Number(tx.pricePaidByCustomer || 0);
  const totalAmount = typeof tx.totalAmount === 'number' && !isNaN(tx.totalAmount)
    ? tx.totalAmount
    : Number((unitPrice * qty).toFixed(2));

  const items: CanonicalSaleItem[] = [];
  if (tx.productName || tx.productId) {
    items.push({
      productId: tx.productId && tx.productId !== 'temp_unregistered' ? tx.productId : undefined,
      productName: tx.productName || 'Item sem nome',
      quantity: qty,
      unitPrice,
      totalPrice: totalAmount,
      notes: tx.notes
    });
  }

  const canonicalSale: CanonicalSale = {
    id: tx.id,
    originId,
    source,
    sourceType,
    orderDate: tx.date || new Date().toISOString(),
    grossAmount: totalAmount,
    totalAmount,
    channel: tx.channel,
    status: 'CONCLUDED',
    items
  };

  if (tx.couponCostByStore && tx.couponCostByStore > 0) {
    canonicalSale.couponAmount = Number(tx.couponCostByStore.toFixed(2));
  }
  if (tx.feePaid && tx.feePaid > 0) {
    canonicalSale.fees = [{
      type: 'channelFee',
      amount: Number(tx.feePaid.toFixed(2)),
      sourceType: 'real',
      description: 'Taxa informada na transação de venda'
    }];
  }

  return canonicalSale;
}

/**
 * Normaliza um lote de transações de venda (SalesTransaction[]) agrupando
 * itens que pertencem ao mesmo pedido (mesmo orderId) em uma única CanonicalSale
 * com múltiplos itens, preservando integridade de dados e evitando colisões de originId.
 */
export function normalizeSalesTransactionsGrouped(transactions: SalesTransaction[]): CanonicalSale[] {
  const groupedMap = new Map<string, SalesTransaction[]>();
  const ungrouped: SalesTransaction[] = [];

  for (const tx of transactions) {
    const rawOrderId = (tx.orderId || '').trim();
    if (rawOrderId) {
      const list = groupedMap.get(rawOrderId) || [];
      list.push(tx);
      groupedMap.set(rawOrderId, list);
    } else {
      ungrouped.push(tx);
    }
  }

  const result: CanonicalSale[] = [];

  // 1. Pedidos com múltiplos itens agrupados por orderId
  for (const [orderId, txGroup] of groupedMap.entries()) {
    if (txGroup.length === 1) {
      result.push(normalizeSalesTransaction(txGroup[0]));
      continue;
    }

    const first = txGroup[0];
    const isFromBrendi = Boolean(
      first.id?.startsWith('brendi_') || 
      orderId.startsWith('BRD-') ||
      txGroup.some(t => t.id?.startsWith('brendi_'))
    );

    let source: CanonicalSaleSource = 'spreadsheet';
    let sourceType: CanonicalSaleSourceType = 'import';

    if (isFromBrendi) {
      source = 'brendi';
      sourceType = 'integration';
    } else if (first.channel === 'store' || first.id?.startsWith('manual_')) {
      source = 'manual';
      sourceType = 'manual';
    }

    const cleanExtId = isFromBrendi ? orderId.replace(/^brendi_/, '') : orderId;
    const originId = getCanonicalSaleOriginId(source, cleanExtId);

    const items: CanonicalSaleItem[] = [];
    let grossAmount = 0;
    let totalCoupon = 0;
    let totalFee = 0;

    for (const tx of txGroup) {
      const qty = Number(tx.qty || 1);
      const unitPrice = Number(tx.pricePaidByCustomer || 0);
      const lineTotal = typeof tx.totalAmount === 'number' && !isNaN(tx.totalAmount)
        ? tx.totalAmount
        : Number((unitPrice * qty).toFixed(2));

      grossAmount += lineTotal;
      if (tx.couponCostByStore && tx.couponCostByStore > 0) {
        totalCoupon += tx.couponCostByStore;
      }
      if (tx.feePaid && tx.feePaid > 0) {
        totalFee += tx.feePaid;
      }

      if (tx.productName || tx.productId) {
        items.push({
          productId: tx.productId && tx.productId !== 'temp_unregistered' ? tx.productId : undefined,
          productName: tx.productName || 'Item sem nome',
          quantity: qty,
          unitPrice,
          totalPrice: lineTotal,
          notes: tx.notes
        });
      }
    }

    grossAmount = Number(grossAmount.toFixed(2));

    const canonicalSale: CanonicalSale = {
      id: first.id,
      originId,
      source,
      sourceType,
      orderDate: first.date || new Date().toISOString(),
      grossAmount,
      totalAmount: grossAmount,
      channel: first.channel,
      status: 'CONCLUDED',
      items
    };

    if (totalCoupon > 0) {
      canonicalSale.couponAmount = Number(totalCoupon.toFixed(2));
    }
    if (totalFee > 0) {
      canonicalSale.fees = [{
        type: 'channelFee',
        amount: Number(totalFee.toFixed(2)),
        sourceType: 'real',
        description: 'Taxa agregada da transação'
      }];
    }

    result.push(canonicalSale);
  }

  // 2. Transações individuais sem orderId
  for (const tx of ungrouped) {
    result.push(normalizeSalesTransaction(tx));
  }

  return result;
}

