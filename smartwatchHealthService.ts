import { UserHealthProfile } from './allergyData';
import { scheduleSingleNativeDoseAlarm } from './nativeAlarmService';
import { TreatmentSchedule } from './trackerData';

export interface HeartRateReading {
  id: string;
  bpm: number;
  state: 'resting' | 'active';
  source: 'ble' | 'health_connect' | 'manual';
  deviceName?: string;
  timestamp: string;
  alertLevel: 'normal' | 'warning' | 'critical';
  alertTitleAr: string;
  alertTitleEn: string;
  alertDetailAr: string;
  alertDetailEn: string;
  matchedMedications: string[];
}

export interface HydrationState {
  enabled: boolean;
  intervalHours: 1 | 2 | 3;
  wakeHour: number;
  sleepHour: number;
  todayDate: string;
  consumedMl: number;
  connectedWatchName: string;
}

export interface SmartwatchHealthStorage {
  hydration: HydrationState;
  readings: HeartRateReading[];
}

const STORAGE_KEY = 'dawaya_smartwatch_health_v1';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadSmartwatchHealthState(): SmartwatchHealthStorage {
  const today = getTodayKey();
  const fallback: SmartwatchHealthStorage = {
    hydration: {
      enabled: false,
      intervalHours: 2,
      wakeHour: 8,
      sleepHour: 23,
      todayDate: today,
      consumedMl: 0,
      connectedWatchName: '',
    },
    readings: [],
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SmartwatchHealthStorage>;
    const h = parsed.hydration;
    const hydration: HydrationState = {
      enabled: Boolean(h?.enabled),
      intervalHours: h?.intervalHours === 1 || h?.intervalHours === 3 ? h.intervalHours : 2,
      wakeHour: typeof h?.wakeHour === 'number' ? h.wakeHour : 8,
      sleepHour: typeof h?.sleepHour === 'number' ? h.sleepHour : 23,
      todayDate: today,
      consumedMl: h?.todayDate === today && typeof h?.consumedMl === 'number' ? h.consumedMl : 0,
      connectedWatchName: typeof h?.connectedWatchName === 'string' ? h.connectedWatchName : '',
    };
    const readings = Array.isArray(parsed.readings) ? parsed.readings.slice(0, 15) : [];
    return { hydration, readings };
  } catch {
    return fallback;
  }
}

export function saveSmartwatchHealthState(state: SmartwatchHealthStorage): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore storage quota errors */
  }
}

export function computeSmartHydrationTarget(
  schedules: TreatmentSchedule[] = [],
  profile?: UserHealthProfile | null
): {
  targetMl: number;
  baseMl: number;
  extraMl: number;
  reasonsAr: string[];
  reasonsEn: string[];
} {
  const baseMl = 2000;
  let extraMl = 0;
  const reasonsAr: string[] = [];
  const reasonsEn: string[] = [];

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const activeSchedules = safeSchedules.filter((s) => (s?.doses?.length ?? 0) > 0);

  if (activeSchedules.length > 0) {
    extraMl += Math.min(activeSchedules.length * 300, 600);
    reasonsAr.push(`وجود ${activeSchedules.length} دواء نشط (المضادات الحيوية والمسكنات تحتاج ترطيباً إضافياً للكلى والمعدة)`);
    reasonsEn.push(`${activeSchedules.length} active medication(s) requiring extra renal & gastric hydration`);
  }

  const extraText = activeSchedules
    .map((s) => `${s?.medicineName || ''} ${s?.prescribedDose || ''} ${s?.notes || ''}`)
    .join(' ')
    .toLowerCase();

  if (/effervescent|فوار|cipro|ليفو|levo|sulfa|metformin|جلوكوفاج|nsaid|ibuprofen|cataflam|voltaren|بروفين|كتافلام/i.test(extraText)) {
    extraMl += 250;
    reasonsAr.push('أدوية تتطلب شرب كوب ماء كبير مع كل جرعة لحماية الكلى');
    reasonsEn.push('Medications requiring a full glass of water per dose to protect kidneys');
  }

  const chronicList = Array.isArray(profile?.chronicConditions) ? profile!.chronicConditions : [];
  const hasRenalOrMetabolic = chronicList.some((c) => {
    const label = typeof c === 'string' ? c : `${c?.conditionName || ''} ${c?.notes || ''}`;
    return /diabet|kidney|renal|gout|سكر|كلى|نقرس/i.test(label);
  });

  if (hasRenalOrMetabolic || profile?.renalStatus === 'impaired') {
    extraMl += 250;
    reasonsAr.push('حالة صحية تستفيد من انتظام شرب المياه على مدار اليوم');
    reasonsEn.push('Health condition benefiting from regular hydration');
  }

  return {
    targetMl: Math.min(baseMl + extraMl, 3500),
    baseMl,
    extraMl,
    reasonsAr,
    reasonsEn,
  };
}

