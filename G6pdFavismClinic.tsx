import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type G6pdTab = 'meds_scanner' | 'safe_alternatives' | 'foods_legumes' | 'chemicals_henna' | 'hemolysis_crisis' | 'emergency_card';

export const G6PD_DRUGS_LIST = [
  {
    nameAr: 'مضادات السلفا (سبترين، سلفاميثوكسازول، كوتريموكسازول، ستريم)',
    categoryAr: 'مضاد حيوي ومطهر',
    status: 'forbidden',
    noteAr: '⛔ ممنوع قطعاً! يسبب تكسير حاد ومباشر لكرات الدم الحمراء خلال 24-48 ساعة.',
  },
  {
    nameAr: 'النيتروفيورانتوين (ماكروفيوران Macrofuran، يوفامين ريتارد)',
    categoryAr: 'مضاد حيوي لمجرى البول',
    status: 'forbidden',
    noteAr: '⛔ ممنوع قطعاً في أنيميا الفول! يُستبدل بـ فوسفوميسين أو سيفالوسبورين آمن.',
  },
  {
    nameAr: 'مضادات الكينولون (سيبروفلوكساسين، ليفوفلوكساسين، تافانيك، موكسيفلوكساسين)',
    categoryAr: 'مضاد حيوي',
    status: 'forbidden',
    noteAr: '⛔ ممنوعة في مرضى أنيميا الفول لتجنب الإجهاد التأكسدي لكرات الدم.',
  },
  {
    nameAr: 'الأسبرين بتركيزاته والمسكنات العالية ومادة الميتاميزول (نوفالجين)',
    categoryAr: 'مسكن وخافض حرارة',
    status: 'forbidden',
    noteAr: '⛔ ممنوع! النوفالجين والأسبرين يسببان تكسير الدم ونقص المناعة.',
  },
  {
    nameAr: 'المثيلين الأزرق (Methylene Blue) في مطهرات البول (أوريكس، بروكسيمول مركب)',
    categoryAr: 'مطهر مجرى البول',
    status: 'forbidden',
    noteAr: '⛔ خطر قاتل لمريض أنيميا الفول! يحول الهيموجلوبين لميتهيموجلوبين ويكسر الدم فوراً.',
  },
  {
    nameAr: 'الباراسيتامول بالجرعة العلاجية المحددة بالوزن (سيتال، بنادول، أبيمول)',
    categoryAr: 'خافض حرارة ومسكن',
    status: 'safe',
    noteAr: '✅ آمن تماماً بشرط الالتزام بالجرعة المقررة حسب الوزن وعدم تجاوزها.',
  },
  {
    nameAr: 'الإيبوبروفين (بروفين شراب، كونتافيفر) بعد عمر 6 أشهر',
    categoryAr: 'خافض حرارة ومضاد التهاب',
    status: 'safe',
    noteAr: '✅ آمن لمرضى أنيميا الفول بالجرعات العلاجية المعتادة.',
  },
  {
    nameAr: 'مضادات البنسلين والسيفالوسبورين والماكروليد (أوجمنتين، هايبوتك، زيثروماكس، سيبازول)',
    categoryAr: 'مضاد حيوي',
    status: 'safe',
    noteAr: '✅ آمنة ومصرح بها لعلاج اللوز، الأذن، والنزلات الشعبية لدى مريض أنيميا الفول.',
  },
];

