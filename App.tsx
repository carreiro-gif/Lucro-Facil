
import React, { useState, useEffect, useLayoutEffect } from 'react';
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
import { StoreInfo, GlobalState } from './types';
import { INITIAL_STATE, EMPTY_STATE, BACKGROUND_PALETTE } from './constants';

const STORAGE_KEY_DATA = 'lucro_facil_pro_data_v3';
const STORAGE_KEY_STORES = 'lucro_facil_pro_stores_v3';
const STORAGE_KEY_LAST_BACKUP = 'lucro_facil_last_backup_date';

interface AppContentProps {
  onLogout: () => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  lastBackupDate: string | null;
}

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
      case 'help': return <Help />;
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
      <main className="flex-1 ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  
  // Custom Background Management
  const [bgColor, setBgColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_bg_color') || BACKGROUND_PALETTE[0].color;
    }
    return BACKGROUND_PALETTE[0].color;
  });

  // Backup Date Tracking
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

  // -- STATE INITIALIZATION WITH PERSISTENCE --
  
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
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load data from local storage');
    }
    return {
      '1': INITIAL_STATE,
    };
  });

  // -- AUTO SAVE EFFECT --
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(stores));
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(storesData));
    } catch (e) {
      console.error('Failed to auto-save to local storage', e);
    }
  }, [stores, storesData]);

  // -- BACKUP & RESTORE FUNCTIONS --

  const handleBackup = () => {
    const backupData = {
      version: '3.0',
      date: new Date().toISOString(),
      stores,
      storesData
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

    // Update Last Backup Date
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
            setStores(parsed.stores);
            setStoresData(parsed.storesData);
            alert('Dados restaurados com sucesso!');
            
            // Update backup date on restore too, assuming the restored data is now the "safe" point
            const nowISO = new Date().toISOString();
            setLastBackupDate(nowISO);
            localStorage.setItem(STORAGE_KEY_LAST_BACKUP, nowISO);
            
            window.location.reload(); // Reload to ensure clean state
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

  // -- STORE MANAGEMENT HANDLERS --

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

  const handleStateChange = (newState: GlobalState) => {
    if (selectedStoreId) {
      setStoresData(prev => ({
        ...prev,
        [selectedStoreId]: newState
      }));
    }
  };

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
      <StoreList 
        stores={stores}
        onSelectStore={(id) => setSelectedStoreId(id)} 
        onAddStore={handleAddStore}
        onUpdateStore={handleUpdateStore}
        onDeleteStore={handleDeleteStore}
        onReplicate={handleReplicate}
      />
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
    </AppProvider>
  );
};

export default App;
