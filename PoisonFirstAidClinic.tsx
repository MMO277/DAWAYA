import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type PoisonTab = 'caustics_bleach' | 'pill_overdose' | 'dog_bite_rabies' | 'scorpion_jellyfish' | 'co_gas_heater' | 'heatstroke_electric';

export default function PoisonFirstAidClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<PoisonTab>('caustics_bleach');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #7f1d1d 55%, #dc2626 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#fecaca' }}>
            🚑 {tr(lang, 'عيادة واستشاري السموم الإكلينيكية وطب الطوارئ (خبرة 40 عاماً)', 'Senior Clinical Toxicology & Emergency ER Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (14 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة طوارئ السموم، الكاويات، العقر، والإسعافات الأولية الشاملة', 'Complete Poison Control, Animal Bites & Emergency First-Aid Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'بروتوكول إنقاذ بلع الأطفال للكلور والبطاس والأدوية، جدول الـ 5 جرعات لعضة الكلب والسعار، لسعة قنديل البحر والعقرب، والتسمم بغاز السخان (القاتل الصامت).',
            'Caustic bleach/kerosene ingestion protocol, pediatric drug overdose, dog bite rabies schedule, jellyfish/scorpion stings, and CO gas poisoning.'
          )}
        </p>

        {/* Emergency Hotlines Banner */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
          <a href="tel:123" className="btn small" style={{ background: '#ffffff', color: '#991b1b', fontWeight: 900, textDecoration: 'none', borderRadius: '10px' }}>
            🚑 إسعاف مصر الطارئ: 123
          </a>
          <a href="tel:137" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '10px' }}>
            ☎️ طوارئ وزارة الصحة والسموم: 137 / 0223640402
          </a>
        </div>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'caustics_bleach', icon: '🧪', titleAr: '١. بلع الكلور والبطاس والجاز', subAr: 'لماذا يُمنع التقيؤ قطعاً؟' },
          { id: 'pill_overdose', icon: '💊', titleAr: '٢. بلع الطفل للأدوية والبطارية', subAr: 'الفحم النشط وبطارية الساعة' },
          { id: 'dog_bite_rabies', icon: '🐕', titleAr: '٣. عضة الكلب أو خربشة القطة', subAr: 'جدول الـ 5 حقن لمصل السعار' },
          { id: 'scorpion_jellyfish', icon: '🦂', titleAr: '٤. لسعة قنديل البحر والعقرب', subAr: 'الخل للبحر وربط العضو للعقرب' },
          { id: 'co_gas_heater', icon: '🔥', titleAr: '٥. غاز السخان وتسمم الكلور', subAr: 'أول أكسيد الكربون وخلط الفلاش' },
          { id: 'heatstroke_electric', icon: '⚡', titleAr: '٦. ضربة الشمس والصعق الكهربائي', subAr: 'الإسعاف الفوري في الثواني الأولى' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as PoisonTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #dc2626' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #dc2626 100%)' : '#ffffff',
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

      {activeTab === 'caustics_bleach' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🧪 طوارئ شرب الطفل للكلور، البوتاس (مسلك البالوعات)، الفلاش، أو الجاز/التنر!
          </h2>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '12px' }}>
            <b style={{ color: '#991b1b' }}>⛔ القاعدة الذهبية الأولى: إياك أن تُجبر الطفل على التقيؤ أو تدخل إصبعك في حلقه!</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 700, lineHeight: 1.65 }}>
              • **في الكاويات (البوتاس، الفلاش، ماء النار، الكلور المركز):** المادة الكاوية حرقت المريء وهي نازلة؛ إذا جعلته يتقيأ ستحرق المريء للمرة الثانية وهي طالعة وتسبب **ثقباً كاملاً في المريء!** كما يمنع إعطاؤه خل أو ليمون لمعادلة البطاس لأن التفاعل ينتج حرارة غليان داخل المعدة!<br />
              • **في المواد البترولية (الجاز، البنزين، التنر، النفط):** التقيؤ يجعل قطرات الجاز تدخل للرئة وتسبب **التهاباً رئوياً كيميائياً قاتلاً** في دقائق!
            </p>
          </div>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <b style={{ color: '#166534' }}>✅ التصرف الصحيح في أول دقيقة:</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 700 }}>
              ١. اغسل فم وشفايف الطفل بماء فاتر وغير ملابسه الملوثة.<br />
              ٢. في حالة الكاويات فقط (إذا كان الطفل واعياً ويستطيع البلع ولا يتقيأ): أعطه نصف كوب صغير من **الحليب البارد أو الماء** لتخفيف المادة على جدار المريء، وتوجه لمركز السموم فوراً ومعك الزجاجة التي شرب منها.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'pill_overdose' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💊 طوارئ بلع الطفل لشريط دواء (أدوية ضغط أو سكر الجد) أو بطارية مسطحة
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **أخطر 4 حبات دواء إذا بلع الطفل منها قرصاً واحداً فقط:** (١) أقراص السكر (تحرق سكر دم الطفل وتسبب غيبوبة)، (٢) أقراص الضغط والقلب (توقف نبض القلب)، (٣) أقراص الحديد بكمية كبيرة، (٤) مضادات الاكتئاب.<br />
            • **التصرف:** لا تنتظر ظهور الأعراض! اذهب لأقرب مستشفى أو مركز سموم خلال الساعة الأولى لإعطائه **«الفحم الطبي النشط (Activated Charcoal)»** الذي يمتص الدواء من المعدة قبل وصوله للدم.<br />
            • **🚨 بلع بطارية الساعة أو اللعبة الدائرية (Button Battery):** طوارئ منظار فورية خلال ساعتين لأنها تفرغ شحنتها في المريء وتثقبه! (نصيحة إسعافية معتمدة للأطفال فوق سنة أثناء الطريق للمستشفى في حالة بلع البطارية فقط: إعطاء ملعقة عسل نحل كل 10 دقائق لعزل البطارية عن جدار المريء حتى يدخل غرفة المنظار).
          </p>
        </section>
      )}

      {activeTab === 'dog_bite_rabies' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🐕 بروتوكول عضة الكلب أو القطة أو الخربشة الدامية (الوقاية من السعار القاتل)
          </h2>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
            <b style={{ color: '#166534' }}>✅ الخطوة الأولى التي تنقذ الحياة بنسبة 80% قبل الذهاب للمستشفى:</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 700 }}>
              اغسل جرح العضة أو الخربشة فوراً تحت **ماء جاري غزير وصابون لمدة 15 دقيقة متواصلة بالساعة!** الصابون يذيب الغلاف الدهني لفيروس السعار (Rabies Virus) ويقتله في الجرح، ثم طهره ببيتادين.<br />
              ⚠️ **ممنوع خياطة جرح عضة الكلب أو تغطيته بإحكام!** يُترك مفتوحاً للتهوية مع أخذ مضاد حيوي (أوجمنتين) وحقنة التيتانوس.
            </p>
          </div>
          <div style={{ background: 'var(--tint)', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <b style={{ color: '#0D1F38' }}>💉 جدول الـ 5 جرعات لمصل السعار في مستشفى الحميات (تُؤخذ في عضلة الكتف وليس البطن!):</b>
            <p className="small" style={{ margin: '4px 0 0', fontWeight: 700 }}>
              • **الجرعة الأولى:** اليوم 0 (يوم العضة فوراً).<br />
              • **الجرعة الثانية:** اليوم 3.<br />
              • **الجرعة الثالثة:** اليوم 7.<br />
              • **الجرعة الرابعة:** اليوم 14.<br />
              • **الجرعة الخامسة:** اليوم 28.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'scorpion_jellyfish' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🦂 إسعاف لسعة قنديل البحر في المصيف، لدغة العقرب والثعبان، وحساسية النحل
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **لسعة قنديل البحر (Jellyfish):** ممنوع غسلها بماء عذب من الحنفية (الماء العذب يفجر الخلايا اللاسعة المتبقية على الجلد!). اغسلها بـ **ماء البحر المالح + الخل الأبيض لمدة 10 دقائق** لمعادلة السم القلوي، ثم ادهن كريم كورتيزون مسكن.<br />
            • **لدغة العقرب أو الثعبان:** ثبت الطرف المصاب واجعله في مستوى أقل من القلب، واغسله بالماء والصابون وتوجه للمستشفى لأخذ المصل. **ممنوع تشريط الجرح بالموس أو مص السم بالفم أو ربط العضو بحبل ضاغط يقطع الدم!**
          </p>
        </section>
      )}

      {activeTab === 'co_gas_heater' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', background: '#fef2f2', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🔥 القاتل الصامت في الشتاء: اختناق غاز السخان، وكارثة خلط «الكلور مع الفلاش»!
          </h2>
          <p className="small" style={{ color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
            • **١. غاز أول أكسيد الكربون (سخان الغاز أو الفحم في حمام مغلق):** غاز بلا لون ولا رائحة؛ يسبب دوخة وصداعاً وخدراً في الأطراف فينام الشخص داخل البانيو ويفقد الوعي في دقائق! اترك دائماً فتحة تهوية (شباك أو شفاط) أثناء الاستحمام.<br />
            • **٢. خلط الكلور مع الفلاش أو ماء النار أو الأمونيا أثناء تنظيف الحمام:** ينتج فوراناً لغاز **الكلورين السام الحارق للرئة (Chloramine / Chlorine Gas)** الذي يسبب اختناقاً وارتشاحاً رئوياً حاداً؛ اخرج للهواء الطلق فوراً واستنشق بخار ماء وراجع الطوارئ إذا حدث ضيق تنفس.
          </p>
        </section>
      )}

      {activeTab === 'heatstroke_electric' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            ⚡ إسعاف ضربة الشمس الحادة والصعق الكهربائي
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **ضربة الشمس (Heatstroke):** حرارة جسم تتجاوز 40° مع جلد ساخن وجاف وتشوش ذهني؛ انقل المصاب للظل فوراً، انزع ملابسه الخارجية، رش جسمه بالماء الفاتر مع توجيه مروحة عليه وضع كمادات ثلج تحت الإبطين وبين الفخذين والرقبة.<br />
            • **الصعق الكهربائي:** إياك أن تلمس المصاب بيدك وهو لا يزال ملامساً للسلك! افصل القاطع الرئيسي للكهرباء أولاً أو أبعد السلك بخشبة جافة تماماً، ثم افحص التنفس والنبض.
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
