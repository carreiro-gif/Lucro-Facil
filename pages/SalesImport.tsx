import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Upload, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  HelpCircle, 
  RefreshCw, 
  PlusCircle, 
  Sparkles, 
  Calculator, 
  MessageSquare, 
  Calendar,
  FileText,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import * as XLSX from 'xlsx';
import { formatMoney, formatPercent } from '../constants';
import { SalesTransaction } from '../types';

const parseBrOrUsMoney = (val: string): number => {
  if (!val) return 0;
  // Strip anything that is NOT a digit, dot, comma, or minus sign
  let s = val.replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  const lastSeparatorIndex = Math.max(lastDot, lastComma);
  
  if (lastSeparatorIndex === -1) {
    return parseFloat(s) || 0;
  }
  
  const charsAfter = s.length - 1 - lastSeparatorIndex;
  
  if (charsAfter === 2 || charsAfter === 1) {
     const integerPart = s.substring(0, lastSeparatorIndex).replace(/[.,]/g, '');
     const decimalPart = s.substring(lastSeparatorIndex + 1);
     return parseFloat(`${integerPart}.${decimalPart}`) || 0;
  } else if (charsAfter === 3) {
     return parseFloat(s.replace(/[.,]/g, '')) || 0;
  }
  
  return parseFloat(s.replace(/[.,]/g, '')) || 0;
};

