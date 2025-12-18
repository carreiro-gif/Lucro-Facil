import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, Plus, Users, Tags, HelpCircle, X } from 'lucide-react';

const FinancialCategories: React.FC = () => {
  const { categories, addCategory, deleteCategory, suppliers, addSupplier, deleteSupplier } = useApp();
  
  const [newCatName, setNewCatName] = useState('');
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    addCategory({
      id: Date.now().toString(),
      name: newCatName,
      isCustom: true
    });
    setNewCatName('');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName) return;
    addSupplier({
      id: Date.now().toString(),
      name: newSupName,
      contact: newSupContact
    });
    setNewSupName('');
    setNewSupContact('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
         <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Categorias & Fornecedores</h2>
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
                <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2"><HelpCircle size={16}/> Organização</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Aqui você cadastra as categorias para organizar suas <strong>Despesas Fixas</strong> e também sua lista de contatos de <strong>Fornecedores</strong>.
                    Isso ajuda a manter o controle financeiro organizado e facilita na hora de lançar as contas.
                </p>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Categories Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col h-[70vh] shadow-lg">
          <div className="bg-gray-50 dark:bg-[#0f111a] p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
             <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
               <Tags className="text-brand-red" size={20} />
               Categorias Financeiras
             </div>
             <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{categories.length} itens</span>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nova Categoria..." 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-red outline-none text-sm"
              />
              <button type="submit" className="bg-brand-red hover:bg-red-700 text-white px-3 py-2 rounded-lg transition">
                <Plus size={18} />
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {categories.map((cat) => (
              <div key={cat.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300 text-sm">{cat.name}</span>
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Suppliers Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col h-[70vh] shadow-lg">
          <div className="bg-gray-50 dark:bg-[#0f111a] p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
             <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
               <Users className="text-blue-600 dark:text-blue-500" size={20} />
               Fornecedores
             </div>
             <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{suppliers.length} itens</span>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <form onSubmit={handleAddSupplier} className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome do Fornecedor..." 
                  value={newSupName}
                  onChange={e => setNewSupName(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-red outline-none text-sm"
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Contato/Tel (Opcional)..." 
                  value={newSupContact}
                  onChange={e => setNewSupContact(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-red outline-none text-sm"
                />
                <button type="submit" className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium text-sm">
                  Adicionar
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {suppliers.length === 0 && (
                <div className="text-center text-gray-500 py-10 text-sm">Nenhum fornecedor cadastrado.</div>
            )}
            {suppliers.map((sup) => (
              <div key={sup.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                <div>
                    <div className="text-gray-900 dark:text-white text-sm font-medium">{sup.name}</div>
                    {sup.contact && <div className="text-gray-500 text-xs">{sup.contact}</div>}
                </div>
                <button 
                  onClick={() => deleteSupplier(sup.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
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