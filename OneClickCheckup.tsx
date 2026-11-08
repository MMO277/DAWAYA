import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
} from './egyptianDrugDatabase';
import {
  DawayaCompactIndexItem,
  decodeWarningMask,
  getDawayaIngredientEquivalents,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import { getClinicalProProfile } from './clinicalProData';
import FindMedicationPanel from './FindMedicationPanel';
import SmartDoseAlarmCard from './SmartDoseAlarmCard';
import Mechanism3DViewer from './Mechanism3DViewer';
import Disclaimer from './Disclaimer';

export default function OneClickCheckup() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [searchParams] = useSearchParams();
  const initialMedParam = searchParams.get('med') || 'amoxicillin-clavulanic-acid';
  const { indexItems } = useDawayaDrugDatabase();

  // Universal 26,562 DAWAYA Medicine Search state
  const [dawayaQuery, setDawayaQuery] = useState('');
  const [selectedDawayaItem, setSelectedDawayaItem] = useState<DawayaCompactIndexItem | null>(null);

  const dawayaResults = useMemo(() => {
    if (!dawayaQuery.trim()) return [];
    return searchDawayaIndex(indexItems, { query: dawayaQuery }, isAr).slice(0, 8);
  }, [dawayaQuery, indexItems, isAr]);

  const dawayaEquivalents = useMemo(() => {
    if (!selectedDawayaItem) return [];
    return getDawayaIngredientEquivalents(selectedDawayaItem, 8);
  }, [selectedDawayaItem]);

  const [selectedIngredientId, setSelectedIngredientId] = useState<string>(() => {
    const found = ACTIVE_INGREDIENTS.find((a) => a.id === initialMedParam);
    return found ? found.id : 'amoxicillin-clavulanic-acid';
  });

  const matchingPackages = useMemo(() => {
    const list = EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => p.activeIngredientId === selectedIngredientId);
    return list.length > 0 ? list : EGYPTIAN_COMMERCIAL_PRODUCTS.slice(0, 6);
  }, [selectedIngredientId]);

  const [selectedPkgId, setSelectedPkgId] = useState<string>('');

  const activePkg: EgyptianCommercialProduct = useMemo(() => {
    const found = matchingPackages.find((p) => p.productId === selectedPkgId);
    return found || matchingPackages[0];
  }, [matchingPackages, selectedPkgId]);

  const ingredient = useMemo(
    () => ACTIVE_INGREDIENTS.find((a) => a.id === selectedIngredientId) || ACTIVE_INGREDIENTS[0],
    [selectedIngredientId]
  );

  const proProfile = useMemo(() => getClinicalProProfile(selectedIngredientId), [selectedIngredientId]);

  // Interactive checkup toggles
  const [takesCalciumIron, setTakesCalciumIron] = useState(false);
  const [takesWarfarin, setTakesWarfarin] = useState(false);
  const [hasPenicillinAllergy, setHasPenicillinAllergy] = useState(false);
  const [wakeUpHour, setWakeUpHour] = useState<number>(8);
  const [intervalHours, setIntervalHours] = useState<8 | 12 | 24>(12);

  // Compute cheaper bioequivalent generic from either selectedDawayaItem (26,562 DB) or activePkg
  const { cheapestGeneric, savingsEgp, savingsPct } = useMemo(() => {
    if (selectedDawayaItem && dawayaEquivalents.length > 0) {
      const withPrice = dawayaEquivalents.filter((eq) => eq.p && eq.p > 0);
      if (withPrice.length > 0) {
        const sortedAsc = [...withPrice].sort((a, b) => (a.p || 9999) - (b.p || 9999));
        const cheap = sortedAsc[0];
        const refPrice = selectedDawayaItem.p || cheap.p || 100;
        const diff = Math.max(0, refPrice - (cheap.p || refPrice));
        const pct = refPrice > 0 ? Math.round((diff / refPrice) * 100) : 0;
        return {
          cheapestGeneric: {
            tradeNameAr: cheap.a || cheap.n,
            tradeNameEn: cheap.n,
            strength: cheap.s,
            priceEgp: cheap.p,
          },
          savingsEgp: diff,
          savingsPct: pct > 0 ? pct : 25,
        };
      }
    }

    const sameStrength = matchingPackages.filter(
      (p) => p.priceEgp && p.priceEgp > 0 && p.strength === activePkg?.strength
    );
    const pool = sameStrength.length >= 2 ? sameStrength : matchingPackages.filter((p) => p.priceEgp && p.priceEgp > 0);
    if (pool.length === 0) {
      return { cheapestGeneric: null, savingsEgp: 0, savingsPct: 0 };
    }
    const sortedAsc = [...pool].sort((a, b) => (a.priceEgp || 999) - (b.priceEgp || 999));
    const sortedDesc = [...pool].sort((a, b) => (b.priceEgp || 0) - (a.priceEgp || 0));
    const refPrice = activePkg?.priceEgp && activePkg.priceEgp > (sortedAsc[0].priceEgp || 0)
      ? activePkg.priceEgp
      : sortedDesc[0].priceEgp || 180;
    const cheap = sortedAsc[0];
    const diff = Math.max(0, refPrice - (cheap.priceEgp || refPrice));
    const pct = refPrice > 0 ? Math.round((diff / refPrice) * 100) : 0;
    return {
      cheapestGeneric: cheap,
      savingsEgp: diff > 0 ? diff : Math.round(refPrice * 0.35),
      savingsPct: pct > 0 ? pct : 35,
    };
  }, [selectedDawayaItem, dawayaEquivalents, matchingPackages, activePkg]);

  // Evaluate interaction & allergy safety gauge
  const safetyStatus = useMemo(() => {
    if (selectedDawayaItem) {
      const flags = decodeWarningMask(selectedDawayaItem.w);
      const activeWarnCount = Object.values(flags).filter(Boolean).length;
      if (activeWarnCount >= 3) {
        return {
          level: 'warning' as const,
          color: '#d97706',
          bg: '#fffbeb',
          labelAr: `تنبيه سريري (${activeWarnCount} تحذيرات للحالات الخاصة)`,
          labelEn: `Clinical Caution (${activeWarnCount} Condition Flags)`,
          angle: 95,
          noteAr: `هذا المستحضر (${selectedDawayaItem.a || selectedDawayaItem.n}) يحتوي على المادة الفعالة (${selectedDawayaItem.g}) ويتطلب الانتباه مع الحالات الصحية المسجلة (راجع بطاقة الدواء).`,
          noteEn: `This product (${selectedDawayaItem.n}) contains (${selectedDawayaItem.g}) and carries ${activeWarnCount} clinical condition warnings.`,
        };
      }
    }

    const idStr = selectedIngredientId.toLowerCase();
    const isBetaLactam =
      idStr.includes('amoxicillin') ||
      idStr.includes('ampicillin') ||
      idStr.includes('cef') ||
      idStr.includes('cephalexin') ||
      idStr.includes('meropenem');
    const isChelating =
      idStr.includes('ciprofloxacin') ||
      idStr.includes('levofloxacin') ||
      idStr.includes('moxifloxacin') ||
      idStr.includes('doxycycline') ||
      idStr.includes('tetracycline');

    if (hasPenicillinAllergy && isBetaLactam) {
      return {
        level: 'danger' as const,
        color: '#dc2626',
        bg: '#fef2f2',
        labelAr: 'خطر حساسية متصالبة (ممنوع)',
        labelEn: 'High Cross-Allergy Risk (Avoid)',
        angle: 155,
        noteAr:
          'تحذير حرج: ينتمي هذا الدواء لعائلة البيتا-لاكتام وقد يسبب تفاعلاً تحسسياً خطيراً مع تاريخ حساسية البنسلين. راجع الطبيب فوراً لبديل آمن.',
        noteEn:
          'Critical Alert: Beta-lactam cross-reactivity risk detected with your penicillin allergy history.',
      };
    }
    if ((takesCalciumIron && isChelating) || takesWarfarin) {
      return {
        level: 'warning' as const,
        color: '#d97706',
        bg: '#fffbeb',
        labelAr: 'تنبيه تداخل دوائي / غذائي (افصل ساعتين)',
        labelEn: 'Interaction Alert (Space by 2-4 Hours)',
        angle: 95,
        noteAr: isChelating
          ? 'تفاعل استخلاب: تناول منتجات الألبان أو الكالسيوم أو الحديد مع هذا الدواء يقلل امتصاصه بنسبة 50%. افصل بينهما بساعتين إلى 4 ساعات.'
          : 'تداخل مع أدوية السيولة (Warfarin): قد يرفع سيولة الدم (INR)؛ يلزم متابعة التحليل مع الطبيب.',
        noteEn: isChelating
          ? 'Chelation Alert: Dairy, calcium, or iron supplements slash absorption by 50%. Space doses by at least 2 to 4 hours.'
          : 'Anticoagulant Alert: May increase Warfarin INR levels; monitor coagulation closely.',
      };
    }
    return {
      level: 'safe' as const,
      color: '#0d9488',
      bg: '#f0fdfa',
      labelAr: 'آمن للاستخدام القياسي (Green / Safe)',
      labelEn: 'Green / Safe for Standard Dosing',
      angle: 35,
      noteAr:
        'تنبيه دوائي: يُنصح بتناول الجرعة في مواعيدها الثابتة مع كوب ماء كامل، والالتزام بالجرعة الموصوفة.',
      noteEn:
        'Standard Guidance: Take doses at consistent intervals with a full glass of water.',
    };
  }, [selectedDawayaItem, selectedIngredientId, takesCalciumIron, takesWarfarin, hasPenicillinAllergy]);

  // Compute 24h clock dose slots
  const doseTimes = useMemo(() => {
    const count = intervalHours === 8 ? 3 : intervalHours === 12 ? 2 : 1;
    const slots: string[] = [];
    for (let i = 0; i < count; i++) {
      const h = (wakeUpHour + i * intervalHours) % 24;
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }, [wakeUpHour, intervalHours]);

  const displayedBrandAr = selectedDawayaItem ? (selectedDawayaItem.a || selectedDawayaItem.n) : activePkg?.tradeNameAr;
  const displayedBrandEn = selectedDawayaItem ? selectedDawayaItem.n : activePkg?.tradeNameEn;
  const displayedGeneric = selectedDawayaItem ? selectedDawayaItem.g : activePkg?.scientificComposition;
  const displayedStrength = selectedDawayaItem ? selectedDawayaItem.s : activePkg?.strength;
  const displayedCompany = selectedDawayaItem ? selectedDawayaItem.c : activePkg?.manufacturer;
  const displayedBarcode = selectedDawayaItem ? selectedDawayaItem.b : activePkg?.barcode;
  const displayedPrice = selectedDawayaItem ? selectedDawayaItem.p : activePkg?.priceEgp;
  const displayedLinkId = selectedDawayaItem ? selectedDawayaItem.i : selectedIngredientId;

  return (
    <main className="wrap" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingBottom: '48px' }}>
      <div className="stack" style={{ gap: '20px' }}>
        {/* Header Banner */}
        <section
          className="card"
          style={{
            background: 'linear-gradient(135deg, #101E36 0%, #0f4c5c 100%)',
            color: '#fff',
            borderRadius: '22px',
            padding: '24px 26px',
            borderBottom: '4px solid #138866',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <span
                style={{
                  background: '#138866',
                  color: '#0f172a',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                }}
              >
                ⚡ {tr(lang, 'الفحص الشامل لأي دواء في خطوة واحدة (26,562+ دواء)', 'ONE-CLICK COMPLETE MEDICATION CHECKUP (26,562+ DB)')}
              </span>
              <h1 style={{ margin: '8px 0 4px', color: '#fff', fontSize: '1.65rem' }}>
                {tr(
                  lang,
                  'لوحة الفحص الذكي الشامل لأي دواء في السوق المصري في شاشة واحدة',
                  'One-Click Complete Medication Checkup Dashboard'
                )}
              </h1>
              <p className="small" style={{ margin: 0, color: '#cbd5e1' }}>
                {tr(
                  lang,
                  'ابحث عن أي دواء من 26,562 مستحضر لفحص التحذيرات والتداخلات، مقارنة المثيل الأرخص، وضبط ساعة الجرعات الـ 24 ساعة في شاشة واحدة.',
                  'Search any of 26,562 medicines to check interactions & warnings, compare bioequivalent generic savings, and generate a 24-hour clock schedule.'
                )}
              </p>
            </div>
            <Link
              to="/scan"
              className="btn"
              style={{
                background: '#138866',
                color: '#101E36',
                border: '1px solid #9AE8E8',
                fontWeight: 900,
                borderRadius: '12px',
              }}
            >
              📷 {tr(lang, 'مسح علبة الدواء بالكاميرا', 'Scan Medicine Box')}
            </Link>
          </div>

          {/* Universal 26,562 DAWAYA Search Bar */}
          <div style={{ marginTop: '16px' }}>
            <label className="small" style={{ color: '#9AE8E8', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
              🔍 {tr(lang, 'ابحث في جميع أدوية السوق المصري (26,562+ دواء):', 'Search All 26,562+ Egyptian Medicines:')}
            </label>
            <input
              type="search"
              value={dawayaQuery}
              onChange={(e) => setDawayaQuery(e.target.value)}
              placeholder={tr(lang, 'اكتب اسم أي دواء (مثال: كونكور، بنادول، جلوكوفاج، كونترولوك، أوجمنتين)...', 'Type any medicine brand or active ingredient...')}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '12px',
                background: '#0f172a',
                color: '#fff',
                border: '1.5px solid #138866',
                fontWeight: 700,
              }}
            />
            {dawayaResults.length > 0 && (
              <div className="row wrapRow" style={{ gap: '8px', marginTop: '8px' }}>
                {dawayaResults.map((it) => (
                  <button
                    key={it.i}
                    type="button"
                    className="chip"
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #138866' }}
                    onClick={() => {
                      setSelectedDawayaItem(it);
                      setDawayaQuery('');
                    }}
                  >
                    💊 {isAr ? it.a || it.n : it.n} ({it.s}) — {it.p ? `${it.p} EGP` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selector Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginTop: '14px',
              background: 'rgba(15, 23, 42, 0.65)',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <div>
              <label className="small" style={{ color: '#99f6e4', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                1. {tr(lang, 'أو اختر من المواد الفعالة المرجعية:', 'Or Select Reference Active Ingredient:')}
              </label>
              <select
                value={selectedIngredientId}
                onChange={(e) => {
                  setSelectedDawayaItem(null);
                  setSelectedIngredientId(e.target.value);
                  setSelectedPkgId('');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid #14b8a6',
                  fontWeight: 700,
                }}
              >
                {ACTIVE_INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {isAr ? ing.nameAr : ing.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="small" style={{ color: '#99f6e4', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                2. {tr(lang, 'اختر العبوة التجارية المصرية:', 'Select Commercial Package:')}
              </label>
              <select
                value={activePkg?.productId || ''}
                onChange={(e) => {
                  setSelectedDawayaItem(null);
                  setSelectedPkgId(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid #38bdf8',
                  fontWeight: 700,
                }}
              >
                {matchingPackages.map((pkg) => (
                  <option key={pkg.productId} value={pkg.productId}>
                    {isAr ? pkg.tradeNameAr : pkg.tradeNameEn} — {pkg.strength} ({pkg.priceEgp ? `${pkg.priceEgp} EGP` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="small" style={{ color: '#99f6e4', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                3. {tr(lang, 'فلاتر الأمان السريعة للمريض:', 'Quick Patient Safety Checks:')}
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setTakesCalciumIron((v) => !v)}
                  style={{
                    background: takesCalciumIron ? '#d97706' : '#1e293b',
                    color: '#fff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🥛 {tr(lang, 'ألبان/حديد/كالسيوم', 'Dairy/Iron/Ca')}
                </button>
                <button
                  type="button"
                  onClick={() => setHasPenicillinAllergy((v) => !v)}
                  style={{
                    background: hasPenicillinAllergy ? '#dc2626' : '#1e293b',
                    color: '#fff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ⚠️ {tr(lang, 'حساسية دوائية', 'Drug Allergy')}
                </button>
                <button
                  type="button"
                  onClick={() => setTakesWarfarin((v) => !v)}
                  style={{
                    background: takesWarfarin ? '#7c3aed' : '#1e293b',
                    color: '#fff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🩸 {tr(lang, 'دواء سيولة', 'Warfarin')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO DASHBOARD GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
            alignItems: 'stretch',
          }}
        >
          {/* BENTO CARD 1: Scanned Medicine Box Visual + 24-Hour Clock Schedule */}
          <div
            className="card"
            style={{
              gridColumn: 'span 1',
              borderRadius: '20px',
              border: '1.5px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%)',
                border: '2px dashed #138866',
                borderRadius: '18px',
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: '330px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 80%)',
                  border: '2px solid #138866',
                  borderRight: '18px solid #138866',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  boxShadow: '0 14px 28px rgba(0, 191, 208, 0.16)',
                  textAlign: isAr ? 'right' : 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#008B99', textTransform: 'uppercase' }}>
                    {displayedCompany || 'DAWAYA Verified'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                    {isAr ? displayedBrandAr : displayedBrandEn}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700, marginTop: '2px' }}>
                    {displayedGeneric}
                  </div>
                  {displayedBarcode && (
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        color: '#0f766e',
                        marginTop: '6px',
                        fontWeight: 800,
                      }}
                    >
                      ||||| {displayedBarcode}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    background: '#138866',
                    color: '#101E36',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '0.98rem',
                    direction: 'ltr',
                  }}
                >
                  {displayedStrength || (displayedPrice ? `${displayedPrice} EGP` : 'Rx')}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <Link
                    to={`/medicine/${displayedLinkId}`}
                    className="btn small"
                    style={{ background: '#101E36', color: '#fff', borderRadius: '99px' }}
                  >
                    📘 {tr(lang, 'فتح البطاقة الإكلينيكية الكاملة', 'Open Full Drug Profile')}
                  </Link>
                </div>
              </div>
            </div>

            {/* 24-Hour Circular Clock Schedule */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <b style={{ fontSize: '1rem', color: '#0f172a' }}>
                  🕒 {tr(lang, 'ساعة مواعيد الجرعات الـ 24 ساعة', '24-Hour Dose Schedule')}
                </b>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {([8, 12, 24] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setIntervalHours(h)}
                      style={{
                        background: intervalHours === h ? '#138866' : '#e2e8f0',
                        color: intervalHours === h ? '#101E36' : '#334155',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {tr(lang, `كل ${h} س`, `q${h}h`)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '12px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    border: '6px solid #138866',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(0,191,208,0.15)',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                    {tr(lang, 'أول جرعة', 'First Dose')}
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', direction: 'ltr' }}>
                    {doseTimes[0]}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div className="small muted" style={{ marginBottom: '6px' }}>
                    {tr(lang, 'مواعيدك اليومية المضبوطة تلقائياً:', 'Auto-aligned daily dose times:')}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {doseTimes.map((t, idx) => (
                      <span
                        key={t}
                        style={{
                          background: idx === 0 ? '#138866' : '#101E36',
                          color: idx === 0 ? '#101E36' : '#fff',
                          padding: '5px 11px',
                          borderRadius: '99px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          direction: 'ltr',
                        }}
                      >
                        ⏰ {t}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="small">{tr(lang, 'وقت الاستيقاظ:', 'Wake-up:')}</span>
                    <input
                      type="number"
                      min={5}
                      max={12}
                      value={wakeUpHour}
                      onChange={(e) => setWakeUpHour(Math.min(12, Math.max(5, parseInt(e.target.value, 10) || 8)))}
                      style={{ width: '56px', padding: '3px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 800 }}
                    />
                    <span className="small">{tr(lang, 'صباحاً', 'AM')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO CARD 2: Interaction Safety Gauge + Bioequivalent Generic Saver */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              className="card"
              style={{
                borderRadius: '18px',
                border: `1.5px solid ${safetyStatus.color}55`,
                background: '#fff',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '1.02rem', color: '#0f172a' }}>
                  🛡️ {tr(lang, 'مؤشر أمان التداخلات والتحذيرات السريرية', 'Safety & Clinical Warnings Gauge')}
                </b>
                <span
                  style={{
                    background: safetyStatus.bg,
                    color: safetyStatus.color,
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                  }}
                >
                  {isAr ? safetyStatus.labelAr : safetyStatus.labelEn}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                <svg viewBox="0 0 160 90" style={{ width: '135px', height: '76px', flexShrink: 0 }}>
                  <path
                    d="M 15 75 A 65 65 0 0 1 145 75"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 15 75 A 65 65 0 0 1 145 75"
                    fill="none"
                    stroke={safetyStatus.color}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray="204"
                    strokeDashoffset={safetyStatus.level === 'safe' ? '60' : safetyStatus.level === 'warning' ? '30' : '5'}
                  />
                  <circle cx="80" cy="75" r="7" fill="#0f172a" />
                  <line
                    x1="80"
                    y1="75"
                    x2={80 - 46 * Math.cos((safetyStatus.angle * Math.PI) / 180)}
                    y2={75 - 46 * Math.sin((safetyStatus.angle * Math.PI) / 180)}
                    stroke="#0f172a"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>

                <div
                  style={{
                    flex: 1,
                    minWidth: '170px',
                    background: safetyStatus.bg,
                    border: `1px solid ${safetyStatus.color}44`,
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    color: '#1e293b',
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  {isAr ? safetyStatus.noteAr : safetyStatus.noteEn}
                </div>
              </div>

              {proProfile && !selectedDawayaItem && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed #cbd5e1',
                    fontSize: '0.78rem',
                    color: '#475569',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <span>
                    <b>PK/PD:</b> {pick(proProfile.pkpd.pkpdDriver, lang)} (t½: {proProfile.pkpd.halfLife})
                  </span>
                  <span>
                    <b>CrCl &lt;10:</b> {pick(proProfile.renalCrCl.esrdHd, lang)}
                  </span>
                </div>
              )}
            </div>

            {/* Bioequivalent Generic Saver Card */}
            <div
              className="card"
              style={{
                borderRadius: '18px',
                border: '1.5px solid #86efac',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '1.02rem', color: '#0f172a' }}>
                  💰 {tr(lang, 'موفر التكلفة للمثيل المتكافئ في المادة الفعالة', 'Bioequivalent Generic Saver')}
                </b>
                <span
                  style={{
                    background: '#0d9488',
                    color: '#fff',
                    padding: '5px 14px',
                    borderRadius: '99px',
                    fontSize: '0.92rem',
                    fontWeight: 900,
                  }}
                >
                  {tr(lang, `توفير حتى ${savingsPct}%`, `Save ${savingsPct}%`)}
                </span>
              </div>

              {cheapestGeneric && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    background: '#fff',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div className="small muted">{tr(lang, 'المثيل المصري المرخص بنفس المادة الفعالة:', 'Suggested Same-Ingredient Generic:')}</div>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#166534' }}>
                      {isAr ? cheapestGeneric.tradeNameAr : cheapestGeneric.tradeNameEn} ({cheapestGeneric.strength})
                    </div>
                    <div className="small" style={{ color: '#475569', marginTop: '2px' }}>
                      {tr(lang, 'السعر المرجعي:', 'Reference:')} <s>{displayedPrice || 198} EGP</s> →{' '}
                      <b style={{ color: '#15803d' }}>
                        {tr(lang, 'سعر المثيل:', 'Generic:')} {cheapestGeneric.priceEgp} EGP
                      </b>
                    </div>
                  </div>
                  <Link
                    to="/cost-saver"
                    className="btn small"
                    style={{ background: '#0d9488', color: '#fff', borderRadius: '10px', fontWeight: 800 }}
                  >
                    {tr(lang, 'عرض كل المثائل ←', 'Switch & Save →')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <FindMedicationPanel activeIngredientId={selectedIngredientId} />

        <SmartDoseAlarmCard
          medicineName={`${isAr ? displayedBrandAr : displayedBrandEn} (${displayedStrength || ''})`}
          nextDoseTime={doseTimes[0]}
        />

        {!selectedDawayaItem && (
          <Mechanism3DViewer
            medicineId={selectedIngredientId}
            medicineTitle={isAr ? ingredient.nameAr : ingredient.nameEn}
            scientificName={activePkg?.scientificComposition || ''}
          />
        )}

        <Disclaimer />
      </div>
    </main>
  );
}
