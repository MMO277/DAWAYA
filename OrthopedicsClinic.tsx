import SmartMedDoseReminderBadge from './SmartMedDoseReminderBadge';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type OrthoTab = 'spine_sciatica' | 'gout_crystals' | 'knee_oa' | 'nsaids_safety' | 'sprain_price' | 'vitd_calcium';

export const SPINE_COMPARISON = [
  {
    typeAr: 'ألم أسفل الظهر العضلي والميكانيكي (Mechanical Muscle Strain)',
    typeEn: 'Mechanical Lumbar Muscle Strain',
    badgeAr: '🟢 شائع وغير مقلق عصبياً (85% من الحالات)',
    color: '#16a34a',
    bg: '#f0fdf4',
    symptomsAr: 'ألم متركز في أسفل الظهر فقط، يزيد مع الوقوف الطويل أو الانحناء المفاجئ، يتحسن بالراحة والكمادات الدافئة، ولا ينزل لكعب القدم ولا يسبب تنميلاً.',
    treatmentAr: 'لا تلزم الفراش أكثر من 48 ساعة! الحركة الخفيفة والمشي يسرعان الشفاء + كمادات دافئة + باسط عضلات مسائي (مثل سيردالود أو ميولجين أو ديمرا) لمدة 5 أيام + باراسيتامول.',
  },
  {
    typeAr: 'الانزلاق الغضروفي وعرق النسا (Herniated Disc & Sciatica)',
    typeEn: 'Lumbar Disc Herniation & Radiculopathy (Sciatica)',
    badgeAr: '🟡 يحتاج تقييم وعلاج طبيعي دوائي',
    color: '#d97706',
    bg: '#fffbeb',
    symptomsAr: 'ألم حاد كالكهرباء أو السيخ الساخن يبدأ من المقعدة ويمتد خلف الفخذ والسمانة حتى أصابع القدم، يزداد مع الكحة أو العطس أو الجلوس، ويصاحبه تنميل أو شكشكة.',
    treatmentAr: 'تجنب حمل الأوزان والانحناء تماماً، النوم على الجانب بمخدة بين الركبتين، مضاد التهاب عصبي وفيتامين ب12 النشط (ميثيل تكنو / ميلجا أدفانس) بإشراف طبيب العظام + جلسات علاج طبيعي.',
  },
  {
    typeAr: 'متلازمة ذيل الفرس (Cauda Equina Syndrome - طوارئ جراحية!)',
    typeEn: 'Cauda Equina Syndrome (Neurosurgical Emergency!)',
    badgeAr: '🚨 طوارئ مخ وأعصاب خلال 24 ساعة!',
    color: '#dc2626',
    bg: '#fef2f2',
    symptomsAr: 'علامات الخطر القصوى: (1) سقوط مشط القدم أثناء المشي وعدم القدرة على الوقوف على الكعب، (2) تنميل وفقدان إحساس في منطقة السرج (حول الشرج والأعضاء التناسلية)، (3) احتباس البول أو عدم التحكم في البول أو البراز.',
    treatmentAr: 'توجه لطوارئ جراحة المخ والأعصاب فوراً لإجراء رنين مغناطيسي عاجل وإزالة ضغط الغضروف خلال ساعات لمنع الشلل الدائم.',
  },
];

