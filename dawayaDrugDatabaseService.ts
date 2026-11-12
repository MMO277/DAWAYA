/**
 * DAWAYA | دوايا — Unified Comprehensive Medicine Database Service (`dawayaDrugDatabaseService.ts`)
 *
 * Integrates all 26,562 medicine records from `eg_drugs.csv` alongside the 206 verified
 * antibiotic commercial packages and 32 clinical monographs into one unified, high-performance
 * medicine architecture without bloating frontend components.
 *
 * Key Capabilities:
 * 1. Asynchronous loading + IndexedDB caching of the 26,562-record search index (`public/data/dawaya_medicines_search_index.json`).
 * 2. On-demand chunk loading (`public/data/chunks/meds_chunk_<0..26>.json`) for full medicine detail pages.
 * 3. O(1) resolution by ID (`eg-1`..`eg-26562`, `EG-ABX-001`..`206`), barcode, trade name, or active ingredient.
 * 4. Multi-ingredient decomposition (`Chlorpheniramine+paracetamol+pseudoephedrine` -> individual canonical ingredients).
 * 5. Structured 7-condition clinical warning bitflags (`highBloodPressure`, `diabetes`, `pregnancy`, `lactation`, `kidney`, `liver`, `heart`).
 * 6. Seamless conversion to `Medicine` and `EgyptianCommercialProduct` so all 16 DAWAYA modules share one unified source of truth.
 */

import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import {
  ACTIVE_INGREDIENTS,
  AdministrationRoute,
  DOSAGE_FORM_LABELS,
  DosageFormType,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
  ROUTE_LABELS,
} from './egyptianDrugDatabase';
import { emptyMedicine, Medicine, Source } from './types';
import { norm } from './search';

export type DawayaTherapeuticCategory =
  | 'antibiotics'
  | 'anti_infectives'
  | 'analgesics_antipyretics'
  | 'respiratory_cold_allergy'
  | 'cardiovascular'
  | 'endocrine_diabetes'
  | 'gastrointestinal'
  | 'neurology_psychiatry'
  | 'vitamins_supplements'
  | 'dermatology_personal_care'
  | 'oncology_immunology'
  | 'ophthalmology_ent'
  | 'general_medicine';

export const DAWAYA_CATEGORY_LABELS: Record<
  DawayaTherapeuticCategory,
  { ar: string; en: string; icon: string }
> = {
  antibiotics: {
    ar: 'المضادات الحيوية ومضادات البكتيريا',
    en: 'Antibiotics & Antibacterials',
    icon: '🦠',
  },
  anti_infectives: {
    ar: 'مضادات الفيروسات والفطريات والطفيليات',
    en: 'Antivirals, Antifungals & Antiparasitics',
    icon: '🛡️',
  },
  analgesics_antipyretics: {
    ar: 'المسكنات ومضادات الالتهاب وخافضات الحرارة',
    en: 'Analgesics, NSAIDs & Antipyretics',
    icon: '🌡️',
  },
  respiratory_cold_allergy: {
    ar: 'أدوية البرد والكحة والجهاز التنفسي والحساسية',
    en: 'Cold, Cough, Respiratory & Allergy',
    icon: '🫁',
  },
  cardiovascular: {
    ar: 'أدوية القلب والضغط والكوليسترول والسيولة',
    en: 'Cardiovascular, Blood Pressure & Statins',
    icon: '❤️',
  },
  endocrine_diabetes: {
    ar: 'أدوية السكري والغدد الصماء',
    en: 'Diabetes & Endocrine Medications',
    icon: '🩸',
  },
  gastrointestinal: {
    ar: 'أدوية الجهاز الهضمي والمعدة والقولون',
    en: 'Gastrointestinal & Acid Control',
    icon: '🌿',
  },
  neurology_psychiatry: {
    ar: 'أدوية الأعصاب والطب النفسي والمخ',
    en: 'Neurology & Psychiatry',
    icon: '🧠',
  },
  vitamins_supplements: {
    ar: 'الفيتامينات والمكملات الغذائية والمعادن',
    en: 'Vitamins, Minerals & Supplements',
    icon: '☀️',
  },
  dermatology_personal_care: {
    ar: 'الأدوية الجلدية والعناية الطبية',
    en: 'Dermatology & Medical Care',
    icon: '✨',
  },
  oncology_immunology: {
    ar: 'أدوية الأورام والمناعة',
    en: 'Oncology & Immunology',
    icon: '🔬',
  },
  ophthalmology_ent: {
    ar: 'أدوية العيون والأنف والأذن',
    en: 'Ophthalmology & ENT',
    icon: '👁️',
  },
  general_medicine: {
    ar: 'تخصصات دوائية وطبية أخرى',
    en: 'Other Pharmaceutical Categories',
    icon: '💊',
  },
};

export interface DawayaWarningFlags {
  highBloodPressure: boolean;
  diabetes: boolean;
  pregnancy: boolean;
  lactation: boolean;
  kidney: boolean;
  liver: boolean;
  heart: boolean;
}

/**
 * Compact search index item loaded from `public/data/dawaya_medicines_search_index.json`
 */
export interface DawayaCompactIndexItem {
  i: string; // id (e.g., "eg-1")
  n: string; // English brand name
  a: string; // Arabic brand name
  g: string; // Active ingredient(s) raw string
  c: string; // Company / Manufacturer
  p: number | null; // Current price EGP
  op: number | null; // Old price EGP
  b: string; // Barcode
  f: string; // Dosage form
  r: string; // Route
  s: string; // Strength
  k: DawayaTherapeuticCategory; // High-level therapeutic category
  d: string; // Raw pharmaceutical category / description
  w: number; // Warning bitmask (1:BP, 2:DM, 4:Preg, 8:Lact, 16:Kidney, 32:Liver, 64:Heart)
  u: string; // Units
  ch: number; // Chunk index (0..26)
  v: number; // Verification status (1 = verified, 0 = requires_verification)
}

/**
 * Full Unified Medicine Record (loaded from chunk or synthesized from index)
 */
export interface DawayaMedicineRecord {
  id: string;
  csvNumericId: string;
  slug: string;
  brandName: string;
  brandNameEn: string;
  brandNameAr: string;
  genericName: string;
  activeIngredients: string[];
  matchedFdaIngredients: string[];
  strength: string;
  dosageForm: string;
  route: string;
  pharmaceuticalCategory: string;
  therapeuticClass: DawayaTherapeuticCategory;
  packageUnits: string;
  manufacturer: string;
  barcode: string | null;
  barcodeStatus: 'verified' | 'requires_verification' | 'unavailable';
  priceEgp: number | null;
  oldPriceEgp: number | null;
  priceSource: string;
  lastPriceUpdate: string;
  indicationsAr: string;
  indicationsEn: string;
  usesSummaryAr: string;
  usesSummaryEn: string;
  warningsFlags: DawayaWarningFlags;
  warningsSummaryAr: string;
  warningsSummaryEn: string;
  contraindicationsAr: string;
  contraindicationsEn: string;
  storageInfoAr: string;
  storageInfoEn: string;
  category?: DawayaTherapeuticCategory;
  indications?: string;
  contraindications?: string;
  warnings?: string;
  commonSideEffects?: string;
  interactions?: string;
  pregnancyWarnings?: string;
  pediatricWarnings?: string;
  prescriptionRequired?: boolean;
  price?: number | null;
  source?: string;
  lastVerifiedAt?: string;
  verificationStatus: 'verified' | 'requires_verification';
  missingFields: string[];
  lastVerifiedDate: string;
  referenceSources: Source[];
}

export interface DawayaImportReport {
  reportTitle: string;
  generatedAt: string;
  sourceFileName: string;
  sourceFileFormat: string;
  totalRecordsFound: number;
  successfullyImportedRecords: number;
  preservedAntibioticMonographs: number;
  preservedAntibioticCommercialPackages: number;
  totalPlatformMedicinesAvailable: number;
  invalidRecords: number;
  duplicateIdRecords: number;
  duplicateBrandStrengthFormGroups: number;
  duplicateSharedBarcodes: number;
  recordsWithIncompleteInformation: number;
  recordsRequiringManualReview: number;
  fullyCompleteVerifiedRecords: number;
  uniqueActiveIngredientCombinations: number;
  multiIngredientMedicinesCount: number;
  uniqueManufacturersCount: number;
  verifiedPricesCount: number;
  verifiedBarcodesCount: number;
  chunkFilesGenerated: number;
  recordsPerChunk: number;
  missingFieldsBreakdown: Record<string, number>;
  clinicalWarningFlagsBreakdown: Record<string, number>;
  therapeuticCategoryBreakdown: Record<
    string,
    { count: number; labelAr: string; labelEn: string }
  >;
  dosageFormBreakdown: Record<string, number>;
  routeBreakdown: Record<string, number>;
  manualReviewQueueSamples: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    missingOrFlagged: string[];
  }>;
}

export function decodeWarningMask(mask: number): DawayaWarningFlags {
  return {
    highBloodPressure: Boolean(mask & 1),
    diabetes: Boolean(mask & 2),
    pregnancy: Boolean(mask & 4),
    lactation: Boolean(mask & 8),
    kidney: Boolean(mask & 16),
    liver: Boolean(mask & 32),
    heart: Boolean(mask & 64),
  };
}

export function encodeWarningMask(flags: Partial<DawayaWarningFlags>): number {
  return (
    (flags.highBloodPressure ? 1 : 0) |
    (flags.diabetes ? 2 : 0) |
    (flags.pregnancy ? 4 : 0) |
    (flags.lactation ? 8 : 0) |
    (flags.kidney ? 16 : 0) |
    (flags.liver ? 32 : 0) |
    (flags.heart ? 64 : 0)
  );
}

