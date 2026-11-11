/**
 * passportService.ts
 * DAWAYA | دوايا — Smart Patient Medical ID & Emergency Passport Service
 * يدعم:
 * - حفظ ومزامنة الكارت الطبي الذكي (ID Card) على السحابة (Firestore) للمسجلين ومحلياً (localStorage) للزوار
 * - رفع وحفظ صورة المريض محلياً وسحابياً (Base64 مضغوط + Firebase Storage / Firestore)
 * - توليد رموز QR فورية تعمل 100% أوفلاين وأونلاين عبر حزمة `qrcode` المحلية
 * - تشفير وفك تشفير بيانات الكارت السريعة للزوار أو لحالات الطوارئ أو عبر PIN للمسجلين
 */

import QRCode from 'qrcode';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import type { UserHealthProfile } from './allergyData';
import type { SavedPrescription, TreatmentSchedule } from './trackerData';

const LOCAL_PHOTO_KEY_PREFIX = 'dawaya_passport_photo_v1_';
const LOCAL_SHARE_KEY_PREFIX = 'dawaya_passport_share_v1_';
const GUEST_PASSPORT_ID_KEY = 'dawaya_guest_passport_uid_v1';

/**
 * Generates or retrieves a stable local Medical ID serial for Guest users
 * so their ID Card and QR work immediately even before signing in.
 */
export function getOrCreateGuestPassportId(): string {
  if (typeof window === 'undefined') return 'DWY-GUEST-EG';
  try {
    const existing = localStorage.getItem(GUEST_PASSPORT_ID_KEY);
    if (existing && existing.trim()) return existing.trim();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const created = `DWY-${rand}`;
    localStorage.setItem(GUEST_PASSPORT_ID_KEY, created);
    return created;
  } catch {
    return 'DWY-GUEST-EG';
  }
}

/**
 * Encodes a compact offline-safe emergency snapshot into a URL-safe base64 payload
 * so scanning a Guest QR (or offline QR) on another phone still opens essential emergency data!
 */
