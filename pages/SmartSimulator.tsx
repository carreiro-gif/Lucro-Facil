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
  ShoppingBag
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { formatMoney, formatPercent } from '../constants';
import { Product } from '../types';

const SmartSimulator: React.FC = () => {
  const { 
    products, 
    getProductCMV, 
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
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'cashback' | 'loyalty'>('coupons');

  // Load saved state
  const loadSavedState = (key: string, defaultVal: string) => {
    const saved = localStorage.getItem(`lucro_facil_simulator_${key}`);
    return saved || defaultVal;
  };

  const saveState = (key: string, val: string) => {
    localStorage.setItem(`lucro_facil_simulator_${key}`, val);
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

  // Set default button trigger
  const handleApplyAverages = () => {
    if (calculatedAverageTicket > 0) {
      setSimulatedTicket(calculatedAverageTicket.toFixed(2));
      saveState('ticket', calculatedAverageTicket.toFixed(2));
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

    try {
      const scenarioContext = `
      Você é o Xande, consultor do Lucro Fácil, especialista e francamente direto com os números de hamburguerias.
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
         
      Instruções do Xande:
      - Responda em no máximo 3-4 parágrafos curtos.
      - Use os dados simulados do usuário para opinar se a campanha está correta ou dar conselhos diretos.
      - Mantenha a metodologia CFI do Lucro Fácil (Nunca fira a margem da loja).
      - Linguagem franca, brasileira e objetiva. Use poucos emojis.
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
        } else {
          addXandeBotMessage(`Dica de ouro no Fidelidade: Se a taxa de resgate for de **${completionRate}%**, você tem ${loyaltyEquivalentDiscountPercent.toFixed(1)}% de desconto equivalente em cada pedido! É muito mais inteligente dar de prêmio um item turbinado (Batatas Fritas ou Bebidas) para não quebrar a banca!`);
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
            <div className="flex border-b border-gray-200 dark:border-gray-800 pb-2 gap-2">
              <button 
                onClick={() => setActiveSubTab('coupons')}
                className={`pb-2 px-4 text-xs font-black transition tracking-wider uppercase flex items-center gap-1.5 ${
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
                className={`pb-2 px-4 text-xs font-black transition tracking-wider uppercase flex items-center gap-1.5 ${
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
                className={`pb-2 px-4 text-xs font-black transition tracking-wider uppercase flex items-center gap-1.5 ${
                  activeSubTab === 'loyalty' 
                    ? 'border-b-2 border-brand-red text-brand-red' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                }`}
              >
                <Gift className="h-4 w-4" />
                Cartão Fidelidade
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
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (CMV: R$ {getProductCMV(p).toFixed(2)})</option>
                      ))}
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
