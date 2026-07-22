import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ChevronRight, 
  X,
  Award,
  ArrowRight,
  Bot
} from 'lucide-react';

interface JourneyStep {
  id: string;
  stepNumber: number;
  title: string;
  completed: boolean;
  points: number;
  actionText: string;
  actionTab?: string;
}

interface TrialBlindagemWidgetProps {
  onNavigateTab?: (tab: string) => void;
}

export const TrialBlindagemWidget: React.FC<TrialBlindagemWidgetProps> = ({ onNavigateTab }) => {
  const { profile } = useAuth();
  const { 
    storeInfo, 
    ingredients, 
    products, 
    expenses, 
    cfi, 
    monthlyRevenue 
  } = useApp();

  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Paying active subscribers bypass the trial discovery widget completely
  const isPaidUser = profile?.status === 'active' && profile?.plan && profile.plan !== 'starter';
  if (isPaidUser) {
    return null;
  }

  // 14-Day Trial Countdown
  const startDateStr = profile?.trialStart || profile?.createdAt || new Date().toISOString();
  const startDate = new Date(startDateStr);
  const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  const diffMs = endDate.getTime() - now.getTime();
  const isExpired = diffMs <= 0;

  const remainingDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const remainingHours = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const remainingMinutes = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

  // Real data completion triggers
  const hasStoreInfo = Boolean(storeInfo?.name && storeInfo.name !== 'Nova Loja');
  const hasIngredients = ingredients.length > 0;
  const hasProducts = products.length > 0;
  const hasExpenses = expenses.length > 0;
  const hasTechnicalSheets = products.some(p => p.ingredients && p.ingredients.length > 0);
  const hasCfiConfig = Boolean(cfi && cfi.fixedCostMode);
  const hasMonthlyData = monthlyRevenue.some(m => m.revenue > 0);
  const hasPricingSet = products.some(p => p.targetMargin && p.targetMargin > 0);
  const hasXandeChatted = Boolean(localStorage.getItem('lucro_facil_xande_chatted'));

  // 10 Emotional & Discovery Steps (10% each)
  const baseSteps: Omit<JourneyStep, 'completed' | 'points'>[] = [
    {
      id: 'step1',
      stepNumber: 1,
      title: 'Descubra quanto você realmente ganha.',
      actionText: 'Analisar Faturamento',
      actionTab: 'billing'
    },
    {
      id: 'step2',
      stepNumber: 2,
      title: 'Descubra quais produtos colocam mais dinheiro no seu bolso.',
      actionText: 'Ver Produtos e Fichas',
      actionTab: 'products'
    },
    {
      id: 'step3',
      stepNumber: 3,
      title: 'Descubra onde seu dinheiro está vazando.',
      actionText: 'Mapear Despesas',
      actionTab: 'expenses'
    },
    {
      id: 'step4',
      stepNumber: 4,
      title: 'Descubra se você está vendendo barato.',
      actionText: 'Conferir Precificação',
      actionTab: 'pricing'
    },
    {
      id: 'step5',
      stepNumber: 5,
      title: 'Converse pela primeira vez com o Xande.',
      actionText: 'Abrir Chat com Xande',
      actionTab: 'xande-report'
    },
    {
      id: 'step6',
      stepNumber: 6,
      title: 'Descubra quanto você precisa vender hoje.',
      actionText: 'Ver Ponto de Lucro',
      actionTab: 'break-even'
    },
    {
      id: 'step7',
      stepNumber: 7,
      title: 'Monte sua estratégia para vender mais e lucrar mais.',
      actionText: 'Configurar Parâmetros CFI',
      actionTab: 'dna'
    },
    {
      id: 'step8',
      stepNumber: 8,
      title: 'Descubra quais promoções realmente aumentam o lucro.',
      actionText: 'Simular Combos e Ofertas',
      actionTab: 'combos'
    },
    {
      id: 'step9',
      stepNumber: 9,
      title: 'Blindagem completa do seu cardápio.',
      actionText: 'Cadastrar Insumos',
      actionTab: 'ingredients'
    },
    {
      id: 'step10',
      stepNumber: 10,
      title: 'Seu restaurante está pronto para operar com inteligência.',
      actionText: 'Ir para o Painel do Dono',
      actionTab: 'dashboard'
    }
  ];

  // Completion logic for each step
  const steps: JourneyStep[] = baseSteps.map(step => {
    let completed = false;
    if (step.stepNumber === 1) completed = hasMonthlyData || hasStoreInfo;
    else if (step.stepNumber === 2) completed = hasProducts;
    else if (step.stepNumber === 3) completed = hasExpenses;
    else if (step.stepNumber === 4) completed = hasPricingSet;
    else if (step.stepNumber === 5) completed = hasXandeChatted;
    else if (step.stepNumber === 6) completed = hasCfiConfig;
    else if (step.stepNumber === 7) completed = hasTechnicalSheets;
    else if (step.stepNumber === 8) completed = products.length > 2;
    else if (step.stepNumber === 9) completed = hasIngredients;
    else if (step.stepNumber === 10) completed = hasStoreInfo && hasProducts && hasExpenses;

    return {
      ...step,
      completed,
      points: 10
    };
  });

  const completedCount = steps.filter(s => s.completed).length;
  const blindagemPercentage = Math.min(100, completedCount * 10);
  const remainingSteps = steps.length - completedCount;

  // Motivational Message based on percentage
  const getMotivationalMessage = () => {
    if (blindagemPercentage >= 90) {
      return "Falta pouco para proteger totalmente o lucro do seu restaurante.";
    }
    if (blindagemPercentage >= 50) {
      return "Você já descobriu oportunidades de lucro que provavelmente estavam escondidas no seu negócio.";
    }
    return "Seu restaurante está ficando mais inteligente a cada etapa concluída.";
  };

  return (
    <>
      {/* MAIN BANNER CONTAINER */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/30 p-5 md:p-6 shadow-2xl relative overflow-hidden text-left">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left Column: Progress & Header */}
          <div className="space-y-3 flex-1 max-w-2xl">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                <Sparkles size={12} className="animate-pulse" />
                <span>14 Dias de Descoberta do Lucro</span>
              </span>

              {/* Countdown Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 text-[11px] font-semibold">
                <Clock size={12} className="text-amber-400" />
                <span>
                  {isExpired ? (
                    <strong className="text-emerald-400 font-black">14 dias de jornada concluídos</strong>
                  ) : (
                    <>
                      <strong className="text-amber-300">{remainingDays}d {remainingHours}h {remainingMinutes}m</strong> para blindagem total
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Title & Percent */}
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                  Seu restaurante está{' '}
                  <span className="text-emerald-400 font-extrabold">{blindagemPercentage}% BLINDADO</span>
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
                {remainingSteps > 0 ? (
                  <>{getMotivationalMessage()} Faltam <strong className="text-emerald-400">{remainingSteps} etapas</strong> para a blindagem completa.</>
                ) : (
                  <>Parabéns! Você concluiu todas as etapas da sua descoberta de lucro!</>
                )}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-slate-950/80 rounded-full h-3.5 border border-white/10 p-0.5 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700 shadow-sm shadow-emerald-500/50"
                  style={{ width: `${Math.max(5, blindagemPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                <span>0% Vulnerável</span>
                <span className="text-emerald-400 font-bold">{getMotivationalMessage()}</span>
                <span>100% Blindado</span>
              </div>
            </div>

          </div>

          {/* Right Column: CTA Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => setShowJourneyModal(true)}
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <ShieldCheck size={16} />
              <span>Jornada dos 14 Dias</span>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setShowSummaryModal(true)}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award size={14} className="text-amber-400" />
              <span>Resumo do seu Progresso</span>
            </button>
          </div>

        </div>
      </div>

      {/* JOURNEY STEPS MODAL */}
      {showJourneyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left">
            
            {/* Close */}
            <button
              onClick={() => setShowJourneyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Jornada de Blindagem do Restaurante
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Seu restaurante está <span className="text-emerald-400 font-extrabold">{blindagemPercentage}% blindado</span> ({completedCount}/10 Etapas Concluídas)
                </p>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    step.completed 
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200' 
                      : 'bg-slate-950/60 border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                        ETAPA {step.stepNumber}
                      </span>
                      <span className={`text-xs md:text-sm font-bold block ${step.completed ? 'text-white' : 'text-slate-200'}`}>
                        {step.title}
                      </span>
                    </div>
                  </div>

                  {!step.completed && step.actionTab && onNavigateTab && (
                    <button
                      onClick={() => {
                        setShowJourneyModal(false);
                        onNavigateTab(step.actionTab!);
                      }}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{step.actionText}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                  {step.completed && (
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                      Descoberto ✓
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Footer info */}
            <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-400 text-left font-medium">
                Sua jornada com o Xande garante mais dinheiro no caixa e decisões inteligentes.
              </p>
              <button
                onClick={() => setShowJourneyModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Continuar Descobrindo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 14-DAY SUMMARY MODAL (PREMIUM EXPERIENCE) */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative text-left">
            
            <button
              onClick={() => setShowSummaryModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto h-14 w-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-400 mb-3 animate-pulse">
                <Award size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                Parabéns! Durante os últimos 14 dias você descobriu informações valiosas sobre o seu restaurante.
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-semibold">
                Confira o balanço de proteção do seu lucro:
              </p>
            </div>

            {/* Summary List */}
            <div className="space-y-3 mb-6 bg-slate-950/80 p-5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs md:text-sm font-bold text-white">
                  Seu restaurante está <strong className="text-emerald-400">{blindagemPercentage}% blindado</strong>.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs md:text-sm font-bold text-white">
                  Você concluiu <strong className="text-emerald-400">{completedCount} etapas</strong> da jornada.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs md:text-sm font-bold text-white">
                  Você identificou oportunidades reais de aumentar o lucro.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs md:text-sm font-bold text-white">
                  Você descobriu como proteger melhor seus custos e margens.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs md:text-sm font-bold text-white">
                  Você já possui um consultor inteligente (Xande) trabalhando ao seu lado.
                </span>
              </div>
            </div>

            {/* Final Message */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center mb-6">
              <p className="text-sm font-extrabold text-emerald-300">
                Não deixe o seu restaurante voltar a operar no escuro.
              </p>
            </div>

            {/* Action Button */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowSummaryModal(false);
                  if (onNavigateTab) onNavigateTab('plans');
                }}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>CONTINUAR COM O MEU RESTAURANTE BLINDADO</span>
                <ArrowRight size={16} />
              </button>
              
              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-full py-2.5 text-slate-400 hover:text-white font-bold text-xs text-center cursor-pointer"
              >
                Voltar ao Painel do Dono
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
