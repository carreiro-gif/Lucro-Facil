
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
  ShieldCheck,
  ShoppingCart,
  Target,
  FileText,
  Zap,
  Percent,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Users
} from 'lucide-react';
import { BACKGROUND_PALETTE } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  bgPatternEnabled?: boolean;
  onBgPatternToggle?: (enabled: boolean) => void;
  sidebarBgColor: string;
  onSidebarBgColorChange: (color: string) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  lastBackupDate: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const DEFAULT_MENU_SECTIONS = [
  {
    title: 'GERAL',
    ids: ['dashboard', 'pricing', 'billing', 'sales-import', 'profit', 'xande-report']
  },
  {
    title: 'OPERACIONAL',
    ids: ['collaborators', 'expenses', 'categories', 'dna', 'purchase-entry', 'ingredients', 'products', 'combos', 'shopping-list']
  },
  {
    title: 'ESTRATÉGICO',
    ids: ['buffet-simulator', 'smart-offers', 'smart-simulator', 'calculator', 'break-even']
  },
  {
    title: 'SUPORTE',
    ids: ['help', 'my-plan']
  }
];

const MENU_ITEM_MAP: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard },
  billing: { label: 'Faturamento', icon: DollarSign },
  'sales-import': { label: 'Integrar Vendas', icon: Upload },
  profit: { label: 'Lucro Atual', icon: ScrollText },
  'xande-report': { label: 'Relatório do Xande', icon: Sparkles },
  collaborators: { label: 'Colaboradores', icon: Users },
  expenses: { label: 'Despesas Fixas', icon: Receipt },
  categories: { label: 'Categorias', icon: Tags },
  dna: { label: 'CFI da Empresa', icon: Dna },
  'purchase-entry': { label: 'Entrada de Compras', icon: FileText },
  ingredients: { label: 'Insumos / Sub-receitas', icon: Beef },
  products: { label: 'Ficha Técnica (CMV)', icon: UtensilsCrossed },
  combos: { label: 'Combos', icon: ShoppingBag },
  'shopping-list': { label: 'Lista de Compras', icon: ShoppingCart },
  'buffet-simulator': { label: 'Buffet & À Vontade', icon: UtensilsCrossed },
  'smart-offers': { label: 'Ofertas Inteligentes', icon: Zap },
  'smart-simulator': { label: 'Simular Descontos', icon: Percent },
  pricing: { label: 'Preço de Venda', icon: Calculator },
  calculator: { label: 'Calculadora', icon: Calculator },
  'break-even': { label: 'Ponto de Equilíbrio', icon: Target },
  help: { label: 'Central de Ajuda', icon: HelpCircle },
  'my-plan': { label: 'Meu Plano / Financeiro', icon: ShieldCheck },
};

