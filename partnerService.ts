import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, configured, storage } from './firebase';
import {
  AdminAuditLogRecord,
  AuditActionType,
  createDefaultDisplayCustomization,
  createDefaultVisibilitySettings,
  DEFAULT_PARTNER_CATEGORIES,
  PartnerBranchRecord,
  PartnerCategoryRecord,
  PartnerFullAdminRecord,
  PartnerMedicationMappingRecord,
  PartnerOrderRecord,
  PartnerOrderStatus,
  PartnerPrivateAdminRecord,
  PartnerPublicRecord,
  PartnerVisibilitySettings,
  PlacementLocationId,
} from './partnerTypes';

// ============================================================================
// COLLECTION NAMES & CACHE KEYS
// ============================================================================
export const COL_PARTNERS = 'partners';
export const COL_PARTNER_PRIVATE = 'partnerPrivateAdmin';
export const COL_PARTNER_CATEGORIES = 'partnerCategories';
export const COL_PARTNER_BRANCHES = 'partnerBranches';
export const COL_PARTNER_MAPPINGS = 'partnerMedicationMappings';
export const COL_PARTNER_ORDERS = 'partnerOrders';
export const COL_ADMIN_AUDIT_LOGS = 'adminAuditLogs';

const CACHE_PARTNERS_KEY = 'aa_partners_public_v1';
const CACHE_PRIVATE_KEY = 'aa_partners_private_v1';
const CACHE_CATEGORIES_KEY = 'aa_partner_categories_v1';
const CACHE_BRANCHES_KEY = 'aa_partner_branches_v1';
const CACHE_MAPPINGS_KEY = 'aa_partner_mappings_v1';
const CACHE_ORDERS_KEY = 'aa_partner_orders_v1';
const CACHE_AUDIT_KEY = 'aa_partner_audit_logs_v1';
const PARTNER_SYNC_EVENT = 'aa-partner-ecosystem-updated';

// ============================================================================
// IN-MEMORY REACTIVE STORE WITH LOCALSTORAGE FALLBACK
// ============================================================================
let memPartners: PartnerPublicRecord[] = [];
let memPrivateMap: Record<string, PartnerPrivateAdminRecord> = {};
let memCategories: PartnerCategoryRecord[] = [...DEFAULT_PARTNER_CATEGORIES];
let memBranches: PartnerBranchRecord[] = [];
let memMappings: PartnerMedicationMappingRecord[] = [];
let memOrders: PartnerOrderRecord[] = [];
let memAuditLogs: AdminAuditLogRecord[] = [];
let listenersInitialized = false;
let storeVersion = 1;

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore quota errors */
  }
}

function emitPartnerUpdate(): void {
  storeVersion += 1;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PARTNER_SYNC_EVENT, { detail: storeVersion }));
  }
}

