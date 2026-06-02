import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Target, Anchor, Plus, Calculator, Zap, AlertTriangle, ArrowRight, Tag, HelpCircle, Copy, Check, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { Product, ProductIngredient } from '../types';

const formatMoney = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

const SmartOffers: React.FC = () => {
  const { 
    products, 
    cfi,
    updateProduct, 
    getProductCMV, 
    calculateTotalCfiPercent,
    ingredients,
    addProduct,
    salesTransactions = []
  } = useApp();

  const [reguaDaCasa, setReguaDaCasa] = useState<number | null>(null);
  const [dismissedAnchors, setDismissedAnchors] = useState<Set<string>>(new Set());

  // Helper calculating profit margin of a product
  const getProductMargin = (p: Product) => p.pricing?.profitMargin ?? cfi.profitMargin;

  // Derive auto selections from sales
  const { autoTopSellers, autoSlowMovers, hasSalesData } = useMemo(() => {
    const hasData = salesTransactions.length > 0;
    const topSet = new Set<string>();
    const slowSet = new Set<string>();
    
    if (hasData) {
      const vols: Record<string, number> = {};
      salesTransactions.forEach(t => {
         vols[t.productId] = (vols[t.productId] || 0) + t.qty;
      });
      const sorted = [...products].sort((a, b) => (vols[b.id] || 0) - (vols[a.id] || 0));
      const topCount = Math.max(1, Math.ceil(products.length * 0.2)); // Top 20%
      
      sorted.slice(0, topCount).forEach(p => {
         if ((vols[p.id] || 0) > 0) topSet.add(p.id);
      });
      sorted.forEach(p => {
         // Se não aparece nas vendas ou aparece com volume muito baixo (<= 2)
         if ((vols[p.id] || 0) <= 2) slowSet.add(p.id);
      });
    }
    return { autoTopSellers: topSet, autoSlowMovers: slowSet, hasSalesData: hasData };
  }, [salesTransactions, products]);

  const isProductTopSeller = (p: Product) => p.isTopSeller !== undefined ? p.isTopSeller : autoTopSellers.has(p.id);
  const isProductSlowMover = (p: Product) => p.isSlowMover !== undefined ? p.isSlowMover : autoSlowMovers.has(p.id);

  const topSellers = products.filter(p => isProductTopSeller(p));
  const slowMovers = products.filter(p => isProductSlowMover(p));
  
  const calculateRegua = () => {
    if (topSellers.length === 0) return 0;
    const total = topSellers.reduce((acc, p) => acc + getProductMargin(p), 0);
    const avg = total / topSellers.length;
    setReguaDaCasa(parseFloat(avg.toFixed(1)));
    return avg;
  };

  // We should recalculate visually, or automatically? Prompt says: "Deve haver um botão chamado Calcular Régua da Casa que soma automaticamente..."
  
  const currentRegua = reguaDaCasa ?? (topSellers.length > 0 ? topSellers.reduce((a, b) => a + getProductMargin(b), 0) / topSellers.length : 0);

  const fatProducts = products.filter(p => getProductMargin(p) > currentRegua && currentRegua > 0);
  const thinProducts = products.filter(p => getProductMargin(p) < currentRegua && currentRegua > 0);

  // Toggle helpers
  const toggleTopSeller = (id: string, current: boolean) => updateProduct(id, { isTopSeller: !current, isSlowMover: false });
  const toggleSlowMover = (id: string, current: boolean) => updateProduct(id, { isSlowMover: !current, isTopSeller: false });

  // For Section 2: Anchor Products
  const anchorProducts = products.filter(p => p.isAnchor);
  
  const potentialAnchors = useMemo(() => {
    return products.filter(p => {
      if (p.isAnchor) return false;
      const cmvCost = getProductCMV(p);
      const salePrice = p.fixedPriceStore || 0;
      if (salePrice <= 0 || cmvCost <= 0) return false;
      
      const cmvPercent = (cmvCost / salePrice) * 100;
      const margin = getProductMargin(p);
      
      return cmvPercent < 30 && margin >= (currentRegua + 10);
    });
  }, [products, currentRegua, getProductCMV]);

  const visiblePotentialAnchors = potentialAnchors.filter(p => !dismissedAnchors.has(p.id));

  const toggleAnchor = (id: string, current: boolean) => updateProduct(id, { isAnchor: !current });

  const [isCreatingAnchor, setIsCreatingAnchor] = useState(false);
  const [newAnchorName, setNewAnchorName] = useState('');
  const [newAnchorIngredients, setNewAnchorIngredients] = useState<ProductIngredient[]>([{ ingredientId: '', quantity: 1 }]);

  // Dummy product to calculate live CMV for the form
  const dummyAnchorProduct: Product = useMemo(() => ({
    id: 'temp_anchor',
    name: newAnchorName || 'Novo Produto',
    category: 'Oficina',
    order: 0,
    ingredients: newAnchorIngredients.filter(i => i.ingredientId && i.quantity > 0)
  }), [newAnchorName, newAnchorIngredients]);

  const newAnchorCMV = getProductCMV(dummyAnchorProduct);
  const newAnchorTargetMargin = currentRegua + 10;
  
  // Calculate suggested price: CMV / (1 - (CFI/100 + Margin/100))
  // wait, calculateStorePrice logic from Pricing.tsx needs totalCfi:
  const totalCfi = calculateTotalCfiPercent();
  const totalDeductions = (totalCfi + newAnchorTargetMargin) / 100;
  let newAnchorSuggestedPrice = 0;
  if (totalDeductions < 1 && newAnchorCMV > 0) {
    newAnchorSuggestedPrice = newAnchorCMV / (1 - totalDeductions);
  }

  const handleSaveAnchor = () => {
    if (!newAnchorName || newAnchorIngredients.filter(i => i.ingredientId).length === 0) {
      alert("Preencha o nome e adicione pelo menos um ingrediente.");
      return;
    }
    const newId = Date.now().toString();
    const newProd: Product = {
      id: newId,
      name: newAnchorName,
      category: 'Geral', // Default category
      order: 999,
      isAnchor: true,
      ingredients: newAnchorIngredients.filter(i => i.ingredientId && i.quantity > 0),
      fixedPriceStore: parseFloat(newAnchorSuggestedPrice.toFixed(2)),
      pricing: {
        profitMargin: newAnchorTargetMargin
      }
    };
    addProduct(newProd);
    setIsCreatingAnchor(false);
    setNewAnchorName('');
    setNewAnchorIngredients([{ ingredientId: '', quantity: 1 }]);
  };

  // Section 3 State
  const [selectedOfferType, setSelectedOfferType] = useState<'dia' | 'salva_margem' | 'bomba' | 'chamariz' | null>(null);
  const [offerProduct1Id, setOfferProduct1Id] = useState('');
  const [offerProduct2Id, setOfferProduct2Id] = useState('');
  const [offerDesiredMargin, setOfferDesiredMargin] = useState(currentRegua);

  // Computed for Section 3
  const offerP1 = products.find(p => p.id === offerProduct1Id);
  const offerP2 = products.find(p => p.id === offerProduct2Id);
  const offerTotalCMV = (offerP1 ? getProductCMV(offerP1) : 0) + (offerP2 ? getProductCMV(offerP2) : 0);
  
  let offerSuggestedPrice = 0;
  const offerDeductions = (totalCfi + offerDesiredMargin) / 100;
  if (offerDeductions < 1 && offerTotalCMV > 0) {
    offerSuggestedPrice = offerTotalCMV / (1 - offerDeductions);
  }

  // Broken price components
  const p1FullPrice = offerP1?.fixedPriceStore || 0;
  const p2FullPrice = offerP2?.fixedPriceStore || 0;
  const originalTotalPrice = p1FullPrice + p2FullPrice;

  // Decide dynamically the broken price based on type
  let pFullStr = p1FullPrice > p2FullPrice ? offerP1?.name : offerP2?.name;
  let pFullValue = p1FullPrice > p2FullPrice ? p1FullPrice : p2FullPrice;
  let pAddedStr = p1FullPrice > p2FullPrice ? offerP2?.name : offerP1?.name;
  let priceAdded = Math.max(0, offerSuggestedPrice - pFullValue);

  return (
    <div className="space-y-12">
      {/* Xande Intro Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-white/5 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-red-900/30">
            <Zap className="text-white w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-white mb-2">Olá! Analisei o seu cardápio</h2>
            <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
              Estou pronto para te ajudar a montar ofertas que aumentam o seu lucro sem precisar dar desconto errado. Por onde quer começar?
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button 
                onClick={() => document.getElementById('section-listas')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 border border-white/10"
              >
                <Tag size={14} /> Quero ver as 4 Listas
              </button>
              <button 
                onClick={() => document.getElementById('section-ofertas')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 bg-brand-yellow hover:bg-yellow-500 text-slate-900 rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 shadow-lg shadow-brand-yellow/30"
              >
                <Plus size={14} /> Quero montar oferta agora
              </button>
              <button 
                onClick={() => document.getElementById('section-recomenda')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 border border-white/10"
              >
                <Target size={14} /> Ver o que o Xande recomenda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: As 4 Listas do Cardápio */}
      <section id="section-listas" className="space-y-6">
        {!hasSalesData && (
          <div className="text-xs text-brand-red mb-4 bg-brand-red/10 p-3 rounded-lg border border-brand-red/20">
            <AlertTriangle className="inline-block w-4 h-4 mr-1 mb-0.5" />
            <strong>Dica:</strong> Importe suas vendas na tela "Integrar Vendas" para que o sistema identifique automaticamente os produtos Campeões e Parados!
          </div>
        )}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Tag className="text-brand-yellow drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> 1. As 4 Listas do Cardápio
          </h2>
          <button 
            onClick={calculateRegua}
            className="bg-brand-yellow hover:bg-yellow-500 text-slate-900 font-bold text-xs uppercase px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 shadow-brand-yellow/30"
          >
            <Calculator size={14} /> Calcular Régua da Casa
          </button>
        </div>

        {reguaDaCasa !== null && (
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center animate-fade-in">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Régua da Casa Calculada</p>
            <div className="text-4xl font-black text-emerald-700 dark:text-emerald-500">{reguaDaCasa}%</div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-2">Esta é a média de lucro atual dos seus produtos campeões.</p>
          </div>
        )}

        {/* The 4 Lists Grids */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Campeões */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2"><TrendingUp className="text-emerald-500"/> Campeões de Venda</h3>
            <p className="text-xs text-gray-500 mb-4">Marque os produtos que mais saem na sua loja. (Eles vão definir a sua Régua da Casa)</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-800/30">
                  <div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{p.name}</div>
                    <div className="text-[10px] text-gray-500">CMV: {formatMoney(getProductCMV(p))} • Lucro: {getProductMargin(p)}%</div>
                  </div>
                  <button onClick={() => toggleTopSeller(p.id, isProductTopSeller(p))} className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${isProductTopSeller(p) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'}`}>
                    <Check size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Parados */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2"><TrendingDown className="text-red-500"/> Produtos Parados</h3>
            <p className="text-xs text-gray-500 mb-4">Marque os produtos que quase não saem. Precisamos investigar o porquê.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-800/30">
                  <div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{p.name}</div>
                    <div className="text-[10px] text-gray-500">CMV: {formatMoney(getProductCMV(p))} • Lucro: {getProductMargin(p)}%</div>
                  </div>
                  <button onClick={() => toggleSlowMover(p.id, isProductSlowMover(p))} className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${isProductSlowMover(p) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'}`}>
                    <Check size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Gordos */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">🍔 Produtos Gordos</h3>
            <p className="text-xs text-gray-500 mb-4">Margem de lucro maior que a Régua da Casa ({currentRegua}%).</p>
            {currentRegua === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">Calcule a Régua da Casa primeiro.</div>
            ) : fatProducts.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">Nenhum produto atinge a meta.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {fatProducts.map(p => (
                  <div key={p.id} className="flex flex-col p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{p.name}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Lucro: {getProductMargin(p)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Magros */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800/50 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">🍟 Produtos Magros</h3>
            <p className="text-xs text-gray-500 mb-4">Margem inferior à Régua da Casa ({currentRegua}%).</p>
            {currentRegua === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">Calcule a Régua da Casa primeiro.</div>
            ) : thinProducts.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">Ótimo! Nenhum produto com margem ruim.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {thinProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">{p.name} {p.isTopSeller && <AlertTriangle size={12} className="text-red-500" title="Alerta: Campeão magro!" />}</span>
                      <span className="text-[10px] text-red-600 dark:text-red-400">Lucro: {getProductMargin(p)}%</span>
                    </div>
                    {p.isTopSeller && (
                      <span className="text-[9px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-bold px-2 py-1 rounded">PERIGO</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Produtos Âncora */}
      <section className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Anchor className="text-brand-yellow" /> 2. Produtos Âncora
          </h2>
          {anchorProducts.length < 3 && (
            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> Sugerido: Min 3
            </span>
          )}
        </div>

        {anchorProducts.length < 3 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex gap-3 items-start">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-500">Sua loja tem apenas {anchorProducts.length} Produto{anchorProducts.length !== 1 && 's'} Âncora cadastrado{anchorProducts.length !== 1 && 's'}.</h4>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">O ideal são pelo menos 3 para você ter flexibilidade na hora de montar ofertas. Quer criar um agora?</p>
            </div>
          </div>
        )}

        {/* Sugestões Inteligentes do Xande */}
        <div className="mb-6">
           <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-3 flex items-center gap-2">
             <Zap className="text-brand-yellow w-4 h-4" /> Sugestões Inteligentes do Xande
           </h3>
           {visiblePotentialAnchors.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {visiblePotentialAnchors.map(p => (
                 <div key={p.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl relative shadow-sm">
                   <div className="absolute top-3 right-3 text-blue-500 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 p-1.5 rounded-full">
                     <Anchor size={14} />
                   </div>
                   <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 pr-8">{p.name}</h4>
                   <p className="text-xs text-blue-700 dark:text-blue-300 mb-4 leading-relaxed">
                     Identifiquei este produto! Ele tem custo muito baixo (CMV {((getProductCMV(p) / (p.fixedPriceStore || 1)) * 100).toFixed(1)}%) e alta margem ({getProductMargin(p)}%), ideal para turbinar combos e aumentar seu lucro bancando ofertas.
                   </p>
                   <div className="flex gap-2">
                     <button onClick={() => updateProduct(p.id, { isAnchor: true })} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                       Confirmar Âncora
                     </button>
                     <button onClick={() => setDismissedAnchors(prev => new Set(prev).add(p.id))} className="px-3 bg-white hover:bg-gray-50 border border-blue-200 text-blue-600 text-xs font-bold py-2 rounded-lg transition-colors">
                       Descartar
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                   Não encontrei candidatos automáticos no seu cardápio com CMV abaixo de 30% e alta margem.
                   Sugiro criar novos produtos como batata frita, bebidas ou sobremesas para servirem como âncora!
                </p>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Identificação de Âncoras Auto / Seleção */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4">Escolher Manualmente do Cardápio</h3>
            <p className="text-xs text-gray-500 mb-4">Selecione produtos de baixo custo e alta margem para serem suas âncoras (ex: batatas, bebidas).</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {products.map(p => {
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-500">CMV: {formatMoney(getProductCMV(p))} • Lucro: {getProductMargin(p)}%</div>
                      </div>
                    </div>
                    <button onClick={() => toggleAnchor(p.id, !!p.isAnchor)} className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${p.isAnchor ? 'bg-brand-red border-brand-red text-white' : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-brand-red hover:text-brand-red'}`}>
                      <Anchor size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Criar Produto Âncora Agora */}
          {isCreatingAnchor ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 p-5 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                  <Anchor className="text-brand-yellow"/> Novo Produto Âncora
                </h3>
                <button onClick={() => setIsCreatingAnchor(false)} className="text-gray-400 hover:text-gray-600 text-xs">Cancelar</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Nome Atrativo (ex: Fritas Turbinada)</label>
                  <input type="text" value={newAnchorName} onChange={e => setNewAnchorName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white" placeholder="Nome do produto" />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Ingredientes</label>
                  <div className="space-y-2 mb-2">
                    {newAnchorIngredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select
                          value={ing.ingredientId}
                          onChange={(e) => {
                            const newArr = [...newAnchorIngredients];
                            newArr[idx].ingredientId = e.target.value;
                            setNewAnchorIngredients(newArr);
                          }}
                          className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white"
                        >
                          <option value="">Selecione...</option>
                          {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="Qtd (g/ml)"
                          value={ing.quantity || ''}
                          onChange={(e) => {
                            const newArr = [...newAnchorIngredients];
                            newArr[idx].quantity = parseFloat(e.target.value);
                            setNewAnchorIngredients(newArr);
                          }}
                          className="w-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-center text-gray-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setNewAnchorIngredients([...newAnchorIngredients, { ingredientId: '', quantity: 1 }])} className="text-[10px] text-blue-600 font-bold uppercase">+ Adicionar Ingrediente</button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <span className="block text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">Resumo Calculado</span>
                    <span className="text-xs text-blue-800 dark:text-blue-300">CMV: {formatMoney(newAnchorCMV)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-brand-red uppercase font-bold">Preço Sugerido (Loja Física)</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white">R$ {newAnchorSuggestedPrice.toFixed(2)}</span>
                    <span className="block text-[10px] text-emerald-600">Terá {newAnchorTargetMargin}% de Margem</span>
                  </div>
                </div>

                <button onClick={handleSaveAnchor} className="w-full bg-brand-yellow hover:bg-yellow-500 text-slate-900 font-bold text-sm uppercase px-4 py-3 rounded-lg shadow-md shadow-brand-yellow/20 transition-all">
                  Salvar Âncora Agora
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200 dark:border-blue-800/50 p-5 flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Anchor className="text-blue-600 dark:text-blue-400 w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-blue-900 dark:text-blue-400 mb-2">Faltam Âncoras?</h3>
              <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mb-6 max-w-sm">
                Crie rapidamente uma nova Batata Frita, Milkshake ou Sobremesa Turbinada agora mesmo. O sistema calcula o preço ideal.
              </p>
              <button 
                onClick={() => setIsCreatingAnchor(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase px-6 py-3 rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Criar Produto Âncora Agora
              </button>
            </div>
          )}
        </div>

        {/* Anchor Cards Panel */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4">Seus Produtos Âncora Ativos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {anchorProducts.map(p => {
              const margin = getProductMargin(p);
              let statusColor = 'text-red-500 bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800/50';
              if (margin >= currentRegua + 10) statusColor = 'text-emerald-500 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50';
              else if (margin >= currentRegua) statusColor = 'text-amber-500 bg-amber-100 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50';

              return (
                <div key={p.id} className={`rounded-xl border p-4 ${statusColor} relative overflow-hidden group transition-all`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm truncate pr-6">{p.name}</h4>
                    <Anchor size={14} className="opacity-50 absolute top-4 right-4" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div>
                      <span className="block opacity-70 text-[10px] uppercase font-bold">Custo (CMV)</span>
                      <span className="font-black">{formatMoney(getProductCMV(p))}</span>
                    </div>
                    <div>
                      <span className="block opacity-70 text-[10px] uppercase font-bold">Preço de Venda</span>
                      <span className="font-black">R$ {(p.fixedPriceStore ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="block opacity-70 text-[10px] uppercase font-bold">Margem</span>
                      <span className="font-black text-lg leading-none">{margin}%</span>
                    </div>
                    <div className="flex gap-2">
                       <button className="p-2 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded-lg transition-colors" title="Editar este produto">
                         <Edit3 size={14} />
                       </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 3 - anchorProducts.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 p-4 flex flex-col items-center justify-center min-h-[140px] opacity-70 hover:opacity-100 transition-opacity cursor-pointer group">
                <Plus className="text-gray-400 group-hover:text-brand-red mb-2 transition-colors" />
                <span className="text-xs font-bold text-gray-500 uppercase">Adicionar Âncora</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Monte sua Oferta */}
      <section id="section-ofertas" className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Calculator className="text-brand-yellow" /> 3. Monte sua Oferta
          </h2>
        </div>

        {!selectedOfferType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => { setSelectedOfferType('dia'); setOfferDesiredMargin(currentRegua); setOfferProduct1Id(''); setOfferProduct2Id(''); }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 p-6 rounded-xl text-left transition-all group">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 group-hover:text-blue-600"><Tag size={20}/> Oferta do Dia</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Sem risco, use todo dia, combina dois produtos lucrativos (Gordo + Gordo/Âncora). Mantém a Régua da Casa.</p>
            </button>
            <button onClick={() => { setSelectedOfferType('salva_margem'); setOfferDesiredMargin(currentRegua); setOfferProduct1Id(''); setOfferProduct2Id(''); }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-6 rounded-xl text-left transition-all group">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 group-hover:text-emerald-600"><TrendingUp size={20}/> Oferta Salva Margem</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Salva o lucro do seu produto mais vendido usando um Produto Turbinado. Eleva a margem do campeão.</p>
            </button>
            <button onClick={() => { setSelectedOfferType('bomba'); setOfferDesiredMargin(currentRegua - 2); setOfferProduct1Id(''); setOfferProduct2Id(''); }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-amber-500 dark:hover:border-amber-500 p-6 rounded-xl text-left transition-all group">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 group-hover:text-amber-600"><Zap size={20}/> Oferta Bomba de Vendas</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Escala seus pedidos unindo seu campeão de vendas com um Produto Turbinado. Foca em volume financeiro total.</p>
            </button>
            <button onClick={() => { setSelectedOfferType('chamariz'); setOfferDesiredMargin(currentRegua - 10); setOfferProduct1Id(''); setOfferProduct2Id(''); }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-500 dark:hover:border-red-500 p-6 rounded-xl text-left transition-all group">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 group-hover:text-red-600"><AlertTriangle size={20}/> Oferta Chamariz</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Use só na inauguração, lançamento de produto ou ação de marketing pontual. Nunca use no dia a dia. Sacrifica lucro para giro rápido.</p>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800/50 pb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {selectedOfferType === 'dia' ? <><Tag className="text-blue-500"/> Oferta do Dia</> :
                 selectedOfferType === 'salva_margem' ? <><TrendingUp className="text-emerald-500"/> Oferta Salva Margem</> :
                 selectedOfferType === 'bomba' ? <><Zap className="text-amber-500"/> Oferta Bomba de Vendas</> :
                 <><AlertTriangle className="text-red-500"/> Oferta Chamariz</>}
              </h3>
              <button onClick={() => setSelectedOfferType(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold uppercase tracking-wider">
                Voltar aos tipos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Produto Principal</label>
                  <select value={offerProduct1Id} onChange={e => setOfferProduct1Id(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red">
                    <option value="">Selecione...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Margem: {getProductMargin(p)}%)</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Produto Turbinado / Âncora</label>
                  <select value={offerProduct2Id} onChange={e => setOfferProduct2Id(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red">
                    <option value="">Selecione...</option>
                    {anchorProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Âncora)</option>)}
                    <optgroup label="Outros Produtos Gordos">
                      {fatProducts.filter(f => !f.isAnchor).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block flex items-center justify-between">
                    <span>Lucro Mínimo Desejado (%)</span>
                    <span className="text-brand-red">Régua atual: {currentRegua}%</span>
                  </label>
                  <input type="number" step="1" value={offerDesiredMargin} onChange={e => setOfferDesiredMargin(parseFloat(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red font-bold" />
                  <p className="text-[10px] text-gray-400 mt-1">Este é o percentual livre que vai sobrar além dos custos do produto e despesas fixas da loja.</p>
                </div>
              </div>

              {offerProduct1Id && offerProduct2Id && offerSuggestedPrice > 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-center">
                  <div className="text-center mb-6">
                    <span className="block text-xs uppercase font-bold text-gray-500 mb-2">Preço Ideal da Oferta</span>
                    <div className="text-4xl font-black text-gray-900 dark:text-white">R$ {offerSuggestedPrice.toFixed(2)}</div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-2">Garante {offerDesiredMargin}% de Lucro Real</div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative group">
                      <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded-bl-lg uppercase">Versão Direta</div>
                      <div className="text-[10px] text-gray-400 mb-1">Custo original dos dois: {formatMoney(originalTotalPrice)}</div>
                      <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                        Combo {offerP1?.name} + {offerP2?.name} por R$ {offerSuggestedPrice.toFixed(2)}.
                      </div>
                      <button className="mt-2 text-[10px] text-blue-600 font-bold uppercase hover:underline flex items-center gap-1" onClick={() => navigator.clipboard.writeText(`Combo ${offerP1?.name} + ${offerP2?.name} por R$ ${offerSuggestedPrice.toFixed(2)}.`)}>
                        <Copy size={12} /> Copiar
                      </button>
                    </div>

                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative group">
                      <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded-bl-lg uppercase">Versão Quebrada (Melhor para Apps)</div>
                      <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                        Compre {pFullStr} por R$ {pFullValue.toFixed(2)} e leve {pAddedStr} por apenas +R$ {priceAdded.toFixed(2)}.
                      </div>
                      <button className="mt-2 text-[10px] text-emerald-600 font-bold uppercase hover:underline flex items-center gap-1" onClick={() => navigator.clipboard.writeText(`Compre ${pFullStr} por R$ ${pFullValue.toFixed(2)} e leve ${pAddedStr} por apenas +R$ ${priceAdded.toFixed(2)}.`)}>
                        <Copy size={12} /> Copiar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/50 dark:bg-gray-800/10 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-6 text-center h-full">
                  <Calculator className="text-gray-300 dark:text-gray-600 w-12 h-12 mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[200px]">Selecione os dois produtos ao lado para calcular o preço ideal.</p>
                </div>
              )}
            </div>

            {/* Explicação Estratégica & Benefícios sob medida com Xande */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/85">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/15 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 sm:p-6 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-2xl shrink-0 shadow-sm animate-pulse-subtle">
                    👨‍🍳
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] bg-blue-600 dark:bg-blue-500 text-white font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-mono">Dica de Precificação de Xande</span>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                          Entendendo a {selectedOfferType === 'dia' ? 'Oferta do Dia' : 
                                               selectedOfferType === 'salva_margem' ? 'Oferta Salva Margem' : 
                                               selectedOfferType === 'bomba' ? 'Oferta Bomba de Vendas' : 'Oferta Chamariz'}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Confira os benefícios operacionais e dicas táticas preparadas especialmente para este modelo de combo.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
                      <div className="space-y-1">
                        <span className="font-bold text-blue-700 dark:text-blue-400 block uppercase text-[10px] tracking-wider">❓ O Que é?</span>
                        <p className="text-gray-650 dark:text-gray-300">
                          {selectedOfferType === 'dia' && "Combinação inteligente de dois produtos de alta margem (Gordo + Gordo ou Gordo + Turbinado). Não exige dar descontos generosos que machuquem a saúde financeira."}
                          {selectedOfferType === 'salva_margem' && "Uma tática vital para resgate de lucro. Une um item Campeão de Vendas Magro (vende muito, mas com baixíssimo lucro) a um Produto Turbinado de alta rentabilidade para equilibrar."}
                          {selectedOfferType === 'bomba' && "Campanha focada em volume de pedidos de pico. Reúne um grande campeão com um ótimo produto turbinado, reduzindo ligeiramente a margem global para as vendas subirem."}
                          {selectedOfferType === 'chamariz' && "Isca agressiva de curtíssimo prazo montada com margem reduzida ao teto mínimo aceitável, com o objetivo de puxar tráfego novo para a hamburgueria."}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block uppercase text-[10px] tracking-wider">🤑 Benefício Real?</span>
                        <p className="text-gray-650 dark:text-gray-300">
                          {selectedOfferType === 'dia' && "Preserva a Régua da Casa e incentiva o aumento natural do ticket médio (o cliente consome mais em um checkout único de forma sustentável)."}
                          {selectedOfferType === 'salva_margem' && "Zera o impacto negativo do campeão de baixa margem. Ao forçar a compra conjunta de um turbinado, o lucro total recupera o fôlego."}
                          {selectedOfferType === 'bomba' && "Gera um pico de faturamento e acelera a vazão da cozinha em noites fracas, ajudando a diluir mais rapidamente seus custos fixos."}
                          {selectedOfferType === 'chamariz' && "Atração de público frio. Funciona como publicidade ativa, de forma que o custo do desconto opera como custo de aquisição do cliente."}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-amber-700 dark:text-amber-400 block uppercase text-[10px] tracking-wider">🎯 Como Executar?</span>
                        <p className="text-gray-650 dark:text-gray-300">
                          {selectedOfferType === 'dia' && "Pode rodar perenemente durante toda a semana. Divulgue nos seus canais digitais e stories, destacando a praticidade de garantir o combo."}
                          {selectedOfferType === 'salva_margem' && "Use preferencialmente a 'versão quebrada' (compre o hambúrguer no preço cheio e leve a batata/bebida por apenas mais R$ X,XX). É irresistível!"}
                          {selectedOfferType === 'bomba' && "Excelente para faturar mais rápido às sextas e fins de semana de chuva. Crie banners chamativos com fotos apetitosas enfatizando a fartura."}
                          {selectedOfferType === 'chamariz' && "ATENÇÃO DE XANDE: Nunca use no cardápio fixo diário! Aplique apenas em eventos isolados de marketing (Inauguração, Lançamento de Hambúrguer ou Aniversário)."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 4: Xande Recomenda */}
      <section id="section-recomenda" className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800 pb-12">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Target className="text-brand-yellow" /> 4. Xande Recomenda
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {thinProducts.filter(p => p.isTopSeller).slice(0, 1).map(p => {
             const anchor = anchorProducts[0] || fatProducts[0];
             return (
               <div key={`rec-1-${p.id}`} className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-5 relative overflow-hidden group">
                 <div className="flex gap-3 relative z-10">
                   <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex flex-col items-center justify-center shrink-0">
                     <span className="text-lg">🤖</span>
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 uppercase text-emerald-800 dark:text-emerald-400">Oferta Salva Margem Urgente</h3>
                     <p className="text-xs text-gray-700 dark:text-gray-300 mb-4">
                       Notei que o seu campeão <strong>{p.name}</strong> está dando menos lucro que a Régua da Casa ({getProductMargin(p)}% vs {currentRegua}%). Combine ele com {anchor?.name || 'um produto turbinado'} para salvar a margem!
                     </p>
                     <button
                       onClick={() => {
                         setSelectedOfferType('salva_margem');
                         setOfferDesiredMargin(currentRegua);
                         setOfferProduct1Id(p.id);
                         setOfferProduct2Id(anchor?.id || '');
                         window.scrollTo({ top: 800, behavior: 'smooth' }); // Scroll approximation
                       }}
                       className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg transition shadow-sm"
                     >
                       Criar essa Oferta
                     </button>
                   </div>
                 </div>
               </div>
             )
          })}

          {anchorProducts.length === 0 ? (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800/50 rounded-xl p-5 relative overflow-hidden group">
               <div className="flex gap-3 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800/50 flex flex-col items-center justify-center shrink-0">
                   <span className="text-lg">🤖</span>
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 uppercase text-blue-800 dark:text-blue-400">🚨 Falta Produto Âncora</h3>
                   <p className="text-xs text-gray-700 dark:text-gray-300 mb-4">
                     Percebi que você ainda não definiu nenhum Produto Âncora. Eles são o segredo das ofertas lucrativas. Que tal criar um agora?
                   </p>
                   <button
                     onClick={() => {
                       setIsCreatingAnchor(true);
                       window.scrollTo({ top: 300, behavior: 'smooth' });
                     }}
                     className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg transition shadow-sm"
                   >
                     Criar Âncora
                   </button>
                 </div>
               </div>
             </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5 relative overflow-hidden group">
               <div className="flex gap-3 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/50 flex flex-col items-center justify-center shrink-0">
                   <span className="text-lg">📈</span>
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 uppercase text-amber-800 dark:text-amber-400">Hora de Escalar: Bomba de Vendas</h3>
                   <p className="text-xs text-gray-700 dark:text-gray-300 mb-4">
                     Seu cardápio está saudável! Vamos usar <strong>{topSellers[0]?.name || 'seu melhor lanche'}</strong> junto com <strong>{anchorProducts[0]?.name}</strong> para aumentar o ticket médio.
                   </p>
                   <button
                     onClick={() => {
                       setSelectedOfferType('bomba');
                       setOfferDesiredMargin(currentRegua - 2);
                       setOfferProduct1Id(topSellers[0]?.id || '');
                       setOfferProduct2Id(anchorProducts[0]?.id || '');
                       window.scrollTo({ top: 800, behavior: 'smooth' });
                     }}
                     className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg transition shadow-sm"
                   >
                     Criar Bomba de Vendas
                   </button>
                 </div>
               </div>
             </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default SmartOffers;