const SalesImport: React.FC = () => {
  const { 
    products, 
    combos = [],
    getProductCMV, 
    calculateTotalCfiPercent,
    salesTransactions = [],
    addSalesTransaction,
    addSalesTransactionsBatch,
    deleteSalesTransaction,
    clearSalesTransactions
  } = useApp();

  const totalCfiPercent = calculateTotalCfiPercent();

  const getComboCMV = React.useCallback((combo: any) => {
    let cmvCombo = 0;
    const itemCosts: number[] = [];
    
    (combo.items || []).forEach((item: any) => {
        const prod = (products || []).find(p => p.id === item.productId);
        if (prod) {
            itemCosts.push(getProductCMV(prod) * item.quantity);
        } else {
            itemCosts.push(0);
        }
    });

    if (combo.type === 'free_choice') {
      const avgCost = itemCosts.length > 0 ? (itemCosts.reduce((acc, val) => acc + val, 0) / itemCosts.length) : 0;
      const freeChoiceCount = combo.freeChoiceCount || 2;
      cmvCombo = avgCost * freeChoiceCount;
    } else {
      cmvCombo = itemCosts.reduce((acc, val) => acc + val, 0);
    }
    return cmvCombo;
  }, [products, getProductCMV]);

  const normalizeName = (name: string) => {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/gi, '').toLowerCase().trim();
  };


  // Navigation and active states
  const [activeSubTab, setActiveSubTab] = useState<'paste' | 'file' | 'manual'>('paste');
  const [showHelp, setShowHelp] = useState(true);

  // Form states for manual entry
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualChannel, setManualChannel] = useState<'ifood' | 'food99' | 'keeta' | 'store'>('ifood');
  const [manualPrice, setManualPrice] = useState('');
  const [manualSubsidy, setManualSubsidy] = useState('0');
  const [manualCoupon, setManualCoupon] = useState('0');
  const [manualFee, setManualFee] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualOrderId, setManualOrderId] = useState('');

  // Paste import state
  const [pasteContent, setPasteContent] = useState('');
  const [importLog, setImportLog] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-deduplication confirmation state
  const [showDeduplicateAlert, setShowDeduplicateAlert] = useState(true);

  // Xande embedded advisory states
  const [xandeChatMessages, setXandeChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: "Legal ver você por aqui! Integrar as vendas é o passo mais inteligente para saber quanto sobrou no seu bolso de verdade. Você prefere copiar e colar suas vendas de uma planilha / iFood ou quer lançar algumas de forma manual?"
    }
  ]);
  const [xandeInput, setXandeInput] = useState('');
  const [isXandeLoading, setIsXandeLoading] = useState(false);

  // Standard channel commission defaults
  const getChannelDefaultFeePercent = (channel: string): number => {
    switch (channel) {
      case 'ifood': return 17.1; // 12 + 3.2 + 1.9 (Platform + payment + anticipation)
      case 'food99': return 12.1; // 8.9 + 3.2
      case 'keeta': return 12.1; // 8.9 + 3.2
      default: return 3.0; // Credit Card machine / ticket average
    }
  };

  // Safe product selection
  const selectedProductObj = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Set default manual price and transaction fee based on selected product and channel
  React.useEffect(() => {
    if (selectedProductObj) {
      // Default price paid by customer
      if (manualChannel === 'store') {
        setManualPrice((selectedProductObj.fixedPriceStore || 0).toString());
      } else {
        const val = selectedProductObj.pricing?.[manualChannel]?.fee ? 
                    (selectedProductObj.fixedPriceStore || 0) : 0;
        setManualPrice((val || selectedProductObj.fixedPriceStore || 0).toString());
      }
      
      // Default platform fee estimate
      const feePct = getChannelDefaultFeePercent(manualChannel);
      const calculatedFee = ((selectedProductObj.fixedPriceStore || 0) * (feePct / 100));
      setManualFee(calculatedFee.toFixed(2));
    }
  }, [selectedProductId, manualChannel, selectedProductObj]);

  // Handle Manual Sale Add
  const handleAddManualSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Por favor, selecione um produto.');
      return;
    }
    const prod = products.find(p => p.id === selectedProductId);
    const combo = combos.find(c => c.id === selectedProductId);
    
    if (!prod && !combo) return;

    let resolvedName = '';
    if (prod) resolvedName = prod.name;
    if (combo) resolvedName = combo.name;

    const qty = parseInt(manualQty) || 1;
    const pricePaid = parseFloat(manualPrice) || 0;
    const subsidy = parseFloat(manualSubsidy) || 0;
    const coupon = parseFloat(manualCoupon) || 0;
    const channelFee = parseFloat(manualFee) || (pricePaid * (getChannelDefaultFeePercent(manualChannel) / 100));

    const newTransaction: SalesTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: manualDate,
      productId: selectedProductId,
      productName: resolvedName,
      qty,
      channel: manualChannel,
      pricePaidByCustomer: pricePaid,
      platformSubsidy: subsidy,
      couponCostByStore: coupon,
      feePaid: channelFee,
      orderId: manualOrderId.trim() || undefined
    };

    addSalesTransaction(newTransaction);

    // Reset inputs but keep date & channel
    setSelectedProductId('');
    setManualQty('1');
    setManualPrice('');
    setManualSubsidy('0');
    setManualCoupon('0');
    setManualFee('');
    setManualOrderId('');

    // Let Xande celebrate
    const itemCmv = prod ? getProductCMV(prod) : (combo ? getComboCMV(combo) : 0);
    addXandeBotMessage(`Excelente! Registrei a venda de ${qty}x **${resolvedName}** no canal **${manualChannel.toUpperCase()}**. O CMV teórico dos insumos deste item é **R$ ${(itemCmv * qty).toFixed(2)}**.`);
  };

  // Advanced pasted text auto-mapper (recognizes iFood, Saipos tables, TSV, or comma-separated CSV)
  const processImportText = (textContent: string) => {
    if (!textContent.trim()) {
      setImportLog({ success: false, message: 'Nenhum dado encontrado para processar.' });
      return;
    }

    const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setImportLog({ success: false, message: 'Nenhuma linha de texto válida encontrada.' });
      return;
    }

    // Format detection based on first line
    const flLower = lines[0].toLowerCase();
    let formatDetected = 'heuristic';
    let isHeaderLine = false;
    let delimiter = '\t';
    
    if (flLower.includes('produto') && (flLower.includes('local pedido') || flLower.includes('categoria')) && flLower.includes('valor total')) {
      formatDetected = 'format1'; // O formato com Valor Total
      isHeaderLine = true;
      delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
    } else if (flLower.includes('nome do item') && flLower.includes('quantidade') && flLower.includes('preço')) {
      formatDetected = 'ifood';
      isHeaderLine = true;
      delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
    } else if (flLower.includes('nome') && flLower.includes('quantidade') && flLower.includes('preço')) {
      formatDetected = 'simple';
      isHeaderLine = true;
      delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ' ');
    } else {
      // Fallback: check if row 0 has no headers but matches form1 or simple data visually
      const colsTab = lines[0].split('\t');
      if (colsTab.length >= 6 && !isNaN(parseBrOrUsMoney(colsTab[4])) && !isNaN(parseBrOrUsMoney(colsTab[5]))) {
          formatDetected = 'format1'; 
          delimiter = '\t';
      } else {
          // Heuristic fallback
          delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
      }
    }

    const importedTransactions: SalesTransaction[] = [];
    let successCount = 0;
    let failedCount = 0;
    let fallbackCMVCount = 0;

    const startLine = isHeaderLine ? 1 : 0;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      let cols = line.split(delimiter).map(c => c.trim());
      
      // If it's the simple format by spaces without tabs, parse it carefully
      if (formatDetected === 'simple' && delimiter === ' ') {
         const match = line.match(/(.+?)\s+(\d+)\s+([\d.,R$\s]+)$/);
         if (match) {
             cols = [match[1].trim(), match[2], match[3].trim()];
         }
      }
      
      let productName = '';
      let qty = 1;
      let finalUnitPrice = 0;
      let channel: 'ifood' | 'food99' | 'keeta' | 'store' = 'ifood';
      let date = new Date().toISOString().split('T')[0];
      let orderId = '';
      let finalSubsidy = 0;
      let finalCoupon = 0;
      let finalFee = 0;

      if (formatDetected === 'format1') {
          // Produto [0], Categoria [1], Local Pedido [2], Valor Unitário [3], Valor Total [4], Quantidade [5]
          productName = cols[0];
          const rawLocal = (cols[2] || '').toLowerCase();
          if (rawLocal.includes('ifood')) channel = 'ifood';
          else if (rawLocal.includes('99') || rawLocal.includes('food99')) channel = 'food99';
          else if (rawLocal.includes('keeta')) channel = 'keeta';
          else if (rawLocal.includes('delivery') || rawLocal.includes('retirada') || rawLocal.includes('loja')) channel = 'store';
          else channel = 'store';

          const valTotal = parseBrOrUsMoney(cols[4]);
          const parsedQty = parseBrOrUsMoney(cols[5]);
          qty = (!isNaN(parsedQty) && parsedQty > 0) ? parsedQty : 1;
          
          // O total lido já vem da coluna Valor Total e está multiplicado pela quantidade.
          // Para encaixar perfeitamente no motor (que faz base * qty = grossRevenue), calculamos o unitário.
          // Assim o faturamento bruto final baterá EXATAMENTE com a soma da coluna Valor Total.
          finalUnitPrice = !isNaN(valTotal) ? valTotal / qty : 0;
      } 
      else if (formatDetected === 'ifood' || formatDetected === 'simple') {
          // Nome do item [0], Quantidade [1], Preço unitário [2]
          productName = cols[0];
          const parsedQty = parseBrOrUsMoney(cols[1]);
          qty = (!isNaN(parsedQty) && parsedQty > 0) ? parsedQty : 1;
          
          const valUnit = parseBrOrUsMoney(cols[2]);
          finalUnitPrice = !isNaN(valUnit) ? valUnit : 0;
      } 
      else {
          // HEURISTIC / NO-HEADERS PARSE:
          let foundProduct = false;
          for (const p of products) {
            if (line.toLowerCase().includes(p.name.toLowerCase())) {
              productName = p.name;
              foundProduct = true;
              break;
            }
          }
          if (!foundProduct) {
            const alphaCols = cols.filter(c => /[a-zA-Z]/.test(c) && !c.includes('-') && !c.includes('/'));
            productName = alphaCols[0] || 'Item Desconhecido';
          }

          const numCols = cols.map(c => parseBrOrUsMoney(c)).filter(n => !isNaN(n));
          const possibleQty = numCols.find(n => Number.isInteger(n) && n > 0 && n < 50);
          qty = possibleQty || 1;
          const prices = numCols.filter(n => n > 3);
          const pricePaid = prices[prices.length - 1] || 0;
          
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('ifood')) channel = 'ifood';
          else if (lowerLine.includes('99') || lowerLine.includes('food99')) channel = 'food99';
          else if (lowerLine.includes('keeta')) channel = 'keeta';
          else if (lowerLine.includes('loja') || lowerLine.includes('física') || lowerLine.includes('mesa') || lowerLine.includes('balcão')) channel = 'store';
          
          finalUnitPrice = pricePaid;
      }

      if (productName) {
        // Resolve target product link
        let targetProduct: any = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
        let targetCombo: any = null;
        
        if (!targetProduct) {
          targetProduct = products.find(p => 
            productName.toLowerCase().includes(p.name.toLowerCase()) || 
            p.name.toLowerCase().includes(productName.toLowerCase())
          );
        }
        
        if (!targetProduct) {
           const normInputName = normalizeName(productName);
           targetCombo = combos.find(c => normalizeName(c.name) === normInputName);
           if (!targetCombo) {
              targetCombo = combos.find(c => 
                 normInputName.includes(normalizeName(c.name)) || 
                 normalizeName(c.name).includes(normInputName)
              );
           }
        }

        let targetEntity = targetProduct || targetCombo;
        let productId = targetEntity ? targetEntity.id : 'temp_unregistered';
        let resolvedName = targetEntity ? targetEntity.name : productName;

        if (!targetEntity) fallbackCMVCount++;

        
        if (finalFee === 0 && channel !== 'store') {
          finalFee = finalUnitPrice * (getChannelDefaultFeePercent(channel) / 100);
        }

        importedTransactions.push({
          id: Math.random().toString(36).substr(2, 9),
          date,
          productId,
          productName: resolvedName,
          qty,
          channel,
          pricePaidByCustomer: finalUnitPrice,
          platformSubsidy: finalSubsidy,
          couponCostByStore: finalCoupon,
          feePaid: finalFee,
          orderId: orderId || undefined
        });

        successCount++;
      } else {
        failedCount++;
      }
    }

    if (importedTransactions.length > 0) {
      addSalesTransactionsBatch(importedTransactions);
      setImportLog({
        success: true,
        message: `Sucesso! Importamos ${successCount} linhas de venda.${
          fallbackCMVCount > 0 ? ` Nota: ${fallbackCMVCount} produtos não foram encontrados no cadastro de Fichas Técnicas (usaremos média de 30% de CMV para estes itens).` : ''
        }`
      });
      setPasteContent('');

      // Advisory Xande action
      addXandeBotMessage(`Uau! Que massa. Você acabou de subir um relatório de **${successCount} vendas**! Deixa eu analisar a margem geral delas para você. Clique no botão de perguntas rápidas abaixo para debatermos.`);
    } else {
      setImportLog({
        success: false,
        message: 'Não conseguimos identificar nenhuma linha válida de produto ou venda. Certifique-se de que o cabeçalho está correto.'
      });
    }
  };

  const handlePasteImport = () => {
    processImportText(pasteContent);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to tab-separated values
      const tsvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
      
      processImportText(tsvContent);
    } catch (err) {
      setImportLog({ success: false, message: 'Erro ao processar arquivo. Verifique se é uma planilha válida.' });
    }
    
    // Clear input
    e.target.value = '';
  };

  // Automated deduplication engine (iFood vs PDV / duplicated OrderIds)
  const duplicateAnomalies = useMemo(() => {
    const duplicates: Array<{ itemA: SalesTransaction; itemB: SalesTransaction }> = [];
    const hash: Record<string, SalesTransaction> = {};

    salesTransactions.forEach(t => {
      if (t.orderId) {
        // Match strictly by orderId
        if (hash[t.orderId]) {
          duplicates.push({ itemA: hash[t.orderId], itemB: t });
        } else {
          hash[t.orderId] = t;
        }
      } else {
        // Dual-Heuristic fallback: same product, same date, same quantity, price paid, but possibly different channels (e.g. iFood vs PDV Saipos mirroring)
        const key = `${t.date}-${t.productName}-${t.qty}-${t.pricePaidByCustomer.toFixed(1)}`;
        if (hash[key]) {
          // If they came from different channels, and one is 'store' (POS mirror) and other is 'ifood' (original portal tracker)
          const isChannelOverlap = (hash[key].channel === 'store' && t.channel === 'ifood') || 
                                   (hash[key].channel === 'ifood' && t.channel === 'store');
          if (isChannelOverlap) {
            duplicates.push({ itemA: hash[key], itemB: t });
          }
        } else {
          hash[key] = t;
        }
      }
    });

    return duplicates;
  }, [salesTransactions]);

  // Clean duplication list: keeps iFood/original platform, de-duplicates store proxy Mirror entries
  const handleResolveDuplicates = () => {
    if (duplicateAnomalies.length === 0) return;

    // Filter out the "store" channel counterpart when overlap occurs, keeping "ifood"/authentic
    const idsToDelete: string[] = [];
    duplicateAnomalies.forEach(({ itemA, itemB }) => {
      if (itemA.channel === 'store' && itemB.channel !== 'store') {
        idsToDelete.push(itemA.id);
      } else if (itemB.channel === 'store' && itemA.channel !== 'store') {
        idsToDelete.push(itemB.id);
      } else {
        // Fallback: Delete the second repeated ID
        idsToDelete.push(itemB.id);
      }
    });

    idsToDelete.forEach(id => deleteSalesTransaction(id));
    setShowDeduplicateAlert(false);

    addXandeBotMessage(`Prontinho! Removi **${idsToDelete.length} itens duplicados** no seu faturamento para garantir que o seu faturamento real não fique inflado de forma incorreta.`);
  };

  // Sales aggregates & derived metrics
  const coreStats = useMemo(() => {
    let grossRevenue = 0;
    let netRevenue = 0;
    let totalCmv = 0;
    let totalCfiCost = 0;
    let salesCount = 0;

    salesTransactions.forEach(t => {
      const prod = products.find(p => p.id === t.productId);
      const isUnregistered = t.productId === 'temp_unregistered';
      
      // CMV (ingredients cost) calculation
      let itemCmvUnit = 0;
      if (isUnregistered) {
        // Estimate a standard safe 32% CMV for unregistered fast entries
        itemCmvUnit = (t.pricePaidByCustomer) * 0.32;
      } else if (prod) {
        itemCmvUnit = getProductCMV(prod);
      } else {
        const combo = combos.find(c => c.id === t.productId);
        if (combo) {
           itemCmvUnit = getComboCMV(combo);
        } else {
           itemCmvUnit = (t.pricePaidByCustomer) * 0.32;
        }
      }
      
      const itemTotalCmv = itemCmvUnit * t.qty;

      // Real received revenue calculation
      // Customers pays R$ 10. iFood subsidizes R$ 5 (CI). Channel comission takes R$ 2. Store paid coupon takes R$ 1.
      // Net Received = Price Paid by Customer + Subsidiary/CI - Cost of Store Coupon - Platform Fee
      const finalGrossPaidValue = t.pricePaidByCustomer + t.platformSubsidy;
      const netReceivedValue = finalGrossPaidValue - t.couponCostByStore - t.feePaid;

      // CFI portion (Indirect fixed costs loaded dynamically)
      // CFI percent is applied over the net received sales base
      const itemCfiCost = netReceivedValue * (totalCfiPercent / 100);

      // Profit/Loss per item
      const itemNetProfit = netReceivedValue - itemTotalCmv - itemCfiCost;

      grossRevenue += (finalGrossPaidValue * t.qty);
      netRevenue += (netReceivedValue * t.qty);
      totalCmv += itemTotalCmv;
      totalCfiCost += (itemCfiCost * t.qty);
      salesCount += t.qty;
    });

    // O Lucro Líquido Real deve ser simplesmente: Faturamento Bruto menos CMV de Insumos menos CFI Integrado
    const profitLoss = grossRevenue - totalCmv - totalCfiCost;

    const profitMargin = netRevenue > 0 ? (profitLoss / netRevenue) * 100 : 0;

    return {
      grossRevenue,
      netRevenue,
      totalCmv,
      totalCfiCost,
      profitLoss,
      salesCount,
      profitMargin
    };
  }, [salesTransactions, products, getProductCMV, totalCfiPercent]);

  // Alerta de itens com prejuízo bruto
  const deficitSales = useMemo(() => {
    return salesTransactions.filter(t => {
      const prod = products.find(p => p.id === t.productId);
      const isUnregistered = t.productId === 'temp_unregistered';
      
      let itemCmv = 0;
      if (prod) {
        itemCmv = getProductCMV(prod);
      } else {
        const combo = combos.find(c => c.id === t.productId);
        if (combo) {
          itemCmv = getComboCMV(combo);
        } else {
          itemCmv = t.pricePaidByCustomer * 0.32;
        }
      }
      
      const netReceivedUnit = (t.pricePaidByCustomer + t.platformSubsidy) - t.couponCostByStore - t.feePaid;
      return netReceivedUnit < itemCmv;
    });
  }, [salesTransactions, products, combos, getProductCMV, getComboCMV]);

  // Xande internal responses (dynamic simulation or real Gemini call)
  const addXandeBotMessage = (text: string) => {
    setXandeChatMessages(prev => [...prev, { role: 'model', text }]);
  };

  const handleSendXandeConsultation = async (textToSend: string = xandeInput) => {
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user' as const, text: textToSend };
    setXandeChatMessages(prev => [...prev, userMsg]);
    setXandeInput('');
    setIsXandeLoading(true);

    try {
      // Compose dedicated system instructions featuring current sales state
      const salesOverviewContext = `
      Você é o Xande, consultor do Lucro Fácil. O usuário está na tela de "Integrar Vendas".
      NÚMEROS DA LOJA ATUALIZADOS NESTA SESSÃO:
      - Vendas importadas: ${salesTransactions.length} pedidos.
      - Faturamento Bruto: R$ ${coreStats.grossRevenue.toFixed(2)}
      - Faturamento Líquido (Recebido): R$ ${coreStats.netRevenue.toFixed(2)}
      - CMV de Insumos: R$ ${coreStats.totalCmv.toFixed(2)} (${formatPercent(coreStats.netRevenue > 0 ? (coreStats.totalCmv / coreStats.netRevenue) * 100 : 0)} do faturamento)
      - Custos Indiretos (CFI %): ${formatPercent(totalCfiPercent)}
      - Custos CFI calculados: R$ ${coreStats.totalCfiCost.toFixed(2)}
      - Lucro Líquido Real Consolidado: R$ ${coreStats.profitLoss.toFixed(2)}
      - Itens em prejuízo: ${deficitSales.length} itens.
      
      Sua missão é dar um conselho focado em resolver as dúvidas do usuário de forma brasileira, prática, focada em resolver o problema do CMV ou margem, incentivando o uso das "4 Listas" e "Oferta Salva Margem" (para itens de prejuízo). Responda em no máximo 3 parágrafos curtos.
      `;

      // Format previous chat history along with the new user message
      const historyContext = xandeChatMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'Você (Xande)'}: ${m.text}`).join('\n');
      const fullPrompt = historyContext + '\nUsuário: ' + textToSend + '\nVocê (Xande):';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: salesOverviewContext,
          fullPrompt: fullPrompt
        })
      });

      if (!response.ok) {
        throw new Error('Erro na API do chat. Configure a chave no servidor.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let answerText = '';
      
      if (reader) {
        // Add a temporary empty message that will be streamed into
        setXandeChatMessages(prev => {
          const newMessages = [...prev];
          newMessages.push({ role: 'model', text: '' });
          return newMessages;
        });

        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            answerText += chunk;
            
            // Update the last message in state with the new chunk
            setXandeChatMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].text = answerText;
              return newMessages;
            });
          }
        }
      } else {
        throw new Error('No body returned from stream');
      }

    } catch (error) {
      console.error(error);
      // Rules-based fallback if offline / key issues
      setTimeout(() => {
        if (textToSend.toLowerCase().includes('duplicad') || textToSend.toLowerCase().includes('pdv')) {
          addXandeBotMessage("Se você importa as vendas do iFood e também seu relatório do PDV (como Saipos ou Consumer), as mesmas vendas do iFood vão aparecer duplicadas! Para evitar isso, eu criei uma rotina de limpeza do sistema. Ali em cima tem um alerta azul onde você clica e eu limpo as duplicidades em 1 segundo!");
        } else if (textToSend.toLowerCase().includes('campanha') || textToSend.toLowerCase().includes('inteligente')) {
          addXandeBotMessage("A **Campanha Inteligente (CI)** do iFood funciona com subsídio parcial. Se o iFood vende o seu produto promocionado por **R$ 0,99**, mas te reembolsa **R$ 5,00**, para a sua loja a venda valeu **R$ 5,99**! Se você colocar no sistema apenas os R$ 0,99, seu lucro vai dar prejuízo. Use o campo 'Subsídio' no lançamento manual ou na planilha para que eu some esse extra na receita do produto!");
        } else if (textToSend.toLowerCase().includes('prejuízo') || textToSend.toLowerCase().includes('lucro')) {
          addXandeBotMessage("Quando seu faturamento líquido desconta o CMV de insumo e a sua taxa de CFI da hamburgueria e fica negativo, o item está sugando o seu caixa (Campeão Magro). A melhor tática é combinar esse item em uma **Oferta Salva Margem** com um Produto Turbinado (fritas, refrigerante ou acompanhamento com mais de 70% de lucro), puxando seu ticket e cobrindo os custos!");
        } else {
          addXandeBotMessage("Entendi, meu patrão. Na área de alimentação, o controle do centavo faz a diferença. Me passa mais detalhes sobre sua precificação ou canais de venda que eu te oriento!");
        }
      }, 800);
    } finally {
      setIsXandeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1e293b]/50 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-brand-red animate-pulse" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">INTEGRAR VENDAS</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Importe planilhas ou adicione pedidos para calcular o lucro líquido real de cada transação, integrado com CMV e CFI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Info className="h-4 w-4" />
            {showHelp ? 'Ocultar Ajuda' : 'Ver Ajuda'}
          </button>
          {salesTransactions.length > 0 && (
            <button 
              onClick={() => {
                if(window.confirm('Quer limpar TODAS as vendas integradas para começar do zero?')) clearSalesTransactions();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 hover:bg-red-100 dark:hover:bg-red-900/30 transition shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Vendas
            </button>
          )}
        </div>
      </div>

      {/* Help Banner if open */}
      {showHelp && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-gradient-to-r from-red-50/50 to-amber-50/50 dark:from-red-950/10 dark:to-orange-950/10 p-5 rounded-2xl border border-red-200/40 dark:border-red-900/40 text-gray-700 dark:text-gray-300">
          <div className="space-y-2">
            <span className="text-xs font-bold bg-amber-100 dark:bg-yellow-950/50 text-amber-800 dark:text-yellow-400 px-2 py-0.5 rounded border border-amber-200/50">iFood & PDV</span>
            <h3 className="font-extrabold text-sm dark:text-white uppercase">Duplicidade de Vendas</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Muitas vezes o PDV (Saipos/Consumer) registra o pedido do iFood de forma espelhada. Ao colocar os dois relatórios, as vendas duplicam automaticamente. O sistema ajuda a remover duplicados.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 px-2 py-0.5 rounded border border-red-200/50">Campanha Reembolsada</span>
            <h3 className="font-extrabold text-sm dark:text-white uppercase">Promoção iFood Reembolsada</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Na **Campanha Inteligente (CI)** do iFood, se o cliente comprou por R$ 0,99 e o iFood subsidia R$ 5,00, some o subsídio na receita! Sem subsídio, o sistema interpretará como prejuízo gritante.
            </p>
          </div>
          <div className="space-y-2 col-span-1 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200/50 dark:border-gray-800/50 pt-3 lg:pt-0 lg:pl-4 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-brand-red font-black text-sm uppercase">
              <Sparkles className="h-4 w-4" /> Margem Metodologia CFI
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              O lucro líquido do pedido nesta tela desconta a taxa do canal, o CMV real de insumos da Ficha Técnica e o **CFI em % de Custos Indiretos** configurados em sua loja (atualmente em: <span className="font-bold text-gray-700 dark:text-white bg-gray-100 dark:bg-gray-800 px-1 rounded">{formatPercent(totalCfiPercent)}</span>).
            </p>
          </div>
        </div>
      )}

      {/* Anomalies, auditing & auto-resolutions alerts */}
      {salesTransactions.length > 0 && (
        <div className="space-y-3">
          {duplicateAnomalies.length > 0 && showDeduplicateAlert && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/50 p-4 rounded-xl gap-3">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300">Pedidos Duplicados Detectados ({duplicateAnomalies.length} redundâncias)</h4>
                  <p className="text-xs text-blue-600/90 dark:text-blue-400/95 mt-0.5">
                    ID de pedidos idênticos ou produtos com quantidades e valores iguais no mesmo período foram encontrados entre o PDV e os canais do marketplace.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleResolveDuplicates}
                className="px-4 py-1.5 text-xs font-black bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow transition whitespace-nowrap uppercase tracking-wider"
              >
                Limpar Duplicados (Recomendado)
              </button>
            </div>
          )}

          {deficitSales.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between bg-red-50/50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/40 p-4 rounded-xl gap-3 items-start md:items-center">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-red-800 dark:text-red-300">Vendas com Prejuízo Bruto ({deficitSales.length} itens do relatório)</h4>
                  <p className="text-xs text-red-600/90 dark:text-red-400/95 mt-0.5">
                    Identificamos itens cujo valor líquido recebido após taxas de canais e cupons é **menor que o CMV de insumos** cadastrados na Ficha Técnica.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const itemsStr = deficitSales.map(t => t.productName).slice(0, 3).join(', ');
                  setXandeInput(`Como posso recuperar a margem de itens em prejuízo como: ${itemsStr}?`);
                  const chatBox = document.getElementById('xande-chat-section');
                  if (chatBox) chatBox.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-1.5 text-xs font-black bg-red-600 text-white hover:bg-red-700 rounded-lg shadow transition whitespace-nowrap uppercase tracking-wider"
              >
                Como Corrigir Margem?
              </button>
            </div>
          )}
        </div>
      )}

      {/* Consolidated Profit statistics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e293b]/40 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800/80">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Faturamento Bruto</span>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-2xl font-black text-gray-900 dark:text-white font-mono">
              {formatMoney(coreStats.grossRevenue)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Pago pelos Clientes</p>
        </div>

        <div className="bg-white dark:bg-[#1e293b]/40 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800/80">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">CMV de Insumos</span>
            <Calculator className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatMoney(coreStats.totalCmv)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
            Gasto c/ Ingredientes ({coreStats.netRevenue > 0 ? ((coreStats.totalCmv / coreStats.netRevenue) * 100).toFixed(1) : 0}%)
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e293b]/40 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800/80">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">CFI Integrado</span>
            <RefreshCw className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatMoney(coreStats.totalCfiCost)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
            Indiretos Fixos ({formatPercent(totalCfiPercent)})
          </p>
        </div>

        <div className={`p-5 rounded-2xl shadow-sm border ${
          coreStats.profitLoss >= 0 
            ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50' 
            : 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/50'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Lucro Líquido Real</span>
            {coreStats.profitLoss >= 0 ? (
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="mt-2">
            <span className={`text-lg md:text-2xl font-black font-mono ${
              coreStats.profitLoss >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {formatMoney(coreStats.profitLoss)}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-black">
            Margem Real: {coreStats.profitMargin.toFixed(1)}% {coreStats.profitMargin > 15 ? '🔥 SAUDÁVEL' : '⚠️ AJUSTAR'}
          </p>
        </div>
      </div>

      {/* Main interactive tabs & forms container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-7 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div className="flex border-b border-gray-200 dark:border-gray-800 pb-2">
            <button 
              onClick={() => { setActiveSubTab('paste'); setImportLog(null); }}
              className={`pb-2 px-4 text-sm font-black transition tracking-wider uppercase ${
                activeSubTab === 'paste' 
                  ? 'border-b-2 border-brand-red text-brand-red' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            >
              Copiar & Colar Planilha
            </button>
            <button 
              onClick={() => { setActiveSubTab('file'); setImportLog(null); }}
              className={`pb-2 px-4 text-sm font-black transition tracking-wider uppercase ${
                activeSubTab === 'file' 
                  ? 'border-b-2 border-brand-red text-brand-red' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            >
              Importar Arquivo
            </button>
            <button 
              onClick={() => { setActiveSubTab('manual'); setImportLog(null); }}
              className={`pb-2 px-4 text-sm font-black transition tracking-wider uppercase ${
                activeSubTab === 'manual' 
                  ? 'border-b-2 border-brand-red text-brand-red' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            >
              Lançamento Manual
            </button>
          </div>

          {/* Tab 1: Pasted Spreadsheets */}
          {activeSubTab === 'paste' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-[#1a2333]/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                <span className="font-bold text-gray-700 dark:text-white block mb-1 uppercase tracking-wide">Como copiar/colar suas vendas do Saipos, iFood ou Excel:</span>
                <ol className="list-decimal pl-4 text-gray-500 dark:text-gray-400 space-y-1">
                  <li>Abra o relatório de vendas diárias ou mensais no seu PDV ou no painel do iFood.</li>
                  <li>Selecione as colunas com o mouse e copie normalmente (Ctrl + C).</li>
                  <li>Cole no campo de texto abaixo e clique em <span className="font-bold text-brand-red">Processar Vendas</span>. O sistema mapeia os nomes de produtos e calcula taxas estimadas automaticamente. Cabeçalhos ideais: <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded font-mono text-[10px]">Produto, Qtd, Preço, Canal, ID Pedido</code>.</li>
                </ol>
              </div>

              <div>
                <textarea 
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  rows={6}
                  placeholder={`Cole suas linhas de venda aqui...
Por Exemplo:
Hambúrguer Big Carreiro	2	35.00	iFood	pedido-1234
Batata Frita	1	12.00	iFood	pedido-1234
Guaraná Lata	1	6.00	Loja Física	pedido-5555`}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 text-xs outline-none focus:border-brand-red font-mono"
                />
              </div>

              {importLog && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed font-bold ${
                  importLog.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50' 
                    : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/50'
                }`}>
                  {importLog.message}
                </div>
              )}

              <button 
                onClick={handlePasteImport}
                className="w-full py-2.5 bg-brand-red hover:bg-red-700 text-white font-black hover:shadow-lg rounded-xl transition text-xs uppercase tracking-widest flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Processar Vendas da Planilha
              </button>
            </div>
          )}

          {/* Tab 3: File Upload */}
          {activeSubTab === 'file' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-50 dark:bg-[#1a2333]/40 p-8 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-center flex flex-col items-center justify-center">
                <FileText className="h-12 w-12 text-gray-400 mb-3" />
                <span className="font-bold text-gray-700 dark:text-white block mb-1 uppercase tracking-wider text-sm">Importar Planilha</span>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                  Arraste e solte ou selecione seu relatório de vendas. O sistema detecta automaticamente o formato (<span className="font-semibold text-gray-600 dark:text-gray-300">.xlsx, .xls, .csv</span>).
                </p>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="bg-brand-red hover:bg-red-700 text-white font-black px-6 py-2.5 rounded-xl transition text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm pointer-events-none">
                    <Upload className="h-4 w-4" />
                    Selecionar Arquivo
                  </div>
                </div>
              </div>

              {importLog && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed font-bold ${
                  importLog.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50' 
                    : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/50'
                }`}>
                  {importLog.message}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Manual Sale form */}
          {activeSubTab === 'manual' && (
            <form onSubmit={handleAddManualSale} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Selecione o Produto</label>
                  <select 
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red"
                  >
                    <option value="">-- Selecione o Produto ou Combo --</option>
                    <optgroup label="Produtos Individuais">
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (CMV Insumo: R$ {getProductCMV(p).toFixed(2)})</option>
                      ))}
                    </optgroup>
                    {combos && combos.length > 0 && (
                      <optgroup label="Combos">
                        {combos.map(c => (
                          <option key={c.id} value={c.id}>{c.name} (CMV Insumo: R$ {getComboCMV(c).toFixed(2)})</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Canal de Venda</label>
                  <select 
                    value={manualChannel}
                    onChange={(e) => setManualChannel(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red font-bold"
                  >
                    <option value="ifood">iFood Marketplace</option>
                    <option value="food99">99Food / Keeta</option>
                    <option value="keeta">Keeta</option>
                    <option value="store">Loja Física / WhatsApp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Quantidade</label>
                  <input 
                    type="number" 
                    min="1"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Valor Unitário Pago</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs text-[10px] font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                    Subsídio Campanha
                    <span className="group relative text-gray-400 cursor-pointer">
                      <HelpCircle className="h-3 w-3" />
                      <span className="pointer-events-none absolute left-1/2 bottom-full mb-1 w-48 -translate-x-1/2 bg-gray-800 text-white rounded p-1.5 text-[9px] font-normal leading-tight opacity-0 transition group-hover:opacity-100 shadow">
                        No iFood CI subsidiado, insira o quanto iFood reembolsou no item.
                      </span>
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs text-[10px] font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={manualSubsidy}
                      onChange={(e) => setManualSubsidy(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Taxas Canal (Total)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs text-[10px] font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={manualFee}
                      onChange={(e) => setManualFee(e.target.value)}
                      placeholder="Calculada"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Cupom Hamburgueria</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs text-[10px] font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={manualCoupon}
                      onChange={(e) => setManualCoupon(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-950 dark:text-white rounded-lg pl-8 p-2 text-xs outline-none focus:border-brand-red font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Cód. Pedido / ID</label>
                  <input 
                    type="text" 
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    placeholder="Ex: #4402"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data da Venda</label>
                  <input 
                    type="date" 
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black hover:shadow-lg rounded-xl transition text-xs uppercase tracking-widest flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Lançar Pedido Manualmente
              </button>
            </form>
          )}
        </div>

        {/* Xande embedded chat module */}
        <div id="xande-chat-section" className="col-span-1 lg:col-span-5 bg-gradient-to-br from-[#1e293b] to-[#111827] text-white rounded-2xl shadow-sm border border-gray-800 p-5 flex flex-col h-[480px]">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-gray-900" />
                <div className="bg-brand-red h-8 w-8 rounded-full flex items-center justify-center text-xs font-black select-none tracking-tighter">
                  XANDE
                </div>
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider">CONSULTORIA COM XANDE</h4>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight flex items-center gap-1">
                  <span className="animate-ping h-1 w-1 bg-emerald-400 rounded-full" /> No Ar • IA Especialista
                </p>
              </div>
            </div>
            <div className="opacity-40">
              <Sparkles className="h-4 w-4 text-brand-red" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 my-3 pr-1 text-xs">
            {xandeChatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-brand-red text-white rounded-tr-none font-bold' 
                    : 'bg-gray-800/80 text-gray-200 rounded-tl-none border border-gray-700/50'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isXandeLoading && (
              <div className="flex justify-start">
                <div className="p-3 bg-gray-800/80 text-gray-400 rounded-2xl rounded-tl-none border border-gray-700/50 flex items-center gap-1.5 font-bold">
                  <RefreshCw className="h-3 w-3 animate-spin text-brand-red" />
                  Xande está analisando os dados...
                </div>
              </div>
            )}
          </div>

          {/* Quick Shortcuts questions */}
          <div className="border-t border-gray-800/80 pt-2 pb-2 flex flex-wrap gap-1">
            <button 
              onClick={() => handleSendXandeConsultation('Por que minhas vendas importadas estão dando prejuízo?')}
              className="text-[10px] font-bold bg-gray-800 hover:bg-gray-700 transition px-2 py-1 rounded text-gray-300 border border-gray-700/40"
            >
              ❓ CMV de Prejuízo
            </button>
            <button 
              onClick={() => handleSendXandeConsultation('Como funciona a Campanha Inteligente do iFood no cálculo de lucro?')}
              className="text-[10px] font-bold bg-gray-800 hover:bg-gray-700 transition px-2 py-1 rounded text-gray-300 border border-gray-700/40"
            >
              💰 Campanha iFood
            </button>
            <button 
              onClick={() => handleSendXandeConsultation('Minhas vendas estão duplicando entre o Saipos e o iFood. O que eu faço?')}
              className="text-[10px] font-bold bg-gray-800 hover:bg-gray-700 transition px-2 py-1 rounded text-gray-300 border border-gray-700/40"
            >
              🔄 Duplicados do PDV
            </button>
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendXandeConsultation(); }}
            className="flex gap-2"
          >
            <input 
              type="text"
              value={xandeInput}
              onChange={(e) => setXandeInput(e.target.value)}
              placeholder="Pergunte ao Xande sobre suas vendas..."
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-brand-red font-bold"
            />
            <button 
              type="submit"
              className="bg-brand-red hover:bg-red-700 text-white rounded-xl p-2 transition flex items-center justify-center shrink-0"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Grid of Imported Sales list */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/35">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Histórico de Pedidos Integrados ({salesTransactions.length} registros)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Auditoria detalhada com receita líquida recebida, CMV correspondente e lucro de cada item.</p>
          </div>
        </div>

        {salesTransactions.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-800 dark:text-gray-200 uppercase">Nenhum pedido integrado ainda</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">Cole dados de planilhas do iFood / Saipos ou preencha o formulário manual ao lado para visualizar a margem líquida real de suas vendas!</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-gray-400 text-[10px] uppercase font-black tracking-wider border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-center">Nº</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-center">Canal</th>
                  <th className="px-4 py-3 text-center">Data</th>
                  <th className="px-4 py-3 text-right">Fat. Bruto</th>
                  <th className="px-4 py-3 text-right">Taxas/Cump.</th>
                  <th className="px-4 py-3 text-right">CMV Insumos</th>
                  <th className="px-4 py-3 text-right">CFI ({totalCfiPercent.toFixed(1)}%)</th>
                  <th className="px-4 py-3 text-right">Lucro Real</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {salesTransactions.map((t, idx) => {
                  const prod = products.find(p => p.id === t.productId);
                  const isUnregistered = t.productId === 'temp_unregistered';
                  
                  // Insumos Cost
                  let itemCmv = 0;
                  if (prod) {
                    itemCmv = getProductCMV(prod);
                  } else {
                    const combo = combos.find(c => c.id === t.productId);
                    if (combo) {
                      itemCmv = getComboCMV(combo);
                    } else {
                      itemCmv = t.pricePaidByCustomer * 0.32;
                    }
                  }
                  const totalCmvVal = itemCmv * t.qty;

                  // Revenues
                  const customerGrossPaid = t.pricePaidByCustomer + t.platformSubsidy;
                  const finalReceivedNet = customerGrossPaid - t.couponCostByStore - t.feePaid;
                  
                  // CFI portion
                  const itemCfiPortion = finalReceivedNet * (totalCfiPercent / 100);

                  // True profit
                  const netProfitValue = finalReceivedNet - itemCmv - itemCfiPortion;
                  const itemProfitSum = netProfitValue * t.qty;

                  let channelBadge = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
                  if (t.channel === 'ifood') channelBadge = 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold border border-red-200/20';
                  else if (t.channel === 'food99') channelBadge = 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold border border-amber-200/20';
                  else if (t.channel === 'keeta') channelBadge = 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-200/20';
                  else if (t.channel === 'store') channelBadge = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/20';

                  return (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="px-4 py-3 text-center font-mono text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-extrabold text-gray-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          {t.productName} 
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            {t.qty}x
                          </span>
                          {isUnregistered && (
                            <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wide">
                              S/ Ficha Técnica
                            </span>
                          )}
                          {t.orderId && (
                            <span className="text-[9px] font-mono text-gray-400 font-bold">
                              {t.orderId}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded ${channelBadge}`}>
                          {t.channel === 'store' ? 'Loja/PDV' : t.channel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 font-mono">
                        {t.date.split('-').reverse().join('/')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white font-mono">
                        {formatMoney(customerGrossPaid * t.qty)}
                        {t.platformSubsidy > 0 && (
                          <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black">+ subsídio R$ {t.platformSubsidy.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 font-mono">
                        - {formatMoney((t.feePaid + t.couponCostByStore) * t.qty)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 font-mono">
                        {formatMoney(totalCmvVal)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 font-mono">
                        {formatMoney(itemCfiPortion * t.qty)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <div className={`font-black ${itemProfitSum >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatMoney(itemProfitSum)}
                        </div>
                        <div className="text-[8px] font-black uppercase text-gray-400">
                          {itemProfitSum >= 0 ? 'OK' : 'PREJUÍZO'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => deleteSalesTransaction(t.id)}
                          className="p-1 px-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesImport;
