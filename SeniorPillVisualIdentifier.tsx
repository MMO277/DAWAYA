import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';
import { speakText, stopSpeech } from './speechService';
import { DosageFormVectorBadge } from './DawayaVectorIcons';

export interface VisualPillItem {
  id: string;
  nameAr: string;
  nameEn: string;
  indicationAr: string;
  indicationEn: string;
  colorNameAr: string;
  colorNameEn: string;
  colorHex: string;
  shapeType: 'round' | 'oval_oblong' | 'capsule_two_tone' | 'scored_half';
  shapeLabelAr: string;
  shapeLabelEn: string;
  audioPronunciationAr: string;
  audioPronunciationEn: string;
}

export const COMMON_SENIOR_PILLS: VisualPillItem[] = [
  {
    id: 'concor_5',
    nameAr: 'كونكور 5 مجم (بيسوبرولول)',
    nameEn: 'Concor 5mg (Bisoprolol)',
    indicationAr: 'دواء تنظيم ضربات القلب وضغط الدم اليومي',
    indicationEn: 'Daily blood pressure & heart rate regulator',
    colorNameAr: 'أصفر باهت / بيج قلبي الشكل',
    colorNameEn: 'Light yellow / heart shaped',
    colorHex: '#fef08a',
    shapeType: 'round',
    shapeLabelAr: 'قرص صغير مميز على شكل قلب',
    shapeLabelEn: 'Small heart-shaped tablet',
    audioPronunciationAr: 'دواء كونكور خمسة مجم.. حبة صغيرة صفراء لضغط الدم ونبض القلب، تؤخذ مرة واحدة صباحاً بعد الفطار.',
    audioPronunciationEn: 'Concor 5mg. Small heart-shaped yellow tablet for blood pressure and heart rate, taken once daily after breakfast.',
  },
  {
    id: 'glucophage_1000',
    nameAr: 'جلوكوفاج 1000 مجم (ميتفورمين)',
    nameEn: 'Glucophage 1000mg',
    indicationAr: 'منظم سكر الدم الرئيسي الفموي',
    indicationEn: 'Primary oral blood sugar regulator',
    colorNameAr: 'أبيض بيضاوي كبير',
    colorNameEn: 'White large oblong',
    colorHex: '#ffffff',
    shapeType: 'scored_half',
    shapeLabelAr: 'قرص كبير بيضاوي أبيض مقسوم من المنتصف',
    shapeLabelEn: 'Large white scored oblong tablet',
    audioPronunciationAr: 'دواء جلوكوفاج ألف مجم.. قرص أبيض كبير مقسوم نصين لتنظيم السكر، يؤخذ وسط أو بعد الأكل مباشرة لمنع ألم المعدة.',
    audioPronunciationEn: 'Glucophage 1000mg. Large white oblong tablet for blood sugar control, taken with or immediately after meals.',
  },
  {
    id: 'controloc_40',
    nameAr: 'كونترولوك 40 مجم (بانتوبرازول)',
    nameEn: 'Controloc 40mg',
    indicationAr: 'حماية المعدة وعلاج الحموضة والارتجاع',
    indicationEn: 'Gastric acid protection and GERD',
    colorNameAr: 'أصفر بيضاوي أملس',
    colorNameEn: 'Yellow smooth oval',
    colorHex: '#facc15',
    shapeType: 'oval_oblong',
    shapeLabelAr: 'قرص أصفر بيضاوي أملس صغير',
    shapeLabelEn: 'Yellow smooth oval tablet',
    audioPronunciationAr: 'دواء كونترولوك أربعين مجم.. حبة صفراء بيضاوية لحموضة وقرحة المعدة، تؤخذ قبل الفطار بنصف ساعة.',
    audioPronunciationEn: 'Controloc 40mg. Smooth yellow oval tablet for stomach acid, taken 30 minutes before breakfast.',
  },
  {
    id: 'crestor_20',
    nameAr: 'كريستور 20 مجم (روزوفاستاتين)',
    nameEn: 'Crestor 20mg',
    indicationAr: 'علاج دهون الدم والكوليسترول وحماية الشرايين',
    indicationEn: 'Cholesterol and cardiovascular protection',
    colorNameAr: 'وردي / بمبي مدور',
    colorNameEn: 'Pink round',
    colorHex: '#f472b6',
    shapeType: 'round',
    shapeLabelAr: 'قرص وردي مدور صغير',
    shapeLabelEn: 'Small pink round tablet',
    audioPronunciationAr: 'دواء كريستور عشرين مجم.. حبة وردية اللون لخفض الكوليسترول ودهون الدم، تؤخذ مرة واحدة مساءً قبل النوم.',
    audioPronunciationEn: 'Crestor 20mg. Small pink round tablet for cholesterol control, taken once daily in the evening before bedtime.',
  },
  {
    id: 'antinal_cap',
    nameAr: 'أنتينال 200 مجم (نيفوروكسازيد)',
    nameEn: 'Antinal 200mg Capsules',
    indicationAr: 'كبسولات مطهرة للمعدة والإسهال',
    indicationEn: 'Intestinal antiseptic capsules for diarrhea',
    colorNameAr: 'كبسولة صفراء بالكامل',
    colorNameEn: 'Full yellow capsule',
    colorHex: '#fde047',
    shapeType: 'capsule_two_tone',
    shapeLabelAr: 'كبسولة جيلاتينية صفراء',
    shapeLabelEn: 'Yellow gelatin capsule',
    audioPronunciationAr: 'كبسولات أنتينال.. كبسولة صفراء مطهرة للنزلات المعوية والإسهال، تؤخذ كل ثماني ساعات.',
    audioPronunciationEn: 'Antinal capsules. Yellow capsule for diarrhea, taken every 8 hours.',
  },
];

