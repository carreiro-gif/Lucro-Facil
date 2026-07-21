import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  Database, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Store, 
  FileJson, 
  Loader2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface UserBackupData {
  profile: any;
  stores: {
    storeId: string;
    data: any;
  }[];
}

interface BackupPayload {
  backupDate: string;
  system: string;
  exportedBy: string;
  totalUsers: number;
  totalStores: number;
  data: UserBackupData[];
}

const BackupSystem: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [stats, setStats] = useState<{ usersCount: number; storesCount: number } | null>(null);

  // Guard clause for non-admin users
  const isAdmin = profile?.role === 'admin' || profile?.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="p-4 bg-red-500/10 text-brand-red rounded-full mb-4 border border-brand-red/20">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Acesso Restrito</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Esta página é restrita apenas aos administradores do Cardápio Blindado. Seu usuário não possui privilégios suficientes.
        </p>
      </div>
    );
  }

  const handleGenerateBackup = async () => {
    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    try {
      // 1. Fetch all users
      const usersCollectionRef = collection(db, 'users');
      const usersSnap = await getDocs(usersCollectionRef);
      
      const backupDataList: UserBackupData[] = [];
      let totalStoresFetched = 0;

      // 2. Iterate through each user profile
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Fetch subcollection 'stores' for each user
        const storesCollectionRef = collection(db, 'users', userId, 'stores');
        const storesSnap = await getDocs(storesCollectionRef);
        
        const userStores: { storeId: string; data: any }[] = [];
        storesSnap.forEach((storeDoc) => {
          userStores.push({
            storeId: storeDoc.id,
            data: storeDoc.data()
          });
          totalStoresFetched++;
        });

        backupDataList.push({
          profile: { id: userId, ...userData },
          stores: userStores
        });
      }

      // 3. Create JSON payload
      const backupPayload: BackupPayload = {
        backupDate: new Date().toISOString(),
        system: 'Cardápio Blindado',
        exportedBy: profile?.email || 'Admin',
        totalUsers: backupDataList.length,
        totalStores: totalStoresFetched,
        data: backupDataList
      };

      // 4. Update stats state
      setStats({
        usersCount: backupDataList.length,
        storesCount: totalStoresFetched
      });

      // 5. Trigger browser download
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupPayload, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadAnchor.setAttribute('download', `backup_cardapio_blindado_${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatus({
        type: 'success',
        message: 'Backup gerado com sucesso! O download foi iniciado automaticamente no seu navegador.'
      });
    } catch (error: any) {
      console.error('Erro ao gerar backup:', error);
      setStatus({
        type: 'error',
        message: `Falha ao ler os dados do Firestore: ${error?.message || 'Erro desconhecido'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 relative z-10 font-sans max-w-4xl mx-auto px-4">
      {/* HEADER CARD - GLASS DESIGN */}
      <div className="glass-card border border-gray-200 dark:border-white/10 p-10 rounded-3xl relative overflow-hidden shadow-xl bg-slate-900/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-yellow/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none opacity-40"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex p-3 bg-brand-yellow/10 text-brand-yellow rounded-2xl border border-brand-yellow/20 mb-2">
            <Database size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
            Backup Manual do Sistema
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium leading-relaxed max-w-2xl mx-auto">
            Gere uma cópia completa de todos os perfis de usuários e lojas diretamente do banco de dados oficial (Firestore) em formato JSON seguro.
          </p>
        </div>
      </div>

      {/* CORE CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ACTION PANEL */}
        <div className="md:col-span-2 glass-card border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-slate-900/20 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-500" />
              Painel de Exportação
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Ao iniciar a exportação, o sistema fará uma varredura completa na coleção <code className="text-brand-yellow font-mono text-xs px-1 bg-black/20 rounded">users</code> e em todas as subcoleções <code className="text-brand-yellow font-mono text-xs px-1 bg-black/20 rounded">stores</code> vinculadas. Nenhum dado será alterado ou excluído.
            </p>
          </div>

          <div className="space-y-4">
            {status.type === 'success' && (
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm">
                <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                <span>{status.message}</span>
              </div>
            )}

            {status.type === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-brand-red text-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span>{status.message}</span>
              </div>
            )}

            <button
              onClick={handleGenerateBackup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-yellow text-slate-900 font-extrabold uppercase tracking-wider rounded-xl hover:bg-brand-yellow/90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Processando e lendo Banco...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Exportar e Baixar Banco (.JSON)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* METRICS & SECURITY RULES */}
        <div className="glass-card border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-slate-900/20 backdrop-blur-sm space-y-6">
          <div className="space-y-2 border-b border-gray-200 dark:border-white/10 pb-4">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Metadados Última Leitura</h4>
            {stats ? (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-black/25 p-3 rounded-lg border border-white/5">
                  <span className="text-[10px] uppercase text-gray-500 block font-bold">Usuários</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Users size={14} className="text-brand-yellow" />
                    <span className="text-xl font-black text-white">{stats.usersCount}</span>
                  </div>
                </div>
                <div className="bg-black/25 p-3 rounded-lg border border-white/5">
                  <span className="text-[10px] uppercase text-gray-500 block font-bold">Lojas / Perfis</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Store size={14} className="text-brand-yellow" />
                    <span className="text-xl font-black text-white">{stats.storesCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                Nenhum backup gerado nesta sessão ainda.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Diretrizes de Segurança</h4>
            <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow shrink-0 mt-1.5" />
                <span>O arquivo contém dados sensíveis. Guarde em local seguro.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow shrink-0 mt-1.5" />
                <span>Usa o Firestore nativo <code className="text-brand-yellow">lucro-facil-28aaf</code> sem ID de banco customizado.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow shrink-0 mt-1.5" />
                <span>Compatível com as ferramentas locais de restore do app.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupSystem;
