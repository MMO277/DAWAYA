import SmartMedDoseReminderBadge from './SmartMedDoseReminderBadge';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type GastroTab = 'h_pylori' | 'ibs_fodmap' | 'gerd_reflux' | 'food_poisoning' | 'constipation_piles' | 'red_flags';

export const H_PYLORI_RULES = [
  {
    stepAr: '١. شروط تحليل البراز الصحيح (H. Pylori Stool Antigen) لمنع النتيجة السلبية الكاذبة',
    descAr: 'أكبر خطأ يقع فيه المرضى: عمل تحليل الجرثومة أثناء تناول أدوية المعدة! يجب إيقاف مثبطات الحموضة (مثل كونترولوك، نيكسيوم، أوميز، أنتوبرال) والمضادات الحيوية لمدة 14 يوماً كاملة قبل التحليل، وإلا ستختبئ الجرثومة وتظهر النتيجة سلبية كاذبة!',
    badge: '🔬 شرط التحليل والتأكد من الشفاء',
    color: '#dc2626',
  },
  {
    stepAr: '٢. لماذا يفشل كورس علاج الجرثومة وترجع أقوى من الأول؟',
    descAr: 'بسبب عدم الالتزام بمواعيد الكورس (14 يوماً متواصلة بالدقيقة)، أو تناول أكلات تغذي الجرثومة وتلتهم بطانة المعدة أثناء العلاج (المقليات، الشطة، القهوة على الريق، المسكنات، والتدخين)، أو تكرار نفس المضاد الحيوي القديم الذي اكتسبت الجرثومة مناعة ضده (مثل الكلاريثروميسين).',
    badge: '💊 سر نجاح الكورس الثلاثي والرباعي',
    color: '#059669',
  },
  {
    stepAr: '٣. التوقيت الذهبي لقرص المعدة (قبل الأكل بـ 30 إلى 60 دقيقة)',
    descAr: 'كبسولات ومثبطات مضخة البروتون (PPIs) لا تعمل إذا أُخذت بعد الأكل أو قبل النوم مباشرة! يجب بلعها على معدة فارغة قبل الإفطار والعشاء بنصف ساعة إلى ساعة، ثم تناول وجبة لتنشيط مضخات الحمض فيقوم الدواء بإغلاقها.',
    badge: '⏰ توقيت الدواء',
    color: '#0284c7',
  },
  {
    stepAr: '٤. الأكلات المساندة لالتئام جدار المعدة أثناء وبعد الكورس',
    descAr: 'الزبادي الغني بالبروبيوتيك (البكتيريا النافعة)، براعم البروكلي، عسل المانوكا أو عسل النحل الأصلي مذاباً في ماء دافئ، البطاطس المسلوقة، الشوفان، وزيت الزيتون البكر.',
    badge: '🥗 تغذية المعدة',
    color: '#d97706',
  },
];

export const IBS_FOOD_MAP = [
  {
    categoryAr: 'البقوليات والنشويات المصرية',
    triggersAr: '⛔ مهيجات شديدة للانتفاخ: الفول المدمس بقشره، الطعمية المقلية بزيت مغلي، الكشري بالتقلية والعدس الأسود، الكرنب والقرنبيط، والبصل والثوم النيئ.',
    safeSwapAr: '✅ البديل المريح للقولون: الفول المقشور أو المهروس في الخلاط مع كمون وزيت زيتون، الأرز الأبيض البسمتي، البطاطس المشوية أو المسلوقة، والشوفان.',
  },
  {
    categoryAr: 'الألبان والمنتجات الحليبية',
    triggersAr: '⛔ مهيجات القولون: الحليب السائل كامل الدسم (بسبب سكر اللاكتوز الذي يتخمر في القولون وينتج غازات شديدة)، القشطة، والجبن المطبوخ.',
    safeSwapAr: '✅ البديل المريح: الزبادي واللبن الرايب (لأن بكتيريا التخمير تهضم اللاكتوز)، الجبن القريش الطازج، والجبن الشيدر الصلب، أو الحليب خالي اللاكتوز.',
  },
  {
    categoryAr: 'الفواكه والحلويات والمشروبات',
    triggersAr: '⛔ مهيجات القولون: التفاح والكمثرى والبطيخ والمانجو بكميات كبيرة (غنية بسكر الفركتوز والسوربيتول المخمر)، المشروبات الغازية، واللبان (العلكة).',
    safeSwapAr: '✅ البديل المريح: الموز الناضج، البرتقال واليوسفي، الفراولة، الكنتالوب، ومشروب النعناع الدافئ والينسون والشمر والكمون.',
  },
];

