import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, configured } from './firebase';

export type RetailUnit = 'box' | 'strip' | 'tablet';
export type OrderStatus =
  | 'pending'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'partial_return'
  | 'returned';
export type StockMovementType = 'receive' | 'online' | 'offline' | 'return';

export interface DawayaFeatureFlags {
  shoppingAndCartEnabled: boolean;
  mandatoryContactAutoReveal: boolean;
  unitRetailEnabled: boolean;
  retailMarkupEnabled: boolean;
  autoRoundCashEnabled: boolean;
  deliveryAndCourierEnabled: boolean;
  rxChatEnabled: boolean;
  promoCodesEnabled: boolean;
}

export interface CommercePharmacy {
  id: string;
  name: string;
  ownerName: string;
  city: string;
  deliveryFee: number;
  allowLooseMarkup: boolean;
}

export interface PharmacyCourier {
  id: string;
  pharmacyId: string;
  name: string;
  phone: string;
  area: string;
  active: boolean;
}

export interface UnitPricingRule {
  boxPrice: number;
  looseBoxBase: number;
  stripsPerBox: number;
  tabsPerStrip: number;
  allowStrip: boolean;
  allowTablet: boolean;
}

export interface PharmacyMedStock {
  shelfUnits: number; // stored in base tablets/units for exact box/strip/tablet deduction
  warehouseBoxes: number;
  outOfStock: boolean;
}

export interface StockMovementEntry {
  id: string;
  type: StockMovementType;
  medName: string;
  delta: string;
  note: string;
  time: string;
}

export interface UnifiedCartItem {
  cartKey: string;
  medId: string;
  medName: string;
  unit: RetailUnit;
  qty: number;
}

export interface OrderLineItem {
  medId: string;
  medName: string;
  unit: RetailUnit;
  qty: number;
  unitPrice: number;
  returnedQty: number;
}

export interface OrderChatMessage {
  sender: 'patient' | 'pharmacist';
  text: string;
  time: string;
}

export interface DawayaCommerceOrder {
  id: string;
  patientName: string;
  patientUid?: string;
  pharmacyId: string;
  pharmacyName: string;
  courierId: string;
  items: OrderLineItem[];
  total: number;
  collectedCash: number;
  status: OrderStatus;
  deducted: boolean;
  savedAddress: string;
  savedPhone: string;
  savedGps?: string;
  locationRevealed: boolean;
  returnNote: string;
  time: string;
  updatedAt?: number;
  chat: OrderChatMessage[];
}

export interface RxQuoteLine {
  lineId: string;
  medId: string;
  qty: number;
  included: boolean;
}

export interface RxQuoteThread {
  id: string;
  patientName: string;
  pharmacyId: string;
  pharmacyName: string;
  status: 'waiting_pharmacist' | 'quoted' | 'approved';
  messages: OrderChatMessage[];
  items: RxQuoteLine[];
}

export interface PromoCodeRule {
  code: string;
  scope: 'all' | string;
  ownerLabel: string;
  discountPct: number;
  maxUsesPerUser: number;
  usedCount: number;
  active: boolean;
}

export interface CustomerInboxMessage {
  id: string;
  from: string;
  title: string;
  body: string;
  code?: string;
  time: string;
  read: boolean;
  createdAt?: number;
}

export interface PharmacyRoleBinding {
  id: string;
  name: string;
  email: string;
  role: 'pharmacy_owner' | 'courier' | 'customer';
  pharmacyId: string;
}

export interface CatalogMedSeed {
  id: string;
  nameAr: string;
  nameEn: string;
  ing: string;
  basePrice: number;
  looseBoxBase: number;
  stripsPerBox: number;
  tabsPerStrip: number;
  allowStrip: boolean;
  allowTablet: boolean;
  altId?: string;
}

export const COMMERCE_UNIT_LABELS: Record<RetailUnit, string> = {
  box: 'علبة',
  strip: 'شريط',
  tablet: 'حباية',
};

