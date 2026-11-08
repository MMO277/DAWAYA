import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export interface TravelKitCategory {
  id: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  items: Array<{
    nameAr: string;
    nameEn: string;
    useAr: string;
    useEn: string;
    exampleDrugs: string;
    isEssential: boolean;
  }>;
}

const TRAVEL_CATEGORIES: TravelKitCategory[] = [
  {
    id: 'fever_pain',
    icon: '🤕',
    titleAr: 'مسكنات الصداع والحرارة وآلام العظام',
    titleEn: 'Pain Relief & Fever Reducers',
    items: [
      {
        nameAr: 'باراسيتامول 500 مجم (أقراص)',
        nameEn: 'Paracetamol 500mg Tablets',
        useAr: 'المسكن الأكثر أماناً في السفر والحرارة وآلام الصداع',
        useEn: 'Safest analgesic for headaches and fever while traveling',
        exampleDrugs: 'بانادول أدفانس، أبيمول، سيتال',
        isEssential: true,
      },
      {
        nameAr: 'شراب خافض حرارة للأطفال + سرنجة فموية',
        nameEn: 'Pediatric Antipyretic Syrup & Oral Syringe',
        useAr: 'إلزامي في حال وجود أطفال أو رضع لتفادي الحمى المفاجئة',
        useEn: 'Essential when traveling with infants or children',
        exampleDrugs: 'سيتال شراب، بروفين شراب للأطفال',
        isEssential: true,
      },
    ],
  },
  {
    id: 'stomach_travel',
    icon: '🔥',
    titleAr: 'طوارئ المعدة والمغص والإسهال (إسهال المسافرين)',
    titleEn: 'GI, Diarrhea & Traveler’s Stomach',
    items: [
      {
        nameAr: 'مطهر معوي واسع المدى',
        nameEn: 'Intestinal Antiseptic',
        useAr: 'علاج النزلات المعوية الناتجة عن تغيير مياه أو طعام السفر',
        useEn: 'For infectious diarrhea caused by changed water or food',
        exampleDrugs: 'أنتينال (Antinal)، دياكس (Diax)',
        isEssential: true,
      },
      {
        nameAr: 'أكياس محلول معالجة الجفاف (ORS)',
        nameEn: 'Oral Rehydration Salts (ORS Sachets)',
        useAr: 'إنقاذ فوري من الجفاف الناتج عن القيء أو الإسهال في المصيف',
        useEn: 'Immediate hydration rescue from vomiting or diarrhea',
        exampleDrugs: 'ريرهايدران (Rehydran)، هيدروسيف',
        isEssential: true,
      },
      {
        nameAr: 'مضاد للحموضة وارتجاع المريء',
        nameEn: 'Antacid / PPI',
        useAr: 'علاج الحموضة وحرقة الفؤاد الناتجة عن أطعمة السفر الدسمة',
        useEn: 'Quick relief from heartburn and acid reflux',
        exampleDrugs: 'فوار جافيسكون، مالوكس، كونترولوك',
        isEssential: false,
      },
      {
        nameAr: 'مضاد للتقلصات ومغص البطن',
        nameEn: 'Antispasmodic',
        useAr: 'تسكين مغص المعدة والقولون العصبي المفاجئ أثناء الطريق',
        useEn: 'Fast relief for stomach spasms and cramps',
        exampleDrugs: 'سبازموبيرالجين، بسكوبان (Buscopan)',
        isEssential: true,
      },
    ],
  },
  {
    id: 'motion_allergy',
    icon: '✈️',
    titleAr: 'دوار السفر والطريق والحساسية ولدغات الحشرات',
    titleEn: 'Motion Sickness, Allergies & Bites',
    items: [
      {
        nameAr: 'أقراص دوار السفر والمواصلات (Motion Sickness)',
        nameEn: 'Motion Sickness Prevention Tablets',
        useAr: 'تؤخذ قبل ركوب الطائرة أو الباخرة أو السيارة بـ 30 دقيقة',
        useEn: 'Take 30 mins before flights, cruises, or long car rides',
        exampleDrugs: 'درامامين (Dramamine)، إمتركس',
        isEssential: true,
      },
      {
        nameAr: 'مضاد للحساسية والرشح غير مسبب للنعاس',
        nameEn: 'Non-Drowsy Antihistamine',
        useAr: 'علاج حساسية الجو وتغير الطقس ولدغات الناموس والحشرات',
        useEn: 'Allergy and insect bite relief without daytime sedation',
        exampleDrugs: 'تلفاست 120/180 مجم، زيرتك 10 مجم',
        isEssential: true,
      },
      {
        nameAr: 'كريم موضعي ملطف ومضاد للالتهاب ولدغ الحشرات',
        nameEn: 'Topical Soothing & Anti-inflammatory Cream',
        useAr: 'علاج حروق الشمس بالبحر والتهابات الجلد واللدغات',
        useEn: 'For sunburns, skin irritation, and insect stings',
        exampleDrugs: 'بيبانثين (Bepanthen)، هيدروكورتيزون خفيف',
        isEssential: true,
      },
    ],
  },
  {
    id: 'first_aid',
    icon: '🩹',
    titleAr: 'الإسعافات الأولية وتطهير الجروح',
    titleEn: 'First Aid & Wound Disinfection',
    items: [
      {
        nameAr: 'محلول بوفيدون يود مطهر للجروح + شاش ولاصق طبي',
        nameEn: 'Antiseptic Solution & Sterile Bandages',
        useAr: 'تطهير أي خدوش أو جروح فورية على البحر أو في الرحلات',
        useEn: 'Immediate wound cleaning and sterile protection',
        exampleDrugs: 'بيتادين (Betadine) مطهر جروح، بلاستر طبي',
        isEssential: true,
      },
      {
        nameAr: 'مرهم مضاد حيوي موضعي للجروح السطحية',
        nameEn: 'Topical Antibiotic Ointment',
        useAr: 'حماية الخدوش والجروح السطحية من التلوث البكتيري',
        useEn: 'Prevents bacterial infection in cuts and scrapes',
        exampleDrugs: 'فيوسيدين (Fucidin)، جاراميسين مرهم',
        isEssential: true,
      },
    ],
  },
];

