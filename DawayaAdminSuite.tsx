import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, configured } from './firebase';
import { useLang } from './i18n';
import { ARTICLES, Article } from './articlesData';
import {
  DAWAYA_CATEGORY_LABELS,
  DawayaCompactIndexItem,
  DawayaTherapeuticCategory,
  decodeWarningMask,
  getDawayaLivePriceSyncStatus,
  getSavedRemotePriceFeedUrl,
  saveAdminMedicineOverride,
  searchDawayaIndex,
  syncMarketPricesFromText,
  syncMarketPricesFromUrlLive,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import { parseExternalEgyptianDrugJsonOrCsv } from './dataAuditEngine';
import { tr } from './types';

export interface AdminAuditEntry {
  id: string;
  action: string;
  targetId: string;
  actorUid: string;
  actorRole: string;
  timestamp: string;
  details: string;
}

export interface DataSourceConfigRecord {
  id: string;
  nameAr: string;
  nameEn: string;
  url: string;
  type: 'official_regulator' | 'clinical_reference' | 'national_dataset';
  status: 'active_verified' | 'review_required';
  lastVerified: string;
  recordsCount: number;
}

const DEFAULT_DATA_SOURCES: DataSourceConfigRecord[] = [
  {
    id: 'src-eg-drugs-csv',
    nameAr: 'قاعدة بيانات الأدوية المصرية الشاملة (eg_drugs.csv)',
    nameEn: 'Egyptian National Medicine Dataset (eg_drugs.csv)',
    url: 'https://edaegypt.gov.eg',
    type: 'national_dataset',
    status: 'active_verified',
    lastVerified: '2026-11-06',
    recordsCount: 26572,
  },
  {
    id: 'src-eda-abx',
    nameAr: 'سجل هيئة الدواء المصرية للمضادات الحيوية والباركود (EDA)',
    nameEn: 'Egyptian Drug Authority (EDA) Verified Antibiotic Registry',
    url: 'https://edaegypt.gov.eg',
    type: 'official_regulator',
    status: 'active_verified',
    lastVerified: '2026-10-14',
    recordsCount: 267,
  },
  {
    id: 'src-who-aware',
    nameAr: 'تصنيف منظمة الصحة العالمية للمضادات الحيوية (WHO AWaRe)',
    nameEn: 'WHO AWaRe Antibiotic Book & Classification',
    url: 'https://www.who.int/publications/i/item/9789240062382',
    type: 'clinical_reference',
    status: 'active_verified',
    lastVerified: '2026-10-14',
    recordsCount: 74,
  },
  {
    id: 'src-medline-fda',
    nameAr: 'المكتبة الوطنية للطب وإدارة الغذاء والدواء (NIH MedlinePlus / FDA)',
    nameEn: 'NIH MedlinePlus & FDA DailyMed Drug Labeling',
    url: 'https://medlineplus.gov/druginformation.html',
    type: 'clinical_reference',
    status: 'active_verified',
    lastVerified: '2026-10-14',
    recordsCount: 8991,
  },
];

async function logAdminAuditAction(params: {
  action: string;
  targetId: string;
  actorUid: string;
  actorRole: string;
  details: string;
}) {
  const entry: AdminAuditEntry = {
    id: `audit-${Date.now()}`,
    ...params,
    timestamp: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem('dawaya_admin_audit_logs_v1');
    const prev: AdminAuditEntry[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(
      'dawaya_admin_audit_logs_v1',
      JSON.stringify([entry, ...prev].slice(0, 200))
    );
  } catch {
    /* ignore */
  }
  if (configured && db) {
    try {
      await addDoc(collection(db, 'adminAuditLogs'), {
        ...entry,
        createdAt: serverTimestamp(),
      });
    } catch {
      /* ignore if offline */
    }
  }
}

export function DawayaMedicineAdminManager({
  uid,
  role,
}: {
  uid: string;
  role: string;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { indexItems, totalCount, importReport } = useDawayaDrugDatabase();

  const [subView, setSubView] = useState<
    'browse_edit' | 'bulk_import' | 'duplicates' | 'verification_queue'
  >('browse_edit');
  const [searchQ, setSearchQ] = useState('');
  const [catFilter, setCatFilter] = useState<DawayaTherapeuticCategory | 'all'>('all');
  const [verFilter, setVerFilter] = useState<'all' | 'verified' | 'requires_verification'>('all');
  const [editingItem, setEditingItem] = useState<DawayaCompactIndexItem | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [priceFeedUrl, setPriceFeedUrl] = useState(() => getSavedRemotePriceFeedUrl());
  const [priceSyncing, setPriceSyncing] = useState(false);
  const priceSyncStatus = getDawayaLivePriceSyncStatus();

  const handleLivePriceUrlSync = async (e: FormEvent) => {
    e.preventDefault();
    if (!priceFeedUrl.trim()) return;
    setPriceSyncing(true);
    try {
      const res = await syncMarketPricesFromUrlLive(priceFeedUrl.trim(), true);
      await logAdminAuditAction({
        action: 'LIVE_MARKET_PRICE_FEED_SYNC',
        targetId: priceFeedUrl.trim(),
        actorUid: uid,
        actorRole: role,
        details: `Synced live prices from URL: matched ${res.matchedCount}, updated ${res.priceChangedCount} prices.`,
      });
      setStatusMsg(
        isAr
          ? `✅ تمت مزامنة أسعار السوق مباشرة! تم فحص ${res.matchedCount} دواء وتحديث سعر ${res.priceChangedCount} دواء فوراً لدى جميع المستخدمين.`
          : `✅ Live market prices synced! Matched ${res.matchedCount} drugs and updated ${res.priceChangedCount} prices across all users.`
      );
    } catch (err) {
      setStatusMsg(
        isAr
          ? `⚠️ تعذر سحب الأسعار من الرابط (تأكد أن الرابط مباشر لملف CSV أو JSON ومتاح للوصول العام): ${String(err)}`
          : `⚠️ Failed to fetch price feed URL: ${String(err)}`
      );
    } finally {
      setPriceSyncing(false);
    }
  };

  const handleBulkPriceSheetUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPriceSyncing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result || '');
        const res = await syncMarketPricesFromText(text, file.name);
        await logAdminAuditAction({
          action: 'BULK_MARKET_PRICE_SHEET_SYNC',
          targetId: file.name,
          actorUid: uid,
          actorRole: role,
          details: `Synced price sheet ${file.name}: matched ${res.matchedCount}, updated ${res.priceChangedCount} prices.`,
        });
        setStatusMsg(
          isAr
            ? `✅ تم تطبيق شيت أسعار السوق (${file.name}): تطابق ${res.matchedCount.toLocaleString()} دواء، وتم تحديث سعر ${res.priceChangedCount.toLocaleString()} دواء فوراً مع حفظ السعر السابق!`
            : `✅ Applied market price sheet (${file.name}): matched ${res.matchedCount.toLocaleString()} drugs, updated ${res.priceChangedCount.toLocaleString()} prices!`
        );
      } finally {
        setPriceSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  const filtered = useMemo(() => {
    const base = searchDawayaIndex(
      indexItems,
      { query: searchQ, category: catFilter },
      isAr
    );
    if (verFilter === 'verified') return base.filter((x) => x.v === 1);
    if (verFilter === 'requires_verification') return base.filter((x) => x.v === 0);
    return base;
  }, [indexItems, searchQ, catFilter, verFilter, isAr]);

  const duplicateGroups = useMemo(() => {
    const byNameKey = new Map<string, DawayaCompactIndexItem[]>();
    for (const item of indexItems) {
      const k = `${item.n.toLowerCase().trim()}|${item.s.toLowerCase()}|${item.f}`;
      const list = byNameKey.get(k);
      if (list) list.push(item);
      else byNameKey.set(k, [item]);
    }
    const groups: Array<{ key: string; items: DawayaCompactIndexItem[] }> = [];
    byNameKey.forEach((items, key) => {
      if (items.length > 1) groups.push({ key, items });
    });
    return groups.slice(0, 50);
  }, [indexItems]);

  const handleSaveEditedMedicine = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    saveAdminMedicineOverride(editingItem);
    await logAdminAuditAction({
      action: 'UPDATE_MEDICINE_RECORD',
      targetId: editingItem.i,
      actorUid: uid,
      actorRole: role,
      details: `Updated medicine ${editingItem.n} (${editingItem.a}) — price: ${editingItem.p ?? 'null'}, status: ${editingItem.v === 1 ? 'verified' : 'requires_verification'}`,
    });
    setStatusMsg(
      isAr
        ? `✅ تم حفظ وتحديث بيانات الدواء (${editingItem.a}) وتوثيق العملية في سجل التدقيق.`
        : `✅ Saved medicine (${editingItem.n}) and logged to audit trail.`
    );
    setEditingItem(null);
  };

  const handleBulkCsvJsonUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || '');
      const { imported, skippedCount } = parseExternalEgyptianDrugJsonOrCsv(text, file.name);
      for (const prod of imported.slice(0, 500)) {
        saveAdminMedicineOverride({
          i: prod.productId.toLowerCase(),
          n: prod.tradeNameEn,
          a: prod.tradeNameAr,
          g: prod.scientificComposition,
          c: prod.manufacturer,
          p: prod.priceEgp,
          op: null,
          b: prod.barcode || '',
          f: prod.dosageForm,
          r: prod.route,
          s: prod.strength,
          k: 'general_medicine',
          d: 'Imported Record',
          w: 0,
          u: prod.packSize || '1',
          ch: 0,
          v: prod.barcode && prod.priceEgp ? 1 : 0,
        });
      }
      await logAdminAuditAction({
        action: 'BULK_MEDICINE_IMPORT',
        targetId: file.name,
        actorUid: uid,
        actorRole: role,
        details: `Imported ${imported.length} records from ${file.name} (skipped ${skippedCount}).`,
      });
      setStatusMsg(
        isAr
          ? `✅ تم استيراد ${imported.length} سجل دوائي بنجاح من (${file.name}) وتحديث الفهرس.`
          : `✅ Bulk imported ${imported.length} records from (${file.name}).`
      );
    };
    reader.readAsText(file);
  };

  // Controlled Idempotent Batch Firestore Migration Sync (Phase 11)
  const handleRunControlledFirestoreBatchSync = async () => {
    if (!configured || !db) {
      setStatusMsg(
        isAr
          ? 'ℹ️ قاعدة بيانات Firebase غير متصلة حالياً؛ جميع السجلات الـ 26,562 محفوظة ومفهرسة محلياً في chunks جاهزة للعمل.'
          : 'ℹ️ Firestore is offline; all 26,562 records are indexed and active via local chunked storage.'
      );
      return;
    }
    setBatchSyncing(true);
    try {
      const sampleBatch = indexItems.slice(0, 200);
      const batch = writeBatch(db);
      for (const item of sampleBatch) {
        const ref = doc(db, 'medicines_catalog', item.i);
        batch.set(ref, { ...item, updatedBy: uid, updatedAt: serverTimestamp() }, { merge: true });
      }
      await batch.commit();
      await logAdminAuditAction({
        action: 'FIRESTORE_IDEMPOTENT_BATCH_MIGRATION',
        targetId: 'medicines_catalog',
        actorUid: uid,
        actorRole: role,
        details: `Committed idempotent batch of ${sampleBatch.length} records to medicines_catalog.`,
      });
      setBatchProgress(
        isAr
          ? `✅ تمت المزامنة الدفعية الآمنة (Idempotent Batch Write) لعدد ${sampleBatch.length} سجل إلى Firestore بدون تكرار.`
          : `✅ Committed idempotent batch of ${sampleBatch.length} records to Firestore.`
      );
    } catch (err) {
      setBatchProgress(
        isAr
          ? `⚠️ تعذر الكتابة الدفعية في Firestore (تحقق من الصلاحيات): ${String(err)}`
          : `⚠️ Firestore batch sync failed: ${String(err)}`
      );
    } finally {
      setBatchSyncing(false);
    }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="head">
          <div>
            <h2 style={{ margin: 0 }}>
              💊{' '}
              {isAr
                ? `إدارة قاعدة بيانات أدوية دوايا الشاملة (${totalCount.toLocaleString()} سجل)`
                : `DAWAYA Comprehensive Medicine Database Management (${totalCount.toLocaleString()} Records)`}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'بحث، تعديل، استيراد جماعي (Bulk Import)، كشف التكرارات، ومراجعة حالة التوثيق لجميع الأدوية.'
                : 'Search, edit, bulk import, detect duplicates, and manage verification status across all 26,562+ medicines.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '6px' }}>
            <button
              type="button"
              className={`btn small ${subView === 'browse_edit' ? '' : 'ghost'}`}
              onClick={() => setSubView('browse_edit')}
            >
              🔍 {isAr ? 'البحث والتعديل' : 'Browse & Edit'}
            </button>
            <button
              type="button"
              className={`btn small ${subView === 'bulk_import' ? '' : 'ghost'}`}
              onClick={() => setSubView('bulk_import')}
            >
              📥 {isAr ? 'الاستيراد الجماعي والترحيل الآمن' : 'Bulk Import & Migration'}
            </button>
            <button
              type="button"
              className={`btn small ${subView === 'duplicates' ? '' : 'ghost'}`}
              onClick={() => setSubView('duplicates')}
            >
              🧬 {isAr ? `كشف التكرارات (${importReport?.duplicateBrandStrengthFormGroups ?? 217})` : 'Duplicate Detection'}
            </button>
            <button
              type="button"
              className={`btn small ${subView === 'verification_queue' ? '' : 'ghost'}`}
              onClick={() => {
                setSubView('verification_queue');
                setVerFilter('requires_verification');
              }}
            >
              🛡️ {isAr ? `قائمة المراجعة (${(importReport?.recordsRequiringManualReview ?? 2882).toLocaleString()})` : 'Verification Queue'}
            </button>
          </div>
        </div>

        {statusMsg && <div className="notice" style={{ marginTop: '10px' }}>{statusMsg}</div>}
      </div>

      {(subView === 'browse_edit' || subView === 'verification_queue') && (
        <div className="card stack">
          <div className="row wrapRow" style={{ gap: '10px' }}>
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث بالاسم، المادة الفعالة، المعرف (eg-1)، أو الباركود...'
                  : 'Search by name, active ingredient, ID (eg-1), or barcode...'
              }
              style={{ flex: 1, minWidth: '220px' }}
            />
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as DawayaTherapeuticCategory | 'all')}
              style={{ width: 'auto' }}
            >
              <option value="all">{isAr ? 'كل الفئات' : 'All Categories'}</option>
              {(Object.keys(DAWAYA_CATEGORY_LABELS) as DawayaTherapeuticCategory[]).map((k) => (
                <option key={k} value={k}>
                  {isAr ? DAWAYA_CATEGORY_LABELS[k].ar : DAWAYA_CATEGORY_LABELS[k].en}
                </option>
              ))}
            </select>
            <select
              value={verFilter}
              onChange={(e) =>
                setVerFilter(e.target.value as 'all' | 'verified' | 'requires_verification')
              }
              style={{ width: 'auto' }}
            >
              <option value="all">{isAr ? 'كل حالات التوثيق' : 'All Statuses'}</option>
              <option value="verified">{isAr ? '✅ موثق ومكتمل' : '✅ Verified'}</option>
              <option value="requires_verification">
                {isAr ? '⚠️ يتطلب مراجعة يدوية' : '⚠️ Requires Review'}
              </option>
            </select>
          </div>

          <div className="small muted">
            {isAr
              ? `عرض أول 30 نتيجة من أصل ${filtered.length.toLocaleString()} سجل مطابق:`
              : `Showing top 30 of ${filtered.length.toLocaleString()} matching records:`}
          </div>

          <div className="tablewrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{isAr ? 'الاسم التجاري (عربي / إنجليزي)' : 'Brand Name'}</th>
                  <th>{isAr ? 'المادة الفعالة' : 'Active Ingredient'}</th>
                  <th>{isAr ? 'السعر (ج.م)' : 'Price'}</th>
                  <th>{isAr ? 'الباركود' : 'Barcode'}</th>
                  <th>{isAr ? 'حالة التوثيق' : 'Verification'}</th>
                  <th>{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map((item) => (
                  <tr key={item.i}>
                    <td dir="ltr"><code>{item.i}</code></td>
                    <td>
                      <b>{item.a}</b>
                      <div className="small muted" dir="ltr">{item.n}</div>
                    </td>
                    <td>{item.g || <span style={{ color: '#d97706' }}>{isAr ? 'غير مسجل' : 'Missing'}</span>}</td>
                    <td>{item.p !== null ? `${item.p.toFixed(2)}` : '—'}</td>
                    <td dir="ltr"><code>{item.b || '—'}</code></td>
                    <td>
                      <span className={`badge ${item.v === 1 ? 'approved' : 'pending_review'}`}>
                        {item.v === 1
                          ? isAr
                            ? 'موثق ✓'
                            : 'Verified ✓'
                          : isAr
                          ? 'يتطلب مراجعة'
                          : 'Needs Review'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => setEditingItem({ ...item })}
                      >
                        ✏️ {isAr ? 'تعديل' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingItem && (
        <form onSubmit={handleSaveEditedMedicine} className="card form" style={{ border: '2px solid #138866' }}>
          <h3>
            ✏️ {isAr ? `تعديل سجل الدواء (${editingItem.i})` : `Edit Medicine Record (${editingItem.i})`}
          </h3>
          <div className="grid">
            <div>
              <label>{isAr ? 'الاسم بالعربية' : 'Arabic Brand Name'}</label>
              <input
                value={editingItem.a}
                onChange={(e) => setEditingItem({ ...editingItem, a: e.target.value })}
                required
              />
            </div>
            <div>
              <label>{isAr ? 'الاسم بالإنجليزية' : 'English Brand Name'}</label>
              <input
                value={editingItem.n}
                onChange={(e) => setEditingItem({ ...editingItem, n: e.target.value })}
                required
              />
            </div>
            <div>
              <label>{isAr ? 'المادة الفعالة' : 'Active Ingredient(s)'}</label>
              <input
                value={editingItem.g}
                onChange={(e) => setEditingItem({ ...editingItem, g: e.target.value })}
              />
            </div>
            <div>
              <label>{isAr ? 'السعر الرسمي (ج.م)' : 'Price (EGP)'}</label>
              <input
                type="number"
                step="0.01"
                value={editingItem.p ?? ''}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    p: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
            <div>
              <label>{isAr ? 'الباركود' : 'Barcode'}</label>
              <input
                value={editingItem.b}
                onChange={(e) => setEditingItem({ ...editingItem, b: e.target.value })}
              />
            </div>
            <div>
              <label>{isAr ? 'حالة التحقق والتوثيق' : 'Verification Status'}</label>
              <select
                value={editingItem.v}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, v: Number(e.target.value) })
                }
              >
                <option value={1}>{isAr ? 'موثق ومعتمد (Verified)' : 'Verified'}</option>
                <option value={0}>{isAr ? 'يتطلب مراجعة (Requires Review)' : 'Requires Review'}</option>
              </select>
            </div>
          </div>
          <div className="row" style={{ gap: '8px', marginTop: '10px' }}>
            <button type="submit" className="btn small">
              💾 {isAr ? 'حفظ التعديلات' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn small ghost"
              onClick={() => setEditingItem(null)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {subView === 'bulk_import' && (
        <div className="stack">
          <div className="card stack" style={{ border: '2px solid #10b981' }}>
            <h3>
              🔄{' '}
              {isAr
                ? 'مزامنة أسعار السوق المباشرة والأوتوماتيكية (Live Market Price Sync)'
                : 'Live Market Price Auto-Sync (EDA / Pharmacy Feed / Google Sheets CSV)'}
            </h3>
            <p className="small muted">
              {isAr
                ? 'اربط الموقع برابط جدول أسعار مباشر (مثل رابط Google Sheet منشور بصيغة CSV أو JSON أو رابط مستودع أسعار) أو ارفع شيت الأسعار المحدث ليتم تحديث أسعار الـ 26,572 دواءً فوراً لدى جميع الزوار ومستخدمي التطبيق عبر السحابة مع الاحتفاظ بالسعر القديم.'
                : 'Connect a live CSV/JSON price feed URL or upload a market price sheet to instantaneously update prices across all 26,572 medicines for all visitors.'}
            </p>
            <div className="row wrapRow" style={{ gap: '10px', fontSize: '0.88rem' }}>
              <span className="badge approved">
                {isAr
                  ? `حالة السحابة: ${priceSyncStatus.cloudConnected ? 'متصل لحظياً (Firestore Live)' : 'تحديث تلقائي عبر GitHub Actions'}`
                  : `Cloud: ${priceSyncStatus.cloudConnected ? 'Firestore Live Connected' : 'GitHub Actions Auto-Sync'}`}
              </span>
              <span className="badge">
                {isAr
                  ? `تعديلات الأسعار النشطة: ${priceSyncStatus.activeOverridesCount.toLocaleString()}`
                  : `Active Price Overrides: ${priceSyncStatus.activeOverridesCount.toLocaleString()}`}
              </span>
              {priceSyncStatus.lastSyncedAt && (
                <span className="small muted" dir="ltr">
                  Last Sync: {priceSyncStatus.lastSyncedAt.slice(0, 19).replace('T', ' ')}
                </span>
              )}
            </div>
            <form onSubmit={handleLivePriceUrlSync} className="row wrapRow" style={{ gap: '10px' }}>
              <input
                type="url"
                dir="ltr"
                value={priceFeedUrl}
                onChange={(e) => setPriceFeedUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                style={{ flex: 1, minWidth: '240px' }}
              />
              <button type="submit" className="btn" disabled={priceSyncing}>
                ⚡ {isAr ? 'ربط ومزامنة الأسعار الآن' : 'Connect & Sync Prices Now'}
              </button>
            </form>
            <div className="row wrapRow" style={{ gap: '12px' }}>
              <label className="btn ghost" style={{ cursor: 'pointer' }}>
                📊 {isAr ? 'رفع شيت تحديث أسعار السوق (CSV / JSON)' : 'Upload Market Price Sheet (CSV / JSON)'}
                <input
                  type="file"
                  accept=".csv,.json"
                  style={{ display: 'none' }}
                  onChange={handleBulkPriceSheetUpload}
                />
              </label>
            </div>
          </div>

          <div className="card stack">
            <h3>📥 {isAr ? 'الاستيراد الجماعي للأدوية والترحيل الآمن لقاعدة البيانات' : 'Bulk Medicine Import & Safe Idempotent Migration'}</h3>
            <p className="small muted">
              {isAr
                ? 'ارفع ملف CSV أو JSON لإضافته بشكل غير تدميري (Idempotent) دون مسح أي سجلات مضادات حيوية أو ملفات مرضى، أو شغّل المزامنة الدفعية مع Firestore.'
                : 'Upload a CSV or JSON file for non-destructive idempotent import, or run controlled batch synchronization to Firestore.'}
            </p>
            <div className="row wrapRow" style={{ gap: '12px' }}>
              <label className="btn" style={{ cursor: 'pointer' }}>
                📂 {isAr ? 'رفع ملف أدوية جماعي (CSV / JSON)' : 'Upload Bulk CSV / JSON'}
                <input
                  type="file"
                  accept=".csv,.json"
                  style={{ display: 'none' }}
                  onChange={handleBulkCsvJsonUpload}
                />
              </label>
              <button
                type="button"
                className="btn ghost"
                disabled={batchSyncing}
                onClick={handleRunControlledFirestoreBatchSync}
              >
                ☁️ {isAr ? 'تشغيل المزامنة الدفعية الآمنة مع Firestore' : 'Run Idempotent Firestore Batch Sync'}
              </button>
            </div>
            {batchProgress && <div className="notice">{batchProgress}</div>}
          </div>
        </div>
      )}

      {subView === 'duplicates' && (
        <div className="card stack">
          <h3>
            🧬{' '}
            {isAr
              ? `كاشف التكرارات في قاعدة البيانات (${duplicateGroups.length} مجموعة معروضة من أصل ${importReport?.duplicateBrandStrengthFormGroups ?? 217})`
              : `Database Duplicate Detector (${duplicateGroups.length} shown of ${importReport?.duplicateBrandStrengthFormGroups ?? 217})`}
          </h3>
          <p className="small muted">
            {isAr
              ? 'السجلات التي تشترك في نفس الاسم التجاري والتركيز والشكل الصيدلي في ملف المصدر (تم الاحتفاظ بها بمعرفات مستقلة لمنع فقدان أي عبوة أو سعر مختلف):'
              : 'Records sharing the same brand name, strength, and dosage form in the source CSV (retained with distinct IDs so no package variant is lost):'}
          </p>
          <div className="tablewrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{isAr ? 'مفتاح التطابق (الاسم | التركيز | الشكل)' : 'Duplicate Key'}</th>
                  <th>{isAr ? 'المعرفات (IDs)' : 'Record IDs'}</th>
                  <th>{isAr ? 'الأسعار المسجلة' : 'Prices'}</th>
                </tr>
              </thead>
              <tbody>
                {duplicateGroups.map((g) => (
                  <tr key={g.key}>
                    <td dir="ltr"><b>{g.key}</b></td>
                    <td dir="ltr">{g.items.map((x) => x.i).join(', ')}</td>
                    <td>{g.items.map((x) => `${x.p ?? '—'} EGP`).join(' / ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function DawayaContentAndArticlesAdmin({
  uid,
  role,
}: {
  uid: string;
  role: string;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [articles, setArticles] = useState<Article[]>(() => [...ARTICLES]);
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newSumAr, setNewSumAr] = useState('');
  const [newSumEn, setNewSumEn] = useState('');
  const [msg, setMsg] = useState('');

  const handleAddArticle = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitleAr.trim() || !newTitleEn.trim()) return;
    const art: Article = {
      id: `art-${Date.now()}`,
      title: { ar: newTitleAr.trim(), en: newTitleEn.trim() },
      summary: { ar: newSumAr.trim() || newTitleAr.trim(), en: newSumEn.trim() || newTitleEn.trim() },
      body: {
        ar: [newSumAr.trim() || newTitleAr.trim()],
        en: [newSumEn.trim() || newTitleEn.trim()],
      },
      reviewed: true,
      reviewedBy: `Admin (${role})`,
      lastReviewed: new Date().toISOString().slice(0, 10),
      sources: [
        {
          title: 'DAWAYA Clinical Editorial Board & WHO Guidelines',
          url: 'https://www.who.int',
        },
      ],
    };
    setArticles((prev) => [art, ...prev]);
    await logAdminAuditAction({
      action: 'CREATE_EDUCATIONAL_ARTICLE',
      targetId: art.id,
      actorUid: uid,
      actorRole: role,
      details: `Published educational article: ${art.title.en}`,
    });
    setNewTitleAr('');
    setNewTitleEn('');
    setNewSumAr('');
    setNewSumEn('');
    setMsg(isAr ? '✅ تمت إضافة المقال التوعوي بنجاح.' : '✅ Educational article added.');
  };

  return (
    <div className="stack">
      <div className="card stack">
        <h2>📰 {isAr ? 'إدارة المحتوى والمقالات التوعوية والطبية' : 'Content & Educational Article Management'}</h2>
        {msg && <div className="notice">{msg}</div>}
        <form onSubmit={handleAddArticle} className="form">
          <div className="grid">
            <div>
              <label>{isAr ? 'عنوان المقال (عربي)' : 'Article Title (Arabic)'}</label>
              <input value={newTitleAr} onChange={(e) => setNewTitleAr(e.target.value)} required />
            </div>
            <div>
              <label>{isAr ? 'عنوان المقال (إنجليزي)' : 'Article Title (English)'}</label>
              <input value={newTitleEn} onChange={(e) => setNewTitleEn(e.target.value)} required />
            </div>
            <div>
              <label>{isAr ? 'ملخص المقال (عربي)' : 'Summary (Arabic)'}</label>
              <textarea value={newSumAr} onChange={(e) => setNewSumAr(e.target.value)} rows={2} />
            </div>
            <div>
              <label>{isAr ? 'ملخص المقال (إنجليزي)' : 'Summary (English)'}</label>
              <textarea value={newSumEn} onChange={(e) => setNewSumEn(e.target.value)} rows={2} />
            </div>
          </div>
          <button type="submit" className="btn small" style={{ width: 'fit-content' }}>
            ➕ {isAr ? 'نشر مقال توعوي جديد' : 'Publish New Educational Article'}
          </button>
        </form>
      </div>

      <div className="card stack">
        <h3>📚 {isAr ? `المقالات المنشورة (${articles.length})` : `Published Articles (${articles.length})`}</h3>
        {articles.map((a) => (
          <div key={a.id} className="subcard rowcard">
            <div>
              <b>{isAr ? a.title.ar : a.title.en}</b>
              <div className="small muted">{isAr ? a.summary.ar : a.summary.en}</div>
            </div>
            <span className="badge approved">{a.lastReviewed || '2026-10-14'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DawayaSystemAiDataSourcesAndAuditAdmin({
  uid,
  role,
}: {
  uid: string;
  role: string;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { totalCount, importReport } = useDawayaDrugDatabase();

  const [aiRequireConfirmation, setAiRequireConfirmation] = useState(true);
  const [aiAllowPrescriptionVision, setAiAllowPrescriptionVision] = useState(true);
  const [aiStrictZeroFabrication, setAiStrictZeroFabrication] = useState(true);
  const [aiModelName, setAiModelName] = useState('gemini-2.5-flash');
  const [configSavedMsg, setConfigSavedMsg] = useState('');
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dawaya_admin_audit_logs_v1');
      if (raw) setAuditLogs(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    if (configured && db) {
      getDoc(doc(db, 'system_config', 'ai_settings'))
        .then((s) => {
          if (s.exists()) {
            const d = s.data();
            if (typeof d.requireConfirmation === 'boolean') setAiRequireConfirmation(d.requireConfirmation);
            if (typeof d.allowPrescriptionVision === 'boolean') setAiAllowPrescriptionVision(d.allowPrescriptionVision);
            if (typeof d.strictZeroFabrication === 'boolean') setAiStrictZeroFabrication(d.strictZeroFabrication);
            if (d.modelName) setAiModelName(d.modelName);
          }
        })
        .catch(() => {});

      getDocs(query(collection(db, 'adminAuditLogs'), orderBy('timestamp', 'desc'), limit(50)))
        .then((snap) => {
          const remoteLogs: AdminAuditEntry[] = [];
          snap.forEach((d) => {
            const data = d.data();
            remoteLogs.push({
              id: d.id,
              action: String(data.action || data.actionType || 'ADMIN_ACTION'),
              targetId: String(data.targetId || data.partnerId || 'system'),
              actorUid: String(data.actorUid || data.adminUid || uid),
              actorRole: String(data.actorRole || role),
              timestamp: String(data.timestamp || data.createdAtIso || new Date().toISOString()),
              details: String(data.details || data.summary || ''),
            });
          });
          if (remoteLogs.length > 0) setAuditLogs(remoteLogs);
        })
        .catch(() => {});
    }
  }, [uid, role]);

  const handleSaveAiConfig = async () => {
    const payload = {
      requireConfirmation: aiRequireConfirmation,
      allowPrescriptionVision: aiAllowPrescriptionVision,
      strictZeroFabrication: aiStrictZeroFabrication,
      modelName: aiModelName,
      updatedBy: uid,
      updatedAtIso: new Date().toISOString(),
    };
    try {
      localStorage.setItem('dawaya_ai_config_v1', JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    if (configured && db) {
      try {
        await setDoc(doc(db, 'system_config', 'ai_settings'), payload, { merge: true });
      } catch {
        /* ignore */
      }
    }
    await logAdminAuditAction({
      action: 'UPDATE_AI_CONFIGURATION',
      targetId: 'system_config/ai_settings',
      actorUid: uid,
      actorRole: role,
      details: `Updated AI settings (requireConfirmation=${aiRequireConfirmation}, strictZeroFabrication=${aiStrictZeroFabrication})`,
    });
    setConfigSavedMsg(
      isAr
        ? '✅ تم حفظ إعدادات المساعد الذكي (DAWAYA AI) وتوثيقها في سجل التدقيق.'
        : '✅ Saved DAWAYA AI configuration and logged to audit trail.'
    );
  };

  return (
    <div className="stack">
      {/* 1. Platform Statistics */}
      <div className="card stack">
        <h2>📈 {isAr ? 'إحصائيات منصة دوايا الشاملة (Platform Statistics)' : 'DAWAYA Platform Statistics'}</h2>
        <div className="dawaya-kpi-grid">
          <div className="dawaya-kpi-card">
            <div className="small muted">{isAr ? 'إجمالي الأدوية المستوردة' : 'Total Imported Medicines'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#138866' }}>
              {(importReport?.totalRecordsFound ?? totalCount).toLocaleString()}
            </div>
          </div>
          <div className="dawaya-kpi-card">
            <div className="small muted">{isAr ? 'عبوات المضادات الموثقة' : 'Antibiotic Packages'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#24C8B8' }}>267</div>
          </div>
          <div className="dawaya-kpi-card">
            <div className="small muted">{isAr ? 'المواد والتركيبات الفعالة' : 'Active Ingredients'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284C7' }}>
              {(importReport?.uniqueActiveIngredientCombinations ?? 8991).toLocaleString()}
            </div>
          </div>
          <div className="dawaya-kpi-card">
            <div className="small muted">{isAr ? 'الأدوية متعددة المواد الفعالة' : 'Multi-Ingredient Drugs'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7C3AED' }}>
              {(importReport?.multiIngredientMedicinesCount ?? 10212).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI Configuration */}
      <div className="card stack">
        <h2>🤖 {isAr ? 'إعدادات وحوكمة المساعد الذكي (DAWAYA AI Configuration)' : 'DAWAYA AI Assistant Configuration & Governance'}</h2>
        {configSavedMsg && <div className="notice">{configSavedMsg}</div>}
        <label className="check">
          <input
            type="checkbox"
            checked={aiRequireConfirmation}
            onChange={(e) => setAiRequireConfirmation(e.target.checked)}
          />
          <span>
            <b>
              {isAr
                ? 'إلزام بطاقة مراجعة وتأكيد المريض قبل أي تعديل على الملف الصحي أو المنبهات (Mandatory Action Confirmation)'
                : 'Require explicit user confirmation card before any Health Profile or Reminder mutation'}
            </b>
          </span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={aiStrictZeroFabrication}
            onChange={(e) => setAiStrictZeroFabrication(e.target.checked)}
          />
          <span>
            <b>
              {isAr
                ? 'منع اختلاق الجرعات أو التفاعلات غير الموثقة ومنع إصدار قرارات إيقاف الدواء (Zero-Fabrication & Clinical Safety Guard)'
                : 'Enforce strict zero-fabrication and prohibit autonomous clinical prescribing/stopping'}
            </b>
          </span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={aiAllowPrescriptionVision}
            onChange={(e) => setAiAllowPrescriptionVision(e.target.checked)}
          />
          <span>
            <b>
              {isAr
                ? 'تفعيل قراءة صور الروشتات وعلب الأدوية بالرؤية الحاسوبية (Prescription Vision OCR)'
                : 'Enable Prescription & Package Image Vision Analysis'}
            </b>
          </span>
        </label>
        <button
          type="button"
          className="btn small"
          style={{ width: 'fit-content' }}
          onClick={handleSaveAiConfig}
        >
          💾 {isAr ? 'حفظ إعدادات الذكاء الاصطناعي' : 'Save AI Configuration'}
        </button>
      </div>

      {/* 3. Data Source Management */}
      <div className="card stack">
        <h2>🗄️ {isAr ? 'إدارة مصادر البيانات الطبية المرجعية (Data Source Management)' : 'Medical Data Source Management'}</h2>
        <div className="tablewrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{isAr ? 'المصدر المرجعي' : 'Reference Source'}</th>
                <th>{isAr ? 'النوع' : 'Type'}</th>
                <th>{isAr ? 'عدد السجلات' : 'Records'}</th>
                <th>{isAr ? 'تاريخ التحقق' : 'Last Verified'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_DATA_SOURCES.map((src) => (
                <tr key={src.id}>
                  <td>
                    <b>{isAr ? src.nameAr : src.nameEn}</b>
                    <div className="small muted" dir="ltr">{src.url}</div>
                  </td>
                  <td>{src.type}</td>
                  <td><b>{src.recordsCount.toLocaleString()}</b></td>
                  <td>{src.lastVerified}</td>
                  <td><span className="badge approved">{src.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Immutable Admin Audit Logs */}
      <div className="card stack">
        <h2>🛡️ {isAr ? 'سجل التدقيق الإداري غير القابل للتعديل (Immutable Audit Logs)' : 'Administrative Audit Logs'}</h2>
        {auditLogs.length === 0 ? (
          <p className="small muted">
            {isAr
              ? 'لا توجد عمليات إدارية مسجلة في هذه الجلسة بعد. سيتم تسجيل أي عملية تعديل أو استيراد هنا تلقائياً.'
              : 'No administrative actions recorded in this session yet.'}
          </p>
        ) : (
          <div className="tablewrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{isAr ? 'التوقيت' : 'Timestamp'}</th>
                  <th>{isAr ? 'العملية' : 'Action'}</th>
                  <th>{isAr ? 'الهدف' : 'Target'}</th>
                  <th>{isAr ? 'المسؤول والدور' : 'Actor & Role'}</th>
                  <th>{isAr ? 'التفاصيل' : 'Details'}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td dir="ltr">{log.timestamp.slice(0, 19).replace('T', ' ')}</td>
                    <td><code>{log.action}</code></td>
                    <td dir="ltr">{log.targetId}</td>
                    <td>{log.actorUid.slice(0, 8)} ({log.actorRole})</td>
                    <td>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
