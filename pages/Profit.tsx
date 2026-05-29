
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ScrollText, Info, HelpCircle, X } from 'lucide-react';
import { formatPercent } from '../constants';
import { Product, Combo } from '../types';

type MergedItem = {
    type: 'product' | 'combo';
    data: Product | Combo;
};

const Profit: React.FC = () => {
  const { 
    products,
    combos,
    menuCategories,
    calculateTotalCfiPercent,
    updateProduct,
    updateCombo,
    getSortedProducts,
    getProductCMV
  } = useApp();
  const [showHelp, setShowHelp] = useState(false);

  const totalCfiPercent = calculateTotalCfiPercent();
  
  const sortedCategories = useMemo(() => [...(menuCategories || [])].sort((a,b) => a.order - b.order), [menuCategories]);
  const sortedProducts = useMemo(() => getSortedProducts() || [], [getSortedProducts, products]);

  const getComboCMV = (combo: Combo) => {
    let cmvCombo = 0;
    combo.items.forEach(item => {
        const prod = (products || []).find(p => p.id === item.productId);
        if (prod) {
            cmvCombo += getProductCMV(prod) * item.quantity;
        }
    });
    cmvCombo += (combo.customPackagingCost || 0);
    return cmvCombo;
  };

  // Grouped by Category in exact order
  const filteredItemsByGroup = useMemo(() => {
    const groups: Record<string, MergedItem[]> = {};

    sortedCategories.forEach(cat => groups[cat.name] = []);
    groups['Sem Categoria'] = [];
    groups['Padrão'] = []; // For combos specifically

    (sortedProducts || []).forEach((p: Product) => {
        const resolvedCategoryName = groups[p.category] ? p.category : (sortedCategories.find(c => c.id === p.category)?.name || 'Sem Categoria');
        if (groups[resolvedCategoryName]) groups[resolvedCategoryName].push({ type: 'product', data: p });
        else groups['Sem Categoria'].push({ type: 'product', data: p });
    });

    (combos || []).forEach((c: Combo) => {
        const catName = c.category || 'Padrão';
        if (!groups[catName]) {
            groups[catName] = []; // Create custom combo categories if they don't exist in product menu categories
        }
        groups[catName].push({ type: 'combo', data: c });
    });

    return groups;
  }, [sortedProducts, combos, sortedCategories]);

  const allCategoryNamesTemp = [
      ...sortedCategories.map(c => c.name),
      'Sem Categoria',
      'Padrão'
  ];
  const dynamicComboCats = Object.keys(filteredItemsByGroup).filter(c => !allCategoryNamesTemp.includes(c));
  const finalCategoryOrder = [...allCategoryNamesTemp, ...dynamicComboCats];

  const handleValueChange = (itemId: string, itemType: 'product' | 'combo', field: 'price' | 'delivery', value: string) => {
    const numValue = parseFloat(value) || 0;
    
    if (itemType === 'product') {
        const product = sortedProducts.find(p => p.id === itemId);
        if (product) {
          if (field === 'price') {
            updateProduct(itemId, { fixedPriceStore: numValue });
          } else {
            const newPricing = { ...product.pricing, keeta: { ...product.pricing?.keeta, delivery: numValue } };
            updateProduct(itemId, { pricing: newPricing as any });
          }
        }
    } else {
        const combo = (combos || []).find(c => c.id === itemId);
        if (combo) {
            if (field === 'price') {
                updateCombo(itemId, { fixedPriceStore: numValue });
            } else {
                updateCombo(itemId, { keetaDelivery: numValue });
            }
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

      <div className="md:hidden flex items-center gap-2 justify-center bg-brand-red/5 dark:bg-brand-red/10 border border-brand-red/10 dark:border-brand-red/20 text-brand-red dark:text-red-400 py-2 px-3 rounded-lg text-[11px] font-bold select-none shadow-sm mb-3">
        <span className="animate-bounce">↔</span>
        <span>DESLIZE A TABELA PARA OS LADOS PARA VER TODOS OS DADOS</span>
      </div>

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
                {(() => {
                    let globalIdx = 0;
                    return (
                        <>
                            {finalCategoryOrder.map(catName => {
                                const groupItems = filteredItemsByGroup[catName] || [];
                                if (groupItems.length === 0) return null;

                                return (
                                    <React.Fragment key={catName}>
                                        <tr className="bg-gray-100 dark:bg-[#1f2937] font-extrabold select-none">
                                            <td 
                                                className="px-4 py-3 bg-gray-100 dark:bg-[#1f2937] text-gray-900 dark:text-white uppercase tracking-wider text-[11px] font-black text-left" 
                                                colSpan={9}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {catName} 
                                                    <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                        {groupItems.length} ITENS
                                                    </span>
                                                </span>
                                            </td>
                                        </tr>
                                        {groupItems.map(item => {
                                            globalIdx++;
                                            const currentIdx = globalIdx;
                                            const isCombo = item.type === 'combo';
                                            const data = item.data;
                                            
                                            // Handle calculation differently for Product vs Combo
                                            const cmv = isCombo ? getComboCMV(data as Combo) : getProductCMV(data as Product);
                                            const pvAtual = data.fixedPriceStore || 0;
                                            const deliveryCost = isCombo 
                                                ? ((data as Combo).keetaDelivery || 0) 
                                                : ((data as Product).pricing?.keeta?.delivery || 0);

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
                                                <tr key={data.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition group">
                                                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">{currentIdx}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                                                        {data.name}
                                                        {isCombo && <span className="ml-2 text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Combo</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-center bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                                                        <input type="number" step="0.01" value={pvAtual || ''} placeholder="0.00" onChange={(e) => handleValueChange(data.id, item.type, 'price', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-center rounded p-1.5 focus:border-brand-red outline-none font-bold" />
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">{formatPercent(totalCfiPercent)}</td>
                                                    <td className="px-4 py-3 text-center bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                                                        <input type="number" step="0.01" value={deliveryCost || ''} placeholder="0.00" onChange={(e) => handleValueChange(data.id, item.type, 'delivery', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-center rounded p-1.5 focus:border-brand-red outline-none" />
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">R$ {cmv.toFixed(2)}</td>
                                                    <td className={`px-4 py-3 text-center font-bold font-mono bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 ${profitValue < 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>R$ {profitValue.toFixed(2)}</td>
                                                    <td className={`px-4 py-3 text-center font-bold bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 ${profitPercent < 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>{formatPercent(profitPercent * 100)}</td>
                                                    <td className="px-4 py-3 text-center bg-gray-50 dark:bg-gray-900/50"><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border border-transparent ${statusBg} ${statusColor}`}>{statusLabel}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </>
                    );
                })()}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Profit;
