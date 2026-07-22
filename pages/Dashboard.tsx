import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { DollarSign, Target, Dna, UtensilsCrossed, Settings, Receipt, Beef, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, ChevronRight, Zap } from 'lucide-react';
import { formatPercent } from '../constants';
import { TrialBlindagemWidget } from '../components/TrialBlindagemWidget';

const formatMoney = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Dashboard: React.FC = () => {
  const { 
    monthlyRevenue, 
    expenses, 
    cfi, 
    products, 
    getProductCMV, 
    ingredients, 
    calculateTotalCfiPercent,
    storeInfo,
    getCmvAvgPercent,
    calculateBreakEven,
    salesTransactions
  } = useApp();
  
  const storeId = storeInfo?.id || '1';
  const localStorageKey = `lucro_facil_dashboard_monthly_goal_v1_${storeId}`;

  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(() => {
    const saved = localStorage.getItem(localStorageKey);
    return saved ? Number(saved) : null;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(monthlyGoal !== null ? monthlyGoal.toString() : '');

  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    const loadedGoal = saved ? Number(saved) : null;
    setMonthlyGoal(loadedGoal);
    setTempGoal(loadedGoal !== null ? loadedGoal.toString() : '');
  }, [storeId, localStorageKey]);

  const handleSaveGoal = () => {
    if (tempGoal.trim() === '') {
      setMonthlyGoal(null);
      localStorage.removeItem(localStorageKey);
      setIsEditingGoal(false);
      return;
    }
    const val = Number(tempGoal);
    if (!isNaN(val) && val >= 0) {
      if (val === 0) {
        setMonthlyGoal(null);
        localStorage.removeItem(localStorageKey);
      } else {
        setMonthlyGoal(val);
        localStorage.setItem(localStorageKey, val.toString());
      }
    }
    setIsEditingGoal(false);
  };

  // 1. Basic monthly revenue data
  const activeRevenueMonths = useMemo(() => monthlyRevenue.filter(m => m.revenue > 0), [monthlyRevenue]);
  const latestMonthKey = activeRevenueMonths.length > 0 
    ? activeRevenueMonths[activeRevenueMonths.length - 1].month 
    : new Date().toISOString().slice(0, 7);

  const monthRevenue = monthlyRevenue.find(r => r.month === latestMonthKey)?.revenue || 0;
  
  // Previous month logic for trend
  const prevMonthRevenue = activeRevenueMonths.length > 1 
    ? activeRevenueMonths[activeRevenueMonths.length - 2].revenue 
    : 0;
  const revenueTrend = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;
  
  // Avg 3 months for alert
  const last3Months = activeRevenueMonths.slice(-3);
  const avg3Months = last3Months.length > 0 ? last3Months.reduce((a, b) => a + b.revenue, 0) / last3Months.length : 0;
  const isRevenueDroppingSignificantly = monthRevenue > 0 && avg3Months > 0 && monthRevenue < avg3Months * 0.85;

  // 2. Costs & Profit Math
  const monthFixedCosts = expenses.filter(e => e.month === latestMonthKey || !e.month).reduce((s, e) => s + e.value, 0);

  const avgCmvPercentResult = useMemo(() => {
    let totalPct = 0;
    let count = 0;

    let burgerPct = 0;
    let burgerCount = 0;

    let drinksSidesPct = 0;
    let drinksSidesCount = 0;
    
    products.forEach(p => {
      const cost = getProductCMV(p);
      const price = p.fixedPriceStore || 0;
      if (p.ingredients && p.ingredients.length > 0 && cost > 0 && price > 0) {
        const pct = (cost / price) * 100;
        totalPct += pct;
        count++;

        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        
        const isBurger = cat.includes('hamb') || cat.includes('burger') || cat.includes('lanche') || name.includes('burger') || name.includes('hamb');
        const isDrinkOrSide = cat.includes('bebida') || cat.includes('acompanhamento') || cat.includes('porç') || cat.includes('beb') || cat.includes('refri') || name.includes('coca') || name.includes('guaran') || name.includes('frita') || name.includes('porç') || name.includes('suco');

        if (isBurger) {
          burgerPct += pct;
          burgerCount++;
        }
        if (isDrinkOrSide) {
          drinksSidesPct += pct;
          drinksSidesCount++;
        }
      }
    });

    const highCmvProducts = products
      .filter(p => {
        const cost = getProductCMV(p);
        const price = p.fixedPriceStore || 0;
        return p.ingredients && p.ingredients.length > 0 && cost > 0 && price > 0;
      })
      .map(p => ({
        name: p.name,
        cmv: ((getProductCMV(p) / (p.fixedPriceStore || 1)) * 100)
      }))
      .filter(p => p.cmv > 35)
      .sort((a, b) => b.cmv - a.cmv)
      .slice(0, 5);

    if (count > 0) {
      return {
        value: totalPct / count,
        hasData: true,
        burgerValue: burgerCount > 0 ? burgerPct / burgerCount : null,
        drinksSidesValue: drinksSidesCount > 0 ? drinksSidesPct / drinksSidesCount : null,
        highCmvProducts
      };
    }
    return {
      value: 0,
      hasData: false,
      burgerValue: null,
      drinksSidesValue: null,
      highCmvProducts: []
    };
  }, [products, getProductCMV]);

  const avgCmvPercent = avgCmvPercentResult.hasData ? avgCmvPercentResult.value : 35;

  const totalCmvValue = monthRevenue * (avgCmvPercent / 100);
  const realProfit = monthRevenue - totalCmvValue - monthFixedCosts;
  const profitMargin = monthRevenue > 0 ? (realProfit / monthRevenue) * 100 : 0;

  // 3. Break Even 
  const totalCfiPercent = calculateTotalCfiPercent();
  const breakEvenR$ = calculateBreakEven(latestMonthKey);
  const gapToBe = Math.max(0, breakEvenR$ - monthRevenue);

  // 4. Ticket Médio
  const orderCount = useMemo(() => {
     let o = 0;
     try {
       const ordersMap = JSON.parse(localStorage.getItem('lucro_facil_be_monthly_orders_v1') || '{}');
       if (ordersMap[latestMonthKey]) o = Number(ordersMap[latestMonthKey]);
     } catch(e) {}
     return o;
  }, [latestMonthKey]);
  // If orderCount is 0, we can fallback to monthRevenue / 35 something, but estimatedTicket is standard:
  const estimatedTicket = orderCount > 0 ? monthRevenue / orderCount : 0;

  // Navigation Helper (Dispatch event for App.tsx)
  const navigateTo = (tab: string) => {
    window.dispatchEvent(new CustomEvent('change-tab', { detail: tab }));
  };

  const overdueExpensesCount = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return expenses.filter(e => {
      if (e.paid || !e.dueDate) return false;
      const due = new Date(e.dueDate + 'T00:00:00');
      return due.getTime() < today.getTime();
    }).length;
  }, [expenses]);

  const navigateToOverdueExpenses = () => {
    if (overdueExpensesCount > 0) {
      localStorage.setItem('show_overdue_expenses_modal', 'true');
    }
    navigateTo('expenses');
  };

  // Goal Progress
  const [currentDateObj] = useState(new Date());
  const maxDays = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth() + 1, 0).getDate();
  const currentDay = currentDateObj.getDate();
  const daysLeft = maxDays - currentDay;
  const goalProgress = monthlyGoal && monthlyGoal > 0 ? Math.min(100, (monthRevenue / monthlyGoal) * 100) : 0;
  const dailyNeeded = monthlyGoal && monthlyGoal > 0 && daysLeft > 0 ? Math.max(0, monthlyGoal - monthRevenue) / daysLeft : 0;

  // Operacional
  const productsWithFicha = products.filter(p => getProductCMV(p) > 0).length;
  const missingFicha = products.length - productsWithFicha;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-20">
      {/* 14-Day Gamified Discovery Experience Widget for Trial Users */}
      <TrialBlindagemWidget onNavigateTab={navigateTo} />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase mb-1">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400">Radiografia completa da saúde financeira da sua loja.</p>
        </div>
      </div>

      {/* Xande Alerts Panel */}
      <div className="flex flex-col gap-3">
         {overdueExpensesCount > 0 && (
            <div 
              className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in zoom-in-95 cursor-pointer hover:bg-red-100/10 dark:hover:bg-red-950/50 transition" 
              onClick={navigateToOverdueExpenses}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
                  <AlertTriangle size={20} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300 text-sm flex items-center gap-2">
                    Despesas Vencidas em Aberto
                    <span className="text-[10px] bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 px-2.5 py-0.5 rounded-full font-bold">Urgente</span>
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400/80">Você possui <strong>{overdueExpensesCount}</strong> {overdueExpensesCount === 1 ? 'despesa vencida' : 'despesas vencidas'} que ainda não foram pagas. Clique para regularizar e evitar juros!</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md shrink-0">
                Ver Contas Vencidas <ChevronRight size={14}/>
              </button>
            </div>
         )}

         {avgCmvPercent > 35 && (
           <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in zoom-in-95">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400">
                 <AlertTriangle size={20} />
               </div>
               <div>
                 <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Alerta de CMV Alto</h4>
                 <p className="text-xs text-amber-700 dark:text-amber-400/80">Seu CMV médio das fichas técnicas está alto ({avgCmvPercent.toFixed(1)}%). Recomendamos revisar suas fichas técnicas ou negociar com fornecedores.</p>
               </div>
             </div>
             <button onClick={() => navigateTo('products')} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2">
               Revisar Fichas <ChevronRight size={14}/>
             </button>
           </div>
         )}
         
         {isRevenueDroppingSignificantly && (
           <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in zoom-in-95">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 dark:text-orange-400">
                 <TrendingDown size={20} />
               </div>
               <div>
                 <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm">Queda Significativa no Faturamento</h4>
                 <p className="text-xs text-orange-700 dark:text-orange-400/80">Seu faturamento caiu {Math.abs(((monthRevenue - avg3Months) / avg3Months) * 100).toFixed(0)}% em relação à média dos últimos 3 meses.</p>
               </div>
             </div>
             <button onClick={() => navigateTo('smart-offers')} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2">
               Criar Oferta Bomba <Zap size={14}/>
             </button>
           </div>
         )}

         {gapToBe > 0 && monthRevenue > 0 && (
           <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in zoom-in-95">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
                 <Target size={20} />
               </div>
               <div>
                 <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">Atenção ao Ponto de Equilíbrio</h4>
                 <p className="text-xs text-red-700 dark:text-red-400/80">Ainda faltam {formatMoney(gapToBe)} para você conseguir pagar todas as despesas deste mês.</p>
               </div>
             </div>
             <button onClick={() => navigateTo('sales-import')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2">
               Lançar Vendas <ChevronRight size={14}/>
             </button>
           </div>
         )}

         {avgCmvPercent <= 35 && !isRevenueDroppingSignificantly && gapToBe === 0 && monthRevenue > 0 && (
           <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-in zoom-in-95">
             <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-600 dark:text-emerald-400">
               <CheckCircle size={20} />
             </div>
             <div>
               <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Excelente Desempenho! 🚀</h4>
               <p className="text-xs text-emerald-700 dark:text-emerald-400/80">Sua loja já superou o ponto de equilíbrio, o CMV está saudável e o faturamento estável. Parabéns!</p>
             </div>
           </div>
         )}
      </div>

      {/* Row 1 Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Faturamento do Mês Atual */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-105 duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-gray-700">
                <DollarSign size={24} />
              </div>
              {revenueTrend !== 0 && (
                 <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 ${revenueTrend > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                   {revenueTrend > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                   {Math.abs(revenueTrend).toFixed(1)}%
                 </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1 relative z-10">Faturamento ({latestMonthKey})</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white relative z-10">{formatMoney(monthRevenue)}</h3>
        </div>

        {/* Lucro Líquido Real */}
        <div className={`p-6 rounded-2xl border bg-white dark:bg-gray-900 ${realProfit >= 0 ? 'border-emerald-400 dark:border-emerald-500/50' : 'border-red-400 dark:border-red-500/50'} shadow-sm transition-transform hover:scale-105 duration-300 relative`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl border ${realProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'} shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]`}>
                <TrendingUp size={24} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${realProfit >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                   {profitMargin.toFixed(1)}% Margem
               </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">Lucro Líquido Real (Mês)</p>
            <h3 className={`text-3xl font-black ${realProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatMoney(realProfit)}</h3>
        </div>

        {/* CMV Médio Atual */}
        <div className={`p-6 rounded-2xl border bg-white dark:bg-gray-900 shadow-sm transition-transform hover:scale-105 duration-300 ${
            !avgCmvPercentResult.hasData ? 'border-gray-200 dark:border-gray-800' :
            avgCmvPercent <= 35 ? 'border-emerald-400 dark:border-emerald-500/50' : 
            avgCmvPercent <= 38 ? 'border-amber-400 dark:border-amber-500/50' : 'border-red-400 dark:border-red-500/50'
        }`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl border shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] ${
                !avgCmvPercentResult.hasData ? 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700' :
                avgCmvPercent <= 35 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 
                avgCmvPercent <= 38 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 
                                     'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
              }`}>
                <UtensilsCrossed size={24} />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">CMV Médio (Fichas Técnicas)</p>
            {avgCmvPercentResult.hasData ? (
              <>
                {/* Categorized CMV */}
                <div className="flex flex-col gap-2 mt-2">
                  {avgCmvPercentResult.burgerValue !== null ? (
                    <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                      <span className="text-gray-500 dark:text-gray-400 font-bold">🍔 Hambúrgueres:</span>
                      <span className={`font-black text-xl ${avgCmvPercentResult.burgerValue <= 35 ? 'text-emerald-600 dark:text-emerald-400' : avgCmvPercentResult.burgerValue <= 38 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {avgCmvPercentResult.burgerValue.toFixed(1)}%
                      </span>
                    </div>
                  ) : null}
                  {avgCmvPercentResult.drinksSidesValue !== null ? (
                    <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                      <span className="text-gray-500 dark:text-gray-400 font-bold">🥤 Bebidas/Acomp:</span>
                      <span className={`font-black text-xl ${avgCmvPercentResult.drinksSidesValue <= 35 ? 'text-emerald-600 dark:text-emerald-400' : avgCmvPercentResult.drinksSidesValue <= 38 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {avgCmvPercentResult.drinksSidesValue.toFixed(1)}%
                      </span>
                    </div>
                  ) : null}
                </div>

                <p className="text-[10px] uppercase font-bold mt-2 text-gray-400 dark:text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-800">
                    {avgCmvPercent < 35 ? 'Nível Muito Saudável' : avgCmvPercent <= 38 ? 'Em Alerta de Risco' : 'NÍVEL DE PERIGO / PREJUÍZO'}
                </p>

                {avgCmvPercentResult.highCmvProducts.length > 0 && (
                  <details className="mt-2 group">
                    <summary className="text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer uppercase py-1 list-none flex items-center justify-between">
                      <span>Top 5 Maiores CMV</span>
                      <span className="transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {avgCmvPercentResult.highCmvProducts.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-red-50 dark:bg-red-900/10 p-1.5 rounded">
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]" title={p.name}>{p.name}</span>
                          <span className="font-bold text-red-600 dark:text-red-400">{p.cmv.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-2 leading-tight">
                Cadastre preços na tela de Preço de Venda para ver seu CMV médio
              </p>
            )}
        </div>
      </div>

      {/* Row 2 Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ponto de Equilíbrio */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-gray-700">
                <Target size={24} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${gapToBe > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                {gapToBe > 0 ? 'Falta Faturar' : 'Meta Batida'}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">Ponto de Equilíbrio</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">R$ {breakEvenR$.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
        </div>

        {/* CFI da Empresa */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-gray-700">
                <Dna size={24} />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">CFI da Empresa</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{formatPercent(totalCfiPercent)}</h3>
        </div>

        {/* Ticket Médio Estimado */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-gray-700">
                <Receipt size={24} />
              </div>
              {orderCount === 0 && (
                <button onClick={() => navigateTo('break-even')} className="text-[9px] font-black px-2 py-1 rounded-full uppercase bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 hover:underline">
                  Cadastrar Pedidos
                </button>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">Ticket Médio Estimado</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{orderCount > 0 ? formatMoney(estimatedTicket) : '--'}</h3>
            {orderCount > 0 && <p className="text-[10px] uppercase font-bold mt-1 text-gray-400 dark:text-gray-500">Base: {orderCount} pedidos</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm">Faturamento Mensal</h3>
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-[10px] text-gray-500 uppercase font-bold">Acima Equilíbrio</span></div>
               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span className="text-[10px] text-gray-500 uppercase font-bold">Mês Atual</span></div>
               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-[10px] text-gray-500 uppercase font-bold">Abaixo Equilíbrio</span></div>
             </div>
           </div>
           
           <div className="h-80 flex-1" style={{ minHeight: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" vertical={false} opacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF" 
                    tick={{fontSize: 12, fontWeight: 700}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => val.split('-')[1]}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tick={{fontSize: 12, fontWeight: 700}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `R$${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px', color: '#F3F4F6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#F3F4F6' }}
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                             const data = payload[0].payload;
                             const isProfit = data.revenue >= breakEvenR$;
                             const estProfitRaw = data.revenue - (data.revenue * (avgCmvPercent/100)) - monthFixedCosts;
                             return (
                                 <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-xl min-w-[200px]">
                                     <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-widest">{data.month}</p>
                                     <p className="text-2xl font-black text-white">{formatMoney(data.revenue)}</p>
                                     <div className={`mt-3 text-[10px] font-black uppercase px-2 py-1 rounded w-fit inline-block ${isProfit ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                         {isProfit ? 'Bateu Ponto Equilíbrio' : 'Abaixo do Equilíbrio'}
                                     </div>
                                     <div className="mt-3 block border-t border-gray-800 pt-3">
                                         <p className="text-[10px] text-gray-400 uppercase font-bold">Lucro Líquido Real (Mês)</p>
                                         <p className={`text-sm font-black ${estProfitRaw >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatMoney(estProfitRaw)}</p>
                                     </div>
                                 </div>
                             )
                        }
                        return null;
                    }}
                  />
                  <ReferenceLine y={breakEvenR$} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Ponto Equilíbrio', fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {monthlyRevenue.map((entry, index) => {
                      let color = entry.revenue >= breakEvenR$ ? '#10B981' : '#EF4444'; // Green or Red
                      if (entry.month === latestMonthKey) color = '#FBBF24'; // Golden Yellow for latest month
                      if (entry.revenue === 0) color = '#9CA3AF'; // Empty
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-6">
                   <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm">Meta de Faturamento (Mensal)</h3>
                   <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="text-gray-400 hover:text-brand-red p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                       <Settings size={16} />
                   </button>
                </div>

                {isEditingGoal ? (
                    <div className="flex items-center gap-2 mb-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                        <span className="text-gray-500 font-bold text-sm">R$</span>
                        <input 
                            type="number"
                            value={tempGoal}
                            onChange={(e) => setTempGoal(e.target.value)}
                            className="w-full bg-transparent p-1 rounded font-bold text-gray-900 dark:text-white outline-none"
                            placeholder="Digite a meta"
                        />
                        <button onClick={handleSaveGoal} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-red-700 transition shadow-sm">OK</button>
                    </div>
                ) : (
                    <div className="mb-8">
                       <div className="flex justify-between items-end mb-2">
                           <span className="text-xs text-brand-red font-black uppercase tracking-widest">Realizado</span>
                           <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest">Meta</span>
                       </div>
                       <div className="flex justify-between items-baseline mb-4">
                           <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">{formatMoney(monthRevenue)}</span>
                           <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                             {monthlyGoal !== null ? formatMoney(monthlyGoal) : 'Não definida'}
                           </span>
                       </div>
                       {monthlyGoal !== null ? (
                         <>
                           <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
                               <div className="bg-brand-red h-full rounded-full transition-all duration-1000 relative" style={{ width: `${goalProgress}%` }}>
                                   <div className="absolute inset-0 bg-white/20 w-full h-full" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
                               </div>
                           </div>
                           <p className="text-[11px] font-black text-right text-brand-red uppercase">{goalProgress.toFixed(1)}% atingido</p>
                         </>
                       ) : (
                         <div className="bg-slate-50 dark:bg-slate-800/10 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                           <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed font-sans">
                             Defina sua meta de faturamento mensal clicando no ícone de configurações acima para acompanhar o ritmo das suas vendas!
                           </p>
                         </div>
                       )}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-slate-800/40 p-5 rounded-xl border border-blue-100 dark:border-slate-700 shadow-sm mt-4">
               <div className="flex items-center gap-2 mb-4">
                 <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Target size={16} />
                 </div>
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-800 dark:text-blue-300">Ritmo da Operação</h4>
               </div>
               
               <div className="flex justify-between items-center mb-3 border-b border-blue-200/50 dark:border-slate-600/50 pb-3">
                   <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Dias Restantes no Mês</span>
                   <span className="text-xs font-black text-blue-900 dark:text-blue-100 bg-white dark:bg-slate-900/50 px-2 py-0.5 rounded">{daysLeft} dias</span>
               </div>
               <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-blue-900 dark:text-blue-200 leading-tight pr-4">Faturamento Diário Necessário<br/><span className="font-normal text-[10px] opacity-80">(Para bater a meta)</span></span>
                   <span className="text-sm font-black text-brand-red bg-white dark:bg-slate-900/50 px-2 py-1 rounded shadow-sm">
                     {monthlyGoal !== null ? `${formatMoney(dailyNeeded)}/dia` : '--'}
                   </span>
               </div>
            </div>
        </div>
      </div>

      {/* Operational Summary */}
      <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm mt-8 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Resumo Operacional</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl flex items-center gap-4 shadow-sm group hover:border-brand-red transition cursor-pointer" onClick={() => navigateTo('products')}>
             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-brand-red group-hover:bg-red-50 dark:group-hover:bg-red-900/20 dark:group-hover:border-red-900/50 transition">
                <UtensilsCrossed size={20} />
             </div>
             <div>
                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{productsWithFicha} <span className="text-sm text-gray-400 font-bold">/ {products.length}</span></p>
                <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Fichas Completas</p>
             </div>
          </div>

          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl flex items-center gap-4 shadow-sm group hover:border-blue-500 transition cursor-pointer relative" 
            onClick={navigateToOverdueExpenses}
          >
             {overdueExpensesCount > 0 && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
             )}
             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 dark:group-hover:border-blue-900/50 transition">
                <Receipt size={20} />
             </div>
             <div>
                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{expenses.length}</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Despesas Registradas</p>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl flex items-center gap-4 shadow-sm group hover:border-emerald-500 transition cursor-pointer" onClick={() => navigateTo('ingredients')}>
             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 dark:group-hover:border-emerald-900/50 transition">
                <Beef size={20} />
             </div>
             <div>
                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{ingredients.length}</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Insumos Base</p>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl flex items-center gap-4 shadow-sm">
             {missingFicha > 0 ? (
                 <>
                   <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-500">
                      <AlertTriangle size={20} />
                   </div>
                   <div>
                      <p className="text-xl font-black text-red-600 dark:text-red-400 leading-none">{missingFicha}</p>
                      <p className="text-[10px] uppercase font-bold text-red-500 mt-1 tracking-wider">Sem Ficha/CMV 0</p>
                   </div>
                 </>
             ) : (
                <>
                   <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-emerald-500">
                      <CheckCircle size={20} />
                   </div>
                   <div>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">100% OK</p>
                      <p className="text-[10px] uppercase font-bold text-emerald-500 mt-1 tracking-wider">Cardápio Precificado</p>
                   </div>
                </>
             )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
