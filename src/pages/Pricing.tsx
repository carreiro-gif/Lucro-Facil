import React from 'react';
import { useApp } from "../../context/AppContext";
import { Calculator, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

const Pricing: React.FC = () => {
  const { 
    products, 
    getProductCMV, 
    cfi, 
    platformConfig, 
    calculateFixedCostPercent,
    updateProduct
  } = useApp();

  const fixedCostPct = calculateFixedCostPercent();
  
  // Logic from CFI Page: Avg Card + Tax + Royalties + Marketing + Voucher
  const avgCardRate = (cfi.debitTax + cfi.creditTax) / 2;
  const variableCostsPct = avgCardRate + cfi.tax + cfi.royalties + cfi.marketing + cfi.voucherTax;
  
  // Total Cost Structure (CFI)
  const totalCfiCost = fixedCostPct + variableCostsPct;

  // Formula: PV Loja = CMV / (1 - (TotalCFI% + Profit%) / 100)
  const calculateStorePrice = (cmv: number, profitMargin: number) => {
    const totalDeductions = (totalCfiCost + profitMargin) / 100;
    if (totalDeductions >= 1) return 0; 
    return cmv / (1 - totalDeductions);
  };

  // OFFICIAL MARKETPLACE FORMULA (Denominator Method)
  // PV = (PV_Loja + Delivery + CI + Coupon) / (1 - TotalFees)
  const calculateMarketplacePrice = (
      pvLoja: number, 
      feesPct: number, 
      delivery: number, 
      ci: number, 
      coupon: number
  ) => {
      const totalFees = feesPct / 100;
      const denominator = 1 - totalFees;
      if (denominator <= 0) return 0; // Inviable fees
      
      // CI and Coupon are costs added to the base to preserve the net PV Loja
      const numerator = pvLoja + delivery + ci + coupon;
      return numerator / denominator;
  };

  const handleUpdate = (productId: string, section: 'pricing', key: string, value: number) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const newPricing = { ...product.pricing };
      
      // Parse key path (e.g., 'ifood.fee')
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
          <h2 className="text-3xl font-bold text-white mb-2">Preço de Venda</h2>
          <p className="text-gray-400">Precificação oficial via denominador (iFood/99/Keeta) para garantir margem líquida.</p>
        </div>
        
        {/* CFI Summary Box */}
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-sm flex gap-6 shadow-lg">
            <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">CFI Total (Fixo+Var)</span>
                <span className="text-xl font-bold text-brand-red">{totalCfiCost.toFixed(2)}%</span>
            </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto overflow-y-visible pb-2" style={{ scrollbarGutter: 'stable' }}>
            <table className="w-full text-left border-collapse min-w-[2400px]" style={{ tableLayout: 'fixed' }}>
            <thead>
                <tr className="bg-[#0f111a] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                    {/* PRODUCT INFO - STICKY HEADER */}
                    <th className="p-3 border-b border-gray-800 sticky left-0 z-30 bg-[#0f111a] w-56 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Produto</th>
                    
                    {/* Basic Metrics */}
                    <th className="p-3 border-b border-gray-800 text-center bg-[#0f111a] w-24">CMV + Emb</th>
                    <th className="p-3 border-b border-gray-800 text-center bg-[#0f111a] w-20">CFI %</th>
                    <th className="p-3 border-b border-gray-800 text-center w-24 bg-[#0f111a]">Lucro %</th>
                    <th className="p-3 border-b border-gray-800 text-center w-32 bg-[#1f2937] text-white border-x border-gray-700">PV Loja</th>

                    {/* IFOOD */}
                    <th className="p-3 border-b border-gray-800 bg-red-900/10 text-center border-l border-gray-800 w-20">Ifood %</th>
                    <th className="p-3 border-b border-gray-800 bg-red-900/10 text-center w-20">Online %</th>
                    <th className="p-3 border-b border-gray-800 bg-red-900/10 text-center w-20">Antec. %</th>
                    <th className="p-3 border-b border-gray-800 bg-red-900/10 text-center w-24">Entrega R$</th>
                    <th className="p-3 border-b border-gray-800 bg-red-900/10 text-center w-24">Cupom R$</th>
                    <th className="p-3 border-b border-gray-800 bg-brand-red text-center text-white font-bold border-x border-red-800 w-32">PV Ifood</th>

                    {/* CI */}
                    <th className="p-3 border-b border-gray-800 bg-purple-900/10 text-center w-24">CI (R$)</th>
                    <th className="p-3 border-b border-gray-800 bg-purple-600 text-center text-white font-bold border-x border-purple-800 w-32">PV CI</th>

                    {/* 99FOOD */}
                    <th className="p-3 border-b border-gray-800 bg-yellow-900/10 text-center w-20">Taxa %</th>
                    <th className="p-3 border-b border-gray-800 bg-yellow-900/10 text-center w-20">Online %</th>
                    <th className="p-3 border-b border-gray-800 bg-yellow-900/10 text-center w-24">Entrega R$</th>
                    <th className="p-3 border-b border-gray-800 bg-yellow-900/10 text-center w-20">Antec. %</th>
                    <th className="p-3 border-b border-gray-800 bg-yellow-900/10 text-center w-24">Cupom R$</th>
                    <th className="p-3 border-b border-gray-800 bg-yellow-600 text-center text-white font-bold border-x border-yellow-700 w-32">PV 99Food</th>

                    {/* KEETA */}
                    <th className="p-3 border-b border-gray-800 bg-orange-900/10 text-center w-20">Taxa %</th>
                    <th className="p-3 border-b border-gray-800 bg-orange-900/10 text-center w-20">Online %</th>
                    <th className="p-3 border-b border-gray-800 bg-orange-900/10 text-center w-24">Entrega R$</th>
                    <th className="p-3 border-b border-gray-800 bg-orange-900/10 text-center w-20">Antec. %</th>
                    <th className="p-3 border-b border-gray-800 bg-orange-900/10 text-center w-24">Cupom R$</th>
                    <th className="p-3 border-b border-gray-800 bg-orange-600 text-center text-white font-bold border-x border-orange-700 w-32">PV Keeta</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-xs">
                {products.map(product => {
                    const cmv = getProductCMV(product);
                    const pricing = product.pricing || {};

                    // --- LOJA CALCULATIONS ---
                    // Default Profit 20% if not set
                    const profitMargin = pricing.profitMargin !== undefined ? pricing.profitMargin : 20; 
                    const storePrice = calculateStorePrice(cmv, profitMargin);

                    // --- IFOOD CALCULATIONS ---
                    const ifoodFee = pricing.ifood?.fee ?? platformConfig.ifood.fee;
                    const ifoodOnline = pricing.ifood?.onlinePayment ?? platformConfig.ifood.onlinePayment;
                    const ifoodAntic = pricing.ifood?.anticipation ?? platformConfig.ifood.anticipation;
                    const ifoodDel = pricing.ifood?.delivery ?? platformConfig.ifood.delivery;
                    const ifoodCoupon = pricing.ifood?.coupon ?? 0;

                    const ifoodTotalFeePct = ifoodFee + ifoodOnline + ifoodAntic;
                    
                    // PV Ifood (No CI)
                    const ifoodPrice = calculateMarketplacePrice(storePrice, ifoodTotalFeePct, ifoodDel, 0, ifoodCoupon);

                    // --- CI CALCULATIONS (Based on Ifood Fees) ---
                    const ciVal = pricing.ifood?.ciValue ?? platformConfig.ifood.ciValue;
                    // PV Ifood CI (Includes CI cost in numerator to preserve net)
                    const ifoodCIPrice = calculateMarketplacePrice(storePrice, ifoodTotalFeePct, ifoodDel, ciVal, ifoodCoupon);

                    // --- 99FOOD CALCULATIONS ---
                    const food99Fee = pricing.food99?.fee ?? platformConfig.food99.fee;
                    const food99Online = pricing.food99?.onlinePayment ?? platformConfig.food99.onlinePayment;
                    const food99Del = pricing.food99?.delivery ?? platformConfig.food99.delivery;
                    const food99Antic = pricing.food99?.anticipation ?? platformConfig.food99.anticipation;
                    const food99Coupon = pricing.food99?.coupon ?? 0;

                    const food99TotalFeePct = food99Fee + food99Online + food99Antic;
                    const food99Price = calculateMarketplacePrice(storePrice, food99TotalFeePct, food99Del, 0, food99Coupon);

                    // --- KEETA CALCULATIONS ---
                    const keetaFee = pricing.keeta?.fee ?? platformConfig.keeta.fee;
                    const keetaOnline = pricing.keeta?.onlinePayment ?? platformConfig.keeta.onlinePayment;
                    const keetaDel = pricing.keeta?.delivery ?? platformConfig.keeta.delivery;
                    const keetaAntic = pricing.keeta?.anticipation ?? platformConfig.keeta.anticipation;
                    const keetaCoupon = pricing.keeta?.coupon ?? 0;

                    const keetaTotalFeePct = keetaFee + keetaOnline + keetaAntic;
                    const keetaPrice = calculateMarketplacePrice(storePrice, keetaTotalFeePct, keetaDel, 0, keetaCoupon);

                    return (
                        <tr key={product.id} className="hover:bg-gray-800/30 transition group">
                            {/* PRODUCT NAME - STICKY COLUMN */}
                            <td className="p-3 font-bold text-white sticky left-0 z-20 bg-gray-900 border-r border-gray-800 group-hover:bg-gray-800 transition-colors text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[224px]" title={product.name}>
                                {product.name}
                            </td>
                            
                            <td className="p-3 text-gray-400 text-center font-mono bg-gray-900/50">R$ {cmv.toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-500 bg-gray-900/50">{totalCfiCost.toFixed(2)}%</td>
                            <td className="p-3 text-center bg-gray-900/50">
                                <input 
                                    type="number" step="0.1"
                                    className="bg-gray-800 text-white w-12 text-center rounded focus:outline-none focus:ring-1 focus:ring-brand-red"
                                    value={profitMargin}
                                    onChange={(e) => handleUpdate(product.id, 'pricing', 'profitMargin', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-gray-800 border-x border-gray-700">
                                R$ {storePrice.toFixed(2)}
                            </td>

                            {/* IFOOD INPUTS */}
                            <td className="p-3 text-center bg-red-900/5 border-l border-gray-800">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-brand-red"
                                    value={ifoodFee} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.fee', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-red-900/5">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-brand-red"
                                    value={ifoodOnline} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.onlinePayment', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-red-900/5">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-brand-red"
                                    value={ifoodAntic} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.anticipation', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-red-900/5">
                                <input 
                                    type="number" step="0.1" className="w-12 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-brand-red"
                                    value={ifoodDel} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.delivery', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-red-900/5">
                                <input 
                                    type="number" step="0.1" className="w-12 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-brand-red"
                                    value={ifoodCoupon} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.coupon', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-brand-red border-x border-red-800">
                                R$ {ifoodPrice.toFixed(2)}
                            </td>

                            {/* CI INPUTS */}
                            <td className="p-3 text-center bg-purple-900/5">
                                <input 
                                    type="number" step="0.1" className="w-12 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-purple-500"
                                    value={ciVal} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.ciValue', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-purple-600 border-x border-purple-800">
                                R$ {ifoodCIPrice.toFixed(2)}
                            </td>

                            {/* 99 INPUTS */}
                            <td className="p-3 text-center bg-yellow-900/5">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-yellow-500"
                                    value={food99Fee} onChange={e => handleUpdate(product.id, 'pricing', 'food99.fee', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-yellow-900/5">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-yellow-500"
                                    value={food99Online} onChange={e => handleUpdate(product.id, 'pricing', 'food99.onlinePayment', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-yellow-900/5">
                                <input 
                                    type="number" step="0.1" className="w-12 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-yellow-500"
                                    value={food99Del} onChange={e => handleUpdate(product.id, 'pricing', 'food99.delivery', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-yellow-900/5">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-yellow-500"
                                    value={food99Antic} onChange={e => handleUpdate(product.id, 'pricing', 'food99.anticipation', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-yellow-900/5">
                                <input 
                                    type="number" step="0.1" className="w-12 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-yellow-500"
                                    value={food99Coupon} onChange={e => handleUpdate(product.id, 'pricing', 'food99.coupon', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-yellow-600 border-x border-yellow-700">
                                R$ {food99Price.toFixed(2)}
                            </td>

                            {/* KEETA INPUTS */}
                            <td className="p-3 text-center bg-orange-900/5">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-orange-500"
                                    value={keetaFee} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.fee', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-orange-900/5">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-orange-500"
                                    value={keetaOnline} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.onlinePayment', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-orange-900/5">
                                <input 
                                    type="number" step="0.1" className="w-12 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-orange-500"
                                    value={keetaDel} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.delivery', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-orange-900/5">
                                <input 
                                    type="number" step="0.1" className="w-10 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-orange-500"
                                    value={keetaAntic} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.anticipation', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center bg-orange-900/5">
                                <input 
                                    type="number" step="0.1" className="w-12 bg-transparent text-gray-300 text-center outline-none border-b border-transparent hover:border-gray-600 focus:border-orange-500"
                                    value={keetaCoupon} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.coupon', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="p-3 text-center font-bold text-lg text-white bg-orange-600 border-x border-orange-700">
                                R$ {keetaPrice.toFixed(2)}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
      </div>
      
      <div className="bg-gray-900 p-4 rounded-lg text-gray-400 text-[10px] md:text-xs flex flex-wrap gap-4 border border-gray-800">
         <div><strong>PV Loja:</strong> CMV / (1 - (CFI Total + Lucro)%)</div>
         <div><strong>PV Plataforma:</strong> (PV Loja + Entrega + CI + Cupom) / (1 - Taxas Totais%)</div>
         <div><strong>Taxas Totais:</strong> Taxa Mkt + Pgto Online + Antecipação</div>
         <div><strong>Nota:</strong> O cálculo pelo denominador garante que a loja receba o valor líquido esperado (PV Loja) mesmo após os descontos do marketplace.</div>
      </div>
    </div>
  );
};

export default Pricing;
