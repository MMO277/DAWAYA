import { HealthProfilePrivacyGate } from './profilePrivacyLock';
import SmartChoiceSelect, { SmartNativeSelect } from './SmartChoiceSelect';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import { useDawayaDrugDatabase } from './dawayaDrugDatabaseService';
import { pick } from './types';
import { createPortal } from 'react-dom';
import { FormEvent, lazy, Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import {
  AllergyRecord,
  MedicationRecord,
  ALLERGEN_CATEGORIES,
  useSyncedHealthProfile,
  AllergySeverity,
  EvidenceStatus,
  syncNotesWithChronicConditions,
} from './allergyData';
import {
  getPassportShare,
  sharePassport,
  revokePassport,
  uploadPassportPhoto,
  savePassportPhotoUrl,
  getPassportPhotoUrl,
  syncProfileToPassportShare,
  getOrCreateGuestPassportId,
  buildPassportUrl,
  generateOfflineQrDataUrl,
  renderDawayaMedicalIdCardPngBlob,
  PassportShare,
} from './passportService';
import { DawayaPassportCardUI } from './SmartPassport';
import {
  useSyncedSchedules,
  calculateScheduleProgress,
  formatFrequencyLabel,
  formatRouteLabel,
  formatVerificationStatusLabel,
  formatCaptureMethodLabel,
  formatTimestampReadable,
  downloadScheduleIcs,
  downloadTreatmentReportJson,
} from './trackerData';

export default function HealthProfile() {
  const { lang } = useLang();
  const { indexItems: dawayaIndexItems } = useDawayaDrugDatabase();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile, setProfile, syncing } = useSyncedHealthProfile();

  // Auto open edit mode if redirected from registration to complete profile
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('setup=profile') || window.location.search.includes('setup=profile'))) {
      setEditingPersonal(true);
    }
  }, []);

  const liveProfileSafety = evaluateMedicationSafety({
    medications: [
      ...(profile.activeMedications || []).map((m) => ({
        id: m.resolvedDrugId,
        rawName: m.drugName,
        strength: m.doseOrStrength,
        sourceType: 'profile_active' as const,
      })),
      ...(profile.medications || [])
        .filter((m) => m.status === 'active')
        .map((m) => ({
          id: m.activeIngredients || undefined,
          rawName: m.drugName,
          prescribedDose: m.prescribedDose,
          route: m.route,
          sourceType: 'profile_active' as const,
        })),
    ],
    healthProfile: profile,
    includeProfileActiveMedications: false,
  });
  const {
    schedules,
    prescriptions,
    treatmentEvents,
    syncStatus: journeySyncStatus,
  } = useSyncedSchedules();

  // ── Passport states (Supports both Authenticated Users & Guest Mode) ──────────
  const effectiveUid = user?.uid || getOrCreateGuestPassportId();
  const [passportPhoto, setPassportPhoto] = useState('');
  const [passportPhotoLoading, setPassportPhotoLoading] = useState(false);
  const [passportShare, setPassportShare] = useState<PassportShare | null>(null);
  const [passportLoading, setPassportLoading] = useState(true);
  const [passportQrDataUrl, setPassportQrDataUrl] = useState('');
  // PIN محفوظ مرة واحدة
  const [savedPin, setSavedPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);
  // مشاركة
  const [passportHours, setPassportHours] = useState(24);
  const [passportSharing, setPassportSharing] = useState(false);
  // مشاركة الصورة/الرابط
  const [shareSuccess, setShareSuccess] = useState('');
  const [chronicInput, setChronicInput] = useState('');
  const photoFileRef = useRef<HTMLInputElement>(null);

  // تحميل بيانات البطاقة ومزامنة الملف الصحي والجداول تلقائياً
  useEffect(() => {
    setPassportLoading(true);
    Promise.all([
      getPassportShare(effectiveUid),
      getPassportPhotoUrl(effectiveUid),
    ]).then(([s, photo]) => {
      setPassportShare(s);
      if (s?.pin) setSavedPin(s.pin);
      setPassportPhoto(photo || s?.photoUrl || '');
      setPassportLoading(false);
    });
  }, [effectiveUid]);

  useEffect(() => {
    if (syncing) return;
    void syncProfileToPassportShare(effectiveUid, profile, {
      schedules,
      prescriptions,
      authDisplayName: user?.displayName || profile.displayName || '',
      authEmail: user?.email || '',
    });
  }, [effectiveUid, user, syncing, profile, schedules, prescriptions]);

  const handlePassportPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPassportPhotoLoading(true);
    try {
      const url = await uploadPassportPhoto(effectiveUid, file);
      await savePassportPhotoUrl(effectiveUid, url);
      setPassportPhoto(url);
    } catch {
      alert(isAr ? 'فشل رفع الصورة. حاول مرة أخرى.' : 'Photo upload failed. Please try again.');
    } finally {
      setPassportPhotoLoading(false);
    }
  }, [effectiveUid, isAr]);

  const passportChronicList: string[] = (() => {
    if (profile.chronicConditions && profile.chronicConditions.length > 0) {
      return profile.chronicConditions.map((c) => c.conditionName);
    }
    try {
      const n = profile.notes || '';
      const idx = n.indexOf('CHRONIC:');
      if (idx === -1) return [];
      return JSON.parse(n.slice(idx + 8).split('||')[0]);
    } catch { return []; }
  })();

  const addChronic = () => {
    const cleanName = chronicInput.trim();
    if (!cleanName) return;
    setProfile((p) => {
      const existing = p.chronicConditions || [];
      if (existing.some((c) => c.conditionName.toLowerCase() === cleanName.toLowerCase())) {
        return p;
      }
      const nextChronics = [
        {
          id: `cond-${Date.now()}`,
          conditionName: cleanName,
          evidenceStatus: 'patient_reported' as const,
          source: 'manual_entry' as const,
          createdAt: new Date().toISOString(),
        },
        ...existing,
      ];
      return {
        ...p,
        chronicConditions: nextChronics,
        notes: syncNotesWithChronicConditions(p.notes || '', nextChronics),
      };
    });
    setChronicInput('');
  };

  const removeChronic = (idx: number) => {
    setProfile((p) => {
      const targetName = passportChronicList[idx];
      const nextChronics = (p.chronicConditions || []).filter(
        (c, i) => (targetName ? c.conditionName !== targetName : i !== idx)
      );
      return {
        ...p,
        chronicConditions: nextChronics,
        notes: syncNotesWithChronicConditions(p.notes || '', nextChronics),
      };
    });
  };

  const passportUrl = buildPassportUrl(effectiveUid, profile, savedPin);

  useEffect(() => {
    let active = true;
    generateOfflineQrDataUrl(passportUrl, 200).then((url) => {
      if (active) setPassportQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [passportUrl]);

  // حفظ PIN جديد وتفعيل البطاقة فوراً بكامل البيانات
  const handleSavePin = async () => {
    if (pinInput.length < 4) return;
    setPinSaving(true);
    await sharePassport(effectiveUid, pinInput, passportHours || 24, profile, {
      schedules,
      prescriptions,
      authDisplayName: user?.displayName || profile.displayName || '',
      authEmail: user?.email || '',
    });
    const s = await getPassportShare(effectiveUid);
    setPassportShare(s);
    setSavedPin(pinInput);
    setPinInput('');
    setShowPinSetup(false);
    setPinSaving(false);
    setShareSuccess(
      isAr
        ? '✅ تم حفظ الـ PIN وتفعيل الكارت الطبي ومزامنة جميع بياناتك الصحية للـ QR!'
        : '✅ PIN saved, Medical ID activated, and all health records synced to QR!'
    );
    setTimeout(() => setShareSuccess(''), 4000);
  };

  // تفعيل المشاركة بالـ PIN المحفوظ وتحديث البيانات
  const handlePassportShare = async () => {
    if (!savedPin) return;
    setPassportSharing(true);
    await sharePassport(effectiveUid, savedPin, passportHours || 24, profile, {
      schedules,
      prescriptions,
      authDisplayName: user?.displayName || profile.displayName || '',
      authEmail: user?.email || '',
    });
    const s = await getPassportShare(effectiveUid);
    setPassportShare(s);
    setPassportSharing(false);
  };

  const handlePassportRevoke = async () => {
    await revokePassport(effectiveUid);
    setPassportShare(null);
  };

  // مشاركة الرابط
  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: isAr ? 'الكارت الطبي الذكي — دوايا | DAWAYA' : 'DAWAYA Smart Medical ID',
        text: isAr ? 'بطاقتي الصحية الذكية للطوارئ والعيادات' : 'My Smart Medical ID & Passport',
        url: passportUrl,
      });
    } else {
      navigator.clipboard.writeText(passportUrl);
      setShareSuccess(isAr ? '✅ تم نسخ الرابط الطبي!' : '✅ Medical ID link copied!');
      setTimeout(() => setShareSuccess(''), 3000);
    }
  };

  // بناء وتنزيل صورة الكارت الطبي بدقة عالية بهوية DAWAYA
  const handleShareImage = async () => {
    try {
      const blob = await renderDawayaMedicalIdCardPngBlob({
        uid: effectiveUid,
        profile,
        photoUrl: passportPhoto,
        qrDataUrl: passportQrDataUrl,
        passportUrl,
        isAr,
      });
      if (!blob) throw new Error('Failed to render card');
      const file = new File([blob], 'DAWAYA-Medical-ID.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: isAr ? 'الكارت الطبي الذكي — دوايا | DAWAYA' : 'DAWAYA Smart Medical ID',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DAWAYA-Medical-ID-${(profile.displayName || effectiveUid).slice(0, 12)}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setShareSuccess(isAr ? '✅ تم تنزيل الكارت الطبي كصورة PNG!' : '✅ Medical ID downloaded as PNG!');
        setTimeout(() => setShareSuccess(''), 3000);
      }
    } catch {
      setShareSuccess(isAr ? '⚠️ يمكنك طباعة الكارت أو التقاط صورة للشاشة' : '⚠️ Print the card or take a screenshot');
      setTimeout(() => setShareSuccess(''), 4000);
    }
  };

  const passportIsActive = Boolean(passportShare && passportShare.pin && passportShare.expiresAt > 0 && Date.now() < passportShare.expiresAt);
  const passportRemaining = passportShare ? Math.max(0, Math.round((passportShare.expiresAt - Date.now()) / 60000)) : 0;

  // Personal info edit state
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [ageInput, setAgeInput] = useState(profile.age);
  const [weightInput, setWeightInput] = useState(profile.weightKg || '');
  const [bloodInput, setBloodInput] = useState(profile.bloodType);
  const [contactInput, setContactInput] = useState(profile.emergencyContact);
  const [genderInput, setGenderInput] = useState(profile.gender);
  const [occupationInput, setOccupationInput] = useState<string>(profile.occupation || 'general');
  const [customOccupationInput, setCustomOccupationInput] = useState<string>(profile.customOccupationTitle || '');
  const [factoryHazardsInput, setFactoryHazardsInput] = useState<string[]>(profile.factoryEnvironmentHazards || []);
  const [workEnvironmentNotesInput, setWorkEnvironmentNotesInput] = useState<string>(profile.workEnvironmentNotes || '');

  // Modal states
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);

  // New Allergy Form states
  const [drugName, setDrugName] = useState('');
  const [allergenKey, setAllergenKey] = useState('penicillin');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState<AllergySeverity>('severe');
  const [evidence, setEvidence] = useState<EvidenceStatus>('patient_reported');
  const [allergyNotes, setAllergyNotes] = useState('');

  // New Medication Form states
  const [medDrugName, setMedDrugName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('twice_daily');
  const medRoute = 'oral';
  const [medStatus, setMedStatus] = useState<'active' | 'completed' | 'discontinued'>('active');

  useEffect(() => {
    if (!editingPersonal) {
      setNameInput(profile.displayName);
      setAgeInput(profile.age);
      setWeightInput(profile.weightKg || '');
      setBloodInput(profile.bloodType);
      setContactInput(profile.emergencyContact);
      setGenderInput(profile.gender);
      setOccupationInput(profile.occupation || 'general');
      setCustomOccupationInput(profile.customOccupationTitle || '');
      setFactoryHazardsInput(profile.factoryEnvironmentHazards || []);
      setWorkEnvironmentNotesInput(profile.workEnvironmentNotes || '');
    }
  }, [profile.displayName, profile.age, profile.weightKg, profile.bloodType, profile.emergencyContact, profile.gender, profile.occupation, profile.customOccupationTitle, profile.factoryEnvironmentHazards, profile.workEnvironmentNotes, editingPersonal]);

  const savePersonalInfo = (e: FormEvent) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      displayName: nameInput.trim(),
      age: ageInput.trim(),
      weightKg: weightInput.trim(),
      bloodType: bloodInput.trim(),
      emergencyContact: contactInput.trim(),
      gender: genderInput.trim(),
      occupation: (occupationInput as any) || 'general',
      customOccupationTitle: customOccupationInput.trim(),
      factoryEnvironmentHazards: factoryHazardsInput,
      workEnvironmentNotes: workEnvironmentNotesInput.trim(),
    }));
    setEditingPersonal(false);

    // Clean URL so setup=profile is removed forever after saving once!
    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('setup=profile')) {
        window.location.hash = '#/health-profile';
      }
    }
  };

  const addAllergy = (e: FormEvent) => {
    e.preventDefault();
    if (!drugName.trim()) return;
    const newRecord: AllergyRecord = {
      id: `all-${Date.now()}`,
      drugName: drugName.trim(),
      allergenKey,
      reportedSymptoms: symptoms.trim(),
      severity,
      evidenceStatus: evidence,
      notes: allergyNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    setProfile((prev) => ({ ...prev, allergies: [newRecord, ...prev.allergies] }));
    setShowAllergyModal(false);
    setDrugName('');
    setSymptoms('');
    setAllergyNotes('');
  };

  const deleteAllergy = (id: string) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this allergy record?')) {
      setProfile((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a.id !== id) }));
    }
  };

  const addMedication = (e: FormEvent) => {
    e.preventDefault();
    if (!medDrugName.trim()) return;
    const newMed: MedicationRecord = {
      id: `med-${Date.now()}`,
      drugName: medDrugName.trim(),
      activeIngredients: '',
      prescribedDose: medDose.trim(),
      route: medRoute,
      frequency: medFreq,
      startDate: new Date().toISOString().split('T')[0],
      status: medStatus,
    };
    setProfile((prev) => ({ ...prev, medications: [newMed, ...prev.medications] }));
    setShowMedModal(false);
    setMedDrugName('');
    setMedDose('');
    setMedFreq('twice_daily');
  };

  const deleteMedication = (id: string) => {
    if (window.confirm(isAr ? 'هل تريد حذف هذا الدواء من سجلك؟' : 'Delete this medication record?')) {
      setProfile((prev) => ({ ...prev, medications: prev.medications.filter((m) => m.id !== id) }));
    }
  };

  const deleteMedicalDocument = (docId: string) => {
    if (window.confirm(isAr ? 'هل تريد حذف هذا المستند الطبي من حسابك؟' : 'Delete this medical document from your account?')) {
      setProfile((prev) => ({
        ...prev,
        medicalDocuments: (prev.medicalDocuments || []).filter((d) => d.id !== docId),
      }));
    }
  };

  const exportProfileData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `health_profile_${profile.displayName || 'patient'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportFullTreatmentJourney = () => {
    downloadTreatmentReportJson({
      patientName: profile.displayName || user?.displayName || undefined,
      userEmail: user?.email,
      syncStatus: journeySyncStatus,
      prescriptions,
      schedules,
      treatmentEvents,
    });
  };

  const clearAllData = () => {
    if (window.confirm(isAr ? 'تحذير: سيتم مسح جميع بيانات الحساسية والأدوية المسجلة. هل توافق؟' : 'Warning: All stored health data will be deleted. Proceed?')) {
      setProfile({ displayName: '', age: '', weightKg: '', gender: '', bloodType: '', emergencyContact: '', notes: '', allergies: [], medications: [], chronicConditions: [], medicalDocuments: [] });
    }
  };

  const renderSeverityBadge = (s: AllergySeverity) => {
    switch (s) {
      case 'life_threatening':
        return <span className="sev-badge severe">🚨 {isAr ? 'مهددة للحياة (صدمة تحسسية)' : 'Life Threatening'}</span>;
      case 'severe':
        return <span className="sev-badge severe">🔴 {isAr ? 'شديدة (تورم/ضيق تنفس)' : 'Severe'}</span>;
      case 'moderate':
        return <span className="sev-badge moderate">🟡 {isAr ? 'متوسطة (طفح جلدي واسع)' : 'Moderate'}</span>;
      case 'mild':
        return <span className="sev-badge safe">🟢 {isAr ? 'خفيفة (حكة موضعية)' : 'Mild'}</span>;
    }
  };

  return (
    <HealthProfilePrivacyGate isAr={isAr}>
    <main className="wrap stack">
      <header className="page-head">
        <h1>👤 {isAr ? 'ملف صحتي وحساسيتي ورحلة علاجي' : 'My Health Profile, Allergy Passport & Treatment Journey'}</h1>
        <p className="muted">
          {isAr
            ? 'سجل شخصي متكامل لتوثيق حساسيتك الدوائية، روشتاتك الموثّقة، وجداول جرعاتك المحفوظة في حسابك عبر جميع أجهزتك.'
            : 'Personal health dashboard documenting your drug allergies, verified prescriptions, and treatment schedules synced across your devices.'}
          {syncing && (
            <span style={{ marginInlineStart: '8px', fontSize: '0.85em' }}>
              ({isAr ? 'جارٍ مزامنة بياناتك السحابية...' : 'Syncing cloud data...'})
            </span>
          )}
        </p>
      </header>

      {/* Action / Quick Safety Check Banner */}
      <section className="card highlight-card profile-banner">
        <div className="banner-content">
          <div>
            <h2>🛡️ {isAr ? 'فاحص الحساسية والأمان الدوائي والمساعد الذكي' : 'Smart Allergy Safety Check & AI Health Assistant'}</h2>
            <p className="small">
              {isAr
                ? 'تحقق فوراً مما إذا كان أي مضاد حيوي يحتوي على مواد فعالة تطابق حساسيتك المسجلة، أو استخدم المساعد الذكي لإدارة سجلك الصحي بالأوامر المباشرة.'
                : 'Instantly check whether any antibiotic matches your recorded allergies, or use the AI Assistant to manage your records.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/allergy-checker" className="btn btn-listen-all">
              ⚡ {isAr ? 'افحص أمان دواء الآن' : 'Check a Medicine'}
            </Link>
            <Link to="/prescription-radar" className="btn-secondary">
              📡 {isAr ? 'رادار الروشتة ورحلة العلاج' : 'Prescription Radar & Journey'}
            </Link>
            <Link to="/assistant" className="btn-secondary">
              🤖 {isAr ? 'المساعد الصحي الذكي' : 'AI Health Assistant'}
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <SmartwatchHealthCenter isAr={isAr} schedules={schedules} profile={profile} compact />
      </Suspense>

      {/* Live Central Medication Safety Engine Assessment inside Health Profile */}
      <section className="card stack" style={{ borderInlineStart: '5px solid #138866' }}>
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>
            🛡️ {isAr ? 'تقييم محرك الأمان الدوائي المركزي لملفك الصحي' : 'Central Medication Safety Engine Profile Assessment'}
          </h2>
          <Link to="/patient-dashboard" className="btn small">
            📊 {isAr ? 'فتح لوحة المريض الموحدة' : 'Open Unified Patient Dashboard'}
          </Link>
        </div>
        <p className="small" style={{ margin: 0 }}>
          {pick(liveProfileSafety.completeness.summaryBanner, lang)}
        </p>
        {liveProfileSafety.findings.length > 0 && (
          <div className="stack" style={{ gap: '8px' }}>
            {liveProfileSafety.findings.slice(0, 4).map((f) => (
              <div key={f.id} className="subcard">
                <b>{pick(f.title, lang)}</b>
                <span className="small">{pick(f.reason, lang)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* KPI Overview */}
      <div className="kpi-grid">
        <div className="kpi-item unconfirmed">
          <span className="kpi-num">{profile.allergies.length}</span>
          <span className="kpi-label">{isAr ? 'أدوية تسبب حساسية ⚠️' : 'Documented Allergies'}</span>
        </div>
        <div className="kpi-item taken">
          <span className="kpi-num">{schedules.length}</span>
          <span className="kpi-label">{isAr ? 'جداول علاجية مفعّلة 🗓️' : 'Active Treatment Schedules'}</span>
        </div>
        <div className="kpi-item upcoming">
          <span className="kpi-num">{prescriptions.length}</span>
          <span className="kpi-label">{isAr ? 'روشتات محفوظة بالحساب 📋' : 'Saved Prescriptions'}</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-num">{profile.medications.filter((m) => m.status === 'active').length}</span>
          <span className="kpi-label">{isAr ? 'أدوية بسجل الملف 💊' : 'Profile Medications'}</span>
        </div>
      </div>

      {/* Personal Identity Card */}
      <section className="card stack">
        <div className="card-head-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <h2>{isAr ? 'البيانات الشخصية والحيوية للمريض:' : 'Patient Details & Vitals:'}</h2>
          <div className="row wrapRow no-print" style={{ gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={() => setEditingPersonal(!editingPersonal)}>
              {editingPersonal ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'تعديل البيانات' : 'Edit')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              {isAr ? 'طباعة الكارت الطبي' : 'Print Medical ID'}
            </button>
            <button type="button" className="btn small" style={{ background: '#138866', borderColor: '#138866', color: '#101E36', fontWeight: 800 }} onClick={handleShareImage}>
              {isAr ? 'تنزيل الكارت PNG' : 'Download ID PNG'}
            </button>
            <Link to="/passport" className="btn small ghost">
              {isAr ? 'صفحة الكارت الذكي المستقلة' : 'Full ID Page'}
            </Link>
          </div>
        </div>

        {editingPersonal ? (
          <form onSubmit={savePersonalInfo} className="stack modal-form">
            <div className="form-row">
              <div className="form-group form-group-full">
                <label><b>{isAr ? 'اسم المريض:' : 'Patient Name:'}</b></label>
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={isAr ? 'الاسم بالكامل' : 'Full Name'} />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'العمر:' : 'Age:'}</b></label>
                <input value={ageInput} onChange={(e) => setAgeInput(e.target.value)} placeholder={isAr ? 'مثال: 45 سنة' : 'e.g. 45'} />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'الوزن (كجم):' : 'Weight (kg):'}</b></label>
                <input value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder={isAr ? 'مثال: 75' : 'e.g. 75'} />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'فصيلة الدم:' : 'Blood Type:'}</b></label>
                <input value={bloodInput} onChange={(e) => setBloodInput(e.target.value)} placeholder="A+, O+, B-..." />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'النوع:' : 'Gender:'}</b></label>
                <SmartChoiceSelect
                  value={genderInput}
                  onChange={(val) => setGenderInput(val)}
                  placeholder={isAr ? '— اختر النوع —' : '— Select Gender —'}
                  modalTitle={isAr ? '👤 اختر النوع (الجنس)' : 'Select Gender'}
                  options={[
                    { value: 'male', icon: '👨', label: isAr ? 'ذكر' : 'Male', description: isAr ? 'حساب الجرعات القياسية للرجال' : 'Standard male clinical dosing' },
                    { value: 'female', icon: '👩', label: isAr ? 'أنثى' : 'Female', description: isAr ? 'تفعيل فحص أمان الأدوية مع الحمل والرضاعة' : 'Enables pregnancy & lactation safety checks' },
                  ]}
                />
              </div>

              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكلى:' : 'Renal Function:'}</b></label>
                <SmartChoiceSelect
                  value={profile.renalStatus || 'unknown'}
                  onChange={(val) =>
                    setProfile((prev) => ({
                      ...prev,
                      renalStatus: val as 'normal' | 'impaired' | 'unknown',
                    }))
                  }
                  modalTitle={isAr ? '🫘 حالة كفاءة وظائف الكلى' : 'Renal Function Status'}
                  modalSubtitle={isAr ? 'يستخدمها الذكاء الاصطناعي لتعديل جرعات الأدوية التي تفرز عبر الكلى' : 'Used to adjust renally cleared medications'}
                  options={[
                    { value: 'normal', icon: '✅', label: isAr ? 'طبيعية (Normal)' : 'Normal', description: isAr ? 'وظائف الكلى سليمة ولا تحتاج لتخفيض الجرعات' : 'Normal kidney clearance', badge: isAr ? 'جرعة قياسية آمنة' : 'Standard dose' },
                    { value: 'impaired', icon: '⚠️', label: isAr ? 'قصور كلوي يحتاج تعديل جرعة' : 'Impaired (Dose Adjustment)', description: isAr ? 'تنبيه إلزامي لتقليل جرعات المضادات الحيوية والمسكنات الكلوية' : 'Requires renal dose adjustment', badge: isAr ? '🚨 حماية الكلى مفعلة' : 'Renal guard active' },
                    { value: 'unknown', icon: '❓', label: isAr ? 'غير محدد' : 'Unknown', description: isAr ? 'لم يتم إجراء تحليل كرياتينين مؤخراً' : 'No recent lab test' },
                  ]}
                />
              </div>

              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكبد:' : 'Hepatic Function:'}</b></label>
                <SmartChoiceSelect
                  value={profile.hepaticStatus || 'unknown'}
                  onChange={(val) =>
                    setProfile((prev) => ({
                      ...prev,
                      hepaticStatus: val as 'normal' | 'impaired' | 'unknown',
                    }))
                  }
                  modalTitle={isAr ? '🛡️ حالة كفاءة وظائف الكبد' : 'Hepatic Function Status'}
                  modalSubtitle={isAr ? 'لحمايتك من الأدوية التي تسبب إجهاداً أو سمية لخلايا الكبد' : 'Screens for hepatotoxic medications'}
                  options={[
                    { value: 'normal', icon: '✅', label: isAr ? 'طبيعية (Normal)' : 'Normal', description: isAr ? 'إنزيمات ووظائف الكبد طبيعية' : 'Normal liver enzymes', badge: isAr ? 'تمثيل دوائي سليم' : 'Normal metabolism' },
                    { value: 'impaired', icon: '⚠️', label: isAr ? 'قصور كبدي' : 'Impaired Hepatic Function', description: isAr ? 'تحذير فوري من الجرعات العالية للباراسيتامول والأدوية الكبدية' : 'Alerts on hepatotoxic drugs', badge: isAr ? '🚨 حماية الكبد مفعلة' : 'Liver guard active' },
                    { value: 'unknown', icon: '❓', label: isAr ? 'غير محدد' : 'Unknown', description: isAr ? 'لم يتم إجراء فحص وظائف كبد مؤخراً' : 'Not tested recently' },
                  ]}
                />
              </div>

              <div className="form-group form-group-full">
                <label><b>{isAr ? 'رقم هاتف الطوارئ:' : 'Emergency Contact:'}</b></label>
                <input value={contactInput} onChange={(e) => setContactInput(e.target.value)} placeholder="01xxxxxxxxx" />
              </div>

              <div
                className="form-group form-group-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 95, 70, 0.12) 100%)',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '2px solid #10b981',
                  marginTop: '6px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#059669' }}>
                  <span style={{ fontSize: '1.3rem' }}>🚗⚙️</span>
                  <strong style={{ fontSize: '0.98rem' }}>
                    {isAr
                      ? 'المهنة وبيئة العمل:'
                      : 'Occupation & Daily Work Safety Category:'}
                  </strong>
                </label>

                <SmartChoiceSelect
                  value={occupationInput}
                  onChange={(val) => setOccupationInput(val)}
                  modalTitle={isAr ? 'اختر مهنتك لتأمين دوائك' : 'Select Your Occupation'}
                  modalSubtitle={isAr ? 'يقوم الذكاء الاصطناعي بفحص أي دواء تبحث عنه ضد النعاس والدوخة وحساسية الصدر المهنية' : 'AI automatically screens your medications against workplace hazards'}
                  options={[
                    {
                      value: 'driver_transport',
                      icon: '🚗',
                      label: isAr ? 'سائق طريق ومواصلات' : 'Driver & Transport',
                      description: isAr ? 'سيارة، تاكسي، نقل ثقيل، سفر دائم — تحذير إلزامي من النعاس والدوخة' : 'Alert for drowsiness and blurred vision',
                      badge: isAr ? '🚨 فحص حرج للنعاس والدوخة' : 'Critical Drowsiness Check',
                    },
                    {
                      value: 'machinery_factory',
                      icon: '⚙️',
                      label: isAr ? 'عامل مصنع وماكينات' : 'Factory & Machinery Operator',
                      description: isAr ? 'تشغيل آلات حادة، غبار، بودرة، كيماويات — فحص سرعة الاستجابة وحماية الصدر' : 'Alert for reaction speed and respiratory dust hazards',
                      badge: isAr ? 'فحص أمان الصدر والماكينات' : 'Lung & Machinery Guard',
                    },
                    {
                      value: 'office_desk',
                      icon: '💻',
                      label: isAr ? 'عمل مكتبي أو إداري' : 'Office & Desk Job',
                      description: isAr ? 'كمبيوتر، شاشات، أعمال إدارية وهندسية ومحاسبية' : 'Computer and administrative work',
                      badge: isAr ? '🧠 فحص الإجهاد الذهني' : 'Mental Focus Check',
                    },
                    {
                      value: 'student',
                      icon: '🎓',
                      label: isAr ? 'طالب / دراسة وامتحانات' : 'Student & Academics',
                      description: isAr ? 'مذاكرة، مدرسة، جامعة — فحص تأثير الدواء على التركيز والذاكرة والاستيعاب' : 'Alert for memory and cognitive focus',
                      badge: isAr ? '📚 فحص التركيز والذاكرة' : 'Cognitive Alertness',
                    },
                    {
                      value: 'homemaker',
                      icon: '🏡',
                      label: isAr ? 'ربت منزل / رعاية أسرية' : 'Homemaker & Caregiver',
                      description: isAr ? 'رعاية أطفال وأعمال منزلية ومجهود يومي مستمر' : 'Child care and daily household tasks',
                      badge: isAr ? '🛡️ أمان التفاعل الأسري' : 'Family Care Safety',
                    },
                    {
                      value: 'general',
                      icon: '🩺',
                      label: isAr ? 'فحص عام اعتيادي' : 'General Health',
                      description: isAr ? 'رعاية صحية دورية دون متطلبات مهنية خاصة' : 'Standard clinical safety checks',
                      badge: isAr ? '✅ فحص سريري قياسي' : 'Standard Check',
                    },
                    {
                      value: 'other',
                      icon: '✍️',
                      label: isAr ? 'غير ذلك (مهنة خاصة)' : 'Other Occupation',
                      description: isAr ? 'اكتب اسم وظيفتك وطبيعة عملك بنفسك لتخصيص الفحص' : 'Type your custom occupation title',
                      badge: isAr ? '✨ تخصيص مهني كامل' : 'Custom Occupation',
                    },
                  ]}
                />

                {/* Sub-Panel: When "عامل مصنع وماكينات" is selected */}
                {occupationInput === 'machinery_factory' && (
                  <div
                    style={{
                      background: 'rgba(2, 132, 199, 0.12)',
                      borderRadius: '14px',
                      border: '1.5px solid #0284c7',
                      padding: '12px 14px',
                      marginTop: '10px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 800, fontSize: '0.9rem', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏭</span>
                      <span>
                        {isAr
                          ? 'طبيعة بيئة المصنع والمواد التي تتعرض لها (لحماية الصدر والرئتين):'
                          : 'Factory Environment & Airborne Exposure (Lung Safety):'}
                      </span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {[
                        { id: 'dust_powder', icon: '💨', labelAr: 'أتربة وغبار وبودرة (أسمنت، جبس، سيراميك)' },
                        { id: 'chemicals_fumes', icon: '🧪', labelAr: 'كيماويات وأبخرة ومذيبات' },
                        { id: 'textile_cotton', icon: '🧵', labelAr: 'غزل ونسيج وألياف قطن' },
                        { id: 'paints_solvents', icon: '🎨', labelAr: 'دهانات ورش دوكو وصبغات' },
                        { id: 'sharp_machinery', icon: '🔨', labelAr: 'ماكينات حادة وضوضاء ثقيلة' },
                      ].map((item) => {
                        const isChecked = factoryHazardsInput.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setFactoryHazardsInput((prev) => prev.filter((x) => x !== item.id));
                              } else {
                                setFactoryHazardsInput((prev) => [...prev, item.id]);
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: isChecked ? '1.5px solid #0284c7' : '1px solid #94a3b8',
                              background: isChecked ? '#0284c7' : 'var(--card-bg, #ffffff)',
                              color: isChecked ? '#ffffff' : 'var(--ink, #0D1F38)',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>{item.icon}</span>
                            <span>{item.labelAr}</span>
                            {isChecked && <span>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      rows={2}
                      value={workEnvironmentNotesInput}
                      onChange={(e) => setWorkEnvironmentNotesInput(e.target.value)}
                      placeholder={
                        isAr
                          ? 'تفاصيل إضافية عن بيئة العمل (مثلاً: مصنع سيراميك وفيه بودرة وأتربة دايماً)...'
                          : 'Additional workplace environment details...'
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                )}

                {/* Sub-Panel: When "غير ذلك (وظيفة أخرى)" is selected */}
                {occupationInput === 'other' && (
                  <div
                    style={{
                      background: 'rgba(139, 92, 246, 0.12)',
                      borderRadius: '14px',
                      border: '1.5px solid #8b5cf6',
                      padding: '12px 14px',
                      marginTop: '10px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 800, fontSize: '0.9rem', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>✍️</span>
                      <span>
                        {isAr ? 'اكتب اسم وظيفتك وطبيعة عملك بالتفصيل:' : 'Type Your Custom Occupation Title:'}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={customOccupationInput}
                      onChange={(e) => setCustomOccupationInput(e.target.value)}
                      placeholder={
                        isAr
                          ? 'مثال: طيار مدني، غطاس بحري، نجار مسلح، شيف مطبخ ساخن، كهربائي ضغط عالي...'
                          : 'e.g. Airline pilot, Deep sea diver, Construction worker, Chef...'
                      }
                    />
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '8px', fontWeight: 700 }}>
                  {isAr
                    ? 'يتم فحص الأدوية تلقائياً وفقاً لمتطلبات اليقظة والسلامة المهنية الخاصة بعملك.'
                    : 'Tap the field above to open the interactive occupation choice cards!'}
                </div>
              </div>
            </div>
            <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
              {isAr ? 'حفظ البيانات ومزامنة الـ QR' : 'Save & Sync QR'}
            </button>
          </form>
        ) : (
          <div className="profile-details-grid">
            <div className="profile-detail-full"><b>{isAr ? 'الاسم:' : 'Name:'}</b> {profile.displayName || (isAr ? 'غير مسجل' : 'Not set')}</div>
            <div><b>{isAr ? 'العمر:' : 'Age:'}</b> {profile.age || '—'}</div>
            <div><b>{isAr ? 'الوزن:' : 'Weight:'}</b> {profile.weightKg ? `${profile.weightKg} ${isAr ? 'كجم' : 'kg'}` : '—'}</div>
            <div><b>{isAr ? 'فصيلة الدم:' : 'Blood Type:'}</b> {profile.bloodType || '—'}</div>
            <div><b>{isAr ? 'النوع:' : 'Gender:'}</b> {profile.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : profile.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : '—'}</div>
            <div className="profile-detail-full"><b>{isAr ? 'هاتف الطوارئ:' : 'Emergency Phone:'}</b> {profile.emergencyContact || '—'}</div>
            <div className="profile-detail-full" style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <b style={{ color: '#065f46' }}>{isAr ? 'المهنة وطبيعة العمل:' : 'Occupation:'}</b>{' '}
                  <strong style={{ color: '#0D1F38' }}>
                    {profile.occupation === 'driver_transport'
                      ? (isAr ? 'سائق (فحص أمان السواقة والنعاس مفعل)' : 'Driver (Driving & Drowsiness Guard Active)')
                      : profile.occupation === 'machinery_factory'
                      ? (isAr ? 'عامل مصنع وماكينات (فحص الصدر والتركيز مفعل)' : 'Machinery Operator')
                      : profile.occupation === 'office_desk'
                      ? (isAr ? 'عمل مكتبي وإداري' : 'Office Desk')
                      : profile.occupation === 'student'
                      ? (isAr ? 'طالب / دراسة وامتحانات' : 'Student')
                      : profile.occupation === 'homemaker'
                      ? (isAr ? 'ربت منزل / رعاية أسرية' : 'Homemaker')
                      : profile.occupation === 'other'
                      ? (isAr ? `${profile.customOccupationTitle || 'مهنة خاصة'}` : `${profile.customOccupationTitle || 'Custom Occupation'}`)
                      : (isAr ? 'فحص عام اعتيادي' : 'General')}
                  </strong>
                </div>
              </div>
              {profile.occupation === 'machinery_factory' && ((profile.factoryEnvironmentHazards && profile.factoryEnvironmentHazards.length > 0) || profile.workEnvironmentNotes) && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(16, 185, 129, 0.4)', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 800, color: '#047857' }}>
                    {isAr ? 'بيئة المصنع المحذورة للصدر والرئتين:' : 'Factory Hazards:'}
                  </span>{' '}
                  {profile.factoryEnvironmentHazards && profile.factoryEnvironmentHazards.map((h) => (
                    <span key={h} className="badge" style={{ marginInlineEnd: '4px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '0.75rem' }}>
                      {h === 'dust_powder' ? 'أتربة وغبار وبودرة'
                        : h === 'chemicals_fumes' ? 'أبخرة وكيماويات'
                        : h === 'textile_cotton' ? 'ألياف وغزل قطني'
                        : h === 'paints_solvents' ? 'دهانات ورش دوكو'
                        : h === 'sharp_machinery' ? 'ماكينات حادة ثقيلة'
                        : h}
                    </span>
                  ))}
                  {profile.workEnvironmentNotes && (
                    <div style={{ color: '#065f46', marginTop: '4px', fontStyle: 'italic' }}>
                      📝 {profile.workEnvironmentNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Integrated Complete Patient Treatment Journey Card */}
      <section className="card stack" style={{ borderTop: '4px solid #0284c7' }}>
        <div className="card-head-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>
              🗓️{' '}
              {isAr
                ? 'رحلتي العلاجية وروشتاتي المحفوظة بحسابي (Complete Treatment Journey):'
                : 'My Saved Treatment Journey & Verified Prescriptions:'}
            </h2>
            <p className="small muted">
              {isAr
                ? 'الروشتات الملتقطة، حالة التوثيق الطبي، وجداول الجرعات اليومية المتزامنة مع حسابك عبر الأجهزة.'
                : 'Captured prescriptions, verification status, and active dose schedules synchronized with your account.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/prescription-radar" className="btn small">
              📡 {isAr ? 'التقاط/فحص روشتة في الرادار' : 'Open Prescription Radar'}
            </Link>
            <Link to="/tracker" className="btn-secondary small">
              ⏱️ {isAr ? 'متابع الجرعات والتقرير' : 'Open Dose Tracker'}
            </Link>
            {(schedules.length > 0 || prescriptions.length > 0) && (
              <button type="button" className="btn-secondary small" onClick={exportFullTreatmentJourney}>
                📥 {isAr ? 'تصدير تقرير الرحلة العلاجية (JSON)' : 'Export Journey Report (JSON)'}
              </button>
            )}
          </div>
        </div>

        {schedules.length === 0 && prescriptions.length === 0 ? (
          <div className="empty-state-box">
            <span>📡</span>
            <p>
              {isAr
                ? 'لا توجد روشتات أو جداول علاجية محفوظة بعد. يمكنك تصوير الروشتة أو إدخالها في رادار الروشتة أو عبر المساعد الذكي لبدء رحلة العلاج.'
                : 'No saved prescriptions or active treatment schedules yet. Capture or enter a prescription in Prescription Radar or via the AI Assistant to begin.'}
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: '12px' }}>
            {schedules.map((sch) => {
              const stats = calculateScheduleProgress(sch);
              return (
                <div key={sch.id} className="med-record-card" style={{ padding: '14px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>💊 {sch.medicineName}</h4>
                        <span className="verification-badge verified">
                          {formatVerificationStatusLabel(sch.verificationStatus, isAr)}
                        </span>
                        {sch.captureMethod && (
                          <span className="badge">{formatCaptureMethodLabel(sch.captureMethod, isAr)}</span>
                        )}
                      </div>
                      <p className="small muted" style={{ margin: '4px 0' }}>
                        {[
                          sch.prescribedDose,
                          formatRouteLabel(sch.route, isAr),
                          formatFrequencyLabel(sch.frequency, isAr),
                          `${sch.durationDays} ${isAr ? 'أيام' : 'days'} (${sch.startDate} → ${sch.endDate})`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="small" style={{ margin: '4px 0 0' }}>
                        <b>{isAr ? 'الالتزام المسجل:' : 'Recorded Adherence:'}</b> {stats.progressPercent}% (
                        {isAr ? 'تم أخذها:' : 'Taken:'} {stats.takenCount}/{stats.totalDoses} ·{' '}
                        {isAr ? 'فائتة مؤكدة:' : 'Confirmed Missed:'} {stats.missedCount} ·{' '}
                        {isAr ? 'غير مسجلة:' : 'Missing Record:'} {stats.unconfirmedCount})
                      </p>
                    </div>
                    <div className="row wrapRow" style={{ gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary small"
                        onClick={() => downloadScheduleIcs(sch, isAr)}
                      >
                        📅 {isAr ? 'منبهات (.ics)' : 'Alarms (.ics)'}
                      </button>
                      <Link to="/tracker" className="btn small">
                        ⏱️ {isAr ? 'تسجيل الجرعات' : 'Log Doses'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {prescriptions
              .filter((rx) => !rx.linkedScheduleId || rx.verificationStatus !== 'verified_by_patient')
              .map((rx) => (
                <div key={rx.id} className="rx-queue-card">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                        <strong>{rx.medicineName}</strong>
                        <span
                          className={`verification-badge ${
                            rx.verificationStatus === 'needs_clarification' ? 'clarify' : 'unverified'
                          }`}
                        >
                          {formatVerificationStatusLabel(rx.verificationStatus, isAr)}
                        </span>
                      </div>
                      <small className="muted">
                        {isAr ? 'تاريخ الحفظ:' : 'Saved:'} {formatTimestampReadable(rx.updatedAt, isAr)}
                      </small>
                    </div>
                    <Link to="/prescription-radar" className="btn-secondary small">
                      🔍 {isAr ? 'مراجعة وتوثيق في الرادار' : 'Review & Verify in Radar'}
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Section 1: My Allergies */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>🚨 {isAr ? 'سجل الحساسية الدوائية (My Allergies):' : 'Documented Drug Allergies:'}</h2>
            <p className="small muted">
              {isAr
                ? 'الأدوية التي تعرضت منها سابقاً لأي تفاعل تحسسي أو طفح جلدي أو ضيق تنفس.'
                : 'Medications or active ingredient families that have caused past allergic responses.'}
            </p>
          </div>
          <button type="button" className="btn" onClick={() => setShowAllergyModal(true)}>
            ➕ {isAr ? 'تسجيل دواء يسبب حساسية' : 'Add Allergy Record'}
          </button>
        </div>

        {profile.allergies.length === 0 ? (
          <div className="empty-state-box">
            <span>🛡️</span>
            <p>{isAr ? 'لا توجد أدوية مسببة للحساسية مسجلة حالياً في ملفك.' : 'No drug allergies documented yet.'}</p>
          </div>
        ) : (
          <div className="allergy-cards-stack">
            {profile.allergies.map((all) => {
              const cat = ALLERGEN_CATEGORIES.find((c) => c.id === all.allergenKey);
              return (
                <div key={all.id} className="allergy-item-card">
                  <div className="allergy-item-head">
                    <div>
                      <h3 className="allergy-drug-name">⚠️ {all.drugName}</h3>
                      <span className="small muted">
                        <b>{isAr ? 'العائلة الدوائية:' : 'Family:'}</b> {cat ? pick(cat.name, lang) : all.allergenKey}
                      </span>
                    </div>
                    <div className="allergy-badges">
                      {renderSeverityBadge(all.severity)}
                      <button type="button" className="btn-secondary danger" onClick={() => deleteAllergy(all.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="allergy-item-body">
                    {all.reportedSymptoms && (
                      <p className="symptom-line">
                        <b>{isAr ? 'الأعراض التي حدثت:' : 'Symptoms:'}</b> {all.reportedSymptoms}
                      </p>
                    )}
                    {all.notes && <p className="notes-line">📝 {all.notes}</p>}
                    <small className="muted evidence-tag">
                      {isAr ? 'حالة التوثيق:' : 'Evidence:'}{' '}
                      {all.evidenceStatus === 'clinically_verified'
                        ? (isAr ? 'مؤكدة طبياً بفحص الحساسية ✅' : 'Clinically Verified')
                        : (isAr ? 'أبلغ عنها المريض' : 'Patient-Reported')}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: My Medications */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>💊 {isAr ? 'قائمة أدويتي الحالية والسابقة:' : 'My Medications:'}</h2>
            <p className="small muted">
              {isAr
                ? 'سجل للأدوية التي تتناولها حالياً للرجوع إليها وفحص تداخلاتها.'
                : 'List of your active and past prescriptions for medication reconciliation.'}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setShowMedModal(true)}>
            ➕ {isAr ? 'إضافة دواء' : 'Add Medication'}
          </button>
        </div>

        {profile.medications.length === 0 ? (
          <div className="empty-state-box">
            <span>💊</span>
            <p>{isAr ? 'لا توجد أدوية مسجلة حالياً.' : 'No medications recorded.'}</p>
          </div>
        ) : (
          <div className="med-cards-stack">
            {profile.medications.map((m) => (
              <div key={m.id} className="med-record-card">
                <div className="med-record-head">
                  <div>
                    <h4>{m.drugName}</h4>
                    <span className="small muted">
                      {[m.prescribedDose, formatFrequencyLabel(m.frequency, isAr)].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="med-record-actions">
                    <span className={`status-pill ${m.status === 'active' ? 'taken' : 'upcoming'}`}>
                      {m.status === 'active'
                        ? isAr
                          ? 'حالي'
                          : 'Active'
                        : m.status === 'discontinued'
                          ? isAr
                            ? 'متوقف'
                            : 'Discontinued'
                          : isAr
                            ? 'مكتمل'
                            : 'Past'}
                    </span>
                    <button type="button" className="undo-btn" onClick={() => deleteMedication(m.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Uploaded Medical Documents & Lab Reports */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>📂 {isAr ? 'التقارير والتحاليل والمستندات الطبية المرفوعة:' : 'Uploaded Medical Documents & Lab Reports:'}</h2>
            <p className="small muted">
              {isAr
                ? 'المستندات وصور الروشتات والتحاليل المحفوظة عبر المساعد الصحي الذكي.'
                : 'Medical documents, lab results, and prescription images saved via the AI Health Assistant.'}
            </p>
          </div>
          <Link to="/assistant" className="btn-secondary small">
            📎 {isAr ? 'رفع مستند جديد عبر المساعد' : 'Upload via Assistant'}
          </Link>
        </div>

        {(!profile.medicalDocuments || profile.medicalDocuments.length === 0) ? (
          <div className="empty-state-box">
            <span>📂</span>
            <p>
              {isAr
                ? 'لا توجد تقارير أو تحاليل مرفوعة بعد. يمكنك إرفاق أي صورة روشتة أو تحليل عبر زر 📎 في المساعد الذكي.'
                : 'No medical documents uploaded yet. Attach a prescription or lab report using 📎 in the AI Assistant.'}
            </p>
          </div>
        ) : (
          <div className="med-cards-stack">
            {profile.medicalDocuments.map((docItem) => (
              <div key={docItem.id} className="med-record-card" style={{ padding: '12px' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {docItem.previewDataUrl && (
                      <img
                        src={docItem.previewDataUrl}
                        alt={docItem.title}
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
                      />
                    )}
                    <div>
                      <h4 style={{ margin: 0 }}>{docItem.title}</h4>
                      <p className="small muted" style={{ margin: '4px 0' }}>{docItem.extractedSummary}</p>
                      <small className="muted">
                        {docItem.createdAt.slice(0, 10)} ·{' '}
                        {docItem.verificationStatus === 'patient_confirmed'
                          ? (isAr ? 'مؤكد من المريض ✅' : 'Patient Confirmed ✅')
                          : (isAr ? 'يحتاج مراجعة ⚠️' : 'Needs Review ⚠️')}
                      </small>
                    </div>
                  </div>
                  <button type="button" className="undo-btn" onClick={() => deleteMedicalDocument(docItem.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Management Controls */}
      <div className="profile-footer-actions">
        <button type="button" className="btn-secondary" onClick={exportProfileData}>
          📥 {isAr ? 'تصدير وحفظ الملف الصحي (JSON)' : 'Export Health Profile (JSON)'}
        </button>
        <button type="button" className="btn-secondary" onClick={exportFullTreatmentJourney}>
          📄 {isAr ? 'تصدير تقرير رحلة العلاج الكامل (JSON)' : 'Export Complete Treatment Journey (JSON)'}
        </button>
        <button type="button" className="btn-secondary danger" onClick={clearAllData}>
          🗑️ {isAr ? 'مسح بيانات الملف' : 'Reset Profile'}
        </button>
      </div>

      {/* Add Allergy Modal */}
      {showAllergyModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowAllergyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{isAr ? 'تسجيل دواء يسبب حساسية للمريض' : 'Record Drug Allergy'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowAllergyModal(false)}>✕</button>
            </div>

            <form onSubmit={addAllergy} className="stack modal-form">
              <div className="form-group">
                <label><b>{isAr ? 'اسم الدواء المسبب للحساسية:' : 'Allergenic Medication Name:'} *</b></label>
                <input
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder={isAr ? 'مثال: أوجمنتين، بنسلين، سبتازول...' : 'e.g. Amoxicillin, Penicillin, Augmentin'}
                  required
                />
              </div>

              <div className="form-group">
                <label><b>{isAr ? 'العائلة الدوائية المسببة:' : 'Allergen Family:'}</b></label>
                <SmartChoiceSelect
                  value={allergenKey}
                  onChange={(val) => setAllergenKey(val)}
                  modalTitle={isAr ? '🛡️ اختر العائلة الدوائية المسببة للحساسية' : 'Select Allergen Family'}
                  options={ALLERGEN_CATEGORIES.map((c) => ({
                    value: c.id,
                    icon: '💊',
                    label: pick(c.name, lang),
                    description: pick(c.examples, lang),
                  }))}
                />
              </div>

              <div className="form-group">
                <label><b>{isAr ? 'الأعراض التي ظهرت عليك:' : 'Reported Symptoms:'} *</b></label>
                <input
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={isAr ? 'مثال: طفح جلدي حاك، تورم في الشفتين أو الوجه، صعوبة تنفس' : 'e.g. Hives, lip swelling, wheezing'}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'درجة الخطورة:' : 'Severity:'}</b></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {[
                      { id: 'life_threatening', icon: '🚨', labelAr: 'مهددة للحياة', descAr: 'صدمة تحسسية' },
                      { id: 'severe', icon: '🔴', labelAr: 'شديدة', descAr: 'تورم وضيق تنفس' },
                      { id: 'moderate', icon: '🟠', labelAr: 'متوسطة', descAr: 'طفح جلدي واسع' },
                      { id: 'mild', icon: '🟢', labelAr: 'خفيفة', descAr: 'حكة طفيفة' },
                    ].map((s) => {
                      const active = severity === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSeverity(s.id as AllergySeverity)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '12px',
                            border: active ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                            background: active ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            textAlign: 'start',
                            boxShadow: active ? '0 0 10px rgba(239, 68, 68, 0.35)' : 'none',
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                          <div>
                            <b style={{ fontSize: '0.8rem', display: 'block', color: active ? '#fca5a5' : '#f8fafc' }}>{s.labelAr}</b>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{s.descAr}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label><b>{isAr ? 'حالة التوثيق:' : 'Evidence Status:'}</b></label>
                  <SmartChoiceSelect
                    value={evidence}
                    onChange={(val) => setEvidence(val as EvidenceStatus)}
                    modalTitle={isAr ? 'حالة توثيق الحساسية' : 'Evidence Status'}
                    options={[
                      { value: 'patient_reported', icon: '🗣️', label: isAr ? 'أبلغ عنها المريض' : 'Patient-Reported', description: isAr ? 'ظهرت أعراض سابقة عند تناول الدواء' : 'Previous reaction reported' },
                      { value: 'clinically_verified', icon: '🔬', label: isAr ? 'مؤكدة سريرياً باختبار جلد' : 'Clinically Verified', description: isAr ? 'مثبتة باختبار حساسية أو تقرير طبي' : 'Verified by skin test' },
                      { value: 'suspected', icon: '❓', label: isAr ? 'مشتبه بها فقط' : 'Suspected', description: isAr ? 'أعراض غير مؤكدة وتحتاج حذر' : 'Uncertain reaction' },
                    ]}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn">
                  {isAr ? 'حفظ الحساسية' : 'Save Record'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAllergyModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Medication Modal */}
      {showMedModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowMedModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{isAr ? 'إضافة دواء إلى السجل' : 'Add Medication'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowMedModal(false)}>✕</button>
            </div>

            <form onSubmit={addMedication} className="stack modal-form">
              <div className="form-group">
                <label><b>{isAr ? 'اسم الدواء:' : 'Medication Name:'} *</b></label>
                <input value={medDrugName} onChange={(e) => setMedDrugName(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'الجرعة:' : 'Dose:'}</b></label>
                  <input value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder="e.g. 500mg" />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'عدد المرات يومياً:' : 'Frequency:'}</b></label>
                  <SmartNativeSelect value={medFreq} onChange={(e) => setMedFreq(e.target.value)}>
                    <option value="once_daily">{formatFrequencyLabel('once_daily', isAr)}</option>
                    <option value="twice_daily">{formatFrequencyLabel('twice_daily', isAr)}</option>
                    <option value="thrice_daily">{formatFrequencyLabel('thrice_daily', isAr)}</option>
                    <option value="four_times_daily">{formatFrequencyLabel('four_times_daily', isAr)}</option>
                  </SmartNativeSelect>
                </div>
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'الحالة:' : 'Status:'}</b></label>
                <SmartNativeSelect value={medStatus} onChange={(e) => setMedStatus(e.target.value as 'active' | 'completed' | 'discontinued')}>
                  <option value="active">{isAr ? 'حالي' : 'Active'}</option>
                  <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                  <option value="discontinued">{isAr ? 'متوقف' : 'Discontinued'}</option>
                </SmartNativeSelect>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn">{isAr ? 'حفظ الدواء' : 'Save'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowMedModal(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════ الكارت الطبي الذكي وبطاقة الطوارئ (متاح للزوار والمسجلين) ══════════════ */}
      <section className="card stack" style={{ borderTop: '4px solid #138866', marginTop: 8 }}>
        <div className="card-head-row no-print" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="section-title">
            {isAr ? 'الكارت الطبي الذكي — دوايا | DAWAYA (QR الطوارئ للمستشفى والطبيب)' : 'DAWAYA Smart Medical ID & Emergency Passport'}
          </h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn small"
              onClick={() => {
                setEditingPersonal(true);
                window.scrollTo({ top: 220, behavior: 'smooth' });
              }}
            >
              {isAr ? 'إدخال العمر وفصيلة الدم والوزن' : 'Edit Age & Blood Type'}
            </button>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => setShowAllergyModal(true)}
            >
              ➕ {isAr ? 'إضافة حساسية' : 'Add Allergy'}
            </button>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => window.print()}
            >
              🖨️ {isAr ? 'طباعة الكارت الطبي' : 'Print Medical ID'}
            </button>
            <Link to="/passport" className="btn small ghost">
              🔎 {isAr ? 'فتح الكارت في شاشة كاملة' : 'Full Screen Card'}
            </Link>
          </div>
        </div>

        {/* الكارت الطبي المرئي بهوية دوايا الشاملة */}
        <DawayaPassportCardUI
          name={profile.displayName || profile.fullName || user?.displayName || ''}
          age={profile.age || (profile.ageYears ? String(profile.ageYears) : '')}
          weightKg={profile.weightKg}
          bloodType={profile.bloodType}
          gender={profile.gender}
          emergencyContact={profile.emergencyContact}
          photoUrl={passportPhoto}
          uid={effectiveUid}
          qrDataUrl={passportQrDataUrl}
          isAr={isAr}
          allergiesCount={profile.allergies.length}
          medsCount={
            profile.medications.filter((m) => m.status === 'active').length +
            (profile.activeMedications?.length || 0) +
            schedules.length
          }
          chronicCount={passportChronicList.length}
          onPhotoClick={() => photoFileRef.current?.click()}
          photoLoading={passportPhotoLoading}
        />
        <input
          ref={photoFileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePassportPhoto}
        />

        {/* أزرار سريعة تحت الكارت مباشرة للتحميل والطباعة والمشاركة */}
        <div className="row wrapRow no-print" style={{ justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            className="btn small"
            style={{ background: '#138866', borderColor: '#138866', color: '#101E36', fontWeight: 800 }}
            onClick={handleShareImage}
          >
            {isAr ? 'تنزيل الكارت كصورة (HD PNG)' : 'Download ID Card (PNG)'}
          </button>
          <button
            type="button"
            className="btn-secondary small"
            onClick={() => window.print()}
          >
            {isAr ? 'طباعة الكارت الطبي' : 'Print Medical ID'}
          </button>
          <button
            type="button"
            className="btn-secondary small"
            onClick={() => photoFileRef.current?.click()}
          >
            📷 {isAr ? 'تغيير صورة الكارت' : 'Change Photo'}
          </button>
          <button
            type="button"
            className="btn-secondary small"
            onClick={handleShareLink}
          >
            🔗 {isAr ? 'نسخ / مشاركة رابط الـ QR' : 'Copy / Share QR Link'}
          </button>
        </div>

        {passportLoading ? (
          <p className="small muted no-print">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
        ) : (
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--tint, #f8fafc)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--line, #e2e8f0)' }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text, #101E36)', fontSize: '0.88rem' }}>
                  🔑 {isAr ? 'كود حماية البطاقة (PIN للطوارئ والعيادات)' : 'Medical ID PIN Code'}
                </div>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {savedPin
                    ? '● ● ● ●'
                    : isAr
                      ? 'اختياري: عيّن PIN لحماية السجل السحابي الكامل، أو اتركه فارغاً ليفتح الـ QR بيانات الطوارئ فوراً'
                      : 'Optional: Set a PIN for full cloud sync, or leave unset for instant emergency QR view'}
                </div>
              </div>
              <button
                type="button"
                className="btn small"
                style={{ fontSize: '0.78rem' }}
                onClick={() => { setShowPinSetup(true); setPinInput(''); }}
              >
                {savedPin ? (isAr ? 'تغيير PIN' : 'Change PIN') : (isAr ? '+ تعيين PIN' : '+ Set PIN')}
              </button>
            </div>

            {showPinSetup && (
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 14px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 8, fontSize: '0.85rem' }}>
                  {savedPin ? (isAr ? 'تغيير الـ PIN' : 'Change PIN') : (isAr ? 'تعيين PIN جديد (4 أرقام على الأقل)' : 'Set New PIN (min 4 digits)')}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="● ● ● ●"
                    style={{ flex: 1, minWidth: 140, textAlign: 'center', fontSize: '1.2rem', letterSpacing: 6 }}
                  />
                  <button
                    type="button"
                    className="btn"
                    disabled={pinInput.length < 4 || pinSaving}
                    onClick={handleSavePin}
                    style={{ background: '#101E36', color: '#fff' }}
                  >
                    {pinSaving ? '⏳' : (isAr ? 'حفظ وتفعيل' : 'Save')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowPinSetup(false)}
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {passportIsActive ? (
              <div style={{ background: '#d1fae5', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #6ee7b7' }}>
                <div style={{ fontWeight: 800, color: '#065f46', marginBottom: 4 }}>
                  ✅ {isAr ? 'المشاركة السحابية للبطاقة مفعّلة الآن' : 'Cloud Passport Sharing is Active'}
                </div>
                <div className="small" style={{ color: '#047857', marginBottom: 10 }}>
                  ⏰ {isAr ? `تنتهي بعد ${passportRemaining} دقيقة` : `Expires in ${passportRemaining} min`}
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#ef4444', color: '#fff', border: 'none', width: '100%' }}
                  onClick={handlePassportRevoke}
                >
                  🚫 {isAr ? 'إيقاف المشاركة المؤقتة' : 'Stop Sharing'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SmartNativeSelect
                  className="input"
                  value={passportHours}
                  onChange={(e) => setPassportHours(Number(e.target.value))}
                  style={{ width: '100%' }}
                >
                  <option value={1}>{isAr ? 'مدة المشاركة: ساعة واحدة' : 'Duration: 1 Hour'}</option>
                  <option value={6}>{isAr ? 'مدة المشاركة: 6 ساعات' : 'Duration: 6 Hours'}</option>
                  <option value={12}>{isAr ? 'مدة المشاركة: 12 ساعة' : 'Duration: 12 Hours'}</option>
                  <option value={24}>{isAr ? 'مدة المشاركة: 24 ساعة' : 'Duration: 24 Hours'}</option>
                  <option value={48}>{isAr ? 'مدة المشاركة: 48 ساعة' : 'Duration: 48 Hours'}</option>
                </SmartNativeSelect>
              </div>
            )}

            {shareSuccess && (
              <div style={{ background: '#d1fae5', borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#065f46', fontSize: '0.85rem' }}>
                {shareSuccess}
              </div>
            )}

            {savedPin && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: '1 1 100%', background: '#059669', color: '#fff', fontSize: '0.86rem' }}
                  disabled={passportSharing}
                  onClick={async () => {
                    await handlePassportShare();
                    setShareSuccess(
                      isAr
                        ? '✅ تم تفعيل الـ QR وتحديث جميع بياناتك الصحية للطبيب والممرض!'
                        : '✅ QR activated and all health records synced for clinicians!'
                    );
                    setTimeout(() => setShareSuccess(''), 4000);
                  }}
                >
                  {passportSharing
                    ? '⏳'
                    : passportIsActive
                      ? (isAr ? '🔄 تحديث بيانات الـ QR وتمديد الصلاحية' : '🔄 Refresh QR Data & Extend')
                      : (isAr ? '🔓 تفعيل مشاركة البطاقة والـ QR الآن' : '🔓 Activate Passport QR Now')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* الأمراض المزمنة */}
        <div className="no-print" style={{ borderTop: '1px solid var(--line, #e2e8f0)', paddingTop: 14 }}>
          <div style={{ fontWeight: 800, color: 'var(--text, #101E36)', marginBottom: 8 }}>
            🏥 {isAr ? 'الأمراض المزمنة والحالات الصحية (تظهر على الكارت وتُفحص مع 26,562 دواء)' : 'Chronic Conditions (Displayed on ID & Screened Across 26,562 Drugs)'}
          </div>
          <p className="small muted" style={{ marginBottom: 10 }}>
            {isAr ? 'مهمة لتحديد تعارض الأدوية وتحذيرات الضغط والسكر والكلى والكبد والقلب (يمكن إضافتها من هنا أو بأمر مباشر للمساعد الذكي)' : 'Important for drug interaction checks across hypertension, diabetes, renal, hepatic, and cardiac conditions'}
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              className="input"
              value={chronicInput}
              onChange={(e) => setChronicInput(e.target.value)}
              placeholder={isAr ? 'مثال: ضغط الدم، سكري النوع 2، قصور كلوي...' : 'e.g. Hypertension, Type 2 Diabetes'}
              onKeyDown={(e) => e.key === 'Enter' && addChronic()}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn" onClick={addChronic}>{isAr ? 'إضافة' : 'Add'}</button>
          </div>
          {passportChronicList.length === 0 ? (
            <p className="small muted">{isAr ? 'لا توجد أمراض مزمنة مسجلة' : 'None added yet'}</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {passportChronicList.map((c, i) => (
                <span
                  key={i}
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  🔸 {c}
                  <button
                    type="button"
                    onClick={() => removeChronic(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', fontWeight: 900, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
    </HealthProfilePrivacyGate>
  );
}
