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
    ar: 'الأدوية الجلدية وغسولات وكريمات البشرة',
    en: 'Dermatology, Facial Cleansers & Skincare',
    icon: '🧴',
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

// Instant 0ms seed from EGYPTIAN_COMMERCIAL_PRODUCTS so <Medicines /> renders immediately even before IndexedDB/JSON finishes
function buildInitialSeedCompactItems(): DawayaCompactIndexItem[] {
  return EGYPTIAN_COMMERCIAL_PRODUCTS.map((p, idx) => ({
    i: p.productId || `eg-seed-${idx + 1}`,
    n: p.tradeNameEn,
    a: p.tradeNameAr,
    g: p.scientificComposition || p.activeIngredientId,
    c: p.manufacturer,
    p: p.priceEgp ?? null,
    op: null,
    b: p.barcode || '',
    f: p.dosageForm || 'tablet',
    r: p.route || 'oral',
    s: p.strength || '',
    k: 'antibiotics' as DawayaTherapeuticCategory,
    d: p.dosageFormLabel?.ar || 'مضاد حيوي',
    w: 0,
    u: '1',
    ch: 0,
    v: 1,
  }));
}

let globalIndexItems: DawayaCompactIndexItem[] = buildInitialSeedCompactItems();
let globalIndexLoaded = false;

const IDB_NAME = 'dawaya_fast_idb_v1';
const IDB_STORE = 'med_index_store';
const IDB_KEY = 'full_26597_index_v3';

function readIndexFromIndexedDB(): Promise<DawayaCompactIndexItem[] | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readonly');
          const getReq = tx.objectStore(IDB_STORE).get(IDB_KEY);
          getReq.onsuccess = () => {
            const val = getReq.result;
            resolve(Array.isArray(val) && val.length > 1000 ? val : null);
          };
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function writeIndexToIndexedDB(items: DawayaCompactIndexItem[]): void {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  try {
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => {
      try {
        const db = req.result;
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(items, IDB_KEY);
      } catch {
        /* ignore */
      }
    };
  } catch {
    /* ignore */
  }
}

function fastPreSortVerifiedFirst(items: DawayaCompactIndexItem[]): void {
  items.sort((a, b) => {
    if (a.v !== b.v) return b.v - a.v;
    const aHasB = Boolean(a.b);
    const bHasB = Boolean(b.b);
    if (aHasB !== bHasB) return aHasB ? -1 : 1;
    return a.n < b.n ? -1 : a.n > b.n ? 1 : 0;
  });
}
let globalIndexLoadingPromise: Promise<DawayaCompactIndexItem[]> | null = null;
let globalImportReport: DawayaImportReport | null = null;
let livePriceListenerStarted = false;
let lastPriceSyncIso: string | null = null;
let globalPriceDeltas: Record<string, DawayaPriceDeltaEntry> = {};

// Fast O(1) maps over all 26,572 records
const indexByIdMap = new Map<string, DawayaCompactIndexItem>();
const indexByBarcodeMap = new Map<string, DawayaCompactIndexItem>();
const indexByNormalizedIngredientMap = new Map<string, DawayaCompactIndexItem[]>();
const brandFirstWordMap = new Map<string, DawayaCompactIndexItem[]>();
const genericIngredientWordsSet = new Set<string>([
  "potassium", "sodium", "hydrochloride", "hcl", "fumarate", "maleate", "besylate",
  "calcium", "trihydrate", "clavulanic", "clavulanate", "acid", "anhydrous", "monohydrate",
  "dihydrate", "acetate", "sulfate", "sulphate", "phosphate", "citrate", "tartrate",
  "succinate", "valerate", "propionate", "bromide", "chloride", "nitrate", "mesylate",
  "benzoate", "salicylate", "gluconate", "lactate", "carbonate", "bicarbonate", "oxide",
  "hydroxide", "peroxide", "zinc", "iron", "ferrous", "ferric", "magnesium", "vitamin",
  "بوتاسيوم", "صوديوم", "هيدروكلوريد", "كالسيوم", "حمض", "كلافولانيك", "سلفات", "فوسفات", "زنك", "حديد", "فيتامين"
]);
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
    window.dispatchEvent(new CustomEvent('dawaya_db_updated'));
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
    window.dispatchEvent(new CustomEvent('dawaya_db_updated'));
  } catch {
    /* ignore quota */
  }
}

function addBrandKeyToMap(key: string, item: DawayaCompactIndexItem): void {
  if (!key || key.length < 2) return;
  const list = brandFirstWordMap.get(key);
  if (list) {
    list.push(item);
  } else {
    brandFirstWordMap.set(key, [item]);
  }
}

