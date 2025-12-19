
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Plus, Trash, Edit2, Search, FileText, X, ChefHat, HelpCircle, ChevronUp, ChevronDown, ListOrdered, Settings, Check, AlertCircle } from 'lucide-react';

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

  // Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const sortedCategories = useMemo(() => [...menuCategories].sort((a,b) => a.order - b.order), [menuCategories]);
  const sortedProducts = useMemo(() => getSortedProducts(), [products, menuCategories]);

  // Grouped and Filtered
  const filteredProductsByGroup = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const groups: Record<string, Product[]> = {};

    sortedCategories.forEach(cat => groups[cat.name] = []);
    groups['Sem Categoria'] = [];

    sortedProducts.forEach(p => {
        if (p.name.toLowerCase().includes(term)) {
            if (groups[p.category]) groups[p.category].push(p);
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

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
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
      setIsModalOpen(false);
    }
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

  return (
    <div className="space-y-6 animate-fade-in pb-20">
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
                • <strong>Categorias:</strong> Use o botão de lista <ListOrdered size={14} className="inline"/> para adicionar, editar ou excluir seções (Hambúrguer, Bebidas, etc).
                <br/>
                • <strong>Produtos:</strong> Use as setas <ChevronUp size={14} className="inline"/> <ChevronDown size={14} className="inline"/> na tabela para subir ou descer um item dentro de sua seção. 
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
                             <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">{cat.name}</h3>
                             <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{groupItems.length} ITENS</span>
                        </div>

                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 w-16 text-center">Ordem</th>
                                        <th className="px-6 py-3">Produto</th>
                                        <th className="px-6 py-3 text-right">CMV Est.</th>
                                        <th className="px-6 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                    {groupItems.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic text-xs">Nenhum item nesta categoria.</td></tr>
                                    ) : (
                                        groupItems.map((prod, pIdx) => {
                                            const cmv = getProductCMV(prod);
                                            return (
                                                <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
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
                                                            <button onClick={() => deleteProduct(prod.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash size={16} /></button>
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

            {filteredProductsByGroup['Sem Categoria'].length > 0 && (
                <div className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                         <h3 className="text-lg font-black text-gray-400 uppercase tracking-wider">Sem Categoria Definida</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden opacity-80">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                {filteredProductsByGroup['Sem Categoria'].map(prod => (
                                    <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{prod.name}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openRecipeModal(prod)} className="text-brand-red text-xs font-bold underline">Corrigir Categoria</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
       </div>

       {/* MODAL DE GESTÃO DE CATEGORIAS */}
       {isCatModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
               <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase">
                            <ListOrdered size={20} className="text-brand-red" /> Gestão de Seções
                        </h3>
                        <button onClick={() => setIsCatModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleAddCat} className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                placeholder="Nova seção (ex: Entradas)..."
                                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                            />
                            <button type="submit" className="bg-brand-red text-white px-4 py-2 rounded-lg font-bold text-xs uppercase">Adicionar</button>
                        </form>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                            {sortedCategories.map((cat, idx) => (
                                <div key={cat.id} className="flex flex-col p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between p-1">
                                        {editingCatId === cat.id ? (
                                            <div className="flex-1 flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={editingCatName}
                                                    onChange={e => setEditingCatName(e.target.value)}
                                                    className="flex-1 bg-white dark:bg-gray-700 border border-brand-red rounded px-2 py-1 text-sm outline-none"
                                                    autoFocus
                                                />
                                                <button onClick={handleSaveCatEdit} className="text-emerald-500 p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"><Check size={18}/></button>
                                                <button onClick={() => setEditingCatId(null)} className="text-gray-400 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"><X size={18}/></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-bold text-gray-800 dark:text-gray-200 pl-2">{cat.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleStartEditingCat(cat)} className="p-1.5 text-gray-400 hover:text-blue-500 transition" title="Editar Nome"><Edit2 size={16}/></button>
                                                    <button onClick={() => reorderMenuCategory(cat.id, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-brand-red disabled:opacity-0"><ChevronUp size={20}/></button>
                                                    <button onClick={() => reorderMenuCategory(cat.id, 'down')} disabled={idx === sortedCategories.length - 1} className="p-1 text-gray-400 hover:text-brand-red disabled:opacity-0"><ChevronDown size={20}/></button>
                                                    
                                                    {deletingCatId === cat.id ? (
                                                        <button 
                                                            onClick={() => handleDeleteCatConfirm(cat.id)}
                                                            className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 animate-pulse"
                                                        >
                                                            Confirmar Exclusão?
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => { setDeletingCatId(cat.id); setEditingCatId(null); }} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Excluir Categoria"><Trash size={16}/></button>
                                                    )}
                                                    
                                                    {deletingCatId === cat.id && (
                                                        <button onClick={() => setDeletingCatId(null)} className="text-xs text-gray-400 underline ml-1">Cancelar</button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#0f111a] text-center rounded-b-xl border-t border-gray-200 dark:border-gray-800">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">A ordem definida aqui será aplicada em todas as telas de vendas.</p>
                    </div>
               </div>
           </div>
       )}

       {/* MODAL FICHA TÉCNICA (Com opção de Gerenciar Categorias interna) */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in flex flex-col">
               <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start">
                  <div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase">
                        <ChefHat size={24} className="text-brand-red" />
                        {editingProduct ? 'Ficha Técnica' : 'Novo Produto'}
                     </h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                     <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Nome do Produto</label>
                        <input type="text" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-red outline-none" placeholder="Ex: X-Salada Especial" />
                     </div>
                     <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Categoria da Seção</label>
                        <div className="flex gap-2">
                          <select 
                              value={prodCategory} 
                              onChange={e => setProdCategory(e.target.value)}
                              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-red outline-none appearance-none font-bold"
                          >
                              {sortedCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                              <option value="Sem Categoria">Sem Categoria</option>
                              <option value="Outros">Outros</option>
                          </select>
                          <button 
                            type="button"
                            onClick={() => setIsCatModalOpen(true)}
                            className="bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-brand-red p-3 rounded-lg border border-gray-300 dark:border-gray-700 transition"
                            title="Adicionar/Editar Categorias"
                          >
                            <Settings size={20} />
                          </button>
                        </div>
                     </div>
                  </div>

                  {editingProduct && (
                     <>
                        <div className="flex items-center justify-between">
                           <h4 className="text-gray-900 dark:text-white font-bold uppercase flex items-center gap-2 text-sm"><FileText size={16} /> Composição</h4>
                           <select className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs p-2 rounded border border-gray-300 dark:border-gray-700 outline-none focus:border-brand-red" onChange={(e) => { if(e.target.value) { addIngredientToProduct(e.target.value); e.target.value = ""; } }}>
                              <option value="">+ Adicionar Insumo</option>
                              {ingredients.sort((a,b) => a.name.localeCompare(b.name)).map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                           </select>
                        </div>
                        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                           <table className="w-full text-left">
                              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-[10px] uppercase font-bold">
                                 <tr>
                                    <th className="px-4 py-2">Insumo</th>
                                    <th className="px-4 py-2 text-center">Unidade</th>
                                    <th className="px-4 py-2 text-center">Qtd. Receita</th>
                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                    <th className="px-4 py-2 w-10"></th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                 {(editingProduct.ingredients || []).map((item, idx) => {
                                    const ingInfo = ingredients.find(i => i.id === item.ingredientId);
                                    if(!ingInfo) return null;
                                    const unitCost = getIngredientRealCost(ingInfo);
                                    return (
                                       <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{ingInfo.name}</td>
                                          <td className="px-4 py-2 text-center text-gray-500 text-xs">{ingInfo.unit}</td>
                                          <td className="px-4 py-2 text-center">
                                             <input type="number" step="0.001" value={item.quantity} onChange={(e) => updateProductIngredientQty(idx, parseFloat(e.target.value))} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white w-20 text-center rounded p-1 text-sm focus:border-brand-red outline-none" />
                                          </td>
                                          <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white font-mono">R$ {(unitCost * item.quantity).toFixed(2)}</td>
                                          <td className="px-4 py-2 text-right">
                                             <button onClick={() => removeProductIngredient(idx)} className="text-gray-400 hover:text-red-500"><Trash size={14} /></button>
                                          </td>
                                       </tr>
                                    );
                                 })}
                                 {(!editingProduct.ingredients || editingProduct.ingredients.length === 0) && (
                                     <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Nenhum insumo nesta ficha técnica.</td></tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </>
                  )}
               </div>

               <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center rounded-b-xl">
                  {editingProduct ? (
                     <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold">Custo Total (CMV)</span>
                        <span className="text-2xl font-bold text-brand-red">R$ {getProductCMV(editingProduct).toFixed(2)}</span>
                     </div>
                  ) : <div/>}
                  <div className="flex gap-3">
                     <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white font-bold">Fechar</button>
                     <button onClick={handleSaveProduct} className="px-6 py-2 rounded-lg bg-brand-red hover:bg-red-700 text-white font-bold shadow-lg shadow-red-900/20">{editingProduct ? 'Salvar Alterações' : 'Criar Produto'}</button>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default Products;