const RATE_LOWERING_PATTERNS = [
  'concor', 'كونكور', 'bisoprolol', 'بيسوبرولول', 'inderal', 'اندرال', 'إندرال',
  'propranolol', 'بروبرانولول', 'atenolol', 'اتينولول', 'tenormin', 'تينورمين',
  'carvedilol', 'كارفيديلول', 'dilatrend', 'metoprolol', 'ميتوبرولول', 'betaloc',
  'nebivolol', 'نيبيفولول', 'nebilet', 'digoxin', 'ديجوكسين', 'lanoxin',
  'verapamil', 'فيراباميل', 'isoptin', 'diltiazem', 'ivabradine', 'procoralan',
];

const RATE_RAISING_PATTERNS = [
  'congestal', 'كونجستال', 'comtrex', 'كومتركس', '123', 'one two three', 'flurest',
  'pseudoephedrine', 'سودوإيفيدرين', 'phenylephrine', 'ventolin', 'فنتولين',
  'salbutamol', 'سالبوتامول', 'eltroxin', 'التروكسين', 'levothyroxine', 'ليفوثيروكسين',
  'theophylline', 'ثيوفيللين', 'amaryl', 'panadol extra', 'بنادول اكسترا', 'caffeine',
];

function collectPatientMedicationNames(
  schedules: TreatmentSchedule[] = [],
  profile?: UserHealthProfile | null
): string[] {
  const names = new Set<string>();
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  for (const s of safeSchedules) {
    if (s?.medicineName) names.add(s.medicineName);
    if (Array.isArray(s?.coMedications)) {
      for (const cm of s.coMedications) {
        if (cm) names.add(cm);
      }
    }
  }
  const medList = Array.isArray(profile?.medications) ? profile!.medications : [];
  for (const m of medList) {
    if (m?.drugName) names.add(m.drugName);
    if (m?.activeIngredients) names.add(m.activeIngredients);
  }
  return Array.from(names);
}

