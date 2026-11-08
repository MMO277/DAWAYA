import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';
import {
  findDawayaIndexItemSync,
  searchDawayaIndex,
  useDawayaDrugDatabase,
  DawayaCompactIndexItem,
} from './dawayaDrugDatabaseService';
import { DosageFormVectorBadge } from './DawayaVectorIcons';

export interface FastingMedRow {
  id: string;
  name: string;
  standardFrequency: string; // 'once_daily' | 'twice_daily' | 'thrice_daily'
  ramadanTiming: 'iftar' | 'suhur' | 'split_iftar_suhur' | 'night_midway';
  ramadanInstructionsAr: string;
  ramadanInstructionsEn: string;
  fastingSafety: 'safe' | 'caution' | 'contraindicated';
}

const DEFAULT_RAMADAN_MEDS: FastingMedRow[] = [
  {
    id: 'concor_5',
    name: 'كونكور 5 مجم (بيسوبرولول - للضغط والقلب)',
    standardFrequency: 'once_daily',
    ramadanTiming: 'iftar',
    ramadanInstructionsAr: 'يُؤخذ بعد وجبة الإفطار الرئيسية (وليس على الريق مباشرة مع التمر أو العصير) لتفادي الهبوط المفاجئ في ضغط الدم.',
    ramadanInstructionsEn: 'Take immediately after the main Iftar meal (not on an empty stomach) to prevent sudden hypotension.',
    fastingSafety: 'safe',
  },
  {
    id: 'glucophage_1000',
    name: 'جلوكوفاج 1000 مجم (ميتفورمين - لتنظيم السكر)',
    standardFrequency: 'twice_daily',
    ramadanTiming: 'split_iftar_suhur',
    ramadanInstructionsAr: 'الجرعة الأولى مع الإفطار كاملة، وجرعة السحور تُقلل أو تؤخذ كاملة حسب توجيه طبيب السكر لمنع هبوط السكر أثناء ساعات النهار.',
    ramadanInstructionsEn: 'Full dose with Iftar. Suhur dose adjusted per physician advice to prevent daytime hypoglycemia.',
    fastingSafety: 'caution',
  },
  {
    id: 'controloc_40',
    name: 'كونترولوك 40 مجم (بانتوبرازول - لحموضة وقرحة المعدة)',
    standardFrequency: 'once_daily',
    ramadanTiming: 'iftar',
    ramadanInstructionsAr: 'يُؤخذ مع الإفطار قبل تناول الوجبة الثقيلة بـ 20 دقيقة، أو قبل وجبة السحور مباشرة لمنع ارتجاع المريء أثناء النوم.',
    ramadanInstructionsEn: 'Take 20-30 minutes before Iftar meal or right before Suhur to prevent nocturnal GERD.',
    fastingSafety: 'safe',
  },
  {
    id: 'lasix_40',
    name: 'لازيكس 40 مجم (فوروسيميد - مدر للبول)',
    standardFrequency: 'once_daily',
    ramadanTiming: 'iftar',
    ramadanInstructionsAr: '⚠️ تحذير حاسم: ممنوع نهائياً في وجبة السحور لتفادي الجفاف الشديد وهبوط الدورة الدموية نهاراً! يُؤخذ بعد الإفطار بساعتين مع شرب ماء كافٍ.',
    ramadanInstructionsEn: '⚠️ NEVER take at Suhur to prevent severe daytime dehydration! Take 2 hours after Iftar with adequate fluids.',
    fastingSafety: 'caution',
  },
];