export default function G6pdFavismClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<G6pdTab>('meds_scanner');
  const [searchQ, setSearchQ] = useState('');
  const [childName, setChildName] = useState('أحمد');

  const filteredMeds = useMemo(() => {
    if (!searchQ.trim()) return G6PD_DRUGS_LIST;
    const q = searchQ.toLowerCase().trim();
    return G6PD_DRUGS_LIST.filter((m) => m.nameAr.toLowerCase().includes(q) || m.noteAr.toLowerCase().includes(q));
  }, [searchQ]);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #991b1b 55%, #dc2626 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#fecaca' }}>
            🫘 {tr(lang, 'عيادة واستشاري أمراض الدم وأنيميا الفول G6PD (خبرة 40 عاماً)', 'Senior Hematology & G6PD Deficiency Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة وموسوعة «أنيميا الفول G6PD» الشاملة للأطفال والكبار', 'Complete G6PD Deficiency (Favism) Safety & Emergency Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'المرجع الكامل لحماية طفلك من نوبات تكسير الدم الحادة: فاحص الأدوية الممنوعة والآمنة، الأكلات والبقوليات الخفية، المواد الكيميائية (الحنة والنفتالين)، وكارت طوارئ المدرسة.',
            'Complete protection against acute hemolytic crisis: forbidden vs. safe drug scanner, hidden legume derivatives, henna/mothball warnings, and school emergency card.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'meds_scanner', icon: '💊', titleAr: '١. كاشف الأدوية', subAr: 'الممنوع والآمن في الصيدلية' },
          { id: 'safe_alternatives', icon: '✅', titleAr: '٢. روشتة البدائل الآمنة', subAr: 'خافض الحرارة والمضاد الآمن' },
          { id: 'foods_legumes', icon: '🫘', titleAr: '٣. الأكلات والبقوليات', subAr: 'الفول، الصويا والمصادر الخفية' },
          { id: 'chemicals_henna', icon: '🧪', titleAr: '٤. الحنة والنفتالين', subAr: 'مؤكسدات غير غذائية قاتلة' },
          { id: 'hemolysis_crisis', icon: '🚨', titleAr: '٥. رادار نوبة تكسير الدم', subAr: 'لون البول والشحوب والطوارئ' },
          { id: 'emergency_card', icon: '🪪', titleAr: '٦. كارت طوارئ المدرسة', subAr: 'جاهز للطباعة والواتساب' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as G6pdTab)}
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

      {activeTab === 'meds_scanner' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ background: 'var(--tint)', marginBottom: '16px', padding: '16px' }}>
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="ابحث عن أي دواء (مثال: سبترين، سيتال، بروفين، ماكروفيوران، أوجمنتين، نوفالجين)..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #dc2626', fontWeight: 600, background: '#fff' }}
            />
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredMeds.map((m, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  borderRadius: '14px',
                  padding: '16px',
                  border: m.status === 'forbidden' ? '2px solid #f87171' : '2px solid #4ade80',
                  background: m.status === 'forbidden' ? '#fff1f2' : '#f0fdf4',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <b style={{ fontSize: '1.1rem', color: '#0D1F38' }}>{m.nameAr}</b>
                  <span style={{ background: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                    {m.categoryAr}
                  </span>
                </div>
                <p className="small" style={{ margin: 0, fontWeight: 700, color: m.status === 'forbidden' ? '#991b1b' : '#14532d' }}>
                  {m.noteAr}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'safe_alternatives' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#166534' }}>
            ✅ قائمة أدوية الطوارئ المنزلية الآمنة 100% لطفل أنيميا الفول
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700, color: '#14532d' }}>
            <li>**للحرارة والألم:** باراسيتامول (سيتال، أبيمول، بانادول) أو إيبوبروفين (بروفين، كونتافيفر) بالجرعة المحسوبة بالوزن.</li>
            <li>**للرشح والزكام:** غسول الأنف بمحلول الملح أو ماء البحر + مضادات الهيستامين الآمنة (زيرتك، تيلفاست، كلاريتين).</li>
            <li>**للكحة:** ورق اللبلاب الطبيعي الخالي من المنثول المركز (بروسبان، ايفيروسبان) وجلسات بخار محلول الملح.</li>
            <li>**للإسهال والنزلة المعوية:** محلول الجفاف + نانازوكسيد أو سميكتا (تجنب تماماً ستريم أو سبترين لأنها سلفا!).</li>
          </ul>
        </section>
      )}

      {activeTab === 'foods_legumes' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🫘 الأكلات الممنوعة والمصادر الخفية في الأغذية المحفوظة
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **الممنوع الصارم المباشر:** الفول المدمس، الفول الأخضر (الحراتي)، الطعمية، البصارة، الفول النابت، وحتى استنشاق حبوب اللقاح في حقول الفول الأخضر!<br />
            • **البقوليات الأخرى (الحمص، العدس، اللوبيا، الفاصوليا، الفول السوداني):** يُنصح بتجنبها في حالات النقص الشديد للإنزيم (Class I & II)، مع الحذر الشديد من **فول الصويا والليسيثين الصويا (Soy Lecithin)** الموجود خفياً في اللانشون، البرجر الجاهز، السوسيس، وبعض الشوكولاتات والبسكويت المصنع (اقرئي المكونات دائماً!).
          </p>
        </section>
      )}

      {activeTab === 'chemicals_henna' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🧪 4 مواد كيميائية منزلية غير غذائية تسبب تكسير دم قاتل لمريض أنيميا الفول!
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
              ١. الحنة (Henna) على الجلد أو اليدين أو الشعر: تحتوي الحنة على مادة (Lawsone) المؤكسدة التي تُمتص عبر الجلد وتسبب تكسير دم حاد وفوري للأطفال!
            </div>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
              ٢. كرات النفتالين البيضاء (Mothballs) في دولاب الملابس والبطاطين: أبخرة النفتالين при استنشاقها أو لبس هدوم مخزنة بها تسبب تكسير دم عنيف جداً!
            </div>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
              ٣. المنثول المركز والكافور (أبو فاس / فيكس Vicks / النعناع المركز): يُمنع دهنه على صدر الطفل أو استنشاقه.
            </div>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
              ٤. فوارات وأقراص فيتامين C عالية التركيز (1000 مجم): الجرعات العالية من حمض الأسكوربيك تعمل كمؤكسد داخل كرات الدم لمريض G6PD.
            </div>
          </div>
        </section>
      )}

      {activeTab === 'hemolysis_crisis' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', background: '#fef2f2', border: '2px solid #dc2626' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            🚨 كيف تكتشفين «نوبة تكسير الدم الحادة» في أول ساعة؟
          </h2>
          <p className="small" style={{ color: '#7f1d1d', fontWeight: 700, lineHeight: 1.7 }}>
            إذا تعرض الطفل للفول أو دواء ممنوع، تظهر الأعراض خلال 24 إلى 72 ساعة:<br />
            ١. **تغير لون البول للون الشاي الغامق أو الكوكاكولا (أهم وأول علامة قاطعة!).**<br />
            ٢. شحوب مفاجئ وشديد في الوجه والشفايف وباطن الكفين مع اصفرار بياض العينين (يرقان التكسير).<br />
            ٣. نهجان وسرعة ضربات القلب، خمول شديد، عدم قدرة على الوقوف، وألم في البطن والظهر.<br />
            ⚡ **التصرف الفوري:** لا تنتظري في البيت ولا تعطي حديداً (الحديد ممنوع في أنيميا التكسير!) — توجهي لطوارئ أقرب مستشفى أطفال فوراً لعمل صورة دم (CBC & Reticulocytes) وإعطاء محاليل لحماية الكلى ونقل كرات دم حمراء مكدسة إذا هبط الهيموجلوبين.
          </p>
        </section>
      )}

      {activeTab === 'emergency_card' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px dashed #dc2626' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🪪 كارت تحذير أنيميا الفول للمدرسة والحضانة والصيدلي
          </h2>
          <div style={{ marginBottom: '12px' }}>
            <label className="small" style={{ fontWeight: 700 }}>اسم الطفل للطباعة والمشاركة: </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 700, marginRight: '8px' }}
            />
          </div>
          <div style={{ background: '#fff1f2', padding: '18px', borderRadius: '14px', border: '2px solid #dc2626', marginBottom: '14px' }}>
            <h3 style={{ margin: '0 0 6px', color: '#991b1b' }}>⚠️ تنبيه طبي عاجل: الطفل ({childName}) مصاب بأنيميا الفول (G6PD Deficiency)</h3>
            <p className="small" style={{ margin: 0, color: '#7f1d1d', fontWeight: 700, lineHeight: 1.6 }}>
              • ممنوع منعاً باتاً تقديم الفول، الطعمية، البقوليات، الفول السوداني، أو منتجات الصويا للطفل.<br />
              • ممنوع إعطاؤه أي دواء يحتوي على السلفا، الأسبرين، النوفالجين، أو النيتروفيورانتوين.<br />
              • خافض الحرارة المسموح فقط: الباراسيتامول (سيتال / بنادول).
            </p>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `⚠️ كارت تنبيه طبي للمدرسة والحضانة:\nالطفل (${childName}) مصاب بأنيميا الفول (G6PD Deficiency).\n• ممنوع تقديم الفول أو الطعمية أو البقوليات أو الفول السوداني.\n• ممنوع إعطاؤه أي أدوية بدون الرجوع لولي الأمر.\n🔗 دليل أنيميا الفول على منصة دوايا: https://mmo277.github.io/DAWAYA/#/g6pd-clinic`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: '#138866', color: '#ffffff', fontWeight: 800, textDecoration: 'none' }}
          >
            📲 إرسال كارت التحذير لمشرفة المدرسة أو العائلة عبر واتساب
          </a>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
