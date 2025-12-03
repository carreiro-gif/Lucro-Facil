import React, { useState, useMemo } from 'react';
import { useApp } from "../../context/AppContext";
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MONTHS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
];

const Billing: React.FC = () => {
  const { monthlyRevenue, updateMonthlyRevenue } = useApp();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const handleYearChange = (delta: number) => setViewYear(prev => prev + delta);

  const updateRevenueValue = (monthKey: string, valueStr: string) => {
    const value = parseFloat(valueStr) || 0;
    const exists = monthlyRevenue.find(r => r.month === monthKey);
    let newData;
    if (exists) {
      newData = monthlyRevenue.map(r => r.month === monthKey ? { ...r, revenue: value } : r);
    } else {
      newData = [...monthlyRevenue, { month: monthKey, revenue: value }];
    }
    updateMonthlyRevenue(newData);
  };

  const yearData = useMemo(() => {
    return MONTHS.map(m => {
      const monthKey = `${viewYear}-${m.value}`;
      const entry = monthlyRevenue.find(r => r.month === monthKey);
      return { label: m.label, key: monthKey, value: entry ? entry.revenue : 0 };
    });
  }, [viewYear, monthlyRevenue]);

  const averageRevenue = useMemo(() => {
    const activeMonths = monthlyRevenue.filter(r => r.revenue > 0);
    activeMonths.sort((a, b) => a.month.localeCompare(b.month));
    const last12 = activeMonths.slice(-12);
    if (last12.length === 0) return 0;
    const sum = last12.reduce((acc, curr) => acc + curr.revenue, 0);
    return sum / last12.length;
  }, [monthlyRevenue]);

  const chartData = yearData.map(d => ({ name: d.label.substring(0, 3), fullLabel: d.label, revenue: d.value }));

  const currencyTick = (val: number) => `R$ ${Math.round(val / 1000)}k`;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header & Controls */}
      <div className="bg-brand-dark/50 border-b border-gray-800 pb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-wide">Faturamento Mensal</h2>
          <p className="text-gray-400 text-sm mt-1">Histórico de entradas para cálculo de ponto de equilíbrio e metas.</p>
        </div>

        <div className="flex items-center gap-4 bg-gray-900 p-3 rounded-xl border border-gray-800">
          <button onClick={() => handleYearChange(-1)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition"><ChevronLeft size={20} /></button>
          <div className="text-center">
            <span className="text-xs text-gray-500 uppercase font-bold">Ano Referência</span>
            <div className="text-2xl font-bold text-white leading-none">{viewYear}</div>
          </div>
          <button onClick={() => handleYearChange(1)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Data Entry Table */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
          {/* ... your left column unchanged (keeps original markup) */}
        </div>

        {/* Right: Summary & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Average Box (keeps original markup) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-auto">
            <div className="flex items-center gap-4">
              <div className="bg-brand-red/20 p-4 rounded-full text-brand-red">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-gray-400 text-sm uppercase font-bold tracking-wider">Média Faturamento Mensal</p>
                <h2 className="text-4xl font-bold text-white mt-1">R$ {averageRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-96 min-h-[280px]">
            <h3 className="font-bold text-white uppercase text-sm mb-6">Evolução de Faturamento ({viewYear})</h3>

            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={currencyTick} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                  cursor={{ fill: '#1F2937' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? '#D90429' : '#374151'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
