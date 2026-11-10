import SmartMedDoseReminderBadge from './SmartMedDoseReminderBadge';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type WomenTab = 'missed_pill' | 'contraception_map' | 'pcos_protocol' | 'dysmenorrhea' | 'breast_exam' | 'iron_menorrhagia';

export default function WomensHealthClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<WomenTab>('missed_pill');

  // Missed Pill Solver states
  const [pillType, setPillType] = useState<'combined' | 'mini_lactation'>('combined');
  const [hoursLate, setHoursLate] = useState<'under_12' | '12_to_24' | 'over_24_two_pills'>('under_12');

  const missedPillAction = useMemo(() => {
    if (pillType === 'mini_lactation') {
      if (hoursLate === 'under_12') {
        return {
          titleAr: '⚠️ حبوب الرضاعة الأحادية (مثل سيرازيت / ميكرولوت): حساسة جداً للوقت!',
          actionAr: 'إذا تأخرتِ أكثر من 3 ساعات (في ميكرولوت) أو 12 ساعة (في سيرازيت): خذي الحبة المنسية فوراً الآن، وخذي الحبة القادمة في ميعادها، **واستخدمي وسيلة حماية إضافية (واقي ذكري) أو تجنبي العلاقة لمدة 48 ساعة كاملة** حتى يعود مفعول الحماية!',
          color: '#dc2626',
          bg: '#fef2f2',
        };
      }
      return {
        titleAr: '🚨 تأخر أكثر من 12 ساعة في حبة الرضاعة (فقدان الحماية المؤقت!)',
        actionAr: 'خذي حبة واحدة فوراً الآن وأكملي الشريط في موعده، مع استخدام وسيلة عازلة إضافية لمدة **يومين كاملين (48 ساعة)**. إذا حدثت علاقة زوجية خلال اليومين الماضيين بدون حماية، استشيري الطبيبة حول وسيلة الطوارئ (كونترابلان).',
        color: '#dc2626',
        bg: '#fef2f2',
      };
    }

    // Combined pills (Yasmin, Gynera, Marvelon)
    if (hoursLate === 'under_12' || hoursLate === '12_to_24') {
      return {
        titleAr: '🟢 نسيتِ حبة واحدة فقط (أقل من 24 ساعة) من الأقراص المركبة (ياسمين / جينيرا / مارفيلون):',
        actionAr: 'اطمئني، الحماية ما زالت قائمة! **خذي الحبة المنسية فوراً بمجرد تذكرها** (حتى لو هذا يعني أخذ حبتين معاً في نفس اليوم)، ثم أكملي باقي الشريط في ميعادكِ المعتاد ولا تحتاجين لوسيلة إضافية.',
        color: '#16a34a',
        bg: '#f0fdf4',
      };
    }
    return {
      titleAr: '🚨 نسيتِ حبتين أو أكثر (أكثر من 48 ساعة) من الأقراص المركبة:',
      actionAr: 'خذي **آخر حبة نسيتها فوراً الآن** (وتجاهلي الحبات الأقدم المنسية)، وأكملي الشريط في ميعاده، ولكن **يجب استخدام وسيلة حماية إضافية (واقي ذكري) لمدة 7 أيام متواصلة!** إذا كان النسيان في آخر 7 حبات من الشريط، ابدئي الشريط الجديد فوراً بمجرد انتهاء الحالي دون فترة راحة.',
      color: '#d97706',
      bg: '#fffbeb',
    };
  }, [pillType, hoursLate]);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #9d174d 55%, #db2777 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#fce7f3' }}>
            🌸 {tr(lang, 'عيادة واستشاري صحة المرأة والغدد التناسلية (خبرة 40 عاماً)', 'Senior Women’s Health, PCOS & Contraception Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (20 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة صحة المرأة، تكيس المبايض (PCOS)، الدورة الشهرية، ووسائل منع الحمل', 'Complete Women’s Health, PCOS, Menstrual Care & Contraception Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'المساعد التفاعلي عند نسيان حبة منع الحمل، مقارنة اللولب والكبسولة والأقراص، بروتوكول علاج تكيس المبايض والشعر الزائد، تسكين آلام الدورة، والفحص الذاتي للثدي.',
            'Interactive missed-pill solver, IUD vs implant comparison, PCOS & hirsutism protocol, dysmenorrhea relief, and monthly breast self-exam.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'missed_pill', icon: '💊', titleAr: '١. نسيت حبة منع الحمل!', subAr: 'ماذا تفعلين فوراً حسب النوع؟' },
          { id: 'contraception_map', icon: '🛡️', titleAr: '٢. مقارنة وسائل منع الحمل', subAr: 'اللولب، الكبسولة، والحقن' },
          { id: 'pcos_protocol', icon: '🦋', titleAr: '٣. متلازمة تكيس المبايض', subAr: 'تنظيم الدورة والإينوزيتول' },
          { id: 'dysmenorrhea', icon: '🌸', titleAr: '٤. آلام الدورة الشهرية الحادة', subAr: 'التسكين الآمن وعلامات البطانة' },
          { id: 'breast_exam', icon: '🎗️', titleAr: '٥. الفحص الذاتي للثدي شهرياً', subAr: 'الموعد الصحيح والخطوات' },
          { id: 'iron_menorrhagia', icon: '🩸', titleAr: '٦. غزارة الدورة ونقص الحديد', subAr: 'متى تكون الدورة نزيفاً مرضياً؟' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as WomenTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #db2777' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #be185d 100%)' : '#ffffff',
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

      {activeTab === 'missed_pill' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            💊 المساعد التفاعلي الفوري: «نسيت آخذ حبة منع الحمل، أتصرف إزاي؟»
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '8px' }}>١. ما هو نوع شريط منع الحمل الذي تستخدمينه؟</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'combined', icon: '🌸', title: 'أقراص مركبة عادية', sub: 'ياسمين، جينيرا، مارفيلون، سيلست' },
                  { id: 'mini_lactation', icon: '🍼', title: 'أقراص الرضاعة الأحادية', sub: 'سيرازيت، ميكرولوت، لاكتينور (أمان الرضاعة)' },
                ].map((item) => {
                  const active = pillType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPillType(item.id as any)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: active ? '2.5px solid #ec4899' : '1.5px solid var(--line, #cbd5e1)',
                        background: active ? 'rgba(236, 72, 153, 0.15)' : 'var(--card-bg, #ffffff)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textAlign: 'start',
                        boxShadow: active ? '0 0 14px rgba(236, 72, 153, 0.35)' : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: '0.92rem', display: 'block', color: active ? '#db2777' : 'inherit' }}>{item.title}</b>
                        <span style={{ fontSize: '0.74rem', color: 'var(--muted, #64748b)', display: 'block' }}>{item.sub}</span>
                      </div>
                      {active && <span style={{ color: '#ec4899', fontWeight: 900 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '8px' }}>٢. كم ساعة مرت على ميعاد الحبة المنسية؟</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'under_12', icon: '⚡', title: 'أقل من 12 ساعة', sub: 'تذكرتِ في نفس اليوم' },
                  { id: '12_to_24', icon: '⏳', title: 'بين 12 إلى 24 ساعة', sub: 'حبة واحدة منسية' },
                  { id: 'over_24_two_pills', icon: '🚨', title: 'أكثر من 24-48 ساعة', sub: 'حبتين أو أكثر منسية' },
                ].map((item) => {
                  const active = hoursLate === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHoursLate(item.id as any)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: active ? '2.5px solid #0284c7' : '1.5px solid var(--line, #cbd5e1)',
                        background: active ? 'rgba(2, 132, 199, 0.15)' : 'var(--card-bg, #ffffff)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        textAlign: 'start',
                        boxShadow: active ? '0 0 12px rgba(2, 132, 199, 0.35)' : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.icon}</span>
                        {active && <span style={{ color: '#38bdf8', fontWeight: 900 }}>✓</span>}
                      </div>
                      <b style={{ fontSize: '0.88rem', color: active ? '#0284c7' : 'inherit' }}>{item.title}</b>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted, #64748b)' }}>{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ background: missedPillAction.bg, border: `2px solid ${missedPillAction.color}`, padding: '18px', borderRadius: '14px' }}>
            <b style={{ color: missedPillAction.color, fontSize: '1.08rem', display: 'block', marginBottom: '6px' }}>{missedPillAction.titleAr}</b>
            <p className="small" style={{ margin: 0, fontWeight: 700, color: '#1e293b', lineHeight: 1.65 }}>{missedPillAction.actionAr}</p>
          </div>
        </section>
      )}

      {activeTab === 'contraception_map' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🛡️ مقارنة وسائل منع الحمل في مصر: أيهما الأنسب لجسمكِ؟
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: 'var(--tint)', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <b style={{ color: '#0D1F38' }}>١. اللولب النحاسي (Copper IUD) مقابل اللولب الهرموني (ميرينا Mirena):</b>
              <p className="small" style={{ margin: '4px 0 0', fontWeight: 600 }}>
                • **اللولب النحاسي:** خالٍ تماماً من الهرمونات ولا يزيد الوزن ويستمر 5-10 سنوات، لكنه قد يزيد أيام وغزارة الدورة الشهرية في أول 3-6 أشهر (لا يناسب من تعاني من أنيميا شديدة أو دورة غزيرة أصلاً).<br />
                • **اللولب الهرموني (Mirena):** يفرز هرموناً موضعياً يقلل نزيف ومغص الدورة بنسبة 80%، وهو الخيار الأفضل لمن تعاني من غزارة الدورة والأنيميا.
              </p>
            </div>
            <div style={{ background: 'var(--tint)', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <b style={{ color: '#0D1F38' }}>٢. كبسولة الذراع تحت الجلد (إمبلانون Implanon - 3 سنوات):</b>
              <p className="small" style={{ margin: '4px 0 0', fontWeight: 600 }}>
                أعلى وسيلة فاعلية (99.9%)، تركب تحت جلد الذراع ببنج موضعي في دقيقتين، وتناسب المرضعات ومن تنسى الحبوب اليومية.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'pcos_protocol' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🦋 بروتوكول علاج متلازمة تكيس المبايض (PCOS) وتأخر الدورة والشعر الزائد
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **السبب الحقيقي لتكيس المبايض:** في 75% من الحالات السبب هو **«مقاومة الإنسولين»** التي ترفع هرمون الذكورة وتمنع البويضة من الكبر والخروج في موعدها!<br />
            • **خطوات العلاج المتكامل:**<br />
            ١. إنقاص 5% إلى 10% فقط من الوزن مع قطع السكريات والمخبوزات يعيد التبويض طبيعياً!<br />
            ٢. أكياس **الإينوزيتول (Myo-Inositol & D-Chiro-Inositol)** + الميتفورمين (سيدوفاج / جلوكوفاج) بعد الأكل لتحسين حساسية المبيض للإنسولين.<br />
            ٣. علاج الشعر الزائد بالوجه (Hirsutism) يحتاج جلسات ليزر متزامنة مع علاج الهرمونات لمدة 6 أشهر لأن دورة الشعرة طويلة.
          </p>
        </section>
      )}

      {activeTab === 'dysmenorrhea' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🌸 التغلب على آلام ومغص الدورة الشهرية الشديد (Dysmenorrhea)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **الخدعة الطبية لتسكين ألم الدورة:** المغص يحدث بسبب إفراز مادة (البروستاجلاندين) التي تعصر الرحم؛ تناول قرص مضاد للبروستاجلاندين (مثل بونستان فورت / نابروكسين / بروفين بعد الأكل) **قبل نزول الدورة بـ 12 ساعة أو مع أول نقطة** يمنع تكون المادة المسببة للألم من الأساس!<br />
            • وضع قربة ماء دافئ أسفل البطن + شرب القرفة والنعناع والزنجبيل الدافئ + مكمل الماغنسيوم قبل الدورة بأسبوع.<br />
            • ⚠️ **متى يكون ألم الدورة غير طبيعي؟** إذا كان الألم يزداد شراسة كل سنة، ويبدأ قبل الدورة بأيام ويستمر بعدها، ويمنعكِ من الحركة — يجب فحص السونار لاستبعاد **بطانة الرحم المهاجرة (Endometriosis)**.
          </p>
        </section>
      )}

      {activeTab === 'breast_exam' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #db2777' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#9d174d' }}>
            🎗️ الفحص الذاتي للثدي شهرياً (في 3 دقائق فقط للاطمئنان الكامل)
          </h2>
          <p className="small" style={{ fontWeight: 700, lineHeight: 1.7, color: '#831843' }}>
            • **التوقيت الذهبي للفحص:** لا تفحصي ثديكِ قبل الدورة لأن الثدي يكون محتقناً ومتحجراً بالهرمونات طبيعياً! افحصيه دائماً في **اليوم السابع إلى العاشر من بداية الدورة الشهرية** (بعد انتهاءها بيومين) حيث يكون الثدي في أهدأ وألين حالاته.<br />
            • **طريقة الفحص:** أثناء الاستحمام بالماء والصابون، ارفعي ذراعكِ الأيمن خلف رأسكِ، وبباطن الأصابع الثلاثة الوسطى لليد اليسرى افحصي الثدي الأيمن بحركات دائرية شاملة حتى تحت الإبط، ثم كرري للجهة الأخرى.<br />
            • **العلامات التي تستوجب كشف جراحة الثدي:** كتلة صلبة غير مؤلمة، تغير أو انكماش في جلد الثدي (مثل قشر البرتقال)، دخول الحلمة للداخل حديثاً، أو إفرازات مدممة من حلمة واحدة.
          </p>
        </section>
      )}

      {activeTab === 'iron_menorrhagia' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🩸 غزارة الطمث ونزيف الدورة: السبب الخفي لأنيميا السيدات في مصر
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **متى تعتبر الدورة غزيرة مرضياً (Menorrhagia)؟** إذا استمرت أكثر من **7 أيام كاملة**، أو كنتِ تضطرين لتغيير الفوطة الصحية كل ساعة إلى ساعتين، أو تنزل كتل دموية متجلطة كبيرة.<br />
            • **التصرف الطبي:** عمل تحليل صورة دم ومخزون حديد (Ferritin) وغدة درقية وسونار رحم، واستخدام أقراص تقليل النزيف غير الهرمونية أثناء أيام الدورة فقط بوصفة الطبيب (مثل **كابرون Kapron / حمض الترانيكساميك** + **دافلون 500**) مع تعويض الحديد.
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
