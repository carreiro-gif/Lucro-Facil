
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calculator, AlertTriangle, HelpCircle, X, Sparkles, TrendingUp, Info, 
  Lightbulb, ChevronRight, MessageSquare, ShieldAlert, CheckCircle2, DollarSign
} from 'lucide-react';
import { Product } from '../types';
import { formatPercent } from '../constants';
import { IFoodLogo, Food99Logo, KeetaLogo } from '../components/PlatformLogos';

const PricingTableHeader: React.FC = () => (
  <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">
      <tr>
          <th className="p-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 left-0 z-40 bg-gray-50 dark:bg-[#0f111a] w-56 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">Produto</th>
          <th className="p-3 border-b border-gray-200 dark:border-gray-800 text-center bg-gray-50 dark:bg-[#0f111a] w-24 sticky top-0 z-20">CMV + Emb</th>
          <th className="p-3 border-b border-gray-200 dark:border-gray-800 text-center bg-gray-50 dark:bg-[#0f111a] w-20 sticky top-0 z-20">CFI %</th>
          <th className="p-3 border-b border-gray-200 dark:border-gray-800 text-center w-24 bg-gray-50 dark:bg-[#0f111a] sticky top-0 z-20">Lucro %</th>
          <th className="p-3 border-b border-gray-200 dark:border-gray-800 text-center w-32 bg-gray-200 dark:bg-[#1f2937] text-gray-900 dark:text-white border-x border-gray-300 dark:border-gray-700 sticky top-0 z-20">PV Loja</th>
          <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center border-l border-gray-200 dark:border-gray-800 w-20 text-red-900 dark:text-red-100 sticky top-0 z-20">Ifood %</th>
          <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center w-20 text-red-900 dark:text-red-100 sticky top-0 z-20">Online %</th>
          <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center w-20 text-red-900 dark:text-red-100 sticky top-0 z-20">Antec. %</th>
          <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center w-24 text-red-900 dark:text-red-100 sticky top-0 z-20">Entrega R$</th>
          <th className="p-3 border-b border-red-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 text-center w-24 text-red-900 dark:text-red-100 sticky top-0 z-20">Cupom R$</th>
          <th className="p-3 border-b border-red-200 dark:border-gray-800 bg-[#E53935] text-center text-white font-bold border-x border-red-300 dark:border-red-800 w-32 sticky top-0 z-20">
              <div className="flex items-center justify-center gap-1.5">
                  <IFoodLogo className="w-4 h-4 shrink-0" />
                  <span>PV Ifood</span>
              </div>
          </th>
          <th className="p-3 border-b border-purple-100 dark:border-gray-800 bg-purple-50 dark:bg-purple-900/10 text-center w-24 text-purple-900 dark:text-purple-100 sticky top-0 z-20">CI (R$)</th>
          <th className="p-3 border-b border-purple-200 dark:border-gray-800 bg-[#B71C1C] text-center text-white font-bold border-x border-purple-300 dark:border-purple-800 w-32 sticky top-0 z-20">
              <div className="flex items-center justify-center gap-1.5">
                  <IFoodLogo className="w-4 h-4 shrink-0 opacity-90" />
                  <span>PV CI</span>
              </div>
          </th>
          <th className="p-3 border-b border-yellow-105 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-20 text-yellow-900 dark:text-yellow-100 sticky top-0 z-20">Taxa %</th>
          <th className="p-3 border-b border-yellow-105 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-20 text-yellow-900 dark:text-yellow-100 sticky top-0 z-20">Online %</th>
          <th className="p-3 border-b border-yellow-105 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-24 text-yellow-900 dark:text-yellow-100 sticky top-0 z-20">Entrega R$</th>
          <th className="p-3 border-b border-yellow-105 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-20 text-yellow-900 dark:text-yellow-100 sticky top-0 z-20">Antec. %</th>
          <th className="p-3 border-b border-yellow-105 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/10 text-center w-24 text-yellow-900 dark:text-yellow-100 sticky top-0 z-20">Cupom R$</th>
          <th className="p-3 border-b border-yellow-200 dark:border-gray-800 bg-[#FBC02D] text-center text-white font-bold border-x border-yellow-300 dark:border-yellow-700 w-32 sticky top-0 z-20">
              <div className="flex items-center justify-center gap-1.5 text-black">
                  <Food99Logo className="w-4 h-4 shrink-0" />
                  <span>PV 99Food</span>
              </div>
          </th>
          <th className="p-3 border-b border-green-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/10 text-center w-20 text-green-900 dark:text-green-100 sticky top-0 z-20">Taxa %</th>
          <th className="p-3 border-b border-green-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/10 text-center w-20 text-green-900 dark:text-green-100 sticky top-0 z-20">Online %</th>
          <th className="p-3 border-b border-green-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/10 text-center w-24 text-green-900 dark:text-green-100 sticky top-0 z-20">Entrega R$</th>
          <th className="p-3 border-b border-green-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/10 text-center w-20 text-green-900 dark:text-green-100 sticky top-0 z-20">Antec. %</th>
          <th className="p-3 border-b border-green-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/10 text-center w-24 text-green-900 dark:text-green-100 sticky top-0 z-20">Cupom R$</th>
          <th className="p-3 border-b border-green-200 dark:border-gray-800 bg-[#43A047] text-center text-white font-bold border-x border-green-300 dark:border-green-700 w-32 sticky top-0 z-20">
              <div className="flex items-center justify-center gap-1.5">
                  <KeetaLogo className="w-4 h-4 shrink-0" />
                  <span>PV Keeta</span>
              </div>
          </th>
      </tr>
  </thead>
);