export const COMMERCE_CATALOG_SEED: CatalogMedSeed[] = [
  { id: 'eg-2001', nameAr: 'كومتركس للبرد والإنفلونزا 12 قرص', nameEn: 'Comtrex 12 Tabs', ing: 'Paracetamol + Pseudoephedrine', basePrice: 120, looseBoxBase: 130, stripsPerBox: 2, tabsPerStrip: 6, allowStrip: true, allowTablet: true, altId: 'eg-1001' },
  { id: 'eg-1001', nameAr: 'بنادول إكسترا 24 قرص', nameEn: 'Panadol Extra', ing: 'Paracetamol + Caffeine', basePrice: 48, looseBoxBase: 54, stripsPerBox: 2, tabsPerStrip: 12, allowStrip: true, allowTablet: true, altId: 'eg-1005' },
  { id: 'eg-1005', nameAr: 'أبيمول إكسترا 20 قرص', nameEn: 'Abimol Extra', ing: 'Paracetamol + Caffeine', basePrice: 20, looseBoxBase: 24, stripsPerBox: 2, tabsPerStrip: 10, allowStrip: true, allowTablet: true, altId: 'eg-1001' },
  { id: 'eg-1002', nameAr: 'أوجمنتين 1 جم 14 قرص', nameEn: 'Augmentin 1g', ing: 'Amoxicillin + Clavulanic', basePrice: 140, looseBoxBase: 148, stripsPerBox: 2, tabsPerStrip: 7, allowStrip: true, allowTablet: false, altId: 'eg-1006' },
  { id: 'eg-1006', nameAr: 'هايبوتك 1 جم 16 قرص', nameEn: 'Hibiotic 1g', ing: 'Amoxicillin + Clavulanic', basePrice: 120, looseBoxBase: 128, stripsPerBox: 2, tabsPerStrip: 8, allowStrip: true, allowTablet: false, altId: 'eg-1002' },
  { id: 'eg-4904', nameAr: 'فلاجيل 500 مجم 20 قرص', nameEn: 'Flagyl 500mg', ing: 'Metronidazole', basePrice: 40, looseBoxBase: 46, stripsPerBox: 2, tabsPerStrip: 10, allowStrip: true, allowTablet: true, altId: 'eg-4894' },
  { id: 'eg-4894', nameAr: 'فلاجيلات فورت 200 مجم', nameEn: 'Flagellat Forte', ing: 'Metronidazole', basePrice: 30, looseBoxBase: 34, stripsPerBox: 2, tabsPerStrip: 10, allowStrip: true, allowTablet: false, altId: 'eg-4904' },
];

export interface DawayaCommerceState {
  featureFlags: DawayaFeatureFlags;
  maxMarkupCapPct: number;
  pharmacies: CommercePharmacy[];
  roleBindings: PharmacyRoleBinding[];
  couriers: PharmacyCourier[];
  unitRules: Record<string, Record<string, UnitPricingRule>>;
  inventories: Record<string, Record<string, PharmacyMedStock>>;
  stockLedger: Record<string, StockMovementEntry[]>;
  cart: UnifiedCartItem[];
  selectedPharmacyId: string;
  customerAddress: string;
  customerPhone: string;
  promoCodes: PromoCodeRule[];
  customerInbox: CustomerInboxMessage[];
  orders: DawayaCommerceOrder[];
  rxThreads: RxQuoteThread[];
}

const STORAGE_KEY = 'dawaya_unified_commerce_state_v1';

// Real-Time Firestore Collection Paths (cross-device live sync)
const COL_CONFIG = 'commerceConfig';
const DOC_CONFIG_GLOBAL = 'global';
const COL_PHARMACIES = 'commercePharmacies';
const COL_ORDERS = 'commerceOrders';
const COL_RX = 'commerceRxThreads';
const COL_PROMOS = 'commercePromos';
const COL_INBOX = 'commerceInbox';

function buildSeedRules(): Record<string, UnitPricingRule> {
  const out: Record<string, UnitPricingRule> = {};
  for (const m of COMMERCE_CATALOG_SEED) {
    out[m.id] = {
      boxPrice: m.basePrice,
      looseBoxBase: m.looseBoxBase,
      stripsPerBox: m.stripsPerBox,
      tabsPerStrip: m.tabsPerStrip,
      allowStrip: m.allowStrip,
      allowTablet: m.allowTablet,
    };
  }
  return out;
}

