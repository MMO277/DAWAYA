import { PersonaType } from './SmartPersonaAndSpotlight';
import { PublicPartnerPlacementSection } from './PartnersDirectory';
import { CSSProperties, FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES } from './articlesData';
import { pick, tr } from './types';
import Disclaimer from './Disclaimer';
import DidYouKnow from './DidYouKnow';
import ResistanceCounter from './ResistanceCounter';
import { useClinicalProMode } from './clinicalProData';
import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
} from './egyptianDrugDatabase';
import {
  DAWAYA_CATEGORY_LABELS,
  DawayaTherapeuticCategory,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import DawayaLogo from './DawayaLogo';
import { norm } from './search';

const EgyptResistanceMap = lazy(() => import('./EgyptResistanceMap'));
const GlobalSpotlightModal = lazy(() =>
  import('./SmartPersonaAndSpotlight').then((m) => ({ default: m.GlobalSpotlightModal }))
);

export default function Home() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const { isProMode, setProMode } = useClinicalProMode();
  const { indexItems, totalCount, importReport } = useDawayaDrugDatabase();

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

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(ev.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
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

  // Instant live autocomplete results combining the 206 verified antibiotic packages AND the 26,562 DAWAYA medicines
  const quickMatches = useMemo(() => {
    const clean = norm(q);
    if (clean.length < 2) return [];
    const abxMatches = EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => {
      const hay = norm(
        `${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.barcode || ''} ${p.manufacturer}`
      );
      return hay.includes(clean);
    })
      .slice(0, 3)
      .map((p) => ({
        id: p.activeIngredientId,
        titleAr: p.tradeNameAr,
        titleEn: p.tradeNameEn,
        sub: `${p.scientificComposition} • ${pick(p.dosageFormLabel, lang)}`,
        price: p.priceEgp,
        badgeAr: 'مضاد حيوي موثق',
        badgeEn: 'Verified Antibiotic',
      }));

    const dawayaMatches = searchDawayaIndex(indexItems, { query: q.trim() }, isAr)
      .slice(0, 6 - abxMatches.length)
      .map((item) => ({
        id: item.i,
        titleAr: item.a || item.n,
        titleEn: item.n,
        sub: `${item.g || (isAr ? 'مادة فعالة قيد المراجعة' : 'Ingredient pending')} • ${
          DAWAYA_CATEGORY_LABELS[item.k]?.[isAr ? 'ar' : 'en'] || item.d
        }`,
        price: item.p,
        badgeAr: item.v === 1 ? 'موسوعة دوايا' : 'سجل مستورد',
        badgeEn: item.v === 1 ? 'DAWAYA Verified' : 'Imported Record',
      }));

    return [...abxMatches, ...dawayaMatches];
  }, [q, indexItems, isAr, lang]);

  const handleChoosePersona = (p: PersonaType) => {
    setSelectedPersona(p);
    if (p === 'doctor' && !isProMode) {
      setProMode(true);
    } else if ((p === 'patient' || p === 'mother') && isProMode) {
      setProMode(false);
    }
  };

  const clinicalTools = [
    {
      to: '/patient-dashboard',
      icon: '📊',
      badge: tr(lang, 'جديد في دوايا', 'Unified Hub', 'Tableau Unifié', 'Panel Unificado'),
      title: tr(lang, 'لوحة المريض الموحدة', 'Unified Patient Dashboard', 'Tableau de Bord Patient', 'Panel del Paciente'),
      desc: tr(
        lang,
        'ملفك الصحي، أدويتك الحالية، منبهات الجرعات، وتنبيهات الأمان في شاشة واحدة',
        'Health profile, current meds, dose reminders & safety alerts in one view'
      ),
      color: '#00BFD0',
    },
    {
      to: '/complete-checkup',
      icon: '⚡',
      badge: tr(lang, 'شامل 4×1', 'All-in-One', 'Bilan 4-en-1', '4 en 1'),
      title: tr(lang, 'فحص الروشتة الشامل', 'Complete Rx Checkup', 'Bilan Ordonnance', 'Chequeo de Receta'),
      desc: tr(
        lang,
        'تعارضات الأدوية + تكرار المادة الفعالة + البديل الأرخص + جدول 24 ساعة',
        'Interactions + duplicate ingredients + cheaper generic + 24h schedule'
      ),
      color: '#0d9488',
    },
    {
      to: '/prescription-radar',
      icon: '📡',
      badge: tr(lang, 'رادار 24س + OCR', '24h Radar & OCR', 'Radar 24h', 'Radar 24h'),
      title: tr(lang, 'رادار الروشتة الكاملة', 'Full Prescription Radar', 'Radar d’Ordonnance', 'Radar de Receta'),
      desc: tr(
        lang,
        'رفع صورة الروشتة، مراجعة الأدوية المستخرجة، وتنظيم مواعيدها بالساعة',
        'Upload Rx image, review extracted medicines & organize 24h dosing times'
      ),
      color: '#0284c7',
    },
    {
      to: '/allergy-checker',
      icon: '🛡️',
      badge: tr(lang, 'محرك الأمان', 'Safety Engine', 'Allergies', 'Alergias'),
      title: tr(lang, 'فاحص الحساسية وتكرار المادة', 'Allergy & Duplicate Checker', 'Vérificateur d’Allergies', 'Chequeo de Alergias'),
      desc: tr(
        lang,
        'افحص أي دواء من 26,562+ مستحضر مقابل حساسيتك وحالاتك الصحية',
        'Screen any of 26,562+ medicines against allergies and health conditions'
      ),
      color: '#7c3aed',
    },
    {
      to: '/cost-saver',
      icon: '🏷️',
      badge: tr(lang, 'توفير 60%', 'Save 60%', 'Économies', 'Ahorro 60%'),
      title: tr(lang, 'حاسبة البديل الأرخص', 'Generic Cost Saver', 'Économiseur Générique', 'Ahorro en Genéricos'),
      desc: tr(
        lang,
        'بدائل مصرية مرخصة متطابقة في المادة الفعالة والتركيز لجميع الفئات الدوائية',
        'Bioequivalent Egyptian alternatives with official EGP savings'
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
        'جرعة الشراب بالسنتي (مل) حسب وزن الطفل بدقة وأمان',
        'Accurate suspension dose in mL calculated by child weight'
      ),
      color: '#d97706',
    },
    {
      to: '/green-prescription',
      icon: '🌿',
      badge: tr(lang, 'رعاية غير دوائية', 'Non-Drug Care', 'Ordonnance Verte', 'Receta Verde'),
      title: tr(lang, 'الروشتة الخضراء والعناية التمريضية', 'Green Prescription & Care', 'Ordonnance Verte', 'Receta Verde'),
      desc: tr(
        lang,
        'كمادات، جلسات صدر، تمارين تنفس، وتسكين غير دوائي بمصادر سريرية موثقة',
        'Heat/cold therapy, chest physiotherapy, breathing exercises & non-drug relief'
      ),
      color: '#15803d',
    },
    {
      to: '/cold-shot-warning',
      icon: '💉',
      badge: tr(lang, 'تحذير 3×1', 'Urgent Alert', 'Alerte 3-en-1', 'Alerta 3 en 1'),
      title: tr(lang, 'خطر حقنة البرد 3×1', '3-in-1 Cold Shot Risk', 'Danger Injection 3-en-1', 'Riesgo Inyección 3 en 1'),
      desc: tr(
        lang,
        'محاكاة تفاعلية تكشف مخاطر خلط المضاد والكورتيزون والمسكن',
        'Interactive simulation showing dangers of the 3-in-1 cold shot'
      ),
      color: '#dc2626',
    },
    {
      to: '/tracker',
      icon: '⏰',
      badge: tr(lang, 'منبه الموبايل', 'Phone Alarm', 'Rappel Doses', 'Alarma Dosis'),
      title: tr(lang, 'منبه ومتابع الجرعات', 'Dose Alarm & Tracker', 'Suivi des Doses', 'Alarma de Dosis'),
      desc: tr(
        lang,
        'اضبط منبه جرعاتك وتابع التزامك بالكورس العلاجي يومياً',
        'Set loud phone alarms and track your medication course completion'
      ),
      color: '#059669',
    },
    {
      to: '/daily-schedule',
      icon: '📅',
      badge: tr(lang, 'صورة وواتساب', 'PNG & WhatsApp', 'Planning PNG', 'Horario PNG'),
      title: tr(lang, 'مولّد جدول الجرعات', 'Dose Schedule Card', 'Planning Quotidien', 'Horario Diario'),
      desc: tr(
        lang,
        'صمم جدول مواعيد أدويتك كصورة ملونة جاهزة للطباعة أو واتساب',
        'Create a color-coded schedule card to save or share on WhatsApp'
      ),
      color: '#0d9488',
    },
    {
      to: '/compare',
      icon: '⚖️',
      badge: tr(lang, 'مقارنة علمية', 'Compare 2 Drugs', 'Comparer', 'Comparar'),
      title: tr(lang, 'مقارنة دواءين جنباً لجنب', 'Compare Two Medicines', 'Comparer Deux Médicaments', 'Comparar Medicamentos'),
      desc: tr(
        lang,
        'قارن المادة الفعالة، الأسعار، التحذيرات، وتكرار المكونات',
        'Side-by-side comparison of active ingredients, EGP prices, and warnings'
      ),
      color: '#4f46e5',
    },
    {
      to: '/games',
      icon: '🎮',
      badge: tr(lang, 'محاكاة 3D', '3D Simulator', 'Sim 3D', 'Sim 3D'),
      title: tr(lang, 'محاكي المستشفى 3D', '3D Hospital Simulator', 'Simulateur 3D', 'Simulador 3D'),
      desc: tr(
        lang,
        'تجول داخل المستشفى ثلاثي الأبعاد واختبر قراراتك الطبية',
        'Explore the 3D hospital ward and solve clinical scenarios'
      ),
      color: '#0e9aa7',
    },
  ];

  const featuredCategories: DawayaTherapeuticCategory[] = [
    'antibiotics',
    'analgesics_antipyretics',
    'respiratory_cold_allergy',
    'cardiovascular',
    'endocrine_diabetes',
    'gastrointestinal',
    'neurology_psychiatry',
    'vitamins_supplements',
    'dermatology_personal_care',
    'ophthalmology_ent',
  ];

  const featuredMeds = [
    {
      id: 'amoxicillin-clavulanic-acid',
      ar: 'أوجمنتين / هاي بيوتك (Augmentin)',
      en: 'Augmentin / Hibiotic',
      priceAr: 'بدائل تبدأ من 54 ج.م',
      priceEn: 'Generics from 54 EGP',
      cls: {
        ar: 'مضاد حيوي — بنسلين واسع المجال',
        en: 'Antibiotic — Broad-Spectrum Penicillin',
      },
    },
    {
      id: 'eg-1',
      ar: 'ون تو ثري شراب وأقراص (1 2 3)',
      en: '1 2 3 Cold & Flu Syrup / Tabs',
      priceAr: '40.00 ج.م (موسوعة دوايا)',
      priceEn: '40.00 EGP (DAWAYA DB)',
      cls: {
        ar: 'أدوية البرد والاحتقان وخافضات الحرارة',
        en: 'Cold, Sinus Congestion & Analgesic',
      },
    },
    {
      id: 'azithromycin',
      ar: 'زيثروماكس / زيثرون (Zithromax)',
      en: 'Zithromax / Xithrone',
      priceAr: 'بدائل تبدأ من 49 ج.م',
      priceEn: 'Generics from 49 EGP',
      cls: {
        ar: 'مضاد حيوي — ماكروليد',
        en: 'Antibiotic — Macrolide',
      },
    },
    {
      id: 'eg-13',
      ar: 'دانسيترون 4 مجم أمبولات (Dansetron)',
      en: 'Dansetron 4mg/2ml Ampoules',
      priceAr: '78.65 ج.م (موسوعة دوايا)',
      priceEn: '78.65 EGP (DAWAYA DB)',
      cls: {
        ar: 'مضاد للقيء والغثيان (أوندانسيترون)',
        en: 'Antiemetic (Ondansetron)',
      },
    },
    {
      id: 'eg-5',
      ar: 'ليمتلس لاكتوفيرين 100 مجم (Limitless)',
      en: 'Limitless Lactoferrin 100mg Sachets',
      priceAr: '485.00 ج.م (موسوعة دوايا)',
      priceEn: '485.00 EGP (DAWAYA DB)',
      cls: {
        ar: 'علاج الأنيميا ودعم المناعة والحديد',
        en: 'Iron Absorption & Immunity Support',
      },
    },
    {
      id: 'eg-19',
      ar: 'أبيليفاي / أبيليا (Abilify / Abilia)',
      en: 'Abilify / Abilia (Aripiprazole)',
      priceAr: 'من 105.00 ج.م (موسوعة دوايا)',
      priceEn: 'From 105.00 EGP (DAWAYA DB)',
      cls: {
        ar: 'الأعصاب والطب النفسي (أريبيبرازول)',
        en: 'Neurology & Psychiatry (Aripiprazole)',
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
          background: radial-gradient(circle at 85% 15%, rgba(0, 191, 208, 0.24), transparent 42%),
                      radial-gradient(circle at 12% 85%, rgba(36, 200, 184, 0.18), transparent 45%),
                      linear-gradient(145deg, #101E36 0%, #152746 58%, #0E1B31 100%);
          color: #ffffff;
          padding: 30px 0 36px;
          border-bottom-left-radius: 28px;
          border-bottom-right-radius: 28px;
          box-shadow: 0 18px 44px rgba(16, 30, 54, 0.28);
          position: relative;
          overflow: visible;
        }
        .modern-hero-inner {
          max-width: 840px;
          margin: 0 auto;
          text-align: center;
        }
        .modern-hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 191, 208, 0.16);
          border: 1px solid rgba(154, 232, 232, 0.38);
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 0.82rem;
          font-weight: 800;
          color: #9AE8E8;
          margin-bottom: 12px;
        }
        .modern-hero-title {
          font-size: clamp(1.55rem, 4.2vw, 2.4rem);
          font-weight: 900;
          margin: 0 0 10px;
          line-height: 1.3;
          color: #ffffff;
        }
        .modern-hero-sub {
          font-size: 0.96rem;
          color: #cbd5e1;
          margin: 0 auto 20px;
          max-width: 680px;
          line-height: 1.65;
        }
        .hero-live-search-wrap {
          position: relative;
          max-width: 720px;
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
          box-shadow: 0 14px 36px rgba(6, 24, 44, 0.34);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        [dir="rtl"] .hero-live-search-form {
          padding: 6px 14px 6px 8px;
        }
        .hero-live-search-form:focus-within {
          border-color: #24C8B8;
          box-shadow: 0 16px 42px rgba(0, 191, 208, 0.4);
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
        }
        .hero-live-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          inset-inline: 0;
          background: #ffffff;
          color: #101E36;
          border-radius: 20px;
          border: 1.5px solid #cbd5e1;
          box-shadow: 0 22px 50px rgba(16, 30, 54, 0.32);
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
          background: rgba(255, 255, 255, 0.12);
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
          border: 1.5px solid var(--line, #D3E4EA);
          background: var(--card-bg, #ffffff);
          color: var(--ink, #101E36);
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .bento-persona-pill.active {
          background: #00BFD0;
          color: #101E36;
          border-color: #00BFD0;
          box-shadow: 0 4px 12px rgba(0, 191, 208, 0.28);
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
          border: 1.5px solid var(--line, #D3E4EA);
          border-radius: 20px;
          padding: 16px;
          text-decoration: none;
          color: var(--ink, #101E36);
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
          color: var(--muted, #526B82);
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
        }
      `}</style>

      {/* 1. Premium Hero Section with DAWAYA Logo, Identity & Live 26,562+ Medicine Search */}
      <section className="modern-hero">
        <div className="wrap modern-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <DawayaLogo variant="horizontal" size={46} />
          </div>

          <div className="modern-hero-kicker">
            <span>🩺</span>
            <span>
              {tr(
                lang,
                'المنصة الرقمية الشاملة للرعاية الصحية والأمان الدوائي في مصر',
                'Comprehensive Digital Healthcare & Medication Safety Platform'
              )}
            </span>
          </div>

          <h1 className="modern-hero-title">
            {tr(
              lang,
              'ابحث في 26,562+ دواء مصري، افحص روشتتك، واحمِ صحتك بذكاء',
              'Search 26,562+ Egyptian Medicines, Screen Your Prescription & Protect Your Health'
            )}
          </h1>
          <p className="modern-hero-sub">
            {tr(
              lang,
              'منصة دوايا (DAWAYA) تجمع قاعدة بيانات الأدوية المصرية الكاملة بالأسعار والباركود، محرك الأمان الدوائي وفحص الحساسية وتكرار المادة الفعالة، رادار الروشتة 24 ساعة، والمساعد الطبي الذكي.',
              'DAWAYA combines the complete 26,562+ Egyptian medicine database, Central Medication Safety Engine, Prescription Radar, Personal Health Profile, Green Prescription, and AI Assistant.'
            )}
          </p>

          {/* Live Autocomplete Search Bar across all 26,562+ medicines */}
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
                  'ابحث في 26,562+ دواء بالاسم التجاري، المادة الفعالة، التركيز أو الباركود...',
                  'Search 26,562+ medicines by brand name, active ingredient, strength, or barcode...'
                )}
                aria-label={tr(lang, 'ابحث في موسوعة دوايا', 'Search DAWAYA medicines')}
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

              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`hero-action-icon-btn${isListening ? ' listening' : ''}`}
                title={tr(lang, 'ابحث بصوتك', 'Voice search')}
                aria-label={tr(lang, 'ابحث بصوتك', 'Voice search')}
              >
                🎤
              </button>

              <Link
                to="/scan"
                className="hero-action-icon-btn"
                title={tr(lang, 'مسح الباركود أو QR بالكاميرا', 'Scan barcode or QR with camera')}
                aria-label={tr(lang, 'مسح الباركود بالكاميرا', 'Scan barcode')}
              >
                📷
              </Link>
            </form>

            {focused && q.trim().length >= 2 && (
              <div className="hero-live-dropdown" role="listbox">
                {quickMatches.length > 0 ? (
                  <>
                    {quickMatches.map((item) => (
                      <Link
                        key={item.id}
                        to={`/medicine/${item.id}`}
                        className="hero-live-item"
                        onClick={() => setFocused(false)}
                      >
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.93rem', color: '#101E36' }}>
                            {isAr ? item.titleAr : item.titleEn}{' '}
                            {item.price ? (
                              <span style={{ color: '#008B99', fontWeight: 800 }}>
                                — {item.price} {isAr ? 'ج.م' : 'EGP'}
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#526B82' }}>{item.sub}</div>
                        </div>
                        <span
                          style={{
                            background: '#E0F7FA',
                            color: '#008B99',
                            border: '1px solid #9AE8E8',
                            borderRadius: '999px',
                            padding: '3px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {isAr ? item.badgeAr : item.badgeEn}
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
                        {tr(lang, 'عرض كل النتائج في موسوعة دوايا (26,562+) ←', 'See all matches in DAWAYA (26,562+) →')}
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
                          color: '#526B82',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        {tr(lang, 'بحث شامل ⌕', 'Spotlight ⌕')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.86rem', color: '#526B82' }}>
                    {tr(lang, 'اضغط للبحث الشامل في 26,562+ دواء:', 'Search full 26,562+ medicine index:')}{' '}
                    <Link
                      to={`/medicines?q=${encodeURIComponent(q.trim())}`}
                      style={{
                        background: '#00BFD0',
                        color: '#101E36',
                        borderRadius: '999px',
                        padding: '4px 12px',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        marginInlineStart: '6px',
                      }}
                    >
                      {tr(lang, 'بحث في كل الأدوية', 'Search All Medicines')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Quick Access Pill Tags under Search Bar */}
            <div className="hero-quick-tags">
              <Link to="/patient-dashboard" className="hero-quick-tag">
                📊 {tr(lang, 'لوحة المريض الموحدة', 'Patient Dashboard')}
              </Link>
              <Link to="/medicines" className="hero-quick-tag">
                💊 {tr(lang, 'موسوعة الأدوية (26,562+)', 'All 26,562+ Medicines')}
              </Link>
              <Link to="/prescription-radar" className="hero-quick-tag">
                📡 {tr(lang, 'رادار الروشتة 24س', 'Prescription Radar')}
              </Link>
              <Link to="/allergy-checker" className="hero-quick-tag">
                🛡️ {tr(lang, 'فاحص الحساسية والأمان', 'Safety & Allergy Engine')}
              </Link>
              <Link to="/assistant" className="hero-quick-tag">
                🤖 {tr(lang, 'مساعد دوايا الذكي', 'DAWAYA AI')}
              </Link>
              <Link to="/pharmacies" className="hero-quick-tag">
                🏥 {tr(lang, 'الصيدليات القريبة', 'Nearby Pharmacies')}
              </Link>
            </div>
          </div>

          {/* Real-Time Platform Metrics Strip */}
          <div className="pro-metrics-strip" style={{ marginTop: '16px' }}>
            <div className="pro-metric-item">
              <strong>{(importReport?.totalRecordsFound || totalCount).toLocaleString()}+</strong>
              <span>{tr(lang, 'دواء مسجل بموسوعة دوايا', 'Medicines in DAWAYA DB')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{(importReport?.uniqueActiveIngredientCombinations || 8991).toLocaleString()}</strong>
              <span>{tr(lang, 'تركيبة ومادة فعالة', 'Active Ingredient Profiles')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{(importReport?.verifiedBarcodesCount || 10525).toLocaleString()}+</strong>
              <span>{tr(lang, 'باركود دوائي موثق', 'Verified Drug Barcodes')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{(importReport?.uniqueManufacturersCount || 5303).toLocaleString()}</strong>
              <span>{tr(lang, 'شركة ومصنع دوائي', 'Pharma Manufacturers')}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap stack" style={{ marginTop: '24px' }}>
        {/* 2. Therapeutic Categories Explorer (All Medicine Categories + Preserved Antibiotics) */}
        <section className="dawaya-section-card">
          <div className="head" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                🧬 {tr(lang, 'تصفح موسوعة دوايا حسب التخصص والفئة العلاجية', 'Explore Medicines by Therapeutic Category')}
              </h2>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {tr(
                  lang,
                  'تغطي منصة دوايا جميع الفئات الدوائية في السوق المصري (26,562+ مستحضر) مع الحفاظ الكامل على موسوعة المضادات الحيوية السريرية:',
                  'DAWAYA covers all pharmaceutical categories in Egypt (26,562+ products) while preserving the specialized Antibiotic Stewardship encyclopedia:'
                )}
              </p>
            </div>
            <Link to="/medicines" className="btn small">
              {tr(lang, 'تصفح كل الفئات (26,562+) ←', 'Browse All 26,562+ Medicines →')}
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(205px, 1fr))',
              gap: '10px',
            }}
          >
            {featuredCategories.map((catKey) => {
              const meta = DAWAYA_CATEGORY_LABELS[catKey];
              const count =
                importReport?.therapeuticCategoryBreakdown?.[catKey]?.count ??
                (catKey === 'antibiotics' ? 912 : undefined);
              return (
                <Link
                  key={catKey}
                  to={`/medicines?cat=${encodeURIComponent(catKey)}`}
                  className="card"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    borderInlineStart: '4px solid #00BFD0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.45rem' }} aria-hidden="true">{meta.icon}</span>
                    <div>
                      <b style={{ fontSize: '0.88rem', display: 'block', lineHeight: 1.3 }}>
                        {isAr ? meta.ar : meta.en}
                      </b>
                      {count !== undefined && (
                        <span className="small muted">
                          {count.toLocaleString()} {isAr ? 'دواء' : 'medicines'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 3. Platform Features Bento Grid with Persona Filter */}
        <section className="pro-tools-section">
          <div className="bento-persona-bar">
            <div>
              <h2 style={{ fontSize: '1.28rem', margin: 0 }}>
                {tr(lang, 'منظومة خدمات دوايا الذكية | Platform Features', 'DAWAYA Smart Healthcare Services')}
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
                all: ['/patient-dashboard', '/complete-checkup', '/prescription-radar', '/allergy-checker', '/cost-saver', '/green-prescription', '/pediatric-helper', '/tracker'],
                patient: ['/patient-dashboard', '/complete-checkup', '/cost-saver', '/green-prescription', '/daily-schedule', '/tracker'],
                mother: ['/pediatric-helper', '/allergy-checker', '/green-prescription', '/complete-checkup', '/daily-schedule', '/games'],
                doctor: ['/prescription-radar', '/compare', '/allergy-checker', '/complete-checkup', '/games', '/cost-saver'],
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

        {/* 4. Core Pillar Highlights: Medication Safety, Health Profile, Prescription Radar & AI Assistant */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Medication Safety Pillar */}
          <div className="dawaya-section-card stack" style={{ borderTop: '4px solid #00BFD0' }}>
            <div className="row" style={{ gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>🛡️</span>
              <h3 style={{ margin: 0 }}>
                {isAr ? 'محرك الأمان الدوائي المركزي' : 'Central Medication Safety Engine'}
              </h3>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'يكتشف تلقائياً تكرار المادة الفعالة بين الأسماء التجارية المختلفة، الحساسية المتصالبة، التفاعلات الدوائية، وتحذيرات الحمل والرضاعة والضغط والسكري والكلى والكبد والقلب.'
                : 'Detects duplicate active ingredients across different brand names, drug allergies, interactions, and condition contraindications (pregnancy, lactation, BP, diabetes, renal, hepatic, cardiac).'}
            </p>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              <Link to="/allergy-checker" className="btn small">
                {isAr ? 'فحص الأمان والحساسية' : 'Check Safety & Allergies'}
              </Link>
              <Link to="/interactions" className="btn small ghost">
                {isAr ? 'فحص التفاعلات' : 'Check Interactions'}
              </Link>
            </div>
          </div>

          {/* Personal Health Profile & Prescription Management Pillar */}
          <div className="dawaya-section-card stack" style={{ borderTop: '4px solid #24C8B8' }}>
            <div className="row" style={{ gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>👤</span>
              <h3 style={{ margin: 0 }}>
                {isAr ? 'الملف الصحي ورادار الروشتة' : 'Personal Health Profile & Rx Radar'}
              </h3>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'احتفظ بسجل حساسيتك، أمراضك المزمنة، أدويتك الحالية والسابقة، وارفع صورة روشتتك لمراجعتها وتحويلها لجدول جرعات ذكي مع منبهات.'
                : 'Maintain your allergies, chronic conditions, current/past medicines, and upload prescription photos to review and schedule 24h reminders.'}
            </p>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              <Link to="/health-profile" className="btn small">
                {isAr ? 'ملفي الصحي وبطاقة QR' : 'My Health Profile'}
              </Link>
              <Link to="/prescription-radar" className="btn small ghost">
                {isAr ? 'رادار الروشتة' : 'Prescription Radar'}
              </Link>
            </div>
          </div>

          {/* DAWAYA AI Assistant Pillar */}
          <div
            className="dawaya-section-card stack"
            style={{
              background: 'linear-gradient(135deg, #101E36 0%, #162A4A 100%)',
              color: '#FFFFFF',
              borderTop: '4px solid #9AE8E8',
            }}
          >
            <div className="row" style={{ gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>🤖</span>
              <h3 style={{ margin: 0, color: '#FFFFFF' }}>
                {isAr ? 'مساعد دوايا الذكي (DAWAYA AI)' : 'DAWAYA AI Assistant'}
              </h3>
            </div>
            <p className="small" style={{ margin: 0, color: '#9AE8E8' }}>
              {isAr
                ? 'ابحث عن أي دواء، حلل صور الروشتات، افحص تكرار المادة الفعالة، أو اطلب إضافة دواء أو منبه لملفك الصحي مع بطاقة مراجعة وتأكيد آمنة.'
                : 'Look up any medicine, analyze prescription images, check duplicate ingredients, or add medicines and reminders to your profile with explicit confirmation.'}
            </p>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              <Link
                to="/assistant"
                className="btn small"
                style={{ background: '#00BFD0', borderColor: '#00BFD0', color: '#101E36', fontWeight: 800 }}
              >
                {isAr ? 'تحدث مع مساعد دوايا الآن' : 'Launch DAWAYA AI'}
              </Link>
              <Link to="/patient-dashboard" className="btn small light">
                {isAr ? 'لوحة المريض' : 'Patient Dashboard'}
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Featured Medicines Across Categories */}
        <section className="card highlight-card pro-featured-section">
          <div className="head" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                🇪🇬 {tr(lang, 'نماذج من الأدوية والمضادات الحيوية في موسوعة دوايا', 'Featured Medicines & Antibiotics in DAWAYA')}
              </h2>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {tr(
                  lang,
                  'اضغط على أي دواء لعرض الصفحة التفصيلية الكاملة، المكونات الفعالة، التحذيرات السريرية، والبدائل:',
                  'Tap any medicine to open its complete clinical detail page, active ingredients, warnings, and equivalents:'
                )}
              </p>
            </div>
            <Link to="/medicines" className="btn ghost small">
              {tr(lang, 'كل الأدوية (26,562+) ←', 'All 26,562+ Medicines →')}
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
                  {isAr ? fm.cls.ar : fm.cls.en}
                </p>
                <span className="more" style={{ fontSize: '0.82rem' }}>
                  {tr(lang, 'التفاصيل والتحذيرات والبدائل ←', 'Clinical Details, Warnings & Generics →')}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 6. Nearby Pharmacies & Healthcare Partners Section */}
        <PublicPartnerPlacementSection placement="homepage_featured" />

        {/* 7. Health Education, Articles, Quiz & Preserved Antibiotic Resistance Map */}
        <section className="dawaya-section-card">
          <div className="head" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                📚 {isAr ? 'التثقيف الصحي والوعي الدوائي' : 'Health Education & Medication Awareness'}
              </h2>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'مقالات طبية موثقة، الروشتة الخضراء للرعاية غير الدوائية، واختبارات تفاعلية:'
                  : 'Verified medical articles, non-pharmacological Green Prescription guides, and interactive quizzes:'}
              </p>
            </div>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              <Link to="/articles" className="btn small ghost">{t('seeAll')}</Link>
              <Link to="/quiz" className="btn small">{t('startQuiz')}</Link>
            </div>
          </div>

          <div className="grid">
            {ARTICLES.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/articles/${a.id}`} className="card link">
                <h3>{pick(a.title, lang)}</h3>
                <p className="small muted">{pick(a.summary, lang)}</p>
                <span className="more">{t('read')} →</span>
              </Link>
            ))}
          </div>
        </section>

        <Suspense fallback={null}>
          <EgyptResistanceMap />
        </Suspense>

        <DidYouKnow />
        <ResistanceCounter />
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