const validateMenuSections = (sections: any[]): { title: string; ids: string[] }[] => {
  if (!Array.isArray(sections)) return DEFAULT_MENU_SECTIONS;
  
  const allValidIds = Object.keys(MENU_ITEM_MAP);
  const foundIds = new Set<string>();
  
  const validated = sections.map(sec => {
    if (!sec || typeof sec !== 'object' || !sec.title || !Array.isArray(sec.ids)) {
      return null;
    }
    const cleanIds = sec.ids.filter((id: any) => {
      if (typeof id === 'string' && allValidIds.includes(id) && !foundIds.has(id)) {
        foundIds.add(id);
        return true;
      }
      return false;
    });
    return {
      title: String(sec.title).toUpperCase(),
      ids: cleanIds
    };
  }).filter(Boolean) as { title: string; ids: string[] }[];

  const requiredTitles = ['GERAL', 'OPERACIONAL', 'ESTRATÉGICO', 'SUPORTE'];
  requiredTitles.forEach(title => {
    if (!validated.some(v => v.title === title)) {
      validated.push({ title, ids: [] });
    }
  });

  const getDefaultSection = (id: string): string => {
    if (['dashboard', 'pricing', 'billing', 'sales-import', 'profit', 'xande-report'].includes(id)) return 'GERAL';
    if (['collaborators', 'expenses', 'categories', 'dna', 'purchase-entry', 'ingredients', 'products', 'combos', 'shopping-list'].includes(id)) return 'OPERACIONAL';
    if (['buffet-simulator', 'smart-offers', 'smart-simulator', 'calculator', 'break-even'].includes(id)) return 'ESTRATÉGICO';
    if (['help', 'my-plan'].includes(id)) return 'SUPORTE';
    return 'SUPORTE';
  };

  allValidIds.forEach(id => {
    if (!foundIds.has(id)) {
      const defSectionTitle = getDefaultSection(id);
      const targetSec = validated.find(v => v.title === defSectionTitle);
      if (targetSec) {
        targetSec.ids.push(id);
      } else {
        validated[0].ids.push(id);
      }
    }
  });

  return validated;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  bgColor,
  onBgColorChange,
  bgPatternEnabled = false,
  onBgPatternToggle,
  sidebarBgColor,
  onSidebarBgColorChange,
  onBackup,
  onRestore,
  lastBackupDate,
  isOpen = false,
  onClose
}) => {
  const { storeInfo, updateStoreInfo, resetSystem, updateResetPassword, resetPassword } = useApp();
  const { profile } = useAuth();

  const diffDays = React.useMemo(() => {
    if (!profile || profile.status !== 'trial' || !profile.trialEnd) return null;
    const now = new Date();
    const end = new Date(profile.trialEnd);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [profile]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [menuSections, setMenuSections] = useState<{ title: string; ids: string[] }[]>(() => {
    const saved = localStorage.getItem('lucro_facil_menu_sections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return validateMenuSections(parsed);
      } catch (e) {
        // Safe fallback
      }
    }
    return DEFAULT_MENU_SECTIONS;
  });

  const handleResetMenu = () => {
    if (window.confirm('Deseja restaurar a ordem padrão dos menus?')) {
      setMenuSections(DEFAULT_MENU_SECTIONS);
      localStorage.setItem('lucro_facil_menu_sections', JSON.stringify(DEFAULT_MENU_SECTIONS));
    }
  };

  const handleMoveItemToSection = (itemId: string, targetSection: string) => {
    setMenuSections(prev => {
      let foundItem: string | null = null;
      const cleanSections = prev.map(section => {
        if (section.ids.includes(itemId)) {
          foundItem = itemId;
          return {
            ...section,
            ids: section.ids.filter(id => id !== itemId)
          };
        }
        return section;
      });

      if (!foundItem) return prev;

      const updated = cleanSections.map(section => {
        if (section.title === targetSection) {
          return {
            ...section,
            ids: [...section.ids, itemId]
          };
        }
        return section;
      });

      localStorage.setItem('lucro_facil_menu_sections', JSON.stringify(updated));
      return updated;
    });
  };

  const handleReorderItem = (itemId: string, direction: 'up' | 'down') => {
    setMenuSections(prev => {
      const sectionIndex = prev.findIndex(section => section.ids.includes(itemId));
      if (sectionIndex === -1) return prev;

      const section = prev[sectionIndex];
      const index = section.ids.indexOf(itemId);
      
      if (direction === 'up' && index === 0) {
        if (sectionIndex > 0) {
          const prevSection = prev[sectionIndex - 1];
          const newPrevIds = [...prevSection.ids, itemId];
          const newCurrIds = section.ids.filter(id => id !== itemId);
          
          const updated = prev.map((sec, idx) => {
            if (idx === sectionIndex - 1) return { ...sec, ids: newPrevIds };
            if (idx === sectionIndex) return { ...sec, ids: newCurrIds };
            return sec;
          });
          localStorage.setItem('lucro_facil_menu_sections', JSON.stringify(updated));
          return updated;
        }
        return prev;
      }
      
      if (direction === 'down' && index === section.ids.length - 1) {
        if (sectionIndex < prev.length - 1) {
          const nextSection = prev[sectionIndex + 1];
          const newNextIds = [itemId, ...nextSection.ids];
          const newCurrIds = section.ids.filter(id => id !== itemId);
          
          const updated = prev.map((sec, idx) => {
            if (idx === sectionIndex + 1) return { ...sec, ids: newNextIds };
            if (idx === sectionIndex) return { ...sec, ids: newCurrIds };
            return sec;
          });
          localStorage.setItem('lucro_facil_menu_sections', JSON.stringify(updated));
          return updated;
        }
        return prev;
      }

      const newIds = [...section.ids];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      const temp = newIds[index];
      newIds[index] = newIds[targetIndex];
      newIds[targetIndex] = temp;

      const updated = prev.map((sec, idx) => {
        if (idx === sectionIndex) {
          return { ...sec, ids: newIds };
        }
        return sec;
      });

      localStorage.setItem('lucro_facil_menu_sections', JSON.stringify(updated));
      return updated;
    });
  };
  
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPassInput, setResetPassInput] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassInput, setCurrentPassInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

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
    setShowResetConfirm(false);
    setIsChangingPassword(false);
  };

  const handleReset = () => {
    if (resetPassInput === resetPassword) {
      if (window.confirm('TEM CERTEZA? Isso apagará todos os produtos, insumos, despesas e faturamentos desta loja. Esta ação não pode ser desfeita.')) {
        resetSystem();
        setIsSettingsOpen(false);
        setResetPassInput('');
      }
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleChangePassword = () => {
    if (currentPassInput === resetPassword) {
      if (newPassword.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres.');
        return;
      }
      updateResetPassword(newPassword);
      setIsChangingPassword(false);
      setNewPassword('');
      setCurrentPassInput('');
      alert('Senha alterada com sucesso!');
    } else {
      alert('Senha atual incorreta!');
    }
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

  const getBackupStatus = () => {
    if (!lastBackupDate) return { 
        status: 'critical', 
        label: 'Risco! Nunca feito', 
        color: 'text-slate-900', 
        bg: 'bg-brand-yellow border-yellow-500 shadow-md',
        icon: AlertTriangle
    };

    const diff = new Date().getTime() - new Date(lastBackupDate).getTime();
    const days = diff / (1000 * 60 * 60 * 24);

    if (days > 7) return { 
        status: 'critical', 
        label: `Atrasado há ${Math.floor(days)} dias`, 
        color: 'text-slate-900', 
        bg: 'bg-brand-yellow border-yellow-500 shadow-md',
        icon: AlertTriangle
    };
    
    if (days > 3) return { 
        status: 'warning', 
        label: 'Backup Antigo (>3d)', 
        color: 'text-slate-900', 
        bg: 'bg-brand-yellow border-yellow-500 shadow-md',
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

  const isSidebarDark = BACKGROUND_PALETTE.find(p => p.color === sidebarBgColor)?.mode === 'dark';
  const textPrimary = isSidebarDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isSidebarDark ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isSidebarDark ? 'border-white/10' : 'border-gray-200';
  const hoverBg = isSidebarDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const activeBg = isSidebarDark ? 'bg-white/10' : 'bg-black/5';

  return (
    <>
      {/* Backdrop overlay underneath sidebar when open on mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <div 
        className={`sidebar-v2-modern w-64 border-r ${borderClass} h-full flex flex-col fixed md:relative left-0 top-0 z-40 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-sm font-sans shrink-0 overflow-hidden`}
        style={{ backgroundColor: sidebarBgColor }}
      >
        {bgPatternEnabled && (
           <div className={`absolute inset-0 pointer-events-none z-0 ${isSidebarDark ? 'mix-blend-screen opacity-60' : 'mix-blend-overlay opacity-30'}`} style={{ backgroundImage: 'var(--app-bg-image)', backgroundSize: '300px', backgroundRepeat: 'repeat' }}></div>
        )}
        <div className={`relative z-10 p-6 border-b ${borderClass} flex items-center justify-between gap-2 shrink-0`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 ${isSidebarDark ? 'bg-black/20' : 'bg-white/50'} rounded-lg flex items-center justify-center shadow-lg overflow-hidden shrink-0 border ${borderClass}`}>
              {storeInfo.logo ? (
                 <img src={storeInfo.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                 <UtensilsCrossed className="text-brand-red w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
               <h1 className={`text-sm font-bold ${textPrimary} truncate leading-tight`}>{storeInfo.name}</h1>
               <button onClick={openSettings} className={`text-[10px] ${textSecondary} hover:text-brand-red flex items-center gap-1 transition-colors mt-0.5 font-bold uppercase truncate`}>
                 <Settings size={10} className="shrink-0" /> Configurar
               </button>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className={`md:hidden p-1.5 rounded-lg ${hoverBg} ${textSecondary} hover:text-brand-red flex items-center justify-center`}
              title="Fechar menu"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <nav className="relative z-10 flex-1 px-3 py-6 space-y-6 overflow-y-auto sidebar-v2-modern-scroll">
          {menuSections.map((section, idx) => {
            if (section.ids.length === 0 && !isOrganizing) return null;
            
            return (
              <div key={idx} className="space-y-1.5 pb-2">
                <h3 className={`px-3 text-[11px] font-bold ${textSecondary} uppercase tracking-wider mb-2 flex items-center justify-between`}>
                  <span>{section.title}</span>
                  {isOrganizing && (
                    <span className="text-[9px] lowercase font-normal opacity-60 italic">
                      ({section.ids.length} itens)
                    </span>
                  )}
                </h3>
                {section.ids.map((itemId) => {
                  const itemConfig = MENU_ITEM_MAP[itemId];
                  if (!itemConfig) return null;
                  
                  const Icon = itemConfig.icon;
                  const isActive = activeTab === itemId;
                  
                  return (
                    <div 
                      key={itemId}
                      className="w-full flex items-center gap-1 rounded-lg transition-all duration-200 relative p-0.5 group"
                    >
                      {isActive && !isOrganizing && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-yellow rounded-r-md" />
                      )}
                      
                      <button
                        disabled={isOrganizing}
                        onClick={() => {
                          setActiveTab(itemId);
                          onClose?.();
                        }}
                        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
                          isOrganizing 
                            ? 'cursor-default opacity-85' 
                            : isActive 
                              ? `${activeBg} ${textPrimary} font-bold` 
                              : `${textSecondary} ${hoverBg} hover:${isSidebarDark ? 'text-white' : 'text-gray-900'}`
                        }`}
                      >
                        <Icon size={18} className={`shrink-0 ${isActive && !isOrganizing ? 'text-brand-yellow' : 'text-current transition-colors'}`} />
                        <span className="text-[14px] truncate">{itemConfig.label}</span>
                      </button>

                      {isOrganizing && (
                        <div className="flex items-center bg-black/10 dark:bg-white/5 rounded p-0.5 border border-white/5 shadow-sm space-x-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReorderItem(itemId, 'up')}
                            title="Subir"
                            className="p-1 text-gray-400 hover:text-brand-yellow hover:bg-black/20 dark:hover:bg-white/10 rounded transition-colors"
                          >
                            <ChevronUp size={12} />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleReorderItem(itemId, 'down')}
                            title="Descer"
                            className="p-1 text-gray-400 hover:text-brand-yellow hover:bg-black/20 dark:hover:bg-white/10 rounded transition-colors"
                          >
                            <ChevronDown size={12} />
                          </button>

                          <select
                            value={section.title}
                            onChange={(e) => handleMoveItemToSection(itemId, e.target.value)}
                            title="Mover de Seção"
                            className="text-[9px] font-bold bg-transparent border-0 text-current hover:text-brand-yellow cursor-pointer outline-none max-w-[50px] p-0 pr-1 select-none leading-none"
                            style={{ colorScheme: isSidebarDark ? 'dark' : 'light' }}
                          >
                            <option value="GERAL" className={isSidebarDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}>Ger.</option>
                            <option value="OPERACIONAL" className={isSidebarDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}>Oper.</option>
                            <option value="ESTRATÉGICO" className={isSidebarDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}>Estr.</option>
                            <option value="SUPORTE" className={isSidebarDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}>Sup.</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {profile?.role === 'admin' && (
            <div className="space-y-1.5 pb-2 pt-2 border-t border-dashed border-gray-400/20">
              <h3 className={`px-3 text-[11px] font-bold ${textSecondary} uppercase tracking-wider mb-2`}>
                ADMINISTRATIVO
              </h3>
              <div className="w-full flex items-center gap-1 rounded-lg transition-all duration-200 relative p-0.5 group">
                {activeTab === 'backup-system' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-yellow rounded-r-md" />
                )}
                <button
                  disabled={isOrganizing}
                  onClick={() => {
                    setActiveTab('backup-system');
                    onClose?.();
                  }}
                  className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
                    activeTab === 'backup-system'
                      ? `${activeBg} ${textPrimary} font-bold`
                      : `${textSecondary} ${hoverBg} hover:${isSidebarDark ? 'text-white' : 'text-gray-900'}`
                  }`}
                >
                  <HardDrive size={18} className={`shrink-0 ${activeTab === 'backup-system' ? 'text-brand-yellow' : 'text-current'}`} />
                  <span className="text-[14px] truncate">Backup do Sistema</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className={`relative z-10 p-4 border-t ${borderClass} space-y-3`}>
          <div className="px-2">
             {/* Organize Menu Toggle */}
             <div className="flex items-center justify-between mb-3 border-b pb-2 border-dashed border-gray-400/20">
                <button
                  type="button"
                  onClick={() => setIsOrganizing(!isOrganizing)}
                  className={`text-xs font-bold ${isOrganizing ? 'text-brand-yellow font-extrabold' : textSecondary} hover:text-brand-red uppercase flex items-center gap-1.5 transition-colors`}
                >
                  <Settings size={12} className={isOrganizing ? 'animate-spin' : ''} />
                  {isOrganizing ? 'Salvar Menu' : 'Organizar Menu'}
                </button>
                {isOrganizing && (
                  <button
                    type="button"
                    onClick={handleResetMenu}
                    className="text-[9px] text-red-500 hover:underline font-extrabold uppercase"
                  >
                    Restaurar
                  </button>
                )}
             </div>

             <div className="flex items-center justify-between mb-2 cursor-pointer group" onClick={() => setIsPaletteOpen(!isPaletteOpen)}>
                <span className={`text-xs font-bold ${textSecondary} group-hover:text-brand-red uppercase flex items-center gap-2 transition-colors`}><Palette size={12}/> Cores do Sistema</span>
                <span className={`text-[10px] ${textSecondary}`}>{isPaletteOpen ? 'Ocultar' : 'Alterar'}</span>
             </div>
             
             {isPaletteOpen && (
               <div className={`bg-black/5 rounded-lg p-3 space-y-3 animate-fade-in border ${borderClass}`}>
                  <div>
                    <h4 className={`text-[10px] ${textSecondary} font-bold uppercase mb-2`}>Fundo Apps</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {BACKGROUND_PALETTE.map((p) => (
                        <button
                          key={p.color}
                          onClick={() => onBgColorChange(p.color)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === p.color ? 'border-white ring-2 ring-brand-red' : 'border-transparent'}`}
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={`border-t ${borderClass} pt-2`}>
                    <h4 className={`text-[10px] ${textSecondary} font-bold uppercase mb-2`}>Menu Lateral</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {BACKGROUND_PALETTE.map((p) => (
                        <button
                          key={p.color}
                          onClick={() => onSidebarBgColorChange(p.color)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${sidebarBgColor === p.color ? 'border-white ring-2 ring-brand-red' : 'border-transparent'}`}
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {onBgPatternToggle && (
                    <div className={`border-t ${borderClass} pt-3 pb-1 flex items-center justify-between cursor-pointer`} onClick={() => onBgPatternToggle(!bgPatternEnabled)}>
                      <h4 className={`text-[10px] ${textSecondary} font-bold uppercase`}>Textura Doodle Mágica</h4>
                      <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${bgPatternEnabled ? 'bg-brand-red' : 'bg-gray-300 dark:bg-gray-700'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${bgPatternEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                        onBgColorChange(BACKGROUND_PALETTE[0].color);
                        onSidebarBgColorChange('#F8FAFC');
                        if (onBgPatternToggle) onBgPatternToggle(false);
                    }}
                    className={`w-full text-[10px] ${textSecondary} hover:text-brand-red flex items-center justify-center gap-1 mt-1 border-t ${borderClass} pt-2`}
                  >
                    <RotateCcw size={10} /> Restaurar Padrões
                  </button>
               </div>
             )}
          </div>

          {/* Subscription/Plans widget in sidebar */}
          {profile && profile.email?.toLowerCase().trim() !== 'espacocarreiro@gmail.com' && (
            <div className="mx-2 mb-4 bg-black/10 dark:bg-white/5 border border-brand-yellow/30 p-3 rounded-xl shadow-md relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-yellow/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block tracking-wider">
                      Seu Plano ATUAL
                    </span>
                    <span className="text-sm font-black text-white capitalize">
                      {profile.plan || 'Trial'}
                    </span>
                  </div>
                  {profile.status === 'trial' && diffDays !== null && diffDays >= 0 && (
                    <span className="text-[10px] bg-brand-yellow/20 border border-brand-yellow text-brand-yellow px-2 py-0.5 rounded-full font-extrabold shadow-sm animate-pulse">
                      {diffDays} {diffDays === 1 ? 'dia' : 'dias'} rest.
                    </span>
                  )}
                </div>
                
                {profile.plan !== 'pro' && (
                  <button 
                    id="sidebar-upgrade-btn"
                    onClick={() => {
                      setActiveTab('plans');
                      onClose?.();
                    }}
                    className="w-full bg-brand-yellow hover:bg-yellow-400 text-slate-950 font-black text-[11px] py-2 rounded-lg transition text-center uppercase tracking-wider shadow-sm animate-bounce"
                  >
                    {profile.status === 'trial' ? '🛡️ Assinar Agora' : '🚀 Fazer Upgrade'}
                  </button>
                )}
              </div>
            </div>
          )}

          {onLogout && (
              <button 
                  onClick={() => {
                      onLogout();
                      onClose?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-sm"
              >
                  <LogOut size={16} />
                  <span className="font-medium">Trocar Loja</span>
              </button>
          )}
          <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-2 opacity-50">
            v3.0 • Cardápio Blindado Pro
          </div>
        </div>
      </div>

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
                            <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2"><HardDrive size={14}/> Backup Automático & Restauração</span>
                            </h4>
                            <p className="text-[11px] text-gray-500">
                                Seu sistema salva automaticamente localmente no seu navegador. Porém você ainda pode usar os botões abaixo para <strong>Exportar Backup</strong>. Se você trocou de computador, use <strong>Restaurar Backup</strong>.
                            </p>
                            
                            <div className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 shadow-sm">
                                <span className={`text-[10px] font-extrabold uppercase flex items-center gap-1.5 ${backupStatus.color}`}>
                                    <BackupIcon size={12} /> {backupStatus.label}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Cloud size={10} className="text-gray-400" />
                                    <span className="text-[10px] text-gray-500 font-bold">Auto: {lastSaved}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onBackup}
                                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:border-brand-red text-gray-700 dark:text-gray-300 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition shadow-sm"
                                >
                                    <Download size={14} /> Exportar Backup
                                </button>
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

                        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                <ShieldCheck size={14}/> Segurança
                            </h4>
                            {!isChangingPassword ? (
                                <button 
                                    type="button"
                                    onClick={() => setIsChangingPassword(true)}
                                    className="text-[11px] text-brand-red font-bold uppercase hover:underline"
                                >
                                    Alterar Senha de Reset
                                </button>
                            ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <input 
                                        type="password" 
                                        placeholder="Senha Atual"
                                        value={currentPassInput}
                                        onChange={e => setCurrentPassInput(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Nova Senha"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-brand-red"
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setIsChangingPassword(false)}
                                            className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white text-[10px] font-bold rounded-lg"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleChangePassword}
                                            className="flex-1 py-2 bg-brand-red text-white text-[10px] font-bold rounded-lg"
                                        >
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 space-y-4">
                            <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
                                <RotateCcw size={14}/> Zona de Perigo
                            </h4>
                            <p className="text-[11px] text-red-500/80">
                                Use esta opção para zerar todos os dados desta loja e começar do zero.
                            </p>
                            
                            {!showResetConfirm ? (
                                <button
                                    type="button" 
                                    onClick={() => setShowResetConfirm(true)}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition shadow-sm"
                                >
                                    <RotateCcw size={14} /> Zerar Sistema
                                </button>
                            ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] text-red-600 font-bold uppercase block">Digite a senha para confirmar:</label>
                                    <input 
                                        type="password" 
                                        value={resetPassInput}
                                        onChange={e => setResetPassInput(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 text-gray-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-red-500"
                                        placeholder="Senha de Reset"
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setShowResetConfirm(false)}
                                            className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white text-[10px] font-bold rounded-lg"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleReset}
                                            className="flex-1 py-2 bg-red-600 text-white text-[10px] font-bold rounded-lg"
                                        >
                                            Zerar Agora
                                        </button>
                                    </div>
                                </div>
                            )}
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