export function evaluateHeartRateWithMedications(
  bpm: number,
  state: 'resting' | 'active',
  schedules: TreatmentSchedule[] = [],
  profile?: UserHealthProfile | null
): Omit<HeartRateReading, 'id' | 'source' | 'deviceName' | 'timestamp'> {
  const medNames = collectPatientMedicationNames(schedules, profile);
  const medHaystack = medNames.join(' | ').toLowerCase();

  const matchedLowering = medNames.filter((n) =>
    RATE_LOWERING_PATTERNS.some((pat) => n.toLowerCase().includes(pat))
  );
  const matchedRaising = medNames.filter((n) =>
    RATE_RAISING_PATTERNS.some((pat) => n.toLowerCase().includes(pat))
  );

  if (bpm < 42 || (state === 'resting' && bpm > 135)) {
    return {
      bpm,
      state,
      alertLevel: 'critical',
      alertTitleAr: bpm < 42 ? '🚨 تحذير طارئ: هبوط حاد في نبضات القلب' : '🚨 تحذير طارئ: تسارع شديد في نبضات القلب وقت الراحة',
      alertTitleEn: bpm < 42 ? '🚨 Emergency: Severe Bradycardia' : '🚨 Emergency: Severe Resting Tachycardia',
      alertDetailAr:
        bpm < 42
          ? 'القراءة أقل من 42 نبضة/دقيقة. إذا كنت تشعر بدوخة أو إغماء أو ضيق نفس، اطلب الرعاية الطبية فوراً ولا تتناول جرعة دواء ضغط/قلب جديدة قبل استشارة الطبيب.'
          : 'النبض يتجاوز 135 نبضة/دقيقة أثناء الراحة. اجلس فوراً واشرب ماءً وراجع أقرب طوارئ إذا استمر التسارع أو صاحبه ألم بالصدر.',
      alertDetailEn:
        bpm < 42
          ? 'Heart rate is below 42 BPM. If dizzy or short of breath, seek urgent medical care and hold next rate-lowering dose until reviewed.'
          : 'Resting heart rate exceeds 135 BPM. Rest immediately and seek urgent evaluation if chest pain or dizziness occurs.',
      matchedMedications: matchedLowering.length ? matchedLowering : matchedRaising,
    };
  }

  if (bpm < 55) {
    if (matchedLowering.length > 0 || RATE_LOWERING_PATTERNS.some((p) => medHaystack.includes(p))) {
      return {
        bpm,
        state,
        alertLevel: 'warning',
        alertTitleAr: '⚠️ تنبيه دوائي: بطء في النبض قد يرتبط بأدوية القلب/الضغط',
        alertTitleEn: '⚠️ Medication Alert: Low Heart Rate with Rate-Lowering Drugs',
        alertDetailAr: `النبض (${bpm} نبضة/دقيقة) أقل من 55، ولديك في ملفك أدوية تبطئ النبض (${matchedLowering.join('، ') || 'أدوية ضغط/قلب'}). أبلغ طبيبك قبل تعديل الجرعة وراقب أي دوخة.`,
        alertDetailEn: `Heart rate (${bpm} BPM) is below 55 while taking rate-lowering medication (${matchedLowering.join(', ') || 'cardiac/BP drug'}). Consult your physician before your next dose.`,
        matchedMedications: matchedLowering,
      };
    }
    return {
      bpm,
      state,
      alertLevel: 'warning',
      alertTitleAr: '⚠️ نبض قلب منخفض نسبياً (أقل من 55)',
      alertTitleEn: '⚠️ Relatively Low Heart Rate (< 55 BPM)',
      alertDetailAr: `القراءة ${bpm} نبضة/دقيقة. إذا لم تكن رياضياً منتظماً وشعرت بإرهاق أو دوخة، يُنصح بقياس الضغط واستشارة الطبيب.`,
      alertDetailEn: `Reading is ${bpm} BPM. Unless you are an endurance athlete, monitor blood pressure and consult a doctor if fatigued.`,
      matchedMedications: [],
    };
  }

  if (state === 'resting' && bpm > 100) {
    if (matchedRaising.length > 0 || RATE_RAISING_PATTERNS.some((p) => medHaystack.includes(p))) {
      return {
        bpm,
        state,
        alertLevel: 'warning',
        alertTitleAr: '⚠️ تنبيه دوائي: تسارع النبض وقت الراحة مع أدوية منبهة للنبض',
        alertTitleEn: '⚠️ Medication Alert: Resting Tachycardia Linked to Active Meds',
        alertDetailAr: `النبض (${bpm} نبضة/دقيقة) مرتفع وقت الراحة، ولديك في سجلك أدوية قد ترفع النبض (${matchedRaising.join('، ') || 'مزيل احتقان/موسع شعب'}). اشرب ماءً، تجنب الكافيين، وراجع الطبيب إذا استمر التسارع.`,
        alertDetailEn: `Resting heart rate (${bpm} BPM) is elevated while using heart-stimulating meds (${matchedRaising.join(', ') || 'decongestant/bronchodilator'}). Hydrate, avoid caffeine, and check with your doctor.`,
        matchedMedications: matchedRaising,
      };
    }
    return {
      bpm,
      state,
      alertLevel: 'warning',
      alertTitleAr: '⚠️ تسارع في نبضات القلب وقت الراحة (> 100)',
      alertTitleEn: '⚠️ Elevated Resting Heart Rate (> 100 BPM)',
      alertDetailAr: `القراءة ${bpm} نبضة/دقيقة وقت الراحة. قد يكون السبب جفافاً أو حرارة أو توتراً — اشرب كوب ماء وأعد القياس بعد 10 دقائق راحة.`,
      alertDetailEn: `Resting HR is ${bpm} BPM. Dehydration, fever, or stress can elevate pulse — drink water and re-check after 10 minutes of rest.`,
      matchedMedications: [],
    };
  }

  return {
    bpm,
    state,
    alertLevel: 'normal',
    alertTitleAr: '✅ نبضات القلب في النطاق الطبيعي الآمن',
    alertTitleEn: '✅ Heart Rate Within Safe Normal Range',
    alertDetailAr: `القراءة (${bpm} نبضة/دقيقة) متوافقة تماماً مع حالتك الحالية ولا يوجد تعارض نبضي مع أدويتك المسجلة.`,
    alertDetailEn: `Reading (${bpm} BPM) is stable with no cardiac-medication conflict detected.`,
    matchedMedications: [],
  };
}

