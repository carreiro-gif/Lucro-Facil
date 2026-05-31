
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
import { UpdateNotification } from './components/UpdateNotification';
import { StoreInfo, GlobalState, Ingredient, Product, Expense, MonthlyData, CfiConfig, PlatformConfig, Category, Supplier, MenuCategory, Combo, FixedCostMode } from './types';
import { INITIAL_STATE, EMPTY_STATE, BACKGROUND_PALETTE, INITIAL_MENU_CATEGORIES, INITIAL_INGREDIENT_CATEGORIES } from './constants';
import backupData from './backup_data.json';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { AuthScreen } from './components/AuthScreen';
import { LogOut, Users, Shield, ArrowLeftRight, Loader, Menu } from 'lucide-react';

const STORAGE_KEY_DATA = 'lucro_facil_pro_data_v3';
const STORAGE_KEY_STORES = 'lucro_facil_pro_stores_v3';
const STORAGE_KEY_LAST_BACKUP = 'lucro_facil_last_backup_date';

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

  useEffect(() => {
    const handleOpenXande = () => setShowGlobalXande(true);
    window.addEventListener('open-global-xande', handleOpenXande);
    return () => window.removeEventListener('open-global-xande', handleOpenXande);
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
      help: 'Central de Ajuda'
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
          {renderContent()}
        </div>
        <GlobalFooter />
      </main>
      <FloatingChat activeTab={activeTab} />
      <XandePanel isOpen={showGlobalXande} onClose={() => setShowGlobalXande(false)} />
    </div>
  );
};

const App: React.FC = () => {
  const { user, profile, loading: authLoading, emulatedUser, setEmulatedUser, clients, signOut } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [storesData, setStoresData] = useState<Record<string, GlobalState>>({});
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);
  
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
    </div>
  );
};

export default App;
