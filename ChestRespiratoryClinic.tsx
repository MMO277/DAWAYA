import SmartMedDoseReminderBadge from './SmartMedDoseReminderBadge';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type ChestTab = 'nebulizer_guide' | 'cough_decoder' | 'inhaler_technique' | 'asthma_triggers' | 'smoking_vape' | 'pneumonia_redflags';

export default function ChestRespiratoryClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<ChestTab>('nebulizer_guide');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #065f46 55%, #10b981 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#d1fae5' }}>
            🫁 {tr(lang, 'عيادة واستشاري الأمراض الصدرية والحساسية والتنفس (خبرة 40 عاماً)', 'Senior Pulmonology, Asthma & Respiratory Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (20 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة الصدر، حساسية الربو، جلسات البخار (النيبولايزر)، والكحة المزمنة', 'Complete Pulmonology, Nebulizer Masterclass, Asthma & Smoking Cessation Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'الدليل العملي لتحضير جلسات البخار المنزلية بأمان، مفرّق الكحة المزمنة (الصدر مقابل المعدة ودواء الضغط)، تقنية البخاخات الصحيحة، وخطة الإقلاع عن التدخين والفيب.',
            'Home nebulizer dilution rules, chronic cough differentiator, inhaler rinsing rules, and smoking/vape cessation timeline.'
          )}
        </p>

        <div style={{ marginTop: '14px' }}>
          <Link to="/inhaler-counter" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '10px' }}>
            🫁 فتح عداد الرصيد المتبقي لبخاخات الصدر والربو
          </Link>
        </div>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'nebulizer_guide', icon: '💨', titleAr: '١. دليل جلسات البخار (النيبولايزر)', subAr: 'فاركولين، أتروفنت، وبالميكورت' },
          { id: 'cough_decoder', icon: '🗣️', titleAr: '٢. مفرّق الكحة المزمنة', subAr: 'الحساسية، الارتجاع، ودواء الضغط' },
          { id: 'inhaler_technique', icon: '🫁', titleAr: '٣. أخطاء بخاخات الصدر', subAr: 'لماذا المضمضة بعدها إلزامية؟' },
          { id: 'asthma_triggers', icon: '🛡️', titleAr: '٤. مثيرات أزمة الربو الخفية', subAr: 'المسكنات، الأتربة، وحشرة الفراش' },
          { id: 'smoking_vape', icon: '🚭', titleAr: '٥. الإقلاع عن التدخين والفيب', subAr: 'جدول تعافي الرئة بالساعة واليوم' },
          { id: 'pneumonia_redflags', icon: '🚨', titleAr: '٦. علامات الالتهاب الرئوي', subAr: 'نقص الأكسجين وسحب الضلوع' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as ChestTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #059669' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #059669 100%)' : '#ffffff',
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

      {activeTab === 'nebulizer_guide' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #059669' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💨 الدستور الطبي لتحضير جلسات البخار المنزلية (النيبولايزر Nebulizer)
          </h2>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '12px' }}>
            <b style={{ color: '#991b1b' }}>⛔ خطأ قاتل في جهاز البخار: إياك أن تضع «ماء مقطر (Distilled Water)» أو ماء حنفية في الجهاز!</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 700 }}>
              الماء المقطر خالٍ من الأملاح (Hypotonic)؛ عند استنشاقه في الرئة يسبب **انقباضاً وتشنجاً حاداً في الشعب الهوائية (Bronchospasm)** ويزيد الكتمة! السائل الوحيد المسموح به للتخفيف في جهاز البخار هو **«محلول الملح المعقم 0.9% (Normal Saline)»** أو محلول الملح 3% في حالات البلغم اللزج بأمر الطبيب.
            </p>
          </div>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <b style={{ color: '#166534' }}>✅ قواعد جلسة البخار الناجحة للأطفال والكبار:</b>
            <ul className="small" style={{ margin: '6px 0 0', paddingRight: '20px', color: '#14532d', fontWeight: 700, lineHeight: 1.7 }}>
              <li>**١. بعد جلسة الكورتيزون الاستنشاقي (بالميكورت Pulmicort / بوديكس):** اغسل وجه الطفل حول الفم والأنف بالماء، واجعله يشرب ماءً أو يمضمض فمه فوراً لمنع ظهور فطريات بيضاء في الفم أو بحّة في الصوت.</li>
              <li>**٢. نقط الفاركولين (Farcolin):** تحسب بدقة شديدة حسب وزن الطفل بأمر الطبيب لأن زيادتها تسبب رعشة في اليدين وتسارعاً شديداً في ضربات القلب.</li>
              <li>**٣. الجلوس قائماً أثناء الجلسة** وتثبيت الماسك بإحكام على الأنف والفم (إبعاد الماسك 2 سم عن الوجه يضيع 80% من جرعة البخار في الهواء!).</li>
            </ul>
          </div>
        </section>
      )}

      {activeTab === 'cough_decoder' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🗣️ الكحة المستمرة لأكثر من 3 أسابيع: كيف تعرف سببها الحقيقي؟
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ background: 'var(--tint)', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '0.88rem' }}>
              <b>١. كحة تشتد الفجر وعند الضحك أو الجري أو التعرض للهواء البارد مع تزييق بالصدر:</b> كحة **حساسية الصدر والربو الشعبي (Asthma)**؛ لا تستجيب لأشربة الكحة العادية بل تحتاج موسع شعب وبخاخ وقائي.
            </div>
            <div style={{ background: 'var(--tint)', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '0.88rem' }}>
              <b>٢. كحة جافة تشتد بمجرد الاستلقاء على السرير بعد العشاء مع شرقة وحرقان بالحلق:</b> كحة **ارتجاع المريء الصامت (GERD Cough)**؛ علاجها علاج المعدة ووقف الأكل قبل النوم بـ 3 ساعات!
            </div>
            <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#92400e', border: '1px solid #fde68a' }}>
              <b>٣. كحة جافة ناشفة مستمرة بدأت بعد أخذ دواء ضغط (مثل كابوتن، إيزابريل، زيستريل، كوفرسيل):</b> تسمى **«كحة مثبطات ACEi»** وتحدث لـ 15% من المرضى؛ لا ينفع معها أي دواء كحة، وتختفي تماماً بمجرد أن يغير لك طبيب القلب دواء الضغط لعائلة أخرى (مثل تارج أو أتاكاند)!
            </div>
          </div>
        </section>
      )}

      {activeTab === 'inhaler_technique' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🫁 خطوات استخدام بخاخ الصدر الصحيحة (ولماذا تفشل البخاخة مع 70% من المرضى؟)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **١. رج البخاخ جيداً، وأخرج زفيراً كاملاً بعيداً عن البخاخ** لتفريغ رئتيك أولاً.<br />
            • **٢. ضع البخاخ في الفم، واضغط مع أخذ شهيق عميق وبطيء جداً**، ثم **احبس نفسك لمدة 10 ثوانٍ كاملة** (حبس النفس هو الذي يسمح للدواء بالترسب داخل الشعب الهوائية بدلاً من خروجه مع الزفير!).<br />
            • **٣. المضمضة بالماء وبصقه إلزامية** بعد أي بخاخ وقائي يحتوي على كورتيزون (سيريتيد، فوستر، سيمبيكورت، فلوكسوتايد، ميفلونايد).
          </p>
        </section>
      )}

      {activeTab === 'asthma_triggers' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🛡️ تحذير قاتل لمرضى حساسية الصدر والربو: الأدوية التي تهيج أزمة ربو فورية!
          </h2>
          <p className="small" style={{ color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
            • **١. المسكنات ومضادات الالتهاب (الأسبرين، البروفين، الفولتارين، الكتافلام):** في 10-20% من مرضى الربو، قرص مسكن واحد يحول مسار حمض الأراكيدونيك لإنتاج (الليكوترينات) القابضة للشعب الهوائية فيسبب أزمة ربو واختناقاً عنيفاً خلال ساعة! المسكن الآمن لمريض الربو هو **الباراسيتامول**.<br />
            • **٢. أدوية تنظيم ضربات القلب والضغط غير الانتقائية (إندرال Inderal / بروبرانولول):** تغلق مستقبلات بيتا-2 في الرئة وتسبب ضيق شعب فوري لمريض الربو!
          </p>
        </section>
      )}

      {activeTab === 'smoking_vape' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#166534' }}>
            🚭 ماذا يحدث في رئتيك وجسمك بالساعة واليوم بمجرد إيقاف السجائر والفيب (Vape)؟
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700, color: '#14532d' }}>
            <li>**بعد 20 دقيقة:** يعود ضغط الدم ومعدل نبض القلب للمستوى الطبيعي.</li>
            <li>**بعد 12 ساعة:** ينخفض غاز أول أكسيد الكربون السام في الدم ويرتفع الأكسجين الكامل للأعضاء.</li>
            <li>**بعد 72 ساعة:** تبدأ أهداب الشعب الهوائية في الاستيقاظ وطرد البلغم والسموم المتراكمة (كحة تنظيف الرئة الإيجابية!).</li>
            <li>**بعد أسبوعين إلى 3 أشهر:** تتحسن كفاءة الرئة والنهجان أثناء صعود السلم بنسبة 30%.</li>
          </ul>
        </section>
      )}

      {activeTab === 'pneumonia_redflags' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', background: '#fef2f2', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🚨 علامات تحول نزلة البرد إلى «التهاب رئوي (Pneumonia)» يستلزم الطوارئ
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700, color: '#7f1d1d' }}>
            <li>انخفاض نسبة تشبع الأكسجين بجهاز البالس أوكسيميتر (Pulse Oximeter) عن **92%**.</li>
            <li>نهجان سريع مع **انجذاب الجلد للداخل بين الضلوع وأسفل الرقبة** مع كل شهيق، أو ازرقاق الشفايف.</li>
            <li>عودة السخونة العالية والنهجان وألم الصدر الوخزي بعد أن كان المريض قد بدأ يتحسن من دور البرد.</li>
          </ul>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
