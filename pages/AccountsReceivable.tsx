import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  AccountReceivable, 
  ReceivableOrigin, 
  ReceivableStatus, 
  ReceivablePaymentMethod, 
  AccountReceivablePayment 
} from '../types';
import { formatMoney } from '../constants';
import { 
  Coins, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  Edit2, 
  X, 
  User, 
  Phone, 
  FileText, 
  ArrowUpRight, 
  DollarSign,
  Building2,
  Store,
  ChevronRight,
  Eye,
  History
} from 'lucide-react';

const ORIGIN_LABELS: Record<ReceivableOrigin, string> = {
  fiado: 'Fiado / Cliente',
  ifood: 'iFood',
  '99food': '99Food',
  keeta: 'Keeta',
  brendi: 'Brendi',
  empresa: 'Venda para empresa',
  evento: 'Evento / Encomenda',
  outro: 'Outro'
};

const ORIGIN_BADGE_COLORS: Record<ReceivableOrigin, string> = {
  fiado: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  ifood: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  '99food': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  keeta: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  brendi: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  empresa: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  evento: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  outro: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
};

const PAYMENT_METHOD_LABELS: Record<ReceivablePaymentMethod, string> = {
  pix: 'PIX ⚡',
  dinheiro: 'Dinheiro 💵',
  cartao_credito: 'Cartão de Crédito 💳',
  cartao_debito: 'Cartão de Débito 💳',
  transferencia: 'Transferência 🏦',
  outro: 'Outro 📄'
};

