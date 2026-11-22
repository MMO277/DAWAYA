import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type BodyZone = 'head_neck' | 'chest_breath' | 'abdomen_gi' | 'pelvis_urinary' | 'back_joints' | 'skin_general';

export interface TriageScenario {
  id: string;
  zone: BodyZone;
  symptomTitleAr: string;
  companionSignsAr: string;
  urgency: 'emergency_er' | 'urgent_24h' | 'routine_clinic';
  possibleConditionAr: string;
  firstActionAr: string;
  recommendedSpecialtyAr: string;
  targetClinicLink: string;
  targetClinicNameAr: string;
}

export const TRIAGE_SCENARIOS: TriageScenario[] = [
  // 1. Head & Neck
  {
    id: 'stroke-fast-triage',
    zone: 'head_neck',
    symptomTitleAr: 'ثقل مفاجئ في اللسان أو ميل في زاوية الفم أو تنميل وضعف في ذراع واحدة',
    companionSignsAr: 'ظهر فجأة منذ دقائق أو ساعات مع عدم اتزان أو زغللة',
    urgency: 'emergency_er',
    possibleConditionAr: 'اشتباه سكتة أو جلطة دماغية حادة (Acute Stroke / TIA)',
    firstActionAr: '🚨 طوارئ فورية! لا تعطه أسبرين في المنزل، سجل وقت بداية العرض وتوجه لأقرب مستشفى لعمل أشعة مقطعية على المخ خلال الساعة الذهبية.',
    recommendedSpecialtyAr: 'طوارئ المخ والأعصاب والعناية المركزة',
    targetClinicLink: '/neuro-clinic',
    targetClinicNameAr: 'عيادة المخ والأعصاب والجلطات',
  },
  {
    id: 'migraine-triage',
    zone: 'head_neck',
    symptomTitleAr: 'صداع نابض في نصف الرأس وحول العين يزداد مع الضوء والصوت',
    companionSignsAr: 'يصاحبه غثيان أو رغبة في القيء وزغللة بصرية قبل النوبة',
    urgency: 'routine_clinic',
    possibleConditionAr: 'نوبة صداع نصفي / شقيقة (Migraine Attack)',
    firstActionAr: 'اجلس في غرفة مظلمة وهادئة، ضع كمادة باردة على الجبهة، وتناول علاج الشقيقة المخصص في أول ربع ساعة من النوبة.',
    recommendedSpecialtyAr: 'طبيب المخ والأعصاب',
    targetClinicLink: '/neuro-clinic',
    targetClinicNameAr: 'عيادة المخ والأعصاب والصداع',
  },
  {
    id: 'vertigo-bppv-triage',
    zone: 'head_neck',
    symptomTitleAr: 'دوخة شديدة (الغرفة تلف كالمروحة) لمدة دقيقة عند التقلب في السرير أو رفع الرأس',
    companionSignsAr: 'بدون ضعف في الأطراف وبدون تلعثم في الكلام',
    urgency: 'routine_clinic',
    possibleConditionAr: 'دوار الوضعة الانتيابي الحميد (تحرك كريستالات الأذن الداخلية BPPV)',
    firstActionAr: 'تجنب الحركات الفجائية للرقبة، ويمكن علاجها بمناورة إيبلي (Epley) لدى طبيب الأنف والأذن والاتزان.',
    recommendedSpecialtyAr: 'طبيب الأنف والأذن والحنجرة والاتزان',
    targetClinicLink: '/ent-clinic',
    targetClinicNameAr: 'عيادة الأنف والأذن والدوار',
  },

  // 2. Chest & Breathing
  {
    id: 'angina-mi-triage',
    zone: 'chest_breath',
    symptomTitleAr: 'ألم ضاغط كالصخرة الثقيلة أو الحرقان في منتصف الصدر يمتد للكتف الأيسر أو الفك',
    companionSignsAr: 'يصاحبه عرق بارد غزير، نهجان، أو غثيان ويزداد مع أقل مجهود',
    urgency: 'emergency_er',
    possibleConditionAr: 'اشتباه ذبحة صدرية غير مستقرة أو جلطة بالشريان التاجي (Acute Coronary Syndrome)',
    firstActionAr: '🚨 طوارئ قلب فورية! استرح تماماً في وضع نصف جالس، فك الملابس الضيقة، وتوجه لأقرب طوارئ قلب لعمل رسم قلب (ECG) وإنزيمات قلب (Troponin).',
    recommendedSpecialtyAr: 'طوارئ القلب والأوعية الدموية',
    targetClinicLink: '/chronic-clinic',
    targetClinicNameAr: 'عيادة الباطنة والقلب والضغط',
  },
  {
    id: 'panic-chest-triage',
    zone: 'chest_breath',
    symptomTitleAr: 'نغزة محددة في الصدر تزداد مع أخذ نفس عميق مع سرعة ضربات القلب وتنميل الأصابع',
    companionSignsAr: 'تأتي بعد توتر نفسي أو شرب كافيين، ويمكن الإشارة لمكان النغزة بإصبع واحد',
    urgency: 'routine_clinic',
    possibleConditionAr: 'ألم عضلي بجدار الصدر أو نوبة توتر وهلع (Panic Attack / Costochondritis)',
    firstActionAr: 'اطمئن، النغزة المحددة التي تزيد مع حركة القفص الصدري ليست جلطة قلبية. طبق تمرين التنفس الهادئ (شهيق 4 ثوانٍ وزفير 8 ثوانٍ).',
    recommendedSpecialtyAr: 'طبيب الباطنة أو الصدر',
    targetClinicLink: '/neuro-clinic',
    targetClinicNameAr: 'عيادة الأعصاب وتمرين التنفس',
  },
  {
    id: 'asthma-wheeze-triage',
    zone: 'chest_breath',
    symptomTitleAr: 'كحة مستمرة تشتد الفجر مع صوت تزييق أو صفير في الصدر وضيق نفس',
    companionSignsAr: 'تزداد مع الروائح النفاذة، التراب، الهواء البارد، أو بعد أخذ مسكن',
    urgency: 'urgent_24h',
    possibleConditionAr: 'نوبة حساسية صدر أو ربو شعبي (Bronchial Asthma)',
    firstActionAr: 'اجلس قائماً ولا تستلقِ، استخدم بخاخ الإسعاف الموسع للشعب أو جلسة بخار بمحلول الملح والفاركولين/الأتروفنت.',
    recommendedSpecialtyAr: 'طبيب الأمراض الصدرية والحساسية',
    targetClinicLink: '/chest-clinic',
    targetClinicNameAr: 'عيادة الصدر وجلسات البخار',
  },

  // 3. Abdomen & GI
  {
    id: 'appendicitis-triage',
    zone: 'abdomen_gi',
    symptomTitleAr: 'ألم بدأ حول السرة ثم انتقل وتركز بشدة في أسفل البطن من الجهة اليمنى',
    companionSignsAr: 'يزداد بشدة عند الكحة أو المشي أو الضغط عليه، مع فقدان شهية وغثيان وسخونة خفيفة',
    urgency: 'emergency_er',
    possibleConditionAr: 'اشتباه التهاب الزائدة الدودية الحاد (Acute Appendicitis)',
    firstActionAr: '🚨 طوارئ جراحة! لا تأخذ مسكنات قوية تخفي الألم ولا تأكل أو تشرب شيئاً، وتوجه للمستشفى لفحص الجراحة وعمل سونار وصورة دم.',
    recommendedSpecialtyAr: 'طبيب الجراحة العامة والطوارئ',
    targetClinicLink: '/gastro-clinic',
    targetClinicNameAr: 'عيادة الجهاز الهضمي والطوارئ',
  },
  {
    id: 'gallbladder-biliary-triage',
    zone: 'abdomen_gi',
    symptomTitleAr: 'مغص شديد في أعلى البطن من الجهة اليمنى تحت الضلوع يسمّع في الكتف الأيمن والظهر',
    companionSignsAr: 'يبدأ بعد أكل وجبة دسمة أو مقليات أو بيض، مع غثيان وقيء مراري',
    urgency: 'urgent_24h',
    possibleConditionAr: 'مغص مراري أو التهاب بحصوات المرارة (Biliary Colic / Cholecystitis)',
    firstActionAr: 'امتنع عن الدهون تماماً، وتوجه لإجراء أشعة تلفزيونية (سونار) على البطن والمرارة.',
    recommendedSpecialtyAr: 'طبيب الجهاز الهضمي أو الجراحة العامة',
    targetClinicLink: '/gastro-clinic',
    targetClinicNameAr: 'عيادة الجهاز الهضمي والكبد',
  },
  {
    id: 'ibs-gerd-triage',
    zone: 'abdomen_gi',
    symptomTitleAr: 'انتفاخ وغازات وتقلصات في البطن ترتاح بعد دخول الحمام مع حموضة',
    companionSignsAr: 'تزداد مع البقوليات واللبن والتوتر العصبي',
    urgency: 'routine_clinic',
    possibleConditionAr: 'القولون العصبي وعسر الهضم أو جرثومة المعدة (IBS / Gastritis)',
    firstActionAr: 'اتبع خريطة أكلات القولون المريحة، وتناول مضاد التقلص قبل الأكل وافحص جرثومة المعدة.',
    recommendedSpecialtyAr: 'طبيب الجهاز الهضمي والباطنة',
    targetClinicLink: '/gastro-clinic',
    targetClinicNameAr: 'عيادة الجهاز الهضمي والقولون',
  },

  // 4. Pelvis & Urinary
  {
    id: 'renal-colic-triage',
    zone: 'pelvis_urinary',
    symptomTitleAr: 'مغص كلوي عنيف ومفاجئ في الجنب (الخاصرة) ينزل نحو أسفل البطن والفخذ',
    companionSignsAr: 'يصاحبه حرقان شديد في البول أو تغير لون البول للأحمر وميل للقيء',
    urgency: 'urgent_24h',
    possibleConditionAr: 'حصوة متحركة في الحالب أو أملاح شديدة (Renal Colic / Ureteric Stone)',
    firstActionAr: 'تجنب شرب سوائل كثيرة أثناء قمة نوبة المغص الحاد حتى تهدأ العضلة بمضاد المغص والمسكن، ثم اعمل تحليل بول وسونار مسالك.',
    recommendedSpecialtyAr: 'طبيب الكلى والمسالك البولية',
    targetClinicLink: '/urology-clinic',
    targetClinicNameAr: 'عيادة الكلى والمسالك والحصوات',
  },
  {
    id: 'hemolysis-dark-urine-triage',
    zone: 'pelvis_urinary',
    symptomTitleAr: 'تحول لون بول الطفل فجأة للون الشاي الغامق أو الكوكاكولا مع شحوب شديد بالوجه',
    companionSignsAr: 'حدث بعد أكل فول أو طعمية أو أخذ مضاد حيوي/مسكن بـ 24 ساعة',
    urgency: 'emergency_er',
    possibleConditionAr: 'نوبة تكسير دم حادة (أنيميا الفول G6PD Hemolytic Crisis)',
    firstActionAr: '🚨 طوارئ أطفال فورية! أوقف أي دواء أو طعام وتوجه للمستشفى فوراً لقياس الهيموجلوبين ونقل الدم إذا لزم الأمر.',
    recommendedSpecialtyAr: 'طوارئ الأطفال وأمراض الدم',
    targetClinicLink: '/g6pd-clinic',
    targetClinicNameAr: 'عيادة أنيميا الفول وأمراض الدم',
  },

  // 5. Back & Joints
  {
    id: 'sciatica-disc-triage',
    zone: 'back_joints',
    symptomTitleAr: 'ألم أسفل الظهر ينزل كالكهرباء خلف الفخذ والسمانة حتى القدم مع تنميل',
    companionSignsAr: 'يزداد مع الجلوس والكحة والعطس والانحناء للأمام',
    urgency: 'urgent_24h',
    possibleConditionAr: 'انزلاق غضروفي قطني وعرق النسا (Lumbar Disc & Sciatica)',
    firstActionAr: 'تجنب الانحناء وحمل الأثقال تماماً، ونم على جانبك بمخدة بين الركبتين وراجع طبيب العظام والعمود الفقري. (لو حدث سقوط في مشط القدم أو احتباس بول فهذه طوارئ جراحية فورية!).',
    recommendedSpecialtyAr: 'طبيب جراحة العظام والعمود الفقري',
    targetClinicLink: '/ortho-clinic',
    targetClinicNameAr: 'عيادة العظام والعمود الفقري',
  },
  {
    id: 'gout-big-toe-triage',
    zone: 'back_joints',
    symptomTitleAr: 'تورم واحمرار وسخونة وألم شديد مفاجئ في مفصل إصبع القدم الأكبر أو الكعب',
    companionSignsAr: 'يشتد ليلاً بعد أكل لحوم حمراء أو بقوليات أو مأكولات بحرية',
    urgency: 'routine_clinic',
    possibleConditionAr: 'نوبة نقرس حادة وارتفاع أملاح اليوريك أسيد (Acute Gouty Arthritis)',
    firstActionAr: 'ارفع القدم وضع كمادة باردة، واشرب 3 لتر ماء، وابدأ علاج تهدئة النوبة الحادة (لا تبدأ الزيلوريك أثناء النوبة الحادة!).',
    recommendedSpecialtyAr: 'طبيب العظام والروماتيزم',
    targetClinicLink: '/ortho-clinic',
    targetClinicNameAr: 'عيادة العظام والنقرس والأملاح',
  },

  // 6. Skin & General
  {
    id: 'shingles-zoster-triage',
    zone: 'skin_general',
    symptomTitleAr: 'ألم حارق كالنار في جهة واحدة من الصدر أو الظهر يتبعه ظهور فقاقيع مائية على قاعدة حمراء',
    companionSignsAr: 'لا يعبر خط منتصف الجسم أبداً ويسبب ألماً عند ملامسة الملابس',
    urgency: 'urgent_24h',
    possibleConditionAr: 'الحزام الناري (Herpes Zoster / Shingles)',
    firstActionAr: 'يجب البدء في أقراص مضاد الفيروسات (أسيكلوفير / فالتريكس) في أول 72 ساعة من ظهور الطفح لمنع ألم الأعصاب المزمن.',
    recommendedSpecialtyAr: 'طبيب الأمراض الجلدية',
    targetClinicLink: '/derma-clinic',
    targetClinicNameAr: 'عيادة الجلدية والحروق',
  },
];

