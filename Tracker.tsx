import SmartChoiceSelect from './SmartChoiceSelect';
import { evaluateDrugHydrationRequirement } from './medicationSafetyEngine';
import { useDawayaDrugDatabase } from './dawayaDrugDatabaseService';
import SmartDoseAlarmCard from './SmartDoseAlarmCard';
import { createPortal } from 'react-dom';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { useApproved } from './medicinesApi';
import { useSyncedHealthProfile } from './allergyData';
import {
  analyzePrescriptionImageWithVision,
  PrescriptionOcrExtractionResult,
} from './geminiApi';
import { pick } from './types';
import { triggerTestAlarm, openNativeSystemClockAlarm } from './nativeAlarmService';
import {
  TreatmentSchedule,
  ScheduledDose,
  SavedPrescription,
  DoseStatus,
  DoseDocumentedOutcome,
  PrescriptionCaptureMethod,
  useSyncedSchedules,
  useDoseReminderNotifications,
  validatePrescriptionInstructions,
  generateScheduleDoses,
  getDoseStatus,
  calculateScheduleProgress,
  formatLocalDateYYYYMMDD,
  computeEndDate,
  calculateAutoDoseTimes,
  formatTime12Hour,
  formatTimestampReadable,
  formatRouteLabel,
  formatFrequencyLabel,
  formatVerificationStatusLabel,
  formatCaptureMethodLabel,
  formatDocumentedOutcomeLabel,
  downloadScheduleIcs,
  downloadTreatmentReportJson,
} from './trackerData';


