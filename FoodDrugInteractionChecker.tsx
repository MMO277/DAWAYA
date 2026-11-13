import { TeaCoffeeTimingMatrixCard } from './egyptianClinicalInnovations';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import Disclaimer from './Disclaimer';

export type FoodCategoryKey =
  | 'all'
  | 'tea_coffee'
  | 'dairy_milk'
  | 'licorice_salty'
  | 'grapefruit_citrus'
  | 'leafy_vitk'
  | 'potassium_rich'
  | 'fava_beans'
  | 'empty_stomach';

export interface FoodDrugRule {
  id: string;
  foodCategory: FoodCategoryKey;
  foodIcon: string;
  foodNameAr: string;
  drugClassAr: string;
  popularEgyptianBrandsAr: string;
  severity: 'critical_danger' | 'blocks_absorption' | 'timing_required';
  separationHours: number;
  idealTimingBadgeAr: string;
  whatHappensInBodyAr: string;
  safeActionPlanAr: string;
  relatedClinicRoute: string;
  relatedClinicNameAr: string;
}

export const FOOD_DRUG_RULES: FoodDrugRule[] = [
  {
    id: 'tea-iron',
    foodCategory: 'tea_coffee',
    foodIcon: '☕',
    foodNameAr: 'الشاي، القهوة، النسكافيه، والمشروبات الغنية بالكافيين والتانين',
    drugClassAr: 'أقراص وشراب الحديد وعلاج الأنيميا',
    popularEgyptianBrandsAr: 'فيروجلوبين (Feroglobin)، فيروترون (Ferrotron)، فرافيرو 27 (Pharaferro)، هيماتون، سيدرال',
    severity: 'blocks_absorption',
    separationHours: 2,
    idealTimingBadgeAr: '⏰ افصل بساعتين كاملتين + اشرب عصير برتقال مع الحديد',
    whatHappensInBodyAr: 'مادة «التانين» في الشاي والقهوة تتحد كيميائياً مع الحديد داخل المعدة وتكوّن مركباً غير قابل للذوبان ينزل في البراز، مما يقلل امتصاص الحديد بنسبة تصل إلى 60% إلى 70% فلا يرتفع الهيموجلوبين ولا مخزون الفيريتين!',
    safeActionPlanAr: 'خذ قرص الحديد مع كوب عصير برتقال أو ليمون (فيتامين سي يضاعف امتصاص الحديد 3 مرات)، واصبر ساعتين كاملتين قبل أو بعد شرب الشاي أو القهوة.',
    relatedClinicRoute: '/lab-clinic',
    relatedClinicNameAr: '🔬 عيادة التحاليل ومخزون الحديد',
  },
  {
    id: 'coffee-thyroid',
    foodCategory: 'tea_coffee',
    foodIcon: '🦋',
    foodNameAr: 'القهوة الصباحية، الشاي بلبن، أو الفطار المبكر',
    drugClassAr: 'هرمون الغدة الدرقية التعويضي (Levothyroxine)',
    popularEgyptianBrandsAr: 'إلتروكسين (Eltroxin)، إيثيروكس (Euthyrox)',
    severity: 'blocks_absorption',
    separationHours: 1,
    idealTimingBadgeAr: '⏰ على الريق بالماء فقط قبل الفطار والقهوة بـ 60 دقيقة (و4 ساعات عن الحديد/الكالسيوم)',
    whatHappensInBodyAr: 'شرب القهوة أو الأكل خلال أقل من ساعة بعد قرص الغدة يغلف جدار الأمعاء ويمنع امتصاص الهرمون، فيظل تحليل TSH مرتفعاً ويعاني المريض من الخمول وزيادة الوزن رغم التزامه بالدواء!',
    safeActionPlanAr: 'اجعل قرص الإلتروكسين أول شيء يدخل جوفك فور الاستيقاظ مع كوب ماء عادي، وانتظر 60 دقيقة كاملة قبل القهوة أو الفطار، وافصل بينه وبين أي مكمل حديد أو كالسيوم بـ 4 ساعات.',
    relatedClinicRoute: '/chronic-clinic',
    relatedClinicNameAr: '🫀 عيادة الباطنة والغدة الدرقية',
  },
  {
    id: 'milk-cipro-tetracycline',
    foodCategory: 'dairy_milk',
    foodIcon: '🥛',
    foodNameAr: 'اللبن، الجبنة، الزبادي، الرايب، ومكملات الكالسيوم والماغنسيوم',
    drugClassAr: 'مضادات الكينولون والتتراسيكلين الحيوية',
    popularEgyptianBrandsAr: 'سيبروفلوكساسين (Ciprofar / Ciprobay)، تافانيك (Tavanic / ليفوفلوكساسين)، فيبراميسين (Vibramycin / دوكسيسيكلين)',
    severity: 'blocks_absorption',
    separationHours: 2,
    idealTimingBadgeAr: '⏰ افصل بساعتين قبل أو 4 ساعات بعد منتجات الألبان',
    whatHappensInBodyAr: 'الكالسيوم الموجود في اللبن والجبنة والزبادي يمسك في جزيئات المضاد الحيوي كالمغناطيس (Chelation) ويمشي بها خارج الجسم دون أن تدخل الدم، فيفشل علاج التهاب المسالك أو الصدر وتكتسب البكتيريا مناعة!',
    safeActionPlanAr: 'ابلع المضاد الحيوي بكوب ماء كبير فقط، وامتنع عن اللبن والجبن والزبادي وفوار الحموضة لمدة ساعتين قبل وبعد الجرعة.',
    relatedClinicRoute: '/urology-clinic',
    relatedClinicNameAr: '🧪 عيادة المسالك والمضادات الحيوية',
  },
  {
    id: 'licorice-bp-digoxin',
    foodCategory: 'licorice_salty',
    foodIcon: '🥤',
    foodNameAr: 'العرقسوس، المخللات، الحوادق، والفوارات المالحة',
    drugClassAr: 'أدوية ضغط الدم، مدرات البول، الكورتيزون، وأدوية القلب',
    popularEgyptianBrandsAr: 'كونكور (Concor)، إكسفورج (Exforge)، لازيكس (Lasix)، ناتريليكس، كابتوبريل، لانوكسين (Digoxin)',
    severity: 'critical_danger',
    separationHours: 24,
    idealTimingBadgeAr: '⛔ ممنوع تماماً لمرضى الضغط والقلب والكلى (حتى كوب واحد!)',
    whatHappensInBodyAr: 'مادة الجليسريزين في العرقسوس تشبه عمل الكورتيزون فتحتبس الماء والصوديوم داخل الجسم وتطرد البوتاسيوم في البول، مما يسبب ارتفاعاً خطيراً ومفاجئاً في ضغط الدم مع اضطراب ضربات القلب وتسمم الديجوكسين!',
    safeActionPlanAr: 'استبدل العرقسوس بالكركديه المنقوع البارد أو الدوم أو التمر هندي الطبيعي قليل السكر.',
    relatedClinicRoute: '/chronic-clinic',
    relatedClinicNameAr: '🫀 عيادة الضغط والقلب والباطنة',
  },
  {
    id: 'grapefruit-statins-ccbs',
    foodCategory: 'grapefruit_citrus',
    foodIcon: '🍊',
    foodNameAr: 'عصير الجريب فروت واللارنج (البرتقال المر)',
    drugClassAr: 'أدوية الكوليسترول والدهون وبعض أدوية الضغط والسيولة',
    popularEgyptianBrandsAr: 'ليبيتور (Lipitor / أتورفاستاتين)، زوكور (سفمفاستاتين)، نورفاسك (Norvasc / أملوديبين)، بلافيكس',
    severity: 'critical_danger',
    separationHours: 24,
    idealTimingBadgeAr: '⛔ تجنب الجريب فروت طوال فترة العلاج (الفصل بالساعات لا يكفي!)',
    whatHappensInBodyAr: 'الجريب فروت يعطل إنزيم (CYP3A4) في الكبد والأمعاء المسؤول عن تكسير الدواء لمدة تزيد عن 24 ساعة، فتتضاعف نسبة دواء الكوليسترول أو الضغط في الدم عدة أضعاف، مما يسبب تكسير العضلات وإجهاد الكلى أو هبوط الضغط!',
    safeActionPlanAr: 'يمكنك تناول البرتقال البلدي أو اليوسفي باعتدال (مع الفصل ساعتين)، وتجنب الجريب فروت تماماً مع أدوية الكوليسترول والضغط.',
    relatedClinicRoute: '/chronic-clinic',
    relatedClinicNameAr: '🫀 عيادة القلب والكوليسترول',
  },
  {
    id: 'vitk-warfarin',
    foodCategory: 'leafy_vitk',
    foodIcon: '🥬',
    foodNameAr: 'الملوخية، السبانخ، الكرنب، البروكلي، الجرجير، والكبدة',
    drugClassAr: 'دواء السيولة الكلاسيكي (Warfarin)',
    popularEgyptianBrandsAr: 'ماريفان (Marevan 1mg / 3mg / 5mg)',
    severity: 'critical_danger',
    separationHours: 0,
    idealTimingBadgeAr: '⚖️ الثبات على كمية صغيرة معتدلة يومياً بدون إفراط مفاجئ',
    whatHappensInBodyAr: 'الماريفان يعمل عن طريق تثبيط فيتامين K لمنع التجلط؛ فإذا أكل المريض كمية كبيرة من الملوخية أو السبانخ أو الكبدة في يوم واحد، يبطل مفعول الماريفان تماماً وينخفض تحليل السيولة (INR) ويزيد خطر الجلطة!',
    safeActionPlanAr: 'لا تمنع الخضروات الورقية تماماً ولا تأكلها بكمية ضخمة فجأة؛ ثبت نظامك الغذائي وتابع تحليل INR بانتظام.',
    relatedClinicRoute: '/chronic-clinic',
    relatedClinicNameAr: '🫀 عيادة السيولة والقلب',
  },
  {
    id: 'potassium-acei-spiro',
    foodCategory: 'potassium_rich',
    foodIcon: '🍌',
    foodNameAr: 'الإفراط في الموز، البرتقال، التمر، المشمش، وملح الدايت (بديل الملح)',
    drugClassAr: 'أدوية الضغط من عائلة ACEi/ARBs ومدرات البول الحافظة للبوتاسيوم',
    popularEgyptianBrandsAr: 'كابتوبريل، تريتايس (Tritace)، إيرساجارد، ألداكتون (Aldactone / Spironolactone)',
    severity: 'critical_danger',
    separationHours: 12,
    idealTimingBadgeAr: '⚠️ اعتدال في الموز والتمر + ممنوع «ملح الدايت» البوتاسيومي!',
    whatHappensInBodyAr: 'هذه الأدوية تحبس البوتاسيوم داخل الجسم؛ فإذا استخدم المريض «ملح الدايت الطبي» (المصنوع من كلوريد البوتاسيوم) أو أفرط في الموز والتمر (خاصة لو كفاءة الكلى ضعيفة)، يرتفع البوتاسيوم لمستوى يهدد عضلة القلب!',
    safeActionPlanAr: 'تجنب بدائل الملح الصناعية تماماً واستخدم الليمون والكمون والبهارات لتتبيل الطعام.',
    relatedClinicRoute: '/urology-clinic',
    relatedClinicNameAr: '🧪 عيادة الكلى والأملاح',
  },
  {
    id: 'fava-g6pd',
    foodCategory: 'fava_beans',
    foodIcon: '🫘',
    foodNameAr: 'الفول، الطعمية، البصارة، العدس، الحمص، والترمس',
    drugClassAr: 'مرضى أنيميا الفول (G6PD Deficiency) والأدوية المؤكسدة',
    popularEgyptianBrandsAr: 'سبترين (Septrin)، سيبروفلوكساسين، أسبرين بجرعات عالية، فيتامين سي فوار عالي التركيز',
    severity: 'critical_danger',
    separationHours: 24,
    idealTimingBadgeAr: '🚨 ممنوع مدى الحياة لمرضى أنيميا الفول (G6PD)',
    whatHappensInBodyAr: 'البقوليات الفولية والأدوية المؤكسدة تسبب انفجاراً وتكسيراً حاداً لكرات الدم الحمراء خلال 24–48 ساعة مع اصفرار العين وبول بلون الكوكاكولا وهبوط حاد في الهيموجلوبين!',
    safeActionPlanAr: 'احمل كارت ممنوعات أنيميا الفول دائماً وأبلغ الصيدلي والطبيب قبل صرف أي مضاد حيوي أو مسكن.',
    relatedClinicRoute: '/g6pd-clinic',
    relatedClinicNameAr: '🫘 عيادة أنيميا الفول (G6PD)',
  },
  {
    id: 'nsaids-empty-stomach',
    foodCategory: 'empty_stomach',
    foodIcon: '💊',
    foodNameAr: 'أخذ الدواء على معدة فارغة (على الريق بدون أكل) أو مع القهوة',
    drugClassAr: 'مسكنات العظام والأسنان والصداع ومضادات الالتهاب (NSAIDs) والكورتيزون والأسبرين',
    popularEgyptianBrandsAr: 'كتافلام (Cataflam)، كتافاست، فولتارين، بروفين (Brufen)، باي بروفينيد، أسبرين، بريدسول',
    severity: 'critical_danger',
    separationHours: 0,
    idealTimingBadgeAr: '🍽️ يُؤخذ دائماً وسط أو بعد وجبة طعام كاملة + كوب ماء كبير',
    whatHappensInBodyAr: 'المسكنات والكورتيزون على الريق تكشط الغشاء المخاطي الواقي للمعدة وتسبب قرحة ونزيفاً معدياً حاداً والتهاباً شديداً في فم المعدة!',
    safeActionPlanAr: 'لا تبلع أي مسكن (ما عدا الباراسيتامول/البنادول العادي) إلا بعد تناول وجبة طعام، ولا تجمع بين مسكنين أبداً.',
    relatedClinicRoute: '/gastro-clinic',
    relatedClinicNameAr: '🦠 عيادة الجهاز الهضمي والمعدة',
  },
];

