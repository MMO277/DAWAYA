import { DawayaIconMark } from './DawayaLogo';
import {
  CapsuleGlobeLangIcon,
  DawayaRouteVectorIcon,
  HeroScannerVectorIcon,
  CapsuleMoonIcon,
  CapsuleSignOutIcon,
  CapsuleUserGuestIcon,
  NavAiSimVectorIcon,
  NavBookSourcesVectorIcon,
  NavCapsuleVectorIcon,
  NavDashboardVectorIcon,
  NavHomeVectorIcon,
  NavLeafCareVectorIcon,
  NavRadarVectorIcon,
  NavShieldSafetyVectorIcon,
} from './DawayaVectorIcons';
import AppUpdateManager, { triggerUpdateCheckerManually } from "./AppUpdateManager";
import OnboardingTour, { triggerOnboardingTourManually } from "./OnboardingTour";
import { GlobalPhoneAlarmOverlay } from './SmartDoseAlarmCard';
import { lazy, Suspense, ReactNode, useRef, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang, SUPPORTED_LANGS } from './i18n';
import { Lang, localizeFallbackText, tr } from './types';
import { useAuth } from './authContext';
import Disclaimer from './Disclaimer';
import { useEmergencyLocation } from './emergencyLocation';

const GlobalSpotlightModal = lazy(() =>
  import('./SmartPersonaAndSpotlight').then((m) => ({ default: m.GlobalSpotlightModal }))
);
const ChatWidget = lazy(() => import('./ChatWidget'));
const LogoutModal = lazy(() => import('./LogoutModal'));

let hasEverUsedSecondaryDomTranslation = false;

// ── Safe, Zero-DOM-Mutation Universal Page TextNode & Attribute Localizer (FR / ES) ──
const textNodeState = new WeakMap<Text, { baseEn: string; lastOut: string }>();
const attrState = new WeakMap<Element, Record<string, { baseEn: string; lastOut: string }>>();
const translationMemoryCache = new Map<string, string>();

function getCachedTranslation(lang: Lang, text: string): string | null {
  const key = `${lang}::${text}`;
  if (translationMemoryCache.has(key)) return translationMemoryCache.get(key)!;
  try {
    const saved = sessionStorage.getItem(`aa_tr_${key}`);
    if (saved) {
      translationMemoryCache.set(key, saved);
      return saved;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedTranslation(lang: Lang, text: string, translated: string): void {
  const key = `${lang}::${text}`;
  translationMemoryCache.set(key, translated);
  try {
    sessionStorage.setItem(`aa_tr_${key}`, translated);
  } catch {
    /* ignore */
  }
}

async function fetchNeuralTranslation(text: string, targetLang: 'fr' | 'es' | 'de'): Promise<string | null> {
  const cached = getCachedTranslation(targetLang, text);
  if (cached) return cached;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const joined = data[0].map((part: unknown) => (Array.isArray(part) ? String(part[0] || '') : '')).join('');
      if (joined.trim()) {
        setCachedTranslation(targetLang, text, joined);
        return joined;
      }
    }
  } catch {
    /* offline or blocked — fallback stays active */
  }
  return null;
}

function shouldTranslateString(s: string): boolean {
  const trimmed = s.trim();
  if (trimmed.length < 2) return false;
  // Skip if it contains Arabic characters
  if (/[\u0600-\u06FF]/.test(trimmed)) return false;
  // Must contain at least one 2+ letter Latin word
  if (!/[A-Za-z]{2,}/.test(trimmed)) return false;
  // Skip pure URLs or codes
  if (/^(https?:\/\/|www\.|[0-9.\-/:+%]+$)/i.test(trimmed)) return false;
  return true;
}

function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {
      /* ignore */
    }
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

interface NavItem {
  to: string;
  key: string;
  icon: string;
  shortLabel: string;
}

interface NavCategory {
  id: string;
  icon: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  items: NavItem[];
}

function isRouteMatchingItem(itemTo: string, currentPath: string): boolean {
  if (itemTo === '/') return currentPath === '/';
  if (itemTo === '/medicines') {
    return currentPath === '/medicines' || currentPath.startsWith('/medicine/');
  }
  if (itemTo === '/articles') {
    return currentPath === '/articles' || currentPath.startsWith('/articles/');
  }
  if (itemTo === '/games') {
    return (
      currentPath === '/games' ||
      [
        '/game',
        '/open-world',
        '/medical-simulator',
        '/nurse-academy',
        '/medical-mystery',
        '/bacteria-lab',
        '/emergency-shift',
        '/escape-the-lab',
      ].includes(currentPath)
    );
  }
  return currentPath === itemTo || currentPath.startsWith(`${itemTo}/`);
}


function SmartOfflineStatusBanner({ lang }: { lang: string }) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine !== false : true
  );
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const onOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };
    const onOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      window.setTimeout(() => setJustReconnected(false), 3500);
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (isOnline && !justReconnected) return null;
  const isAr = lang === 'ar';

  return (
    <div
      role="status"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: isOnline
          ? 'linear-gradient(90deg, #059669 0%, #0d9488 100%)'
          : 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        borderBottom: isOnline ? '1px solid #34d399' : '1px solid #14b8a6',
        padding: '8px 14px',
        fontSize: '0.84rem',
        fontWeight: 700,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        zIndex: 90,
      }}
    >
      {isOnline ? (
        <span>
          🌐 {isAr ? 'عاد الاتصال بالإنترنت — تمت المزامنة السحابية تلقائياً ✓' : 'Back online — Cloud sync restored automatically ✓'}
        </span>
      ) : (
        <span>
          ⚡ {isAr ? 'وضع الأوفلاين الفوري نشط في دوايا (DAWAYA) — قاعدة بيانات الأدوية (26,562+) والأدوات السريرية والمنبهات تعمل بكامل سرعتها' : 'DAWAYA Instant Offline Mode Active — 26,562+ medicines, clinical safety tools & alarms work offline'}
        </span>
      )}
    </div>
  );
}


import { evaluateMedicationSafety } from './medicationSafetyEngine';
import { useSyncedHealthProfile } from './allergyData';
import { useSyncedSchedules } from './trackerData';

