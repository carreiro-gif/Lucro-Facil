import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  DollarSign, 
  X, 
  Menu,
  Clock,
  Shield,
  Bot,
  Sparkles,
  Zap,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Notification states
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Navigation & UI states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeXandeQuestion, setActiveXandeQuestion] = useState<number>(0);

  // Clear states when opening modal
  const openAuth = (selectedMode: 'login' | 'register') => {
    setMode(selectedMode);
    setError(null);
    setMessage(null);
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !email.includes('@')) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email);
        setMessage("E-mail de recuperação de senha enviado com sucesso! Verifique sua caixa de entrada.");
      } catch (err: any) {
        setError(err.message || "Erro ao solicitar redefinição de senha.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setError("A senha deve conter pelo menos 6 caracteres.");
      return;
    }

    if (mode === 'register') {
      if (!storeName.trim()) {
        setError("O nome do seu restaurante é obrigatório.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }

      setLoading(true);
      try {
        await signUp(email, password, storeName.trim());
        setMessage("Conta de blindagem criada com sucesso! Redirecionando...");
      } catch (err: any) {
        setError(err.message || "Erro ao criar conta.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await signIn(email, password);
      } catch (err: any) {
        setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 7 Emotional Insights the owner discovers
  const discoveryPoints = [
    { num: "01", title: "Quanto você realmente ganha", desc: "Descubra o lucro real que sobra no seu bolso ao final do mês, limpo e direto." },
    { num: "02", title: "Onde seu dinheiro está vazando", desc: "Identifique custos ocultos, desperdícios e perdas que passam despercebidos." },
    { num: "03", title: "Quais produtos colocam mais dinheiro no seu bolso", desc: "Descubra os campeões de margem e foque no que realmente traz retorno." },
    { num: "04", title: "Se você está vendendo barato", desc: "Saiba se seus preços estão defasados ou pagando para trabalhar nas plataformas." },
    { num: "05", title: "Quanto você precisa vender por dia", desc: "Mantenha a meta diária de vendas no radar para alcançar o ponto de lucro." },
    { num: "06", title: "Como aumentar seu ticket médio", desc: "Alique estratégias de combos e ofertas que elevam o valor de cada pedido." },
    { num: "07", title: "Como lucrar mais sem trabalhar mais horas", desc: "Tome decisões inteligentes baseadas no Cardápio Blindado e trabalhe com tranquilidade." }
  ];

  // 3 Q&A Examples for Xande IA
  const xandeDialogues = [
    {
      question: "Onde meu restaurante está perdendo dinheiro?",
      answer: "Analisando seu cardápio, identificamos que o custo de insumos do seu prato principal subiu 8% no último mês. Ajustando a composição, você recupera R$ 1.420,00 de lucro no mês.",
      tag: "Análise de Lucro"
    },
    {
      question: "Vale a pena fazer uma promoção no iFood hoje?",
      answer: "Sim! Se combinarmos seu produto mais vendido com uma bebida de alta margem, seu ticket médio sobe sem comprometer o valor que entra no seu caixa.",
      tag: "Aumento de Ticket"
    },
    {
      question: "Quanto meu restaurante precisa vender hoje?",
      answer: "Para manter o lucro protegido este mês, sua meta de vendas para hoje é de R$ 842,00. Seu restaurante já está 67% blindado!",
      tag: "Meta de Vendas"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-400 relative overflow-x-hidden">
      
      {/* GLOBAL ANIMATIONS & STYLES */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1.5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-2deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.04); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out both; }
        .animate-float-1 { animation: float1 6s ease-in-out infinite; }
        .animate-float-2 { animation: float2 7s ease-in-out infinite; }
        .animate-float-3 { animation: float3 5.5s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulseGlow 4s ease-in-out infinite; }
      `}</style>

      {/* Abstract Glowing Backdrop Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] -mr-40 -mt-40 pointer-events-none opacity-70 animate-pulse-glow" />
      <div className="absolute top-[35%] left-[-150px] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-[-100px] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none opacity-40" />

      {/* HEADER / NAVIGATION */}
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <ShieldCheck className="text-slate-950 h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight uppercase block leading-none">
                Cardápio <span className="text-emerald-400">Blindado</span>
              </span>
              <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 block mt-0.5">
                Consultoria de Lucro para Restaurantes
              </span>
            </div>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <button onClick={() => handleScrollToSection('xande-apresentacao')} className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5">
              <Bot size={14} className="text-emerald-400 animate-pulse" />
              <span>Consultor Xande</span>
            </button>
            <button onClick={() => handleScrollToSection('descobertas')} className="hover:text-emerald-400 transition cursor-pointer">O que você descobre</button>
            <button onClick={() => handleScrollToSection('demonstracao')} className="hover:text-emerald-400 transition cursor-pointer">Painel do Dono</button>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => openAuth('login')}
              className="text-xs font-extrabold uppercase tracking-wider text-slate-300 hover:text-white transition px-4 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer"
            >
              Já possuo uma conta
            </button>
            <button 
              onClick={() => openAuth('register')}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer flex items-center gap-2"
            >
              <span>COMEÇAR MINHA BLINDAGEM</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-b border-white/10 px-6 py-6 space-y-4 animate-fade-in absolute top-20 left-0 w-full z-30 backdrop-blur-2xl text-left">
            <button 
              onClick={() => { setMobileMenuOpen(false); handleScrollToSection('xande-apresentacao'); }}
              className="block w-full text-left py-2 text-emerald-400 hover:text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <Bot size={16} />
              <span>Conhecer o Xande</span>
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); handleScrollToSection('descobertas'); }}
              className="block w-full text-left py-2 text-slate-200 hover:text-white text-sm font-bold uppercase tracking-wider"
            >
              Suas Descobertas
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); handleScrollToSection('demonstracao'); }}
              className="block w-full text-left py-2 text-slate-200 hover:text-white text-sm font-bold uppercase tracking-wider"
            >
              Painel do Dono
            </button>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <button 
                onClick={() => openAuth('login')}
                className="w-full py-3 bg-slate-900 border border-white/10 rounded-xl text-center text-xs font-black uppercase tracking-wider text-slate-200"
              >
                Já possuo uma conta
              </button>
              <button 
                onClick={() => openAuth('register')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl text-center shadow-lg"
              >
                COMEÇAR MINHA BLINDAGEM
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION - APRESENTAÇÃO PREMIUM DO CONSULTOR */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-6 text-center max-w-6xl mx-auto">
        
        {/* Concept Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
          <Sparkles size={14} className="animate-pulse" />
          <span>14 DIAS DE DESCOBERTA • SEU RESTAURANTE BLINDADO</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] mb-6 max-w-5xl mx-auto animate-fade-in-up">
          Descubra em apenas 14 dias quanto dinheiro o seu restaurante está{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
            deixando na mesa.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-300 text-base md:text-xl leading-relaxed max-w-3xl mx-auto font-medium mb-4 animate-fade-in-up delay-100">
          O Cardápio Blindado mostra exatamente onde você perde dinheiro e o que precisa fazer para aumentar o lucro do seu restaurante.
        </p>

        {/* Complementary */}
        <p className="text-emerald-400/90 text-xs md:text-sm font-bold tracking-wide mb-10 animate-fade-in-up delay-200">
          Você não precisa entender de CMV, precificação ou gestão. Nós cuidamos disso para você.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto animate-fade-in-up delay-300">
          <button 
            onClick={() => openAuth('register')}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl transition-all duration-200 shadow-2xl shadow-emerald-500/30 hover:scale-[1.03] cursor-pointer flex items-center justify-center gap-2.5"
          >
            <span>COMEÇAR MINHA BLINDAGEM</span>
            <ArrowRight size={18} />
          </button>

          <button 
            onClick={() => handleScrollToSection('xande-apresentacao')}
            className="w-full sm:w-auto px-6 py-4 bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-extrabold text-xs md:text-sm uppercase tracking-wider rounded-2xl transition duration-200 cursor-pointer"
          >
            CONHECER O SISTEMA
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Sem necessidade de cartão de crédito</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-emerald-400" />
            <span>Acesso imediato por 14 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-emerald-400" />
            <span>Consultor Xande incluso</span>
          </div>
        </div>

      </section>

      {/* APRESENTAÇÃO ESPECIAL DO XANDE */}
      <section id="xande-apresentacao" className="py-16 md:py-20 px-6 relative max-w-5xl mx-auto">
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 mb-8">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20 border border-emerald-300 shrink-0">
              <Bot size={44} strokeWidth={2} />
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-2">
                Seu Consultor Dedicado
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                "Olá! Eu sou o Xande."
              </h2>
              <p className="text-slate-300 text-sm md:text-base mt-2 font-medium leading-relaxed max-w-2xl">
                Durante os próximos 14 dias vou trabalhar junto com você para descobrir quanto dinheiro o seu restaurante pode ganhar a mais.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/5 mb-8">
            <p className="text-emerald-300 text-sm md:text-base font-bold leading-relaxed">
              "Minha missão é simples: proteger o lucro do seu restaurante e ajudá-lo a tomar decisões mais inteligentes todos os dias."
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition duration-200 shadow-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <span>COMEÇAR MINHA BLINDAGEM</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => openAuth('login')}
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
            >
              JÁ POSSUO UMA CONTA
            </button>
          </div>
        </div>
      </section>

      {/* O QUE O DONO DO RESTAURANTE DESCOBRE (7 DESCOBERTAS) */}
      <section id="descobertas" className="py-16 md:py-24 px-6 relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            A Jornada de Aumento de Lucro
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-white mt-3 uppercase tracking-tight">
            O que você vai descobrir em 14 dias
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Sem termos difíceis. Respostas diretas sobre o dinheiro que deve entrar no seu caixa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
          {discoveryPoints.map((item, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/40 transition duration-300 hover:bg-slate-900/90 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl font-black text-emerald-400/40 group-hover:text-emerald-400 transition-colors">
                  {item.num}
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <h3 className="text-sm md:text-base font-extrabold text-white mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PAINEL DO DONO - DASHBOARD DEMONSTRATIVO */}
      <section id="demonstracao" className="py-16 md:py-24 px-6 relative max-w-7xl mx-auto">
        
        <div className="text-center mb-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Centro de Controle do Lucro
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-white mt-3 uppercase tracking-tight">
            Painel do Dono
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Visão clara das oportunidades de dinheiro extra e proteção de margem.
          </p>
        </div>

        {/* Central Mockup Container with Floating Badges */}
        <div className="relative max-w-5xl mx-auto bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* FLOATING ANIMATED BADGES */}
          <div className="absolute -top-5 -left-4 md:-top-6 md:-left-8 bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md text-emerald-300 font-extrabold text-[10px] md:text-xs uppercase px-3.5 py-2 rounded-2xl shadow-xl animate-float-1 flex items-center gap-2 z-20">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Lucro protegido</span>
          </div>

          <div className="absolute top-1/4 -left-6 md:-left-12 bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md text-white font-extrabold text-[10px] md:text-xs uppercase px-3.5 py-2 rounded-2xl shadow-xl animate-float-2 flex items-center gap-2 z-20">
            <Sparkles size={14} className="text-emerald-400" />
            <span>Restaurante Blindado</span>
          </div>

          <div className="absolute bottom-12 -left-4 md:-left-10 bg-teal-500/20 border border-teal-400/40 backdrop-blur-md text-teal-300 font-extrabold text-[10px] md:text-xs uppercase px-3.5 py-2 rounded-2xl shadow-xl animate-float-3 flex items-center gap-2 z-20">
            <BarChart3 size={14} className="text-teal-400" />
            <span>Mais dinheiro no caixa</span>
          </div>

          <div className="absolute -top-6 right-8 md:right-16 bg-emerald-400 text-slate-950 font-black text-[10px] md:text-xs uppercase px-4 py-2 rounded-2xl shadow-xl animate-float-2 flex items-center gap-1.5 z-20">
            <TrendingUp size={14} />
            <span>Ticket Médio +15%</span>
          </div>

          <div className="absolute top-1/3 -right-6 md:-right-12 bg-emerald-950/90 border border-emerald-500/40 backdrop-blur-md text-emerald-300 font-black text-[10px] md:text-xs uppercase px-3.5 py-2 rounded-2xl shadow-xl animate-float-1 flex items-center gap-2 z-20">
            <DollarSign size={14} className="text-emerald-400" />
            <span>Lucro +27%</span>
          </div>

          <div className="absolute bottom-20 -right-4 md:-right-8 bg-slate-900/90 border border-teal-500/40 backdrop-blur-md text-white font-extrabold text-[10px] md:text-xs uppercase px-3.5 py-2 rounded-2xl shadow-xl animate-float-3 flex items-center gap-2 z-20">
            <Bot size={14} className="text-emerald-400" />
            <span>Xande IA Ativo</span>
          </div>

          {/* INNER MOCKUP BOARD */}
          <div className="bg-slate-950 rounded-2xl p-5 md:p-8 border border-white/5 space-y-6 text-left">
            
            {/* Top Stat Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Vendas do Mês</span>
                <span className="text-lg md:text-2xl font-black text-white">R$ 48.500,00</span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-1">+12% de evolução</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Custo dos Produtos</span>
                <span className="text-lg md:text-2xl font-black text-emerald-400">29.4%</span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-1">Margem Saudável ✓</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Margem de Lucro</span>
                <span className="text-lg md:text-2xl font-black text-emerald-400">32.8%</span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-1">Lucro Protegido</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Ponto de Lucro</span>
                <span className="text-lg md:text-2xl font-black text-white">R$ 18.200,00</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">Atingido dia 11</span>
              </div>
            </div>

            {/* Illustrative Bar Chart Representation */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase text-slate-300 tracking-wider">Desempenho & Lucratividade Diária</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  14 dias de blindagem ativos
                </span>
              </div>

              <div className="h-32 flex items-end justify-between gap-2 pt-4">
                {[65, 80, 45, 90, 75, 100, 85, 95, 70, 88, 105, 110, 92, 115].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${val * 0.9}px` }}
                    />
                    <span className="text-[8px] text-slate-500 font-mono">d{i+1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Xande Alert Banner inside Mockup */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                  <Bot size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Recomendação do Consultor Xande</h4>
                  <p className="text-[11px] text-slate-300">
                    Sua margem no prato mais vendido subiu R$ 2,50 por unidade após ajuste inteligente.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => openAuth('register')}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition shrink-0 cursor-pointer"
              >
                Testar com Seu Restaurante
              </button>
            </div>

          </div>

        </div>

      </section>

      {/* XANDE IA - CONSULTORIA EM TEMPO REAL */}
      <section className="py-16 md:py-24 px-6 relative max-w-6xl mx-auto">
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden text-left">
          
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider mb-4">
              <Bot size={16} />
              <span>Consultoria em Tempo Real</span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight">
              Tome decisões inteligentes todos os dias com o Xande.
            </h2>
            
            <p className="text-xs md:text-sm text-slate-300 mt-3 leading-relaxed">
              O Xande analisa seus números e indica exatamente onde agir para colocar mais dinheiro no seu bolso.
            </p>
          </div>

          {/* Interactive Chat Dialog Simulation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Question Switcher Tabs */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
                Clique nas perguntas para ver as respostas do Xande:
              </span>
              
              {xandeDialogues.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveXandeQuestion(idx)}
                  className={`w-full p-4 rounded-2xl border text-left transition duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    activeXandeQuestion === idx 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-lg' 
                      : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-950'
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">
                      {d.tag}
                    </span>
                    <span className="text-xs font-bold block">"{d.question}"</span>
                  </div>
                  <ChevronRight size={16} className={`shrink-0 transition-transform ${activeXandeQuestion === idx ? 'translate-x-1 text-emerald-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>

            {/* Chat Display Box */}
            <div className="lg:col-span-7 bg-slate-950 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl relative min-h-[280px]">
              
              {/* User Question */}
              <div className="flex justify-end">
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-2xl rounded-tr-none text-xs font-semibold max-w-[85%]">
                  {xandeDialogues[activeXandeQuestion].question}
                </div>
              </div>

              {/* Xande Answer */}
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Bot size={20} />
                </div>
                <div className="bg-slate-900 border border-white/10 text-slate-200 p-4 rounded-2xl rounded-tl-none text-xs leading-relaxed space-y-2 max-w-[90%] font-medium">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-white text-[11px]">Xande</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">Consultor de Lucro</span>
                  </div>
                  <p className="whitespace-pre-line text-slate-300">
                    {xandeDialogues[activeXandeQuestion].answer}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                <span>Respostas instantâneas personalizadas para o seu restaurante.</span>
                <button 
                  onClick={() => openAuth('register')}
                  className="text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  Falar com o Xande →
                </button>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* FINAL BOTTOM CALL TO ACTION */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight mb-4 relative z-10">
            Pronto para blindar o lucro do seu restaurante?
          </h2>
          
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mb-8 font-medium relative z-10">
            Inicie agora seus 14 dias de descoberta e descubra exatamente onde está o dinheiro do seu negócio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl transition duration-200 shadow-2xl shadow-emerald-500/20 cursor-pointer"
            >
              COMEÇAR MINHA BLINDAGEM
            </button>
            <button
              onClick={() => openAuth('login')}
              className="w-full sm:w-auto px-6 py-4 bg-slate-950 hover:bg-slate-900 border border-white/10 text-slate-300 font-extrabold text-xs md:text-sm uppercase tracking-wider rounded-2xl transition cursor-pointer"
            >
              JÁ POSSUO UMA CONTA
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-wide uppercase">Cardápio <span className="text-emerald-400">Blindado</span></span>
            <span>• Consultoria Inteligente de Lucro © 2026</span>
          </div>
          <div className="flex gap-6 font-medium">
            <button onClick={() => handleScrollToSection('descobertas')} className="hover:text-white transition cursor-pointer">Descobertas</button>
            <button onClick={() => handleScrollToSection('xande-apresentacao')} className="hover:text-white transition cursor-pointer">Consultor Xande</button>
            <button onClick={() => openAuth('login')} className="hover:text-white transition cursor-pointer">Login</button>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL (LIGHTBOX) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in-up text-left">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/5 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Brand Header inside Modal */}
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4 animate-pulse">
                <ShieldCheck className="text-emerald-400 h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                Cardápio <span className="text-emerald-400">Blindado</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                {mode === 'login' && "Acesse seu Centro de Controle do Lucro"}
                {mode === 'register' && "Inicie seus 14 dias de descoberta para blindar seu lucro"}
                {mode === 'forgot' && "Digite seu e-mail para recuperar o acesso"}
              </p>
            </div>

            {/* Notifications */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-950/40 border border-red-800/40 text-red-300 rounded-2xl text-xs font-semibold leading-relaxed flex gap-2 text-left">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-800/30 text-emerald-300 rounded-2xl text-xs font-semibold leading-relaxed flex gap-2 text-left">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    Nome do seu Restaurante
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      placeholder="Ex: Meu Restaurante"
                      className="w-full bg-slate-950/80 border border-white/5 hover:border-white/10 focus:border-emerald-500 text-white pl-10 pr-4 py-3 rounded-xl text-xs transition duration-200 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-slate-950/80 border border-white/5 hover:border-white/10 focus:border-emerald-500 text-white pl-10 pr-4 py-3 rounded-xl text-xs transition duration-200 outline-none"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}
                        className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-white/5 hover:border-white/10 focus:border-emerald-500 text-white pl-10 pr-10 py-3 rounded-xl text-xs transition duration-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-white/5 hover:border-white/10 focus:border-emerald-500 text-white pl-10 pr-10 py-3 rounded-xl text-xs transition duration-200 outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase text-xs py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 mt-2 shadow-lg cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>
                    {mode === 'login' && "Entrar no Painel do Dono"}
                    {mode === 'register' && "COMEÇAR MINHA BLINDAGEM"}
                    {mode === 'forgot' && "Recuperar Minha Senha"}
                  </span>
                )}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="text-center mt-6 pt-5 border-t border-white/5 text-xs font-semibold text-slate-400 leading-none">
              {mode === 'login' && (
                <p>
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); setMessage(null); }}
                    className="text-emerald-400 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Começar 14 dias de blindagem
                  </button>
                </p>
              )}

              {mode === 'register' && (
                <p>
                  Já possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                    className="text-emerald-400 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Fazer Login
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                  className="text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  Voltar para o Login
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