function buildSeedInventory(mult = 10, oosIds: string[] = []): Record<string, PharmacyMedStock> {
  const out: Record<string, PharmacyMedStock> = {};
  for (const m of COMMERCE_CATALOG_SEED) {
    const isOos = oosIds.includes(m.id);
    out[m.id] = {
      shelfUnits: isOos ? 0 : mult * m.stripsPerBox * m.tabsPerStrip,
      warehouseBoxes: isOos ? 0 : 15,
      outOfStock: isOos,
    };
  }
  return out;
}

export function createInitialCommerceState(): DawayaCommerceState {
  return {
    featureFlags: {
      shoppingAndCartEnabled: true,
      mandatoryContactAutoReveal: true,
      unitRetailEnabled: true,
      retailMarkupEnabled: true,
      autoRoundCashEnabled: true,
      deliveryAndCourierEnabled: true,
      rxChatEnabled: true,
      promoCodesEnabled: true,
    },
    maxMarkupCapPct: 15,
    pharmacies: [
      { id: 'ph-a', name: 'صيدلية الشفاء الحديثة', ownerName: 'د. عمر الشاذلي', city: 'المنصورة', deliveryFee: 0, allowLooseMarkup: true },
      { id: 'ph-b', name: 'صيدلية د. كريم النور', ownerName: 'د. كريم منصور', city: 'طلخا', deliveryFee: 15, allowLooseMarkup: false },
    ],
    roleBindings: [
      { id: 'acc-1', name: 'د. عمر الشاذلي', email: 'omar@shifa.eg', role: 'pharmacy_owner', pharmacyId: 'ph-a' },
      { id: 'acc-2', name: 'د. كريم منصور', email: 'karim@noor.eg', role: 'pharmacy_owner', pharmacyId: 'ph-b' },
    ],
    couriers: [
      { id: 'cur-a1', pharmacyId: 'ph-a', name: 'كابتن محمد علي', phone: '01099887766', area: 'المنصورة — قناة السويس والجلاء', active: true },
      { id: 'cur-a2', pharmacyId: 'ph-a', name: 'كابتن إسلام طارق', phone: '01122334455', area: 'المنصورة — المشاية والجامعة', active: true },
      { id: 'cur-b1', pharmacyId: 'ph-b', name: 'كابتن يوسف سامي', phone: '01244556677', area: 'طلخا — شارع صلاح سالم', active: true },
    ],
    unitRules: {
      'ph-a': buildSeedRules(),
      'ph-b': buildSeedRules(),
    },
    inventories: {
      'ph-a': buildSeedInventory(10, ['eg-1002']),
      'ph-b': buildSeedInventory(12, []),
    },
    stockLedger: {
      'ph-a': [
        { id: 'mv-1', type: 'receive', medName: 'كومتركس للبرد والإنفلونزا 12 قرص', delta: '+10 علبة', note: 'توريد فاتورة موزع', time: 'اليوم' },
      ],
      'ph-b': [],
    },
    cart: [],
    selectedPharmacyId: 'ph-a',
    customerAddress: '',
    customerPhone: '',
    promoCodes: [
      { code: 'DAWAYA10', scope: 'all', ownerLabel: 'الأدمن (كل الصيدليات)', discountPct: 10, maxUsesPerUser: 2, usedCount: 0, active: true },
      { code: 'VIP15', scope: 'ph-a', ownerLabel: 'صيدلية الشفاء الحديثة', discountPct: 15, maxUsesPerUser: 1, usedCount: 0, active: true },
    ],
    customerInbox: [
      {
        id: 'msg-welcome-vip',
        from: 'صيدلية الشفاء الحديثة',
        title: 'كود خصم للعملاء الدائمين',
        body: 'استخدم الكود VIP15 لخصم 15% على طلبك القادم من الصيدلية (صالح لاستخدام واحد لكل حساب).',
        code: 'VIP15',
        time: 'اليوم',
        read: false,
      },
    ],
    orders: [],
    rxThreads: [
      {
        id: 'RX-501',
        patientName: 'عميل دوايا',
        pharmacyId: 'ph-a',
        pharmacyName: 'صيدلية الشفاء الحديثة',
        status: 'quoted',
        messages: [
          { sender: 'patient', text: 'صوّرت الروشتة والذكاء الاصطناعي لم يقرأ خط الطبيب بالكامل، أرجو تسعيرها.', time: 'اليوم' },
          { sender: 'pharmacist', text: 'تمت قراءة الروشتة وتجهيز التسعيرة التفصيلية بالبدائل الأوفر؛ يمكنك التبديل أو الحذف قبل الموافقة.', time: 'اليوم' },
        ],
        items: [
          { lineId: 'ln-1', medId: 'eg-1002', qty: 1, included: true },
          { lineId: 'ln-2', medId: 'eg-1001', qty: 1, included: true },
          { lineId: 'ln-3', medId: 'eg-4904', qty: 1, included: true },
        ],
      },
    ],
  };
}