function SmartCrossClinicSafetyBanner() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { profile } = useSyncedHealthProfile();
  const { schedules } = useSyncedSchedules();

  const safetyResult = useMemo(() => {
    const rawMeds = [
      ...(profile.medications || []).map((m) => ({ id: m.drugId, rawName: m.drugName })),
      ...(schedules || []).map((s) => ({ id: s.medicineId, rawName: s.medicineName })),
    ];
    if (rawMeds.length < 2) return null;
    return evaluateMedicationSafety(rawMeds, profile);
  }, [profile, schedules]);

  if (!safetyResult || !safetyResult.hasIssues) return null;

  const topIssue = safetyResult.issues[0];
  return (
    <div
      className="no-print"
      style={{
        background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
        color: '#ffffff',
        padding: '10px 16px',
        margin: '0 auto 12px',
        maxWidth: '1200px',
        borderRadius: '14px',
        boxShadow: '0 6px 18px rgba(185, 28, 28, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        zIndex: 8900,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.4rem' }}>🚨</span>
        <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>
          {isAr
            ? `تنبيه تعارض دوائي ذكي بين أدويتك الحالية: ${topIssue.titleAr || topIssue.titleEn}`
            : `Cross-Medication Interaction Alert: ${topIssue.titleEn}`}
        </div>
      </div>
      <Link
        to="/interactions"
        style={{
          background: '#ffffff',
          color: '#991b1b',
          fontWeight: 900,
          padding: '5px 12px',
          borderRadius: '10px',
          textDecoration: 'none',
          fontSize: '0.82rem',
        }}
      >
        {isAr ? 'افحص التعارض فوراً ←' : 'Review Interaction ←'}
      </Link>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useLang();
  const { emergency, countryName } = useEmergencyLocation();
  const isAr = lang === 'ar';
  const pageDir: 'rtl' | 'ltr' = isAr ? 'rtl' : 'ltr';
  const { pathname } = useLocation();
  const { dark, toggle } = useDarkMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [openRibbonCatId, setOpenRibbonCatId] = useState<string | null>(null);
  const [openDrawerGroups, setOpenDrawerGroups] = useState<Record<string, boolean>>({});
  const authCtx = useAuth();
  const user = authCtx.user;
  const openAuthModal = authCtx.openAuthModal;

  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const ribbonWrapRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const currentLangMeta = SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0];

  const navCategories: NavCategory[] = [
    {
      id: 'drug-directory',
      icon: '💊',
      title: tr(lang, 'الدليل والبحث الدوائي', 'Drug Directory & Scanner', 'Répertoire & Scanner', 'Directorio y Escáner', 'Arzneimittelverzeichnis & Scanner'),
      shortTitle: tr(lang, 'الدليل والأدوية', 'Drug Directory', 'Médicaments', 'Medicamentos', 'Medikamente'),
      subtitle: tr(
        lang,
        'موسوعة دوايا الشاملة (26,562+ دواء)، فحص الباركود، والبدائل، والصيدليات',
        '26,562+ medicines database, barcode scanner, generics & pharmacies',
        'Base de 26 562+ médicaments, scanner & génériques',
        'Base de 26.562+ medicamentos, escáner y genéricos'
      ),
      items: [
        {
          to: '/medicines',
          key: 'navMedicines',
          icon: '💊',
          shortLabel: tr(lang, 'موسوعة الأدوية (26,562+)', 'Medicines (26,562+)', 'Médicaments (26 562+)', 'Medicamentos (26.562+)'),
        },
        {
          to: '/scan',
          key: 'navScan',
          icon: '📷',
          shortLabel: tr(lang, 'مسح الباركود و QR', 'Scan Barcode', 'Scanner Code', 'Escanear Código'),
        },
        {
          to: '/cost-saver',
          key: '',
          icon: '💰',
          shortLabel: tr(lang, 'حاسبة البديل الأرخص بنفس الكفاءة', 'Generic Cost Saver', 'Économiseur Générique', 'Ahorro en Genéricos', 'Generika-Kostenrechner'),
        },
        {
          to: '/partners',
          key: '',
          icon: '🏥',
          shortLabel: tr(lang, 'شبكة الصيدليات والشركاء', 'Pharmacies & Partners', 'Pharmacies & Partenaires', 'Farmacias y Socios', 'Apotheken & Partner'),
        },
        {
          to: '/compare',
          key: 'navCompare',
          icon: '⚖️',
          shortLabel: tr(lang, 'مقارنة دواءين', 'Compare Drugs', 'Comparer', 'Comparar'),
        },
      ],
    },
    {
      id: 'specialty-clinics',
      icon: '🏥',
      title: tr(lang, 'مجمع العيادات التخصصية (20 عيادة)', 'Specialty Medical Clinics (20 Clinics)', 'Cliniques Spécialisées', 'Clínicas Especializadas'),
      shortTitle: tr(lang, 'العيادات التخصصية', 'Specialty Clinics', 'Cliniques', 'Clínicas'),
      subtitle: tr(
        lang,
        'عيادة النساء والحمل، الأطفال، العظام والنقرس، الجهاز الهضمي، الجلدية والحروق، الأسنان، أنيميا الفول، والباطنة',
        'Ob-Gyn, Pediatrics, Orthopedics, Gastro, Dermatology, Dental ER, G6PD & Internal Medicine'
      ),
      items: [
        {
          to: '/clinics',
          key: '',
          icon: '🏥',
          shortLabel: tr(lang, 'بوابة جميع العيادات (20 عيادة)', 'All Specialty Clinics Hub', 'Toutes les Cliniques', 'Todas las Clínicas'),
        },
        {
          to: '/pregnancy-guide',
          key: '',
          icon: '🤰',
          shortLabel: tr(lang, 'عيادة النساء والحمل والرضاعة', 'Ob-Gyn & Pregnancy Clinic', 'Clinique Grossesse', 'Clínica Embarazo'),
        },
        {
          to: '/baby-first-year',
          key: '',
          icon: '👶',
          shortLabel: tr(lang, 'عيادة الأطفال وحديثي الولادة', 'Pediatrics & Newborn Clinic', 'Clinique Pédiatrique', 'Clínica Pediátrica'),
        },
        {
          to: '/ortho-clinic',
          key: '',
          icon: '🦴',
          shortLabel: tr(lang, 'عيادة العظام والغضروف والنقرس', 'Orthopedics, Spine & Gout', 'Clinique Orthopédique', 'Clínica Ortopédica'),
        },
        {
          to: '/gastro-clinic',
          key: '',
          icon: '🦠',
          shortLabel: tr(lang, 'عيادة الجهاز الهضمي والقولون', 'Gastro, H. Pylori & IBS', 'Clinique Gastro', 'Clínica Digestiva'),
        },
        {
          to: '/derma-clinic',
          key: '',
          icon: '🩹',
          shortLabel: tr(lang, 'عيادة الجلدية والحروق والجروح', 'Dermatology, Burns & Wounds', 'Clinique Dermatologie', 'Clínica Dermatología'),
        },
        {
          to: '/dental-clinic',
          key: '',
          icon: '🦷',
          shortLabel: tr(lang, 'عيادة طوارئ الأسنان واللثة', 'Dental Emergency Clinic', 'Urgences Dentaires', 'Urgencias Dentales'),
        },
        {
          to: '/g6pd-clinic',
          key: '',
          icon: '🫘',
          shortLabel: tr(lang, 'عيادة أنيميا الفول (G6PD)', 'G6PD Favism Clinic', 'Clinique G6PD', 'Clínica G6PD'),
        },
        {
          to: '/chronic-clinic',
          key: '',
          icon: '🫀',
          shortLabel: tr(lang, 'عيادة الباطنة والسكر والضغط', 'Diabetes, BP & Anticoagulants', 'Médecine Interne', 'Medicina Interna'),
        },
        {
          to: '/eye-clinic',
          key: '',
          icon: '👁️',
          shortLabel: tr(lang, 'عيادة العيون وطوارئ القرنية', 'Ophthalmology & Eye Clinic', 'Clinique Ophtalmologique', 'Clínica Oftalmológica'),
        },
        {
          to: '/ent-clinic',
          key: '',
          icon: '👂',
          shortLabel: tr(lang, 'عيادة الأنف والأذن والدوار', 'ENT, Sinus & Vertigo Clinic', 'Clinique ORL', 'Clínica ORL'),
        },
        {
          to: '/lab-clinic',
          key: '',
          icon: '🔬',
          shortLabel: tr(lang, 'عيادة ترجمة التحاليل الطبية', 'Smart Lab Test Decoder', 'Analyses Médicales', 'Análisis Clínicos'),
        },
        {
          to: '/urology-clinic',
          key: '',
          icon: '🧪',
          shortLabel: tr(lang, 'عيادة الكلى والمسالك والبروستاتا', 'Urology, Stones & Renal Clinic', 'Urologie & Reins', 'Urología y Riñón'),
        },
        {
          to: '/neuro-clinic',
          key: '',
          icon: '🧠',
          shortLabel: tr(lang, 'عيادة المخ والأعصاب والصداع', 'Neurology, Migraine & Stroke', 'Neurologie & Migraine', 'Neurología y Migraña'),
        },
        {
          to: '/poison-clinic',
          key: '',
          icon: '🚑',
          shortLabel: tr(lang, 'عيادة السموم والإسعافات الأولية', 'Poison Control & First-Aid ER', 'Centre Antipoison', 'Toxicología y Urgencias'),
        },
        {
          to: '/body-map',
          key: '',
          icon: '🧍‍♂️',
          shortLabel: tr(lang, 'خريطة الجسم التفاعلية (اضغط مكان الوجع)', 'Interactive Body Symptom Map', 'Carte du Corps', 'Mapa Corporal'),
        },
        {
          to: '/food-drug-checker',
          key: '',
          icon: '☕',
          shortLabel: tr(lang, 'فاحص الأكل والشرب مع الأدوية', 'Food & Drink vs. Meds Checker', 'Aliments & Médicaments', 'Alimentos y Medicamentos'),
        },
        {
          to: '/lab-photo-scanner',
          key: '',
          icon: '📸',
          shortLabel: tr(lang, 'قارئ صور التحاليل والروشتات الذكي', 'AI Lab & Rx Photo Scanner', 'Scanner Analyses', 'Escáner de Análisis'),
        },
        {
          to: '/organ-simulator',
          key: '',
          icon: '🫀',
          shortLabel: tr(lang, 'محاكي أثر الدواء داخل أعضاء الجسم', 'Visual Organ Drug Simulator', 'Simulateur d’Organes', 'Simulador de Órganos'),
        },
        {
          to: '/symptom-triage',
          key: '',
          icon: '🩺',
          shortLabel: tr(lang, 'مشخص الأعراض الذكي (اكشف فين؟)', 'Smart Symptom Triage', 'Triage Symptômes', 'Triaje de Síntomas'),
        },
        {
          to: '/missed-dose-rescue',
          key: '',
          icon: '🚨',
          shortLabel: tr(lang, 'إنقاذ الجرعة المنسية', 'Missed Dose Rescue', 'Dose Oubliée', 'Dosis Olvidada'),
        },
        {
          to: '/doctor-visit-prep',
          key: '',
          icon: '📋',
          shortLabel: tr(lang, 'مُحضّر كشف الدكتور', 'Doctor Visit Prep', 'Prépa Consultation', 'Prep Consulta'),
        },
        {
          to: '/vaccine-tracker',
          key: '',
          icon: '💉',
          shortLabel: tr(lang, 'رادار تطعيمات الأطفال', 'Vaccine Tracker', 'Vaccins Enfants', 'Vacunas Infantiles'),
        },
        {
          to: '/medical-report',
          key: '',
          icon: '📄',
          shortLabel: tr(lang, 'التقرير الطبي الشامل (PDF)', 'Medical Report (PDF)', 'Rapport Médical', 'Informe Médico'),
        },
        {
          to: '/meal-planner',
          key: '',
          icon: '🥗',
          shortLabel: tr(lang, 'مُولّد وجبات السكر والضغط والكلى', 'Chronic Disease Meal Planner', 'Générateur Repas', 'Planificador Comidas'),
        },
        {
          to: '/nutrition-clinic',
          key: '',
          icon: '🥗',
          shortLabel: tr(lang, 'عيادة التغذية وحقن التخسيس', 'Clinical Nutrition & GLP-1', 'Nutrition & GLP-1', 'Nutrición y GLP-1'),
        },
        {
          to: '/women-clinic',
          key: '',
          icon: '🌸',
          shortLabel: tr(lang, 'عيادة صحة المرأة وتكيس المبايض', 'Women’s Health & PCOS', 'Santé des Femmes', 'Salud Femenina'),
        },
        {
          to: '/geriatric-clinic',
          key: '',
          icon: '👴',
          shortLabel: tr(lang, 'عيادة المسنين وقرح الفراش', 'Geriatric & Bedsore Care', 'Gériatrie & Escarres', 'Geriatría y Úlceras'),
        },
        {
          to: '/hair-clinic',
          key: '',
          icon: '💇‍♀️',
          shortLabel: tr(lang, 'عيادة الشعر والصلع والبشرة', 'Hair Loss & Skincare Clinic', 'Cheveux & Peau', 'Cabello y Piel'),
        },
        {
          to: '/chest-clinic',
          key: '',
          icon: '🫁',
          shortLabel: tr(lang, 'عيادة الصدر والربو وجلسات البخار', 'Chest, Asthma & Nebulizer', 'Pneumologie & Asthme', 'Neumología y Asma'),
        },


      ],
    },
    {
      id: 'clinical-safety',
      icon: '🏥',
      title: tr(lang, 'أدوات الأمان والفحص السريري', 'Clinical Safety & Checkers', 'Sécurité Clinique & Contrôles', 'Seguridad Clínica y Chequeo', 'Klinische Sicherheit & Prüfungen'),
      shortTitle: tr(lang, 'الفحص والأمان السريري', 'Clinical Safety', 'Sécurité Clinique', 'Seguridad Clínica', 'Klinische Sicherheit'),
      subtitle: tr(
        lang,
        'فاحص الحساسية، التداخلات، رادار الروشتة، وحاسبة الأطفال',
        'Allergy check, interactions, Rx radar & pediatric dosing',
        'Allergies, interactions, radar Rx & posologie pédiatrique',
        'Alergias, interacciones, radar Rx y dosis pediátrica'
      ),
      items: [
        {
          to: '/pregnancy-guide',
          key: '',
          icon: '🤰',
          shortLabel: tr(lang, 'دليل سلامة الحامل', 'Pregnancy Safety Hub', 'Sécurité Grossesse', 'Seguridad Embarazo'),
        },
        {
          to: '/baby-first-year',
          key: '',
          icon: '👶',
          shortLabel: tr(lang, 'عيادة أول سنة مع طفلك', 'Newborn & 1st Year Hub', 'Clinique Bébé 1 An', 'Clínica del Bebé'),
        },

        {
          to: '/allergy-checker',
          key: 'navAllergyChecker',
          icon: '🛡️',
          shortLabel: tr(lang, 'فاحص الحساسية', 'Allergy Check', 'Allergies', 'Alergias'),
        },
        {
          to: '/interactions',
          key: 'navInteractions',
          icon: '⚡',
          shortLabel: tr(lang, 'فاحص التداخلات', 'Interactions', 'Interactions', 'Interacciones'),
        },
        {
          to: '/complete-checkup',
          key: 'navOneClickCheckup',
          icon: '⚡',
          shortLabel: tr(lang, 'الفحص الشامل 1-Click', '1-Click Checkup', 'Bilan 1-Clic', 'Chequeo 1-Clic'),
        },
        {
          to: '/prescription-radar',
          key: 'navRadar',
          icon: '📡',
          shortLabel: tr(lang, 'رادار الروشتة 24س', 'Rx Radar 24h', 'Radar Rx 24h', 'Radar Rx 24h'),
        },
        {
          to: '/pediatric-helper',
          key: 'navPediatric',
          icon: '👶',
          shortLabel: tr(lang, 'حاسبة الأطفال', 'Pediatrics', 'Pédiatrie', 'Pediatría'),
        },
        {
          to: '/cold-shot-warning',
          key: 'navColdShot',
          icon: '💉',
          shortLabel: tr(lang, 'تحذير «حقنة البرد / الخلطة 3×1»', 'Cold Shot 3-in-1 Warning', 'Alerte Injection Rhume 3-en-1', 'Alerta Inyección 3 en 1'),
        },
        {
          to: '/side-effects',
          key: 'navSideEffects',
          icon: '🚨',
          shortLabel: tr(lang, 'الأعراض الجانبية والطوارئ', 'Side Effects', 'Effets Secondaires', 'Efectos Secundarios'),
        },
        {
          to: '/airport-banned-meds',
          key: '',
          icon: '✈️',
          shortLabel: tr(lang, 'أدوية المطارات والجمارك', 'Airport Banned Meds', 'Aéroports & Douane', 'Fármacos Prohibidos Viajes'),
        },
        {
          to: '/baby-milk',
          key: '',
          icon: '🍼',
          shortLabel: tr(lang, 'دليل وبدائل حليب الأطفال', 'Baby Milk Formulas', 'Laits Bébé & Substituts', 'Fórmulas Infantiles'),
        },
        {
          to: '/steroid-taper',
          key: '',
          icon: '📉',
          shortLabel: tr(lang, 'سحب الكورتيزون الآمن', 'Steroid Tapering Plan', 'Sevrage Corticoïdes', 'Reducción Cortisona'),
        },
        {
          to: '/hypo-rescue',
          key: '',
          icon: '🚨',
          shortLabel: tr(lang, 'إنقاذ هبوط السكر (قاعدة 15)', 'Hypo Rescue Plan (Rule 15)', 'Sauvetage Hypoglycémie', 'Rescate Hipoglucemia'),
        },

      ],
    },
    {
      id: 'treatment-care',
      icon: '🌿',
      title: tr(lang, 'متابعة العلاج والروشتة الخضراء', 'Treatment & Green Care', 'Suivi & Ordonnance Verte', 'Seguimiento y Receta Verde', 'Therapie & Grünes Rezept'),
      shortTitle: tr(lang, 'متابعة العلاج والبيئة', 'Treatment & Care', 'Suivi & Soins', 'Cuidado y Dosis', 'Therapie & Pflege'),
      subtitle: tr(
        lang,
        'الروشتة الخضراء، منظم الجرعات، ملف صحتي، والتخلص الآمن',
        'Green Rx, dose tracker, health profile & safe disposal',
        'Ordonnance verte, suivi des doses, profil santé & élimination',
        'Receta verde, seguimiento de dosis, perfil y eliminación'
      ),
      items: [
        {
          to: '/green-prescription',
          key: 'navGreenRx',
          icon: '🌿',
          shortLabel: tr(lang, 'الروشتة الخضرا', 'Green Rx', 'Ordonnance Verte', 'Receta Verde'),
        },
        {
          to: '/daily-schedule',
          key: '',
          icon: '📅',
          shortLabel: tr(lang, 'مولّد جدول الجرعات للطباعة وواتساب', 'Printable & WhatsApp Schedule', 'Planning Imprimable & WhatsApp', 'Horario para Imprimir y WhatsApp', 'Dosierungs-Tagesplaner (Druck & WhatsApp)'),
        },
        {
          to: '/tracker',
          key: 'navTracker',
          icon: '⏱️',
          shortLabel: tr(lang, 'متابع الجرعات', 'Dose Tracker', 'Suivi Doses', 'Seguimiento'),
        },
        {
          to: '/patient-dashboard',
          key: 'navPatientDashboard',
          icon: '📊',
          shortLabel: tr(lang, 'لوحة المريض الموحدة', 'Patient Dashboard', 'Tableau Patient', 'Panel del Paciente'),
        },
        {
          to: '/passport',
          key: 'navPassport',
          icon: '🪪',
          shortLabel: tr(lang, 'الكارت الطبي الذكي (Medical ID & QR)', 'Smart Medical ID & QR', 'Carte Médicale Intelligente', 'Tarjeta Médica Inteligente'),
        },
        {
          to: '/health-profile',
          key: 'navHealthProfile',
          icon: '👤',
          shortLabel: tr(lang, 'ملف صحتي وحساسيتي والكارت الطبي', 'Health Profile & Medical ID', 'Profil Santé', 'Perfil de Salud'),
        },
        {
          to: '/home-cabinet',
          key: '',
          icon: '🗄️',
          shortLabel: tr(lang, 'كاشف صيدلية البيت', 'Cabinet Auditor', 'Pharmacie Maison', 'Botiquín'),
        },
        {
          to: '/ramadan-clock',
          key: '',
          icon: '🕌',
          shortLabel: tr(lang, 'أمان صيام رمضان', 'Ramadan Clock', 'Horloge Ramadan', 'Reloj Ramadán'),
        },
        {
          to: '/travel-kit',
          key: '',
          icon: '🧳',
          shortLabel: tr(lang, 'حقيبة أدوية السفر', 'Travel Kit', 'Kit Voyage', 'Kit Viaje'),
        },
        {
          to: '/senior-pills',
          key: '',
          icon: '👵',
          shortLabel: tr(lang, 'مساعد كبار السن بالصوت', 'Senior Pill ID & Voice', 'Aide Visuelle Seniors', 'Identificador Píldoras'),
        },
        {
          to: '/inhaler-counter',
          key: '',
          icon: '🫁',
          shortLabel: tr(lang, 'عداد بخاخات الصدر', 'Inhaler Dose Counter', 'Compteur Inhalateurs', 'Contador Inhaladores'),
        },

        {
          to: '/safe-disposal',
          key: 'navSafeDisposal',
          icon: '♻️',
          shortLabel: tr(lang, 'التخلص الآمن', 'Safe Disposal', 'Élimination', 'Eliminación'),
        },
      ],
    },
    {
      id: 'interactive-sim',
      icon: '🎮',
      title: tr(lang, 'الألعاب والمحاكاة والذكاء الاصطناعي', '3D Sim, Games & AI', 'Jeux 3D, Sim & IA', 'Juegos 3D, Sim e IA', '3D-Sim, Spiele & KI'),
      shortTitle: tr(lang, 'الألعاب والتفاعل الذكي', 'Games & AI', 'Jeux & IA', 'Juegos e IA', 'Spiele & KI'),
      subtitle: tr(
        lang,
        'محاكي المستشفى 3D، المساعد الذكي، الاختبارات، والصوتيات',
        '3D hospital simulator, AI assistant, quizzes & audio',
        'Simulateur 3D, assistant IA, quiz & audio',
        'Simulador 3D, asistente IA, cuestionarios y audio'
      ),
      items: [
        {
          to: '/games',
          key: 'navGames',
          icon: '🎮',
          shortLabel: tr(lang, 'الألعاب والمحاكاة 3D', 'Games & 3D Sim', 'Jeux & Sim 3D', 'Juegos y Sim 3D'),
        },
        {
          to: '/assistant',
          key: 'navAssistant',
          icon: '🤖',
          shortLabel: tr(lang, 'المساعد الذكي', 'AI Assistant', 'Assistant IA', 'Asistente IA'),
        },
        {
          to: '/quiz',
          key: 'navQuiz',
          icon: '📝',
          shortLabel: tr(lang, 'اختبر معلوماتك', 'Quizzes', 'Quiz', 'Cuestionarios'),
        },
        {
          to: '/listen',
          key: 'navListen',
          icon: '🎧',
          shortLabel: tr(lang, 'استمع وتعلّم', 'Listen & Learn', 'Écouter', 'Escuchar'),
        },
      ],
    },
    {
      id: 'awareness-research',
      icon: '📚',
      title: tr(lang, 'التوعية والأبحاث والمصادر', 'Awareness & Research', 'Sensibilisation & Recherche', 'Concientización e Investigación', 'Aufklärung & Forschung'),
      shortTitle: tr(lang, 'التوعية والأبحاث', 'Awareness & Research', 'Sensibilisation', 'Concientización', 'Aufklärung'),
      subtitle: tr(
        lang,
        'الدليل الدوائي التوعوي، المقالات الطبية، والأبحاث',
        'Medication safety guides, medical articles & research',
        'Campagne WAAW, guides éducatifs, articles & recherche',
        'Campaña WAAW, guías educativas, artículos e investigación'
      ),
      items: [
        {
          to: '/awareness-week',
          key: 'navWAAW',
          icon: '🌍',
          shortLabel: tr(lang, 'الأسبوع العالمي للوعي الدوائي (نوفمبر)', 'World Awareness Week (Nov)', 'Semaine Mondiale (Nov)', 'Semana Mundial (Nov)'),
        },
        {
          to: '/learn',
          key: 'navLearn',
          icon: '📚',
          shortLabel: tr(lang, 'تعلّم (الدليل التوعوي)', 'Learn Guide', 'Apprendre', 'Aprender'),
        },
        {
          to: '/myth',
          key: 'navMyth',
          icon: '💡',
          shortLabel: tr(lang, 'خرافة أم حقيقة', 'Myth or Fact', 'Mythe ou Réalité', 'Mito o Realidad'),
        },
        {
          to: '/articles',
          key: 'navArticles',
          icon: '📰',
          shortLabel: tr(lang, 'المقالات العلمية', 'Articles', 'Articles', 'Artículos'),
        },
        {
          to: '/research',
          key: 'navResearch',
          icon: '📊',
          shortLabel: tr(lang, 'استبيان البحث', 'Research Survey', 'Recherche', 'Investigación'),
        },
        {
          to: '/methodology',
          key: 'navMethod',
          icon: '🔬',
          shortLabel: tr(lang, 'المنهجية والمصادر', 'Methodology', 'Méthodologie', 'Metodología'),
        },
      ],
    },
  ];

  // Keep drawer categories collapsed by default until the user explicitly opens one

  const toggleDrawerGroup = (catId: string) => {
    setOpenDrawerGroups((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const areAllDrawerGroupsOpen = navCategories.every((cat) => Boolean(openDrawerGroups[cat.id]));

  const toggleAllDrawerGroups = () => {
    if (areAllDrawerGroupsOpen) {
      setOpenDrawerGroups({});
    } else {
      const next: Record<string, boolean> = {};
      navCategories.forEach((cat) => {
        next[cat.id] = true;
      });
      setOpenDrawerGroups(next);
    }
  };

  const openDrawer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenRibbonCatId(null);
    setOpenDrawerGroups({});
    setDrawerClosing(false);
    setDrawerOpen(true);
  };

  const closeDrawer = (restoreFocus = false) => {
    if (!drawerOpen || drawerClosing) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setDrawerOpen(false);
      setDrawerClosing(false);
      if (restoreFocus) {
        window.setTimeout(() => hamburgerBtnRef.current?.focus({ preventScroll: true }), 0);
      }
      return;
    }

    setDrawerClosing(true);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
      closeTimerRef.current = null;
      if (restoreFocus) {
        hamburgerBtnRef.current?.focus({ preventScroll: true });
      }
    }, 220);
  };

  const handleExitGuestMode = () => {
    try {
      sessionStorage.removeItem('aa_lamp_seen');
      sessionStorage.removeItem('aa_guest_mode');
    } catch {}
    if (typeof authCtx.exitGuestMode === 'function') {
      authCtx.exitGuestMode();
    } else {
      openAuthModal('login');
    }
  };

  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Dynamically keep browser tab title & apple-mobile-web-app-title synced with t('appName')
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const currentAppName = t('appName');
    if (currentAppName) {
      document.title = currentAppName;
      const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleMeta) appleMeta.setAttribute('content', currentAppName);
    }
  }, [lang, t]);

  // ── Automatic Full-Page TextNode & Attribute Localizer for ALL sub-pages when lang is FR, ES, or DE ──
  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Fast-path: completely skip DOM TreeWalker & MutationObserver overhead for AR/EN unless restoring from FR/ES/DE
    if ((lang === 'ar' || lang === 'en') && !hasEverUsedSecondaryDomTranslation) {
      return;
    }
    if (lang !== 'ar' && lang !== 'en') {
      hasEverUsedSecondaryDomTranslation = true;
    }
    let cancelled = false;

    const processSubtree = () => {
      const root = document.body;
      if (!root) return;

      const pendingNodes: { node: Text; baseEn: string; leading: string; trailing: string }[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('script, style, code, pre, svg, header.top, nav.drawer-panel, footer.pro-footer, .lang-switcher-wrap, .drawer-lang-bar')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      let current: Node | null = walker.nextNode();
      while (current) {
        const textNode = current as Text;
        const raw = textNode.nodeValue || '';
        const prev = textNodeState.get(textNode);

        if (lang === 'ar' || lang === 'en') {
          if (prev && raw === prev.lastOut && prev.baseEn !== raw) {
            textNode.nodeValue = prev.baseEn;
          }
          current = walker.nextNode();
          continue;
        }

        // lang is 'fr' or 'es'
        let baseEn = raw;
        if (prev) {
          if (raw === prev.lastOut) {
            baseEn = prev.baseEn;
          } else {
            // React updated this text node with new content
            baseEn = raw;
          }
        }

        if (shouldTranslateString(baseEn)) {
          const leadingMatch = baseEn.match(/^\s*/);
          const trailingMatch = baseEn.match(/\s*$/);
          const leading = leadingMatch ? leadingMatch[0] : '';
          const trailing = trailingMatch ? trailingMatch[0] : '';
          const core = baseEn.trim();

          const cached = getCachedTranslation(lang, core);
          if (cached) {
            const finalStr = `${leading}${cached}${trailing}`;
            textNodeState.set(textNode, { baseEn, lastOut: finalStr });
            if (textNode.nodeValue !== finalStr) {
              textNode.nodeValue = finalStr;
            }
          } else {
            // Apply instant offline fallback first
            const offlineOut = localizeFallbackText(baseEn, lang);
            textNodeState.set(textNode, { baseEn, lastOut: offlineOut });
            if (textNode.nodeValue !== offlineOut) {
              textNode.nodeValue = offlineOut;
            }
            pendingNodes.push({ node: textNode, baseEn, leading, trailing });
          }
        }

        current = walker.nextNode();
      }

      // Also localize input placeholders and button titles
      const attrElements = root.querySelectorAll('input[placeholder], textarea[placeholder], [title]');
      attrElements.forEach((el) => {
        if (el.closest('header.top, nav.drawer-panel, footer.pro-footer, .lang-switcher-wrap, .drawer-lang-bar')) return;
        const record = attrState.get(el) || {};
        (['placeholder', 'title'] as const).forEach((attrName) => {
          const val = el.getAttribute(attrName);
          if (!val) return;
          const prevAttr = record[attrName];
          if (lang === 'ar' || lang === 'en') {
            if (prevAttr && val === prevAttr.lastOut && prevAttr.baseEn !== val) {
              el.setAttribute(attrName, prevAttr.baseEn);
            }
            return;
          }
          const baseEn = prevAttr && val === prevAttr.lastOut ? prevAttr.baseEn : val;
          if (!shouldTranslateString(baseEn)) return;
          const cached = getCachedTranslation(lang, baseEn.trim());
          if (cached) {
            record[attrName] = { baseEn, lastOut: cached };
            attrState.set(el, record);
            if (val !== cached) el.setAttribute(attrName, cached);
          } else {
            const offlineOut = localizeFallbackText(baseEn, lang);
            record[attrName] = { baseEn, lastOut: offlineOut };
            attrState.set(el, record);
            if (val !== offlineOut) el.setAttribute(attrName, offlineOut);
            void fetchNeuralTranslation(baseEn.trim(), lang).then((trVal) => {
              if (cancelled || !trVal) return;
              record[attrName] = { baseEn, lastOut: trVal };
              attrState.set(el, record);
              if (el.getAttribute(attrName) === offlineOut) {
                el.setAttribute(attrName, trVal);
              }
            });
          }
        });
      });

      // Batch-translate pending text nodes in chunks so every page translates completely
      if ((lang === 'fr' || lang === 'es' || lang === 'de') && pendingNodes.length > 0) {
        const uniqueCores = Array.from(new Set(pendingNodes.map((p) => p.baseEn.trim())));
        const CHUNK_SIZE = 18;
        for (let i = 0; i < uniqueCores.length; i += CHUNK_SIZE) {
          const slice = uniqueCores.slice(i, i + CHUNK_SIZE);
          const joinedPayload = slice.join('\n ||| \n');
          void fetchNeuralTranslation(joinedPayload, lang).then((resText) => {
            if (cancelled || !resText) return;
            const parts = resText.split(/\s*\|\|\|\s*/);
            if (parts.length === slice.length) {
              slice.forEach((origCore, idx) => {
                const trCore = parts[idx].trim();
                if (trCore) setCachedTranslation(lang, origCore, trCore);
              });
              pendingNodes.forEach(({ node, baseEn, leading, trailing }) => {
                const trCore = getCachedTranslation(lang, baseEn.trim());
                if (trCore && node.isConnected) {
                  const finalStr = `${leading}${trCore}${trailing}`;
                  textNodeState.set(node, { baseEn, lastOut: finalStr });
                  if (node.nodeValue !== finalStr) {
                    node.nodeValue = finalStr;
                  }
                }
              });
            } else {
              // Fallback: translate individual items in this chunk
              slice.forEach((origCore) => {
                void fetchNeuralTranslation(origCore, lang).then((singleTr) => {
                  if (cancelled || !singleTr) return;
                  pendingNodes
                    .filter((p) => p.baseEn.trim() === origCore)
                    .forEach(({ node, baseEn, leading, trailing }) => {
                      if (node.isConnected) {
                        const finalStr = `${leading}${singleTr.trim()}${trailing}`;
                        textNodeState.set(node, { baseEn, lastOut: finalStr });
                        if (node.nodeValue !== finalStr) {
                          node.nodeValue = finalStr;
                        }
                      }
                    });
                });
              });
            }
          });
        }
      }
    };

    processSubtree();

    let debounceTimer: number | null = null;
    const observer = new MutationObserver(() => {
      if (lang !== 'fr' && lang !== 'es' && lang !== 'de') return;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        if (!cancelled) processSubtree();
      }, 60);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      cancelled = true;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [lang, pathname]);

  useEffect(() => {
    if (drawerOpen) {
      closeDrawer(false);
    }
    setLangMenuOpen(false);
    setOpenRibbonCatId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (ribbonWrapRef.current && !ribbonWrapRef.current.contains(e.target as Node)) {
        setOpenRibbonCatId(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenRibbonCatId(null);
        setLangMenuOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen || drawerClosing) return;
    const focusTimer = window.setTimeout(() => {
      drawerCloseBtnRef.current?.focus({ preventScroll: true });
    }, 30);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, drawerClosing]);

  const activeRibbonCategory = navCategories.find((cat) => cat.id === openRibbonCatId) || null;

  return (
    <div className="app" dir={pageDir}>
      <header className="top dawaya-v2-header">
        <div className="wrap bar dawaya-v2-bar">
          <div className="brand-group dawaya-v2-brand-group">
            <Link to="/" className="brand dawaya-v2-brand" style={{ gap: '11px' }}>
              <div
                className="brand-logo-circle dawaya-v2-logo-circle"
                style={{
                  overflow: 'hidden',
                  padding: 0,
                  borderRadius: '50%',
                  background: '#CFD29D',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
                  flexShrink: 0,
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}favicon-192.png`}
                  alt={t('appName')}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.endsWith('favicon.svg')) {
                      img.src = `${import.meta.env.BASE_URL}favicon.svg`;
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 'inherit',
                    display: 'block',
                  }}
                />
              </div>
              <span className="brand-title-wrap dawaya-v2-title-wrap" dir="rtl">
                <b className="dawaya-v2-title-text">
                  <span className="dawaya-ar-word">دوايا</span>
                  <span className="dawaya-title-divider">|</span>
                  <span className="dawaya-en-word" dir="ltr">DAWAYA</span>
                </b>
              </span>
            </Link>
          </div>

          {/* Unified Glassmorphic Capsule (Design 2) */}
          <div className="header-actions dawaya-glass-capsule">
            {/* 1. User Avatar Circle (Logged In) or Sage-Gold Guest User Circle (Logged Out) */}
            {!user ? (
              <div className="header-auth-group">
                <button
                  type="button"
                  className="capsule-avatar-btn guest-mode"
                  onClick={handleExitGuestMode}
                  title={tr(
                    lang,
                    'تسجيل الدخول أو إنشاء حساب',
                    'Sign in or create account',
                    'Se connecter ou créer un compte',
                    'Iniciar sesión o crear cuenta'
                  )}
                  aria-label={tr(lang, 'تسجيل الدخول', 'Sign In', 'Connexion', 'Acceder')}
                >
                  <CapsuleUserGuestIcon size={20} />
                </button>
              </div>
            ) : (
              <div className="header-auth-group">
                <Link
                  to="/health-profile"
                  className="capsule-avatar-btn logged-in"
                  title={`${user.displayName || ''} (${user.email || ''})`.trim()}
                  aria-label={tr(lang, 'ملف صحتي وحسابي', 'My Health Profile', 'Mon Profil Santé', 'Mi Perfil de Salud')}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <span className="capsule-avatar-initials">
                      {(user.displayName || user.email || 'U').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* 2. Vector Globe Language Switcher Dropdown */}
            <div ref={langMenuRef} className="lang lang-switcher-wrap capsule-item-wrap" style={{ position: 'relative', padding: 0 }}>
              <button
                type="button"
                className="capsule-icon-btn lang-trigger-btn"
                onClick={() => setLangMenuOpen((o) => !o)}
                aria-expanded={langMenuOpen}
                aria-haspopup="listbox"
                aria-label={tr(lang, 'تغيير اللغة', 'Change language', 'Changer de langue', 'Cambiar idioma')}
                title={tr(lang, 'اختر لغة المنصة', 'Select platform language', 'Choisir la langue', 'Seleccionar idioma')}
              >
                <CapsuleGlobeLangIcon code={lang.toUpperCase()} size={26} />
              </button>

              {langMenuOpen && (
                <div
                  className="lang-dropdown-menu"
                  role="listbox"
                  aria-label={tr(lang, 'قائمة اللغات', 'Languages', 'Langues', 'Idiomas')}
                >
                  {SUPPORTED_LANGS.map((item) => {
                    const active = item.code === lang;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`lang-dropdown-item${active ? ' active' : ''}`}
                        onClick={() => {
                          setLang(item.code);
                          setLangMenuOpen(false);
                        }}
                      >
                        <span className="lang-item-flag" aria-hidden="true">{item.flag}</span>
                        <span className="lang-item-name">{item.nativeLabel}</span>
                        <span className="lang-item-code">{item.code.toUpperCase()}</span>
                        {active && <span className="lang-item-check" aria-hidden="true">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Vector Crescent / Sun Theme Toggle */}
            <button
              type="button"
              className="capsule-icon-btn dark-toggle"
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={
                dark
                  ? tr(lang, 'الوضع النهاري', 'Light mode', 'Mode clair', 'Modo claro')
                  : tr(lang, 'الوضع الليلي', 'Dark mode', 'Mode sombre', 'Modo oscuro')
              }
            >
              <CapsuleMoonIcon isDark={dark} size={21} />
            </button>

            {/* 4. Vector Sign-Out Arrow (When Logged In) or Full Menu Drawer Trigger */}
            {user && (
              <button
                type="button"
                className="capsule-icon-btn header-logout-btn"
                onClick={() => setShowLogoutModal(true)}
                title={tr(lang, 'تسجيل الخروج', 'Log out', 'Déconnexion', 'Cerrar sesión')}
                aria-label={tr(lang, 'تسجيل الخروج', 'Log out', 'Déconnexion', 'Cerrar sesión')}
              >
                <CapsuleSignOutIcon size={21} />
              </button>
            )}

            <button
              type="button"
              ref={hamburgerBtnRef}
              className="capsule-icon-btn hamburger-btn"
              onClick={openDrawer}
              aria-expanded={drawerOpen && !drawerClosing}
              aria-controls="site-sections-drawer"
              aria-label={tr(lang, 'كل الأقسام', 'All sections menu', 'Menu complet', 'Menú completo')}
              title={tr(lang, 'القائمة الكاملة لأقسام الموقع', 'All Site Sections', 'Toutes les rubriques', 'Todas las secciones')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7H20M4 12H20M4 17H20" stroke="#CFD29D" strokeWidth="2.1" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2: Borderless Vector Navigation Tabs with Sage-Gold Bottom Indicator (Design 2) */}
        <div ref={ribbonWrapRef} className="quick-ribbon-wrap dawaya-v2-ribbon-wrap">
          <div className="wrap quick-ribbon dawaya-v2-ribbon">
            <NavLink
              to="/"
              end
              onClick={() => setOpenRibbonCatId(null)}
              className={({ isActive }) => `quick-ribbon-link dawaya-v2-tab ${isActive ? 'active' : ''}`}
            >
              <span className="dawaya-v2-tab-icon">
                <NavHomeVectorIcon size={23} />
              </span>
              <span className="dawaya-v2-tab-label">{tr(lang, 'الرئيسية', 'Home', 'Accueil', 'Inicio', 'Startseite')}</span>
              <span className="dawaya-v2-tab-bar" aria-hidden="true" />
            </NavLink>

            <NavLink
              to="/patient-dashboard"
              onClick={() => setOpenRibbonCatId(null)}
              className={({ isActive }) => `quick-ribbon-link dawaya-v2-tab ${isActive ? 'active' : ''}`}
            >
              <span className="dawaya-v2-tab-icon">
                <NavDashboardVectorIcon size={22} />
              </span>
              <span className="dawaya-v2-tab-label">{tr(lang, 'لوحة المريض', 'Patient Hub', 'Tableau Patient', 'Panel')}</span>
              <span className="dawaya-v2-tab-bar" aria-hidden="true" />
            </NavLink>

            <NavLink
              to="/medicines"
              onClick={() => setOpenRibbonCatId(null)}
              className={({ isActive }) =>
                `quick-ribbon-link dawaya-v2-tab ${isActive || pathname.startsWith('/medicine/') ? 'active' : ''}`
              }
            >
              <span className="dawaya-v2-tab-icon">
                <NavCapsuleVectorIcon size={23} />
              </span>
              <span className="dawaya-v2-tab-label">{tr(lang, 'الدليل والأدوية', 'Drug Directory', 'Médicaments', 'Medicamentos')}</span>
              <span className="dawaya-v2-tab-bar" aria-hidden="true" />
            </NavLink>

            <NavLink
              to="/prescription-radar"
              onClick={() => setOpenRibbonCatId(null)}
              className={({ isActive }) => `quick-ribbon-link dawaya-v2-tab ${isActive ? 'active' : ''}`}
            >
              <span className="dawaya-v2-tab-icon">
                <NavRadarVectorIcon size={23} accentColor="#138866" />
              </span>
              <span className="dawaya-v2-tab-label">{tr(lang, 'رادار الروشتة', 'Rx Radar', 'Radar Rx', 'Radar Rx')}</span>
              <span className="dawaya-v2-tab-bar" aria-hidden="true" />
            </NavLink>

            {navCategories.map((cat) => {
              const isOpen = openRibbonCatId === cat.id;
              const hasActiveChild = cat.items.some((item) => isRouteMatchingItem(item.to, pathname));
              const renderCatVectorIcon = (id: string) => {
                if (id === 'drug-directory') return <NavCapsuleVectorIcon size={22} />;
                if (id === 'clinical-safety') return <NavShieldSafetyVectorIcon size={22} />;
                if (id === 'treatment-care') return <NavLeafCareVectorIcon size={22} />;
                if (id === 'interactive-sim') return <NavAiSimVectorIcon size={22} />;
                return <NavBookSourcesVectorIcon size={22} />;
              };
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenRibbonCatId((prev) => (prev === cat.id ? null : cat.id))}
                  className={`quick-ribbon-link quick-ribbon-group-btn dawaya-v2-tab${hasActiveChild ? ' active' : ''}${isOpen ? ' is-open' : ''}`}
                >
                  <span className="dawaya-v2-tab-icon">{renderCatVectorIcon(cat.id)}</span>
                  <span className="dawaya-v2-tab-label">
                    {cat.shortTitle}
                    <span className={`ribbon-group-caret${isOpen ? ' open' : ''}`} aria-hidden="true" style={{ marginInlineStart: '4px' }}>▾</span>
                  </span>
                  <span className="dawaya-v2-tab-bar" aria-hidden="true" />
                </button>
              );
            })}

            <NavLink
              to="/methodology"
              onClick={() => setOpenRibbonCatId(null)}
              className={({ isActive }) => `quick-ribbon-link dawaya-v2-tab ${isActive ? 'active' : ''}`}
            >
              <span className="dawaya-v2-tab-icon">
                <NavBookSourcesVectorIcon size={22} />
              </span>
              <span className="dawaya-v2-tab-label">{tr(lang, 'المصادر والمراجع', 'References', 'Sources', 'Fuentes')}</span>
              <span className="dawaya-v2-tab-bar" aria-hidden="true" />
            </NavLink>
          </div>

          {/* Expandable Sub-Items Panel for Selected Ribbon Category */}
          {activeRibbonCategory && (
            <div className="ribbon-dropdown-panel" role="region" aria-label={activeRibbonCategory.title}>
              <div className="wrap ribbon-dropdown-inner">
                <div className="ribbon-dropdown-header">
                  <div className="ribbon-dropdown-title-group">
                    <span className="ribbon-dropdown-icon" aria-hidden="true"><DawayaRouteVectorIcon route={activeRibbonCategory.id} size={20} color="#CFD29D" /></span>
                    <div>
                      <b className="ribbon-dropdown-title">{activeRibbonCategory.title}</b>
                      <span className="ribbon-dropdown-sub">{activeRibbonCategory.subtitle}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ribbon-dropdown-close"
                    onClick={() => setOpenRibbonCatId(null)}
                    aria-label={tr(lang, 'إغلاق القسم', 'Close category', 'Fermer', 'Cerrar')}
                  >
                    ✕
                  </button>
                </div>

                <div className="ribbon-dropdown-grid">
                  {activeRibbonCategory.items.map((subItem) => {
                    const active = isRouteMatchingItem(subItem.to, pathname);
                    return (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        onClick={() => setOpenRibbonCatId(null)}
                        className={`ribbon-sub-item${active ? ' active' : ''}`}
                      >
                        <span className="ribbon-sub-icon" aria-hidden="true"><DawayaRouteVectorIcon route={subItem.to} size={18} color="#CFD29D" /></span>
                        <span className="ribbon-sub-text">{subItem.key ? t(subItem.key) : subItem.shortLabel}</span>
                        <span className="ribbon-sub-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Edge-Attached Dark Teal Glassmorphism Navigation Sidebar with Collapsible Groups */}
      {drawerOpen && (
        <div
          className={`drawer-backdrop${drawerClosing ? ' is-closing' : ''}`}
          dir={pageDir}
          onClick={() => closeDrawer(true)}
          role="presentation"
        >
          <nav
            id="site-sections-drawer"
            key={pageDir}
            dir={pageDir}
            className={`drawer-panel${drawerClosing ? ' is-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={tr(lang, 'القائمة الجانبية لجميع الأقسام', 'Side menu', 'Menu latéral', 'Menú lateral')}
          >
            <div className="drawer-header">
              <div className="drawer-brand">
                <img
                  src={`${import.meta.env.BASE_URL}favicon-192.png`}
                  alt=""
                  aria-hidden="true"
                  style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#D2D1A3' }}
                />
                <div className="drawer-brand-text">
                  <b>{tr(lang, 'أقسام المنصة السريرية', 'Clinical Portal Menu', 'Menu du Portail Clinique', 'Menú del Portal Clínico')}</b>
                  <small className="drawer-subtitle">
                    {tr(lang, 'مجمعة حسب التخصص لسهولة الوصول', 'Grouped by category for quick access', 'Regroupés par catégorie', 'Agrupados por categoría')}
                  </small>
                </div>
              </div>
              <button
                type="button"
                ref={drawerCloseBtnRef}
                className="drawer-close-btn"
                onClick={() => closeDrawer(true)}
                aria-label={tr(lang, 'إغلاق القائمة', 'Close menu', 'Fermer le menu', 'Cerrar menú')}
                title={tr(lang, 'إغلاق (Esc)', 'Close (Esc)', 'Fermer (Esc)', 'Cerrar (Esc)')}
              >
                ✕
              </button>
            </div>

            {/* Quick Language Selector inside Drawer */}
            <div className="drawer-lang-bar" aria-label={tr(lang, 'اختيار اللغة', 'Language selection', 'Choix de la langue', 'Selección de idioma')}>
              {SUPPORTED_LANGS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`drawer-lang-pill${item.code === lang ? ' active' : ''}`}
                  onClick={() => setLang(item.code)}
                >
                  <span aria-hidden="true">{item.flag}</span>
                  <span>{item.nativeLabel}</span>
                </button>
              ))}
            </div>

            <div className="drawer-links">
              {/* Direct Home Item */}
              <NavLink
                to="/"
                end
                onClick={() => closeDrawer(false)}
                className={({ isActive }) => `drawer-item ${isActive ? 'active' : ''}`}
              >
                <span className="item-icon" aria-hidden="true">🏠</span>
                <span className="item-title">{t('navHome')}</span>
                <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
              </NavLink>

              {/* Direct Top-Level Scientific References & Sources Item in Drawer */}
              <NavLink
                to="/methodology"
                onClick={() => closeDrawer(false)}
                className={({ isActive }) => `drawer-item ${isActive ? 'active' : ''}`}
                style={{ border: '1px solid rgba(20, 184, 166, 0.4)', background: 'rgba(20, 184, 166, 0.12)' }}
              >
                <span className="item-icon" aria-hidden="true">📚</span>
                <span className="item-title">
                  {tr(lang, 'موسوعة المصادر والمراجع العلمية للموقع', 'Complete Website Scientific References', 'Sources & Références Scientifiques', 'Fuentes y Referencias Científicas')}
                </span>
                <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
              </NavLink>

              {/* Helper bar to Expand/Collapse all groups */}
              <div className="drawer-groups-toolbar">
                <span className="drawer-groups-hint">
                  {tr(lang, 'اضغط على أي قسم لعرض أدواته:', 'Tap a category to expand tools:', 'Appuyez pour développer :', 'Toca para expandir:')}
                </span>
                <button
                  type="button"
                  className="drawer-expand-all-btn"
                  onClick={toggleAllDrawerGroups}
                >
                  {areAllDrawerGroupsOpen
                    ? tr(lang, 'طي الكل ▴', 'Collapse All ▴', 'Tout réduire ▴', 'Contraer todo ▴')
                    : tr(lang, 'فتح الكل ▾', 'Expand All ▾', 'Tout ouvrir ▾', 'Expandir todo ▾')}
                </button>
              </div>

              {/* 5 Categorized Accordion Groups */}
              {navCategories.map((cat) => {
                const isOpen = Boolean(openDrawerGroups[cat.id]);
                const hasActiveChild = cat.items.some((item) => isRouteMatchingItem(item.to, pathname));
                return (
                  <div
                    key={cat.id}
                    className={`drawer-group${isOpen ? ' is-open' : ''}${hasActiveChild ? ' has-active' : ''}`}
                  >
                    <button
                      type="button"
                      className={`drawer-group-trigger${hasActiveChild ? ' active-parent' : ''}`}
                      onClick={() => toggleDrawerGroup(cat.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="item-icon group-icon" aria-hidden="true"><DawayaRouteVectorIcon route={cat.id} size={20} color="#CFD29D" /></span>
                      <div className="drawer-group-text">
                        <span className="drawer-group-title">{cat.title}</span>
                        <small className="drawer-group-sub">{cat.subtitle}</small>
                      </div>
                      <span className="drawer-group-badge" aria-hidden="true">{cat.items.length}</span>
                      <span className={`drawer-group-chevron${isOpen ? ' open' : ''}`} aria-hidden="true">▾</span>
                    </button>

                    {isOpen && (
                      <div className="drawer-group-items">
                        {cat.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => closeDrawer(false)}
                            className={({ isActive }) =>
                              `drawer-item drawer-sub-item ${isActive || isRouteMatchingItem(item.to, pathname) ? 'active' : ''}`
                            }
                          >
                            <span className="item-icon sub-icon" aria-hidden="true">{item.icon}</span>
                            <span className="item-title">{item.key ? t(item.key) : item.shortLabel}</span>
                            <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="drawer-divider"></div>

              <button
                type="button"
                className="drawer-item"
                onClick={() => {
                  closeDrawer(false);
                  triggerOnboardingTourManually();
                }}
              >
                <span className="item-icon" aria-hidden="true">🧭</span>
                <span className="item-title">
                  {tr(lang, 'جولة تعريفية سريعة بالتطبيق', 'Quick App Walkthrough Tour')}
                </span>
                <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
              </button>
              <button
                type="button"
                className="drawer-item"
                onClick={() => {
                  closeDrawer(false);
                  triggerUpdateCheckerManually();
                }}
              >
                <span className="item-icon" aria-hidden="true">🔄</span>
                <span className="item-title">
                  {tr(lang, 'فحص وتثبيت تحديثات التطبيق', 'Check for In-App Updates')}
                </span>
                <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
              </button>
              <NavLink
                to="/admin"
                onClick={() => closeDrawer(false)}
                className={({ isActive }) => `drawer-item admin ${isActive ? 'active' : ''}`}
              >
                <span className="item-icon" aria-hidden="true">⚙️</span>
                <span className="item-title">{t('navAdmin')}</span>
                <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
              </NavLink>

              {!user && (
                <>
                  <div className="drawer-divider"></div>
                  <button
                    type="button"
                    className="drawer-item drawer-auth-btn"
                    onClick={() => {
                      closeDrawer(false);
                      handleExitGuestMode();
                    }}
                  >
                    <span className="item-icon" aria-hidden="true">👤</span>
                    <span className="item-title">
                      {tr(lang, 'تسجيل الدخول (الخروج من وضع الزائر)', 'Sign In (Exit Guest Mode)', 'Connexion (Quitter le mode invité)', 'Iniciar sesión (Salir de invitado)')}
                    </span>
                    <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
                  </button>
                </>
              )}

              {user && (
                <>
                  <div className="drawer-divider"></div>
                  <button
                    type="button"
                    className="drawer-item drawer-logout-btn"
                    onClick={() => {
                      closeDrawer(false);
                      setShowLogoutModal(true);
                    }}
                  >
                    <span className="item-icon" aria-hidden="true">🚪</span>
                    <span className="item-title">{tr(lang, 'تسجيل الخروج', 'Logout', 'Déconnexion', 'Cerrar sesión')}</span>
                    <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Page Content */}
      <SmartOfflineStatusBanner lang={lang} />
      <SmartCrossClinicSafetyBanner />
      <div ref={pageRef} className="page-enter">
        {children}
      </div>

      <GlobalPhoneAlarmOverlay />
      <OnboardingTour />
      <AppUpdateManager />

      {spotlightOpen && (
        <Suspense fallback={null}>
          <GlobalSpotlightModal isOpen={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
        </Suspense>
      )}

      {/* Lazy-loaded Floating AI Assistant Bubble */}
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>

      {/* Lazy-loaded Logout Modal */}
      {(showLogoutModal || authCtx.logoutModalOpen) && (
        <Suspense fallback={null}>
          <LogoutModal
            isOpen={showLogoutModal || authCtx.logoutModalOpen}
            onClose={() => {
              setShowLogoutModal(false);
              authCtx.closeLogoutModal();
            }}
          />
        </Suspense>
      )}

      {/* Professional Academic & Medical Footer on All Pages */}
      
      {/* Floating Glass Bottom Navigation Dock for Mobile & Android App */}
      <nav
        className="dawaya-floating-bottom-dock no-print"
        aria-label={tr(lang, 'شريط التنقل السريع السفلي', 'Bottom quick navigation')}
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) => `dawaya-dock-item${isActive ? ' active' : ''}`}
        >
          <NavHomeVectorIcon size={21} />
          <span>{tr(lang, 'الرئيسية', 'Home', 'Accueil', 'Inicio')}</span>
        </NavLink>

        <NavLink
          to="/medicines"
          className={({ isActive }) =>
            `dawaya-dock-item${isActive || pathname.startsWith('/medicine/') ? ' active' : ''}`
          }
        >
          <NavCapsuleVectorIcon size={21} />
          <span>{tr(lang, 'الأدوية', 'Drugs', 'Médicaments', 'Fármacos')}</span>
        </NavLink>

        <NavLink
          to="/scan"
          className={({ isActive }) => `dawaya-dock-center-scan${isActive ? ' active' : ''}`}
          title={tr(lang, 'مسح الباركود والروشتة', 'Scan Barcode & Rx')}
        >
          <span className="dawaya-dock-scan-circle">
            <HeroScannerVectorIcon size={24} color="#FFFFFF" />
          </span>
          <span className="dawaya-dock-scan-label">{tr(lang, 'الماسح', 'Scan', 'Scanner', 'Escanear')}</span>
        </NavLink>

        <NavLink
          to="/patient-dashboard"
          className={({ isActive }) => `dawaya-dock-item${isActive ? ' active' : ''}`}
        >
          <NavDashboardVectorIcon size={20} />
          <span>{tr(lang, 'لوحة المريض', 'Hub', 'Patient', 'Panel')}</span>
        </NavLink>

        <NavLink
          to="/clinics"
          className={({ isActive }) => `dawaya-dock-item${isActive ? ' active' : ''}`}
        >
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🏥</span>
          <span>{tr(lang, 'العيادات', 'Clinics', 'Cliniques', 'Clínicas')}</span>
        </NavLink>
      </nav>

      <footer className="pro-footer">
        <div className="wrap pro-footer-grid">
          <div>
            <div className="row" style={{ gap: '10px', marginBottom: '8px' }}>
              <img
                src={`${import.meta.env.BASE_URL}favicon-192.png`}
                alt=""
                aria-hidden="true"
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#D2D1A3' }}
              />
              <div>
                <b style={{ fontSize: '1.05rem', color: '#fff' }}>{t('appName')}</b>
              </div>
            </div>
            <p className="small" style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
              {tr(
                lang,
                'منصة دوايا (DAWAYA | دوايا — صحتك.. بذكاء أكتر): المنصة الرقمية الشاملة للرعاية الصحية والأمان الدوائي وقاعدة بيانات الأدوية المصرية (26,562+ مستحضر دوائي) والتوعية بالاستخدام الرشيد للمضادات الحيوية.',
                'DAWAYA | Your Health. Smarter. Comprehensive digital healthcare & medication safety platform featuring 26,562+ Egyptian medicines, Prescription Radar, Health Profile, and AI assistance.',
                'Portail numérique de santé pour le bon usage des antibiotiques et la lutte contre l’antibiorésistance (AMR), aligné sur les directives de l’OMS et de l’EDA.',
                'Portal digital de salud para el uso racional de antibióticos y la educación sobre resistencia antimicrobiana (RAM), aligné con las guías de la OMS y la EDA.'
              )}
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', margin: '0 0 10px' }}>
              {tr(lang, 'الأدوات السريرية السريعة', 'Quick Clinical Tools', 'Outils Cliniques Rapides', 'Herramientas Clínicas Rápidas')}
            </h4>
            <ul className="pro-footer-links">
              <li><Link to="/medicines">{tr(lang, 'قاعدة بيانات أدوية دوايا الشاملة (26,562+ دواء)', 'DAWAYA Medicine Database (26,562+)', 'Base de Médicaments (26 572+)', 'Base de Medicamentos (26.572+)')}</Link></li>
              <li><Link to="/games">{tr(lang, 'مركز الألعاب والمحاكاة الطبية 3D', 'Game Center & 3D Medical Simulator', 'Centre de Jeux & Simulateur 3D', 'Centro de Juegos y Simulador 3D')}</Link></li>
              <li><Link to="/scan">{tr(lang, 'ماسح الباركود الخطي ورموز QR', 'Barcode & QR Scanner', 'Scanner Code-Barres & QR', 'Escáner de Código de Barras y QR')}</Link></li>
              <li><Link to="/allergy-checker">{tr(lang, 'فاحص الحساسية الدوائية المتقاطعة', 'Drug Allergy Safety Checker', 'Vérificateur d’Allergies Croisées', 'Verificador de Alergias Medicamentosas')}</Link></li>
              <li><Link to="/pediatric-helper">{tr(lang, 'حاسبة جرعات شراب الأطفال', 'Pediatric Dosage Calculator', 'Calculateur Posologique Pédiatrique', 'Calculadora de Dosis Pediátrica')}</Link></li>
              <li><Link to="/safe-disposal">{tr(lang, 'دليل التخلص الآمن وحماية البيئة', 'Safe Antibiotic Disposal', 'Guide d’Élimination Sûre', 'Guía de Eliminación Segura')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', margin: '0 0 10px' }}>
              {tr(lang, 'المصادر الطبية الرسمية والطوارئ', 'Official Sources & Emergency', 'Sources Officielles & Urgences', 'Fuentes Oficiales y Emergencias')}
            </h4>
            <ul className="pro-footer-links">
              <li>
                <a href="https://edaegypt.gov.eg" target="_blank" rel="noopener noreferrer">
                  {tr(lang, 'هيئة الدواء المصرية (EDA)', 'Egyptian Drug Authority (EDA)', 'Autorité Égyptienne des Médicaments (EDA)', 'Autoridad Egipcia de Medicamentos (EDA)')} ↗
                </a>
              </li>
              <li>
                <a href="https://www.who.int/health-topics/antimicrobial-resistance" target="_blank" rel="noopener noreferrer">
                  {tr(lang, 'منظمة الصحة العالمية (WHO AMR)', 'World Health Organization (WHO)', 'Organisation Mondiale de la Santé (OMS)', 'Organización Mundial de la Salud (OMS)')} ↗
                </a>
              </li>
              <li>
                <a href="https://medlineplus.gov/antibiotics.html" target="_blank" rel="noopener noreferrer">
                  {tr(lang, 'المكتبة الوطنية للطب (MedlinePlus)', 'NIH MedlinePlus Drug Info', 'Bibliothèque Nationale de Médecine (MedlinePlus)', 'Biblioteca Nacional de Medicina (MedlinePlus)')} ↗
                </a>
              </li>
              <li style={{ marginTop: '8px' }}>
                <a
                  href={`tel:${emergency.number}`}
                  style={{ color: '#fca5a5', fontWeight: 700, textDecoration: 'none' }}
                >
                  🚑{' '}
                  {tr(
                    lang,
                    `طوارئ الإسعاف (${emergency.flag} ${countryName}): ${emergency.number}`,
                    `Emergency Services (${emergency.flag} ${countryName}): ${emergency.number}`,
                    `Urgences Médicales (${emergency.flag} ${countryName}) : ${emergency.number}`,
                    `Emergencias Médicas (${emergency.flag} ${countryName}): ${emergency.number}`
                  )}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="wrap" style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <Disclaimer compact />
          <div className="small" style={{ textAlign: 'center', color: '#94a3b8', marginTop: '8px' }}>
            © {new Date().getFullYear()} {t('appName')}
          </div>
        </div>
      </footer>
    </div>
  );
}
