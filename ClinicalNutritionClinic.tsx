import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type NutritionTab = 'tdee_calc' | 'glp1_injections' | 'orlistat_pills' | 'intermittent_fasting' | 'insulin_resistance' | 'thinness_gain';

export default function ClinicalNutritionClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<NutritionTab>('tdee_calc');

  // TDEE Calculator inputs
  const [weightKg, setWeightKg] = useState('85');
  const [heightCm, setHeightCm] = useState('168');
  const [ageY, setAgeY] = useState('32');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [activity, setActivity] = useState('1.375');

  const nutritionMetrics = useMemo(() => {
    const w = parseFloat(weightKg) || 75;
    const h = parseFloat(heightCm) || 165;
    const a = parseFloat(ageY) || 30;
    const act = parseFloat(activity) || 1.375;

    // Mifflin-St Jeor Equation
    const bmr = gender === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee = Math.round(bmr * act);
    const weightLossCals = Math.max(1200, tdee - 500);
    const proteinGrams = Math.round(w * 1.4); // 1.4g/kg to preserve muscle & hair during weight loss
    const waterLiters = Math.round((w * 0.035) * 10) / 10;

    return { bmr: Math.round(bmr), tdee, weightLossCals, proteinGrams, waterLiters };
  }, [weightKg, heightCm, ageY, gender, activity]);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #15803d 55%, #16a34a 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#dcfce7' }}>
            🥗 {tr(lang, 'عيادة واستشاري التغذية العلاجية والسمنة (خبرة 40 عاماً)', 'Senior Clinical Nutrition & Bariatric Medicine Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (20 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة التغذية العلاجية، حقن التخسيس الحديثة (GLP-1)، والصيام المتقطع', 'Complete Clinical Nutrition, GLP-1 Weight Loss & Metabolic Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'حاسبة السعرات والبروتين لحماية العضلات والشعر، الدليل الطبي الآمن لحقن التخسيس (أوزيمبيك، مونجارو، ساكسندا)، كبسولات الأورليستات، وعلاج مقاومة الإنسولين والنحافة.',
            'TDEE & protein calculator, safe GLP-1 injection protocol (Ozempic/Mounjaro/Saxenda), Orlistat vitamin rules, intermittent fasting, and insulin resistance.'
          )}
        </p>

        {/* Direct Link to Chronic Meal Planner */}
        <div style={{ marginTop: '16px', padding: '14px 18px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid #CFD29D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ color: '#ffffff', fontSize: '1rem', display: 'block' }}>
              🥗 هل تعاني من السكر أو الضغط أو الكلى أو النقرس؟
            </strong>
            <span style={{ color: '#d1fae5', fontSize: '0.86rem' }}>
              افتح مُولّد وجبات الأمراض المزمنة لتوليد جدول وجبات يومي كامل بأكلات مصرية في بيتك!
            </span>
          </div>
          <Link to="/meal-planner" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '12px' }}>
            🥗 افتح مُولّد الوجبات الآن ←
          </Link>
        </div>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'tdee_calc', icon: '🔥', titleAr: '١. حاسبة السعرات والبروتين', subAr: 'حماية الشعر والعضل أثناء الدايت' },
          { id: 'glp1_injections', icon: '💉', titleAr: '٢. حقن التخسيس (أوزيمبيك/مونجارو)', subAr: 'الممنوعين منها وشروط البنج' },
          { id: 'orlistat_pills', icon: '💊', titleAr: '٣. كبسولات التخسيس (أورليستات)', subAr: 'تعويض الفيتامينات الذائبة' },
          { id: 'intermittent_fasting', icon: '⏳', titleAr: '٤. الصيام المتقطع (16/8)', subAr: 'حرق الدهون العنيدة والأوتوفاجي' },
          { id: 'insulin_resistance', icon: '🩸', titleAr: '٥. علاج مقاومة الإنسولين', subAr: 'اسمرار الرقبة ودهون البطن' },
          { id: 'thinness_gain', icon: '💪', titleAr: '٦. علاج النحافة الصحية', subAr: 'تحذير كورتيزون التسمين والديكسازون!' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as NutritionTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #16a34a' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #15803d 100%)' : '#ffffff',
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

      {activeTab === 'tdee_calc' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🔥 حاسبة السعرات الحرارية والاحتياج اليومي من البروتين والمياه
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>الوزن الحالي (كجم):</label>
              <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>الطول (سم):</label>
              <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>العمر (سنة):</label>
              <input type="number" value={ageY} onChange={(e) => setAgeY(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>النوع:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'male', icon: '👨', label: 'ذكر' },
                  { id: 'female', icon: '👩', label: 'أنثى' },
                ].map((item) => {
                  const active = gender === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGender(item.id as any)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: active ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                        background: active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: active ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      {active && <span style={{ color: '#10b981' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>مستوى النشاط:</label>
              <select value={activity} onChange={(e) => setActivity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }}>
                <option value="1.2">قليل الحركة (مكتبي)</option>
                <option value="1.375">نشاط خفيف (مشي 3 أيام/أسبوع)</option>
                <option value="1.55">نشاط متوسط (رياضة 4-5 أيام)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <span className="small muted">سعرات ثبات الوزن (TDEE):</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0D1F38' }}>{nutritionMetrics.tdee} سعر/يوم</div>
            </div>
            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '2px solid #22c55e' }}>
              <span className="small" style={{ color: '#166534', fontWeight: 700 }}>سعرات نزول الدهون الآمن:</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803d' }}>{nutritionMetrics.weightLossCals} سعر/يوم</div>
            </div>
            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <span className="small muted">البروتين اليومي لمنع الترهل وسقوط الشعر:</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7' }}>{nutritionMetrics.proteinGrams} جرام بروتين</div>
            </div>
            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <span className="small muted">احتياج الماء اليومي لحرق الدهون:</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0891b2' }}>{nutritionMetrics.waterLiters} لتر ماء</div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'glp1_injections' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            💉 الدستور الطبي الآمن لحقن التخسيس الحديثة (أوزيمبيك Ozempic، مونجارو Mounjaro، ساكسندا Saxenda)
          </h2>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '12px' }}>
            <b style={{ color: '#991b1b' }}>⛔ 4 فئات ممنوعة منعاً باتاً من أخذ حقن التخسيس GLP-1:</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 700, lineHeight: 1.65 }}>
              ١. من لديه تاريخ شخصي أو عائلي لـ **سرطان الغدة الدرقية النخاعي (Medullary Thyroid Carcinoma)**.<br />
              ٢. من سبق إصابته بـ **التهاب البنكرياس الحاد (Acute Pancreatitis)** أو حصوات مرارية نشطة.<br />
              ٣. الحوامل والمرضعات (يجب إيقافها قبل الحمل بشهرين على الأقل).<br />
              ٤. مرضى خزل وشلل المعدة السكري الشديد.
            </p>
          </div>
          <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a', marginBottom: '12px' }}>
            <b style={{ color: '#92400e' }}>⚠️ تحذير جراحي حاسم قبل أي عملية أو منظار:</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#78350f', fontWeight: 700 }}>
              هذه الحقن تبطئ تفريغ المعدة، فتبقى الأكلات في المعدة حتى لو صمت 8 ساعات! إذا كنت ستجري عملية جراحية أو منظاراً ببنج كلي، **يجب إيقاف الحقنة الأسبوعية قبل العملية بأسبوع كامل على الأقل** وإبلاغ طبيب التخدير لمنع ارتجاع الطعام للرئة أثناء البنج!
            </p>
          </div>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <b style={{ color: '#166534' }}>✅ كيف تمنع «وجه الأوزيمبيك المترهل» وفقدان العضلات؟</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 700 }}>
              التدرج في الجرعة شهرياً بأمر الطبيب + تناول 1.4 جم بروتين لكل كيلو من وزنك + تمارين المقاومة وشرب 3 لتر ماء يومياً لمنع الإمساك وحصوات المرارة.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'orlistat_pills' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💊 قواعد كبسولات عزل الدهون (أورليستات Orlistat / زينيكال / أورلي / ريجيماكس)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **كيف تعمل؟** تثبط إنزيم الليباز في الأمعاء فتمنع امتصاص 30% من دهون الوجبة وتطردها في البراز (لا تعمل على النشويات أو الحلويات الخالية من الدهون!).<br />
            • **⚠️ القاعدة الطبية المنسية:** لأنها تطرد الدهون، فإنها تطرد معها **الفيتامينات الأربعة الذائبة في الدهون (فيتامين A, D, E, K)**؛ لذلك يجب تناول كبسولة فيتامينات متعددة (Multivitamin) يومياً قبل النوم (بفاصل ساعتين عن كبسولة الأورليستات)، كما أنها تقلل امتصاص دواء الغدة الدرقية، وتزيد تكون حصوات الأوكسالات بالكلى إذا لم تشرب ماءً كافياً!
          </p>
        </section>
      )}

      {activeTab === 'intermittent_fasting' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            ⏳ بروتوكول الصيام المتقطع (16/8 للمبتدئين و 14/10 للسيدات)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **الهدف الطبي من الصيام المتقطع:** ليس تقليل الأكل فقط، بل خفض هرمون الإنسولين لساعات متواصلة حتى تُفتح مخازن الدهون العنيدة وتنشط عملية الالتهام الذاتي للخلايا التالفة (Autophagy).<br />
            • **المشروبات المسموحة أثناء ساعات الصيام الـ 16:** الماء، الشاي الأسود أو الأخضر، القهوة السادة، الينسون، النعناع، والقرفة **بدون أي سكر وبدون لبن وبدون سكر دايت يثير الإنسولين**.<br />
            • **ملاحظة للسيدات:** يُفضل للسيدات نظام **14 ساعة صيام و 10 ساعات إفطار** حتى لا تتأثر هرمونات التبويض والغدة الدرقية من الصيام القاسي الطويل.
          </p>
        </section>
      )}

      {activeTab === 'insulin_resistance' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🩸 علاج مقاومة الإنسولين (HOMA-IR) واسمرار الرقبة ودهون البطن
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **علامات مقاومة الإنسولين:** محيط خصر يتجاوز 88 سم للسيدات أو 102 سم للرجال، خطوط داكنة مخملية خلف الرقبة وتحت الإبط (Acanthosis Nigricans)، زوائد جلدية، وجوع شديد للحلويات بعد الأكل بساعتين.<br />
            • **العلاج الثلاثي الحاسم:** (١) قطع السكر الأبيض والدقيق الأبيض والمشروبات الغازية، (٢) المشي السريع 30 دقيقة يومياً بعد الغداء، (٣) تناول ملعقة خل تفاح طبيعي مخففة في كوب ماء كبير بشاليموه قبل الوجبة النشوية + مكمل الكروميوم أو الإينوزيتول أو الميتفورمين بإشراف الطبيب.
          </p>
        </section>
      )}

      {activeTab === 'thinness_gain' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626', background: '#fef2f2' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            💪 علاج النحافة الصحية وتحذير قاتل من «خلطة التسمين الشعبية (ديكسازون + ترياكتين)»!
          </h2>
          <p className="small" style={{ color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
            ⛔ **احذري فخ أقراص الديكسازون / الديكساميثازون للتسمين قبل الفرح!** الديكسازون كورتيزون قوي لا يزيد الوزن عضلاً، بل يحبس الماء والملح في الوجه (Moon Face) ويدمر عظام الحوض (نخر رأس عظمة الفخذ)، ويسبب السكر وقرحة المعدة، وعند التوقف عنه يحدث هبوط كظري قاتل!<br />
            ✅ **البديل الطبي الآمن لزيادة الوزن:** عمل تحليل غدة درقية (TSH) وتحليل براز للديدان والجرثومة أولاً، ثم استخدام فاتح شهية آمن ومكملات إنزيمات هاضمة (ديجستين) مع مشروبات عالية السعرات الصحية (سموذي الموز بالتمر وزبدة الفول السوداني والشوفان واللبن كامل الدسم + كبسولات الخميرة بعد الأكل).
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
