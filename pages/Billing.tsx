
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, AlertCircle, HelpCircle, X, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

const Billing: React.FC = () => {
  const { monthlyRevenue, updateMonthlyRevenue } = useApp();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [showHelp, setShowHelp] = useState(false);

  const handleYearChange = (delta: number) => {
    setViewYear(prev => prev + delta);
  };

  const updateRevenueValue = (monthKey: string, valueStr: string) => {
    const value = parseFloat(valueStr) || 0;
    
    // Check if entry exists
    const exists = monthlyRevenue.find(r => r.month === monthKey);
    let newData;

    if (exists) {
      newData = monthlyRevenue.map(r => r.month === monthKey ? { ...r, revenue: value } : r);
    } else {
      newData = [...monthlyRevenue, { month: monthKey, revenue: value }];
    }
    
    updateMonthlyRevenue(newData);
  };

  // Prepare data for the selected year
  const yearData = useMemo(() => {
    return MONTHS.map(m => {
      const monthKey = `${viewYear}-${m.value}`;
      const entry = monthlyRevenue.find(r => r.month === monthKey);
      return {
        label: m.label,
        key: monthKey,
        value: entry ? entry.revenue : 0
      };
    });
  }, [viewYear, monthlyRevenue]);

  // Calculate Average (Last 12 months with data)
  const averageRevenue = useMemo(() => {
    // 1. Filter only months with revenue > 0
    const activeMonths = monthlyRevenue.filter(r => r.revenue > 0);
    
    // 2. Sort by date string
    activeMonths.sort((a, b) => a.month.localeCompare(b.month));

    // 3. Take last 12
    const last12 = activeMonths.slice(-12);

    if (last12.length === 0) return 0;

    const sum = last12.reduce((acc, curr) => acc + curr.revenue, 0);
    return sum / last12.length;
  }, [monthlyRevenue]);

  // Data for Chart
  const chartData = yearData.map(d => ({
    name: d.label.substring(0, 3), // Jan, Fev...
    fullLabel: d.label,
    revenue: d.value
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header & Controls */}
      <div className="bg-white/50 dark:bg-brand-dark/50 border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 backdrop-blur-sm rounded-xl p-4">
         <div className="w-full xl:w-auto">
            <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">Faturamento Mensal</h2>
                <button 
                    onClick={() => setShowHelp(!showHelp)} 
                    className="text-gray-400 hover:text-brand-red transition-colors"
                    title="Histórico de entradas para cálculo de ponto de equilíbrio e metas."
                >
                    <HelpCircle size={20} />
                </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Histórico de entradas para cálculo de ponto de equilíbrio e metas.</p>
         </div>

         <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
             <button onClick={() => handleYearChange(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition"><ChevronLeft size={20}/></button>
             <div className="text-center">
               <span className="text-xs text-gray-500 uppercase font-bold">Ano Referência</span>
               <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{viewYear}</div>
             </div>
             <button onClick={() => handleYearChange(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition"><ChevronRight size={20}/></button>
         </div>
      </div>

      {/* Standardized Help Panel */}
      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm max-w-4xl no-print">
            <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2"><HelpCircle size={18} /> Por que preencher isso?</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-4 leading-relaxed">
                <p>Este é o histórico do quanto sua loja vendeu (faturamento bruto).</p>
                <p>Ele é usado para calcular a média de faturamento, que por sua vez é o divisor usado para encontrar o percentual do Custo Fixo (CFI).</p>
                <p><em>Ex: Se você tem 5 mil de custo fixo e fatura 20 mil, seu custo fixo é 25%. Se você não preencher o faturamento, não saberemos esse percentual!</em></p>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 text-xs">
                    <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1"><Info size={14} /> Importante:</p>
                    <p>O faturamento preenchido aqui impacta diretamente no cálculo do % de Custo Fixo, que é fundamental para a precificação correta dos seus produtos.</p>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Data Entry Table */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
            <div className="bg-gray-50 dark:bg-[#0f111a] px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                <DollarSign className="text-brand-red" size={20} />
                <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm">Entradas {viewYear}</h3>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {yearData.map((month) => (
                            <tr key={month.key} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                <td className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 w-1/3">{month.label}</td>
                                <td className="px-6 py-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={month.value || ''}
                                            placeholder="0,00"
                                            onChange={(e) => updateRevenueValue(month.key, e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-right rounded-lg py-2 pl-8 pr-3 text-sm font-mono focus:ring-2 focus:ring-brand-red outline-none transition group-hover:bg-white dark:group-hover:bg-gray-700"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Right: Summary & Chart */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Average Box */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                {/* Decoration for dark mode */}
                <div className="absolute top-0 right-0 p-32 bg-brand-red/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 dark:opacity-100"></div>
                
                <div className="flex items-center gap-4 z-10">
                    <div className="bg-brand-red/10 dark:bg-brand-red/20 p-4 rounded-full text-brand-red">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold tracking-wider">Média Faturamento Mensal</p>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mt-1">R$ {averageRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                           <AlertCircle size={12} /> Calculado sobre os últimos 12 meses ativos
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-950/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 max-w-xs text-xs text-gray-600 dark:text-gray-400 z-10">
                    <strong className="text-brand-red block mb-1 uppercase">Importante:</strong>
                    O faturamento preenchido aqui impacta diretamente no cálculo do <strong>% de Custo Fixo</strong>, que é fundamental para a precificação correta dos seus produtos.
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 h-96 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm mb-6">Evolução de Faturamento ({viewYear})</h3>
                {/* Added explicit style minHeight to fix Recharts in production */}
                <div style={{ width: '100%', height: '100%', minHeight: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" vertical={false} opacity={0.2} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#9CA3AF" 
                                tick={{fontSize: 12}} 
                                axisLine={false} 
                                tickLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                stroke="#9CA3AF" 
                                tick={{fontSize: 12}} 
                                axisLine={false} 
                                tickLine={false}
                                tickFormatter={(val) => `R$ ${val/1000}k`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#F3F4F6' }}
                                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Faturamento']}
                                cursor={{fill: 'rgba(0,0,0,0.1)'}}
                            />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? '#D90429' : '#9CA3AF'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
