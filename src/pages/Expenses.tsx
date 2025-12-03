import React, { useState, useMemo } from 'react';
import { useApp } from "../../context/AppContext";
import { Plus, Settings, Calendar, Edit2, AlertTriangle, X, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { Expense } from '../types';

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

const Expenses: React.FC = () => {
  const { 
    expenses, 
    monthlyRevenue, 
    categories, 
    addExpenseWithInstallments, 
    updateExpense, 
    fixedCostMode, 
    setFixedCostMode,
  } = useApp();

  // Get current date for defaults
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-11
  const todayStr = now.toISOString().split('T')[0];

  // View States
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(MONTHS[currentMonthIdx].value);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Form States
  const [formMonthStr, setFormMonthStr] = useState(`${currentYear}-${MONTHS[currentMonthIdx].value}`);
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [cat, setCat] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [installments, setInstallments] = useState(1);

  // Computed Key
  const selectedMonthKey = `${viewYear}-${viewMonth}`;

  // Filter Expenses for the LEFT list (Specific Month)
  const currentExpenses = useMemo(() => 
    expenses.filter(e => e.month === selectedMonthKey),
  [expenses, selectedMonthKey]);

  // Calculate Average Cost based on Last 12 Months rule
  const last12MonthsMetrics = useMemo(() => {
    // 1. Get all unique months present in data
    const allMonths = Array.from(new Set([
      ...expenses.map(e => e.month), 
      ...monthlyRevenue.filter(r => r.revenue > 0).map(r => r.month)
    ])).sort();
    
    // 2. Slice last 12
    const last12 = allMonths.slice(-12);
    
    // 3. Calculate Sums
    let totalCost = 0;
    let totalRev = 0;
    let monthsCount = 0;

    last12.forEach(m => {
      const exp = expenses.filter(e => e.month === m).reduce((s, e) => s + e.value, 0);
      const rev = monthlyRevenue.find(r => r.month === m)?.revenue || 0;
      
      // If we have data for this month (either revenue or expense), count it
      if (exp > 0 || rev > 0) {
        totalCost += exp;
        if(rev > 0) {
            totalRev += rev;
        }
        monthsCount++;
      }
    });

    const avgCost = monthsCount > 0 ? totalCost / monthsCount : 0;
    const avgPct = totalRev > 0 ? (totalCost / totalRev) * 100 : 0;

    return { avgCost, avgPct, monthsCount };
  }, [expenses, monthlyRevenue]);

  // Summary Table Data (For the selected YEAR)
  const summaryData = useMemo(() => {
    return MONTHS.map(m => {
      const monthKey = `${viewYear}-${m.value}`;
      const monthExpenses = expenses.filter(e => e.month === monthKey);
      const totalCost = monthExpenses.reduce((sum, e) => sum + e.value, 0);
      const revenueObj = monthlyRevenue.find(r => r.month === monthKey);
      const revenue = revenueObj ? revenueObj.revenue : 0;
      
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

  // Values for the Warning Box
  const activeMonthData = summaryData.find(d => d.monthKey === selectedMonthKey);
  
  const displayFixedCostValue = fixedCostMode === 'AVERAGE' 
    ? last12MonthsMetrics.avgCost 
    : (activeMonthData?.totalCost || 0);

  const displayFixedCostPercent = fixedCostMode === 'AVERAGE'
    ? last12MonthsMetrics.avgPct
    : (activeMonthData?.percentage || 0);

  // Status Logic Helper
  const getStatus = (expense: Expense) => {
    if (expense.paid) return { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle, label: 'Paga' };
    
    if (!expense.dueDate) return { color: 'bg-gray-800 text-gray-500 border-gray-700', icon: Clock, label: 'S/ Data' };

    const due = new Date(expense.dueDate + 'T00:00:00'); // Normalize to midnight
    const today = new Date();
    today.setHours(0,0,0,0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertTriangle, label: 'Vencida' };
    if (diffDays <= 1) return { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock, label: 'Vence <=24h' };
    
    return { color: 'bg-gray-800 text-gray-400 border-gray-700', icon: Clock, label: 'A vencer' };
  };

  const togglePaid = (exp: Expense) => {
      updateExpense(exp.id, { paid: !exp.paid });
  };


  // -- Handlers --

  const handleYearChange = (delta: number) => {
    setViewYear(prev => prev + delta);
  };

  const openNewExpenseModal = () => {
    setEditingExpenseId(null);
    setFormMonthStr(selectedMonthKey);
    setDesc('');
    setVal('');
    setCat(categories[0]?.name || '');
    setDueDate('');
    setIsPaid(false);
    setInstallments(1);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setFormMonthStr(exp.month);
    setDesc(exp.description);
    setVal(exp.value.toString());
    setCat(exp.category);
    setDueDate(exp.dueDate || '');
    setIsPaid(!!exp.paid);
    setInstallments(1); 
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !val || !cat) return;

    if (editingExpenseId) {
      updateExpense(editingExpenseId, {
        description: desc,
        value: parseFloat(val),
        category: cat,
        month: formMonthStr,
        dueDate: dueDate,
        paid: isPaid
      });
    } else {
      addExpenseWithInstallments({
        month: formMonthStr,
        description: desc,
        value: parseFloat(val),
        category: cat,
        dueDate: dueDate,
        paid: isPaid
      }, installments);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
       
       {/* Top Controls */}
       <div className="bg-brand-dark/50 border-b border-gray-800 pb-6 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
         <div>
            <h2 className="text-3xl font-bold text-white uppercase tracking-wide">Despesas Fixas</h2>
            <p className="text-gray-400 text-sm mt-1">Gerencie seus custos mensais e acompanhe a média anual.</p>
         </div>
         
         <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-900 p-3 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2">
                <button onClick={() => handleYearChange(-1)} className="p-1 hover:bg-gray-800 rounded text-gray-400"><ChevronLeft size={20}/></button>
                <span className="text-xl font-bold text-white w-16 text-center">{viewYear}</span>
                <button onClick={() => handleYearChange(1)} className="p-1 hover:bg-gray-800 rounded text-gray-400"><ChevronRight size={20}/></button>
            </div>
            
            <div className="h-8 w-px bg-gray-700 hidden sm:block"></div>

            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Modo de Cálculo:</span>
                <div className="flex bg-gray-800 rounded p-1">
                    <button 
                    onClick={() => setFixedCostMode('AVERAGE')}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition ${fixedCostMode === 'AVERAGE' ? 'bg-brand-red text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                    MÉDIA (12 Meses)
                    </button>
                    <button 
                    onClick={() => setFixedCostMode('CURRENT_MONTH')}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition ${fixedCostMode === 'CURRENT_MONTH' ? 'bg-brand-red text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                    MÊS ATUAL
                    </button>
                </div>
            </div>
         </div>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         
         {/* LEFT COLUMN: EDITOR */}
         <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-800">
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Visualizando Mês</label>
                    <div className="relative">
                        <select 
                            value={viewMonth}
                            onChange={(e) => setViewMonth(e.target.value)}
                            className="w-full sm:w-48 bg-gray-800 text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-red outline-none appearance-none font-bold"
                        >
                            {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
                <button 
                  onClick={openNewExpenseModal}
                  className="bg-brand-red hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-red-900/20"
                >
                  <Plus size={18} /> <span className="hidden sm:inline">NOVA DESPESA</span>
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg h-[600px] flex flex-col">
                <div className="bg-[#0f111a] px-6 py-3 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
                        <Settings size={16} className="text-brand-red" />
                        Lançamentos de {MONTHS.find(m => m.value === viewMonth)?.label}/{viewYear}
                    </h3>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{currentExpenses.length} itens</span>
                </div>
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3">Despesa</th>
                                <th className="px-2 py-3">Vencimento</th>
                                <th className="px-4 py-3 text-right">Valor</th>
                                <th className="px-2 py-3 text-center">Status</th>
                                <th className="px-2 py-3 w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {currentExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                                        Nenhuma despesa lançada em {MONTHS.find(m => m.value === viewMonth)?.label}/{viewYear}.
                                    </td>
                                </tr>
                            )}
                            {currentExpenses.map(exp => {
                                const status = getStatus(exp);
                                const StatusIcon = status.icon;
                                
                                return (
                                <tr key={exp.id} className="hover:bg-gray-800/50 transition group cursor-pointer" onClick={() => openEditModal(exp)}>
                                    <td className="px-4 py-3 text-sm font-medium text-white uppercase relative">
                                        <div className="truncate w-32 xl:w-48" title={exp.description}>{exp.description}</div>
                                        {exp.installment && (
                                            <span className="text-[9px] bg-blue-900/30 text-blue-400 px-1 py-0.5 rounded border border-blue-900/50 inline-block mt-1">
                                                {exp.installment.current}/{exp.installment.total}
                                            </span>
                                        )}
                                        <div className="text-[10px] text-gray-500 mt-0.5">{exp.category}</div>
                                    </td>
                                    <td className="px-2 py-3 text-xs text-gray-300 font-mono">
                                        {exp.dueDate ? exp.dueDate.split('-').reverse().join('/') : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-right text-gray-200">R$ {exp.value.toFixed(2)}</td>
                                    <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => togglePaid(exp)}
                                            className={`flex flex-col items-center justify-center w-full p-1 rounded border text-[10px] font-bold uppercase transition ${status.color}`}
                                        >
                                           <StatusIcon size={12} className="mb-0.5" />
                                           {status.label}
                                        </button>
                                    </td>
                                    <td className="px-2 py-3 text-right">
                                        <Edit2 size={14} className="text-gray-600 group-hover:text-brand-red transition" />
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-950 p-4 border-t border-gray-800 flex justify-between items-center text-sm">
                    <span className="text-gray-400">Total {MONTHS.find(m => m.value === viewMonth)?.label}</span>
                    <span className="text-white font-bold text-lg">R$ {currentExpenses.reduce((a,b) => a + b.value, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
         </div>

         {/* RIGHT COLUMN: SUMMARY */}
         <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-[#0f111a] px-6 py-3 border-b border-gray-800">
                    <h3 className="font-bold text-white uppercase text-sm">Resumo Anual ({viewYear})</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Mês</th>
                            <th className="px-6 py-3 text-right">Total (R$)</th>
                            <th className="px-6 py-3 text-right">% Custo Fixo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {summaryData.map((data, idx) => (
                            <tr 
                              key={idx} 
                              className={`text-sm ${data.monthKey === selectedMonthKey ? 'bg-brand-red/10 border-l-2 border-brand-red' : (data.hasData ? 'bg-gray-800/30' : 'text-gray-600')}`}
                            >
                                <td className="px-6 py-2.5 font-medium">{data.label}</td>
                                <td className="px-6 py-2.5 text-right font-mono">
                                    {data.hasData ? `R$ ${data.totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '-'}
                                </td>
                                <td className="px-6 py-2.5 text-right font-mono">
                                    {data.hasData ? `${data.percentage.toFixed(2)}%` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Warning Box */}
            <div className={`border rounded-xl p-6 transition-colors ${fixedCostMode === 'AVERAGE' ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]' : 'bg-blue-900/20 border-blue-500/50 text-blue-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                   <AlertTriangle size={20} />
                   <h4 className="font-bold uppercase tracking-wide text-sm">
                     Modo: {fixedCostMode === 'AVERAGE' ? 'MÉDIA (Últimos 12 Meses)' : `MÊS ATUAL (${MONTHS.find(m => m.value === viewMonth)?.label})`}
                   </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 border-b border-black/10 pb-4">
                     <div>
                        <p className="text-[10px] uppercase font-bold opacity-70">Custo Fixo Considerado</p>
                        <p className="text-2xl font-bold">R$ {displayFixedCostValue.toLocaleString('pt-BR', {maximumFractionDigits: 2})}</p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase font-bold opacity-70">% Aplicada no PV</p>
                        <p className="text-2xl font-bold">{displayFixedCostPercent.toFixed(2)}%</p>
                     </div>
                </div>

                <p className="text-xs italic opacity-80">
                   {fixedCostMode === 'AVERAGE' 
                     ? `Baseado na média dos últimos ${last12MonthsMetrics.monthsCount} meses com dados lançados.`
                     : 'Baseado exclusivamente nos lançamentos e faturamento do mês selecionado acima.'}
                   Este percentual será usado automaticamente na precificação.
                </p>
            </div>
         </div>
       </div>

       {/* MODAL */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 w-full max-w-lg rounded-xl border border-gray-800 shadow-2xl animate-fade-in">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {editingExpenseId ? <Edit2 size={20} /> : <Plus size={20} />}
                        {editingExpenseId ? 'Editar Despesa' : 'Nova Despesa'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-bold uppercase">Mês de Competência</label>
                            <input 
                                type="month" 
                                required
                                value={formMonthStr} 
                                onChange={e => setFormMonthStr(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-brand-red"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-bold uppercase">Valor (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={val} 
                                onChange={e => setVal(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-brand-red"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-bold uppercase">Vencimento</label>
                            <input 
                                type="date" 
                                value={dueDate} 
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-brand-red"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-bold uppercase">Status Pagamento</label>
                            <button
                                type="button"
                                onClick={() => setIsPaid(!isPaid)}
                                className={`w-full p-3 rounded-lg border flex items-center justify-center gap-2 font-bold transition ${isPaid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            >
                                {isPaid ? <><CheckCircle size={18}/> PAGO</> : <><X size={18}/> NÃO PAGO</>}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-bold uppercase">Descrição</label>
                        <input 
                            type="text" 
                            required
                            placeholder="Ex: Aluguel, Conta de Luz..."
                            value={desc} 
                            onChange={e => setDesc(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-brand-red"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-bold uppercase">Categoria Financeira</label>
                        <select 
                            value={cat} 
                            onChange={e => setCat(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-brand-red appearance-none"
                        >
                            <option value="" disabled>Selecione...</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {!editingExpenseId && (
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-2">
                                    <Calendar size={14} /> Parcelamento
                                </label>
                                <span className="text-xs text-brand-red font-bold">{installments > 1 ? `${installments}x de R$ ${parseFloat(val || '0').toFixed(2)}` : 'À Vista'}</span>
                             </div>
                             <input 
                                type="range" 
                                min="1" 
                                max="12" 
                                value={installments} 
                                onChange={e => setInstallments(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-red"
                             />
                             <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                <span>1x</span>
                                <span>6x</span>
                                <span>12x</span>
                             </div>
                             {installments > 1 && (
                                <p className="text-xs text-gray-400 mt-2">
                                    Serão criados lançamentos automáticos até <strong>{installments} meses</strong> à frente com a data de vencimento ajustada.
                                </p>
                             )}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 font-bold">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-brand-red text-white rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-900/20">Salvar Lançamento</button>
                    </div>
                </form>
            </div>
        </div>
       )}
    </div>
  );
};

export default Expenses;
