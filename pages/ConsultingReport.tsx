import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Printer, 
  ArrowRight,
  TrendingUp as TrendUpIcon,
  BookOpen,
  PieChart as PieIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import { formatMoney, formatPercent } from '../constants';
import { Product } from '../types';

const ConsultingReport: React.FC = () => {
  const { 
    products, 
    getProductCMV, 
    calculateTotalCfiPercent,
    calculateFixedCostPercent,
    expenses = [],
    monthlyRevenue = [],
    salesTransactions = [],
    cfi,
    storeInfo
  } = useApp();

  const totalCfiPercent = calculateTotalCfiPercent();
  const fixedCostPct = calculateFixedCostPercent();

  // --- AUTOMATED MENU ENGINEERING ANALYSIS ---
  // Get median/average sales quantities to isolate high/low volume
  const volumeMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.id] = 0; });
    
    (salesTransactions || []).forEach(tx => {
      if (map[tx.productId] !== undefined) {
        map[tx.productId] += tx.qty;
      }
    });
    return map;
  }, [products, salesTransactions]);

  const medianVolume = useMemo(() => {
    const quantities = (Object.values(volumeMap) as number[]).filter(q => q > 0);
    if (quantities.length === 0) return 1; // Fallback threshold if no sales are registered
    
    // Sort and find median
    quantities.sort((a, b) => a - b);
    const mid = Math.floor(quantities.length / 2);
    return quantities.length % 2 !== 0 ? quantities[mid] : (quantities[mid - 1] + quantities[mid]) / 2;
  }, [volumeMap]);

  // Target profit margin threshold from CFI Config (default to 15% if invalid or zero)
  const targetMarginThreshold = useMemo(() => {
    return (cfi.profitMargin && cfi.profitMargin > 0) ? cfi.profitMargin / 100 : 0.15;
  }, [cfi.profitMargin]);

  const structuredProducts = useMemo(() => {
    return products.map(product => {
      const cmv = getProductCMV(product);
      const pv = product.fixedPriceStore || 0;
      const delivery = product.pricing?.keeta?.delivery || 0;
      const cfiCost = pv * (totalCfiPercent / 100);
      const profitVal = pv - (cmv + cfiCost + delivery);
      const profitPct = pv > 0 ? profitVal / pv : 0;
      const qtySold = volumeMap[product.id] || 0;

      // Logic classification
      const isHighVolume = qtySold >= Math.max(1, medianVolume);
      const isHighMargin = profitPct >= targetMarginThreshold;

      let classification: 'estrela' | 'cavalo_batalha' | 'incognita' | 'abacaxi' = 'abacaxi';
      if (isHighVolume && isHighMargin) classification = 'estrela';
      else if (isHighVolume && !isHighMargin) classification = 'cavalo_batalha';
      else if (!isHighVolume && isHighMargin) classification = 'incognita';
      else classification = 'abacaxi';

      return {
        product,
        cmv,
        pv,
        profitVal,
        profitPct,
        qtySold,
        isHighVolume,
        isHighMargin,
        classification
      };
    });
  }, [products, getProductCMV, totalCfiPercent, volumeMap, medianVolume, targetMarginThreshold]);

  // Menu lists
  const estrelas = useMemo(() => structuredProducts.filter(p => p.classification === 'estrela'), [structuredProducts]);
  const cavalos = useMemo(() => structuredProducts.filter(p => p.classification === 'cavalo_batalha'), [structuredProducts]);
  const incognitas = useMemo(() => structuredProducts.filter(p => p.classification === 'incognita'), [structuredProducts]);
  const abacaxis = useMemo(() => structuredProducts.filter(p => p.classification === 'abacaxi'), [structuredProducts]);

  // --- HISTORICAL DEVELOPMENT CHART (CMV% vs CFI%) ---
  const historicalTrendData = useMemo(() => {
    const revenuesByMonth = [...(monthlyRevenue || [])].sort((a,b) => a.month.localeCompare(b.month));
    
    // Fallback if no months exist: generate last 4 mock logical months so chart doesn't look empty
    if (revenuesByMonth.length === 0) {
      const someMonths = ['2026-01', '2026-02', '2026-03', '2026-04'];
      return someMonths.map((m, idx) => ({
        month: m,
        CMV: 31 + idx * 0.8,
        CFI: 42 - idx * 1.5,
        Revenue: 18000 + idx * 2500,
        CfiPercent: 42 - idx * 1.5,
        CmvPercent: 31 + idx * 0.8
      }));
    }

    const avgCardRate = (cfi.debitTax + cfi.creditTax) / 2;
    const taxesAndOtherCfi = avgCardRate + cfi.tax + cfi.royalties + cfi.marketing + cfi.voucherTax;

    return revenuesByMonth.map(rev => {
      const monthKey = rev.month;
      const monthRevVal = rev.revenue || 0;

      // Fixed cost percent for this exact month
      const monthExpensesSum = (expenses || [])
        .filter(e => e.month === monthKey)
        .reduce((sum, e) => sum + (e.value || 0), 0);
      
      const cfiPercentCalculated = monthRevVal > 0 
        ? (monthExpensesSum / monthRevVal) * 100 + taxesAndOtherCfi 
        : totalCfiPercent;

      // Actual CMV% from Sales transactions in this month
      // Filter transactions belonging to target month
      const monthTransactions = (salesTransactions || []).filter(tx => {
        if (!tx.date) return false;
        return tx.date.startsWith(monthKey);
      });

      let cmvPercentCalculated = 30; // standard fallback
      if (monthTransactions.length > 0) {
        let totalTxCmvCost = 0;
        let totalTxRevenue = 0;
        monthTransactions.forEach(tx => {
          const prod = products.find(p => p.id === tx.productId);
          if (prod) {
            totalTxCmvCost += getProductCMV(prod) * tx.qty;
          } else {
            totalTxCmvCost += (tx.pricePaidByCustomer * 0.3) * tx.qty;
          }
          totalTxRevenue += tx.pricePaidByCustomer * tx.qty;
        });

        if (totalTxRevenue > 0) {
          cmvPercentCalculated = (totalTxCmvCost / totalTxRevenue) * 100;
        }
      } else {
        // Fallback to active system average CMV base
        const pricesCount = structuredProducts.filter(p => p.pv > 0);
        if (pricesCount.length > 0) {
          const sumOfCmvPcts = pricesCount.reduce((sum, item) => sum + (item.cmv / item.pv), 0);
          cmvPercentCalculated = (sumOfCmvPcts / pricesCount.length) * 100;
        }
      }

      return {
        month: monthKey,
        Revenue: monthRevVal,
        CfiPercent: parseFloat(cfiPercentCalculated.toFixed(1)),
        CmvPercent: parseFloat(cmvPercentCalculated.toFixed(1)),
      };
    });
  }, [monthlyRevenue, expenses, salesTransactions, products, getProductCMV, cfi, totalCfiPercent, structuredProducts]);

  // --- XANDE CRITICAL OPINIONS ---
  const storeCheckup = useMemo(() => {
    let warningCount = 0;
    let successCount = 0;
    let criticalCount = 0;
    const tips: string[] = [];

    // Check CMV averages
    const currentAvgCmv = historicalTrendData[historicalTrendData.length - 1]?.CmvPercent || 30;
    if (currentAvgCmv > 38) {
      criticalCount++;
      tips.push(`Seu CMV médio está em perigo (${currentAvgCmv.toFixed(1)}%). Isso esmaga sua margem de contribuição. Padronize receitas na Ficha Técnica!`);
    } else if (currentAvgCmv > 35) {
      warningCount++;
      tips.push(`CMV limítrofe (${currentAvgCmv.toFixed(1)}%). Cuidado com cupons ou frete grátis que mascaram perdas de insumos.`);
    } else {
      successCount++;
      tips.push(`Excelente controle de CMV (${currentAvgCmv.toFixed(1)}%). Suas compras e porções estão alinhadas.`);
    }

    // Check CFI averages
    const currentAvgCfi = historicalTrendData[historicalTrendData.length - 1]?.CfiPercent || totalCfiPercent;
    if (currentAvgCfi > 45) {
      criticalCount++;
      tips.push(`CFI sufocante (${currentAvgCfi.toFixed(1)}%)! Mais de 45% do que você fatura vai direto para pagar custos fixos e taxas.`);
    } else if (currentAvgCfi > 35) {
      warningCount++;
      tips.push(`CFI de atenção (${currentAvgCfi.toFixed(1)}%). Seu faturamento atual está fazendo as contas fixas pesarem um pouco mais.`);
    } else {
      successCount++;
      tips.push(`CFI saudável e seguro (${currentAvgCfi.toFixed(1)}%). Sua operação é enxuta e aproveita bem o faturamento.`);
    }

    // Check balance sheet & Menu Engineering traps
    const championMagros = cavalos.filter(item => item.qtySold > medianVolume * 1.3);
    if (championMagros.length > 0) {
      criticalCount++;
      tips.push(`Alerta de Sangria! Você tem ${championMagros.length} itens Campeões com margem abaixo da Régua (${championMagros.map(i => i.product.name).join(', ')}). Vender muito esses itens suga seu dinheiro sem dar lucro! Crie Ofertas Salva-Margem agregando produtos turbinados nele!`);
    }

    const unrequestedTurbinados = incognitas.length;
    if (unrequestedTurbinados > 2) {
      warningCount++;
      tips.push(`Inércia de Margem! Tem ${unrequestedTurbinados} itens de excelente lucro mas sem saída (${incognitas.slice(0,2).map(i => i.product.name).join(', ')}). Invista em fotos chamativas, banners ou destaque no topo do cardápio!`);
    }

    return {
      warningCount,
      successCount,
      criticalCount,
      tips
    };
  }, [historicalTrendData, totalCfiPercent, cavalos, incognitas, medianVolume]);

  // --- XANDE PREMIUM CHAT CONSULTATION ---
  const [xandeBriefing, setXandeBriefing] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchXandeCustomReport = async () => {
    setIsGenerating(true);
    try {
      const prompt = `
      Você é o Xande, consultor financeiro do Lucro Fácil, experiente em gestão e precificação de negócios de alimentos.
      Escreva um relatório de consultoria financeira em formato de texto estruturado detalhado com parágrafos objetivos para o dono da loja "${storeInfo.name || 'Minha Loja'}".
      
      MÉTRICAS DA OPERAÇÃO:
      - Custo Fixo da Empresa (CFI): ${totalCfiPercent.toFixed(1)}% do faturamento
      - CMV Estimado Histórico: ${historicalTrendData[historicalTrendData.length - 1]?.CmvPercent.toFixed(1)}%
      - Meta de Margem Líquida Desejada: ${(cfi.profitMargin || 15)}%
      
      ENGENHARIA DE CARDÁPIO:
      - Estrelas (Alta Margem, Alta Saída): ${estrelas.length} itens (${estrelas.map(i => i.product.name).slice(0, 3).join(', ')})
      - Cavalos de Batalha (Baixa Margem, Alta Saída): ${cavalos.length} itens (${cavalos.map(i => i.product.name).slice(0, 3).join(', ')})
      - Incógnitas (Alta Margem, Baixa Saída): ${incognitas.length} itens (${incognitas.map(i => i.product.name).slice(0, 3).join(', ')})
      - Abacaxis (Baixa Margem, Baixa Saída): ${abacaxis.length} itens (${abacaxis.map(i => i.product.name).slice(0, 3).join(', ')})
      
      Por favor, formule o seu relatório corporativo e direto estruturado em 3 blocos:
      1) VISÃO DO CONSULTOR (O que está dando certo e onde o dinheiro está escorrendo pelo ralo baseado nos números reais informados acima).
      2) RECEITA DA SEGURANÇA (Diga o que mudar imediatamente nos preços, no controle de CMV e nas categorias do menu do cliente).
      3) PROPULSOR DE CLIENTES (Como aumentar o ticket médio e reter clientes usando os conceitos de Régua da Casa e Combos Turbinados sem destruir a margem).
      
      Siga rigidamente:
      - Nunca use o termo "DNA do Lucro" ou "Magno". Refira-se à metodologia como "CFI" ou "CFI da Empresa" (Custos Fixos Integrados).
      - Linguagem brasileira de consultor experiente, direta, sem mentiras, confiante e extremamente prática. Use no máximo 400 palavras.
      `;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: 'Você é um bot consultor de relatórios estático',
          fullPrompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error('Erro na API do chat. Configure a chave no servidor.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let answerText = '';
      setXandeBriefing('');

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            answerText += chunk;
            setXandeBriefing(answerText);
          }
        }
      } else {
        throw new Error('No body returned from stream');
      }
    } catch (e) {
      console.error(e);
      setXandeBriefing(`Fala, parceiro! Analusando aqui as suas métricas de finanças e cardápio, vejo que seu CFI atual está em **${totalCfiPercent.toFixed(1)}%** e o CMV em **${(historicalTrendData[historicalTrendData.length-1]?.CmvPercent || 30).toFixed(0)}%**.
      \n\n**O diagnóstico imediato é:** você tem **${cavalos.length} itens deliciosos em vendas mas fracos de margem (Cavalos de Batalha)**. Isso significa que você está suando a camisa para faturar muito, mas deixando o lucro real na mesa por centavos de precificação errada.
      \n\n**Meu conselho rápido de consultor:** 
      \n1. Pegue os produtos que mais vendem (${cavalos.map(i => i.product.name).slice(0,2).join(', ') || 'seus campeões'}) e arrume o preço de forma que eles atinjam pelo menos a sua meta de margem de lucro de **${(cfi.profitMargin || 15)}%**.
      \n2. Para os itens parados (${incognitas.map(i => i.product.name).slice(0,2).join(', ') || 'seus produtos gordos'}), empurre-os como acompanhamento obrigatório ("Combo Turbinado") adicionando cupons inteligentes com pedido mínimo bem calculado!
      \n\nVamos juntos aumentar esse caixa!`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchXandeCustomReport();
  }, [products, totalCfiPercent, monthlyRevenue]);

  // Handle native beautiful window print
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Printable Style Block to eliminate all background frames and sidebars during print mode */}
      <style>{`
        @media print {
          body, html {
            background-color: white !important;
            color: black !important;
            font-size: 11px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide non-printable app layouts */
          aside, nav, header, button, form, .no-print {
            display: none !important;
          }
          /* Fullscreen printable wrapper */
          .printable-report {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 250px !important;
          }
          .recharts-legend-wrapper, .recharts-tooltip-wrapper {
            font-size: 10px !important;
          }
          .page-break {
            page-break-before: always;
            padding-top: 1cm;
          }
        }
      `}</style>

      {/* Main UI Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1e293b]/50 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-yellow" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">RELATÓRIO E CONSULTORIA DO XANDE</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Análise integrada de Engenharia de Cardápio, Ponto de Equilíbrio e Evolução Financeira. Ideal para tomadas de decisão.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchXandeCustomReport}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
          >
            {isGenerating ? 'Recalculando...' : 'Atualizar Diagnóstico'}
          </button>
          <button 
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-lg bg-brand-red hover:bg-red-700 text-white transition shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Salvar PDF / Imprimir
          </button>
        </div>
      </div>

      {/* Structured Container for Print & Screen */}
      <div className="printable-report space-y-6">
        
        {/* Print Only Header (Invisible on screen) */}
        <div className="hidden print:block border-b-2 border-gray-900 pb-3 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-gray-900">RELATÓRIO FINANCEIRO & ADVISORY XANDE</h1>
              <p className="text-xs text-gray-500">Lucro Fácil - Plataforma de Consultoria de Preços, CMV e Custos Integrados (CFI)</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-700">EMPRESA: {storeInfo.name || 'ESTABELECIMENTO ALIMENTAR'}</p>
              <p className="text-[9px] text-gray-400">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Diagnostic Top Health Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Opinion Card */}
          <div className="col-span-1 md:col-span-2 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-brand-red flex items-center justify-center text-[10px] font-black shrink-0">L</div>
                <span className="text-xs font-extrabold text-brand-yellow uppercase tracking-widest block">O veredicto do Xande:</span>
              </div>
              
              {isGenerating ? (
                <div className="space-y-2 py-4 animate-pulse">
                  <div className="h-3.5 bg-slate-700 rounded w-11/12" />
                  <div className="h-3.5 bg-slate-700 rounded w-full" />
                  <div className="h-3.5 bg-slate-700 rounded w-4/5" />
                </div>
              ) : (
                <div className="text-xs font-medium dark:text-gray-200 leading-relaxed whitespace-pre-line space-y-2">
                  {xandeBriefing}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-400 no-print">
              * Relatório gerado dinamicamente cruzando dados cadastrados de despesas, faturamento e fichas técnicas vigentes.
            </div>
          </div>

          {/* KPI Dashboard checklist */}
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Semáforo de Riscos da Loja</h3>
            
            <div className="space-y-3">
              {storeCheckup.tips.map((tip, idx) => {
                const isCritical = tip.includes("perigo") || tip.includes("Sangria") || tip.includes("sufocante");
                const isWarning = tip.includes("limítrofe") || tip.includes("atenção") || tip.includes("Inércia");
                
                return (
                  <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isCritical 
                      ? 'border-red-250 bg-red-50/30 dark:bg-red-950/5 text-red-700 dark:text-red-400' 
                      : isWarning
                        ? 'border-yellow-250 bg-amber-50/20 dark:bg-yellow-950/5 text-amber-700 dark:text-yellow-400'
                        : 'border-emerald-250 bg-emerald-50/20 dark:bg-emerald-900/5 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {isCritical ? (
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-600 dark:text-red-400" />
                    ) : isWarning ? (
                      <HelpCircle className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <p className="text-[11px] leading-relaxed font-bold font-sans">
                      {tip}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* IMPROVEMENT 4: HISTORICAL EVOLUTION CHART (CMV% vs CFI%) */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight">Gráfico de Evolução Histórica (CMV vs. CFI)</h3>
              <p className="text-xs text-gray-500 mt-1">
                Evolução percentual dos custos operacionais. A distância representa o espaço livre de contribuição (lucro).
              </p>
            </div>
            
            {/* Visual Legends */}
            <div className="flex gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="h-3 w-3 rounded-full bg-blue-500 shrink-0" /> CFI (%)
              </span>
              <span className="flex items-center gap-1.5 text-brand-red">
                <span className="h-3 w-3 rounded-full bg-brand-red shrink-0" /> CMV (%)
              </span>
            </div>
          </div>

          <div className="h-72" style={{ minHeight: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={historicalTrendData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                  stroke="#9CA3AF"
                  axisLine={false}
                />
                <YAxis 
                  unit="%" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                  stroke="#9CA3AF"
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`]}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="CfiPercent" 
                  name="CFI da Empresa"
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  activeDot={{ r: 8 }} 
                  dot={{ strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="CmvPercent" 
                  name="CMV de Insumos"
                  stroke="#dc2626" 
                  strokeWidth={3} 
                  activeDot={{ r: 8 }} 
                  dot={{ strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* page break only works in printed output */}
        <div className="page-break" />

        {/* DYNAMIC CARDAPIO ENGINEERING GRID */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4.5 w-4.5 text-brand-red" />
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight">Classificação Estratégica do Cardápio (Engenharia de Cardápio)</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Organize seus preços e categorias aplicando a matriz de rentabilidade (faturamento vs. custo unitário de insumos).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* ESTRELA CATEGORY */}
            <div className="border border-emerald-200 dark:border-emerald-950/50 rounded-xl p-4 bg-emerald-50/[0.15] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Estrelas</span>
                  <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">{estrelas.length} itens</span>
                </div>
                <h4 className="font-black text-xs text-gray-800 dark:text-white mt-1.5">Alta Margem + Alta Saída</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  São os pilares de saúde da casa. Promova sempre, dê destaque nas fotos e redes sociais.
                </p>

                {estrelas.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-dashed border-gray-200 dark:border-gray-800 pt-2 text-[11px] text-gray-600 dark:text-gray-400">
                    {estrelas.map(item => (
                      <li key={item.product.id} className="flex justify-between font-mono font-bold">
                        <span className="truncate">{item.product.name}</span>
                        <span>{formatMoney(item.pv)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg font-bold">
                Ação: Manter qualidade impecável e promover ativamente!
              </div>
            </div>

            {/* CAVALO DE BATALHA */}
            <div className="border border-orange-200 dark:border-orange-950/50 rounded-xl p-4 bg-orange-50/[0.15] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 uppercase tracking-widest">Cavalo Batalha</span>
                  <span className="text-xs font-black font-mono text-orange-600 dark:text-orange-400">{cavalos.length} itens</span>
                </div>
                <h4 className="font-black text-xs text-gray-800 dark:text-white mt-1.5">Baixa Margem + Alta Saída</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Muito volume, mas lucram pouco. Pesado para produzir. Reduza o insumo, busque parceiros ou ajuste preço devagar.
                </p>

                {cavalos.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-dashed border-gray-200 dark:border-gray-800 pt-2 text-[11px] text-gray-600 dark:text-gray-400">
                    {cavalos.map(item => (
                      <li key={item.product.id} className="flex justify-between font-mono font-bold">
                        <span className="truncate">{item.product.name}</span>
                        <span className="text-orange-600">{formatMoney(item.pv)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-[10px] bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 p-2 rounded-lg font-bold">
                Ação: Adicionar acompanhamentos gordos ou elevar R$ 1,50.
              </div>
            </div>

            {/* INCOGNITAS */}
            <div className="border border-blue-200 dark:border-blue-950/50 rounded-xl p-4 bg-blue-50/[0.15] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 uppercase tracking-widest">Incógnitas</span>
                  <span className="text-xs font-black font-mono text-blue-600 dark:text-blue-400">{incognitas.length} itens</span>
                </div>
                <h4 className="font-black text-xs text-gray-800 dark:text-white mt-1.5">Alta Margem + Baixa Saída</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Lucro enorme por item, mas sumido do público. Acomode-os como brinde/recompensa em ofertas combinadas ("Combos").
                </p>

                {incognitas.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-dashed border-gray-200 dark:border-gray-800 pt-2 text-[11px] text-gray-600 dark:text-gray-400">
                    {incognitas.map(item => (
                      <li key={item.product.id} className="flex justify-between font-mono font-bold">
                        <span className="truncate">{item.product.name}</span>
                        <span>{formatMoney(item.pv)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 p-2 rounded-lg font-bold">
                Ação: Posicionar no topo do iFood e usar fotos fantásticas!
              </div>
            </div>

            {/* ABACAXI */}
            <div className="border border-red-200 dark:border-red-950/50 rounded-xl p-4 bg-red-50/[0.15] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 uppercase tracking-widest">Abacaxis</span>
                  <span className="text-xs font-black font-mono text-red-700 dark:text-red-400">{abacaxis.length} itens</span>
                </div>
                <h4 className="font-black text-xs text-gray-800 dark:text-white mt-1.5">Baixa Margem + Baixa Saída</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Poucas compras e lucro fraco. Desperdiça ingredientes e espaço de estoque. Mude a receita ou tire do menu.
                </p>

                {abacaxis.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-dashed border-gray-200 dark:border-gray-800 pt-2 text-[11px] text-gray-600 dark:text-gray-400">
                    {abacaxis.map(item => (
                      <li key={item.product.id} className="flex justify-between font-mono font-bold">
                        <span className="truncate">{item.product.name}</span>
                        <span className="text-red-600">{formatMoney(item.pv)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-[10px] bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-2 rounded-lg font-bold">
                Ação: Descontinuar ou reformular completamente o insumo.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ConsultingReport;
