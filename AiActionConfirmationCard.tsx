import { lastAiVisionDiagnostic } from './geminiApi';
import { SmartNativeSelect } from './SmartChoiceSelect';
import SmartDoseTimeCalibrator from './SmartDoseTimeCalibrator';
import { calculateAutoDoseTimes, formatTime12Hour } from './trackerData';
import { getSmartClinicalRegimenForMedicine } from './dawayaDrugDatabaseService';
/**
 * AiActionConfirmationCard.tsx
 *
 * Interactive Patient Action Confirmation Card for `ChatWidget.tsx` and `Assistant.tsx`.
 * Crafted with warm, natural Egyptian Colloquial Arabic (مصري عامي) when lang === 'ar'.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lang } from './types';
import { PendingAiActionProposal } from './aiActionExecutor';

interface Props {
  proposal: PendingAiActionProposal;
  lang: Lang;
  onConfirm: (proposalId: string, editedFields?: Record<string, string>) => Promise<void>;
  onCancel: (proposalId: string) => void;
  onCloseWidget?: () => void;
}

export default function AiActionConfirmationCard({
  proposal,
  lang,
  onConfirm,
  onCancel,
  onCloseWidget,
}: Props) {
  const isAr = lang === 'ar';
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of proposal.fields) {
      init[f.key] = f.value;
    }
    const medName = init.medicineName || init.drugName || '';
    if (medName && (proposal.actionType === 'save_medical_document' || proposal.actionType === 'add_prescription' || proposal.actionType === 'add_medication')) {
      const smartReg = getSmartClinicalRegimenForMedicine(medName);
      if (!init.frequency) {
        init.frequency = smartReg.frequencyKey;
      }
      if (!init.prescribedDose) {
        init.prescribedDose = isAr ? smartReg.defaultDoseTextAr : smartReg.defaultDoseTextEn;
      }
      if (!init.durationDays && proposal.actionType !== 'add_medication') {
        init.durationDays = String(smartReg.defaultDurationDays);
      }
      if (!init.route) {
        init.route = smartReg.route;
      }
      if (!init.doseTimes) {
        init.doseTimes = calculateAutoDoseTimes(
          init.frequency === 'thrice_daily' || init.frequency === 'four_times_daily' ? '06:00' : smartReg.firstDoseTime,
          init.frequency
        ).join(', ');
      }
    }
    return init;
  });

  const hasDoseScheduleCalibration =
    proposal.fields.some((f) => f.key === 'frequency' || f.key === 'doseTimes' || f.key === 'newDoseTimes') ||
    ((proposal.actionType === 'save_medical_document' || proposal.actionType === 'add_prescription' || proposal.actionType === 'add_medication') &&
      Boolean(fieldValues.medicineName || fieldValues.drugName));

  const parsedDoseTimes = (fieldValues.doseTimes || fieldValues.newDoseTimes || '')
    .split(/[,\u060C]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{2}:\d{2}$/.test(s));

  const safety = proposal.safetyPreview;
  const safetyColors: Record<
    typeof safety.status,
    { bg: string; border: string; text: string }
  > = {
    safe: { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46' },
    caution: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
    warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
    urgent: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  };
  const sc = safetyColors[safety.status] || safetyColors.caution;

  const handleConfirmClick = async () => {
    if (saving || proposal.status !== 'pending_confirmation') return;
    setSaving(true);
    try {
      await onConfirm(proposal.id, fieldValues);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const destinationLink = (() => {
    switch (proposal.actionType) {
      case 'add_prescription':
      case 'update_prescription_status':
      case 'save_medical_document':
        return {
          to: '/patient-dashboard',
          labelAr: '⏰ افتح لوحة المريض وجدول الجرعات',
          labelEn: '⏰ Open Patient Dashboard & Schedule',
        };
      case 'create_reminder':
      case 'update_reminder':
      case 'stop_reminder':
        return {
          to: '/tracker',
          labelAr: '⏰ افتح متابع الجرعات والمنبهات',
          labelEn: '⏰ Open Dose Tracker',
        };
      default:
        return {
          to: '/health-profile',
          labelAr: '👤 افتح ملفي الصحي',
          labelEn: '👤 Open My Health Profile',
        };
    }
  })();

  return (
    <div
      className="ai-action-confirmation-card"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderTop: '4px solid #138866',
        borderRadius: '14px',
        padding: '12px 14px',
        marginTop: '8px',
        boxShadow: '0 6px 18px rgba(13, 31, 56, 0.08)',
        color: '#0f172a',
        fontSize: '0.88rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>{proposal.icon}</span>
          <div>
            <strong style={{ color: '#0D1F38', fontSize: '0.93rem', display: 'block' }}>
              {isAr ? proposal.titleAr : proposal.titleEn}
            </strong>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {isAr ? proposal.sourceLabelAr : proposal.sourceLabelEn}
            </span>
          </div>
        </div>

        <span
          style={{
            background:
              proposal.status === 'confirmed_saved'
                ? '#dcfce7'
                : proposal.status === 'cancelled'
                  ? '#f1f5f9'
                  : proposal.status === 'failed'
                    ? '#fee2e2'
                    : '#fef3c7',
            color:
              proposal.status === 'confirmed_saved'
                ? '#166534'
                : proposal.status === 'cancelled'
                  ? '#475569'
                  : proposal.status === 'failed'
                    ? '#991b1b'
                    : '#92400e',
            padding: '3px 9px',
            borderRadius: '999px',
            fontSize: '0.73rem',
            fontWeight: 700,
          }}
        >
          {proposal.status === 'confirmed_saved'
            ? isAr
              ? '✅ اتحفظ في حسابك خلاص'
              : '✅ Saved to Account'
            : proposal.status === 'cancelled'
              ? isAr
                ? '✕ اتلغى'
                : '✕ Cancelled'
              : proposal.status === 'failed'
                ? isAr
                  ? '⚠️ متحفظش'
                  : '⚠️ Save Failed'
                : isAr
                  ? '⏳ مستني تأكيدك'
                  : '⏳ Awaiting Confirmation'}
        </span>
      </div>

      {/* Image Preview if Document/Prescription Uploaded */}
      {proposal.previewImageUrl && (
        <div
          style={{
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <img
            src={proposal.previewImageUrl}
            alt="Uploaded medical document preview"
            style={{
              width: '64px',
              height: '64px',
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: '0.78rem', color: '#334155' }}>
            <div style={{ fontWeight: 700 }}>
              📎 {isAr ? 'معاينة الصورة المرفوعة' : 'Medical Attachment Preview'}
            </div>
            <div>
              {isAr
                ? 'بص على البيانات ومواعيد الجرعات تحت، وتقدر تغير عدد المرات والساعات بضغطة واحدة قبل ما تحفظ.'
                : 'Review extracted details and calibrate your daily dose times below before saving.'}
            </div>
          </div>
        </div>
      )}

      {/* Live Medication Safety Engine Banner */}
      <div
        style={{
          background: sc.bg,
          border: `1px solid ${sc.border}`,
          color: sc.text,
          borderRadius: '8px',
          padding: '8px 10px',
          marginBottom: '10px',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ fontWeight: 700 }}>
          {isAr ? safety.headlineAr : safety.headlineEn}
        </div>
        {safety.duplicateDetected && (
          <div style={{ marginTop: '4px', fontWeight: 600 }}>
            {isAr ? safety.duplicateMessageAr : safety.duplicateMessageEn}
          </div>
        )}
        {(isAr ? safety.detailsAr : safety.detailsEn).slice(0, 3).map((line, idx) => (
          <div key={idx} style={{ marginTop: '4px', lineHeight: 1.5 }}>
            • {line}
          </div>
        ))}
        {lastAiVisionDiagnostic && !lastAiVisionDiagnostic.startsWith('OK:') && (
          <div style={{ marginTop: '6px', fontSize: '0.72rem', opacity: 0.9, direction: 'ltr', textAlign: 'left' }}>
            Diagnostic: {lastAiVisionDiagnostic}
          </div>
        )}
      </div>

      {/* Structured Preview / Editable Fields */}
      <div
        className="action-fields-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
          gap: '6px',
          marginBottom: '8px',
        }}
      >
        {proposal.fields.map((field) => {
          const currentVal =
            fieldValues[field.key] !== undefined ? fieldValues[field.key] : field.value;
          const isUncertain = field.uncertainOrMissing && !currentVal.trim();
          const isFullWidth =
            field.key === 'title' ||
            field.key === 'notes' ||
            field.key === 'cultureSensitiveS' ||
            field.key === 'cultureResistantR' ||
            field.key === 'reportedSymptoms' ||
            field.key === 'emergencyContact';

          return (
            <div
              key={field.key}
              style={{
                gridColumn: isFullWidth ? '1 / -1' : undefined,
                background: isUncertain ? '#fffbeb' : '#f8fafc',
                border: isUncertain ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.76rem',
                  color: isUncertain ? '#b45309' : '#475569',
                  fontWeight: 700,
                  marginBottom: editing ? '4px' : '2px',
                }}
              >
                <span>{isAr ? field.labelAr : field.labelEn}:</span>
                {isUncertain && (
                  <span style={{ color: '#d97706', fontSize: '0.72rem' }}>
                    ⚠️ {isAr ? 'خانة ناقصة / مش واضحة' : 'Unclear / Required'}
                  </span>
                )}
              </div>

              {editing && field.editable && proposal.status === 'pending_confirmation' ? (
                field.inputType === 'select' && field.options ? (
                  <SmartNativeSelect
                    value={currentVal}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setFieldValues((prev) => {
                        const updated = { ...prev, [field.key]: nextVal };
                        if (field.key === 'frequency' && nextVal) {
                          const startH = nextVal === 'thrice_daily' || nextVal === 'four_times_daily' ? '06:00' : '08:00';
                          updated.doseTimes = calculateAutoDoseTimes(startH, nextVal).join(', ');
                        }
                        return updated;
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #94a3b8',
                      fontSize: '0.84rem',
                      background: '#fff',
                    }}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isAr ? opt.labelAr : opt.labelEn}
                      </option>
                    ))}
                  </SmartNativeSelect>
                ) : (
                  <input
                    type={field.inputType === 'number' ? 'number' : 'text'}
                    value={currentVal}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={
                      isAr ? 'اكتب القيمة الصح هنا...' : 'Enter verified value...'
                    }
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #94a3b8',
                      fontSize: '0.84rem',
                      background: '#fff',
                    }}
                  />
                )
              ) : (
                <div style={{ fontWeight: 600, color: currentVal ? '#0f172a' : '#b45309' }}>
                  {field.options
                    ? (() => {
                        const matchedOpt = field.options.find((o) => o.value === currentVal);
                        return matchedOpt
                          ? isAr
                            ? matchedOpt.labelAr
                            : matchedOpt.labelEn
                          : currentVal || (isAr ? 'مش متحدد (دوس تعديل عشان تكتبه)' : 'Unspecified (Click Edit)');
                      })()
                    : currentVal || (isAr ? 'مش متحدد (دوس تعديل عشان تكتبه)' : 'Unspecified (Click Edit)')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Smart Dose Count & Clock Schedule Calibrator */}
      {hasDoseScheduleCalibration && proposal.status === 'pending_confirmation' && (
        <SmartDoseTimeCalibrator
          medicineName={fieldValues.medicineName || fieldValues.drugName || ''}
          frequency={fieldValues.frequency || 'twice_daily'}
          doseTimes={parsedDoseTimes}
          isAr={isAr}
          compact
          onChange={(nextFreq, nextTimes, suggestedDose, suggestedDur) => {
            setFieldValues((prev) => ({
              ...prev,
              frequency: nextFreq,
              doseTimes: nextTimes.join(', '),
              newDoseTimes: nextTimes.join(', '),
              ...(!prev.prescribedDose && suggestedDose ? { prescribedDose: suggestedDose } : {}),
              ...(!prev.durationDays && suggestedDur ? { durationDays: String(suggestedDur) } : {}),
            }));
          }}
        />
      )}

      {/* Display Confirmed Dose Times Badge Summary after Save */}
      {hasDoseScheduleCalibration && proposal.status === 'confirmed_saved' && parsedDoseTimes.length > 0 && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '10px',
            padding: '8px 10px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          <strong style={{ fontSize: '0.78rem', color: '#166534' }}>
            ⏰ {isAr ? 'مواعيد الجرعات اليومية المتسجلة:' : 'Scheduled Daily Dose Times:'}
          </strong>
          {parsedDoseTimes.map((t, i) => (
            <span
              key={i}
              style={{
                background: '#0D1F38',
                color: '#CFD29D',
                padding: '2px 9px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              {isAr ? `الجرعة ${i + 1}: ` : `Dose ${i + 1}: `}
              {formatTime12Hour(t, isAr)}
            </span>
          ))}
        </div>
      )}

      {/* Source & Evidence Status Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
          fontSize: '0.74rem',
          color: '#64748b',
          padding: '2px 4px',
          marginBottom: '8px',
        }}
      >
        <span>
          📌 <b>{isAr ? 'الحالة:' : 'Verification:'}</b>{' '}
          {isAr ? proposal.verificationBadgeAr : proposal.verificationBadgeEn}
        </span>
      </div>

      {/* Full Prescription WhatsApp Order Button (No Prices, Clean Medication + Form/Dose List) */}
      {(() => {
        const rxList = Array.isArray((proposal.rawArgs as any)?.extractedPrescriptions)
          ? ((proposal.rawArgs as any).extractedPrescriptions as Array<{ medicineName?: string; prescribedDose?: string; route?: string }>).filter((x) => x.medicineName)
          : [];
        const singleMed = fieldValues.medicineName || '';
        if (rxList.length === 0 && !singleMed) return null;
        const itemsText =
          rxList.length > 0
            ? rxList
                .map((x, idx) => `${idx + 1}. ${x.medicineName}${x.prescribedDose ? ` (${x.prescribedDose})` : ''}${x.route ? ` — ${x.route}` : ''}`)
                .join('\n')
            : `1. ${singleMed}${fieldValues.prescribedDose ? ` (${fieldValues.prescribedDose})` : ''}${fieldValues.route ? ` — ${fieldValues.route}` : ''}`;
        let area = '';
        if (typeof window !== 'undefined') {
          try {
            const loc = JSON.parse(localStorage.getItem('dawaya_user_location_v1') || 'null');
            if (loc) area = [loc.districtVillage, loc.cityCenter].filter((x) => x && x !== 'all').join(' - ');
          } catch {}
        }
        const waMsg = isAr
          ? `السلام عليكم، أستفسر عن توفر أدوية هذه الروشتة كاملة عبر منصة دوايا:\n${itemsText}${area ? `\n📍 المنطقة / القرية: ${area}` : ''}\nبرجاء تأكيد توفر الأصناف، شكراً لحضرتك.`
          : `Hello, inquiring via DAWAYA about availability of this prescription:\n${itemsText}${area ? `\n📍 Area: ${area}` : ''}`;
        return (
          <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn small"
              style={{ background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', fontWeight: 900, textDecoration: 'none' }}
            >
              💬 {isAr ? 'اطلب أدوية الروشتة كاملة عبر واتساب (بدون أسعار)' : 'Order Full Rx via WhatsApp'}
            </a>
            <Link to="/partners?tab=nearby" className="btn small ghost" style={{ fontWeight: 800, textDecoration: 'none' }}>
              🛵 {isAr ? 'أقرب صيدلية في منطقتك' : 'Nearest Pharmacy'}
            </Link>
          </div>
        );
      })()}

      {/* Action Buttons or Post-Execution Result */}
      {proposal.status === 'pending_confirmation' ? (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            disabled={saving}
            onClick={handleConfirmClick}
            style={{
              background: safety.status === 'urgent' ? '#dc2626' : 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
              color: '#fff',
              fontWeight: 800,
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving
              ? isAr
                ? '⏳ بحفظهولك...'
                : '⏳ Saving...'
              : isAr
                ? '✅ أيوه، أكد واحفظ بالمواعيد دي'
                : '✅ Confirm and Save Schedule'}
          </button>

          <button
            type="button"
            className="btn ghost"
            disabled={saving}
            onClick={() => setEditing((v) => !v)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              border: '1px solid #94a3b8',
            }}
          >
            {editing
              ? isAr
                ? '✔️ خلصت تعديل'
                : '✔️ Done Editing'
              : isAr
                ? '✏️ تعديل النص'
                : '✏️ Edit Text'}
          </button>

          <button
            type="button"
            className="btn ghost"
            disabled={saving}
            onClick={() => onCancel(proposal.id)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: '#dc2626',
              borderColor: '#fca5a5',
            }}
          >
            {isAr ? '✕ لا، الغي' : '✕ Cancel'}
          </button>
        </div>
      ) : (
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color:
                proposal.status === 'confirmed_saved'
                  ? '#166534'
                  : proposal.status === 'failed'
                    ? '#991b1b'
                    : '#475569',
            }}
          >
            {isAr ? proposal.resultMessageAr : proposal.resultMessageEn}
          </span>

          {proposal.status === 'confirmed_saved' && (
            <Link
              to={destinationLink.to}
              onClick={onCloseWidget}
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0284c7',
                textDecoration: 'none',
              }}
            >
              {isAr ? destinationLink.labelAr : destinationLink.labelEn} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
