import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { pick } from './types';
import {
  TARGETS,
  COMMON_QUICK_CHECKS,
  InteractionRule,
  Severity,
  findInteractionRule,
  INTERACTION_SOURCES,
} from './interactionsData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import { useSyncedHealthProfile } from './allergyData';
import { searchDawayaIndex, useDawayaDrugDatabase } from './dawayaDrugDatabaseService';

export default function Interactions() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { items } = useApproved();
  const meds = items ?? [];
  const { profile } = useSyncedHealthProfile();
  const { indexItems, totalCount } = useDawayaDrugDatabase();

  const [selectedMed, setSelectedMed] = useState('ciprofloxacin');
  const [selectedTarget, setSelectedTarget] = useState('dairy');

  // Multi-Drug Duplicate Ingredient & Safety Analyzer across all 26,562 DAWAYA medicines
  const [multiList, setMultiList] = useState<string[]>(['eg-1', 'eg-2']);
  const [multiSearchQ, setMultiSearchQ] = useState('');

  const multiSuggestions = useMemo(() => {
    if (!multiSearchQ.trim() || multiSearchQ.trim().length < 2) return [];
    return searchDawayaIndex(indexItems, { query: multiSearchQ.trim() }, isAr).slice(0, 6);
  }, [indexItems, multiSearchQ, isAr]);

  const multiSafetyReport = useMemo(
    () =>
      evaluateMedicationSafety({
        medications: multiList,
        healthProfile: profile,
        includeProfileActiveMedications: false,
      }),
    [multiList, profile]
  );

  const matchedRule: InteractionRule | undefined = findInteractionRule(selectedMed, selectedTarget);
  const currentMedObj = meds.find((m) => m.id === selectedMed);
  const currentTargetObj = TARGETS.find((t) => t.id === selectedTarget);

  const applyQuickCheck = (medId: string, targetId: string) => {
    setSelectedMed(medId);
    setSelectedTarget(targetId);
  };

  const severityBadge = (s: Severity) => {
    switch (s) {
      case 'severe':
        return (
          <span className="sev-badge severe">
            🔴 {isAr ? 'مراجعة مهنية عاجلة (Urgent Professional Review)' : 'Urgent Professional Review'}
          </span>
        );
      case 'moderate':
        return (
          <span className="sev-badge moderate">
            🟡 {isAr ? 'مراجعة عالية الأولوية / حذر (High-Priority / Caution)' : 'High-Priority Review / Caution'}
          </span>
        );
      case 'safe':
        return (
          <span className="sev-badge safe">
            🟢 {isAr ? 'معلوماتي / آمن وفق المراجع (Informational)' : 'Informational / Safe per Reference'}
          </span>
        );
    }
  };

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>
          ⚡{' '}
          {isAr
            ? 'فاحص التداخلات الدوائية وتكرار المادة الفعالة — دوايا'
            : 'DAWAYA Drug Interactions & Duplicate Ingredient Checker'}
        </h1>
        <p className="muted">
          {isAr
            ? `افحص التداخلات الدوائية والغذائية وتكرار المواد الفعالة بين أي أدوية في موسوعة دوايا الشاملة (${totalCount.toLocaleString()}+ دواء مصري ومضاد حيوي).`
            : `Screen for drug-drug interactions, food interactions, and duplicate active ingredients across all ${totalCount.toLocaleString()}+ DAWAYA medicines.`}
        </p>
      </header>

      {/* NEW: Multi-Medicine Duplicate Ingredient & Interaction Analyzer (All 26,562+ Medicines) */}
      <section className="card highlight-card stack">
        <h2>
          🧬{' '}
          {isAr
            ? `فاحص تكرار المادة الفعالة والتعارضات بين عدة أدوية (${totalCount.toLocaleString()}+ دواء)`
            : `Multi-Medicine Duplicate Ingredient & Safety Analyzer (${totalCount.toLocaleString()}+ Medicines)`}
        </h2>
        <p className="small muted" style={{ margin: 0 }}>
          {isAr
            ? 'أضف دواءين أو أكثر (بأسمائها التجارية أو العلمية) ليكتشف محرك الأمان الدوائي المركزي أي تكرار في المادة الفعالة أو تداخل دوائي أو تعارض مع حالتك الصحية:'
            : 'Add two or more medicines by brand or generic name to detect duplicate active ingredients, drug interactions, and health profile warnings:'}
        </p>

        <div className="row wrapRow" style={{ gap: '8px' }}>
          <input
            type="search"
            value={multiSearchQ}
            onChange={(e) => setMultiSearchQ(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث عن دواء لإضافته لقائمة الفحص (مثال: ون تو ثري، أوجمنتين، أبيليفاي)...'
                : 'Search a medicine to add to check list (e.g. 1 2 3, Augmentin, Abilify)...'
            }
            style={{ flex: 1, minWidth: '240px' }}
          />
          {multiSearchQ.trim() && (
            <button
              type="button"
              className="btn small"
              onClick={() => {
                setMultiList((prev) => [...prev, multiSearchQ.trim()]);
                setMultiSearchQ('');
              }}
            >
              ➕ {isAr ? 'إضافة للفحص' : 'Add'}
            </button>
          )}
        </div>

        {multiSuggestions.length > 0 && (
          <div className="chips">
            {multiSuggestions.map((s) => (
              <button
                key={s.i}
                type="button"
                className="chip"
                onClick={() => {
                  if (!multiList.includes(s.i)) {
                    setMultiList((prev) => [...prev, s.i]);
                  }
                  setMultiSearchQ('');
                }}
              >
                ➕ {isAr ? s.a : s.n} ({s.g || s.i})
              </button>
            ))}
          </div>
        )}

        {/* Selected Medications Chips */}
        <div className="chips">
          {multiSafetyReport.resolvedMedications.map((rm, idx) => (
            <span
              key={`${rm.inputKey}-${idx}`}
              className="badge"
              style={{
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--tint)',
                color: 'var(--ink)',
              }}
            >
              <span>
                💊 <b>{pick(rm.displayName, lang)}</b> ({rm.componentsDisplayText.join(' + ') || rm.rawInput})
              </span>
              <button
                type="button"
                onClick={() => setMultiList((prev) => prev.filter((_, i) => i !== idx))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#DC2626',
                  cursor: 'pointer',
                  fontWeight: 900,
                }}
                aria-label="Remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Multi-Medicine Safety Engine Findings */}
        {multiSafetyReport.findings.length > 0 ? (
          <div className="stack" style={{ gap: '10px' }}>
            {multiSafetyReport.findings.map((f) => (
              <div
                key={f.id}
                className="card"
                style={{
                  borderInlineStart: `5px solid ${
                    f.severity === 'urgent'
                      ? '#DC2626'
                      : f.severity === 'warning'
                      ? '#D97706'
                      : '#00BFD0'
                  }`,
                }}
              >
                <div className="row wrapRow" style={{ justifyContent: 'space-between' }}>
                  <b>{pick(f.title, lang)}</b>
                  <span className="badge">
                    {f.severity === 'urgent'
                      ? isAr
                        ? 'مراجعة مهنية عاجلة'
                        : 'Urgent Professional Review'
                      : f.severity === 'warning'
                      ? isAr
                        ? 'مراجعة عالية الأولوية'
                        : 'High-Priority Review'
                      : isAr
                      ? 'تنبيه حذر'
                      : 'Caution'}
                  </span>
                </div>
                <p className="small" style={{ margin: '6px 0' }}>{pick(f.reason, lang)}</p>
                <div className="small">
                  <b>{isAr ? 'التوجيه الطبي:' : 'Next Step:'}</b> {pick(f.nextStep, lang)}
                </div>
                <div className="small muted" style={{ marginTop: '4px' }}>
                  <b>{isAr ? 'المصدر:' : 'Source:'}</b> {pick(f.source.title, lang)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="notice">
            {pick(multiSafetyReport.completeness.summaryBanner, lang)}
          </div>
        )}
      </section>

      {/* Quick check chips */}
      <section className="card stack">
        <h2>⚡ {isAr ? 'فحص سريع لأشهر التداخلات الشائعة:' : 'Common Quick Checks:'}</h2>
        <div className="chips">
          {COMMON_QUICK_CHECKS.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`chip ${selectedMed === c.antibioticId && selectedTarget === c.targetId ? 'active-chip' : ''}`}
              onClick={() => applyQuickCheck(c.antibioticId, c.targetId)}
            >
              {pick(c.label, lang)}
            </button>
          ))}
        </div>
      </section>

      {/* Selection card */}
      <section className="card stack">
        <h2>🔍 {isAr ? 'فاحص التداخلات الثنائية مع الأطعمة والمكملات والأدوية:' : 'Pairwise Drug & Food Interaction Checker:'}</h2>
        <div className="check-grid">
          <div className="field-group">
            <label>
              <b>1. {isAr ? 'الدواء الأساسي:' : 'Primary Medication:'}</b>
            </label>
            <select
              className="select-input"
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              aria-label="Select Medication"
            >
              {meds.map((m) => (
                <option key={m.id} value={m.id}>
                  {pick(m.genericName, lang)} ({m.id})
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>
              <b>2. {isAr ? 'الطعام أو الدواء المتفاعل:' : 'Interacting Food or Medication:'}</b>
            </label>
            <select
              className="select-input"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              aria-label="Select Interacting Target"
            >
              <optgroup label={isAr ? 'الأطعمة والمشروبات' : 'Foods & Beverages'}>
                {TARGETS.filter((t) => t.category === 'food').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {pick(t.name, lang)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={isAr ? 'المعادن والمكملات' : 'Minerals & Supplements'}>
                {TARGETS.filter((t) => t.category === 'supplement').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {pick(t.name, lang)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={isAr ? 'الأدوية الشائعة' : 'Common Medications'}>
                {TARGETS.filter((t) => t.category === 'drug').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {pick(t.name, lang)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </section>

      {/* Result Card */}
      {matchedRule ? (
        <section className={`card result-card ${matchedRule.severity}`}>
          <div className="result-header">
            {severityBadge(matchedRule.severity)}
            <h3>{pick(matchedRule.title, lang)}</h3>
          </div>

          <div className="result-body stack">
            <div className="result-section">
              <h4>🔬 {isAr ? 'الآلية والتأثير العلمي:' : 'Mechanism of Interaction:'}</h4>
              <p>{pick(matchedRule.mechanism, lang)}</p>
            </div>

            <div className="result-section">
              <h4>⏱️ {isAr ? 'التصرف الطبي الموصى به وكيفية الفصل:' : 'Clinical Management & Spacing:'}</h4>
              <p>
                <b>{pick(matchedRule.management, lang)}</b>
              </p>
            </div>

            <div className="nursing-box">
              <h4>🩺 {isAr ? 'توجيه وتمريض سريري (Nursing Stewardship Note):' : 'Nursing Clinical Stewardship Note:'}</h4>
              <p>{pick(matchedRule.nursingTip, lang)}</p>
            </div>

            {matchedRule.source && (
              <div className="small muted" style={{ borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                <b>{isAr ? 'المصدر الموثق:' : 'Supporting Source:'}</b>{' '}
                <a href={matchedRule.source.url} target="_blank" rel="noopener noreferrer">
                  {matchedRule.source.title}
                </a>
                {matchedRule.source.updated ? ` · ${isAr ? 'تاريخ التحديث:' : 'Updated:'} ${matchedRule.source.updated}` : ''}
              </div>
            )}

            <div className="med-link-row row wrapRow" style={{ gap: '8px' }}>
              {currentMedObj && (
                <Link to={`/medicine/${currentMedObj.id}`} className="btn-secondary">
                  📖 {isAr ? `فتح صفحة دواء ${pick(currentMedObj.genericName, lang)}` : `View ${pick(currentMedObj.genericName, lang)} details`}
                </Link>
              )}
              <Link to="/prescription-radar" className="btn ghost">
                📡 {isAr ? 'فحص الروشتة الكاملة في الرادار' : 'Check Full Prescription in Radar'}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="card result-card moderate">
          <div className="result-header">
            <span className="sev-badge moderate">
              ℹ️ {isAr ? 'لا يوجد تداخل مباشر مسجل في قاعدة البيانات لهذه الثنائية' : 'No Direct Interaction Rule Recorded for This Pair'}
            </span>
            <h3>
              {isAr
                ? `لم يُرصد تعارض مباشر موثق في السجل الحالي بين ${currentMedObj ? pick(currentMedObj.genericName, lang) : ''} و ${currentTargetObj ? pick(currentTargetObj.name, lang) : ''}`
                : `No direct interaction rule recorded in the current dataset between ${currentMedObj ? pick(currentMedObj.genericName, lang) : ''} and ${currentTargetObj ? pick(currentTargetObj.name, lang) : ''}`}
            </h3>
          </div>
          <div className="result-body stack">
            <p>
              {isAr
                ? 'تنبيه شفافية: عدم وجود تداخل مسجل في هذه الأداة لا يعني ضمان الأمان التام في جميع الحالات المرضية. راجع دائماً النشرة السريرية للدواء واستشر الطبيب أو الصيدلي.'
                : 'Transparency Note: Absence of a recorded rule in this dataset does not guarantee complete safety for every patient context. Always consult your doctor or pharmacist.'}
            </p>
            <div className="small muted">
              <b>{isAr ? 'المرجع:' : 'Reference:'}</b>{' '}
              <a href={INTERACTION_SOURCES.medlineplus_fda.url} target="_blank" rel="noopener noreferrer">
                {INTERACTION_SOURCES.medlineplus_fda.title}
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
