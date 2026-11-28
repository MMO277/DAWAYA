import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, configured } from './firebase';

export interface DynamicPlanPricing {
  id: string;
  nameAr: string;
  nameEn: string;
  audience: 'user' | 'pharmacy';
  monthlyEgp: number;
  annualEgp: number;
  badgeAr?: string;
  badgeEn?: string;
  accent: string;
  isPaid: boolean;
  featuresAr: string[];
  featuresEn: string[];
}

export interface PromoCodeRule {
  code: string;
  discountPercent: number; // 1 to 100
  active: boolean;
  appliesTo: 'all' | 'user' | 'pharmacy';
  note?: string;
  createdAtIso: string;
}

export interface SubscriptionCatalogConfig {
  plans: DynamicPlanPricing[];
  promos: PromoCodeRule[];
  updatedAtIso: string;
}

const LOCAL_KEY = 'dawaya_subscription_catalog_v2';

export const DEFAULT_SUBSCRIPTION_CATALOG: SubscriptionCatalogConfig = {
  plans: [
    {
      id: 'user_free',
      nameAr: 'الباقة الأساسية (مجاناً للأبد)',
      nameEn: 'Basic Plan (Free Forever)',
      audience: 'user',
      monthlyEgp: 0,
      annualEgp: 0,
      accent: '#0f766e',
      isPaid: false,
      featuresAr: [
        'البحث الفوري في 26,597 دواء مصري والبدائل الأرخص',
        'خريطة تحديد الألم التفاعلية وفاحص التداخلات أوفلاين',
        'ربط فرد واحد من العيلة مجاناً للتجربة في الرعاية العائلية',
        'منبّه الجرعات والجواز الصحي الرقمي (QR)',
      ],
      featuresEn: [
        'Instant offline search across 26,597 Egyptian medicines',
        'Interactive body pain mapper & offline interaction checker',
        'Link 1 family member free to try Family Care',
        'Smart dose reminders & Digital Health Passport (QR)',
      ],
    },
    {
      id: 'user_plus_family',
      nameAr: 'باقة العائلة (DAWAYA Plus)',
      nameEn: 'DAWAYA Plus Family Plan',
      audience: 'user',
      monthlyEgp: 29,
      annualEgp: 279,
      badgeAr: 'الأكثر توفيراً للأسرة',
      badgeEn: 'Best for Families',
      accent: '#0284c7',
      isPaid: true,
      featuresAr: [
        'ربط ومتابعة حتى 6 أفراد من الأسرة عن بُعد (الأب، الأم، الأطفال)',
        'إضافة وتعديل الأدوية ومواعيد الجرعات عن بُعد لموبايل الأهل',
        'قراءة غير محدودة للروشتات والتحاليل بالذكاء الاصطناعي',
        'تقارير طبية PDF شاملة جاهزة للعرض على الطبيب',
      ],
      featuresEn: [
        'Link & monitor up to 6 family members remotely',
        'Add and update medications & dose schedules remotely',
        'Unlimited AI prescription & lab report analysis',
        'Comprehensive clinical PDF reports for doctor visits',
      ],
    },
    {
      id: 'pharmacy_free_pilot',
      nameAr: 'باقة الانطلاق التجريبية (مجاناً)',
      nameEn: 'Pharmacy Launch Pilot (Free)',
      audience: 'pharmacy',
      monthlyEgp: 0,
      annualEgp: 0,
      accent: '#138866',
      isPaid: false,
      featuresAr: [
        'إدراج الصيدلية في دليل القرية والمركز والمحافظة',
        'استقبال اتصالات المرضى ورسائل الواتساب مباشرة',
        'تحديد مناطق التغطية والتوصيل',
      ],
      featuresEn: [
        'List your pharmacy in village, city & governorate directory',
        'Receive direct patient phone and WhatsApp inquiries',
        'Define local delivery coverage zones',
      ],
    },
    {
      id: 'pharmacy_pro',
      nameAr: 'باقة الصيدلية المميزة (Pharmacy Pro)',
      nameEn: 'Pharmacy Pro Plan',
      audience: 'pharmacy',
      monthlyEgp: 149,
      annualEgp: 1490,
      badgeAr: 'أولوية الظهور',
      badgeEn: 'Priority Listing',
      accent: '#0f766e',
      isPaid: true,
      featuresAr: [
        'شارة صيدلية موثقة + أولوية الظهور في نتائج البحث',
        'لوحة إدارة توافر النواقص وتحديث المخزون لحظياً',
        'استقبال طلبات الروشتات من المرضى القريبين',
        'تقارير وإحصائيات الزيارات والطلبات الشهرية',
      ],
      featuresEn: [
        'Verified badge + top priority in local search results',
        'Real-time shortage & stock availability board',
        'Receive nearby patient prescription requests',
        'Monthly traffic & order analytics',
      ],
    },
  ],
  promos: [
    {
      code: 'DAWAYA25',
      discountPercent: 25,
      active: true,
      appliesTo: 'all',
      note: 'خصم ترحيبي 25% لإطلاق دوايا',
      createdAtIso: new Date().toISOString(),
    },
  ],
  updatedAtIso: new Date().toISOString(),
};

