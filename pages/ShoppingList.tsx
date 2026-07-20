
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MeasureUnit, Ingredient } from '../types';
import { Trash2, Plus, Search, X, ShoppingCart, Printer, FileText, HelpCircle } from 'lucide-react';

const ShoppingList: React.FC = () => {
  const { ingredients } = useApp();
  
  // --- Shopping List State ---
  const [shoppingList, setShoppingList] = useState<{ingredient: Ingredient, packages: number}[]>([]);
  const [qtyModalOpen, setQtyModalOpen] = useState(false);
  const [selectedIngForQty, setSelectedIngForQty] = useState<Ingredient | null>(null);
  const [packQtyInput, setPackQtyInput] = useState(1);
  const [shoppingSearch, setShoppingSearch] = useState('');
  const [showHelp, setShowHelp] = useState(false);

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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
           <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">Lista de Compras</h2>
                <button 
                    onClick={() => setShowHelp(!showHelp)} 
                    className="text-gray-400 hover:text-brand-red transition-colors"
                    title="A Lista de Compras ajuda a estimar quanto você vai gastar ao comprar insumos."
                >
                    <HelpCircle size={20} />
                </button>
           </div>
           <p className="text-gray-500 dark:text-gray-400">Gere orçamentos e estimativas para sua reposição de estoque.</p>
        </div>
      </div>

      {/* Help Box */}
      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm max-w-4xl no-print">
            <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2"><HelpCircle size={18} /> Como usar a Lista de Compras?</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-4 leading-relaxed">
                <p>A Lista de Compras ajuda a estimar quanto você vai gastar ao comprar insumos. Ela usa os dados cadastrados na aba de Insumos:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Nome do Insumo, Unidade, Peso/Qtd por embalagem, Preço do pacote.</li>
                    <li>Ao incluir, informe <strong>“Quantas EMBALAGENS”</strong> deseja comprar (ex.: 3 pacotes). O sistema calcula:
                        <ul className="list-none ml-6 text-xs mt-1 space-y-1 opacity-80">
                            <li>– Conteúdo total: embalagens × Peso/Qtd (ex.: 3 pacotes × 48 = 144 unidades).</li>
                            <li>– Subtotal (R$): embalagens × Preço do pacote.</li>
                        </ul>
                    </li>
                    <li>O <strong>Total geral (R$)</strong> soma todos os subtotais dos itens adicionados.</li>
                </ul>

                <div>
                    <p className="font-bold mb-1">Passo a passo:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Use a busca por parte do nome do insumo (não importa maiúsculas/minúsculas).</li>
                        <li>Clique no insumo desejado → informe quantidade de embalagens (número inteiro ≥ 1) → clique em adicionar.</li>
                        <li>Confira a tabela: Insumo, Embalagens, Peso/Qtd, Unidade, Conteúdo total, Preço (R$), Subtotal (R$).</li>
                        <li>Utilize os botões <strong>“Imprimir”</strong> ou <strong>“Salvar em PDF”</strong> para gerar seu orçamento físico ou digital.</li>
                    </ol>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 text-xs">
                    <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">Observações:</p>
                    <ul className="list-disc list-inside mt-1">
                        <li>Se algum insumo estiver sem Preço (R$) ou sem Peso/Qtd, não poderá ser adicionado à lista.</li>
                        <li>A Lista de Compras NÃO altera cálculos globais (CMV, PV, etc.); é apenas uma ferramenta de estimativa.</li>
                    </ul>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[75vh] printable-content">
          
          {/* Header for Print only */}
          <div className="hidden print:block p-6 border-b border-gray-200 mb-4">
              <h1 className="text-2xl font-bold uppercase">Lista de Compras</h1>
              <p className="text-sm text-gray-500">Gerado pelo sistema Cardápio Blindado Pro</p>
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
                      <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-4 no-print">
                          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
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
                                  <th className="px-4 py-3 text-right">Preço Un. (Pkg)</th>
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
              </div>
          </div>

      </div>
    </div>
  );
};

export default ShoppingList;
