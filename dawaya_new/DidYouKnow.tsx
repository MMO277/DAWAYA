import { useEffect, useState } from 'react';
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
  theme: TipTheme;
  text: Bi;
}

const HEALTH_TIPS: IllustratedHealthTip[] = [
  {
    theme: 'cold_flu',
    text: {
      ar: 'نزلات البرد والإنفلونزا يسببها فيروس، والمضاد الحيوي لا يقتل الفيروسات؛ الراحة والسوائل الدافئة وبخاخ ماء البحر هي العلاج الصحيح.',
      en: 'Colds and flu are viral — antibiotics do not kill viruses. Rest, warm fluids, and saline sprays are the right care.',
    },
  },
  {
    theme: 'cold_flu',
    text: {
      ar: 'لا تستخدم بخاخ الأنف المزيل للاحتقان (مثل أوتريفين) لأكثر من 5 أيام متتالية حتى لا يسبب انسداداً ارتدادياً مزمناً بالأنف.',
      en: 'Never use decongestant nasal sprays (e.g. Otrivin) for more than 5 consecutive days to avoid rebound congestion.',
    },
  },
  {
    theme: 'cold_flu',
    text: {
      ar: 'احذر من «حقنة البرد» الشعبية (مضاد حيوي + مسكن + كورتيزون)؛ فهي ترفع الضغط والسكر وتضعف المناعة وقد تسبب صدمة تحسسية.',
      en: 'Avoid mixed "cold shot" injections; they can spike blood pressure and blood sugar and trigger severe reactions.',
    },
  },
  {
    theme: 'cold_flu',
    text: {
      ar: 'أدوية البرد والكحة التي تحتوي على مضادات هيستامين منومة قد تسبب نعاساً مفاجئاً أثناء القيادة؛ تجنبها قبل السواقة أو العمل على آلات.',
      en: 'Sedating cold & cough formulas can impair driving alertness; avoid them before driving or operating machinery.',
    },
  },
  {
    theme: 'cold_flu',
    text: {
      ar: 'غرغرة الماء الدافئ مع نصف ملعقة ملح كل 6 ساعات تهدئ احتقان الحلق وتقلل تورم اللوزتين بدون أي آثار جانبية.',
      en: 'Warm saltwater gargles every 6 hours soothe sore throat and reduce tonsil swelling safely.',
    },
  },
  {
    theme: 'tea_iron',
    text: {
      ar: 'شرب الشاي أو القهوة بعد قرص الحديد مباشرة يمنع امتصاص 70% منه! افصل بينهما بساعتين وتناول الحديد مع عصير برتقال.',
      en: 'Drinking tea or coffee right after an iron pill blocks up to 70% of absorption. Separate by 2 hours.',
    },
  },
  {
    theme: 'tea_iron',
    text: {
      ar: 'قرص الغدة الدرقية (إلتروكسين) يؤخذ على الريق بالماء فقط قبل الفطار والقهوة بـ 60 دقيقة، ويفصل 4 ساعات عن الحديد والكالسيوم.',
      en: 'Take thyroid pills (Eltroxin) on an empty stomach with water 60 minutes before coffee or breakfast.',
    },
  },
  {
    theme: 'tea_iron',
    text: {
      ar: 'اللبن والجبنة والزبادي يبطلون مفعول بعض المضادات الحيوية مثل السيبروفلوكساسين والتافانيك والدوكسيسيكلين؛ افصل بينهما بساعتين.',
      en: 'Milk, cheese, and yogurt block absorption of ciprofloxacin, levofloxacin, and doxycycline; separate by 2 hours.',
    },
  },
  {
    theme: 'tea_iron',
    text: {
      ar: 'مكملات الكالسيوم والحديد لا يُنصح بأخذهما في نفس الوقت لأن الكالسيوم ينافس الحديد على الامتصاص؛ خذ الحديد نهاراً والكالسيوم ليلاً.',
      en: 'Avoid taking calcium and iron supplements at the exact same hour; take iron earlier and calcium in the evening.',
    },
  },
  {
    theme: 'tea_iron',
    text: {
      ar: 'فيتامين د3 يُمتص بشكل أفضل بكثير عند تناوله بعد أكبر وجبة تحتوي على دهون صحية (مثل الغداء) وليس على معدة فارغة.',
      en: 'Vitamin D3 absorbs far better when taken right after a meal containing healthy fats rather than on an empty stomach.',
    },
  },
  {
    theme: 'stomach_nsaid',
    text: {
      ar: 'المسكنات القوية (مثل كتافلام وبروفين وفولتارين) تؤخذ بعد الأكل مع كوب ماء كامل، ويُمنع خلط مسكنين معاً لحماية المعدة والكلى.',
      en: 'Take NSAIDs (Cataflam, Brufen, Voltaren) strictly after meals with water, and never combine two NSAIDs.',
    },
  },
  {
    theme: 'stomach_nsaid',
    text: {
      ar: 'أقراص المعدة (مثل كونترولوك ونكسيم وأوميز) تعطي أعلى مفعول عند تناولها قبل الفطار بنصف ساعة إلى ساعة، وليس بعد الأكل.',
      en: 'Acid-reducers (Controloc, Nexium, Omez) work best 30–60 minutes before breakfast.',
    },
  },
  {
    theme: 'stomach_nsaid',
    text: {
      ar: 'لا تستلقِ مباشرة بعد بلع كبسولات المضاد الحيوي أو المسكنات؛ اجلس منتصباً لمدة 30 دقيقة مع كوب ماء كبير لحماية المريء من القرح.',
      en: 'Stay upright for 30 minutes with a full glass of water after swallowing capsules to prevent esophageal irritation.',
    },
  },
  {
    theme: 'stomach_nsaid',
    text: {
      ar: 'فوارات الحموضة التي تحتوي على الصوديوم قد ترفع ضغط الدم إذا استُخدمت يومياً بكثرة؛ استشر الصيدلي في البديل المناسب لمرضى الضغط.',
      en: 'Sodium-rich antacid sachets can elevate blood pressure if overused; ask your pharmacist for low-sodium options.',
    },
  },
  {
    theme: 'stomach_nsaid',
    text: {
      ar: 'الأسبرين بجرعة السيولة (75–100 مجم) والمسكنات القوية مثل الإيبوبروفين قد يتعارضان إذا أُخذا معاً؛ افصل بينهما أو استشر طبيبك.',
      en: 'Low-dose aspirin and ibuprofen can interfere when taken together; consult your doctor on proper spacing.',
    },
  },
  {
    theme: 'heart_bp',
    text: {
      ar: 'تجنب العرقسوس تماماً إذا كنت مريض ضغط أو قلب! كوب واحد من العرقسوس قد يرفع الضغط فجأة ويبطل مفعول دواء الضغط.',
      en: 'Avoid licorice drinks completely if you have high blood pressure or heart disease.',
    },
  },
  {
    theme: 'heart_bp',
    text: {
      ar: 'لا توقف أدوية الضغط أو منظمات ضربات القلب (مثل كونكور) فجأة بدون طبيب حتى لو تحسن القياس لتجنب ارتفاع الضغط الارتدادي.',
      en: 'Never stop blood pressure or beta-blocker pills abruptly without medical advice.',
    },
  },
  {
    theme: 'heart_bp',
    text: {
      ar: 'تجنب عصير الجريب فروت تماماً مع أدوية الكوليسترول (مثل ليبيتور) وبعض أدوية الضغط لأنه يضاعف تركيز الدواء في الدم.',
      en: 'Avoid grapefruit juice with statin cholesterol pills and certain blood pressure medications.',
    },
  },
  {
    theme: 'heart_bp',
    text: {
      ar: 'أفضل وقت لقياس ضغط الدم بدقة هو بعد الجلوس في هدوء لمدة 5 دقائق، مع وضع الذراع في مستوى القلب وتجنب القهوة قبلها بنصف ساعة.',
      en: 'Measure blood pressure after 5 minutes of quiet rest, with your arm supported at heart level.',
    },
  },
  {
    theme: 'heart_bp',
    text: {
      ar: 'الأقراص ممتدة المفعول (SR / XR / Retard) ممنوع كسرها أو طحنها أبداً لأن ذلك يطلق الجرعة كلها مرة واحدة في الدم.',
      en: 'Never crush or split Extended-Release (SR/XR) tablets; doing so releases the entire dose at once.',
    },
  },
  {
    theme: 'diabetes',
    text: {
      ar: 'عند هبوط السكر المفاجئ (أقل من 70): طبّق قاعدة 15-15 فوراً (نصف كوب عصير محلى أو 3 ملاعق سكر في ماء وانتظر 15 دقيقة).',
      en: 'For sudden low blood sugar (<70), apply the 15-15 rule immediately and recheck in 15 minutes.',
    },
  },
  {
    theme: 'diabetes',
    text: {
      ar: 'قلم الأنسولين المفتوح صالح لمدة 28 يوماً فقط؛ في حر الصيف الشديد احفظه بعيداً عن الشمس والحرارة وأخرجه قبل الحقن بـ 10 دقائق.',
      en: 'Opened insulin pens stay valid for 28 days; protect them from summer heat and direct sunlight.',
    },
  },
  {
    theme: 'diabetes',
    text: {
      ar: 'تبديل مكان حقنة الأنسولين في البطن أو الفخذ يمنع تكتل الدهون تحت الجلد ويضمن امتصاصاً منتظماً للأنسولين كل يوم.',
      en: 'Rotating insulin injection sites prevents skin lumps and ensures steady daily absorption.',
    },
  },
  {
    theme: 'diabetes',
    text: {
      ar: 'أقراص الجلوكوفاج (ميتفورمين) يُفضّل تناولها وسط أو بعد الأكل مباشرة لتقليل اضطرابات المعدة والغثيان.',
      en: 'Metformin tablets are best taken with or right after meals to minimize stomach upset.',
    },
  },
  {
    theme: 'pediatric_fever',
    text: {
      ar: 'جرعة خافض الحرارة والمضاد الحيوي للأطفال تُحسب بالوزن (كجم) وليس بالعمر، والكمادات تكون بماء فاتر وليس مثلجاً.',
      en: 'Children’s fever and antibiotic doses are calculated by weight (kg), not age; use lukewarm compresses.',
    },
  },
  {
    theme: 'pediatric_fever',
    text: {
      ar: 'لا تعطي الأسبرين للأطفال أو المراهقين أثناء السخونية أو العدوى الفيروسية أبداً لتجنب مضاعفات خطيرة؛ استخدم الباراسيتامول فقط.',
      en: 'Never give aspirin to children or teenagers during viral fevers; use weight-dosed paracetamol instead.',
    },
  },
  {
    theme: 'pediatric_fever',
    text: {
      ar: 'استخدم سرنجة أو معيار الدواء المدرّج بالملليلتر (سم) لجرعة طفلك، ولا تستخدم ملعقة الشاي المنزلية لأن حجمها غير دقيق.',
      en: 'Always use a marked oral syringe (mL) for children’s liquid medicines instead of kitchen teaspoons.',
    },
  },
  {
    theme: 'pediatric_fever',
    text: {
      ar: 'عسل النحل آمن ومفيد لتهدئة الكحة للأطفال أكبر من سنة واحدة فقط؛ وممنوع تماماً للرضع أقل من 12 شهراً.',
      en: 'Honey helps soothe cough in children over 1 year old, but must never be given to infants under 12 months.',
    },
  },
  {
    theme: 'eye_drops',
    text: {
      ar: 'قطرة العين وشراب المضاد الحيوي المحلول بالماء تنتهي صلاحيتهما بعد الفتح بـ 7 إلى 28 يوماً فقط، حتى لو تاريخ العلبة سارياً!',
      en: 'Eye drops and reconstituted antibiotic syrups expire 7–28 days after opening, regardless of box date.',
    },
  },
  {
    theme: 'eye_drops',
    text: {
      ar: 'عند استخدام قطرتين مختلفتين للعين، انتظر 5 دقائق على الأقل بين القطرة الأولى والثانية حتى لا تغسل القطرة الثانية مفعول الأولى.',
      en: 'Wait at least 5 minutes between two different eye drops so the second drop does not wash out the first.',
    },
  },
  {
    theme: 'eye_drops',
    text: {
      ar: 'لا تضع القطرة في العين مباشرة على العدسات اللاصقة؛ انزع العدسات أولاً وانتظر 15 دقيقة بعد التقطير قبل ارتدائها.',
      en: 'Remove contact lenses before applying eye drops and wait 15 minutes before putting them back in.',
    },
  },
  {
    theme: 'eye_drops',
    text: {
      ar: 'لا تحفظ الأدوية في دولاب الحمام أو فوق البوتاجاز؛ الرطوبة والحرارة تتلف المادة الفعالة حتى قبل انتهاء تاريخ الصلاحية.',
      en: 'Never store medicines in the bathroom or near the stove; heat and humidity degrade active ingredients.',
    },
  },
  {
    theme: 'antibiotic_course',
    text: {
      ar: 'إكمال كورس المضاد الحيوي بالكامل يمنع عودة العدوى ببكتيريا مقاومة، حتى لو اختفت الأعراض بعد أول يومين.',
      en: 'Completing your antibiotic course prevents resistant bacteria from returning.',
    },
  },
  {
    theme: 'antibiotic_course',
    text: {
      ar: 'أبداً لا تخلط حقنتين في سرنجة واحدة (مثل فولتارين + ديكساميثازون)، ولا تُعطِ أي مضاد حيوي محلول بالليدوكايين في الوريد إطلاقاً!',
      en: 'Never mix two ampoules in one syringe, and never inject Lidocaine-reconstituted vials IV!',
    },
  },
  {
    theme: 'antibiotic_course',
    text: {
      ar: 'لا تشارك المضاد الحيوي الخاص بك مع فرد آخر في العائلة حتى لو تشابهت الأعراض؛ نوع البكتيريا والجرعة يختلفان من شخص لآخر.',
      en: 'Never share your prescribed antibiotic with family members even if symptoms look similar.',
    },
  },
  {
    theme: 'antibiotic_course',
    text: {
      ar: 'شرب الماء بكميات كافية أثناء كورس المضاد الحيوي أو المسكنات يحمي الكلى ويساعد الجسم على التخلص من البكتيريا والالتهاب أسرع.',
      en: 'Drinking plenty of water during antibiotic or painkiller courses protects your kidneys and speeds recovery.',
    },
  },
  {
    theme: 'antibiotic_course',
    text: {
      ar: 'غسل اليدين بالماء والصابون لمدة 20 ثانية يقلل انتشار العدوى التنفسية والمعوية بنسبة كبيرة ويغنيك عن الحاجة للمضادات الحيوية.',
      en: 'Washing hands with soap for 20 seconds drastically cuts infection spread and reduces antibiotic need.',
    },
  },
  {
    theme: 'antibiotic_course',
    text: {
      ar: 'المضاد الحيوي الموصوف «كل 12 ساعة» لا يعني مع الغداء والعشاء، بل يعني التوقيت نفسه يومياً (مثلاً 9 صباحاً و9 مساءً) للحفاظ على مستواه بالدم.',
      en: 'Every 12 hours means exact 12-hour spacing (e.g., 9 AM and 9 PM) to maintain steady blood levels.',
    },
  },
  {
    theme: 'stomach_nsaid',
    text: {
      ar: 'تناول الزبادي أو اللبن الرائب (البروبيوتيك) بعد المضاد الحيوي بساعتين يساعد على حماية بكتيريا المعدة النافعة ومنع الإسهال.',
      en: 'Eating yogurt 2 hours after an antibiotic dose helps protect healthy gut flora and reduce diarrhea.',
    },
  },
  {
    theme: 'heart_bp',
    text: {
      ar: 'إذا نسيت جرعة دواء مزمن واقترب موعد الجرعة التالية، لا تضاعف الجرعة أبداً؛ خذ الجرعة التالية في ميعادها المعتاد فقط.',
      en: 'If you miss a dose and the next one is close, never double the dose — take only your next scheduled dose.',
    },
  },
];

