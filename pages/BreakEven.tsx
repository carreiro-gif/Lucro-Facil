
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
    Activity
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
        <div className="space-y-6 pb-20 animate-fade-in printable-content">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                            <Target className="text-brand-red" /> Ponto de Equilíbrio
                        </h2>
                        <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-brand-red transition-colors">
                            <HelpCircle size={20} />
                        </button>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">Quanto você precisa vender para não ter prejuízo?</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-bold border border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-50 transition">
                        <Printer size={18}/> Imprimir
                    </button>
                    <button onClick={handleReset} className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition">
                        <RotateCcw size={18}/> Reset
                    </button>
                </div>
            </div>

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
                            <span className="text-[9px] uppercase font-bold text-gray-500">Imposto ({cfi.tax}%)</span>
                            <p className="text-sm font-black text-gray-900 dark:text-white">R$ {autoImposto.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Cartão ({avgCardRate.toFixed(2)}%)</span>
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

                {/* C) Composição do Custo Variável */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                           <PieIcon size={14}/> Composição do Custo Variável
                        </h4>
                        <button onClick={() => setChartHelp('composicao')} className="text-gray-400 hover:text-brand-red"><HelpCircle size={14}/></button>
                    </div>
                    {/* Added explicit style minHeight to fix Recharts in production */}
                    <div className="flex-1" style={{ minHeight: '320px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    innerRadius={60} 
                                    outerRadius={100} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${formatPercent(percent * 100)}`}
                                >
                                    {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                                <Legend verticalAlign="bottom" layout="horizontal" align="center" wrapperStyle={{paddingTop: '20px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
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
