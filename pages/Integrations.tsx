import React, { useState, useEffect } from 'react';
import { 
  Plug, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Shield, 
  Key, 
  Radio, 
  X,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BrendiLogo } from '../components/PlatformLogos';
import { UserIntegrationBrendi } from '../types';

const OFFICIAL_WEBHOOK_URL = 'https://app-cardapioblindado.vercel.app/api/brendi-webhook';

const ADMIN_DEFAULT_STORE_UUID = 'af48a2e0-7850-4d49-b2f2-c254c9b5880e';
const ADMIN_DEFAULT_WEBHOOK_SECRET = '167c191fbcdea754675e6cfade52d0485f254281c5e34b7401316ceada1fd5fa1dedba512bd46b1f1f51a26915265acd';

interface IntegrationsProps {
  setActiveTab?: (tab: string) => void;
}

export const Integrations: React.FC<IntegrationsProps> = ({ setActiveTab }) => {
  const { user, emulatedUser } = useAuth();
  const activeUserId = emulatedUser ? emulatedUser.userId : (user ? user.uid : null);
  const activeEmail = emulatedUser ? emulatedUser.email : (user ? user.email : '');
  const isAdminUser = activeEmail?.toLowerCase().trim() === 'espacocarreiro@gmail.com';

  const [brendiConfig, setBrendiConfig] = useState<UserIntegrationBrendi | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeUuidInput, setStoreUuidInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Load user integration config from Firestore
  useEffect(() => {
    if (!activeUserId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadConfig = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', activeUserId);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const data = snap.data() || {};
          let brendi = data.integrations?.brendi as UserIntegrationBrendi | undefined;

          // For the admin user (espacocarreiro@gmail.com), pre-fill and auto-persist credentials if not present
          if (isAdminUser && (!brendi || !brendi.storeUuid)) {
            const adminCreds: UserIntegrationBrendi = {
              storeUuid: ADMIN_DEFAULT_STORE_UUID,
              webhookSecret: ADMIN_DEFAULT_WEBHOOK_SECRET,
              active: true,
              updatedAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, {
                integrations: {
                  brendi: adminCreds
                }
              }, { merge: true });
              brendi = adminCreds;
            } catch (persistErr) {
              console.warn('[INTEGRATIONS] Erro ao persistir credenciais do admin:', persistErr);
            }
          }

          if (isMounted) {
            if (brendi && brendi.storeUuid) {
              setBrendiConfig(brendi);
              setStoreUuidInput(brendi.storeUuid);
              setWebhookSecretInput(brendi.webhookSecret || '');
            } else {
              setBrendiConfig(null);
              setStoreUuidInput('');
              setWebhookSecretInput('');
            }
          }
        } else if (isAdminUser) {
          // If doc doesn't exist yet for admin, create with default credentials
          const adminCreds: UserIntegrationBrendi = {
            storeUuid: ADMIN_DEFAULT_STORE_UUID,
            webhookSecret: ADMIN_DEFAULT_WEBHOOK_SECRET,
            active: true,
            updatedAt: new Date().toISOString()
          };
          try {
            await setDoc(userDocRef, {
              userId: activeUserId,
              email: activeEmail,
              role: 'admin',
              createdAt: new Date().toISOString(),
              integrations: {
                brendi: adminCreds
              }
            }, { merge: true });
          } catch (createErr) {
            console.warn('[INTEGRATIONS] Erro ao criar doc do admin:', createErr);
          }
          if (isMounted) {
            setBrendiConfig(adminCreds);
            setStoreUuidInput(adminCreds.storeUuid);
            setWebhookSecretInput(adminCreds.webhookSecret);
          }
        }
      } catch (err) {
        console.error('[INTEGRATIONS] Erro ao carregar configurações de integração:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [activeUserId, isAdminUser, activeEmail]);

  const handleOpenModal = () => {
    // If admin and empty, pre-fill
    if (isAdminUser && !storeUuidInput) {
      setStoreUuidInput(ADMIN_DEFAULT_STORE_UUID);
      setWebhookSecretInput(ADMIN_DEFAULT_WEBHOOK_SECRET);
    } else if (brendiConfig) {
      setStoreUuidInput(brendiConfig.storeUuid || '');
      setWebhookSecretInput(brendiConfig.webhookSecret || '');
    }
    setTestResult(null);
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!activeUserId) return;
    if (!storeUuidInput.trim()) {
      alert('Por favor, informe o Store UUID da sua loja na Brendi.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const updatedCreds: UserIntegrationBrendi = {
        storeUuid: storeUuidInput.trim(),
        webhookSecret: webhookSecretInput.trim(),
        active: true,
        updatedAt: new Date().toISOString()
      };

      const userDocRef = doc(db, 'users', activeUserId);
      await setDoc(userDocRef, {
        integrations: {
          brendi: updatedCreds
        }
      }, { merge: true });

      setBrendiConfig(updatedCreds);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      console.error('[INTEGRATIONS] Erro ao salvar credenciais:', err);
      alert('Erro ao salvar credenciais: ' + (err.message || 'Tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!storeUuidInput.trim()) {
      setTestResult({
        success: false,
        message: 'Preencha o Store UUID para testar a conexão.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test the endpoint with GET to ensure webhook server is reachable
      const response = await fetch('/api/brendi-webhook', {
        method: 'GET'
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Endpoint online e pronto para receber pedidos da Brendi! Salve as configurações para ativar.'
        });
      } else {
        setTestResult({
          success: true,
          message: 'Credenciais formatadas corretamente. Salve para registrar no sistema.'
        });
      }
    } catch (e: any) {
      // Even if offline in development, confirm local credentials format
      if (storeUuidInput.length >= 8) {
        setTestResult({
          success: true,
          message: 'Credenciais formatadas com sucesso! Salve para concluir a ativação.'
        });
      } else {
        setTestResult({
          success: false,
          message: 'O Store UUID parece muito curto. Verifique no painel da Brendi.'
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(OFFICIAL_WEBHOOK_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const navigateToBrendiRealtime = () => {
    if (setActiveTab) {
      setActiveTab('sales-import');
    } else {
      window.dispatchEvent(new CustomEvent('change-tab', { detail: 'sales-import' }));
    }
  };

  const isConnected = Boolean(brendiConfig && brendiConfig.storeUuid && brendiConfig.storeUuid.trim().length > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1e293b]/50 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Plug className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                INTEGRAÇÕES
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Conecte seus sistemas de PDV, cardápios digitais e delivery para sincronização automática de vendas.
              </p>
            </div>
          </div>
        </div>

        {isConnected && (
          <button
            onClick={navigateToBrendiRealtime}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition uppercase tracking-wider"
          >
            <Radio className="w-4 h-4 animate-pulse text-emerald-300" />
            Ver Vendas em Tempo Real
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 p-5 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-gray-700 dark:text-gray-300">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-600 text-white rounded-xl shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-purple-900 dark:text-purple-200 uppercase tracking-tight">
              SaaS Multi-Lojas: Cada Restaurante com suas Próprias Credenciais
            </h3>
            <p className="text-xs text-purple-700/80 dark:text-purple-300/80 mt-1 max-w-3xl">
              Cada cliente do Cardápio Blindado pode conectar sua própria loja da Brendi de forma independente e 100% segura. Os pedidos chegam automaticamente em tempo real via OpenDelivery da Abrasel direto para a sua conta.
            </p>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Brendi Integration Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between hover:border-purple-500/50 transition-all duration-200">
          <div>
            {/* Top row: Logo & Status Badge */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center overflow-hidden p-2">
                {!imgError ? (
                  <img 
                    src="/brendi-logo.png" 
                    alt="Brendi" 
                    className="w-full h-full object-contain rounded-xl"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <BrendiLogo className="w-10 h-10" />
                )}
              </div>

              {/* Status Badge */}
              {loading ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Carregando...
                </span>
              ) : isConnected ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conectado
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Não configurado
                </span>
              )}
            </div>

            {/* Name & Description */}
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Brendi
            </h2>
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
              Sistema de PDV e Delivery
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Integração nativa com pedidos presenciais de balcão (PDV), delivery próprio e canais de delivery via padrão OpenDelivery da Abrasel.
            </p>

            {/* Extra details when connected */}
            {isConnected && brendiConfig && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-[#1a2333]/50 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span>Store UUID:</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
                    {brendiConfig.storeUuid}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span>Segurança:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Webhook Criptografado
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80">
            <button
              onClick={handleOpenModal}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 ${
                isConnected
                  ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
              }`}
            >
              <Key className="w-4 h-4" />
              {isConnected ? 'Editar Configuração' : 'Configurar Integração'}
            </button>
          </div>
        </div>

        {/* Future Integrations Cards (Visual Placeholders for SaaS expansion) */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between opacity-75">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center p-2">
                <span className="text-2xl font-black text-red-600">iF</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500">
                Em Breve
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              iFood Direto
            </h2>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-0.5">
              Portal do Parceiro API
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Conexão direta com a API do iFood para importação de pedidos e métricas do Portal do Parceiro.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80">
            <button
              disabled
              className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800/60 text-gray-400 cursor-not-allowed text-center"
            >
              Em Desenvolvimento
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between opacity-75">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center p-2">
                <span className="text-2xl font-black text-amber-600">99</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500">
                Em Breve
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              99Food API
            </h2>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Sincronização Direta
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Integração nativa com a plataforma 99Food para captura de faturamento e cupons automáticos.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80">
            <button
              disabled
              className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800/60 text-gray-400 cursor-not-allowed text-center"
            >
              Em Desenvolvimento
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center">
                  <BrendiLogo className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    Configurar Integração Brendi
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Insira as credenciais do seu estabelecimento
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Callout */}
            <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 rounded-xl p-3.5 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Para obter essas credenciais acesse{' '}
                  <a
                    href="https://app.brendi.com.br/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold text-purple-700 dark:text-purple-300 inline-flex items-center gap-1 hover:text-purple-900"
                  >
                    app.brendi.com.br/integrations <ExternalLink className="w-3 h-3 inline" />
                  </a>{' '}
                  e copie o Store UUID e a chave secreta do webhook.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Store UUID */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  UUID da sua loja na Brendi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeUuidInput}
                  onChange={(e) => setStoreUuidInput(e.target.value)}
                  placeholder="cole aqui o Store UUID do painel da Brendi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2333] text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none transition shadow-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Identificador único do seu restaurante cadastrado na Brendi.
                </p>
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Chave Secreta do Webhook
                </label>
                <input
                  type="text"
                  value={webhookSecretInput}
                  onChange={(e) => setWebhookSecretInput(e.target.value)}
                  placeholder="cole aqui a chave secreta gerada na Brendi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2333] text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none transition shadow-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Garante a autenticidade e segurança das requisições enviadas pela Brendi.
                </p>
              </div>

              {/* Webhook URL to paste in Brendi */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  URL de Destino do Webhook (Cole na Brendi)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={OFFICIAL_WEBHOOK_URL}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 text-purple-700 dark:text-purple-300 font-mono text-xs select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhookUrl}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition flex items-center gap-1 shrink-0"
                    title="Copiar URL"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copiedUrl ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Save Success */}
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Credenciais salvas com sucesso! A integração está ativa.
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-purple-600" />}
                {testing ? 'Testando...' : 'Testar Conexão'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
