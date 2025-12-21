import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback
} from 'react';

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

import { StoreInfo, GlobalState } from './types';
import { INITIAL_STATE, EMPTY_STATE, BACKGROUND_PALETTE } from './constants';
import { migrateStoredData, VersionedData } from './services/dataMigration';

const STORAGE_KEY_DATA = 'lucro_facil_pro_data_v3';
const STORAGE_KEY_STORES = 'lucro_facil_pro_stores_v3';
const STORAGE_KEY_LAST_BACKUP = 'lucro_facil_last_backup_date';

const GlobalFooter: React.FC = () => (
  <div className="w-full py-5 flex flex-col items-center border-t border-gray-200/30 dark:border-gray-800/30 mt-5">
    <div className="text-[10px] font-bold text-gray-400 uppercase">
      ⚡ Carreiro | Apps
    </div>
    <div className="text-[8px] font-bold text-gray-500 uppercase opacity-60">
      PRO Gestão
    </div>
  </div>
);

const AppContent: React.FC<any> = ({
  onLogout,
  bgColor,
  onBgColorChange,
  onBackup,
  onRestore,
  lastBackupDate
}) => {
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
      case 'shopping-list': return <ShoppingList />;
      case 'help': return <Help />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen">
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
        <div className="flex-1">{renderContent()}</div>
        <GlobalFooter />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const [bgColor, setBgColor] = useState(
    localStorage.getItem('app_bg_color') || BACKGROUND_PALETTE[0].color
  );

  const [lastBackupDate, setLastBackupDate] = useState(
    localStorage.getItem(STORAGE_KEY_LAST_BACKUP)
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    const palette = BACKGROUND_PALETTE.find(p => p.color === bgColor);
    root.classList.toggle('dark', palette?.mode === 'dark');
    root.style.setProperty('--app-bg', bgColor);
    localStorage.setItem('app_bg_color', bgColor);
  }, [bgColor]);

  const [stores, setStores] = useState<StoreInfo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STORES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [storesData, setStoresData] = useState<Record<string, GlobalState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (!saved) return { '1': INITIAL_STATE };

      const parsed = JSON.parse(saved);
      const migrated = migrateStoredData(parsed);
      return migrated.data;
    } catch {
      return { '1': INITIAL_STATE };
    }
  });

  useEffect(() => {
    const payload: VersionedData = {
      version: '3.0',
      data: storesData
    };
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(payload));
    localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(stores));
  }, [stores, storesData]);

  const handleBackup = () => {
    const backup = {
      version: '3.0',
      date: new Date().toISOString(),
      stores,
      storesData
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Backup_LucroFacil_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    const now = new Date().toISOString();
    setLastBackupDate(now);
    localStorage.setItem(STORAGE_KEY_LAST_BACKUP, now);
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed?.stores || !parsed?.storesData) {
          alert('Backup inválido.');
          return;
        }

        if (window.confirm('Restaurar este backup substituirá todos os dados atuais.')) {
          setStores(parsed.stores);
          setStoresData(parsed.storesData);
          alert('Backup restaurado com sucesso.');
          window.location.reload();
        }
      } catch {
        alert('Erro ao restaurar backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleStateChange = useCallback((state: GlobalState) => {
    if (!selectedStoreId) return;
    setStoresData(prev => ({ ...prev, [selectedStoreId]: state }));
  }, [selectedStoreId]);

  if (!selectedStoreId) {
    return (
      <StoreList
        stores={stores}
        onSelectStore={setSelectedStoreId}
        onAddStore={store => {
          const id = Date.now().toString();
          setStores([...stores, { ...store, id }]);
          setStoresData(prev => ({
            ...prev,
            [id]: { ...EMPTY_STATE, storeInfo: store }
          }));
        }}
        onUpdateStore={store =>
          setStores(stores.map(s => s.id === store.id ? store : s))
        }
        onDeleteStore={id => {
          setStores(stores.filter(s => s.id !== id));
          setStoresData(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }}
        onReplicate={() => {}}
      />
    );
  }

  return (
    <AppProvider
      storeId={selectedStoreId}
      initialData={storesData[selectedStoreId]}
      onStateChange={handleStateChange}
    >
      <AppContent
        onLogout={() => setSelectedStoreId(null)}
        bgColor={bgColor}
        onBgColorChange={setBgColor}
        onBackup={handleBackup}
        onRestore={handleRestore}
        lastBackupDate={lastBackupDate}
      />
    </AppProvider>
  );
};

export default App;
