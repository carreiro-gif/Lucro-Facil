import { BrendiChannelFees, BrendiDetailedFees, BrendiOrder, Product, Combo, PlatformConfig } from '../types';
import { normalizeName } from '../components/BrendiRealtimeTab';

export const DEFAULT_BRENDI_CHANNEL_FEES: BrendiChannelFees = {
  ifood: 25.1,
  food99: 16.1,
  keeta: 13.1,
  brendiDelivery: 0.0,
  brendiBalcao: 0.0,
};

export const DEFAULT_BRENDI_DETAILED_FEES: BrendiDetailedFees = {
  ifood: {
    fee: 12.0,
    feePercent: 12.0,
    onlinePayment: 3.2,
    onlinePaymentPercent: 3.2,
    anticipation: 1.9,
    anticipationPercent: 1.9,
    delivery: 4.0,
    deliveryReais: 4.0,
    coupon: 0.0,
    couponReais: 0.0,
  },
  food99: {
    fee: 8.9,
    feePercent: 8.9,
    onlinePayment: 3.2,
    onlinePaymentPercent: 3.2,
    anticipation: 0.0,
    anticipationPercent: 0.0,
    delivery: 4.0,
    deliveryReais: 4.0,
    coupon: 0.0,
    couponReais: 0.0,
  },
  keeta: {
    fee: 8.9,
    feePercent: 8.9,
    onlinePayment: 3.2,
    onlinePaymentPercent: 3.2,
    anticipation: 0.0,
    anticipationPercent: 0.0,
    delivery: 4.0,
    deliveryReais: 4.0,
    coupon: 0.0,
    couponReais: 0.0,
  },
  brendiDelivery: {
    fee: 0.0,
    feePercent: 0.0,
    delivery: 4.0,
    deliveryReais: 4.0,
  },
  brendiBalcao: {
    fee: 0.0,
    feePercent: 0.0,
  },
};

/**
 * Calculates suggested detailed channel fees based on the user's Preço de Venda (PlatformConfig)
 */
export const getSuggestedDetailedFees = (
  platformConfig?: PlatformConfig
): BrendiDetailedFees => {
  const ifoodFee = platformConfig?.ifood?.fee ?? 12.0;
  const ifoodOnline = platformConfig?.ifood?.onlinePayment ?? 3.2;
  const ifoodAntec = platformConfig?.ifood?.anticipation ?? 1.9;
  const ifoodDelivery = platformConfig?.ifood?.delivery ?? 4.0;
  const ifoodCoupon = platformConfig?.ifood?.ciValue ?? 0.0;

  const food99Fee = platformConfig?.food99?.fee ?? 8.9;
  const food99Online = platformConfig?.food99?.onlinePayment ?? 3.2;
  const food99Antec = platformConfig?.food99?.anticipation ?? 0.0;
  const food99Delivery = platformConfig?.food99?.delivery ?? 4.0;

  const keetaFee = platformConfig?.keeta?.fee ?? 8.9;
  const keetaOnline = platformConfig?.keeta?.onlinePayment ?? 3.2;
  const keetaAntec = platformConfig?.keeta?.anticipation ?? 0.0;
  const keetaDelivery = platformConfig?.keeta?.delivery ?? 4.0;

  return {
    ifood: {
      fee: ifoodFee,
      feePercent: ifoodFee,
      onlinePayment: ifoodOnline,
      onlinePaymentPercent: ifoodOnline,
      anticipation: ifoodAntec,
      anticipationPercent: ifoodAntec,
      delivery: ifoodDelivery,
      deliveryReais: ifoodDelivery,
      coupon: ifoodCoupon,
      couponReais: ifoodCoupon,
    },
    food99: {
      fee: food99Fee,
      feePercent: food99Fee,
      onlinePayment: food99Online,
      onlinePaymentPercent: food99Online,
      anticipation: food99Antec,
      anticipationPercent: food99Antec,
      delivery: food99Delivery,
      deliveryReais: food99Delivery,
      coupon: 0.0,
      couponReais: 0.0,
    },
    keeta: {
      fee: keetaFee,
      feePercent: keetaFee,
      onlinePayment: keetaOnline,
      onlinePaymentPercent: keetaOnline,
      anticipation: keetaAntec,
      anticipationPercent: keetaAntec,
      delivery: keetaDelivery,
      deliveryReais: keetaDelivery,
      coupon: 0.0,
      couponReais: 0.0,
    },
    brendiDelivery: {
      fee: 0.0,
      feePercent: 0.0,
      delivery: 4.0,
      deliveryReais: 4.0,
    },
    brendiBalcao: {
      fee: 0.0,
      feePercent: 0.0,
    },
  };
};

/**
 * Calculates the total equivalent percentage for a channel given its detailed fees and avg ticket
 */
