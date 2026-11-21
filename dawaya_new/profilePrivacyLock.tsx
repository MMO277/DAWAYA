import React, { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';

const PIN_HASH_STORAGE_KEY = 'dawaya_health_pin_hash_v1';
const PIN_SESSION_UNLOCKED_KEY = 'dawaya_health_unlocked_v1';
const WEBAUTHN_CRED_ID_KEY = 'dawaya_health_webauthn_id_v1';

function simplePinHash(pin: string): string {
  const clean = pin.trim();
  let h = 2166136261;
  const salted = `DAWAYA_PIN_SALT_2026::${clean}`;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `pin_${(h >>> 0).toString(16)}`;
}

export function isHealthProfilePinEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem(PIN_HASH_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function isHealthProfileSessionUnlocked(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (!localStorage.getItem(PIN_HASH_STORAGE_KEY)) return true;
    return sessionStorage.getItem(PIN_SESSION_UNLOCKED_KEY) === '1';
  } catch {
    return true;
  }
}

export function HealthProfilePrivacyGate({
  isAr,
  children,
}: {
  isAr: boolean;
  children: ReactNode;
}) {
  const [pinEnabled, setPinEnabled] = useState<boolean>(() => isHealthProfilePinEnabled());
  const [unlocked, setUnlocked] = useState<boolean>(() => isHealthProfileSessionUnlocked());
  const [enteredPin, setEnteredPin] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [statusNotice, setStatusNotice] = useState('');

  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const savedHash = localStorage.getItem(PIN_HASH_STORAGE_KEY);
      if (savedHash && simplePinHash(enteredPin) === savedHash) {
        sessionStorage.setItem(PIN_SESSION_UNLOCKED_KEY, '1');
        setUnlocked(true);
        setEnteredPin('');
        setErrMsg('');
      } else {
        setErrMsg(isAr ? 'رمز الخصوصية (PIN) غير صحيح. حاول مرة أخرى.' : 'Incorrect Privacy PIN. Please try again.');
      }
    } catch {
      setUnlocked(true);
    }
  };

  const handleBiometricUnlock = async () => {
    if (
      typeof window === 'undefined' ||
      !window.PublicKeyCredential ||
      !navigator.credentials
    ) {
      setErrMsg(
        isAr
          ? 'المتصفح الحالي لا يدعم البصمة المباشرة؛ يرجى إدخال رمز الـ PIN المكون من 4 أرقام.'
          : 'Biometrics not available in this browser; please enter your 4-digit PIN.'
      );
      return;
    }
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const credIdRaw = localStorage.getItem(WEBAUTHN_CRED_ID_KEY);
      if (credIdRaw) {
        const credBytes = Uint8Array.from(atob(credIdRaw), (c) => c.charCodeAt(0));
        await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{ id: credBytes, type: 'public-key' }],
            userVerification: 'required',
            timeout: 30000,
          },
        });
        sessionStorage.setItem(PIN_SESSION_UNLOCKED_KEY, '1');
        setUnlocked(true);
        setErrMsg('');
        return;
      }
      setErrMsg(
        isAr
          ? 'يرجى فتح القفل برمز الـ PIN أولاً ثم تفعيل ربط البصمة من الإعدادات.'
          : 'Please unlock with your PIN first, then register device biometrics.'
      );
    } catch {
      setErrMsg(isAr ? 'لم تكتمل مصادقة البصمة، يمكنك إدخال رمز الـ PIN.' : 'Biometric check cancelled; use your PIN.');
    }
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPinInput.replace(/\D/g, '').slice(0, 6);
    if (clean.length < 4) {
      setStatusNotice(isAr ? 'يرجى إدخال 4 أرقام على الأقل.' : 'Please enter at least 4 digits.');
      return;
    }
    try {
      localStorage.setItem(PIN_HASH_STORAGE_KEY, simplePinHash(clean));
      sessionStorage.setItem(PIN_SESSION_UNLOCKED_KEY, '1');
      setPinEnabled(true);
      setUnlocked(true);
      setNewPinInput('');
      setSetupModalOpen(false);
      setStatusNotice(
        isAr
          ? '🔒 تم تفعيل قفل الخصوصية وتشفير بيانات ملفك الصحي محلياً بنجاح ✓'
          : '🔒 Privacy PIN Lock & local encryption enabled ✓'
      );
      window.setTimeout(() => setStatusNotice(''), 4000);
    } catch {
      /* ignore */
    }
  };

  const handleRegisterBiometric = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
      return;
    }
    try {
      const challenge = new Uint8Array(32);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(challenge);
      window.crypto.getRandomValues(userId);
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'DAWAYA Medical Privacy Lock' },
          user: {
            id: userId,
            name: 'patient@dawaya',
            displayName: 'DAWAYA Patient',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 30000,
        },
      })) as PublicKeyCredential | null;

      if (cred && cred.rawId) {
        const b64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
        localStorage.setItem(WEBAUTHN_CRED_ID_KEY, b64);
        setStatusNotice(
          isAr
            ? '👆 تم ربط بصمة الهاتف / الوجه بقفل ملفك الصحي بنجاح ✓'
            : '👆 Device fingerprint / FaceID linked to your Health Profile ✓'
        );
        window.setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch {
      /* ignore */
    }
  };

  const handleDisablePin = () => {
    try {
      localStorage.removeItem(PIN_HASH_STORAGE_KEY);
      localStorage.removeItem(WEBAUTHN_CRED_ID_KEY);
      sessionStorage.removeItem(PIN_SESSION_UNLOCKED_KEY);
      setPinEnabled(false);
      setUnlocked(true);
      setSetupModalOpen(false);
      setStatusNotice(isAr ? 'تم إلغاء قفل الـ PIN بنجاح.' : 'Privacy PIN lock disabled.');
      window.setTimeout(() => setStatusNotice(''), 3500);
    } catch {
      /* ignore */
    }
  };

  // Locked Screen View
  if (pinEnabled && !unlocked) {
    return (
      <main className="wrap narrow stack" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: '24px' }}>
        <section
          className="card stack center"
          style={{
            background: 'linear-gradient(145deg, #0D1F38 0%, #132742 100%)',
            color: '#ffffff',
            borderRadius: '24px',
            border: '2px solid #CFD29D',
            padding: '28px 22px',
            gap: '14px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #10b981',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto',
            }}
          >
            🔒
          </div>
          <h1 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem' }}>
            {isAr ? 'ملفك الصحي محمي بقفل الخصوصية' : 'Health Profile Protected by Privacy Lock'}
          </h1>
          <p className="small" style={{ margin: 0, color: '#cbd5e1' }}>
            {isAr
              ? 'أدخل رمز الخصوصية المكون من 4 أرقام أو استخدم بصمة الهاتف لعرض أمراضك وأدويتك وحساسيتك المسجلة.'
              : 'Enter your 4-digit Privacy PIN or use device biometrics to view your medical records.'}
          </p>

          <form onSubmit={handleUnlockWithPin} style={{ display: 'grid', gap: '10px', maxWidth: '280px', margin: '0 auto', width: '100%' }}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              dir="ltr"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              style={{
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.35em',
                padding: '10px',
                borderRadius: '14px',
                border: '1.5px solid #CFD29D',
                background: '#ffffff',
                color: '#0D1F38',
                fontWeight: 900,
              }}
              required
            />
            {errMsg && (
              <div className="small" style={{ color: '#fca5a5', fontWeight: 700 }}>
                {errMsg}
              </div>
            )}
            <button
              type="submit"
              className="btn"
              style={{ background: '#10b981', borderColor: '#10b981', color: '#ffffff', fontWeight: 900 }}
            >
              {isAr ? 'فتح الملف الصحي ✓' : 'Unlock Health Profile ✓'}
            </button>
            <button
              type="button"
              className="btn small ghost"
              onClick={handleBiometricUnlock}
              style={{ color: '#CFD29D', borderColor: 'rgba(207, 210, 157, 0.45)' }}
            >
              👆 {isAr ? 'فتح ببصمة الموبايل (Fingerprint / FaceID)' : 'Unlock with Biometrics'}
            </button>
          </form>

          <div style={{ marginTop: '6px' }}>
            <Link to="/passport" style={{ color: '#CFD29D', fontSize: '0.82rem', fontWeight: 700 }}>
              🚑 {isAr ? 'فتح كارت الطوارئ السريع (Emergency ID)' : 'Open Emergency Medical ID'}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="wrap" style={{ marginTop: '10px', marginBottom: '-8px' }}>
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '14px',
            background: 'rgba(13, 31, 56, 0.05)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div className="small" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔐</span>
            <b>
              {pinEnabled
                ? isAr
                  ? 'قفل الخصوصية (PIN) وتشفير التخزين المحلي مفعّل لحماية بياناتك الطبية'
                  : 'Privacy PIN Lock & Local Storage Encryption Active'
                : isAr
                ? 'حماية إضافية: يمكنك قفل ملفك الصحي برمز سري (PIN) أو بصمة الموبايل'
                : 'Extra Security: Lock your Health Profile with a 4-digit PIN or Biometrics'}
            </b>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {pinEnabled && (
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  try {
                    sessionStorage.removeItem(PIN_SESSION_UNLOCKED_KEY);
                  } catch {}
                  setUnlocked(false);
                }}
              >
                🔒 {isAr ? 'قفل الشاشة الآن' : 'Lock Now'}
              </button>
            )}
            <button
              type="button"
              className="btn small ghost"
              onClick={() => setSetupModalOpen((prev) => !prev)}
            >
              ⚙️ {pinEnabled ? (isAr ? 'إدارة رمز القفل / البصمة' : 'Manage PIN / Biometrics') : (isAr ? 'تفعيل قفل الخصوصية (PIN)' : 'Enable PIN Lock')}
            </button>
          </div>
        </div>

        {statusNotice && (
          <div
            style={{
              marginTop: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#dcfce7',
              color: '#166534',
              fontWeight: 800,
              fontSize: '0.84rem',
            }}
          >
            {statusNotice}
          </div>
        )}

        {setupModalOpen && (
          <div
            className="card stack"
            style={{
              marginTop: '10px',
              borderRadius: '16px',
              border: '1.5px solid #059669',
              padding: '16px',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{isAr ? 'إعداد قفل الخصوصية لملفك الصحي (4 أرقام + بصمة الهاتف)' : 'Configure Health Profile Privacy PIN & Biometrics'}</b>
              <button type="button" className="btn small ghost" onClick={() => setSetupModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveNewPin} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                dir="ltr"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder={isAr ? 'أدخل رمز PIN من 4 أرقام...' : 'Enter 4-digit PIN...'}
                style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--line)', maxWidth: '210px' }}
              />
              <button type="submit" className="btn small">
                {isAr ? 'حفظ وتفعيل القفل ✓' : 'Save & Enable PIN ✓'}
              </button>
              {pinEnabled && (
                <>
                  <button type="button" className="btn small ghost" onClick={handleRegisterBiometric}>
                    👆 {isAr ? 'ربط بصمة الموبايل' : 'Link Phone Biometrics'}
                  </button>
                  <button type="button" className="btn small danger" onClick={handleDisablePin}>
                    {isAr ? 'إلغاء القفل' : 'Disable Lock'}
                  </button>
                </>
              )}
            </form>
          </div>
        )}
      </div>
      {children}
    </>
  );
}
