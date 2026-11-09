import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import Disclaimer from './Disclaimer';

export type SimScenarioId =
  | 'triple_whammy_kidney'
  | 'cold_shot_disaster'
  | 'nsaid_anticoagulant_stomach'
  | 'ventolin_lungs_relief'
  | 'ppi_stomach_shield'
  | 'antibiotic_bacteria_target';

export interface OrganSimStage {
  stageNumber: number;
  titleAr: string;
  organAffectedAr: string;
  descriptionAr: string;
  organColor: string;
  vitalMetricLabelAr: string;
  vitalMetricValueAr: string;
}

export interface OrganSimScenario {
  id: SimScenarioId;
  mode: 'danger_mix' | 'healing_action';
  badgeAr: string;
  titleAr: string;
  subtitleAr: string;
  primaryOrgan: 'kidney' | 'stomach' | 'heart' | 'lungs' | 'liver_immune';
  drugsInvolvedAr: string;
  safeAlternativeAr: string;
  relatedClinicRoute: string;
  relatedClinicLabelAr: string;
  stages: OrganSimStage[];
}

export const ORGAN_SIM_SCENARIOS: OrganSimScenario[] = [
  {
    id: 'triple_whammy_kidney',
    mode: 'danger_mix',
    badgeAr: '🚨 كارثة دوائية شائعة في مصر (الضربة الثلاثية للكلى)',
    titleAr: 'ماذا يحدث في الكلى عند خلط مسكن (فولتارين/كتافلام) مع دواء ضغط ومدر بول؟',
    subtitleAr: 'محاكاة حية لآلية الفشل الكلوي الحاد الدوائي (Triple Whammy Nephrotoxicity)',
    primaryOrgan: 'kidney',
    drugsInvolvedAr: 'مسكن NSAID (فولتارين / كتافلام / بروفين) + دواء ضغط (كابتوبريل / إكسفورج / كونكور) + مدر بول',
    safeAlternativeAr: 'استخدم الباراسيتامول (بنادول) أو الدهانات الموضعية لتسكين الألم عند مرضى الضغط والكلى، واشرب كفايتك من الماء.',
    relatedClinicRoute: '/urology-clinic',
    relatedClinicLabelAr: '🧪 افتح عيادة الكلى وحاسبة eGFR',
    stages: [
      {
        stageNumber: 1,
        titleAr: 'المرحلة ١: الكلى الطبيعية قبل أخذ المسكن',
        organAffectedAr: '🫘 الكليتان والشريان الكلوي الوارد والصادر',
        descriptionAr: 'في الحالة الطبيعية، تفرز الكلى مادة «البروستاجلاندين» لتوسيع الشريان الوارد الذي يضخ الدم لفلتر الكلى، بينما يعمل دواء الضغط على توسيع الشريان الصادر لتخفيف الضغط.',
        organColor: '#16a34a',
        vitalMetricLabelAr: 'كفاءة فلترة الكلى (eGFR)',
        vitalMetricValueAr: '95 مل/دقيقة (طبيعي 🟢)',
      },
      {
        stageNumber: 2,
        titleAr: 'المرحلة ٢: بلع قرص أو حقنة المسكن (فولتارين / كتافلام)',
        organAffectedAr: '🫘 انقباض الشريان الكلوي المغذي',
        descriptionAr: 'المسكن يمنع إفراز البروستاجلاندين فيغلق محبس الدم الداخل للكلى (الشريان الوارد)، وفي نفس الوقت دواء الضغط فاتح محبس الخروج ومدر البول يسحب السوائل!',
        organColor: '#f59e0b',
        vitalMetricLabelAr: 'ضغط الترشيح داخل الكلى',
        vitalMetricValueAr: 'هبوط حاد في التروية ⚠️',
      },
      {
        stageNumber: 3,
        titleAr: 'المرحلة ٣: اختناق النفرونات وارتفاع الكرياتينين الحاد',
        organAffectedAr: '🚨 قصور كلوي حاد دوائي (Acute Kidney Injury)',
        descriptionAr: 'ينقطع ضغط الترشيح داخل الكلى فتقل كمية البول وترتفع البولينا والكرياتينين والبوتاسيوم في الدم خلال أيام قليلة!',
        organColor: '#dc2626',
        vitalMetricLabelAr: 'الكرياتينين بالدم',
        vitalMetricValueAr: 'يرتفع من 1.0 إلى 3.2 mg/dL 🚨',
      },
    ],
  },
  {
    id: 'cold_shot_disaster',
    mode: 'danger_mix',
    badgeAr: '🚨 أخطر خلطة شعبية في الصيدليات (حقنة البرد 3×1)',
    titleAr: 'ماذا تفعل «حقنة البرد» (كورتيزون + مسكن + مضاد حيوي) داخل أعضائك؟',
    subtitleAr: 'محاكاة تأثير الخلطة الثلاثية على المناعة والمعدة والقلب والسكر',
    primaryOrgan: 'liver_immune',
    drugsInvolvedAr: 'ديكساميثازون (كورتيزون) + فولتارين/أولفن (مسكن) + سيفوتاكس/يونيكتام (مضاد حيوي)',
    safeAlternativeAr: 'دور البرد فيروسي يزول بـ: الراحة + السوائل الدافئة + باراسيتامول للحرارة + بخاخ ماء بحر للأنف بدون كورتيزون أو مضاد حيوي.',
    relatedClinicRoute: '/cold-shot-warning',
    relatedClinicLabelAr: '💉 افتح ملف تحذير حقنة البرد الكامل',
    stages: [
      {
        stageNumber: 1,
        titleAr: 'المرحلة ١: الخدعة المؤقتة في أول ساعتين',
        organAffectedAr: '🛡️ الجهاز المناعي والحرارة',
        descriptionAr: 'الكورتيزون والمسكن يقمعان رد فعل الجهاز المناعي قسرياً فتنزل الحرارة ويختفي تكسير الجسم مؤقتاً، فيظن المريض أنه شُفي بينما الفيروس يتكاثر بحرية!',
        organColor: '#f59e0b',
        vitalMetricLabelAr: 'مناعة الجسم ضد الفيروس',
        vitalMetricValueAr: 'مثبطة قسرياً ⚠️',
      },
      {
        stageNumber: 2,
        titleAr: 'المرحلة ٢: هجوم مزدوج على جدار المعدة والكلى',
        organAffectedAr: '🔥 المعدة والكليتان',
        descriptionAr: 'الجمع بين حقنة الكورتيزون وحقنة الفولتارين يضاعف خطر قرحة ونزيف المعدة الحاد 4 أضعاف ويجهد الكلى خاصة مع الجفاف وقلة شرب الماء أثناء البرد!',
        organColor: '#dc2626',
        vitalMetricLabelAr: 'خطر قرحة المعدة والضغط',
        vitalMetricValueAr: 'مرتفع جداً (400%) 🚨',
      },
      {
        stageNumber: 3,
        titleAr: 'المرحلة ٣: انفجار السكر والضغط ومقاومة البكتيريا',
        organAffectedAr: '🫀 القلب والبنكرياس والبكتيريا النافعة',
        descriptionAr: 'الكورتيزون يرفع السكر والضغط لمستويات حرجة، وحقنة المضاد الحيوي العشوائية الواحد لا تقتل الفيروس بل تربي بكتيريا شرسة مقاومة للمضادات وقد تسبب صدمة تحسسية قاتلة!',
        organColor: '#991b1b',
        vitalMetricLabelAr: 'السكر والضغط والمناعة',
        vitalMetricValueAr: 'اضطراب حاد وخطر صدمة حساسية 🚨',
      },
    ],
  },
  {
    id: 'nsaid_anticoagulant_stomach',
    mode: 'danger_mix',
    badgeAr: '🚨 تفاعل نزفي خطير',
    titleAr: 'ماذا يحدث عند أخذ مسكن (كتافلام/بروفين) مع دواء سيولة (إليكويس/ماريفان/بلافيكس)؟',
    subtitleAr: 'محاكاة نزيف جدار المعدة الصامت عند جمع المسكنات مع مميعات الدم',
    primaryOrgan: 'stomach',
    drugsInvolvedAr: 'إليكويس / زاريلتو / ماريفان / أسبرين + مسكن عظام أو أسنان (كتافلام / بروفين / كيتولاك)',
    safeAlternativeAr: 'المسكن الآمن مع أدوية السيولة هو الباراسيتامول (بنادول) بجرعة معتدلة مع استشارة الطبيب.',
    relatedClinicRoute: '/gastro-clinic',
    relatedClinicLabelAr: '🦠 افتح عيادة الجهاز الهضمي والمعدة',
    stages: [
      {
        stageNumber: 1,
        titleAr: 'المرحلة ١: كشط الطبقة المخاطية الواقية للمعدة',
        organAffectedAr: '🔥 جدار المعدة الداخلي',
        descriptionAr: 'المسكن يوقف تصنيع المخاط الواقي لجدار المعدة، فتصبح الشعيرات الدموية في جدار المعدة مكشوفة مباشرة لحمض المعدة القوي (HCl).',
        organColor: '#f59e0b',
        vitalMetricLabelAr: 'درع حماية المعدة',
        vitalMetricValueAr: 'مكشوف للحمض ⚠️',
      },
      {
        stageNumber: 2,
        titleAr: 'المرحلة ٢: حدوث قرحة دقيقة مع استحالة التجلط',
        organAffectedAr: '🩸 الأوعية الدموية بالمعدة',
        descriptionAr: 'عندما يجرح الحمض شعيرة دموية في المعدة، يمنع دواء السيولة (إليكويس أو ماريفان) سد الجرح بالصفائح وعوامل التجلط!',
        organColor: '#dc2626',
        vitalMetricLabelAr: 'قدرة الدم على إيقاف النزف',
        vitalMetricValueAr: 'معطلة بسبب السيولة 🚨',
      },
      {
        stageNumber: 3,
        titleAr: 'المرحلة ٣: نزيف معدي وتغير لون البراز للأسود',
        organAffectedAr: '🚨 الجهاز الهضمي العلوي',
        descriptionAr: 'يستمر النزف الداخلي فيتحول لون البراز إلى الأسود القطراني كالفحم (Melena) مع هبوط حاد في الهيموجلوبين ودوخة شديدة.',
        organColor: '#991b1b',
        vitalMetricLabelAr: 'الهيموجلوبين وضغط الدم',
        vitalMetricValueAr: 'هبوط بسبب النزيف 🚨',
      },
    ],
  },
  {
    id: 'ventolin_lungs_relief',
    mode: 'healing_action',
    badgeAr: '🟢 محاكاة الأثر العلاجي المنقذ للحياة',
    titleAr: 'كيف يفتح بخاخ الصدر وجلسة البخار الشعب الهوائية في 5 دقائق أثناء أزمة الربو؟',
    subtitleAr: 'شاهد كيف يعمل موسع الشعب ومضاد الالتهاب الموضعي داخل الرئتين',
    primaryOrgan: 'lungs',
    drugsInvolvedAr: 'بخاخ موسع الشعب (فنتولين) + بخاخ الكورتيزون الموضعي الوقائي (فليكسوتيد / سيمبيكورت)',
    safeAlternativeAr: 'البخاخ الموضعي يذهب 99% منه للرئة مباشرة بالميكروجرام ولا يسبب أضرار الكورتيزون الفموي، مع المضمضة بالماء بعد البخاخ الوقائي.',
    relatedClinicRoute: '/chest-clinic',
    relatedClinicLabelAr: '🫁 افتح عيادة الصدر والربو وجلسات البخار',
    stages: [
      {
        stageNumber: 1,
        titleAr: 'المرحلة ١: ضيق وتقلص الشعب الهوائية أثناء النوبة',
        organAffectedAr: '🫁 الشعب الهوائية بالرئتين',
        descriptionAr: 'عند التعرض للتراب أو الهواء البارد، تنقبض العضلات المحيطة بالشعب الهوائية ويتورم الجدار الداخلي فيحدث صوت التزييق وضيق النفس.',
        organColor: '#dc2626',
        vitalMetricLabelAr: 'قطر الشعب الهوائية والأكسجين',
        vitalMetricValueAr: 'ضيق شديد وتزييق 🔴',
      },
      {
        stageNumber: 2,
        titleAr: 'المرحلة ٢: استنشاق البخاخ ووصول الرذاذ لمستقبلات Beta-2',
        organAffectedAr: '💨 مستقبلات عضلات الشعب الهوائية',
        descriptionAr: 'يرتبط رذاذ البخاخ بمستقبلات (Beta-2) في عضلات الشعب الهوائية خلال ثوانٍ فيأمر العضلات المنقبضة بالارتخاء الفوري.',
        organColor: '#0284c7',
        vitalMetricLabelAr: 'استجابة عضلات الشعب',
        vitalMetricValueAr: 'ارتخاء وتوسع سريع ⚡',
      },
      {
        stageNumber: 3,
        titleAr: 'المرحلة ٣: تدفق الأكسجين بحرية واختفاء التزييق',
        organAffectedAr: '🟢 الرئتان والحويصلات الهوائية',
        descriptionAr: 'يتسع مجرى الهواء ويعود تدفق الأكسجين للدم طبيعياً خلال 5 دقائق دون أن يدخل الدواء لباقي أعضاء الجسم!',
        organColor: '#16a34a',
        vitalMetricLabelAr: 'تشبع الأكسجين (SpO2)',
        vitalMetricValueAr: '98% تنفس مريح 🟢',
      },
    ],
  },
  {
    id: 'ppi_stomach_shield',
    mode: 'healing_action',
    badgeAr: '🟢 محاكاة التوقيت الذهبي للدواء',
    titleAr: 'لماذا يجب أخذ كبسولة المعدة (أوميبرازول / نيكسيوم / كونترولوك) قبل الفطار بـ 30 دقيقة؟',
    subtitleAr: 'شاهد كيف تغلق كبسولة المعدة مضخات الحمض قبل نزول الطعام',
    primaryOrgan: 'stomach',
    drugsInvolvedAr: 'مثبطات مضخة البروتون (أوميبرازول، نيكسيوم، كونترولوك، بانتولوك، زوركال)',
    safeAlternativeAr: 'خذ الكبسولة على معدة فارغة ثم تناول وجبة الفطار بعد نصف ساعة بالضبط لتعمل بكفاءة 100%.',
    relatedClinicRoute: '/gastro-clinic',
    relatedClinicLabelAr: '🦠 افتح عيادة الجهاز الهضمي والحموضة',
    stages: [
      {
        stageNumber: 1,
        titleAr: 'المرحلة ١: مضخات الحمض نائمة قبل الفطار',
        organAffectedAr: '🔥 الخلايا الجدارية بالمعدة',
        descriptionAr: 'في الصباح قبل الأكل، تكون مضخات الحمض (Proton Pumps) جاهزة للعمل عند أول لقمة فطار، وتحتاج الكبسولة 30 دقيقة لتصل للدم.',
        organColor: '#0284c7',
        vitalMetricLabelAr: 'تركيز الدواء في الدم',
        vitalMetricValueAr: 'جاهز عند المضخات ⚡',
      },
      {
        stageNumber: 2,
        titleAr: 'المرحلة ٢: تناول الفطار بعد 30 دقيقة من الكبسولة',
        organAffectedAr: '🛡️ إغلاق 80% من مضخات الحمض النشطة',
        descriptionAr: 'بمجرد تناول الفطار تنشط مضخات الحمض فتجد الدواء في انتظارها فيغلقها فوراً ويحمي المريء وجدار المعدة طوال اليوم!',
        organColor: '#16a34a',
        vitalMetricLabelAr: 'حماية جدار المعدة والمريء',
        vitalMetricValueAr: 'حماية 24 ساعة متكاملة 🟢',
      },
    ],
  },
];

