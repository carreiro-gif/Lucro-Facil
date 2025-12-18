import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Plus, Trash, Edit2, Search, FileText, X, ChefHat, HelpCircle } from 'lucide-react';

const Products: React.FC = () => {
  const { products, ingredients, addProduct, updateProduct, deleteProduct, getProductCMV, getIngredientRealCost } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Form State for Modal
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Geral');
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
        ingredients: []
      });
      setIsModalOpen(false); // Close if new, keep open if editing recipe
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}" do cardápio?`)) {
        deleteProduct(id);
    }
  };

  const addIngredientToProduct = (ingredientId: string) => {
    if (!editingProduct) return;
    const currentIngs = editingProduct.ingredients || [];
    const newIngs = [...currentIngs, { ingredientId, quantity: 1 }];
    updateProduct(editingProduct.id, { ingredients: newIngs });
    // Update local state to reflect changes immediately in modal
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-gray-500 dark:text-gray-400">Gerencie seus produtos e acesse as fichas técnicas detalhadas.</p>

            {showHelp && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in mt-4 max-w-3xl shadow-sm">
                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
                <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2"><HelpCircle size={16}/> Montando o Produto</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Aqui você cria a receita do seu prato.
                    <br/>
                    1. Clique em <strong>Novo Item</strong> para criar o produto.
                    <br/>
                    2. Depois, clique em <strong>Ficha Técnica</strong> para adicionar os insumos que compõem este prato.
                    <br/>
                    3. O sistema calculará automaticamente o <strong>CMV</strong> (Custo de Mercadoria Vendida), ou seja, quanto custa em matéria-prima para produzir 1 unidade.
                </p>
            </div>
           )}
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-red outline-none shadow-sm"
                />
            </div>
            <button 
              onClick={openNewProductModal}
              className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition shadow-lg shadow-red-900/20"
            >
              <Plus size={18} /> <span className="hidden sm:inline">NOVO ITEM</span>
            </button>
          </div>
       </div>

       {/* PRODUCT LIST TABLE */}
       <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
                   <tr>
                      <th className="px-6 py-4">Nome do Produto</th>
                      <th className="px-6 py-4">Categoria</th>
                      <th className="px-6 py-4 text-center">Insumos</th>
                      <th className="px-6 py-4 text-right">CMV (R$)</th>
                      <th className="px-6 py-4 text-right">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                   {filteredProducts.map(prod => {
                      const cmv = getProductCMV(prod);
                      return (
                         <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-base">{prod.name}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                               <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700">{prod.category || 'Geral'}</span>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-500">{prod.ingredients.length}</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-brand-red">R$ {cmv.toFixed(2)}</td>
                            <td className="px-6 py-4">
                               <div className="flex justify-end items-center gap-2">
                                  <button 
                                    onClick={() => openRecipeModal(prod)}
                                    className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition border border-gray-200 dark:border-gray-700 shadow-sm"
                                  >
                                     <FileText size={14} /> Ficha Técnica
                                  </button>
                                  <button
                                     onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                     className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-500 px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition border border-red-200 dark:border-red-900/30"
                                     title="Excluir Produto"
                                  >
                                     <Trash size={14} />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
       </div>

       {/* RECIPE CARD MODAL (Ficha Técnica) */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in flex flex-col">
               
               {/* Header */}
               <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start">
                  <div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase">
                        <ChefHat size={24} className="text-brand-red" />
                        {editingProduct ? 'Ficha Técnica' : 'Novo Produto'}
                     </h3>
                     <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {editingProduct ? `Editando composição de: ${editingProduct.name}` : 'Cadastre um novo item no cardápio'}
                     </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
               </div>

               {/* Body */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                     <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Nome do Produto</label>
                        <input 
                           type="text" 
                           value={prodName}
                           onChange={e => setProdName(e.target.value)}
                           className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-red outline-none"
                           placeholder="Ex: X-Salada"
                        />
                     </div>
                     <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 block">Categoria</label>
                        <input 
                           type="text" 
                           value={prodCategory}
                           onChange={e => setProdCategory(e.target.value)}
                           className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-red outline-none"
                           placeholder="Ex: Hambúrguer"
                        />
                     </div>
                  </div>

                  {editingProduct && (
                     <>
                        <div className="flex items-center justify-between">
                           <h4 className="text-gray-900 dark:text-white font-bold uppercase flex items-center gap-2 text-sm">
                              <FileText size={16} className="text-gray-500" /> Composição (Insumos)
                           </h4>
                           <select 
                              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs p-2 rounded border border-gray-300 dark:border-gray-700 outline-none focus:border-brand-red"
                              onChange={(e) => {
                                 if(e.target.value) {
                                    addIngredientToProduct(e.target.value);
                                    e.target.value = "";
                                 }
                              }}
                           >
                              <option value="">+ Adicionar Insumo</option>
                              {ingredients
                                .sort((a,b) => a.name.localeCompare(b.name))
                                .map(i => (
                                 <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                              ))}
                           </select>
                        </div>

                        {/* Ingredients List */}
                        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                           <table className="w-full text-left">
                              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-[10px] uppercase font-bold">
                                 <tr>
                                    <th className="px-4 py-2">Insumo</th>
                                    <th className="px-4 py-2 text-center">Unidade</th>
                                    <th className="px-4 py-2 text-center">Qtd. Receita</th>
                                    <th className="px-4 py-2 text-right">Custo Unit.</th>
                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                    <th className="px-4 py-2 w-10"></th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                 {editingProduct.ingredients.length === 0 && (
                                    <tr>
                                       <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">
                                          Nenhum insumo adicionado a esta ficha técnica.
                                       </td>
                                    </tr>
                                 )}
                                 {editingProduct.ingredients.map((item, idx) => {
                                    const ingInfo = ingredients.find(i => i.id === item.ingredientId);
                                    if(!ingInfo) return null;
                                    const unitCost = getIngredientRealCost(ingInfo);
                                    const totalLineCost = unitCost * item.quantity;

                                    return (
                                       <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{ingInfo.name}</td>
                                          <td className="px-4 py-2 text-center text-gray-500 text-xs">{ingInfo.unit}</td>
                                          <td className="px-4 py-2 text-center">
                                             <input 
                                                type="number" 
                                                step="0.001"
                                                value={item.quantity}
                                                onChange={(e) => updateProductIngredientQty(idx, parseFloat(e.target.value))}
                                                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white w-20 text-center rounded p-1 text-sm focus:border-brand-red outline-none"
                                             />
                                          </td>
                                          <td className="px-4 py-2 text-right text-gray-500 font-mono text-xs">R$ {unitCost.toFixed(4)}</td>
                                          <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white font-mono">R$ {totalLineCost.toFixed(2)}</td>
                                          <td className="px-4 py-2 text-right">
                                             <button onClick={() => removeProductIngredient(idx)} className="text-gray-400 hover:text-red-500">
                                                <Trash size={14} />
                                             </button>
                                          </td>
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </>
                  )}
               </div>

               {/* Footer */}
               <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center rounded-b-xl">
                  {editingProduct ? (
                     <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold">Custo Total (CMV)</span>
                        <span className="text-2xl font-bold text-brand-red">R$ {getProductCMV(editingProduct).toFixed(2)}</span>
                     </div>
                  ) : <div></div>}
                  
                  <div className="flex gap-3">
                     <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-bold">Fechar</button>
                     <button onClick={handleSaveProduct} className="px-6 py-2 rounded-lg bg-brand-red hover:bg-red-700 text-white font-bold shadow-lg shadow-red-900/20">
                        {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                     </button>
                  </div>
               </div>

            </div>
         </div>
       )}
    </div>
  );
};

export default Products;