export const CRYSTALS_GUIDE = [
  {
    id: 'uric-acid-gout',
    nameAr: 'النقرس وأملاح اليورات (Uric Acid & Urate Crystals)',
    nameEn: 'Gout & Uric Acid Crystals',
    color: '#dc2626',
    symptomsAr: 'التهاب حاد، احمرار، سخونة، وتورم شديد ومفاجئ في مفصل إصبع القدم الأكبر (يوقظ المريض من النوم لا يتحمل لمس غطاء السرير!) أو وجع في الكعبين والركبة.',
    forbiddenFoodsAr: '⛔ الممنوعات: اللحوم الحمراء الضاني والكبدة والكلاوي، البط والحمام، الفول المدمس والطعمية بكثرة، السردين والرنجة والأنشوجة، الشوربة الدسمة، والمياه الغازية المحلاة بالفركتوز.',
    allowedAndEffervescentAr: '✅ الفوار والعلاج الصحيح: فوار يوروسولفين (Urosolvin) أو فوار يوريفين (Urivin) قبل الأكل مع كوب ماء كبير لجعل البول قلوياً وإذابة اليورات + شرب 3 لتر ماء وبقدونس وكرفس وكرز.',
    consultantTipAr: 'خطأ قاتل شائع في مصر: مريض يدخل بنوبة نقرس حادة وصباعه وارم وأحمر، فيروح ياخد زيلوريك (Zyloric) أو فيبيوريك (Feburic) من نفسه! أدوية خفض اليوريك أسيد ممنوع تبدأ أثناء النوبة الحادة لأنها بتحرك الكريستالات وتزود الوجع أضعاف! نهدي الالتهاب الأول بالكولشيسين والمسكن وبعدين نبدأ الزيلوريك.',
  },
  {
    id: 'calcium-oxalate',
    nameAr: 'أملاح الأوكسالات (Calcium Oxalate Crystals)',
    nameEn: 'Calcium Oxalate Crystals',
    color: '#d97706',
    symptomsAr: 'حرقان شديد في البول، مغص كلوي في الجنب والظهر يسمّع في أسفل البطن، وتغير لون البول أو وجود رمل محمر.',
    forbiddenFoodsAr: '⛔ الممنوعات: المانجو، الطماطم والصلصة المسبكة، الفراولة، السبانخ، الملوخية، الشوكولاتة والكاكاو، الشاي الأسود الثقيل، والمكسرات المالحة.',
    allowedAndEffervescentAr: '✅ الفوار الصحيح: فوار إبيماج (Epimag) أو سترات البوتاسيوم والماغنسيوم قبل الأكل في نصف كوب ماء (يرتبط بالأوكسالات في الأمعاء ويمنع تكوين حصوات الكلى) + عصير ليمون طبيعي.',
    consultantTipAr: 'أوعى تاخد فوار يوروسولفين لو أملاحك أوكسالات! كل نوع أملاح في تحليل البول ليه الفوار والأكل المخصص ليه.',
  },
  {
    id: 'phosphate-crystals',
    nameAr: 'أملاح الفوسفات الجيرية (Amorphous Phosphates)',
    nameEn: 'Phosphate Crystals (Alkaline Urine)',
    color: '#0284c7',
    symptomsAr: 'بول عكر أبيض كالجير أو اللبن في نهاية التبول مع ثقل في الجانبين (تتكون في البول القلوي).',
    forbiddenFoodsAr: '⛔ التقليل من: الإفراط في الألبان والجبن المملح والمياه الغازية.',
    allowedAndEffervescentAr: '✅ الفوار الصحيح: فوار فيتامين C الفوار (أقراص فيتاسيد C) أو عصير البرتقال والليمون والتوت البري (Cranberry) لزيادة حمضية البول وإذابة الفوسفات.',
    consultantTipAr: 'البول العكر الأبيض غالباً بيكون أملاح فوسفات بتدوب فوراً لما نخلي البول حامضي بعصير الليمون وفيتامين سي.',
  },
];

export const KNEE_EXERCISES_AND_RULES = [
  {
    titleAr: '١. تمرين تقوية العضلة الأمامية الفخذية (Quadriceps Isometric Set)',
    descAr: 'اجلس على السرير وافرد ساقك تماماً، ضع فوطة ملفوفة تحت ركبتك، واضغط بركبتك لأسفل على الفوطة مع شد مشط القدم نحوك لمدة 10 ثوانٍ ثم استرخِ. كرر 15 مرة صباحاً ومساءً. (العضلة الأمامية القوية تشيل 40% من الحمل عن غضروف الركبة!).',
  },
  {
    titleAr: '٢. قاعدة الوزن الذهبية (كل كيلو زيادة = 4 كيلو على الركبة)',
    descAr: 'أثناء المشي ونزول السلم، يتحمل مفصل الركبة 4 أضعاف وزن الجسم! إنقاص 5 كيلوجرامات فقط من وزنك يرفع حملاً قدره 20 كيلوجراماً عن غضروف ركبتيك في كل خطوة.',
  },
  {
    titleAr: '٣. الممنوعات الحركية لمريض خشونة الركبة',
    descAr: 'تجنب الجلوس في وضع القرفصاء (التورك)، تجنب تربيع الرجلين على الأرض، تجنب الكراسي المنخفضة جداً، والصلاة على كرسي عند وجود ارتشاح أو ألم حاد في الركبة.',
  },
  {
    titleAr: '٤. الكمادات: متى تكون دافئة ومتى تكون باردة؟',
    descAr: 'إذا كانت الركبة ساخنة ومتورمة وفيها ارتشاح مائي: استخدم كمادات ثلج ملفوفة بفوطة لمدة 15 دقيقة. أما إذا كانت الركبة متيبسة وبدون تورم (تيبس الصباح): استخدم كمادات ماء دافئ.',
  },
];

