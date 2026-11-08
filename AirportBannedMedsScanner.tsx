import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';
import { DosageFormVectorBadge } from './DawayaVectorIcons';

export interface BannedMedRule {
  id: string;
  nameAr: string;
  nameEn: string;
  activeIngredients: string;
  commonBrandsAr: string;
  commonBrandsEn: string;
  status: 'strictly_banned' | 'prescription_strictly_required' | 'allowed_personal_use';
  category: 'cold_flu' | 'nerve_pain' | 'sedative_sleep' | 'severe_pain' | 'adhd_stimulant';
  restrictionNoticeAr: string;
  restrictionNoticeEn: string;
  destinationsAffected: string[]; // 'saudi' | 'uae' | 'kuwait' | 'qatar' | 'international'
}

export const AIRPORT_BANNED_MEDS: BannedMedRule[] = [
  {
    id: 'pseudoephedrine_cold',
    nameAr: 'أدوية البرد والجيوب الأنفية المحتوية على سودوإيفيدرين',
    nameEn: 'Pseudoephedrine Cold & Sinus Preparations',
    activeIngredients: 'Pseudoephedrine Hydrochloride',
    commonBrandsAr: 'باور كابس، كونجستال، كومتركس، بانادول كولد آند فلو، 123 أقراص، كلارينيز',
    commonBrandsEn: 'Power Caps, Congestal, Comtrex, Panadol Cold & Flu, 123, Clarinase',
    status: 'prescription_strictly_required',
    category: 'cold_flu',
    restrictionNoticeAr: '⚠️ مادة منشطة ومراقبة جمركياً في مطارات الخليج (السعودية والإمارات والكويت). مسموح فقط بعبوة واحدة شخصية بروشتة طبية وتقف في الجمارك لو كانت كميات متعددة!',
    restrictionNoticeEn: 'Controlled substance in Saudi Arabia & UAE. Strictly limit to 1 personal box with physician prescription.',
    destinationsAffected: ['saudi', 'uae', 'kuwait', 'qatar'],
  },
  {
    id: 'pregabalin_nerve',
    nameAr: 'مسكنات الأعصاب المحتوية على بريجابالين',
    nameEn: 'Pregabalin Neuropathic Pain Medicines',
    activeIngredients: 'Pregabalin',
    commonBrandsAr: 'ليريكا (Lyrica)، ليرولين (Lyrolin)، بريجادكس، جابالين، كيميريكا',
    commonBrandsEn: 'Lyrica, Lyrolin, Brigadix, Gabaline, Kemirica',
    status: 'strictly_banned',
    category: 'nerve_pain',
    restrictionNoticeAr: '🚨 محظور ومصنف كجدول مخدرات مشدد في مطارات السعودية والإمارات والخليج. حيازته بدون تقرير طبي معتمد موثق من وزارة الصحة والخارجية يعرضك للحبس الجمركي الفوري!',
    restrictionNoticeEn: 'Strictly controlled narcotic class in Saudi Arabia & UAE. Requires verified embassy-attested medical report.',
    destinationsAffected: ['saudi', 'uae', 'kuwait', 'qatar', 'international'],
  },
  {
    id: 'gabapentin_nerve',
    nameAr: 'جابابنتين لالتهاب الأعصاب',
    nameEn: 'Gabapentin Nerve Medications',
    activeIngredients: 'Gabapentin',
    commonBrandsAr: 'كونفنتين (Conventin)، جاباماش، نيورونتين (Neurontin)',
    commonBrandsEn: 'Conventin, Gabamash, Neurontin',
    status: 'prescription_strictly_required',
    category: 'nerve_pain',
    restrictionNoticeAr: '⚠️ دواء خاضع للرقابة المشددة. لا تسافر به إلا بوجود روشتة رسمية معتمدة تحدد الجرعة ومدة العلاج ولا تحمل كميات تفوق فترة رحلتك.',
    restrictionNoticeEn: 'Controlled substance. Carry only personal supply accompanied by official prescription and diagnosis.',
    destinationsAffected: ['saudi', 'uae', 'kuwait'],
  },
  {
    id: 'tramadol_opioid',
    nameAr: 'ترامادول ومشتقات المسكنات الأفيونية',
    nameEn: 'Tramadol & Opioid Analgesics',
    activeIngredients: 'Tramadol Hydrochloride',
    commonBrandsAr: 'ترامادول، تامول، ترامال، كونترمال، ألتراسيت',
    commonBrandsEn: 'Tramadol, Tramal, Contramal, Ultracet',
    status: 'strictly_banned',
    category: 'severe_pain',
    restrictionNoticeAr: '⛔ مجرّم وممنوع تماماً في جميع مطارات العالم والجمارك المصرية والخليجية. إدخاله بدون موافقة مسبقة من إدارة مكافحة المخدرات يمثل جناية جلب مخدرات.',
    restrictionNoticeEn: 'Strictly prohibited worldwide. Unauthorized carriage constitutes a severe international drug trafficking felony.',
    destinationsAffected: ['saudi', 'uae', 'kuwait', 'qatar', 'international'],
  },
  {
    id: 'codeine_cough',
    nameAr: 'أشربة السعال والمسكنات المحتوية على كودايين',
    nameEn: 'Codeine Cough Syrups & Analgesics',
    activeIngredients: 'Codeine / Dextromethorphan (High Dose)',
    commonBrandsAr: 'سولبادين فوار مع كودايين، برونكوفين، كوديفان، كوديلار',
    commonBrandsEn: 'Solpadeine with Codeine, Bronchophane, Codilar',
    status: 'strictly_banned',
    category: 'cold_flu',
    restrictionNoticeAr: '🚨 مشتق أفيوني محظور وممنوع دخوله مطارات السعودية والإمارات نهائياً في حقائب السفر حتى لو كان شراب كحة عادياً بمصر!',
    restrictionNoticeEn: 'Strictly banned in Gulf airports. Prohibited even as regular cough syrup.',
    destinationsAffected: ['saudi', 'uae', 'kuwait', 'qatar'],
  },
  {
    id: 'zolpidem_sleep',
    nameAr: 'المهدئات وأدوية النوم والقلق المحتوية على زولبيديم أو بنزوديازيبين',
    nameEn: 'Zolpidem & Benzodiazepine Sedatives',
    activeIngredients: 'Zolpidem / Alprazolam / Clonazepam',
    commonBrandsAr: 'زولام، زاناكس، أبتريل، كالميبام، لكسوتانيل، ستيلنوكس',
    commonBrandsEn: 'Zolam, Xanax, Apetryl, Calmepam, Lexotanil, Stilnox',
    status: 'strictly_banned',
    category: 'sedative_sleep',
    restrictionNoticeAr: '🚨 ممنوع تماماً في صالات الوصول بالمطارات إلا بتصريح استيراد دوائي شخصي مسبق أو تصديق طبي رسمي معتمد من قنصلية بلد الوصول.',
    restrictionNoticeEn: 'Strictly restricted psychiatric/hypnotic. Requires certified prior embassy medical clearance.',
    destinationsAffected: ['saudi', 'uae', 'kuwait', 'qatar', 'international'],
  },
  {
    id: 'panadol_advance_safe',
    nameAr: 'باراسيتامول ومسكنات الصداع العادية',
    nameEn: 'Plain Paracetamol & OTC NSAIDs',
    activeIngredients: 'Paracetamol / Ibuprofen',
    commonBrandsAr: 'بانادول أزرق (Advance)، بروفين، سيتال، كتافلام، فيتامين سي',
    commonBrandsEn: 'Panadol Blue, Brufen, Cetal, Cataflam, Vitamin C',
    status: 'allowed_personal_use',
    category: 'cold_flu',
    restrictionNoticeAr: '🟢 مسموح بالكامل وبأمان تام في جميع المطارات والجمارك للاستخدام الشخصي دون أي قيود.',
    restrictionNoticeEn: '100% permitted worldwide for personal use without restrictions.',
    destinationsAffected: ['saudi', 'uae', 'kuwait', 'qatar', 'international'],
  },
];

