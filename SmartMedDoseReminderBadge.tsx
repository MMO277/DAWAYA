import React, { useEffect, useState } from 'react';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import {
  scheduleSingleNativeDoseAlarm,
  requestNotificationPermission,
} from './nativeAlarmService';

export interface SmartMedDoseReminderBadgeProps {
  medicineName: string;
  defaultTime?: string;
  instruction?: string;
  pillCategory?: 'contraceptive' | 'chronic_bp' | 'diabetes' | 'stomach' | 'inhaler' | 'general';
  compact?: boolean;
}

const STORAGE_PREFIX = 'dawaya_med_reminder_';

export default function SmartMedDoseReminderBadge({
  medicineName,
  defaultTime = '21:00',
  instruction = 'يرجى أخذ الجرعة في موعدها بانتظام للحفاظ على المفعول',
  pillCategory = 'general',
  compact = false,
}: SmartMedDoseReminderBadgeProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const storageKey = `${STORAGE_PREFIX}${medicineName.trim().toLowerCase().replace(/\s+/g, '_')}`;

  const [reminderTime, setReminderTime] = useState<string>(defaultTime);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSetting, setIsSetting] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.active) {
          setIsScheduled(true);
          if (parsed.time) setReminderTime(parsed.time);
        }
      }
    } catch {
      /* ignore storage errors */
    }
  }, [storageKey]);

  const handleActivateReminder = async () => {
    setIsSetting(true);
    try {
      await requestNotificationPermission();
      const res = await scheduleSingleNativeDoseAlarm(
        medicineName,
        instruction,
        reminderTime,
        isAr
      );

      setIsScheduled(true);
      const msg = isAr
        ? `✅ تم تفعيل التذكير اليومي لـ «${medicineName}» بنجاح! هيفكرك يومياً الساعة ${reminderTime}.`
        : `✅ Daily reminder scheduled for "${medicineName}" at ${reminderTime}.`;
      setSuccessMsg(msg);
      speakText(msg, lang);

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          active: true,
          time: reminderTime,
          medicineName,
          instruction,
          updatedAt: new Date().toISOString(),
        })
      );

      setTimeout(() => setSuccessMsg(null), 6000);
    } catch {
      setSuccessMsg(
        isAr
          ? '⚠️ تعذر تفعيل الإشعار التلقائي، تأكد من السماح بالإشعارات في المتصفح.'
          : '⚠️ Could not schedule notification. Please allow permissions.'
      );
    } finally {
      setIsSetting(false);
    }
  };

  const handleCancelReminder = () => {
    setIsScheduled(false);
    localStorage.removeItem(storageKey);
    const msg = isAr
      ? `تم إلغاء تذكير «${medicineName}».`
      : `Reminder cancelled for "${medicineName}".`;
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Specific context prompts according to category
  const categoryBadgeLabelAr =
    pillCategory === 'contraceptive'
      ? '🌸 تذكير حبة منع الحمل اليومية (تجنبي النسيان للحماية 99%)'
      : pillCategory === 'chronic_bp'
      ? '🫀 تذكير دواء الضغط والقلب اليومي'
      : pillCategory === 'stomach'
      ? '🔥 تذكير كبسولة المعدة الصباحية على الريق'
      : pillCategory === 'inhaler'
      ? '🫁 تذكير بخاخ الصدر الوقائي'
      : pillCategory === 'diabetes'
      ? '🩸 تذكير علاج السكر وموعد الوجبة'
      : '💊 تذكير مواعيد الجرعات اليومية الذكي';

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: compact ? '12px 14px' : '16px 18px',
        background: isScheduled
          ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: isScheduled ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
        margin: '12px 0',
        boxShadow: '0 4px 14px rgba(13, 31, 56, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: compact ? '1.2rem' : '1.4rem' }}>
            {pillCategory === 'contraceptive' ? '🌸' : '🔔'}
          </span>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: isScheduled ? '#166534' : '#0f766e' }}>
              {isAr ? categoryBadgeLabelAr : 'Smart Dose Reminder'}
            </div>
            <strong style={{ color: '#0D1F38', fontSize: compact ? '0.92rem' : '1rem' }}>
              {isAr
                ? `بتاخد «${medicineName}» بانتظام؟ نفكرك بميعاده كل يوم؟`
                : `Taking "${medicineName}"? Want a daily reminder?`}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!isScheduled ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                  {isAr ? 'الميعاد:' : 'Time:'}
                </span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1.5px solid #0f766e',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    color: '#0D1F38',
                    background: '#ffffff',
                  }}
                />
              </div>

              <button
                type="button"
                disabled={isSetting}
                onClick={handleActivateReminder}
                style={{
                  padding: '7px 14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  border: 'none',
                  cursor: isSetting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(19, 136, 102, 0.25)',
                }}
              >
                {isSetting ? '⏳ جارٍ التفعيل...' : isAr ? '🔔 فكرني كل يوم بإشعار' : '🔔 Remind Me Daily'}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  padding: '5px 12px',
                  borderRadius: '12px',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                }}
              >
                {isAr ? `🟢 متفعل يومياً: ${reminderTime}` : `🟢 Active Daily: ${reminderTime}`}
              </span>
              <button
                type="button"
                onClick={handleCancelReminder}
                style={{
                  padding: '5px 10px',
                  borderRadius: '10px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  border: '1px solid #fca5a5',
                  cursor: 'pointer',
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      </div>

      {successMsg && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: isScheduled ? '#dcfce7' : '#fee2e2',
            color: isScheduled ? '#166534' : '#991b1b',
            fontSize: '0.82rem',
            fontWeight: 800,
          }}
        >
          {successMsg}
        </div>
      )}
    </div>
  );
}
