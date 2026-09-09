import React from 'react';
import { X, Printer, FileDown, CheckCircle, Clock, AlertTriangle, Building2, Calendar, Tag } from 'lucide-react';
import { Expense, Category } from '../types';

interface ExpensesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  categories: Category[];
  storeName: string;
  filtersSummary: string[];
  onExportPDF: () => void;
}

export const ExpensesReportModal: React.FC<ExpensesReportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  categories,
  storeName,
  filtersSummary,
  onExportPDF
}) => {
  if (!isOpen) return null;

  const now = new Date();
  todayReset: {
    now.setHours(0, 0, 0, 0);
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getCatName = (catIdOrName: string) => {
    const found = categories.find(c => c.id === catIdOrName || c.name === catIdOrName);
    return found ? found.name : (catIdOrName || 'Geral');
  };

  const getStatus = (exp: Expense) => {
    if (exp.paid) return { label: 'Paga', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
    if (!exp.dueDate) return { label: 'S/ Data', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700' };

    const due = new Date(exp.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Vencida', color: 'text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800' };
    if (diffDays <= 1) return { label: 'Vence <=24h', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
    return { label: 'A vencer', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
  };

  const totalValue = expenses.reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  const totalPaid = expenses.filter(e => e.paid).reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  
  let totalDueSoonOrFuture = 0;
  let totalOverdue = 0;

  expenses.forEach(e => {
    if (e.paid) return;
    if (!e.dueDate) {
      totalDueSoonOrFuture += Number(e.value) || 0;
      return;
    }
    const due = new Date(e.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) {
      totalOverdue += Number(e.value) || 0;
    } else {
      totalDueSoonOrFuture += Number(e.value) || 0;
    }
  });

  // Category Subtotals
  const catMap: Record<string, { count: number; total: number; paid: number; pending: number }> = {};
  expenses.forEach(exp => {
    const catName = getCatName(exp.category);
    if (!catMap[catName]) {
      catMap[catName] = { count: 0, total: 0, paid: 0, pending: 0 };
    }
    const val = Number(exp.value) || 0;
    catMap[catName].count++;
    catMap[catName].total += val;
    if (exp.paid) {
      catMap[catName].paid += val;
    } else {
      catMap[catName].pending += val;
    }
  });

  const categorySubtotals = Object.entries(catMap).sort((a, b) => b[1].total - a[1].total);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      {/* Printable Container */}
      <div 
        id="printable-expense-report"
        className="bg-white dark:bg-gray-900 w-full max-w-6xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fade-in"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/70 dark:bg-gray-950/40 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-red/10 text-brand-red border border-brand-red/20">
                Contas a Pagar
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {storeName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Relatório Completo de Despesas e Contas a Pagar
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {expenses.length} lançamentos encontrados
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={onExportPDF}
              className="px-3 py-2 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Baixar Relatório em PDF"
            >
              <FileDown size={15} />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-gray-200 dark:border-gray-700"
              title="Imprimir relatório em folha A4"
            >
              <Printer size={15} />
              <span>Imprimir A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Filters Applied Banner */}
          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag size={13} /> Filtros Aplicados Neste Relatório:
            </h4>
            <div className="flex flex-wrap gap-2">
              {filtersSummary.map((f, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium shadow-xs"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3.5 sm:p-4 rounded-xl shadow-xs">
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">Total Geral</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalValue)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{expenses.length} despesas</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3.5 sm:p-4 rounded-xl shadow-xs">
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase flex items-center gap-1">
                <CheckCircle size={13} /> Total Pago
              </p>
              <p className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                {expenses.filter(e => e.paid).length} pagas
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 sm:p-4 rounded-xl shadow-xs">
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase flex items-center gap-1">
                <Clock size={13} /> Total A Vencer
              </p>
              <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-200 mt-1">
                {formatCurrency(totalDueSoonOrFuture)}
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">Pendentes no prazo</p>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 p-3.5 sm:p-4 rounded-xl shadow-xs">
              <p className="text-[11px] font-bold text-red-800 dark:text-red-400 uppercase flex items-center gap-1">
                <AlertTriangle size={13} /> Total Vencido
              </p>
              <p className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-200 mt-1">
                {formatCurrency(totalOverdue)}
              </p>
              <p className="text-[10px] text-red-700 dark:text-red-400 mt-0.5">Necessita regularização</p>
            </div>
          </div>

          {/* Full Detailed Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Detalhamento dos Lançamentos ({expenses.length})
              </h3>
              <span className="text-xs text-gray-500 font-mono">
                Subtotal: <strong>{formatCurrency(totalValue)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100/70 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 uppercase font-bold border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2.5 text-center w-8">#</th>
                    <th className="px-3 py-2.5">Descrição</th>
                    <th className="px-3 py-2.5">Credor / Origem</th>
                    <th className="px-3 py-2.5">Categoria</th>
                    <th className="px-3 py-2.5 text-center">Vencimento</th>
                    <th className="px-3 py-2.5 text-center">Parcela</th>
                    <th className="px-3 py-2.5 text-right font-mono">Valor (R$)</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500 text-sm">
                        Nenhuma despesa encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp, idx) => {
                      const st = getStatus(exp);
                      const dueFormatted = exp.dueDate ? exp.dueDate.split('-').reverse().join('/') : '-';
                      return (
                        <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                          <td className="px-3 py-2 text-center text-gray-400 text-[11px]">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-gray-900 dark:text-white">
                            {exp.description}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                            {exp.creditor ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                <Building2 size={11} className="text-gray-400" />
                                {exp.creditor}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                            {getCatName(exp.category)}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-gray-600 dark:text-gray-300">
                            {dueFormatted}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {exp.installment ? (
                              <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200 dark:border-blue-800">
                                {exp.installment.current}/{exp.installment.total}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-gray-900 dark:text-white">
                            {formatCurrency(Number(exp.value) || 0)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${st.color}`}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-950 font-bold border-t-2 border-gray-200 dark:border-gray-800">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 uppercase text-[11px]">
                      Total Geral:
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-gray-950 dark:text-white">
                      {formatCurrency(totalValue)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Subtotals by Category Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Tag size={14} className="text-brand-red" /> Subtotais por Categoria Financeira
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100/70 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 uppercase font-bold border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-2.5">Categoria</th>
                    <th className="px-3 py-2.5 text-center">Qtd. Lançamentos</th>
                    <th className="px-4 py-2.5 text-right font-mono">Total (R$)</th>
                    <th className="px-4 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">Total Pago</th>
                    <th className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">A Pagar</th>
                    <th className="px-3 py-2.5 text-center font-mono">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {categorySubtotals.map(([catName, stats]) => {
                    const pct = totalValue > 0 ? (stats.total / totalValue) * 100 : 0;
                    return (
                      <tr key={catName} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                        <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                          {catName}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-400">
                          {stats.count}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                          {formatCurrency(stats.total)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(stats.paid)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                          {formatCurrency(stats.pending)}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-gray-600 dark:text-gray-300">
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/80 dark:bg-gray-950/40 no-print">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {expenses.length} lançamentos contabilizados
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs transition"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
