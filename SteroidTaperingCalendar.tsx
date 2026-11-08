import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export interface TaperStep {
  dayRange: string;
  doseMg: number;
  tabletsDescriptionAr: string;
  tabletsDescriptionEn: string;
  notesAr: string;
  notesEn: string;
}

export default function SteroidTaperingCalendar() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [startingDoseMg, setStartingDoseMg] = useState<number>(40);
  const [tabletStrengthMg, setTabletStrengthMg] = useState<number>(20); // Solupred 20mg or 5mg
  const [patientName, setPatientName] = useState('');

  // Computes clinically safe progressive tapering schedule
  const taperingPlan = useMemo(() => {
    const steps: TaperStep[] = [];
    let cur = startingDoseMg;
    let dayStart = 1;

    // Step 1: Full dose for 3-5 days
    const tabs1 = (cur / tabletStrengthMg).toFixed(1).replace('.0', '');
    steps.push({
      dayRange: isAr ? `الأيام 1 إلى 4` : `Days 1 to 4`,
      doseMg: cur,
      tabletsDescriptionAr: `${tabs1} قرص صباحاً بعد الإفطار`,
      tabletsDescriptionEn: `${tabs1} tabs in morning with breakfast`,
      notesAr: 'الجرعة العلاجية الكاملة للسيطرة على الالتهاب الحاد.',
      notesEn: 'Full therapeutic attack dose.',
    });
    dayStart = 5;

    // Step 2..N: Taper down gradually
    while (cur > 5) {
      const drop = cur > 20 ? 10 : 5;
      cur = Math.max(0, cur - drop);
      if (cur === 0) break;
      const dayEnd = dayStart + 2;
      const tabs = (cur / tabletStrengthMg).toFixed(1).replace('.0', '');
      steps.push({
        dayRange: isAr ? `الأيام ${dayStart} إلى ${dayEnd}` : `Days ${dayStart} to ${dayEnd}`,
        doseMg: cur,
        tabletsDescriptionAr: `${tabs} قرص صباحاً بعد الإفطار`,
        tabletsDescriptionEn: `${tabs} tabs in morning`,
        notesAr: 'خفض تدريجي للسماح للغدة الكظرية باستعادة نشاطها الطبيعي.',
        notesEn: 'Gradual reduction for adrenal recovery.',
      });
      dayStart = dayEnd + 1;
    }

    // Final Step: Alternate day low dose before full stop
    steps.push({
      dayRange: isAr ? `الأيام ${dayStart} إلى ${dayStart + 3}` : `Days ${dayStart} to ${dayStart + 3}`,
      doseMg: 2.5,
      tabletsDescriptionAr: isAr ? 'نصف قرص صغير (أو قرص 5 مجم يوم بعد يوم)' : 'Alternate day low dose',
      tabletsDescriptionEn: 'Low dose alternate days',
      notesAr: 'التوقف الآمن تماماً دون أي خمول كظري أو انتكاسة.',
      notesEn: 'Safe complete cessation.',
    });

    return steps;
  }, [startingDoseMg, tabletStrengthMg, isAr]);

  return (
    <main className="wrap stack" style={{ paddingTop: '10px' }}>
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
              🛡️ {tr(lang, 'دليل الأمان والغدة الكظرية', 'Safe Adrenal Recovery & Steroid Tapering')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              📉 {tr(lang, 'حاسبة جدول إيقاف الكورتيزون التدريجي الآمن', 'Steroid Tapering Schedule Calculator')}
            </h1>
          </div>
          <button
            type="button"
            className="btn small"
            style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800 }}
            onClick={() => window.print()}
          >
            🖨️ {isAr ? 'طباعة الجدول (A4)' : 'Print Schedule'}
          </button>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'احمِ نفسك من الصدمة الكظرية وهبوط الضغط الحاد: التوقف المفاجئ عن الكورتيزون (سولوبريد، بريدسول، ديكساميثازون) كارثة طبية؛ احسب جدول الخفض اليومي المدرج بالتواريخ للتوقف التام بأمان.',
            'Never stop steroids abruptly! Abrupt cessation triggers severe adrenal crisis and shock. Calculate a clinically safe day-by-day countdown taper schedule.'
          )}
        </p>

        {/* Inputs Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(207, 210, 157, 0.25)',
          }}
        >
          <div>
            <label className="small" style={{ fontWeight: 700, color: '#CFD29D', display: 'block', marginBottom: '4px' }}>
              💉 {isAr ? 'الجرعة الابتدائية الحالية (مجم/يوم):' : 'Starting Dose (mg/day):'}
            </label>
            <select
              className="select-input"
              value={startingDoseMg}
              onChange={(e) => setStartingDoseMg(Number(e.target.value))}
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid #CFD29D' }}
            >
              {[60, 40, 30, 20, 15, 10].map((d) => (
                <option key={d} value={d} style={{ color: '#000' }}>
                  {d} {isAr ? 'مجم يومياً' : 'mg/day'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, color: '#CFD29D', display: 'block', marginBottom: '4px' }}>
              💊 {isAr ? 'تركيز القرص الذي اشتريته من الصيدلية:' : 'Your Tablet Strength:'}
            </label>
            <select
              className="select-input"
              value={tabletStrengthMg}
              onChange={(e) => setTabletStrengthMg(Number(e.target.value))}
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid #CFD29D' }}
            >
              <option value={20} style={{ color: '#000' }}>{isAr ? 'قرص 20 مجم (سولوبريد 20)' : '20mg Tablet (Solupred 20)'}</option>
              <option value={5} style={{ color: '#000' }}>{isAr ? 'قرص 5 مجم (بريدسول / هوستيكورتين)' : '5mg Tablet'}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tapering Steps Cards */}
      <section className="card stack">
        <div className="head">
          <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--navy)' }}>
            🗓️ {isAr ? 'جدول الخفض التدريجي بالخطوات والأيام:' : 'Day-by-Day Countdown Tapering Plan:'}
          </h2>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              isAr
                ? `🗓️ جدول إيقاف الكورتيزون التدريجي الآمن من منصة دوايا:\n` +
                  taperingPlan.map((s) => `• ${s.dayRange}: جرعة ${s.doseMg} مجم (${s.tabletsDescriptionAr})`).join('\n') +
                  `\n⚠️ تنبيه: التزم بالجدول ولا توقف الدواء فجأة لتفادي خمول الغدة الكظرية.\n🔗 منصة دوايا: https://mmo277.github.io/DAWAYA/#/steroid-taper`
                : `Steroid Tapering Plan via DAWAYA`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn small"
            style={{ background: '#138866', color: '#fff', fontWeight: 800 }}
          >
            📲 {isAr ? 'إرسال الجدول للواتساب' : 'Share on WhatsApp'}
          </a>
        </div>

        <div className="stack" style={{ gap: '10px', marginTop: '8px' }}>
          {taperingPlan.map((step, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: 'var(--tint)',
                border: '1.5px solid var(--line)',
                borderInlineStart: idx === 0 ? '6px solid #b91c1c' : idx === taperingPlan.length - 1 ? '6px solid #138866' : '6px solid #d97706',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <b style={{ color: '#0D1F38', fontSize: '1.02rem', display: 'block' }}>
                  {step.dayRange}: <span style={{ color: '#138866' }}>{isAr ? step.tabletsDescriptionAr : step.tabletsDescriptionEn}</span> ({step.doseMg} {isAr ? 'مجم' : 'mg'})
                </b>
                <span className="small muted">
                  {isAr ? step.notesAr : step.notesEn}
                </span>
              </div>
              <span className="badge" style={{ background: '#fff', border: '1px solid var(--line)', color: '#0D1F38', fontWeight: 700 }}>
                ☐ {isAr ? 'تم الالتزام' : 'Completed'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
