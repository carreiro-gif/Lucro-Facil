
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
/* Fixed: Added missing ChefHat import from lucide-react */
import { Plus, Trash, Edit2, Copy, ShoppingBag, X, AlertTriangle, HelpCircle, ChefHat } from 'lucide-react';
import { Combo, ComboItem } from '../types';
import { formatPercent } from '../constants';

const Combos: React.FC = () => {
  const { 
    combos, 
    products, 
    getProductCMV, 
    calculateTotalCfiPercent, 
    platformConfig,
    addCombo,
    updateCombo,
    deleteCombo,
    updatePlatformConfig
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'combos' | 'marketplace'>('combos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showMarketplaceHelp, setShowMarketplaceHelp] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [profitMargin, setProfitMargin] = useState(15); 
  const [items, setItems] = useState<ComboItem[]>([]);
  const [category, setCategory] = useState('Padrão');

  // Categories & Filtering State
  const [comboCategories, setComboCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lucro_facil_combo_categories');
      const cats = saved ? JSON.parse(saved) : ['Padrão', 'Dados Importados', 'Família', 'Casal', 'Promoções', 'Individuais'];
      
      const essential = ['Padrão', 'Dados Importados'];
      const merged = Array.from(new Set([...essential, ...cats]));
      return merged;
    } catch (e) {
      return ['Padrão', 'Dados Importados', 'Família', 'Casal', 'Promoções', 'Individuais'];
    }
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViewCategory, setSelectedViewCategory] = useState<string>('Todos');

  // Gestão de Categorias via Modal
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const handleRenameCategory = (index: number, newName: string) => {
    const oldName = comboCategories[index];
    const cleanedNewName = newName.trim();
    if (!cleanedNewName || cleanedNewName === oldName) return;

    if (comboCategories.includes(cleanedNewName) && cleanedNewName !== oldName) {
      alert("Já existe uma categoria com este nome.");
      return;
    }

    // 1. Atualizar a categoria de todos os combos reais que usam o nome antigo
    (combos || []).forEach(combo => {
      if (combo.category === oldName) {
        updateCombo(combo.id, { category: cleanedNewName });
      }
    });

    // 2. Atualizar a lista de categorias em si
    const updated = [...comboCategories];
    updated[index] = cleanedNewName;
    setComboCategories(updated);
    
    // Se a visualização atual for a categoria antiga, move para a nova
    if (selectedViewCategory === oldName) {
      setSelectedViewCategory(cleanedNewName);
    }
    
    setEditingCategoryIndex(null);
  };

  const handleDeleteCategory = (index: number) => {
    const categoryToDelete = comboCategories[index];
    if (categoryToDelete === 'Padrão' || categoryToDelete === 'Dados Importados') {
      alert("As categorias 'Padrão' e 'Dados Importados' são necessárias para o sistema e não podem ser excluídas.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir a categoria "${categoryToDelete}"? Todos os combos nela serão movidos para a categoria "Padrão".`)) {
      // 1. Atualizar a categoria de todos os combos que pertencem a ela para 'Padrão'
      (combos || []).forEach(combo => {
        if (combo.category === categoryToDelete) {
          updateCombo(combo.id, { category: 'Padrão' });
        }
      });

      // 2. Filtrar da lista de categorias
      const updated = comboCategories.filter((_, idx) => idx !== index);
      setComboCategories(updated);
      
      // Se a visualização atual for a categoria deletada, volta para 'Todos'
      if (selectedViewCategory === categoryToDelete) {
        setSelectedViewCategory('Todos');
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('lucro_facil_combo_categories', JSON.stringify(comboCategories));
  }, [comboCategories]);

  // Self-heal and sync category options from actual combos if they contain something new
  useEffect(() => {
    const existingCategories = (combos || []).map(c => c.category).filter((c): c is string => !!c);
    if (existingCategories.length > 0) {
      setComboCategories(prev => {
        const unique = Array.from(new Set([...prev, ...existingCategories, 'Padrão', 'Dados Importados']));
        if (unique.length !== prev.length) {
          return unique;
        }
        return prev;
      });
    }
  }, [combos]);

  // Marketplace State
  const [ifoodFee, setIfoodFee] = useState(0);
  const [ifoodDelivery, setIfoodDelivery] = useState(0);
  const [ifoodCoupon, setIfoodCoupon] = useState(0);
  
  const [food99Fee, setFood99Fee] = useState(0);
  const [food99Delivery, setFood99Delivery] = useState(0);
  const [food99Coupon, setFood99Coupon] = useState(0);

  const [keetaFee, setKeetaFee] = useState(0);
  const [keetaDelivery, setKeetaDelivery] = useState(0);
  const [keetaCoupon, setKeetaCoupon] = useState(0);

  const [ciVal, setCiVal] = useState(0);
  const [customPackagingCost, setCustomPackagingCost] = useState(0);

  // Body Scroll Lock & ESC Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) setIsModalOpen(false);
    };

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isModalOpen]);

  // Calculated values for display
  const totalCfiPercent = calculateTotalCfiPercent();
  
  // Default Fees from Config (Rounded to avoid JS float precision issues like 12.100000000000001)
  const ifoodTotalFeeDefault = Math.round((platformConfig.ifood.fee + platformConfig.ifood.onlinePayment + platformConfig.ifood.anticipation) * 100) / 100;
  const food99TotalFeeDefault = Math.round((platformConfig.food99.fee + platformConfig.food99.onlinePayment + platformConfig.food99.anticipation) * 100) / 100;
  const keetaTotalFeeDefault = Math.round((platformConfig.keeta.fee + platformConfig.keeta.onlinePayment + platformConfig.keeta.anticipation) * 100) / 100;

  const handleOpenModal = (combo?: Combo) => {
    if (combo) {
      setEditingId(combo.id);
      setName(combo.name);
      setCategory(combo.category || 'Padrão');
      setProfitMargin(combo.profitMargin);
      setItems(combo.items);
      setCustomPackagingCost(combo.customPackagingCost ?? 0);
      
      // Load saved values
      setIfoodFee(combo.ifoodFee);
      setIfoodDelivery(combo.ifoodDelivery);
      setIfoodCoupon(combo.ifoodCoupon);
      setFood99Fee(combo.food99Fee);
      setFood99Delivery(combo.food99Delivery);
      setFood99Coupon(combo.food99Coupon);
      setKeetaFee(combo.keetaFee);
      setKeetaDelivery(combo.keetaDelivery);
      setKeetaCoupon(combo.keetaCoupon);
      setCiVal(combo.ciValue);
    } else {
      setEditingId(null);
      setName('');
      setCategory('Padrão');
      setProfitMargin(15);
      setItems([]);
      setCustomPackagingCost(0);
      
      // Load defaults
      setIfoodFee(ifoodTotalFeeDefault);
      setIfoodDelivery(platformConfig.ifood.delivery);
      setIfoodCoupon(0);
      setFood99Fee(food99TotalFeeDefault);
      setFood99Delivery(platformConfig.food99.delivery);
      setFood99Coupon(0);
      setKeetaFee(keetaTotalFeeDefault);
      setKeetaDelivery(platformConfig.keeta.delivery);
      setKeetaCoupon(0);
      setCiVal(platformConfig.ifood.ciValue);
    }
    setIsModalOpen(true);
  };

  const addItem = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const updateItem = (index: number, field: keyof ComboItem, value: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations Logic - NEW OFFICIAL FORMULA (Denominator)
  const calculateCombo = () => {
    // 1. CMV Combo
    let cmvCombo = 0;
    items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        cmvCombo += getProductCMV(prod) * item.quantity;
      }
    });

    // Add optional custom package/box cost for the combo composition
    cmvCombo += customPackagingCost;

    // 2. PV Loja
    const totalDeductions = (totalCfiPercent + profitMargin) / 100;
    let pvLoja = 0;
    if (totalDeductions < 1) {
       pvLoja = cmvCombo / (1 - totalDeductions);
    }

    // Helper for Marketplace Formula: (PV_Loja + Del + CI + Coupon) / (1 - Fees)
    const calcMarketplace = (base: number, feesPct: number, del: number, ci: number, cpn: number) => {
        const denominator = 1 - (feesPct / 100);
        if (denominator <= 0) return 0;
        return (base + del + ci + cpn) / denominator;
    };

    // 3. PV iFood
    const pvIfood = calcMarketplace(pvLoja, ifoodFee, ifoodDelivery, 0, ifoodCoupon);

    // 4. PV CI
    const pvCi = calcMarketplace(pvLoja, ifoodFee, ifoodDelivery, ciVal, ifoodCoupon);

    // 5. PV 99Food
    const pv99 = calcMarketplace(pvLoja, food99Fee, food99Delivery, 0, food99Coupon);

    // 6. PV Keeta
    const pvKeeta = calcMarketplace(pvLoja, keetaFee, keetaDelivery, 0, keetaCoupon);

    return { cmvCombo, pvLoja, pvIfood, pvCi, pv99, pvKeeta };
  };

  const { cmvCombo, pvLoja, pvIfood, pvCi, pv99, pvKeeta } = calculateCombo();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const payload = {
      name,
      category: category || 'Padrão',
      items,
      profitMargin,
      ifoodFee, 
      food99Fee, 
      keetaFee,
      ifoodDelivery,
      food99Delivery,
      keetaDelivery,
      ifoodCoupon,
      food99Coupon,
      keetaCoupon,
      ciValue: ciVal,
      customPackagingCost
    };

    if (editingId) {
      updateCombo(editingId, payload);
    } else {
      addCombo({ ...payload, id: Date.now().toString() });
    }
    setIsModalOpen(false);
  };

  const handleDuplicateCombo = (combo: Combo) => {
    const duplicatedCombo: Combo = {
      ...combo,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: `${combo.name} (Cópia)`,
      category: combo.category || 'Padrão'
    };
    addCombo(duplicatedCombo);
  };

  return (
    <>
      <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">Combos</h2>
              <button 
                  onClick={() => setShowHelp(!showHelp)} 
                  className="text-gray-400 hover:text-brand-red transition-colors"
                  title="Ajuda"
              >
                  <HelpCircle size={20} />
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Crie estratégias de venda com precificação automática por canal.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleOpenModal()}
              className="bg-brand-red hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 font-bold transition shadow-lg shadow-red-900/20"
            >
              <Plus size={18} /> <span className="hidden sm:inline">NOVO COMBO</span>
            </button>
          </div>
        </div>

        {/* Xande Help / STRATEGIC PACKAGING DILEMMA EXPLAINER */}
        {showHelp && (
          <div className="bg-blue-50 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <HelpCircle size={22} className="text-blue-600 dark:text-blue-400 shrink-0"/>
                <h3 className="font-extrabold uppercase tracking-wider text-sm">Central de Ajuda dos Combos & Soluções do Xande 🎯</h3>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-blue-400 hover:text-blue-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-xs">
              <div className="space-y-3 text-slate-700 dark:text-gray-300">
                <p className="font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Como funciona o cálculo?</p>
                <p>
                  Ao montar um combo, o sistema soma o custo de ingredientes (CMV) de todos os itens cadastrados selecionados. Em seguida, aplica a fórmula base: <br />
                  <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800 dark:text-slate-200">Preço Base = Custo / (1 - (CFI da Empresa % + Margem de Lucro %))</code>.
                </p>
                <p>
                  Para marketplaces, o sistema acrescenta automaticamente as comissões e fretes para que a sua margem de lucro meta seja preservada intacta!
                </p>
              </div>

              <div className="space-y-2 bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base select-none">📦</span>
                  <p className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">Dilema de Embalagem: Kraft vs Caixa de Combo</p>
                </div>
                <p className="text-slate-600 dark:text-gray-400 text-[11px] leading-relaxed italic">
                  "No hambúrguer individual, eu gasto 1 saco Kraft. No combo com 3 lanches, coloco todos juntos em 1 única caixa e não gasta o Kraft. Como fazer?"
                </p>
                <div className="text-slate-700 dark:text-slate-300 space-y-2 text-[11px]">
                  <p><strong>Dica de Precificação de Xande:</strong></p>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>Especulação Conservadora:</strong> Deixe o saco individual na ficha do hambúrguer. A sobra de embalagem não gasta opera como uma "gordura de lucro" para cobrir perdas na cozinha ou molhos extras solicitados pelo cliente.</li>
                    <li><strong>Lógica de Embalagem Customizada:</strong> Você pode informar o custo da caixa especial de combo diretamente no campo <strong className="text-brand-red">Caixa / Ext (R$)</strong> do combo. O valor é acrescido ao custo e precificado corretamente.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 gap-8">
            <button 
                onClick={() => setActiveSubTab('combos')}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${activeSubTab === 'combos' ? 'text-brand-red' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Lista de Combos
                {activeSubTab === 'combos' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-red rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveSubTab('marketplace')}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${activeSubTab === 'marketplace' ? 'text-brand-red' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Configurações de Marketplace
                {activeSubTab === 'marketplace' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-red rounded-t-full"></div>}
            </button>
        </div>

        {/* Barra de Filtro e Busca com Visualização Organizada */}
        {activeSubTab === 'combos' && (
          <div className="flex flex-col lg:flex-row justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              {/* Pesquisa por Nome */}
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-gray-400 select-none">🔍</span>
                <input
                  type="text"
                  placeholder="Pesquisar combo pelo nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-brand-red outline-none text-gray-900 dark:text-white placeholder:opacity-50"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="absolute right-3.5 top-3 text-xs font-bold text-gray-400 hover:text-brand-red transition-colors"
                  >
                    limpar
                  </button>
                )}
              </div>

              {/* Filtro por Categoria */}
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest hidden md:inline shrink-0">Filtrar Categoria:</span>
                <select
                  value={selectedViewCategory}
                  onChange={(e) => setSelectedViewCategory(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-brand-red text-gray-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="Todos">📁 Mostrar Todos</option>
                  {comboCategories.map((cat) => (
                    <option key={cat} value={cat}>📁 {cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gerenciar Categorias de Combos de forma intuitiva */}
            <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100 dark:border-gray-800 shrink-0">
              <input
                type="text"
                placeholder="Criar nova categoria..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-xs w-48 focus:ring-2 focus:ring-brand-red text-gray-900 dark:text-white font-medium outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const cleaned = newCategoryName.trim();
                    if (cleaned && !comboCategories.includes(cleaned)) {
                      setComboCategories([...comboCategories, cleaned]);
                      setNewCategoryName('');
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const cleaned = newCategoryName.trim();
                  if (cleaned && !comboCategories.includes(cleaned)) {
                    setComboCategories([...comboCategories, cleaned]);
                    setNewCategoryName('');
                  }
                }}
                className="bg-brand-red/10 hover:bg-brand-red text-brand-red hover:text-white px-4 py-2.5 rounded-xl text-xs font-black transition active:scale-95 uppercase tracking-wider shrink-0"
              >
                + Categorizar
              </button>
              <button
                onClick={() => setIsManageCategoriesOpen(true)}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-xs font-black transition active:scale-95 uppercase tracking-wider shrink-0 mr-1"
                title="Editar ou excluir categorias existentes"
              >
                ⚙️ Gerenciar
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'combos' ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-[#0f111a] text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                      <th className="px-6 py-4">Nome do Combo</th>
                      <th className="px-6 py-4 text-center">Itens</th>
                      <th className="px-6 py-4 text-center">Lucro Estim.</th>
                      <th className="px-6 py-4 text-right">CMV Combo</th>
                      <th className="px-6 py-4 text-right">PV Loja</th>
                      <th className="px-6 py-4 text-right text-[#E53935]">PV iFood</th>
                      <th className="px-6 py-4 text-right text-[#B71C1C]">PV CI</th>
                      <th className="px-6 py-4 text-right text-[#FBC02D]">PV 99</th>
                      <th className="px-6 py-4 text-right text-[#43A047]">PV Keeta</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {(() => {
                    const searchedCombos = (combos || []).filter(combo => 
                      combo.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    const categoriesToDisplay = selectedViewCategory === 'Todos'
                      ? Array.from(new Set(searchedCombos.map(c => c.category || 'Padrão')))
                      : [selectedViewCategory];

                    const displayedCombosCount = searchedCombos.filter(combo => 
                      selectedViewCategory === 'Todos' || (combo.category || 'Padrão') === selectedViewCategory
                    ).length;

                    if ((combos || []).length === 0) {
                      return (
                        <tr>
                            <td colSpan={10} className="px-6 py-8 text-center text-gray-500 font-medium">Nenhum combo cadastrado. Clique em &quot;NOVO COMBO&quot; para montar o seu primeiro combo!</td>
                        </tr>
                      );
                    }

                    if (displayedCombosCount === 0) {
                      return (
                        <tr>
                            <td colSpan={10} className="px-6 py-8 text-center text-gray-500 font-medium">Nenhum combo encontrado para os filtros selecionados.</td>
                        </tr>
                      );
                    }

                    return categoriesToDisplay.map(cat => {
                      const categoryCombos = searchedCombos.filter(c => (c.category || 'Padrão') === cat);
                      if (categoryCombos.length === 0) return null;

                      return (
                        <React.Fragment key={cat}>
                          <tr className="bg-gray-50/70 dark:bg-[#0d1017]/85 border-y border-gray-100 dark:border-gray-800/60 select-none">
                            <td colSpan={10} className="px-6 py-2.5 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              <span className="mr-1">📁</span> Categoria: <span className="text-brand-red font-black">{cat}</span> <span className="text-[10px] opacity-70">({categoryCombos.length} {categoryCombos.length === 1 ? 'combo' : 'combos'})</span>
                            </td>
                          </tr>
                          {categoryCombos.map(combo => {
                            let cmv = 0;
                            (combo.items || []).forEach(i => {
                                const p = products.find(prod => prod.id === i.productId);
                                if(p) cmv += getProductCMV(p) * i.quantity;
                            });
                            
                            const deductions = (totalCfiPercent + combo.profitMargin) / 100;
                            const pvLojaVal = deductions < 1 ? cmv / (1 - deductions) : 0;
                            
                            const calcMarketplace = (base: number, feesPct: number, del: number, ci: number, cpn: number) => {
                                const denominator = 1 - (feesPct / 100);
                                if (denominator <= 0) return 0;
                                return (base + del + ci + cpn) / denominator;
                            };

                            const pvIfoodVal = calcMarketplace(pvLojaVal, combo.ifoodFee, combo.ifoodDelivery, 0, combo.ifoodCoupon);
                            const pvCiVal = calcMarketplace(pvLojaVal, combo.ifoodFee, combo.ifoodDelivery, combo.ciValue, combo.ifoodCoupon);
                            const pv99Val = calcMarketplace(pvLojaVal, combo.food99Fee, combo.food99Delivery, 0, combo.food99Coupon);
                            const pvKeetaVal = calcMarketplace(pvLojaVal, combo.keetaFee, combo.keetaDelivery, 0, combo.keetaCoupon);

                            return (
                              <tr key={combo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                      {combo.name}
                                      {combo.category && combo.category !== 'Padrão' && (
                                        <span className="text-[9px] bg-red-50 dark:bg-red-950/30 text-brand-red px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                          {combo.category}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{(combo.items || []).length}</td>
                                  <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{formatPercent(combo.profitMargin)}</td>
                                  <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-300">R$ {cmv.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-white">R$ {pvLojaVal.toFixed(2)}</td>
                                  
                                  <td className="px-6 py-4 text-right font-mono font-bold text-[#E53935]">R$ {pvIfoodVal.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right font-mono font-bold text-[#B71C1C]">R$ {pvCiVal.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right font-mono font-bold text-[#FBC02D]">R$ {pv99Val.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right font-mono font-bold text-[#43A047]">R$ {pvKeetaVal.toFixed(2)}</td>
 
                                  <td className="px-6 py-4 flex justify-center gap-3">
                                    <button onClick={() => handleOpenModal(combo)} className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" title="Editar"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDuplicateCombo(combo)} className="text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300" title="Duplicar"><Copy size={16} /></button>
                                    <button onClick={() => deleteCombo(combo.id)} className="text-gray-400 hover:text-red-500" title="Excluir"><Trash size={16} /></button>
                                  </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Marketplace Help Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Configurações Globais de Marketplace</h3>
                <button 
                  onClick={() => setShowMarketplaceHelp(!showMarketplaceHelp)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-pink-500"
                  title="Ajuda Marketplace"
                >
                  <HelpCircle size={18} />
                </button>
              </div>
            </div>

            {showMarketplaceHelp && (
              <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-pink-700 dark:text-pink-400">
                    <HelpCircle size={20} />
                    <h2 className="font-bold uppercase tracking-wider text-sm">Guia: Configurações de Marketplace</h2>
                  </div>
                  <button onClick={() => setShowMarketplaceHelp(false)} className="text-pink-400 hover:text-pink-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-pink-800 dark:text-pink-300 uppercase">O que são estas taxas?</p>
                    <p className="text-xs text-pink-600/80 dark:text-pink-400/70 leading-relaxed">
                      Estas são as taxas padrão cobradas pelas plataformas. Elas serão usadas como base para calcular o preço sugerido de todos os seus combos nos aplicativos.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-pink-800 dark:text-pink-300 uppercase">Comissão vs Pagamento Online</p>
                    <p className="text-xs text-pink-600/80 dark:text-pink-400/70 leading-relaxed">
                      A <strong>Comissão</strong> é o valor do plano (ex: 12% ou 23%). O <strong>Pagamento Online</strong> é a taxa extra para transações feitas pelo app (ex: 3.2%). O sistema soma ambas para garantir sua margem.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-pink-100 dark:border-pink-800/30 text-[10px] font-bold text-pink-500 uppercase">
                  Dica: Mantenha estes valores atualizados conforme seu contrato com o iFood/99Food para evitar prejuízos.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* iFood Global */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#E53935] rounded-lg flex items-center justify-center text-white font-bold">iF</div>
                      <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest">iFood Global</h4>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Comissão Base (%)</label>
                          <input 
                            type="number" 
                            value={platformConfig.ifood.fee} 
                            onChange={e => updatePlatformConfig({ ifood: { ...platformConfig.ifood, fee: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Pagamento Online (%)</label>
                          <input 
                            type="number" 
                            value={platformConfig.ifood.onlinePayment} 
                            onChange={e => updatePlatformConfig({ ifood: { ...platformConfig.ifood, onlinePayment: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Antecipação (%)</label>
                          <input 
                            type="number" 
                            value={platformConfig.ifood.anticipation} 
                            onChange={e => updatePlatformConfig({ ifood: { ...platformConfig.ifood, anticipation: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Taxa de Entrega Padrão (R$)</label>
                          <input 
                            type="number" 
                            value={platformConfig.ifood.delivery} 
                            onChange={e => updatePlatformConfig({ ifood: { ...platformConfig.ifood, delivery: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Custo Fixo CI (R$)</label>
                          <input 
                            type="number" 
                            value={platformConfig.ifood.ciValue} 
                            onChange={e => updatePlatformConfig({ ifood: { ...platformConfig.ifood, ciValue: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                  </div>
              </div>

              {/* 99Food Global */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#FBC02D] rounded-lg flex items-center justify-center text-white font-bold">99</div>
                      <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest">99Food Global</h4>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Comissão Base (%)</label>
                          <input 
                            type="number" 
                            value={platformConfig.food99.fee} 
                            onChange={e => updatePlatformConfig({ food99: { ...platformConfig.food99, fee: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Pagamento Online (%)</label>
                          <input 
                            type="number" 
                            value={platformConfig.food99.onlinePayment} 
                            onChange={e => updatePlatformConfig({ food99: { ...platformConfig.food99, onlinePayment: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Taxa de Entrega Padrão (R$)</label>
                          <input 
                            type="number" 
                            value={platformConfig.food99.delivery} 
                            onChange={e => updatePlatformConfig({ food99: { ...platformConfig.food99, delivery: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                  </div>
              </div>

              {/* Keeta Global */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#43A047] rounded-lg flex items-center justify-center text-white font-bold">KT</div>
                      <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest">KeeTa Global</h4>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Comissão Base (%)</label>
                          <input 
                            type="number" 
                            value={platformConfig.keeta.fee} 
                            onChange={e => updatePlatformConfig({ keeta: { ...platformConfig.keeta, fee: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Pagamento Online (%)</label>
                          <input 
                            type="number" 
                            value={platformConfig.keeta.onlinePayment} 
                            onChange={e => updatePlatformConfig({ keeta: { ...platformConfig.keeta, onlinePayment: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Taxa de Entrega Padrão (R$)</label>
                          <input 
                            type="number" 
                            value={platformConfig.keeta.delivery} 
                            onChange={e => updatePlatformConfig({ keeta: { ...platformConfig.keeta, delivery: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-900 dark:text-white font-bold" 
                          />
                      </div>
                  </div>
              </div>
          </div>
        </div>
        )}
      </div>

      {/* Editor Modal - GLOBAL LEVEL / TRUE FULL SCREEN */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[9999]"
          onClick={() => setIsModalOpen(false)}
        >
           <div 
              className="bg-white dark:bg-[#111827] w-full h-full flex flex-col relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
           >
              
              {/* Header Fixado */}
              <div className="p-5 sm:p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 bg-gray-50 dark:bg-[#0f111a]">
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase flex items-center gap-3">
                    <div className="bg-brand-red p-2 rounded-lg text-white">
                      <ShoppingBag size={24} />
                    </div>
                    {editingId ? 'Editar Combo' : 'Montar Novo Combo'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-red transition-colors p-2" aria-label="Fechar modal">
                    <X size={40} strokeWidth={2.5}/>
                 </button>
              </div>

              {/* Corpo com Rolagem */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-12 space-y-12 max-w-7xl mx-auto w-full">
                 
                 {/* LINHA 1: Nome, Categoria e Lucro */}
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-2 block">Nome Comercial do Combo</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-5 text-lg focus:ring-2 focus:ring-brand-red outline-none font-bold placeholder:opacity-30" placeholder="Ex: Combo Monstruoso 2.0" />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-2 block font-black flex items-center justify-between">
                          <span>Categoria do Combo</span>
                        </label>
                        <select 
                          value={category} 
                          onChange={e => setCategory(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-5 text-lg focus:ring-2 focus:ring-brand-red outline-none font-bold"
                        >
                          {comboCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-2 block">Margem Meta (%)</label>
                        <input type="number" step="0.1" value={profitMargin} onChange={e => setProfitMargin(parseFloat(e.target.value) || 0)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-5 text-lg focus:ring-2 focus:ring-brand-red outline-none font-bold text-center" />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-black tracking-widest mb-2 block flex items-center justify-between">
                           <span>Caixa / Ext (R$)</span>
                           <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-bold lowercase">opcional</span>
                        </label>
                        <input type="number" step="0.05" value={customPackagingCost || ''} onChange={e => setCustomPackagingCost(parseFloat(e.target.value) || 0)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-5 text-xl focus:ring-2 focus:ring-brand-red outline-none font-bold text-center" placeholder="0,00" />
                    </div>
                 </div>

                 {/* LINHA 2: Indicadores Principais */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-black block mb-2 tracking-tighter">Variedade de Itens</span>
                        <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{items.length}</span>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-black block mb-2 tracking-tighter">CFI Global Aplicado</span>
                        <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{formatPercent(totalCfiPercent)}</span>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-black block mb-2 tracking-tighter">Custo Total de Produção</span>
                        <span className="text-3xl font-black text-brand-red">R$ {cmvCombo.toFixed(2)}</span>
                     </div>
                     <div className="bg-brand-red p-6 rounded-2xl shadow-2xl shadow-red-900/30 relative overflow-hidden transition-transform hover:scale-[1.02]">
                         <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
                        <span className="text-[11px] text-white/80 uppercase font-black block relative z-10 mb-2 tracking-tighter">Preço Recomendado (Loja)</span>
                        <span className="text-4xl font-black text-white relative z-10">R$ {pvLoja.toFixed(2)}</span>
                     </div>
                 </div>

                 {/* LINHA 3: Items Table */}
                 <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gray-50 dark:bg-[#0f111a] px-8 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                       <h4 className="text-base font-black text-gray-900 dark:text-white uppercase flex items-center gap-3 tracking-widest">
                          <ChefHat size={20} className="text-brand-red"/> Composição do Combo
                       </h4>
                       <button onClick={addItem} className="bg-brand-red hover:bg-red-700 text-white px-8 py-3 rounded-xl transition flex items-center gap-3 font-black shadow-xl shadow-red-900/20 uppercase text-xs tracking-widest">
                          <Plus size={18} /> Incluir Produto
                       </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                           <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[11px] uppercase font-black tracking-[0.2em]">
                              <tr>
                                 <th className="px-8 py-5">Produto do Cardápio</th>
                                 <th className="px-8 py-5 text-center w-40">Quantidade</th>
                                 <th className="px-8 py-5 text-right">CMV Unitário</th>
                                 <th className="px-8 py-5 text-right">Subtotal CMV</th>
                                 <th className="px-8 py-5 w-20"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                              {items.map((item, idx) => {
                                 const product = products.find(p => p.id === item.productId);
                                 const cmvUnit = product ? getProductCMV(product) : 0;
                                 
                                 return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                       <td className="px-8 py-6">
                                          <select 
                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-base p-4 rounded-xl w-full outline-none focus:ring-2 focus:ring-brand-red font-bold"
                                            value={item.productId}
                                            onChange={e => updateItem(idx, 'productId', e.target.value)}
                                          >
                                             {(products || []).map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                             ))}
                                          </select>
                                       </td>
                                       <td className="px-8 py-6 text-center">
                                          <input 
                                            type="number" 
                                            min="1"
                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xl p-4 rounded-xl w-32 text-center outline-none focus:ring-2 focus:ring-brand-red font-black"
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                          />
                                       </td>
                                       <td className="px-8 py-6 text-right text-gray-500 font-mono font-bold text-base">R$ {cmvUnit.toFixed(2)}</td>
                                       <td className="px-8 py-6 text-right text-gray-900 dark:text-gray-100 font-mono font-black text-xl">R$ {(cmvUnit * item.quantity).toFixed(2)}</td>
                                       <td className="px-8 py-6 text-center">
                                          <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-3" aria-label="Remover item">
                                            <Trash size={24} />
                                          </button>
                                       </td>
                                    </tr>
                                 );
                              })}
                              {items.length === 0 && (
                                 <tr><td colSpan={5} className="px-8 py-24 text-center text-gray-500 italic text-lg opacity-40">Clique no botão acima para selecionar os itens que compõem este combo.</td></tr>
                              )}
                           </tbody>
                        </table>
                    </div>
                 </div>

                 {/* LINHAS MARKETPLACES */}
                 <div className="space-y-8 pt-12 border-t border-gray-200 dark:border-gray-800">
                     <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] mb-6 text-center">Simulação de Vendas nos Apps</h4>
                     
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* iFood Official */}
                        <div className="bg-red-50/30 dark:bg-red-950/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/30 flex flex-col justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-8">
                                <div>
                                    <label className="text-[10px] text-red-600 dark:text-red-400 uppercase font-black mb-1 block">Taxa iFood (%)</label>
                                    <input type="number" step="0.1" value={ifoodFee} onChange={e => setIfoodFee(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-red-600 dark:text-red-400 uppercase font-black mb-1 block">Taxa Entrega (R$)</label>
                                    <input type="number" step="0.01" value={ifoodDelivery} onChange={e => setIfoodDelivery(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-red-600 dark:text-red-400 uppercase font-black mb-1 block">Cupom Loja (R$)</label>
                                    <input type="number" step="0.01" value={ifoodCoupon} onChange={e => setIfoodCoupon(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                                </div>
                            </div>
                            <div className="bg-[#E53935] p-6 rounded-2xl text-center shadow-2xl shadow-red-900/40">
                                <span className="text-xs text-white/70 uppercase font-black block mb-1 tracking-widest">Preço para iFood (Oficial)</span>
                                <span className="text-4xl font-black text-white">R$ {pvIfood.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* iFood CI */}
                        <div className="bg-purple-50/30 dark:bg-purple-950/10 p-8 rounded-3xl border border-purple-100 dark:border-purple-900/30 flex flex-col justify-between">
                            <div className="mb-8">
                                <label className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-black mb-1 block">Custo Fixo CI (R$)</label>
                                <input type="number" step="0.01" value={ciVal} onChange={e => setCiVal(parseFloat(e.target.value))} className="w-full md:w-1/2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-purple-500 outline-none font-bold" />
                                <p className="text-[10px] text-purple-500 italic mt-3">*Considerando as mesmas taxas e entrega informadas no card ao lado.</p>
                            </div>
                            <div className="bg-[#B71C1C] p-6 rounded-2xl text-center shadow-2xl shadow-purple-900/40">
                                <span className="text-xs text-white/70 uppercase font-black block mb-1 tracking-widest">Preço para iFood com CI</span>
                                <span className="text-4xl font-black text-white">R$ {pvCi.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* 99Food */}
                        <div className="bg-yellow-50/30 dark:bg-yellow-950/10 p-8 rounded-3xl border border-yellow-100 dark:border-yellow-900/30 flex flex-col justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-8">
                                <div>
                                    <label className="text-[10px] text-yellow-600 dark:text-yellow-400 uppercase font-black mb-1 block">Taxa 99Food (%)</label>
                                    <input type="number" step="0.1" value={food99Fee} onChange={e => setFood99Fee(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-yellow-200 dark:border-yellow-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-yellow-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-yellow-600 dark:text-yellow-400 uppercase font-black mb-1 block">Taxa Entrega (R$)</label>
                                    <input type="number" step="0.01" value={food99Delivery} onChange={e => setFood99Delivery(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-yellow-200 dark:border-yellow-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-yellow-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-yellow-600 dark:text-yellow-400 uppercase font-black mb-1 block">Cupom Loja (R$)</label>
                                    <input type="number" step="0.01" value={food99Coupon} onChange={e => setFood99Coupon(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-yellow-200 dark:border-yellow-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-yellow-500 outline-none font-bold" />
                                </div>
                            </div>
                            <div className="bg-[#FBC02D] p-6 rounded-2xl text-center shadow-2xl shadow-yellow-900/40">
                                <span className="text-xs text-white/70 uppercase font-black block mb-1 tracking-widest">Preço para 99Food</span>
                                <span className="text-4xl font-black text-white">R$ {pv99.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Keeta */}
                        <div className="bg-green-50/30 dark:bg-green-950/10 p-8 rounded-3xl border border-green-100 dark:border-green-900/30 flex flex-col justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-8">
                                <div>
                                    <label className="text-[10px] text-green-600 dark:text-green-400 uppercase font-black mb-1 block">Taxa KeeTa (%)</label>
                                    <input type="number" step="0.1" value={keetaFee} onChange={e => setKeetaFee(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-green-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-green-600 dark:text-green-400 uppercase font-black mb-1 block">Taxa Entrega (R$)</label>
                                    <input type="number" step="0.01" value={keetaDelivery} onChange={e => setKeetaDelivery(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-green-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-green-600 dark:text-green-400 uppercase font-black mb-1 block">Cupom Loja (R$)</label>
                                    <input type="number" step="0.01" value={keetaCoupon} onChange={e => setKeetaCoupon(parseFloat(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 text-gray-900 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-green-500 outline-none font-bold" />
                                </div>
                            </div>
                            <div className="bg-[#43A047] p-6 rounded-2xl text-center shadow-2xl shadow-green-900/40">
                                <span className="text-xs text-white/70 uppercase font-black block mb-1 tracking-widest">Preço para KeeTa (Oficial)</span>
                                <span className="text-4xl font-black text-white">R$ {pvKeeta.toFixed(2)}</span>
                            </div>
                        </div>
                     </div>

                 </div>

              </div>
              
              {/* Rodapé Fixado com Botões Gigantes */}
              <div className="p-6 sm:p-10 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-6 shrink-0 bg-white dark:bg-[#0f111a]">
                 <button onClick={() => setIsModalOpen(false)} className="px-12 py-5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-black uppercase tracking-widest text-sm transition-all transform active:scale-95">Descartar</button>
                 <button onClick={handleSave} className="px-16 py-5 rounded-2xl bg-brand-red hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-900/40 transition-all transform hover:scale-[1.03] active:scale-95">Salvar Combo e Preços</button>
              </div>

           </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Categorias de Combos */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
            {/* Cabeçalho */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between bg-gray-50 dark:bg-[#0f111a]">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">Gerenciar Categorias</h3>
              </div>
              <button 
                onClick={() => {
                  setIsManageCategoriesOpen(false);
                  setEditingCategoryIndex(null);
                }} 
                className="text-gray-400 hover:text-brand-red transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Fechar modal"
              >
                <X size={20} strokeWidth={2.5}/>
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aqui você pode renomear ou excluir as categorias dos seus combos de forma permanente. As categorias <strong className="text-brand-red">Padrão</strong> e <strong className="text-brand-red">Dados Importados</strong> são vitais e não podem ser excluídas.
              </p>

              <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-b border-gray-100 dark:border-gray-800">
                {comboCategories.map((cat, idx) => {
                  const isEssential = cat === 'Padrão' || cat === 'Dados Importados';
                  const isEditing = editingCategoryIndex === idx;

                  // Conta quantos combos estão nessa categoria atualmente
                  const comboCount = (combos || []).filter(c => (c.category || 'Padrão') === cat).length;

                  return (
                    <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                      {isEditing ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-brand-red outline-none font-bold flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameCategory(idx, editingCategoryName);
                              if (e.key === 'Escape') setEditingCategoryIndex(null);
                            }}
                          />
                          <button
                            onClick={() => handleRenameCategory(idx, editingCategoryName)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingCategoryIndex(null)}
                            className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                              {cat}
                              {isEssential && (
                                <span className="text-[9px] bg-red-50 dark:bg-red-950/30 text-brand-red px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                  Sistema
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              {comboCount} {comboCount === 1 ? 'combo associado' : 'combos associados'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setEditingCategoryIndex(idx);
                                setEditingCategoryName(cat);
                              }}
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                              title="Renomear categoria"
                            >
                              <Edit2 size={16} />
                            </button>
                            {!isEssential && (
                              <button
                                onClick={() => handleDeleteCategory(idx)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                title="Excluir categoria"
                              >
                                <Trash size={16} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rodapé */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0f111a] flex justify-end">
              <button
                onClick={() => {
                  setIsManageCategoriesOpen(false);
                  setEditingCategoryIndex(null);
                }}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs uppercase tracking-wider transition active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Combos;
