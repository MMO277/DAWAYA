import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithPopup,
  reauthenticateWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import {
  AccountStatus,
  AuthorizationState,
  CanonicalRole,
  CANONICAL_ROLES,
  computeEffectivePermissions,
  DEFAULT_AUTHZ_STATE,
  ensureDefaultPatientProfile,
  fetchUserAuthorizationState,
  getActiveMembership as rbacGetActiveMembership,
  getAuthorizedRoles as rbacGetAuthorizedRoles,
  getAvailableInterfaceModes,
  getInterfaceModeForRole,
  hasPermission as rbacHasPermission,
  hasRole as rbacHasRole,
  canAccessBranch as rbacCanAccessBranch,
  canAccessPharmacy as rbacCanAccessPharmacy,
  canAccessRegion as rbacCanAccessRegion,
  InterfaceMode,
  normalizeRoleId,
  PermissionId,
  PharmacyMembership,
  RegionalMembership,
  Role as RbacRole,
  toLegacyCompatibleRole,
} from './rbacEngine';

export type AuthMode = 'login' | 'register' | 'forgot';
export type Role = RbacRole;

export const ROLES: Role[] = [
  'super_admin',
  'central_admin',
  'owner',
  'admin',
  'regional_manager',
  'content_reviewer',
  'reviewer',
  'content_editor',
  'editor',
  'pharmacy_owner',
  'pharmacy_manager',
  'pharmacist',
  'pharmacy_employee',
  'employee',
  'viewer',
  'patient',
  'customer',
];

export { CANONICAL_ROLES };

export const GUEST_MODE_KEY = 'aa_guest_mode';
const ROLE_CACHE_PREFIX = 'aa_cached_role_';
const ACTIVE_ROLE_CACHE_PREFIX = 'aa_active_role_';
const ACTIVE_PHARMACY_CACHE_PREFIX = 'aa_active_pharm_';
const ACTIVE_REGION_CACHE_PREFIX = 'aa_active_region_';
export const SAVED_GOOGLE_ACCOUNTS_KEY = 'aa_saved_google_accounts_v1';

export interface SavedGoogleAccount {
  email: string;
  displayName: string;
  uid: string;
  photoURL?: string | null;
  lastUsedAt: number;
}

/**
 * Resolves a real Google Account Profile Photo URL for any Google email.
 */
export function resolveGoogleAvatarUrl(email: string, existingPhotoUrl?: string | null): string {
  if (
    existingPhotoUrl &&
    (existingPhotoUrl.startsWith('http://') ||
      existingPhotoUrl.startsWith('https://') ||
      existingPhotoUrl.startsWith('data:'))
  ) {
    return existingPhotoUrl;
  }
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return '';
  return `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}`;
}

