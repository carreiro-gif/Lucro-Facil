import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import localConfig from './firebase-applet-config.json';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || localConfig.appId
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
