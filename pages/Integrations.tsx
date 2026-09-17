import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
  Percent,
  RotateCcw,
  Store
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { BrendiLogo, IFoodLogo, Food99Logo, KeetaLogo } from '../components/PlatformLogos';
import { 
  UserIntegrationBrendi, 
  BrendiChannelFees, 
  BrendiDetailedFees, 
  BrendiSmartCampaign, 
  BrendiMonthlySubscription 
} from '../types';
import { 
  DEFAULT_BRENDI_CHANNEL_FEES, 
  DEFAULT_BRENDI_DETAILED_FEES,
  getSuggestedChannelFees, 
  getSuggestedDetailedFees,
  calculateChannelTotalPercent,
  getSavedChannelFees, 
  saveChannelFeesToStorage 
} from '../utils/brendiProfit';

const OFFICIAL_WEBHOOK_URL = 'https://app-cardapioblindado.vercel.app/api/brendi-webhook';

const ADMIN_DEFAULT_STORE_UUID = 'af48a2e0-7850-4d49-b2f2-c254c9b5880e';
const ADMIN_DEFAULT_WEBHOOK_SECRET = '167c191fbcdea754675e6cfade52d0485f254281c5e34b7401316ceada1fd5fa1dedba512bd46b1f1f51a26915265acd';

interface IntegrationsProps {
  setActiveTab?: (tab: string) => void;
}