function SmartHydrationGuardTrackerWidget({
  schedules,
  profileMeds,
  isAr,
}: {
  schedules: TreatmentSchedule[];
  profileMeds: string[];
  isAr: boolean;
}) {
  const todayKey = `dawaya_water_cups_${formatLocalDateYYYYMMDD()}`;
  const [cupsDrank, setCupsDrank] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      return saved ? Math.min(8, Math.max(0, parseInt(saved, 10) || 0)) : 0;
    } catch {
      return 0;
    }
  });
  const [alarmToast, setAlarmToast] = useState<string>('');

  const updateCups = (next: number) => {
    const clamped = Math.min(8, Math.max(0, next));
    setCupsDrank(clamped);
    try {
      localStorage.setItem(todayKey, String(clamped));
    } catch {
      /* ignore */
    }
  };

  // Detect any active medication requiring mandatory hydration
  const allActiveNames = [
    ...schedules.map((s) => s.medicineName),
    ...profileMeds,
  ].filter(Boolean);

  const hydrationAlerts = allActiveNames
    .map((name) => ({ name, req: evaluateDrugHydrationRequirement([name]) }))
    .filter((item): item is { name: string; req: NonNullable<ReturnType<typeof evaluateDrugHydrationRequirement>> } => Boolean(item.req));

  return (
    <section
      className="card no-print"
      style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(14, 165, 233, 0.14) 100%)',
        border: '2px solid #0284c7',
        borderRadius: '20px',
        padding: '18px 20px',
        marginBottom: '16px',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
            }}
          >
            💧
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 900, color: '#0369a1' }}>
              {isAr ? 'منبه وحارس شرب الماء الإجباري مع الأدوية (Smart Hydration Guard)' : 'Smart Medication Hydration Guard'}
            </h3>
            <p className="small" style={{ margin: '2px 0 0', opacity: 0.85, fontWeight: 600 }}>
              {isAr
                ? 'اضغط على الأكواب لتسجيل شرب الماء اليومي (8 أكواب = 2 لتر) لحماية الكلى والمريء من ترسبات الأدوية:'
                : 'Tap glasses to log your daily 8 cups of water and protect your kidneys & esophagus:'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn small"
            style={{
              background: '#0284c7',
              borderColor: '#0284c7',
              color: '#ffffff',
              borderRadius: '999px',
              fontWeight: 800,
              padding: '7px 14px',
            }}
            onClick={() => {
              const res = openNativeSystemClockAlarm(
                isAr ? '💧 منبه شرب كوبين ماء مع الدواء' : '💧 Drink 2 Glasses of Water',
                isAr ? 'حارس دوايا الذكي لحماية الكلى والمريء' : 'DAWAYA Hydration Guard',
                '10:00',
                isAr
              );
              setAlarmToast(res.message);
              setTimeout(() => setAlarmToast(''), 4000);
            }}
          >
            ⏰ {isAr ? 'ضبط منبه شرب الماء بالموبايل' : 'Set Phone Water Alarm'}
          </button>
          <span
            style={{
              background: cupsDrank >= 8 ? '#dcfce7' : '#e0f2fe',
              color: cupsDrank >= 8 ? '#15803d' : '#0369a1',
              border: `1.5px solid ${cupsDrank >= 8 ? '#86efac' : '#7dd3fc'}`,
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '0.88rem',
            }}
          >
            {cupsDrank} / 8 {isAr ? 'أكواب اليوم' : 'Cups Today'} {cupsDrank >= 8 ? '🎉' : ''}
          </span>
        </div>
      </div>

      {/* Interactive 8 Water Glasses Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
          gap: '8px',
          marginBottom: hydrationAlerts.length > 0 ? '14px' : '4px',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((cupNum) => {
          const filled = cupNum <= cupsDrank;
          return (
            <button
              key={cupNum}
              type="button"
              onClick={() => updateCups(cupNum === cupsDrank ? cupNum - 1 : cupNum)}
              style={{
                padding: '10px 6px',
                borderRadius: '14px',
                border: filled ? '2px solid #0284c7' : '1.5px dashed #94a3b8',
                background: filled
                  ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                  : 'var(--card-bg, #ffffff)',
                color: filled ? '#ffffff' : 'var(--ink, #0D1F38)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 800,
                fontSize: '0.78rem',
                transition: 'all 0.18s ease',
                boxShadow: filled ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none',
                transform: filled ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: '1.35rem' }}>{filled ? '🥤' : '🥛'}</span>
              <span>{isAr ? `كوب ${cupNum}` : `Cup ${cupNum}`}</span>
              <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>250 ml</span>
            </button>
          );
        })}
      </div>

      {alarmToast && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: '#dcfce7',
            color: '#166534',
            fontWeight: 700,
            fontSize: '0.84rem',
          }}
        >
          ✅ {alarmToast}
        </div>
      )}

      {/* Specific Active Medications Requiring Mandatory Water */}
      {hydrationAlerts.length > 0 && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.75)',
            border: '1.5px solid #38bdf8',
          }}
        >
          <strong style={{ fontSize: '0.88rem', color: '#0369a1', display: 'block', marginBottom: '6px' }}>
            🚨 {isAr ? 'أدوية مسجلة في جدولك تشترط شرب كوبين ماء كاملين مع كل جرعة:' : 'Your Active Medications Requiring 2 Full Glasses of Water:'}
          </strong>
          <div style={{ display: 'grid', gap: '6px' }}>
            {hydrationAlerts.map((item, idx) => (
              <div key={idx} style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                • <b>{item.name}:</b> {isAr ? item.req.titleAr : item.req.titleEn} —{' '}
                <span style={{ color: '#475569', fontWeight: 600 }}>
                  {isAr ? item.req.reasonAr : item.req.reasonEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Tracker() {
  const { lang } = useLang();
  const { indexItems: dawayaIndexItems } = useDawayaDrugDatabase();
  const isAr = lang === 'ar';
  const { user, openAuthModal } = useAuth();
  const { profile } = useSyncedHealthProfile();
  const { items } = useApproved();
  const meds = items ?? [];

  const {
    schedules,
    setSchedules,
    deleteScheduleById,
    updateDoseStatus,
    prescriptions,
    setPrescriptions,
    deletePrescriptionById,
    treatmentEvents,
    recordTreatmentEvents,
    initialLoading,
    syncStatus,
    syncError,
    lastSyncedAt,
    retrySync,
    isAuthenticated,
  } = useSyncedSchedules();

  const {
    notifSupported,
    notifPermission,
    notifError,
    activeDueBanner,
    setActiveDueBanner,
    requestNotifPermission,
    sendTestNotification,
  } = useDoseReminderNotifications(schedules, isAr);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string>(() => new Date().toISOString());

  // Form states
  const [medName, setMedName] = useState('');
  const [antibioticId, setAntibioticId] = useState<string | undefined>(undefined);
  const [prescribedDose, setPrescribedDose] = useState('');
  const [route, setRoute] = useState('oral');
  const [firstDoseTime, setFirstDoseTime] = useState('08:00');
  const [frequency, setFrequency] = useState('twice_daily');
  const [doseTimes, setDoseTimes] = useState<string[]>(['08:00', '20:00']);
  const [startDate, setStartDate] = useState(() => formatLocalDateYYYYMMDD());
  const [durationDays, setDurationDays] = useState<number | ''>(7);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Prescription Capture & OCR / Verification states
  const [captureMethod, setCaptureMethod] = useState<PrescriptionCaptureMethod>('manual_entry');
  const [isOcrUnverified, setIsOcrUnverified] = useState(false);
  const [verifiedByPatient, setVerifiedByPatient] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [ocrFileName, setOcrFileName] = useState<string>('');
  const [ocrExtraction, setOcrExtraction] = useState<PrescriptionOcrExtractionResult | null>(null);
  const [rawExtractedText, setRawExtractedText] = useState<string>('');

  // Dose documentation modal & duplicate guard feedback banner
  const [doseFeedbackBanner, setDoseFeedbackBanner] = useState<{
    type: 'warning' | 'success';
    text: string;
  } | null>(null);
  const [docModalTarget, setDocModalTarget] = useState<{
    scheduleId: string;
    dose: ScheduledDose;
    medicineName: string;
  } | null>(null);
  const [docModalStatus, setDocModalStatus] = useState<'taken' | 'missed'>('taken');
  const [docModalOutcome, setDocModalOutcome] = useState<DoseDocumentedOutcome>('taken_on_time');
  const [docModalNote, setDocModalNote] = useState('');

  const liveValidation = useMemo(
    () =>
      validatePrescriptionInstructions(
        {
          antibioticId,
          medicineName: medName,
          prescribedDose,
          route,
          frequency,
          doseTimes,
          durationDays: durationDays === '' ? null : Number(durationDays),
          notes,
          rawExtractedText,
          isOcrUnverified,
          verifiedByPatient,
          editingScheduleId,
        },
        schedules,
        profile.allergies
      ),
    [
      antibioticId,
      medName,
      prescribedDose,
      route,
      frequency,
      doseTimes,
      durationDays,
      notes,
      rawExtractedText,
      isOcrUnverified,
      verifiedByPatient,
      editingScheduleId,
      schedules,
      profile.allergies,
    ]
  );

  // Auto-calculate all dose times when either First Dose Start Time or Frequency (dose count) changes
  const handleFirstDoseTimeChange = (newStart: string) => {
    setFirstDoseTime(newStart);
    if (frequency) {
      setDoseTimes(calculateAutoDoseTimes(newStart, frequency));
    }
  };

  const handleFrequencyChange = (freq: string) => {
    setFrequency(freq);
    if (freq) {
      setDoseTimes(calculateAutoDoseTimes(firstDoseTime, freq));
    } else {
      setDoseTimes([]);
    }
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...doseTimes];
    updated[index] = val;
    if (index === 0) {
      setFirstDoseTime(val);
    }
    setDoseTimes(updated);
  };

  const handlePrescriptionImageChange = async (
    e: ChangeEvent<HTMLInputElement>,
    method: 'ocr_upload' | 'camera_capture'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCaptureMethod(method);
    setIsOcrUnverified(true);
    setVerifiedByPatient(false);
    setOcrError(null);
    setOcrFileName(file.name);
    setOcrLoading(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
        reader.readAsDataURL(file);
      });

      setOcrPreviewUrl(dataUrl);
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const mimeType = file.type || 'image/jpeg';

      const extracted = await analyzePrescriptionImageWithVision(base64Data, mimeType, lang, file.name);
      setOcrExtraction(extracted);
      setRawExtractedText(extracted.rawExtractedText);

      setAntibioticId(extracted.matchedIngredientId || undefined);
      setMedName(extracted.detectedDrugName || '');
      setPrescribedDose(extracted.extractedDoseText || '');
      setRoute(extracted.extractedRoute || '');
      setFrequency(extracted.extractedFrequencyKey || '');
      if (extracted.extractedFrequencyKey) {
        setDoseTimes(calculateAutoDoseTimes(firstDoseTime, extracted.extractedFrequencyKey));
      } else {
        setDoseTimes([]);
      }
      setDurationDays(extracted.extractedDurationDays !== null ? extracted.extractedDurationDays : '');
      setNotes(extracted.extractedNotes || '');

      recordTreatmentEvents([
        {
          type: 'ocr_extracted_unverified',
          medicineName: extracted.detectedDrugName || (isAr ? 'روشتة مصورة' : 'Captured Prescription'),
          summaryAr: `📷 تم استخراج بيانات أولية غير موثّقة من صورة الروشتة (${file.name}) — بانتظار المراجعة والتوثيق اليدوي قبل الجدولة.`,
          summaryEn: `📷 Extracted unverified prescription details from image (${file.name}) — awaiting patient/clinician verification before scheduling.`,
        },
      ]);
    } catch {
      setOcrError(
        isAr
          ? 'تعذّر قراءة النص تلقائياً من صورة الروشتة. تم تفعيل الإدخال اليدوي البديل — يرجى إدخال التعليمات المكتوبة في الروشتة ومراجعتها مع الصيدلي.'
          : 'Could not automatically extract readable text from the prescription image. Manual entry fallback is active — please enter the written instructions and verify with your pharmacist.'
      );
      setMedName('');
      setPrescribedDose('');
      setRoute('');
      setFrequency('');
      setDoseTimes([]);
      setDurationDays('');
    } finally {
      setOcrLoading(false);
      e.target.value = '';
    }
  };

  const handleSaveUnverifiedPrescriptionOnly = () => {
    const nowIso = new Date().toISOString();
    const rxId =
      editingPrescriptionId || `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const status = liveValidation.hasBlockingFlags
      ? 'needs_clarification'
      : isOcrUnverified
        ? 'unverified_ocr'
        : 'needs_clarification';

    const savedRx: SavedPrescription = {
      id: rxId,
      ...(antibioticId ? { antibioticId } : {}),
      medicineName: medName.trim() || (isAr ? 'روشتة غير مكتملة البيانات' : 'Incomplete Prescription'),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency,
      firstDoseTime,
      doseTimes,
      startDate,
      durationDays: durationDays === '' ? null : Number(durationDays),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      captureMethod,
      ...(rawExtractedText.trim() ? { rawExtractedText: rawExtractedText.trim() } : {}),
      ...(ocrFileName ? { imageFileName: ocrFileName } : {}),
      isOcrUnverified,
      verificationStatus: status,
      verifiedByPatient: false,
      clarificationFlags: liveValidation.flags,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setPrescriptions(
      (prev) => {
        const exists = prev.some((p) => p.id === rxId);
        return exists ? prev.map((p) => (p.id === rxId ? savedRx : p)) : [savedRx, ...prev];
      },
      {
        type: liveValidation.hasBlockingFlags ? 'clarification_flagged' : 'prescription_captured',
        prescriptionId: rxId,
        medicineName: savedRx.medicineName,
        summaryAr: liveValidation.hasBlockingFlags
          ? `🚨 تم حفظ الروشتة (${savedRx.medicineName}) بحالة «تحتاج لتوضيح من الطبيب/الصيدلي» بدون تفعيل جدول جرعات.`
          : `📋 تم حفظ الروشتة (${savedRx.medicineName}) كمسودة غير موثّقة لمراجعتها قبل الجدولة.`,
        summaryEn: liveValidation.hasBlockingFlags
          ? `🚨 Saved prescription (${savedRx.medicineName}) as "Flagged for Professional Clarification" without scheduling doses.`
          : `📋 Saved prescription (${savedRx.medicineName}) as unverified draft pending verification.`,
      }
    );

    setShowAddModal(false);
    setEditingPrescriptionId(null);
    setEditingScheduleId(null);
    resetForm();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (liveValidation.hasBlockingFlags) {
      const firstFlag = liveValidation.blockingFlags[0];
      setFormError(
        isAr
          ? `لا يمكن تفعيل جدول الجرعات قبل معالجة الملاحظات السريرية: ${firstFlag.messageAr}`
          : `Cannot activate treatment schedule until blocking issues are resolved: ${firstFlag.messageEn}`
      );
      return;
    }

    if (!verifiedByPatient) {
      setFormError(
        isAr
          ? 'يرجى وضع علامة التأكيد بأنك راجعت التعليمات والجرعة من الروشتة الورقية أو مع الطبيب/الصيدلي قبل تفعيل الجدول.'
          : 'Please check the verification box confirming that you have verified these instructions against your physical prescription before scheduling.'
      );
      return;
    }

    setFormError('');
    const nowIso = new Date().toISOString();
    const numericDuration = Number(durationDays);
    const id = editingScheduleId || `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const rxId =
      editingPrescriptionId || `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const endDateStr = computeEndDate(startDate, numericDuration);

    const existing = editingScheduleId ? schedules.find((s) => s.id === editingScheduleId) : undefined;
    const finalDoses = generateScheduleDoses(
      id,
      startDate,
      doseTimes,
      numericDuration,
      existing?.doses
    );

    const verifiedRx: SavedPrescription = {
      id: rxId,
      ...(antibioticId || existing?.antibioticId
        ? { antibioticId: antibioticId || existing?.antibioticId }
        : {}),
      medicineName: medName.trim(),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency,
      firstDoseTime,
      doseTimes,
      startDate,
      durationDays: numericDuration,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      captureMethod,
      ...(rawExtractedText.trim() ? { rawExtractedText: rawExtractedText.trim() } : {}),
      ...(ocrFileName ? { imageFileName: ocrFileName } : {}),
      isOcrUnverified: false,
      verificationStatus: 'verified_by_patient',
      verifiedAt: nowIso,
      verifiedByPatient: true,
      clarificationFlags: liveValidation.warningFlags,
      linkedScheduleId: id,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    const newSchedule: TreatmentSchedule = {
      id,
      prescriptionId: rxId,
      ...(antibioticId || existing?.antibioticId
        ? { antibioticId: antibioticId || existing?.antibioticId }
        : {}),
      medicineName: medName.trim(),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency,
      firstDoseTime,
      doseTimes,
      startDate,
      durationDays: numericDuration,
      endDate: endDateStr,
      notes: notes.trim(),
      ...(existing?.coMedications ? { coMedications: existing.coMedications } : {}),
      captureMethod,
      verificationStatus: 'verified_by_patient',
      verifiedAt: nowIso,
      verifiedByPatient: true,
      clarificationFlags: liveValidation.warningFlags,
      ...(rawExtractedText.trim() ? { rawExtractedText: rawExtractedText.trim() } : {}),
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      doses: finalDoses,
    };

    setPrescriptions((prev) => {
      const exists = prev.some((p) => p.id === rxId);
      return exists ? prev.map((p) => (p.id === rxId ? verifiedRx : p)) : [verifiedRx, ...prev];
    });

    const eventsToLog = [
      {
        type: 'prescription_verified' as const,
        prescriptionId: rxId,
        scheduleId: id,
        medicineName: newSchedule.medicineName,
        summaryAr: `✅ تم التحقق من تعليمات الروشتة للدواء (${newSchedule.medicineName} — ${newSchedule.prescribedDose}) وتوثيقها بواسطة المريض.`,
        summaryEn: `✅ Verified prescription instructions for (${newSchedule.medicineName} — ${newSchedule.prescribedDose}).`,
      },
      {
        type: editingScheduleId ? ('schedule_updated' as const) : ('schedule_created' as const),
        prescriptionId: rxId,
        scheduleId: id,
        medicineName: newSchedule.medicineName,
        summaryAr: editingScheduleId
          ? `🗓️ تم تحديث جدول الجرعات للدواء (${newSchedule.medicineName}) لمدة ${newSchedule.durationDays} أيام.`
          : `🗓️ تم إنشاء وتفعيل جدول الجرعات للدواء (${newSchedule.medicineName}) لمدة ${newSchedule.durationDays} أيام (${finalDoses.length} جرعة).`,
        summaryEn: editingScheduleId
          ? `🗓️ Updated treatment schedule for (${newSchedule.medicineName}) for ${newSchedule.durationDays} days.`
          : `🗓️ Created active treatment schedule for (${newSchedule.medicineName}) for ${newSchedule.durationDays} days (${finalDoses.length} doses).`,
      },
    ];

    if (editingScheduleId) {
      setSchedules(
        (prev) => prev.map((s) => (s.id === editingScheduleId ? newSchedule : s)),
        eventsToLog
      );
    } else {
      setSchedules((prev) => [newSchedule, ...prev], eventsToLog);
    }

    setShowAddModal(false);
    setEditingScheduleId(null);
    setEditingPrescriptionId(null);
    resetForm();
  };

  const resetForm = (initialMethod: PrescriptionCaptureMethod = 'manual_entry') => {
    setMedName('');
    setAntibioticId(undefined);
    setPrescribedDose('');
    setFirstDoseTime('08:00');
    setStartDate(formatLocalDateYYYYMMDD());
    setNotes('');
    setFormError('');
    setCaptureMethod(initialMethod);
    setOcrError(null);
    setOcrExtraction(null);
    setOcrPreviewUrl(null);
    setOcrFileName('');
    setRawExtractedText('');

    if (initialMethod === 'ocr_upload' || initialMethod === 'camera_capture') {
      setRoute('');
      setFrequency('');
      setDoseTimes([]);
      setDurationDays('');
      setIsOcrUnverified(true);
      setVerifiedByPatient(false);
    } else {
      setRoute('oral');
      setFrequency('twice_daily');
      setDoseTimes(['08:00', '20:00']);
      setDurationDays(7);
      setIsOcrUnverified(false);
      setVerifiedByPatient(false);
    }
  };

  const openEdit = (sch: TreatmentSchedule) => {
    setEditingScheduleId(sch.id);
    setEditingPrescriptionId(sch.prescriptionId || null);
    setAntibioticId(sch.antibioticId);
    setMedName(sch.medicineName);
    setPrescribedDose(sch.prescribedDose);
    setRoute(sch.route);
    setFirstDoseTime(sch.firstDoseTime || sch.doseTimes[0] || '08:00');
    setFrequency(sch.frequency);
    setDoseTimes(sch.doseTimes);
    setStartDate(sch.startDate);
    setDurationDays(sch.durationDays);
    setNotes(sch.notes || '');
    setCaptureMethod(sch.captureMethod || 'manual_entry');
    setIsOcrUnverified(sch.verificationStatus === 'unverified_ocr');
    setVerifiedByPatient(sch.verificationStatus === 'verified_by_patient' || Boolean(sch.verifiedByPatient));
    setRawExtractedText(sch.rawExtractedText || '');
    setOcrExtraction(null);
    setOcrError(null);
    setFormError('');
    setShowAddModal(true);
  };

  const openVerifySavedPrescription = (rx: SavedPrescription) => {
    setEditingPrescriptionId(rx.id);
    setEditingScheduleId(rx.linkedScheduleId || null);
    setAntibioticId(rx.antibioticId);
    setMedName(rx.medicineName);
    setPrescribedDose(rx.prescribedDose);
    setRoute(rx.route || '');
    setFrequency(rx.frequency || '');
    const startT = rx.firstDoseTime || rx.doseTimes?.[0] || '08:00';
    setFirstDoseTime(startT);
    setDoseTimes(
      rx.doseTimes && rx.doseTimes.length > 0
        ? rx.doseTimes
        : rx.frequency
          ? calculateAutoDoseTimes(startT, rx.frequency)
          : []
    );
    setStartDate(rx.startDate || formatLocalDateYYYYMMDD());
    setDurationDays(rx.durationDays !== null ? rx.durationDays : '');
    setNotes(rx.notes || '');
    setCaptureMethod(rx.captureMethod);
    setIsOcrUnverified(rx.isOcrUnverified);
    setVerifiedByPatient(Boolean(rx.verifiedByPatient));
    setRawExtractedText(rx.rawExtractedText || '');
    setOcrFileName(rx.imageFileName || '');
    setOcrExtraction(null);
    setOcrError(null);
    setFormError('');
    setShowAddModal(true);
  };

  const handleDoseAction = (
    scheduleId: string,
    doseId: string,
    newStatus: DoseStatus,
    options?: {
      note?: string;
      documentedOutcome?: DoseDocumentedOutcome;
    }
  ) => {
    const res = updateDoseStatus(scheduleId, doseId, newStatus, options);
    if (!res.updated && (res.messageAr || res.messageEn)) {
      setDoseFeedbackBanner({
        type: 'warning',
        text: isAr ? res.messageAr || '' : res.messageEn || '',
      });
    } else if (res.updated) {
      setDoseFeedbackBanner(null);
    }
  };

  const openDocumentDoseModal = (
    scheduleId: string,
    dose: ScheduledDose,
    medicineName: string
  ) => {
    setDocModalTarget({ scheduleId, dose, medicineName });
    const currentSt = dose.status === 'missed' ? 'missed' : 'taken';
    setDocModalStatus(currentSt);
    setDocModalOutcome(
      dose.documentedOutcome ||
        (currentSt === 'missed' ? 'held_for_clarification' : 'taken_on_time')
    );
    setDocModalNote(dose.note || '');
  };

  const handleSaveDocumentedDose = (e: FormEvent) => {
    e.preventDefault();
    if (!docModalTarget) return;
    handleDoseAction(docModalTarget.scheduleId, docModalTarget.dose.id, docModalStatus, {
      documentedOutcome: docModalOutcome,
      note: docModalNote,
    });
    setDocModalTarget(null);
  };

  const deleteSchedule = (id: string) => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من حذف هذا الجدول العلاجي؟'
          : 'Are you sure you want to delete this schedule?'
      )
    ) {
      deleteScheduleById(id);
    }
  };

  const handlePrintReport = () => {
    setReportGeneratedAt(new Date().toISOString());
    window.setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleExportReportJson = () => {
    downloadTreatmentReportJson({
      patientName: profile.displayName || user?.displayName || undefined,
      userEmail: user?.email,
      syncStatus,
      prescriptions,
      schedules,
      treatmentEvents,
    });
  };

  const unscheduledPrescriptions = useMemo(
    () =>
      prescriptions.filter(
        (rx) =>
          rx.verificationStatus !== 'verified_by_patient' ||
          !rx.linkedScheduleId ||
          !schedules.some((s) => s.id === rx.linkedScheduleId)
      ),
    [prescriptions, schedules]
  );

  return (
    <main className="wrap stack">
      <header className="page-head no-print">
        <h1>{isAr ? 'متابع كورس العلاج بالمضادات الحيوية' : 'My Antibiotic Treatment Tracker'}</h1>
        <p className="muted">
          {isAr
            ? 'أداة شخصية لمساعدتك في التقاط وتوثيق الروشتة وتنظيم ومتابعة مواعيد جرعات المضاد الحيوي الموصوفة لك ومزامنتها عبر جميع أجهزتك.'
            : 'A personal patient-friendly tool to capture, verify, schedule, and synchronize your prescribed antibiotic doses across all your devices.'}
        </p>
      </header>

      {/* Live Smart Dose Alarm & Voice Reminder */}
      <SmartDoseAlarmCard />

      {/* Active Due Dose Alert Banner (if triggered while open) */}
      {activeDueBanner && (
        <section className="card no-print" style={{ background: '#ecfdf5', border: '2px solid #10b981', color: '#065f46' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <strong>🔔 {activeDueBanner}</strong>
            <button type="button" className="btn-secondary small" onClick={() => setActiveDueBanner(null)}>
              {isAr ? 'إغلاق التنبيه' : 'Dismiss'}
            </button>
          </div>
        </section>
      )}

      {/* Duplicate Dose Event / Safety Feedback Banner */}
      {doseFeedbackBanner && (
        <section
          className="card no-print"
          style={{
            background: doseFeedbackBanner.type === 'warning' ? '#fffbeb' : '#ecfdf5',
            border: `2px solid ${doseFeedbackBanner.type === 'warning' ? '#f59e0b' : '#10b981'}`,
            color: doseFeedbackBanner.type === 'warning' ? '#92400e' : '#065f46',
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <strong>{doseFeedbackBanner.text}</strong>
            <button type="button" className="btn-secondary small" onClick={() => setDoseFeedbackBanner(null)}>
              {isAr ? 'حسناً' : 'OK'}
            </button>
          </div>
        </section>
      )}

      {/* Cloud Sync Status Bar */}
      <section className="no-print">
        {!isAuthenticated ? (
          <div className="radar-sync-bar local">
            <div>
              <strong>
                👤{' '}
                {isAr
                  ? 'وضع الزائر — البيانات محفوظة محلياً على هذا الجهاز فقط'
                  : 'Guest Mode — Data Saved Locally on This Device Only'}
              </strong>
              <p className="small" style={{ margin: '2px 0 0' }}>
                {isAr
                  ? 'سجّل الدخول بحسابك لمزامنة روشتاتك وجداولك العلاجية وسجل جرعاتك عبر جميع أجهزتك.'
                  : 'Sign in with your account to synchronize your prescriptions, schedules, and dose history across devices.'}
              </p>
            </div>
            <button type="button" className="btn small" onClick={() => openAuthModal('login')}>
              🔐 {isAr ? 'تسجيل الدخول للمزامنة' : 'Sign In to Sync'}
            </button>
          </div>
        ) : syncStatus === 'loading' ? (
          <div className="radar-sync-bar loading">
            <strong>
              🔄{' '}
              {isAr
                ? 'جارٍ مزامنة وتحميل جداولك العلاجية من السحابة...'
                : 'Loading and syncing your cloud treatment schedules...'}
            </strong>
          </div>
        ) : syncStatus === 'saving' ? (
          <div className="radar-sync-bar saving">
            <strong>
              ⏳{' '}
              {isAr
                ? 'جارٍ حفظ التعديلات في السحابة...'
                : 'Saving changes to Cloud Firestore...'}
            </strong>
          </div>
        ) : syncStatus === 'offline_pending' ? (
          <div className="radar-sync-bar offline">
            <div>
              <strong>
                📡{' '}
                {isAr
                  ? 'محفوظ محلياً على هذا الجهاز — في انتظار الإنترنت لتأكيد الحفظ السحابي'
                  : 'Saved Locally — Waiting for Internet to Confirm Cloud Sync'}
              </strong>
            </div>
            <button type="button" className="btn-secondary small" onClick={retrySync}>
              🔄 {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : syncStatus === 'error' ? (
          <div className="radar-sync-bar error">
            <div>
              <strong>
                ⚠️{' '}
                {isAr
                  ? 'تعذر تأكيد الحفظ السحابي (محفوظ محلياً على هذا الجهاز فقط)'
                  : 'Cloud Sync Unconfirmed (Saved Locally on This Device Only)'}
              </strong>
              {syncError && <p className="small" style={{ margin: '2px 0 0' }}>{syncError}</p>}
            </div>
            <button type="button" className="btn-secondary small" onClick={retrySync}>
              🔄 {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : (
          <div className="radar-sync-bar synced">
            <strong>
              ☁️{' '}
              {isAr
                ? 'تم تأكيد المزامنة السحابية عبر أجهزتك ✓'
                : 'Confirmed Synced Across Your Devices ✓'}
            </strong>
            <span className="small" style={{ marginInlineStart: '10px' }}>
              ({user?.email || user?.displayName || (isAr ? 'حساب موثق' : 'Authenticated')}
              {lastSyncedAt ? ` · ${formatTimestampReadable(lastSyncedAt, isAr)}` : ''})
            </span>
          </div>
        )}
      </section>

      {/* Clinical safety disclaimer */}
      <section className="notice quick no-print">
        <strong>⚠️ {isAr ? 'تنبيه سريري مهم:' : 'Clinical Safety Note:'} </strong>
        {isAr
          ? 'هذه الأداة لتنظيم الجرعات الموصوفة لك فقط؛ لا تعتمد الـ OCR تلقائياً، ولا تخترع جرعات أو تكراراً أو مدة علاج، ولا تضاعف الجرعات أو تحسب جرعة تعويضية. راجع الطبيب أو الصيدلي دائماً.'
          : 'This tool tracks verified prescriptions only; it never auto-approves OCR, never invents doses/frequencies/durations, and never doubles a dose or calculates replacement doses. Always consult your doctor or pharmacist.'}
      </section>

      {/* Controls & Notifs */}
      <div className="tracker-top-bar no-print">
        <div className="row wrapRow" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => {
              resetForm('manual_entry');
              setEditingScheduleId(null);
              setEditingPrescriptionId(null);
              setShowAddModal(true);
            }}
          >
            ➕ {isAr ? 'إضافة وتوثيق جدول علاج جديد' : 'New Verified Treatment Schedule'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              resetForm('ocr_upload');
              setEditingScheduleId(null);
              setEditingPrescriptionId(null);
              setShowAddModal(true);
            }}
          >
            📷 {isAr ? 'تصوير / رفع صورة روشتة (OCR)' : 'Capture / Upload Rx (OCR)'}
          </button>
          <Link to="/prescription-radar" className="btn-secondary">
            📡 {isAr ? 'فحص الروشتة الكاملة في الرادار' : 'Open Full Prescription Radar'}
          </Link>
          {(schedules.length > 0 || prescriptions.length > 0) && (
            <>
              <button type="button" className="btn-secondary" onClick={handlePrintReport}>
                🖨️ {isAr ? 'طباعة التقرير العلاجي / PDF' : 'Print Treatment Report / PDF'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleExportReportJson}>
                📥 {isAr ? 'تصدير التقرير (JSON)' : 'Export Report (JSON)'}
              </button>
            </>
          )}
        </div>

        <div className="notif-bar" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!notifSupported || notifPermission === 'unsupported' ? (
            <span className="notif-pill">
              ℹ️ {isAr ? 'الإشعارات غير مدعومة (استخدم منبهات .ics)' : 'Notifications Unsupported (Use .ics)'}
            </span>
          ) : notifPermission === 'granted' ? (
            <>
              <span className="notif-pill active">
                🔔 {isAr ? 'التنبيهات مفعلة أثناء فتح المتصفح' : 'Browser Notifications Active'}
              </span>
              <button type="button" className="btn-secondary small" onClick={sendTestNotification}>
                🔔 {isAr ? 'تجربة التنبيه' : 'Test Alert'}
              </button>
            </>
          ) : notifPermission === 'denied' ? (
            <span className="notif-pill" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#f87171' }}>
              🔕 {isAr ? 'الإشعارات محظورة (استخدم منبهات .ics)' : 'Notifications Blocked (Use .ics)'}
            </span>
          ) : (
            <button type="button" className="btn-secondary" onClick={requestNotifPermission}>
              🔔 {isAr ? 'تفعيل تنبيهات المتصفح' : 'Enable Reminders'}
            </button>
          )}
        </div>
      </div>

      {/* Smart Daily Water & Medication Hydration Guard */}
      <SmartHydrationGuardTrackerWidget
        schedules={schedules}
        profileMeds={(profile.medications || []).map((m) => m.drugName)}
        isAr={isAr}
      />

      {/* Reminder Limitations Notice (Priority 5) */}
      <section className="reminder-limitations-box no-print">
        <strong>
          ℹ️ {isAr ? 'توضيح طريقة عمل الإشعارات:' : 'How Dose Notifications Work:'}{' '}
        </strong>
        <span className="small">
          {isAr
            ? 'عند تفعيل الإشعارات، يظهر إشعار منبثق على الشاشة طالما أن المتصفح مفتوح. ولضمان التنبيه حتى عند إغلاق المتصفح، اضغط «📅 منبهات الموبايل (.ics)» في أي جدول لإضافة المواعيد لتقويم ومنبه هاتفك.'
            : 'When enabled, a system notification pops up while the browser remains open. For alarms when the browser is closed, click "📅 Phone Alarms (.ics)" on any schedule.'}
        </span>
        {notifError && (
          <p className="small" style={{ margin: '6px 0 0', color: '#b45309', fontWeight: 700 }}>
            ⚠️ {notifError}
          </p>
        )}
      </section>

      {/* Unverified / Flagged Prescriptions Queue */}
      {unscheduledPrescriptions.length > 0 && (
        <section className="card stack no-print rx-verification-queue-box">
          <h3 style={{ margin: 0 }}>
            📋{' '}
            {isAr
              ? 'روشتات محفوظة بانتظار المراجعة أو استكمال التوضيح الطبي (قبل تفعيل الجدول):'
              : 'Saved Prescriptions Pending Verification or Clarification (Unscheduled):'}
          </h3>
          <div className="stack" style={{ gap: '10px' }}>
            {unscheduledPrescriptions.map((rx) => (
              <div key={rx.id} className="rx-queue-card">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                      <strong>💊 {rx.medicineName || (isAr ? 'دواء غير محدد' : 'Unspecified Medicine')}</strong>
                      <span
                        className={`verification-badge ${
                          rx.verificationStatus === 'needs_clarification' ? 'clarify' : 'unverified'
                        }`}
                      >
                        {formatVerificationStatusLabel(rx.verificationStatus, isAr)}
                      </span>
                      <span className="badge">{formatCaptureMethodLabel(rx.captureMethod, isAr)}</span>
                    </div>
                    <p className="small" style={{ margin: '4px 0 0' }}>
                      <b>{isAr ? 'الجرعة:' : 'Dose:'}</b>{' '}
                      {rx.prescribedDose || (isAr ? 'غير مقروءة/غير محددة' : 'Missing/Unreadable')} ·{' '}
                      <b>{isAr ? 'الطريقة:' : 'Route:'}</b> {formatRouteLabel(rx.route, isAr)} ·{' '}
                      <b>{isAr ? 'التكرار:' : 'Frequency:'}</b> {formatFrequencyLabel(rx.frequency, isAr)}
                    </p>
                    {rx.clarificationFlags.length > 0 && (
                      <ul className="small" style={{ margin: '6px 0 0', paddingInlineStart: '18px', color: '#991b1b' }}>
                        {rx.clarificationFlags.map((fl, idx) => (
                          <li key={idx}>{isAr ? fl.messageAr : fl.messageEn}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="row wrapRow" style={{ gap: '6px' }}>
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => openVerifySavedPrescription(rx)}
                    >
                      🔍 {isAr ? 'مراجعة وتوثيق وتفعيل الجدول' : 'Review, Verify & Schedule'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary danger small"
                      onClick={() => deletePrescriptionById(rx.id)}
                    >
                      🗑️ {isAr ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schedules List with Initial Loading Protection */}
      {initialLoading ? (
        <section className="card stack empty-tracker no-print">
          <span className="empty-icon">☁️</span>
          <h3>
            {isAr
              ? 'جارٍ تحميل جداولك العلاجية من حسابك السحابي...'
              : 'Loading your cloud treatment schedules...'}
          </h3>
          <p className="muted">
            {isAr
              ? 'يرجى الانتظار لحظات بينما نسترجع روشتاتك وسجل الجرعات المسجلة.'
              : 'Please wait while we retrieve your saved prescriptions and dose history.'}
          </p>
        </section>
      ) : schedules.length === 0 ? (
        <section className="card stack empty-tracker no-print">
          <span className="empty-icon">💊</span>
          <h3>{isAr ? 'لا توجد جداول علاجية نشطة حالياً' : 'No Active Treatment Schedules'}</h3>
          <p className="muted">
            {isAr
              ? 'اضغط على زر «إضافة وتوثيق جدول علاج جديد» أو «تصوير / رفع صورة روشتة (OCR)» للتحقق من التعليمات وحساب المواعيد.'
              : 'Click "New Verified Treatment Schedule" or "Capture / Upload Rx (OCR)" to verify your prescription instructions and schedule doses.'}
          </p>
        </section>
      ) : (
        schedules.map((sch) => {
          const {
            totalDoses,
            takenCount,
            missedCount,
            unconfirmedCount,
            upcomingCount,
            progressPercent,
          } = calculateScheduleProgress(sch);

          const dayGroups: Record<number, ScheduledDose[]> = {};
          sch.doses.forEach((d) => {
            if (!dayGroups[d.dayNumber]) dayGroups[d.dayNumber] = [];
            dayGroups[d.dayNumber].push(d);
          });

          return (
            <section key={sch.id} className="card stack schedule-card no-print">
              <div className="schedule-header">
                <div>
                  <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <h2 className="sch-title" style={{ margin: 0 }}>💊 {sch.medicineName}</h2>
                    <span className="verification-badge verified">
                      {formatVerificationStatusLabel(sch.verificationStatus, isAr)}
                    </span>
                    {sch.captureMethod && (
                      <span className="badge">{formatCaptureMethodLabel(sch.captureMethod, isAr)}</span>
                    )}
                  </div>
                  <p className="sch-meta">
                    <b>{isAr ? 'الجرعة:' : 'Dose:'}</b> {sch.prescribedDose} ·{' '}
                    <b>{isAr ? 'طريقة الاستعمال:' : 'Route:'}</b> {formatRouteLabel(sch.route, isAr)} ·{' '}
                    <b>{isAr ? 'المدة:' : 'Duration:'}</b> {sch.durationDays}{' '}
                    {isAr ? 'أيام' : 'days'} ({sch.startDate} → {sch.endDate})
                  </p>
                  <p className="sch-meta" style={{ marginTop: '4px' }}>
                    <b>{isAr ? 'مواعيد الجرعات اليومية:' : 'Scheduled Times:'}</b>{' '}
                    {sch.doseTimes.map((t) => formatTime12Hour(t, isAr)).join(' ، ')}
                  </p>
                  {sch.notes && (
                    <p className="sch-notes">
                      📝 <i>{sch.notes}</i>
                    </p>
                  )}
                </div>
                <div className="sch-actions" style={{ flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary small"
                    onClick={() => downloadScheduleIcs(sch, isAr)}
                  >
                    📅 {isAr ? 'منبهات (.ics)' : 'Alarms (.ics)'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary small"
                    style={{ background: '#eff6ff', borderColor: '#0284c7', color: '#0369a1', fontWeight: 700 }}
                    onClick={() => {
                      const firstTime = sch.doseTimes?.[0] || sch.firstDoseTime || '08:00';
                      const res = openNativeSystemClockAlarm(
                        sch.medicineName,
                        `${sch.prescribedDose}${sch.notes ? ` — ${sch.notes}` : ''}`,
                        firstTime,
                        isAr
                      );
                      setDoseFeedbackBanner({ type: 'success', text: res.message });
                    }}
                    title={isAr ? 'ضبط في تطبيق الساعة/المنبه الأصلي للموبايل' : 'Set in native Phone Clock app'}
                  >
                    ⏰ {isAr ? 'ضبط في منبه الموبايل' : 'Set Phone Clock'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary small"
                    style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#15803d', fontWeight: 700 }}
                    onClick={async () => {
                      const firstTime = sch.doseTimes?.[0] || sch.firstDoseTime || '08:00';
                      const res = await triggerTestAlarm(isAr, {
                        immediate: true,
                        medicineName: sch.medicineName,
                        doseInstruction: `${sch.prescribedDose}${sch.notes ? ` — ${sch.notes}` : ''}`,
                        timeHHMM: firstTime,
                      });
                      setDoseFeedbackBanner({ type: 'success', text: res.message });
                    }}
                    title={isAr ? 'تجربة شاشة ورنين منبه الموبايل الآن' : 'Launch full-screen phone alarm now'}
                  >
                    🚨 {isAr ? 'تجربة شاشة المنبه الآن' : 'Test Phone Alarm'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => openEdit(sch)}>
                    ✏️ {isAr ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary danger"
                    onClick={() => deleteSchedule(sch.id)}
                  >
                    🗑️ {isAr ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Progress Bar & KPI Stats */}
              <div className="kpi-grid">
                <div className="kpi-item">
                  <span className="kpi-num">{totalDoses}</span>
                  <span className="kpi-label">{isAr ? 'إجمالي الجرعات' : 'Total Doses'}</span>
                </div>
                <div className="kpi-item taken">
                  <span className="kpi-num">{takenCount}</span>
                  <span className="kpi-label">{isAr ? 'جرعات تم أخذها ✅' : 'Recorded Taken ✅'}</span>
                </div>
                <div className="kpi-item upcoming">
                  <span className="kpi-num">{upcomingCount}</span>
                  <span className="kpi-label">{isAr ? 'جرعات قادمة ⏳' : 'Upcoming ⏳'}</span>
                </div>
                <div className="kpi-item unconfirmed">
                  <span className="kpi-num">{unconfirmedCount}</span>
                  <span className="kpi-label">
                    {isAr ? 'غير مسجلة (متأخرة غير مؤكدة) ⚠️' : 'Missing Record (Overdue Unconfirmed) ⚠️'}
                  </span>
                </div>
                <div className="kpi-item missed">
                  <span className="kpi-num">{missedCount}</span>
                  <span className="kpi-label">
                    {isAr ? 'فائتة مؤكدة صراحةً ❌' : 'Confirmed Missed ❌'}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="progress-bar-wrap">
                <div className="progress-info">
                  <span>{isAr ? 'نسبة الالتزام المسجلة بالجدول:' : 'Recorded Course Adherence Progress:'}</span>
                  <b>{progressPercent}%</b>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <small className="muted progress-note">
                  {isAr
                    ? '⚠️ تنبيه: نسبة الالتزام تعكس الجرعات المسجلة ولا تعني الشفاء السريري التام. يجب إكمال الكورس حتى آخر جرعة حسب توجيه الطبيب.'
                    : 'Note: Progress percentage reflects recorded doses only, not clinical cure. Always finish the entire prescribed duration.'}
                </small>
              </div>

              {/* Safe Missed / Overdue Dose Guidance Banner (Priority 3) */}
              {(unconfirmedCount > 0 || missedCount > 0) && (
                <div className="unconfirmed-banner">
                  <strong>
                    ⚠️{' '}
                    {isAr
                      ? 'إرشادات السلامة للجرعات غير المسجلة أو الفائتة:'
                      : 'Safe Guidance for Missing Records or Missed Doses:'}{' '}
                  </strong>
                  {isAr
                    ? 'مرور موعد الجرعة يجعلها «متأخرة غير مؤكدة (غير مسجلة)» ولا يعتبرها فائتة تلقائياً. لا تضاعف الجرعة أبداً، ولا تأخذ جرعة إضافية، ولا تقم بتخطي الجرعة أو تعويضها من تلقاء نفسك. راجع الطبيب المعالج أو الصيدلي للحصول على التعليمات الخاصة بدوائك.'
                    : 'A passed scheduled time marks a dose as "Overdue (Unconfirmed — Missing Record)" rather than automatically missed. Never double a dose, take an extra dose, or automatically skip or replace a dose on your own. Contact your prescribing doctor or pharmacist.'}
                </div>
              )}

              {/* Daily Dose Timeline */}
              <div className="timeline-section">
                <h3>📅 {isAr ? 'جدول الجرعات اليومي:' : 'Daily Dose Timeline:'}</h3>
                <div className="timeline-grid">
                  {Object.entries(dayGroups).map(([dayNum, dayDoses]) => (
                    <div key={dayNum} className="day-card">
                      <div className="day-header">
                        <b>{isAr ? `اليوم ${dayNum}` : `Day ${dayNum}`}</b>
                        <span className="day-date">{dayDoses[0]?.scheduledTime.split('T')[0]}</span>
                      </div>
                      <div className="doses-stack">
                        {dayDoses.map((dose) => {
                          const status: DoseStatus = getDoseStatus(dose);
                          const timeDisplay = (dose.scheduledTime.split('T')[1] || '').slice(0, 5);
                          return (
                            <div key={dose.id} className={`dose-item ${status}`}>
                              <div className="dose-left">
                                <span className="dose-time">⏰ {formatTime12Hour(timeDisplay, isAr)}</span>
                                <span className={`status-pill ${status}`}>
                                  {status === 'taken' && (isAr ? 'تم أخذها ✅' : 'Taken ✅')}
                                  {status === 'upcoming' && (isAr ? 'قادمة ⏳' : 'Upcoming ⏳')}
                                  {status === 'unconfirmed' &&
                                    (isAr ? 'لم تُسجّل (متأخرة غير مؤكدة) ⚠️' : 'Missing Record (Unconfirmed) ⚠️')}
                                  {status === 'missed' &&
                                    (isAr ? 'فائتة مؤكدة ❌' : 'Confirmed Missed ❌')}
                                </span>
                                {dose.documentedOutcome && (
                                  <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                    📌 {formatDocumentedOutcomeLabel(dose.documentedOutcome, isAr)}
                                  </small>
                                )}
                                {dose.status === 'taken' && dose.takenAt && (
                                  <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                    {isAr ? 'وقت الأخذ الفعلي:' : 'Actual taken time:'}{' '}
                                    {formatTimestampReadable(dose.takenAt, isAr)}
                                  </small>
                                )}
                                {dose.status === 'missed' && dose.missedAt && (
                                  <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                    {isAr ? 'وقت التوثيق الفعلي:' : 'Recorded timestamp:'}{' '}
                                    {formatTimestampReadable(dose.missedAt, isAr)}
                                  </small>
                                )}
                                {dose.note && (
                                  <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                    📝 {dose.note}
                                  </small>
                                )}
                              </div>
                              <div className="dose-right" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {status === 'taken' ? (
                                  <>
                                    <button
                                      type="button"
                                      className="undo-btn"
                                      onClick={() => openDocumentDoseModal(sch.id, dose, sch.medicineName)}
                                    >
                                      📝 {isAr ? 'ملاحظة' : 'Note'}
                                    </button>
                                    <button
                                      type="button"
                                      className="undo-btn"
                                      onClick={() => handleDoseAction(sch.id, dose.id, 'upcoming')}
                                      title={isAr ? 'تراجع عن التسجيل' : 'Undo'}
                                    >
                                      ↩ {isAr ? 'تراجع' : 'Undo'}
                                    </button>
                                    <button
                                      type="button"
                                      className="undo-btn"
                                      onClick={() => handleDoseAction(sch.id, dose.id, 'missed')}
                                      title={isAr ? 'تصحيح إلى فائتة' : 'Change to Missed'}
                                    >
                                      ✕ {isAr ? 'فائتة' : 'Missed'}
                                    </button>
                                  </>
                                ) : status === 'missed' ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-take"
                                      onClick={() => handleDoseAction(sch.id, dose.id, 'taken')}
                                    >
                                      ✓ {isAr ? 'أخذتها' : 'Taken'}
                                    </button>
                                    <button
                                      type="button"
                                      className="undo-btn"
                                      onClick={() => openDocumentDoseModal(sch.id, dose, sch.medicineName)}
                                    >
                                      📝 {isAr ? 'ملاحظة' : 'Note'}
                                    </button>
                                    <button
                                      type="button"
                                      className="undo-btn"
                                      onClick={() => handleDoseAction(sch.id, dose.id, 'upcoming')}
                                    >
                                      ↩ {isAr ? 'تراجع' : 'Undo'}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-take"
                                      onClick={() => handleDoseAction(sch.id, dose.id, 'taken')}
                                    >
                                      ✓ {isAr ? 'أخذت الجرعة' : 'Mark Taken'}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-missed"
                                      onClick={() => handleDoseAction(sch.id, dose.id, 'missed')}
                                    >
                                      ✕ {isAr ? 'فائتة' : 'Mark Missed'}
                                    </button>
                                    <button
                                      type="button"
                                      className="undo-btn"
                                      onClick={() => openDocumentDoseModal(sch.id, dose, sch.medicineName)}
                                    >
                                      📝 {isAr ? 'توثيق' : 'Document'}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })
      )}

      {/* Printable & Exportable Treatment Summary Report */}
      {(schedules.length > 0 || prescriptions.length > 0) && (
        <section className="card stack printable-treatment-report">
          <div className="row no-print" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                📄 {isAr ? 'تقرير رحلة العلاج والمتابعة للطباعة أو التصدير' : 'Printable & Exportable Treatment Journey Report'}
              </h2>
            </div>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              <button type="button" className="btn" onClick={handlePrintReport}>
                🖨️ {isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleExportReportJson}>
                📥 {isAr ? 'تصدير التقرير (JSON)' : 'Export Report (JSON)'}
              </button>
            </div>
          </div>

          <div className="report-print-header">
            <h3 style={{ margin: '0 0 4px' }}>
              {isAr
                ? 'ملخص رحلة العلاج بالمضادات الحيوية وسجل الجرعات'
                : 'Antibiotic Treatment Journey & Dose History Report'}
            </h3>
            <p className="small" style={{ margin: '0 0 6px' }}>
              <b>{isAr ? 'تاريخ الإصدار:' : 'Generated on:'}</b>{' '}
              {formatTimestampReadable(reportGeneratedAt, isAr)}
              {profile.displayName ? ` · ${isAr ? 'المريض:' : 'Patient:'} ${profile.displayName}` : ''}
            </p>
            <div className="report-disclaimer-box">
              <strong>⚠️ {isAr ? 'إخلاء مسؤولية:' : 'Disclaimer:'} </strong>
              {isAr
                ? 'هذا التقرير مُدار بواسطة المريض للمتابعة الشخصية ولا يُعد سجلاً سريرياً موثقاً. الجرعات «غير المسجلة (متأخرة غير مؤكدة)» تختلف عن «الجرعات الفائتة المؤكدة صراحةً». راجع الطبيب أو الصيدلي دائماً.'
                : 'This report is maintained by the patient and is not a verified clinical record. Missing records (Overdue Unconfirmed) are distinct from Confirmed Missed doses. Always verify with your doctor or pharmacist.'}
            </div>
          </div>

          {schedules.map((sch) => {
            const stats = calculateScheduleProgress(sch);
            return (
              <div key={sch.id} className="report-schedule-item">
                <h4 style={{ margin: '0 0 4px' }}>
                  {sch.medicineName} — {sch.prescribedDose} ({sch.startDate} → {sch.endDate})
                </h4>
                <p className="small" style={{ margin: '0 0 4px' }}>
                  <b>{isAr ? 'حالة التوثيق:' : 'Verification Status:'}</b>{' '}
                  {formatVerificationStatusLabel(sch.verificationStatus, isAr)} ·{' '}
                  <b>{isAr ? 'طريقة الإدخال:' : 'Capture Method:'}</b>{' '}
                  {formatCaptureMethodLabel(sch.captureMethod, isAr)}
                </p>
                <p className="small" style={{ margin: '0 0 6px' }}>
                  {isAr ? 'تم أخذها (مؤكدة):' : 'Confirmed Taken:'} {stats.takenCount}/{stats.totalDoses} ({stats.progressPercent}%) ·{' '}
                  {isAr ? 'فائتة مؤكدة صراحةً:' : 'Confirmed Missed:'} {stats.missedCount} ·{' '}
                  {isAr ? 'سجلات غير مدخلة (متأخرة غير مؤكدة):' : 'Missing Records (Overdue Unconfirmed):'} {stats.unconfirmedCount}
                </p>
                <div className="tablewrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>{isAr ? 'اليوم والجرعة' : 'Day & Dose'}</th>
                        <th>{isAr ? 'الموعد المجدول' : 'Scheduled Time'}</th>
                        <th>{isAr ? 'الحالة' : 'Status'}</th>
                        <th>{isAr ? 'التوقيت الفعلي' : 'Actual Timestamp'}</th>
                        <th>{isAr ? 'ملاحظات' : 'Notes'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sch.doses.map((d) => {
                        const st = getDoseStatus(d);
                        return (
                          <tr key={d.id}>
                            <td>{isAr ? `اليوم ${d.dayNumber} (#${d.doseNumberInDay})` : `Day ${d.dayNumber} (#${d.doseNumberInDay})`}</td>
                            <td>{d.scheduledTime.replace('T', ' ').slice(0, 16)}</td>
                            <td>
                              {st === 'taken' && (isAr ? 'تم أخذها (مؤكدة) ✅' : 'Confirmed Taken ✅')}
                              {st === 'missed' && (isAr ? 'فائتة مؤكدة صراحةً ❌' : 'Confirmed Missed ❌')}
                              {st === 'unconfirmed' &&
                                (isAr ? 'سجل مفقود — متأخرة غير مؤكدة ⚠️' : 'Missing Record — Overdue Unconfirmed ⚠️')}
                              {st === 'upcoming' && (isAr ? 'قادمة ⏳' : 'Upcoming ⏳')}
                            </td>
                            <td>
                              {st === 'taken'
                                ? formatTimestampReadable(d.takenAt, isAr)
                                : st === 'missed'
                                  ? formatTimestampReadable(d.missedAt, isAr)
                                  : '—'}
                            </td>
                            <td>
                              {[
                                d.documentedOutcome
                                  ? formatDocumentedOutcomeLabel(d.documentedOutcome, isAr)
                                  : '',
                                d.note || '',
                              ]
                                .filter(Boolean)
                                .join(' — ') || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Add / Edit / Capture Schedule Modal */}
      {showAddModal &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
            <div className="modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>
                  {editingScheduleId
                    ? isAr
                      ? 'تعديل وتوثيق جدول العلاج'
                      : 'Edit & Verify Treatment Schedule'
                    : isAr
                      ? 'التقاط وتوثيق روشتة وجدول علاج جديد'
                      : 'Capture & Verify New Treatment Schedule'}
                </h3>
                <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>
                  ✕
                </button>
              </div>

              {/* Prescription Capture Controls */}
              <div className="rx-capture-box">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <strong>
                      📷{' '}
                      {isAr
                        ? 'التقاط صورة الروشتة (OCR) أو الإدخال اليدوي:'
                        : 'Prescription Image Capture (OCR) or Manual Entry:'}
                    </strong>
                    <p className="small muted" style={{ margin: '2px 0 0' }}>
                      {isAr
                        ? 'ارفع صورة الروشتة أو التقطها بالكاميرا لاستخراج التفاصيل المقروءة فقط، أو أدخلها يدوياً. لا يتم اعتماد الـ OCR تلقائياً.'
                        : 'Upload or capture a prescription photo to extract readable details, or enter manually. OCR is never auto-approved.'}
                    </p>
                  </div>
                  <div className="row wrapRow" style={{ gap: '8px' }}>
                    <label className="btn-secondary small" style={{ cursor: 'pointer', margin: 0 }}>
                      📁 {isAr ? 'رفع صورة روشتة' : 'Upload Rx Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePrescriptionImageChange(e, 'ocr_upload')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="btn-secondary small" style={{ cursor: 'pointer', margin: 0 }}>
                      📸 {isAr ? 'كاميرا الموبايل' : 'Camera Capture'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePrescriptionImageChange(e, 'camera_capture')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                {ocrLoading && (
                  <div className="ocr-status-banner loading" style={{ marginTop: '10px' }}>
                    ⏳{' '}
                    {isAr
                      ? 'جارٍ قراءة صورة الروشتة واستخراج التفاصيل المقروءة فقط دون تخمين...'
                      : 'Analyzing prescription image and extracting readable details without guessing...'}
                  </div>
                )}

                {ocrError && (
                  <div className="ocr-status-banner error" style={{ marginTop: '10px' }}>
                    ⚠️ {ocrError}
                  </div>
                )}

                {isOcrUnverified && (
                  <div className="ocr-unverified-banner" style={{ marginTop: '10px' }}>
                    <strong>
                      ⚠️{' '}
                      {isAr
                        ? 'بيانات مستخرجة بالـ OCR (غير موثّقة — لا تُعتمد تلقائياً):'
                        : 'Unverified OCR-Extracted Information (Never Auto-Approved):'}
                    </strong>
                    <p className="small" style={{ margin: '4px 0 0' }}>
                      {isAr
                        ? 'تم ترك أي حقل غير واضح فارغاً دون افتراض أي جرعة أو تكرار أو مدة. راجع كل حقل من الروشتة الورقية قبل التوثيق.'
                        : 'Any unclear field was left blank without guessing. Please verify every field against your physical prescription before scheduling.'}
                    </p>
                    {ocrExtraction && ocrExtraction.unreadableFields.length > 0 && (
                      <p className="small" style={{ margin: '6px 0 0', fontWeight: 700, color: '#991b1b' }}>
                        🔍{' '}
                        {isAr
                          ? `حقول غير مقروءة وتحتاج لإدخال/تأكيد يدوي: ${ocrExtraction.unreadableFields.join(' ، ')}`
                          : `Unreadable fields requiring manual entry/clarification: ${ocrExtraction.unreadableFields.join(', ')}`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {formError && <p className="alert danger-alert">{formError}</p>}

              <form onSubmit={handleSubmit} className="stack modal-form">
                <div className="form-group">
                  <label>
                    <b>{isAr ? 'اسم المضاد الحيوي:' : 'Antibiotic Name:'} *</b>
                    {isOcrUnverified && medName && (
                      <span className="ocr-field-tag">
                        {isAr ? '⚠️ مستخرج غير موثّق' : '⚠️ Unverified OCR'}
                      </span>
                    )}
                  </label>
                  <input
                    list="med-suggestions"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب أو اختر (مثال: أوجمنتين، فلاجيل...)'
                        : 'Type or select (e.g. Augmentin, Flagyl)'
                    }
                  />
                  <datalist id="med-suggestions">
                    {meds.map((m) => (
                      <option key={m.id} value={pick(m.genericName, lang)} />
                    ))}
                  </datalist>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'الجرعة الموصوفة بالروشتة:' : 'Prescribed Dose:'} *</b>
                      {isOcrUnverified && prescribedDose && (
                        <span className="ocr-field-tag">
                          {isAr ? '⚠️ مستخرج غير موثّق' : '⚠️ Unverified OCR'}
                        </span>
                      )}
                    </label>
                    <input
                      value={prescribedDose}
                      onChange={(e) => setPrescribedDose(e.target.value)}
                      placeholder={
                        isAr ? 'مثال: قرص 1000 مجم أو 5 مل' : 'e.g. 1 tablet (1000mg) or 5ml'
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'طريقة الاستعمال:' : 'Administration Route:'} *</b>
                    </label>
                    <SmartChoiceSelect
                      value={route}
                      onChange={(val) => setRoute(val)}
                      placeholder={isAr ? '— اختر طريقة الاستعمال —' : '— Select Route —'}
                      modalTitle={isAr ? '💊 اختر طريقة استعمال الدواء' : 'Select Administration Route'}
                      options={[
                        { value: 'oral', icon: '💊', label: isAr ? 'أقراص / كبسول فموي' : 'Oral Tablet/Capsule', description: isAr ? 'يُبلع عن طريق الفم مع الماء' : 'Swallowed orally with water' },
                        { value: 'suspension', icon: '🍼', label: isAr ? 'شراب معلق للأطفال' : 'Oral Suspension', description: isAr ? 'يُرج جيداً قبل كل جرعة بالسرنجة المدرجة' : 'Shake well before measuring dose' },
                        { value: 'injection', icon: '💉', label: isAr ? 'حقن (وريد / عضل)' : 'Injection (IM / IV)', description: isAr ? 'أمبول أو فيال للحقن العضلي أو الوريدي' : 'Ampoule or vial for injection' },
                        { value: 'topical', icon: '🧴', label: isAr ? 'موضعي (كريم / مرهم / قطرة)' : 'Topical (Cream / Drops)', description: isAr ? 'استخدام ظاهري موضعي' : 'External topical application' },
                      ]}
                    />
                  </div>
                </div>

                {/* First Dose Time + Number of Daily Doses -> Auto-calculates all times */}
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>🕒 {isAr ? 'وقت بدء أول جرعة:' : 'First Dose Start Time:'} *</b>
                    </label>
                    <input
                      type="time"
                      value={firstDoseTime}
                      onChange={(e) => handleFirstDoseTimeChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>🔢 {isAr ? 'عدد الجرعات يومياً (يحسب المواعيد تلقائياً):' : 'Doses Per Day (Auto-Calculates Times):'} *</b>
                    </label>
                    <SmartChoiceSelect
                      value={frequency}
                      onChange={(val) => handleFrequencyChange(val)}
                      placeholder={isAr ? '— اختر التكرار اليومي —' : '— Select Daily Frequency —'}
                      modalTitle={isAr ? '🔢 عدد الجرعات يومياً (يحسب المواعيد تلقائياً)' : 'Doses Per Day'}
                      options={[
                        { value: 'once_daily', icon: '1️⃣', label: isAr ? 'جرعة واحدة يومياً (كل 24 ساعة)' : '1 dose daily (every 24h)', badge: isAr ? 'كل 24 ساعة' : 'Every 24h' },
                        { value: 'twice_daily', icon: '2️⃣', label: isAr ? 'جرعتان يومياً (كل 12 ساعة)' : '2 doses daily (every 12h)', badge: isAr ? 'كل 12 ساعة' : 'Every 12h' },
                        { value: 'thrice_daily', icon: '3️⃣', label: isAr ? '3 جرعات يومياً (كل 8 ساعات)' : '3 doses daily (every 8h)', badge: isAr ? 'كل 8 ساعات' : 'Every 8h' },
                        { value: 'four_times_daily', icon: '4️⃣', label: isAr ? '4 جرعات يومياً (كل 6 ساعات)' : '4 doses daily (every 6h)', badge: isAr ? 'كل 6 ساعات' : 'Every 6h' },
                      ]}
                    />
                  </div>
                </div>

                {doseTimes.length > 0 && (
                  <div className="form-group">
                    <label>
                      <b>
                        ✨{' '}
                        {isAr
                          ? 'مواعيد الجرعات المحسوبة تلقائياً خلال اليوم:'
                          : 'Auto-Calculated Scheduled Dose Times:'}
                      </b>
                    </label>
                    <div className="dose-times-grid">
                      {doseTimes.map((time, idx) => (
                        <div key={idx} className="time-input-group">
                          <small>
                            {isAr ? `الجرعة ${idx + 1}` : `Dose ${idx + 1}`} ({formatTime12Hour(time, isAr)}):
                          </small>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => handleTimeChange(idx, e.target.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'تاريخ بدء العلاج:' : 'Start Date:'}</b>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'مدة الكورس بالأيام:' : 'Duration (Days):'} *</b>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={durationDays}
                      placeholder={isAr ? 'عدد الأيام بالروشتة' : 'Days on Rx'}
                      onChange={(e) =>
                        setDurationDays(e.target.value === '' ? '' : Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'تعليمات إضافية (اختياري):' : 'Notes / Instructions (Optional):'}</b>
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      isAr ? 'مثال: بعد الأكل، يحفظ في الثلاجة' : 'e.g. Take with food, keep refrigerated'
                    }
                  />
                </div>

                {/* Live Contradiction & Missing Instruction Clarification Gate */}
                {liveValidation.blockingFlags.length > 0 && (
                  <div className="clarification-gate-box blocking">
                    <strong>
                      🚨{' '}
                      {isAr
                        ? 'تعليمات ناقصة أو متعارضة تتطلب توضيحاً مهنياً (لا يمكن جدولة الجرعات قبل تصحيحها):'
                        : 'Missing or Contradictory Instructions Flagged for Professional Clarification (Scheduling Blocked):'}
                    </strong>
                    <ul className="small" style={{ margin: '6px 0 0', paddingInlineStart: '20px', lineHeight: 1.6 }}>
                      {liveValidation.blockingFlags.map((fl, idx) => (
                        <li key={idx}>{isAr ? fl.messageAr : fl.messageEn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {liveValidation.warningFlags.length > 0 && (
                  <div className="clarification-gate-box warning">
                    <strong>
                      ⚠️{' '}
                      {isAr
                        ? 'تنبيهات الأمان الدوائي:'
                        : 'Medication Safety Warnings:'}
                    </strong>
                    <ul className="small" style={{ margin: '6px 0 0', paddingInlineStart: '20px', lineHeight: 1.6 }}>
                      {liveValidation.warningFlags.map((fl, idx) => (
                        <li key={idx}>{isAr ? fl.messageAr : fl.messageEn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mandatory Patient Verification Checkbox */}
                <label className="verification-checkbox-row">
                  <input
                    type="checkbox"
                    checked={verifiedByPatient}
                    onChange={(e) => setVerifiedByPatient(e.target.checked)}
                    disabled={liveValidation.hasBlockingFlags}
                  />
                  <span className="small">
                    <b>
                      {isAr
                        ? 'تأكيد التحقق من الروشتة (إلزامي قبل الجدولة):'
                        : 'Mandatory Prescription Verification:'}
                    </b>{' '}
                    {isAr
                      ? 'أؤكد أنني راجعت اسم الدواء والجرعة وطريقة الاستعمال والتكرار والمدة من الروشتة الورقية الموصوفة لي (أو مع الطبيب/الصيدلي) وأنها صحيحة وغير مخمّنة.'
                      : 'I confirm that I have verified the medicine name, dose, route, frequency, and duration against my physical prescription (or with my doctor/pharmacist).'}
                  </span>
                </label>

                <div className="modal-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="submit"
                    className="btn"
                    disabled={!liveValidation.canCreateSchedule}
                  >
                    ✅{' '}
                    {editingScheduleId
                      ? isAr
                        ? 'توثيق وتحديث الجدول'
                        : 'Verify & Update Schedule'
                      : isAr
                        ? 'توثيق وحفظ الجدول العلاجي'
                        : 'Verify & Activate Schedule'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleSaveUnverifiedPrescriptionOnly}
                  >
                    📋{' '}
                    {isAr
                      ? 'حفظ الروشتة للاستشارة الطبية (بدون تفعيل جدول)'
                      : 'Save for Clarification (Without Schedule)'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Document Dose Note / Outcome Modal */}
      {docModalTarget &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setDocModalTarget(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>
                  📝{' '}
                  {isAr
                    ? `توثيق تفاصيل الجرعة — ${docModalTarget.medicineName}`
                    : `Document Dose Details — ${docModalTarget.medicineName}`}
                </h3>
                <button type="button" className="close-btn" onClick={() => setDocModalTarget(null)}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveDocumentedDose} className="stack modal-form">
                <p className="small muted" style={{ margin: 0 }}>
                  <b>{isAr ? 'الموعد المجدول:' : 'Scheduled Slot:'}</b>{' '}
                  {isAr
                    ? `اليوم ${docModalTarget.dose.dayNumber} — الجرعة ${docModalTarget.dose.doseNumberInDay}`
                    : `Day ${docModalTarget.dose.dayNumber} — Dose #${docModalTarget.dose.doseNumberInDay}`}{' '}
                  ({docModalTarget.dose.scheduledTime.replace('T', ' ').slice(0, 16)})
                </p>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'حالة الجرعة:' : 'Dose Status:'}</b>
                  </label>
                  <select
                    value={docModalStatus}
                    onChange={(e) => {
                      const st = e.target.value as 'taken' | 'missed';
                      setDocModalStatus(st);
                      setDocModalOutcome(
                        st === 'taken' ? 'taken_on_time' : 'held_for_clarification'
                      );
                    }}
                  >
                    <option value="taken">{isAr ? '✅ تم أخذ الجرعة' : '✅ Dose Taken'}</option>
                    <option value="missed">
                      {isAr ? '❌ لم تُؤخذ (فائتة / مؤجلة طبياً)' : '❌ Not Taken (Missed / Clinician Hold)'}
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'تصنيف التوثيق:' : 'Documentation Category:'}</b>
                  </label>
                  <select
                    value={docModalOutcome}
                    onChange={(e) => setDocModalOutcome(e.target.value as DoseDocumentedOutcome)}
                  >
                    {docModalStatus === 'taken' ? (
                      <>
                        <option value="taken_on_time">
                          {isAr ? 'أُخذت في موعدها المجدول' : 'Taken on schedule'}
                        </option>
                        <option value="taken_late">
                          {isAr ? 'أُخذت متأخرة (وفق توجيه الطبيب/الصيدلي)' : 'Taken late (per clinician guidance)'}
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="missed_confirmed">
                          {isAr ? 'جرعة فائتة مؤكدة (نسيان الجرعة)' : 'Confirmed missed dose'}
                        </option>
                        <option value="held_for_clarification">
                          {isAr
                            ? 'مؤجلة مؤقتاً لحين استشارة الطبيب أو الصيدلي'
                            : 'Held pending doctor/pharmacist clarification'}
                        </option>
                        <option value="skipped_clinician_advice">
                          {isAr
                            ? 'تم إيقافها/تخطيها بتوجيه مباشر من الطبيب'
                            : 'Skipped per direct clinician advice'}
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'ملاحظة المريض (اختياري):' : 'Patient Note (Optional):'}</b>
                  </label>
                  <input
                    value={docModalNote}
                    onChange={(e) => setDocModalNote(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: أخذتها بعد الوجبة، أو تم الاتصال بالصيدلي...'
                        : 'e.g. Taken after meal, or called pharmacist for guidance...'
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn">
                    💾 {isAr ? 'حفظ توثيق الجرعة' : 'Save Dose Documentation'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setDocModalTarget(null)}
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
