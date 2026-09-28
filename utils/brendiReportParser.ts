export interface BrendiDailySale {
  date: string;       // ex: '01/09/2026'
  isoDate: string;    // ex: '2026-09-01'
  sales: number;      // ex: 420.64
  orders: number;     // ex: 11
  customers: number;  // ex: 9
}

export interface BrendiWeeklySale {
  week: string;       // ex: '36/2026'
  sales: number;      // ex: 2067.15
  orders: number;     // ex: 45
  customers: number;  // ex: 35
}

export interface BrendiMonthlySale {
  month: string;      // ex: '9/2026'
  monthKey: string;   // ex: '2026-09'
  sales: number;      // ex: 2548.13
  orders: number;     // ex: 56
  customers: number;  // ex: 41
}

export interface BrendiPlatformDistribution {
  platform: string;   // ex: 'iFood', 'Cardápio digital', 'Gestor de pedidos', 'Whatsapp', '99Food', 'Tráfego Pago'
  orders: number;     // ex: 17
  revenue: number;    // ex: 545.64
  percent: number;    // ex: 21.41
}

export interface BrendiCouponUsage {
  code: string;
  origin: string;
  count: number;
  investedAmount: number;
  sponsoredAmount: number;
  avgTicket: number;
  totalRevenue: number;
}

export interface BrendiConsolidatedReport {
  id: string;
  importedAt: string;
  fileName?: string;
  source: 'brendi_consolidado';
  period: {
    startDate: string; // '01/09/2026'
    endDate: string;   // '09/09/2026'
    startIso: string;  // '2026-09-01'
    endIso: string;    // '2026-09-09'
    monthKey: string;  // '2026-09'
    formattedPeriod: string; // '01/09/2026 a 09/09/2026'
  };
  metrics: {
    totalOrders: number;         // 56
    totalSales: number;          // 2548.13
    couponInvestment: number;    // 96.94
    sponsoredInvestment: number; // 335.14
    averageTicket: number;       // 45.50
    ordersWithCoupon: number;    // 18
  };
  dailySales: BrendiDailySale[];
  weeklySales: BrendiWeeklySale[];
  monthlySales: BrendiMonthlySale[];
  platformDistribution: BrendiPlatformDistribution[];
  couponsUsed: BrendiCouponUsage[];
}

/**
 * Converte strings monetárias brasileiras (ex: "2548,13", "420,64") ou americanas ("2548.13") em number.
 */
export const parseBrOrUsMoney = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  // Remove caracteres que não sejam dígitos, pontos, vírgulas ou sinal negativo
  const s = str.replace(/[^\d.,-]/g, '');
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

/**
 * Converte data DD/MM/YYYY em ISO YYYY-MM-DD
 */
export const ddmmyyyyToIso = (dateStr: string): string => {
  if (!dateStr) return '';
  const match = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const d = match[1].padStart(2, '0');
    const m = match[2].padStart(2, '0');
    const y = match[3];
    return `${y}-${m}-${d}`;
  }
  return dateStr;
};

/**
 * Detecta se um texto bruto ou conteúdo de arquivo é um Relatório Consolidado do Brendi (Tipo A).
 */
export const isBrendiConsolidatedReport = (rawText: string): boolean => {
  if (!rawText || typeof rawText !== 'string') return false;

  const norm = rawText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const hasMetricasGerais = norm.includes('metricas gerais');
  const hasVendasTotais = norm.includes('vendas totais');
  const hasTotalPedidos = norm.includes('total de pedidos');
  const hasVendasDiarias = norm.includes('vendas diarias');
  const hasVendasSemanais = norm.includes('vendas semanais');
  const hasVendasMensais = norm.includes('vendas mensais');
  const hasDistribuicaoPlataforma = norm.includes('distribuicao por plataforma') || norm.includes('distribuicao plataforma');
  const hasCuponsUtilizados = norm.includes('cupons utilizados');

  // Critérios estruturais fortes
  if (hasMetricasGerais && (hasVendasTotais || hasTotalPedidos)) return true;
  if (hasVendasTotais && (hasVendasDiarias || hasDistribuicaoPlataforma || hasTotalPedidos)) return true;
  if (hasVendasDiarias && hasDistribuicaoPlataforma && hasTotalPedidos) return true;
  if (hasVendasDiarias && hasVendasSemanais && (hasVendasMensais || hasDistribuicaoPlataforma)) return true;
  if (hasDistribuicaoPlataforma && hasCuponsUtilizados) return true;

  return false;
};

