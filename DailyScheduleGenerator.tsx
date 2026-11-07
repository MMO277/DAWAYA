import SmartDoseAlarmCard from './SmartDoseAlarmCard';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';
import Disclaimer from './Disclaimer';
import {
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';

export type IntervalHours = 24 | 12 | 8 | 6;
export type MealInstructionKey =
  | 'after_meal'
  | 'empty_stomach'
  | 'with_water_upright'
  | 'no_dairy_iron'
  | 'anytime';

export interface ScheduleMedRow {
  id: string;
  name: string;
  doseText: string;
  intervalHours: IntervalHours;
  mealRule: MealInstructionKey;
  durationDays: number;
  color: string;
}

const ROW_COLORS = ['#00BFD0', '#15803d', '#4f46e5', '#d97706', '#be123c'];

const MEAL_RULE_LABELS: Record<MealInstructionKey, Bi> = {
  after_meal: {
    ar: '🍽️ بعد الأكل مباشرة (لتقليل اضطرابات المعدة)',
    en: '🍽️ Immediately after a meal (reduces stomach upset)',
  },
  empty_stomach: {
    ar: '⏳ على معدة فارغة (قبل الأكل بنصف ساعة أو ساعة)',
    en: '⏳ Empty stomach (30-60 min before food)',
  },
  with_water_upright: {
    ar: '💧 مع كوب ماء كامل وعدم الاستلقاء لمدة 30 دقيقة',
    en: '💧 With a full glass of water; stay upright 30 min',
  },
  no_dairy_iron: {
    ar: '🥛🚫 افصل ساعتين عن الحليب والحديد والكالسيوم',
    en: '🥛🚫 Separate by 2h from dairy, iron, calcium & antacids',
  },
  anytime: {
    ar: '🕒 في الموعد المحدد (مع الطعام أو بدونه)',
    en: '🕒 At scheduled time (with or without food)',
  },
};

interface PresetMedTemplate {
  labelAr: string;
  labelEn: string;
  doseAr: string;
  doseEn: string;
  intervalHours: IntervalHours;
  mealRule: MealInstructionKey;
  durationDays: number;
}

const PRESET_TEMPLATES: PresetMedTemplate[] = [
  {
    labelAr: 'كونكور 5 مجم للضغط والقلب (Concor 5mg)',
    labelEn: 'Concor 5mg (Bisoprolol)',
    doseAr: 'قرص واحد صباحاً',
    doseEn: '1 Tablet Daily',
    intervalHours: 24,
    mealRule: 'anytime',
    durationDays: 14,
  },
  {
    labelAr: 'جلوكوفاج 1000 مجم للسكري (Glucophage 1000mg)',
    labelEn: 'Glucophage 1000mg (Metformin)',
    doseAr: 'قرص واحد',
    doseEn: '1 Tablet',
    intervalHours: 12,
    mealRule: 'after_meal',
    durationDays: 14,
  },
  {
    labelAr: 'كونترولوك 40 مجم للمعدة (Controloc 40mg)',
    labelEn: 'Controloc 40mg (Pantoprazole)',
    doseAr: 'قرص واحد قبل الإفطار',
    doseEn: '1 Tablet before breakfast',
    intervalHours: 24,
    mealRule: 'empty_stomach',
    durationDays: 14,
  },
  {
    labelAr: 'بنادول أدفانس 500 مجم مسكن (Panadol Advance)',
    labelEn: 'Panadol Advance 500mg',
    doseAr: 'قرص إلى قرصين',
    doseEn: '1-2 Tablets',
    intervalHours: 8,
    mealRule: 'anytime',
    durationDays: 5,
  },
  {
    labelAr: 'أوجمنتين / هاي بيوتك 1 جم (Augmentin 1g)',
    labelEn: 'Augmentin / Hibiotic 1g',
    doseAr: 'قرص واحد (1 جم)',
    doseEn: '1 Tablet (1g)',
    intervalHours: 12,
    mealRule: 'after_meal',
    durationDays: 7,
  },
  {
    labelAr: 'زيرتك 10 مجم للحساسية (Zyrtec 10mg)',
    labelEn: 'Zyrtec 10mg (Cetirizine)',
    doseAr: 'قرص واحد مساءً',
    doseEn: '1 Tablet at night',
    intervalHours: 24,
    mealRule: 'anytime',
    durationDays: 7,
  },
];

function formatHour12(hour24: number, isAr: boolean): string {
  const normalized = ((hour24 % 24) + 24) % 24;
  const periodAr = normalized < 12 ? 'صباحاً' : 'مساءً';
  const periodEn = normalized < 12 ? 'AM' : 'PM';
  const h12 = normalized % 12 === 0 ? 12 : normalized % 12;
  const padded = String(h12).padStart(2, '0') + ':00';
  return isAr ? `${padded} ${periodAr}` : `${padded} ${periodEn}`;
}

function getTimeOfDayBadge(hour24: number, isAr: boolean): { icon: string; label: string } {
  const h = ((hour24 % 24) + 24) % 24;
  if (h >= 5 && h < 12) return { icon: '🌅', label: isAr ? 'الصباح' : 'Morning' };
  if (h >= 12 && h < 17) return { icon: '☀️', label: isAr ? 'الظهيرة' : 'Afternoon' };
  if (h >= 17 && h < 21) return { icon: '🌆', label: isAr ? 'المساء' : 'Evening' };
  return { icon: '🌙', label: isAr ? 'الليل' : 'Night' };
}

function computeDoseHours(wakeHour: number, interval: IntervalHours): number[] {
  const count = 24 / interval;
  const hours: number[] = [];
  for (let i = 0; i < count; i++) {
    hours.push((wakeHour + i * interval) % 24);
  }
  return hours;
}

export default function DailyScheduleGenerator() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [sp] = useSearchParams();
  const medParam = sp.get('med') || '';
  const { indexItems } = useDawayaDrugDatabase();

  const [patientName, setPatientName] = useState<string>('');
  const [wakeHour, setWakeHour] = useState<number>(8);
  const [copiedMsg, setCopiedMsg] = useState<string>('');
  const [dawayaSearchQ, setDawayaSearchQ] = useState<string>('');

  const dawayaMatches = useMemo(() => {
    if (!dawayaSearchQ.trim()) return [];
    return searchDawayaIndex(indexItems, { query: dawayaSearchQ }, isAr).slice(0, 6);
  }, [dawayaSearchQ, indexItems, isAr]);

  const [rows, setRows] = useState<ScheduleMedRow[]>(() => [
    {
      id: 'row-1',
      name: medParam || (isAr ? 'كونكور 5 مجم أقراص (Concor 5mg)' : 'Concor 5mg Tablets'),
      doseText: isAr ? 'قرص واحد' : '1 Tablet',
      intervalHours: 12,
      mealRule: 'after_meal',
      durationDays: 7,
      color: ROW_COLORS[0],
    },
  ]);

  const addMedicationRow = (preset?: PresetMedTemplate) => {
    setRows((prev) => {
      const nextIdx = prev.length;
      const color = ROW_COLORS[nextIdx % ROW_COLORS.length];
      return [
        ...prev,
        {
          id: `row-${Date.now()}-${nextIdx}`,
          name: preset ? (isAr ? preset.labelAr : preset.labelEn) : '',
          doseText: preset ? (isAr ? preset.doseAr : preset.doseEn) : isAr ? 'قرص واحد' : '1 Tablet',
          intervalHours: preset ? preset.intervalHours : 12,
          mealRule: preset ? preset.mealRule : 'after_meal',
          durationDays: preset ? preset.durationDays : 7,
          color,
        },
      ];
    });
  };

  const updateRow = (id: string, patch: Partial<ScheduleMedRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const validRows = useMemo(
    () => rows.filter((r) => r.name.trim().length > 0),
    [rows]
  );

  // Build WhatsApp share text
  const whatsappShareText = useMemo(() => {
    const header = isAr
      ? `📅 *جدول مواعيد الأدوية اليومي (دوايا | DAWAYA)*${patientName.trim() ? ` — ${patientName.trim()}` : ''}\n━━━━━━━━━━━━━━`
      : `📅 *Daily Medication Schedule (DAWAYA)*${patientName.trim() ? ` — ${patientName.trim()}` : ''}\n━━━━━━━━━━━━━━`;

    const lines = validRows.map((r, idx) => {
      const hours = computeDoseHours(wakeHour, r.intervalHours)
        .map((h) => formatHour12(h, isAr))
        .join('  |  ');
      const mealText = pick(MEAL_RULE_LABELS[r.mealRule], lang);
      return isAr
        ? `${idx + 1}. 💊 *${r.name}* (${r.doseText} — كل ${r.intervalHours} ساعة لمدة ${r.durationDays} أيام)\n   ⏰ المواعيد: ${hours}\n   📌 التعليمات: ${mealText}`
        : `${idx + 1}. 💊 *${r.name}* (${r.doseText} — q${r.intervalHours}h for ${r.durationDays} days)\n   ⏰ Times: ${hours}\n   📌 Note: ${mealText}`;
    });

    const footer = isAr
      ? `\n✅ تذكير: التزم بمواعيد أدويتك اليومية بدقة وحسب إرشادات الطبيب أو الصيدلي.\n🔗 منصة دوايا | DAWAYA — صحتك.. بذكاء أكتر.`
      : `\n✅ Reminder: Follow your daily medication schedule as directed by your physician or pharmacist.\n🔗 DAWAYA — Your Health. Smarter.`;

    return [header, ...lines, footer].join('\n\n');
  }, [validRows, patientName, wakeHour, isAr, lang]);

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappShareText);
      setCopiedMsg(tr(lang, 'تم نسخ الجدول بنجاح! ✓', 'Schedule copied! ✓'));
      window.setTimeout(() => setCopiedMsg(''), 3000);
    } catch {
      setCopiedMsg(tr(lang, 'اضغط مشاركة واتساب للإرسال مباشرة', 'Use WhatsApp button to share'));
    }
  };

  const handleDownloadPngImage = () => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const rowHeight = 148;
    const headerHeight = 165;
    const footerHeight = 95;
    const height = headerHeight + Math.max(1, validRows.length) * rowHeight + footerHeight;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, width, headerHeight);
    grad.addColorStop(0, '#101E36');
    grad.addColorStop(1, '#00BFD0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.direction = isAr ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    const titleStr = isAr
      ? `📅 جدول مواعيد الأدوية اليومي (دوايا)${patientName.trim() ? ` — ${patientName.trim()}` : ''}`
      : `📅 Daily Medication Schedule (DAWAYA)${patientName.trim() ? ` — ${patientName.trim()}` : ''}`;
    ctx.fillText(titleStr, width / 2, 68);

    ctx.fillStyle = '#cffafe';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    const subStr = isAr
      ? 'التزم بالمواعيد المحددة بالساعة وإرشادات الطعام لضمان أقصى استفادة علاجية وأمان دوائي'
      : 'Follow exact clock intervals and meal instructions for optimal therapeutic safety';
    ctx.fillText(subStr, width / 2, 115);

    validRows.forEach((r, idx) => {
      const y = headerHeight + idx * rowHeight + 16;
      const cardH = rowHeight - 22;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(36, y, width - 72, cardH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = r.color;
      ctx.beginPath();
      if (isAr) {
        ctx.roundRect(width - 48, y, 12, cardH, [0, 16, 16, 0]);
      } else {
        ctx.roundRect(36, y, 12, cardH, [16, 0, 0, 16]);
      }
      ctx.fill();

      ctx.textAlign = isAr ? 'right' : 'left';
      const textX = isAr ? width - 70 : 68;

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 25px system-ui, -apple-system, sans-serif';
      const medHeading = isAr
        ? `💊 ${r.name}  (${r.doseText} — كل ${r.intervalHours} ساعة لمدة ${r.durationDays} أيام)`
        : `💊 ${r.name}  (${r.doseText} — every ${r.intervalHours}h for ${r.durationDays} days)`;
      ctx.fillText(medHeading, textX, y + 42);

      const hoursStr = computeDoseHours(wakeHour, r.intervalHours)
        .map((h) => formatHour12(h, isAr))
        .join('   |   ');
      ctx.fillStyle = r.color;
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(`⏰ ${isAr ? 'المواعيد:' : 'Times:'}  ${hoursStr}`, textX, y + 80);

      ctx.fillStyle = '#475569';
      ctx.font = '19px system-ui, -apple-system, sans-serif';
      ctx.fillText(pick(MEAL_RULE_LABELS[r.mealRule], lang), textX, y + 112);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      isAr
        ? '✅ التزم بجدول أدويتك اليومي ولا تغير الجرعات إلا باستشارة الطبيب أو الصيدلي | منصة دوايا DAWAYA'
        : '✅ Follow your daily medication schedule and consult your doctor or pharmacist | DAWAYA',
      width / 2,
      height - 38
    );

    const link = document.createElement('a');
    link.download = 'dawaya-daily-medication-schedule.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <main className="wrap stack">
      <SmartDoseAlarmCard />
      <section className="card no-print schedule-gen-hero">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, marginBottom: '8px' }}>
              📅 {tr(lang, 'تنظيم مواعيد جميع الأدوية المزمنة واليومية (26,562+ دواء)', 'Printable & WhatsApp Daily Schedule Generator (26,562+ Drugs)')}
            </span>
            <h1 style={{ margin: '4px 0 8px' }}>
              {tr(
                lang,
                'مولّد جدول الجرعات اليومي الذكي لجميع الأدوية (صورة PNG، واتساب، وطباعة A4)',
                'Smart Daily Medication Schedule Generator (PNG Image, WhatsApp & A4 Print)'
              )}
            </h1>
            <p className="muted" style={{ maxWidth: '74ch', margin: 0 }}>
              {tr(
                lang,
                'ابحث وأضف أي دواء من قاعدة أدوية السوق المصري (26,562+ مستحضر للضغط، السكري، المعدة، المسكنات، الفيتامينات، أو المضادات) لحساب مواعيده بالساعة وتصديره كصورة أو عبر واتساب.',
                'Search and add any medication from the 26,562 Egyptian drug database to calculate exact clock intervals and export as a high-res PNG, WhatsApp message, or printed chart.'
              )}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/prescription-radar" className="btn ghost small">
              📡 {tr(lang, 'رادار الروشتة 24س', 'Rx Radar 24h')}
            </Link>
            <Link to="/tracker" className="btn ghost small">
              ⏱️ {tr(lang, 'متابع الجرعات التفاعلي', 'Dose Tracker')}
            </Link>
          </div>
        </div>

        {/* Patient Name & Wake-up Time */}
        <div className="schedule-routine-bar">
          <div style={{ flex: '1 1 240px' }}>
            <label htmlFor="sched-patient-name" className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '5px' }}>
              👤 {tr(lang, 'اسم المريض (اختياري لطباعته على الجدول):', 'Patient Name (optional for header):')}
            </label>
            <input
              id="sched-patient-name"
              type="text"
              className="input"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={tr(lang, 'مثال: أ. محمد أحمد / الوالدة...', 'e.g., Ahmed / Mom...')}
            />
          </div>

          <div style={{ flex: '1 1 220px' }}>
            <label htmlFor="sched-wake-hour" className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '5px' }}>
              🌅 {tr(lang, 'موعد الاستيقاظ وأول جرعة صباحية:', 'Wake-up & First Morning Dose Time:')}
            </label>
            <select
              id="sched-wake-hour"
              className="input"
              value={wakeHour}
              onChange={(e) => setWakeHour(Number(e.target.value))}
            >
              {[6, 7, 8, 9, 10, 11, 12].map((h) => (
                <option key={h} value={h}>
                  {formatHour12(h, isAr)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live 26,562 DAWAYA Medicine Search to Add Directly */}
        <div style={{ marginTop: '14px' }}>
          <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>
            🔍 {tr(lang, 'ابحث وأضف أي دواء من قاعدة بيانات دوايا (26,562+ دواء):', 'Search & Add Any Medicine from DAWAYA Database (26,562+):')}
          </label>
          <input
            type="search"
            value={dawayaSearchQ}
            onChange={(e) => setDawayaSearchQ(e.target.value)}
            placeholder={tr(lang, 'اكتب اسم الدواء بالعربية أو الإنجليزية أو المادة الفعالة لإضافته للجدول...', 'Type medicine brand or active ingredient to add to schedule...')}
          />
          {dawayaMatches.length > 0 && (
            <div className="row wrapRow" style={{ gap: '8px', marginTop: '8px' }}>
              {dawayaMatches.map((it) => (
                <button
                  key={it.i}
                  type="button"
                  className="chip"
                  onClick={() => {
                    addMedicationRow({
                      labelAr: `${it.a || it.n} (${it.s})`,
                      labelEn: `${it.n} (${it.s})`,
                      doseAr: /syrup|susp|شراب|معلق/i.test(`${it.n} ${it.f}`) ? '5 مل (ملعقة/سرنجة)' : 'قرص واحد',
                      doseEn: /syrup|susp/i.test(`${it.n} ${it.f}`) ? '5 mL' : '1 Tablet',
                      intervalHours: 12,
                      mealRule: 'after_meal',
                      durationDays: 7,
                    });
                    setDawayaSearchQ('');
                  }}
                >
                  ➕ {isAr ? it.a || it.n : it.n} ({it.s})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick-Add Presets */}
        <div style={{ marginTop: '12px' }}>
          <span className="small muted" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            ⚡ {tr(lang, 'إضافة سريعة لأشهر الأدوية اليومية والمزمنة:', 'Quick-add common daily medications:')}
          </span>
          <div className="row wrapRow" style={{ gap: '6px' }}>
            {PRESET_TEMPLATES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="chip cost-quick-chip"
                onClick={() => addMedicationRow(preset)}
              >
                <span>＋ {isAr ? preset.labelAr.split(' (')[0] : preset.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editable Medication Rows */}
        <div className="stack" style={{ gap: '10px', marginTop: '14px' }}>
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="schedule-edit-row"
              style={{ borderInlineStart: `4px solid ${row.color}` }}
            >
              <div className="schedule-row-field name-col">
                <label className="small muted">{tr(lang, `اسم الدواء #${idx + 1}`, `Medication #${idx + 1}`)}</label>
                <input
                  type="text"
                  className="input"
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  placeholder={tr(lang, 'اكتب اسم الدواء...', 'Enter drug name...')}
                />
              </div>

              <div className="schedule-row-field dose-col">
                <label className="small muted">{tr(lang, 'مقدار الجرعة', 'Dose Amount')}</label>
                <input
                  type="text"
                  className="input"
                  value={row.doseText}
                  onChange={(e) => updateRow(row.id, { doseText: e.target.value })}
                  placeholder={tr(lang, 'قرص / 5 مل...', '1 tab / 5 mL...')}
                />
              </div>

              <div className="schedule-row-field interval-col">
                <label className="small muted">{tr(lang, 'التكرار اليومي', 'Frequency')}</label>
                <select
                  className="input"
                  value={row.intervalHours}
                  onChange={(e) => updateRow(row.id, { intervalHours: Number(e.target.value) as IntervalHours })}
                >
                  <option value={24}>{tr(lang, 'كل 24 ساعة (مرة يومياً)', 'Every 24h (Once daily)')}</option>
                  <option value={12}>{tr(lang, 'كل 12 ساعة (مرتين يومياً)', 'Every 12h (Twice daily)')}</option>
                  <option value={8}>{tr(lang, 'كل 8 ساعات (3 مرات يومياً)', 'Every 8h (3x daily)')}</option>
                  <option value={6}>{tr(lang, 'كل 6 ساعات (4 مرات يومياً)', 'Every 6h (4x daily)')}</option>
                </select>
              </div>

              <div className="schedule-row-field meal-col">
                <label className="small muted">{tr(lang, 'تعليمات الأكل والامتصاص', 'Meal & Absorption Rule')}</label>
                <select
                  className="input"
                  value={row.mealRule}
                  onChange={(e) => updateRow(row.id, { mealRule: e.target.value as MealInstructionKey })}
                >
                  {(Object.keys(MEAL_RULE_LABELS) as MealInstructionKey[]).map((k) => (
                    <option key={k} value={k}>
                      {pick(MEAL_RULE_LABELS[k], lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="schedule-row-field days-col">
                <label className="small muted">{tr(lang, 'مدة الكورس / المتابعة', 'Duration')}</label>
                <select
                  className="input"
                  value={row.durationDays}
                  onChange={(e) => updateRow(row.id, { durationDays: Number(e.target.value) })}
                >
                  {[3, 5, 7, 10, 14, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} {tr(lang, 'أيام', 'days')}
                    </option>
                  ))}
                </select>
              </div>

              {rows.length > 1 && (
                <button
                  type="button"
                  className="btn ghost small schedule-del-btn"
                  onClick={() => removeRow(row.id)}
                  title={tr(lang, 'حذف هذا الدواء', 'Remove medication')}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '10px' }}>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => addMedicationRow()}
          >
            ➕ {tr(lang, 'إضافة دواء آخر للجدول', 'Add Another Medication')}
          </button>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn small"
              style={{ background: '#00BFD0' }}
              onClick={handleDownloadPngImage}
            >
              📥 {tr(lang, 'تحميل الجدول كصورة (PNG)', 'Download Image (PNG)')}
            </button>
            <button
              type="button"
              className="btn small"
              style={{ background: '#16a34a' }}
              onClick={handleShareWhatsApp}
            >
              📲 {tr(lang, 'مشاركة عبر واتساب', 'Share on WhatsApp')}
            </button>
            <button
              type="button"
              className="btn ghost small"
              onClick={handleCopyText}
            >
              📋 {tr(lang, 'نسخ نص الجدول', 'Copy Text')}
            </button>
            <button
              type="button"
              className="btn small"
              style={{ background: '#101E36' }}
              onClick={() => window.print()}
            >
              🖨️ {tr(lang, 'طباعة الجدول (A4)', 'Print Schedule')}
            </button>
          </div>
        </div>
        {copiedMsg && (
          <p className="small" style={{ color: '#15803d', fontWeight: 700, margin: '6px 0 0' }}>
            {copiedMsg}
          </p>
        )}
      </section>

      {/* Printable & Visual Daily Schedule Poster */}
      <section className="card printable-treatment-report daily-schedule-poster">
        <div className="schedule-poster-header">
          <div>
            <h2 style={{ margin: 0 }}>
              📅 {tr(lang, 'جدول مواعيد الأدوية اليومي المنسق (دوايا | DAWAYA)', 'Personalized Daily Medication Schedule (DAWAYA)')}
              {patientName.trim() ? ` — ${patientName.trim()}` : ''}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {tr(
                lang,
                'علّق هذا الجدول في مكان واضح بالمنزل أو احفظه على هاتفك وضع علامة (✓) أمام كل يوم بعد إتمام الجرعات:',
                'Keep this chart visible on your phone or fridge and check off each completed day:'
              )}
            </p>
          </div>
          <span className="badge" style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700 }}>
            ⏰ {tr(lang, `يبدأ من ${formatHour12(wakeHour, isAr)}`, `Starts at ${formatHour12(wakeHour, isAr)}`)}
          </span>
        </div>

        <div className="stack" style={{ gap: '12px', marginTop: '14px' }}>
          {validRows.map((row) => {
            const hours = computeDoseHours(wakeHour, row.intervalHours);
            return (
              <div
                key={row.id}
                className="schedule-poster-card"
                style={{ borderInlineStart: `5px solid ${row.color}` }}
              >
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: row.color }}>
                      💊 {row.name}
                    </h3>
                    <span className="small muted">
                      {row.doseText} · {tr(lang, `كل ${row.intervalHours} ساعة`, `Every ${row.intervalHours} hours`)} ·{' '}
                      {tr(lang, `لمدة ${row.durationDays} أيام`, `For ${row.durationDays} days`)}
                    </span>
                  </div>
                  <span className="badge" style={{ background: `${row.color}18`, color: row.color, fontWeight: 700 }}>
                    {pick(MEAL_RULE_LABELS[row.mealRule], lang)}
                  </span>
                </div>

                <div className="schedule-clock-slots">
                  {hours.map((h, hIdx) => {
                    const badge = getTimeOfDayBadge(h, isAr);
                    return (
                      <div key={hIdx} className="schedule-clock-pill">
                        <span className="clock-period-icon" aria-hidden="true">{badge.icon}</span>
                        <div>
                          <span className="clock-period-lbl">{badge.label}</span>
                          <strong className="clock-time-val">{formatHour12(h, isAr)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="schedule-days-checkstrip">
                  <span className="small muted" style={{ fontWeight: 700 }}>
                    ☑️ {tr(lang, 'متابعة أيام العلاج:', 'Day Check-off:')}
                  </span>
                  <div className="row wrapRow" style={{ gap: '6px' }}>
                    {Array.from({ length: Math.min(row.durationDays, 14) }).map((_, dIdx) => (
                      <span key={dIdx} className="schedule-day-box">
                        ☐ {tr(lang, `يوم ${dIdx + 1}`, `Day ${dIdx + 1}`)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="report-disclaimer-box" style={{ marginTop: '14px' }}>
          <strong>
            ⚠️ {tr(lang, 'قاعدة ذهبية للأمان الدوائي:', 'Golden Rule of Medication Safety:')}
          </strong>{' '}
          {tr(
            lang,
            'التزم بمواعيد أدويتك اليومية بدقة ولا توقف أي دواء مزمن أو كورس علاجي من تلقاء نفسك دون استشارة الطبيب أو الصيدلي.',
            'Follow your daily schedule consistently and never stop prescribed medications without consulting your physician or pharmacist.'
          )}
        </div>
      </section>

      <div className="no-print">
        <Disclaimer />
      </div>
    </main>
  );
}
