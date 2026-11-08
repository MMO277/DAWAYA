/**
 * SmartPassport.tsx
 * DAWAYA | دوايا — الكارت الطبي الذكي الشامل (Smart Medical ID & Emergency Passport)
 * - يعمل للزوار (محلياً مع QR ذكي مشفر للطوارئ) وللمسجلين (مزامنة سحابية عبر Firebase مع PIN)
 * - يعرض الكارت الطبي بتصميم DAWAYA الفاخر مع QR يعمل أوفلاين وأونلاين
 * - يدعم طباعة الكارت الطبي مباشرة (`window.print()`) وتنزيله كصورة PNG عالية الدقة ومشاركته
 * - يدمج جميع الأدوية الحالية (من قاعدة 26,562+ دواء)، الحساسية الدوائية، الأمراض المزمنة، وفصيلة الدم
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { useSyncedHealthProfile, syncNotesWithChronicConditions } from './allergyData';
import { useSyncedSchedules } from './trackerData';
import {
  getPassportShare,
  sharePassport,
  revokePassport,
  getPassportAccessLogs,
  uploadPassportPhoto,
  savePassportPhotoUrl,
  getPassportPhotoUrl,
  getOrCreateGuestPassportId,
  buildPassportUrl,
  generateOfflineQrDataUrl,
  renderDawayaMedicalIdCardPngBlob,
  PassportShare,
  PassportAccessLog,
} from './passportService';

// ── البطاقة المرئية (DAWAYA Smart Medical ID Card) ─────────────────────────
export function DawayaPassportCardUI({
  name,
  age,
  weightKg,
  bloodType,
  gender,
  emergencyContact,
  photoUrl,
  uid,
  qrDataUrl,
  isAr,
  allergiesCount,
  medsCount,
  chronicCount,
  onPhotoClick,
  photoLoading,
}: {
  name: string;
  age: string;
  weightKg?: string;
  bloodType: string;
  gender: string;
  emergencyContact?: string;
  photoUrl: string;
  uid: string;
  qrDataUrl: string;
  isAr: boolean;
  allergiesCount: number;
  medsCount: number;
  chronicCount: number;
  onPhotoClick?: () => void;
  photoLoading?: boolean;
}) {
  const genderLabel =
    gender === 'male'
      ? isAr
        ? 'ذكر'
        : 'Male'
      : gender === 'female'
        ? isAr
          ? 'أنثى'
          : 'Female'
        : gender || '—';

  return (
    <div
      id="passport-card"
      className="printable-medical-id-card"
      style={{
        background: 'linear-gradient(135deg, #0D1F38 0%, #152E52 55%, #138866 100%)',
        borderRadius: 22,
        padding: '22px 20px 18px',
        color: '#fff',
        maxWidth: 460,
        width: '100%',
        margin: '0 auto',
        boxShadow: '0 14px 42px rgba(16, 30, 54, 0.38)',
        border: '2px solid #CFD29D',
        position: 'relative',
        overflow: 'hidden',
        direction: 'ltr',
        fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif',
      }}
    >
      {/* زخارف خلفية */}
      <div
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(0, 191, 208, 0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.04)',
          pointerEvents: 'none',
        }}
      />

      {/* هيدر الكارت بهوية دوايا الشاملة */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: '1px solid rgba(154, 232, 232, 0.22)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(0, 191, 208, 0.2)',
            border: '1.5px solid #138866',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            flexShrink: 0,
          }}
        >
          🪪
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: '0.98rem', color: '#FFFFFF', letterSpacing: 0.3 }}>
            DAWAYA | دوايا
          </div>
          <div style={{ fontSize: '0.64rem', color: '#9AE8E8', fontWeight: 700, letterSpacing: 0.8 }}>
            SMART MEDICAL ID & EMERGENCY PASSPORT
          </div>
        </div>
        <div style={{ marginInlineStart: 'auto', textAlign: 'right' }}>
          <span
            style={{
              background: 'rgba(0, 191, 208, 0.18)',
              border: '1px solid rgba(154, 232, 232, 0.35)',
              borderRadius: 999,
              padding: '3px 9px',
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#9AE8E8',
            }}
          >
            🇪🇬 EGYPT
          </span>
        </div>
      </div>

      {/* صورة + بيانات + QR */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap' }}>
        {/* صورة المريض */}
        <div
          onClick={onPhotoClick}
          title={isAr ? 'اضغط لتغيير الصورة الشخصية' : 'Tap to change photo'}
          style={{
            width: 82,
            height: 98,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.12)',
            border: '2px solid #138866',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: onPhotoClick ? 'pointer' : 'default',
          }}
        >
          {photoLoading ? (
            <span style={{ fontSize: '1.6rem' }}>⏳</span>
          ) : photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              crossOrigin="anonymous"
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 4 }}>
              <div style={{ fontSize: '2.1rem', lineHeight: 1 }}>👤</div>
              {onPhotoClick && (
                <div style={{ fontSize: '0.52rem', color: '#9AE8E8', marginTop: 4 }}>
                  {isAr ? 'إضافة صورة' : 'Add Photo'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* بيانات المريض الحيوية */}
        <div style={{ flex: '1 1 150px', minWidth: 0 }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: '1.08rem',
              marginBottom: 5,
              lineHeight: 1.25,
              color: '#FFFFFF',
              wordBreak: 'break-word',
            }}
          >
            {name || (isAr ? 'مريض دوايا (اضغط لتسجيل الاسم)' : 'Patient Name')}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#E2E8F0', marginBottom: 3 }}>
            {isAr ? 'العمر:' : 'Age:'} <strong>{age || '—'}</strong>
            {weightKg ? (
              <>
                {' '}
                • {isAr ? 'الوزن:' : 'Wt:'} <strong>{weightKg} kg</strong>
              </>
            ) : null}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#E2E8F0', marginBottom: 4 }}>
            {isAr ? 'النوع:' : 'Gender:'} <strong>{genderLabel}</strong>
          </div>
          {emergencyContact && (
            <div style={{ fontSize: '0.74rem', color: '#9AE8E8', marginBottom: 7, fontWeight: 700 }}>
              📞 {isAr ? 'طوارئ:' : 'SOS:'} <strong>{emergencyContact}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                background: '#EF4444',
                borderRadius: 7,
                padding: '3px 9px',
                fontSize: '0.76rem',
                fontWeight: 800,
              }}
            >
              🩸 {bloodType || '?'}
            </span>
            <span
              style={{
                background: allergiesCount > 0 ? '#F59E0B' : '#10B981',
                color: allergiesCount > 0 ? '#1C1917' : '#FFFFFF',
                borderRadius: 7,
                padding: '3px 9px',
                fontSize: '0.73rem',
                fontWeight: 800,
              }}
            >
              {allergiesCount > 0
                ? `⚠️ ${allergiesCount} ${isAr ? 'حساسية' : 'Allerg.'}`
                : `🛡️ ${isAr ? 'آمن' : 'No Allerg.'}`}
            </span>
            {chronicCount > 0 && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#FDE047',
                  borderRadius: 7,
                  padding: '3px 9px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                🩺 {chronicCount} {isAr ? 'مزمن' : 'Chronic'}
              </span>
            )}
          </div>
        </div>

        {/* رمز QR الذكي */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            padding: 5,
            width: 82,
            height: 82,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Medical ID QR"
              style={{ width: 72, height: 72, display: 'block' }}
            />
          ) : (
            <span style={{ color: '#101E36', fontSize: '0.7rem', fontWeight: 700 }}>QR</span>
          )}
        </div>
      </div>

      {/* شريط سفلي */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.2)',
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.68rem',
        }}
      >
        <div style={{ opacity: 0.8, fontFamily: 'monospace', letterSpacing: 1.2, color: '#9AE8E8' }}>
          ID: {uid.slice(0, 16).toUpperCase()}
        </div>
        <div style={{ fontWeight: 800, color: '#FFFFFF' }}>
          💊 {medsCount} {isAr ? 'أدوية مسجلة' : 'Active Meds'}
        </div>
      </div>
    </div>
  );
}

