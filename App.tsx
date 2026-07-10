
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Ingredients from './pages/Ingredients';
import Products from './pages/Products';
import Pricing from './pages/Pricing';
import Expenses from './pages/Expenses';
import Dna from './pages/Dna';
import FinancialCategories from './pages/FinancialCategories';
import Billing from './pages/Billing';
import Profit from './pages/Profit';
import Combos from './pages/Combos';
import StoreList from './pages/StoreList';
import PurchaseEntry from './pages/PurchaseEntry';
import Help from './pages/Help';
import ShoppingList from './pages/ShoppingList';
import BreakEven from './pages/BreakEven';
import SmartCalculator from './pages/SmartCalculator';
import SmartOffers from './pages/SmartOffers';
import SmartSimulator from './pages/SmartSimulator';
import SalesImport from './pages/SalesImport';
import ConsultingReport from './pages/ConsultingReport';
import BuffetSimulator from './pages/BuffetSimulator';
import { PlansPricing } from './pages/PlansPricing';
import { MyPlan } from './pages/MyPlan';
import { OnboardingModal } from './components/OnboardingModal';
import { UpdateNotification } from './components/UpdateNotification';
import { StoreInfo, GlobalState, Ingredient, Product, Expense, MonthlyData, CfiConfig, PlatformConfig, Category, Supplier, MenuCategory, Combo, FixedCostMode } from './types';
import { INITIAL_STATE, EMPTY_STATE, BACKGROUND_PALETTE, INITIAL_MENU_CATEGORIES, INITIAL_INGREDIENT_CATEGORIES } from './constants';
import backupData from './backup_data.json';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { AuthScreen } from './components/AuthScreen';
import { SubscriptionBlockScreen } from './components/SubscriptionBlockScreen';
import { LogOut, Users, Shield, ArrowLeftRight, Loader, Menu, AlertTriangle, ShieldCheck } from 'lucide-react';

const STORAGE_KEY_DATA = 'lucro_facil_pro_data_v3';
const STORAGE_KEY_STORES = 'lucro_facil_pro_stores_v3';
const STORAGE_KEY_LAST_BACKUP = 'lucro_facil_last_backup_date';

const getApiUrl = (path: string) => {
  const origin = window.location.origin;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    const hostname = window.location.hostname;
    return `http://${hostname}:3000${path}`;
  }
  return path;
};