export function calculateChannelTotalPercent(
  channelOrData: any,
  dataOrAvgTicket?: any,
  maybeAvgTicket?: number
): number {
  if (!channelOrData) return 0;
  let data: any = {};
  let avgTicket: number = 38.0;

  if (typeof channelOrData === 'string') {
    data = dataOrAvgTicket || {};
    avgTicket = typeof maybeAvgTicket === 'number' && maybeAvgTicket > 0 ? maybeAvgTicket : 38.0;
  } else {
    data = channelOrData || {};
    avgTicket = typeof dataOrAvgTicket === 'number' && dataOrAvgTicket > 0 ? dataOrAvgTicket : 38.0;
  }

  const safeAvgTicket = avgTicket > 0 ? avgTicket : 38.0;

  const fee = Number(data.feePercent ?? data.fee ?? 0);
  const onlinePayment = Number(data.onlinePaymentPercent ?? data.onlinePayment ?? 0);
  const anticipation = Number(data.anticipationPercent ?? data.anticipation ?? 0);
  const delivery = Number(data.deliveryReais ?? data.delivery ?? 0);
  const coupon = Number(data.couponReais ?? data.coupon ?? 0);

  const fixedPct = fee + onlinePayment + anticipation;
  const variablePct = ((delivery + coupon) / safeAvgTicket) * 100;

  return Math.round((fixedPct + variablePct) * 10) / 10;
}

/**
 * Calculates suggested channel fees based on the user's Preço de Venda (PlatformConfig)
 * and menu average prices.
 */
export const getSuggestedChannelFees = (
  platformConfig?: PlatformConfig,
  products: Product[] = []
): BrendiChannelFees => {
  // Compute average ticket from products with fixed price or default R$ 38.00
  const pricedProducts = products.filter(p => (p.fixedPriceStore || 0) > 0);
  const avgTicket = pricedProducts.length > 0
    ? pricedProducts.reduce((sum, p) => sum + (p.fixedPriceStore || 0), 0) / pricedProducts.length
    : 38.0;

  // iFood
  const ifoodFee = platformConfig?.ifood?.fee ?? 12.0;
  const ifoodOnline = platformConfig?.ifood?.onlinePayment ?? 3.2;
  const ifoodAntec = platformConfig?.ifood?.anticipation ?? 1.9;
  const ifoodDeliveryR$ = platformConfig?.ifood?.delivery ?? 4.0;
  const ifoodDeliveryPct = avgTicket > 0 ? (ifoodDeliveryR$ / avgTicket) * 100 : 0;
  const ifoodTotal = Math.round((ifoodFee + ifoodOnline + ifoodAntec + ifoodDeliveryPct) * 10) / 10;

  // 99Food
  const food99Fee = platformConfig?.food99?.fee ?? 8.9;
  const food99Online = platformConfig?.food99?.onlinePayment ?? 3.2;
  const food99Antec = platformConfig?.food99?.anticipation ?? 0.0;
  const food99DeliveryR$ = platformConfig?.food99?.delivery ?? 4.0;
  const food99DeliveryPct = avgTicket > 0 ? (food99DeliveryR$ / avgTicket) * 100 : 0;
  const food99Total = Math.round((food99Fee + food99Online + food99Antec + food99DeliveryPct) * 10) / 10;

  // Keeta
  const keetaFee = platformConfig?.keeta?.fee ?? 8.9;
  const keetaOnline = platformConfig?.keeta?.onlinePayment ?? 3.2;
  const keetaAntec = platformConfig?.keeta?.anticipation ?? 0.0;
  const keetaDeliveryR$ = platformConfig?.keeta?.delivery ?? 4.0;
  const keetaDeliveryPct = avgTicket > 0 ? (keetaDeliveryR$ / avgTicket) * 100 : 0;
  const keetaTotal = Math.round((keetaFee + keetaOnline + keetaAntec + keetaDeliveryPct) * 10) / 10;

  return {
    ifood: ifoodTotal > 0 ? ifoodTotal : DEFAULT_BRENDI_CHANNEL_FEES.ifood,
    food99: food99Total > 0 ? food99Total : DEFAULT_BRENDI_CHANNEL_FEES.food99,
    keeta: keetaTotal > 0 ? keetaTotal : DEFAULT_BRENDI_CHANNEL_FEES.keeta,
    brendiDelivery: 0.0,
    brendiBalcao: 0.0,
  };
};

/**
 * Storage helpers for reactive client-side persistence
 */
const getStorageKey = (userId?: string | null) => `lucro_facil_brendi_channel_fees_${userId || 'default'}`;

export const getSavedChannelFees = (userId?: string | null): BrendiChannelFees | null => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.ifood === 'number') {
        return parsed as BrendiChannelFees;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return null;
};

