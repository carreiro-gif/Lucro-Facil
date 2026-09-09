import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, Settings, Calendar, Edit2, AlertTriangle, X, ChevronLeft, ChevronRight, 
  CheckCircle, Clock, HelpCircle, Trash, Search, RotateCcw, 
  FileText, Building2, ChevronDown, DollarSign, Tag, Layers, Printer
} from 'lucide-react';
import { Expense } from '../types';
import { formatPercent } from '../constants';
import { exportExpensesReport } from '../utils/pdfExport';
import { ExpensesReportModal } from '../components/ExpensesReportModal';

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export const getExpenseEffectiveMonth = (e: Expense): string => {
  if (e.dueDate && e.dueDate.length >= 7) {
    return e.dueDate.substring(0, 7);
  }
  return e.month || '';
};

const Expenses: React.FC = () => {
  const { 
    expenses, 
    monthlyRevenue, 
    categories, 
    addExpenseWithInstallments, 
    updateExpense, 
    updateExpenseAndFutureInstallments,
    deleteExpense,
    fixedCostMode, 
    setFixedCostMode,
    storeInfo
  } = useApp();

  const [showHelp, setShowHelp] = useState(false);
  const [showAnnualSummary, setShowAnnualSummary] = useState(false);

  // Current date helpers
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentMonthVal = MONTHS[currentMonthIdx].value;

  // Period filter states
  const [periodMode, setPeriodMode] = useState<'MONTH' | 'CUSTOM' | 'ALL'>('MONTH');
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(currentMonthVal);
  const [customStartDate, setCustomStartDate] = useState(`${currentYear}-01-01`);
  const [customEndDate, setCustomEndDate] = useState(`${currentYear}-12-31`);

  // Advanced filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'DUE_SOON' | 'OVERDUE' | 'INSTALLMENTS'>('ALL');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [showInstallmentPrompt, setShowInstallmentPrompt] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<any>(null);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Form States
  const [formMonthStr, setFormMonthStr] = useState(`${currentYear}-${currentMonthVal}`);
  const [desc, setDesc] = useState('');
  const [creditor, setCreditor] = useState('');
  const [val, setVal] = useState('');
  const [cat, setCat] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [installmentType, setInstallmentType] = useState<'SINGLE' | 'INSTALLMENTS' | 'RECURRING'>('SINGLE');
  const [installmentsCount, setInstallmentsCount] = useState(1);

  // Computed Keys
  const selectedMonthKey = `${viewYear}-${viewMonth}`;

  useEffect(() => {
    if (localStorage.getItem('show_overdue_expenses_modal') === 'true') {
      localStorage.removeItem('show_overdue_expenses_modal');
      setShowOverdueModal(true);
    }
  }, []);

  // Check if an expense is overdue
  const checkIsOverdue = (e: Expense) => {
    if (e.paid || !e.dueDate) return false;
    const due = new Date(e.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  // Check if an expense is due soon (today or tomorrow) or future
  const checkIsDueSoonOrFuture = (e: Expense) => {
    if (e.paid) return false;
    if (!e.dueDate) return true; // without date, considered pending
    const due = new Date(e.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due.getTime() >= today.getTime();
  };

  // Status detail helper
  const getStatus = (expense: Expense) => {
    if (expense.paid) {
      return { 
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', 
        icon: CheckCircle, 
        label: 'Paga' 
      };
    }
    
    if (!expense.dueDate) {
      return { 
        color: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', 
        icon: Clock, 
        label: 'S/ Data' 
      };
    }

    const due = new Date(expense.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30', 
        icon: AlertTriangle, 
        label: 'Vencida' 
      };
    }
    if (diffDays === 0) {
      return { 
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30', 
        icon: Clock, 
        label: 'Vence Hoje' 
      };
    }
    if (diffDays === 1) {
      return { 
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30', 
        icon: Clock, 
        label: 'Vence Amanhã' 
      };
    }
    
    return { 
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20', 
      icon: Clock, 
      label: 'A vencer' 
    };
  };

  // Global overdue expenses across all months
  const globalOverdueExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expenses.filter(e => {
      if (e.paid || !e.dueDate) return false;
      const due = new Date(e.dueDate + 'T00:00:00');
      return due.getTime() < today.getTime();
    }).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [expenses]);

  const globalOverdueTotal = useMemo(() => {
    return globalOverdueExpenses.reduce((sum, e) => sum + (Number(e.value) || 0), 0);
  }, [globalOverdueExpenses]);

  // Filter expenses strictly according to the period
  const periodFilteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const effMonth = getExpenseEffectiveMonth(e);
      if (periodMode === 'MONTH') {
        return effMonth === selectedMonthKey;
      }
      if (periodMode === 'CUSTOM') {
        if (e.dueDate) {
          return e.dueDate >= customStartDate && e.dueDate <= customEndDate;
        }
        const monthStart = `${e.month}-01`;
        return monthStart >= customStartDate && monthStart <= customEndDate;
      }
      return true; // 'ALL'
    });
  }, [expenses, periodMode, selectedMonthKey, customStartDate, customEndDate]);

  // Financial Summary Cards data (based on active period filter)
  const summaryCardsData = useMemo(() => {
    const list = periodFilteredExpenses;
    const total = list.reduce((sum, e) => sum + (Number(e.value) || 0), 0);
    const paidList = list.filter(e => e.paid);
    const totalPaid = paidList.reduce((sum, e) => sum + (Number(e.value) || 0), 0);
    
    const overdueList = list.filter(e => checkIsOverdue(e));
    const totalOverdue = overdueList.reduce((sum, e) => sum + (Number(e.value) || 0), 0);

    const dueSoonList = list.filter(e => checkIsDueSoonOrFuture(e));
    const totalDueSoon = dueSoonList.reduce((sum, e) => sum + (Number(e.value) || 0), 0);

    return {
      total,
      count: list.length,
      totalPaid,
      paidCount: paidList.length,
      totalDueSoon,
      dueSoonCount: dueSoonList.length,
      totalOverdue,
      overdueCount: overdueList.length
    };
  }, [periodFilteredExpenses]);

  // Final filtered list with advanced filters (Status, Category, Text search)
  const displayedExpenses = useMemo(() => {
    let result = periodFilteredExpenses;

    // Status filter
    if (statusFilter === 'PAID') {
      result = result.filter(e => e.paid);
    } else if (statusFilter === 'DUE_SOON') {
      result = result.filter(e => checkIsDueSoonOrFuture(e));
    } else if (statusFilter === 'OVERDUE') {
      result = result.filter(e => checkIsOverdue(e));
    } else if (statusFilter === 'INSTALLMENTS') {
      result = result.filter(e => Boolean(e.installment));
    }

    // Categories filter
    if (selectedCategories.length > 0) {
      result = result.filter(e => selectedCategories.includes(e.category));
    }

    // Search term filter (real-time by description OR creditor)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(e => {
        const descMatch = (e.description || '').toLowerCase().includes(term);
        const creditorMatch = (e.creditor || '').toLowerCase().includes(term);
        const catMatch = (e.category || '').toLowerCase().includes(term);
        return descMatch || creditorMatch || catMatch;
      });
    }

    // Sort by due date ascending, then description
    return result.sort((a, b) => {
      const dateA = a.dueDate || a.month;
      const dateB = b.dueDate || b.month;
      return dateA.localeCompare(dateB);
    });
  }, [periodFilteredExpenses, statusFilter, selectedCategories, searchTerm]);

  // Check how many active filters are applied
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (periodMode !== 'MONTH' || viewYear !== currentYear || viewMonth !== currentMonthVal) count++;
    if (statusFilter !== 'ALL') count++;
    if (selectedCategories.length > 0) count++;
    if (searchTerm.trim() !== '') count++;
    return count;
  }, [periodMode, viewYear, viewMonth, currentYear, currentMonthVal, statusFilter, selectedCategories, searchTerm]);

  // Reset all filters to default
  const handleClearFilters = () => {
    setPeriodMode('MONTH');
    setViewYear(currentYear);
    setViewMonth(currentMonthVal);
    setCustomStartDate(`${currentYear}-01-01`);
    setCustomEndDate(`${currentYear}-12-31`);
    setStatusFilter('ALL');
    setSelectedCategories([]);
    setSearchTerm('');
  };

  // Toggle category in multi-select
  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  // Calculate Average Cost based on Last 12 Months rule for CFI calculation
  const last12MonthsMetrics = useMemo(() => {
    const activeRevenueMonths = monthlyRevenue
        .filter(r => Number(r.revenue) > 0)
        .sort((a, b) => a.month.localeCompare(b.month));
    
    const last12 = activeRevenueMonths.slice(-12);
    
    let totalCost = 0;
    let totalRev = 0;
    const monthsCount = last12.length;

    last12.forEach(m => {
      const exp = expenses
        .filter(e => getExpenseEffectiveMonth(e) === m.month)
        .reduce((s, e) => s + Number(e.value), 0);
      const rev = Number(m.revenue);
      
      totalCost += exp;
      totalRev += rev;
    });

    const avgCost = monthsCount > 0 ? totalCost / monthsCount : 0;
    const avgPct = totalRev > 0 ? (totalCost / totalRev) * 100 : 0;

    return { avgCost, avgPct, monthsCount };
  }, [expenses, monthlyRevenue]);

  // Summary Table Data (For the selected YEAR)
  const summaryData = useMemo(() => {
    return MONTHS.map(m => {
      const monthKey = `${viewYear}-${m.value}`;
      const monthExpenses = expenses.filter(e => getExpenseEffectiveMonth(e) === monthKey);
      const totalCost = monthExpenses.reduce((sum, e) => sum + Number(e.value), 0);
      const revenueObj = monthlyRevenue.find(r => r.month === monthKey);
      const revenue = revenueObj ? Number(revenueObj.revenue) : 0;
      const percentage = revenue > 0 ? (totalCost / revenue) * 100 : 0;

      return {
        label: m.label,
        monthKey,
        totalCost,
        percentage,
        hasData: totalCost > 0 || revenue > 0
      };
    });
  }, [viewYear, expenses, monthlyRevenue]);

  const activeMonthData = summaryData.find(d => d.monthKey === selectedMonthKey);
  
  const displayFixedCostValue = fixedCostMode === 'AVERAGE' 
    ? last12MonthsMetrics.avgCost 
    : (activeMonthData?.totalCost || 0);

  const displayFixedCostPercent = fixedCostMode === 'AVERAGE'
    ? last12MonthsMetrics.avgPct
    : (activeMonthData?.percentage || 0);

  // Handlers
  const handleYearChange = (delta: number) => {
    setViewYear(prev => prev + delta);
  };

  const togglePaid = (exp: Expense) => {
    updateExpense(exp.id, { paid: !exp.paid });
  };

  const openNewExpenseModal = () => {
    setEditingExpenseId(null);
    setFormMonthStr(selectedMonthKey);
    setDesc('');
    setCreditor('');
    setVal('');
    setCat(categories[0]?.name || '');
    setDueDate('');
    setIsPaid(false);
    setInstallmentType('SINGLE');
    setInstallmentsCount(1);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setFormMonthStr(exp.month);
    setDesc(exp.description);
    setCreditor(exp.creditor || '');
    setVal(exp.value.toString());
    setCat(exp.category);
    setDueDate(exp.dueDate || '');
    setIsPaid(!!exp.paid);
    setInstallmentType('SINGLE');
    setInstallmentsCount(1);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !val || !cat) return;

    // Sincroniza mês com data de vencimento se informada
    const effectiveMonthStr = dueDate && dueDate.length >= 7 ? dueDate.substring(0, 7) : formMonthStr;

    if (editingExpenseId) {
      const exp = expenses.find(e => e.id === editingExpenseId);
      const editData: Partial<Expense> = {
        description: desc,
        creditor: creditor.trim() ? creditor.trim() : undefined,
        value: parseFloat(val),
        category: cat,
        month: effectiveMonthStr,
        dueDate: dueDate,
        paid: isPaid
      };
      
      if (exp?.installment && exp.installment.current < exp.installment.total) {
        setPendingEditData(editData);
        setShowInstallmentPrompt(true);
      } else {
        updateExpense(editingExpenseId, editData);
        setIsModalOpen(false);
      }
    } else {
      const count = installmentType === 'SINGLE' ? 1 : installmentsCount;
      addExpenseWithInstallments({
        month: effectiveMonthStr,
        description: desc,
        creditor: creditor.trim() ? creditor.trim() : undefined,
        value: parseFloat(val),
        category: cat,
        dueDate: dueDate,
        paid: isPaid
      }, count);
      setIsModalOpen(false);
    }
  };

  // Text summary of active filters for report header
  const filtersSummaryList = useMemo(() => {
    const list: string[] = [];
    if (periodMode === 'MONTH') {
      const monthObj = MONTHS.find(m => m.value === viewMonth);
      list.push(`Período: ${monthObj?.label || viewMonth}/${viewYear}`);
    } else if (periodMode === 'CUSTOM') {
      list.push(`Intervalo: ${customStartDate.split('-').reverse().join('/')} até ${customEndDate.split('-').reverse().join('/')}`);
    } else {
      list.push('Período: Todos os Lançamentos');
    }

    if (statusFilter === 'ALL') list.push('Status: Todas');
    else if (statusFilter === 'PAID') list.push('Status: Pagas');
    else if (statusFilter === 'DUE_SOON') list.push('Status: A Vencer');
    else if (statusFilter === 'OVERDUE') list.push('Status: Vencidas');
    else if (statusFilter === 'INSTALLMENTS') list.push('Status: Parceladas');

    if (selectedCategories.length > 0) {
      list.push(`Categorias: ${selectedCategories.join(', ')}`);
    } else {
      list.push('Categorias: Todas');
    }

    if (searchTerm.trim() !== '') {
      list.push(`Busca por Texto / Credor: "${searchTerm}"`);
    }

    return list;
  }, [periodMode, viewMonth, viewYear, customStartDate, customEndDate, statusFilter, selectedCategories, searchTerm]);

  return (
    <div className="w-full space-y-6 animate-fade-in relative pb-20">
      
      {/* 6ª MELHORIA: ALERTA INTELIGENTE DE DESPESAS VENCIDAS */}
      {globalOverdueExpenses.length > 0 && (
        <div 
          id="overdue-alert-banner"
          className="bg-red-500/10 border-2 border-red-500/40 dark:border-red-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle size={22} className="animate-bounce" />
            </div>
            <div>
              <h4 className="font-extrabold text-red-800 dark:text-red-300 text-sm sm:text-base flex items-center gap-2">
                Atenção! Você tem {globalOverdueExpenses.length} {globalOverdueExpenses.length === 1 ? 'despesa vencida' : 'despesas vencidas'}
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Urgente
                </span>
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                Valor total em atraso: <strong className="text-sm font-mono text-red-900 dark:text-red-200">R$ {globalOverdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. Regularize para evitar juros e suspensão de fornecedores.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                setStatusFilter('OVERDUE');
                setPeriodMode('ALL');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
            >
              <AlertTriangle size={14} />
              <span>Ver Vencidas ({globalOverdueExpenses.length})</span>
            </button>
            <button 
              onClick={() => setShowOverdueModal(true)}
              className="px-3 py-2 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800/50 rounded-xl text-xs font-bold hover:bg-red-200 transition"
            >
              Lista Rápida
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER CONTROLS */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
                  Contas a Pagar
                </h1>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full font-bold">
                  Despesas Fixas
                </span>
                <button 
                  onClick={() => setShowHelp(!showHelp)} 
                  className="text-gray-400 hover:text-brand-red transition-colors"
                  title="Ajuda sobre como gerenciar contas a pagar e custos fixos"
                >
                  <HelpCircle size={18} />
                </button>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                Centro de controle profissional de contas, vencimentos, credores e fluxo financeiro da sua loja.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
            title="Abrir tela de relatório completo para visualização, impressão ou exportação"
          >
            <FileText size={16} />
            <span>Ver Relatório Completo</span>
          </button>

          <button
            onClick={() => {
              exportExpensesReport({
                storeName: storeInfo?.name || 'Minha Loja',
                expenses: displayedExpenses,
                categories: categories || [],
                filtersSummary: filtersSummaryList,
                title: 'Relatório de Contas a Pagar'
              });
            }}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
            title="Exportar PDF com os filtros aplicados"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>

          <button 
            onClick={() => setShowAnnualSummary(!showAnnualSummary)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${showAnnualSummary ? 'bg-brand-dark text-white border-transparent shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200'}`}
            title="Ver resumo dos 12 meses e métricas de CFI"
          >
            <Layers size={16} />
            <span>{showAnnualSummary ? 'Ocultar Resumo CFI' : 'Ver Resumo CFI (12 Meses)'}</span>
          </button>

          <button 
            onClick={openNewExpenseModal}
            className="px-4 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-md shadow-red-900/20 uppercase tracking-wider"
          >
            <Plus size={18} />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* HELP PANEL */}
      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm no-print">
          <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
          <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
            <HelpCircle size={18} /> Como funciona o Contas a Pagar e Despesas Fixas?
          </h4>
          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-2 leading-relaxed">
            <p>Nesta tela você gerencia todas as contas e despesas que a loja precisa honrar (Aluguel, Folha de Pagamento, Empréstimos, Internet, Contador, Software, etc.).</p>
            <p><strong>Diferencial do Credor:</strong> Você pode associar cada conta ao seu credor (ex: <em>Cartão Ribeiro, Banco Santander, Fornecedor X</em>) e filtrar por ele para saber quanto deve a cada um.</p>
            <p><strong>Critério de Vencimento:</strong> Ao selecionar um mês específico (ex: Agosto/2026), o sistema exibe apenas as contas que vencem exatamente naquele mês. Despesas parceladas caem mês a mês de acordo com o vencimento da parcela.</p>
          </div>
        </div>
      )}

      {/* 1ª MELHORIA: PAINEL DE RESUMO FINANCEIRO (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Despesas */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total de Despesas</span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white font-mono tracking-tight">
              R$ {summaryCardsData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {summaryCardsData.count} {summaryCardsData.count === 1 ? 'lançamento no período' : 'lançamentos no período'}
            </p>
          </div>
        </div>

        {/* Card 2: Total Já Pago (Fundo Verde) */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-emerald-400 transition">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle size={15} /> Total Já Pago
            </span>
            <span className="text-[10px] font-bold bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Quitado
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono tracking-tight">
              R$ {summaryCardsData.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
              {summaryCardsData.paidCount} {summaryCardsData.paidCount === 1 ? 'despesa paga' : 'despesas pagas'}
            </p>
          </div>
        </div>

        {/* Card 3: Total a Vencer (Fundo Amarelo) */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-amber-400 transition">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={15} /> Total a Vencer
            </span>
            <span className="text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full">
              Em Aberto
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-200 font-mono tracking-tight">
              R$ {summaryCardsData.totalDueSoon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
              {summaryCardsData.dueSoonCount} {summaryCardsData.dueSoonCount === 1 ? 'conta a vencer' : 'contas a vencer'}
            </p>
          </div>
        </div>

        {/* Card 4: Total Vencido e Não Pago (Fundo Vermelho e Alerta de Atenção) */}
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800/60 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-red-400 transition">
          <div className="flex items-center justify-between text-red-800 dark:text-red-400 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={15} /> Total Vencido
            </span>
            <span className="text-[10px] font-bold bg-red-200/80 dark:bg-red-900/80 text-red-900 dark:text-red-200 px-2 py-0.5 rounded-full animate-pulse">
              Atrasado
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-red-900 dark:text-red-200 font-mono tracking-tight">
              R$ {summaryCardsData.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1 font-medium">
              {summaryCardsData.overdueCount} {summaryCardsData.overdueCount === 1 ? 'conta atrasada' : 'contas atrasadas'}
            </p>
          </div>
        </div>
      </div>

      {/* 2ª MELHORIA: SISTEMA COMPLETO DE FILTROS AVANÇADOS */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Row 1: Período & Status Options */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Período Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                onClick={() => setPeriodMode('MONTH')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${periodMode === 'MONTH' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Mês / Ano
              </button>
              <button
                onClick={() => setPeriodMode('CUSTOM')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${periodMode === 'CUSTOM' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Intervalo de Datas
              </button>
              <button
                onClick={() => setPeriodMode('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${periodMode === 'ALL' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Todos os Meses
              </button>
            </div>

            {/* If Month/Year */}
            {periodMode === 'MONTH' && (
              <div className="flex items-center gap-2">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-red"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-1.5 py-0.5">
                  <button onClick={() => handleYearChange(-1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"><ChevronLeft size={16}/></button>
                  <span className="text-xs font-bold px-2 text-gray-900 dark:text-white">{viewYear}</span>
                  <button onClick={() => handleYearChange(1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"><ChevronRight size={16}/></button>
                </div>
              </div>
            )}

            {/* If Custom Date Range */}
            {periodMode === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span>De:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-xs text-gray-900 dark:text-white font-mono outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span>Até:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-xs text-gray-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reset Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="self-start lg:self-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition text-nowrap"
            >
              <RotateCcw size={13} />
              <span>Limpar Filtros ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Row 2: Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Status:</span>
          
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'ALL' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
          >
            <span>Todas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full opacity-80">{periodFilteredExpenses.length}</span>
          </button>

          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'}`}
          >
            <CheckCircle size={13} />
            <span>Pagas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full opacity-80">{periodFilteredExpenses.filter(e => e.paid).length}</span>
          </button>

          <button
            onClick={() => setStatusFilter('DUE_SOON')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'DUE_SOON' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'}`}
          >
            <Clock size={13} />
            <span>A Vencer</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full opacity-80">{periodFilteredExpenses.filter(e => checkIsDueSoonOrFuture(e)).length}</span>
          </button>

          <button
            onClick={() => setStatusFilter('OVERDUE')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'OVERDUE' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100'}`}
          >
            <AlertTriangle size={13} />
            <span>Vencidas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full opacity-80">{periodFilteredExpenses.filter(e => checkIsOverdue(e)).length}</span>
          </button>

          <button
            onClick={() => setStatusFilter('INSTALLMENTS')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'INSTALLMENTS' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100'}`}
          >
            <Calendar size={13} />
            <span>Parceladas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full opacity-80">{periodFilteredExpenses.filter(e => Boolean(e.installment)).length}</span>
          </button>
        </div>

        {/* Row 3: Real-Time Text Search & Multi-Category Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
          
          {/* Text search by description or creditor */}
          <div className="md:col-span-7 relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar em tempo real por despesa ou credor (ex: Cartão Ribeiro, Aluguel, Luz...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-red font-medium transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {searchTerm.trim() !== '' && periodMode === 'MONTH' && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <span>Buscando no mês selecionado.</span>
                <button
                  onClick={() => setPeriodMode('ALL')}
                  className="text-brand-red hover:underline font-bold"
                >
                  Buscar em todos os meses
                </button>
              </p>
            )}
          </div>

          {/* Category Dropdown Multi-Select */}
          <div className="md:col-span-5 relative">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-left text-gray-800 dark:text-gray-200 flex justify-between items-center outline-none"
            >
              <div className="flex items-center gap-2 truncate">
                <Tag size={15} className="text-gray-400 shrink-0" />
                <span className="truncate">
                  {selectedCategories.length === 0 
                    ? 'Todas as Categorias' 
                    : `${selectedCategories.length} categoria(s) selecionada(s)`}
                </span>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsCategoryDropdownOpen(false)} 
                />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-2 z-30 max-h-60 overflow-y-auto space-y-1 animate-fade-in">
                  <div className="flex justify-between items-center px-2 py-1 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Filtrar Categorias</span>
                    {selectedCategories.length > 0 && (
                      <button 
                        onClick={() => setSelectedCategories([])}
                        className="text-[10px] font-bold text-brand-red hover:underline"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  {categories.map(c => {
                    const isChecked = selectedCategories.includes(c.name);
                    return (
                      <label 
                        key={c.id} 
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(c.name)}
                          className="rounded border-gray-300 text-brand-red focus:ring-brand-red"
                        />
                        <span className="flex-1 truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected Category Chips */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedCategories.map(catName => (
              <span
                key={catName}
                className="inline-flex items-center gap-1 text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2.5 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700 font-medium"
              >
                {catName}
                <button onClick={() => toggleCategory(catName)} className="hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3ª MELHORIA: VISUALIZAÇÃO EM LISTA PROFISSIONAL DE CONTAS A PAGAR */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
        
        {/* Table Title Bar */}
        <div className="bg-gray-50/80 dark:bg-gray-950/60 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2.5">
            <Settings size={18} className="text-brand-red" />
            <h3 className="font-extrabold text-gray-900 dark:text-white uppercase text-sm tracking-wide">
              {periodMode === 'MONTH' ? `Lançamentos de ${MONTHS.find(m => m.value === viewMonth)?.label}/${viewYear}` : 'Lançamentos Filtrados'}
            </h3>
            <span className="text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 font-bold">
              {displayedExpenses.length} {displayedExpenses.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total exibido: <strong className="text-gray-900 dark:text-white font-mono font-bold">R$ {displayedExpenses.reduce((s, e) => s + (Number(e.value) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-[11px] uppercase font-bold tracking-wider border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5">Despesa</th>
                <th className="px-4 py-3.5">Credor / Origem</th>
                <th className="px-4 py-3.5">Categoria</th>
                <th className="px-4 py-3.5 text-center">Vencimento</th>
                <th className="px-4 py-3.5 text-right font-mono">Valor (R$)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {displayedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="font-bold text-gray-700 dark:text-gray-300 text-base">Nenhuma despesa encontrada</p>
                      <p className="text-xs text-gray-500">
                        {activeFiltersCount > 0 
                          ? 'Tente ajustar os filtros ou clique em "Limpar Filtros" para ver todas as despesas.' 
                          : `Nenhuma despesa com vencimento em ${MONTHS.find(m => m.value === viewMonth)?.label}/${viewYear}.`}
                      </p>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition"
                        >
                          Redefinir Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedExpenses.map(exp => {
                  const status = getStatus(exp);
                  const StatusIcon = status.icon;
                  const dueFormatted = exp.dueDate ? exp.dueDate.split('-').reverse().join('/') : '-';

                  return (
                    <tr 
                      key={exp.id} 
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition group cursor-pointer"
                      onClick={() => openEditModal(exp)}
                    >
                      {/* Despesa / Descrição */}
                      <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span title={exp.description} className="text-sm">
                            {exp.description}
                          </span>
                          {exp.installment && (
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200 dark:border-blue-800">
                              Parcela {exp.installment.current}/{exp.installment.total}
                            </span>
                          )}
                          {exp.id.startsWith('exp_collab_') && (
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                              👥 Colaboradores
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Credor / Origem */}
                      <td className="px-4 py-3.5">
                        {exp.creditor ? (
                          <span 
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700"
                            title={`Credor: ${exp.creditor}`}
                          >
                            <Building2 size={12} className="text-gray-400" />
                            <span className="truncate max-w-[140px]">{exp.creditor}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 font-medium">
                        {exp.category}
                      </td>

                      {/* Vencimento */}
                      <td className="px-4 py-3.5 text-center font-mono text-gray-700 dark:text-gray-200">
                        <div>{dueFormatted}</div>
                        {exp.dueDate && (
                          <div className="text-[10px] text-gray-400 font-sans">
                            {(() => {
                              const due = new Date(exp.dueDate + 'T00:00:00');
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays < 0) return `${Math.abs(diffDays)}d atrasado`;
                              if (diffDays === 0) return 'Hoje';
                              if (diffDays === 1) return 'Amanhã';
                              return `Em ${diffDays}d`;
                            })()}
                          </div>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-sm text-gray-900 dark:text-white">
                        R$ {Number(exp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => togglePaid(exp)}
                          title="Clique para alternar entre Pago e Não Pago"
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase transition hover:scale-105 ${status.color}`}
                        >
                          <StatusIcon size={12} />
                          <span>{status.label}</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(exp)}
                            title="Editar Despesa"
                            className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition border border-blue-200 dark:border-blue-800"
                          >
                            <Edit2 size={13} />
                          </button>

                          {deletingExpenseId === exp.id ? (
                            <button
                              onClick={() => {
                                deleteExpense(exp.id);
                                setDeletingExpenseId(null);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition animate-pulse"
                            >
                              Confirmar?
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeletingExpenseId(exp.id)}
                              title="Excluir Lançamento"
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                            >
                              <Trash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Totals */}
        <div className="bg-gray-50 dark:bg-gray-950 p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="text-gray-500 dark:text-gray-400">
            Mostrando <strong>{displayedExpenses.length}</strong> lançamentos | 
            Pagas: <strong className="text-emerald-600 font-mono">R$ {displayedExpenses.filter(e => e.paid).reduce((s, e) => s + Number(e.value), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> | 
            Pendentes: <strong className="text-amber-600 font-mono">R$ {displayedExpenses.filter(e => !e.paid).reduce((s, e) => s + Number(e.value), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-bold uppercase">Total Filtrado:</span>
            <span className="text-base font-extrabold font-mono text-gray-950 dark:text-white">
              R$ {displayedExpenses.reduce((s, e) => s + Number(e.value), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO OPCIONAL EXPANSÍVEL: RESUMO ANUAL & CUSTO FIXO PARA CFI */}
      {showAnnualSummary && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in">
          {/* Tabela Resumo Anual */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 dark:bg-gray-950 px-6 py-3.5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider">
                Resumo Anual de Custo Fixo ({viewYear})
              </h3>
              <span className="text-xs text-gray-500">Base para precificação</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-2.5">Mês</th>
                  <th className="px-5 py-2.5 text-right font-mono">Total (R$)</th>
                  <th className="px-5 py-2.5 text-right font-mono">% Custo Fixo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {summaryData.map((data, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => {
                      setViewMonth(MONTHS[idx].value);
                      setPeriodMode('MONTH');
                    }}
                    className={`cursor-pointer transition ${data.monthKey === selectedMonthKey && periodMode === 'MONTH' ? 'bg-brand-red/10 border-l-4 border-brand-red font-bold' : (data.hasData ? 'hover:bg-gray-50 dark:hover:bg-gray-800/40' : 'text-gray-400')}`}
                  >
                    <td className="px-5 py-2 font-medium text-gray-700 dark:text-gray-300">{data.label}</td>
                    <td className="px-5 py-2 text-right font-mono text-gray-900 dark:text-gray-200">
                      {data.hasData ? `R$ ${data.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-5 py-2 text-right font-mono text-gray-900 dark:text-gray-200">
                      {data.hasData ? formatPercent(data.percentage) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Painel de Modo de Cálculo CFI */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                  Modo de Cálculo do Custo Fixo (CFI)
                </h4>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button 
                    onClick={() => setFixedCostMode('AVERAGE')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${fixedCostMode === 'AVERAGE' ? 'bg-brand-red text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    MÉDIA (12 Meses)
                  </button>
                  <button 
                    onClick={() => setFixedCostMode('CURRENT_MONTH')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${fixedCostMode === 'CURRENT_MONTH' ? 'bg-brand-red text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    MÊS ATUAL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Custo Fixo Considerado</p>
                  <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">
                    R$ {displayFixedCostValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500">% Aplicada no Preço de Venda</p>
                  <p className="text-2xl font-bold font-mono text-brand-red mt-1">
                    {formatPercent(displayFixedCostPercent)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {fixedCostMode === 'AVERAGE' 
                  ? `Baseado na média dos últimos ${last12MonthsMetrics.monthsCount} meses com faturamento > 0.` 
                  : 'Baseado exclusivamente nos lançamentos e faturamento do mês selecionado.'}
                Este percentual é repassado automaticamente para a calculadora de precificação e cálculo do ponto de equilíbrio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5ª MELHORIA: MODAL DE NOVA / EDITAR DESPESA COM CAMPO CREDOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/80 dark:bg-gray-950/40">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {editingExpenseId ? <Edit2 size={18} className="text-brand-red" /> : <Plus size={18} className="text-brand-red" />}
                {editingExpenseId ? 'Editar Despesa' : 'Nova Despesa / Conta a Pagar'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">
                  Descrição da Despesa *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Aluguel do Ponto, Conta de Luz, Fatura do Cartão..."
                  value={desc} 
                  onChange={e => setDesc(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>

              {/* 5ª MELHORIA: CAMPO CREDOR OU ORIGEM (OPCIONAL) */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} /> Credor ou Origem da Dívida (Opcional)
                  </span>
                  <span className="text-[10px] font-normal text-gray-400">Banco, fornecedor ou empresa</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Cartão Ribeiro, Fornecedor X, Aluguel Shopping, Banco Itaú..."
                  value={creditor} 
                  onChange={e => setCreditor(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>

              {/* Valor & Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">
                    Valor (R$) *
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={val} 
                    onChange={e => setVal(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm font-mono outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">
                    Categoria Financeira *
                  </label>
                  <select 
                    value={cat} 
                    onChange={e => setCat(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  >
                    <option value="" disabled>Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data de Vencimento & Status de Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">
                    Data de Vencimento
                  </label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => {
                      setDueDate(e.target.value);
                      if (e.target.value && e.target.value.length >= 7) {
                        setFormMonthStr(e.target.value.substring(0, 7));
                      }
                    }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">
                    Status Pagamento
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs uppercase transition ${isPaid ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500 dark:text-emerald-400' : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}
                  >
                    {isPaid ? <><CheckCircle size={16}/> PAGA</> : <><X size={16}/> NÃO PAGA (EM ABERTO)</>}
                  </button>
                </div>
              </div>

              {/* Se for Novo Lançamento: Opções de Repetição / Parcelamento */}
              {!editingExpenseId && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase flex items-center gap-1.5">
                      <Calendar size={14} /> Frequência / Parcelamento
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setInstallmentType('SINGLE'); setInstallmentsCount(1); }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition ${installmentType === 'SINGLE' ? 'bg-brand-red text-white border-brand-red' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      À Vista (1x)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setInstallmentType('INSTALLMENTS'); setInstallmentsCount(installmentsCount > 1 ? installmentsCount : 2); }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition ${installmentType === 'INSTALLMENTS' ? 'bg-brand-red text-white border-brand-red' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      Parcelado
                    </button>
                    <button
                      type="button"
                      onClick={() => { setInstallmentType('RECURRING'); setInstallmentsCount(12); }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition ${installmentType === 'RECURRING' ? 'bg-brand-red text-white border-brand-red' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      Recorrente (12M)
                    </button>
                  </div>

                  {installmentType !== 'SINGLE' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Quantidade de Meses/Parcelas:</span>
                        <span className="font-bold text-brand-red">{installmentsCount}x de R$ {parseFloat(val || '0').toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="2" 
                        max="36" 
                        value={installmentsCount} 
                        onChange={e => setInstallmentsCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-red"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>2x</span>
                        <span>12x</span>
                        <span>24x</span>
                        <span>36x</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        O sistema criará automaticamente {installmentsCount} lançamentos, um para cada mês subsequente, com a data de vencimento ajustada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Botoes de Ação */}
              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-brand-red text-white rounded-xl hover:bg-red-700 font-extrabold text-xs uppercase shadow-md shadow-red-900/20"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTALLMENT PROMPT MODAL */}
      {showInstallmentPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Atualizar parcelas futuras?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Esta despesa é parcelada. Gostaria de editar <strong>só a atual</strong> ou <strong>todas as restantes de uma vez</strong> (incluindo credor e valor)?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  updateExpenseAndFutureInstallments(editingExpenseId!, pendingEditData);
                  setShowInstallmentPrompt(false);
                  setIsModalOpen(false);
                }}
                className="w-full py-3 bg-brand-red text-white rounded-xl font-bold text-xs uppercase shadow-md shadow-red-900/20"
              >
                Todas as Restantes
              </button>
              <button 
                onClick={() => {
                  updateExpense(editingExpenseId!, pendingEditData);
                  setShowInstallmentPrompt(false);
                  setIsModalOpen(false);
                }}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase"
              >
                Só a Atual
              </button>
              <button 
                onClick={() => setShowInstallmentPrompt(false)}
                className="w-full py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERDUE EXPENSES MODAL */}
      {showOverdueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-red-50/50 dark:bg-red-950/20 rounded-t-2xl">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle size={22} className="text-red-600 animate-pulse" />
                Despesas Vencidas ({globalOverdueExpenses.length})
              </h3>
              <button onClick={() => setShowOverdueModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Estas contas estão com a data de vencimento ultrapassada e não foram quitadas. Você pode dar baixa rápida em cada uma abaixo.
              </p>
              
              {globalOverdueExpenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle size={44} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-base text-emerald-600">Tudo em dia!</p>
                  <p className="text-xs">Nenhuma conta vencida no momento.</p>
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
                  {globalOverdueExpenses.map(exp => {
                    const dueFormatted = exp.dueDate ? exp.dueDate.split('-').reverse().join('/') : 'N/A';
                    return (
                      <div key={exp.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{exp.description}</span>
                            {exp.creditor && (
                              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-semibold border border-gray-200 dark:border-gray-700">
                                {exp.creditor}
                              </span>
                            )}
                            <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-bold uppercase">
                              {exp.category}
                            </span>
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                            Venceu em: {dueFormatted}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                          <span className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                            R$ {Number(exp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => togglePaid(exp)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <CheckCircle size={14} />
                            <span>Pagar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setShowOverdueModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4ª MELHORIA: TELA DE RELATÓRIO COMPLETO */}
      {showReportModal && (
        <ExpensesReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          expenses={displayedExpenses}
          categories={categories || []}
          storeName={storeInfo?.name || 'Minha Loja'}
          filtersSummary={filtersSummaryList}
          onExportPDF={() => {
            exportExpensesReport({
              storeName: storeInfo?.name || 'Minha Loja',
              expenses: displayedExpenses,
              categories: categories || [],
              filtersSummary: filtersSummaryList,
              title: 'Relatório Completo de Contas a Pagar'
            });
          }}
        />
      )}
    </div>
  );
};

export default Expenses;