// Hydrate from localStorage on module load
if (typeof window !== 'undefined') {
  memPartners = safeReadJson<PartnerPublicRecord[]>(CACHE_PARTNERS_KEY, []);
  memPrivateMap = safeReadJson<Record<string, PartnerPrivateAdminRecord>>(CACHE_PRIVATE_KEY, {});
  const cachedCats = safeReadJson<PartnerCategoryRecord[]>(CACHE_CATEGORIES_KEY, []);
  if (Array.isArray(cachedCats) && cachedCats.length > 0) {
    // Merge default categories with any custom or modified categories
    const catMap = new Map<string, PartnerCategoryRecord>();
    DEFAULT_PARTNER_CATEGORIES.forEach((c) => catMap.set(c.id, c));
    cachedCats.forEach((c) => {
      if (c && c.id) catMap.set(c.id, c);
    });
    memCategories = Array.from(catMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  } else {
    memCategories = [...DEFAULT_PARTNER_CATEGORIES];
  }
  memBranches = safeReadJson<PartnerBranchRecord[]>(CACHE_BRANCHES_KEY, []);
  memMappings = safeReadJson<PartnerMedicationMappingRecord[]>(CACHE_MAPPINGS_KEY, []);
  memOrders = safeReadJson<PartnerOrderRecord[]>(CACHE_ORDERS_KEY, []);
  memAuditLogs = safeReadJson<AdminAuditLogRecord[]>(CACHE_AUDIT_KEY, []);
}

/**
 * Start real-time Firestore listeners for public collections so any change made by the
 * website owner on their Android phone reflects on the public website immediately
 * without rebuilding or redeploying.
 */
export function startPartnerEcosystemSync(): void {
  if (listenersInitialized || typeof window === 'undefined' || !configured || !db) return;
  listenersInitialized = true;

  // 1. Partners collection listener
  try {
    onSnapshot(
      collection(db, COL_PARTNERS),
      (snap) => {
        const list: PartnerPublicRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as PartnerPublicRecord;
          if (data && d.id) {
            list.push(sanitizePublicPartner({ ...data, id: d.id }));
          }
        });
        memPartners = list;
        safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
        emitPartnerUpdate();
      },
      () => {
        /* fallback to cached data if offline or restricted */
      }
    );
  } catch {
    /* ignore */
  }

  // 2. Categories collection listener
  try {
    onSnapshot(
      collection(db, COL_PARTNER_CATEGORIES),
      (snap) => {
        const catMap = new Map<string, PartnerCategoryRecord>();
        DEFAULT_PARTNER_CATEGORIES.forEach((c) => catMap.set(c.id, c));
        snap.forEach((d) => {
          const data = d.data() as PartnerCategoryRecord;
          if (data && d.id) {
            catMap.set(d.id, { ...data, id: d.id });
          }
        });
        memCategories = Array.from(catMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
        safeWriteJson(CACHE_CATEGORIES_KEY, memCategories);
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }

  // 3. Branches collection listener
  try {
    onSnapshot(
      collection(db, COL_PARTNER_BRANCHES),
      (snap) => {
        const list: PartnerBranchRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as PartnerBranchRecord;
          if (data && d.id) {
            list.push({ ...data, id: d.id });
          }
        });
        memBranches = list;
        safeWriteJson(CACHE_BRANCHES_KEY, memBranches);
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }

  // 4. Medication Mappings listener
  try {
    onSnapshot(
      collection(db, COL_PARTNER_MAPPINGS),
      (snap) => {
        const list: PartnerMedicationMappingRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as PartnerMedicationMappingRecord;
          if (data && d.id) {
            list.push({ ...data, id: d.id });
          }
        });
        memMappings = list;
        safeWriteJson(CACHE_MAPPINGS_KEY, memMappings);
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }
}

export function sanitizePublicPartner(raw: PartnerPublicRecord): PartnerPublicRecord {
  const id = raw.id || `partner_${Date.now()}`;
  const defaultVis = createDefaultVisibilitySettings(id);
  const defaultDisp = createDefaultDisplayCustomization();
  return {
    ...raw,
    id,
    name: raw.name || raw.nameAr || raw.nameEn || id,
    nameAr: raw.nameAr || raw.name || raw.nameEn || '',
    nameEn: raw.nameEn || raw.name || raw.nameAr || '',
    servicesOfferedAr: Array.isArray(raw.servicesOfferedAr) ? raw.servicesOfferedAr : [],
    servicesOfferedEn: Array.isArray(raw.servicesOfferedEn) ? raw.servicesOfferedEn : [],
    supportedGovernorates: Array.isArray(raw.supportedGovernorates) ? raw.supportedGovernorates : [],
    supportedCities: Array.isArray(raw.supportedCities) ? raw.supportedCities : [],
    supportedDistricts: Array.isArray(raw.supportedDistricts) ? raw.supportedDistricts : [],
    visibility: {
      ...defaultVis,
      ...(raw.visibility || {}),
      partnerId: id,
      allowedPlacements: Array.isArray(raw.visibility?.allowedPlacements)
        ? raw.visibility.allowedPlacements
        : [],
      allowedGovernorates: Array.isArray(raw.visibility?.allowedGovernorates)
        ? raw.visibility.allowedGovernorates
        : [],
      allowedCities: Array.isArray(raw.visibility?.allowedCities)
        ? raw.visibility.allowedCities
        : [],
      allowedDistricts: Array.isArray(raw.visibility?.allowedDistricts)
        ? raw.visibility.allowedDistricts
        : [],
      selectedBranchIdsOnly: Array.isArray(raw.visibility?.selectedBranchIdsOnly)
        ? raw.visibility.selectedBranchIdsOnly
        : [],
    },
    display: {
      ...defaultDisp,
      ...(raw.display || {}),
    },
  };
}

// ============================================================================
// OWNER-CONTROLLED VISIBILITY & GEOGRAPHIC EVALUATION ENGINE
// ============================================================================
export interface PublicVisibilityContext {
  placement?: PlacementLocationId;
  governorateId?: string;
  city?: string;
  district?: string;
  nowIso?: string;
  onlyPharmacies?: boolean;
}

/**
 * Evaluates whether a partner is currently eligible to appear on the public website
 * given the owner's visibility toggles, publication status, schedule windows, and
 * geographic coverage rules.
 *
 * CRITICAL GUARANTEE:
 * A partner serving Cairo will NEVER automatically appear as available in Tanta
 * unless its geographic coverage or branches explicitly support that area.
 */
export function isPartnerVisiblePublicly(
  partner: PartnerPublicRecord,
  ctx: PublicVisibilityContext = {},
  partnerBranches: PartnerBranchRecord[] = memBranches
): boolean {
  // 1. Check partnership & publication status
  if (partner.partnershipStatus !== 'active') return false;
  if (partner.publicationStatus !== 'published' && partner.publicationStatus !== 'scheduled') {
    return false;
  }
  if (partner.visibilityStatus === 'hidden' || partner.visibilityStatus === 'temporarily_suspended') {
    return false;
  }

  const vis = partner.visibility;
  if (!vis) return false;

  // 2. Check master switches
  if (!vis.showOnWebsite) return false;
  if (vis.temporarilySuspended) return false;

  // 3. Check scheduled publication & deactivation windows
  const now = ctx.nowIso ? new Date(ctx.nowIso).getTime() : Date.now();
  if (vis.scheduledPublishAtIso) {
    const pubTime = new Date(vis.scheduledPublishAtIso).getTime();
    if (!Number.isNaN(pubTime) && now < pubTime) return false;
  }
  if (vis.scheduledDeactivateAtIso) {
    const deactTime = new Date(vis.scheduledDeactivateAtIso).getTime();
    if (!Number.isNaN(deactTime) && now >= deactTime) return false;
  }

  // 4. Check specific placement location switches
  if (ctx.placement) {
    switch (ctx.placement) {
      case 'homepage_featured':
        if (!vis.showOnHomepage) return false;
        break;
      case 'partner_directory':
      case 'pharmacy_directory':
        if (!vis.showInPartnerDirectory) return false;
        break;
      case 'medication_search_results':
        if (!vis.showInMedicationSearch) return false;
        break;
      case 'medication_detail_page':
      case 'medication_purchase_suggestions':
        if (!vis.showInMedicationDetails) return false;
        break;
      case 'nearby_pharmacy_results':
        if (!vis.showInNearbyPharmacies) return false;
        break;
      case 'dedicated_partner_page':
        if (!vis.publishPartnerProfile) return false;
        break;
      case 'healthcare_service_pages':
        if (!vis.showInRelevantServiceSections) return false;
        break;
    }

    // Also if the owner configured explicit allowedPlacements, enforce it when non-empty
    if (vis.allowedPlacements.length > 0 && !vis.allowedPlacements.includes(ctx.placement)) {
      return false;
    }
  }

  // 5. Check Geographic Visibility (Strict governorate/city/district/branch matching)
  if (ctx.governorateId && ctx.governorateId !== 'all') {
    const targetGov = ctx.governorateId.toLowerCase().trim();
    const activeBranchesForPartner = partnerBranches.filter(
      (b) => b.partnerId === partner.id && b.published && b.branchStatus === 'active'
    );

    if (vis.geographicScope === 'selected_branches_only') {
      const allowedBranchIds = new Set(vis.selectedBranchIdsOnly);
      const matchingBranches = activeBranchesForPartner.filter(
        (b) =>
          (allowedBranchIds.size === 0 || allowedBranchIds.has(b.id)) &&
          (b.governorateId.toLowerCase() === targetGov ||
            b.serviceGovernorates.some((g) => g.toLowerCase() === targetGov))
      );
      if (matchingBranches.length === 0) return false;
    } else if (vis.geographicScope === 'specific_governorates') {
      const govPool =
        vis.allowedGovernorates.length > 0
          ? vis.allowedGovernorates
          : partner.supportedGovernorates;
      const matchesGov = govPool.some((g) => g.toLowerCase() === targetGov);
      const hasBranchInGov = activeBranchesForPartner.some(
        (b) =>
          b.governorateId.toLowerCase() === targetGov ||
          b.serviceGovernorates.some((g) => g.toLowerCase() === targetGov)
      );
      if (!matchesGov && !hasBranchInGov) return false;
    } else if (vis.geographicScope === 'specific_cities' && ctx.city && ctx.city !== 'all') {
      const targetCity = ctx.city.toLowerCase().trim();
      const cityPool =
        vis.allowedCities.length > 0 ? vis.allowedCities : partner.supportedCities;
      const matchesCity = cityPool.some((c) => c.toLowerCase().includes(targetCity));
      const hasBranchInCity = activeBranchesForPartner.some(
        (b) =>
          b.city.toLowerCase().includes(targetCity) ||
          b.serviceCities.some((c) => c.toLowerCase().includes(targetCity))
      );
      if (!matchesCity && !hasBranchInCity) return false;
    } else if (vis.geographicScope === 'all_egypt') {
      // Even when scope is 'all_egypt', if the partner explicitly listed supportedGovernorates
      // and did NOT include 'all_egypt', verify coverage so a Cairo-only pharmacy doesn't appear in Tanta
      if (
        partner.supportedGovernorates.length > 0 &&
        !partner.supportedGovernorates.includes('all_egypt')
      ) {
        const supportsGov = partner.supportedGovernorates.some(
          (g) => g.toLowerCase() === targetGov
        );
        const hasBranchInGov = activeBranchesForPartner.some(
          (b) =>
            b.governorateId.toLowerCase() === targetGov ||
            b.serviceGovernorates.some((g) => g.toLowerCase() === targetGov)
        );
        if (!supportsGov && !hasBranchInGov) return false;
      }
    }
  }

  if (ctx.city && ctx.city !== 'all') {
    const targetCity = ctx.city.toLowerCase().trim();
    const activeBranchesForPartner = partnerBranches.filter(
      (b) => b.partnerId === partner.id && b.published && b.branchStatus === 'active'
    );
    const cityPool = [
      ...(partner.supportedCities || []),
      ...(vis.allowedCities || []),
      ...activeBranchesForPartner.map((b) => b.city),
      ...activeBranchesForPartner.flatMap((b) => b.serviceCities || []),
    ].filter(Boolean);

    // If specific cities are configured for this partner/branches, check city match
    if (cityPool.length > 0) {
      const cityMatches = cityPool.some((c) => c.toLowerCase().includes(targetCity));
      if (!cityMatches && vis.geographicScope === 'specific_cities') return false;
    }
  }

  return true;
}

/**
 * Sorts public partners according to owner-configured priority for the given context.
 */
export function sortPublicPartners(
  partners: PartnerPublicRecord[],
  placement?: PlacementLocationId
): PartnerPublicRecord[] {
  return [...partners].sort((a, b) => {
    const visA = a.visibility;
    const visB = b.visibility;

    // Featured placement first
    if (visA.featuredPlacement !== visB.featuredPlacement) {
      return visA.featuredPlacement ? -1 : 1;
    }

    if (placement === 'homepage_featured') {
      if (visA.homepagePriority !== visB.homepagePriority) {
        return visA.homepagePriority - visB.homepagePriority;
      }
    }

    if (
      placement === 'medication_search_results' ||
      placement === 'medication_detail_page'
    ) {
      if (visA.searchResultPriority !== visB.searchResultPriority) {
        return visA.searchResultPriority - visB.searchResultPriority;
      }
    }

    if (visA.displayOrder !== visB.displayOrder) {
      return visA.displayOrder - visB.displayOrder;
    }

    return a.nameAr.localeCompare(b.nameAr, 'ar');
  });
}

// ============================================================================
// AUDIT LOGGING SERVICE
// ============================================================================
export async function recordAdminAuditLog(params: {
  action: AuditActionType;
  partnerId: string;
  partnerName: string;
  adminUid: string;
  adminRole: string;
  summaryAr: string;
  summaryEn: string;
  changeDetails?: Record<string, unknown>;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const entry: AdminAuditLogRecord = {
    id,
    action: params.action,
    partnerId: params.partnerId,
    partnerName: params.partnerName,
    adminUid: params.adminUid || 'admin',
    adminRole: params.adminRole || 'admin',
    timestampIso: nowIso,
    summaryAr: params.summaryAr,
    summaryEn: params.summaryEn,
    changeDetails: params.changeDetails || {},
  };

  memAuditLogs = [entry, ...memAuditLogs].slice(0, 500);
  safeWriteJson(CACHE_AUDIT_KEY, memAuditLogs);
  emitPartnerUpdate();

  if (configured && db) {
    try {
      await setDoc(doc(db, COL_ADMIN_AUDIT_LOGS, id), entry);
    } catch {
      /* keep local log if offline */
    }
  }
}

export async function fetchAdminAuditLogs(): Promise<AdminAuditLogRecord[]> {
  if (configured && db) {
    try {
      const snap = await getDocs(collection(db, COL_ADMIN_AUDIT_LOGS));
      const list: AdminAuditLogRecord[] = [];
      snap.forEach((d) => {
        const data = d.data() as AdminAuditLogRecord;
        if (data) list.push({ ...data, id: d.id });
      });
      if (list.length > 0) {
        memAuditLogs = list.sort((a, b) => b.timestampIso.localeCompare(a.timestampIso));
        safeWriteJson(CACHE_AUDIT_KEY, memAuditLogs);
      }
    } catch {
      /* fallback to memAuditLogs */
    }
  }
  return memAuditLogs;
}

// ============================================================================
// ADMIN CRUD OPERATIONS FOR PARTNERS (PUBLIC + PRIVATE SEPARATION)
// ============================================================================
export async function fetchAllPartnersForAdmin(): Promise<PartnerFullAdminRecord[]> {
  if (configured && db) {
    try {
      const [pubSnap, privSnap, ordSnap] = await Promise.all([
        getDocs(collection(db, COL_PARTNERS)),
        getDocs(collection(db, COL_PARTNER_PRIVATE)).catch(() => null),
        getDocs(collection(db, COL_PARTNER_ORDERS)).catch(() => null),
      ]);

      const pubList: PartnerPublicRecord[] = [];
      pubSnap.forEach((d) => {
        const data = d.data() as PartnerPublicRecord;
        if (data) pubList.push(sanitizePublicPartner({ ...data, id: d.id }));
      });

      if (privSnap) {
        privSnap.forEach((d) => {
          const pData = d.data() as PartnerPrivateAdminRecord;
          if (pData) memPrivateMap[d.id] = { ...pData, partnerId: d.id };
        });
        safeWriteJson(CACHE_PRIVATE_KEY, memPrivateMap);
      }

      if (ordSnap) {
        const ordList: PartnerOrderRecord[] = [];
        ordSnap.forEach((d) => {
          const oData = d.data() as PartnerOrderRecord;
          if (oData) ordList.push({ ...oData, id: d.id });
        });
        if (ordList.length > 0) {
          memOrders = ordList.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
          safeWriteJson(CACHE_ORDERS_KEY, memOrders);
          emitPartnerUpdate();
        }
      }

      if (pubList.length > 0 || memPartners.length === 0) {
        memPartners = pubList;
        safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
      }
    } catch {
      /* fallback to memory/localStorage */
    }
  }

  return memPartners.map((pub) => ({
    ...pub,
    privateAdmin: memPrivateMap[pub.id] || {
      partnerId: pub.id,
      contactPersonName: '',
      contactPersonRole: '',
      administrativePhone: '',
      administrativeEmail: '',
      partnershipStartDateIso: pub.createdAtIso.slice(0, 10),
      partnershipExpirationDateIso: null,
      contractReference: '',
      internalNotes: '',
      integrationNotes: '',
      providerAdapterId: 'universal_dynamic_adapter',
      webhookEndpointUrl: '',
      serverCredentialVaultRef: '',
      createdBy: 'admin',
      updatedBy: 'admin',
      updatedAtIso: pub.updatedAtIso,
    },
  }));
}

export async function savePartnerFullRecord(
  record: PartnerFullAdminRecord,
  adminUid: string,
  adminRole: string,
  isNew = false
): Promise<PartnerFullAdminRecord> {
  const nowIso = new Date().toISOString();
  const { privateAdmin, ...publicPart } = record;

  // Enforce strict rule: Never falsely display verification badge if not verified
  const cleanPublic: PartnerPublicRecord = sanitizePublicPartner({
    ...publicPart,
    name: publicPart.nameAr.trim() || publicPart.nameEn.trim() || publicPart.name.trim(),
    nameAr: publicPart.nameAr.trim() || publicPart.nameEn.trim(),
    nameEn: publicPart.nameEn.trim() || publicPart.nameAr.trim(),
    updatedAtIso: nowIso,
    visibility: {
      ...publicPart.visibility,
      partnerId: publicPart.id,
      updatedAtIso: nowIso,
      updatedBy: adminUid,
    },
  });

  const cleanPrivate: PartnerPrivateAdminRecord = {
    ...privateAdmin,
    partnerId: cleanPublic.id,
    updatedBy: adminUid,
    updatedAtIso: nowIso,
  };

  // Update in-memory & localStorage immediately
  const existingIdx = memPartners.findIndex((p) => p.id === cleanPublic.id);
  if (existingIdx >= 0) {
    memPartners[existingIdx] = cleanPublic;
  } else {
    memPartners = [cleanPublic, ...memPartners];
  }
  memPrivateMap[cleanPublic.id] = cleanPrivate;
  safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
  safeWriteJson(CACHE_PRIVATE_KEY, memPrivateMap);
  emitPartnerUpdate();

  // Save to Firestore (Public data in `partners/{id}`, sensitive admin notes in `partnerPrivateAdmin/{id}`)
  if (configured && db) {
    await Promise.all([
      setDoc(doc(db, COL_PARTNERS, cleanPublic.id), cleanPublic),
      setDoc(doc(db, COL_PARTNER_PRIVATE, cleanPublic.id), cleanPrivate),
    ]);
  }

  await recordAdminAuditLog({
    action: isNew ? 'partner_added' : 'partner_edited',
    partnerId: cleanPublic.id,
    partnerName: cleanPublic.nameAr || cleanPublic.nameEn,
    adminUid,
    adminRole,
    summaryAr: isNew
      ? `تمت إضافة شريك جديد (${cleanPublic.nameAr}) بحالة: ${cleanPublic.publicationStatus}`
      : `تم تحديث بيانات الشريك (${cleanPublic.nameAr})`,
    summaryEn: isNew
      ? `Added new partner (${cleanPublic.nameEn}) with status: ${cleanPublic.publicationStatus}`
      : `Updated partner profile (${cleanPublic.nameEn})`,
    changeDetails: {
      partnershipStatus: cleanPublic.partnershipStatus,
      publicationStatus: cleanPublic.publicationStatus,
      verificationStatus: cleanPublic.verificationStatus,
      showOnWebsite: cleanPublic.visibility.showOnWebsite,
    },
  });

  return { ...cleanPublic, privateAdmin: cleanPrivate };
}

/**
 * Quick status/visibility mutation from the Admin Dashboard table/cards
 */
export async function updatePartnerQuickState(
  partnerId: string,
  patch: Partial<PartnerPublicRecord> & { visibilityPatch?: Partial<PartnerVisibilitySettings> },
  adminUid: string,
  adminRole: string,
  auditAction: AuditActionType,
  summaryAr: string,
  summaryEn: string
): Promise<void> {
  const existing = memPartners.find((p) => p.id === partnerId);
  if (!existing) return;

  const nowIso = new Date().toISOString();
  const { visibilityPatch, ...restPatch } = patch;

  const updated: PartnerPublicRecord = sanitizePublicPartner({
    ...existing,
    ...restPatch,
    updatedAtIso: nowIso,
    visibility: {
      ...existing.visibility,
      ...(visibilityPatch || {}),
      updatedAtIso: nowIso,
      updatedBy: adminUid,
    },
  });

  memPartners = memPartners.map((p) => (p.id === partnerId ? updated : p));
  safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNERS, partnerId), updated);
  }

  await recordAdminAuditLog({
    action: auditAction,
    partnerId,
    partnerName: updated.nameAr || updated.nameEn,
    adminUid,
    adminRole,
    summaryAr,
    summaryEn,
    changeDetails: { ...restPatch, ...(visibilityPatch || {}) },
  });
}

