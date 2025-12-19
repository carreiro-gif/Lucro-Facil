
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ScrollText, Info, HelpCircle, X } from 'lucide-react';

const Profit: React.FC = () => {
  const { 
    calculateTotalCfiPercent,
    updateProduct,
    getSortedProducts,
    getProductCMV
  } = useApp();
  const [showHelp, setShowHelp] = useState(false);

  const totalCfiPercent = calculateTotalCfiPercent();
  const sortedProducts = useMemo(() => getSortedProducts(), [getSortedProducts]);

  const handleValueChange = (productId: string, field: 'price' | 'delivery', value: string) => {
    const numValue = parseFloat(value) || 0;
    const product = sortedProducts.find(p => p.id === productId);
    if (product) {
      if (field === 'price') {
        updateProduct(productId, { fixedPriceStore: numValue });
      } else {
        const newPricing = { ...product.pricing, keeta: { ...product.pricing?.keeta, delivery: numValue } };
        updateProduct(productId, { pricing: newPricing as any });
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">Lucro Atual</h2>
                <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-brand-red transition-colors"><HelpCircle size={20} /></button>
           </div>
          <p className="text-gray-500 dark:text-gray-400">Análise de margem real baseada no preço praticado hoje.</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-3 rounded-lg flex items-center gap-3 text-sm text-blue-800 dark:text-blue-200 shadow-sm">
             <Info className="text-blue-500 dark:text-blue-400 shrink-0" size={20} />
             <div><p className="font-bold">Nota:</p>O CFI e a ordem dos itens são automáticos.</div>
        </div>
      </div>

      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in mb-4">
            <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Ordem do Cardápio</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Esta lista respeita a organização por seções e a ordem manual que você definiu na <strong>Ficha Técnica</strong>.
            </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
                <tr className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
                    <th className="px-4 py-4 w-16 text-center bg-gray-50 dark:bg-gray-900/50">Item</th>
                    <th className="px-4 py-4 bg-white dark:bg-gray-900">Produto</th>
                    <th className="px-4 py-4 bg-white dark:bg-gray-900 text-center w-32">Venda Atual (R$)</th>
                    <th className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 text-center w-24">CFI (%)</th>
                    <th className="px-4 py-4 bg-white dark:bg-gray-900 text-center w-28">Entrega (R$)</th>
                    <th className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 text-center w-32">CMV + Emb (R$)</th>
                    <th className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 text-center w-32">Lucro Atual (R$)</th>
                    <th className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 text-center w-32">Lucro %</th>
                    <th className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 text-center w-32">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {sortedProducts.map((product, idx) => {
                    const cmv = getProductCMV(product);
                    const pvAtual = product.fixedPriceStore || 0;
                    const deliveryCost = product.pricing?.keeta?.delivery || 0;
                    const cfiCost = pvAtual * (totalCfiPercent / 100);
                    const totalCosts = cmv + cfiCost + deliveryCost;
                    const profitValue = pvAtual - totalCosts;
                    const profitPercent = pvAtual > 0 ? (profitValue / pvAtual) : 0;
                    
                    let statusColor = 'text-gray-500', statusBg = 'bg-gray-100 dark:bg-gray-800', statusLabel = 'N/A';
                    if (pvAtual > 0) {
                        if (profitValue < 0) { statusColor = 'text-red-700 dark:text-red-500'; statusBg = 'bg-red-100 dark:bg-red-900/20'; statusLabel = 'PREJUÍZO'; }
                        else if (profitPercent < 0.15) { statusColor = 'text-amber-700 dark:text-yellow-500'; statusBg = 'bg-amber-100 dark:bg-yellow-900/20'; statusLabel = 'BAIXO'; }
                        else { statusColor = 'text-emerald-700 dark:text-emerald-500'; statusBg = 'bg-emerald-100 dark:bg-emerald-900/20'; statusLabel = 'OK'; }
                    }

                    return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition group">
                            <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">{product.name}</td>
                            <td className="px-4 py-3 text-center bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"><input type="number" step="0.01" value={pvAtual || ''} placeholder="0.00" onChange={(e) => handleValueChange(product.id, 'price', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-center rounded p-1.5 focus:border-brand-red outline-none font-bold" /></td>
                            <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">{totalCfiPercent.toFixed(2)}%</td>
                            <td className="px-4 py-3 text-center bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"><input type="number" step="0.01" value={deliveryCost || ''} placeholder="0.00" onChange={(e) => handleValueChange(product.id, 'delivery', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-center rounded p-1.5 focus:border-brand-red outline-none" /></td>
                            <td className="px-4 py-3 text-center font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">R$ {cmv.toFixed(2)}</td>
                            <td className={`px-4 py-3 text-center font-bold font-mono bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 ${profitValue < 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>R$ {profitValue.toFixed(2)}</td>
                            <td className={`px-4 py-3 text-center font-bold bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 ${profitPercent < 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>{(profitPercent * 100).toFixed(2)}%</td>
                            <td className="px-4 py-3 text-center bg-gray-50 dark:bg-gray-900/50"><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border border-transparent ${statusBg} ${statusColor}`}>{statusLabel}</span></td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Profit;
