import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type GeriatricTab = 'bedsores_care' | 'fall_hip_prev' | 'dysphagia_choking' | 'alzheimer_delirium' | 'incontinence_care' | 'polypharmacy_beers';

export default function GeriatricCareClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<GeriatricTab>('bedsores_care');

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
            👴 {tr(lang, 'عيادة واستشاري طب المسنين والرعاية المنزلية (خبرة 40 عاماً)', 'Senior Geriatric Medicine & Home Care Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (20 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة رعاية المسنين، الوقاية من قرح الفراش، الزهايمر، ومنع الكسور', 'Complete Geriatric Care, Bedsore Prevention, Alzheimer’s & Fall Safety Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'الدليل العملي لرعاية الأجداد وكبار السن بالمنزل: منع وعلاج قرح الفراش، تأمين الحمام لمنع كسر مفصل الحوض، التعامل مع شرقة الماء، والزهايمر والهذيان المفاجئ.',
            'Comprehensive home care for seniors: pressure ulcer prevention & dressing, hip fracture fall proofing, dysphagia water choking, and dementia care.'
          )}
        </p>

        <div style={{ marginTop: '14px' }}>
          <Link to="/senior-pills" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '10px' }}>
            👵 فتح مساعد كبار السن بالصوت وفاحص شكل ولون الحبة
          </Link>
        </div>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'bedsores_care', icon: '🛏️', titleAr: '١. قرح الفراش والمرتبة الهوائية', subAr: 'قاعدة التقليب كل ساعتين والغيار' },
          { id: 'fall_hip_prev', icon: '🦴', titleAr: '٢. منع السقوط وكسر الحوض', subAr: 'تأمين الحمام وهبوط الوقوف' },
          { id: 'dysphagia_choking', icon: '🥤', titleAr: '٣. شرقة الماء وصعوبة البلع', subAr: 'حماية الرئة لمرضى الجلطات' },
          { id: 'alzheimer_delirium', icon: '🧠', titleAr: '٤. الزهايمر مقابل الهذيان المفاجئ', subAr: 'لماذا يخرف المسن فجأة في يوم؟' },
          { id: 'incontinence_care', icon: '🧷', titleAr: '٥. سلس البول والقسطرة', subAr: 'منع العدوى والعناية بالجلد' },
          { id: 'polypharmacy_beers', icon: '💊', titleAr: '٦. أدوية خطرة على كبار السن', subAr: 'المنومات ومضادات الكولين' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as GeriatricTab)}
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

      {activeTab === 'bedsores_care' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #d97706' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🛏️ بروتوكول الوقاية والعلاج من «قرح الفراش (Bedsores)» للمريض الملازم للسرير
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            تتكون قرحة الفراش خلال **ساعتين إلى 3 ساعات فقط** من الضغط المستمر على العظم البارز (أسفل الظهر/العصعص، الكعبين، ومفصل الفخذ):<br />
            • **١. المرتبة الهوائية الطبية ذات الموتور التبادلي (Alternating Air Mattress):** إلزامية من أول يوم يلزم فيه المريض الفراش.<br />
            • **٢. ساعة التقليب الإلزامية (كل ساعتين):** قلّب المريض كل ساعتين (على ظهره -> جانبه الأيمن -> جانبه الأيسر) مع وضع مخدة بين الركبتين والكاحلين، وارفع كعبي القدمين على مخدة طرية حتى تبقى الكعوب معلقة في الهواء.<br />
            • **٣. علاج القرحة في بدايتها (الدرجة الأولى والثانية):** غسيل بمحلول ملح معقم + مرهم **ميبو (MEBO) أو هيماجل (HemaGel) أو بيبانثين بلس** + لصقات الغرويات المائية الواقية (**كومفيل Comfeel أو ديرماجيم**). ممنوع دلك الجلد الأحمر بقوة أو استخدام الكحول عليه!
          </p>
        </section>
      )}

      {activeTab === 'fall_hip_prev' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🦴 حماية الجد والجدة من «كسر عنق عظمة الفخذ (الحوض)» أثناء الذهاب للحمام ليلاً
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            90% من كسور الحوض لكبار السن تحدث الساعة 3 فجراً أثناء القيام المفاجئ من السرير للحمام بسبب **«هبوط الضغط الموضعي (Orthostatic Hypotension)»**:<br />
            • **قاعدة الـ 3 دقائق عند القيام من السرير:** علم المسن ألا يقف فجأة! يجلس أولاً على حرف السرير لمدة **دقيقتين** ويحرك مشط قدميه لتنشيط الدورة الدموية قبل الوقوف.<br />
            • **تأمين البيت:** إزالة السجاد الصغير والعتبات التي تتعثر فيها القدم، تركيب **مقبض حديدي (Grab Bar)** بجوار قاعدة الحمام والدش، وإضاءة ليلية خافتة دائمة في طرقة الحمام.
          </p>
        </section>
      )}

      {activeTab === 'dysphagia_choking' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🥤 التعامل مع «شرقة الماء وصعوبة البلع (Dysphagia)» بعد الجلطات وكبار السن
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **لماذا يشرق المسن في الماء العادي ولا يشرق في الزبادي؟** لأن الماء سائل سريع جداً يسبق رد فعل إغلاق لسان المزمار البطيء لدى المسن فيدخل في القصبة الهوائية ويسبب **«التهاباً رئوياً استنشاقياً قاتلاً (Aspiration Pneumonia)»**!<br />
            • **الحل الطبي الذكي:**<br />
            ١. إطعام وشرب المسن وهو **جالس بزاوية 90 درجة تماماً**، مع إمالة الذقن قليلاً لأسفل نحو الصدر أثناء البلع (**Chin-Tuck Technique** — إرجاع الرأس للخلف يفتح مجرى الهواء للشرقة!).<br />
            ٢. إعطاء الماء بالملعقة الصغيرة أو استخدام بودرة مثخنة للسوائل (Thickener)، وتفضيل السوائل الكثيفة كاللبن الرايب والمهلبية الخفيفة والشوربة الثقيلة، وبقاء المريض جالساً 30 دقيقة بعد الأكل.
          </p>
        </section>
      )}

      {activeTab === 'alzheimer_delirium' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626', background: '#fef2f2' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🧠 معلومة تنقذ حياة: الفرق بين «الزهايمر التدريجي» و«الهذيان المفاجئ في يوم وليلة (Delirium)»!
          </h2>
          <p className="small" style={{ color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
            • **الزهايمر والخرف:** يتطور ببطء شديد على مدار **شهور وسنوات**.<br />
            • **🚨 أما إذا استيقظ الجد أو الجدة فجأة في يوم وليلة وهو تائه، لا يعرف أولاده، يهلوس، أو شديد الهياج والخمول:** هذا **ليس زهايمر!** هذا يسمى **«هذياناً حاداً (Acute Delirium)»** وهو العلامة الوحيدة في كبار السن على وجود كارثة خفية في الجسم بدون سخونة: مثل **التهاب وصديد شديد في مجرى البول، التهاب رئوي صامت، جفاف ونقص صوديوم الدم، أو هبوط سكر!** افحص البول والسكر والصدر فوراً سيعود لوعيه الطبيعي تماماً!
          </p>
        </section>
      )}

      {activeTab === 'incontinence_care' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🧷 العناية بالحفاضات للكبار وقواعد القسطرة البولية لمنع تسمم الدم
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • استخدم كريم عازل بأكسيد الزنك وزيت الزيتون مع كل غيار لحماية الجلد من الأمونيا.<br />
            • **في حالة وجود قسطرة بولية:** يجب أن يكون كيس جمع البول دائماً **في مستوى منخفض تحت مستوى السرير والمثانة** (لا ترفعه أبداً فوق السرير حتى لا يرجع البول الملوث للكلى!)، وتُغير القسطرة العادية كل أسبوعين، والسيليكون كل 4 إلى 6 أسابيع بتعقيم كامل.
          </p>
        </section>
      )}

      {activeTab === 'polypharmacy_beers' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💊 قائمة الأدوية المحظورة على كبار السن فوق 65 عاماً (Beers Criteria)
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700 }}>
            <li>**المنومات المهدئة ومضادات الهيستامين القديمة (كلورفينيرامين، ديفينهيدرامين، نايت كالم):** تسبب ترنحاً وسقوطاً ليلياً وكسر الحوض وتزيد تشوش الذاكرة.</li>
            <li>**مسكنات العظام (فولتارين، بروفين، كتافلام، بيروكسيكام):** تسبب نزيف المعدة الصامت والفشل الكلوي الحاد لكبار السن.</li>
            <li>**أدوية السكر طويلة المفعول من الجيل القديم (أماريل / دوانيل بجرعات عالية):** تسبب غيبوبة هبوط سكر ليلية صامتة للمسنين.</li>
          </ul>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
