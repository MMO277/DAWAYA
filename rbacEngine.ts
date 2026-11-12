import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, configured } from './firebase';

/**
 * Canonical & Backward-Compatible Role Identifiers across DAWAYA
 */
export type CanonicalRole =
  | 'patient'
  | 'pharmacy_owner'
  | 'pharmacy_manager'
  | 'pharmacist'
  | 'pharmacy_employee'
  | 'regional_manager'
  | 'content_editor'
  | 'content_reviewer'
  | 'central_admin'
  | 'super_admin'
  | 'viewer';

export type LegacyRoleAlias =
  | 'owner'
  | 'admin'
  | 'reviewer'
  | 'editor'
  | 'employee'
  | 'customer'
  | 'user';

export type Role = CanonicalRole | LegacyRoleAlias;

export type InterfaceMode = 'patient' | 'pharmacy' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'pending_verification';

export type PermissionId =
  | 'patient.access'
  | 'users.view'
  | 'users.manage'
  | 'roles.assign'
  | 'pharmacies.view'
  | 'pharmacies.approve'
  | 'pharmacies.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'orders.view'
  | 'orders.manage'
  | 'employees.manage'
  | 'medications.view'
  | 'medications.manage'
  | 'medications.approve'
  | 'content.manage'
  | 'content.review'
  | 'reports.view'
  | 'regions.manage'
  | 'audit.view'
  | 'system.settings.manage';

export const ALL_PERMISSIONS: {
  id: PermissionId;
  labelAr: string;
  labelEn: string;
  category: 'patient' | 'pharmacy' | 'clinical' | 'admin';
}[] = [
  { id: 'patient.access', labelAr: 'الوصول لأدوات المريض والملف الشخصي', labelEn: 'Access patient tools & personal health profile', category: 'patient' },
  { id: 'inventory.view', labelAr: 'عرض مخزون الصيدلية والتشغيلات', labelEn: 'View pharmacy inventory & batches', category: 'pharmacy' },
  { id: 'inventory.manage', labelAr: 'إضافة وتعديل أصناف وأسعار وكميات المخزون', labelEn: 'Add & update inventory items, prices & stock', category: 'pharmacy' },
  { id: 'orders.view', labelAr: 'عرض طلبات الأدوية الواردة للصيدلية', labelEn: 'View incoming pharmacy medication orders', category: 'pharmacy' },
  { id: 'orders.manage', labelAr: 'قبول وتجهيز وتحديث حالة طلبات الصيدلية', labelEn: 'Accept, prepare & update pharmacy order statuses', category: 'pharmacy' },
  { id: 'employees.manage', labelAr: 'إدارة صيادلة وموظفي الصيدلية وصلاحياتهم', labelEn: 'Manage pharmacy staff & granular permissions', category: 'pharmacy' },
  { id: 'reports.view', labelAr: 'عرض التقارير المالية والإحصائية والأداء', labelEn: 'View sales, order & performance reports', category: 'pharmacy' },
  { id: 'pharmacies.view', labelAr: 'عرض ملفات الصيدليات والفروع وطلبات الانضمام', labelEn: 'View pharmacy profiles, branches & applications', category: 'admin' },
  { id: 'pharmacies.approve', labelAr: 'مراجعة التراخيص واعتماد أو رفض الصيدليات', labelEn: 'Verify licenses and approve/reject pharmacies', category: 'admin' },
  { id: 'pharmacies.manage', labelAr: 'إدارة إعدادات الصيدليات والفروع والاشتراكات', labelEn: 'Manage pharmacy settings, branches & subscriptions', category: 'admin' },
  { id: 'regions.manage', labelAr: 'إدارة النطاق الجغرافي (المحافظات والمراكز والقرى)', labelEn: 'Manage geographic hierarchy & regional coverage', category: 'admin' },
  { id: 'medications.view', labelAr: 'عرض قاعدة الأدوية والمونوجرافات السريرية', labelEn: 'View medication database & clinical monographs', category: 'clinical' },
  { id: 'medications.manage', labelAr: 'تحرير بيانات الأدوية والأسعار والبدائل', labelEn: 'Edit medication data, pricing & alternatives', category: 'clinical' },
  { id: 'medications.approve', labelAr: 'المراجعة العلمية واعتماد نشر الأدوية', labelEn: 'Review and approve medication records for publication', category: 'clinical' },
  { id: 'content.manage', labelAr: 'إضافة وتحرير المقالات والمحتوى التوعوي', labelEn: 'Create & edit educational articles and content', category: 'clinical' },
  { id: 'content.review', labelAr: 'مراجعة واعتماد المحتوى العلمي والتوعوي', labelEn: 'Review & approve scientific and educational content', category: 'clinical' },
  { id: 'users.view', labelAr: 'عرض حسابات المستخدمين والأدوار والعضويات', labelEn: 'View user accounts, roles & memberships', category: 'admin' },
  { id: 'users.manage', labelAr: 'إدارة حالة الحسابات (تفعيل / إيقاف مؤقت)', labelEn: 'Manage user account status (activate / suspend)', category: 'admin' },
  { id: 'roles.assign', labelAr: 'منح وسحب الأدوار الوظيفية وربط الصيدليات والأقاليم', labelEn: 'Assign & revoke roles, pharmacy & regional scopes', category: 'admin' },
  { id: 'audit.view', labelAr: 'الاطلاع على سجل المراجعة الأمني (Audit Logs)', labelEn: 'View immutable security & role audit logs', category: 'admin' },
  { id: 'system.settings.manage', labelAr: 'إدارة إعدادات النظام المركزية والذكاء الاصطناعي', labelEn: 'Manage central system & AI security settings', category: 'admin' },
];

export interface RoleDefinition {
  roleId: CanonicalRole;
  legacyAliases: Role[];
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badge: string;
  tier: 'platform' | 'clinical' | 'pharmacy' | 'patient';
  interfaceMode: InterfaceMode;
  permissions: PermissionId[];
  isSystemRole: boolean;
}