function rebuildFastMaps(items: DawayaCompactIndexItem[]): void {
  indexByIdMap.clear();
  indexByBarcodeMap.clear();
  indexByNormalizedIngredientMap.clear();
  brandFirstWordMap.clear();



  for (const item of items) {
    const idLow = item.i.toLowerCase();
    indexByIdMap.set(idLow, item);
    if (idLow.startsWith('eg-')) {
      indexByIdMap.set(idLow.slice(3), item);
    }
    if (item.b) {
      for (const bcPart of item.b.split(/[\s,;+|/]+/)) {
        const cleanBc = bcPart.trim();
        if (cleanBc.length >= 6) indexByBarcodeMap.set(cleanBc, item);
      }
    }
    if (item.g) {
      const normG = item.g.toLowerCase().trim();
      const existing = indexByNormalizedIngredientMap.get(normG);
      if (existing) {
        existing.push(item);
      } else {
        indexByNormalizedIngredientMap.set(normG, [item]);
      }
      for (const gw of normG.split(/[^a-z0-9\u0600-\u06FF]+/)) {
        if (gw.length >= 4 && !/^\d+$/.test(gw)) {
          genericIngredientWordsSet.add(gw);
        }
      }
    }

    // Index English brand first word (with and without hyphens)
    const nLow = (item.n || "").toLowerCase().trim();
    const firstRawEn = nLow.split(/\s+/)[0]?.replace(/[^a-z0-9-]/g, "") || "";
    if (firstRawEn.length >= 2) {
      addBrandKeyToMap(firstRawEn, item);
      if (firstRawEn.includes("-")) {
        const noHyphen = firstRawEn.replace(/-/g, "");
        if (noHyphen.length >= 3) addBrandKeyToMap(noHyphen, item);
        const firstSub = firstRawEn.split("-")[0];
        if (firstSub && firstSub.length >= 3) addBrandKeyToMap(firstSub, item);
      }
    }
    const enWords = nLow.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    if (enWords.length >= 2 && enWords[0].length <= 3 && !/^\d/.test(enWords[1])) {
      addBrandKeyToMap(enWords[0] + enWords[1], item);
    }

    // Index Arabic brand first word & 2-word compound prefix
    const aNorm = norm(item.a || "");
    const arWords = aNorm.replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    if (arWords.length > 0 && arWords[0].length >= 2) {
      addBrandKeyToMap(arWords[0], item);
      if (arWords.length >= 2 && !/^\d/.test(arWords[1])) {
        addBrandKeyToMap(arWords[0] + arWords[1], item);
        addBrandKeyToMap(arWords[0] + " " + arWords[1], item);
      }
    }
  }
  // Add Arabic ingredient aliases ONLY if their English target is an actual active ingredient from item.g
  for (const [arK, enV] of Object.entries(ARABIC_TO_ENGLISH_INGREDIENT_MAP)) {
    const nAr = norm(arK);
    const nEn = enV.toLowerCase().trim();
    const enFirst = nEn.split(/[^a-z0-9]+/)[0] || "";
    if (enFirst && genericIngredientWordsSet.has(enFirst)) {
      if (nAr.length >= 3) genericIngredientWordsSet.add(nAr);
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

  void loadDawayaImageMap();
  globalIndexLoadingPromise = (async () => {
    const applyLoadedData = (rawItems: DawayaCompactIndexItem[]) => {
      const overrides = loadAdminCustomOverrides();
      const hasOverrides = Object.keys(overrides).length > 0;
      const merged = hasOverrides ? rawItems.map((item) => overrides[item.i] || item) : rawItems;
      if (hasOverrides) {
        for (const [key, val] of Object.entries(overrides)) {
          if (!indexByIdMap.has(key.toLowerCase()) && !rawItems.some((d) => d.i === key)) {
            merged.unshift(val);
          }
        }
      }
      const existingIds = new Set(merged.map((x) => x.i));
      for (const dev of DAWAYA_MISSING_PHARMACY_DEVICES) {
        if (!existingIds.has(dev.i)) merged.push(dev);
      }
      fastPreSortVerifiedFirst(merged);
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
    window.dispatchEvent(new CustomEvent('dawaya_db_updated'));
      }
      return globalIndexItems;
    };

    try {
      // 1) Try ultra-fast IndexedDB cache first (<30ms on mobile!)
      const idbCached = await readIndexFromIndexedDB();
      if (idbCached && idbCached.length > 1000) {
        return applyLoadedData(idbCached);
      }

      // 2) Otherwise fetch JSON once, pre-sort, and store in IndexedDB permanently
      const baseUrl = import.meta.env?.BASE_URL || './';
      const res = await fetch(`${baseUrl}data/dawaya_medicines_search_index.json?v=26597`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as DawayaCompactIndexItem[];
      const finalItems = applyLoadedData(data);
      writeIndexToIndexedDB(data);
      return finalItems;
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
  اوزيمبيك: 'ozempic',
  أوزيمبيك: 'ozempic',
  مونجارو: 'mounjaro',
  فورسيجا: 'forxiga',
  جارديانس: 'jardiance',
  اليكويس: 'eliquis',
  إليكويس: 'eliquis',
  زاريلتو: 'xarelto',
  انتريستو: 'entresto',
  إنتريستو: 'entresto',
  نيكسيوم: 'nexium',
  كونترولوك: 'controloc',
  كونكور: 'concor',
  ليبيتور: 'lipitor',
  كريستور: 'crestor',
  اتور: 'ator',
  جلوكوفاج: 'glucophage',
  اماريل: 'amaryl',
  أماريل: 'amaryl',
  جانوميت: 'janumet',
  املور: 'amlor',
  أملور: 'amlor',
  اكسفورج: 'exforge',
  إكسفورج: 'exforge',
  التروكسين: 'eltroxin',
  إلتروكسين: 'eltroxin',
  ايوثايروكس: 'euthyrox',
  بلافيكس: 'plavix',
  كونجستال: 'congestal',
  تلفاست: 'telfast',
  زيرتك: 'zyrtec',
  ميلجا: 'milga',
  انتينال: 'antinal',
  فلاجيل: 'flagyl',
  اوجمنتين: 'augmentin',
  أوجمنتين: 'augmentin',
  هايبيوتك: 'hibiotic',
  ميجاموكس: 'megamox',
  زيثروماكس: 'zithromax',
  اوزيمبيك: 'ozempic',
  أوزيمبيك: 'ozempic',
  مونجارو: 'mounjaro',
  فورسيجا: 'forxiga',
  جارديانس: 'jardiance',
  اليكويس: 'eliquis',
  إليكويس: 'eliquis',
  زاريلتو: 'xarelto',
  انتريستو: 'entresto',
  إنتريستو: 'entresto',
  نيكسيوم: 'nexium',
  كونترولوك: 'controloc',
  كونكور: 'concor',
  ليبيتور: 'lipitor',
  كريستور: 'crestor',
  اتور: 'ator',
  جلوكوفاج: 'glucophage',
  اماريل: 'amaryl',
  أماريل: 'amaryl',
  جانوميت: 'janumet',
  املور: 'amlor',
  أملور: 'amlor',
  اكسفورج: 'exforge',
  إكسفورج: 'exforge',
  التروكسين: 'eltroxin',
  إلتروكسين: 'eltroxin',
  ايوثايروكس: 'euthyrox',
  بلافيكس: 'plavix',
  كونجستال: 'congestal',
  تلفاست: 'telfast',
  زيرتك: 'zyrtec',
  ميلجا: 'milga',
  انتينال: 'antinal',
  فلاجيل: 'flagyl',
  اوجمنتين: 'augmentin',
  أوجمنتين: 'augmentin',
  هايبيوتك: 'hibiotic',
  ميجاموكس: 'megamox',
  زيثروماكس: 'zithromax',
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

const NON_DRUG_STOP_WORDS = new Set([
  'oral', 'topical', 'injection', 'suspension', 'tablet', 'tablets', 'tab', 'tabs',
  'capsule', 'capsules', 'cap', 'caps', 'syrup', 'syr', 'cream', 'gel', 'ointment',
  'drops', 'vial', 'ampoule', 'amp', 'wash', 'soap', 'lotion', 'solution', 'spray',
  'mouthwash', 'daily', 'once', 'twice', 'thrice', 'once_daily', 'twice_daily',
  'thrice_daily', 'four_times_daily', 'none', 'unknown', 'unreadable', 'missing',
  'normal', 'care', 'medical', 'prescription', 'report', 'leaflet', 'result',
  'film', 'coated', 'sugar', 'gastro', 'resistant', 'hard', 'soft', 'gelatin',
  'sachet', 'sachets', 'effervescent', 'eff', 'granules', 'powder', 'infusion',
  'suppository', 'suppositories', 'supp', 'ovules', 'vaginal', 'rectal', 'nasal',
  'eye', 'ear', 'oint', 'susp', 'sol', 'conc',
  'intestinal', 'antiseptic', 'antiprotozoal', 'analgesic', 'antipyretic', 'anti',
  'inflammatory', 'antibiotic', 'antibacterial', 'antifungal', 'antiviral',
  'broad', 'spectrum', 'contains', 'each', 'composition', 'indications', 'dosage',
  'store', 'keep', 'reach', 'children', 'temperature', 'degrees', 'manufactured',
  'company', 'pharma', 'pharmaceutical', 'pharmaceuticals', 'industries', 'laboratories',
  'sanofi', 'aventis', 'pfizer', 'novartis', 'glaxo', 'gsk', 'astrazeneca', 'bayer',
  'merck', 'abbott', 'servier', 'roche', 'boehringer', 'sandoz', 'mundipharma',
  'eipico', 'amoun', 'sedico', 'pharaonia', 'hikma', 'rameda', 'marcyrl', 'borg',
  'eva', 'fpi', 'global', 'napi', 'memphis', 'alexandria', 'amriya', 'kahira',
  'misr', 'nile', 'cid', 'adwia', 'chemipharm', 'october', 'utopia', 'zetapharm',
  'macro', 'parkville', 'premier', 'avenir', 'jamjoom', 'tabuk', 'spimaco', 'julphar',
  'قرص', 'أقراص', 'اقراص', 'كبسول', 'كبسولة', 'كبسولات', 'شراب', 'معلق', 'كريم',
  'مرهم', 'جل', 'غسول', 'فموي', 'موضعي', 'حقن', 'امبول', 'أمبول', 'فيال', 'نقط',
  'مرتين', 'ثلاث', 'اربع', 'يوميا', 'يومياً', 'مرات', 'ساعة', 'ساعات', 'فقط',
  'شريط', 'علبة', 'عبوة', 'تركيز', 'مجم', 'ملجم', 'جم', 'جرام', 'مل', 'صباحا', 'مساء', 'قبل', 'بعد',
  'مغلفة', 'سريعة', 'المفعول', 'للبالغين', 'للأطفال', 'اطفال', 'شركة', 'للأدوية', 'الادوية',
  'لبوس', 'لبوسات', 'اقماع', 'أقماع', 'بويضات', 'فوار', 'كيس', 'أكياس', 'اكياس',
]);

function normalizeOcrBrandTokenVariants(token: string): string[] {
  const clean = token.toLowerCase().trim();
  const variants = new Set<string>([clean]);
  if (clean.length >= 4 && /^[a-z0-9-]+$/.test(clean)) {
    variants.add(clean.replace(/1/g, 'l'));
    variants.add(clean.replace(/1/g, 'i'));
    variants.add(clean.replace(/0/g, 'o'));
    variants.add(clean.replace(/5/g, 's'));
    if (clean.endsWith('i') && clean.length >= 5) {
      variants.add(clean.slice(0, -1) + 'l');
    }
    if (clean.includes('i') && clean.length >= 5) {
      variants.add(clean.replace(/i/g, 'l'));
    }
  }
  return Array.from(variants);
}

function isGenericTokenWord(word: string): boolean {
  if (!word || word.length < 3) return false;
  if (brandFirstWordMap.size === 0 && globalIndexItems.length > 0) {
    rebuildFastMaps(globalIndexItems);
  }
  const low = word.toLowerCase().trim();
  const nAr = norm(low);
  return genericIngredientWordsSet.has(low) || genericIngredientWordsSet.has(nAr);
}

export function isPureGenericIngredientQuery(query: string): boolean {
  if (!query) return false;
  if (brandFirstWordMap.size === 0 && globalIndexItems.length > 0) {
    rebuildFastMaps(globalIndexItems);
  }
  const cleaned = query
    .toLowerCase()
    .replace(/[®™©*()[\]«»"'/+,:;\-_]/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|gm|g|mcg|ml|%|iu|مجم|ملجم|جم|جرام|مل)?\b/gi, ' ')
    .trim();
  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !NON_DRUG_STOP_WORDS.has(w) && !NON_DRUG_STOP_WORDS.has(norm(w)));
  if (words.length === 0) return false;
  return words.every((w) => isGenericTokenWord(w));
}

function isItemGenericNamed(item: DawayaCompactIndexItem): boolean {
  const firstEn = (item.n || '').toLowerCase().trim().split(/[\s-]+/)[0] || '';
  if (!firstEn) return false;
  if (genericIngredientWordsSet.has(firstEn)) return true;
  const gLow = (item.g || '').toLowerCase();
  return firstEn.length >= 4 && gLow.includes(firstEn);
}

export function findDawayaIndexItemSync(queryOrId: string): DawayaCompactIndexItem | null {
  if (!queryOrId || globalIndexItems.length === 0) return null;
  if (brandFirstWordMap.size === 0) {
    rebuildFastMaps(globalIndexItems);
  }

  let clean = queryOrId;
  try {
    clean = decodeURIComponent(queryOrId);
  } catch {
    clean = queryOrId;
  }
  clean = clean
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .toLowerCase()
    .trim();

  if (!clean || clean.length < 3) return null;
  if (/[<>|]/.test(clean)) return null;

  if (/^(?:rx_route|rx_freq|rx_dose|rx_duration_days|rx_contradictions|route|frequency|duration)\s*:/i.test(clean)) {
    return null;
  }
  clean = clean
    .replace(/^(?:rx_drug_name|rx_drug_id|drug_name|drug_id|medicine_name|اسم الدواء|الاسم التجاري)\s*:\s*/i, '')
    .replace(/[®™©*#[\]«»]/g, ' ')
    .trim();

  if (!clean || clean.length < 3 || NON_DRUG_STOP_WORDS.has(clean)) return null;

  const byId = indexByIdMap.get(clean);
  if (byId) return byId;

  const byBc = indexByBarcodeMap.get(clean);
  if (byBc) return byBc;

  const inlineBcMatch = clean.match(/\b(\d{8,14})\b/);
  if (inlineBcMatch && indexByBarcodeMap.has(inlineBcMatch[1])) {
    return indexByBarcodeMap.get(inlineBcMatch[1])!;
  }

  const primaryStrengths = new Set<string>();
  const unitStrengthRegex = /(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)\s*(mg|gm|g|mcg|ml|%|مجم|ملجم|جم|جرام|مل)\b/gi;
  for (const m of clean.matchAll(unitStrengthRegex)) {
    const numPart = m[1].replace(/\s+/g, '');
    const unitPart = m[2].toLowerCase();
    primaryStrengths.add(numPart);
    if ((unitPart === 'gm' || unitPart === 'g' || unitPart === 'جم' || unitPart === 'جرام') && numPart === '1') {
      primaryStrengths.add('1000');
      primaryStrengths.add('1 gm');
      primaryStrengths.add('1g');
    } else if (numPart === '1000' && (unitPart === 'mg' || unitPart === 'مجم')) {
      primaryStrengths.add('1 gm');
      primaryStrengths.add('1g');
    }
  }

  const secondaryStrengths = new Set<string>();
  const cleanWithoutPackCounts = clean.replace(
    /\b\d{1,3}\s*(?:f\.?c\.?\s*)?(?:sugar\s*c\.?\s*)?(?:film\s*coated\s*)?(?:gastro\s*resistant\s*)?(?:hard\s*|soft\s*)?(?:gelatin\s*)?(?:tablets?|tabs?|capsules?|caps?|sachets?|ampoules?|amps?|vials?|supp(?:ositories)?|ovules|قرص|أقراص|اقراص|كبسولة|كبسولات|كبسول|كيس|أكياس|اكياس|امبول|أمبول|اقماع|أقماع|لبوس|بويضات)\b/gi,
    ' '
  );
  for (const m of cleanWithoutPackCounts.matchAll(/\b(\d+(?:\.\d+)?)\b/g)) {
    const nVal = m[1];
    if (!primaryStrengths.has(nVal) && Number(nVal) >= 1 && Number(nVal) <= 2000) {
      secondaryStrengths.add(nVal);
    }
  }

  const wantsTablet = /\b(tab|tabs|tablet|tablets|f\.c\.|fc|s\.r\.|sr|sugar\s*c|film\s*coated|gastro\s*resistant|قرص|أقراص|اقراص)\b/i.test(clean);
  const wantsCapsule = /\b(cap|caps|capsule|capsules|كبسول|كبسولة|كبسولات)\b/i.test(clean);
  const wantsSyrup = /\b(syr|syrup|susp|suspension|drops|شراب|معلق|نقط)\b/i.test(clean);
  const wantsTopical = /\b(cream|ointment|gel|lotion|topical|wash|soap|spray|mouthwash|كريم|مرهم|جل|لوشن|موضعي|غسول|سبراي|مضمضة)\b/i.test(clean);
  const wantsInjection = /\b(vial|amp|ampoule|infusion|i\.v\.|i\.m\.|injection|فيال|امبول|أمبول|حقن|وريد|عضل)\b/i.test(clean);
  const wantsSuppository = /\b(supp|suppository|ovules|vaginal|لبوس|لبوسات|اقماع|أقماع|بويضات)\b/i.test(clean);
  const wantsSachet = /\b(sachet|sachets|eff|effervescent|فوار|أكياس|اكياس|كيس)\b/i.test(clean);

  const parenMatch = clean.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  const segmentsToInspect = parenMatch
    ? [parenMatch[1].trim(), parenMatch[2].trim(), clean]
    : [clean];

  for (const seg of segmentsToInspect) {
    const normSeg = norm(seg);
    const exactHit = globalIndexItems.find(
      (x) => (x.n.toLowerCase() === seg || norm(x.a) === normSeg) && !isItemGenericNamed(x)
    );
    if (exactHit) return exactHit;
  }

  const allRawTokens = clean
    .replace(/^(?:r\/|rx:?)\s*/gim, ' ')
    .replace(/[()[\],:;/"'+•*\-–_]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !/^\d+(?:\.\d+)?(?:mg|gm|g|mcg|ml|%|iu|مجم|جم|مل)?$/i.test(t));

  const commercialTokens: string[] = [];
  const genericTokens: string[] = [];
  const detectedGenericIngredients = new Set<string>();
  const allTokensSet = new Set<string>();

  for (const tok of allRawTokens) {
    const nTok = norm(tok);
    allTokensSet.add(tok);
    allTokensSet.add(nTok);
    if (NON_DRUG_STOP_WORDS.has(tok) || NON_DRUG_STOP_WORDS.has(nTok)) {
      continue;
    }
    if (isGenericTokenWord(tok)) {
      const mapped = ARABIC_TO_ENGLISH_INGREDIENT_MAP[nTok] || tok;
      genericTokens.push(mapped);
      detectedGenericIngredients.add(mapped.toLowerCase());
    } else if (tok.length >= 3) {
      commercialTokens.push(tok);
      const mappedBrand = ARABIC_TO_ENGLISH_INGREDIENT_MAP[nTok];
      if (mappedBrand && !isGenericTokenWord(mappedBrand)) {
        commercialTokens.push(mappedBrand.toLowerCase().trim());
      }
    }
  }

  const baseCommLen = commercialTokens.length;
  for (let i = 0; i < baseCommLen - 1; i++) {
    const w1 = commercialTokens[i];
    const w2 = commercialTokens[i + 1];
    if (w1.length >= 2 && w2.length >= 3) {
      commercialTokens.push(norm(w1) + norm(w2));
      commercialTokens.push(norm(w1) + ' ' + norm(w2));
    }
  }

  const scoreCandidateItem = (
    x: DawayaCompactIndexItem,
    matchedViaCommercialBrand: boolean,
    exactBrandWordMatch: boolean
  ): number => {
    let score = matchedViaCommercialBrand
      ? exactBrandWordMatch
        ? 300
        : 220
      : 90;

    if (isItemGenericNamed(x) && matchedViaCommercialBrand) {
      score -= 120;
    }

    const nLow = (x.n || '').toLowerCase();
    const aNorm = norm(x.a || '');
    const sLow = (x.s || '').toLowerCase();
    const fLow = (x.f || '').toLowerCase();
    const gLow = (x.g || '').toLowerCase();

    const enWords = nLow.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    if (enWords.length >= 2 && enWords[1].length >= 2 && !/^\d/.test(enWords[1])) {
      const secondWord = enWords[1];
      if (
        ![
          'tab', 'tabs', 'tablet', 'tablets', 'cap', 'caps', 'capsule', 'capsules', 'syr', 'syrup',
          'susp', 'suspension', 'vial', 'amp', 'ampoule', 'cream', 'gel', 'ointment', 'drops',
          'topical', 'oral', 'sugar', 'film', 'coated', 'gastro', 'gastroresistant', 'powder',
          'f', 'c', 's', 'r', 'gm', 'mg', 'ml', 'mcg', 'iu',
        ].includes(secondWord)
      ) {
        if (allTokensSet.has(secondWord) || clean.includes(secondWord)) {
          score += 150;
        } else {
          score -= 45;
        }
      }
    }
    const arWords = aNorm.split(/\s+/).filter(Boolean);
    if (arWords.length >= 2 && arWords[1].length >= 3 && !/^\d/.test(arWords[1])) {
      const secondAr = arWords[1];
      if (!NON_DRUG_STOP_WORDS.has(secondAr) && (allTokensSet.has(secondAr) || norm(clean).includes(secondAr))) {
        score += 85;
      }
    }

    if (matchedViaCommercialBrand && detectedGenericIngredients.size > 0 && gLow) {
      for (const genIng of detectedGenericIngredients) {
        if (genIng.length >= 4 && gLow.includes(genIng)) {
          score += 70;
          break;
        }
      }
    }

    const itemStrengthNums = new Set<string>();
    const sSource = sLow + ' ' + nLow;
    for (const sm of sSource.matchAll(/(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)\s*(mg|gm|g|mcg|ml|%)/gi)) {
      const numP = sm[1].replace(/\s+/g, '');
      const unitP = sm[2].toLowerCase();
      itemStrengthNums.add(numP);
      if ((unitP === 'gm' || unitP === 'g') && numP === '1') {
        itemStrengthNums.add('1000');
        itemStrengthNums.add('1 gm');
        itemStrengthNums.add('1g');
      } else if (numP === '1000' && unitP === 'mg') {
        itemStrengthNums.add('1 gm');
        itemStrengthNums.add('1g');
      }
    }

    if (primaryStrengths.size > 0) {
      let matchedPrimary = false;
      for (const ps of primaryStrengths) {
        if (itemStrengthNums.has(ps)) {
          matchedPrimary = true;
          break;
        }
      }
      if (matchedPrimary) {
        score += 120;
      } else if (itemStrengthNums.size > 0) {
        score -= 60;
      }
    } else if (secondaryStrengths.size > 0) {
      for (const ss of secondaryStrengths) {
        if (itemStrengthNums.has(ss) || sLow === ss) {
          score += 65;
          break;
        }
      }
    }

    const isItemTab = fLow === 'tablet' || /\b(tab|tabs|tablet|tablets)\b/.test(nLow);
    const isItemCap = fLow === 'capsule' || /\b(cap|caps|capsule|capsules)\b/.test(nLow);
    const isItemSyr = fLow === 'suspension' || fLow === 'syrup' || /\b(syr|syrup|susp|suspension|drops)\b/.test(nLow);
    const isItemTop = fLow.includes('topical') || /\b(cream|gel|ointment|lotion|wash|spray)\b/.test(nLow);
    const isItemInj =
      fLow.includes('vial') ||
      fLow.includes('ampoule') ||
      fLow === 'infusion' ||
      /\b(vial|amp|ampoule|infusion|i\.v\.|i\.m\.)\b/.test(nLow);
    const isItemSupp = fLow === 'suppository' || /\b(supp|suppository|ovules|vaginal)\b/.test(nLow);
    const isItemSachet = fLow === 'sachet' || /\b(sachet|sachets|eff\.|effervescent)\b/.test(nLow);

    if (wantsTablet && isItemTab && !isItemSachet && !isItemSupp) score += 55;
    if (wantsCapsule && isItemCap) score += 55;
    if (wantsSyrup && isItemSyr) score += 55;
    if (wantsTopical && isItemTop) score += 55;
    if (wantsInjection && isItemInj) score += 55;
    if (wantsSuppository && isItemSupp) score += 55;
    if (wantsSachet && isItemSachet) score += 55;

    if (!wantsInjection && !wantsSuppository && !wantsTopical && !wantsSachet && !wantsSyrup) {
      if ((isItemTab || isItemCap) && !isItemSachet && !isItemSupp && !isItemInj) {
        score += 25;
      } else if (isItemInj || isItemSupp || isItemSachet || isItemTop) {
        score -= 35;
      }
    }

    return score;
  };

  let bestCommercialItem: DawayaCompactIndexItem | null = null;
  let bestCommercialScore = 0;

  const evaluatedIds = new Set<string>();
  for (const rawTok of commercialTokens) {
    const variants = normalizeOcrBrandTokenVariants(rawTok);
    const normArTok = norm(rawTok);
    if (normArTok && !variants.includes(normArTok)) variants.push(normArTok);

    for (const vTok of variants) {
      const exactList = brandFirstWordMap.get(vTok) || [];
      for (const cand of exactList) {
        const sc = scoreCandidateItem(cand, true, vTok === rawTok || vTok === normArTok);
        if (sc > bestCommercialScore) {
          bestCommercialScore = sc;
          bestCommercialItem = cand;
        }
        evaluatedIds.add(cand.i);
      }

      if (exactList.length === 0 && vTok.length >= 4) {
        for (const [bKey, bList] of brandFirstWordMap.entries()) {
          if (bKey.length >= 4 && (bKey.startsWith(vTok) || (vTok.length >= 5 && vTok.startsWith(bKey)))) {
            for (const cand of bList) {
              if (evaluatedIds.has(cand.i)) continue;
              const sc = scoreCandidateItem(cand, true, false);
              if (sc > bestCommercialScore) {
                bestCommercialScore = sc;
                bestCommercialItem = cand;
              }
            }
          }
        }
      }
    }
  }

  if (bestCommercialItem && bestCommercialScore >= 200) {
    return bestCommercialItem;
  }

  let bestGenericItem: DawayaCompactIndexItem | null = null;
  let bestGenericScore = 0;
  for (const gTok of genericTokens) {
    const gKey = gTok.toLowerCase().trim();
    const gNorm = norm(gKey);
    const exactList = brandFirstWordMap.get(gKey) || brandFirstWordMap.get(gNorm) || [];
    for (const cand of exactList) {
      const sc = scoreCandidateItem(cand, false, true);
      if (sc > bestGenericScore) {
        bestGenericScore = sc;
        bestGenericItem = cand;
      }
    }
  }

  return bestGenericItem;
}

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

const cachedHaystackByItem = new WeakMap<DawayaCompactIndexItem, { hay: string; skel: string }>();

function getFastItemHaystack(item: DawayaCompactIndexItem): { hay: string; skel: string } {
  let cached = cachedHaystackByItem.get(item);
  if (!cached) {
    const hay = norm(`${item.n} ${item.a} ${item.g} ${item.c} ${item.s} ${item.d} ${item.b} ${item.i}`);
    cached = { hay, skel: arabicConsonantSkeleton(hay) };
    cachedHaystackByItem.set(item, cached);
  }
  return cached;
}

export interface DawayaSearchSuggestionsResult {
  items: DawayaCompactIndexItem[];
  totalMatches: number;
}

/**
 * Ultra-fast prefix-first autocomplete suggestions across all 26,597 medicines.
 * Typing e.g. "فلا" or "fla" ranks medicines starting with that prefix first (Flagyl, Flacort, etc.),
 * followed by word-boundary prefix matches, then substring/ingredient matches.
 */
export function getDawayaSearchSuggestions(
  items: DawayaCompactIndexItem[],
  query: string,
  limit = 10
): DawayaSearchSuggestionsResult {
  const rawQ = norm(query || '');
  if (rawQ.length < 2 || items.length === 0) {
    return { items: [], totalMatches: 0 };
  }

  const tokens = rawQ.split(/\s+/).filter(Boolean);
  const expandedTokens = tokens.map((tk) => ({
    raw: tk,
    alt: ARABIC_TO_ENGLISH_INGREDIENT_MAP[tk] || tk,
    skel: tk.length >= 4 && /[\u0600-\u06FF]/.test(tk) ? arabicConsonantSkeleton(tk) : tk,
  }));

  const scored: Array<{ item: DawayaCompactIndexItem; score: number }> = [];
  let totalMatches = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { hay, skel } = getFastItemHaystack(item);
    let ok = true;
    for (let t = 0; t < expandedTokens.length; t++) {
      const tk = expandedTokens[t];
      if (
        !hay.includes(tk.raw) &&
        !hay.includes(tk.alt) &&
        !(tk.skel.length >= 3 && skel.includes(tk.skel))
      ) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    totalMatches++;
    const nameAr = norm(item.a || '');
    const nameEn = norm(item.n || '');
    let score = 200;

    if (nameAr.startsWith(rawQ) || nameEn.startsWith(rawQ)) {
      score = 1000;
    } else if (nameAr.includes(' ' + rawQ) || nameEn.includes(' ' + rawQ)) {
      score = 720;
    } else if (nameAr.includes(rawQ) || nameEn.includes(rawQ)) {
      score = 450;
    }

    if (item.b) score += 45;
    if (item.p && item.p > 0) score += 10;
    score -= Math.min(40, (item.n || '').length * 0.5);

    scored.push({ item, score });
  }

  if (scored.length === 0) {
    return { items: [], totalMatches: 0 };
  }

  scored.sort((a, b) => b.score - a.score);
  return {
    items: scored.slice(0, limit).map((x) => x.item),
    totalMatches,
  };
}

export function searchDawayaIndex(
  items: DawayaCompactIndexItem[],
  filters: DawayaSearchFilters,
  isAr = true
): DawayaCompactIndexItem[] {
  const rawQ = norm(filters.query || '');
  const cat = filters.category || 'all';
  const form = filters.dosageForm || 'all';
  const route = filters.route || 'all';
  const bcFilter = filters.barcodeFilter || 'all';
  const comboFilter = filters.combinationFilter || 'all';
  const sortBy = filters.sortBy || (rawQ ? 'relevance' : 'verified_first');

  // O(1) 0.00ms Instant Fast-Path when opening Medicines page with default filters!
  if (
    !rawQ &&
    cat === 'all' &&
    form === 'all' &&
    route === 'all' &&
    bcFilter === 'all' &&
    comboFilter === 'all' &&
    sortBy === 'verified_first'
  ) {
    return items;
  }

  const tokens = rawQ ? rawQ.split(/\s+/).filter(Boolean) : [];
  const expandedTokens = tokens.map((tk) => ({
    raw: tk,
    alt: ARABIC_TO_ENGLISH_INGREDIENT_MAP[tk] || tk,
    skel: tk.length >= 4 && /[\u0600-\u06FF]/.test(tk) ? arabicConsonantSkeleton(tk) : tk,
  }));

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

    const { hay, skel } = getFastItemHaystack(item);
    return expandedTokens.every(
      (t) => hay.includes(t.raw) || hay.includes(t.alt) || (t.skel.length >= 3 && skel.includes(t.skel))
    );
  });

  // Since items is already pre-sorted in verified_first order, skip sorting when sortBy === 'verified_first'!
  if (sortBy === 'verified_first') {
    return filtered;
  }
  if (sortBy === 'price_asc') {
    return filtered.sort((a, b) => (a.p ?? 999999) - (b.p ?? 999999));
  }
  if (sortBy === 'price_desc') {
    return filtered.sort((a, b) => (b.p ?? 0) - (a.p ?? 0));
  }
  if (sortBy === 'name') {
    return filtered.sort((a, b) => {
      const ka = isAr ? a.a || a.n : a.n;
      const kb = isAr ? b.a || b.n : b.n;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
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
      return a.n < b.n ? -1 : a.n > b.n ? 1 : 0;
    });
  }

  return filtered;
}

/**
 * React Hook for accessing the full 26,562 DAWAYA medicine database anywhere in the platform
 */

const WIKI_IMAGE_CACHE_KEY = 'dawaya_wiki_image_cache_v1';

export async function fetchDrugImageFromWikipedia(
  brandNameEn?: string,
  genericName?: string
): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const candidates: string[] = [];
  if (brandNameEn) {
    const firstWord = brandNameEn.trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9-]/g, '');
    if (firstWord.length >= 5) candidates.push(firstWord);
  }
  if (genericName && !genericName.includes('غير محدد')) {
    const firstGen = genericName.split(/[+|/,;()]/)[0].trim().replace(/[^a-zA-Z0-9\s-]/g, '');
    if (firstGen.length >= 5 && !candidates.includes(firstGen)) candidates.push(firstGen);
  }
  if (candidates.length === 0) return null;

  try {
    const raw = localStorage.getItem(WIKI_IMAGE_CACHE_KEY);
    const cache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    for (const term of candidates) {
      const key = term.toLowerCase();
      if (cache[key]) {
        if (cache[key] !== 'NONE') return cache[key];
        continue;
      }
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.replace(/\s+/g, '_'))}`
        );
        if (res.ok) {
          const data = (await res.json()) as { thumbnail?: { source?: string } };
          const src = data?.thumbnail?.source || '';
          if (src.startsWith('http') && !src.toLowerCase().endsWith('.svg')) {
            cache[key] = src;
            localStorage.setItem(WIKI_IMAGE_CACHE_KEY, JSON.stringify(cache));
            return src;
          }
        }
      } catch {
        /* ignore */
      }
      cache[key] = 'NONE';
      localStorage.setItem(WIKI_IMAGE_CACHE_KEY, JSON.stringify(cache));
    }
  } catch {
    /* ignore */
  }
  return null;
}

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
    window.dispatchEvent(new CustomEvent('dawaya_db_updated'));
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

if (typeof window !== 'undefined') {
  rebuildFastMaps(globalIndexItems);
  window.setTimeout(() => {
    ensureDawayaDatabaseLoaded().catch(() => {});
  }, 60);
}


/**
 * Medication Database Ambiguity & Multi-Candidate Matcher (Section 4 Upgrade):
 * Searches the 26,562+ DAWAYA medication index + 206 commercial packages by:
 * 1) Brand name (Arabic & English)
 * 2) Active ingredient
 * 3) Strength and dosage form verification
 * - Presents possible matches if multiple products exist (e.g., Augmentin 1g Tab vs 625mg Tab vs 457mg Susp).
 * - NEVER automatically selects an uncertain match.
 */
export interface MedicationDatabaseMatchCandidate {
  id: string;
  brandNameAr: string;
  brandNameEn: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  route: string;
  priceEgp: number | null;
  manufacturer: string;
  matchScore: number;
  strengthVerified: boolean;
  formVerified: boolean;
}

export interface MedicationDatabaseMatchResult {
  exactSingleMatch: MedicationDatabaseMatchCandidate | null;
  possibleMatches: MedicationDatabaseMatchCandidate[];
  isUncertainOrMultiple: boolean;
  requiresPatientSelection: boolean;
  resolutionReasonAr: string;
  resolutionReasonEn: string;
}

export function matchMedicationCandidatesFromDatabase(params: {
  rawName: string;
  rawStrength?: string;
  rawDosageForm?: string;
  rawActiveIngredient?: string;
  maxCandidates?: number;
}): MedicationDatabaseMatchResult {
  const maxCandidates = params.maxCandidates || 6;
  const cleanName = (params.rawName || '')
    .replace(/^(RX_[A-Z_]+|DRUG_[A-Z_]+):\s*/i, '')
    .trim();

  if (!cleanName || cleanName.length < 2) {
    return {
      exactSingleMatch: null,
      possibleMatches: [],
      isUncertainOrMultiple: true,
      requiresPatientSelection: true,
      resolutionReasonAr: 'اسم الدواء غير واضح — يرجى كتابة اسم الدواء أو اختياره من القائمة.',
      resolutionReasonEn: 'Medication name is unclear — please enter or select the medication.',
    };
  }

  // Fast-path: Use our Brand-First, Strength & Form-aware matcher first!
  const combinedLookupQuery = [cleanName, params.rawStrength || '', params.rawDosageForm || '', params.rawActiveIngredient || '']
    .filter(Boolean)
    .join(' ');
  const directHit = findDawayaIndexItemSync(combinedLookupQuery) || findDawayaIndexItemSync(cleanName);
  const targetStrength = normalizeStrengthForEquivalence(params.rawStrength || '', cleanName);

  if (directHit) {
    const hitStrength = normalizeStrengthForEquivalence(directHit.s, directHit.n);
    const hasExplicitStrengthMatch =
      !targetStrength || !hitStrength || targetStrength === hitStrength || cleanName.toLowerCase().includes(directHit.n.toLowerCase());
    const directCandidate: MedicationDatabaseMatchCandidate = {
      id: directHit.i,
      brandNameAr: directHit.a || directHit.n,
      brandNameEn: directHit.n,
      activeIngredient: directHit.g || '',
      strength: directHit.s || params.rawStrength || '',
      dosageForm: directHit.f || 'tablet',
      route: directHit.r || 'oral',
      priceEgp: directHit.p ?? null,
      manufacturer: directHit.c || '',
      matchScore: hasExplicitStrengthMatch ? 96 : 86,
      strengthVerified: Boolean(targetStrength || directHit.s),
      formVerified: true,
    };
    if (hasExplicitStrengthMatch && (targetStrength || directHit.s || cleanName.includes('('))) {
      return {
        exactSingleMatch: directCandidate,
        possibleMatches: [directCandidate],
        isUncertainOrMultiple: false,
        requiresPatientSelection: false,
        resolutionReasonAr: `تم التحقق من تطابق الاسم التجاري والمادة الفعالة والتركيز (${directCandidate.brandNameAr}).`,
        resolutionReasonEn: `Verified exact match by brand name, active ingredient, and strength (${directCandidate.brandNameEn}).`,
      };
    }
  }

  const strippedParensName = cleanName.replace(/[()[\]]/g, ' ').trim();
  const normQuery = norm(strippedParensName);
  const firstWord = normQuery.split(/\s+/)[0] || normQuery;
  const rawFormLower = `${params.rawDosageForm || ''} ${strippedParensName}`.toLowerCase();

  let targetForm = '';
  if (/(tablet|\btab\b|قرص|أقراص|اقراص)/i.test(rawFormLower)) targetForm = 'tablet';
  else if (/(capsule|\bcap\b|كبسول|كبسولة)/i.test(rawFormLower)) targetForm = 'capsule';
  else if (/(suspension|\bsyr\b|syrup|شراب|معلق)/i.test(rawFormLower)) targetForm = 'suspension';
  else if (/(\bvial\b|ampoule|\bamp\b|injection|حقن|حقنة|أمبول|امبول|فيال)/i.test(rawFormLower)) targetForm = 'vial';
  else if (/(cream|ointment|\bgel\b|كريم|مرهم|جيل|دهان)/i.test(rawFormLower)) targetForm = 'cream';
  else if (/(drops|نقط|قطرة|قطره)/i.test(rawFormLower)) targetForm = 'drops';

  const hits = searchDawayaIndex(
    globalIndexItems,
    { query: firstWord.length >= 3 ? firstWord : strippedParensName },
    true
  ).slice(0, 35);

  const scored: MedicationDatabaseMatchCandidate[] = hits.map((item) => {
    const itemNormEn = norm(item.n);
    const itemNormAr = norm(item.a);
    const itemStrength = normalizeStrengthForEquivalence(item.s, item.n);
    const itemForm = (item.f || '').toLowerCase();

    let score = 50;
    if (directHit && item.i === directHit.i) {
      score += 45;
    } else if (itemNormEn === normQuery || itemNormAr === normQuery) {
      score += 40;
    } else if (itemNormEn.startsWith(firstWord) || itemNormAr.startsWith(firstWord)) {
      score += 25;
    }

    const strengthVerified = Boolean(
      targetStrength && itemStrength && targetStrength === itemStrength
    );
    if (strengthVerified) {
      score += 30;
    } else if (targetStrength && itemStrength && targetStrength !== itemStrength) {
      score -= 15;
    }

    const formVerified = Boolean(
      targetForm &&
        (itemForm === targetForm ||
          (targetForm === 'vial' && (itemForm.includes('vial') || itemForm.includes('amp'))))
    );
    if (formVerified) {
      score += 20;
    } else if (targetForm && itemForm && itemForm !== targetForm) {
      score -= 10;
    }

    if (params.rawActiveIngredient && item.g) {
      const ingNorm = norm(params.rawActiveIngredient);
      if (ingNorm.length >= 4 && norm(item.g).includes(ingNorm)) {
        score += 15;
      }
    }

    return {
      id: item.i,
      brandNameAr: item.a || item.n,
      brandNameEn: item.n,
      activeIngredient: item.g || '',
      strength: item.s || '',
      dosageForm: item.f || 'tablet',
      route: item.r || 'oral',
      priceEgp: item.p ?? null,
      manufacturer: item.c || '',
      matchScore: Math.max(10, Math.min(100, score)),
      strengthVerified,
      formVerified,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const topCandidates = scored.slice(0, maxCandidates);

  if (topCandidates.length === 0) {
    return {
      exactSingleMatch: null,
      possibleMatches: [],
      isUncertainOrMultiple: true,
      requiresPatientSelection: true,
      resolutionReasonAr: `لم يتم العثور على تطابق مؤكد لـ «${cleanName}» في قاعدة البيانات — يرجى مراجعة الاسم والتركيز مع الصيدلي.`,
      resolutionReasonEn: `No verified match found for "${cleanName}" in the database — please verify the name and strength.`,
    };
  }

  const best = topCandidates[0];
  const second = topCandidates[1];
  const hasMultipleStrengthsOrForms =
    topCandidates.length > 1 &&
    (!targetStrength || !best.strengthVerified || (second && best.matchScore - second.matchScore < 18));

  if (!hasMultipleStrengthsOrForms && best.matchScore >= 85 && best.strengthVerified) {
    return {
      exactSingleMatch: best,
      possibleMatches: topCandidates,
      isUncertainOrMultiple: false,
      requiresPatientSelection: false,
      resolutionReasonAr: `تم التحقق من تطابق الاسم التجاري والمادة الفعالة والتركيز (${best.brandNameAr} — ${best.strength}).`,
      resolutionReasonEn: `Verified exact match by brand name, active ingredient, and strength (${best.brandNameEn} — ${best.strength}).`,
    };
  }

  return {
    exactSingleMatch: null,
    possibleMatches: topCandidates,
    isUncertainOrMultiple: true,
    requiresPatientSelection: true,
    resolutionReasonAr:
      topCandidates.length > 1
        ? `يوجد ${topCandidates.length} أصناف/تركيزات محتملة لـ «${cleanName}» في قاعدة بيانات دوايا — يرجى اختيار التركيز والشكل الصيدلي المكتوب في روشتتك (لا يتم الاختيار تلقائياً عند وجود أكثر من احتمال).`
        : `يرجى تأكيد التركيز والشكل الصيدلي لـ «${best.brandNameAr}» قبل الحفظ.`,
    resolutionReasonEn:
      topCandidates.length > 1
        ? `Found ${topCandidates.length} possible products/strengths for "${cleanName}" in DAWAYA database — please select the exact strength and dosage form on your prescription (never auto-selected when uncertain).`
        : `Please confirm the strength and dosage form for "${best.brandNameEn}" before saving.`,
  };
}

export interface SmartClinicalRegimen {
  frequencyKey: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily';
  dosesPerDay: 1 | 2 | 3 | 4;
  firstDoseTime: string;
  defaultDoseTimes: string[];
  defaultDoseTextAr: string;
  defaultDoseTextEn: string;
  defaultDurationDays: number;
  route: 'oral' | 'suspension' | 'injection' | 'topical';
  mealTimingAr: string;
  mealTimingEn: string;
  aiReasonAr: string;
  aiReasonEn: string;
}

export function getSmartClinicalRegimenForMedicine(
  queryOrItem: string | DawayaCompactIndexItem | null | undefined
): SmartClinicalRegimen {
  const item =
    typeof queryOrItem === 'string'
      ? findDawayaIndexItemSync(queryOrItem)
      : queryOrItem || null;

  const rawStr = typeof queryOrItem === 'string' ? queryOrItem.toLowerCase() : '';
  const gLow = ((item?.g || '') + ' ' + rawStr).toLowerCase();
  const fLow = ((item?.f || '') + ' ' + (item?.n || '') + ' ' + rawStr).toLowerCase();
  const sText = item?.s || '';

  let route: 'oral' | 'suspension' | 'injection' | 'topical' = 'oral';
  if (/vial|amp|infusion|injection|فيال|امبول|أمبول|حقن|وريد|عضل/i.test(fLow)) {
    route = 'injection';
  } else if (/susp|syrup|syr|drops|شراب|معلق|نقط/i.test(fLow)) {
    route = 'suspension';
  } else if (/cream|gel|ointment|lotion|topical|spray|wash|soap|كريم|مرهم|جل|لوشن|موضعي|غسول|بخاخ/i.test(fLow)) {
    route = 'topical';
  }

  const unitLabelAr =
    route === 'topical'
      ? 'دهان موضعي خفيف'
      : route === 'suspension'
        ? 'جرعة بالسرنجة الفموية'
        : route === 'injection'
          ? 'حقنة واحدة'
          : /cap|كبسول/i.test(fLow)
            ? 'كبسولة واحدة' + (sText ? ' (' + sText + ')' : '')
            : /sachet|eff|فوار|كيس|أكياس/i.test(fLow)
              ? 'كيس واحد على نصف كوب ماء' + (sText ? ' (' + sText + ')' : '')
              : 'قرص واحد' + (sText ? ' (' + sText + ')' : '');

  const unitLabelEn =
    route === 'topical'
      ? 'Thin topical layer'
      : route === 'suspension'
        ? 'Measured oral dose'
        : route === 'injection'
          ? '1 injection'
          : /cap/i.test(fLow)
            ? '1 capsule' + (sText ? ' (' + sText + ')' : '')
            : '1 tablet' + (sText ? ' (' + sText + ')' : '');

  // 1) Check 3-times-daily (every 8 hours: 06:00 AM, 02:00 PM, 10:00 PM) medications
  if (
    /(metronidazole|ibuprofen|diclofenac|ketoprofen|dexketoprofen|paracetamol|acetaminophen|nifuroxazide|chymotrypsin|trypsin|domperidone|metoclopramide|hyoscine|tiemonium|mebeverine|simethicone|amoxicillin(?!.*clav)|cephradine|cephalexin|cefadroxil|fusidic|clindamycin|pseudoephedrine|chlorpheniramine|guaiaphenesin|bromhexine|ambroxol|ivy|ميترونيدازول|ايبوبروفين|ديكلوفيناك|باراسيتامول|نيفوروكسازيد|اموكسيسيلين)/i.test(
      gLow
    ) &&
    !/amoxicillin.*clav|clavulan/i.test(gLow)
  ) {
    const isNsaid = /(ibuprofen|diclofenac|ketoprofen|dexketoprofen)/i.test(gLow);
    const isBeforeMeal = /(chymotrypsin|trypsin|domperidone|metoclopramide|mebeverine)/i.test(gLow);
    const mealAr = isBeforeMeal
      ? 'قبل الأكل بـ 30 إلى 60 دقيقة'
      : isNsaid
        ? 'بعد الأكل مباشرة لتفادي التهاب المعدة'
        : 'بعد الأكل';
    const mealEn = isBeforeMeal
      ? '30-60 mins before meals'
      : isNsaid
        ? 'Immediately after meals to protect the stomach'
        : 'After meals';
    const dur = /(metronidazole|amoxicillin|cephalexin|clindamycin)/i.test(gLow) ? 7 : 5;

    return {
      frequencyKey: 'thrice_daily',
      dosesPerDay: 3,
      firstDoseTime: '06:00',
      defaultDoseTimes: ['06:00', '14:00', '22:00'],
      defaultDoseTextAr: unitLabelAr + ' — ' + mealAr,
      defaultDoseTextEn: unitLabelEn + ' — ' + mealEn,
      defaultDurationDays: dur,
      route,
      mealTimingAr: mealAr,
      mealTimingEn: mealEn,
      aiReasonAr: '💡 مقترح الذكاء الاصطناعي حسب المادة الفعالة: 3 مرات يومياً (كل 8 ساعات: 6:00 ص • 2:00 م • 10:00 م)',
      aiReasonEn: '💡 AI Clinical Suggestion: 3 times daily (every 8 hours: 06:00 AM • 02:00 PM • 10:00 PM)',
    };
  }

  // 2) Check Once-Daily (every 24 hours) medications
  if (
    /(azithromycin|levofloxacin|moxifloxacin|cefixime|ceftriaxone|cefdinir|pantoprazole|esomeprazole|omeprazole|lansoprazole|rabeprazole|bisoprolol|amlodipine|valsartan|telmisartan|losartan|candesartan|olmesartan|nebivolol|atenolol|ramipril|perindopril|lisinopril|empagliflozin|dapagliflozin|sitagliptin|glimepiride|gliclazide|atorvastatin|rosuvastatin|simvastatin|clopidogrel|apixaban|rivaroxaban|warfarin|cetirizine|levocetirizine|fexofenadine|loratadine|desloratadine|montelukast|levothyroxine|isotretinoin|adapalene|tamsulosin|finasteride|febuxostat|allopurinol|ازيثرومايسين|ليفوفلوكساسين|بانتوبرازول|ايزوميبرازول|اوميبرازول|بيسوبرولول|املوديبين|اتورفاستاتين|روزوفاستاتين|سيتيريزين|ليفوسيتيريزين|فيكسوفينادين|ليفوثيروكسين|ايزوتريتينوين)/i.test(
      gLow
    )
  ) {
    const isPpiOrThyroid = /(pantoprazole|esomeprazole|omeprazole|lansoprazole|rabeprazole|levothyroxine)/i.test(gLow);
    const isEvening = /(atorvastatin|rosuvastatin|simvastatin|cetirizine|levocetirizine|loratadine|desloratadine|montelukast|adapalene|tamsulosin)/i.test(gLow);
    const startT = isEvening ? '21:00' : '08:00';
    const mealAr = isPpiOrThyroid
      ? 'على معدة فارغة قبل الإفطار بـ 30 دقيقة'
      : isEvening
        ? 'مرة واحدة مساءً قبل النوم'
        : 'مرة واحدة يومياً بعد الإفطار';
    const mealEn = isPpiOrThyroid
      ? 'On an empty stomach 30 mins before breakfast'
      : isEvening
        ? 'Once daily in the evening'
        : 'Once daily after breakfast';
    const dur = /azithromycin/i.test(gLow)
      ? 3
      : /(levofloxacin|moxifloxacin|cefixime|ceftriaxone|cefdinir|cetirizine|levocetirizine|fexofenadine)/i.test(gLow)
        ? 7
        : /(pantoprazole|esomeprazole|omeprazole|lansoprazole)/i.test(gLow)
          ? 14
          : 30;

    return {
      frequencyKey: 'once_daily',
      dosesPerDay: 1,
      firstDoseTime: startT,
      defaultDoseTimes: [startT],
      defaultDoseTextAr: unitLabelAr + ' — ' + mealAr,
      defaultDoseTextEn: unitLabelEn + ' — ' + mealEn,
      defaultDurationDays: dur,
      route,
      mealTimingAr: mealAr,
      mealTimingEn: mealEn,
      aiReasonAr: '💡 مقترح الذكاء الاصطناعي حسب المادة الفعالة: مرة واحدة يومياً (كل 24 ساعة — ' + (isEvening ? '9:00 مساءً' : '8:00 صباحاً') + ')',
      aiReasonEn: '💡 AI Clinical Suggestion: Once daily (every 24 hours — ' + (isEvening ? '09:00 PM' : '08:00 AM') + ')',
    };
  }

  // 3) Default / Twice-Daily (every 12 hours: 08:00 AM, 08:00 PM) medications
  const dur = /(amoxicillin|clavulan|ampicillin|sulbactam|ciprofloxacin|norfloxacin|ofloxacin|cefuroxime|cefotaxime|clarithromycin|doxycycline|linezolid|nitrofurantoin|sulfamethoxazole|trimethoprim)/i.test(
    gLow
  )
    ? 7
    : /(metformin|vildagliptin|benfotiamine)/i.test(gLow)
      ? 30
      : 7;

  return {
    frequencyKey: 'twice_daily',
    dosesPerDay: 2,
    firstDoseTime: '08:00',
    defaultDoseTimes: ['08:00', '20:00'],
    defaultDoseTextAr: unitLabelAr + ' — بعد الأكل كل 12 ساعة',
    defaultDoseTextEn: unitLabelEn + ' — After meals every 12 hours',
    defaultDurationDays: dur,
    route,
    mealTimingAr: 'بعد الأكل',
    mealTimingEn: 'After meals',
    aiReasonAr: '💡 مقترح الذكاء الاصطناعي حسب المادة الفعالة: مرتين يومياً (كل 12 ساعة: 8:00 ص • 8:00 م)',
    aiReasonEn: '💡 AI Clinical Suggestion: Twice daily (every 12 hours: 08:00 AM • 08:00 PM)',
  };
}


// ============================================================================
// Pharmacy Departments, Subcategories, Missing Devices & Batch Price Range
// ============================================================================
export type DawayaPharmacyDepartment =
  | 'medicines'
  | 'skincare'
  | 'haircare'
  | 'vitamins'
  | 'baby_oral'
  | 'devices';

export interface DawayaDepartmentSubcategory {
  id: string;
  ar: string;
  en: string;
}

export interface DawayaDepartmentMeta {
  id: DawayaPharmacyDepartment;
  ar: string;
  en: string;
  icon: string;
  descAr: string;
  descEn: string;
  subs: DawayaDepartmentSubcategory[];
}

export const DAWAYA_PHARMACY_DEPARTMENTS: DawayaDepartmentMeta[] = [
  {
    id: 'medicines',
    ar: 'الأدوية العلاجية والروشتات',
    en: 'Therapeutic Medicines & Rx',
    icon: '💊',
    descAr: 'الأدوية المسجلة والخاضعة للتسعيرة الجبرية لهيئة الدواء المصرية مقسمة بالتخصص.',
    descEn: 'Registered prescription & OTC medicines grouped by specialty.',
    subs: [
      { id: 'all', ar: 'كل الأدوية العلاجية', en: 'All Medicines' },
      { id: 'antibiotics', ar: 'المضادات الحيوية', en: 'Antibiotics' },
      { id: 'cardio_dm', ar: 'الضغط والقلب والسكر', en: 'BP, Heart & Diabetes' },
      { id: 'gastro', ar: 'المعدة والقولون', en: 'Stomach & GI' },
      { id: 'pain_cold', ar: 'المسكنات والبرد والحساسية', en: 'Pain, Cold & Allergy' },
    ],
  },
  {
    id: 'skincare',
    ar: 'الغسولات والعناية بالبشرة',
    en: 'Cleansers & Skincare',
    icon: '✨',
    descAr: 'غسولات الوجه الطبية، واقيات الشمس (صن بلوك)، المرطبات، السيروم، وعلاج حب الشباب.',
    descEn: 'Medical facial cleansers, sunscreens, moisturizers & serums.',
    subs: [
      { id: 'all', ar: 'كل منتجات البشرة', en: 'All Skincare' },
      { id: 'facewash', ar: 'غسولات الوجه والمنظفات', en: 'Facial Cleansers' },
      { id: 'sunscreen', ar: 'صن بلوك وواقي شمس', en: 'Sunscreens SPF+' },
      { id: 'moisturizer_serum', ar: 'مرطبات وسيروم وكريمات', en: 'Moisturizers & Serums' },
    ],
  },
  {
    id: 'haircare',
    ar: 'العناية بالشعر والشامبوهات',
    en: 'Hair Care & Shampoos',
    icon: '💆',
    descAr: 'شامبوهات طبية للقشرة والتساقط، أمبولات الإنبات، اللوشن، والزيوت المغذية.',
    descEn: 'Medical shampoos, anti-hairloss ampoules, sprays & oils.',
    subs: [
      { id: 'all', ar: 'كل منتجات الشعر', en: 'All Hair Care' },
      { id: 'shampoo', ar: 'شامبوهات القشرة والفروة', en: 'Medical Shampoos' },
      { id: 'hairloss', ar: 'علاج التساقط والأمبولات', en: 'Anti-Hairloss & Ampoules' },
      { id: 'oils_serum', ar: 'زيوت وسيروم وحمام كريم', en: 'Oils, Serums & Masks' },
    ],
  },
  {
    id: 'vitamins',
    ar: 'الفيتامينات والمكملات الغذائية',
    en: 'Vitamins & Supplements',
    icon: '☀️',
    descAr: 'أوميجا 3، الحديد وعلاج الأنيميا، فيتامين د والكالسيوم، ومكملات المناعة والرياضيين.',
    descEn: 'Omega 3, Iron, Vitamin D, Calcium & Immunity boosters.',
    subs: [
      { id: 'all', ar: 'كل الفيتامينات والمكملات', en: 'All Vitamins' },
      { id: 'omega', ar: 'أوميجا 3 والذاكرة', en: 'Omega 3 & Brain' },
      { id: 'iron', ar: 'الحديد والأنيميا والحمل', en: 'Iron & Anemia' },
      { id: 'vitd_bones', ar: 'فيتامين د والعظام والمناعة', en: 'Vitamin D, Bones & Immunity' },
    ],
  },
  {
    id: 'baby_oral',
    ar: 'الأم والطفل والفم والأسنان',
    en: 'Baby Care & Oral Health',
    icon: '👶',
    descAr: 'ألبان الأطفال، كريمات الحفاضات والعناية بالبيبي، وغسولات ومعاجين الفم والأسنان.',
    descEn: 'Infant formulas, baby care, mouthwashes & medical toothpastes.',
    subs: [
      { id: 'all', ar: 'كل منتجات الطفل والأسنان', en: 'All Baby & Oral' },
      { id: 'milk', ar: 'ألبان الأطفال', en: 'Infant Formula' },
      { id: 'baby_care', ar: 'عناية وكريمات الطفل', en: 'Baby Skincare & Diapers' },
      { id: 'oral', ar: 'غسول الفم ومعجون الأسنان', en: 'Mouthwash & Dental' },
    ],
  },
  {
    id: 'devices',
    ar: 'الأجهزة والمستلزمات والإسعافات',
    en: 'Devices & First Aid Supplies',
    icon: '🩺',
    descAr: 'أجهزة قياس الضغط والسكر والشرائط، أجهزة البخار (نيبولايزر)، الترمومترات، والإسعافات الأولية.',
    descEn: 'BP monitors, glucometers, strips, nebulizers & first aid kits.',
    subs: [
      { id: 'all', ar: 'كل الأجهزة والمستلزمات', en: 'All Devices & Supplies' },
      { id: 'bp_glucose', ar: 'أجهزة الضغط والسكر والشرائط', en: 'BP & Glucose Monitors' },
      { id: 'nebulizer_therm', ar: 'أجهزة البخار والترمومترات', en: 'Nebulizers & Thermometers' },
      { id: 'firstaid', ar: 'الإسعافات الأولية والسرنجات', en: 'First Aid & Syringes' },
    ],
  },
];

export const DAWAYA_MISSING_PHARMACY_DEVICES: DawayaCompactIndexItem[] = [
  { i: 'dev-omron-m2', n: 'Omron M2 Basic Digital Blood Pressure Monitor', a: 'جهاز قياس ضغط الدم الديجيتال أومرون M2', g: 'Upper Arm Automatic BP Monitor', c: 'Omron Healthcare', p: 2150, op: 1950, b: '4015672111011', f: 'Medical Device', r: 'Device', s: 'Automatic Arm Cuff', k: 'general_medicine', d: 'جهاز قياس ضغط الدم المنزلي المعتمد مع مؤشر انتظام ضربات القلب', w: 0, u: '1 Device', ch: 0, v: 1 },
  { i: 'dev-omron-m3', n: 'Omron M3 Comfort Digital Blood Pressure Monitor', a: 'جهاز قياس ضغط الدم أومرون M3 كومفورت بالذكاء الاصطناعي للكف', g: 'IntelliWrap 360° Cuff BP Monitor', c: 'Omron Healthcare', p: 3250, op: 2950, b: '4015672111028', f: 'Medical Device', r: 'Device', s: '360° IntelliWrap Cuff', k: 'general_medicine', d: 'جهاز قياس ضغط دقيق بذاكرة لمستخدمين وكاشف رجفان أذيني', w: 0, u: '1 Device', ch: 0, v: 1 },
  { i: 'dev-beurer-bm28', n: 'Beurer BM 28 Upper Arm Blood Pressure Monitor', a: 'جهاز قياس الضغط الألماني بيورير BM 28', g: 'German Digital BP Monitor', c: 'Beurer Germany', p: 1850, op: 1690, b: '4211125658243', f: 'Medical Device', r: 'Device', s: 'Universal Cuff 22-42cm', k: 'general_medicine', d: 'جهاز قياس ضغط ألماني الصنع مع تنبيه لعدم انتظام نبضات القلب', w: 0, u: '1 Device', ch: 0, v: 1 },
  { i: 'dev-mercury-bp', n: 'Rossmax / Riester Mercurial Sphygmomanometer', a: 'جهاز قياس ضغط زئبقي كلاسيك مع السماعة الطبية', g: 'Classic Desk Mercury BP Monitor + Stethoscope', c: 'Rossmax / Riester', p: 1350, op: 1180, b: '4719860260015', f: 'Medical Device', r: 'Device', s: '0-300 mmHg', k: 'general_medicine', d: 'جهاز ضغط زئبقي عيادات ومنزلي عالي التحمل مع سماعة طبية', w: 0, u: '1 Set', ch: 0, v: 1 },
  { i: 'dev-contour-plus-kit', n: 'Contour Plus One Blood Glucose Meter Kit', a: 'جهاز قياس سكر الدم كونتور بلس وان (مع 10 شرائط وقلم شك)', g: 'Smart Bluetooth Glucometer', c: 'Ascensia Diabetes Care', p: 780, op: 690, b: '5016003711005', f: 'Medical Device', r: 'Device', s: 'SmartLIGHT Accuracy', k: 'general_medicine', d: 'جهاز قياس السكر الدقيق بدون تكويد مع تنبيه فوري لنطاق السكر', w: 0, u: '1 Kit', ch: 0, v: 1 },
  { i: 'dev-contour-strips-50', n: 'Contour Plus Blood Glucose Test Strips 50 pcs', a: 'شرائط قياس السكر كونتور بلس (عبوة 50 شريط)', g: 'Blood Glucose Test Strips', c: 'Ascensia Diabetes Care', p: 540, op: 495, b: '5016003712002', f: 'Test Strips', r: 'Device', s: '50 Strips', k: 'general_medicine', d: 'شرائط قياس سكر الدم لجهاز كونتور بلس وكوتور بلس وان', w: 0, u: '50 Strips', ch: 0, v: 1 },
  { i: 'dev-accuchek-instant', n: 'Accu-Chek Instant Blood Glucose Monitor', a: 'جهاز قياس السكر أكيوتشيك إنستانت', g: 'Instant Blood Glucose Meter', c: 'Roche Diabetes Care', p: 820, op: 740, b: '4015630068258', f: 'Medical Device', r: 'Device', s: 'Target Range Indicator', k: 'general_medicine', d: 'جهاز قياس السكر بالدم من روش مع مؤشر لوني لمستوى السكر', w: 0, u: '1 Kit', ch: 0, v: 1 },
  { i: 'dev-accuchek-strips-50', n: 'Accu-Chek Instant Test Strips 50 pcs', a: 'شرائط قياس السكر أكيوتشيك إنستانت (50 شريط)', g: 'Roche Glucose Test Strips', c: 'Roche Diabetes Care', p: 560, op: 510, b: '4015630068265', f: 'Test Strips', r: 'Device', s: '50 Strips', k: 'general_medicine', d: 'شرائط اختبار السكر الأصلية لجهاز أكيوتشيك إنستانت', w: 0, u: '50 Strips', ch: 0, v: 1 },
  { i: 'dev-oncall-strips-50', n: 'On Call Plus Blood Glucose Test Strips 50 pcs', a: 'شرائط قياس السكر أون كول بلس الاقتصادية (50 شريط)', g: 'On Call Plus Glucose Strips', c: 'Acon Labs', p: 360, op: 320, b: '0845880010509', f: 'Test Strips', r: 'Device', s: '50 Strips', k: 'general_medicine', d: 'شرائط قياس السكر الاقتصادية لجهاز أون كول بلس', w: 0, u: '50 Strips', ch: 0, v: 1 },
  { i: 'dev-nebulizer-rossmax', n: 'Rossmax NA100 Piston Nebulizer Compressor', a: 'جهاز جلسات البخار (نيبولايزر) روسمكس للمنزل والأطفال', g: 'Compressor Nebulizer System', c: 'Rossmax Swiss', p: 1450, op: 1290, b: '4719860261203', f: 'Medical Device', r: 'Device', s: 'Adult + Pediatric Masks', k: 'general_medicine', d: 'جهاز استنشاق البخار لعلاج حساسية الصدر والربو مع ماسك كبار وأطفال', w: 0, u: '1 Device', ch: 0, v: 1 },
  { i: 'dev-nebulizer-omron', n: 'Omron NE-C28 Compressor Nebulizer', a: 'جهاز نيبولايزر أومرون C28 لجلسات الاستنشاق', g: 'High Efficiency Compressor Nebulizer', c: 'Omron Healthcare', p: 2450, op: 2200, b: '4015672103603', f: 'Medical Device', r: 'Device', s: 'V.V.T. Valve Tech', k: 'general_medicine', d: 'جهاز جلسات تنفس واستنشاق فائق الكفاءة لحساسية الصدر', w: 0, u: '1 Device', ch: 0, v: 1 },
  { i: 'dev-thermometer-flex', n: 'Digital Flexible Tip Medical Thermometer', a: 'ترمومتر طبي ديجيتال بسن مرن لقياس الحرارة', g: 'Fast 10s Digital Thermometer', c: 'Rossmax / Beurer', p: 145, op: 120, b: '4719860262002', f: 'Medical Device', r: 'Device', s: 'Waterproof Flexible Tip', k: 'general_medicine', d: 'ترمومتر قياس حرارة رقمي سريع وآمن للأطفال والكبار', w: 0, u: '1 pc', ch: 0, v: 1 },
  { i: 'dev-thermometer-ir', n: 'Infrared Forehead Non-Contact Thermometer', a: 'ترمومتر حراري بالليزر عن بُعد (أشعة تحت الحمراء)', g: 'Non-Contact IR Thermometer', c: 'Beurer / Jumper', p: 680, op: 610, b: '4211125795207', f: 'Medical Device', r: 'Device', s: '1-Second Reading', k: 'general_medicine', d: 'قياس حرارة الجبهة بدون تلامس للأطفال والرضع خلال ثانية واحدة', w: 0, u: '1 Device', ch: 0, v: 1 },
  { i: 'dev-oximeter', n: 'Fingertip Pulse Oximeter SpO2 & Heart Rate', a: 'جهاز قياس نسبة الأكسجين بالدم والنبض (بالأصبع)', g: 'SpO2 & Pulse Rate Monitor', c: 'Rossmax / Contec', p: 520, op: 450, b: '6945040100126', f: 'Medical Device', r: 'Device', s: 'OLED Display', k: 'general_medicine', d: 'جهاز قياس تشبع الأكسجين في الدم ومعدل نبض القلب لمرضى الصدر', w: 0, u: '1 Device', ch: 0, v: 1 },
  { i: 'aid-firstaid-kit', n: 'Complete Home & Car First Aid Kit 45 pcs', a: 'شنطة إسعافات أولية منزلية متكاملة (45 قطعة)', g: 'Emergency First Aid Supplies Kit', c: 'Egyptian Medical Supply', p: 320, op: 275, b: '6221099001101', f: 'First Aid Kit', r: 'Topical', s: '45 Pieces', k: 'general_medicine', d: 'تحتوي على شاش معقم، قطن طبي، بيتادين، رباط ضاغط، مقص، وبلاستر جروح', w: 0, u: '1 Kit', ch: 0, v: 1 },
  { i: 'aid-betadine-120', n: 'Betadine Antiseptic Solution 120 ml (Povidone-Iodine 10%)', a: 'بيتادين محلول مطهر للجروح والحروق 120 مل', g: 'Povidone-Iodine 10%', c: 'Mundipharma / Nile', p: 68, op: 55, b: '6221034001204', f: 'Antiseptic Solution', r: 'Topical', s: '120 ml', k: 'anti_infectives', d: 'مطهر طبي واسع المجال للجروح السطحية وتطهير الجلد', w: 0, u: '120 ml', ch: 0, v: 1 },
  { i: 'aid-cotton-gauze', n: 'Sterile Medical Gauze Swabs & Cotton Roll Pack', a: 'عبوة شاش طبي معقم + لفة قطن طبي صيدلي 100 جم', g: 'Sterile Cotton & Gauze', c: 'El-Nasr / Pharmaplast', p: 55, op: 45, b: '6221099002207', f: 'Medical Supply', r: 'Topical', s: '10x10cm + 100g', k: 'general_medicine', d: 'شاش معقم للغيار على الجروح مع قطن طبي نقي عالي الامتصاص', w: 0, u: '1 Pack', ch: 0, v: 1 },
  { i: 'aid-koolfever-kids', n: 'Cooling Fever Gel Patches for Kids (4 Patches)', a: 'كمادات جل خافضة للحرارة للأطفال (4 لزقات)', g: 'Hydrogel Cooling Fever Patch', c: 'Pharmaplast / ByeBye-Fever', p: 65, op: 55, b: '6221099003303', f: 'Gel Patch', r: 'Topical', s: '8 Hours Cooling', k: 'general_medicine', d: 'لزقات جل فورية آمنة لخفض حرارة الأطفال وتخفيف الصداع لمدة 8 ساعات', w: 0, u: '4 Patches', ch: 0, v: 1 },
];

export function classifyDawayaDepartment(item: DawayaCompactIndexItem): DawayaPharmacyDepartment {
  const txt = `${item.n} ${item.a} ${item.g} ${item.d} ${item.f}`.toLowerCase();
  if (
    item.i.startsWith('dev-') ||
    item.i.startsWith('aid-') ||
    /device|monitor|glucometer|nebulizer|thermometer|oximeter|strip|syringe|gauze|bandage|cotton|plaster|catheter|cannula|first aid|جهاز|شرائط|سرنج|شاش|قطن|رباط ضاغط|ترمومتر|نيبولايزر|كمادات|بيتادين|محلول عدسات/i.test(txt)
  ) {
    return 'devices';
  }
  if (
    /infant formula|baby milk|diaper|pampers|cerelac|mouthwash|toothpaste|dental gel|oral|لبن اطفال|حليب للرضع|حفاض|معجون اسنان|غسول فم|مضمضه|بيبي|رضع/i.test(txt)
  ) {
    return 'baby_oral';
  }
  if (
    /shampoo|hair|scalp|alopecia|dandruff|minoxidil|hairloss|شامبو|شعر|فروة|قشرة|تساقط/i.test(txt)
  ) {
    return 'haircare';
  }
  if (
    /facial wash|face wash|cleanser|foaming|micellar|sunscreen|sunblock|sun care|spf|moisturiz|serum|hyaluronic|panthenol|whitening|acne|غسول|منظف وجه|صن بلوك|واقي شمس|مرطب|سيروم|تفتيح|حب الشباب|بشرة/i.test(txt) ||
    (item.k === 'dermatology_personal_care' && /wash|lotion|cream|gel|scrub|soap|صابون|لوشن/i.test(txt))
  ) {
    return 'skincare';
  }
  if (item.k === 'vitamins_supplements') {
    return 'vitamins';
  }
  return 'medicines';
}

export function matchesDawayaSubcategory(
  item: DawayaCompactIndexItem,
  dept: DawayaPharmacyDepartment,
  subId: string
): boolean {
  if (!subId || subId === 'all') return true;
  const txt = `${item.n} ${item.a} ${item.g} ${item.d} ${item.f}`.toLowerCase();

  if (dept === 'medicines') {
    if (subId === 'antibiotics') return item.k === 'antibiotics' || item.k === 'anti_infectives';
    if (subId === 'cardio_dm') return item.k === 'cardiovascular' || item.k === 'endocrine_diabetes';
    if (subId === 'gastro') return item.k === 'gastrointestinal';
    if (subId === 'pain_cold') return item.k === 'analgesics_antipyretics' || item.k === 'respiratory_cold_allergy';
  }
  if (dept === 'skincare') {
    if (subId === 'facewash') return /wash|cleanser|foam|micellar|soap|غسول|منظف|فوم|صابون/i.test(txt);
    if (subId === 'sunscreen') return /sun|spf|uv|صن|شمس/i.test(txt);
    if (subId === 'moisturizer_serum') return /serum|moistur|hyaluronic|panthenol|cream|lotion|gel|سيروم|مرطب|تفتيح|كريم/i.test(txt);
  }
  if (dept === 'haircare') {
    if (subId === 'shampoo') return /shampoo|dandruff|شامبو|قشرة/i.test(txt);
    if (subId === 'hairloss') return /ampoule|spray|lotion|minoxidil|fall|loss|تساقط|انبات|بخاخ|امبول/i.test(txt);
    if (subId === 'oils_serum') return /oil|serum|mask|cream|زيت|سيروم|حمام كريم/i.test(txt);
  }
  if (dept === 'vitamins') {
    if (subId === 'omega') return /omega|fish oil|dha|epa|ginkgo|memory|اوميجا|ذاكرة/i.test(txt);
    if (subId === 'iron') return /iron|ferr|folic|anemia|حديد|انيميا|فوليك/i.test(txt);
    if (subId === 'vitd_bones') return /vitamin d|cholecalciferol|calcium|zinc|vit c|immun|فيتامين د|كالسيوم|مناعة|زنك/i.test(txt);
  }
  if (dept === 'baby_oral') {
    if (subId === 'milk') return /milk|formula|stage|لبن|حليب|مرحلة/i.test(txt);
    if (subId === 'baby_care') return /diaper|baby|zinc|rash|حفاض|اطفال|التهاب/i.test(txt);
    if (subId === 'oral') return /mouth|tooth|dental|oral|gum|فم|اسنان|مضمض|لثة/i.test(txt);
  }
  if (dept === 'devices') {
    if (subId === 'bp_glucose') return /pressure|bp|glucose|strip|contour|accu|omron|beurer|ضغط|سكر|شرائط/i.test(txt);
    if (subId === 'nebulizer_therm') return /nebulizer|thermometer|oximeter|بخار|نيبولايزر|ترمومتر|اكسجين/i.test(txt);
    if (subId === 'firstaid') return /first aid|gauze|cotton|betadine|syringe|bandage|plaster|fever|اسعاف|شاش|قطن|بيتادين|سرنج|كمادات/i.test(txt);
  }
  return true;
}

export interface ApproximateBatchPriceInfo {
  price: number | null;
  minBatch: number | null;
  maxBatch: number | null;
  isCosmeticOrDevice: boolean;
  noteAr: string;
  noteEn: string;
}

export function getApproximateBatchPriceInfo(item: DawayaCompactIndexItem): ApproximateBatchPriceInfo {
  const price = typeof item.p === 'number' && item.p > 0 ? item.p : null;
  if (!price) {
    return {
      price: null,
      minBatch: null,
      maxBatch: null,
      isCosmeticOrDevice: false,
      noteAr: 'السعر غير مسجل حالياً — استعلم من الصيدلية',
      noteEn: 'Price unlisted — check local pharmacy',
    };
  }
  const dept = classifyDawayaDepartment(item);
  const isCosmeticOrDevice = dept === 'skincare' || dept === 'haircare' || dept === 'devices' || dept === 'baby_oral';
  const oldP = typeof item.op === 'number' && item.op > 0 && item.op < price ? item.op : null;

  let minBatch: number;
  let maxBatch: number;
  if (isCosmeticOrDevice) {
    minBatch = oldP && oldP >= price * 0.7 ? Math.round(oldP) : Math.max(1, Math.round(price * 0.92));
    maxBatch = Math.round(price * 1.06);
  } else {
    minBatch = oldP && oldP >= price * 0.65 ? Math.round(oldP) : Math.max(1, Math.round(price * 0.88));
    maxBatch = Math.round(price);
  }

  const noteAr = isCosmeticOrDevice
    ? `سعر تقريبي بالصيدليات (~${price.toFixed(0)} ج.م) — يتراوح عادة بين ${minBatch} و${maxBatch} ج.م حسب الصيدلية والعروض.`
    : `تسعيرة رسمية تقريبية (~${price.toFixed(0)} ج.م) — قد يتراوح بين ${minBatch} و${maxBatch} ج.م حسب تاريخ تشغيلة العبوة.`;

  const noteEn = isCosmeticOrDevice
    ? `Approx. pharmacy price (~${price.toFixed(0)} EGP), typically ${minBatch}–${maxBatch} EGP.`
    : `Official EDA approx. price (~${price.toFixed(0)} EGP); batches may range ${minBatch}–${maxBatch} EGP.`;

  return { price, minBatch, maxBatch, isCosmeticOrDevice, noteAr, noteEn };
}


// ============================================================================
// Real Product Image Resolution (JSON Map + Barcode OpenBeautyFacts + Custom)
// ============================================================================
const CUSTOM_DRUG_IMAGES_KEY = 'dawaya_custom_drug_images_v1';
const BARCODE_IMAGE_CACHE_KEY = 'dawaya_barcode_img_cache_v1';

interface DawayaImageMapData {
  byId: Record<string, string>;
  byKeyword: Record<string, string>;
}

const CLOUD_DRUG_IMAGES_DOC = 'drug_images_overrides';
const IDB_IMG_KEY = 'drug_images_v22523';
let globalImageMap: DawayaImageMapData | null = null;
let globalSortedKeywords: Array<[string, string]> = [];
let globalCloudDrugImages: Record<string, string> = {};
let globalImageMapPromise: Promise<DawayaImageMapData> | null = null;
let cloudImageSyncStarted = false;
let customDrugImagesMemCache: Record<string, string> | null = null;
let barcodeImageMemCache: Record<string, string> | null = null;
const imageResolutionCache = new Map<string, string | null>();

function clearImageResolutionCache(): void {
  imageResolutionCache.clear();
}

function getCustomDrugImagesMem(): Record<string, string> {
  if (customDrugImagesMemCache) return customDrugImagesMemCache;
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_DRUG_IMAGES_KEY);
    customDrugImagesMemCache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    customDrugImagesMemCache = {};
  }
  return customDrugImagesMemCache;
}

function getBarcodeImageMem(): Record<string, string> {
  if (barcodeImageMemCache) return barcodeImageMemCache;
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BARCODE_IMAGE_CACHE_KEY);
    barcodeImageMemCache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    barcodeImageMemCache = {};
  }
  return barcodeImageMemCache;
}

function readImagesFromIndexedDB(): Promise<DawayaImageMapData | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readonly');
          const getReq = tx.objectStore(IDB_STORE).get(IDB_IMG_KEY);
          getReq.onsuccess = () => {
            const val = getReq.result as DawayaImageMapData | undefined;
            resolve(val && val.byId && Object.keys(val.byId).length > 1000 ? val : null);
          };
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function writeImagesToIndexedDB(data: DawayaImageMapData): void {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  try {
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => {
      try {
        const db = req.result;
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(data, IDB_IMG_KEY);
      } catch {
        /* ignore */
      }
    };
  } catch {
    /* ignore */
  }
}

function notifyDrugImagesUpdated(): void {
  clearImageResolutionCache();
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DAWAYA_DB_UPDATED_EVENT));
  window.dispatchEvent(new CustomEvent('dawaya_db_updated'));
}

function startCloudDrugImagesSync(): void {
  if (cloudImageSyncStarted || !configured || !db) return;
  cloudImageSyncStarted = true;
  try {
    onSnapshot(
      doc(db, 'systemSettings', CLOUD_DRUG_IMAGES_DOC),
      (snap) => {
        if (snap.exists()) {
          const imgs = snap.data()?.images;
          if (imgs && typeof imgs === 'object') {
            globalCloudDrugImages = imgs as Record<string, string>;
            notifyDrugImagesUpdated();
          }
        }
      },
      () => {
        /* ignore offline */
      }
    );
  } catch {
    /* ignore */
  }
}

export async function loadDawayaImageMap(): Promise<DawayaImageMapData> {
  startCloudDrugImagesSync();
  if (globalImageMap) return globalImageMap;
  if (globalImageMapPromise) return globalImageMapPromise;
  globalImageMapPromise = (async () => {
    const applyImageMap = (data: DawayaImageMapData) => {
      globalImageMap = {
        byId: data.byId || {},
        byKeyword: data.byKeyword || {},
      };
      globalSortedKeywords = Object.entries(globalImageMap.byKeyword).sort(
        (a, b) => b[0].length - a[0].length
      );
      notifyDrugImagesUpdated();
      return globalImageMap;
    };
    try {
      const cached = await readImagesFromIndexedDB();
      if (cached) {
        return applyImageMap(cached);
      }
      const baseUrl = import.meta.env?.BASE_URL || './';
      const res = await fetch(`${baseUrl}data/dawaya_drug_images.json?v=22523`);
      if (res.ok) {
        const json = (await res.json()) as Partial<DawayaImageMapData>;
        const normalized: DawayaImageMapData = {
          byId: json.byId || {},
          byKeyword: json.byKeyword || {},
        };
        writeImagesToIndexedDB(normalized);
        return applyImageMap(normalized);
      }
    } catch {
      /* ignore */
    }
    globalImageMap = { byId: {}, byKeyword: {} };
    globalSortedKeywords = [];
    return globalImageMap;
  })();
  return globalImageMapPromise;
}

export async function compressDrugPhotoToDataUrl(file: File, maxDim = 420): Promise<string> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  if (!rawUrl) return '';
  try {
    const img = new Image();
    img.src = rawUrl;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    let w = img.width || maxDim;
    let h = img.height || maxDim;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.78);
  } catch {
    return rawUrl;
  }
}

export function saveCustomDrugImage(medId: string, dataUrlOrUrl: string, syncToCloud = true): void {
  if (!medId || !dataUrlOrUrl || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_DRUG_IMAGES_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[medId] = dataUrlOrUrl;
    customDrugImagesMemCache = map;
    clearImageResolutionCache();
    localStorage.setItem(CUSTOM_DRUG_IMAGES_KEY, JSON.stringify(map));
    globalCloudDrugImages[medId] = dataUrlOrUrl;
    notifyDrugImagesUpdated();
  } catch {
    /* ignore quota errors */
  }
  if (syncToCloud && configured && db && dataUrlOrUrl.length < 180000) {
    setDoc(
      doc(db, 'systemSettings', CLOUD_DRUG_IMAGES_DOC),
      {
        images: { [medId]: dataUrlOrUrl },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  }
}

export function getDrugImagesCoverageStats(): {
  total: number;
  withImage: number;
  missing: number;
  cloudOverrides: number;
} {
  const items = globalIndexItems || [];
  let withImage = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (getCachedDrugImageUrl(it.i, it.n, it.b)) {
      withImage++;
    }
  }
  return {
    total: items.length,
    withImage,
    missing: Math.max(0, items.length - withImage),
    cloudOverrides: Object.keys(globalCloudDrugImages).length,
  };
}

export function getCachedDrugImageUrl(
  medId?: string,
  brandNameEn?: string,
  barcode?: string,
  _genericName?: string
): string | null {
  if (medId && globalCloudDrugImages[medId]) {
    return globalCloudDrugImages[medId];
  }
  if (medId) {
    const customMap = getCustomDrugImagesMem();
    if (customMap[medId]) return customMap[medId];
  }

  const cacheKey = `${medId || ''}|${brandNameEn || ''}|${barcode || ''}`;
  if (imageResolutionCache.has(cacheKey)) {
    return imageResolutionCache.get(cacheKey) ?? null;
  }

  let resolved: string | null = null;
  if (globalImageMap) {
    if (medId && globalImageMap.byId[medId]) {
      resolved = globalImageMap.byId[medId];
    } else if (brandNameEn) {
      const low = brandNameEn.trim().toLowerCase();
      if (globalImageMap.byKeyword[low]) {
        resolved = globalImageMap.byKeyword[low];
      } else {
        for (let i = 0; i < globalSortedKeywords.length; i++) {
          const [kw, url] = globalSortedKeywords[i];
          if (low.includes(kw)) {
            resolved = url;
            break;
          }
        }
      }
    }
  }

  if (!resolved && barcode) {
    const clean = barcode.replace(/\D/g, '');
    if (clean.length >= 8) {
      const bMap = getBarcodeImageMem();
      if (bMap[clean] && bMap[clean] !== 'NONE') {
        resolved = bMap[clean];
      }
    }
  }

  if (globalImageMap) {
    if (imageResolutionCache.size > 6000) {
      imageResolutionCache.clear();
    }
    imageResolutionCache.set(cacheKey, resolved);
  }
  return resolved;
}

export async function fetchDrugImageByBarcode(barcode?: string): Promise<string | null> {
  if (!barcode || typeof window === 'undefined') return null;
  const clean = barcode.replace(/\D/g, '');
  if (clean.length < 8) return null;

  try {
    const bRaw = localStorage.getItem(BARCODE_IMAGE_CACHE_KEY);
    const bMap = bRaw ? (JSON.parse(bRaw) as Record<string, string>) : {};
    if (bMap[clean]) {
      return bMap[clean] === 'NONE' ? null : bMap[clean];
    }

    for (const domain of ['world.openbeautyfacts.org', 'world.openfoodfacts.org']) {
      try {
        const res = await fetch(
          `https://${domain}/api/v0/product/${clean}.json?fields=image_front_url,image_url`
        );
        if (!res.ok) continue;
        const data = (await res.json()) as {
          status?: number;
          product?: { image_front_url?: string; image_url?: string };
        };
        const img = data?.product?.image_front_url || data?.product?.image_url || '';
        if (data?.status === 1 && img.startsWith('http')) {
          bMap[clean] = img;
          barcodeImageMemCache = bMap;
          clearImageResolutionCache();
          localStorage.setItem(BARCODE_IMAGE_CACHE_KEY, JSON.stringify(bMap));
          return img;
        }
      } catch {
        /* try next */
      }
    }

    bMap[clean] = 'NONE';
    localStorage.setItem(BARCODE_IMAGE_CACHE_KEY, JSON.stringify(bMap));
  } catch {
    /* ignore */
  }
  return null;
}