/**
 * Faz o parse estrutural completo de um Relatório Consolidado da Brendi.
 */
export const parseBrendiConsolidatedReport = (
  rawText: string,
  fileName?: string
): BrendiConsolidatedReport => {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let currentSection = 'NONE';
  let totalOrders = 0;
  let totalSales = 0;
  let couponInvestment = 0;
  let sponsoredInvestment = 0;
  let averageTicket = 0;
  let ordersWithCoupon = 0;

  const dailySales: BrendiDailySale[] = [];
  const weeklySales: BrendiWeeklySale[] = [];
  const monthlySales: BrendiMonthlySale[] = [];
  const platformDistribution: BrendiPlatformDistribution[] = [];
  const couponsUsed: BrendiCouponUsage[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const normLine = rawLine
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    // Detecta mudança de seção
    if (normLine === 'metricas gerais' || normLine.startsWith('metricas gerais')) {
      currentSection = 'METRICAS_GERAIS';
      continue;
    }
    if (normLine === 'vendas diarias' || normLine.startsWith('vendas diarias')) {
      currentSection = 'VENDAS_DIARIAS';
      continue;
    }
    if (normLine === 'vendas semanais' || normLine.startsWith('vendas semanais')) {
      currentSection = 'VENDAS_SEMANAIS';
      continue;
    }
    if (normLine === 'vendas mensais' || normLine.startsWith('vendas mensais')) {
      currentSection = 'VENDAS_MENSAIS';
      continue;
    }
    if (normLine.includes('distribuicao por plataforma') || normLine.includes('distribuicao plataforma')) {
      currentSection = 'DISTRIBUICAO_PLATAFORMA';
      continue;
    }
    if (normLine === 'cupons utilizados' || normLine.startsWith('cupons utilizados')) {
      currentSection = 'CUPONS_UTILIZADOS';
      continue;
    }

    // Identifica delimitador da linha
    const delimiter = rawLine.includes('\t') ? '\t' : (rawLine.includes(';') ? ';' : ',');
    const cols = rawLine.split(delimiter).map(c => c.trim());

    if (currentSection === 'METRICAS_GERAIS') {
      const keyCol = normLine;
      if (keyCol.includes('total de pedidos')) {
        const val = cols[1] !== undefined ? cols[1] : cols[0].split(':')[1];
        totalOrders = parseInt(val || '0', 10) || 0;
      } else if (keyCol.includes('vendas totais')) {
        const val = cols[1] !== undefined ? cols[1] : cols[0].split(':')[1];
        totalSales = parseBrOrUsMoney(val);
      } else if (keyCol.includes('investimento em cupons')) {
        const val = cols[1] !== undefined ? cols[1] : cols[0].split(':')[1];
        couponInvestment = parseBrOrUsMoney(val);
      } else if (keyCol.includes('investimento patrocinado')) {
        const val = cols[1] !== undefined ? cols[1] : cols[0].split(':')[1];
        sponsoredInvestment = parseBrOrUsMoney(val);
      } else if (keyCol.includes('ticket medio')) {
        const val = cols[1] !== undefined ? cols[1] : cols[0].split(':')[1];
        averageTicket = parseBrOrUsMoney(val);
      } else if (keyCol.includes('pedidos com cupom')) {
        const val = cols[1] !== undefined ? cols[1] : cols[0].split(':')[1];
        ordersWithCoupon = parseInt(val || '0', 10) || 0;
      }
    } else if (currentSection === 'VENDAS_DIARIAS') {
      // Pula cabeçalho "Data;Vendas (R$);Pedidos;Clientes"
      if (normLine.includes('data') && (normLine.includes('vendas') || normLine.includes('pedidos'))) {
        continue;
      }
      if (cols.length >= 2) {
        const dateRaw = cols[0];
        // Verifica se a primeira coluna é uma data DD/MM/YYYY
        if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(dateRaw)) {
          const salesVal = parseBrOrUsMoney(cols[1]);
          const ordersVal = parseInt(cols[2] || '0', 10) || 0;
          const custVal = parseInt(cols[3] || '0', 10) || 0;
          dailySales.push({
            date: dateRaw,
            isoDate: ddmmyyyyToIso(dateRaw),
            sales: salesVal,
            orders: ordersVal,
            customers: custVal
          });
        }
      }
    } else if (currentSection === 'VENDAS_SEMANAIS') {
      // Pula cabeçalho "Semana;Vendas (R$);Pedidos;Clientes"
      if (normLine.includes('semana') && (normLine.includes('vendas') || normLine.includes('pedidos'))) {
        continue;
      }
      if (cols.length >= 2) {
        const weekRaw = cols[0];
        if (weekRaw.includes('/')) {
          const salesVal = parseBrOrUsMoney(cols[1]);
          const ordersVal = parseInt(cols[2] || '0', 10) || 0;
          const custVal = parseInt(cols[3] || '0', 10) || 0;
          weeklySales.push({
            week: weekRaw,
            sales: salesVal,
            orders: ordersVal,
            customers: custVal
          });
        }
      }
    } else if (currentSection === 'VENDAS_MENSAIS') {
      // Pula cabeçalho "Mês;Vendas (R$);Pedidos;Clientes"
      if ((normLine.includes('mes') || normLine.includes('mês')) && (normLine.includes('vendas') || normLine.includes('pedidos'))) {
        continue;
      }
      if (cols.length >= 2) {
        const monthRaw = cols[0];
        if (monthRaw.includes('/')) {
          const [mPart, yPart] = monthRaw.split('/');
          const monthKey = `${yPart}-${mPart.padStart(2, '0')}`;
          const salesVal = parseBrOrUsMoney(cols[1]);
          const ordersVal = parseInt(cols[2] || '0', 10) || 0;
          const custVal = parseInt(cols[3] || '0', 10) || 0;
          monthlySales.push({
            month: monthRaw,
            monthKey,
            sales: salesVal,
            orders: ordersVal,
            customers: custVal
          });
        }
      }
    } else if (currentSection === 'DISTRIBUICAO_PLATAFORMA') {
      // Pula cabeçalho "Plataforma;Pedidos;Receita (R$)"
      if (normLine.includes('plataforma') && (normLine.includes('receita') || normLine.includes('pedidos'))) {
        continue;
      }
      if (cols.length >= 3) {
        const platformName = cols[0];
        const ordersVal = parseInt(cols[1] || '0', 10) || 0;
        const revenueVal = parseBrOrUsMoney(cols[2]);
        if (platformName && (ordersVal > 0 || revenueVal > 0)) {
          platformDistribution.push({
            platform: platformName,
            orders: ordersVal,
            revenue: revenueVal,
            percent: totalSales > 0 ? (revenueVal / totalSales) * 100 : 0
          });
        }
      }
    } else if (currentSection === 'CUPONS_UTILIZADOS') {
      // Pula cabeçalho
      if (normLine.includes('codigo') || normLine.includes('código')) {
        continue;
      }
      if (cols.length >= 4) {
        const code = cols[0];
        const origin = cols[1] || '';
        const count = parseInt(cols[2] || '0', 10) || 0;
        const investedAmount = parseBrOrUsMoney(cols[3]);
        const sponsoredAmount = parseBrOrUsMoney(cols[4]);
        const avgTicket = parseBrOrUsMoney(cols[5]);
        const totRev = parseBrOrUsMoney(cols[6]);
        if (code) {
          couponsUsed.push({
            code,
            origin,
            count,
            investedAmount,
            sponsoredAmount,
            avgTicket,
            totalRevenue: totRev
          });
        }
      }
    }
  }

  // Recalcula percentuais de plataforma caso totalSales tenha sido lido após
  if (totalSales > 0) {
    platformDistribution.forEach(p => {
      p.percent = (p.revenue / totalSales) * 100;
    });
  }

  // Se o ticket médio não estava explícito mas temos vendas e pedidos:
  if (averageTicket === 0 && totalOrders > 0 && totalSales > 0) {
    averageTicket = totalSales / totalOrders;
  }

  // Determinação do Período
  let startDate = '';
  let endDate = '';
  let startIso = '';
  let endIso = '';
  let monthKey = '';

  if (dailySales.length > 0) {
    startDate = dailySales[0].date;
    endDate = dailySales[dailySales.length - 1].date;
    startIso = dailySales[0].isoDate;
    endIso = dailySales[dailySales.length - 1].isoDate;
    monthKey = startIso.slice(0, 7);
  } else if (monthlySales.length > 0) {
    monthKey = monthlySales[0].monthKey;
    startDate = `01/${monthlySales[0].month}`;
    endDate = `30/${monthlySales[0].month}`;
    startIso = `${monthKey}-01`;
    endIso = `${monthKey}-28`;
  }

  // Fallback ou refinamento a partir do nome do arquivo (ex: relatorio_vendas_01_09_2026_09_09_2026.csv)
  if (fileName) {
    const fileMatch = fileName.match(/(\d{2})_(\d{2})_(\d{4})_(\d{2})_(\d{2})_(\d{4})/);
    if (fileMatch) {
      const d1 = fileMatch[1];
      const m1 = fileMatch[2];
      const y1 = fileMatch[3];
      const d2 = fileMatch[4];
      const m2 = fileMatch[5];
      const y2 = fileMatch[6];
      startDate = `${d1}/${m1}/${y1}`;
      endDate = `${d2}/${m2}/${y2}`;
      startIso = `${y1}-${m1}-${d1}`;
      endIso = `${y2}-${m2}-${d2}`;
      monthKey = `${y1}-${m1}`;
    }
  }

  if (!monthKey) {
    monthKey = new Date().toISOString().slice(0, 7);
  }

  const formattedPeriod = startDate && endDate ? `${startDate} a ${endDate}` : monthKey;

  const reportId = `brendi_rep_${monthKey}_${startDate.replace(/\//g, '')}_${endDate.replace(/\//g, '')}`;

  return {
    id: reportId,
    importedAt: new Date().toISOString(),
    fileName,
    source: 'brendi_consolidado',
    period: {
      startDate,
      endDate,
      startIso,
      endIso,
      monthKey,
      formattedPeriod
    },
    metrics: {
      totalOrders,
      totalSales,
      couponInvestment,
      sponsoredInvestment,
      averageTicket,
      ordersWithCoupon
    },
    dailySales,
    weeklySales,
    monthlySales,
    platformDistribution,
    couponsUsed
  };
};

