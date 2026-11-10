import SmartChoiceSelect from './SmartChoiceSelect';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type UroTab = 'egfr_calc' | 'renal_colic' | 'urine_color' | 'prostate_bph' | 'uti_women' | 'nephrotoxic_drugs';

export default function UrologyRenalClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<UroTab>('egfr_calc');

  // eGFR / CrCl inputs
  const [age, setAge] = useState('55');
  const [weight, setWeight] = useState('80');
  const [creatinine, setCreatinine] = useState('1.4');
  const [sex, setSex] = useState<'male' | 'female'>('male');

  const renalResult = useMemo(() => {
    const a = parseFloat(age) || 50;
    const w = parseFloat(weight) || 75;
    const cr = Math.max(0.4, parseFloat(creatinine) || 1.0);

    // Cockcroft-Gault CrCl formula: ((140 - age) * weight) / (72 * SCr) * (0.85 if female)
    let crCl = ((140 - a) * w) / (72 * cr);
    if (sex === 'female') crCl *= 0.85;
    const rounded = Math.round(crCl);

    let stageAr = '🟢 المرحلة الأولى (كفاءة كلى طبيعية تماماً ≥ 90)';
    let doseAdviceAr = 'لا تحتاج لتخفيض جرعات الأدوية المعتادة، مع الحفاظ على شرب الماء وتجنب المسكنات العشوائية.';
    let color = '#16a34a';

    if (rounded >= 60 && rounded < 90) {
      stageAr = '🟢 المرحلة الثانية (انخفاض طفيف 60 - 89 mL/min)';
      doseAdviceAr = 'كفاءة جيدة؛ تجنب مسكنات العظام (NSAIDs) وصبغات الأشعة بدون تحضير.';
      color = '#0284c7';
    } else if (rounded >= 30 && rounded < 60) {
      stageAr = '🟡 المرحلة الثالثة (قصور كلوي متوسط 30 - 59 mL/min)';
      doseAdviceAr = '⚠️ يجب تخفيض جرعات المضادات الحيوية التي تخرج عن طريق الكلى (مثل أوجمنتين، سيبروفلوكساسين، ليفوفلوكساسين) وضبط جرعة الميتفورمين (سيدوفاج) وممنوع الفولتارين والكتافلام نهائياً!';
      color = '#d97706';
    } else if (rounded < 30) {
      stageAr = '🔴 المرحلة الرابعة/الخامسة (قصور كلوي متقدم < 30 mL/min)';
      doseAdviceAr = '🚨 يمنع تناول أي دواء أو مكمل أو فوار بدون مراجعة استشاري الكلى! معظم المضادات وأدوية السكر والسيولة تحتاج تعديلاً جذرياً في الجرعة.';
      color = '#dc2626';
    }

    return { rounded, stageAr, doseAdviceAr, color };
  }, [age, weight, creatinine, sex]);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #b45309 55%, #f59e0b 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#fef3c7' }}>
            🧪 {tr(lang, 'عيادة واستشاري الكلى والمسالك البولية والبروستاتا (خبرة 40 عاماً)', 'Senior Nephrology & Urology Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (14 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة الكلى، المسالك البولية، الحصوات، والبروستاتا الشاملة', 'Complete Nephrology, Kidney Stones, UTI & Prostate Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'حاسبة معدل ترشيح الكلى وتعديل جرعات الأدوية، بروتوكول طرد حصوات الحالب والمغص الكلوي، مترجم ألوان البول، والأدوية الممنوعة لمرضى البروستاتا.',
            'CrCl/eGFR renal dose calculator, acute renal colic stone expulsion protocol, urine color decoder, and prostate medication safety.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'egfr_calc', icon: '🧮', titleAr: '١. حاسبة كفاءة الكلى (CrCl)', subAr: 'تعديل جرعات الأدوية بالكرياتينين' },
          { id: 'renal_colic', icon: '🪨', titleAr: '٢. المغص الكلوي والحصوات', subAr: 'متى تنزل الحصوة ومتى تحتاج منظار؟' },
          { id: 'urine_color', icon: '🎨', titleAr: '٣. مترجم ألوان البول الطبي', subAr: 'المدمم، الرغوي، والبرتقالي الدوائي' },
          { id: 'prostate_bph', icon: '👴', titleAr: '٤. تضخم البروستاتا لكبار السن', subAr: 'أدوية البرد التي تحبس البول!' },
          { id: 'uti_women', icon: '🦠', titleAr: '٥. التهابات البول المتكررة', subAr: 'الوقاية والعلاج الآمن للسيدات' },
          { id: 'nephrotoxic_drugs', icon: '⛔', titleAr: '٦. الأدوية السامة للكلى', subAr: 'الثالوث القاتل للكلى والصبغات' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as UroTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #d97706' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #d97706 100%)' : '#ffffff',
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

      {activeTab === 'egfr_calc' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🧮 حاسبة تصفية الكرياتينين وكفاءة الكلى (Cockcroft-Gault CrCl) لتعديل جرعات الأدوية
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>السن (بالسنوات):</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>الوزن (كجم):</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>تحليل الكرياتينين بالدم (Serum Creatinine):</label>
              <input type="number" step="0.1" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>النوع:</label>
              <SmartChoiceSelect
                value={sex}
                onChange={(val) => setSex(val as any)}
                modalTitle="👤 اختر النوع لحساب كفاءة الكلى"
                options={[
                  { value: 'male', icon: '👨', label: 'ذكر (Male)', description: 'معامل Cockcroft-Gault القياسي للرجال (1.0)' },
                  { value: 'female', icon: '👩', label: 'أنثى (Female)', description: 'معامل الكتلة العضلية للسيدات (× 0.85)' },
                ]}
              />
            </div>
          </div>
          <div style={{ background: 'var(--tint)', padding: '18px', borderRadius: '14px', border: `2px solid ${renalResult.color}` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: renalResult.color, marginBottom: '6px' }}>
              معدل تصفية الكلى التقريبي: {renalResult.rounded} مل/دقيقة (mL/min)
            </div>
            <b style={{ display: 'block', marginBottom: '6px', color: '#0D1F38' }}>{renalResult.stageAr}</b>
            <p className="small" style={{ margin: 0, fontWeight: 700, color: '#334155', lineHeight: 1.6 }}>{renalResult.doseAdviceAr}</p>
          </div>
        </section>
      )}

      {activeTab === 'renal_colic' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🪨 بروتوكول المغص الكلوي الحاد وطرد حصوات الحالب
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **متى تنزل حصوة الحالب بدون عملية؟** الحصوات التي يقل حجمها عن **5 إلى 6 ملم** تنزل تلقائياً بنسبة 85% خلال أسبوعين باستخدام **العلاج الطارد للحصوات (Medical Expulsive Therapy)**: كبسولة موسعة لعضلات الحالب السفلية مساءً (تامسولين Tamsulin / أومنيك Omnic) + نقط رواتينكس (Rowatinex) قبل الأكل + شرب 3 لتر ماء والحركة ونط الحبل.<br />
            • **🚨 علامات الخطر الطارئة في حصوة الحالب (تستوجب مستشفى فوراً):** إذا صاحب المغص الكلوي **سخونة ورعشة عالية** (وجود صديد محبوس خلف الحصوة قد يسبب تسمم دم!)، أو توقف نزول البول تماماً لأكثر من 12 ساعة.
          </p>
        </section>
      )}

      {activeTab === 'urine_color' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🎨 مترجم ألوان ورغوة البول الطبي
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700 }}>
            <li>**بول برتقالي محمر بعد أخذ دواء:** تسببه أدوية شهيرة بشكل طبيعي وغير مقلق مثل مضاد **ريفامبيسين** أو مطهر البول **فينازوبيريدين (أوريكس)** أو أكل البنجر (الشمندر).</li>
            <li>**بول ذو رغوة بيضاء كثيفة ثابتة لا تختفي (شبه رغوة الصابون):** علامة هامة جداً على **«زلال البول (Proteinuria)»** خاصة لمرضى السكر والضغط والحوامل — يستلزم تحليل نسبة الزلال للكرياتينين في البول (ACR).</li>
            <li>**بول بلون الشاي الغامق أو الكوكاكولا:** يشير لصفراء انسدادية بالكبد أو تكسير حاد في الدم (أنيميا الفول) أو التهاب كبيبات الكلى.</li>
            <li>**بول أحمر مدمم بدون ألم نهائياً في كبار السن والمدخنين:** علامة إنذار مبكرة تستلزم سونار ومنظار مثانة فوراً.</li>
          </ul>
        </section>
      )}

      {activeTab === 'prostate_bph' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            👴 تحذير خطير لكبار السن ومرضى تضخم البروستاتا: أدوية البرد التي تحبس البول فوراً!
          </h2>
          <p className="small" style={{ color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
            إذا كان الوالد أو الجد يعاني من تضخم البروستاتا الحميد، فإياك أن تعطيه **أقراص البرد والرشح المحتوية على مضادات الهيستامين من الجيل الأول ومزيلات الاحتقان (مثل كونجستال، كومتركس، باور كابس، فلوستات، ترايمد فلو) أو مضادات المغص (بسكوبان)!**<br />
            🔬 **السبب العلمي:** هذه الأدوية تغلق عنق المثانة البولية وتشل عضلة المثانة، فيحدث للرجل المسن **«احتباس بولي حاد ومفاجئ (Acute Urinary Retention)»** في نفس الليلة ويضطر لتركيب قسطرة بولية في الطوارئ!
          </p>
        </section>
      )}

      {activeTab === 'uti_women' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🦠 بروتوكول الوقاية والعلاج من التهابات مجرى البول المتكررة للسيدات
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **أهم 3 قواعد لمنع تكرار صديد البول:** (١) التشطيف والتجفيف دائماً من الأمام إلى الخلف (وليس العكس) لمنع انتقال بكتيريا الإيكولاي (E. coli) لمجرى البول، (٢) عدم حبس البول لأكثر من 3 ساعات، (٣) استخدام أكياس التوت البري والدي-مانوز (Cranberry + D-Mannose) التي تمنع التصاق البكتيريا بجدار المثانة.
          </p>
        </section>
      )}

      {activeTab === 'nephrotoxic_drugs' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', background: '#fef2f2', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            ⛔ «الضربة الثلاثية القاتلة للكلى (Triple Whammy)» التي تدمر الكلى السليمة!
          </h2>
          <p className="small" style={{ color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
            الجمع بين **٣ أدوية معاً**: (١) دواء ضغط من عائلة ACEi/ARBs (مثل كابوتن، إيزابريل، تارج، أتاكاند) + (٢) مدر للبول (لازكس أو ناتريليكس) + (٣) مسكن عظام أو صداع (فولتارين، كتافلام، بروفين) — يغلق الشريان المغذي للكلية ويسبب فشلاً كلوياً حاداً خلال أيام خاصة في الصيف أو مع الجفاف!
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