// ============================================================================
// FIREBASE STORAGE IMAGE UPLOAD (NEVER STORES BINARIES IN FIRESTORE)
// ============================================================================
export async function uploadPartnerAssetToStorage(
  file: File,
  partnerId: string,
  assetType: 'logo' | 'cover' | 'prescription'
): Promise<string> {
  if (!configured || !storage) {
    throw new Error('STORAGE_NOT_CONFIGURED');
  }
  const safeExt = (file.name.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const storagePath = `partner_assets/${partnerId}/${assetType}_${Date.now()}.${safeExt}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/png' });
  try {
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch {
    return `storage://${storagePath}`;
  }
}

// ============================================================================
// DYNAMIC PARTNER CATEGORIES MANAGEMENT
// ============================================================================
export async function savePartnerCategory(
  category: PartnerCategoryRecord,
  adminUid: string,
  adminRole: string,
  isNew = false
): Promise<PartnerCategoryRecord> {
  const nowIso = new Date().toISOString();
  const clean: PartnerCategoryRecord = {
    ...category,
    updatedAtIso: nowIso,
    updatedBy: adminUid,
  };

  const idx = memCategories.findIndex((c) => c.id === clean.id);
  if (idx >= 0) {
    memCategories[idx] = clean;
  } else {
    memCategories.push(clean);
  }
  memCategories = [...memCategories].sort((a, b) => a.displayOrder - b.displayOrder);
  safeWriteJson(CACHE_CATEGORIES_KEY, memCategories);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNER_CATEGORIES, clean.id), clean);
  }

  await recordAdminAuditLog({
    action: isNew ? 'category_added' : 'category_edited',
    partnerId: clean.id,
    partnerName: clean.nameAr || clean.nameEn,
    adminUid,
    adminRole,
    summaryAr: isNew
      ? `تم إنشاء فئة شركاء جديدة: ${clean.nameAr}`
      : `تم تعديل فئة الشركاء: ${clean.nameAr}`,
    summaryEn: isNew
      ? `Created partner category: ${clean.nameEn}`
      : `Updated partner category: ${clean.nameEn}`,
  });

  return clean;
}

