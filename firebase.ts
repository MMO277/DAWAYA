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

const LOCAL_FIREBASE_CONFIG_KEY = 'dawaya_firebase_config_v1';

interface RuntimeFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function loadSavedRuntimeFirebaseConfig(): Partial<RuntimeFirebaseConfig> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_FIREBASE_CONFIG_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<RuntimeFirebaseConfig>;
  } catch {
    return {};
  }
}

/**
 * Allows the site owner or user on mobile to paste their Firebase Web SDK config snippet
 * (or JSON) directly in the UI without needing a CLI rebuild, saving it in localStorage
 * and reloading into full Cloud Sync mode.
 */
export function saveRuntimeFirebaseConfigFromText(input: string): boolean {
  if (typeof window === 'undefined') return false;
  const extract = (key: string): string => {
    const m = input.match(new RegExp(`${key}\\s*[:=]\\s*["']([^"']+)["']`, 'i'));
    return m ? m[1].trim() : '';
  };
  const apiKey = extract('apiKey') || extract('VITE_FIREBASE_API_KEY');
  const projectId = extract('projectId') || extract('VITE_FIREBASE_PROJECT_ID');
  if (!apiKey || !projectId) return false;

  const cfg: RuntimeFirebaseConfig = {
    apiKey,
    authDomain: extract('authDomain') || extract('VITE_FIREBASE_AUTH_DOMAIN') || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: extract('storageBucket') || extract('VITE_FIREBASE_STORAGE_BUCKET') || `${projectId}.appspot.com`,
    messagingSenderId: extract('messagingSenderId') || extract('VITE_FIREBASE_MESSAGING_SENDER_ID') || '',
    appId: extract('appId') || extract('VITE_FIREBASE_APP_ID') || '',
  };
  try {
    window.localStorage.setItem(LOCAL_FIREBASE_CONFIG_KEY, JSON.stringify(cfg));
    return true;
  } catch {
    return false;
  }
}

const savedCfg = loadSavedRuntimeFirebaseConfig();

// Standard Firebase Web Client configuration (Env vars OR Runtime saved config)
const apiKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
  savedCfg.apiKey ||
  '';
const projectId =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
  savedCfg.projectId ||
  '';

export const configured: boolean = Boolean(apiKey.trim() && projectId.trim());

const firebaseConfig: RuntimeFirebaseConfig = {
  apiKey,
  authDomain:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    savedCfg.authDomain ||
    (projectId ? `${projectId}.firebaseapp.com` : ''),
  projectId,
  storageBucket:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    savedCfg.storageBucket ||
    (projectId ? `${projectId}.appspot.com` : ''),
  messagingSenderId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    savedCfg.messagingSenderId ||
    '',
  appId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    savedCfg.appId ||
    '',
};

// Initialize Firebase only when valid configuration is present.
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