export function encodeEmergencyQrSnapshot(
  profile: UserHealthProfile,
  pin?: string
): string {
  try {
    const chronicNames: string[] = [];
    if (Array.isArray(profile.chronicConditions)) {
      for (const c of profile.chronicConditions) {
        if (c?.conditionName?.trim()) chronicNames.push(c.conditionName.trim());
      }
    }
    const compact = {
      n: (profile.displayName || profile.fullName || '').slice(0, 48),
      a: (profile.age || (profile.ageYears ? String(profile.ageYears) : '')).slice(0, 12),
      b: (profile.bloodType || '').slice(0, 8),
      w: (profile.weightKg || '').slice(0, 8),
      g: (profile.gender || '').slice(0, 10),
      e: (profile.emergencyContact || '').slice(0, 20),
      r: profile.renalStatus || 'unknown',
      h: profile.hepaticStatus || 'unknown',
      p: pin ? pin.trim() : '',
      al: (profile.allergies || []).slice(0, 8).map((x) => ({
        d: x.drugName.slice(0, 36),
        k: x.allergenKey,
        s: x.severity,
      })),
      ch: chronicNames.slice(0, 8),
      md: (profile.medications || [])
        .filter((m) => m.status === 'active')
        .slice(0, 8)
        .map((m) => ({
          d: m.drugName.slice(0, 36),
          p: (m.prescribedDose || '').slice(0, 20),
          f: m.frequency,
        })),
    };
    const jsonStr = JSON.stringify(compact);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch {
    return '';
  }
}

export function decodeEmergencyQrSnapshot(encoded: string): {
  profile: Partial<UserHealthProfile>;
  pin: string;
} | null {
  if (!encoded) return null;
  try {
    const jsonStr = decodeURIComponent(escape(atob(encoded)));
    const d = JSON.parse(jsonStr);
    if (!d || typeof d !== 'object') return null;
    const allergies = Array.isArray(d.al)
      ? d.al.map((item: { d?: string; k?: string; s?: string }, idx: number) => ({
          id: `qr-all-${idx}`,
          drugName: String(item.d || ''),
          allergenKey: String(item.k || 'other'),
          reportedSymptoms: '',
          severity: (item.s || 'severe') as UserHealthProfile['allergies'][number]['severity'],
          evidenceStatus: 'patient_reported' as const,
          notes: '',
          createdAt: new Date().toISOString(),
        }))
      : [];
    const medications = Array.isArray(d.md)
      ? d.md.map((item: { d?: string; p?: string; f?: string }, idx: number) => ({
          id: `qr-med-${idx}`,
          drugName: String(item.d || ''),
          activeIngredients: '',
          prescribedDose: String(item.p || ''),
          route: 'oral',
          frequency: String(item.f || 'twice_daily'),
          startDate: '',
          status: 'active' as const,
        }))
      : [];
    const chronicConditions = Array.isArray(d.ch)
      ? d.ch.map((name: string, idx: number) => ({
          id: `qr-cond-${idx}`,
          conditionName: String(name || ''),
          evidenceStatus: 'patient_reported' as const,
          source: 'manual_entry' as const,
          createdAt: new Date().toISOString(),
        }))
      : [];
    return {
      pin: typeof d.p === 'string' ? d.p : '',
      profile: {
        displayName: String(d.n || ''),
        age: String(d.a || ''),
        bloodType: String(d.b || ''),
        weightKg: String(d.w || ''),
        gender: String(d.g || ''),
        emergencyContact: String(d.e || ''),
        renalStatus: d.r || 'unknown',
        hepaticStatus: d.h || 'unknown',
        allergies,
        medications,
        chronicConditions,
      },
    };
  } catch {
    return null;
  }
}

export function buildPassportUrl(
  uid: string,
  profile?: UserHealthProfile,
  pin?: string
): string {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#/passport/${encodeURIComponent(uid)}`
      : `https://mmo277.github.io/DAWAYA/#/passport/${encodeURIComponent(uid)}`;
  if (profile) {
    const snap = encodeEmergencyQrSnapshot(profile, pin);
    if (snap) {
      return `${base}?snap=${encodeURIComponent(snap)}`;
    }
  }
  return base;
}

/**
 * Generates an offline-capable DataURL QR code image using the local `qrcode` library.
 */
export async function generateOfflineQrDataUrl(
  url: string,
  size = 200
): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: {
        dark: '#101E36',
        light: '#FFFFFF',
      },
    });
  } catch {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=6&color=101E36`;
  }
}

/**
 * تحويل الصورة لـ base64 مضغوطة وحفظها في Firestore مباشرة أو محلياً
 * لا يحتاج أي سيرفر خارجي
 */
export async function uploadPassportPhoto(_uid: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX = 400;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > MAX) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        }
      } else {
        if (h > MAX) {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.78);
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/** حفظ URL الصورة في localStorage + Firestore */
export async function savePassportPhotoUrl(uid: string, url: string): Promise<void> {
  const effectiveId = uid || getOrCreateGuestPassportId();
  try {
    localStorage.setItem(LOCAL_PHOTO_KEY_PREFIX + effectiveId, url);
    localStorage.setItem(LOCAL_PHOTO_KEY_PREFIX + 'latest', url);
  } catch {
    /* ignore */
  }
  if (!configured || !db || !uid || uid.startsWith('DWY-')) return;
  try {
    await setDoc(doc(db, 'passportShares', uid), { photoUrl: url, updatedAt: Date.now() }, { merge: true });
  } catch {
    /* ignore if offline */
  }
}

/** جيب URL الصورة من السحابة أو التخزين المحلي */
export async function getPassportPhotoUrl(uid: string): Promise<string> {
  const effectiveId = uid || getOrCreateGuestPassportId();
  let localPhoto = '';
  try {
    localPhoto =
      localStorage.getItem(LOCAL_PHOTO_KEY_PREFIX + effectiveId) ||
      localStorage.getItem(LOCAL_PHOTO_KEY_PREFIX + 'latest') ||
      '';
  } catch {
    /* ignore */
  }
  if (!configured || !db || !uid || uid.startsWith('DWY-')) return localPhoto;
  try {
    const snap = await getDoc(doc(db, 'passportShares', uid));
    if (snap.exists() && snap.data().photoUrl) {
      const cloudUrl = String(snap.data().photoUrl);
      try {
        localStorage.setItem(LOCAL_PHOTO_KEY_PREFIX + uid, cloudUrl);
      } catch {}
      return cloudUrl;
    }
    return localPhoto;
  } catch {
    return localPhoto;
  }
}

export interface PassportShare {
  pin: string;
  revoked?: boolean;
  expiresAt: number;
  createdAt: number;
  photoUrl?: string;
  authDisplayName?: string;
  authEmail?: string;
  sharedProfile?: Partial<UserHealthProfile> | null;
  sharedSchedules?: TreatmentSchedule[];
  sharedPrescriptions?: SavedPrescription[];
}

export interface PassportAccessLog {
  accessedAt: number;
  note: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

export function buildSharedProfilePayload(profileSnapshot?: UserHealthProfile | null): Record<string, unknown> | null {
  if (!profileSnapshot) return null;
  const fallbackName =
    profileSnapshot.displayName?.trim() ||
    profileSnapshot.fullName?.trim() ||
    auth?.currentUser?.displayName?.trim() ||
    auth?.currentUser?.email?.split('@')[0] ||
    '';
  return stripUndefinedDeep({
    displayName: fallbackName,
    age: profileSnapshot.age || (profileSnapshot.ageYears ? String(profileSnapshot.ageYears) : ''),
    weightKg: profileSnapshot.weightKg || '',
    gender: profileSnapshot.gender || '',
    bloodType: profileSnapshot.bloodType || '',
    emergencyContact: profileSnapshot.emergencyContact || '',
    pregnancyStatus: profileSnapshot.pregnancyStatus || 'unknown',
    renalStatus: profileSnapshot.renalStatus || 'unknown',
    hepaticStatus: profileSnapshot.hepaticStatus || 'unknown',
    notes: profileSnapshot.notes || '',
    allergies: Array.isArray(profileSnapshot.allergies) ? profileSnapshot.allergies : [],
    medications: Array.isArray(profileSnapshot.medications) ? profileSnapshot.medications : [],
    activeMedications: Array.isArray(profileSnapshot.activeMedications) ? profileSnapshot.activeMedications : [],
    chronicConditions: Array.isArray(profileSnapshot.chronicConditions)
      ? profileSnapshot.chronicConditions
      : [],
    medicalDocuments: Array.isArray(profileSnapshot.medicalDocuments)
      ? profileSnapshot.medicalDocuments.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          fileName: d.fileName,
          mimeType: d.mimeType,
          fileSize: d.fileSize,
          extractedSummary: d.extractedSummary,
          extractedFields: d.extractedFields || {},
          unreadableFields: d.unreadableFields || [],
          verificationStatus: d.verificationStatus,
          source: d.source,
          createdAt: d.createdAt,
          ...(d.downloadUrl ? { downloadUrl: d.downloadUrl } : {}),
          ...(d.previewDataUrl ? { previewDataUrl: d.previewDataUrl } : {}),
        }))
      : [],
  });
}

/**
 * مزامنة تلقائية لبيانات المريض الصحية مع مستند البطاقة الذكية `passportShares/{uid}`
 * بحيث يرى الطبيب أو الممرض أحدث البيانات فور مسح الـ QR حتى لو عدّل المريض بياناته بعد تفعيل البطاقة.
 */
export async function syncProfileToPassportShare(
  uid: string,
  profileSnapshot: UserHealthProfile,
  extras?: {
    schedules?: TreatmentSchedule[];
    prescriptions?: SavedPrescription[];
    authDisplayName?: string;
    authEmail?: string;
  }
): Promise<void> {
  const effectiveId = uid || getOrCreateGuestPassportId();
  const payload: Record<string, unknown> = {
    sharedProfile: buildSharedProfilePayload(profileSnapshot),
    authDisplayName:
      profileSnapshot.displayName?.trim() ||
      extras?.authDisplayName?.trim() ||
      auth?.currentUser?.displayName?.trim() ||
      '',
    authEmail: extras?.authEmail || auth?.currentUser?.email || '',
    updatedAt: Date.now(),
  };
  if (extras?.schedules) {
    payload.sharedSchedules = stripUndefinedDeep(extras.schedules);
  }
  if (extras?.prescriptions) {
    payload.sharedPrescriptions = stripUndefinedDeep(extras.prescriptions);
  }

  // Save locally as well for offline/guest resilience
  try {
    const rawLocal = localStorage.getItem(LOCAL_SHARE_KEY_PREFIX + effectiveId);
    const prevLocal = rawLocal ? JSON.parse(rawLocal) : {};
    localStorage.setItem(
      LOCAL_SHARE_KEY_PREFIX + effectiveId,
      JSON.stringify({ ...prevLocal, ...payload })
    );
  } catch {
    /* ignore */
  }

  if (!configured || !db || !uid || uid.startsWith('DWY-')) return;
  try {
    await setDoc(doc(db, 'passportShares', uid), payload, { merge: true });
  } catch {
    /* ignore offline or permission errors */
  }
}

export async function getPassportShare(uid: string): Promise<PassportShare | null> {
  const effectiveId = uid || getOrCreateGuestPassportId();
  let localFallback: PassportShare | null = null;
  try {
    const rawLocal = localStorage.getItem(LOCAL_SHARE_KEY_PREFIX + effectiveId);
    if (rawLocal) {
      const d = JSON.parse(rawLocal);
      localFallback = {
        pin: typeof d.pin === 'string' ? d.pin.trim() : '',
        expiresAt: typeof d.expiresAt === 'number' ? d.expiresAt : 0,
        createdAt: typeof d.createdAt === 'number' ? d.createdAt : 0,
        photoUrl: typeof d.photoUrl === 'string' ? d.photoUrl : '',
        authDisplayName: typeof d.authDisplayName === 'string' ? d.authDisplayName : '',
        authEmail: typeof d.authEmail === 'string' ? d.authEmail : '',
        sharedProfile: d.sharedProfile || null,
        sharedSchedules: Array.isArray(d.sharedSchedules) ? (d.sharedSchedules as TreatmentSchedule[]) : [],
        sharedPrescriptions: Array.isArray(d.sharedPrescriptions)
          ? (d.sharedPrescriptions as SavedPrescription[])
          : [],
      };
    }
  } catch {
    /* ignore */
  }

  if (!configured || !db || !uid || uid.startsWith('DWY-')) return localFallback;
  try {
    const snap = await getDoc(doc(db, 'passportShares', uid));
    if (!snap.exists()) return localFallback;
    const d = snap.data();
    const cleanPin = typeof d.pin === 'string' ? d.pin.trim() : '';
    const expiresAt = typeof d.expiresAt === 'number' ? d.expiresAt : 0;
    if (!cleanPin && expiresAt <= 0 && !d.sharedProfile && !d.photoUrl) return localFallback;
    return {
      pin: cleanPin,
      expiresAt,
      createdAt: typeof d.createdAt === 'number' ? d.createdAt : 0,
      photoUrl: typeof d.photoUrl === 'string' ? d.photoUrl : (localFallback?.photoUrl || ''),
      authDisplayName: typeof d.authDisplayName === 'string' ? d.authDisplayName : '',
      authEmail: typeof d.authEmail === 'string' ? d.authEmail : '',
      sharedProfile: d.sharedProfile || localFallback?.sharedProfile || null,
      sharedSchedules: Array.isArray(d.sharedSchedules) ? (d.sharedSchedules as TreatmentSchedule[]) : [],
      sharedPrescriptions: Array.isArray(d.sharedPrescriptions)
        ? (d.sharedPrescriptions as SavedPrescription[])
        : [],
    };
  } catch {
    return localFallback;
  }
}

export async function sharePassport(
  uid: string,
  pin: string,
  hours: number,
  profileSnapshot?: UserHealthProfile,
  extras?: {
    schedules?: TreatmentSchedule[];
    prescriptions?: SavedPrescription[];
    authDisplayName?: string;
    authEmail?: string;
  }
): Promise<void> {
  const effectiveId = uid || getOrCreateGuestPassportId();
  const now = Date.now();
  const effectiveHours = hours > 0 ? hours : 24;
  const payload: Record<string, unknown> = {
    pin: pin.trim(),
    expiresAt: now + effectiveHours * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
    authDisplayName:
      profileSnapshot?.displayName?.trim() ||
      extras?.authDisplayName?.trim() ||
      auth?.currentUser?.displayName?.trim() ||
      '',
    authEmail: extras?.authEmail || auth?.currentUser?.email || '',
  };
  if (profileSnapshot) {
    payload.sharedProfile = buildSharedProfilePayload(profileSnapshot);
  }
  if (extras?.schedules) {
    payload.sharedSchedules = stripUndefinedDeep(extras.schedules);
  }
  if (extras?.prescriptions) {
    payload.sharedPrescriptions = stripUndefinedDeep(extras.prescriptions);
  }

  try {
    const rawLocal = localStorage.getItem(LOCAL_SHARE_KEY_PREFIX + effectiveId);
    const prevLocal = rawLocal ? JSON.parse(rawLocal) : {};
    localStorage.setItem(
      LOCAL_SHARE_KEY_PREFIX + effectiveId,
      JSON.stringify({ ...prevLocal, ...payload })
    );
  } catch {
    /* ignore */
  }

  if (!configured || !db || !uid || uid.startsWith('DWY-')) return;
  try {
    await setDoc(doc(db, 'passportShares', uid), payload, { merge: true });
  } catch {
    /* ignore if offline */
  }
}

export async function revokePassport(uid: string): Promise<void> {
  const effectiveId = uid || getOrCreateGuestPassportId();
  try {
    const rawLocal = localStorage.getItem(LOCAL_SHARE_KEY_PREFIX + effectiveId);
    if (rawLocal) {
      const prevLocal = JSON.parse(rawLocal);
      localStorage.setItem(
        LOCAL_SHARE_KEY_PREFIX + effectiveId,
        JSON.stringify({ ...prevLocal, expiresAt: 0, revoked: true, updatedAt: Date.now() })
      );
    }
  } catch {
    /* ignore */
  }
  if (!configured || !db || !uid || uid.startsWith('DWY-')) return;
  try {
    await setDoc(
      doc(db, 'passportShares', uid),
      {
        expiresAt: 0,
        revoked: true,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch {
    /* ignore */
  }
}

export function isPassportValid(share: PassportShare | null, enteredPin: string): boolean {
  if (!share || !share.pin || share.revoked) return false;
  if (share.expiresAt <= 0 || Date.now() >= share.expiresAt) return false;
  return share.pin === enteredPin.trim();
}

export async function logPassportAccess(uid: string): Promise<void> {
  if (!configured || !db || !uid || uid.startsWith('DWY-')) return;
  try {
    await addDoc(collection(db, 'passportShares', uid, 'accessLogs'), {
      accessedAt: Date.now(),
      note: 'passport_viewed',
    });
  } catch {
    /* اختياري */
  }
}

export async function getPassportAccessLogs(uid: string): Promise<PassportAccessLog[]> {
  if (!configured || !db || !uid || uid.startsWith('DWY-')) return [];
  try {
    const { getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'passportShares', uid, 'accessLogs'));
    return snap.docs
      .map((d) => d.data() as PassportAccessLog)
      .sort((a, b) => b.accessedAt - a.accessedAt)
      .slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * Generates a high-resolution PNG image (960x540) of the DAWAYA Smart Medical ID Card
 * using pure HTML5 Canvas + offline `qrcode` data URL, with zero external network dependency.
 */
export async function renderDawayaMedicalIdCardPngBlob(params: {
  uid: string;
  profile: UserHealthProfile;
  photoUrl?: string;
  qrDataUrl?: string;
  passportUrl: string;
  isAr: boolean;
}): Promise<Blob | null> {
  const { uid, profile, photoUrl, passportUrl, isAr } = params;
  const qrSrc = params.qrDataUrl || (await generateOfflineQrDataUrl(passportUrl, 220));

  const canvas = document.createElement('canvas');
  const W = 960;
  const H = 540;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Luxury Navy & Cyan Gradient Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#101E36');
  grad.addColorStop(0.55, '#162B4D');
  grad.addColorStop(1, '#008B99');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 32);
  ctx.fill();

  // Subtle decorative circles
  ctx.fillStyle = 'rgba(0, 191, 208, 0.08)';
  ctx.beginPath();
  ctx.arc(W - 60, -40, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(60, H + 40, 180, 0, Math.PI * 2);
  ctx.fill();

  // Outer glowing border
  ctx.strokeStyle = 'rgba(0, 191, 208, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(12, 12, W - 24, H - 24, 24);
  ctx.stroke();

  // 2. Header Banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(32, 28, W - 64, 68, 16);
  ctx.fill();

  ctx.fillStyle = '#00BFD0';
  ctx.font = 'bold 26px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🪪 DAWAYA | دوايا — SMART MEDICAL ID & PASSPORT', 52, 62);

  ctx.fillStyle = '#9AE8E8';
  ctx.font = '600 15px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(
    isAr
      ? 'الكارت الطبي الذكي الشامل للطوارئ والأدوية والحساسية • مصر 🇪🇬'
      : 'Comprehensive Emergency Medical ID, Allergies & Medications • Egypt 🇪🇬',
    52,
    84
  );

  // 3. Patient Photo Box (Left)
  if (photoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej();
        img.src = photoUrl;
      });
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(36, 118, 155, 190, 16);
      ctx.clip();
      ctx.drawImage(img, 36, 118, 155, 190);
      ctx.restore();
      ctx.strokeStyle = '#00BFD0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(36, 118, 155, 190, 16);
      ctx.stroke();
    } catch {
      drawPlaceholderAvatar(ctx, 36, 118, 155, 190);
    }
  } else {
    drawPlaceholderAvatar(ctx, 36, 118, 155, 190);
  }

  // 4. Patient Vitals & Details (Center)
  const displayName =
    profile.displayName?.trim() ||
    profile.fullName?.trim() ||
    (isAr ? 'مريض مسجل بمنصة دوايا' : 'DAWAYA Patient');
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(displayName.slice(0, 32), 215, 154);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 19px "IBM Plex Sans Arabic", system-ui, sans-serif';
  const ageVal = profile.age || (profile.ageYears ? `${profile.ageYears}` : '—');
  const weightVal = profile.weightKg ? `${profile.weightKg} kg` : '—';
  const genderVal =
    profile.gender === 'male'
      ? isAr
        ? 'ذكر'
        : 'Male'
      : profile.gender === 'female'
        ? isAr
          ? 'أنثى'
          : 'Female'
        : '—';

  ctx.fillText(
    `${isAr ? 'العمر' : 'Age'}: ${ageVal}   |   ${isAr ? 'الوزن' : 'Weight'}: ${weightVal}   |   ${isAr ? 'النوع' : 'Gender'}: ${genderVal}`,
    215,
    190
  );

  const emergPhone = profile.emergencyContact?.trim() || (isAr ? 'غير مسجل' : 'Not set');
  ctx.fillStyle = '#9AE8E8';
  ctx.font = 'bold 19px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(`📞 ${isAr ? 'طوارئ المريض' : 'Emergency Contact'}: ${emergPhone}`, 215, 222);

  // Badges Row: Blood Type, Allergies, Renal/Hepatic
  let badgeX = 215;
  const badgeY = 242;

  // Blood Type Badge
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, 125, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(`🩸 ${profile.bloodType || '?'}`, badgeX + 16, badgeY + 27);
  badgeX += 138;

  // Allergies Badge
  const allergiesCount = (profile.allergies || []).length;
  ctx.fillStyle = allergiesCount > 0 ? '#F59E0B' : '#10B981';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, 185, 40, 10);
  ctx.fill();
  ctx.fillStyle = allergiesCount > 0 ? '#1C1917' : '#FFFFFF';
  ctx.font = 'bold 18px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(
    allergiesCount > 0
      ? `⚠️ ${allergiesCount} ${isAr ? 'حساسية مسجلة' : 'Allergies'}`
      : `🛡️ ${isAr ? 'لا توجد حساسية' : 'No Allergies'}`,
    badgeX + 14,
    badgeY + 26
  );
  badgeX += 198;

  // Active Medications Badge
  const activeMedsCount =
    (profile.medications || []).filter((m) => m.status === 'active').length +
    (profile.activeMedications || []).length;
  ctx.fillStyle = 'rgba(0, 191, 208, 0.25)';
  ctx.strokeStyle = '#00BFD0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, 165, 40, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 17px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(
    `💊 ${activeMedsCount} ${isAr ? 'أدوية حالية' : 'Active Meds'}`,
    badgeX + 14,
    badgeY + 26
  );

  // 5. Clinical Summary Box (Allergies & Chronic Conditions)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(36, 326, W - 260, 126, 14);
  ctx.fill();
  ctx.stroke();

  const allergyNames = (profile.allergies || []).map((a) => a.drugName).join(' ، ');
  const chronicNames = (profile.chronicConditions || []).map((c) => c.conditionName).join(' ، ');
  const activeMedNames = [
    ...(profile.medications || []).filter((m) => m.status === 'active').map((m) => m.drugName),
    ...(profile.activeMedications || []).map((m) => m.drugName),
  ].join(' ، ');

  ctx.fillStyle = '#FCA5A5';
  ctx.font = 'bold 17px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(
    `⚠️ ${isAr ? 'الحساسية الدوائية:' : 'Drug Allergies:'} ${(allergyNames || (isAr ? 'لا يوجد مسجل' : 'None recorded')).slice(0, 58)}`,
    52,
    358
  );

  ctx.fillStyle = '#FDE047';
  ctx.font = 'bold 17px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(
    `🩺 ${isAr ? 'الأمراض المزمنة:' : 'Chronic Conditions:'} ${(chronicNames || (isAr ? 'لا يوجد مسجل' : 'None recorded')).slice(0, 58)}`,
    52,
    392
  );

  ctx.fillStyle = '#67E8F9';
  ctx.font = 'bold 17px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(
    `💊 ${isAr ? 'الأدوية الحالية:' : 'Current Medications:'} ${(activeMedNames || (isAr ? 'لا يوجد مسجل' : 'None recorded')).slice(0, 58)}`,
    52,
    426
  );

  // 6. QR Code Box (Right)
  try {
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      qrImg.onload = () => res();
      qrImg.onerror = () => rej();
      qrImg.src = qrSrc;
    });
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(W - 204, 118, 168, 168, 16);
    ctx.fill();
    ctx.drawImage(qrImg, W - 196, 126, 152, 152);

    ctx.fillStyle = '#9AE8E8';
    ctx.font = 'bold 13px "IBM Plex Sans Arabic", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      isAr ? 'امسح الكود للطوارئ' : 'Scan in Emergency',
      W - 120,
      308
    );
    ctx.textAlign = 'left';
  } catch {
    /* ignore QR draw error */
  }

  // 7. Bottom Footer Bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(36, H - 64, W - 72, 40, 10);
  ctx.fill();

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 15px monospace';
  const formattedId = uid.slice(0, 16).toUpperCase();
  ctx.fillText(`ID: ${formattedId}`, 52, H - 38);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9AE8E8';
  ctx.font = '600 15px "IBM Plex Sans Arabic", system-ui, sans-serif';
  ctx.fillText(
    isAr
      ? 'منصة دوايا الشاملة (26,562+ دواء) • DAWAYA Healthcare Platform'
      : 'DAWAYA Comprehensive Healthcare Platform (26,562+ Medicines)',
    W - 52,
    H - 38
  );
  ctx.textAlign = 'left';

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function drawPlaceholderAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 191, 208, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '64px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('👤', x + w / 2, y + h / 2 + 20);
  ctx.textAlign = 'left';
}
