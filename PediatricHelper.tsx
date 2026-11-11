import { SmartNativeSelect } from './SmartChoiceSelect';
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


function VisualDosingSyringe({ doseMl, isAr }: { doseMl: number; isAr: boolean }) {
  // Syringe scale: 0 to 10 ml
  const maxScale = 10;
  const pct = Math.min(100, Math.max(0, (doseMl / maxScale) * 100));

  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(13, 31, 56, 0.05) 0%, rgba(19, 136, 102, 0.08) 100%)',
        border: '1.5px solid rgba(19, 136, 102, 0.25)',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <b style={{ fontSize: '0.9rem', color: '#0D1F38', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💉 {isAr ? 'معيار السرنجة الفموية بالملليلتر (سنتي):' : 'Oral Syringe Volume Level (mL):'}
        </b>
        <span
          className="badge"
          style={{ background: '#138866', color: '#fff', fontWeight: 800, fontSize: '0.86rem' }}
        >
          {doseMl.toFixed(1)} {isAr ? 'مل (سم³)' : 'mL'}
        </span>
      </div>

      {/* Graphical Syringe Barrel */}
      <div
        style={{
          position: 'relative',
          height: '32px',
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '2px solid #0D1F38',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* Liquid Fill */}
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #138866 0%, #22c55e 100%)',
            transition: 'width 0.3s ease',
            borderRadius: '4px',
          }}
        />

        {/* Ticks 0 to 10 ml */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'space-between',
            paddingInline: '4px',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'space-between',
                paddingBlock: '2px',
              }}
            >
              <span style={{ width: '1.5px', height: t % 5 === 0 ? '12px' : '6px', background: '#0D1F38', opacity: 0.7 }} />
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0D1F38' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="small muted" style={{ marginTop: '6px', textAlign: isAr ? 'right' : 'left' }}>
        {isAr
          ? '💡 اسحبي الدواء بالسرنجة الفموية حتى علامة الرقم الموضحة بالأعلى بدقة (1 مل = 1 سم³).'
          : '💡 Draw medication in an oral dosing syringe exactly to the indicated mark above (1 mL = 1 cc).'}
      </div>
    </div>
  );
}

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
          <SmartNativeSelect
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
          </SmartNativeSelect>
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

          <VisualDosingSyringe doseMl={singleDoseMl} isAr={isAr} />

          {/* 1-Tap WhatsApp Mother Dose Button */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                isAr
                  ? `🍼 جرعة ${pick(selectedMed.tradeName, lang)} للطفل (وزن ${weightInput} كجم):\n• الجرعة بالسيرنجة: ${singleDoseMl} مل (سنتي) كل ${selectedMed.frequencyHours} ساعات عند اللزوم.\n• التركيز: ${selectedMed.concentrationMgPer5ml} مجم/5مل (${pick(selectedMed.genericName, lang)}).\n• نصيحة: ${pick(selectedMed.specialNursingTip, lang)}\n🔗 منصة دوايا: https://mmo277.github.io/DAWAYA/#/pediatric-helper`
                  : `🍼 Dose for ${pick(selectedMed.tradeName, lang)} (Weight: ${weightInput} kg):\n• Syringe Dose: ${singleDoseMl} mL every ${selectedMed.frequencyHours}h as needed.\n• Strength: ${selectedMed.concentrationMgPer5ml} mg/5mL.\n• Tip: ${pick(selectedMed.specialNursingTip, lang)}\n🔗 DAWAYA: https://mmo277.github.io/DAWAYA/#/pediatric-helper`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: '#138866', color: '#fff', fontWeight: 800, flex: '1 1 220px', textAlign: 'center' }}
            >
              📲 {isAr ? 'إرسال الجرعة للأم على واتساب' : 'Send Dose to Mother on WhatsApp'}
            </a>
          </div>

          <div className="nursing-tip-banner" style={{ marginTop: '14px' }}>
            <b>💡 {isAr ? 'نصيحة صيدلانية وتمريضية هامة:' : 'Important Pediatric Dosing Tip:'}</b>{' '}
            {pick(selectedMed.specialNursingTip, lang)}
          </div>
        </div>
      </section>


      {/* Egyptian Antipyretic Safety Guide Card */}
      <section className="card stack" style={{ borderInlineStart: '4px solid #138866' }}>
        <h2>🛡️ {isAr ? 'دليل الأمان الطبي لخوافض الحرارة للأطفال في مصر:' : 'Egyptian Pediatric Antipyretic Safety Matrix:'}</h2>
        <div className="grid">
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
            <strong style={{ color: '#15803d', display: 'block', marginBottom: '4px' }}>
              🟢 {isAr ? 'باراسيتامول (سيتال / بيرال / بارامول)' : 'Paracetamol (Cetal / Pyral)'}
            </strong>
            <p className="small" style={{ margin: 0 }}>
              {isAr
                ? '✅ مسموح من عمر يوم (حديثي الولادة) بأمان تام. الجرعة: 10–15 مجم/كجم كل 4–6 ساعات عند اللزوم (بحد أقصى 4 مرات يومياً).'
                : '✅ Safe from day 1 (neonates). Dose: 10-15 mg/kg every 4-6h as needed (max 4 times/day).'}
            </p>
          </div>

          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
            <strong style={{ color: '#b45309', display: 'block', marginBottom: '4px' }}>
              🟡 {isAr ? 'إيبوبروفين (بروفين / بروف)' : 'Ibuprofen (Brufen / Prof)'}
            </strong>
            <p className="small" style={{ margin: 0 }}>
              {isAr
                ? '⚠️ ممنوع تماماً قبل عمر 6 أشهر. مسموح بعد 6 أشهر والوزن فوق 5 كجم. يُفضل بعد الرضاعة أو الأكل لحماية المعدة وتجنب استخدامه مع الجفاف.'
                : '⚠️ Strictly prohibited under 6 months. Safe after 6 months (weight > 5kg) with food/milk. Avoid in dehydration.'}
            </p>
          </div>

          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
            <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '4px' }}>
              🔴 {isAr ? 'ديكلوفيناك (دولفين / كتافلاي)' : 'Diclofenac (Dolphin / Catafly)'}
            </strong>
            <p className="small" style={{ margin: 0 }}>
              {isAr
                ? '⛔ ممنوع قبل عمر سنة كاملة (12 شهراً) ويُعطى بدقة تحت إشراف الطبيب لأقصر مدة ممكنة عند الحرارة الشديدة فقط.'
                : '⛔ Strictly prohibited under 1 year of age. Use strictly under pediatrician supervision for high persistent fevers.'}
            </p>
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
