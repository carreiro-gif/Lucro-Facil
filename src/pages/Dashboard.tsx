import React from "react";
import { useApp } from "../../context/AppContext"; // ✅ Caminho corrigido
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const Dashboard: React.FC = () => {
  const { state } = useApp();

  return (
    <div className="animate-fade-in pb-20 space-y-10">
      <h1 className="text-3xl font-bold uppercase text-white">
        Dashboard
      </h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
          <p className="text-gray-400 text-sm">Total de Insumos</p>
          <h2 className="text-3xl font-bold text-brand-red">
            {state.ingredients?.length || 0}
          </h2>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
          <p className="text-gray-400 text-sm">Total de Produtos</p>
          <h2 className="text-3xl font-bold text-brand-red">
            {state.products?.length || 0}
          </h2>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
          <p className="text-gray-400 text-sm">Total de Despesas</p>
          <h2 className="text-3xl font-bold text-brand-red">
            {state.expenses?.length || 0}
          </h2>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
          <p className="text-gray-400 text-sm">Produtos Rentáveis</p>
          <h2 className="text-3xl font-bold text-green-500">
            {state.products?.filter((p) => p.profit > 0).length || 0}
          </h2>
        </div>
      </div>

      {/* Gráfico de Produtos x Preço */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">
          Preço dos Produtos
        </h2>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={state.products || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Legend />
              <Bar dataKey="price" fill="#D90429" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Lucro */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">
          Lucro por Produto
        </h2>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={state.products || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="#00FF66" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
