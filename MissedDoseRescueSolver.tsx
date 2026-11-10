import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import Disclaimer from './Disclaimer';

export type DrugFamilyKey =
  | 'birth_control'
  | 'antibiotic'
  | 'blood_pressure'
  | 'insulin_diabetes'
  | 'thyroid_eltroxin'
  | 'steroid_cortisone'
  | 'anticoagulant_blood_thinner';

export interface DrugFamilyData {
  id: DrugFamilyKey;
  icon: string;
  nameAr: string;
  nameEn: string;
  badgeAr: string;
  commonBrandsAr: string;
  timingCriticality: 'extreme_minutes' | 'high_hours' | 'moderate';
  scenarios: Array<{
    id: string;
    hoursLateLabelAr: string;
    actionBadgeAr: string;
    severityColor: string;
    actionTitleAr: string;
    immediateStepAr: string;
    strictlyForbiddenAr: string;
    whenToWorryAr: string;
  }>;
}

export const MISSED_DOSE_FAMILIES: Record<DrugFamilyKey, DrugFamilyData> = {
  birth_control: {
    id: 'birth_control',
    icon: '🌸',
    nameAr: 'حبوب منع الحمل (المركبة وأحادية الرضاعة)',
    nameEn: 'Birth Control Pills',
    badgeAr: 'حساسة جداً للموعد لمنع حدوث حمل غير مخطط له',
    commonBrandsAr: 'ياسمين (Yasmin)، جينيرا (Gynera)، مارفيلون، سيرازيت (Cerazette)، ميكرولوت',
    timingCriticality: 'extreme_minutes',
    scenarios: [
      {
        id: 'bc-under-12',
        hoursLateLabelAr: 'تأخرتِ أقل من 12 ساعة (أو أقل من 24 ساعة في الحبوب المركبة)',
        actionBadgeAr: '🟢 الحماية مستمرة — خذيها فوراً',
        severityColor: '#16a34a',
        actionTitleAr: 'خذي الحبة المنسية فور تذكرها فوراً الآن',
        immediateStepAr: 'ابلعي الحبة المنسية فوراً بمجرد تذكرها، وخذي الحبة القادمة في ميعادها الطبيعي كالمعتاد (حتى لو هذا يعني أخذ حبتين في نفس اليوم). الحماية لا تزال قائمة ولا تحتاجين لوسيلة إضافية.',
        strictlyForbiddenAr: 'ممنوع إهمال الحبة أو تأجيلها لميعاد الغد.',
        whenToWorryAr: 'إذا كانت حبوب رضاعة أحادية (ميكرولوت) وتأخرتِ أكثر من 3 ساعات، يجب استخدام واقي ذكري لمدة 48 ساعة.',
      },
      {
        id: 'bc-over-24-two',
        hoursLateLabelAr: 'تأخرتِ أكثر من 24–48 ساعة (نسيان حبتين أو أكثر)',
        actionBadgeAr: '🔴 خطر فقدان الحماية — خطة الطوارئ',
        severityColor: '#dc2626',
        actionTitleAr: 'خذي آخر حبة منسية فوراً + وسيلة عازلة إضافية 7 أيام',
        immediateStepAr: 'خذي آخر حبة نسيتيها فوراً الآن واتركي الحبات السابقة، واستمري في باقي الشريط. **يجب استخدام وسيلة حماية إضافية (واقي ذكري) لمدة 7 أيام متواصلة**!',
        strictlyForbiddenAr: 'ممنوع إقامة علاقة زوجية بدون وسيلة عازلة إضافية خلال الأيام الـ 7 القادمة.',
        whenToWorryAr: 'إذا حدثت علاقة زوجية خلال الـ 5 أيام الماضية، استشيري الطبيبة أو الصيدلي فوراً بخصوص وسيلة الطوارئ (كونترابلان).',
      },
    ],
  },

  antibiotic: {
    id: 'antibiotic',
    icon: '💊',
    nameAr: 'المضادات الحيوية (الأقراص والشراب والكبسول)',
    nameEn: 'Antibiotics',
    badgeAr: 'الحفاظ على تركيز الدواء في الدم لقتل البكتيريا ومنع المناعة',
    commonBrandsAr: 'أوجمنتين (Augmentin)، هاي بيوتك، كيورام، زيثروماكس، سيبروفار، سيفوتاكس',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'abx-few-hours',
        hoursLateLabelAr: 'تأخرت ساعتين إلى 4 ساعات عن ميعاد الجرعة',
        actionBadgeAr: '🟢 خذ الجرعة الآن واضبط مواعيدك القادمة',
        severityColor: '#16a34a',
        actionTitleAr: 'خذ الجرعة فوراً وواصل كل 12 أو 8 ساعات',
        immediateStepAr: 'تناول الجرعة المنسية فوراً الآن مع كوب ماء كامل بعد الأكل، ثم اضبط ميعاد الجرعة التالية بحيث تفصل بينها وبين هذه الجرعة بالمدة المقررة (مثلاً 12 ساعة لو مرتين يومياً).',
        strictlyForbiddenAr: 'ممنوع تماماً مضاعفة الجرعة القادمة بأخذ قرصين معاً لتعويض الجرعة المنسية!',
        whenToWorryAr: 'لو حدث قيء خلال 30 دقيقة من بلع القرص، يُعاد تناول الجرعة مرة أخرى.',
      },
      {
        id: 'abx-close-next',
        hoursLateLabelAr: 'تذكرت الجرعة في وقت اقتراب الجرعة التالية جداً (باقي أقل من ساعتين)',
        actionBadgeAr: '🟡 تخطَّ الجرعة المنسية وخذ القادمة في ميعادها',
        severityColor: '#d97706',
        actionTitleAr: 'تخطَّ الجرعة المنسية ولا تأخذ جرعتين معاً',
        immediateStepAr: 'تجاوز الجرعة الفائتة، وخذ جرعتك القادمة في ميعادها المعتاد بدقة، وأكمل كورس المضاد الحيوي ليوم إضافي حتى ينتهي الكورس بالكامل.',
        strictlyForbiddenAr: 'إياك وأخذ جرعتين متقاربتين حتى لا يحدث تسمم أو إسهال ومغص حاد.',
        whenToWorryAr: 'إذا نسيت أكثر من جرعتين متتاليتين، راجع الصيدلي لتقييم فاعلية الكورس.',
      },
    ],
  },

  blood_pressure: {
    id: 'blood_pressure',
    icon: '🫀',
    nameAr: 'أدوية ضغط الدم والقلب (حاصرات بيتا ومثبطات ACE)',
    nameEn: 'Blood Pressure & Heart Medications',
    badgeAr: 'منع الارتداد المفاجئ لضغط الدم أو ضربات القلب',
    commonBrandsAr: 'كونكور (Concor)، إكسفورج (Exforge)، تريتايس، أملوديبين، كابتوبريل، ناتريليكس',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'bp-same-day',
        hoursLateLabelAr: 'تذكرت الجرعة في نفس اليوم وباقي أكثر من 6 ساعات على الجرعة القادمة',
        actionBadgeAr: '🟢 قس الضغط أولاً ثم خذ الجرعة فوراً',
        severityColor: '#16a34a',
        actionTitleAr: 'قس ضغط دمك وتناول الجرعة المنسية',
        immediateStepAr: 'قس ضغط الدم بجهاز رقمي موثوق؛ إذا كان طبيعياً أو مرتفعاً خذ القرص المنسي فوراً واشرب ماءً كافياً، وخذ جرعة الغد في ميعادها الطبيعي.',
        strictlyForbiddenAr: 'ممنوع منعاً باتاً أخذ قرصين معاً غداً في حالة النسيان، لأن مضاعفة دواء الضغط تسبب هبوطاً حاداً وإغماءً!',
        whenToWorryAr: 'إذا شعرت بصداع شديد في مؤخرة الرأس أو زغللة أو نغزة بالصدر، توجه للطوارئ فوراً.',
      },
    ],
  },

  thyroid_eltroxin: {
    id: 'thyroid_eltroxin',
    icon: '🦋',
    nameAr: 'هرمون الغدة الدرقية (ليفوثيروكسين / إلتروكسين)',
    nameEn: 'Levothyroxine (Eltroxin)',
    badgeAr: 'يُؤخذ على معدة فارغة تماماً بالماء فقط',
    commonBrandsAr: 'إلتروكسين (Eltroxin 50 / 100)، إيثيروكس (Euthyrox)',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'thyroid-late-morning',
        hoursLateLabelAr: 'أفطرت وشربت الشاي أو القهوة ونسيت القرص الصباحي',
        actionBadgeAr: '🟡 خذه بعد صيام 3 إلى 4 ساعات عن الأكل',
        severityColor: '#d97706',
        actionTitleAr: 'صم 3 ساعات عن الطعام ثم خذ القرص بالماء',
        immediateStepAr: 'امتنع عن الأكل والشاي والقهوة لمدة 3 إلى 4 ساعات كاملة بعد الفطار أو الغداء، ثم خذ القرص بكوب ماء، وانتظر 30 دقيقة قبل تناول أي طعام آخر.',
        strictlyForbiddenAr: 'ممنوع بلع قرص الغدة مع الأكل أو مع مكملات الحديد والكالسيوم لأن امتصاصه يتدمر تماماً.',
        whenToWorryAr: 'إذا فات اليوم بالكامل ولم تستطع، خذ قرصك غداً في موعده كالمعتاد ولا تقلق، فهرمون الغدة يظل في الدم لعدة أيام.',
      },
    ],
  },

  insulin_diabetes: {
    id: 'insulin_diabetes',
    icon: '🩸',
    nameAr: 'الأنسولين وأدوية السكري (أقراص وحقن)',
    nameEn: 'Insulin & Diabetes Medications',
    badgeAr: 'خطر هبوط السكر الحاد — الحذر التام مع مواعيد الوجبات',
    commonBrandsAr: 'أنسولين ميكستارد، لانتوس، نوفورابيد، دياميكرون، أماريل، جانوفيا، جلوكوفاج',
    timingCriticality: 'extreme_minutes',
    scenarios: [
      {
        id: 'insulin-rapid-missed',
        hoursLateLabelAr: 'أنسولين سريع أو مخلوط قبل الوجبة: تذكرته بعد الانتهاء من الأكل',
        actionBadgeAr: '🟡 قس السكر فوراً ولا تأخذ الجرعة كاملة عشوائياً',
        severityColor: '#d97706',
        actionTitleAr: 'قس السكر أولاً واستشر الطبيب',
        immediateStepAr: 'قس مستوى السكر بجهاز التحليل المنزلي فوراً. إذا كان السكر سريع المفعول وفاتت الوجبة بأكثر من 30 دقيقة، قد تحتاج لتعديل الجرعة لتفادي هبوط السكر الحاد.',
        strictlyForbiddenAr: 'ممنوع تماماً حقن جرعة الأنسولين السريع إذا لم تكن ستأكل وجبة نشويات فوراً، لأن ذلك يسبب غيبوبة هبوط سكر قاتلة!',
        whenToWorryAr: 'إذا ظهرت أعراض الهبوط (عرق بارد، رعشة باليدين، دوخة، زغللة)، تناول نصف كوب عصير محلى أو 3 ملاعق سكر فوراً (قاعدة 15-15).',
      },
      {
        id: 'insulin-basal-missed',
        hoursLateLabelAr: 'أنسولين قاعدي طويل المفعول (لانتوس / ليفيمير / تريسيبا)',
        actionBadgeAr: '🟢 خذه فور تذكره أو عدّل موعد الغد تدريجياً',
        severityColor: '#16a34a',
        actionTitleAr: 'احقن الجرعة فوراً وتابع قياس السكر',
        immediateStepAr: 'احقن الجرعة القاعدية المعتادة فور تذكرها، واجعل موعد الغد متأخراً بساعة أو ساعتين للرجوع تدريجياً لموعدك الثابت.',
        strictlyForbiddenAr: 'ممنوع حقن جرعة مضاعفة تحت أي ظرف.',
        whenToWorryAr: 'راقب قراءات السكر كل 4 ساعات.',
      },
    ],
  },

  anticoagulant_blood_thinner: {
    id: 'anticoagulant_blood_thinner',
    icon: '🩸',
    nameAr: 'أدوية السيولة ومميعات الدم (NOACs وماريفان)',
    nameEn: 'Blood Thinners & Anticoagulants',
    badgeAr: 'التوازن الدقيق بين منع الجلطات وتجنب النزيف',
    commonBrandsAr: 'إليكويس (Eliquis)، زاريلتو (Xarelto)، براداكسا، ماريفان (Marevan)',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'eliquis-twice-missed',
        hoursLateLabelAr: 'دواء سيولة مرتين يومياً (مثل إليكويس / براداكسا): تأخرت أقل من 6 ساعات',
        actionBadgeAr: '🟢 خذ القرص فوراً ولا تضاعف الجرعة القادمة',
        severityColor: '#16a34a',
        actionTitleAr: 'تناول القرص فوراً وتابع جدولك',
        immediateStepAr: 'إذا كان باقي أكثر من 6 ساعات على الجرعة القادمة، خذ القرص المنسي فوراً الآن، وخذ الجرعة التالية في موعدها الطبيعي.',
        strictlyForbiddenAr: 'إذا كان باقي أقل من 6 ساعات، تخطَّ الجرعة المنسية نهائياً ولا تأخذ قرصين معاً حتى لا يحدث نزيف حاد!',
        whenToWorryAr: 'إذا ظهرت أي كدمات زرقاء مفاجئة، نزيف أنف مستمر، أو بول مدمم، راجع طوارئ المستشفى فوراً.',
      },
    ],
  },

  steroid_cortisone: {
    id: 'steroid_cortisone',
    icon: '🛡️',
    nameAr: 'أقراص الكورتيزون (بريدسولون / ديكساميثازون)',
    nameEn: 'Oral Corticosteroids',
    badgeAr: 'ممنوع إيقافه فجأة لتجنب كسل الغدة الكظرية',
    commonBrandsAr: 'بريدسول (Predsol)، هوستيكورتين، سولوبريد، ديكسازون',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'steroid-morning-missed',
        hoursLateLabelAr: 'نسيت الجرعة الصباحية للكورتيزون وتذكرتها بعد الظهر أو المساء',
        actionBadgeAr: '🟢 خذ الجرعة بعد الأكل مباشرة اليوم',
        severityColor: '#16a34a',
        actionTitleAr: 'تناول الجرعة فوراً بعد وجبة طعام',
        immediateStepAr: 'تناول جرعتك اليومية المقررة فوراً بعد تناول وجبة طعام كاملة لحماية جدار المعدة، ثم عد لجدولك الصباحي غداً كالمعتاد.',
        strictlyForbiddenAr: 'ممنوع تماماً إيقاف الكورتيزون فجأة لو نسيت جرعة، وممنوع أخذه على معدة فارغة على الريق!',
        whenToWorryAr: 'إذا كنت تتبع جدول سحب تدريجي للكورتيزون، استشر طبيبك هاتفياً لإعادة ضبط الأيام.',
      },
    ],
  },
};