export const saveChannelFeesToStorage = (fees: BrendiChannelFees, userId?: string | null) => {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(fees));
    window.dispatchEvent(new CustomEvent('brendi-channel-fees-updated', { detail: fees }));
  } catch (e) {
    // Ignore error
  }
};

/**
 * Identifies the sales channel using merchantId or channel descriptor
 */
export const identifyOrderChannel = (order: BrendiOrder): {
  channelKey: keyof BrendiChannelFees;
  label: string;
} => {
  const ch = (order.channel || '').toLowerCase();
  const merchant = (order.merchantId || '').toLowerCase();
  const deliveryType = (order.deliveryType || '').toLowerCase();

  // Check iFood indicators
  if (ch.includes('ifood') || merchant.includes('ifood')) {
    return { channelKey: 'ifood', label: 'iFood' };
  }

  // Check 99Food indicators
  if (ch.includes('99') || ch.includes('food99') || merchant.includes('99')) {
    return { channelKey: 'food99', label: '99Food' };
  }

  // Check Keeta indicators
  if (ch.includes('keeta') || merchant.includes('keeta')) {
    return { channelKey: 'keeta', label: 'Keeta' };
  }

  // Check Brendi Balcão / Indoor / Takeout
  if (
    ch.includes('balc') || 
    ch.includes('indoor') || 
    ch.includes('mesa') || 
    deliveryType.includes('takeout') || 
    deliveryType.includes('dine_in')
  ) {
    return { channelKey: 'brendiBalcao', label: 'Brendi Balcão' };
  }

  // Default to Brendi Delivery próprio
  return { channelKey: 'brendiDelivery', label: 'Brendi Delivery' };
};

export interface BrendiOrderFinancials {
  orderId: string;
  channelKey: keyof BrendiChannelFees;
  channelLabel: string;
  feePercent: number;
  grossTotal: number;
  feeAmount: number;
  netRevenue: number;
  cmvTotal: number;
  cfiAmount: number;
  netProfitReal: number;
  netProfitPercent: number;
  isProfitPositive: boolean;
}

/**
 * Calculates complete real financial breakdown for a Brendi Order:
 * - Gross Total
 * - Deducted Channel Fees (R$ and %)
 * - Net Revenue
 * - Recipe CMV Total
 * - Fixed Costs allocation (CFI)
 * - True Net Profit (R$ and %)
 */
export const calculateBrendiOrderFinancials = ({
  order,
  channelFees,
  products,
  combos,
  getProductCMV,
  getComboCMV,
  totalCfiPercent,
}: {
  order: BrendiOrder;
  channelFees: BrendiChannelFees;
  products: Product[];
  combos: Combo[];
  getProductCMV: (p: Product) => number;
  getComboCMV: (c: Combo) => number;
  totalCfiPercent: number;
}): BrendiOrderFinancials => {
  const { channelKey, label: channelLabel } = identifyOrderChannel(order);
  const feePercent = Number(channelFees[channelKey] ?? 0);

  const grossTotal = Number(order.total || 0);
  const feeAmount = (grossTotal * feePercent) / 100;
  const netRevenue = Math.max(0, grossTotal - feeAmount);

  // Match items with products or combos to compute CMV
  const normProductMap = new Map<string, Product>();
  products.forEach(p => normProductMap.set(normalizeName(p.name), p));

  const normComboMap = new Map<string, Combo>();
  combos.forEach(c => normComboMap.set(normalizeName(c.name), c));

  let cmvTotal = 0;
  (order.items || []).forEach(item => {
    const qty = Number(item.quantity || 1);
    const norm = normalizeName(item.name);
    const prod = normProductMap.get(norm);
    const combo = normComboMap.get(norm);

    if (prod) {
      cmvTotal += getProductCMV(prod) * qty;
    } else if (combo) {
      cmvTotal += getComboCMV(combo) * qty;
    } else {
      // If unregistered, estimate a conservative 32% CMV based on unit price
      const price = Number(item.unitPrice || 0);
      cmvTotal += (price * 0.32) * qty;
    }
  });

  // Calculate CFI share (applied on net revenue or gross revenue)
  const cfiPercent = Math.max(0, Number(totalCfiPercent || 0));
  const cfiAmount = (netRevenue * cfiPercent) / 100;

  // Real net profit
  const netProfitReal = netRevenue - cmvTotal - cfiAmount;
  const netProfitPercent = grossTotal > 0 ? (netProfitReal / grossTotal) * 100 : 0;

  return {
    orderId: order.id,
    channelKey,
    channelLabel,
    feePercent,
    grossTotal,
    feeAmount,
    netRevenue,
    cmvTotal,
    cfiAmount,
    netProfitReal,
    netProfitPercent,
    isProfitPositive: netProfitReal >= 0,
  };
};
