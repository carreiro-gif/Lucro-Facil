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
    cfi
  } = useApp();

  const totalCfiPercent = calculateTotalCfiPercent();

  // Navigation subtabs inside simulator
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'cashback' | 'loyalty'>('coupons');

  // --- 1. COUPON CALCULATOR VARIABLES ---
  const [couponCampaignType, setCouponCampaignType] = useState<'new_customers' | 'recurrents' | 'lost_customers'>('new_customers');
  const [simulatedTicket, setSimulatedTicket] = useState<string>('55');
  const [simulatedCouponValue, setSimulatedCouponValue] = useState<string>('10');
  const [simulatedCmvPercent, setSimulatedCmvPercent] = useState<string>('30');
  const [marketingSpend, setMarketingSpend] = useState<string>('300'); // Spending to launch campaign
  const [expectedConversions, setExpectedConversions] = useState<string>('50'); // How many orders fetched

  // Calculate default values based on actual historical data if available
  const calculatedAverageTicket = useMemo(() => {
    if (salesTransactions.length === 0) return 0;
    const totalRevenue = salesTransactions.reduce((acc, t) => acc + (t.pricePaidByCustomer * t.qty), 0);
    const totalOrders = salesTransactions.reduce((acc, t) => acc + t.qty, 0);
    return totalOrders > 0 ? totalRevenue / totalOrders : 0;
  }, [salesTransactions]);

  const defaultAverageCmvPercent = useMemo(() => {
    if (products.length === 0) return 30; // standard fallback
    let totalCmv = 0;
    let totalPrices = 0;
    let counted = 0;
    products.forEach(p => {
      const cmv = getProductCMV(p);
      const price = p.fixedPriceStore || 0;
      if (price > 0 && cmv > 0) {
        totalCmv += cmv;
        totalPrices += price;
        counted++;
      }
    });
    return counted > 0 ? (totalCmv / totalPrices) * 100 : 30;
  }, [products, getProductCMV]);

  // Set default button trigger
  const handleApplyAverages = () => {
    if (calculatedAverageTicket > 0) setSimulatedTicket(calculatedAverageTicket.toFixed(0));
    setSimulatedCmvPercent(defaultAverageCmvPercent.toFixed(0));
  };

  // --- 2. CASHBACK VARIABLES ---
  const [simulatedCashbackPercent, setSimulatedCashbackPercent] = useState<string>('5');
  const [recurrenceRate, setRecurrenceRate] = useState<string>('60'); // % of customers repeating order

  // --- 3. LOYALTY (FIDELIDADE) VARIABLES ---
  const [selectedProductIdForReward, setSelectedProductIdForReward] = useState<string>('');
  const [loyaltyRequiredOrders, setLoyaltyRequiredOrders] = useState<string>('10'); // Order goal

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
      const rawCfiCost = tOption * (totalCfiPercent / 100);
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
  }, [initialTicketVal, couponCmv, couponVal, totalCfiPercent]);

  // Minimum Safe Order Value for coupon:
  // We want netProfit > 0, so finalReceived - cmvCost - cfiCost > 0
  // (OrderValue - Coupon) - OrderValue * (Cmv% + Cfi%) > 0
  // OrderValue * (1 - Cmv% - Cfi%) > Coupon
  // OrderValue > Coupon / (1 - Cmv%/100 - Cfi%/100)
  const minimumOrderValueForCoupon = useMemo(() => {
    const multiplier = (1 - (couponCmv / 100) - (totalCfiPercent / 100));
    if (multiplier <= 0) return 9999; // impossible margin
    const minVal = couponVal / multiplier;
    return minVal;
  }, [couponVal, couponCmv, totalCfiPercent]);

  // Safe minimum order with minimum target profit margin (e.g. at least 15% profit margin target)
  const minimumOrderValueForTargetMargin = useMemo(() => {
    const targetMargin = cfi.profitMargin || 15;
    const multiplier = (1 - (couponCmv / 100) - (totalCfiPercent / 100) - (targetMargin / 100));
    if (multiplier <= 0) return minimumOrderValueForCoupon * 1.5;
    return couponVal / multiplier;
  }, [couponVal, couponCmv, totalCfiPercent, minimumOrderValueForCoupon, cfi.profitMargin]);

  // 2. Cashback math
  const cashbackPct = parseFloat(simulatedCashbackPercent) || 0;
  const repeatingPct = parseFloat(recurrenceRate) || 50;
  // Effective margin reduction due to cashback is cashbackPct% diluted by repeat rate
  const cashbackEffectiveCostPercent = (cashbackPct * (repeatingPct / 100));
  const cashbackMarginImpact = useMemo(() => {
    const targetMargin = cfi.profitMargin || 15;
    const remainingMargin = targetMargin - cashbackEffectiveCostPercent;
    const isCrisis = remainingMargin < 8; // Danger zone under 8% remaining profit margin
    return {
      effectiveDiscount: cashbackEffectiveCostPercent,
      remainingMargin,
      isCrisis
    };
  }, [cashbackEffectiveCostPercent, cfi.profitMargin]);

  // 3. Loyalty math
  const requiredOrdersCount = parseInt(loyaltyRequiredOrders) || 10;
  const rewardCmvVal = selectedRewardProductObj ? getProductCMV(selectedRewardProductObj) : (initialTicketVal * 0.3);
  const rewardFullPriceVal = selectedRewardProductObj?.fixedPriceStore || (initialTicketVal * 0.8);
  
  // Cost distributed per required order to reach reward
  // E.g. To win R$ 35 burger (CMV R$ 10,50) in 10 orders. Cost of prize is R$ 10,50.
  // Distributed ingredient cost per order = R$ 10,50 / 9 (the paying orders, as 10th is free)
  const loyaltyCostPerOrder = useMemo(() => {
    if (requiredOrdersCount <= 1) return rewardCmvVal;
    return rewardCmvVal / (requiredOrdersCount - 1);
  }, [rewardCmvVal, requiredOrdersCount]);

  // Equivalent discount rate on each order: Reward full price / (Orders * average ticket)
  const loyaltyEquivalentDiscountPercent = useMemo(() => {
    const denominator = requiredOrdersCount * initialTicketVal;
    if (denominator <= 0) return 0;
    return (rewardFullPriceVal / denominator) * 100;
  }, [rewardFullPriceVal, requiredOrdersCount, initialTicketVal]);

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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const scenarioContext = `
      Você é o Xande, consultor do Lucro Fácil, especialista e francamente direto com os números de hamburguerias.
      O usuário está analisando cenários e ferramentas de fidelização/desconto na aba ativa de "${activeSubTab.toUpperCase()}":
      
      DADOS GERAIS DO SISTEMA:
      - CMV Médio Escolhido: ${couponCmv.toFixed(1)}%
      - CFI % da Empresa: ${totalCfiPercent.toFixed(1)}%
      - Margem Sugerida Alvo: ${cfi.profitMargin.toFixed(1)}%
      
      PARÂMETROS SIMULADOS ATUALMENTE:
      1. Aba Cupons de Desconto:
         - Tipo de Campanha: ${couponCampaignType}
         - Ticket Médio Base: R$ ${initialTicketVal.toFixed(2)}
         - Valor do Cupom: R$ ${couponVal.toFixed(2)}
         - Custo de Aquisição de Cliente (Overhead CAC): R$ ${overheadCACPerCustomer.toFixed(2)} por pedido
         - CAC Total Projetado: R$ ${totalCACPerAcquired.toFixed(2)}
         - Ponto de Equilíbrio do Cupom (Pedido Mínimo Sugerido p/ Empate): R$ ${minimumOrderValueForCoupon.toFixed(2)}
         - Pedido Mínimo Seguro p/ Lucro: R$ ${minimumOrderValueForTargetMargin.toFixed(2)}
         
      2. Aba Cashback:
         - Cashback % Oferecido: ${cashbackPct}%
         - Taxa de Retorno do Cliente: ${repeatingPct}%
         - Custo Efetivo do Cashback (Margem Sacrificada): ${cashbackMarginImpact.effectiveDiscount.toFixed(2)}%
         - Margem Líquida Restante após Cashback: ${cashbackMarginImpact.remainingMargin.toFixed(2)}% (Zona Crítica: ${cashbackMarginImpact.isCrisis ? 'SIM' : 'NÃO'})
         
      3. Aba Fidelidade:
         - Produto Prêmio Escolhido: ${selectedRewardProductObj ? selectedRewardProductObj.name : 'Hamburguer Padrão (Estimativa)'}
         - Preço Normal do Prêmio: R$ ${rewardFullPriceVal.toFixed(2)}
         - CMV Real do Insumo do Prêmio: R$ ${rewardCmvVal.toFixed(2)}
         - Metas de Pedidos p/ Ganhar o prêmio: ${requiredOrdersCount} pedidos.
         - Custo Real de Insumos adicionado por pedido: R$ ${loyaltyCostPerOrder.toFixed(2)}
         - Equivalente a Cupom Médio / Desconto real: ${loyaltyEquivalentDiscountPercent.toFixed(1)}% de perca por pedido.
         
      Instruções do Xande:
      - Responda em no máximo 3-4 parágrafos curtos.
      - Use os dados simulados do usuário para opinar se a campanha está correta ou se vai arrombar o caixa da hamburgueria.
      - Se a margem restante ou o valor de pedido mínimo der prejuízo, chame a atenção de forma franca, mas dê um conselho viável (Como aumentar o ticket exigindo combo de batata + refri ou aumentar a quantidade de pedidos no fidelidade).
      - Mantenha a metodologia CFI do Lucro Fácil (Diga para não sacrificar o lucro da casa).
      - Use emojis adequados e linguagem brasileira e prática.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [...xandeChatMessages, userMsg].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: scenarioContext,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "Sem reposta. Tente novamente.";
      addXandeBotMessage(responseText);

    } catch (error) {
      console.error(error);
      // Fallback response builder based on rule engine
      setTimeout(() => {
        if (activeSubTab === 'coupons') {
          addXandeBotMessage(`Cara, com um cupom de **R$ ${couponVal.toFixed(2)}** e insumos pesando **${couponCmv.toFixed(0)}%**, se o cliente comprar só o mínimo o seu lucro escorre pelo ralo! Para sustentar esse cupom, recomendo colocar o **Valor Mínimo do Pedido em pelo menos R$ ${minimumOrderValueForTargetMargin.toFixed(0)}** de forma que o combo garanta o seu CFI e a sua meta de lucro!`);
        } else if (activeSubTab === 'cashback') {
          addXandeBotMessage(`Fere a régua da casa dar muito cashback! Um cashback de **${cashbackPct}%** com **${repeatingPct}%** de retorno te custa de verdade **${cashbackEffectiveCostPercent.toFixed(1)}%** da sua receita. Tente limitar o cashback a no máximo **R$ 5,00** por resgate ou ajuste a porcentagem para no máximo **3%** se sua margem tiver apertada.`);
        } else {
          addXandeBotMessage(`Dica de ouro no Fidelidade: Se o cliente precisa de **${requiredOrdersCount} pedidos** para ganhar um prêmio de **R$ ${rewardFullPriceVal.toFixed(0)}**, isso equivale a conceder **${loyaltyEquivalentDiscountPercent.toFixed(1)}% de desconto** em cada pedido! É muito mais inteligente dar de prêmio um item com margem enorme (um Produto Turbinado como Batatas ou Milkshake canelado) do que o seu hambúrguer mais caro!`);
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Ticket Médio Projetado</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">R$</span>
                      <input 
                        type="number" 
                        value={simulatedTicket}
                        onChange={(e) => setSimulatedTicket(e.target.value)}
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
                        onChange={(e) => setSimulatedCouponValue(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">CMV de Insumos Médio (%)</label>
                    <div className="relative">
                      <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">%</span>
                      <input 
                        type="number" 
                        value={simulatedCmvPercent}
                        onChange={(e) => setSimulatedCmvPercent(e.target.value)}
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
                        <span className="absolute left-2 text-2.5 top-2.5 text-gray-400 text-xs font-mono font-bold">R$</span>
                        <input 
                          type="number" 
                          value={marketingSpend}
                          onChange={(e) => setMarketingSpend(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Qtd Pedidos Esperada</label>
                      <input 
                        type="number" 
                        value={expectedConversions}
                        onChange={(e) => setExpectedConversions(e.target.value)}
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
                      <h4 className="font-black text-xs text-red-800 dark:text-red-300 uppercase">Análise de Segurança do Cupom</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Para o cupom de **R$ {couponVal.toFixed(2)}** não causar prejuízo de insumo + despesa (CFI), o cliente tem que gastar pelo menos **R$ {minimumOrderValueForCoupon.toFixed(2)}**.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-red-200/40 dark:border-red-900/25">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Valor Mínimo p/ Não Ter Prejuízo (CFI)</span>
                      <div className="text-lg font-black text-orange-600 dark:text-orange-400 font-mono">
                        {formatMoney(minimumOrderValueForCoupon)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Min. Pedido p/ Garantir Margem Alvo ({cfi.profitMargin}%)</span>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatMoney(minimumOrderValueForTargetMargin)}
                      </div>
                    </div>
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
                    Defina o cashback em porcentagem e estime a taxa de retorno dos clientes recorrentes. Seus clientes gastam mais no segundo pedido para resgatar.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Cashback Oferecido (%)</label>
                    <div className="relative">
                      <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">%</span>
                      <input 
                        type="number" 
                        value={simulatedCashbackPercent}
                        onChange={(e) => setSimulatedCashbackPercent(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pr-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Taxa Estimada de Retorno (%)</label>
                    <div className="relative">
                      <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs font-bold font-mono">%</span>
                      <input 
                        type="number" 
                        value={recurrenceRate}
                        onChange={(e) => setRecurrenceRate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white rounded-lg pr-8 p-2 text-xs outline-none focus:border-brand-red font-mono"
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
                        Como apenas **{repeatingPct}%** dos clientes gastam o saldo acumulado no próximo pedido, o cashback de **{cashbackPct}%** custará na verdade apenas **{cashbackMarginImpact.effectiveDiscount.toFixed(1)}%** do faturamento integral.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200/20">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Custo Médio Real de Cashback</span>
                      <div className="text-base font-black font-mono">
                        {cashbackMarginImpact.effectiveDiscount.toFixed(2)}% da Receita
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Margem de Lucro Após Cashback</span>
                      <div className={`text-base font-black font-mono ${cashbackMarginImpact.isCrisis ? 'text-red-600' : 'text-emerald-600'}`}>
                        {cashbackMarginImpact.remainingMargin.toFixed(1)}% {cashbackMarginImpact.isCrisis ? '⏳ APERTADO' : '🔥 SAUDÁVEL'}
                      </div>
                    </div>
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Selecione o Item Recompensa</label>
                    <select 
                      value={selectedProductIdForReward}
                      onChange={(e) => setSelectedProductIdForReward(e.target.value)}
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
                      onChange={(e) => setLoyaltyRequiredOrders(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red font-mono"
                    />
                  </div>
                </div>

                {/* Loyalty safety cards */}
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-gray-200 dark:border-gray-900 space-y-4">
                  <div className="flex gap-2">
                    <Award className="h-5 w-5 text-brand-yellow shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-xs text-slate-700 dark:text-white uppercase leading-none">Matemática do Prêmio Diluído</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                        Se o cliente faz **{requiredOrdersCount} pedidos** e o **{requiredOrdersCount}º é grátis** (um item de valor de venda R$ {rewardFullPriceVal.toFixed(2)} e custo CMV R$ {rewardCmvVal.toFixed(2)}), você tem os seguintes pesos:
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
                      <span className="text-[9px] text-gray-400 uppercase block">CMV do Brinde</span>
                      <div className="text-sm font-black font-mono text-gray-700 dark:text-white">
                        {formatMoney(rewardCmvVal)} ({selectedRewardProductObj ? 'FT' : 'Est.'})
                      </div>
                    </div>
                  </div>
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
