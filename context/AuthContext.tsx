import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

export interface UserProfile {
  userId: string;
  email: string;
  role: 'admin' | 'client';
  createdAt: string;
  defaultStoreName?: string;
  plan?: 'admin' | 'starter' | 'growth' | 'pro';
  status?: 'active' | 'trial' | 'expired' | 'cancelled';
  trialStart?: string;
  trialEnd?: string;
  planExpiry?: string;
  maxStores?: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  emulatedUser: { userId: string; email: string } | null;
  setEmulatedUser: (user: { userId: string; email: string } | null) => void;
  clients: UserProfile[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, storeName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshClients: () => Promise<void>;
  checkAccess: (currentStoreCount: number) => boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [emulatedUser, setEmulatedUserState] = useState<{ userId: string; email: string } | null>(null);
  const [clients, setClients] = useState<UserProfile[]>([]);

  // Persistent emulation loading from localStorage to survive page refreshes
  const setEmulatedUser = (emu: { userId: string; email: string } | null) => {
    setEmulatedUserState(emu);
    if (emu) {
      localStorage.setItem('lucro_facil_emulated_user_id', emu.userId);
      localStorage.setItem('lucro_facil_emulated_user_email', emu.email);
    } else {
      localStorage.removeItem('lucro_facil_emulated_user_id');
      localStorage.removeItem('lucro_facil_emulated_user_email');
    }
  };

  const refreshClients = async () => {
    if (!user) return;
    try {
      const q = collection(db, 'users');
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.userId) {
          list.push({
            userId: d.userId,
            email: d.email || '',
            role: d.role || 'client',
            createdAt: d.createdAt || '',
            plan: d.plan || 'starter',
            status: d.status || 'trial',
            trialStart: d.trialStart || '',
            trialEnd: d.trialEnd || '',
            planExpiry: d.planExpiry || '',
            maxStores: d.maxStores !== undefined ? d.maxStores : 1,
            defaultStoreName: d.defaultStoreName
          });
        }
      });
      // Sort alphabetically by email
      list.sort((a, b) => a.email.localeCompare(b.email));
      setClients(list);
    } catch (e) {
      console.error("Error listing clients (only admins allowed):", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const isDefaultAdmin = firebaseUser.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com';
        
        try {
          // Wrap getDoc with a 5-second timeout to prevent permanent lock if Firebase connection hangs
          const getDocWithTimeout = (ref: any, ms = 5000) => {
            return Promise.race([
              getDoc(ref),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
            ]);
          };

          let userSnap = await getDocWithTimeout(userDocRef) as any;
          const now = new Date();
          
          if (!userSnap.exists()) {
            // First time self sign-up bootstrap logic
            const trialStart = now.toISOString();
            const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

            const newProfile: UserProfile = {
              userId: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isDefaultAdmin ? 'admin' : 'client',
              plan: isDefaultAdmin ? 'admin' : 'starter',
              status: isDefaultAdmin ? 'active' : 'trial',
              trialStart: isDefaultAdmin ? '' : trialStart,
              trialEnd: isDefaultAdmin ? '' : trialEnd,
              planExpiry: '',
              maxStores: isDefaultAdmin ? 999 : 1,
              createdAt: now.toISOString()
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (setDocErr) {
              console.warn("Unable to save user profile doc (offline mode?):", setDocErr);
            }
            setProfile(newProfile);
          } else {
            let data = userSnap.data();

            // Daily Check Expiration Upon Login/Access (only for standard tiers)
            if (!isDefaultAdmin && data.plan !== 'admin') {
              let updatedStatus = data.status || 'trial';
              if (updatedStatus === 'trial' && data.trialEnd) {
                const end = new Date(data.trialEnd);
                if (now > end) {
                  updatedStatus = 'expired';
                }
              } else if (updatedStatus === 'active' && data.planExpiry) {
                const expiry = new Date(data.planExpiry);
                if (now > expiry) {
                  updatedStatus = 'expired';
                }
              }

              if (updatedStatus !== data.status) {
                try {
                  await setDoc(userDocRef, { status: updatedStatus }, { merge: true });
                  data.status = updatedStatus;
                } catch (e) {
                  console.error("Error setting expired status:", e);
                }
              }
            } else if (isDefaultAdmin && (data.plan !== 'admin' || data.status !== 'active' || data.maxStores !== 999)) {
              // Secure Default Admin profile override values
              const adminUpdates = {
                plan: 'admin',
                status: 'active',
                maxStores: 999,
                role: 'admin'
              };
              try {
                await setDoc(userDocRef, adminUpdates, { merge: true });
                data = { ...data, ...adminUpdates };
              } catch (e) {
                console.error("Failed to restore default admin attributes:", e);
              }
            }

            setProfile({
              userId: data.userId || firebaseUser.uid,
              email: data.email || firebaseUser.email || '',
              role: data.role || 'client',
              createdAt: data.createdAt || '',
              plan: data.plan || 'starter',
              status: data.status || 'trial',
              trialStart: data.trialStart || '',
              trialEnd: data.trialEnd || '',
              planExpiry: data.planExpiry || '',
              maxStores: data.maxStores !== undefined ? data.maxStores : 1,
              defaultStoreName: data.defaultStoreName
            });
          }
        } catch (err) {
          console.error("Error reading/writing user profile doc (falling back to local default): ", err);
          // Resilient fallback profile using firebase login info
          setProfile({
            userId: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: isDefaultAdmin ? 'admin' : 'client',
            plan: isDefaultAdmin ? 'admin' : 'starter',
            status: isDefaultAdmin ? 'active' : 'trial',
            trialStart: '',
            trialEnd: '',
            planExpiry: '',
            maxStores: isDefaultAdmin ? 999 : 1,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUser(null);
        setProfile(null);
        setEmulatedUser(null);
        setClients([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Set clients list and restore emulated user state if profile is Admin
  useEffect(() => {
    if (profile && profile.role === 'admin') {
      refreshClients();
      
      const savedEmuId = localStorage.getItem('lucro_facil_emulated_user_id');
      const savedEmuEmail = localStorage.getItem('lucro_facil_emulated_user_email');
      if (savedEmuId && savedEmuEmail) {
        setEmulatedUserState({ userId: savedEmuId, email: savedEmuEmail });
      }
    }
  }, [profile]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      throw new Error(e.message || "Email ou senha incorretos.");
    }
  };

  const signUp = async (email: string, password: string, storeName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user profile immediately with store name and subscription parameters
      const isDefaultAdmin = email.toLowerCase().trim() === 'espacocarreiro@gmail.com';
      
      const now = new Date();
      const trialStart = now.toISOString();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const newProfile: UserProfile = {
        userId: userCredential.user.uid,
        email: email,
        role: isDefaultAdmin ? 'admin' : 'client',
        plan: isDefaultAdmin ? 'admin' : 'starter',
        status: isDefaultAdmin ? 'active' : 'trial',
        trialStart: isDefaultAdmin ? '' : trialStart,
        trialEnd: isDefaultAdmin ? '' : trialEnd,
        planExpiry: '',
        maxStores: isDefaultAdmin ? 999 : 1,
        createdAt: now.toISOString(),
        defaultStoreName: storeName
      };

      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
    } catch (e: any) {
      throw new Error(e.message || "Erro ao cadastrar usuário.");
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e: any) {
      throw new Error(e.message || "Erro ao sair.");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      throw new Error(e.message || "Erro ao enviar e-mail de recuperação.");
    }
  };

  const checkAccess = (currentStoreCount: number): boolean => {
    if (!profile) return false;
    // Admins bypass
    if (profile.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com' || profile.plan === 'admin' || profile.role === 'admin') {
      return true;
    }
    // Block if expired or cancelled
    if (profile.status === 'expired' || profile.status === 'cancelled') {
      return false;
    }
    // Limit check
    const limit = profile.maxStores ?? 1;
    return currentStoreCount < limit;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const targetId = emulatedUser ? emulatedUser.userId : (user ? user.uid : null);
    if (!targetId) return;

    try {
      const userDocRef = doc(db, 'users', targetId);
      await setDoc(userDocRef, updates, { merge: true });
      
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates
        };
      });

      if (profile?.role === 'admin') {
        await refreshClients();
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      emulatedUser,
      setEmulatedUser,
      clients,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshClients,
      checkAccess,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
