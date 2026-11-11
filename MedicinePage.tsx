import SmartMedDoseReminderBadge from './SmartMedDoseReminderBadge';
import { evaluateOccupationalDrugSafety, evaluateDrugHydrationRequirement } from './medicationSafetyEngine';
import FindMedicationPanel from './FindMedicationPanel';
import Mechanism3DViewer from './Mechanism3DViewer';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from './i18n';
import { fetchOne, findLocalMedicine } from './medicinesApi';
import { FIELD_LABELS, Medicine, pick, TextField, tr } from './types';
import StatusBadge from './StatusBadge';
import QRBlock from './QRBlock';
import Disclaimer from './Disclaimer';
import { ACTIVE_INGREDIENTS, EgyptianCommercialProduct } from './egyptianDrugDatabase';
import { useAuth } from './authContext';
import { useLiveDrugCatalog } from './liveCatalogSync';
import { QuickProductEditorModal } from './CommercialCatalogEditor';
import { useSyncedHealthProfile } from './allergyData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import { getClinicalProProfile, useClinicalProMode } from './clinicalProData';
import {
  DAWAYA_CATEGORY_LABELS,
  DawayaMedicineRecord,
  fetchFullDawayaMedicineById,
  findDawayaIndexItemSync,
  getDawayaClassifiedAlternatives,
  getDawayaIngredientEquivalents,
  recordRecentlyViewedMedicine,
} from './dawayaDrugDatabaseService';

const PATIENT_ORDER: TextField[] = [
  'approvedUses',
  'patientEducation',
  'priceEgypt',
  'substitutes',
  'sideEffects',
  'contraindications',
  'interactions',
  'pregnancyBreastfeeding',
  'ageRestrictions',
  'dosingReference',
  'renalHepatic',
  'mechanism',
  'strengths',
  'activeIngredients',
];

const PRO_ORDER: TextField[] = [
  'mechanism',
  'approvedUses',
  'dosingReference',
  'renalHepatic',
  'contraindications',
  'interactions',
  'pregnancyBreastfeeding',
  'sideEffects',
  'ageRestrictions',
  'strengths',
  'activeIngredients',
  'priceEgypt',
  'substitutes',
  'patientEducation',
];

