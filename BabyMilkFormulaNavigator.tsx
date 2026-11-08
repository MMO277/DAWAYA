import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export interface BabyFormulaItem {
  id: string;
  brandAr: string;
  brandEn: string;
  stage: '1' | '2' | '3' | 'pre';
  stageLabelAr: string;
  stageLabelEn: string;
  formulaType: 'standard' | 'ar_reflux' | 'lf_lactose_free' | 'ha_hypoallergenic' | 'comfort_colic' | 'amino_acid';
  typeLabelAr: string;
  typeLabelEn: string;
  priceEgp: number;
  manufacturer: string;
  featuresAr: string;
  featuresEn: string;
  exactEquivalents: string[];
}

export const EGYPTIAN_BABY_FORMULAS: BabyFormulaItem[] = [
  {
    id: 'nan_1',
    brandAr: 'نان 1 (NAN 1 Optipro)',
    brandEn: 'NAN 1 Optipro',
    stage: '1',
    stageLabelAr: 'المرحلة 1 (من الولادة حتى 6 أشهر)',
    stageLabelEn: 'Stage 1 (0 to 6 months)',
    formulaType: 'standard',
    typeLabelAr: 'حليب نمو قياسي للرضع الأصحاء',
    typeLabelEn: 'Standard Infant Formula',
    priceEgp: 380,
    manufacturer: 'Nestlé',
    featuresAr: 'مدعم بالبروتين المطور (Optipro)، فيتامينات ومعادن وبكتيريا بروبيوتك لدعم الهضم.',
    featuresEn: 'Optipro protein, vitamins, minerals, and probiotics.',
    exactEquivalents: ['بيبيلاك 1', 'هيرو بيبي 1', 'أبتاميل 1', 'سيميلاك جولد 1'],
  },
  {
    id: 'bebelac_1',
    brandAr: 'بيبيلاك 1 (Bebelac 1)',
    brandEn: 'Bebelac 1',
    stage: '1',
    stageLabelAr: 'المرحلة 1 (من الولادة حتى 6 أشهر)',
    stageLabelEn: 'Stage 1 (0 to 6 months)',
    formulaType: 'standard',
    typeLabelAr: 'حليب نمو قياسي للرضع الأصحاء',
    typeLabelEn: 'Standard Infant Formula',
    priceEgp: 295,
    manufacturer: 'Nutricia / Danone',
    featuresAr: 'تركيبة متكاملة مدعمة بالحديد والزنك وفيتامين د وألياف البريبيوتيك المريحة للبطن.',
    featuresEn: 'Complete formula enriched with iron, zinc, prebiotics, and vitamin D.',
    exactEquivalents: ['نان 1', 'هيرو بيبي 1', 'أبتاميل 1'],
  },
  {
    id: 'hero_baby_1',
    brandAr: 'هيرو بيبي 1 نوترادفانس (Hero Baby 1)',
    brandEn: 'Hero Baby 1 Nutrasense',
    stage: '1',
    stageLabelAr: 'المرحلة 1 (من الولادة حتى 6 أشهر)',
    stageLabelEn: 'Stage 1 (0 to 6 months)',
    formulaType: 'standard',
    typeLabelAr: 'حليب نمو قياسي للرضع الأصحاء',
    typeLabelEn: 'Standard Infant Formula',
    priceEgp: 285,
    manufacturer: 'Hero Group Switzerland',
    featuresAr: 'مدعم بأحماض أوميجا 3 و 6 (DHA & ARA) لدعم تطور المخ والبصر ومناعة الرضيع.',
    featuresEn: 'DHA/ARA lipids, GOS fibers, and nucleotides.',
    exactEquivalents: ['بيبيلاك 1', 'نان 1', 'أبتاميل 1'],
  },
  {
    id: 'aptamil_ar',
    brandAr: 'أبتاميل إيه آر (Aptamil AR)',
    brandEn: 'Aptamil AR Anti-Regurgitation',
    stage: '1',
    stageLabelAr: 'المرحلة 1 (من الولادة حتى 6 أشهر)',
    stageLabelEn: 'Stage 1 (0 to 6 months)',
    formulaType: 'ar_reflux',
    typeLabelAr: 'تركيبة مضادة للارتجاع والقشط الشديد (AR)',
    typeLabelEn: 'Anti-Regurgitation Formula (AR)',
    priceEgp: 420,
    manufacturer: 'Nutricia',
    featuresAr: 'يحتوي على صمغ الخروب الطبيعي الذي يثخن الحليب داخل معدة الرضيع لمنع ارتداده وقشطه.',
    featuresEn: 'Thickened with natural carob bean gum to prevent infant regurgitation and vomiting.',
    exactEquivalents: ['بيبيلاك إيه آر (Bebelac AR)', 'نان إيه آر (NAN AR)', 'هيرو بيبي إيه آر'],
  },
  {
    id: 'nan_lf',
    brandAr: 'نان إل إف (NAN LF خالي من اللاكتوز)',
    brandEn: 'NAN LF Lactose-Free',
    stage: '1',
    stageLabelAr: 'من الولادة وجميع الأعمار أثناء الإسهال',
    stageLabelEn: 'All infant ages during diarrhea',
    formulaType: 'lf_lactose_free',
    typeLabelAr: 'حليب خالي من اللاكتوز (لحالات الإسهال والنزلات المعوية)',
    typeLabelEn: 'Lactose-Free Formula (LF)',
    priceEgp: 395,
    manufacturer: 'Nestlé',
    featuresAr: 'مستبدل فيه سكر اللاكتوز لتغذية الرضيع أثناء النزلة المعوية والإسهال الشديد حتى تجدد بطانة الأمعاء.',
    featuresEn: 'Lactose-free recovery formula for acute diarrhea and post-gastroenteritis.',
    exactEquivalents: ['بيبيلاك إل إف (Bebelac LF)', 'أبتاميل إل إف (Aptamil LF)', 'هيرو بيبي إل إف'],
  },
  {
    id: 'bebelac_ha',
    brandAr: 'بيبيلاك إتش إيه (Bebelac HA لحساسية بروتين اللبن)',
    brandEn: 'Bebelac HA Hypoallergenic',
    stage: '1',
    stageLabelAr: 'المرحلة 1 (من الولادة حتى 6 أشهر)',
    stageLabelEn: 'Stage 1 (0 to 6 months)',
    formulaType: 'ha_hypoallergenic',
    typeLabelAr: 'حليب محلل جزئياً للوقاية من حساسية ألبان الأبقار (HA)',
    typeLabelEn: 'Hypoallergenic Partially Hydrolyzed',
    priceEgp: 450,
    manufacturer: 'Nutricia',
    featuresAr: 'بروتين مصل اللبن محلل ومكسر جزئياً لتقليل تفاعلات التحسس والأكزيما الوراثية لدى الرضع.',
    featuresEn: 'Partially hydrolyzed whey proteins to reduce allergic sensitization.',
    exactEquivalents: ['نان إتش إيه (NAN HA)', 'أبتاميل كومفورت (Aptamil Comfort)'],
  },
  {
    id: 'neocate_lcp',
    brandAr: 'نيوكيت إل سي بي (Neocate LCP للأحماض الأمينية)',
    brandEn: 'Neocate LCP Amino Acid Formula',
    stage: '1',
    stageLabelAr: 'علاجي من الولادة (لحساسية الألبان الشديدة)',
    stageLabelEn: 'Medical Food for Severe Cow Milk Allergy',
    formulaType: 'amino_acid',
    typeLabelAr: 'حليب علاجي متقدم قائم على الأحماض الأمينية 100%',
    typeLabelEn: '100% Free Amino Acid-Based Formula',
    priceEgp: 950,
    manufacturer: 'Nutricia Specialized Nutrition',
    featuresAr: 'خالٍ 100% من أي بروتين لبن؛ يحتوي على أحماض أمينية نقية لحالات حساسية الألبان المعقدة وسوء الامتصاص الشديد.',
    featuresEn: 'Hypoallergenic elemental amino acid formula for severe CMA and multiple food protein allergies.',
    exactEquivalents: ['ألفامينو (Alfamino Infant)'],
  },
];

