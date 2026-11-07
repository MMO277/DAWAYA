import { pick, tr } from './types';
import { useEmergencyLocation, formatEmergencyText, pickCountryName } from './emergencyLocation';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { SYMPTOMS_LIST, EMERGENCY_WARNINGS, SymptomDetail, SymptomSeverity } from './sideEffectsData';
import {
  DawayaMedicineRecord,
  fetchFullDawayaMedicineById,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';

export default function SideEffectsGuide() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { emergency, countryName, selectedOverride, setCountryOverride, countriesList } = useEmergencyLocation();
  const { indexItems } = useDawayaDrugDatabase();

  const [selectedSymptomId, setSelectedSymptomId] = useState<string>('anaphylaxis_breathing');
  const [drugQuery, setDrugQuery] = useState('');
  const [inspectedMed, setInspectedMed] = useState<DawayaMedicineRecord | null>(null);

  const matchingMeds = useMemo(() => {
    if (!drugQuery.trim()) return [];
    return searchDawayaIndex(indexItems, { query: drugQuery }, isAr).slice(0, 8);
  }, [drugQuery, indexItems, isAr]);

  const selectedSymptom: SymptomDetail | undefined = SYMPTOMS_LIST.find((s) => s.id === selectedSymptomId);

  const renderBadge = (sev: SymptomSeverity) => {
    switch (sev) {
      case 'emergency':
        return <span className="sev-badge severe">🚨 {isAr ? 'طوارئ فورية (إسعاف)' : 'Immediate Emergency (ER)'}</span>;
      case 'prompt':
        return <span className="sev-badge moderate">⚠️ {isAr ? 'استشارة طبية عاجلة خلال ساعات' : 'Prompt Medical Attention'}</span>;
      case 'mild':
        return <span className="sev-badge safe">🟢 {isAr ? 'عرض خفيف — رعاية منزلية' : 'Common / Mild — Home Care'}</span>;
    }
  };

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>
          🚨{' '}
          {isAr
            ? 'دليل الآثار الجانبية والتحذيرات والطوارئ لجميع الأدوية (26,562+ دواء)'
            : 'Medication Side Effects, Warnings & Emergency Guide (26,562+ Drugs)'}
        </h1>
        <p className="muted">
          {isAr
            ? 'ابحث عن أي دواء في السوق المصري للاطلاع على تحذيراته السريرية الـ 7 وموانع استعماله، وتعرّف على كيفية التصرف السليم مع الأعراض الجانبية الخفيفة أو الطارئة.'
            : 'Search any of the 26,562 Egyptian medications to inspect its 7 clinical condition warnings and contraindications, and learn how to respond to mild or emergency side effects.'}
        </p>
      </header>

      {/* Immediate Emergency Action Box */}
      <section className="alert urgent emergency-top-box" role="alert">
        <div className="emerg-header">
          <span className="emerg-icon">🚨</span>
          <div>
            <h2>{isAr ? 'علامات الطوارئ الخطيرة لأي دواء (طلب الإسعاف فوراً):' : 'Emergency Drug Reaction Warning Signs (Seek Help Immediately):'}</h2>
            <p className="emerg-text">{formatEmergencyText(pick(EMERGENCY_WARNINGS, lang), emergency, lang)}</p>
          </div>
        </div>
        <div className="emerg-action-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <a
            href={`tel:${emergency.number}`}
            className="emerg-call"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            📞{' '}
            <b>
              {tr(
                lang,
                `رقم الطوارئ في ${countryName} (${emergency.flag}): ${emergency.number}`,
                `Emergency Number in ${countryName} (${emergency.flag}): ${emergency.number}`,
                `Numéro d’urgence — ${countryName} (${emergency.flag}) : ${emergency.number}`,
                `Número de emergencia — ${countryName} (${emergency.flag}): ${emergency.number}`
              )}
            </b>
          </a>
          <select
            value={selectedOverride}
            onChange={(e) => setCountryOverride(e.target.value)}
            aria-label={tr(lang, 'تغيير الدولة لرقم الطوارئ', 'Change emergency country', 'Changer le pays d’urgence', 'Cambiar país de emergencia')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              background: 'rgba(255, 255, 255, 0.92)',
              color: '#7f1d1d',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="AUTO">
              📍 {tr(lang, `تحديد تلقائي (${countryName}: ${emergency.number})`, `Auto-detect (${countryName}: ${emergency.number})`, `Auto-détection (${countryName} : ${emergency.number})`, `Detección automática (${countryName}: ${emergency.number})`)}
            </option>
            {countriesList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {pickCountryName(c, lang)} — {c.number}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* NEW: 26,562-Medicine Side Effects & 7-Warning Inspector */}
      <section className="card stack highlight-card">
        <h2>💊 {isAr ? 'افحص الآثار الجانبية والتحذيرات السريرية لأي دواء (26,562+ دواء):' : 'Inspect Side Effects & Clinical Warnings for Any Medicine (26,562+ DB):'}</h2>
        <input
          type="search"
          value={drugQuery}
          onChange={(e) => setDrugQuery(e.target.value)}
          placeholder={isAr ? 'اكتب اسم الدواء أو المادة الفعالة (مثال: كونكور، بروفين، بنادول، جلوكوفاج، أوجمنتين)...' : 'Type medicine brand or active ingredient...'}
        />
        {matchingMeds.length > 0 && (
          <div className="row wrapRow" style={{ gap: '8px' }}>
            {matchingMeds.map((it) => (
              <button
                key={it.i}
                type="button"
                className="chip"
                onClick={async () => {
                  const full = await fetchFullDawayaMedicineById(it.i);
                  if (full) setInspectedMed(full);
                  setDrugQuery('');
                }}
              >
                {isAr ? it.a || it.n : it.n} ({it.s})
              </button>
            ))}
          </div>
        )}

        {inspectedMed && (
          <div className="subcard stack" style={{ borderInlineStart: '4px solid #00BFD0' }}>
            <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{inspectedMed.brandNameAr} ({inspectedMed.brandNameEn})</h3>
                <div className="small muted">{inspectedMed.genericName} · {inspectedMed.pharmaceuticalCategory}</div>
              </div>
              <Link to={`/medicine/${inspectedMed.id}`} className="btn small">
                📖 {isAr ? 'صفحة الدواء الكاملة' : 'Full Drug Profile'}
              </Link>
            </div>

            <div className="row wrapRow" style={{ gap: '6px' }}>
              {inspectedMed.warningsFlags.pregnancy && <span className="badge danger">🤰 {isAr ? 'تحذير الحمل' : 'Pregnancy Warning'}</span>}
              {inspectedMed.warningsFlags.lactation && <span className="badge warn">🍼 {isAr ? 'تحذير الرضاعة' : 'Lactation Warning'}</span>}
              {inspectedMed.warningsFlags.kidney && <span className="badge danger">🫘 {isAr ? 'تحذير الكلى' : 'Kidney Warning'}</span>}
              {inspectedMed.warningsFlags.liver && <span className="badge danger">🫀 {isAr ? 'تحذير الكبد' : 'Liver Warning'}</span>}
              {inspectedMed.warningsFlags.heart && <span className="badge danger">❤️ {isAr ? 'تحذير القلب' : 'Heart Warning'}</span>}
              {inspectedMed.warningsFlags.highBloodPressure && <span className="badge warn">🩸 {isAr ? 'تحذير الضغط' : 'Blood Pressure Warning'}</span>}
              {inspectedMed.warningsFlags.diabetes && <span className="badge warn">🍬 {isAr ? 'تحذير السكري' : 'Diabetes Warning'}</span>}
            </div>

            <div>
              <b>⚠️ {isAr ? 'التحذيرات والآثار الجانبية:' : 'Warnings & Side Effects:'}</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {isAr ? inspectedMed.warningsSummaryAr : inspectedMed.warningsSummaryEn}
              </p>
            </div>
            <div>
              <b>🚫 {isAr ? 'موانع الاستعمال:' : 'Contraindications:'}</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {isAr ? inspectedMed.contraindicationsAr : inspectedMed.contraindicationsEn}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* The 3 Core Categories Overview */}
      <section className="card stack">
        <h2>📑 {isAr ? 'فئات الأعراض الجانبية الثلاث وكيفية التصرف:' : 'The 3 Side Effect Categories & What To Do:'}</h2>
        <div className="categories-grid">
          <div className="cat-card mild-card">
            <div className="cat-header">
              <span className="cat-pill safe">🟢 {isAr ? 'الفئة 1: شائعة وخفيفة عادة' : 'Category 1: Common / Mild'}</span>
            </div>
            <h3>{isAr ? 'أعراض هضمية أو صداع خفيف' : 'Mild Digestive or Headache Symptoms'}</h3>
            <p className="small">
              {isAr
                ? 'مثل: الغثيان الخفيف، اضطراب المعدة البسيط، أو الدوخة الخفيفة عند بدء الدواء. تقل غالباً بتناول الدواء بعد الطعام وشرب الماء.'
                : 'e.g. Mild nausea, slight stomach upset, or mild drowsiness. Usually managed with food and hydration.'}
            </p>
          </div>

          <div className="cat-card prompt-card">
            <div className="cat-header">
              <span className="cat-pill moderate">🟡 {isAr ? 'الفئة 2: تستدعي استشارة الطبيب' : 'Category 2: Prompt Medical Advice'}</span>
            </div>
            <h3>{isAr ? 'أعراض تتطلب تقييم وتعديل الدواء' : 'Symptoms Needing Prompt Assessment'}</h3>
            <p className="small">
              {isAr
                ? 'مثل: هبوط أو ارتفاع حاد بالضغط أو السكر، طفح جلدي غير فقاعي، إسهال شديد مستمر، أو اصفرار العينين.'
                : 'e.g. Marked blood pressure/glucose drop, persistent diarrhea, jaundice, or spreading skin rash.'}
            </p>
          </div>

          <div className="cat-card severe-card">
            <div className="cat-header">
              <span className="cat-pill severe">🔴 {isAr ? 'الفئة 3: علامات طوارئ فورية' : 'Category 3: Emergency Signs'}</span>
            </div>
            <h3>{isAr ? 'صدمة تحسسية أو ضيق تنفس أو نزيف' : 'Severe Anaphylaxis, Airway or Bleeding'}</h3>
            <p className="small">
              {isAr
                ? 'مثل: تورم اللسان والحلق، اختناق وصفير الصدر، إغماء، أو نزيف حاد. توجه لأقرب طوارئ فوراً.'
                : 'e.g. Swollen throat/tongue, wheezing, severe breathing distress, collapse, or severe bleeding.'}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Symptom Explorer */}
      <section className="card stack">
        <h2>🔍 {isAr ? 'المستكشف التفاعلي للأعراض الجانبية والتصرف السريري:' : 'Interactive Symptom Response Explorer:'}</h2>
        <div className="row wrapRow" style={{ gap: '8px' }}>
          {SYMPTOMS_LIST.map((sym) => (
            <button
              key={sym.id}
              type="button"
              className={`chip ${selectedSymptomId === sym.id ? 'on' : ''}`}
              onClick={() => setSelectedSymptomId(sym.id)}
            >
              {sym.icon} {pick(sym.name, lang)}
            </button>
          ))}
        </div>

        {selectedSymptom && (
          <div className="subcard stack" style={{ marginTop: '10px' }}>
            <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{selectedSymptom.icon} {pick(selectedSymptom.name, lang)}</h3>
              {renderBadge(selectedSymptom.severity)}
            </div>
            <p>{pick(selectedSymptom.description, lang)}</p>
            <div className="notice">
              <b>🩺 {isAr ? 'التصرف الطبي الموصى به:' : 'Recommended Action:'}</b>{' '}
              {pick(selectedSymptom.whatToDo, lang)}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
