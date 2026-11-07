import { useEffect, useState } from 'react';
import { useLang } from './i18n';
import { isNativePlatform } from './nativeAlarmService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

/**
 * Dynamically resolves the correct GitHub Release APK URL whether the site is hosted
 * under `/DAWAYA/` or `/antibiotic-awareness/`, with a fallback to the official DAWAYA release.
 */
export function resolveApkDownloadUrl(): string {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname || '';
    const match = path.match(/^\/([^/]+)\//);
    const repoName = match && match[1] ? match[1] : 'DAWAYA';
    if (repoName.toLowerCase() === 'antibiotic-awareness') {
      return 'https://github.com/MMO277/antibiotic-awareness/releases/latest/download/DAWAYA.apk';
    }
    return `https://github.com/MMO277/${repoName}/releases/latest/download/DAWAYA.apk`;
  }
  return 'https://github.com/MMO277/DAWAYA/releases/latest/download/DAWAYA.apk';
}

export const APK_DIRECT_DOWNLOAD_URL = resolveApkDownloadUrl();

// Capture beforeinstallprompt globally in case it fires before React mounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

export default function InstallPrompt() {
  const { lang } = useLang();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [hidden, setHidden] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      globalDeferredPrompt = null;
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Hide inside the native Android APK or when already dismissed/installed
  if (isNativePlatform() || installed || hidden) return null;

  const ios = isIos();
  const ar = lang === 'ar';
  const apkUrl = resolveApkDownloadUrl();

  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const installPwa = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      globalDeferredPrompt = null;
      setDeferred(null);
    } else {
      setShowInstallHelp((v) => !v);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={ar ? 'تثبيت وتحميل تطبيق دوايا' : 'Install & Download DAWAYA App'}
      style={{
        position: 'fixed',
        insetInline: 12,
        bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        zIndex: 9999,
        background: 'linear-gradient(135deg, #101E36 0%, #162B4D 100%)',
        color: '#fff',
        borderRadius: 16,
        padding: '12px 14px',
        border: '1.5px solid rgba(0, 191, 208, 0.5)',
        boxShadow: '0 10px 30px rgba(0,0,0,.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 560,
        marginInline: 'auto',
        fontSize: '.88rem',
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', fontWeight: 700 }}>
          {ios
            ? (ar ? '📲 على iPhone: اضغط زر المشاركة (Share) ثم «إضافة إلى الشاشة الرئيسية».' : '📲 On iPhone: tap Share, then “Add to Home Screen”.')
            : (ar ? '📱 ثبّت تطبيق «دوايا | DAWAYA» على هاتفك للتشغيل بدون إنترنت ومنبه الجرعات:' : '📱 Install the DAWAYA App for full offline access & exact dose alarms:')}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!ios && (
            <button
              type="button"
              onClick={installPwa}
              style={{
                background: '#00BFD0',
                color: '#101E36',
                border: 'none',
                borderRadius: 10,
                padding: '8px 13px',
                fontWeight: 900,
                fontSize: '.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {ar ? '⚡ تثبيت فوري على الموبايل' : '⚡ Instant Install'}
            </button>
          )}
          {!ios && (
            <a
              href={apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowInstallHelp(true)}
              style={{
                background: 'rgba(255,255,255,0.14)',
                color: '#9AE8E8',
                border: '1px solid rgba(154,232,232,0.4)',
                textDecoration: 'none',
                borderRadius: 10,
                padding: '7px 11px',
                fontWeight: 800,
                fontSize: '.82rem',
                whiteSpace: 'nowrap',
              }}
            >
              {ar ? '📥 تحميل APK' : '📥 Download APK'}
            </a>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label={ar ? 'إغلاق' : 'Close'}
            style={{
              background: 'transparent',
              color: '#cbd5e1',
              border: 0,
              fontSize: '1.15rem',
              cursor: 'pointer',
              paddingInline: 4,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {showInstallHelp && (
        <div
          style={{
            background: 'rgba(0, 191, 208, 0.12)',
            border: '1px solid rgba(154, 232, 232, 0.3)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: '0.78rem',
            color: '#e2e8f0',
          }}
        >
          {ar ? (
            <>
              <div>✅ <b>الطريقة الأسرع (تثبيت مباشر بدون أخطاء الحماية):</b> من قائمة متصفح Chrome العلوية <b>(⋮)</b> اختر <b>«تثبيت التطبيق / Install app»</b> أو <b>«الإضافة إلى الشاشة الرئيسية»</b>.</div>
              <div style={{ marginTop: 4 }}>💡 <b>عند تثبيت ملف الـ APK:</b> إذا ظهرت رسالة <i>«التطبيق غير مثبت»</i> احذف أي نسخة قديمة من التطبيق أولاً، أو اضغط <b>«مزيد من التفاصيل ← التثبيت على أي حال»</b> في نافذة Play Protect.</div>
            </>
          ) : (
            <>
              <div>✅ <b>Fastest Install:</b> Open browser menu <b>(⋮)</b> and tap <b>“Install app”</b> or <b>“Add to Home screen”</b>.</div>
              <div style={{ marginTop: 4 }}>💡 <b>If installing APK:</b> Uninstall any older version first, or tap <b>“More details → Install anyway”</b> if Play Protect prompts.</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