// --- MIGRATION & SANITIZATION UTILS ---
const fixMoney = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  if (typeof val === 'string') {
    // Safety check: if string is already a clean float (e.g. "123.45" from JSON)
    // and doesn't look like BR thousands (e.g. not "1.234"), parse directly.
    if (/^-?\d+\.\d+$/.test(val) && !val.includes(',')) {
       return parseFloat(val);
    }

    // BR Format: Remove dots (thousands), replace comma with dot
    // Ex: "R$ 1.500,50" -> "1500.50"
    const clean = val.replace(/[R$\s.]/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const fixPercent = (val: any): number => {
  if (typeof val === 'number') return parseFloat(val.toFixed(1));
  if (typeof val === 'string') {
     // Ex: "14,5%" -> "14.5"
     const clean = val.replace(/[%]/g, '').replace(',', '.');
     const num = parseFloat(clean);
     return isNaN(num) ? 0 : parseFloat(num.toFixed(1));
  }
  return 0;
};

// Strict Sanitizer: Reconstructs the object to ensure only valid, raw data is kept.
// Drops any calculated fields that might have polluted the state.
const sanitizeGlobalState = (data: any): GlobalState => {
  const safeData = data || {};

  // 1. Store Info
  const storeInfo: StoreInfo = {
    id: safeData.storeInfo?.id || '1',
    name: safeData.storeInfo?.name || 'Nova Loja',
    address: safeData.storeInfo?.address || '',
    logo: safeData.storeInfo?.logo || ''
  };

  // 2. Ingredients (Raw)
  const ingredients: Ingredient[] = Array.isArray(safeData.ingredients) 
    ? safeData.ingredients.map((i: any) => ({
        id: i.id || Math.random().toString(36).substr(2, 9),
        name: i.name || '',
        unit: i.unit || 'UN',
        price: fixMoney(i.price),
        packageQuantity: Number(i.packageQuantity) || 0,
        lossPercent: fixPercent(i.lossPercent),
        categoryId: i.categoryId || undefined,
        isSubRecipe: !!i.isSubRecipe,
        ingredients: Array.isArray(i.ingredients) ? i.ingredients.map((pi: any) => ({
            ingredientId: pi.ingredientId,
            quantity: Number(pi.quantity) || 0
        })) : undefined
      }))
    : [];

  // 3. Products (Raw)
  const products: Product[] = Array.isArray(safeData.products)
    ? safeData.products.map((p: any) => ({
        id: p.id || Math.random().toString(36).substr(2, 9),
        name: p.name || '',
        category: p.category || 'Sem Categoria',
        order: Number(p.order) || 0,
        fixedPriceStore: fixMoney(p.fixedPriceStore),
        isTopSeller: p.isTopSeller !== undefined ? !!p.isTopSeller : undefined,
        isSlowMover: p.isSlowMover !== undefined ? !!p.isSlowMover : undefined,
        isAnchor: p.isAnchor !== undefined ? !!p.isAnchor : undefined,
        ingredients: Array.isArray(p.ingredients) ? p.ingredients.map((pi: any) => ({
            ingredientId: pi.ingredientId,
            quantity: Number(pi.quantity) || 0
        })) : [],
        pricing: p.pricing ? {
            profitMargin: fixPercent(p.pricing.profitMargin),
            ifood: p.pricing.ifood ? {
                fee: fixPercent(p.pricing.ifood.fee),
                onlinePayment: fixPercent(p.pricing.ifood.onlinePayment),
                anticipation: fixPercent(p.pricing.ifood.anticipation),
                delivery: fixMoney(p.pricing.ifood.delivery),
                ciValue: fixMoney(p.pricing.ifood.ciValue),
                coupon: fixMoney(p.pricing.ifood.coupon)
            } : undefined,
            food99: p.pricing.food99 ? {
                fee: fixPercent(p.pricing.food99.fee),
                onlinePayment: fixPercent(p.pricing.food99.onlinePayment),
                anticipation: fixPercent(p.pricing.food99.anticipation),
                delivery: fixMoney(p.pricing.food99.delivery),
                coupon: fixMoney(p.pricing.food99.coupon)
            } : undefined,
            keeta: p.pricing.keeta ? {
                fee: fixPercent(p.pricing.keeta.fee),
                onlinePayment: fixPercent(p.pricing.keeta.onlinePayment),
                anticipation: fixPercent(p.pricing.keeta.anticipation),
                delivery: fixMoney(p.pricing.keeta.delivery),
                coupon: fixMoney(p.pricing.keeta.coupon)
            } : undefined
        } : undefined
      }))
    : [];

  // 4. Expenses (Raw)
  const expenses: Expense[] = Array.isArray(safeData.expenses)
    ? safeData.expenses.map((e: any) => ({
        id: e.id || Math.random().toString(36).substr(2, 9),
        month: e.month || '',
        description: e.description || e.name || '',
        value: fixMoney(e.value),
        category: e.category || 'Outros',
        dueDate: e.dueDate,
        paid: !!e.paid,
        installment: e.installment ? {
            current: Number(e.installment.current),
            total: Number(e.installment.total),
            id: e.installment.id
        } : undefined
      }))
    : [];

  // 5. Monthly Revenue (Raw)
  const monthlyRevenue: MonthlyData[] = Array.isArray(safeData.monthlyRevenue)
    ? safeData.monthlyRevenue.map((m: any) => {
        let month = m.month || '';
        // Handle legacy format where month was 'Janeiro' and year was 2024
        if (m.year && month && !month.includes('-')) {
            const monthMap: Record<string, string> = {
                'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
                'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
                'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
            };
            const monthNum = monthMap[month] || '01';
            month = `${m.year}-${monthNum}`;
        }
        return {
            month,
            revenue: fixMoney(m.revenue)
        };
    })
    : [];

  // 6. CFI Config (Raw Inputs only)
  const cfi: CfiConfig = {
      debitTax: fixPercent(safeData.cfi?.debitTax),
      creditTax: fixPercent(safeData.cfi?.creditTax),
      voucherTax: fixPercent(safeData.cfi?.voucherTax),
      tax: fixPercent(safeData.cfi?.tax),
      royalties: fixPercent(safeData.cfi?.royalties),
      marketing: fixPercent(safeData.cfi?.marketing),
      profitMargin: fixPercent(safeData.cfi?.profitMargin ?? 20.0)
  };

  // 7. Platform Config (Raw Inputs)
  const platformConfig: PlatformConfig = {
      ifood: {
          fee: fixPercent(safeData.platformConfig?.ifood?.fee ?? 12),
          onlinePayment: fixPercent(safeData.platformConfig?.ifood?.onlinePayment ?? 3.2),
          anticipation: fixPercent(safeData.platformConfig?.ifood?.anticipation ?? 1.9),
          delivery: fixMoney(safeData.platformConfig?.ifood?.delivery ?? 4.0),
          ciValue: fixMoney(safeData.platformConfig?.ifood?.ciValue ?? 5.0)
      },
      food99: {
          fee: fixPercent(safeData.platformConfig?.food99?.fee ?? 8.9),
          onlinePayment: fixPercent(safeData.platformConfig?.food99?.onlinePayment ?? 3.2),
          anticipation: fixPercent(safeData.platformConfig?.food99?.anticipation ?? 0),
          delivery: fixMoney(safeData.platformConfig?.food99?.delivery ?? 4.0)
      },
      keeta: {
          fee: fixPercent(safeData.platformConfig?.keeta?.fee ?? 8.9),
          onlinePayment: fixPercent(safeData.platformConfig?.keeta?.onlinePayment ?? 3.2),
          anticipation: fixPercent(safeData.platformConfig?.keeta?.anticipation ?? 0),
          delivery: fixMoney(safeData.platformConfig?.keeta?.delivery ?? 4.0)
      }
  };

  // 8. Categories & Suppliers
  const categories: Category[] = Array.isArray(safeData.categories)
    ? safeData.categories.map((c: any) => ({ id: c.id, name: c.name, isCustom: !!c.isCustom }))
    : [];
  
  const suppliers: Supplier[] = Array.isArray(safeData.suppliers)
    ? safeData.suppliers.map((s: any) => ({ id: s.id, name: s.name, contact: s.contact }))
    : [];

  const menuCategories: MenuCategory[] = Array.isArray(safeData.menuCategories)
    ? safeData.menuCategories.map((mc: any) => ({ id: mc.id, name: mc.name, order: Number(mc.order) || 0 }))
    : INITIAL_MENU_CATEGORIES; // Default if missing (for migration)

  const combos: Combo[] = Array.isArray(safeData.combos)
    ? safeData.combos.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        category: c.category || 'Padrão',
        type: c.type || 'fixed',
        items: Array.isArray(c.items) ? c.items.map((it: any) => ({ productId: it.productId, quantity: Number(it.quantity) })) : [],
        freeChoiceCount: Number(c.freeChoiceCount) || 2,
        profitMargin: fixPercent(c.profitMargin),
        ifoodFee: fixPercent(c.ifoodFee ?? (platformConfig.ifood.fee + platformConfig.ifood.onlinePayment + platformConfig.ifood.anticipation)),
        food99Fee: fixPercent(c.food99Fee ?? (platformConfig.food99.fee + platformConfig.food99.onlinePayment + platformConfig.food99.anticipation)),
        keetaFee: fixPercent(c.keetaFee ?? (platformConfig.keeta.fee + platformConfig.keeta.onlinePayment + platformConfig.keeta.anticipation)),
        ifoodDelivery: fixMoney(c.ifoodDelivery ?? c.delivery),
        food99Delivery: fixMoney(c.food99Delivery ?? c.delivery),
        keetaDelivery: fixMoney(c.keetaDelivery ?? c.delivery),
        ifoodCoupon: fixMoney(c.ifoodCoupon ?? c.coupon),
        food99Coupon: fixMoney(c.food99Coupon ?? c.coupon),
        keetaCoupon: fixMoney(c.keetaCoupon ?? c.coupon),
        ciValue: fixMoney(c.ciValue ?? platformConfig.ifood.ciValue),
        customPackagingCost: fixMoney(c.customPackagingCost),
        fixedPriceStore: fixMoney(c.fixedPriceStore),
        order: Number(c.order) || 0
    }))
    : [];

  const fixedCostMode: FixedCostMode = safeData.fixedCostMode === 'CURRENT_MONTH' ? 'CURRENT_MONTH' : 'AVERAGE';

  const ingredientCategories = Array.isArray(safeData.ingredientCategories)
    ? safeData.ingredientCategories.map((ic: any) => ({ id: ic.id || Math.random().toString(36).substr(2, 9), name: ic.name || '' }))
    : INITIAL_INGREDIENT_CATEGORIES;

  return {
      storeInfo,
      ingredients,
      products,
      menuCategories,
      combos,
      expenses,
      monthlyRevenue,
      cfi,
      platformConfig,
      categories,
      suppliers,
      fixedCostMode,
      purchaseEntries: Array.isArray(safeData.purchaseEntries) ? safeData.purchaseEntries : [],
      supplierMappings: Array.isArray(safeData.supplierMappings) ? safeData.supplierMappings : [],
      salesTransactions: Array.isArray(safeData.salesTransactions) ? safeData.salesTransactions : [],
      resetPassword: safeData.resetPassword || '1234',
      ingredientCategories
  };
};

