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
  ShoppingBag
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Product, Combo, SalesTransaction, BrendiOrder, BrendiOrderItem } from '../types';
import { formatMoney, formatPercent } from '../constants';
import { BrendiLogo, IFoodLogo, Food99Logo } from './PlatformLogos';

interface BrendiRealtimeTabProps {
  products: Product[];
  combos: Combo[];
  getProductCMV: (prod: Product) => number;
  getComboCMV: (combo: any) => number;
  addSalesTransactionsBatch: (transactions: SalesTransaction[]) => void;
  totalCfiPercent: number;
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
  totalCfiPercent
}) => {
  const { user, emulatedUser } = useAuth();
  const activeUserId = emulatedUser ? emulatedUser.userId : (user ? user.uid : null);

  const [orders, setOrders] = useState<BrendiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

  // Period filtering for processing
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [processStatusLog, setProcessStatusLog] = useState<string | null>(null);

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

  // 3. Today's Summary & Channel distribution
  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => {
      const orderDate = (o.createdAt || '').slice(0, 10);
      const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
      return orderDate === today && !isCancelled;
    });

    const totalOrdersCount = todayOrders.length;
    const grossRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const channels = {
      brendiBalcao: { count: 0, total: 0 },
      brendiDelivery: { count: 0, total: 0 },
      ifood: { count: 0, total: 0 },
      food99: { count: 0, total: 0 }
    };

    todayOrders.forEach(o => {
      const ch = (o.channel || '').toLowerCase();
      if (ch.includes('ifood')) {
        channels.ifood.count += 1;
        channels.ifood.total += o.total;
      } else if (ch.includes('99') || ch.includes('food99')) {
        channels.food99.count += 1;
        channels.food99.total += o.total;
      } else if (ch.includes('balc') || ch.includes('balcao') || ch.includes('indoor')) {
        channels.brendiBalcao.count += 1;
        channels.brendiBalcao.total += o.total;
      } else {
        channels.brendiDelivery.count += 1;
        channels.brendiDelivery.total += o.total;
      }
    });

    return {
      totalOrdersCount,
      grossRevenue,
      channels
    };
  }, [orders]);

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
        const ch = (o.channel || '').toLowerCase();
        if (selectedChannelFilter === 'brendi_balcao' && !ch.includes('balc') && !ch.includes('indoor')) return false;
        if (selectedChannelFilter === 'brendi_delivery' && (ch.includes('balc') || !ch.includes('brendi'))) return false;
        if (selectedChannelFilter === 'ifood' && !ch.includes('ifood')) return false;
        if (selectedChannelFilter === 'food99' && !ch.includes('99')) return false;
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
      const ch = (o.channel || '').toLowerCase();
      
      let mappedChannel: 'ifood' | 'food99' | 'keeta' | 'store' = 'store';
      let feePercent = 3.0; // Default balcão/delivery

      if (ch.includes('ifood')) {
        mappedChannel = 'ifood';
        feePercent = 17.1;
      } else if (ch.includes('99') || ch.includes('food99')) {
        mappedChannel = 'food99';
        feePercent = 12.1;
      }

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
          notes: `Importado da Brendi (${o.channel})`
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

      {/* 2. Today's Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-[#1e293b]/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Hoje (Brendi)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-gray-900 dark:text-white font-mono">
              {todaySummary.totalOrdersCount}
            </span>
            <span className="text-xs text-gray-400">pedidos</span>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            Faturamento: {formatMoney(todaySummary.grossRevenue)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e293b]/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <BrendiLogo className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Brendi Balcão</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white font-mono">
              {formatMoney(todaySummary.channels.brendiBalcao.total)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-1">
            {todaySummary.channels.brendiBalcao.count} {todaySummary.channels.brendiBalcao.count === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e293b]/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <BrendiLogo className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Brendi Delivery</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white font-mono">
              {formatMoney(todaySummary.channels.brendiDelivery.total)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-1">
            {todaySummary.channels.brendiDelivery.count} {todaySummary.channels.brendiDelivery.count === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e293b]/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <IFoodLogo className="w-3.5 h-3.5" />
            <Food99Logo className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">iFood & 99Food</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white font-mono">
              {formatMoney(todaySummary.channels.ifood.total + todaySummary.channels.food99.total)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-1">
            {todaySummary.channels.ifood.count + todaySummary.channels.food99.count} pedidos integrados
          </p>
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
              Transmitidos diretamente via OpenDelivery da Abrasel.
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
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="pb-2.5">ID / Hora</th>
                  <th className="pb-2.5">Canal</th>
                  <th className="pb-2.5">Produtos Vendidos</th>
                  <th className="pb-2.5 text-right">Valor Total</th>
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

                  return (
                    <tr key={order.id} className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition ${isCancelled ? 'opacity-50 line-through' : ''}`}>
                      <td className="py-3 font-mono">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          #{order.orderId || order.id.slice(-6)}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {timeFormatted}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.channel?.toLowerCase().includes('ifood')
                            ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                            : order.channel?.toLowerCase().includes('99')
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                            : 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300'
                        }`}>
                          {order.channel}
                        </span>
                        {order.customerName && (
                          <span className="block text-[10px] text-gray-400 mt-0.5 truncate max-w-[130px]">
                            {order.customerName}
                          </span>
                        )}
                      </td>

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

                      <td className="py-3 text-right font-mono font-black text-gray-900 dark:text-white text-sm">
                        {formatMoney(order.total)}
                      </td>

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
    </div>
  );
};
