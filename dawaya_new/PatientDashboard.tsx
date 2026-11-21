import { DriverDrugTestShieldCard } from './egyptianClinicalInnovations';
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import {
  MedicalDocumentCategory,
  MedicalDocumentRecord,
  MedicationRecord,
  useSyncedHealthProfile,
} from './allergyData';
import {
  calculateAutoDoseTimes,
  calculateScheduleProgress,
  computeEndDate,
  downloadScheduleIcs,
  formatFrequencyLabel,
  formatLocalDateYYYYMMDD,
  formatRouteLabel,
  formatTime12Hour,
  formatTimestampReadable,
  generateScheduleDoses,
  getDoseStatus,
  SavedPrescription,
  TreatmentSchedule,
  useSyncedSchedules,
} from './trackerData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import {
  DAWAYA_CATEGORY_LABELS,
  getSmartClinicalRegimenForMedicine,
  matchMedicationCandidatesFromDatabase,
  MedicationDatabaseMatchCandidate,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import {
  analyzeUploadedMedicalDocument,
  compressMultipleMedicalFiles,
  ProcessedMedicalDocumentAnalysis,
  uploadMedicalDocumentToStorage,
  validateMedicalUploadFile,
} from './aiDocumentProcessor';
import { SmartNativeSelect } from './SmartChoiceSelect';
import SmartDoseTimeCalibrator from './SmartDoseTimeCalibrator';
import DawayaLogo from './DawayaLogo';
import Disclaimer from './Disclaimer';
import { tr } from './types';

type HubTabKey =
  | 'upload_rx'
  | 'upload_leaflet'
  | 'my_meds'
  | 'med_schedule'
  | 'med_history'
  | 'ai_assistant';