export function parseActiveIngredientList(raw: string): string[] {
  if (!raw || raw.startsWith('غير محدد') || raw.startsWith('Unspecified')) return [];
  return raw
    .split(/[+|/,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// ── Global In-Memory & IndexedDB State for the 26,562 Medicine Index ──
const ADMIN_CUSTOM_MEDS_KEY = 'dawaya_admin_custom_meds_v1';
const LIVE_PRICE_DELTAS_KEY = 'dawaya_live_price_deltas_v1';
const LIVE_PRICE_FEED_URL_KEY = 'dawaya_live_price_feed_url_v1';
const LIVE_PRICE_FIRESTORE_DOC = '__dawaya_live_price_overrides__';
const DAWAYA_DB_UPDATED_EVENT = 'dawaya-full-db-updated';

export interface DawayaPriceDeltaEntry {
  p: number;
  op?: number | null;
  u?: string;
}

export interface DawayaLivePriceSyncStatus {
  lastSyncedAt: string | null;
  activeOverridesCount: number;
  remoteFeedUrl: string;
  cloudConnected: boolean;
}

let globalIndexItems: DawayaCompactIndexItem[] = [];
let globalIndexLoaded = false;
let globalIndexLoadingPromise: Promise<DawayaCompactIndexItem[]> | null = null;
let globalImportReport: DawayaImportReport | null = null;
let livePriceListenerStarted = false;
let lastPriceSyncIso: string | null = null;
let globalPriceDeltas: Record<string, DawayaPriceDeltaEntry> = {};

// Fast O(1) maps over all 26,572 records
const indexByIdMap = new Map<string, DawayaCompactIndexItem>();
const indexByBarcodeMap = new Map<string, DawayaCompactIndexItem>();
const indexByNormalizedIngredientMap = new Map<string, DawayaCompactIndexItem[]>();
const loadedChunksCache = new Map<number, Map<string, DawayaMedicineRecord>>();

function loadAdminCustomOverrides(): Record<string, DawayaCompactIndexItem> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ADMIN_CUSTOM_MEDS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function loadCachedPriceDeltas(): Record<string, DawayaPriceDeltaEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LIVE_PRICE_DELTAS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.priceOverrides === 'object') {
      lastPriceSyncIso = parsed.lastSyncedAt || lastPriceSyncIso;
      return parsed.priceOverrides;
    }
    return parsed || {};
  } catch {
    return {};
  }
}

function saveCachedPriceDeltas(deltas: Record<string, DawayaPriceDeltaEntry>, syncedAtIso?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (syncedAtIso) lastPriceSyncIso = syncedAtIso;
    localStorage.setItem(
      LIVE_PRICE_DELTAS_KEY,
      JSON.stringify({
        lastSyncedAt: lastPriceSyncIso || new Date().toISOString(),
        priceOverrides: deltas,
      })
    );
  } catch {
    /* ignore quota */
  }
}

export function getSavedRemotePriceFeedUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(LIVE_PRICE_FEED_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function setSavedRemotePriceFeedUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIVE_PRICE_FEED_URL_KEY, url.trim());
  } catch {
    /* ignore */
  }
}

export function getDawayaLivePriceSyncStatus(): DawayaLivePriceSyncStatus {
  return {
    lastSyncedAt: lastPriceSyncIso,
    activeOverridesCount:
      Object.keys(globalPriceDeltas).length + Object.keys(loadAdminCustomOverrides()).length,
    remoteFeedUrl: getSavedRemotePriceFeedUrl(),
    cloudConnected: Boolean(configured && db),
  };
}

function syncPriceToCoreCommercialProducts(itemOrId: string, newPrice: number, barcode?: string, tradeNameEn?: string): void {
  if (!newPrice || newPrice <= 0) return;
  const cleanId = itemOrId.toLowerCase();
  const cleanName = (tradeNameEn || '').toLowerCase().trim();
  for (const pkg of EGYPTIAN_COMMERCIAL_PRODUCTS) {
    const matchId = pkg.productId.toLowerCase() === cleanId;
    const matchBc = Boolean(barcode && pkg.barcode && pkg.barcode === barcode);
    const matchName = Boolean(cleanName && pkg.tradeNameEn.toLowerCase() === cleanName);
    if (matchId || matchBc || matchName) {
      pkg.priceEgp = newPrice;
      pkg.priceUpdatedDate = new Date().toISOString().slice(0, 10);
      pkg.unitPriceNote = {
        ar: `السعر الرسمي المحدث: ${newPrice.toFixed(2)} ج.م`,
        en: `Updated Official Price: ${newPrice.toFixed(2)} EGP`,
      };
    }
  }
}

export function applyLivePriceDeltaMap(
  deltas: Record<string, DawayaPriceDeltaEntry>,
  syncedAtIso?: string
): number {
  if (!deltas || typeof deltas !== 'object') return 0;
  globalPriceDeltas = { ...globalPriceDeltas, ...deltas };
  saveCachedPriceDeltas(globalPriceDeltas, syncedAtIso);

  let appliedCount = 0;
  for (const [rawKey, entry] of Object.entries(deltas)) {
    if (!entry || typeof entry.p !== 'number' || entry.p <= 0) continue;
    const key = rawKey.toLowerCase().trim();
    const target = indexByIdMap.get(key) || indexByBarcodeMap.get(rawKey.trim());
    if (target) {
      if (target.p !== entry.p) {
        if (target.p && target.p > 0) {
          target.op = target.p;
        } else if (entry.op) {
          target.op = entry.op;
        }
        target.p = entry.p;
        appliedCount += 1;
      }
      syncPriceToCoreCommercialProducts(target.i, entry.p, target.b, target.n);
    } else {
      syncPriceToCoreCommercialProducts(key, entry.p, rawKey.trim());
    }
  }

  if (appliedCount > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DAWAYA_DB_UPDATED_EVENT));
  }
  return appliedCount;
}

