import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Percent, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator, 
  Target, 
  Gift, 
  Award, 
  Compass, 
  ChevronRight, 
  Info,
  Calendar,
  Users,
  Timer,
  ShoppingBag,
  X
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { formatMoney, formatPercent } from '../constants';
import { Product } from '../types';

const loadSavedState = (key: string, defaultVal: string) => {
  const saved = localStorage.getItem(`lucro_facil_simulator_${key}`);
  return saved || defaultVal;
};

const saveState = (key: string, val: string) => {
  localStorage.setItem(`lucro_facil_simulator_${key}`, val);
};

const SmartSimulator: React.FC = () => {
  const { 
    products, 
    getProductCMV, 
    getSortedProducts,
    calculateTotalCfiPercent,
    salesTransactions = [],
    monthlyRevenue = [],
    cfi,
    customCategories = [],
    platformConfig
  } = useApp();

  const totalCfiPercent = calculateTotalCfiPercent(
    monthlyRevenue.length > 0 ? monthlyRevenue[monthlyRevenue.length - 1].revenue : 0,
    monthlyRevenue,
    customCategories,
    platformConfig
  );

  // Navigation subtabs inside simulator
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'cashback' | 'loyalty' | 'ifood-hits' | 'smart-campaign'>('coupons');

  // --- CAMPANHA INTELIGENTE VARIABLES ---
  const [smartCampaignDailyInvestment, setSmartCampaignDailyInvestment] = useState<string>(() => loadSavedState('smart_mkt_spend', '100'));
  const [smartCampaignDailyOrders, setSmartCampaignDailyOrders] = useState<string>(() => loadSavedState('smart_daily_orders', '15'));
  const [smartCampaignTicket, setSmartCampaignTicket] = useState<string>(() => {
    const saved = localStorage.getItem('lucro_facil_simulator_smart_ticket');
    if (saved) return saved;
    // We will sync with calculatedAverageTicket in useEffect or use 55 as default
    return '55';
  });

  // --- IFOOD HITS VARIABLES ---
  const [showHitsTooltip, setShowHitsTooltip] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState(true);
  const [eligibleRating, setEligibleRating] = useState(true);
  const [eligibleCancellation, setEligibleCancellation] = useState(true);
  const [eligibleDelivery, setEligibleDelivery] = useState(true);
  const [selectedHitsProductIds, setSelectedHitsProductIds] = useState<string[]>([]);

  const getHitsDiscount = (price: number) => {
    if (price >= 15 && price <= 24.99) return 5;
    if (price >= 25 && price <= 39.99) return 8;
    if (price >= 40 && price <= 59.99) return 10;
    if (price >= 60 && price <= 80) return 13;
    return 0;
  };

  const getIfoodBasePrice = (p: Product) => {
    const cmv = getProductCMV(p);
    const pricing = p.pricing || {};
    const profitMargin = pricing.profitMargin !== undefined ? pricing.profitMargin : 20;
    
    const totalCfiCost = totalCfiPercent;
    const totalDeductions = (totalCfiCost + profitMargin) / 100;
    const storePrice = totalDeductions >= 1 ? 0 : cmv / (1 - totalDeductions);

    const ifoodFee = pricing.ifood?.fee ?? platformConfig.ifood.fee;
    const ifoodOnline = pricing.ifood?.onlinePayment ?? platformConfig.ifood.onlinePayment;
    const ifoodAntic = pricing.ifood?.anticipation ?? platformConfig.ifood.anticipation;
    const ifoodDel = pricing.ifood?.delivery ?? platformConfig.ifood.delivery;
    const ifoodCoupon = pricing.ifood?.coupon ?? 0;
    
    const feesPct = ifoodFee + ifoodOnline + ifoodAntic;
    const denominator = 1 - (feesPct / 100);
    if (denominator <= 0) return storePrice;
    return (storePrice + ifoodDel + ifoodCoupon) / denominator;
  };

  const getSuggestedPricesForHits = (p: Product) => {
    const cmv = getProductCMV(p);
    const pricing = p.pricing || {};
    const profitMargin = pricing.profitMargin !== undefined ? pricing.profitMargin : 20;
    
    const totalCfiCost = totalCfiPercent;
    
    const ifoodFee = pricing.ifood?.fee ?? platformConfig.ifood.fee;
    const ifoodOnline = pricing.ifood?.onlinePayment ?? platformConfig.ifood.onlinePayment;
    const ifoodAntic = pricing.ifood?.anticipation ?? platformConfig.ifood.anticipation;
    const ifoodDel = pricing.ifood?.delivery ?? platformConfig.ifood.delivery;
    const ifoodCoupon = pricing.ifood?.coupon ?? 0;
    
    const feesPct = ifoodFee + ifoodOnline + ifoodAntic;

    // 1. Same % profit margin
    let priceForMargin: number | null = null;
    const denomMargin = 1 - (totalCfiCost + feesPct + profitMargin) / 100;
    if (denomMargin > 0) {
      const minFinalPriceMargin = (cmv + ifoodDel + ifoodCoupon) / denomMargin;
      
      const candidates: number[] = [];
      const brackets = [
        { min: 15, max: 24.99, discount: 5 },
        { min: 25, max: 39.99, discount: 8 },
        { min: 40, max: 59.99, discount: 10 },
        { min: 60, max: 80, discount: 13 }
      ];
      for (const b of brackets) {
        const pOriginal = minFinalPriceMargin + b.discount;
        if (pOriginal >= b.min && pOriginal <= b.max) {
          candidates.push(pOriginal);
        }
      }
      if (candidates.length > 0) {
        priceForMargin = Math.min(...candidates);
      } else {
        for (let pVal = 15; pVal <= 80; pVal += 0.05) {
          const d = getHitsDiscount(pVal);
          if (pVal - d >= minFinalPriceMargin) {
            priceForMargin = pVal;
            break;
          }
        }
      }
    }

    // 2. Same profit in Reais as store
    const storeDeductions = (totalCfiCost + profitMargin) / 100;
    const storePrice = storeDeductions >= 1 ? 0 : cmv / (1 - storeDeductions);
    const storeCfi = storePrice * (totalCfiCost / 100);
    const storeProfit = Math.max(0, storePrice - cmv - storeCfi);

    let priceForSameProfit: number | null = null;
    const denomProfit = 1 - (totalCfiCost + feesPct) / 100;
    if (denomProfit > 0) {
      const minFinalPriceProfit = (storeProfit + cmv + ifoodDel + ifoodCoupon) / denomProfit;
      
      const candidates: number[] = [];
      const brackets = [
        { min: 15, max: 24.99, discount: 5 },
        { min: 25, max: 39.99, discount: 8 },
        { min: 40, max: 59.99, discount: 10 },
        { min: 60, max: 80, discount: 13 }
      ];
      for (const b of brackets) {
        const pOriginal = minFinalPriceProfit + b.discount;
        if (pOriginal >= b.min && pOriginal <= b.max) {
          candidates.push(pOriginal);
        }
      }
      if (candidates.length > 0) {
        priceForSameProfit = Math.min(...candidates);
      } else {
        for (let pVal = 15; pVal <= 80; pVal += 0.05) {
          const d = getHitsDiscount(pVal);
          if (pVal - d >= minFinalPriceProfit) {
            priceForSameProfit = pVal;
            break;
          }
        }
      }
    }

    return {
      priceForMargin,
      priceForSameProfit,
      storePrice,
      storeProfit,
      targetMargin: profitMargin,
      feesPct
    };
  };

  const toggleHitsProduct = (productId: string) => {
    setSelectedHitsProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, productId];
      }
    });
  };

  // --- 1. COUPON CALCULATOR VARIABLES ---
  const [couponCampaignType, setCouponCampaignType] = useState<'new_customers' | 'recurrents' | 'lost_customers'>('new_customers');
  const [simulatedTicket, setSimulatedTicket] = useState<string>(() => loadSavedState('ticket', '55'));
  const [simulatedCouponValue, setSimulatedCouponValue] = useState<string>(() => loadSavedState('coupon_val', '10'));
  const [simulatedCmvPercent, setSimulatedCmvPercent] = useState<string>(() => loadSavedState('cmv_pct', '30'));
  const [simulatedCfiPercent, setSimulatedCfiPercent] = useState<string>(() => loadSavedState('cfi_pct', totalCfiPercent.toFixed(1)));
  const [marketingSpend, setMarketingSpend] = useState<string>(() => loadSavedState('mkt_spend', '300'));
  const [expectedConversions, setExpectedConversions] = useState<string>(() => loadSavedState('conversions', '50'));

  // Calculate default values based on actual historical data if available
  const { calculatedAverageTicket, isTicketEstimated } = useMemo(() => {
    let revenue = 0;
    let orders = 0;
    let isEstimated = true;

    // Try to get from monthly orders field (reliable order count if user entered it in BreakEven)
    try {
      const activeMonths = monthlyRevenue.filter(r => Number(r.revenue) > 0).sort((a, b) => a.month.localeCompare(b.month));
      if (activeMonths.length > 0) {
        const lastM = activeMonths[activeMonths.length - 1];
        revenue = Number(lastM.revenue) || 0;
        
        const ordersStr = localStorage.getItem('lucro_facil_be_monthly_orders_v1');
        if (ordersStr) {
          const ordersMap = JSON.parse(ordersStr);
          if (ordersMap[lastM.month]) {
            orders = Number(ordersMap[lastM.month]) || 0;
            if (orders > 0) isEstimated = false;
          }
        }
      }
    } catch (e) {}

    const ticket = orders > 0 ? revenue / orders : 0;
    return { calculatedAverageTicket: ticket, isTicketEstimated: isEstimated };
  }, [monthlyRevenue]);

  const defaultAverageCmvPercent = useMemo(() => {
    if (products.length === 0) return 30; // standard fallback
    
    // Tentar média ponderada pelas vendas se houver tx
    if (salesTransactions && salesTransactions.length > 0) {
      let totalCmvCost = 0;
      let totalRevenue = 0;
      
      salesTransactions.forEach(t => {
        const p = products.find(prod => prod.id === t.productId || prod.name === t.productName);
        if (p) {
          const unitCost = getProductCMV(p);
          if (unitCost > 0) {
             totalCmvCost += (unitCost * t.qty);
             totalRevenue += (t.pricePaidByCustomer * t.qty);
          }
        }
      });
      
      if (totalRevenue > 0) {
        return (totalCmvCost / totalRevenue) * 100;
      }
    }

    // Fallback: Média simples de CMV de todos os produtos
    let totalCmvPercent = 0;
    let counted = 0;
    products.forEach(p => {
      const cost = getProductCMV(p);
      const price = p.fixedPriceStore && p.fixedPriceStore > 0 ? p.fixedPriceStore : 0;
      if (cost > 0 && price > 0) {
        totalCmvPercent += (cost / price) * 100;
        counted++;
      } else if (cost > 0) {
        totalCmvPercent += (cost / (cost / 0.35)) * 100; // Assumed 35% margin
        counted++;
      }
    });

    return counted > 0 ? (totalCmvPercent / counted) : 30;
  }, [products, getProductCMV, salesTransactions]);

  // Sync calculated average ticket
  React.useEffect(() => {
    if (calculatedAverageTicket > 0) {
      setSmartCampaignTicket(prev => {
        const saved = localStorage.getItem('lucro_facil_simulator_smart_ticket');
        if (saved) return saved;
        return calculatedAverageTicket.toFixed(2);
      });
    }
  }, [calculatedAverageTicket]);

  // Set default button trigger
  const handleApplyAverages = () => {
    if (calculatedAverageTicket > 0) {
      setSimulatedTicket(calculatedAverageTicket.toFixed(2));
      saveState('ticket', calculatedAverageTicket.toFixed(2));
      setSmartCampaignTicket(calculatedAverageTicket.toFixed(2));
      saveState('smart_ticket', calculatedAverageTicket.toFixed(2));
    }
    
    setSimulatedCmvPercent(defaultAverageCmvPercent.toFixed(1));
    saveState('cmv_pct', defaultAverageCmvPercent.toFixed(1));
    
    setSimulatedCfiPercent(totalCfiPercent.toFixed(1));
    saveState('cfi_pct', totalCfiPercent.toFixed(1));

    addXandeBotMessage("Aí sim! Acabei de puxar o seu CMV médio, seu CFI e seu Ticket Médio direto dos dados cadastrados da loja. Agora as simulações estão 100% alinhadas com a sua realidade!");
  };

  // State savers
  const updateState = (setter: any, key: string, val: string) => {
    setter(val);
    saveState(key, val);
  };

  // --- 2. CASHBACK VARIABLES ---
  const [simulatedCashbackPercent, setSimulatedCashbackPercent] = useState<string>(() => loadSavedState('cb_pct', '5'));
  const [cashbackMinRedeem, setCashbackMinRedeem] = useState<string>(() => loadSavedState('cb_min', '20'));
  const [cashbackValidityDays, setCashbackValidityDays] = useState<string>(() => loadSavedState('cb_days', '30'));
  const [recurrenceRate, setRecurrenceRate] = useState<string>(() => loadSavedState('cb_recurrence', '40')); // % of customers repeating order

  // --- 3. LOYALTY (FIDELIDADE) VARIABLES ---
  const [selectedProductIdForReward, setSelectedProductIdForReward] = useState<string>(() => loadSavedState('loyalty_prod', ''));
  const [loyaltyRequiredOrders, setLoyaltyRequiredOrders] = useState<string>(() => loadSavedState('loyalty_orders', '10')); // Order goal
  const [loyaltyCompletionRate, setLoyaltyCompletionRate] = useState<string>(() => loadSavedState('loyalty_completion', '30')); // % completion
  
  // Safe reward product select
  const selectedRewardProductObj = useMemo(() => {
    return products.find(p => p.id === selectedProductIdForReward);
  }, [products, selectedProductIdForReward]);

  // --- XANDE CONSULTATION BOT ---
  const [xandeChatMessages, setXandeChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: "Fala, patrão! Desenhar cupons e fidelidade é o que separa as hamburguerias que sobram caixa daquelas que apenas 'trocam dinheiro'. No simulador ao lado, você pode modelar seus cupons de desconto, cashback e prêmios de fidelidade. Eu vou te alertar se você estiver vendendo com prejuízo ou abaixo da sua margem alvo!"
    }
  ]);
  const [xandeInput, setXandeInput] = useState('');
  const [isXandeLoading, setIsXandeLoading] = useState(false);

  // --- CORE COMPUTATIONS ---

  // 1. Coupon math
  const couponCmv = parseFloat(simulatedCmvPercent) || 30;
  const couponCfi = parseFloat(simulatedCfiPercent) || 30;
  const couponVal = parseFloat(simulatedCouponValue) || 0;
  const initialTicketVal = parseFloat(simulatedTicket) || 45;

  // CAC calculations
  const totalMarketingCACSpend = parseFloat(marketingSpend) || 0;
  const conversionsVal = parseFloat(expectedConversions) || 1;
  const directCouponCAC = couponVal; 
  const overheadCACPerCustomer = conversionsVal > 0 ? (totalMarketingCACSpend / conversionsVal) : 0;
  const totalCACPerAcquired = directCouponCAC + overheadCACPerCustomer;

  // Let's compute coupon scenarios across various order sizes
  const couponScenarios = useMemo(() => {
    const ticketOptions = [
      initialTicketVal * 0.7,  // low basket
      initialTicketVal,        // average basket
      initialTicketVal * 1.4,  // high basket
      initialTicketVal * 2.0   // super basket
    ];

    return ticketOptions.map(tOption => {
      const rawCmvCost = tOption * (couponCmv / 100);
      const rawCfiCost = tOption * (couponCfi / 100);
      const finalRevenue = Math.max(0, tOption - couponVal);
      const netProfit = finalRevenue - rawCmvCost - rawCfiCost;
      const profitMarginPct = finalRevenue > 0 ? (netProfit / finalRevenue) * 100 : -100;

      return {
        orderValue: tOption,
        finalReceived: finalRevenue,
        cmvCost: rawCmvCost,
        cfiCost: rawCfiCost,
        couponCost: couponVal,
        netProfit,
        profitMarginPct
      };
    });
  }, [initialTicketVal, couponCmv, couponCfi, couponVal]);

  // Minimum Safe Order Value for coupon:
  // We want netProfit > 0, so finalReceived - cmvCost - cfiCost > 0
  // (OrderValue - Coupon) - OrderValue * (Cmv% + Cfi%) > 0
  // OrderValue * (1 - Cmv% - Cfi%) > Coupon
  // OrderValue > Coupon / (1 - Cmv%/100 - Cfi%/100)
  const minimumOrderValueForCoupon = useMemo(() => {
    const multiplier = (1 - (couponCmv / 100) - (couponCfi / 100));
    if (multiplier <= 0 || isNaN(multiplier)) return initialTicketVal * 1.5;
    return couponVal / multiplier;
  }, [couponVal, couponCmv, couponCfi, initialTicketVal]);

  // Safe minimum order with minimum target profit margin (e.g. at least 15% profit margin target)
  // Math: MinVal = Coupon / (1 - CMV% - CFI% - TargetMargin%)
  const minimumOrderValueForTargetMargin = useMemo(() => {
    const targetMargin = cfi.profitMargin || 15;
    const multiplier = (1 - (couponCmv / 100) - (couponCfi / 100) - (targetMargin / 100));
    if (multiplier <= 0 || isNaN(multiplier)) return initialTicketVal * 2; // impossível atingir margem alvo
    return couponVal / multiplier;
  }, [couponVal, couponCmv, couponCfi, cfi.profitMargin, initialTicketVal]);

  // 2. Cashback math
  const cashbackPct = parseFloat(simulatedCashbackPercent) || 0;
  const repeatingPct = parseFloat(recurrenceRate) || 40;
  
  // Real valid minimum spend is initialTicketVal or cashbackMinRedeem
  const cbMinRedeemNum = parseFloat(cashbackMinRedeem) || 0;

  // Real cost of cashback:
  // if you give 5% and 40% uses it, its effective cost on REVENUE is 5% * 40% = 2%
  const cashbackEffectiveCostPercent = (cashbackPct * (repeatingPct / 100));
  
  // Impact on CMV and CFI:
  // Usually CMV and CFI remain unchanged structurally, but your margin drops by cashbackEffectiveCostPercent
  const cashbackMarginImpact = useMemo(() => {
    const defaultMargin = cfi.profitMargin || 15;
    const remainingMargin = defaultMargin - cashbackEffectiveCostPercent;
    const isCrisis = remainingMargin < 8; // Danger zone under 8% remaining profit margin
    
    // Required ticket to absorb the cashback cost and stay at target margin:
    const requiredTicketIncreasePct = defaultMargin > 0 ? (cashbackEffectiveCostPercent / defaultMargin) * 100 : 0;

    return {
      effectiveDiscount: cashbackEffectiveCostPercent,
      remainingMargin,
      isCrisis,
      requiredTicketIncreasePct
    };
  }, [cashbackEffectiveCostPercent, cfi.profitMargin]);

  // Cashback Scenarios
  const cashbackScenarios = useMemo(() => {
    const ticketOptions = [
      initialTicketVal * 0.8,
      initialTicketVal,
      initialTicketVal * 1.5
    ];

    return ticketOptions.map(t => {
      const generatedCashback = t * (cashbackPct / 100);
      const effectiveCost = generatedCashback * (repeatingPct / 100);
      const rawCmvCost = t * (couponCmv / 100);
      const rawCfiCost = t * (couponCfi / 100);
      const netProfit = t - rawCmvCost - rawCfiCost - effectiveCost;
      return { t, generatedCashback, effectiveCost, netProfit };
    });
  }, [initialTicketVal, cashbackPct, repeatingPct, couponCmv, couponCfi]);

  // 3. Loyalty math
  const requiredOrdersCount = parseInt(loyaltyRequiredOrders) || 10;
  const completionRate = parseFloat(loyaltyCompletionRate) || 30; // 30% complete
  
  const rewardCmvVal = selectedRewardProductObj ? getProductCMV(selectedRewardProductObj) : (initialTicketVal * 0.3);
  const rewardFullPriceVal = selectedRewardProductObj?.fixedPriceStore || (initialTicketVal * 0.8);
  
  // Real Cost:
  // prize cost * completion rate
  // distributed over required orders
  const loyaltyCostPerOrder = useMemo(() => {
    if (requiredOrdersCount <= 0) return rewardCmvVal;
    return (rewardCmvVal / requiredOrdersCount) * (completionRate / 100);
  }, [rewardCmvVal, requiredOrdersCount, completionRate]);

  // Equivalent discount on each order: 
  // Reward CMV cost / (Orders * average ticket) * (Completion / 100)
  const loyaltyEquivalentDiscountPercent = useMemo(() => {
    const totalRevenueGeneratedByCompletion = requiredOrdersCount * initialTicketVal;
    if (totalRevenueGeneratedByCompletion <= 0) return 0;
    
    // We base equivalent discount on the COST to the store, not full price
    const percentCostOnRevenue = (rewardCmvVal / totalRevenueGeneratedByCompletion) * 100;
    return percentCostOnRevenue * (completionRate / 100);
  }, [rewardCmvVal, requiredOrdersCount, initialTicketVal, completionRate]);

  const addXandeBotMessage = (text: string) => {
    setXandeChatMessages(prev => [...prev, { role: 'model', text }]);
  };

  const handleSendXandeConsultation = async (textToSend: string = xandeInput) => {
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user' as const, text: textToSend };
    setXandeChatMessages(prev => [...prev, userMsg]);
    setXandeInput('');
    setIsXandeLoading(true);

    const targetMargin = cfi?.profitMargin || 15;
    const smartMSpend = parseFloat(smartCampaignDailyInvestment || '100');
    const smartTicketVal = parseFloat(smartCampaignTicket || '55');
    const smartDailyOrdersVal = parseFloat(smartCampaignDailyOrders || '15');
    const smartMonthlyCost = smartMSpend * 30;
    const smartAddOrders = smartDailyOrdersVal * 30 * 0.67;
    const smartAddRevenue = smartAddOrders * smartTicketVal;
    const smartAddProfit = smartAddRevenue * (targetMargin / 100);
    const isSmartViable = smartAddProfit > smartMonthlyCost;

    try {
      const scenarioContext = `
      Você é o Xande, consultor do Cardápio Blindado, especialista e francamente direto com os números de hamburguerias.
      O usuário está analisando cenários e ferramentas de fidelização/desconto na aba ativa de "${activeSubTab.toUpperCase()}":
      
      DADOS GERAIS DO SISTEMA:
      - CMV Médio Informado: ${couponCmv.toFixed(1)}%
      - CFI % da Empresa: ${couponCfi.toFixed(1)}%
      - Margem Sugerida Alvo: ${cfi.profitMargin.toFixed(1)}%
      
      PARÂMETROS SIMULADOS ATUALMENTE:
      1. Aba Cupons de Desconto:
         - Tipo de Campanha: ${couponCampaignType}
         - Ticket Médio Base: R$ ${initialTicketVal.toFixed(2)}
         - Valor do Cupom: R$ ${couponVal.toFixed(2)}
         - Ponto de Equilíbrio do Cupom (Pedido Mínimo Sugerido p/ Empate): R$ ${minimumOrderValueForCoupon.toFixed(2)}
         - Pedido Mínimo Seguro p/ Lucro: R$ ${minimumOrderValueForTargetMargin.toFixed(2)}
         
      2. Aba Cashback:
         - Cashback % Oferecido: ${cashbackPct}%
         - Taxa de Retorno do Cliente: ${repeatingPct}%
         - Custo Efetivo do Cashback (Margem Sacrificada): ${cashbackMarginImpact.effectiveDiscount.toFixed(2)}%
         - Margem Líquida Restante após Cashback: ${cashbackMarginImpact.remainingMargin.toFixed(2)}% (Zona Crítica: ${cashbackMarginImpact.isCrisis ? 'SIM' : 'NÃO'})
         
      3. Aba Fidelidade:
         - Produto Prêmio Escolhido: ${selectedRewardProductObj ? selectedRewardProductObj.name : 'Nenhum'}
         - CMV Real do Insumo do Prêmio: R$ ${rewardCmvVal.toFixed(2)}
         - Metas de Pedidos p/ Ganhar o prêmio: ${requiredOrdersCount} pedidos.
         - Taxa de Conclusão Estimada: ${completionRate}%
         - Custo Real de Insumos adicionado por pedido (diluído): R$ ${loyaltyCostPerOrder.toFixed(2)}
         - Equivalente a Cupom Médio / Desconto real sobre receita: ${loyaltyEquivalentDiscountPercent.toFixed(1)}%
         
      4. Aba iFood Hits:
         - Pratos Selecionados Ativos: ${selectedHitsProductIds.map(id => {
           const p = products.find(prod => prod.id === id);
           if (!p) return '';
           const price = p.fixedPriceStore || 0;
           const discount = getHitsDiscount(price);
           const final = price - discount;
           const cmv = getProductCMV(p);
           const mPct = final > 0 ? ((final - cmv - (final * (couponCfi / 100))) / final) * 100 : 0;
           return `${p.name} (Preço Original: R$ ${price.toFixed(2)}, Desconto: R$ ${discount.toFixed(2)}, Preço iFood: R$ ${final.toFixed(2)}, Margem Pós-Hits: ${mPct.toFixed(1)}%)`;
         }).filter(Boolean).join(', ') || 'Nenhum prato selecionado'}
         - Elegibilidade da Loja Marcada: Pedidos >= 100: ${eligibleOrders ? 'SIM' : 'NÃO'}, Avaliação >= 3: ${eligibleRating ? 'SIM' : 'NÃO'}, Cancelamentos < 10%: ${eligibleCancellation ? 'SIM' : 'NÃO'}, Taxa de entrega paga configurada: ${eligibleDelivery ? 'SIM' : 'NÃO'}
         
      5. Aba Campanha Inteligente do iFood:
         - Investimento Diário Simulado: R$ ${smartMSpend.toFixed(2)} (Mínimo: R$ 100,00)
         - Ticket Médio Mapeado: R$ ${smartTicketVal.toFixed(2)}
         - Volume de Pedidos por Dia: ${smartDailyOrdersVal} pedidos/dia
         - Custo Mensal Estimado da Campanha: R$ ${smartMonthlyCost.toFixed(2)}
         - Pedidos Adicionais Estimados (+67%): ${smartAddOrders.toFixed(1)} pedidos/mês
         - Faturamento Adicional Estimado: R$ ${smartAddRevenue.toFixed(2)}
         - Lucro Adicional Estimado (com Margem Alvo de ${targetMargin}%): R$ ${smartAddProfit.toFixed(2)}
         - Viabilidade Recomendada: ${isSmartViable ? 'VIÁVEL' : 'INVIÁVEL'}

      Instruções do Xande sobre a Campanha Inteligente do iFood:
      - Explique que o investimento diário mínimo é de R$ 100,00 e o custo por pedido do iFood é de até R$ 5,00.
      - Alerte que o investimento não é cumulativo e o restaurante só paga por pedido realizado.
      - Se a campanha for VIÁVEL, parabenize o lojista, incentive a ativação na Central de Crescimento do iFood e recomende monitorar os resultados por 15 dias.
      - Se for INVIÁVEL, explique com franqueza que o lucro adicional esperado de R$ ${smartAddProfit.toFixed(2)} não cobre o custo de R$ ${smartMonthlyCost.toFixed(2)}. Recomende focar em aumentar o ticket médio da loja (usando adicionais turbinados como batatas, molhos e bebidas) ou melhorar a margem operacional líquida antes de investir na campanha.
      - Responda de forma direta e concisa, em até 3-4 parágrafos curtos.
      - Mantenha a metodologia CFI do Cardápio Blindado.
      - Linguagem franca, brasileira, amigável e direta.
      `;

      // Format previous chat history along with the new user message
      const historyContext = xandeChatMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'Você (Xande)'}: ${m.text}`).join('\n');
      const fullPrompt = historyContext + '\nUsuário: ' + textToSend + '\nVocê (Xande):';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: scenarioContext,
          fullPrompt: fullPrompt
        })
      });

      if (!response.ok) {
        throw new Error('Erro na API do chat. Configure a chave no servidor.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let answerText = '';
      
      if (reader) {
        // Add a temporary empty message that will be streamed into
        setXandeChatMessages(prev => {
          const newMessages = [...prev];
          newMessages.push({ role: 'model', text: '' });
          return newMessages;
        });

        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            answerText += chunk;
            
            // Update the last message in state with the new chunk
            setXandeChatMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].text = answerText;
              return newMessages;
            });
          }
        }
      } else {
        throw new Error('No body returned from stream');
      }

    } catch (error) {
      console.error(error);
      // Fallback response builder based on rule engine
      setTimeout(() => {
        if (activeSubTab === 'coupons') {
          addXandeBotMessage(`Cara, com um cupom de **R$ ${couponVal.toFixed(2)}** e insumos pesando **${couponCmv.toFixed(0)}%**, se o cliente comprar só o mínimo o seu lucro escorre pelo ralo! Para sustentar esse cupom, recomendo colocar o **Valor Mínimo do Pedido em pelo menos R$ ${minimumOrderValueForTargetMargin.toFixed(0)}** de forma que o combo garanta o seu CFI e a sua meta de lucro!`);
        } else if (activeSubTab === 'cashback') {
          addXandeBotMessage(`Fere a régua da casa dar muito cashback! Um cashback de **${cashbackPct}%** com **${repeatingPct}%** de retorno te custa de verdade **${cashbackMarginImpact.effectiveDiscount.toFixed(1)}%** da sua receita. Tente limitar o prazo do cashback ou a porcentagem para que isso não coma a sua margem!`);
        } else if (activeSubTab === 'loyalty') {
          addXandeBotMessage(`Dica de ouro no Fidelidade: Se a taxa de resgate for de **${completionRate}%**, você tem ${loyaltyEquivalentDiscountPercent.toFixed(1)}% de desconto equivalente em cada pedido! É muito mais inteligente dar de prêmio um item turbinado (Batatas Fritas ou Bebidas) para não quebrar a banca!`);
        } else if (activeSubTab === 'smart-campaign') {
          const inv = parseFloat(smartCampaignDailyInvestment || '100');
          const tkt = parseFloat(smartCampaignTicket || '55');
          const ord = parseFloat(smartCampaignDailyOrders || '15');
          const cost = inv * 30;
          const addOrders = ord * 30 * 0.67;
          const addRevenue = addOrders * tkt;
          const addProfit = addRevenue * (targetMargin / 100);
          
          if (addProfit > cost) {
            addXandeBotMessage(`Olha só! Com um ticket médio de **R$ ${tkt.toFixed(2)}** e sua margem média de **${targetMargin}%**, a Campanha Inteligente parece ser uma excelente aposta! O lucro adicional de **R$ ${addProfit.toFixed(2)}** supera seu custo mensal estimado de **R$ ${cost.toFixed(2)}**. Minha recomendação: comece com o investimento diário de **R$ 100,00**, ative na Central de Crescimento do iFood e acompanhe por 15 dias!`);
          } else {
            addXandeBotMessage(`Atenção aqui! Com os números atuais, o custo estimado da Campanha Inteligente (**R$ ${cost.toFixed(2)}**) pode superar o lucro adicional (**R$ ${addProfit.toFixed(2)}**). Para viabilizar, recomendo aumentar seu ticket médio para pelo menos **R$ ${(cost / (ord * 30 * 0.67 * (targetMargin / 100))).toFixed(0)}** oferecendo produtos turbinados (batata, bebida) na jornada de compra do cliente!`);
          }
        } else {
          addXandeBotMessage(`O segredo no iFood Hits é o volume e as margens dos pratos! Selecione de 1 a 3 pratos que tenham uma margem saudável superior a 18% mesmo após o desconto da tabela. E lembre-se: se sua entrega for grátis, o iFood não subsidiará nada, então cobre uma taxa de entrega real do cliente de pelo menos R$ 7,00!`);
        }
      }, 800);
    } finally {
      setIsXandeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* App Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1e293b]/50 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <Percent className="h-6 w-6 text-brand-yellow animate-bounce" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">SIMULADOR DE DESCONTOS & FIDELIDADE</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Modele cupons, programas de fidelidade e cashback antes de anunciar. Evite prejuízos entendendo o impacto real no seu CMV e no seu CFI.
          </p>
        </div>
        {salesTransactions.length > 0 && (
          <button 
            onClick={handleApplyAverages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 hover:bg-emerald-100 transition shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Puxar Médias de Faturamento
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Workspace controls tab */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 shadow-sm">
            
            {/* Top Sub Tabs selection */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 pb-2 gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory">
              <button 
                onClick={() => setActiveSubTab('coupons')}
                className={`pb-2 px-4 text-xs font-black transition tracking-wider uppercase flex items-center gap-1.5 shrink-0 snap-start ${
                  activeSubTab === 'coupons' 
                    ? 'border-b-2 border-brand-red text-brand-red' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                }`}
              >
                <Calculator className="h-4 w-4" />
                Cupons & CAC
              </button>
              <button 
                onClick={() => setActiveSubTab('cashback')}
                className={`pb-2 px-4 text-xs font-black transition tracking-wider uppercase flex items-center gap-1.5 shrink-0 snap-start ${
                  activeSubTab === 'cashback' 
                    ? 'border-b-2 border-brand-red text-brand-red' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                }`}
              >
                <Percent className="h-4 w-4" />
                Programa de Cashback
              </button>
              <button 
                onClick={() => setActiveSubTab('loyalty')}
                className={`pb-2 px-4 text-xs font-black transition tracking-wider uppercase flex items-center gap-1.5 shrink-0 snap-start ${
                  activeSubTab === 'loyalty' 
                    ? 'border-b-2 border-brand-red text-brand-red' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                }`}
              >
                <Gift className="h-4 w-4" />
                Cartão Fidelidade
              </button>
              <button 
                onClick={() => setActiveSubTab('ifood-hits')}
                className={`pb-2 px-4 text-xs font-black transition tracking-wider uppercase flex items-center gap-1.5 shrink-0 snap-start ${
                  activeSubTab === 'ifood-hits' 
                    ? 'border-b-2 border-brand-red text-brand-red' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                }`}
              >
                <Award className="h-4 w-4" />
                iFood Hits
              </button>
              <button 
                onClick={() => setActiveSubTab('smart-campaign')}
                className={`pb-2 px-4 text-xs font-black transition tracking-wider uppercase flex items-center gap-1.5 shrink-0 snap-start whitespace-nowrap ${
                  activeSubTab === 'smart-campaign' 
                    ? 'border-b-2 border-brand-red text-brand-red' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                }`}
              >
                <Compass className="h-4 w-4" />
                Campanha Inteligente
              </button>
            </div>

            {/* --- TAB 1: COUPONS --- */}
            {activeSubTab === 'coupons' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-tight">Tipo de Campanha de Cupom</h3>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => { setCouponCampaignType('new_customers'); setSimulatedCouponValue('12'); }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-24 ${
                        couponCampaignType === 'new_customers' 
                          ? 'border-brand-red bg-red-50/20 dark:bg-red-950/10 text-brand-red' 
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 text-gray-500'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <div>
                        <span className="text-[10px] font-black uppercase block leading-none">Atrair</span>
                        <span className="text-[11px] font-bold mt-1 block">Novos Clientes</span>
                      </div>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => { setCouponCampaignType('recurrents'); setSimulatedCouponValue('7'); }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-24 ${
                        couponCampaignType === 'recurrents' 
                          ? 'border-brand-red bg-red-50/20 dark:bg-red-950/10 text-brand-red' 
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 text-gray-500'
                      }`}
                    >
                      <Timer className="h-4 w-4" />
                      <div>
                        <span className="text-[10px] font-black uppercase block leading-none">Fidelizar</span>
                        <span className="text-[11px] font-bold mt-1 block">Recorrentes</span>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setCouponCampaignType('lost_customers'); setSimulatedCouponValue('15'); }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-24 ${
                        couponCampaignType === 'lost_customers' 
                          ? 'border-brand-red bg-red-50/20 dark:bg-red-950/10 text-brand-red' 
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 text-gray-500'
                      }`}
                    >
                      <Compass className="h-4 w-4" />
                      <div>
                        <span className="text-[10px] font-black uppercase block leading-none">Resgatar</span>
                        <span className="text-[11px] font-bold mt-1 block">Clientes Sumidos</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Ticket Médio Projetado</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">R$</span>
                      <input 
                        type="number" 
                        value={simulatedTicket}
                        onChange={(e) => updateState(setSimulatedTicket, 'ticket', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Valor do Cupom</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">R$</span>
                      <input 
                        type="number" 
                        value={simulatedCouponValue}
                        onChange={(e) => updateState(setSimulatedCouponValue, 'coupon_val', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">CMV Médio (%)</label>
                    <div className="relative">
                      <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">%</span>
                      <input 
                        type="number" 
                        value={simulatedCmvPercent}
                        onChange={(e) => updateState(setSimulatedCmvPercent, 'cmv_pct', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pr-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">CFI Empresa (%)</label>
                    <div className="relative">
                      <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">%</span>
                      <input 
                        type="number" 
                        value={simulatedCfiPercent}
                        onChange={(e) => updateState(setSimulatedCfiPercent, 'cfi_pct', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pr-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* CAC Metrics section */}
                <div className="border-t border-dashed border-gray-200 dark:border-gray-800 pt-4 space-y-3">
                  <h4 className="font-black text-xs text-slate-500 uppercase flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Métricas de Custo de Aquisição (CAC)
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    O cupom atua como um desconto imediato que compõe seu CAC. Insira os gastos de anúncios/anúncios impulsionados para esse cupom para ver a diluição:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Investimento Anúncios da Campanha</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs font-mono font-bold">R$</span>
                        <input 
                          type="number" 
                          value={marketingSpend}
                          onChange={(e) => updateState(setMarketingSpend, 'mkt_spend', e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Qtd Pedidos Esperada</label>
                      <input 
                        type="number" 
                        value={expectedConversions}
                        onChange={(e) => updateState(setExpectedConversions, 'conversions', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-900">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Custo Exclusivo de Marketing / Pedido</span>
                      <span className="font-extrabold text-sm font-mono text-gray-700 dark:text-white">{formatMoney(overheadCACPerCustomer)}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">CAC Total do Conquistado (Cupom + Mkt)</span>
                      <span className="font-black text-sm font-mono text-brand-red">{formatMoney(totalCACPerAcquired)}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated scenarios summary cards */}
                <div className="bg-red-50/50 dark:bg-red-950/10 p-5 rounded-2xl border border-red-200/50 dark:border-red-900/40 space-y-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="font-black text-xs text-red-800 dark:text-red-300 uppercase">Análise de Segurança do Cupom (Ticket Mínimo)</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Cuidado, se você aplicar um cupom de <strong>R$ {couponVal.toFixed(2)}</strong> num cliente que não atinge um ticket favorável, você paga para trabalhar. Para sua hamburgueria manter saúde (pagar <strong>{couponCmv.toFixed(0)}%</strong> de CMV e <strong>{couponCfi.toFixed(0)}%</strong> de gastos fixos CFI), o pedido deve respeitar as réguas abaixo:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-red-200/40 dark:border-red-900/25">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block leading-none">Min. Pedido Zero-a-Zero (Lucro R$ 0)</span>
                      <div className="text-lg font-black text-orange-600 dark:text-orange-400 font-mono mt-1">
                        {formatMoney(minimumOrderValueForCoupon)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block leading-none">Min. Pedido p/ Lucrar Alvo de {cfi.profitMargin.toFixed(0)}%</span>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                        {formatMoney(minimumOrderValueForTargetMargin)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2 border-t border-red-200/40 dark:border-red-900/25">
                     <button 
                       onClick={() => {
                         setXandeInput("Xande, me dê uma dica rápida de como esse cupom impacta as finanças da minha loja considerando meu CMV e CFI atual.");
                         // Auto-submit won't work perfectly this way without a ref, but we will just set it
                       }}
                       className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60 px-3 py-1.5 rounded-lg transition"
                     >
                        💡 Pedir Dica do Xande
                     </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: CASHBACK --- */}
            {activeSubTab === 'cashback' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-tight">Parametrizador de Cashback</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Defina o cashback em porcentagem e estime a taxa de retorno. Calcule o custo real na operação.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Cashback (%)</label>
                    <div className="relative">
                      <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">%</span>
                      <input 
                        type="number" 
                        value={simulatedCashbackPercent}
                        onChange={(e) => updateState(setSimulatedCashbackPercent, 'cb_pct', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pr-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Regate Min. (R$)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">R$</span>
                      <input 
                        type="number" 
                        value={cashbackMinRedeem}
                        onChange={(e) => updateState(setCashbackMinRedeem, 'cb_min', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Validade (Dias)</label>
                    <input 
                      type="number" 
                      value={cashbackValidityDays}
                      onChange={(e) => updateState(setCashbackValidityDays, 'cb_days', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Retorno Estimado (%)</label>
                    <div className="relative">
                      <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">%</span>
                      <input 
                        type="number" 
                        value={recurrenceRate}
                        onChange={(e) => updateState(setRecurrenceRate, 'cb_recurrence', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pr-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Cashback safety audit */}
                <div className={`p-5 rounded-2xl border ${
                  cashbackMarginImpact.isCrisis 
                    ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/40 text-red-700' 
                    : 'bg-emerald-50/55 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40 text-emerald-700'
                } space-y-3`}>
                  <div className="flex gap-2">
                    {cashbackMarginImpact.isCrisis ? (
                      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-black text-xs uppercase">Auditoria de Cashback Xande</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Como apenas **{repeatingPct}%** dos clientes atingem o resgate de R$ {cashbackMinRedeem} em {cashbackValidityDays} dias, o cashback nominal de **{cashbackPct}%** custará na verdade **{cashbackMarginImpact.effectiveDiscount.toFixed(1)}%** do faturamento integral na vida real.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-200/20">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Custo Médio Real Diluído</span>
                      <div className="text-base font-black font-mono">
                        {cashbackMarginImpact.effectiveDiscount.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Margem Pós-Cashback</span>
                      <div className={`text-base font-black font-mono ${cashbackMarginImpact.isCrisis ? 'text-red-600' : 'text-emerald-600'}`}>
                        {cashbackMarginImpact.remainingMargin.toFixed(1)}% {cashbackMarginImpact.isCrisis ? '⏳ PERIGO' : '🔥 OK'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Crescimento Faturamento Rqrd.</span>
                      <div className="text-base font-black font-mono text-gray-700 dark:text-gray-300">
                        {cashbackMarginImpact.requiredTicketIncreasePct.toFixed(1)}% 
                      </div>
                    </div>
                  </div>
                </div>
                
                 {/* Cashback scenarios summary table */}
                 <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-bold">Cenários de Ticket</th>
                          <th className="px-4 py-3 font-bold text-right">Cashback Bruto</th>
                          <th className="px-4 py-3 font-bold text-right">Custo Efetivo Diário</th>
                          <th className="px-4 py-3 font-bold text-right">Lucro Líquido Real</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {cashbackScenarios.map((scen, idx) => (
                          <tr key={idx} className="bg-white dark:bg-[#111827]">
                            <td className="px-4 py-3 font-mono font-bold text-gray-700 dark:text-gray-300">
                              {idx === 0 ? "Ticket Baixo" : idx === 1 ? "Seu Ticket Médio" : "Ticket Elevado"}
                              <span className="block text-[10px] text-gray-400 font-normal">{formatMoney(scen.t)}</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-500 text-right">- {formatMoney(scen.generatedCashback)}</td>
                            <td className="px-4 py-3 font-mono text-brand-red text-right">- {formatMoney(scen.effectiveCost)} ({cashbackMarginImpact.effectiveDiscount.toFixed(1)}%)</td>
                            <td className="px-4 py-3 font-mono font-black text-emerald-600 text-right">{formatMoney(scen.netProfit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>

                 <div className="flex justify-end">
                     <button 
                       onClick={() => {
                         setXandeInput("Xande, analisa pra mim o custo efetivo desse programa de cashback na minha margem real.");
                       }}
                       className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg transition"
                     >
                        💡 Pedir Dica do Xande
                     </button>
                  </div>
              </div>
            )}

            {/* --- TAB 3: LOYALTY --- */}
            {activeSubTab === 'loyalty' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-tight">Cartão Fidelidade Estratégico</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Crie fidelidade baseada em volume. Escolha um produto do seu cardápio como recompensa e calcule o custo diluído por pedido.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Selecione o Item Recompensa</label>
                    <select 
                      value={selectedProductIdForReward}
                      onChange={(e) => updateState(setSelectedProductIdForReward, 'loyalty_prod', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg p-2.5 text-xs outline-none focus:border-brand-red font-bold"
                    >
                      <option value="">-- Escolher Produto --</option>
                      {getSortedProducts().map(p => {
                        const cmv = getProductCMV(p);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} (CMV {formatMoney(cmv)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Meta de Pedidos Necessária</label>
                    <input 
                      type="number" 
                      min="2"
                      value={loyaltyRequiredOrders}
                      onChange={(e) => updateState(setLoyaltyRequiredOrders, 'loyalty_orders', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Taxa de Conclusão (%)</label>
                    <div className="relative">
                      <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">%</span>
                      <input 
                        type="number" 
                        min="1"
                        max="100"
                        value={loyaltyCompletionRate}
                        onChange={(e) => updateState(setLoyaltyCompletionRate, 'loyalty_completion', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg pr-8 p-2 text-xs outline-none focus:border-brand-red font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Loyalty safety cards */}
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-gray-200 dark:border-gray-900 space-y-4">
                  <div className="flex gap-2">
                    <Award className="h-5 w-5 text-brand-yellow shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-xs text-slate-700 dark:text-white uppercase leading-none">Matemática do Prêmio Diluído</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                        Como apenas **{completionRate}%** dos clientes chegam até a recompensa, o custo do prêmio ao longo de **{requiredOrdersCount} pedidos** adiciona o seguinte custo na sua operação:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-gray-200/50 dark:border-gray-800/50">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase block">Desconto Equivalente</span>
                      <div className="text-sm font-black text-orange-600 dark:text-orange-400 font-mono">
                        {loyaltyEquivalentDiscountPercent.toFixed(1)}% por Pedido
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase block">Custo de Insumo Adicionado</span>
                      <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                        {formatMoney(loyaltyCostPerOrder)} / pedido
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-[9px] text-gray-400 uppercase block">CMV Total do Brinde</span>
                      <div className="text-sm font-black font-mono text-gray-700 dark:text-white">
                        {formatMoney(rewardCmvVal)} ({selectedRewardProductObj ? 'FT' : 'Est.'})
                      </div>
                    </div>
                  </div>
                </div>
                
                 {/* Loyalty comparison table */}
                 <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-bold">Visão do Cliente</th>
                          <th className="px-4 py-3 font-bold text-right">Sem Programa</th>
                          <th className="px-4 py-3 font-bold text-right">Com Programa de Fidelidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        <tr className="bg-white dark:bg-[#111827]">
                          <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Total Gasto ({requiredOrdersCount} pedidos)</td>
                          <td className="px-4 py-3 text-right font-mono">{formatMoney(initialTicketVal * requiredOrdersCount)}</td>
                          <td className="px-4 py-3 text-right font-mono">{formatMoney(initialTicketVal * requiredOrdersCount)}</td>
                        </tr>
                        <tr className="bg-white dark:bg-[#111827]">
                          <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Lucro Líquido Retido</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                            {formatMoney((initialTicketVal * requiredOrdersCount) * (cfi.profitMargin / 100))}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                            {formatMoney(((initialTicketVal * requiredOrdersCount) * (cfi.profitMargin / 100)) - loyaltyCostPerOrder * requiredOrdersCount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                 </div>

                 <div className="flex justify-end">
                     <button 
                       onClick={() => {
                         setXandeInput("Xande, avalia se vale a pena esse programa de fidelidade que eu montei. O equivalente de perda e o impacto de insumos estão bons?");
                       }}
                       className="text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 px-3 py-1.5 rounded-lg transition"
                      >
                        💡 Pedir Dica do Xande
                      </button>
                  </div>
              </div>
            )}
          </div>

            {/* --- TAB 4: IFOOD HITS --- */}
            {activeSubTab === 'ifood-hits' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-tight">Participação no Programa iFood Hits</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Simule e planeje sua participação no iFood Hits para aumentar suas vendas com entregas subsidiadas sem destruir o lucro da sua loja.
                  </p>
                </div>

                {/* Card Informativo do iFood Hits */}
                <div className="p-5 bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 mt-0.5">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-red-700 dark:text-red-400 uppercase tracking-wide">O que é o iFood Hits?</h4>
                      <p className="text-[11px] text-gray-600 dark:text-gray-350 mt-1 leading-relaxed">
                        O **iFood Hits** é uma promoção do iFood onde o restaurante oferece desconto no prato e o iFood subsidia 100% da taxa de entrega em até R$ 10 para pedidos até 3km, gerando mais visibilidade e podendo aumentar em até 67% o volume de pedidos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alerta de Taxa de Entrega (Amarelo) */}
                <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-xl space-y-2 text-xs text-amber-900 dark:text-amber-300">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Atenção sobre a taxa de entrega</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Atenção sobre a taxa de entrega. Para o iFood subsidiar sua entrega você precisa ter uma taxa de entrega configurada e paga pelo cliente. Se você trabalha com entrega grátis o iFood não consegue subsidiar nada. Configure uma taxa de entrega de pelo menos R$ 7,00 para pedidos até 3km. Se sua taxa for R$ 7,00 e o iFood cobre até R$ 10,00 o cliente paga R$ 0,00 de entrega e você ainda recebe R$ 3,00 de subsídio do iFood como bônus.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowHitsTooltip(!showHitsTooltip)}
                      className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      💡 {showHitsTooltip ? 'Fechar Detalhes' : 'Entender melhor'}
                    </button>
                  </div>
                </div>

                {/* Tooltip explicativo do cálculo completo */}
                {showHitsTooltip && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-xl space-y-2 text-[11px] relative animate-fade-in text-gray-700 dark:text-gray-300">
                    <button 
                      type="button"
                      onClick={() => setShowHitsTooltip(false)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                      <X size={14} />
                    </button>
                    <h5 className="font-extrabold text-amber-850 dark:text-amber-400 uppercase tracking-wider">Cálculo de Subsídio Detalhado:</h5>
                    <p className="leading-relaxed">
                      Quando você define uma taxa de entrega própria paga pelo cliente (como <strong>R$ 7,00</strong>), o iFood subsidia até <strong>R$ 10,00</strong> no iFood Hits.<br />
                      • <strong>O Cliente Paga:</strong> R$ 0,00 de entrega (pois sua taxa de R$ 7,00 está totalmente coberta pelos R$ 10,00 subsidiados).<br />
                      • <strong>A Sua Loja Recebe:</strong> O iFood repassa os R$ 7,00 integrais da sua taxa configurada, <strong>mais R$ 3,00 adicionais como bônus direto no seu repasse</strong>! Assim o subsídio totaliza R$ 10,00, gerando um ganho de R$ 3,00 bônus para sua loja além da entrega grátis para o cliente.
                    </p>
                  </div>
                )}

                {/* Critérios de Elegibilidade com Checkboxes */}
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-gray-200 dark:border-gray-900 space-y-3">
                  <h4 className="font-black text-xs text-gray-700 dark:text-white uppercase">Sua Loja Atende aos Critérios de Elegibilidade?</h4>
                  <p className="text-[10px] text-gray-400 leading-none">Marque os requisitos que sua hamburgueria cumpre atualmente:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-900 rounded-lg cursor-pointer hover:bg-gray-100/30 transition">
                      <input 
                        type="checkbox" 
                        checked={eligibleOrders} 
                        onChange={() => setEligibleOrders(!eligibleOrders)} 
                        className="h-4 w-4 text-brand-red focus:ring-brand-red border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-350 leading-tight">Média de **100 pedidos/mês** nos últimos 3 meses</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-900 rounded-lg cursor-pointer hover:bg-gray-100/30 transition">
                      <input 
                        type="checkbox" 
                        checked={eligibleRating} 
                        onChange={() => setEligibleRating(!eligibleRating)} 
                        className="h-4 w-4 text-brand-red focus:ring-brand-red border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-350 leading-tight">Avaliação mínima **Nota 3** no iFood</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-900 rounded-lg cursor-pointer hover:bg-gray-100/30 transition">
                      <input 
                        type="checkbox" 
                        checked={eligibleCancellation} 
                        onChange={() => setEligibleCancellation(!eligibleCancellation)} 
                        className="h-4 w-4 text-brand-red focus:ring-brand-red border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-350 leading-tight">Taxa de cancelamento **abaixo de 10%**</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-900 rounded-lg cursor-pointer hover:bg-gray-100/30 transition">
                      <input 
                        type="checkbox" 
                        checked={eligibleDelivery} 
                        onChange={() => setEligibleDelivery(!eligibleDelivery)} 
                        className="h-4 w-4 text-brand-red focus:ring-brand-red border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-350 leading-tight">Ter uma **taxa de entrega configurada e paga** pelo cliente</span>
                    </label>
                  </div>

                  {(!eligibleOrders || !eligibleRating || !eligibleCancellation || !eligibleDelivery) ? (
                    <div className="p-3 bg-red-100/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-xs leading-relaxed font-bold">
                      ⚠️ Sua loja ainda não cumpre todos os pré-requisitos fundamentais para habilitar o iFood Hits! Ajuste os pontos indicados.
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-100/50 dark:bg-emerald-950/10 border border-emerald-200/40 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs leading-relaxed font-bold">
                      ✅ Sua loja atende perfeitamente a todos os requisitos! Você está elegível para ativar o iFood Hits no painel do iFood.
                    </div>
                  )}
                </div>

                {/* Tabela Informativa das Faixas de Investimento */}
                <div className="space-y-2">
                  <h4 className="font-black text-xs text-gray-700 dark:text-white uppercase">Tabela de Investimento Obrigatório (Desconto)</h4>
                  <p className="text-[11px] text-gray-400">O iFood exige que o restaurante conceda os seguintes descontos automáticos de acordo com o preço base do prato:</p>
                  
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase text-gray-500 font-bold">
                        <tr>
                          <th className="px-4 py-3">Preço Base do Prato</th>
                          <th className="px-4 py-3">Desconto Pago pelo Restaurante</th>
                          <th className="px-4 py-3">Preço Limiar Recomendado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs">
                        <tr className="bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-300">
                          <td className="px-4 py-3 font-semibold">R$ 15,00 a R$ 24,99</td>
                          <td className="px-4 py-3 font-black text-brand-red">R$ 5,00</td>
                          <td className="px-4 py-3 text-gray-400">Evite margens espremidas em R$ 15,00.</td>
                        </tr>
                        <tr className="bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-300">
                          <td className="px-4 py-3 font-semibold">R$ 25,00 a R$ 39,99</td>
                          <td className="px-4 py-3 font-black text-brand-red">R$ 8,00</td>
                          <td className="px-4 py-3 text-gray-400">Excelente faixa de retorno para burguers clássicos.</td>
                        </tr>
                        <tr className="bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-300">
                          <td className="px-4 py-3 font-semibold">R$ 40,00 a R$ 59,99</td>
                          <td className="px-4 py-3 font-black text-brand-red">R$ 10,00</td>
                          <td className="px-4 py-3 text-gray-400">Ideal para combos individuais ou duplos.</td>
                        </tr>
                        <tr className="bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-300">
                          <td className="px-4 py-3 font-semibold">R$ 60,00 a R$ 80,00</td>
                          <td className="px-4 py-3 font-black text-brand-red">R$ 13,00 (Válido p/ Pizzas)</td>
                          <td className="px-4 py-3 text-gray-400">Indicado para combos de maior valor ou pizzas.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Seleção de Produtos para Simulação */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-xs text-gray-700 dark:text-white uppercase">Selecione seus Pratos para o iFood Hits (Máximo 3)</h4>
                    <span className="bg-gray-100 dark:bg-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full text-gray-500 font-mono">
                      {selectedHitsProductIds.length}/3 Selecionados
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">Selecione os lanches da sua casa de alimentação para simular se a margem resiste ao desconto do Hits:</p>

                  <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#111827]">
                    {getSortedProducts().map(p => {
                      const storePrice = p.fixedPriceStore || 0;
                      const ifoodPrice = getIfoodBasePrice(p);
                      const isPriceEligible = ifoodPrice >= 15 && ifoodPrice <= 80;
                      const isSelected = selectedHitsProductIds.includes(p.id);
                      const cmvVal = getProductCMV(p);

                      return (
                        <div 
                          key={p.id}
                          onClick={() => isPriceEligible && toggleHitsProduct(p.id)}
                          className={`p-3 flex items-center justify-between text-xs transition select-none ${
                            !isPriceEligible 
                              ? 'bg-gray-50/50 dark:bg-gray-950/20 opacity-50 cursor-not-allowed' 
                              : 'hover:bg-gray-50 dark:hover:bg-slate-900/30 cursor-pointer'
                          } ${isSelected ? 'bg-red-50/20 dark:bg-red-950/10' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              disabled={!isPriceEligible}
                              readOnly
                              className={`h-3.5 w-3.5 rounded border-gray-300 text-brand-red focus:ring-brand-red ${!isPriceEligible ? 'opacity-30' : ''}`}
                            />
                            <div>
                              <span className="font-bold text-gray-850 dark:text-gray-100">{p.name}</span>
                              <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-gray-400">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">PV iFood: {formatMoney(ifoodPrice)}</span>
                                <span className="text-gray-300 dark:text-gray-800">|</span>
                                <span>PV Loja: {formatMoney(storePrice)}</span>
                                <span className="text-gray-300 dark:text-gray-800">|</span>
                                <span>Custo de Insumo: {formatMoney(cmvVal)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {!isPriceEligible ? (
                              <span className="text-[9px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold px-2 py-0.5 rounded-full font-sans uppercase">
                                Fora da Faixa do Hits (R$ 15-80)
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-gray-500">
                                Desconto: {formatMoney(getHitsDiscount(ifoodPrice))}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Análise individual de margem dos pratos selecionados */}
                {selectedHitsProductIds.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-black text-xs text-gray-700 dark:text-white uppercase">Análise de Rentabilidade dos Pratos Selecionados</h4>
                    
                    <div className="space-y-4">
                      {selectedHitsProductIds.map(id => {
                        const p = products.find(prod => prod.id === id);
                        if (!p) return null;

                        const originalPrice = getIfoodBasePrice(p);
                        const discount = getHitsDiscount(originalPrice);
                        const finalPrice = originalPrice - discount;
                        const cmvVal = getProductCMV(p);
                        
                        const pricing = p.pricing || {};
                        const ifoodFee = pricing.ifood?.fee ?? platformConfig.ifood.fee;
                        const ifoodOnline = pricing.ifood?.onlinePayment ?? platformConfig.ifood.onlinePayment;
                        const ifoodAntic = pricing.ifood?.anticipation ?? platformConfig.ifood.anticipation;
                        const ifoodDel = pricing.ifood?.delivery ?? platformConfig.ifood.delivery;
                        const ifoodCoupon = pricing.ifood?.coupon ?? 0;
                        const feesPct = ifoodFee + ifoodOnline + ifoodAntic;
                        
                        const cfiPercent = parseFloat(simulatedCfiPercent) || totalCfiPercent;
                        const cfiCost = finalPrice * (cfiPercent / 100);
                        const ifoodFeesCost = finalPrice * (feesPct / 100) + ifoodDel + ifoodCoupon;
                        const totalDeductions = ifoodFeesCost + cfiCost;
                        
                        const lucroReais = finalPrice - cmvVal - totalDeductions;
                        const marginPct = finalPrice > 0 ? (lucroReais / finalPrice) * 100 : 0;

                        // Determinar criticidade e cores
                        let statusColor = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/40';
                        let badgeColor = 'bg-red-500 text-white';
                        let xandeMessage = `⚠️ Xande alerta: Esse prato NÃO é indicado para o Hits porque o desconto compromete demais a margem (${marginPct.toFixed(1)}%). Você perderá dinheiro em cada venda! Recomendamos aumentar o preço de venda original no iFood antes de participar.`;
                        
                        if (marginPct > 18) {
                          statusColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40';
                          badgeColor = 'bg-emerald-500 text-white';
                          xandeMessage = `🟢 Xande aconselha: Prato IDEAL para o Hits! Mesmo com o desconto, você mantém uma boa margem de lucro de ${marginPct.toFixed(1)}%. Pode ativar sem medo!`;
                        } else if (marginPct >= 10) {
                          statusColor = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40';
                          badgeColor = 'bg-amber-500 text-slate-950';
                          xandeMessage = `🟡 Xande aconselha: Margem espremida/aceitável (${marginPct.toFixed(1)}%). O volume compensa, mas monitore de perto os descartes e desperdícios na cozinha para não amargar prejuízos!`;
                        }

                        const suggested = getSuggestedPricesForHits(p);
                        const isComboTriggered = suggested.priceForMargin && suggested.priceForMargin > originalPrice * 1.50;

                        return (
                          <div key={p.id} className="bg-white dark:bg-[#111827] border border-gray-250 dark:border-gray-800 rounded-2xl p-5 space-y-5 shadow-xs">
                            
                            {/* BLOCO 1: O Termômetro Atual (Situação Real) */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-900 pb-2.5">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                                    <span className="text-gray-400 font-normal">LANCHE:</span> {p.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 block font-medium">Situação Real Praticada Atual</span>
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${badgeColor}`}>
                                  Margem Atual: {marginPct.toFixed(1)}%
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                                  <span className="text-[9px] text-gray-400 uppercase font-sans font-bold block mb-0.5">Preço de Tabela no iFood</span>
                                  <span className="font-bold text-gray-750 dark:text-gray-350">{formatMoney(originalPrice)}</span>
                                </div>
                                <div className="bg-red-50/20 dark:bg-red-950/5 p-2.5 rounded-xl border border-red-500/10">
                                  <span className="text-[9px] text-gray-400 uppercase font-sans font-bold block mb-0.5">Desconto da Faixa</span>
                                  <span className="font-bold text-brand-red">- {formatMoney(discount)}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                                  <span className="text-[9px] text-gray-400 uppercase font-sans font-bold block mb-0.5">Preço Recebido</span>
                                  <span className="font-bold text-emerald-600">{formatMoney(finalPrice)}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                                  <span className="text-[9px] text-gray-400 uppercase font-sans font-bold block mb-0.5">Custo de Insumo (CMV)</span>
                                  <span className="font-bold text-gray-750 dark:text-gray-350">{formatMoney(cmvVal)} <span className="text-[9px] text-gray-400 font-normal">({((cmvVal / finalPrice) * 100).toFixed(0)}%)</span></span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                                  <span className="text-[9px] text-gray-400 uppercase font-sans font-bold block mb-0.5">Taxas do Plano ({feesPct.toFixed(1)}%)</span>
                                  <span className="font-bold text-brand-red">{formatMoney(ifoodFeesCost)}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                                  <span className="text-[9px] text-gray-400 uppercase font-sans font-bold block mb-0.5">Custos Fixos da Loja ({cfiPercent.toFixed(1)}%)</span>
                                  <span className="font-bold text-gray-750 dark:text-gray-350">{formatMoney(cfiCost)}</span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-900">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[10px] text-gray-400 uppercase font-sans font-semibold">Lucro Real Estimado Atual:</span>
                                  <span className={`font-black text-sm ${lucroReais >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatMoney(lucroReais)} / venda
                                  </span>
                                </div>
                              </div>

                              {/* Alerta do Consultor Xande */}
                              <div className={`p-3 rounded-xl border text-[11px] font-semibold leading-relaxed ${statusColor}`}>
                                {xandeMessage}
                              </div>
                            </div>

                            {/* BLOCO 2: A Recomendação Principal (Foco no Lucro em Reais) */}
                            <div className="space-y-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                              <div className="space-y-1">
                                <h5 className="font-black text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>🎯 Preço Sugerido para Manter seu Lucro em Dinheiro</span>
                                </h5>
                                <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
                                  Cadastre este valor no iFood para colocar no bolso exatamente os mesmos <strong className="font-bold text-gray-700 dark:text-gray-300">{formatMoney(suggested.storeProfit)}</strong> líquidos (Lucro de Balcão) que você ganha vendendo na sua loja física.
                                </p>
                              </div>

                              {suggested.priceForSameProfit ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-500/5 dark:bg-emerald-950/15 border border-emerald-500/15 dark:border-emerald-500/10 p-4 rounded-2xl">
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-gray-400 uppercase font-sans font-bold block">Preço de Tabela no iFood (Cadastrar no App)</span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                        {formatMoney(suggested.priceForSameProfit)}
                                      </span>
                                      <span className="text-[10px] text-gray-400 italic">(-{formatMoney(getHitsDiscount(suggested.priceForSameProfit))} de desconto)</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1 md:border-l md:border-emerald-500/10 md:pl-4">
                                    <span className="text-[10px] text-gray-400 uppercase font-sans font-bold block">Preço que o Cliente vai Ver (Final c/ Hits)</span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-lg font-black text-gray-750 dark:text-gray-200 font-mono">
                                        {formatMoney(suggested.priceForSameProfit - getHitsDiscount(suggested.priceForSameProfit))}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[11px] text-red-500 italic p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                  *Impossível calcular blindagem de caixa. Verifique se os Custos Fixos da sua Loja (Aluguel, Luz, Funcionários) ou as comissões superam o preço limite de R$ 80,00.
                                </div>
                              )}
                            </div>

                            {/* BLOCO 3: O Alerta de Inteligência Comercial (Estratégia de Combos) */}
                            {suggested.priceForMargin && (
                              <div className="pt-2">
                                {isComboTriggered ? (
                                  <div className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 dark:border-amber-500/10 rounded-2xl p-4 space-y-2">
                                    <div className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <span>💡 Dica do Consultor (Estratégia de Combo)</span>
                                    </div>
                                    <p className="text-gray-650 dark:text-gray-300 text-[11px] leading-relaxed">
                                      Para atingir uma Margem Percentual Ideal de {suggested.targetMargin}% neste programa, o preço de tabela do iFood ficaria muito alto para um item individual ({formatMoney(suggested.priceForMargin)}). <strong className="font-bold text-amber-700 dark:text-amber-400">Recomendamos que você junte este item com uma Batata e um Refrigerante e cadastre como um COMBO no iFood Hits!</strong>
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-gray-150 dark:border-gray-800 rounded-2xl p-3 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="space-y-0.5">
                                      <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider block">Opção Alternativa (Margem Percentual Ideal)</span>
                                      <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                                        Se preferir focar na Margem Percentual Alvo de <strong className="font-bold">{suggested.targetMargin}%</strong>:
                                      </p>
                                    </div>
                                    <div className="flex items-baseline gap-2 font-mono">
                                      <span className="text-[10px] text-gray-400">Tabela iFood:</span>
                                      <span className="font-bold text-slate-700 dark:text-slate-300">{formatMoney(suggested.priceForMargin)}</span>
                                      <span className="text-[10px] text-gray-400">(Final c/ Hits: {formatMoney(suggested.priceForMargin - getHitsDiscount(suggested.priceForMargin))})</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resumo Consolidado Mensal dos 3 Pratos */}
                {selectedHitsProductIds.length > 0 && (
                  <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
                    <div>
                      <h4 className="font-black text-xs text-gray-700 dark:text-white uppercase tracking-tight">Resumo Consolidado Mensal do iFood Hits</h4>
                      <p className="text-[10px] text-gray-400 leading-normal mt-1">
                        Baseado na média mínima exigida de **100 pedidos/mês** distribuídos igualmente entre os pratos selecionados ({Math.round(100 / selectedHitsProductIds.length)} pedidos cada):
                      </p>
                    </div>

                    {(() => {
                      const N = selectedHitsProductIds.length;
                      const qty = 100 / N;
                      
                      let totalInvestment = 0;
                      let totalProfitWithHits = 0;
                      let totalProfitWithoutHits = 0;
                      let totalProfitWithRecommended = 0;

                      selectedHitsProductIds.forEach(id => {
                        const p = products.find(prod => prod.id === id);
                        if (!p) return;

                        const originalPrice = getIfoodBasePrice(p);
                        const discount = getHitsDiscount(originalPrice);
                        const finalPrice = originalPrice - discount;
                        const cmvVal = getProductCMV(p);
                        
                        const pricing = p.pricing || {};
                        const ifoodFee = pricing.ifood?.fee ?? platformConfig.ifood.fee;
                        const ifoodOnline = pricing.ifood?.onlinePayment ?? platformConfig.ifood.onlinePayment;
                        const ifoodAntic = pricing.ifood?.anticipation ?? platformConfig.ifood.anticipation;
                        const ifoodDel = pricing.ifood?.delivery ?? platformConfig.ifood.delivery;
                        const ifoodCoupon = pricing.ifood?.coupon ?? 0;
                        const feesPct = ifoodFee + ifoodOnline + ifoodAntic;
                        
                        const cfiPercent = parseFloat(simulatedCfiPercent) || totalCfiPercent;
                        const cfiCost = finalPrice * (cfiPercent / 100);
                        const ifoodFeesCost = finalPrice * (feesPct / 100) + ifoodDel + ifoodCoupon;
                        const totalDeductions = ifoodFeesCost + cfiCost;
                        
                        const lucroReais = finalPrice - cmvVal - totalDeductions;

                        // Lucro sem hits (venda cheia, mas volume menor)
                        const cfiCostWithoutHits = originalPrice * (cfiPercent / 100);
                        const ifoodFeesWithoutHits = originalPrice * (feesPct / 100) + ifoodDel + ifoodCoupon;
                        const lucroReaisWithoutHits = originalPrice - cmvVal - cfiCostWithoutHits - ifoodFeesWithoutHits;

                        // Preço Recomendado (Opção B - Lucro em Reais)
                        const suggested = getSuggestedPricesForHits(p);
                        const recOriginalPrice = suggested.priceForSameProfit || originalPrice;
                        const recDiscount = getHitsDiscount(recOriginalPrice);
                        const recFinalPrice = recOriginalPrice - recDiscount;
                        const recCfiCost = recFinalPrice * (cfiPercent / 100);
                        const recIfoodFeesCost = recFinalPrice * (feesPct / 100) + ifoodDel + ifoodCoupon;
                        const recTotalDeductions = recIfoodFeesCost + recCfiCost;
                        const recLucroReais = recFinalPrice - cmvVal - recTotalDeductions;

                        totalInvestment += discount * qty;
                        totalProfitWithHits += lucroReais * qty;
                        totalProfitWithoutHits += lucroReaisWithoutHits * 60; // 60 pedidos sem hits
                        totalProfitWithRecommended += recLucroReais * qty;
                      });

                      const compensa = totalProfitWithHits > totalProfitWithoutHits;
                      const diffProfit = Math.abs(totalProfitWithHits - totalProfitWithoutHits);
                      const potentialGain = totalProfitWithRecommended - totalProfitWithHits;

                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-b border-gray-200/50 dark:border-gray-800 pb-3 text-xs">
                            <div className="bg-slate-100/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-gray-200/40 dark:border-gray-800/40">
                              <span className="text-[10px] text-gray-400 font-semibold uppercase font-sans block mb-0.5">Lucro Atual (Sem Hits)</span>
                              <span className="font-black text-sm font-mono text-gray-700 dark:text-gray-350">{formatMoney(totalProfitWithoutHits)}</span>
                              <span className="text-[9px] text-gray-400 block mt-0.5 font-sans">(~60 pedidos/mês)</span>
                            </div>
                            <div className="bg-slate-100/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-gray-200/40 dark:border-gray-800/40">
                              <span className="text-[10px] text-gray-400 font-semibold uppercase font-sans block mb-0.5">Investimento Mensal (Hits)</span>
                              <span className="font-black text-sm font-mono text-brand-red">{formatMoney(totalInvestment)}</span>
                              <span className="text-[9px] text-gray-400 block mt-0.5 font-sans">(Total Descontos)</span>
                            </div>
                            <div className="bg-red-50/20 dark:bg-red-950/5 p-2.5 rounded-xl border border-red-500/10">
                              <span className="text-[10px] text-gray-400 font-semibold uppercase font-sans block mb-0.5">Lucro c/ Hits (Preço Antigo)</span>
                              <span className={`font-black text-sm font-mono ${totalProfitWithHits < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{formatMoney(totalProfitWithHits)}</span>
                              <span className="text-[9px] text-gray-400 block mt-0.5 font-sans">(100 pedidos/mês)</span>
                            </div>
                            <div className="bg-emerald-500/5 dark:bg-emerald-950/15 p-2.5 rounded-xl border border-emerald-500/20">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase font-sans block mb-0.5">LUCRO ESTIMADO COM RECOMENDADO</span>
                              <span className="font-black text-sm font-mono text-emerald-500">{formatMoney(totalProfitWithRecommended)}</span>
                              <span className="text-[9px] text-emerald-600/85 dark:text-emerald-400/85 block mt-0.5 font-sans font-medium">(100 pedidos + Blindagem)</span>
                            </div>
                          </div>

                          <div className={`p-4 rounded-xl border text-xs font-bold leading-relaxed ${
                            totalProfitWithHits < 0 
                              ? 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-350'
                              : 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {totalProfitWithHits < 0 ? (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold uppercase text-[11px] block text-red-700 dark:text-red-400 mb-1">Evite o Prejuízo com o iFood Hits!</span>
                                  <p className="font-normal text-[11px] text-gray-600 dark:text-gray-350 leading-relaxed">
                                    No preço atual, o desconto do Hits vai gerar um prejuízo mensal estimado de <strong className="font-bold text-red-500">{formatMoney(totalProfitWithHits)}</strong>. 
                                    <span className="block mt-1 font-semibold text-gray-700 dark:text-white">
                                      👉 Evite o prejuízo! Cadastre o Preço Recomendado pelo sistema, garanta sua blindagem de caixa e fature até <strong className="font-bold text-emerald-500">{formatMoney(totalProfitWithRecommended)}</strong> líquidos neste mês (recupere <strong className="font-bold text-emerald-500">{formatMoney(potentialGain)}</strong> a mais no seu bolso!).
                                    </span>
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold uppercase text-[11px] block text-emerald-700 dark:text-emerald-400 mb-1">Blindagem Ativa e Lucro Garantido!</span>
                                  <p className="font-normal text-[11px] text-gray-600 dark:text-gray-350 leading-relaxed">
                                    Participar do iFood Hits já é viável, mas pode ficar ainda melhor. Se você aplicar as recomendações de recomposição, seu lucro mensal pode saltar de {formatMoney(totalProfitWithHits)} para até <strong className="font-bold text-emerald-500">{formatMoney(totalProfitWithRecommended)}</strong>!
                                    <span className="block mt-1 font-semibold text-gray-700 dark:text-white">
                                      👉 Cadastre o Preço Recomendado pelo sistema para blindar totalmente o seu caixa e faturar até <strong className="font-bold text-emerald-500">{formatMoney(potentialGain)}</strong> a mais neste mês!
                                    </span>
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      setXandeInput("Xande, analisa pra mim o custo-benefício de participar do iFood Hits com esses produtos selecionados.");
                      handleSendXandeConsultation("Xande, analisa pra mim o custo-benefício de participar do iFood Hits com esses produtos selecionados.");
                    }}
                    className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60 px-3 py-1.5 rounded-lg transition"
                  >
                     💡 Pedir Dica do Xande
                  </button>
                </div>
              </div>
            )}

            {/* --- TAB 5: CAMPANHA INTELIGENTE --- */}
            {activeSubTab === 'smart-campaign' && (
              <div className="space-y-6">
                {/* Informative Card */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-[#1e293b]/50 dark:to-[#0f172a]/50 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-brand-red animate-spin-slow" />
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight">O que é a Campanha Inteligente do iFood?</h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    É uma ferramenta promocional oficial do iFood que utiliza inteligência de dados em tempo real para otimizar e direcionar o investimento de marketing da sua loja para as promoções de maior conversão (como Clube iFood, cupons e destaque em listas no app).
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-450 font-semibold flex items-center gap-1.5 bg-gray-150/40 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800">
                    <span className="text-emerald-500">✔</span> O dinheiro investido só é descontado quando um pedido é efetivamente realizado pelo cliente através do app, nunca antes!
                  </p>
                </div>

                {/* Essential Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-850 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-black text-gray-450 uppercase block">Investimento & Custo</span>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Investimento mínimo: <strong className="text-gray-850 dark:text-white">R$ 100,00 por dia</strong>.</li>
                      <li>• Custo operacional: <strong className="text-gray-850 dark:text-white">Até R$ 5,00 por pedido</strong> gerado pela campanha.</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-850 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-black text-gray-450 uppercase block">Flexibilidade & Regras</span>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Não-acumulativa: Não se soma com cupons internos.</li>
                      <li>• Flexível: Pausa ou desativação a qualquer momento.</li>
                      <li>• Orçamento diário: O saldo não utilizado expira e não acumula para o dia seguinte.</li>
                    </ul>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                  <h4 className="font-extrabold text-xs text-gray-800 dark:text-white uppercase tracking-tight">Parâmetros de Simulação</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Investimento Diário Máximo</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">R$</span>
                        <input 
                          type="number" 
                          min="100"
                          value={smartCampaignDailyInvestment}
                          onChange={(e) => updateState(setSmartCampaignDailyInvestment, 'smart_mkt_spend', e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                          placeholder="Mínimo 100"
                        />
                      </div>
                      {parseFloat(smartCampaignDailyInvestment) < 100 && (
                        <span className="text-[10px] text-brand-red font-semibold mt-1 block">O iFood exige o mínimo de R$ 100,00/dia.</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Ticket Médio Estimado</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">R$</span>
                        <input 
                          type="number" 
                          value={smartCampaignTicket}
                          onChange={(e) => updateState(setSmartCampaignTicket, 'smart_ticket', e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Pedidos Atuais por Dia</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={smartCampaignDailyOrders}
                          onChange={(e) => updateState(setSmartCampaignDailyOrders, 'smart_daily_orders', e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculations Results */}
                {(() => {
                  const targetMargin = cfi?.profitMargin || 15;
                  const spend = parseFloat(smartCampaignDailyInvestment) || 100;
                  const ticket = parseFloat(smartCampaignTicket) || 55;
                  const dailyOrders = parseFloat(smartCampaignDailyOrders) || 15;

                  const promotedOrdersPerDay = spend / 5;
                  const monthlyCampaignCost = spend * 30;
                  
                  // 67% reference increase on daily volume
                  const additionalOrdersDaily = dailyOrders * 0.67;
                  const additionalOrdersMonthly = additionalOrdersDaily * 30;
                  const additionalRevenueMonthly = additionalOrdersMonthly * ticket;
                  const additionalProfitMonthly = additionalRevenueMonthly * (targetMargin / 100);

                  const isViable = additionalProfitMonthly > monthlyCampaignCost;
                  const diff = Math.abs(additionalProfitMonthly - monthlyCampaignCost);

                  return (
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
                        <h4 className="font-extrabold text-xs text-gray-850 dark:text-white uppercase tracking-tight">Resultados da Simulação</h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-sans block">Pedidos Promocionados / dia (Limite)</span>
                            <span className="font-bold text-gray-750 dark:text-gray-300">{promotedOrdersPerDay.toFixed(0)} pedidos</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-sans block">Pedidos Adicionais Estimados (+67%)</span>
                            <span className="font-bold text-emerald-600">{additionalOrdersDaily.toFixed(1)}/dia ({additionalOrdersMonthly.toFixed(0)}/mês)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-sans block">Custo Mensal Estimado</span>
                            <span className="font-bold text-brand-red">{formatMoney(monthlyCampaignCost)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-sans block">Lucro Adicional (Margem {targetMargin}%)</span>
                            <span className="font-black text-emerald-600">{formatMoney(additionalProfitMonthly)}</span>
                          </div>
                        </div>

                        {/* Viability Box */}
                        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                          isViable 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300'
                        }`}>
                          {isViable ? (
                            <div className="flex items-start gap-2.5">
                              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold uppercase block text-xs">Cenário Altamente Viável! 🚀</span>
                                <p className="font-medium text-[11px] text-gray-600 dark:text-gray-300 leading-normal mt-1">
                                  Xande analisa: Seus números mostram que a campanha vale muito a pena! O faturamento adicional mensal projetado é de **{formatMoney(additionalRevenueMonthly)}**, o que gera **{formatMoney(additionalProfitMonthly)}** de lucro líquido para a loja. Isso cobre totalmente o custo máximo do investimento e gera um ganho real de **{formatMoney(diff)}** no bolso!
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold uppercase block text-xs">Atenção: Risco Financeiro Detectado! ⚠️</span>
                                <p className="font-medium text-[11px] text-gray-600 dark:text-gray-300 leading-normal mt-1">
                                  Xande analisa: Sob as condições simuladas, o custo estimado da campanha (**{formatMoney(monthlyCampaignCost)}**) ultrapassa o lucro líquido adicional estimado (**{formatMoney(additionalProfitMonthly)}**), gerando um prejuízo potencial de **{formatMoney(diff)}** no mês. Para viabilizar esta campanha, você precisa aumentar seu Ticket Médio para pelo menos **{formatMoney(monthlyCampaignCost / (additionalOrdersMonthly * (targetMargin / 100)))}** por meio da inserção de acompanhamentos (batatas, molhos, bebidas em combo) ou reduzir seu orçamento diário (limite mínimo R$ 100).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Important Warning Alert Box (Yellow) */}
                      <div className="bg-amber-50 dark:bg-amber-950/10 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-900 dark:text-amber-350 text-[11px] leading-relaxed">
                        <strong className="block text-amber-700 dark:text-amber-400 text-xs font-bold uppercase mb-1">🚨 Alerta do Consultor: Limitações da Estimativa</strong>
                        <p>
                          A projeção de 67% de aumento no volume baseia-se em estudos do próprio iFood e representa o potencial de expansão máxima. Os resultados práticos de conversão e custos variam conforme a atratividade do seu cardápio, qualidade das fotos, precificação dos itens e a concorrência em sua região. Sugerimos monitorar a aba de Desempenho do Portal do Parceiro iFood diariamente.
                        </p>
                      </div>

                      {/* Accumulation Alert Box */}
                      <div className="bg-blue-50 dark:bg-blue-950/10 border-l-4 border-blue-500 p-4 rounded-r-xl text-blue-900 dark:text-blue-300 text-[11px] leading-relaxed">
                        <strong className="block text-blue-700 dark:text-blue-400 text-xs font-bold uppercase mb-1">ℹ️ Informação sobre Acúmulo de Benefícios</strong>
                        <p>
                          Você pode rodar a Campanha Inteligente junto com o programa <strong>iFood Hits</strong> sem problemas. No entanto, o algoritmo do iFood não acumula promoções internas do restaurante (por exemplo, se você já cadastrou um cupom manual ou desconto no prato que conflita com a otimização automática). Deixe que a inteligência artificial do iFood gerencie os gatilhos para otimizar suas vendas de forma inteligente.
                        </p>
                      </div>

                      {/* Call to action & Pedir Dica */}
                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          onClick={() => {
                            setXandeInput(`Xande, fiz a simulação da Campanha Inteligente. Meu investimento diário é de R$ ${spend.toFixed(0)}, ticket médio de R$ ${ticket.toFixed(2)} e tenho ${dailyOrders.toFixed(0)} pedidos por dia. Vale a pena participar?`);
                            handleSendXandeConsultation(`Xande, fiz a simulação da Campanha Inteligente. Meu investimento diário é de R$ ${spend.toFixed(0)}, ticket médio de R$ ${ticket.toFixed(2)} e tenho ${dailyOrders.toFixed(0)} pedidos por dia. Vale a pena participar?`);
                          }}
                          className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                        >
                           💡 Pedir Consultoria do Xande
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          {/* Dynamic Scenario table - visible for coupons tabs */}
          {activeSubTab === 'coupons' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-tight">Cenários de Faturamento Reais</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Saiba exatamente quanto sobra de margem líquida em pedidos com tamanhos variados usando o cupom de **{formatMoney(couponVal)}**.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <th className="py-2">Valor Total do Cesto</th>
                      <th className="py-2">Preço Pago (Final)</th>
                      <th className="py-2">Custo Insumos ({simulatedCmvPercent}%)</th>
                      <th className="py-2">Custo CFI ({totalCfiPercent.toFixed(0)}%)</th>
                      <th className="py-2 text-right">Sobrou Lucro Real</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-900 font-mono">
                    {couponScenarios.map((sc, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3 font-bold text-gray-900 dark:text-white">{formatMoney(sc.orderValue)}</td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">{formatMoney(sc.finalReceived)}</td>
                        <td className="py-3 text-amber-600 dark:text-amber-400">{formatMoney(sc.cmvCost)}</td>
                        <td className="py-3 text-blue-600 dark:text-blue-400">{formatMoney(sc.cfiCost)}</td>
                        <td className={`py-3 text-right font-black ${sc.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatMoney(sc.netProfit)} ({sc.profitMarginPct.toFixed(0)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Embedded conversational right side */}
        <div className="col-span-1 lg:col-span-5 bg-gradient-to-br from-[#1e293b] to-[#111827] text-white rounded-2xl shadow-sm border border-gray-800 p-5 flex flex-col h-[580px]">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-gray-900" />
                <div className="bg-brand-red h-8 w-8 rounded-full flex items-center justify-center text-xs font-black select-none tracking-tighter shadow-sm">
                  XANDE
                </div>
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-white">OPINIÃO DO XANDE</h4>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight flex items-center gap-1">
                  <span className="animate-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
                </p>
              </div>
            </div>
          </div>

          {/* Messages block */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-gray-800 mt-2">
            {xandeChatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2 p-3 rounded-xl max-w-[90%] leading-relaxed ${
                  msg.role === 'model' 
                    ? 'bg-slate-800/80 mr-auto text-gray-200 border border-slate-700/50' 
                    : 'bg-brand-red text-white ml-auto font-medium'
                }`}
              >
                <div>
                  {msg.role === 'model' && (
                    <span className="text-[10px] font-black uppercase text-brand-yellow block mb-1">Xande</span>
                  )}
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isXandeLoading && (
              <div className="bg-slate-800/80 mr-auto p-3 rounded-xl max-w-[90%] border border-slate-700/50 animate-pulse text-gray-400 flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-yellow rounded-full animate-bounce" />
                <div className="h-1.5 w-1.5 bg-brand-yellow rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 bg-brand-yellow rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] font-bold uppercase">Xande está analisando suas margens...</span>
              </div>
            )}
          </div>

          {/* Suggestions footer */}
          <div className="mt-2 border-t border-gray-800 pt-3 space-y-2">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider block">Escolha uma ajuda imediata:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeSubTab === 'coupons' && [
                "Como criar cupons sem ter prejuízo no delivery?",
                "O que é Cupom Inteligente subsidiado iFood?",
                "Qual valor mínimo de pedido usar para cupom de R$ 10?"
              ].map((sug, i) => (
                <button 
                  key={i}
                  type="button"
                  onClick={() => { setXandeInput(sug); handleSendXandeConsultation(sug); }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-[10px] font-bold transition hover:text-white"
                >
                  {sug}
                </button>
              ))}
              {activeSubTab === 'cashback' && [
                "Cashback de 10% é perigoso para hamburgueria?",
                "Qual a porcentagem ideal de cashback?",
                "Como o cashback se dilui se o cliente não voltar?"
              ].map((sug, i) => (
                <button 
                  key={i}
                  type="button"
                  onClick={() => { setXandeInput(sug); handleSendXandeConsultation(sug); }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-[10px] font-bold transition hover:text-white"
                >
                  {sug}
                </button>
              ))}
              {activeSubTab === 'loyalty' && [
                "Como criar brinde de fidelidade de baixo custo?",
                "O brinde ideal deve ser Hambúrguer ou Batata?",
                "Quantos pedidos devo exigir no fidelidade?"
              ].map((sug, i) => (
                <button 
                  key={i}
                  type="button"
                  onClick={() => { setXandeInput(sug); handleSendXandeConsultation(sug); }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-[10px] font-bold transition hover:text-white"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input field */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendXandeConsultation(); }}
              className="flex gap-2 mt-2 bg-slate-900 rounded-xl p-1.5 border border-slate-800"
            >
              <input 
                type="text"
                placeholder="Diga suas margens e pergunte ao Xande..."
                value={xandeInput}
                onChange={(e) => setXandeInput(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white px-2.5 outline-none placeholder-gray-500"
              />
              <button 
                type="submit"
                disabled={isXandeLoading}
                className="px-4 py-1.5 text-[10px] font-extrabold uppercase bg-brand-red hover:bg-red-700 transition rounded-lg text-white font-bold"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SmartSimulator;
