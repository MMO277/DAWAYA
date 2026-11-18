import SmartDoseTimeCalibrator from './SmartDoseTimeCalibrator';
import { scheduleMultipleNativeDoseAlarms } from './nativeAlarmService';
import { MedicineDriverAndInjectionBanner } from './egyptianClinicalInnovations';
import { EdaCounterfeitRadarCard } from './edaCounterfeitRadar';
import {
  evaluateMedicationSafety,
  evaluateOccupationalDrugSafety,
  evaluateDrugHydrationRequirement,
  evaluatePillSplittingAndMealProtocol,
  evaluateSuddenStopReboundRisk,
} from './medicationSafetyEngine';
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
import { useSyncedSchedules } from './trackerData';
import { getClinicalProProfile, useClinicalProMode } from './clinicalProData';
import {
  DAWAYA_CATEGORY_LABELS,
  DawayaMedicineRecord,
  dawayaRecordToMedicineMonograph,
  fetchFullDawayaMedicineById,
  findDawayaIndexItemSync,
  getApproximateBatchPriceInfo,
  getDawayaClassifiedAlternatives,
  getDawayaIngredientEquivalents,
  getSmartClinicalRegimenForMedicine,
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

function MedicinePackageStudioCard({
  brandEn,
  brandAr,
  strength,
  dosageForm,
  manufacturer,
  accentColor = '#138866',
}: {
  brandEn: string;
  brandAr: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  accentColor?: string;
}) {
  const formLow = (dosageForm || 'tablet').toLowerCase();
  const shortBrand = (brandEn || brandAr || 'DAWAYA')
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ')
    .slice(0, 16)
    .toUpperCase();
  const shortStr = (strength || '').slice(0, 12);
  const isDevice = /device|strip|first aid|جهاز|شرائط|إسعاف/.test(formLow);
  const isPumpOrWash = /wash|cleanser|shampoo|foam|spray|غسول|شامبو|سبراي/.test(formLow) || /wash|shampoo|غسول|شامبو/i.test(brandEn + ' ' + brandAr);
  const isSyrup = /syrup|susp|sol|oral drop|شراب|معلق|نقط/.test(formLow);
  const isCream = /cream|oint|gel|lotion|topical|sunscreen|كريم|مرهم|جل|دهان|صن/.test(formLow);
  const isInj = /vial|amp|inj|infusion|حقن|أمبول|فيال/.test(formLow);

  return (
    <div
      style={{
        width: '158px',
        minHeight: '142px',
        borderRadius: '18px',
        background: 'linear-gradient(145deg, #f8fafc 0%, #ecfdf5 100%)',
        border: '1.5px solid #cbd5e1',
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        boxShadow: '0 8px 20px rgba(13, 31, 56, 0.08)',
      }}
    >
      <svg width="132" height="104" viewBox="0 0 132 104" fill="none" aria-hidden="true">
        {isDevice ? (
          <>
            <rect x="24" y="14" width="84" height="78" rx="14" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
            <rect x="34" y="24" width="64" height="34" rx="6" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="66" y="42" textAnchor="middle" fill="#0D1F38" fontSize="8.5" fontWeight="900" fontFamily="system-ui, sans-serif">
              {shortBrand.slice(0, 12)}
            </text>
            <text x="66" y="53" textAnchor="middle" fill="#0369a1" fontSize="7.2" fontWeight="800" fontFamily="system-ui, sans-serif">
              {shortStr || 'DIGITAL'}
            </text>
            <circle cx="66" cy="74" r="9" fill={accentColor} />
            <circle cx="66" cy="74" r="4" fill="#ffffff" />
          </>
        ) : isPumpOrWash ? (
          <>
            <path d="M58 10H74V22H58V10Z" fill="#0D1F38" />
            <path d="M66 6H86L92 12" stroke="#0D1F38" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="38" y="22" width="56" height="72" rx="12" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
            <rect x="44" y="36" width="44" height="42" rx="6" fill="#ffffff" />
            <text x="66" y="55" textAnchor="middle" fill="#0D1F38" fontSize="8.2" fontWeight="900" fontFamily="system-ui, sans-serif">
              {shortBrand.slice(0, 11)}
            </text>
            {shortStr && (
              <text x="66" y="67" textAnchor="middle" fill="#0f766e" fontSize="7.2" fontWeight="800" fontFamily="system-ui, sans-serif">
                {shortStr}
              </text>
            )}
          </>
        ) : isSyrup ? (
          <>
            {/* Bottle Cap & Amber Glass Syrup Bottle */}
            <rect x="48" y="8" width="36" height="12" rx="4" fill="#0D1F38" />
            <path
              d="M42 28C42 22.5 46.5 20 52 20H80C85.5 20 90 22.5 90 28V88C90 92.4 86.4 96 82 96H50C45.6 96 42 92.4 42 88V28Z"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="2"
            />
            <rect x="44" y="38" width="44" height="42" rx="4" fill="#ffffff" />
            <rect x="44" y="38" width="44" height="8" rx="2" fill={accentColor} />
            <text x="66" y="57" textAnchor="middle" fill="#0D1F38" fontSize="8.2" fontWeight="900" fontFamily="system-ui, sans-serif">
              {shortBrand.slice(0, 11)}
            </text>
            {shortStr && (
              <text x="66" y="68" textAnchor="middle" fill="#0f766e" fontSize="7.2" fontWeight="800" fontFamily="system-ui, sans-serif">
                {shortStr}
              </text>
            )}
          </>
        ) : isCream ? (
          <>
            {/* Topical Cream Tube */}
            <path d="M24 28H92L84 84H32L24 28Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
            <rect x="24" y="22" width="68" height="8" rx="2" fill={accentColor} />
            <rect x="46" y="84" width="24" height="12" rx="3" fill="#0D1F38" />
            <rect x="30" y="38" width="56" height="10" rx="3" fill={accentColor} fillOpacity="0.16" />
            <text x="58" y="46" textAnchor="middle" fill="#0D1F38" fontSize="8.5" fontWeight="900" fontFamily="system-ui, sans-serif">
              {shortBrand.slice(0, 12)}
            </text>
            {shortStr && (
              <text x="58" y="60" textAnchor="middle" fill="#0f766e" fontSize="7.5" fontWeight="800" fontFamily="system-ui, sans-serif">
                {shortStr}
              </text>
            )}
          </>
        ) : isInj ? (
          <>
            {/* Carton + Glass Vial */}
            <rect x="14" y="18" width="68" height="72" rx="8" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
            <rect x="14" y="18" width="14" height="72" rx="6" fill={accentColor} />
            <text x="53" y="44" textAnchor="middle" fill="#0D1F38" fontSize="8" fontWeight="900" fontFamily="system-ui, sans-serif">
              {shortBrand.slice(0, 10)}
            </text>
            {shortStr && (
              <text x="53" y="56" textAnchor="middle" fill="#0f766e" fontSize="7.2" fontWeight="800" fontFamily="system-ui, sans-serif">
                {shortStr}
              </text>
            )}
            <rect x="92" y="28" width="24" height="10" rx="3" fill="#0284c7" />
            <rect x="88" y="38" width="32" height="52" rx="6" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.8" />
            <rect x="90" y="52" width="28" height="24" rx="2" fill="#ffffff" />
          </>
        ) : (
          <>
            {/* 3D Medicine Carton Box + Silver Blister Pack + Capsules */}
            <rect x="10" y="16" width="84" height="62" rx="8" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.8" />
            <path d="M10 24C10 19.58 13.58 16 18 16H26V78H18C13.58 78 10 74.42 10 70V24Z" fill={accentColor} />
            <rect x="30" y="24" width="56" height="13" rx="3.5" fill="#f1f5f9" />
            <text x="58" y="33.5" textAnchor="middle" fill="#0D1F38" fontSize="8.2" fontWeight="900" fontFamily="system-ui, sans-serif">
              {shortBrand.slice(0, 12)}
            </text>
            {shortStr && (
              <rect x="32" y="42" width="42" height="12" rx="6" fill={accentColor} fillOpacity="0.15" />
            )}
            {shortStr && (
              <text x="53" y="50.5" textAnchor="middle" fill="#065f46" fontSize="7.2" fontWeight="900" fontFamily="system-ui, sans-serif">
                {shortStr}
              </text>
            )}
            <rect x="32" y="60" width="34" height="4" rx="2" fill="#cbd5e1" />
            <rect x="32" y="67" width="24" height="3.5" rx="1.75" fill="#e2e8f0" />

            {/* Blister Strip on Right */}
            <g transform="rotate(6 86 24)">
              <rect x="82" y="22" width="38" height="58" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="93" cy="34" r="4.5" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
              <circle cx="109" cy="34" r="4.5" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
              <circle cx="93" cy="50" r="4.5" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
              <circle cx="109" cy="50" r="4.5" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
              <circle cx="93" cy="66" r="4.5" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
              <circle cx="109" cy="66" r="4.5" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
            </g>

            {/* Foreground Capsule */}
            <g transform="rotate(-12 36 86)">
              <rect x="20" y="80" width="34" height="13" rx="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.4" />
              <path d="M20 86.5C20 82.9 22.9 80 26.5 80H37V93H26.5C22.9 93 20 90.1 20 86.5Z" fill={accentColor} />
            </g>
          </>
        )}
      </svg>
      {manufacturer && (
        <span
          style={{
            fontSize: '0.66rem',
            fontWeight: 800,
            color: '#475569',
            textAlign: 'center',
            maxWidth: '140px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '2px',
          }}
        >
          🏭 {manufacturer}
        </span>
      )}
    </div>
  );
}

export default function MedicinePage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { profile, setProfile } = useSyncedHealthProfile();
  const { schedules, addSchedule } = useSyncedSchedules();
  const { isProMode, setProMode } = useClinicalProMode();
  const { user } = useAuth();
  const { products: liveCatalogProducts } = useLiveDrugCatalog();
  const [editingPkg, setEditingPkg] = useState<EgyptianCommercialProduct | null>(null);
  const [addingPkg, setAddingPkg] = useState(false);
  const [dawayaRecord, setDawayaRecord] = useState<DawayaMedicineRecord | null>(null);
  const [actionToast, setActionToast] = useState<string>('');
  const [calFrequency, setCalFrequency] = useState<string>('');
  const [calDoseTimes, setCalDoseTimes] = useState<string[]>([]);
  const [calDoseText, setCalDoseText] = useState<string>('');
  const [calDurationDays, setCalDurationDays] = useState<number>(7);
  const [activeBottomTab, setActiveBottomTab] = useState<'order_pharmacy' | 'scientific_monograph' | 'authenticity_qr'>('order_pharmacy');

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

  useEffect(() => {
    if (isProMode) {
      setActiveBottomTab('scientific_monograph');
    }
  }, [isProMode]);

  const [m, setM] = useState<Medicine | null | undefined>(() => findLocalMedicine(id) ?? undefined);

  useEffect(() => {
    let active = true;
    setDawayaRecord(null);
    setCalFrequency('');
    setCalDoseTimes([]);
    const localMed = findLocalMedicine(id);
    if (localMed) {
      setM(localMed);
    } else {
      setM(undefined);
    }

    fetchFullDawayaMedicineById(id).then((dRec) => {
      if (!active) return;
      if (dRec) {
        setDawayaRecord(dRec);
        setM((prev) => prev || dawayaRecordToMedicineMonograph(dRec));
      }
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
    return getDawayaIngredientEquivalents(idxItem, 12);
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
                rawName: [
                  dawayaRecord?.brandNameEn,
                  dawayaRecord?.genericName,
                  m.genericName.en,
                  m.activeIngredients.en,
                  m.id,
                ]
                  .filter(Boolean)
                  .join(' '),
                name: dawayaRecord?.brandNameAr || m.genericName.ar || m.id,
                strength: dawayaRecord?.strength,
              },
              ...(schedules || []).map((s) => ({
                id: s.antibioticId || undefined,
                rawName: s.medicineName,
                name: s.medicineName,
                strength: s.prescribedDose,
                sourceType: 'prescription' as const,
              })),
            ],
            healthProfile: profile,
            includeProfileActiveMedications: true,
          })
        : null,
    [m, dawayaRecord, profile, schedules]
  );

  const personalProfileFlagMatches = useMemo(() => {
    if (!dawayaRecord?.warningsFlags || !profile) return [];
    const alerts: string[] = [];
    const conds = (profile.chronicConditions || []).map((c) => (typeof c === 'string' ? c : c?.conditionName || '').toLowerCase());
    if (dawayaRecord.warningsFlags.pregnancy && profile.pregnancyStatus === 'pregnant') {
      alerts.push(isAr ? 'تحذير خاص أثناء الحمل مسجل لهذا الدواء' : 'Pregnancy caution registered for this medication');
    }
    if (dawayaRecord.warningsFlags.lactation && profile.pregnancyStatus === 'breastfeeding') {
      alerts.push(isAr ? 'تحذير خاص أثناء الرضاعة الطبيعية مسجل لهذا الدواء' : 'Breastfeeding caution registered for this medication');
    }
    if (dawayaRecord.warningsFlags.highBloodPressure && conds.some((c) => c.includes('hypertension') || c.includes('ضغط') || c.includes('blood_pressure'))) {
      alerts.push(isAr ? 'قد يؤثر على ضغط الدم المرتفع المسجل في ملفك الصحي' : 'May affect High Blood Pressure in your profile');
    }
    if (dawayaRecord.warningsFlags.diabetes && conds.some((c) => c.includes('diabetes') || c.includes('سكر'))) {
      alerts.push(isAr ? 'يتطلب متابعة خاصة مع مرض السكري المسجل في ملفك الصحي' : 'Requires caution with Diabetes in your profile');
    }
    if (dawayaRecord.warningsFlags.kidney && (profile.renalStatus !== 'normal' || conds.some((c) => c.includes('kidney') || c.includes('renal') || c.includes('كلى')))) {
      alerts.push(isAr ? 'يتطلب ضبط الجرعة أو الحذر مع وظائف الكلى المسجلة بملفك' : 'Requires renal caution based on your profile');
    }
    if (dawayaRecord.warningsFlags.liver && (profile.hepaticStatus !== 'normal' || conds.some((c) => c.includes('liver') || c.includes('hepatic') || c.includes('كبد')))) {
      alerts.push(isAr ? 'يتطلب الحذر مع حالة الكبد المسجلة بملفك الصحي' : 'Requires hepatic caution based on your profile');
    }
    return alerts;
  }, [dawayaRecord, profile, isAr]);

  if (m === undefined && !dawayaRecord) {
    return (
      <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card center" style={{ padding: '32px 20px' }}>
          <b style={{ display: 'block', marginBottom: '6px' }}>
            {isAr ? 'جارٍ تحميل بيانات الدواء والنشرة العلمية...' : 'Loading medicine details...'}
          </b>
          <p className="small muted" style={{ margin: 0 }}>{t('loading')}</p>
        </div>
      </main>
    );
  }

  if (m === null && !dawayaRecord) {
    return (
      <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card stack" style={{ padding: '24px' }}>
          <p>{t('notFound')}</p>
          <Link to="/medicines" className="btn" style={{ alignSelf: 'flex-start' }}>
            {t('navMedicines')}
          </Link>
        </div>
      </main>
    );
  }

  if (!m) return null;

  const approved = m.status === 'approved';
  const brands = approved ? m.brands.filter((b) => b.verified) : m.brands;
  const name = pick(m.genericName, lang);
  const uses = pick(m.approvedUses, lang).split('\n')[0];
  const displayOrder = isProMode ? PRO_ORDER : PATIENT_ORDER;
  const idxItemSync = findDawayaIndexItemSync(id);
  const currentPriceEgp = dawayaRecord?.priceEgp ?? idxItemSync?.p ?? (commercialPackages[0]?.priceEgp || null);

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
            price: currentPriceEgp,
            date: new Date().toISOString().slice(0, 10),
          },
          ...prev.filter((x: { id: string }) => x.id !== id),
        ].slice(0, 30);
        setInWatchlist(true);
        setActionToast(
          isAr
            ? `🔔 تم تفعيل التنبيه! ستتلقى إشعاراً فور رصد توفر (${medTitle}) أو تحديث سعره.`
            : `🔔 Watchlist active! You will be notified when (${medTitle}) is in stock.`
        );
      }
      localStorage.setItem('dawaya_shortage_watchlist_v1', JSON.stringify(next));
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setActionToast(''), 4500);
  };

  const handleAddCurrentMedication = () => {
    const medTitle = dawayaRecord
      ? isAr
        ? dawayaRecord.brandNameAr
        : dawayaRecord.brandNameEn
      : name;
    const reg = getSmartClinicalRegimenForMedicine(dawayaRecord?.brandNameEn || m.genericName.en || medTitle);
    const todayStr = new Date().toISOString().slice(0, 10);
    const doseStr = calDoseText || dawayaRecord?.strength || (isAr ? reg.defaultDoseTextAr : reg.defaultDoseTextEn);
    const freqKey = calFrequency || reg.frequencyKey || 'twice_daily';

    setProfile((prev) => {
      const existingMeds = prev.medications || [];
      const alreadyInMeds = existingMeds.some((x) => x.drugName === medTitle);
      const nextMeds = alreadyInMeds
        ? existingMeds.map((x) => (x.drugName === medTitle ? { ...x, status: 'active' as const } : x))
        : [
            {
              id: `med-${Date.now()}`,
              drugName: medTitle,
              activeIngredients: dawayaRecord?.genericName || m.activeIngredients.en || '',
              prescribedDose: doseStr,
              dosageAndFrequency: doseStr,
              route: reg.route || 'oral',
              frequency: freqKey,
              startDate: todayStr,
              status: 'active' as const,
              indicationOrReason: '',
              isOngoing: true,
              source: 'manual_entry' as const,
              createdAt: new Date().toISOString(),
            },
            ...existingMeds,
          ];

      const existingActive = prev.activeMedications || [];
      const alreadyInActive = existingActive.some((x) => x.resolvedDrugId === m.id || x.drugName === medTitle);
      const nextActive = alreadyInActive
        ? existingActive
        : [
            {
              id: `act-${Date.now()}`,
              drugName: medTitle,
              resolvedDrugId: m.id,
              doseOrStrength: doseStr,
              evidenceStatus: 'patient_reported' as const,
              source: 'manual_entry' as const,
              addedAt: new Date().toISOString(),
            },
            ...existingActive,
          ];

      return {
        ...prev,
        medications: nextMeds,
        activeMedications: nextActive,
      };
    });
    setActionToast(
      isAr
        ? `✅ تمت إضافة (${medTitle}) إلى قائمة أدويتك الحالية في ملفك الصحي ولوحة المريض.`
        : `✅ Added (${medTitle}) to your active medications in Health Profile.`
    );
    window.setTimeout(() => setActionToast(''), 4000);
  };

  const handleActivateCalibratedSchedule = () => {
    const medTitle = dawayaRecord
      ? isAr
        ? dawayaRecord.brandNameAr
        : dawayaRecord.brandNameEn
      : name;
    const reg = getSmartClinicalRegimenForMedicine(dawayaRecord?.brandNameEn || m.genericName.en || medTitle);
    const freqKey = calFrequency || reg.frequencyKey || 'twice_daily';
    const times = calDoseTimes.length > 0 ? calDoseTimes : reg.defaultDoseTimes;
    const doseStr = calDoseText || dawayaRecord?.strength || (isAr ? reg.defaultDoseTextAr : reg.defaultDoseTextEn);
    const dur = calDurationDays || reg.defaultDurationDays || 7;
    const todayStr = new Date().toISOString().slice(0, 10);

    addSchedule(
      {
        antibioticId: m.id,
        medicineName: medTitle,
        prescribedDose: doseStr,
        route: reg.route || 'oral',
        frequency: freqKey,
        durationDays: dur,
        startDate: todayStr,
        firstDoseTime: times[0] || '08:00',
        doseTimes: times,
        verificationStatus: 'verified_by_patient',
        captureMethod: 'manual_entry',
        notes: isAr ? reg.aiReasonAr.replace(/🤖\s*اقتراح الذكاء الدوائي:\s*/g, '') : reg.aiReasonEn,
      },
      'schedule_created_from_prescription'
    );

    void scheduleMultipleNativeDoseAlarms(medTitle, doseStr, times, isAr);
    handleAddCurrentMedication();

    setActionToast(
      isAr
        ? `🔔 تم تفعيل مواعيد (${medTitle}) في جدولك اليومي ومنبه الموبايل (${times.join(' • ')})!`
        : `🔔 Activated daily schedule & alarms for (${medTitle}) at (${times.join(' • ')})!`
    );
    window.setTimeout(() => setActionToast(''), 5000);
  };

  const drugTokens = [
    name || '',
    dawayaRecord?.brandNameAr || '',
    dawayaRecord?.brandNameEn || '',
    dawayaRecord?.genericName || '',
    m.id || '',
  ];
  const hydrationReq = evaluateDrugHydrationRequirement(drugTokens);
  const splitMeal = evaluatePillSplittingAndMealProtocol(drugTokens, dawayaRecord?.dosageForm);
  const reboundAlert = evaluateSuddenStopReboundRisk(drugTokens, dawayaRecord?.therapeuticClass);
  const occAlerts = evaluateOccupationalDrugSafety(
    [
      pick(m.genericName, 'ar') || '',
      pick(m.activeIngredients, 'ar') || '',
      dawayaRecord?.brandNameAr || '',
      dawayaRecord?.genericName || '',
      m.id || '',
    ],
    profile.occupation,
    profile.factoryEnvironmentHazards,
    profile.workEnvironmentNotes
  );

  const findingsList = Array.isArray(safetyAssessment?.findings) ? safetyAssessment!.findings : [];
  const hasSafetyIssues = findingsList.length > 0 || personalProfileFlagMatches.length > 0 || occAlerts.length > 0;
  const combinedSafetyLines: string[] = [
    ...findingsList.map((f) => `${pick(f.title, lang)} — ${pick(f.reason, lang)}`),
    ...personalProfileFlagMatches,
    ...occAlerts.map((oa) => (isAr ? oa.warningAr : oa.warningEn)),
  ];

  const whatsappOrderUrl = `https://wa.me/?text=${encodeURIComponent(
    (() => {
      const arTitle = dawayaRecord?.brandNameAr || idxItemSync?.a || name;
      const enTitle = dawayaRecord?.brandNameEn || idxItemSync?.n || '';
      const str = dawayaRecord?.strength || idxItemSync?.s || '';
      const formRaw = (dawayaRecord?.dosageForm || idxItemSync?.f || '').toLowerCase();
      const formAr =
        formRaw.includes('tab') ? 'أقراص' :
        formRaw.includes('cap') ? 'كبسولات' :
        formRaw.includes('susp') || formRaw.includes('syr') ? 'شراب' :
        formRaw.includes('inj') || formRaw.includes('vial') || formRaw.includes('amp') ? 'حقن / أمبول' :
        formRaw.includes('cream') || formRaw.includes('oint') || formRaw.includes('topical') ? 'دهان موضعي / كريم' :
        formRaw.includes('drop') ? 'نقط / قطرة' : 'عبوة دوائية';
      const area = [profile.districtVillage, profile.cityCenter].filter(Boolean).join(' - ');
      return isAr
        ? `السلام عليكم، أستفسر عن توفر هذا الدواء عبر منصة دوايا:\n💊 الدواء: ${arTitle}${enTitle ? ` (${enTitle})` : ''}\n📦 الشكل والتركيز: ${formAr}${str ? ` (${str})` : ''}${area ? `\n📍 المنطقة / القرية: ${area}` : ''}\nبرجاء إفادتي بتوفره، شكراً لحضرتك.`
        : `Hello, inquiring about availability via DAWAYA:\n💊 Medication: ${enTitle || arTitle}\n📦 Form & Strength: ${str || formRaw}${area ? `\n📍 Area: ${area}` : ''}`;
    })()
  )}`;

  return (
    <main className="wrap stack" style={{ gap: '18px' }}>
      {actionToast && (
        <div
          className="notice"
          style={{
            background: '#101E36',
            color: '#9AE8E8',
            borderColor: '#138866',
            fontWeight: 800,
            borderRadius: '14px',
          }}
        >
          {actionToast}{' '}
          <Link to="/health-profile" style={{ color: '#34d399', marginInlineStart: '8px' }}>
            {isAr ? 'عرض ملفي الصحي ←' : 'Open Health Profile →'}
          </Link>
        </div>
      )}

      {/* Compact Top Bar: Back Link + Patient/Clinician Mode Switch */}
      <div
        className="row wrapRow"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Link
          to="/medicines"
          className="btn small ghost"
          style={{ fontWeight: 800, borderRadius: '999px' }}
        >
          {isAr ? '→ العودة لموسوعة الأدوية' : '← Back to Medicines'}
        </Link>

        <div style={{ display: 'inline-flex', background: 'var(--tint, #f1f5f9)', padding: '4px', borderRadius: '999px', border: '1px solid var(--line, #cbd5e1)' }}>
          <button
            type="button"
            onClick={() => setProMode(false)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              background: !isProMode ? '#138866' : 'transparent',
              color: !isProMode ? '#ffffff' : 'var(--ink, #0D1F38)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            👤 {tr(lang, 'وضع المريض المبسّط', 'Patient View')}
          </button>
          <button
            type="button"
            onClick={() => setProMode(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              background: isProMode ? '#0D1F38' : 'transparent',
              color: isProMode ? '#CFD29D' : 'var(--ink, #0D1F38)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            🩺 {tr(lang, 'وضع الطبيب والصيدلي', 'Clinical Pro View')}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          BLOCK 1: UNIFIED MEDICINE HERO CARD (First Thing the Patient Sees!)
          ══════════════════════════════════════════════════════════════════════════ */}
      <header
        className="card"
        style={{
          borderRadius: '24px',
          border: '2px solid #138866',
          background: 'var(--card-bg, #ffffff)',
          padding: '22px',
          boxShadow: '0 12px 32px rgba(13, 31, 56, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '18px',
          }}
        >
          {/* Left/Start: 3D Package Visual + Title & Metadata */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flex: '1 1 420px', flexWrap: 'wrap' }}>
            <MedicinePackageStudioCard
              brandEn={dawayaRecord?.brandNameEn || idxItemSync?.n || m.genericName.en || name}
              brandAr={dawayaRecord?.brandNameAr || idxItemSync?.a || name}
              strength={dawayaRecord?.strength || idxItemSync?.s}
              dosageForm={dawayaRecord?.dosageForm || idxItemSync?.f}
              manufacturer={dawayaRecord?.manufacturer || idxItemSync?.c}
            />

            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {dawayaRecord && (
                  <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: 800 }}>
                    {DAWAYA_CATEGORY_LABELS[dawayaRecord.therapeuticClass]?.icon}{' '}
                    {isAr
                      ? DAWAYA_CATEGORY_LABELS[dawayaRecord.therapeuticClass]?.ar
                      : DAWAYA_CATEGORY_LABELS[dawayaRecord.therapeuticClass]?.en}
                  </span>
                )}
                {ingMeta && (
                  <span
                    className="badge"
                    style={{
                      background: ingMeta.whoAccessGroup === 'Access' ? '#dcfce7' : ingMeta.whoAccessGroup === 'Reserve' ? '#fee2e2' : '#fef3c7',
                      color: ingMeta.whoAccessGroup === 'Access' ? '#166534' : ingMeta.whoAccessGroup === 'Reserve' ? '#991b1b' : '#92400e',
                      fontWeight: 800,
                    }}
                  >
                    WHO AWaRe: {ingMeta.whoAccessGroup}
                  </span>
                )}
              </div>

              <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(1.35rem, 3vw, 1.85rem)', lineHeight: 1.3, color: 'var(--ink, #0D1F38)' }}>
                {name}
              </h1>
              {dawayaRecord?.brandNameEn && isAr && (
                <div dir="ltr" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f766e', textAlign: 'right', marginBottom: '6px' }}>
                  {dawayaRecord.brandNameEn}
                </div>
              )}
              <p className="small muted" style={{ margin: '0 0 12px', lineHeight: 1.5 }}>
                {uses || pick(m.drugClass, lang)}
              </p>

              {/* 4 Clean Info Pills Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
                  gap: '8px',
                }}
              >
                <div style={{ background: 'var(--tint, #f8fafc)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--line, #e2e8f0)' }}>
                  <span className="small muted" style={{ display: 'block', fontSize: '0.72rem' }}>
                    🧪 {isAr ? 'المادة الفعالة:' : 'Active Ingredient:'}
                  </span>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--ink, #0D1F38)', wordBreak: 'break-word' }}>
                    {dawayaRecord?.genericName || idxItemSync?.g || pick(m.activeIngredients, lang) || '—'}
                  </strong>
                </div>

                <div style={{ background: 'var(--tint, #f8fafc)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--line, #e2e8f0)' }}>
                  <span className="small muted" style={{ display: 'block', fontSize: '0.72rem' }}>
                    💊 {isAr ? 'التركيز والشكل:' : 'Strength & Form:'}
                  </span>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--ink, #0D1F38)' }}>
                    {[dawayaRecord?.strength || idxItemSync?.s, dawayaRecord?.dosageForm || idxItemSync?.f].filter(Boolean).join(' • ') || 'عبوة قياسية'}
                  </strong>
                </div>

                <div style={{ background: 'var(--tint, #f8fafc)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--line, #e2e8f0)' }}>
                  <span className="small muted" style={{ display: 'block', fontSize: '0.72rem' }}>
                    🏭 {isAr ? 'الشركة المصنعة:' : 'Manufacturer:'}
                  </span>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--ink, #0D1F38)' }}>
                    {dawayaRecord?.manufacturer || idxItemSync?.c || (brands[0]?.brandName ? pick(brands[0].brandName, lang) : 'معتمد بوزارة الصحة')}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right/End: Prominent Official Price & Quick Savings Callout */}
          <div
            style={{
              background: 'linear-gradient(145deg, #0D1F38 0%, #138866 100%)',
              color: '#ffffff',
              borderRadius: '18px',
              padding: '16px 20px',
              minWidth: '205px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px',
              boxShadow: '0 8px 22px rgba(19, 136, 102, 0.24)',
            }}
          >
            {(() => {
              const pInfo = idxItemSync ? getApproximateBatchPriceInfo(idxItemSync) : null;
              const minB = pInfo?.minBatch;
              const maxB = pInfo?.maxBatch;
              return (
                <>
                  <span style={{ fontSize: '0.74rem', color: '#CFD29D', fontWeight: 800 }}>
                    💰 {isAr ? 'السعر التقريبي في الصيدليات' : 'Approx. Pharmacy Price'}
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
                    {currentPriceEgp
                      ? `~ ${currentPriceEgp.toFixed(0)} ${isAr ? 'ج.م' : 'EGP'}`
                      : isAr
                      ? 'حسب العبوة'
                      : 'See Packages'}
                  </div>
                  {minB && maxB && minB < maxB && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: '#ecfdf5',
                        background: 'rgba(255,255,255,0.14)',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        fontWeight: 700,
                      }}
                    >
                      {isAr ? `التشغيلات: ${minB} – ${maxB} ج.م` : `Batches: ${minB}–${maxB} EGP`}
                    </div>
                  )}
                  <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.82)', marginTop: '2px', lineHeight: 1.3 }}>
                    {isAr ? 'قد يختلف قليلاً حسب تاريخ تشغيلة العبوة' : 'May vary slightly by batch date'}
                  </div>
                </>
              );
            })()}
            {cheapestBioequivalent && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('dawaya-alternatives-box');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  marginTop: '6px',
                  background: '#CFD29D',
                  color: '#0D1F38',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '5px 12px',
                  fontSize: '0.76rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                💡 {isAr ? `متاح بديل أرخص بـ ${cheapestBioequivalent.savedEgp.toFixed(0)} ج.م ↓` : `Save ${cheapestBioequivalent.savedEgp.toFixed(0)} EGP ↓`}
              </button>
            )}
          </div>
        </div>

        {/* Single Unified Personal Safety Strip (No duplicate cards!) */}
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: hasSafetyIssues ? '#fef2f2' : '#f0fdf4',
            border: hasSafetyIssues ? '1.5px solid #ef4444' : '1.5px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
            <span style={{ fontSize: '1.3rem' }}>{hasSafetyIssues ? '⚠️' : '✅'}</span>
            <div>
              <strong style={{ color: hasSafetyIssues ? '#991b1b' : '#065f46', fontSize: '0.92rem', display: 'block' }}>
                {hasSafetyIssues
                  ? isAr
                    ? 'تنبيه أمان دوائي مع ملفك الصحي أو أدويتك المسجلة:'
                    : 'Safety Alert Detected with Your Saved Health Profile:'
                  : isAr
                  ? 'فحص الأمان مع ملفك الصحي: لا يوجد تعارض مع أدويتك أو حساسيتك المسجلة'
                  : 'Safety Check: Safe with your saved medications and allergies'}
              </strong>
              {hasSafetyIssues && combinedSafetyLines.length > 0 ? (
                <ul style={{ margin: '4px 0 0', paddingInlineStart: '18px', color: '#991b1b', fontSize: '0.82rem', fontWeight: 700 }}>
                  {combinedSafetyLines.slice(0, 3).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : (
                <span className="small muted">
                  {isAr
                    ? 'يتم فحص أي دواء تفتحه تلقائياً مع حساسيتك وأدويتك وحالتك الصحية وطبيعة عملك.'
                    : 'Automatically screened against your recorded allergies, active meds, and occupation.'}
                </span>
              )}
            </div>
          </div>
          <Link
            to="/health-profile"
            className="btn small ghost"
            style={{
              borderRadius: '999px',
              borderColor: hasSafetyIssues ? '#dc2626' : '#059669',
              color: hasSafetyIssues ? '#991b1b' : '#065f46',
              fontWeight: 800,
            }}
          >
            {isAr ? 'ملفي الصحي ←' : 'My Profile →'}
          </Link>
        </div>

        {/* Streamlined Primary Action Bar */}
        <div
          style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <button
            type="button"
            className="btn small"
            style={{ background: '#0D1F38', borderColor: '#0D1F38', color: '#ffffff', fontWeight: 900 }}
            onClick={handleAddCurrentMedication}
          >
            ➕ {isAr ? 'أضف لأدويتي الحالية' : 'Add to My Medications'}
          </button>

          <button
            type="button"
            className="btn small"
            style={{ background: '#138866', borderColor: '#138866', color: '#ffffff', fontWeight: 900 }}
            onClick={() => {
              const el = document.getElementById('dawaya-dose-calibrator-box');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            ⏰ {isAr ? 'ضبط مواعيد الجرعات والمنبه' : 'Calibrate Dose Schedule'}
          </button>

          {dawayaEquivalents.length > 0 && (
            <button
              type="button"
              className="btn small ghost"
              style={{ borderColor: '#138866', color: '#0f766e', fontWeight: 900 }}
              onClick={() => {
                const el = document.getElementById('dawaya-alternatives-box');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              🔄 {isAr ? `البدائل والمثائل (${dawayaEquivalents.length})` : `Alternatives (${dawayaEquivalents.length})`}
            </button>
          )}

          <a
            href={whatsappOrderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn small"
            style={{ background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', fontWeight: 900 }}
          >
            💬 {isAr ? 'اطلب عبر واتساب' : 'Order via WhatsApp'}
          </a>

          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              setActiveBottomTab('order_pharmacy');
              window.setTimeout(() => {
                const el = document.getElementById('dawaya-bottom-tabs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
          >
            🛵 {isAr ? 'اطلب من صيدلية قريبة' : 'Find Nearby Pharmacy'}
          </button>

          <button
            type="button"
            className="btn small ghost"
            onClick={handleToggleWatchlist}
            style={inWatchlist ? { background: '#138866', color: '#fff', borderColor: '#138866' } : { borderColor: '#d97706', color: '#b45309' }}
          >
            {inWatchlist ? '🔔 ' + (isAr ? 'قيد المتابعة ✓' : 'Watching ✓') : '🔔 ' + (isAr ? 'أبلغني عند التوفر' : 'Notify If Available')}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════
          BLOCK 2: DEDICATED ALTERNATIVES & BIOEQUIVALENT GENERICS BOX
          ══════════════════════════════════════════════════════════════════════════ */}
      {(dawayaEquivalents.length > 0 || commercialPackages.length > 0) && (
        <section
          id="dawaya-alternatives-box"
          className="card"
          style={{
            scrollMarginTop: '80px',
            borderRadius: '24px',
            border: '2px solid #0d9488',
            background: 'linear-gradient(180deg, #ffffff 0%, #f0fdfa 100%)',
            padding: '22px',
            boxShadow: '0 10px 28px rgba(13, 148, 136, 0.1)',
          }}
        >
          {/* Header of Alternatives Box */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  background: '#ccfbf1',
                  color: '#0f766e',
                  border: '1px solid #5eead4',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.76rem',
                  fontWeight: 900,
                  marginBottom: '6px',
                }}
              >
                🔄 {isAr ? 'مربع البدائل والمثائل المعتمدة بنفس المادة الفعالة' : 'Verified Same-Ingredient Equivalents & Generics'}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.28rem', color: '#0D1F38', fontWeight: 900 }}>
                {isAr
                  ? `البدائل والمثائل المتطابقة لـ (${name}) في السوق المصري`
                  : `Bioequivalent Generics & Alternatives for (${name})`}
              </h2>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'جميع الأدوية في هذا المربع تحتوي على نفس المادة الفعالة ومرتبة من الأقل سعراً لتوفير فاتورة العلاج (استشر الصيدلي عند الاستبدال):'
                  : 'All medicines below contain the exact same active ingredient sorted by lowest price:'}
              </p>
            </div>

            <Link
              to={`/cost-saver?q=${encodeURIComponent(dawayaRecord?.brandNameEn || name)}`}
              className="btn small"
              style={{
                background: '#0D1F38',
                color: '#CFD29D',
                borderRadius: '12px',
                fontWeight: 900,
                whiteSpace: 'nowrap',
              }}
            >
              💰 {isAr ? 'مقارنة الروشتة الكاملة في حاسبة التوفير ←' : 'Open Full Cost Saver →'}
            </Link>
          </div>

          {/* Cheapest Bioequivalent Spotlight Banner inside the Box */}
          {cheapestBioequivalent && (
            <div
              style={{
                background: 'linear-gradient(135deg, #0D1F38 0%, #065f46 100%)',
                color: '#ffffff',
                borderRadius: '18px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                border: '1.5px solid #34d399',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#CFD29D',
                    color: '#0D1F38',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  🏆
                </span>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 800 }}>
                    {isAr
                      ? `أرخص مثيل مطابق 100% — يوفر لك ${cheapestBioequivalent.savedEgp.toFixed(2)} ج.م (${cheapestBioequivalent.savedPct}%)`
                      : `Best Value Equivalent — Save ${cheapestBioequivalent.savedEgp.toFixed(2)} EGP (${cheapestBioequivalent.savedPct}%)`}
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: '#ffffff', display: 'block' }}>
                    {isAr ? cheapestBioequivalent.item.a || cheapestBioequivalent.item.n : cheapestBioequivalent.item.n}{' '}
                    <span style={{ color: '#CFD29D', fontSize: '0.9rem' }}>
                      ({cheapestBioequivalent.item.p?.toFixed(2)} {isAr ? 'ج.م' : 'EGP'} بدلاً من {cheapestBioequivalent.currentPrice.toFixed(2)} {isAr ? 'ج.م' : 'EGP'})
                    </span>
                  </strong>
                </div>
              </div>
              <Link
                to={`/medicine/${cheapestBioequivalent.item.i}`}
                className="btn small"
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: 900,
                }}
              >
                {isAr ? 'فتح صفحة المثيل الأرخص ←' : 'View Cheapest Generic →'}
              </Link>
            </div>
          )}

          {/* Sleek Card Grid of Alternatives */}
          {dawayaEquivalents.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))',
                gap: '12px',
              }}
            >
              {dawayaEquivalents.map((eq, idx) => {
                const isCheaper =
                  currentPriceEgp && eq.p && eq.p < currentPriceEgp - 0.5;
                const savedAmount =
                  isCheaper && currentPriceEgp && eq.p ? currentPriceEgp - eq.p : 0;
                const savedPercent =
                  savedAmount > 0 && currentPriceEgp
                    ? Math.round((savedAmount / currentPriceEgp) * 100)
                    : 0;

                return (
                  <div
                    key={eq.i}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: idx === 0 && isCheaper ? '2px solid #10b981' : '1.5px solid #cbd5e1',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                      boxShadow: '0 4px 12px rgba(13, 31, 56, 0.04)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            padding: '2px 9px',
                            borderRadius: '999px',
                            background: isCheaper ? '#dcfce7' : '#f1f5f9',
                            color: isCheaper ? '#166534' : '#475569',
                            border: isCheaper ? '1px solid #86efac' : '1px solid #cbd5e1',
                          }}
                        >
                          {isCheaper
                            ? isAr
                              ? `💚 أوفر بـ ${savedAmount.toFixed(0)} ج.م (${savedPercent}%)`
                              : `Save ${savedPercent}%`
                            : isAr
                            ? '💊 مثيل بنفس المادة الفعالة'
                            : 'Same Active Ingredient'}
                        </span>

                        <span
                          style={{
                            background: '#0D1F38',
                            color: '#CFD29D',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {eq.p ? `${eq.p.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                        </span>
                      </div>

                      <strong style={{ fontSize: '1rem', color: '#0D1F38', display: 'block', lineHeight: 1.35 }}>
                        {isAr ? eq.a || eq.n : eq.n}
                      </strong>
                      <div dir="ltr" style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 700, textAlign: isAr ? 'right' : 'left' }}>
                        {eq.n}
                      </div>

                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.76rem', color: '#475569', fontWeight: 700 }}>
                        {eq.s && (
                          <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            ⚖️ {eq.s}
                          </span>
                        )}
                        {eq.f && (
                          <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            📦 {eq.f}
                          </span>
                        )}
                        {eq.c && (
                          <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            🏭 {eq.c}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                      <Link
                        to={`/medicine/${eq.i}`}
                        className="btn small"
                        style={{
                          flex: 1,
                          background: '#138866',
                          borderColor: '#138866',
                          color: '#ffffff',
                          fontWeight: 800,
                          textAlign: 'center',
                          borderRadius: '10px',
                          padding: '6px 10px',
                        }}
                      >
                        {isAr ? 'عرض البديل ←' : 'View Generic →'}
                      </Link>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          isAr
                            ? `السلام عليكم، أستفسر عن توفر الدواء البديل: ${eq.a || eq.n} (${eq.n}) تركيز ${eq.s || ''}`
                            : `Inquiring about generic alternative: ${eq.n} (${eq.s || ''})`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn small ghost"
                        style={{
                          borderRadius: '10px',
                          padding: '6px 10px',
                          borderColor: '#16a34a',
                          color: '#15803d',
                          fontWeight: 800,
                        }}
                        title={isAr ? 'اطلب هذا البديل عبر واتساب' : 'Order via WhatsApp'}
                      >
                        💬
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))',
                gap: '12px',
              }}
            >
              {commercialPackages.map((pkg) => (
                <div
                  key={pkg.productId}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px solid #cbd5e1',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="small muted">{pkg.manufacturer}</span>
                      <span style={{ background: '#0D1F38', color: '#CFD29D', padding: '2px 9px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 900 }}>
                        {pkg.priceEgp ? `${pkg.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.98rem', color: '#0D1F38', display: 'block' }}>
                      {isAr ? pkg.tradeNameAr : pkg.tradeNameEn}
                    </strong>
                    <div className="small muted">
                      {pkg.strength} • {pick(pkg.dosageFormLabel, lang)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          BLOCK 3: SIMPLIFIED PATIENT GUIDE + PILL/MEAL/WATER RULES + 7 CONDITIONS
          ══════════════════════════════════════════════════════════════════════════ */}
      <section
        className="card stack"
        style={{
          borderRadius: '22px',
          border: '1.5px solid #cbd5e1',
          padding: '22px',
          gap: '16px',
        }}
      >
        <div>
          <span className="badge" style={{ background: '#138866', color: '#fff', fontWeight: 800, marginBottom: '6px' }}>
            📖 {isAr ? 'الخلاصة الطبية المبسطة للمريض' : 'Simplified Patient Guide'}
          </span>
          <h2 style={{ margin: 0, fontSize: '1.22rem', color: 'var(--ink, #0D1F38)' }}>
            {isAr ? `كل ما يهمك عن (${name}) في 4 نقاط واضحة:` : `Essential Guide for (${name}) in 4 Simple Points:`}
          </h2>
        </div>

        {/* 4 Simple Answers Grid */}
        <div className="grid">
          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--tint, #f8fafc)', border: '1px solid var(--line, #e2e8f0)', borderInlineStart: '4px solid #138866' }}>
            <b style={{ color: 'var(--ink, #0D1F38)', fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
              🎯 1. {isAr ? 'الدواء ده بيعالج إيه بالظبط؟' : '1. What is this medicine used for?'}
            </b>
            <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>
              {uses || (isAr ? m.approvedUses.ar : m.approvedUses.en)}
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--tint, #f8fafc)', border: '1px solid var(--line, #e2e8f0)', borderInlineStart: '4px solid #0284c7' }}>
            <b style={{ color: 'var(--ink, #0D1F38)', fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
              ⏱️ 2. {isAr ? 'آخده إمتى وإزاي؟ (قبل ولا بعد الأكل؟)' : '2. When and how should I take it?'}
            </b>
            <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>
              {isAr ? splitMeal.mealTitleAr : splitMeal.mealTitleEn} — {isAr ? m.dosingReference.ar : m.dosingReference.en}
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--tint, #f8fafc)', border: '1px solid var(--line, #e2e8f0)', borderInlineStart: '4px solid #d97706' }}>
            <b style={{ color: '#b45309', fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
              🔔 3. {isAr ? 'لو نسيت الجرعة.. أتصرف إزاي؟' : '3. What if I miss a dose?'}
            </b>
            <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>
              {isAr
                ? 'لو تذكرتها قبل موعد الجرعة التالية بعدة ساعات خذها فوراً؛ أما إذا اقترب موعد الجرعة القادمة فتجاوز المنسية ولا تضاعف الجرعة أبداً.'
                : 'Take as soon as you remember unless your next dose is near. Never double the dose.'}
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--tint, #f8fafc)', border: '1px solid var(--line, #e2e8f0)', borderInlineStart: '4px solid #dc2626' }}>
            <b style={{ color: '#991b1b', fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
              ⛔ 4. {isAr ? 'موانع الاستخدام والتحذيرات الهامة:' : '4. Who should avoid this medicine?'}
            </b>
            <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>
              {isAr ? m.contraindications.ar : m.contraindications.en}
            </p>
          </div>
        </div>

        {/* Compact Administration & Precautions Strip (Pill Splitting + Hydration + Rebound) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              background: splitMeal.splittingStatus === 'forbidden_sr_ec' || splitMeal.splittingStatus === 'capsule_no_open' ? '#fef2f2' : '#f0fdf4',
              border: splitMeal.splittingStatus === 'forbidden_sr_ec' || splitMeal.splittingStatus === 'capsule_no_open' ? '1px solid #fca5a5' : '1px solid #86efac',
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0f766e', marginBottom: '2px' }}>
              💊 {splitMeal.splittingBadgeAr}
            </div>
            <strong style={{ fontSize: '0.88rem', color: '#0D1F38', display: 'block' }}>
              {isAr ? splitMeal.splittingTitleAr : splitMeal.splittingTitleEn}
            </strong>
            <span className="small muted">{isAr ? splitMeal.splittingReasonAr : splitMeal.splittingReasonEn}</span>
          </div>

          {hydrationReq && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0369a1', marginBottom: '2px' }}>
                💧 {isAr ? 'إرشاد شرب الماء مع الجرعة' : 'Hydration Rule'}
              </div>
              <strong style={{ fontSize: '0.88rem', color: '#0D1F38', display: 'block' }}>
                {isAr ? hydrationReq.titleAr : hydrationReq.titleEn}
              </strong>
              <span className="small muted">{isAr ? hydrationReq.reasonAr : hydrationReq.reasonEn}</span>
            </div>
          )}

          {reboundAlert && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#b45309', marginBottom: '2px' }}>
                ⚠️ {reboundAlert.badgeAr}
              </div>
              <strong style={{ fontSize: '0.88rem', color: '#92400e', display: 'block' }}>
                {isAr ? reboundAlert.categoryTitleAr : reboundAlert.categoryTitleEn}
              </strong>
              <span className="small muted">{isAr ? reboundAlert.safeDiscontinuationAr : reboundAlert.safeDiscontinuationEn}</span>
            </div>
          )}
        </div>

        <MedicineDriverAndInjectionBanner
          medicineNameAr={dawayaRecord?.brandNameAr || name}
          medicineNameEn={dawayaRecord?.brandNameEn || m.genericName.en || name}
          genericName={dawayaRecord?.genericName || m.activeIngredients.en}
          dosageForm={dawayaRecord?.dosageForm}
          isAr={isAr}
        />

        {/* Compact 7-Condition Warning Matrix */}
        {dawayaRecord && (
          <div style={{ paddingTop: '10px', borderTop: '1px solid var(--line, #e2e8f0)' }}>
            <strong style={{ fontSize: '0.92rem', color: 'var(--ink, #0D1F38)', display: 'block', marginBottom: '8px' }}>
              🛡️ {isAr ? 'موقف الدواء مع الحالات الصحية الـ 7 الخاصة:' : '7-Condition Clinical Precautions:'}
            </strong>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
              }}
            >
              {[
                { key: 'pregnancy', icon: '🤰', ar: 'الحمل', en: 'Pregnancy', flag: dawayaRecord.warningsFlags.pregnancy },
                { key: 'lactation', icon: '🤱', ar: 'الرضاعة', en: 'Lactation', flag: dawayaRecord.warningsFlags.lactation },
                { key: 'bp', icon: '🩺', ar: 'ضغط الدم', en: 'Blood Pressure', flag: dawayaRecord.warningsFlags.highBloodPressure },
                { key: 'dm', icon: '🩸', ar: 'السكري', en: 'Diabetes', flag: dawayaRecord.warningsFlags.diabetes },
                { key: 'heart', icon: '❤️', ar: 'القلب', en: 'Heart', flag: dawayaRecord.warningsFlags.heart },
                { key: 'kidney', icon: '🫘', ar: 'الكلى', en: 'Kidney', flag: dawayaRecord.warningsFlags.kidney },
                { key: 'liver', icon: '🧪', ar: 'الكبد', en: 'Liver', flag: dawayaRecord.warningsFlags.liver },
              ].map((w) => (
                <div
                  key={w.key}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: w.flag ? 'rgba(220, 38, 38, 0.08)' : 'var(--tint, #f8fafc)',
                    border: w.flag ? '1.5px solid #ef4444' : '1px solid var(--line, #e2e8f0)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>{w.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{isAr ? w.ar : w.en}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: w.flag ? '#dc2626' : '#059669' }}>
                      {w.flag ? (isAr ? '⚠️ بحذر طبي' : '⚠️ Caution') : isAr ? 'آمن قياسياً' : 'Standard'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          BLOCK 4: INTERACTIVE DOSE & CLOCK TIME CALIBRATOR
          ══════════════════════════════════════════════════════════════════════════ */}
      <section
        id="dawaya-dose-calibrator-box"
        className="card"
        style={{
          scrollMarginTop: '80px',
          borderRadius: '20px',
          border: '1.5px solid #138866',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
          padding: '18px 20px',
        }}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div>
            <strong style={{ color: '#0D1F38', fontSize: '1.05rem', display: 'block' }}>
              ⏰ {isAr ? `معايرة مواعيد جرعات (${name}) وتفعيل المنبه اليومي` : `Calibrate Dose Schedule & Alarms for (${name})`}
            </strong>
            <span className="small muted">
              {isAr
                ? 'اختر عدد المرات في اليوم وعدّل ساعات التنبيه لتفعيلها في جدولك ومنبه الموبايل بضغطة واحدة:'
                : 'Select how many times per day you take this medicine and customize your exact clock hours:'}
            </span>
          </div>
          <button
            type="button"
            className="btn small"
            style={{
              background: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
              color: '#ffffff',
              fontWeight: 900,
              borderRadius: '12px',
              border: 'none',
            }}
            onClick={() => handleActivateCalibratedSchedule()}
          >
            🔔 {isAr ? 'حفظ وتفعيل المواعيد في جدولي' : 'Save & Activate Schedule'}
          </button>
        </div>

        <SmartDoseTimeCalibrator
          medicineName={dawayaRecord?.brandNameEn || m.genericName.en || name}
          frequency={calFrequency}
          doseTimes={calDoseTimes}
          isAr={isAr}
          onChange={(nextFreq, nextTimes, suggestedDose, suggestedDur) => {
            setCalFrequency(nextFreq);
            setCalDoseTimes(nextTimes);
            if (suggestedDose && !calDoseText) setCalDoseText(suggestedDose);
            if (suggestedDur) setCalDurationDays(suggestedDur);
          }}
        />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          BLOCK 5: ORGANIZED 3-TAB SECTION FOR PHARMACY ORDER, SCIENTIFIC LEAFLET & QR
          ══════════════════════════════════════════════════════════════════════════ */}
      <section
        id="dawaya-bottom-tabs-section"
        className="card stack"
        style={{
          scrollMarginTop: '80px',
          borderRadius: '22px',
          padding: '20px',
          gap: '16px',
        }}
      >
        <div
          role="tablist"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px',
            background: 'var(--tint, #f1f5f9)',
            padding: '6px',
            borderRadius: '16px',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === 'order_pharmacy'}
            onClick={() => setActiveBottomTab('order_pharmacy')}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeBottomTab === 'order_pharmacy' ? '#0D1F38' : 'transparent',
              color: activeBottomTab === 'order_pharmacy' ? '#ffffff' : 'var(--ink, #0D1F38)',
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            🛵 {isAr ? 'طلب الدواء من الصيدليات' : 'Order from Pharmacies'}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === 'scientific_monograph'}
            onClick={() => setActiveBottomTab('scientific_monograph')}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeBottomTab === 'scientific_monograph' ? '#0D1F38' : 'transparent',
              color: activeBottomTab === 'scientific_monograph' ? '#ffffff' : 'var(--ink, #0D1F38)',
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            🩺 {isAr ? 'النشرة العلمية الكاملة والمصادر' : 'Full Scientific Monograph'}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === 'authenticity_qr'}
            onClick={() => setActiveBottomTab('authenticity_qr')}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeBottomTab === 'authenticity_qr' ? '#0D1F38' : 'transparent',
              color: activeBottomTab === 'authenticity_qr' ? '#ffffff' : 'var(--ink, #0D1F38)',
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            🛡️ {isAr ? 'فحص العلبة الأصلية ورمز QR' : 'Authenticity & QR Code'}
          </button>
        </div>

        {activeBottomTab === 'order_pharmacy' && (
          <div id="dawaya-order-from-pharmacy-section">
            <FindMedicationPanel activeIngredientId={m.id} />
          </div>
        )}

        {activeBottomTab === 'scientific_monograph' && (
          <div className="stack" style={{ gap: '14px' }}>
            {clinicalPro && (
              <div className="clinical-pro-panel" style={{ padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                <div className="clinical-pro-header">
                  <div>
                    <span className="clinical-pro-kicker">
                      🩺 {tr(lang, 'مرجع الأطباء والصيادلة الإكلينيكي', 'Physician & Clinical Pharmacist Reference')}
                    </span>
                    <h3 style={{ margin: '4px 0 0' }}>
                      {tr(
                        lang,
                        `الخصائص الفارماكولوجية الدقيقة (${name})`,
                        `Clinical Pharmacology & PK/PD (${name})`
                      )}
                    </h3>
                  </div>
                  {ingMeta && <code className="clinical-atc-pill">ATC: {ingMeta.atcCode}</code>}
                </div>

                <div className="clinical-pkpd-grid" style={{ marginTop: '10px' }}>
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
              </div>
            )}

            {ingMeta && (
              <Mechanism3DViewer
                medicineId={m.id}
                medicineTitle={pick(m.genericName, lang)}
                scientificName={pick(m.activeIngredients, 'en')}
              />
            )}

            {displayOrder.filter((f) => FIELD_LABELS[f]).map((f) => {
              const v = pick(m[f], lang);
              if (!v) return null;
              return (
                <div
                  key={f}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'var(--tint, #f8fafc)',
                    border: '1px solid var(--line, #e2e8f0)',
                  }}
                >
                  <h3 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--ink, #0D1F38)' }}>
                    {pick(FIELD_LABELS[f], lang)}
                  </h3>
                  <p className="pre" style={{ margin: 0, fontSize: '0.9rem' }}>{v}</p>
                </div>
              );
            })}

            <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--tint, #f8fafc)', border: '1px solid var(--line, #e2e8f0)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>{t('sources')}</h3>
              {m.sources.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>{t('notEntered')}</p>
              ) : (
                <ul className="srclist" style={{ margin: 0 }}>
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
              <div className="meta" style={{ marginTop: '10px' }}>
                <StatusBadge status={m.status} />
                <span>
                  {t('lastReviewed')}: <b>{m.lastReviewed || '2026-10-14'}</b>
                </span>
              </div>
            </div>
          </div>
        )}

        {activeBottomTab === 'authenticity_qr' && (
          <div className="stack" style={{ gap: '14px' }}>
            <EdaCounterfeitRadarCard
              medicineNameAr={dawayaRecord?.brandNameAr || name}
              medicineNameEn={dawayaRecord?.brandNameEn || m.genericName.en || name}
              genericName={dawayaRecord?.genericName || m.activeIngredients.en}
              officialBarcode={dawayaRecord?.barcode}
              isAr={isAr}
            />

            <div className="qr-top-flex" style={{ padding: '16px', borderRadius: '16px', background: 'var(--tint, #f8fafc)', border: '1px solid var(--line, #e2e8f0)' }}>
              <div>
                <h3 style={{ margin: '0 0 6px' }}>📱 {isAr ? 'رمز QR للمشاركة وباركود العلبة المعتمد' : 'Medicine QR & Official Barcode'}</h3>
                <p className="small muted" style={{ margin: 0 }}>
                  {isAr
                    ? 'امسح رمز QR لفتح ومشاركة صفحة الدواء على هاتفك فوراً، أو استخدم صفحة «مسح الباركود» لمطابقة العلبة.'
                    : 'Scan this QR code to view and share this medicine page.'}
                </p>
                {(dawayaRecord?.barcode || (brands.length > 0 && brands[0].barcode)) && (
                  <div style={{ marginTop: '8px' }}>
                    <span className="small muted">{isAr ? 'باركود العلبة المسجل: ' : 'Registered Carton Barcode: '}</span>
                    <code style={{ fontSize: '1.05rem', fontWeight: 700 }}>{dawayaRecord?.barcode || brands[0].barcode}</code>
                  </div>
                )}
              </div>
              <div className="qr-box-preview">
                <QRBlock id={m.id} name={name} />
              </div>
            </div>
          </div>
        )}
      </section>

      <Disclaimer />

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
    </main>
  );
}