export default function PatientDashboard() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { profile, setProfile, syncing } = useSyncedHealthProfile();
  const {
    schedules,
    setSchedules,
    setScheduleTrackingStatus,
    updateDoseStatus,
    prescriptions,
    setPrescriptions,
    treatmentEvents,
    syncStatus,
    lastSyncedAt,
  } = useSyncedSchedules();
  const { indexItems, totalCount, loaded } = useDawayaDrugDatabase();

  const [quickSearch, setQuickSearch] = useState('');
  const [activeHubTab, setActiveHubTab] = useState<HubTabKey>('upload_rx');

  // Upload & Extraction States (for Upload Prescription & Upload Leaflet tabs)
  const rxFileInputRef = useRef<HTMLInputElement | null>(null);
  const leafletFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgressPct, setUploadProgressPct] = useState<number | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<ProcessedMedicalDocumentAnalysis | null>(
    null
  );
  const [pendingRawFile, setPendingRawFile] = useState<File | undefined>(undefined);
  const [showRawJsonPreview, setShowRawJsonPreview] = useState(false);

  // Editable review fields before patient confirmation
  const [reviewMedName, setReviewMedName] = useState('');
  const [reviewActiveIng, setReviewActiveIng] = useState('');
  const [reviewStrength, setReviewStrength] = useState('');
  const [reviewDose, setReviewDose] = useState('');
  const [reviewFreq, setReviewFreq] = useState('twice_daily');
  const [reviewRoute, setReviewRoute] = useState('oral');
  const [reviewStartDate, setReviewStartDate] = useState(() => formatLocalDateYYYYMMDD());
  const [reviewDurationDays, setReviewDurationDays] = useState<number>(7);
  const [reviewFirstDoseTime, setReviewFirstDoseTime] = useState('08:00');
  const [reviewDoseTimes, setReviewDoseTimes] = useState<string[]>(['08:00', '20:00']);
  const [calibratingScheduleId, setCalibratingScheduleId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewConfirmedByPatient, setReviewConfirmedByPatient] = useState(false);
  const [createScheduleOnConfirm, setCreateScheduleOnConfirm] = useState(true);
  const [dbCandidates, setDbCandidates] = useState<MedicationDatabaseMatchCandidate[]>([]);

  // Quick AI Question from Dashboard
  const [aiQuickQuery, setAiQuickQuery] = useState('');

  const todayWaterKey = `dawaya_water_cups_${formatLocalDateYYYYMMDD()}`;
  const [waterCups, setWaterCups] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(todayWaterKey);
      return saved ? Math.min(8, Math.max(0, parseInt(saved, 10) || 0)) : 0;
    } catch {
      return 0;
    }
  });
  const handleToggleWaterCup = (cupNum: number) => {
    const next = cupNum === waterCups ? cupNum - 1 : cupNum;
    const clamped = Math.min(8, Math.max(0, next));
    setWaterCups(clamped);
    try {
      localStorage.setItem(todayWaterKey, String(clamped));
    } catch {
      /* ignore */
    }
  };

  const quickResults = useMemo(() => {
    if (!quickSearch.trim() || quickSearch.trim().length < 2) return [];
    return searchDawayaIndex(indexItems, { query: quickSearch.trim() }, isAr).slice(0, 6);
  }, [indexItems, quickSearch, isAr]);

  // Combine active profile medications + active schedule medications for live safety evaluation
  const allCurrentMedsInput = useMemo(() => {
    const list: Array<{
      id?: string;
      rawName?: string;
      name?: string;
      strength?: string;
      sourceType?: 'prescription' | 'profile_active';
    }> = [];
    for (const m of profile.activeMedications || []) {
      list.push({
        id: m.resolvedDrugId || undefined,
        rawName: m.drugName,
        name: m.drugName,
        strength: m.doseOrStrength,
        sourceType: 'profile_active',
      });
    }
    for (const m of (profile.medications || []).filter((x) => x.status === 'active')) {
      list.push({
        id: m.activeIngredients || undefined,
        rawName: m.drugName,
        name: m.drugName,
        strength: m.prescribedDose,
        sourceType: 'profile_active',
      });
    }
    for (const s of schedules || []) {
      if (s.trackingStatus === 'discontinued') continue;
      list.push({
        id: s.antibioticId || undefined,
        rawName: s.medicineName,
        name: s.medicineName,
        strength: s.prescribedDose,
        sourceType: 'prescription',
      });
    }
    return list;
  }, [profile.activeMedications, profile.medications, schedules]);

  const safetyReport = useMemo(
    () =>
      evaluateMedicationSafety({
        medications: allCurrentMedsInput,
        healthProfile: profile,
        includeProfileActiveMedications: true,
      }),
    [allCurrentMedsInput, profile]
  );

  // Upcoming doses across all active schedules (excluding paused/discontinued schedules)
  const upcomingDoses = useMemo(() => {
    const out: Array<{
      scheduleId: string;
      medicineName: string;
      prescribedDose: string;
      scheduledDate: string;
      scheduledTime: string;
      status: string;
      doseId: string;
    }> = [];
    for (const sch of schedules) {
      if (sch.trackingStatus === 'paused' || sch.trackingStatus === 'discontinued') continue;
      for (const d of sch.doses || []) {
        const st = getDoseStatus(d);
        if (st === 'upcoming' || st === 'unconfirmed') {
          const [sDate, sTimeRaw] = (d.scheduledTime || '').split('T');
          out.push({
            scheduleId: sch.id,
            medicineName: sch.medicineName,
            prescribedDose: sch.prescribedDose,
            scheduledDate: sDate || sch.startDate,
            scheduledTime: (sTimeRaw || '').slice(0, 5) || '08:00',
            status: st,
            doseId: d.id,
          });
        }
      }
    }
    return out
      .sort((a, b) =>
        `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(
          `${b.scheduledDate}T${b.scheduledTime}`
        )
      )
      .slice(0, 8);
  }, [schedules]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) {
      nav('/medicines');
      return;
    }
    nav(`/medicines?q=${encodeURIComponent(quickSearch.trim())}`);
  };

  async function handleDocumentUpload(
    e: ChangeEvent<HTMLInputElement>,
    forcedCategory: MedicalDocumentCategory
  ) {
    const fileList = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (fileList.length === 0 || uploadingDoc) return;

    const firstFile = fileList[0];
    const validation = validateMedicalUploadFile(firstFile);
    if (!validation.valid) {
      setUploadErrorMsg(isAr ? validation.errorAr || '' : validation.errorEn || '');
      return;
    }

    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);
    setPendingAnalysis(null);
    setUploadingDoc(true);
    setUploadProgressPct(20);

    try {
      const multiCompressed = await compressMultipleMedicalFiles(fileList);
      setUploadProgressPct(55);

      const analysis = await analyzeUploadedMedicalDocument({
        base64Data: multiCompressed.primaryBase64,
        previewDataUrl: multiCompressed.previewDataUrl,
        fileName: validation.sanitizedFileName,
        mimeType: multiCompressed.mimeType,
        fileSize: multiCompressed.totalSize,
        lang,
        forcedCategory,
        pdfPageCount: multiCompressed.pageCount,
        pdfExtractedText: multiCompressed.combinedPdfText,
        additionalPageImagesBase64: multiCompressed.allPageImagesBase64,
      });

      setUploadProgressPct(95);
      setPendingAnalysis(analysis);
      setPendingRawFile(firstFile);

      const firstRx = analysis.extractedPrescriptions?.[0];
      const firstJsonMed = analysis.structuredJson?.medications?.[0];
      const detectedName =
        firstRx?.medicineName ||
        analysis.leafletDetails?.medicationName ||
        analysis.extractedFields?.medicineName ||
        '';

      setReviewMedName(detectedName);
      setReviewActiveIng(
        firstJsonMed?.activeIngredient ||
          analysis.leafletDetails?.activeIngredient ||
          firstRx?.antibioticId ||
          ''
      );
      const smartReg = detectedName ? getSmartClinicalRegimenForMedicine(detectedName) : null;
      const effFreq = firstRx?.frequency || smartReg?.frequencyKey || 'twice_daily';
      const effStart = effFreq === 'thrice_daily' || effFreq === 'four_times_daily' ? '06:00' : smartReg?.firstDoseTime || '08:00';
      const effTimes = calculateAutoDoseTimes(effStart, effFreq);
      setReviewStrength(firstJsonMed?.strength || firstRx?.prescribedDose || '');
      setReviewDose(firstRx?.prescribedDose || (smartReg ? (isAr ? smartReg.defaultDoseTextAr : smartReg.defaultDoseTextEn) : ''));
      setReviewFreq(effFreq);
      setReviewFirstDoseTime(effTimes[0] || effStart);
      setReviewDoseTimes(effTimes);
      setReviewRoute(firstRx?.route || smartReg?.route || 'oral');
      setReviewDurationDays(firstRx?.durationDays || smartReg?.defaultDurationDays || 7);
      setReviewNotes(firstRx?.notes || '');
      setReviewConfirmedByPatient(false);

      if (detectedName) {
        const dbMatch = matchMedicationCandidatesFromDatabase({
          rawName: detectedName,
          rawStrength: firstRx?.prescribedDose,
          rawDosageForm: firstRx?.route,
        });
        setDbCandidates(dbMatch.possibleMatches);
      } else {
        setDbCandidates([]);
      }
    } catch {
      setUploadErrorMsg(
        isAr
          ? '⚠️ تعذر قراءة المستند تلقائياً. يمكنك إعادة المحاولة بصورة أوضح أو إدخال البيانات يدوياً.'
          : '⚠️ Could not automatically analyze the document. Please try a clearer image/PDF or enter details manually.'
      );
    } finally {
      setUploadingDoc(false);
      setUploadProgressPct(null);
    }
  }

  async function handleConfirmAndSaveExtractedData(e: FormEvent) {
    e.preventDefault();
    if (!pendingAnalysis) return;
    if (!reviewConfirmedByPatient) {
      setUploadErrorMsg(
        isAr
          ? '⚠️ يرجى وضع علامة التأكيد أولاً بأنك راجعت البيانات المستخرجة ومطابقتها للروشتة أو النشرة الأصلية.'
          : '⚠️ Please check the confirmation box verifying that you reviewed the extracted details.'
      );
      return;
    }

    setUploadingDoc(true);
    setUploadErrorMsg(null);
    const nowIso = new Date().toISOString();
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      const storageRes = await uploadMedicalDocumentToStorage({
        uid: user?.uid || null,
        docId,
        fileName: pendingAnalysis.fileName,
        mimeType: pendingAnalysis.mimeType,
        base64Data: pendingAnalysis.base64Data,
        rawFile: pendingRawFile,
      });

      const newDoc: MedicalDocumentRecord = {
        id: docId,
        title: pendingAnalysis.title,
        category: pendingAnalysis.category,
        fileName: pendingAnalysis.fileName,
        mimeType: pendingAnalysis.mimeType,
        fileSize: pendingAnalysis.fileSize,
        ...(storageRes.storagePath ? { storagePath: storageRes.storagePath } : {}),
        ...(storageRes.downloadUrl ? { downloadUrl: storageRes.downloadUrl } : {}),
        ...(pendingAnalysis.previewDataUrl
          ? { previewDataUrl: pendingAnalysis.previewDataUrl }
          : {}),
        extractedSummary: isAr
          ? pendingAnalysis.extractedSummaryAr
          : pendingAnalysis.extractedSummaryEn,
        extractedFields: {
          ...pendingAnalysis.extractedFields,
          ...(reviewMedName ? { medicineName: reviewMedName } : {}),
          ...(reviewDose ? { prescribedDose: reviewDose } : {}),
        },
        unreadableFields: [],
        verificationStatus: 'patient_confirmed',
        source: 'patient_upload',
        createdAt: nowIso,
      };

      const nextMedications: MedicationRecord[] = [...(profile.medications || [])];
      if (reviewMedName.trim() && pendingAnalysis.category === 'prescription') {
        const medRec: MedicationRecord = {
          id: `med-${Date.now()}`,
          drugName: reviewMedName.trim(),
          activeIngredients: reviewActiveIng.trim(),
          prescribedDose: reviewDose.trim() || reviewStrength.trim(),
          route: reviewRoute || 'oral',
          frequency: reviewFreq || 'twice_daily',
          startDate: reviewStartDate,
          endDate: computeEndDate(reviewStartDate, reviewDurationDays || 7),
          status: 'active',
          evidenceStatus: 'patient_reported',
          source: 'prescription_ocr',
          linkedDocumentId: docId,
          notes: reviewNotes.trim(),
        };
        nextMedications.unshift(medRec);
      }

      setProfile((prev) => ({
        ...prev,
        medications: nextMedications,
        medicalDocuments: [newDoc, ...(prev.medicalDocuments || [])],
      }));

      if (reviewMedName.trim() && pendingAnalysis.category === 'prescription') {
        const rxId = `rx-${Date.now()}`;
        const calculatedTimes =
          reviewDoseTimes && reviewDoseTimes.length > 0
            ? reviewDoseTimes
            : calculateAutoDoseTimes(reviewFirstDoseTime || '08:00', reviewFreq || 'twice_daily');
        const schId = `sch-${Date.now()}`;

        const savedRx: SavedPrescription = {
          id: rxId,
          medicineName: reviewMedName.trim(),
          prescribedDose: reviewDose.trim() || reviewStrength.trim() || 'حسب الروشتة',
          route: reviewRoute || 'oral',
          frequency: reviewFreq || 'twice_daily',
          firstDoseTime: reviewFirstDoseTime || '08:00',
          doseTimes: calculatedTimes,
          startDate: reviewStartDate,
          durationDays: reviewDurationDays || 7,
          notes: reviewNotes.trim(),
          captureMethod: 'ocr_upload',
          imageFileName: pendingAnalysis.fileName,
          isOcrUnverified: false,
          verificationStatus: 'verified_by_patient',
          verifiedAt: nowIso,
          verifiedByPatient: true,
          clarificationFlags: [],
          ...(createScheduleOnConfirm ? { linkedScheduleId: schId } : {}),
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        setPrescriptions((prev) => [savedRx, ...prev]);

        if (createScheduleOnConfirm) {
          const doses = generateScheduleDoses(
            schId,
            reviewStartDate,
            calculatedTimes,
            reviewDurationDays || 7
          );
          const newSch: TreatmentSchedule = {
            id: schId,
            prescriptionId: rxId,
            medicineName: reviewMedName.trim(),
            prescribedDose: reviewDose.trim() || reviewStrength.trim() || 'حسب الروشتة',
            route: reviewRoute || 'oral',
            frequency: reviewFreq || 'twice_daily',
            firstDoseTime: reviewFirstDoseTime || '08:00',
            doseTimes: calculatedTimes,
            startDate: reviewStartDate,
            durationDays: reviewDurationDays || 7,
            endDate: computeEndDate(reviewStartDate, reviewDurationDays || 7),
            notes: reviewNotes.trim(),
            captureMethod: 'ocr_upload',
            verificationStatus: 'verified_by_patient',
            verifiedAt: nowIso,
            verifiedByPatient: true,
            trackingStatus: 'active',
            createdAt: nowIso,
            updatedAt: nowIso,
            doses,
          };
          setSchedules((prev) => [newSch, ...prev]);
        }
      }

      setUploadSuccessMsg(
        isAr
          ? `✅ تم تأكيد وحفظ «${reviewMedName || pendingAnalysis.title}» بنجاح في حسابك${
              createScheduleOnConfirm && pendingAnalysis.category === 'prescription'
                ? ' وتفعيل جدول الجرعات والمنبهات!'
                : '!'
            }`
          : `✅ Confirmed and saved "${reviewMedName || pendingAnalysis.title}" to your account!`
      );
      setPendingAnalysis(null);
      setPendingRawFile(undefined);
    } finally {
      setUploadingDoc(false);
    }
  }

  const updateProfileMedicationStatus = (
    medId: string,
    newStatus: 'active' | 'completed' | 'discontinued'
  ) => {
    setProfile((prev) => ({
      ...prev,
      medications: (prev.medications || []).map((m) =>
        m.id === medId ? { ...m, status: newStatus } : m
      ),
    }));
  };

  const patientDisplayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    (isAr ? 'مريض دوايا' : 'DAWAYA Patient');

  const activeProfileMeds = (profile.medications || []).filter((m) => m.status === 'active');
  const previousProfileMeds = (profile.medications || []).filter((m) => m.status !== 'active');
  const uploadedLeaflets = (profile.medicalDocuments || []).filter(
    (d) => d.category === 'leaflet'
  );

  return (
    <main className="wrap stack" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Luxury Welcome Section */}
      <section className="dawaya-luxury-hero">
        <div
          className="row wrapRow"
          style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px' }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div style={{ marginBottom: '12px' }}>
              <DawayaLogo variant="horizontal" size={38} />
            </div>
            <span className="dawaya-pill-badge" style={{ marginBottom: '10px' }}>
              <span>✨</span>
              <span>
                {tr(
                  lang,
                  'لوحة التحكم الصحية الموحدة للمريض | Unified Patient Dashboard',
                  'Unified Patient Health & Medication Dashboard'
                )}
              </span>
            </span>
            <h1 style={{ color: '#FFFFFF', margin: '6px 0 8px', fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)' }}>
              {isAr
                ? `أهلاً بك، ${patientDisplayName} 👋`
                : `Welcome back, ${patientDisplayName} 👋`}
            </h1>
            <p style={{ color: '#9AE8E8', margin: 0, fontSize: '0.98rem', lineHeight: 1.7 }}>
              {isAr
                ? 'تابع ملفك الصحي، ارفع الروشتات والنشرات الدوائية (صور أو PDF)، راجع أدويتك الحالية والسابقة، وتحكم في منبهات وسجل الجرعات في مكان واحد آمن ومتزامن.'
                : 'Monitor your health profile, upload prescriptions & medication leaflets (images or PDF), review current & past medications, and track dose adherence in one secure hub.'}
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(154, 232, 232, 0.3)',
              borderRadius: '16px',
              padding: '16px 18px',
              minWidth: '240px',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: '#9AE8E8', fontWeight: 700 }}>
              {isAr ? 'حالة المزامنة السحابية والأمان' : 'Cloud Sync & Security Status'}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginTop: '4px' }}>
              {user
                ? syncStatus === 'synced' || !syncing
                  ? isAr
                    ? '🟢 متصل ومتزامن عبر Firebase'
                    : '🟢 Connected & Cloud Synced'
                  : isAr
                  ? '⏳ جارٍ المزامنة السحابية...'
                  : '⏳ Syncing with cloud...'
                : isAr
                ? '🔒 محفوظ محلياً (سجل دخولك للمزامنة)'
                : '🔒 Saved Locally (Sign in to sync)'}
            </div>
            {lastSyncedAt && (
              <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: '4px' }}>
                {isAr ? 'آخر تحديث: ' : 'Last synced: '}
                {formatTimestampReadable(lastSyncedAt, isAr)}
              </div>
            )}
            <div className="row wrapRow" style={{ gap: '8px', marginTop: '12px' }}>
              <Link
                to="/passport"
                className="btn small"
                style={{ background: '#138866', borderColor: '#138866', color: '#101E36', fontWeight: 800 }}
              >
                🪪 {isAr ? 'الكارت الطبي الذكي و QR' : 'Smart Medical ID & QR'}
              </Link>
              {!user && (
                <button
                  type="button"
                  className="btn small light"
                  onClick={() => openAuthModal('login')}
                >
                  👤 {isAr ? 'تسجيل الدخول للمزامنة' : 'Sign In to Sync'}
                </button>
              )}
              <Link to="/assistant" className="btn small light">
                🤖 {isAr ? 'مساعد دوايا الذكي' : 'DAWAYA AI'}
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Quick Access to Medicine Search (All 26,562+ Medicines) */}
        <div
          style={{
            marginTop: '22px',
            background: 'rgba(16, 30, 54, 0.72)',
            border: '1px solid rgba(0, 191, 208, 0.4)',
            borderRadius: '16px',
            padding: '16px',
          }}
        >
          <form onSubmit={handleSearchSubmit} className="row wrapRow" style={{ gap: '10px' }}>
            <input
              type="search"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder={
                isAr
                  ? `ابحث فوراً في ${totalCount.toLocaleString()} دواء مصري بالاسم التجاري، المادة الفعالة، أو الباركود...`
                  : `Instant search across ${totalCount.toLocaleString()} Egyptian medicines by brand, active ingredient, or barcode...`
              }
              style={{
                flex: 1,
                minWidth: '240px',
                background: '#FFFFFF',
                color: '#101E36',
                borderRadius: '12px',
                padding: '12px 16px',
                border: '2px solid #138866',
                fontWeight: 600,
              }}
            />
            <button
              type="submit"
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #138866 0%, #24C8B8 100%)',
                borderColor: '#138866',
                color: '#101E36',
                fontWeight: 800,
                padding: '12px 22px',
              }}
            >
              🔍 {isAr ? 'بحث في الموسوعة' : 'Search Medicines'}
            </button>
            <Link to="/scan" className="btn light">
              📷 {isAr ? 'مسح باركود الدواء' : 'Scan Barcode'}
            </Link>
          </form>

          {quickResults.length > 0 && (
            <div
              style={{
                marginTop: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '8px',
              }}
            >
              {quickResults.map((item) => (
                <Link
                  key={item.i}
                  to={`/medicine/${item.i}`}
                  style={{
                    background: 'rgba(255,255,255,0.96)',
                    color: '#101E36',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                      {isAr ? item.a : item.n}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#526B82' }}>
                      {item.g || (isAr ? 'يتطلب مراجعة المادة الفعالة' : 'Verify ingredient')} •{' '}
                      {DAWAYA_CATEGORY_LABELS[item.k]?.[isAr ? 'ar' : 'en']}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{ background: '#E0F7FA', color: '#008B99', fontWeight: 800 }}
                  >
                    {item.p ? `${item.p} EGP` : isAr ? 'تفاصيل' : 'View'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ NEW: 6-Tab Personal Medication & Prescription Hub (Sections 2, 3, 4, 5, 6, 8, 9) ══════════════ */}
      <section
        className="card stack"
        style={{
          borderRadius: '20px',
          border: '2px solid #138866',
          padding: '20px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <div
          className="row wrapRow"
          style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#0D1F38', fontSize: '1.3rem' }}>
              💊{' '}
              {isAr
                ? 'مركز إدارة الأدوية وقارئ الروشتات والنشرات الذكي'
                : 'Personal Medication Management & Smart Prescription/Leaflet Hub'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'ارفع صور أو ملفات PDF للروشتات والنشرات الدوائية، راجع البيانات المستخرجة وأكدها قبل الحفظ، وتابع جدول والتزام جرعاتك.'
                : 'Upload JPG, PNG, or multi-page PDF prescriptions & leaflets, review and confirm extracted data before saving, and manage your treatment schedule.'}
            </p>
          </div>
          <span
            className="badge"
            style={{ background: '#dcfce7', color: '#166534', fontWeight: 800 }}
          >
            🛡️ {isAr ? 'لا يتم حفظ أو تعديل أي جرعة إلا بتأكيدك' : 'Patient Confirmation Required'}
          </span>
        </div>

        {/* 6 Responsive Navigation Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: '8px',
            marginTop: '6px',
          }}
        >
          {[
            {
              key: 'upload_rx' as HubTabKey,
              icon: '📋',
              labelAr: 'رفع روشتة طبية',
              labelEn: 'Upload Prescription',
            },
            {
              key: 'upload_leaflet' as HubTabKey,
              icon: '📖',
              labelAr: 'رفع نشرة دواء',
              labelEn: 'Upload Medication Leaflet',
            },
            {
              key: 'my_meds' as HubTabKey,
              icon: '💊',
              labelAr: `أدويتي (${activeProfileMeds.length + schedules.length})`,
              labelEn: `My Medications (${activeProfileMeds.length + schedules.length})`,
            },
            {
              key: 'med_schedule' as HubTabKey,
              icon: '⏰',
              labelAr: `جدول الجرعات (${schedules.length})`,
              labelEn: `Medication Schedule (${schedules.length})`,
            },
            {
              key: 'med_history' as HubTabKey,
              icon: '📜',
              labelAr: `سجل الالتزام (${treatmentEvents.length})`,
              labelEn: `Medication History (${treatmentEvents.length})`,
            },
            {
              key: 'ai_assistant' as HubTabKey,
              icon: '🤖',
              labelAr: 'المساعد الدوائي الذكي',
              labelEn: 'AI Medication Assistant',
            },
          ].map((tab) => {
            const active = activeHubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveHubTab(tab.key);
                  setUploadErrorMsg(null);
                  setUploadSuccessMsg(null);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: active ? '2px solid #0D1F38' : '1px solid #cbd5e1',
                  background: active
                    ? 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)'
                    : '#ffffff',
                  color: active ? '#ffffff' : '#0D1F38',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Hidden Multi-File Inputs for Prescription & Leaflet */}
        <input
          ref={rxFileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleDocumentUpload(e, 'prescription')}
        />
        <input
          ref={leafletFileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleDocumentUpload(e, 'leaflet')}
        />

        {/* Upload Progress / Error / Success Banners */}
        {uploadProgressPct !== null && (
          <div
            style={{
              background: '#eff6ff',
              border: '1.5px solid #3b82f6',
              borderRadius: '12px',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontWeight: 800, color: '#1e40af', marginBottom: '6px' }}>
              ⏳{' '}
              {isAr
                ? `جارٍ قراءة وتحليل المستند (PDF.js / Gemini Vision / Tesseract OCR) — ${uploadProgressPct}%...`
                : `Processing document (PDF.js / Gemini Vision / Tesseract OCR) — ${uploadProgressPct}%...`}
            </div>
            <div style={{ height: '8px', background: '#dbeafe', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${uploadProgressPct}%`,
                  height: '100%',
                  background: '#2563eb',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>
        )}

        {uploadErrorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #f87171',
              color: '#991b1b',
              borderRadius: '12px',
              padding: '12px 16px',
              fontWeight: 700,
            }}
          >
            {uploadErrorMsg}
          </div>
        )}

        {uploadSuccessMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1.5px solid #10b981',
              color: '#065f46',
              borderRadius: '12px',
              padding: '12px 16px',
              fontWeight: 800,
            }}
          >
            {uploadSuccessMsg}
          </div>
        )}

        {/* TAB 1 & TAB 2: Upload Prescription OR Upload Medication Leaflet */}
        {(activeHubTab === 'upload_rx' || activeHubTab === 'upload_leaflet') && (
          <div className="stack" style={{ gap: '14px' }}>
            <div
              style={{
                border: '2px dashed #138866',
                borderRadius: '16px',
                padding: '22px',
                textAlign: 'center',
                background: '#f0fdf4',
              }}
            >
              <div style={{ fontSize: '2.4rem', marginBottom: '6px' }}>
                {activeHubTab === 'upload_rx' ? '📋📷' : '📖💊'}
              </div>
              <h3 style={{ margin: '0 0 6px', color: '#0D1F38' }}>
                {activeHubTab === 'upload_rx'
                  ? isAr
                    ? 'ارفع صورة الروشتة أو ملف PDF (يدعم الروشتات متعددة الصفحات بالعربي والإنجليزي)'
                    : 'Upload Prescription Photo or Multi-Page PDF (Arabic & English)'
                  : isAr
                  ? 'ارفع النشرة الدوائية (PDF أو صورة) لاستخراج وشرح الـ 12 قسماً رسمياً'
                  : 'Upload Medication Package Leaflet (PDF or Image) for 12-Section Analysis'}
              </h3>
              <p className="small muted" style={{ maxWidth: '680px', margin: '0 auto 14px' }}>
                {activeHubTab === 'upload_rx'
                  ? isAr
                    ? 'يقوم النظام باستخراج أسماء الأدوية، التركيز، الجرعة، التكرار، طريقة الاستخدام، والمدة مع مطابقتها بقاعدة أدوية دوايا (26,562+ دواء) دون تخمين أي حقل غير واضح.'
                    : 'Extracts medication names, strengths, dosage instructions, frequency, route, and duration, matching against the 26,562+ DAWAYA database without ever guessing unclear fields.'
                  : isAr
                  ? 'يستخرج دواعي الاستعمال، الجرعة الرسمية، موانع الاستعمال، التحذيرات، الآثار الجانبية، التداخلات، طريقة الحفظ، وتعليمات نسيان الجرعة مع التفرقة الواضحة بين نص النشرة والشرح التثقيفي العام.'
                  : 'Extracts indications, dosage, contraindications, warnings, side effects, interactions, storage, and missed-dose rules while distinguishing official leaflet text from general educational notes.'}
              </p>
              <div className="row wrapRow" style={{ justifyContent: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={uploadingDoc}
                  onClick={() =>
                    activeHubTab === 'upload_rx'
                      ? rxFileInputRef.current?.click()
                      : leafletFileInputRef.current?.click()
                  }
                  style={{
                    background: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    padding: '12px 24px',
                    borderRadius: '12px',
                  }}
                >
                  {activeHubTab === 'upload_rx'
                    ? isAr
                      ? '📎 اختر صورة روشتة (JPG/PNG) أو ملف PDF'
                      : '📎 Select Prescription (JPG, PNG, or PDF)'
                    : isAr
                    ? '📖 اختر ملف النشرة الدوائية (PDF أو صورة)'
                    : '📖 Select Medication Leaflet (PDF or Image)'}
                </button>
                <Link to="/assistant" className="btn ghost">
                  💬 {isAr ? 'أو افتح المحادثة الذكية الكاملة' : 'Or Open Full AI Chat'}
                </Link>
              </div>
            </div>

            {/* Review & Patient Confirmation Form when a document has been analyzed */}
            {pendingAnalysis && (
              <form
                onSubmit={handleConfirmAndSaveExtractedData}
                className="card stack"
                style={{
                  border: '2px solid #0284c7',
                  borderRadius: '16px',
                  padding: '18px',
                  background: '#ffffff',
                }}
              >
                <div
                  className="row wrapRow"
                  style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
                >
                  <h3 style={{ margin: 0, color: '#0369a1' }}>
                    🔍{' '}
                    {isAr
                      ? `مراجعة وتأكيد البيانات المستخرجة (${pendingAnalysis.fileName})`
                      : `Review & Confirm Extracted Information (${pendingAnalysis.fileName})`}
                  </h3>
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => setShowRawJsonPreview((v) => !v)}
                  >
                    {showRawJsonPreview
                      ? isAr
                        ? 'إخفاء JSON المهيكل'
                        : 'Hide Structured JSON'
                      : isAr
                      ? 'عرض JSON المهيكل (Section 8)'
                      : 'View Structured JSON'}
                  </button>
                </div>

                {pendingAnalysis.previewDataUrl && (
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <img
                      src={pendingAnalysis.previewDataUrl}
                      alt="Document preview"
                      style={{
                        width: '96px',
                        height: '96px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: 1.65 }}>
                        {isAr ? pendingAnalysis.extractedSummaryAr : pendingAnalysis.extractedSummaryEn}
                      </p>
                    </div>
                  </div>
                )}

                {showRawJsonPreview && pendingAnalysis.structuredJson && (
                  <pre
                    dir="ltr"
                    style={{
                      background: '#0f172a',
                      color: '#e2e8f0',
                      padding: '12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      overflowX: 'auto',
                      margin: 0,
                    }}
                  >
                    {JSON.stringify(pendingAnalysis.structuredJson, null, 2)}
                  </pre>
                )}

                {/* Leaflet 12-Section Breakdown if Leaflet */}
                {pendingAnalysis.leafletDetails && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'grid',
                      gap: '8px',
                    }}
                  >
                    <strong style={{ color: '#0D1F38' }}>
                      📖{' '}
                      {isAr
                        ? 'تفاصيل النشرة الدوائية المستخرجة (مع الفصل بين نص النشرة والشرح العام):'
                        : 'Extracted Leaflet Details (Official Leaflet vs. General Education):'}
                    </strong>
                    <div className="small">
                      <b>{isAr ? '• الاسم والمادة الفعالة:' : '• Name & Active Ingredient:'}</b>{' '}
                      {pendingAnalysis.leafletDetails.medicationName} —{' '}
                      {pendingAnalysis.leafletDetails.activeIngredient}
                    </div>
                    <div className="small">
                      <b>{isAr ? '• دواعي الاستعمال:' : '• Indications:'}</b>{' '}
                      {pendingAnalysis.leafletDetails.indicationsAndUses}
                    </div>
                    <div className="small">
                      <b>{isAr ? '• الجرعة الرسمية بالنشرة:' : '• Official Dosage Info:'}</b>{' '}
                      {pendingAnalysis.leafletDetails.officialDosageInfo}
                    </div>
                    <div className="small">
                      <b>{isAr ? '• موانع الاستعمال والتحذيرات:' : '• Contraindications & Warnings:'}</b>{' '}
                      {pendingAnalysis.leafletDetails.contraindications} |{' '}
                      {pendingAnalysis.leafletDetails.warningsAndPrecautions}
                    </div>
                    <div className="small">
                      <b>{isAr ? '• الآثار الجانبية الشائعة والخطيرة:' : '• Common & Serious Side Effects:'}</b>{' '}
                      {pendingAnalysis.leafletDetails.commonSideEffects} |{' '}
                      {pendingAnalysis.leafletDetails.seriousAdverseReactions}
                    </div>
                    <div className="small">
                      <b>{isAr ? '• التداخلات الدوائية والغذائية:' : '• Drug & Food Interactions:'}</b>{' '}
                      {pendingAnalysis.leafletDetails.drugInteractions} |{' '}
                      {pendingAnalysis.leafletDetails.foodAndDrinkInteractions}
                    </div>
                    <div className="small">
                      <b>{isAr ? '• الحفظ ونسيان الجرعة والحمل:' : '• Storage, Missed Dose & Pregnancy:'}</b>{' '}
                      {pendingAnalysis.leafletDetails.storageInstructions} |{' '}
                      {pendingAnalysis.leafletDetails.missedDoseInstructions} |{' '}
                      {pendingAnalysis.leafletDetails.pregnancyAndBreastfeedingWarnings}
                    </div>
                  </div>
                )}

                {/* Database Match Candidates Selector (Section 4: Present possible matches if multiple exist) */}
                {dbCandidates.length > 1 && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1.5px solid #f59e0b',
                      borderRadius: '12px',
                      padding: '12px',
                    }}
                  >
                    <strong style={{ color: '#92400e', display: 'block', marginBottom: '6px' }}>
                      🔎{' '}
                      {isAr
                        ? 'وُجد أكثر من تركيز/شكل محتمل في قاعدة بيانات دوايا — اختر الصنف المطابق لروشتتك (لا يتم الاختيار تلقائياً):'
                        : 'Multiple possible products found in DAWAYA database — click to select the exact match on your prescription:'}
                    </strong>
                    <div className="row wrapRow" style={{ gap: '8px' }}>
                      {dbCandidates.map((cand) => (
                        <button
                          key={cand.id}
                          type="button"
                          className="chip"
                          onClick={() => {
                            setReviewMedName(
                              isAr
                                ? `${cand.brandNameAr} (${cand.brandNameEn})`
                                : `${cand.brandNameEn} (${cand.brandNameAr})`
                            );
                            setReviewActiveIng(cand.activeIngredient);
                            if (cand.strength) setReviewStrength(cand.strength);
                            if (cand.route) setReviewRoute(cand.route);
                          }}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #d97706',
                            color: '#78350f',
                            fontWeight: 800,
                          }}
                        >
                          💊 {isAr ? cand.brandNameAr : cand.brandNameEn} ({cand.strength}) —{' '}
                          {cand.dosageForm}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editable Medication & Schedule Fields */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                  }}
                >
                  <div>
                    <label className="small">
                      <b>{isAr ? 'اسم الدواء:' : 'Medication Name:'}</b>
                    </label>
                    <input
                      className="input"
                      value={reviewMedName}
                      onChange={(e) => setReviewMedName(e.target.value)}
                      placeholder={isAr ? 'اكتب أو عدل اسم الدواء...' : 'Enter medication name...'}
                    />
                  </div>
                  <div>
                    <label className="small">
                      <b>{isAr ? 'المادة الفعالة:' : 'Active Ingredient:'}</b>
                    </label>
                    <input
                      className="input"
                      value={reviewActiveIng}
                      onChange={(e) => setReviewActiveIng(e.target.value)}
                      placeholder={isAr ? 'المادة الفعالة...' : 'Active ingredient...'}
                    />
                  </div>
                  <div>
                    <label className="small">
                      <b>{isAr ? 'الجرعة والتركيز:' : 'Dose & Strength:'}</b>
                    </label>
                    <input
                      className="input"
                      value={reviewDose}
                      onChange={(e) => setReviewDose(e.target.value)}
                      placeholder={isAr ? 'مثال: 500 مجم / قرص واحد' : 'e.g., 500 mg / 1 tablet'}
                    />
                  </div>
                  <div>
                    <label className="small">
                      <b>{isAr ? 'التكرار اليومي:' : 'Frequency:'}</b>
                    </label>
                    <SmartNativeSelect
                      className="input"
                      value={reviewFreq}
                      onChange={(e) => setReviewFreq(e.target.value)}
                    >
                      <option value="once_daily">{formatFrequencyLabel('once_daily', isAr)}</option>
                      <option value="twice_daily">{formatFrequencyLabel('twice_daily', isAr)}</option>
                      <option value="thrice_daily">{formatFrequencyLabel('thrice_daily', isAr)}</option>
                      <option value="four_times_daily">
                        {formatFrequencyLabel('four_times_daily', isAr)}
                      </option>
                    </SmartNativeSelect>
                  </div>
                  <div>
                    <label className="small">
                      <b>{isAr ? 'تاريخ البداية:' : 'Start Date:'}</b>
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={reviewStartDate}
                      onChange={(e) => setReviewStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="small">
                      <b>{isAr ? 'مدة العلاج (بالأيام):' : 'Duration (Days):'}</b>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      className="input"
                      value={reviewDurationDays}
                      onChange={(e) => setReviewDurationDays(Number(e.target.value) || 7)}
                    />
                  </div>
                  <div>
                    <label className="small">
                      <b>{isAr ? 'موعد أول جرعة:' : 'First Dose Time:'}</b>
                    </label>
                    <input
                      type="time"
                      className="input"
                      value={reviewFirstDoseTime}
                      onChange={(e) => setReviewFirstDoseTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="small">
                      <b>{isAr ? 'تعليمات الطبيب:' : 'Doctor Instructions:'}</b>
                    </label>
                    <input
                      className="input"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder={isAr ? 'مثال: بعد الأكل بساعة...' : 'e.g., After meals...'}
                    />
                  </div>
                </div>

                <SmartDoseTimeCalibrator
                  medicineName={reviewMedName}
                  frequency={reviewFreq}
                  doseTimes={reviewDoseTimes}
                  isAr={isAr}
                  onChange={(nextFreq, nextTimes, suggestedDose, suggestedDur) => {
                    setReviewFreq(nextFreq);
                    setReviewDoseTimes(nextTimes);
                    if (nextTimes[0]) setReviewFirstDoseTime(nextTimes[0]);
                    if (!reviewDose && suggestedDose) setReviewDose(suggestedDose);
                    if (suggestedDur && !reviewDurationDays) setReviewDurationDays(suggestedDur);
                  }}
                />

                <div style={{ display: 'grid', gap: '6px', marginTop: '4px' }}>
                  {pendingAnalysis.category === 'prescription' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={createScheduleOnConfirm}
                        onChange={(e) => setCreateScheduleOnConfirm(e.target.checked)}
                      />
                      <span className="small" style={{ fontWeight: 700 }}>
                        {isAr
                          ? 'تفعيل جدول مواعيد الجرعات والمنبهات تلقائياً لهذا الدواء بعد التأكيد'
                          : 'Also create an active medication reminder schedule upon confirmation'}
                      </span>
                    </label>
                  )}

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      background: '#eff6ff',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #93c5fd',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={reviewConfirmedByPatient}
                      onChange={(e) => setReviewConfirmedByPatient(e.target.checked)}
                    />
                    <span className="small" style={{ fontWeight: 800, color: '#1e3a8a' }}>
                      {isAr
                        ? 'أؤكد أنني راجعت اسم الدواء والتركيز والجرعة المذكورة أعلاه ومطابقتها للروشتة الورقية / النشرة الأصلية.'
                        : 'I confirm that I have reviewed the extracted medication name, strength, and dosage instructions against my original document.'}
                    </span>
                  </label>
                </div>

                <div className="row wrapRow" style={{ gap: '10px' }}>
                  <button
                    type="submit"
                    className="btn"
                    disabled={uploadingDoc}
                    style={{ background: '#138866', borderColor: '#138866', color: '#101E36', fontWeight: 900 }}
                  >
                    ✅ {isAr ? 'تأكيد وحفظ في حسابي' : 'Confirm & Save to My Account'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setPendingAnalysis(null);
                      setPendingRawFile(undefined);
                    }}
                  >
                    ✕ {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Previously Uploaded Leaflets when on Upload Leaflet Tab */}
            {activeHubTab === 'upload_leaflet' && uploadedLeaflets.length > 0 && (
              <div className="stack" style={{ gap: '8px' }}>
                <h4 style={{ margin: 0 }}>
                  📚 {isAr ? 'النشرات الدوائية المحفوظة في حسابك:' : 'Saved Medication Leaflets:'}
                </h4>
                {uploadedLeaflets.map((lf) => (
                  <div key={lf.id} className="subcard">
                    <b>📖 {lf.title}</b>
                    <p className="small" style={{ whiteSpace: 'pre-line', margin: '6px 0 0' }}>
                      {lf.extractedSummary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: My Medications (Current & Previous) */}
        {activeHubTab === 'my_meds' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>
                💊 {isAr ? 'أدويتي الحالية والسابقة' : 'My Current & Previous Medications'}
              </h3>
              <div className="row wrapRow" style={{ gap: '8px' }}>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setActiveHubTab('upload_rx')}
                >
                  ➕ {isAr ? 'إضافة من روشتة جديدة' : 'Add from Prescription'}
                </button>
                <Link to="/health-profile" className="btn small ghost">
                  ✏️ {isAr ? 'إدارة الملف الصحي الكامل' : 'Full Health Profile'}
                </Link>
              </div>
            </div>

            {activeProfileMeds.length === 0 && schedules.length === 0 ? (
              <div className="subcard">
                <p className="small muted" style={{ margin: 0 }}>
                  {isAr
                    ? 'لا توجد أدوية حالية مسجلة. ارفع روشتة من تبويب «رفع روشتة طبية» أو أضف دواءً من ملفك الصحي.'
                    : 'No current medications recorded. Upload a prescription or add a medication in your Health Profile.'}
                </p>
              </div>
            ) : (
              <div className="stack" style={{ gap: '8px' }}>
                {activeProfileMeds.map((med) => (
                  <div
                    key={med.id}
                    className="subcard row wrapRow"
                    style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
                  >
                    <div>
                      <b>💊 {med.drugName}</b>{' '}
                      <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                        {isAr ? 'نشط حالياً' : 'Active'}
                      </span>
                      <div className="small muted">
                        {med.prescribedDose} • {formatFrequencyLabel(med.frequency, isAr)} •{' '}
                        {formatRouteLabel(med.route, isAr)} ({med.startDate}
                        {med.endDate ? ` → ${med.endDate}` : ''})
                      </div>
                    </div>
                    <div className="row wrapRow" style={{ gap: '6px' }}>
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => updateProfileMedicationStatus(med.id, 'completed')}
                      >
                        ✅ {isAr ? 'مكتمل' : 'Mark Completed'}
                      </button>
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => updateProfileMedicationStatus(med.id, 'discontinued')}
                      >
                        ⏹️ {isAr ? 'إيقاف' : 'Discontinue'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previousProfileMeds.length > 0 && (
              <div className="stack" style={{ gap: '8px', marginTop: '8px' }}>
                <h4 style={{ margin: 0, color: '#475569' }}>
                  🕓 {isAr ? 'الأدوية السابقة (مكتملة أو متوقفة):' : 'Previous Medications (Completed / Discontinued):'}
                </h4>
                {previousProfileMeds.map((med) => (
                  <div
                    key={med.id}
                    className="subcard row wrapRow"
                    style={{ justifyContent: 'space-between', alignItems: 'center', opacity: 0.85 }}
                  >
                    <div>
                      <b>{med.drugName}</b>{' '}
                      <span className="badge">
                        {med.status === 'completed'
                          ? isAr
                            ? 'مكتمل'
                            : 'Completed'
                          : isAr
                          ? 'متوقف'
                          : 'Discontinued'}
                      </span>
                      <div className="small muted">
                        {med.prescribedDose} • {med.startDate}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => updateProfileMedicationStatus(med.id, 'active')}
                    >
                      🔄 {isAr ? 'إعادة للنشط' : 'Reactivate'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Medication Schedule & Adherence Controls */}
        {activeHubTab === 'med_schedule' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>
                ⏰ {isAr ? 'جداول الجرعات والتنبيهات اليومية' : 'Medication Schedules & Dose Reminders'}
              </h3>
              <Link to="/tracker" className="btn small">
                🗓️ {isAr ? 'فتح متابع الجرعات الكامل' : 'Open Full Dose Tracker'}
              </Link>
            </div>

            {schedules.length === 0 ? (
              <div className="subcard">
                <p className="small muted" style={{ margin: 0 }}>
                  {isAr
                    ? 'لا توجد جداول جرعات مفعّلة حالياً. ارفع روشتة أو افتح متابع الجرعات لإضافة جدول جديد.'
                    : 'No active medication schedules. Upload a prescription or open the Dose Tracker to create one.'}
                </p>
              </div>
            ) : (
              schedules.map((sch) => {
                const prog = calculateScheduleProgress(sch);
                const nextDose = sch.doses.find((d) => getDoseStatus(d) === 'upcoming');
                return (
                  <div key={sch.id} className="subcard stack" style={{ gap: '8px' }}>
                    <div
                      className="row wrapRow"
                      style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}
                    >
                      <div>
                        <b>💊 {sch.medicineName}</b> ({sch.prescribedDose}){' '}
                        <span
                          className="badge"
                          style={{
                            background:
                              sch.trackingStatus === 'paused'
                                ? '#fef3c7'
                                : sch.trackingStatus === 'discontinued'
                                ? '#fee2e2'
                                : '#dcfce7',
                            color:
                              sch.trackingStatus === 'paused'
                                ? '#92400e'
                                : sch.trackingStatus === 'discontinued'
                                ? '#991b1b'
                                : '#166534',
                          }}
                        >
                          {sch.trackingStatus === 'paused'
                            ? isAr
                              ? '⏸️ متوقف مؤقتاً'
                              : '⏸️ Paused'
                            : sch.trackingStatus === 'discontinued'
                            ? isAr
                              ? '⏹️ متوقف'
                              : '⏹️ Discontinued'
                            : isAr
                            ? '🟢 نشط'
                            : '🟢 Active'}
                        </span>
                        <div className="small muted">
                          {formatFrequencyLabel(sch.frequency, isAr)} • {sch.startDate} → {sch.endDate} •{' '}
                          {isAr ? 'الالتزام:' : 'Adherence:'} {prog.takenCount}/{prog.totalDoses} (
                          {prog.progressPercent}%)
                        </div>
                      </div>

                      <div className="row wrapRow" style={{ gap: '6px' }}>
                        <button
                          type="button"
                          className="btn small"
                          style={{
                            background: calibratingScheduleId === sch.id ? '#0D1F38' : '#138866',
                            borderColor: '#138866',
                            color: '#ffffff',
                            fontWeight: 800,
                          }}
                          onClick={() =>
                            setCalibratingScheduleId((prev) => (prev === sch.id ? null : sch.id))
                          }
                        >
                          ⚙️ {isAr ? 'معايرة المرات والساعات' : 'Calibrate Doses & Times'}
                        </button>
                        <button
                          type="button"
                          className="btn small ghost"
                          onClick={() => downloadScheduleIcs(sch, isAr)}
                        >
                          📅 {isAr ? 'منبه (.ics)' : 'Alarm (.ics)'}
                        </button>
                        {sch.trackingStatus === 'paused' ? (
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => setScheduleTrackingStatus(sch.id, 'active')}
                          >
                            ▶️ {isAr ? 'استئناف' : 'Resume'}
                          </button>
                        ) : sch.trackingStatus !== 'discontinued' ? (
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => setScheduleTrackingStatus(sch.id, 'paused')}
                          >
                            ⏸️ {isAr ? 'إيقاف مؤقت' : 'Pause'}
                          </button>
                        ) : null}
                        {sch.trackingStatus !== 'discontinued' && (
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => setScheduleTrackingStatus(sch.id, 'discontinued')}
                          >
                            ⏹️ {isAr ? 'إيقاف المتابعة' : 'Discontinue'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Visual Daily Dose Clock Badges */}
                    {Array.isArray(sch.doseTimes) && sch.doseTimes.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '10px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <span className="small" style={{ fontWeight: 800, color: '#0D1F38' }}>
                          🕒 {isAr ? 'مواعيد الجرعات في اليوم:' : 'Daily Dose Times:'}
                        </span>
                        {sch.doseTimes.map((tStr, tIdx) => (
                          <span
                            key={tIdx}
                            style={{
                              background: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
                              color: '#ffffff',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                            }}
                          >
                            {isAr ? `الجرعة ${tIdx + 1}: ` : `Dose ${tIdx + 1}: `}
                            {formatTime12Hour(tStr, isAr)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Inline Smart Dose & Time Calibrator for this Schedule */}
                    {calibratingScheduleId === sch.id && (
                      <SmartDoseTimeCalibrator
                        medicineName={sch.medicineName}
                        frequency={sch.frequency}
                        doseTimes={sch.doseTimes}
                        isAr={isAr}
                        compact
                        onChange={(nextFreq, nextTimes) => {
                          setSchedules((prev) =>
                            prev.map((item) => {
                              if (item.id !== sch.id) return item;
                              const regeneratedDoses = generateScheduleDoses(
                                item.id,
                                item.startDate,
                                nextTimes,
                                item.durationDays,
                                item.doses
                              );
                              return {
                                ...item,
                                frequency: nextFreq,
                                firstDoseTime: nextTimes[0] || item.firstDoseTime,
                                doseTimes: nextTimes,
                                doses: regeneratedDoses,
                                updatedAt: new Date().toISOString(),
                              };
                            })
                          );
                        }}
                      />
                    )}

                    {nextDose && sch.trackingStatus !== 'paused' && sch.trackingStatus !== 'discontinued' && (
                      <div
                        className="row wrapRow"
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f0fdf4',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        <span className="small">
                          ⏰ <b>{isAr ? 'الجرعة القادمة:' : 'Next Dose:'}</b>{' '}
                          {nextDose.scheduledTime.replace('T', ' — ')}
                        </span>
                        <div className="row wrapRow" style={{ gap: '6px' }}>
                          <button
                            type="button"
                            className="btn small"
                            style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                            onClick={() => updateDoseStatus(sch.id, nextDose.id, 'taken')}
                          >
                            ✓ {isAr ? 'تم أخذها' : 'Taken'}
                          </button>
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => updateDoseStatus(sch.id, nextDose.id, 'skipped')}
                          >
                            ⏭️ {isAr ? 'تخطي' : 'Skipped'}
                          </button>
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => updateDoseStatus(sch.id, nextDose.id, 'missed')}
                          >
                            ✕ {isAr ? 'فائتة' : 'Missed'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 5: Medication History */}
        {activeHubTab === 'med_history' && (
          <div className="stack" style={{ gap: '12px' }}>
            <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>
                📜 {isAr ? 'سجل تاريخ الجرعات والمتابعة الزمني' : 'Chronological Medication & Dose History'}
              </h3>
              <Link to="/tracker" className="btn small ghost">
                📥 {isAr ? 'تصدير التقرير الكامل' : 'Export Full Report'}
              </Link>
            </div>
            {treatmentEvents.length === 0 ? (
              <div className="subcard">
                <p className="small muted" style={{ margin: 0 }}>
                  {isAr
                    ? 'لم يتم تسجيل أحداث جرعات بعد. عند تسجيل أخذ أو تخطي أو فوات أي جرعة ستظهر هنا بالتاريخ والساعة.'
                    : 'No dose events logged yet. Recorded taken, skipped, and missed doses will appear here chronologically.'}
                </p>
              </div>
            ) : (
              <div className="stack" style={{ gap: '8px' }}>
                {treatmentEvents.slice(0, 15).map((ev) => (
                  <div key={ev.id} className="subcard">
                    <div className="row wrapRow" style={{ justifyContent: 'space-between' }}>
                      <b>{ev.medicineName || (isAr ? 'حدث علاجي' : 'Treatment Event')}</b>
                      <span className="small muted">
                        {formatTimestampReadable(ev.timestamp, isAr)}
                      </span>
                    </div>
                    <div className="small" style={{ marginTop: '4px' }}>
                      {isAr ? ev.summaryAr : ev.summaryEn}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: AI Medication Assistant Quick Hub */}
        {activeHubTab === 'ai_assistant' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div>
              <h3 style={{ margin: 0 }}>
                🤖{' '}
                {isAr
                  ? 'المساعد الدوائي الذكي (متصل بأدويتك وروشتاتك المصرّح بها)'
                  : 'Context-Aware AI Medication Assistant'}
              </h3>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'اسأل بالعربية أو الإنجليزية عن دواعي الاستعمال، شرح تعليمات الروشتة، الآثار الجانبية، التصرف عند نسيان الجرعة، أو التداخلات بين أدويتك.'
                  : 'Ask in Arabic or English about medication uses, prescription instructions, side effects, missed doses, interactions, or your next reminder.'}
              </p>
            </div>

            <div className="chips">
              {[
                isAr ? 'فيما يُستخدم هذا الدواء؟' : 'What is this medication used for?',
                isAr
                  ? 'اشرح لي تعليمات الجرعة في روشتتي ببساطة'
                  : 'How should I understand the instructions on my prescription?',
                isAr ? 'ما هي الآثار الجانبية الشائعة؟' : 'What are the common side effects?',
                isAr ? 'أعمل إيه لو نسيت جرعة الدواء؟' : 'What should I do if I miss a dose?',
                isAr
                  ? 'هل يوجد تعارض بين أدويتي الحالية؟'
                  : 'Can these two medications interact?',
                isAr ? 'ما هي الاحتياطات والتحذيرات الهامة؟' : 'What precautions should I know?',
                isAr ? 'ما هي الأدوية التي أتابعها حالياً؟' : 'What medications am I currently tracking?',
                isAr ? 'متى موعد منبه الجرعة القادم؟' : 'When is my next medication reminder?',
              ].map((qText) => (
                <button
                  key={qText}
                  type="button"
                  className="chip"
                  onClick={() => nav(`/assistant?q=${encodeURIComponent(qText)}`)}
                  style={{ fontWeight: 700 }}
                >
                  💬 {qText}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!aiQuickQuery.trim()) return;
                nav(`/assistant?q=${encodeURIComponent(aiQuickQuery.trim())}`);
              }}
              className="row wrapRow"
              style={{ gap: '8px' }}
            >
              <input
                className="input"
                style={{ flex: 1, minWidth: '220px' }}
                value={aiQuickQuery}
                onChange={(e) => setAiQuickQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب سؤالك عن أي دواء أو روشتة أو تداخل دوائي...'
                    : 'Ask a question about your medications, prescriptions, or interactions...'
                }
              />
              <button type="submit" className="btn">
                🚀 {isAr ? 'اسأل المساعد الآن' : 'Ask AI Assistant'}
              </button>
            </form>
          </div>
        )}
      </section>

      <DriverDrugTestShieldCard isAr={isAr} />

      {/* 2.5 Daily Medication Hydration Guard Strip */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(14, 165, 233, 0.14) 100%)',
          border: '1.5px solid #0284c7',
          borderRadius: '18px',
          padding: '14px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>💧</span>
            <div>
              <strong style={{ fontSize: '0.96rem', display: 'block', color: '#0369a1' }}>
                {isAr ? 'متابعة شرب الماء اليومي (8 أكواب / 2 لتر)' : 'Daily Medication Hydration Guard (8 Glasses)'}
              </strong>
              <span className="small muted">
                {isAr ? 'اضغط على الكوب لتسجيل شرب الماء وحماية الكلى والمريء من ترسبات الأدوية' : 'Tap a glass to log water intake and protect your kidneys'}
              </span>
            </div>
          </div>
          <span
            style={{
              background: waterCups >= 8 ? '#dcfce7' : '#e0f2fe',
              color: waterCups >= 8 ? '#15803d' : '#0369a1',
              padding: '4px 12px',
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '0.84rem',
              border: '1px solid #7dd3fc',
            }}
          >
            {waterCups} / 8 {isAr ? 'أكواب اليوم' : 'Cups'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(64px, 1fr))', gap: '6px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
            const active = num <= waterCups;
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleToggleWaterCup(num)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '12px',
                  border: active ? '2px solid #0284c7' : '1px dashed #94a3b8',
                  background: active ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' : 'var(--card-bg, #ffffff)',
                  color: active ? '#ffffff' : 'var(--ink, #0D1F38)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{active ? '●' : '○'}</span>
                <span>{isAr ? `كوب ${num}` : `#${num}`}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. KPI Summary Strip */}
      <section className="dawaya-kpi-grid">
        <div className="dawaya-kpi-card" style={{ borderTop: '4px solid #138866' }}>
          <div className="small muted">{isAr ? 'الأدوية الحالية النشطة' : 'Current Active Medications'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#138866' }}>
            {(profile.activeMedications?.length || 0) + activeProfileMeds.length + schedules.length}
          </div>
          <Link to="/health-profile" className="small" style={{ fontWeight: 700 }}>
            {isAr ? 'إدارة قائمة أدويتي ←' : 'Manage Medication List →'}
          </Link>
        </div>

        <div className="dawaya-kpi-card" style={{ borderTop: '4px solid #24C8B8' }}>
          <div className="small muted">{isAr ? 'منبهات الجرعات القادمة' : 'Upcoming Dose Reminders'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#24C8B8' }}>
            {upcomingDoses.length}
          </div>
          <Link to="/tracker" className="small" style={{ fontWeight: 700 }}>
            {isAr ? 'فتح متابع ومنبه الجرعات ←' : 'Open Dose Tracker →'}
          </Link>
        </div>

        <div className="dawaya-kpi-card" style={{ borderTop: '4px solid #7C3AED' }}>
          <div className="small muted">{isAr ? 'الحساسية الدوائية المسجلة' : 'Documented Allergies'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7C3AED' }}>
            {profile.allergies?.length || 0}
          </div>
          <Link to="/allergy-checker" className="small" style={{ fontWeight: 700 }}>
            {isAr ? 'فحص الحساسية المتصالبة ←' : 'Check Drug Allergies →'}
          </Link>
        </div>

        <div className="dawaya-kpi-card" style={{ borderTop: '4px solid #0284C7' }}>
          <div className="small muted">{isAr ? 'الروشتات المحفوظة' : 'Saved Prescriptions'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284C7' }}>
            {prescriptions.length}
          </div>
          <Link to="/prescription-radar" className="small" style={{ fontWeight: 700 }}>
            {isAr ? 'فتح رادار الروشتة 24س ←' : 'Open Prescription Radar →'}
          </Link>
        </div>

        <div
          className="dawaya-kpi-card"
          style={{
            borderTop: `4px solid ${
              safetyReport.findings.length > 0 ? '#DC2626' : '#059669'
            }`,
          }}
        >
          <div className="small muted">{isAr ? 'إشعارات محرك الأمان الدوائي' : 'Safety Engine Alerts'}</div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: safetyReport.findings.length > 0 ? '#DC2626' : '#059669',
            }}
          >
            {safetyReport.findings.length}
          </div>
          <Link to="/complete-checkup" className="small" style={{ fontWeight: 700 }}>
            {isAr ? 'تشغيل الفحص الشامل ←' : 'Run Complete Checkup →'}
          </Link>
        </div>
      </section>

      {/* 4. Important Safety Notifications & Allergy Alerts (Connected to Central Safety Engine) */}
      <section className="dawaya-section-card">
        <div className="head" style={{ marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              🛡️{' '}
              {isAr
                ? 'تنبيهات الأمان الدوائي والحساسية (Central Medication Safety Engine)'
                : 'Important Safety Notifications & Allergy Alerts'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'فحص تلقائي مستمر لأدويتك الحالية وجداولك مقابل حساسيتك الدوائية وحالاتك الصحية المزمنة وتكرار المواد الفعالة.'
                : 'Continuous automated screening of your active medications and schedules against allergies, duplicate ingredients, interactions, and chronic conditions.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/allergy-checker" className="btn small ghost">
              🛡️ {isAr ? 'فاحص الحساسية' : 'Allergy Checker'}
            </Link>
            <Link to="/interactions" className="btn small ghost">
              ⚡ {isAr ? 'فاحص التفاعلات' : 'Interactions'}
            </Link>
          </div>
        </div>

        {/* Documented Allergies Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background:
              (profile.allergies?.length || 0) > 0
                ? 'rgba(220, 38, 38, 0.08)'
                : 'var(--tint)',
            border:
              (profile.allergies?.length || 0) > 0
                ? '1px solid rgba(220, 38, 38, 0.35)'
                : '1px solid var(--line)',
            marginBottom: '14px',
          }}
        >
          <b>
            {isAr ? 'سجل الحساسية الدوائية المسجل بالملف: ' : 'Documented Allergy Alerts: '}
          </b>
          {(profile.allergies?.length || 0) > 0 ? (
            <span style={{ fontWeight: 700, color: '#DC2626' }}>
              {profile.allergies
                .map((a) => `${a.drugName} (${a.severity})`)
                .join(isAr ? ' ، ' : ', ')}
            </span>
          ) : (
            <span className="muted">
              {isAr
                ? 'لا توجد حساسية دوائية مسجلة حالياً. أضف أي حساسية معروفة (مثل البنسلين أو السلفا) في ملفك الصحي لتفعيل الحماية التلقائية.'
                : 'No drug allergies recorded yet. Add any known allergies in your Health Profile to enable automatic screening.'}
            </span>
          )}
        </div>

        {safetyReport.findings.length > 0 ? (
          <div className="stack" style={{ gap: '10px' }}>
            {safetyReport.findings.slice(0, 5).map((f) => (
              <div
                key={f.id}
                className="card"
                style={{
                  borderInlineStart: `5px solid ${
                    f.severity === 'urgent'
                      ? '#DC2626'
                      : f.severity === 'warning'
                      ? '#D97706'
                      : '#0284C7'
                  }`,
                  padding: '12px 16px',
                }}
              >
                <div className="row wrapRow" style={{ justifyContent: 'space-between' }}>
                  <b>{isAr ? f.title.ar : f.title.en}</b>
                  <span className="badge">{f.severity.toUpperCase()}</span>
                </div>
                <p className="small" style={{ margin: '6px 0' }}>
                  {isAr ? f.reason.ar : f.reason.en}
                </p>
                <div className="small muted">
                  <b>{isAr ? 'التوصية المهنية: ' : 'Next Step: '}</b>
                  {isAr ? f.nextStep.ar : f.nextStep.en}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="notice">
            {isAr
              ? '✅ لا توجد تنبيهات تعارض أو تكرار مادة فعالة حرجة بين الأدوية المسجلة حالياً في ملفك الصحي. تذكر دائماً أن عدم وجود تنبيه آلي لا يغني عن مراجعة الطبيب أو الصيدلي.'
              : '✅ No active duplicate-ingredient or interaction alerts detected among your currently listed medications. Always verify new prescriptions with your doctor or pharmacist.'}
          </div>
        )}
      </section>

      {/* 5. Two-Column Grid: Health Profile Overview + Current Medications & Reminders */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Health Profile Overview */}
        <section className="dawaya-section-card stack">
          <div className="head">
            <h2 style={{ margin: 0 }}>
              👤 {isAr ? 'ملخص الملف الصحي الشخصي' : 'Health Profile Overview'}
            </h2>
            <Link to="/health-profile" className="btn small">
              {isAr ? 'تعديل الملف الصحي' : 'Edit Profile'}
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
            }}
          >
            <div className="subcard">
              <span className="small muted">{isAr ? 'الاسم والسن' : 'Name & Age'}</span>
              <b>
                {profile.displayName || profile.fullName || patientDisplayName} •{' '}
                {profile.age || profile.ageYears
                  ? `${profile.age || profile.ageYears} ${isAr ? 'سنة' : 'yrs'}`
                  : isAr
                  ? 'غير محدد'
                  : 'Unset'}
              </b>
            </div>
            <div className="subcard">
              <span className="small muted">{isAr ? 'الوزن وفصيلة الدم' : 'Weight & Blood Type'}</span>
              <b>
                {profile.weightKg ? `${profile.weightKg} kg` : '—'} •{' '}
                {profile.bloodType && profile.bloodType !== 'unknown'
                  ? profile.bloodType
                  : isAr
                  ? 'غير محدد'
                  : 'Unset'}
              </b>
            </div>
            <div className="subcard">
              <span className="small muted">{isAr ? 'وظائف الكلى والكبد' : 'Renal & Hepatic Status'}</span>
              <b>
                {profile.renalStatus === 'impaired' || profile.hepaticStatus === 'impaired'
                  ? isAr
                    ? '⚠️ يوجد قصور مسجل (يتطلب ضبط الجرعات)'
                    : '⚠️ Impairment noted'
                  : isAr
                  ? 'طبيعي / غير مسجل قصور'
                  : 'Normal / Unspecified'}
              </b>
            </div>
            <div className="subcard">
              <span className="small muted">{isAr ? 'الحمل والرضاعة' : 'Pregnancy & Lactation'}</span>
              <b>
                {profile.pregnancyStatus === 'pregnant'
                  ? isAr
                    ? '🤰 حامل (حماية الحمل نشطة)'
                    : '🤰 Pregnant'
                  : profile.pregnancyStatus === 'breastfeeding' ||
                    profile.breastfeedingStatus === 'breastfeeding'
                  ? isAr
                    ? '🤱 مرضعة (حماية الرضاعة نشطة)'
                    : '🤱 Breastfeeding'
                  : isAr
                  ? 'غير منطبق'
                  : 'Not applicable'}
              </b>
            </div>
          </div>

          <div>
            <b className="small">{isAr ? 'الأمراض والحالات المزمنة المسجلة:' : 'Chronic Conditions:'}</b>
            <div className="chips" style={{ marginTop: '6px' }}>
              {(profile.chronicConditions || []).length > 0 ? (
                profile.chronicConditions!.map((c) => (
                  <span key={c.id} className="badge" style={{ padding: '4px 12px' }}>
                    🩺 {c.conditionName}
                  </span>
                ))
              ) : (
                <span className="small muted">
                  {isAr ? 'لم يتم تسجيل أمراض مزمنة بعد.' : 'No chronic conditions listed.'}
                </span>
              )}
            </div>
          </div>

          <div>
            <b className="small">{isAr ? 'الأدوية الحالية في الملف الصحي:' : 'Current Profile Medications:'}</b>
            {activeProfileMeds.length > 0 ? (
              <div className="stack" style={{ gap: '8px', marginTop: '6px' }}>
                {activeProfileMeds.map((med) => (
                  <div key={med.id} className="card rowcard" style={{ padding: '10px 12px' }}>
                    <div>
                      <b>💊 {med.drugName}</b>
                      {med.prescribedDose && (
                        <span className="small muted"> — {med.prescribedDose}</span>
                      )}
                    </div>
                    <span className="badge">{formatFrequencyLabel(med.frequency, isAr)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="small muted" style={{ margin: '6px 0 0' }}>
                {isAr
                  ? 'لا توجد أدوية حالية مضافة في الملف الصحي.'
                  : 'No current medications added to your profile yet.'}
              </p>
            )}
          </div>
        </section>

        {/* Upcoming Medication Reminders & Active Courses */}
        <section className="dawaya-section-card stack">
          <div className="head">
            <h2 style={{ margin: 0 }}>
              ⏰ {isAr ? 'منبهات الجرعات القادمة والكورسات' : 'Upcoming Medication Reminders'}
            </h2>
            <Link to="/tracker" className="btn small">
              {isAr ? 'إضافة منبه دواء' : 'Add Reminder'}
            </Link>
          </div>

          {upcomingDoses.length > 0 ? (
            <div className="stack" style={{ gap: '8px' }}>
              {upcomingDoses.map((d) => (
                <div
                  key={d.doseId}
                  className="card rowcard"
                  style={{
                    padding: '10px 14px',
                    borderInlineStart:
                      d.status === 'unconfirmed'
                        ? '4px solid #D97706'
                        : '4px solid #24C8B8',
                  }}
                >
                  <div>
                    <b>💊 {d.medicineName}</b>{' '}
                    <span className="small muted">({d.prescribedDose})</span>
                    <div className="small muted">
                      📅 {d.scheduledDate} • 🕒 {formatTime12Hour(d.scheduledTime, isAr)}
                    </div>
                  </div>
                  <div className="row wrapRow" style={{ gap: '6px' }}>
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => updateDoseStatus(d.scheduleId, d.doseId, 'taken')}
                    >
                      ✓ {isAr ? 'تم أخذها' : 'Taken'}
                    </button>
                    <Link to="/tracker" className="btn small ghost">
                      {isAr ? 'الجدول' : 'Tracker'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="subcard">
              <p className="small muted" style={{ margin: 0 }}>
                {isAr
                  ? 'لا توجد جرعات مجدولة قادمة حالياً. يمكنك إنشاء جدول جرعات ذكي مع منبهات من رادار الروشتة أو متابع الجرعات.'
                  : 'No upcoming scheduled doses right now. Create a medication schedule from Prescription Radar or Dose Tracker.'}
              </p>
            </div>
          )}

          {schedules.length > 0 && (
            <div>
              <b className="small">{isAr ? 'تقدم الكورسات العلاجية النشطة:' : 'Active Treatment Schedules:'}</b>
              <div className="stack" style={{ gap: '8px', marginTop: '6px' }}>
                {schedules.slice(0, 3).map((sch) => {
                  const prog = calculateScheduleProgress(sch);
                  return (
                    <div key={sch.id} className="subcard">
                      <div className="row wrapRow" style={{ justifyContent: 'space-between' }}>
                        <b>{sch.medicineName}</b>
                        <span className="badge approved">
                          {prog.takenCount}/{prog.totalDoses} ({prog.progressPercent}%)
                        </span>
                      </div>
                      <div className="small muted">
                        {formatFrequencyLabel(sch.frequency, isAr)} • {sch.startDate} → {sch.endDate}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 6. Prescription Overview, Recent Health Activity & AI Assistant Access */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Prescription Overview */}
        <section className="dawaya-section-card stack">
          <div className="head">
            <h2 style={{ margin: 0 }}>
              📡 {isAr ? 'نظرة عامة على الروشتات' : 'Prescription Overview'}
            </h2>
            <Link to="/prescription-radar" className="btn small ghost">
              {isAr ? 'رادار الروشتة' : 'Rx Radar'}
            </Link>
          </div>
          {prescriptions.length > 0 ? (
            <div className="stack" style={{ gap: '8px' }}>
              {prescriptions.slice(0, 4).map((rx) => (
                <div key={rx.id} className="subcard">
                  <div className="row wrapRow" style={{ justifyContent: 'space-between' }}>
                    <b>📄 {rx.medicineName}</b>
                    <span className="badge">
                      {rx.verifiedByPatient
                        ? isAr
                          ? '✅ موثقة'
                          : '✅ Verified'
                        : isAr
                        ? '⚠️ قيد المراجعة'
                        : '⚠️ Pending Review'}
                    </span>
                  </div>
                  <div className="small muted">
                    {rx.prescribedDose} • {formatFrequencyLabel(rx.frequency, isAr)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="small muted">
              {isAr
                ? 'لا توجد روشتات محفوظة بعد. ارفع صورة روشتتك في الأعلى أو في رادار الروشتة لاستخراج الأدوية ومواعيدها ومراجعتها قبل الحفظ.'
                : 'No saved prescriptions yet. Upload a prescription image above or in Prescription Radar to extract and review medications.'}
            </p>
          )}
        </section>

        {/* Recent Health Activity */}
        <section className="dawaya-section-card stack">
          <div className="head">
            <h2 style={{ margin: 0 }}>
              📋 {isAr ? 'النشاط الصحي الأخير' : 'Recent Health Activity'}
            </h2>
            <Link to="/tracker" className="btn small ghost">
              {isAr ? 'السجل الكامل' : 'Full Log'}
            </Link>
          </div>
          {treatmentEvents.length > 0 ? (
            <div className="stack" style={{ gap: '8px' }}>
              {treatmentEvents.slice(0, 4).map((ev) => (
                <div key={ev.id} className="subcard">
                  <b>{ev.medicineName}</b>
                  <div className="small muted">
                    {isAr ? ev.summaryAr : ev.summaryEn} • {formatTimestampReadable(ev.timestamp, isAr)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="small muted">
              {isAr
                ? 'سيظهر هنا سجل الجرعات المأخوذة والتعديلات الموثقة زمنياً.'
                : 'Your chronological dose logs and treatment events will appear here.'}
            </p>
          )}
        </section>

        {/* AI Assistant Quick Access Card */}
        <section
          className="dawaya-section-card stack"
          style={{
            background: 'linear-gradient(135deg, #101E36 0%, #162A4A 100%)',
            color: '#FFFFFF',
          }}
        >
          <h2 style={{ color: '#FFFFFF', margin: 0 }}>
            🤖 {isAr ? 'مساعد دوايا الذكي (DAWAYA AI)' : 'DAWAYA AI Assistant'}
          </h2>
          <p className="small" style={{ color: '#9AE8E8', margin: 0 }}>
            {isAr
              ? 'متصل بملفك الصحي المصرّح به وقاعدة بيانات الأدوية الكاملة (26,562+ دواء). يطلب تأكيدك دائماً قبل إضافة أي دواء أو منبه.'
              : 'Connected to your authorized Health Profile and the 26,562+ medicine database. Always asks for confirmation before changes.'}
          </p>
          <div className="stack" style={{ gap: '6px' }}>
            <Link
              to="/assistant"
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #138866 0%, #24C8B8 100%)',
                borderColor: '#138866',
                color: '#101E36',
                fontWeight: 800,
              }}
            >
              💬 {isAr ? 'فتح المحادثة الذكية ورفع الروشتة' : 'Open AI Assistant & Rx Vision'}
            </Link>
            <Link to="/pharmacies" className="btn light small">
              🏥 {isAr ? 'البحث عن أقرب صيدلية معتمدة' : 'Find Nearby Participating Pharmacies'}
            </Link>
            <Link to="/green-prescription" className="btn light small">
              🌿 {isAr ? 'الروشتة الخضراء والرعاية غير الدوائية' : 'Green Prescription & Non-Drug Care'}
            </Link>
          </div>
        </section>
      </div>

      {!loaded && (
        <div className="small muted center">
          {isAr
            ? 'جارٍ مزامنة فهرس الأدوية الشامل في الخلفية...'
            : 'Synchronizing full medicine index in background...'}
        </div>
      )}

      <Disclaimer />
    </main>
  );
}
