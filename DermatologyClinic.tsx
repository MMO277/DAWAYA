import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type DermaTab = 'steroid_trap' | 'burns_scald' | 'rash_diff' | 'diaper_rash' | 'wound_dressing' | 'acne_roaccutane';

export const STEROID_CREAMS_TIERS = [
  {
    tierAr: 'الفئة فائقة القوة (Super-Potent Class I): ديرموفيت (Dermovate) / كلوبيتاسول',
    warningAr: '🚨 خطر شديد: أقوى كورتيزون موضعي؛ ممنوع منعاً باتاً وضعه على الوجه، أو المناطق الحساسة، أو تسلخات الأطفال! يسبب ضمور وترقق الجلد، ظهور شعيرات دموية دائمة، وحب شباب ستيرويدي مشوه في أيام معدودة.',
    allowedUseAr: 'يُستخدم فقط وبوصفة طبيب لصدفية الكوعين والركبتين السميكة أو الثعلبة المحددة ولفترة قصيرة جداً.',
    color: '#dc2626',
  },
  {
    tierAr: 'الفئة القوية والمتوسطة: بيتاديرم (Betaderm)، ديبروساليك، إليكا (Elica)، كيناكومب، بوليديرم',
    warningAr: '⚠️ مصيدة الخلطات والكيناكومب: الأمهات تدهن كيناكومب أو بيتاديرم مع كل غيار حفاضة! الكورتيزون يمتص من جلد الرضيع الرقيق للدم وقد يثبط الغدة الكظرية للطفل (متلازمة كوشينج). كما أن «خلطة التفتيح الشعبية (بيتاديرم + فيير آند لفلي + سبوتلس)» تدمر بشرة الوجه للأبد بمجرد وقفها!',
    allowedUseAr: 'تُستخدم على الجسم لـ 5-7 أيام فقط لعلاج الإكزيما الحادة أو لدغات الحشرات الشديدة تحت إشراف طبي.',
    color: '#d97706',
  },
  {
    tierAr: 'الفئة الخفيفة والآمنة نسبياً (Mild Class VII): هيدروكورتيزون 1% (Hydrocortisone 1%)',
    warningAr: '🟢 الألطف: هو الوحيد المسموح به لفترات قصيرة جداً (3-5 أيام) في التهابات الوجه الخفيفة أو إكزيما الأطفال بعد استشارة الطبيب.',
    allowedUseAr: 'البديل اليومي الآمن للترطيب بدون كورتيزون نهائياً: كريم بانثينول، بيبانثين، أو سيتافيل.',
    color: '#16a34a',
  },
];

export const RASH_DIFFERENTIATION = [
  {
    nameAr: 'التينيا الفطرية الحلقية وتينيا الفخذين (Fungal Tinea / Ringworm)',
    lookAr: 'بقعة حمراء دائرية لها «حرف بارز محمر يتقشر» ووسطها يميل للشفاء، تزداد مع العرق والرطوبة وتسبب حكة شديدة.',
    trapAr: '❌ الفخ القاتل: دهنها بمرهم كورتيزون (مثل بيتاديرم)! الكورتيزون يهدئ الحكة يومين لكنه يطفئ مناعة الجلد فيتوحش الفطر وينتشر في الجسم كله (Tinea Incognito)!',
    cureAr: '✅ العلاج الصحيح: كريم مضاد للفطريات صافي فقط (مثل لاميزيل، تيربين، دكتارين، أو كانستين) مرتين يومياً لمدة أسبوعين كاملين حتى بعد اختفاء البقعة + تجفيف الماء جيداً.',
  },
  {
    nameAr: 'الإكزيما التأتبية والحساسية التلامسية (Atopic & Contact Eczema)',
    lookAr: 'جلد جاف جداً، خشن، متشقق، محمر غير محدد الحواف، يظهر في ثنيات الكوعين والركبتين أو اليدين مع صابون المواعين.',
    trapAr: '❌ الفخ: الغسيل المتكرر بالماء الساخن والصابون المطهر (الديتول أو الكبريت) الذي يجرد الجلد من زيوته الواقية.',
    cureAr: '✅ العلاج الصحيح: الترطيب الكثيف بالمرطبات الطبية (فازلين طبي، بانثينول، يوريا خفيفة) فور الخروج من الحمام والجلد رطب + دهان كورتيزون خفيف لـ 5 أيام عند الهياج.',
  },
  {
    nameAr: 'الحزام الناري (Herpes Zoster / Shingles)',
    lookAr: 'ألم حارق كالكهرباء أو النار في جهة واحدة فقط من الجسم (يمين أو شمال لا يعبر خط المنتصف أبداً!) يتبعه ظهور فقاقيع مائية مجمعة على قاعدة حمراء.',
    trapAr: '❌ الفخ: التأخر في العلاج؛ البدء في مضاد الفيروسات (أسيكلوفير / زوفيراكس / فالتريكس) في أول 72 ساعة من ظهور الطفح يمنع ألم الأعصاب المزمن المستمر بعد الشفاء!',
    cureAr: '✅ العلاج الصحيح: أقراص مضادة للفيروسات بجرعة عالية بوصفة الطبيب + فيتامين ب12 ومسكن أعصاب + مسّ كالامينا أو مضاد حيوي موضعي لمنع تلوث الفقاقيع.',
  },
];