export default function GastroClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<GastroTab>('h_pylori');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #065f46 55%, #059669 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#dcfce7' }}>
            🦠 {tr(lang, 'عيادة واستشاري الجهاز الهضمي والكبد والمناظير (خبرة 40 عاماً)', 'Senior Gastroenterology & Hepatology Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة الجهاز الهضمي، القولون العصبي، وجرثومة المعدة الشاملة', 'Complete Gastroenterology, H. Pylori, IBS & Reflux Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'البروتوكول النهائي للقضاء على جرثومة المعدة، خريطة الأكل المصري للقولون العصبي والانتفاخ، علاج ارتجاع المريء، وطوارئ التسمم الغذائي والنزلات المعوية.',
            'Definitive H. Pylori eradication rules, Egyptian IBS FODMAP diet, GERD management, and acute food poisoning triage.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'h_pylori', icon: '🦠', titleAr: '١. جرثومة المعدة', subAr: 'شروط التحليل ونجاح الكورس' },
          { id: 'ibs_fodmap', icon: '🎈', titleAr: '٢. القولون والانتفاخ', subAr: 'خريطة الأكل المهيج والبديل' },
          { id: 'gerd_reflux', icon: '🔥', titleAr: '٣. ارتجاع المريء والحموضة', subAr: 'توقيت الدواء ونصائح النوم' },
          { id: 'food_poisoning', icon: '🤢', titleAr: '٤. النزلة المعوية والإسهال', subAr: 'التسمم الغذائي ومحلول الجفاف' },
          { id: 'constipation_piles', icon: '🚽', titleAr: '٥. الإمساك والشرخ والبواسير', subAr: 'العلاج الآمن بدون كسل أمعاء' },
          { id: 'red_flags', icon: '🚨', titleAr: '٦. علامات إنذار المنظار', subAr: 'أعراض تستلزم الفحص العاجل' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as GastroTab)}
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

      {activeTab === 'h_pylori' && (
        <section style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
          {H_PYLORI_RULES.map((r, idx) => (
            <div key={idx} className="card" style={{ borderRadius: '16px', padding: '20px', borderTop: `5px solid ${r.color}` }}>
              <span style={{ background: 'var(--tint)', color: r.color, fontWeight: 800, fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', display: 'inline-block', marginBottom: '6px' }}>
                {r.badge}
              </span>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900, color: '#0D1F38' }}>{r.stepAr}</h3>
              <p className="small" style={{ margin: 0, color: '#1e293b', lineHeight: 1.6, fontWeight: 600 }}>{r.descAr}</p>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'ibs_fodmap' && (
        <section style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
          <div className="card" style={{ background: '#f8fafc' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
              🎈 خريطة الأكل المصري لمريض القولون العصبي والغازات (Egyptian Low-FODMAP)
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              القولون العصبي يهدأ بنسبة 80% بتبديل الأكلات المتخمرة بالبدائل الذكية التالية مع تناول مضادات التقلص قبل الأكل بـ 20 دقيقة (مثل كولونا أو ميبافيرين أو سبازمومين):
            </p>
          </div>
          {IBS_FOOD_MAP.map((f, idx) => (
            <div key={idx} className="card" style={{ borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 900, color: '#0D1F38' }}>{f.categoryAr}</h3>
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '10px', color: '#991b1b', fontWeight: 700, fontSize: '0.88rem' }}>
                {f.triggersAr}
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', color: '#14532d', fontWeight: 700, fontSize: '0.88rem' }}>
                {f.safeSwapAr}
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'gerd_reflux' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🔥 دستور علاج ارتجاع المريء وشرقة الحلق الليلية (GERD)
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: 'var(--tint)', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <b style={{ color: '#0D1F38' }}>١. قاعدة الـ 3 ساعات قبل النوم (أهم من الدواء نفسه!):</b>
              <p className="small" style={{ margin: '4px 0 0', fontWeight: 600 }}>
                توقف عن تناول أي طعام قبل النوم بـ 3 ساعات كاملة، وارفع رأس السرير أو ضع مخدة مائلة لترتفع رأسك وكتفاك بزاوية 30 درجة، ونم على جانبك الأيسر (النوم على الجانب الأيمن يجعل المعدة فوق المريء فيزيد الارتجاع!).
              </p>
            </div>
            <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <b style={{ color: '#92400e' }}>٢. الأكلات التي ترخي صمام المريء السفلي وتفتحه للحمض:</b>
              <p className="small" style={{ margin: '4px 0 0', fontWeight: 600 }}>
                النعناع المركز، الشوكولاتة، القهوة على الريق، المقليات والدهون، الصلصة المسبكة، وعصير البرتقال والليمون في المساء.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'food_poisoning' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🤢 بروتوكول النزلة المعوية والتسمم الغذائي: خطأ قاتل في أدوية الإسهال!
          </h2>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '12px' }}>
            <b style={{ color: '#991b1b' }}>⛔ متى يُمنع أخذ أدوية شل حركة الأمعاء (مثل إيموديوم Imodium / لوبراميد)؟</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#7f1d1d', fontWeight: 600 }}>
              إذا كان الإسهال مصحوباً بـ **سخونة عالية، أو مخاط مدمم، أو مغص تعنية شديد** (نزلة بكتيرية كالسالمونيلا أو الشيجيلا أو الأميبا)، فإعطاء الإيموديوم يحبس البكتيريا والسموم داخل البطن ويسبب تسمم الدم وتضخم القولون السام!
            </p>
          </div>
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <b style={{ color: '#166534' }}>✅ التصرف الطبي الآمن:</b>
            <p className="small" style={{ margin: '4px 0 0', color: '#14532d', fontWeight: 600 }}>
              ١. تعويض السوائل فوراً بأكياس محلول معالجة الجفاف (ORS) رشفة كل 5 دقائق. ٢. مطهر معوي آمن لا يُمتص (مثل نانازوكسيد أو أنتينال/ستربتوكين للكبار) + أكياس سميكتا (Smecta) لربط السموم + أكل مسلوق (بطاطس، أرز، تفاح، زبادي، موز).
            </p>
          </div>
        </section>
      )}

      {activeTab === 'constipation_piles' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🚽 علاج الإمساك المزمن والشرخ الشرجي والبواسير بدون إدمان الملينات
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.6 }}>
            • **احذر الملينات المحفزة للأعصاب (السنامكي، شاي الرجيم، أقراص بيساكوديل/مينالاكس لفترات طويلة):** استخدامها اليومي يصيب القولون بالكسل التام فلا يتحرك بدونها!<br />
            • **الملينات الاسموزية الآمنة:** شراب اللاكتيلوز أو أكياس ماكروجول (موفكول) تسحب الماء للبراز بآمان دون تعود.<br />
            • **قاعدة الشرخ الشرجي الذهبية:** الجلوس في حمام ماء دافئ لمدة 15 دقيقة مرتين يومياً يرخي عضلة الشرج المتقلصة ويسمح بوصول الدم لالتئام الشرخ.
          </p>
        </section>
      )}

      {activeTab === 'red_flags' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', background: '#fef2f2', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🚨 علامات الإنذار في الجهاز الهضمي التي تستوجب منظاراً وفحصاً عاجلاً
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', color: '#7f1d1d', fontWeight: 700, lineHeight: 1.8 }}>
            <li>صعوبة البلع أو الشعور بأن اللقمة تقف في منتصف الصدر.</li>
            <li>قيء مدمم أو يشبه تفل القهوة الغامق، أو براز أسود كالقطران (Melena) دون تناول حديد.</li>
            <li>فقدان غير مبرر للوزن والشهية مع أنيميا نقص حديد مستمرة خاصة بعد سن الـ 45.</li>
            <li>اصفرار بياض العينين مع بول بلون الشاي الغامق.</li>
          </ul>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
