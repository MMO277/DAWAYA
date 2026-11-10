import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import { useSyncedHealthProfile } from './allergyData';
import { useSyncedSchedules } from './trackerData';
import Disclaimer from './Disclaimer';

export type MedicalSpecialtyClinic =
  | 'internal_medicine'
  | 'cardiology'
  | 'orthopedics'
  | 'gastroenterology'
  | 'urology_nephrology'
  | 'neurology'
  | 'obstetrics_gynecology'
  | 'ent'
  | 'ophthalmology'
  | 'pediatrics'
  | 'dermatology';

export interface DoctorPrepTemplate {
  id: MedicalSpecialtyClinic;
  icon: string;
  nameAr: string;
  nameEn: string;
  essentialQuestionsToAskAr: string[];
  vitalMeasurementsNeededAr: string[];
  documentsToBringAr: string[];
  redFlagDisclosuresAr: string[];
  clinicRoute: string;
}

export const SPECIALTY_PREP_TEMPLATES: Record<MedicalSpecialtyClinic, DoctorPrepTemplate> = {
  internal_medicine: {
    id: 'internal_medicine',
    icon: '🫀',
    nameAr: 'عيادة الباطنة والسكر والضغط العامة',
    nameEn: 'Internal Medicine & Chronic Care',
    essentialQuestionsToAskAr: [
      'هل جرعات أدوية الضغط أو السكر الحالية ما زالت مناسبة لوظائف كليتي وكبدي؟',
      'إيه التحاليل الدورية المطلوبة مني في الزيارة الجاية (تراكمي، دهون، كلى)؟',
      'هل أي من الأدوية دي بيتعارض مع الفيتامينات أو المسكنات اللي باخدها؟',
      'ما هو الرقم المستهدف لضغطي وسكري في البيت؟',
      'لو نسيت جرعة علاج السكر أو الضغط، إيه التصرف السريع الآمن؟',
    ],
    vitalMeasurementsNeededAr: ['جدول قياس ضغط الدم لآخر أسبوع (صباحاً ومساءً)', 'جدول قياس السكر الصائم وبعد الأكل بساعتين لآخر 3 أيام'],
    documentsToBringAr: ['آخر تحليل سكر تراكمي (HbA1c)', 'تحليل وظائف كلى (Creatinine / eGFR)', 'علب جميع الأدوية اليومية الحالية'],
    redFlagDisclosuresAr: ['حدوث دوخة مفاجئة عند الوقوف', 'هبوط سكر وعرق بارد', 'تورم في القدمين أو الكاحلين'],
    clinicRoute: '/chronic-clinic',
  },

  cardiology: {
    id: 'cardiology',
    icon: '💓',
    nameAr: 'عيادة القلب والأوعية الدموية',
    nameEn: 'Cardiology',
    essentialQuestionsToAskAr: [
      'هل النهجان أو ثقل الصدر الحالي سببه عضلة القلب أم الشرايين أم مجرد مجهود؟',
      'إلى متى سأستمر على دواء السيولة أو الأسبرين؟ وهل أحتاج لتحليل سيولة دوري؟',
      'ما هو معدل النبض الطبيعي الآمن لي أثناء الراحة والمشي؟',
      'هل يسمح لي بممارسة رياضة المشي أو صعود السلم، وما هي المسافة الآمنة؟',
      'ما هي الأدوية أو المسكنات الممنوعة تماماً على قلبي؟',
    ],
    vitalMeasurementsNeededAr: ['رسم قلب حديث (ECG)', 'تقرير أشعة إيكو على القلب (Echocardiogram)', 'جدول قياس النبض وضغط الدم'],
    documentsToBringAr: ['تحليل إنزيمات قلب أو دهون ثلاثية وكوليسترول', 'كارت قسطرة القلب أو الدعامات السابقة (إن وجد)'],
    redFlagDisclosuresAr: ['ألم ضاغط في منتصف الصدر يسمع في الكتف الأيسر', 'خفقان سريع مفاجئ كرفرفة الطائر', 'إغماء أو دوخة شديدة'],
    clinicRoute: '/chronic-clinic',
  },

  orthopedics: {
    id: 'orthopedics',
    icon: '🦴',
    nameAr: 'عيادة العظام والعمود الفقري والمفاصل',
    nameEn: 'Orthopedics & Spine',
    essentialQuestionsToAskAr: [
      'هل الألم ناتج عن غضروف ضاغط على العصب أم خشونة مفاصل أم التهاب أوتار؟',
      'هل حالتي تحتاج علاجاً طبيعياً وتمارين تقوية، أم تحتاج تدخلاً جراحياً أو حقناً؟',
      'ما هو المسكن أو الدهان الآمن لمعدتي وكليتي لو استمر الألم؟',
      'ما هي وضعيات الجلوس والنوم وحمل الأشياء التي تحمي ظهري وركبتي؟',
      'هل أحتاج لفرشة كعب سيليكون أو حزام ظهر أو ركبة داعمة؟',
    ],
    vitalMeasurementsNeededAr: ['أشعة رنين مغناطيسي (MRI) أو أشعة عادية (X-Ray) على المفصل/الفقرات'],
    documentsToBringAr: ['تحليل حمض اليوريك (النقرس)', 'تحليل فيتامين د والكالسيوم'],
    redFlagDisclosuresAr: ['سقوط مشط القدم أثناء المشي', 'تنميل مستمر في منطقة الحوض أو عدم تحكم في البول', 'سخونة وتورم واحمرار شديد بالمفصل'],
    clinicRoute: '/ortho-clinic',
  },

  gastroenterology: {
    id: 'gastroenterology',
    icon: '🦠',
    nameAr: 'عيادة الجهاز الهضمي والكبد والمناظير',
    nameEn: 'Gastroenterology & Hepatology',
    essentialQuestionsToAskAr: [
      'هل الحموضة وارتجاع المريء يحتاجان منظار معدة أم يكفي العلاج الدوائي؟',
      'هل أعراض القولون الحالية وظيفية عصبية أم تحتاج استبعاد حساسية قمح أو التهاب مناعي؟',
      'متى يجب إعادة تحليل جرثومة المعدة للتأكد من القضاء عليها نهائياً؟',
      'ما هي الأكلات والمشروبات التي تمنعها عني تماماً وفق تشخيصي؟',
      'ما هو التوقيت الصحيح لأخذ دواء المعدة مقارنة بالفطار؟',
    ],
    vitalMeasurementsNeededAr: ['سونار على البطن والحوض حديث'],
    documentsToBringAr: ['تحليل جرثومة المعدة في البراز (H. pylori Stool Ag)', 'تحليل وظائف كبد وإنزيمات صفراء', 'صورة دم كاملة CBC'],
    redFlagDisclosuresAr: ['قيء مدمم أو براز أسود كالفحم', 'صعوبة بلع اللقمة', 'نزول وزن مفاجئ بدون دايت'],
    clinicRoute: '/gastro-clinic',
  },

  urology_nephrology: {
    id: 'urology_nephrology',
    icon: '🧪',
    nameAr: 'عيادة الكلى والمسالك البولية والحصوات',
    nameEn: 'Urology & Nephrology',
    essentialQuestionsToAskAr: [
      'ما هو حجم الحصوة ومكانها بالضبط؟ وهل يمكن نزولها بالعلاج أم تحتاج تفتيت؟',
      'ما هو نوع الأملاح في تحليلي، وما هي الفوارات والأكلات الممنوعة لتفادي تكرارها؟',
      'ما هي كفاءة فلترة كليتي الحالية (eGFR) وهل هناك أدوية تحتاج لتخفيض جرعتها؟',
      'كم لتراً من الماء ينبغي أن أشرب يومياً لحماية كليتي؟',
      'هل تضخم البروستاتا حميد ويتطلب علاجاً دوائياً مستمراً؟',
    ],
    vitalMeasurementsNeededAr: ['سونار أو أشعة مقطعية بدون صبغة على المسالك'],
    documentsToBringAr: ['تحليل بول كامل مع مزرعة وحساسية ميكروب', 'تحليل كرياتينين بالدم (Serum Creatinine)', 'تحليل حمض يوريك'],
    redFlagDisclosuresAr: ['انقطاع كامل للبول', 'مغص كلوي مصحوب بسخونة ورعشة شديدة', 'نزول دم صريح في البول'],
    clinicRoute: '/urology-clinic',
  },

  neurology: {
    id: 'neurology',
    icon: '🧠',
    nameAr: 'عيادة المخ والأعصاب والصداع والصرع',
    nameEn: 'Neurology & Headache',
    essentialQuestionsToAskAr: [
      'ما هو نوع الصداع الذي أعاني منه (نصفي، توتري، أم عنقي)؟',
      'ما هو علاج النوبة الحادة، وما هو العلاج الوقائي اليومي لمنع تكرار الصداع؟',
      'هل تنميل الأطراف ناتج عن ضغط فقرات أم التهاب أعصاب طرفية ونقص فيتامينات؟',
      'ما هي محفزات النوبات التي يجب أن أتجنبها في روتيني اليومي؟',
      'هل هذا الدواء يسبب نعاساً أو تعوداً؟ وكيف أوقفه بأمان مستقبلاً؟',
    ],
    vitalMeasurementsNeededAr: ['رنين مغناطيسي على المخ أو الفقرات', 'رسم مخ كهربائي EEG أو رسم عصب NCV (إن وجد)'],
    documentsToBringAr: ['تحليل فيتامين B12 ومخزون الحديد وسكر تراكمي'],
    redFlagDisclosuresAr: ['ثقل مفاجئ في اللسان أو ضعف ذراع', 'صداع انفجاري مفاجئ غير مسبوق', 'نوبة تشنج أو فقدان وعي'],
    clinicRoute: '/neuro-clinic',
  },

  obstetrics_gynecology: {
    id: 'obstetrics_gynecology',
    icon: '🌸',
    nameAr: 'عيادة النساء والتوليد وتأخر الحمل',
    nameEn: 'Obstetrics & Gynecology',
    essentialQuestionsToAskAr: [
      'ما هي وسيلة منع الحمل الأكثر أماناً وملاءمة لوزني وضغطي وطبيعة رضاعتي؟',
      'هل تكيس المبايض لدي يحتاج لمنظم سكر (ميتفورمين) أم تعديل حمية غذائية ورياضة؟',
      'هل الفيتامينات أو الأدوية التي أتناولها آمنة 100% للجنين والرضاعة؟',
      'ما هي المواعيد الدقيقة للسونار القادم وفحص تشوهات الجنين؟',
      'ما هي علامات الخطر التي تستلزم التوجه للمستشفى فوراً؟',
    ],
    vitalMeasurementsNeededAr: ['تقرير آخر سونار نساء أو سونار دوبلر للجنين'],
    documentsToBringAr: ['تحليل هرمونات (FSH, LH, Prolactin, AMH)', 'صورة دم كاملة وتحليل بول وزلال'],
    redFlagDisclosuresAr: ['نزيف مهبلي غير معتاد', 'ألم حاد في أسفل البطن جهة واحدة', 'صداع زغللة وورم مفاجئ بالوجه والقدمين'],
    clinicRoute: '/women-clinic',
  },

  ent: {
    id: 'ent',
    icon: '👂',
    nameAr: 'عيادة الأنف والأذن والحنجرة والاتزان',
    nameEn: 'ENT & Vertigo',
    essentialQuestionsToAskAr: [
      'هل الدوار الحالي بسبب كريستالات الأذن الداخلية (BPPV) ومحتاج مناورة إيبلي؟',
      'هل احتقان الأنف سببه حساسية مزمنة أم اعتياد على نقط الأنف (الأوتريفين)؟',
      'هل اللوز صديدية بكتيرية تحتاج مضاداً حيوياً أم فيروسية تحتاج علاجاً مسانداً؟',
      'ما هي الطريقة الصحيحة الآمنة لتنظيف شمع الأذن بدون ودانات القطن؟',
    ],
    vitalMeasurementsNeededAr: ['مقياس سمع أو ضغط أذن (إن وجد)'],
    documentsToBringAr: ['صورة دم كاملة أو مسحة حلق سابقة'],
    redFlagDisclosuresAr: ['نزيف أنف غزير لا يتوقف بعد 15 دقيقة ضغط', 'دوار مصحوب بثقل لسان أو صعوبة بلع', 'خروج صديد من الأذن'],
    clinicRoute: '/ent-clinic',
  },

  ophthalmology: {
    id: 'ophthalmology',
    icon: '👁️',
    nameAr: 'عيادة العيون والرمد والقرنية',
    nameEn: 'Ophthalmology',
    essentialQuestionsToAskAr: [
      'هل قطرة العين الموصوفة تحتوي على كورتيزون؟ وما هي أقصى مدة مسموحة لاستخدامها؟',
      'هل جفاف العين ناتج عن الشاشات والعدسات؟ وما هي القطرة المرطبة الخالية من المواد الحافظة؟',
      'هل ضغط العين لدي في المعدل الطبيعي الآمن؟',
      'متى تنتهي صلاحية زجاجة القطرة بعد فتحها (هل 28 يوماً)؟',
    ],
    vitalMeasurementsNeededAr: ['قياس ضغط العين ومقاس النظارة الحالي'],
    documentsToBringAr: ['فحص قاع عين حديث لمريض السكر أو الضغط'],
    redFlagDisclosuresAr: ['فقدان مفاجئ في الرؤية', 'رؤية فلاشات ضوء وستارة سوداء', 'دخول كلور أو مادة كيميائية في العين'],
    clinicRoute: '/eye-clinic',
  },

  pediatrics: {
    id: 'pediatrics',
    icon: '👶',
    nameAr: 'عيادة طب الأطفال وحديثي الولادة',
    nameEn: 'Pediatrics & Newborns',
    essentialQuestionsToAskAr: [
      'ما هي الجرعة الدقيقة لخافض الحرارة والمضاد الحيوي بالسرنجة الفموية بالسنتي (مل) حسب وزن طفلي الحالي؟',
      'هل وزن طفلي وطوله ومحيط رأسه ينمو في المعدل الطبيعي على منحنى النمو؟',
      'هل البكاء والغازات الحالية مغص رضاعة طبيعي أم اشتباه حساسية ألبان؟',
      'ما هي الأكلات الصلبة المسموح إدخالها لطفلي هذا الشهر وكيف نبدأ؟',
    ],
    vitalMeasurementsNeededAr: ['الوزن الدقيق للطفل بالكيلوجرام بالميزان الطبي'],
    documentsToBringAr: ['كراسة التطعيمات وجدول متابعة نمو الطفل'],
    redFlagDisclosuresAr: ['سخونة في رضيع عمره أقل من 3 شهور', 'نهجان وسحب في القفص الصدري للداخل أثناء التنفس', 'جفاف (عدم بلل الحفاض لأكثر من 8 ساعات)'],
    clinicRoute: '/baby-first-year',
  },

  dermatology: {
    id: 'dermatology',
    icon: '🩹',
    nameAr: 'عيادة الأمراض الجلدية والليزر والشعر',
    nameEn: 'Dermatology & Hair',
    essentialQuestionsToAskAr: [
      'هل كريم الكورتيزون الموصوف خفيف أم قوي؟ وكم يوماً فقط يُستخدم لتجنب ترقق الجلد؟',
      'ما هو سبب تساقط الشعر الحالي (وراثي، نقص فيريتين وزنك، أم ضغط عصبي وتعلبة)؟',
      'كيف أستخدم مقشر الأكرتين أو الريتينول بالتدريج بدون حدوث حروق والتهاب بالبشرة؟',
      'ما هو واقي الشمس المناسب لنوع بشرتي وكيف أجدده خارج المنزل؟',
    ],
    vitalMeasurementsNeededAr: ['فحص ديرموسكوب (Dermoscopy) لفروة الرأس أو الشامات'],
    documentsToBringAr: ['تحليل مخزون الحديد (Ferritin) والزنك وفيتامين د والغدة الدرقية TSH'],
    redFlagDisclosuresAr: ['تغير سريع في شكل أو لون أو حجم شامة/حسنة في الجلد', 'طفح جلدي سريع الانتشار مصحوب بسخونة'],
    clinicRoute: '/derma-clinic',
  },
};