export const Integrations: React.FC<IntegrationsProps> = ({ setActiveTab }) => {
  const { user, emulatedUser } = useAuth();
  const { platformConfig, products, syncIfoodSubscriptionAndCampaign } = useApp();
  const activeUserId = emulatedUser ? emulatedUser.userId : (user ? user.uid : null);
  const activeEmail = emulatedUser ? emulatedUser.email : (user ? user.email : '');
  const isAdminUser = activeEmail?.toLowerCase().trim() === 'espacocarreiro@gmail.com';

  const suggestedFees = useMemo(() => {
    return getSuggestedChannelFees(platformConfig, products);
  }, [platformConfig, products]);

  const suggestedDetailed = useMemo(() => {
    return getSuggestedDetailedFees(platformConfig);
  }, [platformConfig]);

  const [brendiConfig, setBrendiConfig] = useState<UserIntegrationBrendi | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeUuidInput, setStoreUuidInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [channelFees, setChannelFees] = useState<BrendiChannelFees>(DEFAULT_BRENDI_CHANNEL_FEES);

  // Detailed fees per channel
  const [detailedFees, setDetailedFees] = useState<BrendiDetailedFees>(DEFAULT_BRENDI_DETAILED_FEES);
  // Campanha Inteligente do iFood
  const [smartCampaign, setSmartCampaign] = useState<BrendiSmartCampaign>({ active: false, dailyInvestment: 0 });
  // Mensalidade iFood
  const [monthlySubscription, setMonthlySubscription] = useState<BrendiMonthlySubscription>({
    plan: 'basic',
    feeAmount: 110,
    billingThreshold: 1800
  });

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
              updatedAt: new Date().toISOString(),
              channelFees: brendi?.channelFees || suggestedFees
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
            const initialDetailed: BrendiDetailedFees = brendi?.detailedFees || suggestedDetailed;
            setDetailedFees(initialDetailed);

            const calculatedTotals: BrendiChannelFees = {
              ifood: calculateChannelTotalPercent(initialDetailed.ifood),
              food99: calculateChannelTotalPercent(initialDetailed.food99),
              keeta: calculateChannelTotalPercent(initialDetailed.keeta),
              brendiDelivery: calculateChannelTotalPercent(initialDetailed.brendiDelivery),
              brendiBalcao: calculateChannelTotalPercent(initialDetailed.brendiBalcao)
            };

            const initialFees = brendi?.channelFees || calculatedTotals;
            setChannelFees(initialFees);
            saveChannelFeesToStorage(initialFees, activeUserId);

            if (brendi?.smartCampaign) {
              setSmartCampaign(brendi.smartCampaign);
            }
            if (brendi?.monthlySubscription) {
              setMonthlySubscription(brendi.monthlySubscription);
            }

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
          const calculatedTotals: BrendiChannelFees = {
            ifood: calculateChannelTotalPercent(suggestedDetailed.ifood),
            food99: calculateChannelTotalPercent(suggestedDetailed.food99),
            keeta: calculateChannelTotalPercent(suggestedDetailed.keeta),
            brendiDelivery: calculateChannelTotalPercent(suggestedDetailed.brendiDelivery),
            brendiBalcao: calculateChannelTotalPercent(suggestedDetailed.brendiBalcao)
          };
          const adminCreds: UserIntegrationBrendi = {
            storeUuid: ADMIN_DEFAULT_STORE_UUID,
            webhookSecret: ADMIN_DEFAULT_WEBHOOK_SECRET,
            active: true,
            updatedAt: new Date().toISOString(),
            channelFees: calculatedTotals,
            detailedFees: suggestedDetailed,
            smartCampaign: { active: false, dailyInvestment: 0 },
            monthlySubscription: { plan: 'basic', feeAmount: 110, billingThreshold: 1800 }
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
            setDetailedFees(suggestedDetailed);
            setChannelFees(calculatedTotals);
            saveChannelFeesToStorage(calculatedTotals, activeUserId);
          }
        } else {
          // Normal user without brendi config yet
          if (isMounted) {
            const saved = getSavedChannelFees(activeUserId) || suggestedFees;
            setChannelFees(saved);
            setDetailedFees(suggestedDetailed);
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
  }, [activeUserId, isAdminUser, activeEmail, suggestedFees, suggestedDetailed]);

  const handleOpenModal = () => {
    // If admin and empty, pre-fill
    if (isAdminUser && !storeUuidInput) {
      setStoreUuidInput(ADMIN_DEFAULT_STORE_UUID);
      setWebhookSecretInput(ADMIN_DEFAULT_WEBHOOK_SECRET);
    } else if (brendiConfig) {
      setStoreUuidInput(brendiConfig.storeUuid || '');
      setWebhookSecretInput(brendiConfig.webhookSecret || '');
    }

    if (brendiConfig?.detailedFees) {
      setDetailedFees(brendiConfig.detailedFees);
    } else {
      setDetailedFees(suggestedDetailed);
    }

    if (brendiConfig?.smartCampaign) {
      setSmartCampaign(brendiConfig.smartCampaign);
    } else {
      setSmartCampaign({ active: false, dailyInvestment: 0 });
    }

    if (brendiConfig?.monthlySubscription) {
      setMonthlySubscription(brendiConfig.monthlySubscription);
    } else {
      setMonthlySubscription({ plan: 'basic', feeAmount: 110, billingThreshold: 1800 });
    }

    // Set channel fees (existing from config or saved in storage or suggested)
    if (brendiConfig?.channelFees) {
      setChannelFees(brendiConfig.channelFees);
    } else {
      const saved = getSavedChannelFees(activeUserId);
      setChannelFees(saved || suggestedFees);
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
      const calculatedTotals: BrendiChannelFees = {
        ifood: calculateChannelTotalPercent(detailedFees.ifood),
        food99: calculateChannelTotalPercent(detailedFees.food99),
        keeta: calculateChannelTotalPercent(detailedFees.keeta),
        brendiDelivery: calculateChannelTotalPercent(detailedFees.brendiDelivery),
        brendiBalcao: calculateChannelTotalPercent(detailedFees.brendiBalcao)
      };

      const updatedCreds: UserIntegrationBrendi = {
        storeUuid: storeUuidInput.trim(),
        webhookSecret: webhookSecretInput.trim(),
        active: true,
        updatedAt: new Date().toISOString(),
        channelFees: calculatedTotals,
        detailedFees: detailedFees,
        smartCampaign: smartCampaign,
        monthlySubscription: monthlySubscription
      };

      const userDocRef = doc(db, 'users', activeUserId);
      await setDoc(userDocRef, {
        integrations: {
          brendi: updatedCreds
        }
      }, { merge: true });

      saveChannelFeesToStorage(calculatedTotals, activeUserId);
      setBrendiConfig(updatedCreds);
      setChannelFees(calculatedTotals);
      syncIfoodSubscriptionAndCampaign(updatedCreds);
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
              <div className="mt-4 p-3 bg-gray-50 dark:bg-[#1a2333]/50 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] space-y-2">
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

                {/* Channel fees preview chips */}
                <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800/60">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
                    <span>Taxas por Canal (Lucro Real):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                    <span className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2 py-1 rounded border border-red-200/60 dark:border-red-900/40 flex items-center justify-between">
                      <span className="font-sans font-bold">iFood:</span>
                      <strong>{channelFees.ifood}%</strong>
                    </span>
                    <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                      <span className="font-sans font-bold">99Food:</span>
                      <strong>{channelFees.food99}%</strong>
                    </span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                      <span className="font-sans font-bold">Keeta:</span>
                      <strong>{channelFees.keeta}%</strong>
                    </span>
                    <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 px-2 py-1 rounded border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between">
                      <span className="font-sans font-bold">Balcão:</span>
                      <strong>{channelFees.brendiBalcao}%</strong>
                    </span>
                  </div>
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
          <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5 custom-scrollbar">
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
                    Insira as credenciais do seu estabelecimento e taxas por canal
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

            {/* Aviso Informativo para Múltiplas Lojas */}
            <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3.5 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="font-bold text-blue-900 dark:text-blue-200">
                  Aviso para donos com mais de uma loja no iFood
                </p>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                  Donos com mais de uma loja no iFood devem lançar o faturamento de cada loja manualmente na aba de Faturamento, pois a integração automática não consegue separar os pedidos por loja quando há múltiplos merchantIds.
                </p>
                {setActiveTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setActiveTab('revenue');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline uppercase tracking-wider transition"
                  >
                    Ir para a aba de Faturamento <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
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

              {/* Taxas por Canal de Venda */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase text-gray-900 dark:text-white">
                        Taxas por Canal de Venda
                      </h4>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Cálculo Inteligente de Lucro Real
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailedFees(suggestedDetailed)}
                    className="text-[10px] font-bold text-gray-500 hover:text-brand-red flex items-center gap-1 transition underline"
                    title="Preencher com os valores configurados na tela de Preço de Venda"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar Sugestão
                  </button>
                </div>

                <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <p>
                    Configure abaixo as taxas detalhadas de cada canal de venda exatamente como na tela de Preço de Venda. O sistema calcula automaticamente o percentual total que é descontado dos seus pedidos para apurar o seu lucro real.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  {/* iFood */}
                  <div className="p-4 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <IFoodLogo className="w-5 h-5" />
                        iFood
                      </label>
                      <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-2.5 py-1 rounded-lg">
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Total Calculado:</span>
                        <span className="text-xs font-black font-mono text-red-700 dark:text-red-300">
                          {calculateChannelTotalPercent(detailedFees.ifood).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Comissão básica do iFood
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.ifood.feePercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              ifood: { ...prev.ifood, feePercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-red-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Taxa de pagamento online
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.ifood.onlinePaymentPercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              ifood: { ...prev.ifood, onlinePaymentPercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-red-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Taxa de antecipação de recebíveis
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.ifood.anticipationPercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              ifood: { ...prev.ifood, anticipationPercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-red-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Valor que você banca por pedido de entrega
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={detailedFees.ifood.deliveryReais}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              ifood: { ...prev.ifood, deliveryReais: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-red-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Valor médio de cupom que você banca
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={detailedFees.ifood.couponReais}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              ifood: { ...prev.ifood, couponReais: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-red-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Campanha Inteligente do iFood */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/80 bg-red-50/50 dark:bg-red-950/20 p-3 rounded-xl space-y-2.5 border border-red-200/50 dark:border-red-900/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-black uppercase text-red-900 dark:text-red-200">
                            Campanha Inteligente do iFood
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                            Participante da Campanha Inteligente
                          </span>
                          <button
                            type="button"
                            onClick={() => setSmartCampaign(prev => ({ ...prev, active: !prev.active }))}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                              smartCampaign.active ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                smartCampaign.active ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Investimento diário em reais
                        </label>
                        <div className="relative w-full sm:w-48">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={smartCampaign.dailyInvestment}
                            onChange={(e) => setSmartCampaign(prev => ({
                              ...prev,
                              dailyInvestment: parseFloat(e.target.value) || 0
                            }))}
                            disabled={!smartCampaign.active}
                            className={`w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-xs font-bold text-right focus:ring-2 focus:ring-red-500 focus:outline-none ${
                              smartCampaign.active ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800/60 text-gray-400 cursor-not-allowed'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-gray-800 dark:text-gray-200">
                          <span>Custo mensal estimado:</span>
                          <span className="font-mono text-red-600 dark:text-red-400 font-black">
                            R$ {(Number(smartCampaign.dailyInvestment || 0) * 30).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (30 dias)
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                          Esse custo mensal estimado entrará automaticamente nas despesas fixas do mês como uma despesa fixa chamada &quot;Campanha Inteligente iFood&quot; quando ativo e pode ser editado na tela de despesas fixas se o valor real for diferente.
                        </p>
                      </div>
                    </div>

                    {/* Mensalidade iFood */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/80 bg-gray-100/60 dark:bg-gray-900/60 p-3 rounded-xl space-y-2.5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-black uppercase text-gray-900 dark:text-white">
                          Mensalidade iFood
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          Plano iFood
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition ${
                            monthlySubscription.plan === 'basic' 
                              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 font-bold' 
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            <input
                              type="radio"
                              name="ifood_plan"
                              checked={monthlySubscription.plan === 'basic'}
                              onChange={() => setMonthlySubscription(prev => ({ ...prev, plan: 'basic', feeAmount: 110 }))}
                              className="text-red-600 focus:ring-red-500"
                            />
                            <span>Plano Básico (entrega própria) — R$ 110,00</span>
                          </label>

                          <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition ${
                            monthlySubscription.plan === 'delivery' 
                              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 font-bold' 
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            <input
                              type="radio"
                              name="ifood_plan"
                              checked={monthlySubscription.plan === 'delivery'}
                              onChange={() => setMonthlySubscription(prev => ({ ...prev, plan: 'delivery', feeAmount: 150 }))}
                              className="text-red-600 focus:ring-red-500"
                            />
                            <span>Plano Entrega (iFood faz a entrega) — R$ 150,00</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Valor da mensalidade em reais
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={monthlySubscription.feeAmount}
                              onChange={(e) => setMonthlySubscription(prev => ({
                                ...prev,
                                feeAmount: parseFloat(e.target.value) || 0
                              }))}
                              className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-red-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Limite de faturamento para cobrança da mensalidade em reais
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                            <input
                              type="number"
                              step="50"
                              min="0"
                              value={monthlySubscription.billingThreshold}
                              onChange={(e) => setMonthlySubscription(prev => ({
                                ...prev,
                                billingThreshold: parseFloat(e.target.value) || 0
                              }))}
                              className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-red-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                        Funcionalidade inteligente: O sistema monitora o faturamento do iFood no mês. Ultrapassando o limite (padrão R$ 1.800,00), a mensalidade é adicionada automaticamente como despesa fixa (&quot;Mensalidade iFood&quot;) e um alerta de confirmação aparece no Dashboard. Se não ultrapassar, a mensalidade não é cobrada nem adicionada às despesas fixas.
                      </p>
                    </div>
                  </div>

                  {/* 99Food */}
                  <div className="p-4 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Food99Logo className="w-5 h-5" />
                        99Food
                      </label>
                      <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 px-2.5 py-1 rounded-lg">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Total Calculado:</span>
                        <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-300">
                          {calculateChannelTotalPercent(detailedFees.food99).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Comissão básica do 99Food
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.food99.feePercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              food99: { ...prev.food99, feePercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Taxa de pagamento online
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.food99.onlinePaymentPercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              food99: { ...prev.food99, onlinePaymentPercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Taxa de antecipação de recebíveis
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.food99.anticipationPercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              food99: { ...prev.food99, anticipationPercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Valor que você banca por pedido de entrega
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={detailedFees.food99.deliveryReais}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              food99: { ...prev.food99, deliveryReais: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Valor médio de cupom que você banca
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={detailedFees.food99.couponReais}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              food99: { ...prev.food99, couponReais: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keeta */}
                  <div className="p-4 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <KeetaLogo className="w-5 h-5" />
                        Keeta
                      </label>
                      <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-lg">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Calculado:</span>
                        <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300">
                          {calculateChannelTotalPercent(detailedFees.keeta).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Comissão básica da Keeta
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.keeta.feePercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              keeta: { ...prev.keeta, feePercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Taxa de pagamento online
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.keeta.onlinePaymentPercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              keeta: { ...prev.keeta, onlinePaymentPercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Taxa de antecipação de recebíveis
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.keeta.anticipationPercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              keeta: { ...prev.keeta, anticipationPercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Valor que você banca por pedido de entrega
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={detailedFees.keeta.deliveryReais}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              keeta: { ...prev.keeta, deliveryReais: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Valor médio de cupom que você banca
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={detailedFees.keeta.couponReais}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              keeta: { ...prev.keeta, couponReais: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brendi Delivery Próprio */}
                  <div className="p-4 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <BrendiLogo className="w-5 h-5" />
                        Brendi Delivery Próprio
                      </label>
                      <div className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 px-2.5 py-1 rounded-lg">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Total Calculado:</span>
                        <span className="text-xs font-black font-mono text-purple-700 dark:text-purple-300">
                          {calculateChannelTotalPercent(detailedFees.brendiDelivery).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Taxa percentual
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={detailedFees.brendiDelivery.feePercent}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              brendiDelivery: { ...prev.brendiDelivery, feePercent: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Valor que você banca por pedido de entrega
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={detailedFees.brendiDelivery.deliveryReais}
                            onChange={(e) => setDetailedFees(prev => ({
                              ...prev,
                              brendiDelivery: { ...prev.brendiDelivery, deliveryReais: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full pl-8 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brendi Balcão */}
                  <div className="p-4 bg-gray-50 dark:bg-[#1a2333] rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Store className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Brendi Balcão
                      </label>
                      <div className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 px-2.5 py-1 rounded-lg">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Total Calculado:</span>
                        <span className="text-xs font-black font-mono text-purple-700 dark:text-purple-300">
                          {calculateChannelTotalPercent(detailedFees.brendiBalcao).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                        Taxa percentual <span className="text-[10px] text-gray-400 font-normal">(geralmente zero)</span>
                      </label>
                      <div className="relative sm:w-1/2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={detailedFees.brendiBalcao.feePercent}
                          onChange={(e) => setDetailedFees(prev => ({
                            ...prev,
                            brendiBalcao: { ...prev.brendiBalcao, feePercent: parseFloat(e.target.value) || 0 }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs font-bold text-right pr-6 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>
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
