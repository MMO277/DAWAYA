import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type DentalTab = 'night_pulpitis' | 'abscess_swelling' | 'avulsed_tooth' | 'post_extraction' | 'ulcers_gums' | 'anesthesia_safety';

export default function DentalEmergencyClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<DentalTab>('night_pulpitis');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #0e7490 55%, #0891b2 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#cffafe' }}>
            🦷 {tr(lang, 'عيادة واستشاري طب وجراحة الفم والأسنان (خبرة 40 عاماً)', 'Senior Dental & Oral Surgery Emergency Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة طوارئ الأسنان واللثة وجراحة الفم الشاملة', 'Complete Dental Emergency, Pulpitis & Oral Care Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'بروتوكول إنقاذ ألم عصب الضرس الساعة 3 الفجر، طوارئ خراج الأسنان وتورم الوجه، إعادة زرع السنة الدائمة المكسورة في الحوادث، وتعليمات ما بعد الخلع.',
            '3 AM nerve pain relief, acute dental abscess triage, knocked-out permanent tooth rescue, and post-extraction care.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'night_pulpitis', icon: '🌙', titleAr: '١. ألم العصب الليلي', subAr: 'تسكين وجع الضرس الفجر' },
          { id: 'abscess_swelling', icon: '🎈', titleAr: '٢. خراج الأسنان والتورم', subAr: 'خطر الكمادات الساخنة والمضاد' },
          { id: 'avulsed_tooth', icon: '🥛', titleAr: '٣. سقوط السنة في حادث', subAr: 'إنقاذ السنة في لبن خلال 60د' },
          { id: 'post_extraction', icon: '🩸', titleAr: '٤. تعليمات بعد الخلع', subAr: 'وقف النزيف ومنع التهاب السنخ' },
          { id: 'ulcers_gums', icon: '👅', titleAr: '٥. قرح الفم ونزيف اللثة', subAr: 'الحمو وفطريات اللسان والجير' },
          { id: 'anesthesia_safety', icon: '💉', titleAr: '٦. أمان بنج الأسنان', subAr: 'للحوامل ومرضى القلب والسيولة' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as DentalTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #0891b2' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #0891b2 100%)' : '#ffffff',
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

      {activeTab === 'night_pulpitis' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🌙 بروتوكول إنقاذ «ألم عصب الضرس الليلي» (لماذا يشتد الوجع عند النوم؟)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.6, marginBottom: '12px' }}>
            **التفسير العلمي:** عندما تستلقي على السرير، يزداد تدفق وضغط الدم نحو الرأس فيندفع الدم داخل غرفة عصب الضرس المغلقة الملتهبة (Pulpitis) فيضغط على العصب بشدة جنونية!
          </p>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
            <b style={{ color: '#166534' }}>✅ خطوات التسكين الفوري حتى تذهب للطبيب صباحاً:</b>
            <ul className="small" style={{ margin: '6px 0 0', paddingRight: '20px', color: '#14532d', fontWeight: 700, lineHeight: 1.7 }}>
              <li>**ارفع رأسك على مخدتين أو ثلاث (نصف جالس):** لتقليل ضغط الدم المندفع لعصب الضرس فوراً.</li>
              <li>**مضمضة بماء دافئ وملح** لإزالة أي بقايا طعام ضاغطة داخل الحفرة، واستخدم خيط الأسنان برفق.</li>
              <li>**كمادات باردة على الخد من الخارج** لتهدئة نبض العصب.</li>
              <li>**المسكن الأقوى لعصب الأسنان (لغير الحوامل ومرضى الكلى/القرحة):** الجمع الآمن بين جرعة إيبوبروفين (بروفين 400-600) أو كيتوبرولاك/كتافلام فاست + قرص باراسيتامول 500 مجم. (للحامل: باراسيتامول فقط!).</li>
            </ul>
          </div>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
            <b style={{ color: '#991b1b' }}>⛔ كارثة شعبية: لا تضع قرص أسبرين أو ريفو أو فص ثوم أو بطارية أو كحول فوق الضرس واللثة!</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 600 }}>
              وضع قرص الأسبرين مباشرة على اللثة لا يسكن العصب، بل يسبب «حرقاً كيميائياً أبيض مؤلماً جداً في اللثة وبطانة الخد (Aspirin Chemical Burn)» يضاعف مأساتك! إذا أردت استخدام زيت القرنفل (Eugenol)، ضع نقطة صغيرة جداً على قطنة دقيقة داخل فجوة الضرس فقط دون لمس اللثة.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'abscess_swelling' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🎈 طوارئ خراج الأسنان وتورم الوجه والعين
          </h2>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '12px' }}>
            <b style={{ color: '#991b1b' }}>🚨 متى يكون خراج الضرس طوارئ مستشفى فورية؟</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 700, lineHeight: 1.6 }}>
              إذا وصل التورم لإغلاق جفن العين، أو نزل لتحت الفك والرقبة مع صعوبة في البلع أو التنفس أو عدم القدرة على فتح الفم (Trismus) وسخونة عالية (ذباح لودفيج Ludwig’s Angina) — يجب التوجه للمستشفى فوراً!
            </p>
          </div>
          <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <b style={{ color: '#92400e' }}>⚠️ خطأ شائع جداً: أوعى تعمل كمادات سخنة على الخد المورم من الخارج!</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#78350f', fontWeight: 600 }}>
              الكمادات الساخنة على الوجه من الخارج تسحب الصديد لعضلات الوجه والجلد! الصح: **مضمضة بماء دافئ وملح من داخل الفم**، وكمادات باردة من الخارج، مع البدء في المضاد الحيوي المناسب (مثل أوجمنتين + فلاجيل لقتل البكتيريا اللاهوائية) ومراجعة طبيب الأسنان لفتح وتصريف الخراج.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'avulsed_tooth' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #0891b2' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🥛 معجزة طبية لا يعرفها 99% من الناس: إنقاذ السنة الدائمة الساقطة بالكامل في الحوادث!
          </h2>
          <p className="small" style={{ fontWeight: 700, color: '#0e7490', marginBottom: '12px' }}>
            إذا وقع طفل (بعد سن 7 سنوات) أو بالغ وانخلعت سنته الأمامية الدائمة بالكامل من جذورها، يمكنك إعادة زرعها لتعيش مدى الحياة إذا اتبعت الـ 4 خطوات الذهبية خلال 60 دقيقة:
          </p>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', fontWeight: 700, fontSize: '0.88rem', color: '#14532d' }}>
              ١. امسك السنة من «التاج الأبيض العلوي» فقط، وإياك أن تلمس الجذر أو تكحته أو تغسله بالصابون حتى لا تقتل ألياف الرباط اللثوي الحية عليه!
            </div>
            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', fontWeight: 700, fontSize: '0.88rem', color: '#14532d' }}>
              ٢. ضع السنة فوراً في كوب **حليب بارد مبستر (لبن ساقع)** أو **محلول ملح معقم**! (لا تضعها في منديل ورق جاف ولا في ماء حنفية عادي لأن خلايا الجذر تموت في الجفاف خلال 15 دقيقة!).
            </div>
            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', fontWeight: 700, fontSize: '0.88rem', color: '#14532d' }}>
              ٣. توجه لأقرب طبيب أسنان خلال 30 إلى 60 دقيقة؛ سيقوم الطبيب بإعادتها لمكانها وتثبيتها بجبيرة بسيطة لتلتئم وتعود طبيعية تماماً! (ملاحظة: الأسنان اللبنية للأطفال الصغار لا يتم إعادة زرعها حتى لا تضر برعم السنة الدائمة تحتها).
            </div>
          </div>
        </section>
      )}

      {activeTab === 'post_extraction' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🩸 دستور الـ 24 ساعة الذهبية بعد خلع الضرس أو جراحة ضرس العقل
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            الهدف الأول بعد الخلع هو الحفاظ على **«الجلطة الدموية (Blood Clot)»** التي تسد مكان الضرس المخلوع وتغطي العظم:<br />
            • **عض على القطنة المعقمة بثبات لمدة 60 دقيقة كاملة** دون تغييرها كل دقيقة.<br />
            • **ممنوع المضمضة أو البصق بقوة أو الشرب بالشاليموه (الشفاطة) أو التدخين في أول 24 ساعة:** لأن الشفط يخلع الجلطة الدموية من مكانها فيتكشف العظم العاري ويحدث **"التهاب السنخ الجاف (Dry Socket)"** شديد الألم بعد 3 أيام!<br />
            • تناول أطعمة ومشروبات باردة ولينة في أول يوم (آيس كريم، زبادي بارد، عصير بدون شاليموه).
          </p>
        </section>
      )}

      {activeTab === 'ulcers_gums' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            👅 علاج قرح الفم المؤلمة (Aphthous Ulcers) وفطريات اللسان ونزيف اللثة
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **قرح الفم البيضاء المؤلمة:** ضع جل موضعي مخدر وملطف قبل الأكل بـ 10 دقائق (مثل أوراكيور Oracure أو مونديزال جل) + مضمضة كلورهيكسيدين (هيكسيتول / دجتيواش) + مكمل فيتامين ب المركب والزنك والحديد.<br />
            • **الطبقة البيضاء الكثيفة على لسان الرضع أو بعد المضادات الحيوية (Oral Thrush):** فطريات كانديدا تُعالج بجل ميكوناز أو دكتارين الفموي بعد الرضاعة.<br />
            • **نزيف اللثة عند غسيل الأسنان:** سببه تراكم الجير البكتيري؛ الحل ليس التوقف عن الفرشاة، بل تنظيف الجير عند الطبيب واستخدام فرشاة ناعمة (Soft) ومعجون للثة.
          </p>
        </section>
      )}

      {activeTab === 'anesthesia_safety' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💉 أمان بنج الأسنان والخلع للحوامل ومرضى القلب والسكر والسيولة
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **للحوامل:** بنج الأسنان الموضعي (Lidocaine) آمن في الحمل، وأفضل وقت لعلاج الأسنان هو **الثلث الثاني (الشهر 4 و5 و6)**، مع إمكانية علاج الطوارئ في أي شهر.<br />
            • **لمرضى الضغط والقلب:** أخبر طبيب الأسنان ليستخدم **بنج بدون أدرينالين (Plain Mepivacaine)** حتى لا يرتفع الضغط أو تتسارع ضربات القلب.<br />
            • **لمرضى أدوية السيولة (ماريفان / أسبرين / بلافيكس):** لا توقف دواء السيولة من تلقاء نفسك قبل الخلع! يتم قياس تحليل السيولة (INR) والتنسيق بين طبيب القلب وطبيب الأسنان لاستخدام خيوط جراحية وإسفنجة جيلاتينية موقفة للنزيف بأمان.
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
