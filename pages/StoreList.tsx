import React, { useState, useRef } from 'react';
import { Plus, Store, ArrowRight, MapPin, Edit2, Upload, X, Copy, CheckCircle, Trash2, AlertTriangle, Tags, TrendingUp, Sun, Moon } from 'lucide-react';
import { StoreInfo } from '../types';

interface StoreListProps {
  stores: StoreInfo[];
  onSelectStore: (storeId: string) => void;
  onAddStore: (store: StoreInfo) => void;
  onUpdateStore: (store: StoreInfo) => void;
  onDeleteStore?: (storeId: string) => void;
  onReplicate?: (sourceId: string, targetId: string, type: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const REPLICATION_OPTIONS = [
    { value: 'all', label: 'Tudo (Clonar Loja)' },
    { value: 'ingredients', label: 'Aba Insumos' },
    { value: 'products', label: 'Aba Cardápio & Fichas' },
    { value: 'combos', label: 'Aba Combos' },
    { value: 'cfi', label: 'Aba CFI & Taxas' },
    { value: 'platform', label: 'Config. Marketplaces' },
    { value: 'expenses', label: 'Aba Despesas Fixas' },
    { value: 'categories', label: 'Categorias & Fornecedores' },
];

const StoreList: React.FC<StoreListProps> = ({ stores, onSelectStore, onAddStore, onUpdateStore, onDeleteStore, onReplicate, toggleTheme, isDark }) => {
  // Store Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreInfo | null>(null);
  
  // Replicate Modal State
  const [isReplicateOpen, setIsReplicateOpen] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [replicationType, setReplicationType] = useState('products');
  const [showSuccess, setShowSuccess] = useState(false);

  // Delete Modal State
  const [storeToDelete, setStoreToDelete] = useState<StoreInfo | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Store Handlers ---
  const handleOpenModal = (store?: StoreInfo) => {
    if (store) {
      setEditingStore(store);
      setName(store.name);
      setAddress(store.address || '');
      setLogo(store.logo || '');
    } else {
      setEditingStore(null);
      setName('');
      setAddress('');
      setLogo('');
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const storeData: StoreInfo = {
      id: editingStore?.id,
      name,
      address,
      logo
    };

    if (editingStore) {
      onUpdateStore(storeData);
    } else {
      onAddStore(storeData);
    }
    setIsModalOpen(false);
  };

  const handleEditClick = (e: React.MouseEvent, store: StoreInfo) => {
    e.stopPropagation();
    handleOpenModal(store);
  };

  const handleDeleteClick = (e: React.MouseEvent, store: StoreInfo) => {
    e.stopPropagation();
    setStoreToDelete(store);
  };

  const confirmDelete = () => {
    if (storeToDelete && onDeleteStore && storeToDelete.id) {
        onDeleteStore(storeToDelete.id);
        setStoreToDelete(null);
    }
  };

  // --- Replication Handlers ---
  const handleOpenReplicate = () => {
      if (stores.length > 0) setSourceId(stores[0].id || '');
      if (stores.length > 1) setTargetId(stores[1].id || '');
      setIsReplicateOpen(true);
      setShowSuccess(false);
  };

  const handleReplicateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!sourceId || !targetId || !onReplicate) return;
      if (sourceId === targetId) {
          alert("A loja de origem e destino não podem ser a mesma.");
          return;
      }
      onReplicate(sourceId, targetId, replicationType);
      setShowSuccess(true);
      setTimeout(() => {
          setIsReplicateOpen(false);
          setShowSuccess(false);
      }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#161616] flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>
      </div>

      <div className="max-w-6xl w-full space-y-10 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 relative">
            {/* Center Content */}
            <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
                
                {/* Logo Representation */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-green-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative w-24 h-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-2xl overflow-hidden">
                         {/* Using Icons to mimic the logo concept if image fails or isn't provided via URL */}
                        <div className="relative">
                            <Tags size={56} className="text-yellow-500 transform -rotate-12" strokeWidth={1.5} fill="rgba(234, 179, 8, 0.1)"/>
                            <TrendingUp size={32} className="text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -ml-1 -mt-1" strokeWidth={3} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                     <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                        Lucro Fácil
                     </h1>
                     <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium max-w-lg">
                        Precificação Inteligente para Restaurantes
                     </p>
                </div>
            </div>

            {/* Replicate Button & Theme Toggle - Absolute Top Right */}
            <div className="absolute top-0 right-0 hidden md:flex items-center gap-3">
                 <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-red transition-all"
                    title="Alternar Tema"
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {onReplicate && (
                    <button 
                        onClick={handleOpenReplicate}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 dark:border-gray-700 hover:border-brand-red transition-all"
                    >
                        <Copy size={16} /> Replicar Dados
                    </button>
                )}
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden mt-6 flex gap-3 justify-center">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-red transition-all"
                >
                     {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                {onReplicate && (
                    <button 
                        onClick={handleOpenReplicate}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 dark:border-gray-700 hover:border-brand-red transition-all"
                    >
                        <Copy size={16} /> Replicar Dados
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Existing Stores Cards */}
            {stores.map(store => (
                <div 
                    key={store.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl text-left hover:border-brand-red hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300 group relative overflow-hidden flex flex-col h-full cursor-pointer"
                    onClick={() => onSelectStore(store.id!)}
                >
                    <div className="absolute top-0 right-0 p-20 bg-brand-red/5 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0"></div>
                    
                    <div className="absolute top-3 right-3 flex gap-2 z-20">
                        <button 
                            onClick={(e) => handleEditClick(e, store)}
                            className="text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Editar Loja"
                        >
                            <Edit2 size={14} />
                        </button>
                        {onDeleteStore && (
                            <button 
                                onClick={(e) => handleDeleteClick(e, store)}
                                className="text-gray-400 dark:text-gray-600 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-900/20"
                                title="Excluir Loja"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    <div className="relative z-10 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500 shadow-inner overflow-hidden border border-gray-200 dark:border-gray-700">
                                {store.logo ? (
                                    <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Store size={20} className="group-hover:text-brand-red transition-colors" />
                                )}
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-red transition-colors truncate pr-16">{store.name}</h3>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 truncate">
                            <MapPin size={12} className="shrink-0" />
                            {store.address || 'Sem endereço'}
                        </div>
                    </div>

                    <div className="relative z-10 pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto flex items-center justify-between text-xs font-medium text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        <span>Acessar Painel</span>
                        <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            ))}

            {/* Add New Store Button */}
            <button 
                onClick={() => handleOpenModal()}
                className="bg-gray-50 dark:bg-gray-900/30 border border-gray-300 dark:border-gray-800 border-dashed p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:border-brand-red/50 hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 group min-h-[200px]"
            >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-colors shadow-lg group-hover:shadow-red-900/20 group-hover:scale-110 duration-300">
                    <Plus size={24} />
                </div>
                <div className="text-center">
                    <span className="font-bold text-sm uppercase tracking-wider block mb-1">Adicionar Loja</span>
                </div>
            </button>
        </div>
        
        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-600">Lucro Fácil © 2025 • v1.3.1</p>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editingStore ? 'Editar Loja' : 'Nova Loja'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex justify-center mb-6">
                        <div 
                            className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-brand-red hover:bg-gray-200 dark:hover:bg-gray-700 transition relative overflow-hidden group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logo ? (
                                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
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
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:border-brand-red"
                            placeholder="Ex: Matriz - Centro"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Endereço</label>
                        <input 
                            type="text" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:border-brand-red"
                            placeholder="Ex: Rua das Flores, 123"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-brand-red text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-900/20">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {storeToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col overflow-hidden">
                  <div className="p-6 bg-red-100 dark:bg-red-900/10 flex items-center gap-4 border-b border-red-200 dark:border-red-900/20">
                      <div className="bg-red-100 dark:bg-red-500/20 p-3 rounded-full text-red-600 dark:text-red-500">
                          <AlertTriangle size={32} />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Excluir Loja?</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Esta ação é irreversível.</p>
                      </div>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-gray-600 dark:text-gray-300">
                          Tem certeza que deseja excluir esta loja? <br/>
                          <span className="font-bold text-gray-900 dark:text-white">"{storeToDelete.name}"</span>
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-100 dark:border-red-900/30">
                          Esta ação não pode ser desfeita. Todos os dados serão perdidos.
                      </p>
                  </div>
                  <div className="p-6 pt-0 flex gap-3">
                      <button 
                          onClick={() => setStoreToDelete(null)}
                          className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-900/20"
                      >
                          Confirmar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Replication Modal */}
      {isReplicateOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in flex flex-col">
                  {showSuccess ? (
                      <div className="p-10 flex flex-col items-center justify-center text-center animate-fade-in">
                          <CheckCircle size={64} className="text-emerald-500 mb-4" />
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Sucesso!</h3>
                          <p className="text-gray-500 dark:text-gray-400">Dados replicados corretamente.</p>
                      </div>
                  ) : (
                    <>
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#0f111a] rounded-t-xl">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Copy size={20} className="text-brand-red" /> Replicar Dados
                            </h3>
                            <button onClick={() => setIsReplicateOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleReplicateSubmit} className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">De (Origem)</label>
                                    <select 
                                        value={sourceId}
                                        onChange={e => setSourceId(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:border-brand-red"
                                    >
                                        {stores.map(s => (
                                            <option key={s.id} value={s.id} disabled={s.id === targetId}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center justify-center pt-5 text-gray-400 dark:text-gray-600">
                                    <ArrowRight size={24} />
                                </div>
                                <div className="-ml-8">
                                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Para (Destino)</label>
                                    <select 
                                        value={targetId}
                                        onChange={e => setTargetId(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:border-brand-red"
                                    >
                                        {stores.map(s => (
                                            <option key={s.id} value={s.id} disabled={s.id === sourceId}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">O que você deseja copiar?</label>
                                <select 
                                    value={replicationType}
                                    onChange={e => setReplicationType(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:border-brand-red font-bold"
                                >
                                    {REPLICATION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-2 italic bg-gray-100 dark:bg-gray-800/50 p-2 rounded">
                                    Atenção: Esta ação substituirá os dados existentes na loja de destino selecionada para a aba escolhida.
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsReplicateOpen(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-brand-red text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-900/20">Confirmar Cópia</button>
                            </div>
                        </form>
                    </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default StoreList;