export const ROLE_DEFINITIONS: Record<CanonicalRole, RoleDefinition> = {
  patient: {
    roleId: 'patient',
    legacyAliases: ['patient', 'customer', 'user'],
    nameAr: 'مريض / مستخدم (Patient)',
    nameEn: 'Patient / Standard User',
    descriptionAr: 'البحث الدوائي، فحص التفاعلات والحساسية، رادار الروشتة، طلب الأدوية، الكارت الطبي الذكي، والمنبهات',
    descriptionEn: 'Medication search, interaction & allergy checks, Rx Radar, ordering, Smart Medical ID & reminders',
    badge: 'PATIENT',
    tier: 'patient',
    interfaceMode: 'patient',
    permissions: ['patient.access', 'medications.view'],
    isSystemRole: true,
  },
  pharmacy_owner: {
    roleId: 'pharmacy_owner',
    legacyAliases: ['pharmacy_owner'],
    nameAr: 'مالك صيدلية معتمد (Pharmacy Owner)',
    nameEn: 'Verified Pharmacy Owner',
    descriptionAr: 'إدارة كاملة للصيدلية والفروع المرتبطة، المخزون، الطلبات، الموظفين وصلاحياتهم، والتقارير المالية',
    descriptionEn: 'Full management of assigned pharmacy & branches, inventory, orders, employees & financial reports',
    badge: 'PHARMACY OWNER',
    tier: 'pharmacy',
    interfaceMode: 'pharmacy',
    permissions: [
      'patient.access',
      'pharmacies.view',
      'pharmacies.manage',
      'inventory.view',
      'inventory.manage',
      'orders.view',
      'orders.manage',
      'employees.manage',
      'reports.view',
      'medications.view',
    ],
    isSystemRole: true,
  },
  pharmacy_manager: {
    roleId: 'pharmacy_manager',
    legacyAliases: ['pharmacy_manager'],
    nameAr: 'مدير فرع صيدلية (Pharmacy Manager)',
    nameEn: 'Pharmacy Branch Manager',
    descriptionAr: 'إدارة مخزون الفرع، تواريخ الصلاحية، معالجة الطلبات، وإدارة فريق الفرع والتقارير',
    descriptionEn: 'Manage branch inventory, expiry dates, order processing, branch staff & reports',
    badge: 'PHARMACY MANAGER',
    tier: 'pharmacy',
    interfaceMode: 'pharmacy',
    permissions: [
      'patient.access',
      'pharmacies.view',
      'inventory.view',
      'inventory.manage',
      'orders.view',
      'orders.manage',
      'employees.manage',
      'reports.view',
      'medications.view',
    ],
    isSystemRole: true,
  },
  pharmacist: {
    roleId: 'pharmacist',
    legacyAliases: ['pharmacist'],
    nameAr: 'صيدلي معتمد (Pharmacist)',
    nameEn: 'Licensed Pharmacist',
    descriptionAr: 'مراجعة الطلبات والروشتات، اقتراح البدائل المتوفرة، وتحديث توفر الأصناف والكميات والتشغيلات',
    descriptionEn: 'Review medication orders & prescriptions, suggest bioequivalent alternatives, update stock & batches',
    badge: 'PHARMACIST',
    tier: 'pharmacy',
    interfaceMode: 'pharmacy',
    permissions: [
      'patient.access',
      'pharmacies.view',
      'inventory.view',
      'inventory.manage',
      'orders.view',
      'orders.manage',
      'medications.view',
    ],
    isSystemRole: true,
  },
  pharmacy_employee: {
    roleId: 'pharmacy_employee',
    legacyAliases: ['pharmacy_employee', 'employee'],
    nameAr: 'موظف صيدلية / تجهيز طلبات (Pharmacy Employee)',
    nameEn: 'Pharmacy Operations Employee',
    descriptionAr: 'تجهيز الطلبات المعتمدة ومتابعة حالة التوصيل وتحديث المخزون المسموح به دون صلاحيات المالك',
    descriptionEn: 'Process confirmed orders, coordinate delivery & perform permitted inventory updates',
    badge: 'PHARMACY EMPLOYEE',
    tier: 'pharmacy',
    interfaceMode: 'pharmacy',
    permissions: [
      'patient.access',
      'inventory.view',
      'orders.view',
      'orders.manage',
      'medications.view',
    ],
    isSystemRole: true,
  },
  regional_manager: {
    roleId: 'regional_manager',
    legacyAliases: ['regional_manager'],
    nameAr: 'مدير إقليمي للمحافظات (Regional Manager)',
    nameEn: 'Regional Governorate Manager',
    descriptionAr: 'إدارة وتوثيق الصيدليات والفروع والتغطية الجغرافية داخل المحافظات المعينة فقط (بدون كشف ملفات المرضى)',
    descriptionEn: 'Manage & verify pharmacies and branches within assigned governorates only (no patient file access)',
    badge: 'REGIONAL MANAGER',
    tier: 'platform',
    interfaceMode: 'admin',
    permissions: [
      'patient.access',
      'pharmacies.view',
      'pharmacies.approve',
      'pharmacies.manage',
      'regions.manage',
      'reports.view',
      'medications.view',
    ],
    isSystemRole: true,
  },
  content_editor: {
    roleId: 'content_editor',
    legacyAliases: ['content_editor', 'editor'],
    nameAr: 'محرر محتوى وكتالوج دوائي (Content Editor)',
    nameEn: 'Medication & Content Editor',
    descriptionAr: 'تحرير بيانات الأدوية والمقالات الطبية والتوعوية وطلبات التصحيح (بدون أي صلاحية لملفات المرضى)',
    descriptionEn: 'Edit medication data, educational articles & correction requests (zero access to private patient files)',
    badge: 'CONTENT EDITOR',
    tier: 'clinical',
    interfaceMode: 'admin',
    permissions: [
      'patient.access',
      'medications.view',
      'medications.manage',
      'content.manage',
    ],
    isSystemRole: true,
  },
  content_reviewer: {
    roleId: 'content_reviewer',
    legacyAliases: ['content_reviewer', 'reviewer'],
    nameAr: 'مراجع علمي وسريري (Content Reviewer)',
    nameEn: 'Clinical & Content Reviewer',
    descriptionAr: 'مراجعة واعتماد الأدوية والمونوجرافات السريرية والمحتوى العلمي (بدون أي صلاحية لملفات المرضى)',
    descriptionEn: 'Review and approve medication records, clinical monographs & educational content (no patient files)',
    badge: 'CONTENT REVIEWER',
    tier: 'clinical',
    interfaceMode: 'admin',
    permissions: [
      'patient.access',
      'medications.view',
      'medications.manage',
      'medications.approve',
      'content.manage',
      'content.review',
    ],
    isSystemRole: true,
  },
  central_admin: {
    roleId: 'central_admin',
    legacyAliases: ['central_admin', 'admin'],
    nameAr: 'مدير الإدارة المركزية (Central Admin)',
    nameEn: 'Central Platform Administrator',
    descriptionAr: 'إدارة المستخدمين والأدوار، اعتماد الصيدليات، إدارة قاعدة الأدوية، التقارير، وسجلات المراجعة',
    descriptionEn: 'Manage users & roles, approve pharmacies, oversee medication DB, reports & audit logs',
    badge: 'CENTRAL ADMIN',
    tier: 'platform',
    interfaceMode: 'admin',
    permissions: [
      'patient.access',
      'users.view',
      'users.manage',
      'roles.assign',
      'pharmacies.view',
      'pharmacies.approve',
      'pharmacies.manage',
      'inventory.view',
      'inventory.manage',
      'orders.view',
      'orders.manage',
      'employees.manage',
      'medications.view',
      'medications.manage',
      'medications.approve',
      'content.manage',
      'content.review',
      'reports.view',
      'regions.manage',
      'audit.view',
    ],
    isSystemRole: true,
  },
  super_admin: {
    roleId: 'super_admin',
    legacyAliases: ['super_admin', 'owner'],
    nameAr: 'المدير التنفيذي الأعلى للمنصة (Super Admin)',
    nameEn: 'Executive Super Administrator',
    descriptionAr: 'تحكم كامل في المنصة، الصلاحيات العليا، الشركاء، الأمان، وإعدادات النظام المركزية',
    descriptionEn: 'Full executive control over platform roles, security settings, partners & audit monitoring',
    badge: 'SUPER ADMIN',
    tier: 'platform',
    interfaceMode: 'admin',
    permissions: [
      'patient.access',
      'users.view',
      'users.manage',
      'roles.assign',
      'pharmacies.view',
      'pharmacies.approve',
      'pharmacies.manage',
      'inventory.view',
      'inventory.manage',
      'orders.view',
      'orders.manage',
      'employees.manage',
      'medications.view',
      'medications.manage',
      'medications.approve',
      'content.manage',
      'content.review',
      'reports.view',
      'regions.manage',
      'audit.view',
      'system.settings.manage',
    ],
    isSystemRole: true,
  },
  viewer: {
    roleId: 'viewer',
    legacyAliases: ['viewer'],
    nameAr: 'مشاهد تقارير فقط (Read-Only Viewer)',
    nameEn: 'Read-Only Analytics Viewer',
    descriptionAr: 'الاطلاع على الإحصائيات العامة ولوحة الإدارة للقراءة فقط بدون تعديل البيانات',
    descriptionEn: 'Read-only access to platform analytics and non-sensitive dashboards',
    badge: 'VIEWER',
    tier: 'clinical',
    interfaceMode: 'admin',
    permissions: ['patient.access', 'pharmacies.view', 'medications.view', 'reports.view'],
    isSystemRole: true,
  },
};

