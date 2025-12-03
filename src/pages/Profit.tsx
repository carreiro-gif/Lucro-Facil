import React from 'react';
import { useApp } from "../../context/AppContext";
import { ScrollText, Info } from 'lucide-react';

const Profit: React.FC = () => {
  const { 
    products, 
    getProductCMV, 
    calculateTotalCfiPercent,
    updateProduct 
  } = useApp();

  const totalCfiPercent = calculateTotalCfiPercent();

  // Helper to handle input changes
  const handleValueChange = (productId: string, field: 'price' | 'delivery', value: string) => {
    const numValue = parseFloat(value) || 0;
    const product = products.find(p => p.id === productId);
    
    if (product) {
      if (field === 'price') {
        updateProduct(productId, { fixedPriceStore: numValue });
      } else {
        // Delivery logic as before (temporary placeholder in keeta.delivery)
        const newPricing = { ...product.pricing, keeta: { ...product.pricing?.keeta, delivery: numValue } };
        updateProduct(productId, { pricing: newPricing as any });
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase">Lucro Atual</h2>
          <p className="text-gray-400">Análise de margem real baseada no preço de venda praticado.</p>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex items-center gap-3 text-sm text-blue-200">
             <Info className="text-blue-400 shrink-0" size={20} />
             <div>
                <p className="font-bold">Nota:</p>
                Os campos em branco são editáveis. O CFI é calculado automaticamente com base na aba CFI.
             </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
                <tr className="bg-[#0f111a] text-gray-400 text-xs uppercase font-bold tracking-wider">
                    <th className="px-4 py-4 w-16 text-center bg-gray-900/50">Item</th>
                    <th className="px-4 py-4 bg-gray-900">Produto</th>
                    <th className="px-4 py-4 bg-gray-900 text-center w-32">Venda Atual (R$)</th>
                    <th className="px-4 py-4 bg-gray-900/50 text-center w-24">CFI (%)</th>
                    <th className="px-4 py-4 bg-gray-900 text-center w-28">Entrega (R$)</th>
                    <th className="px-4 py-4 bg-gray-900/50 text-center w-32">CMV + Emb (R$)</th>
                    <th className="px-4 py-4 bg-gray-900/50 text-center w-32">Lucro Atual (R$)</th>
                    <th className="px-4 py-4 bg-gray-900/50 text-center w-32">Lucro %</th>
                    <th className="px-4 py-4 bg-gray-900/50 text-center w-32">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
                {products.map((product, idx) => {
                    // 1. Fetch Data
                    const cmv = getProductCMV(product); // CMV calculated from Recipe
                    const pvAtual = product.fixedPriceStore || 0; // Editable Selling Price
                    const deliveryCost = product.pricing?.keeta?.delivery || 0;

                    // 2. Calculations
                    const cfiCost = pvAtual * (totalCfiPercent / 100);
                    const totalCosts = cmv + cfiCost + deliveryCost;
                    const profitValue = pvAtual - totalCosts;
                    const profitPercent = pvAtual > 0 ? (profitValue / pvAtual) : 0;
                    
                    // 3. Status Logic
                    let statusColor = 'text-gray-500';
                    let statusBg = 'bg-gray-800';
                    let statusLabel = 'N/A';
                    
                    if (pvAtual > 0) {
                        if (profitValue < 0) {
                            statusColor = 'text-red-500';
                            statusBg = 'bg-red-900/20';
                            statusLabel = 'PREJUÍZO';
                        } else if (profitPercent < 0.15) {
                            statusColor = 'text-yellow-500';
                            statusBg = 'bg-yellow-900/20';
                            statusLabel = 'BAIXO';
                        } else {
                            statusColor = 'text-emerald-500';
                            statusBg = 'bg-emerald-900/20';
                            statusLabel = 'OK';
                        }
                    }
                    
                    // Check for high CMV alert (> 40%)
                    const isCmvHigh = pvAtual > 0 && (cmv / pvAtual) > 0.40;

                    return (
                        <tr key={product.id} className="hover:bg-gray-800/30 transition group">
                            {/* Item (Gray) */}
                            <td className="px-4 py-3 text-center text-gray-500 font-mono bg-gray-900/50 border-r border-gray-800">
                                {idx + 1}
                            </td>

                            {/* Produto (White/Editable-ish - usually just Name) */}
                            <td className="px-4 py-3 font-medium text-white bg-gray-900 border-r border-gray-800">
                                <input 
                                    type="text" 
                                    value={product.name}
                                    onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                                    className="bg-transparent text-white w-full outline-none focus:border-b border-brand-red transition-colors"
                                />
                            </td>

                            {/* Venda Atual (White/Editable) */}
                            <td className="px-4 py-3 text-center bg-gray-900 border-r border-gray-800">
                                <input 
                                    type="number" step="0.01"
                                    value={pvAtual || ''}
                                    placeholder="0.00"
                                    onChange={(e) => handleValueChange(product.id, 'price', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white text-center rounded p-1.5 focus:border-brand-red outline-none font-bold"
                                />
                            </td>

                            {/* CFI (Gray) */}
                            <td className="px-4 py-3 text-center text-gray-400 bg-gray-900/50 border-r border-gray-800">
                                {totalCfiPercent.toFixed(2)}%
                            </td>

                            {/* Entrega (White/Editable) */}
                            <td className="px-4 py-3 text-center bg-gray-900 border-r border-gray-800">
                                <input 
                                    type="number" step="0.01"
                                    value={deliveryCost || ''}
                                    placeholder="0.00"
                                    onChange={(e) => handleValueChange(product.id, 'delivery', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white text-center rounded p-1.5 focus:border-brand-red outline-none"
                                />
                            </td>

                            {/* CMV (Gray) */}
                            <td className="px-4 py-3 text-center font-mono text-gray-300 bg-gray-900/50 border-r border-gray-800 relative">
                                R$ {cmv.toFixed(2)}
                                {isCmvHigh && (
                                    <span className="absolute top-1 right-1 text-[8px] bg-red-500 text-white px-1 rounded">ALTO</span>
                                )}
                            </td>

                            {/* Lucro R$ (Gray) */}
                            <td className={`px-4 py-3 text-center font-bold font-mono bg-gray-900/50 border-r border-gray-800 ${profitValue < 0 ? 'text-red-500' : 'text-gray-200'}`}>
                                R$ {profitValue.toFixed(2)}
                            </td>

                            {/* Lucro % (Gray) */}
                            <td className={`px-4 py-3 text-center font-bold bg-gray-900/50 border-r border-gray-800 ${profitPercent < 0 ? 'text-red-500' : 'text-gray-200'}`}>
                                {(profitPercent * 100).toFixed(2)}%
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 text-center bg-gray-900/50">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border border-transparent ${statusBg} ${statusColor}`}>
                                    {statusLabel}
                                </span>
                            </td>
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
