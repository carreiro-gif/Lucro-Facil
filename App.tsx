
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
import { StoreInfo, GlobalState } from './types';
import { INITIAL_STATE, EMPTY_STATE, BACKGROUND_PALETTE } from './constants';

const STORAGE_KEY_DATA = 'lucro_facil_pro_data_v3';
const STORAGE_KEY_STORES = 'lucro_facil_pro_stores_v3';
const STORAGE_KEY_LAST_BACKUP = 'lucro_facil_last_backup_date';

// --- MIGRATION UTILS ---
const fixMoney = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // 1. Remove R$, spaces, and thousands separators (dots)
    // 2. Replace decimal comma with dot
    // Ex: "R$ 1.500,50" -> "1500.50"
    // Ex: "15.438,23" -> "15438.23"
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

const migrateGlobalState = (state: GlobalState): GlobalState => {
  if (!state) return state;
  const newState = JSON.parse(JSON.stringify(state)); // Deep clone

  // 1. Fix Monthly Revenue
  if (Array.isArray(newState.monthlyRevenue)) {
    newState.monthlyRevenue = newState.monthlyRevenue.map((m: any) => ({
      ...m,
      revenue: fixMoney(m.revenue)
    }));
  }

  // 2. Fix Expenses
  if (Array.isArray(newState.expenses)) {
    newState.expenses = newState.expenses.map((e: any) => ({
      ...e,
      value: fixMoney(e.value)
    }));
  }

  // 3. Fix Ingredients
  if (Array.isArray(newState.ingredients)) {
    newState.ingredients = newState.ingredients.map((i: any) => ({
      ...i,
      price: fixMoney(i.price),
      lossPercent: fixPercent(i.lossPercent)
    }));
  }

  // 4. Fix Products
  if (Array.isArray(newState.products)) {
    newState.products = newState.products.map((p: any) => {
      if (p.fixedPriceStore) p.fixedPriceStore = fixMoney(p.fixedPriceStore);
      if (p.pricing) {
         if (p.pricing.profitMargin !== undefined) p.pricing.profitMargin = fixPercent(p.pricing.profitMargin);
         
         // Platform specifics
         ['ifood', 'food99', 'keeta'].forEach(platform => {
             if (p.pricing[platform]) {
                 ['fee', 'onlinePayment', 'anticipation', 'delivery', 'ciValue', 'coupon'].forEach(field => {
                     if (p.pricing[platform][field] !== undefined) {
                         p.pricing[platform][field] = field === 'fee' || field === 'onlinePayment' || field === 'anticipation' 
                            ? fixPercent(p.pricing[platform][field])
                            : fixMoney(p.pricing[platform][field]);
                     }
                 });
             }
         });
      }
      return p;
    });
  }

  // 5. Fix CFI
  if (newState.cfi) {
    Object.keys(newState.cfi).forEach((k: any) => {
      newState.cfi[k] = fixPercent(newState.cfi[k]);
    });
  }

  // 6. Fix Combos
  if (Array.isArray(newState.combos)) {
     newState.combos = newState.combos.map((c: any) => ({
         ...c,
         profitMargin: fixPercent(c.profitMargin),
         ifoodFee: fixPercent(c.ifoodFee),
         food99Fee: fixPercent(c.food99Fee),
         delivery: fixMoney(c.delivery),
         coupon: fixMoney(c.coupon)
     }));
  }

  // 7. Platform Global Config
  if (newState.platformConfig) {
      ['ifood', 'food99', 'keeta'].forEach((platform: string) => {
          // @ts-ignore
          if (newState.platformConfig[platform]) {
              // @ts-ignore
              Object.keys(newState.platformConfig[platform]).forEach(k => {
                  // @ts-ignore
                  const val = newState.platformConfig[platform][k];
                  // @ts-ignore
                  newState.platformConfig[platform][k] = (k === 'delivery' || k === 'ciValue') ? fixMoney(val) : fixPercent(val);
              });
          }
      });
  }

  return newState;
};

const migrateStoresData = (data: Record<string, GlobalState>): Record<string, GlobalState> => {
  const migrated: Record<string, GlobalState> = {};
  Object.keys(data).forEach(key => {
    if (data[key]) {
      migrated[key] = migrateGlobalState(data[key]);
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
    const backupData = {
      version: '3.0',
      date: new Date().toISOString(),
      stores,
      storesData // Data is already migrated in state, so backup is clean
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
            // Migrar dados do backup antes de setar no estado
            const migratedStoresData = migrateStoresData(parsed.storesData);
            
            setStores(parsed.stores);
            setStoresData(migratedStoresData);
            alert('Dados restaurados com sucesso! Migração aplicada.');
            
            const nowISO = new Date().toISOString();
            setLastBackupDate(nowISO);
            localStorage.setItem(STORAGE_KEY_LAST_BACKUP, nowISO);
            
            window.location.reload();
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