export default function SmartSymptomTriage() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [selectedZone, setSelectedZone] = useState<BodyZone>('chest_breath');

  const zoneScenarios = TRIAGE_SCENARIOS.filter((s) => s.zone === selectedZone);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #0f766e 50%, #138866 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#CFD29D' }}>
            🩺 {tr(lang, 'الفرز الإكلينيكي الذكي وتوجيه المريض للتخصص الصحيح', 'Smart Clinical Symptom Triage & Specialty Finder')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (20 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'مشخص الأعراض التفاعلي الذكي: اكشف عند أنهي دكتور؟ وهل الحالة طوارئ؟', 'Interactive Symptom Triage: Which Doctor Should I See & Is It an Emergency?')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'اختر منطقة الجسم التي تشتكي منها بالأسفل، ليقوم النظام بتحليل طبيعة الألم والأعراض المصاحبة، وتحديد درجة الخطورة، والتخصص الطبي الدقيق، وتحويلك للعيادة المختصة فوراً.',
            'Select the affected body region below to analyze pain characteristics, urgency level, exact medical specialty, and jump directly to the relevant clinic.'
          )}
        </p>
      </section>

      {/* Step 1: Select Body Region */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0D1F38', margin: '0 0 12px' }}>
        📍 الخطوة ١: اختر مكان العرض أو الألم في الجسم:
      </h2>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { id: 'head_neck', icon: '🧠', titleAr: 'الرأس، العين، والاتزان', subAr: 'صداع، دوخة، ثقل لسان' },
          { id: 'chest_breath', icon: '🫀', titleAr: 'الصدر، القلب، والتنفس', subAr: 'ألم صدر، نهجان، كحة' },
          { id: 'abdomen_gi', icon: '🦠', titleAr: 'البطن، المعدة، والقولون', subAr: 'مغص، جنب، حموضة' },
          { id: 'pelvis_urinary', icon: '🧪', titleAr: 'الكلى، البول، والحوض', subAr: 'مغص كلوي، لون البول' },
          { id: 'back_joints', icon: '🦴', titleAr: 'الظهر، المفاصل، والأطراف', subAr: 'غضروف، نقرس، ركبة' },
          { id: 'skin_general', icon: '🩹', titleAr: 'الجلد والطفح العام', subAr: 'فقاقيع، حزام ناري، حكة' },
        ].map((z) => {
          const sel = selectedZone === z.id;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => setSelectedZone(z.id as BodyZone)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #138866' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)' : '#ffffff',
                color: sel ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{z.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{z.titleAr}</div>
              <div style={{ fontSize: '0.75rem', opacity: sel ? 0.9 : 0.65 }}>{z.subAr}</div>
            </button>
          );
        })}
      </section>

      {/* Step 2: Matching Scenarios & Direct Clinic Routing */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0D1F38', margin: '0 0 12px' }}>
        🔍 الخطوة ٢: قارن وصف حالتك بالسيناريوهات الطبية التالية:
      </h2>
      <div style={{ display: 'grid', gap: '18px', marginBottom: '28px' }}>
        {zoneScenarios.map((sc) => {
          const isEr = sc.urgency === 'emergency_er';
          const isUrgent = sc.urgency === 'urgent_24h';
          const borderColor = isEr ? '#dc2626' : isUrgent ? '#d97706' : '#16a34a';
          const badgeBg = isEr ? '#fee2e2' : isUrgent ? '#fef3c7' : '#dcfce7';
          const badgeColor = isEr ? '#991b1b' : isUrgent ? '#92400e' : '#166534';
          const badgeLabel = isEr
            ? '🚨 طوارئ مستشفى فورية الآن!'
            : isUrgent
            ? '⚠️ كشف عاجل خلال 24 ساعة'
            : '🟢 كشف عيادة روتيني ورعاية منزلية';

          return (
            <article key={sc.id} className="card" style={{ borderRadius: '16px', padding: '20px', border: `2px solid ${borderColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <span style={{ background: badgeBg, color: badgeColor, fontWeight: 900, fontSize: '0.84rem', padding: '5px 14px', borderRadius: '20px' }}>
                  {badgeLabel}
                </span>
                <span style={{ background: '#f1f5f9', color: '#0D1F38', fontWeight: 800, fontSize: '0.82rem', padding: '4px 12px', borderRadius: '8px' }}>
                  👨‍⚕️ التخصص المطلوب: {sc.recommendedSpecialtyAr}
                </span>
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: '1.22rem', fontWeight: 900, color: '#0D1F38' }}>
                «{sc.symptomTitleAr}»
              </h3>
              <p className="small muted" style={{ margin: '0 0 12px', fontWeight: 700 }}>
                ➕ الأعراض المصاحبة: {sc.companionSignsAr}
              </p>

              <div style={{ background: 'var(--tint)', padding: '12px', borderRadius: '10px', marginBottom: '10px' }}>
                <b style={{ color: '#0D1F38', fontSize: '0.9rem' }}>🔬 الاحتمال الطبي الأقرب: </b>
                <span style={{ fontWeight: 800, color: borderColor, fontSize: '0.92rem' }}>{sc.possibleConditionAr}</span>
              </div>

              <div style={{ background: isEr ? '#fef2f2' : '#f0fdf4', padding: '12px', borderRadius: '10px', marginBottom: '14px', border: isEr ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                <b style={{ color: isEr ? '#991b1b' : '#166534', fontSize: '0.88rem', display: 'block', marginBottom: '2px' }}>
                  ⚡ التصرف السليم الآن:
                </b>
                <span className="small" style={{ color: '#1e293b', fontWeight: 700, lineHeight: 1.55 }}>{sc.firstActionAr}</span>
              </div>

              <Link
                to={sc.targetClinicLink}
                className="btn small"
                style={{
                  background: '#0D1F38',
                  color: '#ffffff',
                  fontWeight: 800,
                  textDecoration: 'none',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🏥 انتقل مباشرة إلى: {sc.targetClinicNameAr}</span>
                <span>{isAr ? '←' : '→'}</span>
              </Link>
            </article>
          );
        })}
      </div>

      <Disclaimer />
    </main>
  );
}