export const CANONICAL_ROLES: CanonicalRole[] = [
  'patient',
  'pharmacy_owner',
  'pharmacy_manager',
  'pharmacist',
  'pharmacy_employee',
  'regional_manager',
  'content_editor',
  'content_reviewer',
  'central_admin',
  'super_admin',
  'viewer',
];

/**
 * Normalizes any legacy or canonical role string to its CanonicalRole.
 * Unknown or invalid values safely fallback to 'patient'.
 */
export function normalizeRoleId(rawRole?: string | null): CanonicalRole {
  if (!rawRole || typeof rawRole !== 'string') return 'patient';
  const clean = rawRole.trim().toLowerCase();
  switch (clean) {
    case 'owner':
    case 'super_admin':
      return 'super_admin';
    case 'admin':
    case 'central_admin':
      return 'central_admin';
    case 'regional_manager':
      return 'regional_manager';
    case 'reviewer':
    case 'content_reviewer':
      return 'content_reviewer';
    case 'editor':
    case 'content_editor':
      return 'content_editor';
    case 'pharmacy_owner':
      return 'pharmacy_owner';
    case 'pharmacy_manager':
      return 'pharmacy_manager';
    case 'pharmacist':
      return 'pharmacist';
    case 'employee':
    case 'pharmacy_employee':
      return 'pharmacy_employee';
    case 'viewer':
      return 'viewer';
    case 'patient':
    case 'customer':
    case 'user':
    default:
      return 'patient';
  }
}

/**
 * Converts a CanonicalRole to the legacy-compatible Role identifier where needed by older components
 */
export function toLegacyCompatibleRole(role: CanonicalRole | Role | null): Role {
  if (!role) return 'customer';
  const canon = normalizeRoleId(role);
  switch (canon) {
    case 'central_admin':
      return 'admin';
    case 'content_reviewer':
      return 'reviewer';
    case 'content_editor':
      return 'editor';
    case 'pharmacy_employee':
      return 'employee';
    case 'patient':
      return 'customer';
    default:
      return canon;
  }
}

export interface UserRoleAssignment {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  role: CanonicalRole;
  status: 'active' | 'suspended' | 'revoked';
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string | null;
  pharmacyId?: string;
  regionId?: string;
  customPermissions?: PermissionId[];
}

export interface PharmacyMembership {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  pharmacyId: string;
  pharmacyNameAr?: string;
  branchIds: string[];
  role: 'pharmacy_owner' | 'pharmacy_manager' | 'pharmacist' | 'pharmacy_employee';
  permissions: PermissionId[];
  status: 'active' | 'suspended' | 'revoked';
  assignedBy: string;
  assignedAt: string;
}

export interface RegionalMembership {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  regionId: string;
  regionNameAr?: string;
  role: 'regional_manager';
  permissions: PermissionId[];
  status: 'active' | 'suspended' | 'revoked';
  assignedBy: string;
  assignedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail?: string;
  targetUid: string;
  action:
    | 'ROLE_ASSIGNED'
    | 'ROLE_REVOKED'
    | 'MEMBERSHIP_UPDATED'
    | 'ACCOUNT_SUSPENDED'
    | 'ACCOUNT_RESTORED'
    | 'PERMISSIONS_CHANGED';
  previousValue: string;
  newValue: string;
  timestamp: string;
  reason: string;
  relevantResourceId?: string;
}

export interface AuthorizationState {
  uid: string | null;
  accountStatus: AccountStatus;
  defaultRole: 'patient';
  /** Highest/primary role for legacy consumers */
  primaryRole: CanonicalRole;
  /** Currently selected role in the UI mode switcher */
  activeRole: CanonicalRole;
  /** Currently active interface mode ('patient' | 'pharmacy' | 'admin') */
  activeMode: InterfaceMode;
  /** All active, verified roles owned by this user (always includes 'patient') */
  authorizedRoles: CanonicalRole[];
  /** Active pharmacy memberships for this user */
  pharmacyMemberships: PharmacyMembership[];
  /** Active regional memberships for this user */
  regionalMemberships: RegionalMembership[];
  /** Currently selected pharmacyId when in Pharmacy Mode */
  activePharmacyId: string | null;
  /** Currently selected regionId when in Regional Manager Mode */
  activeRegionId: string | null;
  /** Effective permissions for the currently active role/membership */
  effectivePermissions: PermissionId[];
}

