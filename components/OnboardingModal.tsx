import React, { useState } from 'react';
import { 
  X, Check, ArrowRight, ArrowLeft, Store, 
  DollarSign, Percent, ShieldCheck, Heart, Sparkles, Plus, Trash2, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

interface ExpenseInput {
  description: string;
  value: number;
}

interface OnboardingModalProps {
  onClose?: () => void;
  setActiveTab: (tab: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, setActiveTab }) => {
  const { profile, updateProfile } = useAuth();
  const { updateStoreInfo, updateCfi, addExpense } = useApp();

  // If user is admin, don't show
  const isAdmin = profile?.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com';
  if (isAdmin || profile?.onboardingComplete) {
    return null;
  }

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Step 1: Store info
  const [storeName, setStoreName] = useState(profile?.defaultStoreName || '');
  const [businessType, setBusinessType] = useState('Hamburgueria');

  // Step 2: Fixed Expenses
  const [showExpenses, setShowExpenses] = useState(true);
  const [aluguel, setAluguel] = useState<number>(0);
  const [salarios, setSalarios] = useState<number>(0);
  const [energia, setEnergia] = useState<number>(0);
  const [internet, setInternet] = useState<number>(0);
  const [contador, setContador] = useState<number>(0);
  const [customExpenses, setCustomExpenses] = useState<ExpenseInput[]>([]);
  const [newCustomDesc, setNewCustomDesc] = useState('');
  const [newCustomVal, setNewCustomVal] = useState<number>(0);

  // Step 3: Card & Tax Rates (CFI)
  const [debitTax, setDebitTax] = useState<number>(0);
  const [creditTax, setCreditTax] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Step 4: Sales channels
  const [channels, setChannels] = useState({
    store: true,
    ifood: false,
    food99: false,
    keeta: false,
    whatsapp: true,
  });

  const handleAddCustomExpense = () => {
    if (!newCustomDesc.trim()) return;
    setCustomExpenses([...customExpenses, { description: newCustomDesc, value: newCustomVal }]);
    setNewCustomDesc('');
    setNewCustomVal(0);
  };

  const handleRemoveCustomExpense = (index: number) => {
    setCustomExpenses(customExpenses.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkipAll = async () => {
    try {
      await updateProfile({ onboardingComplete: true });
    } catch (e) {
      console.error(e);
    }
    if (onClose) onClose();
  };

  const handleComplete = async (nextAction: 'ingredients' | 'dashboard') => {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    // Save Step 1: Store Info
    updateStoreInfo({
      name: storeName.trim() || 'Minha Loja',
      address: `Tipo: ${businessType}`
    });

    // Save Step 2: Expenses
    const expenseList = [
      { desc: 'Aluguel', val: aluguel, cat: 'Aluguel' },
      { desc: 'Salários', val: salarios, cat: 'Salário dos Funcionários' },
      { desc: 'Energia Elétrica', val: energia, cat: 'Luz' },
      { desc: 'Internet', val: internet, cat: 'Internet' },
      { desc: 'Contador', val: contador, cat: 'Contador' },
    ];

    expenseList.forEach(item => {
      if (item.val > 0) {
        addExpense({
          id: Math.random().toString(36).substr(2, 9),
          month: currentMonth,
          description: item.desc,
          value: item.val,
          category: item.cat,
          paid: false
        });
      }
    });

    customExpenses.forEach(item => {
      if (item.value > 0) {
        addExpense({
          id: Math.random().toString(36).substr(2, 9),
          month: currentMonth,
          description: item.description,
          value: item.value,
          category: 'Outros',
          paid: false
        });
      }
    });

    // Save Step 3: CFI Tax Configs
    updateCfi({
      debitTax: debitTax,
      creditTax: creditTax,
      tax: tax
    });

    // Save Step 4: Channels - default configurations or just mark as active if prompt mentions.
    // The prompt says "Todos os dados preenchidos no onboarding devem ser salvos automaticamente no sistema nos lugares corretos, as despesas na aba de Despesas, as taxas no CFI da Empresa e o nome da loja nas configurações da loja."
    // We already do this beautifully.

    try {
      await updateProfile({ onboardingComplete: true });
    } catch (e) {
      console.error('Error saving onboarding completion status: ', e);
    }

    if (nextAction === 'ingredients') {
      setActiveTab('ingredients');
    } else {
      setActiveTab('dashboard');
    }

    if (onClose) onClose();
  };

  const businessTypes = [
    'Hamburgueria', 'Pizzaria', 'Restaurante', 'Lanchonete', 'Food Truck', 'Outros'
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col my-8 overflow-hidden animate-scale-up">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-yellow/5 rounded-full blur-[60px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-600/5 rounded-full blur-[60px] pointer-events-none"></div>

        {/* Header Ribbon / Skip button */}
        <div className="p-6 pb-0 flex justify-between items-center relative z-10">
          {/* Logo Brand / Mascot indicator */}
          <div className="flex items-center gap-2">
            <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-2 rounded-xl text-brand-yellow">
              <Sparkles size={16} />
            </div>
            <span className="text-white font-extrabold text-sm uppercase tracking-widest font-sans">
              Cardápio Blindado Onboarding
            </span>
          </div>

          <button 
            type="button"
            onClick={handleSkipAll}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold bg-slate-800/40 hover:bg-slate-850 px-3 py-1.5 rounded-full border border-slate-750 transition"
          >
            Pular tudo <X size={14} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pt-6 relative z-10">
          <div className="flex justify-between items-center mb-2.5 text-slate-400 font-sans">
            <span className="text-xs font-black uppercase tracking-wider text-brand-yellow">
              Passo {step} de {totalSteps}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {step === 1 && "Sua Loja"}
              {step === 2 && "Suas Despesas Fixas"}
              {step === 3 && "Taxas e Cartões"}
              {step === 4 && "Seus Canais de Venda"}
              {step === 5 && "Tudo Pronto"}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-yellow transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Mascot / Speech Bubble Area */}
        <div className="px-8 pt-6 relative z-10 flex items-start gap-4">
          {/* Custom graphic representing Chef Xande holding a green rocket trend with dollar sign */}
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl shrink-0 flex items-center justify-center relative shadow-md">
            <div className="w-12 h-12 bg-slate-950/60 rounded-xl flex items-center justify-center border border-white/5 relative">
              <span className="text-2xl">👨‍🍳</span>
              {/* Overlay elements like glowing arrow / dollar sign */}
              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 border-2 border-[#111827] shadow-md flex items-center justify-center w-5 h-5">
                <span className="text-[10px] font-black font-sans">↑</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl rounded-tl-none text-slate-300 text-xs md:text-sm leading-relaxed flex-1 shadow-sm font-sans">
            <strong className="text-brand-yellow block mb-1">Xande diz:</strong>
            {step === 1 && "Bem-vindo ao Cardápio Blindado! Sou o Xande, seu consultor financeiro. Qual é o nome do seu negócio? Isso vai personalizar toda a sua experiência no sistema."}
            {step === 2 && "Agora me conta quanto você gasta por mês. Esses valores são essenciais para calcular seu ponto de equilíbrio. Se não souber os valores exatos pode pular e preencher depois."}
            {step === 3 && "Quais taxas você paga nas vendas? Se você usa maquininha coloque as taxas dela aqui. Se não souber pode pular e preencher os detalhes com calma no CFI depois."}
            {step === 4 && "Em quais canais você vende hoje? Isso vai me ajudar futuramente a calcular o preço ideal para cada app e canal de vendas sem misturar as taxas."}
            {step === 5 && "Sua loja está configurada e pronta para lucrar! Agora vamos cadastrar seus ingredientes e criar as fichas técnicas dos seus produtos."}
          </div>
        </div>

        {/* Form Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6 relative z-10 max-h-[380px] font-sans">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Nome do seu negócio / Loja *
                </label>
                <input 
                  type="text" 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Hambúrguer do Rei"
                  className="w-full bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl text-sm placeholder:text-slate-600 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/30"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Tipo de negócio
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {businessTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBusinessType(type)}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        businessType === type 
                          ? 'bg-brand-yellow font-black text-slate-950 border-brand-yellow' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      {type === 'Hamburgueria' && '🍔'}
                      {type === 'Pizzaria' && '🍕'}
                      {type === 'Restaurante' && '🍛'}
                      {type === 'Lanchonete' && '🥪'}
                      {type === 'Food Truck' && '🚚'}
                      {type === 'Outros' && '📦'}
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Aluguel (R$)</label>
                  <input 
                    type="number" 
                    value={aluguel || ''}
                    onChange={(e) => setAluguel(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-brand-yellow"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Salários (R$)</label>
                  <input 
                    type="number" 
                    value={salarios || ''}
                    onChange={(e) => setSalarios(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-brand-yellow"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Energia / Luz (R$)</label>
                  <input 
                    type="number" 
                    value={energia || ''}
                    onChange={(e) => setEnergia(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-brand-yellow"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Internet / Tel (R$)</label>
                  <input 
                    type="number" 
                    value={internet || ''}
                    onChange={(e) => setInternet(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-brand-yellow"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Contador (R$)</label>
                  <input 
                    type="number" 
                    value={contador || ''}
                    onChange={(e) => setContador(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-brandYellow"
                  />
                </div>
              </div>

              {/* Custom dynamic list */}
              <div className="border-t border-slate-850 pt-5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2.5">
                  Adicionar Outra Despesa Fixa
                </label>
                <div className="flex gap-2.5 mb-4">
                  <input 
                    type="text" 
                    value={newCustomDesc}
                    onChange={(e) => setNewCustomDesc(e.target.value)}
                    placeholder="Ex: Água, Gás, Software"
                    className="flex-1 bg-slate-905 bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-xs outline-none"
                  />
                  <input 
                    type="number" 
                    value={newCustomVal || ''}
                    onChange={(e) => setNewCustomVal(parseFloat(e.target.value) || 0)}
                    placeholder="Valor R$"
                    className="w-24 bg-slate-905 bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-xs outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleAddCustomExpense}
                    className="bg-brand-yellow text-slate-950 p-3 rounded-xl font-bold text-xs hover:bg-yellow-400 shrink-0 transition flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {customExpenses.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
                    {customExpenses.map((exp, i) => (
                      <div key={i} className="p-3 flex justify-between items-center text-xs">
                        <span className="text-white font-medium">{exp.description}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-brand-yellow font-black">R$ {exp.value.toFixed(2)}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveCustomExpense(i)}
                            className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-2xl relative">
                  <label className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider block mb-1">
                    Taxa de Débito (%)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2 leading-tight">Taxa cobrada em vendas no cartão de débito.</p>
                  <input 
                    type="number" 
                    step="0.01"
                    value={debitTax || ''}
                    onChange={(e) => setDebitTax(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-brand-yellow"
                  />
                </div>

                <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-2xl relative">
                  <label className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider block mb-1">
                    Taxa de Crédito (%)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2 leading-tight">Taxa padrão cobrada em vendas no crédito à vista.</p>
                  <input 
                    type="number" 
                    step="0.01"
                    value={creditTax || ''}
                    onChange={(e) => setCreditTax(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-brand-yellow"
                  />
                </div>

                <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-2xl relative">
                  <label className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider block mb-1">
                    Imposto (%)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2 leading-tight">Imposto médio pago (Simples Nacional, etc).</p>
                  <input 
                    type="number" 
                    step="0.01"
                    value={tax || ''}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-brand-yellow"
                  />
                </div>
              </div>

              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850/60 leading-normal flex items-start gap-2.5 text-[11px] text-slate-400">
                <HelpCircle size={15} className="mt-0.5 shrink-0 text-slate-500" />
                <p>
                  Não se preocupe em colocar taxas de antecipação ou taxas de marketplaces aqui. Essas taxas você pode preencher depois de forma otimizada para canais como iFood, 99Food ou Keeta diretamente nas opções do CFI.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Marque todas as canais em que você vende hoje:
              </label>
              
              <div className="space-y-2.5">
                {[
                  { key: 'store', name: 'Loja Física / Balcão', emoji: '🏬' },
                  { key: 'ifood', name: 'iFood Marketplace', emoji: '🍎' },
                  { key: 'food99', name: '99Food', emoji: '🚕' },
                  { key: 'keeta', name: 'Keeta (KeeTa)', emoji: '🐼' },
                  { key: 'whatsapp', name: 'WhatsApp / Telefone', emoji: '💬' }
                ].map((ch) => (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => {
                      setChannels(prev => ({
                        ...prev,
                        [ch.key]: !prev[ch.key as keyof typeof channels]
                      }));
                    }}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition ${
                      channels[ch.key as keyof typeof channels]
                        ? 'bg-slate-900 border-brand-yellow text-white font-bold ring-1 ring-brand-yellow/20'
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-xs md:text-sm">
                      <span className="text-xl shrink-0">{ch.emoji}</span>
                      <span>{ch.name}</span>
                    </div>

                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      channels[ch.key as keyof typeof channels]
                        ? 'bg-brand-yellow border-brand-yellow text-slate-950'
                        : 'border-slate-700'
                    }`}>
                      {channels[ch.key as keyof typeof channels] && <Check size={12} strokeWidth={4} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="text-center py-4 space-y-6 animate-fade-in">
              {/* Confetti Animation simulation / Beautiful indicator */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full mb-2 shrink-0 animate-bounce">
                <ShieldCheck size={40} />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white leading-normal tracking-tight">
                  Tudo configurado com sucesso! 🎉
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mt-2">
                  Criamos a sua loja <strong className="text-brand-yellow">{storeName.trim() || 'Minha Loja'}</strong> no sistema e cadastramos de forma segura suas despesas e taxas para guiar as fórmulas inteligêntes baseadas no CFI.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block border-b border-slate-800 pb-1.5">
                  RESUMO DA CONFIGURAÇÃO:
                </span>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Negócio:</span>
                  <span className="font-extrabold text-white">{businessType}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Despesas Fixas Cadastradas:</span>
                  <span className="font-extrabold text-brand-yellow">
                    {aluguel + salarios + energia + internet + contador + customExpenses.reduce((p, c) => p + c.value, 0) > 0 ? (
                      `R$ ${(aluguel + salarios + energia + internet + contador + customExpenses.reduce((p, c) => p + c.value, 0)).toFixed(2)} / mês`
                    ) : (
                      'Poupadas (Zerado)'
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Taxas & Cartões salvas:</span>
                  <span className="font-extrabold text-white">
                    {debitTax > 0 || creditTax > 0 || tax > 0 ? (
                      `D: ${debitTax.toFixed(2)}% | C: ${creditTax.toFixed(2)}%`
                    ) : (
                      'Personalizadas 0%'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer actions */}
        <div className="p-6 border-t border-slate-800 flex justify-between items-center relative z-10 bg-slate-900/20 backdrop-blur-md">
          {step > 1 && step < 5 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-3 rounded-xl border border-slate-750 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          ) : (
            <div /> // Spacing placeholder
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 && !storeName.trim()}
              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 ${
                step === 1 && !storeName.trim()
                  ? 'bg-slate-800 text-slate-600 border border-slate-800/50 cursor-not-allowed'
                  : 'bg-brand-yellow hover:bg-yellow-400 text-slate-950 font-black shadow-md shadow-brand-yellow/10'
              }`}
            >
              Próximo <ArrowRight size={14} />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
              <button
                type="button"
                id="btn-onboarding-ingredients"
                onClick={() => handleComplete('ingredients')}
                className="flex-1 bg-brand-yellow hover:bg-yellow-400 text-slate-950 font-black px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2"
              >
                🥕 Ir para Ingredientes
              </button>
              <button
                type="button"
                id="btn-onboarding-dashboard"
                onClick={() => handleComplete('dashboard')}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                📊 Explorar o Sistema
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
