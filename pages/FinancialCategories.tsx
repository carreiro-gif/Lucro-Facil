import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, Plus, Users, Tags, HelpCircle, X, Beef, Edit2, Check, ChevronUp, ChevronDown } from 'lucide-react';

const FinancialCategories: React.FC = () => {
  const { 
    categories, 
    addCategory, 
    deleteCategory, 
    suppliers, 
    addSupplier, 
    deleteSupplier,
    ingredientCategories,
    addIngredientCategory,
    updateIngredientCategory,
    deleteIngredientCategory,
    reorderIngredientCategory
  } = useApp();
  
  const [newCatName, setNewCatName] = useState('');
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newIngCatName, setNewIngCatName] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // States for inline category editing
  const [editingIngCatId, setEditingIngCatId] = useState<string | null>(null);
  const [editingIngCatName, setEditingIngCatName] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      id: Date.now().toString(),
      name: newCatName.trim(),
      isCustom: true
    });
    setNewCatName('');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    addSupplier({
      id: Date.now().toString(),
      name: newSupName.trim(),
      contact: newSupContact.trim()
    });
    setNewSupName('');
    setNewSupContact('');
  };

  const handleAddIngredientCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngCatName.trim()) return;
    addIngredientCategory(newIngCatName.trim());
    setNewIngCatName('');
  };

  const handleUpdateIngredientCategorySubmit = (id: string) => {
    if (!editingIngCatName.trim()) return;
    updateIngredientCategory(id, editingIngCatName.trim());
    setEditingIngCatId(null);
    setEditingIngCatName('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
         <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">Categorias & Fornecedores</h2>
            <button 
                onClick={() => setShowHelp(!showHelp)} 
                className="text-gray-400 hover:text-brand-red transition-colors"
                title="Ajuda"
            >
                <HelpCircle size={20} />
            </button>
         </div>
         
         {showHelp && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in mt-4">
                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
                <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2 uppercase tracking-wide text-xs"><HelpCircle size={16}/> Organização Central</h4>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                    Nesta central você gerencia as classificações do seu negócio. 
                    Organize suas <strong>Categorias Financeiras</strong> para classificação de despesas fixas, gerencie os seus <strong>Fornecedores</strong> parceiros e defina as <strong>Categorias de Insumos</strong> para classificar de forma correta a sua matéria-prima (essencial para organizar e analisar o impacto de insumos no CMV dos lanches).
                </p>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Expense Categories Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[70vh] shadow-lg">
          <div className="bg-gray-50 dark:bg-[#0f111a] p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
             <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xs uppercase tracking-wider">
               <Tags className="text-brand-red" size={18} />
               Categorias Financeiras
             </div>
             <span className="text-[10px] uppercase font-black text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{categories.length} itens</span>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: Aluguel, Utilidades..." 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-brand-red outline-none text-sm font-semibold"
              />
              <button type="submit" className="bg-brand-red hover:bg-red-700 text-white p-2.5 rounded-xl transition flex items-center justify-center shadow-md shrink-0">
                <Plus size={18} />
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {categories.map((cat) => (
              <div key={cat.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase">{cat.name}</span>
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredient Categories Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[70vh] shadow-lg">
          <div className="bg-gray-50 dark:bg-[#0f111a] p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
             <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xs uppercase tracking-wider">
               <Beef className="text-purple-500" size={18} />
               Categorias de Insumos
             </div>
             <span className="text-[10px] uppercase font-black text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{(ingredientCategories || []).length} itens</span>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <form onSubmit={handleAddIngredientCategory} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: Proteínas, Panificação..." 
                value={newIngCatName}
                onChange={e => setNewIngCatName(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl transition flex items-center justify-center shadow-md shrink-0">
                <Plus size={18} />
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {(ingredientCategories || []).length === 0 && (
                <div className="text-center text-gray-500 py-10 text-xs italic">Nenhuma categoria cadastrada.</div>
            )}
            {(ingredientCategories || []).map((cat) => (
              <div key={cat.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700 min-h-[48px]">
                {editingIngCatId === cat.id ? (
                  <div className="flex-1 flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={editingIngCatName}
                      onChange={e => setEditingIngCatName(e.target.value)}
                      className="flex-1 bg-white dark:bg-gray-800 border-2 border-purple-400 dark:border-purple-600 text-gray-900 dark:text-white rounded-lg px-2 py-1.5 text-xs outline-none font-bold uppercase"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleUpdateIngredientCategorySubmit(cat.id);
                        if (e.key === 'Escape') setEditingIngCatId(null);
                      }}
                    />
                    <button 
                      onClick={() => handleUpdateIngredientCategorySubmit(cat.id)}
                      className="text-emerald-500 hover:text-emerald-600 hover:scale-110 transition p-1 shrink-0" 
                      title="Salvar"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => setEditingIngCatId(null)}
                      className="text-red-500 hover:text-red-600 hover:scale-110 transition p-1 shrink-0" 
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase">{cat.name}</span>
                    <div className="flex gap-1.5 items-center">
                      <button 
                        onClick={() => reorderIngredientCategory(cat.id, 'up')}
                        className="text-gray-400 hover:text-purple-650 transition p-1"
                        title="Mover para cima"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button 
                        onClick={() => reorderIngredientCategory(cat.id, 'down')}
                        className="text-gray-400 hover:text-purple-650 transition p-1"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingIngCatId(cat.id);
                          setEditingIngCatName(cat.name);
                        }}
                        className="text-gray-400 hover:text-purple-600 hover:scale-110 opacity-0 group-hover:opacity-100 transition p-1"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Excluir a categoria "${cat.name}"? Os insumos desta categoria ficarão classificados como Uncategorized.`)) {
                            deleteIngredientCategory(cat.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 hover:scale-110 opacity-0 group-hover:opacity-100 transition p-1"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Suppliers Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[70vh] shadow-lg">
          <div className="bg-gray-50 dark:bg-[#0f111a] p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
             <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xs uppercase tracking-wider">
               <Users className="text-blue-500" size={18} />
               Fornecedores
             </div>
             <span className="text-[10px] uppercase font-black text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{suppliers.length} itens</span>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <form onSubmit={handleAddSupplier} className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome do Fornecedor..." 
                  value={newSupName}
                  onChange={e => setNewSupName(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Contato / Tel (Opcional)..." 
                  value={newSupContact}
                  onChange={e => setNewSupContact(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl transition text-xs font-black uppercase tracking-wider">
                  Adicionar
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-semibold uppercase text-xs">
            {suppliers.length === 0 && (
                <div className="text-center text-gray-500 py-10 text-xs italicNormal shrink-0">Nenhum fornecedor cadastrado.</div>
            )}
            {suppliers.map((sup) => (
              <div key={sup.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                <div>
                    <div className="text-gray-900 dark:text-white font-semibold text-xs uppercase">{sup.name}</div>
                    {sup.contact && <div className="text-gray-500 text-[10px] font-mono mt-0.5">{sup.contact}</div>}
                </div>
                <button 
                  onClick={() => deleteSupplier(sup.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialCategories;
