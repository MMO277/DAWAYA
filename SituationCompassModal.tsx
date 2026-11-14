import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tr } from './types';
import { Lang } from './types';

export type SituationKey = 'travel' | 'pharmacy' | 'emergency' | 'mother' | 'chronic' | 'doctor';

interface SituationActionItem {
  to: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  subAr: string;
  subEn: string;
}

interface SituationGroup {
  id: SituationKey;
  icon: string;
  labelAr: string;
  labelEn: string;
  items: SituationActionItem[];
}

const SITUATIONS: SituationGroup[] = [
  {
    id: 'travel',
    icon: '✈️',
    labelAr: 'أنا مسافر',
    labelEn: 'Traveling',
    items: [
      {
        to: '/airport-banned-meds',
        icon: '🛂',
        titleAr: 'كاشف الأدوية الممنوعة في المطارات والجمارك',
        titleEn: 'Airport & Customs Banned Meds Scanner',
        subAr: 'السعودية والخليج وأوروبا + البدائل المسموحة',
        subEn: 'Gulf & EU customs rules + safe substitutes',
      },
      {
        to: '/travel-kit',
        icon: '🧳',
        titleAr: 'شنطة إسعافات وأدوية السفر والعمرة',
        titleEn: 'Travel & Umrah Medical Kit',
        subAr: 'قائمة جاهزة بأهم أدوية السفر والحفظ في الحر',
        subEn: 'Checklist of essential travel meds & heat storage',
      },
      {
        to: '/patient-dashboard',
        icon: '🚓',
        titleAr: 'درع السائقين وتحليل المخدرات والنعاس',
        titleEn: 'Driver & Drug-Test Shield',
        subAr: 'اعرف الأدوية التي تسبب نعاساً أو إيجابي كاذب',
        subEn: 'Check sedating & false-positive cold/cough meds',
      },
      {
        to: '/passport',
        icon: '🪪',
        titleAr: 'الكارت الطبي الذكي للطوارئ QR',
        titleEn: 'Smart Emergency Medical ID (QR)',
        subAr: 'فصيلة دمك وحساسيتك وأدويتك للمطارات والطوارئ',
        subEn: 'Instant QR medical summary for borders & ER',
      },
    ],
  },
  {
    id: 'pharmacy',
    icon: '🧾',
    labelAr: 'في الصيدلية',
    labelEn: 'At Pharmacy',
    items: [
      {
        to: '/cost-saver',
        icon: '💰',
        titleAr: 'مخفض فاتورة الصيدلية والبدائل الأرخص',
        titleEn: 'Smart Pharmacy Bill Optimizer',
        subAr: 'احسب توفير الروشتة بالمثائل المصرية المطابقة',
        subEn: 'Calculate total savings with local bioequivalents',
      },
      {
        to: '/prescription-radar',
        icon: '📡',
        titleAr: 'رادار الروشتة وفحص التداخلات',
        titleEn: 'Prescription Radar & Safety Check',
        subAr: 'اكشف تكرار المادة الفعالة والتعارض قبل الدفع',
        subEn: 'Detect duplicate ingredients & interactions',
      },
      {
        to: '/scan',
        icon: '📷',
        titleAr: 'فاحص العلبة الأصلية وقارئ الشريط المقصوص',
        titleEn: 'Barcode, EDA Radar & Cut Strip Reader',
        subAr: 'صوّر العلبة أو الشريط المقصوص وتأكد من الباركود',
        subEn: 'Scan box barcode or cut blister strip by camera',
      },
      {
        to: '/interactions',
        icon: '💉',
        titleAr: 'كاشف أمان الحقن ومنع الخلط بالسرنجة',
        titleEn: 'Safe Injection & Syringe Mix Guard',
        subAr: 'تحقق من المذيب (ليدوكايين vs ماء مقطر) ومنع الخلط',
        subEn: 'Prevent dangerous multi-ampoule syringe mixing',
      },
    ],
  },
  {
    id: 'emergency',
    icon: '🚨',
    labelAr: 'طوارئ البيت',
    labelEn: 'Home Urgent',
    items: [
      {
        to: '/missed-dose-rescue',
        icon: '⏰',
        titleAr: 'منقذ الجرعة المنسية بالساعة',
        titleEn: 'Missed Dose Rescue Protocol',
        subAr: 'تصرّف فوراً عند نسيان حبة الضغط أو الأنسولين أو المضاد',
        subEn: 'Exact safe steps without double-dosing',
      },
      {
        to: '/poison-clinic',
        icon: '☠️',
        titleAr: 'عيادة السموم والإسعافات الأولية',
        titleEn: 'Poisoning & First-Aid Clinic',
        subAr: 'بروتوكول الإسعاف السريع لابتلاع دواء أو منظف بالخطأ',
        subEn: 'Urgent triage for accidental ingestion',
      },
      {
        to: '/hypo-rescue',
        icon: '🍬',
        titleAr: 'خطة إنقاذ هبوط السكر المفاجئ',
        titleEn: 'Hypoglycemia Rescue Plan',
        subAr: 'قاعدة الـ 15-15 لرفع السكر بأمان في دقائق',
        subEn: '15-15 rule for rapid safe blood sugar recovery',
      },
      {
        to: '/home-cabinet',
        icon: '⏳',
        titleAr: 'عداد صلاحية الدواء بعد الفتح',
        titleEn: 'Post-Opening Expiry Counter',
        subAr: 'تأكد من صلاحية القطرة وشراب المضاد بعد الفتح',
        subEn: 'Check real discard date for drops & syrups',
      },
    ],
  },
  {
    id: 'mother',
    icon: '👶',
    labelAr: 'الأم والطفل',
    labelEn: 'Mom & Kids',
    items: [
      {
        to: '/pediatric-helper',
        icon: '⚖️',
        titleAr: 'حاسبة جرعات الأطفال بالوزن (سم)',
        titleEn: 'Pediatric Weight-Based Dose Calculator',
        subAr: 'احسب جرعة خافض الحرارة والمضاد بالملليلتر بدقة',
        subEn: 'Exact mL dosing by child weight',
      },
      {
        to: '/pregnancy-guide',
        icon: '🤰',
        titleAr: 'أمان الأدوية في الحمل والرضاعة',
        titleEn: 'Pregnancy & Lactation Safety Guide',
        subAr: 'اعرف المسموح والممنوع في كل شهور الحمل والرضاعة',
        subEn: 'Safe vs. contraindicated meds by trimester',
      },
      {
        to: '/vaccine-tracker',
        icon: '💉',
        titleAr: 'جدول التطعيمات وعلاج سخونية التطعيم',
        titleEn: 'Mandatory Vaccine & Fever Tracker',
        subAr: 'مواعيد التطعيمات باليوم ورعاية الطفل بعدها',
        subEn: 'Exact vaccine dates & post-shot care',
      },
      {
        to: '/baby-milk',
        icon: '🍼',
        titleAr: 'دليل ألبان الأطفال وحساسية الألبان',
        titleEn: 'Baby Milk Formula Navigator',
        subAr: 'مقارنة التركيبات ومشاكل الارتجاع والمغص',
        subEn: 'Formula guide for reflux, colic & allergy',
      },
    ],
  },
  {
    id: 'chronic',
    icon: '👴',
    labelAr: 'أمراض مزمنة',
    labelEn: 'Chronic Care',
    items: [
      {
        to: '/food-interactions',
        icon: '☕',
        titleAr: 'مُنسّق مواعيد الشاي والقهوة مع الأدوية',
        titleEn: 'Tea, Coffee & Meals Timing Matrix',
        subAr: 'افصل الغدة والحديد والكالسيوم عن الفطار والشاي',
        subEn: 'Schedule thyroid, iron & calcium around meals',
      },
      {
        to: '/senior-pills',
        icon: '💊',
        titleAr: 'التعرف على الحباية الفرط بالشكل واللون',
        titleEn: 'Senior Visual Pill Identifier',
        subAr: 'اعرف اسم القرص المجهول لو خرج من الشريط',
        subEn: 'Identify loose pills by color, shape & mark',
      },
      {
        to: '/meal-planner',
        icon: '🥗',
        titleAr: 'مولّد وجبات الضغط والسكر والكلى',
        titleEn: 'Egyptian Chronic Meal Planner',
        subAr: 'أكلات مصرية يومية مناسبة لحالتك الصحية',
        subEn: 'Daily local meal plans for BP, diabetes & renal',
      },
      {
        to: '/tracker',
        icon: '⏰',
        titleAr: 'منبه الجرعات اليومي الذكي',
        titleEn: 'Smart Medication Dose Alarm',
        subAr: 'تذكير بالصوت والاهتزاز لمواعيد أدويتك',
        subEn: 'Audio & alarm reminders for every dose',
      },
    ],
  },
  {
    id: 'doctor',
    icon: '🩺',
    labelAr: 'رايح للدكتور',
    labelEn: 'Doctor Visit',
    items: [
      {
        to: '/doctor-visit-prep',
        icon: '📋',
        titleAr: 'مُحضّر كشف العيادة وأهم 5 أسئلة',
        titleEn: 'Smart Doctor Visit Prep',
        subAr: 'رتب شكوتك وأدويتك قبل دخول العيادة',
        subEn: 'Organize symptoms & key questions for your doctor',
      },
      {
        to: '/lab-photo-scanner',
        icon: '🔬',
        titleAr: 'قارئ صور التحاليل والروشتات بالذكاء الاصطناعي',
        titleEn: 'Lab Report & Rx Photo Scanner',
        subAr: 'ارفع صورة التحليل أو الروشتة لشرحها ببساطة',
        subEn: 'Upload lab or prescription photos for instant explanation',
      },
      {
        to: '/medical-report',
        icon: '📄',
        titleAr: 'التقرير الطبي الشامل PDF للطبيب',
        titleEn: 'Official Medical Summary Report (PDF)',
        subAr: 'ملف جاهز للطباعة بحساسيتك وأمراضك وأدويتك',
        subEn: 'Printable clinical summary of your full history',
      },
      {
        to: '/body-map',
        icon: '🧍',
        titleAr: 'خريطة الجسم التفاعلية لتشخيص الأعراض',
        titleEn: 'Interactive Body Map Symptom Triage',
        subAr: 'اضغط على موضع الألم لمعرفة التخصص والنصيحة',
        subEn: 'Tap pain location for triage & specialty clinic',
      },
    ],
  },
];

