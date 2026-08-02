import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Collaborator, CollaboratorPayment, RemunerationType, DayOfWeekRule } from '../types';
import { DEFAULT_COLLABORATOR_ROLES_BY_CATEGORY, formatMoney } from '../constants';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  DollarSign, 
  Truck, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Info,
  Check,
  X,
  Search,
  UserCheck,
  UserX,
  ArrowUpRight,
  Receipt
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
    customCollaboratorRoles = [],
    addCollaborator, 
    updateCollaborator, 
    deleteCollaborator, 
    addCustomCollaboratorRole,
    addCollaboratorPayment,
    addCollaboratorPaymentsBatch,
    updateCollaboratorPaymentStatus,
    deleteCollaboratorPayment
  } = useApp();

  // Selected Month for Overview & History
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<'team' | 'fechamento' | 'salarios' | 'history'>('fechamento');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  // Collaborator Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);

  // Custom role input state
  const [isAddingNewRole, setIsAddingNewRole] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formRemunerationType, setFormRemunerationType] = useState<RemunerationType>('diaria');
  const [formDefaultAmount, setFormDefaultAmount] = useState<number | ''>('');
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');
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
  
  // Map of selected collaborator IDs in fechamento
  const [selectedCollabIds, setSelectedCollabIds] = useState<Record<string, boolean>>({});
  
  // Custom values for each collaborator in today's closing
  const [closingValues, setClosingValues] = useState<Record<string, {
    remunerationType: RemunerationType;
    baseAmount: number;
    deliveryFeeAmount: number;
    deliveryCount: number | '';
    status: 'pago' | 'pendente';
    notes: string;
  }>>({});

  // Reset or Populate Fechamento values whenever date or selected collaboratos change
  const dayOfWeekNumber = useMemo(() => {
    if (!fechamentoDate) return 0;
    const d = new Date(fechamentoDate + 'T12:00:00');
    return d.getDay();
  }, [fechamentoDate]);

  const activeCollaborators = useMemo(() => {
    return collaborators.filter(c => c.status === 'active');
  }, [collaborators]);

  // Compute month's statistics
  const monthStats = useMemo(() => {
    const monthPayments = collaboratorPayments.filter(p => p.date.startsWith(selectedMonth));
    
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
    const totalPaidMonth = monthPayments.reduce((sum, p) => sum + p.totalPaid, 0);

    return {
      activeCount: activeCollaborators.length,
      totalPaidMonth,
      totalFixedLaborCfi,
      totalSalarios,
      totalDiarias,
      totalProLabore,
      totalDeliveryFees,
      totalDeliveriesCount,
      avgFeePerDelivery: totalDeliveriesCount > 0 ? totalDeliveryFees / totalDeliveriesCount : 0
    };
  }, [collaboratorPayments, selectedMonth, activeCollaborators]);

  // Initialize modal for creation/editing
  const handleOpenModal = (collab?: Collaborator) => {
    if (collab) {
      setEditingCollaborator(collab);
      setFormName(collab.name);
      setFormRole(collab.role);
      setFormRemunerationType(collab.remunerationType);
      setFormDefaultAmount(collab.defaultAmount);
      setFormStartDate(collab.startDate || new Date().toISOString().slice(0, 10));
      setFormStatus(collab.status);
      setFormNotes(collab.notes || '');
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
      setFormRole('Cozinheiro');
      setFormRemunerationType('diaria');
      setFormDefaultAmount('');
      setFormStartDate(new Date().toISOString().slice(0, 10));
      setFormStatus('active');
      setFormNotes('');
      setEnableWeeklyRules(false);
      setWeeklyRules(DAYS_OF_WEEK.map((_, idx) => ({
        dayOfWeek: idx as any,
        remunerationType: 'diaria',
        baseValue: 0,
        active: true
      })));
    }
    setIsModalOpen(true);
  };

  const handleSaveCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor, informe o nome do colaborador.');
      return;
    }

    const defaultAmountNum = typeof formDefaultAmount === 'number' ? formDefaultAmount : Number(formDefaultAmount || 0);

    const collabData: Omit<Collaborator, 'id'> = {
      name: formName.trim(),
      role: formRole.trim() || 'Outro',
      remunerationType: formRemunerationType,
      defaultAmount: defaultAmountNum,
      weeklyRules: enableWeeklyRules ? weeklyRules : undefined,
      startDate: formStartDate,
      status: formStatus,
      notes: formNotes.trim(),
    };

    if (editingCollaborator) {
      updateCollaborator(editingCollaborator.id, collabData);
    } else {
      addCollaborator({
        ...collabData,
        id: 'collab_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      });
    }

    setIsModalOpen(false);
  };

  const handleAddNewCustomRole = () => {
    if (!newRoleInput.trim()) return;
    addCustomCollaboratorRole(newRoleInput.trim());
    setFormRole(newRoleInput.trim());
    setNewRoleInput('');
    setIsAddingNewRole(false);
  };

  // --- FECHAMENTO DO DIA LOGIC ---
  const handleToggleCollabSelection = (c: Collaborator) => {
    const isSelected = !selectedCollabIds[c.id];
    setSelectedCollabIds(prev => ({ ...prev, [c.id]: isSelected }));

    if (isSelected && !closingValues[c.id]) {
      // Calculate default value based on weekly rules or default amount
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
          baseAmount: defaultType === 'pro_labore' || defaultType === 'salario' ? defaultBase : defaultBase,
          deliveryFeeAmount: 0,
          deliveryCount: '',
          status: 'pago',
          notes: ''
        }
      }));
    }
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
        status: 'pago',
        notes: ''
      };

      const baseVal = Number(closing.baseAmount) || 0;
      const feeVal = Number(closing.deliveryFeeAmount) || 0;
      const totalPaid = baseVal + feeVal;

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
        status: closing.status,
        paymentDate: closing.status === 'pago' ? fechamentoDate : undefined,
        notes: closing.notes
      });
    });

    addCollaboratorPaymentsBatch(batchPayments);

    alert(`Fechamento do dia ${fechamentoDate} registrado com sucesso para ${batchPayments.length} colaborador(es)!`);
    
    // Reset selection for next launch
    setSelectedCollabIds({});
    setClosingValues({});
    setActiveTab('history');
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

  // Combined role suggestions from defaults + custom
  const allRolesByCategory = useMemo<Record<string, string[]>>(() => {
    const categories: Record<string, string[]> = { ...DEFAULT_COLLABORATOR_ROLES_BY_CATEGORY };
    if (customCollaboratorRoles.length > 0) {
      categories['MINHAS FUNÇÕES PERSONALIZADAS'] = customCollaboratorRoles;
    }
    return categories;
  }, [customCollaboratorRoles]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                COLABORADORES & MÃO DE OBRA
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Cadastre sua equipe, lance pagamentos diários e blinde seus custos fixos no CFI.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-white/10 transition shadow-md text-sm"
          >
            <UserPlus size={18} className="text-emerald-400" />
            + Novo Colaborador
          </button>

          <button
            onClick={() => setActiveTab('fechamento')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm"
          >
            <Calendar size={18} />
            Fechamento do Dia
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ativos</span>
            <Users size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black text-white">{monthStats.activeCount}</p>
          <span className="text-[10px] text-slate-400">Pessoas na loja</span>
        </div>

        <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Salários</span>
            <Briefcase size={16} className="text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-400">{formatMoney(monthStats.totalSalarios)}</p>
          <span className="text-[10px] text-emerald-400 font-bold">Entra nas Despesas Fixas</span>
        </div>

        <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Diárias</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400">{formatMoney(monthStats.totalDiarias)}</p>
          <span className="text-[10px] text-emerald-400 font-bold">Entra nas Despesas Fixas</span>
        </div>

        <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pró-labore</span>
            <DollarSign size={16} className="text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-400">{formatMoney(monthStats.totalProLabore)}</p>
          <span className="text-[10px] text-emerald-400 font-bold">Entra nas Despesas Fixas</span>
        </div>

        <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Taxas de Entrega</span>
            <Truck size={16} className="text-orange-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-orange-400">{formatMoney(monthStats.totalDeliveryFees)}</p>
          <span className="text-[10px] text-rose-400 font-bold">Variável • FORA do CFI</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-900 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Mão de Obra</span>
            <Receipt size={16} className="text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">{formatMoney(monthStats.totalPaidMonth)}</p>
          <span className="text-[10px] text-slate-300 font-semibold">Total pago no mês</span>
        </div>
      </div>

      {/* MONTH SELECTOR & NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('fechamento')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'fechamento'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Calendar size={16} />
            Fechamento do Dia
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users size={16} />
            Equipe ({collaborators.length})
          </button>

          <button
            onClick={() => setActiveTab('salarios')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'salarios'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Briefcase size={16} />
            Lançar Salários / Pró-labore
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Receipt size={16} />
            Histórico & Resumo
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300">
          <span className="text-slate-400 font-medium">Mês de Análise:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* TAB 1: FECHAMENTO DO DIA */}
      {activeTab === 'fechamento' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar size={20} className="text-emerald-400" />
                  Quem trabalhou hoje?
                </h2>
                <p className="text-xs text-slate-400">
                  Selecione os colaboradores presentes. O sistema aplica automaticamente o valor padrão da semana, que pode ser alterado livremente.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-300 font-bold">Data do Fechamento:</label>
                <input
                  type="date"
                  value={fechamentoDate}
                  onChange={(e) => setFechamentoDate(e.target.value)}
                  className="bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 text-sm font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <DollarSign size={18} className="text-emerald-400" />
                      Valores e Taxas do Dia ({Object.keys(selectedCollabIds).filter(id => selectedCollabIds[id]).length} selecionados)
                    </h3>

                    <div className="space-y-4">
                      {activeCollaborators.filter(c => selectedCollabIds[c.id]).map((c) => {
                        const vals = closingValues[c.id] || {
                          remunerationType: c.remunerationType,
                          baseAmount: c.defaultAmount,
                          deliveryFeeAmount: 0,
                          deliveryCount: '',
                          status: 'pago',
                          notes: ''
                        };

                        const isEntregador = c.role.toLowerCase().includes('entregador') || 
                                             c.role.toLowerCase().includes('motoboy') || 
                                             vals.remunerationType === 'diaria_mais_taxas' || 
                                             vals.remunerationType === 'por_entrega';

                        const totalIndividual = (Number(vals.baseAmount) || 0) + (Number(vals.deliveryFeeAmount) || 0);

                        return (
                          <div key={c.id} className="p-5 bg-slate-950/60 rounded-2xl border border-white/10 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-3">
                              <div>
                                <span className="text-sm font-black text-white">{c.name}</span>
                                <span className="text-xs text-slate-400 ml-2">({c.role})</span>
                              </div>

                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-400">Total a Pagar ao Colaborador:</span>
                                <span className="text-base font-black text-emerald-400">{formatMoney(totalIndividual)}</span>
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
                                    <label className="block text-slate-400 font-bold mb-1">Taxas de Entrega do Dia (R$)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={vals.deliveryFeeAmount}
                                      onChange={(e) => handleClosingValueChange(c.id, 'deliveryFeeAmount', Number(e.target.value))}
                                      className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:border-emerald-500 focus:outline-none text-orange-300"
                                      placeholder="87.40"
                                    />
                                    <span className="text-[10px] text-rose-400 mt-1 block">Variável • FORA do CFI</span>
                                  </div>

                                  <div>
                                    <label className="block text-slate-400 font-bold mb-1">Nº de Entregas (Opcional)</label>
                                    <input
                                      type="number"
                                      value={vals.deliveryCount}
                                      onChange={(e) => handleClosingValueChange(c.id, 'deliveryCount', e.target.value)}
                                      className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none"
                                      placeholder="Ex: 12"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Para cálculo de ticket médio</span>
                                  </div>
                                </>
                              )}

                              <div>
                                <label className="block text-slate-400 font-bold mb-1">Status do Pagamento</label>
                                <select
                                  value={vals.status}
                                  onChange={(e) => handleClosingValueChange(c.id, 'status', e.target.value)}
                                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-white/10 font-bold focus:border-emerald-500 focus:outline-none"
                                >
                                  <option value="pago">🟢 Pago</option>
                                  <option value="pendente">🟠 Pendente</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveFechamento}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 transition transform active:scale-95"
                      >
                        CONFIRMAR FECHAMENTO DO DIA
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EQUIPE / COLABORADORES */}
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
                      <span className="text-slate-400">Valor Padrão:</span>
                      <span className="font-black text-emerald-400">{formatMoney(c.defaultAmount)}</span>
                    </div>

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

      {/* TAB 3: LANÇAR SALÁRIOS OU PRÓ-LABORE MENSAIS */}
      {activeTab === 'salarios' && (
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-6">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Briefcase size={20} className="text-blue-400" />
              Lançar Salários Mensais e Pró-labore
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
                            status: 'pago',
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

      {/* TAB 4: HISTÓRICO & RELATÓRIO */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Receipt size={20} className="text-emerald-400" />
                  Histórico de Pagamentos de {selectedMonth}
                </h2>
                <p className="text-xs text-slate-400">
                  Consulte todos os lançamentos do mês. Alterne status entre pago/pendente ou exclua se necessário.
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
                            <button
                              onClick={() => {
                                updateCollaboratorPaymentStatus(p.id, p.status === 'pago' ? 'pendente' : 'pago');
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition ${
                                p.status === 'pago' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {p.status === 'pago' ? '🟢 Pago' : '🟠 Pendente'}
                            </button>
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
                      + Cadastrar nova função
                    </button>
                  </div>

                  {isAddingNewRole ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newRoleInput}
                        onChange={(e) => setNewRoleInput(e.target.value)}
                        placeholder="Ex: Social Media"
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
                    Sugestão inicial. Poderá ser ajustado livremente em cada fechamento.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
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
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* REGRAS POR DIA DA SEMANA (OPCIONAL) */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-400">
                    <input
                      type="checkbox"
                      checked={enableWeeklyRules}
                      onChange={(e) => setEnableWeeklyRules(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    Configurar regras diferentes por dia da semana (opcional)
                  </label>
                </div>

                {enableWeeklyRules && (
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/10 space-y-2 text-xs">
                    <p className="text-[11px] text-slate-400">
                      Defina valores padrão para cada dia da semana (ex: R$ 60 de terça a quinta, R$ 80 na sexta/sábado).
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

    </div>
  );
};