// ── الصفحة الرئيسية للكارت الطبي الذكي ────────────────────────────────────────
export default function SmartPassport() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user, openAuthModal } = useAuth();
  const { profile, setProfile } = useSyncedHealthProfile();
  const { schedules, prescriptions } = useSyncedSchedules();

  const effectiveUid = user?.uid || getOrCreateGuestPassportId();

  const [share, setShare] = useState<PassportShare | null>(null);
  const [loadingShare, setLoadingShare] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [hours, setHours] = useState(24);
  const [sharing, setSharing] = useState(false);
  const [logs, setLogs] = useState<PassportAccessLog[]>([]);
  const [chronicInput, setChronicInput] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [statusToast, setStatusToast] = useState('');
  const [tab, setTab] = useState<'card' | 'share' | 'health'>('card');

  const fileRef = useRef<HTMLInputElement>(null);

  const passportUrl = buildPassportUrl(effectiveUid, profile, share?.pin || pin);

  useEffect(() => {
    let active = true;
    generateOfflineQrDataUrl(passportUrl, 240).then((url) => {
      if (active) setQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [passportUrl]);

  // استخراج الأمراض المزمنة
  const chronicList: string[] = (() => {
    if (profile.chronicConditions && profile.chronicConditions.length > 0) {
      return profile.chronicConditions.map((c) => c.conditionName);
    }
    try {
      const n = profile.notes || '';
      const idx = n.indexOf('CHRONIC:');
      if (idx === -1) return [];
      return JSON.parse(n.slice(idx + 8).split('||')[0]);
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    setLoadingShare(true);
    Promise.all([
      getPassportShare(effectiveUid),
      getPassportPhotoUrl(effectiveUid),
      getPassportAccessLogs(effectiveUid),
    ]).then(([s, photo, lg]) => {
      setShare(s);
      if (s?.pin) setPin(s.pin);
      setPhotoUrl(photo || s?.photoUrl || '');
      setLogs(lg);
      setLoadingShare(false);
    });
  }, [effectiveUid]);

  const handlePhoto = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPhotoLoading(true);
      try {
        const url = await uploadPassportPhoto(effectiveUid, file);
        await savePassportPhotoUrl(effectiveUid, url);
        setPhotoUrl(url);
        setStatusToast(
          isAr ? '✅ تم تحديث صورتك على الكارت الطبي!' : '✅ Photo updated on your Medical ID!'
        );
        setTimeout(() => setStatusToast(''), 3500);
      } catch {
        setStatusToast(isAr ? '⚠️ تعذر قراءة الصورة، جرب صورة أخرى.' : '⚠️ Failed to process photo.');
        setTimeout(() => setStatusToast(''), 3500);
      } finally {
        setPhotoLoading(false);
      }
    },
    [effectiveUid, isAr]
  );

  const addChronic = () => {
    const cleanName = chronicInput.trim();
    if (!cleanName) return;
    setProfile((p) => {
      const existing = p.chronicConditions || [];
      if (existing.some((c) => c.conditionName.toLowerCase() === cleanName.toLowerCase())) {
        return p;
      }
      const nextChronics = [
        {
          id: `cond-${Date.now()}`,
          conditionName: cleanName,
          evidenceStatus: 'patient_reported' as const,
          source: 'manual_entry' as const,
          createdAt: new Date().toISOString(),
        },
        ...existing,
      ];
      return {
        ...p,
        chronicConditions: nextChronics,
        notes: syncNotesWithChronicConditions(p.notes || '', nextChronics),
      };
    });
    setChronicInput('');
  };

  const removeChronic = (idx: number) => {
    setProfile((p) => {
      const targetName = chronicList[idx];
      const nextChronics = (p.chronicConditions || []).filter((c, i) =>
        targetName ? c.conditionName !== targetName : i !== idx
      );
      return {
        ...p,
        chronicConditions: nextChronics,
        notes: syncNotesWithChronicConditions(p.notes || '', nextChronics),
      };
    });
  };

  const handleShare = async () => {
    if (pin.length < 4) return;
    setSharing(true);
    await sharePassport(effectiveUid, pin, hours, profile, {
      schedules,
      prescriptions,
      authDisplayName: user?.displayName || profile.displayName || '',
      authEmail: user?.email || '',
    });
    const s = await getPassportShare(effectiveUid);
    setShare(s);
    setSharing(false);
    setStatusToast(
      isAr
        ? '✅ تم تفعيل مشاركة الكارت الطبي والـ QR بنجاح!'
        : '✅ Medical ID & QR sharing activated!'
    );
    setTimeout(() => setStatusToast(''), 3500);
  };

  const handleRevoke = async () => {
    await revokePassport(effectiveUid);
    setShare(null);
    setStatusToast(isAr ? '🔒 تم إيقاف مشاركة الكارت الطبي.' : '🔒 Medical ID sharing stopped.');
    setTimeout(() => setStatusToast(''), 3000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await renderDawayaMedicalIdCardPngBlob({
        uid: effectiveUid,
        profile,
        photoUrl,
        qrDataUrl,
        passportUrl,
        isAr,
      });
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DAWAYA-Medical-ID-${(profile.displayName || effectiveUid).slice(0, 12)}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusToast(
          isAr ? '✅ تم تنزيل الكارت الطبي كصورة PNG عالية الدقة!' : '✅ Medical ID downloaded as HD PNG!'
        );
        setTimeout(() => setStatusToast(''), 3500);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyOrShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isAr ? 'الكارت الطبي الذكي — دوايا | DAWAYA' : 'DAWAYA Smart Medical ID',
          text: isAr
            ? 'كارت الطوارئ والملف الدوائي والحساسية على منصة دوايا'
            : 'My DAWAYA Smart Medical ID & Allergy Passport',
          url: passportUrl,
        });
        return;
      } catch {
        /* fallback to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(passportUrl);
      setStatusToast(isAr ? '✅ تم نسخ رابط الكارت الطبي!' : '✅ Medical ID link copied!');
      setTimeout(() => setStatusToast(''), 3000);
    } catch {
      /* ignore */
    }
  };

  const isActive = Boolean(share && share.expiresAt > 0 && Date.now() < share.expiresAt);
  const remaining = share ? Math.max(0, Math.round((share.expiresAt - Date.now()) / 60000)) : 0;

  const activeMedsCount =
    profile.medications.filter((m) => m.status === 'active').length +
    (profile.activeMedications?.length || 0) +
    schedules.length;

  const tabBtn = (t: typeof tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className="no-print"
      style={{
        flex: 1,
        padding: '10px 6px',
        background: tab === t ? '#101E36' : 'transparent',
        color: tab === t ? '#fff' : 'var(--text, #101E36)',
        border: '1.5px solid #138866',
        borderRadius: 12,
        fontWeight: 800,
        fontSize: '0.86rem',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      {label}
    </button>
  );

  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingBottom: 60 }}>
      <div className="no-print" style={{ textAlign: 'center', marginBottom: 16 }}>
        <span className="dawaya-pill-badge" style={{ marginBottom: 8 }}>
          <span>🪪</span>
          <span>
            {isAr
              ? 'منصة دوايا الشاملة (26,562+ دواء) • الكارت الطبي الذكي'
              : 'DAWAYA Comprehensive Platform • Smart Medical ID'}
          </span>
        </span>
        <h1 style={{ margin: '4px 0', color: 'var(--text, #101E36)' }}>
          🪪 {isAr ? 'الكارت الطبي الذكي وبطاقة الطوارئ (ID Card)' : 'DAWAYA Smart Medical ID & Passport'}
        </h1>
        <p className="muted small" style={{ margin: '4px auto 12px', maxWidth: 520 }}>
          {isAr
            ? 'احمل بياناتك الحيوية، فصيلة دمك، حساسيتك الدوائية، أمراضك المزمنة، وأدويتك الحالية في كارت ذكي واحد مع QR للطوارئ والعيادات.'
            : 'Carry your vitals, blood type, drug allergies, chronic conditions, and active medications in one smart card with an emergency QR code.'}
        </p>

        {!user && (
          <div
            className="card"
            style={{
              background: 'rgba(0, 191, 208, 0.1)',
              border: '1.5px solid #138866',
              padding: '10px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              textAlign: 'start',
            }}
          >
            <span className="small" style={{ fontWeight: 700 }}>
              💡{' '}
              {isAr
                ? 'الكارت يعمل فوراً في وضع الزائر مع QR ذكي مشفر! سجل دخولك لمزامنة الكارت سحابياً عبر جميع أجهزتك.'
                : 'Your Medical ID works immediately in Guest Mode! Sign in to sync across devices via Firebase.'}
            </span>
            <button
              type="button"
              className="btn small"
              style={{ background: '#138866', color: '#101E36', borderColor: '#138866', fontWeight: 800 }}
              onClick={() => openAuthModal('login')}
            >
              👤 {isAr ? 'تسجيل الدخول للمزامنة السحابية' : 'Sign In for Cloud Sync'}
            </button>
          </div>
        )}
      </div>

      {statusToast && (
        <div
          className="notice no-print"
          style={{
            marginBottom: 14,
            textAlign: 'center',
            fontWeight: 800,
            borderColor: '#138866',
          }}
        >
          {statusToast}
        </div>
      )}

      {/* تابز التنقل */}
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabBtn('card', isAr ? '🪪 الكارت الطبي والـ QR' : '🪪 ID Card & QR')}
        {tabBtn('health', isAr ? '🏥 بيانات الكارت والأدوية' : '🏥 Vitals & Meds')}
        {tabBtn('share', isAr ? '🔐 حماية ومشاركة الـ PIN' : '🔐 PIN & Cloud Share')}
      </div>

      {/* ── تاب الكارت الطبي ── */}
      {tab === 'card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DawayaPassportCardUI
            name={profile.displayName || profile.fullName || user?.displayName || ''}
            age={profile.age || (profile.ageYears ? String(profile.ageYears) : '')}
            weightKg={profile.weightKg}
            bloodType={profile.bloodType}
            gender={profile.gender}
            emergencyContact={profile.emergencyContact}
            photoUrl={photoUrl}
            uid={effectiveUid}
            qrDataUrl={qrDataUrl}
            isAr={isAr}
            allergiesCount={profile.allergies.length}
            medsCount={activeMedsCount}
            chronicCount={chronicList.length}
            onPhotoClick={() => fileRef.current?.click()}
            photoLoading={photoLoading}
          />

          {/* أزرار الإجراءات السريعة للكارت (صورة + تحميل PNG + طباعة + تعديل) */}
          <div
            className="no-print"
            style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button
              type="button"
              className="btn small"
              onClick={() => fileRef.current?.click()}
              disabled={photoLoading}
            >
              {photoLoading
                ? isAr
                  ? '⏳ جارٍ الرفع…'
                  : '⏳ Uploading…'
                : isAr
                  ? '📷 صورة شخصية للكارت'
                  : '📷 Upload Photo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhoto}
            />

            <button
              type="button"
              className="btn small"
              onClick={handleDownload}
              disabled={downloading}
              style={{ background: '#138866', borderColor: '#138866', color: '#101E36', fontWeight: 800 }}
            >
              {downloading
                ? isAr
                  ? '⏳ جارٍ التجهيز…'
                  : '⏳ Rendering…'
                : isAr
                  ? '⬇️ تنزيل الكارت (HD PNG)'
                  : '⬇️ Download ID (PNG)'}
            </button>

            <button
              type="button"
              className="btn small ghost"
              onClick={() => window.print()}
            >
              🖨️ {isAr ? 'طباعة الكارت الطبي' : 'Print Medical ID'}
            </button>

            <button
              type="button"
              className="btn small ghost"
              onClick={handleCopyOrShareLink}
            >
              🔗 {isAr ? 'مشاركة رابط الكارت' : 'Share Link'}
            </button>

            <Link to="/health-profile" className="btn small ghost">
              ✏️ {isAr ? 'تعديل بياناتي في ملفي الصحي' : 'Edit Full Profile'}
            </Link>
          </div>

          {/* QR كبير منفرد للمسح السريع في الطوارئ */}
          <div className="card center no-print" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontWeight: 900, color: 'var(--text, #101E36)', marginBottom: 6, fontSize: '1.05rem' }}>
              📱 {isAr ? 'رمز الـ QR الطبي للطوارئ والعيادات' : 'Emergency & Clinic Medical QR Code'}
            </div>
            <p className="small muted" style={{ margin: '0 auto 12px', maxWidth: 420 }}>
              {isAr
                ? 'يمكن للطبيب أو الصيدلي أو المسعف مسح هذا الكود بكاميرا الهاتف لعرض فصيلة دمك، حساسيتك الدوائية، وأدويتك الحالية فوراً.'
                : 'Clinicians or paramedics can scan this QR code to view your blood type, drug allergies, and active medications.'}
            </p>
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Medical Passport QR"
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 16,
                  border: '3px solid #138866',
                  background: '#fff',
                  padding: 6,
                  margin: '0 auto',
                }}
              />
            )}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: isActive ? '#d1fae5' : '#e0f2fe',
                  color: isActive ? '#065f46' : '#0369a1',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                }}
              >
                {isActive
                  ? isAr
                    ? `✅ المشاركة السحابية مفعّلة — تنتهي بعد ${remaining} دقيقة`
                    : `✅ Cloud Share Active — expires in ${remaining} min`
                  : isAr
                    ? '⚡ كود الطوارئ السريع جاهز للمسح'
                    : '⚡ Emergency Snapshot QR Ready'}
              </span>
              <Link
                to={`/passport/${encodeURIComponent(effectiveUid)}?snap=${encodeURIComponent(passportUrl.split('snap=')[1] || '')}`}
                className="btn small ghost"
              >
                👁️ {isAr ? 'معاينة صفحة الطبيب عند مسح الكود' : 'Preview Clinician View'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── تاب البيانات الصحية والأدوية ── */}
      {tab === 'health' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* البيانات الحيوية السريعة */}
          <div className="card stack">
            <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>
                👤 {isAr ? 'البيانات الحيوية المطبوعة على الكارت' : 'Card Vital Information'}
              </h3>
              <Link to="/health-profile" className="btn small">
                ✏️ {isAr ? 'تعديل من ملفي الصحي' : 'Edit in Health Profile'}
              </Link>
            </div>
            <div className="grid">
              <div>
                <label className="small muted">{isAr ? 'الاسم بالكامل' : 'Full Name'}</label>
                <input
                  value={profile.displayName || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder={isAr ? 'اكتب اسمك الثلاثي...' : 'Enter full name...'}
                />
              </div>
              <div>
                <label className="small muted">{isAr ? 'العمر' : 'Age'}</label>
                <input
                  value={profile.age || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                  placeholder={isAr ? 'مثال: 34 سنة' : 'e.g. 34 yrs'}
                />
              </div>
              <div>
                <label className="small muted">{isAr ? 'فصيلة الدم' : 'Blood Type'}</label>
                <input
                  value={profile.bloodType || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, bloodType: e.target.value }))}
                  placeholder="A+, O+, B-, AB+..."
                />
              </div>
              <div>
                <label className="small muted">{isAr ? 'رقم هاتف الطوارئ' : 'Emergency Phone'}</label>
                <input
                  value={profile.emergencyContact || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: e.target.value }))}
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* الأمراض المزمنة */}
          <div className="card">
            <h3 style={{ marginBottom: 8 }}>
              🏥 {isAr ? 'الأمراض المزمنة والحالات الصحية' : 'Chronic Conditions'}
            </h3>
            <p className="small muted" style={{ marginBottom: 12 }}>
              {isAr
                ? 'تظهر في الكارت الطبي وتُستخدم لفحص تعارضات جميع الأدوية الـ 26,562 مع حالتك الصحية'
                : 'Displayed on your Medical ID and used to check drug warnings across all 26,562 medicines'}
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                className="input"
                value={chronicInput}
                onChange={(e) => setChronicInput(e.target.value)}
                placeholder={isAr ? 'مثال: ضغط الدم، سكري النوع 2، حساسية صدر...' : 'e.g. Hypertension, Type 2 Diabetes'}
                onKeyDown={(e) => e.key === 'Enter' && addChronic()}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn" onClick={addChronic}>
                {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>
            {chronicList.length === 0 ? (
              <p className="small muted">{isAr ? 'لا توجد أمراض مزمنة مسجلة' : 'None added yet'}</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {chronicList.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    🩺 {c}
                    <button
                      type="button"
                      onClick={() => removeChronic(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#b45309',
                        fontWeight: 900,
                        padding: 0,
                        fontSize: '1rem',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* الحساسية */}
          <div className="card">
            <div className="row wrapRow" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>
                ⚠️ {isAr ? 'الحساسية الدوائية المسجلة' : 'Recorded Drug Allergies'}
              </h3>
              <Link to="/health-profile" className="btn small ghost">
                ➕ {isAr ? 'إدارة الحساسية' : 'Manage Allergies'}
              </Link>
            </div>
            {profile.allergies.length === 0 ? (
              <p className="small muted">{isAr ? 'لا توجد حساسية دوائية مسجلة' : 'No allergies recorded'}</p>
            ) : (
              profile.allergies.map((a) => (
                <div
                  key={a.id}
                  style={{
                    background: a.severity === 'life_threatening' ? '#fee2e2' : '#fff7ed',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 6,
                    borderInlineStart: `4px solid ${a.severity === 'life_threatening' ? '#ef4444' : '#f97316'}`,
                    color: '#1e293b',
                  }}
                >
                  <strong>{a.drugName}</strong>
                  <span className="small muted" style={{ marginInlineStart: 8 }}>
                    {a.severity === 'life_threatening' ? '🚨' : '⚠️'} {a.severity}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* الأدوية الحالية */}
          <div className="card">
            <div className="row wrapRow" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>
                💊 {isAr ? 'الأدوية الحالية والكورسات النشطة' : 'Current Active Medications'}
              </h3>
              <Link to="/health-profile" className="btn small ghost">
                ➕ {isAr ? 'إضافة دواء' : 'Add Medication'}
              </Link>
            </div>
            {activeMedsCount === 0 ? (
              <p className="small muted">{isAr ? 'لا توجد أدوية نشطة مسجلة' : 'No active medications'}</p>
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {profile.medications
                  .filter((m) => m.status === 'active')
                  .map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: '#f0fdf4',
                        color: '#14532d',
                        borderRadius: 8,
                        padding: '8px 12px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <strong>💊 {m.drugName}</strong>
                      <span className="small" style={{ marginInlineStart: 8 }}>
                        {m.prescribedDose} — {m.frequency}
                      </span>
                    </div>
                  ))}
                {(profile.activeMedications || []).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: '#f0fdf4',
                      color: '#14532d',
                      borderRadius: 8,
                      padding: '8px 12px',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <strong>💊 {m.drugName}</strong>
                    {m.doseOrStrength && (
                      <span className="small" style={{ marginInlineStart: 8 }}>
                        {m.doseOrStrength}
                      </span>
                    )}
                  </div>
                ))}
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: '#f0fdfa',
                      color: '#0f766e',
                      borderRadius: 8,
                      padding: '8px 12px',
                      border: '1px solid #5eead4',
                    }}
                  >
                    <strong>⏱️ {s.medicineName}</strong>
                    <span className="small" style={{ marginInlineStart: 8 }}>
                      {s.prescribedDose} ({s.startDate} → {s.endDate})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── تاب المشاركة والحماية بـ PIN ── */}
      {tab === 'share' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loadingShare ? (
            <p className="small muted">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
          ) : isActive ? (
            <div
              style={{
                background: '#d1fae5',
                borderRadius: 12,
                padding: '16px',
                border: '1.5px solid #6ee7b7',
              }}
            >
              <div style={{ fontWeight: 800, color: '#065f46', marginBottom: 6 }}>
                ✅ {isAr ? 'المشاركة المحمية بـ PIN مفعّلة الآن' : 'PIN-Protected Sharing is Active'}
              </div>
              <div className="small" style={{ color: '#047857', marginBottom: 12 }}>
                {isAr ? `تنتهي الصلاحية بعد: ${remaining} دقيقة` : `Expires in: ${remaining} minutes`}
              </div>
              <button
                type="button"
                className="btn"
                style={{ background: '#ef4444', color: '#fff', border: 'none', width: '100%' }}
                onClick={handleRevoke}
              >
                🚫 {isAr ? 'إيقاف المشاركة فورًا' : 'Revoke Access Now'}
              </button>
            </div>
          ) : (
            <div
              style={{
                background: '#fef3c7',
                borderRadius: 10,
                padding: '12px 16px',
                border: '1px solid #fcd34d',
              }}
            >
              <div className="small" style={{ color: '#92400e', fontWeight: 700 }}>
                🔒{' '}
                {isAr
                  ? 'يمكنك تعيين رمز PIN سري (4 أرقام) لحماية ملفك الكامل عند مشاركة الكارت مع الطبيب.'
                  : 'Set a 4+ digit PIN to protect your full medical record when sharing with your doctor.'}
              </div>
            </div>
          )}

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0 }}>
              🔓 {isAr ? 'تفعيل أو تحديث رمز PIN للمشاركة الطبية' : 'Activate / Update PIN Sharing'}
            </h3>

            <div>
              <label className="small" style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>
                🔑 {isAr ? 'رمز الـ PIN (4 أرقام على الأقل)' : 'PIN (min 4 digits)'}
              </label>
              <input
                className="input"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="● ● ● ●"
                style={{ width: '100%', textAlign: 'center', fontSize: '1.25rem', letterSpacing: 6 }}
              />
            </div>

            <div>
              <label className="small" style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>
                ⏱️ {isAr ? 'مدة صلاحية الرابط الطبي' : 'Access Duration'}
              </label>
              <select
                className="input"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                <option value={1}>{isAr ? 'ساعة واحدة' : '1 Hour'}</option>
                <option value={6}>{isAr ? '6 ساعات' : '6 Hours'}</option>
                <option value={12}>{isAr ? '12 ساعة' : '12 Hours'}</option>
                <option value={24}>{isAr ? '24 ساعة (يوم كامل)' : '24 Hours'}</option>
                <option value={48}>{isAr ? '48 ساعة (يومان)' : '48 Hours'}</option>
              </select>
            </div>

            <button
              type="button"
              className="btn"
              disabled={pin.length < 4 || sharing}
              onClick={handleShare}
              style={{ background: '#138866', borderColor: '#138866', color: '#101E36', fontWeight: 900, width: '100%' }}
            >
              {sharing
                ? isAr
                  ? '⏳ جارٍ التفعيل والمزامنة…'
                  : '⏳ Activating & Syncing…'
                : isAr
                  ? '🔓 حفظ الـ PIN وتفعيل مشاركة الكارت'
                  : '🔓 Save PIN & Activate Passport'}
            </button>
          </div>

          {/* سجل الوصول */}
          {logs.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>
                📋 {isAr ? 'سجل اطلاع الأطباء على البطاقة' : 'Clinician Access Log'}
              </h3>
              {logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    background: '#f8fafc',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 6,
                    fontSize: '0.82rem',
                    color: '#475569',
                  }}
                >
                  👁️ {new Date(log.accessedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