export default function SituationCompassModal({
  isOpen,
  onClose,
  lang,
}: {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}) {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<SituationKey>('travel');

  if (!isOpen) return null;

  const currentGroup = SITUATIONS.find((s) => s.id === activeTab) || SITUATIONS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr(lang, 'بوصلة المواقف السريعة', 'Quick Situation Compass')}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99995,
        background: 'rgba(9, 21, 38, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: 'min(100%, 620px)',
          maxHeight: '86vh',
          overflowY: 'auto',
          borderRadius: '26px',
          background: 'linear-gradient(165deg, #102440 0%, #0D1F38 65%, #091526 100%)',
          border: '1.8px solid rgba(36, 200, 184, 0.45)',
          boxShadow: '0 -12px 48px rgba(0, 0, 0, 0.55)',
          padding: '18px 18px 22px',
          color: '#ffffff',
        }}
      >
        <div style={{ width: '44px', height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.28)', margin: '0 auto 14px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
            🧭 {tr(lang, 'بوصلة المواقف السريعة — اختار موقفك', 'Quick Situation Compass — Choose Your Situation')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr(lang, 'إغلاق', 'Close')}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Situation Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '14px',
          }}
        >
          {SITUATIONS.map((s) => {
            const active = s.id === activeTab;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(s.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: active ? '1.5px solid #24C8B8' : '1px solid rgba(255,255,255,0.2)',
                  background: active ? 'linear-gradient(135deg, #138866, #0d9488)' : 'rgba(255,255,255,0.07)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: active ? '0 0 18px rgba(36, 200, 184, 0.4)' : 'none',
                }}
              >
                <span>{s.icon}</span>
                <span>{isAr ? s.labelAr : s.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* 4 Direct Action Rows */}
        <div style={{ display: 'grid', gap: '10px' }}>
          {currentGroup.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(36, 200, 184, 0.28)',
                textDecoration: 'none',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(19, 136, 102, 0.24)',
                    border: '1px solid rgba(36, 200, 184, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#ffffff' }}>
                    {isAr ? item.titleAr : item.titleEn}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                    {isAr ? item.subAr : item.subEn}
                  </div>
                </div>
              </div>
              <span style={{ color: '#24C8B8', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }}>
                {isAr ? '←' : '→'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
