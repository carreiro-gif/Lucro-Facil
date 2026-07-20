import React, { useState } from 'react';
import { ShieldAlert, Check, LogOut, Store, CreditCard, Sparkles, CheckCircle } from 'lucide-react';
import { UserProfile } from '../context/AuthContext';

interface SubscriptionBlockScreenProps {
  profile: UserProfile | null;
  onSignOut: () => void;
  onRenew: (plan: 'starter' | 'growth' | 'pro', maxStores: number) => Promise<void>;
}

export const SubscriptionBlockScreen: React.FC<SubscriptionBlockScreenProps> = ({ profile, onSignOut, onRenew }) => {
  const [loadingPlan, setLoadingPlan] = useState<'starter' | 'growth' | 'pro' | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelectPlan = async (plan: 'starter' | 'growth' | 'pro', maxStores: number) => {
    setLoadingPlan(plan);
    try {
      await onRenew(plan, maxStores);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Falha ao atualizar plano.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const planOptions = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: 'R$ 29,90',
      period: 'por mês',
      stores: 'Apenas 1 Loja',
      maxStores: 1,
      features: [
        'Acesso completo a todos os módulos',
        'Controle de CMV e Insumos',
        'Fichas técnicas e precificação',
        'CFI para 1 loja',
        'Engenharia de cardápio',
        'Gerador de combos lucrativos'
      ],
      popular: false,
      color: 'border-slate-800'
    },
    {
      id: 'growth' as const,
      name: 'Growth',
      price: 'R$ 49,90',
      period: 'por mês',
      stores: 'Até 5 Lojas',
      maxStores: 5,
      features: [
        'Todas as features do Starter',
        'Gerenciamento de até 5 lojas',
        'Replicação e cópia de dados entre lojas',
        'Ideal para operações multimarcas',
        'Lista de compras integrada',
        'Relatório de lucro consolidado'
      ],
      popular: true,
      color: 'border-brand-yellow shadow-brand-yellow/10 ring-2 ring-brand-yellow/20'
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: 'R$ 59,90',
      period: 'por mês',
      stores: 'Lojas Ilimitadas',
      maxStores: 999,
      features: [
        'Todas as features premium',
        'Lojas e marcas em quantidade ilimitada',
        'Backup automático na nuvem',
        'Suporte prioritário exclusivo',
        'Visualização integrada no Admin HUD',
        'Alta performance para franqueadores'
      ],
      popular: false,
      color: 'border-slate-800'
    }
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
          <CheckCircle size={44} />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Plano Ativado com Sucesso!</h1>
        <p className="text-slate-400 max-w-md mb-8">
          Sua conta foi reativada com o plano escolhido e já está pronta para uso imediato. Vamos faturar e precificar com lucro!
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-brand-yellow hover:bg-yellow-500 text-slate-900 font-bold px-8 py-3 rounded-xl shadow-lg shadow-brand-yellow/20 transition-all font-sans"
        >
          Acessar o Cardápio Blindado
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white py-16 px-4 md:px-8 relative overflow-hidden flex flex-col justify-between font-sans">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl w-full mx-auto relative z-10 flex-1 flex flex-col justify-center">
        {/* Header warnings */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-brand-red px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 animate-pulse">
            <ShieldAlert size={14} /> Conta Bloqueada
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Sua assinatura ou trial expirou!
          </h1>
          <p className="text-sm md:text-base text-slate-400">
            Dificuldades em monitorar seus lucros? Não pare de crescer! Escolha um dos nossos planos abaixo e continue gerenciando o caixa e blindando as margens da sua hamburgueria.
          </p>
          {profile && (
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Conta: <span className="text-slate-400">{profile.email}</span> • Status anterior: <span className="text-slate-400 capitalize">{profile.status}</span>
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full mb-12">
          {planOptions.map((opt) => (
            <div
              key={opt.id}
              className={`bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border ${opt.color} flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.02] hover:border-brand-yellow/30`}
            >
              {opt.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-yellow text-slate-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-brand-yellow/20">
                  <Sparkles size={10} /> MAIS VENDIDO
                </div>
              )}

              <div className="space-y-4">
                <div className="border-b border-white/5 pb-4">
                  <h3 className="text-xl font-bold text-white mb-2">{opt.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold">{opt.price}</span>
                    <span className="text-slate-500 text-xs">{opt.period}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-brand-yellow mt-2 font-black uppercase tracking-wider bg-brand-yellow/10 px-2.5 py-1 rounded w-fit">
                    <Store size={12} /> {opt.stores}
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  {opt.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                disabled={loadingPlan !== null}
                onClick={() => handleSelectPlan(opt.id, opt.maxStores)}
                className={`mt-8 w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex justify-center items-center gap-2 ${
                  opt.popular
                    ? 'bg-brand-yellow text-slate-900 hover:bg-yellow-400 hover:shadow-brand-yellow/20'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {loadingPlan === opt.id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CreditCard size={14} /> Ativar / Renovar
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-white/5 pt-8">
          <p className="text-xs text-slate-500">
            Precisa de ajuda ou transferência bancária/Pix? Fale com nosso suporte.
          </p>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition"
          >
            <LogOut size={14} /> Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
