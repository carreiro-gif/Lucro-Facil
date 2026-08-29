import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MeasureUnit, Ingredient } from '../types';
import { Trash2, Plus, Edit2, Search, HelpCircle, X, Beef, Info, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPercent } from '../constants';
import { ExportReportButton } from '../components/ExportReportButton';
import { exportIngredientsReport } from '../utils/pdfExport';

const Ingredients: React.FC = () => {
  const { 
    ingredients, 
    ingredientCategories, 
    addIngredient, 
    updateIngredient, 
    deleteIngredient, 
    getIngredientRealCost,
    reorderIngredientCategory,
    storeInfo
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showHelp, setShowHelp] = useState(false);

  // Initial form state to ensure all fields are controlled, including the categoryId
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '',
    unit: MeasureUnit.UN,
    price: 0,
    packageQuantity: 1,
    lossPercent: 0,
    isSubRecipe: false,
    ingredients: [],
    categoryId: ''
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
    setFormData({ 
      name: '', 
      unit: MeasureUnit.UN, 
      price: 0, 
      packageQuantity: 1, 
      lossPercent: 0, 
      isSubRecipe: false, 
      ingredients: [], 
      categoryId: '' 
    });
  };

  const addIngredientToSubRecipe = (ingId: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { ingredientId: ingId, quantity: 1 }]
    }));
  };

  const updateSubRecipeItemQty = (idx: number, qty: number) => {
    setFormData(prev => {
      const newIngs = [...(prev.ingredients || [])];
      newIngs[idx].quantity = qty;
      return { ...prev, ingredients: newIngs };
    });
  };

  const removeSubRecipeItem = (idx: number) => {
    setFormData(prev => {
      const newIngs = [...(prev.ingredients || [])];
      newIngs.splice(idx, 1);
      return { ...prev, ingredients: newIngs };
    });
  };

  const getSubRecipeBasePrice = () => {
    if (!formData.isSubRecipe || !formData.ingredients) return Number(formData.price) || 0;
    return formData.ingredients.reduce((total, item) => {
       const subIng = ingredients.find(i => i.id === item.ingredientId);
       if (!subIng) return total;
       return total + (getIngredientRealCost(subIng) * item.quantity);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name || '',
      unit: (formData.unit as MeasureUnit) || MeasureUnit.UN,
      price: formData.isSubRecipe ? getSubRecipeBasePrice() : (Number(formData.price) || 0),
      packageQuantity: Number(formData.packageQuantity) || 1,
      lossPercent: Number(formData.lossPercent) || 0,
      isSubRecipe: formData.isSubRecipe || false,
      ingredients: formData.ingredients || [],
      categoryId: formData.categoryId || undefined
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
    setFormData({ 
      ...ing, 
      ingredients: ing.ingredients || [], 
      isSubRecipe: ing.isSubRecipe || false,
      categoryId: ing.categoryId || '' 
    });
    setEditingId(ing.id);
    setIsModalOpen(true);
  };

  // Filter logic including category support
  const filteredIngredients = (ingredients || []).filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategoryFilter === 'all') return true;
    if (selectedCategoryFilter === 'none') return !i.categoryId;
    return i.categoryId === selectedCategoryFilter;
  });

  // Keep exact user category sorting order
  const sortedCategories = ingredientCategories || [];

  interface GroupedIngredients {
    id: string;
    name: string;
    colorClass: string;
    items: typeof ingredients;
  }

  const ingredientGroups: GroupedIngredients[] = [];

  // 1. Populate items matching categories
  sortedCategories.forEach((cat, index) => {
    const catItems = filteredIngredients
      .filter(i => i.categoryId === cat.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (catItems.length > 0) {
      const colors = [
        'bg-purple-600',
        'bg-teal-600',
        'bg-rose-500',
        'bg-blue-600',
        'bg-emerald-600',
        'bg-sky-500',
        'bg-pink-600',
        'bg-indigo-600',
        'bg-cyan-600',
        'bg-violet-600',
        'bg-orange-500',
        'bg-fuchsia-600',
        'bg-lime-600',
        'bg-amber-600'
      ];
      const colorClass = colors[index % colors.length];
      
      ingredientGroups.push({
        id: cat.id,
        name: cat.name,
        colorClass,
        items: catItems
      });
    }
  });

  // 2. Populate uncategorized items at the bottom of the list
  const uncategorizedItems = filteredIngredients
    .filter(i => !i.categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (uncategorizedItems.length > 0) {
    ingredientGroups.push({
      id: 'none',
      name: 'Sem Categoria de Insumo',
      colorClass: 'bg-amber-400',
      items: uncategorizedItems
    });
  }

  // Local calculation helpers to avoid complex inline logic
  const getRealQty = () => {
    const qty = Number(formData.packageQuantity) || 0;
    const loss = Number(formData.lossPercent) || 0;
    return qty * (1 - (loss / 100));
  };

  const getSimulatedUnitCost = () => {
    const price = formData.isSubRecipe ? getSubRecipeBasePrice() : (Number(formData.price) || 0);
    const realQty = getRealQty();
    return realQty > 0 ? price / realQty : 0;
  };

  return (
    <div className="w-full animate-fade-in pb-20 space-y-6">
      
      {/* Header Page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">Insumos / Sub-receitas</h2>
            <button 
                onClick={() => setShowHelp(!showHelp)} 
                className="text-gray-400 hover:text-brand-red transition-colors"
                title="Ajuda"
            >
                <HelpCircle size={20} />
            </button>
           </div>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie matérias-primas, sub-receitas, classificações por categoria e custos reais.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar insumo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none shadow-sm"
                />
            </div>
            
            <ExportReportButton
              onExportPDF={() => {
                exportIngredientsReport({
                  storeName: storeInfo?.name || 'Minha Loja',
                  ingredients: ingredients || [],
                  ingredientCategories: ingredientCategories || [],
                  getIngredientRealCost
                });
              }}
            />

            <button 
                onClick={() => { setIsModalOpen(true); }}
                className="bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-red-900/20 uppercase text-xs tracking-wide w-full sm:w-auto shrink-0"
            >
                <Plus size={18} /> Novo Insumo
            </button>
        </div>
      </div>

      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm">
            <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Info size={16}/> Gestão de Insumos & Categorias
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed space-y-1">
              <span>• Cadastre os ingredientes com perdas estimadas para ter o custo de rendimento real de cada item aplicados na Ficha Técnica.</span><br />
              <span>• Utilize a classificação por <strong>Categorias de Insumos</strong> para organizar melhor o seu estoque e visualizar quais itens compõem cada conjunto.</span><br />
              <span>• <strong>Migração facilitada</strong>: Use a aba <strong className="text-amber-600 dark:text-amber-400">"Sem Categoria"</strong> no filtro horizontal para listar rapidamente itens sem categoria e editá-los um a um para adicionar sua respectiva classificação sem afetar o CMV dos lanches!</span>
            </p>
        </div>
      )}

      {/* Horizontal Category Tab Filter */}
      <div className="flex flex-wrap gap-2 pb-2">
         <button 
             onClick={() => setSelectedCategoryFilter('all')}
             className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider ${selectedCategoryFilter === 'all' ? 'bg-brand-red text-white shadow-md shadow-red-900/20' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
         >
             Todos ({ (ingredients || []).length })
         </button>
         <button 
             onClick={() => setSelectedCategoryFilter('none')}
             className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider border ${selectedCategoryFilter === 'none' ? 'bg-amber-500 text-white border-transparent shadow-md shadow-amber-900/10' : 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-950/20'}`}
         >
             Sem Categoria ({ (ingredients || []).filter(i => !i.categoryId).length })
         </button>
         {(ingredientCategories || []).map(cat => {
             const count = (ingredients || []).filter(i => i.categoryId === cat.id).length;
             return (
                 <button 
                     key={cat.id}
                     onClick={() => setSelectedCategoryFilter(cat.id)}
                     className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider ${selectedCategoryFilter === cat.id ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                 >
                     {cat.name} ({count})
                 </button>
             );
         })}
      </div>

      {/* Main Table */}
      <div className="md:hidden flex items-center gap-2 justify-center bg-brand-red/5 dark:bg-brand-red/10 border border-brand-red/10 dark:border-brand-red/20 text-brand-red dark:text-red-400 py-2 px-3 rounded-lg text-[11px] font-bold select-none shadow-sm mb-3">
        <span className="animate-bounce">↔</span>
        <span>DESLIZE A TABELA PARA OS LADOS PARA VER TODOS OS DADOS</span>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider border-b border-gray-200 dark:border-gray-800">
                    <tr>
                        <th className="px-6 py-4 w-16 text-center">Item</th>
                        <th className="px-6 py-4">Insumo / Categoria</th>
                        <th className="px-6 py-4 text-center">Peso/Qtd</th>
                        <th className="px-6 py-4 text-center">Unidade</th>
                        <th className="px-6 py-4 text-right">Preço Pacote</th>
                        <th className="px-6 py-4 text-center">Perda</th>
                        <th className="px-6 py-4 text-right text-brand-red">Custo Real Un.</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {ingredientGroups.map((group) => (
                        <React.Fragment key={group.id}>
                            {/* Category Header Row */}
                            <tr className="bg-gray-50/70 dark:bg-[#161a29]/40 border-y border-gray-150 dark:border-gray-800/85">
                                <td colSpan={8} className="px-6 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-2.5 h-2.5 rounded-full ${group.colorClass} shadow-sm`} />
                                            <span className="font-extrabold text-xs uppercase tracking-wider text-gray-950 dark:text-white">
                                                {group.name}
                                            </span>
                                            <span className="bg-gray-200/60 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[9px] font-black border border-gray-300/10 dark:border-gray-700/30">
                                                {group.items.length} {group.items.length === 1 ? 'insumo' : 'insumos'}
                                            </span>
                                        </div>
                                        {group.id !== 'none' && (
                                            <div className="flex items-center gap-1.5 no-print">
                                                <button 
                                                    onClick={() => reorderIngredientCategory(group.id, 'up')}
                                                    className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-750 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 rounded-lg transition shadow-sm"
                                                    title="Mover para cima"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => reorderIngredientCategory(group.id, 'down')}
                                                    className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-750 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 rounded-lg transition shadow-sm"
                                                    title="Mover para baixo"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            {group.items.map((ing, idx) => (
                                <tr key={ing.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group border-b border-gray-105 dark:border-gray-800/60">
                                    <td className="px-6 py-4 text-gray-400 font-mono text-xs text-center">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-950 dark:text-gray-50 uppercase text-xs block">{ing.name}</span>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            {ing.isSubRecipe && (
                                                <span 
                                                    className="bg-fuchsia-600 text-white px-2 py-0.5 rounded-md text-[8px] uppercase font-black tracking-wider shadow-sm border border-black/10 animate-pulse"
                                                    style={{ textShadow: '-1px -1px 0 #005, 1px -1px 0 #005, -1px 1px 0 #005, 1px 1px 0 #005' }}
                                                >
                                                    Sub-receita
                                                </span>
                                            )}
                                            {(() => {
                                                const cat = (ingredientCategories || []).find(c => c.id === ing.categoryId);
                                                if (cat) {
                                                    return (
                                                        <span 
                                                            className={`${group.colorClass} text-white px-2 py-0.5 rounded-md text-[8px] uppercase font-black tracking-wider shadow-sm border border-black/10`}
                                                            style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                                                        >
                                                            {cat.name}
                                                        </span>
                                                    );
                                                } else {
                                                    return (
                                                        <span 
                                                            className="bg-amber-500 text-white px-2 py-0.5 rounded-md text-[8px] uppercase font-black tracking-wider shadow-sm border border-black/10"
                                                            style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                                                        >
                                                            Sem Categoria
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-350 font-semibold text-xs">{ing.packageQuantity}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-[10px] font-black border border-gray-200/35 dark:border-gray-700">
                                            {ing.unit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-xs text-gray-900 dark:text-white font-semibold">R$ {ing.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center text-red-500 font-bold text-xs">
                                        {ing.lossPercent > 0 ? formatPercent(ing.lossPercent) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-gray-950 dark:text-gray-50 font-mono bg-gray-50/50 dark:bg-gray-800/30">
                                        R$ {getIngredientRealCost(ing).toFixed(4)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => handleEdit(ing)} className="text-blue-500 dark:text-blue-400 hover:scale-110 transition shrink-0 p-1"><Edit2 size={15} /></button>
                                            <button 
                                              onClick={() => {
                                                if (window.confirm(`Tem certeza que deseja excluir o insumo "${ing.name}"? Isso pode impactar as fichas técnicas que o utilizam!`)) {
                                                  deleteIngredient(ing.id);
                                                }
                                              }} 
                                              className="text-gray-400 hover:text-red-500 hover:scale-110 transition shrink-0 p-1"
                                            >
                                              <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                    {filteredIngredients.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-6 py-20 text-center text-gray-500 italic text-xs font-semibold uppercase tracking-wider">
                                Nenhum insumo encontrado nesta categoria.
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
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9991] animate-fade-in"
          onClick={closeModal}
        >
           <div 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#111827] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-gray-800 animate-slide-up m-auto"
              style={{ width: 'calc(100% - 32px)' }}
              onClick={(e) => e.stopPropagation()}
           >
              
              {/* Header Fixado - shrink-0 garante que não encolha */}
              <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 bg-gray-50 dark:bg-[#0f111a]">
                 <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase flex items-center gap-3 tracking-widest">
                    <div className="bg-brand-red p-2 rounded-xl text-white shadow-lg shadow-red-900/20">
                      <Beef size={20} />
                    </div>
                    {editingId ? 'Editar Insumo / Preparo' : 'Novo Insumo / Preparo'}
                 </h3>
                 <button onClick={closeModal} className="text-gray-400 hover:text-brand-red transition-colors p-2" aria-label="Fechar">
                    <X size={26} strokeWidth={2.5}/>
                 </button>
              </div>

              {/* Corpo com Rolagem Interna - flex-1 overflow-y-auto faz a mágica */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white dark:bg-gray-900 scrollbar-thin">
                 <form id="ingredient-form" onSubmit={handleSubmit} className="space-y-6">
                    
                    <div className="space-y-4">
                       {/* Tipo de Insumo (Toggle) */}
                       <div className="flex items-center gap-4 bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-200/30 dark:border-purple-800/30">
                           <div className="flex-1">
                               <label className="text-[10px] font-black uppercase text-purple-900 dark:text-purple-300 tracking-wider">É uma Sub-receita / Preparo?</label>
                               <p className="text-[9px] text-purple-700 dark:text-purple-400 mt-1">Marque se este item é feito na sua cozinha (ex: Molhos ou Blends especiais) compostos de outros insumos.</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer shrink-0">
                               <input type="checkbox" className="sr-only peer" checked={formData.isSubRecipe} onChange={(e) => setFormData({...formData, isSubRecipe: e.target.checked, price: e.target.checked ? 0 : formData.price})} />
                               <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                           </label>
                       </div>

                       {/* Nome */}
                       <div>
                          <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-1.5 block">Nome Comercial / Descrição</label>
                          <input 
                            type="text" 
                            required
                            autoFocus
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-base focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold placeholder:opacity-25" 
                            placeholder={formData.isSubRecipe ? "Ex: Molho Especial Verde Chef" : "Ex: Hambúrguer de Frisa 120g"} 
                          />
                       </div>

                       {/* Categoria Selection Dropdown - dynamic with option fallback */}
                       <div>
                          <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-1.5 block">Categoria do Insumo (Organização & CMV)</label>
                          <div className="relative">
                            <select 
                                value={formData.categoryId || ''}
                                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-sm focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold appearance-none cursor-pointer pr-10 uppercase"
                            >
                                <option value="">Sem Categoria (Unassigned)</option>
                                {(ingredientCategories || []).map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-gray-900 dark:text-white">
                               <ChevronDown size={14} />
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-400 mt-1">Classifique este insumo na categoria correta para facilitar compras e manter seu custo estruturado.</p>
                       </div>

                       {/* Unidade e Preço */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                             <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-1.5 block">Unidade de Medida</label>
                             <div className="relative">
                               <select 
                                   value={formData.unit}
                                   onChange={e => setFormData({...formData, unit: e.target.value as MeasureUnit})}
                                   className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-sm focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold appearance-none cursor-pointer pr-10"
                               >
                                   <option value={MeasureUnit.UN}>Unidade (UN)</option>
                                   <option value={MeasureUnit.G}>Gramas (G)</option>
                                   <option value={MeasureUnit.ML}>Mililitros (ML)</option>
                               </select>
                               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-gray-900 dark:text-white">
                                  <ChevronDown size={14} />
                               </div>
                             </div>
                          </div>
                          {!formData.isSubRecipe && (
                            <div>
                               <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-1.5 block">Preço de Compra</label>
                               <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">R$</span>
                                  <input 
                                      type="number" 
                                      step="0.01"
                                      required={!formData.isSubRecipe}
                                      value={formData.price}
                                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl py-4 pl-10 pr-4 text-sm focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold font-mono"
                                  />
                               </div>
                            </div>
                          )}
                          {formData.isSubRecipe && (
                            <div>
                               <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-1.5 block">Rendimento Total da Receita</label>
                               <div className="relative">
                                  <input 
                                      type="number" 
                                      step="0.01"
                                      required={formData.isSubRecipe}
                                      value={formData.packageQuantity}
                                      onChange={e => setFormData({...formData, packageQuantity: parseFloat(e.target.value) || 0})}
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-sm focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-450 text-xs uppercase">{formData.unit}</span>
                               </div>
                            </div>
                          )}
                       </div>

                       {/* Qtd e Perda */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {!formData.isSubRecipe && (
                            <div>
                               <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-1.5 block">Quantidade no Pacote</label>
                               <div className="relative">
                                 <input 
                                     type="number" 
                                     step="0.01"
                                     required={!formData.isSubRecipe}
                                     value={formData.packageQuantity}
                                     onChange={e => setFormData({...formData, packageQuantity: parseFloat(e.target.value) || 0})}
                                     className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-sm focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold"
                                 />
                                 <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-450 text-xs uppercase">{formData.unit}</span>
                               </div>
                            </div>
                          )}
                          <div>
                             <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-1.5 block">Perda Estimada na Manipulação (%)</label>
                             <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-405 text-sm">%</span>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    max="99"
                                    min="0"
                                    required
                                    value={formData.lossPercent}
                                    onChange={e => setFormData({...formData, lossPercent: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 text-sm focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold"
                                />
                             </div>
                          </div>
                       </div>
                    </div>

                    {formData.isSubRecipe && (
                       <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                           <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                              <h4 className="text-gray-900 dark:text-white font-black uppercase flex items-center gap-2 tracking-wider text-[10px]">
                                <FileText size={15} className="text-purple-500" /> 
                                Insumos Utilizados no Preparo
                              </h4>
                              <div className="relative">
                                <select 
                                  className="bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white text-[9px] font-black uppercase tracking-wider py-2 px-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer appearance-none pr-8" 
                                  onChange={(e) => { if (e.target.value) { addIngredientToSubRecipe(e.target.value); e.target.value = ""; } }}
                                >
                                   <option value="">+ Adicionar Insumo</option>
                                   {(ingredients || []).filter(i => i.id !== editingId).sort((a,b) => a.name.localeCompare(b.name)).map(i => (
                                     <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                   ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                   <ChevronDown size={12} />
                                </div>
                              </div>
                           </div>

                           <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-2xl overflow-hidden shadow-sm">
                               <table className="w-full text-left">
                                  <thead className="bg-gray-50 dark:bg-[#0d0f17] text-gray-400 text-[8px] uppercase font-black tracking-wider">
                                     <tr>
                                        <th className="px-4 py-2.5">Insumo</th>
                                        <th className="px-4 py-2.5 text-center">Und.</th>
                                        <th className="px-4 py-2.5 text-center w-24">Qtd.</th>
                                        <th className="px-4 py-2.5 text-right font-semibold">Custo Compra</th>
                                        <th className="px-4 py-2.5 w-10"></th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
                                     {(formData.ingredients || []).map((item, idx) => {
                                        const ingInfo = ingredients.find(i => i.id === item.ingredientId);
                                        if (!ingInfo) return null;
                                        const unitCost = getIngredientRealCost(ingInfo);
                                        return (
                                           <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                              <td className="px-4 py-2.5 font-bold text-gray-800 dark:text-gray-200 uppercase text-[10px] truncate max-w-[150px]">{ingInfo.name}</td>
                                              <td className="px-4 py-2.5 text-center text-gray-500 font-bold text-[10px]">{ingInfo.unit}</td>
                                              <td className="px-4 py-2.5 text-center">
                                                 <input 
                                                   type="number" 
                                                   step="0.001" 
                                                   value={item.quantity} 
                                                   onChange={(e) => updateSubRecipeItemQty(idx, parseFloat(e.target.value) || 0)} 
                                                   className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white w-20 text-center rounded-lg p-1 text-xs font-black focus:border-purple-500 outline-none" 
                                                 />
                                              </td>
                                              <td className="px-4 py-2.5 text-right font-black text-gray-900 dark:text-white font-mono text-[11px]">R$ {(unitCost * item.quantity).toFixed(4)}</td>
                                              <td className="px-4 py-2.5 text-center">
                                                 <button type="button" onClick={() => removeSubRecipeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1" aria-label="Excluir"><Trash2 size={13} /></button>
                                              </td>
                                           </tr>
                                        );
                                     })}
                                     {(!formData.ingredients || formData.ingredients.length === 0) && (
                                         <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 italic text-xs">Adicione insumos para compor esta sub-receita.</td></tr>
                                     )}
                                  </tbody>
                                </table>
                           </div>
                       </div>
                    )}

                    {/* Resumo de Custo */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl border border-gray-250 dark:border-gray-800">
                             <span className="text-[8px] text-gray-500 dark:text-gray-400 uppercase font-black block mb-0.5 tracking-wider">Aproveitamento Livre de Perda</span>
                             <span className="text-lg font-black text-gray-900 dark:text-gray-100">
                                {getRealQty().toFixed(3)} 
                                <span className="text-xs ml-1 opacity-45 font-extrabold uppercase">{formData.unit}</span>
                             </span>
                          </div>
                          <div className="bg-brand-red p-4 rounded-2xl shadow-xl shadow-red-900/10 text-white relative overflow-hidden flex flex-col justify-center">
                             <span className="text-[8px] text-white/80 uppercase font-black block tracking-wider mb-0.5">Custo Nutritivo Real por Unid.</span>
                             <span className="text-xl font-black text-white">
                                R$ {getSimulatedUnitCost().toFixed(4)}
                             </span>
                          </div>
                       </div>
                       
                       <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] italic flex items-center gap-2.5">
                           <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-lg shrink-0 text-blue-600 dark:text-blue-400">
                               <Info size={14} />
                           </div>
                           O sistema calcula o rendimento e custo por unidade considerando a perda no pré-preparo.
                       </div>
                    </div>
                 </form>
              </div>

              {/* Rodapé Fixado - shrink-0 e bg sólido para não transparecer conteúdo do scroll */}
              <div className="sticky bottom-0 p-4 sm:p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 shrink-0 bg-white dark:bg-[#0f111a] z-10 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
                 <button 
                    type="button"
                    onClick={closeModal} 
                    className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-extrabold uppercase tracking-widest text-[9px] transition-all active:scale-95"
                 >
                    Cancelar
                 </button>
                 <button 
                    form="ingredient-form" 
                    type="submit" 
                    className={`px-8 py-2.5 rounded-xl text-white font-extrabold uppercase tracking-widest text-[9px] shadow-lg transition-all transform hover:scale-[1.03] active:scale-95 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/15' : 'bg-brand-red hover:bg-red-700 shadow-red-900/15'}`}
                 >
                    {editingId ? 'Salvar Alterações' : 'Salvar Insumo'}
                 </button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