const migrateStoresData = (data: Record<string, any>): Record<string, GlobalState> => {
  const migrated: Record<string, GlobalState> = {};
  Object.keys(data).forEach(key => {
    if (data[key]) {
      migrated[key] = sanitizeGlobalState(data[key]);
    }
  });
  return migrated;
};

// Recursively removes undefined fields from an object or array to prevent Firestore write crashes
const cleanUndefined = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
};
// --- END MIGRATION UTILS ---

interface AppContentProps {
  onLogout: () => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  bgPatternEnabled: boolean;
  onBgPatternToggle: (enabled: boolean) => void;
  sidebarBgColor: string;
  onSidebarBgColorChange: (color: string) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  lastBackupDate: string | null;
}

import FloatingChat from './components/FloatingChat';
import { XandePanel } from './components/XandePanel';

const GlobalFooter: React.FC = () => (
  <div className="w-full py-5 flex flex-col items-center justify-center space-y-1 border-t border-gray-200/30 dark:border-gray-800/30 mt-5">
    <div className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
      ⚡ Carreiro | Apps
    </div>
    <div className="text-[8px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-tighter opacity-60">
      PRO Gestão
    </div>
  </div>
);

const AppContent: React.FC<AppContentProps> = ({ onLogout, bgColor, onBgColorChange, bgPatternEnabled, onBgPatternToggle, sidebarBgColor, onSidebarBgColorChange, onBackup, onRestore, lastBackupDate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showGlobalXande, setShowGlobalXande] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { profile } = useAuth();

  const diffDays = React.useMemo(() => {
    if (!profile || profile.status !== 'trial' || !profile.trialEnd) return null;
    const now = new Date();
    const end = new Date(profile.trialEnd);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [profile]);

  useEffect(() => {
    const handleOpenXande = () => setShowGlobalXande(true);
    const handleChangeTab = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) setActiveTab(customEvent.detail);
    };
    window.addEventListener('open-global-xande', handleOpenXande);
    window.addEventListener('change-tab', handleChangeTab);
    return () => {
        window.removeEventListener('open-global-xande', handleOpenXande);
        window.removeEventListener('change-tab', handleChangeTab);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'expenses': return <Expenses />;
      case 'categories': return <FinancialCategories />;
      case 'billing': return <Billing />;
      case 'dna': return <Dna />;
      case 'ingredients': return <Ingredients />;
      case 'products': return <Products />;
      case 'pricing': return <Pricing />;
      case 'profit': return <Profit />;
      case 'xande-report': return <ConsultingReport />;
      case 'buffet-simulator': return <BuffetSimulator />;
      case 'combos': return <Combos />;
      case 'sales-import': return <SalesImport />;
      case 'purchase-entry': return <PurchaseEntry />;
      case 'break-even': return <BreakEven />;
      case 'smart-offers': return <SmartOffers />;
      case 'smart-simulator': return <SmartSimulator />;
      case 'calculator': return <SmartCalculator />;
      case 'help': return <Help />;
      case 'shopping-list': return <ShoppingList />;
      case 'plans': return <PlansPricing />;
      case 'my-plan': return <MyPlan />;
      default: return <Dashboard />;
    }
  };

  const getTabLabel = (tab: string) => {
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      expenses: 'Despesas Fixas',
      categories: 'Categorias',
      billing: 'Faturamento',
      dna: 'CFI da Empresa',
      ingredients: 'Insumos / Receitas',
      products: 'Ficha Técnica (CMV)',
      pricing: 'Preço de Venda',
      profit: 'Lucro Atual',
      'xande-report': 'Relatório do Xande',
      'buffet-simulator': 'À Vontade / Buffet',
      combos: 'Combos',
      'sales-import': 'Integrar Vendas',
      'purchase-entry': 'Entrada de Compras',
      'break-even': 'Ponto de Equilíbrio',
      'smart-offers': 'Ofertas de Margem',
      'smart-simulator': 'Simular Descontos',
      calculator: 'Calculadora',
      'shopping-list': 'Lista de Compras',
      help: 'Central de Ajuda',
      plans: 'Planos & Preços',
      'my-plan': 'Meu Plano / Financeiro'
    };
    return map[tab] || 'Lucro Fácil';
  };

  return (
    <div className="flex h-[100vh] w-full overflow-hidden transition-colors duration-500 bg-[var(--app-bg,#111827)]">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-white/10 flex items-center justify-between px-5 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white transition"
            title="Abrir menu"
          >
            <Menu size={24} />
          </button>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            {getTabLabel(activeTab)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-red bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded">
            PRO
          </span>
        </div>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        bgColor={bgColor}
        onBgColorChange={onBgColorChange}
        bgPatternEnabled={bgPatternEnabled}
        onBgPatternToggle={onBgPatternToggle}
        sidebarBgColor={sidebarBgColor}
        onSidebarBgColorChange={onSidebarBgColorChange}
        onBackup={onBackup}
        onRestore={onRestore}
        lastBackupDate={lastBackupDate}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <main className="flex-1 w-full flex flex-col bg-transparent overflow-y-auto min-h-0">
        <div className="flex-1 w-full max-w-none flex flex-col p-4 md:p-6 pt-20 md:pt-6">
          {/* Trial Warning Banner */}
          {profile?.status === 'trial' && diffDays !== null && diffDays >= 0 && diffDays <= 3 && profile.email?.toLowerCase().trim() !== 'espacocarreiro@gmail.com' && activeTab !== 'plans' && (
            <div id="trial-warning-banner" className="bg-gradient-to-r from-[#1E1B4B] via-[#0F172A] to-[#1E1B4B] border-2 border-brand-yellow/30 p-4 rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="bg-brand-yellow/15 border border-brand-yellow/20 p-2.5 text-brand-yellow rounded-full shrink-0 flex items-center justify-center">
                  <span className="font-extrabold text-sm font-mono">⚠️</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Seu período de teste grátis está chegando ao fim!</h4>
                  <p className="text-xs text-slate-400">
                    Restam apenas <strong className="text-brand-yellow">{diffDays} {diffDays === 1 ? 'dia' : 'dias'}</strong> do seu trial de 14 dias. Assine o Lucro Fácil hoje para blindar suas margens.
                  </p>
                </div>
              </div>
              <button
                id="btn-ver-planos"
                onClick={() => setActiveTab('plans')}
                className="bg-brand-yellow hover:bg-yellow-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-md shrink-0 transition"
              >
                Ver Planos
              </button>
            </div>
          )}
          {renderContent()}
        </div>
        <GlobalFooter />
      </main>
      <FloatingChat activeTab={activeTab} />
      <XandePanel isOpen={showGlobalXande} onClose={() => setShowGlobalXande(false)} />
      <OnboardingModal setActiveTab={setActiveTab} />
    </div>
  );
};