const bulkColumnsList = [
  { key: 'profitMargin', label: 'Meta de Lucro / Margem (%)', unit: '%' },
  { key: 'ifood.fee', label: 'iFood - Taxa Básica (%)', unit: '%' },
  { key: 'ifood.onlinePayment', label: 'iFood - Pagamento Online (%)', unit: '%' },
  { key: 'ifood.anticipation', label: 'iFood - Antecipação (%)', unit: '%' },
  { key: 'ifood.delivery', label: 'iFood - Taxa de Entrega (R$)', unit: 'R$' },
  { key: 'ifood.coupon', label: 'iFood - Cupom do Restaurante (R$)', unit: 'R$' },
  { key: 'ifood.ciValue', label: 'iFood - Cupom Inteligente / CI (R$)', unit: 'R$' },
  { key: 'food99.fee', label: '99Food - Taxa Básica (%)', unit: '%' },
  { key: 'food99.onlinePayment', label: '99Food - Pagamento Online (%)', unit: '%' },
  { key: 'food99.delivery', label: '99Food - Taxa de Entrega (R$)', unit: 'R$' },
  { key: 'food99.anticipation', label: '99Food - Antecipação (%)', unit: '%' },
  { key: 'food99.coupon', label: '99Food - Cupom (R$)', unit: 'R$' },
  { key: 'keeta.fee', label: 'Keeta - Taxa Básica (%)', unit: '%' },
  { key: 'keeta.onlinePayment', label: 'Keeta - Pagamento Online (%)', unit: '%' },
  { key: 'keeta.delivery', label: 'Keeta - Taxa de Entrega (R$)', unit: 'R$' },
  { key: 'keeta.anticipation', label: 'Keeta - Antecipação (%)', unit: '%' },
  { key: 'keeta.coupon', label: 'Keeta - Cupom (R$)', unit: 'R$' },
];

