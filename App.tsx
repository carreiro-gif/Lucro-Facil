
import React, { useState, useEffect } from 'react';
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
import { StoreInfo, GlobalState } from './types';
import { INITIAL_STATE, EMPTY_STATE } from './constants';

// ✅ Import do SafeChartContainer
import { SafeChartContainer } from './components/SafeChartContainer';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface AppContentProps {
  onLogout: () => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const AppContent: React.FC<AppContentProps> = ({ onLogout, toggleTheme, isDark }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // ✅ Exemplo de dados para o gráfico
  const chartData = [
    { x: 'Jan', y: 400 },
    { x: 'Feb', y: 300 },
    { x: 'Mar', y: 500 },
  ];

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
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#161616] transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} toggleTheme={toggleTheme} isDark={isDark} />
      <main className="flex-1 ml-64 p-8">
        {renderContent()}

        {/* ✅ Gráfico seguro */}
        <div className="mt-8">
          <SafeChartContainer height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </SafeChartContainer>
        </div>

        {/* ✅ Botão para testar Firebase */}
        <div className="mt-8">
          <button
            className="bg-brand-red text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={() => (window as any).testeFirebase()}
          >
            Testar Firebase
          </button>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Theme Management
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // -- CENTRALIZED DATA MANAGEMENT --
  const [storesData, setStoresData] = useState<Record<string, GlobalState>>({
    '1': INITIAL_STATE,
  });

  const [stores, setStores] = useState<StoreInfo[]>([
    { id: '1', name: 'Matriz - Centro', address: 'Rua das Flores, 123' },
    { id: '2', name: 'Filial - Shopping', address: 'Av. Paulista, 1000' },
  ]);

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
        toggleTheme={toggleTheme}
        isDark={theme === 'dark'}
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
        toggleTheme={toggleTheme}
        isDark={theme === 'dark'}
      />
    </AppProvider>
  );
};

export default App;