const App: React.FC = () => {
  const { user, profile, loading: authLoading, emulatedUser, setEmulatedUser, clients, signOut, checkAccess, updateProfile } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [storesData, setStoresData] = useState<Record<string, GlobalState>>({});
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  // States and effects for Stone subscription checkout simulations
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatedPlan, setSimulatedPlan] = useState<string | null>(null);
  const [simulatedUserId, setSimulatedUserId] = useState<string | null>(null);
  const [simulatedBillingCycle, setSimulatedBillingCycle] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const simulated = params.get('simulated_checkout');
      const userIdParam = params.get('userId');
      const planParam = params.get('plan');
      const billingCycleParam = params.get('billingCycle');
      const paymentStatus = params.get('payment_status');

      if (simulated === 'true' && userIdParam && planParam) {
        setSimulatedUserId(userIdParam);
        setSimulatedPlan(planParam);
        setSimulatedBillingCycle(billingCycleParam || 'monthly');
        setShowSimulatedModal(true);
      } else if (paymentStatus === 'success') {
        setShowSuccessModal(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const handleConfirmSimulatedPayment = async () => {
    if (!simulatedUserId || !simulatedPlan) return;
    setSimulatingPayment(true);
    try {
      const now = new Date();
      const days = simulatedBillingCycle === 'yearly' ? 365 : 30;
      const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      
      const maxStoresMap: Record<string, number> = {
        starter: 1,
        growth: 5,
        pro: 999
      };
      const maxStores = maxStoresMap[simulatedPlan.toLowerCase()] || 1;

      // Escreve diretamente utilizando a instância autenticada do Firestore no cliente
      const userRef = doc(db, "users", simulatedUserId);
      await setDoc(userRef, {
        plan: simulatedPlan.toLowerCase(),
        status: "active",
        planExpiry: expiryDate,
        maxStores: maxStores
      }, { merge: true });

      if (updateProfile) {
        await updateProfile({
          plan: simulatedPlan as any,
          status: 'active',
          planExpiry: expiryDate,
          maxStores: maxStores
        });
      }

      setShowSimulatedModal(false);
      setShowSuccessModal(true);
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } catch (err: any) {
      console.error("Erro na simulação direta pelo cliente:", err);
      alert(`Falha ao processar simulação de faturamento diretamente no banco: ${err.message || err}`);
    } finally {
      setSimulatingPayment(false);
    }
  };
  
  const [bgColor, setBgColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_bg_color');
      if (saved && BACKGROUND_PALETTE.some(p => p.color === saved)) {
          if ((saved === '#050505' || saved === '#0f172a' || saved === '#1e293b') && !localStorage.getItem('migrated_bg_v5')) {
              localStorage.setItem('migrated_bg_v5', 'true');
              return BACKGROUND_PALETTE[0].color;
          }
          return saved;
      }
      return BACKGROUND_PALETTE[0].color;
    }
    return BACKGROUND_PALETTE[0].color;
  });

  const [sidebarBgColor, setSidebarBgColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_sidebar_bg_color');
      if (saved && BACKGROUND_PALETTE.some(p => p.color === saved)) {
          return saved;
      }
      return '#F8FAFC'; // Default light mode tailwind base color
    }
    return '#F8FAFC';
  });

  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
    }
    return null;
  });

  const [bgPatternEnabled, setBgPatternEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_bg_pattern_v2');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    const selectedPalette = BACKGROUND_PALETTE.find(p => p.color === bgColor) || BACKGROUND_PALETTE[0];
    
    if (selectedPalette.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    root.style.setProperty('--app-bg', bgColor);
    if (bgPatternEnabled) {
      root.style.setProperty('--app-bg-image', 'url("/food_doodle_pattern.png")');
    } else {
      root.style.setProperty('--app-bg-image', 'none');
    }
    localStorage.setItem('app_bg_color', bgColor);
    localStorage.setItem('app_bg_pattern_v2', bgPatternEnabled.toString());
  }, [bgColor, bgPatternEnabled]);

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
  };

  const handleBgPatternToggle = (enabled: boolean) => {
    setBgPatternEnabled(enabled);
  };

  const handleSidebarBgColorChange = (color: string) => {
    setSidebarBgColor(color);
    localStorage.setItem('app_sidebar_bg_color', color);
  };

  const activeUserId = emulatedUser ? emulatedUser.userId : (user ? user.uid : null);

  // Load stores from Firestore when active user ID changes (auth state or emulation changes)
  useEffect(() => {
    if (!activeUserId) return;

    let isMounted = true;
    setShowOfflineFallback(false);

    // Show manual fallback offer after 4 seconds
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setShowOfflineFallback(true);
    }, 4000);

    const loadData = async () => {
      setDbLoading(true);
      try {
        const storesColl = collection(db, 'users', activeUserId, 'stores');
        
        // Wrap getDocs with a 5-second timeout
        const getDocsWithTimeout = (ref: any, ms = 5000) => {
          return Promise.race([
            getDocs(ref),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
          ]);
        };

        const querySnapshot = await getDocsWithTimeout(storesColl) as any;

        if (isMounted) {
          if (!querySnapshot.empty) {
            // Found stores in Firestore
            const loadedStores: StoreInfo[] = [];
            const loadedStoresData: Record<string, GlobalState> = {};
            
            querySnapshot.forEach((docSnap: any) => {
              const data = docSnap.data() as GlobalState;
              const sInfo = data.storeInfo || { id: docSnap.id, name: 'Nova Loja' };
              loadedStores.push(sInfo);
              loadedStoresData[docSnap.id] = sanitizeGlobalState(data);
            });

            setStores(loadedStores);
            setStoresData(loadedStoresData);
            
            // Mirror to localStorage instantly as local cache
            try {
              localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(loadedStores));
              localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(loadedStoresData));
            } catch (storageErr) {
              console.warn("Storage caching went wrong:", storageErr);
            }
          } else {
            // No stores in Firestore for this user. Let's see if they have existing local storage data
            const savedStores = localStorage.getItem(STORAGE_KEY_STORES);
            const savedData = localStorage.getItem(STORAGE_KEY_DATA);

            if (savedStores && savedData) {
              try {
                // Migrate local storage data up to Firestore!
                const localStores = JSON.parse(savedStores) as StoreInfo[];
                const localData = migrateStoresData(JSON.parse(savedData));

                const migratedStores: StoreInfo[] = [];
                const migratedData: Record<string, GlobalState> = {};

                for (const store of localStores) {
                  if (store.id) {
                    const sData = localData[store.id] || { ...EMPTY_STATE, storeInfo: store };
                    const storeRef = doc(db, 'users', activeUserId, 'stores', store.id);
                    await setDoc(storeRef, cleanUndefined({
                      ...sData,
                      userId: activeUserId,
                      updatedAt: new Date().toISOString()
                    }));
                    migratedStores.push(store);
                    migratedData[store.id] = sData;
                  }
                }

                setStores(migratedStores);
                setStoresData(migratedData);
                try {
                  localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(migratedStores));
                  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(migratedData));
                } catch (stErr) {
                  console.warn("Writing storage cache on migrate:", stErr);
                }
                alert("Seus dados anteriores persistidos neste navegador foram sincronizados com sucesso na nuvem cadastrados na sua conta PRO!");
              } catch (migError) {
                console.error("Migration error: ", migError);
                await createDefaultStore();
              }
            } else {
              // Brand new user with no local storage either
              await createDefaultStore();
            }
          }
        }
      } catch (err) {
        console.error("Failed to load stores from Firestore, falling back to local cache:", err);
        if (isMounted) {
          // Attempt offline cache recovery immediately
          const savedStores = localStorage.getItem(STORAGE_KEY_STORES);
          const savedData = localStorage.getItem(STORAGE_KEY_DATA);
          if (savedStores && savedData) {
            try {
              const parsedStores = JSON.parse(savedStores);
              const parsedData = migrateStoresData(JSON.parse(savedData));
              setStores(parsedStores);
              setStoresData(parsedData);
              console.log("Offline cache loaded successfully.");
            } catch (fallbackParseErr) {
              console.error("Failed parsing offline cache:", fallbackParseErr);
              await createDefaultStore();
            }
          } else {
            await createDefaultStore();
          }
        }
      } finally {
        if (isMounted) {
          setDbLoading(false);
          clearTimeout(fallbackTimer);
        }
      }
    };

    const createDefaultStore = async () => {
      const defaultId = '1';
      const defaultStore: StoreInfo = { id: defaultId, name: profile?.defaultStoreName || 'Nova Hamburgueria' };
      
      const isDefaultAdmin = user?.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com';
      const defaultState = {
        ...(isDefaultAdmin ? INITIAL_STATE : EMPTY_STATE),
        storeInfo: defaultStore
      };

      try {
        const storeRef = doc(db, 'users', activeUserId, 'stores', defaultId);
        await setDoc(storeRef, cleanUndefined({
          ...defaultState,
          userId: activeUserId,
          updatedAt: new Date().toISOString()
        }));
        if (isMounted) {
          setStores([defaultStore]);
          setStoresData({ [defaultId]: defaultState });
          try {
            localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify([defaultStore]));
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify({ [defaultId]: defaultState }));
          } catch (stE) {
            console.warn("Storage caching write in default store creation:", stE);
          }
        }
      } catch (error) {
        console.error("Failed to create default initial store in Firestore:", error);
        // Ensure some state is populated even if Firestore completely rejected user writes
        if (isMounted) {
          setStores([defaultStore]);
          setStoresData({ [defaultId]: defaultState });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [activeUserId]);

  // Firestore background real-time synchronization queue (Debounced write)
  const pendingSaveRef = useRef<Record<string, NodeJS.Timeout>>({});

  const handleStateChange = useCallback((newState: GlobalState) => {
    if (!selectedStoreId || !activeUserId) return;

    // React state reflects instantly (fast interface response)
    setStoresData(prev => {
      const nextData = {
        ...prev,
        [selectedStoreId]: newState
      };
      
      // Mirror update instantly to local storage cache
      try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(nextData));
        // Update stores array with latest info as well
        const updatedStores = stores.map(s => s.id === selectedStoreId ? (newState.storeInfo || s) : s);
        localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(updatedStores));
      } catch (storageErr) {
        console.warn("LocalStorage caching sync warning:", storageErr);
      }
      return nextData;
    });

    // Reset pending debounce timeout
    if (pendingSaveRef.current[selectedStoreId]) {
      clearTimeout(pendingSaveRef.current[selectedStoreId]);
    }

    pendingSaveRef.current[selectedStoreId] = setTimeout(async () => {
      try {
        const docRef = doc(db, 'users', activeUserId, 'stores', selectedStoreId);
        await setDoc(docRef, cleanUndefined({
          ...newState,
          userId: activeUserId,
          updatedAt: new Date().toISOString()
        }));
        console.log(`[Firestore Sync] Store ${selectedStoreId} synchronized successfully`);
      } catch (err) {
        console.error(`[Firestore Sync Error] Failed to sync ${selectedStoreId}:`, err);
      }
    }, 1200); // 1.2s keystroke debounce

  }, [selectedStoreId, activeUserId]);

  const handleBackup = () => {
    const cleanStoresData = migrateStoresData(storesData);
    const backupData = {
      version: '3.0',
      date: new Date().toISOString(),
      stores,
      storesData: cleanStoresData
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_LucroFacil_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const nowISO = new Date().toISOString();
    setLastBackupDate(nowISO);
    localStorage.setItem(STORAGE_KEY_LAST_BACKUP, nowISO);
  };

  const handleRestore = async (file: File) => {
    if (!activeUserId) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (parsed.stores && parsed.storesData) {
          if (window.confirm('Isso irá substituir TODOS os dados salvos em nuvem para essa conta. Deseja continuar?')) {
            setDbLoading(true);
            const migrated = migrateStoresData(parsed.storesData);

            // Colocar todos os combos importados na categoria 'Dados Importados'
            Object.keys(migrated).forEach((storeId) => {
              const storeData = migrated[storeId];
              if (storeData && Array.isArray(storeData.combos)) {
                storeData.combos = storeData.combos.map((combo) => ({
                  ...combo,
                  category: 'Dados Importados'
                }));
              }
            });

            // Upload each restore store configuration to Firestore
            for (const store of parsed.stores) {
              if (store.id) {
                const sData = migrated[store.id] || { ...EMPTY_STATE, storeInfo: store };
                const docRef = doc(db, 'users', activeUserId, 'stores', store.id);
                await setDoc(docRef, cleanUndefined({
                  ...sData,
                  userId: activeUserId,
                  updatedAt: new Date().toISOString()
                }));
              }
            }

            setStores(parsed.stores);
            setStoresData(migrated);
            setDbLoading(false);

            alert('Dados restaurados e sincronizados na nuvem com sucesso!');
          }
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo de backup.');
        setDbLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleAddStore = async (store: StoreInfo) => {
    if (!activeUserId) return;
    const newId = Date.now().toString();
    const newStore = { ...store, id: newId };
    
    setDbLoading(true);
    try {
      const storeRef = doc(db, 'users', activeUserId, 'stores', newId);
      const defaultState = { ...EMPTY_STATE, storeInfo: newStore };
      await setDoc(storeRef, cleanUndefined({
        ...defaultState,
        userId: activeUserId,
        updatedAt: new Date().toISOString()
      }));

      setStores([...stores, newStore]);
      setStoresData(prev => ({
        ...prev,
        [newId]: defaultState
      }));
    } catch (e) {
      console.error("Failed to add store to Firestore: ", e);
    } finally {
      setDbLoading(false);
    }
  };

  const handleUpdateStore = async (store: StoreInfo) => {
    if (!activeUserId || !store.id) return;
    setStores(stores.map(s => s.id === store.id ? store : s));
    
    const existingStoreData = storesData[store.id];
    if (existingStoreData) {
      const updatedData = { ...existingStoreData, storeInfo: store };
      setStoresData(prev => ({
        ...prev,
        [store.id!]: updatedData
      }));

      try {
        const docRef = doc(db, 'users', activeUserId, 'stores', store.id);
        await setDoc(docRef, cleanUndefined({
          ...updatedData,
          userId: activeUserId,
          updatedAt: new Date().toISOString()
        }));
      } catch (e) {
        console.error("Failed to update store info in Firestore: ", e);
      }
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!activeUserId) return;
    if (!window.confirm("Você tem certeza que deseja excluir esta loja? Todos os dados em nuvem serão permanentemente removidos.")) return;

    setDbLoading(true);
    try {
      const docRef = doc(db, 'users', activeUserId, 'stores', id);
      await deleteDoc(docRef);

      setStores(prev => prev.filter(s => s.id !== id));
      setStoresData(prev => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
    } catch (e) {
      console.error("Failed to delete store from Firestore: ", e);
    } finally {
      setDbLoading(false);
    }
  };

  const handleReplicate = async (sourceId: string, targetId: string, type: string) => {
    if (!activeUserId) return;
    const source = storesData[sourceId];
    const target = storesData[targetId] || { ...EMPTY_STATE, storeInfo: stores.find(s => s.id === targetId)! };
    
    let newData = { ...target };

    if (type === 'all') {
       newData = { 
         ...source, 
         storeInfo: target.storeInfo 
       };
    } else {
        switch (type) {
            case 'ingredients': newData.ingredients = [...source.ingredients]; break;
            case 'products': newData.products = [...source.products]; break;
            case 'combos': newData.combos = [...source.combos]; break;
            case 'expenses': newData.expenses = [...source.expenses]; break;
            case 'categories': 
                newData.categories = [...source.categories];
                newData.suppliers = [...source.suppliers];
                break;
            case 'cfi': newData.cfi = { ...source.cfi }; break;
            case 'platform': newData.platformConfig = { ...source.platformConfig }; break;
        }
    }

    setDbLoading(true);
    try {
      const docRef = doc(db, 'users', activeUserId, 'stores', targetId);
      await setDoc(docRef, cleanUndefined({
        ...newData,
        userId: activeUserId,
        updatedAt: new Date().toISOString()
      }));

      setStoresData(prev => ({
          ...prev,
          [targetId]: newData
      }));
    } catch (err) {
      console.error("Replication error: ", err);
    } finally {
      setDbLoading(false);
    }
  };

  // 1. Loading Splash Screen while checking authentications and database connection
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Lucro Fácil Pro</p>
          <p className="text-xs text-slate-500">Iniciando ambiente seguro...</p>
        </div>
      </div>
    );
  }

  // 2. Authentication Block
  if (!user) {
    return <AuthScreen />;
  }

  // 2.5 Subscription Expired/Cancelled Interception
  const isDefaultAdmin = user.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com';
  const isExpiredByDate = profile?.planExpiry ? (new Date().getTime() > new Date(profile.planExpiry).getTime()) : false;
  
  if (!isDefaultAdmin && profile?.plan !== 'admin' && (profile?.status === 'expired' || profile?.status === 'cancelled' || isExpiredByDate)) {
    const handleRenew = async (plan: 'starter' | 'growth' | 'pro', maxStores: number) => {
      if (updateProfile) {
        const now = new Date();
        const planExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await updateProfile({
          plan,
          status: 'active',
          planExpiry,
          maxStores
        });
      }
    };
    
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl w-full mx-auto my-auto relative z-10 space-y-8 py-12">
          {/* Main card box */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-slate-800/80 shadow-2xl space-y-8 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/5">
                <span className="text-3xl font-black">⚠️</span>
              </div>
              
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase">
                Acesso Suspenso - <span className="text-amber-500">Blindagem Inativa</span>
              </h1>
              
              <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
                Detectamos que a assinatura do seu restaurante venceu ou não foi identificada. Para continuar utilizando as ferramentas de inteligência do iFood Hits e da Balança de Buffet, clique no botão abaixo para renovar seu plano com total segurança via Stone.
              </p>
            </div>

            {/* Quick Pricing Grid inside the block screen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {[
                { id: 'starter' as const, name: 'Starter', price: 'R$ 29,90/mês', stores: 1, maxStores: 1, desc: '1 Restaurante' },
                { id: 'growth' as const, name: 'Growth', price: 'R$ 49,90/mês', stores: 5, maxStores: 5, desc: 'Até 5 Filiais' },
                { id: 'pro' as const, name: 'Pro', price: 'R$ 59,90/mês', stores: 999, maxStores: 999, desc: 'Filiais Ilimitadas' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleRenew(p.id, p.maxStores)}
                  className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-brand-yellow/50 rounded-2xl p-5 text-left transition duration-200 group relative flex flex-col justify-between h-40"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider group-hover:text-brand-yellow transition-colors">{p.name}</span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Stone ✓</span>
                    </div>
                    <div className="text-xl font-extrabold text-white">{p.price}</div>
                    <p className="text-[11px] text-slate-400">{p.desc}</p>
                  </div>
                  <div className="w-full py-2 bg-slate-900 hover:bg-brand-yellow hover:text-slate-950 text-white font-black text-[10px] uppercase tracking-wider rounded-lg text-center transition-colors">
                    Renovar Agora
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/60 pt-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="text-xs text-slate-500 font-medium">Logado como: <strong className="text-slate-400 font-mono">{user.email}</strong></p>
                  {profile?.planExpiry && (
                    <p className="text-[10px] text-slate-500">Expiração detectada em: {new Date(profile.planExpiry).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => signOut()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition"
                >
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-600">
          Lucro Fácil © 2026 • Ferramenta Universal de Food Service
        </div>
      </div>
    );
  }

  // 3. Database Syncing Splash
  if (dbLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center space-y-5 max-w-sm px-6">
          <Loader className="h-10 w-10 text-brand-red animate-spin mx-auto animate-reverse-spin" />
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-widest text-slate-300">Sincronizando Nuvem</p>
            <p className="text-xs text-slate-500">Conectando ao banco e carregando fichas técnicas...</p>
          </div>
          
          {showOfflineFallback && (
            <div className="pt-2 animate-fade-in">
              <button
                onClick={() => {
                  const savedStores = localStorage.getItem(STORAGE_KEY_STORES);
                  const savedData = localStorage.getItem(STORAGE_KEY_DATA);
                  if (savedStores && savedData) {
                    try {
                      setStores(JSON.parse(savedStores));
                      setStoresData(migrateStoresData(JSON.parse(savedData)));
                      console.log("Recovered store data via user request.");
                    } catch (e) {
                      setStores([{ id: '1', name: 'Hamburgueria Local' }]);
                      setStoresData({ '1': { ...EMPTY_STATE, storeInfo: { id: '1', name: 'Hamburgueria Local' } } });
                    }
                  } else {
                    setStores([{ id: '1', name: 'Hamburgueria Local' }]);
                    setStoresData({ '1': { ...EMPTY_STATE, storeInfo: { id: '1', name: 'Hamburgueria Local' } } });
                  }
                  setDbLoading(false);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl border border-slate-800 transition text-[10px] uppercase tracking-wider mx-auto"
              >
                Entrar em Modo Offline (Carregar Cache)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const selectedStoreInfo = stores.find(s => s.id === selectedStoreId);
  const currentStoreData = selectedStoreId 
    ? (storesData[selectedStoreId] || { ...EMPTY_STATE, storeInfo: selectedStoreInfo! })
    : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      {/* PROFESSIONAL ADMIN HUD EMULATOR FLOATING BAR */}
      {profile?.role === 'admin' && (
        <div className="fixed top-0 left-0 w-full z-50 group transition-transform duration-300 -translate-y-full hover:translate-y-0">
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white text-xs px-6 py-3 font-semibold flex items-center justify-between border-b border-red-850 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-brand-red animate-ping" />
              <span className="flex items-center gap-1 uppercase tracking-wide text-[10px] font-black text-brand-red bg-brand-red/10 border border-brand-red/30 px-2 py-0.5 rounded-full">
                <Shield className="h-3 w-3" /> ADMIN HUD
              </span>
              <span className="text-slate-400 hidden sm:inline">| Logado como: <strong className="text-white">{user.email}</strong></span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Painel Cliente:</label>
                <select
                  value={emulatedUser?.userId || ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) {
                      setEmulatedUser(null);
                    } else {
                      const found = clients.find(c => c.userId === val);
                      if (found) {
                        setEmulatedUser({ userId: found.userId, email: found.email });
                        setSelectedStoreId(null); // Return to client store selector
                      }
                    }
                  }}
                  className="bg-transparent border-none text-white focus:outline-none text-xs font-bold cursor-pointer pr-4"
                >
                  <option value="" className="bg-slate-900 text-slate-400 font-bold">-- Minha Conta Própria --</option>
                  {clients.map(c => (
                    <option key={c.userId} value={c.userId} className="bg-slate-900 text-white font-bold">
                      {c.email} {c.userId === user.uid ? '(Sua)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {emulatedUser && (
                <button
                  onClick={() => {
                    setEmulatedUser(null);
                    setSelectedStoreId(null);
                  }}
                  className="flex items-center gap-1 bg-brand-red hover:bg-[#B30321] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition duration-150"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Voltar
                </button>
              )}

              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition duration-150"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          </div>
          {/* Dropdown Handle */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-red-950 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-b-xl border-b border-l border-r border-red-800 flex items-center gap-1.5 shadow-xl cursor-pointer group-hover:opacity-0 transition-opacity">
            <Shield className="h-3 w-3 text-brand-red" /> ADMIN HUD
          </div>
        </div>
      )}

      {/* RENDER CHANNELS */}
      {!selectedStoreId ? (
        <div className="flex flex-col min-h-screen">
          {/* If not Admin, let user have their own signout in StoreSelector header */}
          {profile?.role !== 'admin' && (
            <div className="bg-slate-950 text-white py-4 px-8 border-b border-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-brand-red/10 border border-brand-red/35 px-2.5 py-0.5 rounded text-brand-red">Fidelidade</span>
                <span className="text-xs text-slate-400 font-bold">PRO {user.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          )}

          <div className="flex-1">
            <StoreList 
              stores={stores}
              onSelectStore={(id) => setSelectedStoreId(id)} 
              onAddStore={handleAddStore}
              onUpdateStore={handleUpdateStore}
              onDeleteStore={handleDeleteStore}
              onReplicate={handleReplicate}
              bgPatternEnabled={bgPatternEnabled}
              onBgPatternToggle={handleBgPatternToggle}
            />
          </div>
          <div className="bg-[var(--app-bg)] transition-colors duration-500">
            <GlobalFooter />
          </div>
          <UpdateNotification />
        </div>
      ) : (
        <AppProvider 
          storeId={selectedStoreId} 
          initialData={currentStoreData}
          onStateChange={handleStateChange}
        >
          {/* Standard Sign out inside AppContent if they are client */}
          <AppContent 
            onLogout={() => setSelectedStoreId(null)} 
            bgColor={bgColor}
            onBgColorChange={handleBgColorChange}
            bgPatternEnabled={bgPatternEnabled}
            onBgPatternToggle={handleBgPatternToggle}
            sidebarBgColor={sidebarBgColor}
            onSidebarBgColorChange={handleSidebarBgColorChange}
            onBackup={handleBackup}
            onRestore={handleRestore}
            lastBackupDate={lastBackupDate}
          />
          <UpdateNotification />
        </AppProvider>
      )}

      {/* MODALS PARA PAGAMENTO E SIMULAÇÃO STONE */}
      {showSimulatedModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-white">Ambiente de Teste Stone</h3>
              <p className="text-xs text-slate-400">
                O <code className="bg-slate-950 px-1.5 py-0.5 rounded text-red-400 font-mono">STONE_SECRET_KEY</code> não está configurado. O sistema ativou o fluxo de simulação de assinatura.
              </p>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Usuário:</span>
                <span className="text-slate-300 font-mono font-bold">{simulatedUserId?.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plano Escolhido:</span>
                <span className="text-brand-yellow font-bold uppercase">{simulatedPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Estimado:</span>
                <span className="text-white font-bold">
                  {simulatedBillingCycle === 'yearly' ? (
                    <>
                      {simulatedPlan === 'starter' ? 'R$ 299,00' : simulatedPlan === 'growth' ? 'R$ 499,00' : 'R$ 599,00'} / ano
                    </>
                  ) : (
                    <>
                      {simulatedPlan === 'starter' ? 'R$ 29,90' : simulatedPlan === 'growth' ? 'R$ 49,90' : 'R$ 59,90'} / mês
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSimulatedModal(false);
                  const newUrl = window.location.pathname;
                  window.history.replaceState({}, document.title, newUrl);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSimulatedPayment}
                disabled={simulatingPayment}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
              >
                {simulatingPayment ? (
                  <>
                    <Loader className="animate-spin text-slate-950" size={14} /> Ativando...
                  </>
                ) : (
                  'Aprovar Teste'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-yellow/30 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-yellow/15 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="mx-auto w-14 h-14 bg-brand-yellow/10 border border-brand-yellow/40 text-brand-yellow rounded-full flex items-center justify-center animate-bounce">
              <ShieldCheck size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white tracking-tight">Assinatura Ativada com Sucesso!</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parabéns! Sua conta foi atualizada com sucesso. Agora suas margens estão blindadas e seu faturamento está pronto para decolar!
              </p>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 text-xs text-left space-y-2.5">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-brand-yellow font-bold">✓</span>
                <span>Acesso total ilimitado liberado</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-brand-yellow font-bold">✓</span>
                <span>Consultor Financeiro Xande ativo</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-brand-yellow font-bold">✓</span>
                <span>Sincronização em nuvem robusta</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
              }}
              className="w-full py-4 bg-brand-yellow hover:bg-yellow-400 text-slate-950 transition rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-yellow/15"
            >
              Começar a Lucrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
