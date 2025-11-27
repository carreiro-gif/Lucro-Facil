import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Receipt, 
  DollarSign, 
  Dna, 
  Beef, 
  UtensilsCrossed, 
  ScrollText, 
  Calculator, 
  ShoppingBag, 
  Tags,
  LogOut,
  Settings,
  Upload,
  X,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expenses', label: 'Despesas Fixas', icon: Receipt },
  { id: 'categories', label: 'Categorias', icon: Tags },
  { id: 'billing', label: 'Faturamento', icon: DollarSign },
  { id: 'dna', label: 'CFI da Empresa', icon: Dna },
  { id: 'ingredients', label: 'Insumos', icon: Beef },
  { id: 'products', label: 'Cardápio & Ficha', icon: UtensilsCrossed },
  { id: 'pricing', label: 'Preço de Venda', icon: Calculator },
  { id: 'profit', label: 'Lucro Atual', icon: ScrollText },
  { id: 'combos', label: 'Combos', icon: ShoppingBag },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, toggleTheme, isDark }) => {
  const { storeInfo, updateStoreInfo } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Local state for editing
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openSettings = () => {
    setEditName(storeInfo.name);
    setEditAddress(storeInfo.address || '');
    setEditLogo(storeInfo.logo || '');
    setIsSettingsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreInfo({
      name: editName,
      address: editAddress,
      logo: editLogo
    });
    setIsSettingsOpen(false);
  };

  return (
    <>
      <div className="w-64 bg-white dark:bg-brand-dark border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-10 overflow-y-auto transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
            {storeInfo.logo ? (
               <img src={storeInfo.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
               <UtensilsCrossed className="text-brand-red w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
             <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">{storeInfo.name}</h1>
             <button onClick={openSettings} className="text-[10px] text-gray-500 hover:text-brand-red flex items-center gap-1 transition-colors mt-0.5 font-bold uppercase">
               <Settings size={10} /> Configurar
             </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-red text-white shadow-lg shadow-red-900/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Tema</span>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-brand-red transition-colors"
                title="Alternar Tema"
              >
                 {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
          </div>

          {onLogout && (
              <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
              >
                  <LogOut size={20} />
                  <span className="font-medium">Trocar Loja</span>
              </button>
          )}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500 text-center">
            v1.3.1 • Lucro Fácil App
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings size={20} className="text-brand-red" /> Dados da Loja
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                </div>
                <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                    <div className="flex justify-center mb-6">
                        <div 
                            className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-brand-red hover:bg-gray-200 dark:hover:bg-gray-700 transition relative overflow-hidden group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {editLogo ? (
                                <img src={editLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <Upload size={20} className="mx-auto mb-1" />
                                    <span className="text-[10px] uppercase font-bold">Logo</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs text-white font-bold">
                                Alterar
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Nome da Loja</label>
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Endereço</label>
                        <input 
                            type="text" 
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-brand-red text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-900/20">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;