export const DEFAULT_AUTHZ_STATE: AuthorizationState = {
  uid: null,
  accountStatus: 'active',
  defaultRole: 'patient',
  primaryRole: 'patient',
  activeRole: 'patient',
  activeMode: 'patient',
  authorizedRoles: ['patient'],
  pharmacyMemberships: [],
  regionalMemberships: [],
  activePharmacyId: null,
  activeRegionId: null,
  effectivePermissions: ['patient.access', 'medications.view'],
};

const ROLE_PRIORITY: CanonicalRole[] = [
  'super_admin',
  'central_admin',
  'regional_manager',
  'content_reviewer',
  'content_editor',
  'pharmacy_owner',
  'pharmacy_manager',
  'pharmacist',
  'pharmacy_employee',
  'viewer',
  'patient',
];

export function getHighestPriorityRole(roles: CanonicalRole[]): CanonicalRole {
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return 'patient';
}

export function getInterfaceModeForRole(role: CanonicalRole): InterfaceMode {
  return ROLE_DEFINITIONS[role]?.interfaceMode || 'patient';
}

export function computeEffectivePermissions(
  activeRole: CanonicalRole,
  authorizedRoles: CanonicalRole[],
  pharmacyMemberships: PharmacyMembership[],
  regionalMemberships: RegionalMembership[],
  activePharmacyId?: string | null
): PermissionId[] {
  // Security Rule: If the user does not actually own activeRole, fallback strictly to 'patient'
  const verifiedRole: CanonicalRole = authorizedRoles.includes(activeRole) ? activeRole : 'patient';
  const basePerms = new Set<PermissionId>(ROLE_DEFINITIONS.patient.permissions);

  for (const p of ROLE_DEFINITIONS[verifiedRole]?.permissions || []) {
    basePerms.add(p);
  }

  // If in a pharmacy role, intersect/merge with the specific pharmacy membership permissions
  if (
    verifiedRole === 'pharmacy_owner' ||
    verifiedRole === 'pharmacy_manager' ||
    verifiedRole === 'pharmacist' ||
    verifiedRole === 'pharmacy_employee'
  ) {
    const activeMembership =
      pharmacyMemberships.find(
        (m) => m.status === 'active' && (!activePharmacyId || m.pharmacyId === activePharmacyId)
      ) || pharmacyMemberships.find((m) => m.status === 'active');

    if (activeMembership && Array.isArray(activeMembership.permissions) && activeMembership.permissions.length > 0) {
      // Replace pharmacy-tier permissions with the membership's explicitly granted permissions
      const pharmacySpecificPerms: PermissionId[] = [
        'pharmacies.manage',
        'inventory.view',
        'inventory.manage',
        'orders.view',
        'orders.manage',
        'employees.manage',
        'reports.view',
      ];
      pharmacySpecificPerms.forEach((pp) => basePerms.delete(pp));
      activeMembership.permissions.forEach((mp) => basePerms.add(mp));
    }
  }

  // If in regional_manager role, apply regional membership permissions
  if (verifiedRole === 'regional_manager') {
    const regMem = regionalMemberships.find((m) => m.status === 'active');
    if (regMem && Array.isArray(regMem.permissions) && regMem.permissions.length > 0) {
      regMem.permissions.forEach((rp) => basePerms.add(rp));
    }
  }

  return Array.from(basePerms);
}

/**
 * Core RBAC & Scope Check Utilities (Section 12)
 */
export function hasRole(state: AuthorizationState, targetRole: Role): boolean {
  if (state.accountStatus === 'suspended') return false;
  const canon = normalizeRoleId(targetRole);
  if (canon === 'patient') return true;
  if (state.authorizedRoles.includes('super_admin')) return true;
  if (state.authorizedRoles.includes('central_admin') && canon !== 'super_admin') return true;
  return state.authorizedRoles.includes(canon);
}

export function hasPermission(
  state: AuthorizationState,
  permission: PermissionId,
  options?: { pharmacyId?: string; regionId?: string }
): boolean {
  if (state.accountStatus === 'suspended') return false;
  if (state.authorizedRoles.includes('super_admin') || state.authorizedRoles.includes('central_admin')) {
    return true;
  }
  if (!state.effectivePermissions.includes(permission)) {
    return false;
  }
  if (options?.pharmacyId) {
    return canAccessPharmacy(state, options.pharmacyId);
  }
  if (options?.regionId) {
    return canAccessRegion(state, options.regionId);
  }
  return true;
}

export function canAccessPharmacy(state: AuthorizationState, pharmacyId: string): boolean {
  if (!pharmacyId || state.accountStatus === 'suspended') return false;
  if (state.authorizedRoles.includes('super_admin') || state.authorizedRoles.includes('central_admin')) {
    return true;
  }
  return state.pharmacyMemberships.some(
    (m) => m.status === 'active' && m.pharmacyId === pharmacyId
  );
}

export function canAccessBranch(
  state: AuthorizationState,
  pharmacyId: string,
  branchId: string
): boolean {
  if (!canAccessPharmacy(state, pharmacyId)) return false;
  if (state.authorizedRoles.includes('super_admin') || state.authorizedRoles.includes('central_admin')) {
    return true;
  }
  const mem = state.pharmacyMemberships.find(
    (m) => m.status === 'active' && m.pharmacyId === pharmacyId
  );
  if (!mem) return false;
  if (mem.role === 'pharmacy_owner' || !mem.branchIds || mem.branchIds.length === 0 || mem.branchIds.includes('*')) {
    return true;
  }
  return mem.branchIds.includes(branchId);
}

export function canAccessRegion(state: AuthorizationState, regionId: string): boolean {
  if (!regionId || state.accountStatus === 'suspended') return false;
  if (state.authorizedRoles.includes('super_admin') || state.authorizedRoles.includes('central_admin')) {
    return true;
  }
  return state.regionalMemberships.some(
    (m) => m.status === 'active' && (m.regionId === regionId || m.regionId === 'all')
  );
}

