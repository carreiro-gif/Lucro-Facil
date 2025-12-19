
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MeasureUnit, Ingredient } from '../types';
import { Trash2, Plus, Edit2, Search, HelpCircle, X, Beef, Info } from 'lucide-react';

const Ingredients: React.FC = () => {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, getIngredientRealCost } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Initial form state to ensure all fields are controlled
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '',
    unit: MeasureUnit.UN,
    price: 0,
    packageQuantity: 1,
    lossPercent: 0
  });

  // CLEANUP & LOCK: Protect against black screen and scroll locking
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', unit: MeasureUnit.UN, price: 0, packageQuantity: 1, lossPercent: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name || '',
      unit: (formData.unit as MeasureUnit) || MeasureUnit.UN,
      price: Number(formData.price) || 0,
      packageQuantity: Number(formData.packageQuantity) || 1,
      lossPercent: Number(formData.lossPercent) || 0
    };

    if (editingId) {
      updateIngredient(editingId, payload);
    } else {
      addIngredient({
        id: Date.now().toString(),
        ...payload
      });
    }
    closeModal();
  };

  const handleEdit = (ing: Ingredient) => {
    setFormData({ ...ing });
    setEditingId(ing.id);
    setIsModalOpen(true);
  };

  const filteredIngredients = (ingredients || []).filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Local calculation helpers to avoid complex inline logic
  const getRealQty = () => {
    const qty = Number(formData.packageQuantity) || 0;
    const loss = Number(formData.lossPercent) || 0;
    return qty * (1 - (loss / 100));
  };

  const getSimulatedUnitCost = () => {
    const price = Number(formData.price) || 0;
    const realQty = getRealQty();
    return realQty > 0 ? price / realQty : 0;
  };

  return (
    <div className="animate-fade-in pb-20 space-y-6">
      
      {/* Header Page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">Cadastro de Insumos</h2>
            <button 
                onClick={() => setShowHelp(!showHelp)} 
                className="text-gray-400 hover:text-brand-red transition-colors"
                title="Ajuda"
            >
                <HelpCircle size={20} />
            </button>
           </div>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie matérias-primas e custos reais.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar insumo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-red outline-none shadow-sm"
                />
            </div>
            
            <button 
                onClick={() => { setIsModalOpen(true); }}
                className="bg-brand-red hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-red-900/20 uppercase text-sm tracking-wide"
            >
                <Plus size={18} /> Novo Insumo
            </button>
        </div>
      </div>

      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm">
            <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Info size={16}/> Gestão de Insumos
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                Cadastre aqui os pacotes fechados comprados do fornecedor. O sistema calculará o custo real da unidade/grama 
                descontando as perdas de produção.
            </p>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider border-b border-gray-200 dark:border-gray-800">
                    <tr>
                        <th className="px-6 py-4 w-16">Item</th>
                        <th className="px-6 py-4">Insumo</th>
                        <th className="px-6 py-4 text-center">Peso/Qtd</th>
                        <th className="px-6 py-4 text-center">Unidade</th>
                        <th className="px-6 py-4 text-right">Preço Pacote</th>
                        <th className="px-6 py-4 text-center">Perda</th>
                        <th className="px-6 py-4 text-right text-brand-red">Custo Real Un.</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                    {filteredIngredients.map((ing, idx) => (
                        <tr key={ing.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
                            <td className="px-6 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white uppercase text-xs">{ing.name}</td>
                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">{ing.packageQuantity}</td>
                            <td className="px-6 py-4 text-center">
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-[10px] font-black border border-gray-200 dark:border-gray-700">
                                    {ing.unit}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs">R$ {ing.price.toFixed(2)}</td>
                            <td className="px-6 py-4 text-center text-red-500 font-bold text-xs">{ing.lossPercent > 0 ? ing.lossPercent + '%' : '-'}</td>
                            <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-800/30">
                                R$ {getIngredientRealCost(ing).toFixed(4)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-3">
                                    <button onClick={() => handleEdit(ing)} className="text-blue-500 dark:text-blue-400 hover:scale-110 transition"><Edit2 size={16} /></button>
                                    <button onClick={() => deleteIngredient(ing.id)} className="text-gray-400 hover:text-red-500 hover:scale-110 transition"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredIngredients.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-6 py-20 text-center text-gray-500 italic text-sm">
                                Nenhum insumo encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Editor Modal - AJUSTADO PARA ALINHAMENTO AO TOPO (items-start) E RESPIRO VERTICAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-start pt-6 sm:pt-12 z-[9999] p-4 overflow-hidden animate-fade-in"
          onClick={closeModal}
        >
           <div 
              className="bg-white dark:bg-[#111827] w-full max-w-2xl max-h-[85vh] flex flex-col relative overflow-hidden rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
           >
              
              {/* Header Fixado - shrink-0 garante que não encolha */}
              <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 bg-gray-50 dark:bg-[#0f111a]">
                 <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-3 tracking-widest">
                    <div className="bg-brand-red p-2 rounded-xl text-white shadow-lg shadow-red-900/20">
                      <Beef size={20} />
                    </div>
                    {editingId ? 'Editar Insumo' : 'Novo Insumo'}
                 </h3>
                 <button onClick={closeModal} className="text-gray-400 hover:text-brand-red transition-colors p-2" aria-label="Fechar">
                    <X size={28} strokeWidth={2.5}/>
                 </button>
              </div>

              {/* Corpo com Rolagem Interna - flex-1 overflow-y-auto faz a mágica */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-white dark:bg-gray-900 scrollbar-thin">
                 <form id="ingredient-form" onSubmit={handleSubmit} className="space-y-8">
                    
                    <div className="space-y-6">
                       {/* Nome */}
                       <div>
                          <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block">Nome Comercial</label>
                          <input 
                            type="text" 
                            required
                            autoFocus
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-lg focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold placeholder:opacity-20" 
                            placeholder="Ex: Pão de Brioche" 
                          />
                       </div>

                       {/* Unidade e Preço */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                             <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block">Unidade</label>
                             <select 
                                 value={formData.unit}
                                 onChange={e => setFormData({...formData, unit: e.target.value as MeasureUnit})}
                                 className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-base focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold appearance-none cursor-pointer"
                             >
                                 <option value={MeasureUnit.UN}>Unidade (UN)</option>
                                 <option value={MeasureUnit.G}>Gramas (G)</option>
                                 <option value={MeasureUnit.ML}>Mililitros (ML)</option>
                             </select>
                          </div>
                          <div>
                             <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block">Preço de Compra</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">R$</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl py-4 pl-10 pr-4 text-base focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold"
                                />
                             </div>
                          </div>
                       </div>

                       {/* Qtd e Perda */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                             <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block">Quantidade no Pacote</label>
                             <input 
                                 type="number" 
                                 step="0.01"
                                 required
                                 value={formData.packageQuantity}
                                 onChange={e => setFormData({...formData, packageQuantity: parseFloat(e.target.value)})}
                                 className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-base focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold"
                             />
                          </div>
                          <div>
                             <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block">Perda Estimada (%)</label>
                             <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    max="99"
                                    min="0"
                                    required
                                    value={formData.lossPercent}
                                    onChange={e => setFormData({...formData, lossPercent: parseFloat(e.target.value)})}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-base focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold"
                                />
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Resumo de Custo */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-6">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                             <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black block mb-1 tracking-tighter">Aproveitamento</span>
                             <span className="text-xl font-black text-gray-900 dark:text-gray-100">
                                {getRealQty().toFixed(2)} 
                                <span className="text-xs ml-1 opacity-40 font-bold uppercase">{formData.unit}</span>
                             </span>
                          </div>
                          <div className="bg-brand-red p-5 rounded-2xl shadow-xl shadow-red-900/20 text-white relative overflow-hidden">
                             <span className="text-[9px] text-white/70 uppercase font-black block relative z-10 mb-1 tracking-tighter">Custo Real por Unid.</span>
                             <span className="text-2xl font-black text-white relative z-10">
                                R$ {getSimulatedUnitCost().toFixed(4)}
                             </span>
                          </div>
                       </div>
                       
                       <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] italic flex items-center gap-3">
                           <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg shrink-0">
                                <Info size={16} />
                           </div>
                           O sistema calcula o custo útil considerando apenas o que sobra após as perdas.
                       </div>
                    </div>
                 </form>
              </div>

              {/* Rodapé Fixado - shrink-0 e bg sólido para não transparecer conteúdo do scroll */}
              <div className="p-5 sm:p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-4 shrink-0 bg-white dark:bg-[#0f111a] z-10 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
                 <button 
                    onClick={closeModal} 
                    className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                 >
                    Descartar
                 </button>
                 <button 
                    form="ingredient-form" 
                    type="submit" 
                    className="px-10 py-3 rounded-xl bg-brand-red hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-900/20 transition-all transform hover:scale-[1.03] active:scale-95"
                 >
                    Salvar Insumo
                 </button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
