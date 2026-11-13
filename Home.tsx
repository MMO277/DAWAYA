import { DawayaFullWordmark } from './DawayaLogo';
import { DawayaRouteVectorIcon, HeroMicVectorIcon, HeroScannerVectorIcon, HeroSearchVectorIcon } from './DawayaVectorIcons';
import { PersonaType } from './SmartPersonaAndSpotlight';
import { CSSProperties, FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
const PublicPartnerPlacementSection = lazy(() =>
  import('./PartnersDirectory').then((m) => ({ default: m.PublicPartnerPlacementSection }))
);
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES } from './articlesData';
import { pick, tr } from './types';
import Disclaimer from './Disclaimer';
import DidYouKnow from './DidYouKnow';
import ResistanceCounter from './ResistanceCounter';
import { useClinicalProMode } from './clinicalProData';
import type { EgyptianCommercialProduct } from './egyptianDrugDatabase';
import {
  clearRecentlyViewedMedicines,
  DAWAYA_CATEGORY_LABELS,
  getRecentlyViewedMedicines,
  RecentlyViewedMedItem,
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
  const { indexItems, totalCount } = useDawayaDrugDatabase(false); // Lazy-load 8.2MB index only when searching

  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAllClinicalTools, setShowAllClinicalTools] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('all');
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [recentMeds, setRecentMeds] = useState<RecentlyViewedMedItem[]>(() => getRecentlyViewedMedicines());
  const [abxProducts, setAbxProducts] = useState<EgyptianCommercialProduct[]>([]);
  useEffect(() => {
    if (q.trim().length >= 2 && abxProducts.length === 0) {
      import('./egyptianDrugDatabase').then((m) => setAbxProducts(m.EGYPTIAN_COMMERCIAL_PRODUCTS)).catch(() => {});
    }
  }, [q, abxProducts.length]);
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

    const abxMatches = abxProducts.filter((p) => {
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
  }, [q, indexItems, abxProducts, isAr, lang]);

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
      to: '/missed-dose-rescue',
      icon: '🚨',
      badge: tr(lang, 'إنقاذ الجرعة', 'Missed Dose'),
      title: tr(lang, 'دليل وموجه إنقاذ الجرعة المنسية السريري (Missed Dose)', 'Clinical Missed Dose Emergency Protocol'),
      desc: tr(
        lang,
        'اعرف فوراً التصرف الطبي السليم بالساعة عند نسيان حبة منع الحمل، الأنسولين، دواء الضغط، المضاد الحيوي، أو الكورتيزون بدون مضاعفة الجرعة',
        'Immediate clinical action guide for missed contraceptive, insulin, antibiotic, and BP pills without toxic double-dosing'
      ),
      color: '#b91c1c',
    },
    {
      to: '/doctor-visit-prep',
      icon: '📋',
      badge: tr(lang, 'كشف العيادة', 'Doctor Visit'),
      title: tr(lang, 'مُحضّر كشف العيادة وزيارة الطبيب الذكي (Doctor Visit)', 'Smart Doctor Visit & Clinical Brief Prep'),
      desc: tr(
        lang,
        'جهز كشفك في دقيقتين: رتب شكوتك وأدويتك واطبع أهم 5 أسئلة طبية حاسمة لازم تسألها للدكتور قبل ما تخرج من العيادة',
        'Prepare your consultation brief, current meds, and essential 5 questions to ask your specialist doctor'
      ),
      color: '#0284c7',
    },
    {
      to: '/vaccine-tracker',
      icon: '💉',
      badge: tr(lang, 'التطعيمات', 'Vaccines'),
      title: tr(lang, 'رادار وحاسبة مواعيد تطعيمات الأطفال والكبار (Vaccines)', 'Ministry of Health Mandatory Vaccine Tracker'),
      desc: tr(
        lang,
        'احسبي مواعيد تطعيمات طفلك باليوم والساعة من عمر يوم حتى 18 شهراً مع خطة إسعاف السخونية والتورم والتطعيمات الإضافية',
        'Exact calendar dates for childhood mandatory and optional vaccines by birthdate with post-vaccine fever care'
      ),
      color: '#059669',
    },
    {
      to: '/assistant',
      icon: '📞',
      badge: tr(lang, 'مكالمة فورية', 'Voice Call'),
      title: tr(lang, 'مكالمة الطبيب الصيدلاني الصوتية المباشرة (Voice Call)', 'Live Voice Consultation with Dr. DAWAYA'),
      desc: tr(
        lang,
        'اتكلم مع الطبيب بالصوت بالعامية المصرية كأنك في مكالمة تليفون، واسمع رده الطبي الفوري بصوته بدون الحاجة للكتابة والقراءة',
        'Speak directly in colloquial Arabic with Dr. DAWAYA like a real phone call and hear live clinical advice'
      ),
      color: '#059669',
    },
    {
      to: '/medical-report',
      icon: '📄',
      badge: tr(lang, 'تقرير طبي', 'Medical PDF'),
      title: tr(lang, 'التقرير الطبي الشامل المعتمد للمريض (Medical Report)', 'Official Comprehensive Patient Medical Report'),
      desc: tr(
        lang,
        'صدر بضغطة زر تقريراً طبياً معتمداً يشمل فصيلة دمك، الحساسية الممنوعة، الأمراض المزمنة، وقائمة أدويتك وجرعاتها ليقدم للطبيب أو المستشفى',
        'Export a certified medical summary document featuring blood group, allergies, chronic history, and active drug doses'
      ),
      color: '#1d4ed8',
    },
    {
      to: '/meal-planner',
      icon: '🥗',
      badge: tr(lang, 'جدول الوجبات', 'Meal Plans'),
      title: tr(lang, 'مُولّد وجبات الأمراض المزمنة الذكي بأكلات مصرية', 'Egyptian Chronic Disease Smart Meal Planner'),
      desc: tr(
        lang,
        'ولد بضغطة زر خطة وجبات ليوم كامل (فطار، غداء، عشاء، وسناك) لمرضى السكر والضغط والكلى والدهون والنقرس بأكلات متوفرة في بيتك',
        'Generate an authentic, healthy daily Egyptian meal plan for diabetes, hypertension, kidney disease, cholesterol, and gout'
      ),
      color: '#059669',
    },
    {
      to: '/body-map',
      icon: '🧍‍♂️',
      badge: tr(lang, 'خريطة الألم', 'Body Map'),
      title: tr(lang, 'خريطة جسم الإنسان التفاعلية لتشخيص الأعراض باللمس', 'Interactive 3D/SVG Human Body Symptom Map'),
      desc: tr(
        lang,
        'اضغط بإيدك مباشرة على مكان الوجع في مجسم جسم الإنسان (أمام وخلف) لينور العضو ويبدأ حوار الطبيب الذكي وفحص علامات الخطورة فوراً',
        'Tap directly on any painful area on the front or back human body silhouette for guided clinical triage and red-flag checks'
      ),
      color: '#0f766e',
    },
    {
      to: '/food-drug-checker',
      icon: '☕',
      badge: tr(lang, 'أكلك ودوائك', 'Food & Meds'),
      title: tr(lang, 'فاحص «الأكل والشرب مع دوائك» والفاصل الزمني بالساعة', 'Egyptian Food, Drink & Timing Interaction Checker'),
      desc: tr(
        lang,
        'اعرف فوراً تأثير الشاي والقهوة واللبن والجبنة والعرقسوس والملوخية على أدويتك، وإيه اللي يبطل مفعول الدواء وتفصل بينهم بكام ساعة بالضبط',
        'Check how tea, coffee, dairy, licorice, and leafy greens interact with your medications and exact hour separation rules'
      ),
      color: '#d97706',
    },
    {
      to: '/lab-photo-scanner',
      icon: '📸',
      badge: tr(lang, 'فحص التحاليل', 'Lab Scanner'),
      title: tr(lang, 'الماسح الذكي لورق التحاليل والروشتات بالمؤشرات الملونة', 'Smart AI Lab Report & Prescription Photo Scanner'),
      desc: tr(
        lang,
        'صوّر ورقة التحليل أو الروشتة بالموبايل أو أدخل أرقامك لترى مؤشرات ملونة (أخضر طبيعي، أصفر، أحمر خطر) وشرح كل تحليل بالعربي البسيط',
        'Snap a photo of your lab report or prescription or adjust live gauges for instant color-coded clinical interpretation'
      ),
      color: '#2563eb',
    },
    {
      to: '/organ-simulator',
      icon: '🫀',
      badge: tr(lang, 'محاكي الأعضاء', 'Organ Sim'),
      title: tr(lang, 'محاكي الأثر البصري للدواء والتفاعلات داخل أعضاء الجسم', 'Interactive Visual Organ & Drug Reaction Simulator'),
      desc: tr(
        lang,
        'شاهد بالرسوم التفاعلية ماذا يحدث داخل الكلى والمعدة والرئتين عند خلط المسكنات مع دواء الضغط (الضربة الثلاثية) أو أخذ حقنة البرد',
        'See inside the kidneys, stomach, and lungs how medications work and how dangerous drug mixes cause organ injury'
      ),
      color: '#4f46e5',
    },
    {
      to: '/symptom-triage',
      icon: '🩺',
      badge: tr(lang, 'تحديد التخصص', 'Specialty'),
      title: tr(lang, 'مشخص الأعراض الذكي وتوجيه المريض للتخصص الصحيح', 'Smart Symptom Triage & Doctor Specialty Finder', 'Triage Intelligent des Symptômes', 'Triaje Inteligente de Síntomas'),
      desc: tr(
        lang,
        'اختر مكان الوجع ليحدد لك النظام التشخيص المبدئي، هل الحالة طوارئ مستشفى أم عيادة، وأي دكتور تكشف عنده مع تحويل مباشر للعيادة المختصة',
        'Select your body pain zone to get urgency triage (ER vs clinic), exact specialist recommendation, and 1-click clinic routing'
      ),
      color: '#138866',
    },
    {
      to: '/clinics',
      icon: '🏥',
      badge: tr(lang, 'مجمع العيادات', 'Clinics'),
      title: tr(lang, 'مجمع العيادات التخصصية المتكاملة (العيادات)', 'DAWAYA Specialty Medical Clinics Hub', 'Pôle de Cliniques Médicales Spécialisées', 'Centro de Clínicas Médicas Especializadas'),
      desc: tr(
        lang,
        'بوابة المستشفى التخصصي: عيادة النساء والحمل، عيادة الأطفال وأول سنة، عيادة العظام والنقرس، الجهاز الهضمي والقولون، الجلدية والحروق، طوارئ الأسنان، أنيميا الفول، والباطنة والسكر والضغط',
        'Complete 20-clinic hospital portal: Ob-Gyn, Pediatrics, Orthopedics & Gout, Gastroenterology & IBS, Dermatology & Burns, Dental ER, G6PD Favism & Chronic Care'
      ),
      color: '#0D1F38',
    },
    {
      to: '/baby-first-year',
      icon: '👶',
      badge: tr(lang, 'عيادة الرضيع وأول سنة', 'Newborn & 1st Year Hub', 'Clinique Bébé 1 An', 'Clínica del Bebé 1er Año'),
      title: tr(lang, 'موسوعة وعيادة «أول سنة مع طفلك»', 'First-Year Baby & Newborn Complete Clinic', 'Guide Complet Première Année Bébé', 'Guía Completa del Primer Año del Bebé'),
      desc: tr(
        lang,
        'الممنوعات القاتلة قبل سنة (العسل، اللبن البقري، المشاية)، جدول تطعيمات الصحة والروتا، جدول الأكل شهر بشهر، كاشف ألوان البراز، وطوارئ الصفراء والشرقة',
        'Complete newborn & infant clinic: under-1 forbidden foods/meds, Egypt vaccine schedule, weaning roadmap, stool color decoder, milestones & choking/jaundice protocols'
      ),
      color: '#0284c7',
    },
    {
      to: '/pregnancy-guide',
      icon: '🤰',
      badge: tr(lang, 'استشاري 40 سنة خبرة', 'Senior Ob-Gyn 40y', 'Gynécologie 40 Ans', 'Ginecología 40 Años'),
      title: tr(lang, 'دليل وموسوعة سلامة الحامل والرضاعة', 'Pregnancy & Nursing Safety Hub', 'Guide Sécurité Grossesse & Allaitement', 'Guía de Seguridad en Embarazo y Lactancia'),
      desc: tr(
        lang,
        'الممنوع والمسموح بالأدلة الطبية: الأكلات (الكبدة، التونة، الرنجة)، الأدوية والمسكنات، الفيتامينات، الأعشاب (القرفة)، والقطط مع نصائح الأطباء',
        'Clinical foods, OTC drugs, herbs & lifestyle safety guide during pregnancy & nursing with 40-year senior obstetrician insights'
      ),
      color: '#e11d48',
    },
    {
      to: '/home-cabinet',
      icon: '🗄️',
      badge: tr(lang, 'فرز الدرج والأشرطة', 'Drawer Audit', 'Pharmacie Maison', 'Botiquín'),
      title: tr(lang, 'كاشف وفرز صيدلية البيت', 'Home Medicine Cabinet Auditor', 'Audit Pharmacie Maison', 'Auditor de Botiquín'),
      desc: tr(
        lang,
        'فرز أدوية الدرج المجهولة واكتشاف الأدوية الفاسدة بعد فتحها (كالقطرات بعد 28 يوماً) وحماية العائلة',
        'Audit mystery strips in your drawer, detect post-opening expiration & purge toxic meds'
      ),
      color: '#138866',
    },
    {
      to: '/ramadan-clock',
      icon: '🕌',
      badge: tr(lang, 'إفطار وسحور', 'Iftar & Suhur', 'Ramadan', 'Ramadán'),
      title: tr(lang, 'رادار أمان صيام رمضان والنوافل', 'Ramadan & Fasting Medication Clock', 'Horloge Médicale Ramadan', 'Reloj de Ayuno Ramadán'),
      desc: tr(
        lang,
        'إعادة جدولة الأدوية للصائمين بين الإفطار والسحور بأمان وتجنب هبوط السكر وجفاف الكلى',
        'Safely reschedule daily medications between Iftar and Suhur to avoid dehydration'
      ),
      color: '#0d9488',
    },
    {
      to: '/travel-kit',
      icon: '🧳',
      badge: tr(lang, 'طوارئ المصيف والعمرة', 'Travel Meds', 'Kit Voyage', 'Kit de Viaje'),
      title: tr(lang, 'حقيبة أدوية السفر والمصيف والعمرة', 'Travel & Vacation Med Kit', 'Trousse Médicale Voyage', 'Botiquín de Viaje'),
      desc: tr(
        lang,
        'قائمة مجهزة لحقيبة السفر: دوار الطريق، المغص، النزلات المعوية، وحروق الشمس بالأدوية المصرية',
        'Smart travel emergency kit: motion sickness, traveler diarrhea, bites & sunburns'
      ),
      color: '#0284c7',
    },
    {
      to: '/passport',
      icon: '🪪',
      badge: tr(lang, 'كارت الطوارئ و QR', 'Medical ID & QR', 'Carte Médicale', 'Tarjeta Médica'),
      title: tr(lang, 'الكارت الطبي الذكي (ID Card)', 'Smart Medical ID & Passport', 'Carte Médicale Intelligente', 'Tarjeta Médica Inteligente'),
      desc: tr(
        lang,
        'بطاقتك الصحية الذكية مع فصيلة الدم، الحساسية، الأمراض المزمنة، وأدويتك الحالية بـ QR للطوارئ والطباعة',
        'Personal emergency ID card with blood type, allergies, chronic conditions, active meds & printable QR'
      ),
      color: '#138866',
    },
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
      color: '#138866',
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
      badge: tr(lang, 'وفّر 60% في روشتتك 🛒', 'Save 60% on Rx 🛒', 'Économies 60%', 'Ahorro 60%'),
      title: tr(lang, 'حاسبة وفر الروشتة والبديل الأرخص', 'Rx Basket & Generic Cost Saver', 'Économiseur d’Ordonnance', 'Ahorro de Receta'),
      desc: tr(
        lang,
        'احسب وفر روشتتك كاملة بالبدائل المصرية المتطابقة 100% في المادة والتركيز وشاركها على واتساب',
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
    {
      to: '/cold-shot-warning',
      icon: '💉',
      badge: tr(lang, 'تحذير قاتل 3×1', '3-in-1 Danger', 'Danger 3-en-1', 'Peligro 3 en 1'),
      title: tr(lang, 'تحذير «حقنة البرد / الخلطة 3×1»', 'Cold Shot 3-in-1 Cocktail Warning', 'Alerte Injection 3-en-1', 'Alerta Inyección 3 en 1'),
      desc: tr(
        lang,
        'محاكاة تفاعلية تكشف خطورة خلط المضاد الحيوي والكورتيزون والمسكن في سرنجة واحدة',
        'Interactive simulation revealing the life-threatening risks of mixing antibiotics, steroids & NSAIDs'
      ),
      color: '#dc2626',
    },
    {
      to: '/airport-banned-meds',
      icon: '✈️',
      badge: tr(lang, 'تجنب الاحتجاز والغرامة', 'Airport & Customs Check', 'Douane & Aéroports', 'Aduana y Aeropuertos'),
      title: tr(lang, 'كاشف الأدوية الممنوعة في المطارات', 'Airport & Customs Banned Meds Scanner', 'Scanner Médicaments Interdits Voyage', 'Escáner de Fármacos Prohibidos en Viajes'),
      desc: tr(
        lang,
        'فحص أدوية السفر والجمارك (الخليج، أوروبا، جورجيا، أمريكا): متطلبات التقرير الطبي، والكميات المسموحة، وبدائل الترامادول والمهدئات',
        'Airport & customs restrictions scanner: medical report requirements, banned narcotics, Gulf/EU/US rules & safe OTC alternatives'
      ),
      color: '#e11d48',
    },
    {
      to: '/baby-milk',
      icon: '🍼',
      badge: tr(lang, 'دليل وبدائل الرضع', 'Baby Milk Formulas', 'Laits Infantiles', 'Fórmulas Infantiles'),
      title: tr(lang, 'دليل وبدائل حليب الأطفال والألبان العلاجية', 'Baby Milk Formula & Therapeutic Navigator', 'Navigateur Laits Bébé Thérapeutiques', 'Guía de Fórmulas Infantiles'),
      desc: tr(
        lang,
        'خريطة كاملة للألبان في مصر (رقم 1، 2، 3) وبدائل ألبان حساسية بروتين اللبن (HA / Pepti)، الارتجاع (AR)، واللاكتوز (LF) مع حاسبة عدد المكاييل',
        'Egypt baby formulas guide: stage 1-3, CMPA hypoallergenic, anti-reflux (AR), lactose-free (LF) & scoop-to-water ratio calculator'
      ),
      color: '#0284c7',
    },
    {
      to: '/senior-pills',
      icon: '👵',
      badge: tr(lang, 'فاحص باللون والصوت', 'Senior Pill ID & Voice', 'Identification Pilules Senior', 'Identificador Visual y Voz'),
      title: tr(lang, 'مساعد كبار السن بالصوت وفاحص شكل الحبة', 'Senior Pill Visual Identifier & Voice Assistant', 'Assistant Visuel & Vocal Seniors', 'Asistente Visual y de Voz para Adultos Mayores'),
      desc: tr(
        lang,
        'التعرف على الحبة من لونها (أبيض، أحمر، أصفر...) وشكلها، مع نطق الجرعة وتعليمات الاستخدام صوتياً بخط كبير مناسب للأجداد',
        'Visual pill identification by color and shape with large text and Arabic audio readout of doses and warnings for seniors'
      ),
      color: '#d97706',
    },
    {
      to: '/steroid-taper',
      icon: '📉',
      badge: tr(lang, 'سحب آمن ومنع صدمة', 'Steroid Tapering Plan', 'Sevrage Corticoïdes', 'Desescalada de Corticoides'),
      title: tr(lang, 'حاسبة إيقاف الكورتيزون التدريجي', 'Safe Steroid Tapering Schedule Calculator', 'Calculateur de Sevrage Dégressif Corticoïdes', 'Calculadora de Reducción Progresiva de Cortisona'),
      desc: tr(
        lang,
        'حساب جدول سحب وتخفيض جرعات الكورتيزون (بريدنيزولون، ديكساميثازون) خطوة بخطوة لتفادي الفشل الكظري وأعراض الانسحاب الحادة',
        'Gradual steroid tapering calendar to safely withdraw prednisone/dexamethasone without risking adrenal insufficiency'
      ),
      color: '#4f46e5',
    },
    {
      to: '/hypo-rescue',
      icon: '🚨',
      badge: tr(lang, 'طوارئ السكر وقاعدة 15', 'Hypoglycemia Rescue', 'Urgence Hypoglycémie', 'Rescate de Hipoglucemia'),
      title: tr(lang, 'خطة إنقاذ هبوط السكر الحاد وقاعدة 15 الذهبية', 'Hypoglycemia Emergency Rescue & Rule of 15', 'Protocole Sauvetage Hypoglycémie Règle 15', 'Plan de Rescate de Hipoglucemia Regla de 15'),
      desc: tr(
        lang,
        'إرشادات فورية بالثواني لإنقاذ مريض السكري عند الهبوط: جرعات السكريات السريعة، متى يستخدم الجلوكاجون، وأخطاء قاتلة يجب تجنبها',
        'Step-by-step Rule of 15 rescue protocol for diabetic hypoglycemia: fast-acting sugars, rescue position, glucagon, and what never to do'
      ),
      color: '#dc2626',
    },
    {
      to: '/inhaler-counter',
      icon: '🫁',
      badge: tr(lang, 'رصيد الجرعات والأزمة', 'Inhaler Dose Tracker', 'Compteur Doses Inhalateur', 'Contador de Dosis de Inhalador'),
      title: tr(lang, 'عداد رصيد بخاخات الصدر والربو', 'Asthma & COPD Inhaler Dose Counter', 'Compteur de Doses pour Inhalateurs Asthme', 'Contador de Dosis de Inhaladores Asma y EPOC'),
      desc: tr(
        lang,
        'تتبع عدد البخات المتبقية في بخاخات الفنتولين والسيريتيد والبيكلوزون بدقة لمنع نفاد البخاخ فجأة أثناء نوبة الربو الحادة',
        'Track remaining sprays in rescue & controller inhalers (Ventolin, Seretide, Foster) so asthma patients never run out mid-crisis'
      ),
      color: '#059669',
    },
    {
      to: '/games',
      icon: '🎮',
      badge: tr(lang, 'محاكاة 3D', '3D Simulators', 'Simulateurs 3D', 'Simuladores 3D'),
      title: tr(lang, 'مركز الألعاب ومحاكي المستشفى 3D', '3D Medical Game & Hospital Center', 'Centre de Jeux Médicaux 3D', 'Centro de Juegos Médicos 3D'),
      desc: tr(
        lang,
        'عالم مفتوح 3D، أكاديمية التمريض، ألغاز العدوى، ومختبر البكتيريا التفاعلي',
        '3D open-world hospital, Nurse Academy, Medical Mystery cases & Bacteria Lab'
      ),
      color: '#8b5cf6',
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
          background: linear-gradient(145deg, #101E36 0%, #162B4D 52%, #138866 100%);
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
          border: 2.5px solid #138866;
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
          color: #138866;
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
          padding: 8px 16px;
          border-radius: 999px;
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.08);
          color: #f8fafc !important;
          font-size: 0.84rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        :root:not([data-theme="dark"]) .bento-persona-pill {
          border-color: #cbd5e1;
          background: #ffffff;
          color: #0D1F38 !important;
        }
        .bento-persona-pill:hover {
          border-color: #10b981;
          color: #10b981 !important;
        }
        .bento-persona-pill.active {
          background: #10b981 !important;
          color: #ffffff !important;
          border-color: #10b981 !important;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
        }
        :root:not([data-theme="dark"]) .bento-persona-pill.active {
          background: #059669 !important;
          color: #ffffff !important;
          border-color: #059669 !important;
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
          background: #0d1f38;
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          padding: 16px;
          text-decoration: none;
          color: #f8fafc !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        :root:not([data-theme="dark"]) .bento-card {
          background: #ffffff;
          border-color: #e2e8f0;
          color: #0D1F38 !important;
          box-shadow: 0 6px 20px rgba(16, 30, 54, 0.05);
        }
        .bento-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(16, 185, 129, 0.25);
          border-color: var(--accent-color, #10b981);
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
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
          flex-shrink: 1;
        }
        .bento-card h3 {
          margin: 0 0 4px;
          font-size: 1.02rem;
          font-weight: 900;
          line-height: 1.35;
          color: inherit !important;
        }
        .bento-card p {
          margin: 0;
          font-size: 0.82rem;
          color: #cbd5e1 !important;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        :root:not([data-theme="dark"]) .bento-card p {
          color: #64748b !important;
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
          .bento-card-head {
            min-height: 38px !important;
            gap: 4px !important;
            margin-bottom: 8px !important;
          }
          .bento-badge {
            font-size: 0.62rem !important;
            padding: 2px 5px !important;
            max-width: 80px !important;
            letter-spacing: -0.2px;
          }
          .bento-card h3 {
            font-size: 0.88rem !important;
            word-break: break-word;
          }
          .bento-card p {
            font-size: 0.75rem !important;
          }
        }
      `}</style>

      {/* Clean, Actionable DAWAYA Hero Section with Signature Stethoscope-D Wordmark & Search Layout */}
      <section className="modern-hero">
        <div className="wrap modern-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <DawayaFullWordmark
              width={255}
              theme="sage"
              style={{
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                boxShadow: '0 10px 28px rgba(16, 30, 54, 0.32)',
              }}
            />
          </div>
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
              <span className="hero-search-icon" aria-hidden="true" style={{ display: "inline-flex", alignItems: "center" }}><HeroSearchVectorIcon size={20} color="#138866" /></span>
              <input
                type="search"
                className="hero-search-input"
                value={q}
                onFocus={() => { setFocused(true); void import('./dawayaDrugDatabaseService').then((m) => m.ensureDawayaDatabaseLoaded()); }}
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
                <HeroMicVectorIcon size={19} color="#0D1F38" />
              </button>

              {/* Direct Barcode Scanner Camera Link */}
              <Link
                to="/scan"
                className="hero-action-icon-btn"
                title={tr(lang, 'مسح الباركود أو QR بالكاميرا', 'Scan barcode or QR with camera')}
                aria-label={tr(lang, 'مسح الباركود بالكاميرا', 'Scan barcode')}
              >
                <HeroScannerVectorIcon size={19} color="#138866" />
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
                        background: '#138866',
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
              <Link to="/passport" className="hero-quick-tag" style={{ background: 'rgba(19, 136, 102, 0.32)', borderColor: '#CFD29D', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <DawayaRouteVectorIcon route="/passport" size={16} color="#CFD29D" />
                <span>{tr(lang, 'الكارت الطبي الذكي (ID)', 'Smart Medical ID')}</span>
              </Link>
              <Link to="/patient-dashboard" className="hero-quick-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <DawayaRouteVectorIcon route="/patient-dashboard" size={16} color="#CFD29D" />
                <span>{tr(lang, 'لوحة المريض', 'Patient Dashboard')}</span>
              </Link>
              <Link to="/complete-checkup" className="hero-quick-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <DawayaRouteVectorIcon route="/complete-checkup" size={16} color="#CFD29D" />
                <span>{tr(lang, 'فحص الروشتة', 'Rx Checkup')}</span>
              </Link>
              <Link to="/pediatric-helper" className="hero-quick-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <DawayaRouteVectorIcon route="/pediatric-helper" size={16} color="#CFD29D" />
                <span>{tr(lang, 'حاسبة الأطفال', 'Pediatric Dose')}</span>
              </Link>
              <Link to="/cost-saver" className="hero-quick-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <DawayaRouteVectorIcon route="/cost-saver" size={16} color="#CFD29D" />
                <span>{tr(lang, 'البديل الأرخص', 'Cost Saver')}</span>
              </Link>
              <Link to="/green-prescription" className="hero-quick-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <DawayaRouteVectorIcon route="/green-prescription" size={16} color="#CFD29D" />
                <span>{tr(lang, 'الروشتة الخضراء', 'Green Rx')}</span>
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
        {/* Quick Symptom & Condition Finder Strip */}
        <section className="card" style={{ padding: '14px 16px', borderTop: '3px solid #138866' }}>
          <div className="row wrapRow" style={{ justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
            <b style={{ fontSize: '0.96rem', color: 'var(--navy)' }}>
              {tr(lang, 'ابحث سريعاً حسب العرض أو التخصص الطبي:', 'Quick Browse by Symptom or Specialty:')}
            </b>
            <Link to="/medicines" className="small" style={{ fontWeight: 700, textDecoration: 'none', color: '#138866' }}>
              {tr(lang, 'تصفح كل الفئات (22 فئة) ←', 'Browse All Categories →')}
            </Link>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            {[
              { q: 'باراسيتامول', cat: 'analgesics_antipyretics', ar: 'صداع وحرارة', en: '🤕 Fever & Pain' },
              { q: 'حساسية', cat: 'respiratory_cold_allergy', ar: 'برد وحساسية', en: '🤧 Cold & Allergy' },
              { q: 'بانتوبرازول', cat: 'gastrointestinal', ar: 'حموضة والجهاز الهضمي', en: '🔥 Stomach & GERD' },
              { q: 'بيسوبرولول', cat: 'cardiovascular', ar: 'الضغط والقلب', en: '💓 Blood Pressure & Heart' },
              { q: 'ميتفورمين', cat: 'endocrine_diabetes', ar: 'تنظيم السكري', en: '🩸 Diabetes Care' },
              { q: 'ديكلوفيناك', cat: 'analgesics_antipyretics', ar: 'مسكنات العظام والمفاصل', en: '🦴 Joint & Muscle Pain' },
              { q: 'فيتامين', cat: 'vitamins_supplements', ar: 'فيتامينات ومناعة', en: '⚡ Vitamins & Immunity' },
              { q: 'شراب', cat: 'all', ar: 'أدوية وأشربة الأطفال', en: '👶 Pediatric Syrups & Drops' },
            ].map((sym) => (
              <Link
                key={sym.ar}
                to={sym.cat !== 'all' ? `/medicines?cat=${sym.cat}` : `/medicines?q=${encodeURIComponent(sym.q)}`}
                className="symptom-quick-chip"
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(56, 189, 248, 0.16)",
                  border: "1.2px solid rgba(56, 189, 248, 0.45)",
                  color: "#7dd3fc",
                  textDecoration: "none",
                  fontWeight: 800,
                  fontSize: "0.84rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                {isAr ? sym.ar : sym.en}
              </Link>
            ))}
          </div>
        </section>

        {/* Recently Viewed Medicines Strip (Shown automatically when user has viewed 1+ medicines) */}
        {recentMeds.length > 0 && (
          <section className="card" style={{ padding: '14px 16px', background: 'rgba(207, 210, 157, 0.12)', border: '1px solid rgba(207, 210, 157, 0.5)' }}>
            <div className="row wrapRow" style={{ justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
              <b style={{ fontSize: '0.92rem', color: 'var(--navy)' }}>
                🕒 {tr(lang, 'أدوية تصفحتها مؤخراً:', 'Recently Viewed Medicines:')}
              </b>
              <button
                type="button"
                className="btn small ghost"
                style={{ padding: '2px 8px', fontSize: '0.74rem' }}
                onClick={() => {
                  clearRecentlyViewedMedicines();
                  setRecentMeds([]);
                }}
              >
                {tr(lang, 'مسح السجل', 'Clear')}
              </button>
            </div>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              {recentMeds.map((rm) => (
                <Link
                  key={rm.id}
                  to={`/medicine/${rm.id}`}
                  className="badge"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    color: 'var(--navy)',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  💊 {isAr ? rm.nameAr : rm.nameEn}
                  {rm.priceEgp ? (
                    <span style={{ color: '#138866', marginInlineStart: '6px' }}>
                      ({rm.priceEgp.toFixed(0)} {isAr ? 'ج.م' : 'EGP'})
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        )}
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
                    <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center" }}><DawayaRouteVectorIcon route={tab.id} size={16} color={active ? "#CFD29D" : "currentColor"} /></span>
                    <span>{isAr ? tab.ar : tab.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bento-grid">
            {(() => {
              const personaPaths: Record<PersonaType, string[]> = {
                all: ['/body-map', '/clinics', '/missed-dose-rescue', '/meal-planner', '/food-drug-checker', '/medical-report', '/vaccine-tracker', '/doctor-visit-prep'],
                patient: ['/body-map', '/missed-dose-rescue', '/meal-planner', '/food-drug-checker', '/medical-report', '/patient-dashboard'],
                mother: ['/vaccine-tracker', '/pediatric-helper', '/baby-first-year', '/women-clinic', '/missed-dose-rescue', '/allergy-checker'],
                doctor: ['/clinics', '/doctor-visit-prep', '/prescription-radar', '/lab-photo-scanner', '/organ-simulator', '/interactions'],
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
                      <DawayaRouteVectorIcon route={tool.to} size={24} color={tool.color} />
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
        <Suspense fallback={null}>
          <PublicPartnerPlacementSection placement="homepage_featured" />
        </Suspense>

        {/* WHO AWaRe & Rational Medication Stewardship Section (Preserved from Original Site inside Comprehensive DAWAYA Identity) */}
        <section className="card stack" style={{ borderTop: '4px solid #138866' }}>
          <div className="head" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className="dawaya-pill-badge" style={{ marginBottom: '6px' }}>
                <span>🌍</span>
                <span>
                  {tr(
                    lang,
                    'ركن الأمان الدوائي وترشيد المضادات الحيوية (WHO AWaRe & EDA)',
                    'Medication Safety & WHO AWaRe Antibiotic Stewardship'
                  )}
                </span>
              </span>
              <h2 style={{ margin: 0 }}>
                {tr(
                  lang,
                  'تصنيف منظمة الصحة العالمية للمضادات الحيوية (Access • Watch • Reserve)',
                  'WHO AWaRe Antibiotic Classification (Access • Watch • Reserve)'
                )}
              </h2>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {tr(
                  lang,
                  'إلى جانب تغطية أكثر من 26,562 دواء في كافة التخصصات، تدمج منصة دوايا معايير منظمة الصحة العالمية لحماية فعالية المضادات الحيوية المنقذة للحياة:',
                  'Alongside 26,562+ medicines across all specialties, DAWAYA integrates WHO AWaRe standards to preserve life-saving antibiotics:'
                )}
              </p>
            </div>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              <Link to="/awareness-week" className="btn small ghost">
                🌍 {tr(lang, 'حملة نوفمبر العالمية', 'WAAW Campaign')}
              </Link>
              <Link to="/cold-shot-warning" className="btn small ghost" style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                💉 {tr(lang, 'تحذير حقنة البرد 3×1', 'Cold Shot 3×1 Danger')}
              </Link>
            </div>
          </div>

          <div className="grid">
            <div className="subcard" style={{ borderInlineStart: '4px solid #16a34a', background: 'rgba(22, 163, 74, 0.06)' }}>
              <strong style={{ color: '#15803d', fontSize: '0.98rem' }}>
                🟢 {tr(lang, 'Access (فئة الإتاحة الأساسية — خط أول)', 'Access (First-Line Essential)')}
              </strong>
              <p className="small" style={{ margin: '6px 0 0' }}>
                {tr(
                  lang,
                  'مضادات خط الدفاع الأول ذات الطيف المحدد والأمان العالي وأقل قابلية لتكوين بكتيريا مقاومة (مثل أموكسيسيلين، أوجمنتين، فلاجيل، نيتروفيورانتوين).',
                  'First-line narrow-spectrum antibiotics with high safety and lower resistance potential (e.g., Amoxicillin, Augmentin, Metronidazole).'
                )}
              </p>
            </div>

            <div className="subcard" style={{ borderInlineStart: '4px solid #d97706', background: 'rgba(217, 119, 6, 0.06)' }}>
              <strong style={{ color: '#b45309', fontSize: '0.98rem' }}>
                🟡 {tr(lang, 'Watch (فئة المراقبة والحذر)', 'Watch (High Resistance Potential)')}
              </strong>
              <p className="small" style={{ margin: '6px 0 0' }}>
                {tr(
                  lang,
                  'مضادات واسعة المجال ذات قابلية أعلى لتكوين سلالات بكتيرية مقاومة وتُصرف لدواعٍ سريرية محددة بوصفة طبية (مثل زيثروماكس، سيبروفار، سيفترياكسون).',
                  'Broad-spectrum antibiotics requiring strict prescription oversight due to higher resistance risk (e.g., Azithromycin, Ciprofloxacin, Ceftriaxone).'
                )}
              </p>
            </div>

            <div className="subcard" style={{ borderInlineStart: '4px solid #dc2626', background: 'rgba(220, 38, 38, 0.06)' }}>
              <strong style={{ color: '#b91c1c', fontSize: '0.98rem' }}>
                🔴 {tr(lang, 'Reserve (فئة الملاذ الأخير بالمستشفيات)', 'Reserve (Last-Resort Hospital Only)')}
              </strong>
              <p className="small" style={{ margin: '6px 0 0' }}>
                {tr(
                  lang,
                  'أدوية الخط الدفاعي الأخير المخصصة للعدوى المستشفوية الشرسة متعددة المقاومة (MRSA / VRE / CRE) تحت إشراف متخصص (مثل لينيزوليد، كوليستين، تيجيسيكلين).',
                  'Last-resort antibiotics reserved strictly for severe multidrug-resistant hospital infections (e.g., Linezolid, Colistin, Tigecycline).'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Did you know? */}
        <DidYouKnow />

        {/* Real-World AMR Numbers Counter */}
        <ResistanceCounter />

        {/* Interactive Quiz, Ambassador Certificate & Audio Education Strip */}
        <div className="grid">
          <section className="card stack" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 6px' }}>
                📝 {tr(lang, 'اختبر معلوماتك واحصل على شهادة سفير الوعي الدوائي', 'Take the Quiz & Earn Your Ambassador Certificate')}
              </h3>
              <p className="small muted" style={{ margin: 0 }}>
                {tr(
                  lang,
                  'اختبار تفاعلي قصير بـ 3 مستويات مع شرح فوري لكل إجابة وإصدار شهادة سفير الأمان الدوائي باسمك.',
                  'Interactive 3-level assessment with clinical explanations and a personalized HD Ambassador Certificate.'
                )}
              </p>
            </div>
            <div className="row wrapRow" style={{ gap: '8px', marginTop: '10px' }}>
              <Link to="/quiz" className="btn small">
                🏅 {tr(lang, 'ابدأ الاختبار واستلم شهادتك', 'Start Quiz & Get Certificate')}
              </Link>
              <Link to="/games" className="btn small ghost">
                🎮 {tr(lang, 'محاكي المستشفى 3D', '3D Hospital Sim')}
              </Link>
            </div>
          </section>

          <section className="card stack" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 6px' }}>
                🎧 {tr(lang, 'استمع وتعلّم (التثقيف الدوائي الصوتي بالعامية والفصحى)', 'Listen & Learn (Audio Medication Guides)')}
              </h3>
              <p className="small muted" style={{ margin: 0 }}>
                {tr(
                  lang,
                  'مقاطع صوتية مبسطة باللهجة المصرية والفصحى لكبار السن والمرضى لشرح قواعد الأمان الدوائي والمضادات الحيوية.',
                  'Accessible audio guides in Egyptian Arabic and English explaining safe medication use for patients and seniors.'
                )}
              </p>
            </div>
            <div className="row wrapRow" style={{ gap: '8px', marginTop: '10px' }}>
              <Link to="/listen" className="btn small">
                🔊 {tr(lang, 'استمع الآن', 'Listen Now')}
              </Link>
              <Link to="/myth" className="btn small ghost">
                💡 {tr(lang, 'خرافة أم حقيقة', 'Myth vs. Fact')}
              </Link>
            </div>
          </section>
        </div>

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
