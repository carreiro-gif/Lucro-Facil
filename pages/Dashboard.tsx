import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { DollarSign, Target, Dna, UtensilsCrossed, Settings, Receipt, Beef, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, ChevronRight, ChevronLeft, Calendar, Zap, Trophy, Radio, Clock, ShoppingBag, Store, RefreshCw, ArrowRight } from 'lucide-react';
import { formatPercent } from '../constants';
import { TrialBlindagemWidget } from '../components/TrialBlindagemWidget';
import { BrendiLogo, IFoodLogo, Food99Logo, KeetaLogo } from '../components/PlatformLogos';
import { isCorruptedBrendiImportTransaction } from '../utils/brendiReportParser';
import { calculateRealSalesPeriodCmv } from '../services/realSalesCmvService';
import { getExpenseEffectiveMonth } from '../utils/expenseUtils';

const formatMoney = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Dashboard: React.FC = () => {
  const { 
    monthlyRevenue, 
    expenses, 
    cfi, 
    products, 
    getProductCMV, 
    ingredients, 
    combos = [],
    calculateTotalCfiPercent,
    storeInfo,
    getCmvAvgPercent,
    calculateBreakEven,
    salesTransactions,
    accountsReceivable = [],
    brendiOrders = [],
    isBrendiSyncing = false,
    variableCosts = []
  } = useApp();
  
  const storeId = storeInfo?.id || '1';
  const localStorageKey = `lucro_facil_dashboard_monthly_goal_v1_${storeId}`;

  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(() => {
    const saved = localStorage.getItem(localStorageKey);
    return saved ? Number(saved) : null;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(monthlyGoal !== null ? monthlyGoal.toString() : '');
  const [showProfitBreakdown, setShowProfitBreakdown] = useState(false);

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

  // 1. Selected Month Logic (Defaults to latest active month or current calendar month)
  const currentCalendarMonth = new Date().toISOString().slice(0, 7);
  const activeRevenueMonths = useMemo(() => monthlyRevenue.filter(m => m.revenue > 0), [monthlyRevenue]);
  const defaultInitialMonth = activeRevenueMonths.length > 0 
    ? activeRevenueMonths[activeRevenueMonths.length - 1].month 
    : currentCalendarMonth;

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultInitialMonth);

  // Real-time Brendi orders for selected month
  const validBrendiOrders = useMemo(() => {
    return (brendiOrders || []).filter(o => {
      const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
      const m = (o.createdAt || '').slice(0, 7);
      return m === selectedMonth && !isCancelled;
    });
  }, [brendiOrders, selectedMonth]);

  const brendiRevenueTotal = useMemo(() => {
    return validBrendiOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [validBrendiOrders]);

  // Real-time Brendi orders for Today
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayBrendiOrders = useMemo(() => {
    return (brendiOrders || []).filter(o => {
      const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
      const d = (o.createdAt || '').slice(0, 10);
      return d === todayStr && !isCancelled;
    });
  }, [brendiOrders, todayStr]);

  const todayBrendiRevenue = useMemo(() => {
    return todayBrendiOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [todayBrendiOrders]);

  const latestBrendiOrders = useMemo(() => {
    return [...(brendiOrders || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);
  }, [brendiOrders]);

  // Consolidated Sales and Revenue for the selected month (Single Source of Truth)
  const monthSales = useMemo(() => {
    return salesTransactions.filter(t => (t.date || '').slice(0, 7) === selectedMonth && !isCorruptedBrendiImportTransaction(t));
  }, [salesTransactions, selectedMonth]);

  const salesRevenueTotal = useMemo(() => {
    return monthSales.reduce((sum, t) => sum + (Number(t.totalAmount) || (Number(t.pricePaidByCustomer) || 0) * (Number(t.qty) || 1)), 0);
  }, [monthSales]);

  const revEntry = useMemo(() => {
    return monthlyRevenue.find(r => r.month === selectedMonth);
  }, [monthlyRevenue, selectedMonth]);

  // Catálogo estruturado memoizado para o motor de CMV Real
  const catalog = useMemo(() => ({
    products: products || [],
    ingredients: ingredients || [],
    combos: combos || []
  }), [products, ingredients, combos]);

  // CMV Real e Vendas Reais do Período Selecionado via serviço canônico único
  const realSalesCmvOutput = useMemo(() => {
    return calculateRealSalesPeriodCmv({
      brendiOrders: brendiOrders || [],
      salesTransactions: salesTransactions || [],
      catalog,
      period: selectedMonth
    });
  }, [brendiOrders, salesTransactions, catalog, selectedMonth]);

  const realCmvResult = realSalesCmvOutput.cmvResult;

  // Receita Real consolidada baseada em vendas transacionais reais
  const monthRevenue = useMemo(() => {
    if (realCmvResult.salesCount > 0) {
      return realCmvResult.totalRevenue;
    }
    if (revEntry && typeof revEntry.revenue === 'number' && revEntry.revenue > 0) {
      return revEntry.revenue;
    }
    if (salesRevenueTotal > 0 || brendiRevenueTotal > 0) {
      return Math.max(salesRevenueTotal, brendiRevenueTotal);
    }
    return revEntry?.revenue || 0;
  }, [realCmvResult.salesCount, realCmvResult.totalRevenue, revEntry, salesRevenueTotal, brendiRevenueTotal]);

  // Previous month logic for trend relative to selected month
  const prevMonthKey = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);

  const prevMonthRevenue = useMemo(() => {
    const prevEntry = monthlyRevenue.find(r => r.month === prevMonthKey);
    if (prevEntry && prevEntry.revenue > 0) return prevEntry.revenue;
    const prevSales = salesTransactions.filter(t => (t.date || '').slice(0, 7) === prevMonthKey);
    return prevSales.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
  }, [monthlyRevenue, salesTransactions, prevMonthKey]);

  const revenueTrend = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

  // Avg 3 months for alert
  const last3Months = activeRevenueMonths.slice(-3);
  const avg3Months = last3Months.length > 0 ? last3Months.reduce((a, b) => a + b.revenue, 0) / last3Months.length : 0;
  const isRevenueDroppingSignificantly = monthRevenue > 0 && avg3Months > 0 && monthRevenue < avg3Months * 0.85;

  // 2. Costs & Profit Math for selected month
  const monthFixedCosts = useMemo(() => {
    return expenses
      .filter(e => getExpenseEffectiveMonth(e) === selectedMonth)
      .reduce((s, e) => s + (Number(e.value) || 0), 0);
  }, [expenses, selectedMonth]);

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

  // Custo Real de Insumos (CMV Real do Período sem estimativas de 32% ou 35%)
  const totalCmvValue = useMemo(() => {
    if (realCmvResult.salesCount > 0) {
      return realCmvResult.totalCmv;
    }
    return 0;
  }, [realCmvResult.salesCount, realCmvResult.totalCmv]);

  // Custos Variáveis Reais Registrados do período selecionado
  const monthVariableCosts = useMemo(() => {
    const safeVarCosts = variableCosts || [];
    return safeVarCosts
      .filter(c => {
        const costPeriod = c.period || (c.date ? c.date.slice(0, 7) : '');
        const isPeriodMatch = costPeriod === selectedMonth;
        const isActive = c.status === 'Ativo';
        // REGRA DE PROTEÇÃO CONTRA DUPLA CONTAGEM (ETAPA 2.9):
        // O CMV Real já é deduzido via totalCmvValue (calculado pelo cmvEngine).
        // Portanto, lançamentos em variableCosts com categoria 'CMV' são desconsiderados aqui
        // para garantir que o resultado tenha UM ÚNICO CMV.
        const isNotCmv = c.category !== 'CMV';
        return isPeriodMatch && isActive && isNotCmv;
      })
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);
  }, [variableCosts, selectedMonth]);

  // FÓRMULA OFICIAL DE RESULTADO / LUCRO DO PERÍODO
  // realProfit = realRevenue - realCmv - realVariableCosts - realFixedCosts
  const realProfit = monthRevenue - totalCmvValue - monthVariableCosts - monthFixedCosts;
  const profitMargin = monthRevenue > 0 ? (realProfit / monthRevenue) * 100 : 0;

  // 3. Break Even for selected month
  const totalCfiPercent = calculateTotalCfiPercent();
  const breakEvenR$ = calculateBreakEven(selectedMonth);
  const gapToBe = Math.max(0, breakEvenR$ - monthRevenue);

  // 4. Ticket Médio for selected month (combining sales, Brendi orders, and saved counts)
  const orderCount = useMemo(() => {
    if (realCmvResult.salesCount > 0) {
      return realCmvResult.salesCount;
    }
    const fromSales = monthSales.length > 0 ? new Set(monthSales.map(t => t.orderId || t.id)).size : 0;
    const fromBrendi = validBrendiOrders.length;
    let fromSaved = 0;
    try {
      const ordersMap = JSON.parse(localStorage.getItem('lucro_facil_be_monthly_orders_v1') || '{}');
      if (ordersMap[selectedMonth]) fromSaved = Number(ordersMap[selectedMonth]);
    } catch(e) {}
    return Math.max(fromSales, fromBrendi, fromSaved);
  }, [realCmvResult.salesCount, monthSales, validBrendiOrders, selectedMonth]);

  const estimatedTicket = orderCount > 0 ? monthRevenue / orderCount : 0;

  // Navigation Helper (Dispatch event for App.tsx with optional subTab support)
  const navigateTo = (tab: string, subTab?: string) => {
    if (subTab) {
      window.dispatchEvent(new CustomEvent('change-tab', { detail: { tab, subTab } }));
    } else {
      window.dispatchEvent(new CustomEvent('change-tab', { detail: tab }));
    }
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

  const { overdueReceivablesCount, overdueReceivablesAmount } = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdue = (accountsReceivable || []).filter(ar => {
      if (ar.status === 'recebido') return false;
      return ar.dueDate < todayStr;
    });
    const count = overdue.length;
    const amount = overdue.reduce((sum, item) => sum + item.amount, 0);
    return { overdueReceivablesCount: count, overdueReceivablesAmount: amount };
  }, [accountsReceivable]);

  const ifoodSubscriptionExpense = useMemo(() => {
    return (expenses || []).find(e => 
      e.month === selectedMonth && 
      (e.description?.toLowerCase().trim() === 'mensalidade ifood' || e.id?.startsWith('exp_ifood_sub_'))
    );
  }, [expenses, selectedMonth]);

  const navigateToOverdueReceivables = () => {
    sessionStorage.setItem('filter_overdue_receivables', 'true');
    navigateTo('accounts-receivable');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase mb-1">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400">Radiografia completa da saúde financeira da sua loja.</p>
        </div>

        {/* Seletor de Mês e Ano do Dashboard */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1.5 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-2 flex items-center gap-1.5">
            <Calendar size={14} className="text-brand-yellow" />
            Mês:
          </span>
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
            <button
              type="button"
              onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                const prev = new Date(y, m - 2, 1);
                setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
              }}
              className="p-0.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-gray-900 dark:text-white text-xs font-bold px-2 py-0.5 border-none focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                const next = new Date(y, m, 1);
                setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
              }}
              className="p-0.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {revEntry?.isManual && (
            <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Manual
            </span>
          )}
          {revEntry?.source && !revEntry.isManual && (
            <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              {revEntry.source}
            </span>
          )}
        </div>
      </div>

      {/* Xande Alerts Panel */}
      <div className="flex flex-col gap-3">
         {ifoodSubscriptionExpense && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
                  <Receipt size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300 text-sm flex items-center gap-2">
                    Mensalidade iFood Adicionada
                    <span className="text-[10px] bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full font-bold">Automático</span>
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400/80">
                    O faturamento do canal iFood ultrapassou o limite de cobrança no mês ({selectedMonth}). A mensalidade de <strong>{formatMoney(ifoodSubscriptionExpense.value)}</strong> foi adicionada às suas Despesas Fixas.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigateTo('expenses')} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md shrink-0"
              >
                Editar nas Despesas <ChevronRight size={14}/>
              </button>
            </div>
         )}

         {overdueReceivablesCount > 0 && (
            <div 
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in zoom-in-95 cursor-pointer hover:bg-amber-100/10 dark:hover:bg-amber-950/50 transition" 
              onClick={navigateToOverdueReceivables}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={20} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
                    ⚠️ ATENÇÃO! RECEBIMENTOS VENCIDOS
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">Urgente</span>
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80">
                    Você tem <strong>{overdueReceivablesCount}</strong> {overdueReceivablesCount === 1 ? 'recebimento vencido' : 'recebimentos vencidos'}, totalizando <strong>{formatMoney(overdueReceivablesAmount)}</strong>.
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md shrink-0">
                VER RECEBIMENTOS <ChevronRight size={14}/>
              </button>
            </div>
         )}

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

         {(realCmvResult.salesCount > 0 ? realCmvResult.cmvPercent > 35 : avgCmvPercent > 35) && (
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

         {(realCmvResult.salesCount > 0 ? realCmvResult.cmvPercent <= 35 : avgCmvPercent <= 35) && !isRevenueDroppingSignificantly && gapToBe === 0 && monthRevenue > 0 && (
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
            <div className="flex items-center justify-between mb-1 relative z-10">
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase">
                Faturamento Consolidado ({selectedMonth})
              </p>
              <div className="flex items-center gap-1">
                {brendiRevenueTotal > 0 && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    Brendi ao Vivo
                  </span>
                )}
                {revEntry?.isManual ? (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Manual
                  </span>
                ) : revEntry?.source ? (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {revEntry.source}
                  </span>
                ) : null}
              </div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white relative z-10">{formatMoney(monthRevenue)}</h3>
        </div>

        {/* Resultado / Lucro do Período */}
        <div className={`p-6 rounded-2xl border bg-white dark:bg-gray-900 ${realProfit >= 0 ? 'border-emerald-400 dark:border-emerald-500/50' : 'border-red-400 dark:border-red-500/50'} shadow-sm transition-transform hover:scale-105 duration-300 relative`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl border ${realProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'} shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]`}>
                <TrendingUp size={24} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${realProfit >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                {profitMargin.toFixed(1)}% Margem
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">
              Resultado do Período ({selectedMonth})
            </p>
            <h3 className={`text-3xl font-black ${realProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatMoney(realProfit)}
            </h3>

            <button 
              type="button" 
              onClick={() => setShowProfitBreakdown(!showProfitBreakdown)} 
              className="mt-3 text-[11px] font-bold text-brand-red dark:text-brand-orange hover:underline flex items-center gap-1"
            >
              <span>{showProfitBreakdown ? 'Ocultar Detalhamento' : 'Ver Detalhamento do Resultado'}</span>
              <ChevronRight size={14} className={`transform transition-transform ${showProfitBreakdown ? 'rotate-90' : ''}`} />
            </button>

            {showProfitBreakdown && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>RECEITA REAL:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatMoney(monthRevenue)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>(-) CMV REAL:</span>
                  <span className="font-bold text-red-500">-{formatMoney(totalCmvValue)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>(-) CUSTOS VARIÁVEIS REGISTRADOS:</span>
                  <span className="font-bold text-amber-500">-{formatMoney(monthVariableCosts)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>(-) CUSTOS FIXOS REGISTRADOS:</span>
                  <span className="font-bold text-amber-500">-{formatMoney(monthFixedCosts)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-black text-sm">
                  <span className="text-gray-900 dark:text-white">RESULTADO CALCULADO:</span>
                  <span className={realProfit >= 0 ? "text-emerald-500" : "text-red-500"}>
                    {formatMoney(realProfit)}
                  </span>
                </div>
              </div>
            )}
        </div>

        {/* CMV Real do Período */}
        <div className={`p-6 rounded-2xl border bg-white dark:bg-gray-900 shadow-sm transition-transform hover:scale-105 duration-300 ${
            realCmvResult.salesCount === 0 ? 'border-gray-200 dark:border-gray-800' :
            realCmvResult.cmvPercent <= 35 ? 'border-emerald-400 dark:border-emerald-500/50' : 
            realCmvResult.cmvPercent <= 38 ? 'border-amber-400 dark:border-amber-500/50' : 'border-red-400 dark:border-red-500/50'
        }`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl border shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] ${
                realCmvResult.salesCount === 0 ? 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700' :
                realCmvResult.cmvPercent <= 35 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 
                realCmvResult.cmvPercent <= 38 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 
                                                 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
              }`}>
                <UtensilsCrossed size={24} />
              </div>
              {realCmvResult.salesCount > 0 && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 ${
                  realCmvResult.coveragePercent === 100 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                }`}>
                  {realCmvResult.coveragePercent === 100 
                    ? '100% Cobertura' 
                    : `Cobertura ${realCmvResult.coveragePercent.toFixed(1)}%`}
                </span>
              )}
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">
              CMV Real ({selectedMonth})
            </p>

            {realCmvResult.salesCount > 0 ? (
              <>
                <div className="flex items-baseline justify-between">
                  <h3 className={`text-3xl font-black ${
                    realCmvResult.cmvPercent <= 35 ? 'text-emerald-600 dark:text-emerald-400' :
                    realCmvResult.cmvPercent <= 38 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {realCmvResult.cmvPercent.toFixed(2)}%
                  </h3>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {formatMoney(realCmvResult.totalCmv)}
                  </span>
                </div>

                <p className="text-[10px] uppercase font-bold mt-2 text-gray-400 dark:text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-800">
                  {realCmvResult.coveragePercent === 100 
                    ? `Baseado em ${realCmvResult.salesCount} vendas reais`
                    : `CMV Real • Cobertura: ${realCmvResult.coveragePercent.toFixed(1)}%`}
                </p>

                {/* Detalhamento auditável discreto */}
                <details className="mt-2 group">
                  <summary className="text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer uppercase py-1 list-none flex items-center justify-between">
                    <span>Detalhamento Real</span>
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="flex flex-col gap-1 mt-2 text-[10px] bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Custo Total de Insumos:</span>
                      <strong className="text-gray-900 dark:text-white">{formatMoney(realCmvResult.totalCmv)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Receita com CMV:</span>
                      <strong className="text-gray-900 dark:text-white">{formatMoney(realCmvResult.matchedRevenue)}</strong>
                    </div>
                    {realCmvResult.pendingRevenue > 0 && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400">
                        <span>Receita Pendente:</span>
                        <strong>{formatMoney(realCmvResult.pendingRevenue)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Vendas Analisadas:</span>
                      <strong className="text-gray-900 dark:text-white">{realCmvResult.salesCount} ({realCmvResult.completeSalesCount} completos)</strong>
                    </div>
                  </div>
                </details>
              </>
            ) : (
              <div className="mt-2">
                <h3 className="text-3xl font-black text-gray-400 dark:text-gray-600">—</h3>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-2 leading-tight">
                  Sem dados reais de vendas para este período
                </p>
              </div>
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
            {orderCount > 0 && (
              <p className="text-[10px] uppercase font-bold mt-1 text-gray-400 dark:text-gray-500">
                Base: {orderCount} pedidos {validBrendiOrders.length > 0 ? `(${validBrendiOrders.length} da Brendi)` : ''}
              </p>
            )}
        </div>
      </div>

      {/* Painel de Pedidos Brendi em Tempo Real */}
      <div className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center shrink-0 shadow-sm">
              <BrendiLogo className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-gray-900 dark:text-white uppercase text-base">
                  Pedidos Brendi em Tempo Real
                </h3>
                {isBrendiSyncing ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    Sincronizando
                  </span>
                ) : validBrendiOrders.length > 0 || brendiOrders.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    OpenDelivery Ao Vivo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    <Radio className="w-2.5 h-2.5 text-purple-600" />
                    Webhook Conectado
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Recepção instantânea de vendas do seu PDV, Balcão, Delivery Próprio, iFood e 99Food via OpenDelivery.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => navigateTo('sales-import', 'brendi')}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-purple-600/20 transition cursor-pointer"
            >
              <Zap size={14} />
              <span>Abrir Feed Completo Brendi</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigateTo('integrations')}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              title="Configurar Store UUID e Chave de Webhook"
            >
              <Settings size={14} />
              <span>Credenciais</span>
            </button>
          </div>
        </div>

        {/* 4 Mini Metrics for Brendi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 my-5 relative z-10">
          <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
              <Clock size={12} />
              Pedidos Hoje
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {todayBrendiOrders.length}
              </span>
              <span className="text-xs font-bold text-gray-500">pedidos</span>
            </div>
            <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-1">
              {formatMoney(todayBrendiRevenue)} hoje
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
              <ShoppingBag size={12} />
              Pedidos no Mês ({selectedMonth})
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {validBrendiOrders.length}
              </span>
              <span className="text-xs font-bold text-gray-500">pedidos</span>
            </div>
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1">
              Total recebido
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
              <DollarSign size={12} />
              Faturamento Brendi ({selectedMonth})
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatMoney(brendiRevenueTotal)}
              </span>
            </div>
            <p className="text-[11px] font-bold text-gray-500 mt-1">
              Integração OpenDelivery
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
              <Receipt size={12} />
              Ticket Médio Brendi
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {validBrendiOrders.length > 0 ? formatMoney(brendiRevenueTotal / validBrendiOrders.length) : '--'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-gray-500 mt-1">
              Média por pedido
            </p>
          </div>
        </div>

        {/* Mini-Feed of Recent Brendi Orders */}
        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Últimos Pedidos Recebidos da Brendi
            </h4>
            {latestBrendiOrders.length > 0 && (
              <button
                onClick={() => navigateTo('sales-import', 'brendi')}
                className="text-[11px] font-black text-purple-600 dark:text-purple-400 hover:underline uppercase flex items-center gap-1 cursor-pointer"
              >
                Ver todos os {brendiOrders.length} pedidos
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {latestBrendiOrders.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/30">
              {latestBrendiOrders.map((ord) => {
                const orderDate = ord.createdAt ? new Date(ord.createdAt) : new Date();
                const timeFormatted = orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const dateFormatted = orderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const channelLower = (ord.channel || '').toLowerCase();
                const isIfood = channelLower.includes('ifood');
                const is99 = channelLower.includes('99');
                const isDelivery = channelLower.includes('delivery');
                const itemsSummary = (ord.items || []).map(i => `${i.quantity || 1}x ${i.name}`).slice(0, 2).join(', ');
                const extraCount = (ord.items || []).length - 2;

                return (
                  <div key={ord.id} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-purple-50/40 dark:hover:bg-purple-950/10 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 shadow-xs">
                        {isIfood ? (
                          <IFoodLogo className="w-5 h-5" />
                        ) : is99 ? (
                          <Food99Logo className="w-5 h-5" />
                        ) : (
                          <BrendiLogo className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white text-xs">
                            #{String(ord.orderId || ord.id).slice(-6)}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isIfood ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/50' :
                            is99 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50' :
                            isDelivery ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/50' :
                            'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {ord.channel || 'Brendi Balcão'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {dateFormatted} às {timeFormatted}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-md mt-0.5">
                          {ord.customerName ? <strong className="text-gray-700 dark:text-gray-300">{ord.customerName}: </strong> : null}
                          {itemsSummary || '1 item'} {extraCount > 0 ? `(+${extraCount})` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-sm font-black text-gray-900 dark:text-white">
                        {formatMoney(Number(ord.total || 0))}
                      </span>
                      <button
                        onClick={() => navigateTo('sales-import', 'brendi')}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition cursor-pointer"
                        title="Ver detalhes no Feed Brendi"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center bg-gray-50/30 dark:bg-gray-950/20 space-y-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <Radio size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Aguardando pedidos em tempo real da Brendi
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Assim que um pedido for concluído no seu PDV ou aplicativo de delivery conectado à Brendi, ele entrará aqui automaticamente via OpenDelivery.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => navigateTo('sales-import', 'brendi')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Acessar Central Brendi (Integrar Vendas)
                </button>
                <button
                  onClick={() => navigateTo('integrations')}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Ver Configuração de Webhook
                </button>
              </div>
            </div>
          )}
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
                             const cmvPctToUse = (data.month === selectedMonth && realCmvResult.salesCount > 0) ? (realCmvResult.cmvPercent / 100) : (avgCmvPercent / 100);
                             const estProfitRaw = data.month === selectedMonth ? realProfit : (data.revenue - (data.revenue * cmvPctToUse) - monthFixedCosts);
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
                      if (entry.month === selectedMonth) color = '#FBBF24'; // Golden Yellow for selected month
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

      {/* Ranking de Vendas e Rentabilidade CTA */}
      <div className="bg-gradient-to-r from-amber-500/10 via-brand-red/10 to-purple-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 rounded">NOVO</span>
              <h3 className="font-black text-gray-900 dark:text-white uppercase text-base">Ranking de Vendas & Rentabilidade Real</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Classificação dos produtos mais vendidos da sua loja ao menos vendido, cálculo de <strong>lucro líquido real em R$</strong> deduzindo o CMV de insumos e custos fixos/CFI, identificação de Campeões Magros e diagnósticos do que reformular.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={() => navigateTo('profit')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-red hover:bg-[#b00720] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-brand-red/20 transition cursor-pointer"
          >
            <Trophy size={15} />
            <span>Ver Ranking</span>
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => navigateTo('sales-import')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            <span>Integrar Vendas</span>
          </button>
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
