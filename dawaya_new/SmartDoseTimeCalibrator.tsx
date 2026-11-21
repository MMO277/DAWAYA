import React, { useEffect } from 'react';
import { getSmartClinicalRegimenForMedicine } from './dawayaDrugDatabaseService';
import { calculateAutoDoseTimes, formatTime12Hour } from './trackerData';

export interface SmartDoseTimeCalibratorProps {
  medicineName?: string;
  frequency: string;
  doseTimes: string[];
  isAr: boolean;
  compact?: boolean;
  onChange: (nextFrequency: string, nextDoseTimes: string[], suggestedDoseText?: string, suggestedDurationDays?: number) => void;
}

const FREQ_OPTIONS: Array<{
  key: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily';
  count: 1 | 2 | 3 | 4;
  icon: string;
  titleAr: string;
  titleEn: string;
  subAr: string;
  subEn: string;
  defaultStart: string;
}> = [
  {
    key: 'once_daily',
    count: 1,
    icon: '1️⃣',
    titleAr: 'مرة يومياً',
    titleEn: 'Once Daily',
    subAr: 'كل 24 ساعة',
    subEn: 'Every 24h',
    defaultStart: '08:00',
  },
  {
    key: 'twice_daily',
    count: 2,
    icon: '2️⃣',
    titleAr: 'مرتين يومياً',
    titleEn: 'Twice Daily',
    subAr: 'كل 12 ساعة',
    subEn: 'Every 12h',
    defaultStart: '08:00',
  },
  {
    key: 'thrice_daily',
    count: 3,
    icon: '3️⃣',
    titleAr: '3 مرات يومياً',
    titleEn: '3 Times Daily',
    subAr: 'كل 8 ساعات',
    subEn: 'Every 8h',
    defaultStart: '06:00',
  },
  {
    key: 'four_times_daily',
    count: 4,
    icon: '4️⃣',
    titleAr: '4 مرات يومياً',
    titleEn: '4 Times Daily',
    subAr: 'كل 6 ساعات',
    subEn: 'Every 6h',
    defaultStart: '06:00',
  },
];

const QUICK_TIME_PRESETS: Record<
  string,
  Array<{ labelAr: string; labelEn: string; times: string[] }>
> = {
  once_daily: [
    { labelAr: '🌅 8:00 صباحاً', labelEn: '🌅 08:00 AM', times: ['08:00'] },
    { labelAr: '☀️ 2:00 عصراً (بعد الغداء)', labelEn: '☀️ 02:00 PM', times: ['14:00'] },
    { labelAr: '🌙 9:00 مساءً', labelEn: '🌙 09:00 PM', times: ['21:00'] },
  ],
  twice_daily: [
    { labelAr: '🌅 8 ص • 8 م (كل 12 ساعة)', labelEn: '🌅 8 AM • 8 PM', times: ['08:00', '20:00'] },
    { labelAr: '☀️ 9 ص • 9 م', labelEn: '☀️ 9 AM • 9 PM', times: ['09:00', '21:00'] },
    { labelAr: '🕙 10 ص • 10 م', labelEn: '🕙 10 AM • 10 PM', times: ['10:00', '22:00'] },
  ],
  thrice_daily: [
    { labelAr: '🌅 6 ص • 2 م • 10 م (كل 8 ساعات)', labelEn: '🌅 6 AM • 2 PM • 10 PM', times: ['06:00', '14:00', '22:00'] },
    { labelAr: '☀️ 7 ص • 3 م • 11 م', labelEn: '☀️ 7 AM • 3 PM • 11 PM', times: ['07:00', '15:00', '23:00'] },
    { labelAr: '🕗 8 ص • 4 م • 12 ص', labelEn: '🕗 8 AM • 4 PM • 12 AM', times: ['08:00', '16:00', '00:00'] },
  ],
  four_times_daily: [
    { labelAr: '🌅 6 ص • 12 ظ • 6 م • 12 ص', labelEn: '🌅 6 AM • 12 PM • 6 PM • 12 AM', times: ['06:00', '12:00', '18:00', '00:00'] },
    { labelAr: '☀️ 8 ص • 2 م • 8 م • 2 ص', labelEn: '☀️ 8 AM • 2 PM • 8 PM • 2 AM', times: ['08:00', '14:00', '20:00', '02:00'] },
  ],
};

