import { SmartNativeSelect } from './SmartChoiceSelect';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export interface InhalerDeviceItem {
  id: string;
  tradeNameAr: string;
  tradeNameEn: string;
  genericName: string;
  totalPuffs: number;
  type: 'reliever_quick' | 'controller_daily' | 'nasal_spray';
  typeLabelAr: string;
  typeLabelEn: string;
  hasDoseCounterBuiltIn: boolean;
  warningsAr: string;
  warningsEn: string;
}

export const EGYPTIAN_INHALERS: InhalerDeviceItem[] = [
  {
    id: 'ventolin_evohaler',
    tradeNameAr: 'فنتولين إيفوهيلر 100 ميكروجرام (بخاخة زرقاء)',
    tradeNameEn: 'Ventolin Evohaler 100mcg',
    genericName: 'Salbutamol Sulfate',
    totalPuffs: 200,
    type: 'reliever_quick',
    typeLabelAr: 'موسع شعب سريع المفعول للأزمات الحادة',
    typeLabelEn: 'Short-Acting Bronchodilator (SABA)',
    hasDoseCounterBuiltIn: false,
    warningsAr: '🚨 لا تحتوي على عداد رقمي! رجّ العلبة لا يدل على وجود الدواء؛ غاز الدفع يخرج حتى بعد نفاد المادة الفعالة بالكامل!',
    warningsEn: 'No dose counter! Shaking the canister is misleading because propellant gas continues after medicine is empty.',
  },
  {
    id: 'seretide_evohaler',
    tradeNameAr: 'سيريتيد إيفوهيلر (بخاخة بنفسجي)',
    tradeNameEn: 'Seretide Evohaler',
    genericName: 'Fluticasone + Salmeterol',
    totalPuffs: 120,
    type: 'controller_daily',
    typeLabelAr: 'بخاخ وقائي يومي ممتد المفعول',
    typeLabelEn: 'Controller (ICS + LABA)',
    hasDoseCounterBuiltIn: false,
    warningsAr: 'يجب مضمضة وغسل الفم بالماء والبصق بعد كل استخدام لتفادي الفطريات البيضاء وبحة الصوت.',
    warningsEn: 'Rinse mouth and spit after use to prevent oral candidiasis.',
  },
  {
    id: 'symbicort_turbuhaler',
    tradeNameAr: 'سيمبيكورت تيربوهيلر (بودرة استنشاق)',
    tradeNameEn: 'Symbicort Turbuhaler',
    genericName: 'Budesonide + Formoterol',
    totalPuffs: 120,
    type: 'controller_daily',
    typeLabelAr: 'جهاز بودرة جافة وقائي وعلاجي',
    typeLabelEn: 'Dry Powder Inhaler (DPI)',
    hasDoseCounterBuiltIn: true,
    warningsAr: 'تحتوي على نافذة عداد؛ عندما تظهر العلامة الحمراء يتبقى 20 جرعة فقط.',
    warningsEn: 'Includes counter window; red mark indicates 20 doses remaining.',
  },
  {
    id: 'flixonase_nasal',
    tradeNameAr: 'فليكسوناز بخاخ أنف للحساسية والجيوب',
    tradeNameEn: 'Flixonase Nasal Spray',
    genericName: 'Fluticasone Propionate',
    totalPuffs: 120,
    type: 'nasal_spray',
    typeLabelAr: 'بخاخ أنف كورتيزوني موضعي للجيوب والرشح',
    typeLabelEn: 'Corticosteroid Nasal Spray',
    hasDoseCounterBuiltIn: false,
    warningsAr: 'استخدم البخاخ باتجاه جدار الأنف الخارجي بعيداً عن الحاجز الأنفي لتفادي النزيف.',
    warningsEn: 'Spray towards the outer ear away from the nasal septum to prevent epistaxis.',
  },
];

