import { SmartNativeSelect } from './SmartChoiceSelect';
import SmartMedDoseReminderBadge from './SmartMedDoseReminderBadge';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
  getClassifiedAlternatives,
} from './egyptianDrugDatabase';
import { norm } from './search';
import Disclaimer from './Disclaimer';
import { useAuth } from './authContext';
import { useLiveDrugCatalog } from './liveCatalogSync';
import { QuickProductEditorModal } from './CommercialCatalogEditor';
import {
  dawayaIndexItemToCommercialProduct,
  findDawayaIndexItemSync,
  getDawayaClassifiedAlternatives,
  getDawayaIngredientEquivalents,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import { DosageFormVectorBadge } from './DawayaVectorIcons';

const POPULAR_BRAND_IDS = [
  'EG-ABX-001', // Augmentin 1g
  'EG-ABX-083', // Zithromax 500mg
  'EG-ABX-055', // Rocephin 1g
  'EG-ABX-113', // Tavanic 500mg
  'EG-ABX-093', // Klacid 500mg
  'EG-ABX-039', // Zinnat 500mg
  'EG-ABX-193', // Zyvox 600mg
  'EG-ABX-103', // Ciprobay 500mg
  'EG-ABX-135', // Dalacin C 300mg
];

export default function CostSaver() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [sp] = useSearchParams();
  const ingParam = sp.get('ing') || '';
  const prodParam = sp.get('prod') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [packCount, setPackCount] = useState<number>(1);
  const { user, role } = useAuth();
  const canEditLive = role === 'owner' || role === 'admin' || role === 'reviewer' || role === 'editor';
  const { products: liveCatalogProducts } = useLiveDrugCatalog();
  const { indexItems, totalCount } = useDawayaDrugDatabase();
  const [editingProd, setEditingProd] = useState<EgyptianCommercialProduct | null>(null);

  const [viewMode, setViewMode] = useState<'single' | 'basket'>('single');
  const [basketSearchQ, setBasketSearchQ] = useState('');

  // Initial prescription basket with popular Egyptian prescribed medicines
  const [basket, setBasket] = useState<EgyptianCommercialProduct[]>(() => {
    const aug = liveCatalogProducts.find((p) => p.productId === 'EG-ABX-001') || EGYPTIAN_COMMERCIAL_PRODUCTS[0];
    const conc = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.productId === 'EG-MED-233');
    const cont = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.productId === 'EG-MED-229');
    return [aug, conc, cont].filter((p): p is EgyptianCommercialProduct => Boolean(p));
  });

  const basketResults = useMemo(() => {
    return basket.map((item) => {
      const dawayaItem = findDawayaIndexItemSync(item.productId.toLowerCase());
      let cheapest: EgyptianCommercialProduct | null = null;
      if (dawayaItem) {
        const classified = getDawayaClassifiedAlternatives(dawayaItem, 16);
        const exact = classified.exactEquivalents.map((x) => dawayaIndexItemToCommercialProduct(x));
        const cheaper = exact.filter((e) => e.priceEgp && e.priceEgp < (item.priceEgp || 0) - 0.5);
        if (cheaper.length > 0) cheapest = cheaper[0];
      } else {
        const alts = getClassifiedAlternatives(item, liveCatalogProducts);
        const cheaper = alts.exactEquivalents.filter((e) => e.priceEgp && e.priceEgp < (item.priceEgp || 0) - 0.5);
        if (cheaper.length > 0) cheapest = cheaper[0];
      }
      const itemPrice = item.priceEgp || 0;
      const genericPrice = cheapest?.priceEgp ?? itemPrice;
      const saved = Math.max(0, itemPrice - genericPrice);
      return { item, cheapest, itemPrice, genericPrice, saved };
    });
  }, [basket, liveCatalogProducts, indexItems]);

  const basketTotalOriginal = useMemo(() => basketResults.reduce((acc, r) => acc + r.itemPrice, 0), [basketResults]);
  const basketTotalGeneric = useMemo(() => basketResults.reduce((acc, r) => acc + r.genericPrice, 0), [basketResults]);
  const basketTotalSaved = Math.max(0, basketTotalOriginal - basketTotalGeneric);
  const basketSavedPercent = basketTotalOriginal > 0 ? Math.round((basketTotalSaved / basketTotalOriginal) * 100) : 0;

  const handleAddToBasket = (prod: EgyptianCommercialProduct) => {
    if (basket.some((b) => b.productId === prod.productId)) return;
    setBasket((prev) => [...prev, prod]);
    setBasketSearchQ('');
  };

  const handleRemoveFromBasket = (productId: string) => {
    setBasket((prev) => prev.filter((b) => b.productId !== productId));
  };

  const basketSearchResults = useMemo(() => {
    const clean = norm(basketSearchQ);
    if (!clean || clean.length < 2) return [];
    const abxMatches = liveCatalogProducts.filter((p) => {
      const hay = norm(`${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition}`);
      return hay.includes(clean);
    }).slice(0, 4);
    const dawayaMatches = searchDawayaIndex(indexItems, { query: basketSearchQ.trim() }, isAr)
      .slice(0, 8 - abxMatches.length)
      .map((item) => dawayaIndexItemToCommercialProduct(item));
    return [...abxMatches, ...dawayaMatches].filter(
      (cand, idx, arr) => arr.findIndex((x) => x.productId === cand.productId) === idx
    );
  }, [basketSearchQ, liveCatalogProducts, indexItems, isAr]);

  const initialProduct = useMemo(() => {
    if (prodParam) {
      const found = liveCatalogProducts.find((p) => p.productId === prodParam);
      if (found) return found;
    }
    if (ingParam) {
      const byIng = liveCatalogProducts.filter(
        (p) => p.activeIngredientId === ingParam && p.priceEgp !== null
      ).sort((a, b) => (b.priceEgp || 0) - (a.priceEgp || 0));
      if (byIng.length > 0) return byIng[0];
    }
    return liveCatalogProducts[0] || EGYPTIAN_COMMERCIAL_PRODUCTS[0];
  }, [ingParam, prodParam, liveCatalogProducts]);

  const [selectedProduct, setSelectedProduct] = useState<EgyptianCommercialProduct>(initialProduct);

  useEffect(() => {
    setSelectedProduct(initialProduct);
  }, [initialProduct]);

  const searchResults = useMemo(() => {
    const clean = norm(searchQuery);
    if (!clean) return [];
    const abxMatches = liveCatalogProducts.filter((p) => {
      const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
      const hay = norm(
        `${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.strength} ${p.manufacturer} ${p.barcode || ''} ${ing?.nameAr || ''} ${ing?.nameEn || ''}`
      );
      return hay.includes(clean);
    }).slice(0, 6);
    const dawayaMatches = searchDawayaIndex(indexItems, { query: searchQuery.trim() }, isAr)
      .slice(0, 12 - abxMatches.length)
      .map((item) => dawayaIndexItemToCommercialProduct(item));
    return [...abxMatches, ...dawayaMatches];
  }, [searchQuery, liveCatalogProducts, indexItems, isAr]);

  const popularShortcuts = useMemo(() => {
    return POPULAR_BRAND_IDS.map((id) => liveCatalogProducts.find((p) => p.productId === id)).filter(
      (p): p is EgyptianCommercialProduct => Boolean(p)
    );
  }, [liveCatalogProducts]);

  const alternatives = useMemo(() => {
    const dawayaItem = findDawayaIndexItemSync(selectedProduct.productId.toLowerCase());
    if (dawayaItem) {
      const classified = getDawayaClassifiedAlternatives(dawayaItem, 18);
      return {
        exactEquivalents: classified.exactEquivalents.map((x) =>
          dawayaIndexItemToCommercialProduct(x)
        ),
        sameIngredientDifferentFormOrStrength:
          classified.sameIngredientDifferentFormOrStrength.map((x) =>
            dawayaIndexItemToCommercialProduct(x)
          ),
        therapeuticClassAlternatives: [],
      };
    }
    return getClassifiedAlternatives(selectedProduct, liveCatalogProducts);
  }, [selectedProduct, liveCatalogProducts, indexItems]);

  const currentIng = useMemo(
    () => ACTIVE_INGREDIENTS.find((a) => a.id === selectedProduct.activeIngredientId),
    [selectedProduct]
  );

  const equivalenceGroupAll = useMemo(() => {
    const list = [selectedProduct, ...alternatives.exactEquivalents].filter((p) => p.priceEgp !== null);
    return list.sort((a, b) => (a.priceEgp ?? 99999) - (b.priceEgp ?? 99999));
  }, [selectedProduct, alternatives.exactEquivalents]);

  const cheapestIdentical = useMemo(() => {
    return equivalenceGroupAll.length > 0 ? equivalenceGroupAll[0] : null;
  }, [equivalenceGroupAll]);

  const selectedPrice = selectedProduct.priceEgp || 0;
  const cheapestPrice = cheapestIdentical?.priceEgp || selectedPrice;
  const savingPerPack = selectedPrice > cheapestPrice ? selectedPrice - cheapestPrice : 0;
  const totalSavings = savingPerPack * packCount;
  const savingPercent = selectedPrice > 0 ? Math.round((savingPerPack / selectedPrice) * 100) : 0;

  return (
    <main className="wrap stack cost-saver-main">
      {/* Hero Banner with Mode Switcher */}
      <section className="card cost-saver-hero" style={{ borderTop: '4px solid #138866' }}>
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
          <div>
            <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 700, marginBottom: '8px' }}>
              💰 {tr(lang, 'مبادرة التوفير الدوائي وتجاوز النواقص • مرخصة من هيئة الدواء المصرية', 'Smart Generic Cost Saver & Shortage Solver • EDA Licensed')}
            </span>
            <h1 style={{ margin: '4px 0 8px' }}>
              {tr(
                lang,
                'حاسبة «البديل الأرخص بنفس الكفاءة» ووفر الروشتة',
                'Generic Cost Saver & Rx Savings Calculator'
              )}
            </h1>
            <p className="muted" style={{ maxWidth: '72ch', margin: 0 }}>
              {tr(
                lang,
                'ابحث عن الدواء الموصوف لك لعرض المثائل المصرية المتطابقة 100% في المادة الفعالة والتركيز والشكل الصيدلاني، واحسب قيمة التوفير الفوري بالجنيه المصري لروشتتك كاملة.',
                'Discover 100% bioequivalent licensed generics across 26,572+ Egyptian medicines, and calculate your total prescription savings in EGP.'
              )}
            </p>
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button
              type="button"
              className={`btn small ${viewMode === 'single' ? '' : 'ghost'}`}
              onClick={() => setViewMode('single')}
            >
              🔍 {tr(lang, 'مقارنة بديل دواء واحد', 'Single Drug Finder')}
            </button>
            <button
              type="button"
              className={`btn small ${viewMode === 'basket' ? '' : 'ghost'}`}
              onClick={() => setViewMode('basket')}
              style={viewMode === 'basket' ? { background: '#138866', color: '#fff' } : { borderColor: '#138866', color: '#138866' }}
            >
              🛒 {tr(lang, `حاسبة وفر روشتة كاملة (${basket.length})`, `Rx Basket Optimizer (${basket.length})`)}
            </button>
            <Link to="/medicines" className="btn ghost small">
              💊 {tr(lang, 'السجل الدوائي الكامل', 'Full Drug Registry')}
            </Link>
          </div>
        </div>

        {/* View Mode 2: Prescription Basket Optimizer Controls */}
        {viewMode === 'basket' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ position: 'relative' }}>
              <label htmlFor="basket-add-input" className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                ➕ {tr(lang, 'أضف دواء آخر إلى روشتتك لحساب توفيره (ابحث في 26,572 دواء):', 'Add another medicine to prescription basket:')}
              </label>
              <input
                id="basket-add-input"
                type="search"
                className="input"
                value={basketSearchQ}
                onChange={(e) => setBasketSearchQ(e.target.value)}
                placeholder={tr(lang, 'اكتب اسم أي دواء في روشتتك لإضافته وسحب بديله تلقائياً...', 'Type any prescribed drug to add to basket...')}
              />
              {basketSearchResults.length > 0 && (
                <div className="cost-search-dropdown" style={{ zIndex: 1100 }}>
                  {basketSearchResults.map((cand) => (
                    <button
                      key={cand.productId}
                      type="button"
                      className="cost-search-option"
                      onClick={() => handleAddToBasket(cand)}
                    >
                      <div>
                        <b>{isAr ? cand.tradeNameAr : cand.tradeNameEn}</b>
                        <span className="small muted" style={{ marginInlineStart: '8px' }}>
                          ({cand.scientificComposition} — {cand.strength})
                        </span>
                      </div>
                      <span className="cost-search-price">
                        {cand.priceEgp ? `+ أضف (${cand.priceEgp.toFixed(2)} ج.م)` : '+ أضف'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode 1: Single Drug Search Input & Pack Count Selector */}
        {viewMode === 'single' && (
          <>
            <div className="cost-saver-controls" style={{ marginTop: '14px' }}>
              <div className="cost-search-col" style={{ position: 'relative' }}>
                <label htmlFor="cost-saver-search-input" className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  🔍 {tr(lang, 'ابحث بالاسم التجاري أو المادة الفعالة أو الباركود:', 'Search by trade name, active ingredient, or barcode:')}
                </label>
                <input
                  id="cost-saver-search-input"
                  type="search"
                  className="input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr(
                    lang,
                    'مثال: أوجمنتين، زيثروماكس، روسيفين، تافانيك، كلاسيد، زينات...',
                    'e.g., Augmentin, Zithromax, Rocephin, Tavanic, Klacid, Zinnat...'
                  )}
                />

                {searchResults.length > 0 && (
                  <div className="cost-search-dropdown">
                    {searchResults.map((item) => (
                      <button
                        key={item.productId}
                        type="button"
                        className="cost-search-option"
                        onClick={() => {
                          setSelectedProduct(item);
                          setSearchQuery('');
                        }}
                      >
                        <div>
                          <b>{isAr ? item.tradeNameAr : item.tradeNameEn}</b>
                          <span className="small muted" style={{ marginInlineStart: '8px' }}>
                            ({item.scientificComposition})
                          </span>
                        </div>
                        <span className="cost-search-price">
                          {item.priceEgp ? `${item.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="cost-pack-col">
                <label htmlFor="cost-pack-select" className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  📦 {tr(lang, 'عدد العبوات المطلوبة للكورس:', 'Number of packs needed:')}
                </label>
                <SmartNativeSelect
                  id="cost-pack-select"
                  className="input"
                  value={packCount}
                  onChange={(e) => setPackCount(Number(e.target.value) || 1)}
                >
                  <option value={1}>{tr(lang, 'عبوة واحدة (1 Pack)', '1 Pack')}</option>
                  <option value={2}>{tr(lang, 'عبوتان (2 Packs)', '2 Packs')}</option>
                  <option value={3}>{tr(lang, '3 عبوات (3 Packs)', '3 Packs')}</option>
                  <option value={4}>{tr(lang, '4 عبوات (4 Packs)', '4 Packs')}</option>
                </SmartNativeSelect>
              </div>
            </div>

            {/* Quick Picks Bar */}
            <div style={{ marginTop: '12px' }}>
              <span className="small muted" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                ⚡ {tr(lang, 'اختر سريعاً من أشهر الأدوية المرتفعة السعر لمقارنة بدائلها:', 'Quick-pick popular high-cost brand medications:')}
              </span>
              <div className="row wrapRow" style={{ gap: '6px' }}>
                {popularShortcuts.map((item) => {
                  const active = item.productId === selectedProduct.productId;
                  return (
                    <button
                      key={item.productId}
                      type="button"
                      onClick={() => setSelectedProduct(item)}
                      className={`chip cost-quick-chip${active ? ' active' : ''}`}
                    >
                      <span>💊 {isAr ? item.tradeNameAr : item.tradeNameEn}</span>
                      {item.priceEgp && (
                        <small style={{ opacity: 0.85 }}>({item.priceEgp} {isAr ? 'ج.م' : 'EGP'})</small>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>

      {/* VIEW MODE 2: PRESCRIPTION BASKET OPTIMIZER BODY */}
      {viewMode === 'basket' && (
        <div className="stack">
          {/* Grand Total Savings Banner */}
          <section
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(13, 31, 56, 0.96) 0%, rgba(19, 136, 102, 0.88) 100%)',
              color: '#fff',
              borderRadius: '20px',
              padding: '24px 20px',
              border: '1.5px solid #CFD29D',
              boxShadow: '0 12px 32px rgba(13, 31, 56, 0.35)',
            }}
          >
            <div className="head" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span
                  className="badge"
                  style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800, marginBottom: '6px' }}
                >
                  🛒 {tr(lang, 'حاسبة وفر الروشتة الذكية من دوايا (DAWAYA)', 'DAWAYA Smart Prescription Basket Optimizer')}
                </span>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.35rem' }}>
                  {tr(lang, 'إجمالي وفر روشتتك بالبدائل المصرية المتطابقة 100%', 'Total Prescription Savings with 100% Bioequivalent Generics')}
                </h2>
              </div>
              {basketResults.length > 0 && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    isAr
                      ? `🛒 روشتة التوفير الذكية من منصة دوايا (DAWAYA):\n` +
                        basketResults
                          .map(
                            (r, i) =>
                              `${i + 1}. ${r.item.tradeNameAr} (${r.itemPrice.toFixed(2)} ج.م) ⬅️ البديل: ${
                                r.cheapest ? `${r.cheapest.tradeNameAr} (${r.genericPrice.toFixed(2)} ج.م — وفر: ${r.saved.toFixed(2)} ج.م)` : 'نفس الصنف متوفر'
                              }`
                          )
                          .join('\n') +
                        `\n--------------------------\n` +
                        `💰 سعر الروشتة الأصلي: ${basketTotalOriginal.toFixed(2)} ج.م\n` +
                        `🟢 سعر البدائل المتطابقة: ${basketTotalGeneric.toFixed(2)} ج.م\n` +
                        `🎉 إجمالي التوفير: ${basketTotalSaved.toFixed(2)} ج.م (${basketSavedPercent}%)\n` +
                        `🔗 فحص بدائل الأدوية: https://mmo277.github.io/DAWAYA/#/cost-saver`
                      : `🛒 Smart Prescription Savings via DAWAYA:\n` +
                        basketResults
                          .map(
                            (r, i) =>
                              `${i + 1}. ${r.item.tradeNameEn} (${r.itemPrice.toFixed(2)} EGP) -> Generic: ${
                                r.cheapest ? `${r.cheapest.tradeNameEn} (${r.genericPrice.toFixed(2)} EGP — Save: ${r.saved.toFixed(2)} EGP)` : 'Standard'
                              }`
                          )
                          .join('\n') +
                        `\n--------------------------\n` +
                        `💰 Original Rx Total: ${basketTotalOriginal.toFixed(2)} EGP\n` +
                        `🟢 Bioequivalent Generics Total: ${basketTotalGeneric.toFixed(2)} EGP\n` +
                        `🎉 Total Savings: ${basketTotalSaved.toFixed(2)} EGP (${basketSavedPercent}%)\n` +
                        `🔗 Compare drugs on DAWAYA: https://mmo277.github.io/DAWAYA/#/cost-saver`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800, whiteSpace: 'nowrap' }}
                >
                  📤 {tr(lang, 'إرسال روشتة التوفير للصيدلي على واتساب', 'Send Savings Rx to WhatsApp')}
                </a>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.16)',
              }}
            >
              <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="small" style={{ opacity: 0.85 }}>{tr(lang, 'سعر الروشتة بالأدوية الموصوفة:', 'Original Prescribed Total:')}</div>
                <b style={{ fontSize: '1.4rem' }}>{basketTotalOriginal.toFixed(2)} {isAr ? 'ج.م' : 'EGP'}</b>
              </div>
              <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="small" style={{ opacity: 0.85 }}>{tr(lang, 'سعر الروشتة بالبدائل المتكافئة:', 'With Bioequivalent Generics:')}</div>
                <b style={{ fontSize: '1.4rem', color: '#CFD29D' }}>{basketTotalGeneric.toFixed(2)} {isAr ? 'ج.م' : 'EGP'}</b>
              </div>
              <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(19, 136, 102, 0.55)', border: '1px solid #CFD29D' }}>
                <div className="small" style={{ color: '#CFD29D' }}>{tr(lang, 'صافي التوفير في الروشتة:', 'Net Prescription Savings:')}</div>
                <b style={{ fontSize: '1.5rem', color: '#fff' }}>
                  وفّر {basketTotalSaved.toFixed(2)} {isAr ? 'ج.م' : 'EGP'} ({basketSavedPercent}%)
                </b>
              </div>
            </div>
          </section>

          {/* Basket Items Table */}
          <section className="card">
            <div className="tablewrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{tr(lang, 'الدواء الموصوف', 'Prescribed Drug')}</th>
                    <th>{tr(lang, 'السعر الأصلي', 'Original Price')}</th>
                    <th>{tr(lang, 'أرخص مثيل متطابق 100% (نفس المادة والتركيز)', 'Cheapest 100% Identical Generic')}</th>
                    <th>{tr(lang, 'سعر البديل', 'Generic Price')}</th>
                    <th>{tr(lang, 'قيمة التوفير', 'Savings')}</th>
                    <th>{tr(lang, 'حذف', 'Remove')}</th>
                  </tr>
                </thead>
                <tbody>
                  {basketResults.map((r, idx) => (
                    <tr key={r.item.productId}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <DosageFormVectorBadge form={r.item.dosageForm} size={18} />
                          <b>{isAr ? r.item.tradeNameAr : r.item.tradeNameEn}</b>
                        </div>
                        <div className="small muted" dir="ltr">{r.item.scientificComposition} — {r.item.strength}</div>
                      </td>
                      <td>
                        <b>{r.itemPrice > 0 ? `${r.itemPrice.toFixed(2)} ج.م` : '—'}</b>
                      </td>
                      <td>
                        {r.cheapest ? (
                          <div>
                            <b style={{ color: '#138866' }}>{isAr ? r.cheapest.tradeNameAr : r.cheapest.tradeNameEn}</b>
                            <div className="small muted">{r.cheapest.manufacturer}</div>
                          </div>
                        ) : (
                          <span className="small muted">{tr(lang, 'هذا الصنف هو الخيار الأوفر أو لا مثيل مسجل بسعر أقل', 'Best price or no cheaper generic')}</span>
                        )}
                      </td>
                      <td>
                        <b style={{ color: '#138866' }}>{r.genericPrice > 0 ? `${r.genericPrice.toFixed(2)} ج.م` : '—'}</b>
                      </td>
                      <td>
                        {r.saved > 0 ? (
                          <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800 }}>
                            ⬇ وفّر {r.saved.toFixed(2)} ج.م
                          </span>
                        ) : (
                          <span className="small muted">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn small ghost"
                          onClick={() => handleRemoveFromBasket(r.item.productId)}
                          title={tr(lang, 'حذف من الروشتة', 'Remove')}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* VIEW MODE 1: SINGLE DRUG COMPARISON BODY */}
      {viewMode === 'single' && (
        <>
          {/* Side-by-Side Comparison: Selected Brand vs Cheapest Exact Generic */}
          <div className="cost-comparison-grid">
            {/* Card A: Selected Prescribed Product */}
            <section className="card cost-card-prescribed">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                  📋 {tr(lang, 'الدواء المختار / الموصوف', 'Selected / Prescribed Brand')}
                </span>
                <span className="small muted">{selectedProduct.manufacturer} ({selectedProduct.countryOfOrigin})</span>
              </div>
              <h2 style={{ margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DosageFormVectorBadge form={selectedProduct.dosageForm} size={22} />
                <span>{isAr ? selectedProduct.tradeNameAr : selectedProduct.tradeNameEn}</span>
              </h2>
              <p className="small muted" style={{ margin: '0 0 10px' }}>
                {selectedProduct.scientificComposition} · {pick(selectedProduct.dosageFormLabel, lang)}
              </p>

              <div className="cost-price-display">
                <div>
                  <span className="small muted">{tr(lang, 'سعر العبوة الواحدة:', 'Single Pack Price:')}</span>
                  <strong className="cost-big-num">
                    {selectedPrice > 0 ? `${selectedPrice.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                  </strong>
                </div>
                {packCount > 1 && (
                  <div>
                    <span className="small muted">{tr(lang, `إجمالي ${packCount} عبوات:`, `Total (${packCount} packs):`)}</span>
                    <strong className="cost-sub-num">
                      {(selectedPrice * packCount).toFixed(2)} {isAr ? 'ج.م' : 'EGP'}
                    </strong>
                  </div>
                )}
              </div>
              <div className="small muted" style={{ marginTop: '8px' }}>
                📦 {pick(selectedProduct.packDetails, lang)} · {pick(selectedProduct.unitPriceNote, lang)}
              </div>
            </section>

            {/* Card B: Best Value / Cheapest Identical Equivalent */}
            <section className="card cost-card-cheapest">
              {cheapestIdentical && cheapestIdentical.productId !== selectedProduct.productId && savingPerPack > 0 ? (
                <>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800 }}>
                      ✅ {tr(lang, `المثيل المتطابق الأوفر (توفير ${savingPercent}%)`, `Cheapest Exact Equivalent (Save ${savingPercent}%)`)}
                    </span>
                    <span className="small muted">{cheapestIdentical.manufacturer} ({cheapestIdentical.countryOfOrigin})</span>
                  </div>
                  <h2 style={{ margin: '8px 0 4px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DosageFormVectorBadge form={cheapestIdentical.dosageForm} size={22} />
                    <span>{isAr ? cheapestIdentical.tradeNameAr : cheapestIdentical.tradeNameEn}</span>
                  </h2>
                  <p className="small muted" style={{ margin: '0 0 10px' }}>
                    {cheapestIdentical.scientificComposition} · {pick(cheapestIdentical.dosageFormLabel, lang)}
                  </p>

                  <div className="cost-price-display savings">
                    <div>
                      <span className="small muted">{tr(lang, 'سعر المثيل الأوفر:', 'Generic Pack Price:')}</span>
                      <strong className="cost-big-num green">
                        {cheapestPrice.toFixed(2)} {isAr ? 'ج.م' : 'EGP'}
                      </strong>
                    </div>
                    <div className="cost-saving-pill">
                      <span>🎉 {tr(lang, 'إجمالي التوفير المباشر:', 'Total Direct Savings:')}</span>
                      <strong>
                        {totalSavings.toFixed(2)} {isAr ? 'ج.م' : 'EGP'} ({savingPercent}%)
                      </strong>
                    </div>
                  </div>
                  <div className="small muted" style={{ marginTop: '8px' }}>
                    📦 {pick(cheapestIdentical.packDetails, lang)} · {pick(cheapestIdentical.unitPriceNote, lang)}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '8px' }}>
                  <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800, alignSelf: 'flex-start' }}>
                    🏆 {tr(lang, 'أنت بالفعل على الاختيار الأوفر سعراً!', 'Already the Most Cost-Effective Option!')}
                  </span>
                  <h3 style={{ margin: '4px 0', color: '#15803d' }}>
                    {tr(
                      lang,
                      'هذا المستحضر هو بالفعل الأقل سعراً ضمن مجموعته المتطابقة في التركيز والشكل الدوائي.',
                      'This package is already the lowest-priced option within its exact strength and dosage form group.'
                    )}
                  </h3>
                  <p className="small muted" style={{ margin: 0 }}>
                    {tr(
                      lang,
                      'يمكنك استعراض باقي المثائل المتطابقة بالأسفل لمعرفة البدائل المتاحة في حال نقص هذا الصنف بالصيدليات.',
                      'Browse the table below to view all other exact generic equivalents in case this brand is out of stock.'
                    )}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Table 1: All 100% Identical Generic Equivalents */}
          <section className="card highlight-card">
            <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <div>
                <h2 style={{ margin: 0 }}>
                  🎯{' '}
                  {tr(
                    lang,
                    `جميع المثائل المتطابقة 100% في المادة الفعالة والتركيز (${equivalenceGroupAll.length} مستحضرات)`,
                    `All 100% Identical Generic Equivalents (${equivalenceGroupAll.length} Packages)`
                  )}
                </h2>
                <p className="small muted" style={{ margin: '4px 0 0' }}>
                  {tr(
                    lang,
                    'مستحضرات صيدلانية متطابقة 100% معتمدة في مصر (نفس المادة الفعالة، نفس التركيز، نفس الشكل الصيدلاني وطريق الإعطاء):',
                    '100% bioequivalent pharmaceuticals licensed in Egypt (same API, strength, dosage form & route):'
                  )}
                </p>
              </div>
            </div>

            <div className="tablewrap" style={{ marginTop: '12px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{tr(lang, 'المستحضر التجاري', 'Brand Name')}</th>
                    <th>{tr(lang, 'التركيز والعبوة', 'Strength & Pack')}</th>
                    <th>{tr(lang, 'الشركة المنتجة', 'Manufacturer')}</th>
                    <th>{tr(lang, 'السعر الرسمي', 'Price')}</th>
                    <th>{tr(lang, 'مقارنة الوفر', 'Savings Comparison')}</th>
                  </tr>
                </thead>
                <tbody>
                  {equivalenceGroupAll.map((pkg) => {
                    const price = pkg.priceEgp || 0;
                    const diffPerPack = selectedPrice > 0 ? selectedPrice - price : 0;
                    const diffTotal = diffPerPack * packCount;
                    const isSelected = pkg.productId === selectedProduct.productId;
                    return (
                      <tr key={pkg.productId} style={isSelected ? { background: 'rgba(19, 136, 102, 0.08)' } : undefined}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <DosageFormVectorBadge form={pkg.dosageForm} size={18} />
                            <b>{isAr ? pkg.tradeNameAr : pkg.tradeNameEn}</b>
                          </div>
                          <div className="small muted">{isAr ? pkg.tradeNameEn : pkg.tradeNameAr}</div>
                        </td>
                        <td>
                          <b dir="ltr">{pkg.strength}</b>
                          <div className="small muted">{pick(pkg.packDetails, lang)}</div>
                        </td>
                        <td>
                          <div>{pkg.manufacturer}</div>
                          <div className="small muted">{pkg.countryOfOrigin}</div>
                        </td>
                        <td>
                          <b style={{ color: '#15803d', fontSize: '1rem' }}>
                            {price > 0 ? `${price.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                          </b>
                          <div className="small muted">{pick(pkg.unitPriceNote, lang)}</div>
                        </td>
                        <td>
                          {isSelected ? (
                            <span className="small muted">{tr(lang, 'الدواء الأساسي للمقارنة', 'Baseline selected drug')}</span>
                          ) : diffTotal > 0 ? (
                            <div className="row wrapRow" style={{ gap: '6px' }}>
                              <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                                ⬇ {tr(lang, `وفّر ${diffTotal.toFixed(2)} ج.م`, `Save ${diffTotal.toFixed(2)} EGP`)}
                              </span>
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(
                                  isAr
                                    ? `💊 بديل متطابق في المادة الفعالة والتركيز على منصة دوايا:\n• الدواء البديل: ${pkg.tradeNameAr} (${pkg.tradeNameEn}) — السعر: ${price.toFixed(2)} ج.م (توفير ${diffTotal.toFixed(2)} ج.م)\n• المادة الفعالة: ${pkg.scientificComposition}`
                                    : `💊 100% Bioequivalent Generic on DAWAYA:\n• Generic: ${pkg.tradeNameEn} (${pkg.tradeNameAr}) — Price: ${price.toFixed(2)} EGP (Save ${diffTotal.toFixed(2)} EGP)\n• Active Ingredient: ${pkg.scientificComposition}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="badge"
                                style={{ background: 'rgba(19, 136, 102, 0.14)', color: '#138866', textDecoration: 'none', fontWeight: 700 }}
                                title={isAr ? 'إرسال هذا البديل عبر واتساب' : 'Share this generic on WhatsApp'}
                              >
                                📤 {isAr ? 'واتساب' : 'Share'}
                              </a>
                            </div>
                          ) : diffTotal < 0 ? (
                            <span className="small" style={{ color: '#b45309' }}>
                              +{Math.abs(diffTotal).toFixed(2)} {isAr ? 'ج.م أعلى' : 'EGP more'}
                            </span>
                          ) : (
                            <span className="small muted">{tr(lang, 'نفس السعر', 'Same price')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Table 2: Same Active Ingredient in Other Strengths / Dosage Forms (Shortage Solver) */}
          {alternatives.sameIngredientDifferentFormOrStrength.length > 0 && (
            <section className="card">
              <h2 style={{ margin: '0 0 6px' }}>
                🔄{' '}
                {tr(
                  lang,
                  `نفس المادة الفعالة بتركيزات أو أشكال صيدلانية أخرى (${alternatives.sameIngredientDifferentFormOrStrength.length} عبوة - لحل مشكلة النواقص)`,
                  `Same Active Ingredient in Other Strengths or Forms (${alternatives.sameIngredientDifferentFormOrStrength.length} Packages)`
                )}
              </h2>
              <p className="small muted" style={{ margin: '0 0 10px' }}>
                {tr(
                  lang,
                  '⚠️ تنبيه صيدلاني: هذه العبوات تحتوي على نفس المادة الفعالة ولكن بتركيز أو شكل دوائي مختلف؛ استشر الطبيب أو الصيدلي لضبط الجرعة قبل الاستبدال:',
                  '⚠️ Pharmacist Note: These packages contain the exact same active ingredient but differ in strength or dosage form; verify dose conversion with your pharmacist:'
                )}
              </p>
              <div className="tablewrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{tr(lang, 'الاسم التجاري', 'Trade Name')}</th>
                      <th>{tr(lang, 'التركيز والشكل الصيدلاني', 'Strength & Form')}</th>
                      <th>{tr(lang, 'الشركة المصنعة', 'Manufacturer')}</th>
                      <th>{tr(lang, 'السعر الرسمي', 'Price (EGP)')}</th>
                      <th>{tr(lang, 'مقارنة كبديل أساسي', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternatives.sameIngredientDifferentFormOrStrength.map((pkg) => (
                      <tr key={pkg.productId}>
                        <td>
                          <b>{isAr ? pkg.tradeNameAr : pkg.tradeNameEn}</b>
                          <div className="small muted">{isAr ? pkg.tradeNameEn : pkg.tradeNameAr}</div>
                        </td>
                        <td>
                          <b dir="ltr">{pkg.strength}</b>
                          <div className="small muted">{pick(pkg.dosageFormLabel, lang)} · {pick(pkg.packDetails, lang)}</div>
                        </td>
                        <td>{pkg.manufacturer}</td>
                        <td>
                          <b style={{ color: '#15803d' }}>
                            {pkg.priceEgp ? `${pkg.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                          </b>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn ghost small"
                            onClick={() => {
                              setSelectedProduct(pkg);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            {tr(lang, 'اختر للمقارنة ↑', 'Select & Compare ↑')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Educational Card: Difference between Exact Generic vs Therapeutic Alternative */}
      <section className="card" style={{ borderInlineStart: '4px solid #138866' }}>
        <h3 style={{ margin: '0 0 8px' }}>
          💡 {tr(lang, 'كيف تفرق بين «المثيل المتطابق» و«البديل العلاجي» في الصيدلية المصرية؟', 'Understanding Exact Generics vs. Therapeutic Alternatives')}
        </h3>
        <div className="grid" style={{ gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--tint)' }}>
            <b>✅ {tr(lang, '1. المثيل الدوائي المتطابق (Generic Equivalent):', '1. Exact Generic Equivalent:')}</b>
            <p className="small" style={{ margin: '6px 0 0' }}>
              {tr(
                lang,
                'يحتوي على نفس المادة الفعالة وبنفس التركيز ونفس الشكل الدوائي تماماً (مثل أوجمنتين 1 جم = هاي بيوتك 1 جم = كورام 1 جم = إيموكسكلاف 1 جم)، وجميعها مرخصة من هيئة الدواء المصرية وتخضع لدراسات التكافؤ الحيوي (Bioequivalence).',
                'Contains the exact same active ingredient, strength, and dosage form (e.g., Augmentin 1g = Hibiotic 1g = Curam 1g), licensed by the Egyptian Drug Authority (EDA) with verified bioequivalence.'
              )}
            </p>
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--tint)' }}>
            <b>⚠️ {tr(lang, '2. البديل العلاجي (Therapeutic Alternative):', '2. Therapeutic Alternative:')}</b>
            <p className="small" style={{ margin: '6px 0 0' }}>
              {tr(
                lang,
                'يحتوي على مادة فعالة مختلفة تنتمي لنفس العائلة أو تعالج نفس العدوى، ولا يجوز صرفه إلا بعد الرجوع للطبيب المعالج لاختلاف الجرعات والحساسية والتداخلات.',
                'Contains a different active ingredient from a related class and requires physician authorization before substitution.'
              )}
            </p>
          </div>
        </div>
      </section>

      {canEditLive && (
        <div className="card" style={{ border: '2px dashed #0284c7', background: 'var(--tint)' }}>
          <div className="head" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <b>🛠️ {tr(lang, 'وضع المحرر/الأدمن: تعديل بيانات وسعر الدواء المختار حالياً', 'Editor Mode: Edit Selected Commercial Product')}</b>
            <button type="button" className="btn small" onClick={() => setEditingProd(selectedProduct)}>
              ✏️ {tr(lang, `تعديل ${selectedProduct.tradeNameAr}`, `Edit ${selectedProduct.tradeNameEn}`)}
            </button>
          </div>
        </div>
      )}
      {editingProd && (
        <QuickProductEditorModal
          product={editingProd}
          uid={user?.uid}
          onClose={() => setEditingProd(null)}
        />
      )}
      <Disclaimer />
    </main>
  );
}
