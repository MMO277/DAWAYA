import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type LabTab = 'interactive_decoder' | 'fasting_rules' | 'drug_interference' | 'urine_stool' | 'female_hormones' | 'critical_values';

export default function LabTestDecoderClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<LabTab>('interactive_decoder');

  // Interactive Lab Inputs
  const [hbVal, setHbVal] = useState('11.2');
  const [ferritinVal, setFerritinVal] = useState('18');
  const [tshVal, setTshVal] = useState('5.8');
  const [vitdVal, setVitdVal] = useState('16');

  const labResults = useMemo(() => {
    const hb = parseFloat(hbVal) || 12;
    const fer = parseFloat(ferritinVal) || 30;
    const tsh = parseFloat(tshVal) || 2.5;
    const vd = parseFloat(vitdVal) || 30;

    return {
      hbNote:
        hb < 7
          ? '🚨 أنيميا حادة حرجة (تستلزم تقييم مستشفى فوري)'
          : hb < 11.5
          ? '🟡 أنيميا نقص هيموجلوبين (تحتاج علاج حديد ومعرفة السبب)'
          : '🟢 نسبة هيموجلوبين طبيعية ممتازة',
      ferNote:
        fer < 15
          ? '🔴 نضوب شديد في مخزون الحديد (السبب الأول لسقوط الشعر والإرهاق والدوخة حتى لو الهيموجلوبين طبيعي!)'
          : fer < 30
          ? '🟡 مخزون حديد دون المثالي (يحتاج كورس حديد لمدة 3 أشهر لرفعه فوق 50)'
          : '🟢 مخزون حديد مثالي',
      tshNote:
        tsh > 4.5
          ? '🔴 ارتفاع TSH: يشير لـ «كسل وخمول الغدة الدرقية» (يسبب زيادة الوزن، الخمول، الإمساك، والشعور بالبرد)'
          : tsh < 0.4
          ? '🔴 انخفاض TSH: يشير لـ «فرط نشاط الغدة الدرقية» (يسبب خفقان القلب، العصبية، ونقص الوزن)'
          : '🟢 وظيفة غدة درقية طبيعية ومثالية (0.4 - 4.5 mIU/L)',
      vdNote:
        vd < 20
          ? '🔴 نقص شديد في فيتامين د (يسبب آلام العظام والعضلات والاكتئاب وضعف المناعة - يحتاج جرعة تعويضية)'
          : vd < 30
          ? '🟡 قصور متوسط في فيتامين د (يحتاج جرعة وقائية يومية)'
          : '🟢 مستوى فيتامين د مثالي (30 - 100 ng/mL)',
    };
  }, [hbVal, ferritinVal, tshVal, vitdVal]);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e40af 55%, #3b82f6 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#dbeafe' }}>
            🔬 {tr(lang, 'عيادة واستشاري الباثولوجيا الإكلينيكية والتحاليل الطبية (خبرة 40 عاماً)', 'Senior Clinical Pathology & Lab Medicine Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (14 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة ترجمة وقراءة التحاليل الطبية وشروط السحب الصحيحة', 'Smart Lab Test Decoder & Pre-Test Preparation Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'مترجم أرقام التحاليل الفوري، عدد ساعات الصيام الدقيقة لكل تحليل، الأدوية والفيتامينات التي تزيف نتائج المعمل، وشروط مسحات ومزارع البول والهرمونات.',
            'Instant lab value interpreter, fasting hours guide, drug-lab interference radar, and urine/hormone sampling rules.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'interactive_decoder', icon: '🔢', titleAr: '١. مترجم أرقام التحاليل', subAr: 'الأنيميا، الفيريتين، الغدة، د' },
          { id: 'fasting_rules', icon: '⏱️', titleAr: '٢. ساعات الصيام وشرب الماء', subAr: 'السكر، الدهون، والحديد' },
          { id: 'drug_interference', icon: '💊', titleAr: '٣. أدوية تزيف التحاليل', subAr: 'خدعة البيوتين والكورتيزون' },
          { id: 'urine_stool', icon: '🧪', titleAr: '٤. شروط مزرعة البول والبراز', subAr: 'منع تلوث العينة والنتيجة الغلط' },
          { id: 'female_hormones', icon: '🌸', titleAr: '٥. جدول أيام تحاليل الهرمونات', subAr: 'اليوم 3 واليوم 21 من الدورة' },
          { id: 'critical_values', icon: '🚨', titleAr: '٦. أرقام الخطر في التحاليل', subAr: 'البوتاسيوم، السيولة والصفائح' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as LabTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #2563eb' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #2563eb 100%)' : '#ffffff',
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

      {activeTab === 'interactive_decoder' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🔢 مترجم أرقام التحاليل التفاعلي الفوري
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>١. الهيموجلوبين (Hemoglobin - g/dL):</label>
              <input type="number" step="0.1" value={hbVal} onChange={(e) => setHbVal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800, marginBottom: '8px' }} />
              <div className="small" style={{ fontWeight: 700, color: '#0f172a' }}>{labResults.hbNote}</div>
            </div>

            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>٢. مخزون الحديد (Serum Ferritin - ng/mL):</label>
              <input type="number" step="1" value={ferritinVal} onChange={(e) => setFerritinVal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800, marginBottom: '8px' }} />
              <div className="small" style={{ fontWeight: 700, color: '#0f172a' }}>{labResults.ferNote}</div>
            </div>

            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>٣. هرمون الغدة الدرقية (TSH - mIU/L):</label>
              <input type="number" step="0.1" value={tshVal} onChange={(e) => setTshVal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800, marginBottom: '8px' }} />
              <div className="small" style={{ fontWeight: 700, color: '#0f172a' }}>{labResults.tshNote}</div>
            </div>

            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>٤. فيتامين د (25-OH Vitamin D - ng/mL):</label>
              <input type="number" step="1" value={vitdVal} onChange={(e) => setVitdVal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800, marginBottom: '8px' }} />
              <div className="small" style={{ fontWeight: 700, color: '#0f172a' }}>{labResults.vdNote}</div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'fasting_rules' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            ⏱️ دستور الصيام الصحيح قبل التحاليل الطبية (هل شرب الماء يفطر في التحليل؟)
          </h2>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
            <b style={{ color: '#166534' }}>✅ مفاجأة طبية: شرب الماء العادي الصافي مسموح ومطلوب أثناء صيام التحاليل!</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 700 }}>
              الصيام الطبي يعني الامتناع عن الطعام والشاي والقهوة واللبان والتدخين، أما **شرب الماء العادي فمسموح تماماً** لأنه يمنع الجفاف ويُظهر الأوردة بوضوح لسهولة سحب العينة!
            </p>
          </div>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700 }}>
            <li>**تحليل السكر الصائم (Fasting Blood Sugar):** صيام من **8 إلى 10 ساعات** (لا تصم أكثر من 12 ساعة لأن الكبد يبدأ في تكسير الجليكوجين ويرفع السكر ذاتياً!).</li>
            <li>**تحليل الدهون الكاملة والدهون الثلاثية (Lipid Profile):** صيام من **12 إلى 14 ساعة** كاملة.</li>
            <li>**تحليل الحديد بالدم (Serum Iron):** يُسحب صباحاً مع صيام 8 ساعات، والتوقف عن كبسولات الحديد قبل التحليل بـ 48 ساعة.</li>
            <li>**التحاليل التي لا تحتاج صياماً نهائياً:** السكر التراكمي (HbA1c)، صورة الدم الكاملة (CBC)، وظائف الكلى والكبد، فيتامين د، ومخزون الحديد (Ferritin).</li>
          </ul>
        </section>
      )}

      {activeTab === 'drug_interference' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            💊 4 فيتامينات وأدوية تزيّف نتائج المعمل وتخرج أرقاماً خاطئة!
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
              ١. فيتامين الشعر والأظافر المحتوي على «البيوتين (Biotin / Vitamin B7)»: البيوتين يتفاعل مع أجهزة المعمل الكيميائية فيُظهر تحليل الغدة الدرقية (TSH) وكأن لديك نشاطاً حاداً كاذباً، ويُفسد تحليل إنزيمات القلب (Troponin)! يجب إيقاف البيوتين قبل سحب الدم بـ **72 ساعة (3 أيام)**.
            </div>
            <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#92400e' }}>
              ٢. أدوية المعدة والمضادات الحيوية قبل تحليل جرثومة المعدة: يجب إيقافها **14 يوماً كاملة** قبل تحليل البراز أو النفس.
            </div>
            <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#92400e' }}>
              ٣. حقن وأقراص الكورتيزون: ترفع كرات الدم البيضاء (WBCs) في صورة الدم وكأن هناك صديداً، وترفع مستوى السكر في الدم.
            </div>
          </div>
        </section>
      )}

      {activeTab === 'urine_stool' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🧪 شروط عينة «مزرعة البول» الصحيحة لمنع تلوث العينة ببكتيريا الجلد
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • يجب إيقاف أي مضاد حيوي لمدة **48 إلى 72 ساعة** قبل عمل المزرعة.<br />
            • اغسل المنطقة بالماء والصابون وجففها بمناديل نظيفة، ثم **تخلص من أول قطرات البول في المرحاض، واجمع «وسط مجرى البول (Mid-Stream Urine)»** داخل الكوب المعقم دون لمس الكوب من الداخل، وسلمها للمعمل خلال ساعة واحدة.
          </p>
        </section>
      )}

      {activeTab === 'female_hormones' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🌸 جدول الأيام المحددة لتحاليل هرمونات الخصوبة وتكيس المبايض للسيدات
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700 }}>
            <li>**تحليل FSH, LH, Estradiol (E2):** يُسحب حصرياً في **اليوم الثاني أو الثالث من نزول الدورة الشهرية** صباحاً.</li>
            <li>**تحليل التبويض (Progesterone):** يُسحب في **اليوم الـ 21 من بداية الدورة** (أو قبل موعد الدورة القادمة بـ 7 أيام).</li>
            <li>**تحليل هرمون الحليب (Prolactin):** يُسحب صباحاً بعد الاستيقاظ بـ 3 ساعات مع تجنب التوتر أو لمس الثدي أو الجماع في الليلة السابقة.</li>
            <li>**تحليل مخزون المبيض (AMH):** يمكن سحبه في **أي يوم من أيام الشهر** ولا يتأثر بالدورة أو الصيام.</li>
          </ul>
        </section>
      )}

      {activeTab === 'critical_values' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', background: '#fef2f2', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🚨 أرقام طوارئ في ورقة التحاليل تستلزم الاتصال بالطبيب أو المستشفى فوراً
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700, color: '#7f1d1d' }}>
            <li>**سيولة الدم (INR) أعلى من 4.5 أو 5.0:** خطر نزيف داخلي لمريض الماريفان يستلزم وقف الجرعة ومراجعة الطبيب فوراً.</li>
            <li>**بوتاسيوم الدم (Potassium K+) أعلى من 6.0 أو أقل من 2.8:** خطر مباشر على انتظام كهرباء القلب.</li>
            <li>**صفائح الدم (Platelets) أقل من 30,000:** خطر نزيف تلقائي يستوجب فحص أمراض دم عاجل.</li>
          </ul>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