// ============================================================================
// PARTNER BRANCHES MANAGEMENT
// ============================================================================
export async function savePartnerBranch(
  branch: PartnerBranchRecord,
  adminUid: string,
  adminRole: string,
  isNew = false
): Promise<PartnerBranchRecord> {
  const nowIso = new Date().toISOString();
  const clean: PartnerBranchRecord = {
    ...branch,
    updatedAtIso: nowIso,
    updatedBy: adminUid,
  };

  const idx = memBranches.findIndex((b) => b.id === clean.id);
  if (idx >= 0) {
    memBranches[idx] = clean;
  } else {
    memBranches = [clean, ...memBranches];
  }
  safeWriteJson(CACHE_BRANCHES_KEY, memBranches);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNER_BRANCHES, clean.id), clean);
  }

  await recordAdminAuditLog({
    action: isNew ? 'branch_added' : 'branch_edited',
    partnerId: clean.partnerId,
    partnerName: clean.nameAr || clean.nameEn,
    adminUid,
    adminRole,
    summaryAr: isNew
      ? `تمت إضافة فرع جديد (${clean.nameAr}) في محافظة ${clean.governorateId}`
      : `تم تحديث بيانات الفرع (${clean.nameAr})`,
    summaryEn: isNew
      ? `Added new branch (${clean.nameEn}) in ${clean.governorateId}`
      : `Updated branch (${clean.nameEn})`,
  });

  return clean;
}

export async function deletePartnerBranch(
  branchId: string,
  partnerId: string,
  branchName: string,
  adminUid: string,
  adminRole: string
): Promise<void> {
  memBranches = memBranches.filter((b) => b.id !== branchId);
  safeWriteJson(CACHE_BRANCHES_KEY, memBranches);
  emitPartnerUpdate();

  if (configured && db) {
    await deleteDoc(doc(db, COL_PARTNER_BRANCHES, branchId));
  }

  await recordAdminAuditLog({
    action: 'branch_deleted',
    partnerId,
    partnerName: branchName,
    adminUid,
    adminRole,
    summaryAr: `تم حذف الفرع (${branchName})`,
    summaryEn: `Deleted branch (${branchName})`,
  });
}

// ============================================================================
// PARTNER-TO-MEDICATION MAPPING MANAGEMENT
// ============================================================================
export async function savePartnerMedicationMapping(
  mapping: PartnerMedicationMappingRecord,
  adminUid: string,
  adminRole: string
): Promise<PartnerMedicationMappingRecord> {
  const nowIso = new Date().toISOString();
  const clean: PartnerMedicationMappingRecord = {
    ...mapping,
    updatedAtIso: nowIso,
    updatedBy: adminUid,
  };

  const idx = memMappings.findIndex((m) => m.id === clean.id);
  if (idx >= 0) {
    memMappings[idx] = clean;
  } else {
    memMappings = [clean, ...memMappings];
  }
  safeWriteJson(CACHE_MAPPINGS_KEY, memMappings);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNER_MAPPINGS, clean.id), clean);
  }

  await recordAdminAuditLog({
    action: 'medication_mapping_saved',
    partnerId: clean.partnerId,
    partnerName: `${clean.tradeNameAr} (${clean.strength})`,
    adminUid,
    adminRole,
    summaryAr: `تم ربط الدواء (${clean.tradeNameAr} ${clean.strength}) بالشريك بحالة توفر: ${clean.stockStatus}`,
    summaryEn: `Mapped medication (${clean.tradeNameEn} ${clean.strength}) to partner with status: ${clean.stockStatus}`,
  });

  return clean;
}

