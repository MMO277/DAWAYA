import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { pick } from './types';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import {
  useSyncedHealthProfile,
  checkDrugAllergySafety,
  DRUG_ALLERGEN_MAP,
  AllergyRecord,
  DrugProfileCheckResult,
} from './allergyData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import { searchDawayaIndex, useDawayaDrugDatabase } from './dawayaDrugDatabaseService';

export default function AllergyChecker() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [sp] = useSearchParams();
  const { items } = useApproved();
  const meds = items ?? [];
  const { indexItems, totalCount } = useDawayaDrugDatabase();

  const { profile } = useSyncedHealthProfile();
  const [selectedDrugId, setSelectedDrugId] = useState('amoxicillin-clavulanic-acid');
  const [customDrugQuery, setCustomDrugQuery] = useState(() => sp.get('q') || '');
  const [simulatedAllergy, setSimulatedAllergy] = useState<string | null>(null);

  useEffect(() => {
    const qParam = sp.get('q');
    if (qParam) setCustomDrugQuery(qParam);
  }, [sp]);

  const activeAllergies = useMemo<AllergyRecord[]>(() => {
    if (simulatedAllergy === 'penicillin') {
      return [
        {
          id: 'sim-pen',
          drugName: 'بنسلين / أموكسيسيلين',
          allergenKey: 'penicillin',
          reportedSymptoms: 'طفح جلدي شديد وتورم في الشفتين',
          severity: 'severe',
          evidenceStatus: 'patient_reported',
          createdAt: '2026-10-14T00:00:00.000Z',
        },
      ];
    }
    if (simulatedAllergy === 'sulfa') {
      return [
        {
          id: 'sim-sulfa',
          drugName: 'مركبات السلفا (سبتازول)',
          allergenKey: 'sulfa',
          reportedSymptoms: 'حساسية جلدية شديدة وضيق تنفس',
          severity: 'life_threatening',
          evidenceStatus: 'clinically_verified',
          createdAt: '2026-10-14T00:00:00.000Z',
        },
      ];
    }
    return profile.allergies;
  }, [simulatedAllergy, profile.allergies]);

  const effectiveInput = customDrugQuery.trim() || selectedDrugId;

  const dawayaQuickSuggestions = useMemo(() => {
    if (!customDrugQuery.trim() || customDrugQuery.trim().length < 2) return [];
    return searchDawayaIndex(indexItems, { query: customDrugQuery.trim() }, isAr).slice(0, 8);
  }, [indexItems, customDrugQuery, isAr]);

  const result: DrugProfileCheckResult = useMemo(
    () => checkDrugAllergySafety(effectiveInput, activeAllergies),
    [effectiveInput, activeAllergies]
  );

  const safetyAssessment = useMemo(
    () =>
      evaluateMedicationSafety({
        medications: [effectiveInput],
        healthProfile: {
          ...profile,
          allergies: activeAllergies,
        },
        includeProfileActiveMedications: true,
      }),
    [effectiveInput, profile, activeAllergies]
  );

  const primaryResolved = safetyAssessment.resolvedMedications[0];
  const resolvedMedId = result.resolvedDrugId || primaryResolved?.activeIngredientId || selectedDrugId;
  const currentMedObj = meds.find((m) => m.id === resolvedMedId);

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>🛡️ {isAr ? 'فاحص الحساسية والأمان الدوائي المركزي — دوايا' : 'DAWAYA Smart Allergy & Medication Safety Checker'}</h1>
        <p className="muted">
          {isAr
            ? `نظام أمان سريري يفحص المادة الفعالة لأي دواء من موسوعة دوايا (${totalCount.toLocaleString()}+ دواء مصري ومضاد حيوي) ويقارنها مع سجل حساسيتك الدوائية، أدويتك الحالية (لمنع تكرار المادة الفعالة)، وحالاتك الصحية المزمنة.`
            : `Clinical safety system matching active ingredients across all ${totalCount.toLocaleString()}+ DAWAYA medicines against your documented allergies, active medications, and chronic conditions.`}
        </p>
      </header>

      {/* Patient Profile Context Header */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>👤 {isAr ? 'سجل الحساسية النشط للفحص:' : 'Active Patient Allergy Record:'}</h2>
            <p className="small muted">
              {activeAllergies.length > 0
                ? isAr
                  ? `يوجد ${activeAllergies.length} أدوية مسجلة تسبب حساسية: ${activeAllergies.map((a) => a.drugName).join(' ، ')}`
                  : `${activeAllergies.length} documented allergies: ${activeAllergies.map((a) => a.drugName).join(', ')}`
                : isAr
                  ? 'لم تسجل أي حساسية دوائية في ملفك الشخصي حتى الآن.'
                  : 'No documented drug allergies in your profile yet.'}
            </p>
          </div>
          <Link to="/health-profile" className="btn-secondary">
            📋 {isAr ? 'فتح ملف صحتي وتعديل الحساسية' : 'Open My Health Profile'}
          </Link>
        </div>

        {/* Quick Simulation Chips */}
        <div className="sim-chips-bar">
          <small className="muted">
            <b>{isAr ? 'أو جرب سيناريو سريري سريع:' : 'Or Try a Clinical Scenario:'}</b>
          </small>
          <div className="chips">
            <button
              type="button"
              className={`chip ${simulatedAllergy === 'penicillin' ? 'active-chip' : ''}`}
              onClick={() => setSimulatedAllergy('penicillin')}
            >
              🧪 {isAr ? 'سيناريو: مريض لديه حساسية بنسلين' : 'Scenario: Penicillin Allergic Patient'}
            </button>
            <button
              type="button"
              className={`chip ${simulatedAllergy === 'sulfa' ? 'active-chip' : ''}`}
              onClick={() => setSimulatedAllergy('sulfa')}
            >
              🧪 {isAr ? 'سيناريو: مريض لديه حساسية مركبات السلفا' : 'Scenario: Sulfa Allergic Patient'}
            </button>
            {simulatedAllergy && (
              <button
                type="button"
                className="chip"
                onClick={() => setSimulatedAllergy(null)}
              >
                ↩ {isAr ? 'الرجوع لسجلي الحقيقي' : 'Reset to My Profile'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Drug Selection Input (Active Ingredient OR Brand/Free-Text across 26,562+ medicines) */}
      <section className="card stack">
        <h2>
          💊{' '}
          {isAr
            ? `اختر مادة فعالة أو ابحث في ${totalCount.toLocaleString()}+ دواء مصري بالاسم التجاري:`
            : `Select Active Ingredient or Search ${totalCount.toLocaleString()}+ Egyptian Medicines:`}
        </h2>
        <div className="check-grid">
          <div className="field-group">
            <label>
              <b>1. {isAr ? 'اختر من المواد الفعالة المرجعية السريعة:' : '1. Select Reference Active Ingredient:'}</b>
            </label>
            <select
              className="select-input"
              value={selectedDrugId}
              onChange={(e) => {
                setSelectedDrugId(e.target.value);
                setCustomDrugQuery('');
              }}
              aria-label="Select Antibiotic to Test"
            >
              {Object.entries(DRUG_ALLERGEN_MAP).map(([id, info]) => (
                <option key={id} value={id}>
                  {isAr ? info.nameAr : info.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>
              <b>
                2.{' '}
                {isAr
                  ? `أو ابحث في موسوعة دوايا الشاملة (${totalCount.toLocaleString()}+ دواء بالاسم أو الباركود):`
                  : `2. Or Search All ${totalCount.toLocaleString()}+ DAWAYA Medicines (Brand / Generic / Barcode):`}
              </b>
            </label>
            <div className="row" style={{ gap: '8px' }}>
              <input
                list="allergy-brand-suggestions"
                value={customDrugQuery}
                onChange={(e) => setCustomDrugQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب اسم أي دواء (مثل: ون تو ثري، هاي بيوتك، أبيليفاي، دانسيترون)...'
                    : 'Type any medicine name (e.g. 1 2 3, Hibiotic, Abilify, Dansetron)...'
                }
              />
              {customDrugQuery && (
                <button
                  type="button"
                  className="btn-secondary small"
                  onClick={() => setCustomDrugQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
            <datalist id="allergy-brand-suggestions">
              {EGYPTIAN_COMMERCIAL_PRODUCTS.map((p) => (
                <option
                  key={p.productId}
                  value={isAr ? p.tradeNameAr : p.tradeNameEn}
                />
              ))}
            </datalist>

            {dawayaQuickSuggestions.length > 0 && (
              <div className="chips" style={{ marginTop: '8px' }}>
                {dawayaQuickSuggestions.map((item) => (
                  <button
                    key={item.i}
                    type="button"
                    className="chip"
                    onClick={() => setCustomDrugQuery(item.i)}
                  >
                    💊 {isAr ? item.a : item.n} ({item.g || item.i})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resolved Identity & Active Components Strip */}
        {primaryResolved && (
          <div className="notice compact" style={{ marginTop: '4px' }}>
            {primaryResolved.resolutionStatus === 'resolved_exact_product' ||
            primaryResolved.resolutionStatus === 'resolved_ingredient_only' ? (
              <div>
                <strong>
                  🧬 {isAr ? 'تحليل الهوية الدوائية والمواد الفعالة:' : 'Resolved Medication Identity & Components:'}{' '}
                </strong>
                <span>
                  {pick(primaryResolved.displayName, lang)} —{' '}
                  <b>{isAr ? 'المكونات الكيميائية الفعالة:' : 'Active Components:'}</b>{' '}
                  {primaryResolved.componentsDisplay.map((c) => pick(c, lang)).join(' + ')}
                  {primaryResolved.isCombination
                    ? isAr
                      ? ' (مستحضر مركب من أكثر من مادة فعالة)'
                      : ' (Multi-ingredient combination product)'
                    : ''}
                </span>
              </div>
            ) : (
              <div>
                <strong>
                  ⚠️ {isAr ? 'حالة التحقق من الهوية الدوائية:' : 'Medication Identity Status:'}{' '}
                </strong>
                <span>
                  {pick(primaryResolved.uncertaintyReasons[0], lang) ||
                    (isAr
                      ? 'تعذر التحقق من المادة الفعالة لهذا الاسم في قاعدة البيانات؛ لا يفترض النظام الأمان تلقائياً.'
                      : 'Could not resolve active ingredient in the verified database; safety is never assumed.')}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Safety Evaluation Result Card */}
      <section
        className={`card result-card ${
          result.matchLevel === 'exact_match' || safetyAssessment.overallStatus === 'urgent_review'
            ? 'severe'
            : result.matchLevel === 'cross_reactivity' ||
                result.matchLevel === 'unverified' ||
                safetyAssessment.overallStatus === 'warning_review'
              ? 'moderate'
              : 'safe'
        }`}
      >
        <div className="result-header">
          {result.matchLevel === 'exact_match' && (
            <span className="sev-badge severe">
              🚨 {isAr ? 'مراجعة مهنية عاجلة! تطابق في مادة الحساسية' : 'Urgent Professional Review: Direct Allergy Match'}
            </span>
          )}
          {result.matchLevel === 'cross_reactivity' && (
            <span className="sev-badge moderate">
              🟠 {isAr ? 'مراجعة عالية الأولوية: احتمالية حساسية متصالبة' : 'High-Priority Review: Cross-Reactivity Risk'}
            </span>
          )}
          {result.matchLevel === 'no_match' && (
            <span className="sev-badge safe">
              🟢 {isAr ? 'معلوماتي: لم يُعثر على تطابق مع الحساسيات المسجلة' : 'Informational: No Match with Documented Allergies'}
            </span>
          )}
          {result.matchLevel === 'unverified' && (
            <span className="sev-badge moderate">
              🟡 {isAr ? 'تنبيه حذر — فحص في محرك دوايا الشامل أدناه' : 'Caution — See Central Safety Engine Findings Below'}
            </span>
          )}

          <h3>{pick(result.title, lang)}</h3>
        </div>

        <div className="result-body stack">
          <div className="result-section">
            <h4>🔬 {isAr ? 'التحليل السريري للمطابقة:' : 'Clinical Matching Analysis:'}</h4>
            <p>{pick(result.explanation, lang)}</p>
          </div>

          <div className="result-section action-highlight">
            <h4>⚡ {isAr ? 'التصرف الطبي الموصى به:' : 'Recommended Clinical Action:'}</h4>
            <p>
              <b>{pick(result.clinicalAction, lang)}</b>
            </p>
          </div>

          {/* Consolidated Engine Alerts (Allergies, Duplicate Ingredients, Contraindications, Interactions) */}
          {safetyAssessment.findings.length > 0 && (
            <div className="notice" style={{ marginTop: '8px' }}>
              <h4 style={{ margin: '0 0 8px' }}>
                🛡️{' '}
                {isAr
                  ? 'نتائج محرك الأمان الدوائي المركزي (الحساسية، تكرار المادة الفعالة، والحالات المرضية):'
                  : 'Central Medication Safety Engine Findings (Allergies, Duplicate Ingredients & Profile Warnings):'}
              </h4>
              <div className="stack" style={{ gap: '8px' }}>
                {safetyAssessment.findings.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <strong>{pick(f.title, lang)}</strong>
                    <p className="small" style={{ margin: '4px 0' }}>
                      {pick(f.reason, lang)}
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      <b>{isAr ? 'الخطوة التالية:' : 'Next Step:'}</b> {pick(f.nextStep, lang)}
                    </p>
                    <small className="muted">
                      {isAr ? 'المصدر:' : 'Source:'} {pick(f.source.title, lang)}
                      {f.source.updatedDate ? ` (${f.source.updatedDate})` : ''}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="med-link-row row wrapRow" style={{ gap: '8px' }}>
            {primaryResolved?.activeIngredientId && (
              <Link to={`/medicine/${primaryResolved.activeIngredientId}`} className="btn-secondary">
                📖{' '}
                {isAr
                  ? `فتح صفحة دواء ${pick(primaryResolved.displayName, lang)} الكاملة`
                  : `View ${pick(primaryResolved.displayName, lang)} Detail Page`}
              </Link>
            )}
            <Link to="/prescription-radar" className="btn ghost">
              📡 {isAr ? 'فحص الروشتة الكاملة في الرادار' : 'Check Full Prescription in Radar'}
            </Link>
          </div>
        </div>
      </section>

      <section className="notice alert">
        <strong>⚠️ {isAr ? 'إخلاء مسؤولية سريري:' : 'Clinical Disclaimer:'} </strong>
        {pick(safetyAssessment.safetyDisclaimer, lang)}
      </section>
    </main>
  );
}