let memoryState: DawayaCommerceState | null = null;
const listeners = new Set<() => void>();
let realtimeUnsubscribers: Unsubscribe[] = [];
let realtimeStarted = false;

function persistLocalCache(st: DawayaCommerceState) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
    } catch {
      /* ignore quota errors */
    }
  }
}

function applyRemotePatch(patcher: (prev: DawayaCommerceState) => DawayaCommerceState) {
  const prev = getCommerceState();
  const next = patcher(prev);
  memoryState = next;
  persistLocalCache(next);
  listeners.forEach((fn) => fn());
}

export function getCommerceState(): DawayaCommerceState {
  if (memoryState) return memoryState;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DawayaCommerceState>;
        const base = createInitialCommerceState();
        memoryState = {
          ...base,
          ...parsed,
          featureFlags: { ...base.featureFlags, ...(parsed.featureFlags || {}) },
        };
        return memoryState;
      }
    } catch {
      /* fallback to seed */
    }
  }
  memoryState = createInitialCommerceState();
  return memoryState;
}

/**
 * Automatically pushes every changed domain slice (Flags, Pharmacy Prices/Stock/Couriers,
 * Orders + Status + Chat, Rx Quotes, Promo Codes, VIP Inbox) to Firestore in real time
 * so every connected Customer, Pharmacy PC, Courier, and Admin sees updates immediately.
 */
