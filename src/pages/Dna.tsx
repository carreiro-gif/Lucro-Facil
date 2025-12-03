import React from 'react';
import { useApp } from '../context/AppContext';
import { Info, Settings2, TrendingDown, TrendingUp, Minus } from 'lucide-react';

const Dna: React.FC = () => {
  const { cfi, updateCfi, calculateFixedCostPercent, fixedCostMode, setFixedCostMode } = useApp();

  const fixedCostPercent = calculateFixedCostPercent();
  
  // Logic: Média Taxa Cartão = (Débito + Crédito) / 2
  const avgCardRate = (cfi.debitTax + cfi.creditTax) / 2;

  // Logic Update: TOTAL DO CFI inclui Voucher
  // Formula: Custo Fixo + Média Cartão + Imposto + Royalties + Marketing + Voucher
  const totalVariableTax = avgCardRate + cfi.tax + cfi.royalties + cfi.marketing + cfi.voucherTax;
  const totalCfiCost = fixedCostPercent + totalVariableTax;

  const handleChange = (key: keyof typeof cfi, value: string) => {
    updateCfi({ [key]: parseFloat(value) || 0 });
  };

  // Status Logic - SOLID BACKGROUNDS, WHITE TEXT
  const getStatus = (val: number) => {
    if (val <= 33) return { 
        bg: 'bg-emerald-600',
        border: 'border-emerald-500',
        glow: 'shadow-emerald-900/40',
        label: 'Saudável',
        icon: TrendingUp
    };
    if (val <= 40) return { 
        bg: 'bg-amber-500', 
        border: 'border-amber-400',
        glow: 'shadow-amber-900/40',
        label: 'Atenção',
        icon: Minus
    };
    return { 
        bg: 'bg-red-600', 
        border: 'border-red-500',
        glow: 'shadow-red-900/40',
        label: 'Reduza Custos',
        icon: TrendingDown
    };
  };

  const status = getStatus(totalCfiCost);
  const StatusIcon = status.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* EXPLANATORY BANNER - CFI */}
      <div className="bg-gradient-to-r from-blue-900/40 to-gray-900 border border-blue-500/30 rounded-xl p-6 relative overflow-hidden shadow-lg">
         <div className="relative z-10">
            <h2 className="text-2xl font-bold uppercase mb-2 text-white flex items-center gap-3">
               CFI – Custo Fixo Integrado
            </h2>
            <p className="text-lg font-medium text-blue-200 mb-4 italic">
               “Integre seus custos fixos ao preço e nunca venda no prejuízo.”
            </p>
            <p className="text-gray-300 mb-4 leading-relaxed max-w-3xl text-sm md:text-base">
               O CFI representa a porcentagem dos custos fixos em relação ao faturamento. Ele indica quanto do preço de venda precisa absorver para cobrir os custos fixos antes do lucro.
            </p>
            
            <div className="bg-black/40 p-3 rounded-lg inline-block border border-white/10 backdrop-blur-sm">
                <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Interpretação:</h4>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm font-bold">
                    <div className="flex items-center gap-2 text-emerald-400"><span className="text-lg">✅</span> Até 33%: saudável</div>
                    <div className="flex items-center gap-2 text-amber-400"><span className="text-lg">⚠️</span> 34% a 40%: atenção</div>
                    <div className="flex items-center gap-2 text-red-400"><span className="text-lg">❌</span> Acima de 40%: reduza custos fixos</div>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: INPUT TABLE */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
           <div className="bg-[#0f111a] px-6 py-4 border-b border-gray-800">
              <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
                 <Settings2 size={18} className="text-brand-red" /> 
                 Configuração de Taxas
              </h3>
           </div>
           
           <table className="w-full text-left">
              <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                      <th className="px-6 py-3">Descrição da Taxa</th>
                      <th className="px-6 py-3 text-right">Valor (%)</th>
                      <th className="px-6 py-3 text-center">Tipo</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                  {/* Custo Fixo (Automatic) */}
                  <tr className="bg-yellow-900/10">
                      <td className="px-6 py-4 font-bold text-white">
                          Custo Fixo Considerado
                          <span className="block text-[10px] text-gray-500 font-normal mt-0.5">
                              {fixedCostMode === 'AVERAGE' ? 'Média dos últimos 12 meses' : 'Baseado no mês atual'}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-yellow-500 text-lg">
                          {fixedCostPercent.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                          <span className="bg-yellow-900/30 text-yellow-500 text-[10px] px-2 py-1 rounded uppercase font-bold border border-yellow-500/30">Automático</span>
                      </td>
                  </tr>

                  {/* Input Fields */}
                  <tr className="hover:bg-gray-800/30 transition">
                      <td className="px-6 py-4 text-gray-300">Taxa Máquina Débito</td>
                      <td className="px-6 py-4 text-right">
                          <input 
                            type="number" step="0.01" 
                            value={cfi.debitTax} 
                            onChange={e => handleChange('debitTax', e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded text-white text-right p-1 w-20 focus:border-brand-red outline-none"
                          />
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">Editável</td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition">
                      <td className="px-6 py-4 text-gray-300">Taxa Máquina Crédito</td>
                      <td className="px-6 py-4 text-right">
                          <input 
                            type="number" step="0.01" 
                            value={cfi.creditTax} 
                            onChange={e => handleChange('creditTax', e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded text-white text-right p-1 w-20 focus:border-brand-red outline-none"
                          />
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">Editável</td>
                  </tr>

                   {/* Calculated Average Card */}
                   <tr className="bg-gray-800/30">
                      <td className="px-6 py-4 font-medium text-gray-300">
                          Média Taxa Cartão (D+C)/2
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-200">
                          {avgCardRate.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Calculado</span>
                      </td>
                  </tr>

                  <tr className="hover:bg-gray-800/30 transition">
                      <td className="px-6 py-4 text-gray-300">Imposto (Simples/Outros)</td>
                      <td className="px-6 py-4 text-right">
                          <input 
                            type="number" step="0.01" 
                            value={cfi.tax} 
                            onChange={e => handleChange('tax', e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded text-white text-right p-1 w-20 focus:border-brand-red outline-none"
                          />
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">Editável</td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition">
                      <td className="px-6 py-4 text-gray-300">Royalties / Franquia</td>
                      <td className="px-6 py-4 text-right">
                          <input 
                            type="number" step="0.01" 
                            value={cfi.royalties} 
                            onChange={e => handleChange('royalties', e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded text-white text-right p-1 w-20 focus:border-brand-red outline-none"
                          />
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">Editável</td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition">
                      <td className="px-6 py-4 text-gray-300">Marketing</td>
                      <td className="px-6 py-4 text-right">
                          <input 
                            type="number" step="0.01" 
                            value={cfi.marketing} 
                            onChange={e => handleChange('marketing', e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded text-white text-right p-1 w-20 focus:border-brand-red outline-none"
                          />
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">Editável</td>
                  </tr>

                   {/* Voucher included in Total */}
                   <tr className="hover:bg-gray-800/30 transition border-t border-gray-800">
                      <td className="px-6 py-4 text-gray-300">
                          Voucher / VR (Referência)
                      </td>
                      <td className="px-6 py-4 text-right">
                          <input 
                            type="number" step="0.01" 
                            value={cfi.voucherTax} 
                            onChange={e => handleChange('voucherTax', e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded text-white text-right p-1 w-20 focus:border-brand-red outline-none"
                          />
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">Editável</td>
                  </tr>
              </tbody>
           </table>
        </div>

        {/* RIGHT: SUMMARY & CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Control Panel */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h4 className="text-sm font-bold text-white uppercase mb-4">Origem do Custo Fixo</h4>
                <div className="space-y-3">
                    <button 
                       onClick={() => setFixedCostMode('AVERAGE')}
                       className={`w-full p-3 rounded-lg border text-left transition flex justify-between items-center ${fixedCostMode === 'AVERAGE' ? 'bg-brand-red/10 border-brand-red text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                        <span className="text-sm font-bold">Média (12 Meses)</span>
                        {fixedCostMode === 'AVERAGE' && <div className="w-2 h-2 rounded-full bg-brand-red"></div>}
                    </button>
                    <button 
                       onClick={() => setFixedCostMode('CURRENT_MONTH')}
                       className={`w-full p-3 rounded-lg border text-left transition flex justify-between items-center ${fixedCostMode === 'CURRENT_MONTH' ? 'bg-brand-red/10 border-brand-red text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                        <span className="text-sm font-bold">Mês Específico</span>
                        {fixedCostMode === 'CURRENT_MONTH' && <div className="w-2 h-2 rounded-full bg-brand-red"></div>}
                    </button>
                    <p className="text-[10px] text-gray-500 mt-2">
                        Selecione qual base de dados utilizar para o cálculo automático do Custo Fixo %.
                    </p>
                </div>
            </div>

            {/* TOTAL CFI BOX - UPDATED WITH SOLID COLORS */}
            <div className={`rounded-xl p-6 border ${status.bg} ${status.border} ${status.glow} shadow-xl relative overflow-hidden transition-colors duration-300 text-white`}>
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold uppercase text-sm mb-1 text-white">Total do CFI</h3>
                        <p className="text-[10px] opacity-90 text-white">Custo Fixo + Taxas</p>
                    </div>
                    <StatusIcon className="text-white" size={24} />
                 </div>
                 
                 <div className="flex items-baseline gap-1 mt-2 text-white">
                     <span className="text-5xl font-extrabold tracking-tight">{totalCfiCost.toFixed(2)}</span>
                     <span className="text-2xl font-bold opacity-90">%</span>
                 </div>

                 <div className="mt-6 pt-4 border-t border-white/30 space-y-2 text-sm text-white">
                     <div className="flex justify-between">
                         <span className="opacity-90">Custo Fixo:</span>
                         <span className="font-mono font-bold">{fixedCostPercent.toFixed(2)}%</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="opacity-90">Outros Itens:</span>
                         <span className="font-mono font-bold">{totalVariableTax.toFixed(2)}%</span>
                     </div>
                 </div>

                 <div className="mt-4 bg-black/20 rounded p-2 text-center text-xs font-bold text-white uppercase tracking-wider">
                     {status.label}
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dna;
