
import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, AlertTriangle, Dna } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { monthlyRevenue, calculateFixedCostPercent, calculateTotalCfiPercent } = useApp();

  const fixedCostPct = calculateFixedCostPercent();
  const activeRevenueMonths = monthlyRevenue.filter(m => m.revenue > 0);
  const avgRevenue = activeRevenueMonths.length
    ? activeRevenueMonths.reduce((a, b) => a + b.revenue, 0) / activeRevenueMonths.length
    : 0;
  const totalCfiPercent = calculateTotalCfiPercent();

  // ✅ Pie Data (corrigido para evitar NaN)
  const pieData = [
    { name: 'Custo Fixo', value: isNaN(fixedCostPct) ? 0 : fixedCostPct },
    {
      name: 'Custo Variável (Est.)',
      value: Math.max(0, 100 - (isNaN(fixedCostPct) ? 0 : fixedCostPct) - 20),
    },
    { name: 'Lucro (Meta)', value: 20 },
  ];

  const COLORS = ['#F59E0B', '#EF4444', '#10B981'];

  const kpiData = [
    {
      title: 'Faturamento Médio',
      value: `R$ ${avgRevenue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Lucro (Meta)',
      value: '20.00%',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'CFI da Empresa',
      value: `${totalCfiPercent.toFixed(2)}%`,
      icon: Dna,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Custo Fixo (Mês)',
      value: `${fixedCostPct.toFixed(2)}%`,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ];

  // ✅ Chart Data (corrigido para evitar NaN)
  const chartData = monthlyRevenue.map(m => ({
    name: m.month,
    revenue: isNaN(Number(m.revenue)) ? 0 : Number(m.revenue),
  }));

  const currencyTick = (val: number) => `R$ ${Math.round(val / 1000)}k`;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p className="text-gray-600 mb-6">Visão geral do desempenho do seu negócio.</p>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${kpi.borderColor} ${kpi.bgColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-6 h-6 ${kpi.color}`} />
                {idx === 2 && (
                  <span
                    className={`text-xs font-bold ${
                      parseFloat(kpi.value as string) <= 33
                        ? 'text-emerald-500'
                        : parseFloat(kpi.value as string) <= 40
                        ? 'text-amber-500'
                        : 'text-red-500'
                    }`}
                  >
                    {parseFloat(kpi.value as string) <= 33
                      ? 'OK'
                      : parseFloat(kpi.value as string) <= 40
                      ? 'ALERTA'
                      : 'CRÍTICO'}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-medium">{kpi.title}</h4>
              <p className="text-lg font-bold">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Chart */}
      <h4 className="text-lg font-semibold mb-2">Faturamento Mensal</h4>
      <div className="w-full h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={currencyTick} />
            <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']} />
            <Bar dataKey="revenue" fill="#4B5563" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <h4 className="text-lg font-semibold mb-2">Distribuição Estimada</h4>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => [`${val.toFixed(1)}%`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
