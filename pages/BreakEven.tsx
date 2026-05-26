
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
    Target, 
    HelpCircle, 
    Calculator, 
    Plus, 
    Trash2, 
    Printer, 
    RotateCcw, 
    Info, 
    LayoutList,
    X,
    Check,
    Settings,
    Lock,
    Search,
    Edit3,
    ArrowRight,
    TrendingUp,
    PieChart as PieIcon,
    BarChart3,
    Activity,
    Sparkles,
    Lightbulb,
    AlertTriangle,
    CheckCircle2,
    Award,
    TrendingDown,
    Zap,
    Scale,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, LineChart, Line, Legend, Cell, 
    PieChart, Pie 
} from 'recharts';
import { formatPercent } from '../constants';

interface VarCostEntry {
    id: string;
    category: string;
    subcategory: string;
    date: string;
    description: string;
    value: number;
}

interface CustomCategory {
    id: string;
    name: string;
    isLocked: boolean;
}

interface SubCategory {
    id: string;
    name: string;
    categoryId: string;
}

const STORAGE_CATS = 'lucro_facil_be_categories_v1';
const STORAGE_SUBCATS = 'lucro_facil_be_subcategories_v1';

const DEFAULT_CATEGORIES: CustomCategory[] = [
    { id: 'cat_compras', name: 'Compras', isLocked: true },
    { id: 'cat_tx', name: 'Tx Entrega', isLocked: true },
    { id: 'cat_manu', name: 'Manutenção', isLocked: false },
    { id: 'cat_mkt', name: 'Marketing', isLocked: false },
    { id: 'cat_outros', name: 'Outros', isLocked: false },
];