export default function FoodDrugInteractionChecker() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<FoodCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRules = useMemo(() => {
    return FOOD_DRUG_RULES.filter((r) => {
      const catMatch = selectedCategory === 'all' || r.foodCategory === selectedCategory;
      if (!catMatch) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        r.foodNameAr.toLowerCase().includes(q) ||
        r.drugClassAr.toLowerCase().includes(q) ||
        r.popularEgyptianBrandsAr.toLowerCase().includes(q) ||
        r.whatHappensInBodyAr.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}><TeaCoffeeTimingMatrixCard isAr={lang === 'ar'} /></div>
      {/* Hero Banner */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #92400e 55%, #d97706 100%)',
          color: '#ffffff',
          borderRadius: '22px',
          padding: '28px 24px',
          marginBottom: '20px',
          boxShadow: '0 14px 32px rgba(13, 31, 56, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#fef3c7' }}>
            ☕ {tr(lang, 'فاحص تداخلات الأكلات والمشروبات المصرية مع الأدوية', 'Egyptian Food, Drink & Supplement vs. Medication Checker')}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/interactions" className="btn small" style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
              ⚡ {tr(lang, 'فاحص تداخل دواء مع دواء', 'Drug-Drug Interaction Checker')}
            </Link>
            <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
              🏥 {tr(lang, 'مجمع العيادات', 'Clinics Hub')}
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
          {tr(lang, 'فاحص «الأكل والشرب مع دوائك»: إيه اللي يبطل مفعول الدواء وتفصل بينهم بكام ساعة؟', 'Food & Drink vs. Your Meds: What Blocks Absorption & Exact Timing Rules')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
          {tr(
            lang,
            'اختر مشروبك أو أكلتك اليومية (الشاي والقهوة، اللبن والجبنة، العرقسوس، الملوخية والسبانخ، الجريب فروت، أو أخذ الدواء على الريق) لتعرف فوراً تأثيرها على أدويتك والفاصل الزمني الذهبي بالساعة.',
            'Select common foods and beverages (tea, coffee, dairy, licorice, leafy greens, citrus, or fasting doses) to see how they affect your medications and the exact hour separation needed.'
          )}
        </p>
      </section>

      {/* Search & Quick Food Category Filter */}
      <section className="card" style={{ borderRadius: '18px', padding: '18px', marginBottom: '20px', border: '1.5px solid #cbd5e1' }}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 ابحث باسم الأكلة أو المشروب أو الدواء (مثال: شاي، قهوة، لبن، عرقسوس، التروكسين، حديد، ماريفان، كتافلام)..."
          style={{
            width: '100%',
            padding: '13px 16px',
            borderRadius: '14px',
            border: '2px solid #cbd5e1',
            fontSize: '0.96rem',
            marginBottom: '14px',
          }}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: '🍽️ كل الأكلات والمشروبات (9)' },
            { id: 'tea_coffee', label: '☕ الشاي والقهوة' },
            { id: 'dairy_milk', label: '🥛 اللبن والجبنة والزبادي' },
            { id: 'licorice_salty', label: '🥤 العرقسوس والمخللات' },
            { id: 'leafy_vitk', label: '🥬 الملوخية والسبانخ والكبدة' },
            { id: 'grapefruit_citrus', label: '🍊 الجريب فروت والموالح' },
            { id: 'potassium_rich', label: '🍌 الموز والتمر وملح الدايت' },
            { id: 'fava_beans', label: '🫘 الفول والطعمية (G6PD)' },
            { id: 'empty_stomach', label: '💊 الدواء على الريق' },
          ].map((cat) => {
            const sel = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as FoodCategoryKey)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: sel ? '2px solid #d97706' : '1px solid #cbd5e1',
                  background: sel ? '#0D1F38' : '#f8fafc',
                  color: sel ? '#ffffff' : '#0D1F38',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Cards Grid */}
      <section style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
        {filteredRules.map((rule) => {
          const isDanger = rule.severity === 'critical_danger';
          return (
            <article
              key={rule.id}
              className="card"
              style={{
                borderRadius: '20px',
                border: isDanger ? '2px solid #fca5a5' : '2px solid #fcd34d',
                background: '#ffffff',
                padding: '20px',
                boxShadow: '0 8px 20px rgba(13, 31, 56, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2.4rem' }}>{rule.foodIcon}</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: isDanger ? '#dc2626' : '#b45309' }}>
                      {isDanger ? '🚨 تعارض غذائي دوائي خطير' : '⚠️ يقلل أو يبطل امتصاص الدواء'}
                    </div>
                    <h2 style={{ margin: '2px 0 4px', fontSize: '1.22rem', color: '#0D1F38', fontWeight: 900 }}>
                      {rule.foodNameAr} ✖️ {rule.drugClassAr}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                      💊 أشهر الأدوية في مصر: <span style={{ color: '#0f766e' }}>{rule.popularEgyptianBrandsAr}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '7px 14px',
                      borderRadius: '20px',
                      background: isDanger ? '#fef2f2' : '#fffbeb',
                      border: isDanger ? '1.5px solid #ef4444' : '1.5px solid #f59e0b',
                      color: isDanger ? '#991b1b' : '#92400e',
                      fontWeight: 900,
                      fontSize: '0.82rem',
                    }}
                  >
                    {rule.idealTimingBadgeAr}
                  </span>
                  <button
                    type="button"
                    className="chip"
                    onClick={() =>
                      speakText(`${rule.foodNameAr} مع ${rule.drugClassAr}. ${rule.whatHappensInBodyAr} ${rule.safeActionPlanAr}`, lang)
                    }
                  >
                    🔊 استمع
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '10px' }}>
                <div style={{ background: '#fff1f2', borderRight: '4px solid #e11d48', padding: '12px 14px', borderRadius: '12px' }}>
                  <strong style={{ color: '#9f1239', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                    🔬 ماذا يحدث كيميائياً داخل جسمك؟
                  </strong>
                  <p style={{ margin: 0, color: '#1e293b', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {rule.whatHappensInBodyAr}
                  </p>
                </div>

                <div style={{ background: '#f0fdf4', borderRight: '4px solid #16a34a', padding: '12px 14px', borderRadius: '12px' }}>
                  <strong style={{ color: '#166534', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                    ✅ القاعدة الذهبية للتصرف الآمن:
                  </strong>
                  <p style={{ margin: 0, color: '#1e293b', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {rule.safeActionPlanAr}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <Link
                  to={rule.relatedClinicRoute}
                  style={{ color: '#138866', fontWeight: 900, fontSize: '0.88rem', textDecoration: 'none' }}
                >
                  {rule.relatedClinicNameAr} ←
                </Link>
                <Link
                  to="/daily-schedule"
                  style={{ color: '#0D1F38', fontWeight: 800, fontSize: '0.84rem', textDecoration: 'none' }}
                >
                  🗓️ اضبط مواعيد أدويتك تلقائياً بعيداً عن الأكل ←
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <Disclaimer />
    </main>
  );
}