export default function BabyMilkFormulaNavigator() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQ, setSearchQ] = useState('');

  const filteredFormulas = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    return EGYPTIAN_BABY_FORMULAS.filter((f) => {
      if (selectedStage !== 'all' && f.stage !== selectedStage) return false;
      if (selectedType !== 'all' && f.formulaType !== selectedType) return false;
      if (!q) return true;
      const hay = `${f.brandAr} ${f.brandEn} ${f.typeLabelAr} ${f.featuresAr}`.toLowerCase();
      return hay.includes(q);
    });
  }, [selectedStage, selectedType, searchQ]);

  return (
    <main className="wrap stack" style={{ paddingTop: '10px' }}>
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #152E52 55%, #0284c7 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #CFD29D',
          boxShadow: '0 12px 34px rgba(13, 31, 56, 0.35)',
        }}
      >
        <div className="head" style={{ marginBottom: '8px' }}>
          <div>
            <span
              className="badge"
              style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800, marginBottom: '6px' }}
            >
              🍼 {tr(lang, 'دليل الأمهات وأطباء الأطفال في مصر', 'Egyptian Infant Milk Formula & Allergy Navigator')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              👶 {tr(lang, 'دليل وحاسبة بدائل حليب وألبان الأطفال العلاجية', 'Baby Milk Formula & Allergy Generics Navigator')}
            </h1>
          </div>
          <Link to="/pediatric-helper" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800 }}>
            👶 {isAr ? 'حاسبة جرعات الأطفال' : 'Pediatric Dosing'}
          </Link>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'حل أزمة نقص حليب الرضع في الصيدليات المصرية: اكتشفي المثائل المتطابقة تماماً في التركيبة الغذائية ونسب الفيتامينات، ودليل الألبان العلاجية (لحالات حساسية بروتين اللبن HA، والارتجاع AR، والإسهال الخالي من اللاكتوز LF).',
            'Overcome baby formula shortages in Egypt: find identical nutritional generics (NAN, Bebelac, Hero Baby) and specialized medical formulas for milk allergy (HA), reflux (AR), and lactose intolerance (LF).'
          )}
        </p>

        {/* Quick Type Filter Tabs */}
        <div className="row wrapRow" style={{ gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(207, 210, 157, 0.25)' }}>
          <button
            type="button"
            className={`btn small ${selectedType === 'all' ? '' : 'ghost'}`}
            style={selectedType === 'all' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedType('all')}
          >
            {isAr ? 'الكل (نمو وعلاجي)' : 'All Formulas'}
          </button>
          <button
            type="button"
            className={`btn small ${selectedType === 'standard' ? '' : 'ghost'}`}
            style={selectedType === 'standard' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedType('standard')}
          >
            🍼 {isAr ? 'حليب النمو العادي (1 و 2)' : 'Standard Growth'}
          </button>
          <button
            type="button"
            className={`btn small ${selectedType === 'ar_reflux' ? '' : 'ghost'}`}
            style={selectedType === 'ar_reflux' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedType('ar_reflux')}
          >
            💧 {isAr ? 'مضاد للارتجاع والقشط (AR)' : 'Anti-Reflux (AR)'}
          </button>
          <button
            type="button"
            className={`btn small ${selectedType === 'lf_lactose_free' ? '' : 'ghost'}`}
            style={selectedType === 'lf_lactose_free' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedType('lf_lactose_free')}
          >
            🚫 {isAr ? 'خالي من اللاكتوز للإسهال (LF)' : 'Lactose-Free (LF)'}
          </button>
          <button
            type="button"
            className={`btn small ${selectedType === 'ha_hypoallergenic' || selectedType === 'amino_acid' ? '' : 'ghost'}`}
            style={selectedType === 'ha_hypoallergenic' || selectedType === 'amino_acid' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedType('ha_hypoallergenic')}
          >
            🛡️ {isAr ? 'حساسية ألبان الأبقار (HA / أحماض)' : 'Milk Allergy (HA)'}
          </button>
        </div>
      </section>

      {/* Search Input */}
      <section className="card">
        <label htmlFor="milk-search" className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>
          🔍 {isAr ? 'ابحثي باسم حليب طفلك لإيجاد بديله المتطابق وسعره:' : 'Search baby formula brand to find exact generic equivalents:'}
        </label>
        <input
          id="milk-search"
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={isAr ? 'مثال: نان، بيبيلاك، أبتاميل، هيرو بيبي، نيوكيت...' : 'e.g., NAN, Bebelac, Aptamil, Hero Baby, Neocate...'}
        />
      </section>

      {/* Formulas Grid */}
      <div className="grid">
        {filteredFormulas.map((f) => {
          return (
            <div
              key={f.id}
              className="card stack"
              style={{
                borderInlineStart: f.formulaType === 'amino_acid' || f.formulaType === 'ha_hypoallergenic'
                  ? '6px solid #7c3aed'
                  : f.formulaType === 'ar_reflux'
                  ? '6px solid #0284c7'
                  : '6px solid #138866',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--navy)' }}>
                      🍼 {isAr ? f.brandAr : f.brandEn}
                    </h3>
                    <div className="small muted">{f.manufacturer}</div>
                  </div>
                  <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.92rem' }}>
                    {f.priceEgp} {isAr ? 'ج.م' : 'EGP'}
                  </span>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0369a1', fontWeight: 700 }}>
                    {isAr ? f.typeLabelAr : f.typeLabelEn}
                  </span>
                  <span className="badge" style={{ background: 'var(--tint)', color: 'var(--muted)' }}>
                    {isAr ? f.stageLabelAr : f.stageLabelEn}
                  </span>
                </div>

                <p className="small" style={{ margin: '8px 0 0', color: '#475569' }}>
                  {isAr ? f.featuresAr : f.featuresEn}
                </p>

                {/* Exact Equivalents Section */}
                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'var(--tint)' }}>
                  <b style={{ color: '#0D1F38', fontSize: '0.84rem' }}>
                    🔄 {isAr ? 'البدائل المتطابقة تماماً في حال نقص هذا الصنف:' : 'Exact Equivalent Generics If Out of Stock:'}
                  </b>
                  <div className="row wrapRow" style={{ gap: '6px', marginTop: '6px' }}>
                    {f.exactEquivalents.map((eq) => (
                      <span key={eq} className="badge" style={{ background: '#FFFFFF', border: '1px solid var(--line)', color: '#138866', fontWeight: 700 }}>
                        ✓ {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    isAr
                      ? `🍼 بدائل حليب (${f.brandAr}):\n• السعر الرسمي: ${f.priceEgp} ج.م\n• النوع: ${f.typeLabelAr}\n• البدائل المتطابقة تماماً عند النقص: ${f.exactEquivalents.join('، ')}\n🔗 دليل ألبان الأطفال على منصة دوايا: https://mmo277.github.io/DAWAYA/#/baby-milk`
                      : `Baby milk formula generics for ${f.brandEn}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn small ghost"
                  style={{ width: '100%', textAlign: 'center', color: '#138866', borderColor: 'rgba(19, 136, 102, 0.4)' }}
                >
                  📲 {isAr ? 'إرسال البدائل للأم على واتساب' : 'Share Formula Generics'}
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
