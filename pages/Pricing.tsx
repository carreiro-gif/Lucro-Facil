
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calculator, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { Product } from '../types';
import { formatPercent } from '../constants';

const Pricing: React.FC = () => {
  const { 
    cfi, 
    platformConfig, 
    calculateFixedCostPercent,
    updateProduct,
    getSortedProducts,
    getProductCMV
  } = useApp();
  const [showHelp, setShowHelp] = useState(false);

  const fixedCostPct = calculateFixedCostPercent();
  const avgCardRate = (cfi.debitTax + cfi.creditTax) / 2;
  const variableCostsPct = avgCardRate + cfi.tax + cfi.royalties + cfi.marketing + cfi.voucherTax;
  const totalCfiCost = fixedCostPct + variableCostsPct;

  // Use the sorted list from context with Guard
  const sortedProducts = useMemo(() => getSortedProducts() || [], [getSortedProducts]);

  const calculateStorePrice = (cmv: number, profitMargin: number) => {
    const totalDeductions = (totalCfiCost + profitMargin) / 100;
    if (totalDeductions >= 1) return 0; 
    return cmv / (1 - totalDeductions);
  };

  const calculateMarketplacePrice = (pvLoja: number, feesPct: number, delivery: number, ci: number, coupon: number) => {
      const denominator = 1 - (feesPct / 100);
      if (denominator <= 0) return 0;
      return (pvLoja + delivery + ci + coupon) / denominator;
  };

  const handleUpdate = (productId: string, section: 'pricing', key: string, value: number) => {
      const product = sortedProducts.find(p => p.id === productId);
      if (!product) return;
      const newPricing = { ...product.pricing };
      if (key.includes('.')) {
          const [parent, child] = key.split('.');
          // @ts-ignore
          newPricing[parent] = { ...newPricing[parent], [child]: value };
      } else {
          // @ts-ignore
          newPricing[key] = value;
      }
      updateProduct(productId, { pricing: newPricing });
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase">Preço de Venda</h2>
            <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-brand-red transition-colors"><HelpCircle size={20} /></button>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Sugestão de preços baseada na sua estrutura de custos e metas de lucro.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm flex gap-6 shadow-lg">
            <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">CFI Total (Fixo+Var)</span>
                <span className="text-xl font-bold text-brand-red">{formatPercent(totalCfiCost)}</span>
            </div>
        </div>
      </div>

      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm">
            <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Como usar esta tela?</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Os itens aparecem na mesma ordem definida na aba <strong>Ficha Técnica</strong>.
                <br/>
                Os campos editáveis permitem ajustar margens e taxas específicas para cada produto se necessário.
            </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto overflow-y-visible pb-2" style={{ scrollbarGutter: 'stable' }}>
            <table className="w-full text-left border-collapse min-w-[2400px]" style={{ tableLayout: 'fixed' }}>
            <thead>
                <tr className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3 border-b border-gray-200 dark:border-gray-800 sticky left-0 z-30 bg-gray-50 dark:bg-[#0f111a] w-56 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Produto</th>
                    <th className="p-3 border-b border-gray-200 dark:border-gray-800 text-center bg-gray-50 dark:bg-[#0f111a] w-24">CMV + Emb</th>
                    <th className="p-3 border-b border-gray-200 dark:border-gray-800 text-center bg-gray-50 dark:bg-[#0f111a] w-20">CFI %</th>
                    <th className="p-3 border-b border-gray-200 dark:border-gray-800 text-center w-24 bg-gray-50 dark:bg-[#0f111a]">Lucro %</th>
                    <th className="p-3 border-b border-gray-200 dark:border-gray-800 text-center w-32 bg-gray-200 dark:bg-[#1f2937] text-gray-900 dark:text-white border-x border-gray-300 dark:border-gray-700">PV Loja</th>
                    <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center border-l border-gray-200 dark:border-gray-800 w-20 text-red-900 dark:text-red-100">Ifood %</th>
                    <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center w-20 text-red-900 dark:text-red-100">Online %</th>
                    <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center w-20 text-red-900 dark:text-red-100">Antec. %</th>
                    <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center w-24 text-red-900 dark:text-red-100">Entrega R$</th>
                    <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center w-24 text-red-900 dark:text-red-100">Cupom R$</th>
                    <th className="p-3 border-b border-red-200 dark:border-gray-800 bg-brand-red text-center text-white font-bold border-x border-red-300 dark:border-red-800 w-32">PV Ifood</th>
                    <th className="p-3 border-b border-purple-100 dark:border-gray-800 bg-purple-50 dark:bg-purple-900/10 text-center w-24 text-purple-900 dark:text-purple-100">CI (R$)</th>
                    <th className="p-3 border-b border-purple-200 dark:border-gray-800 bg-purple-600 text-center text-white font-bold border-x border-purple-300 dark:border-purple-800 w-32">PV CI</th>
                    <th className="p-3 border-b border-yellow-100 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-20 text-yellow-900 dark:text-yellow-100">Taxa %</th>
                    <th className="p-3 border-b border-yellow-100 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-20 text-yellow-900 dark:text-yellow-100">Online %</th>
                    <th className="p-3 border-b border-yellow-100 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-24 text-yellow-900 dark:text-yellow-100">Entrega R$</th>
                    <th className="p-3 border-b border-yellow-100 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-20 text-yellow-900 dark:text-yellow-100">Antec. %</th>
                    <th className="p-3 border-b border-yellow-100 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-24 text-yellow-900 dark:text-yellow-100">Cupom R$</th>
                    <th className="p-3 border-b border-yellow-200 dark:border-gray-800 bg-yellow-600 text-center text-white font-bold border-x border-yellow-300 dark:border-yellow-700 w-32">PV 99Food</th>
                    <th className="p-3 border-b border-orange-100 dark:border-gray-800 bg-orange-50 dark:bg-orange-900/10 text-center w-20 text-orange-900 dark:text-orange-100">Taxa %</th>
                    <th className="p-3 border-b border-orange-100 dark:border-gray-800 bg-orange-50 dark:bg-orange-900/10 text-center w-20 text-orange-900 dark:text-orange-100">Online %</th>
                    <th className="p-3 border-b border-orange-100 dark:border-gray-800 bg-orange-50 dark:bg-orange-900/10 text-center w-24 text-orange-900 dark:text-orange-100">Entrega R$</th>
                    <th className="p-3 border-b border-orange-100 dark:border-gray-800 bg-orange-50 dark:bg-orange-900/10 text-center w-20 text-orange-900 dark:text-orange-100">Antec. %</th>
                    <th className="p-3 border-b border-orange-100 dark:border-gray-800 bg-orange-50 dark:bg-orange-900/10 text-center w-24 text-orange-900 dark:text-orange-100">Cupom R$</th>
                    <th className="p-3 border-b border-orange-200 dark:border-gray-800 bg-orange-600 text-center text-white font-bold border-x border-orange-300 dark:border-orange-700 w-32">PV Keeta</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {sortedProducts.map(product => {
                    const cmv = getProductCMV(product);
                    const pricing = product.pricing || {};
                    const profitMargin = pricing.profitMargin !== undefined ? pricing.profitMargin : 20; 
                    const storePrice = calculateStorePrice(cmv, profitMargin);

                    const ifoodFee = pricing.ifood?.fee ?? platformConfig.ifood.fee;
                    const ifoodOnline = pricing.ifood?.onlinePayment ?? platformConfig.ifood.onlinePayment;
                    const ifoodAntic = pricing.ifood?.anticipation ?? platformConfig.ifood.anticipation;
                    const ifoodDel = pricing.ifood?.delivery ?? platformConfig.ifood.delivery;
                    const ifoodCoupon = pricing.ifood?.coupon ?? 0;
                    const ifoodPrice = calculateMarketplacePrice(storePrice, ifoodFee + ifoodOnline + ifoodAntic, ifoodDel, 0, ifoodCoupon);

                    const ciVal = pricing.ifood?.ciValue ?? platformConfig.ifood.ciValue;
                    const ifoodCIPrice = calculateMarketplacePrice(storePrice, ifoodFee + ifoodOnline + ifoodAntic, ifoodDel, ciVal, ifoodCoupon);

                    const food99Fee = pricing.food99?.fee ?? platformConfig.food99.fee;
                    const food99Online = pricing.food99?.onlinePayment ?? platformConfig.food99.onlinePayment;
                    const food99Del = pricing.food99?.delivery ?? platformConfig.food99.delivery;
                    const food99Antic = pricing.food99?.anticipation ?? platformConfig.food99.anticipation;
                    const food99Coupon = pricing.food99?.coupon ?? 0;
                    const food99Price = calculateMarketplacePrice(storePrice, food99Fee + food99Online + food99Antic, food99Del, 0, food99Coupon);

                    const keetaFee = pricing.keeta?.fee ?? platformConfig.keeta.fee;
                    const keetaOnline = pricing.keeta?.onlinePayment ?? platformConfig.keeta.onlinePayment;
                    const keetaDel = pricing.keeta?.delivery ?? platformConfig.keeta.delivery;
                    const keetaAntic = pricing.keeta?.anticipation ?? platformConfig.keeta.anticipation;
                    const keetaCoupon = pricing.keeta?.coupon ?? 0;
                    const keetaPrice = calculateMarketplacePrice(storePrice, keetaFee + keetaOnline + keetaAntic, keetaDel, 0, keetaCoupon);

                    return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition group">
                            <td className="p-3 font-bold text-gray-900 dark:text-white sticky left-0 z-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[224px]" title={product.name}>
                                {product.name}
                            </td>
                            <td className="p-3 text-gray-500 dark:text-gray-400 text-center font-mono bg-gray-50 dark:bg-gray-900/50">R$ {cmv.toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50">{formatPercent(totalCfiCost)}</td>
                            <td className="p-3 text-center bg-gray-50 dark:bg-gray-900/50">
                                <input type="number" step="0.1" className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-transparent text-gray-900 dark:text-white w-12 text-center rounded focus:outline-none focus:ring-1 focus:ring-brand-red" value={profitMargin} onChange={(e) => handleUpdate(product.id, 'pricing', 'profitMargin', parseFloat(e.target.value))} />
                            </td>
                            <td className="p-3 text-center font-bold text-lg text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 border-x border-gray-300 dark:border-gray-700">R$ {storePrice.toFixed(2)}</td>
                            <td className="p-3 text-center bg-red-50 dark:bg-red-900/5 border-l border-gray-200 dark:border-gray-800"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodFee} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.fee', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-red-50 dark:bg-red-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodOnline} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.onlinePayment', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-red-50 dark:bg-red-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodAntic} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.anticipation', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-red-50 dark:bg-red-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodDel} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.delivery', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-red-50 dark:bg-red-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodCoupon} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.coupon', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-brand-red border-x border-red-300 dark:border-red-800">R$ {ifoodPrice.toFixed(2)}</td>
                            <td className="p-3 text-center bg-purple-50 dark:bg-purple-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-purple-300 dark:hover:border-gray-600 focus:border-purple-500" value={ciVal} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.ciValue', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-purple-600 border-x border-purple-300 dark:border-purple-800">R$ {ifoodCIPrice.toFixed(2)}</td>
                            <td className="p-3 text-center bg-yellow-50 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Fee} onChange={e => handleUpdate(product.id, 'pricing', 'food99.fee', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-yellow-50 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Online} onChange={e => handleUpdate(product.id, 'pricing', 'food99.onlinePayment', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-yellow-50 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Del} onChange={e => handleUpdate(product.id, 'pricing', 'food99.delivery', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-yellow-50 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Antic} onChange={e => handleUpdate(product.id, 'pricing', 'food99.anticipation', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-yellow-50 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Coupon} onChange={e => handleUpdate(product.id, 'pricing', 'food99.coupon', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-yellow-600 border-x border-yellow-300 dark:border-yellow-700">R$ {food99Price.toFixed(2)}</td>
                            <td className="p-3 text-center bg-orange-50 dark:bg-orange-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-orange-300 dark:hover:border-gray-600 focus:border-orange-500" value={keetaFee} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.fee', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-orange-50 dark:bg-orange-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-orange-300 dark:hover:border-gray-600 focus:border-orange-500" value={keetaOnline} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.onlinePayment', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-orange-50 dark:bg-orange-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-orange-300 dark:hover:border-gray-600 focus:border-orange-500" value={keetaDel} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.delivery', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-orange-50 dark:bg-orange-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-orange-300 dark:hover:border-gray-600 focus:border-orange-500" value={keetaAntic} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.anticipation', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center bg-orange-50 dark:bg-orange-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-orange-300 dark:hover:border-gray-600 focus:border-orange-500" value={keetaCoupon} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.coupon', parseFloat(e.target.value))} /></td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-orange-600 border-x border-orange-300 dark:border-orange-700">R$ {keetaPrice.toFixed(2)}</td>
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

export default Pricing;
