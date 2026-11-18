import { useEffect, useMemo, useState } from 'react';
import { EGYPTIAN_GOVERNORATES } from './partnerTypes';
import { SmartNativeSelect } from './SmartChoiceSelect';
import { useSyncedHealthProfile } from './allergyData';
import { playRamadanAdhanOrSuhurSound, scheduleRamadanAdhanAndSuhurAlarms } from './nativeAlarmService';

function formatMinutesTo24h(totalMins: number): string {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface GovCoordinate {
  lat: number;
  lng: number;
}

// Accurate coordinates for all 27 Egyptian Governorates (ESA: Fajr 19.5°, Maghrib 0.833° below horizon)
export const GOVERNORATE_COORDS: Record<string, GovCoordinate> = {
  dakahlia: { lat: 31.0409, lng: 31.3785 },       // المنصورة / الدقهلية
  cairo: { lat: 30.0444, lng: 31.2357 },          // القاهرة
  giza: { lat: 30.0131, lng: 31.2089 },           // الجيزة
  alexandria: { lat: 31.2001, lng: 29.9187 },     // الإسكندرية
  sharkia: { lat: 30.5877, lng: 31.502 },         // الزقازيق / الشرقية
  gharbia: { lat: 30.7865, lng: 31.0004 },        // طنطا / الغربية
  qalyubia: { lat: 30.466, lng: 31.1848 },        // بنها / القليوبية
  menofia: { lat: 30.5503, lng: 31.0106 },        // شبين الكوم / المنوفية
  beheira: { lat: 31.0364, lng: 30.4682 },        // دمنهور / البحيرة
  kafr_el_sheikh: { lat: 31.1107, lng: 30.9388 }, // كفر الشيخ
  damietta: { lat: 31.4175, lng: 31.8144 },       // دمياط
  port_said: { lat: 31.2653, lng: 32.3019 },      // بورسعيد
  ismailia: { lat: 30.5965, lng: 32.2715 },       // الإسماعيلية
  suez: { lat: 29.9668, lng: 32.5498 },           // السويس
  fayoum: { lat: 29.3084, lng: 30.8428 },         // الفيوم
  beni_suef: { lat: 29.0661, lng: 31.0994 },      // بني سويف
  minya: { lat: 28.1099, lng: 30.7503 },          // المنيا
  assiut: { lat: 27.181, lng: 31.1837 },          // أسيوط
  sohag: { lat: 26.5591, lng: 31.6948 },          // سوهاج
  qena: { lat: 26.1551, lng: 32.716 },            // قنا
  luxor: { lat: 25.6872, lng: 32.6396 },          // الأقصر
  aswan: { lat: 24.0889, lng: 32.8998 },          // أسوان
  red_sea: { lat: 27.2579, lng: 33.8116 },        // الغردقة / البحر الأحمر
  south_sinai: { lat: 28.2417, lng: 33.6222 },    // الطور / جنوب سيناء
  north_sinai: { lat: 31.1321, lng: 33.8033 },    // العريش / شمال سيناء
  matrouh: { lat: 31.3543, lng: 27.2373 },        // مرسى مطروح
  new_valley: { lat: 25.439, lng: 30.5586 },      // الخارجة / الوادي الجديد
};

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}
function radToDeg(r: number): number {
  return (r * 180) / Math.PI;
}

/**
 * Calculates today's Fajr and Maghrib times (in minutes from local midnight)
 * for any Egyptian governorate using the Egyptian General Authority of Survey (19.5° Fajr)
 * and the user's current local timezone offset.
 */
export function computeEgyptFajrAndMaghribMinutes(
  govId: string,
  date: Date,
  manualOffsetMinutes = 0
): { fajrMinutes: number; maghribMinutes: number } {
  const coords = GOVERNORATE_COORDS[govId] || GOVERNORATE_COORDS.dakahlia;
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / 86400000);

  // Fractional year in radians
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);

  // Equation of time (in minutes)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination angle (in radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const tzHours = -date.getTimezoneOffset() / 60; // e.g. +2 or +3 (Egypt DST)
  const solarNoonMinutes = 720 - 4 * coords.lng - eqTime + tzHours * 60;

  const latRad = degToRad(coords.lat);

  const hourAngleForZenith = (zenithDeg: number) => {
    const cosHA =
      (Math.cos(degToRad(zenithDeg)) - Math.sin(latRad) * Math.sin(decl)) /
      (Math.cos(latRad) * Math.cos(decl));
    const clamped = Math.max(-1, Math.min(1, cosHA));
    return radToDeg(Math.acos(clamped));
  };

  // Fajr zenith = 90 + 19.5 = 109.5° (Egyptian General Authority of Survey)
  // Maghrib zenith = 90.833° + 1 min precaution
  const haFajr = hourAngleForZenith(109.5);
  const haMaghrib = hourAngleForZenith(90.833);

  const fajrMinutes = Math.round(solarNoonMinutes - haFajr * 4 + manualOffsetMinutes);
  const maghribMinutes = Math.round(solarNoonMinutes + haMaghrib * 4 + 1 + manualOffsetMinutes);

  return { fajrMinutes, maghribMinutes };
}

