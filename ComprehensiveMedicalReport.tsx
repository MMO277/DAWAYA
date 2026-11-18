import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr, pick } from './types';
import { useAuth } from './authContext';
import { ALLERGEN_CATEGORIES, useSyncedHealthProfile } from './allergyData';
import { formatFrequencyLabel, formatTime12Hour, useSyncedSchedules } from './trackerData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import DawayaLogo from './DawayaLogo';
import Disclaimer from './Disclaimer';

export default function ComprehensiveMedicalReport() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile } = useSyncedHealthProfile();
  const { schedules } = useSyncedSchedules();

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [isAr]);

  const patientFullName =
    profile.displayName || profile.fullName || user?.displayName || (isAr ? 'مريض منصة دوايا' : 'DAWAYA Patient');

  const chronicList: string[] = useMemo(() => {
    const out: string[] = [];
    if (Array.isArray(profile.chronicConditions)) {
      for (const c of profile.chronicConditions) {
        const name = typeof c === 'string' ? c : c?.conditionName || '';
        if (name.trim() && !out.includes(name.trim())) out.push(name.trim());
      }
    }
    try {
      const rawNotes = profile.notes || '';
      const idx = rawNotes.indexOf('CHRONIC:');
      if (idx !== -1) {
        const parsed = JSON.parse(rawNotes.slice(idx + 8).split('||')[0]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const s = String(item || '').trim();
            if (s && !out.includes(s)) out.push(s);
          }
        }
      }
    } catch {
      /* ignore */
    }
    return out;
  }, [profile.chronicConditions, profile.notes]);

  const cleanNotesText = useMemo(() => {
    const raw = profile.notes || '';
    return raw.replace(/CHRONIC:\[[^\]]*\](\|\|)?/g, '').trim();
  }, [profile.notes]);

  // Unified, deduplicated active medications list across schedules, profile.medications, and profile.activeMedications
  const unifiedMedications = useMemo(() => {
    const rows: Array<{
      name: string;
      dose: string;
      scheduleText: string;
      instructions: string;
    }> = [];
    const seen = new Set<string>();

    for (const sch of schedules || []) {
      const key = sch.medicineName.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const timesText =
        Array.isArray(sch.doseTimes) && sch.doseTimes.length > 0
          ? sch.doseTimes.map((t) => formatTime12Hour(t, isAr)).join(' • ')
          : '';
      rows.push({
        name: sch.medicineName,
        dose: sch.prescribedDose || (isAr ? 'حسب الوصفة' : 'As prescribed'),
        scheduleText: [
          formatFrequencyLabel(sch.frequency, isAr),
          timesText ? `(${timesText})` : '',
          sch.durationDays ? `${sch.durationDays} ${isAr ? 'أيام' : 'days'}` : '',
        ]
          .filter(Boolean)
          .join(' — '),
        instructions: sch.notes || (isAr ? 'الالتزام بالمواعيد اليومية المحددة' : 'Follow scheduled times'),
      });
    }

    for (const pm of profile.medications || []) {
      if (pm.status && pm.status !== 'active') continue;
      const key = (pm.drugName || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push({
        name: pm.drugName,
        dose: pm.prescribedDose || pm.dosageAndFrequency || (isAr ? 'جرعة يومية' : 'Daily dose'),
        scheduleText: pm.frequency
          ? formatFrequencyLabel(pm.frequency, isAr)
          : pm.dosageAndFrequency || (isAr ? 'بانتظام' : 'Regularly'),
        instructions: pm.indicationOrReason || (isAr ? 'علاج حالي مسجل بالملف الصحي' : 'Active profile medication'),
      });
    }

    for (const am of profile.activeMedications || []) {
      const key = (am.drugName || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push({
        name: am.drugName,
        dose: am.doseOrStrength || (isAr ? 'جرعة قياسية' : 'Standard dose'),
        scheduleText: isAr ? 'علاج حالي مستمر' : 'Ongoing active medication',
        instructions: isAr ? 'مضاف في السجل الدوائي النشط' : 'Recorded in active medications',
      });
    }

    return rows;
  }, [schedules, profile.medications, profile.activeMedications, isAr]);

  // Safety evaluation of current medications
  const safetyReport = useMemo(() => {
    const rawMeds = unifiedMedications.map((m, i) => ({
      id: `rep-${i}`,
      rawName: m.name,
    }));
    return evaluateMedicationSafety({
      medications: rawMeds,
      healthProfile: profile,
      includeProfileActiveMedications: true,
    });
  }, [unifiedMedications, profile]);

  const handleShareWhatsApp = () => {
    const allergiesText =
      (profile.allergies || []).length > 0
        ? profile.allergies.map((a) => a.drugName || a.allergenKey).join('، ')
        : isAr
          ? 'لا توجد حساسية مسجلة'
          : 'None';
    const chronicsText = chronicList.length > 0 ? chronicList.join('، ') : isAr ? 'لا توجد' : 'None';
    const medsText =
      unifiedMedications.length > 0
        ? unifiedMedications.map((m, i) => `${i + 1}. ${m.name} (${m.dose}) — ${m.scheduleText}`).join('\n')
        : isAr
          ? 'لا توجد أدوية مسجلة حالياً'
          : 'No active medications';

    const msg = isAr
      ? `📄 *التقرير الطبي الشامل — منصة دوايا | DAWAYA*\n👤 *الاسم:* ${patientFullName}\n🩸 *فصيلة الدم:* ${profile.bloodType || 'غير محددة'} | *السن:* ${profile.age || '—'} | *الوزن:* ${profile.weightKg ? `${profile.weightKg} كجم` : '—'}\n🚨 *الحساسية الدوائية:* ${allergiesText}\n🏥 *الأمراض المزمنة:* ${chronicsText}\n💊 *الأدوية الحالية ومواعيدها:*\n${medsText}`
      : `📄 *DAWAYA Medical Summary Report*\n👤 *Patient:* ${patientFullName}\n🩸 *Blood Group:* ${profile.bloodType || 'N/A'} | *Age:* ${profile.age || '—'}\n🚨 *Allergies:* ${allergiesText}\n🏥 *Chronic Conditions:* ${chronicsText}\n💊 *Active Medications:*\n${medsText}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="wrap" style={{ maxWidth: '960px', margin: '0 auto', padding: '16px' }}>
      {/* Action Bar (Hidden on Print) */}
      <section
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e3a5f 100%)',
          padding: '16px 20px',
          borderRadius: '18px',
          color: '#ffffff',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>
            📄 {tr(lang, 'التقرير الطبي الشامل المعتمد للمريض', 'Comprehensive Medical & Medication Safety Report')}
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            {isAr
              ? 'جاهز للطباعة المباشرة أو الإرسال عبر واتساب ليُقدم للطبيب في العيادة أو الطوارئ أو السفر'
              : 'Ready for direct printing, PDF export, or WhatsApp sharing for clinic visits and travel'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 900,
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '0.92rem',
            }}
          >
            🖨️ {isAr ? 'طباعة أو تنزيل PDF' : 'Print / Save PDF'}
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="btn"
            style={{
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: 900,
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '0.9rem',
            }}
          >
            📲 {isAr ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
          </button>
          <Link
            to="/patient-dashboard"
            className="btn"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: '12px',
              textDecoration: 'none',
              padding: '10px 16px',
            }}
          >
            📊 {isAr ? 'لوحة المريض' : 'Patient Hub'}
          </Link>
        </div>
      </section>

      {/* Official Printable Medical Document Container */}
      <article
        className="card"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '20px',
          border: '2px solid #0D1F38',
          padding: '32px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          fontFamily: 'inherit',
        }}
      >
        {/* Document Official Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '2.5px solid #0D1F38', paddingBottom: '18px', marginBottom: '22px' }}>
          <div>
            <DawayaLogo />
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px', fontWeight: 800 }}>
              {isAr
                ? 'منصة الرعاية الصحية والأمان الدوائي الرقمية في مصر • DAWAYA Health'
                : 'DAWAYA Digital Healthcare & Medication Safety Platform'}
            </div>
          </div>

          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <span style={{ display: 'inline-block', background: '#0D1F38', color: '#CFD29D', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 900 }}>
              MEDICAL HEALTH SUMMARY
            </span>
            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px', fontWeight: 700 }}>
              {isAr ? 'تاريخ استخراج التقرير:' : 'Report Date:'} <b>{currentDateFormatted}</b>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
              {isAr ? 'معرف السجل:' : 'Record ID:'} {user?.uid ? user.uid.slice(0, 12).toUpperCase() : 'DAWAYA-PATIENT-FILE'}
            </div>
          </div>
        </div>

        {/* Section 1: Patient Primary Demographics */}
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', color: '#0D1F38', fontSize: '1.05rem', fontWeight: 900 }}>
            👤 {isAr ? 'البيانات الأساسية للمريض (Patient Demographics):' : 'Patient Demographics:'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>{isAr ? 'الاسم الكامل:' : 'Full Name:'}</span>
              <strong style={{ color: '#0D1F38', fontSize: '1rem' }}>{patientFullName}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>{isAr ? 'العمر:' : 'Age:'}</span>
              <strong style={{ color: '#0D1F38', fontSize: '1rem' }}>
                {profile.age ? `${profile.age}` : profile.ageYears ? `${profile.ageYears} ${isAr ? 'سنة' : 'yrs'}` : isAr ? 'غير مسجل' : 'Not set'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>{isAr ? 'فصيلة الدم (Blood Group):' : 'Blood Group:'}</span>
              <strong style={{ color: '#dc2626', fontSize: '1.1rem' }}>{profile.bloodType || (isAr ? 'غير محددة' : 'Unspecified')}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>{isAr ? 'الوزن بالكيلوجرام:' : 'Weight:'}</span>
              <strong style={{ color: '#0D1F38', fontSize: '1rem' }}>{profile.weightKg ? `${profile.weightKg} ${isAr ? 'كجم' : 'kg'}` : isAr ? 'غير مسجل' : 'Not set'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>{isAr ? 'هاتف طوارئ الأسرة:' : 'Emergency Contact:'}</span>
              <strong style={{ color: '#0f766e', fontSize: '0.95rem' }}>{profile.emergencyContact || (isAr ? 'لم يتم التسجيل' : 'Not set')}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Documented Drug Allergies (CRITICAL HIGHLIGHT) */}
        <div
          style={{
            borderRadius: '16px',
            border: (profile.allergies || []).length > 0 ? '2px solid #dc2626' : '1.5px solid #86efac',
            background: (profile.allergies || []).length > 0 ? '#fef2f2' : '#f0fdf4',
            padding: '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, color: (profile.allergies || []).length > 0 ? '#991b1b' : '#166534', fontSize: '1.05rem', fontWeight: 900 }}>
              🛡️ {isAr ? 'الحساسية الدوائية المسجلة (Documented Allergies):' : 'Documented Drug Allergies:'}
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: (profile.allergies || []).length > 0 ? '#dc2626' : '#16a34a' }}>
              {(profile.allergies || []).length > 0
                ? isAr
                  ? '⚠️ تحذير طبي مشدد للطبيب والصيدلي'
                  : '⚠️ Strict Clinical Allergy Alert'
                : isAr
                  ? '🟢 لا توجد حساسية دوائية مسجلة'
                  : '🟢 No Documented Allergies'}
            </span>
          </div>

          {(profile.allergies || []).length > 0 ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {profile.allergies.map((al, idx) => {
                const cat = ALLERGEN_CATEGORIES.find((c) => c.id === al.allergenKey);
                const familyLabel = cat ? pick(cat.name, lang) : al.allergenKey || (isAr ? 'حساسية دوائية' : 'Drug Allergy');
                const sevLabel =
                  al.severity === 'life_threatening'
                    ? isAr
                      ? 'مهددة للحياة (صدمة تحسسية)'
                      : 'Life-Threatening'
                    : al.severity === 'severe'
                      ? isAr
                        ? 'شديدة'
                        : 'Severe'
                      : al.severity === 'moderate'
                        ? isAr
                          ? 'متوسطة'
                          : 'Moderate'
                        : isAr
                          ? 'خفيفة'
                          : 'Mild';
                return (
                  <div key={al.id || idx} style={{ background: '#ffffff', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '10px' }}>
                    <strong style={{ color: '#991b1b', fontSize: '0.95rem' }}>
                      ⛔ {al.drugName || familyLabel} ({familyLabel})
                    </strong>
                    <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '2px' }}>
                      {isAr ? 'الأعراض المسجلة:' : 'Symptoms:'}{' '}
                      <b>{al.reportedSymptoms || al.notes || (isAr ? 'تفاعل تحسسي سابق' : 'Prior allergic reaction')}</b> —{' '}
                      {isAr ? 'درجة الخطورة:' : 'Severity:'} <b style={{ color: '#dc2626' }}>{sevLabel}</b>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 700 }}>
              {isAr ? 'لم يتم تسجيل أي حساسية دوائية في ملف المريض حتى الآن.' : 'No drug allergies recorded in patient file.'}
            </div>
          )}
        </div>

        {/* Section 3: Chronic Medical Conditions */}
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', color: '#0D1F38', fontSize: '1.05rem', fontWeight: 900 }}>
            🫀 {isAr ? 'الأمراض المزمنة والحالات السريرية (Chronic Conditions):' : 'Chronic Medical Conditions:'}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {chronicList.length > 0 ? (
              chronicList.map((condName, i) => (
                <span
                  key={i}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    border: '1px solid #bae6fd',
                  }}
                >
                  🏥 {condName}
                </span>
              ))
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {isAr ? 'لا توجد أمراض مزمنة مسجلة في الملف.' : 'No chronic conditions recorded.'}
              </span>
            )}
          </div>
          {cleanNotesText && (
            <div style={{ marginTop: '10px', fontSize: '0.86rem', color: '#334155', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <b>{isAr ? 'ملاحظات إضافية:' : 'Additional Notes:'}</b> {cleanNotesText}
            </div>
          )}
        </div>

        {/* Section 4: Current Medications & Dosages List */}
        <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '18px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#0D1F38', fontSize: '1.05rem', fontWeight: 900 }}>
              💊 {isAr ? 'الأدوية الحالية ومواعيد الجرعات (Active Medications & Doses):' : 'Active Medications & Doses:'}
            </h3>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f766e' }}>
              {isAr ? `إجمالي: ${unifiedMedications.length} مستحضرات` : `Total: ${unifiedMedications.length} medications`}
            </span>
          </div>

          <div className="tablewrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', color: '#0D1F38' }}>{isAr ? 'اسم الدواء' : 'Medication'}</th>
                  <th style={{ padding: '8px 10px', color: '#0D1F38' }}>{isAr ? 'الجرعة والتركيز' : 'Dose & Strength'}</th>
                  <th style={{ padding: '8px 10px', color: '#0D1F38' }}>{isAr ? 'التكرار ومواعيد الساعات' : 'Schedule & Times'}</th>
                  <th style={{ padding: '8px 10px', color: '#0D1F38' }}>{isAr ? 'ملاحظات الاستخدام' : 'Instructions'}</th>
                </tr>
              </thead>
              <tbody>
                {unifiedMedications.map((med, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0D1F38' }}>
                      💊 {med.name}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#0f766e', fontWeight: 700 }}>
                      {med.dose}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#1e293b', fontWeight: 700 }}>
                      {med.scheduleText}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#334155' }}>
                      {med.instructions}
                    </td>
                  </tr>
                ))}

                {unifiedMedications.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '14px', textAlign: 'center', color: '#64748b' }}>
                      {isAr ? 'لا توجد أدوية مسجلة حالياً في السجل.' : 'No active medications recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Clinical Safety Audit Sign-Off */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ color: '#0D1F38', fontSize: '0.88rem', display: 'block' }}>
              🛡️ {isAr ? 'فحص الأمان الدوائي التلقائي (DAWAYA Safety Engine):' : 'Automated Medication Safety Screening:'}
            </strong>
            <span style={{ fontSize: '0.82rem', color: safetyReport.findings.length > 0 ? '#b91c1c' : '#166534', fontWeight: 700 }}>
              {safetyReport.findings.length > 0
                ? isAr
                  ? `⚠️ تم رصد ${safetyReport.findings.length} تنبيهات تداخل أو تكرار؛ يرجى مراجعة الطبيب أو الصيدلي`
                  : `⚠️ ${safetyReport.findings.length} interaction/safety alerts detected; please review with your pharmacist`
                : isAr
                  ? '🟢 تم التحقق: لا توجد تداخلات دوائية خطيرة مسجلة بين هذه الأدوية'
                  : '🟢 Verified: No major drug-drug interactions detected among listed medications'}
            </span>
          </div>

          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {isAr ? 'تقرير مستخرج عبر:' : 'Generated via:'} <b>DAWAYA Health Platform</b>
            </span>
          </div>
        </div>
      </article>

      <div style={{ marginTop: '20px' }}>
        <Disclaimer />
      </div>
    </main>
  );
}