export default function SeniorPillVisualIdentifier() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedShape, setSelectedShape] = useState<string>('all');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const filteredPills = useMemo(() => {
    return COMMON_SENIOR_PILLS.filter((p) => {
      if (selectedColor !== 'all' && !p.colorHex.includes(selectedColor) && !p.colorNameAr.includes(selectedColor)) return false;
      if (selectedShape !== 'all' && p.shapeType !== selectedShape) return false;
      return true;
    });
  }, [selectedColor, selectedShape]);

  const handleSpeak = (item: VisualPillItem) => {
    if (speakingId === item.id) {
      stopSpeech();
      setSpeakingId(null);
      return;
    }
    stopSpeech();
    setSpeakingId(item.id);
    const textToSpeak = isAr ? item.audioPronunciationAr : item.audioPronunciationEn;
    speakText(textToSpeak, isAr ? 'ar' : 'en');
  };

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
              👵 {tr(lang, 'مساعد كبار السن وأولياء الأمور بالصوت والألوان', 'Senior Pill Visual & Audio Identifier')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              🎨 {tr(lang, 'فاحص شكل ولون الحبة والمساعد الصوتي لكبار السن', 'Pill Visual & Voice Identifier for Seniors')}
            </h1>
          </div>
          <Link to="/daily-schedule" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800 }}>
            📅 {isAr ? 'جدول المواعيد اليومي' : 'Daily Schedule'}
          </Link>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'حل مشكلة خلط الأدوية عند كبار السن: ابحث بلون الحبة وشكلها («الحبة الصفراء بتاعة الضغط»، «القرص الأبيض المقسوم للسكر»)، واضغط زر السماعة ليستمع الوالد أو الوالدة لشرح الجرعة بصوت عربي واضح وعالٍ.',
            'Identify pills by color and shape for elderly family members, with high-volume audio readouts explaining what each medicine is for and when to take it.'
          )}
        </p>

        {/* Color Palette Filter Buttons */}
        <div className="row wrapRow" style={{ gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(207, 210, 157, 0.25)' }}>
          <button
            type="button"
            className={`btn small ${selectedColor === 'all' ? '' : 'ghost'}`}
            style={selectedColor === 'all' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setSelectedColor('all')}
          >
            {isAr ? 'جميع الألوان' : 'All Colors'}
          </button>
          <button
            type="button"
            className="btn small"
            style={{ background: '#fef08a', color: '#854d0e', fontWeight: 800 }}
            onClick={() => setSelectedColor('أصفر')}
          >
            🟡 {isAr ? 'أصفر / بيج' : 'Yellow'}
          </button>
          <button
            type="button"
            className="btn small"
            style={{ background: '#ffffff', color: '#0f172a', fontWeight: 800 }}
            onClick={() => setSelectedColor('أبيض')}
          >
            ⚪ {isAr ? 'أبيض' : 'White'}
          </button>
          <button
            type="button"
            className="btn small"
            style={{ background: '#f472b6', color: '#831843', fontWeight: 800 }}
            onClick={() => setSelectedColor('وردي')}
          >
            🌸 {isAr ? 'وردي / بمبي' : 'Pink'}
          </button>
        </div>
      </section>

      {/* Pills Cards Grid */}
      <div className="grid">
        {filteredPills.map((p) => {
          const isSpeaking = speakingId === p.id;
          return (
            <div
              key={p.id}
              className="card stack"
              style={{
                borderInlineStart: `6px solid ${p.colorHex === '#ffffff' ? '#0D1F38' : p.colorHex}`,
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: p.shapeType === 'round' ? '50%' : p.shapeType === 'capsule_two_tone' ? '8px' : '14px',
                        background: p.colorHex,
                        border: '2px solid #0D1F38',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--navy)' }}>
                        {isAr ? p.nameAr : p.nameEn}
                      </h3>
                      <div className="small muted">{isAr ? p.colorNameAr : p.colorNameEn}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn small"
                    style={{
                      background: isSpeaking ? '#dc2626' : '#138866',
                      color: '#ffffff',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    onClick={() => handleSpeak(p)}
                    title={isAr ? 'استماع للشرح بالصوت العالي' : 'Listen audio'}
                  >
                    {isSpeaking ? '⏹️ إيقاف' : '🔊 اسمع بالصوت'}
                  </button>
                </div>

                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'var(--tint)' }}>
                  <b style={{ color: '#0D1F38', fontSize: '0.86rem', display: 'block' }}>
                    🎯 {isAr ? 'الدواء ده بيعالج إيه؟' : 'Indication:'}
                  </b>
                  <p className="small" style={{ margin: '3px 0 0', fontWeight: 600 }}>
                    {isAr ? p.indicationAr : p.indicationEn}
                  </p>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <span className="badge" style={{ background: 'rgba(13, 31, 56, 0.08)', color: '#0D1F38', fontWeight: 700 }}>
                    🔍 {isAr ? p.shapeLabelAr : p.shapeLabelEn}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    isAr
                      ? `💊 بيانات دواء (${p.nameAr}):\n• الشكل واللون: ${p.colorNameAr} - ${p.shapeLabelAr}\n• الاستخدام: ${p.indicationAr}\n🔗 منصة دوايا: https://mmo277.github.io/DAWAYA/#/senior-pills`
                      : `Pill info: ${p.nameEn}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn small ghost"
                  style={{ width: '100%', textAlign: 'center', color: '#138866', borderColor: 'rgba(19, 136, 102, 0.4)' }}
                >
                  📲 {isAr ? 'إرسال التوضيح للوالدين على واتساب' : 'WhatsApp Family Share'}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <Disclaimer />
    </main>
  );
}