function syncDiffToFirestore(prev: DawayaCommerceState, next: DawayaCommerceState) {
  if (!configured || !db) return;
  const now = Date.now();

  // 1. Global Admin Feature Flags, Markup Cap & Role Bindings
  if (
    prev.featureFlags !== next.featureFlags ||
    prev.maxMarkupCapPct !== next.maxMarkupCapPct ||
    prev.roleBindings !== next.roleBindings
  ) {
    void setDoc(
      doc(db, COL_CONFIG, DOC_CONFIG_GLOBAL),
      {
        featureFlags: next.featureFlags,
        maxMarkupCapPct: next.maxMarkupCapPct,
        roleBindings: next.roleBindings,
        updatedAt: now,
      },
      { merge: true }
    ).catch(() => {});
  }

  // 2. Per-Pharmacy Prices (unitRules), Stock (inventories + ledger), Delivery Fee, Couriers
  const phChanged =
    prev.pharmacies !== next.pharmacies ||
    prev.unitRules !== next.unitRules ||
    prev.inventories !== next.inventories ||
    prev.stockLedger !== next.stockLedger ||
    prev.couriers !== next.couriers;

  if (phChanged) {
    next.pharmacies.forEach((ph) => {
      const prevPh = prev.pharmacies.find((x) => x.id === ph.id);
      const prevCouriers = prev.couriers.filter((c) => c.pharmacyId === ph.id);
      const nextCouriers = next.couriers.filter((c) => c.pharmacyId === ph.id);
      const dirty =
        prevPh !== ph ||
        prev.unitRules[ph.id] !== next.unitRules[ph.id] ||
        prev.inventories[ph.id] !== next.inventories[ph.id] ||
        prev.stockLedger[ph.id] !== next.stockLedger[ph.id] ||
        JSON.stringify(prevCouriers) !== JSON.stringify(nextCouriers);

      if (dirty) {
        void setDoc(
          doc(db, COL_PHARMACIES, ph.id),
          {
            ...ph,
            unitRules: next.unitRules[ph.id] || buildSeedRules(),
            inventories: next.inventories[ph.id] || buildSeedInventory(10),
            stockLedger: (next.stockLedger[ph.id] || []).slice(0, 60),
            couriers: nextCouriers,
            updatedAt: now,
          },
          { merge: true }
        ).catch(() => {});
      }
    });
  }

  // 3. Orders (New order, Pharmacy approval + auto-reveal address, Courier pickup/delivered/return, Chat)
  if (prev.orders !== next.orders) {
    next.orders.forEach((ord) => {
      const prevOrd = prev.orders.find((x) => x.id === ord.id);
      if (prevOrd !== ord) {
        void setDoc(
          doc(db, COL_ORDERS, ord.id),
          { ...ord, updatedAt: now },
          { merge: true }
        ).catch(() => {});
      }
    });
  }

  // 4. Itemized Prescription Quote Threads & Chat
  if (prev.rxThreads !== next.rxThreads) {
    next.rxThreads.forEach((rx) => {
      const prevRx = prev.rxThreads.find((x) => x.id === rx.id);
      if (prevRx !== rx) {
        void setDoc(doc(db, COL_RX, rx.id), { ...rx, updatedAt: now }, { merge: true }).catch(() => {});
      }
    });
  }

  // 5. Promo Codes (Admin global & Per-Pharmacy)
  if (prev.promoCodes !== next.promoCodes) {
    next.promoCodes.forEach((pr) => {
      const prevPr = prev.promoCodes.find((x) => x.code === pr.code);
      if (prevPr !== pr) {
        void setDoc(doc(db, COL_PROMOS, pr.code), { ...pr, updatedAt: now }, { merge: true }).catch(() => {});
      }
    });
  }

  // 6. VIP Customer Inbox Messages
  if (prev.customerInbox !== next.customerInbox) {
    next.customerInbox.forEach((msg) => {
      const prevMsg = prev.customerInbox.find((x) => x.id === msg.id);
      if (prevMsg !== msg) {
        void setDoc(
          doc(db, COL_INBOX, msg.id),
          { ...msg, createdAt: msg.createdAt || now },
          { merge: true }
        ).catch(() => {});
      }
    });
  }
}

export function updateCommerceState(
  updater: (prev: DawayaCommerceState) => DawayaCommerceState,
  _syncFlagsToCloud = true
): DawayaCommerceState {
  const prev = getCommerceState();
  const next = updater(prev);
  memoryState = next;
  persistLocalCache(next);
  syncDiffToFirestore(prev, next);
  listeners.forEach((fn) => fn());
  return next;
}

/**
 * Starts live Firestore onSnapshot listeners across all commerce collections.
 * Any price update, stock/out-of-stock change, new order, courier delivery/return,
 * chat message, or Admin switch propagates in real time to every connected device.
 */