export async function deletePartnerMedicationMapping(
  mappingId: string,
  partnerId: string,
  medName: string,
  adminUid: string,
  adminRole: string
): Promise<void> {
  memMappings = memMappings.filter((m) => m.id !== mappingId);
  safeWriteJson(CACHE_MAPPINGS_KEY, memMappings);
  emitPartnerUpdate();

  if (configured && db) {
    await deleteDoc(doc(db, COL_PARTNER_MAPPINGS, mappingId));
  }

  await recordAdminAuditLog({
    action: 'medication_mapping_deleted',
    partnerId,
    partnerName: medName,
    adminUid,
    adminRole,
    summaryAr: `تم إلغاء ربط الدواء (${medName})`,
    summaryEn: `Removed medication mapping (${medName})`,
  });
}

// ============================================================================
// ORDER SUBMISSION & TRACKING SERVICE
// ============================================================================
export async function createPartnerOrder(
  orderDraft: Omit<PartnerOrderRecord, 'id' | 'orderNumber' | 'createdAtIso' | 'updatedAtIso' | 'statusHistory'>
): Promise<PartnerOrderRecord> {
  const nowIso = new Date().toISOString();
  const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const orderNumber = `AA-RX-${Date.now().toString().slice(-6)}`;

  const fullOrder: PartnerOrderRecord = {
    ...orderDraft,
    id,
    orderNumber,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    statusHistory: [
      {
        status: orderDraft.status,
        timestampIso: nowIso,
        noteAr: orderDraft.externalRedirectUsed
          ? 'تم توجيه الطلب إلى صفحة الطلب المعتمدة الخاصة بالصيدلية'
          : 'تم إرسال طلب الصرف المبدئي وبانتظار مراجعة الصيدلي للوصفة الطبية',
        noteEn: orderDraft.externalRedirectUsed
          ? 'Redirected to the pharmacy’s authorized external checkout page'
          : 'Submitted for licensed pharmacist prescription review',
        updatedBy: orderDraft.userId || 'patient',
      },
    ],
  };

  memOrders = [fullOrder, ...memOrders];
  safeWriteJson(CACHE_ORDERS_KEY, memOrders);
  emitPartnerUpdate();

  if (configured && db) {
    try {
      await setDoc(doc(db, COL_PARTNER_ORDERS, id), fullOrder);
    } catch {
      /* keep in local storage if guest/offline */
    }
  }

  return fullOrder;
}

// ============================================================================
// SECTION 4 FIX: EXPLICIT ORDER STATE MACHINE VALIDATION
// ============================================================================
const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  new_order: ['pharmacy_confirmation', 'confirmed_available', 'rejected', 'cancelled'],
  pending_review: ['pharmacy_confirmation', 'confirmed_available', 'rejected', 'cancelled'],
  pending_pharmacy_review: ['pharmacy_confirmation', 'confirmed_available', 'rejected', 'cancelled'],
  pharmacy_confirmation: ['preparing', 'cancelled', 'rejected'],
  confirmed_available: ['preparing', 'cancelled', 'rejected'],
  preparing: ['ready_for_delivery', 'ready_for_pickup_or_delivery', 'out_for_delivery', 'cancelled'],
  ready_for_delivery: ['out_for_delivery', 'delivered', 'completed'],
  ready_for_pickup_or_delivery: ['out_for_delivery', 'delivered', 'completed'],
  out_for_delivery: ['delivered', 'completed'],
  delivered: [],
  completed: [],
  cancelled: [],
  rejected: [],
};

export function isValidOrderStateTransition(
  fromStatus: string,
  toStatus: string,
  actorRole = 'pharmacist'
): boolean {
  if (!fromStatus || !toStatus || fromStatus === toStatus) return false;
  if (actorRole === 'customer' || actorRole === 'user' || actorRole === 'patient') {
    return (
      ['new_order', 'pending_review', 'pending_pharmacy_review'].includes(fromStatus) &&
      toStatus === 'cancelled'
    );
  }
  const allowedNext = ALLOWED_ORDER_TRANSITIONS[fromStatus] || [];
  return allowedNext.includes(toStatus);
}

export async function updatePartnerOrderStatus(
  orderId: string,
  newStatus: PartnerOrderStatus,
  noteAr: string,
  noteEn: string,
  adminUid: string,
  adminRole: string
): Promise<void> {
  const idx = memOrders.findIndex((o) => o.id === orderId);
  if (idx < 0) throw new Error('ORDER_NOT_FOUND');

  const current = memOrders[idx];
  if (!isValidOrderStateTransition(current.status, newStatus, adminRole)) {
    throw new Error(`INVALID_ORDER_STATE_TRANSITION: Cannot transition from ${current.status} to ${newStatus}`);
  }

  const nowIso = new Date().toISOString();
  const updated: PartnerOrderRecord = {
    ...current,
    status: newStatus,
    updatedAtIso: nowIso,
    statusHistory: [
      ...current.statusHistory,
      {
        status: newStatus,
        timestampIso: nowIso,
        noteAr,
        noteEn,
        updatedBy: adminUid,
      },
    ],
  };

  memOrders[idx] = updated;
  safeWriteJson(CACHE_ORDERS_KEY, memOrders);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNER_ORDERS, orderId), updated);
  }

  await recordAdminAuditLog({
    action: 'order_status_updated',
    partnerId: updated.partnerId,
    partnerName: updated.orderNumber,
    adminUid,
    adminRole,
    summaryAr: `تحديث حالة الطلب (${updated.orderNumber}) إلى ${newStatus}`,
    summaryEn: `Updated order (${updated.orderNumber}) status to ${newStatus}`,
  });
}

// ============================================================================
// REACT HOOK FOR REAL-TIME PARTNER ECOSYSTEM ACCESS
// ============================================================================
export function usePartnerEcosystem() {
  const [, setTick] = useState(storeVersion);

  useEffect(() => {
    startPartnerEcosystemSync();
    const onUpdate = () => setTick((v) => v + 1);
    window.addEventListener(PARTNER_SYNC_EVENT, onUpdate);
    return () => window.removeEventListener(PARTNER_SYNC_EVENT, onUpdate);
  }, []);

  return {
    partners: memPartners,
    categories: memCategories,
    branches: memBranches,
    mappings: memMappings,
    orders: memOrders,
    auditLogs: memAuditLogs,
    getVisiblePartners: (ctx?: PublicVisibilityContext) =>
      sortPublicPartners(
        memPartners.filter((p) => isPartnerVisiblePublicly(p, ctx, memBranches)),
        ctx?.placement
      ),
    getPartnerBranches: (partnerId: string, onlyPublished = true) =>
      memBranches.filter(
        (b) =>
          b.partnerId === partnerId &&
          (!onlyPublished || (b.published && b.branchStatus === 'active'))
      ),
    getMedicationMappings: (productId?: string, activeIngredientId?: string, strength?: string, dosageForm?: string) =>
      memMappings.filter((m) => {
        if (!m.published) return false;
        if (productId && m.productId === productId) return true;
        // Strict matching: must match activeIngredientId AND strength AND dosageForm
        if (
          activeIngredientId &&
          m.activeIngredientId === activeIngredientId &&
          (!strength || m.strength.toLowerCase().replace(/\s+/g, '') === strength.toLowerCase().replace(/\s+/g, '')) &&
          (!dosageForm || m.dosageForm === dosageForm)
        ) {
          return true;
        }
        return false;
      }),
  };
}

// ============================================================================
// PHASE 2–7 ENTERPRISE SERVICES: PHARMACY APPLICATIONS, INVENTORY, DYNAMIC GEOGRAPHY & FRANCHISE
// (Hardened for Sections 2, 4, 5, 6, 8, 9 of Security & Data Integrity Repair Prompt)
// ============================================================================
import {
  EGYPTIAN_GOVERNORATES,
  EgyptianGovernorateInfo,
  FranchiseContractRecord,
  PharmacyApplicationStatus,
  PharmacyAuthorizedEmployee,
  PharmacyInventoryItem,
  PharmacyRegistrationApplication,
} from './partnerTypes';