const Pricing: React.FC = () => {
  const { 
    cfi, 
    products,
    menuCategories,
    platformConfig, 
    calculateFixedCostPercent,
    updateProduct,
    bulkUpdateProductsPricing,
    getSortedProducts,
    getProductCMV
  } = useApp();
  const [showHelp, setShowHelp] = useState(false);
  const [selectedBulkKey, setSelectedBulkKey] = useState('profitMargin');
  const [bulkValString, setBulkValString] = useState('');
  const [bulkStatusMsg, setBulkStatusMsg] = useState('');
  const [bulkErrorMsg, setBulkErrorMsg] = useState('');
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  
  const handleApplyBulkUpdate = () => {
    const val = parseFloat(bulkValString);
    if (isNaN(val) || val < 0) {
      setBulkErrorMsg("Por favor, insira um valor válido positivo (ou zero).");
      setTimeout(() => setBulkErrorMsg(''), 5000);
      return;
    }
    setBulkErrorMsg('');
    setShowBulkConfirmModal(true);
  };

  const handleConfirmBulkUpdate = () => {
    const val = parseFloat(bulkValString);
    if (isNaN(val) || val < 0) return;
    
    bulkUpdateProductsPricing(selectedBulkKey, val);
    
    const selectedCol = bulkColumnsList.find(c => c.key === selectedBulkKey);
    const label = selectedCol ? selectedCol.label : 'Coluna';
    const unit = selectedCol ? selectedCol.unit : '';
    
    setBulkStatusMsg(`Sucesso! Todos os lanches foram alterados para ${val}${unit} na coluna ${selectedCol?.label || 'selecionada'}.`);
    setBulkValString('');
    setShowBulkConfirmModal(false);
    setTimeout(() => setBulkStatusMsg(''), 7050);
  };

  const showXandePanel = false;
  const setShowXandePanel = (val: boolean) => {};
  let activeXandeTab = 'audit' as any;
  const setActiveXandeTab = (tab: string) => {};

  const fixedCostPct = calculateFixedCostPercent();
  const avgCardRate = (cfi.debitTax + cfi.creditTax) / 2;
  const variableCostsPct = avgCardRate + cfi.tax + cfi.royalties + cfi.marketing + cfi.voucherTax;
  const totalCfiCost = fixedCostPct + variableCostsPct;

  // Use the sorted list from context with Guard
  const sortedCategories = useMemo(() => [...(menuCategories || [])].sort((a,b) => a.order - b.order), [menuCategories]);
  const sortedProducts = useMemo(() => getSortedProducts() || [], [getSortedProducts, products]);

  // Grouped by Category in exact order
  const filteredProductsByGroup = useMemo(() => {
    const groups: Record<string, Product[]> = {};

    sortedCategories.forEach(cat => groups[cat.name] = []);
    groups['Sem Categoria'] = [];

    (sortedProducts || []).forEach(p => {
        // Try finding exactly by name first, otherwise see if p.category is an ID
        const resolvedCategoryName = groups[p.category] ? p.category : (sortedCategories.find(c => c.id === p.category)?.name || 'Sem Categoria');

        if (groups[resolvedCategoryName]) groups[resolvedCategoryName].push(p);
        else groups['Sem Categoria'].push(p);
    });

    return groups;
  }, [sortedProducts, sortedCategories]);

  const calculateStorePrice = (cmv: number, profitMargin: number) => {
    const totalDeductions = (totalCfiCost + profitMargin) / 100;
    if (totalDeductions >= 1) return 0; 
    return cmv / (1 - totalDeductions);
  };

  const calculateMarketplacePrice = (pvLoja: number, feesPct: number, delivery: number, ci: number, coupon: number) => {
      const denominator = 1 - (feesPct / 100);
      if (denominator <= 0) return 0;
      return (pvLoja + delivery + ci + coupon) / denominator;
  };

  const handleUpdate = (productId: string, section: 'pricing', key: string, value: number) => {
      const product = sortedProducts.find(p => p.id === productId);
      if (!product) return;
      const newPricing = { ...product.pricing };
      if (key.includes('.')) {
          const [parent, child] = key.split('.');
          // @ts-ignore
          newPricing[parent] = { ...newPricing[parent], [child]: value };
      } else {
          // @ts-ignore
          newPricing[key] = value;
      }
      updateProduct(productId, { pricing: newPricing });
  };

  // Xande's automatic pricing audit logic
  const pricingAudit = useMemo(() => {
    const lowMarginProducts: Array<{ id: string; name: string; margin: number; cmvVal: number; pvLoja: number }> = [];
    const criticalCmvProducts: Array<{ id: string; name: string; cmvPct: number; cmvVal: number; pvLoja: number }> = [];
    const healthyProducts: Array<{ id: string; name: string; margin: number; cmvPct: number; pvLoja: number }> = [];

    sortedProducts.forEach(p => {
      const cmvVal = getProductCMV(p);
      const margin = p.pricing?.profitMargin !== undefined ? p.pricing.profitMargin : 20;
      const storePrice = calculateStorePrice(cmvVal, margin);
      const cmvPct = storePrice > 0 ? (cmvVal / storePrice) * 100 : 0;

      if (margin < 15) {
        lowMarginProducts.push({ id: p.id, name: p.name, margin, cmvVal, pvLoja: storePrice });
      } else if (cmvPct > 38) {
        criticalCmvProducts.push({ id: p.id, name: p.name, cmvPct, cmvVal, pvLoja: storePrice });
      } else if (margin >= 20 && cmvPct >= 25 && cmvPct <= 35) {
        healthyProducts.push({ id: p.id, name: p.name, margin, cmvPct, pvLoja: storePrice });
      }
    });

    return { lowMarginProducts, criticalCmvProducts, healthyProducts };
  }, [sortedProducts, getProductCMV, totalCfiCost]);

  return (
    <div className="w-full space-y-6 pb-20 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase">Preço de Venda</h2>
            <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-brand-red transition-colors" title="Como funciona"><HelpCircle size={20} /></button>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Sugestão de preços baseada na sua estrutura de custos e metas de lucro.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Xande's Interactive Advisor Pulsing Button */}
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-global-xande'));
            }}
            className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-900 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 border border-amber-400 group cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <Sparkles size={16} className="text-slate-900 animate-pulse" />
            <span>Consultar o Xande ⚡</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
            </span>
          </button>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm flex gap-6 shadow-md">
            <div>
              <span className="block text-[10px] text-gray-500 uppercase font-bold">CFI Total (Fixo+Var)</span>
              <span className="text-lg font-bold text-brand-red">{formatPercent(totalCfiCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm">
            <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Como usar esta tela?</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Os itens aparecem na mesma ordem definida na aba <strong>Ficha Técnica</strong>.
                <br/>
                Os campos editáveis permitem ajustar margens e taxas específicas para cada produto se necessário.
            </p>
        </div>
      )}

      {/* CARD DE AJUSTE MASSIVO DE COLUNAS */}
      <div className="bg-gradient-to-r from-purple-900/5 via-brand-red-[2%] to-purple-900/5 dark:from-purple-950/10 dark:via-red-950/5 dark:to-purple-950/10 border border-purple-200/40 dark:border-purple-800/20 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-purple-900 dark:text-purple-300 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
              Ajuste em Massa (Colunas Completas)
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
              Deseja alterar um percentual de lucro ou uma taxa de entrega de todos os lanches simultaneamente? Basta selecionar o campo, preencher o novo valor e clicar no botão.
            </p>
          </div>
          {bulkStatusMsg && (
            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30 px-3.5 py-1.5 rounded-xl text-[10px] font-black leading-tight animate-fade-in uppercase tracking-wider shadow-sm shrink-0">
               ✓ {bulkStatusMsg}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Selecionar Coluna */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block px-0.5">Coluna para Alteração</label>
            <select 
              value={selectedBulkKey}
              onChange={(e) => setSelectedBulkKey(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold uppercase cursor-pointer"
            >
              {bulkColumnsList.map(col => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>

          {/* Valor Novo */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block px-0.5">
              Novo Valor ({bulkColumnsList.find(c => c.key === selectedBulkKey)?.unit})
            </label>
            <div className="relative">
              {bulkColumnsList.find(c => c.key === selectedBulkKey)?.unit === 'R$' && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs font-mono">R$</span>
              )}
              <input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 12 ou 0" 
                value={bulkValString}
                onChange={e => setBulkValString(e.target.value)}
                className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl ${bulkColumnsList.find(c => c.key === selectedBulkKey)?.unit === 'R$' ? 'pl-9' : 'pl-4'} pr-9 py-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold font-mono`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase font-sans">
                {bulkColumnsList.find(c => c.key === selectedBulkKey)?.unit}
              </span>
            </div>
          </div>

          {/* Botão de Rodar Atualização */}
          <div className="md:col-span-4">
            <button
              onClick={handleApplyBulkUpdate}
              disabled={!bulkValString}
              className={`w-full uppercase text-[10px] font-black tracking-widest py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 border shadow-sm ${
                bulkValString 
                  ? 'bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 hover:border-purple-700 text-white border-transparent cursor-pointer' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-205 dark:border-gray-800 cursor-not-allowed'
              }`}
            >
              <Calculator size={14} />
              Aplicar a Todos os Lanches
            </button>
          </div>
        </div>
        
        {bulkErrorMsg && (
          <div className="p-3 bg-red-105 border border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 rounded-xl text-[11px] font-bold flex items-center gap-2 animate-fade-in">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{bulkErrorMsg}</span>
          </div>
        )}

        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/20 text-amber-800 dark:text-amber-400 text-[10px] leading-relaxed flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Autonomia Total:</strong> Isso atualiza a coluna inteira para os produtos em lote. A qualquer momento, você ainda pode clicar diretamente nas caixas da tabela de preços abaixo e digitar valores específicos para qualquer produto individualmente!
            </span>
        </div>
      </div>

      <div className="md:hidden flex items-center gap-2 justify-center bg-brand-red/5 dark:bg-brand-red/10 border border-brand-red/10 dark:border-brand-red/20 text-brand-red dark:text-red-400 py-2 px-3 rounded-lg text-[11px] font-bold select-none shadow-sm mb-3">
        <span className="animate-bounce">↔</span>
        <span>DESLIZE AS TABELAS PARA A DIREITA PARA COMPARAR OS CANAIS DE VENDA</span>
      </div>

      <div className="bg-transparent border border-transparent rounded-xl shadow-none overflow-hidden max-h-[calc(100vh-220px)] flex flex-col">
        <div className="overflow-x-auto overflow-y-auto pb-8 flex-1 space-y-12" style={{ scrollbarGutter: 'stable' }}>
            {sortedCategories.map(cat => {
                const groupItems = filteredProductsByGroup[cat.name] || [];
                if (groupItems.length === 0) return null;

                return (
                    <div key={cat.id} className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl min-w-[2400px] bg-white dark:bg-gray-900">
                        <div className="bg-gray-100 dark:bg-[#1f2937] px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 sticky left-0 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">{cat.name}</h3>
                            <span className="bg-gray-200 dark:bg-gray-805 text-gray-650 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{groupItems.length} ITENS</span>
                        </div>
                        <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                            <PricingTableHeader />
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                            {groupItems.map((product, pIndex) => {
                                const cmv = getProductCMV(product);
                                const pricing = product.pricing || {};
                                const profitMargin = pricing.profitMargin !== undefined ? pricing.profitMargin : 20; 
                                const storePrice = calculateStorePrice(cmv, profitMargin);

                                const ifoodFee = pricing.ifood?.fee ?? platformConfig.ifood.fee;
                                const ifoodOnline = pricing.ifood?.onlinePayment ?? platformConfig.ifood.onlinePayment;
                                const ifoodAntic = pricing.ifood?.anticipation ?? platformConfig.ifood.anticipation;
                                const ifoodDel = pricing.ifood?.delivery ?? platformConfig.ifood.delivery;
                                const ifoodCoupon = pricing.ifood?.coupon ?? 0;
                                const ifoodPrice = calculateMarketplacePrice(storePrice, ifoodFee + ifoodOnline + ifoodAntic, ifoodDel, 0, ifoodCoupon);

                                const ciVal = pricing.ifood?.ciValue ?? platformConfig.ifood.ciValue;
                                const ifoodCIPrice = calculateMarketplacePrice(storePrice, ifoodFee + ifoodOnline + ifoodAntic, ifoodDel, ciVal, ifoodCoupon);

                                const food99Fee = pricing.food99?.fee ?? platformConfig.food99.fee;
                                const food99Online = pricing.food99?.onlinePayment ?? platformConfig.food99.onlinePayment;
                                const food99Del = pricing.food99?.delivery ?? platformConfig.food99.delivery;
                                const food99Antic = pricing.food99?.anticipation ?? platformConfig.food99.anticipation;
                                const food99Coupon = pricing.food99?.coupon ?? 0;
                                const food99Price = calculateMarketplacePrice(storePrice, food99Fee + food99Online + food99Antic, food99Del, 0, food99Coupon);

                                const keetaFee = pricing.keeta?.fee ?? platformConfig.keeta.fee;
                                const keetaOnline = pricing.keeta?.onlinePayment ?? platformConfig.keeta.onlinePayment;
                                const keetaDel = pricing.keeta?.delivery ?? platformConfig.keeta.delivery;
                                const keetaAntic = pricing.keeta?.anticipation ?? platformConfig.keeta.anticipation;
                                const keetaCoupon = pricing.keeta?.coupon ?? 0;
                                const keetaPrice = calculateMarketplacePrice(storePrice, keetaFee + keetaOnline + keetaAntic, keetaDel, 0, keetaCoupon);

                                const isOdd = pIndex % 2 === 1;
                                const rowBgClass = isOdd 
                                    ? "bg-slate-100/60 dark:bg-slate-800/10 hover:bg-slate-200/50 dark:hover:bg-slate-800/25" 
                                    : "bg-white dark:bg-gray-900/25 hover:bg-slate-50 dark:hover:bg-gray-800/25";
                                const stickyBgClass = isOdd 
                                    ? "bg-[#f1f5f9] dark:bg-[#111320]" 
                                    : "bg-white dark:bg-[#181a28]";

                                return (
                                    <tr key={product.id} className={`${rowBgClass} transition group`}>
                                        <td className={`p-3 font-bold text-gray-900 dark:text-white sticky left-0 z-20 ${stickyBgClass} border-r border-gray-200 dark:border-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[224px]`} title={product.name}>
                                            {product.name}
                                        </td>
                                        <td className="p-3 text-gray-500 dark:text-gray-400 text-center font-mono bg-gray-50/20 dark:bg-gray-900/10">R$ {cmv.toFixed(2)}</td>
                                        <td className="p-3 text-center text-gray-600 dark:text-gray-500 bg-gray-50/20 dark:bg-gray-900/10">{formatPercent(totalCfiCost)}</td>
                                        <td className="p-3 text-center bg-gray-50/20 dark:bg-gray-900/10">
                                            <input type="number" step="0.1" className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-transparent text-gray-900 dark:text-white w-12 text-center rounded focus:outline-none focus:ring-1 focus:ring-brand-red" value={profitMargin} onChange={(e) => handleUpdate(product.id, 'pricing', 'profitMargin', parseFloat(e.target.value))} />
                                        </td>
                                        <td className="p-3 text-center font-bold text-lg text-gray-900 dark:text-white bg-gray-200/40 dark:bg-gray-800/30 border-x border-gray-300 dark:border-gray-700">R$ {storePrice.toFixed(2)}</td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5 border-l border-gray-200 dark:border-gray-800"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodFee} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.fee', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodOnline} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.onlinePayment', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodAntic} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.anticipation', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodDel} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.delivery', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodCoupon} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.coupon', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center font-bold text-lg text-white bg-[#E53935] border-x border-red-300 dark:border-red-800">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <IFoodLogo className="w-4 h-4 shrink-0 brightness-110" />
                                                <span>R$ {ifoodPrice.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center bg-purple-50/30 dark:bg-purple-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-purple-300 dark:hover:border-gray-600 focus:border-purple-500" value={ciVal} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.ciValue', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center font-bold text-lg text-white bg-[#B71C1C] border-x border-purple-300 dark:border-purple-800">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <IFoodLogo className="w-4 h-4 shrink-0 brightness-110 opacity-90" />
                                                <span>R$ {ifoodCIPrice.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Fee} onChange={e => handleUpdate(product.id, 'pricing', 'food99.fee', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Online} onChange={e => handleUpdate(product.id, 'pricing', 'food99.onlinePayment', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Del} onChange={e => handleUpdate(product.id, 'pricing', 'food99.delivery', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Antic} onChange={e => handleUpdate(product.id, 'pricing', 'food99.anticipation', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Coupon} onChange={e => handleUpdate(product.id, 'pricing', 'food99.coupon', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center font-bold text-lg text-white bg-[#FBC02D] border-x border-yellow-300 dark:border-yellow-700">
                                            <div className="flex items-center justify-center gap-1.5 text-black">
                                                <Food99Logo className="w-4 h-4 shrink-0" />
                                                <span>R$ {food99Price.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaFee} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.fee', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaOnline} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.onlinePayment', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaDel} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.delivery', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaAntic} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.anticipation', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaCoupon} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.coupon', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center font-bold text-lg text-white bg-[#43A047] border-x border-green-300 dark:border-green-700">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <KeetaLogo className="w-4 h-4 shrink-0" />
                                                <span>R$ {keetaPrice.toFixed(2)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                );
            })}

            {/* Fallback for "Sem Categoria" */}
            {(() => {
                const groupItems = filteredProductsByGroup['Sem Categoria'] || [];
                if (groupItems.length === 0) return null;

                return (
                    <div key="sem-categoria" className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl min-w-[2400px] bg-white dark:bg-gray-900">
                        <div className="bg-gray-100 dark:bg-[#1f2937] px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 sticky left-0 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Sem Categoria</h3>
                            <span className="bg-gray-200 dark:bg-gray-805 text-gray-650 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{groupItems.length} ITENS</span>
                        </div>
                        <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                            <PricingTableHeader />
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                            {groupItems.map((product, pIndex) => {
                                const cmv = getProductCMV(product);
                                const pricing = product.pricing || {};
                                const profitMargin = pricing.profitMargin !== undefined ? pricing.profitMargin : 20; 
                                const storePrice = calculateStorePrice(cmv, profitMargin);

                                const ifoodFee = pricing.ifood?.fee ?? platformConfig.ifood.fee;
                                const ifoodOnline = pricing.ifood?.onlinePayment ?? platformConfig.ifood.onlinePayment;
                                const ifoodAntic = pricing.ifood?.anticipation ?? platformConfig.ifood.anticipation;
                                const ifoodDel = pricing.ifood?.delivery ?? platformConfig.ifood.delivery;
                                const ifoodCoupon = pricing.ifood?.coupon ?? 0;
                                const ifoodPrice = calculateMarketplacePrice(storePrice, ifoodFee + ifoodOnline + ifoodAntic, ifoodDel, 0, ifoodCoupon);

                                const ciVal = pricing.ifood?.ciValue ?? platformConfig.ifood.ciValue;
                                const ifoodCIPrice = calculateMarketplacePrice(storePrice, ifoodFee + ifoodOnline + ifoodAntic, ifoodDel, ciVal, ifoodCoupon);

                                const food99Fee = pricing.food99?.fee ?? platformConfig.food99.fee;
                                const food99Online = pricing.food99?.onlinePayment ?? platformConfig.food99.onlinePayment;
                                const food99Del = pricing.food99?.delivery ?? platformConfig.food99.delivery;
                                const food99Antic = pricing.food99?.anticipation ?? platformConfig.food99.anticipation;
                                const food99Coupon = pricing.food99?.coupon ?? 0;
                                const food99Price = calculateMarketplacePrice(storePrice, food99Fee + food99Online + food99Antic, food99Del, 0, food99Coupon);

                                const keetaFee = pricing.keeta?.fee ?? platformConfig.keeta.fee;
                                const keetaOnline = pricing.keeta?.onlinePayment ?? platformConfig.keeta.onlinePayment;
                                const keetaDel = pricing.keeta?.delivery ?? platformConfig.keeta.delivery;
                                const keetaAntic = pricing.keeta?.anticipation ?? platformConfig.keeta.anticipation;
                                const keetaCoupon = pricing.keeta?.coupon ?? 0;
                                const keetaPrice = calculateMarketplacePrice(storePrice, keetaFee + keetaOnline + keetaAntic, keetaDel, 0, keetaCoupon);

                                const isOdd = pIndex % 2 === 1;
                                const rowBgClass = isOdd 
                                    ? "bg-slate-100/60 dark:bg-slate-800/10 hover:bg-slate-200/50 dark:hover:bg-slate-800/25" 
                                    : "bg-white dark:bg-gray-900/25 hover:bg-slate-50 dark:hover:bg-gray-800/25";
                                const stickyBgClass = isOdd 
                                    ? "bg-[#f1f5f9] dark:bg-[#111320]" 
                                    : "bg-white dark:bg-[#181a28]";

                                return (
                                    <tr key={product.id} className={`${rowBgClass} transition group`}>
                                        <td className={`p-3 font-bold text-gray-900 dark:text-white sticky left-0 z-20 ${stickyBgClass} border-r border-gray-200 dark:border-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[224px]`} title={product.name}>
                                            {product.name}
                                        </td>
                                        <td className="p-3 text-gray-500 dark:text-gray-400 text-center font-mono bg-gray-50/20 dark:bg-gray-900/10">R$ {cmv.toFixed(2)}</td>
                                        <td className="p-3 text-center text-gray-600 dark:text-gray-500 bg-gray-50/20 dark:bg-gray-900/10">{formatPercent(totalCfiCost)}</td>
                                        <td className="p-3 text-center bg-gray-50/20 dark:bg-gray-900/10">
                                            <input type="number" step="0.1" className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-transparent text-gray-900 dark:text-white w-12 text-center rounded focus:outline-none focus:ring-1 focus:ring-brand-red" value={profitMargin} onChange={(e) => handleUpdate(product.id, 'pricing', 'profitMargin', parseFloat(e.target.value))} />
                                        </td>
                                        <td className="p-3 text-center font-bold text-lg text-gray-900 dark:text-white bg-gray-200/40 dark:bg-gray-800/30 border-x border-gray-300 dark:border-gray-700">R$ {storePrice.toFixed(2)}</td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5 border-l border-gray-200 dark:border-gray-800"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodFee} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.fee', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodOnline} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.onlinePayment', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodAntic} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.anticipation', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodDel} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.delivery', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-red-50/30 dark:bg-red-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-red-300 dark:hover:border-gray-600 focus:border-brand-red" value={ifoodCoupon} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.coupon', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center font-bold text-lg text-white bg-[#E53935] border-x border-red-300 dark:border-red-800">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <IFoodLogo className="w-4 h-4 shrink-0 brightness-110" />
                                                <span>R$ {ifoodPrice.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center bg-purple-50/30 dark:bg-purple-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-purple-300 dark:hover:border-gray-600 focus:border-purple-500" value={ciVal} onChange={e => handleUpdate(product.id, 'pricing', 'ifood.ciValue', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center font-bold text-lg text-white bg-[#B71C1C] border-x border-purple-300 dark:border-purple-800">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <IFoodLogo className="w-4 h-4 shrink-0 brightness-110 opacity-90" />
                                                <span>R$ {ifoodCIPrice.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Fee} onChange={e => handleUpdate(product.id, 'pricing', 'food99.fee', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Online} onChange={e => handleUpdate(product.id, 'pricing', 'food99.onlinePayment', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Del} onChange={e => handleUpdate(product.id, 'pricing', 'food99.delivery', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Antic} onChange={e => handleUpdate(product.id, 'pricing', 'food99.anticipation', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-yellow-50/30 dark:bg-yellow-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-yellow-300 dark:hover:border-gray-600 focus:border-yellow-500" value={food99Coupon} onChange={e => handleUpdate(product.id, 'pricing', 'food99.coupon', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center font-bold text-lg text-white bg-[#FBC02D] border-x border-yellow-300 dark:border-yellow-700">
                                            <div className="flex items-center justify-center gap-1.5 text-black">
                                                <Food99Logo className="w-4 h-4 shrink-0" />
                                                <span>R$ {food99Price.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaFee} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.fee', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaOnline} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.onlinePayment', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaDel} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.delivery', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-10 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaAntic} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.anticipation', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center bg-green-50/30 dark:bg-green-900/5"><input type="number" step="0.1" className="w-12 bg-transparent text-gray-900 dark:text-gray-300 text-center outline-none border-b border-transparent hover:border-green-300 dark:hover:border-gray-600 focus:border-green-500" value={keetaCoupon} onChange={e => handleUpdate(product.id, 'pricing', 'keeta.coupon', parseFloat(e.target.value))} /></td>
                                        <td className="p-3 text-center font-bold text-lg text-white bg-[#43A047] border-x border-green-300 dark:border-green-700">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <KeetaLogo className="w-4 h-4 shrink-0" />
                                                <span>R$ {keetaPrice.toFixed(2)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                );
            })()}

        </div>
      </div>

      {/* --- XANDE CONSULTATIVE SIDE PANEL SIDEBAR --- */}
      {showXandePanel && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in font-sans">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowXandePanel(false)}
          />

          {/* Panel Container */}
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] h-screen shadow-2xl flex flex-col z-10 border-l border-gray-100 dark:border-gray-800 animate-slide-in">
            
            {/* Header banner */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 text-white relative border-b border-gray-800">
              <button 
                type="button"
                onClick={() => setShowXandePanel(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full border-2 border-amber-400 bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                  <span className="text-2xl">👨‍🍳</span>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-4 h-4 border-2 border-slate-900 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-[#FFD700]">Consultor Pro</span>
                    <Sparkles size={12} className="text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white">Sua Mentoria com o Xande</h3>
                  <p className="text-[11px] text-gray-400">Inteligência Estratégica & Precificação de Alta Resolução</p>
                </div>
              </div>
            </div>

            {/* Inner Navigation Tabs */}
            <div className="flex border-b border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-2 gap-1 shrink-0">
              <button
                onClick={() => setActiveXandeTab('audit')}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeXandeTab === 'audit'
                    ? 'bg-white dark:bg-gray-800 text-brand-red shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ShieldAlert size={14} />
                <span>Auditar Preços</span>
              </button>
              <button
                onClick={() => setActiveXandeTab('columns')}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeXandeTab === 'columns'
                    ? 'bg-white dark:bg-gray-800 text-brand-red shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Info size={14} />
                <span>Explicar Colunas</span>
              </button>
              <button
                onClick={() => setActiveXandeTab('strategy')}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeXandeTab === 'strategy'
                    ? 'bg-white dark:bg-gray-800 text-brand-red shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Lightbulb size={14} />
                <span>Estratégia iFood</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* TAB 1: AUDIT */}
              {activeXandeTab === 'audit' && (
                <div className="space-y-5 animate-fade-in text-slate-800 dark:text-slate-200">
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex gap-3">
                    <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-amber-900 dark:text-amber-300">
                      <span className="font-bold block mb-1">Métricas de Sobrevivência:</span>
                      O CMV saudável para hamburguerias de alta performance deve rodar entre <strong className="font-extrabold text-amber-700 dark:text-amber-400">28% e 35%</strong>. Se o CMV passar de <strong className="font-extrabold text-[#E53935]">38%</strong>, você está trocando dinheiro com o fornecedor. Abaixo, separei o raio-x exato da sua loja.
                    </div>
                  </div>

                  {/* Danger: Low Margin */}
                  {pricingAudit.lowMarginProducts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        <span>Alerta Vermelho: Margem Crítica ({pricingAudit.lowMarginProducts.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {pricingAudit.lowMarginProducts.map(p => (
                          <div key={p.id} className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">{p.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 font-mono">PV Loja: R$ {p.pvLoja.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-red-600 dark:text-red-400 font-extrabold font-mono block">{formatPercent(p.margin)} Lucro</span>
                              <span className="text-[10px] text-gray-500 block">Margem menor que 15%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg text-[11px] text-gray-500 dark:text-gray-400">
                        💡 <strong>Conselho do Xande:</strong> Itens com margem muito magra sugam o caixa se venderem muito! Recupere essa margem aumentando o preço em R$ 2,00 a R$ 4,00 OU crie uma <strong>Oferta Salva Margem</strong> combinando esse hambúrguer com Batata Frita e Refri. O lucro massivo dos acompanhamentos turbina o lucro da transação!
                      </div>
                    </div>
                  )}

                  {/* Danger: Critical CMV */}
                  {pricingAudit.criticalCmvProducts.length > 0 && (
                    <div className="space-y-2 font-sans">
                      <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        <span>Insumos Caros: CMV Elevado ({pricingAudit.criticalCmvProducts.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {pricingAudit.criticalCmvProducts.map(p => (
                          <div key={p.id} className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">{p.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 font-mono">Custo Insumos: R$ {p.cmvVal.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-amber-600 dark:text-amber-400 font-extrabold font-mono block">{p.cmvPct.toFixed(1)}% CMV</span>
                              <span className="text-[10px] text-gray-500 block">Custo superior a 38%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg text-[11px] text-gray-500 dark:text-gray-400">
                        💡 <strong>Conselho do Xande:</strong> Não reduza a qualidade do seu cheddar ou bacon para baixar o CMV! Em vez disso: renegocie embalagens, reduza o desperdício oculto na cozinha utilizando ficha técnica padronizada ou reajuste o preço sugerido no sistema.
                      </div>
                    </div>
                  )}

                  {/* Praise: Healthy items */}
                  {pricingAudit.healthyProducts.length > 0 && (
                    <div className="space-y-2 font-sans">
                      <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        <span>Produtos no Alvo da Régua ({pricingAudit.healthyProducts.length})</span>
                      </h4>
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                        {pricingAudit.healthyProducts.map(p => (
                          <div key={p.id} className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-900/10 rounded-lg flex justify-between items-center text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">CMV {p.cmvPct.toFixed(0)}% • Lucro {formatPercent(p.margin)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pricingAudit.lowMarginProducts.length === 0 && pricingAudit.criticalCmvProducts.length === 0 && (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-center space-y-2">
                      <span className="text-3xl">🏆</span>
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">Parabéns, Estrutura Blindada!</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                        Todos os seus preços e margens cadastrados estão operando dentro do CMV ideal e gerando lucratividade real para a sua empresa! Esse é o caminho do Lucro Fácil!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXPLAIN COLUMNS */}
              {activeXandeTab === 'columns' && (
                <div className="space-y-5 animate-fade-in text-slate-800 dark:text-slate-200">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
                    Muitos donos perdem dinheiro nos marketplaces por não entender o peso real das colunas. Toque em uma coluna para entender como eu faço o cálculo dela para você:
                  </p>

                  <div className="space-y-3 font-sans">
                    
                    {/* PV Loja */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-150 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">PV Loja</span>
                        <h5 className="font-bold text-xs text-gray-900 dark:text-white">Preço de Venda da Loja</h5>
                      </div>
                      <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed">
                        É o preço mínimo sugerido para o seu balcão ou entrega direta. Ele já cobre o custo do ingrediente (CMV), todos os custos fixos da empresa (CFI como aluguel, equipe, luz e internet) e adiciona a sua <strong>margem líquida desejada</strong>.
                      </p>
                    </div>

                    {/* Fees & Commission */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-150 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">Taxa % / Online %</span>
                        <h5 className="font-bold text-xs text-gray-900 dark:text-white">Comissão da Plataforma & Pagamento</h5>
                      </div>
                      <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed">
                        O iFood cobra de 12% a 23% dependendo se você usa o plano básico ou plano de entrega parceiro. O pagamento online adiciona cerca de 3.2%. Eu somo essas taxas e as incorporo no cálculo para garantir que o repasse proteja a sua margem intacta.
                      </p>
                    </div>

                    {/* Anticipation */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-150 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">Antec % (Antecipação)</span>
                        <h5 className="font-bold text-xs text-gray-900 dark:text-white">Taxa de Antecipação Financeira</h5>
                      </div>
                      <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed">
                        <strong>Atenção total:</strong> Receber em 1 dia em vez de 30 dias custa em média de 1.5% a 2.0% adicionais sobre TODAS as suas vendas. Parece pouco, mas ao longo do ano isso representa milhares de reais que saem do seu lucro líquido! Se você tiver capital de giro, desligue a antecipação automática para estancar esse vazamento.
                      </p>
                    </div>

                    {/* PV CI */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-[#B71C1C] text-white px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">PV CI (Cupom Inteligente)</span>
                        <h5 className="font-bold text-xs text-purple-900 dark:text-purple-300">Preço com Cupom Inteligente</h5>
                      </div>
                      <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                        O Cupom Inteligente do iFood é o melhor hack de visibilidade, pois parte do desconto de R$ 5,00 ou R$ 10,00 é bancado pela própria plataforma. Mas se você vender no preço normal de cardápio com cupom ativo, ele vai morder sua margem. Por isso, eu calculo o <strong>PV CI</strong>: o preço perfeito que você deve anunciar para que mesmo após o desconto do cupom o seu lucro continue 100% preservado.
                      </p>
                    </div>

                    {/* Cupom R$ */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-150 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">Cupom R$</span>
                        <h5 className="font-bold text-xs text-gray-900 dark:text-white">Cupons Oferecidos pela Loja</h5>
                      </div>
                      <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed">
                        Cupons de desconto do seu bolso (R$ 5 OFF, R$ 10 OFF). Se você quiser rodar esses cupons, precisa preencher esse campo para que o preço final suba na mesma proporção, fazendo o cliente receber o desconto nominal sem prejudicar suas contas de insumos.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: IFOOD STRATEGIES & MAGNO METHOD */}
              {activeXandeTab === 'strategy' && (
                <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/30 rounded-xl">
                    <h4 className="font-bold text-sky-900 dark:text-sky-300 mb-1 flex items-center gap-1 font-sans">
                      <Sparkles size={14} />
                      <span>Configs Testadas que Mais Vendem no iFood</span>
                    </h4>
                    <p className="text-[11px] text-sky-800 dark:text-sky-300 font-sans">
                      Aplique os ensinamentos testados na chapa de quem vive no mercado para lucrar até 3x mais na internet.
                    </p>
                  </div>

                  <div className="space-y-4 font-sans">
                    {/* Strategy 1 */}
                    <div className="flex gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</div>
                      <div>
                        <h5 className="font-bold text-gray-900 dark:text-white mb-1">A Ilusão do Frete Grátis</h5>
                        <p className="text-gray-605 dark:text-gray-400 leading-relaxed">
                          Clientes do iFood escolhem muito mais um produto anunciado por <strong className="font-bold text-gray-950 dark:text-white">R$ 38,90 com Frete Grátis</strong> do que um por <strong className="font-bold text-gray-950 dark:text-white">R$ 32,90 + R$ 6,00 de entrega</strong>. 
                          <br/><br/>
                          <strong>Como fazer:</strong> Vá na coluna <strong className="font-mono text-gray-950 dark:text-white">Entrega R$</strong>, insira ali o custo da entrega que você paga para o seu entregador ou plataforma e repasse no preço final do cardápio do iFood, anunciando na plataforma como Frete Grátis! A barreira de conversão vai despencar.
                        </p>
                      </div>
                    </div>

                    {/* Strategy 2 */}
                    <div className="flex gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</div>
                      <div>
                        <h5 className="font-bold text-gray-900 dark:text-white mb-1">O Combo do Rei (Protetor de Margem)</h5>
                        <p className="text-gray-605 dark:text-gray-400 leading-relaxed">
                          Evite dar descontos diretos em hambúrgueres individuais (que possuem insumos caros como carne e cheddar de qualidade).
                          <br/><br/>
                          <strong>O segredo:</strong> Esconda a margem do hambúrguer montando Combos com acompanhamentos gordos. Batata frita de saca possui custo de R$ 1,50 e refrigerantes custam R$ 2,50, mas são vendidos no combo por mais de R$ 12,00. O lucro massivo do refri e da fritas absorve o desconto oferecido no burguer principal, e você bate tickets altos de R$ 45,00 de forma altamente lucrativa!
                        </p>
                      </div>
                    </div>

                    {/* Strategy 3 */}
                    <div className="flex gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</div>
                      <div>
                        <h5 className="font-bold text-gray-900 dark:text-white mb-1">Disparador de Cupom no Rank</h5>
                        <p className="text-gray-605 dark:text-gray-400 leading-relaxed">
                          Ative cupons inteligentes de R$ 10 em compras acima de R$ 50 no iFood para que seu restaurante suba no algoritmo até o topo. Mas não esqueça: para que isso não quebre suas finanças, o preço sugerido do combo deve ser calculado usando a nossa régua da coluna <strong className="font-mono text-purple-600 dark:text-purple-400 text-purple-950">PV CI</strong>! Ela blinda as suas margens de insumos 100% contra a mordida da plataforma.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Footer and dynamic CTA */}
            <div className="p-4 border-t border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex gap-2">
              <button
                type="button"
                onClick={() => setShowXandePanel(false)}
                className="flex-1 py-2.5 px-4 bg-gray-200 hover:bg-gray-350 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl text-xs transition duration-200 uppercase cursor-pointer"
              >
                Entendi, Xande!
              </button>
            </div>

          </div>

        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE AJUSTE MASSIVO */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-start gap-3">
              <span className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                <Sparkles size={20} />
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider">
                  Confirmar Alteração em Lote
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Deseja mesmo alterar a coluna <strong className="text-purple-650 dark:text-purple-400 font-bold font-sans">"{bulkColumnsList.find(c => c.key === selectedBulkKey)?.label || 'selecionada'}"</strong> para o valor <strong className="text-gray-900 dark:text-white font-mono">{parseFloat(bulkValString)}{bulkColumnsList.find(c => c.key === selectedBulkKey)?.unit}</strong>?
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/10 space-y-2">
              <h4 className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400 tracking-wider flex items-center gap-1.5 font-sans">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                Aviso Importante
              </h4>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300 font-sans">
                Esta ação irá alterar o valor de <strong className="font-bold">TODOS</strong> os {sortedProducts.length || 0} lanches e produtos cadastrados no sistema de forma simultânea. 
              </p>
              <p className="text-[10px] leading-relaxed text-amber-600/80 dark:text-amber-400/80 font-sans">
                *Você ainda pode ajustar linhas específicas manualmente na tabela de preços se precisar de exceções.
              </p>
            </div>

            <div className="flex gap-2 pt-2 font-sans">
              <button
                type="button"
                onClick={() => setShowBulkConfirmModal(false)}
                className="flex-1 py-3 px-4 bg-gray-150 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs uppercase tracking-wide transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkUpdate}
                className="flex-1 py-3 px-4 bg-purple-650 hover:bg-purple-750 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-md shadow-purple-500/10 hover:shadow-lg transition cursor-pointer"
              >
                Confirmar e Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Pricing;
