import { PostOpeningExpiryTrackerCard } from './egyptianClinicalInnovations';
import React, { useMemo, useState, useEffect } from 'react';
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

export interface CabinetMedItem {
  id: string;
  name: string;
  genericName?: string;
  openedDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  form: string;
  shelfLifeDaysAfterOpen: number;
  useCaseAr: string;
  useCaseEn: string;
  warningsAr: string;
  warningsEn: string;
}

const LOCAL_CABINET_KEY = 'dawaya_home_cabinet_items_v1';

// Default Egyptian Home Cabinet Starter Samples
const STARTER_CABINET_ITEMS: CabinetMedItem[] = [
  {
    id: 'eg-18510',
    name: 'بنادول أدفانس (Panadol Advance)',
    genericName: 'باراسيتامول 500 مجم',
    form: 'tablet',
    shelfLifeDaysAfterOpen: 730,
    useCaseAr: 'مسكن آمن للصداع وآلام الجسم وخافض للحرارة',
    useCaseEn: 'Safe pain reliever and fever reducer',
    warningsAr: 'آمن، ولكن لا تتجاوز 8 أقراص يومياً للبالغين لتفادي إجهاد الكبد.',
    warningsEn: 'Do not exceed 8 tablets daily in adults.',
  },
  {
    id: 'eg-213',
    name: 'كتافلام 50 مجم (Cataflam)',
    genericName: 'ديكلوفيناك بوتاسيوم 50 مجم',
    form: 'tablet',
    shelfLifeDaysAfterOpen: 730,
    useCaseAr: 'مسكن قوي لآلام الأسنان والمفاصل والالتهابات الحادة',
    useCaseEn: 'Potent NSAID for toothache, cramps, and acute pain',
    warningsAr: '⚠️ بعد الأكل فقط! ممنوع لمرضى قرحة المعدة والضغط المرتفع ومشاكل الكلى.',
    warningsEn: '⚠️ Always with meals. Contraindicated in ulcers, hypertension, and renal impairment.',
  },
  {
    id: 'eg-waxsol',
    name: 'واكسول نقط أذن (Waxsol Drops)',
    genericName: 'دوكوسات الصوديوم 0.5%',
    openedDate: '2026-08-10',
    form: 'eye_ear_drops',
    shelfLifeDaysAfterOpen: 28,
    useCaseAr: 'إذابة وتليين شمع الأذن المسدود',
    useCaseEn: 'Ear wax softening drops',
    warningsAr: '🚨 قطرات الأذن والعين تفسد بعد 28 يوماً من فتحها وتصبح بؤرة لتكاثر البكتيريا حتى لو تاريخ العبوة ساري!',
    warningsEn: '🚨 Ear and eye drops expire 28 days after opening due to bacterial contamination risk.',
  },
  {
    id: 'eg-otrivin',
    name: 'أوتريفين بخاخ أنف (Otrivin)',
    genericName: 'زيلوميتازولين 0.1%',
    form: 'eye_ear_drops',
    shelfLifeDaysAfterOpen: 28,
    useCaseAr: 'مضاد سريع لانسداد الأنف والجيوب الأنفية والزكام',
    useCaseEn: 'Nasal decongestant spray',
    warningsAr: '⛔ تحذير حاسم: ممنوع الاستخدام لأكثر من 5 أيام متتالية لتفادي انسداد الأنف الارتدادي والإدماني المزمن!',
    warningsEn: '⛔ Never use for more than 5 consecutive days to avoid severe rebound congestion.',
  },
  {
    id: 'eg-antinal',
    name: 'أنتينال كبسول (Antinal)',
    genericName: 'نيفوروكسازيد 200 مجم',
    form: 'capsule',
    shelfLifeDaysAfterOpen: 730,
    useCaseAr: 'مطهر معوي واسع المدى لعلاج النزلات المعوية والإسهال',
    useCaseEn: 'Intestinal antiseptic for infectious diarrhea',
    warningsAr: 'مطهر معوي موضعي لا يمتص بالدم. اشرب سوائل ومحلول جفاف لتعويض الفقد.',
    warningsEn: 'Non-absorbable intestinal antiseptic. Rehydrate with oral rehydration salts.',
  },
];