export function formatDisplayNameFromEmail(email: string): string {
  const prefix = (email || '').split('@')[0] || 'Google User';
  const cleaned = prefix
    .replace(/[._-]+/g, ' ')
    .replace(/\d+$/g, '')
    .trim();
  if (!cleaned) return prefix;
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// Section 2 Security Fix: Removed deterministic email-derived password generation (computeFirebaseAppBridgeSecret)
// and public Firestore OAuth token bridge (getEmailBridgeDocId). Authentication strictly uses standard Firebase Auth.

export function getSavedDeviceGoogleAccounts(): SavedGoogleAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_GOOGLE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (a) =>
              a &&
              typeof a.email === 'string' &&
              a.email.includes('@') &&
              typeof a.uid === 'string' &&
              !a.uid.startsWith('g_') &&
              !a.uid.startsWith('google_')
          )
          .map((a) => ({
            ...a,
            displayName: a.displayName || formatDisplayNameFromEmail(a.email),
            photoURL: resolveGoogleAvatarUrl(a.email, a.photoURL),
          }));
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveDeviceGoogleAccount(account: SavedGoogleAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanEmail = account.email.trim().toLowerCase();
    const existingList = getSavedDeviceGoogleAccounts();
    const prevMatch = existingList.find((a) => a.email.toLowerCase() === cleanEmail);

    const mergedAccount: SavedGoogleAccount = {
      email: cleanEmail,
      displayName:
        account.displayName?.trim() ||
        prevMatch?.displayName ||
        formatDisplayNameFromEmail(cleanEmail),
      uid: account.uid || prevMatch?.uid || '',
      photoURL: resolveGoogleAvatarUrl(cleanEmail, account.photoURL || prevMatch?.photoURL),
      lastUsedAt: Date.now(),
    };

    if (!mergedAccount.uid) return;

    const others = existingList.filter((a) => a.email.toLowerCase() !== cleanEmail);
    const updated = [mergedAccount, ...others].slice(0, 8);
    localStorage.setItem(SAVED_GOOGLE_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function removeSavedDeviceGoogleAccount(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = email.trim().toLowerCase();
    const filtered = getSavedDeviceGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== clean
    );
    localStorage.setItem(SAVED_GOOGLE_ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

export async function fetchCloudSyncedGoogleAccounts(): Promise<SavedGoogleAccount[]> {
  return getSavedDeviceGoogleAccounts();
}

export function isGuestModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (
      sessionStorage.getItem(GUEST_MODE_KEY) === '1' ||
      localStorage.getItem(GUEST_MODE_KEY) === '1'
    ) {
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function setGuestModeActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      sessionStorage.setItem(GUEST_MODE_KEY, '1');
      localStorage.setItem(GUEST_MODE_KEY, '1');
    } else {
      sessionStorage.removeItem(GUEST_MODE_KEY);
      localStorage.removeItem(GUEST_MODE_KEY);
    }
  } catch {}
}

export interface NativePickedGoogleProfile {
  email: string;
  displayName?: string;
  photoURL?: string;
  idToken?: string;
  accessToken?: string;
  uid?: string;
}

export interface AuthContextType {
  user: User | null;
  role: Role | null;
  canonicalRole: CanonicalRole;
  activeRole: CanonicalRole;
  activeMode: InterfaceMode;
  authorizedRoles: CanonicalRole[];
  pharmacyMemberships: PharmacyMembership[];
  regionalMemberships: RegionalMembership[];
  activePharmacyId: string | null;
  activeRegionId: string | null;
  effectivePermissions: PermissionId[];
  accountStatus: AccountStatus;
  availableModes: {
    mode: InterfaceMode;
    role: CanonicalRole;
    labelAr: string;
    labelEn: string;
    badge: string;
    targetRoute: string;
  }[];
  switchMode: (
    modeOrRole: InterfaceMode | CanonicalRole,
    options?: { pharmacyId?: string; regionId?: string }
  ) => boolean;
  refreshPermissions: () => Promise<void>;
  hasRole: (targetRole: Role) => boolean;
  hasPermission: (perm: PermissionId, options?: { pharmacyId?: string; regionId?: string }) => boolean;
  canAccessPharmacy: (pharmacyId: string) => boolean;
  canAccessBranch: (pharmacyId: string, branchId: string) => boolean;
  canAccessRegion: (regionId: string) => boolean;
  getActiveMembership: (pharmacyId?: string) => PharmacyMembership | null;
  getAuthorizedRoles: () => CanonicalRole[];
  roleStatus: string;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, displayName?: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (loginHintEmail?: string) => Promise<void>;
  loginWithNativeGoogleAccount: (profile: NativePickedGoogleProfile) => Promise<void>;
  activateAppBridgeNow: (hintEmail?: string) => Promise<boolean>;
  needsAppBridgeActivation: boolean;
  hasNativeGoogleAccountPicker: () => boolean;
  triggerNativeGoogleAccountPicker: () => Promise<string | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  modalOpen: boolean;
  modalMode: AuthMode;
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  logoutModalOpen: boolean;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  isGuest: boolean;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  canonicalRole: 'patient',
  activeRole: 'patient',
  activeMode: 'patient',
  authorizedRoles: ['patient'],
  pharmacyMemberships: [],
  regionalMemberships: [],
  activePharmacyId: null,
  activeRegionId: null,
  effectivePermissions: ['patient.access', 'medications.view'],
  accountStatus: 'active',
  availableModes: [],
  switchMode: () => false,
  refreshPermissions: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  canAccessPharmacy: () => false,
  canAccessBranch: () => false,
  canAccessRegion: () => false,
  getActiveMembership: () => null,
  getAuthorizedRoles: () => ['patient'],
  roleStatus: '',
  loading: false,
  error: null,
  clearError: () => {},
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  loginWithNativeGoogleAccount: async () => {},
  activateAppBridgeNow: async () => false,
  needsAppBridgeActivation: false,
  hasNativeGoogleAccountPicker: () => false,
  triggerNativeGoogleAccountPicker: async () => null,
  logout: async () => {},
  resetPassword: async () => {},
  modalOpen: false,
  modalMode: 'login',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  logoutModalOpen: false,
  openLogoutModal: () => {},
  closeLogoutModal: () => {},
  isGuest: false,
  continueAsGuest: () => {},
  exitGuestMode: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function translateAuthError(errCode: string, isAr = true): string {
  switch (errCode) {
    case 'auth/unconfigured':
      return isAr
        ? 'خدمة الحسابات السحابية غير مفعّلة في هذه النسخة (إعدادات Firebase غير متوفرة). يمكنك الاستمرار في استخدام كافة أدوات الموقع كزائر بكل أمان.'
        : 'Cloud accounts are not configured in this build. You can safely continue using all platform features as a guest.';
    case 'auth/invalid-email':
      return isAr ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email address format.';
    case 'auth/user-not-found':
      return isAr ? 'لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني.' : 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return isAr ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.' : 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return isAr ? 'كلمة المرور ضعيفة. يُرجى استخدام 6 أحرف أو أرقام على الأقل.' : 'Password is too weak. Please use at least 6 characters.';
    case 'auth/too-many-requests':
      return isAr ? 'تم حظر المحاولات مؤقتاً لتكرار المحاولات الخاطئة. انتظر دقيقة ثم أعد المحاولة.' : 'Too many unsuccessful attempts. Please wait a minute and try again.';
    case 'auth/network-request-failed':
      return isAr ? 'أنت الآن في وضع الأوفلاين (بدون إنترنت). يمكنك الضغط على "متابعة التصفح كزائر" لاستخدام كافة أدوات التطبيق فوراً بدون إنترنت!' : 'You are currently offline. Tap "Continue as Guest" to use all platform features offline immediately!';
    case 'auth/requires-recent-login':
      return isAr ? 'يجب إعادة تسجيل الدخول لتنفيذ هذا الإجراء الأمني.' : 'Please log in again to confirm this sensitive action.';
    case 'auth/popup-closed-by-user':
      return isAr ? 'تم إغلاق نافذة اختيار الحساب.' : 'Account selector was closed.';
    case 'auth/popup-blocked':
      return isAr ? 'المتصفح منع النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة.' : 'Popup was blocked by the browser. Please allow popups.';
    case 'auth/needs-one-time-web-bridge':
      return isAr
        ? 'لتشغيل نفس حسابك المسجل على الموقع داخل التطبيق بدون باسورد، اضغط الزر الأخضر بالأسفل لتأكيده بضغطة واحدة فقط.'
        : 'To use your exact website Google account inside the app without a password, tap the green button below once.';
    default:
      return isAr ? 'حدث خطأ في المصادقة. يُرجى إعادة المحاولة.' : 'Authentication error occurred. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [authzState, setAuthzState] = useState<AuthorizationState>(DEFAULT_AUTHZ_STATE);
  const [roleStatus, setRoleStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<AuthMode>('login');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [needsAppBridgeActivation, setNeedsAppBridgeActivation] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem('aa_quick_google_user_v1');
    } catch {}
  }, []);

  const syncGoogleBridgeToFirestore = async (
    firebaseUser: User,
    _oauthIdToken?: string | null,
    _oauthAccessToken?: string | null
  ): Promise<boolean> => {
    const email = firebaseUser.email?.trim().toLowerCase();
    if (!email) return false;

    const googlePhoto =
      firebaseUser.photoURL ||
      firebaseUser.providerData?.find((p) => p?.photoURL)?.photoURL ||
      resolveGoogleAvatarUrl(email);
    const googleName =
      firebaseUser.displayName ||
      firebaseUser.providerData?.find((p) => p?.displayName)?.displayName ||
      formatDisplayNameFromEmail(email);

    setNeedsAppBridgeActivation(false);

    saveDeviceGoogleAccount({
      email,
      displayName: googleName,
      uid: firebaseUser.uid,
      photoURL: googlePhoto,
      lastUsedAt: Date.now(),
    });

    return true;
  };

  const activateAppBridgeNow = async (hintEmail?: string): Promise<boolean> => {
    if (!configured || !auth) return false;
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      const targetEmail = hintEmail || auth.currentUser?.email || '';
      if (targetEmail) {
        provider.setCustomParameters({ login_hint: targetEmail.trim().toLowerCase() });
      } else {
        provider.setCustomParameters({ prompt: 'select_account' });
      }

      let cred;
      if (auth.currentUser && (!hintEmail || auth.currentUser.email?.toLowerCase() === hintEmail.toLowerCase())) {
        try {
          cred = await reauthenticateWithPopup(auth.currentUser, provider, browserPopupRedirectResolver);
        } catch {
          cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        }
      } else {
        cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      }

      const oauthCred = GoogleAuthProvider.credentialFromResult(cred);
      if (cred.user) {
        await syncGoogleBridgeToFirestore(cred.user, oauthCred?.idToken, oauthCred?.accessToken);
        setNeedsAppBridgeActivation(false);
        return true;
      }
    } catch (err) {
      console.warn('Could not activate app bridge:', err);
    }
    return false;
  };

  const syncUserRoleInBackground = useCallback(async (uid: string, currentUser?: User | null) => {
    let preferredActiveRole: CanonicalRole | null = null;
    try {
      const savedActive = localStorage.getItem(ACTIVE_ROLE_CACHE_PREFIX + uid);
      if (savedActive) preferredActiveRole = normalizeRoleId(savedActive);
      const cachedR = localStorage.getItem(ROLE_CACHE_PREFIX + uid) as Role | null;
      if (cachedR && ROLES.includes(cachedR)) {
        setRole(cachedR);
        setRoleStatus('ok');
      } else {
        // Section 3: Every signed-in user receives 'patient' automatically as safe baseline
        setRole('patient');
        setRoleStatus('ok');
      }
    } catch {
      setRole('patient');
    }

    let claimRoleStr: string | null = null;
    if (currentUser && typeof currentUser.getIdTokenResult === 'function') {
      try {
        const tokenResult = await currentUser.getIdTokenResult().catch(() => null);
        if (typeof tokenResult?.claims?.role === 'string') {
          claimRoleStr = tokenResult.claims.role.trim().toLowerCase();
        }
      } catch {
        /* ignore */
      }
    }

    try {
      const resolvedState = await fetchUserAuthorizationState(
        uid,
        currentUser?.email,
        claimRoleStr,
        preferredActiveRole
      );

      // Restore cached pharmacyId / regionId if still valid in memberships
      try {
        const cachedPharmId = localStorage.getItem(ACTIVE_PHARMACY_CACHE_PREFIX + uid);
        if (
          cachedPharmId &&
          resolvedState.pharmacyMemberships.some((m) => m.status === 'active' && m.pharmacyId === cachedPharmId)
        ) {
          resolvedState.activePharmacyId = cachedPharmId;
        }
        const cachedRegId = localStorage.getItem(ACTIVE_REGION_CACHE_PREFIX + uid);
        if (
          cachedRegId &&
          resolvedState.regionalMemberships.some((m) => m.status === 'active' && m.regionId === cachedRegId)
        ) {
          resolvedState.activeRegionId = cachedRegId;
        }
      } catch {
        /* ignore */
      }

      setAuthzState(resolvedState);

      // Expose legacy-compatible role for existing components while keeping patient as baseline
      const legacyCompat =
        resolvedState.primaryRole === 'patient'
          ? 'patient'
          : toLegacyCompatibleRole(resolvedState.primaryRole);
      setRole(legacyCompat);
      setRoleStatus(resolvedState.accountStatus === 'suspended' ? 'suspended' : 'ok');

      try {
        localStorage.setItem(ROLE_CACHE_PREFIX + uid, legacyCompat);
        localStorage.setItem(ACTIVE_ROLE_CACHE_PREFIX + uid, resolvedState.activeRole);
      } catch {
        /* ignore */
      }
    } catch (e) {
      // Safe fallback on network/offline error: strictly 'patient' permissions
      setRole('patient');
      setRoleStatus(`error:${(e as { code?: string }).code ?? 'offline'}`);
    }
  }, []);

  /**
   * Section 5: Secure Role & Interface Mode Switching without signing out.
   * Verifies that the user actually owns the target role/mode and active membership before switching.
   */
  const switchMode = useCallback(
    (
      modeOrRole: InterfaceMode | CanonicalRole,
      options?: { pharmacyId?: string; regionId?: string }
    ): boolean => {
      if (authzState.accountStatus === 'suspended') return false;

      let targetRole: CanonicalRole = 'patient';
      if (modeOrRole === 'patient') {
        targetRole = 'patient';
      } else if (modeOrRole === 'pharmacy') {
        const pharmOrder: CanonicalRole[] = [
          'pharmacy_owner',
          'pharmacy_manager',
          'pharmacist',
          'pharmacy_employee',
        ];
        const found = pharmOrder.find((r) => authzState.authorizedRoles.includes(r));
        if (found) {
          targetRole = found;
        } else if (
          authzState.authorizedRoles.includes('super_admin') ||
          authzState.authorizedRoles.includes('central_admin')
        ) {
          targetRole = 'pharmacy_owner';
        } else {
          return false;
        }
      } else if (modeOrRole === 'admin') {
        const adminOrder: CanonicalRole[] = [
          'super_admin',
          'central_admin',
          'regional_manager',
          'content_reviewer',
          'content_editor',
          'viewer',
        ];
        const found = adminOrder.find((r) => authzState.authorizedRoles.includes(r));
        if (!found) return false;
        targetRole = found;
      } else {
        const normalized = normalizeRoleId(modeOrRole);
        if (
          !authzState.authorizedRoles.includes(normalized) &&
          !authzState.authorizedRoles.includes('super_admin') &&
          !authzState.authorizedRoles.includes('central_admin')
        ) {
          return false;
        }
        targetRole = normalized;
      }

      // Verify pharmacy scope if switching to pharmacy role
      let nextPharmacyId = options?.pharmacyId || authzState.activePharmacyId;
      if (
        ['pharmacy_owner', 'pharmacy_manager', 'pharmacist', 'pharmacy_employee'].includes(targetRole) &&
        !authzState.authorizedRoles.includes('super_admin') &&
        !authzState.authorizedRoles.includes('central_admin')
      ) {
        const validMem =
          authzState.pharmacyMemberships.find(
            (m) => m.status === 'active' && (!nextPharmacyId || m.pharmacyId === nextPharmacyId)
          ) || authzState.pharmacyMemberships.find((m) => m.status === 'active');
        if (!validMem) return false;
        nextPharmacyId = validMem.pharmacyId;
      }

      // Verify regional scope if switching to regional_manager
      let nextRegionId = options?.regionId || authzState.activeRegionId;
      if (
        targetRole === 'regional_manager' &&
        !authzState.authorizedRoles.includes('super_admin') &&
        !authzState.authorizedRoles.includes('central_admin')
      ) {
        const validReg =
          authzState.regionalMemberships.find(
            (m) => m.status === 'active' && (!nextRegionId || m.regionId === nextRegionId)
          ) || authzState.regionalMemberships.find((m) => m.status === 'active');
        if (!validReg) return false;
        nextRegionId = validReg.regionId;
      }

      const nextMode = getInterfaceModeForRole(targetRole);
      const nextPerms = computeEffectivePermissions(
        targetRole,
        authzState.authorizedRoles,
        authzState.pharmacyMemberships,
        authzState.regionalMemberships,
        nextPharmacyId
      );

      const nextState: AuthorizationState = {
        ...authzState,
        activeRole: targetRole,
        activeMode: nextMode,
        activePharmacyId: nextPharmacyId || null,
        activeRegionId: nextRegionId || null,
        effectivePermissions: nextPerms,
      };
      setAuthzState(nextState);

      if (user?.uid) {
        try {
          localStorage.setItem(ACTIVE_ROLE_CACHE_PREFIX + user.uid, targetRole);
          if (nextPharmacyId) {
            localStorage.setItem(ACTIVE_PHARMACY_CACHE_PREFIX + user.uid, nextPharmacyId);
          }
          if (nextRegionId) {
            localStorage.setItem(ACTIVE_REGION_CACHE_PREFIX + user.uid, nextRegionId);
          }
        } catch {
          /* ignore */
        }
        // Persist UI activeRole preference in customerProfiles/{uid} (non-authoritative UI preference)
        if (configured && db) {
          setDoc(
            doc(db, 'customerProfiles', user.uid),
            { activeRole: targetRole, updatedAt: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        }
      }

      return true;
    },
    [authzState, user?.uid]
  );

  const refreshPermissions = useCallback(async () => {
    if (!user?.uid) return;
    await syncUserRoleInBackground(user.uid, user);
  }, [user, syncUserRoleInBackground]);

  useEffect(() => {
    void fetchCloudSyncedGoogleAccounts();

    if (!configured || !auth) {
      setLoading(false);
      setGuestModeActive(true);
      setIsGuest(true);
      return;
    }

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;
      if (currentUser) {
        const providerPhoto =
          currentUser.photoURL ||
          currentUser.providerData?.find((p) => p?.photoURL)?.photoURL;
        const providerName =
          currentUser.displayName ||
          currentUser.providerData?.find((p) => p?.displayName)?.displayName ||
          formatDisplayNameFromEmail(currentUser.email || '');
        const enrichedPhoto = resolveGoogleAvatarUrl(currentUser.email || '', providerPhoto);

        if (!currentUser.photoURL && enrichedPhoto) {
          try {
            Object.defineProperty(currentUser, 'photoURL', { value: enrichedPhoto, configurable: true });
          } catch {}
        }
        if (!currentUser.displayName && providerName) {
          try {
            Object.defineProperty(currentUser, 'displayName', { value: providerName, configurable: true });
          } catch {}
        }

        setUser(currentUser);
        setGuestModeActive(false);
        setIsGuest(false);
        setModalOpen(false);
        setLoading(false);

        // Section 3: Ensure default 'patient' profile exists
        void ensureDefaultPatientProfile(currentUser);
        await syncUserRoleInBackground(currentUser.uid, currentUser);

        if (currentUser.email) {
          saveDeviceGoogleAccount({
            email: currentUser.email.toLowerCase(),
            displayName: providerName,
            uid: currentUser.uid,
            photoURL: enrichedPhoto,
            lastUsedAt: Date.now(),
          });
          void syncGoogleBridgeToFirestore(currentUser);
        }
      } else {
        setUser(null);
        setRole(null);
        setAuthzState(DEFAULT_AUTHZ_STATE);
        setRoleStatus('');
        setLoading(false);
        setGuestModeActive(true);
        setIsGuest(true);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [syncUserRoleInBackground]);

  const clearError = () => setError(null);

  const openAuthModal = (mode: AuthMode = 'login') => {
    setModalMode(mode);
    setError(null);
    setModalOpen(true);
  };

  const continueAsGuest = () => {
    setGuestModeActive(true);
    setIsGuest(true);
    setModalOpen(false);
    setError(null);
  };

  const exitGuestMode = () => {
    setGuestModeActive(false);
    setIsGuest(false);
    try {
      sessionStorage.removeItem('aa_lamp_seen');
    } catch {}
    openAuthModal('login');
  };

  const closeAuthModal = () => {
    setModalOpen(false);
    setError(null);
    if (!user) {
      setGuestModeActive(true);
      setIsGuest(true);
    }
  };

  const openLogoutModal = () => {
    setError(null);
    setLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setLogoutModalOpen(false);
  };

  const hasNativeGoogleAccountPicker = (): boolean => {
    if (typeof window === 'undefined') return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bridge = (window as any).AndroidAlarmBridge;
    return Boolean(bridge && typeof bridge.pickGoogleAccount === 'function');
  };

  const triggerNativeGoogleAccountPicker = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bridge = (window as any).AndroidAlarmBridge;
      if (!bridge || typeof bridge.pickGoogleAccount !== 'function') {
        resolve(null);
        return;
      }
      let settled = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__onAndroidGoogleAccountPicked = (payloadOrEmail: string) => {
        if (settled) return;
        settled = true;
        if (!payloadOrEmail || payloadOrEmail === '__CANCELLED__') {
          resolve(null);
        } else {
          resolve(payloadOrEmail.trim());
        }
      };
      try {
        const started = bridge.pickGoogleAccount();
        if (!started) {
          settled = true;
          resolve(null);
        }
      } catch {
        settled = true;
        resolve(null);
      }
    });
  };

  const tryGetNativeTokenForEmail = (email: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bridge = (window as any).AndroidAlarmBridge;
      if (!bridge || typeof bridge.getGoogleTokenForEmail !== 'function') {
        resolve(null);
        return;
      }
      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, 6000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__onAndroidGoogleAccountPicked = (resStr: string) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (resStr && resStr.includes('|')) {
          resolve(resStr.split('|')[1] || null);
        } else {
          resolve(null);
        }
      };
      try {
        const ok = bridge.getGoogleTokenForEmail(email);
        if (!ok) {
          settled = true;
          window.clearTimeout(timer);
          resolve(null);
        }
      } catch {
        settled = true;
        window.clearTimeout(timer);
        resolve(null);
      }
    });
  };

  const loginWithNativeGoogleAccount = async (profile: NativePickedGoogleProfile) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }

    let rawEmail = (profile.email || '').trim();
    let nativeAccessToken = profile.accessToken;

    if (rawEmail.includes('|')) {
      const parts = rawEmail.split('|');
      rawEmail = parts[0].trim();
      if (parts[1] && !nativeAccessToken) {
        nativeAccessToken = parts[1].trim();
      }
    }

    const cleanEmail = rawEmail.toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('auth/invalid-email');
      throw new Error('auth/invalid-email');
    }

    await setPersistence(auth, browserLocalPersistence);

    if (!profile.idToken && !nativeAccessToken) {
      const tokenFromBridge = await tryGetNativeTokenForEmail(cleanEmail);
      if (tokenFromBridge) {
        nativeAccessToken = tokenFromBridge;
      }
    }

    if (profile.idToken || nativeAccessToken) {
      try {
        const credential = GoogleAuthProvider.credential(
          profile.idToken || null,
          nativeAccessToken || undefined
        );
        const cred = await signInWithCredential(auth, credential);
        await syncGoogleBridgeToFirestore(cred.user, profile.idToken, nativeAccessToken);
        setGuestModeActive(false);
        setIsGuest(false);
        closeAuthModal();
        return;
      } catch (credErr) {
        console.warn('Direct OAuth credential sign-in fallback:', credErr);
      }
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: cleanEmail });
      const popCred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const oauthCred = GoogleAuthProvider.credentialFromResult(popCred);
      await syncGoogleBridgeToFirestore(
        popCred.user,
        oauthCred?.idToken,
        oauthCred?.accessToken
      );
      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
      return;
    } catch (oauthErr: any) {
      const errCode = oauthErr?.code || 'auth/requires-google-verification';
      setError(errCode);
      throw oauthErr;
    }
  };

  const login = async (email: string, password: string, rememberMe = true) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.email) {
        saveDeviceGoogleAccount({
          email: cred.user.email.toLowerCase(),
          displayName: cred.user.displayName || formatDisplayNameFromEmail(cred.user.email),
          uid: cred.user.uid,
          photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
          lastUsedAt: Date.now(),
        });
      }
      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  /**
   * Section 3: Default User Registration
   * Automatically assigns the "patient" role and initializes a safe patient profile.
   */
  const register = async (email: string, password: string, displayName = '', rememberMe = true) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
        setUser({ ...cred.user, displayName: displayName.trim() } as User);
      }
      // Immediately assign safe default 'patient' state locally & in customerProfiles/{uid}
      setRole('patient');
      setAuthzState({
        ...DEFAULT_AUTHZ_STATE,
        uid: cred.user.uid,
        primaryRole: 'patient',
        activeRole: 'patient',
        activeMode: 'patient',
        authorizedRoles: ['patient'],
      });
      await ensureDefaultPatientProfile(cred.user);

      if (cred.user.email) {
        saveDeviceGoogleAccount({
          email: cred.user.email.toLowerCase(),
          displayName: displayName.trim() || formatDisplayNameFromEmail(cred.user.email),
          uid: cred.user.uid,
          photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
          lastUsedAt: Date.now(),
        });
      }
      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  const loginWithGoogle = async (loginHintEmail?: string) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }

    if (loginHintEmail && loginHintEmail.includes('@')) {
      await loginWithNativeGoogleAccount({ email: loginHintEmail });
      return;
    }

    if (hasNativeGoogleAccountPicker()) {
      const pickedRaw = await triggerNativeGoogleAccountPicker();
      if (!pickedRaw) return;
      await loginWithNativeGoogleAccount({ email: pickedRaw });
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const oauthCred = GoogleAuthProvider.credentialFromResult(cred);

      if (cred.user) {
        await ensureDefaultPatientProfile(cred.user);
        await syncGoogleBridgeToFirestore(
          cred.user,
          oauthCred?.idToken,
          oauthCred?.accessToken
        );
        if (cred.user.email) {
          saveDeviceGoogleAccount({
            email: cred.user.email.toLowerCase(),
            displayName: cred.user.displayName || formatDisplayNameFromEmail(cred.user.email),
            uid: cred.user.uid,
            photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
            lastUsedAt: Date.now(),
          });
        }
      }
      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    setGuestModeActive(false);
    setIsGuest(false);
    if (!configured || !auth) {
      setUser(null);
      setRole(null);
      setAuthzState(DEFAULT_AUTHZ_STATE);
      setRoleStatus('');
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      setAuthzState(DEFAULT_AUTHZ_STATE);
    } catch (err: any) {
      console.error('Logout error:', err);
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  const availableModes = useMemo(() => getAvailableInterfaceModes(authzState), [authzState]);

  const checkHasRole = useCallback(
    (targetRole: Role) => rbacHasRole(authzState, targetRole),
    [authzState]
  );

  const checkHasPermission = useCallback(
    (perm: PermissionId, options?: { pharmacyId?: string; regionId?: string }) =>
      rbacHasPermission(authzState, perm, options),
    [authzState]
  );

  const checkCanAccessPharmacy = useCallback(
    (pharmacyId: string) => rbacCanAccessPharmacy(authzState, pharmacyId),
    [authzState]
  );

  const checkCanAccessBranch = useCallback(
    (pharmacyId: string, branchId: string) => rbacCanAccessBranch(authzState, pharmacyId, branchId),
    [authzState]
  );

  const checkCanAccessRegion = useCallback(
    (regionId: string) => rbacCanAccessRegion(authzState, regionId),
    [authzState]
  );

  const getActiveMembership = useCallback(
    (pharmacyId?: string) => rbacGetActiveMembership(authzState, pharmacyId),
    [authzState]
  );

  const getAuthorizedRoles = useCallback(
    () => rbacGetAuthorizedRoles(authzState),
    [authzState]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        canonicalRole: authzState.primaryRole,
        activeRole: authzState.activeRole,
        activeMode: authzState.activeMode,
        authorizedRoles: authzState.authorizedRoles,
        pharmacyMemberships: authzState.pharmacyMemberships,
        regionalMemberships: authzState.regionalMemberships,
        activePharmacyId: authzState.activePharmacyId,
        activeRegionId: authzState.activeRegionId,
        effectivePermissions: authzState.effectivePermissions,
        accountStatus: authzState.accountStatus,
        availableModes,
        switchMode,
        refreshPermissions,
        hasRole: checkHasRole,
        hasPermission: checkHasPermission,
        canAccessPharmacy: checkCanAccessPharmacy,
        canAccessBranch: checkCanAccessBranch,
        canAccessRegion: checkCanAccessRegion,
        getActiveMembership,
        getAuthorizedRoles,
        roleStatus,
        loading,
        error,
        clearError,
        login,
        register,
        loginWithGoogle,
        loginWithNativeGoogleAccount,
        activateAppBridgeNow,
        needsAppBridgeActivation,
        hasNativeGoogleAccountPicker,
        triggerNativeGoogleAccountPicker,
        logout,
        resetPassword,
        modalOpen,
        modalMode,
        openAuthModal,
        closeAuthModal,
        logoutModalOpen,
        openLogoutModal,
        closeLogoutModal,
        isGuest,
        continueAsGuest,
        exitGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
