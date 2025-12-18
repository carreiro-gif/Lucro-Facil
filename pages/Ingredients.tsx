
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MeasureUnit, Ingredient } from '../types';
import { Trash2, Plus, Edit2, Search, HelpCircle, X, ShoppingCart, Calculator, ArrowRight } from 'lucide-react';

const Ingredients: React.FC = () => {
  const { ingredients, products, addIngredient, updateIngredient, deleteIngredient, getIngredientRealCost } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Shopping Calculator State
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

  // --- Shopping Calculator Logic ---
  const addShoppingItem = () => {
      if (!selectedProductToAdd) return;
      // Check if already exists
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

  const shoppingListResult = useMemo(() => {
      const consolidated: Record<string, { name: string, unit: string, qty: number, cost: number }> = {};
      
      shoppingItems.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product && product.ingredients) {
              product.ingredients.forEach(ing => {
                  const ingredientInfo = ingredients.find(i => i.id === ing.ingredientId);
                  if (ingredientInfo) {
                      const totalQty = ing.quantity * item.quantity;
                      const unitCost = getIngredientRealCost(ingredientInfo);
                      const totalCost = unitCost * totalQty;

                      if (consolidated[ing.ingredientId]) {
                          consolidated[ing.ingredientId].qty += totalQty;
                          consolidated[ing.ingredientId].cost += totalCost;
                      } else {
                          consolidated[ing.ingredientId] = {
                              name: ingredientInfo.name,
                              unit: ingredientInfo.unit,
                              qty: totalQty,
                              cost: totalCost
                          };
                      }
                  }
              });
          }
      });

      return Object.values(consolidated).sort((a,b) => a.name.localeCompare(b.name));
  }, [shoppingItems, products, ingredients, getIngredientRealCost]);

  const totalShoppingCost = shoppingListResult.reduce((acc, item) => acc + item.cost, 0);

  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-20 space-y-6">
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
                    title="Calculadora de Compras"
                >
                    <ShoppingCart size={18} /> <span className="hidden xl:inline">CALC. COMPRAS</span>
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
                    // Calculations for display
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

      {/* Shopping Calculator Modal */}
      {isShoppingModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[85vh] flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in">
                  
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 rounded-t-xl">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                            <Calculator size={24} className="text-emerald-600 dark:text-emerald-400" />
                            Calculadora de Compras
                        </h3>
                        <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
                            Simule suas vendas para gerar a lista de insumos necessária.
                        </p>
                      </div>
                      <button onClick={() => setIsShoppingModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                      
                      {/* Left: Input Selection */}
                      <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">1. O que você vai vender?</h4>
                          
                          <div className="flex gap-2 mb-4">
                              <select 
                                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs p-2 rounded outline-none focus:border-emerald-500"
                                  value={selectedProductToAdd}
                                  onChange={e => setSelectedProductToAdd(e.target.value)}
                              >
                                  <option value="">Selecione um Produto...</option>
                                  {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                              </select>
                              <button 
                                onClick={addShoppingItem}
                                disabled={!selectedProductToAdd}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  <Plus size={16} />
                              </button>
                          </div>

                          <div className="space-y-2">
                              {shoppingItems.length === 0 && <p className="text-center text-gray-400 text-xs py-4 italic">Nenhum produto adicionado.</p>}
                              {shoppingItems.map((item, idx) => {
                                  const prod = products.find(p => p.id === item.productId);
                                  if (!prod) return null;
                                  return (
                                      <div key={idx} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
                                          <div className="flex-1 min-w-0 pr-2">
                                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate" title={prod.name}>{prod.name}</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <input 
                                                  type="number" 
                                                  min="1"
                                                  value={item.quantity}
                                                  onChange={(e) => updateShoppingItemQty(idx, parseInt(e.target.value) || 0)}
                                                  className="w-12 text-center bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs py-1"
                                              />
                                              <button onClick={() => removeShoppingItem(idx)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      {/* Right: Result List */}
                      <div className="w-full md:w-2/3 p-0 flex flex-col bg-white dark:bg-gray-950">
                          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 flex justify-between items-center">
                              <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                  <ShoppingCart size={14} /> 2. Lista de Compras Necessária
                              </h4>
                              <div className="text-right">
                                  <span className="text-[10px] text-gray-500 uppercase block">Custo Estimado</span>
                                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">R$ {totalShoppingCost.toFixed(2)}</span>
                              </div>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-0">
                              <table className="w-full text-left">
                                  <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 text-[10px] uppercase font-bold sticky top-0">
                                      <tr>
                                          <th className="px-4 py-2">Insumo</th>
                                          <th className="px-4 py-2 text-center">Unidade</th>
                                          <th className="px-4 py-2 text-right">Qtd. Total</th>
                                          <th className="px-4 py-2 text-right">Custo Est.</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                      {shoppingListResult.length === 0 && (
                                          <tr><td colSpan={4} className="text-center py-10 text-gray-400 italic">Adicione produtos à esquerda para gerar a lista.</td></tr>
                                      )}
                                      {shoppingListResult.map((item, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                              <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                                              <td className="px-4 py-2 text-center text-xs text-gray-500">{item.unit}</td>
                                              <td className="px-4 py-2 text-right font-bold font-mono">
                                                  {item.qty.toFixed(2)}
                                                  <span className="text-[10px] font-normal text-gray-400 ml-1">
                                                      {item.unit === MeasureUnit.G ? 'g' : item.unit === MeasureUnit.ML ? 'ml' : 'un'}
                                                  </span>
                                              </td>
                                              <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">R$ {item.cost.toFixed(2)}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                      <button 
                        onClick={() => setIsShoppingModalOpen(false)} 
                        className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold transition"
                      >
                          Fechar
                      </button>
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