export default function HomeMedicineCabinet() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { indexItems, totalCount } = useDawayaDrugDatabase();

  const [items, setItems] = useState<CabinetMedItem[]>(() => {
    if (typeof window === 'undefined') return STARTER_CABINET_ITEMS;
    try {
      const raw = localStorage.getItem(LOCAL_CABINET_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return STARTER_CABINET_ITEMS;
  });

  const [searchQ, setSearchQ] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'expired' | 'valid' | 'drops_liquids'>('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_CABINET_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const searchResults = useMemo(() => {
    const q = searchQ.trim();
    if (!q || q.length < 2) return [];
    return searchDawayaIndex(indexItems, { query: q }, isAr).slice(0, 8);
  }, [searchQ, indexItems, isAr]);

  const handleAddFromSearch = (med: DawayaCompactIndexItem) => {
    const isLiquid = /drops|syrup|susp|solution|قطرة|شراب|نقط/i.test(`${med.f} ${med.n} ${med.a}`);
    const shelfLife = isLiquid ? 28 : 730;

    const newItem: CabinetMedItem = {
      id: med.i,
      name: isAr ? `${med.a || med.n} (${med.s})` : `${med.n} (${med.s})`,
      genericName: med.g || 'راجع النشرة',
      form: med.f,
      shelfLifeDaysAfterOpen: shelfLife,
      openedDate: new Date().toISOString().slice(0, 10),
      useCaseAr: `مستحضر دوائي مصنف ضمن فئة (${med.d || 'الأدوية المعتمدة'}).`,
      useCaseEn: `Medication indicated for registered conditions.`,
      warningsAr: isLiquid
        ? '⚠️ هذا الشكل الصيدلي سائل/قطرة ويفسد غالباً بعد 28 يوماً من الفتح (راجع النشرة).'
        : 'احفظ الشريط بعيداً عن الحرارة المباشرة والرطوبة وبعيداً عن متناول الأطفال.',
      warningsEn: isLiquid
        ? 'Liquids and drops typically expire 28-30 days after opening.'
        : 'Store away from moisture and heat.',
    };

    setItems((prev) => [newItem, ...prev.filter((x) => x.id !== newItem.id)]);
    setSearchQ('');
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleResetToStarters = () => {
    setItems(STARTER_CABINET_ITEMS);
  };

  // Status calculator for each item based on openedDate & shelfLife
  const auditedItems = useMemo(() => {
    const todayMs = Date.now();
    return items.map((it) => {
      let isExpiredAfterOpen = false;
      let daysRemaining: number | null = null;
      let openAgeDays: number | null = null;

      if (it.openedDate) {
        const openedMs = new Date(it.openedDate).getTime();
        openAgeDays = Math.max(0, Math.floor((todayMs - openedMs) / (1000 * 60 * 60 * 24)));
        daysRemaining = it.shelfLifeDaysAfterOpen - openAgeDays;
        if (daysRemaining <= 0) {
          isExpiredAfterOpen = true;
        }
      }

      const isLiquidOrDrop = it.shelfLifeDaysAfterOpen <= 35;

      return {
        ...it,
        isExpiredAfterOpen,
        daysRemaining,
        openAgeDays,
        isLiquidOrDrop,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterMode === 'expired') return auditedItems.filter((x) => x.isExpiredAfterOpen);
    if (filterMode === 'valid') return auditedItems.filter((x) => !x.isExpiredAfterOpen);
    if (filterMode === 'drops_liquids') return auditedItems.filter((x) => x.isLiquidOrDrop);
    return auditedItems;
  }, [auditedItems, filterMode]);

  const expiredCount = auditedItems.filter((x) => x.isExpiredAfterOpen).length;
  const dropsCount = auditedItems.filter((x) => x.isLiquidOrDrop).length;

  return (
    <main className="wrap stack" style={{ paddingTop: '10px' }}>
      <PostOpeningExpiryTrackerCard isAr={isAr} />
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
              🩺 {tr(lang, 'خدمة حصرية لمنصة دوايا (DAWAYA)', 'Exclusive DAWAYA Healthcare Feature')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              🗄️ {tr(lang, 'كاشف وفرز صيدلية البيت (Home Medicine Cabinet Auditor)', 'Home Medicine Cabinet Auditor')}
            </h1>
          </div>
          <div className="row wrapRow" style={{ gap: '6px' }}>
            <Link to="/medicines" className="btn small ghost" style={{ color: '#CFD29D', borderColor: '#CFD29D' }}>
              💊 {tr(lang, 'دليل الأدوية (26,572+)', 'Drug Database')}
            </Link>
          </div>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'أداة التفتيش المنزلي الذكية لفرز أدوية الدرج والأشرطة المتبقية: اعرف كل دواء يُستخدم لإيه بالضبط، واكتشف الأدوية التي فسدت بعد فتحها (كالقطرات التي تفسد بعد 28 يوماً) واحمي عائلتك من التسمم الدوائي.',
            'Audit your home medicine cabinet: identify what mystery strips are used for, check real post-opening shelf life (e.g. eye drops expire 28 days after opening), and safely purge toxic expired medications.'
          )}
        </p>

        {/* Audit Metric Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(207, 210, 157, 0.25)',
          }}
        >
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)' }}>
            <span className="small" style={{ opacity: 0.85 }}>{tr(lang, 'إجمالي الأدوية بالخزانة:', 'Total Cabinet Drugs:')}</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900 }}>{items.length} {isAr ? 'أصناف' : 'items'}</div>
          </div>
          <div style={{ padding: '10px', borderRadius: '12px', background: expiredCount > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)' }}>
            <span className="small" style={{ color: expiredCount > 0 ? '#fecaca' : 'inherit' }}>{tr(lang, 'أدوية فاسدة بعد الفتح:', 'Expired After Open:')}</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: expiredCount > 0 ? '#fca5a5' : '#CFD29D' }}>
              {expiredCount > 0 ? `🚨 ${expiredCount} أصناف للخطر` : `✅ 0 (آمن)`}
            </div>
          </div>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)' }}>
            <span className="small" style={{ opacity: 0.85 }}>{tr(lang, 'قطرات وسوائل (28 يوماً):', 'Drops & Liquids:')}</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#CFD29D' }}>{dropsCount} {isAr ? 'أصناف حساسة' : 'items'}</div>
          </div>
        </div>
      </section>

      {/* Add Medicine Search Bar */}
      <section className="card" style={{ position: 'relative' }}>
        <b style={{ display: 'block', marginBottom: '6px', fontSize: '0.96rem', color: 'var(--navy)' }}>
          🔍 {tr(lang, 'فرز شريط دواء مجهول: ابحث باسمه لإضافته وفحص دواعي استعماله وصلاحيته:', 'Search any medicine strip in your drawer to inspect use and safety:')}
        </b>
        <input
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={tr(
            lang,
            'اكتب اسم الدواء المكتوب على ظهر الشريط (مثال: بنادول، كتافلام، واكسول، انتينال، كونكور، اوجمنتين)...',
            'Type medicine name printed on the blister pack...'
          )}
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
                onClick={() => handleAddFromSearch(res)}
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
                  + {isAr ? 'أضف للصيدلية' : 'Add'}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Filter Tabs */}
      <div className="row wrapRow" style={{ gap: '8px' }}>
        <button
          type="button"
          className={`btn small ${filterMode === 'all' ? '' : 'ghost'}`}
          onClick={() => setFilterMode('all')}
        >
          {tr(lang, `جميع أدوية الخزانة (${items.length})`, `All (${items.length})`)}
        </button>
        <button
          type="button"
          className={`btn small ${filterMode === 'expired' ? '' : 'ghost'}`}
          onClick={() => setFilterMode('expired')}
          style={filterMode === 'expired' ? { background: '#dc2626', color: '#fff' } : { borderColor: '#ef4444', color: '#ef4444' }}
        >
          🚨 {tr(lang, `أدوية فاسدة بعد الفتح (${expiredCount})`, `Expired (${expiredCount})`)}
        </button>
        <button
          type="button"
          className={`btn small ${filterMode === 'drops_liquids' ? '' : 'ghost'}`}
          onClick={() => setFilterMode('drops_liquids')}
        >
          💧 {tr(lang, `القطرات والأشربة الحساسة (${dropsCount})`, `Drops & Liquids (${dropsCount})`)}
        </button>
        <button
          type="button"
          className="btn small ghost"
          style={{ marginInlineStart: 'auto' }}
          onClick={handleResetToStarters}
        >
          ↺ {tr(lang, 'استعادة الأمثلة التوضيحية', 'Reset Starter Samples')}
        </button>
      </div>

      {/* Medicine Cabinet Cards Grid */}
      <div className="grid">
        {filteredItems.map((med) => {
          return (
            <div
              key={med.id}
              className="card stack"
              style={{
                borderInlineStart: med.isExpiredAfterOpen
                  ? '6px solid #dc2626'
                  : med.isLiquidOrDrop
                  ? '6px solid #d97706'
                  : '6px solid #138866',
                background: med.isExpiredAfterOpen ? 'rgba(239, 68, 68, 0.05)' : 'var(--card-bg)',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DosageFormVectorBadge form={med.form} size={20} />
                      <span>{med.name}</span>
                    </h3>
                    <div className="small muted">{med.genericName}</div>
                  </div>
                  {med.isExpiredAfterOpen ? (
                    <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800 }}>
                      ⛔ منتهي الصلاحية بعد الفتح
                    </span>
                  ) : med.daysRemaining !== null && med.daysRemaining <= 7 ? (
                    <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800 }}>
                      ⚠️ يفسد خلال {med.daysRemaining} أيام!
                    </span>
                  ) : (
                    <span className="badge approved">
                      ✓ ساري للاستخدام
                    </span>
                  )}
                </div>

                {/* Indication / Use Case */}
                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'var(--tint)' }}>
                  <b style={{ color: '#0D1F38', fontSize: '0.86rem', display: 'block' }}>
                    🎯 {isAr ? 'دواعي الاستعمال في البيت:' : 'Indication & Home Use:'}
                  </b>
                  <p className="small" style={{ margin: '4px 0 0' }}>
                    {isAr ? med.useCaseAr : med.useCaseEn}
                  </p>
                </div>

                {/* Safety Warning */}
                <div style={{ marginTop: '8px' }}>
                  <b style={{ color: '#b45309', fontSize: '0.84rem' }}>
                    ⚠️ {isAr ? 'تحذير السلامة والاستخدام:' : 'Safety Warning:'}
                  </b>
                  <p className="small" style={{ margin: '2px 0 0', color: '#64748b' }}>
                    {isAr ? med.warningsAr : med.warningsEn}
                  </p>
                </div>

                {/* Post-Opening Shelf Life Tracker Controls */}
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                  <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <label className="small muted">
                      📅 {isAr ? 'تاريخ الفتح:' : 'Opened on:'}
                    </label>
                    <input
                      type="date"
                      value={med.openedDate || ''}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setItems((prev) =>
                          prev.map((it) => (it.id === med.id ? { ...it, openedDate: newDate } : it))
                        );
                      }}
                      style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto' }}
                    />
                  </div>
                  {med.openAgeDays !== null && (
                    <div className="small muted" style={{ marginTop: '4px' }}>
                      ⏱️ {isAr ? `مفتوح منذ ${med.openAgeDays} يوماً (أقصى صلاحية بعد الفتح: ${med.shelfLifeDaysAfterOpen} يوماً).` : `Opened ${med.openAgeDays} days ago.`}
                    </div>
                  )}
                </div>
              </div>

              <div className="row wrapRow" style={{ gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                <Link to={`/medicine/${med.id}`} className="btn small ghost" style={{ flex: 1, textAlign: 'center' }}>
                  📖 {isAr ? 'النشرة الدوائية والبدائل' : 'Monograph'}
                </Link>
                <button
                  type="button"
                  className="btn small ghost"
                  style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                  onClick={() => handleRemove(med.id)}
                  title={isAr ? 'حذف من الخزانة' : 'Remove'}
                >
                  🗑️ {isAr ? 'حذف' : 'Remove'}
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
