import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type EntTab = 'nosebleed' | 'otrivin_trap' | 'vertigo_bppv' | 'tonsils_diff' | 'earwax_swabs' | 'foreign_body';

export default function EntClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<EntTab>('nosebleed');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #0f766e 55%, #14b8a6 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#ccfbf1' }}>
            👂 {tr(lang, 'عيادة واستشاري الأنف والأذن والحنجرة والاتزان (خبرة 40 عاماً)', 'Senior ENT, Sinus & Vertigo Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (14 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة الأنف والأذن والحنجرة، الجيوب الأنفية، والدوار الشاملة', 'Complete ENT, Sinusitis, Epistaxis & Vertigo Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'بروتوكول إيقاف نزيف الأنف (الرعاف)، علاج إدمان نقط الأنف (الأوتريفين)، مناورة علاج الدوار والدوخة الكذابة، التفرقة بين لوز الفيروس والصديد، وأضرار ودانات القطن.',
            'Nosebleed first-aid, nasal decongestant rebound cure, BPPV vertigo Epley maneuver, viral vs bacterial tonsillitis, and earwax care.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'nosebleed', icon: '🩸', titleAr: '١. طوارئ نزيف الأنف (الرعاف)', subAr: 'الوضعية الصحيحة في 10 دقائق' },
          { id: 'otrivin_trap', icon: '👃', titleAr: '٢. مصيدة إدمان نقط الأنف', subAr: 'علاج تعود الأوتريفين والاحتقان' },
          { id: 'vertigo_bppv', icon: '🌀', titleAr: '٣. الدوار والدوخة والأذن الوسطى', subAr: 'كريستالات الاتزان ومناورة إيبلي' },
          { id: 'tonsils_diff', icon: '👅', titleAr: '٤. اللوز الصديدية مقابل الفيروس', subAr: 'متى نأخذ المضاد الحيوي؟' },
          { id: 'earwax_swabs', icon: '👂', titleAr: '٥. شمع الأذن وكارثة الودانات', subAr: 'طريقة إذابة الشمع بأمان' },
          { id: 'foreign_body', icon: '🚨', titleAr: '٦. دخول حشرة أو خرزة بالأذن', subAr: 'إسعاف الأجسام الغريبة للأطفال' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as EntTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #0f766e' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #0f766e 100%)' : '#ffffff',
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

      {activeTab === 'nosebleed' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🩸 إسعاف نزيف الأنف (الرعاف): تصحيح الخطأ القاتل الذي يفعله 90% من الناس!
          </h2>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '12px' }}>
            <b style={{ color: '#991b1b' }}>⛔ الخطأ الكارثي: «ارفع راسك لورا عشان الدم يقف!»</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 700 }}>
              إرجاع الرأس للخلف لا يوقف النزيف أبداً! بل يجعل الدم ينزل من خلف الأنف إلى البلعوم والمعدة والقصبة الهوائية فيسبب **قيئاً مدمماً وشرقة واختناقاً خطيراً خاصة للأطفال!**
            </p>
          </div>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <b style={{ color: '#166534' }}>✅ الطريقة الطبية الصحيحة (وضع تروتر - Trotter Position):</b>
            <ul className="small" style={{ margin: '6px 0 0', paddingRight: '20px', color: '#14532d', fontWeight: 700, lineHeight: 1.7 }}>
              <li>**اجلس ومِل برأسك للأمام قليلاً** (كأنك تنظر لركبتيك) وتنفس من فمك.</li>
              <li>**اضغط بإصبعي الإبهام والسبابة على «الجزء الطري الغضروفي أسفل الأنف»** (وليس العظمة العلوية!) لمدة **10 دقائق متواصلة بالساعة** دون أن ترفع يدك لتختبر توقف الدم.</li>
              <li>ضع كمادة ثلج فوق جسر الأنف ومؤخرة الرقبة، وبعد توقف النزيف ادهن مرهم مرطب أو مضاد حيوي داخل فتحة الأنف لمنع جفاف الشعيرات (منطقة كيسلباخ).</li>
            </ul>
          </div>
        </section>
      )}

      {activeTab === 'otrivin_trap' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            👃 مصيدة إدمان نقط الأنف (أوتريفين / أوكسيميتازولين) وخطة الفطام منها
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **ما هي المشكلة؟** نقط الأنف المزيلة للاحتقان (أوتريفين، أفرين، أوكسيميتازولين) مسموح بها لمدة **3 إلى 5 أيام كحد أقصى!** استخدامها لأكثر من أسبوع يسبب مرض **"التهاب الأنف الدوائي الارتدادي (Rhinitis Medicamentosa)"** حيث تتضخم غضاريف الأنف وتنسد تماماً بمجرد انتهاء مفعول النقط فتدخل في دائرة إدمان يومي!<br />
            • **خطة الفطام الطبي في 7 أيام:**<br />
            ١. أوقف الأوتريفين في فتحة أنف واحدة فقط (مثلاً اليمين) واستخدم فيها بخاخ ماء البحر (Physiomer) + بخاخ كورتيزون موضعي آمن غير مسبب للإدمان (مثل **فليكسونيز Flixonase أو نازونكس Nasonex أو أفاميس**) مرتين يومياً.<br />
            ٢. بعد 4 أيام ستنفتح الفتحة اليمنى طبيعياً؛ حينها أوقف الأوتريفين تماماً من الفتحة اليسرى!
          </p>
        </section>
      )}

      {activeTab === 'vertigo_bppv' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🌀 عيادة الدوار والدوخة: كيف تفرق بين «دوار الأذن الوسطى الحميد» و«جلطة الاتزان»؟
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **الدوار الموضعي الحميد (BPPV - تحرك كريستالات الأذن الداخلية):** تشعر بأن الغرفة تدور بك كالمروحة لمدة **30 إلى 60 ثانية فقط** عندما تتقلب في السرير أو ترفع رأسك لأعلى؛ لا يصاحبه ضعف في اليد أو تلعثم، ويُعالج بـ **مناورة إيبلي (Epley Maneuver)** لإرجاع الكريستالات لمكانها + أقراص بيتاهيستين (بيتاسيرك Betaserc).<br />
            • **علامات الدوخة الخطيرة المركزية (تستلزم طوارئ مخ وأعصاب فوراً):** دوار مستمر لا يتوقف يصاحبه ازدواج في الرؤية (يرى الشيء اثنين)، أو تلعثم في اللسان، أو عدم القدرة على الوقوف، أو تنميل في الوجه أو الذراع.
          </p>
        </section>
      )}

      {activeTab === 'tonsils_diff' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            👅 التهاب الحلق واللوزتين: متى يكون فيروسياً ومتى يكون بكتيرياً صديدياً (مقياس Centor)؟
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **التهاب الحلق الفيروسي (80% من الحالات):** يصاحبه **رشح، كحة، بحّة في الصوت، وعطس**؛ لا يحتاج مضاداً حيوياً على الإطلاق! يُعالج بالغرغرة الدافئة والاستحلاب والباراسيتامول.<br />
            • **التهاب اللوز البكتيري السبحي (Strep Throat):** يظهر بـ **٤ علامات بدون كحة أو رشح**: (١) حرارة عالية فوق 38.5°، (٢) بقع صديد بيضاء على اللوزتين، (٣) تضخم مؤلم في غدد الرقبة، (٤) غياب الكحة تماماً. هنا يجب أخذ كورس مضاد حيوي (البنسلين / أموكسيسيلين كلافولانات) لمدة **10 أيام كاملة** لمنع الحمى الروماتيزمية على القلب!
          </p>
        </section>
      )}

      {activeTab === 'earwax_swabs' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            👂 شمع الأذن وكارثة أعواد القطن (الودانات)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **القاعدة الذهبية لأطباء الأذن: «لا تدخل في أذنك شيئاً أصغر من كوعك!»** أعواد القطن (الودانات) لا تخرج الشمع، بل تكبسه للداخل فوق طبلة الأذن كالسدادة الأسمنتية وتجرح قناة الأذن مسببة فطريات الأذن المؤلمة!<br />
            • **الطريقة الآمنة لإذابة شمع الأذن المكتوم (بشرط عدم وجود ثقب بالطبلة):** ضع 3-5 نقط من **نقط بيكربونات الصوديوم أو واكسول (Waxsol) أو ماء أكسجين مخفف للأذن أو جلسرين طبي** مرتين يومياً لمدة 4 أيام فيذوب الشمع ويخرج تلقائياً.
          </p>
        </section>
      )}

      {activeTab === 'foreign_body' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🚨 طوارئ دخول حشرة حية أو خرزة أو فول سوداني في أذن أو أنف الطفل
          </h2>
          <p className="small" style={{ fontWeight: 700, lineHeight: 1.7, color: '#7f1d1d' }}>
            • **١. دخول حشرة حية في الأذن:** لا تحاول إخراجها بملقط وهي حية فتخرق الطبلة! أمِل رأس المريض واملأ قناة الأذن بـ **زيت زيتون دافئ أو زيت طعام أو جلسرين**؛ الزيت يخنق الحشرة في ثوانٍ فيتوقف ألمها وتطفو للخارج.<br />
            • **٢. دخول حبة فول أو بسلة أو ورقة في الأذن:** ممنوع وضع ماء أو غسيل الأذن بالماء لأن البقوليات تشرب الماء وتنفش داخل الأذن فيستحيل إخراجها!<br />
            • **٣. أخطر جسم غريب على الإطلاق: «بطارية الساعة الصغيرة المسطحة (Button Battery)»** في الأنف أو الأذن: طوارئ قصوى خلال ساعة لأنها تحرق الغضروف بالكهرباء والقلويات!
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