export default function SmartDoseTimeCalibrator({
  medicineName,
  frequency,
  doseTimes,
  isAr,
  compact = false,
  onChange,
}: SmartDoseTimeCalibratorProps) {
  const clinicalRegimen = medicineName ? getSmartClinicalRegimenForMedicine(medicineName) : null;

  const normalizedFreq: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily' =
    frequency === 'once_daily' || frequency === 'q24h'
      ? 'once_daily'
      : frequency === 'thrice_daily' || frequency === 'q8h'
        ? 'thrice_daily'
        : frequency === 'four_times_daily' || frequency === 'q6h'
          ? 'four_times_daily'
          : frequency === 'twice_daily' || frequency === 'q12h'
            ? 'twice_daily'
            : clinicalRegimen?.frequencyKey || 'twice_daily';

  const expectedCount =
    normalizedFreq === 'once_daily'
      ? 1
      : normalizedFreq === 'thrice_daily'
        ? 3
        : normalizedFreq === 'four_times_daily'
          ? 4
          : 2;

  const defaultStartForFreq =
    normalizedFreq === 'thrice_daily' || normalizedFreq === 'four_times_daily'
      ? '06:00'
      : clinicalRegimen?.firstDoseTime || '08:00';

  const effectiveTimes =
    Array.isArray(doseTimes) && doseTimes.length === expectedCount
      ? doseTimes
      : calculateAutoDoseTimes(
          doseTimes?.[0] && normalizedFreq !== 'thrice_daily' ? doseTimes[0] : defaultStartForFreq,
          normalizedFreq
        );

  useEffect(() => {
    if (!frequency && clinicalRegimen) {
      onChange(
        clinicalRegimen.frequencyKey,
        clinicalRegimen.defaultDoseTimes,
        isAr ? clinicalRegimen.defaultDoseTextAr : clinicalRegimen.defaultDoseTextEn,
        clinicalRegimen.defaultDurationDays
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicineName]);

  const handleSelectFrequency = (
    targetKey: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily',
    defaultStart: string
  ) => {
    const nextTimes = calculateAutoDoseTimes(defaultStart, targetKey);
    onChange(targetKey, nextTimes);
  };

  const handleSlotTimeChange = (slotIdx: number, newTimeVal: string) => {
    if (!newTimeVal) return;
    if (slotIdx === 0) {
      const autoShifted = calculateAutoDoseTimes(newTimeVal, normalizedFreq);
      onChange(normalizedFreq, autoShifted);
    } else {
      const next = [...effectiveTimes];
      next[slotIdx] = newTimeVal;
      onChange(normalizedFreq, next);
    }
  };

  const presets = QUICK_TIME_PRESETS[normalizedFreq] || [];
  const cleanReasonAr = clinicalRegimen?.aiReasonAr
    ? clinicalRegimen.aiReasonAr.replace(/🤖\s*اقتراح الذكاء الدوائي:/g, '🩺 التوصية الصيدلانية القياسية:')
    : '';
  const cleanReasonEn = clinicalRegimen?.aiReasonEn
    ? clinicalRegimen.aiReasonEn.replace(/🤖\s*AI Clinical Suggestion:/g, '🩺 Standard Clinical Regimen:')
    : '';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%)',
        border: '1.5px solid #138866',
        borderRadius: compact ? '12px' : '16px',
        padding: compact ? '10px 12px' : '14px 16px',
        marginTop: '6px',
        marginBottom: '8px',
        boxShadow: '0 4px 14px rgba(13, 31, 56, 0.05)',
      }}
    >
      {/* Header + Clinical Suggestion Pill */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1.1rem' }}>⏰</span>
          <strong style={{ color: '#0D1F38', fontSize: compact ? '0.84rem' : '0.92rem' }}>
            {isAr
              ? 'معايرة عدد الجرعات ومواعيد الساعات اليومية:'
              : 'Calibrate Daily Doses & Clock Schedule:'}
          </strong>
        </div>

        {clinicalRegimen && (
          <button
            type="button"
            onClick={() =>
              onChange(
                clinicalRegimen.frequencyKey,
                clinicalRegimen.defaultDoseTimes,
                isAr ? clinicalRegimen.defaultDoseTextAr : clinicalRegimen.defaultDoseTextEn,
                clinicalRegimen.defaultDurationDays
              )
            }
            style={{
              background:
                normalizedFreq === clinicalRegimen.frequencyKey ? '#dcfce7' : 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
              color: normalizedFreq === clinicalRegimen.frequencyKey ? '#166534' : '#ffffff',
              border: '1px solid #138866',
              borderRadius: '999px',
              padding: '3px 10px',
              fontSize: '0.73rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {isAr ? cleanReasonAr : cleanReasonEn}
          </button>
        )}
      </div>

      {/* 4 Interactive Frequency Selector Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
          gap: '6px',
          marginBottom: '10px',
        }}
      >
        {FREQ_OPTIONS.map((opt) => {
          const isSelected = normalizedFreq === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSelectFrequency(opt.key, opt.defaultStart)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: compact ? '7px 6px' : '9px 8px',
                borderRadius: '11px',
                border: isSelected ? '2px solid #0D1F38' : '1.5px solid #cbd5e1',
                background: isSelected
                  ? 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)'
                  : '#ffffff',
                color: isSelected ? '#ffffff' : '#0D1F38',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(19, 136, 102, 0.28)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.95rem' }}>{opt.icon}</span>
              <span style={{ fontWeight: 900, fontSize: compact ? '0.78rem' : '0.83rem' }}>
                {isAr ? opt.titleAr : opt.titleEn}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: isSelected ? '#CFD29D' : '#64748b',
                }}
              >
                {isAr ? opt.subAr : opt.subEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick 1-Tap Time Shift Presets */}
      {presets.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '10px',
          }}
        >
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569' }}>
            {isAr ? '⚡ مواعيد قياسية جاهزة:' : '⚡ Standard Times:'}
          </span>
          {presets.map((pr, idx) => {
            const isActivePreset = JSON.stringify(effectiveTimes) === JSON.stringify(pr.times);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(normalizedFreq, pr.times)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: isActivePreset ? '1.5px solid #138866' : '1px solid #cbd5e1',
                  background: isActivePreset ? '#138866' : '#ffffff',
                  color: isActivePreset ? '#ffffff' : '#0D1F38',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isAr ? pr.labelAr : pr.labelEn}
              </button>
            );
          })}
        </div>
      )}

      {/* Individual Clock Time Slots Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
        }}
      >
        {effectiveTimes.map((tVal, idx) => (
          <div
            key={idx}
            style={{
              background: '#ffffff',
              border: idx === 0 ? '1.5px solid #0284c7' : '1.5px solid #cbd5e1',
              borderRadius: '10px',
              padding: '7px 9px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '0.73rem',
                  fontWeight: 900,
                  color: idx === 0 ? '#0369a1' : '#0D1F38',
                }}
              >
                {isAr ? `الجرعة ${idx + 1}` : `Dose ${idx + 1}`}
              </span>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  borderRadius: '999px',
                  padding: '1px 7px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                {formatTime12Hour(tVal, isAr)}
              </span>
            </div>
            <input
              type="time"
              value={tVal}
              onChange={(e) => handleSlotTimeChange(idx, e.target.value)}
              style={{
                width: '100%',
                padding: '5px 7px',
                borderRadius: '7px',
                border: '1px solid #94a3b8',
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#0D1F38',
                background: '#f8fafc',
              }}
            />
            {idx === 0 && effectiveTimes.length > 1 && (
              <span style={{ fontSize: '0.66rem', color: '#0369a1', fontWeight: 700 }}>
                {isAr ? '🔄 تغييرها يضبط باقي الساعات تلقائياً' : '🔄 Auto-aligns remaining doses'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
