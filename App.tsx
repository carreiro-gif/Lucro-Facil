
import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
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
import Help from './pages/Help';
import ShoppingList from './pages/ShoppingList';
import BreakEven from './pages/BreakEven';
import { UpdateNotification } from './components/UpdateNotification';
import { StoreInfo, GlobalState, Ingredient, Product, Expense, MonthlyData, CfiConfig, PlatformConfig, Category, Supplier, MenuCategory, Combo, FixedCostMode } from './types';
import { INITIAL_STATE, EMPTY_STATE, BACKGROUND_PALETTE, INITIAL_MENU_CATEGORIES } from './constants';

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
        lossPercent: fixPercent(i.lossPercent)
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
        description: e.description || '',
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
    ? safeData.monthlyRevenue.map((m: any) => ({
        month: m.month || '',
        revenue: fixMoney(m.revenue)
    }))
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
        items: Array.isArray(c.items) ? c.items.map((it: any) => ({ productId: it.productId, quantity: Number(it.quantity) })) : [],
        profitMargin: fixPercent(c.profitMargin),
        ifoodFee: fixPercent(c.ifoodFee),
        food99Fee: fixPercent(c.food99Fee),
        delivery: fixMoney(c.delivery),
        coupon: fixMoney(c.coupon)
    }))
    : [];

  const fixedCostMode: FixedCostMode = safeData.fixedCostMode === 'CURRENT_MONTH' ? 'CURRENT_MONTH' : 'AVERAGE';

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
      fixedCostMode
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
// --- END MIGRATION UTILS ---

interface AppContentProps {
  onLogout: () => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  lastBackupDate: string | null;
}

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

const AppContent: React.FC<AppContentProps> = ({ onLogout, bgColor, onBgColorChange, onBackup, onRestore, lastBackupDate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

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
      case 'combos': return <Combos />;
      case 'break-even': return <BreakEven />;
      case 'help': return <Help />;
      case 'shopping-list': return <ShoppingList />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen transition-colors duration-500">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        bgColor={bgColor}
        onBgColorChange={onBgColorChange}
        onBackup={onBackup}
        onRestore={onRestore}
        lastBackupDate={lastBackupDate}
      />
      <main className="flex-1 ml-64 p-8 flex flex-col">
        <div className="flex-1">
          {renderContent()}
        </div>
        <GlobalFooter />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  
  const [bgColor, setBgColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_bg_color') || BACKGROUND_PALETTE[0].color;
    }
    return BACKGROUND_PALETTE[0].color;
  });

  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
    }
    return null;
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
    localStorage.setItem('app_bg_color', bgColor);
  }, [bgColor]);

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
  };

  const [stores, setStores] = useState<StoreInfo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STORES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load stores from local storage');
    }
    return [
      { id: '1', name: 'Matriz - Centro', address: 'Rua das Flores, 123' },
      { id: '2', name: 'Filial - Shopping', address: 'Av. Paulista, 1000' },
    ];
  });

  const [storesData, setStoresData] = useState<Record<string, GlobalState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Apply migration on load to ensure data is correct
        return migrateStoresData(parsedData);
      }
    } catch (e) {
      console.error('Failed to load data from local storage');
    }
    return {
      '1': INITIAL_STATE,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(stores));
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(storesData));
    } catch (e) {
      console.error('Failed to auto-save to local storage', e);
    }
  }, [stores, storesData]);

  const handleBackup = () => {
    // FORCE SANITIZATION BEFORE BACKUP
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

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (parsed.stores && parsed.storesData) {
          if (window.confirm('Isso irá substituir TODOS os dados atuais pelos dados do backup. Deseja continuar?')) {
            // Migrar e sanitizar dados do backup antes de setar no estado
            const migratedStoresData = migrateStoresData(parsed.storesData);
            
            // 1. Update State (to reflect immediately in UI if reload is delayed)
            setStores(parsed.stores);
            setStoresData(migratedStoresData);
            
            // 2. CRITICAL: Force save to LocalStorage immediately to avoid race condition with reload
            try {
                localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(parsed.stores));
                localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(migratedStoresData));
                
                const nowISO = new Date().toISOString();
                setLastBackupDate(nowISO);
                localStorage.setItem(STORAGE_KEY_LAST_BACKUP, nowISO);
                
                alert('Dados restaurados e higienizados com sucesso! O sistema será reiniciado.');
                window.location.reload();
            } catch (storageError) {
                console.error('Falha ao salvar no LocalStorage', storageError);
                alert('Erro crítico ao salvar dados. Verifique o espaço disponível.');
            }
          }
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddStore = (store: StoreInfo) => {
    const newId = Date.now().toString();
    const newStore = { ...store, id: newId };
    setStores([...stores, newStore]);
    
    setStoresData(prev => ({
      ...prev,
      [newId]: { ...EMPTY_STATE, storeInfo: newStore }
    }));
  };

  const handleUpdateStore = (store: StoreInfo) => {
    setStores(stores.map(s => s.id === store.id ? store : s));
    if (store.id && storesData[store.id]) {
      setStoresData(prev => ({
        ...prev,
        [store.id!]: { ...prev[store.id!], storeInfo: store }
      }));
    }
  };

  const handleDeleteStore = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
    setStoresData(prev => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
  };

  const handleStateChange = useCallback((newState: GlobalState) => {
    if (selectedStoreId) {
      setStoresData(prev => ({
        ...prev,
        [selectedStoreId]: newState
      }));
    }
  }, [selectedStoreId]);

  const handleReplicate = (sourceId: string, targetId: string, type: string) => {
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

    setStoresData(prev => ({
        ...prev,
        [targetId]: newData
    }));
  };

  const selectedStoreInfo = stores.find(s => s.id === selectedStoreId);
  const currentStoreData = selectedStoreId 
    ? (storesData[selectedStoreId] || { ...EMPTY_STATE, storeInfo: selectedStoreInfo! })
    : undefined;

  if (!selectedStoreId) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <StoreList 
            stores={stores}
            onSelectStore={(id) => setSelectedStoreId(id)} 
            onAddStore={handleAddStore}
            onUpdateStore={handleUpdateStore}
            onDeleteStore={handleDeleteStore}
            onReplicate={handleReplicate}
          />
        </div>
        <div className="bg-[var(--app-bg)] transition-colors duration-500">
          <GlobalFooter />
        </div>
        <UpdateNotification />
      </div>
    );
  }

  return (
    <AppProvider 
      storeId={selectedStoreId} 
      initialData={currentStoreData}
      onStateChange={handleStateChange}
    >
      <AppContent 
        onLogout={() => setSelectedStoreId(null)} 
        bgColor={bgColor}
        onBgColorChange={handleBgColorChange}
        onBackup={handleBackup}
        onRestore={handleRestore}
        lastBackupDate={lastBackupDate}
      />
      <UpdateNotification />
    </AppProvider>
  );
};

export default App;
