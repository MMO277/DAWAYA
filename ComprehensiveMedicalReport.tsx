import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr, pick } from './types';
import { useAuth } from './authContext';
import { useSyncedHealthProfile } from './allergyData';
import { useSyncedSchedules } from './trackerData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import { useDawayaDrugDatabase } from './dawayaDrugDatabaseService';
import DawayaLogo from './DawayaLogo';
import Disclaimer from './Disclaimer';

export default function ComprehensiveMedicalReport() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile } = useSyncedHealthProfile();
  const { schedules, prescriptions } = useSyncedSchedules();
  const { indexItems } = useDawayaDrugDatabase();

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

  // Safety evaluation of current medications
  const safetyReport = useMemo(() => {
    const rawMeds = (profile.medications || []).map((m) => ({
      id: m.drugId,
      rawName: m.drugName,
    }));
    return evaluateMedicationSafety(rawMeds, profile);
  }, [profile]);

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
            جاهز للطباعة المباشرة أو التنزيل كـ PDF ليقدم للطبيب في العيادة أو الطوارئ أو السفر
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
              fontSize: '0.95rem',
            }}
          >
            🖨️ طباعة أو تنزيل PDF فوراً
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
            📊 العودة للوحة المريض
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
          padding: '36px 32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          fontFamily: 'inherit',
        }}
      >
        {/* Document Official Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #0D1F38', paddingBottom: '18px', marginBottom: '22px' }}>
          <div>
            <DawayaLogo />
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px', fontWeight: 800 }}>
              منصة الرعاية الصحية والأمان الدوائي الرقمية في مصر • DAWAYA Health
            </div>
          </div>

          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <span style={{ display: 'inline-block', background: '#0D1F38', color: '#CFD29D', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 900 }}>
              MEDICAL HEALTH SUMMARY
            </span>
            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px', fontWeight: 700 }}>
              تاريخ استخراج التقرير: <b>{currentDateFormatted}</b>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
              معرف السجل: {user?.uid ? user.uid.slice(0, 12).toUpperCase() : 'GUEST-PATIENT-FILE'}
            </div>
          </div>
        </div>

        {/* Section 1: Patient Primary Demographics */}
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', color: '#0D1F38', fontSize: '1.05rem', fontWeight: 900 }}>
            👤 البيانات الأساسية للمريض (Patient Demographics):
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>الاسم الكامل:</span>
              <strong style={{ color: '#0D1F38', fontSize: '1rem' }}>{profile.name || 'مريض منصة دوايا'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>السن / تاريخ الميلاد:</span>
              <strong style={{ color: '#0D1F38', fontSize: '1rem' }}>
                {profile.birthDate ? `${profile.birthDate}` : profile.age ? `${profile.age} سنة` : 'غير مسجل'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>فصيلة الدم (Blood Group):</span>
              <strong style={{ color: '#dc2626', fontSize: '1.1rem' }}>{profile.bloodType || 'غير محددة'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>الوزن بالكيلوجرام:</span>
              <strong style={{ color: '#0D1F38', fontSize: '1rem' }}>{profile.weightKg ? `${profile.weightKg} كجم` : 'غير مسجل'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>جهة / رقم طوارئ الأسرة:</span>
              <strong style={{ color: '#0f766e', fontSize: '0.95rem' }}>{profile.emergencyContact || 'لم يتم التسجيل'}</strong>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, color: (profile.allergies || []).length > 0 ? '#991b1b' : '#166534', fontSize: '1.05rem', fontWeight: 900 }}>
              🛡️ الحساسية الدوائية والغذائية المسجلة (Documented Allergies):
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: (profile.allergies || []).length > 0 ? '#dc2626' : '#16a34a' }}>
              {(profile.allergies || []).length > 0 ? '⚠️ تحذير طبي مشدد للطبيب والصيدلي' : '🟢 لا توجد حساسية دوائية مسجلة'}
            </span>
          </div>

          {(profile.allergies || []).length > 0 ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {profile.allergies.map((al, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '10px' }}>
                  <strong style={{ color: '#991b1b', fontSize: '0.95rem' }}>
                    ⛔ {al.drugName || al.allergen} ({al.category})
                  </strong>
                  <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '2px' }}>
                    رد الفعل التحسسي: <b>{al.reaction || 'حساسية مفرطة'}</b> — درجة الخطورة: <b style={{ color: '#dc2626' }}>{al.severity}</b>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 700 }}>
              لم يتم تسجيل أي حساسية دوائية في ملف المريض حتى الآن.
            </div>
          )}
        </div>

        {/* Section 3: Chronic Medical Conditions */}
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', color: '#0D1F38', fontSize: '1.05rem', fontWeight: 900 }}>
            🫀 الأمراض المزمنة والحالات السريرية (Chronic Conditions):
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(profile.chronicConditions || []).length > 0 ? (
              profile.chronicConditions.map((cond, i) => (
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
                  🏥 {cond}
                </span>
              ))
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                لا توجد أمراض مزمنة مسجلة في الملف.
              </span>
            )}
          </div>
          {profile.notes && (
            <div style={{ marginTop: '10px', fontSize: '0.86rem', color: '#334155', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <b>ملاحظات إضافية:</b> {profile.notes}
            </div>
          )}
        </div>

        {/* Section 4: Current Medications & Dosages List */}
        <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '18px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#0D1F38', fontSize: '1.05rem', fontWeight: 900 }}>
              💊 الأدوية الحالية ومواعيد الجرعات (Active Medications & Doses):
            </h3>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f766e' }}>
              إجمالي: {(profile.medications || []).length + (schedules || []).length} مستحضرات
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 10px', color: '#0D1F38' }}>اسم الدواء</th>
                <th style={{ padding: '8px 10px', color: '#0D1F38' }}>الجرعة المحددة</th>
                <th style={{ padding: '8px 10px', color: '#0D1F38' }}>ميعاد الجرعة</th>
                <th style={{ padding: '8px 10px', color: '#0D1F38' }}>تعليمات الأمان</th>
              </tr>
            </thead>
            <tbody>
              {(schedules || []).map((sch, i) => (
                <tr key={'sch-' + i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0D1F38' }}>
                    {sch.medicineName}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#0f766e', fontWeight: 700 }}>
                    {sch.prescribedDose}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#475569' }}>
                    {sch.frequency} (اليوم {sch.durationDays ? `من أصل ${sch.durationDays}` : ''})
                  </td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>
                    {sch.notes || 'الالتزام بالميعاد المحدد'}
                  </td>
                </tr>
              ))}

              {(profile.medications || []).map((pm, i) => (
                <tr key={'pm-' + i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0D1F38' }}>
                    {pm.drugName}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#0f766e', fontWeight: 700 }}>
                    {pm.dose || 'جرعة يومية'}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#475569' }}>
                    {pm.frequency || 'بانتظام'}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>
                    {pm.purpose || 'علاج مستمر'}
                  </td>
                </tr>
              ))}

              {(schedules || []).length === 0 && (profile.medications || []).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '14px', textAlign: 'center', color: '#64748b' }}>
                    لا توجد أدوية مسجلة حالياً في السجل.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 5: Clinical Safety Audit Sign-Off */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ color: '#0D1F38', fontSize: '0.88rem', display: 'block' }}>
              🛡️ فحص الأمان الدوائي التلقائي (DAWAYA Safety Engine):
            </strong>
            <span style={{ fontSize: '0.82rem', color: safetyReport.hasIssues ? '#b91c1c' : '#166534', fontWeight: 700 }}>
              {safetyReport.hasIssues
                ? `⚠️ تم رصد ${safetyReport.issues.length} تنبيهات تداخل أو تكرار؛ يرجى مراجعة الصيدلي`
                : '🟢 تم التحقق: لا توجد تداخلات دوائية خطيرة مسجلة بين هذه الأدوية'}
            </span>
          </div>

          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              معتمد إلكترونياً عبر: <b>DAWAYA Healthcare Platform</b>
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
