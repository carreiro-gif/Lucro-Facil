import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Info,
  Sliders,
  DollarSign,
  Utensils,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  ArrowRight,
  Lightbulb,
  Award,
  ChevronLeft,
  Settings,
  Users,
  Layers,
  Sparkle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { formatMoney } from '../constants';

interface BuffetIngredient {
  id: string;
  name: string;
  costPerUnit: number; // R$ por kg ou un
  unit: 'KG' | 'UN' | 'G';
  dose: number; // quantidade da dose em g ou un no prato padrão
  isProtein: boolean; // se é um ingrediente caro ou proteína
}

const TEMPLATE_DOG = [
  { id: '1', name: 'Pão de Hotdog', costPerUnit: 0.85, unit: 'UN', dose: 1, isProtein: false },
  { id: '2', name: 'Salsicha Oficial', costPerUnit: 14.50, unit: 'KG', dose: 100, isProtein: true },
  { id: '3', name: 'Molho de Carne Moída', costPerUnit: 24.00, unit: 'KG', dose: 80, isProtein: true },
  { id: '4', name: 'Purê de Batata Especial', costPerUnit: 9.00, unit: 'KG', dose: 120, isProtein: false },
  { id: '5', name: 'Bacon fatiado frito', costPerUnit: 52.00, unit: 'KG', dose: 35, isProtein: true },
  { id: '6', name: 'Cheddar cremoso artesanal', costPerUnit: 34.00, unit: 'KG', dose: 40, isProtein: true },
  { id: '7', name: 'Batata Palha & Condimentos', costPerUnit: 18.00, unit: 'KG', dose: 30, isProtein: false },
] as BuffetIngredient[];

const TEMPLATE_ALMOCO = [
  { id: '1', name: 'Arroz, Feijão & Base', costPerUnit: 5.50, unit: 'KG', dose: 180, isProtein: false },
  { id: '2', name: 'Massas, Batata frita, Purê', costPerUnit: 8.50, unit: 'KG', dose: 100, isProtein: false },
  { id: '3', name: 'Saladas e Folhas verdes', costPerUnit: 12.00, unit: 'KG', dose: 60, isProtein: false },
  { id: '4', name: 'Legumes grelhados e preparados', costPerUnit: 10.00, unit: 'KG', dose: 80, isProtein: false },
  { id: '5', name: 'Proteína Base (Frango, Moída)', costPerUnit: 22.00, unit: 'KG', dose: 130, isProtein: true },
  { id: '6', name: 'Proteína Premium (Carne vermelha)', costPerUnit: 48.00, unit: 'KG', dose: 90, isProtein: true },
  { id: '7', name: 'Sobremesa ou Pastelzinho', costPerUnit: 16.00, unit: 'KG', dose: 40, isProtein: false },
] as BuffetIngredient[];