const LOCAL_TS_KEY = 'dawaya_subscription_catalog_ts_v2';
const CATALOG_TTL_MS = 15 * 60 * 1000; // 15-min Smart Firestore Read Cache

export async function loadSubscriptionCatalog(forceRefresh = false): Promise<SubscriptionCatalogConfig> {
  if (!forceRefresh) {
    try {
      const ts = Number(localStorage.getItem(LOCAL_TS_KEY) || '0');
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw && Date.now() - ts < CATALOG_TTL_MS) {
        const parsed = JSON.parse(raw) as Partial<SubscriptionCatalogConfig>;
        if (Array.isArray(parsed.plans) && parsed.plans.length > 0) {
          return {
            plans: parsed.plans,
            promos: Array.isArray(parsed.promos) ? parsed.promos : [],
            updatedAtIso: parsed.updatedAtIso || new Date().toISOString(),
          };
        }
      }
    } catch {}
  }
  if (configured && db) {
    try {
      const snap = await getDoc(doc(db, 'platform_settings', 'pricing_and_promos'));
      if (snap.exists()) {
        const data = snap.data() as Partial<SubscriptionCatalogConfig>;
        if (Array.isArray(data.plans) && data.plans.length > 0) {
          const merged: SubscriptionCatalogConfig = {
            plans: data.plans,
            promos: Array.isArray(data.promos) ? data.promos : [],
            updatedAtIso: data.updatedAtIso || new Date().toISOString(),
          };
          try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
            localStorage.setItem(LOCAL_TS_KEY, String(Date.now()));
          } catch {}
          return merged;
        }
      }
    } catch {
      /* fallback to localStorage/default */
    }
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SubscriptionCatalogConfig>;
      if (Array.isArray(parsed.plans) && parsed.plans.length > 0) {
        return {
          plans: parsed.plans,
          promos: Array.isArray(parsed.promos) ? parsed.promos : [],
          updatedAtIso: parsed.updatedAtIso || new Date().toISOString(),
        };
      }
    }
  } catch {}
  return DEFAULT_SUBSCRIPTION_CATALOG;
}

export async function saveSubscriptionCatalog(cfg: SubscriptionCatalogConfig): Promise<void> {
  const clean: SubscriptionCatalogConfig = {
    plans: cfg.plans,
    promos: cfg.promos,
    updatedAtIso: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(clean));
    localStorage.setItem(LOCAL_TS_KEY, String(Date.now()));
  } catch {}
  if (configured && db) {
    await setDoc(
      doc(db, 'platform_settings', 'pricing_and_promos'),
      {
        ...clean,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export function computeFinalPrice(
  baseEgp: number,
  promo: PromoCodeRule | null
): { original: number; final: number; saved: number } {
  const original = Math.max(0, Math.round(baseEgp));
  if (!promo || !promo.active || promo.discountPercent <= 0) {
    return { original, final: original, saved: 0 };
  }
  const pct = Math.min(100, Math.max(0, promo.discountPercent));
  const saved = Math.round((original * pct) / 100);
  return { original, final: Math.max(0, original - saved), saved };
}