export function getActiveMembership(
  state: AuthorizationState,
  pharmacyId?: string
): PharmacyMembership | null {
  const targetId = pharmacyId || state.activePharmacyId;
  if (targetId) {
    const exact = state.pharmacyMemberships.find(
      (m) => m.status === 'active' && m.pharmacyId === targetId
    );
    if (exact) return exact;
  }
  return state.pharmacyMemberships.find((m) => m.status === 'active') || null;
}

export function getAuthorizedRoles(state: AuthorizationState): CanonicalRole[] {
  return state.authorizedRoles.length > 0 ? state.authorizedRoles : ['patient'];
}

export function getAvailableInterfaceModes(state: AuthorizationState): {
  mode: InterfaceMode;
  role: CanonicalRole;
  labelAr: string;
  labelEn: string;
  badge: string;
  targetRoute: string;
}[] {
  const modes: {
    mode: InterfaceMode;
    role: CanonicalRole;
    labelAr: string;
    labelEn: string;
    badge: string;
    targetRoute: string;
  }[] = [
    {
      mode: 'patient',
      role: 'patient',
      labelAr: 'وضع المريض (Patient Mode)',
      labelEn: 'Patient Mode',
      badge: 'PATIENT',
      targetRoute: '/',
    },
  ];

  const pharmacyRoles: CanonicalRole[] = [
    'pharmacy_owner',
    'pharmacy_manager',
    'pharmacist',
    'pharmacy_employee',
  ];
  const highestPharmRole = pharmacyRoles.find((r) => state.authorizedRoles.includes(r));
  if (
    highestPharmRole ||
    state.authorizedRoles.includes('super_admin') ||
    state.authorizedRoles.includes('central_admin')
  ) {
    const effRole = highestPharmRole || 'pharmacy_owner';
    modes.push({
      mode: 'pharmacy',
      role: effRole,
      labelAr:
        effRole === 'pharmacy_owner'
          ? 'وضع الصيدلية — مالك (Pharmacy Owner)'
          : effRole === 'pharmacist'
          ? 'وضع الصيدلية — صيدلي (Pharmacist)'
          : effRole === 'pharmacy_manager'
          ? 'وضع الصيدلية — مدير فرع (Manager)'
          : 'وضع الصيدلية — موظف (Staff)',
      labelEn: `Pharmacy Mode (${ROLE_DEFINITIONS[effRole].badge})`,
      badge: ROLE_DEFINITIONS[effRole].badge,
      targetRoute: '/pharmacy-portal',
    });
  }

  const adminRoles: CanonicalRole[] = [
    'super_admin',
    'central_admin',
    'regional_manager',
    'content_reviewer',
    'content_editor',
    'viewer',
  ];
  const highestAdminRole = adminRoles.find((r) => state.authorizedRoles.includes(r));
  if (highestAdminRole) {
    modes.push({
      mode: 'admin',
      role: highestAdminRole,
      labelAr:
        highestAdminRole === 'super_admin' || highestAdminRole === 'central_admin'
          ? 'وضع الإدارة المركزية (Central Admin)'
          : highestAdminRole === 'regional_manager'
          ? 'وضع الإدارة الإقليمية (Regional Mode)'
          : 'وضع إدارة ومراجعة المحتوى (Content Mode)',
      labelEn: `Admin Mode (${ROLE_DEFINITIONS[highestAdminRole].badge})`,
      badge: ROLE_DEFINITIONS[highestAdminRole].badge,
      targetRoute: '/admin',
    });
  }

  return modes;
}

/**
 * Ensures every newly registered or signed-in user has a safe baseline Customer/Patient profile
 * with defaultRole = 'patient' and NEVER escalates privileges.
 */