const BreakEven: React.FC = () => {
    const { 
        monthlyRevenue, 
        expenses, 
        cfi, 
    } = useApp();

    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [ticketMedio, setTicketMedio] = useState<number>(35);
    const [orderCount, setOrderCount] = useState<string>('');
    const [showHelp, setShowHelp] = useState(false);
    const [calcSuccess, setCalcSuccess] = useState(false);
    
    // --- XANDE ADVISOR AND SIMULATOR STATES ---
    const [activeAdvisorStep, setActiveAdvisorStep] = useState<number>(0);
    const [showAdvisor, setShowAdvisor] = useState<boolean>(true);

    const [simulatedCmvDecrease, setSimulatedCmvDecrease] = useState<number>(0); // reduced overall %
    const [simulatedFixedCostDecrease, setSimulatedFixedCostDecrease] = useState<number>(0); // reduced R$ value
    const [simulatedTicketIncrease, setSimulatedTicketIncrease] = useState<number>(0); // added R$ value

    // --- LOCAL STORAGE DATA ---
    const [customCats, setCustomCats] = useState<CustomCategory[]>(() => {
        const saved = localStorage.getItem(STORAGE_CATS);
        return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    });

    const [subCats, setSubCats] = useState<SubCategory[]>(() => {
        const saved = localStorage.getItem(STORAGE_SUBCATS);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_CATS, JSON.stringify(customCats));
    }, [customCats]);

    useEffect(() => {
        localStorage.setItem(STORAGE_SUBCATS, JSON.stringify(subCats));
    }, [subCats]);

    // Local Launches
    const [localEntries, setLocalEntries] = useState<VarCostEntry[]>([]);
    const [newEntry, setNewEntry] = useState<Partial<VarCostEntry>>({
        category: 'Compras',
        subcategory: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        value: 0
    });

    // Local Overrides
    const [cmvOverride, setCmvOverride] = useState<number | string>('');
    const [txEntregaOverride, setTxEntregaOverride] = useState<number | string>('');

    // Modal States
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [chartHelp, setChartHelp] = useState<string | null>(null);

    // --- LOGIC ---
    const revenue = useMemo(() => monthlyRevenue.find(r => r.month === selectedMonth)?.revenue || 0, [monthlyRevenue, selectedMonth]);
    const fixedCosts = useMemo(() => expenses.filter(e => e.month === selectedMonth).reduce((s, e) => s + e.value, 0), [expenses, selectedMonth]);
    const avgCardRate = useMemo(() => (cfi.debitTax + cfi.creditTax) / 2, [cfi]);
    
    const autoImposto = useMemo(() => revenue * (cfi.tax / 100), [revenue, cfi]);
    const autoCartao = useMemo(() => revenue * (avgCardRate / 100), [revenue, avgCardRate]);
    const autoVoucher = useMemo(() => revenue * (cfi.voucherTax / 100), [revenue, cfi]);

    const dynamicCmv = useMemo(() => localEntries.filter(e => e.category === 'Compras').reduce((s, e) => s + e.value, 0), [localEntries]);
    const dynamicTx = useMemo(() => localEntries.filter(e => e.category === 'Tx Entrega').reduce((s, e) => s + e.value, 0), [localEntries]);
    const dynamicExtras = useMemo(() => localEntries.filter(e => e.category !== 'Compras' && e.category !== 'Tx Entrega').reduce((s, e) => s + e.value, 0), [localEntries]);

    const finalCmv = cmvOverride !== '' ? parseFloat(cmvOverride.toString()) || 0 : dynamicCmv;
    const finalTx = txEntregaOverride !== '' ? parseFloat(txEntregaOverride.toString()) || 0 : dynamicTx;

    const totalVarCosts = autoImposto + autoCartao + autoVoucher + finalCmv + finalTx + dynamicExtras;
    const varPct = revenue > 0 ? (totalVarCosts / revenue) * 100 : 0;
    const mcPct = 1 - (varPct / 100);
    
    const breakEvenR$ = mcPct > 0 ? fixedCosts / mcPct : 0;
    const breakEvenUnits = (ticketMedio > 0 && mcPct > 0) ? breakEvenR$ / ticketMedio : 0;
    const gapToBe = Math.max(0, breakEvenR$ - revenue);
    const progressPct = breakEvenR$ > 0 ? (revenue / breakEvenR$) * 100 : 0;

    // --- DYNAMIC XANDE SIMULATOR CALCULATIONS ---
    const simulatedFixedCosts = useMemo(() => {
        return Math.max(0, fixedCosts - simulatedFixedCostDecrease);
    }, [fixedCosts, simulatedFixedCostDecrease]);

    const simulatedVarPct = useMemo(() => {
        const baseCmvPercentage = revenue > 0 ? (finalCmv / revenue) * 100 : 35;
        const cmvDifference = Math.max(0, baseCmvPercentage - simulatedCmvDecrease);
        const dynamicSimulatedCmv = revenue > 0 ? (cmvDifference / 100) * revenue : 0;
        
        const simulatedVarCost = autoImposto + autoCartao + autoVoucher + dynamicSimulatedCmv + finalTx + dynamicExtras;
        return revenue > 0 ? (simulatedVarCost / revenue) * 100 : Math.max(10, varPct - simulatedCmvDecrease);
    }, [finalCmv, revenue, simulatedCmvDecrease, autoImposto, autoCartao, autoVoucher, finalTx, dynamicExtras, varPct]);

    const simulatedMcPct = useMemo(() => {
        return 1 - (simulatedVarPct / 100);
    }, [simulatedVarPct]);

    const simulatedBreakEvenR$ = useMemo(() => {
        return simulatedMcPct > 0 ? simulatedFixedCosts / simulatedMcPct : 0;
    }, [simulatedFixedCosts, simulatedMcPct]);

    const simulatedTicket = useMemo(() => {
        return Math.max(1, ticketMedio + simulatedTicketIncrease);
    }, [ticketMedio, simulatedTicketIncrease]);

    const simulatedBreakEvenUnits = useMemo(() => {
        return (simulatedTicket > 0 && simulatedMcPct > 0) ? simulatedBreakEvenR$ / simulatedTicket : 0;
    }, [simulatedBreakEvenR$, simulatedTicket, simulatedMcPct]);

    // Hitting days calculations based on daily average revenue
    const breakEvenDaysActual = useMemo(() => {
        if (revenue <= 0 || breakEvenR$ <= 0) return 0;
        const dailyRevenue = revenue / 30;
        return Math.min(30, breakEvenR$ / dailyRevenue);
    }, [revenue, breakEvenR$]);

    const breakEvenDaysSimulated = useMemo(() => {
        if (revenue <= 0 || simulatedBreakEvenR$ <= 0) return 0;
        const dailyRevenue = revenue / 30;
        return Math.min(30, simulatedBreakEvenR$ / dailyRevenue);
    }, [revenue, simulatedBreakEvenR$]);

    // Active Dialogue Advisor Data
    const ADVISOR_STEPS = [
        {
            title: "1. Desmistificando o Ponto de Equilíbrio",
            subtitle: "O Coração Financeiro da Hamburgueria",
            concept: "Bater o ponto de equilíbrio significa que seu faturamento cobriu todas as despesas fixas (como aluguel e equipe) e os custos dinâmicos (como carnes, taxas e embalagens). A partir desse centavo, tudo o que entra vira lucro limpo!",
            dialogue: "Fala parceiro! Se tem uma métrica que impede o dono de hamburgueria de dormir de olho aberto, é o Ponto de Equilíbrio! Em termos simples: é o valor exato que você precisa faturar para empatar o jogo (ficar no zero a zero). Se você vendeu R$ 30 mil e suas contas dão R$ 30 mil, você não ganhou nada, mas também não perdeu. Entender esse limite é o primeiro passo para parar de apagar incêndios e começar a ver a cor do dinheiro!",
            actionText: "Simular Redução de Custos Fixos",
            action: () => {
                setSimulatedFixedCostDecrease(Math.min(1000, fixedCosts > 0 ? fixedCosts * 0.1 : 500));
            },
        },
        {
            title: "2. A Regra de Ouro dos Primeiros 10 Dias",
            subtitle: "Sua Margem de Segurança Essencial",
            concept: "As melhores hamburguerias e buffets focam em faturar e pagar todas as suas contas nos primeiros 10 dias do mês. O restante do mês se torna lucro real. Se você leva mais que 20 dias, seu negócio está exposto a riscos.",
            dialogue: "Presta atenção nessa dica que vale ouro para hamburguerias: o seu objetivo de vida deve ser bater o seu Ponto de Equilíbrio nos primeiros 10 dias do mês! Se você leva até o dia 28 para pagar o aluguel e as taxas, seu lucro está correndo sério perigo. Sabe por quê? Qualquer chuvinha ou queda no movimento de fim de semana joga você no prejuízo! A partir do dia em que você empata, cada hambúrguer vendido gera Margem de Contribuição quase toda limpa para o seu bolso!",
            actionText: "Ver dias de equilíbrio",
            action: () => {
                // Action will guide them on page lower sections, no-op or slight toggle
            }
        },
        {
            title: "3. O Efeito Alavanca do CMV de Insumos",
            subtitle: "Como o Custo dos Ingredientes Altera os Requisitos",
            concept: "Diminuir o CMV (Custo da Mercadoria Vendida) por meio de fichas técnicas corretas e redução de perdas de comida puxa instantaneamente o seu ponto de equilíbrio para baixo. Você precisa vender muito menos para empatar!",
            dialogue: "Muitos donos acham que para diminuir o Ponto de Equilíbrio precisam vender mais ou cortar funcionários. Nem sempre! A alavanca mais rápida e silenciosa é diminuir o seu CMV de Insumos! Se você reduzir o desperdício, criar fichas técnicas e negociar melhor com fornecedores, seu custo variável cai. Como consequência, sua Margem de Contribuição sobe e o valor que você precisa faturar para pagar as despesas fixas diminui drasticamente!",
            actionText: "Simular Meta de -4% no CMV",
            action: () => {
                setSimulatedCmvDecrease(4);
            }
        },
        {
            title: "4. Alavancar o Caixa pelo Ticket Médio",
            subtitle: "A Força do Upsell e Combos",
            concept: "Aumentar o valor médio de cada transação (Ticket Médio) em apenas R$ 3 ou R$ 5 permite atingir o faturamento de equilíbrio com dezenas ou centenas de pedidos a menos de sobrecarga física.",
            dialogue: "Sabe o que é mais fácil? Fazer 500 clientes gastarem R$ 5 a mais cada um (R$ 2.500 extras) ou achar 100 clientes novos do absoluto zero? A segunda opção custa muito mais caro em marketing! Sugerir uma bebida gelada, uma porção de batata frita ou uma sobremesa rápida no caixa aumenta o seu Ticket Médio e reduz na hora o número total de pedidos que você precisa produzir para pagar as contas fixas!",
            actionText: "Simular +R$ 5 no Ticket Médio",
            action: () => {
                setSimulatedTicketIncrease(5);
            }
        }
    ];

    const currentAdvisorData = ADVISOR_STEPS[activeAdvisorStep];

    // --- HANDLERS ---
    const handleAddEntry = () => {
        if (!newEntry.subcategory || !newEntry.value) return;
        setLocalEntries([...localEntries, { ...newEntry, id: Math.random().toString(36).substr(2, 9) } as VarCostEntry]);
        setNewEntry({ ...newEntry, subcategory: '', description: '', value: 0 });
    };

    const handleCalculateTicket = () => {
        const orders = parseInt(orderCount);
        if (orders >= 1 && revenue > 0) {
            setTicketMedio(parseFloat((revenue / orders).toFixed(2)));
            setCalcSuccess(true);
            setTimeout(() => setCalcSuccess(false), 2500);
        } else if (revenue === 0) {
            alert("Faturamento não disponível.");
        }
    };

    const handleReset = () => {
        setLocalEntries([]);
        setCmvOverride('');
        setTxEntregaOverride('');
        setOrderCount('');
        setSimulatedCmvDecrease(0);
        setSimulatedFixedCostDecrease(0);
        setSimulatedTicketIncrease(0);
    };

    // Subcategory Autocomplete Logic
    const currentSubcatsList = useMemo(() => {
        const catObj = customCats.find(c => c.name === newEntry.category);
        return subCats.filter(s => s.categoryId === catObj?.id);
    }, [newEntry.category, customCats, subCats]);

    // Chart Data Preparation
    const barData = [
        { name: 'Faturamento', valor: revenue, fill: '#3B82F6' },
        { name: 'Equilíbrio', valor: breakEvenR$, fill: '#D90429' },
        { name: 'Faltante', valor: gapToBe, fill: '#94A3B8' }
    ];

    const pieData = [
        { name: 'CMV (Insumos)', value: finalCmv, fill: '#EF4444' },
        { name: 'Impostos', value: autoImposto, fill: '#F59E0B' },
        { name: 'Cartão', value: autoCartao, fill: '#10B981' },
        { name: 'Tx Entrega', value: finalTx, fill: '#3B82F6' },
        { name: 'Vouchers', value: autoVoucher, fill: '#8B5CF6' },
        { name: 'Extras', value: dynamicExtras, fill: '#EC4899' },
    ].filter(d => d.value > 0);

    const sensitivityData = [-10, -5, 0, 5, 10].map(diff => {
        const simulatedVarPct = Math.max(0, varPct + diff);
        const simulatedMcPct = 1 - (simulatedVarPct / 100);
        return {
            name: (diff > 0 ? '+' : '') + formatPercent(diff),
            be: simulatedMcPct > 0 ? fixedCosts / simulatedMcPct : 0
        };
    });

    return (
        <div className="space-y-6 pb-20 animate-fade-in printable-content text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print bg-white dark:bg-[#1e293b]/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-brand-red/10 rounded-full flex items-center justify-center border border-brand-red/30">
                            <Target className="text-brand-red h-4 w-4" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                            Ponto de Equilíbrio da Loja (CFI)
                        </h2>
                        <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-brand-red transition-colors">
                            <HelpCircle size={18} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Metodologia baseada em Custos Fixos Integrados da hamburgueria e simulações com o Xande.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => setShowAdvisor(!showAdvisor)}
                        className={`px-3.5 py-2 text-xs font-black rounded-xl border transition flex items-center gap-1.5 ${
                            showAdvisor 
                                ? 'bg-brand-red/10 border-brand-red/30 text-brand-red' 
                                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-gray-700 dark:text-white font-bold'
                        }`}
                    >
                        <Sparkles className="h-4 w-4" />
                        {showAdvisor ? "Ocultar Mentor Xande" : "Chamar Consultor Xande"}
                    </button>
                    <button onClick={() => window.print()} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl text-xs font-black border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 hover:bg-gray-50 transition">
                        <Printer size={15}/> Imprimir
                    </button>
                    <button onClick={handleReset} className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-gray-200 transition">
                        <RotateCcw size={15}/> Resetar
                    </button>
                </div>
            </div>

            {/* INTERACTIVE WALKTHROUGH PANEL WITH XANDE */}
            {showAdvisor && (
                <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden transition-all duration-300">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Header with Steps */}
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-brand-red animate-pulse" />
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                                    GUIA DE SOBREVIVÊNCIA FINANCEIRA DO XANDE
                                </h3>
                                <p className="text-[10px] text-slate-500 block leading-none mt-1">Siga o passo a passo interativo para entender suas margens e diminuir o ponto de equilíbrio.</p>
                            </div>
                        </div>

                        {/* Pagination indicator */}
                        <div className="flex items-center gap-1">
                            {ADVISOR_STEPS.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveAdvisorStep(idx)}
                                    className={`h-2 rounded-full transition-all duration-200 ${idx === activeAdvisorStep ? 'w-5 bg-brand-red' : 'w-2 bg-slate-700 hover:bg-slate-500'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Step Tabs Grid Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
                        {ADVISOR_STEPS.map((step, idx) => {
                            const isSelected = idx === activeAdvisorStep;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setActiveAdvisorStep(idx)}
                                    className={`p-3 rounded-2xl border text-left transition relative flex flex-col gap-1 ${
                                        isSelected 
                                            ? 'bg-slate-800 border-brand-red text-white shadow-lg ring-1 ring-brand-red/30' 
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                                    }`}
                                >
                                    <span className="text-[9px] font-black tracking-widest text-[#D90429] uppercase">Passo {idx + 1}</span>
                                    <span className="text-xs font-extrabold leading-tight block line-clamp-1">{step.title}</span>
                                    <span className="text-[9px] text-slate-500 block leading-tight truncate">{step.subtitle}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Step Content box */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                        {/* Xande Avatar Box */}
                        <div className="lg:col-span-3 xl:col-span-2 flex flex-col items-center justify-center text-center p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div className="relative">
                                <div className="h-14 w-14 bg-slate-850 rounded-full border-2 border-brand-red flex items-center justify-center font-bold text-2xl text-brand-red">
                                    L
                                </div>
                                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                            </div>
                            <span className="text-xs font-black text-brand-yellow uppercase tracking-wider block mt-2">Consultor Xande</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mentor Financeiro</span>
                        </div>

                        {/* Interactive speech and actions block */}
                        <div className="lg:col-span-9 xl:col-span-10 space-y-3">
                            <div>
                                <span className="text-[9px] font-bold text-brand-red uppercase tracking-widest bg-brand-red/10 border border-brand-red/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                                    {currentAdvisorData.subtitle}
                                </span>
                                <h4 className="text-base font-black text-white leading-snug">{currentAdvisorData.title}</h4>
                            </div>

                            {/* Dialogue content */}
                            <div className="p-4 bg-slate-900/60 rounded-xl border-l-[4px] border-brand-red text-xs leading-relaxed text-slate-350 italic font-sans">
                                "{currentAdvisorData.dialogue}"
                            </div>

                            {/* Dialogue Concepts Description */}
                            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                                <strong className="text-slate-200">Visão Técnica:</strong> {currentAdvisorData.concept}
                            </p>

                            {/* Quick simulator integration button */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <button
                                    onClick={() => currentAdvisorData.action()}
                                    className="px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 text-center"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    {currentAdvisorData.actionText}
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={activeAdvisorStep === 0}
                                        onClick={() => setActiveAdvisorStep(prev => prev - 1)}
                                        className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 rounded-lg transition disabled:opacity-30 disabled:hover:bg-slate-900"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                        Fase {activeAdvisorStep + 1} de {ADVISOR_STEPS.length}
                                    </span>
                                    <button
                                        onClick={() => {
                                            if (activeAdvisorStep < ADVISOR_STEPS.length - 1) {
                                                setActiveAdvisorStep(prev => prev + 1);
                                            } else {
                                                setShowAdvisor(false);
                                            }
                                        }}
                                        className="p-1.5 bg-slate-900 hover:bg-slate-850 text-brand-red rounded-lg transition"
                                    >
                                        {activeAdvisorStep === ADVISOR_STEPS.length - 1 ? <X className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            )}

            {/* Help Panel */}
            {showHelp && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative animate-fade-in shadow-sm max-w-4xl">
                    <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-300"><X size={16}/></button>
                    <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2"><HelpCircle size={18} /> O que é Ponto de Equilíbrio?</h4>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-4 leading-relaxed">
                        <p>O Ponto de Equilíbrio indica quanto você precisa vender para cobrir todos os custos do mês — sem lucro, sem prejuízo. Aqui você vê:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Custos Fixos (CF):</strong> aluguel, salários, internet, sistema, etc.</li>
                            <li><strong>Custos Variáveis (CV):</strong> insumos, impostos, taxas de cartão, taxas de entrega e gastos extras.</li>
                        </ul>
                        <p className="font-bold">Como preencher:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Selecione o mês. O sistema busca CF e Faturamento automaticamente.</li>
                            <li>Lance custos variáveis extras na tabela (Ex.: fornecedores, entregadores).</li>
                            <li>Veja os KPIs e gráficos para entender seu progresso rumo ao lucro.</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Step 1: Configuration Card */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-2 flex items-center gap-2">
                        <LayoutList size={14}/> Config. Mês
                    </h3>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Mês de Referência</label>
                        <input 
                            type="month" 
                            value={selectedMonth} 
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Ticket Médio (R$)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={ticketMedio} 
                                onChange={e => setTicketMedio(parseFloat(e.target.value) || 0)}
                                className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-brand-red transition-colors ${calcSuccess ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`}
                            />
                            {calcSuccess && <Check size={16} className="absolute right-2 top-2 text-emerald-500 animate-in zoom-in" />}
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-500/30 text-[10px] text-blue-800 dark:text-blue-200 animate-fade-in">
                        <p className="mb-2 font-bold uppercase opacity-80">Não sabe o Ticket?</p>
                        <div className="mb-2">
                            <input 
                                type="number" 
                                placeholder="Nº Pedidos Mês" 
                                value={orderCount}
                                onChange={e => setOrderCount(e.target.value)}
                                className={`w-full bg-white dark:bg-gray-800 p-1.5 rounded border outline-none text-sm ${parseInt(orderCount) < 1 ? 'border-red-400' : 'border-blue-200 dark:border-blue-800'}`}
                            />
                        </div>
                        <button 
                            onClick={handleCalculateTicket}
                            disabled={!orderCount || parseInt(orderCount) < 1}
                            className="w-full py-2 rounded font-black uppercase bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Calculator size={12} /> Calcular Ticket
                        </button>
                    </div>
                </div>

                {/* Auto-filled Section */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-4 flex items-center gap-2">
                        <Info size={14}/> Custos Consolidados (Auto)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Faturamento</span>
                            <p className="text-sm font-black text-gray-900 dark:text-white">R$ {revenue.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Imposto ({formatPercent(cfi.tax)})</span>
                            <p className="text-sm font-black text-gray-900 dark:text-white">R$ {autoImposto.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Cartão ({formatPercent(avgCardRate)})</span>
                            <p className="text-sm font-black text-gray-900 dark:text-white">R$ {autoCartao.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Custo Fixo (R$)</span>
                            <p className="text-sm font-black text-brand-red">R$ {fixedCosts.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between bg-emerald-50/30 dark:bg-emerald-500/5 p-2 rounded-lg group">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">CMV Total (R$)</span>
                                {cmvOverride !== '' && <RotateCcw size={12} className="text-brand-red cursor-pointer" onClick={() => setCmvOverride('')}/>}
                            </div>
                            <input 
                                type="number" 
                                value={cmvOverride === '' ? finalCmv : cmvOverride}
                                onChange={e => setCmvOverride(e.target.value)}
                                className={`bg-white dark:bg-gray-800 border rounded p-1 text-xs w-28 text-right outline-none focus:border-emerald-500 ${cmvOverride !== '' ? 'border-brand-red font-bold' : 'border-emerald-200 dark:border-emerald-800'}`}
                            />
                        </div>
                        <div className="flex items-center justify-between bg-blue-50/30 dark:bg-blue-500/5 p-2 rounded-lg group">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Tx Entrega (R$)</span>
                                {txEntregaOverride !== '' && <RotateCcw size={12} className="text-brand-red cursor-pointer" onClick={() => setTxEntregaOverride('')}/>}
                            </div>
                            <input 
                                type="number" 
                                value={txEntregaOverride === '' ? finalTx : txEntregaOverride}
                                onChange={e => setTxEntregaOverride(e.target.value)}
                                className={`bg-white dark:bg-gray-800 border rounded p-1 text-xs w-28 text-right outline-none focus:border-blue-500 ${txEntregaOverride !== '' ? 'border-brand-red font-bold' : 'border-blue-200 dark:border-blue-800'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
                    <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">Custo Variável Total</span>
                    <p className="text-lg font-black text-gray-900 dark:text-white">R$ {totalVarCosts.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
                    <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">% Custo Variável</span>
                    <p className="text-lg font-black text-amber-500">{formatPercent(varPct)}</p>
                </div>
                <div 
                    className={`p-4 rounded-2xl shadow-xl flex flex-col justify-center text-white transition-all ${mcPct <= 0 ? 'bg-gray-400 shadow-none cursor-help' : 'bg-brand-red shadow-red-900/20'}`}
                    title={mcPct <= 0 ? "Dados insuficientes para cálculo" : ""}
                >
                    <span className="text-[9px] uppercase font-black opacity-80 mb-1">Receita Equilíbrio</span>
                    <p className="text-xl font-black">{mcPct <= 0 ? "N/A" : `R$ ${breakEvenR$.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`}</p>
                </div>
                <div 
                    className={`p-4 rounded-2xl shadow-xl flex flex-col justify-center text-white transition-all ${ticketMedio <= 0 || mcPct <= 0 ? 'bg-gray-400 shadow-none cursor-help' : 'bg-emerald-600 shadow-emerald-900/20'}`}
                    title={ticketMedio <= 0 ? "Dados insuficientes para cálculo" : ""}
                >
                    <span className="text-[9px] uppercase font-black opacity-80 mb-1">Equilíbrio (Pedidos)</span>
                    <p className="text-xl font-black">{ticketMedio <= 0 || mcPct <= 0 ? "0 und" : `${Math.ceil(breakEvenUnits)} und`}</p>
                </div>
                <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-center ${gapToBe > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'}`}>
                    <span className="text-[9px] uppercase font-bold mb-1">{gapToBe > 0 ? 'Falta para bater' : 'Status Mês'}</span>
                    <p className="text-lg font-black">{gapToBe > 0 ? `R$ ${gapToBe.toLocaleString('pt-BR')}` : 'EQUILIBRADO'}</p>
                </div>
            </div>

            {/* XANDE'S ADVISORY: TERMÔMETRO DO PONTO DE EQUILÍBRIO & REGRA DOS 10 DIAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
                {/* 10-Day Rule Gauge Card */}
                <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Scale className="text-brand-red h-5 w-5" />
                            <div>
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Termômetro dos 10 Primeiros Dias</h3>
                                <p className="text-[10px] text-gray-500">Métrica sugerida pelo Xande para máxima sobrevivência</p>
                            </div>
                        </div>

                        {revenue <= 0 ? (
                            <div className="bg-gray-50 dark:bg-gray-800/35 p-6 rounded-2xl text-center text-xs text-gray-500 italic font-sans">
                                Selecione um mês com faturamento cadastrado ou insira faturamento para habilitar o Termômetro do Ponto de Equilíbrio do Xande.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Visual 30-day timeline meter */}
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                                        <span>Início do Mês</span>
                                        <span className={breakEvenDaysActual <= 10 ? "text-emerald-500 font-extrabold" : "text-gray-400"}>Dia 10 (Meta)</span>
                                        <span>Fim do Mês</span>
                                    </div>
                                    <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center p-1 overflow-hidden">
                                        {/* Meta day marker */}
                                        <div className="absolute left-[33.33%] top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700 z-10" />
                                        
                                        {/* Filled progress up to actual break even day */}
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                breakEvenDaysActual <= 10 
                                                    ? 'bg-emerald-500' 
                                                    : breakEvenDaysActual <= 20 
                                                        ? 'bg-amber-500' 
                                                        : 'bg-[#D90429]'
                                            }`}
                                            style={{ width: `${(breakEvenDaysActual / 30) * 100}%` }}
                                        />

                                        {/* Actual marker pin */}
                                        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-[9px] font-black text-white bg-slate-900 border border-slate-750 px-2 py-0.5 rounded shadow">
                                                Dia {Math.ceil(breakEvenDaysActual)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Advisory Diagnosis */}
                                {(() => {
                                    const days = Math.ceil(breakEvenDaysActual);
                                    let rating = {
                                        icon: <Award className="text-emerald-500 h-8 w-8 shrink-0 animate-bounce" />,
                                        badge: "Perfeito (ZONA DE SEGURANÇA)",
                                        text: `Você alcança o ponto de equilíbrio no dia ${days} do mês! Os outros ${30 - days} dias representam lucro limpo e abundância para sua empresa. Continue com as rédeas firmes no CFI!`,
                                        colorClass: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-350"
                                    };

                                    if (days > 10 && days <= 20) {
                                        rating = {
                                            icon: <TrendingUp className="text-amber-500 h-8 w-8 shrink-0" />,
                                            badge: "Alerta Médio (ZONA RETRANCADA)",
                                            text: `Você leva ${days} dias do mês para pagar o aluguel e as contas faturadas. Sobram apenas ${30 - days} dias para gerar lucro real. Recomendo usar o Simulador de Alavancas ao lado para baixar para 10 dias!`,
                                            colorClass: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800/40 text-amber-800 dark:text-amber-350"
                                        };
                                    } else if (days > 20) {
                                        rating = {
                                            icon: <AlertTriangle className="text-brand-red h-8 w-8 shrink-0 animate-pulse" />,
                                            badge: "Alerta Crítico (ZONA DE PERIGO)",
                                            text: `Você passa ${days} dias do mês trabalhando puramente no vermelho! Se houver uma semana de chuva ou quebra de máquina, você cai no prejuízo. Seu foco de vida deve ser diminuir despesas fixas ou bater metas de CMV urgente!`,
                                            colorClass: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-800/40 text-red-800 dark:text-red-350"
                                        };
                                    }

                                    return (
                                        <div className={`p-4 rounded-xl border flex gap-3 items-start leading-snug animate-fade-in ${rating.colorClass}`}>
                                            {rating.icon}
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest block">{rating.badge}</span>
                                                <p className="text-xs font-sans leading-relaxed">{rating.text}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                        <p className="text-[10px] text-gray-500 font-sans leading-relaxed italic text-center">
                            "Bater o Ponto de Equilíbrio nos primeiros 10 dias do mês te dá o fôlego necessário para tomar boas decisões estratégicas sobre o negócio."
                        </p>
                    </div>
                </div>

                {/* Simulated Leverage "E Se..." Panel */}
                <div className="lg:col-span-7 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="text-[#D90429] h-5 w-5" />
                            <div>
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Odin / Simulador Otimizador do Xande ("E Se...?")</h3>
                                <p className="text-[10px] text-gray-500">Mude os parâmetros para simular metas fáceis de CMV e ticket</p>
                            </div>
                        </div>

                        {/* Slide Adjustments */}
                        <div className="space-y-4 font-sans text-xs">
                            {/* CMV Adjustment */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-gray-650 dark:text-gray-300">Meta: Reduzir Perdas de CMV (Insumos)</span>
                                    <span className="text-brand-red font-black">-{simulatedCmvDecrease}% no CMV</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="15" 
                                    step="0.5" 
                                    value={simulatedCmvDecrease}
                                    onChange={e => setSimulatedCmvDecrease(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D90429]"
                                />
                                <p className="text-[9px] text-gray-400">Padronizar receitas (ficha técnica) ou negociar as perdas puxa o ponto de equilíbrio para baixo.</p>
                            </div>

                            {/* Fixed Cost Adjustment */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-gray-650 dark:text-gray-300">Meta: Cortar Custos Fixos (CFI)</span>
                                    <span className="text-brand-red font-black">-R$ {simulatedFixedCostDecrease} /mês</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={Math.max(5000, Math.ceil(fixedCosts))} 
                                    step="100" 
                                    value={simulatedFixedCostDecrease}
                                    onChange={e => setSimulatedFixedCostDecrease(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D90429]"
                                />
                                <p className="text-[9px] text-gray-400">Diminuir gastos com internet, aluguel, sistemas caros ou despesas desnecessárias de escritório.</p>
                            </div>

                            {/* Ticket increase via Upsell */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-gray-650 dark:text-gray-300">Meta: Aumentar Ticket Médio via Upsell</span>
                                    <span className="text-emerald-500 font-black">+R$ {simulatedTicketIncrease} no Pedido</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="30" 
                                    step="1" 
                                    value={simulatedTicketIncrease}
                                    onChange={e => setSimulatedTicketIncrease(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <p className="text-[9px] text-gray-400">Suas vendas de molhos extras, adicionais, porções de fritas e sucos geram altíssimo lucro de transação.</p>
                            </div>
                        </div>

                    </div>

                    {/* Simulation Comparison Output */}
                    <div className="mt-5 p-4 bg-slate-950 border border-slate-850 rounded-2xl text-white">
                        <div className="grid grid-cols-3 gap-3 text-center border-b border-slate-900 pb-3 mb-3">
                            <div>
                                <span className="text-[9px] uppercase font-black text-slate-400">Ponto de Equilíbrio</span>
                                <p className="text-xs font-bold text-slate-450 line-through">R$ {breakEvenR$.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
                                <p className="text-sm font-black text-brand-red">R$ {simulatedBreakEvenR$.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase font-black text-slate-400">Meta de Pedidos</span>
                                <p className="text-xs font-bold text-slate-450 line-through">{ticketMedio <= 0 ? "0" : `${Math.ceil(breakEvenUnits)}`} und</p>
                                <p className="text-sm font-black text-emerald-400">{simulatedBreakEvenUnits <= 0 ? "0" : `${Math.ceil(simulatedBreakEvenUnits)}`} und</p>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase font-black text-slate-400">Dia de Pagamento</span>
                                <p className="text-xs font-bold text-slate-450 line-through">Dia {Math.ceil(breakEvenDaysActual)}</p>
                                <p className="text-sm font-black text-indigo-400">Dia {Math.ceil(breakEvenDaysSimulated)}</p>
                            </div>
                        </div>

                        {breakEvenR$ - simulatedBreakEvenR$ > 0 ? (
                            <div className="text-left flex items-start gap-2 text-xs text-slate-300 animate-fade-in leading-relaxed font-sans">
                                <CheckCircle2 className="text-emerald-400 h-5 w-5 shrink-0 mt-0.5" />
                                <p>
                                    Ao bater essas metas de simulação, você ganha de volta de faturamento de equilíbrio <strong className="text-emerald-400">R$ {(breakEvenR$ - simulatedBreakEvenR$).toLocaleString('pt-BR', {maximumFractionDigits: 0})}</strong> por mês! Isso equivale a <strong className="text-emerald-400">{Math.ceil(Math.max(0, breakEvenUnits - simulatedBreakEvenUnits))} pedidos a menos</strong> de cansaço operacional, atingindo o equilíbrio financeiro <strong className="text-indigo-400">{Math.ceil(Math.max(0, breakEvenDaysActual - breakEvenDaysSimulated))} dias mais cedo</strong> no mês!
                                </p>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 font-sans italic text-center">Ajuste os controles deslizantes acima para simular metas do Xande.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Didactic Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
                {/* A) Comparativo de Receita */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                           <BarChart3 size={14}/> Comparativo de Receita
                        </h4>
                        <button onClick={() => setChartHelp('comparativo')} className="text-gray-400 hover:text-brand-red"><HelpCircle size={14}/></button>
                    </div>
                    {/* Added explicit style minHeight to fix Recharts in production */}
                    <div className="flex-1" style={{ minHeight: '320px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                                <Legend verticalAlign="top" height={36}/>
                                <Bar dataKey="valor" radius={[6, 6, 0, 0]} name="Valor (R$)">
                                    {barData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* B) Progresso Rumo ao Equilíbrio */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                           <Activity size={14}/> Progresso Rumo ao Equilíbrio
                        </h4>
                        <button onClick={() => setChartHelp('progresso')} className="text-gray-400 hover:text-brand-red"><HelpCircle size={14}/></button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-12 rounded-full overflow-hidden relative shadow-inner">
                            <div 
                                className={`h-full transition-all duration-1000 ${progressPct >= 100 ? 'bg-emerald-500' : progressPct > 80 ? 'bg-amber-500' : 'bg-brand-red'}`} 
                                style={{ width: `${Math.min(100, progressPct)}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-sm mix-blend-difference text-white">
                                {progressPct.toFixed(1)}% DA META
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 w-full gap-4 text-center">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Realizado</span>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">R$ {revenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Meta</span>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">R$ {breakEvenR$.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* D) Sensibilidade do Equilíbrio */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                           <TrendingUp size={14}/> Sensibilidade do Equilíbrio
                        </h4>
                        <button onClick={() => setChartHelp('sensibilidade')} className="text-gray-400 hover:text-brand-red"><HelpCircle size={14}/></button>
                    </div>
                    {/* Added explicit style minHeight to fix Recharts in production */}
                    <div className="flex-1" style={{ minHeight: '320px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensitivityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} label={{ value: 'Variação % CV', position: 'insideBottom', offset: -5 }} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${Math.round(v/1000)}k`} />
                                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                                <Legend verticalAlign="top" align="right" height={36}/>
                                <Line type="monotone" dataKey="be" stroke="#D90429" strokeWidth={3} dot={{ r: 6 }} name="Receita Equilíbrio" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Part 1: Lançamentos Extras with Categories & Subcategories */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xl no-print">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/50">
                    <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm">Detalhamento de Gastos Variáveis</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setIsCatModalOpen(true)} className="p-2 text-gray-400 hover:text-brand-red transition"><Settings size={18}/></button>
                    </div>
                </div>
                
                <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Categoria</label>
                        <select 
                            value={newEntry.category} 
                            onChange={e => setNewEntry({...newEntry, category: e.target.value, subcategory: ''})}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-white outline-none"
                        >
                            {customCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Subcategoria</label>
                            <button onClick={() => setIsSubModalOpen(true)} className="text-blue-500 hover:text-blue-600 text-[9px] uppercase font-bold">Gerenciar</button>
                        </div>
                        <input 
                            list="subcats-datalist"
                            type="text" 
                            placeholder="Buscar/Digitar..." 
                            value={newEntry.subcategory}
                            onChange={e => setNewEntry({...newEntry, subcategory: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-white outline-none"
                        />
                        <datalist id="subcats-datalist">
                            {currentSubcatsList.map(s => <option key={s.id} value={s.name} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Data</label>
                        <input 
                            type="date" 
                            value={newEntry.date}
                            onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Valor (R$)</label>
                        <input 
                            type="number" 
                            value={newEntry.value || ''}
                            onChange={e => setNewEntry({...newEntry, value: parseFloat(e.target.value) || 0})}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                    <button 
                        onClick={handleAddEntry}
                        className="bg-brand-red text-white p-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition"
                    >
                        <Plus size={16}/> Adicionar
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-black/20 text-gray-400 text-[10px] uppercase font-bold">
                            <tr>
                                <th className="px-6 py-3">Categoria</th>
                                <th className="px-6 py-3">Subcategoria</th>
                                <th className="px-6 py-3">Data</th>
                                <th className="px-6 py-3 text-right">Valor (R$)</th>
                                <th className="px-6 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                            {localEntries.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">Nenhum lançamento para este mês.</td>
                                </tr>
                            )}
                            {[...localEntries].sort((a,b) => b.date.localeCompare(a.date)).map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-3 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${entry.category === 'Compras' ? 'bg-red-500' : entry.category === 'Tx Entrega' ? 'bg-blue-500' : 'bg-pink-500'}`}></span>
                                        <span className="font-bold text-gray-500">{entry.category}</span>
                                    </td>
                                    <td className="px-6 py-3 font-bold text-gray-900 dark:text-white uppercase">{entry.subcategory}</td>
                                    <td className="px-6 py-3 text-gray-500">{entry.date.split('-').reverse().join('/')}</td>
                                    <td className="px-6 py-3 text-right font-mono font-bold">R$ {entry.value.toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <button onClick={() => setLocalEntries(localEntries.filter(e => e.id !== entry.id))} className="text-gray-400 hover:text-red-500 transition">
                                            <Trash2 size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-950/50">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400">Total Lançamentos Extras (Simulação)</td>
                                <td className="px-6 py-4 text-right font-black text-lg text-gray-900 dark:text-white">R$ {dynamicExtras.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* MODALS */}
            <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Gerenciar Categorias">
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">Categorias essenciais para o cálculo (Compras e Tx Entrega) são bloqueadas.</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {customCats.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                <span className={`text-sm font-bold ${cat.isLocked ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {cat.name} {cat.isLocked && <Lock size={12} className="inline ml-1 opacity-50"/>}
                                </span>
                                {!cat.isLocked && (
                                    <button 
                                        onClick={() => {
                                            if (localEntries.some(e => e.category === cat.name)) return alert("Categoria possui lançamentos ativos.");
                                            setCustomCats(customCats.filter(c => c.id !== cat.id));
                                        }}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                        <input id="new-cat-input" type="text" placeholder="Nova categoria..." className="flex-1 p-2 border rounded text-sm dark:bg-gray-800 outline-none focus:border-brand-red" />
                        <button 
                            onClick={() => {
                                const input = document.getElementById('new-cat-input') as HTMLInputElement;
                                if (!input.value) return;
                                setCustomCats([...customCats, { id: Math.random().toString(), name: input.value, isLocked: false }]);
                                input.value = '';
                            }}
                            className="bg-brand-red text-white px-4 py-2 rounded text-xs font-bold uppercase"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title={`Subcategorias: ${newEntry.category}`}>
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">Adicione fornecedores ou prestadores para facilitar o lançamento.</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {currentSubcatsList.length === 0 && <p className="text-center py-4 text-gray-400 italic text-xs">Nenhuma subcategoria cadastrada.</p>}
                        {currentSubcatsList.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{sub.name}</span>
                                <button 
                                    onClick={() => setSubCats(subCats.filter(s => s.id !== sub.id))}
                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                        <input id="new-sub-input" type="text" placeholder="Ex: Fornecedor Carne..." className="flex-1 p-2 border rounded text-sm dark:bg-gray-800 outline-none focus:border-brand-red" />
                        <button 
                            onClick={() => {
                                const input = document.getElementById('new-sub-input') as HTMLInputElement;
                                if (!input.value) return;
                                const catObj = customCats.find(c => c.name === newEntry.category);
                                if (catObj) setSubCats([...subCats, { id: Math.random().toString(), name: input.value, categoryId: catObj.id }]);
                                input.value = '';
                            }}
                            className="bg-brand-red text-white px-4 py-2 rounded text-xs font-bold uppercase"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            </Modal>

            <ChartHelpModal 
                type={chartHelp} 
                onClose={() => setChartHelp(null)} 
            />
        </div>
    );
};

// HELPER COMPONENTS
const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-bold text-sm uppercase text-gray-700 dark:text-white">{title}</h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X size={20}/></button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ChartHelpModal: React.FC<{ type: string | null, onClose: () => void }> = ({ type, onClose }) => {
    if (!type) return null;
    
    const contents: Record<string, { title: string, text: string }> = {
        'comparativo': {
            title: 'Comparativo de Receita',
            text: 'Compara sua Receita do Mês com a Receita de Equilíbrio (CF ÷ MC%). Se a barra Faltante for maior que zero, é quanto falta vender para cobrir todos os custos.'
        },
        'progresso': {
            title: 'Progresso Rumo ao Equilíbrio',
            text: 'Mostra a porcentagem do caminho percorrido para atingir a Receita de Equilíbrio. 100% significa que você pagou todas as contas e agora começa a ter lucro real.'
        },
        'composicao': {
            title: 'Composição do Custo Variável',
            text: 'Mostra como seu custo variável se distribui entre componentes do mês. Ideal para identificar onde o dinheiro está saindo (Insumos vs Taxas vs Extras).'
        },
        'sensibilidade': {
            title: 'Sensibilidade do Equilíbrio',
            text: 'Simula como a Receita de Equilíbrio muda quando seu % de custo variável melhora ou piora. Menor % de Custo Variável = Menor Receita de Equilíbrio necessária.'
        }
    };

    return (
        <Modal isOpen={!!type} onClose={onClose} title="Entendendo o Gráfico">
            <div className="space-y-4">
                <h5 className="font-black text-brand-red text-lg uppercase">{contents[type].title}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{contents[type].text}</p>
                <div className="pt-4 flex justify-end">
                    <button onClick={onClose} className="bg-brand-red text-white px-6 py-2 rounded font-bold uppercase text-xs">Entendi</button>
                </div>
            </div>
        </Modal>
    );
};

export default BreakEven;
