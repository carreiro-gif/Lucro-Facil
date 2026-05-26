
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Save,
  Trash2,
  Info,
  X,
  Plus,
  CloudUpload,
  Scale,
  GlassWater,
  Package,
  ArrowUpRight,
  DollarSign,
  Percent,
  HelpCircle
} from 'lucide-react';
import { PurchaseEntry, PurchaseEntryItem, MeasureUnit, SupplierMapping, Ingredient, Product } from '../types';
import { formatMoney, formatPercent } from '../constants';

const PurchaseEntryPage: React.FC = () => {
  const { 
    ingredients, 
    products, 
    purchaseEntries, 
    supplierMappings,
    addPurchaseEntry,
    deletePurchaseEntry,
    addSupplierMapping,
    updateIngredientPriceFromXML,
    getProductCMV
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<PurchaseEntry | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingItemIndex, setMappingItemIndex] = useState<number | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<MeasureUnit>(MeasureUnit.UN);
  const [conversionFactor, setConversionFactor] = useState(1);
  const [showImpactSummary, setShowImpactSummary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const fuzzySuggest = (xmlName: string) => {
    const normalizedXml = xmlName.toLowerCase();
    const suggestions = ingredients
      .map(ing => {
        const normalizedIng = ing.name.toLowerCase();
        let score = 0;
        if (normalizedXml.includes(normalizedIng) || normalizedIng.includes(normalizedXml)) score += 10;
        const xmlWords = normalizedXml.split(' ').filter(w => w.length > 2);
        const ingWords = normalizedIng.split(' ').filter(w => w.length > 2);
        xmlWords.forEach(w => { if (normalizedIng.includes(w)) score += 5; });
        return { ing, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);
    
    return suggestions.length > 0 ? suggestions[0].ing.id : '';
  };

  const parseXML = (xmlString: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      const errorNode = xmlDoc.querySelector("parsererror");
      if (errorNode) throw new Error("Erro ao processar XML. Verifique o formato.");

      const cnpj = xmlDoc.querySelector("emit > CNPJ")?.textContent || "";
      const supplierName = xmlDoc.querySelector("emit > xNome")?.textContent || "Fornecedor Desconhecido";
      const date = xmlDoc.querySelector("ide > dhEmi")?.textContent?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      
      const items: PurchaseEntryItem[] = [];
      const detNodes = xmlDoc.querySelectorAll("det");
      
      detNodes.forEach(det => {
        const xmlItemName = det.querySelector("prod > xProd")?.textContent || "";
        const xmlUnit = det.querySelector("prod > uCom")?.textContent || "";
        const xmlUnitPrice = parseFloat(det.querySelector("prod > vUnCom")?.textContent || "0");
        const xmlQty = parseFloat(det.querySelector("prod > qCom")?.textContent || "1");
        
        const mapping = supplierMappings.find(m => m.cnpj === cnpj && m.xmlItemName === xmlItemName);
        
        let mappedIngredientId = mapping?.ingredientId;
        let mappedUnit = mapping?.unit;
        let factor = mapping?.conversionFactor || 1;
        let status: 'CONFIRMED' | 'PENDING' = mapping ? 'CONFIRMED' : 'PENDING';
        
        let previousPrice = 0;
        let variation = 0;
        
        if (mappedIngredientId) {
          const ing = ingredients.find(i => i.id === mappedIngredientId);
          if (ing) {
            previousPrice = ing.price;
            const finalUnitPrice = xmlUnitPrice / factor;
            variation = previousPrice > 0 ? ((finalUnitPrice - previousPrice) / previousPrice) * 100 : 0;
          }
        }

        items.push({
          xmlItemName,
          xmlUnit,
          xmlUnitPrice,
          xmlQty,
          mappedIngredientId,
          mappedUnit,
          conversionFactor: factor,
          status,
          previousPrice,
          variation
        });
      });

      const entry = {
        id: Date.now().toString(),
        date,
        supplierCnpj: cnpj,
        supplierName,
        items
      };

      const allMapped = items.every(i => i.status === 'CONFIRMED');
      if (allMapped) {
        setShowImpactSummary(true);
      } else {
        // Find first unmapped and suggest
        const firstUnmappedIdx = items.findIndex(i => i.status === 'PENDING');
        if (firstUnmappedIdx !== -1) {
          setMappingItemIndex(firstUnmappedIdx);
          const suggestedId = fuzzySuggest(items[firstUnmappedIdx].xmlItemName);
          setSelectedIngredientId(suggestedId);
          setSelectedUnit(MeasureUnit.UN);
          setConversionFactor(1);
          setShowMappingModal(true);
        }
      }

      return entry;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro desconhecido ao ler XML");
      return null;
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.xml')) {
      alert('Por favor, envie um arquivo XML válido.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const entry = parseXML(content);
      if (entry) {
        setCurrentEntry(entry);
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const handleSaveMapping = () => {
    if (mappingItemIndex === null || !currentEntry || !selectedIngredientId) return;

    const updatedItems = [...currentEntry.items];
    const item = updatedItems[mappingItemIndex];
    
    const ing = ingredients.find(i => i.id === selectedIngredientId);
    const prevPrice = ing ? ing.price : 0;
    const finalUnitPrice = item.xmlUnitPrice / conversionFactor;
    const variation = prevPrice > 0 ? ((finalUnitPrice - prevPrice) / prevPrice) * 100 : 0;

    updatedItems[mappingItemIndex] = {
      ...item,
      mappedIngredientId: selectedIngredientId,
      mappedUnit: selectedUnit,
      conversionFactor,
      status: 'CONFIRMED',
      previousPrice: prevPrice,
      variation
    };

    const newEntry = { ...currentEntry, items: updatedItems };
    setCurrentEntry(newEntry);
    
    // Save mapping for future
    addSupplierMapping({
      cnpj: currentEntry.supplierCnpj,
      xmlItemName: item.xmlItemName,
      ingredientId: selectedIngredientId,
      unit: selectedUnit,
      conversionFactor
    });

    // Check if there are more unmapped items
    const nextUnmappedIdx = updatedItems.findIndex((it, idx) => it.status === 'PENDING' && idx > mappingItemIndex);
    if (nextUnmappedIdx !== -1) {
      setMappingItemIndex(nextUnmappedIdx);
      const suggestedId = fuzzySuggest(updatedItems[nextUnmappedIdx].xmlItemName);
      setSelectedIngredientId(suggestedId);
      setSelectedUnit(MeasureUnit.UN);
      setConversionFactor(1);
    } else {
      setShowMappingModal(false);
      setShowImpactSummary(true);
    }
  };

  const handleFinalizeEntry = () => {
    if (!currentEntry) return;

    // Update ingredient prices
    currentEntry.items.forEach(item => {
      if (item.mappedIngredientId && item.conversionFactor) {
        const finalPrice = item.xmlUnitPrice / item.conversionFactor;
        updateIngredientPriceFromXML(item.mappedIngredientId, finalPrice);
      }
    });

    addPurchaseEntry(currentEntry);
    setCurrentEntry(null);
    setShowImpactSummary(false);
    alert('Entrada de compras finalizada e preços atualizados!');
  };

  const getImpactedProducts = (ingredientId: string) => {
    return products.filter(p => p.ingredients.some(i => i.ingredientId === ingredientId));
  };

  const dashboardMetrics = useMemo(() => {
    if (!currentEntry) return null;
    
    const totalCost = currentEntry.items.reduce((sum, item) => sum + (item.xmlUnitPrice * item.xmlQty), 0);
    
    const highIncreases = currentEntry.items.filter(i => i.variation && i.variation > 15);
    
    const marginImpacts = currentEntry.items
      .filter(i => i.mappedIngredientId && i.variation && i.variation > 0)
      .map(item => {
        const impacted = getImpactedProducts(item.mappedIngredientId!);
        return impacted.map(p => {
          const oldCMV = getProductCMV(p);
          // Calculate new CMV roughly
          const ingUsage = p.ingredients.find(ing => ing.ingredientId === item.mappedIngredientId);
          const qty = ingUsage?.quantity || 0;
          const priceDiff = (item.xmlUnitPrice / (item.conversionFactor || 1)) - (item.previousPrice || 0);
          const cmvIncrease = priceDiff * qty;
          const newCMV = oldCMV + cmvIncrease;
          const price = p.fixedPriceStore || 0;
          const oldMargin = price > 0 ? ((price - oldCMV) / price) * 100 : 0;
          const newMargin = price > 0 ? ((price - newCMV) / price) * 100 : 0;
          return { productName: p.name, marginDrop: oldMargin - newMargin };
        });
      })
      .flat()
      .filter(m => m.marginDrop > 0.5)
      .sort((a, b) => b.marginDrop - a.marginDrop);

    return {
      totalCost,
      highIncreases,
      marginImpacts: marginImpacts.slice(0, 3)
    };
  }, [currentEntry, products, getProductCMV]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileText className="text-white" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">Entrada de Compras (XML)</h2>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-blue-500"
                title="Ajuda"
              >
                <HelpCircle size={20} />
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Automação de background e atualização de CMV</p>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <HelpCircle size={20} />
              <h2 className="font-bold uppercase tracking-wider text-sm">Guia Rápido: Entrada de Compras XML</h2>
            </div>
            <button onClick={() => setShowHelp(false)} className="text-blue-400 hover:text-blue-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 text-xs uppercase">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                Upload do Arquivo
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                Arraste o arquivo .xml da sua nota fiscal diretamente para a área pontilhada. O sistema fará a leitura automática do CNPJ e de todos os itens da nota.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 text-xs uppercase">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                Vínculo (DE-PARA)
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                Se for um item novo, o sistema sugerirá o insumo mais provável. Você só precisa confirmar uma vez. O sistema memoriza esse vínculo para todas as notas futuras deste fornecedor.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 text-xs uppercase">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                Impacto no CMV
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                Após o processamento, veja o resumo de impacto. O sistema mostra quanto seu custo total mudou e quais produtos tiveram aumento de preço, permitindo uma gestão proativa.
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-800/30 flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase">
            <Info size={12} />
            Dica: O sistema gerencia conversões de unidades (ex: Caixa para KG) automaticamente após a primeira configuração.
          </div>
        </div>
      )}

      {!currentEntry ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div 
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`relative h-96 rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center p-12 text-center group ${
                isDragging 
                  ? 'border-brand-red bg-red-50 dark:bg-red-900/10 scale-[0.99]' 
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-red/50'
              }`}
            >
              <input 
                type="file" 
                accept=".xml"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 ${
                isDragging ? 'bg-brand-red text-white scale-110 rotate-12' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:scale-110'
              }`}>
                <CloudUpload size={48} />
              </div>

              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-2">
                {isProcessing ? 'Processando Nota...' : 'Arraste seu XML aqui'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto">
                Ou clique para selecionar o arquivo da NFe no seu computador.
              </p>

              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-black text-brand-red uppercase tracking-widest text-sm">Lendo Dados...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <FileText size={20} />
              </div>
              <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest">Últimas Entradas</h4>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {purchaseEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-500 italic">Nenhuma nota processada.</div>
              ) : (
                purchaseEntries.map(entry => (
                  <div key={entry.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex justify-between items-center group hover:border-brand-red transition-colors">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{entry.supplierName}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">{entry.date}</div>
                      <div className="text-[10px] text-brand-red font-bold mt-1">{entry.items.length} itens</div>
                    </div>
                    <button 
                      onClick={() => deletePurchaseEntry(entry.id)}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Dashboard de Fechamento */}
          {showImpactSummary && dashboardMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-black">Custo Total da Nota</div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">{formatMoney(dashboardMetrics.totalCost)}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-black">Alertas de Preço ({dashboardMetrics.highIncreases.length})</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {dashboardMetrics.highIncreases.length > 0 
                      ? `${dashboardMetrics.highIncreases[0].xmlItemName.slice(0, 15)}... +${dashboardMetrics.highIncreases[0].variation?.toFixed(0)}%`
                      : 'Nenhum aumento crítico'}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl flex items-center justify-center">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-black">Impacto na Margem</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {dashboardMetrics.marginImpacts.length > 0 
                      ? `${dashboardMetrics.marginImpacts[0].productName}: -${dashboardMetrics.marginImpacts[0].marginDrop.toFixed(1)}%`
                      : 'Margens estáveis'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-[10px] text-brand-red font-black uppercase tracking-widest mb-1">Conferência de Nota</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">{currentEntry.supplierName}</h3>
              <div className="text-xs text-gray-500 font-bold uppercase">{currentEntry.date} • CNPJ: {currentEntry.supplierCnpj}</div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setCurrentEntry(null); setShowImpactSummary(false); }}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleFinalizeEntry}
                className="px-8 py-3 bg-brand-red text-white font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-900/20"
              >
                Confirmar Atualização
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Item no XML</th>
                    <th className="px-6 py-4">Unid. XML</th>
                    <th className="px-6 py-4 text-right">Preço XML</th>
                    <th className="px-6 py-4 text-center">Vínculo (DE-PARA)</th>
                    <th className="px-6 py-4 text-right">Preço Ant.</th>
                    <th className="px-6 py-4 text-center">Variação</th>
                    <th className="px-6 py-4">Impacto no Cardápio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {currentEntry.items.map((item, idx) => {
                    const mappedIng = ingredients.find(i => i.id === item.mappedIngredientId);
                    const impacted = item.mappedIngredientId ? getImpactedProducts(item.mappedIngredientId) : [];
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.xmlItemName}</td>
                        <td className="px-6 py-4 text-gray-500 font-bold uppercase">{item.xmlUnit}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-white">{formatMoney(item.xmlUnitPrice)}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              setMappingItemIndex(idx);
                              setSelectedIngredientId(item.mappedIngredientId || '');
                              setSelectedUnit(item.mappedUnit || MeasureUnit.UN);
                              setConversionFactor(item.conversionFactor || 1);
                              setShowMappingModal(true);
                            }}
                            className={`w-full py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition ${
                              item.status === 'CONFIRMED' 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse'
                            }`}
                          >
                            {item.status === 'CONFIRMED' ? (
                              <><CheckCircle size={12} /> {mappedIng?.name}</>
                            ) : (
                              <><AlertCircle size={12} /> Vincular Insumo</>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-gray-500">
                          {item.status === 'CONFIRMED' ? formatMoney(item.previousPrice) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.status === 'CONFIRMED' && item.variation !== 0 ? (
                            <div className={`flex items-center justify-center gap-1 font-bold ${item.variation > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              {item.variation > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {Math.abs(item.variation).toFixed(1)}%
                            </div>
                          ) : item.status === 'CONFIRMED' ? (
                            <span className="text-gray-400 font-bold">0%</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {impacted.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {impacted.slice(0, 2).map(p => (
                                <span key={p.id} className="text-[9px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 font-bold uppercase">
                                  {p.name}
                                </span>
                              ))}
                              {impacted.length > 2 && <span className="text-[9px] text-gray-400 font-bold">+{impacted.length - 2}</span>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Sem impacto</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                <Search size={20} className="text-brand-red" /> Vínculo Rápido
              </h3>
              <button onClick={() => setShowMappingModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Item no XML</div>
                <div className="font-bold text-gray-900 dark:text-white">{currentEntry?.items[mappingItemIndex!]?.xmlItemName}</div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500 font-bold uppercase">Unidade: {currentEntry?.items[mappingItemIndex!]?.xmlUnit}</span>
                  <span className="text-xs text-brand-red font-black">{formatMoney(currentEntry?.items[mappingItemIndex!]?.xmlUnitPrice)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-black mb-2 block">Vincular ao Insumo:</label>
                  <select 
                    value={selectedIngredientId}
                    onChange={(e) => setSelectedIngredientId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 outline-none focus:ring-2 focus:ring-brand-red font-bold"
                  >
                    <option value="">Selecione um insumo...</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-black mb-2 block">Unidade:</label>
                    <div className="flex gap-2">
                      {[
                        { unit: MeasureUnit.KG, icon: <Scale size={16}/> },
                        { unit: MeasureUnit.L, icon: <GlassWater size={16}/> },
                        { unit: MeasureUnit.UN, icon: <Package size={16}/> }
                      ].map(({ unit, icon }) => (
                        <button
                          key={unit}
                          onClick={() => setSelectedUnit(unit)}
                          className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                            selectedUnit === unit 
                              ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-red-900/20' 
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-brand-red'
                          }`}
                        >
                          {icon}
                          <span className="text-[10px] font-black">{unit}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-black mb-2 block">Fator Conversão:</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={conversionFactor}
                        onChange={(e) => setConversionFactor(parseFloat(e.target.value) || 1)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl p-4 outline-none focus:ring-2 focus:ring-brand-red font-bold"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-black uppercase">Fator</div>
                    </div>
                  </div>
                </div>

                {conversionFactor > 1 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                    <Info size={16} className="text-blue-500 mt-0.5" />
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                      O preço unitário será dividido por {conversionFactor}. <br/>
                      Ex: Caixa com {conversionFactor} unidades.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowMappingModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-white font-bold rounded-2xl uppercase text-xs tracking-widest hover:bg-gray-200 transition">Pular</button>
                <button 
                  onClick={handleSaveMapping}
                  disabled={!selectedIngredientId}
                  className="flex-1 py-4 bg-brand-red text-white font-bold rounded-2xl uppercase text-xs tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-900/20 disabled:opacity-50"
                >
                  OK, Próximo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseEntryPage;
