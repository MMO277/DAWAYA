import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type ChronicTab = 'diabetes_food' | 'insulin_foot' | 'bp_decoder' | 'hidden_bp_spikers' | 'anticoagulants' | 'thyroid_rules';

export default function ChronicCareClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<ChronicTab>('diabetes_food');

  // BP Decoder state
  const [sysBp, setSysBp] = useState('145');
  const [diaBp, setDiaBp] = useState('92');

  // HbA1c converter state
  const [hba1cVal, setHba1cVal] = useState('7.2');

  const bpEvaluation = useMemo(() => {
    const s = parseInt(sysBp, 10) || 120;
    const d = parseInt(diaBp, 10) || 80;

    if (s >= 180 || d >= 120) {
      return {
        labelAr: '🚨 أزمة ارتفاع ضغط دم حرجة (Hypertensive Crisis)',
        color: '#dc2626',
        bg: '#fef2f2',
        adviceAr: 'تحذير قاطع: لا تضع قرص كابتن أو أبلوكارد تحت اللسان بدون إشراف طبيب لأن الهبوط السريع والمفاجئ للضغط يقلل تروية المخ وقد يسبب جلطة دماغية! خذ جرعتك المعتادة، استرح تماماً، وتوجه لأقرب مستشفى خاصة لو هناك صداع شديد أو ألم بالصدر أو زغللة.',
      };
    }
    if (s >= 140 || d >= 90) {
      return {
        labelAr: '🔴 ارتفاع ضغط الدم - المرحلة الثانية (Stage 2 Hypertension)',
        color: '#b91c1c',
        bg: '#fff1f2',
        adviceAr: 'يستلزم الانتظام الصارم على علاج الضغط اليومي، تقليل الملح والمخللات، ومراجعة طبيب الباطنة أو القلب لضبط الجرعة.',
      };
    }
    if (s >= 130 || d >= 80) {
      return {
        labelAr: '🟡 ارتفاع ضغط الدم - المرحلة الأولى (Stage 1)',
        color: '#d97706',
        bg: '#fffbeb',
        adviceAr: 'راقب ضغطك يومياً في نفس الموعد بعد راحة 5 دقائق، قلل الصوديوم والقهوة، وامشِ 30 دقيقة يومياً.',
      };
    }
    if (s < 90 || d < 60) {
      return {
        labelAr: '🔵 هبوط في ضغط الدم (Hypotension)',
        color: '#0284c7',
        bg: '#e0f2fe',
        adviceAr: 'اشرب سوائل وعصائر، ارفع قدميك قليلاً عند الشعور بالدوخة، وراجع الطبيب لو كنت تأخذ جرعة عالية من أدوية الضغط أو مدرات البول.',
      };
    }
    return {
      labelAr: '🟢 ضغط دم طبيعي ومثالي (Normal Blood Pressure)',
      color: '#16a34a',
      bg: '#f0fdf4',
      adviceAr: 'قراءة ممتازة! حافظ على نمط حياتك الصحي وشرب الماء بانتظام.',
    };
  }, [sysBp, diaBp]);

  const eAgValue = useMemo(() => {
    const a1c = parseFloat(hba1cVal) || 6.5;
    // Nathan formula: eAG (mg/dL) = 28.7 * A1C - 46.7
    return Math.round(28.7 * a1c - 46.7);
  }, [hba1cVal]);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #3730a3 55%, #4f46e5 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#e0e7ff' }}>
            🫀 {tr(lang, 'عيادة واستشاري الباطنة والغدد الصماء والقلب (خبرة 40 عاماً)', 'Senior Internal Medicine, Diabetes & Cardiology Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة الباطنة والغدد: السكري، الضغط، القلب، السيولة والغدة الدرقية', 'Complete Diabetes, Hypertension, Anticoagulation & Thyroid Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'ضبط السكر التراكمي وخريطة الأكل المصري، حفظ الإنسولين والقدم السكري، مترجم قراءات الضغط والأدوية الخفية التي ترفعه، وضوابط الماريفان والغدة الدرقية.',
            'Glycemic control, insulin storage & diabetic foot care, BP crisis decoder, hidden BP spikers, Warfarin Vitamin K rules, and thyroid absorption.'
          )}
        </p>

        {/* Quick Links to Attached Emergency Tools */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
          <Link to="/hypo-rescue" className="btn small" style={{ background: '#dc2626', color: '#fff', fontWeight: 800, textDecoration: 'none', borderRadius: '10px' }}>
            🚨 خطة إنقاذ هبوط السكر الحاد (قاعدة 15)
          </Link>
          <Link to="/steroid-taper" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '10px' }}>
            📉 حاسبة سحب الكورتيزون الآمن
          </Link>
          <Link to="/inhaler-counter" className="btn small" style={{ background: '#138866', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '10px' }}>
            🫁 عداد رصيد بخاخات الصدر
          </Link>
        </div>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'diabetes_food', icon: '🩸', titleAr: '١. السكر والتراكمي والأكل', subAr: 'حاسبة A1c وترتيب الوجبة' },
          { id: 'insulin_foot', icon: '💉', titleAr: '٢. الإنسولين والقدم السكري', subAr: 'صلاحية القلم وفحص القدم' },
          { id: 'bp_decoder', icon: '💓', titleAr: '٣. مترجم قراءات الضغط', subAr: 'طوارئ الضغط وقرص تحت اللسان' },
          { id: 'hidden_bp_spikers', icon: '☕', titleAr: '٤. رافعات الضغط الخفية', subAr: 'العرقسوس، الفوارات، الكونجستال' },
          { id: 'anticoagulants', icon: '🛡️', titleAr: '٥. أدوية السيولة والماريفان', subAr: 'تعارض الملوخية والسبانخ' },
          { id: 'thyroid_rules', icon: '🦋', titleAr: '٦. دستور الغدة الدرقية', subAr: 'توقيت الالتروكسين والامتصاص' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as ChronicTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #4f46e5' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #4f46e5 100%)' : '#ffffff',
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

      {activeTab === 'diabetes_food' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🩸 حاسبة تحويل السكر التراكمي (HbA1c) وخدعة ترتيب الأكل لمنع قفزة السكر
          </h2>

          <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>أدخل رقم السكر التراكمي (HbA1c %):</label>
              <input
                type="number"
                step="0.1"
                value={hba1cVal}
                onChange={(e) => setHba1cVal(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 800, width: '140px' }}
              />
            </div>
            <div>
              <span className="small muted" style={{ display: 'block' }}>متوسط سكرك اليومي التقريبي آخر 3 أشهر:</span>
              <strong style={{ fontSize: '1.6rem', color: '#4f46e5', fontWeight: 900 }}>{eAgValue} مجم/ديسيلتر (mg/dL)</strong>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <b style={{ color: '#166534' }}>🥗 الخدعة الذهبية لترتيب الأكل (تخفض قفزة السكر بعد الغداء بنسبة 40%!):</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 600, lineHeight: 1.6 }}>
              لا تبدأ وجبتك أبداً بالعيش أو الأرز! ابدأ بـ **(١) طبق السلطة الخضراء (الألياف تبطن الأمعاء)، ثم (٢) البروتين واللحوم أو الفول، واجعل (٣) النشويات (العيش البلدي بالردة أو الأرز أو الفاكهة) في آخر الوجبة**؛ هذا الترتيب يبطئ امتصاص الجلوكوز تماماً ويمنع الخمول بعد الأكل!
            </p>
          </div>
        </section>
      )}

      {activeTab === 'insulin_foot' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💉 قواعد حفظ قلم الإنسولين ودستور حماية «القدم السكري»
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: 'var(--tint)', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <b style={{ color: '#0D1F38' }}>١. قاعدة الـ 28 يوماً لقلم الإنسولين المفتوح:</b>
              <p className="small" style={{ margin: '4px 0 0', fontWeight: 600 }}>
                الأقلام الاحتياطية غير المفتوحة تُحفظ في **رف الثلاجة الأوسط (وليس باب الثلاجة ولا الفريزر!)**. أما القلم الذي تستخدمه حالياً فيُحفظ في درجة حرارة الغرفة المعتدلة (أقل من 25°) لأن حقن الإنسولين وهو بارد يسبب ألماً وتليفاً دهنياً تحت الجلد، وتنتهي صلاحيته بعد **28 يوماً من فتحه** حتى لو تبقى فيه إنسولين!
              </p>
            </div>
            <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
              <b style={{ color: '#991b1b' }}>٢. الوصايا الخمس لحماية القدم السكري من القرح الصامتة:</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 600, lineHeight: 1.65 }}>
                • افحص باطن قدميك وبين الأصابع يومياً بمرآة قبل النوم.<br />
                • جفف ما بين الأصابع جيداً بعد الوضوء لمنع الفطريات التي تفتح باباً للبكتيريا، ولكن **لا تضع كريم مرطب بين الأصابع** (ضع المرطب على الكعب وظهر القدم فقط).<br />
                • قص الأظافر بشكل مستقيم وليس دائرياً غائراً في اللحم.<br />
                • لا تمشِ حافي القدمين أبداً، ولا تضع قدميك أمام الدفاية أو في ماء ساخن دون اختبار حرارته بيدك أولاً.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'bp_decoder' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💓 مترجم قراءات جهاز الضغط وتصحيح خطأ «قرص تحت اللسان»
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>الضغط الانقباضي (العالي):</label>
              <input type="number" value={sysBp} onChange={(e) => setSysBp(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 800, width: '120px' }} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>الضغط الانبساطي (الواطي):</label>
              <input type="number" value={diaBp} onChange={(e) => setDiaBp(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 800, width: '120px' }} />
            </div>
          </div>
          <div style={{ background: bpEvaluation.bg, border: `2px solid ${bpEvaluation.color}`, padding: '16px', borderRadius: '14px' }}>
            <b style={{ color: bpEvaluation.color, fontSize: '1.1rem', display: 'block', marginBottom: '6px' }}>{bpEvaluation.labelAr}</b>
            <p className="small" style={{ margin: 0, fontWeight: 700, color: '#1e293b', lineHeight: 1.6 }}>{bpEvaluation.adviceAr}</p>
          </div>
        </section>
      )}

      {activeTab === 'hidden_bp_spikers' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #d97706' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#92400e' }}>
            ☕ 4 أشياء يومية خفية ترفع ضغط الدم بشدة وتبطل مفعول دواء الضغط!
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700, color: '#78350f' }}>
            <li>**١. مشروب العرقسوس (Licorice):** يحتوي على حمض الجليسريزيك الذي يحبس الصوديوم والماء ويطرد البوتاسيوم فيرفع الضغط لأرقام خطيرة!</li>
            <li>**٢. أدوية البرد والرشح (كونجستال، كومتركس، باور كابس، نقط أوتريفين للكبار بكثرة):** تحتوي على مواد قابضة للشرايين ترفع الضغط فوراً.</li>
            <li>**٣. مسكنات العظام والصداع (فولتارين، بروفين، كتافلام، كيتوفان):** تحبس الأملاح في الكلى وتعاكس عمل أدوية الضغط.</li>
            <li>**٤. فوارات الهضم والحموضة المالحة (فوار فواكه، فوار راني):** الكيس الواحد يحتوي على كمية صوديوم تعادل ربع ملعقة ملح!</li>
          </ul>
        </section>
      )}

      {activeTab === 'anticoagulants' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🛡️ دستور مرضى السيولة (الماريفان Warfarin مقابل إليكويس وزاريلتو)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **تعارض الماريفان مع الأكلات الخضراء (فيتامين K):** يعمل الماريفان عن طريق تثبيط فيتامين K؛ لذلك فإن أكل وجبة كبيرة مفاجئة من **السبانخ، الملوخية، البروكلي، الكرنب، أو الخس والجرجير والشاي الأخضر** يبطل مفعول الماريفان ويخفض رقم السيولة (INR) فيعرضك للجلطات! القاعدة: كل خضرواتك بكمية صغيرة ثابتة يومياً دون إسراف مفاجئ.<br />
            • **أدوية السيولة الحديثة (إليكويس Eliquis / زاريلتو Xarelto):** لا تتأثر بالملوخية أو السبانخ ولا تحتاج لتحليل INR شهري، ولكن يُمنع التوقف عنها ليوم واحد بدون أمر طبيب القلب، ويُمنع معها أخذ مسكنات (كالبروفين والفولتارين) لمنع نزيف المعدة.
          </p>
        </section>
      )}

      {activeTab === 'thyroid_rules' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🦋 الشروط الذهبية لقرص الغدة الدرقية (التروكسين Eltroxin / إيوثيروكس Euthyrox)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            هرمون الغدة الدرقية حساس جداً في امتصاصه؛ إذا أخذته بطريقة خاطئة سيظل تحليل الـ TSH مرتفعاً رغم التزامك بالدواء:<br />
            ١. **يُؤخذ على معدة فارغة تماماً فور الاستيقاظ مع كوب ماء عادي فقط.**<br />
            ٢. **انتظر 60 دقيقة كاملة (أو 30 دقيقة على الأقل) قبل تناول الإفطار أو شرب الشاي أو القهوة أو الحليب!**<br />
            ٣. **افصل 4 ساعات كاملة** بين قرص الغدة وأقراص الكالسيوم أو الحديد أو أدوية الحموضة لأنها تلتصق به في المعدة وتمنع امتصاصه.
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
