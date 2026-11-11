import React, { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import SmartChoiceSelect from './SmartChoiceSelect';
import {
  CUSTOMER_ORDER_STATUS_LABELS,
  CustomerOrderLifecycleStatus,
  PHARMACY_APPLICATION_STATUS_LABELS,
  PHARMACY_STOCK_STATUS_LABELS,
  PharmacyInventoryItem,
} from './partnerTypes';
import {
  deletePharmacyInventoryItem,
  savePharmacyEmployee,
  submitPharmacyRegistrationApplication,
  updatePartnerOrderStatus,
  upsertPharmacyInventoryItem,
  useDawayaPharmacyNetwork,
  usePartnerEcosystem,
} from './partnerService';
import { useDawayaDrugDatabase } from './dawayaDrugDatabaseService';

type PortalTab =
  | 'overview'
  | 'inventory'
  | 'orders'
  | 'employees'
  | 'register_pharmacy'
  | 'reports';

export default function PharmacyOwnerDashboard() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user, role, openAuthModal } = useAuth();
  const {
    applications,
    inventory,
    employees,
    dynamicGovernorates,
    orders,
  } = useDawayaPharmacyNetwork();
  const { partners } = usePartnerEcosystem();
  const { indexItems } = useDawayaDrugDatabase();

  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [toastMsg, setToastMsg] = useState<string>('');

  // Identify the pharmacy owned or managed by the current user
  const myApplications = useMemo(
    () => applications.filter((a) => a.applicantUid === user?.uid),
    [applications, user?.uid]
  );

  const myApprovedApp = useMemo(
    () => myApplications.find((a) => a.status === 'approved'),
    [myApplications]
  );

  const activePharmacyId = useMemo(() => {
    if (myApprovedApp?.approvedPharmacyId) return myApprovedApp.approvedPharmacyId;
    if (role === 'owner' || role === 'super_admin' || role === 'admin') {
      return 'partner_dawaya_flagship_mansoura';
    }
    const empMatch = employees.find((e) => e.email.toLowerCase() === (user?.email || '').toLowerCase() && e.active);
    if (empMatch) return empMatch.pharmacyId;
    return 'partner_dawaya_flagship_mansoura';
  }, [myApprovedApp, role, employees, user?.email]);

  const activePharmacyName = useMemo(() => {
    if (myApprovedApp) return myApprovedApp.pharmacyNameAr;
    const p = partners.find((x) => x.id === activePharmacyId);
    return p ? p.nameAr : 'صيدلية دوايا النموذجية — المنصورة';
  }, [myApprovedApp, partners, activePharmacyId]);

  // Isolated Data for this specific pharmacy ONLY
  const myInventory = useMemo(
    () => inventory.filter((item) => item.pharmacyId === activePharmacyId),
    [inventory, activePharmacyId]
  );

  const myOrders = useMemo(
    () => orders.filter((ord) => ord.partnerId === activePharmacyId || role === 'owner' || role === 'admin'),
    [orders, activePharmacyId, role]
  );

  const myEmployees = useMemo(
    () => employees.filter((e) => e.pharmacyId === activePharmacyId),
    [employees, activePharmacyId]
  );

  // Inventory Form State
  const [invSearchQ, setInvSearchQ] = useState('');
  const [invRadarFilter, setInvRadarFilter] = useState<'all' | 'low_stock' | 'expiring_soon'>('all');
  const [selectedMedId, setSelectedMedId] = useState('EG-ABX-001');
  const [tradeNameAr, setTradeNameAr] = useState('أوجمنتين 1 جرام');
  const [tradeNameEn, setTradeNameEn] = useState('Augmentin 1g');
  const [activeIng, setActiveIng] = useState('Amoxicillin + Clavulanic Acid');
  const [strength, setStrength] = useState('1000 mg');
  const [dosageForm, setDosageForm] = useState('tablet');
  const [qtyPacks, setQtyPacks] = useState<number>(15);
  const [lowThreshold, setLowThreshold] = useState<number>(5);
  const [priceEgp, setPriceEgp] = useState<number>(190);
  const [batchNo, setBatchNo] = useState('B-2026-11');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [reqRx, setReqRx] = useState(true);

  // Registration Form State
  const [regNameAr, setRegNameAr] = useState('');
  const [regNameEn, setRegNameEn] = useState('');
  const [regLicenseNo, setRegLicenseNo] = useState('');
  const [regCommReg, setRegCommReg] = useState('');
  const [regOwnerName, setRegOwnerName] = useState(user?.displayName || '');
  const [regSyndicateNo, setRegSyndicateNo] = useState('');
  const [regNationalId4, setRegNationalId4] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regGovId, setRegGovId] = useState('dakahlia');
  const [regCity, setRegCity] = useState('المنصورة');
  const [regDistrict, setRegDistrict] = useState('حي الجامعة');
  const [regAddress, setRegAddress] = useState('');
  const [regHours, setRegHours] = useState('يومياً من 9 صباحاً حتى 12 منتصف الليل');
  const [reg24h, setReg24h] = useState(false);
  const [regDelivery, setRegDelivery] = useState(true);
  const [regRadiusKm, setRegRadiusKm] = useState(10);
  const [regLicenseUrl, setRegLicenseUrl] = useState('');
  const [regModel, setRegModel] = useState<'independent_partner' | 'dawaya_franchise'>('independent_partner');

  // Employee Form State
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRole, setEmpRole] = useState<'pharmacy_manager' | 'pharmacist' | 'employee'>('pharmacist');
  const [empSyndicate, setEmpSyndicate] = useState('');

  const handleExportInventoryCsv = () => {
    const headers = ['TradeName_AR', 'TradeName_EN', 'ActiveIngredient', 'Strength', 'Price_EGP', 'Quantity_Packs', 'StockStatus', 'BatchNumber', 'ExpiryDate'];
    const rows = myInventory.map((it) => [
      `"${(it.tradeNameAr || '').replace(/"/g, '""')}"`,
      `"${(it.tradeNameEn || '').replace(/"/g, '""')}"`,
      `"${(it.activeIngredient || '').replace(/"/g, '""')}"`,
      `"${(it.strength || '').replace(/"/g, '""')}"`,
      it.pharmacyPriceEgp,
      it.quantityPacks,
      it.stockStatus,
      `"${(it.batchNumber || '').replace(/"/g, '""')}"`,
      it.expiryDateYYYYMMDD,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dawaya-pharmacy-inventory-${activePharmacyId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRadarInventory = useMemo(() => {
    if (invRadarFilter === 'low_stock') return lowStockItems;
    if (invRadarFilter === 'expiring_soon') return expiringSoonItems;
    return myInventory;
  }, [myInventory, lowStockItems, expiringSoonItems, invRadarFilter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  // Search matching medicines from 26,562 database to autofill inventory form
  const matchingCatalogMeds = useMemo(() => {
    const q = invSearchQ.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return indexItems
      .filter(
        (m) =>
          (m.a && m.a.includes(q)) ||
          (m.n && m.n.toLowerCase().includes(q)) ||
          (m.b && m.b.includes(q))
      )
      .slice(0, 8);
  }, [invSearchQ, indexItems]);

  const handleSaveInventory = async (e: FormEvent) => {
    e.preventDefault();
    if (!tradeNameAr.trim() || priceEgp <= 0) return;
    await upsertPharmacyInventoryItem({
      pharmacyId: activePharmacyId,
      pharmacyNameAr: activePharmacyName,
      governorateId: regGovId,
      cityCenter: regCity,
      medicationId: selectedMedId,
      tradeNameAr: tradeNameAr.trim(),
      tradeNameEn: tradeNameEn.trim() || tradeNameAr.trim(),
      activeIngredient: activeIng.trim(),
      strength: strength.trim(),
      dosageForm,
      quantityPacks: Number(qtyPacks),
      lowStockThreshold: Number(lowThreshold),
      pharmacyPriceEgp: Number(priceEgp),
      batchNumber: batchNo.trim(),
      expiryDateYYYYMMDD: expiryDate,
      requiresPrescription: reqRx,
      updatedByUid: user?.uid || 'pharmacy_owner',
    });
    showToast(isAr ? 'تم تحديث مخزون الدواء وسعره بالصيدلية بنجاح.' : 'Medication stock and price updated.');
  };

  const handleSubmitApplication = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!regNameAr.trim() || !regLicenseNo.trim() || !regSyndicateNo.trim() || !regPhone.trim()) {
      showToast(isAr ? 'يرجى استكمال اسم الصيدلية ورقم الترخيص ورقم القيد بالنقابة والهاتف.' : 'Please complete required license fields.');
      return;
    }
    await submitPharmacyRegistrationApplication({
      applicantUid: user.uid,
      applicantEmail: user.email || '',
      pharmacyNameAr: regNameAr.trim(),
      pharmacyNameEn: regNameEn.trim() || regNameAr.trim(),
      licenseNumber: regLicenseNo.trim(),
      commercialRegNumber: regCommReg.trim(),
      ownerFullName: regOwnerName.trim(),
      ownerSyndicateNumber: regSyndicateNo.trim(),
      ownerNationalIdLast4: regNationalId4.trim(),
      phone: regPhone.trim(),
      whatsapp: regWhatsapp.trim() || regPhone.trim(),
      governorateId: regGovId,
      cityCenter: regCity.trim(),
      districtVillage: regDistrict.trim(),
      detailedAddressAr: regAddress.trim(),
      latitude: null,
      longitude: null,
      workingHoursAr: regHours.trim(),
      is24Hours: reg24h,
      deliveryAvailable: regDelivery,
      deliveryRadiusKm: Number(regRadiusKm) || 5,
      licenseDocumentUrl: regLicenseUrl.trim() || 'verified-upload-pending-review',
      requestedModel: regModel,
    });
    showToast(
      isAr
        ? 'تم إرسال طلب انضمام الصيدلية للمراجعة المركزية. سيظل الطلب قيد المراجعة حتى التحقق من الترخيص.'
        : 'Pharmacy application submitted for central verification.'
    );
    setActiveTab('overview');
  };

  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim()) return;
    await savePharmacyEmployee({
      pharmacyId: activePharmacyId,
      fullName: empName.trim(),
      email: empEmail.trim(),
      phone: empPhone.trim(),
      role: empRole,
      syndicateNumber: empSyndicate.trim(),
      canManageInventory: true,
      canConfirmOrders: empRole !== 'employee',
      canViewReports: empRole === 'pharmacy_manager',
      active: true,
    });
    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpSyndicate('');
    showToast(isAr ? 'تمت إضافة الصيدلي/الموظف بصلاحيات معزولة لهذه الصيدلية فقط.' : 'Employee added to pharmacy.');
  };

  // KPI Metrics for Pharmacy Reports
  const lowStockItems = myInventory.filter((i) => i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock');
  const expiringSoonItems = myInventory.filter((i) => {
    if (!i.expiryDateYYYYMMDD) return false;
    const diffDays = (new Date(i.expiryDateYYYYMMDD).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diffDays <= 90;
  });

  return (
    <main className="wrap stack">
      {/* Header Banner */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #132742 55%, #0f5132 100%)',
          color: '#ffffff',
          padding: '22px 24px',
          borderRadius: '22px',
          border: '1px solid rgba(207, 210, 157, 0.28)',
        }}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.22)',
                border: '1px solid #10b981',
                color: '#6ee7b7',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginBottom: '8px',
              }}
            >
              {isAr ? 'بوابة إدارة الصيدليات المعتمدة والفرنشايز — عزل بيانات كامل' : 'DAWAYA Pharmacy Owner & Inventory Portal'}
            </span>
            <h1 style={{ margin: '0 0 6px', color: '#ffffff', fontSize: '1.55rem' }}>
              {activePharmacyName}
            </h1>
            <p className="small" style={{ margin: 0, color: '#cbd5e1' }}>
              {isAr
                ? 'إدارة المخزون الفعلي، الأسعار، تواريخ الصلاحية، تأكيد طلبات العملاء، وفريق الصيادلة بصلاحيات معزولة.'
                : 'Manage verified stock, prices, batch expiry dates, customer order confirmations, and authorized pharmacy staff.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn small"
              style={{ background: '#10b981', borderColor: '#10b981', color: '#ffffff', fontWeight: 800 }}
              onClick={() => setActiveTab('register_pharmacy')}
            >
              {isAr ? 'تسجيل صيدلية جديدة بالشبكة' : 'Register New Pharmacy'}
            </button>
            <Link to="/partners" className="btn small light">
              {isAr ? 'دليل الصيدليات العام' : 'Public Pharmacy Directory'}
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="row wrapRow" style={{ gap: '8px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          {[
            { id: 'overview', ar: 'نظرة عامة والتنبيهات', en: 'Overview & Alerts' },
            { id: 'inventory', ar: `المخزون والأسعار (${myInventory.length})`, en: `Inventory (${myInventory.length})` },
            { id: 'orders', ar: `طلبات العملاء (${myOrders.length})`, en: `Customer Orders (${myOrders.length})` },
            { id: 'employees', ar: `فريق الصيدلية (${myEmployees.length})`, en: `Staff (${myEmployees.length})` },
            { id: 'reports', ar: 'التقارير والمبيعات', en: 'Sales & Reports' },
            { id: 'register_pharmacy', ar: 'طلب انضمام / ترخيص صيدلية', en: 'Pharmacy Registration' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as PortalTab)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: activeTab === t.id ? '1.5px solid #CFD29D' : '1px solid rgba(255,255,255,0.2)',
                background: activeTab === t.id ? '#10b981' : 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              {isAr ? t.ar : t.en}
            </button>
          ))}
        </div>
      </section>

      {toastMsg && (
        <div
          className="notice"
          style={{
            background: '#dcfce7',
            color: '#166534',
            borderColor: '#10b981',
            fontWeight: 800,
          }}
        >
          ✓ {toastMsg}
        </div>
      )}

      {/* TAB 1: OVERVIEW & ALERTS */}
      {activeTab === 'overview' && (
        <div className="stack">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '12px',
            }}
          >
            <div className="card" style={{ borderTop: '4px solid #10b981' }}>
              <span className="small muted">{isAr ? 'أصناف المخزون الموثقة' : 'Verified Inventory Items'}</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                {myInventory.length}
              </div>
              <span className="small muted">{isAr ? 'محدثة بتوقيت الصيدلية الفعلي' : 'Real-time synced'}</span>
            </div>

            <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
              <span className="small muted">{isAr ? 'تنبيهات النواقص (Low Stock)' : 'Low / Out of Stock Alerts'}</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>
                {lowStockItems.length}
              </div>
              <span className="small muted">{isAr ? 'تحتاج لإعادة طلب من الموزع' : 'Requires restocking'}</span>
            </div>

            <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
              <span className="small muted">{isAr ? 'تنبيهات قرب انتهاء الصلاحية (<90 يوم)' : 'Expiring Within 90 Days'}</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
                {expiringSoonItems.length}
              </div>
              <span className="small muted">{isAr ? 'فحص التشغيلات وتواريخ الانتهاء' : 'Batch expiry tracking'}</span>
            </div>

            <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
              <span className="small muted">{isAr ? 'طلبات العملاء الواردة' : 'Incoming Customer Orders'}</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
                {myOrders.length}
              </div>
              <span className="small muted">{isAr ? 'لا يُؤكد الطلب إلا بموافقة الصيدلي' : 'Requires pharmacist confirmation'}</span>
            </div>
          </div>

          {/* Pending Applications Status for Applicant */}
          {myApplications.length > 0 && (
            <section className="card stack">
              <h3 style={{ margin: 0 }}>{isAr ? 'حالة طلبات انضمام الصيدلية الخاصة بك' : 'Your Pharmacy Application Status'}</h3>
              {myApplications.map((app) => {
                const st = PHARMACY_APPLICATION_STATUS_LABELS[app.status];
                return (
                  <div
                    key={app.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <strong>{app.pharmacyNameAr}</strong> — <span className="small muted">ترخيص رقم: {app.licenseNumber}</span>
                      <div className="small muted">
                        {app.cityCenter}، {app.districtVillage} • نموذج التعاقد: {app.requestedModel === 'dawaya_franchise' ? 'فرنشايز علامة دوايا' : 'صيدلية شريكة مستقلة'}
                      </div>
                      {app.adminDecisionReasonAr && (
                        <div className="small" style={{ marginTop: '4px', fontWeight: 700, color: '#0369a1' }}>
                          قرار الإدارة المركزية: {app.adminDecisionReasonAr}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        padding: '5px 14px',
                        borderRadius: '999px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        color: st.color,
                        background: st.bg,
                      }}
                    >
                      {isAr ? st.ar : st.en}
                    </span>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}

      {/* TAB 2: PHARMACY INVENTORY & BATCH/EXPIRY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="stack">
          <section className="card stack">
            <h2 style={{ margin: 0 }}>
              {isAr ? 'إضافة أو تحديث رصيد دواء بمخزون الصيدلية' : 'Update Verified Pharmacy Medication Inventory'}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'وجود الدواء في قاعدة بيانات دوايا لا يعني توفره تلقائياً بكل صيدلية؛ يتم عرض التوفر للعملاء فقط بناءً على تحديثك الفعلي هنا.'
                : 'Listing in DAWAYA catalog does not imply stock; customers only see availability verified here.'}
            </p>

            {/* Quick Autofill from 26,562 Catalog */}
            <div className="form-group">
              <label><b>{isAr ? 'ابحث في موسوعة دوايا (26,562 دواء) للملء التلقائي:' : 'Search DAWAYA Catalog to Autofill:'}</b></label>
              <input
                type="search"
                value={invSearchQ}
                onChange={(e) => setInvSearchQ(e.target.value)}
                placeholder={isAr ? 'اكتب اسم الدواء أو الباركود (مثال: أوجمنتين، كونكور، زيثروماكس)...' : 'Type brand name or barcode...'}
              />
              {matchingCatalogMeds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {matchingCatalogMeds.map((m) => (
                    <button
                      key={m.i}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setSelectedMedId(m.i);
                        setTradeNameAr(m.a || m.n);
                        setTradeNameEn(m.n);
                        setActiveIng(m.g || '');
                        setStrength(m.s || '');
                        setDosageForm(m.f || 'tablet');
                        if (m.p) setPriceEgp(m.p);
                        setInvSearchQ('');
                      }}
                    >
                      {m.a || m.n} ({m.p ? `${m.p} ج.م` : ''})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveInventory} className="stack">
              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'الاسم التجاري (عربي):' : 'Trade Name (AR):'} *</b></label>
                  <input value={tradeNameAr} onChange={(e) => setTradeNameAr(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'الاسم التجاري (إنجليزي):' : 'Trade Name (EN):'}</b></label>
                  <input value={tradeNameEn} onChange={(e) => setTradeNameEn(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'المادة الفعالة:' : 'Active Ingredient:'}</b></label>
                  <input value={activeIng} onChange={(e) => setActiveIng(e.target.value)} />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'التركيز:' : 'Strength:'}</b></label>
                  <input value={strength} onChange={(e) => setStrength(e.target.value)} />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'السعر الفعلي بالصيدلية (ج.م):' : 'Verified Price (EGP):'} *</b></label>
                  <input type="number" step="0.5" min="1" value={priceEgp} onChange={(e) => setPriceEgp(Number(e.target.value))} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'الكمية المتوفرة (عدد العبوات):' : 'Quantity (Packs):'} *</b></label>
                  <input type="number" min="0" value={qtyPacks} onChange={(e) => setQtyPacks(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'حد تنبيه النواقص (Low Stock Alert):' : 'Low Stock Threshold:'}</b></label>
                  <input type="number" min="1" value={lowThreshold} onChange={(e) => setLowThreshold(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'رقم التشغيلة (Batch Number):' : 'Batch Number:'}</b></label>
                  <input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'تاريخ انتهاء الصلاحية (Expiry Date):' : 'Expiry Date:'} *</b></label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
                {isAr ? 'حفظ وتحديث المخزون الفعلي' : 'Save Verified Inventory'}
              </button>
            </form>
          </section>

          <section className="card stack">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0 }}>{isAr ? 'رادار المخزون والنواقص وتواريخ الصلاحية الذكي' : 'Smart Inventory, Shortage & Batch Expiry Radar'}</h3>
                <p className="small muted" style={{ margin: '2px 0 0' }}>
                  {isAr ? 'فلترة فورية للنواقص والتشغيلات التي تقترب من انتهاء الصلاحية مع تصدير كشف CSV للصيدلي' : 'Instant filter for shortages and expiring batches with one-click CSV export'}
                </p>
              </div>
              <button type="button" className="btn small ghost" onClick={handleExportInventoryCsv}>
                {isAr ? 'تصدير كشف المخزون والنواقص (CSV)' : 'Export Inventory & Shortages (CSV)'}
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className={invRadarFilter === 'all' ? 'btn small' : 'btn small ghost'}
                onClick={() => setInvRadarFilter('all')}
              >
                {isAr ? `كل الأصناف (${myInventory.length})` : `All Items (${myInventory.length})`}
              </button>
              <button
                type="button"
                className={invRadarFilter === 'low_stock' ? 'btn small' : 'btn small ghost'}
                onClick={() => setInvRadarFilter('low_stock')}
              >
                {isAr ? `تنبيهات النواقص (${lowStockItems.length})` : `Low / Out of Stock (${lowStockItems.length})`}
              </button>
              <button
                type="button"
                className={invRadarFilter === 'expiring_soon' ? 'btn small' : 'btn small ghost'}
                onClick={() => setInvRadarFilter('expiring_soon')}
              >
                {isAr ? `قرب انتهاء الصلاحية <90 يوم (${expiringSoonItems.length})` : `Expiring <90 Days (${expiringSoonItems.length})`}
              </button>
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{isAr ? 'الدواء' : 'Medication'}</th>
                    <th>{isAr ? 'السعر' : 'Price'}</th>
                    <th>{isAr ? 'الرصيد' : 'Stock Qty'}</th>
                    <th>{isAr ? 'الحالة' : 'Status'}</th>
                    <th>{isAr ? 'التشغيلة والصلاحية' : 'Batch & Expiry'}</th>
                    <th>{isAr ? 'آخر تحديث' : 'Last Updated'}</th>
                    <th>{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRadarInventory.map((item) => {
                    const st = PHARMACY_STOCK_STATUS_LABELS[item.stockStatus];
                    return (
                      <tr key={item.id}>
                        <td>
                          <b>{item.tradeNameAr}</b>
                          <div className="small muted">{item.activeIngredient} • {item.strength}</div>
                        </td>
                        <td><b>{item.pharmacyPriceEgp} ج.م</b></td>
                        <td><b>{item.quantityPacks} عبوة</b></td>
                        <td>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: st.color,
                              background: st.bg,
                            }}
                          >
                            {isAr ? st.ar : st.en}
                          </span>
                        </td>
                        <td>
                          <span className="small">تشغيلة: {item.batchNumber}</span>
                          <div className="small muted">انتهاء: {item.expiryDateYYYYMMDD}</div>
                        </td>
                        <td className="small muted">{item.lastUpdatedAtIso.slice(0, 16).replace('T', ' ')}</td>
                        <td>
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => deletePharmacyInventoryItem(item.id)}
                          >
                            {isAr ? 'حذف' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: CUSTOMER ORDERS & 8-STAGE LIFECYCLE */}
      {activeTab === 'orders' && (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>{isAr ? 'إدارة وتأكيد طلبات العملاء والروشتات' : 'Customer Orders & Pharmacist Confirmation'}</h2>
          <p className="small muted" style={{ margin: 0 }}>
            {isAr
              ? 'القاعدة الإلزامية: لا يظهر الطلب كمؤكد للعميل إلا بعد مراجعته وقبوله صيدلانياً من هنا.'
              : 'Orders remain unconfirmed until explicitly accepted by the pharmacy.'}
          </p>

          {myOrders.length === 0 ? (
            <p className="muted">{isAr ? 'لا توجد طلبات واردة حالياً لهذه الصيدلية.' : 'No orders queued for this pharmacy.'}</p>
          ) : (
            <div className="stack">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1.5px solid var(--line)',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div className="row wrapRow" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <strong>طلب رقم #{ord.orderNumber}</strong> — <span>{ord.medicationNameAr} ({ord.quantityPacks} عبوة)</span>
                      <div className="small muted">
                        العميل: {ord.patientName} • الهاتف: <span dir="ltr">{ord.patientPhone}</span> • العنوان: {ord.city} — {ord.deliveryAddress}
                      </div>
                    </div>
                    <span className="badge" style={{ fontWeight: 800 }}>
                      الحالة الحالية: {ord.status}
                    </span>
                  </div>

                  <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                    <span className="small"><b>تحديث مرحلة الطلب (8 مراحل):</b></span>
                    {(
                      [
                        { id: 'confirmed', ar: 'قبول وتأكيد الصيدلية' },
                        { id: 'preparing', ar: 'جاري التحضير' },
                        { id: 'out_for_delivery', ar: 'خرج للتوصيل' },
                        { id: 'delivered', ar: 'تم التسليم' },
                        { id: 'cancelled', ar: 'اعتذار / رفض الطلب' },
                      ] as const
                    ).map((stBtn) => (
                      <button
                        key={stBtn.id}
                        type="button"
                        className="btn small ghost"
                        onClick={() =>
                          updatePartnerOrderStatus(
                            ord.id,
                            stBtn.id,
                            `تم تحديث حالة الطلب بواسطة الصيدلية إلى: ${stBtn.ar}`,
                            `Order updated by pharmacy to: ${stBtn.id}`,
                            user?.uid || 'pharmacist',
                            role || 'pharmacy_owner'
                          )
                        }
                      >
                        {stBtn.ar}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: AUTHORIZED PHARMACY EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="stack">
          <section className="card stack">
            <h2 style={{ margin: 0 }}>{isAr ? 'إضافة صيدلي أو موظف معتمد بالصيدلية' : 'Add Authorized Pharmacy Staff'}</h2>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'يتم تقييد صلاحيات الموظف ليعمل على مخزون وطلبات هذه الصيدلية فقط دون الوصول لأي صيدلية أخرى.'
                : 'Employees are strictly scoped to this pharmacy only.'}
            </p>
            <form onSubmit={handleAddEmployee} className="stack">
              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'الاسم بالكامل:' : 'Full Name:'} *</b></label>
                  <input value={empName} onChange={(e) => setEmpName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'البريد الإلكتروني:' : 'Email:'} *</b></label>
                  <input type="email" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'الدور الوظيفي بالصيدلية:' : 'Staff Role:'}</b></label>
                  <SmartChoiceSelect
                    value={empRole}
                    onChange={(v) => setEmpRole(v as any)}
                    modalTitle={isAr ? 'اختر الدور الوظيفي بالصيدلية' : 'Select Pharmacy Role'}
                    options={[
                      { value: 'pharmacy_manager', label: isAr ? 'مدير صيدلية (صلاحية كاملة للصيدلية)' : 'Pharmacy Manager' },
                      { value: 'pharmacist', label: isAr ? 'صيدلي (إدارة المخزون وتأكيد الروشتات والطلبات)' : 'Pharmacist' },
                      { value: 'employee', label: isAr ? 'مساعد صيدلي / مدخل بيانات المخزون' : 'Inventory Staff' },
                    ]}
                  />
                </div>
              </div>
              <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
                {isAr ? 'إضافة للفريق المعتمد' : 'Add Staff Member'}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* TAB 5: SALES & ANALYTICS REPORTS */}
      {activeTab === 'reports' && (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>{isAr ? 'تقارير أداء الصيدلية والمبيعات والنواقص' : 'Pharmacy Sales & Inventory Analytics'}</h2>
          <div className="form-row">
            <div className="subcard">
              <b>{isAr ? 'إجمالي قيمة المخزون المسجل:' : 'Total Stock Value:'}</b>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>
                {myInventory.reduce((acc, i) => acc + i.pharmacyPriceEgp * i.quantityPacks, 0).toLocaleString()} ج.م
              </div>
            </div>
            <div className="subcard">
              <b>{isAr ? 'الطلبات المكتملة:' : 'Delivered Orders:'}</b>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284c7' }}>
                {myOrders.filter((o) => o.status === 'delivered').length}
              </div>
            </div>
            <div className="subcard">
              <b>{isAr ? 'الأصناف التي تحتاج إعادة طلب فوري:' : 'Restock Needed:'}</b>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706' }}>
                {lowStockItems.length} صنف
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 6: REGISTER NEW PHARMACY APPLICATION */}
      {activeTab === 'register_pharmacy' && (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>
            {isAr ? 'طلب انضمام صيدلية جديدة لشبكة دوايا (أو فرنشايز العلامة التجارية)' : 'Apply to Join DAWAYA Pharmacy Network'}
          </h2>
          <p className="small muted" style={{ margin: 0 }}>
            {isAr
              ? 'جميع الطلبات تخضع لمراجعة التراخيص وبطاقة النقابة من الإدارة المركزية، ولا تظهر الصيدلية كشريك معتمد إلا بعد الموافقة الرسمية.'
              : 'Applications remain Pending Review until license documents are verified by Central Administration.'}
          </p>

          <form onSubmit={handleSubmitApplication} className="stack">
            <div className="form-row">
              <div className="form-group">
                <label><b>{isAr ? 'اسم الصيدلية (عربي):' : 'Pharmacy Name (AR):'} *</b></label>
                <input value={regNameAr} onChange={(e) => setRegNameAr(e.target.value)} placeholder="مثال: صيدلية د. أحمد الشناوي" required />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'اسم الصيدلية (إنجليزي):' : 'Pharmacy Name (EN):'}</b></label>
                <input value={regNameEn} onChange={(e) => setRegNameEn(e.target.value)} placeholder="Dr. Ahmed Pharmacy" />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'نظام الانضمام المطلوب:' : 'Partnership Model:'}</b></label>
                <SmartChoiceSelect
                  value={regModel}
                  onChange={(v) => setRegModel(v as any)}
                  modalTitle={isAr ? 'اختر نظام الانضمام لشبكة دوايا' : 'Select Partnership Model'}
                  options={[
                    {
                      value: 'independent_partner',
                      label: isAr ? 'صيدلية شريكة مستقلة (إدراج المخزون واستقبال الطلبات)' : 'Independent Partner Pharmacy',
                      description: isAr ? 'تحتفظ الصيدلية باسمها مع ظهورها في بحث الأدوية وتلقي طلبات النطاق الجغرافي' : 'Retain independent branding with verified inventory listing',
                    },
                    {
                      value: 'dawaya_franchise',
                      label: isAr ? 'فرنشايز علامة دوايا (DAWAYA Franchise)' : 'DAWAYA Brand Franchise',
                      description: isAr ? 'العمل تحت الهوية البصرية والتشغيلية الموحدة لـ DAWAYA وفق القوانين المصرية' : 'Operate under DAWAYA brand & franchise contract',
                    },
                  ]}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><b>{isAr ? 'رقم ترخيص الصيدلية بوزارة الصحة / هيئة الدواء:' : 'Ministry License Number:'} *</b></label>
                <input value={regLicenseNo} onChange={(e) => setRegLicenseNo(e.target.value)} placeholder="LIC-XXXX" required />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'رقم السجل التجاري:' : 'Commercial Registry:'} *</b></label>
                <input value={regCommReg} onChange={(e) => setRegCommReg(e.target.value)} required />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'اسم الصيدلي المالك رباعياً:' : 'Pharmacist Owner Full Name:'} *</b></label>
                <input value={regOwnerName} onChange={(e) => setRegOwnerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'رقم القيد بنقابة صيادلة مصر:' : 'Syndicate Registration #:'} *</b></label>
                <input value={regSyndicateNo} onChange={(e) => setRegSyndicateNo(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><b>{isAr ? 'المحافظة:' : 'Governorate:'} *</b></label>
                <SmartChoiceSelect
                  value={regGovId}
                  onChange={(v) => setRegGovId(v)}
                  modalTitle={isAr ? 'اختر المحافظة' : 'Select Governorate'}
                  options={dynamicGovernorates.map((g) => ({
                    value: g.id,
                    label: isAr ? g.nameAr : g.nameEn,
                  }))}
                />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'المدينة / المركز:' : 'City / Center:'} *</b></label>
                <input value={regCity} onChange={(e) => setRegCity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'الحي / القرية:' : 'District / Village:'} *</b></label>
                <input value={regDistrict} onChange={(e) => setRegDistrict(e.target.value)} required />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'هاتف الصيدلية والطوارئ:' : 'Pharmacy Phone:'} *</b></label>
                <input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label><b>{isAr ? 'العنوان التفصيلي ومواعيد العمل:' : 'Detailed Address & Working Hours:'} *</b></label>
              <input value={regAddress} onChange={(e) => setRegAddress(e.target.value)} placeholder="الشارع، رقم العقار، علامة مميزة..." required />
            </div>

            <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
              {isAr ? 'إرسال طلب الترخيص للمراجعة المركزية' : 'Submit Pharmacy Application for Review'}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
