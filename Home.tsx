import { PersonaType } from './SmartPersonaAndSpotlight';
import { PublicPartnerPlacementSection } from './PartnersDirectory';
import { CSSProperties, FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES } from './articlesData';
import { pick, tr } from './types';
import Disclaimer from './Disclaimer';
import DidYouKnow from './DidYouKnow';
import { useClinicalProMode } from './clinicalProData';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import {
  DAWAYA_CATEGORY_LABELS,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import { norm } from './search';

const GlobalSpotlightModal = lazy(() =>
  import('./SmartPersonaAndSpotlight').then((m) => ({ default: m.GlobalSpotlightModal }))
);

export default function Home() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const { isProMode, setProMode } = useClinicalProMode();
  const { indexItems, totalCount } = useDawayaDrugDatabase();

  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAllClinicalTools, setShowAllClinicalTools] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('all');
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

  // Close live autocomplete dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(ev.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Voice Search in Egyptian Arabic / English using Web Speech API
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

  // Instant live autocomplete results across all 26,562 DAWAYA medicines + 206 reference packages
  const quickMatches = useMemo(() => {
    const clean = norm(q);
    if (clean.length < 2) return [];

    const dawayaMatches = searchDawayaIndex(indexItems, { query: q.trim() }, isAr)
      .slice(0, 5)
      .map((item) => ({
        id: item.i,
        titleAr: item.a || item.n,
        titleEn: item.n,
        sub: `${item.g || (isAr ? 'مادة فعالة' : 'Active Ingredient')} • ${
          DAWAYA_CATEGORY_LABELS[item.k]?.[isAr ? 'ar' : 'en'] || item.d
        }`,
        priceEgp: item.p,
      }));

    if (dawayaMatches.length >= 5) return dawayaMatches;

    const abxMatches = EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => {
      const hay = norm(
        `${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.barcode || ''} ${p.manufacturer}`
      );
      return hay.includes(clean);
    })
      .slice(0, 6 - dawayaMatches.length)
      .map((p) => ({
        id: p.activeIngredientId,
        titleAr: p.tradeNameAr,
        titleEn: p.tradeNameEn,
        sub: `${p.scientificComposition} • ${pick(p.dosageFormLabel, lang)}`,
        priceEgp: p.priceEgp,
      }));

    return [...dawayaMatches, ...abxMatches];
  }, [q, indexItems, isAr, lang]);

  const handleChoosePersona = (p: PersonaType) => {
    setSelectedPersona(p);
    if (p === 'doctor' && !isProMode) {
      setProMode(true);
    } else if ((p === 'patient' || p === 'mother') && isProMode) {
      setProMode(false);
    }
  };

  // Concise Bento Grid Clinical Tools (Exact original icon & card structure, upgraded for all 26,562 medicines)
  const clinicalTools = [
    {
      to: '/patient-dashboard',
      icon: '📊',
      badge: tr(lang, 'لوحة موحدة', 'Patient Hub', 'Tableau Patient', 'Panel'),
      title: tr(lang, 'لوحة المريض الموحدة', 'Unified Patient Dashboard', 'Tableau de Bord Patient', 'Panel del Paciente'),
      desc: tr(
        lang,
        'ملفك الصحي، أدويتك الحالية، منبهات الجرعات، وتنبيهات الأمان في شاشة واحدة',
        'Health profile, current meds, dose reminders & safety alerts in one screen'
      ),
      color: '#00BFD0',
    },
    {
      to: '/complete-checkup',
      icon: '⚡',
      badge: tr(lang, 'شامل 4×1', 'All-in-One', 'Bilan 4-en-1', '4 en 1'),
      title: tr(lang, 'فحص الدواء والروشتة الشامل', 'Complete Drug Checkup', 'Bilan Ordonnance', 'Chequeo de Receta'),
      desc: tr(
        lang,
        'تعارضات الأدوية + البديل الأرخص + جدول 24 ساعة في شاشة واحدة',
        'Interactions + cheaper generic + 24h dose clock in one screen'
      ),
      color: '#0d9488',
    },
    {
      to: '/cost-saver',
      icon: '🏷️',
      badge: tr(lang, 'توفير 60%', 'Save 60%', 'Économies', 'Ahorro 60%'),
      title: tr(lang, 'حاسبة البديل الأرخص', 'Generic Cost Saver', 'Économiseur Générique', 'Ahorro en Genéricos'),
      desc: tr(
        lang,
        'بدائل مصرية مرخصة متطابقة 100% في المادة الفعالة والتركيز لجميع الأدوية',
        '100% bioequivalent licensed generics with EGP savings across 26,562 drugs'
      ),
      color: '#16a34a',
    },
    {
      to: '/pediatric-helper',
      icon: '👶',
      badge: tr(lang, 'بالوزن والسنتي', 'By Weight (mL)', 'Pédiatrie', 'Pediatría'),
      title: tr(lang, 'حاسبة جرعات الأطفال', 'Pediatric Dose Helper', 'Calculateur Pédiatrique', 'Dosis Pediátrica'),
      desc: tr(
        lang,
        'جرعة شراب الحرارة والحساسية والأدوية بالسنتي (مل) حسب وزن الطفل',
        'Accurate syrup & suspension dose in mL calculated by child weight'
      ),
      color: '#d97706',
    },
    {
      to: '/green-prescription',
      icon: '🌿',
      badge: tr(lang, 'رعاية منزلية', 'Home Care', 'Ordonnance Verte', 'Receta Verde'),
      title: tr(lang, 'الروشتة الخضراء وتمارين التنفس', 'Green Prescription & Care', 'Ordonnance Verte', 'Receta Verde'),
      desc: tr(
        lang,
        'خطة عناية منزلية، كمادات، جلسات صدر، وتمارين تنفس بدون إفراط دوائي',
        'Safe non-pharmacological relief, thermal care & breathing exercises'
      ),
      color: '#15803d',
    },
    {
      to: '/prescription-radar',
      icon: '📡',
      badge: tr(lang, 'رادار 24س', '24h Radar', 'Radar 24h', 'Radar 24h'),
      title: tr(lang, 'رادار الروشتة الكاملة', 'Full Prescription Radar', 'Radar d’Ordonnance', 'Radar de Receta'),
      desc: tr(
        lang,
        'فحص التعارضات وتكرار المادة الفعالة بين أدوية الروشتة وتنظيم مواعيدها',
        'Screen multi-drug interactions & duplicate ingredients across 24h'
      ),
      color: '#0284c7',
    },
    {
      to: '/allergy-checker',
      icon: '🛡️',
      badge: tr(lang, 'فحص الأمان الـ 7', 'Safety Engine', 'Allergies', 'Alergias'),
      title: tr(lang, 'فاحص الحساسية وتكرار المادة', 'Allergy & Duplicate Checker', 'Vérificateur d’Allergies', 'Chequeo de Alergias'),
      desc: tr(
        lang,
        'تأكد من أمان أي دواء من 26,562 مستحضر مع حساسيتك وحالاتك الصحية الـ 7',
        'Check cross-reactivity, duplicate ingredients, and 7 clinical flags'
      ),
      color: '#7c3aed',
    },
    {
      to: '/daily-schedule',
      icon: '📅',
      badge: tr(lang, 'صورة وواتساب', 'PNG & WhatsApp', 'Planning PNG', 'Horario PNG'),
      title: tr(lang, 'مولّد جدول الجرعات', 'Dose Schedule Card', 'Planning Quotidien', 'Horario Diario'),
      desc: tr(
        lang,
        'صمم جدول مواعيد أدويتك اليومية كصورة ملونة جاهزة للطباعة أو واتساب',
        'Create a color-coded schedule card to save or share on WhatsApp'
      ),
      color: '#0d9488',
    },
    {
      to: '/tracker',
      icon: '⏰',
      badge: tr(lang, 'منبه الموبايل', 'Phone Alarm', 'Rappel Doses', 'Alarma Dosis'),
      title: tr(lang, 'منبه ومتابع الجرعات', 'Dose Alarm & Tracker', 'Suivi des Doses', 'Alarma de Dosis'),
      desc: tr(
        lang,
        'اضبط منبه جرعاتك وتابع التزامك بالخطة العلاجية يومياً',
        'Set loud phone alarms and track your daily medication adherence'
      ),
      color: '#059669',
    },
    {
      to: '/interactions',
      icon: '⚖️',
      badge: tr(lang, 'فحص التداخلات', 'Interactions', 'Interactions', 'Interacciones'),
      title: tr(lang, 'فاحص التداخلات الدوائية والغذائية', 'Drug & Food Interactions', 'Interactions', 'Interacciones'),
      desc: tr(
        lang,
        'افحص التعارضات بين الأدوية اليومية والمكملات والأطعمة والحالات الصحية',
        'Screen interactions between medications, supplements, and food'
      ),
      color: '#4f46e5',
    },
    {
      to: '/compare',
      icon: '🔬',
      badge: tr(lang, 'مقارنة 26,562 دواء', 'Compare 2 Drugs', 'Comparer', 'Comparar'),
      title: tr(lang, 'مقارنة دواءين جنباً لجنب', 'Compare Two Medicines', 'Comparer Deux Médicaments', 'Comparar Medicamentos'),
      desc: tr(
        lang,
        'قارن المادة الفعالة، الأسعار، الأعراض الجانبية، والتحذيرات الـ 7 لأي دواءين',
        'Side-by-side comparison of active ingredients, EGP prices, and 7 warnings'
      ),
      color: '#0e9aa7',
    },
    {
      to: '/safe-disposal',
      icon: '♻️',
      badge: tr(lang, 'الحفظ والتخزين', 'Storage & Eco', 'Conservation', 'Conservación'),
      title: tr(lang, 'الحفظ الصحيح والتخلص الآمن', 'Safe Storage & Disposal', 'Conservation & Élimination', 'Almacenamiento Seguro'),
      desc: tr(
        lang,
        'اعرف درجة الحفظ الصحيحة لأي دواء والطريقة الآمنة للتخلص من الأدوية المنتهية',
        'Check storage rules for any medicine and safely dispose of expired drugs'
      ),
      color: '#15803d',
    },
  ];

  const featuredMeds = [
    {
      id: 'eg-6664',
      ar: 'كونكور 5 مجم / بيسوبرولول',
      en: 'Concor 5mg / Bisoprolol',
      priceAr: 'متوفر ببدائل متعددة',
      priceEn: 'Multiple Generics',
      cls: {
        ar: 'تنظيم ضغط الدم وضربات القلب',
        en: 'Cardiovascular & Blood Pressure',
        fr: 'Cardiovasculaire & Tension',
        es: 'Cardiovascular y Presión',
      },
    },
    {
      id: 'eg-10523',
      ar: 'جلوكوفاج 1000 مجم / ميتفورمين',
      en: 'Glucophage 1000mg / Metformin',
      priceAr: 'متوفر ببدائل متعددة',
      priceEn: 'Multiple Generics',
      cls: {
        ar: 'تنظيم السكر بالدم (فموي)',
        en: 'Diabetes Management (Biguanide)',
        fr: 'Antidiabétique oral',
        es: 'Antidiabético oral',
      },
    },
    {
      id: 'eg-6835',
      ar: 'كونترولوك 40 مجم / بانتوبرازول',
      en: 'Controloc 40mg / Pantoprazole',
      priceAr: 'متوفر ببدائل متعددة',
      priceEn: 'Multiple Generics',
      cls: {
        ar: 'علاج الحموضة وارتجاع المريء والمعدة',
        en: 'Gastric Acid & GERD Control (PPI)',
        fr: 'Inhibiteur de la pompe à protons',
        es: 'Protector gástrico (IBP)',
      },
    },
    {
      id: 'eg-18510',
      ar: 'بنادول أدفانس / باراسيتامول',
      en: 'Panadol Advance / Paracetamol',
      priceAr: 'مسكن وخافض حرارة آمن',
      priceEn: 'Analgesic & Antipyretic',
      cls: {
        ar: 'مسكن للألم وخافض للحرارة',
        en: 'Pain Relief & Fever Reducer',
        fr: 'Antalgique & Antipyrétique',
        es: 'Analgésico y Antipirético',
      },
    },
    {
      id: 'amoxicillin-clavulanic-acid',
      ar: 'أوجمنتين / هاي بيوتك 1 جم',
      en: 'Augmentin / Hibiotic 1g',
      priceAr: 'بدائل تبدأ من 54 ج.م',
      priceEn: 'Generics from 54 EGP',
      cls: {
        ar: 'مضاد بكتيري واسع المجال',
        en: 'Broad-Spectrum Antibacterial',
        fr: 'Antibactérien à large spectre',
        es: 'Antibacteriano de amplio espectro',
      },
    },
    {
      id: 'eg-26525',
      ar: 'زيرتك 10 مجم / سيتيريزين',
      en: 'Zyrtec 10mg / Cetirizine',
      priceAr: 'مضاد للحساسية والرشح',
      priceEn: 'Allergy & Antihistamine',
      cls: {
        ar: 'علاج الحساسية والرشح والجيوب الأنفية',
        en: 'Second-Generation Antihistamine',
        fr: 'Antihistaminique',
        es: 'Antihistamínico',
      },
    },
  ];

  const personaTabs: { id: PersonaType; icon: string; ar: string; en: string }[] = [
    { id: 'all', icon: '✨', ar: 'الكل', en: 'All Tools' },
    { id: 'patient', icon: '🛡️', ar: 'للمريض', en: 'For Patients' },
    { id: 'mother', icon: '👶', ar: 'للأم والطفل', en: 'Mother & Child' },
    { id: 'doctor', icon: '🩺', ar: 'للطبيب والصيدلي', en: 'Doctor & Pharmacist' },
  ];

  return (
    <main style={{ paddingTop: 0 }}>
      <style>{`
        .modern-hero {
          background: linear-gradient(145deg, #101E36 0%, #162B4D 52%, #00BFD0 100%);
          color: #ffffff;
          padding: 26px 0 32px;
          border-bottom-left-radius: 28px;
          border-bottom-right-radius: 28px;
          box-shadow: 0 14px 36px rgba(16, 30, 54, 0.24);
          position: relative;
          overflow: visible;
        }
        .modern-hero-inner {
          max-width: 780px;
          margin: 0 auto;
          text-align: center;
        }
        .modern-hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(0, 191, 208, 0.16);
          border: 1px solid rgba(154, 232, 232, 0.38);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.8rem;
          font-weight: 800;
          color: #9AE8E8;
          margin-bottom: 10px;
        }
        .modern-hero-title {
          font-size: clamp(1.45rem, 4vw, 2.2rem);
          font-weight: 900;
          margin: 0 0 8px;
          line-height: 1.3;
          color: #ffffff;
        }
        .modern-hero-sub {
          font-size: 0.92rem;
          color: #e2e8f0;
          margin: 0 auto 18px;
          max-width: 620px;
          line-height: 1.55;
        }
        .hero-live-search-wrap {
          position: relative;
          max-width: 680px;
          margin: 0 auto 14px;
          z-index: 60;
        }
        .hero-live-search-form {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 2.5px solid #00BFD0;
          border-radius: 999px;
          padding: 6px 8px 6px 14px;
          box-shadow: 0 14px 34px rgba(16, 30, 54, 0.28);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        [dir="rtl"] .hero-live-search-form {
          padding: 6px 14px 6px 8px;
        }
        .hero-live-search-form:focus-within {
          border-color: #24C8B8;
          box-shadow: 0 16px 40px rgba(0, 191, 208, 0.35);
        }
        .hero-search-icon {
          font-size: 1.15rem;
          color: #00BFD0;
          flex-shrink: 0;
        }
        .hero-search-input {
          flex: 1;
          min-width: 0;
          border: none !important;
          outline: none !important;
          background: transparent !important;
          color: #101E36 !important;
          font-size: 0.96rem;
          font-weight: 700;
          padding: 8px 4px;
          box-shadow: none !important;
        }
        .hero-search-input::placeholder {
          color: #64748b;
          font-weight: 600;
        }
        .hero-action-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1.5px solid #9AE8E8;
          background: #F3F7FC;
          color: #101E36;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
          text-decoration: none;
          font-size: 1.05rem;
        }
        .hero-action-icon-btn:hover {
          background: #9AE8E8;
          transform: scale(1.05);
        }
        .hero-action-icon-btn.listening {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
          animation: pulseMic 1.2s infinite;
        }
        @keyframes pulseMic {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        .hero-live-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          inset-inline: 0;
          background: #ffffff;
          color: #101E36;
          border-radius: 20px;
          border: 1.5px solid #cbd5e1;
          box-shadow: 0 22px 50px rgba(16, 30, 54, 0.28);
          padding: 10px;
          text-align: start;
          z-index: 80;
        }
        .hero-live-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          text-decoration: none;
          color: #101E36;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s ease;
        }
        .hero-live-item:last-of-type {
          border-bottom: none;
        }
        .hero-live-item:hover {
          background: #F3F7FC;
        }
        .hero-quick-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 7px;
          margin-top: 12px;
        }
        .hero-quick-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(154, 232, 232, 0.32);
          color: #ffffff;
          border-radius: 999px;
          padding: 6px 13px;
          font-size: 0.8rem;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .hero-quick-tag:hover {
          background: rgba(0, 191, 208, 0.28);
          transform: translateY(-1px);
        }
        .bento-persona-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }
        .bento-persona-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .bento-persona-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 999px;
          border: 1.5px solid var(--border, #e2e8f0);
          background: var(--card-bg, #ffffff);
          color: var(--text, #101E36);
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .bento-persona-pill.active {
          background: #00BFD0;
          color: #101E36;
          border-color: #00BFD0;
          box-shadow: 0 4px 12px rgba(0, 191, 208, 0.25);
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }
        .bento-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--card-bg, #ffffff);
          border: 1.5px solid var(--border, #e2e8f0);
          border-radius: 20px;
          padding: 16px;
          text-decoration: none;
          color: var(--text, #101E36);
          box-shadow: 0 6px 20px rgba(16, 30, 54, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .bento-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0, 191, 208, 0.14);
          border-color: var(--accent-color, #00BFD0);
        }
        .bento-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
        }
        .bento-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .bento-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .bento-card h3 {
          margin: 0 0 4px;
          font-size: 1.02rem;
          font-weight: 900;
          line-height: 1.35;
        }
        .bento-card p {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted, #64748b);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 760px) {
          .modern-hero {
            padding: 18px 0 24px;
            border-bottom-left-radius: 22px;
            border-bottom-right-radius: 22px;
          }
          .bento-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .bento-card {
            padding: 13px 11px !important;
            border-radius: 16px !important;
          }
          .bento-icon-box {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            font-size: 1.2rem;
          }
          .bento-card h3 {
            font-size: 0.9rem !important;
          }
          .bento-card p {
            font-size: 0.75rem !important;
          }
        }
      `}</style>

      {/* Clean, Actionable DAWAYA Hero Section with Exact Original Icon & Search Layout */}
      <section className="modern-hero">
        <div className="wrap modern-hero-inner">
          <div className="modern-hero-kicker">
            <span>💊</span>
            <span>
              {tr(
                lang,
                'منصة دوايا | DAWAYA — صحتك.. بذكاء أكتر.',
                'DAWAYA — Your Health. Smarter.'
              )}
            </span>
          </div>

          <h1 className="modern-hero-title">
            {tr(
              lang,
              'ابحث عن أي دواء في مصر، بديله الأرخص، أو افحص روشتتك فوراً',
              'Search Any Medicine in Egypt, Cheaper Generic, or Check Your Prescription'
            )}
          </h1>
          <p className="modern-hero-sub">
            {tr(
              lang,
              `قاعدة بيانات ${totalCount.toLocaleString()}+ دواء مصري بالأسعار الرسمية والباركود، حاسبة جرعات الأطفال، وفاحص التداخلات والحساسية.`,
              `${totalCount.toLocaleString()}+ Egyptian medicines with official EGP prices, barcodes, pediatric dosing, and allergy checker.`
            )}
          </p>

          {/* Live Autocomplete Search Bar + Voice Search + Barcode Scanner */}
          <div ref={searchWrapRef} className="hero-live-search-wrap">
            <form onSubmit={go} className="hero-live-search-form" role="search">
              <span className="hero-search-icon" aria-hidden="true">🔍</span>
              <input
                type="search"
                className="hero-search-input"
                value={q}
                onFocus={() => setFocused(true)}
                onChange={(e) => {
                  setQ(e.target.value);
                  setFocused(true);
                }}
                placeholder={tr(
                  lang,
                  'ابحث باسم الدواء أو المادة الفعالة أو الباركود (مثال: كونكور، بنادول، أوجمنتين)...',
                  'Search by drug name, active ingredient, or barcode (e.g. Concor, Panadol)...'
                )}
                aria-label={tr(lang, 'ابحث باسم الدواء أو الباركود', 'Search by drug name or barcode')}
              />

              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '4px 6px',
                  }}
                  aria-label={tr(lang, 'مسح البحث', 'Clear search')}
                >
                  ✕
                </button>
              )}

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`hero-action-icon-btn${isListening ? ' listening' : ''}`}
                title={tr(lang, 'ابحث بصوتك', 'Voice search')}
                aria-label={tr(lang, 'ابحث بصوتك', 'Voice search')}
              >
                🎤
              </button>

              {/* Direct Barcode Scanner Camera Link */}
              <Link
                to="/scan"
                className="hero-action-icon-btn"
                title={tr(lang, 'مسح الباركود أو QR بالكاميرا', 'Scan barcode or QR with camera')}
                aria-label={tr(lang, 'مسح الباركود بالكاميرا', 'Scan barcode')}
              >
                📷
              </Link>
            </form>

            {/* Instant Live Dropdown Results */}
            {focused && q.trim().length >= 2 && (
              <div className="hero-live-dropdown" role="listbox">
                {quickMatches.length > 0 ? (
                  <>
                    {quickMatches.map((pkg) => (
                      <Link
                        key={pkg.id}
                        to={`/medicine/${pkg.id}`}
                        className="hero-live-item"
                        onClick={() => setFocused(false)}
                      >
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.93rem', color: '#101E36' }}>
                            {isAr ? pkg.titleAr : pkg.titleEn}{' '}
                            {pkg.priceEgp ? (
                              <span style={{ color: '#008B99', fontWeight: 800 }}>
                                — {pkg.priceEgp} {isAr ? 'ج.م' : 'EGP'}
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {pkg.sub}
                          </div>
                        </div>
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            borderRadius: '999px',
                            padding: '3px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {tr(lang, 'دوايا', 'DAWAYA')}
                        </span>
                      </Link>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        marginTop: '4px',
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.8rem',
                      }}
                    >
                      <Link
                        to={`/medicines?q=${encodeURIComponent(q.trim())}`}
                        style={{ fontWeight: 800, color: '#008B99', textDecoration: 'none' }}
                        onClick={() => setFocused(false)}
                      >
                        {tr(lang, 'عرض كل النتائج في موسوعة دوايا ←', 'See all matching drugs →')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setFocused(false);
                          setSpotlightOpen(true);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        {tr(lang, 'بحث متقدم ⌕', 'Advanced Search ⌕')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.86rem', color: '#64748b' }}>
                    {tr(lang, 'لا توجد مطابقة مباشرة — اضغط للبحث الشامل في المنصة:', 'No exact match — try full platform search:')}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setFocused(false);
                        setSpotlightOpen(true);
                      }}
                      style={{
                        background: '#00BFD0',
                        color: '#101E36',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '4px 12px',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        marginInlineStart: '6px',
                      }}
                    >
                      {tr(lang, 'فتح الباحث الشامل', 'Open Spotlight')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Access Pill Tags under Search Bar */}
            <div className="hero-quick-tags">
              <Link to="/patient-dashboard" className="hero-quick-tag">
                📊 {tr(lang, 'لوحة المريض', 'Patient Dashboard')}
              </Link>
              <Link to="/complete-checkup" className="hero-quick-tag">
                ⚡ {tr(lang, 'فحص الروشتة', 'Rx Checkup')}
              </Link>
              <Link to="/pediatric-helper" className="hero-quick-tag">
                👶 {tr(lang, 'حاسبة الأطفال', 'Pediatric Dose')}
              </Link>
              <Link to="/cost-saver" className="hero-quick-tag">
                🏷️ {tr(lang, 'البديل الأرخص', 'Cost Saver')}
              </Link>
              <Link to="/green-prescription" className="hero-quick-tag">
                🌿 {tr(lang, 'الروشتة الخضراء', 'Green Rx')}
              </Link>
            </div>
          </div>

          {/* Compact Trust Metrics Strip (Updated for 26,562 DAWAYA DB) */}
          <div className="pro-metrics-strip" style={{ marginTop: '14px' }}>
            <div className="pro-metric-item">
              <strong>{totalCount.toLocaleString()}+</strong>
              <span>{tr(lang, 'دواء بالسوق المصري', 'Egyptian Medicines')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>8,991</strong>
              <span>{tr(lang, 'تركيبة مادة فعالة', 'Active Ingredients')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>10,525+</strong>
              <span>{tr(lang, 'باركود موثق', 'Verified Barcodes')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>5,303</strong>
              <span>{tr(lang, 'شركة دوائية', 'Manufacturers')}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap stack" style={{ marginTop: '22px' }}>
        {/* Clean Bento Grid Section with Streamlined Persona Filter */}
        <section className="pro-tools-section">
          <div className="bento-persona-bar">
            <div>
              <h2 style={{ fontSize: '1.28rem', margin: 0 }}>
                {tr(lang, 'أدوات دوايا الذكية للأدوية والروشتات', 'DAWAYA Smart Medication Tools')}
              </h2>
            </div>

            <div className="bento-persona-pills" role="tablist" aria-label={tr(lang, 'تصفية حسب المستخدم', 'Filter by user role')}>
              {personaTabs.map((tab) => {
                const active = selectedPersona === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`bento-persona-pill${active ? ' active' : ''}`}
                    onClick={() => handleChoosePersona(tab.id)}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    <span>{isAr ? tab.ar : tab.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bento-grid">
            {(() => {
              const personaPaths: Record<PersonaType, string[]> = {
                all: ['/patient-dashboard', '/complete-checkup', '/cost-saver', '/pediatric-helper', '/green-prescription', '/prescription-radar'],
                patient: ['/patient-dashboard', '/complete-checkup', '/cost-saver', '/green-prescription', '/daily-schedule', '/tracker'],
                mother: ['/pediatric-helper', '/allergy-checker', '/green-prescription', '/complete-checkup', '/daily-schedule', '/safe-disposal'],
                doctor: ['/prescription-radar', '/compare', '/allergy-checker', '/interactions', '/complete-checkup', '/cost-saver'],
              };
              const targetPaths = personaPaths[selectedPersona] || personaPaths.all;
              const picked = targetPaths
                .map((path) => clinicalTools.find((tool) => tool.to === path))
                .filter((tool): tool is (typeof clinicalTools)[number] => Boolean(tool));
              return showAllClinicalTools ? clinicalTools : picked;
            })().map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="bento-card"
                style={{ '--accent-color': tool.color } as CSSProperties}
              >
                <div>
                  <div className="bento-card-head">
                    <span className="bento-icon-box" style={{ background: `${tool.color}15`, color: tool.color }}>
                      {tool.icon}
                    </span>
                    <span
                      className="bento-badge"
                      style={{
                        background: `${tool.color}14`,
                        color: tool.color,
                        borderColor: `${tool.color}30`,
                      }}
                    >
                      {tool.badge}
                    </span>
                  </div>
                  <h3>{tool.title}</h3>
                  <p>{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="pro-tools-more-wrap" style={{ marginTop: '12px' }}>
            <button
              type="button"
              className="btn ghost pro-tools-more-btn"
              onClick={() => setShowAllClinicalTools((value) => !value)}
              aria-expanded={showAllClinicalTools}
            >
              {showAllClinicalTools
                ? tr(lang, 'عرض الأدوات الأساسية فقط ↑', 'Show Core Tools ↑')
                : tr(lang, `عرض كل الأدوات (${clinicalTools.length}) ↓`, `Show All Tools (${clinicalTools.length}) ↓`)}
            </button>
          </div>
        </section>

        {/* Quick Access to Popular Medications in Egypt Across Categories */}
        <section className="card highlight-card pro-featured-section">
          <div className="head" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                🇪🇬 {tr(lang, 'أشهر الأدوية والبدائل المتداولة في مصر', 'Popular Medications & Generics in Egypt')}
              </h2>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {tr(
                  lang,
                  'اضغط على أي دواء لعرض النشرة المبسطة، الأسعار الرسمية، وأرخص البدائل المتطابقة:',
                  'Tap any medication to view its summary, official EGP prices, and identical generics:'
                )}
              </p>
            </div>
            <Link to="/medicines" className="btn ghost small">
              {tr(lang, `كل الأدوية (${totalCount.toLocaleString()}+) ←`, `All ${totalCount.toLocaleString()}+ Drugs →`)}
            </Link>
          </div>

          <div className="grid">
            {featuredMeds.map((fm) => (
              <Link key={fm.id} to={`/medicine/${fm.id}`} className="card link pro-med-shortcut">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{isAr ? fm.ar : fm.en}</h3>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isAr ? fm.priceAr : fm.priceEn}
                  </span>
                </div>
                <p className="small muted" style={{ margin: '4px 0 8px' }}>
                  {pick(fm.cls, lang)}
                </p>
                <span className="more" style={{ fontSize: '0.82rem' }}>
                  {tr(lang, 'الجرعة والأسعار والبدائل ←', 'Dosing, Prices & Generics →')}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Dynamic Partner Placement on Homepage */}
        <PublicPartnerPlacementSection placement="homepage_featured" />

        {/* Did you know? */}
        <DidYouKnow />

        {/* Articles & Quick Audio / Quiz Strip */}
        <section>
          <div className="head">
            <h2>📰 {t('articlesTitle')}</h2>
            <Link to="/articles" className="btn ghost small">
              {t('seeAll')} {isAr ? '←' : '→'}
            </Link>
          </div>
          <div className="grid">
            {ARTICLES.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/articles/${a.id}`} className="card link">
                <h3>{pick(a.title, lang)}</h3>
                <p className="small muted">{pick(a.summary, lang)}</p>
                <span className="more">
                  {t('read')} {isAr ? '←' : '→'}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <Disclaimer />
      </div>

      {spotlightOpen && (
        <Suspense fallback={null}>
          <GlobalSpotlightModal isOpen={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
        </Suspense>
      )}
    </main>
  );
}
