
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
/* Fixed: Added missing ChefHat import from lucide-react */
import { Plus, Trash, Edit2, ShoppingBag, X, AlertTriangle, HelpCircle, ChefHat } from 'lucide-react';
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

  // Body Scroll Lock & ESC Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) setIsModalOpen(false);
    };

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isModalOpen]);

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
    <>
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
                {(combos || []).map(combo => {
                  let cmv = 0;
                  (combo.items || []).forEach(i => {
                      const p = products.find(prod => prod.id === i.productId);
                      if(p) cmv += getProductCMV(p) * i.quantity;
                  });
                  
                  const deductions = (totalCfiPercent + combo.profitMargin) / 100;
                  const pvLojaVal = deductions < 1 ? cmv / (1 - deductions) : 0;
                  
                  const calcMarketplace = (base: number, feesPct: number, del: number, ci: number, cpn: number) => {
                      const denominator = 1 - (feesPct / 100);
                      if (denominator <= 0) return 0;
                      return (base + del + ci + cpn) / denominator;
                  };

                  const pvIfoodVal = calcMarketplace(pvLojaVal, combo.ifoodFee, combo.delivery, 0, combo.coupon);
                  const pvCiVal = calcMarketplace(pvLojaVal, combo.ifoodFee, combo.delivery, platformConfig.ifood.ciValue, combo.coupon);
                  const pv99Val = calcMarketplace(pvLojaVal, combo.food99Fee, combo.delivery, 0, combo.coupon);
                  const keetaTotalFee = platformConfig.keeta.fee + platformConfig.keeta.onlinePayment + platformConfig.keeta.anticipation;
                  const pvKeetaVal = calcMarketplace(pvLojaVal, keetaTotalFee, combo.delivery, 0, combo.coupon);

                  return (
                    <tr key={combo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{combo.name}</td>
                        <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{(combo.items || []).length}</td>
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
                {(combos || []).length === 0 && (
                  <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">Nenhum combo cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Editor Modal - GLOBAL LEVEL / TRUE FULL SCREEN */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[9999]"
          onClick={() => setIsModalOpen(false)}
        >
           <div 
              className="bg-white dark:bg-[#111827] w-full h-full flex flex-col relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
           >
              
              {/* Header Fixado */}
              <div className="p-5 sm:p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 bg-gray-50 dark:bg-[#0f111a]">
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase flex items-center gap-3">
                    <div className="bg-brand-red p-2 rounded-lg text-white">
                      <ShoppingBag size={24} />
                    </div>
                    {editingId ? 'Editar Combo' : 'Montar Novo Combo'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-red transition-colors p-2" aria-label="Fechar modal">
                    <X size={40} strokeWidth={2.5}/>
                 </button>
              </div>

              {/* Corpo com Rolagem */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-12 space-y-12 max-w-7xl mx-auto w-full">
                 
                 {/* LINHA 1: Nome e Lucro */}
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-9">
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-2 block">Nome Comercial do Combo</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-5 text-xl focus:ring-2 focus:ring-brand-red outline-none font-bold placeholder:opacity-30" placeholder="Ex: Combo Monstruoso 2.0" />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-2 block">Margem de Lucro Meta (%)</label>
                        <input type="number" step="0.1" value={profitMargin} onChange={e => setProfitMargin(parseFloat(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-5 text-xl focus:ring-2 focus:ring-brand-red outline-none font-bold text-center" />
                    </div>
                 </div>

                 {/* LINHA 2: Indicadores Principais */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-black block mb-2 tracking-tighter">Variedade de Itens</span>
                        <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{items.length}</span>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-black block mb-2 tracking-tighter">CFI Global Aplicado</span>
                        <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{totalCfiPercent.toFixed(2)}%</span>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-black block mb-2 tracking-tighter">Custo Total de Produção</span>
                        <span className="text-3xl font-black text-brand-red">R$ {cmvCombo.toFixed(2)}</span>
                     </div>
                     <div className="bg-brand-red p-6 rounded-2xl shadow-2xl shadow-red-900/30 relative overflow-hidden transition-transform hover:scale-[1.02]">
                         <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
                        <span className="text-[11px] text-white/80 uppercase font-black block relative z-10 mb-2 tracking-tighter">Preço Recomendado (Loja)</span>
                        <span className="text-4xl font-black text-white relative z-10">R$ {pvLoja.toFixed(2)}</span>
                     </div>
                 </div>

                 {/* LINHA 3: Items Table */}
                 <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gray-50 dark:bg-[#0f111a] px-8 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                       <h4 className="text-base font-black text-gray-900 dark:text-white uppercase flex items-center gap-3 tracking-widest">
                          <ChefHat size={20} className="text-brand-red"/> Composição do Combo
                       </h4>
                       <button onClick={addItem} className="bg-brand-red hover:bg-red-700 text-white px-8 py-3 rounded-xl transition flex items-center gap-3 font-black shadow-xl shadow-red-900/20 uppercase text-xs tracking-widest">
                          <Plus size={18} /> Incluir Produto
                       </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                           <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[11px] uppercase font-black tracking-[0.2em]">
                              <tr>
                                 <th className="px-8 py-5">Produto do Cardápio</th>
                                 <th className="px-8 py-5 text-center w-40">Quantidade</th>
                                 <th className="px-8 py-5 text-right">CMV Unitário</th>
                                 <th className="px-8 py-5 text-right">Subtotal CMV</th>
                                 <th className="px-8 py-5 w-20"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                              {items.map((item, idx) => {
                                 const product = products.find(p => p.id === item.productId);
                                 const cmvUnit = product ? getProductCMV(product) : 0;
                                 
                                 return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                       <td className="px-8 py-6">
                                          <select 
                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-base p-4 rounded-xl w-full outline-none focus:ring-2 focus:ring-brand-red font-bold"
                                            value={item.productId}
                                            onChange={e => updateItem(idx, 'productId', e.target.value)}
                                          >
                                             {(products || []).map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                             ))}
                                          </select>
                                       </td>
                                       <td className="px-8 py-6 text-center">
                                          <input 
                                            type="number" 
                                            min="1"
                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xl p-4 rounded-xl w-32 text-center outline-none focus:ring-2 focus:ring-brand-red font-black"
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                          />
                                       </td>
                                       <td className="px-8 py-6 text-right text-gray-500 font-mono font-bold text-base">R$ {cmvUnit.toFixed(2)}</td>
                                       <td className="px-8 py-6 text-right text-gray-900 dark:text-gray-100 font-mono font-black text-xl">R$ {(cmvUnit * item.quantity).toFixed(2)}</td>
                                       <td className="px-8 py-6 text-center">
                                          <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-3" aria-label="Remover item">
                                            <Trash size={24} />
                                          </button>
                                       </td>
                                    </tr>
                                 );
                              })}
                              {items.length === 0 && (
                                 <tr><td colSpan={5} className="px-8 py-24 text-center text-gray-500 italic text-lg opacity-40">Clique no botão acima para selecionar os itens que compõem este combo.</td></tr>
                              )}
                           </tbody>
                        </table>
                    </div>
                 </div>

                 {/* LINHAS MARKETPLACES */}
                 <div className="space-y-8 pt-12 border-t border-gray-200 dark:border-gray-800">
                     <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] mb-6 text-center">Simulação de Vendas nos Apps</h4>
                     
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* iFood Official */}
                        <div className="bg-red-50/30 dark:bg-red-950/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/30 flex flex-col justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-8">
                                <div>
                                    <label className="text-[10px] text-red-600 dark:text-red-400 uppercase font-black mb-1 block">Taxa iFood (%)</label>
                                    <input type="number" step="0.1" value={ifoodFee} onChange={e => setIfoodFee(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-red-600 dark:text-red-400 uppercase font-black mb-1 block">Taxa Entrega (R$)</label>
                                    <input type="number" step="0.01" value={delivery} onChange={e => setDelivery(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-red-600 dark:text-red-400 uppercase font-black mb-1 block">Cupom Loja (R$)</label>
                                    <input type="number" step="0.01" value={coupon} onChange={e => setCoupon(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                                </div>
                            </div>
                            <div className="bg-[#E53935] p-6 rounded-2xl text-center shadow-2xl shadow-red-900/40">
                                <span className="text-xs text-white/70 uppercase font-black block mb-1 tracking-widest">Preço para iFood (Oficial)</span>
                                <span className="text-4xl font-black text-white">R$ {pvIfood.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* iFood CI */}
                        <div className="bg-purple-50/30 dark:bg-purple-950/10 p-8 rounded-3xl border border-purple-100 dark:border-purple-900/30 flex flex-col justify-between">
                            <div className="mb-8">
                                <label className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-black mb-1 block">Custo Fixo CI (R$)</label>
                                <input type="number" step="0.01" value={ciVal} onChange={e => setCiVal(parseFloat(e.target.value))} className="w-full md:w-1/2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-purple-500 outline-none font-bold" />
                                <p className="text-[10px] text-purple-500 italic mt-3">*Considerando as mesmas taxas e entrega informadas no card ao lado.</p>
                            </div>
                            <div className="bg-[#B71C1C] p-6 rounded-2xl text-center shadow-2xl shadow-purple-900/40">
                                <span className="text-xs text-white/70 uppercase font-black block mb-1 tracking-widest">Preço para iFood com CI</span>
                                <span className="text-4xl font-black text-white">R$ {pvCi.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* 99Food */}
                        <div className="bg-green-50/30 dark:bg-green-950/10 p-8 rounded-3xl border border-green-100 dark:border-green-900/30 flex flex-col justify-between">
                            <div className="mb-8">
                                <label className="text-[10px] text-green-600 dark:text-green-400 uppercase font-black mb-1 block">Taxa Total 99Food (%)</label>
                                <input type="number" step="0.1" value={food99Fee} onChange={e => setFood99Fee(parseFloat(e.target.value))} className="w-full md:w-1/2 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-green-500 outline-none font-bold" />
                                <p className="text-[10px] text-green-500 italic mt-3">*Soma de comissão + pagamento online + antecipação se houver.</p>
                            </div>
                            <div className="bg-[#43A047] p-6 rounded-2xl text-center shadow-2xl shadow-green-900/40">
                                <span className="text-xs text-white/70 uppercase font-black block mb-1 tracking-widest">Preço para 99Food</span>
                                <span className="text-4xl font-black text-white">R$ {pv99.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Keeta */}
                        <div className="bg-blue-50/30 dark:bg-blue-950/10 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex flex-col justify-between">
                            <div className="mb-8">
                                <label className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-black mb-1 block">Taxa Total KeeTa (%)</label>
                                <input type="number" step="0.1" value={keetaFee} onChange={e => setKeetaFee(parseFloat(e.target.value))} className="w-full md:w-1/2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                                <p className="text-[10px] text-blue-500 italic mt-3">*Baseado nas taxas globais de 2025.</p>
                            </div>
                            <div className="bg-[#1E88E5] p-6 rounded-2xl text-center shadow-2xl shadow-blue-900/40">
                                <span className="text-xs text-white/70 uppercase font-black block mb-1 tracking-widest">Preço para KeeTa (Oficial)</span>
                                <span className="text-4xl font-black text-white">R$ {pvKeeta.toFixed(2)}</span>
                            </div>
                        </div>
                     </div>

                 </div>

              </div>
              
              {/* Rodapé Fixado com Botões Gigantes */}
              <div className="p-6 sm:p-10 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-6 shrink-0 bg-white dark:bg-[#0f111a]">
                 <button onClick={() => setIsModalOpen(false)} className="px-12 py-5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-black uppercase tracking-widest text-sm transition-all transform active:scale-95">Descartar</button>
                 <button onClick={handleSave} className="px-16 py-5 rounded-2xl bg-brand-red hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-900/40 transition-all transform hover:scale-[1.03] active:scale-95">Salvar Combo e Preços</button>
              </div>

           </div>
        </div>
      )}
    </>
  );
};

export default Combos;