export async function ensureDefaultPatientProfile(firebaseUser: User): Promise<void> {
  if (!configured || !db || !firebaseUser?.uid) return;
  try {
    const profileRef = doc(db, 'customerProfiles', firebaseUser.uid);
    const snap = await getDoc(profileRef);
    const nowIso = new Date().toISOString();
    if (!snap.exists()) {
      await setDoc(
        profileRef,
        {
          uid: firebaseUser.uid,
          email: (firebaseUser.email || '').trim().toLowerCase(),
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          accountStatus: 'active',
          defaultRole: 'patient',
          activeRole: 'patient',
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } else {
      await setDoc(
        profileRef,
        {
          email: (firebaseUser.email || snap.data().email || '').trim().toLowerCase(),
          displayName: firebaseUser.displayName || snap.data().displayName || '',
          photoURL: firebaseUser.photoURL || snap.data().photoURL || '',
          defaultRole: 'patient',
          updatedAt: nowIso,
        },
        { merge: true }
      );
    }
  } catch {
    // Safe fallback: even if profile write fails (e.g., offline), client state stays strictly 'patient'
  }
}

/**
 * Fetches and reconciles the user's complete multi-role authorization state from Firestore.
 */
export async function fetchUserAuthorizationState(
  uid: string,
  email?: string | null,
  tokenClaimRole?: string | null,
  preferredActiveRole?: CanonicalRole | null
): Promise<AuthorizationState> {
  const rolesSet = new Set<CanonicalRole>(['patient']);
  const pharmacyMemberships: PharmacyMembership[] = [];
  const regionalMemberships: RegionalMembership[] = [];
  let accountStatus: AccountStatus = 'active';
  let savedActiveRole: CanonicalRole | null = preferredActiveRole || null;

  if (tokenClaimRole) {
    rolesSet.add(normalizeRoleId(tokenClaimRole));
  }

  if (!configured || !db || !uid) {
    const authorizedRoles = Array.from(rolesSet);
    const primaryRole = getHighestPriorityRole(authorizedRoles);
    const activeRole = savedActiveRole && authorizedRoles.includes(savedActiveRole) ? savedActiveRole : primaryRole;
    return {
      uid: uid || null,
      accountStatus,
      defaultRole: 'patient',
      primaryRole,
      activeRole,
      activeMode: getInterfaceModeForRole(activeRole),
      authorizedRoles,
      pharmacyMemberships,
      regionalMemberships,
      activePharmacyId: null,
      activeRegionId: null,
      effectivePermissions: computeEffectivePermissions(activeRole, authorizedRoles, [], []),
    };
  }

  // 1. Check customerProfiles/{uid} for accountStatus & saved UI activeRole preference
  try {
    const profSnap = await getDoc(doc(db, 'customerProfiles', uid));
    if (profSnap.exists()) {
      const pData = profSnap.data();
      if (pData.accountStatus === 'suspended') {
        accountStatus = 'suspended';
      }
      if (!savedActiveRole && typeof pData.activeRole === 'string') {
        savedActiveRole = normalizeRoleId(pData.activeRole);
      }
    }
  } catch {
    /* ignore */
  }

  // 2. Check primary roles/{uid} document (supports both single role + multi-role `roles` array)
  try {
    const roleSnap = await getDoc(doc(db, 'roles', uid));
    if (roleSnap.exists()) {
      const rData = roleSnap.data();
      if (rData.status !== 'revoked' && rData.status !== 'suspended') {
        if (typeof rData.role === 'string') {
          rolesSet.add(normalizeRoleId(rData.role));
        }
        if (Array.isArray(rData.roles)) {
          rData.roles.forEach((r: string) => rolesSet.add(normalizeRoleId(r)));
        }
        if (typeof rData.pharmacyId === 'string' && rData.pharmacyId.trim()) {
          const pRole = normalizeRoleId(rData.role);
          const memberRole =
            pRole === 'pharmacy_owner' ||
            pRole === 'pharmacy_manager' ||
            pRole === 'pharmacist' ||
            pRole === 'pharmacy_employee'
              ? pRole
              : 'pharmacy_owner';
          pharmacyMemberships.push({
            id: `${uid}_${rData.pharmacyId}`,
            uid,
            email: email || '',
            pharmacyId: rData.pharmacyId.trim(),
            pharmacyNameAr: rData.pharmacyNameAr || '',
            branchIds: Array.isArray(rData.branchIds) ? rData.branchIds : ['*'],
            role: memberRole,
            permissions: Array.isArray(rData.permissions)
              ? rData.permissions
              : ROLE_DEFINITIONS[memberRole].permissions,
            status: 'active',
            assignedBy: rData.updatedBy || 'system',
            assignedAt: rData.updatedAt || new Date().toISOString(),
          });
        }
        if (typeof rData.regionId === 'string' && rData.regionId.trim()) {
          regionalMemberships.push({
            id: `${uid}_${rData.regionId}`,
            uid,
            email: email || '',
            regionId: rData.regionId.trim(),
            regionNameAr: rData.regionNameAr || '',
            role: 'regional_manager',
            permissions: ROLE_DEFINITIONS.regional_manager.permissions,
            status: 'active',
            assignedBy: rData.updatedBy || 'system',
            assignedAt: rData.updatedAt || new Date().toISOString(),
          });
        }
      }
      if (rData.accountStatus === 'suspended') {
        accountStatus = 'suspended';
      }
    }
  } catch {
    /* ignore */
  }

  // 3. Query `userRoles` collection for additional roles assigned to this uid
  try {
    const qRoles = query(collection(db, 'userRoles'), where('uid', '==', uid));
    const uRolesSnap = await getDocs(qRoles);
    uRolesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'active') {
        // Check expiration if present
        if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
          return;
        }
        rolesSet.add(normalizeRoleId(data.role));
      }
    });
  } catch {
    /* ignore */
  }

  // 4. Query `pharmacyMemberships` collection for scoped pharmacy memberships
  try {
    const qPharm = query(collection(db, 'pharmacyMemberships'), where('uid', '==', uid));
    const pMemSnap = await getDocs(qPharm);
    pMemSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'active' && typeof data.pharmacyId === 'string') {
        const mRole = normalizeRoleId(data.role);
        const validPharmRole =
          mRole === 'pharmacy_owner' ||
          mRole === 'pharmacy_manager' ||
          mRole === 'pharmacist' ||
          mRole === 'pharmacy_employee'
            ? mRole
            : 'pharmacist';
        rolesSet.add(validPharmRole);
        if (!pharmacyMemberships.some((m) => m.pharmacyId === data.pharmacyId)) {
          pharmacyMemberships.push({
            id: docSnap.id,
            uid,
            email: data.email || email || '',
            displayName: data.displayName || '',
            pharmacyId: data.pharmacyId,
            pharmacyNameAr: data.pharmacyNameAr || '',
            branchIds: Array.isArray(data.branchIds) ? data.branchIds : ['*'],
            role: validPharmRole,
            permissions:
              Array.isArray(data.permissions) && data.permissions.length > 0
                ? data.permissions
                : ROLE_DEFINITIONS[validPharmRole].permissions,
            status: 'active',
            assignedBy: data.assignedBy || 'system',
            assignedAt: data.assignedAt || new Date().toISOString(),
          });
        }
      }
    });
  } catch {
    /* ignore */
  }

  // 5. Query `regionalMemberships` collection for regional manager scopes
  try {
    const qReg = query(collection(db, 'regionalMemberships'), where('uid', '==', uid));
    const rMemSnap = await getDocs(qReg);
    rMemSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'active' && typeof data.regionId === 'string') {
        rolesSet.add('regional_manager');
        if (!regionalMemberships.some((m) => m.regionId === data.regionId)) {
          regionalMemberships.push({
            id: docSnap.id,
            uid,
            email: data.email || email || '',
            displayName: data.displayName || '',
            regionId: data.regionId,
            regionNameAr: data.regionNameAr || '',
            role: 'regional_manager',
            permissions:
              Array.isArray(data.permissions) && data.permissions.length > 0
                ? data.permissions
                : ROLE_DEFINITIONS.regional_manager.permissions,
            status: 'active',
            assignedBy: data.assignedBy || 'system',
            assignedAt: data.assignedAt || new Date().toISOString(),
          });
        }
      }
    });
  } catch {
    /* ignore */
  }

  // If account is suspended, restrict roles to 'patient' with suspended status
  if (accountStatus === 'suspended') {
    return {
      uid,
      accountStatus: 'suspended',
      defaultRole: 'patient',
      primaryRole: 'patient',
      activeRole: 'patient',
      activeMode: 'patient',
      authorizedRoles: ['patient'],
      pharmacyMemberships: [],
      regionalMemberships: [],
      activePharmacyId: null,
      activeRegionId: null,
      effectivePermissions: [],
    };
  }

  const authorizedRoles = Array.from(rolesSet);
  const primaryRole = getHighestPriorityRole(authorizedRoles);

  // Validate savedActiveRole against authorizedRoles (Section 5 & 13: revoked roles immediately fallback)
  const activeRole: CanonicalRole =
    savedActiveRole && authorizedRoles.includes(savedActiveRole)
      ? savedActiveRole
      : primaryRole;

  const activePharmacyId = pharmacyMemberships[0]?.pharmacyId || null;
  const activeRegionId = regionalMemberships[0]?.regionId || null;

  return {
    uid,
    accountStatus,
    defaultRole: 'patient',
    primaryRole,
    activeRole,
    activeMode: getInterfaceModeForRole(activeRole),
    authorizedRoles,
    pharmacyMemberships,
    regionalMemberships,
    activePharmacyId,
    activeRegionId,
    effectivePermissions: computeEffectivePermissions(
      activeRole,
      authorizedRoles,
      pharmacyMemberships,
      regionalMemberships,
      activePharmacyId
    ),
  };
}

