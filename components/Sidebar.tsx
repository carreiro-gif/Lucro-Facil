
import React, { useState, useRef, useEffect } from 'react';
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
  Palette,
  RotateCcw,
  HelpCircle,
  Download,
  Cloud,
  CheckCircle,
  HardDrive,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { BACKGROUND_PALETTE } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  lastBackupDate: string | null;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expenses', label: 'Despesas Fixas', icon: Receipt },
  { id: 'categories', label: 'Categorias', icon: Tags },
  { id: 'billing', label: 'Faturamento', icon: DollarSign },
  { id: 'dna', label: 'CFI da Empresa', icon: Dna },
  { id: 'ingredients', label: 'Insumos', icon: Beef },
  { id: 'products', label: 'Ficha Técnica (CMV)', icon: UtensilsCrossed },
  { id: 'pricing', label: 'Preço de Venda', icon: Calculator },
  { id: 'profit', label: 'Lucro Atual', icon: ScrollText },
  { id: 'combos', label: 'Combos', icon: ShoppingBag },
  { id: 'help', label: 'Central de Ajuda', icon: HelpCircle },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  bgColor,
  onBgColorChange,
  onBackup,
  onRestore,
  lastBackupDate
}) => {
  const { storeInfo, updateStoreInfo } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  
  // Local state for editing
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Fake auto-save timer update
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 30000);
    const now = new Date();
    setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    return () => clearInterval(interval);
  }, []);

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

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        onRestore(file);
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

  // --- BACKUP SEMAPHORE LOGIC ---
  const getBackupStatus = () => {
    if (!lastBackupDate) return { 
        status: 'critical', 
        label: 'Risco! Nunca feito', 
        color: 'text-red-600 dark:text-red-400', 
        bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
        icon: AlertTriangle
    };

    const diff = new Date().getTime() - new Date(lastBackupDate).getTime();
    const days = diff / (1000 * 60 * 60 * 24);

    if (days > 7) return { 
        status: 'critical', 
        label: `Atrasado há ${Math.floor(days)} dias`, 
        color: 'text-red-600 dark:text-red-400', 
        bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
        icon: AlertTriangle
    };
    
    if (days > 3) return { 
        status: 'warning', 
        label: 'Backup Antigo (>3d)', 
        color: 'text-amber-600 dark:text-amber-400', 
        bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
        icon: AlertTriangle
    };

    return { 
        status: 'safe', 
        label: 'Backup em Dia', 
        color: 'text-emerald-600 dark:text-emerald-400', 
        bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
        icon: ShieldCheck
    };
  };

  const backupStatus = getBackupStatus();
  const BackupIcon = backupStatus.icon;

  return (
    <>
      <div 
        className="w-64 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-10 overflow-y-auto transition-colors duration-300 shadow-xl"
        style={{ backgroundColor: bgColor }}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/50 dark:bg-black/20 rounded-lg flex items-center justify-center shadow-lg overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
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
                    : 'text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            
            {/* BACKUP STATUS CARD (NEW) */}
            <div className={`rounded-xl p-3 border ${backupStatus.bg} transition-colors duration-300 relative group`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-extrabold uppercase flex items-center gap-1.5 ${backupStatus.color}`}>
                        <BackupIcon size={12} /> {backupStatus.label}
                    </span>
                    <div className="flex items-center gap-1">
                        <Cloud size={10} className="text-gray-400" />
                        <span className="text-[9px] text-gray-500">Auto: {lastSaved}</span>
                    </div>
                </div>
                
                <button 
                    onClick={onBackup}
                    className="w-full bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/40 text-gray-700 dark:text-gray-200 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 transition-all shadow-sm"
                >
                    <Download size={12} /> FAZER BACKUP
                </button>
                
                <div className="text-[9px] text-gray-500 dark:text-gray-400 text-center mt-1.5 leading-tight">
                    Salvo na pasta <strong>Downloads</strong>
                </div>
            </div>

          {/* Background Color Picker */}
          <div className="px-2">
             <div className="flex items-center justify-between mb-2 cursor-pointer group" onClick={() => setIsPaletteOpen(!isPaletteOpen)}>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 group-hover:text-brand-red uppercase flex items-center gap-2 transition-colors"><Palette size={12}/> Cor Fundo</span>
                <span className="text-[10px] text-gray-500">{isPaletteOpen ? 'Ocultar' : 'Alterar'}</span>
             </div>
             
             {isPaletteOpen && (
               <div className="bg-black/5 dark:bg-black/20 rounded-lg p-2 grid grid-cols-4 gap-2 animate-fade-in border border-gray-200 dark:border-white/5">
                  {BACKGROUND_PALETTE.map((p) => (
                    <button
                      key={p.color}
                      onClick={() => onBgColorChange(p.color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === p.color ? 'border-white ring-2 ring-brand-red' : 'border-transparent'}`}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    />
                  ))}
                  <button 
                    onClick={() => onBgColorChange(BACKGROUND_PALETTE[0].color)}
                    className="col-span-4 text-[10px] text-gray-500 hover:text-brand-red flex items-center justify-center gap-1 mt-1 border-t border-gray-200 dark:border-white/5 pt-1"
                  >
                    <RotateCcw size={10} /> Restaurar Padrão
                  </button>
               </div>
             )}
          </div>

          {onLogout && (
              <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-sm"
              >
                  <LogOut size={16} />
                  <span className="font-medium">Trocar Loja</span>
              </button>
          )}
          <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-2 opacity-50">
            v3.0 • Lucro Fácil Pro
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings size={20} className="text-brand-red" /> Dados & Backup
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[70vh]">
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

                        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                <HardDrive size={14}/> Restauração de Dados
                            </h4>
                            <p className="text-[11px] text-gray-500">
                                Se você trocou de computador e tem o arquivo de backup, use o botão abaixo para carregar seus dados.
                            </p>
                            
                            <div className="flex gap-2">
                                <button
                                    type="button" 
                                    onClick={() => restoreInputRef.current?.click()}
                                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:border-blue-500 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition shadow-sm"
                                >
                                    <Upload size={14} /> Restaurar Backup
                                </button>
                                <input 
                                    type="file" 
                                    ref={restoreInputRef} 
                                    className="hidden" 
                                    accept=".json"
                                    onChange={handleRestoreFile}
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-brand-red text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-900/20">Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