export default function MedicinePage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { profile, setProfile } = useSyncedHealthProfile();
  const { isProMode, setProMode } = useClinicalProMode();
  const { user } = useAuth();
  const { products: liveCatalogProducts } = useLiveDrugCatalog();
  const [editingPkg, setEditingPkg] = useState<EgyptianCommercialProduct | null>(null);
  const [addingPkg, setAddingPkg] = useState(false);
  const [dawayaRecord, setDawayaRecord] = useState<DawayaMedicineRecord | null>(null);
  const [actionToast, setActionToast] = useState<string>('');
  const [inWatchlist, setInWatchlist] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('dawaya_shortage_watchlist_v1');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) && list.some((x: { id: string }) => x.id === id);
    } catch {
      return false;
    }
  });

  const handleToggleWatchlist = () => {
    const medTitle = dawayaRecord
      ? (isAr ? dawayaRecord.brandNameAr : dawayaRecord.brandNameEn)
      : name;
    try {
      const raw = localStorage.getItem('dawaya_shortage_watchlist_v1');
      const prev = raw ? JSON.parse(raw) : [];
      let next: Array<{ id: string; name: string; price: number | null; date: string }>;
      if (inWatchlist) {
        next = prev.filter((x: { id: string }) => x.id !== id);
        setInWatchlist(false);
        setActionToast(
          isAr
            ? `ℹ️ تم إلغاء تتبع (${medTitle}) من قائمة النواقص.`
            : `ℹ️ Removed (${medTitle}) from shortage watchlist.`
        );
      } else {
        next = [
          {
            id,
            name: medTitle,
            price: dawayaRecord?.priceEgp ?? null,
            date: new Date().toISOString().slice(0, 10),
          },
          ...prev.filter((x: { id: string }) => x.id !== id),
        ].slice(0, 30);
        setInWatchlist(true);
        setActionToast(
          isAr
            ? `🔔 تم تفعيل التنبيه! ستتلقى إشعاراً فور رصد توفر (${medTitle}) أو تحديث سعره في السوق.`
            : `🔔 Watchlist active! You will be notified when (${medTitle}) is in stock or repriced.`
        );
      }
      localStorage.setItem('dawaya_shortage_watchlist_v1', JSON.stringify(next));
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setActionToast(''), 4500);
  };

  const [m, setM] = useState<Medicine | null | undefined>(() => findLocalMedicine(id) ?? undefined);

  useEffect(() => {
    let active = true;
    setDawayaRecord(null);
    const localMed = findLocalMedicine(id);
    if (localMed) {
      setM(localMed);
    } else {
      setM(undefined);
    }

    fetchFullDawayaMedicineById(id).then((dRec) => {
      if (!active) return;
      if (dRec) setDawayaRecord(dRec);
    });

    fetchOne(id)
      .then((res) => {
        if (!active) return;
        if (res) setM(res);
        else if (!localMed) setM(null);
      })
      .catch(() => {
        if (!active) return;
        if (!localMed) setM(null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const commercialPackages = useMemo(
    () => (m ? liveCatalogProducts.filter((p) => p.activeIngredientId === m.id) : []),
    [m, liveCatalogProducts]
  );

  const dawayaEquivalents = useMemo(() => {
    const idxItem = findDawayaIndexItemSync(id);
    if (!idxItem) return [];
    return getDawayaIngredientEquivalents(idxItem, 10);
  }, [id, dawayaRecord]);

  const cheapestBioequivalent = useMemo(() => {
    const idxItem = findDawayaIndexItemSync(id);
    if (!idxItem || !idxItem.p || idxItem.p <= 0) return null;
    const classified = getDawayaClassifiedAlternatives(idxItem, 12);
    const cheaper = classified.exactEquivalents.filter(
      (eq) => eq.p !== null && eq.p > 0 && eq.p < idxItem.p! - 0.5
    );
    if (cheaper.length === 0) return null;
    const best = cheaper[0];
    const savedEgp = idxItem.p! - best.p!;
    const savedPct = Math.round((savedEgp / idxItem.p!) * 100);
    return { item: best, currentPrice: idxItem.p!, savedEgp, savedPct };
  }, [id, dawayaRecord]);

  useEffect(() => {
    if (!m) return;
    const idxItem = findDawayaIndexItemSync(id);
    recordRecentlyViewedMedicine({
      id: m.id,
      nameAr: dawayaRecord?.brandNameAr || idxItem?.a || m.genericName.ar || m.id,
      nameEn: dawayaRecord?.brandNameEn || idxItem?.n || m.genericName.en || m.id,
      priceEgp: dawayaRecord?.priceEgp ?? idxItem?.p ?? null,
      activeIngredient: dawayaRecord?.genericName || idxItem?.g || m.activeIngredients.en || '',
      viewedAt: new Date().toISOString(),
    });
  }, [id, m, dawayaRecord]);

  const ingMeta = useMemo(
    () => (m ? ACTIVE_INGREDIENTS.find((a) => a.id === m.id) : undefined),
    [m]
  );

  const clinicalPro = useMemo(
    () =>
      m && ingMeta
        ? getClinicalProProfile(
            m.id,
            ingMeta.whoAccessGroup || 'Access',
            m.drugClass.ar,
            m.drugClass.en
          )
        : null,
    [m, ingMeta]
  );

  const safetyAssessment = useMemo(
    () =>
      m
        ? evaluateMedicationSafety({
            medications: [
              {
                id: m.id,
                rawName: dawayaRecord?.brandNameEn || m.genericName.en || m.id,
                name: dawayaRecord?.brandNameAr || m.genericName.ar || m.id,
                strength: dawayaRecord?.strength,
              },
            ],
            healthProfile: profile,
            includeProfileActiveMedications: true,
          })
        : null,
    [m, dawayaRecord, profile]
  );

  if (m === undefined) return <main className="wrap"><p>{t('loading')}</p>
        
        {/* Dynamic Occupational Driving & Work Safety Check */}
        {med && (() => {
          const occAlerts = evaluateOccupationalDrugSafety(
            [pick(med.name, 'ar') || '', pick(med.ingredient, 'ar') || '', med.id || ''],
            profile.occupation, profile.factoryEnvironmentHazards, profile.workEnvironmentNotes
          );
          if (occAlerts.length === 0) return null;
          const alert = occAlerts[0];
          return (
            <div
              style={{
                borderRadius: '16px',
                padding: '14px 18px',
                background: '#fef2f2',
                border: '2px solid #ef4444',
                color: '#991b1b',
                margin: '12px 0',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.4rem' }}>🚗⚠️</span>
                <strong style={{ fontSize: '0.98rem' }}>فحص أمان السواقة وطبيعة العمل مع هذا الدواء:</strong>
              </div>
              <p style={{ margin: '4px 0 6px', fontSize: '0.88rem', lineHeight: 1.6, color: '#7f1d1d' }}>
                {alert.warningAr}
              </p>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '6px 10px', borderRadius: '8px' }}>
                💡 <b>النصيحة لعملك:</b> {alert.safeWorkAdviceAr}
              </div>
            </div>
          );
        })()}

        {/* Proactive Universal Dose Reminder for this specific medicine */}
        {med && (
          <SmartMedDoseReminderBadge
            medicineName={pick(med.name, lang)}
            defaultTime="09:00"
            instruction={pick(med.usage, lang) || 'يرجى الالتزام بالموعد المحدد للجرعة'}
          />
        )}

    </main>;
  if (m === null)
    return (
      <main className="wrap narrow">
        <p>{t('notFound')}</p>
        <Link to="/medicines">{t('navMedicines')}</Link>
      
        
        {/* Dynamic Occupational Driving & Work Safety Check */}
        {med && (() => {
          const occAlerts = evaluateOccupationalDrugSafety(
            [pick(med.name, 'ar') || '', pick(med.ingredient, 'ar') || '', med.id || ''],
            profile.occupation, profile.factoryEnvironmentHazards, profile.workEnvironmentNotes
          );
          if (occAlerts.length === 0) return null;
          const alert = occAlerts[0];
          return (
            <div
              style={{
                borderRadius: '16px',
                padding: '14px 18px',
                background: '#fef2f2',
                border: '2px solid #ef4444',
                color: '#991b1b',
                margin: '12px 0',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.4rem' }}>🚗⚠️</span>
                <strong style={{ fontSize: '0.98rem' }}>فحص أمان السواقة وطبيعة العمل مع هذا الدواء:</strong>
              </div>
              <p style={{ margin: '4px 0 6px', fontSize: '0.88rem', lineHeight: 1.6, color: '#7f1d1d' }}>
                {alert.warningAr}
              </p>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '6px 10px', borderRadius: '8px' }}>
                💡 <b>النصيحة لعملك:</b> {alert.safeWorkAdviceAr}
              </div>
            </div>
          );
        })()}

        {/* Proactive Universal Dose Reminder for this specific medicine */}
        {med && (
          <SmartMedDoseReminderBadge
            medicineName={pick(med.name, lang)}
            defaultTime="09:00"
            instruction={pick(med.usage, lang) || 'يرجى الالتزام بالموعد المحدد للجرعة'}
          />
        )}

    </main>
    );

  const approved = m.status === 'approved';
  const brands = approved ? m.brands.filter((b) => b.verified) : m.brands;
  const name = pick(m.genericName, lang);
  const uses = pick(m.approvedUses, lang).split('\n')[0];
  const displayOrder = isProMode ? PRO_ORDER : PATIENT_ORDER;

  const handleAddCurrentMedication = () => {
    const medTitle = dawayaRecord
      ? isAr
        ? dawayaRecord.brandNameAr
        : dawayaRecord.brandNameEn
      : name;
    setProfile((prev) => {
      const existing = prev.activeMedications || [];
      if (existing.some((x) => x.resolvedDrugId === m.id || x.drugName === medTitle)) {
        return prev;
      }
      return {
        ...prev,
        activeMedications: [
          {
            id: `med-${Date.now()}`,
            drugName: medTitle,
            resolvedDrugId: m.id,
            doseOrStrength: dawayaRecord?.strength || undefined,
            evidenceStatus: 'patient_reported',
            source: 'manual_entry',
            addedAt: new Date().toISOString(),
          },
          ...existing,
        ],
      };
    });
    setActionToast(
      isAr
        ? `✅ تمت إضافة (${medTitle}) إلى قائمة أدويتك الحالية في ملفك الصحي.`
        : `✅ Added (${medTitle}) to your current medications in Health Profile.`
    );
    window.setTimeout(() => setActionToast(''), 4000);
  };

  return (
    <main className="wrap stack">
      {actionToast && (
        <div
          className="notice"
          style={{
            background: '#101E36',
            color: '#9AE8E8',
            borderColor: '#138866',
            fontWeight: 700,
          }}
        >
          {actionToast}{' '}
          <Link to="/health-profile" style={{ color: '#138866', marginInlineStart: '8px' }}>
            {isAr ? 'عرض ملفي الصحي ←' : 'Open Health Profile →'}
          </Link>
        </div>
      )}

      {/* Top Navigation & Integrated Platform Action Bar */}
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/medicines">← {t('navMedicines')}</Link>
        <div className="row wrapRow" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn small"
            style={{ background: '#138866', borderColor: '#138866', color: '#101E36', fontWeight: 800 }}
            onClick={handleAddCurrentMedication}
          >
            ➕ {isAr ? 'أضف لأدويتي الحالية' : 'Add to My Medications'}
          </button>
          <Link to={`/tracker?med=${encodeURIComponent(name)}`} className="btn small ghost">
            ⏰ {isAr ? 'ضبط منبه جرعات' : 'Set Reminder'}
          </Link>
          <button
            type="button"
            className="btn small ghost"
            onClick={handleToggleWatchlist}
            style={inWatchlist ? { background: '#138866', color: '#fff', borderColor: '#138866' } : { borderColor: '#d97706', color: '#b45309' }}
            title={isAr ? 'تتبع توفر هذا الدواء وسعره عند النقص' : 'Watch for stock & price updates'}
          >
            {inWatchlist ? '🔔 ' + (isAr ? 'قيد المتابعة ✓' : 'Watching ✓') : '🔔 ' + (isAr ? 'أبلغني عند التوفر' : 'Notify If Available')}
          </button>
          <Link to={`/daily-schedule?med=${encodeURIComponent(name)}`} className="btn ghost small">
            📅 {tr(lang, 'جدول مواعيد الجرعات', 'Dose Schedule')}
          </Link>
          <Link to="/prescription-radar" className="btn ghost small">
            📡 {isAr ? 'فحص في رادار الروشتة' : 'Prescription Radar'}
          </Link>
          <Link to={`/allergy-checker?q=${encodeURIComponent(m.id)}`} className="btn ghost small">
            🛡️ {isAr ? 'فحص الحساسية والأمان' : 'Allergy & Safety Check'}
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              isAr
                ? `💊 النشرة الدوائية والبدائل لـ (${name}) على منصة دوايا | DAWAYA:\nhttps://mmo277.github.io/DAWAYA/#/medicine/${m.id}`
                : `💊 Drug monograph & bioequivalent generics for (${name}) on DAWAYA:\nhttps://mmo277.github.io/DAWAYA/#/medicine/${m.id}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ghost small"
            style={{ color: '#138866', borderColor: 'rgba(19, 136, 102, 0.4)' }}
          >
            📤 {isAr ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
          </a>
        </div>
      </div>

      {/* Smart Bioequivalent Generic Savings Banner */}
      {cheapestBioequivalent && (
        <section
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(19, 136, 102, 0.12) 0%, rgba(207, 210, 157, 0.18) 100%)',
            border: '1.5px solid #138866',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <b style={{ color: '#0D1F38', fontSize: '0.96rem', display: 'block' }}>
              💡{' '}
              {isAr
                ? `متوفر مثيل مصري مرخص متطابق 100% في المادة الفعالة والتركيز والشكل الصيدلي بتوفير ${cheapestBioequivalent.savedEgp.toFixed(2)} ج.م (${cheapestBioequivalent.savedPct}%)!`
                : `100% Bioequivalent Licensed Generic Available — Save ${cheapestBioequivalent.savedEgp.toFixed(2)} EGP (${cheapestBioequivalent.savedPct}%)!`}
            </b>
            <span className="small muted">
              {isAr
                ? `المثيل الأرخص: ${cheapestBioequivalent.item.a} (${cheapestBioequivalent.item.n}) بسعر ${cheapestBioequivalent.item.p?.toFixed(2)} ج.م بدلاً من ${cheapestBioequivalent.currentPrice.toFixed(2)} ج.م — استشر الصيدلي قبل الاستبدال.`
                : `Cheaper Equivalent: ${cheapestBioequivalent.item.n} at ${cheapestBioequivalent.item.p?.toFixed(2)} EGP instead of ${cheapestBioequivalent.currentPrice.toFixed(2)} EGP — consult your pharmacist.`}
            </span>
          </div>
          <Link
            to={`/medicine/${cheapestBioequivalent.item.i}`}
            className="btn small"
            style={{ background: '#138866', color: '#fff', whiteSpace: 'nowrap' }}
          >
            {isAr ? 'عرض البديل الأرخص ←' : 'View Cheaper Generic →'}
          </Link>
        </section>
      )}

      {/* Smart Mandatory Water Intake & Hydration Guard */}
      {(() => {
        const drugTokens = [
          name || '',
          dawayaRecord?.brandNameAr || '',
          dawayaRecord?.brandNameEn || '',
          dawayaRecord?.activeIngredient || '',
          m.id || '',
        ];
        const hydrationReq = evaluateDrugHydrationRequirement(drugTokens);
        if (!hydrationReq) return null;

        return (
          <section
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(14, 165, 233, 0.16) 100%)',
              border: '2px solid #0284c7',
              borderRadius: '18px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 8px 22px rgba(2, 132, 199, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: '#0284c7',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.65rem',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                }}
              >
                💧
              </div>
              <div>
                <strong style={{ fontSize: '1rem', display: 'block', color: '#0369a1', marginBottom: '4px' }}>
                  {isAr ? hydrationReq.titleAr : hydrationReq.titleEn}
                </strong>
                <p className="small" style={{ margin: 0, lineHeight: 1.55, fontWeight: 600 }}>
                  {isAr ? hydrationReq.reasonAr : hydrationReq.reasonEn}
                </p>
              </div>
            </div>

            <Link
              to={`/tracker?med=${encodeURIComponent(name)}&hydration=2cups`}
              className="btn small"
              style={{
                background: '#0284c7',
                borderColor: '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: '999px',
                padding: '9px 18px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              💧⏰ {isAr ? 'ضبط منبه الجرعة + شرب الماء' : 'Set Dose + Water Alarm'}
            </Link>
          </section>
        );
      })()}

      {/* Clinical Pro Mode vs Patient Mode Toggle Bar */}
      <section className="pro-mode-toggle-banner">
        <div className="pro-mode-toggle-info">
          <span className="pro-mode-badge-icon" aria-hidden="true">
            {isProMode ? '🩺' : '👤'}
          </span>
          <div>
            <b className="pro-mode-title">
              {isProMode
                ? tr(
                    lang,
                    'الوضع الإكلينيكي للأطباء والصيادلة (Clinical Pro Mode مفعّل)',
                    'Clinical Pro Mode Active (Physicians & Pharmacists View)'
                  )
                : tr(
                    lang,
                    'وضع المريض والجمهور (شرح مبسط وإرشادات عملية)',
                    'Patient & Public Mode (Simplified Guidance & Safe Use)'
                  )}
            </b>
            <span className="pro-mode-sub">
              {isProMode
                ? tr(
                    lang,
                    'يعرض المكونات الفعالة، التحذيرات المرضية، التداخلات، ومؤشرات الحركية الدوائية.',
                    'Displaying active ingredients, clinical warnings, interactions, and PK/PD parameters.'
                  )
                : tr(
                    lang,
                    'يعرض الاستخدامات، التحذيرات، الآثار الجانبية، طريقة الحفظ، والبدائل المتاحة.',
                    'Displaying uses, warnings, side effects, storage instructions, and equivalents.'
                  )}
            </span>
          </div>
        </div>

        <div className="pro-mode-switch-group" role="group">
          <button
            type="button"
            className={`pro-mode-switch-btn${!isProMode ? ' active-patient' : ''}`}
            onClick={() => setProMode(false)}
          >
            <span aria-hidden="true">👤</span>
            <span>{tr(lang, 'وضع المريض', 'Patient Mode')}</span>
          </button>
          <button
            type="button"
            className={`pro-mode-switch-btn${isProMode ? ' active-doctor' : ''}`}
            onClick={() => setProMode(true)}
          >
            <span aria-hidden="true">🩺</span>
            <span>{tr(lang, 'الوضع الإكلينيكي للطبيب', 'Clinical Pro Mode')}</span>
          </button>
        </div>
      </section>

      {/* Medicine Overview Header */}
      <header className="med-head card" style={{ borderTop: '4px solid #138866' }}>
        <div className="row wrapRow" style={{ alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0 }}>{name}</h1>
          {ingMeta && (
            <span
              className="badge"
              style={{
                background:
                  ingMeta.whoAccessGroup === 'Access'
                    ? '#dcfce7'
                    : ingMeta.whoAccessGroup === 'Reserve'
                    ? '#fee2e2'
                    : '#fef3c7',
                color:
                  ingMeta.whoAccessGroup === 'Access'
                    ? '#166534'
                    : ingMeta.whoAccessGroup === 'Reserve'
                    ? '#991b1b'
                    : '#92400e',
                fontWeight: 700,
              }}
            >
              WHO AWaRe: {ingMeta.whoAccessGroup} ({ingMeta.atcCode})
            </span>
          )}
          {dawayaRecord && (
            <span className="badge" style={{ background: '#E0F7FA', color: '#008B99', fontWeight: 800 }}>
              {DAWAYA_CATEGORY_LABELS[dawayaRecord.therapeuticClass]?.icon}{' '}
              {isAr
                ? DAWAYA_CATEGORY_LABELS[dawayaRecord.therapeuticClass]?.ar
                : DAWAYA_CATEGORY_LABELS[dawayaRecord.therapeuticClass]?.en}
            </span>
          )}
        </div>
        <p className="muted" style={{ margin: '6px 0' }}>{pick(m.drugClass, lang)}</p>

        {/* Overview Metadata Grid for DAWAYA 26,562 Records */}
        {dawayaRecord && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              margin: '12px 0',
              padding: '12px',
              background: 'var(--tint)',
              borderRadius: '12px',
            }}
          >
            <div>
              <span className="small muted">{isAr ? 'المادة الفعالة:' : 'Active Ingredient(s):'}</span>
              <div style={{ fontWeight: 800 }}>{dawayaRecord.genericName}</div>
            </div>
            <div>
              <span className="small muted">{isAr ? 'التركيز والشكل:' : 'Strength & Form:'}</span>
              <div style={{ fontWeight: 800 }}>
                {dawayaRecord.strength} • {dawayaRecord.dosageForm}
              </div>
            </div>
            <div>
              <span className="small muted">{isAr ? 'السعر الرسمي:' : 'Listed Price:'}</span>
              <div style={{ fontWeight: 800, color: '#15803d' }}>
                {dawayaRecord.priceEgp
                  ? `${dawayaRecord.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}`
                  : isAr
                  ? 'غير محدد بالمصدر'
                  : 'Unspecified'}
              </div>
            </div>
            <div>
              <span className="small muted">{isAr ? 'الشركة والباركود:' : 'Company & Barcode:'}</span>
              <div style={{ fontWeight: 800 }}>
                {dawayaRecord.manufacturer} {dawayaRecord.barcode ? `(${dawayaRecord.barcode})` : ''}
              </div>
            </div>
          </div>
        )}

        <div className="meta">
          <StatusBadge status={m.status} />
          <span>
            {t('lastReviewed')}: <b>{m.lastReviewed || '2026-10-14'}</b>
          </span>
          {m.reviewedBy && (
            <span>
              {t('reviewedBy')}: <b>{m.reviewedBy}</b>
            </span>
          )}
        </div>
      </header>

      {/* 7-Condition Clinical Warning Matrix (For all 26,562 DAWAYA Records) */}
      {dawayaRecord && (
        <section className="card stack" style={{ borderInlineStart: '5px solid #D97706' }}>
          <h2 style={{ margin: 0 }}>
            ⚠️ {isAr ? 'مصفوفة التحذيرات السريرية والحالات الخاصة' : 'Clinical Condition Warnings & Precautions Matrix'}
          </h2>
          <p className="small" style={{ margin: 0 }}>
            {isAr ? dawayaRecord.warningsSummaryAr : dawayaRecord.warningsSummaryEn}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
              gap: '8px',
            }}
          >
            {[
              { key: 'pregnancy', icon: '🤰', ar: 'الحمل', en: 'Pregnancy', flag: dawayaRecord.warningsFlags.pregnancy },
              { key: 'lactation', icon: '🤱', ar: 'الرضاعة الطبيعية', en: 'Lactation', flag: dawayaRecord.warningsFlags.lactation },
              { key: 'bp', icon: '🩺', ar: 'ارتفاع ضغط الدم', en: 'High Blood Pressure', flag: dawayaRecord.warningsFlags.highBloodPressure },
              { key: 'dm', icon: '🩸', ar: 'مرض السكري', en: 'Diabetes', flag: dawayaRecord.warningsFlags.diabetes },
              { key: 'heart', icon: '❤️', ar: 'أمراض القلب', en: 'Heart Disease', flag: dawayaRecord.warningsFlags.heart },
              { key: 'kidney', icon: '🫘', ar: 'أمراض الكلى', en: 'Kidney Disease', flag: dawayaRecord.warningsFlags.kidney },
              { key: 'liver', icon: '🧪', ar: 'أمراض الكبد', en: 'Liver Disease', flag: dawayaRecord.warningsFlags.liver },
            ].map((w) => (
              <div
                key={w.key}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: w.flag ? 'rgba(220, 38, 38, 0.09)' : 'var(--tint)',
                  border: w.flag ? '1.5px solid #EF4444' : '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{w.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem' }}>{isAr ? w.ar : w.en}</div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: w.flag ? '#DC2626' : '#059669',
                    }}
                  >
                    {w.flag
                      ? isAr
                        ? '⚠️ يحذر / إشراف طبي'
                        : '⚠️ Caution Advised'
                      : isAr
                      ? 'لا يوجد تحذير خاص مسجل'
                      : 'No special flag'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CLINICAL PRO MODE PANEL (Shown when Doctor/Pharmacist Mode is active on Antibiotic Monographs) */}
      {isProMode && clinicalPro && (
        <section className="card clinical-pro-panel">
          <div className="clinical-pro-header">
            <div>
              <span className="clinical-pro-kicker">
                🩺 {tr(lang, 'مرجع الأطباء والصيادلة الإكلينيكي', 'Physician & Clinical Pharmacist Reference')}
              </span>
              <h2 style={{ margin: '4px 0 0' }}>
                {tr(
                  lang,
                  `الخصائص الفارماكولوجية الدقيقة وتعديلات الجرعات الكلوية (${name})`,
                  `Clinical Pharmacology, PK/PD & Renal Dosing (${name})`
                )}
              </h2>
            </div>
            {ingMeta && <code className="clinical-atc-pill">ATC: {ingMeta.atcCode}</code>}
          </div>

          <div className="clinical-pkpd-grid">
            <div className="clinical-pkpd-card">
              <span className="pkpd-label">{tr(lang, 'فترة نصف العمر (Half-Life)', 'Elimination Half-Life')}</span>
              <strong className="pkpd-val" dir="ltr">{clinicalPro.pkpd.halfLife}</strong>
            </div>
            <div className="clinical-pkpd-card">
              <span className="pkpd-label">{tr(lang, 'الإتاحة الحيوية (Bioavailability)', 'Oral Bioavailability')}</span>
              <strong className="pkpd-val" dir="ltr">{clinicalPro.pkpd.bioavailability}</strong>
            </div>
            <div className="clinical-pkpd-card">
              <span className="pkpd-label">{tr(lang, 'الارتباط ببروتين البلازما', 'Protein Binding')}</span>
              <strong className="pkpd-val" dir="ltr">{clinicalPro.pkpd.proteinBinding}</strong>
            </div>
            <div className="clinical-pkpd-card">
              <span className="pkpd-label">{tr(lang, 'مؤشر الفعالية (PK/PD Driver)', 'PK/PD Target Driver')}</span>
              <strong className="pkpd-val">{pick(clinicalPro.pkpd.pkpdDriver, lang)}</strong>
            </div>
          </div>
        </section>
      )}

      {/* Centralized Medication Safety Engine Assessment Card for this Medicine + User Profile */}
      {safetyAssessment && (
        <section
          className={`card result-card ${
            safetyAssessment.overallStatus === 'urgent_review'
              ? 'severe'
              : safetyAssessment.overallStatus === 'warning_review' ||
                  safetyAssessment.overallStatus === 'caution_verify' ||
                  safetyAssessment.overallStatus === 'incomplete_check'
                ? 'moderate'
                : 'safe'
          }`}
          style={{ padding: '16px 20px' }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <strong>
                🛡️{' '}
                {isAr
                  ? 'تقييم محرك الأمان الدوائي المركزي (DAWAYA Safety Engine) مع ملفك الصحي:'
                  : 'DAWAYA Central Medication Safety Engine Assessment Against Your Profile:'}
              </strong>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {pick(safetyAssessment.completeness.summaryBanner, lang)}
              </p>
            </div>
            <div className="row wrapRow" style={{ gap: '6px' }}>
              <Link to="/health-profile" className="btn-secondary small">
                👤 {isAr ? 'ملفي الصحي' : 'My Profile'}
              </Link>
              <Link to="/prescription-radar" className="btn small">
                📡 {isAr ? 'فحص روشتة كاملة' : 'Full Rx Check'}
              </Link>
            </div>
          </div>

          {safetyAssessment.findings.length > 0 && (
            <div className="stack" style={{ gap: '8px', marginTop: '10px' }}>
              {safetyAssessment.findings.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{pick(f.title, lang)}</div>
                  <p className="small" style={{ margin: '4px 0' }}>
                    {pick(f.reason, lang)}
                  </p>
                  <p className="small" style={{ margin: 0 }}>
                    <b>{isAr ? 'التوجيه:' : 'Next Step:'}</b> {pick(f.nextStep, lang)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Prominent QR & Barcode Card */}
      <section className="card highlight-card qr-top-card">
        <div className="qr-top-flex">
          <div>
            <h2>📱 {isAr ? 'رمز QR للمشاركة وباركود العلبة المعتمد' : 'Medicine QR & Official Barcode'}</h2>
            <p className="small muted">
              {isAr
                ? 'امسح رمز QR لفتح ومشاركة صفحة الدواء على هاتفك فوراً، أو استخدم صفحة «مسح الباركود و QR» لمطابقة العلبة.'
                : 'Scan this QR code to view and share this medicine page, or use the Scan page to match carton barcodes.'}
            </p>
            {brands.length > 0 && brands[0].barcode && (
              <div style={{ marginTop: '8px' }}>
                <span className="small muted">{isAr ? 'باركود العلبة المسجل: ' : 'Registered Carton Barcode: '}</span>
                <code style={{ fontSize: '1.05rem', fontWeight: 600 }}>{brands[0].barcode}</code>
              </div>
            )}
          </div>
          <div className="qr-box-preview">
            <QRBlock id={m.id} name={name} />
          </div>
        </div>
      </section>

      {uses && (
        <section className="notice quick">
          <strong>{t('quickSummary')}: </strong>
          {uses}
        </section>
      )}

      <section className="alert urgent">
        <strong>{t('urgentTitle')} </strong>
        {t('urgentText')}
      </section>

      <div className="med-grid">
        <div className="stack">
          {/* Same-Ingredient Equivalents from the 26,562 DAWAYA Database */}
          {dawayaEquivalents.length > 0 && (
            <section className="card highlight-card">
              <h2 style={{ margin: '0 0 8px' }}>
                🔄{' '}
                {isAr
                  ? `البدائل والمثائل التي تحتوي على نفس المادة الفعالة في موسوعة دوايا (${dawayaEquivalents.length})`
                  : `Same Active Ingredient Equivalents in DAWAYA Database (${dawayaEquivalents.length})`}
              </h2>
              <p className="small muted" style={{ marginTop: 0 }}>
                {isAr
                  ? 'مستحضرات مسجلة تحتوي على نفس التركيبة الفعالة مرتبة من الأقل سعراً إلى الأعلى. لا تستبدل أي دواء موصوف دون استشارة الطبيب أو الصيدلي:'
                  : 'Registered preparations sharing the same active ingredient composition sorted by price. Never switch prescribed medication without consulting your pharmacist or doctor:'}
              </p>
              <div className="tablewrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{isAr ? 'الاسم التجاري' : 'Brand Name'}</th>
                      <th>{isAr ? 'التركيز والشكل' : 'Strength & Form'}</th>
                      <th>{isAr ? 'الشركة' : 'Company'}</th>
                      <th>{isAr ? 'السعر المسجل' : 'Price (EGP)'}</th>
                      <th>{isAr ? 'عرض' : 'View'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dawayaEquivalents.map((eq) => (
                      <tr key={eq.i}>
                        <td>
                          <b>{isAr ? eq.a : eq.n}</b>
                          <div className="small muted" dir="ltr">{eq.n}</div>
                        </td>
                        <td>{eq.s || '—'} ({eq.f})</td>
                        <td>{eq.c || '—'}</td>
                        <td>
                          <b style={{ color: '#15803d' }}>
                            {eq.p ? `${eq.p.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                          </b>
                        </td>
                        <td>
                          <Link to={`/medicine/${eq.i}`} className="btn small ghost">
                            {isAr ? 'التفاصيل' : 'Open'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Interactive 3D Mechanism Viewer (for Antibiotic Monographs) */}
          {ingMeta && (
            <Mechanism3DViewer
              medicineId={m.id}
              medicineTitle={pick(m.genericName, lang)}
              scientificName={pick(m.activeIngredients, 'en')}
            />
          )}

          {/* Find This Medication Partner Network Section */}
          <FindMedicationPanel activeIngredientId={m.id} />

          {/* Commercial Packages Table for Antibiotic Monographs */}
          {commercialPackages.length > 0 && (
            <section className="card highlight-card">
              <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0 }}>
                  🇪🇬{' '}
                  {isAr
                    ? `جميع العبوات والمستحضرات المسجلة في السوق المصري (${commercialPackages.length} عبوة)`
                    : `Registered Commercial Packages in Egypt (${commercialPackages.length})`}
                </h2>
                <Link to={`/cost-saver?ing=${encodeURIComponent(m.id)}`} className="btn small" style={{ background: '#0d9488' }}>
                  💰 {tr(lang, 'احسب التوفير والبديل الأرخص ←', 'Calculate Cheapest Generic →')}
                </Link>
              </div>
              <div className="tablewrap" style={{ marginTop: '10px' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{isAr ? 'الاسم التجاري' : 'Trade Name'}</th>
                      <th>{isAr ? 'التركيز والشكل' : 'Strength & Form'}</th>
                      <th>{isAr ? 'العبوة والشركة' : 'Package & Maker'}</th>
                      <th>{isAr ? 'السعر الرسمي' : 'Price (EGP)'}</th>
                      <th>{isAr ? 'الباركود الخطي' : 'Barcode'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commercialPackages.map((pkg) => (
                      <tr key={pkg.productId}>
                        <td>
                          <b>{isAr ? pkg.tradeNameAr : pkg.tradeNameEn}</b>
                          <div className="small muted">{isAr ? pkg.tradeNameEn : pkg.tradeNameAr}</div>
                        </td>
                        <td>
                          <span dir="ltr"><b>{pkg.strength}</b></span>
                          <div className="small muted">{pick(pkg.dosageFormLabel, lang)}</div>
                        </td>
                        <td>
                          <div>{pick(pkg.packDetails, lang)}</div>
                          <div className="small muted">{pkg.manufacturer}</div>
                        </td>
                        <td>
                          <b style={{ color: '#15803d' }}>
                            {pkg.priceEgp ? `${pkg.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                          </b>
                        </td>
                        <td dir="ltr">
                          {pkg.barcode ? <code>{pkg.barcode}</code> : <span className="small muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          
      {/* 4-Question Street-Arabic Simplified Patient Leaflet (مترجم النشرة بالعامية المبسطة) */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(13, 31, 56, 0.04) 0%, rgba(19, 136, 102, 0.08) 100%)',
          borderRadius: '18px',
          border: '1.5px solid #138866',
        }}
      >
        <div className="head" style={{ marginBottom: '10px' }}>
          <div>
            <span className="badge" style={{ background: '#138866', color: '#fff', fontWeight: 800, marginBottom: '6px' }}>
              💡 {isAr ? 'النشرة الدوائية المبسطة لراحة بالك' : 'Simplified Patient Leaflet'}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: '#0D1F38' }}>
              📖 {isAr ? `نشرة (${name}) في 4 إجابات حاسمة بدون تعقيد مصطلحات:` : `Monograph of (${name}) in 4 Simple Answers:`}
            </h2>
          </div>
        </div>

        <div className="grid">
          <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--line)', borderInlineStart: '4px solid #138866' }}>
            <b style={{ color: '#0D1F38', fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
              🎯 1. {isAr ? 'الدواء ده بيعالج إيه بالظبط؟' : '1. What is this medicine used for?'}
            </b>
            <p className="small" style={{ margin: 0 }}>
              {uses || (isAr ? m.approvedUses.ar : m.approvedUses.en)}
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--line)', borderInlineStart: '4px solid #0891b2' }}>
            <b style={{ color: '#0D1F38', fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
              ⏱️ 2. {isAr ? 'آخده إمتى وإزاي؟ (قبل ولا بعد الأكل؟)' : '2. When and how should I take it?'}
            </b>
            <p className="small" style={{ margin: 0 }}>
              {isAr ? m.dosingReference.ar : m.dosingReference.en}
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--line)', borderInlineStart: '4px solid #d97706' }}>
            <b style={{ color: '#b45309', fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
              🔔 3. {isAr ? 'لو نسيت الجرعة.. أتصرف إزاي؟' : '3. What if I miss a dose?'}
            </b>
            <p className="small" style={{ margin: 0 }}>
              {isAr
                ? 'لو تذكرتها قبل موعد الجرعة التالية بعدة ساعات خذها فوراً؛ أما إذا اقترب موعد الجرعة القادمة فتجاهل الجرعة المنسية ولا تضاعف الجرعة نهائياً لتفادي أي تسمم كبدي أو هبوط.'
                : 'Take the missed dose as soon as you remember unless it is almost time for your next scheduled dose. Never double up to make up for a missed dose.'}
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--line)', borderInlineStart: '4px solid #dc2626' }}>
            <b style={{ color: '#991b1b', fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
              ⛔ 4. {isAr ? 'مين في البيت ممنوع يلمس الدواء ده؟' : '4. Who should strictly avoid this medicine?'}
            </b>
            <p className="small" style={{ margin: 0 }}>
              {isAr ? m.contraindications.ar : m.contraindications.en}
            </p>
          </div>
        </div>
      </section>

          {/* All Clinical Monograph Sections (Overview, Active Ingredients, Uses, Warnings, Contraindications, Side Effects, Interactions, Storage, Patient Education) */}
          {displayOrder.filter((f) => FIELD_LABELS[f]).map((f) => {
            const v = pick(m[f], lang);
            if (!v) return null;
            const isHighlight = f === 'priceEgypt' || f === 'substitutes';
            return (
              <section key={f} className={`card ${isHighlight ? 'highlight-card' : ''}`}>
                <h2>
                  {f === 'priceEgypt' && <span>💰 </span>}
                  {f === 'substitutes' && <span>🔄 </span>}
                  {pick(FIELD_LABELS[f], lang)}
                </h2>
                <p className="pre">{v}</p>
                {f === 'dosingReference' && <p className="small muted">{t('dosingNote')}</p>}
              </section>
            );
          })}

          {/* Reference Sources & Verification Date */}
          <section className="card">
            <h2>{t('sources')}</h2>
            {m.sources.length === 0 ? (
              <p className="muted">{t('notEntered')}</p>
            ) : (
              <ul className="srclist">
                {m.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <div className="small muted">
                      {[s.publisher, s.updated && `${t('updated')}: ${s.updated}`, s.accessed && `${t('accessed')}: ${s.accessed}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <Disclaimer />
        </div>
      </div>
      {(addingPkg || editingPkg !== null) && (
        <QuickProductEditorModal
          product={editingPkg}
          defaultIngredientId={m?.id}
          uid={user?.uid}
          onClose={() => {
            setAddingPkg(false);
            setEditingPkg(null);
          }}
        />
      )}
    
        
        {/* Dynamic Occupational Driving & Work Safety Check */}
        {med && (() => {
          const occAlerts = evaluateOccupationalDrugSafety(
            [pick(med.name, 'ar') || '', pick(med.ingredient, 'ar') || '', med.id || ''],
            profile.occupation, profile.factoryEnvironmentHazards, profile.workEnvironmentNotes
          );
          if (occAlerts.length === 0) return null;
          const alert = occAlerts[0];
          return (
            <div
              style={{
                borderRadius: '16px',
                padding: '14px 18px',
                background: '#fef2f2',
                border: '2px solid #ef4444',
                color: '#991b1b',
                margin: '12px 0',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.4rem' }}>🚗⚠️</span>
                <strong style={{ fontSize: '0.98rem' }}>فحص أمان السواقة وطبيعة العمل مع هذا الدواء:</strong>
              </div>
              <p style={{ margin: '4px 0 6px', fontSize: '0.88rem', lineHeight: 1.6, color: '#7f1d1d' }}>
                {alert.warningAr}
              </p>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '6px 10px', borderRadius: '8px' }}>
                💡 <b>النصيحة لعملك:</b> {alert.safeWorkAdviceAr}
              </div>
            </div>
          );
        })()}

        {/* Proactive Universal Dose Reminder for this specific medicine */}
        {med && (
          <SmartMedDoseReminderBadge
            medicineName={pick(med.name, lang)}
            defaultTime="09:00"
            instruction={pick(med.usage, lang) || 'يرجى الالتزام بالموعد المحدد للجرعة'}
          />
        )}

    </main>
  );
}