/**
 * Admin Action: Assign a Role (with optional Pharmacy or Regional Scope & Granular Permissions)
 * Atomically updates `roles/{targetUid}`, `userRoles/{targetUid}_{role}`, membership docs, and `auditLogs`.
 */
export async function assignUserRoleWithScope(params: {
  actorUid: string;
  actorEmail?: string;
  actorRole: CanonicalRole;
  targetUid: string;
  targetEmail?: string;
  targetDisplayName?: string;
  roleToAssign: CanonicalRole;
  pharmacyId?: string;
  pharmacyNameAr?: string;
  branchIds?: string[];
  regionId?: string;
  regionNameAr?: string;
  customPermissions?: PermissionId[];
  reason?: string;
}): Promise<void> {
  if (!configured || !db) throw new Error('Firebase is not configured');
  const cleanTargetUid = params.targetUid.trim();
  if (!cleanTargetUid) throw new Error('Target UID is required');

  // Privilege Escalation Guard (Section 7): Only super_admin can assign super_admin or central_admin
  if (
    (params.roleToAssign === 'super_admin' || params.roleToAssign === 'central_admin') &&
    params.actorRole !== 'super_admin'
  ) {
    throw new Error('فقط المدير التنفيذي الأعلى (Super Admin) يمكنه منح صلاحيات الإدارة المركزية العليا.');
  }

  // Scope Validation Guard (Section 7): Pharmacy roles require a pharmacyId
  const isPharmacyRole = [
    'pharmacy_owner',
    'pharmacy_manager',
    'pharmacist',
    'pharmacy_employee',
  ].includes(params.roleToAssign);
  if (isPharmacyRole && !params.pharmacyId?.trim()) {
    throw new Error('يجب تحديد الصيدلية المرتبطة بهذا الدور قبل الحفظ.');
  }

  // Regional Manager requires a regionId
  if (params.roleToAssign === 'regional_manager' && !params.regionId?.trim()) {
    throw new Error('يجب تحديد النطاق الجغرافي (المحافظة) للمدير الإقليمي.');
  }

  const nowIso = new Date().toISOString();
  const roleRef = doc(db, 'roles', cleanTargetUid);
  const existingSnap = await getDoc(roleRef);
  const existingData = existingSnap.exists() ? existingSnap.data() : {};
  const existingRolesList: string[] = Array.isArray(existingData.roles)
    ? existingData.roles.map((r: string) => normalizeRoleId(r))
    : existingData.role
    ? [normalizeRoleId(existingData.role)]
    : ['patient'];

  const updatedRolesSet = new Set<CanonicalRole>(['patient', ...existingRolesList as CanonicalRole[], params.roleToAssign]);
  const updatedRolesArray = Array.from(updatedRolesSet);
  const highestRole = getHighestPriorityRole(updatedRolesArray);
  const legacyRoleStr = toLegacyCompatibleRole(highestRole);

  const permissionsToSave =
    params.customPermissions && params.customPermissions.length > 0
      ? params.customPermissions
      : ROLE_DEFINITIONS[params.roleToAssign].permissions;

  const batch = writeBatch(db);

  // 1. Update primary `roles/{uid}` document (maintains 100% compatibility with existing Firestore rules)
  batch.set(
    roleRef,
    {
      uid: cleanTargetUid,
      email: params.targetEmail || existingData.email || '',
      displayName: params.targetDisplayName || existingData.displayName || '',
      role: legacyRoleStr,
      canonicalRole: highestRole,
      roles: updatedRolesArray,
      status: 'active',
      accountStatus: existingData.accountStatus || 'active',
      pharmacyId: params.pharmacyId?.trim() || existingData.pharmacyId || null,
      pharmacyNameAr: params.pharmacyNameAr || existingData.pharmacyNameAr || null,
      regionId: params.regionId?.trim() || existingData.regionId || null,
      regionNameAr: params.regionNameAr || existingData.regionNameAr || null,
      permissions: permissionsToSave,
      updatedAt: nowIso,
      updatedBy: params.actorUid,
    },
    { merge: true }
  );

  // 2. Write `userRoles/{uid}_{role}`
  const userRoleDocId = `${cleanTargetUid}_${params.roleToAssign}`;
  batch.set(doc(db, 'userRoles', userRoleDocId), {
    id: userRoleDocId,
    uid: cleanTargetUid,
    email: params.targetEmail || existingData.email || '',
    displayName: params.targetDisplayName || existingData.displayName || '',
    role: params.roleToAssign,
    status: 'active',
    pharmacyId: params.pharmacyId?.trim() || null,
    regionId: params.regionId?.trim() || null,
    permissions: permissionsToSave,
    assignedBy: params.actorUid,
    assignedAt: nowIso,
  });

  // 3. If Pharmacy Role, write `pharmacyMemberships/{uid}_{pharmacyId}`
  if (isPharmacyRole && params.pharmacyId?.trim()) {
    const pharmId = params.pharmacyId.trim();
    const memId = `${cleanTargetUid}_${pharmId}`;
    batch.set(doc(db, 'pharmacyMemberships', memId), {
      id: memId,
      uid: cleanTargetUid,
      email: params.targetEmail || existingData.email || '',
      displayName: params.targetDisplayName || existingData.displayName || '',
      pharmacyId: pharmId,
      pharmacyNameAr: params.pharmacyNameAr || '',
      branchIds: params.branchIds && params.branchIds.length > 0 ? params.branchIds : ['*'],
      role: params.roleToAssign,
      permissions: permissionsToSave,
      status: 'active',
      assignedBy: params.actorUid,
      assignedAt: nowIso,
    });
  }

  // 4. If Regional Manager, write `regionalMemberships/{uid}_{regionId}`
  if (params.roleToAssign === 'regional_manager' && params.regionId?.trim()) {
    const regId = params.regionId.trim();
    const regMemId = `${cleanTargetUid}_${regId}`;
    batch.set(doc(db, 'regionalMemberships', regMemId), {
      id: regMemId,
      uid: cleanTargetUid,
      email: params.targetEmail || existingData.email || '',
      displayName: params.targetDisplayName || existingData.displayName || '',
      regionId: regId,
      regionNameAr: params.regionNameAr || '',
      role: 'regional_manager',
      permissions: permissionsToSave,
      status: 'active',
      assignedBy: params.actorUid,
      assignedAt: nowIso,
    });
  }

  // 5. Write immutable Audit Log (`auditLogs`)
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  batch.set(doc(db, 'auditLogs', auditId), {
    id: auditId,
    actorUid: params.actorUid,
    actorEmail: params.actorEmail || '',
    targetUid: cleanTargetUid,
    action: 'ROLE_ASSIGNED',
    previousValue: JSON.stringify(existingRolesList),
    newValue: JSON.stringify({
      role: params.roleToAssign,
      pharmacyId: params.pharmacyId || null,
      regionId: params.regionId || null,
      permissionsCount: permissionsToSave.length,
    }),
    timestamp: nowIso,
    reason: params.reason || 'Role assigned via Central Admin User & Role Management',
    relevantResourceId: params.pharmacyId || params.regionId || cleanTargetUid,
  });

  await batch.commit();
}

