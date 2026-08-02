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
      name: 'BLINDADO',
      price: billingCycle === 'monthly' ? 'R$ 49,90' : 'R$ 499,00',
      period: billingCycle === 'monthly' ? 'por mês' : 'por ano',
      subtitle: 'Ideal para restaurantes que querem vender mais e lucrar melhor.',
      dailyHighlight: 'MENOS DE R$ 1,67 POR DIA',
      dailyPhrase: 'Por menos do que o valor de um refrigerante por dia, você protege o lucro do seu restaurante.',
      limitDesc: '1 Loja',
      features: [
        'Descubra quais produtos dão mais lucro',
        'Saiba exatamente quanto cobrar em cada canal de venda',
        'Proteja sua margem de lucro automaticamente',
        'Descubra quanto precisa faturar todos os dias',
        'Tome decisões mais lucrativas em poucos segundos',
        'Tenha seu restaurante blindado contra prejuízos',
        'Descubra onde você está perdendo dinheiro',
        'Aumente o ticket médio do seu restaurante',
        'Saiba se suas promoções realmente dão lucro',
        'Seu consultor particular (Xande) trabalhando 24h ao seu lado'
      ],
      popular: false,
      color: 'border-slate-800'
    },
    {
      id: 'growth',
      name: 'BLINDADO PLUS',
      price: billingCycle === 'monthly' ? 'R$ 79,90' : 'R$ 799,00',
      period: billingCycle === 'monthly' ? 'por mês' : 'por ano',
      subtitle: 'Ideal para quem possui mais de uma operação e quer crescer sem perder o controle do lucro.',
      dailyHighlight: 'MENOS DE R$ 2,67 POR DIA',
      dailyPhrase: 'Gerencie até 5 lojas e descubra qual delas é a mais lucrativa.',
      limitDesc: 'Até 5 lojas',
      features: [
        'Todos os benefícios do plano Blindado',
        'Gerencie até 5 lojas e descubra qual delas é a mais lucrativa',
        'Sincronização automática de dados entre unidades',
        'Análise comparativa de desempenho entre lojas',
        'Descubra oportunidades escondidas dentro do seu cardápio',
        'Seu consultor particular (Xande) disponível 24h para todas as lojas'
      ],
      popular: true,
      color: 'border-emerald-500/80 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
    },
    {
      id: 'pro',
      name: 'BLINDADO PRO',
      price: billingCycle === 'monthly' ? 'R$ 129,90' : 'R$ 1.299,00',
      period: billingCycle === 'monthly' ? 'por mês' : 'por ano',
      subtitle: 'Ideal para quem administra várias unidades e quer acompanhar tudo em um só lugar.',
      dailyHighlight: 'MENOS DE R$ 4,34 POR DIA',
      dailyPhrase: 'Tenha uma visão completa e ilimitada da operação do seu grupo de restaurantes.',
      limitDesc: 'Lojas ilimitadas',
      features: [
        'Todos os benefícios do plano Blindado Plus',
        'Visão completa e ilimitada da operação do seu grupo de restaurantes',
        'Lojas e marcas em quantidade ilimitada',
        'Suporte prioritário e exclusivo para franqueados e gerentes',
        'Tome decisões com muito mais segurança em grande escala',
        'Seu consultor particular (Xande) trabalhando ao lado da sua equipe 24h'
      ],
      popular: false,
      color: 'border-slate-800'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-8 font-sans animate-fade-in relative text-left">
      {/* Visual background flares */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4">
          <Sparkles size={14} /> O SEU SÓCIO ESPECIALISTA EM LUCRO PARA RESTAURANTES
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 uppercase">
          Escolha o plano de blindagem do seu restaurante
        </h2>
        
        {/* Impact Phrase */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 my-4 max-w-2xl mx-auto shadow-xl">
          <p className="text-sm md:text-base font-bold text-emerald-400 leading-relaxed italic">
            "O Cardápio Blindado não é apenas um sistema. É como ter um sócio especialista em restaurantes trabalhando ao seu lado todos os dias."
          </p>
        </div>
      </div>

      {/* Billing Cycle Switcher */}
      <div className="flex justify-center mb-10 relative z-10">
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'yearly'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Anual <span className={`${billingCycle === 'yearly' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'} text-[10px] px-2 py-0.5 rounded font-black border border-emerald-500/25`}>GANHE 2 MESES GRÁTIS</span>
          </button>
        </div>
      </div>

      {/* Plans Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full mb-12 relative z-10 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.id}
            id={`plan-${plan.id}`}
            className={`bg-slate-900/80 backdrop-blur-md rounded-3xl p-7 border ${plan.color} flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.02] shadow-2xl text-left`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                <Flame size={12} fill="currentColor" /> RECOMENDADO
              </div>
            )}

            <div className="space-y-5">
              <div>
                <span className="inline-block bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                  {plan.dailyHighlight}
                </span>

                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed min-h-[36px]">{plan.subtitle}</p>
                
                <div className="flex flex-col gap-1.5 border-t border-b border-white/5 py-4 my-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl md:text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-xs font-semibold">{plan.period}</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 font-semibold leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-white/5 mt-1">
                    {plan.dailyPhrase}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-black uppercase tracking-wider bg-emerald-500/10 px-3 py-1.5 rounded-xl w-fit border border-emerald-500/20">
                  <Store size={14} /> {plan.limitDesc}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Resultados inclusos no plano:</p>
                <ul className="space-y-3 text-xs text-slate-300 font-medium">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
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
              className={`mt-8 w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer ${
                plan.popular
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              } ${loadingPlan !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingPlan === plan.id ? (
                <>
                  <Loader className="animate-spin text-slate-950" size={14} /> Processando...
                </>
              ) : (
                'Blindar Meu Restaurante'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Card Premium: INCLUSO EM TODOS OS PLANOS */}
      <div className="max-w-5xl mx-auto mb-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="text-center mb-6">
          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Garantia & Transparência
          </span>
          <h3 className="text-xl md:text-2xl font-black text-white mt-2 uppercase tracking-tight">
            INCLUSO EM TODOS OS PLANOS
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-200">
          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>14 dias grátis</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>Xande trabalhando 24h ao seu lado</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>Atualizações gratuitas</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>Sem taxa de implantação</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>Sem fidelidade</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </div>

      {/* Posicionamento do Xande */}
      <div className="max-w-5xl mx-auto mb-12 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-left shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-2xl font-black text-emerald-400">X</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
              VOCÊ NUNCA MAIS VAI PRECISAR TOMAR DECISÕES SOZINHO NO SEU RESTAURANTE.
            </h3>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              O Xande está disponível 24 horas por dia para tirar dúvidas, ajudar na precificação, analisar resultados e mostrar onde você pode aumentar o lucro do seu negócio.
            </p>
            <p className="text-xs font-bold text-emerald-400">
              Seu consultor particular trabalhando ao seu lado para aumentar o lucro do seu restaurante.
            </p>
          </div>
        </div>
      </div>

      {/* Trial Promo Banner Section */}
      <div className="max-w-5xl mx-auto bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start justify-between gap-6 relative overflow-hidden shadow-2xl text-left">
        <div className="flex items-start gap-5">
          <div className="bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl text-emerald-400 shrink-0 mt-1">
            <Hourglass size={32} />
          </div>
          <div className="space-y-3">
            <h4 className="text-base md:text-lg font-black text-white uppercase tracking-tight">
              EM 14 DIAS NÓS VAMOS DESCOBRIR JUNTOS QUANTO DINHEIRO O SEU RESTAURANTE ESTÁ DEIXANDO NA MESA.
            </h4>
            
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-emerald-400">
              <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Sem cartão de crédito</span>
              <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Sem compromisso</span>
              <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Sem pegadinhas</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Durante os próximos 14 dias, o Xande vai trabalhar junto com você para descobrir onde está o lucro escondido do seu restaurante. Você vai entender exatamente:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200 font-medium">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Quanto precisa faturar por dia</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Quais produtos dão mais dinheiro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Onde está perdendo lucro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Como vender melhor</span>
              </li>
              <li className="flex items-center gap-2 sm:col-span-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Como proteger suas margens</span>
              </li>
            </ul>

            <p className="text-xs font-bold text-slate-400 pt-1">
              Se ao final dos 14 dias você não enxergar valor no Cardápio Blindado, basta cancelar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
