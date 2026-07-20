import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        setMessage("Conta criada com sucesso!");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans select-none">
      {/* Abstract Glowing Aura */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in transition-all">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 bg-brand-red/15 rounded-2xl flex items-center justify-center border border-brand-red/30 mb-4 animate-pulse">
            <TrendingUp className="text-brand-red h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Cardápio Blindado <span className="text-brand-red">Pro</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            {mode === 'login' && "Faça login para gerenciar a precificação e lucros"}
            {mode === 'register' && "Crie sua conta de consultor de bolso hoje"}
            {mode === 'forgot' && "Digite seu e-mail para recuperar o acesso"}
          </p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-950/40 border border-red-800/40 text-red-300 rounded-2xl text-xs font-semibold leading-relaxed animate-shake flex gap-2">
            <div className="h-5 w-5 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 shrink-0">!</div>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-800/30 text-emerald-300 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in flex gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                Nome da Loja
              </label>
              <div className="relative">
                <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="Minha Hamburgueria"
                  className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-750 focus:border-brand-red text-white pl-10 pr-4 py-3 rounded-xl text-xs transition duration-250 outline-none"
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
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-750 focus:border-brand-red text-white pl-10 pr-4 py-3 rounded-xl text-xs transition duration-250 outline-none"
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
                    className="text-[10px] text-brand-red hover:underline font-bold"
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
                  className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-750 focus:border-brand-red text-white pl-10 pr-10 py-3 rounded-xl text-xs transition duration-250 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition"
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
                  className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-750 focus:border-brand-red text-white pl-10 pr-10 py-3 rounded-xl text-xs transition duration-250 outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-[#B30321] disabled:bg-slate-800 disabled:text-slate-500 text-white font-black uppercase text-xs py-3.5 rounded-xl transition duration-250 flex items-center justify-center gap-2 mt-2 shadow-lg hover:shadow-brand-red/10"
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
        <div className="text-center mt-6 pt-5 border-t border-slate-800 text-xs font-semibold text-slate-400 leading-none">
          {mode === 'login' && (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); setMessage(null); }}
                className="text-brand-red hover:underline font-bold ml-1"
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
                className="text-brand-red hover:underline font-bold ml-1"
              >
                Fazer Login
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setMessage(null); }}
              className="text-brand-red hover:underline font-bold"
            >
              Voltar para o Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
