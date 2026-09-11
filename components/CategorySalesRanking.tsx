import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  Trash2, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Layers, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { CategoryRankingItem, RealtimeMonthMetrics, BrendiOrder } from '../types';
import { exportCategoryRankingReport, formatCurrency, formatPct } from '../utils/pdfExport';

interface CategorySalesRankingProps {
  selectedMonth?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const CategorySalesRanking: React.FC<CategorySalesRankingProps> = ({
  selectedMonth,
  onNavigateToTab
}) => {
  const { 
    storeInfo, 
    menuCategories, 
    getRealtimeMonthMetrics, 
    getCategoryRanking, 
    brendiOrders,
    isBrendiSyncing
  } = useApp();

  const currentMonthKey = selectedMonth || new Date().toISOString().slice(0, 7);
  const [activeMonth, setActiveMonth] = useState<string>(currentMonthKey);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'continue' | 'save_margin' | 'potential' | 'remove'>('all');
  const [sortBy, setSortBy] = useState<'qty' | 'profit' | 'revenue' | 'cmv'>('qty');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDreModal, setShowDreModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [compareMonthA, setCompareMonthA] = useState<string>(currentMonthKey);
  const [compareMonthB, setCompareMonthB] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });

  // Calculate real-time metrics and items
  const metrics: RealtimeMonthMetrics = useMemo(() => {
    return getRealtimeMonthMetrics(activeMonth);
  }, [getRealtimeMonthMetrics, activeMonth]);

  const allItems: CategoryRankingItem[] = useMemo(() => {
    return getCategoryRanking(activeMonth);
  }, [getCategoryRanking, activeMonth]);

  // Extract unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach(it => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [allItems]);

  // Key Decision Champions
  const keyHighlights = useMemo(() => {
    if (allItems.length === 0) return null;

    const mostSold = [...allItems].sort((a, b) => b.totalQty - a.totalQty)[0];
    const mostProfitable = [...allItems].sort((a, b) => b.netProfit - a.netProfit)[0];
    const saveMargin = allItems.find(i => i.decision === 'save_margin');
    const toRemove = [...allItems].reverse().find(i => i.decision === 'remove');

    return {
      mostSold: mostSold?.totalQty > 0 ? mostSold : null,
      mostProfitable: mostProfitable?.netProfit > 0 ? mostProfitable : null,
      saveMargin: saveMargin || null,
      toRemove: toRemove || null
    };
  }, [allItems]);

  // Filtered and sorted items
  const displayedItems = useMemo(() => {
    return allItems
      .filter(it => {
        // Category filter
        if (selectedCategory !== 'all' && it.category !== selectedCategory) return false;
        // Decision filter
        if (selectedFilter !== 'all' && it.decision !== selectedFilter) return false;
        // Search term
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const matchName = it.name.toLowerCase().includes(s);
          const matchCat = it.category.toLowerCase().includes(s);
          if (!matchName && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'qty') return b.totalQty - a.totalQty;
        if (sortBy === 'profit') return b.netProfit - a.netProfit;
        if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'cmv') return b.cmvPercent - a.cmvPercent;
        return 0;
      });
  }, [allItems, selectedCategory, selectedFilter, searchTerm, sortBy]);

  // Export PDF Report
  const handleExportPDF = () => {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const [year, monthNum] = activeMonth.split('-');
    const monthLabel = `${monthNames[parseInt(monthNum, 10) - 1] || activeMonth} / ${year}`;

    exportCategoryRankingReport({
      storeName: storeInfo.name || 'Hamburgueria',
      monthLabel,
      metrics,
      items: displayedItems.length > 0 ? displayedItems : allItems
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Rank Geral',
      'Produto',
      'Categoria',
      'Qtd Vendida',
      'Preço Médio (R$)',
      'Faturamento Total (R$)',
      'CMV Unitário (R$)',
      'CMV (%)',
      'CMV Total (R$)',
      'Lucro Líquido Real (R$)',
      'Margem Líquida (%)',
      'Veredito de Decisão',
      'Recomendação do Xande'
    ];

    const rows = (displayedItems.length > 0 ? displayedItems : allItems).map(it => [
      `#${it.rankOverall}`,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${it.category.replace(/"/g, '""')}"`,
      it.totalQty,
      it.avgPrice.toFixed(2),
      it.totalRevenue.toFixed(2),
      it.unitCmv.toFixed(2),
      it.cmvPercent.toFixed(1) + '%',
      it.totalCmv.toFixed(2),
      it.netProfit.toFixed(2),
      it.netMarginPercent.toFixed(1) + '%',
      `"${it.decision.toUpperCase()}"`,
      `"${it.recommendation.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ranking_Vendas_Lucro_${activeMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Metrics for comparison
  const metricsA = useMemo(() => getRealtimeMonthMetrics(compareMonthA), [getRealtimeMonthMetrics, compareMonthA]);
  const metricsB = useMemo(() => getRealtimeMonthMetrics(compareMonthB), [getRealtimeMonthMetrics, compareMonthB]);

  // Filtered Brendi history orders for search modal
  const filteredHistoryOrders = useMemo(() => {
    if (!historySearch.trim()) return brendiOrders;
    const s = historySearch.toLowerCase();
    return brendiOrders.filter(o => {
      const idMatch = (o.orderId || o.id || '').toLowerCase().includes(s);
      const customerMatch = (o.customerName || '').toLowerCase().includes(s);
      const channelMatch = (o.channel || '').toLowerCase().includes(s);
      const itemsMatch = (o.items || []).some(it => (it.name || '').toLowerCase().includes(s));
      const totalMatch = (o.total || 0).toString().includes(s);
      return idMatch || customerMatch || channelMatch || itemsMatch || totalMatch;
    });
  }, [brendiOrders, historySearch]);

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Top Header & Real-time Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg lg:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="text-brand-yellow h-5 w-5" />
              Ranking de Vendas & Rentabilidade por Categoria
            </h2>
            {metrics.isRealtimeActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Tempo Real Brendi Ativo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Organizado do item que mais vendeu para o que menos vendeu. Acompanhe o lucro real no bolso após descontar CMV dos insumos e custos fixos.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <div className="relative">
            <input 
              type="month"
              value={activeMonth}
              onChange={e => setActiveMonth(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-brand-yellow transition"
            />
          </div>

          {/* DRE Button */}
          <button
            onClick={() => setShowDreModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <DollarSign size={14} className="text-emerald-400" />
            DRE do Lucro Real
          </button>

          {/* History & Comparatives Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Calendar size={14} className="text-blue-400" />
            Histórico & Comparativo
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-brand-yellow hover:bg-yellow-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-brand-yellow/10"
          >
            <FileText size={14} />
            Relatório PDF
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Exportar Planilha Excel / CSV"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Download size={14} />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            title="Imprimir Relatório"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      {/* Real-time Financial Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento do Mês */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Faturamento Real</span>
            <DollarSign size={14} className="text-brand-yellow" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(metrics.revenue)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>{metrics.orderCount} pedidos concluídos</span>
            <span>Ticket: {formatCurrency(metrics.ticketMedio)}</span>
          </div>
        </div>

        {/* Lucro Líquido Real */}
        <div className={`border rounded-xl p-4 relative overflow-hidden ${
          metrics.netProfitReal >= 0 
            ? 'bg-emerald-950/20 border-emerald-500/30' 
            : 'bg-red-950/20 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1">
            <span className={metrics.netProfitReal >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              Lucro Líquido Real (Bolso)
            </span>
            <TrendingUp size={14} className={metrics.netProfitReal >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          </div>
          <div className={`text-2xl font-black ${metrics.netProfitReal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(metrics.netProfitReal)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Margem Líquida Real:</span>
            <span className="font-bold text-white">{formatPct(metrics.profitMargin)}</span>
          </div>
        </div>

        {/* CMV Real dos Insumos */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>CMV dos Insumos</span>
            <ShoppingBag size={14} className="text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(metrics.cmvTotalInsumos)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Peso sobre as Vendas:</span>
            <span className={`font-bold ${metrics.cmvPercentAvg > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatPct(metrics.cmvPercentAvg)}
            </span>
          </div>
        </div>

        {/* Ponto de Equilíbrio */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Ponto de Equilíbrio</span>
            <BarChart3 size={14} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(metrics.breakEvenR$)}
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2">
            {metrics.isBreakEvenReached ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Meta Batida! Lucrando
              </span>
            ) : (
              <span className="text-amber-400 font-bold">
                Faltam {formatCurrency(metrics.gapToBe)}
              </span>
            )}
            <span className="text-slate-400">Fixos: {formatCurrency(metrics.fixedCosts)}</span>
          </div>
        </div>
      </div>

      {/* 4 Decision Highlights / Recommendations */}
      {keyHighlights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Top Campeão */}
          {keyHighlights.mostSold && (
            <div className="bg-slate-950/80 border border-brand-yellow/30 rounded-xl p-3.5 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-brand-yellow tracking-wider flex items-center gap-1">
                  <Trophy size={12} /> Campeão de Vendas
                </span>
                <span className="text-xs font-black text-white">#{keyHighlights.mostSold.rankOverall}</span>
              </div>
              <div className="font-bold text-sm text-white truncate" title={keyHighlights.mostSold.name}>
                {keyHighlights.mostSold.name}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{keyHighlights.mostSold.totalQty} unidades</span>
                <span className="font-bold text-emerald-400">{formatCurrency(keyHighlights.mostSold.totalRevenue)}</span>
              </div>
            </div>
          )}

          {/* Maior Lucro Líquido */}
          {keyHighlights.mostProfitable && (
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                  <TrendingUp size={12} /> Mais Lucrativo (R$)
                </span>
                <span className="text-xs font-black text-emerald-400">{formatPct(keyHighlights.mostProfitable.netMarginPercent)}</span>
              </div>
              <div className="font-bold text-sm text-white truncate" title={keyHighlights.mostProfitable.name}>
                {keyHighlights.mostProfitable.name}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Lucro no Bolso:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(keyHighlights.mostProfitable.netProfit)}</span>
              </div>
            </div>
          )}

          {/* Salva-Margem */}
          {keyHighlights.saveMargin && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                  <AlertTriangle size={12} /> Alerta Salva-Margem
                </span>
                <span className="text-[10px] font-bold text-amber-300">CMV {formatPct(keyHighlights.saveMargin.cmvPercent)}</span>
              </div>
              <div className="font-bold text-sm text-white truncate" title={keyHighlights.saveMargin.name}>
                {keyHighlights.saveMargin.name}
              </div>
              <div className="text-[11px] text-amber-300/80">
                Vende muito mas margem está baixa. Vincule a produto turbinado!
              </div>
            </div>
          )}

          {/* Candidato a Retirada */}
          {keyHighlights.toRemove && (
            <div className="bg-slate-950/80 border border-red-500/30 rounded-xl p-3.5 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
                  <Trash2 size={12} /> Candidato a Retirada
                </span>
                <span className="text-[10px] font-bold text-red-300">{keyHighlights.toRemove.totalQty} un.</span>
              </div>
              <div className="font-bold text-sm text-white truncate" title={keyHighlights.toRemove.name}>
                {keyHighlights.toRemove.name}
              </div>
              <div className="text-[11px] text-red-300/80">
                Baixa saída e baixo retorno. Avalie reformular ou retirar.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs & Quick Decision Filters */}
      <div className="space-y-3 pt-2">
        {/* Category horizontal scrolling bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-brand-yellow text-slate-950 shadow-md shadow-brand-yellow/10'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas as Categorias ({allItems.length})
          </button>

          {categoriesList.map(cat => {
            const count = allItems.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-brand-yellow text-slate-950 shadow-md shadow-brand-yellow/10'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Decision Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Decision verdict pill filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedFilter('continue')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                selectedFilter === 'continue'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              🟢 Vale a Pena Continuar
            </button>
            <button
              onClick={() => setSelectedFilter('save_margin')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                selectedFilter === 'save_margin'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              🟡 Salva-Margem (Alerta)
            </button>
            <button
              onClick={() => setSelectedFilter('potential')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                selectedFilter === 'potential'
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              🔵 Potencial / Divulgar
            </button>
            <button
              onClick={() => setSelectedFilter('remove')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                selectedFilter === 'remove'
                  ? 'bg-red-500 text-white'
                  : 'text-red-400 hover:bg-red-500/10'
              }`}
            >
              🔴 O Que Devo Tirar
            </button>
          </div>

          {/* Search Input & Sort Options */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-brand-yellow transition"
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand-yellow transition cursor-pointer"
            >
              <option value="qty">Mais Vendidos (Qtd)</option>
              <option value="profit">Maior Lucro (R$)</option>
              <option value="revenue">Maior Faturamento</option>
              <option value="cmv">Maior CMV %</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ranking Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3 w-12 text-center">Rank</th>
              <th className="py-3 px-4">Produto / Categoria</th>
              <th className="py-3 px-3 text-center">Qtd Vendida</th>
              <th className="py-3 px-4 text-right">Faturamento Total</th>
              <th className="py-3 px-4 text-center">CMV Insumos</th>
              <th className="py-3 px-4 text-right">Lucro Líquido Real</th>
              <th className="py-3 px-3 text-center">Margem</th>
              <th className="py-3 px-4">Diagnóstico do Xande</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="space-y-2">
                    <p className="font-bold text-sm text-slate-400">Nenhum produto encontrado neste filtro.</p>
                    <p className="text-xs">Tente ajustar a categoria ou o termo de busca.</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedItems.map((item, index) => {
                const isTop3 = item.rankOverall <= 3;
                const medal = item.rankOverall === 1 ? '🥇' : item.rankOverall === 2 ? '🥈' : item.rankOverall === 3 ? '🥉' : null;

                return (
                  <tr 
                    key={item.id + '_' + index}
                    className="hover:bg-slate-900/60 transition group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 text-center font-black">
                      {medal ? (
                        <span className="text-base" title={`#${item.rankOverall}`}>{medal}</span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">#{item.rankOverall}</span>
                      )}
                    </td>

                    {/* Product Name & Category */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white group-hover:text-brand-yellow transition flex items-center gap-1.5">
                        {item.name}
                        {item.hasFichaTecnica ? (
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold" title="Ficha Técnica Cadastrada">
                            Ficha OK
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded font-medium" title="CMV estimado pela média">
                            Estimado
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>Preço Médio: {formatCurrency(item.avgPrice)}</span>
                      </div>
                    </td>

                    {/* Qtd Vendida */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-black text-white text-sm bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        {item.totalQty}
                      </span>
                    </td>

                    {/* Faturamento Total */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                      {formatCurrency(item.totalRevenue)}
                    </td>

                    {/* CMV Insumos */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-bold text-white">
                        {formatCurrency(item.unitCmv)} <span className="text-[10px] text-slate-400 font-normal">/un</span>
                      </div>
                      <div className={`text-[10px] font-bold ${
                        item.cmvPercent <= 35 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {formatPct(item.cmvPercent)} do preço
                      </div>
                    </td>

                    {/* Lucro Líquido Real */}
                    <td className="py-3.5 px-4 text-right">
                      <div className={`font-black text-sm ${
                        item.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(item.netProfit)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Após CMV e CFI
                      </div>
                    </td>

                    {/* Margem Líquida % */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        item.netMarginPercent >= 20
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : item.netMarginPercent >= 10
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {formatPct(item.netMarginPercent)}
                      </span>
                    </td>

                    {/* Veredito e Conselho */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.decision === 'continue' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            🟢 Vale Continuar
                          </span>
                        )}
                        {item.decision === 'save_margin' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            🟡 Salva-Margem
                          </span>
                        )}
                        {item.decision === 'potential' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            🔵 Divulgar / Potencial
                          </span>
                        )}
                        {item.decision === 'remove' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                            🔴 Avaliar Retirada
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {item.recommendation}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal DRE - Cálculo Transparente do Lucro em R$ */}
      {showDreModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <DollarSign className="text-emerald-400" size={20} />
                  DRE Simples: Composição do Lucro Real
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Demonstração transparente dos números do mês de {activeMonth}.
                </p>
              </div>
              <button
                onClick={() => setShowDreModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* (+) Faturamento Bruto */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-white text-sm">(+) Faturamento Total do Mês</div>
                  <div className="text-[11px] text-slate-400">Total bruto vendido (Brendi e balcão)</div>
                </div>
                <div className="text-sm font-black text-white">
                  {formatCurrency(metrics.revenue)}
                </div>
              </div>

              {/* (-) CMV dos Insumos */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-red-400 text-sm">(-) CMV dos Insumos Vendidos</div>
                  <div className="text-[11px] text-slate-400">
                    Custo real dos ingredientes ({formatPct(metrics.cmvPercentAvg)} da venda)
                  </div>
                </div>
                <div className="text-sm font-black text-red-400">
                  - {formatCurrency(metrics.cmvTotalInsumos)}
                </div>
              </div>

              {/* (=) Margem de Contribuição Bruta */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div>
                  <div className="font-bold text-slate-200 text-sm">(=) Margem de Contribuição Bruta</div>
                  <div className="text-[11px] text-slate-400">Sobra após pagar a comida</div>
                </div>
                <div className="text-sm font-black text-slate-200">
                  {formatCurrency(metrics.revenue - metrics.cmvTotalInsumos)}
                </div>
              </div>

              {/* (-) Custos Fixos / CFI */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-amber-400 text-sm">(-) Custos Fixos & CFI da Loja</div>
                  <div className="text-[11px] text-slate-400">Aluguel, equipe, energia, taxas e despesas fixas</div>
                </div>
                <div className="text-sm font-black text-amber-400">
                  - {formatCurrency(metrics.fixedCosts)}
                </div>
              </div>

              {/* (=) Lucro Líquido Real Final */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${
                metrics.netProfitReal >= 0 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' 
                  : 'bg-red-950/30 border-red-500/40 text-red-400'
              }`}>
                <div>
                  <div className="font-black text-base">(=) LUCRO LÍQUIDO REAL NO BOLSO</div>
                  <div className="text-xs text-slate-300">
                    Margem Líquida Real: {formatPct(metrics.profitMargin)}
                  </div>
                </div>
                <div className="text-xl font-black">
                  {formatCurrency(metrics.netProfitReal)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400">
              <span className="font-bold text-brand-yellow">Dica do Xande:</span> O lucro real considera cada grama de insumo vendida na ficha técnica e desconta os custos fixos da sua operação. Bater o ponto de equilíbrio nos primeiros 10 dias garante que o restante do mês seja de lucro puro!
            </div>

            <button
              onClick={() => setShowDreModal(false)}
              className="w-full py-3 bg-brand-yellow hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition"
            >
              Fechar Detalhamento
            </button>
          </div>
        </div>
      )}

      {/* Modal Histórico Permanente & Comparativos */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden font-sans max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="text-blue-400" size={20} />
                  Histórico Permanente & Comparativo de Vendas Brendi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tudo que você vende na Brendi fica salvo permanentemente no banco para pesquisas e comparações.
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-Tabs: Comparativo vs Pesquisa */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              
              {/* Comparador de Meses */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpDown size={14} className="text-brand-yellow" />
                  Comparador Direto de Meses
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Mês Base (A):</label>
                    <input 
                      type="month"
                      value={compareMonthA}
                      onChange={e => setCompareMonthA(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Mês Comparativo (B):</label>
                    <input 
                      type="month"
                      value={compareMonthB}
                      onChange={e => setCompareMonthB(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {/* Faturamento */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Faturamento</div>
                    <div className="font-bold text-white">{formatCurrency(metricsA.revenue)} <span className="text-[10px] text-slate-500 font-normal">({compareMonthA})</span></div>
                    <div className="font-bold text-slate-300">{formatCurrency(metricsB.revenue)} <span className="text-[10px] text-slate-500 font-normal">({compareMonthB})</span></div>
                    <div className={`text-[11px] font-bold pt-1 ${
                      metricsA.revenue >= metricsB.revenue ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {metricsA.revenue >= metricsB.revenue ? '▲ +' : '▼ '}
                      {formatCurrency(metricsA.revenue - metricsB.revenue)}
                    </div>
                  </div>

                  {/* Pedidos & Ticket */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Pedidos / Ticket</div>
                    <div className="font-bold text-white">{metricsA.orderCount} ped. • {formatCurrency(metricsA.ticketMedio)}</div>
                    <div className="font-bold text-slate-300">{metricsB.orderCount} ped. • {formatCurrency(metricsB.ticketMedio)}</div>
                    <div className="text-[11px] font-bold text-slate-400 pt-1">
                      Dif: {metricsA.orderCount - metricsB.orderCount} pedidos
                    </div>
                  </div>

                  {/* Lucro Real */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Lucro Líquido Real</div>
                    <div className="font-bold text-emerald-400">{formatCurrency(metricsA.netProfitReal)}</div>
                    <div className="font-bold text-slate-300">{formatCurrency(metricsB.netProfitReal)}</div>
                    <div className={`text-[11px] font-bold pt-1 ${
                      metricsA.netProfitReal >= metricsB.netProfitReal ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {metricsA.netProfitReal >= metricsB.netProfitReal ? '▲ +' : '▼ '}
                      {formatCurrency(metricsA.netProfitReal - metricsB.netProfitReal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico Permanente de Pedidos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag size={14} className="text-emerald-400" />
                    Pedidos Salvos no Sistema ({brendiOrders.length} registrados)
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      placeholder="Pesquisar pedido, cliente..."
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase">
                        <th className="py-2.5 px-3">Data / Hora</th>
                        <th className="py-2.5 px-3">ID Pedido</th>
                        <th className="py-2.5 px-3">Canal</th>
                        <th className="py-2.5 px-3">Itens</th>
                        <th className="py-2.5 px-3 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredHistoryOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            Nenhum pedido encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredHistoryOrders.slice(0, 50).map(o => (
                          <tr key={o.id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                              {new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">
                              {o.orderId?.slice(0, 8)}...
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                {o.channel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                              {(o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Sem itens'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-white">
                              {formatCurrency(o.total || 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Voltar ao Ranking
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