export default function MissedDoseRescueSolver() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedFamilyId, setSelectedFamilyId] = useState<DrugFamilyKey>('birth_control');
  const family = MISSED_DOSE_FAMILIES[selectedFamilyId];

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #7f1d1d 55%, #b91c1c 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '20px',
          boxShadow: '0 14px 34px rgba(13, 31, 56, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#fecaca' }}>
            🚨 {tr(lang, 'دليل وموجه إنقاذ الجرعة المنسية السريري الفوري', 'Clinical Missed Dose Emergency Protocol')}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/daily-schedule" className="btn small" style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
              🗓️ {tr(lang, 'جدول مواعيد الأدوية', 'Dose Schedule')}
            </Link>
            <Link to="/clinics" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
              🏥 {tr(lang, 'مجمع العيادات', 'Clinics Hub')}
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
          {tr(lang, 'نسيت ميعاد جرعة الدواء؟ 👈 اعرف فوراً التصرف الطبي الصحيح والممنوعات!', 'Missed Your Medication Dose? Exact Action Protocol & Contraindications')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
          {tr(
            lang,
            'اختر نوع الدواء (حبة منع الحمل، مضاد حيوي، دواء ضغط، أنسولين، غدة، كورتيزون، أو سيولة) لتعرف فوراً: هل تبلعها الآن؟ هل تتخطاها؟ هل تضاعف الجرعة؟ وما هي علامات الخطر بالساعة.',
            'Select your drug family to get instant clinical guidance: whether to take the missed dose now, skip it, or adjust timing without toxic double-dosing.'
          )}
        </p>
      </section>

      {/* Drug Family Selector Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {(Object.keys(MISSED_DOSE_FAMILIES) as DrugFamilyKey[]).map((key) => {
          const item = MISSED_DOSE_FAMILIES[key];
          const isSel = item.id === selectedFamilyId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedFamilyId(item.id)}
              style={{
                textAlign: 'right',
                padding: '14px 16px',
                borderRadius: '18px',
                border: isSel ? '2.5px solid #dc2626' : '1.5px solid #cbd5e1',
                background: isSel ? 'linear-gradient(135deg, #0D1F38 0%, #450a0a 100%)' : '#ffffff',
                color: isSel ? '#ffffff' : '#0D1F38',
                cursor: 'pointer',
                boxShadow: isSel ? '0 8px 22px rgba(220, 38, 38, 0.2)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                <span style={{ fontWeight: 900, fontSize: '0.94rem' }}>{item.nameAr}</span>
              </div>
              <div style={{ fontSize: '0.74rem', opacity: isSel ? 0.92 : 0.7, color: isSel ? '#fca5a5' : '#64748b', fontWeight: 700 }}>
                {item.badgeAr}
              </div>
            </button>
          );
        })}
      </section>

      {/* Active Drug Family Hero Details */}
      <section
        className="card"
        style={{
          borderRadius: '22px',
          border: '2px solid #b91c1c',
          background: '#ffffff',
          padding: '24px',
          marginBottom: '22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '5px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 900 }}>
              🎯 {family.badgeAr}
            </span>
            <h2 style={{ margin: '4px 0 6px', color: '#0D1F38', fontSize: '1.45rem', fontWeight: 900 }}>
              {family.icon} بروتوكول إنقاذ جرعة: {family.nameAr}
            </h2>
            <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
              💊 أشهر الأدوية والأسماء التجارية في مصر: <span style={{ color: '#0f766e' }}>{family.commonBrandsAr}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn small"
            onClick={() =>
              speakText(
                `بروتوكول إنقاذ جرعة ${family.nameAr}. ${family.scenarios[0].actionTitleAr}. ${family.scenarios[0].immediateStepAr}`,
                lang
              )
            }
            style={{ background: '#0D1F38', color: '#ffffff', borderRadius: '14px', fontWeight: 800 }}
          >
            🔊 استمع للتوجيه الصوتي
          </button>
        </div>

        {/* Scenarios according to hours late */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {family.scenarios.map((sc) => (
            <div
              key={sc.id}
              style={{
                borderRadius: '18px',
                border: `2px solid ${sc.severityColor}`,
                background: '#fafafa',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0D1F38' }}>
                  ⏱️ سيناريو الوقت: {sc.hoursLateLabelAr}
                </span>
                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: '14px',
                    background: sc.severityColor,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                  }}
                >
                  {sc.actionBadgeAr}
                </span>
              </div>

              <h3 style={{ margin: '0 0 10px', color: sc.severityColor, fontSize: '1.18rem', fontWeight: 900 }}>
                👉 {sc.actionTitleAr}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f0fdf4', borderRight: '4px solid #16a34a', padding: '12px 14px', borderRadius: '12px' }}>
                  <strong style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>
                    ✅ التصرف السريري الفوري المطلوب:
                  </strong>
                  <span style={{ color: '#1e293b', fontSize: '0.92rem', lineHeight: 1.65 }}>
                    {sc.immediateStepAr}
                  </span>
                </div>

                <div style={{ background: '#fef2f2', borderRight: '4px solid #dc2626', padding: '12px 14px', borderRadius: '12px' }}>
                  <strong style={{ color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                    ⛔ خطأ كارثي ممنوع تماماً:
                  </strong>
                  <span style={{ color: '#7f1d1d', fontSize: '0.92rem', lineHeight: 1.65, fontWeight: 700 }}>
                    {sc.strictlyForbiddenAr}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.86rem', color: '#1e40af' }}>
                ⚠️ <b>متى يجب القلق أو استشارة الطبيب؟</b> {sc.whenToWorryAr}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Universal Golden Rule Banner */}
      <section
        className="card"
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '22px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 900, color: '#fde047' }}>
              🌟 القاعدة الذهبية لجميع أدوية العالم عند نسيان الجرعة:
            </h3>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.65, maxWidth: '780px' }}>
              «إياك ومضاعفة الجرعة أبداً بأخذ حبتين لتعويض حبة منسية، إلا إذا كان ذلك وارداً بنص صريح في بروتوكول حبوب منع الحمل فقط! مضاعفة المسكنات أو أدوية الضغط أو الأنسولين أو الغدة قد تسبب تسمماً دوائياً أو هبوطاً حاداً يهدد الحياة.»
            </p>
          </div>
          <Link
            to="/assistant"
            className="btn"
            style={{
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 900,
              borderRadius: '14px',
              textDecoration: 'none',
              padding: '10px 18px',
            }}
          >
            💬 اسأل دكتور دوايا عن دوائك المنسي الآن ←
          </Link>
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
