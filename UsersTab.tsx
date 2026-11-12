import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, configured } from './firebase';
import { useAuth } from './authContext';
import { useLang } from './i18n';
import { tr } from './types';
import SmartChoiceSelect, { SmartChoiceOption } from './SmartChoiceSelect';
import { UnslopIcon } from './UnslopIcons';
import {
  AccountStatus,
  ALL_PERMISSIONS,
  assignUserRoleWithScope,
  AuditLogEntry,
  CanonicalRole,
  CANONICAL_ROLES,
  normalizeRoleId,
  PermissionId,
  PharmacyMembership,
  RegionalMembership,
  revokeUserRoleWithAudit,
  ROLE_DEFINITIONS,
  setUserAccountStatusWithAudit,
} from './rbacEngine';
import { usePartnerEcosystem, useDawayaPharmacyNetwork } from './partnerService';

interface ManagedUserAccount {
  uid: string;
  email: string;
  displayName: string;
  accountStatus: AccountStatus;
  primaryRole: CanonicalRole;
  roles: CanonicalRole[];
  pharmacyMemberships: PharmacyMembership[];
  regionalMemberships: RegionalMembership[];
  updatedAt?: string;
}

const EGYPT_GOVERNORATE_OPTIONS: { id: string; ar: string; en: string }[] = [
  { id: 'dakahlia', ar: 'محافظة الدقهلية (المنصورة والمراكز)', en: 'Dakahlia Governorate' },
  { id: 'cairo', ar: 'محافظة القاهرة الكبرى', en: 'Cairo Governorate' },
  { id: 'giza', ar: 'محافظة الجيزة', en: 'Giza Governorate' },
  { id: 'alexandria', ar: 'محافظة الإسكندرية', en: 'Alexandria Governorate' },
  { id: 'sharkia', ar: 'محافظة الشرقية (الزقازيق)', en: 'Sharkia Governorate' },
  { id: 'gharbia', ar: 'محافظة الغربية (طنطا والمحلة)', en: 'Gharbia Governorate' },
  { id: 'qalyubia', ar: 'محافظة القليوبية (بنها)', en: 'Qalyubia Governorate' },
  { id: 'menoufia', ar: 'محافظة المنوفية (شبين الكوم)', en: 'Menoufia Governorate' },
  { id: 'beheira', ar: 'محافظة البحيرة (دمنهور)', en: 'Beheira Governorate' },
  { id: 'kafr_el_sheikh', ar: 'محافظة كفر الشيخ', en: 'Kafr El Sheikh Governorate' },
  { id: 'damietta', ar: 'محافظة دمياط', en: 'Damietta Governorate' },
  { id: 'port_said', ar: 'محافظة بورسعيد', en: 'Port Said Governorate' },
  { id: 'ismailia', ar: 'محافظة الإسماعيلية', en: 'Ismailia Governorate' },
  { id: 'suez', ar: 'محافظة السويس', en: 'Suez Governorate' },
  { id: 'assiut', ar: 'محافظة أسيوط', en: 'Assiut Governorate' },
  { id: 'minya', ar: 'محافظة المنيا', en: 'Minya Governorate' },
  { id: 'sohag', ar: 'محافظة سوهاج', en: 'Sohag Governorate' },
  { id: 'aswan', ar: 'محافظة أسوان', en: 'Aswan Governorate' },
  { id: 'luxor', ar: 'محافظة الأقصر', en: 'Luxor Governorate' },
];