function TipThemeIllustration({ theme }: { theme: TipTheme }) {
  switch (theme) {
    case 'cold_flu':
      return (
        <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="18" fill="#e0f2fe" />
          <path d="M40 16c-6 0-9 5-9 12v10c0 4-4 7-4 11 0 4 4 6 8 6h10c4 0 8-2 8-6 0-4-4-7-4-11V28c0-7-3-12-9-12z" fill="#0284c7" opacity="0.22" stroke="#0284c7" strokeWidth="2.5" />
          <circle cx="54" cy="24" r="9" fill="#10b981" />
          <path d="M50 24l3 3 5-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'tea_iron':
      return (
        <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="18" fill="#fef3c7" />
          <path d="M20 34h26v16a10 10 0 01-10 10H30a10 10 0 01-10-10V34z" fill="#b45309" opacity="0.22" stroke="#b45309" strokeWidth="2.5" />
          <path d="M46 38h5a5 5 0 010 10h-5" stroke="#b45309" strokeWidth="2.5" fill="none" />
          <circle cx="56" cy="24" r="10" fill="#0D1F38" />
          <path d="M56 19v6l4 2" stroke="#24C8B8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'stomach_nsaid':
      return (
        <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="18" fill="#dcfce7" />
          <path d="M35 16v12c0 5-12 6-12 18 0 10 8 16 18 16 11 0 18-7 18-17 0-9-7-15-15-15" fill="#138866" opacity="0.22" stroke="#138866" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M25 46l8 8 15-15" stroke="#059669" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'heart_bp':
      return (
        <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="18" fill="#fee2e2" />
          <path d="M40 60S18 46 18 31a12 12 0 0122-7 12 12 0 0122 7c0 15-22 29-22 29z" fill="#dc2626" opacity="0.22" stroke="#dc2626" strokeWidth="2.5" />
          <polyline points="22,38 32,38 36,28 42,46 47,35 58,35" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'diabetes':
      return (
        <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="18" fill="#ede9fe" />
          <path d="M40 16s16 18 16 30a16 16 0 11-32 0c0-12 16-30 16-30z" fill="#6d28d9" opacity="0.22" stroke="#6d28d9" strokeWidth="2.5" />
          <text x="40" y="52" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#5b21b6">15:15</text>
        </svg>
      );
    case 'pediatric_fever':
      return (
        <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="18" fill="#ffedd5" />
          <circle cx="34" cy="30" r="11" fill="#ea580c" opacity="0.22" stroke="#ea580c" strokeWidth="2.5" />
          <path d="M22 58c2-9 22-9 24 0" fill="#ea580c" opacity="0.2" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="52" y="20" width="8" height="32" rx="4" fill="#fff" stroke="#dc2626" strokeWidth="2.2" />
          <circle cx="56" cy="52" r="6" fill="#dc2626" />
        </svg>
      );
    case 'eye_drops':
      return (
        <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="18" fill="#cffafe" />
          <path d="M16 40s10-14 24-14 24 14 24 14-10 14-24 14-24-14-24-14z" fill="#0891b2" opacity="0.18" stroke="#0891b2" strokeWidth="2.5" />
          <circle cx="40" cy="40" r="7" fill="#0891b2" />
          <path d="M56 16l4 7a4 4 0 11-8 0l4-7z" fill="#0284c7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="18" fill="#d1fae5" />
          <rect x="23" y="30" width="34" height="20" rx="10" transform="rotate(-35 40 40)" fill="#138866" opacity="0.24" stroke="#138866" strokeWidth="2.5" />
          <line x1="34" y1="32" x2="46" y2="48" stroke="#138866" strokeWidth="2.5" />
        </svg>
      );
  }
}

export default function DidYouKnow() {
  const { lang } = useLang();
  const [index, setIndex] = useState<number>(() => Math.floor(Math.random() * HEALTH_TIPS.length));

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, 12000);
    return () => window.clearInterval(id);
  }, []);

  const currentTip = HEALTH_TIPS[index];

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '13px 16px',
        borderInlineStart: '5px solid #138866',
        background: 'linear-gradient(135deg, rgba(19, 136, 102, 0.08) 0%, rgba(207, 210, 157, 0.14) 100%)',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <TipThemeIllustration theme={currentTip.theme} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#138866', marginBottom: '3px' }}>
          💡 {tr(lang, 'نصيحة صحية يومية', 'Daily Health Tip')}
        </div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.55 }}>
          {pick(currentTip.text, lang)}
        </p>
      </div>
    </div>
  );
}
