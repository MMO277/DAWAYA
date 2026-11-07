import { PublicPartnerPlacementSection } from './PartnersDirectory';
import { FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES } from './articlesData';
import { pick, tr } from './types';
import Disclaimer from './Disclaimer';
import {
  DAWAYA_CATEGORY_LABELS,
  DawayaTherapeuticCategory,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import DawayaLogo from './DawayaLogo';
import { norm } from './search';

const GlobalSpotlightModal = lazy(() =>
  import('./SmartPersonaAndSpotlight').then((m) => ({ default: m.GlobalSpotlightModal }))
);

/**
 * Glossy 3D Translucent Capsule Illustration (Matching Design 1 "Apple Health × Stripe Spatial Glass" Mockup)
 */
function Spatial3DCapsuleGraphic() {
  return (
    <div className="dawaya-3d-capsule-stage" aria-hidden="true">
      <svg
        className="dawaya-3d-capsule-svg"
        viewBox="0 0 260 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ambient glow behind capsule */}
          <radialGradient id="dwCapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00BFD0" stopOpacity="0.48" />
            <stop offset="55%" stopColor="#4F46E5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00BFD0" stopOpacity="0" />
          </radialGradient>

          {/* Top Cyan-Teal Translucent Glass Cap */}
          <linearGradient id="dwTopCap" x1="60" y1="30" x2="195" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#72F5FF" />
            <stop offset="38%" stopColor="#00BFD0" />
            <stop offset="82%" stopColor="#02849B" />
            <stop offset="100%" stopColor="#0B4F6C" />
          </linearGradient>

          {/* Bottom Frosted Pearl Glass Body */}
          <linearGradient id="dwBotCap" x1="65" y1="85" x2="185" y2="175" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
            <stop offset="52%" stopColor="#D5F5F8" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#8EDCE6" stopOpacity="0.82" />
          </linearGradient>

          {/* Specular Glass Highlight */}
          <linearGradient id="dwSpec" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Soft Halo */}
        <ellipse cx="130" cy="105" rx="105" ry="72" fill="url(#dwCapGlow)" />

        {/* Floating Micro-Droplets (Spatial Glass Effect) */}
        <circle cx="58" cy="64" r="4.5" fill="#72F5FF" fillOpacity="0.8" />
        <circle cx="48" cy="108" r="3" fill="#00BFD0" fillOpacity="0.65" />
        <circle cx="204" cy="70" r="5" fill="#38BDF8" fillOpacity="0.7" />
        <circle cx="196" cy="134" r="3.5" fill="#00BFD0" fillOpacity="0.75" />
        <circle cx="176" cy="154" r="2.5" fill="#4F46E5" fillOpacity="0.55" />

        {/* Capsule Group */}
        <g transform="translate(130, 100)">
          {/* Bottom Pearl Translucent Half */}
          <path
            d="M -38 0 L 38 0 L 38 42 A 38 38 0 0 1 -38 42 Z"
            fill="url(#dwBotCap)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          {/* Inner glowing core inside translucent half */}
          <ellipse cx="0" cy="28" rx="22" ry="26" fill="#00BFD0" fillOpacity="0.22" />

          {/* Top Cyan-Teal Glossy Half */}
          <path
            d="M -40 2 L 40 2 L 40 -42 A 40 40 0 0 0 -40 -42 Z"
            fill="url(#dwTopCap)"
            stroke="#A5F3FC"
            strokeWidth="1.2"
          />

          {/* Metallic/Glass Center Ring Seam */}
          <ellipse
            cx="0"
            cy="2"
            rx="40"
            ry="8"
            fill="#02687A"
            fillOpacity="0.45"
            stroke="#E0F2FE"
            strokeWidth="1.4"
          />

          {/* Left Specular Glass Reflection Strip */}
          <rect
            x="-28"
            y="-68"
            width="13"
            height="132"
            rx="6.5"
            fill="url(#dwSpec)"
            opacity="0.78"
          />
          {/* Top Dome Specular Dot */}
          <ellipse cx="-14" cy="-58" rx="9" ry="5" fill="#FFFFFF" fillOpacity="0.85" />
        </g>
      </svg>
    </div>
  );
}

