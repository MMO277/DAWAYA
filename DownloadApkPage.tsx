import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { resolveApkDownloadUrl } from './InstallPrompt';
import Disclaimer from './Disclaimer';

const RELEASES_PAGE_URL = 'https://github.com/MMO277/DAWAYA/releases/latest';

export default function DownloadApkPage() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const apkUrl = resolveApkDownloadUrl();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = isAr
      ? 'تحميل تطبيق دوايا DAWAYA APK للأندرويد آخر إصدار مجاناً | com.dawaya.health'
      : 'Download DAWAYA Android App (APK) Latest Official Version | com.dawaya.health';

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prevDesc = metaDesc?.content || '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = isAr
      ? 'حمّل تطبيق دوايا (DAWAYA) الرسمي للأندرويد بصيغة APK مجاناً برابط مباشر: موسوعة 26,597 دواء مصري بالأسعار والبدائل، فاحص التداخلات، خريطة الألم، ومنبه الجرعات بدون إنترنت.'
      : 'Download the official DAWAYA Android APK directly for free: 26,597 Egyptian medications database, generic price comparisons, interaction checker, interactive body pain map, and offline dose alarms.';

    const ldId = 'dawaya-apk-software-ldjson';
    let scriptEl = document.getElementById(ldId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = ldId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DAWAYA | دوايا',
      alternateName: 'تطبيق دوايا للأدوية والصحة',
      operatingSystem: 'Android 8.0+',
      applicationCategory: 'MedicalApplication',
      softwareVersion: '3.0.0',
      downloadUrl: apkUrl,
      installUrl: 'https://dawaya.pages.dev/download-apk',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EGP',
      },
      publisher: {
        '@type': 'Organization',
        name: 'DAWAYA Digital Healthcare Platform',
        url: 'https://dawaya.pages.dev',
      },
    });

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.content = prevDesc;
      const existing = document.getElementById(ldId);
      if (existing) existing.remove();
    };
  }, [isAr, apkUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(apkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = apkUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <main className="wrap stack" dir={isAr ? 'rtl' : 'ltr'} style={{ maxWidth: '960px', paddingTop: '18px', paddingBottom: '42px' }}>
      {/* Hero Official APK Download Card */}
      <section
        style={{
          background: 'linear-gradient(145deg, #0D1F38 0%, #102B4A 60%, #0E3A3D 100%)',
          color: '#FFFFFF',
          borderRadius: '22px',
          padding: '28px 24px',
          border: '1px solid rgba(207, 210, 157, 0.3)',
          boxShadow: '0 22px 54px rgba(13, 31, 56, 0.25)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '18px' }}>
          <div style={{ flex: '1 1 320px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(19, 136, 102, 0.28)',
                border: '1px solid rgba(36, 200, 184, 0.5)',
                color: '#99F6E4',
                fontSize: '0.74rem',
                fontWeight: 800,
                marginBottom: '10px',
              }}
            >
              <span>{tr(lang, 'الإصدار الرسمي المباشر للأندرويد • مجاني 100%', 'Official Direct Android Release • 100% Free')}</span>
            </div>

            <h1 style={{ margin: '0 0 10px', fontSize: '1.55rem', fontWeight: 900, lineHeight: 1.35, color: '#FFFFFF' }}>
              {tr(lang, 'تحميل تطبيق دوايا | DAWAYA للأندرويد (APK)', 'Download DAWAYA Android App (APK)')}
            </h1>

            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#CBD5E1', lineHeight: 1.7 }}>
              {tr(
                lang,
                'نزّل ملف التطبيق الرسمي مباشرة على هاتفك الأندرويد بدون الحاجة لمتجر Google Play. يعمل بسرعة عالية ويدعم الوضع الأوفلاين ومنبه الجرعات المحلي ومسح الباركود والروشتات.',
                'Download the official DAWAYA Android package directly without needing Google Play. Fast offline support, native local dose alarms, and barcode/Rx camera scanning.'
              )}
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <a
                href={apkUrl}
                download="DAWAYA.apk"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '13px 24px',
                  borderRadius: '14px',
                  background: '#138866',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.94rem',
                  fontWeight: 900,
                  boxShadow: '0 10px 24px rgba(19, 136, 102, 0.42)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{tr(lang, 'تحميل DAWAYA.apk الآن (مباشر)', 'Download DAWAYA.apk Now')}</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.24)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {copied
                  ? tr(lang, 'تم نسخ رابط التحميل', 'Download Link Copied')
                  : tr(lang, 'نسخ رابط التحميل للمشاركة', 'Copy Direct Link')}
              </button>

              <a
                href={RELEASES_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(207, 210, 157, 0.35)',
                  color: '#CFD29D',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {tr(lang, 'صفحة الإصدارات الرسمية', 'Official Releases Page')}
              </a>
            </div>
          </div>

          {/* Technical Package Metadata Card */}
          <div
            style={{
              flex: '0 1 250px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ fontWeight: 800, color: '#CFD29D', marginBottom: '10px', fontSize: '0.82rem' }}>
              {tr(lang, 'بيانات ملف التطبيق الرسمي', 'Official APK Metadata')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: '#94A3B8' }}>{tr(lang, 'اسم الحزمة:', 'Package ID:')}</span>
                <strong style={{ fontFamily: 'monospace', color: '#FFFFFF' }}>com.dawaya.health</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: '#94A3B8' }}>{tr(lang, 'النظام المدعوم:', 'OS Required:')}</span>
                <strong>Android 8.0+</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: '#94A3B8' }}>{tr(lang, 'التكلفة:', 'Price:')}</span>
                <strong style={{ color: '#6EE7B7' }}>{tr(lang, 'مجاني بالكامل', 'Free')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: '#94A3B8' }}>{tr(lang, 'مصدر الملف:', 'Source:')}</span>
                <strong>GitHub Releases</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Installation Guide */}
      <section className="card" style={{ padding: '20px 22px', borderTop: '3px solid #138866' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '1.08rem', fontWeight: 900, color: '#0D1F38' }}>
          {tr(lang, 'طريقة تثبيت تطبيق دوايا على الأندرويد في 3 خطوات', 'How to Install DAWAYA APK on Android in 3 Steps')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {[
            {
              step: '1',
              title: tr(lang, 'تنزيل ملف DAWAYA.apk', 'Download DAWAYA.apk'),
              desc: tr(
                lang,
                'اضغط على زر التحميل الأخضر بالأعلى وانتظر ثواني حتى يكتمل تنزيل الملف في مجلد التنزيلات (Downloads) بهاتفك.',
                'Tap the green download button above and wait a few seconds for the APK file to finish downloading.'
              ),
            },
            {
              step: '2',
              title: tr(lang, 'السماح بتثبيت التطبيقات (مرة واحدة)', 'Allow App Installation (Once)'),
              desc: tr(
                lang,
                'افتح الملف، وإذا طلب الهاتف صلاحية «التثبيت من هذا المصدر / مصادر غير معروفة» فعّل الخيار لمتصفحك ثم اضغط رجوع.',
                'Open the file. If Android prompts to allow installing apps from your browser, toggle it on once and go back.'
              ),
            },
            {
              step: '3',
              title: tr(lang, 'اضغط «تثبيت» وافتح دوايا', 'Tap Install & Open DAWAYA'),
              desc: tr(
                lang,
                'اضغط تثبيت (Install) وافتح التطبيق لتستمتع بدليل 26,597 دواء مصري، خريطة الألم، ومنبهات الجرعات المحلية.',
                'Tap Install and launch DAWAYA for the 26,597 Egyptian drug database, pain mapper, and local dose alarms.'
              ),
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '9px',
                  background: '#0D1F38',
                  color: '#CFD29D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  marginBottom: '8px',
                }}
              >
                {item.step}
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 800, color: '#0D1F38' }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Download the Native APK */}
      <section className="card" style={{ padding: '20px 22px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.05rem', fontWeight: 900, color: '#0D1F38' }}>
          {tr(lang, 'مميزات تطبيق دوايا للأندرويد', 'Why Install the DAWAYA Android App')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: '#F0FDF9', border: '1px solid rgba(19,136,102,0.28)' }}>
            <strong style={{ color: '#0D1F38', display: 'block', marginBottom: '4px' }}>
              {tr(lang, 'موسوعة 26,597 دواء مصري', '26,597 Egyptian Medications')}
            </strong>
            {tr(lang, 'الأسعار الرسمية، البدائل الأرخص المتطابقة في المادة الفعالة، وصور العبوات.', 'Official prices, bioequivalent cheaper generics, and verified packaging photos.')}
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#0D1F38', display: 'block', marginBottom: '4px' }}>
              {tr(lang, 'منبهات جرعات أصلية وتنبيهات أوفلاين', 'Native Offline Dose Alarms')}
            </strong>
            {tr(lang, 'تذكير دقيق بمواعيد أدويتك حتى بدون اتصال بالإنترنت.', 'Accurate scheduled reminders for your daily doses even without internet.')}
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#0D1F38', display: 'block', marginBottom: '4px' }}>
              {tr(lang, 'تحديثات تلقائية داخل التطبيق', 'Automatic In-App Updates')}
            </strong>
            {tr(lang, 'عند صدور أي نسخة جديدة يصلك إشعار فوري داخل التطبيق للتحديث بضغطة واحدة.', 'Receive instant update notifications inside the app whenever a new build ships.')}
          </div>
        </div>
      </section>

      {/* Back to Home Link */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            padding: '10px 22px',
            borderRadius: '12px',
            background: '#0D1F38',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '0.84rem',
            fontWeight: 800,
          }}
        >
          {tr(lang, 'العودة إلى الصفحة الرئيسية لدوايا', 'Back to DAWAYA Home')}
        </Link>
      </div>

      <Disclaimer />
    </main>
  );
}