export function startCommerceRealtimeSync(): void {
  if (realtimeStarted || !configured || !db) return;
  realtimeStarted = true;

  try {
    // 1. Live Admin Flags & Role Bindings
    const u1 = onSnapshot(
      doc(db, COL_CONFIG, DOC_CONFIG_GLOBAL),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data() as {
          featureFlags?: Partial<DawayaFeatureFlags>;
          maxMarkupCapPct?: number;
          roleBindings?: PharmacyRoleBinding[];
        };
        applyRemotePatch((prev) => ({
          ...prev,
          featureFlags: d.featureFlags ? { ...prev.featureFlags, ...d.featureFlags } : prev.featureFlags,
          maxMarkupCapPct: typeof d.maxMarkupCapPct === 'number' ? d.maxMarkupCapPct : prev.maxMarkupCapPct,
          roleBindings: Array.isArray(d.roleBindings) && d.roleBindings.length > 0 ? d.roleBindings : prev.roleBindings,
        }));
      },
      () => {}
    );

    // 2. Live Pharmacies, Prices, Inventories, Stock Ledger & Couriers
    const u2 = onSnapshot(
      collection(db, COL_PHARMACIES),
      (snap) => {
        if (snap.empty) return;
        applyRemotePatch((prev) => {
          const phMap = new Map(prev.pharmacies.map((p) => [p.id, p]));
          const nextRules = { ...prev.unitRules };
          const nextInv = { ...prev.inventories };
          const nextLedger = { ...prev.stockLedger };
          const couriersByPh = new Map<string, PharmacyCourier[]>();
          prev.couriers.forEach((c) => {
            const arr = couriersByPh.get(c.pharmacyId) || [];
            arr.push(c);
            couriersByPh.set(c.pharmacyId, arr);
          });

          snap.forEach((dSnap) => {
            const d = dSnap.data() as CommercePharmacy & {
              unitRules?: Record<string, UnitPricingRule>;
              inventories?: Record<string, PharmacyMedStock>;
              stockLedger?: StockMovementEntry[];
              couriers?: PharmacyCourier[];
            };
            const id = d.id || dSnap.id;
            phMap.set(id, {
              id,
              name: d.name || id,
              ownerName: d.ownerName || '',
              city: d.city || '',
              deliveryFee: typeof d.deliveryFee === 'number' ? d.deliveryFee : 0,
              allowLooseMarkup: Boolean(d.allowLooseMarkup),
            });
            if (d.unitRules) nextRules[id] = d.unitRules;
            if (d.inventories) nextInv[id] = d.inventories;
            if (Array.isArray(d.stockLedger)) nextLedger[id] = d.stockLedger;
            if (Array.isArray(d.couriers)) couriersByPh.set(id, d.couriers);
          });

          const mergedCouriers: PharmacyCourier[] = [];
          couriersByPh.forEach((list) => mergedCouriers.push(...list));

          return {
            ...prev,
            pharmacies: Array.from(phMap.values()),
            unitRules: nextRules,
            inventories: nextInv,
            stockLedger: nextLedger,
            couriers: mergedCouriers,
          };
        });
      },
      () => {}
    );

    // 3. Live Orders (Customer <-> Pharmacy <-> Courier real-time status & chat)
    const u3 = onSnapshot(
      collection(db, COL_ORDERS),
      (snap) => {
        if (snap.empty) return;
        const remoteOrders: DawayaCommerceOrder[] = [];
        snap.forEach((dSnap) => {
          remoteOrders.push(dSnap.data() as DawayaCommerceOrder);
        });
        remoteOrders.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        applyRemotePatch((prev) => ({ ...prev, orders: remoteOrders }));
      },
      () => {}
    );

    // 4. Live Rx Quote Threads
    const u4 = onSnapshot(
      collection(db, COL_RX),
      (snap) => {
        if (snap.empty) return;
        const remoteRx: RxQuoteThread[] = [];
        snap.forEach((dSnap) => {
          remoteRx.push(dSnap.data() as RxQuoteThread);
        });
        if (remoteRx.length > 0) {
          applyRemotePatch((prev) => ({ ...prev, rxThreads: remoteRx }));
        }
      },
      () => {}
    );

    // 5. Live Promo Codes
    const u5 = onSnapshot(
      collection(db, COL_PROMOS),
      (snap) => {
        if (snap.empty) return;
        const remotePromos: PromoCodeRule[] = [];
        snap.forEach((dSnap) => {
          remotePromos.push(dSnap.data() as PromoCodeRule);
        });
        if (remotePromos.length > 0) {
          applyRemotePatch((prev) => ({ ...prev, promoCodes: remotePromos }));
        }
      },
      () => {}
    );

    // 6. Live Customer VIP Inbox Messages
    const u6 = onSnapshot(
      collection(db, COL_INBOX),
      (snap) => {
        if (snap.empty) return;
        const remoteMsgs: CustomerInboxMessage[] = [];
        snap.forEach((dSnap) => {
          remoteMsgs.push(dSnap.data() as CustomerInboxMessage);
        });
        remoteMsgs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (remoteMsgs.length > 0) {
          applyRemotePatch((prev) => ({ ...prev, customerInbox: remoteMsgs }));
        }
      },
      () => {}
    );

    realtimeUnsubscribers = [u1, u2, u3, u4, u5, u6];
  } catch {
    /* keep local state if Firestore is offline */
  }
}