const BuffetSimulator: React.FC = () => {
  const { cfi, calculateTotalCfiPercent } = useApp();
  const cfiPercentContext = calculateTotalCfiPercent();

  // Mode state
  const [buffetType, setBuffetType] = useState<'dog' | 'lunch' | 'custom'>('dog');
  
  // Custom states for financial sliders
  const [sellingPrice, setSellingPrice] = useState<number>(29.90);
  const [proporcaoOgros, setProporcaoOgros] = useState<number>(20); // Slider 0 - 50%
  const [proporcaoPassarinho, setProporcaoPassarinho] = useState<number>(25); // Slider 0 - 50%
  const [wasteRate, setWasteRate] = useState<number>(12); // Desperdício/Quebra % 
  const [customCfi, setCustomCfi] = useState<number>(cfiPercentContext > 0 ? cfiPercentContext : 32); 

  // Buffet layout risks selectors
  const [plateSize, setPlateSize] = useState<'small' | 'medium' | 'big'>('medium');
  const [proteinOrder, setProteinOrder] = useState<'start' | 'end'>('end');
  const [monitoring, setMonitoring] = useState<'free' | 'assisted'>('free');

  // Active tutorial step state
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);

  // Ingredients state
  const [ingredients, setIngredients] = useState<BuffetIngredient[]>(TEMPLATE_DOG);

  const activeCfi = customCfi;

  // Handle template switch
  const handleTemplateChange = (type: 'dog' | 'lunch' | 'custom') => {
    setBuffetType(type);
    if (type === 'dog') {
      setIngredients(TEMPLATE_DOG);
      setSellingPrice(29.90);
    } else if (type === 'lunch') {
      setIngredients(TEMPLATE_ALMOCO);
      setSellingPrice(39.90);
    } else {
      setIngredients([
        { id: 'c1', name: 'Mistura Base (Carboidratos)', costPerUnit: 6.00, unit: 'KG', dose: 200, isProtein: false },
        { id: 'c2', name: 'Proteína de Alto Custo', costPerUnit: 35.00, unit: 'KG', dose: 150, isProtein: true },
      ]);
      setSellingPrice(35.00);
    }
  };

  // Helper calculating ingredient dose cost
  const getIngredientCost = (ing: BuffetIngredient) => {
    if (ing.unit === 'UN') {
      return ing.costPerUnit * ing.dose;
    } else {
      // KG, convert dose in grams to kg
      return (ing.costPerUnit / 1000) * ing.dose;
    }
  };

  // 1. Custo Real por dose padrão total
  const baseStandardCost = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + getIngredientCost(ing), 0);
  }, [ingredients]);

  // Waste markup application
  const baseCostWithWaste = useMemo(() => {
    return baseStandardCost * (1 + wasteRate / 100);
  }, [baseStandardCost, wasteRate]);

  // Proportions of users
  const propNormal = useMemo(() => {
    const sum = proporcaoOgros + proporcaoPassarinho;
    if (sum > 100) return 0;
    return 100 - sum;
  }, [proporcaoOgros, proporcaoPassarinho]);

  // 2. Profile costs
  // Passarinho: eats less proteins, overall lower dosage on expensive items
  const passarinhoCost = useMemo(() => {
    const customCost = ingredients.reduce((sum, ing) => {
      const standardCost = getIngredientCost(ing);
      // Eats only 35% of proteins and 80% of carbs
      const factor = ing.isProtein ? 0.35 : 0.8;
      return sum + (standardCost * factor);
    }, 0);
    return customCost * (1 + wasteRate / 100);
  }, [ingredients, wasteRate]);

  // Normal / Balanced Client Cost
  const normalCost = useMemo(() => baseCostWithWaste, [baseCostWithWaste]);

  // Ogro / High Volume Client Cost (Overloaded protein & heavy base volume)
  const ogroCost = useMemo(() => {
    const customCost = ingredients.reduce((sum, ing) => {
      const standardCost = getIngredientCost(ing);
      // Eats double proteins, 1.3x carbs
      const factor = ing.isProtein ? 2.1 : 1.3;
      return sum + (standardCost * factor);
    }, 0);
    return customCost * (1 + wasteRate / 100);
  }, [ingredients, wasteRate]);

  // Weighted Custo de Mercadoria Vendida (CMV MGP - Custos Integrados)
  const weightedCost = useMemo(() => {
    const pPct = proporcaoPassarinho / 100;
    const nPct = propNormal / 100;
    const oPct = proporcaoOgros / 100;
    return (passarinhoCost * pPct) + (normalCost * nPct) + (ogroCost * oPct);
  }, [passarinhoCost, normalCost, ogroCost, proporcaoPassarinho, propNormal, proporcaoOgros]);

  // Margins calculated
  const cmvPercentReal = useMemo(() => {
    return sellingPrice > 0 ? (weightedCost / sellingPrice) * 100 : 0;
  }, [weightedCost, sellingPrice]);

  const cfiValueReal = useMemo(() => {
    return sellingPrice * (activeCfi / 100);
  }, [sellingPrice, activeCfi]);

  const profitValueReal = useMemo(() => {
    return sellingPrice - weightedCost - cfiValueReal;
  }, [sellingPrice, weightedCost, cfiValueReal]);

  const profitPercentReal = useMemo(() => {
    return sellingPrice > 0 ? (profitValueReal / sellingPrice) * 105 : 0; // Adjusted representation
  }, [profitValueReal, sellingPrice]);

  const finalProfitMarginNormalized = useMemo(() => {
    const margin = sellingPrice > 0 ? (profitValueReal / sellingPrice) * 100 : 0;
    return margin;
  }, [profitValueReal, sellingPrice]);

  // Safe pricing based on targeted profit margin (e.g. 20% Net Profit Margin target)
  const targetProfitMargin = 20; 
  const recommendedPrice = useMemo(() => {
    const divider = 1 - ((activeCfi + targetProfitMargin) / 100);
    if (divider <= 0) return weightedCost * 1.5;
    return weightedCost / divider;
  }, [weightedCost, activeCfi]);

  // 3. Score de Risco de Prejuízo (0 to 100%)
  const riskScore = useMemo(() => {
    let score = 0;
    
    // Risk factor 1: CMV real too high
    if (cmvPercentReal > 45) score += 35;
    else if (cmvPercentReal > 38) score += 20;
    else if (cmvPercentReal > 32) score += 10;

    // Risk factor 2: Proporção de Ogros
    if (proporcaoOgros > 35) score += 15;
    else if (proporcaoOgros > 20) score += 8;

    // Risk factor 3: Waste Rate
    if (wasteRate > 15) score += 12;
    else if (wasteRate > 8) score += 6;

    // Risk factor 4: Layout and operational
    if (plateSize === 'big') score += 13;
    else if (plateSize === 'medium') score += 5;

    if (proteinOrder === 'start') score += 15; // Proteins first is extreme risk

    if (monitoring === 'free') score += 10; // Unassisted serve of proteins

    return Math.min(100, Math.max(0, score));
  }, [cmvPercentReal, proporcaoOgros, wasteRate, plateSize, proteinOrder, monitoring]);

  // Handle adding custom ingredient
  const [newIngName, setNewIngName] = useState('');
  const [newIngCost, setNewIngCost] = useState<number>(15.00);
  const [newIngDose, setNewIngDose] = useState<number>(50);
  const [newIngUnit, setNewIngUnit] = useState<'KG' | 'UN'>('KG');
  const [newIngIsProtein, setNewIngIsProtein] = useState(false);

  const addIngredient = () => {
    if (!newIngName.trim()) return;
    const newIng: BuffetIngredient = {
      id: Date.now().toString(),
      name: newIngName.trim(),
      costPerUnit: newIngCost,
      unit: newIngUnit,
      dose: newIngDose,
      isProtein: newIngIsProtein
    };
    setIngredients([...ingredients, newIng]);
    setNewIngName('');
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  // Update specific ingredient parameters in list
  const updateIngredientField = (id: string, field: keyof BuffetIngredient, value: any) => {
    setIngredients(ingredients.map(ing => {
      if (ing.id === id) {
        return { ...ing, [field]: value };
      }
      return ing;
    }));
  };

  // Interactive tour/tutorial steps data
  const ONBOARDING_STEPS = useMemo(() => [
    {
      step: 1,
      title: "1. Cardápio & Insumos",
      subtitle: "Proteínas vs. Carboidratos",
      shortDesc: "Cadastre tudo o que fica livre para o cliente se servir, estipulando peso e custo original.",
      xandePrompt: "Ei! O primeiro passo é colocar aqui no Doseador os insumos que entram na pista de buffet livre ou no prato do seu cliente. O grande segredo financeira: marque como 'Proteína / Insumo Caro' o que custa muito por quilo (ex: carnes, salsichas de qualidade, queijos premium e bacon). Assim, o sistema consegue prever e travar o estrago se o 'Cliente Ogro' tentar comer de forma exagerada!",
      icon: Utensils,
      actionText: "Usar Exemplo de Hotdog",
      action: () => handleTemplateChange('dog'),
      target: "doseador-section"
    },
    {
      step: 2,
      title: "2. Preço de Entrada (R$)",
      subtitle: "Pilar de Entrada do Caixa",
      shortDesc: "O preço cobrado fixo por pessoa para comercializar seu modelo à vontade.",
      xandePrompt: "Aqui você define o preço que cobra do seu público para comer à vontade. Quer ver o perigo? Se o preço cobrado for baixo demais (ex: R$ 19,90), mesmo controlando cada grama, você estará pagando para o seu cliente comer! Teste ajustar para cima e veja sua margem de contribuição respirar imediatamente.",
      icon: DollarSign,
      actionText: "Ajustar Preço para R$ 29,90",
      action: () => setSellingPrice(29.90),
      target: "financeiro-section"
    },
    {
      step: 3,
      title: "3. Taxa de Desperdício Oculto",
      subtitle: "Sobras no Prato & Buffet",
      shortDesc: "Toda sobra jogada fora no final do expediente é custo embutido que encarece a pista.",
      xandePrompt: "Em buffet ou cachorro-quente livre, o olho fala mais alto que a barriga. Os clientes exageram, deixam restos no prato e as sobras da pista não podem ser reaproveitadas. Se 12% da produção vira lixo, seu insumo ficou 12% mais caro! Nós adicionamos essa 'Taxa de Quebra' automaticamente para reajustar seu custo real e blindar sua margem.",
      icon: TrendingDown,
      actionText: "Simular 15% de Perda",
      action: () => setWasteRate(15),
      target: "financeiro-section"
    },
    {
      step: 4,
      title: "4. Diferenciação do Mix de Público",
      subtitle: "Do Ogro ao Passarinho",
      shortDesc: "Pondere o mix real das pessoas que entram pelas portas de forma estatística segura.",
      xandePrompt: "Aqui está o grande segredo! Você não vive no pior cenário o tempo todo. Tem o 'Cliente Ogro' que limpa sua pista de carnes e quebras, mas também tem o 'Cliente Passarinho' que se enche com duas colheres de purê e salada. O seu lucro real vem desse mix equilibrado! Deslize as barras para modelar seu público médio real.",
      icon: Users,
      actionText: "Simular 20% de Ogros",
      action: () => {
        setProporcaoOgros(20);
        setProporcaoPassarinho(25);
      },
      target: "financeiro-section"
    },
    {
      step: 5,
      title: "5. Táticas Físicas de Pista",
      subtitle: "O Poder do Layout do Buffet",
      shortDesc: "Use a engenharia física e psicologia operacional para conter excessos sem atrito.",
      xandePrompt: "Sabia que o tamanho do prato diz quanto o cliente consome? Prato gigante faz o cérebro querer encher os espaços vazios. Mude a ordem: coloque as saladas e carboidratos baratos no começo e as carnes e queijos no FIM de tudo! Isso faz os clientes preencherem o prato com itens econômicos primeiro. Teste a otimização máxima ao lado!",
      icon: ShieldCheck,
      actionText: "Blindar Layout de Pista",
      action: () => {
        setPlateSize('small');
        setProteinOrder('end');
        setMonitoring('assisted');
      },
      target: "taticas-section"
    },
    {
      step: 6,
      title: "6. Mapeador de Riscos e CFI",
      subtitle: "Sua Margem Líquida Limpa",
      shortDesc: "Entenda o cálculo final descontando impostos, taxas de cartões e o CFI da Empresa.",
      xandePrompt: "Na coluna da direita, o sistema calcula sua Margem de Contribuição, retira o seu percentual de CFI (Custos Fixos Integrados pro-rata) e te entrega a Margem Líquida Real do Buffet. O 'Preço Sugerido' calcula exatamente o preço ideal balanceado para você embolsar no mínimo 20% de lucro final limpo, do jeito certo!",
      icon: Award,
      actionText: "Resetar para Margens Padrões",
      action: () => {
        setSellingPrice(32.90);
        setCustomCfi(cfiPercentContext > 0 ? cfiPercentContext : 30);
      },
      target: "mapeador-section"
    }
  ], [cfiPercentContext]);

  const activeTourStepData = ONBOARDING_STEPS[activeStep];

  // Recharts profiles cost comparisons
  const profileChartData = [
    { name: 'Passarinho', 'Custo Total': parseFloat(passarinhoCost.toFixed(2)), color: '#10b981' },
    { name: 'Mix Padrão', 'Custo Total': parseFloat(normalCost.toFixed(2)), color: '#3b82f6' },
    { name: 'Cliente Ogro', 'Custo Total': parseFloat(ogroCost.toFixed(2)), color: '#dc2626' },
    { name: 'Preço Praticado', 'Custo Total': parseFloat(sellingPrice.toFixed(2)), color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 pb-20 no-print">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#1e293b]/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-brand-red animate-pulse" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">SIMULADOR INTELIGENTE DE BUFFET & À VONTADE</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gere altíssima percepção de valor: Simule o desperdício, controle do "Cliente Ogro", flutuações e faça a blindagem financeira ideal do seu buffet livre.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTutorial(!showTutorial)}
            className={`px-4 py-2 text-xs font-black rounded-xl border transition flex items-center gap-1.5 ${
              showTutorial 
                ? 'bg-brand-red/10 border-brand-red/30 text-brand-red' 
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-gray-700 dark:text-white'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            {showTutorial ? "Ocultar Guia Educativo" : "Mostrar Guia do Xande"}
          </button>

          {/* Templates selector tabs */}
          <div className="flex bg-gray-155 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => handleTemplateChange('dog')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${buffetType === 'dog' ? 'bg-white dark:bg-gray-700 text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Cachorro-Quente
            </button>
            <button 
              onClick={() => handleTemplateChange('lunch')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${buffetType === 'lunch' ? 'bg-white dark:bg-gray-700 text-brand-red shadow-sm' : 'text-gray-200 hover:text-white'}`}
            >
              Almoço Buffet
            </button>
          </div>
        </div>
      </div>

      {/* INTERACTIVE MULTI-STEP EDUCATION WALKTHROUGH PANEL */}
      {showTutorial && (
        <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden transition-all duration-300">
          {/* Background graphical effects */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-80 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header of walkthrough */}
          <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 bg-brand-red rounded-full animate-ping" />
              <div className="h-8 w-8 rounded-full bg-brand-red/10 border border-brand-red/30 flex items-center justify-center">
                <Sparkle className="h-4 w-4 text-brand-red" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  PASSO A PASSO ASSISTIDO COM O XANDE
                </h2>
                <p className="text-[11px] text-slate-400">Clique nas etapas ou siga em ordem para blindar o seu preço à vontade e entender de vez a metodologia!</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400">Etapa {activeStep + 1} de {ONBOARDING_STEPS.length}</span>
              <div className="flex items-center gap-1.5 mt-1">
                {ONBOARDING_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${idx === activeStep ? 'w-6 bg-brand-red' : 'w-2 bg-slate-700 hover:bg-slate-500'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Steps Selector Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {ONBOARDING_STEPS.map((stepItem, index) => {
              const StepIcon = stepItem.icon;
              const isSelected = index === activeStep;
              return (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`p-3 rounded-2xl border text-left transition relative flex flex-col gap-1.5 ${
                    isSelected 
                      ? 'bg-slate-800 text-white border-brand-red shadow-md ring-2 ring-brand-red/20' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg w-fit ${isSelected ? 'bg-brand-red text-white' : 'bg-slate-900 text-slate-400'}`}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black tracking-tight line-clamp-1">{stepItem.title}</h4>
                    <span className="text-[9px] text-slate-500 font-bold block leading-none mt-0.5">{stepItem.subtitle}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute right-2 top-2 h-1.5 w-1.5 bg-brand-red rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Xande explanations with direct avatar block */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            
            {/* Xande Avatar representation */}
            <div className="md:col-span-3 lg:col-span-2 flex flex-col items-center justify-center text-center p-3 py-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="relative">
                <div className="h-16 w-16 bg-slate-850 rounded-full border-2 border-brand-red flex items-center justify-center text-center text-3xl font-black font-sans text-brand-red">
                  L
                </div>
                <div className="absolute bottom-0 right-0 h-4 w-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <span className="text-xs font-black text-brand-yellow uppercase mt-2.5">Consultor Xande</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mentor Financeiro</span>
            </div>

            {/* Content tip explanation */}
            <div className="md:col-span-9 lg:col-span-10 space-y-3.5">
              <div>
                <span className="text-[9px] font-bold text-brand-red uppercase tracking-widest bg-brand-red/10 px-2 py-0.5 rounded-full border border-brand-red/20 inline-block">
                  {activeTourStepData.subtitle}
                </span>
                <h3 className="text-lg font-black text-white mt-1.5 flex items-center gap-1.5 leading-snug">
                  {activeTourStepData.title}
                </h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed mt-1">
                  {activeTourStepData.shortDesc}
                </p>
              </div>

              {/* Xande Prompt Text Box */}
              <div className="p-4 bg-slate-900/85 rounded-xl border-l-[4px] border-brand-red text-slate-300 text-xs leading-relaxed font-sans italic">
                "{activeTourStepData.xandePrompt}"
              </div>

              {/* Interactive buttons & Navigation within Onboarding */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  {activeTourStepData.actionText && (
                    <button
                      onClick={() => activeTourStepData.action()}
                      className="px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {activeTourStepData.actionText}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep(prev => prev - 1)}
                    className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-900 rounded-xl transition"
                    title="Etapa anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">
                    Passo {activeStep + 1} / {ONBOARDING_STEPS.length}
                  </span>

                  <button
                    onClick={() => {
                      if (activeStep < ONBOARDING_STEPS.length - 1) {
                        setActiveStep(prev => prev + 1);
                      } else {
                        setShowTutorial(false);
                      }
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-850 text-brand-red rounded-xl transition font-black text-xs flex items-center gap-1.5"
                    title={activeStep === ONBOARDING_STEPS.length - 1 ? "Concluir passo a passo" : "Próxima etapa"}
                  >
                    {activeStep === ONBOARDING_STEPS.length - 1 ? "Concluir" : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* Main Grid: Control Panel vs Live Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: General Controls & Sliders */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Insumos do Buffet (Ingredients) */}
          <div 
            id="doseador-section" 
            className={`bg-white dark:bg-[#111827] border p-6 rounded-2xl shadow-sm space-y-4 transition-all duration-300 ${
              activeStep === 0 && showTutorial
                ? 'border-brand-red ring-4 ring-brand-red/10 scale-[1.01]' 
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${activeStep === 0 && showTutorial ? 'bg-brand-red animate-ping' : 'bg-brand-red'}`} />
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5 text-brand-red" />
                  Doseador do Layout do Buffet (Prato Padrão Desejado)
                </h3>
              </div>
              <span className="text-xs font-black font-mono text-gray-400 bg-gray-50 dark:bg-gray-850 px-2.5 py-0.5 rounded-lg border border-gray-150 dark:border-gray-800">
                Total Insumos: {ingredients.length}
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Estipule os custos de entrada e pesos de porção para um prato comum. Pelo método de <strong className="text-gray-700 dark:text-slate-350">CMV Ponderado por Cliente</strong>, o sistema calcula o estrago de itens caros caso eles comam à vontade.
            </p>

            {/* List with ingredients and quick in-line inputs */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {ingredients.map((ing) => (
                <div key={ing.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="col-span-5 sm:col-span-4 min-w-0">
                    <span className="text-xs font-black text-gray-900 dark:text-white truncate block">{ing.name}</span>
                    <button 
                      onClick={() => updateIngredientField(ing.id, 'isProtein', !ing.isProtein)}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-1 transition ${
                        ing.isProtein 
                          ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/20' 
                          : 'bg-gray-150 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {ing.isProtein ? '🚨 Insumo Caro / Proteína' : 'Carboidrato / Base'}
                    </button>
                  </div>

                  <div className="col-span-3 sm:col-span-3">
                    <label className="text-[9px] text-gray-400 block font-bold uppercase">Preço Insumo</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-gray-400">R$</span>
                      <input 
                        type="number"
                        className="w-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded p-1 text-xs font-bold font-mono"
                        value={ing.costPerUnit}
                        onChange={(e) => updateIngredientField(ing.id, 'costPerUnit', parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-[9px] text-gray-400 font-bold">{ing.unit}</span>
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-3">
                    <label className="text-[9px] text-gray-400 block font-bold uppercase">Portar no prato (Dose)</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input 
                        type="number"
                        className="w-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded p-1 text-xs font-bold font-mono"
                        value={ing.dose}
                        onChange={(e) => updateIngredientField(ing.id, 'dose', parseInt(e.target.value) || 0)}
                      />
                      <span className="text-[9px] text-gray-400 font-bold">{ing.unit === 'KG' ? 'g' : ing.unit}</span>
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-2 flex justify-end">
                    <button 
                      onClick={() => removeIngredient(ing.id)}
                      className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase p-1.5 sm:p-0"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick adding line */}
            <div className="border-t border-dashed border-gray-200 dark:border-gray-850 pt-4 space-y-3">
              <h4 className="text-xs font-black text-gray-600 uppercase flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-red" />
                Adicionar Item Rápido ao Buffet
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Nome do Insumo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Salsicha Premium, Purê de Batatas, Queijo Prato" 
                    className="w-full bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-brand-red"
                    value={newIngName}
                    onChange={e => setNewIngName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Preço R$ (Quilo/Un)</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold font-mono outline-none focus:border-brand-red"
                    value={newIngCost}
                    onChange={e => setNewIngCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Dose Média (g ou un)</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold font-mono outline-none focus:border-brand-red"
                    value={newIngDose}
                    onChange={e => setNewIngDose(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Unidade</label>
                  <select 
                    className="w-full bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none"
                    value={newIngUnit}
                    onChange={e => setNewIngUnit(e.target.value as any)}
                  >
                    <option value="KG">Quilo (KG)</option>
                    <option value="UN">Unidade (UN)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button 
                    onClick={addIngredient}
                    type="button" 
                    className="w-full bg-[#111827] hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg p-2.5 text-xs font-black uppercase transition text-center shrink-0"
                  >
                    Incluir
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Financials & Flow Metrics */}
          <div 
            id="financeiro-section" 
            className={`bg-white dark:bg-[#111827] border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${
              (activeStep === 1 || activeStep === 2 || activeStep === 3) && showTutorial
                ? 'border-brand-red ring-4 ring-brand-red/10 scale-[1.01]' 
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-3">
              <div className={`h-2.5 w-2.5 rounded-full ${(activeStep === 1 || activeStep === 2 || activeStep === 3) && showTutorial ? 'bg-brand-red animate-pulse' : 'bg-brand-red'}`} />
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-brand-red" />
                Métricas Financeiras, Perdas & Flutuação do À Vontade
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Slider Block: Base parameters */}
              <div className="space-y-5">
                
                {/* Price block */}
                <div className={`p-3 rounded-xl transition ${activeStep === 1 && showTutorial ? 'bg-[#111827]/10 dark:bg-brand-red/10 ring-2 ring-brand-red' : ''}`}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Preço Cobrado do Cliente
                      <span className="text-[10px] font-bold text-brand-red">(Passo 2)</span>
                    </span>
                    <span className="text-brand-red font-mono font-black text-sm">{formatMoney(sellingPrice)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={10} 
                    max={120} 
                    step={0.5} 
                    value={sellingPrice} 
                    onChange={e => setSellingPrice(parseFloat(e.target.value))}
                    className="w-full accent-brand-red cursor-pointer"
                  />
                  <span className="text-[9px] text-gray-400 leading-tight block mt-1">Preço fixo por pessoa cadastrada para usufruir da pista livre.</span>
                </div>

                {/* Sobras de comida */}
                <div className={`p-3 rounded-xl transition ${activeStep === 2 && showTutorial ? 'bg-[#111827]/10 dark:bg-brand-red/10 ring-2 ring-brand-red' : ''}`}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Sobra do Buffet & Desperdício (%)
                      <span className="text-[10px] font-bold text-brand-yellow">(Passo 3)</span>
                    </span>
                    <span className="text-brand-yellow font-mono font-black text-sm">{wasteRate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={40} 
                    value={wasteRate} 
                    onChange={e => setWasteRate(parseInt(e.target.value))}
                    className="w-full accent-brand-yellow cursor-pointer"
                  />
                  <span className="text-[9px] text-gray-400 leading-tight block mt-1">Porcentagem descartada de sobras no fim de dia. Aplicado no CMV.</span>
                </div>

                {/* CFI */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-700 dark:text-gray-300">CFI da Loja (Custos Fixos Integrados)</span>
                    <span className="text-blue-600 font-mono font-black text-sm">{activeCfi.toFixed(1)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={10} 
                    max={60} 
                    value={activeCfi} 
                    onChange={e => setCustomCfi(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-gray-400 leading-tight block mt-1">Proporção usada para abater peso no cálculo de custos fixos do aluguel.</span>
                </div>

              </div>

              {/* Slider Block: Flow & User profiles ratios */}
              <div className="space-y-5">
                
                {/* Passarinho percent */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      Cliente Passarinho (Baixo Volume)
                    </span>
                    <span className="text-emerald-600 font-mono font-black text-sm">{proporcaoPassarinho}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={50} 
                    value={proporcaoPassarinho} 
                    onChange={e => setProporcaoPassarinho(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-gray-400 leading-tight block mt-1">Clientes de baixa ingestão que comem menos carboidrato e proteína caro.</span>
                </div>

                {/* Ogro percent */}
                <div className={`p-3 rounded-xl transition ${activeStep === 3 && showTutorial ? 'bg-[#111817]/10 dark:bg-brand-red/10 ring-2 ring-brand-red' : ''}`}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-red-500 flex items-center gap-1">
                      Cliente Ogro
                      <span className="text-[10px] font-bold text-red-500">(Passo 4 - Risco)</span>
                    </span>
                    <span className="text-red-600 font-mono font-bold text-sm">{proporcaoOgros}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={50} 
                    value={proporcaoOgros} 
                    onChange={e => setProporcaoOgros(parseInt(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                  <span className="text-[9px] text-gray-400 leading-tight block mt-1">Estimativa de esfomeados que comem até o triplo de carnes e queijos.</span>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-slate-800 rounded-xl">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">Cliente Mix Padrão (Equilibrado):</span>
                    <span className="text-blue-500 font-mono font-black">{propNormal}%</span>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">
                    Estatística média autocompensada para somar 100% de clientes pagantes na porta da sua hamburgueria / restaurante.
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* Section 3: Operational Risk Layout */}
          <div 
            id="taticas-section" 
            className={`bg-white dark:bg-[#111827] border p-6 rounded-2xl shadow-sm space-y-4 transition-all duration-300 ${
              activeStep === 4 && showTutorial
                ? 'border-brand-red ring-4 ring-brand-red/10 scale-[1.01]' 
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-855 pb-3">
              <div className={`h-2.5 w-2.5 rounded-full ${activeStep === 4 && showTutorial ? 'bg-brand-red animate-pulse' : 'bg-brand-red'}`} />
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-brand-red" />
                Táticas de Controle e Engenharia Operacional (Passo 5)
              </h3>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-1">
              Como o buffet livre depende da autogestão do cliente, aplicar controles invisíveis no layout físico do estabelecimento economiza comida sem gerar atritos, diminuindo o seuScore de Risco.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/20 space-y-2">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 block border-b border-gray-100 dark:border-gray-800 pb-1.5 uppercase">Tamanho do Prato</label>
                <div className="flex flex-col gap-2.5 text-xs">
                  <label className="flex items-center gap-2 font-bold select-none cursor-pointer">
                    <input type="radio" checked={plateSize === 'small'} onChange={() => setPlateSize('small')} className="accent-brand-red w-4 h-4" /> 
                    <div>
                      <span className="block text-gray-900 dark:text-white">Pequeno/Médio (22cm)</span>
                      <span className="text-[9px] text-emerald-600 block">-15% em proteínas caras</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 font-bold select-none cursor-pointer">
                    <input type="radio" checked={plateSize === 'medium'} onChange={() => setPlateSize('medium')} className="accent-brand-red w-4 h-4" /> 
                    <div>
                      <span className="block text-gray-500 dark:text-gray-400">Padrão da Casa (Comum)</span>
                      <span className="text-[9px] text-gray-400 block">Médio equilíbrio</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 font-bold select-none cursor-pointer">
                    <input type="radio" checked={plateSize === 'big'} onChange={() => setPlateSize('big')} className="accent-brand-red w-4 h-4" /> 
                    <div>
                      <span className="block text-red-500">Vasilhão Grande/Fundo</span>
                      <span className="text-[9px] text-red-500 block">Aumenta o consumo em +25%</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/20 space-y-2">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 block border-b border-gray-100 dark:border-gray-800 pb-1.5 uppercase">Ordem das Carnes</label>
                <div className="flex flex-col gap-2.5 text-xs">
                  <label className="flex items-center gap-2 font-bold select-none cursor-pointer">
                    <input type="radio" checked={proteinOrder === 'end'} onChange={() => setProteinOrder('end')} className="accent-brand-red w-4 h-4" /> 
                    <div>
                      <span className="block text-gray-900 dark:text-white">Carnes no Final</span>
                      <span className="text-[9px] text-emerald-600 block">Cliente enche base barata antes</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 font-bold select-none cursor-pointer">
                    <input type="radio" checked={proteinOrder === 'start'} onChange={() => setProteinOrder('start')} className="accent-brand-red w-4 h-4" /> 
                    <div>
                      <span className="block text-red-500">Carnes no Início</span>
                      <span className="text-[9px] text-red-500 block">Aumenta em +30% desperdício</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/20 space-y-2">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 block border-b border-gray-100 dark:border-gray-800 pb-1.5 uppercase">Serviço de Porção</label>
                <div className="flex flex-col gap-2.5 text-xs">
                  <label className="flex items-center gap-2 font-bold select-none cursor-pointer">
                    <input type="radio" checked={monitoring === 'assisted'} onChange={() => setMonitoring('assisted')} className="accent-brand-red w-4 h-4" /> 
                    <div>
                      <span className="block text-gray-900 dark:text-white">Assistido (Dose única)</span>
                      <span className="text-[9px] text-emerald-600 block">Auxiliar serve a carne</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 font-bold select-none cursor-pointer">
                    <input type="radio" checked={monitoring === 'free'} onChange={() => setMonitoring('free')} className="accent-brand-red w-4 h-4" /> 
                    <div>
                      <span className="block text-red-500">Totalmente Livre de Carnes</span>
                      <span className="text-[9px] text-red-500 block">Sem travas psicológicas</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Side: LIVE RESULTS & SCORE & XANDE STRATEGY */}
        <div className="lg:col-span-4 space-y-6">

          {/* BLOCK A: SCORE DE RISCO & CMV RESULT */}
          <div 
            id="mapeador-section" 
            className={`bg-white dark:bg-[#111827] border rounded-2xl p-6 overflow-hidden relative shadow-md transition-all duration-300 ${
              activeStep === 5 && showTutorial
                ? 'border-brand-red ring-4 ring-brand-red/10 scale-[1.01]' 
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-850 pb-2.5">
              <span className="text-[11px] font-black uppercase text-gray-450 tracking-wider">Mapeador de Riscos da Pista</span>
              <span className="text-[10px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-full">AO VIVO</span>
            </div>

            {/* Score circle gauge / thermometer */}
            <div className="text-center py-4 space-y-3">
              <div className="inline-block relative">
                {/* Visual Circle Gauge */}
                <div className={`w-28 h-28 rounded-full border-8 flex items-center justify-center transition-all ${
                  riskScore > 65 
                    ? 'border-red-500 shadow-md ring-4 ring-red-500/10' 
                    : riskScore > 40
                      ? 'border-amber-500 shadow-md ring-4 ring-amber-500/10'
                      : 'border-emerald-500 shadow-md ring-4 ring-emerald-500/10'
                }`}>
                  <div>
                    <span className="text-3xl font-black block tracking-tighter text-gray-800 dark:text-white">{riskScore}%</span>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block -mt-1">Risco</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className={`text-sm font-black uppercase tracking-tight ${
                  riskScore > 65 
                    ? 'text-red-600' 
                    : riskScore > 40
                      ? 'text-amber-500'
                      : 'text-emerald-600'
                }`}>
                  {riskScore > 65 
                    ? 'ALTO RISCO DE PREJUÍZO' 
                    : riskScore > 40
                      ? 'ATENÇÃO EM ALERTA'
                      : 'OPERAÇÃO BLINDADA SEGURO'}
                </h4>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {riskScore > 65 
                    ? 'Doses desreguladas de insumos no buffet e falhas na ordem dos pratos aumentam a margem de perda severamente!'
                    : riskScore > 40
                      ? 'Seus limites de desperdício ou o percentual de clientes ogros estão beliscando o faturamento do dia.'
                      : 'Configurações de porções ideais e layout estratégico protegem o seu caixa contra o Cliente Ogro.'}
                </p>
              </div>

            </div>

            {/* Summary Metrics */}
            <div className="border-t border-gray-150 dark:border-gray-800 pt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center font-mono">
                <span className="text-gray-500 font-sans font-bold">Custo Médio Ponderado por Cliente:</span>
                <span className="font-black text-gray-900 dark:text-white text-sm">{formatMoney(weightedCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">CFI Alocado por Entrada:</span>
                <span className="font-black font-mono text-blue-600">{formatMoney(cfiValueReal)} ({activeCfi.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-gray-500 font-sans font-bold">CMV Ponderado (%):</span>
                <span className={`font-black ${cmvPercentReal > 38 ? 'text-red-500' : 'text-emerald-500'}`}>{cmvPercentReal.toFixed(1)}%</span>
              </div>
              
              <div className="border-t border-dashed border-gray-200 dark:border-gray-850 pt-3 flex justify-between items-center">
                <span className="text-xs font-black text-gray-850 dark:text-white uppercase">Sua Margem Líquida Real:</span>
                <span className={`text-base font-black font-mono px-2.5 py-0.5 rounded-lg ${finalProfitMarginNormalized > 10 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                  {finalProfitMarginNormalized.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-gray-500 block uppercase mb-1 flex items-center justify-center gap-1">
                <Award className="h-3.5 w-3.5 text-emerald-500" />
                Preço Mínimo Recomendado (CFI Integrado + 20% Lucro)
              </span>
              <span className="text-xl font-black font-mono text-emerald-600 block">{formatMoney(recommendedPrice)}</span>
              <span className="text-[9.5px] text-gray-400 block mt-0.5">Use esse valor sugerido para ter margem resguardada de verdade!</span>
            </div>

          </div>

          {/* BLOCK B: REALISTIC COST BY VISUAL PROFILE CHART */}
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-extrabold text-xs text-gray-800 dark:text-white uppercase tracking-wider">Custo Unitário real por Perfil de Consumo</h3>
            
            <div className="h-64 w-full" style={{ minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={profileChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fill: 'currentColor' }} 
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: 'currentColor' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value: any) => [`R$ ${value}`, 'Custo Unitário']} />
                  <Bar dataKey="Custo Total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {profileChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BLOCK C: ADVISORY FROM XANDE (Value Perception builder) */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-brand-red flex items-center justify-center text-[10px] font-black">L</div>
              <span className="text-xs font-black text-brand-yellow uppercase tracking-widest block font-mono">RECOMENDAÇÃO EM TEMPO REAL DO XANDE</span>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Conditional tactical advice generator based on state inputs */}
              <div className="flex gap-2 bg-slate-850 p-3.5 rounded-xl border border-slate-800 text-[11px] leading-relaxed font-sans">
                <Lightbulb className="h-4.5 w-4.5 text-brand-yellow shrink-0 mt-0.5" />
                <p>
                  {riskScore > 65 ? (
                    <span><strong>Gargalo Operacional Crítico detectado!</strong> Ao usar pratos gigantes ou expor proteínas caras sem monitoramento, seu desperdício de buffet e sobras dispararam. Diminua o tamanho de prato para 22cm e mude a ordem de posicionamento do Bacon e Cheddar para o final de tudo com urgência para blindar sua hamburgueria!</span>
                  ) : cmvPercentReal > 40 ? (
                    <span><strong>Margem muito espremida!</strong> Seu CMV atual do buffet livre está em {cmvPercentReal.toFixed(1)}%. Seu buffet está cobrindo apenas o custo dos ingredientes de clientes que comem muito. Crie restrições para itens específicos ("limite de 1 porção de proteína premium") ou reajuste o valor de entrada em R$ 2,50!</span>
                  ) : (
                    <span><strong>Métricas de Alta Produtividade!</strong> Seu mix de clientes atuais garante um lucro líquido excelente de {finalProfitMarginNormalized.toFixed(1)}%. Para aumentar o faturamento absoluto sem assustar o cliente, ofereça opcionais turbinados de alta margem (ex: bebidas geladas, sobremesas artesanais, batata com cheddar cobrada separadamente).</span>
                  )}
                </p>
              </div>

              {/* Proving system value points for selling / commercial arguments */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <span className="text-[10px] font-black text-brand-yellow uppercase tracking-widest block font-mono">COMO O SISTEMA TE AJUDA A VENDER MAIS PLANOS:</span>
                
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p><strong>Evita o Chute Cego:</strong> Mostra ao dono do estabelecimento que a variação de consumo (Cliente Ogro vs. Normal) é calculada com precisão científica e segurável.</p>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p><strong>Desperdício Controlado:</strong> Incorporar a Taxa de Sobra de {wasteRate}% gera proteção financeira imediata, evitando o que abre furos gigantes de perda no restaurante.</p>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p><strong>Blindagem Operacional de Pista:</strong> Entregar táticas físicas de engajamento do buffet (prato menor, posição de proteínas) cria um retorno financeiro prático em menos de 10 dias.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default BuffetSimulator;