/**
 * Identifica se uma transação existente na base de dados é um registro espúrio/corrompido
 * gerado pela importação incorreta do Relatório Consolidado do Brendi (que inflou o faturamento).
 */
export const isCorruptedBrendiImportTransaction = (t: {
  id?: string;
  productName?: string;
  pricePaidByCustomer?: number;
  qty?: number;
  date?: string;
}): boolean => {
  if (!t) return false;

  const rawName = String(t.productName || '');
  const cleanName = rawName
    .replace(/Ã©/g, 'e')
    .replace(/Ã¡/g, 'a')
    .replace(/Ã£/g, 'a')
    .replace(/Ãª/g, 'e')
    .replace(/Ã§/g, 'c')
    .replace(/Ã/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // Nomes de seções ou métricas do relatório que viraram transações
  const suspiciousKeywords = [
    'metricas',
    'total de pedidos',
    'vendas totais',
    'investimento em cupons',
    'investimento patrocinado',
    'ticket medio',
    'pedidos com cupom',
    'vendas diarias',
    'vendas semanais',
    'vendas mensais',
    'distribuicao por plataforma',
    'distribuicao plataforma',
    'cupons utilizados',
    'gestor de pedidos',
    'cardapio digital',
    'trafego pago',
    'clientes',
    'codigo',
    'valor investido',
    'valor patrocinado',
    'valor total faturado',
    'plataforma',
    'semana',
    'mes',
    'ifood_store_voucher',
    'store_ifood_voucher',
    'frete gratis',
    'carreiro5',
    'item desconhecido'
  ];

  for (const kw of suspiciousKeywords) {
    if (cleanName === kw || cleanName.includes(kw)) {
      return true;
    }
  }

  // Linhas com tabs que contêm colunas do relatório
  if (rawName.includes('\t')) {
    return true;
  }

  // Linhas onde a data virou nome de produto (ex: "01/09/2026", "02/09/2026")
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanName)) {
    return true;
  }

  // Linhas onde a semana ou mês virou nome de produto (ex: "36/2026", "37/2026", "9/2026")
  if (/^\d{1,2}\/\d{4}$/.test(cleanName)) {
    return true;
  }

  // Transações com valor exorbitante gerado por multiplicação indevida
  const lineTotal = (t.pricePaidByCustomer || 0) * (t.qty || 1);
  if (lineTotal > 20000 && !cleanName.includes('evento')) {
    return true;
  }

  return false;
};