export function stopCommerceRealtimeSync(): void {
  realtimeUnsubscribers.forEach((u) => {
    try {
      u();
    } catch {
      /* ignore */
    }
  });
  realtimeUnsubscribers = [];
  realtimeStarted = false;
}

export async function hydrateCommerceFlagsFromCloud(): Promise<void> {
  startCommerceRealtimeSync();
}

export function useDawayaCommerce() {
  const [state, setState] = useState<DawayaCommerceState>(() => getCommerceState());

  useEffect(() => {
    startCommerceRealtimeSync();
    const onChange = () => setState(getCommerceState());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return { state, updateState: updateCommerceState };
}

export function computeUnitPricing(
  state: DawayaCommerceState,
  pharmacyId: string,
  medId: string,
  fallbackBoxPrice = 50
) {
  const ph = state.pharmacies.find((p) => p.id === pharmacyId);
  const rule = state.unitRules[pharmacyId]?.[medId] || {
    boxPrice: fallbackBoxPrice,
    looseBoxBase: fallbackBoxPrice,
    stripsPerBox: 2,
    tabsPerStrip: 10,
    allowStrip: true,
    allowTablet: false,
  };
  const strips = Math.max(1, Number(rule.stripsPerBox) || 1);
  const tabsPerStrip = Math.max(1, Number(rule.tabsPerStrip) || 1);
  const totalTabs = strips * tabsPerStrip;
  const boxPrice = Math.max(1, Number(rule.boxPrice) || 1);
  const markupActive = Boolean(state.featureFlags.retailMarkupEnabled && ph?.allowLooseMarkup);
  const maxAllowedBase = Math.round(boxPrice * (1 + state.maxMarkupCapPct / 100));
  const effectiveLooseBase = markupActive
    ? Math.min(maxAllowedBase, Math.max(boxPrice, Number(rule.looseBoxBase) || boxPrice))
    : boxPrice;

  const round = (v: number) =>
    state.featureFlags.autoRoundCashEnabled ? Math.ceil(v * 2) / 2 : Math.round(v * 100) / 100;

  return {
    ...rule,
    stripsPerBox: strips,
    tabsPerStrip,
    totalTabs,
    boxPrice,
    markupActive,
    maxAllowedBase,
    effectiveLooseBase,
    stripPrice: round(effectiveLooseBase / strips),
    tabletPrice: round(effectiveLooseBase / totalTabs),
  };
}

export function unitsToBaseTablets(
  state: DawayaCommerceState,
  pharmacyId: string,
  medId: string,
  unit: RetailUnit,
  qty: number
): number {
  const c = computeUnitPricing(state, pharmacyId, medId);
  if (unit === 'box') return qty * c.totalTabs;
  if (unit === 'strip') return qty * c.tabsPerStrip;
  return qty;
}

export function formatShelfBreakdown(
  state: DawayaCommerceState,
  pharmacyId: string,
  medId: string
): string {
  const inv = state.inventories[pharmacyId]?.[medId];
  if (!inv) return '0 علبة';
  const c = computeUnitPricing(state, pharmacyId, medId);
  const total = Math.max(0, Math.round(inv.shelfUnits));
  const boxes = Math.floor(total / c.totalTabs);
  const rem = total % c.totalTabs;
  const strips = Math.floor(rem / c.tabsPerStrip);
  const tabs = rem % c.tabsPerStrip;
  return [
    `${boxes} علبة`,
    strips > 0 ? `${strips} شريط` : '',
    tabs > 0 ? `${tabs} حباية` : '',
  ]
    .filter(Boolean)
    .join(' + ');
}

export function isValidEgyptianMobile(phone: string): boolean {
  return /^01[0125][0-9]{8}$/.test((phone || '').trim());
}