export default function OrthopedicsClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<OrthoTab>('spine_sciatica');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #92400e 55%, #d97706 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#fef3c7' }}>
            🦴 {tr(lang, 'عيادة واستشاري العظام والعمود الفقري والروماتيزم (خبرة 40 عاماً)', 'Senior Orthopedics, Spine & Rheumatology Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة العظام والمفاصل والعمود الفقري والنقرس الشاملة', 'Complete Orthopedics, Spine, Osteoarthritis & Gout Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'التشخيص التفريقي لآلام الظهر وعرق النسا، خريطة النقرس والأملاح والفوارات، بروتوكول خشونة الركبة، قواعد حماية الكلى والمعدة من المسكنات، وإسعاف الكدمات والالتواء.',
            'Comprehensive orthopedic management: sciatica vs. back strain, gout & crystal effervescents, knee OA exercises, NSAID renal/gastric safety, and sprain first-aid.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'spine_sciatica', icon: '⚡', titleAr: '١. الظهر وعرق النسا', subAr: 'الشد العضلي مقابل الغضروف' },
          { id: 'gout_crystals', icon: '🦶', titleAr: '٢. النقرس والأملاح', subAr: 'اليورات، الأوكسالات والفوارات' },
          { id: 'knee_oa', icon: '🦵', titleAr: '٣. خشونة الركبة', subAr: 'تمارين التقوية وحماية المفصل' },
          { id: 'nsaids_safety', icon: '🛡️', titleAr: '٤. أمان مسكنات العظام', subAr: 'حماية الكلى والمعدة والضغط' },
          { id: 'sprain_price', icon: '🧊', titleAr: '٥. إسعاف الالتواء والكدمات', subAr: 'بروتوكول PRICE والرباط الضاغط' },
          { id: 'vitd_calcium', icon: '☀️', titleAr: '٦. فيتامين د والهشاشة', subAr: 'الجرعات الصحيحة وتقوية العظم' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as OrthoTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #d97706' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #b45309 100%)' : '#ffffff',
                color: sel ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{t.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{t.titleAr}</div>
              <div style={{ fontSize: '0.75rem', opacity: sel ? 0.9 : 0.65 }}>{t.subAr}</div>
            </button>
          );
        })}
      </section>

      {activeTab === 'spine_sciatica' && (
        <section style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
          {SPINE_COMPARISON.map((sp, idx) => (
            <div key={idx} className="card" style={{ borderRadius: '16px', padding: '20px', background: sp.bg, border: `2px solid ${sp.color}` }}>
              <span style={{ background: '#ffffff', color: sp.color, fontWeight: 900, fontSize: '0.82rem', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '8px' }}>
                {sp.badgeAr}
              </span>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 900, color: '#0D1F38' }}>{sp.typeAr}</h3>
              <p className="small" style={{ margin: '0 0 10px', color: '#1e293b', fontWeight: 600, lineHeight: 1.55 }}>
                <b>🔍 الأعراض المميزة: </b>{sp.symptomsAr}
              </p>
              <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <b style={{ color: '#0D1F38', fontSize: '0.88rem', display: 'block', marginBottom: '4px' }}>🩺 خطة التصرف والعلاج السليم:</b>
                <span className="small" style={{ color: '#334155', fontWeight: 600, lineHeight: 1.5 }}>{sp.treatmentAr}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'gout_crystals' && (
        <section style={{ display: 'grid', gap: '18px', marginBottom: '28px' }}>
          {CRYSTALS_GUIDE.map((cr) => (
            <div key={cr.id} className="card" style={{ borderRadius: '16px', padding: '20px', borderTop: `5px solid ${cr.color}` }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 900, color: '#0D1F38' }}>{cr.nameAr}</h3>
              <p className="small" style={{ margin: '0 0 10px', fontWeight: 600, color: '#334155' }}><b>الأعراض: </b>{cr.symptomsAr}</p>
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '10px', color: '#991b1b', fontSize: '0.88rem', fontWeight: 700 }}>
                {cr.forbiddenFoodsAr}
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '10px', color: '#14532d', fontSize: '0.88rem', fontWeight: 700 }}>
                {cr.allowedAndEffervescentAr}
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', borderRight: '4px solid #0D1F38', fontSize: '0.85rem', fontStyle: 'italic' }}>
                💬 <b>نصيحة الاستشاري: </b>«{cr.consultantTipAr}»
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'knee_oa' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🦵 بروتوكول خشونة الركبة وتقوية العضلات بدون جراحة
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {KNEE_EXERCISES_AND_RULES.map((kn, i) => (
              <div key={i} style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                <b style={{ color: '#b45309', fontSize: '0.95rem', display: 'block', marginBottom: '6px' }}>{kn.titleAr}</b>
                <p className="small" style={{ margin: 0, color: '#1e293b', lineHeight: 1.55, fontWeight: 600 }}>{kn.descAr}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'nsaids_safety' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🛡️ القواعد الذهبية لحماية الكلى والمعدة والقلب من مسكنات العظام (NSAIDs)
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
              <b style={{ color: '#991b1b' }}>١. ممنوع الجمع بين مسكنين في نفس الوقت!</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 600 }}>
                أخذ حقنة فولتارين مع قرص كتافلام أو بروفين في نفس اليوم لا يضاعف التسكين، بل يضاعف خطر ثقب ونزيف المعدة والفشل الكلوي الحاد 10 أضعاف!
              </p>
            </div>
            <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <b style={{ color: '#92400e' }}>٢. المسكنات الانتقائية الألطف على المعدة (COX-2 Selective):</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#78350f', fontWeight: 600 }}>
                لمرضى قرحة المعدة: يُفضل استخدام السيليكوكسيب (أركوكسيا / سيليبريكس / يوروكوكس) بعد استشارة الطبيب مع قرص وقاية للمعدة صباحاً (مثل أوميبرازول أو بانتوبرازول)، مع الحذر لمرضى القلب والضغط غير المنتظم.
              </p>
            </div>
            <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <b style={{ color: '#166534' }}>٣. الدهانات الموضعية والباراسيتامول لكبار السن ومرضى الكلى:</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 600 }}>
                لكبار السن ومرضى القصور الكلوي أو الضغط: اعتمد على الجل الموضعي (فولتارين جل / ريبال جل) + أقراص الباراسيتامول (نوفالدول / بنادول جوينت) ومكملات الكولاجين والجلوكوزامين الآمنة على الكلى.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'sprain_price' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🧊 بروتوكول إنقاذ التواء الكاحل والكدمات الحادة في أول 48 ساعة (قاعدة PRICE)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            {[
              { step: 'P - Protection (الحماية)', desc: 'توقف عن المشي على القدم المصابة فوراً لمنع تحول التمزق الجزئي في الأربطة إلى قطع كامل.' },
              { step: 'R - Rest (الراحة)', desc: 'إراحة المفصل تماماً أول 48 ساعة وتجنب التدليك العنيف أو "طقّ المفصل" الشعبي الكارثي!' },
              { step: 'I - Ice (الثلج)', desc: 'كمادات ثلج ملفوفة بفوطة لمدة 15 دقيقة كل 3 ساعات في أول يومين لغلق الشعيرات النازفة ومنع التورم (ممنوع الماء الساخن أول 48 ساعة!).' },
              { step: 'C & E - Compression & Elevation', desc: 'رباط ضاغط خفيف (يفك أثناء النوم) + رفع القدم على مخدتين أعلى من مستوى القلب لتصريف التورم + أقراص ألفينترن قبل الأكل بساعة.' },
            ].map((s, idx) => (
              <div key={idx} style={{ background: 'var(--tint)', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                <b style={{ color: '#0284c7', display: 'block', marginBottom: '4px' }}>{s.step}</b>
                <span className="small" style={{ color: '#334155', fontWeight: 600 }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'vitd_calcium' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            ☀️ دستور فيتامين د3، الكالسيوم، وفيتامين K2 لتقوية العظام ومنع الهشاشة
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <b style={{ color: '#166534' }}>١. كيف تأخذ فيتامين د3 ليُمتص بنسبة 100%؟</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 600 }}>
                فيتامين د مذاب في الدهون! إذا أخذت الكبسولة على معدة فارغة أو مع الماء فقط لن يُمتص؛ يجب أخذه وسط أو بعد وجبة الغداء المحتوية على دهون صحية (زيت زيتون، بيض، سمك، أو زبادي).
              </p>
            </div>
            <div style={{ background: 'var(--tint)', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <b style={{ color: '#0D1F38' }}>٢. دور الماغنسيوم وفيتامين K2:</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#334155', fontWeight: 600 }}>
                الماغنسيوم ينشط فيتامين د في الكبد والكلى، وفيتامين K2 يوجه الكالسيوم ليدخل في العظام والأسنان ويمنع ترسبه في جدران الشرايين أو الكلى.
              </p>
            </div>
          </div>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