export default function AirportBannedMedsScanner() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedDestination, setSelectedDestination] = useState<string>('saudi');
  const [searchQ, setSearchQ] = useState<string>('');

  const filteredRules = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    return AIRPORT_BANNED_MEDS.filter((rule) => {
      const matchDest =
        selectedDestination === 'all' ||
        rule.destinationsAffected.includes(selectedDestination) ||
        rule.destinationsAffected.includes('international');
      if (!matchDest) return false;
      if (!q) return true;
      const hay = `${rule.nameAr} ${rule.nameEn} ${rule.commonBrandsAr} ${rule.commonBrandsEn} ${rule.activeIngredients}`.toLowerCase();
      return hay.includes(q);
    });
  }, [selectedDestination, searchQ]);

  const bannedCount = filteredRules.filter((r) => r.status === 'strictly_banned').length;
  const cautionCount = filteredRules.filter((r) => r.status === 'prescription_strictly_required').length;

  return (
    <main className="wrap stack" style={{ paddingTop: '10px' }}>
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #1A2E4C 55%, #b91c1c 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #CFD29D',
          boxShadow: '0 12px 34px rgba(13, 31, 56, 0.4)',
        }}
      >
        <div className="head" style={{ marginBottom: '8px' }}>
          <div>
            <span
              className="badge"
              style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800, marginBottom: '6px' }}
            >
              ✈️ {tr(lang, 'دليل الجمارك والمطارات للمسافرين من مصر', 'Egypt Airport & Customs Travel Medication Guide')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              🛂 {tr(lang, 'كاشف الأدوية الممنوعة والمحظورة في المطارات والجمارك', 'Airport & Customs Banned Medication Scanner')}
            </h1>
          </div>
          <Link to="/travel-kit" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800 }}>
            🧳 {isAr ? 'حقيبة أدوية السفر' : 'Travel Med Kit'}
          </Link>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'افحص أدويتك قبل وضعها في شنطة السفر: أدوية شائعة تباع في مصر بدون روشتة (كأدوية البرد، مسكنات الأعصاب، والمهدئات) قد تؤدي للتوقيف أو المساءلة الجمركية المشددة في مطارات الخليج والدول الأجنبية.',
            'Scan medications before packing: common OTC drugs in Egypt (cold syrups, nerve pain meds, sedatives) are strictly controlled narcotics abroad and may cause immediate airport detention.'
          )}
        </p>

        {/* Destination Filter Tabs */}
        <div className="row wrapRow" style={{ gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(207, 210, 157, 0.25)' }}>
          <button
            type="button"
            className={`btn small ${selectedDestination === 'saudi' ? '' : 'ghost'}`}
            style={selectedDestination === 'saudi' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedDestination('saudi')}
          >
            🇸🇦 {isAr ? 'السعودية (عمرة / حج / عمل)' : 'Saudi Arabia'}
          </button>
          <button
            type="button"
            className={`btn small ${selectedDestination === 'uae' ? '' : 'ghost'}`}
            style={selectedDestination === 'uae' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedDestination('uae')}
          >
            🇦🇪 {isAr ? 'الإمارات (دبي / أبوظبي)' : 'UAE'}
          </button>
          <button
            type="button"
            className={`btn small ${selectedDestination === 'kuwait' ? '' : 'ghost'}`}
            style={selectedDestination === 'kuwait' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedDestination('kuwait')}
          >
            🇰🇼 {isAr ? 'الكويت وقطر' : 'Kuwait & Qatar'}
          </button>
          <button
            type="button"
            className={`btn small ${selectedDestination === 'all' ? '' : 'ghost'}`}
            style={selectedDestination === 'all' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedDestination('all')}
          >
            🌍 {isAr ? 'جميع الدول والمطارات' : 'All International'}
          </button>
        </div>
      </section>

      {/* Search Input */}
      <section className="card">
        <label htmlFor="banned-search" className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>
          🔍 {isAr ? 'ابحث باسم الدواء المصري للتأكد من موقفه الجمركي في المطار:' : 'Search medicine name to check airport customs legality:'}
        </label>
        <input
          id="banned-search"
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={isAr ? 'مثال: باور كابس، كونجستال، ليريكا، ترامادول، سولبادين، زولام، بنادول...' : 'e.g., Power Caps, Congestal, Lyrica, Tramadol, Panadol...'}
        />
      </section>

      {/* Rules Grid */}
      <div className="grid">
        {filteredRules.map((r) => {
          const isBanned = r.status === 'strictly_banned';
          const isCaution = r.status === 'prescription_strictly_required';

          return (
            <div
              key={r.id}
              className="card stack"
              style={{
                borderInlineStart: isBanned
                  ? '6px solid #dc2626'
                  : isCaution
                  ? '6px solid #d97706'
                  : '6px solid #138866',
                background: isBanned ? 'rgba(239, 68, 68, 0.04)' : 'var(--card-bg)',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--navy)' }}>
                    {isAr ? r.nameAr : r.nameEn}
                  </h3>
                  <span
                    className="badge"
                    style={{
                      background: isBanned ? '#fee2e2' : isCaution ? '#fef3c7' : '#dcfce7',
                      color: isBanned ? '#991b1b' : isCaution ? '#92400e' : '#15803d',
                      fontWeight: 800,
                    }}
                  >
                    {isBanned
                      ? '⛔ محظور وممنوع دخوله المطار'
                      : isCaution
                      ? '⚠️ بروشتة معتمدة فقط'
                      : '🟢 مسموح للاستخدام الشخصي'}
                  </span>
                </div>

                <div className="small muted" style={{ marginTop: '4px' }}>
                  <b>{isAr ? 'المادة الفعالة: ' : 'Active Ingredient: '}</b>{r.activeIngredients}
                </div>

                <div style={{ marginTop: '8px', padding: '10px', borderRadius: '10px', background: 'var(--tint)' }}>
                  <b style={{ color: '#0D1F38', fontSize: '0.84rem' }}>
                    💊 {isAr ? 'أشهر الأسماء التجارية في الصيدليات المصرية:' : 'Common Brands in Egypt:'}
                  </b>
                  <div className="small" style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {isAr ? r.commonBrandsAr : r.commonBrandsEn}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: isBanned ? '#fef2f2' : isCaution ? '#fffbeb' : '#f0fdf4',
                    border: isBanned ? '1px solid #fecaca' : isCaution ? '1px solid #fde68a' : '1px solid #bbf7d0',
                  }}
                >
                  <p className="small" style={{ margin: 0, color: isBanned ? '#991b1b' : isCaution ? '#78350f' : '#166534', fontWeight: 600 }}>
                    {isAr ? r.restrictionNoticeAr : r.restrictionNoticeEn}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    isAr
                      ? `⚠️ تنبيه للمسافرين لمطار (${selectedDestination === 'saudi' ? 'السعودية' : 'الخليج'}):\n• الدواء: ${r.nameAr}\n• المستحضرات: ${r.commonBrandsAr}\n• الموقف الجمركي: ${r.restrictionNoticeAr}\n🔗 فحص أدوية السفر على منصة دوايا: https://mmo277.github.io/DAWAYA/#/airport-banned-meds`
                      : `Airport customs alert: ${r.nameEn}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn small ghost"
                  style={{ width: '100%', textAlign: 'center', color: '#138866', borderColor: 'rgba(19, 136, 102, 0.4)' }}
                >
                  📲 {isAr ? 'تحذير مسافر على واتساب' : 'Share Travel Warning'}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <Disclaimer />
    </main>
  );
}
