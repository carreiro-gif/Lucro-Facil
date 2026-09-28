import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, Calendar, AlertTriangle, X, ChevronLeft, ChevronRight, 
  Trash2, Search, Filter, Layers, DollarSign, Percent, TrendingDown,
  Info, CheckCircle, RefreshCw, EyeOff, Edit2, ArrowDownRight, Tag, HelpCircle
} from 'lucide-react';
import { VariableCost, VariableCostCategory, VariableCostSource, VariableCostStatus } from '../types';
import { formatPercent } from '../constants';

const CATEGORY_LABELS: Record<VariableCostCategory, { label: string; description: string; color: string }> = {
  CMV: { label: 'CMV', description: 'Custo da Mercadoria Vendida (Insumos/Ingredientes)', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  EMBALAGEM: { label: 'Embalagem', description: 'Descartáveis, sacolas, potes e embalagens de entrega', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  FRETE: { label: 'Frete', description: 'Frete de insumos ou entregas terceirizadas da loja', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  CARTAO: { label: 'Cartão', description: 'Taxas percentuais de maquininhas (débito, crédito)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  ROYALTIES: { label: 'Royalties', description: 'Percentuais sobre vendas pagos a franquias ou marcas', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  TAXA_DE_ENTREGA: { label: 'Taxa de Entrega', description: 'Taxas variáveis por entrega pagas a entregadores/motoboys', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  VOUCHER: { label: 'Voucher', description: 'Taxas de cartões de benefício refeição/alimentação', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  MARKETING_PERCENT: { label: '% Marketing', description: 'Investimento em marketing diretamente proporcional a vendas', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  IMPOSTO: { label: 'Imposto', description: 'Impostos sobre faturamento (Simples Nacional / DAS)', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  OUTROS: { label: 'Outros Custos Variáveis', description: 'Qualquer outro custo proporcional à venda', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' }
};

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

export const VariableCosts: React.FC = () => {
  const { 
    variableCosts = [], 
    addVariableCost, 
    updateVariableCost, 
    deleteVariableCost,
    monthlyRevenue = [],
    collaboratorPayments = [],
    importDeliveryFeesFromCollaborators,
    storeInfo
  } = useApp();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentMonthVal = MONTHS[currentMonthIdx].value;

  // Selected period
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthVal);
  const [viewAllPeriods, setViewAllPeriods] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCost, setEditingCost] = useState<VariableCost | null>(null);
  const [showInfoBanner, setShowInfoBanner] = useState<boolean>(true);
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState<string | null>(null);

  // Form input states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'OUTROS' as VariableCostCategory,
    description: '',
    value: '',
    origin: 'Manual' as VariableCostSource,
    notes: ''
  });

  const periodKey = `${selectedYear}-${selectedMonth}`;
  const periodLabel = `${MONTHS.find(m => m.value === selectedMonth)?.label}/${selectedYear}`;

  // Find revenue for this period (SE EXISTIR DADO REAL, USAR O DADO REAL)
  const periodRevenueObj = useMemo(() => {
    return monthlyRevenue.find(r => r.month === periodKey);
  }, [monthlyRevenue, periodKey]);

  const realRevenue = useMemo(() => {
    return Number(periodRevenueObj?.revenue || 0);
  }, [periodRevenueObj]);

  // Filtered variable costs list
  const filteredCosts = useMemo(() => {
    return variableCosts.filter(c => {
      // Period filter
      if (!viewAllPeriods) {
        const costPeriod = c.period || c.date.slice(0, 7);
        if (costPeriod !== periodKey) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

      // Origin filter
      if (originFilter !== 'ALL' && c.origin !== originFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesDesc = c.description.toLowerCase().includes(query);
        const matchesNotes = (c.notes || '').toLowerCase().includes(query);
        const matchesCategory = CATEGORY_LABELS[c.category]?.label.toLowerCase().includes(query);
        const matchesOrigin = c.origin.toLowerCase().includes(query);
        if (!matchesDesc && !matchesNotes && !matchesCategory && !matchesOrigin) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [variableCosts, viewAllPeriods, periodKey, categoryFilter, originFilter, statusFilter, searchQuery]);

  // Financial Metrics of the Period (ACTIVE costs only)
  const activeCostsInPeriod = useMemo(() => {
    return variableCosts.filter(c => {
      const costPeriod = c.period || c.date.slice(0, 7);
      const isPeriodMatch = viewAllPeriods ? true : costPeriod === periodKey;
      return isPeriodMatch && c.status === 'Ativo';
    });
  }, [variableCosts, viewAllPeriods, periodKey]);

  const totalVariableCosts = useMemo(() => {
    return activeCostsInPeriod.reduce((sum, c) => sum + Number(c.value || 0), 0);
  }, [activeCostsInPeriod]);

  // CV% = Total Custos Variáveis Reais / Faturamento Real × 100 (Informativo, não divide por zero)
  const cvPercent = useMemo(() => {
    if (realRevenue <= 0) return 0;
    return (totalVariableCosts / realRevenue) * 100;
  }, [totalVariableCosts, realRevenue]);

  // Cost by Category Summary
  const costByCategory = useMemo(() => {
    const summary: Record<string, { count: number; total: number }> = {};
    activeCostsInPeriod.forEach(c => {
      if (!summary[c.category]) {
        summary[c.category] = { count: 0, total: 0 };
      }
      summary[c.category].count += 1;
      summary[c.category].total += Number(c.value || 0);
    });
    return summary;
  }, [activeCostsInPeriod]);

  // Handle Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCost(null);
    setFormData({
      date: `${selectedYear}-${selectedMonth}-01`,
      category: 'TAXA_DE_ENTREGA',
      description: '',
      value: '',
      origin: 'Manual',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = (cost: VariableCost) => {
    setEditingCost(cost);
    setFormData({
      date: cost.date,
      category: cost.category,
      description: cost.description,
      value: cost.value.toString(),
      origin: cost.origin,
      notes: cost.notes || ''
    });
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveCost = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(formData.value.replace(',', '.'));
    if (isNaN(numValue) || numValue <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }
    if (!formData.description.trim()) {
      alert('Informe uma descrição para o custo variável.');
      return;
    }

    const costPeriod = formData.date.slice(0, 7);

    if (editingCost) {
      // Update
      updateVariableCost(editingCost.id, {
        date: formData.date,
        category: formData.category,
        description: formData.description.trim(),
        value: numValue,
        origin: formData.origin,
        period: costPeriod,
        notes: formData.notes.trim() || undefined
      });
    } else {
      // Create new manual entry
      const newCost: VariableCost = {
        id: 'cv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
        date: formData.date,
        category: formData.category,
        description: formData.description.trim(),
        value: numValue,
        origin: formData.origin,
        mode: 'Manual',
        period: costPeriod,
        status: 'Ativo',
        sourceType: 'manual',
        notes: formData.notes.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      addVariableCost(newCost);
    }

    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDeleteCost = (cost: VariableCost) => {
    if (window.confirm(`Deseja remover o lançamento "${cost.description}" de R$ ${cost.value.toFixed(2).replace('.', ',')}?`)) {
      deleteVariableCost(cost.id);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = (cost: VariableCost) => {
    const newStatus: VariableCostStatus = cost.status === 'Ativo' ? 'Inativo' : 'Ativo';
    updateVariableCost(cost.id, { status: newStatus });
  };

  // Handle Automatic Sync from Collaborators Delivery Fees (Preparação e rastreabilidade)
  const handleSyncDeliveryFees = () => {
    const res = importDeliveryFeesFromCollaborators(periodKey);
    if (res.importedCount > 0) {
      setShowSyncSuccessToast(`Sucesso! ${res.importedCount} taxa(s) de entrega importada(s) automaticamente dos Colaboradores para ${periodLabel}.`);
    } else {
      setShowSyncSuccessToast(`Nenhuma nova taxa de entrega pendente encontrada para o período ${periodLabel} (ou todas já foram importadas sem duplicação).`);
    }
    setTimeout(() => setShowSyncSuccessToast(null), 5000);
  };

  // Navigation helpers
  const handlePrevMonth = () => {
    const idx = MONTHS.findIndex(m => m.value === selectedMonth);
    if (idx === 0) {
      setSelectedMonth(MONTHS[11].value);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(MONTHS[idx - 1].value);
    }
  };

  const handleNextMonth = () => {
    const idx = MONTHS.findIndex(m => m.value === selectedMonth);
    if (idx === 11) {
      setSelectedMonth(MONTHS[0].value);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(MONTHS[idx + 1].value);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in font-sans">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-gray-800/50 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow rounded-xl shadow-inner">
              <TrendingDown size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                Custos Variáveis
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Etapa 1
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lançamento, rastreamento e base dos custos que variam proporcionalmente à venda e operação
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncDeliveryFees}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition shadow-sm"
            title="Importa taxas de entrega pagas aos motoboys/colaboradores sem duplicar registros"
          >
            <RefreshCw size={14} />
            <span>Sincronizar Entregas (Colaboradores)</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-brand-yellow hover:bg-yellow-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition shadow-md shadow-brand-yellow/10 uppercase tracking-wide"
          >
            <Plus size={16} />
            <span>Novo Custo Variável</span>
          </button>
        </div>
      </div>

      {/* Info Notification Toast */}
      {showSyncSuccessToast && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center justify-between text-xs animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <span>{showSyncSuccessToast}</span>
          </div>
          <button onClick={() => setShowSyncSuccessToast(null)} className="p-1 text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Concept Info Card (Explains methodology and rule: real data over estimates) */}
      {showInfoBanner && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-brand-yellow/20 rounded-2xl p-4 md:p-5 relative shadow-xl">
          <button 
            onClick={() => setShowInfoBanner(false)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition"
            title="Fechar aviso"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3.5 pr-8">
            <div className="p-2 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow rounded-xl shrink-0 mt-0.5">
              <Info size={18} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Metodologia Financeira: Segregação Rigorosa de Custos Fixos vs Variáveis
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Este módulo reúne estritamente os custos que dependem da venda direta (CMV, Embalagem, Frete, Cartão, Royalties, Taxa de Entrega, Voucher, Marketing %, Imposto).
                <strong className="text-brand-yellow"> Regra de Ouro:</strong> Se existir dado real no sistema, utilizamos o dado real. O percentual (CV%) exibido abaixo é puramente informativo nesta etapa e não altera a fórmula do Ponto de Equilíbrio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Period Selector & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Month / Year Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              disabled={viewAllPeriods}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"
              title="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-brand-yellow" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                disabled={viewAllPeriods}
                className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-bold text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 outline-none cursor-pointer disabled:opacity-40"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                disabled={viewAllPeriods}
                className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-bold text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 outline-none cursor-pointer disabled:opacity-40"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              disabled={viewAllPeriods}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"
              title="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setViewAllPeriods(!viewAllPeriods)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition ml-2 ${
                viewAllPeriods 
                  ? 'bg-brand-yellow text-slate-950 border-brand-yellow font-black' 
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:text-white'
              }`}
            >
              {viewAllPeriods ? 'Vendo Todos os Períodos' : 'Ver Todos'}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar lançamento..."
                className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-brand-yellow w-44"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-xl outline-none"
            >
              <option value="ALL">Todas Categorias</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, catObj]) => (
                <option key={catKey} value={catKey}>{catObj.label}</option>
              ))}
            </select>

            {/* Origin Filter */}
            <select
              value={originFilter}
              onChange={e => setOriginFilter(e.target.value)}
              className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-xl outline-none"
            >
              <option value="ALL">Todas Origens</option>
              <option value="Manual">Manual</option>
              <option value="Colaboradores">Colaboradores</option>
              <option value="Brendi">Brendi</option>
              <option value="Entrada de Compras">Entrada de Compras</option>
              <option value="Vendas">Vendas</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-xl outline-none"
            >
              <option value="ALL">Todos Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Custos Variáveis */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>Total Custos Variáveis</span>
            <div className="p-1.5 bg-red-500/10 text-red-400 rounded-lg">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            R$ {totalVariableCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {activeCostsInPeriod.length} {activeCostsInPeriod.length === 1 ? 'lançamento ativo' : 'lançamentos ativos'} em {periodLabel}
          </p>
        </div>

        {/* Card 2: Faturamento Real do Período */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>Faturamento do Período</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-500">
            R$ {realRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {periodRevenueObj ? 'Faturamento real registrado na base' : 'Sem faturamento lançado no mês'}
          </p>
        </div>

        {/* Card 3: % de Custos Variáveis (CV%) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>% Custos Variáveis (CV%)</span>
            <div className="p-1.5 bg-brand-yellow/10 text-brand-yellow rounded-lg">
              <Percent size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-brand-yellow">
            {formatPercent(cvPercent)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Informativo</span>
            <span>CV% = (Custos / Fat.) × 100</span>
          </div>
        </div>

        {/* Card 4: Quantidade de Lançamentos */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>Total de Lançamentos</span>
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Layers size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {filteredCosts.length}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {filteredCosts.filter(c => c.mode === 'Automático').length} automáticos | {filteredCosts.filter(c => c.mode === 'Manual').length} manuais
          </p>
        </div>
      </div>

      {/* Category Distribution Pills */}
      {Object.keys(costByCategory).length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Tag size={13} />
            <span>Distribuição dos Custos Variáveis por Categoria no Período</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(costByCategory).map(([catKey, data]) => {
              const catConfig = CATEGORY_LABELS[catKey as VariableCostCategory] || CATEGORY_LABELS.OUTROS;
              const pctOfTotal = totalVariableCosts > 0 ? (data.total / totalVariableCosts) * 100 : 0;
              return (
                <div 
                  key={catKey}
                  className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-3 text-xs"
                >
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${catConfig.color}`}>
                    {catConfig.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-gray-900 dark:text-white">
                      R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({formatPercent(pctOfTotal)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table of Variable Costs */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-brand-yellow" />
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Lançamentos de Custos Variáveis {viewAllPeriods ? '(Todos os Períodos)' : `(${periodLabel})`}
            </h2>
          </div>
          <span className="text-xs text-gray-400">
            {filteredCosts.length} registro(s) listado(s)
          </span>
        </div>

        {filteredCosts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
              <TrendingDown size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Nenhum custo variável registrado para este período
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Você pode adicionar um custo variável manualmente ou clicar em "Sincronizar Entregas" para importar automaticamente as taxas dos motoboys pagas na aba de Colaboradores.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleSyncDeliveryFees}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 transition"
              >
                Sincronizar Entregas
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="bg-brand-yellow hover:bg-yellow-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition"
              >
                Adicionar Manualmente
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-black border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 text-right">Valor (R$)</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Modo</th>
                  <th className="py-3 px-4">Período</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-medium">
                {filteredCosts.map(cost => {
                  const catConfig = CATEGORY_LABELS[cost.category] || CATEGORY_LABELS.OUTROS;
                  const [y, m, d] = cost.date.split('-');
                  const formattedDate = `${d}/${m}/${y}`;

                  return (
                    <tr 
                      key={cost.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        cost.status === 'Inativo' ? 'opacity-40' : ''
                      }`}
                    >
                      {/* Data */}
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${catConfig.color}`}>
                          {catConfig.label}
                        </span>
                      </td>

                      {/* Descrição */}
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-bold">
                        <div className="flex flex-col">
                          <span>{cost.description}</span>
                          {cost.notes && (
                            <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                              {cost.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-black whitespace-nowrap font-mono">
                        R$ {Number(cost.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Origem */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded text-[10px] font-bold">
                          {cost.origin}
                        </span>
                      </td>

                      {/* Modo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold ${
                          cost.mode === 'Automático' ? 'text-cyan-400' : 'text-slate-400'
                        }`}>
                          {cost.mode}
                        </span>
                      </td>

                      {/* Período */}
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-[11px] whitespace-nowrap font-mono">
                        {cost.period}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(cost)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                            cost.status === 'Ativo'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:bg-slate-700'
                          }`}
                          title="Clique para alternar status Ativo / Inativo"
                        >
                          {cost.status}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(cost)}
                            className="p-1.5 text-gray-400 hover:text-brand-yellow hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Editar lançamento"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteCost(cost)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Excluir lançamento"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Variable Cost */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up font-sans">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-yellow/10 text-brand-yellow rounded-lg">
                  <TrendingDown size={18} />
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {editingCost ? 'Editar Custo Variável' : 'Novo Custo Variável'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCost} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Data */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Data do Custo *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-yellow"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as VariableCostCategory })}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-yellow"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catObj]) => (
                      <option key={catKey} value={catKey}>{catObj.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Descrição do Custo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Taxas Tayan Motoboy, Desconto Brendi, Embalagens Hambúrguer"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-yellow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Valor */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-mono font-bold outline-none focus:border-brand-yellow"
                  />
                </div>

                {/* Origem */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Origem
                  </label>
                  <select
                    value={formData.origin}
                    onChange={e => setFormData({ ...formData, origin: e.target.value as VariableCostSource })}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-yellow"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Colaboradores">Colaboradores</option>
                    <option value="Brendi">Brendi</option>
                    <option value="Entrada de Compras">Entrada de Compras</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais para rastreabilidade..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-yellow resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:text-white transition text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-yellow hover:bg-yellow-400 text-slate-950 transition rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-yellow/10"
                >
                  {editingCost ? 'Salvar Alterações' : 'Adicionar Custo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
