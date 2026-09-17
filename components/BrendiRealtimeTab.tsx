import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Radio, 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  HelpCircle,
  PlusCircle,
  Zap,
  ShoppingBag,
  Plug,
  Store,
  Percent,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Product, Combo, SalesTransaction, BrendiOrder, BrendiOrderItem, BrendiChannelFees, SalesDataRecord } from '../types';
import { formatMoney, formatPercent } from '../constants';
import { BrendiLogo, IFoodLogo, Food99Logo, KeetaLogo } from './PlatformLogos';
import { 
  DEFAULT_BRENDI_CHANNEL_FEES, 
  getSuggestedChannelFees, 
  getSavedChannelFees, 
  saveChannelFeesToStorage, 
  identifyOrderChannel, 
  calculateBrendiOrderFinancials 
} from '../utils/brendiProfit';
import { 
  saveSalesDataBatch, 
  getSalesDataForMonth, 
  deleteSalesDataByMonth 
} from '../services/salesDataService';

interface BrendiRealtimeTabProps {
  products: Product[];
  combos: Combo[];
  getProductCMV: (prod: Product) => number;
  getComboCMV: (combo: any) => number;
  addSalesTransactionsBatch: (transactions: SalesTransaction[]) => void;
  totalCfiPercent: number;
  onNavigateToIntegrations?: () => void;
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
}

const WEBHOOK_URL = 'https://app-cardapioblindado.vercel.app/api/brendi-webhook';