export const AccountsReceivable: React.FC = () => {
  const { 
    accountsReceivable = [], 
    customReceivableOrigins = [],
    addAccountReceivable, 
    updateAccountReceivable, 
    markAccountReceivableAsReceived, 
    deleteAccountReceivable,
    addReceivablePayment,
    deleteReceivablePayment,
    addCustomReceivableOrigin,
    updateCustomReceivableOrigin,
    toggleCustomReceivableOriginStatus,
    deleteCustomReceivableOrigin
  } = useApp();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AccountReceivable | null>(null);
  const [detailItem, setDetailItem] = useState<AccountReceivable | null>(null);

  // Manage Origins Modal State
  const [isManageOriginsOpen, setIsManageOriginsOpen] = useState(false);
  const [newOriginName, setNewOriginName] = useState('');
  const [originModalError, setOriginModalError] = useState('');
  const [editingOriginId, setEditingOriginId] = useState<string | null>(null);
  const [editingOriginName, setEditingOriginName] = useState('');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    origin: { id: string; name: string; active: boolean };
    isUsed: boolean;
  } | null>(null);

  // Add Payment / Receive Modal State
  const [receivingItem, setReceivingItem] = useState<
    (AccountReceivable & { payments: AccountReceivablePayment[]; paidAmount: number; remainingAmount: number }) | null
  >(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<ReceivablePaymentMethod>('pix');
  const [receivedDateInput, setReceivedDateInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nextDueDateInput, setNextDueDateInput] = useState<string>('');
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>('');
  const [receiveModalError, setReceiveModalError] = useState<string>('');
  const [excessPaymentConfirm, setExcessPaymentConfirm] = useState<boolean>(false);

  // Form State
  const [origin, setOrigin] = useState<ReceivableOrigin>('ifood');
  const [customOrigin, setCustomOrigin] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Filters State
  const [statusFilter, setStatusFilter] = useState<'todos' | 'a_receber' | 'parcial' | 'atrasado' | 'recebido'>('todos');
  const [originFilter, setOriginFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'todos' | 'hoje' | 'semana' | 'mes'>('todos');

  // Check if redirected from Dashboard Overdue alert
  useEffect(() => {
    const showOverdue = sessionStorage.getItem('filter_overdue_receivables');
    if (showOverdue === 'true') {
      setStatusFilter('atrasado');
      sessionStorage.removeItem('filter_overdue_receivables');
    }
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Compute calculated items with dynamic auto status and partial payment totals
  const processedReceivables = useMemo(() => {
    return accountsReceivable.map(item => {
      const payments = Array.isArray(item.payments) ? item.payments : [];
      const paidAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const remainingAmount = Math.max(0, item.amount - paidAmount);

      let computedStatus: ReceivableStatus = item.status;
      if (remainingAmount <= 0 || item.status === 'recebido') {
        computedStatus = 'recebido';
      } else if (paidAmount > 0) {
        computedStatus = 'parcial';
      } else {
        if (item.dueDate < todayStr) {
          computedStatus = 'atrasado';
        } else {
          computedStatus = 'a_receber';
        }
      }

      return {
        ...item,
        payments,
        paidAmount,
        remainingAmount,
        computedStatus
      };
    });
  }, [accountsReceivable, todayStr]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalAReceber = 0;
    let totalVencido = 0;
    let totalProximos = 0;
    let totalRecebido = 0;

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().slice(0, 10);

    processedReceivables.forEach(item => {
      totalRecebido += item.paidAmount;

      if (item.computedStatus !== 'recebido') {
        totalAReceber += item.remainingAmount;
        if (item.computedStatus === 'atrasado') {
          totalVencido += item.remainingAmount;
        }
        if (item.dueDate >= todayStr && item.dueDate <= sevenDaysStr) {
          totalProximos += item.remainingAmount;
        }
      }
    });

    return { totalAReceber, totalVencido, totalProximos, totalRecebido };
  }, [processedReceivables, todayStr]);

  // Manage Origins Handlers
  const handleAddCustomOrigin = (e: React.FormEvent) => {
    e.preventDefault();
    setOriginModalError('');
    const trimmed = newOriginName.trim();
    if (!trimmed) {
      setOriginModalError('Informe o nome da origem.');
      return;
    }
    const success = addCustomReceivableOrigin(trimmed);
    if (!success) {
      setOriginModalError('Esta origem já existe ou é um nome reservado.');
      return;
    }
    setNewOriginName('');
  };

  const handleStartEditCustomOrigin = (id: string, currentName: string) => {
    setEditingOriginId(id);
    setEditingOriginName(currentName);
    setOriginModalError('');
  };

  const handleSaveEditCustomOrigin = (id: string) => {
    setOriginModalError('');
    const trimmed = editingOriginName.trim();
    if (!trimmed) {
      setOriginModalError('O nome não pode ficar em branco.');
      return;
    }
    const success = updateCustomReceivableOrigin(id, trimmed);
    if (!success) {
      setOriginModalError('Nome inválido ou já existente.');
      return;
    }
    setEditingOriginId(null);
    setEditingOriginName('');
  };

  const handleRequestDeleteCustomOrigin = (cro: { id: string; name: string; active: boolean }) => {
    setOriginModalError('');
    const isUsed = accountsReceivable.some(ar => ar.customOrigin === cro.name || (ar.origin as string) === cro.id);
    setDeleteConfirmTarget({ origin: cro, isUsed });
  };

  const handleConfirmDeleteOrDisableCustomOrigin = () => {
    if (!deleteConfirmTarget) return;
    deleteCustomReceivableOrigin(deleteConfirmTarget.origin.id);
    setDeleteConfirmTarget(null);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return processedReceivables.filter(item => {
      // Status Filter
      if (statusFilter !== 'todos' && item.computedStatus !== statusFilter) {
        return false;
      }

      // Origin Filter
      if (originFilter !== 'todos') {
        if (originFilter.startsWith('custom:')) {
          const targetCustom = originFilter.replace('custom:', '');
          if (item.customOrigin !== targetCustom) return false;
        } else if (originFilter === 'outro') {
          if (item.origin !== 'outro') return false;
          if (item.customOrigin && customReceivableOrigins.some(c => c.name === item.customOrigin)) return false;
        } else {
          if (item.origin !== originFilter) return false;
        }
      }

      // Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = item.customerName?.toLowerCase().includes(term);
        const descMatch = item.description.toLowerCase().includes(term);
        const orderMatch = item.orderNumber?.toLowerCase().includes(term);
        const labelText = item.origin === 'outro' && item.customOrigin ? item.customOrigin : ORIGIN_LABELS[item.origin];
        const originMatch = labelText.toLowerCase().includes(term);
        const notesMatch = item.notes?.toLowerCase().includes(term);

        if (!nameMatch && !descMatch && !orderMatch && !originMatch && !notesMatch) {
          return false;
        }
      }

      // Date Range Filter
      if (dateRangeFilter === 'hoje') {
        if (item.dueDate !== todayStr) return false;
      } else if (dateRangeFilter === 'semana') {
        const itemDate = new Date(item.dueDate + 'T00:00:00');
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        if (itemDate < firstDay || itemDate > lastDay) return false;
      } else if (dateRangeFilter === 'mes') {
        const currentMonth = todayStr.slice(0, 7);
        if (!item.dueDate.startsWith(currentMonth)) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [processedReceivables, statusFilter, originFilter, searchTerm, dateRangeFilter, todayStr, customReceivableOrigins]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setOrigin('ifood');
    setCustomOrigin('');
    setDescription('Repasse semanal');
    setCustomerName('');
    setCustomerPhone('');
    setOrderNumber('');
    setSaleDate(todayStr);
    setDueDate(todayStr);
    setAmount('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (item: AccountReceivable) => {
    setEditingItem(item);
    setOrigin(item.origin);
    setCustomOrigin(item.customOrigin || '');
    setDescription(item.description || '');
    setCustomerName(item.customerName || '');
    setCustomerPhone(item.customerPhone || '');
    setOrderNumber(item.orderNumber || '');
    setSaleDate(item.saleDate);
    setDueDate(item.dueDate);
    setAmount(item.amount.toString());
    setNotes(item.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Form Submit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Informe um valor válido e maior que zero.');
      return;
    }

    if (origin === 'fiado' && !customerName.trim()) {
      setFormError('Informe o nome do cliente para lançamentos em Fiado.');
      return;
    }

    if (!dueDate) {
      setFormError('Informe a data prevista para recebimento.');
      return;
    }

    const defaultDesc = origin === 'fiado' 
      ? `Venda Fiado - ${customerName.trim()}`
      : `Repasse ${ORIGIN_LABELS[origin]}`;

    const newItem: AccountReceivable = {
      id: editingItem ? editingItem.id : 'ar_' + Math.random().toString(36).substr(2, 9),
      origin,
      customOrigin: origin === 'outro' ? customOrigin.trim() : undefined,
      description: description.trim() || defaultDesc,
      customerName: origin === 'fiado' ? customerName.trim() : (customerName.trim() || undefined),
      customerPhone: customerPhone.trim() || undefined,
      orderNumber: orderNumber.trim() || undefined,
      saleDate: saleDate || todayStr,
      dueDate: dueDate || todayStr,
      amount: parsedAmount,
      status: editingItem ? editingItem.status : 'a_receber',
      receivedDate: editingItem?.receivedDate,
      notes: notes.trim() || undefined,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingItem) {
      updateAccountReceivable(editingItem.id, newItem);
    } else {
      addAccountReceivable(newItem);
    }

    setIsModalOpen(false);
  };

  // Open Receive / Add Payment Modal
  const handleOpenReceiveModal = (item: (AccountReceivable & { payments: AccountReceivablePayment[]; paidAmount: number; remainingAmount: number })) => {
    setReceivingItem(item);
    setPaymentAmountInput(item.remainingAmount.toString());
    setPaymentMethodInput('pix');
    setReceivedDateInput(todayStr);
    setNextDueDateInput(item.dueDate);
    setPaymentNotesInput('');
    setReceiveModalError('');
    setExcessPaymentConfirm(false);
  };

  const handleConfirmAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveModalError('');
    if (!receivingItem) return;

    const numAmount = parseFloat(paymentAmountInput.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setReceiveModalError('Informe um valor de recebimento válido maior que zero.');
      return;
    }

    if (numAmount > receivingItem.remainingAmount && !excessPaymentConfirm) {
      setReceiveModalError(`O valor informado (${formatMoney(numAmount)}) é maior que o saldo pendente (${formatMoney(receivingItem.remainingAmount)}). Marque a opção de confirmação abaixo se deseja aceitar o excedente.`);
      return;
    }

    addReceivablePayment(receivingItem.id, {
      amount: numAmount,
      date: receivedDateInput || todayStr,
      paymentMethod: paymentMethodInput,
      notes: paymentNotesInput.trim() || undefined,
      nextDueDate: numAmount < receivingItem.remainingAmount ? nextDueDateInput : undefined
    });

    setReceivingItem(null);
  };

  // Live item for detail view
  const liveDetailItem = useMemo(() => {
    if (!detailItem) return null;
    return processedReceivables.find(item => item.id === detailItem.id) || null;
  }, [detailItem, processedReceivables]);

  // Format date for display
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
              <Coins size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                Contas a Receber
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gerencie fiados, repasses do iFood, 99Food, Keeta, encomendas e recebimentos futuros.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 text-sm"
        >
          <Plus size={18} />
          NOVO RECEBIMENTO
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TOTAL A RECEBER */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins size={14} /> Total a Receber
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <p className="text-2xl font-black text-white">
            {formatMoney(metrics.totalAReceber)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Aguardando pagamento
          </p>
        </div>

        {/* VENCIDO */}
        <div className="bg-red-950/30 border border-red-900/40 p-4 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} /> Vencidos
            </span>
            {metrics.totalVencido > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold">
                Atenção
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-red-400">
            {formatMoney(metrics.totalVencido)}
          </p>
          <p className="text-[11px] text-red-300/70 mt-1">
            Pagamentos atrasados
          </p>
        </div>

        {/* PRÓXIMOS RECEBIMENTOS */}
        <div className="bg-blue-950/30 border border-blue-900/40 p-4 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} /> Próx. 7 Dias
            </span>
          </div>
          <p className="text-2xl font-black text-blue-400">
            {formatMoney(metrics.totalProximos)}
          </p>
          <p className="text-[11px] text-blue-300/70 mt-1">
            Vencendo em breve
          </p>
        </div>

        {/* RECEBIDO */}
        <div className="bg-emerald-950/30 border border-emerald-900/40 p-4 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Já Recebido
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {formatMoney(metrics.totalRecebido)}
          </p>
          <p className="text-[11px] text-emerald-300/70 mt-1">
            Valores confirmados
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'todos' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({processedReceivables.length})
            </button>
            <button
              onClick={() => setStatusFilter('a_receber')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'a_receber' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Clock size={12} /> A Receber
            </button>
            <button
              onClick={() => setStatusFilter('parcial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'parcial' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Clock size={12} /> Parciais 🟡
            </button>
            <button
              onClick={() => setStatusFilter('atrasado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'atrasado' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-red-300'
              }`}
            >
              <AlertTriangle size={12} /> Vencidos 🔴
            </button>
            <button
              onClick={() => setStatusFilter('recebido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'recebido' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 size={12} /> Recebidos 🟢
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, pedido, iFood, etc..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter size={12} /> Origem:
            </span>
            <select
              value={originFilter}
              onChange={e => setOriginFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todas as Origens</option>
              <optgroup label="Origens Padrão">
                <option value="fiado">Fiado / Cliente</option>
                <option value="ifood">iFood</option>
                <option value="99food">99Food</option>
                <option value="keeta">Keeta</option>
                <option value="brendi">Brendi</option>
                <option value="empresa">Venda para empresa</option>
                <option value="evento">Evento / Encomenda</option>
              </optgroup>
              {customReceivableOrigins.length > 0 && (
                <optgroup label="Minhas Origens Personalizadas">
                  {customReceivableOrigins.map(c => (
                    <option key={c.id} value={`custom:${c.name}`}>
                      {c.name} {!c.active ? '(Inativa)' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Outras">
                <option value="outro">Outro</option>
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar size={12} /> Período:
            </span>
            <select
              value={dateRangeFilter}
              onChange={e => setDateRangeFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos os Períodos</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
            </select>
          </div>

          {(statusFilter !== 'todos' || originFilter !== 'todos' || searchTerm || dateRangeFilter !== 'todos') && (
            <button
              onClick={() => {
                setStatusFilter('todos');
                setOriginFilter('todos');
                setSearchTerm('');
                setDateRangeFilter('todos');
              }}
              className="text-xs text-emerald-400 hover:underline ml-auto"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Receivables List / Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4 border border-slate-700/50">
              <Coins size={32} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Nenhum recebimento encontrado
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              {accountsReceivable.length === 0 
                ? 'Você ainda não registrou nenhuma conta a receber. Clique no botão abaixo para adicionar o primeiro lançamento.'
                : 'Nenhum lançamento atende aos filtros selecionados. Tente alterar ou limpar os filtros.'}
            </p>
            {accountsReceivable.length === 0 && (
              <button
                onClick={handleOpenAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                <Plus size={16} /> Cadastrar Primeiro Recebimento
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Origem</th>
                  <th className="px-4 py-3.5">Cliente / Detalhe</th>
                  <th className="px-4 py-3.5">Valor</th>
                  <th className="px-4 py-3.5">Data Venda</th>
                  <th className="px-4 py-3.5">Previsão</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredList.map(item => {
                  const isAtrasado = item.computedStatus === 'atrasado';
                  const isRecebido = item.computedStatus === 'recebido';
                  const isParcial = item.computedStatus === 'parcial';

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-800/40 transition group ${
                        isAtrasado ? 'bg-red-950/10' : isRecebido ? 'opacity-75' : isParcial ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Origem */}
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${ORIGIN_BADGE_COLORS[item.origin]}`}>
                          {item.origin === 'outro' && item.customOrigin ? item.customOrigin : ORIGIN_LABELS[item.origin]}
                        </span>
                      </td>

                      {/* Cliente / Descrição */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-xs">
                          {item.origin === 'fiado' ? (item.customerName || 'Cliente Fiado') : item.description}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          {item.origin === 'fiado' && item.description && item.description !== `Venda Fiado - ${item.customerName}` && (
                            <span>{item.description}</span>
                          )}
                          {item.customerPhone && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Phone size={10} /> {item.customerPhone}
                            </span>
                          )}
                          {item.orderNumber && (
                            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                              Ped: #{item.orderNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isParcial ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-slate-400 line-through">
                              Total: {formatMoney(item.amount)}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-400">
                              Rec: {formatMoney(item.paidAmount)}
                            </span>
                            <span className="text-xs font-black text-amber-300">
                              Resta: {formatMoney(item.remainingAmount)}
                            </span>
                          </div>
                        ) : (
                          <span className={`font-black text-sm ${
                            isRecebido ? 'text-emerald-400 line-through opacity-80' : isAtrasado ? 'text-red-400' : 'text-amber-300'
                          }`}>
                            {formatMoney(item.amount)}
                          </span>
                        )}
                      </td>

                      {/* Data Venda */}
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                        {formatDateBR(item.saleDate)}
                      </td>

                      {/* Previsão */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                        <span className={isAtrasado ? 'text-red-400 font-bold' : 'text-slate-300'}>
                          {formatDateBR(item.dueDate)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isRecebido ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={12} /> RECEBIDO
                          </span>
                        ) : isParcial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Clock size={12} /> PARCIAL
                          </span>
                        ) : isAtrasado ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                            <AlertTriangle size={12} /> ATRASADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            <Clock size={12} /> A RECEBER
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {!isRecebido && (
                            <button
                              onClick={() => handleOpenReceiveModal(item)}
                              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-[11px] font-bold transition border border-emerald-500/30 flex items-center gap-1"
                              title="Registrar Recebimento"
                            >
                              <DollarSign size={12} /> Registrar Recebimento
                            </button>
                          )}

                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Ver Detalhes"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir este lançamento de ${formatMoney(item.amount)}?`)) {
                                deleteAccountReceivable(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Criar / Editar Recebimento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins size={20} className="text-emerald-400" />
                {editingItem ? 'Editar Conta a Receber' : 'Novo Recebimento'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Origem */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Origem do Recebimento <span className="text-red-400">*</span>
                </label>
                <select
                  value={
                    origin === 'outro' && customOrigin
                      ? (customReceivableOrigins.some(c => c.name === customOrigin) ? `custom:${customOrigin}` : 'outro')
                      : origin
                  }
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '__manage__') {
                      setIsManageOriginsOpen(true);
                      return;
                    }
                    if (val.startsWith('custom:')) {
                      const name = val.replace('custom:', '');
                      setOrigin('outro');
                      setCustomOrigin(name);
                      if (!description || description.startsWith('Repasse') || description.startsWith('Venda Fiado')) {
                        setDescription(`Repasse ${name}`);
                      }
                    } else if (val === 'outro') {
                      setOrigin('outro');
                      setCustomOrigin('');
                    } else {
                      const newOrigin = val as ReceivableOrigin;
                      setOrigin(newOrigin);
                      setCustomOrigin('');
                      if (newOrigin === 'fiado') {
                        if (!description || description.startsWith('Repasse')) {
                          setDescription(`Venda Fiado - ${customerName}`);
                        }
                      } else {
                        setDescription(`Repasse ${ORIGIN_LABELS[newOrigin]}`);
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <optgroup label="Origens Padrão">
                    <option value="fiado">Fiado / Cliente</option>
                    <option value="ifood">iFood</option>
                    <option value="99food">99Food</option>
                    <option value="keeta">Keeta</option>
                    <option value="brendi">Brendi</option>
                    <option value="empresa">Venda para empresa</option>
                    <option value="evento">Evento / Encomenda</option>
                  </optgroup>

                  {customReceivableOrigins.length > 0 && (
                    <optgroup label="Minhas Origens Personalizadas">
                      {customReceivableOrigins
                        .filter(c => c.active || (origin === 'outro' && customOrigin === c.name))
                        .map(c => (
                          <option key={c.id} value={`custom:${c.name}`}>
                            {c.name} {!c.active ? '(Inativa)' : ''}
                          </option>
                        ))}
                    </optgroup>
                  )}

                  <optgroup label="Outras">
                    <option value="outro">Outro (especificar)</option>
                  </optgroup>

                  <optgroup label="Ações">
                    <option value="__manage__">⚙️ Gerenciar origens...</option>
                  </optgroup>
                </select>

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">Quer adicionar uma nova origem?</span>
                  <button
                    type="button"
                    onClick={() => setIsManageOriginsOpen(true)}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 hover:underline"
                  >
                    ⚙️ Gerenciar origens
                  </button>
                </div>
              </div>

              {/* Custom Origin Input if "Outro" is selected and not from list */}
              {origin === 'outro' && !customReceivableOrigins.some(c => c.name === customOrigin && c.active) && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Especifique a Origem <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Parceria local, Venda direta, etc."
                    value={customOrigin}
                    onChange={e => setCustomOrigin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Fields Specific to Fiado / Cliente */}
              {origin === 'fiado' && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} /> Dados do Cliente Fiado
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome do Cliente <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João da Silva"
                      value={customerName}
                      onChange={e => {
                        setCustomerName(e.target.value);
                        if (!description || description.startsWith('Venda Fiado')) {
                          setDescription(`Venda Fiado - ${e.target.value}`);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Telefone (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="(27) 99999-9999"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Nº do Pedido (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 1042"
                        value={orderNumber}
                        onChange={e => setOrderNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Descrição Básica */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Descrição / Identificação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Repasse semanal iFood / Venda corporativa"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Valor R$ */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Valor a Receber (R$) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Data da Compra/Venda <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Previsão de Recebimento <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotações adicionais sobre o pagamento..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Recebimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Recebimento / Novo Pagamento */}
      {receivingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Coins size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">💰 Registrar Recebimento</h3>
                  <p className="text-xs text-slate-400">
                    {receivingItem.customerName ? receivingItem.customerName : receivingItem.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceivingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Debt Balance Summary Box */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Devido</span>
                <span className="text-xs font-bold text-white">{formatMoney(receivingItem.amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Já Recebido</span>
                <span className="text-xs font-bold text-emerald-400">{formatMoney(receivingItem.paidAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo Pendente</span>
                <span className="text-sm font-black text-amber-300">{formatMoney(receivingItem.remainingAmount)}</span>
              </div>
            </div>

            {receiveModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{receiveModalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmAddPayment} className="space-y-4">
              {/* Payment Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Valor deste recebimento (R$) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentAmountInput(receivingItem.remainingAmount.toString())}
                      className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold transition"
                    >
                      Quitar Saldo ({formatMoney(receivingItem.remainingAmount)})
                    </button>
                    {receivingItem.remainingAmount > 10 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmountInput((receivingItem.remainingAmount / 2).toFixed(2))}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold transition"
                      >
                        50%
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={paymentAmountInput}
                    onChange={e => {
                      setPaymentAmountInput(e.target.value);
                      setReceiveModalError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-base font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'transferencia', 'outro'] as ReceivablePaymentMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethodInput(method)}
                      className={`p-2 rounded-xl text-xs font-bold border transition text-left flex items-center justify-between ${
                        paymentMethodInput === method
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span>{PAYMENT_METHOD_LABELS[method]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Data do Recebimento
                  </label>
                  <input
                    type="date"
                    required
                    value={receivedDateInput}
                    onChange={e => setReceivedDateInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Dynamic Balance Calculation & Next Due Date */}
                {(() => {
                  const entered = parseFloat(paymentAmountInput.replace(',', '.')) || 0;
                  const isPartial = entered > 0 && entered < receivingItem.remainingAmount;

                  if (isPartial) {
                    return (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                          Próximo Vencimento (Saldo)
                        </label>
                        <input
                          type="date"
                          value={nextDueDateInput}
                          onChange={e => setNextDueDateInput(e.target.value)}
                          className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col justify-end">
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold text-center">
                        🟢 Quitação Total
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Status Indicator Banner */}
              {(() => {
                const entered = parseFloat(paymentAmountInput.replace(',', '.')) || 0;
                const newRemaining = receivingItem.remainingAmount - entered;

                if (entered > 0 && newRemaining > 0) {
                  return (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-300">
                        <span>🟡 PAGAMENTO PARCIAL</span>
                        <span>Saldo Restante: {formatMoney(newRemaining)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        O lançamento continuará em Contas a Receber com o saldo restante pendente.
                      </p>
                    </div>
                  );
                } else if (entered > 0 && newRemaining <= 0) {
                  if (newRemaining < 0) {
                    return (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
                        <div className="text-amber-300 font-bold">
                          ⚠️ Valor maior que o saldo restante em {formatMoney(Math.abs(newRemaining))}
                        </div>
                        <label className="flex items-center gap-2 text-slate-300 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={excessPaymentConfirm}
                            onChange={e => setExcessPaymentConfirm(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                          />
                          Confirmar recebimento do valor total com excedente
                        </label>
                      </div>
                    );
                  }
                  return (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>🟢 QUITAÇÃO TOTAL! O título será marcado como RECEBIDO.</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Payment Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Observação deste Recebimento (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pagou R$ 40 em dinheiro e prometeu o restante na sexta"
                  value={paymentNotesInput}
                  onChange={e => setPaymentNotesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceivingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> CONFIRMAR RECEBIMENTO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ver Detalhes e Histórico de Recebimentos */}
      {liveDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${ORIGIN_BADGE_COLORS[liveDetailItem.origin]}`}>
                  {liveDetailItem.origin === 'outro' && liveDetailItem.customOrigin ? liveDetailItem.customOrigin : ORIGIN_LABELS[liveDetailItem.origin]}
                </span>
                {liveDetailItem.computedStatus === 'recebido' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={12} /> RECEBIDO 🟢
                  </span>
                ) : liveDetailItem.computedStatus === 'parcial' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Clock size={12} /> PARCIAL 🟡
                  </span>
                ) : liveDetailItem.computedStatus === 'atrasado' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                    <AlertTriangle size={12} /> ATRASADO 🔴
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    <Clock size={12} /> A RECEBER
                  </span>
                )}
              </div>
              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Title / Customer */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Descrição / Cliente</span>
                  <span className="text-white text-base font-bold">
                    {liveDetailItem.customerName ? liveDetailItem.customerName : liveDetailItem.description}
                  </span>
                  {liveDetailItem.customerPhone && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-slate-300 font-medium flex items-center gap-1">
                        <Phone size={12} /> {liveDetailItem.customerPhone}
                      </span>
                      <a
                        href={`https://wa.me/55${liveDetailItem.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold transition border border-emerald-500/30 flex items-center gap-1"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
                {liveDetailItem.orderNumber && (
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono">
                    #{liveDetailItem.orderNumber}
                  </span>
                )}
              </div>

              {/* Financial Summary Box */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Original</span>
                  <span className="text-xs font-bold text-white">{formatMoney(liveDetailItem.amount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Recebido</span>
                  <span className="text-xs font-bold text-emerald-400">{formatMoney(liveDetailItem.paidAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo Restante</span>
                  <span className={`text-sm font-black ${liveDetailItem.remainingAmount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                    {formatMoney(liveDetailItem.remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Data da Venda</span>
                  <span className="text-slate-200 font-medium">{formatDateBR(liveDetailItem.saleDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Previsão Vencimento</span>
                  <span className={`font-medium ${liveDetailItem.computedStatus === 'atrasado' ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                    {formatDateBR(liveDetailItem.dueDate)}
                  </span>
                </div>
              </div>

              {/* Payment History Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-emerald-400" /> Histórico de Recebimentos ({liveDetailItem.payments.length})
                  </h4>
                  {liveDetailItem.remainingAmount > 0 && (
                    <button
                      onClick={() => {
                        handleOpenReceiveModal(liveDetailItem);
                      }}
                      className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                    >
                      <Plus size={12} /> Novo Recebimento
                    </button>
                  )}
                </div>

                {liveDetailItem.payments.length === 0 ? (
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                    Nenhum recebimento registrado até o momento.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {liveDetailItem.payments.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-400 text-sm">{formatMoney(p.amount)}</span>
                            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              {PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                            </span>
                            <span className="text-slate-400 text-[11px]">{formatDateBR(p.date)}</span>
                          </div>
                          {p.notes && <p className="text-slate-400 text-[11px] italic">"{p.notes}"</p>}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Remover este recebimento de ${formatMoney(p.amount)}?`)) {
                              deleteReceivablePayment(liveDetailItem.id, p.id);
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-800 rounded-lg transition"
                          title="Excluir recebimento"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {liveDetailItem.notes && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Observações Gerais</span>
                  <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                    {liveDetailItem.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Gerenciar Origens */}
      {isManageOriginsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Coins size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">⚙️ Gerenciar Origens de Recebimento</h3>
                  <p className="text-xs text-slate-400">Personalize as origens dos seus recebimentos</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsManageOriginsOpen(false);
                  setOriginModalError('');
                  setEditingOriginId(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {originModalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{originModalError}</span>
                </div>
              )}

              {/* Add New Custom Origin Form */}
              <form onSubmit={handleAddCustomOrigin} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  ➕ Adicionar Nova Origem Personalizada
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Uber Eats, Rappi, WhatsApp, Parceria..."
                    value={newOriginName}
                    onChange={e => setNewOriginName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              </form>

              {/* Custom Origins List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>Minhas Origens Personalizadas</span>
                    <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {customReceivableOrigins.length}
                    </span>
                  </h4>
                </div>

                {customReceivableOrigins.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                    <p className="text-xs text-slate-500 italic">Nenhuma origem personalizada cadastrada para esta loja.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Adicione opções como "Uber Eats", "Rappi" ou "Venda Fiado Local".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customReceivableOrigins.map(cro => {
                      const isEditing = editingOriginId === cro.id;

                      return (
                        <div
                          key={cro.id}
                          className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl hover:border-slate-700 transition"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1 mr-2">
                              <input
                                type="text"
                                value={editingOriginName}
                                onChange={e => setEditingOriginName(e.target.value)}
                                className="flex-1 bg-slate-900 border border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditCustomOrigin(cro.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingOriginId(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2 py-1 rounded-lg transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-xs text-white">{cro.name}</span>
                                {cro.active ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Ativa
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                    Inativa
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Toggle Active Status */}
                                <button
                                  type="button"
                                  onClick={() => toggleCustomReceivableOriginStatus(cro.id, !cro.active)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                                    cro.active 
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  }`}
                                  title={cro.active ? 'Desativar para novos lançamentos' : 'Ativar origem'}
                                >
                                  {cro.active ? 'Desativar' : 'Ativar'}
                                </button>

                                {/* Edit Name */}
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCustomOrigin(cro.id, cro.name)}
                                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                  title="Editar nome"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {/* Delete or Disable */}
                                <button
                                  type="button"
                                  onClick={() => handleRequestDeleteCustomOrigin(cro)}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                  title="Excluir / Desativar"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Protected Standard Origins */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <span>🔒 Origens Padrão do Sistema (Protegidas)</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Estas origens são globais do sistema e continuam disponíveis para todas as lojas:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(ORIGIN_LABELS).map(([key, label]) => (
                    <span
                      key={key}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-1"
                    >
                      <span>{label}</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => {
                  setIsManageOriginsOpen(false);
                  setOriginModalError('');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO / DESATIVAÇÃO */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                deleteConfirmTarget.isUsed 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {deleteConfirmTarget.isUsed 
                    ? `Desativar origem "${deleteConfirmTarget.origin.name}"?` 
                    : `Excluir origem "${deleteConfirmTarget.origin.name}"?`}
                </h3>
                <div className="text-xs text-slate-400 mt-1.5 space-y-2 leading-relaxed">
                  {deleteConfirmTarget.isUsed ? (
                    <p>
                      Esta origem já possui recebimentos cadastrados. Para preservar o histórico e os relatórios passados, ela será <strong>desativada</strong>.
                      <br /><br />
                      Ela deixará de aparecer para novos lançamentos, mas os recebimentos antigos continuarão completamente preservados.
                    </p>
                  ) : (
                    <p>
                      Esta origem personalizada não possui nenhum recebimento cadastrado.
                      <br /><br />
                      Tem certeza que deseja excluí-la definitivamente?
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteOrDisableCustomOrigin}
                className={`text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg ${
                  deleteConfirmTarget.isUsed
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                }`}
              >
                {deleteConfirmTarget.isUsed ? 'Sim, Desativar Origem' : 'Sim, Excluir Origem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
