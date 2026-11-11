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

export interface DawayaFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const RUNTIME_FIREBASE_CONFIG_KEY = 'dawaya_runtime_firebase_config_v1';

export const appEnv: 'development' | 'staging' | 'production' =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_APP_ENV as 'development' | 'staging' | 'production')) ||
  'production';

// Default Web SDK Public Client Identifiers for DAWAYA (Project: dawaya-343f8)
// Can be disabled by setting VITE_DISABLE_DEFAULT_FIREBASE_CONFIG='true'
const DEFAULT_PUBLIC_WEB_CONFIG: DawayaFirebaseConfig = {
  apiKey: 'AIzaSyAO4QpSm9mKGoa9XLWogBDMvP6EfMxjwQU',
  authDomain: 'dawaya-343f8.firebaseapp.com',
  projectId: 'dawaya-343f8',
  storageBucket: 'dawaya-343f8.firebasestorage.app',
  messagingSenderId: '587128607410',
  appId: '1:587128607410:web:7664a329cb54eb17c9efab',
};

export function validateFirebaseConfigObject(
  candidate: Partial<DawayaFirebaseConfig> | null | undefined
): candidate is DawayaFirebaseConfig {
  if (!candidate || typeof candidate !== 'object') return false;
  const apiKey = typeof candidate.apiKey === 'string' ? candidate.apiKey.trim() : '';
  const authDomain = typeof candidate.authDomain === 'string' ? candidate.authDomain.trim() : '';
  const projectId = typeof candidate.projectId === 'string' ? candidate.projectId.trim() : '';
  const appId = typeof candidate.appId === 'string' ? candidate.appId.trim() : '';

  if (!apiKey.startsWith('AIza') || apiKey.length < 30) return false;
  if (!authDomain.includes('.') || authDomain.length < 6) return false;
  if (!/^[a-z0-9-]+$/i.test(projectId) || projectId.length < 4) return false;
  if (!appId.includes(':web:') && !appId.includes(':android:') && !appId.includes(':ios:')) {
    return false;
  }
  return true;
}

function loadSavedRuntimeFirebaseConfig(): DawayaFirebaseConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RUNTIME_FIREBASE_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateFirebaseConfigObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Parses, validates, and saves a Firebase Web configuration object from JSON or JS snippet text.
 * Returns true ONLY if all required fields (apiKey, authDomain, projectId, appId) are valid and saved.
 */
export function saveRuntimeFirebaseConfigFromText(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (!trimmed) return false;

  const extractField = (key: string): string => {
    const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`);
    const match = trimmed.match(regex);
    return match ? match[1].trim() : '';
  };

  let candidate: Partial<DawayaFirebaseConfig> | null = null;
  try {
    candidate = JSON.parse(trimmed);
  } catch {
    candidate = {
      apiKey: extractField('apiKey'),
      authDomain: extractField('authDomain'),
      projectId: extractField('projectId'),
      storageBucket: extractField('storageBucket'),
      messagingSenderId: extractField('messagingSenderId'),
      appId: extractField('appId'),
    };
  }

  if (!validateFirebaseConfigObject(candidate)) {
    return false;
  }

  const normalized: DawayaFirebaseConfig = {
    apiKey: candidate.apiKey.trim(),
    authDomain: candidate.authDomain.trim(),
    projectId: candidate.projectId.trim(),
    storageBucket: (candidate.storageBucket || `${candidate.projectId.trim()}.appspot.com`).trim(),
    messagingSenderId: (candidate.messagingSenderId || '').trim(),
    appId: candidate.appId.trim(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RUNTIME_FIREBASE_CONFIG_KEY, JSON.stringify(normalized));
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

function resolveActiveFirebaseConfig(): DawayaFirebaseConfig | null {
  const runtimeSaved = loadSavedRuntimeFirebaseConfig();
  if (runtimeSaved) return runtimeSaved;

  const envConfig: Partial<DawayaFirebaseConfig> = {
    apiKey: typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_API_KEY : '',
    authDomain: typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN : '',
    projectId: typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_PROJECT_ID : '',
    storageBucket: typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET : '',
    messagingSenderId: typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID : '',
    appId: typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_APP_ID : '',
  };

  if (validateFirebaseConfigObject(envConfig)) {
    return envConfig;
  }

  const disableFallback =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_DISABLE_DEFAULT_FIREBASE_CONFIG === 'true';

  if (disableFallback) {
    return null;
  }

  return validateFirebaseConfigObject(DEFAULT_PUBLIC_WEB_CONFIG)
    ? DEFAULT_PUBLIC_WEB_CONFIG
    : null;
}

const activeConfig = resolveActiveFirebaseConfig();
export const configured: boolean = Boolean(activeConfig);

export const app: FirebaseApp | null =
  configured && activeConfig
    ? getApps().length === 0
      ? initializeApp(activeConfig)
      : getApp()
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
export const storage: FirebaseStorage | null =
  app && activeConfig?.storageBucket?.trim() ? getStorage(app) : null;