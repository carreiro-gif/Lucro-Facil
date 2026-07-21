import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Check, 
  ArrowRight, 
  Star, 
  MessageSquare, 
  DollarSign, 
  Activity, 
  Percent, 
  X, 
  Menu,
  Clock,
  Shield,
  BookOpen,
  Award,
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
  const [activeDemoTab, setActiveDemoTab] = useState<'dashboard' | 'fichas' | 'xande'>('dashboard');

  // Clear states when opening/changing modal
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

    // Validate email
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

    // Validate password
    if (!password || password.length < 6) {
      setError("A senha deve conter pelo menos 6 caracteres.");
      return;
    }

    if (mode === 'register') {
      if (!storeName.trim()) {
        setError("O nome da loja é obrigatório.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }

      setLoading(true);
      try {
        await signUp(email, password, storeName.trim());
        setMessage("Conta criada com sucesso! Redirecionando...");
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

  const handleScrollToDemo = () => {
    const demoSec = document.getElementById('demonstracao');
    if (demoSec) {
      demoSec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-400 relative overflow-x-hidden">
      
      {/* GLOBAL CSS ANIMATIONS */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(-1.5deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.03); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out both;
        }
        .animate-float-slow-1 {
          animation: float-1 6s ease-in-out infinite;
        }
        .animate-float-slow-2 {
          animation: float-2 7s ease-in-out infinite;
        }
        .animate-float-slow-3 {
          animation: float-3 5.5s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>

      {/* Abstract Glowing Backdrop Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] -mr-100 -mt-50 pointer-events-none opacity-60" />
      <div className="absolute top-[40%] left-[-100px] w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[130px] pointer-events-none opacity-40" />
      <div className="absolute bottom-0 right-[-100px] w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[150px] pointer-events-none opacity-30" />

      {/* HEADER / NAVIGATION */}
      <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-400/20">
              <TrendingUp className="text-slate-950 h-5.5 w-5.5" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight uppercase block leading-none">
                Cardápio <span className="text-emerald-400">Blindado</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mt-0.5">SaaS de Inteligência Financeira</span>
            </div>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <button onClick={handleScrollToDemo} className="hover:text-white transition-colors cursor-pointer">Demonstração</button>
            <a href="#beneficios" className="hover:text-white transition-colors cursor-pointer">Benefícios</a>
            <a href="#metodologia" className="hover:text-white transition-colors cursor-pointer">Metodologia CFI</a>
            <a href="#xande" className="hover:text-white transition-colors cursor-pointer">Consultor Xande</a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => openAuth('login')}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2 cursor-pointer"
            >
              Entrar
            </button>
            <button 
              onClick={() => openAuth('register')}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md hover:shadow-emerald-500/10 hover:scale-[1.02] cursor-pointer"
            >
              Começar Grátis
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-b border-white/10 px-6 py-6 space-y-4 animate-fade-in absolute top-20 left-0 w-full z-30 backdrop-blur-xl">
            <button 
              onClick={() => { setMobileMenuOpen(false); handleScrollToDemo(); }}
              className="block w-full text-left py-2 text-slate-300 hover:text-white text-base font-semibold"
            >
              Demonstração
            </button>
            <a 
              href="#beneficios" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 hover:text-white text-base font-semibold"
            >
              Benefícios
            </a>
            <a 
              href="#metodologia" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 hover:text-white text-base font-semibold"
            >
              Metodologia CFI
            </a>
            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              <button 
                onClick={() => openAuth('login')}
                className="w-full py-3 border border-slate-850 hover:bg-slate-900 rounded-xl text-center text-sm font-bold text-slate-300"
              >
                Entrar no Sistema
              </button>
              <button 
                onClick={() => openAuth('register')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl text-center shadow-lg"
              >
                COMEÇAR TESTE GRATUITO
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION - REFORMULATED FOR HIGH CONVERSION */}
      <section className="relative pt-12 pb-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Hero Left: Copy & Value Proposition */}
          <div className="lg:col-span-7 space-y-8 text-left animate-fade-in-up">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>SaaS Pro • Versão 3.0</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Descubra onde seu restaurante perde dinheiro e{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                aumente seu lucro todos os meses.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-base md:text-lg lg:text-lg leading-relaxed max-w-2xl font-medium">
              O Cardápio Blindado reúne CMV, precificação, estoque, metas, indicadores financeiros e Inteligência Artificial em uma única plataforma feita para donos de restaurantes.
            </p>

            {/* Confidence Lines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-slate-300 text-xs sm:text-sm font-semibold max-w-xl">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px]">
                  ✓
                </div>
                <span>Teste grátis por 14 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px]">
                  ✓
                </div>
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px]">
                  ✓
                </div>
                <span>Configuração em minutos</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={() => openAuth('register')}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all duration-200 shadow-xl shadow-emerald-500/15 hover:shadow-emerald-500/35 hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>COMEÇAR TESTE GRATUITO</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              
              <button 
                onClick={handleScrollToDemo}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>VER DEMONSTRAÇÃO</span>
              </button>
            </div>

            {/* Social Proof Bar */}
            <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row sm:items-center gap-4 text-slate-400">
              <div className="flex -space-x-2">
                {/* Visual Avatars Mock */}
                {[
                  { bg: 'bg-emerald-600', char: 'J' },
                  { bg: 'bg-slate-700', char: 'M' },
                  { bg: 'bg-amber-600', char: 'R' },
                  { bg: 'bg-blue-600', char: 'A' }
                ].map((av, idx) => (
                  <div key={idx} className={`h-8 w-8 rounded-full ${av.bg} ring-2 ring-slate-950 flex items-center justify-center text-[10px] font-black text-white`}>
                    {av.char}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-emerald-400 text-emerald-400" />
                  ))}
                  <span className="text-xs font-bold text-white ml-1">4.9/5</span>
                </div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">
                  Desenvolvido por quem vive a realidade dos restaurantes.
                </p>
              </div>
            </div>

          </div>

          {/* Hero Right: High-Fidelity Mock Dashboard & Floating Badges */}
          <div className="lg:col-span-5 relative animate-fade-in delay-200 mt-10 lg:mt-0">
            
            {/* Ambient Backlight Glow Behind App Frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/5 rounded-3xl blur-3xl pointer-events-none opacity-80" />

            {/* App Mock Frame (Browser Glassmorphism) */}
            <div className="relative bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-float-slow-1 select-none">
              
              {/* Mock Window Header */}
              <div className="h-10 bg-slate-950/80 border-b border-white/5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/30 border border-red-500/50 block" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/30 border border-amber-500/50 block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/30 border border-emerald-500/50 block" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">app.cardapioblindado.com.br</div>
                <div className="w-8 h-2 rounded bg-white/5" />
              </div>

              {/* Mock Body Container */}
              <div className="p-5 space-y-4">
                
                {/* Mock Header inside App */}
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-tight">JK BURGUER • PAINEL GERAL</h3>
                    <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">Metodologia CFI Integrada</p>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">
                    PRO ATIVO
                  </div>
                </div>

                {/* Mock Metrics Row */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-950/60 border border-white/5 p-2.5 rounded-xl text-left">
                    <span className="text-[8px] font-black uppercase text-slate-500 block tracking-wider">Faturamento</span>
                    <span className="text-xs font-extrabold text-white block mt-0.5">R$ 48.920</span>
                    <span className="text-[7px] text-emerald-400 block font-medium">+12.4% vs mês ant.</span>
                  </div>
                  <div className="bg-slate-950/60 border border-white/5 p-2.5 rounded-xl text-left border-l-emerald-500/40">
                    <span className="text-[8px] font-black uppercase text-slate-500 block tracking-wider">Lucro Líquido</span>
                    <span className="text-xs font-extrabold text-emerald-400 block mt-0.5">R$ 13.250</span>
                    <span className="text-[7px] text-emerald-400/80 block font-medium">27,1% Margem</span>
                  </div>
                  <div className="bg-slate-950/60 border border-white/5 p-2.5 rounded-xl text-left">
                    <span className="text-[8px] font-black uppercase text-slate-500 block tracking-wider">CMV Médio</span>
                    <span className="text-xs font-extrabold text-white block mt-0.5">29,8%</span>
                    <span className="text-[7px] text-emerald-400 block font-medium">Faixa Saudável ✓</span>
                  </div>
                </div>

                {/* Simulated Chart (SVG curved graph) */}
                <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[8px] font-black uppercase text-slate-400">Curva de Lucratividade</span>
                    <span className="text-[7px] font-bold text-slate-500">Últimos 12 dias</span>
                  </div>
                  <div className="h-16 flex items-end justify-between relative pt-4">
                    {/* SVG Line path for graph */}
                    <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <path d="M 0 25 Q 15 18 30 20 T 60 12 T 90 4 T 100 2" fill="none" stroke="#10b981" strokeWidth="1.5" />
                      <path d="M 0 25 Q 15 18 30 20 T 60 12 T 90 4 T 100 2 L 100 30 L 0 30 Z" fill="url(#grad)" opacity="0.1" />
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Mini columns/gridlines */}
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-full w-[1px] bg-white/5 relative z-0" />
                    ))}
                  </div>
                </div>

                {/* Xande IA Chat Bubble Representation */}
                <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl flex gap-2.5 text-left relative z-10">
                  <div className="h-8 w-8 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <span className="text-base">👨‍🍳</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-white uppercase tracking-tight">Xande • Consultor IA</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 block animate-pulse" />
                    </div>
                    <p className="text-[9px] text-slate-300 leading-relaxed font-medium">
                      "Seu CMV está excelente em <strong className="text-emerald-400">29,8%</strong>. Suas margens e lucros estão blindados hoje! Que tal calcular o ponto de equilíbrio?"
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* FIVE ABSOLUTELY POSITIONED FLOATING BADGES - REQUIRED */}
            
            {/* 1. Lucro +27% */}
            <div className="absolute -top-6 -left-8 bg-slate-900/90 border border-emerald-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md animate-float-slow-2 select-none pointer-events-none">
              <div className="h-5 w-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">
                <DollarSign size={10} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span className="text-[8px] block uppercase font-bold text-slate-500 tracking-wider">Margem</span>
                <span className="text-[11px] font-black text-emerald-400 block leading-none">Lucro +27%</span>
              </div>
            </div>

            {/* 2. CMV 29,8% */}
            <div className="absolute top-4 -right-6 bg-slate-900/90 border border-emerald-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md animate-float-slow-3 select-none pointer-events-none">
              <div className="h-5 w-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">
                <Percent size={10} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span className="text-[8px] block uppercase font-bold text-slate-500 tracking-wider">Indicador</span>
                <span className="text-[11px] font-black text-emerald-400 block leading-none">CMV 29,8%</span>
              </div>
            </div>

            {/* 3. Ticket Médio +R$ 5,40 */}
            <div className="absolute top-1/2 -left-10 bg-slate-900/90 border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md animate-float-slow-3 select-none pointer-events-none">
              <div className="h-5 w-5 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400 text-xs">
                <Activity size={10} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span className="text-[8px] block uppercase font-bold text-slate-500 tracking-wider">Crescimento</span>
                <span className="text-[11px] font-black text-white block leading-none">Ticket +R$ 5,40</span>
              </div>
            </div>

            {/* 4. Xande IA Online */}
            <div className="absolute top-[65%] -right-8 bg-slate-900/90 border border-emerald-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md animate-float-slow-1 select-none pointer-events-none">
              <div className="h-2 w-2 rounded-full bg-emerald-400 block animate-pulse shrink-0" />
              <div className="text-left">
                <span className="text-[11px] font-black text-white block leading-none">Xande IA Online</span>
                <span className="text-[8px] block uppercase font-bold text-slate-500 tracking-wider mt-0.5">Consultoria de bolso</span>
              </div>
            </div>

            {/* 5. 14 dias grátis */}
            <div className="absolute -bottom-6 right-6 bg-slate-900/95 border border-amber-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md animate-float-slow-2 select-none pointer-events-none">
              <div className="h-5 w-5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-xs">
                <Award size={10} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span className="text-[8px] block uppercase font-bold text-slate-500 tracking-wider">Período</span>
                <span className="text-[11px] font-black text-amber-400 block leading-none">14 dias grátis</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* DETAILED MOCK-INTERACTIVE DEMO SECTION (id="demonstracao") */}
      <section id="demonstracao" className="py-20 md:py-28 border-t border-white/5 bg-slate-900/20 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Demo Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
              Uma espiada por dentro do Cardápio Blindado
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium">
              Explore o ecossistema e entenda por que donos de restaurantes que usam nossa plataforma conseguem recuperar milhares de reais em lucro oculto.
            </p>
          </div>

          {/* Interactive Demo Tabs */}
          <div className="flex justify-center border-b border-white/5 max-w-lg mx-auto">
            <div className="grid grid-cols-3 gap-1 w-full bg-slate-950 p-1.5 rounded-2xl border border-white/5">
              {[
                { id: 'dashboard' as const, label: 'Painel Geral', icon: Activity },
                { id: 'fichas' as const, label: 'Ficha Técnica', icon: ShieldCheck },
                { id: 'xande' as const, label: 'Xande IA Chat', icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeDemoTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDemoTab(tab.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      active 
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/15' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render Active Demo Tab Area */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 min-h-[380px] shadow-2xl backdrop-blur-md text-left transition-all duration-300 relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
            
            {activeDemoTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Módulo Principal</span>
                    <h3 className="text-xl font-bold text-white uppercase">Painel de Indicadores Gerais</h3>
                  </div>
                  <div className="text-xs text-slate-400">Restaurante Simulado: <strong className="text-white font-mono">JK BURGUER</strong></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Lucratividade Líquida', val: 'R$ 13.250,00', margin: '27,1%', state: 'excelente', desc: 'Sua operação está super saudável e pagando as contas em dia.' },
                    { label: 'Custos Fixos Integrados (CFI)', val: 'R$ 15.600,00', margin: '31,9%', state: 'alerta', desc: 'As despesas fixas representam 31.9% do faturamento. Ideal é manter abaixo de 30%.' },
                    { label: 'Custo da Mercadoria (CMV)', val: 'R$ 14.580,00', margin: '29,8%', state: 'excelente', desc: 'Custo de insumos e embalagens de acordo com as metas planejadas.' }
                  ].map((card, index) => (
                    <div key={index} className="bg-slate-950/60 border border-white/5 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-bold">{card.label}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          card.state === 'excelente' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>{card.margin} {card.state === 'excelente' ? '✓' : '⚠️'}</span>
                      </div>
                      <h4 className="text-2xl font-black text-white">{card.val}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex items-center justify-between">
                  <p className="text-xs text-emerald-400/90 font-medium">💡 <strong>Dica do Xande:</strong> Bater seu ponto de equilíbrio (R$ 28.500) nos primeiros 10 dias do mês blinda sua lucratividade contra flutuações sazonais.</p>
                  <button onClick={() => openAuth('register')} className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-4">
                    Experimentar Agora <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {activeDemoTab === 'fichas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Ficha Técnica e Engenharia</span>
                    <h3 className="text-xl font-bold text-white uppercase">Custo Real do Prato: Burger Premium</h3>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-lg text-emerald-400 text-xs font-bold">
                    CMV Unitário: 28,4% (Ideal)
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] uppercase text-slate-500 font-bold pb-2">
                        <th className="text-left pb-2">Ingrediente</th>
                        <th className="text-left pb-2">Peso/Qtd</th>
                        <th className="text-left pb-2">Custo Bruto</th>
                        <th className="text-left pb-2">Fator de Perda</th>
                        <th className="text-right pb-2">Custo Líquido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { nome: 'Pão Brioche Selado', qtd: '1 un', bruto: 'R$ 1,80', fator: '1.00', liq: 'R$ 1,80' },
                        { nome: 'Blend de Carne Black Angus', qtd: '180g', bruto: 'R$ 4,50', fator: '1.25 (grelhado)', liq: 'R$ 5,62' },
                        { nome: 'Queijo Cheddar Fatiado', qtd: '2 fatias', bruto: 'R$ 1,20', fator: '1.00', liq: 'R$ 1,20' },
                        { nome: 'Molho Especial da Casa', qtd: '25g', bruto: 'R$ 0,45', fator: '1.05', liq: 'R$ 0,47' },
                        { nome: 'Embalagem Box Premium', qtd: '1 un', bruto: 'R$ 0,85', fator: '1.00', liq: 'R$ 0,85' }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 font-bold text-white">{row.nome}</td>
                          <td className="py-2.5">{row.qtd}</td>
                          <td className="py-2.5">{row.bruto}</td>
                          <td className="py-2.5">{row.fator}</td>
                          <td className="py-2.5 text-right font-bold text-emerald-400">{row.liq}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-white/5 gap-4">
                  <div className="text-xs text-slate-400">
                    Preço de Venda Sugerido (Física): <strong className="text-white">R$ 34,90</strong> • Preço de Venda Sugerido (iFood): <strong className="text-white">R$ 44,95</strong>
                  </div>
                  <button onClick={() => openAuth('register')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer">
                    Precificar Meus Pratos
                  </button>
                </div>
              </div>
            )}

            {activeDemoTab === 'xande' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Inteligência Artificial</span>
                    <h3 className="text-xl font-bold text-white uppercase">Xande • Seu Consultor Financeiro Particular</h3>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Inteligência Ativa
                  </span>
                </div>

                <div className="space-y-4 max-w-2xl mx-auto text-xs sm:text-sm">
                  {/* Message 1 (User) */}
                  <div className="flex items-start gap-3 justify-end text-right">
                    <div className="bg-slate-800 p-3 rounded-2xl rounded-tr-none max-w-md">
                      <p className="text-slate-300 font-medium">Meu CMV está batendo 39,2% no iFood. Isso está perigoso?</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <span className="font-bold text-[10px]">Dono</span>
                    </div>
                  </div>

                  {/* Message 2 (Xande) */}
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg">
                      <span className="text-lg">👨‍🍳</span>
                    </div>
                    <div className="bg-slate-950/80 border border-emerald-500/25 p-4 rounded-2xl rounded-tl-none max-w-md space-y-2">
                      <p className="text-white font-bold">Oi! Com certeza, esse CMV está perigoso sim!</p>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        Qualquer CMV acima de <strong>38%</strong> compromete gravemente seu lucro operacional. No iFood (onde as taxas mordem cerca de 26,2% a 28,2%), seu CMV alvo ideal não deve passar de <strong>30%</strong>.
                      </p>
                      <div className="pt-1.5 space-y-1">
                        <p className="text-[11px] uppercase font-black text-emerald-400">Recomendação do Xande:</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px]">
                          <li>Seu campeão de vendas está magro? Monte uma <strong>Oferta Salva Margem</strong> combinando com batatas ou refrigerantes.</li>
                          <li>Não use regra de três simples! Use nosso <strong>Markup Inverso</strong> no simulador de canais.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button onClick={() => openAuth('register')} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                    Começar a Consultar com o Xande Gratis
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ADDITIONAL BENEFITS SECTION */}
      <section id="beneficios" className="py-20 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left scroll-mt-20">
        {[
          {
            title: 'Controle de CMV Real',
            desc: 'Cadastre seus insumos com fator de correção (perda) e monte fichas técnicas automatizadas que reagem em tempo real aos preços dos fornecedores.',
            color: 'border-l-emerald-500'
          },
          {
            title: 'Fórmula do Markup Inverso',
            desc: 'Chega de chutar preços ou perder dinheiro em marketplaces. Nosso algoritmo calcula o preço exato considerando todas as taxas ocultas de repasse e fretes do iFood.',
            color: 'border-l-emerald-400'
          },
          {
            title: 'CFI da Empresa',
            desc: 'Entenda os custos fixos indiretos (CFI) que passam despercebidos. Descubra qual é seu ponto de equilíbrio mensal exato para cobrir despesas e lucrar.',
            color: 'border-l-teal-500'
          }
        ].map((benefit, idx) => (
          <div key={idx} className={`p-6 rounded-2xl bg-slate-900/40 border border-white/5 border-l-4 ${benefit.color} backdrop-blur-sm space-y-3`}>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">{benefit.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
          </div>
        ))}
      </section>

      {/* METODOLOGIA CFI SECTION */}
      <section id="metodologia" className="py-20 border-t border-white/5 bg-slate-950 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">A Chave do Lucro</span>
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
              Metodologia CFI: Custos Fixos Integrados
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
              A maioria das planilhas e aplicativos de food service erra ao ignorar o impacto dos Custos Fixos em cada venda. Com a nossa metodologia de Custos Fixos Integrados (CFI), o sistema dilui suas despesas de aluguel, luz e pessoal automaticamente na precificação.
            </p>
            <div className="space-y-3 pt-2 text-xs md:text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Integração de aluguel, folha, marketing e operacionais.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Bata o Ponto de Equilíbrio nos primeiros 10 dias do mês.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Margem de contribuição blindada por canal de venda.</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 text-left backdrop-blur-sm">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">A Fórmula Científica do Lucro</h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-emerald-400 overflow-x-auto select-all">
              Preço de Venda = Custo Direto / (1 - %CMV - %CFI - %Lucro - %Taxas - %Antecipação)
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * Diferente de outros métodos, o Markup Inverso garante que você nunca vai pagar para trabalhar. Ele considera todas as comissões nominais das plataformas e as taxas de repasse semanal antecipado.
            </p>
          </div>
        </div>
      </section>

      {/* CTA BOTTOM HERO */}
      <section className="py-20 max-w-5xl mx-auto px-6 text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight max-w-2xl mx-auto leading-tight">
          Pronto para blindar seu restaurante contra o prejuízo?
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto font-medium">
          Comece hoje mesmo. Leva menos de 5 minutos para configurar e os primeiros 14 dias são totalmente por nossa conta.
        </p>
        <button 
          onClick={() => openAuth('register')}
          className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.03] cursor-pointer"
        >
          INICIAR MEU TESTE DE 14 DIAS GRÁTIS
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-wide uppercase">Cardápio <span className="text-emerald-400">Blindado</span></span>
            <span>• SaaS de Food Service © 2026</span>
          </div>
          <div className="flex gap-6 font-medium">
            <a href="#beneficios" className="hover:text-white transition">Benefícios</a>
            <a href="#metodologia" className="hover:text-white transition">Metodologia</a>
            <button onClick={() => openAuth('login')} className="hover:text-white transition cursor-pointer">Login</button>
          </div>
        </div>
      </footer>

      {/* SLIDEOUT / LIGHTBOX AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in-up">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition p-1 rounded-full hover:bg-white/5"
            >
              <X size={20} />
            </button>

            {/* Brand Header inside Modal */}
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4 animate-pulse">
                <TrendingUp className="text-emerald-400 h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                Cardápio <span className="text-emerald-400">Blindado</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                {mode === 'login' && "Faça login para gerenciar a precificação e lucros"}
                {mode === 'register' && "Crie sua conta de consultor de bolso hoje"}
                {mode === 'forgot' && "Digite seu e-mail para recuperar o acesso"}
              </p>
            </div>

            {/* Global Notifications */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-950/40 border border-red-800/40 text-red-300 rounded-2xl text-xs font-semibold leading-relaxed animate-shake flex gap-2 text-left">
                <div className="h-5 w-5 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 shrink-0">!</div>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-800/30 text-emerald-300 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in flex gap-2 text-left">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {/* Auth form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    Nome da Loja / Restaurante
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      placeholder="Minha Hamburgueria"
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
                        className="text-[10px] text-emerald-400 hover:underline font-bold"
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
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase text-xs py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 mt-2 shadow-lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>
                    {mode === 'login' && "Entrar no Sistema"}
                    {mode === 'register' && "Criar Conta Pro"}
                    {mode === 'forgot' && "Recuperar Minha Senha"}
                  </span>
                )}
              </button>
            </form>

            {/* Toggle mode links */}
            <div className="text-center mt-6 pt-5 border-t border-white/5 text-xs font-semibold text-slate-400 leading-none">
              {mode === 'login' && (
                <p>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); setMessage(null); }}
                    className="text-emerald-400 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Cadastre-se grátis
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
