import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';

type TipTheme =
  | 'cold_flu'
  | 'stomach_nsaid'
  | 'tea_iron'
  | 'heart_bp'
  | 'diabetes'
  | 'pediatric_fever'
  | 'eye_drops'
  | 'antibiotic_course';

interface IllustratedHealthTip {
  id: string;
  theme: TipTheme;
  categoryAr: string;
  categoryEn: string;
  text: Bi;
  actionTo: string;
  actionAr: string;
  actionEn: string;
}

const HEALTH_TIPS: IllustratedHealthTip[] = [
  {
    id: 'tip-flu-1',
    theme: 'cold_flu',
    categoryAr: 'البرد والإنفلونزا',
    categoryEn: 'Cold & Flu',
    text: {
      ar: 'نزلات البرد والإنفلونزا يسببها فيروس، والمضاد الحيوي لا يقتل الفيروسات! الراحة والسوائل الدافئة وبخاخ ماء البحر هي العلاج الصح.',
      en: 'Colds and flu are viral — antibiotics do not kill viruses. Rest, warm fluids, and saline nasal sprays are the right care.',
    },
    actionTo: '/cold-shot-warning',
    actionAr: 'تحذير حقنة البرد ←',
    actionEn: 'Cold Shot Warning →',
  },
  {
    id: 'tip-flu-2',
    theme: 'cold_flu',
    categoryAr: 'حساسية الأنف والبرد',
    categoryEn: 'Nasal & Sinus Care',
    text: {
      ar: 'لا تستخدم بخاخ الأنف المزيل للاحتقان (مثل أوتريفين) لأكثر من 5 أيام متتالية حتى لا يسبب انسداداً ارتدادياً مزمناً بالأنف.',
      en: 'Never use decongestant nasal sprays (e.g. Otrivin) for more than 5 consecutive days to avoid severe rebound congestion.',
    },
    actionTo: '/ent-clinic',
    actionAr: 'عيادة الأنف والأذن ←',
    actionEn: 'ENT Clinic →',
  },
  {
    id: 'tip-tea-1',
    theme: 'tea_iron',
    categoryAr: 'الشاي والحديد والأنيميا',
    categoryEn: 'Tea & Iron Absorption',
    text: {
      ar: 'شرب الشاي أو القهوة بعد قرص الحديد مباشرة يمنع امتصاص 70% منه! افصل بينهما بساعتين وتناول الحديد مع عصير برتقال.',
      en: 'Drinking tea or coffee right after an iron pill blocks up to 70% of its absorption. Separate by 2 hours and pair with Vitamin C.',
    },
    actionTo: '/food-interactions',
    actionAr: 'مُنسّق مواعيد الشاي ←',
    actionEn: 'Tea & Food Matrix →',
  },
  {
    id: 'tip-tea-2',
    theme: 'tea_iron',
    categoryAr: 'هرمون الغدة الدرقية',
    categoryEn: 'Thyroid Hormone',
    text: {
      ar: 'قرص الغدة (إلتروكسين) يؤخذ على الريق بالماء فقط قبل الفطار والقهوة بـ 60 دقيقة كاملة، ويفصل 4 ساعات عن الحديد والكالسيوم.',
      en: 'Take thyroid hormone (Eltroxin) on an empty stomach with plain water 60 minutes before coffee or breakfast, and 4h away from iron/calcium.',
    },
    actionTo: '/daily-schedule',
    actionAr: 'جدول المواعيد اليومي ←',
    actionEn: 'Daily Schedule →',
  },
  {
    id: 'tip-stomach-1',
    theme: 'stomach_nsaid',
    categoryAr: 'أمان المعدة والمسكنات',
    categoryEn: 'Stomach & Painkillers',
    text: {
      ar: 'المسكنات القوية (مثل كتافلام وبروفين وفولتارين) يجب أخذها بعد الأكل مع كوب ماء كامل، ويُمنع خلط مسكنين معاً لحماية المعدة والكلى.',
      en: 'Take NSAIDs (Cataflam, Brufen, Voltaren) strictly after meals with plenty of water, and never combine two NSAIDs together.',
    },
    actionTo: '/gastro-clinic',
    actionAr: 'عيادة المعدة والباطنة ←',
    actionEn: 'Gastro Clinic →',
  },
  {
    id: 'tip-stomach-2',
    theme: 'stomach_nsaid',
    categoryAr: 'أقراص الحموضة والمعدة',
    categoryEn: 'Acid Reflux & PPIs',
    text: {
      ar: 'أقراص المعدة (مثل كونترولوك ونكسيم وأوميز) تعطي أعلى مفعول عند تناولها قبل الفطار بنصف ساعة إلى ساعة، وليس بعد الأكل.',
      en: 'Acid-reducers (Controloc, Nexium, Omez) work best 30–60 minutes before breakfast rather than after meals.',
    },
    actionTo: '/interactions',
    actionAr: 'فحص التداخلات ←',
    actionEn: 'Check Interactions →',
  },
  {
    id: 'tip-heart-1',
    theme: 'heart_bp',
    categoryAr: 'أدوية الضغط والقلب',
    categoryEn: 'Blood Pressure & Heart',
    text: {
      ar: 'تجنب العرقسوس تماماً إذا كنت مريض ضغط أو قلب! كوب واحد من العرقسوس قد يرفع الضغط فجأة ويبطل مفعول دواء الضغط.',
      en: 'Avoid licorice drinks completely if you have high blood pressure or heart disease — even one glass can spike blood pressure.',
    },
    actionTo: '/chronic-clinic',
    actionAr: 'عيادة الضغط والقلب ←',
    actionEn: 'Chronic Care Clinic →',
  },
  {
    id: 'tip-heart-2',
    theme: 'heart_bp',
    categoryAr: 'قاعدة الإيقاف الآمن',
    categoryEn: 'Never Stop Suddenly',
    text: {
      ar: 'لا توقف أدوية الضغط أو منظمات ضربات القلب (مثل كونكور) فجأة بدون طبيب حتى لو تحسن القياس لتجنب ارتفاع الضغط الارتدادي.',
      en: 'Never stop blood pressure or beta-blocker pills (e.g., Concor) abruptly without medical advice to prevent rebound spikes.',
    },
    actionTo: '/missed-dose-rescue',
    actionAr: 'منقذ الجرعة المنسية ←',
    actionEn: 'Missed Dose Rescue →',
  },
  {
    id: 'tip-diabetes-1',
    theme: 'diabetes',
    categoryAr: 'رعاية مرضى السكري',
    categoryEn: 'Diabetes Care',
    text: {
      ar: 'عند هبوط السكر المفاجئ (أقل من 70): طبّق قاعدة 15-15 فوراً (نصف كوب عصير محلى أو 3 ملاعق سكر في ماء وانتظر 15 دقيقة ثم أعد القياس).',
      en: 'For sudden low blood sugar (<70 mg/dL), apply the 15-15 rule immediately: 15g fast sugar (half cup juice) and recheck after 15 minutes.',
    },
    actionTo: '/hypo-rescue',
    actionAr: 'خطة إنقاذ هبوط السكر ←',
    actionEn: 'Hypo Rescue Plan →',
  },
  {
    id: 'tip-peds-1',
    theme: 'pediatric_fever',
    categoryAr: 'صحة الأطفال والسخونية',
    categoryEn: 'Pediatric Fever Care',
    text: {
      ar: 'جرعة خافض الحرارة والمضاد الحيوي للأطفال تُحسب بـ «الوزن بالكيلوجرام» وليس بالعمر! والكمادات توضع على الرقبة وتحت الإبط بماء فاتر وليس مثلجاً.',
      en: 'Children’s fever and antibiotic doses are calculated by exact body weight (kg), not age. Use lukewarm compresses, never ice water.',
    },
    actionTo: '/pediatric-helper',
    actionAr: 'حاسبة جرعات الأطفال ←',
    actionEn: 'Pediatric Calculator →',
  },
  {
    id: 'tip-drops-1',
    theme: 'eye_drops',
    categoryAr: 'صلاحية الدواء بعد الفتح',
    categoryEn: 'Post-Opening Expiry',
    text: {
      ar: 'قطرة العين وشراب المضاد الحيوي المحلول بالماء تنتهي صلاحيتهما بعد الفتح بـ 7 إلى 28 يوماً فقط، حتى لو تاريخ العلبة سارياً لعام قادم!',
      en: 'Eye drops and reconstituted antibiotic syrups expire 7–28 days after opening, regardless of the printed box date!',
    },
    actionTo: '/home-cabinet',
    actionAr: 'عداد الصلاحية بعد الفتح ←',
    actionEn: 'Post-Opening Counter →',
  },
  {
    id: 'tip-abx-1',
    theme: 'antibiotic_course',
    categoryAr: 'كورس المضاد الحيوي',
    categoryEn: 'Antibiotic Stewardship',
    text: {
      ar: 'إكمال كورس المضاد الحيوي بالكامل يمنع عودة العدوى ببكتيريا مقاومة شرسة، حتى لو اختفت الأعراض بعد أول يومين.',
      en: 'Completing your prescribed antibiotic course prevents resistant bacteria from returning, even if symptoms vanish after 2 days.',
    },
    actionTo: '/tracker',
    actionAr: 'متابع الجرعات الذكي ←',
    actionEn: 'Treatment Tracker →',
  },
  {
    id: 'tip-abx-2',
    theme: 'antibiotic_course',
    categoryAr: 'سلامة الحقن بالمنزل',
    categoryEn: 'Safe Injection Protocol',
    text: {
      ar: 'أبداً لا تخلط حقنتين في سرنجة واحدة (مثل فولتارين + ديكساميثازون)، ولا تُعطِ أي مضاد حيوي محلول بالليدوكايين في الوريد إطلاقاً!',
      en: 'Never mix two ampoules in one syringe (e.g., Voltaren + Dexamethasone), and never inject Lidocaine-reconstituted vials IV!',
    },
    actionTo: '/interactions',
    actionAr: 'كاشف أمان الحقن ←',
    actionEn: 'Safe Injection Guard →',
  },
  {
    id: 'tip-flu-3',
    theme: 'cold_flu',
    categoryAr: 'درع السائقين والعمل',
    categoryEn: 'Driver & Work Shield',
    text: {
      ar: 'أدوية البرد والكحة التي تحتوي على مضادات هيستامين منومة قد تسبب نعاساً مفاجئاً على الطريق السريع أو إيجابياً كاذباً في التحليل السريع.',
      en: 'Sedating cold & cough formulas can impair highway alertness and cause false-positive rapid drug strips.',
    },
    actionTo: '/patient-dashboard',
    actionAr: 'درع السائقين والتحليل ←',
    actionEn: 'Driver Shield →',
  },
];

