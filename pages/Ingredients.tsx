
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MeasureUnit, Ingredient } from '../types';
import { Trash2, Plus, Edit2, Search, HelpCircle, X, ShoppingCart, Calculator, ArrowRight, Printer, FileText, AlertTriangle } from 'lucide-react';

const Ingredients: React.FC = () => {
  const { ingredients, products, addIngredient, updateIngredient, deleteIngredient, getIngredientRealCost } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // --- Shopping List State (New Implementation) ---
  const [shoppingList, setShoppingList] = useState<{ingredient: Ingredient, packages: number}[]>([]);
  const [qtyModalOpen, setQtyModalOpen] = useState(false);
  const [selectedIngForQty, setSelectedIngForQty] = useState<Ingredient | null>(null);
  const [packQtyInput, setPackQtyInput] = useState(1);
  const [shoppingSearch, setShoppingSearch] = useState('');

  // --- Old Shopping Calculator State (Hidden/Preserved) ---
  const [shoppingItems, setShoppingItems] = useState<{productId: string, quantity: number}[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');

  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '',
    unit: MeasureUnit.UN,
    price: 0,
    packageQuantity: 1,
    lossPercent: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateIngredient(editingId, formData);
    } else {
      addIngredient({
        id: Date.now().toString(),
        name: formData.name!,
        unit: formData.unit as MeasureUnit,
        price: Number(formData.price),
        packageQuantity: Number(formData.packageQuantity),
        lossPercent: Number(formData.lossPercent)
      });
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', unit: MeasureUnit.UN, price: 0, packageQuantity: 1, lossPercent: 0 });
  };

  const handleEdit = (ing: Ingredient) => {
    setFormData(ing);
    setEditingId(ing.id);
    setIsModalOpen(true);
  };

  // --- Old Logic Preserved (Hidden) ---
  const addShoppingItem = () => {
      if (!selectedProductToAdd) return;
      const exists = shoppingItems.find(i => i.productId === selectedProductToAdd);
      if (exists) {
          setShoppingItems(shoppingItems.map(i => i.productId === selectedProductToAdd ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
          setShoppingItems([...shoppingItems, { productId: selectedProductToAdd, quantity: 1 }]);
      }
  };
  const updateShoppingItemQty = (idx: number, qty: number) => {
      const newItems = [...shoppingItems];
      newItems[idx].quantity = qty;
      setShoppingItems(newItems);
  };
  const removeShoppingItem = (idx: number) => {
      setShoppingItems(shoppingItems.filter((_, i) => i !== idx));
  };

  // --- New Shopping List Logic ---
  
  const filteredIngredientsForShopping = useMemo(() => {
      if (!shoppingSearch) return [];
      return ingredients.filter(i => i.name.toLowerCase().includes(shoppingSearch.toLowerCase()));
  }, [ingredients, shoppingSearch]);

  const handleSelectIngredient = (ing: Ingredient) => {
      if (!ing.price || !ing.packageQuantity) {
          alert('Insumo sem dados completos para orçamento. Preencha no Cadastro de Insumos.');
          return;
      }
      setSelectedIngForQty(ing);
      setPackQtyInput(1);
      setQtyModalOpen(true);
  };

  const confirmAddToList = () => {
      if (selectedIngForQty && packQtyInput >= 1) {
          setShoppingList([...shoppingList, { ingredient: selectedIngForQty, packages: Math.floor(packQtyInput) }]);
          setQtyModalOpen(false);
          setSelectedIngForQty(null);
          setShoppingSearch('');
      }
  };

  const removeShoppingListItem = (idx: number) => {
      setShoppingList(shoppingList.filter((_, i) => i !== idx));
  };

  const grandTotal = shoppingList.reduce((acc, item) => acc + (item.packages * item.ingredient.price), 0);

  const handlePrint = () => {
      window.print();
  };

  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-20 space-y-6">
      
      {/* CSS for Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-content, .printable-content * {
            visibility: visible;
          }
          .printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

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
           <p className="text-gray-500 dark:text-gray-400">Gerencie os ingredientes e seus custos reais com perdas.</p>

           {showHelp && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in mt-4 max-w-3xl shadow-sm">
                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
                <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2"><HelpCircle size={16}/> O que é um Insumo?</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Aqui você cadastra a matéria-prima bruta. Ex: Saco de Farinha, Caixa de Hambúrguer, Garrafa de Óleo.
                    <br/><br/>
                    O sistema precisa saber:
                    <ul className="list-disc list-inside mt-1 ml-2 space-y-1 text-xs">
                        <li><strong>Preço:</strong> Quanto você paga no pacote fechado.</li>
                        <li><strong>Quantidade/Peso:</strong> Quanto vem no pacote (Ex: 1000g, 500ml).</li>
                        <li><strong>Perda:</strong> O que você joga fora ao limpar (Ex: casca da cebola).</li>
                    </ul>
                    <br/>
                    Com isso, calculamos o <strong>custo real</strong> de cada grama para usar nas Fichas Técnicas.
                </p>
            </div>
           )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar insumo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-red outline-none shadow-sm"
                />
            </div>
            
            <div className="flex w-full sm:w-auto gap-2">
                <button 
                    onClick={() => setIsShoppingModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-emerald-900/20 flex-1 sm:flex-initial"
                    title="Lista de Compras"
                >
                    <ShoppingCart size={18} /> <span className="hidden xl:inline">LISTA DE COMPRAS</span>
                </button>

                <button 
                    onClick={() => { setEditingId(null); setFormData({ name: '', unit: MeasureUnit.UN, price: 0, packageQuantity: 1, lossPercent: 0 }); setIsModalOpen(true); }}
                    className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-red-900/20 flex-1 sm:flex-initial"
                >
                    <Plus size={18} /> <span className="hidden sm:inline">NOVO INSUMO</span>
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-200 dark:border-gray-800">
                <tr>
                <th className="px-6 py-4 w-16">Item</th>
                <th className="px-6 py-4">Nome do Insumo</th>
                <th className="px-6 py-4 text-center">Peso/Qtd</th>
                <th className="px-6 py-4 text-center">Unidade</th>
                <th className="px-6 py-4 text-right">Preço (R$)</th>
                <th className="px-6 py-4 text-center">Perda (%)</th>
                <th className="px-6 py-4 text-center text-gray-500">Qtd. Real</th>
                <th className="px-6 py-4 text-right text-brand-red">Preço Unit.</th>
                <th className="px-6 py-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredIngredients.map((ing, idx) => {
                    const realQty = ing.packageQuantity * (1 - (ing.lossPercent / 100));
                    const unitPrice = getIngredientRealCost(ing);

                    return (
                        <tr key={ing.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
                            <td className="px-6 py-4 text-gray-400 font-mono">{idx + 1}</td>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{ing.name}</td>
                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">{ing.packageQuantity}</td>
                            <td className="px-6 py-4 text-center">
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded text-xs font-bold border border-gray-200 dark:border-gray-700">
                                    {ing.unit === MeasureUnit.G ? 'GRAMAS' : ing.unit === MeasureUnit.ML ? 'ML' : 'UN'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">R$ {ing.price.toFixed(2)}</td>
                            <td className="px-6 py-4 text-center text-red-500 dark:text-red-400">{ing.lossPercent > 0 ? `${ing.lossPercent}%` : '-'}</td>
                            <td className="px-6 py-4 text-center text-gray-500">{realQty % 1 === 0 ? realQty : realQty.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-800/30">
                                R$ {unitPrice.toFixed(4)} <span className="text-[10px] text-gray-400 font-normal">/ {ing.unit === MeasureUnit.G ? 'gr' : ing.unit === MeasureUnit.ML ? 'ml' : 'und'}</span>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-3">
                                <button onClick={() => handleEdit(ing)} className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition"><Edit2 size={16} /></button>
                                <button onClick={() => deleteIngredient(ing.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
      </div>

      {/* NEW Shopping List Modal */}
      {isShoppingModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[85vh] flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in printable-content">
                  
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 rounded-t-xl no-print">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                            <ShoppingCart size={24} className="text-emerald-600 dark:text-emerald-400" />
                            Lista de Compras
                        </h3>
                        <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
                            Adicione insumos diretamente do cadastro para gerar seu orçamento.
                        </p>
                      </div>
                      <button onClick={() => setIsShoppingModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                  </div>

                  {/* Print Only Header */}
                  <div className="hidden print:block p-6 border-b border-gray-200 mb-4">
                      <h1 className="text-2xl font-bold uppercase">Lista de Compras</h1>
                      <p className="text-sm text-gray-500">Gerado pelo sistema Lucro Fácil Pro</p>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                      
                      {/* Left: Input Selection (Hidden on Print) */}
                      <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col bg-gray-50 dark:bg-gray-900/50 overflow-y-auto no-print">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">1. Buscar Insumo</h4>
                          
                          <div className="relative mb-4">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <input 
                                  type="text" 
                                  placeholder="Digite para buscar..."
                                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-emerald-500 outline-none"
                                  value={shoppingSearch}
                                  onChange={e => setShoppingSearch(e.target.value)}
                              />
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                              {shoppingSearch && filteredIngredientsForShopping.length === 0 && (
                                  <p className="text-center text-gray-400 text-xs py-2">Nenhum insumo encontrado.</p>
                              )}
                              {filteredIngredientsForShopping.map(ing => (
                                  <button 
                                    key={ing.id}
                                    onClick={() => handleSelectIngredient(ing)}
                                    className="w-full text-left bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:shadow-sm transition group"
                                  >
                                      <div className="flex justify-between items-center">
                                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{ing.name}</span>
                                          <Plus size={14} className="text-gray-400 group-hover:text-emerald-500" />
                                      </div>
                                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                                          <span>{ing.packageQuantity} {ing.unit === MeasureUnit.UN ? 'UN' : ing.unit}</span>
                                          <span>R$ {ing.price.toFixed(2)}</span>
                                      </div>
                                  </button>
                              ))}
                              {!shoppingSearch && (
                                  <p className="text-center text-gray-400 text-xs mt-10">Digite o nome do insumo acima para adicionar.</p>
                              )}
                          </div>
                      </div>

                      {/* Right: The List */}
                      <div className="w-full md:w-2/3 p-0 flex flex-col bg-white dark:bg-gray-950">
                          {/* Quantity Modal Overlay */}
                          {qtyModalOpen && selectedIngForQty && (
                              <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
                                  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-sm animate-scale-up border border-gray-200 dark:border-gray-800">
                                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                                          Quantas embalagens de <br/> <span className="text-emerald-600">{selectedIngForQty.name}</span>?
                                      </h4>
                                      <div className="flex justify-center mb-6">
                                          <input 
                                            type="number" 
                                            min="1" 
                                            step="1"
                                            value={packQtyInput}
                                            onChange={e => setPackQtyInput(parseInt(e.target.value) || 0)}
                                            className="text-3xl font-bold text-center w-24 border-b-2 border-emerald-500 bg-transparent text-gray-900 dark:text-white outline-none focus:border-emerald-600"
                                            autoFocus
                                          />
                                      </div>
                                      <div className="space-y-2 text-sm text-gray-500 text-center mb-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                          <p>Total: {Math.floor(packQtyInput)} x R$ {selectedIngForQty.price.toFixed(2)}</p>
                                          <p className="font-bold text-gray-900 dark:text-white">= R$ {(Math.floor(packQtyInput) * selectedIngForQty.price).toFixed(2)}</p>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => setQtyModalOpen(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white rounded-lg font-bold">Cancelar</button>
                                          <button onClick={confirmAddToList} className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">Confirmar</button>
                                      </div>
                                  </div>
                              </div>
                          )}

                          <div className="flex-1 overflow-y-auto p-0">
                              <table className="w-full text-left">
                                  <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 text-[10px] uppercase font-bold sticky top-0 border-b border-gray-200 dark:border-gray-800">
                                      <tr>
                                          <th className="px-4 py-3">Insumo</th>
                                          <th className="px-4 py-3 text-center">Embalagens</th>
                                          <th className="px-4 py-3 text-center">Peso/Qtd</th>
                                          <th className="px-4 py-3 text-center">Unidade</th>
                                          <th className="px-4 py-3 text-right">Conteúdo Total</th>
                                          <th className="px-4 py-3 text-right">Preço (R$)</th>
                                          <th className="px-4 py-3 text-right">Subtotal (R$)</th>
                                          <th className="px-4 py-3 text-center w-10 no-print"></th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                      {shoppingList.length === 0 && (
                                          <tr><td colSpan={8} className="text-center py-20 text-gray-400 italic">Sua lista está vazia. Adicione itens para começar.</td></tr>
                                      )}
                                      {shoppingList.map((item, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                              <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{item.ingredient.name}</td>
                                              <td className="px-4 py-3 text-center font-bold">{item.packages}</td>
                                              <td className="px-4 py-3 text-center text-gray-500">{item.ingredient.packageQuantity}</td>
                                              <td className="px-4 py-3 text-center text-xs text-gray-500">{item.ingredient.unit === MeasureUnit.UN ? 'UN' : item.ingredient.unit === MeasureUnit.G ? 'GRAMAS' : 'ML'}</td>
                                              <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                                                  {item.packages * item.ingredient.packageQuantity} 
                                                  <span className="text-[10px] ml-1 text-gray-400">{item.ingredient.unit === MeasureUnit.UN ? 'un' : item.ingredient.unit === MeasureUnit.G ? 'g' : 'ml'}</span>
                                              </td>
                                              <td className="px-4 py-3 text-right font-mono text-gray-500">R$ {item.ingredient.price.toFixed(2)}</td>
                                              <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white font-mono">R$ {(item.packages * item.ingredient.price).toFixed(2)}</td>
                                              <td className="px-4 py-3 text-center no-print">
                                                  <button onClick={() => removeShoppingListItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                                  <tfoot className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                                      <tr>
                                          <td colSpan={6} className="px-4 py-4 text-right font-bold uppercase text-xs text-gray-500">Total Geral</td>
                                          <td className="px-4 py-4 text-right font-black text-xl text-emerald-600 dark:text-emerald-400">R$ {grandTotal.toFixed(2)}</td>
                                          <td className="no-print"></td>
                                      </tr>
                                  </tfoot>
                              </table>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 rounded-b-xl no-print">
                      <div className="text-xs text-gray-400 italic">
                          * Dados baseados no cadastro de insumos.
                      </div>
                      <div className="flex gap-2">
                          <button 
                            onClick={handlePrint} 
                            disabled={shoppingList.length === 0}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50"
                          >
                              <Printer size={16} /> Imprimir
                          </button>
                          <button 
                            onClick={handlePrint}
                            disabled={shoppingList.length === 0}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
                          >
                              <FileText size={16} /> Salvar PDF
                          </button>
                          <button 
                            onClick={() => setIsShoppingModalOpen(false)} 
                            className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold transition ml-2"
                          >
                              Fechar
                          </button>
                      </div>
                  </div>

              </div>
          </div>
      )}

      {/* Editor Modal (Existing) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase flex items-center gap-2">
                {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                {editingId ? 'Editar Insumo' : 'Novo Insumo'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Nome do Insumo</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Unidade de Medida</label>
                    <select 
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value as MeasureUnit})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red outline-none"
                    >
                        <option value={MeasureUnit.UN}>Unidade</option>
                        <option value={MeasureUnit.G}>Gramas</option>
                        <option value={MeasureUnit.ML}>Mililitros</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Preço do Pacote (R$)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red outline-none"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Peso/Qtd no Pacote</label>
                    <input 
                        type="number" 
                        step="0.01"
                        required
                        value={formData.packageQuantity}
                        onChange={e => setFormData({...formData, packageQuantity: parseFloat(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Perda (%)</label>
                    <input 
                        type="number" 
                        step="0.1"
                        max="100"
                        min="0"
                        required
                        value={formData.lossPercent}
                        onChange={e => setFormData({...formData, lossPercent: parseFloat(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red outline-none"
                    />
                 </div>
              </div>
              
              {/* Live Preview of Calculation */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mt-4">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">Simulação de Custo Real</p>
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Quantidade Real (com perda):</span>
                      <span className="text-gray-900 dark:text-white font-mono">
                          {((formData.packageQuantity || 0) * (1 - ((formData.lossPercent || 0)/100))).toFixed(2)} 
                          {' '}{formData.unit === MeasureUnit.G ? 'g' : formData.unit === MeasureUnit.ML ? 'ml' : 'un'}
                      </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-500 dark:text-gray-400">Custo Final por Unidade:</span>
                      <span className="text-brand-red font-bold font-mono">
                         R$ {
                            formData.packageQuantity && formData.price 
                            ? (formData.price / ((formData.packageQuantity) * (1 - ((formData.lossPercent || 0)/100)))).toFixed(4)
                            : '0.0000'
                         }
                      </span>
                  </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold bg-gray-200 dark:bg-gray-800 rounded-lg transition">Cancelar</button>
                <button type="submit" className="bg-brand-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-900/20">Salvar Insumo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
