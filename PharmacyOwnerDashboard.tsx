import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import SmartChoiceSelect from './SmartChoiceSelect';
import { RoleModeSwitcher } from './RoleSwitcherAndGuard';
import { PermissionId, ROLE_DEFINITIONS } from './rbacEngine';
import {
  CUSTOMER_ORDER_STATUS_LABELS,
  CustomerOrderLifecycleStatus,
  PHARMACY_APPLICATION_STATUS_LABELS,
  PHARMACY_STOCK_STATUS_LABELS,
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
  | 'pharmacy_profile'
  | 'inventory'
  | 'orders'
  | 'employees'
  | 'register_pharmacy'
  | 'reports';

export default function PharmacyOwnerDashboard() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const {
    user,
    role,
    canonicalRole,
    activeRole,
    pharmacyMemberships,
    activePharmacyId: ctxActivePharmacyId,
    hasPermission,
    switchMode,
    openAuthModal,
  } = useAuth();
  const {
    applications,
    inventory,
    employees,
    dynamicGovernorates,
    orders,
  } = useDawayaPharmacyNetwork();
  const { partners, branches } = usePartnerEcosystem();
  const { indexItems } = useDawayaDrugDatabase();

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

  const empMatch = useMemo(
    () =>
      employees.find(
        (e) =>
          user?.email &&
          e.email.toLowerCase() === user.email.toLowerCase() &&
          e.active
      ),
    [employees, user?.email]
  );

  // Determine whether the user is an authorized pharmacy member or platform admin
  const isAuthorizedPharmacyUser = useMemo(() => {
    if (
      canonicalRole === 'super_admin' ||
      canonicalRole === 'central_admin' ||
      ['pharmacy_owner', 'pharmacy_manager', 'pharmacist', 'pharmacy_employee'].includes(canonicalRole) ||
      ['pharmacy_owner', 'pharmacy_manager', 'pharmacist', 'pharmacy_employee'].includes(activeRole)
    ) {
      return true;
    }
    if (pharmacyMemberships.some((m) => m.status === 'active')) return true;
    if (myApprovedApp || empMatch) return true;
    return false;
  }, [canonicalRole, activeRole, pharmacyMemberships, myApprovedApp, empMatch]);

  const [activeTab, setActiveTab] = useState<PortalTab>(() =>
    isAuthorizedPharmacyUser ? 'overview' : 'register_pharmacy'
  );

  useEffect(() => {
    if (!isAuthorizedPharmacyUser && activeTab !== 'register_pharmacy') {
      setActiveTab('register_pharmacy');
    }
  }, [isAuthorizedPharmacyUser, activeTab]);

  // Strictly scoped activePharmacyId for Tenant Isolation (Section 5 & 9)
  const activePharmacyId = useMemo(() => {
    if (ctxActivePharmacyId) return ctxActivePharmacyId;
    if (pharmacyMemberships.length > 0) return pharmacyMemberships[0].pharmacyId;
    if (myApprovedApp?.approvedPharmacyId) return myApprovedApp.approvedPharmacyId;
    if (empMatch) return empMatch.pharmacyId;
    if (canonicalRole === 'super_admin' || canonicalRole === 'central_admin') {
      return 'partner_dawaya_flagship_mansoura';
    }
    return 'partner_dawaya_flagship_mansoura';
  }, [ctxActivePharmacyId, pharmacyMemberships, myApprovedApp, empMatch, canonicalRole]);

  const activePartnerRecord = useMemo(
    () => partners.find((x) => x.id === activePharmacyId) || null,
    [partners, activePharmacyId]
  );

  const activePharmacyBranches = useMemo(
    () => branches.filter((b) => b.partnerId === activePharmacyId),
    [branches, activePharmacyId]
  );

  const activePharmacyName = useMemo(() => {
    const memName = pharmacyMemberships.find((m) => m.pharmacyId === activePharmacyId)?.pharmacyNameAr;
    if (memName) return memName;
    if (myApprovedApp) return myApprovedApp.pharmacyNameAr;
    if (activePartnerRecord) return activePartnerRecord.nameAr;
    return 'صيدلية دوايا النموذجية — المنصورة';
  }, [pharmacyMemberships, activePharmacyId, myApprovedApp, activePartnerRecord]);

  // Determine effective pharmacy role for UI adaptation (Owner vs Pharmacist vs Employee)
  const effectivePharmacyRole = useMemo(() => {
    const mem = pharmacyMemberships.find((m) => m.pharmacyId === activePharmacyId);
    if (mem) return mem.role;
    if (
      activeRole === 'pharmacy_owner' ||
      activeRole === 'pharmacy_manager' ||
      activeRole === 'pharmacist' ||
      activeRole === 'pharmacy_employee'
    ) {
      return activeRole;
    }
    if (empMatch) {
      return empMatch.role === 'employee' ? 'pharmacy_employee' : empMatch.role;
    }
    return 'pharmacy_owner';
  }, [pharmacyMemberships, activePharmacyId, activeRole, empMatch]);

  // Granular Permission Flags (Sections 6B, 6C, 6D)
  const canViewInventory =
    isAuthorizedPharmacyUser &&
    (hasPermission('inventory.view', { pharmacyId: activePharmacyId }) ||
      effectivePharmacyRole !== 'pharmacy_employee' ||
      empMatch?.canManageInventory !== false);

  const canManageInventory =
    isAuthorizedPharmacyUser &&
    (hasPermission('inventory.manage', { pharmacyId: activePharmacyId }) ||
      effectivePharmacyRole === 'pharmacy_owner' ||
      effectivePharmacyRole === 'pharmacy_manager' ||
      effectivePharmacyRole === 'pharmacist');

  const canManageOrders =
    isAuthorizedPharmacyUser &&
    (hasPermission('orders.manage', { pharmacyId: activePharmacyId }) ||
      Boolean(empMatch));

  const canManageEmployees =
    isAuthorizedPharmacyUser &&
    (hasPermission('employees.manage', { pharmacyId: activePharmacyId }) ||
      effectivePharmacyRole === 'pharmacy_owner' ||
      effectivePharmacyRole === 'pharmacy_manager');

  const canViewReports =
    isAuthorizedPharmacyUser &&
    (hasPermission('reports.view', { pharmacyId: activePharmacyId }) ||
      effectivePharmacyRole === 'pharmacy_owner' ||
      effectivePharmacyRole === 'pharmacy_manager' ||
      Boolean(empMatch?.canViewReports));

  // Isolated Data for this specific pharmacy ONLY (Tenant Isolation)
  const myInventory = useMemo(
    () => inventory.filter((item) => item.pharmacyId === activePharmacyId),
    [inventory, activePharmacyId]
  );

  const myOrders = useMemo(
    () => orders.filter((ord) => ord.partnerId === activePharmacyId),
    [orders, activePharmacyId]
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

  // Employee Form State + Granular Staff Permissions
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRole, setEmpRole] = useState<'pharmacy_manager' | 'pharmacist' | 'employee'>('pharmacist');
  const [empSyndicate, setEmpSyndicate] = useState('');
  const [empCanManageInv, setEmpCanManageInv] = useState(true);
  const [empCanConfirmOrders, setEmpCanConfirmOrders] = useState(true);
  const [empCanViewReports, setEmpCanViewReports] = useState(false);

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

  // KPI Metrics for Pharmacy Reports
  const lowStockItems = myInventory.filter((i) => i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock');
  const expiringSoonItems = myInventory.filter((i) => {
    if (!i.expiryDateYYYYMMDD) return false;
    const diffDays = (new Date(i.expiryDateYYYYMMDD).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diffDays <= 90;
  });

  const pendingOrdersCount = myOrders.filter((o) =>
    ['new_order', 'pending_review', 'pending_pharmacy_review', 'pharmacy_confirmation', 'preparing'].includes(o.status)
  ).length;
  const completedOrdersCount = myOrders.filter((o) => o.status === 'delivered').length;
  const cancelledOrdersCount = myOrders.filter((o) => o.status === 'cancelled' || o.status === 'rejected').length;

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
    if (!canManageInventory) {
      showToast(isAr ? 'عفواً، صلاحية حسابك لا تسمح بتعديل أسعار أو كميات المخزون.' : 'Permission denied to modify inventory.');
      return;
    }
    if (!tradeNameAr.trim() || priceEgp <= 0 || qtyPacks < 0) {
      showToast(isAr ? 'يرجى إدخال سعر أكبر من صفر وكمية صحيحة غير سالبة.' : 'Please enter a valid positive price and non-negative stock.');
      return;
    }
    try {
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
      showToast(isAr ? 'تم تأكيد حفظ وتحديث مخزون الدواء وسعره سحابياً بنجاح.' : 'Medication stock and price confirmed in cloud.');
    } catch (err: unknown) {
      showToast(
        isAr
          ? `تعذر الحفظ السحابي للمخزون: ${(err as Error)?.message || 'خطأ في الصلاحيات أو الشبكة'}`
          : `Cloud inventory save failed: ${(err as Error)?.message || 'Permission or network error'}`
      );
    }
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
    try {
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
          ? 'تم إرسال طلب انضمام الصيدلية للمراجعة المركزية بنجاح. سيظل الطلب قيد المراجعة حتى التحقق من الترخيص.'
          : 'Pharmacy application submitted for central verification.'
      );
    } catch (err: unknown) {
      showToast(
        isAr
          ? `تعذر إرسال الطلب سحابياً: ${(err as Error)?.message || 'يرجى التحقق من الاتصال والصلاحيات'}`
          : `Failed to submit application: ${(err as Error)?.message || 'Network or permission error'}`
      );
    }
  };

  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManageEmployees) {
      showToast(isAr ? 'إدارة الموظفين مخصصة لمالك أو مدير الصيدلية فقط.' : 'Employee management is restricted to Pharmacy Owner/Manager.');
      return;
    }
    if (!empName.trim() || !empEmail.trim()) return;
    try {
      await savePharmacyEmployee({
        pharmacyId: activePharmacyId,
        fullName: empName.trim(),
        email: empEmail.trim(),
        phone: empPhone.trim(),
        role: empRole,
        syndicateNumber: empSyndicate.trim(),
        canManageInventory: empCanManageInv,
        canConfirmOrders: empCanConfirmOrders,
        canViewReports: empCanViewReports,
        active: true,
      });
      setEmpName('');
      setEmpEmail('');
      setEmpPhone('');
      setEmpSyndicate('');
      showToast(isAr ? 'تمت إضافة الصيدلي/الموظف بصلاحيات معزولة لهذه الصيدلية فقط.' : 'Employee added to pharmacy.');
    } catch (err: unknown) {
      showToast(
        isAr
          ? `تعذر حفظ بيانات الموظف سحابياً: ${(err as Error)?.message || 'خطأ في الصلاحيات'}`
          : `Failed to save employee: ${(err as Error)?.message || 'Permission denied'}`
      );
    }
  };

  const handleToggleEmployeeActive = async (emp: typeof myEmployees[0]) => {
    if (!canManageEmployees) return;
    try {
      await savePharmacyEmployee({
        ...emp,
        active: !emp.active,
      });
      showToast(
        emp.active
          ? isAr ? `تم إيقاف عضوية (${emp.fullName}) مؤقتاً.` : `Suspended ${emp.fullName}.`
          : isAr ? `تمت إعادة تفعيل عضوية (${emp.fullName}).` : `Reactivated ${emp.fullName}.`
      );
    } catch {
      showToast(isAr ? 'تعذر تحديث حالة الموظف.' : 'Could not update employee status.');
    }
  };

  const roleHeaderBadgeLabel = useMemo(() => {
    if (!isAuthorizedPharmacyUser) {
      return isAr ? 'بوابة تقديم طلب انضمام صيدلية جديدة لشبكة دوايا' : 'DAWAYA Pharmacy Onboarding Application';
    }
    if (effectivePharmacyRole === 'pharmacist') {
      return isAr ? 'واجهة الصيدلي الإكلينيكي المعتمد (Pharmacist Interface)' : 'Licensed Pharmacist Interface';
    }
    if (effectivePharmacyRole === 'pharmacy_employee') {
      return isAr ? 'واجهة موظف الصيدلية وتجهيز الطلبات (Pharmacy Staff Interface)' : 'Pharmacy Employee Operations Interface';
    }
    if (effectivePharmacyRole === 'pharmacy_manager') {
      return isAr ? 'واجهة مدير فرع الصيدلية (Pharmacy Branch Manager)' : 'Pharmacy Branch Manager Interface';
    }
    return isAr ? 'بوابة مالك الصيدلية المعتمد والفرنشايز — عزل بيانات كامل' : 'DAWAYA Pharmacy Owner Dashboard';
  }, [isAuthorizedPharmacyUser, effectivePharmacyRole, isAr]);

  // Role-filtered tabs (Sections 6B, 6C, 6D)
  const visibleTabs = useMemo(() => {
    if (!isAuthorizedPharmacyUser) {
      return [
        { id: 'register_pharmacy', ar: 'طلب انضمام / ترخيص صيدلية جديدة', en: 'Pharmacy Registration' },
      ];
    }
    const tabs: { id: PortalTab; ar: string; en: string }[] = [
      { id: 'overview', ar: 'نظرة عامة والتنبيهات', en: 'Overview & Alerts' },
      { id: 'pharmacy_profile', ar: 'ملف الصيدلية والفروع', en: 'Pharmacy & Branches' },
    ];
    if (canViewInventory) {
      tabs.push({ id: 'inventory', ar: `المخزون والأسعار (${myInventory.length})`, en: `Inventory (${myInventory.length})` });
    }
    if (canManageOrders) {
      tabs.push({ id: 'orders', ar: `طلبات العملاء (${myOrders.length})`, en: `Customer Orders (${myOrders.length})` });
    }
    if (canManageEmployees) {
      tabs.push({ id: 'employees', ar: `فريق الصيدلية (${myEmployees.length})`, en: `Staff (${myEmployees.length})` });
    }
    if (canViewReports) {
      tabs.push({ id: 'reports', ar: 'التقارير والمبيعات', en: 'Sales & Reports' });
    }
    tabs.push({ id: 'register_pharmacy', ar: 'طلب ترخيص فرع / صيدلية', en: 'New Pharmacy App' });
    return tabs;
  }, [
    isAuthorizedPharmacyUser,
    canViewInventory,
    canManageOrders,
    canManageEmployees,
    canViewReports,
    myInventory.length,
    myOrders.length,
    myEmployees.length,
  ]);

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
              {roleHeaderBadgeLabel}
            </span>
            <h1 style={{ margin: '0 0 6px', color: '#ffffff', fontSize: '1.55rem' }}>
              {isAuthorizedPharmacyUser
                ? activePharmacyName
                : isAr
                ? 'انضم لشبكة صيدليات دوايا المعتمدة'
                : 'Join DAWAYA Verified Pharmacy Network'}
            </h1>
            <p className="small" style={{ margin: 0, color: '#cbd5e1' }}>
              {isAuthorizedPharmacyUser
                ? isAr
                  ? `معرّف الصيدلية المعزول (Tenant ID): ${activePharmacyId} — دورك النشط: ${ROLE_DEFINITIONS[effectivePharmacyRole]?.nameAr || effectivePharmacyRole}`
                  : `Isolated Tenant ID: ${activePharmacyId} — Active Role: ${ROLE_DEFINITIONS[effectivePharmacyRole]?.nameEn || effectivePharmacyRole}`
                : isAr
                ? 'قدم طلب توثيق ترخيص صيدليتك لتفعيل بوابة المخزون واستقبال طلبات المرضى.'
                : 'Submit your pharmacy license application to activate your isolated pharmacy dashboard.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <RoleModeSwitcher />
            <Link to="/partners" className="btn small light">
              {isAr ? 'دليل الصيدليات العام' : 'Public Pharmacy Directory'}
            </Link>
          </div>
        </div>

        {/* Multi-Pharmacy Membership Switcher (if user belongs to >1 pharmacy) */}
        {pharmacyMemberships.length > 1 && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span className="small" style={{ color: '#CFD29D', fontWeight: 800 }}>
              🏥 {isAr ? 'التبديل بين الصيدليات المصرح لك بإدارتها:' : 'Switch Active Pharmacy:'}
            </span>
            {pharmacyMemberships.map((mem) => (
              <button
                key={mem.id}
                type="button"
                onClick={() => switchMode(mem.role, { pharmacyId: mem.pharmacyId })}
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: activePharmacyId === mem.pharmacyId ? '1.5px solid #CFD29D' : '1px solid rgba(255,255,255,0.25)',
                  background: activePharmacyId === mem.pharmacyId ? '#059669' : 'transparent',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {mem.pharmacyNameAr || mem.pharmacyId} ({ROLE_DEFINITIONS[mem.role]?.badge})
              </button>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="row wrapRow" style={{ gap: '8px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          {visibleTabs.map((t) => (
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

      {/* TAB 1: DESIGN 1 OVERVIEW — 2x2 Dark Navy & Gold KPI Grid + Live Orders & Shortage Radar */}
      {isAuthorizedPharmacyUser && activeTab === 'overview' && (
        <div className="stack">
          <div
            style={{
              background: 'linear-gradient(145deg, #091526 0%, #0D1F38 100%)',
              padding: '16px',
              borderRadius: '24px',
              boxShadow: '0 16px 38px rgba(13, 31, 56, 0.28)',
              border: '1px solid rgba(207, 210, 157, 0.25)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #102442 0%, #0D1F38 100%)',
                  border: '1.5px solid #CFD29D',
                  borderRadius: '18px',
                  padding: '16px 18px',
                  boxShadow: '0 0 18px rgba(16, 185, 129, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>
                  <span>{isAr ? 'قيمة المخزون والمبيعات:' : 'Stock & Sales Value:'}</span>
                  <span style={{ color: '#10b981' }}>▲</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#CFD29D', marginTop: '6px' }}>
                  {myInventory.reduce((acc, i) => acc + i.pharmacyPriceEgp * (i.quantityPacks || 1), 0).toLocaleString()} <small style={{ fontSize: '0.9rem' }}>ج.م</small>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('orders')}
                style={{
                  background: 'linear-gradient(135deg, #102442 0%, #0D1F38 100%)',
                  border: '1.5px solid #CFD29D',
                  borderRadius: '18px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>
                  {isAr ? 'الطلبات الواردة للصيدلية:' : 'Incoming Orders:'}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#CFD29D', marginTop: '6px' }}>
                  {myOrders.length} <small style={{ fontSize: '0.82rem', color: '#10b981' }}>({isAr ? `جديد: ${pendingOrdersCount}` : `Pending: ${pendingOrdersCount}`})</small>
                </div>
              </div>

              <div
                onClick={() => {
                  setInvRadarFilter('low_stock');
                  setActiveTab('inventory');
                }}
                style={{
                  background: 'linear-gradient(135deg, #102442 0%, #0D1F38 100%)',
                  border: '1.5px solid #CFD29D',
                  borderRadius: '18px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>
                  {isAr ? 'عجز ونواقص الرف:' : 'Shelf Shortages:'}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#CFD29D', marginTop: '6px' }}>
                  {lowStockItems.length} <small style={{ fontSize: '0.85rem' }}>{isAr ? 'أصناف' : 'items'}</small>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('inventory')}
                style={{
                  background: 'linear-gradient(135deg, #102442 0%, #0D1F38 100%)',
                  border: '1.5px solid #CFD29D',
                  borderRadius: '18px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>
                  {isAr ? 'أصناف المخزون الموثقة:' : 'Verified Stock Items:'}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#CFD29D', marginTop: '6px' }}>
                  {myInventory.length}
                </div>
              </div>
            </div>
          </div>

          {/* Direct Live Orders & Shortage Preview on Overview (Design 1 Style) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
            <div className="card stack" style={{ borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{isAr ? 'الطلبات الواردة الآن' : 'Live Incoming Orders'}</h3>
                <button type="button" className="btn small ghost" onClick={() => setActiveTab('orders')}>
                  {isAr ? 'كل الطلبات ←' : 'All Orders →'}
                </button>
              </div>
              {myOrders.slice(0, 3).map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <b>{ord.medicationNameAr} ({ord.quantity || 1} عبوة)</b>
                    <div className="small muted">{ord.patientName} • {ord.city}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      border: '1px solid #b5b37c',
                      background: 'linear-gradient(135deg, #d4d6a1 0%, #c2c086 100%)',
                      color: '#0D1F38',
                      fontWeight: 900,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'مراجعة وتأكيد الطلب' : 'Review Order'}
                  </button>
                </div>
              ))}
            </div>

            <div className="card stack" style={{ borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{isAr ? 'رادار العجز والنواقص بالصيدلية' : 'Pharmacy Shortage Radar'}</h3>
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() => {
                    setInvRadarFilter('low_stock');
                    setActiveTab('inventory');
                  }}
                >
                  {isAr ? 'تحديث الرصيد ←' : 'Restock →'}
                </button>
              </div>
              {(lowStockItems.length > 0 ? lowStockItems : myInventory.slice(0, 3)).slice(0, 4).map((item) => (
                <div key={item.id} style={{ display: 'grid', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <b>{item.tradeNameAr}</b>
                    <span style={{ fontWeight: 800, color: (item.quantityPacks || 0) <= item.lowStockThreshold ? '#d97706' : '#059669' }}>
                      {isAr ? `الرصيد: ${item.quantityPacks ?? 0} عبوة` : `Stock: ${item.quantityPacks ?? 0}`}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '7px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.14)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(12, ((item.quantityPacks || 1) / 25) * 100))}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: (item.quantityPacks || 0) <= item.lowStockThreshold ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </div>
              ))}
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

      {/* TAB 1B: PHARMACY PROFILE & BRANCH MANAGEMENT (Section 6B) */}
      {isAuthorizedPharmacyUser && activeTab === 'pharmacy_profile' && (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>
            {isAr ? 'ملف الصيدلية المعتمد والفروع المرتبطة ومواعيد العمل' : 'Pharmacy Profile, Verification & Branches'}
          </h2>
          <div className="form-row">
            <div className="subcard stack" style={{ gap: '6px' }}>
              <b>{isAr ? 'بيانات الصيدلية الأساسية:' : 'Core Pharmacy Info:'}</b>
              <div className="small"><b>{isAr ? 'الاسم:' : 'Name:'}</b> {activePharmacyName}</div>
              <div className="small"><b>{isAr ? 'معرّف الصيدلية (Tenant ID):' : 'Tenant ID:'}</b> <code dir="ltr">{activePharmacyId}</code></div>
              <div className="small">
                <b>{isAr ? 'حالة التوثيق:' : 'Verification Status:'}</b>{' '}
                <span className="badge approved">
                  {activePartnerRecord?.verificationStatus || 'verified'}
                </span>
              </div>
            </div>

            <div className="subcard stack" style={{ gap: '6px' }}>
              <b>{isAr ? 'مواعيد العمل والتوصيل:' : 'Hours & Delivery:'}</b>
              <div className="small">
                <b>{isAr ? 'مواعيد العمل:' : 'Opening Hours:'}</b>{' '}
                {activePartnerRecord?.workingHoursAr || 'يومياً على مدار 24 ساعة'}
              </div>
              <div className="small">
                <b>{isAr ? 'التوصيل المنزلي:' : 'Home Delivery:'}</b>{' '}
                {activePartnerRecord?.deliveryAvailable !== false
                  ? isAr ? 'متاح ومفعل ✓' : 'Available ✓'
                  : isAr ? 'استلام من الفرع فقط' : 'In-store pickup only'}
              </div>
              <div className="small">
                <b>{isAr ? 'هاتف التواصل:' : 'Contact Phone:'}</b>{' '}
                <span dir="ltr">{activePartnerRecord?.phone || activePartnerRecord?.hotline || '19011'}</span>
              </div>
            </div>
          </div>

          <div className="subcard stack">
            <b>{isAr ? `الفروع المعتمدة المرتبطة بالصيدلية (${activePharmacyBranches.length}):` : `Authorized Pharmacy Branches (${activePharmacyBranches.length}):`}</b>
            {activePharmacyBranches.length === 0 ? (
              <p className="small muted" style={{ margin: 0 }}>
                {isAr ? 'الفرع الرئيسي مفعل ويعمل تحت نفس معرّف الصيدلية.' : 'Main flagship branch is active.'}
              </p>
            ) : (
              <div className="stack" style={{ gap: '8px' }}>
                {activePharmacyBranches.map((br) => (
                  <div
                    key={br.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <b>{br.branchNameAr}</b> — <span className="small muted">{br.city} ({br.addressAr})</span>
                    </div>
                    <span className="badge approved">{br.is24Hours ? '24h' : br.workingHoursAr}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: PHARMACY INVENTORY & BATCH/EXPIRY MANAGEMENT */}
      {isAuthorizedPharmacyUser && canViewInventory && activeTab === 'inventory' && (
        <div className="stack">
          {canManageInventory && (
            <section className="card stack">
              <h2 style={{ margin: 0 }}>
                {isAr ? 'إضافة أو تحديث رصيد دواء بمخزون الصيدلية' : 'Update Verified Pharmacy Medication Inventory'}
              </h2>
              <p className="small muted" style={{ margin: 0 }}>
                {isAr
                  ? 'وجود الدواء في قاعدة بيانات دوايا لا يعني توفره تلقائياً بكل صيدلية؛ يتم عرض التوفر للعملاء فقط بناءً على تحديثك الفعلي هنا.'
                  : 'Listing in DAWAYA catalog does not imply stock; customers only see availability verified here.'}
              </p>

              {/* Quick Autofill from 26,562 Catalog + 1-Tap Barcode Camera Scanner */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}><b>{isAr ? 'ابحث في موسوعة دوايا (26,562 دواء) أو امسح باركود العلبة:' : 'Search DAWAYA Catalog or Scan Carton Barcode:'}</b></label>
                  <label
                    className="btn small ghost"
                    style={{ cursor: 'pointer', borderRadius: '999px', margin: 0 }}
                  >
                    {isAr ? 'مسح باركود العلبة بالكاميرا' : 'Scan Box Barcode via Camera'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
                            const bmp = await createImageBitmap(file);
                            const detector = new (window as any).BarcodeDetector({
                              formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'qr_code'],
                            });
                            const codes = await detector.detect(bmp);
                            if (codes && codes.length > 0 && codes[0].rawValue) {
                              const codeStr = String(codes[0].rawValue).trim();
                              setInvSearchQ(codeStr);
                              showToast(isAr ? `تم قراءة الباركود بنجاح: ${codeStr}` : `Barcode detected: ${codeStr}`);
                              return;
                            }
                          }
                          showToast(isAr ? 'يرجى تقريب الكاميرا من الخطوط السوداء للباركود أو كتابة الرقم بالبحث.' : 'Please focus clearly on the barcode or type the digits.');
                        } catch {
                          showToast(isAr ? 'تعذر قراءة الباركود تلقائياً، يمكنك كتابة أول حروف الدواء مباشرة.' : 'Could not read barcode automatically.');
                        }
                      }}
                    />
                  </label>
                </div>
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
          )}

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
                    {canManageInventory && <th>{isAr ? 'إجراء' : 'Action'}</th>}
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
                        <td><b>{item.quantityPacks !== null ? `${item.quantityPacks} عبوة` : (isAr ? 'حسب حالة التوفر' : 'By Status')}</b></td>
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
                        {canManageInventory && (
                          <td>
                            <button
                              type="button"
                              className="btn small ghost"
                              onClick={() => deletePharmacyInventoryItem(item.id)}
                            >
                              {isAr ? 'حذف' : 'Remove'}
                            </button>
                          </td>
                        )}
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
      {isAuthorizedPharmacyUser && canManageOrders && activeTab === 'orders' && (
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
                      <strong>طلب رقم #{ord.orderNumber}</strong> — <span>{ord.medicationNameAr} ({ord.quantity || 1} عبوة)</span>
                      <div className="small muted">
                        العميل: {ord.patientName} • الهاتف: <span dir="ltr">{ord.patientPhone}</span> • العنوان: {ord.city} — {ord.deliveryAddress}
                      </div>
                    </div>
                    <span className="badge approved" style={{ fontWeight: 800 }}>
                      {CUSTOMER_ORDER_STATUS_LABELS[ord.status as CustomerOrderLifecycleStatus]?.ar || ord.status}
                    </span>
                  </div>

                  {/* Smart In-Stock Bioequivalent Alternative Recommender */}
                  {(() => {
                    const exactInStock = myInventory.find(
                      (i) =>
                        (i.medicationId === ord.medicationId || i.tradeNameAr === ord.medicationNameAr) &&
                        i.stockStatus === 'available'
                    );
                    if (exactInStock) return null;
                    const bioAlternatives = myInventory.filter(
                      (i) =>
                        i.stockStatus === 'available' &&
                        i.medicationId !== ord.medicationId &&
                        i.activeIngredient &&
                        ord.medicationNameEn &&
                        i.activeIngredient.toLowerCase().includes(ord.medicationNameEn.split(' ')[0].toLowerCase())
                    );
                    if (bioAlternatives.length === 0) return null;
                    return (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: '0.84rem',
                        }}
                      >
                        <b style={{ color: '#047857', display: 'block', marginBottom: '4px' }}>
                          {isAr
                            ? 'اقتراح ذكي للصيدلي — متوفر بمخزونك بديل بنفس المادة الفعالة:'
                            : 'Smart Pharmacist Match — Bioequivalent in your stock:'}
                        </b>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                          {bioAlternatives.map((alt) => (
                            <span key={alt.id} className="badge approved">
                              {alt.tradeNameAr} ({alt.pharmacyPriceEgp} ج.م • متوفر {alt.quantityPacks ?? ''} عبوة)
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                    <span className="small"><b>تحديث مرحلة الطلب (8 مراحل):</b></span>
                    {(
                      [
                        { id: 'pharmacy_confirmation', ar: '1. قبول وتأكيد الصيدلية' },
                        { id: 'preparing', ar: '2. جاري التحضير' },
                        { id: 'ready_for_delivery', ar: '3. جاهز للتوصيل' },
                        { id: 'out_for_delivery', ar: '4. خرج للتوصيل' },
                        { id: 'delivered', ar: '5. تم التسليم' },
                        { id: 'rejected', ar: 'اعتذار / غير متوفر' },
                      ] as const
                    ).map((stBtn) => (
                      <button
                        key={stBtn.id}
                        type="button"
                        className="btn small ghost"
                        onClick={async () => {
                          try {
                            await updatePartnerOrderStatus(
                              ord.id,
                              stBtn.id as any,
                              `تم تحديث حالة الطلب بواسطة الصيدلية إلى: ${stBtn.ar}`,
                              `Order updated by pharmacy to: ${stBtn.id}`,
                              user?.uid || 'pharmacist',
                              role || 'pharmacy_owner'
                            );
                            showToast(isAr ? `تم تحديث حالة الطلب إلى: ${stBtn.ar}` : `Order status updated to ${stBtn.id}`);
                          } catch (err: unknown) {
                            showToast(
                              isAr
                                ? `الانتقال غير مسموح في تسلسل المراحل: ${(err as Error)?.message || ''}`
                                : `Invalid status transition: ${(err as Error)?.message || ''}`
                            );
                          }
                        }}
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

      {/* TAB 4: AUTHORIZED PHARMACY EMPLOYEES & GRANULAR STAFF PERMISSIONS */}
      {isAuthorizedPharmacyUser && canManageEmployees && activeTab === 'employees' && (
        <div className="stack">
          <section className="card stack">
            <h2 style={{ margin: 0 }}>{isAr ? 'إضافة صيدلي أو موظف معتمد وتخصيص صلاحياته بالصيدلية' : 'Add Authorized Pharmacy Staff & Configure Permissions'}</h2>
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
                    onChange={(v) => {
                      const nextR = v as 'pharmacy_manager' | 'pharmacist' | 'employee';
                      setEmpRole(nextR);
                      setEmpCanManageInv(nextR !== 'employee');
                      setEmpCanConfirmOrders(true);
                      setEmpCanViewReports(nextR === 'pharmacy_manager');
                    }}
                    modalTitle={isAr ? 'اختر الدور الوظيفي بالصيدلية' : 'Select Pharmacy Role'}
                    options={[
                      { value: 'pharmacy_manager', label: isAr ? 'مدير فرع صيدلية (Pharmacy Manager)' : 'Pharmacy Manager' },
                      { value: 'pharmacist', label: isAr ? 'صيدلي معتمد (Pharmacist — الطلبات والروشتات والمخزون)' : 'Pharmacist' },
                      { value: 'employee', label: isAr ? 'موظف صيدلية (Pharmacy Employee — تجهيز الطلبات والتوصيل)' : 'Pharmacy Employee' },
                    ]}
                  />
                </div>
              </div>

              {/* Configurable Granular Staff Permissions (Section 6B & 6D) */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <b className="small" style={{ width: '100%' }}>
                  🔑 {isAr ? 'تخصيص الصلاحيات المسموحة لهذا الموظف:' : 'Configure Permitted Responsibilities:'}
                </b>
                <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={empCanConfirmOrders}
                    onChange={(e) => setEmpCanConfirmOrders(e.target.checked)}
                  />
                  <span>{isAr ? 'معالجة وتجهيز طلبات الأدوية (orders.manage)' : 'Process Medication Orders (orders.manage)'}</span>
                </label>
                <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={empCanManageInv}
                    onChange={(e) => setEmpCanManageInv(e.target.checked)}
                  />
                  <span>{isAr ? 'تحديث أصناف وكميات المخزون (inventory.manage)' : 'Update Inventory & Stock (inventory.manage)'}</span>
                </label>
                <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={empCanViewReports}
                    onChange={(e) => setEmpCanViewReports(e.target.checked)}
                  />
                  <span>{isAr ? 'الاطلاع على تقارير المبيعات والأداء (reports.view)' : 'View Sales & Performance Reports (reports.view)'}</span>
                </label>
              </div>

              <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
                {isAr ? 'إضافة للفريق المعتمد' : 'Add Staff Member'}
              </button>
            </form>
          </section>

          {/* Current Pharmacy Staff List with Suspend / Reactivate Controls */}
          <section className="card stack">
            <h3 style={{ margin: 0 }}>
              {isAr ? `قائمة صيادلة وموظفي الصيدلية الحاليين (${myEmployees.length})` : `Current Pharmacy Staff (${myEmployees.length})`}
            </h3>
            {myEmployees.length === 0 ? (
              <p className="muted">{isAr ? 'لم يتم تسجيل موظفين إضافيين لهذه الصيدلية بعد.' : 'No staff members added yet.'}</p>
            ) : (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>{isAr ? 'الاسم والإيميل' : 'Name & Email'}</th>
                      <th>{isAr ? 'الدور الوظيفي' : 'Role'}</th>
                      <th>{isAr ? 'الصلاحيات الممنوحة' : 'Permissions'}</th>
                      <th>{isAr ? 'الحالة' : 'Status'}</th>
                      <th>{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEmployees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <b>{emp.fullName}</b>
                          <div className="small muted" dir="ltr">{emp.email}</div>
                        </td>
                        <td>
                          <span className="badge approved">{emp.role.toUpperCase()}</span>
                        </td>
                        <td className="small">
                          {[
                            emp.canConfirmOrders ? (isAr ? 'الطلبات' : 'Orders') : null,
                            emp.canManageInventory ? (isAr ? 'المخزون' : 'Inventory') : null,
                            emp.canViewReports ? (isAr ? 'التقارير' : 'Reports') : null,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </td>
                        <td>
                          <span className={emp.active ? 'badge approved' : 'badge rejected'}>
                            {emp.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Suspended')}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => handleToggleEmployeeActive(emp)}
                          >
                            {emp.active ? (isAr ? 'إيقاف مؤقت' : 'Suspend') : (isAr ? 'إعادة تفعيل' : 'Reactivate')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 5: SALES & ANALYTICS REPORTS */}
      {isAuthorizedPharmacyUser && canViewReports && activeTab === 'reports' && (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>{isAr ? 'تقارير أداء الصيدلية والمبيعات والنواقص' : 'Pharmacy Sales & Inventory Analytics'}</h2>
          <div className="form-row">
            <div className="subcard">
              <b>{isAr ? 'إجمالي قيمة المخزون المسجل:' : 'Total Stock Value:'}</b>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>
                {myInventory.reduce((acc, i) => acc + i.pharmacyPriceEgp * (i.quantityPacks || 0), 0).toLocaleString()} ج.م
              </div>
            </div>
            <div className="subcard">
              <b>{isAr ? 'الطلبات المكتملة:' : 'Delivered Orders:'}</b>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284c7' }}>
                {completedOrdersCount}
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
