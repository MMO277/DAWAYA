import { pick } from './types';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import {
  PEDIATRIC_SUSPENSIONS,
  RECONSTITUTION_STEPS,
  PediatricSuspension,
} from './pediatricData';
import {
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';

export default function PediatricHelper() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { indexItems } = useDawayaDrugDatabase();

  // Selected suspension
  const [selectedId, setSelectedId] = useState('cetal_250_syrup');
  const selectedMed: PediatricSuspension =
    PEDIATRIC_SUSPENSIONS.find((m) => m.id === selectedId) || PEDIATRIC_SUSPENSIONS[0];

  // Live search across all 26,562 DAWAYA pediatric syrups/suspensions/drops
  const [pedQuery, setPedQuery] = useState('');
  const pedDawayaMatches = useMemo(() => {
    const q = pedQuery.trim();
    if (!q) return [];
    return searchDawayaIndex(indexItems, { query: `${q}` }, isAr)
      .filter((it) =>
        /syrup|susp|drop|ped|شراب|معلق|نقط|أطفال/i.test(`${it.n} ${it.a} ${it.f}`)
      )
      .slice(0, 8);
  }, [pedQuery, indexItems, isAr]);

  // Weight calculator states
  const [weightInput, setWeightInput] = useState<string>('12');
  const weightKg = Math.max(0, parseFloat(weightInput) || 0);
  const [useHighDose, setUseHighDose] = useState<boolean>(false);

  // Shelf-life countdown states
  const [reconstitutedDate, setReconstitutedDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0],
  );

  // Calculate doses
  const doseMgPerKg =
    useHighDose && selectedMed.highDoseMgPerKgPerDay
      ? selectedMed.highDoseMgPerKgPerDay
      : selectedMed.standardDoseMgPerKgPerDay;

  const totalMgPerDay = Math.round(weightKg * doseMgPerKg * 10) / 10;
  const singleDoseMg = Math.round((totalMgPerDay / selectedMed.dosesPerDay) * 10) / 10;
  const singleDoseMl = Math.round((singleDoseMg / selectedMed.mgPerMl) * 10) / 10;

  // Calculate expiration date
  const [reYear, reMonth, reDay] = reconstitutedDate.split('-').map(Number);
  const reDateObj = new Date(reYear, reMonth - 1, reDay);
  const expDateObj = new Date(reDateObj.getTime() + selectedMed.shelfLifeDays * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expDateObj.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>
          👶{' '}
          {isAr
            ? 'حاسبة ودليل جرعات أدوية وشراب الأطفال الشامل (خافض الحرارة، الحساسية، والمضادات)'
            : 'Comprehensive Pediatric Syrup & Suspension Dosing Helper'}
        </h1>
        <p className="muted">
          {isAr
            ? 'أداة سريرية وتوعوية للأمهات والصيادلة لحساب جرعات شراب الأطفال بالسيرنجة (مل) حسب الوزن، مع البحث المباشر في كل أدوية الشراب والنقط للأطفال في مصر (26,562+ دواء).'
            : 'Clinical pediatric tool for calculating weight-based oral syringe doses in mL across antipyretics, allergy syrups, and suspensions, connected to the 26,562 Egyptian medicine database.'}
        </p>
      </header>

      {/* Drug Selection Card */}
      <section className="card stack">
        <h2>💊 {isAr ? '1. اختر دواء الشراب لحساب الجرعة بالسنتي (مل):' : '1. Select Pediatric Syrup / Suspension:'}</h2>
        <div className="field-group">
          <select
            className="select-input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label="Select Pediatric Suspension"
          >
            {PEDIATRIC_SUSPENSIONS.map((med) => (
              <option key={med.id} value={med.id}>
                {pick(med.tradeName, lang)} — ({pick(med.genericName, lang)})
              </option>
            ))}
          </select>
        </div>

        {/* Live 26,562 DAWAYA Pediatric Syrup Lookup */}
        <div style={{ marginTop: '10px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
          <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            🔍 {isAr ? 'أو ابحث في جميع أدوية الشراب والنقط للأطفال في قاعدة دوايا (26,562+ دواء):' : 'Or search all pediatric syrups & drops in DAWAYA (26,562+ DB):'}
          </label>
          <input
            type="search"
            value={pedQuery}
            onChange={(e) => setPedQuery(e.target.value)}
            placeholder={isAr ? 'اكتب اسم الشراب أو النقط (مثال: سيتال، بروفين، تلفاست، فنتولين، أوجمنتين)...' : 'Type syrup or drops name (e.g. Cetal, Brufen, Telfast, Ventolin)...'}
          />
          {pedDawayaMatches.length > 0 && (
            <div className="grid" style={{ marginTop: '10px' }}>
              {pedDawayaMatches.map((it) => (
                <Link
                  key={it.i}
                  to={`/medicine/${it.i}`}
                  className="subcard"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}
                >
                  <div>
                    <b>{isAr ? it.a || it.n : it.n}</b>
                    <div className="small muted">{it.g} · {it.s}</div>
                  </div>
                  <span className="badge approved">{it.p ? `${it.p} EGP` : '📖'}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 1: Weight-Based Syringe Volume Calculator */}
      <section className="card stack highlight-card">
        <div className="card-head-row">
          <div>
            <h2>⚖️ {isAr ? '2. حاسبة جرعة الطفل بالسيرنجة بالملليلتر (ml):' : '2. Weight-Based Syringe Dosing Calculator:'}</h2>
            <p className="small muted">
              {isAr
                ? 'تحسب الجرعة الدقيقة لكل مرة بناءً على وزن الطفل بالكيلوجرام وتركيز الدواء المختار.'
                : 'Calculates exact single-dose volume in milliliters based on body weight.'}
            </p>
          </div>
          <span className="cat-pill safe">
            {selectedMed.dosesPerDay}{' '}
            {isAr
              ? `مرات يومياً (كل ${selectedMed.frequencyHours} ساعة)`
              : `times daily (every ${selectedMed.frequencyHours}h)`}
          </span>
        </div>

        <div className="calc-inputs-row">
          <div className="field-group">
            <label><b>{isAr ? 'وزن الطفل بالكيلوجرام (كجم):' : 'Child Weight (kg):'}</b></label>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              max={60}
              step={0.5}
              placeholder={isAr ? 'أدخل وزن الطفل بالكيلوجرام (مثلاً: 12)' : 'Enter child weight in kg (e.g. 12)'}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="number-input"
            />
            <div className="row wrapRow" style={{ gap: '6px', marginTop: '8px' }}>
              <span className="small muted">{isAr ? 'اختيار سريع:' : 'Quick pick:'}</span>
              {[5, 8, 10, 12, 15, 20, 25].map((w) => (
                <button
                  key={w}
                  type="button"
                  className={'chip ' + (weightInput === String(w) ? 'on' : '')}
                  style={{ padding: '2px 10px', fontSize: '0.8rem' }}
                  onClick={() => setWeightInput(String(w))}
                >
                  {w} {isAr ? 'كجم' : 'kg'}
                </button>
              ))}
            </div>
          </div>

          {selectedMed.highDoseMgPerKgPerDay && (
            <div className="field-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useHighDose}
                  onChange={(e) => setUseHighDose(e.target.checked)}
                />
                <span>
                  {isAr
                    ? 'الجرعة القصوى الموصوفة طبياً (حسب إرشاد طبيب الأطفال)'
                    : 'Maximum Pediatric Regimen (under pediatrician direction)'}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Calculation Result Box */}
        <div className="dose-result-box">
          <div className="result-kpi-row">
            <div className="kpi-block highlight">
              <span className="kpi-sub">{isAr ? 'الجرعة في المرة الواحدة بالسيرنجة' : 'Single Dose Volume'}</span>
              <span className="kpi-main">{singleDoseMl} <small>{isAr ? 'مل (سنتي)' : 'ml'}</small></span>
              <span className="kpi-freq">
                {isAr ? `كل ${selectedMed.frequencyHours} ساعة` : `Every ${selectedMed.frequencyHours} hours`}
              </span>
            </div>

            <div className="kpi-block">
              <span className="kpi-sub">{isAr ? 'إجمالي المادة الفعالة باليوم' : 'Total Daily Dose'}</span>
              <span className="kpi-val">{totalMgPerDay} <small>{isAr ? 'مجم/يوم' : 'mg/day'}</small></span>
              <span className="kpi-sub">{singleDoseMg} {isAr ? 'مجم في كل جرعة' : 'mg per dose'}</span>
            </div>

            <div className="kpi-block">
              <span className="kpi-sub">{isAr ? 'تركيز الزجاجة' : 'Bottle Strength'}</span>
              <span className="kpi-val">{selectedMed.concentrationMgPer5ml} <small>{isAr ? 'مجم / 5 مل' : 'mg / 5ml'}</small></span>
              <span className="kpi-sub">{pick(selectedMed.genericName, lang)}</span>
            </div>
          </div>

          <div className="nursing-tip-banner" style={{ marginTop: '14px' }}>
            <b>💡 {isAr ? 'نصيحة صيدلانية وتمريضية هامة:' : 'Important Pediatric Dosing Tip:'}</b>{' '}
            {pick(selectedMed.specialNursingTip, lang)}
          </div>
        </div>
      </section>

      {/* SECTION 2: Storage & Shelf-Life Tracker */}
      <section className="card stack">
        <h2>🧊 {isAr ? '3. متتبع صلاحية الزجاجة بعد الفتح أو الحل:' : '3. Opened Bottle Shelf-Life & Storage Tracker:'}</h2>
        <div className="calc-inputs-row">
          <div className="field-group">
            <label><b>{isAr ? 'تاريخ فتح الزجاجة أو حلها بالماء:' : 'Date Bottle Opened / Reconstituted:'}</b></label>
            <input
              type="date"
              value={reconstitutedDate}
              onChange={(e) => setReconstitutedDate(e.target.value)}
            />
          </div>
          <div className="subcard" style={{ flex: 1 }}>
            <div>
              <b>{isAr ? 'حالة صلاحية الزجاجة الحالية:' : 'Current Bottle Status:'}</b>{' '}
              {isExpired ? (
                <span className="badge danger">{isAr ? 'منتهية الصلاحية — تخلص منها فوراً' : 'Expired — Discard Immediately'}</span>
              ) : (
                <span className="badge approved">
                  {isAr ? `صالحة للاستخدام (متبقي ${daysRemaining} يوم)` : `Valid (${daysRemaining} days left)`}
                </span>
              )}
            </div>
            <p className="small muted" style={{ marginTop: '6px', marginBottom: 0 }}>
              {pick(selectedMed.storageNote, lang)}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Step-by-Step Guide */}
      <section className="card stack">
        <h2>📋 {isAr ? '4. القواعد الذهبية لإعطاء شراب الأطفال بأمان:' : '4. Golden Rules for Safe Pediatric Liquid Dosing:'}</h2>
        <div className="grid">
          {RECONSTITUTION_STEPS.map((st) => (
            <div key={st.stepNumber} className="subcard stack">
              <div style={{ fontWeight: 800, fontSize: '1.02rem' }}>
                {st.icon} {st.stepNumber}. {pick(st.title, lang)}
              </div>
              <p className="small" style={{ margin: 0 }}>{pick(st.instruction, lang)}</p>
              <div className="small" style={{ color: '#b45309', fontWeight: 700 }}>
                ⚠️ {pick(st.nursingWarning, lang)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
