
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Plus, Trash, Edit2, Search, FileText, X, ChefHat, HelpCircle, ChevronUp, ChevronDown, ListOrdered, Settings, Check, Info, Printer, Copy } from 'lucide-react';

const Products: React.FC = () => {
  const { 
    products, 
    ingredients, 
    menuCategories,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    reorderProduct,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    reorderMenuCategory,
    getProductCMV, 
    getIngredientRealCost,
    getSortedProducts
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Body Scroll Lock & ESC Key Safeguards
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) setIsModalOpen(false);
        if (isCatModalOpen) setIsCatModalOpen(false);
      }
    };

    if (isModalOpen || isCatModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isModalOpen, isCatModalOpen]);

  // Guard: Ensure menuCategories is array
  const sortedCategories = useMemo(() => [...(menuCategories || [])].sort((a,b) => a.order - b.order), [menuCategories]);
  // Guard: getSortedProducts internally checks, but double check usage
  const sortedProducts = useMemo(() => getSortedProducts(), [products, menuCategories]);

  // Grouped and Filtered
  const filteredProductsByGroup = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const groups: Record<string, Product[]> = {};

    sortedCategories.forEach(cat => groups[cat.name] = []);
    groups['Sem Categoria'] = [];

    (sortedProducts || []).forEach(p => {
        if (p.name.toLowerCase().includes(term)) {
            const resolvedCategoryName = groups[p.category] ? p.category : (sortedCategories.find(c => c.id === p.category)?.name || 'Sem Categoria');
            if (groups[resolvedCategoryName]) groups[resolvedCategoryName].push(p);
            else groups['Sem Categoria'].push(p);
        }
    });

    return groups;
  }, [sortedProducts, sortedCategories, searchTerm]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory(sortedCategories[0]?.name || 'Geral');
    setIsModalOpen(true);
  };

  const openRecipeModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setIsModalOpen(true);
  };

  const handleDuplicateProduct = (prod: Product) => {
    const duplicated: Product = {
      ...prod,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: `${prod.name} (Cópia)`,
    };
    addProduct(duplicated);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, { name: prodName, category: prodCategory });
    } else {
      addProduct({
        id: Date.now().toString(),
        name: prodName,
        category: prodCategory,
        ingredients: [],
        order: 0
      });
    }
    setIsModalOpen(false);
  };

  const handleAddCat = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName) return;
      addMenuCategory(newCatName);
      setNewCatName('');
  };

  const handleStartEditingCat = (cat: {id: string, name: string}) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
    setDeletingCatId(null);
  };

  const handleSaveCatEdit = () => {
    if (editingCatId && editingCatName) {
      updateMenuCategory(editingCatId, editingCatName);
      setEditingCatId(null);
      setEditingCatName('');
    }
  };

  const handleDeleteCatConfirm = (id: string) => {
    deleteMenuCategory(id);
    setDeletingCatId(null);
  };

  const addIngredientToProduct = (ingredientId: string) => {
    if (!editingProduct) return;
    const currentIngs = editingProduct.ingredients || [];
    const newIngs = [...currentIngs, { ingredientId, quantity: 1 }];
    updateProduct(editingProduct.id, { ingredients: newIngs });
    setEditingProduct({ ...editingProduct, ingredients: newIngs });
  };

  const updateProductIngredientQty = (index: number, newQty: number) => {
    if (!editingProduct) return;
    const newIngs = [...editingProduct.ingredients];
    newIngs[index].quantity = newQty;
    updateProduct(editingProduct.id, { ingredients: newIngs });
    setEditingProduct({ ...editingProduct, ingredients: newIngs });
  };

  const removeProductIngredient = (index: number) => {
    if (!editingProduct) return;
    const newIngs = editingProduct.ingredients.filter((_, i) => i !== index);
    updateProduct(editingProduct.id, { ingredients: newIngs });
    setEditingProduct({ ...editingProduct, ingredients: newIngs });
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const toggleCategorySelection = (categoryName: string, groupItems: Product[]) => {
    const groupIds = groupItems.map(p => p.id);
    const allSelected = groupIds.every(id => selectedProductIds.includes(id));
    
    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedProductIds(prev => {
        const newIds = [...prev];
        groupIds.forEach(id => {
          if (!newIds.includes(id)) newIds.push(id);
        });
        return newIds;
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === sortedProducts.length && sortedProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(sortedProducts.map(p => p.id));
    }
  };

  const handlePrint = () => {
    if (selectedProductIds.length === 0) return;
    window.print();
  };

  return (
    <>
      <div className="w-full space-y-6 animate-fade-in pb-20 print:hidden">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">Itens do Cardápio</h2>
                  <button 
                      onClick={() => setShowHelp(!showHelp)} 
                      className="text-gray-400 hover:text-brand-red transition-colors"
                      title="Ajuda"
                  >
                      <HelpCircle size={20} />
                  </button>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Organize seu cardápio em grupos e gerencie os custos de produção.</p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                      type="text" 
                      placeholder="Buscar produto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none shadow-sm"
                  />
              </div>
              <button 
                  onClick={toggleSelectAll}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-2"
                  title={selectedProductIds.length === sortedProducts.length && sortedProducts.length > 0 ? "Desmarcar Todos" : "Selecionar Todos"}
              >
                  <Check size={18} className={selectedProductIds.length === sortedProducts.length && sortedProducts.length > 0 ? "text-brand-red" : "text-gray-400"} />
                  <span className="hidden sm:inline uppercase text-xs font-bold">Todos</span>
              </button>
              {selectedProductIds.length > 0 && (
                <button 
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold transition shadow-lg shadow-blue-900/20"
                  title="Imprimir Fichas Selecionadas"
                >
                  <Printer size={18} /> <span className="hidden sm:inline uppercase text-xs">Imprimir ({selectedProductIds.length})</span>
                </button>
              )}
              <button 
                  onClick={() => setIsCatModalOpen(true)}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title="Gerenciar Categorias"
              >
                  <ListOrdered size={20} />
              </button>
              <button 
                onClick={openNewProductModal}
                className="bg-brand-red hover:bg-red-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold transition shadow-lg shadow-red-900/20"
              >
                <Plus size={18} /> <span className="hidden sm:inline uppercase text-xs">Novo Item</span>
              </button>
            </div>
         </div>

         {showHelp && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in mt-2 shadow-sm">
              <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
              <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2"><HelpCircle size={16} className="inline"/> Organização do Cardápio</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  Nesta tela, os produtos estão agrupados por categoria. 
                  <br/><br/>
                  • <strong>Categorias:</strong> Use o botão de lista <ListOrdered size={14} className="inline"/> para adicionar, editar ou excluir seções.
                  <br/>
                  • <strong>Produtos:</strong> Use as setas <ChevronUp size={14} className="inline"/> <ChevronDown size={14} className="inline"/> na tabela para subir ou descer um item. 
              </p>
          </div>
         )}

         {/* LISTA AGRUPADA */}
         <div className="space-y-8">
              {sortedCategories.map(cat => {
                  const groupItems = filteredProductsByGroup[cat.name] || [];
                  if (groupItems.length === 0 && searchTerm) return null;

                  return (
                      <div key={cat.id} className="animate-fade-in">
                          <div className="flex items-center gap-3 mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                               <input 
                                   type="checkbox" 
                                   checked={groupItems.length > 0 && groupItems.every(p => selectedProductIds.includes(p.id))}
                                   onChange={() => toggleCategorySelection(cat.name, groupItems)}
                                   className="w-4 h-4 text-brand-red rounded border-gray-300 focus:ring-brand-red cursor-pointer"
                                   title="Selecionar todos desta categoria"
                               />
                               <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">{cat.name}</h3>
                               <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{groupItems.length} ITENS</span>
                          </div>

                          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto shadow-sm">
                              <table className="w-full text-left">
                                  <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                                      <tr>
                                          <th className="px-4 py-3 w-10 text-center"></th>
                                          <th className="px-6 py-3 w-16 text-center">Ordem</th>
                                          <th className="px-6 py-3">Produto</th>
                                          <th className="px-6 py-3 text-right">CMV Est.</th>
                                          <th className="px-6 py-3 text-right">Ação</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                      {groupItems.length === 0 ? (
                                          <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic text-xs">Nenhum item nesta categoria.</td></tr>
                                      ) : (
                                          groupItems.map((prod, pIdx) => {
                                              const cmv = getProductCMV(prod);
                                              return (
                                                  <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
                                                      <td className="px-4 py-3 text-center">
                                                          <input 
                                                              type="checkbox" 
                                                              checked={selectedProductIds.includes(prod.id)}
                                                              onChange={() => toggleProductSelection(prod.id)}
                                                              className="w-4 h-4 text-brand-red rounded border-gray-300 focus:ring-brand-red cursor-pointer"
                                                          />
                                                      </td>
                                                      <td className="px-6 py-3">
                                                          <div className="flex flex-col items-center gap-1">
                                                              <button 
                                                                  onClick={() => reorderProduct(prod.id, 'up')}
                                                                  disabled={pIdx === 0}
                                                                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${pIdx === 0 ? 'opacity-20 cursor-not-allowed' : 'text-brand-red'}`}
                                                              >
                                                                  <ChevronUp size={14} />
                                                              </button>
                                                              <button 
                                                                  onClick={() => reorderProduct(prod.id, 'down')}
                                                                  disabled={pIdx === groupItems.length - 1}
                                                                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${pIdx === groupItems.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-brand-red'}`}
                                                              >
                                                                  <ChevronDown size={14} />
                                                              </button>
                                                          </div>
                                                      </td>
                                                      <td className="px-6 py-3">
                                                          <div className="font-bold text-gray-900 dark:text-white text-base">{prod.name}</div>
                                                          <div className="text-[10px] text-gray-400">{(prod.ingredients || []).length} insumos na receita</div>
                                                      </td>
                                                      <td className="px-6 py-3 text-right font-mono font-bold text-brand-red">R$ {cmv.toFixed(2)}</td>
                                                      <td className="px-6 py-3">
                                                          <div className="flex justify-end items-center gap-2">
                                                              <button onClick={() => openRecipeModal(prod)} className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition border border-gray-200 dark:border-gray-700 shadow-sm">
                                                                  <FileText size={14} /> Ficha Técnica
                                                              </button>
                                                              <button onClick={() => handleDuplicateProduct(prod)} title="Duplicar Item" className="text-gray-400 hover:text-blue-500 p-2 transition"><Copy size={16} /></button>
                                                              <button onClick={() => deleteProduct(prod.id)} title="Excluir Item" className="text-gray-400 hover:text-red-500 p-2 transition"><Trash size={16} /></button>
                                                          </div>
                                                      </td>
                                                  </tr>
                                              );
                                          })
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  );
              })}
         </div>
      </div>

      {/* MODALS RENDERED OUTSIDE THE FADE-IN CONTAINER TO AVOID TRANSFORM CONTEXT TRAP */}

      {/* MODAL DE GESTÃO DE CATEGORIAS (PADRONIZADO) */}
      {isCatModalOpen && (
           <div 
             className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
             onClick={() => setIsCatModalOpen(false)}
           >
               <div 
                 className="bg-white dark:bg-[#111827] w-full max-w-lg max-h-[90vh] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col relative overflow-hidden animate-fade-in"
                 onClick={(e) => e.stopPropagation()}
               >
                    <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 bg-gray-50 dark:bg-[#0f111a]">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                           <div className="bg-brand-red p-1.5 rounded-lg text-white">
                             <ListOrdered size={18} />
                           </div>
                           Gestão de Seções
                        </h3>
                        <button onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-brand-red transition-colors p-2" aria-label="Fechar">
                           <X size={24} strokeWidth={2.5}/>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                        <form onSubmit={handleAddCat} className="flex gap-2 mb-8">
                            <input 
                                type="text" 
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                placeholder="Ex: Entradas e Porções"
                                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-brand-red outline-none font-bold"
                            />
                            <button type="submit" className="bg-brand-red text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-900/20">Adicionar</button>
                        </form>
                        <div className="space-y-3">
                            {sortedCategories.map((cat, idx) => (
                                <div key={cat.id} className="group p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 transition hover:border-gray-400">
                                    <div className="flex items-center justify-between">
                                        {editingCatId === cat.id ? (
                                            <div className="flex-1 flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={editingCatName}
                                                    onChange={e => setEditingCatName(e.target.value)}
                                                    className="flex-1 bg-white dark:bg-gray-700 border border-brand-red rounded-lg px-3 py-1.5 text-sm outline-none font-bold"
                                                    autoFocus
                                                />
                                                <button onClick={handleSaveCatEdit} className="text-emerald-500 p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"><Check size={20}/></button>
                                                <button onClick={() => setEditingCatId(null)} className="text-gray-400 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"><X size={20}/></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-bold text-gray-800 dark:text-gray-200 uppercase text-xs tracking-wider">{cat.name}</span>
                                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                                                    <button onClick={() => handleStartEditingCat(cat)} className="p-1.5 text-gray-400 hover:text-blue-500 transition"><Edit2 size={16}/></button>
                                                    <button onClick={() => reorderMenuCategory(cat.id, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-brand-red disabled:opacity-0"><ChevronUp size={18}/></button>
                                                    <button onClick={() => reorderMenuCategory(cat.id, 'down')} disabled={idx === sortedCategories.length - 1} className="p-1 text-gray-400 hover:text-brand-red disabled:opacity-0"><ChevronDown size={18}/></button>
                                                    
                                                    {deletingCatId === cat.id ? (
                                                        <button 
                                                            onClick={() => handleDeleteCatConfirm(cat.id)}
                                                            className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase"
                                                        >
                                                            Apagar?
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => { setDeletingCatId(cat.id); setEditingCatId(null); }} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash size={16}/></button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#0f111a] text-center border-t border-gray-200 dark:border-gray-800 shrink-0">
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest opacity-60">A ordem definida aqui organiza todo o cardápio.</p>
                    </div>
               </div>
           </div>
       )}

       {/* PRINT VIEW */}
       <div className="hidden print:block bg-white text-black">
         {selectedProductIds.map(id => {
           const prod = products.find(p => p.id === id);
           if (!prod) return null;
           const cmv = getProductCMV(prod);
           return (
             <div key={prod.id} className="break-inside-avoid mb-8 border border-gray-300 p-6 rounded-lg">
               <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-4">
                 <div>
                   <h2 className="text-2xl font-black uppercase">{prod.name}</h2>
                   <p className="text-sm text-gray-500 uppercase tracking-widest">{prod.category}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-gray-500 uppercase font-bold">Custo Total (CMV)</p>
                   <p className="text-xl font-black font-mono">R$ {cmv.toFixed(2)}</p>
                 </div>
               </div>
               
               <table className="w-full text-left text-sm">
                 <thead className="border-b border-gray-200">
                   <tr>
                     <th className="py-2 font-bold uppercase text-xs">Insumo</th>
                     <th className="py-2 font-bold uppercase text-xs text-center">Und.</th>
                     <th className="py-2 font-bold uppercase text-xs text-center">Qtd.</th>
                     <th className="py-2 font-bold uppercase text-xs text-right">Subtotal</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {(prod.ingredients || []).map((item, idx) => {
                     const ingInfo = ingredients.find(i => i.id === item.ingredientId);
                     if (!ingInfo) return null;
                     const unitCost = getIngredientRealCost(ingInfo);
                     return (
                       <tr key={idx}>
                         <td className="py-2 font-bold text-xs uppercase">{ingInfo.name}</td>
                         <td className="py-2 text-center text-xs">{ingInfo.unit}</td>
                         <td className="py-2 text-center text-xs">{item.quantity}</td>
                         <td className="py-2 text-right font-mono text-xs">R$ {(unitCost * item.quantity).toFixed(2)}</td>
                       </tr>
                     );
                   })}
                   {(!prod.ingredients || prod.ingredients.length === 0) && (
                     <tr><td colSpan={4} className="py-4 text-center text-gray-400 italic text-xs">Sem insumos cadastrados.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           );
         })}
       </div>

       {/* MODAL FICHA TÉCNICA (FIXED OVERLAY INDEPENDENT) */}
       {isModalOpen && (
         <div 
           className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4"
           onClick={() => setIsModalOpen(false)}
         >
            <div 
              className="bg-white dark:bg-[#111827] w-full max-w-3xl max-h-[90vh] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
               {/* Header Fixado */}
               <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 bg-gray-50 dark:bg-[#0f111a]">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-3 tracking-widest">
                     <div className="bg-brand-red p-2 rounded-xl text-white shadow-lg shadow-red-900/20">
                       <ChefHat size={20} />
                     </div>
                     {editingProduct ? 'Ficha Técnica' : 'Novo Item'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-red transition-colors p-2" aria-label="Fechar">
                     <X size={28} strokeWidth={2.5}/>
                  </button>
               </div>

               {/* Corpo com Rolagem Interna */}
               <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-thin">
                  <form id="product-form" onSubmit={handleSaveProduct} className="space-y-8">
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                           <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-[0.2em] mb-1 block">Nome do Produto</label>
                           <input 
                             type="text" 
                             required
                             autoFocus
                             value={prodName} 
                             onChange={e => setProdName(e.target.value)} 
                             className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold" 
                             placeholder="Ex: X-Salada Artesanal" 
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-[0.2em] mb-1 block">Seção do Cardápio</label>
                           <div className="flex gap-2">
                             <select 
                                 value={prodCategory} 
                                 onChange={e => setProdCategory(e.target.value)}
                                 className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold appearance-none cursor-pointer"
                             >
                                 {sortedCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                 <option value="Sem Categoria">Sem Categoria</option>
                             </select>
                             <button 
                               type="button"
                               onClick={() => setIsCatModalOpen(true)}
                               className="bg-white dark:bg-gray-900 text-gray-400 hover:text-brand-red p-4 rounded-xl border border-gray-300 dark:border-gray-700 transition"
                               title="Gerenciar Categorias"
                             >
                               <Settings size={20} />
                             </button>
                           </div>
                        </div>
                     </div>

                     {editingProduct && (
                        <div className="space-y-6">
                           <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                              <h4 className="text-gray-900 dark:text-white font-black uppercase flex items-center gap-2 tracking-widest text-xs">
                                <FileText size={16} className="text-brand-red" /> 
                                Ingredientes
                              </h4>
                              <div className="relative">
                                <select 
                                  className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest py-2.5 px-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-red cursor-pointer appearance-none pr-10" 
                                  onChange={(e) => { if(e.target.value) { addIngredientToProduct(e.target.value); e.target.value = ""; } }}
                                >
                                   <option value="">+ Add Insumo</option>
                                   {(ingredients || []).sort((a,b) => a.name.localeCompare(b.name)).map(i => (
                                     <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                   ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                   <ChevronDown size={12} />
                                </div>
                              </div>
                           </div>
                           
                           <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                              <table className="w-full text-left">
                                 <thead className="bg-gray-50 dark:bg-black/20 text-gray-400 text-[9px] uppercase font-black tracking-widest">
                                    <tr>
                                       <th className="px-5 py-3">Insumo</th>
                                       <th className="px-5 py-3 text-center">Und.</th>
                                       <th className="px-5 py-3 text-center w-28">Qtd.</th>
                                       <th className="px-5 py-3 text-right">Subtotal</th>
                                       <th className="px-5 py-3 w-12"></th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                    {(editingProduct.ingredients || []).map((item, idx) => {
                                       const ingInfo = ingredients.find(i => i.id === item.ingredientId);
                                       if(!ingInfo) return null;
                                       const unitCost = getIngredientRealCost(ingInfo);
                                       return (
                                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                             <td className="px-5 py-3 font-bold text-gray-800 dark:text-gray-200 uppercase text-[11px] truncate max-w-[150px]">{ingInfo.name}</td>
                                             <td className="px-5 py-3 text-center text-gray-500 font-bold text-[11px]">{ingInfo.unit}</td>
                                             <td className="px-5 py-3 text-center">
                                                <input 
                                                  type="number" 
                                                  step="0.001" 
                                                  value={item.quantity} 
                                                  onChange={(e) => updateProductIngredientQty(idx, parseFloat(e.target.value) || 0)} 
                                                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white w-20 text-center rounded-lg p-1.5 text-sm font-black focus:border-brand-red outline-none" 
                                                />
                                             </td>
                                             <td className="px-5 py-3 text-right font-black text-gray-900 dark:text-white font-mono text-sm">R$ {(unitCost * item.quantity).toFixed(2)}</td>
                                             <td className="px-5 py-3 text-center">
                                                <button onClick={() => removeProductIngredient(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1.5" aria-label="Excluir"><Trash size={14} /></button>
                                             </td>
                                          </tr>
                                       );
                                    })}
                                    {(!editingProduct.ingredients || editingProduct.ingredients.length === 0) && (
                                        <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 italic text-xs">Adicione insumos para calcular o custo.</td></tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                           
                           <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20 flex items-center gap-3 text-blue-700 dark:text-blue-300 text-[10px] italic">
                              <Info size={16} className="shrink-0" />
                              CMV baseado no preço real (pós-perda).
                           </div>
                        </div>
                     )}
                  </form>
               </div>

               {/* Rodapé Fixado */}
               <div className="p-5 sm:p-6 border-t border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-[#0f111a] flex flex-col sm:flex-row justify-between items-center gap-4">
                  {editingProduct ? (
                     <div className="flex flex-col items-center sm:items-start">
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest">Custo Total (CMV)</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-brand-red font-mono">R$ {getProductCMV(editingProduct).toFixed(2)}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">/ Unid</span>
                        </div>
                     </div>
                  ) : <div/>}
                  <div className="flex gap-3 w-full sm:w-auto">
                     <button 
                        onClick={() => setIsModalOpen(false)} 
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                     >
                        Descartar
                     </button>
                     <button 
                        form="product-form" 
                        type="submit" 
                        className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-brand-red hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-900/20 transition-all transform hover:scale-[1.03] active:scale-95"
                     >
                        {editingProduct ? 'Salvar Ficha' : 'Criar Item'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
       )}
    </>
  );
};

export default Products;