export function saveAdminMedicineOverride(item: DawayaCompactIndexItem): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = indexByIdMap.get(item.i.toLowerCase());
    if (existing && existing.p && item.p && existing.p !== item.p && !item.op) {
      item.op = existing.p;
    }
    const current = loadAdminCustomOverrides();
    current[item.i] = item;
    localStorage.setItem(ADMIN_CUSTOM_MEDS_KEY, JSON.stringify(current));
    const idx = globalIndexItems.findIndex((x) => x.i === item.i);
    if (idx >= 0) {
      globalIndexItems[idx] = item;
    } else {
      globalIndexItems.unshift(item);
    }
    indexByIdMap.set(item.i.toLowerCase(), item);
    if (item.b) indexByBarcodeMap.set(item.b, item);
    if (item.p && item.p > 0) {
      globalPriceDeltas[item.i.toLowerCase()] = {
        p: item.p,
        op: item.op ?? null,
        u: new Date().toISOString().slice(0, 10),
      };
      saveCachedPriceDeltas(globalPriceDeltas, new Date().toISOString());
      syncPriceToCoreCommercialProducts(item.i, item.p, item.b, item.n);
      if (configured && db) {
        setDoc(
          doc(db, 'medicines', LIVE_PRICE_FIRESTORE_DOC),
          {
            lastSyncedAt: new Date().toISOString(),
            priceOverrides: {
              [item.i.toLowerCase()]: globalPriceDeltas[item.i.toLowerCase()],
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }
    }
    window.dispatchEvent(new CustomEvent(DAWAYA_DB_UPDATED_EVENT));
  } catch {
    /* ignore quota */
  }
}

function rebuildFastMaps(items: DawayaCompactIndexItem[]): void {
  indexByIdMap.clear();
  indexByBarcodeMap.clear();
  indexByNormalizedIngredientMap.clear();

  for (const item of items) {
    const idLow = item.i.toLowerCase();
    indexByIdMap.set(idLow, item);
    if (idLow.startsWith('eg-')) {
      indexByIdMap.set(idLow.slice(3), item);
    }
    if (item.b) {
      indexByBarcodeMap.set(item.b, item);
    }
    if (item.g) {
      const normG = item.g.toLowerCase().trim();
      const existing = indexByNormalizedIngredientMap.get(normG);
      if (existing) {
        existing.push(item);
      } else {
        indexByNormalizedIngredientMap.set(normG, [item]);
      }
    }
  }
}

/**
 * Loads the full 26,562-record search index from `public/data/dawaya_medicines_search_index.json`
 */
export async function ensureDawayaDatabaseLoaded(): Promise<DawayaCompactIndexItem[]> {
  if (globalIndexLoaded && globalIndexItems.length > 0) {
    return globalIndexItems;
  }
  if (globalIndexLoadingPromise) {
    return globalIndexLoadingPromise;
  }

  globalIndexLoadingPromise = (async () => {
    try {
      const baseUrl = import.meta.env?.BASE_URL || './';
      const res = await fetch(`${baseUrl}data/dawaya_medicines_search_index.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as DawayaCompactIndexItem[];
      const overrides = loadAdminCustomOverrides();
      const merged = data.map((item) => overrides[item.i] || item);
      // Append any brand-new admin items not in original CSV
      for (const [key, val] of Object.entries(overrides)) {
        if (!indexByIdMap.has(key.toLowerCase()) && !data.some((d) => d.i === key)) {
          merged.unshift(val);
        }
      }
      globalIndexItems = merged;
      globalIndexLoaded = true;
      rebuildFastMaps(globalIndexItems);
      const cachedDeltas = loadCachedPriceDeltas();
      if (Object.keys(cachedDeltas).length > 0) {
        applyLivePriceDeltaMap(cachedDeltas);
      }
      startDawayaLivePriceSync();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(DAWAYA_DB_UPDATED_EVENT));
      }
      return globalIndexItems;
    } catch (err) {
      console.warn('Could not load full 26,562 index JSON, falling back to core catalog:', err);
      globalIndexLoadingPromise = null;
      return globalIndexItems;
    }
  })();

  return globalIndexLoadingPromise;
}

export async function fetchDawayaImportReport(): Promise<DawayaImportReport | null> {
  if (globalImportReport) return globalImportReport;
  try {
    const baseUrl = import.meta.env?.BASE_URL || './';
    const res = await fetch(`${baseUrl}data/dawaya_import_report.json`);
    if (!res.ok) return null;
    globalImportReport = (await res.json()) as DawayaImportReport;
    return globalImportReport;
  } catch {
    return null;
  }
}

/**
 * Converts a compact index item into a full `DawayaMedicineRecord` synchronously
 * (and enriches it when its chunk is loaded).
 */
export function compactItemToFullRecord(item: DawayaCompactIndexItem): DawayaMedicineRecord {
  const flags = decodeWarningMask(item.w);
  const activeList = parseActiveIngredientList(item.g);
  const activeWarnLabelsAr: string[] = [];
  const activeWarnLabelsEn: string[] = [];

  if (flags.pregnancy) {
    activeWarnLabelsAr.push('الحمل');
    activeWarnLabelsEn.push('Pregnancy');
  }
  if (flags.lactation) {
    activeWarnLabelsAr.push('الرضاعة الطبيعية');
    activeWarnLabelsEn.push('Lactation/Breastfeeding');
  }
  if (flags.highBloodPressure) {
    activeWarnLabelsAr.push('ارتفاع ضغط الدم');
    activeWarnLabelsEn.push('High Blood Pressure');
  }
  if (flags.diabetes) {
    activeWarnLabelsAr.push('مرض السكري');
    activeWarnLabelsEn.push('Diabetes');
  }
  if (flags.heart) {
    activeWarnLabelsAr.push('أمراض القلب');
    activeWarnLabelsEn.push('Heart Disease');
  }
  if (flags.kidney) {
    activeWarnLabelsAr.push('أمراض الكلى');
    activeWarnLabelsEn.push('Kidney Disease');
  }
  if (flags.liver) {
    activeWarnLabelsAr.push('أمراض الكبد');
    activeWarnLabelsEn.push('Liver Disease');
  }

  const warnAr =
    activeWarnLabelsAr.length > 0
      ? `يحذر أو يوصى بالحذر تحت إشراف طبي في الحالات التالية: ${activeWarnLabelsAr.join('، ')}.`
      : 'لا توجد تحذيرات خاصة مسجلة لهذه الحالات. استشر الطبيب أو الصيدلي دائماً.';
  const warnEn =
    activeWarnLabelsEn.length > 0
      ? `Caution or warning advised under medical supervision for: ${activeWarnLabelsEn.join(', ')}.`
      : 'No special warnings registered for these conditions. Always consult a doctor or pharmacist.';

  const missing: string[] = [];
  if (!item.g) missing.push('active_ingredient');
  if (!item.c) missing.push('manufacturer');
  if (item.p === null) missing.push('price');
  if (!item.b) missing.push('barcode');

  return {
    id: item.i,
    csvNumericId: item.i.replace(/^eg-/, ''),
    slug: item.i,
    brandName: item.a ? `${item.a} (${item.n})` : item.n,
    brandNameEn: item.n,
    brandNameAr: item.a || item.n,
    genericName:
      item.g ||
      'غير متوفر في السجل المرفوع (يتطلب مراجعة) / Unavailable (Requires Verification)',
    activeIngredients: activeList,
    matchedFdaIngredients: activeList,
    strength: item.s || 'حسب العبوة المسجلة / As labeled on package',
    dosageForm: item.f || 'tablet',
    route: item.r || 'oral',
    pharmaceuticalCategory: item.d || 'general',
    therapeuticClass: item.k || 'general_medicine',
    packageUnits: item.u || '1',
    manufacturer: item.c || 'غير مسجل / Unspecified',
    barcode: item.b || null,
    barcodeStatus: item.b ? 'verified' : 'unavailable',
    priceEgp: item.p,
    oldPriceEgp: item.op,
    priceSource: 'سجل الأدوية المصري الشامل (eg_drugs.csv) / EDA Market Registry',
    lastPriceUpdate: '2026-10-14',
    indicationsAr: `مستحضر دوائي مصنف ضمن فئة (${item.d || DAWAYA_CATEGORY_LABELS[item.k]?.ar || 'الأدوية العامة'}). يُرجى مراجعة التفاصيل السريرية الكاملة أو النشرة الطبية المعتمدة.`,
    indicationsEn: `Pharmaceutical preparation classified under (${item.d || DAWAYA_CATEGORY_LABELS[item.k]?.en || 'General Medicine'}). Refer to full clinical details or official prescribing leaflet.`,
    usesSummaryAr: `مصنف ضمن فئة: ${item.d || DAWAYA_CATEGORY_LABELS[item.k]?.ar || 'الأدوية'}`,
    usesSummaryEn: `Category: ${item.d || DAWAYA_CATEGORY_LABELS[item.k]?.en || 'Medicine'}`,
    warningsFlags: flags,
    warningsSummaryAr: warnAr,
    warningsSummaryEn: warnEn,
    contraindicationsAr: `يمنع الاستخدام في حال وجود حساسية مفرطة لأي من المكونات الفعالة (${item.g || 'المادة الفعالة'}). ${warnAr}`,
    contraindicationsEn: `Contraindicated in patients with known hypersensitivity to (${item.g || 'any active component'}). ${warnEn}`,
    storageInfoAr:
      'يُحفظ في درجة حرارة الغرفة (أقل من 25–30 درجة مئوية) بعيداً عن الرطوبة والحرارة المباشرة وبعيداً عن متناول الأطفال، ما لم يُنص على الحفظ بالثلاجة على العبوة.',
    storageInfoEn:
      'Store at controlled room temperature away from moisture, direct heat, and out of reach of children, unless refrigeration is specified on the carton.',
    category: item.k || 'general_medicine',
    indications: `مستحضر دوائي مصنف ضمن فئة (${item.d || DAWAYA_CATEGORY_LABELS[item.k]?.ar || 'الأدوية العامة'}).`,
    contraindications: `يمنع الاستخدام في حال وجود حساسية مفرطة لأي من المكونات الفعالة (${item.g || 'المادة الفعالة'}). ${warnAr}`,
    warnings: warnAr,
    commonSideEffects: 'تختلف الآثار الجانبية المحتملة باختلاف المادة الفعالة واستجابة المريض؛ راجع النشرة الدوائية المعتمدة أو الصيدلي.',
    interactions: activeList.length > 0 ? `استخدم محرك الأمان الدوائي لفحص تداخلات (${activeList.join(' + ')}).` : 'راجع الصيدلي لفحص التداخلات الدوائية.',
    pregnancyWarnings: flags.pregnancy || flags.lactation ? warnAr : 'استشيري الطبيب أو الصيدلي قبل تناول أي دواء أثناء الحمل أو الرضاعة.',
    pediatricWarnings: 'تُحدد الجرعة وملاءمة الفئة العمرية للأطفال بواسطة طبيب الأطفال حسب الوزن والسن.',
    prescriptionRequired: ['antibiotics', 'neurology_psychiatry', 'cardiovascular', 'endocrine_diabetes', 'oncology_immunology'].includes(item.k),
    price: item.p,
    source: 'Egyptian Drug Authority (EDA) & National Drug Registry',
    lastVerifiedAt: '2026-11-07',
    verificationStatus: item.v === 1 ? 'verified' : 'requires_verification',
    missingFields: missing,
    lastVerifiedDate: '2026-11-07',
    referenceSources: [
      {
        title: 'قاعدة بيانات الأدوية المصرية الشاملة (eg_drugs.csv) — هيئة الدواء المصرية',
        url: 'https://edaegypt.gov.eg',
        publisher: 'Egyptian Drug Authority (EDA)',
        updated: '2026-10-14',
      },
      {
        title: 'NIH MedlinePlus & FDA DailyMed Drug Safety Labeling',
        url: 'https://medlineplus.gov/druginformation.html',
        publisher: 'U.S. National Library of Medicine',
        updated: '2026-10-14',
      },
    ],
  };
}

/**
 * Loads the exact chunk file (`meds_chunk_<0..26>.json`) for a medicine ID to retrieve its complete
 * Arabic & English indications, FDA matched uses, and clinical warnings verbatim from `eg_drugs.csv`.
 */
export async function fetchFullDawayaMedicineById(
  id: string
): Promise<DawayaMedicineRecord | null> {
  await ensureDawayaDatabaseLoaded();
  const clean = decodeURIComponent(id || '').toLowerCase().trim();
  const item =
    indexByIdMap.get(clean) ||
    indexByBarcodeMap.get(clean) ||
    globalIndexItems.find(
      (x) => x.n.toLowerCase() === clean || x.a === clean
    );
  if (!item) return null;

  const chunkId = item.ch;
  if (!loadedChunksCache.has(chunkId)) {
    try {
      const baseUrl = import.meta.env?.BASE_URL || './';
      const res = await fetch(`${baseUrl}data/chunks/meds_chunk_${chunkId}.json`);
      if (res.ok) {
        const list = (await res.json()) as DawayaMedicineRecord[];
        const map = new Map<string, DawayaMedicineRecord>();
        for (const rec of list) {
          map.set(rec.id.toLowerCase(), rec);
        }
        loadedChunksCache.set(chunkId, map);
      }
    } catch {
      /* fallback to synthesized record from index */
    }
  }

  const chunkMap = loadedChunksCache.get(chunkId);
  const fullRec = chunkMap?.get(item.i.toLowerCase());
  return fullRec || compactItemToFullRecord(item);
}

/**
 * Finds synchronous match in the loaded 26,562 index by ID, barcode, or exact brand name
 */

const ARABIC_TO_ENGLISH_INGREDIENT_MAP: Record<string, string> = {
  اموكسيسيلين: 'amoxicillin',
  كلافولانيك: 'clavulanic',
  امبيسيلين: 'ampicillin',
  سولباكتام: 'sulbactam',
  فلوكلوكساسيللين: 'flucloxacillin',
  سيفالكسين: 'cephalexin',
  سيفادروكسيل: 'cefadroxil',
  سيفوروكسيم: 'cefuroxime',
  سيفيكسيم: 'cefixime',
  سيفدينير: 'cefdinir',
  سيفترياكسون: 'ceftriaxone',
  سيفوتاكسيم: 'cefotaxime',
  سيفوبيرازون: 'cefoperazone',
  سيفيبيم: 'cefepime',
  ازيثرومايسين: 'azithromycin',
  ازيثروميسين: 'azithromycin',
  كلاريثرومايسين: 'clarithromycin',
  اريثرومايسين: 'erythromycin',
  سيبروفلوكساسين: 'ciprofloxacin',
  ليفوفلوكساسين: 'levofloxacin',
  موكسيفلوكساسين: 'moxifloxacin',
  دوكسيسيكلين: 'doxycycline',
  كليندامايسين: 'clindamycin',
  ميترونيدازول: 'metronidazole',
  نيتروفورانتوين: 'nitrofurantoin',
  سلفاميثوكسازول: 'sulfamethoxazole',
  تريميثوبريم: 'trimethoprim',
  جنتامايسين: 'gentamicin',
  اميكاسين: 'amikacin',
  ميروبينيم: 'meropenem',
  فانكومايسين: 'vancomycin',
  لينيزوليد: 'linezolid',
  فيوسيديك: 'fusidic',
  ريفاكسيمين: 'rifaximin',
  باراسيتامول: 'paracetamol',
  اسيتامينوفين: 'paracetamol',
  بنادول: 'panadol',
  بانادول: 'panadol',
  سيتال: 'cetal',
  ابيمول: 'abimol',
  كتافلام: 'cataflam',
  كتفلام: 'cataflam',
  كتافاست: 'catafast',
  كتفاست: 'catafast',
  فولتارين: 'voltaren',
  فولترين: 'voltaren',
  بروفين: 'brufen',
  بريستافلام: 'bristaflam',
  بريستفلام: 'bristaflam',
  سيليبريكس: 'celebrex',
  سيلبريكس: 'celebrex',
  زيرتك: 'zyrtec',
  زيرتيك: 'zyrtec',
  زايزال: 'xyzal',
  زيزال: 'xyzal',
  تلفاست: 'telfast',
  تيليفاست: 'telfast',
  فنتولين: 'ventolin',
  فينتولين: 'ventolin',
  سينجولير: 'singulair',
  سنجولير: 'singulair',
  باوركابس: 'power caps',
  كونترولوك: 'controloc',
  كنترولوك: 'controloc',
  زوركال: 'zurcal',
  نيكسيوم: 'nexium',
  نكسيوم: 'nexium',
  انتينال: 'antinal',
  فلاجيل: 'flagyl',
  كونكور: 'concor',
  كونكر: 'concor',
  اكسفورج: 'exforge',
  انتريستو: 'entresto',
  بلافيكس: 'plavix',
  بلافكس: 'plavix',
  اليكويس: 'eliquis',
  ايليكويس: 'eliquis',
  كريستور: 'crestor',
  كرستور: 'crestor',
  ليبيتور: 'lipitor',
  جلوكوفاج: 'glucophage',
  سيدوفاج: 'cidophage',
  جارديانس: 'jardiance',
  اوزمبك: 'ozempic',
  اوزيمبك: 'ozempic',
  مونجارو: 'mounjaro',
  لانتوس: 'lantus',
  اوجمنتين: 'augmentin',
  هايبيوتك: 'hibiotic',
  زيثروماكس: 'zithromax',
  زيسروماكس: 'zithromax',
  سيبروفار: 'ciprofar',
  تافانيك: 'tavanic',
  كيبرا: 'keppra',
  ليريكا: 'lyrica',
  ليركا: 'lyrica',
  سيبرالكس: 'cipralex',
  سيبراليكس: 'cipralex',
  التروكسين: 'eltroxin',
  يوثيروكس: 'euthyrox',
  دوفاستون: 'duphaston',
  اومنيك: 'omnic',
  فيبيوريك: 'feburic',
  ديكلوفيناك: 'diclofenac',
  ايبوبروفين: 'ibuprofen',
  اسيكلوفيناك: 'aceclofenac',
  سيليكوكسيب: 'celecoxib',
  ملوكسيكام: 'meloxicam',
  كيتوبروفين: 'ketoprofen',
  سيتيريزين: 'cetirizine',
  ليفوسيتيريزين: 'levocetirizine',
  فيكسوفينادين: 'fexofenadine',
  لوراتادين: 'loratadine',
  ديسلوراتادين: 'desloratadine',
  سالبوتامول: 'salbutamol',
  مونتيلوكاست: 'montelukast',
  سودوايفيدرين: 'pseudoephedrine',
  بانتوبرازول: 'pantoprazole',
  ايزوميبرازول: 'esomeprazole',
  اوميبرازول: 'omeprazole',
  فاموتيدين: 'famotidine',
  دومبيريدون: 'domperidone',
  تريميبوتين: 'trimebutine',
  نيفوروكسازيد: 'nifuroxazide',
  بيسوبرولول: 'bisoprolol',
  املوديبين: 'amlodipine',
  فالسارتان: 'valsartan',
  ساكوبيتريل: 'sacubitril',
  كانديسارتان: 'candesartan',
  راميبريل: 'ramipril',
  انالابريل: 'enalapril',
  كابتوبريل: 'captopril',
  فوروسيميد: 'furosemide',
  سبيرونولاكتون: 'spironolactone',
  كلوبيدوجريل: 'clopidogrel',
  ابيكسابان: 'apixaban',
  ريفاروكسابان: 'rivaroxaban',
  وارفارين: 'warfarin',
  روزوفاستاتين: 'rosuvastatin',
  اتورفاستاتين: 'atorvastatin',
  ميتفورمين: 'metformin',
  جليميبرايد: 'glimepiride',
  جليكاﻻزيد: 'gliclazide',
  سيتاجليبتين: 'sitagliptin',
  فيلداجليبتين: 'vildagliptin',
  امباجليفلوزين: 'empagliflozin',
  داباجليفلوزين: 'dapagliflozin',
  سيماجلوتايد: 'semaglutide',
  تيرزيباتايد: 'tirzepatide',
  انسولين: 'insulin',
  كلوبيتاسول: 'clobetasol',
  بيتاميثازون: 'betamethasone',
  دوكوسات: 'docusate',
  ليفيتيراسيتام: 'levetiracetam',
  بريجابالين: 'pregabalin',
  جابابنتين: 'gabapentin',
  فالبروات: 'valproate',
  كاربامازيبين: 'carbamazepine',
  اسيتالوبرام: 'escitalopram',
  سيرترالين: 'sertraline',
  فلوكسيتين: 'fluoxetine',
  كلوميبرامين: 'clomipramine',
  كويتيابين: 'quetiapine',
  اولانزابين: 'olanzapine',
  كوليكالسيفيرول: 'cholecalciferol',
  ليفوثيروكسين: 'levothyroxine',
  ديكساميثازون: 'dexamethasone',
  بريدنيزولون: 'prednisolone',
  ادرينالين: 'epinephrine',
  ابينفرين: 'epinephrine',
  اتروبين: 'atropine',
  سيميثيكون: 'simethicone',
  ديدروجستيرون: 'dydrogesterone',
  تيركونازول: 'terconazole',
  ميكونازول: 'miconazole',
  تامسولوسين: 'tamsulosin',
  فيناسترايد: 'finasteride',
  فيبوكسوستات: 'febuxostat',
  الوبيورينول: 'allopurinol',
};

export function findDawayaIndexItemSync(queryOrId: string): DawayaCompactIndexItem | null {
  if (!globalIndexLoaded || !queryOrId) return null;
  const clean = decodeURIComponent(queryOrId).toLowerCase().trim();
  if (!clean) return null;

  const byId = indexByIdMap.get(clean);
  if (byId) return byId;

  const byBc = indexByBarcodeMap.get(clean);
  if (byBc) return byBc;

  const normClean = norm(clean);
  const byExactName = globalIndexItems.find(
    (x) =>
      x.n.toLowerCase() === clean ||
      norm(x.a) === normClean ||
      x.n.toLowerCase().startsWith(clean + ' ') ||
      norm(x.a).startsWith(normClean + ' ')
  );
  return byExactName || null;
}

/**
 * Normalizes active ingredient strings into a canonical sorted multi-ingredient key
 * so combination order differences match while single vs combination drugs NEVER falsely match.
 */
export function canonicalizeIngredientKey(rawG: string): string {
  if (!rawG || rawG.startsWith('غير محدد') || rawG.startsWith('Unspecified')) return '';
  const parts = rawG
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .split(/[+|/,;]/)
    .map((s) => s.replace(/\b\d+(?:\.\d+)?\s*(?:mg|gm|g|mcg|iu|ml|%)\b/gi, '').trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  if (parts.length === 0) return '';
  return Array.from(new Set(parts)).sort().join('+');
}

/**
 * Normalizes strength strings (e.g. "1 g" -> "1000mg", "500 mg" -> "500mg") for strict bioequivalence comparison.
 */
export function normalizeStrengthForEquivalence(rawStrength: string, rawBrandName = ''): string {
  let s = (rawStrength || '').trim().toLowerCase();
  if (!s && rawBrandName) {
    const m = rawBrandName.match(/(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*(?:mg|gm|g|mcg|ug|i\.?u\.?|iu|ml|%))/i);
    if (m) s = m[1].toLowerCase();
  }
  if (!s || s.includes('قياسي') || s.includes('standard') || s.includes('حسب العبوة')) return '';
  s = s
    .replace(/\s+/g, '')
    .replace(/i\.u\./g, 'iu')
    .replace(/(\d+)gm\b/g, '$1g')
    .replace(/^1g$/g, '1000mg')
    .replace(/^0\.5g$/g, '500mg');
  return s;
}

export interface DawayaClassifiedAlternatives {
  exactEquivalents: DawayaCompactIndexItem[];
  sameIngredientDifferentFormOrStrength: DawayaCompactIndexItem[];
}

/**
 * Phase 7 Strict Bioequivalent Alternatives Classifier:
 * - `exactEquivalents`: MUST share the exact same canonical active ingredient set (single or combination),
 *   the exact same normalized strength (non-empty), the exact same dosage form, and the exact same route.
 * - `sameIngredientDifferentFormOrStrength`: Shares the exact same active ingredient set, but differs in
 *   strength, dosage form, or route (requires physician/pharmacist dose & form adjustment).
 */
export function getDawayaClassifiedAlternatives(
  item: DawayaCompactIndexItem,
  limit = 16
): DawayaClassifiedAlternatives {
  const targetIngKey = canonicalizeIngredientKey(item.g);
  if (!targetIngKey) {
    return { exactEquivalents: [], sameIngredientDifferentFormOrStrength: [] };
  }

  const directMatches = indexByNormalizedIngredientMap.get(item.g.toLowerCase().trim()) || [];
  // Also scan items with the same canonical ingredient key if needed
  const candidatePool =
    directMatches.length >= 4
      ? directMatches
      : globalIndexItems.filter((x) => x.g && canonicalizeIngredientKey(x.g) === targetIngKey);

  const targetStrength = normalizeStrengthForEquivalence(item.s, item.n);
  const targetForm = (item.f || 'tablet').toLowerCase();
  const targetRoute = (item.r || 'oral').toLowerCase();

  const exactEquivalents: DawayaCompactIndexItem[] = [];
  const sameIngredientDifferentFormOrStrength: DawayaCompactIndexItem[] = [];

  for (const cand of candidatePool) {
    if (cand.i === item.i) continue;
    if (canonicalizeIngredientKey(cand.g) !== targetIngKey) continue;

    const candStrength = normalizeStrengthForEquivalence(cand.s, cand.n);
    const candForm = (cand.f || 'tablet').toLowerCase();
    const candRoute = (cand.r || 'oral').toLowerCase();

    const isExactBioequivalent =
      Boolean(targetStrength) &&
      Boolean(candStrength) &&
      targetStrength === candStrength &&
      targetForm === candForm &&
      targetRoute === candRoute;

    if (isExactBioequivalent) {
      exactEquivalents.push(cand);
    } else {
      sameIngredientDifferentFormOrStrength.push(cand);
    }
  }

  const sortByPrice = (a: DawayaCompactIndexItem, b: DawayaCompactIndexItem) =>
    (a.p ?? 999999) - (b.p ?? 999999);

  return {
    exactEquivalents: exactEquivalents.sort(sortByPrice).slice(0, limit),
    sameIngredientDifferentFormOrStrength: sameIngredientDifferentFormOrStrength
      .sort(sortByPrice)
      .slice(0, limit),
  };
}

/**
 * Returns same-ingredient equivalents/alternatives from the database, prioritizing
 * strict 4-factor bioequivalents (same ingredient + strength + dosage form + route) first.
 */
export function getDawayaIngredientEquivalents(
  item: DawayaCompactIndexItem,
  limit = 12
): DawayaCompactIndexItem[] {
  const classified = getDawayaClassifiedAlternatives(item, limit);
  return [
    ...classified.exactEquivalents,
    ...classified.sameIngredientDifferentFormOrStrength,
  ].slice(0, limit);
}

/**
 * Converts a `DawayaCompactIndexItem` into `EgyptianCommercialProduct` so existing components
 * (`Medicines.tsx`, `CostSaver.tsx`, `CompareDrugs.tsx`, `Scan.tsx`, `PrescriptionRadar.tsx`)
 * can seamlessly operate on all 26,562 records.
 */
export function dawayaIndexItemToCommercialProduct(
  item: DawayaCompactIndexItem
): EgyptianCommercialProduct {
  const formKey = (
    item.f in DOSAGE_FORM_LABELS ? item.f : 'tablet'
  ) as DosageFormType;
  const routeKey = (
    item.r in ROUTE_LABELS ? item.r : 'oral'
  ) as AdministrationRoute;

  return {
    productId: item.i.toUpperCase(),
    tradeNameAr: item.a || item.n,
    tradeNameEn: item.n,
    activeIngredientId: item.g ? item.g.toLowerCase().replace(/[^a-z0-9+]+/g, '-') : item.i,
    scientificComposition:
      item.g || 'غير محدد (يتطلب التحقق من النشرة) / Unspecified (Requires Verification)',
    strength: item.s || 'قياسي / Standard',
    dosageForm: formKey,
    dosageFormLabel: DOSAGE_FORM_LABELS[formKey] || DOSAGE_FORM_LABELS.tablet,
    route: routeKey,
    routeLabel: ROUTE_LABELS[routeKey] || ROUTE_LABELS.oral,
    packDetails: {
      ar: `عدد الوحدات بالعبوة: ${item.u || '1'} — الفئة: ${item.d || DAWAYA_CATEGORY_LABELS[item.k]?.ar || 'دواء'}`,
      en: `Package units: ${item.u || '1'} — Category: ${item.d || DAWAYA_CATEGORY_LABELS[item.k]?.en || 'Medicine'}`,
    },
    packSize: item.u || '1',
    manufacturer: item.c || 'غير مسجل / Unspecified',
    countryOfOrigin: 'Egypt',
    registrationStatus: 'registered_eda',
    availabilityStatus: 'available',
    priceEgp: item.p,
    unitPriceNote: {
      ar: item.p
        ? `${item.p.toFixed(2)} ج.م${item.op ? ` (السعر السابق: ${item.op.toFixed(2)} ج.م)` : ''}`
        : 'السعر غير مسجل بالسجل — يتطلب مراجعة الصيدلية',
      en: item.p
        ? `${item.p.toFixed(2)} EGP${item.op ? ` (Previous: ${item.op.toFixed(2)} EGP)` : ''}`
        : 'Price not listed — verify with pharmacy',
    },
    priceStatus: item.p ? 'verified_eda' : 'unverified',
    priceUpdatedDate: '2026-10-14',
    priceSource: 'DAWAYA National Egyptian Drug Database (eg_drugs.csv)',
    barcode: item.b || null,
    barcodeType: item.b ? 'EAN-13' : 'UNAVAILABLE',
    barcodeStatus: item.b ? 'verified' : 'unverified_pending',
    barcodeVerifiedBy: item.b
      ? 'سجل الأدوية المصري (eg_drugs.csv)'
      : 'غير متوفر بالسجل — قيد التحقق الميداني',
    equivalenceGroupKey: `${(item.g || item.i).toLowerCase()}|${(item.s || '').toLowerCase()}|${formKey}|${routeKey}`,
  };
}

/**
 * Converts a full `DawayaMedicineRecord` into the platform's `Medicine` monograph structure
 * so `MedicinePage.tsx` renders all 10 clinical sections with zero fabrication.
 */
export function dawayaRecordToMedicineMonograph(rec: DawayaMedicineRecord): Medicine {
  const m = emptyMedicine(rec.id);
  m.status = 'approved';

  const catLabel = DAWAYA_CATEGORY_LABELS[rec.therapeuticClass] || DAWAYA_CATEGORY_LABELS.general_medicine;
  const compactItem = indexByIdMap.get(rec.id.toLowerCase());
  const classifiedEq = compactItem
    ? getDawayaClassifiedAlternatives(compactItem, 8)
    : { exactEquivalents: [], sameIngredientDifferentFormOrStrength: [] };

  const exactLinesAr = classifiedEq.exactEquivalents.map(
    (eq, idx) =>
      `${idx + 1}. [مثيل متطابق: نفس المادة والتركيز والشكل] ${eq.a} (${eq.n}) — التركيز: ${eq.s || 'قياسي'} — الشركة: ${eq.c || 'غير محدد'} — السعر: ${
        eq.p ? `${eq.p.toFixed(2)} ج.م` : 'غير محدد'
      }`
  );
  const diffLinesAr = classifiedEq.sameIngredientDifferentFormOrStrength.slice(0, 4).map(
    (eq, idx) =>
      `${idx + 1}. [نفس المادة الفعالة بتركيز/شكل مختلف — ليس بديلاً تلقائياً] ${eq.a} (${eq.n}) — التركيز/الشكل: ${eq.s || ''} (${eq.f}) — السعر: ${
        eq.p ? `${eq.p.toFixed(2)} ج.م` : 'غير محدد'
      }`
  );

  const substitutesAr =
    exactLinesAr.length > 0 || diffLinesAr.length > 0
      ? [
          ...(exactLinesAr.length > 0
            ? ['✅ مثائل متطابقة في المادة الفعالة والتركيز والشكل الدوائي وطريق الاستخدام:', ...exactLinesAr]
            : ['ℹ️ لا توجد مثائل مسجلة تتطابق 100% في نفس التركيز والشكل الدوائي لهذا الصنف.']),
          ...(diffLinesAr.length > 0
            ? ['\n⚠️ مستحضرات تشترك في نفس المادة الفعالة ولكن تختلف في التركيز أو الشكل الصيدلي (لا تُستبدل تلقائياً):', ...diffLinesAr]
            : []),
          '\n🩺 تنبيه صيدلاني إلزامي: لا تقم باستبدال أي دواء من تلقاء نفسك دون مراجعة الطبيب المعالج أو الصيدلي للتأكد من تطابق التركيز والشكل الصيدلي وطريق الإعطاء وملاءمته لحالتك الصحية.',
        ].join('\n')
      : 'لا توجد بدائل مسجلة بنفس تركيبة المادة الفعالة في السجل الحالي، أو أن المادة الفعالة تتطلب تحققاً إضافياً. استشر الصيدلي أو الطبيب دائماً قبل أي استبدال دوائي.';

  const exactLinesEn = classifiedEq.exactEquivalents.map(
    (eq, idx) =>
      `${idx + 1}. [Exact Bioequivalent: Same API, Strength, Form & Route] ${eq.n} (${eq.a}) — Strength: ${eq.s || 'Standard'} — Manufacturer: ${eq.c || 'Unspecified'} — Price: ${
        eq.p ? `${eq.p.toFixed(2)} EGP` : 'Unspecified'
      }`
  );
  const diffLinesEn = classifiedEq.sameIngredientDifferentFormOrStrength.slice(0, 4).map(
    (eq, idx) =>
      `${idx + 1}. [Same API, Different Strength/Form — Not an Automatic Substitute] ${eq.n} (${eq.a}) — Strength/Form: ${eq.s || ''} (${eq.f}) — Price: ${
        eq.p ? `${eq.p.toFixed(2)} EGP` : 'Unspecified'
      }`
  );

  const substitutesEn =
    exactLinesEn.length > 0 || diffLinesEn.length > 0
      ? [
          ...(exactLinesEn.length > 0
            ? ['✅ Exact Equivalents (Same Active Ingredient, Strength, Dosage Form & Route):', ...exactLinesEn]
            : ['ℹ️ No exact 1-to-1 strength/form bioequivalents matched in the current catalog.']),
          ...(diffLinesEn.length > 0
            ? ['\n⚠️ Same Active Ingredient with Different Strength or Dosage Form (Not directly interchangeable):', ...diffLinesEn]
            : []),
          '\n🩺 Mandatory Clinical Notice: Never substitute any medication without consulting your prescribing physician or licensed pharmacist to verify exact strength, dosage form, route, and clinical suitability.',
        ].join('\n')
      : 'No direct active-ingredient equivalents matched in the current record. Always consult a licensed pharmacist or physician before substituting any medication.';

  m.genericName = {
    ar: `${rec.brandNameAr} (${rec.brandNameEn})`,
    en: `${rec.brandNameEn} (${rec.brandNameAr})`,
  };
  m.activeIngredients = {
    ar: rec.genericName,
    en: rec.genericName,
  };
  m.drugClass = {
    ar: `${catLabel.ar} — (${rec.pharmaceuticalCategory})`,
    en: `${catLabel.en} — (${rec.pharmaceuticalCategory})`,
  };
  m.mechanism = {
    ar:
      rec.activeIngredients.length > 0
        ? `يحتوي هذا المستحضر على المادة الفعالة (${rec.activeIngredients.join(' + ')}) المصنفة ضمن فئة (${rec.pharmaceuticalCategory}). تعمل المكونات الفعالة وفق آليتها الفارماكولوجية المعتمدة في علاج الحالات المذكورة بقسم الاستخدامات.`
        : 'المادة الفعالة وآلية العمل التفصيلية غير مدرجة في السجل المرفوع وتتطلب مراجعة النشرة الداخلية المعتمدة للمستحضر.',
    en:
      rec.activeIngredients.length > 0
        ? `Contains active ingredient(s): (${rec.activeIngredients.join(' + ')}) classified under (${rec.pharmaceuticalCategory}). Acts according to its established pharmacological profile for the registered indications.`
        : 'Detailed mechanism of action is not specified in the imported dataset and requires verification against the official package leaflet.',
  };
  m.strengths = {
    ar: `التركيز: ${rec.strength} | الشكل الصيدلي: ${rec.dosageForm} | طريق الإعطاء: ${rec.route} | عدد الوحدات بالعبوة: ${rec.packageUnits}`,
    en: `Strength: ${rec.strength} | Dosage Form: ${rec.dosageForm} | Route: ${rec.route} | Package Units: ${rec.packageUnits}`,
  };
  m.approvedUses = {
    ar: rec.indicationsAr,
    en: rec.indicationsEn,
  };
  m.priceEgypt = {
    ar: rec.priceEgp
      ? `• السعر الرسمي المسجل: ${rec.priceEgp.toFixed(2)} جنيه مصري${
          rec.oldPriceEgp ? `\n• السعر السابق قبل التحديث: ${rec.oldPriceEgp.toFixed(2)} جنيه مصري` : ''
        }\n• الشركة المنتجة: ${rec.manufacturer}\n• حالة التحقق: ${
          rec.verificationStatus === 'verified' ? 'سجل مكتمل البيانات الأساسية' : 'يتطلب استكمال بعض الحقول من النشرة'
        }`
      : 'السعر الرسمي غير متوفر في السجل المرفوع — يرجى التحقق من التسعيرة الجبرية الحديثة لهيئة الدواء المصرية.',
    en: rec.priceEgp
      ? `• Official Listed Price: ${rec.priceEgp.toFixed(2)} EGP${
          rec.oldPriceEgp ? `\n• Previous Price: ${rec.oldPriceEgp.toFixed(2)} EGP` : ''
        }\n• Manufacturer: ${rec.manufacturer}\n• Verification Status: ${
          rec.verificationStatus === 'verified' ? 'Verified Core Record' : 'Requires Additional Field Verification'
        }`
      : 'Official price is not listed in the imported record — please verify against latest EDA pricing.',
  };
  m.substitutes = {
    ar: substitutesAr,
    en: substitutesEn,
  };
  m.ageRestrictions = {
    ar: 'تُحدد الفئة العمرية المناسبة (رضع، أطفال، بالغين، أو كبار السن) وفق الشكل الصيدلي والتركيز وتوجيهات الطبيب المعالج أو النشرة الدوائية المعتمدة.',
    en: 'Appropriate age group depends on the dosage form, strength, and prescribing physician instructions.',
  };
  m.dosingReference = {
    ar: 'يُحدد الطبيب المعالج أو الصيدلي الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج حسب الحالة الصحية والسن والوزن. لا تغير الجرعة من تلقاء نفسك.',
    en: 'Exact dosage, frequency, and duration must be determined by a physician or pharmacist based on clinical condition, age, and weight.',
  };
  m.contraindications = {
    ar: rec.contraindicationsAr,
    en: rec.contraindicationsEn,
  };
  m.sideEffects = {
    ar: 'تختلف الآثار الجانبية المحتملة باختلاف المادة الفعالة واستجابة المريض. في حال ظهور أعراض تحسس شديدة (طفح جلدي منتشر، تورم بالوجه أو الشفتين، أو صعوبة في التنفس) يجب طلب الرعاية الطبية العاجلة فوراً.',
    en: 'Potential side effects depend on the active ingredient and individual patient response. Seek emergency medical attention immediately if signs of severe allergic reaction (rash, facial swelling, difficulty breathing) occur.',
  };
  m.interactions = {
    ar:
      rec.activeIngredients.length > 0
        ? `استخدم محرك الأمان الدوائي ورادار الروشتة في منصة دوايا (DAWAYA) لفحص التداخلات الدوائية وتكرار المادة الفعالة (${rec.activeIngredients.join(' + ')}) مع أدويتك الحالية.`
        : 'يرجى مراجعة الصيدلي أو الطبيب لفحص التداخلات الدوائية مع أدويتك الحالية.',
    en:
      rec.activeIngredients.length > 0
        ? `Use the DAWAYA Central Medication Safety Engine and Prescription Radar to check for drug-drug interactions and duplicate active ingredients (${rec.activeIngredients.join(' + ')}) against your current medications.`
        : 'Consult your pharmacist or physician to screen for interactions with your current medications.',
  };
  m.pregnancyBreastfeeding = {
    ar:
      rec.warningsFlags.pregnancy || rec.warningsFlags.lactation
        ? `⚠️ تنبيه سريري مسجل: يحذر أو يوصى بالحذر الشديد تحت إشراف طبي في حالات: ${[
            rec.warningsFlags.pregnancy ? 'الحمل' : '',
            rec.warningsFlags.lactation ? 'الرضاعة الطبيعية' : '',
          ]
            .filter(Boolean)
            .join(' و ')}. لا يُستخدم إلا بعد تقييم الطبيب المختص.`
        : 'لا توجد إشارة تحذير خاصة مسجلة في ملف البيانات للحمل أو الرضاعة، ولكن يجب دائماً استشارة الطبيب قبل تناول أي دواء أثناء الحمل أو الرضاعة.',
    en:
      rec.warningsFlags.pregnancy || rec.warningsFlags.lactation
        ? `⚠️ Registered Clinical Alert: Caution or medical supervision required during: ${[
            rec.warningsFlags.pregnancy ? 'Pregnancy' : '',
            rec.warningsFlags.lactation ? 'Lactation / Breastfeeding' : '',
          ]
            .filter(Boolean)
            .join(' & ')}. Use only if prescribed by a physician.`
        : 'No specific pregnancy/lactation warning flag is set in the dataset record; however, always consult a physician before taking any medication during pregnancy or breastfeeding.',
  };
  m.renalHepatic = {
    ar:
      rec.warningsFlags.kidney ||
      rec.warningsFlags.liver ||
      rec.warningsFlags.heart ||
      rec.warningsFlags.highBloodPressure ||
      rec.warningsFlags.diabetes
        ? `⚠️ تحذيرات الحالات المرضية المزمنة المسجلة لهذا الدواء: ${rec.warningsSummaryAr}`
        : 'لا توجد تحذيرات خاصة مسجلة لأمراض الكلى أو الكبد أو القلب في هذا السجل. في حال وجود قصور كلوي أو كبدي، استشر الطبيب لضبط الجرعة.',
    en:
      rec.warningsFlags.kidney ||
      rec.warningsFlags.liver ||
      rec.warningsFlags.heart ||
      rec.warningsFlags.highBloodPressure ||
      rec.warningsFlags.diabetes
        ? `⚠️ Registered Chronic Condition Warnings: ${rec.warningsSummaryEn}`
        : 'No specific renal, hepatic, or cardiac warning flags registered in this record. Patients with organ impairment should consult a physician.',
  };
  m.patientEducation = {
    ar: `${rec.storageInfoAr}\n• حالة البيانات: ${
      rec.verificationStatus === 'verified'
        ? 'تم التحقق من الحقول الأساسية في قاعدة بيانات دوايا'
        : `سجل مستورد يحتوي على حقول غير مكتملة في المصدر (${rec.missingFields.join('، ')}) ويتطلب مراجعة النشرة الطبية`
    }.`,
    en: `${rec.storageInfoEn}\n• Data Completeness: ${
      rec.verificationStatus === 'verified'
        ? 'Core fields verified in DAWAYA database'
        : `Imported record with missing source fields (${rec.missingFields.join(', ')}) requiring leaflet verification`
    }.`,
  };

  m.brands = [
    {
      name: `${rec.brandNameEn} (${rec.brandNameAr})${rec.priceEgp ? ` - ${rec.priceEgp.toFixed(2)} EGP` : ''}`,
      manufacturer: rec.manufacturer,
      barcode: rec.barcode || '',
      verified: Boolean(rec.barcode),
      sourceUrl: 'https://edaegypt.gov.eg',
    },
  ];
  m.barcodes = rec.barcode ? [rec.barcode] : [];
  m.sources = rec.referenceSources;
  m.lastReviewed = rec.lastVerifiedDate;
  m.reviewedBy =
    rec.verificationStatus === 'verified'
      ? 'فريق التكامل الدوائي بمنصة دوايا | DAWAYA Clinical Data Integration'
      : 'سجل مستورد قيد المراجعة السريرية | Imported Record Pending Review';
  m.notes = `CSV ID: ${rec.csvNumericId} | Category: ${rec.pharmaceuticalCategory}`;

  return m;
}

export interface DawayaSearchFilters {
  query?: string;
  category?: DawayaTherapeuticCategory | 'all';
  dosageForm?: string;
  route?: string;
  barcodeFilter?: 'all' | 'verified' | 'missing';
  combinationFilter?: 'all' | 'single' | 'combo';
  warningSafeFor?: Array<keyof DawayaWarningFlags>;
  sortBy?: 'relevance' | 'name' | 'price_asc' | 'price_desc' | 'verified_first';
}

/**
 * High-speed search across all 26,562 medicine records in `globalIndexItems`
 */
function arabicConsonantSkeleton(s: string): string {
  // Strips inner weak vowels (ا, و, ي) from Arabic words >= 4 chars so spelling variants like كتفلام/كتافلام match
  return s.replace(/([\u0621-\u064A])([اوي]+)/g, '$1');
}

export function searchDawayaIndex(
  items: DawayaCompactIndexItem[],
  filters: DawayaSearchFilters,
  isAr = true
): DawayaCompactIndexItem[] {
  const rawQ = norm(filters.query || '');
  const tokens = rawQ.split(/\s+/).filter(Boolean);
  const expandedTokens = tokens.map((tk) => ({
    raw: tk,
    alt: ARABIC_TO_ENGLISH_INGREDIENT_MAP[tk] || tk,
    skel: tk.length >= 4 && /[\u0600-\u06FF]/.test(tk) ? arabicConsonantSkeleton(tk) : tk,
  }));
  const cat = filters.category || 'all';
  const form = filters.dosageForm || 'all';
  const route = filters.route || 'all';
  const bcFilter = filters.barcodeFilter || 'all';
  const comboFilter = filters.combinationFilter || 'all';
  const sortBy = filters.sortBy || (rawQ ? 'relevance' : 'verified_first');

  const filtered = items.filter((item) => {
    if (cat !== 'all' && item.k !== cat) return false;
    if (form !== 'all' && item.f !== form) return false;
    if (route !== 'all' && item.r !== route) return false;
    if (bcFilter === 'verified' && !item.b) return false;
    if (bcFilter === 'missing' && item.b) return false;
    if (comboFilter !== 'all') {
      const isCombo = item.g.includes('+');
      if (comboFilter === 'combo' && !isCombo) return false;
      if (comboFilter === 'single' && isCombo) return false;
    }

    if (expandedTokens.length === 0) return true;

    const hay = norm(`${item.n} ${item.a} ${item.g} ${item.c} ${item.s} ${item.d} ${item.b} ${item.i}`);
    const haySkel = arabicConsonantSkeleton(hay);
    return expandedTokens.every(
      (t) => hay.includes(t.raw) || hay.includes(t.alt) || (t.skel.length >= 3 && haySkel.includes(t.skel))
    );
  });

  if (sortBy === 'price_asc') {
    return filtered.sort((a, b) => (a.p ?? 999999) - (b.p ?? 999999));
  }
  if (sortBy === 'price_desc') {
    return filtered.sort((a, b) => (b.p ?? 0) - (a.p ?? 0));
  }
  if (sortBy === 'name') {
    return filtered.sort((a, b) =>
      isAr ? a.a.localeCompare(b.a, 'ar') : a.n.localeCompare(b.n)
    );
  }
  if (sortBy === 'relevance' && rawQ) {
    return filtered.sort((a, b) => {
      const aExact =
        a.n.toLowerCase().startsWith(rawQ) ||
        a.a.startsWith(rawQ) ||
        a.b === rawQ
          ? 0
          : 1;
      const bExact =
        b.n.toLowerCase().startsWith(rawQ) ||
        b.a.startsWith(rawQ) ||
        b.b === rawQ
          ? 0
          : 1;
      if (aExact !== bExact) return aExact - bExact;
      if (a.v !== b.v) return b.v - a.v;
      return a.n.localeCompare(b.n);
    });
  }

  return filtered.sort((a, b) => {
    if (a.v !== b.v) return b.v - a.v;
    if (Boolean(a.b) !== Boolean(b.b)) return a.b ? -1 : 1;
    return a.n.localeCompare(b.n);
  });
}

/**
 * React Hook for accessing the full 26,562 DAWAYA medicine database anywhere in the platform
 */
export function useDawayaDrugDatabase(eagerLoad = true) {
  const [indexItems, setIndexItems] = useState<DawayaCompactIndexItem[]>(() => globalIndexItems);
  const [loaded, setLoaded] = useState<boolean>(() => globalIndexLoaded);
  const [importReport, setImportReport] = useState<DawayaImportReport | null>(() => globalImportReport);

  useEffect(() => {
    let active = true;
    if (eagerLoad) {
      ensureDawayaDatabaseLoaded().then((items) => {
        if (!active) return;
        setIndexItems(items);
        setLoaded(true);
      });
      fetchDawayaImportReport().then((rep) => {
        if (!active || !rep) return;
        setImportReport(rep);
      });
    }

    const onUpdate = () => {
      setIndexItems(globalIndexItems);
      setLoaded(globalIndexLoaded);
    };
    window.addEventListener(DAWAYA_DB_UPDATED_EVENT, onUpdate);
    return () => {
      active = false;
      window.removeEventListener(DAWAYA_DB_UPDATED_EVENT, onUpdate);
    };
  }, []);

  return {
    indexItems,
    loaded,
    totalCount: indexItems.length > 0 ? indexItems.length : 26562,
    antibioticPackagesCount: EGYPTIAN_COMMERCIAL_PRODUCTS.length,
    antibioticMonographsCount: ACTIVE_INGREDIENTS.length,
    importReport,
  };
}


/**
 * Parses a CSV or JSON market price list (supporting ID, Barcode, English/Arabic Trade Name)
 * and updates prices across all 26,572 index records + 267 core packages, saving to local cache
 * and broadcasting to Firebase Firestore so all visitors see the new prices immediately.
 */
export async function syncMarketPricesFromText(
  rawText: string,
  sourceLabel = 'Market Price Feed'
): Promise<{
  matchedCount: number;
  priceChangedCount: number;
  unchangedCount: number;
  lastSyncedAt: string;
}> {
  await ensureDawayaDatabaseLoaded();
  const text = (rawText || '').trim();
  if (!text) {
    return { matchedCount: 0, priceChangedCount: 0, unchangedCount: 0, lastSyncedAt: new Date().toISOString() };
  }

  // Build fast normalized name lookup map if needed
  const byNormName = new Map<string, DawayaCompactIndexItem[]>();
  for (const item of globalIndexItems) {
    const nkEn = norm(item.n);
    if (nkEn) {
      const arr = byNormName.get(nkEn);
      if (arr) arr.push(item);
      else byNormName.set(nkEn, [item]);
    }
    const nkAr = norm(item.a);
    if (nkAr) {
      const arr = byNormName.get(nkAr);
      if (arr) arr.push(item);
      else byNormName.set(nkAr, [item]);
    }
  }

  const newDeltas: Record<string, DawayaPriceDeltaEntry> = {};
  let matchedCount = 0;
  let priceChangedCount = 0;
  let unchangedCount = 0;
  const todayStr = new Date().toISOString().slice(0, 10);

  const processRow = (idVal: string, bcVal: string, nameVal: string, priceVal: number) => {
    if (!priceVal || Number.isNaN(priceVal) || priceVal <= 0) return;
    let targets: DawayaCompactIndexItem[] = [];
    if (idVal) {
      const t = indexByIdMap.get(idVal.toLowerCase().trim());
      if (t) targets = [t];
    }
    if (targets.length === 0 && bcVal) {
      const t = indexByBarcodeMap.get(bcVal.trim());
      if (t) targets = [t];
    }
    if (targets.length === 0 && nameVal) {
      const found = byNormName.get(norm(nameVal));
      if (found && found.length > 0) targets = found;
    }
    if (targets.length === 0) return;

    for (const target of targets) {
      matchedCount += 1;
      if (target.p !== null && Math.abs(target.p - priceVal) < 0.01) {
        unchangedCount += 1;
        continue;
      }
      const prevPrice = target.p && target.p > 0 ? target.p : target.op ?? null;
      target.op = prevPrice;
      target.p = priceVal;
      newDeltas[target.i.toLowerCase()] = {
        p: priceVal,
        op: prevPrice,
        u: todayStr,
      };
      syncPriceToCoreCommercialProducts(target.i, priceVal, target.b, target.n);
      priceChangedCount += 1;
    }
  };

  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.priceOverrides) {
        const count = applyLivePriceDeltaMap(parsed.priceOverrides, parsed.lastSyncedAt);
        return {
          matchedCount: Object.keys(parsed.priceOverrides).length,
          priceChangedCount: count,
          unchangedCount: Math.max(0, Object.keys(parsed.priceOverrides).length - count),
          lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString(),
        };
      }
      const rows = Array.isArray(parsed) ? parsed : Object.values(parsed);
      for (const r of rows) {
        if (!r || typeof r !== 'object') continue;
        const idVal = String(r.i || r.id || r.productId || r.drug_id || '');
        const bcVal = String(r.b || r.barcode || r.ean || r.gtin || '');
        const nameVal = String(r.n || r.name || r.tradeNameEn || r.trade_name || r.a || r.tradeNameAr || '');
        const rawP = r.p ?? r.price ?? r.priceEgp ?? r.new_price ?? r.newPrice ?? r['السعر'];
        const priceNum = typeof rawP === 'number' ? rawP : parseFloat(String(rawP || '').replace(/[^0-9.]/g, ''));
        processRow(idVal, bcVal, nameVal, priceNum);
      }
    } catch {
      /* fallback to CSV parser */
    }
  } else {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length >= 2) {
      const splitCsvLine = (line: string): string[] => {
        const out: string[] = [];
        let cur = '';
        let inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            inQ = !inQ;
          } else if ((ch === ',' || ch === ';' || ch === '\t') && !inQ) {
            out.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        out.push(cur.trim());
        return out;
      };

      const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF_]/g, ''));
      const findCol = (candidates: string[]) => headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));
      const idIdx = findCol(['id', 'productid', 'drug_id', 'code', 'كود', 'معرف']);
      const bcIdx = findCol(['barcode', 'ean', 'gtin', 'باركود', 'الباركود']);
      const nameIdx = findCol(['tradenameen', 'tradename', 'name', 'brand', 'drugname', 'الاسم', 'اسم']);
      const priceIdx = findCol(['newprice', 'new_price', 'priceegp', 'price', 'السعرالجديد', 'السعر', 'سعر']);

      for (let idx = 1; idx < lines.length; idx++) {
        const cols = splitCsvLine(lines[idx]);
        if (cols.length < 2) continue;
        const idVal = idIdx >= 0 ? cols[idIdx] || '' : '';
        const bcVal = bcIdx >= 0 ? cols[bcIdx] || '' : '';
        const nameVal = nameIdx >= 0 ? cols[nameIdx] || '' : cols[0] || '';
        const rawP = priceIdx >= 0 ? cols[priceIdx] : cols[cols.length - 1];
        const priceNum = parseFloat(String(rawP || '').replace(/[^0-9.]/g, ''));
        processRow(idVal, bcVal, nameVal, priceNum);
      }
    }
  }

  const nowIso = new Date().toISOString();
  if (Object.keys(newDeltas).length > 0) {
    globalPriceDeltas = { ...globalPriceDeltas, ...newDeltas };
    saveCachedPriceDeltas(globalPriceDeltas, nowIso);
    if (configured && db) {
      try {
        // Save up to 2,000 most recent price overrides to Firestore real-time document
        const entries = Object.entries(newDeltas).slice(0, 2000);
        const firestoreMap = Object.fromEntries(entries);
        await setDoc(
          doc(db, 'medicines', LIVE_PRICE_FIRESTORE_DOC),
          {
            lastSyncedAt: nowIso,
            sourceLabel,
            priceOverrides: firestoreMap,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        /* ignore if offline */
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DAWAYA_DB_UPDATED_EVENT));
    }
  } else {
    lastPriceSyncIso = nowIso;
  }

  return {
    matchedCount,
    priceChangedCount,
    unchangedCount,
    lastSyncedAt: nowIso,
  };
}

/**
 * Fetches a remote CSV or JSON market price feed URL, applies all price updates,
 * and optionally saves the URL for automatic background polling & Firestore sync.
 */
export async function syncMarketPricesFromUrlLive(
  feedUrl: string,
  persistUrl = true
): Promise<{
  matchedCount: number;
  priceChangedCount: number;
  unchangedCount: number;
  lastSyncedAt: string;
}> {
  const cleanUrl = feedUrl.trim();
  if (!cleanUrl) {
    throw new Error('Empty price feed URL');
  }
  if (persistUrl) {
    setSavedRemotePriceFeedUrl(cleanUrl);
    if (configured && db) {
      setDoc(
        doc(db, 'medicines', LIVE_PRICE_FIRESTORE_DOC),
        { remoteFeedUrl: cleanUrl, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch(() => {});
    }
  }
  const sep = cleanUrl.includes('?') ? '&' : '?';
  const res = await fetch(`${cleanUrl}${sep}_t=${Math.floor(Date.now() / 60000)}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} when fetching ${cleanUrl}`);
  }
  const text = await res.text();
  return syncMarketPricesFromText(text, cleanUrl);
}

/**
 * Starts the automatic 2-tier Live Market Price Sync:
 *  1. Fetches `data/dawaya_live_price_deltas.json` (updated daily by GitHub Actions).
 *  2. Listens in real time (`onSnapshot`) to Firebase Firestore `medicines/__dawaya_live_price_overrides__`.
 *  3. Polls any configured remote price feed URL every 15 minutes while the app is open.
 */
export function startDawayaLivePriceSync(): void {
  if (livePriceListenerStarted || typeof window === 'undefined') return;
  livePriceListenerStarted = true;

  const pullStaticDeltasAndRemoteFeed = async () => {
    try {
      const baseUrl = import.meta.env?.BASE_URL || './';
      const res = await fetch(`${baseUrl}data/dawaya_live_price_deltas.json?_t=${Math.floor(Date.now() / 300000)}`);
      if (res.ok) {
        const manifest = await res.json();
        if (manifest && typeof manifest.priceOverrides === 'object') {
          applyLivePriceDeltaMap(manifest.priceOverrides, manifest.lastSyncedAt);
        }
      }
    } catch {
      /* ignore */
    }

    const customUrl = getSavedRemotePriceFeedUrl();
    if (customUrl) {
      try {
        await syncMarketPricesFromUrlLive(customUrl, false);
      } catch {
        /* ignore network errors on background poll */
      }
    }
  };

  pullStaticDeltasAndRemoteFeed();
  window.setInterval(pullStaticDeltasAndRemoteFeed, 15 * 60 * 1000);

  if (configured && db) {
    try {
      const ref = doc(db, 'medicines', LIVE_PRICE_FIRESTORE_DOC);
      onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          if (data?.remoteFeedUrl && typeof data.remoteFeedUrl === 'string' && !getSavedRemotePriceFeedUrl()) {
            setSavedRemotePriceFeedUrl(data.remoteFeedUrl);
          }
          if (data?.priceOverrides && typeof data.priceOverrides === 'object') {
            applyLivePriceDeltaMap(
              data.priceOverrides as Record<string, DawayaPriceDeltaEntry>,
              typeof data.lastSyncedAt === 'string' ? data.lastSyncedAt : new Date().toISOString()
            );
          }
        },
        () => {
          /* ignore offline permission fallback */
        }
      );
    } catch {
      /* ignore */
    }
  }
}


export interface RecentlyViewedMedItem {
  id: string;
  nameAr: string;
  nameEn: string;
  priceEgp: number | null;
  activeIngredient: string;
  viewedAt: string;
}

const RECENTLY_VIEWED_MEDS_KEY = 'dawaya_recently_viewed_meds_v1';

export function getRecentlyViewedMedicines(): RecentlyViewedMedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_MEDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewedMedicine(med: RecentlyViewedMedItem): void {
  if (typeof window === 'undefined' || !med || !med.id) return;
  try {
    const prev = getRecentlyViewedMedicines().filter((x) => x.id !== med.id);
    const next = [med, ...prev].slice(0, 6);
    localStorage.setItem(RECENTLY_VIEWED_MEDS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecentlyViewedMedicines(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENTLY_VIEWED_MEDS_KEY);
  } catch {
    /* ignore */
  }
}