export default function DermatologyClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<DermaTab>('steroid_trap');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #5b21b6 55%, #7c3aed 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#ede9fe' }}>
            🩹 {tr(lang, 'عيادة واستشاري الجلدية والحروق والعناية بالجروح (خبرة 40 عاماً)', 'Senior Dermatology, Burns & Wound Care Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة الجلدية، طوارئ الحروق، والعناية بالجروح الشاملة', 'Complete Dermatology, Burns & Wound Care Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'كاشف مصيدة مراهم الكورتيزون والخلطات الشعبية، طوارئ الحروق والسمط بالماء المغلي، التفرقة بين الفطريات والإكزيما، والغيار الطبي الصحيح على الجروح.',
            'Topical steroid safety, acute thermal burn rescue, fungal vs. eczema differentiation, diaper rash, and wound dressing protocols.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'steroid_trap', icon: '⚠️', titleAr: '١. فخ مراهم الكورتيزون', subAr: 'الخلطات الشعبية ودرجات القوة' },
          { id: 'burns_scald', icon: '🔥', titleAr: '٢. طوارئ الحروق والسمط', subAr: 'أول 10 دقائق وكارثة المعجون' },
          { id: 'rash_diff', icon: '🔍', titleAr: '٣. التينيا مقابل الإكزيما', subAr: 'التفرقة بين الفطريات والحساسية' },
          { id: 'diaper_rash', icon: '👶', titleAr: '٤. تسلخات الحفاضة العنيدة', subAr: 'التسلخ العادي مقابل الفطري' },
          { id: 'wound_dressing', icon: '🩹', titleAr: '٥. الغيار على الجروح', subAr: 'محلول الملح، البيتادين والكحول' },
          { id: 'acne_roaccutane', icon: '✨', titleAr: '٦. حب الشباب والنت لوك', subAr: 'روشتة آمنة وشروط الإيزوتريتينوين' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as DermaTab)}
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

      {activeTab === 'steroid_trap' && (
        <section style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
          {STEROID_CREAMS_TIERS.map((st, idx) => (
            <div key={idx} className="card" style={{ borderRadius: '16px', padding: '20px', borderTop: `5px solid ${st.color}` }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900, color: '#0D1F38' }}>{st.tierAr}</h3>
              <p className="small" style={{ margin: '0 0 10px', color: '#991b1b', fontWeight: 700, lineHeight: 1.55 }}>{st.warningAr}</p>
              <div style={{ background: 'var(--tint)', padding: '10px 14px', borderRadius: '10px', fontWeight: 600, fontSize: '0.88rem' }}>
                ✅ {st.allowedUseAr}
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'burns_scald' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🔥 بروتوكول طوارئ الحروق والسمط بالماء المغلي أو الزيت في أول 15 دقيقة
          </h2>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
            <b style={{ color: '#166534' }}>✅ الخطوة الذهبية الأولى: مياه الحنفية الجارية لمدة 15 إلى 20 دقيقة متواصلة!</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 600 }}>
              افتح الحنفية بماء فاتر جاري على مكان الحرق لمدة 15 دقيقة كاملة لسحب الحرارة الكامنة من طبقات الجلد ومنع تحول الحرق من الدرجة الأولى للثانية أو الثالثة، ثم ادهن طبقة سميكة من مرهم **ميبو (MEBO)** أو كريم **ديرمازين (Dermazin)**.
            </p>
          </div>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
            <b style={{ color: '#991b1b' }}>⛔ 4 كوارث شعبية تدمر الجلد المحروق وتسبب تشوهاً دائماً:</b>
            <ul className="small" style={{ margin: '6px 0 0', paddingRight: '20px', color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
              <li>**معجون الأسنان، البن، الدقيق، أو البيض النيئ:** تحبس الحرارة داخل الجلد وتلوث الجرح بالبكتيريا وتضطر الطبيب لكحتها بألم رهيب!</li>
              <li>**الثلج المباشر على الحرق:** يسبب انقباضاً حاداً للأوعية الدموية ويميت الأنسجة المحروقة (Frostbite فوق الحرق!).</li>
              <li>**فقأ فقاقيع المياه (Blisters) بالدبوس:** الفقاعة هي "غيار طبيعي معقم" يحمي الجلد الجديد تحتها؛ فقؤها يكشف اللحم الحي للتلوث والصديد.</li>
            </ul>
          </div>
        </section>
      )}

      {activeTab === 'rash_diff' && (
        <section style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
          {RASH_DIFFERENTIATION.map((r, idx) => (
            <div key={idx} className="card" style={{ borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900, color: '#0D1F38' }}>{r.nameAr}</h3>
              <p className="small" style={{ margin: '0 0 8px', fontWeight: 600 }}><b>🔍 الشكل المميز: </b>{r.lookAr}</p>
              <div style={{ background: '#fef2f2', padding: '10px 12px', borderRadius: '10px', marginBottom: '8px', color: '#991b1b', fontWeight: 700, fontSize: '0.86rem' }}>
                {r.trapAr}
              </div>
              <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '10px', color: '#14532d', fontWeight: 700, fontSize: '0.86rem' }}>
                {r.cureAr}
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'diaper_rash' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            👶 بروتوكول تسلخات الحفاضة: متى تكون تسلخاً عادياً ومتى تكون فطريات (كانديدا)؟
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.65 }}>
            • **التسلخ الاحتكاكي العادي:** احمرار يظهر على المناطق البارزة الملامسة للحفاضة ولا يدخل في ثنيات الفخذين؛ يُعالج بالتشطيف بالماء الدافئ فقط (ممنوع المناديل المبللة المعطرة!)، التجفيف بالتربيت، ووضع طبقة سميكة من كريم **أكسيد الزنك (سودوكريم / زنك أوليف / سانوسان)**.<br />
            • **التسلخ الفطري العنيد (Candida Diaper Rash):** إذا استمر التسلخ أكثر من 3 أيام، وكان لونه أحمر نارياً لامعاً **داخل ثنيات الجلد العميقة** وحوله حبوب حمراء صغيرة متناثرة كالأقمار الصناعية (Satellite Lesions): هنا كريم الزنك وحده لن يكفي! يجب دهن كريم مضاد للفطريات آمن بدون كورتيزون (مثل **ميكوناز أو دكتارين أو كانستين كريم**) مرتين يومياً وفوقه طبقة الزنك العازلة.
          </p>
        </section>
      )}

      {activeTab === 'wound_dressing' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🩹 القواعد الجراحية الصحيحة للغيار على الجروح والغرز والقدم السكري
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
              <b style={{ color: '#991b1b' }}>⛔ لماذا يُمنع الكحول الأبيض وماء الأكسجين داخل الجروح المفتوحة؟</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 600 }}>
                الكحول يُستخدم لتطهير الجلد السليم فقط! صب الكحول أو ماء الأكسجين داخل الجرح المفتوح يحرق الخلايا الليفية الجديدة (Fibroblasts) المسؤولة عن قفل الجرح ويؤخر الالتئام أسابيع!
              </p>
            </div>
            <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <b style={{ color: '#166534' }}>✅ خطوات الغيار المثالي في 3 خطوات:</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 600 }}>
                ١. اغسل الجرح جيداً بـ **محلول ملح معقم 0.9% (Normal Saline)** لإزالة أي إفرازات بلطف. ٢. مسحة خفيفة بـ **بيتادين مطهر جراحي (Povidone-Iodine)** من الداخل للخارج. ٣. ضع مرهم مضاد حيوي موضعي (فيوسيدين أو باكتروبان) وغطِّه بشاش فازلين غير لاصق وشاش معقم.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'acne_roaccutane' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            ✨ دستور علاج حب الشباب وضوابط الأمان الصارمة لكبسولات الإيزوتريتينوين (نت لوك / رواكوتان)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.65 }}>
            • **شروط أخذ كبسولات النت لوك / الكوراكني / الرواكوتان:**<br />
            ١. عمل تحليل إنزيمات الكبد (ALT, AST) والدهون الثلاثية والكوليسترول قبل البدء وكل شهرين.<br />
            ٢. ممنوع منعاً باتاً للحوامل أو المقبلات على الحمل (يجب إيقافه قبل الحمل بـ 1-3 أشهر على الأقل).<br />
            ٣. ممنوع الجمع بينه وبين كبسولات التتراسيكلين/الدوكسيسيكلين (يسبب ارتفاع ضغط المخ الحميد والصداع العنيف!).<br />
            ٤. ممنوع عمل ليزر إزالة شعر أو تقشير كيميائي عميق أثناء الكورس، مع التزام قطرة مرطبة للعين ومرطب شفايف وواقي شمس يومياً.
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