export function formatMinutesTo12h(totalMins: number, isAr: boolean): string {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 >= 12 ? (isAr ? 'م' : 'PM') : isAr ? 'ص' : 'AM';
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function EgyptGovernorateRamadanCountdown({
  isAr,
  compact = false,
}: {
  isAr: boolean;
  compact?: boolean;
}) {
  const { profile } = useSyncedHealthProfile();

  const [govId, setGovId] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('dawaya_user_location_v1') || 'null');
      return saved?.governorateId || profile.governorateId || 'dakahlia';
    } catch {
      return profile.governorateId || 'dakahlia';
    }
  });

  const [manualOffset, setManualOffset] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('dawaya_prayer_offset_min_v1') || '0') || 0;
    } catch {
      return 0;
    }
  });

  const [now, setNow] = useState<Date>(() => new Date());
  const [alarmEnabled, setAlarmEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dawaya_ramadan_alarm_enabled_v1') === '1';
    } catch { return false; }
  });
  const [suhurLeadMin, setSuhurLeadMin] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('dawaya_ramadan_suhur_lead_min_v1') || '30') || 30;
    } catch { return 30; }
  });
  const [alarmToast, setAlarmToast] = useState<string>('');

  useEffect(() => {
    if (profile.governorateId && GOVERNORATE_COORDS[profile.governorateId]) {
      setGovId(profile.governorateId);
    }
  }, [profile.governorateId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleGovChange = (newGov: string) => {
    setGovId(newGov);
    try {
      const prev = JSON.parse(localStorage.getItem('dawaya_user_location_v1') || '{}');
      localStorage.setItem(
        'dawaya_user_location_v1',
        JSON.stringify({ ...prev, governorateId: newGov })
      );
    } catch {
      /* ignore */
    }
  };

  const adjustOffset = (delta: number) => {
    const next = Math.max(-15, Math.min(15, manualOffset + delta));
    setManualOffset(next);
    try {
      localStorage.setItem('dawaya_prayer_offset_min_v1', String(next));
    } catch {
      /* ignore */
    }
  };

  const status = useMemo(() => {
    const { fajrMinutes, maghribMinutes } = computeEgyptFajrAndMaghribMinutes(
      govId,
      now,
      manualOffset
    );
    const currentSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const fajrSeconds = fajrMinutes * 60;
    const maghribSeconds = maghribMinutes * 60;

    let targetLabelAr = '';
    let targetLabelEn = '';
    let doseAdviceAr = '';
    let doseAdviceEn = '';
    let diffSeconds = 0;
    let isFastingNow = false;

    if (currentSeconds >= fajrSeconds && currentSeconds < maghribSeconds) {
      isFastingNow = true;
      diffSeconds = maghribSeconds - currentSeconds;
      targetLabelAr = 'متبقي على أذان المغرب (الإفطار)';
      targetLabelEn = 'Time until Maghrib (Iftar)';
      doseAdviceAr =
        'جهّز جرعة الإفطار: افطر بتمر وماء أولاً، ولا تأخذ أدوية الضغط أو المسكنات على معدة فارغة.';
      doseAdviceEn =
        'Prepare Iftar dose: break fast with water/dates first; avoid BP meds or NSAIDs on an empty stomach.';
    } else {
      isFastingNow = false;
      diffSeconds =
        currentSeconds < fajrSeconds
          ? fajrSeconds - currentSeconds
          : 86400 - currentSeconds + fajrSeconds;
      targetLabelAr = 'متبقي على أذان الفجر (الإمساك والسحور)';
      targetLabelEn = 'Time until Fajr (Suhur cutoff)';
      doseAdviceAr =
        'فترة الإفطار والسحور: تذكّر جرعة السحور مع شرب ماء كافٍ، وتجنب مدرات البول (مثل لازيكس) في السحور.';
      doseAdviceEn =
        'Suhur window: remember your Suhur dose with plenty of water, and avoid diuretics at Suhur.';
    }

    const hrs = Math.floor(diffSeconds / 3600);
    const mins = Math.floor((diffSeconds % 3600) / 60);
    const secs = diffSeconds % 60;

    const suhurTargetMins = fajrMinutes - suhurLeadMin;
    return {
      fajrStr: formatMinutesTo12h(fajrMinutes, isAr),
      maghribStr: formatMinutesTo12h(maghribMinutes, isAr),
      suhurStr: formatMinutesTo12h(suhurTargetMins, isAr),
      maghribHHMM: formatMinutesTo24h(maghribMinutes),
      suhurHHMM: formatMinutesTo24h(suhurTargetMins),
      targetLabel: isAr ? targetLabelAr : targetLabelEn,
      doseAdvice: isAr ? doseAdviceAr : doseAdviceEn,
      countdownStr: `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      isFastingNow,
    };
  }, [govId, now, manualOffset, suhurLeadMin, isAr]);

  const govName = useMemo(() => {
    const found = EGYPTIAN_GOVERNORATES.find((g) => g.id === govId);
    return found ? (isAr ? found.nameAr : found.nameEn) : govId;
  }, [govId, isAr]);

  useEffect(() => {
    if (alarmEnabled) {
      void scheduleRamadanAdhanAndSuhurAlarms(status.maghribHHMM, status.suhurHHMM, govName, isAr);
    }
  }, [alarmEnabled, status.maghribHHMM, status.suhurHHMM, govName, isAr]);

  const handleSuhurLeadChange = (mins: number) => {
    setSuhurLeadMin(mins);
    try { localStorage.setItem('dawaya_ramadan_suhur_lead_min_v1', String(mins)); } catch {}
  };

  const toggleRamadanAlarm = async () => {
    const next = !alarmEnabled;
    setAlarmEnabled(next);
    try {
      localStorage.setItem('dawaya_ramadan_alarm_enabled_v1', next ? '1' : '0');
    } catch {}
    if (next) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch {}
      }
      await scheduleRamadanAdhanAndSuhurAlarms(status.maghribHHMM, status.suhurHHMM, govName, isAr);
      playRamadanAdhanOrSuhurSound('maghrib', isAr, govName);
      setAlarmToast(
        isAr
          ? `🕌 تم تفعيل أذان المغرب (${status.maghribStr}) وتنبيه السحور (${status.suhurStr}) لمحافظة ${govName}!`
          : `🕌 Maghrib Adhan (${status.maghribStr}) & Suhur alarm (${status.suhurStr}) activated!`
      );
      window.setTimeout(() => setAlarmToast(''), 5500);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0D1F38 0%, #152E52 55%, #115e59 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: compact ? '12px 14px' : '16px 18px',
        border: '1.5px solid rgba(251, 191, 36, 0.55)',
        boxShadow: '0 8px 22px rgba(15, 23, 42, 0.16)',
      }}
    >
      <div
        className="row wrapRow"
        style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
      >
        <div>
          <span
            className="badge"
            style={{
              background: 'rgba(251, 191, 36, 0.2)',
              color: '#fde68a',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              fontWeight: 800,
              fontSize: '0.75rem',
            }}
          >
            🕌 {isAr ? `توقيت محافظة ${govName} (فروق خطوط الطول)` : `${govName} Local Prayer Timing`}
          </span>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: '4px', color: '#f8fafc' }}>
            {status.targetLabel}
          </div>
        </div>

        {/* Live Digital Countdown */}
        <div
          dir="ltr"
          style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1.5px solid #fbbf24',
            borderRadius: '12px',
            padding: '6px 14px',
            fontFamily: 'monospace',
            fontSize: compact ? '1.25rem' : '1.45rem',
            fontWeight: 900,
            color: '#fde047',
            letterSpacing: '1.5px',
          }}
        >
          {status.countdownStr}
        </div>
      </div>

      {/* Fajr & Maghrib local times + Governorate unified selector + Fine-tune +/- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '8px',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.07)',
          borderRadius: '12px',
          padding: '10px',
        }}
      >
        <div className="row wrapRow" style={{ gap: '8px', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="small" style={{ color: '#cbd5e1', fontSize: '0.74rem' }}>
              🌅 {isAr ? 'أذان المغرب (الإفطار)' : 'Maghrib (Iftar)'}
            </div>
            <strong style={{ color: '#fde047', fontSize: '0.95rem' }}>{status.maghribStr}</strong>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div className="small" style={{ color: '#cbd5e1', fontSize: '0.74rem' }}>
              🌙 {isAr ? 'أذان الفجر (الإمساك)' : 'Fajr (Suhur)'}
            </div>
            <strong style={{ color: '#7dd3fc', fontSize: '0.95rem' }}>{status.fajrStr}</strong>
          </div>
        </div>

        <div>
          <SmartNativeSelect
            value={govId}
            title={isAr ? 'اختر محافظتك لضبط فرق التوقيت' : 'Select Governorate for Prayer Time'}
            onChange={(e) => handleGovChange(e.target.value)}
          >
            {EGYPTIAN_GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>
                {isAr ? `محافظة ${g.nameAr}` : g.nameEn}
              </option>
            ))}
          </SmartNativeSelect>
        </div>

        <div className="row" style={{ gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
          <span className="small" style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>
            {isAr ? 'ضبط دقيق للقرية:' : 'Fine-tune:'}
          </span>
          <button
            type="button"
            onClick={() => adjustOffset(-1)}
            style={{
              background: 'rgba(255,255,255,0.14)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '3px 9px',
              cursor: 'pointer',
              fontWeight: 800,
            }}
          >
            -1 {isAr ? 'د' : 'm'}
          </button>
          <span dir="ltr" style={{ fontWeight: 900, fontSize: '0.82rem', minWidth: '38px', textAlign: 'center', color: '#fde68a' }}>
            {manualOffset > 0 ? `+${manualOffset}` : manualOffset}m
          </span>
          <button
            type="button"
            onClick={() => adjustOffset(1)}
            style={{
              background: 'rgba(255,255,255,0.14)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '3px 9px',
              cursor: 'pointer',
              fontWeight: 800,
            }}
          >
            +1 {isAr ? 'د' : 'm'}
          </button>
        </div>
      </div>

      <div
        className="small"
        style={{
          marginTop: '8px',
          padding: '8px 10px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.16)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          color: '#ecfdf5',
          fontWeight: 700,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>💊 {status.doseAdvice}</span>
        <button
          type="button"
          onClick={() => void toggleRamadanAlarm()}
          style={{
            background: alarmEnabled ? '#fbbf24' : 'rgba(255,255,255,0.16)',
            color: alarmEnabled ? '#0f172a' : '#ffffff',
            border: '1px solid rgba(251, 191, 36, 0.7)',
            borderRadius: '999px',
            padding: '5px 12px',
            fontWeight: 900,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          {alarmEnabled
            ? (isAr ? '🔔 منبه الإفطار والسحور مفعّل ✓' : '🔔 Iftar/Suhur Alarm Active ✓')
            : (isAr ? '🔔 تفعيل منبه أدوية الإفطار والسحور' : '🔔 Enable Iftar/Suhur Med Alarm')}
        </button>
      </div>
      {/* Adhan & Suhur Sound Preview + Lead Time Bar */}
      <div
        className="row wrapRow"
        style={{
          marginTop: '8px',
          padding: '8px 10px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div className="row wrapRow" style={{ gap: '6px', alignItems: 'center' }}>
          <span className="small" style={{ color: '#fde68a', fontWeight: 800 }}>
            {isAr ? `🌙 تنبيه السحور (${status.suhurStr}):` : `🌙 Suhur Alert (${status.suhurStr}):`}
          </span>
          {[20, 30, 45, 60].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSuhurLeadChange(m)}
              style={{
                background: suhurLeadMin === m ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                color: suhurLeadMin === m ? '#0f172a' : '#f8fafc',
                border: '1px solid rgba(251,191,36,0.4)',
                borderRadius: '999px',
                padding: '3px 9px',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isAr ? `قبل الفجر بـ ${m} د` : `${m}m pre-Fajr`}
            </button>
          ))}
        </div>
        <div className="row wrapRow" style={{ gap: '6px' }}>
          <button
            type="button"
            onClick={() => playRamadanAdhanOrSuhurSound('maghrib', isAr, govName)}
            style={{
              background: 'rgba(16, 185, 129, 0.25)',
              color: '#ecfdf5',
              border: '1px solid rgba(52, 211, 153, 0.55)',
              borderRadius: '999px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🔊 {isAr ? 'تجربة أذان المغرب (الله أكبر)' : 'Test Maghrib Adhan'}
          </button>
          <button
            type="button"
            onClick={() => playRamadanAdhanOrSuhurSound('suhur', isAr, govName)}
            style={{
              background: 'rgba(56, 189, 248, 0.22)',
              color: '#e0f2fe',
              border: '1px solid rgba(125, 211, 252, 0.55)',
              borderRadius: '999px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🌙 {isAr ? 'تجربة منبه السحور' : 'Test Suhur Alert'}
          </button>
        </div>
      </div>

      {alarmToast && (
        <div
          className="small"
          style={{
            marginTop: '6px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'rgba(251, 191, 36, 0.22)',
            color: '#fde68a',
            fontWeight: 800,
          }}
        >
          {alarmToast}
        </div>
      )}
    </div>
  );
}
