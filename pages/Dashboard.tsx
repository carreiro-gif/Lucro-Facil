
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, AlertTriangle, Dna, HelpCircle, X, Target } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { monthlyRevenue, calculateFixedCostPercent, calculateTotalCfiPercent, expenses, cfi } = useApp();
  const [showHelp, setShowHelp] = useState(false);
  
  const fixedCostPct = calculateFixedCostPercent();
  const totalCfiPercent = calculateTotalCfiPercent();

  const activeRevenueMonths = monthlyRevenue.filter(m => m.revenue > 0);
  const avgRevenue = activeRevenueMonths.length 
    ? activeRevenueMonths.reduce((a, b) => a + b.revenue, 0) / activeRevenueMonths.length 
    : 0;

  // Break-even Logic for latest month
  const latestMonthKey = activeRevenueMonths.length > 0 
    ? activeRevenueMonths[activeRevenueMonths.length - 1].month 
    : new Date().toISOString().slice(0, 7);

  const monthRevenue = monthlyRevenue.find(r => r.month === latestMonthKey)?.revenue || 0;
  const monthFixedCosts = expenses.filter(e => e.month === latestMonthKey).reduce((s, e) => s + e.value, 0);
  
  // Contribution Margin % (Estimated using CFI variables)
  const avgCardRate = (cfi.debitTax + cfi.creditTax) / 2;
  const varPctTotal = avgCardRate + cfi.tax + cfi.royalties + cfi.marketing + cfi.voucherTax + 35; // 35% estimate for CMV if not specified
  const mcPct = 1 - (varPctTotal / 100);
  const breakEvenR$ = mcPct > 0 ? monthFixedCosts / mcPct : 0;
  const gapToBe = Math.max(0, breakEvenR$ - monthRevenue);

  const pieData = [
    { name: 'Custo Fixo', value: fixedCostPct },
    { name: 'Custo Variável (Est.)', value: Math.max(0, 100 - fixedCostPct - 20) },
    { name: 'Lucro (Meta)', value: 20 },
  ];

  const COLORS = ['#F59E0B', '#EF4444', '#10B981'];

  const kpiData = [
    { 
      title: 'Faturamento Médio', 
      value: `R$ ${avgRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'text-emerald-600 dark:text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderColor: 'border-emerald-200 dark:border-emerald-500/20'
    },
    { 
      title: 'Ponto Equilíbrio (R$)', 
      value: `R$ ${breakEvenR$.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
      icon: Target, 
      color: 'text-blue-600 dark:text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'border-blue-200 dark:border-blue-500/20',
      subtitle: gapToBe > 0 ? `Falta R$ ${gapToBe.toLocaleString('pt-BR', {maximumFractionDigits: 0})}` : 'Meta Batida'
    },
    { 
      title: 'CFI da Empresa', 
      value: `${totalCfiPercent.toFixed(2)}%`, 
      icon: Dna, 
      color: 'text-purple-600 dark:text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-500/10',
      borderColor: 'border-purple-200 dark:border-purple-500/20'
    },
    { 
      title: 'Custo Fixo (Mês)', 
      value: `${fixedCostPct.toFixed(2)}%`, 
      icon: AlertTriangle, 
      color: 'text-amber-600 dark:text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'border-amber-200 dark:border-amber-500/20'
    }
  ];

  const chartData = monthlyRevenue.map(m => ({
    name: m.month,
    revenue: m.revenue
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div>
            <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">Dashboard</h2>
                <button 
                    onClick={() => setShowHelp(!showHelp)} 
                    className="text-gray-400 hover:text-brand-red transition-colors"
                    title="Ajuda"
                >
                    <HelpCircle size={20} />
                </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Visão geral do desempenho do seu negócio.</p>
            </div>
        </div>

        {showHelp && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm">
                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
                <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2"><HelpCircle size={16}/> Sobre o Dashboard</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Esta tela é o seu painel de controle. Aqui você visualiza rapidamente a saúde financeira do negócio.
                    <br/><br/>
                    <strong>Indicadores Principais:</strong>
                    <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                        <li><strong>Ponto de Equilíbrio:</strong> Quanto você precisa vender no mês para não ter prejuízo.</li>
                        <li><strong>CFI da Empresa:</strong> A soma de todos os custos que "mordem" seu preço de venda.</li>
                        <li><strong>Custo Fixo (Mês):</strong> % do faturamento comprometido com contas fixas.</li>
                    </ul>
                </p>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`p-6 rounded-2xl border bg-white dark:bg-transparent ${kpi.borderColor} transition-transform hover:scale-105 duration-300 shadow-sm ${kpi.bgColor}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm ${kpi.color}`}>
                  <Icon size={24} />
                </div>
                {(idx === 1 && kpi.subtitle) && (
                   <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${gapToBe > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                     {kpi.subtitle}
                   </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">{kpi.title}</p>
              <h3 className={`text-2xl font-black mt-1 text-gray-900 dark:text-white`}>{kpi.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
           <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm mb-6">Faturamento Mensal</h3>
           <div className="h-80" style={{ minHeight: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" vertical={false} opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF" 
                    tick={{fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => val.split('-')[1]}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tick={{fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `R$${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#F3F4F6' }}
                    itemStyle={{ color: '#F3F4F6' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Faturamento']}
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
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

        <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm mb-6">Distribuição Estimada</h3>
            <div className="h-60 relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#F3F4F6' }}
                       formatter={(val: number) => [`${val.toFixed(1)}%`]}
                    />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{fixedCostPct.toFixed(0)}%</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Custo Fixo</span>
               </div>
            </div>
            <div className="space-y-3 mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                        <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                     </div>
                     <span className="font-bold text-gray-900 dark:text-white">{entry.value.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