export const COL_PHARMACY_APPLICATIONS = 'pharmacyApplications';
export const COL_PHARMACY_INVENTORY = 'pharmacyInventory';
export const COL_PHARMACY_PUBLIC_INVENTORY = 'pharmacyPublicInventory';
export const COL_PHARMACY_EMPLOYEES = 'pharmacyEmployees';
export const COL_FRANCHISE_CONTRACTS = 'franchiseContracts';

const CACHE_PHARM_APPS_KEY = 'aa_pharmacy_applications_v1';
const CACHE_PHARM_INV_KEY = 'aa_pharmacy_inventory_v1';
const CACHE_PHARM_EMP_KEY = 'aa_pharmacy_employees_v1';
const CACHE_FRANCHISE_KEY = 'aa_franchise_contracts_v1';
const CACHE_DYNAMIC_GEO_KEY = 'aa_dynamic_geography_v1';

let memPharmacyApps: PharmacyRegistrationApplication[] = safeReadJson(CACHE_PHARM_APPS_KEY, []);
let memPharmacyInventory: PharmacyInventoryItem[] = safeReadJson(CACHE_PHARM_INV_KEY, []);
let memPharmacyEmployees: PharmacyAuthorizedEmployee[] = safeReadJson(CACHE_PHARM_EMP_KEY, []);
let memFranchiseContracts: FranchiseContractRecord[] = safeReadJson(CACHE_FRANCHISE_KEY, []);
let memDynamicGovs: EgyptianGovernorateInfo[] = safeReadJson(
  CACHE_DYNAMIC_GEO_KEY,
  EGYPTIAN_GOVERNORATES
);

let enterpriseListenersStarted = false;
let cloudSyncStatus: 'synced' | 'syncing' | 'offline_cache' | 'error' = configured ? 'syncing' : 'offline_cache';
let lastPersistenceError: string | null = null;

export function startDawayaNetworkRealtimeSync(): void {
  startPartnerEcosystemSync();
  if (enterpriseListenersStarted || typeof window === 'undefined' || !configured || !db) return;
  enterpriseListenersStarted = true;

  // 1. Real-time Partner Orders listener
  try {
    onSnapshot(
      collection(db, COL_PARTNER_ORDERS),
      (snap) => {
        const list: PartnerOrderRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as PartnerOrderRecord;
          if (data && d.id) list.push({ ...data, id: d.id });
        });
        memOrders = list.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
        safeWriteJson(CACHE_ORDERS_KEY, memOrders);
        cloudSyncStatus = 'synced';
        emitPartnerUpdate();
      },
      () => {
        /* scoped read if non-admin/guest */
      }
    );
  } catch {
    /* ignore */
  }

  // 2. Real-time Pharmacy Applications listener
  try {
    onSnapshot(
      collection(db, COL_PHARMACY_APPLICATIONS),
      (snap) => {
        const list: PharmacyRegistrationApplication[] = [];
        snap.forEach((d) => {
          const data = d.data() as PharmacyRegistrationApplication;
          if (data && d.id) list.push({ ...data, id: d.id });
        });
        memPharmacyApps = list.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
        safeWriteJson(CACHE_PHARM_APPS_KEY, memPharmacyApps);
        cloudSyncStatus = 'synced';
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }

  // 3. Real-time Private Operational Inventory listener (for authorized pharmacy staff/admins)
  // with fallback to Public Availability Inventory (for public customers)
  try {
    onSnapshot(
      collection(db, COL_PHARMACY_INVENTORY),
      (snap) => {
        const list: PharmacyInventoryItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as PharmacyInventoryItem;
          if (data && d.id) list.push({ ...data, id: d.id });
        });
        memPharmacyInventory = list;
        safeWriteJson(CACHE_PHARM_INV_KEY, memPharmacyInventory);
        cloudSyncStatus = 'synced';
        emitPartnerUpdate();
      },
      () => {
        // Fallback to public availability projection if user is public/customer
        try {
          onSnapshot(
            collection(db, COL_PHARMACY_PUBLIC_INVENTORY),
            (pubSnap) => {
              const pubList: PharmacyInventoryItem[] = [];
              pubSnap.forEach((d) => {
                const data = d.data() as Partial<PharmacyInventoryItem>;
                if (data && d.id) {
                  pubList.push({
                    id: d.id,
                    pharmacyId: data.pharmacyId || '',
                    pharmacyNameAr: data.pharmacyNameAr || '',
                    governorateId: data.governorateId || '',
                    cityCenter: data.cityCenter || '',
                    medicationId: data.medicationId || '',
                    tradeNameAr: data.tradeNameAr || '',
                    tradeNameEn: data.tradeNameEn || '',
                    activeIngredient: data.activeIngredient || '',
                    strength: data.strength || '',
                    dosageForm: data.dosageForm || 'tablet',
                    quantityPacks: data.stockStatus === 'out_of_stock' ? 0 : 1,
                    lowStockThreshold: 5,
                    stockStatus: data.stockStatus || 'unconfirmed',
                    pharmacyPriceEgp: Number(data.pharmacyPriceEgp || 0),
                    batchNumber: '',
                    expiryDateYYYYMMDD: '',
                    requiresPrescription: Boolean(data.requiresPrescription),
                    lastUpdatedAtIso: data.lastUpdatedAtIso || '',
                    updatedByUid: '',
                  });
                }
              });
              memPharmacyInventory = pubList;
              emitPartnerUpdate();
            },
            () => {}
          );
        } catch {
          /* ignore */
        }
      }
    );
  } catch {
    /* ignore */
  }

  // 4. Real-time Pharmacy Employees listener
  try {
    onSnapshot(
      collection(db, COL_PHARMACY_EMPLOYEES),
      (snap) => {
        const list: PharmacyAuthorizedEmployee[] = [];
        snap.forEach((d) => {
          const data = d.data() as PharmacyAuthorizedEmployee;
          if (data && d.id) list.push({ ...data, id: d.id });
        });
        memPharmacyEmployees = list;
        safeWriteJson(CACHE_PHARM_EMP_KEY, memPharmacyEmployees);
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }

  // 5. Real-time Franchise Contracts listener
  try {
    onSnapshot(
      collection(db, COL_FRANCHISE_CONTRACTS),
      (snap) => {
        const list: FranchiseContractRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as FranchiseContractRecord;
          if (data && d.id) list.push({ ...data, id: d.id });
        });
        memFranchiseContracts = list;
        safeWriteJson(CACHE_FRANCHISE_KEY, memFranchiseContracts);
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }

  // 6. Real-time Dynamic Geography Hierarchy listener
  try {
    onSnapshot(
      doc(db, 'systemSettings', 'egypt_geography_hierarchy'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.governorates) && data.governorates.length > 0) {
            memDynamicGovs = data.governorates as EgyptianGovernorateInfo[];
            safeWriteJson(CACHE_DYNAMIC_GEO_KEY, memDynamicGovs);
            emitPartnerUpdate();
          }
        }
      },
      () => {}
    );
  } catch {
    /* ignore */
  }
}

export function getDynamicGovernorates(): EgyptianGovernorateInfo[] {
  return memDynamicGovs.length > 0 ? memDynamicGovs : EGYPTIAN_GOVERNORATES;
}

export async function saveDynamicGovernorates(
  govs: EgyptianGovernorateInfo[],
  adminUid: string
): Promise<void> {
  if (!Array.isArray(govs) || govs.length === 0) {
    throw new Error('INVALID_GOVERNORATES_LIST');
  }
  const prev = [...memDynamicGovs];
  if (configured && db) {
    try {
      await setDoc(
        doc(db, 'systemSettings', 'egypt_geography_hierarchy'),
        {
          governorates: govs,
          updatedAtIso: new Date().toISOString(),
          updatedBy: adminUid,
        },
        { merge: true }
      );
      lastPersistenceError = null;
    } catch (err: unknown) {
      memDynamicGovs = prev;
      lastPersistenceError = (err as Error)?.message || 'FIRESTORE_WRITE_FAILED';
      emitPartnerUpdate();
      throw err;
    }
  }
  memDynamicGovs = govs;
  safeWriteJson(CACHE_DYNAMIC_GEO_KEY, memDynamicGovs);
  emitPartnerUpdate();
}

