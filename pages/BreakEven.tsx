
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
    ChevronRight,
    Store,
    Smartphone,
    Globe
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
        products,
        getProductCMV,
        platformConfig,
        salesTransactions,
    } = useApp();

    const availableMonths = useMemo(() => {
        if (!monthlyRevenue || monthlyRevenue.length === 0) return [];
        return [...monthlyRevenue]
            .filter(r => r.month)
            .sort((a, b) => b.month.localeCompare(a.month));
    }, [monthlyRevenue]);

    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        if (monthlyRevenue && monthlyRevenue.length > 0) {
            const sorted = [...monthlyRevenue]
                .filter(r => r.month)
                .sort((a, b) => b.month.localeCompare(a.month));
            const withData = sorted.find(m => Number(m.revenue) > 0);
            return withData ? withData.month : sorted[0].month;
        }
        return new Date().toISOString().slice(0, 7);
    });

    useEffect(() => {
        if (availableMonths.length > 0) {
            const exists = availableMonths.some(m => m.month === selectedMonth);
            if (!selectedMonth || !exists) {
                const withData = availableMonths.find(m => Number(m.revenue) > 0);
                setSelectedMonth(withData ? withData.month : availableMonths[0].month);
            }
        }
    }, [availableMonths, selectedMonth]);

    const formatMonthLabel = (monthStr: string) => {
        if (!monthStr) return '';
        const [year, monthNum] = monthStr.split('-');
        const monthsMap: Record<string, string> = {
            '01': 'Janeiro',
            '02': 'Fevereiro',
            '03': 'Março',
            '04': 'Abril',
            '05': 'Maio',
            '06': 'Junho',
            '07': 'Julho',
            '08': 'Agosto',
            '09': 'Setembro',
            '10': 'Outubro',
            '11': 'Novembro',
            '12': 'Dezembro'
        };
        const monthName = monthsMap[monthNum] || monthNum;
        return `${monthName} de ${year}`;
    };

    // --- MONTHLY PERSISTENT DATA STATES ---
    const [monthlyOrders, setMonthlyOrders] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('lucro_facil_be_monthly_orders_v1');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // Ignore
            }
        }
        return {};
    });

    const [monthlyTicketMedio, setMonthlyTicketMedio] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('lucro_facil_be_monthly_ticket_v1');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // Ignore
            }
        }
        return {};
    });

    useEffect(() => {
        localStorage.setItem('lucro_facil_be_monthly_orders_v1', JSON.stringify(monthlyOrders));
    }, [monthlyOrders]);

    useEffect(() => {
        localStorage.setItem('lucro_facil_be_monthly_ticket_v1', JSON.stringify(monthlyTicketMedio));
    }, [monthlyTicketMedio]);

    // Derived states
    const revenue = useMemo(() => {
        const rx = monthlyRevenue.find(r => r.month === selectedMonth);
        return rx ? Number(rx.revenue) : 0;
    }, [monthlyRevenue, selectedMonth]);

    const orderCount = useMemo(() => monthlyOrders[selectedMonth] || '', [monthlyOrders, selectedMonth]);

    const suggestedTicketMedio = useMemo(() => {
        const oCount = parseFloat(orderCount) || 0;
        if (revenue > 0 && oCount > 0) {
            return revenue / oCount;
        }
        return null;
    }, [revenue, orderCount]);

    const ticketMedio = useMemo(() => {
        if (monthlyTicketMedio[selectedMonth] !== undefined) {
            return monthlyTicketMedio[selectedMonth];
        }
        if (suggestedTicketMedio !== null) {
            return suggestedTicketMedio;
        }
        return 35; // Default fallback
    }, [monthlyTicketMedio, selectedMonth, suggestedTicketMedio]);

    const setOrderCount = (val: string) => {
        setMonthlyOrders(prev => ({ ...prev, [selectedMonth]: val }));
        
        // Auto calculate Ticket Médio when orderCount is set
        const orders = parseFloat(val) || 0;
        if (orders >= 1 && revenue > 0) {
            const calculated = parseFloat((revenue / orders).toFixed(2));
            setMonthlyTicketMedio(prev => ({ ...prev, [selectedMonth]: calculated }));
            setCalcSuccess(true);
            setTimeout(() => setCalcSuccess(false), 2000);
        }
    };

    const setTicketMedio = (val: number) => {
        setMonthlyTicketMedio(prev => ({ ...prev, [selectedMonth]: val }));
    };

    const [showHelp, setShowHelp] = useState(false);
    const [calcSuccess, setCalcSuccess] = useState(false);
    
    // --- XANDE ADVISOR AND SIMULATOR STATES ---
    const [activeAdvisorStep, setActiveAdvisorStep] = useState<number>(0);
    const [showAdvisor, setShowAdvisor] = useState<boolean>(true);

    const [simulatedCmvDecrease, setSimulatedCmvDecrease] = useState<number>(0); // reduced overall %
    const [simulatedFixedCostDecrease, setSimulatedFixedCostDecrease] = useState<number>(0); // reduced R$ value
    const [simulatedTicketIncrease, setSimulatedTicketIncrease] = useState<number>(0); // added R$ value

    // --- LOCAL STORAGE CHANNEL DISTRIBUTION ---
    const [channelMode, setChannelMode] = useState<'qty' | 'pct'>('qty');
    
    const [monthlyChannelQtys, setMonthlyChannelQtys] = useState<Record<string, Record<string, number>>>(() => {
        const saved = localStorage.getItem('lucro_facil_channel_qtys_monthly_v1');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return {};
    });

    useEffect(() => {
        localStorage.setItem('lucro_facil_channel_qtys_monthly_v1', JSON.stringify(monthlyChannelQtys));
    }, [monthlyChannelQtys]);

    const currentChannelQtys = useMemo(() => {
        return monthlyChannelQtys[selectedMonth] || {
            ifood: 0,
            food99: 0,
            keeta: 0,
            whatsapp: 0,
            physical: 0,
            app_proprio: 0,
            outros: 0
        };
    }, [monthlyChannelQtys, selectedMonth]);

    const totalChannelQty = useMemo(() => {
        return (Object.values(currentChannelQtys) as number[]).reduce((sum: number, v: number) => sum + (v || 0), 0) as number;
    }, [currentChannelQtys]);

    const updateChannelQty = (id: string, val: number) => {
        setMonthlyChannelQtys(prev => {
            const current = prev[selectedMonth] || {};
            const next = { ...current, [id]: val };
            
            // Auto update total orders
            const newTotal = (Object.values(next) as number[]).reduce((s: number, v: number) => s + (v || 0), 0) as number;
            if (newTotal > 0) {
                setOrderCount(newTotal.toString());
            }

            return { ...prev, [selectedMonth]: next };
        });
    };

    const [channelPercents, setChannelPercents] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('lucro_facil_channel_distribution_v2');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // Ignore
            }
        }
        return {
            ifood: 0,
            food99: 0,
            keeta: 0,
            whatsapp: 0,
            physical: 0,
            app_proprio: 0,
            outros: 0
        };
    });

    useEffect(() => {
        localStorage.setItem('lucro_facil_channel_distribution_v2', JSON.stringify(channelPercents));
    }, [channelPercents]);

    const totalChannelPercent = useMemo(() => {
        if (channelMode === 'qty') {
            return totalChannelQty > 0 ? 100 : 0;
        }
        return Object.values(channelPercents).reduce((sum: number, v: any) => sum + (v as number || 0), 0);
    }, [channelPercents, channelMode, totalChannelQty]);

    const CHANNELS = useMemo(() => [
        { 
            id: 'ifood', 
            name: 'iFood', 
            color: 'text-[#EA1D2C]', 
            logo: (
                <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0" aria-label="iFood">
                    <circle cx="50" cy="50" r="48" fill="#EA1D2C" />
                    {/* Eyes - slanted ovals */}
                    <ellipse cx="36" cy="38" rx="10" ry="14" fill="white" transform="rotate(-15 36 38)" />
                    <ellipse cx="62" cy="38" rx="10" ry="14" fill="white" transform="rotate(-15 62 38)" />
                    {/* Smile and arrowhead */}
                    <path d="M 22 55 C 26 73, 56 75, 68 57" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 68 57 L 57 59 L 65 47 Z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round" />
                </svg>
            ),
            getRate: (cfg: any) => (cfg?.ifood?.fee ?? 0) + (cfg?.ifood?.onlinePayment ?? 0) + (cfg?.ifood?.anticipation ?? 0) 
        },
        { 
            id: 'food99', 
            name: '99Food', 
            color: 'text-orange-500', 
            logo: (
                <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0" aria-label="99Food">
                    <defs>
                        <linearGradient id="grad99" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFF100" />
                            <stop offset="100%" stopColor="#FF7A00" />
                        </linearGradient>
                    </defs>
                    <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#grad99)" />
                    <text x="50" y="70" fill="#000000" fontSize="56" fontWeight="900" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" letterSpacing="-4">99</text>
                </svg>
            ),
            getRate: (cfg: any) => (cfg?.food99?.fee ?? 0) + (cfg?.food99?.onlinePayment ?? 0) + (cfg?.food99?.anticipation ?? 0) 
        },
        { 
            id: 'keeta', 
            name: 'Keeta', 
            color: 'text-yellow-600', 
            logo: (
                <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0" aria-label="Keeta">
                    <rect x="0" y="0" width="100" height="100" rx="20" fill="#00B195" />
                    <path d="M 0 0 L 100 0 L 100 62 C 100 82, 0 82, 0 62 Z" fill="#FFD800" />
                    <text x="50" y="50" fill="black" fontSize="24" fontWeight="900" textAnchor="middle" fontFamily="'Arial Black', Gadget, sans-serif" letterSpacing="-1">keeta</text>
                    <path d="M 22 55 C 32 68, 55 68, 62 58" fill="none" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
                    <circle cx="68" cy="55" r="2.5" fill="black" />
                    <circle cx="73" cy="51" r="2.5" fill="black" />
                </svg>
            ),
            getRate: (cfg: any) => (cfg?.keeta?.fee ?? 0) + (cfg?.keeta?.onlinePayment ?? 0) + (cfg?.keeta?.anticipation ?? 0) 
        },
        { 
            id: 'whatsapp', 
            name: 'WhatsApp e Delivery Próprio', 
            color: 'text-emerald-500', 
            logo: (
                <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0" aria-label="WhatsApp">
                    <circle cx="50" cy="50" r="48" fill="#25D366" />
                    <path d="M50 14 C30.1 14 14 30.1 14 50 C14 56.4 15.7 62.4 18.7 67.6 L14.5 83 L30.3 78.9 C35.2 81.6 40.8 83 46.5 83 L50 83 C69.9 83 86 66.9 86 47 C86 27.1 69.9 14 50 14 Z" fill="white" />
                    <path d="M50 18 C32.3 18 18 32.3 18 50 C18 55.8 19.5 61.2 22.2 65.9 L19 77.5 L31 74.4 C35.5 76.9 40.7 78.2 46 78.2 L50 78.2 C67.7 78.2 82 63.9 82 46.2 C82 28.5 67.7 18 50 18 Z" fill="#25D366" />
                    <path d="M63 56 C62 55.5 58 53.5 57 53 C56 52.8 55.5 52.5 55 53 C54.5 53.5 53 55.3 52.5 56 C52 56.5 51.5 56.8 50.5 56.2 C48 55 45.4 53.5 43.1 51.5 C41.2 49.8 39.7 47.9 39 46.8 C38.5 45.8 39 45.3 39.5 44.8 C40 44.3 40.5 43.7 41 43.2 C41.5 42.7 41.7 42.2 42 41.5 C42.2 41 42 40.2 41.8 39.8 C41.5 39.3 40 35.5 39.2 33.8 C38.5 32 37.8 32.2 37.2 32.2 C36.8 32.2 36.2 32.2 35.5 32.2 C34.8 32.2 33.8 32.5 33 33.2 C32.2 34 30.2 35.8 30.2 39.5 C30.2 43.2 32.8 46.8 33.2 47.2 C33.5 47.8 38.4 55.2 45.8 58.5 C47.5 59.2 49 59.8 50 60 C51.8 60.5 53.2 60.5 54.2 60.2 C55.5 60 58.2 58.5 58.8 56.8 C59.5 55 59.5 53.5 59.2 53.2 C59 52.8 58.5 52.5 57.5 52 Z" fill="white" />
                </svg>
            ),
            getRate: () => 0 
        },
        { 
            id: 'physical', 
            name: 'Loja Física e Terminal', 
            color: 'text-blue-500', 
            logo: (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Store size={14} className="stroke-[2.5]" />
                </div>
            ),
            getRate: () => 0 
        },
        { 
            id: 'app_proprio', 
            name: 'App Próprio e Mobile', 
            color: 'text-indigo-500', 
            logo: (
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Smartphone size={14} className="stroke-[2.5]" />
                </div>
            ),
            getRate: () => 0 
        },
        { 
            id: 'outros', 
            name: 'Outros', 
            color: 'text-gray-500', 
            logo: (
                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Globe size={14} className="stroke-[2.5]" />
                </div>
            ),
            getRate: () => 0 
        },
    ], []);

    const weightedPlatformFeePercent = useMemo(() => {
        if (channelMode === 'qty') {
            if (totalChannelQty === 0) return 0;
            let totalFee = 0;
            CHANNELS.forEach(channel => {
                const qty = currentChannelQtys[channel.id] || 0;
                const pct = (qty / totalChannelQty);
                const rate = channel.getRate(platformConfig);
                totalFee += pct * rate;
            });
            return totalFee;
        }

        if (totalChannelPercent === 0) return 0;
        let totalFee = 0;
        CHANNELS.forEach(channel => {
            const pct = channelPercents[channel.id] || 0;
            const rate = channel.getRate(platformConfig);
            totalFee += (pct / 100) * rate;
        });
        return totalChannelPercent > 0 ? (totalFee / (totalChannelPercent / 100)) : 0;
    }, [channelPercents, platformConfig, totalChannelPercent, CHANNELS, channelMode, currentChannelQtys, totalChannelQty]);

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
    const fixedCosts = useMemo(() => expenses.filter(e => e.month === selectedMonth).reduce((s, e) => s + e.value, 0), [expenses, selectedMonth]);
    const avgCardRate = useMemo(() => (cfi.debitTax + cfi.creditTax) / 2, [cfi]);

    const avgCmvPercent = useMemo(() => {
        if (!products || products.length === 0) return 0.35; // Default 35% if no products

        // Filter transactions for the selected month to get products sold and volumes
        const monthTransactions = (salesTransactions || []).filter(tx => {
            return tx.date && tx.date.startsWith(selectedMonth);
        });

        let totalWeightedCmvCost = 0;
        let totalWeightedRevenue = 0;
        let hasSalesData = false;

        if (monthTransactions.length > 0) {
            monthTransactions.forEach(tx => {
                const prod = products.find(p => p.id === tx.productId);
                if (prod) {
                    const cost = getProductCMV(prod);
                    const price = tx.pricePaidByCustomer || prod.fixedPriceStore || 0;
                    totalWeightedCmvCost += cost * tx.qty;
                    totalWeightedRevenue += price * tx.qty;
                    hasSalesData = true;
                }
            });
        }

        if (hasSalesData && totalWeightedRevenue > 0) {
            return totalWeightedCmvCost / totalWeightedRevenue;
        }

        // Fallback: Weighted average of all products
        let totalCmvCost = 0;
        let totalSalesPrice = 0;

        products.forEach(p => {
            const cost = getProductCMV(p);
            if (cost > 0) {
                const price = p.fixedPriceStore && p.fixedPriceStore > 0 ? p.fixedPriceStore : (cost / 0.35); // Fallback assumption
                totalCmvCost += cost;
                totalSalesPrice += price;
            }
        });

        if (totalSalesPrice > 0) {
            return totalCmvCost / totalSalesPrice;
        }

        return 0.35; // Default 35% fallback
    }, [products, getProductCMV, salesTransactions, selectedMonth]);

    const defaultCmvValue = useMemo(() => {
        return revenue * avgCmvPercent;
    }, [revenue, avgCmvPercent]);
    
    const autoImposto = useMemo(() => revenue * (cfi.tax / 100), [revenue, cfi]);
    const autoCartao = useMemo(() => revenue * (avgCardRate / 100), [revenue, avgCardRate]);
    const autoVoucher = useMemo(() => revenue * (cfi.voucherTax / 100), [revenue, cfi]);

    const dynamicCmv = useMemo(() => localEntries.filter(e => e.category === 'Compras').reduce((s, e) => s + e.value, 0), [localEntries]);
    const dynamicTx = useMemo(() => localEntries.filter(e => e.category === 'Tx Entrega').reduce((s, e) => s + e.value, 0), [localEntries]);
    const dynamicExtras = useMemo(() => localEntries.filter(e => e.category !== 'Compras' && e.category !== 'Tx Entrega').reduce((s, e) => s + e.value, 0), [localEntries]);

    const finalCmv = useMemo(() => {
        const val = cmvOverride !== '' ? parseFloat(cmvOverride.toString()) || 0 : (dynamicCmv > 0 ? dynamicCmv : defaultCmvValue);
        return parseFloat(val.toFixed(2));
    }, [cmvOverride, dynamicCmv, defaultCmvValue]);

    const finalTx = txEntregaOverride !== '' ? parseFloat(txEntregaOverride.toString()) || 0 : dynamicTx;

    const autoPlataforma = useMemo(() => revenue * (weightedPlatformFeePercent / 100), [revenue, weightedPlatformFeePercent]);

    const totalVarCosts = autoImposto + autoCartao + autoVoucher + finalCmv + finalTx + dynamicExtras + autoPlataforma;
    
    const varPct = useMemo(() => {
        if (revenue > 0) {
            return (totalVarCosts / revenue) * 100;
        }
        const cmvPct = avgCmvPercent * 100;
        return cmvPct + cfi.tax + avgCardRate + cfi.voucherTax + weightedPlatformFeePercent;
    }, [revenue, totalVarCosts, avgCmvPercent, cfi, avgCardRate, weightedPlatformFeePercent]);

    const mcPct = useMemo(() => 1 - (varPct / 100), [varPct]);
    
    const breakEvenR$ = mcPct > 0 ? fixedCosts / mcPct : 0;
    const breakEvenUnits = (ticketMedio > 0 && mcPct > 0) ? breakEvenR$ / ticketMedio : 0;
    const gapToBe = Math.max(0, breakEvenR$ - revenue);
    const progressPct = breakEvenR$ > 0 ? (revenue / breakEvenR$) * 100 : 0;

    // --- DYNAMIC XANDE SIMULATOR CALCULATIONS ---
    const simulatedFixedCosts = useMemo(() => {
        return Math.max(0, fixedCosts - simulatedFixedCostDecrease);
    }, [fixedCosts, simulatedFixedCostDecrease]);

    const simulatedVarPct = useMemo(() => {
        const baseCmvPercentage = revenue > 0 ? (finalCmv / revenue) * 100 : (avgCmvPercent * 100);
        const cmvDifference = Math.max(0, baseCmvPercentage - simulatedCmvDecrease);
        const dynamicSimulatedCmv = revenue > 0 ? (cmvDifference / 100) * revenue : 0;
        
        const simulatedVarCost = autoImposto + autoCartao + autoVoucher + dynamicSimulatedCmv + finalTx + dynamicExtras + autoPlataforma;
        return revenue > 0 ? (simulatedVarCost / revenue) * 100 : Math.max(10, varPct - simulatedCmvDecrease);
    }, [finalCmv, revenue, simulatedCmvDecrease, autoImposto, autoCartao, autoVoucher, finalTx, dynamicExtras, varPct, avgCmvPercent, autoPlataforma]);

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

            {revenue <= 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-amber-800 dark:text-amber-350 shadow-sm animate-fade-in no-print">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-amber-900 dark:text-amber-200 font-extrabold block mb-0.5">⚠️ Faturamento Zerado para {formatMonthLabel(selectedMonth)}!</strong>
                        Não encontramos vendas registradas para o período selecionado no faturamento. Para que as simulações e diagnósticos do Xande reflitam a realidade da sua loja, acesse a aba de <strong className="text-brand-red font-black">Faturamento</strong> e registre as vendas.
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
                        <select 
                            value={selectedMonth} 
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-brand-red cursor-pointer"
                        >
                            {availableMonths.length === 0 ? (
                                <option value={new Date().toISOString().slice(0, 7)}>
                                    {formatMonthLabel(new Date().toISOString().slice(0, 7))}
                                </option>
                            ) : (
                                availableMonths.map(m => (
                                    <option key={m.month} value={m.month}>
                                        {formatMonthLabel(m.month)}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nº Pedidos no Mês</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                placeholder="Quantidade de pedidos" 
                                value={orderCount}
                                onChange={e => setOrderCount(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-brand-red outline-none"
                            />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">Insira para calcular o Ticket Médio automaticamente.</p>
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
                    
                    {suggestedTicketMedio !== null && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/40 text-xs text-blue-850 dark:text-blue-300 animate-fade-in flex flex-col gap-1.5">
                            <span className="font-extrabold block text-[10px] uppercase text-blue-500">
                                📊 Ticket Médio calculado automaticamente
                            </span>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                <span className="text-sm font-black italic">R$ {suggestedTicketMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                {monthlyTicketMedio[selectedMonth] !== undefined && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMonthlyTicketMedio(prev => {
                                                const copy = { ...prev };
                                                delete copy[selectedMonth];
                                                return copy;
                                            });
                                            setCalcSuccess(true);
                                            setTimeout(() => setCalcSuccess(false), 2000);
                                        }}
                                        className="px-2 py-1 text-[9px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white rounded transition shrink-0"
                                    >
                                        Calcular de Novo
                                    </button>
                                )}
                                {monthlyTicketMedio[selectedMonth] === undefined && (
                                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 uppercase tracking-wider">
                                        <Check size={10} /> Confirmado
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Auto-filled Section */}
                <div className="lg:col-span-3 flex flex-col gap-6 font-sans">
                    {/* Distribuição de Vendas por Canal */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase text-gray-400 flex items-center gap-2 tracking-wider">
                                    <PieIcon className="text-brand-red h-4 w-4" /> Distribuição de Vendas por Canal
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {channelMode === 'qty' ? 'Informe a quantidade de pedidos em cada canal.' : 'Informe a divisão percentual das suas vendas em cada canal.'}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                {/* Toggle Mode */}
                                <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0">
                                    <button 
                                        onClick={() => setChannelMode('qty')}
                                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${channelMode === 'qty' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Modo Quantidade
                                    </button>
                                    <button 
                                        onClick={() => setChannelMode('pct')}
                                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${channelMode === 'pct' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Modo Percentual
                                    </button>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                    totalChannelPercent === 100 
                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                                        : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                                }`}>
                                    {channelMode === 'qty' ? (
                                        <>Total Pedidos: {totalChannelQty}</>
                                    ) : (
                                        <>Total: {totalChannelPercent}% {totalChannelPercent === 100 ? '✅' : '⚠️'}</>
                                    )}
                                </span>
                            </div>
                        </div>

                        {channelMode === 'pct' && totalChannelPercent !== 100 && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-400 rounded-xl font-bold leading-normal">
                                Atenção: A soma dos percentuais é de {totalChannelPercent}% e deve ser exatamente 100% para o cálculo ser válido! Ajuste os canais abaixo.
                            </div>
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {CHANNELS.map(ch => {
                                const currentPct = channelPercents[ch.id] || 0;
                                const currentQty = currentChannelQtys[ch.id] || 0;
                                const rate = ch.getRate(platformConfig);
                                
                                const calculatedPct = totalChannelQty > 0 ? (currentQty / totalChannelQty) * 100 : 0;

                                return (
                                    <div key={ch.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between gap-1.5 transition-colors hover:border-gray-200 dark:hover:border-gray-700">
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {ch.logo}
                                                <div className="min-w-0">
                                                    <span className="text-[12px] font-extrabold text-gray-900 dark:text-gray-100 block truncate leading-tight">
                                                        {ch.name}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 dark:text-gray-400 block font-bold leading-none mt-0.5">
                                                        Taxa do Canal: {rate.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {channelMode === 'pct' ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={currentPct}
                                                            onChange={e => {
                                                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                setChannelPercents(prev => ({ ...prev, [ch.id]: val }));
                                                            }}
                                                            className="w-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded px-1.5 py-0.5 text-xs text-right font-black focus:border-brand-red outline-none shadow-sm animate-fade-in"
                                                        />
                                                        <span className="text-[10px] font-bold text-gray-400">%</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={currentQty}
                                                            onChange={e => {
                                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                                updateChannelQty(ch.id, val);
                                                            }}
                                                            className="w-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded px-1.5 py-0.5 text-xs text-right font-black focus:border-brand-red outline-none shadow-sm animate-fade-in"
                                                        />
                                                        <span className="text-[10px] font-bold text-gray-400">pedidos</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {channelMode === 'pct' ? (
                                            <div className="mt-1.5">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={currentPct}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setChannelPercents(prev => ({ ...prev, [ch.id]: val }));
                                                    }}
                                                    className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-brand-red font-sans"
                                                />
                                            </div>
                                        ) : (
                                            <div className="mt-1.5 flex items-center justify-between">
                                                <div className="flex-1 mr-3 relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex">
                                                    <div className={`h-full bg-brand-red`} style={{ width: `${calculatedPct}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 w-10 text-right">
                                                    {calculatedPct.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary indicator */}
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                                <h4 className="text-[11px] font-black text-blue-900 dark:text-blue-300 uppercase">Impacto de Plataformas no seu Negócio</h4>
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-normal">
                                    Seu custo de delivery varia de acordo com as vendas de cada canal. Veja a média de taxas que as plataformas cobram de você:
                                </p>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                                <span className="text-[9px] uppercase font-bold text-blue-400 dark:text-blue-500 block">Custo Variável Médio Ponderado</span>
                                <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                                    {weightedPlatformFeePercent.toFixed(2)}% do Faturamento
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
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
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
                    <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">Custo Variável Total</span>
                    <p className="text-lg font-black text-gray-900 dark:text-white">R$ {totalVarCosts.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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
                <div className={`p-4 rounded-2xl border shadow-md flex flex-col justify-center text-white transition-all ${
                    revenue <= 0 ? 'bg-slate-500 dark:bg-slate-700 border-slate-600' :
                    gapToBe > 0 
                        ? 'bg-red-600 dark:bg-red-700 border-red-750' 
                        : 'bg-emerald-600 dark:bg-emerald-700 border-emerald-750'
                }`}>
                    <span className="text-[9px] uppercase font-black opacity-90 mb-1">
                        {revenue <= 0 ? 'Status' : (gapToBe > 0 ? 'Status (Desequilibrado)' : 'Status (Equilibrado)')}
                    </span>
                    <p className="text-sm font-black uppercase tracking-tight">
                        {revenue <= 0 ? 'Aguardando Faturamento' : 
                         (gapToBe > 0 ? `DESEQUILIBRADO (Falta R$ ${gapToBe.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : 'EQUILIBRADO 🎉')}
                    </p>
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
                                        bgClass: "bg-emerald-50/10 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-800/60",
                                        titleClass: "text-emerald-600 dark:text-emerald-400 font-extrabold",
                                        textClass: "text-emerald-800 dark:text-emerald-100 font-medium"
                                    };

                                    if (days > 10 && days <= 20) {
                                        rating = {
                                            icon: <TrendingUp className="text-amber-500 h-8 w-8 shrink-0" />,
                                            badge: "Alerta Médio (ZONA RETRANCADA)",
                                            text: `Você leva ${days} dias do mês para pagar o aluguel e as contas faturadas. Sobram apenas ${30 - days} dias para gerar lucro real. Recomendo usar o Simulador de Alavancas ao lado para baixar para 10 dias!`,
                                            bgClass: "bg-amber-50/10 border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-800/60",
                                            titleClass: "text-amber-600 dark:text-amber-400 font-extrabold",
                                            textClass: "text-amber-800 dark:text-amber-100 font-medium"
                                        };
                                    } else if (days > 20) {
                                        rating = {
                                            icon: <AlertTriangle className="text-brand-red h-8 w-8 shrink-0 animate-pulse" />,
                                            badge: "Alerta Crítico (ZONA DE PERIGO)",
                                            text: `Você passa ${days} dias do mês trabalhando puramente no vermelho! Se houver uma semana de chuva ou quebra de máquina, você cai no prejuízo. Seu foco de vida deve ser diminuir despesas fixas ou bater metas de CMV urgente!`,
                                            bgClass: "bg-red-500/10 border-red-500/40 dark:bg-red-950/40 dark:border-red-900/60",
                                            titleClass: "text-red-600 dark:text-red-400 font-black",
                                            textClass: "text-red-900 dark:text-red-100 font-medium"
                                        };
                                    }

                                    return (
                                        <div className={`p-4 rounded-xl border flex gap-3 items-start leading-snug animate-fade-in ${rating.bgClass}`}>
                                            {rating.icon}
                                            <div className="space-y-1">
                                                <span className={`text-[11px] uppercase tracking-widest block ${rating.titleClass}`}>{rating.badge}</span>
                                                <p className={`text-xs font-sans leading-relaxed ${rating.textClass}`}>{rating.text}</p>
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
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Simulador do Xande ("E Se...?")</h3>
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