export default function Home() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const { indexItems, totalCount } = useDawayaDrugDatabase();

  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const go = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) {
      nav('/medicines');
      return;
    }
    nav(`/medicines?q=${encodeURIComponent(q.trim())}`);
  };

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(ev.target as Node)) {
        setFocused(false);
      }
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        setSpotlightOpen(true);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleVoiceSearch = () => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpotlightOpen(true);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = isAr ? 'ar-EG' : 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setQ(transcript.trim());
          setFocused(true);
        }
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  // Instant live autocomplete across all 26,562 DAWAYA medicines
  const quickMatches = useMemo(() => {
    const clean = norm(q);
    if (clean.length < 2) return [];
    return searchDawayaIndex(indexItems, { query: q.trim() }, isAr)
      .slice(0, 7)
      .map((item) => ({
        id: item.i,
        titleAr: item.a || item.n,
        titleEn: item.n,
        sub: `${item.g || (isAr ? 'مادة فعالة' : 'Active Ingredient')} • ${
          DAWAYA_CATEGORY_LABELS[item.k]?.[isAr ? 'ar' : 'en'] || item.d
        }`,
        price: item.p,
        strength: item.s,
      }));
  }, [q, indexItems, isAr]);

  const clinicalTools = [
    {
      to: '/patient-dashboard',
      icon: '📊',
      badge: tr(lang, 'لوحة المريض الذكية', 'Patient OS', 'Tableau Patient', 'Panel del Paciente'),
      title: tr(lang, 'لوحة المريض الموحدة', 'Unified Patient Dashboard', 'Tableau de Bord Patient', 'Panel del Paciente'),
      desc: tr(
        lang,
        'ملفك الصحي، أدويتك الحالية، منبهات الجرعات، وتنبيهات الأمان الـ 7 في شاشة زجاجية واحدة',
        'Health profile, current meds, dose reminders & 7-condition safety alerts in one spatial view'
      ),
      color: '#00BFD0',
    },
    {
      to: '/prescription-radar',
      icon: '📡',
      badge: tr(lang, 'رادار 24س + AI OCR', '24h Radar & OCR', 'Radar 24h', 'Radar 24h'),
      title: tr(lang, 'رادار الروشتة الشامل', 'Smart Prescription Radar', 'Radar d’Ordonnance', 'Radar de Receta'),
      desc: tr(
        lang,
        'صوّر الروشتة أو أضف أي دواء من 26,562 مستحضر لفحص التداخلات وتنظيم مواعيد الـ 24 ساعة',
        'Scan your prescription or add any of 26,562 medicines to check interactions & 24h dosing'
      ),
      color: '#4F46E5',
    },
    {
      to: '/cost-saver',
      icon: '🏷️',
      badge: tr(lang, 'توفير حتى 60%', 'Save up to 60%', 'Économies', 'Ahorro 60%'),
      title: tr(lang, 'محرك البديل الأرخص المتكافئ', 'Bioequivalent Cost Saver', 'Économiseur Générique', 'Ahorro en Genéricos'),
      desc: tr(
        lang,
        'اعثر فوراً على المثيل المصري المرخص بنفس المادة الفعالة والتركيز ووفّر في فاتورة الدواء',
        'Find licensed Egyptian equivalents with the exact same active ingredient and strength'
      ),
      color: '#10B981',
    },
    {
      to: '/allergy-checker',
      icon: '🛡️',
      badge: tr(lang, 'محرك الأمان الـ 7', '7-Flag Safety Engine', 'Sécurité', 'Seguridad'),
      title: tr(lang, 'فاحص الحساسية وتكرار المادة الفعالة', 'Allergy & Duplicate Ingredient Checker', 'Vérificateur d’Allergies', 'Chequeo de Alergias'),
      desc: tr(
        lang,
        'يكتشف تكرار المادة الفعالة بين الأدوية المختلفة ويطابقها مع حساسيتك والـ 7 حالات الصحية',
        'Detects duplicate active ingredients across different brands and screens against 7 health conditions'
      ),
      color: '#7C3AED',
    },
    {
      to: '/interactions',
      icon: '⚡',
      badge: tr(lang, 'فحص متعدد', 'Multi-Drug Check', 'Interactions', 'Interacciones'),
      title: tr(lang, 'فاحص التداخلات الدوائية والغذائية', 'Drug & Food Interaction Checker', 'Interactions Médicamenteuses', 'Interacciones'),
      desc: tr(
        lang,
        'تحقق من أمان الجمع بين أدويتك اليومية والمكملات والأطعمة لتجنب التعارضات الخطرة',
        'Check pairwise interactions across your daily medications, supplements, and food'
      ),
      color: '#0284C7',
    },
    {
      to: '/complete-checkup',
      icon: '🔍',
      badge: tr(lang, 'فحص 4×1', '4-in-1 Checkup', 'Bilan 4-en-1', 'Chequeo 4 en 1'),
      title: tr(lang, 'الفحص الذكي الشامل للدواء بضغطة واحدة', '1-Click Complete Medication Checkup', 'Bilan Médicament 1-Clic', 'Chequeo 1-Clic'),
      desc: tr(
        lang,
        'مؤشر الأمان + المثيل الأرخص + ساعة الجرعات الـ 24 + توافر الصيدليات لأي دواء في مصر',
        'Safety gauge + cheaper equivalent + 24h clock schedule + pharmacy lookup on one screen'
      ),
      color: '#0D9488',
    },
    {
      to: '/pediatric-helper',
      icon: '👶',
      badge: tr(lang, 'بالوزن والسنتي', 'By Weight (mL)', 'Pédiatrie', 'Pediatría'),
      title: tr(lang, 'حاسبة جرعات شراب وأدوية الأطفال', 'Pediatric Syrup & Dose Calculator', 'Calculateur Pédiatrique', 'Dosis Pediátrica'),
      desc: tr(
        lang,
        'احسبي جرعة خافض الحرارة أو الحساسية أو الشراب بالسيرنجة (مل) بدقة حسب وزن الطفل',
        'Accurate oral syringe dosing in mL for antipyretics, allergy syrups, and suspensions by child weight'
      ),
      color: '#F59E0B',
    },
    {
      to: '/daily-schedule',
      icon: '📅',
      badge: tr(lang, 'صورة + واتساب + طباعة', 'PNG & WhatsApp', 'Planning', 'Horario'),
      title: tr(lang, 'مولّد جدول الأدوية اليومي ومنبه الجرعات', 'Daily Medication Schedule & Alarm', 'Calendrier des Doses', 'Horario Diario'),
      desc: tr(
        lang,
        'صمّم جدول مواعيد أدويتك اليومية واحفظه كصورة ملونة عالية الجودة أو أرسله عبر واتساب',
        'Generate a personalized 24-hour medication chart as a high-res PNG or WhatsApp message'
      ),
      color: '#EC4899',
    },
    {
      to: '/green-prescription',
      icon: '🌿',
      badge: tr(lang, 'رعاية منزلية وتنفس', 'Home & Breathing Care', 'Soins Verts', 'Receta Verde'),
      title: tr(lang, 'الروشتة الخضراء وتمارين التنفس والعناية', 'Green Prescription & Breathing Care', 'Ordonnance Verte', 'Receta Verde'),
      desc: tr(
        lang,
        'بروتوكولات الرعاية غير الدوائية، الكمادات، جلسات الصدر، وتمارين التنفس البطني الموثقة',
        'Evidence-based non-pharmacological care, thermal therapy, and guided breathing exercises'
      ),
      color: '#16A34A',
    },
  ];

  const categoryEntries = Object.entries(DAWAYA_CATEGORY_LABELS) as Array<
    [DawayaTherapeuticCategory, { ar: string; en: string; icon: string }]
  >;

  return (
    <main className="wrap stack" style={{ gap: '28px', paddingTop: '12px', paddingBottom: '48px' }}>
      {spotlightOpen && (
        <Suspense fallback={null}>
          <GlobalSpotlightModal onClose={() => setSpotlightOpen(false)} />
        </Suspense>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          DESIGN 1 HERO: "Apple Health × Stripe Spatial Glass"
          Luminous Aurora Mesh + Top Pill Nav + 3D Capsule + Spotlight Search + 4 Bento Cards
         ══════════════════════════════════════════════════════════════════════════ */}
      <section className="dawaya-spatial-hero">
        {/* Top Bar inside Spatial Glass Canvas: Brand Lockup + Center Pill Nav + Quick Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DawayaLogo variant="bilingual" size="md" showTagline={false} />
          </div>

          <nav className="dawaya-spatial-pill-nav" aria-label={isAr ? 'التنقل السريع' : 'Quick Navigation'}>
            <Link to="/" className="dawaya-spatial-pill-link active">
              {isAr ? 'نظرة عامة' : 'Overview'}
            </Link>
            <Link to="/medicines" className="dawaya-spatial-pill-link">
              {isAr ? 'الأدوية (26,562+)' : 'Medicines'}
            </Link>
            <Link to="/prescription-radar" className="dawaya-spatial-pill-link">
              {isAr ? 'رادار الروشتة' : 'Rx Radar'}
            </Link>
            <Link to="/cost-saver" className="dawaya-spatial-pill-link">
              {isAr ? 'البديل الأرخص' : 'Cost Saver'}
            </Link>
            <Link to="/patient-dashboard" className="dawaya-spatial-pill-link">
              {isAr ? 'لوحة المريض' : 'Dashboard'}
            </Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/scan"
              className="btn small"
              style={{
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.85)',
                color: '#101E36',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 14px rgba(16, 30, 54, 0.08)',
                fontWeight: 800,
              }}
            >
              📷 {isAr ? 'مسح الباركود' : 'Scan Box'}
            </Link>
          </div>
        </div>

        {/* Center 3D Translucent Floating Capsule + Headline */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto' }}>
          <Spatial3DCapsuleGraphic />

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.78)',
              border: '1px solid rgba(0, 191, 208, 0.35)',
              color: '#008B99',
              fontSize: '0.82rem',
              fontWeight: 800,
              marginBottom: '10px',
            }}
          >
            ✨ {isAr ? 'دوايا | DAWAYA — صحتك.. بذكاء أكتر.' : 'DAWAYA — Your Health. Smarter.'}
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3.8vw, 2.65rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}
          >
            {isAr
              ? 'المنصة الذكية الشاملة لكل أدوية السوق المصري والروشتات والأمان الدوائي'
              : 'Egypt’s Intelligent Platform for All 26,562 Medicines, Prescriptions & Patient Safety'}
          </h1>

          <p
            style={{
              fontSize: '0.98rem',
              opacity: 0.84,
              maxWidth: '640px',
              margin: '0 auto 20px',
              lineHeight: 1.6,
            }}
          >
            {isAr
              ? 'ابحث في 26,562 مستحضر دوائي بالاسم التجاري أو المادة الفعالة أو الباركود، قارن البدائل الأرخص، وافحص التداخلات والـ 7 تحذيرات السريرية في ثوانٍ.'
              : 'Search 26,562 medicines by brand, active ingredient, or barcode, discover bioequivalent savings, and screen interactions & 7 clinical health flags instantly.'}
          </p>
        </div>

        {/* Spotlight-Style Command Search Bar (Cmd + K) */}
        <div className="dawaya-spotlight-bar" ref={searchWrapRef}>
          <form onSubmit={go}>
            <div className="dawaya-spotlight-input-wrap">
              <span style={{ fontSize: '1.2rem', paddingInlineStart: '6px', opacity: 0.7 }} aria-hidden="true">
                🔍
              </span>
              <input
                type="search"
                value={q}
                onFocus={() => setFocused(true)}
                onChange={(e) => {
                  setQ(e.target.value);
                  setFocused(true);
                }}
                placeholder={
                  isAr
                    ? `ابحث في ${totalCount.toLocaleString()} دواء... (مثال: كونكور، بنادول، جلوكوفاج، أوجمنتين)`
                    : `Search ${totalCount.toLocaleString()} medicines... (Cmd + K)`
                }
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  outline: 'none',
                  padding: '8px 4px',
                  color: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={handleVoiceSearch}
                title={isAr ? 'بحث صوتي' : 'Voice Search'}
                style={{
                  border: 'none',
                  background: isListening ? '#EF4444' : 'rgba(0, 191, 208, 0.14)',
                  color: isListening ? '#FFF' : '#008B99',
                  borderRadius: '999px',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                🎙️
              </button>
              <button
                type="button"
                onClick={() => setSpotlightOpen(true)}
                style={{
                  border: '1px solid rgba(16, 30, 54, 0.14)',
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: '#475569',
                  borderRadius: '999px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  direction: 'ltr',
                }}
              >
                ⌘K
              </button>
              <button
                type="submit"
                style={{
                  border: 'none',
                  background: 'linear-gradient(135deg, #00BFD0 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  padding: '9px 20px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(0, 191, 208, 0.3)',
                }}
              >
                {isAr ? 'بحث' : 'Search'}
              </button>
            </div>
          </form>

          {/* Instant Autocomplete Glass Popover */}
          {focused && quickMatches.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                insetInline: 0,
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(24px)',
                borderRadius: '20px',
                border: '1px solid rgba(0, 191, 208, 0.35)',
                boxShadow: '0 24px 48px rgba(16, 30, 54, 0.18)',
                padding: '10px',
                zIndex: 60,
                color: '#101E36',
              }}
            >
              {quickMatches.map((m) => (
                <Link
                  key={m.id}
                  to={`/medicine/${m.id}`}
                  onClick={() => setFocused(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.94rem' }}>
                      💊 {isAr ? m.titleAr : m.titleEn}{' '}
                      {m.strength && <span className="small muted">({m.strength})</span>}
                    </div>
                    <div className="small muted">{m.sub}</div>
                  </div>
                  <span className="badge approved" style={{ whiteSpace: 'nowrap' }}>
                    {m.price ? `${m.price} EGP` : isAr ? 'عرض الدواء' : 'View'}
                  </span>
                </Link>
              ))}
              <div style={{ textAlign: 'center', paddingTop: '6px', borderTop: '1px solid #E2E8F0', marginTop: '4px' }}>
                <Link
                  to={`/medicines?q=${encodeURIComponent(q.trim())}`}
                  style={{ fontSize: '0.84rem', fontWeight: 800, color: '#008B99', textDecoration: 'none' }}
                >
                  {isAr ? `عرض جميع النتائج لـ «${q}» في موسوعة دوايا ←` : `See all results for "${q}" →`}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 4-COLUMN SPATIAL GLASS BENTO TELEMETRY & PATIENT CARE ROW (Exact Match to Design 1 Mockup) */}
        <div className="dawaya-spatial-bento-grid">
          {/* Bento Card 1: Telemetry Curves */}
          <div className="dawaya-spatial-bento-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  {isAr ? 'مؤشر التغطية الدوائية الذكي' : 'Real-Time Drug Telemetry'}
                </div>
                <div className="small muted">
                  {isAr ? '8,991 تركيبة مادة فعالة' : '8,991 Active Ingredient Groups'}
                </div>
              </div>
              <span style={{ opacity: 0.5, fontWeight: 900 }}>•••</span>
            </div>

            <svg viewBox="0 0 220 75" style={{ width: '100%', height: '68px', margin: '8px 0 4px' }}>
              <defs>
                <linearGradient id="dwCurveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00BFD0" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#00BFD0" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 5 58 Q 35 32, 65 48 T 125 22 T 180 38 T 215 18 L 215 70 L 5 70 Z"
                fill="url(#dwCurveFill)"
              />
              <path
                d="M 5 58 Q 35 32, 65 48 T 125 22 T 180 38 T 215 18"
                fill="none"
                stroke="#00BFD0"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 5 64 Q 45 50, 85 55 T 145 36 T 215 30"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.73rem',
                opacity: 0.68,
                fontWeight: 700,
              }}
            >
              <span>{isAr ? 'مسكنات' : 'Analgesics'}</span>
              <span>{isAr ? 'قلب وضغط' : 'Cardio'}</span>
              <span>{isAr ? 'سكري' : 'Diabetes'}</span>
              <span>{isAr ? 'مضادات' : 'Abx'}</span>
              <span>{isAr ? 'فيتامينات' : 'Vitamins'}</span>
            </div>
          </div>

          {/* Bento Card 2: Stacked Analytics & Verified Inventory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              to="/cost-saver"
              className="dawaya-spatial-bento-card"
              style={{ textDecoration: 'none', color: 'inherit', padding: '14px 16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#008B99' }}>
                  📊 {isAr ? 'متوسط التوفير بالمثيل' : 'Generic Savings Rate'}
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.16)',
                    color: '#059669',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                  }}
                >
                  ↑ +60%
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#00BFD0', marginTop: '2px' }}>
                48.75%
              </div>
              <div className="small muted">
                {isAr ? 'مقارنة فورية لـ 26,435 سعر رسمي' : 'Across 26,435 verified EGP prices'}
              </div>
            </Link>

            <Link
              to="/medicines"
              className="dawaya-spatial-bento-card"
              style={{ textDecoration: 'none', color: 'inherit', padding: '14px 16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4F46E5' }}>
                  📦 {isAr ? 'إجمالي قاعدة أدوية دوايا' : 'Total Medicine Registry'}
                </span>
                <span
                  style={{
                    background: 'rgba(79, 70, 229, 0.14)',
                    color: '#4F46E5',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  EDA + CSV
                </span>
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 900, marginTop: '2px' }}>
                26,562+
              </div>
              <div className="small muted">
                {isAr ? 'مستحضر دوائي من 5,303 شركة' : 'Medicines across 5,303 companies'}
              </div>
            </Link>
          </div>

          {/* Bento Card 3: Medicine Inventory Breakdown */}
          <div className="dawaya-spatial-bento-card">
            <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px' }}>
              💊 {isAr ? 'أقسام الدليل الدوائي السريع' : 'Smart Medicine Inventory'}
            </div>
            <div className="stack" style={{ gap: '8px' }}>
              {[
                {
                  icon: '❤️',
                  nameAr: 'أدوية القلب والضغط والسيولة',
                  nameEn: 'Cardiovascular & BP',
                  count: '+3,216',
                  cat: 'cardiovascular',
                },
                {
                  icon: '🩸',
                  nameAr: 'أدوية السكري والغدد الصماء',
                  nameEn: 'Diabetes & Endocrine',
                  count: '+3,133',
                  cat: 'endocrine_diabetes',
                },
                {
                  icon: '🌡️',
                  nameAr: 'المسكنات ومضادات الالتهاب',
                  nameEn: 'Analgesics & NSAIDs',
                  count: '+4,120',
                  cat: 'analgesics_antipyretics',
                },
              ].map((row) => (
                <Link
                  key={row.cat}
                  to={`/medicines?cat=${row.cat}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '6px 8px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.55)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
                    <span>{row.icon}</span>
                    <span>{isAr ? row.nameAr : row.nameEn}</span>
                  </span>
                  <span style={{ fontWeight: 900, fontSize: '0.82rem', color: '#008B99', direction: 'ltr' }}>
                    {row.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Bento Card 4: Patient Care Dashboard & 7-Condition Guardrails */}
          <Link
            to="/patient-dashboard"
            className="dawaya-spatial-bento-card"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  {isAr ? 'لوحة رعاية وأمان المريض' : 'Patient Care & Safety OS'}
                </div>
                <div className="small muted">
                  {isAr ? 'فحص الـ 7 تحذيرات السريرية' : '7-Condition Clinical Shield'}
                </div>
              </div>
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00BFD0, #4F46E5)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                }}
              >
                🛡️
              </span>
            </div>

            <div className="stack" style={{ gap: '8px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  🤰 {isAr ? 'تنبيهات الحمل والرضاعة' : 'Pregnancy & Lactation'}
                </span>
                <span style={{ fontWeight: 900, color: '#00BFD0', fontSize: '0.92rem' }}>7,061</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  🫘 {isAr ? 'تنبيهات الكلى والكبد والقلب' : 'Renal, Hepatic & Cardiac'}
                </span>
                <span style={{ fontWeight: 900, color: '#4F46E5', fontSize: '0.92rem' }}>6,228</span>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#008B99',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{isAr ? 'فتح لوحة المريض الموحدة ←' : 'Open Patient Dashboard →'}</span>
              <span>•••</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          THERAPEUTIC CATEGORY EXPLORER (All 13 Categories Across 26,562 Medicines)
         ══════════════════════════════════════════════════════════════════════════ */}
      <section className="card stack">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              🧭 {isAr ? 'تصفّح موسوعة دوايا حسب التخصص العلاجي (26,562+ دواء)' : 'Explore 26,562+ Medicines by Therapeutic Category'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'اضغط على أي قسم لاستعراض جميع الأدوية المصرية المسجلة وأسعارها وبدائلها وتحذيراتها السريرية.'
                : 'Select any therapeutic class to browse all registered Egyptian medicines, official prices, equivalents, and clinical warnings.'}
            </p>
          </div>
          <Link to="/medicines" className="btn small">
            💊 {isAr ? 'فتح الفهرس الكامل (26,562+)' : 'Browse Full Index (26,562+)'}
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
            gap: '10px',
            marginTop: '6px',
          }}
        >
          {categoryEntries.map(([catKey, meta]) => (
            <Link
              key={catKey}
              to={`/medicines?cat=${catKey}`}
              className="subcard"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '16px',
                transition: 'transform 0.18s ease, border-color 0.18s ease',
              }}
            >
              <span style={{ fontSize: '1.45rem' }}>{meta.icon}</span>
              <span style={{ fontWeight: 800, fontSize: '0.86rem', lineHeight: 1.35 }}>
                {isAr ? meta.ar : meta.en}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          ALL-MEDICINES SMART CLINICAL & PATIENT TOOLS BENTO GRID
         ══════════════════════════════════════════════════════════════════════════ */}
      <section className="stack" style={{ gap: '14px' }}>
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              ✨ {isAr ? 'منظومة أدوات دوايا الذكية لجميع الأدوية والروشتات' : 'DAWAYA Smart Medication & Prescription Suite'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'جميع الأدوات متصلة بقاعدة بيانات السوق المصري الكاملة (26,562 مستحضر) ومحرك الأمان السريري.'
                : 'Every clinical tool is powered by the full 26,562-record Egyptian medicine dataset and Central Safety Engine.'}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {clinicalTools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="card"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '20px',
                borderTop: `3px solid ${tool.color}`,
              }}
            >
              <div>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.75rem' }}>{tool.icon}</span>
                  <span
                    style={{
                      background: `${tool.color}18`,
                      color: tool.color,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.08rem', fontWeight: 900 }}>{tool.title}</h3>
                <p className="small muted" style={{ margin: 0, lineHeight: 1.55 }}>
                  {tool.desc}
                </p>
              </div>
              <div style={{ fontSize: '0.83rem', fontWeight: 800, color: tool.color }}>
                {isAr ? 'افتح الأداة الآن ←' : 'Launch Tool →'}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          VERIFIED PARTNER PHARMACIES & HEALTHCARE NETWORK
         ══════════════════════════════════════════════════════════════════════════ */}
      <PublicPartnerPlacementSection placement="home" />

      {/* ══════════════════════════════════════════════════════════════════════════
          HEALTH EDUCATION & ARTICLES PREVIEW
         ══════════════════════════════════════════════════════════════════════════ */}
      <section className="card stack">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>
            📰 {isAr ? 'مقالات التثقيف الدوائي والصحي' : 'Medication Safety & Health Articles'}
          </h2>
          <Link to="/articles" className="btn ghost small">
            {isAr ? 'جميع المقالات ←' : 'All Articles →'}
          </Link>
        </div>
        <div className="grid">
          {ARTICLES.slice(0, 3).map((a) => (
            <Link
              key={a.id}
              to={`/articles/${a.id}`}
              className="subcard stack"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{pick(a.title, lang)}</h3>
              <p className="small muted" style={{ margin: 0 }}>
                {pick(a.summary, lang)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
