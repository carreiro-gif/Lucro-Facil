
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash, Edit2, ShoppingBag, X, AlertTriangle, HelpCircle } from 'lucide-react';
import { Combo, ComboItem } from '../types';

const Combos: React.FC = () => {
  const { 
    combos, 
    products, 
    getProductCMV, 
    calculateTotalCfiPercent, 
    platformConfig,
    addCombo,
    updateCombo,
    deleteCombo
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [profitMargin, setProfitMargin] = useState(15); 
  const [items, setItems] = useState<ComboItem[]>([]);

  // Marketplace State (Simulation)
  const [ifoodFee, setIfoodFee] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [coupon, setCoupon] = useState(0);
  
  const [food99Fee, setFood99Fee] = useState(0);
  const [keetaFee, setKeetaFee] = useState(0);
  const [ciVal, setCiVal] = useState(0);

  // Calculated values for display
  const totalCfiPercent = calculateTotalCfiPercent();
  
  // Default Fees from Config
  const ifoodTotalFeeDefault = platformConfig.ifood.fee + platformConfig.ifood.onlinePayment + platformConfig.ifood.anticipation;
  const food99TotalFeeDefault = platformConfig.food99.fee + platformConfig.food99.onlinePayment + platformConfig.food99.anticipation;
  const keetaTotalFeeDefault = platformConfig.keeta.fee + platformConfig.keeta.onlinePayment + platformConfig.keeta.anticipation;

  const handleOpenModal = (combo?: Combo) => {
    if (combo) {
      setEditingId(combo.id);
      setName(combo.name);
      setProfitMargin(combo.profitMargin);
      setItems(combo.items);
      
      // Load saved values
      setIfoodFee(combo.ifoodFee);
      setDelivery(combo.delivery);
      setCoupon(combo.coupon);
      setFood99Fee(combo.food99Fee); // Combo type has this

      // Load defaults for non-persisted fields (Simulation only)
      setKeetaFee(keetaTotalFeeDefault);
      setCiVal(platformConfig.ifood.ciValue);
    } else {
      setEditingId(null);
      setName('');
      setProfitMargin(15);
      setItems([]);
      
      // Load defaults
      setIfoodFee(ifoodTotalFeeDefault);
      setDelivery(platformConfig.ifood.delivery);
      setCoupon(0);
      setFood99Fee(food99TotalFeeDefault);
      setKeetaFee(keetaTotalFeeDefault);
      setCiVal(platformConfig.ifood.ciValue);
    }
    setIsModalOpen(true);
  };

  const addItem = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const updateItem = (index: number, field: keyof ComboItem, value: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations Logic - NEW OFFICIAL FORMULA (Denominator)
  const calculateCombo = () => {
    // 1. CMV Combo
    let cmvCombo = 0;
    items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        cmvCombo += getProductCMV(prod) * item.quantity;
      }
    });

    // 2. PV Loja
    const totalDeductions = (totalCfiPercent + profitMargin) / 100;
    let pvLoja = 0;
    if (totalDeductions < 1) {
       pvLoja = cmvCombo / (1 - totalDeductions);
    }

    // Helper for Marketplace Formula: (PV_Loja + Del + CI + Coupon) / (1 - Fees)
    const calcMarketplace = (base: number, feesPct: number, del: number, ci: number, cpn: number) => {
        const denominator = 1 - (feesPct / 100);
        if (denominator <= 0) return 0;
        return (base + del + ci + cpn) / denominator;
    };

    // 3. PV iFood
    const pvIfood = calcMarketplace(pvLoja, ifoodFee, delivery, 0, coupon);

    // 4. PV CI
    const pvCi = calcMarketplace(pvLoja, ifoodFee, delivery, ciVal, coupon);

    // 5. PV 99Food
    const pv99 = calcMarketplace(pvLoja, food99Fee, delivery, 0, coupon);

    // 6. PV Keeta
    const pvKeeta = calcMarketplace(pvLoja, keetaFee, delivery, 0, coupon);

    return { cmvCombo, pvLoja, pvIfood, pvCi, pv99, pvKeeta };
  };

  const { cmvCombo, pvLoja, pvIfood, pvCi, pv99, pvKeeta } = calculateCombo();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const payload = {
      name,
      items,
      profitMargin,
      ifoodFee, 
      food99Fee, 
      delivery,
      coupon
    };

    if (editingId) {
      updateCombo(editingId, payload);
    } else {
      addCombo({ ...payload, id: Date.now().toString() });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">Combos</h2>
            <button 
                onClick={() => setShowHelp(!showHelp)} 
                className="text-gray-400 hover:text-brand-red transition-colors"
                title="Ajuda"
            >
                <HelpCircle size={20} />
            </button>
           </div>
          <p className="text-gray-500 dark:text-gray-400">Crie estratégias de venda com precificação automática por canal.</p>

           {showHelp && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in mt-4 max-w-3xl shadow-sm">
                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
                <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2"><HelpCircle size={16}/> Venda Mais com Combos</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Combos aumentam o ticket médio. Aqui você seleciona produtos já cadastrados para criar um pacote.
                    <br/><br/>
                    O sistema soma o CMV de todos os itens e calcula o preço de venda ideal para o Combo, permitindo que você defina uma margem de lucro específica para essa promoção (geralmente menor que a do item avulso para atrair o cliente).
                </p>
            </div>
           )}
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-red hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 font-bold transition shadow-lg shadow-red-900/20"
        >
          <Plus size={18} /> <span className="hidden sm:inline">NOVO COMBO</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">
               <tr>
                  <th className="px-6 py-4">Nome do Combo</th>
                  <th className="px-6 py-4 text-center">Itens</th>
                  <th className="px-6 py-4 text-center">Lucro Estim.</th>
                  <th className="px-6 py-4 text-right">CMV Combo</th>
                  <th className="px-6 py-4 text-right">PV Loja</th>
                  <th className="px-6 py-4 text-right text-[#E53935]">PV iFood</th>
                  <th className="px-6 py-4 text-right text-[#B71C1C]">PV CI</th>
                  <th className="px-6 py-4 text-right text-[#43A047]">PV 99</th>
                  <th className="px-6 py-4 text-right text-[#1E88E5]">PV Keeta</th>
                  <th className="px-6 py-4 text-center">Ações</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
               {combos.map(combo => {
                 let cmv = 0;
                 combo.items.forEach(i => {
                    const p = products.find(prod => prod.id === i.productId);
                    if(p) cmv += getProductCMV(p) * i.quantity;
                 });
                 
                 const deductions = (totalCfiPercent + combo.profitMargin) / 100;
                 const pvLojaVal = deductions < 1 ? cmv / (1 - deductions) : 0;
                 
                 // --- Marketplaces Calculations for Table ---
                 const calcMarketplace = (base: number, feesPct: number, del: number, ci: number, cpn: number) => {
                    const denominator = 1 - (feesPct / 100);
                    if (denominator <= 0) return 0;
                    return (base + del + ci + cpn) / denominator;
                 };

                 // iFood
                 const pvIfoodVal = calcMarketplace(pvLojaVal, combo.ifoodFee, combo.delivery, 0, combo.coupon);
                 
                 // iFood CI (Uses global CI Value)
                 const pvCiVal = calcMarketplace(pvLojaVal, combo.ifoodFee, combo.delivery, platformConfig.ifood.ciValue, combo.coupon);

                 // 99Food
                 const pv99Val = calcMarketplace(pvLojaVal, combo.food99Fee, combo.delivery, 0, combo.coupon);

                 // Keeta (Uses global Keeta Fees)
                 const keetaTotalFee = platformConfig.keeta.fee + platformConfig.keeta.onlinePayment + platformConfig.keeta.anticipation;
                 const pvKeetaVal = calcMarketplace(pvLojaVal, keetaTotalFee, combo.delivery, 0, combo.coupon);

                 return (
                   <tr key={combo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{combo.name}</td>
                      <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{combo.items.length}</td>
                      <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{combo.profitMargin}%</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-300">R$ {cmv.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-white">R$ {pvLojaVal.toFixed(2)}</td>
                      
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#E53935]">R$ {pvIfoodVal.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#B71C1C]">R$ {pvCiVal.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#43A047]">R$ {pv99Val.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#1E88E5]">R$ {pvKeetaVal.toFixed(2)}</td>

                      <td className="px-6 py-4 flex justify-center gap-3">
                         <button onClick={() => handleOpenModal(combo)} className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"><Edit2 size={16} /></button>
                         <button onClick={() => deleteCombo(combo.id)} className="text-gray-400 hover:text-red-500"><Trash size={16} /></button>
                      </td>
                   </tr>
                 );
               })}
               {combos.length === 0 && (
                 <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">Nenhum combo cadastrado.</td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in">
              
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                    <ShoppingBag size={20} className="text-brand-red" />
                    {editingId ? 'Editar Combo' : 'Novo Combo'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 
                 {/* LINHA 1: Nome e Lucro */}
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-9">
                        <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Nome do Combo</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-3 text-sm focus:border-brand-red outline-none font-bold" placeholder="Ex: Combo Família" />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Lucro Estimado (%)</label>
                        <input type="number" step="0.1" value={profitMargin} onChange={e => setProfitMargin(parseFloat(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-3 text-sm focus:border-brand-red outline-none font-bold text-center" />
                    </div>
                 </div>

                 {/* LINHA 2: Indicadores Principais */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block">Qtd Produtos</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-200">{items.length}</span>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block">CFI da Empresa</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-200">{totalCfiPercent.toFixed(2)}%</span>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block">CMV Combo</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-200">R$ {cmvCombo.toFixed(2)}</span>
                     </div>
                     <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-brand-red/20 dark:border-white/20 relative overflow-hidden shadow-lg">
                         <div className="absolute top-0 right-0 p-8 bg-brand-red/10 rounded-full blur-xl -mr-4 -mt-4 pointer-events-none"></div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block relative z-10">PV Loja (Sugerido)</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white relative z-10">R$ {pvLoja.toFixed(2)}</span>
                     </div>
                 </div>

                 {/* LINHA 3: Items Table (MOVED UP) */}
                 <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-4 shadow-sm">
                    <div className="bg-gray-50 dark:bg-[#0f111a] px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                       <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                          <ShoppingBag size={14} className="text-brand-red"/> Produtos do Combo
                       </h4>
                       <button onClick={addItem} className="text-xs bg-brand-red hover:bg-red-700 text-white px-3 py-1.5 rounded transition flex items-center gap-1 font-bold shadow-md">
                          <Plus size={14} /> Adicionar Item
                       </button>
                    </div>
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-[10px] uppercase font-bold">
                          <tr>
                             <th className="px-4 py-2">Produto (Cardápio)</th>
                             <th className="px-4 py-2 text-center w-24">Qtd</th>
                             <th className="px-4 py-2 text-right">CMV Unit.</th>
                             <th className="px-4 py-2 text-right">Subtotal CMV</th>
                             <th className="px-4 py-2 w-10"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                          {items.map((item, idx) => {
                             const product = products.find(p => p.id === item.productId);
                             const cmvUnit = product ? getProductCMV(product) : 0;
                             
                             return (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                   <td className="px-4 py-2">
                                      <select 
                                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs p-2 rounded w-full outline-none focus:border-brand-red"
                                        value={item.productId}
                                        onChange={e => updateItem(idx, 'productId', e.target.value)}
                                      >
                                         {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                         ))}
                                      </select>
                                   </td>
                                   <td className="px-4 py-2 text-center">
                                      <input 
                                        type="number" 
                                        min="1"
                                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs p-2 rounded w-20 text-center outline-none focus:border-brand-red font-bold"
                                        value={item.quantity}
                                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                      />
                                   </td>
                                   <td className="px-4 py-2 text-right text-gray-500 font-mono text-xs">R$ {cmvUnit.toFixed(2)}</td>
                                   <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300 font-mono font-bold">R$ {(cmvUnit * item.quantity).toFixed(2)}</td>
                                   <td className="px-4 py-2 text-center">
                                      <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition"><Trash size={16} /></button>
                                   </td>
                                </tr>
                             );
                          })}
                          {items.length === 0 && (
                             <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic text-xs">Clique em "Adicionar Item" para montar seu combo.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>

                 {/* LINHAS MARKETPLACES (MOVED DOWN) */}
                 <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                     <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Precificação nos Apps</h4>
                     
                     {/* LINHA 3: iFood */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 dark:bg-gray-950/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800/50">
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Taxa iFood (Total %)</label>
                            <input type="number" step="0.1" value={ifoodFee} onChange={e => setIfoodFee(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Entrega (R$)</label>
                            <input type="number" step="0.01" value={delivery} onChange={e => setDelivery(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Cupom (R$)</label>
                            <input type="number" step="0.01" value={coupon} onChange={e => setCoupon(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div className="bg-[#E53935] p-2 rounded-lg text-center shadow-lg">
                            <span className="text-[9px] text-white/80 uppercase font-bold block mb-0.5">PV iFood (Oficial)</span>
                            <span className="text-xl font-bold text-white">R$ {pvIfood.toFixed(2)}</span>
                         </div>
                     </div>

                     {/* LINHA 4: iFood CI */}
                     <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-gray-50 dark:bg-gray-950/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800/50">
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Taxa iFood (Total %)</label>
                            <input type="number" step="0.1" value={ifoodFee} onChange={e => setIfoodFee(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Entrega (R$)</label>
                            <input type="number" step="0.01" value={delivery} onChange={e => setDelivery(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Cupom (R$)</label>
                            <input type="number" step="0.01" value={coupon} onChange={e => setCoupon(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">CI (R$)</label>
                            <input type="number" step="0.01" value={ciVal} onChange={e => setCiVal(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div className="bg-[#B71C1C] p-2 rounded-lg text-center shadow-lg">
                            <span className="text-[9px] text-white/80 uppercase font-bold block mb-0.5">PV iFood CI</span>
                            <span className="text-xl font-bold text-white">R$ {pvCi.toFixed(2)}</span>
                         </div>
                     </div>

                     {/* LINHA 5: 99Food */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 dark:bg-gray-950/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800/50">
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Taxa 99Food (Total %)</label>
                            <input type="number" step="0.1" value={food99Fee} onChange={e => setFood99Fee(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Entrega (R$)</label>
                            <input type="number" step="0.01" value={delivery} onChange={e => setDelivery(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Cupom (R$)</label>
                            <input type="number" step="0.01" value={coupon} onChange={e => setCoupon(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div className="bg-[#43A047] p-2 rounded-lg text-center shadow-lg">
                            <span className="text-[9px] text-white/80 uppercase font-bold block mb-0.5">PV 99Food (Oficial)</span>
                            <span className="text-xl font-bold text-white">R$ {pv99.toFixed(2)}</span>
                         </div>
                     </div>

                     {/* LINHA 6: Keeta */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 dark:bg-gray-950/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800/50">
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Taxa Keeta (Total %)</label>
                            <input type="number" step="0.1" value={keetaFee} onChange={e => setKeetaFee(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Entrega (R$)</label>
                            <input type="number" step="0.01" value={delivery} onChange={e => setDelivery(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Cupom (R$)</label>
                            <input type="number" step="0.01" value={coupon} onChange={e => setCoupon(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded p-2 text-sm focus:border-brand-red outline-none" />
                         </div>
                         <div className="bg-[#1E88E5] p-2 rounded-lg text-center shadow-lg">
                            <span className="text-[9px] text-white/80 uppercase font-bold block mb-0.5">PV Keeta (Oficial)</span>
                            <span className="text-xl font-bold text-white">R$ {pvKeeta.toFixed(2)}</span>
                         </div>
                     </div>

                 </div>

              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold transition">Cancelar</button>
                 <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-brand-red hover:bg-red-700 text-white font-bold shadow-lg shadow-red-900/20 transition">Salvar Combo</button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default Combos;
