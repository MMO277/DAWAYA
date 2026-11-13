import { useEffect, useMemo, useRef, useState } from 'react';
import { UserHealthProfile } from './allergyData';
import { TreatmentSchedule } from './trackerData';
import {
  computeSmartHydrationTarget,
  connectBleHeartRateMonitor,
  evaluateHeartRateWithMedications,
  HeartRateReading,
  isAndroidApkBridgeAvailable,
  isWebBluetoothAvailable,
  loadSmartwatchHealthState,
  saveSmartwatchHealthState,
  scheduleSmartwatchHydrationAlarms,
  sendSmartwatchTestPing,
  SmartwatchHealthStorage,
} from './smartwatchHealthService';

interface SmartwatchHealthCenterProps {
  isAr: boolean;
  schedules: TreatmentSchedule[];
  profile?: UserHealthProfile | null;
  compact?: boolean;
}

export default function SmartwatchHealthCenter({
  isAr,
  schedules,
  profile,
  compact = false,
}: SmartwatchHealthCenterProps) {
  const [state, setState] = useState<SmartwatchHealthStorage>(() => loadSmartwatchHealthState());
  const [activeTab, setActiveTab] = useState<'watch' | 'water' | 'heart'>('heart');
  const [manualBpm, setManualBpm] = useState('');
  const [hrActivityState, setHrActivityState] = useState<'resting' | 'active'>('resting');
  const [bleStatus, setBleStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [bleErrorMsg, setBleErrorMsg] = useState('');
  const [watchToast, setWatchToast] = useState<string | null>(null);
  const [showOraimoGuide, setShowOraimoGuide] = useState(false);
  const disconnectBleRef = useRef<(() => void) | null>(null);

  const isApk = useMemo(() => isAndroidApkBridgeAvailable(), []);
  const bleSupported = useMemo(() => isWebBluetoothAvailable(), []);
  const waterGoal = useMemo(() => computeSmartHydrationTarget(schedules, profile), [schedules, profile]);

  useEffect(() => {
    saveSmartwatchHealthState(state);
  }, [state]);

  useEffect(() => {
    return () => {
      disconnectBleRef.current?.();
    };
  }, []);

  const recordHeartRate = (
    bpm: number,
    source: HeartRateReading['source'],
    deviceName?: string
  ) => {
    const cleanBpm = Math.round(bpm);
    if (Number.isNaN(cleanBpm) || cleanBpm < 30 || cleanBpm > 240) return;
    const evaluation = evaluateHeartRateWithMedications(cleanBpm, hrActivityState, schedules, profile);
    const entry: HeartRateReading = {
      id: `hr_${Date.now()}`,
      source,
      deviceName,
      timestamp: new Date().toISOString(),
      ...evaluation,
    };
    setState((prev) => ({
      ...prev,
      hydration: deviceName
        ? { ...prev.hydration, connectedWatchName: deviceName }
        : prev.hydration,
      readings: [entry, ...prev.readings].slice(0, 15),
    }));
  };

  const handleConnectBle = async () => {
    setBleStatus('connecting');
    setBleErrorMsg('');
    try {
      const conn = await connectBleHeartRateMonitor(
        (bpm, devName) => {
          setBleStatus('connected');
          recordHeartRate(bpm, 'ble', devName);
        },
        () => {
          setBleStatus('idle');
        }
      );
      disconnectBleRef.current = conn.disconnect;
      setBleStatus('connected');
      setState((prev) => ({
        ...prev,
        hydration: { ...prev.hydration, connectedWatchName: conn.deviceName },
      }));
    } catch (err) {
      setBleStatus('error');
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'BLE_UNSUPPORTED') {
        setBleErrorMsg(
          isAr
            ? 'المتصفح الحالي لا يدعم البلوتوث المباشر. استخدم زر "إدخال قراءة الساعة" أدناه.'
            : 'Direct Web Bluetooth is not supported here. Use Quick Watch Entry below.'
        );
      } else {
        setBleErrorMsg(
          isAr
            ? 'لم يتم العثور على ساعة تبث النبض المفتوح (0x180D). ساعات أورايمو/آبل تقفل البث على تطبيقها — استخدم الإدخال السريع بالأسفل.'
            : 'No open BLE Heart Rate watch found (Oraimo/Apple restrict direct BLE). Use Quick Watch Entry below.'
        );
      }
    }
  };

  const handleNativeBleScan = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bridge = (window as any).AndroidAlarmBridge;
    if (bridge && typeof bridge.openHealthConnectSettings === 'function') {
      bridge.openHealthConnectSettings();
      setWatchToast(
        isAr
          ? 'تم فتح إعدادات Health Connect لربط ساعة أورايمو بالتطبيق.'
          : 'Opened Health Connect settings to link your smartwatch.'
      );
      return;
    }
    if (bleSupported) {
      void handleConnectBle();
    } else {
      setShowOraimoGuide(true);
    }
  };

  const handleTestWatchAlert = async () => {
    const res = await sendSmartwatchTestPing(isAr);
    setWatchToast(
      res.ok
        ? isAr
          ? '⌚ تم إرسال تنبيه تجريبي الآن! تأكد من تفعيل إشعارات DAWAYA داخل تطبيق ساعتك (مثل oraimo Health).'
          : '⌚ Test alert sent! Make sure DAWAYA notifications are enabled inside your watch app (e.g., oraimo Health).'
        : isAr
          ? '⚠️ يرجى السماح بإشعارات التطبيق من إعدادات الهاتف لتصل التنبيهات للساعة.'
          : '⚠️ Please allow app notifications in phone settings so alerts reach your watch.'
    );
  };

  const handleToggleHydration = async () => {
    const nextEnabled = !state.hydration.enabled;
    const nextHydration = { ...state.hydration, enabled: nextEnabled };
    setState((prev) => ({ ...prev, hydration: nextHydration }));
    if (nextEnabled) {
      const count = await scheduleSmartwatchHydrationAlarms(nextHydration, schedules, isAr);
      setWatchToast(
        isAr
          ? `💧 تم تفعيل منبه شرب المياه الذكي (${count} تنبيهات مجدولة للساعة والهاتف).`
          : `💧 Smart hydration reminders enabled (${count} alerts scheduled for phone & watch).`
      );
    } else {
      setWatchToast(isAr ? 'تم إيقاف منبه شرب المياه.' : 'Hydration reminders paused.');
    }
  };

  const handleAddWaterCup = (ml: number) => {
    setState((prev) => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        consumedMl: Math.max(0, Math.min(prev.hydration.consumedMl + ml, 5000)),
      },
    }));
  };

  const latestReading = state.readings[0] || null;
  const waterPercent = Math.min(100, Math.round((state.hydration.consumedMl / waterGoal.targetMl) * 100));

  return (
    <section
      className="card stack no-print"
      style={{
        borderInlineStart: '5px solid #0284c7',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(16,185,129,0.04))',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: compact ? '1.1rem' : '1.25rem' }}>
            ⌚ {isAr ? 'مركز الساعة الذكية والنبض والمياه' : 'Smartwatch, Heart Rate & Hydration Center'}
          </h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {isAr
              ? 'وصول مواعيد الدواء وشرب المياه لساعة أورايمو وكل الساعات، مع رصد تحذيرات النبض المرتبطة بأدويتك.'
              : 'Deliver dose & water alerts to Oraimo and all smartwatches, plus cardiac-medication pulse screening.'}
          </p>
        </div>
        <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: isApk ? '#dcfce7' : '#e0f2fe', color: isApk ? '#166534' : '#075985' }}>
            {isApk ? (isAr ? '📱 وضع APK الأصلي' : '📱 Native APK Mode') : (isAr ? '🌐 وضع الويب الذكي' : '🌐 Smart Web Mode')}
          </span>
          {state.hydration.connectedWatchName && (
            <span className="badge" style={{ background: '#f0fdf4', color: '#15803d' }}>
              ⌚ {state.hydration.connectedWatchName}
            </span>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="row wrapRow" style={{ gap: '8px' }}>
        <button
          type="button"
          className={activeTab === 'heart' ? 'btn small' : 'btn-secondary small'}
          onClick={() => setActiveTab('heart')}
        >
          ❤️ {isAr ? 'نبضات القلب والتحذيرات' : 'Heart Rate & Alerts'}
        </button>
        <button
          type="button"
          className={activeTab === 'water' ? 'btn small' : 'btn-secondary small'}
          onClick={() => setActiveTab('water')}
        >
          💧 {isAr ? `شرب المياه (${waterPercent}%)` : `Hydration (${waterPercent}%)`}
        </button>
        <button
          type="button"
          className={activeTab === 'watch' ? 'btn small' : 'btn-secondary small'}
          onClick={() => setActiveTab('watch')}
        >
          ⌚ {isAr ? 'إعداد الساعة الذكية' : 'Watch Setup'}
        </button>
      </div>

      {watchToast && (
        <div
          className="card"
          style={{
            padding: '10px 14px',
            background: '#eff6ff',
            border: '1px solid #93c5fd',
            color: '#1e3a8a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="small"><strong>{watchToast}</strong></span>
          <button type="button" className="btn-secondary small" onClick={() => setWatchToast(null)}>
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: Heart Rate & Medication Interaction Alerts */}
      {activeTab === 'heart' && (
        <div className="stack" style={{ gap: '12px' }}>
          <div className="row wrapRow" style={{ gap: '10px', alignItems: 'center' }}>
            <div className="row" style={{ gap: '6px' }}>
              <button
                type="button"
                className={hrActivityState === 'resting' ? 'btn small' : 'btn-secondary small'}
                onClick={() => setHrActivityState('resting')}
              >
                🛋️ {isAr ? 'وقت الراحة' : 'Resting'}
              </button>
              <button
                type="button"
                className={hrActivityState === 'active' ? 'btn small' : 'btn-secondary small'}
                onClick={() => setHrActivityState('active')}
              >
                🏃 {isAr ? 'بعد مجهود' : 'Active'}
              </button>
            </div>

            {bleSupported && (
              <button
                type="button"
                className="btn-secondary small"
                onClick={handleConnectBle}
                disabled={bleStatus === 'connecting'}
              >
                {bleStatus === 'connecting'
                  ? (isAr ? '⏳ جارٍ البحث بالبلوتوث...' : '⏳ Scanning BLE...')
                  : bleStatus === 'connected'
                    ? (isAr ? '🟢 متصل بالبلوتوث' : '🟢 BLE Connected')
                    : (isAr ? '📶 ربط نبض الساعة بالبلوتوث' : '📶 Connect Watch BLE')}
              </button>
            )}

            {isApk && (
              <button type="button" className="btn-secondary small" onClick={handleNativeBleScan}>
                🔗 {isAr ? 'مزامنة الصحة (Health Connect)' : 'Health Connect Sync'}
              </button>
            )}
          </div>

          {bleErrorMsg && (
            <p className="small" style={{ margin: 0, color: '#b45309' }}>
              {bleErrorMsg}
            </p>
          )}

          {/* 1-Second Manual Watch Entry (Works with Oraimo / Apple Watch / Huawei / All Watches) */}
          <form
            className="row wrapRow"
            style={{ gap: '8px', alignItems: 'center' }}
            onSubmit={(e) => {
              e.preventDefault();
              const val = Number(manualBpm);
              if (val >= 30 && val <= 240) {
                recordHeartRate(val, 'manual', state.hydration.connectedWatchName || 'Smartwatch');
                setManualBpm('');
              }
            }}
          >
            <input
              type="number"
              min={30}
              max={240}
              value={manualBpm}
              onChange={(e) => setManualBpm(e.target.value)}
              placeholder={isAr ? 'اكتب نبض الساعة الآن (مثلاً 72)' : 'Enter watch BPM (e.g. 72)'}
              style={{ flex: '1 1 180px', maxWidth: '260px' }}
              aria-label={isAr ? 'نبضات القلب من الساعة' : 'Watch heart rate BPM'}
            />
            <button type="submit" className="btn small">
              ❤️ {isAr ? 'فحص النبض مع أدويتي' : 'Check Pulse vs Meds'}
            </button>
          </form>

          {latestReading && (
            <div
              className="card stack"
              style={{
                padding: '12px 14px',
                border: `2px solid ${
                  latestReading.alertLevel === 'critical'
                    ? '#dc2626'
                    : latestReading.alertLevel === 'warning'
                      ? '#f59e0b'
                      : '#10b981'
                }`,
                background:
                  latestReading.alertLevel === 'critical'
                    ? '#fef2f2'
                    : latestReading.alertLevel === 'warning'
                      ? '#fffbeb'
                      : '#ecfdf5',
                color:
                  latestReading.alertLevel === 'critical'
                    ? '#991b1b'
                    : latestReading.alertLevel === 'warning'
                      ? '#92400e'
                      : '#065f46',
              }}
            >
              <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{isAr ? latestReading.alertTitleAr : latestReading.alertTitleEn}</strong>
                <span className="badge" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  {latestReading.bpm} BPM
                </span>
              </div>
              <p className="small" style={{ margin: 0 }}>
                {isAr ? latestReading.alertDetailAr : latestReading.alertDetailEn}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Smart Hydration Linked to Medications */}
      {activeTab === 'water' && (
        <div className="stack" style={{ gap: '12px' }}>
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>
                💧 {isAr ? `الهدف اليومي الذكي: ${waterGoal.targetMl} مل` : `Smart Daily Goal: ${waterGoal.targetMl} ml`}
              </strong>
              <div className="small muted">
                {isAr
                  ? `تم شرب ${state.hydration.consumedMl} مل من ${waterGoal.targetMl} مل (${waterPercent}%)`
                  : `Consumed ${state.hydration.consumedMl} ml of ${waterGoal.targetMl} ml (${waterPercent}%)`}
              </div>
            </div>
            <button
              type="button"
              className={state.hydration.enabled ? 'btn small' : 'btn-secondary small'}
              onClick={handleToggleHydration}
            >
              {state.hydration.enabled
                ? (isAr ? '🔔 منبه المياه للساعة مُفعّل' : '🔔 Watch Hydration Alerts ON')
                : (isAr ? '🔕 تفعيل منبه المياه للساعة' : '🔕 Enable Watch Hydration Alerts')}
            </button>
          </div>

          <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
            <div
              style={{
                width: `${waterPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7, #10b981)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn small" onClick={() => handleAddWaterCup(250)}>
              +250 {isAr ? 'مل (كوب ماء)' : 'ml (1 Cup)'}
            </button>
            <button type="button" className="btn-secondary small" onClick={() => handleAddWaterCup(500)}>
              +500 {isAr ? 'مل (زجاجة صغيرة)' : 'ml (Bottle)'}
            </button>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  hydration: {
                    ...prev.hydration,
                    intervalHours: prev.hydration.intervalHours === 1 ? 2 : prev.hydration.intervalHours === 2 ? 3 : 1,
                  },
                }))
              }
            >
              ⏱️ {isAr ? `كل ${state.hydration.intervalHours} ساعة` : `Every ${state.hydration.intervalHours}h`}
            </button>
          </div>

          {(isAr ? waterGoal.reasonsAr : waterGoal.reasonsEn).length > 0 && (
            <div className="small muted">
              {(isAr ? waterGoal.reasonsAr : waterGoal.reasonsEn).map((r, idx) => (
                <div key={idx}>• {r}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Oraimo & Smartwatch Setup */}
      {activeTab === 'watch' && (
        <div className="stack" style={{ gap: '10px' }}>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn small" onClick={handleTestWatchAlert}>
              ⌚ {isAr ? 'اختبار إرسال تنبيه للساعة الآن' : 'Send Test Alert to Watch Now'}
            </button>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => setShowOraimoGuide((v) => !v)}
            >
              📖 {isAr ? 'خطوات ربط ساعة Oraimo / Xiaomi' : 'Oraimo / Watch Setup Steps'}
            </button>
          </div>

          {(showOraimoGuide || !compact) && (
            <div className="card stack" style={{ padding: '12px', background: 'rgba(255,255,255,0.65)' }}>
              <strong>{isAr ? 'خطوات استقبال مواعيد الدواء والماء على ساعة أورايمو (Oraimo):' : 'Receive DAWAYA alerts on Oraimo & Smartwatches:'}</strong>
              <ol className="small" style={{ margin: '4px 0', paddingInlineStart: '20px' }}>
                <li>{isAr ? 'افتح تطبيق oraimo Health (أو تطبيق ساعتك) على الموبايل.' : 'Open oraimo Health (or your watch companion app).'}</li>
                <li>{isAr ? 'ادخل على الجهاز (Device) ← الإشعارات (Notifications / App Alerts).' : 'Go to Device → Notifications / App Alerts.'}</li>
                <li>{isAr ? 'فعّل تطبيق DAWAYA | دوايا (أو متصفح Chrome).' : 'Enable DAWAYA (or Chrome browser notifications).'}</li>
                <li>{isAr ? 'اضغط زر "اختبار إرسال تنبيه للساعة الآن" بالاعلى للتأكد من الاهتزاز على معصمك.' : 'Tap "Send Test Alert to Watch Now" above to confirm wrist vibration.'}</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