export default function DoctorVisitPrep() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { profile } = useSyncedHealthProfile();
  const { schedules } = useSyncedSchedules();

  const [selectedSpecialty, setSelectedSpecialty] = useState<MedicalSpecialtyClinic>('internal_medicine');
  const [patientChiefComplaint, setPatientChiefComplaint] = useState<string>('');
  const [symptomDuration, setSymptomDuration] = useState<string>('منذ عدة أيام');
  const [userCustomQuestion, setUserCustomQuestion] = useState<string>('');

  const template = SPECIALTY_PREP_TEMPLATES[selectedSpecialty];

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <main className="wrap" style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Header (no-print) */}
      <section
        className="card no-print"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #0369a1 55%, #0284c7 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '20px',
          boxShadow: '0 14px 34px rgba(13, 31, 56, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#e0f2fe' }}>
            📋 {tr(lang, 'مُحضّر كشف العيادة الذكي وزيارة الطبيب', 'Smart Doctor Visit & Clinical Consultation Prep')}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/clinics" className="btn small" style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
              🏥 {tr(lang, 'مجمع العيادات', 'Clinics Hub')}
            </Link>
            <Link to="/medical-report" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
              📄 {tr(lang, 'تقريرك الطبي الشامل', 'Medical Report')}
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
          {tr(lang, 'رايح تكشف عند دكتور؟ 👈 جهز كشفك في دقيقتين عشان ما تنساش أي سؤال أو عرض!', 'Preparing for a Doctor Appointment? Smart Clinical Brief & Questions to Ask')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
          {tr(
            lang,
            'اختر تخصص العيادة واكتب شكوتك، ليولد لك النظام وثيقة مطبوعة أو محفوظة على تليفونك فيها شكوتك، أدويتك الحالية، قياساتك، وأهم 5 أسئلة طبية لازم تسألها للدكتور قبل ما تخرج من العيادة.',
            'Select your clinic specialty to instantly generate a tailored consultation sheet with your chief complaints, current medications, and the top 5 questions to ask your physician.'
          )}
        </p>
      </section>

      {/* Specialty Selector Tabs (no-print) */}
      <section className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {(Object.keys(SPECIALTY_PREP_TEMPLATES) as MedicalSpecialtyClinic[]).map((key) => {
          const item = SPECIALTY_PREP_TEMPLATES[key];
          const isSel = item.id === selectedSpecialty;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedSpecialty(item.id)}
              style={{
                textAlign: 'right',
                padding: '12px 14px',
                borderRadius: '16px',
                border: isSel ? '2.5px solid #0284c7' : '1.5px solid #cbd5e1',
                background: isSel ? 'linear-gradient(135deg, #0D1F38 0%, #0369a1 100%)' : '#ffffff',
                color: isSel ? '#ffffff' : '#0D1F38',
                cursor: 'pointer',
                boxShadow: isSel ? '0 8px 20px rgba(2, 132, 199, 0.2)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>{item.nameAr}</span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Input Complaint Form (no-print) */}
      <section className="card no-print" style={{ borderRadius: '20px', padding: '20px', border: '1.5px solid #cbd5e1', marginBottom: '22px' }}>
        <h2 style={{ margin: '0 0 12px', color: '#0D1F38', fontSize: '1.18rem', fontWeight: 900 }}>
          ✍️ الخطوة الأخيرة: سجل شكواك الحالية لتظهر في التقرير المطبوع للطبيب:
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
              ما هي الشكوى أو العرض الأساسي الذي تشعر به؟
            </label>
            <input
              type="text"
              value={patientChiefComplaint}
              onChange={(e) => setPatientChiefComplaint(e.target.value)}
              placeholder="مثال: وجع في الجنب اليمين، صداع نصفي، حموضة شديدة بعد الأكل..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
              منذ متى بدأ هذا العرض؟
            </label>
            <input
              type="text"
              value={symptomDuration}
              onChange={(e) => setSymptomDuration(e.target.value)}
              placeholder="مثال: منذ يومين، منذ أسبوع، فجأة أمس..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
            سؤال خاص تريد إضافته للطبيب بنفسك:
          </label>
          <input
            type="text"
            value={userCustomQuestion}
            onChange={(e) => setUserCustomQuestion(e.target.value)}
            placeholder="مثال: هل أقدر أصوم مع العلاج ده؟ هل الدواء ده بيتعارض مع الفيتامين؟"
            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem' }}
          />
        </div>
      </section>

      {/* Printable Clinical Sheet for Doctor Presentation */}
      <article
        className="card"
        style={{
          borderRadius: '22px',
          border: '2.5px solid #0D1F38',
          background: '#ffffff',
          padding: '30px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0D1F38', paddingBottom: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 800 }}>منصة دوايا الرقمية • بطاقة كشف العيادة الذكية</div>
            <h2 style={{ margin: '2px 0 0', color: '#0D1F38', fontSize: '1.35rem', fontWeight: 900 }}>
              {template.icon} تقرير مُحضّر زيارة: {template.nameAr}
            </h2>
          </div>
          <div className="no-print">
            <button
              type="button"
              onClick={handlePrint}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 900,
                borderRadius: '12px',
                padding: '9px 18px',
              }}
            >
              🖨️ طباعة ورقة الكشف
            </button>
          </div>
        </div>

        {/* Patient Summary Header Box */}
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>اسم المريض:</span>
              <strong style={{ color: '#0D1F38' }}>{profile.name || 'مريض منصة دوايا'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>الشكوى الرئيسية المسجلة:</span>
              <strong style={{ color: '#b91c1c' }}>{patientChiefComplaint || 'فحص عام ومتابعة دورية'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>مدة العرض:</span>
              <strong style={{ color: '#0f766e' }}>{symptomDuration}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>الحساسية الدوائية المسجلة:</span>
              <strong style={{ color: (profile.allergies || []).length > 0 ? '#dc2626' : '#16a34a' }}>
                {(profile.allergies || []).length > 0
                  ? profile.allergies.map((a) => a.drugName || a.allergen).join('، ')
                  : 'لا توجد'}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 1: The 5 Essential Questions to Ask Doctor */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, color: '#0369a1', fontSize: '1.1rem', fontWeight: 900 }}>
              ❓ أهم 5 أسئلة طبية لازم تسألها للدكتور قبل ما تخرج من العيادة:
            </h3>
            <button
              type="button"
              className="chip no-print"
              onClick={() => speakText(template.essentialQuestionsToAskAr.join('. '), lang)}
            >
              🔊 اسمع الأسئلة
            </button>
          </div>
          <ol style={{ margin: 0, paddingRight: '22px', color: '#1e293b', lineHeight: 1.8, fontSize: '0.94rem', fontWeight: 700 }}>
            {template.essentialQuestionsToAskAr.map((q, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{q}</li>
            ))}
            {userCustomQuestion && (
              <li style={{ color: '#0f766e' }}><b>سؤالك الخاص:</b> {userCustomQuestion}</li>
            )}
          </ol>
        </div>

        {/* Section 2: What to Bring & Measurements */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', padding: '14px 16px', borderRadius: '14px' }}>
            <strong style={{ color: '#166534', display: 'block', marginBottom: '6px', fontSize: '0.92rem' }}>
              📁 مستندات وتحاليل أحضرها معك للكشف:
            </strong>
            <ul style={{ margin: 0, paddingRight: '18px', color: '#1e293b', fontSize: '0.88rem', lineHeight: 1.7 }}>
              {template.documentsToBringAr.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', padding: '14px 16px', borderRadius: '14px' }}>
            <strong style={{ color: '#1e40af', display: 'block', marginBottom: '6px', fontSize: '0.92rem' }}>
              📊 قياسات سريعة مفيدة للدكتور:
            </strong>
            <ul style={{ margin: 0, paddingRight: '18px', color: '#1e293b', fontSize: '0.88rem', lineHeight: 1.7 }}>
              {template.vitalMeasurementsNeededAr.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 3: Red Flags Disclosures */}
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', color: '#991b1b' }}>
          <strong>🚨 علامات خطورة أبلغ الطبيب عنها فوراً لو شعرت بها:</strong>{' '}
          {template.redFlagDisclosuresAr.join(' • ')}
        </div>

        {/* Section 4: Current Medications Compact List */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.84rem', color: '#475569' }}>
          <b>أدويتك الحالية المسجلة في السجل الطبي:</b>{' '}
          {(schedules || []).length > 0 || (profile.medications || []).length > 0
            ? [...(schedules || []).map((s) => `${s.medicineName} (${s.prescribedDose})`), ...(profile.medications || []).map((m) => m.drugName)].join(' • ')
            : 'لا توجد أدوية مسجلة'}
        </div>
      </article>

      <div style={{ marginTop: '20px' }}>
        <Disclaimer />
      </div>
    </main>
  );
}