export async function submitPharmacyRegistrationApplication(
  appData: Omit<
    PharmacyRegistrationApplication,
    'id' | 'status' | 'verificationHistory' | 'createdAtIso' | 'updatedAtIso'
  >
): Promise<PharmacyRegistrationApplication> {
  if (!appData.applicantUid || !appData.pharmacyNameAr?.trim() || !appData.licenseNumber?.trim()) {
    throw new Error('MISSING_REQUIRED_APPLICATION_FIELDS');
  }

  const nowIso = new Date().toISOString();
  const id = `pharm_app_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
  // Ensure applicant submission NEVER contains approvedPharmacyId or admin approval fields
  const record: PharmacyRegistrationApplication = {
    ...appData,
    id,
    status: 'pending_review',
    verificationHistory: [
      {
        timestampIso: nowIso,
        actorUid: appData.applicantUid,
        actorRole: 'pharmacy_owner',
        fromStatus: 'draft',
        toStatus: 'pending_review',
        decisionReasonAr: 'تم إرسال طلب انضمام الصيدلية مع بيانات الترخيص للمراجعة المركزية',
      },
    ],
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
  delete (record as unknown as Record<string, unknown>).approvedPharmacyId;
  delete (record as unknown as Record<string, unknown>).reviewedByUid;

  if (configured && db) {
    try {
      await setDoc(doc(db, COL_PHARMACY_APPLICATIONS, id), record);
      lastPersistenceError = null;
    } catch (err: unknown) {
      lastPersistenceError = (err as Error)?.message || 'APPLICATION_CLOUD_SAVE_FAILED';
      emitPartnerUpdate();
      throw err;
    }
  }

  memPharmacyApps = [record, ...memPharmacyApps.filter((a) => a.id !== id)];
  safeWriteJson(CACHE_PHARM_APPS_KEY, memPharmacyApps);
  emitPartnerUpdate();
  return record;
}

export async function reviewPharmacyApplicationDecision(
  appId: string,
  newStatus: PharmacyApplicationStatus,
  reasonAr: string,
  adminUid: string,
  adminRole: string
): Promise<void> {
  if (!['admin', 'super_admin', 'owner', 'regional_manager'].includes(adminRole)) {
    throw new Error('UNAUTHORIZED_APPLICATION_REVIEW_ROLE');
  }
  const idx = memPharmacyApps.findIndex((a) => a.id === appId);
  if (idx < 0) throw new Error('APPLICATION_NOT_FOUND');

  const current = memPharmacyApps[idx];
  const nowIso = new Date().toISOString();
  let approvedPharmacyId = current.approvedPharmacyId;
  let provisionedPartner: PartnerPublicRecord | null = null;

  // When approved, automatically provision an isolated Verified Partner & Pharmacy record
  if (newStatus === 'approved' && !approvedPharmacyId) {
    approvedPharmacyId = `pharm_${current.id}`;
    provisionedPartner = {
      id: approvedPharmacyId,
      name: current.pharmacyNameAr,
      nameAr: current.pharmacyNameAr,
      nameEn: current.pharmacyNameEn || current.pharmacyNameAr,
      logoUrl: current.logoUrl || '',
      coverImageUrl: '',
      descriptionAr: `صيدلية مرخصة ومعتمدة ضمن شبكة دوايا — ترخيص رقم (${current.licenseNumber})`,
      descriptionEn: `Licensed & Verified DAWAYA Network Pharmacy — License #${current.licenseNumber}`,
      categoryId: 'cat_independent_pharmacies',
      partnerType: 'independent_pharmacy',
      phone: current.phone,
      hotline: current.phone,
      publicEmail: current.applicantEmail,
      websiteUrl: '',
      externalOrderingUrl: '',
      socialLinks: { whatsapp: current.whatsapp },
      servicesOfferedAr: ['صرف الروشتات الطبية', 'فحص التداخلات الدوائية', 'توصيل للمنازل'],
      servicesOfferedEn: ['Prescription Dispensing', 'Drug Safety Screening', 'Home Delivery'],
      supportedGovernorates: [current.governorateId],
      supportedCities: [current.cityCenter],
      supportedDistricts: [current.districtVillage],
      deliveryAvailable: current.deliveryAvailable,
      deliveryCoverageAr: `${current.cityCenter} — ${current.districtVillage} (نطاق ${current.deliveryRadiusKm} كم)`,
      deliveryCoverageEn: `${current.cityCenter} (${current.deliveryRadiusKm} km radius)`,
      workingHoursAr: current.workingHoursAr,
      workingHoursEn: current.is24Hours ? '24 Hours' : current.workingHoursAr,
      is24Hours: current.is24Hours,
      supportsOnlineOrdering: true,
      requiresPrescriptionForAntibiotics: true,
      partnershipStatus: 'active',
      verificationStatus: 'verified',
      publicationStatus: 'published',
      visibilityStatus: 'visible',
      apiIntegrationStatus: 'manual_only',
      integrationMethod: 'manual_availability',
      availabilitySyncEnabled: true,
      priceSyncEnabled: true,
      orderSyncEnabled: true,
      lastSuccessfulSyncIso: nowIso,
      syncSourceLabelAr: 'تحديث مباشر من نظام الصيدلية المعتمد',
      syncSourceLabelEn: 'Live Verified Pharmacy Inventory',
      visibility: {
        ...createDefaultVisibilitySettings(approvedPharmacyId, adminUid),
        showOnWebsite: true,
        publishPartnerProfile: true,
        showInPartnerDirectory: true,
        showInMedicationSearch: true,
        showInMedicationDetails: true,
        showInNearbyPharmacies: true,
        geographicScope: 'specific_governorates',
        allowedGovernorates: [current.governorateId],
      },
      display: {
        ...createDefaultDisplayCustomization(),
        showVerificationBadge: true,
      },
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
  }

  const updated: PharmacyRegistrationApplication = {
    ...current,
    status: newStatus,
    adminDecisionReasonAr: reasonAr,
    approvedPharmacyId,
    updatedAtIso: nowIso,
    verificationHistory: [
      ...current.verificationHistory,
      {
        timestampIso: nowIso,
        actorUid: adminUid,
        actorRole: adminRole,
        fromStatus: current.status,
        toStatus: newStatus,
        decisionReasonAr: reasonAr,
      },
    ],
  };

  if (configured && db) {
    try {
      await setDoc(doc(db, COL_PHARMACY_APPLICATIONS, appId), updated);
      if (provisionedPartner && approvedPharmacyId) {
        await Promise.all([
          setDoc(doc(db, COL_PARTNERS, approvedPharmacyId), {
            ...provisionedPartner,
            ownerUid: current.applicantUid,
          }),
          setDoc(doc(db, 'pharmacies', approvedPharmacyId), {
            id: approvedPharmacyId,
            ownerUid: current.applicantUid,
            nameAr: current.pharmacyNameAr,
            nameEn: current.pharmacyNameEn || current.pharmacyNameAr,
            licenseNumber: current.licenseNumber,
            syndicateRegistrationNumber: current.syndicateRegistrationNumber,
            governorateId: current.governorateId,
            cityCenter: current.cityCenter,
            districtVillage: current.districtVillage,
            status: 'approved',
            approvedByUid: adminUid,
            approvedAtIso: nowIso,
          }),
        ]);
      }
      lastPersistenceError = null;
    } catch (err: unknown) {
      lastPersistenceError = (err as Error)?.message || 'APPLICATION_REVIEW_SAVE_FAILED';
      emitPartnerUpdate();
      throw err;
    }
  }

  if (provisionedPartner) {
    memPartners = [provisionedPartner, ...memPartners.filter((p) => p.id !== provisionedPartner!.id)];
    safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
  }
  memPharmacyApps[idx] = updated;
  safeWriteJson(CACHE_PHARM_APPS_KEY, memPharmacyApps);
  emitPartnerUpdate();

  await recordAdminAuditLog({
    action: 'partner_verification_changed',
    partnerId: approvedPharmacyId || appId,
    partnerName: current.pharmacyNameAr,
    adminUid,
    adminRole,
    summaryAr: `تحديث حالة طلب توثيق صيدلية (${current.pharmacyNameAr}) إلى ${newStatus}`,
    summaryEn: `Updated pharmacy application (${current.pharmacyNameAr}) to ${newStatus}`,
  });
}

