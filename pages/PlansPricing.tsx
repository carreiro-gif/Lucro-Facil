import React, { useState } from 'react';
import { Check, Sparkles, Store, Flame, Hourglass, HelpCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getApiUrl = (path: string) => {
  const origin = window.location.origin;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    const hostname = window.location.hostname;
    return `http://${hostname}:3000${path}`;
  }
  return path;
};

export const PlansPricing: React.FC = () => {
  const { user, profile } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // If the user is default admin, do not render this screen
  if (profile?.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com') {
    return (
      <div className="p-6 text-center text-slate-400 font-sans">
        <p>Acesso restrito ao administrador principal. Administradores têm acesso total ilimitado.</p>
      </div>
    );
  }

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      alert("Erro: Usuário não autenticado no sistema.");
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await fetch(getApiUrl('/api/create-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          plan: planId,
          billingCycle: billingCycle
        })
      });

      if (!response.ok) {
        throw new Error("Não foi possível iniciar a solicitação com a Stone/Pagar.me.");
      }

      const data = await response.json();
      if (data.checkout_url) {
        // Redirect to Stone / Pagar.me checkout or the local simulator
        window.location.href = data.checkout_url;
      } else {
        throw new Error("Nenhum link de pagamento recebido do servidor.");
      }
    } catch (err: any) {
      console.error("Erro ao processar assinatura:", err);
      alert(err.message || "Houve um erro de rede ou servidor ao iniciar sua assinatura.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: billingCycle === 'monthly' ? 'R$ 29,90' : 'R$ 299,00',
      period: billingCycle === 'monthly' ? 'por mês' : 'por ano',
      subtitle: 'Para quem está começando',
      equiv: billingCycle === 'yearly' ? 'Equivalente a R$ 24,90/mês' : null,
      limitDesc: 'Limite de 1 loja',
      features: [
        'Todas as funcionalidades do sistema',
        'Precificação inteligente para todos os canais',
        'Consultor Xande com IA',
        'Fichas técnicas e CMV',
        'Ponto de equilíbrio',
        'Ofertas inteligentes',
        'Suporte por email'
      ],
      popular: false,
      color: 'border-slate-800'
    },
    {
      id: 'growth',
      name: 'Growth',
      price: billingCycle === 'monthly' ? 'R$ 49,90' : 'R$ 499,00',
      period: billingCycle === 'monthly' ? 'por mês' : 'por ano',
      subtitle: 'Para quem está crescendo',
      equiv: billingCycle === 'yearly' ? 'Equivalente a R$ 41,50/mês' : null,
      limitDesc: 'Até 5 lojas',
      features: [
        'Todos os benefícios do Starter',
        'Gerenciamento multi-lojas',
        'Replicação de dados entre lojas',
        'Comparativo de desempenho entre unidades'
      ],
      popular: true,
      color: 'border-brand-yellow shadow-brand-yellow/20 ring-2 ring-brand-yellow/30'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? 'R$ 59,90' : 'R$ 599,00',
      period: billingCycle === 'monthly' ? 'por mês' : 'por ano',
      subtitle: 'Para redes e franquias',
      equiv: billingCycle === 'yearly' ? 'Equivalente a R$ 49,90/mês' : null,
      limitDesc: 'Lojas ilimitadas',
      features: [
        'Todos os benefícios do Growth',
        'Suporte prioritário e exclusivo',
        'Ideal para redes e franqueadores'
      ],
      popular: false,
      color: 'border-slate-800'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-8 font-sans animate-fade-in relative">
      {/* Visual background flares */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4">
          <Sparkles size={14} /> Planos do Lucro Fácil
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Escolha o plano ideal para a sua loja
        </h2>
        <p className="text-sm md:text-base text-slate-400">
          Chega de pagar para trabalhar! Blinde as margens do seu negócio e junte-se a centenas de hamburguerias que precificam com lucro todos os dias.
        </p>
      </div>

      {/* Billing Cycle Switcher */}
      <div className="flex justify-center mb-10 relative z-10">
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              billingCycle === 'monthly'
                ? 'bg-brand-yellow text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-brand-yellow text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Anual <span className={`${billingCycle === 'yearly' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'} text-[10px] px-1.5 py-0.5 rounded font-black border border-emerald-500/25`}>Economize 15%</span>
          </button>
        </div>
      </div>

      {/* Plans Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full mb-16 relative z-10">
        {plans.map((plan) => (
          <div
            key={plan.id}
            id={`plan-${plan.id}`}
            className={`bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 border ${plan.color} flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.03] hover:border-brand-yellow/40 shadow-xl`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-yellow text-slate-950 text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-brand-yellow/20">
                <Flame size={12} fill="currentColor" /> MAIS POPULAR
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{plan.subtitle}</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-500 text-xs">{plan.period}</span>
                  </div>
                  {plan.equiv && (
                    <div className="text-emerald-400 text-[11px] font-bold tracking-wide">
                      {plan.equiv}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-yellow mt-4 font-black uppercase tracking-wider bg-brand-yellow/10 px-3 py-1 rounded w-fit">
                  <Store size={12} /> {plan.limitDesc}
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <ul className="space-y-3.5 text-xs text-slate-300">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={14} className="text-brand-yellow mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              id={`btn-subscribe-${plan.id}`}
              disabled={loadingPlan !== null}
              onClick={() => handleSubscribe(plan.id)}
              className={`mt-8 w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex justify-center items-center gap-2 ${
                plan.popular
                  ? 'bg-brand-yellow hover:bg-yellow-400 text-slate-950 hover:shadow-brand-yellow/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              } ${loadingPlan !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingPlan === plan.id ? (
                <>
                  <Loader className="animate-spin text-slate-950" size={14} /> Processando...
                </>
              ) : (
                'Assinar agora'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Trial Promo Banner Section */}
      <div className="max-w-5xl mx-auto bg-slate-900/30 border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-3 rounded-2xl text-brand-yellow shrink-0">
            <Hourglass size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">Teste grátis por 14 dias sem precisar de cartão de crédito.</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Experimente todas as funcionalidades do plano Starter sem compromisso. Sem pegadinhas, sem contratos. Cancele quando quiser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
