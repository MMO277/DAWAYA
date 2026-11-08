import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { useSyncedHealthProfile } from './allergyData';
import {
  calculateScheduleProgress,
  formatFrequencyLabel,
  formatTime12Hour,
  formatTimestampReadable,
  getDoseStatus,
  useSyncedSchedules,
} from './trackerData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import {
  DAWAYA_CATEGORY_LABELS,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import DawayaLogo from './DawayaLogo';
import Disclaimer from './Disclaimer';
import { tr } from './types';

export default function PatientDashboard() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { profile, syncing } = useSyncedHealthProfile();
  const {
    schedules,
    prescriptions,
    treatmentEvents,
    syncStatus,
    lastSyncedAt,
  } = useSyncedSchedules();
  const { indexItems, totalCount, loaded } = useDawayaDrugDatabase();

  const [quickSearch, setQuickSearch] = useState('');

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
    for (const s of schedules || []) {
      list.push({
        id: s.antibioticId || undefined,
        rawName: s.medicineName,
        name: s.medicineName,
        strength: s.prescribedDose,
        sourceType: 'prescription',
      });
    }
    return list;
  }, [profile.activeMedications, schedules]);

  const safetyReport = useMemo(
    () =>
      evaluateMedicationSafety({
        medications: allCurrentMedsInput,
        healthProfile: profile,
        includeProfileActiveMedications: true,
      }),
    [allCurrentMedsInput, profile]
  );

  // Upcoming doses across all active schedules
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
      for (const d of sch.doses || []) {
        const st = getDoseStatus(d);
        if (st === 'due_now' || st === 'upcoming' || st === 'overdue_unconfirmed') {
          out.push({
            scheduleId: sch.id,
            medicineName: sch.medicineName,
            prescribedDose: sch.prescribedDose,
            scheduledDate: d.scheduledDate,
            scheduledTime: d.scheduledTime,
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
      .slice(0, 6);
  }, [schedules]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) {
      nav('/medicines');
      return;
    }
    nav(`/medicines?q=${encodeURIComponent(quickSearch.trim())}`);
  };

  const patientDisplayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    (isAr ? 'مريض دوايا' : 'DAWAYA Patient');

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
                ? 'تابع ملفك الصحي، أدويتك الحالية، منبهات الجرعات القادمة، تنبيهات الحساسية والأمان الدوائي، والروشتات المحفوظة في مكان واحد آمن ومتزامن.'
                : 'Monitor your personal health profile, current medications, upcoming dose reminders, allergy & safety alerts, and prescriptions in one unified hub.'}
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

      {/* 3. KPI Summary Strip */}
      <section className="dawaya-kpi-grid">
        <div className="dawaya-kpi-card" style={{ borderTop: '4px solid #138866' }}>
          <div className="small muted">{isAr ? 'الأدوية الحالية النشطة' : 'Current Active Medications'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#138866' }}>
            {(profile.activeMedications?.length || 0) + schedules.length}
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
                {profile.fullName || patientDisplayName} •{' '}
                {profile.ageYears ? `${profile.ageYears} ${isAr ? 'سنة' : 'yrs'}` : isAr ? 'غير محدد' : 'Unset'}
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
                  : profile.breastfeedingStatus === 'breastfeeding'
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
            {(profile.activeMedications || []).length > 0 ? (
              <div className="stack" style={{ gap: '8px', marginTop: '6px' }}>
                {profile.activeMedications.map((med) => (
                  <div key={med.id} className="card rowcard" style={{ padding: '10px 12px' }}>
                    <div>
                      <b>💊 {med.drugName}</b>
                      {med.doseOrStrength && (
                        <span className="small muted"> — {med.doseOrStrength}</span>
                      )}
                    </div>
                    {med.resolvedDrugId && (
                      <Link to={`/medicine/${med.resolvedDrugId}`} className="btn small ghost">
                        {isAr ? 'صفحة الدواء' : 'Details'}
                      </Link>
                    )}
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
                      d.status === 'due_now'
                        ? '4px solid #138866'
                        : d.status === 'overdue_unconfirmed'
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
                  <Link to="/tracker" className="btn small">
                    {isAr ? 'توثيق الجرعة' : 'Log Dose'}
                  </Link>
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
                          {prog.taken}/{prog.total} ({prog.percent}%)
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
                ? 'لا توجد روشتات محفوظة بعد. ارفع صورة روشتتك في رادار الروشتة لاستخراج الأدوية ومواعيدها ومراجعتها قبل الحفظ.'
                : 'No saved prescriptions yet. Upload a prescription image in Prescription Radar to extract and review medications.'}
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
                    {ev.eventType} • {formatTimestampReadable(ev.timestamp, isAr)}
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