function TipThemeIllustration({ theme }: { theme: TipTheme }) {
  switch (theme) {
    case 'cold_flu':
      return (
        <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="20" fill="#e0f2fe" />
          <path d="M40 16c-6 0-9 5-9 12v10c0 4-4 7-4 11 0 4 4 6 8 6h10c4 0 8-2 8-6 0-4-4-7-4-11V28c0-7-3-12-9-12z" fill="#0284c7" opacity="0.2" stroke="#0284c7" strokeWidth="2.5" />
          <circle cx="54" cy="24" r="9" fill="#10b981" />
          <path d="M50 24l3 3 5-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M22 54c4-3 8-3 12 0" stroke="#0284c7" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'tea_iron':
      return (
        <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="20" fill="#fef3c7" />
          <path d="M20 34h26v16a10 10 0 01-10 10H30a10 10 0 01-10-10V34z" fill="#b45309" opacity="0.22" stroke="#b45309" strokeWidth="2.5" />
          <path d="M46 38h5a5 5 0 010 10h-5" stroke="#b45309" strokeWidth="2.5" fill="none" />
          <circle cx="56" cy="24" r="10" fill="#0D1F38" />
          <path d="M56 19v6l4 2" stroke="#24C8B8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'stomach_nsaid':
      return (
        <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="20" fill="#dcfce7" />
          <path d="M35 16v12c0 5-12 6-12 18 0 10 8 16 18 16 11 0 18-7 18-17 0-9-7-15-15-15" fill="#138866" opacity="0.22" stroke="#138866" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M25 46l8 8 15-15" stroke="#059669" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'heart_bp':
      return (
        <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="20" fill="#fee2e2" />
          <path d="M40 60S18 46 18 31a12 12 0 0122-7 12 12 0 0122 7c0 15-22 29-22 29z" fill="#dc2626" opacity="0.22" stroke="#dc2626" strokeWidth="2.5" />
          <polyline points="22,38 32,38 36,28 42,46 47,35 58,35" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'diabetes':
      return (
        <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="20" fill="#ede9fe" />
          <path d="M40 16s16 18 16 30a16 16 0 11-32 0c0-12 16-30 16-30z" fill="#6d28d9" opacity="0.22" stroke="#6d28d9" strokeWidth="2.5" />
          <text x="40" y="52" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#5b21b6">15:15</text>
        </svg>
      );
    case 'pediatric_fever':
      return (
        <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="20" fill="#ffedd5" />
          <circle cx="34" cy="30" r="11" fill="#ea580c" opacity="0.22" stroke="#ea580c" strokeWidth="2.5" />
          <path d="M22 58c2-9 22-9 24 0" fill="#ea580c" opacity="0.2" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="52" y="20" width="8" height="32" rx="4" fill="#fff" stroke="#dc2626" strokeWidth="2.2" />
          <circle cx="56" cy="52" r="6" fill="#dc2626" />
        </svg>
      );
    case 'eye_drops':
      return (
        <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="20" fill="#cffafe" />
          <path d="M16 40s10-14 24-14 24 14 24 14-10 14-24 14-24-14-24-14z" fill="#0891b2" opacity="0.18" stroke="#0891b2" strokeWidth="2.5" />
          <circle cx="40" cy="40" r="7" fill="#0891b2" />
          <path d="M56 16l4 7a4 4 0 11-8 0l4-7z" fill="#0284c7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="20" fill="#d1fae5" />
          <rect x="23" y="30" width="34" height="20" rx="10" transform="rotate(-35 40 40)" fill="#138866" opacity="0.24" stroke="#138866" strokeWidth="2.5" />
          <line x1="34" y1="32" x2="46" y2="48" stroke="#138866" strokeWidth="2.5" />
        </svg>
      );
  }
}

export default function DidYouKnow() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [index, setIndex] = useState<number>(() => {
    const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 6));
    const randOffset = Math.floor(Math.random() * HEALTH_TIPS.length);
    return (daySeed + randOffset) % HEALTH_TIPS.length;
  });

  const currentTip = HEALTH_TIPS[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + HEALTH_TIPS.length) % HEALTH_TIPS.length);
  };

  return (
    <section
      className="card"
      style={{
        padding: '16px 18px',
        borderInlineStart: '5px solid #138866',
        background: 'linear-gradient(135deg, rgba(19, 136, 102, 0.08) 0%, rgba(207, 210, 157, 0.14) 100%)',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
          <strong style={{ fontSize: '1.02rem', color: 'var(--navy)' }}>
            🌟 {tr(lang, 'نصائح صحية يومية متجددة', 'Daily Illustrated Health Tips')}
          </strong>
          <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800 }}>
            {isAr ? currentTip.categoryAr : currentTip.categoryEn}
          </span>
        </div>
        <span className="small muted">
          {index + 1} / {HEALTH_TIPS.length}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ flexShrink: 0 }}>
          <TipThemeIllustration theme={currentTip.theme} />
        </div>
        <div style={{ flex: '1 1 240px' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, lineHeight: 1.65, fontSize: '0.96rem' }}>
            {pick(currentTip.text, lang)}
          </p>
          <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
            <button type="button" className="btn-secondary small" onClick={handlePrev}>
              {isAr ? '◀ السابقة' : '◀ Prev'}
            </button>
            <button type="button" className="btn-secondary small" onClick={handleNext}>
              🔄 {isAr ? 'نصيحة جديدة ▶' : 'Next Tip ▶'}
            </button>
            <Link to={currentTip.actionTo} className="btn small">
              {isAr ? currentTip.actionAr : currentTip.actionEn}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
