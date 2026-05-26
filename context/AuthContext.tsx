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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  emulatedUser: { userId: string; email: string } | null;
  setEmulatedUser: (user: { userId: string; email: string } | null) => void;
  clients: UserProfile[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshClients: () => Promise<void>;
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
      snap.forEach(doc => {
        const d = doc.data();
        if (d.userId) {
          list.push({
            userId: d.userId,
            email: d.email || '',
            role: d.role || 'client',
            createdAt: d.createdAt || ''
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
        
        try {
          // Wrap getDoc with a 5-second timeout to prevent permanent lock if Firebase connection hangs
          const getDocWithTimeout = (ref: any, ms = 5000) => {
            return Promise.race([
              getDoc(ref),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
            ]);
          };

          let userSnap = await getDocWithTimeout(userDocRef) as any;
          
          if (!userSnap.exists()) {
            // First time self sign-up bootstrap logic
            const isDefaultAdmin = firebaseUser.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com';
            const newProfile: UserProfile = {
              userId: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isDefaultAdmin ? 'admin' : 'client',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (setDocErr) {
              console.warn("Unable to save user profile doc (offline mode?):", setDocErr);
            }
            setProfile(newProfile);
          } else {
            const data = userSnap.data();
            setProfile({
              userId: data.userId || firebaseUser.uid,
              email: data.email || firebaseUser.email || '',
              role: data.role || 'client',
              createdAt: data.createdAt || ''
            });
          }
        } catch (err) {
          console.error("Error reading/writing user profile doc (falling back to local default): ", err);
          // Resilient fallback profile using firebase login info
          const isDefaultAdmin = firebaseUser.email?.toLowerCase().trim() === 'espacocarreiro@gmail.com';
          setProfile({
            userId: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: isDefaultAdmin ? 'admin' : 'client',
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

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
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
      refreshClients
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