export default function VisualBodyDrugSimulator() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedScenarioId, setSelectedScenarioId] = useState<SimScenarioId>('triple_whammy_kidney');
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);

  const scenario =
    ORGAN_SIM_SCENARIOS.find((s) => s.id === selectedScenarioId) || ORGAN_SIM_SCENARIOS[0];
  const currentStage = scenario.stages[activeStageIdx] || scenario.stages[0];

  const handleSelectScenario = (id: SimScenarioId) => {
    setSelectedScenarioId(id);
    setActiveStageIdx(0);
  };

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #312e81 55%, #4f46e5 100%)',
          color: '#ffffff',
          borderRadius: '22px',
          padding: '28px 24px',
          marginBottom: '20px',
          boxShadow: '0 14px 32px rgba(13, 31, 56, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#e0e7ff' }}>
            🫀 {tr(lang, 'محاكي الأثر البصري للدواء والتفاعلات داخل أعضاء الجسم', 'Interactive Visual Organ & Drug Reaction Simulator')}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/interactions" className="btn small" style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
              ⚡ {tr(lang, 'فاحص التداخلات الدوائية', 'Drug Interactions')}
            </Link>
            <Link to="/food-drug-checker" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
              ☕ {tr(lang, 'فاحص الأكل والشرب مع الدواء', 'Food-Drug Checker')}
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
          {tr(lang, 'شاهد بعينك ماذا يحدث داخل الكلى والمعدة والرئتين عند أخذ الدواء أو خلطه!', 'See Inside Your Organs: How Medications Heal vs. How Dangerous Mixes Harm')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
          {tr(
            lang,
            'محاكاة بصرية تفاعلية خطوة بخطوة تشرح لك بالصور والمؤشرات الفسيولوجية كيف تعمل الأدوية داخل أعضائك، ولماذا تسبب خلطات شائعة (مثل حقنة البرد أو المسكن مع دواء الضغط) أضراراً جسيمة.',
            'Step-by-step interactive organ simulation demonstrating physiological drug mechanisms and dangerous drug combinations.'
          )}
        </p>
      </section>

      {/* Scenario Selector Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {ORGAN_SIM_SCENARIOS.map((sc) => {
          const sel = sc.id === selectedScenarioId;
          const isDanger = sc.mode === 'danger_mix';
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScenario(sc.id)}
              style={{
                textAlign: 'right',
                padding: '14px',
                borderRadius: '16px',
                border: sel
                  ? isDanger
                    ? '2.5px solid #dc2626'
                    : '2.5px solid #16a34a'
                  : '1.5px solid #cbd5e1',
                background: sel
                  ? isDanger
                    ? 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)'
                  : '#ffffff',
                color: sel ? '#ffffff' : '#0D1F38',
                cursor: 'pointer',
                boxShadow: sel ? '0 8px 20px rgba(0,0,0,0.14)' : 'none',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 900, opacity: 0.9, marginBottom: '4px' }}>
                {isDanger ? '🚨 محاكاة تفاعل خطر' : '🟢 محاكاة أثر علاجي'}
              </div>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', lineHeight: 1.4 }}>{sc.titleAr}</div>
            </button>
          );
        })}
      </section>

      {/* Main Visual Organ Simulation Stage */}
      <section
        className="card"
        style={{
          borderRadius: '22px',
          border: '2px solid #cbd5e1',
          padding: '24px',
          marginBottom: '22px',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '22px', alignItems: 'center' }}>
          {/* Visual SVG Organ Chamber */}
          <div
            style={{
              background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '20px',
              padding: '22px',
              textAlign: 'center',
              color: '#ffffff',
              border: `3px solid ${currentStage.organColor}`,
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '6px' }}>
              🔬 المنظور الفسيولوجي الداخلي للعضو:
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', marginBottom: '12px' }}>
              {currentStage.organAffectedAr}
            </div>

            {/* Dynamic SVG Organ Illustration */}
            <svg viewBox="0 0 260 200" style={{ width: '100%', maxWidth: '250px', height: 'auto', margin: '0 auto' }}>
              <defs>
                <radialGradient id="organGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={currentStage.organColor} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={currentStage.organColor} stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="130" cy="100" r="85" fill="url(#organGlow)" />

              {/* Bloodstream / Vessels */}
              <path d="M 20 100 Q 75 100 100 100" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M 160 100 Q 195 100 240 100" stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round" />

              {/* Central Organ Shape based on primaryOrgan */}
              {scenario.primaryOrgan === 'kidney' && (
                <g fill={currentStage.organColor} stroke="#ffffff" strokeWidth="3">
                  <path d="M 110 45 C 75 45, 70 155, 110 155 C 135 155, 130 120, 118 100 C 130 80, 135 45, 110 45 Z" />
                  <path d="M 150 45 C 185 45, 190 155, 150 155 C 125 155, 130 120, 142 100 C 130 80, 125 45, 150 45 Z" />
                </g>
              )}
              {scenario.primaryOrgan === 'stomach' && (
                <path
                  d="M 115 40 L 115 65 C 85 75, 75 135, 115 155 C 155 170, 180 130, 160 95 C 145 75, 135 75, 130 65 L 130 40 Z"
                  fill={currentStage.organColor}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
              )}
              {scenario.primaryOrgan === 'lungs' && (
                <g fill={currentStage.organColor} stroke="#ffffff" strokeWidth="3">
                  <path d="M 130 35 L 130 80 M 130 65 L 105 90 M 130 65 L 155 90" stroke="#ffffff" strokeWidth="5" />
                  <ellipse cx="98" cy="110" rx="28" ry="48" />
                  <ellipse cx="162" cy="110" rx="28" ry="48" />
                </g>
              )}
              {(scenario.primaryOrgan === 'liver_immune' || scenario.primaryOrgan === 'heart') && (
                <polygon
                  points="130,38 178,72 162,148 98,148 82,72"
                  fill={currentStage.organColor}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
              )}
            </svg>

            {/* Vital Readout Box */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{currentStage.vitalMetricLabelAr}:</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#CFD29D', marginTop: '2px' }}>
                {currentStage.vitalMetricValueAr}
              </div>
            </div>
          </div>

          {/* Right Column: Step-by-Step Timeline & Explanation */}
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '5px 12px',
                borderRadius: '20px',
                background: scenario.mode === 'danger_mix' ? '#fee2e2' : '#dcfce7',
                color: scenario.mode === 'danger_mix' ? '#991b1b' : '#166534',
                fontWeight: 900,
                fontSize: '0.8rem',
                marginBottom: '8px',
              }}
            >
              {scenario.badgeAr}
            </span>

            <h2 style={{ margin: '0 0 8px', color: '#0D1F38', fontSize: '1.35rem', fontWeight: 900 }}>
              {scenario.titleAr}
            </h2>
            <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 700, marginBottom: '14px' }}>
              💊 الأدوية في المحاكاة: <span style={{ color: '#0f766e' }}>{scenario.drugsInvolvedAr}</span>
            </div>

            {/* Stage Selector Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {scenario.stages.map((st, idx) => {
                const active = idx === activeStageIdx;
                return (
                  <button
                    key={st.stageNumber}
                    type="button"
                    onClick={() => setActiveStageIdx(idx)}
                    style={{
                      flex: '1 1 140px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: active ? `2px solid ${st.organColor}` : '1px solid #cbd5e1',
                      background: active ? '#0D1F38' : '#f8fafc',
                      color: active ? '#ffffff' : '#0D1F38',
                      fontWeight: 900,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    المرحلة {st.stageNumber} من {scenario.stages.length}
                  </button>
                );
              })}
            </div>

            {/* Active Stage Detail Card */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                background: '#f8fafc',
                borderRight: `5px solid ${currentStage.organColor}`,
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ color: '#0D1F38', fontSize: '1.05rem' }}>{currentStage.titleAr}</strong>
                <button
                  type="button"
                  className="chip"
                  onClick={() => speakText(`${currentStage.titleAr}. ${currentStage.descriptionAr}`, lang)}
                >
                  🔊 اسمع الشرح
                </button>
              </div>
              <p style={{ margin: 0, color: '#1e293b', lineHeight: 1.7, fontSize: '0.94rem' }}>
                {currentStage.descriptionAr}
              </p>
            </div>

            {/* Safe Alternative Box */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                marginBottom: '14px',
              }}
            >
              <strong style={{ color: '#166534', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                ✅ البديل والقرار الطبي الآمن لحماية أعضائك:
              </strong>
              <span style={{ color: '#1e293b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {scenario.safeAlternativeAr}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                to={scenario.relatedClinicRoute}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  textDecoration: 'none',
                  borderRadius: '14px',
                }}
              >
                {scenario.relatedClinicLabelAr} ←
              </Link>
              <Link
                to="/complete-checkup"
                className="btn"
                style={{
                  background: '#ffffff',
                  color: '#0D1F38',
                  border: '1.5px solid #0D1F38',
                  fontWeight: 800,
                  textDecoration: 'none',
                  borderRadius: '14px',
                }}
              >
                🛡️ افحص روشتتك بالكامل بضغطة واحدة
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
