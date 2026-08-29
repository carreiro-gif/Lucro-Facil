import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { Product, Combo, Ingredient, Expense, MonthlyData, CfiConfig, PlatformConfig, MenuCategory, SalesTransaction } from '../types';

// Formatters
export const formatCurrency = (val: number): string => {
  if (isNaN(val) || val === null || val === undefined) return 'R$ 0,00';
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPct = (val: number): string => {
  if (isNaN(val) || val === null || val === undefined) return '0,00%';
  return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

export const sanitizeFileName = (storeName: string, screenName: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const cleanStore = (storeName || 'Loja')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_');

  const cleanScreen = (screenName || 'Relatorio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_');

  return `${cleanStore}-${cleanScreen}-${dateStr}.pdf`;
};

// Common header & footer drawer
const drawDocumentHeader = (
  doc: jsPDF, 
  title: string, 
  storeName: string, 
  extraInfo?: string[]
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background bar in dark blue #1A1A2E
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pageWidth, 28, 'F');
  
  // Brand name in Gold #F5B913
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(245, 185, 19);
  doc.text('CARDÁPIO BLINDADO', 14, 12);
  
  // Store name in White #FFFFFF
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Estabelecimento: ${storeName || 'Minha Loja'}`, 14, 20);

  // Screen Title & Date/Time on the right
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), pageWidth - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 210);
  doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth - 14, 20, { align: 'right' });

  // Optional Extra Info bar below header
  let startY = 34;
  if (extraInfo && extraInfo.length > 0) {
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, startY, pageWidth - 28, 7 * extraInfo.length + 3, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);

    extraInfo.forEach((info, idx) => {
      doc.text(info, 18, startY + 6 + (idx * 7));
    });

    startY += (7 * extraInfo.length + 8);
  }

  return startY;
};

// Common pagination and footer
const applyFooters = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Thin divider line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Cardápio Blindado • Gestão Financeira Inteligente', 14, pageHeight - 7);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
};

// 1. RELATÓRIO DE PREÇO DE VENDA
export const exportPricingReport = (params: {
  storeName: string;
  cfiTotal: number;
  menuCategories: MenuCategory[];
  products: Product[];
  getProductCMV: (prod: Product) => number;
}) => {
  const { storeName, cfiTotal, menuCategories, products, getProductCMV } = params;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  const startY = drawDocumentHeader(
    doc, 
    'Relatório de Preço de Venda', 
    storeName,
    [`CFI Total da Empresa (Custos Fixos + Custos Variáveis): ${formatPct(cfiTotal)}`]
  );

  // Categories and grouping
  const sortedCategories = [...(menuCategories || [])].sort((a, b) => a.order - b.order);
  const groups: Record<string, Product[]> = {};
  sortedCategories.forEach(cat => { groups[cat.name] = []; });
  groups['Sem Categoria'] = [];

  (products || []).forEach(p => {
    const resolvedCat = groups[p.category] 
      ? p.category 
      : (sortedCategories.find(c => c.id === p.category)?.name || 'Sem Categoria');
    if (groups[resolvedCat]) groups[resolvedCat].push(p);
    else groups['Sem Categoria'].push(p);
  });

  const tableBody: any[] = [];

  const calculateStorePrice = (cmv: number, profitMargin: number) => {
    const totalDeductions = (cfiTotal + profitMargin) / 100;
    if (totalDeductions >= 1) return 0;
    return cmv / (1 - totalDeductions);
  };

  const calculateMarketplacePrice = (pvLoja: number, feesPct: number, delivery: number, ci: number, coupon: number) => {
    const denominator = 1 - (feesPct / 100);
    if (denominator <= 0) return 0;
    return (pvLoja + delivery + ci + coupon) / denominator;
  };

  const catNames = [...sortedCategories.map(c => c.name), 'Sem Categoria'];

  catNames.forEach(catName => {
    const groupProds = groups[catName] || [];
    if (groupProds.length === 0) return;

    // Category Header Row spanning all columns
    tableBody.push([
      { 
        content: `📂 ${catName.toUpperCase()} (${groupProds.length} ${groupProds.length === 1 ? 'item' : 'itens'})`, 
        colSpan: 25, 
        styles: { 
          fillColor: [230, 235, 245], 
          textColor: [26, 26, 46], 
          fontStyle: 'bold', 
          fontSize: 7.5,
          halign: 'left'
        } 
      }
    ]);

    groupProds.forEach(prod => {
      const cmv = getProductCMV(prod);
      const margin = prod.pricing?.profitMargin !== undefined ? prod.pricing.profitMargin : 20;
      const pvLoja = calculateStorePrice(cmv, margin);

      // iFood
      const ifoodFee = prod.pricing?.ifood?.fee ?? 12;
      const ifoodOnline = prod.pricing?.ifood?.onlinePayment ?? 3.2;
      const ifoodAntec = prod.pricing?.ifood?.anticipation ?? 2;
      const ifoodDelivery = prod.pricing?.ifood?.delivery ?? 0;
      const ifoodCoupon = prod.pricing?.ifood?.coupon ?? 0;
      const ifoodCI = prod.pricing?.ifood?.ciValue ?? 0;
      const ifoodTotalFee = ifoodFee + ifoodOnline + ifoodAntec;
      const pvIfood = calculateMarketplacePrice(pvLoja, ifoodTotalFee, ifoodDelivery, 0, ifoodCoupon);
      const pvCI = calculateMarketplacePrice(pvLoja, ifoodTotalFee, ifoodDelivery, ifoodCI, ifoodCoupon);

      // 99Food
      const food99Fee = prod.pricing?.food99?.fee ?? 12;
      const food99Online = prod.pricing?.food99?.onlinePayment ?? 3.2;
      const food99Delivery = prod.pricing?.food99?.delivery ?? 0;
      const food99Antec = prod.pricing?.food99?.anticipation ?? 1.9;
      const food99Coupon = prod.pricing?.food99?.coupon ?? 0;
      const food99TotalFee = food99Fee + food99Online + food99Antec;
      const pvFood99 = calculateMarketplacePrice(pvLoja, food99TotalFee, food99Delivery, 0, food99Coupon);

      // Keeta
      const keetaFee = prod.pricing?.keeta?.fee ?? 12;
      const keetaOnline = prod.pricing?.keeta?.onlinePayment ?? 3.2;
      const keetaDelivery = prod.pricing?.keeta?.delivery ?? 0;
      const keetaAntec = prod.pricing?.keeta?.anticipation ?? 0;
      const keetaCoupon = prod.pricing?.keeta?.coupon ?? 0;
      const keetaTotalFee = keetaFee + keetaOnline + keetaAntec;
      const pvKeeta = calculateMarketplacePrice(pvLoja, keetaTotalFee, keetaDelivery, 0, keetaCoupon);

      tableBody.push([
        prod.name,
        formatCurrency(cmv),
        formatPct(cfiTotal),
        formatPct(margin),
        formatCurrency(pvLoja),
        // iFood
        formatPct(ifoodFee),
        formatPct(ifoodOnline),
        formatPct(ifoodAntec),
        formatCurrency(ifoodDelivery),
        formatCurrency(ifoodCoupon),
        formatCurrency(pvIfood),
        formatCurrency(ifoodCI),
        formatCurrency(pvCI),
        // 99Food
        formatPct(food99Fee),
        formatPct(food99Online),
        formatCurrency(food99Delivery),
        formatPct(food99Antec),
        formatCurrency(food99Coupon),
        formatCurrency(pvFood99),
        // Keeta
        formatPct(keetaFee),
        formatPct(keetaOnline),
        formatCurrency(keetaDelivery),
        formatPct(keetaAntec),
        formatCurrency(keetaCoupon),
        formatCurrency(pvKeeta),
      ]);
    });
  });

  autoTable(doc, {
    startY: startY,
    head: [[
      { content: 'Produto', styles: { halign: 'left' } },
      'CMV+Emb', 'CFI %', 'Lucro %', 'PV Loja',
      'iFood %', 'Online %', 'Antec. %', 'Entr. R$', 'Cup. R$', 'PV iFood', 'CI R$', 'PV CI',
      '99 %', 'Online %', 'Entr. R$', 'Antec. %', 'Cup. R$', 'PV 99',
      'Keeta %', 'Online %', 'Entr. R$', 'Antec. %', 'Cup. R$', 'PV Keeta'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 5.5,
      cellPadding: 1.2,
      textColor: [31, 41, 55],
      lineColor: [220, 225, 230],
      lineWidth: 0.2,
      halign: 'center'
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 5.5,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252]
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 28 },
      4: { fontStyle: 'bold', fillColor: [240, 244, 255] },
      10: { fontStyle: 'bold', textColor: [180, 20, 20] },
      12: { fontStyle: 'bold', textColor: [120, 20, 150] },
      18: { fontStyle: 'bold', textColor: [150, 100, 0] },
      24: { fontStyle: 'bold', textColor: [20, 120, 30] }
    },
    margin: { left: 10, right: 10, bottom: 16 }
  });

  applyFooters(doc);
  doc.save(sanitizeFileName(storeName, 'Preco_de_Venda'));
};

// 2. RELATÓRIO DE LUCRO ATUAL
export const exportProfitReport = (params: {
  storeName: string;
  totalCfiPercent: number;
  menuCategories: MenuCategory[];
  products: Product[];
  combos: Combo[];
  getProductCMV: (prod: Product) => number;
}) => {
  const { storeName, totalCfiPercent, menuCategories, products, combos, getProductCMV } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const startY = drawDocumentHeader(
    doc,
    'Relatório de Lucro Atual',
    storeName,
    [`CFI Total Integrado: ${formatPct(totalCfiPercent)} • Análise de Rentabilidade Real e Preços Praticados`]
  );

  const getComboCMV = (combo: Combo) => {
    let cmvCombo = 0;
    const itemCosts: number[] = [];
    (combo.items || []).forEach(item => {
      const prod = (products || []).find(p => p.id === item.productId);
      itemCosts.push(prod ? getProductCMV(prod) * item.quantity : 0);
    });

    if (combo.type === 'free_choice') {
      const sortedCosts = [...itemCosts].sort((a, b) => b - a);
      const freeChoiceCount = combo.freeChoiceCount || 2;
      cmvCombo = sortedCosts.slice(0, freeChoiceCount).reduce((acc, val) => acc + val, 0);
    } else {
      cmvCombo = itemCosts.reduce((acc, val) => acc + val, 0);
    }
    cmvCombo += (combo.customPackagingCost || 0);
    return cmvCombo;
  };

  const getProductSuggestedPrice = (product: Product) => {
    const cmv = getProductCMV(product);
    const margin = product.pricing?.profitMargin !== undefined ? product.pricing.profitMargin : 20;
    const totalDeductions = (totalCfiPercent + margin) / 100;
    if (totalDeductions >= 1) return 0;
    return cmv / (1 - totalDeductions);
  };

  const getComboSuggestedPrice = (combo: Combo) => {
    const cmv = getComboCMV(combo);
    const deductions = (totalCfiPercent + combo.profitMargin) / 100;
    return deductions < 1 ? cmv / (1 - deductions) : 0;
  };

  const sortedCategories = [...(menuCategories || [])].sort((a, b) => a.order - b.order);
  const groups: Record<string, Array<{ type: 'product' | 'combo'; data: Product | Combo }>> = {};

  sortedCategories.forEach(cat => { groups[cat.name] = []; });
  groups['Sem Categoria'] = [];
  groups['Padrão'] = [];

  (products || []).forEach(p => {
    const resolvedCat = groups[p.category] 
      ? p.category 
      : (sortedCategories.find(c => c.id === p.category)?.name || 'Sem Categoria');
    if (groups[resolvedCat]) groups[resolvedCat].push({ type: 'product', data: p });
    else groups['Sem Categoria'].push({ type: 'product', data: p });
  });

  (combos || []).forEach(c => {
    const catName = c.category || 'Padrão';
    if (!groups[catName]) groups[catName] = [];
    groups[catName].push({ type: 'combo', data: c });
  });

  const catNames = [...sortedCategories.map(c => c.name), 'Sem Categoria', 'Padrão', ...Object.keys(groups).filter(k => !sortedCategories.some(c => c.name === k) && k !== 'Sem Categoria' && k !== 'Padrão')];

  let totalAnalyzed = 0;
  let countOk = 0;
  let countLow = 0;
  let countLoss = 0;

  const tableBody: any[] = [];
  let itemIndex = 1;

  catNames.forEach(catName => {
    const groupItems = groups[catName] || [];
    if (groupItems.length === 0) return;

    tableBody.push([
      {
        content: `📂 ${catName.toUpperCase()} (${groupItems.length} itens)`,
        colSpan: 9,
        styles: {
          fillColor: [235, 240, 250],
          textColor: [26, 26, 46],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left'
        }
      }
    ]);

    groupItems.forEach(item => {
      const isCombo = item.type === 'combo';
      const data = item.data;
      const cmv = isCombo ? getComboCMV(data as Combo) : getProductCMV(data as Product);
      const suggestedPrice = isCombo ? getComboSuggestedPrice(data as Combo) : getProductSuggestedPrice(data as Product);
      const hasFixedPrice = !!(data.fixedPriceStore && data.fixedPriceStore > 0);
      const pvAtual = hasFixedPrice ? (data.fixedPriceStore || 0) : suggestedPrice;
      const deliveryCost = isCombo ? ((data as Combo).keetaDelivery || 0) : ((data as Product).pricing?.keeta?.delivery || 0);

      const cfiCost = pvAtual * (totalCfiPercent / 100);
      const profitValue = pvAtual - (cmv + cfiCost + deliveryCost);
      const profitPercent = pvAtual > 0 ? (profitValue / pvAtual) * 100 : 0;

      let status = 'OK';
      let statusColor = [22, 163, 74]; // green
      if (profitPercent <= 0) {
        status = 'PREJUÍZO';
        statusColor = [220, 38, 38]; // red
        countLoss++;
      } else if (profitPercent < 15) {
        status = 'BAIXO';
        statusColor = [217, 119, 6]; // amber
        countLow++;
      } else {
        countOk++;
      }
      totalAnalyzed++;

      tableBody.push([
        itemIndex++,
        `${data.name}${isCombo ? ' [COMBO]' : ''}`,
        formatCurrency(pvAtual),
        formatPct(totalCfiPercent),
        formatCurrency(deliveryCost),
        formatCurrency(cmv),
        formatCurrency(profitValue),
        formatPct(profitPercent),
        {
          content: status,
          styles: { textColor: statusColor, fontStyle: 'bold' }
        }
      ]);
    });
  });

  autoTable(doc, {
    startY: startY,
    head: [[
      '#', 'Produto', 'Venda Atual (R$)', 'CFI (%)', 'Entrega (R$)', 'CMV+Emb (R$)', 'Lucro Atual (R$)', 'Lucro %', 'Status'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.3,
      halign: 'center'
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
      2: { fontStyle: 'bold' },
      6: { fontStyle: 'bold' },
      7: { fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14, bottom: 16 }
  });

  // Summary box at bottom
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, finalY, pageWidth - 28, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 26, 46);
  doc.text('RESUMO EXECUTIVO DA ANÁLISE DE MARGEM:', 18, finalY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text(`• Total de itens analisados: ${totalAnalyzed}`, 18, finalY + 15);
  
  doc.setTextColor(22, 163, 74);
  doc.text(`• Margem Saudável (OK): ${countOk}`, 75, finalY + 15);

  doc.setTextColor(217, 119, 6);
  doc.text(`• Margem Baixa (<15%): ${countLow}`, 125, finalY + 15);

  doc.setTextColor(220, 38, 38);
  doc.text(`• Em Prejuízo (<=0%): ${countLoss}`, 175, finalY + 15);

  applyFooters(doc);
  doc.save(sanitizeFileName(storeName, 'Lucro_Atual'));
};

// 3. RELATÓRIO DE INSUMOS E SUB-RECEITAS
export const exportIngredientsReport = (params: {
  storeName: string;
  ingredients: Ingredient[];
  ingredientCategories: Array<{ id: string; name: string }>;
  getIngredientRealCost: (ing: Ingredient) => number;
}) => {
  const { storeName, ingredients, ingredientCategories, getIngredientRealCost } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const startY = drawDocumentHeader(
    doc,
    'Relatório de Insumos e Sub-receitas',
    storeName,
    [`Total de Insumos e Preparações Cadastrados: ${ingredients.length}`]
  );

  const getCatName = (catId?: string) => {
    if (!catId) return 'Sem Categoria';
    const found = ingredientCategories.find(c => c.id === catId);
    return found ? found.name : 'Sem Categoria';
  };

  const tableBody = (ingredients || []).map((ing, idx) => {
    const realCost = getIngredientRealCost(ing);
    return [
      idx + 1,
      `${ing.name}${ing.isSubRecipe ? ' (Sub-receita)' : ''}`,
      getCatName(ing.categoryId),
      ing.unit,
      formatCurrency(ing.price || 0),
      `${ing.packageQuantity} ${ing.unit}`,
      formatPct(ing.lossPercent || 0),
      formatCurrency(realCost)
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [[
      '#', 'Nome do Insumo', 'Categoria', 'Unidade', 'Preço Compra', 'Qtd Pacote/Rendimento', 'Fator Perda %', 'Custo Real / Unid.'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.3,
      halign: 'center'
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 30, halign: 'left' },
      7: { fontStyle: 'bold', textColor: [26, 26, 46] }
    },
    margin: { left: 14, right: 14, bottom: 16 }
  });

  applyFooters(doc);
  doc.save(sanitizeFileName(storeName, 'Insumos_e_Subreceitas'));
};

// 4. RELATÓRIO DE FICHA TÉCNICA
export const exportProductsReport = (params: {
  storeName: string;
  products: Product[];
  ingredients: Ingredient[];
  menuCategories: MenuCategory[];
  getProductCMV: (prod: Product) => number;
  getIngredientRealCost: (ing: Ingredient) => number;
}) => {
  const { storeName, products, ingredients, menuCategories, getProductCMV, getIngredientRealCost } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const startY = drawDocumentHeader(
    doc,
    'Relatório de Fichas Técnicas',
    storeName,
    [`Total de Produtos / Pratos no Cardápio: ${products.length}`]
  );

  const getCatName = (catIdOrName: string) => {
    const found = menuCategories.find(c => c.id === catIdOrName || c.name === catIdOrName);
    return found ? found.name : (catIdOrName || 'Sem Categoria');
  };

  const tableBody: any[] = [];

  (products || []).forEach((prod, pIdx) => {
    const totalCmv = getProductCMV(prod);
    const catName = getCatName(prod.category);

    // Product Title Row
    tableBody.push([
      {
        content: `${pIdx + 1}. ${prod.name.toUpperCase()}  •  Categoria: ${catName}  •  CMV Total: ${formatCurrency(totalCmv)}`,
        colSpan: 4,
        styles: {
          fillColor: [26, 26, 46],
          textColor: [245, 185, 19],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'left'
        }
      }
    ]);

    // Sub-header for ingredients
    tableBody.push([
      { content: 'Ingrediente Utilizado', styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [26, 26, 46], halign: 'left' } },
      { content: 'Qtd Usada', styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [26, 26, 46], halign: 'center' } },
      { content: 'Custo Unitário', styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [26, 26, 46], halign: 'center' } },
      { content: 'Custo Total no Item', styles: { fontStyle: 'bold', fillColor: [240, 243, 248], textColor: [26, 26, 46], halign: 'right' } }
    ]);

    if (!prod.ingredients || prod.ingredients.length === 0) {
      tableBody.push([
        { content: 'Nenhum ingrediente vinculado a esta ficha técnica.', colSpan: 4, styles: { fontStyle: 'italic', textColor: [156, 163, 175], halign: 'center' } }
      ]);
    } else {
      prod.ingredients.forEach(item => {
        const ing = (ingredients || []).find(i => i.id === item.ingredientId);
        const unitCost = ing ? getIngredientRealCost(ing) : 0;
        const itemCost = unitCost * item.quantity;

        tableBody.push([
          ing ? ing.name : 'Item não identificado',
          `${item.quantity} ${ing ? ing.unit : ''}`,
          formatCurrency(unitCost),
          formatCurrency(itemCost)
        ]);
      });
    }
  });

  autoTable(doc, {
    startY: startY,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14, bottom: 16 }
  });

  applyFooters(doc);
  doc.save(sanitizeFileName(storeName, 'Fichas_Tecnicas'));
};

// 5. RELATÓRIO DE DESPESAS FIXAS
export const exportExpensesReport = (params: {
  storeName: string;
  selectedMonth: string;
  expenses: Expense[];
  categories: Array<{ id: string; name: string }>;
}) => {
  const { storeName, selectedMonth, expenses, categories } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Format month name
  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthNames: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
  };
  const monthDisplay = `${monthNames[monthStr] || monthStr} de ${yearStr}`;

  const monthExpenses = (expenses || []).filter(e => e.month === selectedMonth);
  const totalValue = monthExpenses.reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  const totalPaid = monthExpenses.filter(e => e.paid).reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  const totalPending = totalValue - totalPaid;

  const startY = drawDocumentHeader(
    doc,
    'Relatório de Despesas Fixas',
    storeName,
    [
      `Mês de Referência: ${monthDisplay}`,
      `Total de Despesas: ${formatCurrency(totalValue)} • Pago: ${formatCurrency(totalPaid)} • Pendente: ${formatCurrency(totalPending)}`
    ]
  );

  const getCatName = (catIdOrName: string) => {
    const found = categories.find(c => c.id === catIdOrName || c.name === catIdOrName);
    return found ? found.name : (catIdOrName || 'Geral');
  };

  const tableBody = monthExpenses.map((exp, idx) => {
    const dueDateFormatted = exp.dueDate ? exp.dueDate.split('-').reverse().join('/') : '-';
    const statusText = exp.paid ? 'PAGO' : 'PENDENTE';
    const statusColor = exp.paid ? [22, 163, 74] : [220, 38, 38];

    return [
      idx + 1,
      `${exp.description}${exp.installment ? ` (${exp.installment.current}/${exp.installment.total})` : ''}`,
      getCatName(exp.category),
      formatCurrency(Number(exp.value) || 0),
      dueDateFormatted,
      { content: statusText, styles: { textColor: statusColor as [number, number, number], fontStyle: 'bold' as const } }
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [[
      '#', 'Descrição da Despesa', 'Categoria', 'Valor (R$)', 'Vencimento', 'Status'
    ]],
    body: tableBody,
    foot: [[
      { content: 'TOTAL GERAL DAS DESPESAS', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: formatCurrency(totalValue), styles: { fontStyle: 'bold', halign: 'center' } },
      { content: '', colSpan: 2 }
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.3,
      halign: 'center'
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: [26, 26, 46],
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 35, halign: 'left' },
      3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 14, right: 14, bottom: 16 }
  });

  applyFooters(doc);
  doc.save(sanitizeFileName(storeName, `Despesas_Fixas_${selectedMonth}`));
};

// 6. RELATÓRIO DE PONTO DE EQUILÍBRIO
export const exportBreakEvenReport = (params: {
  storeName: string;
  selectedMonth: string;
  monthlyRevenue: number;
  totalExpenses: number;
  cmvAvgPct: number;
  cfiPct: number;
  breakEvenValue: number;
  tenDaysGoal: number;
  tenDaysCurrent: number;
}) => {
  const {
    storeName,
    selectedMonth,
    monthlyRevenue,
    totalExpenses,
    cmvAvgPct,
    cfiPct,
    breakEvenValue,
    tenDaysGoal,
    tenDaysCurrent
  } = params;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthNames: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
  };
  const monthDisplay = `${monthNames[monthStr] || monthStr} de ${yearStr}`;

  const isAchieved = monthlyRevenue >= breakEvenValue && breakEvenValue > 0;
  const percentAchieved = breakEvenValue > 0 ? (monthlyRevenue / breakEvenValue) * 100 : 0;
  const statusStr = isAchieved 
    ? `ATINGIDO (${percentAchieved.toFixed(1)}% da meta de sobrevivência)` 
    : `EM ANDAMENTO (${percentAchieved.toFixed(1)}% do Ponto de Equilíbrio)`;

  const tenDaysPct = tenDaysGoal > 0 ? (tenDaysCurrent / tenDaysGoal) * 100 : 0;
  const tenDaysStatus = tenDaysCurrent >= tenDaysGoal && tenDaysGoal > 0
    ? `BATIDO NOS PRIMEIROS 10 DIAS! (${tenDaysPct.toFixed(1)}%)`
    : `${tenDaysPct.toFixed(1)}% da meta dos primeiros 10 dias`;

  const startY = drawDocumentHeader(
    doc,
    'Resumo do Ponto de Equilíbrio',
    storeName,
    [
      `Mês Analisado: ${monthDisplay}`,
      `Status do Ponto de Equilíbrio: ${statusStr}`
    ]
  );

  const tableBody = [
    ['Faturamento Total do Mês (Bruto)', formatCurrency(monthlyRevenue), 'Volume total faturado no período'],
    ['Despesas Fixas Totais', formatCurrency(totalExpenses), 'Soma de todos os custos fixos cadastrados'],
    ['CMV Médio da Loja (%)', formatPct(cmvAvgPct), 'Custo médio de insumos por prato vendido'],
    ['CFI Percentual da Empresa (%)', formatPct(cfiPct), 'Custos fixos e taxas integrados'],
    ['Ponto de Equilíbrio Calculado (R$)', formatCurrency(breakEvenValue), 'Faturamento mínimo necessário para cobrir custos (Lucro Zero)'],
    ['Status Financeiro do Mês', isAchieved ? 'SUPEROU PONTO DE EQUILÍBRIO (LUCRO)' : 'ABAIXO DO PONTO DE EQUILÍBRIO (ATENÇÃO)', isAchieved ? 'Operação em zona de lucro real' : 'Ainda pagando estrutura de custos'],
    ['Termômetro dos 10 Primeiros Dias', formatCurrency(tenDaysCurrent), `Meta: ${formatCurrency(tenDaysGoal)} • ${tenDaysStatus}`]
  ];

  autoTable(doc, {
    startY: startY,
    head: [[
      'Indicador Estratégico', 'Valor do Indicador', 'Descrição / Interpretação'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.3
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 45, fontStyle: 'bold', halign: 'center', textColor: [26, 26, 46] },
      2: { cellWidth: 72, halign: 'left', textColor: [100, 110, 120] }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 14, right: 14, bottom: 16 }
  });

  applyFooters(doc);
  doc.save(sanitizeFileName(storeName, `Ponto_de_Equilibrio_${selectedMonth}`));
};

// 7. RELATÓRIO DE COMBOS
export const exportCombosReport = (params: {
  storeName: string;
  combos: Combo[];
  products: Product[];
  totalCfiPercent: number;
  getProductCMV: (prod: Product) => number;
}) => {
  const { storeName, combos, products, totalCfiPercent, getProductCMV } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const startY = drawDocumentHeader(
    doc,
    'Relatório de Combos e Ofertas',
    storeName,
    [`Total de Combos Cadastrados: ${combos.length} • CFI Integrado: ${formatPct(totalCfiPercent)}`]
  );

  const getComboCMV = (combo: Combo) => {
    let cmvCombo = 0;
    const itemCosts: number[] = [];
    (combo.items || []).forEach(item => {
      const prod = (products || []).find(p => p.id === item.productId);
      itemCosts.push(prod ? getProductCMV(prod) * item.quantity : 0);
    });

    if (combo.type === 'free_choice') {
      const sortedCosts = [...itemCosts].sort((a, b) => b - a);
      const freeChoiceCount = combo.freeChoiceCount || 2;
      cmvCombo = sortedCosts.slice(0, freeChoiceCount).reduce((acc, val) => acc + val, 0);
    } else {
      cmvCombo = itemCosts.reduce((acc, val) => acc + val, 0);
    }
    cmvCombo += (combo.customPackagingCost || 0);
    return cmvCombo;
  };

  const getComboMinPrice = (combo: Combo) => {
    const cmv = getComboCMV(combo);
    const deductions = (totalCfiPercent + combo.profitMargin) / 100;
    return deductions < 1 ? cmv / (1 - deductions) : 0;
  };

  const tableBody = (combos || []).map((c, idx) => {
    const cmv = getComboCMV(c);
    const minPrice = getComboMinPrice(c);
    const defPrice = (c.fixedPriceStore && c.fixedPriceStore > 0) ? c.fixedPriceStore : minPrice;
    
    // Real margin
    const cfiValue = defPrice * (totalCfiPercent / 100);
    const profitVal = defPrice - (cmv + cfiValue + (c.keetaDelivery || 0));
    const realMarginPct = defPrice > 0 ? (profitVal / defPrice) * 100 : 0;

    // Type description
    const typeLabel = c.type === 'free_choice' 
      ? `Escolha Livre (${c.freeChoiceCount || 2})` 
      : c.type === 'boosted' 
      ? 'Turbinado' 
      : 'Fixo';

    // Composing items
    const itemsDescription = (c.items || []).map(i => {
      const p = products.find(prod => prod.id === i.productId);
      return `${i.quantity}x ${p ? p.name : 'Produto'}`;
    }).join(', ');

    return [
      idx + 1,
      c.name,
      c.category || 'Padrão',
      typeLabel,
      itemsDescription || '-',
      formatCurrency(cmv),
      formatCurrency(minPrice),
      formatCurrency(defPrice),
      formatPct(realMarginPct)
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [[
      '#', 'Nome do Combo', 'Categoria', 'Tipo', 'Composição', 'CMV Total', 'Preço Mín.', 'Preço Def.', 'Margem Real'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.3,
      halign: 'center'
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'left' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 36, halign: 'left', fontSize: 6.5 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [22, 163, 74] }
    },
    margin: { left: 10, right: 10, bottom: 16 }
  });

  applyFooters(doc);
  doc.save(sanitizeFileName(storeName, 'Combos'));
};

// 8. RELATÓRIO DE INTEGRAR VENDAS
export const exportSalesImportReport = (params: {
  storeName: string;
  grossRevenue: number;
  totalCmvCost: number;
  totalCfiCost: number;
  netProfit: number;
  netMarginPct: number;
  transactions: SalesTransaction[];
}) => {
  const {
    storeName,
    grossRevenue,
    totalCmvCost,
    totalCfiCost,
    netProfit,
    netMarginPct,
    transactions
  } = params;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const startY = drawDocumentHeader(
    doc,
    'Relatório de Vendas e Rentabilidade',
    storeName,
    [
      `Faturamento Bruto: ${formatCurrency(grossRevenue)} • Lucro Líquido Real: ${formatCurrency(netProfit)} (${formatPct(netMarginPct)})`,
      `CMV Total de Insumos: ${formatCurrency(totalCmvCost)} • CFI Integrado: ${formatCurrency(totalCfiCost)}`
    ]
  );

  // Group sold products by name
  const aggregated: Record<string, { qty: number; totalRevenue: number; cmvTotal: number }> = {};

  (transactions || []).forEach(t => {
    const key = t.productName || 'Item';
    if (!aggregated[key]) {
      aggregated[key] = { qty: 0, totalRevenue: 0, cmvTotal: 0 };
    }
    const q = t.qty || 1;
    const rev = (t.pricePaidByCustomer || 0) * q;
    aggregated[key].qty += q;
    aggregated[key].totalRevenue += rev;
  });

  const tableBody = Object.entries(aggregated).map(([prodName, data], idx) => {
    const unitPrice = data.qty > 0 ? data.totalRevenue / data.qty : 0;
    const itemEstCmv = data.totalRevenue * 0.32; // Standard estimation proportion
    const estProfit = data.totalRevenue - itemEstCmv;

    return [
      idx + 1,
      prodName,
      data.qty,
      formatCurrency(unitPrice),
      formatCurrency(data.totalRevenue),
      formatCurrency(unitPrice * 0.32),
      formatCurrency(itemEstCmv),
      formatCurrency(estProfit)
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [[
      '#', 'Produto Vendido', 'Qtd', 'Preço Médio Unit.', 'Total Bruto (R$)', 'CMV Unit.', 'CMV Total (R$)', 'Lucro Bruto Est.'
    ]],
    body: tableBody,
    foot: [[
      { content: 'TOTAIS CONSOLIDADOS', colSpan: 2, styles: { fontStyle: 'bold' as const, halign: 'right' } },
      { content: String(transactions.reduce((acc, t) => acc + (t.qty || 1), 0)), styles: { fontStyle: 'bold' as const, halign: 'center' } },
      { content: '', styles: { halign: 'center' } },
      { content: formatCurrency(grossRevenue), styles: { fontStyle: 'bold' as const, halign: 'center' } },
      { content: '', styles: { halign: 'center' } },
      { content: formatCurrency(totalCmvCost), styles: { fontStyle: 'bold' as const, halign: 'center' } },
      { content: formatCurrency(grossRevenue - totalCmvCost), styles: { fontStyle: 'bold' as const, halign: 'center' } }
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.3,
      halign: 'center'
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: [26, 26, 46],
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 22, halign: 'center', fontStyle: 'bold', textColor: [22, 163, 74] }
    },
    margin: { left: 12, right: 12, bottom: 16 }
  });

  applyFooters(doc);
  doc.save(sanitizeFileName(storeName, 'Integrar_Vendas'));
};
