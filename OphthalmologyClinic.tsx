import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type EyeTab = 'steroid_drops' | 'chemical_burn' | 'contact_lenses' | 'dry_eye_20' | 'red_eye_diff' | 'expiry_28d';

export default function OphthalmologyClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<EyeTab>('steroid_drops');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #0369a1 55%, #0284c7 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#e0f2fe' }}>
            👁️ {tr(lang, 'عيادة واستشاري طب وجراحة العيون والقرنية (خبرة 40 عاماً)', 'Senior Ophthalmology & Cornea Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (14 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة العيون والبصريات وطوارئ القرنية الشاملة', 'Complete Ophthalmology, Cornea & Eye Emergency Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'التحذير من فخ قطرات الكورتيزون وتبييض العين، إسعاف الحروق الكيميائية للعين في 60 ثانية، دستور العدسات اللاصقة، جفاف الشاشات، وقانون الـ 28 يوماً للقطرات.',
            'Topical steroid eye drop hazards, 60-second chemical splash rescue, contact lens keratitis prevention, dry eye relief, and the 28-day expiry rule.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'steroid_drops', icon: '⚠️', titleAr: '١. فخ قطرات الكورتيزون', subAr: 'توبرادكس وقطرات التبييض' },
          { id: 'chemical_burn', icon: '🚿', titleAr: '٢. طوارئ كلور أو رايش بالعين', subAr: 'الغسيل الفوري ومنع الدعك' },
          { id: 'contact_lenses', icon: '🔵', titleAr: '٣. دستور العدسات اللاصقة', subAr: 'منع قرحة الأكانثاميبا' },
          { id: 'dry_eye_20', icon: '💻', titleAr: '٤. جفاف العين والشاشات', subAr: 'قاعدة 20-20-20 والدموع' },
          { id: 'red_eye_diff', icon: '👁️', titleAr: '٥. احمرار العين والكيس الدهني', subAr: 'الرمد الصديدي مقابل الحساسية' },
          { id: 'expiry_28d', icon: '🗓️', titleAr: '٦. صلاحية القطرات (28 يوم)', subAr: 'طريقة التقطير بدون تلوث' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as EyeTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #0284c7' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #0284c7 100%)' : '#ffffff',
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

      {activeTab === 'steroid_drops' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            ⚠️ أخطر كارثة في الصيدليات: صرف قطرات الكورتيزون والمخدر الموضعي بدون فحص قاع وقرنية العين!
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
              <b style={{ color: '#991b1b' }}>١. قطرات الكورتيزون (توبرادكس Tobradex، ديكساتوبرين، ماكسيترول، فلوكا، بريد فورت):</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 600, lineHeight: 1.6 }}>
                إذا كانت العين حمراء بسبب **خدش في القرنية أو فيروس الهربس البسيط**، فوضع قطرة كورتيزون يذيب أنسجة القرنية ويسبب ثقب القرنية والعمى! كما أن تكرارها من تلقاء نفسك لحساسية العين يرفع ضغط العين بصمت ويسبب **المياه الزرقاء (Glaucoma) والمياه البيضاء المبكرة**.
              </p>
            </div>
            <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <b style={{ color: '#92400e' }}>٢. قطرة المخدر الموضعي (بيناوكسين Benoxinate) لعمال اللحام:</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#78350f', fontWeight: 600 }}>
                قطرة البيناوكسين مخصصة للطبيب فقط داخل العيادة لقياس ضغط العين! استخدامها المتكرر في المنزل لتسكين ألم لحام المعادن أو خدش القرنية يوقف التئام خلايا القرنية تماماً ويؤدي لتقرح وعتامة دائمة!
              </p>
            </div>
            <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <b style={{ color: '#166534' }}>٣. قطرات "تبييض العين" القابضة للأوعية (بريزولين / نوستامين):</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 600 }}>
                تقبض الشعيرات الدموية لساعات، ولكن عند التوقف عنها بعد 4 أيام يحدث احمرار ارتدادي أعنف! البديل الآمن اليومي لتهدئة العين هو **قطرات الدموع الصناعية المرطبة** وكمادات الماء البارد.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'chemical_burn' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #0284c7' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🚿 طوارئ دخول كلور، فلاش، عطور، زيت حار، أو رايش حديد في العين
          </h2>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
            <b style={{ color: '#166534' }}>✅ قاعدة الـ 15 دقيقة تحت الماء الجاري فوراً (قبل الذهاب للمستشفى!):</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 700, lineHeight: 1.65 }}>
              في الحروق الكيميائية (كلور، منظفات، بوتاس، جير، ماء بطارية): كل ثانية تساوي إنقاذ البصر! افتح الحنفية بماء فاتر جاري أو محلول ملح معقم واغسل العين وهي مفتوحة بأصابعك لمدة **15 إلى 20 دقيقة متواصلة** قبل التحرك للمستشفى!
            </p>
          </div>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
            <b style={{ color: '#991b1b' }}>⛔ في حالة دخول رايش حديد أو زجاج أو رمل:</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 700 }}>
              إياك أن تدعك عينك بيدك! الدعك يغرس الشظية المعدنية داخل مركز الإبصار بالقرنية. غطِّ العين بكوب ورقي واقٍ دون ضغط وتوجه لطبيب العيون لإزالتها بالميكروسكوب.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'contact_lenses' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🔵 الوصايا الذهبية لمستخدمي العدسات اللاصقة لمنع قرحة القرنية
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700, color: '#1e293b' }}>
            <li>**ممنوع منعاً باتاً غسل العدسة أو حفظها في مياه الحنفية أو الاستحمام أو السباحة بها:** مياه الحنفية وحمامات السباحة تحتوي على طفيل **الأكانثاميبا (Acanthamoeba)** الذي يلتصق بالعدسة ويخترق القرنية مسبباً أخطر قرحة عين مؤلمة في الطب!</li>
            <li>**ممنوع النوم بالعدسات اللاصقة:** النوم بها يمنع وصول الأكسجين للقرنية 8 أضعاف ويهيئ للبكتيريا الصديدية (Pseudomonas).</li>
            <li>إذا شعرتِ بألم، دموع، خوف من الضوء، أو احمرار: انزعي العدسة فوراً ولا تلبسيها مجدداً واستخدمي قطرة مضاد حيوي (مثل فيجاموكس / موكسيفلوكس) وراجعي طبيب العيون.</li>
          </ul>
        </section>
      )}

      {activeTab === 'dry_eye_20' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💻 علاج جفاف العين وإجهاد الموبايل والكمبيوتر (قاعدة 20-20-20)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **لماذا تحرقك عيناك أمام الشاشة؟** المعدل الطبيعي للرمش هو 15-20 مرة في الدقيقة، لكن أثناء التركيز في الموبايل ينخفض لـ 5 مرات فقط فتجف طبقة الدموع!<br />
            • **قاعدة 20-20-20:** كل **20 دقيقة** نظر للشاشة، انظر لشيء يبعد عنك **20 قدماً (6 أمتار)** لمدة **20 ثانية** مع الرمش الكامل.<br />
            • **أفضل القطرات المرطبة:** استخدم قطرات الدموع الصناعية المحتوية على الهيالورونيك أسيد (مثل هاي فريش Hyfresh، بوليفريش، سيستان ألترا، أو أرتيلاك) من 3 إلى 4 مرات يومياً.
          </p>
        </section>
      )}

      {activeTab === 'red_eye_diff' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            👁️ التفرقة بين الرمد الصديدي، الحساسية، والكيس الدهني (الدمّل)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **الرمد الصديدي البكتيري:** عماص أصفر كثيف يلصق الرموش صباحاً؛ يُعالج بمسح العين بقطنة مبللة بمحلول ملح دافئ + قطرة ومرهم مضاد حيوي (توبراميسين / فيوسيثالميك).<br />
            • **حساسية العين والرمد الربيعي:** حكة شديدة في العينين معاً ودموع مائية؛ يُعالج بكمادات باردة وقطرة مضادة للهيستامين ومثبتة للخلايا (أولوباتادين / باتانول / أوبتيست).<br />
            • **الدمّل الجفني والكيس الدهني (Stye & Chalazion):** حبة مؤلمة في الجفن؛ العلاج الأساسي والأهم هو **كمادات الماء الدافئ لمدة 10 دقائق 4 مرات يومياً** مع تدليك الجفن اللطيف لتسييل الدهون المحبوسة + مرهم مضاد حيوي.
          </p>
        </section>
      )}

      {activeTab === 'expiry_28d' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🗓️ قانون الـ 28 يوماً لقطرات ومراهم العين والطريقة الصحيحة للتقطير
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **أكتب تاريخ فتح القطرة بالقلم الجاف على العلبة فور فتحها:** أي قطرة عين متعددة الجرعات تنتهي صلاحيتها وتتعرض للتلوث البكتيري بعد **28 يوماً من فتح الغطاء** حتى لو تاريخ الصلاحية المطبوع ممتد لسنتين!<br />
            • **الفاصل الزمني بين قطرتين:** إذا وصف لك الطبيب أكثر من قطرة، انتظر **5 إلى 10 دقائق كاملة** بين القطرة الأولى والثانية حتى لا تغسل القطرة الثانية القطرة الأولى وتطردها خارج العين، واجعل المرهم دائماً في الآخر قبل النوم.
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
