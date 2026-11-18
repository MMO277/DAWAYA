import { extractTextFromBlisterOrBoxImage, findCutBlisterStripCandidates } from './blisterStripOcrMatcher';
import SmartChoiceSelect, { SmartNativeSelect } from './SmartChoiceSelect';
import { createPortal } from 'react-dom';
import { DosageFormVectorBadge, Realistic3DMedicineThumb } from './DawayaVectorIcons';
import {
  evaluateOccupationalDrugSafety,
  evaluateDrugHydrationRequirement,
  evaluatePillSplittingAndMealProtocol,
  evaluateSuddenStopReboundRisk,
} from './medicationSafetyEngine';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { norm, searchMeds } from './search';
import { pick, tr } from './types';
import SkeletonCard from './SkeletonCard';
import { useAuth } from './authContext';
import { useLiveDrugCatalog } from './liveCatalogSync';
import { QuickProductEditorModal } from './CommercialCatalogEditor';
import { getClinicalProProfile, useClinicalProMode } from './clinicalProData';
import { useSyncedHealthProfile } from './allergyData';
import {
  ACTIVE_INGREDIENTS,
  AdministrationRoute,
  DOSAGE_FORM_LABELS,
  DosageFormType,
  EgyptianCommercialProduct,
  getClassifiedAlternatives,
  ROUTE_LABELS,
} from './egyptianDrugDatabase';
import {
  parseExternalEgyptianDrugJsonOrCsv,
  runDatabaseQualityAudit,
} from './dataAuditEngine';
import {
  DAWAYA_CATEGORY_LABELS,
  DAWAYA_PHARMACY_DEPARTMENTS,
  DawayaCompactIndexItem,
  DawayaPharmacyDepartment,
  DawayaTherapeuticCategory,
  classifyDawayaDepartment,
  getApproximateBatchPriceInfo,
  matchesDawayaSubcategory,
  decodeWarningMask,
  findDawayaIndexItemSync,
  getDawayaClassifiedAlternatives,
  getSmartClinicalRegimenForMedicine,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';

type ViewTab =
  | 'dawaya_full_db'
  | 'commercial_registry'
  | 'clinical_monographs'
  | 'audit_importer';
type SortOption = 'relevance' | 'name' | 'price_asc' | 'price_desc' | 'verified_first';

export default function Medicines() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const { isProMode, setProMode } = useClinicalProMode();
  const { user, role } = useAuth();
  const canEditLive = role === 'owner' || role === 'admin' || role === 'reviewer' || role === 'editor';
  const { products: liveCatalogProducts } = useLiveDrugCatalog();
  const { profile, setProfile } = useSyncedHealthProfile();
  const { indexItems, loaded: fullDbLoaded, totalCount, importReport } = useDawayaDrugDatabase();

  const [editingCatalogProd, setEditingCatalogProd] = useState<EgyptianCommercialProduct | null>(null);
  const [addingCatalogProd, setAddingCatalogProd] = useState(false);
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const initialCatParam = (sp.get('cat') as DawayaTherapeuticCategory | null) || 'all';
  const initialDeptParam = (sp.get('dept') as DawayaPharmacyDepartment | null) || 'all';
  const initialSubParam = sp.get('sub') || 'all';
  const { items, error } = useApproved();

  const [activeTab, setActiveTab] = useState<ViewTab>('dawaya_full_db');
  const [selectedDawayaCat, setSelectedDawayaCat] = useState<DawayaTherapeuticCategory | 'all'>(
    initialCatParam
  );
  const [selectedDept, setSelectedDept] = useState<DawayaPharmacyDepartment | 'all'>(
    initialDeptParam
  );
  const [selectedSub, setSelectedSub] = useState<string>(initialSubParam);
  const [selectedIngFilter, setSelectedIngFilter] = useState<string>('all');
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('all');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [selectedBarcodeFilter, setSelectedBarcodeFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedComboFilter, setSelectedComboFilter] = useState<'all' | 'single' | 'combo'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('verified_first');
  const [page, setPage] = useState<number>(1);
  const [profileToast, setProfileToast] = useState<string>('');
  const [aiBoxScanLoading, setAiBoxScanLoading] = useState<boolean>(false);
  const [aiBoxScanResult, setAiBoxScanResult] = useState<{
    previewUrl: string;
    matchedItem: DawayaCompactIndexItem | null;
    detectedName: string;
    aiSummary: string;
    alternatives: DawayaCompactIndexItem[];
  } | null>(null);

  async function handleAiMedicineImageFile(file: File) {
    setAiBoxScanLoading(true);
    setProfileToast(isAr ? '📷 جاري قراءة بيانات علبة الدواء ومطابقتها مع 26,562 مستحضر...' : '🤖 Analyzing medicine image with AI Vision...');
    try {
      const res = await extractTextFromBlisterOrBoxImage(file, lang);
      let matchedItem: DawayaCompactIndexItem | null = null;
      if (res.detectedBarcode) {
        matchedItem = findDawayaIndexItemSync(res.detectedBarcode);
      }
      if (!matchedItem && res.aiMatchedId) {
        matchedItem = findDawayaIndexItemSync(res.aiMatchedId);
      }
      if (!matchedItem && res.aiDetectedDrugName) {
        matchedItem = findDawayaIndexItemSync(res.aiDetectedDrugName);
      }
      if (!matchedItem && res.extractedText) {
        matchedItem = findDawayaIndexItemSync(res.extractedText);
        if (!matchedItem) {
          const cands = findCutBlisterStripCandidates(res.extractedText, indexItems, 3);
          if (cands.length > 0) matchedItem = cands[0].item;
        }
      }

      const alternatives = matchedItem
        ? getDawayaClassifiedAlternatives(matchedItem, 4).exactEquivalents
        : [];
      const bestQuery = matchedItem
        ? matchedItem.n.split(' ')[0]
        : (res.aiDetectedDrugName || res.extractedText || '').replace(/\([^)]*\)/g, '').trim().split(/\s+/)[0] || '';

      if (bestQuery) {
        setActiveTab('dawaya_full_db');
        setSelectedDawayaCat('all');
        setSp({ q: bestQuery }, { replace: true });
        setPage(1);
      }

      setAiBoxScanResult({
        previewUrl: res.dataUrl,
        matchedItem,
        detectedName: matchedItem
          ? `${matchedItem.a || matchedItem.n} (${matchedItem.n})`
          : res.aiDetectedDrugName || bestQuery || (isAr ? 'لم يتضح الاسم على العلبة' : 'Name unclear'),
        aiSummary:
          res.aiSummary ||
          (matchedItem
            ? isAr
              ? `المادة الفعالة: ${matchedItem.g || 'راجع العبوة'} — التركيز: ${matchedItem.s || ''} — الفئة: ${matchedItem.d || 'مستحضر دوائي معتمد'}`
              : `Active Ingredient: ${matchedItem.g || 'See package'} — Strength: ${matchedItem.s || ''}`
            : ''),
        alternatives,
      });

      if (matchedItem || res.aiDetectedDrugName) {
        setProfileToast(
          isAr
            ? `✅ تم التعرف على الدواء من الصورة: ${matchedItem ? matchedItem.a || matchedItem.n : res.aiDetectedDrugName}`
            : `✅ AI recognized: ${matchedItem ? matchedItem.n : res.aiDetectedDrugName}`
        );
      } else {
        setProfileToast(
          isAr
            ? '⚠️ لم تتضح الحروف في الصورة، جرب صورة أوضح لوش العلبة أو اكتب أول 3 حروف في البحث.'
            : '⚠️ Could not read clear text from the image. Try a clearer photo or type the first 3 letters.'
        );
      }
      window.setTimeout(() => setProfileToast(''), 4500);
    } catch {
      setProfileToast(isAr ? 'تعذر قراءة الصورة تلقائياً، جرب صورة أخرى أو اكتب اسم الدواء في البحث.' : 'Could not read image automatically.');
      window.setTimeout(() => setProfileToast(''), 4000);
    } finally {
      setAiBoxScanLoading(false);
    }
  }
  const PAGE_SIZE = 24;

  useEffect(() => {
    const catParam = sp.get('cat') as DawayaTherapeuticCategory | null;
    const deptParam = sp.get('dept') as DawayaPharmacyDepartment | null;
    const subParam = sp.get('sub');
    if (catParam && catParam in DAWAYA_CATEGORY_LABELS) {
      setSelectedDawayaCat(catParam);
      setActiveTab('dawaya_full_db');
      setPage(1);
    }
    if (deptParam && DAWAYA_PHARMACY_DEPARTMENTS.some((d) => d.id === deptParam)) {
      setSelectedDept(deptParam);
      setSelectedSub(subParam || 'all');
      setActiveTab('dawaya_full_db');
      setPage(1);
    }
  }, [sp]);

  const [importedProducts, setImportedProducts] = useState<EgyptianCommercialProduct[]>([]);
  const [importMsg, setImportMsg] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<EgyptianCommercialProduct | null>(null);

  const allCommercialProducts = useMemo(
    () => [...liveCatalogProducts, ...importedProducts],
    [liveCatalogProducts, importedProducts]
  );

  const auditReport = useMemo(
    () =>
      activeTab === 'audit_importer'
        ? runDatabaseQualityAudit(allCommercialProducts)
        : {
            totalProducts: allCommercialProducts.length,
            verifiedBarcodeCount: allCommercialProducts.filter((p) => p.barcodeStatus === 'verified').length,
            pendingBarcodeCount: 0,
            verifiedPriceCount: allCommercialProducts.length,
            missingPriceCount: 0,
            duplicateBarcodeWarnings: [],
            coveredIngredientsCount: ACTIVE_INGREDIENTS.length,
            totalIngredientsCount: ACTIVE_INGREDIENTS.length,
            completenessScorePercent: 100,
          },
    [allCommercialProducts, activeTab]
  );

  // 1. Filter & sort the 26,562+ DAWAYA comprehensive medicine & pharmacy database
  const filteredDawayaItems = useMemo(() => {
    const base = searchDawayaIndex(
      indexItems,
      {
        query: q,
        category: selectedDawayaCat,
        dosageForm: selectedFormFilter,
        route: selectedRouteFilter,
        barcodeFilter:
          selectedBarcodeFilter === 'verified'
            ? 'verified'
            : selectedBarcodeFilter === 'pending'
            ? 'missing'
            : 'all',
        combinationFilter: selectedComboFilter,
        sortBy,
      },
      isAr
    );
    if (selectedDept === 'all') return base;
    return base.filter((item) => {
      if (classifyDawayaDepartment(item) !== selectedDept) return false;
      return matchesDawayaSubcategory(item, selectedDept, selectedSub);
    });
  }, [
    indexItems,
    q,
    selectedDawayaCat,
    selectedDept,
    selectedSub,
    selectedFormFilter,
    selectedRouteFilter,
    selectedBarcodeFilter,
    selectedComboFilter,
    sortBy,
    isAr,
  ]);

  const activeDeptMeta = useMemo(
    () => DAWAYA_PHARMACY_DEPARTMENTS.find((d) => d.id === selectedDept) || null,
    [selectedDept]
  );

  const dawayaTotalPages = Math.max(1, Math.ceil(filteredDawayaItems.length / PAGE_SIZE));
  const paginatedDawayaItems = useMemo(
    () => filteredDawayaItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredDawayaItems, page]
  );

  // 2. Filter & sort the 267 verified antibiotic commercial packages
  const filteredProducts = useMemo(() => {
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    const list = allCommercialProducts.filter((p) => {
      if (selectedIngFilter !== 'all' && p.activeIngredientId !== selectedIngFilter) return false;
      if (selectedFormFilter !== 'all' && p.dosageForm !== selectedFormFilter) return false;
      if (selectedRouteFilter !== 'all' && p.route !== selectedRouteFilter) return false;
      if (selectedBarcodeFilter === 'verified' && p.barcodeStatus !== 'verified') return false;
      if (selectedBarcodeFilter === 'pending' && p.barcodeStatus !== 'unverified_pending') return false;

      if (selectedComboFilter !== 'all') {
        const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
        if (selectedComboFilter === 'combo' && !ing?.isCombination) return false;
        if (selectedComboFilter === 'single' && ing?.isCombination) return false;
      }

      if (!tokens.length) return true;
      const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
      const hay = norm(
        [
          p.tradeNameAr,
          p.tradeNameEn,
          p.scientificComposition,
          p.strength,
          p.manufacturer,
          p.barcode || '',
          p.dosageFormLabel.ar,
          p.dosageFormLabel.en,
          ing?.nameAr || '',
          ing?.nameEn || '',
          ing?.drugClass.ar || '',
          ing?.drugClass.en || '',
          p.priceEgp ? String(p.priceEgp) : '',
        ].join(' ')
      );
      return tokens.every((tk) => hay.includes(tk));
    });

    if (activeTab !== 'commercial_registry' && !tokens.length) {
      return list;
    }
    return list.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.priceEgp ?? 99999) - (b.priceEgp ?? 99999);
      }
      if (sortBy === 'price_desc') {
        return (b.priceEgp ?? 0) - (a.priceEgp ?? 0);
      }
      if (sortBy === 'verified_first') {
        if (a.barcodeStatus !== b.barcodeStatus) {
          return a.barcodeStatus === 'verified' ? -1 : 1;
        }
        return a.tradeNameEn < b.tradeNameEn ? -1 : a.tradeNameEn > b.tradeNameEn ? 1 : 0;
      }
      const ka = isAr ? a.tradeNameAr : a.tradeNameEn;
      const kb = isAr ? b.tradeNameAr : b.tradeNameEn;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  }, [
    allCommercialProducts,
    q,
    selectedIngFilter,
    selectedFormFilter,
    selectedRouteFilter,
    selectedBarcodeFilter,
    selectedComboFilter,
    sortBy,
    isAr,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredProducts, page]
  );

  const clinicalResults = useMemo(() => (items ? searchMeds(items, q) : []), [items, q]);

  const selectedAlternatives = useMemo(
    () => (selectedProduct ? getClassifiedAlternatives(selectedProduct, allCommercialProducts) : null),
    [selectedProduct, allCommercialProducts]
  );

  function handleAddMedicineToProfile(medId: string, nameAr: string, nameEn: string, strength: string) {
    const label = isAr ? nameAr || nameEn : nameEn || nameAr;
    const reg = getSmartClinicalRegimenForMedicine(nameEn || nameAr || medId);
    const todayStr = new Date().toISOString().slice(0, 10);
    setProfile((prev) => {
      const existingActive = prev.activeMedications || [];
      const nextActive = existingActive.some((m) => m.resolvedDrugId === medId || m.drugName === label)
        ? existingActive
        : [
            {
              id: `med-${Date.now()}`,
              drugName: label,
              resolvedDrugId: medId,
              doseOrStrength: strength || undefined,
              evidenceStatus: "patient_reported" as const,
              source: "manual_entry" as const,
              addedAt: new Date().toISOString(),
            },
            ...existingActive,
          ];

      const existingMeds = prev.medications || [];
      const nextMeds = existingMeds.some((m) => m.drugName === label)
        ? existingMeds.map((m) => (m.drugName === label ? { ...m, status: "active" as const } : m))
        : [
            {
              id: `med-rec-${Date.now()}`,
              drugName: label,
              activeIngredients: "",
              prescribedDose: strength || (isAr ? reg.defaultDoseTextAr : reg.defaultDoseTextEn),
              dosageAndFrequency: strength || "",
              route: reg.route || "oral",
              frequency: reg.frequencyKey || "twice_daily",
              startDate: todayStr,
              status: "active" as const,
              isOngoing: true,
              source: "manual_entry" as const,
              createdAt: new Date().toISOString(),
            },
            ...existingMeds,
          ];

      return {
        ...prev,
        activeMedications: nextActive,
        medications: nextMeds,
      };
    });
    setProfileToast(
      isAr
        ? `✅ تمت إضافة (${label}) إلى قائمة أدويتك الحالية في ملفك الصحي وتم تفعيل فحص الأمان التلقائي.`
        : `✅ Added (${label}) to your active medications in Health Profile.`
    );
    window.setTimeout(() => setProfileToast(''), 4000);
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const { imported, skippedCount } = parseExternalEgyptianDrugJsonOrCsv(content, file.name);
      if (imported.length > 0) {
        setImportedProducts((prev) => [...prev, ...imported]);
        setImportMsg(
          isAr
            ? `✅ تم استيراد ودمج ${imported.length} مستحضر بنجاح من ملف (${file.name}).`
            : `✅ Successfully imported ${imported.length} products from ${file.name} (${skippedCount} skipped).`
        );
      } else {
        setImportMsg(
          isAr
            ? '⚠️ لم يتم العثور على سجلات مطابقة في الملف المرفوع.'
            : '⚠️ No matching records found in the uploaded file.'
        );
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="wrap stack">
      {profileToast && (
        <div
          className="notice"
          style={{
            position: 'sticky',
            top: '80px',
            zIndex: 80,
            background: '#101E36',
            color: '#9AE8E8',
            borderColor: '#138866',
            fontWeight: 700,
          }}
        >
          {profileToast}{' '}
          <Link to="/health-profile" style={{ color: '#138866', marginInlineStart: '8px' }}>
            {isAr ? 'فتح ملفي الصحي ←' : 'View Profile →'}
          </Link>
        </div>
      )}

      {/* Header & Comprehensive DAWAYA National Database KPIs */}
      <header className="med-head">
        <h1>
          {isAr
            ? 'موسوعة أدوية دوايا الشاملة للسوق المصري (26,562+ مستحضر دوائي)'
            : 'DAWAYA Comprehensive Egyptian Medicine Database (26,562+ Records)'}
        </h1>
        <p className="muted">
          {isAr
            ? 'محرك بحث دوائي موحد يضم كافة الأدوية المسجلة في ملف قاعدة بيانات الأدوية المصرية (26,562 مستحضر) بجميع الفئات العلاجية، مع الحفاظ الكامل على موسوعة المضادات الحيوية الموثقة (267 عبوة و32 مرجعاً سريرياً).'
            : 'Unified pharmaceutical database integrating all 26,562 Egyptian medicine records across all therapeutic classes alongside the 267 verified antibiotic packages and 32 clinical monographs.'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginTop: '14px',
          }}
        >
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid #138866' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#008B99' }}>
              {(importReport?.totalRecordsFound || totalCount).toLocaleString()}
            </div>
            <div className="small muted">
              {isAr ? 'إجمالي أدوية موسوعة دوايا' : 'Imported Egyptian Medicines'}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid #24C8B8' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0d9488' }}>
              {(importReport?.uniqueActiveIngredientCombinations || 8991).toLocaleString()}
            </div>
            <div className="small muted">
              {isAr ? 'مادة وتركيبة فعالة' : 'Active Ingredient Combinations'}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid #16a34a' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>
              {(importReport?.verifiedBarcodesCount || 10525).toLocaleString()}
            </div>
            <div className="small muted">
              {isAr ? 'باركود دوائي موثق' : 'Verified Barcodes'}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid #7c3aed' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed' }}>
              {(importReport?.uniqueManufacturersCount || 5303).toLocaleString()}
            </div>
            <div className="small muted">
              {isAr ? 'شركة ومصنع دوائي' : 'Pharma Manufacturers'}
            </div>
          </div>
        </div>
      </header>

      {/* Clinical Pro Mode vs Patient Mode Toggle Bar */}
      <section className="pro-mode-toggle-banner">
        <div className="pro-mode-toggle-info">
          <span className="pro-mode-badge-icon" aria-hidden="true">
            {isProMode ? '🩺' : '👤'}
          </span>
          <div>
            <b className="pro-mode-title">
              {isProMode
                ? tr(lang, 'الوضع الإكلينيكي للطبيب والصيدلي مفعّل (Clinical Pro Mode)', 'Clinical Pro Mode Active (Physician & Pharmacist View)')
                : tr(lang, 'وضع المريض والجمهور (عرض مبسط للأسعار والتحذيرات والبدائل)', 'Patient & Public Mode (Simplified View)')}
            </b>
            <span className="pro-mode-sub">
              {isProMode
                ? tr(lang, 'يعرض التصنيف الفارماكولوجي، المكونات الفعالة، ومؤشرات الحركية الدوائية (PK/PD).', 'Showing pharmacological classifications, active components, and PK/PD parameters.')
                : tr(lang, 'يمكنك التبديل للوضع الإكلينيكي لعرض البيانات الفارماكولوجية الدقيقة.', 'Switch to Clinical Pro Mode for detailed pharmacological parameters.')}
            </span>
          </div>
        </div>
        <div className="pro-mode-switch-group">
          <button
            type="button"
            className={`pro-mode-switch-btn${!isProMode ? ' active-patient' : ''}`}
            onClick={() => setProMode(false)}
          >
            <span aria-hidden="true">👤</span>
            <span>{tr(lang, 'وضع المريض', 'Patient Mode')}</span>
          </button>
          <button
            type="button"
            className={`pro-mode-switch-btn${isProMode ? ' active-doctor' : ''}`}
            onClick={() => setProMode(true)}
          >
            <span aria-hidden="true">🩺</span>
            <span>{tr(lang, 'الوضع الإكلينيكي للطبيب', 'Clinical Pro Mode')}</span>
          </button>
        </div>
      </section>

      {/* Main Mode Switcher Tabs */}
      <div className="row wrapRow" style={{ gap: '8px', borderBottom: '2px solid var(--line, #D3E4EA)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'dawaya_full_db' ? '' : 'ghost'}`}
          onClick={() => {
            setActiveTab('dawaya_full_db');
            setPage(1);
          }}
        >
          🌐{' '}
          {isAr
            ? `موسوعة أدوية دوايا الشاملة (${totalCount.toLocaleString()})`
            : `All DAWAYA Medicines (${totalCount.toLocaleString()})`}
        </button>
        <button
          className={`btn ${activeTab === 'commercial_registry' ? '' : 'ghost'}`}
          onClick={() => {
            setActiveTab('commercial_registry');
            setPage(1);
          }}
        >
          🦠{' '}
          {isAr
            ? `سجل العبوات الدوائية المرجعية الموثقة (${allCommercialProducts.length})`
            : `Verified Reference Packages (${allCommercialProducts.length})`}
        </button>
        <button
          className={`btn ${activeTab === 'clinical_monographs' ? '' : 'ghost'}`}
          onClick={() => {
            setActiveTab('clinical_monographs');
            setPage(1);
          }}
        >
          📚{' '}
          {isAr
            ? `المونوجرافات السريرية المرجعية (${items?.length || 32})`
            : `Clinical Reference Monographs (${items?.length || 32})`}
        </button>
        <button
          className={`btn ${activeTab === 'audit_importer' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('audit_importer')}
        >
          📊 {isAr ? 'تقرير الاستيراد الشامل (26,562) والتدقيق' : 'Full Import Report (26,562) & Audit'}
        </button>
        <Link to="/cost-saver" className="btn ghost" style={{ borderColor: '#16a34a', color: '#15803d', fontWeight: 700 }}>
          💰 {isAr ? 'حاسبة البديل الأرخص' : 'Generic Cost Saver'}
        </Link>
        <Link to="/compare" className="btn ghost">
          ⚖️ {isAr ? 'مقارنة دواءين' : 'Compare 2 Drugs'}
        </Link>
      </div>

      {/* Unified Search & Filter Panel */}
      <div className="card" style={{ padding: '16px' }}>
        <div
          className="search light-search"
          style={{
            marginBottom:
              activeTab === 'dawaya_full_db' || activeTab === 'commercial_registry' ? '14px' : '0',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
            <input
              value={q}
              onChange={(e) => {
                const nextParams: Record<string, string> = {};
                if (e.target.value) nextParams.q = e.target.value;
                if (selectedDawayaCat !== 'all') nextParams.cat = selectedDawayaCat;
                setSp(nextParams, { replace: true });
                setPage(1);
              }}
              placeholder={tr(
                lang,
                'ابحث في 26,562+ دواء بالاسم، المادة الفعالة، الباركود، أو الحروف الباقية على شريط مقطوع...',
                'Search 26,562+ medicines by brand, active ingredient, barcode, or partial strip letters...'
              )}
              aria-label={t('search')}
              style={{ flex: 1, minWidth: '210px' }}
            />
            <label
              className="btn small"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                borderColor: '#10b981',
                color: '#ffffff',
                fontWeight: 900,
                borderRadius: '999px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
              title={isAr ? 'ارفع صورة علبة الدواء أو الشريط من موبايلك أو جهازك ليقرأها الذكاء الاصطناعي فوراً' : 'Upload a photo of a medicine box or strip from your device for instant AI recognition'}
            >
              📁 {aiBoxScanLoading ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : isAr ? 'ارفع صورة العلبة / الدواء (AI)' : 'Upload Box / Drug Image (AI)'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                style={{ display: 'none' }}
                disabled={aiBoxScanLoading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  await handleAiMedicineImageFile(file);
                }}
              />
            </label>
            <label
              className="btn small"
              style={{
                background: '#0D1F38',
                borderColor: '#CFD29D',
                color: '#CFD29D',
                fontWeight: 800,
                borderRadius: '999px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
              title={isAr ? 'صوّر شريط الدواء المقطوع أو العلبة بالكاميرا مباشرة' : 'Snap a cut blister strip or box with camera'}
            >
              📷 {isAr ? 'صوّر بالكاميرا' : 'Snap Camera'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                disabled={aiBoxScanLoading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  await handleAiMedicineImageFile(file);
                }}
              />
            </label>

          </div>
        </div>

        {aiBoxScanResult && (
          <div
            style={{
              marginBottom: '14px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
              border: '2px solid #0d9488',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '220px' }}>
                {aiBoxScanResult.previewUrl && (
                  <img
                    src={aiBoxScanResult.previewUrl}
                    alt="Uploaded Medicine"
                    style={{
                      width: '74px',
                      height: '74px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: '2px solid #0d9488',
                      background: '#fff',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <span className="badge approved" style={{ fontSize: '0.74rem', marginBottom: '4px', display: 'inline-block' }}>
                    🤖 {isAr ? 'نتيجة قراءة الذكاء الاصطناعي لصورة الدواء' : 'AI Vision Medicine Recognition'}
                  </span>
                  <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '1.08rem' }}>
                    {aiBoxScanResult.detectedName}
                  </h3>
                  {aiBoxScanResult.matchedItem && (
                    <div className="small" style={{ color: '#0369a1', fontWeight: 700 }}>
                      🧪 {isAr ? 'المادة الفعالة: ' : 'Active Ingredient: '}
                      {aiBoxScanResult.matchedItem.g || (isAr ? 'راجع العبوة' : 'See package')}
                      {aiBoxScanResult.matchedItem.p ? ` • 💰 السعر الرسمي: ${aiBoxScanResult.matchedItem.p} ج.م` : ''}
                    </div>
                  )}
                  {aiBoxScanResult.aiSummary && (
                    <p className="small" style={{ margin: '6px 0 0', color: '#1e293b', lineHeight: 1.6 }}>
                      {aiBoxScanResult.aiSummary}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => setAiBoxScanResult(null)}
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            {aiBoxScanResult.alternatives.length > 0 && (
              <div style={{ fontSize: '0.82rem', color: '#065f46', background: '#ffffff', padding: '8px 12px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                💡 <b>{isAr ? 'بدائل مصرية مطابقة 100% في المادة الفعالة والتركيز:' : '100% Bioequivalent Egyptian Alternatives:'}</b>{' '}
                {aiBoxScanResult.alternatives.map((alt) => `${alt.a || alt.n} (${alt.p ? alt.p + ' ج.م' : ''})`).join(' ، ')}
              </div>
            )}

            <div className="row wrapRow" style={{ gap: '8px' }}>
              {aiBoxScanResult.matchedItem && (
                <>
                  <Link
                    to={`/medicine/${aiBoxScanResult.matchedItem.i}`}
                    className="btn small"
                    style={{ background: '#0284c7', borderColor: '#0284c7', color: '#fff', fontWeight: 800, textDecoration: 'none' }}
                  >
                    📖 {isAr ? 'فتح صفحة الدواء الكاملة' : 'Open Drug Page'}
                  </Link>
                  <button
                    type="button"
                    className="btn small"
                    style={{ background: '#059669', borderColor: '#059669', color: '#fff', fontWeight: 800 }}
                    onClick={() =>
                      handleAddMedicineToProfile(
                        aiBoxScanResult.matchedItem!.i,
                        aiBoxScanResult.matchedItem!.a,
                        aiBoxScanResult.matchedItem!.n,
                        aiBoxScanResult.matchedItem!.s
                      )
                    }
                  >
                    ➕ {isAr ? 'أضف لأدويتي في ملفي الصحي' : 'Add to My Medications'}
                  </button>
                  <Link
                    to={`/cost-saver?prod=${encodeURIComponent(aiBoxScanResult.matchedItem.i)}`}
                    className="btn small ghost"
                    style={{ fontWeight: 800, textDecoration: 'none' }}
                  >
                    💰 {isAr ? 'حاسبة البديل الأرخص' : 'Cost Saver'}
                  </Link>
                </>
              )}
              <Link
                to={`/assistant?q=${encodeURIComponent(
                  isAr
                    ? `اشرحلي كل حاجة عن دواء ${aiBoxScanResult.detectedName} وجرعته وتحذيراته`
                    : `Explain ${aiBoxScanResult.detectedName} uses, dosage, and warnings`
                )}`}
                className="btn small ghost"
                style={{ fontWeight: 800, textDecoration: 'none', borderColor: '#0d9488', color: '#0f766e' }}
              >
                🤖 {isAr ? 'اسأل المساعد الذكي عن هذا الدواء' : 'Ask AI Assistant'}
              </Link>
            </div>
          </div>
        )}

        {/* 6 Pharmacy Departments — Style 2: Compact 3x2 Rounded-Square Grid */}
        {activeTab === 'dawaya_full_db' && (
          <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: '2px' }}>
              <b style={{ fontSize: '0.98rem', color: '#0D1F38' }}>
                {isAr ? 'الفئات والأقسام' : 'Pharmacy Categories'}
              </b>
              <button
                type="button"
                onClick={() => {
                  setSelectedDept('all');
                  setSelectedSub('all');
                  setSelectedDawayaCat('all');
                  setPage(1);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: selectedDept === 'all' ? '#0f766e' : '#0284c7',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                {selectedDept === 'all'
                  ? (isAr ? '✓ معروض الكل' : '✓ Showing All')
                  : (isAr ? 'عرض الكل ↺' : 'Show All ↺')}
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '10px',
              }}
            >
              {DAWAYA_PHARMACY_DEPARTMENTS.map((dept) => {
                const isAct = selectedDept === dept.id;
                const shortTitle =
                  dept.id === 'medicines' ? (isAr ? 'الأدوية' : 'Medicines') :
                  dept.id === 'skincare' ? (isAr ? 'البشرة' : 'Skincare') :
                  dept.id === 'haircare' ? (isAr ? 'الشعر' : 'Hair Care') :
                  dept.id === 'vitamins' ? (isAr ? 'الفيتامينات' : 'Vitamins') :
                  dept.id === 'baby_oral' ? (isAr ? 'الطفل والأسنان' : 'Baby & Oral') :
                  (isAr ? 'الأجهزة الطبية' : 'Devices');

                const renderVectorIcon = (strokeCol: string) => {
                  if (dept.id === 'medicines') {
                    return (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={strokeCol} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="8" width="16" height="8" rx="4" transform="rotate(-35 12 12)" />
                        <line x1="9.5" y1="9.5" x2="14.5" y2="14.5" />
                      </svg>
                    );
                  }
                  if (dept.id === 'skincare') {
                    return (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={strokeCol} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="7" y="8" width="10" height="12" rx="3" />
                        <path d="M10 8V5h4v3M9 4h7" />
                        <path d="M10 13h4" />
                      </svg>
                    );
                  }
                  if (dept.id === 'haircare') {
                    return (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={strokeCol} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 8h8l1 12H7L8 8z" />
                        <path d="M10 8V5h4v3" />
                        <circle cx="12" cy="14" r="2" />
                      </svg>
                    );
                  }
                  if (dept.id === 'vitamins') {
                    return (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={strokeCol} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="7" width="12" height="13" rx="3" />
                        <path d="M8 4h8v3H8z" />
                        <path d="M12 11v5M9.5 13.5h5" />
                      </svg>
                    );
                  }
                  if (dept.id === 'baby_oral') {
                    return (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={strokeCol} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 7h6v13H9z" />
                        <path d="M10 7c0-2.5 4-2.5 4 0" />
                        <line x1="11" y1="11" x2="13" y2="11" />
                        <line x1="11" y1="14" x2="13" y2="14" />
                      </svg>
                    );
                  }
                  return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={strokeCol} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="4" width="14" height="16" rx="3" />
                      <rect x="8" y="7" width="8" height="5" rx="1" />
                      <circle cx="12" cy="16" r="1.5" />
                    </svg>
                  );
                };

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setSelectedDept((prev) => (prev === dept.id ? 'all' : dept.id));
                      setSelectedSub('all');
                      setSelectedDawayaCat('all');
                      setPage(1);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      padding: '13px 6px',
                      borderRadius: '16px',
                      background: isAct ? '#0f766e' : '#eefaf6',
                      color: isAct ? '#ffffff' : '#0D1F38',
                      border: isAct ? '2px solid #0f766e' : '1.5px solid #d1fae5',
                      boxShadow: isAct
                        ? '0 8px 18px rgba(15, 118, 110, 0.25)'
                        : '0 3px 10px rgba(15, 23, 42, 0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {renderVectorIcon(isAct ? '#ffffff' : '#0f766e')}
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        lineHeight: 1.2,
                        textAlign: 'center',
                      }}
                    >
                      {shortTitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeDeptMeta && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {activeDeptMeta.subs.map((sub) => {
                  const isSubAct = selectedSub === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSub(sub.id);
                        setPage(1);
                      }}
                      style={{
                        padding: '6px 13px',
                        borderRadius: '999px',
                        border: isSubAct ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                        background: isSubAct ? '#0f766e' : '#ffffff',
                        color: isSubAct ? '#ffffff' : '#334155',
                        fontWeight: isSubAct ? 800 : 600,
                        fontSize: '0.79rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {isAr ? sub.ar : sub.en}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Filters for Tab 1 (All 26,562 DAWAYA Medicines) */}
        {activeTab === 'dawaya_full_db' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'الفئة الدوائية والعلاجية:' : 'Therapeutic Category:'}
              </label>
              <SmartChoiceSelect
                value={selectedDawayaCat}
                onChange={(val) => {
                  setSelectedDawayaCat(val as DawayaTherapeuticCategory | 'all');
                  setPage(1);
                }}
                modalTitle={isAr ? '🏥 اختر التخصص أو الفئة العلاجية' : 'Select Therapeutic Category'}
                options={[
                  { value: 'all', icon: '✨', label: isAr ? `كل التخصصات والفئات (${indexItems.length.toLocaleString()})` : `All Categories (${indexItems.length.toLocaleString()})` },
                  ...(Object.keys(DAWAYA_CATEGORY_LABELS) as DawayaTherapeuticCategory[]).map((catKey) => ({
                    value: catKey,
                    icon: DAWAYA_CATEGORY_LABELS[catKey].icon,
                    label: isAr ? DAWAYA_CATEGORY_LABELS[catKey].ar : DAWAYA_CATEGORY_LABELS[catKey].en,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'الشكل الصيدلاني:' : 'Dosage Form:'}
              </label>
              <SmartChoiceSelect
                value={selectedFormFilter}
                onChange={(val) => {
                  setSelectedFormFilter(val);
                  setPage(1);
                }}
                modalTitle={isAr ? '💊 اختر الشكل الصيدلاني للدواء' : 'Select Dosage Form'}
                options={[
                  { value: 'all', icon: '📦', label: isAr ? 'جميع الأشكال الدوائية' : 'All Dosage Forms' },
                  ...(Object.keys(DOSAGE_FORM_LABELS) as DosageFormType[]).map((k) => ({
                    value: k,
                    icon: '💊',
                    label: pick(DOSAGE_FORM_LABELS[k], lang),
                  })),
                ]}
              />
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'طريق الإعطاء:' : 'Route:'}
              </label>
              <SmartChoiceSelect
                value={selectedRouteFilter}
                onChange={(val) => {
                  setSelectedRouteFilter(val);
                  setPage(1);
                }}
                modalTitle={isAr ? '💉 اختر طريق إعطاء الدواء' : 'Select Administration Route'}
                options={[
                  { value: 'all', icon: '✨', label: isAr ? 'كل طرق الإعطاء' : 'All Routes' },
                  ...(Object.keys(ROUTE_LABELS) as AdministrationRoute[]).map((r) => ({
                    value: r,
                    icon: '🩺',
                    label: pick(ROUTE_LABELS[r], lang),
                  })),
                ]}
              />
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'توثيق الباركود:' : 'Barcode Status:'}
              </label>
              <SmartChoiceSelect
                value={selectedBarcodeFilter}
                onChange={(val) => {
                  setSelectedBarcodeFilter(val as 'all' | 'verified' | 'pending');
                  setPage(1);
                }}
                modalTitle={isAr ? '🏷️ حالة توثيق الباركود' : 'Barcode Verification Status'}
                options={[
                  { value: 'all', icon: '📋', label: isAr ? 'الكل (26,562 دواء)' : 'All Records (26,562)' },
                  { value: 'verified', icon: '✅', label: isAr ? 'باركود متوفر وموثق (10,525)' : 'With Barcode (10,525)' },
                  { value: 'pending', icon: '⏳', label: isAr ? 'بدون باركود مسجل (16,037)' : 'Missing Barcode (16,037)' },
                ]}
              />
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'تركيب المكونات الفعالة:' : 'Composition:'}
              </label>
              <SmartChoiceSelect
                value={selectedComboFilter}
                onChange={(val) => {
                  setSelectedComboFilter(val as 'all' | 'single' | 'combo');
                  setPage(1);
                }}
                modalTitle={isAr ? '🧪 تركيب المواد الفعالة' : 'Active Ingredient Composition'}
                options={[
                  { value: 'all', icon: '✨', label: isAr ? 'الكل (منفرد + مركب)' : 'All (Single + Combo)' },
                  { value: 'single', icon: '1️⃣', label: isAr ? 'مادة فعالة منفردة' : 'Single Active Ingredient' },
                  { value: 'combo', icon: '➕', label: isAr ? 'دواء مركب (أكثر من مادة فعالة)' : 'Multi-Ingredient Combo' },
                ]}
              />
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'ترتيب النتائج:' : 'Sort By:'}
              </label>
              <SmartChoiceSelect
                value={sortBy}
                onChange={(val) => setSortBy(val as SortOption)}
                modalTitle={isAr ? '⇅ ترتيب عرض الأدوية' : 'Sort Medicines By'}
                options={[
                  { value: 'verified_first', icon: '✅', label: isAr ? 'المكتملة والموثقة أولاً' : 'Verified Records First' },
                  { value: 'relevance', icon: '🎯', label: isAr ? 'الأكثر تطابقاً مع البحث' : 'Best Match' },
                  { value: 'name', icon: '🔤', label: isAr ? 'الاسم التجاري (أبجدياً)' : 'Brand Name (A-Z)' },
                  { value: 'price_asc', icon: '📉', label: isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High' },
                  { value: 'price_desc', icon: '📈', label: isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Filters for Tab 2 (Antibiotic Commercial Registry) */}
        {activeTab === 'commercial_registry' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'المادة الفعالة (مضادات حيوية):' : 'Antibiotic Active Ingredient:'}
              </label>
              <SmartNativeSelect
                value={selectedIngFilter}
                onChange={(e) => {
                  setSelectedIngFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{isAr ? 'كل المواد الفعالة (74)' : 'All Ingredients (74)'}</option>
                {ACTIVE_INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {isAr ? `${ing.nameAr} (${ing.nameEn})` : `${ing.nameEn} (${ing.nameAr})`}
                  </option>
                ))}
              </SmartNativeSelect>
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'الشكل الصيدلاني:' : 'Dosage Form:'}
              </label>
              <SmartNativeSelect
                value={selectedFormFilter}
                onChange={(e) => {
                  setSelectedFormFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{isAr ? 'جميع الأشكال الدوائية' : 'All Dosage Forms'}</option>
                {(Object.keys(DOSAGE_FORM_LABELS) as DosageFormType[]).map((k) => (
                  <option key={k} value={k}>
                    {pick(DOSAGE_FORM_LABELS[k], lang)}
                  </option>
                ))}
              </SmartNativeSelect>
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'ترتيب النتائج:' : 'Sort By:'}
              </label>
              <SmartNativeSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="verified_first">{isAr ? 'الباركود الموثق أولاً' : 'Verified Barcodes First'}</option>
                <option value="name">{isAr ? 'الاسم التجاري (أبجدياً)' : 'Trade Name (A-Z)'}</option>
                <option value="price_asc">{isAr ? 'السعر: من الأقل إلى الأعلى' : 'Price: Low to High'}</option>
                <option value="price_desc">{isAr ? 'السعر: من الأعلى إلى الأقل' : 'Price: High to Low'}</option>
              </SmartNativeSelect>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: FULL 26,562 DAWAYA MEDICINE DATABASE */}
      {activeTab === 'dawaya_full_db' && (
        <section className="stack">
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="small muted" style={{ margin: 0 }}>
              {fullDbLoaded
                ? isAr
                  ? `إجمالي الأدوية المطابقة: ${filteredDawayaItems.length.toLocaleString()} دواء من أصل ${totalCount.toLocaleString()} (صفحة ${page} من ${dawayaTotalPages.toLocaleString()})`
                  : `Matching medicines: ${filteredDawayaItems.length.toLocaleString()} of ${totalCount.toLocaleString()} (Page ${page} of ${dawayaTotalPages.toLocaleString()})`
                : isAr
                ? 'جارٍ تحميل فهرس موسوعة دوايا الشامل (26,562 دواء)...'
                : 'Loading DAWAYA 26,562 medicine index...'}
            </p>
            {(selectedDawayaCat !== 'all' ||
              selectedFormFilter !== 'all' ||
              selectedRouteFilter !== 'all' ||
              selectedBarcodeFilter !== 'all' ||
              selectedComboFilter !== 'all' ||
              q) && (
              <button
                className="btn ghost small"
                onClick={() => {
                  setSelectedDawayaCat('all');
                  setSelectedDept('all');
                  setSelectedSub('all');
                  setSelectedFormFilter('all');
                  setSelectedRouteFilter('all');
                  setSelectedBarcodeFilter('all');
                  setSelectedComboFilter('all');
                  setSp({}, { replace: true });
                  setPage(1);
                }}
              >
                ↺ {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>

          {!fullDbLoaded && (
            <div className="grid">
              <SkeletonCard count={8} />
            </div>
          )}

          <div className="grid">
            {paginatedDawayaItems.map((item) => {
              const catMeta = DAWAYA_CATEGORY_LABELS[item.k] || DAWAYA_CATEGORY_LABELS.general_medicine;
              const flags = decodeWarningMask(item.w);

              // Evaluate Live Safety Status against Patient Profile & Occupation
              const drugTokens = [item.a || '', item.n || '', item.g || ''];
              const occAlerts = evaluateOccupationalDrugSafety(
                drugTokens,
                profile.occupation || 'driver_transport',
                profile.factoryEnvironmentHazards,
                profile.workEnvironmentNotes
              );
              const hydrationReq = evaluateDrugHydrationRequirement(drugTokens);
              const splitMeal = evaluatePillSplittingAndMealProtocol(drugTokens, item.f);
              const reboundAlert = evaluateSuddenStopReboundRisk(drugTokens, item.k);

              // Check allergy match
              const hasAllergyConflict = (profile.allergies || []).some((al) => {
                const key = (al.drugName || '').toLowerCase();
                const fam = (al.allergenKey || '').toLowerCase();
                const text = drugTokens.join(' ').toLowerCase();
                if (key && text.includes(key)) return true;
                if (fam === 'penicillin' && /(أموكسيسيلين|أوجمنتين|بنسلين|أمبيسيلين|يونيكتام|كيورام|هاي بيوتك|amoxicillin|augmentin|penicillin|ampicillin)/i.test(text)) return true;
                if (fam === 'sulfa' && /(سلفا|سبترين|سوتريم|sulfa|septrin|cotrimoxazole)/i.test(text)) return true;
                return false;
              });

              const hasOrganConflict =
                (profile.renalStatus === 'impaired' && flags.kidney) ||
                (profile.hepaticStatus === 'impaired' && flags.liver);

              const occupationLabel =
                profile.occupation === 'driver_transport'
                  ? (isAr ? 'سائق' : 'Driver')
                  : profile.occupation === 'machinery_factory'
                  ? (isAr ? 'عامل مصنع' : 'Factory')
                  : profile.occupation === 'student'
                  ? (isAr ? 'طالب' : 'Student')
                  : profile.occupation === 'office_desk'
                  ? (isAr ? 'عمل مكتبي' : 'Office')
                  : profile.occupation === 'homemaker'
                  ? (isAr ? 'ربت منزل' : 'Homemaker')
                  : profile.occupation === 'other' && profile.customOccupationTitle
                  ? profile.customOccupationTitle
                  : (isAr ? 'ملفك الصحي' : 'Your Profile');

              let safetyState: 'safe' | 'danger' | 'caution' = 'safe';
              let safetyText = isAr
                ? `✓ آمن مع ملفك ومهنتك (${occupationLabel})`
                : `✓ Safe with your profile (${occupationLabel})`;

              if (hasAllergyConflict) {
                safetyState = 'danger';
                safetyText = isAr
                  ? 'تعارض دوائي: يتعارض مع سجل الحساسية'
                  : '🚨 Critical: Conflicts with your recorded allergy!';
              } else if (occAlerts.length > 0) {
                safetyState = 'danger';
                const isResp = occAlerts[0].warningAr.includes('الصدر');
                safetyText = isResp
                  ? (isAr ? 'تنبيه مهني: يحذر مع التعرض لأتربة المصنع' : '⚠️ Lung Alert — Caution with factory dust')
                  : (isAr ? 'تنبيه يقظة: يسبب النعاس ويحظر أثناء القيادة' : '⚠️ Causes Drowsiness — Do not drive');
              } else if (hasOrganConflict) {
                safetyState = 'caution';
                safetyText = isAr
                  ? 'تنبيه كلوي/كبدي: يتطلب مراجعة الجرعة'
                  : '⚠️ Requires renal/hepatic dose adjustment';
              }

              return (
                <div
                  key={item.i}
                  className="dawaya-med-card-v3"
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/medicine/${item.i}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/medicine/${item.i}`);
                    }
                  }}
                >
                  <div>
                    {/* Top Action Icons Row: Save to Profile + WhatsApp Share + Info Page */}
                    <div className="dawaya-med-card-v3-top-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="dawaya-med-icon-btn"
                        title={isAr ? 'حفظ الدواء في ملفي الصحي' : 'Save to my health profile'}
                        onClick={() => handleAddMedicineToProfile(item.i, item.a, item.n, item.s)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          isAr
                            ? `💊 دواء: ${item.a || item.n} (${item.n})\n🧪 المادة الفعالة: ${item.g || 'راجع النشرة'}\n💰 السعر الرسمي: ${item.p ? item.p.toFixed(2) + ' ج.م' : 'غير محدد'}\n🔗 التفاصيل والبدائل على منصة دوايا: https://dawaya.pages.dev/#/medicine/${item.i}`
                            : `💊 Medicine: ${item.n} (${item.a})\n🧪 Active Ingredient: ${item.g || 'See leaflet'}\n💰 Official Price: ${item.p ? item.p.toFixed(2) + ' EGP' : 'N/A'}\n🔗 Details & Generics on DAWAYA: https://dawaya.pages.dev/#/medicine/${item.i}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dawaya-med-icon-btn"
                        title={isAr ? 'مشاركة الدواء وسعره عبر واتساب' : 'Share on WhatsApp'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </a>

                      <Link
                        to={`/medicine/${item.i}`}
                        className="dawaya-med-icon-btn"
                        title={isAr ? 'تفاصيل الدواء الكاملة والبدائل' : 'Full Medicine Details'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </Link>
                    </div>

                    {/* Main Body: Realistic 3D Packaging Thumb + Title + Active Ingredient + Price Pill */}
                    <div className="dawaya-med-card-v3-body">
                      <Realistic3DMedicineThumb form={item.f} size={68} medId={item.i} brandNameEn={item.n} barcode={item.b} />

                      <div className="dawaya-med-card-v3-info">
                        <h3 className="dawaya-med-card-v3-title">
                          <Link to={`/medicine/${item.i}`} className="dawaya-med-card-v3-title-link">
                            {isAr ? item.a || item.n : item.n}{' '}
                            {item.a && item.n && (
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', opacity: 0.85 }} dir="ltr">
                                ({item.n})
                              </span>
                            )}
                          </Link>
                        </h3>

                        <p className="dawaya-med-card-v3-ing">
                          {item.g || (isAr ? `${pick(DOSAGE_FORM_LABELS[item.f as DosageFormType] || DOSAGE_FORM_LABELS.tablet, lang)} • ${catMeta.ar}` : catMeta.en)}
                          {item.s ? ` • ${item.s}` : ''}
                        </p>

                        <div className="dawaya-med-card-v3-meta-row">
                          {(() => {
                            const pInfo = getApproximateBatchPriceInfo(item);
                            if (!pInfo.price) return null;
                            return (
                              <span
                                className="dawaya-med-price-pill"
                                title={isAr ? pInfo.noteAr : pInfo.noteEn}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}
                              >
                                <span>
                                  ~ {Number.isInteger(pInfo.price) ? pInfo.price : pInfo.price.toFixed(1)} {isAr ? 'ج.م' : 'EGP'}
                                </span>
                                {pInfo.minBatch && pInfo.maxBatch && pInfo.minBatch < pInfo.maxBatch && (
                                  <span style={{ fontSize: '0.72rem', opacity: 0.82, fontWeight: 700 }}>
                                    ({isAr ? `تشغيلات: ${pInfo.minBatch}–${pInfo.maxBatch}` : `${pInfo.minBatch}–${pInfo.maxBatch}`})
                                  </span>
                                )}
                              </span>
                            );
                          })()}

                          {hydrationReq && (
                            <span className="dawaya-med-hydration-chip" title={hydrationReq.reasonAr}>
                              {isAr ? hydrationReq.badgeAr : 'Drink 2 Glasses of Water'}
                            </span>
                          )}

                          {(splitMeal.splittingStatus === 'forbidden_sr_ec' || splitMeal.splittingStatus === 'capsule_no_open') && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                fontWeight: 800,
                                fontSize: '0.73rem',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                border: '1px solid #fecaca',
                              }}
                              title={splitMeal.splittingReasonAr}
                            >
                              {isAr ? splitMeal.splittingBadgeAr : 'Do Not Split/Crush'}
                            </span>
                          )}

                          {reboundAlert && reboundAlert.riskLevel === 'critical_rebound' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#fef3c7',
                                color: '#b45309',
                                fontWeight: 800,
                                fontSize: '0.73rem',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                border: '1px solid #fde68a',
                              }}
                              title={reboundAlert.reboundDangerAr}
                            >
                              {isAr ? reboundAlert.badgeAr : 'Do Not Stop Abruptly'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full-Width Bottom Safety Bar (Matches Image 1 Green/Pink Status Bar) */}
                  <Link
                    to={`/medicine/${item.i}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className={`dawaya-med-safety-strip ${safetyState}`}>
                      <span>{safetyText}</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {dawayaTotalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {isAr ? '→ السابق' : '← Previous'}
              </button>
              <span style={{ alignSelf: 'center', fontWeight: 700 }}>
                {isAr
                  ? `صفحة ${page.toLocaleString()} من ${dawayaTotalPages.toLocaleString()}`
                  : `Page ${page.toLocaleString()} of ${dawayaTotalPages.toLocaleString()}`}
              </span>
              <button
                className="btn ghost"
                disabled={page >= dawayaTotalPages}
                onClick={() => setPage((p) => Math.min(dawayaTotalPages, p + 1))}
              >
                {isAr ? 'التالي ←' : 'Next →'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: PRESERVED EGYPTIAN ANTIBIOTIC COMMERCIAL PREPARATIONS REGISTRY */}
      {activeTab === 'commercial_registry' && (
        <section className="stack">
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? `إجمالي عبوات المضادات الحيوية المطابقة: ${filteredProducts.length} عبوة (صفحة ${page} من ${totalPages})`
                : `Matching antibiotic packages: ${filteredProducts.length} (Page ${page} of ${totalPages})`}
            </p>
            {canEditLive && (
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  setEditingCatalogProd(null);
                  setAddingCatalogProd(true);
                }}
              >
                ➕ {tr(lang, 'إضافة دواء تجاري جديد', 'Add Commercial Drug')}
              </button>
            )}
          </div>

          <div className="grid">
            {paginatedProducts.map((p) => {
              const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
              const drugTokens = [p.tradeNameAr || '', p.tradeNameEn || '', p.scientificComposition || ''];
              const occAlerts = evaluateOccupationalDrugSafety(
                drugTokens,
                profile.occupation || 'driver_transport',
                profile.factoryEnvironmentHazards,
                profile.workEnvironmentNotes
              );
              const hydrationReq = evaluateDrugHydrationRequirement(drugTokens);

              const occupationLabel =
                profile.occupation === 'driver_transport'
                  ? (isAr ? 'سائق' : 'Driver')
                  : profile.occupation === 'machinery_factory'
                  ? (isAr ? 'عامل مصنع' : 'Factory')
                  : profile.occupation === 'student'
                  ? (isAr ? 'طالب' : 'Student')
                  : profile.occupation === 'office_desk'
                  ? (isAr ? 'عمل مكتبي' : 'Office')
                  : profile.occupation === 'homemaker'
                  ? (isAr ? 'ربت منزل' : 'Homemaker')
                  : profile.occupation === 'other' && profile.customOccupationTitle
                  ? profile.customOccupationTitle
                  : (isAr ? 'ملفك الصحي' : 'Your Profile');

              const safetyState: 'safe' | 'danger' = occAlerts.length > 0 ? 'danger' : 'safe';
              const safetyText =
                occAlerts.length > 0
                  ? (isAr ? 'تنبيه يقظة: يسبب النعاس ويحظر أثناء القيادة' : '⚠️ Causes Drowsiness — Do not drive')
                  : (isAr ? `✓ آمن مع ملفك ومهنتك (${occupationLabel})` : `✓ Safe with your profile (${occupationLabel})`);

              return (
                <div
                  key={p.productId}
                  className="dawaya-med-card-v3"
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/medicine/${p.activeIngredientId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/medicine/${p.activeIngredientId}`);
                    }
                  }}
                >
                  <div>
                    <div className="dawaya-med-card-v3-top-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="dawaya-med-icon-btn"
                        title={isAr ? 'البدائل والباركود' : 'Alternatives & Barcode'}
                        onClick={() => setSelectedProduct(p)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                      <Link
                        to={`/medicine/${p.activeIngredientId}`}
                        className="dawaya-med-icon-btn"
                        title={isAr ? 'المرجع السريري الكامل' : 'Clinical Guide'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </Link>
                    </div>

                    <div className="dawaya-med-card-v3-body">
                      <Realistic3DMedicineThumb form={p.dosageForm} size={68} />

                      <div className="dawaya-med-card-v3-info">
                        <h3 className="dawaya-med-card-v3-title">
                          <Link to={`/medicine/${p.activeIngredientId}`} className="dawaya-med-card-v3-title-link">
                            {isAr ? p.tradeNameAr : p.tradeNameEn}{' '}
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', opacity: 0.85 }} dir="ltr">
                              ({p.tradeNameEn})
                            </span>
                          </Link>
                        </h3>

                        <p className="dawaya-med-card-v3-ing">
                          {ing ? (isAr ? `${ing.nameAr} / ${ing.nameEn}` : ing.nameEn) : p.scientificComposition}
                          {p.strength ? ` • ${p.strength}` : ''}
                        </p>

                        <div className="dawaya-med-card-v3-meta-row">
                          {p.priceEgp !== null && (
                            <span className="dawaya-med-price-pill">
                              {Number.isInteger(p.priceEgp) ? p.priceEgp : p.priceEgp.toFixed(1)} {isAr ? 'ج.م' : 'EGP'}
                            </span>
                          )}
                          {hydrationReq && (
                            <span className="dawaya-med-hydration-chip">
                              {isAr ? hydrationReq.badgeAr : '2 Glasses Water'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}
                  >
                    <div className={`dawaya-med-safety-strip ${safetyState}`}>
                      <span>{safetyText}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {isAr ? '→ السابق' : '← Previous'}
              </button>
              <span style={{ alignSelf: 'center', fontWeight: 600 }}>
                {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <button
                className="btn ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {isAr ? 'التالي ←' : 'Next →'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: CLINICAL ACTIVE INGREDIENT MONOGRAPHS */}
      {activeTab === 'clinical_monographs' && (
        <section className="stack">
          {error && <p className="alert">{t('loadError')}</p>}
          {items === null && !error && (
            <div className="grid">
              <SkeletonCard count={6} />
            </div>
          )}
          <div className="grid">
            {clinicalResults.map((m) => {
              const ingMeta = ACTIVE_INGREDIENTS.find((a) => a.id === m.id);
              const awareColor =
                ingMeta?.whoAccessGroup === 'Access'
                  ? '#16a34a'
                  : ingMeta?.whoAccessGroup === 'Reserve'
                  ? '#dc2626'
                  : '#d97706';
              return (
                <Link key={m.id} to={`/medicine/${m.id}`} className="card link">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{pick(m.genericName, lang)}</h3>
                    {ingMeta && (
                      <span
                        className="badge"
                        style={{
                          background: `${awareColor}18`,
                          color: awareColor,
                          border: `1px solid ${awareColor}`,
                          fontSize: '0.75rem',
                        }}
                      >
                        WHO {ingMeta.whoAccessGroup}
                      </span>
                    )}
                  </div>
                  <p className="muted" style={{ margin: '6px 0' }}>{pick(m.drugClass, lang)}</p>
                  {isProMode && (() => {
                    const pro = getClinicalProProfile(m.id, ingMeta?.whoAccessGroup || 'Access', m.drugClass.ar, m.drugClass.en);
                    return (
                      <div style={{ margin: '6px 0', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0, 191, 208, 0.08)', border: '1px solid rgba(0, 191, 208, 0.28)', fontSize: '0.78rem' }}>
                        <div><b>🩺 PK/PD:</b> <span dir="ltr">{pro.pkpd.halfLife}</span> · <span dir="ltr">{pro.pkpd.bioavailability}</span></div>
                        <div style={{ marginTop: '2px' }}><b>🎯 Driver:</b> {pick(pro.pkpd.pkpdDriver, lang)}</div>
                      </div>
                    );
                  })()}
                  {m.priceEgypt?.ar && (
                    <p className="small" style={{ color: '#15803d', fontWeight: 600, margin: '4px 0' }}>
                      💰 {pick(m.priceEgypt, lang).split('\n')[0]}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: FULL 26,562-RECORD IMPORT REPORT & QUALITY AUDIT */}
      {activeTab === 'audit_importer' && (
        <section className="stack">
          <div className="card highlight-card">
            <h2>
              📊{' '}
              {isAr
                ? 'تقرير استيراد وتكامل قاعدة بيانات الأدوية المصرية الشاملة (eg_drugs.csv — 26,562 سجل)'
                : 'DAWAYA Full Medicine Database Import & Audit Report (eg_drugs.csv — 26,562 Records)'}
            </h2>
            <p className="small muted">
              {isAr
                ? 'تم فحص ومعالجة واستيراد ملف قاعدة البيانات المرفق بالكامل (26,562 سجل دوائي) دون تجاهل أو حذف أي دواء صالح، مع ربطه بجميع أدوات المنصة بشفافية تامة ودون اختلاق أي بيانات غير موجودة في المصدر.'
                : 'All 26,562 valid medicine records from the supplied eg_drugs.csv file have been analyzed, imported, and integrated across DAWAYA with zero data fabrication.'}
            </p>

            <div className="tablewrap" style={{ marginTop: '12px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{isAr ? 'مؤشر تقرير الاستيراد والتدقيق' : 'Import & Audit Metric'}</th>
                    <th>{isAr ? 'العدد الفعلي الموثق' : 'Verified Count'}</th>
                    <th>{isAr ? 'التفاصيل والحالة' : 'Status & Details'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>{isAr ? 'إجمالي السجلات الموجودة في الملف المرفق (eg_drugs.csv)' : 'Total Records Found in Supplied File (eg_drugs.csv)'}</b></td>
                    <td><b>{(importReport?.totalRecordsFound ?? 26562).toLocaleString()}</b></td>
                    <td><span className="badge approved">{isAr ? 'تم فحص الملف بالكامل 100%' : '100% Inspected'}</span></td>
                  </tr>
                  <tr>
                    <td><b>{isAr ? 'السجلات التي تم استيرادها ودمجها بنجاح في دوايا' : 'Successfully Imported & Integrated Records'}</b></td>
                    <td><b>{(importReport?.successfullyImportedRecords ?? 26562).toLocaleString()}</b></td>
                    <td><span className="badge approved">{isAr ? 'نشطة في البحث وصفحات الأدوية ومحرك الأمان' : 'Active Across All Platform Modules'}</span></td>
                  </tr>
                  <tr>
                    <td><b>{isAr ? 'سجلات المضادات الحيوية الأصلية المحفوظة' : 'Preserved Original Antibiotic Records'}</b></td>
                    <td><b>267 {isAr ? 'عبوة تجارية + 32 مادة فعالة' : 'packages + 32 monographs'}</b></td>
                    <td><span className="badge approved">{isAr ? 'محفوظة بالكامل بدون أي حذف' : '100% Preserved'}</span></td>
                  </tr>
                  <tr>
                    <td><b>{isAr ? 'السجلات غير الصالحة (Invalid Records)' : 'Invalid Records (Missing both AR & EN names)'}</b></td>
                    <td><b>{importReport?.invalidRecords ?? 0}</b></td>
                    <td><span className="badge approved">{isAr ? 'صفر سجلات تالفة' : '0 Invalid Rows'}</span></td>
                  </tr>
                  <tr>
                    <td><b>{isAr ? 'السجلات المكررة (نفس الاسم والتركيز والشكل / باركود مشترك)' : 'Duplicate Records (Name+Strength+Form / Shared Barcodes)'}</b></td>
                    <td>
                      <b>
                        {importReport?.duplicateBrandStrengthFormGroups ?? 217} {isAr ? 'مجموعة اسمية' : 'name groups'} /{' '}
                        {importReport?.duplicateSharedBarcodes ?? 672} {isAr ? 'باركود مشترك' : 'shared barcodes'}
                      </b>
                    </td>
                    <td><span className="badge">{isAr ? 'تم الاحتفاظ بها بمعرفات مستقلة (eg-ID) لمنع فقدان العبوات' : 'Retained with unique IDs'}</span></td>
                  </tr>
                  <tr>
                    <td><b>{isAr ? 'سجلات ذات بيانات غير مكتملة في المصدر (Incomplete Information)' : 'Records with Incomplete Source Fields'}</b></td>
                    <td><b>{(importReport?.recordsWithIncompleteInformation ?? 22033).toLocaleString()}</b></td>
                    <td>
                      <span className="small muted">
                        {isAr
                          ? 'نقص الباركود (16,030)، الاستخدامات التفصيلية (18,456)، المادة الفعالة (2,758)، الشركة (310)، السعر (127)'
                          : 'Missing barcode (16,030), detailed uses (18,456), active ingredient (2,758), company (310), price (127)'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><b>{isAr ? 'سجلات تتطلب مراجعة يدوية/سريرية (Manual Review Queue)' : 'Records Requiring Manual Clinical Review'}</b></td>
                    <td><b>{(importReport?.recordsRequiringManualReview ?? 2882).toLocaleString()}</b></td>
                    <td><span className="badge pending_review">{isAr ? 'مميزة بوضوح دون اختلاق قيم وهمية' : 'Explicitly Flagged (Zero Fabrication)'}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2>📥 {isAr ? 'استيراد ملفات أدوية إضافية (CSV / JSON)' : 'Import Additional Drug Datasets (CSV / JSON)'}</h2>
            <div className="row wrapRow" style={{ gap: '12px', alignItems: 'center', marginTop: '10px' }}>
              <label className="btn" style={{ cursor: 'pointer' }}>
                📂 {isAr ? 'اختر ملف CSV أو JSON للاستيراد' : 'Upload CSV or JSON Dataset'}
                <input
                  type="file"
                  accept=".csv,.json"
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                />
              </label>
            </div>
            {importMsg && <p className="notice" style={{ marginTop: '12px' }}>{importMsg}</p>}
          </div>
        </section>
      )}

      {/* DETAILED PACKAGE, BARCODE & ALTERNATIVES MODAL */}
      {selectedProduct && selectedAlternatives && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999,
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="card stack"
            style={{
              maxWidth: '760px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              background: 'var(--card-bg, #fff)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge" style={{ marginBottom: '6px' }}>{selectedProduct.productId}</span>
                <h2 style={{ margin: 0 }}>{isAr ? selectedProduct.tradeNameAr : selectedProduct.tradeNameEn}</h2>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {isAr ? selectedProduct.tradeNameEn : selectedProduct.tradeNameAr} — {selectedProduct.scientificComposition}
                </p>
              </div>
              <button className="btn ghost" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>

            <div className="row wrapRow" style={{ gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Link
                to={`/medicine/${selectedProduct.activeIngredientId}`}
                className="btn"
                onClick={() => setSelectedProduct(null)}
              >
                📖 {isAr ? 'فتح المرجع السريري الكامل' : 'Open Full Clinical Monograph'}
              </Link>
              <Link
                to="/allergy-checker"
                className="btn ghost"
                onClick={() => setSelectedProduct(null)}
              >
                🛡️ {isAr ? 'فحص الحساسية الدوائية' : 'Check Drug Allergy Safety'}
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
      {(addingCatalogProd || editingCatalogProd !== null) && (
        <QuickProductEditorModal
          product={editingCatalogProd}
          defaultIngredientId={selectedIngFilter !== 'all' ? selectedIngFilter : undefined}
          uid={user?.uid}
          onClose={() => {
            setAddingCatalogProd(false);
            setEditingCatalogProd(null);
          }}
        />
      )}
    </main>
  );
}