export const normalizeName = (name: string): string => {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/gi, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

export const BrendiRealtimeTab: React.FC<BrendiRealtimeTabProps> = ({
  products,
  combos,
  getProductCMV,
  getComboCMV,
  addSalesTransactionsBatch,
  totalCfiPercent,
  onNavigateToIntegrations,
  selectedMonth: externalSelectedMonth,
  onSelectMonth
}) => {
  const { user, emulatedUser } = useAuth();
  const activeUserId = emulatedUser ? emulatedUser.userId : (user ? user.uid : null);
  const activeEmail = emulatedUser ? emulatedUser.email : user?.email;

  const { platformConfig, monthlyRevenue, updateMonthlyRevenueFromIntegration, brendiOrders = [] } = useApp();

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [internalMonth, setInternalMonth] = useState<string>(externalSelectedMonth || currentMonthKey);

  const monthToProcess = externalSelectedMonth || internalMonth;
  const setMonthToProcess = (m: string) => {
    setInternalMonth(m);
    if (onSelectMonth) onSelectMonth(m);
  };

  const [isProcessingMonth, setIsProcessingMonth] = useState(false);
  const [showConfirmRecalculateModal, setShowConfirmRecalculateModal] = useState(false);
  const [confirmModalInfo, setConfirmModalInfo] = useState<{
    targetMonth: string;
    isManualWarning: boolean;
    existingCount: number;
    message: string;
  } | null>(null);

  const [showProcessSuccessModal, setShowProcessSuccessModal] = useState(false);
  const [processResultSummary, setProcessResultSummary] = useState<{
    targetMonth: string;
    count: number;
    grossRevenue: number;
    totalCmv: number;
    netProfitEstimated: number;
  } | null>(null);

  const suggestedFees = useMemo(() => {
    return getSuggestedChannelFees(platformConfig, products);
  }, [platformConfig, products]);

  const [channelFees, setChannelFees] = useState<BrendiChannelFees>(() => {
    return getSavedChannelFees(activeUserId) || suggestedFees;
  });

  // Sync and load channel fees
  useEffect(() => {
    if (!activeUserId) return;
    const loadFees = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', activeUserId));
        if (snap.exists()) {
          const fees = snap.data()?.integrations?.brendi?.channelFees;
          if (fees) {
            setChannelFees(fees);
            saveChannelFeesToStorage(fees, activeUserId);
          }
        }
      } catch (err) {
        console.warn('[BRENDI-TAB] Erro ao carregar taxas de canal:', err);
      }
    };
    loadFees();

    const handleFeesUpdated = (e: any) => {
      if (e.detail) {
        setChannelFees(e.detail);
      }
    };
    window.addEventListener('brendi-channel-fees-updated', handleFeesUpdated);
    return () => window.removeEventListener('brendi-channel-fees-updated', handleFeesUpdated);
  }, [activeUserId]);

  const [orders, setOrders] = useState<BrendiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConfiguredBrendi, setHasConfiguredBrendi] = useState<boolean | null>(null);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

  // Period filtering for processing
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [processStatusLog, setProcessStatusLog] = useState<string | null>(null);

  // Check if current user has Brendi credentials configured
  useEffect(() => {
    if (!activeUserId) {
      setHasConfiguredBrendi(false);
      setCheckingConfig(false);
      return;
    }

    let isMounted = true;
    const checkUserCredentials = async () => {
      try {
        const userDocRef = doc(db, 'users', activeUserId);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const d = snap.data() || {};
          const storeUuid = d.integrations?.brendi?.storeUuid;
          if (isMounted) {
            setHasConfiguredBrendi(Boolean(storeUuid && String(storeUuid).trim().length > 0));
          }
        } else {
          // If espacocarreiro, consider configured
          if (activeEmail?.toLowerCase().trim() === 'espacocarreiro@gmail.com') {
            if (isMounted) setHasConfiguredBrendi(true);
          } else {
            if (isMounted) setHasConfiguredBrendi(false);
          }
        }
      } catch (err) {
        console.warn('[BRENDI-TAB] Erro ao verificar credenciais do usuário:', err);
        if (isMounted) setHasConfiguredBrendi(false);
      } finally {
        if (isMounted) setCheckingConfig(false);
      }
    };

    checkUserCredentials();

    return () => {
      isMounted = false;
    };
  }, [activeUserId, activeEmail]);

  // Filter channel for display
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');

  // 1. Real-time Firestore listener for brendi_orders
  useEffect(() => {
    if (!activeUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Primary: user subcollection users/{activeUserId}/brendi_orders
    const ordersColRef = collection(db, 'users', activeUserId, 'brendi_orders');
    const q = query(ordersColRef, orderBy('createdAt', 'desc'), limit(150));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: BrendiOrder[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data() as any;
        list.push({
          id: docSnap.id,
          orderId: d.orderId || docSnap.id,
          createdAt: d.createdAt || new Date().toISOString(),
          channel: d.channel || 'Brendi Balcão',
          merchantId: d.merchantId,
          items: Array.isArray(d.items) ? d.items : [],
          total: Number(d.total || 0),
          status: d.status || 'CONCLUDED',
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          deliveryType: d.deliveryType,
          userId: d.userId,
          processed: d.processed || false
        });
      });

      // If empty in subcollection, check if there are mirror orders in root
      if (list.length === 0) {
        try {
          const rootRef = collection(db, 'brendi_orders');
          const rootQ = query(rootRef, orderBy('createdAt', 'desc'), limit(50));
          const unsubRoot = onSnapshot(rootQ, (rootSnap) => {
            if (!rootSnap.empty && list.length === 0) {
              const rootList: BrendiOrder[] = [];
              rootSnap.forEach(rd => {
                const rdata = rd.data() as any;
                rootList.push({
                  id: rd.id,
                  orderId: rdata.orderId || rd.id,
                  createdAt: rdata.createdAt || new Date().toISOString(),
                  channel: rdata.channel || 'Brendi Balcão',
                  merchantId: rdata.merchantId,
                  items: Array.isArray(rdata.items) ? rdata.items : [],
                  total: Number(rdata.total || 0),
                  status: rdata.status || 'CONCLUDED',
                  customerName: rdata.customerName,
                  customerPhone: rdata.customerPhone,
                  deliveryType: rdata.deliveryType,
                  userId: rdata.userId,
                  processed: rdata.processed || false
                });
              });
              setOrders(rootList);
            }
          });
        } catch (e) {
          // Ignore
        }
      }

      setOrders(list);
      if (list.length > 0) {
        setHasConfiguredBrendi(true);
      }
      setLoading(false);
    }, (error) => {
      console.warn('[BRENDI-REALTIME] Snapshot error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUserId]);

  // 2. Integration Status: Active (green) if order received in last 30 minutes, otherwise red
  const statusInfo = useMemo(() => {
    if (orders.length === 0) {
      return {
        isActive: false,
        message: 'Aguardando primeiro pedido da Brendi',
        subtext: 'Nenhum pedido recebido ainda. Configure o webhook no painel da Brendi.',
        lastOrderMinutesAgo: null
      };
    }

    const latestOrder = orders[0];
    const latestTime = new Date(latestOrder.createdAt).getTime();
    const now = Date.now();
    const diffMinutes = Math.floor((now - latestTime) / (1000 * 60));

    if (diffMinutes <= 30 && diffMinutes >= 0) {
      return {
        isActive: true,
        message: 'Integração Ativa • Recebendo Pedidos',
        subtext: `Último pedido recebido há ${diffMinutes === 0 ? 'menos de 1 minuto' : `${diffMinutes} min`}`,
        lastOrderMinutesAgo: diffMinutes
      };
    } else {
      return {
        isActive: false,
        message: 'Sem pedidos nos últimos 30 minutos',
        subtext: `Último pedido registrado há ${diffMinutes < 60 ? `${diffMinutes} min` : `${Math.floor(diffMinutes / 60)}h`}. O webhook responderá automaticamente assim que entrar nova venda.`,
        lastOrderMinutesAgo: diffMinutes
      };
    }
  }, [orders]);

  // 3. Today's Summary & Financial breakdown
  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => {
      const orderDate = (o.createdAt || '').slice(0, 10);
      const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
      return orderDate === today && !isCancelled;
    });

    const totalOrdersCount = todayOrders.length;
    let grossRevenue = 0;
    let totalPlatformFees = 0;
    let netRevenue = 0;
    let totalCMV = 0;
    let totalNetProfit = 0;

    const channels = {
      brendiBalcao: { count: 0, gross: 0, fees: 0, net: 0, profit: 0 },
      brendiDelivery: { count: 0, gross: 0, fees: 0, net: 0, profit: 0 },
      ifood: { count: 0, gross: 0, fees: 0, net: 0, profit: 0 },
      food99: { count: 0, gross: 0, fees: 0, net: 0, profit: 0 },
      keeta: { count: 0, gross: 0, fees: 0, net: 0, profit: 0 }
    };

    todayOrders.forEach(o => {
      const fin = calculateBrendiOrderFinancials({
        order: o,
        channelFees,
        products,
        combos,
        getProductCMV,
        getComboCMV,
        totalCfiPercent
      });

      grossRevenue += fin.grossTotal;
      totalPlatformFees += fin.feeAmount;
      netRevenue += fin.netRevenue;
      totalCMV += fin.cmvTotal;
      totalNetProfit += fin.netProfitReal;

      if (fin.channelKey === 'ifood') {
        channels.ifood.count++;
        channels.ifood.gross += fin.grossTotal;
        channels.ifood.fees += fin.feeAmount;
        channels.ifood.net += fin.netRevenue;
        channels.ifood.profit += fin.netProfitReal;
      } else if (fin.channelKey === 'food99') {
        channels.food99.count++;
        channels.food99.gross += fin.grossTotal;
        channels.food99.fees += fin.feeAmount;
        channels.food99.net += fin.netRevenue;
        channels.food99.profit += fin.netProfitReal;
      } else if (fin.channelKey === 'keeta') {
        channels.keeta.count++;
        channels.keeta.gross += fin.grossTotal;
        channels.keeta.fees += fin.feeAmount;
        channels.keeta.net += fin.netRevenue;
        channels.keeta.profit += fin.netProfitReal;
      } else if (fin.channelKey === 'brendiBalcao') {
        channels.brendiBalcao.count++;
        channels.brendiBalcao.gross += fin.grossTotal;
        channels.brendiBalcao.fees += fin.feeAmount;
        channels.brendiBalcao.net += fin.netRevenue;
        channels.brendiBalcao.profit += fin.netProfitReal;
      } else {
        channels.brendiDelivery.count++;
        channels.brendiDelivery.gross += fin.grossTotal;
        channels.brendiDelivery.fees += fin.feeAmount;
        channels.brendiDelivery.net += fin.netRevenue;
        channels.brendiDelivery.profit += fin.netProfitReal;
      }
    });

    const netProfitPercent = grossRevenue > 0 ? (totalNetProfit / grossRevenue) * 100 : 0;
    const cmvPercent = grossRevenue > 0 ? (totalCMV / grossRevenue) * 100 : 0;
    const feesPercent = grossRevenue > 0 ? (totalPlatformFees / grossRevenue) * 100 : 0;

    return {
      totalOrdersCount,
      grossRevenue,
      totalPlatformFees,
      feesPercent,
      netRevenue,
      totalCMV,
      cmvPercent,
      totalNetProfit,
      netProfitPercent,
      channels
    };
  }, [orders, channelFees, products, combos, getProductCMV, getComboCMV, totalCfiPercent]);

  // 4. Unmatched products check (Fuzzy matching with Ficha Técnica / Combos)
  const unmatchedAnalysis = useMemo(() => {
    // Map of normalized name to product or combo
    const normalizedProductMap = new Map<string, Product>();
    products.forEach(p => {
      normalizedProductMap.set(normalizeName(p.name), p);
    });

    const normalizedComboMap = new Map<string, Combo>();
    combos.forEach(c => {
      normalizedComboMap.set(normalizeName(c.name), c);
    });

    // Map of unique item names from Brendi orders
    const itemOccurrences = new Map<string, {
      rawName: string;
      normalized: string;
      totalQty: number;
      totalRevenue: number;
      foundProduct?: Product;
      foundCombo?: Combo;
      closestSuggestion?: string;
    }>();

    orders.forEach(o => {
      if (o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED') return;
      (o.items || []).forEach(item => {
        const rawName = (item.name || 'Produto').trim();
        const norm = normalizeName(rawName);
        if (!norm) return;

        const existing = itemOccurrences.get(norm) || {
          rawName,
          normalized: norm,
          totalQty: 0,
          totalRevenue: 0
        };

        existing.totalQty += item.quantity || 1;
        existing.totalRevenue += (item.totalPrice || (item.unitPrice * item.quantity) || 0);
        itemOccurrences.set(norm, existing);
      });
    });

    const matchedList: any[] = [];
    const unmatchedList: any[] = [];

    itemOccurrences.forEach(entry => {
      const prod = normalizedProductMap.get(entry.normalized);
      const combo = normalizedComboMap.get(entry.normalized);

      if (prod) {
        entry.foundProduct = prod;
        matchedList.push(entry);
      } else if (combo) {
        entry.foundCombo = combo;
        matchedList.push(entry);
      } else {
        // Try loose partial match to find suggestion
        let bestMatchName: string | undefined = undefined;
        let highestOverlap = 0;

        for (const p of products) {
          const pNorm = normalizeName(p.name);
          if (entry.normalized.includes(pNorm) || pNorm.includes(entry.normalized)) {
            bestMatchName = p.name;
            break;
          }
          // Word overlap
          const entryWords = entry.normalized.split(' ');
          const pWords = pNorm.split(' ');
          const common = entryWords.filter(w => w.length > 2 && pWords.includes(w)).length;
          if (common > highestOverlap) {
            highestOverlap = common;
            bestMatchName = p.name;
          }
        }

        entry.closestSuggestion = bestMatchName;
        unmatchedList.push(entry);
      }
    });

    return {
      totalDistinctItems: itemOccurrences.size,
      matchedCount: matchedList.length,
      unmatchedCount: unmatchedList.length,
      unmatchedList: unmatchedList.sort((a, b) => b.totalRevenue - a.totalRevenue)
    };
  }, [orders, products, combos]);

  // 5. Handle Copy Webhook
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // 6. Filtered orders list for display
  const displayedOrders = useMemo(() => {
    return orders.filter(o => {
      if (selectedChannelFilter !== 'all') {
        const { channelKey } = identifyOrderChannel(o);
        if (selectedChannelFilter === 'brendi_balcao' && channelKey !== 'brendiBalcao') return false;
        if (selectedChannelFilter === 'brendi_delivery' && channelKey !== 'brendiDelivery') return false;
        if (selectedChannelFilter === 'ifood' && channelKey !== 'ifood') return false;
        if (selectedChannelFilter === 'food99' && channelKey !== 'food99') return false;
        if (selectedChannelFilter === 'keeta' && channelKey !== 'keeta') return false;
      }

      if (orderSearchTerm.trim()) {
        const term = orderSearchTerm.toLowerCase();
        const matchesId = (o.orderId || o.id).toLowerCase().includes(term);
        const matchesCustomer = (o.customerName || '').toLowerCase().includes(term);
        const matchesItems = (o.items || []).some(i => i.name.toLowerCase().includes(term));
        return matchesId || matchesCustomer || matchesItems;
      }

      return true;
    });
  }, [orders, selectedChannelFilter, orderSearchTerm]);

  // 7. Process Orders for Selected Period
  const handleProcessPeriodOrders = () => {
    if (!startDate || !endDate) return;

    // Filter orders between startDate and endDate
    const periodOrders = orders.filter(o => {
      const oDate = (o.createdAt || '').slice(0, 10);
      const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
      return oDate >= startDate && oDate <= endDate && !isCancelled;
    });

    if (periodOrders.length === 0) {
      setProcessStatusLog(`Nenhum pedido válido encontrado entre ${startDate} e ${endDate}.`);
      return;
    }

    // Build normalization maps
    const normProdMap = new Map<string, Product>();
    products.forEach(p => normProdMap.set(normalizeName(p.name), p));

    const normComboMap = new Map<string, Combo>();
    combos.forEach(c => normComboMap.set(normalizeName(c.name), c));

    const newTransactions: SalesTransaction[] = [];
    let totalProcessedRevenue = 0;
    let totalProcessedOrders = 0;

    periodOrders.forEach(o => {
      totalProcessedOrders++;
      const orderDate = (o.createdAt || '').slice(0, 10) || todayStr;
      const { channelKey } = identifyOrderChannel(o);
      
      let mappedChannel: 'ifood' | 'food99' | 'keeta' | 'store' = 'store';
      if (channelKey === 'ifood') mappedChannel = 'ifood';
      else if (channelKey === 'food99') mappedChannel = 'food99';
      else if (channelKey === 'keeta') mappedChannel = 'keeta';
      else mappedChannel = 'store';

      const feePercent = Number(channelFees[channelKey] ?? 0);

      (o.items || []).forEach((item, itemIdx) => {
        const norm = normalizeName(item.name);
        const prod = normProdMap.get(norm);
        const combo = normComboMap.get(norm);

        const qty = item.quantity || 1;
        const unitPrice = item.unitPrice || (item.totalPrice ? item.totalPrice / qty : 0);
        const lineTotal = item.totalPrice || (unitPrice * qty);
        totalProcessedRevenue += lineTotal;

        const feePaid = unitPrice * (feePercent / 100);

        newTransactions.push({
          id: `brendi_${o.id}_${itemIdx}_${Date.now()}`,
          date: orderDate,
          orderId: o.orderId || o.id,
          productId: prod ? prod.id : (combo ? combo.id : 'temp_unregistered'),
          productName: item.name,
          qty,
          channel: mappedChannel,
          pricePaidByCustomer: unitPrice,
          platformSubsidy: 0,
          couponCostByStore: 0,
          feePaid: Number(feePaid.toFixed(2)),
          totalAmount: lineTotal,
          notes: `Importado da Brendi (${o.channel || mappedChannel}) - Taxa ${feePercent}%`
        });
      });
    });

    // Add to sales transactions
    addSalesTransactionsBatch(newTransactions);

    setProcessStatusLog(
      `Sucesso! ${totalProcessedOrders} pedidos e ${newTransactions.length} itens processados (${formatMoney(totalProcessedRevenue)}). Os valores foram incorporados no Faturamento e CMV da tela!`
    );

    setTimeout(() => {
      setShowProcessModal(false);
      setProcessStatusLog(null);
    }, 3500);
  };

  // 7.1 Processamento Oficial dos Pedidos do Mês Selecionado (Requisitos Única Fonte de Verdade)
  const handleProcessMonthOrders = async (forceOverwrite: boolean = false) => {
    if (!activeUserId) {
      alert('Usuário não autenticado.');
      return;
    }

    const targetMonth = monthToProcess;

    // 1. Verificar se já existem vendas processadas para aquele mês ou edição manual
    try {
      const existingRecords = await getSalesDataForMonth(activeUserId, targetMonth);
      const revEntry = monthlyRevenue?.find(r => r.month === targetMonth);
      const isManual = typeof revEntry === 'object' && revEntry?.isManual === true;

      if (!forceOverwrite) {
        if (isManual) {
          setConfirmModalInfo({
            targetMonth,
            isManualWarning: true,
            existingCount: existingRecords.length,
            message: `O faturamento do mês ${targetMonth} foi editado manualmente (R$ ${formatMoney(revEntry?.revenue || 0)}). Deseja realmente recalcular e sobrescrever com os dados atuais da integração com a Brendi?`
          });
          setShowConfirmRecalculateModal(true);
          return;
        }

        if (existingRecords.length > 0) {
          setConfirmModalInfo({
            targetMonth,
            isManualWarning: false,
            existingCount: existingRecords.length,
            message: `Já existem ${existingRecords.length} registros de vendas salvos para o mês ${targetMonth}. O faturamento deste mês será recalculado com base nos pedidos atuais da Brendi. Deseja continuar?`
          });
          setShowConfirmRecalculateModal(true);
          return;
        }
      }

      setShowConfirmRecalculateModal(false);
      setIsProcessingMonth(true);

      // 2. Buscar todos os pedidos da coleção brendi_orders com status igual a CONCLUDED, FINALIZADO ou DELIVERED que pertençam ao mês e ano selecionados
      const validStatuses = ['CONCLUDED', 'FINALIZADO', 'DELIVERED'];
      const monthOrders = orders.filter(o => {
        const oMonth = (o.createdAt || '').slice(0, 7);
        if (oMonth !== targetMonth) return false;
        const st = (o.status || '').toUpperCase().trim();
        return validStatuses.includes(st);
      });

      if (monthOrders.length === 0) {
        alert(`Nenhum pedido com status Concluído, Finalizado ou Entregue foi encontrado na Brendi para o mês ${targetMonth}.`);
        setIsProcessingMonth(false);
        return;
      }

      // Build normalization maps
      const normProdMap = new Map<string, Product>();
      products.forEach(p => normProdMap.set(normalizeName(p.name), p));

      const normComboMap = new Map<string, Combo>();
      combos.forEach(c => normComboMap.set(normalizeName(c.name), c));

      const salesRecords: SalesDataRecord[] = [];
      const newTransactions: SalesTransaction[] = [];
      let totalGross = 0;
      let totalCmv = 0;
      let totalFees = 0;

      monthOrders.forEach(o => {
        const orderDate = (o.createdAt || '').slice(0, 10) || `${targetMonth}-01`;
        const { channelKey } = identifyOrderChannel(o);
        
        let mappedChannel: 'ifood' | 'food99' | 'keeta' | 'store' = 'store';
        if (channelKey === 'ifood') mappedChannel = 'ifood';
        else if (channelKey === 'food99') mappedChannel = 'food99';
        else if (channelKey === 'keeta') mappedChannel = 'keeta';
        else mappedChannel = 'store';

        const feePercent = Number(channelFees[channelKey] ?? 0);

        (o.items || []).forEach((item, itemIdx) => {
          const norm = normalizeName(item.name);
          const prod = normProdMap.get(norm);
          const combo = normComboMap.get(norm);

          const qty = item.quantity || 1;
          const unitPrice = item.unitPrice || (item.totalPrice ? item.totalPrice / qty : 0);
          const lineTotal = item.totalPrice || (unitPrice * qty);

          // 3. Cruzar itens com fichas técnicas cadastradas para calcular o CMV real. Se não tiver, usar 32% como CMV estimado
          let itemCmvUnit = 0;
          if (prod) {
            itemCmvUnit = getProductCMV(prod);
          } else if (combo) {
            itemCmvUnit = getComboCMV(combo);
          } else {
            itemCmvUnit = unitPrice * 0.32;
          }
          const lineCmv = itemCmvUnit * qty;

          // 4. Aplicar taxas de canal corretas
          const lineFee = lineTotal * (feePercent / 100);

          totalGross += lineTotal;
          totalCmv += lineCmv;
          totalFees += lineFee;

          const recId = `brendi_${o.id}_${itemIdx}_${Date.now()}`;

          salesRecords.push({
            id: recId,
            userId: activeUserId,
            date: orderDate,
            month: targetMonth,
            referenceMonth: targetMonth,
            channel: mappedChannel,
            productName: item.name,
            productId: prod ? prod.id : (combo ? combo.id : 'temp_unregistered'),
            qty,
            unitPrice,
            grossRevenue: lineTotal,
            cmv: lineCmv,
            channelFee: lineFee,
            source: 'Brendi',
            notes: `Brendi (${o.channel || mappedChannel}) - Taxa ${feePercent}%`,
            createdAt: new Date().toISOString()
          });

          newTransactions.push({
            id: recId,
            date: orderDate,
            orderId: o.orderId || o.id,
            productId: prod ? prod.id : (combo ? combo.id : 'temp_unregistered'),
            productName: item.name,
            qty,
            channel: mappedChannel,
            pricePaidByCustomer: unitPrice,
            platformSubsidy: 0,
            couponCostByStore: 0,
            feePaid: Number((lineFee / qty).toFixed(2)),
            totalAmount: lineTotal,
            notes: `Importado da Brendi (${o.channel || mappedChannel}) - Taxa ${feePercent}%`
          });
        });
      });

      // 6. Salvar todos esses registros na coleção única sales_data do Firestore associados ao mês e ano selecionados
      if (forceOverwrite) {
        await deleteSalesDataByMonth(activeUserId, targetMonth);
      }
      await saveSalesDataBatch(salesRecords, activeUserId);

      // Adicionar transações ao estado do app
      addSalesTransactionsBatch(newTransactions);

      // 7. Atualizar o faturamento daquele mês na aba de Faturamento com o valor bruto total calculado pela integração
      updateMonthlyRevenueFromIntegration(
        targetMonth, 
        totalGross, 
        { source: 'Brendi', updatedAt: new Date().toISOString() }, 
        true
      );

      // 8. Exibir resumo de processamento
      const cfiCost = totalGross * (totalCfiPercent / 100);
      const netProfitEstimated = totalGross - totalCmv - totalFees - cfiCost;

      setProcessResultSummary({
        targetMonth,
        count: monthOrders.length,
        grossRevenue: totalGross,
        totalCmv,
        netProfitEstimated
      });
      setShowProcessSuccessModal(true);

    } catch (err: any) {
      console.error('Erro ao processar pedidos da Brendi:', err);
      alert('Erro no processamento: ' + err.message);
    } finally {
      setIsProcessingMonth(false);
    }
  };

  // Helper for mock test order insertion (development testing)
  const handleInsertTestOrder = async () => {
    if (!activeUserId) return;
    try {
      const mockId = `brendi_test_${Date.now()}`;
      const sampleProducts = products.length > 0 ? products : [{ name: 'Hambúrguer Artesanal', id: '1' }, { name: 'Batata Frita Rústica', id: '2' }];
      const chosenProd = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];

      const mockOrder: BrendiOrder = {
        id: mockId,
        orderId: mockId.slice(-6).toUpperCase(),
        createdAt: new Date().toISOString(),
        channel: Math.random() > 0.5 ? 'Brendi Delivery' : 'Brendi Balcão',
        merchantId: 'af48a2e0-7850-4d49-b2f2-c254c9b5880e',
        items: [
          {
            name: chosenProd.name,
            quantity: 1,
            unitPrice: 38.5,
            totalPrice: 38.5
          },
          {
            name: 'Refrigerante Lata',
            quantity: 1,
            unitPrice: 6.0,
            totalPrice: 6.0
          }
        ],
        total: 44.5,
        status: 'CONCLUDED',
        customerName: 'Cliente Teste Brendi',
        customerPhone: '(11) 99999-8888',
        userId: activeUserId
      };

      const docRef = doc(db, 'users', activeUserId, 'brendi_orders', mockId);
      await setDoc(docRef, mockOrder);
    } catch (e: any) {
      alert('Erro ao enviar pedido teste: ' + e.message);
    }
  };

  if (!checkingConfig && hasConfiguredBrendi === false && orders.length === 0 && (brendiOrders || []).length === 0) {
    return (
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center mx-auto">
          <BrendiLogo className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Integração não configurada
          </span>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Você ainda não configurou a integração com a Brendi
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            Para receber seus pedidos em tempo real via OpenDelivery diretamente do seu PDV ou delivery, você precisa cadastrar o Store UUID e a Chave Secreta da sua loja.
          </p>
        </div>

        <div className="p-4 bg-purple-50/70 dark:bg-purple-950/20 rounded-xl border border-purple-200/60 dark:border-purple-900/30 text-xs text-purple-900 dark:text-purple-200 text-left space-y-1.5 max-w-md mx-auto">
          <div className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Como configurar em 2 passos:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-purple-800 dark:text-purple-300">
            <li>Acesse a página de <strong>Integrações</strong> no menu lateral.</li>
            <li>Cadastre seu <strong>Store UUID</strong> e <strong>Chave Secreta</strong> gerados na Brendi.</li>
          </ol>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              if (onNavigateToIntegrations) {
                onNavigateToIntegrations();
              } else {
                window.dispatchEvent(new CustomEvent('change-tab', { detail: 'integrations' }));
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/20 transition transform active:scale-95 cursor-pointer"
          >
            <Plug className="w-4 h-4" />
            Configurar agora
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHasConfiguredBrendi(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            Ver Feed de Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Top Status Banner */}
      <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
        statusInfo.isActive
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-900/60'
          : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5">
            <div className="relative mt-1 md:mt-0 shrink-0">
              <span className={`flex h-4 w-4 rounded-full ${statusInfo.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {statusInfo.isActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 top-0 left-0"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm md:text-base tracking-wide uppercase ${
                  statusInfo.isActive ? 'text-emerald-900 dark:text-emerald-300' : 'text-red-900 dark:text-red-300'
                }`}>
                  {statusInfo.message}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/70 dark:bg-black/30 border border-current/20">
                  OpenDelivery Abrasel
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {statusInfo.subtext}
              </p>
            </div>
          </div>

          {/* Quick actions: Period processing & Verification */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowProcessModal(true)}
              className="px-3.5 py-2 bg-brand-red hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              Processar Pedidos do Período
            </button>

            <button
              onClick={() => setShowUnmatchedModal(true)}
              className={`px-3.5 py-2 font-black text-xs uppercase tracking-wider rounded-xl border transition flex items-center gap-1.5 ${
                unmatchedAnalysis.unmatchedCount > 0
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Verificar Produtos Não Encontrados
              {unmatchedAnalysis.unmatchedCount > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {unmatchedAnalysis.unmatchedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Webhook URL Box */}
        <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 truncate">
            <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px] shrink-0">URL do Webhook:</span>
            <code className="bg-white/80 dark:bg-black/40 px-2.5 py-1 rounded border border-gray-300/50 dark:border-gray-700 font-mono text-[11px] text-gray-800 dark:text-gray-200 truncate select-all">
              {WEBHOOK_URL}
            </code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyWebhook}
              className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-bold text-[11px] flex items-center gap-1 transition"
              title="Copiar URL para colar na Brendi"
            >
              {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedWebhook ? 'Copiado!' : 'Copiar URL'}
            </button>
            <a
              href="https://app.brendi.com.br/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-gray-500 hover:text-brand-red font-bold text-[11px] flex items-center gap-1 transition underline"
            >
              Painel Brendi <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. PAINEL OFICIAL DE PROCESSAMENTO DE VENDAS DO MÊS (ÚNICA FONTE DE VERDADE) */}
      <div className="bg-gradient-to-r from-purple-900/90 via-slate-900 to-purple-950 border-2 border-purple-500/60 rounded-2xl p-4 sm:p-5 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Processar Pedidos e Consolidar Faturamento do Mês
              </h3>
              <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-wider border border-purple-400/40">
                Oficial
              </span>
            </div>
            <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
              Calcula o CMV real dos itens via fichas técnicas (ou 32% estimado), desconta as taxas por canal, consolida na base única <code className="text-purple-300 bg-purple-950/80 px-1 py-0.5 rounded font-mono">sales_data</code> e atualiza a aba Faturamento automaticamente.
            </p>
          </div>

          {/* Month selector & Process Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center bg-slate-950/80 border border-purple-400/40 rounded-xl px-2 py-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  const [y, m] = monthToProcess.split('-').map(Number);
                  const prev = new Date(y, m - 2, 1);
                  const newM = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
                  setMonthToProcess(newM);
                }}
                className="p-1 text-purple-300 hover:text-white transition"
                title="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="month"
                value={monthToProcess}
                onChange={(e) => setMonthToProcess(e.target.value)}
                className="bg-transparent text-white text-xs font-bold px-2 py-0.5 border-none focus:outline-none focus:ring-0 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  const [y, m] = monthToProcess.split('-').map(Number);
                  const next = new Date(y, m, 1);
                  const newM = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
                  setMonthToProcess(newM);
                }}
                className="p-1 text-purple-300 hover:text-white transition"
                title="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              id="btn-processar-pedidos-mes"
              disabled={isProcessingMonth}
              onClick={() => handleProcessMonthOrders(false)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition transform active:scale-95 disabled:opacity-50"
            >
              {isProcessingMonth ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-current" />
                  <span>Processar Pedidos do Mês</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informação sobre os pedidos elegíveis deste mês */}
        <div className="mt-3 pt-3 border-t border-purple-500/30 flex flex-wrap items-center justify-between gap-2 text-xs text-purple-200">
          <div className="flex items-center gap-4">
            <span>
              Mês selecionado: <strong className="text-white font-bold">{monthToProcess}</strong>
            </span>
            <span>
              Pedidos concluídos disponíveis: <strong className="text-white font-bold">
                {orders.filter(o => {
                  const oMonth = (o.createdAt || '').slice(0, 7);
                  if (oMonth !== monthToProcess) return false;
                  const st = (o.status || '').toUpperCase().trim();
                  return ['CONCLUDED', 'FINALIZADO', 'DELIVERED'].includes(st);
                }).length}
              </strong>
            </span>
            <span>
              Total bruto em pedidos: <strong className="text-emerald-300 font-bold">
                {formatMoney(
                  orders.filter(o => {
                    const oMonth = (o.createdAt || '').slice(0, 7);
                    if (oMonth !== monthToProcess) return false;
                    const st = (o.status || '').toUpperCase().trim();
                    return ['CONCLUDED', 'FINALIZADO', 'DELIVERED'].includes(st);
                  }).reduce((acc, o) => acc + (Number(o.total) || 0), 0)
                )}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80">
            *Atualiza instantaneamente Faturamento, CMV e o DRE de Lucro Real
          </span>
        </div>
      </div>

      {/* 2. Today's Summary Metric Cards */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Faturamento Bruto */}
          <div className="bg-white dark:bg-[#1e293b]/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Faturamento Bruto</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white font-mono">
                {formatMoney(todaySummary.grossRevenue)}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1">
              {todaySummary.totalOrdersCount} {todaySummary.totalOrdersCount === 1 ? 'pedido hoje' : 'pedidos hoje'}
            </p>
          </div>

          {/* Total Taxas de Plataforma */}
          <div className="bg-white dark:bg-[#1e293b]/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 dark:text-red-400 block">Taxas de Plataforma</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg md:text-xl font-black text-red-600 dark:text-red-400 font-mono">
                {todaySummary.totalPlatformFees > 0 ? `-${formatMoney(todaySummary.totalPlatformFees)}` : 'R$ 0,00'}
              </span>
            </div>
            <p className="text-[10px] text-red-500/80 font-bold mt-1">
              {formatPercent(todaySummary.feesPercent)} do faturamento
            </p>
          </div>

          {/* Faturamento Líquido */}
          <div className="bg-white dark:bg-[#1e293b]/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 block">Faturamento Líquido</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg md:text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {formatMoney(todaySummary.netRevenue)}
              </span>
            </div>
            <p className="text-[10px] text-blue-500/80 font-bold mt-1">
              Repasse real estimado
            </p>
          </div>

          {/* CMV Total */}
          <div className="bg-white dark:bg-[#1e293b]/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400 block">CMV dos Produtos</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg md:text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatMoney(todaySummary.totalCMV)}
              </span>
            </div>
            <p className="text-[10px] text-amber-500/80 font-bold mt-1">
              {formatPercent(todaySummary.cmvPercent)} do faturamento
            </p>
          </div>

          {/* Lucro Líquido Real */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Lucro Real no Bolso</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">Líquido</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-lg md:text-xl font-black font-mono ${todaySummary.totalNetProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                {formatMoney(todaySummary.totalNetProfit)}
              </span>
            </div>
            <p className={`text-[10px] font-bold mt-1 ${todaySummary.totalNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              Margem: {formatPercent(todaySummary.netProfitPercent)}
            </p>
          </div>
        </div>

        {/* Channel breakdown bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs bg-gray-50 dark:bg-[#1a2333]/50 p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 shrink-0">Canais Hoje:</span>
          
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-mono">
            <Store className="w-3 h-3 text-purple-600" /> Balcão ({channelFees.brendiBalcao}%): <strong>{formatMoney(todaySummary.channels.brendiBalcao.gross)}</strong> ({todaySummary.channels.brendiBalcao.count})
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-mono">
            <BrendiLogo className="w-3 h-3" /> Delivery ({channelFees.brendiDelivery}%): <strong>{formatMoney(todaySummary.channels.brendiDelivery.gross)}</strong> ({todaySummary.channels.brendiDelivery.count})
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-mono">
            <IFoodLogo className="w-3 h-3" /> iFood ({channelFees.ifood}%): <strong>{formatMoney(todaySummary.channels.ifood.gross)}</strong> ({todaySummary.channels.ifood.count})
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-mono">
            <Food99Logo className="w-3 h-3" /> 99Food ({channelFees.food99}%): <strong>{formatMoney(todaySummary.channels.food99.gross)}</strong> ({todaySummary.channels.food99.count})
          </span>

          {channelFees.keeta > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-mono">
              <KeetaLogo className="w-3 h-3" /> Keeta ({channelFees.keeta}%): <strong>{formatMoney(todaySummary.channels.keeta.gross)}</strong> ({todaySummary.channels.keeta.count})
            </span>
          )}

          {onNavigateToIntegrations && (
            <button
              onClick={onNavigateToIntegrations}
              className="ml-auto text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1"
            >
              <Percent className="w-3 h-3" /> Ajustar Taxas
            </button>
          )}
        </div>
      </div>

      {/* 3. Orders List and Controls */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand-red" />
              Pedidos Recebidos da Brendi em Tempo Real
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Transmitidos via OpenDelivery da Abrasel com cálculo detalhado de taxas e lucro real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Channel filter */}
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg px-2.5 py-1.5 font-bold outline-none"
            >
              <option value="all">Todos os Canais</option>
              <option value="brendi_balcao">Brendi Balcão</option>
              <option value="brendi_delivery">Brendi Delivery</option>
              <option value="ifood">iFood</option>
              <option value="food99">99Food</option>
              <option value="keeta">Keeta</option>
            </select>

            {/* Search filter */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                placeholder="Buscar pedido, cliente..."
                className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-brand-red w-44"
              />
            </div>

            {/* Simulation button for tests if empty */}
            {orders.length === 0 && (
              <button
                onClick={handleInsertTestOrder}
                className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg transition"
                title="Gera um pedido mock no banco para testar a interface"
              >
                + Gerar Pedido Teste
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-red mb-2" />
            <span className="text-xs font-bold">Conectando ao Firestore da Brendi...</span>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6">
            <Radio className="h-10 w-10 text-gray-400 mx-auto mb-2 opacity-60" />
            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">Nenhum pedido encontrado</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              Assim que o PDV ou delivery da Brendi registrar uma venda, o pedido aparecerá aqui automaticamente em segundos.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={handleInsertTestOrder}
                className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-red-700 transition"
              >
                Simular Pedido de Teste
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="pb-2.5">ID / Hora</th>
                  <th className="pb-2.5">Canal</th>
                  <th className="pb-2.5">Produtos Vendidos</th>
                  <th className="pb-2.5 text-right">Valor Bruto</th>
                  <th className="pb-2.5 text-right">Taxas (Canal)</th>
                  <th className="pb-2.5 text-right">Valor Líquido</th>
                  <th className="pb-2.5 text-right">CMV Insumos</th>
                  <th className="pb-2.5 text-right">Lucro Real</th>
                  <th className="pb-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {displayedOrders.map(order => {
                  const dateObj = new Date(order.createdAt);
                  const timeFormatted = isNaN(dateObj.getTime())
                    ? order.createdAt
                    : dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' (' + dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ')';

                  const isCancelled = order.status === 'CANCELLED' || order.status === 'CANCELLATION_REQUESTED';

                  const fin = calculateBrendiOrderFinancials({
                    order,
                    channelFees,
                    products,
                    combos,
                    getProductCMV,
                    getComboCMV,
                    totalCfiPercent
                  });

                  return (
                    <tr key={order.id} className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition ${isCancelled ? 'opacity-50 line-through' : ''}`}>
                      {/* ID / Hora */}
                      <td className="py-3 font-mono">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          #{order.orderId || order.id.slice(-6)}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {timeFormatted}
                        </span>
                      </td>

                      {/* Canal */}
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          fin.channelKey === 'ifood'
                            ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                            : fin.channelKey === 'food99'
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                            : fin.channelKey === 'keeta'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300'
                        }`}>
                          {fin.channelLabel}
                        </span>
                        {order.customerName && (
                          <span className="block text-[10px] text-gray-400 mt-0.5 truncate max-w-[130px]">
                            {order.customerName}
                          </span>
                        )}
                      </td>

                      {/* Produtos Vendidos */}
                      <td className="py-3">
                        <div className="space-y-0.5 max-w-sm">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                              <span className="font-bold text-gray-900 dark:text-white">{item.quantity}x</span>
                              <span className="truncate">{item.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                ({formatMoney(item.unitPrice)})
                              </span>
                            </div>
                          ))}
                          {(order.items || []).length === 0 && (
                            <span className="text-gray-400 text-[11px] italic">Sem itens detalhados</span>
                          )}
                        </div>
                      </td>

                      {/* Valor Bruto */}
                      <td className="py-3 text-right font-mono font-bold text-gray-900 dark:text-white text-xs">
                        {formatMoney(fin.grossTotal)}
                      </td>

                      {/* Taxas Descontadas */}
                      <td className="py-3 text-right font-mono text-xs">
                        {fin.feeAmount > 0 ? (
                          <div>
                            <span className="text-red-600 dark:text-red-400 font-bold block">
                              -{formatMoney(fin.feeAmount)}
                            </span>
                            <span className="text-[10px] text-gray-400 block font-normal">
                              ({fin.feePercent}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">R$ 0,00 (0%)</span>
                        )}
                      </td>

                      {/* Valor Líquido */}
                      <td className="py-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {formatMoney(fin.netRevenue)}
                      </td>

                      {/* CMV dos Produtos */}
                      <td className="py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                        {formatMoney(fin.cmvTotal)}
                      </td>

                      {/* Lucro Real no Bolso */}
                      <td className="py-3 text-right font-mono text-xs">
                        <div className={`font-black ${fin.isProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatMoney(fin.netProfitReal)}
                        </div>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                          fin.isProfitPositive 
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                        }`}>
                          {formatPercent(fin.netProfitPercent)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                            : order.status === 'CONCLUDED' || order.status === 'DELIVERED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal: Process Period Orders */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-base uppercase text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-red" />
                  Processar Pedidos do Período
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selecione o intervalo de datas para calcular automaticamente o CMV e transferir as vendas para o módulo financeiro.
                </p>
              </div>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Shortcut chips */}
            <div className="flex gap-2">
              <button
                onClick={() => { setStartDate(todayStr); setEndDate(todayStr); }}
                className="px-2.5 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200"
              >
                Hoje
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  setStartDate(d.toISOString().slice(0, 10));
                  setEndDate(todayStr);
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200"
              >
                Últimos 7 Dias
              </button>
              <button
                onClick={() => {
                  const firstDay = todayStr.slice(0, 7) + '-01';
                  setStartDate(firstDay);
                  setEndDate(todayStr);
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200"
              >
                Mês Atual
              </button>
            </div>

            {processStatusLog && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold leading-relaxed border border-emerald-200 dark:border-emerald-900">
                {processStatusLog}
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs space-y-1 text-gray-600 dark:text-gray-300">
              <span className="font-bold uppercase tracking-wider text-[10px] block text-brand-red">O que acontece ao processar:</span>
              <p>• O sistema busca cada produto nas Fichas Técnicas para calcular o custo exato de insumos (CMV).</p>
              <p>• O Faturamento Bruto, CMV e CFI serão atualizados na tela de Integrar Vendas.</p>
              <p>• Pedidos cancelados são ignorados para não distorcer o caixa.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowProcessModal(false)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessPeriodOrders}
                className="flex-1 py-2.5 bg-brand-red hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                Processar e Alimentar Vendas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Unmatched Products Verification */}
      {showUnmatchedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start shrink-0">
              <div>
                <h3 className="font-black text-base uppercase text-gray-900 dark:text-white flex items-center gap-2">
                  <Search className="h-5 w-5 text-brand-red" />
                  Verificação de Produtos da Brendi vs Ficha Técnica
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Comparação inteligente (ignora maiúsculas, minúsculas, acentos e espaços extras) para garantir o cálculo correto do CMV.
                </p>
              </div>
              <button
                onClick={() => setShowUnmatchedModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {unmatchedAnalysis.unmatchedCount === 0 ? (
                <div className="py-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 p-6">
                  <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-black text-sm text-emerald-800 dark:text-emerald-300 uppercase">
                    Tudo 100% Mapeado!
                  </h4>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                    Todos os {unmatchedAnalysis.matchedCount} produtos vendidos na Brendi foram encontrados nas Fichas Técnicas ou Combos cadastrados. Seu CMV será calculado com total exatidão!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-bold block mb-0.5">
                      ⚠️ Atenção: {unmatchedAnalysis.unmatchedCount} {unmatchedAnalysis.unmatchedCount === 1 ? 'produto não foi encontrado' : 'produtos não foram encontrados'}:
                    </span>
                    Para que o CMV e o lucro sejam calculados com precisão cirúrgica, ajuste o nome do produto na Brendi ou cadastre uma Ficha Técnica com o mesmo nome.
                  </div>

                  <div className="space-y-2">
                    {unmatchedAnalysis.unmatchedList.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white text-xs">
                              {item.rawName}
                            </span>
                            <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-bold uppercase">
                              Não Encontrado
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Vendidos: <strong className="text-gray-700 dark:text-gray-300">{item.totalQty}x</strong> • Faturamento: <strong className="text-gray-700 dark:text-gray-300">{formatMoney(item.totalRevenue)}</strong>
                          </p>
                          {item.closestSuggestion && (
                            <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1 font-semibold">
                              <Sparkles className="h-3 w-3" />
                              Sugestão no sistema: &quot;{item.closestSuggestion}&quot;
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-[10px] text-gray-400 block">
                            Dica: use &quot;Renomear Produtos&quot;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowUnmatchedModal(false)}
                className="px-5 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-black uppercase rounded-xl hover:opacity-90 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Recálculo do Faturamento */}
      {showConfirmRecalculateModal && confirmModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle size={26} />
              <h3 className="text-base font-black uppercase tracking-tight">
                {confirmModalInfo.isManualWarning ? 'Atenção: Faturamento Editado Manualmente' : 'Recalcular Faturamento do Mês?'}
              </h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {confirmModalInfo.message}
            </p>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-400">
              <div>Mês de referência: <strong className="text-white">{confirmModalInfo.targetMonth}</strong></div>
              <div>Registros atuais existentes: <strong className="text-white">{confirmModalInfo.existingCount}</strong></div>
              {confirmModalInfo.isManualWarning && (
                <div className="text-amber-400 font-bold">
                  *A edição manual será substituída pelo valor bruto total apurado na integração da Brendi.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmRecalculateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleProcessMonthOrders(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-purple-600/30"
              >
                Sim, Recalcular e Sobrescrever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resumo de Sucesso do Processamento */}
      {showProcessSuccessModal && processResultSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Pedidos Processados com Sucesso!
                </h3>
                <p className="text-xs text-slate-400">
                  Dados consolidados na base única e sincronizados com a aba Faturamento para o mês <strong className="text-white">{processResultSummary.targetMonth}</strong>.
                </p>
              </div>
            </div>

            {/* Scorecard de Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Pedidos Processados
                </span>
                <span className="text-xl font-black text-white font-mono mt-1 block">
                  {processResultSummary.count} pedidos
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  Status concluído / entregue
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Faturamento Bruto
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
                  {formatMoney(processResultSummary.grossRevenue)}
                </span>
                <span className="text-[10px] text-slate-400">
                  Atualizado em Faturamento
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  CMV Total dos Insumos
                </span>
                <span className="text-xl font-black text-red-400 font-mono mt-1 block">
                  {formatMoney(processResultSummary.totalCmv)}
                </span>
                <span className="text-[10px] text-slate-400">
                  Via Fichas Técnicas
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Lucro Líquido Estimado
                </span>
                <span className={`text-xl font-black font-mono mt-1 block ${
                  processResultSummary.netProfitEstimated >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {formatMoney(processResultSummary.netProfitEstimated)}
                </span>
                <span className="text-[10px] text-slate-400">
                  Descontando taxas e CFI
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-brand-yellow font-bold">Tudo pronto:</strong> O faturamento e o CMV já estão refletidos nas abas de <em>Faturamento</em>, <em>Lucro Atual</em> e no <em>Ranking de Vendas</em>!
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowProcessSuccessModal(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
              >
                Concluir e Ver Resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