/**
 * Admin Action: Revoke a specific Role from a user (or all privileged roles).
 * Preserves the user's Patient account and historical records while immediately revoking access.
 */
export async function revokeUserRoleWithAudit(params: {
  actorUid: string;
  actorEmail?: string;
  targetUid: string;
  roleToRevoke: CanonicalRole;
  pharmacyId?: string;
  regionId?: string;
  reason?: string;
}): Promise<void> {
  if (!configured || !db) throw new Error('Firebase is not configured');
  const cleanTargetUid = params.targetUid.trim();
  if (cleanTargetUid === params.actorUid && (params.roleToRevoke === 'super_admin' || params.roleToRevoke === 'central_admin')) {
    throw new Error('لا يمكنك سحب صلاحية الإدارة المركزية من حسابك الشخصي الحالي.');
  }
  if (params.roleToRevoke === 'patient') {
    throw new Error('دور المريض (Patient) هو الدور الافتراضي الأساسي ولا يمكن حذفه؛ يمكنك إيقاف الحساب مؤقتاً عند الضرورة.');
  }

  const nowIso = new Date().toISOString();
  const roleRef = doc(db, 'roles', cleanTargetUid);
  const existingSnap = await getDoc(roleRef);
  const existingData = existingSnap.exists() ? existingSnap.data() : {};
  const existingRolesList: CanonicalRole[] = Array.isArray(existingData.roles)
    ? existingData.roles.map((r: string) => normalizeRoleId(r))
    : existingData.role
    ? [normalizeRoleId(existingData.role)]
    : ['patient'];

  const remainingRoles = existingRolesList.filter((r) => r !== params.roleToRevoke);
  if (!remainingRoles.includes('patient')) {
    remainingRoles.push('patient');
  }
  const newHighestRole = getHighestPriorityRole(remainingRoles);
  const newLegacyRole = toLegacyCompatibleRole(newHighestRole);

  const batch = writeBatch(db);

  // 1. Update `roles/{uid}` so remaining highest role (or 'customer'/'patient') takes effect immediately
  batch.set(
    roleRef,
    {
      role: newLegacyRole,
      canonicalRole: newHighestRole,
      roles: remainingRoles,
      updatedAt: nowIso,
      updatedBy: params.actorUid,
    },
    { merge: true }
  );

  // 2. Mark `userRoles/{uid}_{role}` as revoked
  const userRoleDocId = `${cleanTargetUid}_${params.roleToRevoke}`;
  batch.set(
    doc(db, 'userRoles', userRoleDocId),
    {
      uid: cleanTargetUid,
      role: params.roleToRevoke,
      status: 'revoked',
      revokedBy: params.actorUid,
      revokedAt: nowIso,
    },
    { merge: true }
  );

  // 3. If revoking a pharmacy role and pharmacyId is provided, revoke membership
  if (params.pharmacyId) {
    const memId = `${cleanTargetUid}_${params.pharmacyId}`;
    batch.set(
      doc(db, 'pharmacyMemberships', memId),
      {
        status: 'revoked',
        revokedBy: params.actorUid,
        revokedAt: nowIso,
      },
      { merge: true }
    );
  }

  // 4. If revoking regional_manager and regionId is provided, revoke regional membership
  if (params.regionId) {
    const regMemId = `${cleanTargetUid}_${params.regionId}`;
    batch.set(
      doc(db, 'regionalMemberships', regMemId),
      {
        status: 'revoked',
        revokedBy: params.actorUid,
        revokedAt: nowIso,
      },
      { merge: true }
    );
  }

  // 5. Record immutable Audit Log
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  batch.set(doc(db, 'auditLogs', auditId), {
    id: auditId,
    actorUid: params.actorUid,
    actorEmail: params.actorEmail || '',
    targetUid: cleanTargetUid,
    action: 'ROLE_REVOKED',
    previousValue: JSON.stringify(existingRolesList),
    newValue: JSON.stringify(remainingRoles),
    timestamp: nowIso,
    reason: params.reason || `Revoked role ${params.roleToRevoke}`,
    relevantResourceId: params.pharmacyId || params.regionId || cleanTargetUid,
  });

  await batch.commit();
}

/**
 * Admin Action: Suspend or Restore a User Account across all interfaces
 */
export async function setUserAccountStatusWithAudit(params: {
  actorUid: string;
  actorEmail?: string;
  targetUid: string;
  newStatus: AccountStatus;
  reason?: string;
}): Promise<void> {
  if (!configured || !db) throw new Error('Firebase is not configured');
  const cleanTargetUid = params.targetUid.trim();
  if (cleanTargetUid === params.actorUid && params.newStatus === 'suspended') {
    throw new Error('لا يمكنك إيقاف حسابك الشخصي الحالي.');
  }

  const nowIso = new Date().toISOString();
  const batch = writeBatch(db);

  batch.set(
    doc(db, 'roles', cleanTargetUid),
    {
      accountStatus: params.newStatus,
      updatedAt: nowIso,
      updatedBy: params.actorUid,
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'customerProfiles', cleanTargetUid),
    {
      accountStatus: params.newStatus,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  batch.set(doc(db, 'auditLogs', auditId), {
    id: auditId,
    actorUid: params.actorUid,
    actorEmail: params.actorEmail || '',
    targetUid: cleanTargetUid,
    action: params.newStatus === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_RESTORED',
    previousValue: params.newStatus === 'suspended' ? 'active' : 'suspended',
    newValue: params.newStatus,
    timestamp: nowIso,
    reason: params.reason || `Account status changed to ${params.newStatus}`,
    relevantResourceId: cleanTargetUid,
  });

  await batch.commit();
}