export default function RamadanFastingClock() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { indexItems } = useDawayaDrugDatabase();

  const [meds, setMeds] = useState<FastingMedRow[]>(DEFAULT_RAMADAN_MEDS);
  const [searchQ, setSearchQ] = useState('');
  const [selectedTimingFilter, setSelectedTimingFilter] = useState<'all' | 'iftar' | 'suhur' | 'split_iftar_suhur'>('all');

  const searchResults = useMemo(() => {
    const q = searchQ.trim();
    if (!q || q.length < 2) return [];
    return searchDawayaIndex(indexItems, { query: q }, isAr).slice(0, 6);
  }, [searchQ, indexItems, isAr]);

  const handleAddMed = (item: DawayaCompactIndexItem) => {
    const isDiuretic = /furosemide|lasix|لازيكس|مدر/i.test(`${item.n} ${item.a} ${item.g}`);
    const isDiabetes = item.k === 'endocrine_diabetes' || /insulin|metformin|glimepiride/i.test(`${item.n} ${item.a} ${item.g}`);

    const newRow: FastingMedRow = {
      id: item.i,
      name: isAr ? `${item.a || item.n} (${item.s})` : `${item.n} (${item.s})`,
      standardFrequency: 'once_daily',
      ramadanTiming: isDiuretic ? 'iftar' : isDiabetes ? 'split_iftar_suhur' : 'iftar',
      ramadanInstructionsAr: isDiuretic
        ? 'يُؤخذ بعد الإفطار بساعتين مع تعويض السوائل. ممنوع تماماً في السحور.'
        : isDiabetes
        ? 'اضبط جرعة السحور مع طبيب السكر المعالج وافحص السكر فوراً لو شعرت بدوخة أو تعرق بارد.'
        : 'يُؤخذ بعد وجبة الإفطار أو السحور حسب استشارة الطبيب مع تجنب أخذ الأدوية على الريق.',
      ramadanInstructionsEn: isDiuretic
        ? 'Take 2 hours after Iftar. Strictly avoid at Suhur.'
        : 'Adjust dose with endocrinologist and break fast immediately if hypoglycemia occurs.',
      fastingSafety: isDiuretic || isDiabetes ? 'caution' : 'safe',
    };

    setMeds((prev) => [...prev, newRow]);
    setSearchQ('');
  };

  const handleRemove = (id: string) => {
    setMeds((prev) => prev.filter((m) => m.id !== id));
  };

  const filteredMeds = useMemo(() => {
    if (selectedTimingFilter === 'all') return meds;
    return meds.filter((m) => m.ramadanTiming === selectedTimingFilter);
  }, [meds, selectedTimingFilter]);

  return (
    <main className="wrap stack" style={{ paddingTop: '10px' }}>
      {/* Hero Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #152E52 55%, #138866 100%)',
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
              🌙 {tr(lang, 'خدمة حصرية لصيام رمضان والنوافل', 'Fasting & Ramadan Medical Clock')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              🕌 {tr(lang, 'رادار أمان مواعيد الدواء أثناء الصيام (Ramadan Safe-Clock)', 'Ramadan Medication Safe-Clock')}
            </h1>
          </div>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'أعد ترتيب جدول أدويتك اليومية تلقائياً بين أذان المغرب والسحور بأمان تام، مع تنبيهات لتجنب هبوط السكر المفاجئ وجفاف الكلى مع مدرات البول.',
            'Safely rearrange your daily medication schedule between Iftar and Suhur, with clinical alerts to avoid daytime dehydration and dangerous hypoglycemic drops.'
          )}
        </p>

        {/* 4 Golden Fasting Rules */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(207, 210, 157, 0.25)',
          }}
        >
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)' }}>
            <b style={{ color: '#CFD29D' }}>🌅 1. عند أذان المغرب:</b>
            <p className="small" style={{ margin: '2px 0 0', opacity: 0.9 }}>
              {isAr ? 'لا تأخذ أدوية الضغط أو المسكنات على الريق مباشرة، افطر بتمر وماء ثم تناول الدواء بعد الوجبة.' : 'Avoid taking NSAIDs or BP meds on an empty stomach at Iftar.'}
            </p>
          </div>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)' }}>
            <b style={{ color: '#CFD29D' }}>💧 2. مدرات البول (لازيكس):</b>
            <p className="small" style={{ margin: '2px 0 0', opacity: 0.9 }}>
              {isAr ? 'ممنوعة في السحور لتفادي الجفاف. تُؤخذ بعد الإفطار بساعتين.' : 'Never take diuretics at Suhur to prevent severe daytime dehydration.'}
            </p>
          </div>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)' }}>
            <b style={{ color: '#CFD29D' }}>🩸 3. قياس السكر لا يفطر:</b>
            <p className="small" style={{ margin: '2px 0 0', opacity: 0.9 }}>
              {isAr ? 'شكّة قياس السكر بالدم لا تبطل الصيام شرعاً، وافطر فوراً لو قل السكر عن 70 مجم/دل.' : 'Finger-prick blood glucose check does not break fast. Break fast if blood sugar drops below 70 mg/dL.'}
            </p>
          </div>
        </div>
      </section>

      {/* Add Medicine to Ramadan Schedule */}
      <section className="card" style={{ position: 'relative' }}>
        <b style={{ display: 'block', marginBottom: '6px', fontSize: '0.96rem', color: 'var(--navy)' }}>
          ➕ {tr(lang, 'أضف أي دواء من أدويتك لجدول الصيام (ابحث في 26,572 دواء):', 'Add any medication to your Ramadan fasting schedule:')}
        </b>
        <input
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={tr(lang, 'ابحث بالاسم (مثال: كونكور، جلوكوفاج، كونترولوك، لازيكس، أوجمنتين)...', 'Search medicine name...')}
        />
        {searchResults.length > 0 && (
          <div
            className="cost-search-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              insetInline: 0,
              background: '#0D1F38',
              borderRadius: '12px',
              border: '1.5px solid #CFD29D',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              zIndex: 1200,
              padding: '6px',
            }}
          >
            {searchResults.map((res) => (
              <button
                key={res.i}
                type="button"
                className="cost-search-option"
                onClick={() => handleAddMed(res)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: isAr ? 'right' : 'left',
                }}
              >
                <div>
                  <b style={{ color: '#CFD29D' }}>{isAr ? res.a || res.n : res.n}</b>
                  <div className="small" style={{ color: '#cbd5e1' }}>{res.g} · {res.s}</div>
                </div>
                <span className="badge" style={{ background: '#138866', color: '#fff', fontWeight: 800 }}>
                  + أضف للصيام
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Timing Filter Tabs */}
      <div className="row wrapRow" style={{ gap: '8px' }}>
        <button
          type="button"
          className={`btn small ${selectedTimingFilter === 'all' ? '' : 'ghost'}`}
          onClick={() => setSelectedTimingFilter('all')}
        >
          {tr(lang, `جميع أدوية الصيام (${meds.length})`, `All (${meds.length})`)}
        </button>
        <button
          type="button"
          className={`btn small ${selectedTimingFilter === 'iftar' ? '' : 'ghost'}`}
          onClick={() => setSelectedTimingFilter('iftar')}
        >
          🌅 {tr(lang, 'مع وجبة الإفطار', 'With Iftar')}
        </button>
        <button
          type="button"
          className={`btn small ${selectedTimingFilter === 'suhur' ? '' : 'ghost'}`}
          onClick={() => setSelectedTimingFilter('suhur')}
        >
          🌙 {tr(lang, 'مع وجبة السحور', 'With Suhur')}
        </button>
        <button
          type="button"
          className={`btn small ${selectedTimingFilter === 'split_iftar_suhur' ? '' : 'ghost'}`}
          onClick={() => setSelectedTimingFilter('split_iftar_suhur')}
        >
          ⚖️ {tr(lang, 'مقسم بين الإفطار والسحور', 'Split Iftar & Suhur')}
        </button>
      </div>

      {/* Fasting Med Cards Grid */}
      <div className="grid">
        {filteredMeds.map((med) => {
          return (
            <div
              key={med.id}
              className="card stack"
              style={{
                borderInlineStart: med.fastingSafety === 'caution' ? '5px solid #d97706' : '5px solid #138866',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--navy)' }}>
                    💊 {med.name}
                  </h3>
                  <span
                    className="badge"
                    style={{
                      background: med.ramadanTiming === 'iftar' ? 'rgba(19, 136, 102, 0.15)' : 'rgba(207, 210, 157, 0.35)',
                      color: med.ramadanTiming === 'iftar' ? '#138866' : '#0D1F38',
                      fontWeight: 800,
                    }}
                  >
                    {med.ramadanTiming === 'iftar'
                      ? '🌅 مع الإفطار'
                      : med.ramadanTiming === 'suhur'
                      ? '🌙 مع السحور'
                      : '⚖️ مقسم إفطار + سحور'}
                  </span>
                </div>

                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'var(--tint)' }}>
                  <b style={{ color: '#0D1F38', fontSize: '0.88rem', display: 'block' }}>
                    🕌 {isAr ? 'إرشادات التناول الصحيحة أثناء الصيام:' : 'Fasting Dosing Guidance:'}
                  </b>
                  <p className="small" style={{ margin: '4px 0 0' }}>
                    {isAr ? med.ramadanInstructionsAr : med.ramadanInstructionsEn}
                  </p>
                </div>
              </div>

              <div className="row wrapRow" style={{ gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    isAr
                      ? `🕌 إرشادات صيام رمضان لدواء (${med.name}):\n• الموعد الموصى به: ${med.ramadanTiming === 'iftar' ? 'مع وجبة الإفطار' : med.ramadanTiming === 'suhur' ? 'مع وجبة السحور' : 'مقسم بين الإفطار والسحور'}\n• التعليمات: ${med.ramadanInstructionsAr}\n🔗 منصة دوايا: https://mmo277.github.io/DAWAYA/#/ramadan-clock`
                      : `🕌 Fasting guidance for (${med.name}): ${med.ramadanInstructionsEn}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn small ghost"
                  style={{ color: '#138866', borderColor: 'rgba(19, 136, 102, 0.4)' }}
                >
                  📲 {isAr ? 'مشاركة عبر واتساب' : 'Share'}
                </a>
                <button
                  type="button"
                  className="btn small ghost"
                  style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                  onClick={() => handleRemove(med.id)}
                >
                  ✕ {isAr ? 'حذف' : 'Remove'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Disclaimer />
    </main>
  );
}
