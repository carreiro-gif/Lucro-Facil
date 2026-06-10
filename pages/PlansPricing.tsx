import React from 'react';
import { Check, Sparkles, Store, Flame, Hourglass, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PlansPricing: React.FC = () => {
  const { profile } = useAuth();

  // If the user is default admin, do not render this screen
  if (profile?.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com') {
    return (
      <div className="p-6 text-center text-slate-400 font-sans">
        <p>Acesso restrito ao administrador principal. Administradores têm acesso total ilimitado.</p>
      </div>
    );
  }

  const handleSignUpClick = () => {
    alert("Em breve disponível, estamos configurando o sistema de pagamento. Você será notificado assim que estiver pronto.");
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'R$ 29,90',
      period: 'por mês',
      subtitle: 'Para quem está começando',
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
      price: 'R$ 49,90',
      period: 'por mês',
      subtitle: 'Para quem está crescendo',
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
      price: 'R$ 59,90',
      period: 'por mês',
      subtitle: 'Para redes e franquias',
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
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-slate-500 text-xs">{plan.period}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-yellow mt-3.5 font-black uppercase tracking-wider bg-brand-yellow/10 px-3 py-1 rounded w-fit">
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
              onClick={handleSignUpClick}
              className={`mt-8 w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex justify-center items-center gap-2 ${
                plan.popular
                  ? 'bg-brand-yellow hover:bg-yellow-400 text-slate-950 hover:shadow-brand-yellow/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              Assinar agora
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