export default function InhalerDoseCounter() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedId, setSelectedId] = useState<string>('ventolin_evohaler');
  const [dailyPuffs, setDailyPuffs] = useState<number>(4); // e.g. 2 puffs twice daily
  const [openedDaysAgo, setOpenedDaysAgo] = useState<number>(15);

  const selectedInhaler = useMemo(
    () => EGYPTIAN_INHALERS.find((d) => d.id === selectedId) || EGYPTIAN_INHALERS[0],
    [selectedId]
  );

  const stats = useMemo(() => {
    const usedSoFar = dailyPuffs * openedDaysAgo;
    const remaining = Math.max(0, selectedInhaler.totalPuffs - usedSoFar);
    const daysLeft = dailyPuffs > 0 ? Math.floor(remaining / dailyPuffs) : 0;
    const isCriticalLow = remaining <= 20;
    const isEmpty = remaining === 0;

    return {
      usedSoFar,
      remaining,
      daysLeft,
      isCriticalLow,
      isEmpty,
    };
  }, [selectedInhaler, dailyPuffs, openedDaysAgo]);

  return (
    <main className="wrap stack" style={{ paddingTop: '10px' }}>
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #152E52 55%, #0284c7 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #CFD29D',
          boxShadow: '0 12px 34px rgba(13, 31, 56, 0.35)',
        }}
      >
        <div className="head" style={{ marginBottom: '8px' }}>
          <div>
            <span
              className="badge"
              style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800, marginBottom: '6px' }}
            >
              💨 {tr(lang, 'رادار أمان مرضى الحساسية والربو', 'Asthma & COPD Inhaler Dose Counter')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              🫁 {tr(lang, 'حاسبة الرصيد المتبقي لبخاخات الصدر والجيوب الأنفية', 'Inhaler Dose Counter & Depletion Tracker')}
            </h1>
          </div>
          <Link to="/green-prescription" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800 }}>
            🌿 {isAr ? 'تمارين التنفس والرعاية' : 'Breathing Care'}
          </Link>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'لا تتفاجأ ببخاخ فارغ أثناء أزمة الربو: معظم البخاخات في مصر بدون عداد رقمي، ورجّ العلبة خادع لأن غاز الدفع يستمر بعد نفاد الدواء! احسب رصيد البخات المتبقي وتاريخ شراء العبوة الجديدة بدقة.',
            'Never get caught with an empty inhaler during an asthma attack! Shaking the canister is misleading because gas continues after medicine empties. Calculate remaining active doses and exact refill dates.'
          )}
        </p>

        {/* Inhaler Selector */}
        <div className="calc-inputs-row" style={{ paddingTop: '10px', borderTop: '1px solid rgba(207, 210, 157, 0.25)' }}>
          <div className="field-group">
            <label className="small" style={{ color: '#CFD29D', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              💨 {isAr ? 'اختر نوع البخاخة:' : 'Select Inhaler Device:'}
            </label>
            <SmartNativeSelect
              className="select-input"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #CFD29D' }}
            >
              {EGYPTIAN_INHALERS.map((inh) => (
                <option key={inh.id} value={inh.id} style={{ color: '#000' }}>
                  {isAr ? inh.tradeNameAr : inh.tradeNameEn} ({inh.totalPuffs} بخة)
                </option>
              ))}
            </SmartNativeSelect>
          </div>

          <div className="field-group">
            <label className="small" style={{ color: '#CFD29D', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🔢 {isAr ? 'عدد البخات اليومية الموصوفة:' : 'Daily Puffs Taken:'}
            </label>
            <input
              type="number"
              min={1}
              max={16}
              value={dailyPuffs}
              onChange={(e) => setDailyPuffs(Math.max(1, Number(e.target.value)))}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #CFD29D' }}
            />
          </div>

          <div className="field-group">
            <label className="small" style={{ color: '#CFD29D', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              📅 {isAr ? 'بدأت استخدامها منذ كم يوماً؟' : 'Days in Use:'}
            </label>
            <input
              type="number"
              min={0}
              max={180}
              value={openedDaysAgo}
              onChange={(e) => setOpenedDaysAgo(Math.max(0, Number(e.target.value)))}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #CFD29D' }}
            />
          </div>
        </div>
      </section>

      {/* KPI Display */}
      <section
        className="card"
        style={{
          borderInlineStart: stats.isEmpty ? '6px solid #dc2626' : stats.isCriticalLow ? '6px solid #d97706' : '6px solid #138866',
          background: stats.isEmpty ? '#fef2f2' : stats.isCriticalLow ? '#fffbeb' : 'var(--card-bg)',
        }}
      >
        <div className="head" style={{ marginBottom: '10px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: stats.isEmpty ? '#991b1b' : stats.isCriticalLow ? '#92400e' : '#138866' }}>
              {stats.isEmpty
                ? (isAr ? '⛔ البخاخة فارغة من المادة الفعالة تماماً!' : 'Canister is completely empty!')
                : stats.isCriticalLow
                ? (isAr ? '⚠️ تنبيه: رصيد البخاخ منخفض جداً — اشترِ عبوة جديدة الآن!' : 'Critical low doses remaining!')
                : (isAr ? '✅ رصيد البخاخ متاح ويكفي علاجك' : 'Inhaler has sufficient doses')}
            </h2>
            <span className="small muted">
              {selectedInhaler.genericName} · {selectedInhaler.totalPuffs} {isAr ? 'بخة إجمالية' : 'total puffs'}
            </span>
          </div>

          <span
            className="badge"
            style={{
              background: stats.isEmpty ? '#dc2626' : stats.isCriticalLow ? '#d97706' : '#138866',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 800,
              padding: '6px 14px',
            }}
          >
            {stats.remaining} {isAr ? 'بخة متبقية' : 'puffs left'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--tint)' }}>
            <span className="small muted">{isAr ? 'البخات المستهلكة:' : 'Puffs Used:'}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.usedSoFar} {isAr ? 'بخة' : 'puffs'}</div>
          </div>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--tint)' }}>
            <span className="small muted">{isAr ? 'الأيام المتبقية حتى النفاد:' : 'Days Remaining:'}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stats.daysLeft <= 5 ? '#dc2626' : '#0D1F38' }}>
              {stats.daysLeft} {isAr ? 'يوماً تقريباً' : 'days approx'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
          <p className="small" style={{ margin: 0, color: '#92400e', fontWeight: 600 }}>
            {isAr ? selectedInhaler.warningsAr : selectedInhaler.warningsEn}
          </p>
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