export async function sendSmartwatchTestPing(isAr: boolean): Promise<{ ok: boolean; via: string }> {
  const title = isAr ? '⌚💊 دوايا | اختبار الساعة الذكية' : '⌚💊 DAWAYA | Smartwatch Test';
  const body = isAr
    ? 'ممتاز! هذا تنبيه تجريبي للساعة الذكية: موعد الدواء وشرب المياه سيصلانك هنا بوضوح.'
    : 'Success! Dose & hydration alerts will appear cleanly on your smartwatch.';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bridge = typeof window !== 'undefined' ? (window as any).AndroidAlarmBridge : null;
  if (bridge && typeof bridge.scheduleExactAlarm === 'function') {
    try {
      bridge.requestPermissions?.();
      const ok = bridge.scheduleExactAlarm(88099, Date.now() + 2500, title, body);
      if (ok) return { ok: true, via: 'android_apk' };
    } catch {
      /* fallback below */
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    if (perm === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body,
            icon: './favicon-192.png',
            badge: './favicon-48.png',
            tag: 'dawaya-smartwatch-test',
          });
          return { ok: true, via: 'sw_notification' };
        }
        new Notification(title, { body, icon: './favicon-192.png' });
        return { ok: true, via: 'web_notification' };
      } catch {
        /* ignore */
      }
    }
  }

  return { ok: false, via: 'none' };
}

export async function scheduleSmartwatchHydrationAlarms(
  hydration: HydrationState,
  schedules: TreatmentSchedule[] = [],
  isAr: boolean
): Promise<number> {
  if (!hydration.enabled) return 0;

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const activeNames = safeSchedules
    .map((s) => s?.medicineName)
    .filter(Boolean)
    .slice(0, 2);

  const medNote = activeNames.length
    ? isAr
      ? `لحماية الكلى مع (${activeNames.join('، ')})`
      : `to support kidneys with (${activeNames.join(', ')})`
    : isAr
      ? 'للحفاظ على ترطيب جسمك وامتصاص الدواء'
      : 'to keep your body hydrated for optimal recovery';

  let scheduled = 0;

  for (let h = hydration.wakeHour; h <= hydration.sleepHour && scheduled < 6; h += hydration.intervalHours) {
    const hhmm = `${String(h).padStart(2, '0')}:00`;
    const label = isAr ? '⌚💧 شرب كوب ماء (250 مل)' : '⌚💧 Drink 250 ml Water';
    const res = await scheduleSingleNativeDoseAlarm(label, medNote, hhmm, isAr);
    if (res.success) scheduled += 1;
  }

  return scheduled;
}

export function isAndroidApkBridgeAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = (window as any).AndroidAlarmBridge;
  return Boolean(b && typeof b.isAvailable === 'function' && b.isAvailable());
}

export function isWebBluetoothAvailable(): boolean {
  if (typeof navigator === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((navigator as any).bluetooth && typeof (navigator as any).bluetooth.requestDevice === 'function');
}

export async function connectBleHeartRateMonitor(
  onBpm: (bpm: number, deviceName: string) => void,
  onDisconnect?: () => void
): Promise<{ deviceName: string; disconnect: () => void }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bt = (navigator as any).bluetooth;
  if (!bt) {
    throw new Error('BLE_UNSUPPORTED');
  }

  const device = await bt.requestDevice({
    filters: [{ services: [0x180d] }],
    optionalServices: [0x180d],
  });

  const deviceName = device.name || 'Smartwatch HR';
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(0x180d);
  const char = await service.getCharacteristic(0x2a37);

  await char.startNotifications();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = (event: any) => {
    const value: DataView | undefined = event?.target?.value;
    if (!value || value.byteLength < 2) return;
    const flags = value.getUint8(0);
    const is16Bit = (flags & 0x01) !== 0;
    const bpm = is16Bit && value.byteLength >= 3 ? value.getUint16(1, true) : value.getUint8(1);
    if (bpm >= 30 && bpm <= 240) {
      onBpm(bpm, deviceName);
    }
  };
  char.addEventListener('characteristicvaluechanged', handler);

  if (onDisconnect) {
    device.addEventListener('gattserverdisconnected', onDisconnect);
  }

  return {
    deviceName,
    disconnect: () => {
      try {
        char.removeEventListener('characteristicvaluechanged', handler);
        if (device.gatt?.connected) device.gatt.disconnect();
      } catch {
        /* ignore */
      }
    },
  };
}
