import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, Sparkles, ShieldAlert, Info, Lightbulb, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { formatPercent } from '../constants';

interface XandePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const XandePanel: React.FC<XandePanelProps> = ({ isOpen, onClose }) => {
  const { 
    cfi, 
    getSortedProducts, 
    getProductCMV, 
    calculateFixedCostPercent 
  } = useApp();

  const [activeXandeTab, setActiveXandeTab] = useState<'audit' | 'columns' | 'strategy'>('audit');

  const fixedCostPct = calculateFixedCostPercent();
  const avgCardRate = (cfi.debitTax + cfi.creditTax) / 2;
  const variableCostsPct = avgCardRate + cfi.tax + cfi.royalties + cfi.marketing + cfi.voucherTax;
  const totalCfiCost = fixedCostPct + variableCostsPct;

  const sortedProducts = useMemo(() => {
    return getSortedProducts() || [];
  }, [getSortedProducts]);

  const calculateStorePrice = (cmv: number, profitMargin: number) => {
    const totalDeductions = (totalCfiCost + profitMargin) / 100;
    if (totalDeductions >= 1) return 0; 
    return cmv / (1 - totalDeductions);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer" 
        onClick={onClose}
      />

      {/* Panel Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] h-screen shadow-2xl flex flex-col z-10 border-l border-gray-100 dark:border-gray-800 animate-slide-in">
        
        {/* Header banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 text-white relative border-b border-gray-800">
          <button 
            type="button"
            onClick={onClose}
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
              <p className="text-[11px] text-gray-400">Inteligência Estratégica &amp; Precificação de Alta Resolução</p>
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
                  O CMV saudável para negócios de alimentação de alta performance deve rodar entre <strong className="font-extrabold text-amber-700 dark:text-amber-400">28% e 35%</strong>. Se o CMV passar de <strong className="font-extrabold text-[#E53935]">38%</strong>, você está trocando dinheiro com o fornecedor. Abaixo, separei o raio-x exato da sua loja.
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
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
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
                    <h5 className="font-bold text-xs text-gray-900 dark:text-white">Comissão da Plataforma &amp; Pagamento</h5>
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

          {/* TAB 3: IFOOD STRATEGIES */}
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
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <h5 className="font-bold text-gray-900 dark:text-white mb-1">1. Falsa Entrega Grátis até 3km</h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    O cliente odeia pagar frete. Embuta o valor de entrega de R$ 4,00 a R$ 6,00 direto no preço do hambúrguer e coloque frete grátis na plataforma. A conversão da loja decola imediatamente!
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <h5 className="font-bold text-gray-900 dark:text-white mb-1">2. Cupom de R$ 10 em vez de 10% OFF</h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    A mente humana reage muito melhor a números absolutos tangíveis. Um cupom de R$ 10 do seu bolso, reprecificado corretamente usando a coluna <strong>Cupom R$</strong>, atrai 40% mais cliques do que dar 10% de desconto nominal.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <h5 className="font-bold text-gray-900 dark:text-white mb-1">3. A Regra de 3 dos Acompanhamentos</h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sempre ofereça Batata Individual por R$ 9,90, Batata Turbinada com Cheddar/Bacon por R$ 19,90 e porção família por R$ 29,90. O cliente tende naturalmente a escolher a do meio, elevando o seu ticket médio de forma automática!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