export default function UsersTab({ myUid }: { myUid: string }) {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { user: currentUser, canonicalRole: myCanonicalRole, refreshPermissions } = useAuth();
  const { partners } = usePartnerEcosystem();
  const { dynamicGovernorates } = useDawayaPharmacyNetwork();

  const [subView, setSubView] = useState<'users' | 'matrix' | 'audit'>('users');
  const [accounts, setAccounts] = useState<ManagedUserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Role Assignment Form State
  const [targetUid, setTargetUid] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetName, setTargetName] = useState('');
  const [newRole, setNewRole] = useState<CanonicalRole>('pharmacy_owner');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('partner_dawaya_flagship_mansoura');
  const [selectedBranchIds, setSelectedBranchIds] = useState('*');
  const [selectedRegionId, setSelectedRegionId] = useState('dakahlia');
  const [customPerms, setCustomPerms] = useState<PermissionId[]>(
    ROLE_DEFINITIONS.pharmacy_owner.permissions
  );
  const [assignReason, setAssignReason] = useState('');

  // Filters & Inspection Modal
  const [searchFilter, setSearchFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'platform' | 'clinical' | 'pharmacy' | 'patient'>('all');
  const [selectedAccountUid, setSelectedAccountUid] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Sync default permissions when newRole changes
  useEffect(() => {
    setCustomPerms(ROLE_DEFINITIONS[newRole]?.permissions || ['patient.access', 'medications.view']);
  }, [newRole]);

  const isPharmacyRoleSelected = [
    'pharmacy_owner',
    'pharmacy_manager',
    'pharmacist',
    'pharmacy_employee',
  ].includes(newRole);

  const isRegionalRoleSelected = newRole === 'regional_manager';

  async function loadAllUsersAndRoles() {
    if (!configured || !db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const map = new Map<string, ManagedUserAccount>();

      const ensureEntry = (uid: string): ManagedUserAccount => {
        if (!map.has(uid)) {
          map.set(uid, {
            uid,
            email: '',
            displayName: '',
            accountStatus: 'active',
            primaryRole: 'patient',
            roles: ['patient'],
            pharmacyMemberships: [],
            regionalMemberships: [],
          });
        }
        return map.get(uid)!;
      };

      // 1. Load customerProfiles
      try {
        const profSnap = await getDocs(collection(db, 'customerProfiles'));
        profSnap.forEach((d) => {
          const data = d.data();
          const entry = ensureEntry(d.id);
          if (data.email) entry.email = data.email;
          if (data.displayName) entry.displayName = data.displayName;
          if (data.accountStatus === 'suspended') entry.accountStatus = 'suspended';
          if (data.updatedAt) entry.updatedAt = data.updatedAt;
        });
      } catch {
        /* ignore */
      }

      // 2. Load primary roles collection
      try {
        const rolesSnap = await getDocs(collection(db, 'roles'));
        rolesSnap.forEach((d) => {
          const data = d.data();
          const entry = ensureEntry(d.id);
          if (data.email) entry.email = data.email;
          if (data.displayName) entry.displayName = data.displayName;
          if (data.accountStatus === 'suspended') entry.accountStatus = 'suspended';
          if (data.updatedAt) entry.updatedAt = data.updatedAt;

          const roleSet = new Set<CanonicalRole>(entry.roles);
          if (data.role) roleSet.add(normalizeRoleId(data.role));
          if (Array.isArray(data.roles)) {
            data.roles.forEach((r: string) => roleSet.add(normalizeRoleId(r)));
          }
          entry.roles = Array.from(roleSet);
          entry.primaryRole = normalizeRoleId(data.canonicalRole || data.role);

          if (data.pharmacyId) {
            const pRole = normalizeRoleId(data.role);
            const validPRole =
              pRole === 'pharmacy_owner' ||
              pRole === 'pharmacy_manager' ||
              pRole === 'pharmacist' ||
              pRole === 'pharmacy_employee'
                ? pRole
                : 'pharmacy_owner';
            entry.pharmacyMemberships.push({
              id: `${d.id}_${data.pharmacyId}`,
              uid: d.id,
              email: entry.email,
              pharmacyId: data.pharmacyId,
              pharmacyNameAr: data.pharmacyNameAr || '',
              branchIds: ['*'],
              role: validPRole,
              permissions: Array.isArray(data.permissions)
                ? data.permissions
                : ROLE_DEFINITIONS[validPRole].permissions,
              status: 'active',
              assignedBy: data.updatedBy || 'system',
              assignedAt: data.updatedAt || '',
            });
          }

          if (data.regionId) {
            entry.regionalMemberships.push({
              id: `${d.id}_${data.regionId}`,
              uid: d.id,
              email: entry.email,
              regionId: data.regionId,
              regionNameAr: data.regionNameAr || '',
              role: 'regional_manager',
              permissions: ROLE_DEFINITIONS.regional_manager.permissions,
              status: 'active',
              assignedBy: data.updatedBy || 'system',
              assignedAt: data.updatedAt || '',
            });
          }
        });
      } catch {
        /* ignore */
      }

      // 3. Load userRoles collection
      try {
        const uRolesSnap = await getDocs(collection(db, 'userRoles'));
        uRolesSnap.forEach((d) => {
          const data = d.data();
          if (data.uid && data.status === 'active') {
            const entry = ensureEntry(data.uid);
            if (data.email && !entry.email) entry.email = data.email;
            if (data.displayName && !entry.displayName) entry.displayName = data.displayName;
            const cRole = normalizeRoleId(data.role);
            if (!entry.roles.includes(cRole)) {
              entry.roles.push(cRole);
            }
          }
        });
      } catch {
        /* ignore */
      }

      // 4. Load pharmacyMemberships collection
      try {
        const pMemSnap = await getDocs(collection(db, 'pharmacyMemberships'));
        pMemSnap.forEach((d) => {
          const data = d.data();
          if (data.uid && data.status === 'active' && data.pharmacyId) {
            const entry = ensureEntry(data.uid);
            if (!entry.pharmacyMemberships.some((m) => m.pharmacyId === data.pharmacyId)) {
              const mRole = normalizeRoleId(data.role);
              const validPRole =
                mRole === 'pharmacy_owner' ||
                mRole === 'pharmacy_manager' ||
                mRole === 'pharmacist' ||
                mRole === 'pharmacy_employee'
                  ? mRole
                  : 'pharmacist';
              entry.pharmacyMemberships.push({
                id: d.id,
                uid: data.uid,
                email: data.email || entry.email,
                pharmacyId: data.pharmacyId,
                pharmacyNameAr: data.pharmacyNameAr || '',
                branchIds: Array.isArray(data.branchIds) ? data.branchIds : ['*'],
                role: validPRole,
                permissions: Array.isArray(data.permissions)
                  ? data.permissions
                  : ROLE_DEFINITIONS[validPRole].permissions,
                status: 'active',
                assignedBy: data.assignedBy || 'system',
                assignedAt: data.assignedAt || '',
              });
            }
          }
        });
      } catch {
        /* ignore */
      }

      // 5. Load regionalMemberships collection
      try {
        const rMemSnap = await getDocs(collection(db, 'regionalMemberships'));
        rMemSnap.forEach((d) => {
          const data = d.data();
          if (data.uid && data.status === 'active' && data.regionId) {
            const entry = ensureEntry(data.uid);
            if (!entry.regionalMemberships.some((m) => m.regionId === data.regionId)) {
              entry.regionalMemberships.push({
                id: d.id,
                uid: data.uid,
                email: data.email || entry.email,
                regionId: data.regionId,
                regionNameAr: data.regionNameAr || '',
                role: 'regional_manager',
                permissions: Array.isArray(data.permissions)
                  ? data.permissions
                  : ROLE_DEFINITIONS.regional_manager.permissions,
                status: 'active',
                assignedBy: data.assignedBy || 'system',
                assignedAt: data.assignedAt || '',
              });
            }
          }
        });
      } catch {
        /* ignore */
      }

      // 6. Load auditLogs collection
      try {
        const auditSnap = await getDocs(collection(db, 'auditLogs'));
        const logs: AuditLogEntry[] = [];
        auditSnap.forEach((d) => {
          const data = d.data() as AuditLogEntry;
          logs.push({ ...data, id: d.id });
        });
        logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAuditLogs(logs.slice(0, 100));
      } catch {
        /* ignore */
      }

      setAccounts(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAllUsersAndRoles();
  }, []);

  const roleSelectOptions: SmartChoiceOption[] = useMemo(() => {
    return CANONICAL_ROLES.map((r) => {
      const def = ROLE_DEFINITIONS[r];
      return {
        value: r,
        label: isAr ? def.nameAr : def.nameEn,
        description: isAr ? def.descriptionAr : def.descriptionEn,
        badge: def.badge,
      };
    });
  }, [isAr]);

  const pharmacySelectOptions: SmartChoiceOption[] = useMemo(() => {
    const list: SmartChoiceOption[] = partners.map((p) => ({
      value: p.id,
      label: isAr ? `${p.nameAr} (${p.governorate})` : `${p.nameEn || p.nameAr} (${p.governorate})`,
      description: `ID: ${p.id} — ${p.verificationStatus}`,
      badge: 'PHARMACY',
    }));
    if (!list.some((x) => x.value === 'partner_dawaya_flagship_mansoura')) {
      list.unshift({
        value: 'partner_dawaya_flagship_mansoura',
        label: isAr ? 'صيدلية دوايا النموذجية — المنصورة' : 'DAWAYA Flagship Pharmacy — Mansoura',
        description: 'ID: partner_dawaya_flagship_mansoura',
        badge: 'FLAGSHIP',
      });
    }
    return list;
  }, [partners, isAr]);

  const regionSelectOptions: SmartChoiceOption[] = useMemo(() => {
    const base = [...EGYPT_GOVERNORATE_OPTIONS];
    dynamicGovernorates.forEach((dg) => {
      if (!base.some((b) => b.id === dg.id)) {
        base.push({ id: dg.id, ar: dg.nameAr, en: dg.nameEn || dg.nameAr });
      }
    });
    return base.map((g) => ({
      value: g.id,
      label: isAr ? g.ar : g.en,
      description: `Region ID: ${g.id}`,
      badge: 'REGION',
    }));
  }, [dynamicGovernorates, isAr]);

  async function handleAssignRole() {
    if (!targetUid.trim()) return;
    setBusy(true);
    setMsg('');
    setErrMsg('');
    try {
      const matchedPartner = partners.find((p) => p.id === selectedPharmacyId);
      const matchedRegion = regionSelectOptions.find((r) => r.value === selectedRegionId);
      const parsedBranches = selectedBranchIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await assignUserRoleWithScope({
        actorUid: myUid,
        actorEmail: currentUser?.email || '',
        actorRole: myCanonicalRole,
        targetUid: targetUid.trim(),
        targetEmail: targetEmail.trim(),
        targetDisplayName: targetName.trim(),
        roleToAssign: newRole,
        pharmacyId: isPharmacyRoleSelected ? selectedPharmacyId : undefined,
        pharmacyNameAr: isPharmacyRoleSelected
          ? matchedPartner?.nameAr || 'صيدلية دوايا النموذجية — المنصورة'
          : undefined,
        branchIds: isPharmacyRoleSelected ? parsedBranches : undefined,
        regionId: isRegionalRoleSelected ? selectedRegionId : undefined,
        regionNameAr: isRegionalRoleSelected ? matchedRegion?.label : undefined,
        customPermissions: customPerms,
        reason: assignReason.trim() || 'Assigned via Central Admin User & Role Management',
      });

      setMsg(
        tr(
          lang,
          `تم منح الدور (${ROLE_DEFINITIONS[newRole].nameAr}) وربط النطاق وتسجيل العملية في سجل المراجعة الأمني بنجاح ✓`,
          `Role (${ROLE_DEFINITIONS[newRole].nameEn}) assigned and logged in Audit Trail successfully ✓`
        )
      );
      await loadAllUsersAndRoles();
      if (targetUid.trim() === myUid) {
        await refreshPermissions();
      }
      setTargetUid('');
      setTargetEmail('');
      setTargetName('');
      setAssignReason('');
    } catch (e: unknown) {
      const errObj = e as { message?: string };
      setErrMsg(errObj?.message || t('actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeRole(
    account: ManagedUserAccount,
    roleToRevoke: CanonicalRole
  ) {
    if (roleToRevoke === 'patient') {
      setErrMsg(
        tr(
          lang,
          'دور المريض (Patient) هو الدور الافتراضي الأساسي ولا يمكن حذفه.',
          'Patient is the baseline default role and cannot be removed.'
        )
      );
      return;
    }
    const pharmMem = account.pharmacyMemberships.find((m) => m.role === roleToRevoke);
    const regMem = account.regionalMemberships[0];

    setBusy(true);
    setMsg('');
    setErrMsg('');
    try {
      await revokeUserRoleWithAudit({
        actorUid: myUid,
        actorEmail: currentUser?.email || '',
        targetUid: account.uid,
        roleToRevoke,
        pharmacyId: pharmMem?.pharmacyId,
        regionId: roleToRevoke === 'regional_manager' ? regMem?.regionId : undefined,
        reason: `Role ${roleToRevoke} revoked by Central Admin`,
      });
      setMsg(
        tr(
          lang,
          `تم سحب دور (${ROLE_DEFINITIONS[roleToRevoke].badge}) من المستخدم (${account.uid}) وإعادة ضبط صلاحياته بأمان ✓`,
          `Revoked role (${ROLE_DEFINITIONS[roleToRevoke].badge}) from user (${account.uid}) safely ✓`
        )
      );
      await loadAllUsersAndRoles();
      if (account.uid === myUid) {
        await refreshPermissions();
      }
    } catch (e: unknown) {
      const errObj = e as { message?: string };
      setErrMsg(errObj?.message || t('actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleAccountStatus(account: ManagedUserAccount) {
    const nextStatus: AccountStatus =
      account.accountStatus === 'suspended' ? 'active' : 'suspended';
    setBusy(true);
    setMsg('');
    setErrMsg('');
    try {
      await setUserAccountStatusWithAudit({
        actorUid: myUid,
        actorEmail: currentUser?.email || '',
        targetUid: account.uid,
        newStatus: nextStatus,
        reason:
          nextStatus === 'suspended'
            ? 'Account suspended by Central Admin'
            : 'Account restored by Central Admin',
      });
      setMsg(
        nextStatus === 'suspended'
          ? tr(lang, `تم إيقاف الحساب (${account.uid}) مؤقتاً عبر جميع الواجهات.`, `Account (${account.uid}) suspended across all interfaces.`)
          : tr(lang, `تمت استعادة وتفعيل الحساب (${account.uid}) بنجاح.`, `Account (${account.uid}) restored to active status.`)
      );
      await loadAllUsersAndRoles();
    } catch (e: unknown) {
      const errObj = e as { message?: string };
      setErrMsg(errObj?.message || t('actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  const togglePermissionInCustomSet = (permId: PermissionId) => {
    setCustomPerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const primaryDef = ROLE_DEFINITIONS[acc.primaryRole] || ROLE_DEFINITIONS.patient;
      if (tierFilter !== 'all' && primaryDef.tier !== tierFilter) return false;
      const q = searchFilter.trim().toLowerCase();
      if (!q) return true;
      return (
        acc.uid.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.displayName.toLowerCase().includes(q) ||
        acc.roles.some((r) => r.toLowerCase().includes(q)) ||
        acc.pharmacyMemberships.some((m) => m.pharmacyId.toLowerCase().includes(q)) ||
        acc.regionalMemberships.some((m) => m.regionId.toLowerCase().includes(q))
      );
    });
  }, [accounts, tierFilter, searchFilter]);

  const inspectedAccount = useMemo(
    () => accounts.find((a) => a.uid === selectedAccountUid) || null,
    [accounts, selectedAccountUid]
  );

  return (
    <div className="card stack" style={{ marginTop: '0.5rem', gap: '1.15rem' }}>
      {/* Header & Sub-Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UnslopIcon name="shield" size={22} color="#059669" />
            {tr(
              lang,
              'إدارة المستخدمين والأدوار والعضويات المتعددة (User & Role Management)',
              'Central Admin: User, Multi-Role & Scoped Membership Management'
            )}
          </h2>
          <p className="small muted" style={{ margin: 0 }}>
            {tr(
              lang,
              'نظام موحد يدعم تعدد الأدوار لنفس الحساب، ربط الصيدليات والفروع، تخصيص النطاق الجغرافي للمحافظات، وسجل المراجعة الأمني.',
              'Unified RBAC supporting multiple roles per user, pharmacy & branch memberships, regional governorate scoping, and audit logs.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={subView === 'users' ? 'btn small' : 'btn small ghost'}
            onClick={() => setSubView('users')}
          >
            👥 {tr(lang, `المستخدمون والأدوار (${accounts.length})`, `Users & Roles (${accounts.length})`)}
          </button>
          <button
            type="button"
            className={subView === 'matrix' ? 'btn small' : 'btn small ghost'}
            onClick={() => setSubView('matrix')}
          >
            🔐 {tr(lang, 'مصفوفة الأدوار والصلاحيات (RBAC Matrix)', 'Role & Permission Matrix')}
          </button>
          <button
            type="button"
            className={subView === 'audit' ? 'btn small' : 'btn small ghost'}
            onClick={() => setSubView('audit')}
          >
            📜 {tr(lang, `سجل تغييرات الأدوار (${auditLogs.length})`, `Role Audit Logs (${auditLogs.length})`)}
          </button>
        </div>
      </div>

      {/* Current Admin Account UID Card */}
      <div
        className="subcard"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
        }}
      >
        <div className="small" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <UnslopIcon name="user" size={17} color="#059669" />
          <b>{tr(lang, 'معرّف حسابك الإداري (Your Admin UID):', 'Your Admin UID:')}</b>
          <code
            dir="ltr"
            style={{
              userSelect: 'all',
              padding: '4px 10px',
              borderRadius: 6,
              background: 'var(--card-bg)',
              border: '1px solid var(--line)',
              fontWeight: 700,
            }}
          >
            {myUid}
          </code>
          <span className="badge approved">{ROLE_DEFINITIONS[myCanonicalRole]?.badge}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              setTargetUid(myUid);
              setTargetEmail(currentUser?.email || '');
              setTargetName(currentUser?.displayName || '');
            }}
          >
            {tr(lang, 'إضافة دور إضافي لحسابي (للتجربة)', 'Add Role to My Account')}
          </button>
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(myUid).catch(() => {});
                setMsg(tr(lang, 'تم نسخ الـ UID الخاص بك', 'Your UID has been copied'));
              }
            }}
          >
            {tr(lang, 'نسخ الـ UID', 'Copy UID')}
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--navy)',
            fontWeight: 700,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <UnslopIcon name="check" size={18} color="#059669" />
          <span>{msg}</span>
        </div>
      )}

      {errMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            color: '#b91c1c',
            fontWeight: 700,
            borderRadius: 10,
          }}
        >
          ⚠️ {errMsg}
        </div>
      )}

      {subView === 'users' && (
        <>
          {/* Section 7: Role Assignment & Scoped Membership Form */}
          <div className="subcard stack" style={{ gap: '0.95rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <b>
                {tr(
                  lang,
                  'منح دور وظيفي وربط العضوية (يدعم تعدد الأدوار لنفس الحساب):',
                  'Assign Role & Link Membership (Supports Multiple Roles per User):'
                )}
              </b>
              <span className="badge approved">
                {ROLE_DEFINITIONS[newRole]?.badge}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: 4 }}>
                  {tr(lang, 'معرّف المستخدم (Firebase UID) *', 'User Firebase UID *')}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="e.g. xK9p2..."
                  value={targetUid}
                  onChange={(e) => setTargetUid(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 10, border: '1.5px solid var(--line)' }}
                />
              </div>

              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: 4 }}>
                  {tr(lang, 'البريد الإلكتروني (اختياري للتوثيق)', 'User Email (Optional)')}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="doctor@example.com"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 10, border: '1.5px solid var(--line)' }}
                />
              </div>

              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: 4 }}>
                  {tr(lang, 'الدور الوظيفي المراد منحه *', 'Role to Assign *')}
                </label>
                <SmartChoiceSelect
                  value={newRole}
                  onChange={(val) => setNewRole(val as CanonicalRole)}
                  options={roleSelectOptions}
                  modalTitle={tr(lang, 'اختر الدور الوظيفي', 'Select Role to Assign')}
                  modalSubtitle={tr(
                    lang,
                    'يمكن للمستخدم الواحد امتلاك أكثر من دور والتبديل بينها عبر زر تغيير الوضع',
                    'A single user can hold multiple roles and switch between them via Switch Mode'
                  )}
                />
              </div>
            </div>

            {/* Conditional Pharmacy Scope Selector when assigning Pharmacy Owner / Manager / Pharmacist / Employee */}
            {isPharmacyRoleSelected && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(13, 148, 136, 0.07)',
                  border: '1.5px solid rgba(13, 148, 136, 0.3)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label className="small" style={{ fontWeight: 800, color: '#0f766e', display: 'block', marginBottom: 4 }}>
                    🏥 {tr(lang, 'الصيدلية المرتبطة بهذه العضوية (إلزامي للعزل الأمني) *', 'Linked Pharmacy (Required for Tenant Isolation) *')}
                  </label>
                  <SmartChoiceSelect
                    value={selectedPharmacyId}
                    onChange={(val) => setSelectedPharmacyId(val)}
                    options={pharmacySelectOptions}
                    modalTitle={tr(lang, 'اختر الصيدلية المرتبطة', 'Select Linked Pharmacy')}
                    modalSubtitle={tr(lang, 'لن يتمكن المستخدم من الوصول لأي صيدلية أخرى غير المحددة هنا', 'User will be strictly isolated to this pharmacy only')}
                  />
                </div>

                <div>
                  <label className="small" style={{ fontWeight: 800, color: '#0f766e', display: 'block', marginBottom: 4 }}>
                    📍 {tr(lang, 'الفروع المصرح بها (اتركها * لكل فروع الصيدلية)', 'Authorized Branch IDs (* for all branches)')}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={selectedBranchIds}
                    onChange={(e) => setSelectedBranchIds(e.target.value)}
                    placeholder="* or branch_1, branch_2"
                    style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 10, border: '1.5px solid var(--line)' }}
                  />
                </div>
              </div>
            )}

            {/* Conditional Regional Scope Selector when assigning Regional Manager */}
            {isRegionalRoleSelected && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(124, 58, 237, 0.07)',
                  border: '1.5px solid rgba(124, 58, 237, 0.3)',
                }}
              >
                <label className="small" style={{ fontWeight: 800, color: '#6d28d9', display: 'block', marginBottom: 6 }}>
                  🗺️ {tr(lang, 'النطاق الجغرافي للمدير الإقليمي (المحافظة المعينة) *', 'Regional Manager Geographic Scope (Governorate) *')}
                </label>
                <SmartChoiceSelect
                  value={selectedRegionId}
                  onChange={(val) => setSelectedRegionId(val)}
                  options={regionSelectOptions}
                  modalTitle={tr(lang, 'اختر المحافظة / الإقليم الجغرافي', 'Select Governorate Scope')}
                  modalSubtitle={tr(lang, 'المدير الإقليمي يدير الصيدليات والفروع داخل هذا النطاق الجغرافي فقط', 'Regional Manager is restricted to pharmacies within this governorate')}
                />
              </div>
            )}

            {/* Granular Permission Checkboxes */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--bg)',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <b className="small">
                  🔑 {tr(lang, 'الصلاحيات التفصيلية الممنوحة مع هذا الدور (Granular Permissions):', 'Granular Permissions Granted with Role:')}
                </b>
                <span className="small muted">
                  {tr(lang, `محدد: ${customPerms.length} صلاحية`, `Selected: ${customPerms.length} permissions`)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '6px' }}>
                {ALL_PERMISSIONS.map((perm) => {
                  const checked = customPerms.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: checked ? '1px solid #059669' : '1px solid var(--line)',
                        background: checked ? 'rgba(16, 185, 129, 0.08)' : 'var(--card-bg)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermissionInCustomSet(perm.id)}
                      />
                      <span>
                        <b>{isAr ? perm.labelAr : perm.labelEn}</b>{' '}
                        <code dir="ltr" style={{ fontSize: '0.7rem', opacity: 0.75 }}>({perm.id})</code>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={tr(lang, 'سبب منح الصلاحية (يُحفظ في سجل المراجعة الأمني Audit Log)...', 'Reason for role assignment (saved in Audit Log)...')}
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
                style={{ flex: 1, minWidth: '240px', padding: '0.65rem 0.95rem', borderRadius: '999px', border: '1.5px solid var(--line)' }}
              />
              <button
                type="button"
                className="btn"
                disabled={!targetUid.trim() || busy}
                onClick={handleAssignRole}
                style={{ minHeight: '44px', borderRadius: '999px', fontWeight: 800, paddingInline: '22px' }}
              >
                ✓ {tr(lang, 'حفظ وتعيين الدور والعضوية', 'Assign Role & Scope')}
              </button>
            </div>
          </div>

          {/* Search & Tier Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: tr(lang, 'كل الحسابات', 'All Accounts') },
                { id: 'platform', label: tr(lang, 'إدارة المنصة والأقاليم', 'Platform & Regional') },
                { id: 'pharmacy', label: tr(lang, 'شبكة الصيدليات', 'Pharmacy Network') },
                { id: 'clinical', label: tr(lang, 'المحتوى والمراجعة العلمية', 'Content & Clinical') },
                { id: 'patient', label: tr(lang, 'المرضى (Patient)', 'Patients') },
              ].map((tabItem) => (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setTierFilter(tabItem.id as any)}
                  className={tierFilter === tabItem.id ? 'btn small' : 'btn small ghost'}
                  style={{ borderRadius: '999px' }}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>

            <input
              type="search"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={tr(lang, 'بحث بالـ UID أو الإيميل أو الدور أو الصيدلية...', 'Search by UID, email, role, pharmacy...')}
              style={{
                minWidth: '250px',
                padding: '8px 14px',
                borderRadius: '999px',
                border: '1px solid var(--line)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Accounts Table */}
          {loading ? (
            <p>{t('loading')}</p>
          ) : filteredAccounts.length === 0 ? (
            <p className="muted">
              {tr(lang, 'لا توجد حسابات مطابقة للبحث الحالي.', 'No matching user accounts found.')}
            </p>
          ) : (
            <div className="tablewrap">
              <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>{tr(lang, 'المستخدم (UID / Email)', 'User (UID / Email)')}</th>
                    <th>{tr(lang, 'الحالة', 'Status')}</th>
                    <th>{tr(lang, 'الأدوار المفعلة (Multi-Roles)', 'Assigned Roles')}</th>
                    <th>{tr(lang, 'العضويات والنطاق (Pharmacies / Regions)', 'Scoped Memberships')}</th>
                    <th>{tr(lang, 'إجراءات الإدارة', 'Admin Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.uid}>
                      <td>
                        <div dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {acc.uid}
                          {acc.uid === myUid && (
                            <span className="badge approved" style={{ marginInlineStart: 6 }}>
                              {tr(lang, 'أنت', 'You')}
                            </span>
                          )}
                        </div>
                        {(acc.email || acc.displayName) && (
                          <div className="small muted" dir="ltr">
                            {acc.displayName ? `${acc.displayName} — ` : ''}
                            {acc.email}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={acc.accountStatus === 'suspended' ? 'badge rejected' : 'badge approved'}
                        >
                          {acc.accountStatus === 'suspended'
                            ? tr(lang, 'موقوف مؤقتاً', 'SUSPENDED')
                            : tr(lang, 'نشط (Active)', 'ACTIVE')}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {acc.roles.map((r) => {
                            const def = ROLE_DEFINITIONS[r] || ROLE_DEFINITIONS.patient;
                            return (
                              <span
                                key={r}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 9px',
                                  borderRadius: '999px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  background:
                                    r === 'patient'
                                      ? 'rgba(100, 116, 139, 0.12)'
                                      : 'rgba(16, 185, 129, 0.14)',
                                  color: r === 'patient' ? 'var(--text)' : '#047857',
                                  border: '1px solid var(--line)',
                                }}
                              >
                                <span>{def.badge}</span>
                                {r !== 'patient' && !(acc.uid === myUid && (r === 'super_admin' || r === 'central_admin')) && (
                                  <button
                                    type="button"
                                    title={tr(lang, 'سحب هذا الدور من المستخدم', 'Revoke this role')}
                                    disabled={busy}
                                    onClick={() => handleRevokeRole(acc, r)}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: '#dc2626',
                                      cursor: 'pointer',
                                      fontWeight: 900,
                                      padding: '0 2px',
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="small">
                        {acc.pharmacyMemberships.length === 0 && acc.regionalMemberships.length === 0 ? (
                          <span className="muted">{tr(lang, 'نطاق المريض العام', 'Standard Patient Scope')}</span>
                        ) : (
                          <div className="stack" style={{ gap: '4px' }}>
                            {acc.pharmacyMemberships.map((pm) => (
                              <div key={pm.id}>
                                🏥 <b>{pm.pharmacyNameAr || pm.pharmacyId}</b>{' '}
                                <span className="muted">({ROLE_DEFINITIONS[pm.role]?.badge})</span>
                              </div>
                            ))}
                            {acc.regionalMemberships.map((rm) => (
                              <div key={rm.id}>
                                🗺️ <b>{rm.regionNameAr || rm.regionId}</b>{' '}
                                <span className="muted">(REGIONAL)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => {
                              setSelectedAccountUid(acc.uid === selectedAccountUid ? null : acc.uid);
                              setTargetUid(acc.uid);
                              setTargetEmail(acc.email);
                              setTargetName(acc.displayName);
                            }}
                          >
                            {tr(lang, 'تفاصيل / إضافة دور', 'Inspect / Add Role')}
                          </button>

                          {acc.uid !== myUid && (
                            <button
                              type="button"
                              className={acc.accountStatus === 'suspended' ? 'btn small' : 'btn small danger'}
                              disabled={busy}
                              onClick={() => handleToggleAccountStatus(acc)}
                            >
                              {acc.accountStatus === 'suspended'
                                ? tr(lang, 'استعادة الحساب', 'Restore')
                                : tr(lang, 'إيقاف مؤقت', 'Suspend')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed User Account Drawer/Card when Inspected */}
          {inspectedAccount && (
            <div
              className="subcard stack"
              style={{
                border: '2px solid #059669',
                background: 'rgba(16, 185, 129, 0.04)',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>
                  🔍 {tr(lang, `ملف صلاحيات وعضويات الحساب: ${inspectedAccount.uid}`, `Account Details & Memberships: ${inspectedAccount.uid}`)}
                </h3>
                <button type="button" className="btn small ghost" onClick={() => setSelectedAccountUid(null)}>
                  ✕
                </button>
              </div>
              <div className="small">
                <b>{tr(lang, 'الدور الافتراضي الأساسي:', 'Baseline Default Role:')}</b>{' '}
                <span className="badge approved">PATIENT</span>
              </div>
              <div className="small">
                <b>{tr(lang, 'جميع الأدوار المفعلة:', 'All Active Roles:')}</b>{' '}
                {inspectedAccount.roles.map((r) => ROLE_DEFINITIONS[r]?.nameAr || r).join(' ، ')}
              </div>
              {inspectedAccount.pharmacyMemberships.length > 0 && (
                <div className="small">
                  <b>{tr(lang, 'الصلاحيات التفصيلية داخل الصيدلية:', 'Pharmacy Membership Granular Permissions:')}</b>
                  <div dir="ltr" className="muted" style={{ marginTop: 4 }}>
                    {inspectedAccount.pharmacyMemberships[0].permissions.join(' • ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Sub-View 2: Complete Role & Permission Matrix Documentation */}
      {subView === 'matrix' && (
        <div className="tablewrap">
          <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>{tr(lang, 'الدور الوظيفي (Role)', 'Role')}</th>
                <th>{tr(lang, 'الواجهة النشطة (Interface Mode)', 'Interface Mode')}</th>
                <th>{tr(lang, 'الوصف والمسؤوليات', 'Description')}</th>
                <th>{tr(lang, 'الصلاحيات الممنوحة (Permissions)', 'Granted Permissions')}</th>
              </tr>
            </thead>
            <tbody>
              {CANONICAL_ROLES.map((r) => {
                const def = ROLE_DEFINITIONS[r];
                return (
                  <tr key={r}>
                    <td>
                      <b>{isAr ? def.nameAr : def.nameEn}</b>
                      <div className="small muted" dir="ltr">{def.roleId}</div>
                    </td>
                    <td>
                      <span className="badge approved">{def.interfaceMode.toUpperCase()}</span>
                    </td>
                    <td className="small">{isAr ? def.descriptionAr : def.descriptionEn}</td>
                    <td dir="ltr" className="small" style={{ fontFamily: 'monospace' }}>
                      {def.permissions.join(', ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-View 3: Immutable Role & Security Audit Logs */}
      {subView === 'audit' && (
        <div className="stack">
          <p className="small muted" style={{ margin: 0 }}>
            {tr(
              lang,
              'سجل غير قابل للتعديل أو الحذف يوثق كافة عمليات منح وسحب الأدوار وتغييرات حالة الحسابات.',
              'Immutable audit log recording all role assignments, revocations, membership links, and account status changes.'
            )}
          </p>
          {auditLogs.length === 0 ? (
            <p className="muted">{tr(lang, 'لا توجد سجلات مراجعة مسجلة حتى الآن.', 'No role audit logs recorded yet.')}</p>
          ) : (
            <div className="tablewrap">
              <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>{tr(lang, 'التوقيت', 'Timestamp')}</th>
                    <th>{tr(lang, 'الإجراء', 'Action')}</th>
                    <th>{tr(lang, 'المدير المنفذ (Actor)', 'Actor UID')}</th>
                    <th>{tr(lang, 'المستخدم المستهدف (Target)', 'Target UID')}</th>
                    <th>{tr(lang, 'التفاصيل والسبب', 'Details & Reason')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td dir="ltr" className="small">{log.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                      <td>
                        <span className="badge approved">{log.action}</span>
                      </td>
                      <td dir="ltr" className="small" style={{ fontFamily: 'monospace' }}>{log.actorUid}</td>
                      <td dir="ltr" className="small" style={{ fontFamily: 'monospace' }}>{log.targetUid}</td>
                      <td className="small">
                        <div><b>{log.reason}</b></div>
                        <div className="muted" dir="ltr">{log.previousValue} → {log.newValue}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
