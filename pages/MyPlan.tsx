import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Check, DollarSign, Calendar, Landmark, CreditCard, ArrowRight, Award } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  method: 'Pix' | 'Cartão';
  status: 'active' | 'pago' | 'trial';
}

export const MyPlan: React.FC = () => {
  const { profile } = useAuth();

  // 1. Identify active plan details
  const getPlanDisplayName = (plan?: string) => {
    switch (plan?.toLowerCase()) {
      case 'growth': return 'BLINDADO PLUS';
      case 'pro': return 'BLINDADO PRO';
      default: return 'BLINDADO';
    }
  };
  const planName = getPlanDisplayName(profile?.plan);
  const planStatus = profile?.status || 'trial';

  // 2. Format the expiration date dynamically
  const formattedExpiry = useMemo(() => {
    const rawDate = profile?.planExpiry || profile?.trialEnd;
    if (!rawDate) return 'Não Definida';
    try {
      const date = new Date(rawDate);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      return 'Formato Inválido';
    }
  }, [profile]);

  // 3. Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ativo
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Teste Grátis
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-500">
            Expirado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-500">
            Inativo
          </span>
        );
    }
  };

  // 4. Plan Benefits selection
  const planBenefits = useMemo(() => {
    const tier = profile?.plan || 'starter';
    if (tier === 'starter') {
      return [
        '1 Loja Permitida',
        'Seu consultor particular (Xande) 24h',
        'Blindagem completa de margem e precificação',
      ];
    } else if (tier === 'growth') {
      return [
        'Até 5 Lojas Gerenciadas',
        'Seu consultor particular (Xande) para todas as lojas',
        'Sincronização e comparativo entre unidades',
      ];
    } else {
      // Pro or Admin
      return [
        'Lojas e Marcas Ilimitadas',
        'Seu consultor particular (Xande) prioritário',
        'Máxima proteção para redes e franquias',
      ];
    }
  }, [profile]);

  // 5. Historical billing checklist (fictional/real mock array as requested)
  const transactions: Transaction[] = useMemo(() => {
    const tier = profile?.plan || 'starter';
    const baseAmount = tier === 'pro' ? 129.90 : tier === 'growth' ? 79.90 : 49.90;

    // Generate last 3 months of payments if active, otherwise show standard structure
    if (profile?.status === 'active') {
      return [
        {
          id: 'tx-003',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: baseAmount,
          method: 'Cartão',
          status: 'pago',
        },
        {
          id: 'tx-002',
          date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          amount: baseAmount,
          method: 'Pix',
          status: 'pago',
        },
        {
          id: 'tx-001',
          date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
          amount: baseAmount,
          method: 'Cartão',
          status: 'pago',
        },
      ];
    }

    // Trial state default row showing start of trial
    return [
      {
        id: 'tx-trial',
        date: profile?.trialStart || new Date().toISOString(),
        amount: 0.0,
        method: 'Pix',
        status: 'trial',
      },
    ];
  }, [profile]);

  const handleUpgradeRedirect = () => {
    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'plans' }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 font-sans">
      
      {/* Bloco 1: O Recado Consultivo do Xande */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-start">
        {/* Background glow behind Xande */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Xande Custom Avatar Container */}
        <div className="shrink-0 flex items-center justify-center relative w-16 h-16 md:w-20 md:h-20 bg-slate-950 rounded-2xl border-2 border-emerald-500/30 overflow-hidden shadow-inner group">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 to-slate-900/40 z-0"></div>
          {/* Custom SVG Drawing of Chef with Dark Jacket, Green growth arrow & dollar symbol */}
          <svg className="w-12 h-12 md:w-16 md:h-16 relative z-10 text-emerald-400" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Dark Chef Coat / Body */}
            <path d="M12 54C12 44.5 18 38 28 36.5C28.5 36 29 35 29 34V31.5H35V34C35 35 35.5 36 36 36.5C46 38 52 44.5 52 54" fill="#1E293B" stroke="#334155" strokeWidth="2.5" />
            <path d="M25 36.5L32 44L39 36.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            {/* Chef Hat/Head */}
            <circle cx="32" cy="23" r="7" fill="#090D16" stroke="#475569" strokeWidth="2" />
            <path d="M22 17C22 11 25 8 32 8C39 8 42 11 42 17C42 19.5 40 21 37 21H27C24 21 22 19.5 22 17Z" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
            {/* Seta Verde de Crescimento */}
            <path d="M42 46L48 40L54 46M48 41V53" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Cifrão $ symbol inside growth context */}
            <text x="44" y="32" fill="#10B981" fontSize="11" fontWeight="900" fontFamily="sans-serif">$</text>
          </svg>
          {/* Badge indicator on avatar */}
          <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-950">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          </span>
        </div>

        {/* Balloon chat Text Box */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Xande</span>
            <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800">Consultor Financeiro</span>
          </div>
          <div className="relative bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-slate-300 text-sm leading-relaxed">
            "Área Financeira do seu Restaurante! 🤠 Aqui você tem o controle total da sua ferramenta. Nada de pegadinhas ou cobranças escondidas. Você consegue ver o dia exato do vencimento do seu plano e o histórico de tudo o que já investiu para blindar o seu caixa. Se precisar mudar de plano para cadastrar mais filiais ou expandir sua operação, o botão de upgrade está logo ali!"
          </div>
        </div>
      </div>

      {/* Bloco 2 & Bloco 3: Two-Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Bloco 2: O Painel do Plano Atual */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Yellow decorative flare */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase font-black tracking-wider block">Plano Contratado</span>
                <h3 className="text-4xl font-extrabold text-white tracking-tight leading-none uppercase">
                  {planName}
                </h3>
              </div>
              <div>
                {getStatusBadge(planStatus)}
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar size={14} className="text-brand-yellow" />
                  <span className="text-xs uppercase font-bold tracking-wider">Próximo Vencimento</span>
                </div>
                <p className="text-lg font-black text-white">{formattedExpiry}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Landmark size={14} className="text-brand-yellow" />
                  <span className="text-xs uppercase font-bold tracking-wider">Unidades/Lojas</span>
                </div>
                <p className="text-lg font-black text-white">
                  {profile?.maxStores && profile.maxStores < 999 ? `${profile.maxStores} Ativas` : 'Ilimitadas'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <button
              onClick={handleUpgradeRedirect}
              className="w-full py-4 bg-brand-yellow hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-brand-yellow/10 hover:shadow-brand-yellow/20 flex items-center justify-center gap-2 group"
            >
              Alterar / Fazer Upgrade de Plano
              <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bloco 3: Lista de Benefícios Ativos */}
        <div className="md:col-span-2 bg-slate-900/45 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Green decorative flare */}
          <div className="absolute top-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
              <Award size={18} className="text-emerald-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Sua Operação Blindada</h4>
            </div>

            <ul className="space-y-4">
              {planBenefits.map((benefit, index) => (
                <li key={index} className="flex gap-3 items-start">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <Check size={12} className="stroke-[3]" />
                  </span>
                  <span className="text-sm text-slate-300 font-medium leading-relaxed">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 text-[11px] text-slate-500 font-medium border-t border-slate-800/40 pt-4 text-center">
            Mantenha as regras do CFI ativas e garanta suas margens.
          </div>
        </div>

      </div>

      {/* Bloco 4: Extrato de Investimentos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="text-brand-yellow" size={18} />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Extrato de Investimentos</h4>
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-md">
            Histórico de Cobranças
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-850">
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Data</th>
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Valor</th>
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Método de Pagamento</th>
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/20">
              {transactions.map((tx) => {
                const formattedDate = new Date(tx.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                
                return (
                  <tr key={tx.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-300 font-mono">
                      {formattedDate}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-white font-mono">
                      {tx.amount === 0 ? 'Gratuito' : `R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      <div className="flex items-center gap-2">
                        {tx.method === 'Cartão' ? (
                          <CreditCard size={14} className="text-slate-500" />
                        ) : (
                          <span className="font-extrabold text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">PIX</span>
                        )}
                        {tx.method}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {tx.status === 'trial' ? (
                        <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                          ✓ Período de Testes
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                          ✅ Pago
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
