import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type NeuroTab = 'headache_diff' | 'stroke_fast' | 'seizure_aid' | 'bell_palsy' | 'panic_vs_heart' | 'insomnia_sleep';

export default function NeurologyClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<NeuroTab>('headache_diff');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #4c1d95 55%, #8b5cf6 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#ede9fe' }}>
            🧠 {tr(lang, 'عيادة واستشاري المخ والأعصاب والصداع النصفي والنوم (خبرة 40 عاماً)', 'Senior Neurology, Migraine & Stroke Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (14 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة المخ والأعصاب، الصداع النصفي، الجلطات، والأرق الشاملة', 'Complete Neurology, Migraine, Stroke Rescue & Sleep Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'المفرّق الذكي لأنواع الصداع، رادار الساعة الذهبية لإنقاذ جلطة المخ (FAST)، إسعاف نوبة التشنج والصرع، التهاب العصب السابع، والتفرقة بين نوبة الهلع وأزمة القلب.',
            'Headache differentiator, FAST golden-hour stroke rescue, seizure first-aid, Bell’s palsy, panic attack vs angina, and insomnia protocol.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'headache_diff', icon: '⚡', titleAr: '١. مفرّق أنواع الصداع', subAr: 'النصفي، التوتري، والجيوب' },
          { id: 'stroke_fast', icon: '🚨', titleAr: '٢. رادار جلطة المخ (FAST)', subAr: 'الساعة الذهبية لحقنة الإذابة' },
          { id: 'seizure_aid', icon: '🛡️', titleAr: '٣. إسعاف نوبة التشنج والصرع', subAr: 'كارثة الملعقة ووضع الإفاقة' },
          { id: 'bell_palsy', icon: '😐', titleAr: '٤. التهاب العصب السابع', subAr: 'حماية العين وأول 72 ساعة' },
          { id: 'panic_vs_heart', icon: '💓', titleAr: '٥. نوبة الهلع مقابل الذبحة', subAr: 'التفرقة وتمرين التنفس الرباعي' },
          { id: 'insomnia_sleep', icon: '🌙', titleAr: '٦. علاج الأرق بدون إدمان', subAr: 'الميلاتونين والماغنسيوم والنوم' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as NeuroTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #7c3aed' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #6d28d9 100%)' : '#ffffff',
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

      {activeTab === 'headache_diff' && (
        <section style={{ display: 'grid', gap: '14px', marginBottom: '28px' }}>
          <div className="card" style={{ borderRadius: '16px', padding: '18px', borderLeft: '5px solid #7c3aed' }}>
            <h3 style={{ margin: '0 0 6px', color: '#0D1F38' }}>١. الصداع النصفي / الشقيقة (Migraine)</h3>
            <p className="small" style={{ margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
              • **الوصف:** ألم نابض (يدق كالنبض) في نصف الرأس وحول العين، يصاحبه **غثيان وميل للقيء وانزعاج شديد من الضوء والصوت**، وقد تسبقه زغللة بصرية (Aura).<br />
              • **الأكلات المهيجة للشقيقة:** الجبن الرومي والركفورد المعتق، الشوكولاتة، الموز، المخللات، واللانشون.<br />
              • **العلاج:** أخذ قرص من عائلة التريبتان (إميجران Imigran / ألموتريبتان / ريلباكس) في **أول 15 دقيقة من بداية النوبة** والجلوس في غرفة مظلمة هادئة.
            </p>
          </div>
          <div className="card" style={{ borderRadius: '16px', padding: '18px', borderLeft: '5px solid #0284c7' }}>
            <h3 style={{ margin: '0 0 6px', color: '#0D1F38' }}>٢. الصداع التوتري والعنقي (Tension & Cervicogenic Headache)</h3>
            <p className="small" style={{ margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
              • **الوصف:** حزام ضاغط يحيط بالرأس والجبهة أو يبدأ من قفا الرقبة ويمتد لأعلى الرأس بسبب التوتر والجلوس الخاطئ أمام الموبايل.<br />
              • **العلاج:** كمادات ماء دافئ على عضلات الرقبة، فرد الرقبة، وباراسيتامول.
            </p>
          </div>
          <div className="card" style={{ borderRadius: '16px', padding: '18px', borderLeft: '5px solid #dc2626', background: '#fef2f2' }}>
            <h3 style={{ margin: '0 0 6px', color: '#991b1b' }}>٣. صداع الاستخدام المفرط للمسكنات (Medication Overuse Headache)</h3>
            <p className="small" style={{ margin: 0, fontWeight: 700, color: '#7f1d1d', lineHeight: 1.6 }}>
              إذا كنت تتناول المسكنات (خصوصاً المحتوية على كافيين مثل بنادول إكسترا أو إكسدرين أو أبيمول إكسترا) أكثر من 10-15 يوماً في الشهر، فإن المسكن نفسه يغير مستقبلات الألم في المخ ويصيبك بصداع يومي مزمن فور استيقاظك!
            </p>
          </div>
        </section>
      )}

      {activeTab === 'stroke_fast' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626', background: '#fef2f2' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🚨 رادار الجلطة الدماغية في أول 60 دقيقة (قاعدة F.A.S.T للإنقاذ من الشلل)
          </h2>
          <p className="small" style={{ color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
            حقنة إذابة جلطة المخ (rtPA - Actilyse) لا تُعطى إلا خلال **أول 3 إلى 4.5 ساعات فقط** من بداية الأعراض! احفظ الـ 4 علامات:<br />
            • **F - Face (الوجه):** اطلب من المريض أن يبتسم؛ هل زاوية الفم مائلة أو ساقطة في جانب واحد؟<br />
            • **A - Arm (الذراع):** اطلب منه رفع ذراعيه للأمام؛ هل تسقط إحدى الذراعين لأسفل؟<br />
            • **S - Speech (الكلام):** هل كلامه ثقيل أو متلعثم أو غير مفهوم؟<br />
            • **T - Time (الوقت):** سجل الساعة التي ظهر فيها العرض بالدقيقة وتوجه لأقرب وحدة سكتة دماغية فوراً.<br />
            ⛔ **تحذير قاتل:** إياك أن تعطي المريض قرص أسبرين في البيت قبل عمل أشعة مقطعية على المخ! لأن 15% من الحالات تكون «نزيفاً بالمخ» وليس جلطة، والأسبرين يزيد النزيف ويقتل المريض!
          </p>
        </section>
      )}

      {activeTab === 'seizure_aid' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🛡️ إسعاف نوبة التشنج أو الصرع (تصحيح كارثة فتح الفم بالملعقة!)
          </h2>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '12px' }}>
            <b style={{ color: '#991b1b' }}>⛔ 3 أخطاء شعبية ممنوعة قطعاً أثناء التشنج:</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 700 }}>
              ١. مستحيل طبياً أن يبلع المريض لسانه! محاولة فتح فمه بالقوة بملعقة أو إصبعك تكسر أسنانه وتجرح فكه وتسد مجرى نفسه!<br />
              ٢. لا ترش ماءً أو تسقه ماءً ولا تشممه بصلاً.<br />
              ٣. لا تقيد حركته أو تجلس فوق أطرافه.
            </p>
          </div>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <b style={{ color: '#166534' }}>✅ التصرف الصحيح في 3 خطوات:</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 700 }}>
              ١. أبعد أي أثاث حاد من حوله وضع مخدة أو جاكيت مطوي تحت رأسه وفك أزرار القميص.<br />
              ٢. اقلبه بهدوء على **جانبه الأيسر (وضع الإفاقة)** ليسيل اللعاب خارج الفم ولا يدخل الرئة.<br />
              ٣. احسب وقت النوبة بالساعة؛ إذا استمرت أكثر من **5 دقائق** اتصل بالإسعاف فوراً.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'bell_palsy' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            😐 التهاب العصب السابع (Bell’s Palsy): خطة أول 72 ساعة وحماية قرنية العين
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **كيف تفرق بين العصب السابع وجلطة المخ؟** في التهاب العصب السابع، المريض **لا يستطيع قفل عينه ولا يستطيع رفع حاجبه وتجعيد جبهته** في الناحية المصابة، بينما حركة الذراع والساق طبيعية تماماً.<br />
            • **القاعدة الذهبية للشفاء التام:** البدء في كورس الكورتيزون الفموي في **أول 72 ساعة** بوصفة الطبيب + **حماية العين لأنها لا تغلق أثناء النوم**: وضع قطرة مرطبة نهاراً، ومرهم جل مرطب ليلاً مع تغطية العين بشاش وبلاستر طبي أثناء النوم حتى لا تجف القرنية وتتقرح! (وممنوع مضغ اللبان في أول أسبوعين!).
          </p>
        </section>
      )}

      {activeTab === 'panic_vs_heart' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💓 التفرقة بين «نوبة الهلع Panic Attack» و«الذبحة الصدرية» وتمرين التنفس (4-7-8)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **نوبة الهلع والتوتر الحاد:** ضربات قلب سريعة، شعور بالاختناق، تنميل حول الفم وأطراف الأصابع، وألم السدر يكون عبارة عن **نغزة محددة يمكنك الإشارة إليها بإصبع واحد** وتزداد عند أخذ نفس عميق.<br />
            • **الذبحة الصدرية الحقيقية:** ألم ضاغط كالصخرة الثقيلة في منتصف الصدر يمتد للكتف الأيسر والفك مع عرق بارد غزير ويزداد مع المجهود.<br />
            • **تمرين التنفس المهدئ للعصب الحائر فوراً:** خذ شهيقاً هادئاً من الأنف في **4 ثوانٍ**، احبس النفس **4 ثوانٍ**، وأخرج الزفير ببطء من الفم في **6 إلى 8 ثوانٍ** — يبطئ ضربات القلب خلال دقيقتين.
          </p>
        </section>
      )}

      {activeTab === 'insomnia_sleep' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🌙 علاج الأرق واضطراب الساعة البيولوجية بدون منومات إدمانية
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • أوقف أي مشروبات كافيين بعد الساعة 4 عصراً، وأغلق شاشة الموبايل قبل النوم بـ 60 دقيقة لأن الضوء الأزرق يمنع إفراز هرمون الميلاتونين من الغدة الصنوبرية.<br />
            • **المكملات الآمنة للنوم العميق بدون تعود:** قرص **ماغنسيوم جلايسينات (Magnesium Glycinate 400mg)** قبل النوم بساعة + **ميلاتونين (Melatonin 3mg - 5mg)** تحت اللسان قبل النوم بـ 30 دقيقة في غرفة مظلمة تماماً.
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
