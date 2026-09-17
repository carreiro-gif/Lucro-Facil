import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Collaborator, 
  CollaboratorPayment, 
  RemunerationType, 
  PaymentFrequency,
  PaymentMethod,
  DayOfWeekRule,
  CollaboratorMeal,
  CollaboratorMealItem,
  Product
} from '../types';
import { DEFAULT_COLLABORATOR_ROLES_BY_CATEGORY, formatMoney } from '../constants';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  DollarSign, 
  Truck, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Pencil,
  Sparkles, 
  Check, 
  X, 
  Search, 
  Receipt, 
  Utensils, 
  Wallet, 
  Layers, 
  RefreshCw 
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export const Collaborators: React.FC = () => {
  const { 
    collaborators = [], 
    collaboratorPayments = [], 
    collaboratorMeals = [],
    customCollaboratorRoles = [],
    products = [],
    monthlyRevenue = {},
    getProductCMV,
    addCollaborator, 
    updateCollaborator, 
    deleteCollaborator, 
    addCustomCollaboratorRole,
    addCollaboratorPayment,
    addCollaboratorPaymentsBatch,
    updateCollaboratorPaymentStatus,
    deleteCollaboratorPayment,
    closeCollaboratorPayments,
    consolidateLegacyCollaboratorExpenses,
    addCollaboratorMeal,
    updateCollaboratorMeal,
    deleteCollaboratorMeal
  } = useApp();

  // Selected Month for Overview & History
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<'fechamento' | 'pagamentos' | 'refeicoes' | 'team' | 'salarios' | 'history'>('fechamento');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  // Collaborator Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);

  // Custom role input state
  const [isAddingNewRole, setIsAddingNewRole] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');

  // Form state for Collaborator
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formRemunerationType, setFormRemunerationType] = useState<RemunerationType>('diaria');
  const [formPaymentFrequency, setFormPaymentFrequency] = useState<PaymentFrequency>('no_dia');
  const [formDefaultAmount, setFormDefaultAmount] = useState<number | ''>('');
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPixKey, setFormPixKey] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formProvidesMeals, setFormProvidesMeals] = useState(true);
  const [enableWeeklyRules, setEnableWeeklyRules] = useState(false);
  const [weeklyRules, setWeeklyRules] = useState<DayOfWeekRule[]>(() => 
    DAYS_OF_WEEK.map((_, idx) => ({
      dayOfWeek: idx as any,
      remunerationType: 'diaria',
      baseValue: 0,
      active: true
    }))
  );

  // --- FECHAMENTO DO DIA STATE ---
  const [fechamentoDate, setFechamentoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [consolidateInExpenses, setConsolidateInExpenses] = useState(true);
  const [selectedCollabIds, setSelectedCollabIds] = useState<Record<string, boolean>>({});
  
  // Custom values for each collaborator in today's closing
  const [closingValues, setClosingValues] = useState<Record<string, {
    remunerationType: RemunerationType;
    baseAmount: number;
    deliveryFeeAmount: number;
    deliveryCount: number | '';
    status: 'pago' | 'pendente';
    paymentMethod: PaymentMethod;
    notes: string;
  }>>({});

  // --- SETTLEMENT / QUITAÇÃO EM LOTE MODAL ---
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedSettlementPaymentIds, setSelectedSettlementPaymentIds] = useState<string[]>([]);
  const [settlementMethod, setSettlementMethod] = useState<PaymentMethod>('pix');
  const [settlementDate, setSettlementDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [settlementNotes, setSettlementNotes] = useState('');
  const [settlementConsolidate, setSettlementConsolidate] = useState(true);

  // --- MEAL / REFEIÇÃO MODAL STATE (SUPORTA MÚLTIPLOS ITENS E INTEGRAÇÃO DIRETA) ---
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealDate, setMealDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mealCollaboratorId, setMealCollaboratorId] = useState<string>('all');
  const [mealNotes, setMealNotes] = useState('');
  
  // Cesta de itens do consumo da refeição
  const [mealItems, setMealItems] = useState<CollaboratorMealItem[]>([]);

  // Item sendo adicionado ou editado na cesta
  const [itemType, setItemType] = useState<'produto_proprio' | 'item_externo'>('produto_proprio');
  const [itemProductId, setItemProductId] = useState<string>('');
  const [itemManualDescription, setItemManualDescription] = useState('');
  const [itemCategory, setItemCategory] = useState<'lanche' | 'bebida' | 'sobremesa' | 'marmita' | 'outro'>('lanche');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitCost, setItemUnitCost] = useState<number>(0);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Day of week for default pricing
  const dayOfWeekNumber = useMemo(() => {
    if (!fechamentoDate) return 0;
    const d = new Date(fechamentoDate + 'T12:00:00');
    return d.getDay();
  }, [fechamentoDate]);

  const activeCollaborators = useMemo(() => {
    return collaborators.filter(c => c.status === 'active');
  }, [collaborators]);

  // Combined role suggestions from defaults + custom
  const allRolesByCategory = useMemo(() => {
    const combined: Record<string, string[]> = {};
    Object.entries(DEFAULT_COLLABORATOR_ROLES_BY_CATEGORY).forEach(([cat, roles]) => {
      combined[cat] = [...roles];
    });

    if (customCollaboratorRoles && customCollaboratorRoles.length > 0) {
      combined['Personalizadas'] = customCollaboratorRoles;
    }

    return combined;
  }, [customCollaboratorRoles]);

  // Compute month's statistics
  const monthStats = useMemo(() => {
    const monthPayments = collaboratorPayments.filter(p => p.date.startsWith(selectedMonth));
    const monthMeals = collaboratorMeals.filter(m => m.date.startsWith(selectedMonth));
    
    const totalSalarios = monthPayments
      .filter(p => p.remunerationType === 'salario')
      .reduce((sum, p) => sum + p.baseAmount, 0);

    const totalDiarias = monthPayments
      .filter(p => p.remunerationType === 'diaria' || p.remunerationType === 'diaria_mais_taxas' || p.remunerationType === 'por_entrega' || p.remunerationType === 'outro')
      .reduce((sum, p) => sum + p.baseAmount, 0);

    const totalProLabore = monthPayments
      .filter(p => p.remunerationType === 'pro_labore')
      .reduce((sum, p) => sum + p.baseAmount, 0);

    const totalDeliveryFees = monthPayments
      .reduce((sum, p) => sum + p.deliveryFeeAmount, 0);

    const totalDeliveriesCount = monthPayments
      .reduce((sum, p) => sum + (p.deliveryCount || 0), 0);

    const totalFixedLaborCfi = totalSalarios + totalDiarias + totalProLabore;
    
    // Payments status
    const totalPaidMonth = monthPayments
      .reduce((sum, p) => {
        if (p.status === 'pago') return sum + p.totalPaid;
        return sum + (p.amountPaid || 0);
      }, 0);

    const totalPendingMonth = monthPayments
      .reduce((sum, p) => {
        if (p.status === 'pago') return sum;
        return sum + (p.pendingBalance ?? Math.max(0, p.totalPaid - (p.amountPaid || 0)));
      }, 0);

    // Meals cost & items count (calcula todos os itens individuais de cada refeição)
    const totalMealsCost = monthMeals.reduce((sum, m) => sum + (m.totalCost || 0), 0);
    const totalMealsCount = monthMeals.reduce((sum, m) => {
      if (m.items && m.items.length > 0) {
        return sum + m.items.reduce((s, it) => s + (it.quantity || 1), 0);
      }
      return sum + (m.quantity || 1);
    }, 0);

    // Total Labor Cost (CMO = Mão de obra Fixa + Taxas de Entrega + Benefícios)
    const totalLaborCost = totalFixedLaborCfi + totalDeliveryFees + totalMealsCost;
    const currentRevenue = monthlyRevenue[selectedMonth] || 0;
    const cmoPercent = currentRevenue > 0 ? (totalLaborCost / currentRevenue) * 100 : 0;

    return {
      activeCount: activeCollaborators.length,
      totalPaidMonth,
      totalPendingMonth,
      totalFixedLaborCfi,
      totalSalarios,
      totalDiarias,
      totalProLabore,
      totalDeliveryFees,
      totalDeliveriesCount,
      avgFeePerDelivery: totalDeliveriesCount > 0 ? totalDeliveryFees / totalDeliveriesCount : 0,
      totalMealsCost,
      totalMealsCount,
      totalLaborCost,
      currentRevenue,
      cmoPercent
    };
  }, [collaboratorPayments, collaboratorMeals, selectedMonth, activeCollaborators, monthlyRevenue]);

  // Selected product details for item in meal form
  const selectedMealProduct = useMemo(() => {
    if (!itemProductId) return null;
    return products.find(p => p.id === itemProductId) || null;
  }, [itemProductId, products]);

  // Update meal unit cost when product or type changes
  React.useEffect(() => {
    if (itemType === 'produto_proprio' && selectedMealProduct) {
      const realCost = getProductCMV(selectedMealProduct);
      setItemUnitCost(realCost);
    }
  }, [itemType, selectedMealProduct, getProductCMV]);

  // Initialize modal for creation/editing
  const handleOpenModal = (collab?: Collaborator) => {
    if (collab) {
      setEditingCollaborator(collab);
      setFormName(collab.name);
      setFormRole(collab.role);
      setFormRemunerationType(collab.remunerationType);
      setFormPaymentFrequency(collab.paymentFrequency || 'no_dia');
      setFormDefaultAmount(collab.defaultAmount);
      setFormStartDate(collab.startDate || new Date().toISOString().slice(0, 10));
      setFormStatus(collab.status);
      setFormPixKey(collab.pixKey || '');
      setFormPhone(collab.phone || '');
      setFormNotes(collab.notes || '');
      const provMeals = Array.isArray(collab.benefits) ? true : (collab.benefits as any)?.providesMeals ?? true;
      setFormProvidesMeals(provMeals);
      if (collab.weeklyRules && collab.weeklyRules.length === 7) {
        setEnableWeeklyRules(true);
        setWeeklyRules(collab.weeklyRules);
      } else {
        setEnableWeeklyRules(false);
        setWeeklyRules(DAYS_OF_WEEK.map((_, idx) => ({
          dayOfWeek: idx as any,
          remunerationType: collab.remunerationType,
          baseValue: collab.defaultAmount,
          active: true
        })));
      }
    } else {
      setEditingCollaborator(null);
      setFormName('');
      setFormRole('Chapeiro');
      setFormRemunerationType('diaria');
      setFormPaymentFrequency('no_dia');
      setFormDefaultAmount('');
      setFormStartDate(new Date().toISOString().slice(0, 10));
      setFormStatus('active');
      setFormPixKey('');
      setFormPhone('');
      setFormNotes('');
      setFormProvidesMeals(true);
      setEnableWeeklyRules(false);
      setWeeklyRules(DAYS_OF_WEEK.map((_, idx) => ({
        dayOfWeek: idx as any,
        remunerationType: 'diaria',
        baseValue: 0,
        active: true
      })));
    }
    setIsAddingNewRole(false);
    setNewRoleInput('');
    setIsModalOpen(true);
  };

  const handleAddNewCustomRole = () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    addCustomCollaboratorRole(trimmed);
    setFormRole(trimmed);
    setIsAddingNewRole(false);
    setNewRoleInput('');
  };

  const handleSaveCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor, informe o nome do colaborador.');
      return;
    }

    const defaultVal = formDefaultAmount === '' ? 0 : Number(formDefaultAmount);

    const collabData: Collaborator = {
      id: editingCollaborator ? editingCollaborator.id : 'collab_' + Math.random().toString(36).substr(2, 9),
      name: formName.trim(),
      role: formRole,
      remunerationType: formRemunerationType,
      paymentFrequency: formPaymentFrequency,
      defaultAmount: defaultVal,
      startDate: formStartDate,
      status: formStatus,
      pixKey: formPixKey.trim() || undefined,
      phone: formPhone.trim() || undefined,
      notes: formNotes.trim() || undefined,
      benefits: {
        providesMeals: formProvidesMeals
      },
      weeklyRules: enableWeeklyRules ? weeklyRules : undefined
    };

    if (editingCollaborator) {
      updateCollaborator(editingCollaborator.id, collabData);
    } else {
      addCollaborator(collabData);
    }

    setIsModalOpen(false);
  };

  // --- FECHAMENTO DO DIA LOGIC ---
  const handleToggleCollabSelection = (c: Collaborator) => {
    const isSelected = !selectedCollabIds[c.id];
    setSelectedCollabIds(prev => ({ ...prev, [c.id]: isSelected }));

    if (isSelected && !closingValues[c.id]) {
      let defaultType = c.remunerationType;
      let defaultBase = c.defaultAmount;

      if (c.weeklyRules && c.weeklyRules[dayOfWeekNumber] && c.weeklyRules[dayOfWeekNumber].active) {
        const rule = c.weeklyRules[dayOfWeekNumber];
        defaultType = rule.remunerationType;
        defaultBase = rule.baseValue;
      }

      setClosingValues(prev => ({
        ...prev,
        [c.id]: {
          remunerationType: defaultType,
          baseAmount: defaultBase,
          deliveryFeeAmount: 0,
          deliveryCount: '',
          status: 'pago',
          paymentMethod: c.paymentFrequency === 'no_dia' ? 'pix' : 'transferencia',
          notes: ''
        }
      }));
    }
  };

  const handleSelectAllActive = () => {
    const newSelections: Record<string, boolean> = {};
    const newClosings = { ...closingValues };

    activeCollaborators.forEach(c => {
      newSelections[c.id] = true;
      if (!newClosings[c.id]) {
        let defaultType = c.remunerationType;
        let defaultBase = c.defaultAmount;
        if (c.weeklyRules && c.weeklyRules[dayOfWeekNumber] && c.weeklyRules[dayOfWeekNumber].active) {
          const rule = c.weeklyRules[dayOfWeekNumber];
          defaultType = rule.remunerationType;
          defaultBase = rule.baseValue;
        }
        newClosings[c.id] = {
          remunerationType: defaultType,
          baseAmount: defaultBase,
          deliveryFeeAmount: 0,
          deliveryCount: '',
          status: 'pago',
          paymentMethod: 'pix',
          notes: ''
        };
      }
    });

    setSelectedCollabIds(newSelections);
    setClosingValues(newClosings);
  };

  const handleClearSelection = () => {
    setSelectedCollabIds({});
  };

  const handleClosingValueChange = (cId: string, field: string, val: any) => {
    setClosingValues(prev => ({
      ...prev,
      [cId]: {
        ...(prev[cId] || {
          remunerationType: 'diaria',
          baseAmount: 0,
          deliveryFeeAmount: 0,
          deliveryCount: '',
          status: 'pago',
          paymentMethod: 'pix',
          notes: ''
        }),
        [field]: val
      }
    }));
  };

  const handleSaveFechamento = () => {
    const selectedIds = Object.keys(selectedCollabIds).filter(id => selectedCollabIds[id]);
    if (selectedIds.length === 0) {
      alert('Selecione pelo menos um colaborador que trabalhou hoje.');
      return;
    }

    const batchPayments: CollaboratorPayment[] = [];

    selectedIds.forEach(cId => {
      const collab = collaborators.find(c => c.id === cId);
      if (!collab) return;

      const closing = closingValues[cId] || {
        remunerationType: collab.remunerationType,
        baseAmount: collab.defaultAmount,
        deliveryFeeAmount: 0,
        deliveryCount: '',
        status: 'pago' as const,
        paymentMethod: 'pix' as const,
        notes: ''
      };

      const baseVal = Number(closing.baseAmount) || 0;
      const feeVal = Number(closing.deliveryFeeAmount) || 0;
      const totalPaid = baseVal + feeVal;
      const isPaid = closing.status === 'pago';

      batchPayments.push({
        id: 'pay_' + Math.random().toString(36).substr(2, 9),
        collaboratorId: collab.id,
        collaboratorName: collab.name,
        collaboratorRole: collab.role,
        date: fechamentoDate,
        remunerationType: closing.remunerationType,
        baseAmount: baseVal,
        deliveryFeeAmount: feeVal,
        deliveryCount: closing.deliveryCount !== '' ? Number(closing.deliveryCount) : undefined,
        totalPaid,
        amountPaid: isPaid ? totalPaid : 0,
        pendingBalance: isPaid ? 0 : totalPaid,
        status: closing.status,
        paymentMethod: closing.paymentMethod,
        paymentDate: isPaid ? fechamentoDate : undefined,
        notes: closing.notes
      });
    });

    const dateFormatted = fechamentoDate.split('-').reverse().join('/');
    addCollaboratorPaymentsBatch(batchPayments, {
      consolidateToExpenses: consolidateInExpenses,
      consolidatedTitle: `👥 Fechamento Mão de Obra — ${dateFormatted} (${batchPayments.length} colab.)`,
      expenseCategory: 'Mão de obra Não Contratada (Extras)'
    });

    alert(`Fechamento do dia ${dateFormatted} registrado com sucesso para ${batchPayments.length} colaborador(es)!`);
    
    // Reset selection for next launch
    setSelectedCollabIds({});
    setClosingValues({});
    setActiveTab('pagamentos');
  };

  // Filtered collaborators list for team tab
  const filteredCollaborators = useMemo(() => {
    return collaborators.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [collaborators, searchQuery, statusFilter]);

  // Pending payments
  const pendingPaymentsList = useMemo(() => {
    return collaboratorPayments
      .filter(p => p.status === 'pendente' || p.status === 'parcial')
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [collaboratorPayments]);

  // Handle Quick Payment (Mark as Paid individually)
  const handleQuickPayPayment = (payment: CollaboratorPayment) => {
    updateCollaboratorPaymentStatus(payment.id, 'pago', {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: payment.paymentMethod || 'pix'
    });
  };

  // Open batch settlement modal
  const handleOpenSettlementModal = (preselectedIds?: string[]) => {
    if (preselectedIds && preselectedIds.length > 0) {
      setSelectedSettlementPaymentIds(preselectedIds);
    } else {
      setSelectedSettlementPaymentIds(pendingPaymentsList.map(p => p.id));
    }
    setSettlementDate(new Date().toISOString().slice(0, 10));
    setSettlementMethod('pix');
    setSettlementNotes('');
    setSettlementConsolidate(true);
    setIsSettlementModalOpen(true);
  };

  const handleConfirmSettlement = () => {
    if (selectedSettlementPaymentIds.length === 0) {
      alert('Selecione ao menos um pagamento para quitar.');
      return;
    }

    const dateFormatted = settlementDate.split('-').reverse().join('/');
    closeCollaboratorPayments({
      paymentIds: selectedSettlementPaymentIds,
      paymentMethod: settlementMethod,
      paymentDate: settlementDate,
      consolidateToExpenses: settlementConsolidate,
      consolidatedTitle: `👥 Pagamento Mão de Obra — ${dateFormatted} (${selectedSettlementPaymentIds.length} pagtos)`,
      notes: settlementNotes
    });

    alert(`Pagamentos liquidados com sucesso!`);
    setIsSettlementModalOpen(false);
    setSelectedSettlementPaymentIds([]);
  };

  // Consolidate legacy individual expenses
  const handleConsolidateLegacy = () => {
    if (confirm('Deseja agrupar os lançamentos individuais de mão de obra do mesmo mês em despesas consolidadas no Contas a Pagar? Isso mantém todo o detalhe intacto aqui em Colaboradores e limpa a visualização do Contas a Pagar.')) {
      const result = consolidateLegacyCollaboratorExpenses();
      if (result.consolidatedCount > 0) {
        alert(`Sucesso! ${result.consolidatedCount} lançamentos foram agrupados de forma organizada no Contas a Pagar.`);
      } else {
        alert('Nenhum lançamento antigo precisou ser consolidado no momento.');
      }
    }
  };

  // --- OPEN MEAL MODAL (SUPORTA CRIAÇÃO E EDIÇÃO COM MÚLTIPLOS ITENS) ---
  const openMealModal = (collabId?: string, date?: string, existingMeal?: CollaboratorMeal) => {
    if (existingMeal) {
      setEditingMealId(existingMeal.id);
      setMealDate(existingMeal.date);
      setMealCollaboratorId(existingMeal.collaboratorId || 'all');
      setMealNotes(existingMeal.notes || '');

      // Carregar itens existentes ou sintetizar a partir de campos legados
      if (existingMeal.items && existingMeal.items.length > 0) {
        setMealItems([...existingMeal.items]);
      } else {
        const singleItem: CollaboratorMealItem = {
          id: 'item_' + Math.random().toString(36).substr(2, 9),
          type: existingMeal.type === 'item_externo' ? 'custom' : 'product',
          productId: existingMeal.productId,
          name: existingMeal.productName || 'Refeição / Lanche',
          cost: existingMeal.unitCost || existingMeal.totalCost || 0,
          quantity: existingMeal.quantity || 1,
          category: (existingMeal.category as any) || 'lanche'
        };
        setMealItems([singleItem]);
      }
    } else {
      setEditingMealId(null);
      setMealDate(date || fechamentoDate || new Date().toISOString().slice(0, 10));
      setMealCollaboratorId(collabId || 'all');
      setMealNotes('');
      setMealItems([]);
    }

    // Inicializar campos de item para adição
    const defaultProd = products[0];
    setItemType('produto_proprio');
    if (defaultProd) {
      setItemProductId(defaultProd.id);
      setItemUnitCost(getProductCMV(defaultProd));
    } else {
      setItemProductId('');
      setItemUnitCost(0);
    }
    setItemManualDescription('');
    setItemCategory('lanche');
    setItemQuantity(1);
    setEditingItemIndex(null);
    setIsMealModalOpen(true);
  };

  const handleProductChange = (prodId: string) => {
    setItemProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setItemUnitCost(getProductCMV(prod));
    }
  };

  // --- ADICIONAR OU ATUALIZAR ITEM NA CESTA DA REFEIÇÃO ---
  const handleAddOrUpdateItem = () => {
    if (itemQuantity <= 0) {
      alert('Informe uma quantidade maior que zero.');
      return;
    }

    let name = '';
    let cost = Number(itemUnitCost) || 0;
    let saleRef: number | undefined = undefined;

    if (itemType === 'produto_proprio') {
      const prod = products.find(p => p.id === itemProductId);
      if (!prod) {
        alert('Selecione um produto do cardápio.');
        return;
      }
      name = prod.name;
      cost = Number(itemUnitCost) || getProductCMV(prod);
      saleRef = prod.prices?.loja_fisica || prod.targetPrice || undefined;
    } else {
      if (!itemManualDescription.trim()) {
        alert('Informe a descrição do item ou refeição.');
        return;
      }
      name = itemManualDescription.trim();
      cost = Number(itemUnitCost) || 0;
    }

    if (editingItemIndex !== null && editingItemIndex >= 0 && editingItemIndex < mealItems.length) {
      // Atualizando item já na lista
      const updated = [...mealItems];
      updated[editingItemIndex] = {
        ...updated[editingItemIndex],
        type: itemType === 'produto_proprio' ? 'product' : 'custom',
        productId: itemType === 'produto_proprio' ? itemProductId : undefined,
        name,
        cost,
        salePriceReference: saleRef,
        quantity: itemQuantity,
        category: itemCategory
      };
      setMealItems(updated);
      setEditingItemIndex(null);
    } else {
      // Adicionando novo item à lista
      const newItem: CollaboratorMealItem = {
        id: 'item_' + Math.random().toString(36).substr(2, 9),
        type: itemType === 'produto_proprio' ? 'product' : 'custom',
        productId: itemType === 'produto_proprio' ? itemProductId : undefined,
        name,
        cost,
        salePriceReference: saleRef,
        quantity: itemQuantity,
        category: itemCategory
      };
      setMealItems(prev => [...prev, newItem]);
    }

    // Resetar campos para que o usuário possa adicionar rapidamente o próximo item
    setItemManualDescription('');
    setItemQuantity(1);
    if (itemType === 'produto_proprio' && products.length > 0) {
      const prod = products.find(p => p.id === itemProductId);
      if (prod) setItemUnitCost(getProductCMV(prod));
    } else {
      setItemUnitCost(0);
    }
  };

  const handleEditItemInList = (index: number) => {
    const it = mealItems[index];
    if (!it) return;
    setEditingItemIndex(index);
    if (it.type === 'product' && it.productId) {
      setItemType('produto_proprio');
      setItemProductId(it.productId);
      setItemUnitCost(it.cost);
      setItemManualDescription('');
    } else {
      setItemType('item_externo');
      setItemManualDescription(it.name);
      setItemUnitCost(it.cost);
    }
    setItemQuantity(it.quantity);
    setItemCategory(it.category || 'lanche');
  };

  const handleRemoveItemFromList = (index: number) => {
    setMealItems(prev => prev.filter((_, i) => i !== index));
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setItemManualDescription('');
      setItemQuantity(1);
    }
  };

  // --- SALVAR ALIMENTAÇÃO CONSOLIDADA (COM TODOS OS ITENS) ---
  const handleSaveMeal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let itemsToSave = [...mealItems];

    // Se a lista estiver vazia, mas o usuário preencheu o produto/descrição acima, adiciona automaticamente
    if (itemsToSave.length === 0) {
      if (itemType === 'produto_proprio') {
        const prod = products.find(p => p.id === itemProductId);
        if (prod && itemQuantity > 0) {
          itemsToSave.push({
            id: 'item_' + Math.random().toString(36).substr(2, 9),
            type: 'product',
            productId: prod.id,
            name: prod.name,
            cost: Number(itemUnitCost) || getProductCMV(prod),
            salePriceReference: prod.prices?.loja_fisica || prod.targetPrice || undefined,
            quantity: itemQuantity,
            category: itemCategory
          });
        }
      } else if (itemManualDescription.trim() && itemQuantity > 0) {
        itemsToSave.push({
          id: 'item_' + Math.random().toString(36).substr(2, 9),
          type: 'custom',
          name: itemManualDescription.trim(),
          cost: Number(itemUnitCost) || 0,
          quantity: itemQuantity,
          category: itemCategory
        });
      }
    }

    if (itemsToSave.length === 0) {
      alert('Adicione pelo menos um item à refeição (clique em "Adicionar ao Consumo").');
      return;
    }

    let collabName = 'Toda a Equipe (Geral)';
    let collabId = 'all';

    if (mealCollaboratorId !== 'all') {
      const c = collaborators.find(col => col.id === mealCollaboratorId);
      if (c) {
        collabName = c.name;
        collabId = c.id;
      }
    }

    const totalCost = Number(
      itemsToSave.reduce((sum, it) => sum + (it.cost * it.quantity), 0).toFixed(2)
    );
    const totalQty = itemsToSave.reduce((sum, it) => sum + it.quantity, 0);
    const summaryName = itemsToSave.map(it => `${it.quantity}x ${it.name}`).join(' • ');

    if (editingMealId) {
      updateCollaboratorMeal(editingMealId, {
        date: mealDate,
        collaboratorId: collabId,
        collaboratorName: collabName,
        items: itemsToSave,
        productName: summaryName,
        quantity: totalQty,
        unitCost: totalQty > 0 ? Number((totalCost / totalQty).toFixed(2)) : 0,
        totalCost,
        notes: mealNotes.trim() || undefined
      });
      alert('Alimentação atualizada com sucesso!');
    } else {
      const newMeal: CollaboratorMeal = {
        id: 'meal_' + Math.random().toString(36).substr(2, 9),
        date: mealDate,
        collaboratorId: collabId,
        collaboratorName: collabName,
        type: itemsToSave.every(i => i.type === 'product') ? 'produto_proprio' : 'item_externo',
        items: itemsToSave,
        productName: summaryName,
        quantity: totalQty,
        unitCost: totalQty > 0 ? Number((totalCost / totalQty).toFixed(2)) : 0,
        totalCost,
        notes: mealNotes.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      addCollaboratorMeal(newMeal);
      alert('Alimentação registrada com sucesso pelo custo real!');
    }

    setIsMealModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* TOP BAR / HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-white/10 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Colaboradores & Mão de Obra
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Gestão Completa
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Fechamento diário, diárias, salários, taxas de entrega e alimentação calculada pelo custo real do produto.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-2xl border border-white/10 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Mês:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-black focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
          >
            <UserPlus size={16} />
            Novo Colaborador
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Ativos */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Users size={14} className="text-blue-400" />
            Equipe Ativa
          </span>
          <span className="text-lg font-black text-white block">
            {monthStats.activeCount} <span className="text-xs font-normal text-slate-400">pessoas</span>
          </span>
          <span className="text-[10px] text-slate-400 block truncate">Disponíveis p/ escala</span>
        </div>

        {/* Saldo Pendente */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
            <AlertCircle size={14} />
            A Pagar / Pendente
          </span>
          <span className="text-lg font-black text-amber-300 block">
            {formatMoney(monthStats.totalPendingMonth)}
          </span>
          <button 
            onClick={() => setActiveTab('pagamentos')}
            className="text-[10px] text-amber-400 hover:underline font-bold block"
          >
            Ver acertos pendentes →
          </button>
        </div>

        {/* Mão de Obra Fixa (CFI) */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
            <DollarSign size={14} />
            Mão de Obra (CFI)
          </span>
          <span className="text-lg font-black text-emerald-400 block">
            {formatMoney(monthStats.totalFixedLaborCfi)}
          </span>
          <span className="text-[10px] text-slate-400 block truncate">Diárias + Salários</span>
        </div>

        {/* Taxas de Entrega (Variável) */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1.5">
            <Truck size={14} />
            Taxas de Entrega
          </span>
          <span className="text-lg font-black text-orange-300 block">
            {formatMoney(monthStats.totalDeliveryFees)}
          </span>
          <span className="text-[10px] text-slate-400 block truncate">Custo Variável • {monthStats.totalDeliveriesCount} entregas</span>
        </div>

        {/* Alimentação & Benefícios */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
            <Utensils size={14} />
            Alimentação
          </span>
          <span className="text-lg font-black text-purple-300 block">
            {formatMoney(monthStats.totalMealsCost)}
          </span>
          <span className="text-[10px] text-slate-400 block truncate">{monthStats.totalMealsCount} refeições (CMV real)</span>
        </div>

        {/* CMO % Faturamento */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
            <Sparkles size={14} />
            CMO da Loja
          </span>
          <span className="text-lg font-black text-white block">
            {monthStats.cmoPercent.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block truncate">Meta: 18% a 25%</span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('fechamento')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
            activeTab === 'fechamento'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Calendar size={16} />
          Fechamento do Dia
        </button>

        <button
          onClick={() => setActiveTab('pagamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition relative ${
            activeTab === 'pagamentos'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Wallet size={16} />
          Pagamentos & Acertos
          {monthStats.totalPendingMonth > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('refeicoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
            activeTab === 'refeicoes'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Utensils size={16} />
          Alimentação & Benefícios
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
            activeTab === 'team'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Users size={16} />
          Equipe ({collaborators.length})
        </button>

        <button
          onClick={() => setActiveTab('salarios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
            activeTab === 'salarios'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Briefcase size={16} />
          Salários & Pró-labore
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Receipt size={16} />
          Histórico & Extrato
        </button>
      </div>

      {/* TAB 1: FECHAMENTO DO DIA */}
      {activeTab === 'fechamento' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar size={20} className="text-emerald-400" />
                  Quem trabalhou hoje? ({DAYS_OF_WEEK[dayOfWeekNumber]})
                </h2>
                <p className="text-xs text-slate-400">
                  Marque quem esteve na operação. O valor da diária vem pré-preenchido pela regra semanal, mas é totalmente editável.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10">
                  <label className="text-xs text-slate-300 font-bold">Data:</label>
                  <input
                    type="date"
                    value={fechamentoDate}
                    onChange={(e) => setFechamentoDate(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllActive}
                    className="text-[11px] font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-white/10 transition"
                  >
                    Selecionar Todos
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="text-[11px] font-bold px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 rounded-xl border border-white/5 transition"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>

            {/* CONSOLIDATION OPTION IN CONTAS A PAGAR */}
            <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-start sm:items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consolidateInExpenses}
                  onChange={(e) => setConsolidateInExpenses(e.target.checked)}
                  className="w-4 h-4 mt-0.5 sm:mt-0 rounded accent-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Layers size={14} className="text-emerald-400" />
                    Consolidar mão de obra em uma única despesa no Contas a Pagar
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Cria apenas 1 registro agrupado no Contas a Pagar (evita poluir com dezenas de linhas diárias). Todo o extrato individual fica salvo aqui em Colaboradores.
                  </p>
                </div>
              </label>

              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                {consolidateInExpenses ? '✓ Modo Consolidado Ativo' : 'Lançamento Individual'}
              </span>
            </div>

            {activeCollaborators.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-white/10 space-y-3">
                <Users size={36} className="mx-auto text-slate-500" />
                <p className="text-slate-300 text-sm font-medium">Você ainda não possui colaboradores ativos cadastrados.</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  + Cadastrar Primeiro Colaborador
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* SELECT COLLABORATORS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeCollaborators.map((c) => {
                    const isSelected = !!selectedCollabIds[c.id];
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleCollabSelection(c)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md'
                            : 'bg-slate-800/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-500'
                          }`}>
                            {isSelected && <Check size={14} className="stroke-[3]" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{c.name}</h4>
                            <span className="text-xs text-slate-400">{c.role} • <span className="text-emerald-400 capitalize">{c.remunerationType.replace('_', ' ')}</span></span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-slate-300">
                          {c.defaultAmount > 0 ? formatMoney(c.defaultAmount) : 'A definir'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* DETAILED LAUNCH FOR SELECTED COLLABORATORS */}
                {Object.keys(selectedCollabIds).some(id => selectedCollabIds[id]) && (
                  <div className="mt-8 space-y-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <DollarSign size={18} className="text-emerald-400" />
                        Valores, Taxas e Acertos do Dia ({Object.keys(selectedCollabIds).filter(id => selectedCollabIds[id]).length} selecionados)
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {activeCollaborators.filter(c => selectedCollabIds[c.id]).map((c) => {
                        const vals = closingValues[c.id] || {
                          remunerationType: c.remunerationType,
                          baseAmount: c.defaultAmount,
                          deliveryFeeAmount: 0,
                          deliveryCount: '',
                          status: 'pago' as const,
                          paymentMethod: 'pix' as const,
                          notes: ''
                        };

                        const isEntregador = c.role.toLowerCase().includes('entregador') || 
                                             c.role.toLowerCase().includes('motoboy') || 
                                             vals.remunerationType === 'diaria_mais_taxas' || 
                                             vals.remunerationType === 'por_entrega';

                        const totalIndividual = (Number(vals.baseAmount) || 0) + (Number(vals.deliveryFeeAmount) || 0);

                        // Refeições deste colaborador na data do fechamento
                        const collabMealsToday = collaboratorMeals.filter(m => 
                          m.date === fechamentoDate && m.collaboratorId === c.id
                        );
                        const collabMealsCostToday = collabMealsToday.reduce((sum, m) => sum + (m.totalCost || 0), 0);
                        const collabMealsItemsCountToday = collabMealsToday.reduce((sum, m) => {
                          if (m.items && m.items.length > 0) return sum + m.items.reduce((s, it) => s + (it.quantity || 1), 0);
                          return sum + (m.quantity || 1);
                        }, 0);

                        return (
                          <div key={c.id} className="p-5 bg-slate-950/60 rounded-2xl border border-white/10 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">{c.name}</span>
                                <span className="text-xs text-slate-400">({c.role})</span>
                                {c.paymentFrequency && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold capitalize">
                                    {c.paymentFrequency.replace('_', ' ')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-xs">
                                <div className="text-right">
                                  <span className="text-slate-400 block text-[10px]">A Pagar Hoje:</span>
                                  <span className="text-base font-black text-emerald-400">{formatMoney(totalIndividual)}</span>
                                </div>
                                {collabMealsCostToday > 0 && (
                                  <div className="text-right pl-3 border-l border-white/10">
                                    <span className="text-purple-300 block text-[10px] font-bold">Consumo CMV:</span>
                                    <span className="text-sm font-black text-purple-300">{formatMoney(collabMealsCostToday)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <label className="block text-slate-400 font-bold mb-1">Diária / Mão de Obra (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={vals.baseAmount}
                                  onChange={(e) => handleClosingValueChange(c.id, 'baseAmount', Number(e.target.value))}
                                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:border-emerald-500 focus:outline-none"
                                  placeholder="60.00"
                                />
                                <span className="text-[10px] text-emerald-400 mt-1 block">Vai para Despesas Fixas (CFI)</span>
                              </div>

                              {isEntregador && (
                                <>
                                  <div>
                                    <label className="block text-slate-400 font-bold mb-1">Taxas de Entrega (R$)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={vals.deliveryFeeAmount}
                                      onChange={(e) => handleClosingValueChange(c.id, 'deliveryFeeAmount', Number(e.target.value))}
                                      className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:border-emerald-500 focus:outline-none text-orange-300"
                                      placeholder="87.40"
                                    />
                                    <span className="text-[10px] text-orange-400 mt-1 block">Custo Variável • FORA do CFI</span>
                                  </div>

                                  <div>
                                    <label className="block text-slate-400 font-bold mb-1">Qtd Entregas (Opcional)</label>
                                    <input
                                      type="number"
                                      value={vals.deliveryCount}
                                      onChange={(e) => handleClosingValueChange(c.id, 'deliveryCount', e.target.value)}
                                      className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none"
                                      placeholder="Ex: 12"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Para ticket médio da entrega</span>
                                  </div>
                                </>
                              )}

                              <div>
                                <label className="block text-slate-400 font-bold mb-1">Status de Liquidação</label>
                                <select
                                  value={vals.status}
                                  onChange={(e) => handleClosingValueChange(c.id, 'status', e.target.value)}
                                  className={`w-full px-3 py-2 rounded-xl border font-bold focus:outline-none ${
                                    vals.status === 'pago' 
                                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' 
                                      : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  <option value="pago">🟢 Pago Hoje</option>
                                  <option value="pendente">🟠 Pendente (Acerto futuro)</option>
                                </select>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {vals.status === 'pendente' ? 'Ficará com saldo a pagar' : 'Liquidado no caixa/PIX'}
                                </span>
                              </div>

                              {vals.status === 'pago' && (
                                <div>
                                  <label className="block text-slate-400 font-bold mb-1">Forma de Pagamento</label>
                                  <select
                                    value={vals.paymentMethod}
                                    onChange={(e) => handleClosingValueChange(c.id, 'paymentMethod', e.target.value)}
                                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:border-emerald-500 focus:outline-none"
                                  >
                                    <option value="pix">PIX</option>
                                    <option value="dinheiro">Dinheiro / Caixa</option>
                                    <option value="transferencia">Transferência / TED</option>
                                    <option value="cartao">Cartão de Débito</option>
                                  </select>
                                </div>
                              )}
                            </div>

                            {/* SEÇÃO INTEGRADA: ALIMENTAÇÃO E BENEFÍCIOS DO DIA */}
                            <div className="p-4 bg-purple-950/20 rounded-2xl border border-purple-500/30 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Utensils size={16} className="text-purple-400" />
                                  <span className="text-xs font-black text-purple-200">
                                    Alimentação & Consumo do Dia
                                  </span>
                                  {collabMealsToday.length > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-bold">
                                      {collabMealsItemsCountToday} item(ns) • CMV: {formatMoney(collabMealsCostToday)}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openMealModal(c.id, fechamentoDate)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-black rounded-xl shadow transition transform active:scale-95 whitespace-nowrap self-start sm:self-auto"
                                >
                                  <Plus size={14} />
                                  {collabMealsToday.length > 0 ? 'Adicionar Mais Itens' : 'Lançar Alimentação'}
                                </button>
                              </div>

                              {collabMealsToday.length > 0 ? (
                                <div className="space-y-2 pt-1">
                                  {collabMealsToday.map((meal) => (
                                    <div key={meal.id} className="p-3 bg-slate-900/90 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-bold text-white">
                                            {meal.productName || 'Refeição'}
                                          </span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                                            {meal.type === 'produto_proprio' ? '🍔 Cardápio (CMV)' : '🍱 Externo'}
                                          </span>
                                          {meal.notes && (
                                            <span className="text-[10px] text-slate-400 italic">
                                              ({meal.notes})
                                            </span>
                                          )}
                                        </div>

                                        {/* Detalhamento de múltiplos itens */}
                                        {meal.items && meal.items.length > 1 && (
                                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {meal.items.map((it, idx) => (
                                              <span key={idx} className="text-[11px] px-2 py-0.5 bg-purple-950/40 text-purple-200 rounded-md border border-purple-500/20">
                                                {it.quantity}x {it.name} <span className="text-purple-400 font-bold">({formatMoney(it.cost * it.quantity)})</span>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                        <div className="text-right">
                                          <span className="text-[10px] text-slate-400 block">Custo Real (CMV)</span>
                                          <span className="text-xs font-black text-purple-300">{formatMoney(meal.totalCost)}</span>
                                        </div>

                                        <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                                          <button
                                            type="button"
                                            onClick={() => openMealModal(c.id, fechamentoDate, meal)}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg transition"
                                            title="Editar itens da refeição"
                                          >
                                            <Pencil size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (confirm(`Excluir este lançamento de alimentação (${meal.productName})?`)) {
                                                deleteCollaboratorMeal(meal.id);
                                              }
                                            }}
                                            className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg transition"
                                            title="Excluir lançamento"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-dashed border-white/10 text-slate-400 text-xs">
                                  <span>Nenhum consumo lançado para {c.name.split(' ')[0]} nesta data.</span>
                                  <button
                                    type="button"
                                    onClick={() => openMealModal(c.id, fechamentoDate)}
                                    className="text-[11px] font-bold text-purple-300 hover:text-purple-200 underline"
                                  >
                                    Lançar agora
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* SUMMARY BAR BEFORE CONFIRMING */}
                    {(() => {
                      const selectedList = activeCollaborators.filter(c => selectedCollabIds[c.id]);
                      const selectedIdsSet = new Set(selectedList.map(item => item.id));
                      const totalBase = selectedList.reduce((acc, c) => acc + (Number(closingValues[c.id]?.baseAmount) || 0), 0);
                      const totalFees = selectedList.reduce((acc, c) => acc + (Number(closingValues[c.id]?.deliveryFeeAmount) || 0), 0);
                      const totalNight = totalBase + totalFees;

                      // Refeições dos colaboradores selecionados na data de fechamento
                      const nightMeals = collaboratorMeals.filter(m => 
                        m.date === fechamentoDate && selectedIdsSet.has(m.collaboratorId)
                      );
                      const totalNightMealsCost = nightMeals.reduce((acc, m) => acc + (m.totalCost || 0), 0);
                      const totalNightMealsCount = nightMeals.reduce((acc, m) => {
                        if (m.items && m.items.length > 0) return acc + m.items.reduce((s, it) => s + (it.quantity || 1), 0);
                        return acc + (m.quantity || 1);
                      }, 0);

                      return (
                        <div className="p-5 bg-slate-900 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-6 text-xs">
                            <div>
                              <span className="text-slate-400 block">Colaboradores:</span>
                              <span className="text-sm font-black text-white">{selectedList.length} presentes</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Mão de Obra Fixa (CFI):</span>
                              <span className="text-sm font-black text-emerald-400">{formatMoney(totalBase)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Taxas Entrega (Variável):</span>
                              <span className="text-sm font-black text-orange-400">{formatMoney(totalFees)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Alimentação Equipe (CMV):</span>
                              <span className="text-sm font-black text-purple-300">
                                {formatMoney(totalNightMealsCost)} ({totalNightMealsCount} itens)
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Total da Noite:</span>
                              <span className="text-base font-black text-white">{formatMoney(totalNight + totalNightMealsCost)}</span>
                            </div>
                          </div>

                          <button
                            onClick={handleSaveFechamento}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition transform active:scale-95 whitespace-nowrap"
                          >
                            CONFIRMAR FECHAMENTO DO DIA
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAGAMENTOS & ACERTOS */}
      {activeTab === 'pagamentos' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Wallet size={20} className="text-emerald-400" />
                  Pagamentos, Saldos Pendentes e Acertos
                </h2>
                <p className="text-xs text-slate-400">
                  Acompanhe valores a pagar, quite pagamentos em lote e consolide despesas antigas no Contas a Pagar.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleConsolidateLegacy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-white/10 transition"
                  title="Agrupa lançamentos individuais antigos no Contas a Pagar"
                >
                  <RefreshCw size={14} className="text-emerald-400" />
                  Consolidar Antigos no Contas a Pagar
                </button>

                {pendingPaymentsList.length > 0 && (
                  <button
                    onClick={() => handleOpenSettlementModal()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition"
                  >
                    <CheckCircle2 size={16} />
                    Quitar Pendentes em Lote ({pendingPaymentsList.length})
                  </button>
                )}
              </div>
            </div>

            {/* PENDING SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl">
                <span className="text-xs font-bold text-amber-400 block">Total a Pagar (Pendente)</span>
                <span className="text-xl font-black text-amber-300 block mt-1">
                  {formatMoney(monthStats.totalPendingMonth)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {pendingPaymentsList.length} lançamento(s) aguardando liquidação
                </span>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
                <span className="text-xs font-bold text-emerald-400 block">Total Liquidado em {selectedMonth}</span>
                <span className="text-xl font-black text-emerald-300 block mt-1">
                  {formatMoney(monthStats.totalPaidMonth)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Pagamentos quitados no mês
                </span>
              </div>

              <div className="p-4 bg-slate-950/40 border border-white/10 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 block">Colaboradores com Saldo</span>
                <span className="text-xl font-black text-white block mt-1">
                  {new Set(pendingPaymentsList.map(p => p.collaboratorId)).size} colaboradores
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Com diárias ou taxas a acertar
                </span>
              </div>
            </div>

            {/* PAYMENTS LIST */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white">Todos os Lançamentos de {selectedMonth}</h3>

              {collaboratorPayments.filter(p => p.date.startsWith(selectedMonth)).length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-white/10 text-slate-400 text-sm">
                  Nenhum registro de pagamento encontrado para {selectedMonth}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-3">Data</th>
                        <th className="py-3 px-3">Colaborador</th>
                        <th className="py-3 px-3">Mão de Obra (Fixa)</th>
                        <th className="py-3 px-3">Taxas Entrega (Var.)</th>
                        <th className="py-3 px-3">Total</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Forma</th>
                        <th className="py-3 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {collaboratorPayments
                        .filter(p => p.date.startsWith(selectedMonth))
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((p) => {
                          const isPaid = p.status === 'pago';
                          const isPartial = p.status === 'parcial';

                          return (
                            <tr key={p.id} className="hover:bg-white/5 transition">
                              <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                                {p.date.split('-').reverse().join('/')}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-200 block">{p.collaboratorName}</span>
                                <span className="text-[10px] text-slate-400">{p.collaboratorRole}</span>
                              </td>
                              <td className="py-3 px-3 font-bold text-emerald-400">
                                {formatMoney(p.baseAmount)}
                              </td>
                              <td className="py-3 px-3 font-bold text-orange-400">
                                {p.deliveryFeeAmount > 0 ? formatMoney(p.deliveryFeeAmount) : '-'}
                              </td>
                              <td className="py-3 px-3 font-black text-white">
                                {formatMoney(p.totalPaid)}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                                  isPaid 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : isPartial
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {isPaid ? '🟢 Pago' : isPartial ? '🔵 Parcial' : '🟠 Pendente'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-400 uppercase text-[10px] font-bold">
                                {p.paymentMethod || (isPaid ? 'PIX' : '-')}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {!isPaid && (
                                    <button
                                      onClick={() => handleQuickPayPayment(p)}
                                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-lg transition"
                                      title="Dar como pago"
                                    >
                                      Quitar
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (confirm('Excluir este lançamento de pagamento?')) {
                                        deleteCollaboratorPayment(p.id);
                                      }
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition"
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
          </div>
        </div>
      )}

      {/* TAB 3: ALIMENTAÇÃO & BENEFÍCIOS */}
      {activeTab === 'refeicoes' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Utensils size={20} className="text-purple-400" />
                  Alimentação da Equipe & Benefícios
                </h2>
                <p className="text-xs text-slate-400">
                  Controle de refeições internas calculadas pelo <span className="text-purple-300 font-bold">Custo Real (CMV)</span> e itens externos fornecidos à equipe.
                </p>
              </div>

              <button
                onClick={() => openMealModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-purple-500/20 transition"
              >
                <Plus size={16} />
                Lançar Alimentação / Benefício
              </button>
            </div>

            {/* EDUCATIONAL BANNER */}
            <div className="p-4 bg-purple-950/30 rounded-2xl border border-purple-500/30 flex items-start gap-3">
              <Sparkles size={18} className="text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-black text-purple-200 block">
                  Regra de Ouro: Cálculo pelo Custo Real (CMV) e não pelo Preço de Venda
                </span>
                <p className="text-purple-300/80">
                  Quando o colaborador consome um hambúrguer que custa R$ 35 no cardápio mas tem custo de insumo de R$ 9,50, o sistema computa apenas os R$ 9,50. Isso evita inflar artificialmente suas despesas e reflete o impacto real no fluxo de caixa.
                </p>
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-slate-400 block">Custo Total de Alimentação ({selectedMonth})</span>
                <span className="text-xl font-black text-purple-300 block mt-1">
                  {formatMoney(monthStats.totalMealsCost)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Impacto real nos custos do mês
                </span>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-slate-400 block">Refeições / Itens Fornecidos</span>
                <span className="text-xl font-black text-white block mt-1">
                  {monthStats.totalMealsCount} itens
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Consumidos pela equipe
                </span>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-slate-400 block">Custo Médio por Colaborador Ativo</span>
                <span className="text-xl font-black text-emerald-400 block mt-1">
                  {formatMoney(monthStats.activeCount > 0 ? monthStats.totalMealsCost / monthStats.activeCount : 0)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Média mensal por pessoa
                </span>
              </div>
            </div>

            {/* MEALS TABLE */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white">Histórico de Refeições e Benefícios ({selectedMonth})</h3>

              {collaboratorMeals.filter(m => m.date.startsWith(selectedMonth)).length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-white/10 text-slate-400 text-sm">
                  Nenhum registro de alimentação lançado para o mês de {selectedMonth}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-3">Data</th>
                        <th className="py-3 px-3">Colaborador</th>
                        <th className="py-3 px-3">Item / Benefício</th>
                        <th className="py-3 px-3">Tipo</th>
                        <th className="py-3 px-3">Qtd</th>
                        <th className="py-3 px-3">Custo Unit. (CMV)</th>
                        <th className="py-3 px-3">Custo Total</th>
                        <th className="py-3 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {collaboratorMeals
                        .filter(m => m.date.startsWith(selectedMonth))
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((m) => (
                          <tr key={m.id} className="hover:bg-white/5 transition">
                            <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                              {m.date.split('-').reverse().join('/')}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-200">
                              {m.collaboratorName || 'Toda a Equipe (Geral)'}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-200">
                              {m.productName}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.type === 'produto_proprio'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {m.type === 'produto_proprio' ? 'Cardápio (CMV)' : 'Externo / Manual'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-200">{m.quantity}</td>
                            <td className="py-3 px-3 text-slate-400">{formatMoney(m.unitCost || 0)}</td>
                            <td className="py-3 px-3 font-black text-purple-300">{formatMoney(m.totalCost)}</td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openMealModal(m.collaboratorId, m.date, m)}
                                  className="p-1 text-slate-400 hover:text-purple-300 transition"
                                  title="Editar refeição e itens"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Excluir este lançamento de alimentação?')) {
                                      deleteCollaboratorMeal(m.id);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EQUIPE / COLABORADORES */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/10">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou função..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400">Status:</span>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === 'active' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === 'inactive' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Inativos
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Todos
              </button>
            </div>
          </div>

          {filteredCollaborators.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-white/10 space-y-3">
              <Users size={40} className="mx-auto text-slate-600" />
              <p className="text-slate-300 font-medium">Nenhum colaborador encontrado.</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                + Cadastrar Colaborador
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollaborators.map((c) => (
                <div key={c.id} className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 space-y-4 relative group hover:border-emerald-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-black text-white">{c.name}</h3>
                      <span className="text-xs text-emerald-400 font-bold block">{c.role}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {c.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-950/40 p-3 rounded-2xl border border-white/5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Modelo:</span>
                      <span className="font-bold text-slate-200 capitalize">{c.remunerationType.replace('_', ' ')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Frequência:</span>
                      <span className="font-bold text-slate-200 capitalize">{(c.paymentFrequency || 'no_dia').replace('_', ' ')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Valor Padrão:</span>
                      <span className="font-black text-emerald-400">{formatMoney(c.defaultAmount)}</span>
                    </div>

                    {c.pixKey && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Chave PIX:</span>
                        <span className="font-mono text-[11px] text-slate-300 truncate max-w-[140px]">{c.pixKey}</span>
                      </div>
                    )}

                    {c.weeklyRules && c.weeklyRules.length > 0 && (
                      <div className="text-[10px] text-amber-400 pt-1 font-semibold flex items-center gap-1">
                        <Sparkles size={12} /> Possui regras customizadas por dia da semana
                      </div>
                    )}
                  </div>

                  {c.notes && (
                    <p className="text-xs text-slate-400 italic line-clamp-2">"{c.notes}"</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      onClick={() => {
                        updateCollaborator(c.id, { status: c.status === 'active' ? 'inactive' : 'active' });
                      }}
                      className="text-xs text-slate-400 hover:text-white transition font-medium"
                    >
                      {c.status === 'active' ? 'Inativar' : 'Reativar'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(c)}
                        className="p-2 text-slate-300 hover:text-emerald-400 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Excluir permanentemente o colaborador ${c.name}? Seu histórico de pagamentos anteriores será mantido.`)) {
                            deleteCollaborator(c.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SALÁRIOS & PRÓ-LABORE */}
      {activeTab === 'salarios' && (
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-6">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Briefcase size={20} className="text-blue-400" />
              Lançar Salários Mensais e Pró-labore ({selectedMonth})
            </h2>
            <p className="text-xs text-slate-400">
              Lance os salários fixos e o pró-labore do proprietário para o mês de <span className="text-white font-bold">{selectedMonth}</span>. Esses valores entram automaticamente nas Despesas Fixas e no cálculo do CFI.
            </p>
          </div>

          <div className="space-y-3">
            {collaborators.filter(c => c.status === 'active' && (c.remunerationType === 'salario' || c.remunerationType === 'pro_labore')).length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-white/10 text-slate-400 text-sm">
                Nenhum colaborador com remuneração "Salário mensal" ou "Pró-labore" foi cadastrado.
              </div>
            ) : (
              collaborators.filter(c => c.status === 'active' && (c.remunerationType === 'salario' || c.remunerationType === 'pro_labore')).map((c) => {
                const isProLabore = c.remunerationType === 'pro_labore';

                return (
                  <div key={c.id} className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isProLabore ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {isProLabore ? 'Pró-Labore' : 'Salário Mensal'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{c.role}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Valor Mensal:</span>
                        <span className="text-base font-black text-emerald-400">{formatMoney(c.defaultAmount)}</span>
                      </div>

                      <button
                        onClick={() => {
                          addCollaboratorPayment({
                            id: 'pay_' + Math.random().toString(36).substr(2, 9),
                            collaboratorId: c.id,
                            collaboratorName: c.name,
                            collaboratorRole: c.role,
                            date: `${selectedMonth}-05`,
                            remunerationType: c.remunerationType,
                            baseAmount: c.defaultAmount,
                            deliveryFeeAmount: 0,
                            totalPaid: c.defaultAmount,
                            amountPaid: c.defaultAmount,
                            pendingBalance: 0,
                            status: 'pago',
                            paymentMethod: 'transferencia',
                            paymentDate: new Date().toISOString().slice(0, 10),
                            notes: `Competência ${selectedMonth}`
                          });
                          alert(`Pagamento mensal registrado para ${c.name}!`);
                          setActiveTab('history');
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
                      >
                        + Lançar para {selectedMonth}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 6: HISTÓRICO & EXTRATO */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Receipt size={20} className="text-emerald-400" />
                  Extrato Consolidado da Equipe — {selectedMonth}
                </h2>
                <p className="text-xs text-slate-400">
                  Consulte todos os lançamentos do mês, valores pagos, taxas de entrega e mão de obra fixa.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total do Mês:</span>
                <span className="text-xl font-black text-emerald-400">
                  {formatMoney(monthStats.totalPaidMonth)}
                </span>
              </div>
            </div>

            {collaboratorPayments.filter(p => p.date.startsWith(selectedMonth)).length === 0 ? (
              <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-dashed border-white/10 text-slate-400 text-sm">
                Nenhum pagamento registrado no mês de {selectedMonth}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Colaborador</th>
                      <th className="py-3 px-3">Função</th>
                      <th className="py-3 px-3">Mão de Obra (CFI)</th>
                      <th className="py-3 px-3">Taxas Entrega (Fora CFI)</th>
                      <th className="py-3 px-3">Total Pago</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {collaboratorPayments
                      .filter(p => p.date.startsWith(selectedMonth))
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                            {p.date.split('-').reverse().join('/')}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-200">{p.collaboratorName}</td>
                          <td className="py-3 px-3 text-slate-400">{p.collaboratorRole}</td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {formatMoney(p.baseAmount)}
                          </td>
                          <td className="py-3 px-3 font-bold text-orange-400">
                            {p.deliveryFeeAmount > 0 ? formatMoney(p.deliveryFeeAmount) : '-'}
                          </td>
                          <td className="py-3 px-3 font-black text-white">
                            {formatMoney(p.totalPaid)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              p.status === 'pago' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {p.status === 'pago' ? '🟢 Pago' : '🟠 Pendente'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm('Excluir este lançamento de pagamento?')) {
                                  deleteCollaboratorPayment(p.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                              title="Excluir Lançamento"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE COLABORADOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users size={20} className="text-emerald-400" />
                {editingCollaborator ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCollaborator} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-slate-800 text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">Função *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewRole(!isAddingNewRole)}
                      className="text-[10px] text-emerald-400 hover:underline font-bold"
                    >
                      + Nova função
                    </button>
                  </div>

                  {isAddingNewRole ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newRoleInput}
                        onChange={(e) => setNewRoleInput(e.target.value)}
                        placeholder="Ex: Auxiliar de Cozinha"
                        className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-emerald-500 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCustomRole}
                        className="px-3 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full bg-slate-800 text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none"
                    >
                      {(Object.entries(allRolesByCategory) as [string, string[]][]).map(([catTitle, roles]) => (
                        <optgroup key={catTitle} label={catTitle}>
                          {roles.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tipo de Remuneração *</label>
                  <select
                    value={formRemunerationType}
                    onChange={(e) => setFormRemunerationType(e.target.value as RemunerationType)}
                    className="w-full bg-slate-800 text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none font-bold text-emerald-400"
                  >
                    <option value="diaria">Diária</option>
                    <option value="salario">Salário Mensal</option>
                    <option value="diaria_mais_taxas">Diária + Taxas de Entrega</option>
                    <option value="por_entrega">Por Entrega</option>
                    <option value="pro_labore">Pró-labore (Proprietário / Sócio)</option>
                    <option value="outro">Outro / Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Frequência de Pagamento</label>
                  <select
                    value={formPaymentFrequency}
                    onChange={(e) => setFormPaymentFrequency(e.target.value as PaymentFrequency)}
                    className="w-full bg-slate-800 text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none font-bold"
                  >
                    <option value="no_dia">Diário (No dia do trabalho)</option>
                    <option value="semanal">Semanal (Acerto no fim de semana)</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Valor Padrão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDefaultAmount}
                    onChange={(e) => setFormDefaultAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 60.00"
                    className="w-full bg-slate-800 text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Sugestão inicial. Ajustável livremente no fechamento.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Chave PIX (Opcional)</label>
                  <input
                    type="text"
                    value={formPixKey}
                    onChange={(e) => setFormPixKey(e.target.value)}
                    placeholder="CPF, Telefone ou E-mail"
                    className="w-full bg-slate-800 text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-800 text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-slate-800 text-white px-3 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="active">Ativo (aparece no fechamento)</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* REGRAS POR DIA DA SEMANA */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-400">
                    <input
                      type="checkbox"
                      checked={enableWeeklyRules}
                      onChange={(e) => setEnableWeeklyRules(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    Configurar valores diferentes por dia da semana (opcional)
                  </label>
                </div>

                {enableWeeklyRules && (
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/10 space-y-2 text-xs">
                    <p className="text-[11px] text-slate-400">
                      Defina valores padrão para cada dia (ex: R$ 60 de terça a quinta, R$ 80 na sexta/sábado).
                    </p>

                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                      {weeklyRules.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded-xl border border-white/5">
                          <span className="font-bold text-slate-200 w-28">{DAYS_OF_WEEK[r.dayOfWeek]}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={r.baseValue}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setWeeklyRules(prev => prev.map((item, i) => i === idx ? { ...item, baseValue: val } : item));
                            }}
                            className="w-24 bg-slate-800 text-white px-2 py-1 rounded-lg border border-white/10 text-xs text-right font-bold"
                            placeholder="R$ 0,00"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 text-xs">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Anotações internas..."
                  className="w-full bg-slate-800 text-white p-3 rounded-xl border border-white/10 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition shadow-lg shadow-emerald-500/20"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUITAÇÃO / ACERTO EM LOTE */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-400" />
                Quitar Pagamentos em Lote
              </h3>
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 space-y-2">
                <span className="text-slate-400 block font-bold">Resumo da Quitação</span>
                {(() => {
                  const targetList = collaboratorPayments.filter(p => selectedSettlementPaymentIds.includes(p.id));
                  const totalBase = targetList.reduce((sum, p) => sum + (Number(p.baseAmount) || 0), 0);
                  const totalFees = targetList.reduce((sum, p) => sum + (Number(p.deliveryFeeAmount) || 0), 0);
                  const grandTotal = totalBase + totalFees;

                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Qtd de Lançamentos:</span>
                        <span className="font-bold text-white">{targetList.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mão de Obra Fixa (CFI):</span>
                        <span className="font-bold text-emerald-400">{formatMoney(totalBase)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Taxas de Entrega:</span>
                        <span className="font-bold text-orange-400">{formatMoney(totalFees)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
                        <span className="font-black text-white">Total a Liquidar:</span>
                        <span className="font-black text-emerald-300">{formatMoney(grandTotal)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Data do Pagamento</label>
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Forma de Pagamento</label>
                <select
                  value={settlementMethod}
                  onChange={(e) => setSettlementMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:outline-none"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro / Caixa</option>
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="cartao">Cartão de Débito</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settlementConsolidate}
                    onChange={(e) => setSettlementConsolidate(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-emerald-300 font-bold">
                    Consolidar em um único registro pago no Contas a Pagar
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  placeholder="Ex: Acerto semanal fechado no PIX"
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSettlement}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg"
                >
                  Confirmar Quitação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAR ALIMENTAÇÃO / BENEFÍCIO (MÚLTIPLOS ITENS DO CARDÁPIO OU EXTERNOS) */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Utensils size={20} className="text-purple-400" />
                  {editingMealId ? 'Editar Alimentação / Consumo' : 'Lançar Alimentação da Equipe'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adicione quantos produtos do cardápio precisar. O sistema soma tudo pelo <span className="text-purple-300 font-bold">Custo Real (CMV)</span>.
                </p>
              </div>
              <button
                onClick={() => setIsMealModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-4 text-xs">
              {/* CABEÇALHO: DATA E COLABORADOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-950/60 rounded-2xl border border-white/10">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Data do Consumo *</label>
                  <input
                    type="date"
                    required
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Colaborador Beneficiado *</label>
                  <select
                    value={mealCollaboratorId}
                    onChange={(e) => setMealCollaboratorId(e.target.value)}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:outline-none"
                  >
                    <option value="all">👥 Toda a Equipe (Geral)</option>
                    {activeCollaborators.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COMPOSITOR DE ITENS: ADICIONAR / EDITAR ITENS NO CONSUMO */}
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-200 text-xs flex items-center gap-1.5">
                    <Plus size={15} className="text-purple-400" />
                    {editingItemIndex !== null ? 'Editar Item do Consumo' : 'Selecionar Item para Adicionar ao Consumo'}
                  </span>
                  {editingItemIndex !== null && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Editando Item #{editingItemIndex + 1}
                    </span>
                  )}
                </div>

                {/* TIPO DE ITEM */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('produto_proprio');
                      if (products.length > 0 && !itemProductId) {
                        handleProductChange(products[0].id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition font-bold ${
                      itemType === 'produto_proprio'
                        ? 'bg-purple-950/50 border-purple-500 text-purple-300'
                        : 'bg-slate-800/60 border-white/10 text-slate-400'
                    }`}
                  >
                    🍔 Produto do Cardápio
                    <span className="text-[10px] block font-normal text-slate-400 mt-0.5">Custo Real dos Insumos (CMV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemType('item_externo')}
                    className={`p-2.5 rounded-xl border text-center transition font-bold ${
                      itemType === 'item_externo'
                        ? 'bg-purple-950/50 border-purple-500 text-purple-300'
                        : 'bg-slate-800/60 border-white/10 text-slate-400'
                    }`}
                  >
                    🍱 Item Externo / Outro
                    <span className="text-[10px] block font-normal text-slate-400 mt-0.5">Marmitex, refrigerante, café</span>
                  </button>
                </div>

                {/* CAMPOS DO ITEM */}
                {itemType === 'produto_proprio' ? (
                  <div className="space-y-3 p-3 bg-slate-900 rounded-xl border border-white/10">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Selecione o Produto do Cardápio *</label>
                      <select
                        value={itemProductId}
                        onChange={(e) => handleProductChange(e.target.value)}
                        className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:outline-none"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedMealProduct && (
                      <div className="p-2.5 bg-purple-950/30 rounded-xl border border-purple-500/30 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Preço Cardápio</span>
                          <span className="text-slate-400 line-through">
                            {formatMoney(selectedMealProduct.prices?.loja_fisica || selectedMealProduct.targetPrice || 0)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-purple-300 block text-[10px] font-bold">Custo Real CMV (Ingredientes)</span>
                          <span className="text-emerald-400 font-black text-sm">
                            {formatMoney(itemUnitCost)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-3 bg-slate-900 rounded-xl border border-white/10">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Descrição do Item *</label>
                      <input
                        type="text"
                        value={itemManualDescription}
                        onChange={(e) => setItemManualDescription(e.target.value)}
                        placeholder="Ex: Marmitex do restaurante vizinho, Coca-cola 2L..."
                        className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Categoria</label>
                        <select
                          value={itemCategory}
                          onChange={(e) => setItemCategory(e.target.value as any)}
                          className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
                        >
                          <option value="marmita">Marmita Externa</option>
                          <option value="lanche">Lanche / Salgado</option>
                          <option value="bebida">Bebida / Refrigerante</option>
                          <option value="sobremesa">Sobremesa / Doce</option>
                          <option value="outro">Outro Benefício</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Custo Unitário (R$) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={itemUnitCost}
                          onChange={(e) => setItemUnitCost(Number(e.target.value))}
                          placeholder="18.00"
                          className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* QUANTIDADE E SUB-TOTAL DO ITEM */}
                <div className="grid grid-cols-2 gap-3 items-center pt-1">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Quantidade *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                        className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full text-center bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-black focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setItemQuantity(itemQuantity + 1)}
                        className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Subtotal do Item</label>
                    <div className="w-full bg-slate-950 px-3 py-2 rounded-xl border border-white/10 font-black text-purple-300 text-sm">
                      {formatMoney(Number((itemUnitCost * itemQuantity).toFixed(2)))}
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE ADICIONAR / SALVAR ALTERAÇÃO DE ITEM */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  {editingItemIndex !== null ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemIndex(null);
                          setItemManualDescription('');
                          setItemQuantity(1);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                      >
                        Cancelar Edição
                      </button>
                      <button
                        type="button"
                        onClick={handleAddOrUpdateItem}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow transition"
                      >
                        Salvar Alteração do Item
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddOrUpdateItem}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Adicionar Mais Itens ao Consumo
                    </button>
                  )}
                </div>
              </div>

              {/* LISTA DE ITENS NA REFEIÇÃO (CESTA) */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-black text-white text-xs flex items-center gap-1.5">
                    <Utensils size={14} className="text-purple-400" />
                    Itens no Consumo Desta Refeição ({mealItems.length})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {mealItems.reduce((sum, it) => sum + it.quantity, 0)} unidade(s) total
                  </span>
                </div>

                {mealItems.length === 0 ? (
                  <div className="p-4 text-center rounded-xl border border-dashed border-white/10 text-slate-400 text-xs">
                    Nenhum item adicionado à cesta ainda. Selecione os itens acima e clique em <span className="text-purple-300 font-bold">"Adicionar Mais Itens ao Consumo"</span>.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {mealItems.map((it, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white">{it.quantity}x {it.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                              {it.type === 'product' ? 'Cardápio (CMV)' : 'Externo'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Unitário: {formatMoney(it.cost)} • Subtotal: <strong className="text-purple-300">{formatMoney(it.cost * it.quantity)}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditItemInList(idx)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg transition"
                            title="Editar este item"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromList(idx)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg transition"
                            title="Excluir este item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* RESUMO TOTAL DA REFEIÇÃO */}
                {(() => {
                  const runningTotal = mealItems.reduce((sum, it) => sum + (it.cost * it.quantity), 0);
                  return (
                    <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-500/30 flex items-center justify-between text-xs font-bold">
                      <span className="text-purple-200">Custo Total da Refeição (CMV dos Itens):</span>
                      <span className="text-base font-black text-emerald-400">{formatMoney(runningTotal)}</span>
                    </div>
                  );
                })()}
              </div>

              {/* OBSERVAÇÕES */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Observações Internas (Opcional)</label>
                <input
                  type="text"
                  value={mealNotes}
                  onChange={(e) => setMealNotes(e.target.value)}
                  placeholder="Ex: Refeição do fechamento de sábado, turno da noite..."
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
                />
              </div>

              {/* BOTÕES FINAIS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsMealModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl shadow-xl shadow-purple-500/20 transition transform active:scale-95"
                >
                  {editingMealId ? 'Salvar Alterações' : 'Salvar Refeição Completa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