export default function TravelMedKit() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [destinationType, setDestinationType] = useState<'beach' | 'hajj_umrah' | 'work_flight' | 'safari'>('beach');
  const [withKids, setWithKids] = useState(true);
  const [withSeniors, setWithSeniors] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allItemsCount = TRAVEL_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const packedCount = Object.values(checkedItems).filter(Boolean).length;

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
              ✈️ {tr(lang, 'حقيبة الطوارئ الدوائية للمسافرين', 'Travel Medication Kit Planner')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              🧳 {tr(lang, 'مخطط حقيبة أدوية السفر والمصيف والعمرة (Travel Kit)', 'Travel & Vacation Medication Kit')}
            </h1>
          </div>
          <div className="row wrapRow" style={{ gap: '6px' }}>
            <button
              type="button"
              className="btn small"
              style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800 }}
              onClick={() => window.print()}
            >
              🖨️ {isAr ? 'طباعة القائمة (Checklist)' : 'Print Checklist'}
            </button>
          </div>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'جهز حقيبة أدوية طوارئ السفر بذكاء حتى لا تعلق في مصيف أو عمرة أو رحلة طيران بدون دواء؛ قائمة مفصلة بحالات المغص، دوار البحر والطريق، النزلات المعوية، وحروق الشمس.',
            'Smart packing checklist for travel medical emergencies: motion sickness, traveler’s diarrhea, allergic bites, sunburns, and pediatric fevers.'
          )}
        </p>

        {/* Travel Type Selectors */}
        <div className="row wrapRow" style={{ gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(207, 210, 157, 0.25)' }}>
          <button
            type="button"
            className={`btn small ${destinationType === 'beach' ? '' : 'ghost'}`}
            style={destinationType === 'beach' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setDestinationType('beach')}
          >
            🏖️ {isAr ? 'مصيف وشاطئ (الساحل / مطروح / شرم)' : 'Beach / Vacation'}
          </button>
          <button
            type="button"
            className={`btn small ${destinationType === 'hajj_umrah' ? '' : 'ghost'}`}
            style={destinationType === 'hajj_umrah' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setDestinationType('hajj_umrah')}
          >
            🕋 {isAr ? 'رحلة عمرة أو حج' : 'Umrah / Hajj'}
          </button>
          <button
            type="button"
            className={`btn small ${destinationType === 'work_flight' ? '' : 'ghost'}`}
            style={destinationType === 'work_flight' ? { background: '#CFD29D', color: '#0D1F38', fontWeight: 800 } : { color: '#CFD29D', borderColor: '#CFD29D' }}
            onClick={() => setDestinationType('work_flight')}
          >
            ✈️ {isAr ? 'سفر عمل أو طيران خارجي' : 'Flight / Business'}
          </button>
        </div>
      </section>

      {/* Progress Strip */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <b style={{ color: 'var(--navy)' }}>
            📋 {isAr ? `الأدوية التي تم تجهيزها في الحقيبة: (${packedCount} من أصل ${allItemsCount})` : `Packed: (${packedCount} of ${allItemsCount})`}
          </b>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            isAr
              ? `🧳 قائمة حقيبة أدوية السفر والمصيف من منصة دوايا:\n` +
                TRAVEL_CATEGORIES.map((c) => `• ${c.titleAr}:\n  ${c.items.map((it) => `${checkedItems[it.nameAr] ? '✅' : '☐'} ${it.nameAr} (${it.exampleDrugs})`).join('\n  ')}`).join('\n\n') +
                `\n🔗 جهز حقيبتك على دوايا: https://mmo277.github.io/DAWAYA/#/travel-kit`
              : `🧳 Travel Med Kit Checklist via DAWAYA`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn small ghost"
          style={{ color: '#138866', borderColor: 'rgba(19, 136, 102, 0.4)' }}
        >
          📲 {isAr ? 'إرسال القائمة على واتساب' : 'WhatsApp Checklist'}
        </a>
      </div>

      {/* Categories Checklist */}
      <div className="stack" style={{ gap: '14px' }}>
        {TRAVEL_CATEGORIES.map((cat) => (
          <section key={cat.id} className="card stack">
            <h2 style={{ margin: 0, fontSize: '1.12rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{cat.icon}</span>
              <span>{isAr ? cat.titleAr : cat.titleEn}</span>
            </h2>

            <div className="grid">
              {cat.items.map((item) => {
                const checked = Boolean(checkedItems[item.nameAr]);
                return (
                  <div
                    key={item.nameAr}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: checked ? 'rgba(19, 136, 102, 0.08)' : 'var(--tint)',
                      border: checked ? '1.5px solid #138866' : '1px solid var(--line)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleCheck(item.nameAr)}
                  >
                    <div>
                      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <b style={{ color: checked ? '#138866' : 'var(--navy)', fontSize: '0.96rem' }}>
                          {checked ? '✅ ' : '☐ '}
                          {isAr ? item.nameAr : item.nameEn}
                        </b>
                        {item.isEssential && (
                          <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800 }}>
                            {isAr ? 'ضروري' : 'Essential'}
                          </span>
                        )}
                      </div>

                      <p className="small muted" style={{ margin: '6px 0 0' }}>
                        {isAr ? item.useAr : item.useEn}
                      </p>
                    </div>

                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                      <span className="small" style={{ color: '#0D1F38', fontWeight: 700 }}>
                        {isAr ? 'أمثلة شهيرة بمصر:' : 'Examples in Egypt:'}{' '}
                      </span>
                      <span className="small muted">{item.exampleDrugs}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Disclaimer />
    </main>
  );
}
