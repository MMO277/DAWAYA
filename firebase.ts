import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Official DAWAYA Firebase Web SDK Configuration (Project: dawaya-343f8)
const DEFAULT_DAWAYA_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAO4QpSm9mKGoa9XLWogBDMvP6EfMxjwQU',
  authDomain: 'dawaya-343f8.firebaseapp.com',
  projectId: 'dawaya-343f8',
  storageBucket: 'dawaya-343f8.firebasestorage.app',
  messagingSenderId: '587128607410',
  appId: '1:587128607410:web:7664a329cb54eb17c9efab',
};

const apiKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
  DEFAULT_DAWAYA_FIREBASE_CONFIG.apiKey;
const projectId =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
  DEFAULT_DAWAYA_FIREBASE_CONFIG.projectId;

export const configured: boolean = Boolean(apiKey.trim() && projectId.trim());

export function saveRuntimeFirebaseConfigFromText(_input: string): boolean {
  return true;
}

const firebaseConfig = {
  apiKey,
  authDomain:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    DEFAULT_DAWAYA_FIREBASE_CONFIG.authDomain,
  projectId,
  storageBucket:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    DEFAULT_DAWAYA_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    DEFAULT_DAWAYA_FIREBASE_CONFIG.messagingSenderId,
  appId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    DEFAULT_DAWAYA_FIREBASE_CONFIG.appId,
};

export const app: FirebaseApp | null = configured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

function createPersistentFirestore(firebaseApp: FirebaseApp): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export const db: Firestore = (app ? createPersistentFirestore(app) : null) as unknown as Firestore;
export const auth: Auth = (app ? getAuth(app) : null) as unknown as Auth;
export const storage: FirebaseStorage | null = app && firebaseConfig.storageBucket.trim() ? getStorage(app) : null;