export async function upsertPharmacyInventoryItem(
  item: Omit<PharmacyInventoryItem, 'id' | 'lastUpdatedAtIso' | 'stockStatus'> & { id?: string }
): Promise<PharmacyInventoryItem> {
  if (!item.pharmacyId || !item.medicationId) {
    throw new Error('MISSING_PHARMACY_OR_MEDICATION_ID');
  }
  if (!Number.isFinite(item.quantityPacks) || item.quantityPacks < 0) {
    throw new Error('INVALID_STOCK_QUANTITY: Stock quantity cannot be negative.');
  }
  if (!Number.isFinite(item.pharmacyPriceEgp) || item.pharmacyPriceEgp <= 0) {
    throw new Error('INVALID_PHARMACY_PRICE: Price must be greater than 0 EGP.');
  }

  const nowIso = new Date().toISOString();
  const id = item.id || `inv_${item.pharmacyId}_${item.medicationId}`;
  const stockStatus: PharmacyInventoryItem['stockStatus'] =
    item.quantityPacks <= 0
      ? 'out_of_stock'
      : item.quantityPacks <= item.lowStockThreshold
      ? 'low_stock'
      : 'available';

  const record: PharmacyInventoryItem = {
    ...item,
    id,
    stockStatus,
    lastUpdatedAtIso: nowIso,
  };

  // Section 9 Fix: Separate public availability projection from private operational batch/cost record
  const publicAvailabilityProjection = {
    id,
    pharmacyId: record.pharmacyId,
    medicationId: record.medicationId,
    tradeNameAr: record.tradeNameAr,
    tradeNameEn: record.tradeNameEn,
    activeIngredient: record.activeIngredient,
    strength: record.strength,
    dosageForm: record.dosageForm,
    pharmacyPriceEgp: record.pharmacyPriceEgp,
    stockStatus: record.stockStatus,
    requiresPrescription: Boolean(record.requiresPrescription),
    lastUpdatedAtIso: nowIso,
  };

  if (configured && db) {
    try {
      await Promise.all([
        setDoc(doc(db, COL_PHARMACY_INVENTORY, id), record),
        setDoc(doc(db, COL_PHARMACY_PUBLIC_INVENTORY, id), publicAvailabilityProjection),
      ]);
      lastPersistenceError = null;
    } catch (err: unknown) {
      lastPersistenceError = (err as Error)?.message || 'INVENTORY_CLOUD_SAVE_FAILED';
      emitPartnerUpdate();
      throw err;
    }
  }

  const existingIdx = memPharmacyInventory.findIndex((x) => x.id === id);
  if (existingIdx >= 0) {
    memPharmacyInventory[existingIdx] = record;
  } else {
    memPharmacyInventory = [record, ...memPharmacyInventory];
  }
  safeWriteJson(CACHE_PHARM_INV_KEY, memPharmacyInventory);
  emitPartnerUpdate();
  return record;
}

export async function deletePharmacyInventoryItem(invId: string): Promise<void> {
  if (configured && db) {
    try {
      await Promise.all([
        deleteDoc(doc(db, COL_PHARMACY_INVENTORY, invId)),
        deleteDoc(doc(db, COL_PHARMACY_PUBLIC_INVENTORY, invId)),
      ]);
      lastPersistenceError = null;
    } catch (err: unknown) {
      lastPersistenceError = (err as Error)?.message || 'INVENTORY_DELETE_FAILED';
      emitPartnerUpdate();
      throw err;
    }
  }
  memPharmacyInventory = memPharmacyInventory.filter((x) => x.id !== invId);
  safeWriteJson(CACHE_PHARM_INV_KEY, memPharmacyInventory);
  emitPartnerUpdate();
}

export async function savePharmacyEmployee(
  emp: Omit<PharmacyAuthorizedEmployee, 'id' | 'addedAtIso'> & { id?: string }
): Promise<PharmacyAuthorizedEmployee> {
  if (!emp.pharmacyId || !emp.fullName?.trim() || !emp.role) {
    throw new Error('INVALID_EMPLOYEE_RECORD');
  }
  const id = emp.id || `emp_${Date.now().toString(36)}`;
  const record: PharmacyAuthorizedEmployee = {
    ...emp,
    id,
    addedAtIso: new Date().toISOString(),
  };

  if (configured && db) {
    try {
      await setDoc(doc(db, COL_PHARMACY_EMPLOYEES, id), record);
      lastPersistenceError = null;
    } catch (err: unknown) {
      lastPersistenceError = (err as Error)?.message || 'EMPLOYEE_CLOUD_SAVE_FAILED';
      emitPartnerUpdate();
      throw err;
    }
  }

  const idx = memPharmacyEmployees.findIndex((e) => e.id === id);
  if (idx >= 0) {
    memPharmacyEmployees[idx] = record;
  } else {
    memPharmacyEmployees = [record, ...memPharmacyEmployees];
  }
  safeWriteJson(CACHE_PHARM_EMP_KEY, memPharmacyEmployees);
  emitPartnerUpdate();
  return record;
}

export async function saveFranchiseContract(
  contract: Omit<FranchiseContractRecord, 'id' | 'updatedAtIso'> & { id?: string }
): Promise<FranchiseContractRecord> {
  if (!contract.pharmacyId || !contract.contractNumber?.trim()) {
    throw new Error('INVALID_FRANCHISE_CONTRACT');
  }
  const id = contract.id || `fr_${Date.now().toString(36)}`;
  const record: FranchiseContractRecord = {
    ...contract,
    id,
    updatedAtIso: new Date().toISOString(),
  };

  if (configured && db) {
    try {
      await setDoc(doc(db, COL_FRANCHISE_CONTRACTS, id), record);
      lastPersistenceError = null;
    } catch (err: unknown) {
      lastPersistenceError = (err as Error)?.message || 'FRANCHISE_CONTRACT_SAVE_FAILED';
      emitPartnerUpdate();
      throw err;
    }
  }

  const idx = memFranchiseContracts.findIndex((c) => c.id === id);
  if (idx >= 0) {
    memFranchiseContracts[idx] = record;
  } else {
    memFranchiseContracts = [record, ...memFranchiseContracts];
  }
  safeWriteJson(CACHE_FRANCHISE_KEY, memFranchiseContracts);
  emitPartnerUpdate();
  return record;
}

export function useDawayaPharmacyNetwork() {
  const [, setTick] = useState(storeVersion);

  useEffect(() => {
    startDawayaNetworkRealtimeSync();
    const onUpdate = () => setTick((v) => v + 1);
    window.addEventListener(PARTNER_SYNC_EVENT, onUpdate);
    return () => window.removeEventListener(PARTNER_SYNC_EVENT, onUpdate);
  }, []);

  return {
    applications: memPharmacyApps,
    inventory: memPharmacyInventory,
    employees: memPharmacyEmployees,
    franchiseContracts: memFranchiseContracts,
    dynamicGovernorates: getDynamicGovernorates(),
    orders: memOrders,
    cloudSyncStatus,
    lastPersistenceError,
  };
}
