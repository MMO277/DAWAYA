import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import {
  Role,
  ROLES,
  getSavedDeviceGoogleAccounts,
  resolveGoogleAvatarUrl,
  formatDisplayNameFromEmail,
  useAuth,
} from './authContext';
import { useLang } from './i18n';
import { tr } from './types';
import SmartChoiceSelect, { SmartChoiceOption } from './SmartChoiceSelect';
import { UnslopIcon } from './UnslopIcons';

interface UserRoleRow {
  uid: string;
  role: Role;
  email: string;
  displayName: string;
  photoURL: string;
  lastLoginAt: string;
  hasExplicitRoleDoc: boolean;
}

interface RoleMetaInfo {
  ar: string;
  en: string;
  de: string;
  fr: string;
  es: string;
  descAr: string;
  descEn: string;
  badge: string;
  tier: 'platform' | 'clinical' | 'pharmacy' | 'public';
}

const ROLE_LABELS: Record<Role, RoleMetaInfo> = {
  super_admin: {
    ar: 'المدير التنفيذي الأعلى للشبكة (Super Admin)',
    en: 'Super Administrator (Network & Franchise Executive)',
    de: 'Super-Administrator (Netzwerk & Franchise)',
    fr: 'Super Administrateur (Réseau & Franchise)',
    es: 'Super Administrador (Red y Franquicias)',
    descAr: 'تحكم شامل في الشبكة الوطنية، اعتماد تراخيص الصيدليات، عقود الفرنشايز، الجغرافيا الديناميكية، والأمان',
    descEn: 'Full control over national pharmacy network, licenses, franchise contracts, dynamic geography & security',
    badge: 'SUPER ADMIN',
    tier: 'platform',
  },
  owner: {
    ar: 'مالك المنصة (Platform Owner)',
    en: 'Platform Owner (Full Control)',
    de: 'Plattform-Eigentümer (Vollständige Kontrolle)',
    fr: 'Propriétaire de la plateforme (Contrôle total)',
    es: 'Propietario de la plataforma (Control total)',
    descAr: 'تحكم كامل في الشركاء والظهور والصلاحيات والربط البرمجي وإعدادات النظام',
    descEn: 'Full control over partners, visibility, roles, API integrations, and system settings',
    badge: 'OWNER',
    tier: 'platform',
  },
  admin: {
    ar: 'مدير النظام (System Administrator)',
    en: 'Full Administrator (Operations & Partners)',
    de: 'Vollständiger Administrator',
    fr: 'Administrateur complet',
    es: 'Administrador completo',
    descAr: 'إدارة الشركاء والعمليات الإدارية الكاملة ومراجعة الصيدليات والكتالوج',
    descEn: 'Manage partners, administrative operations, pharmacy verification, and catalog',
    badge: 'ADMIN',
    tier: 'platform',
  },
  regional_manager: {
    ar: 'مدير إقليمي للمحافظات (Regional Manager)',
    en: 'Regional Governorate Manager',
    de: 'Regionalleiter',
    fr: 'Directeur Régional',
    es: 'Gerente Regional',
    descAr: 'مراجعة وتوثيق صيدليات المحافظات والمراكز ومتابعة التغطية الجغرافية والمخزون الإقليمي',
    descEn: 'Verify governorate pharmacies, monitor regional stock coverage, and manage local districts',
    badge: 'REGIONAL MANAGER',
    tier: 'platform',
  },
  reviewer: {
    ar: 'مراجع علمي وسريري (Clinical Reviewer)',
    en: 'Clinical & Scientific Reviewer',
    de: 'Klinischer Prüfer',
    fr: 'Réviseur clinique',
    es: 'Revisor clínico',
    descAr: 'اعتماد الأدوية والمونوجرافات السريرية ومراجعة التوثيق العلمي للشركاء',
    descEn: 'Approve clinical monographs, drug safety alerts, and scientific partner validation',
    badge: 'REVIEWER',
    tier: 'clinical',
  },
  editor: {
    ar: 'محرر محتوى وكتالوج (Content Editor)',
    en: 'Catalog & Content Editor',
    de: 'Katalog- & Inhalts-Editor',
    fr: 'Éditeur de contenu',
    es: 'Editor de contenido',
    descAr: 'إضافة وتعديل مسودات الشركاء والكتالوج والمقالات بدون تغيير إعدادات الأمان',
    descEn: 'Prepare partner drafts, update medicine catalog, and edit articles without security changes',
    badge: 'EDITOR',
    tier: 'clinical',
  },
  pharmacy_owner: {
    ar: 'مالك صيدلية معتمد (Pharmacy Owner)',
    en: 'Verified Pharmacy Owner',
    de: 'Apothekeninhaber',
    fr: 'Propriétaire de Pharmacie',
    es: 'Propietario de Farmacia',
    descAr: 'إدارة كاملة لبوابة الصيدلية، المخزون، التشغيلات، الطلبات، الموظفين، والتقارير المالية',
    descEn: 'Full access to Pharmacy Portal, inventory batches, 8-stage orders, staff, and sales reports',
    badge: 'PHARMACY OWNER',
    tier: 'pharmacy',
  },
  pharmacy_manager: {
    ar: 'مدير فرع صيدلية (Pharmacy Manager)',
    en: 'Pharmacy Branch Manager',
    de: 'Apothekenfilialleiter',
    fr: 'Directeur de Succursale',
    es: 'Gerente de Sucursal de Farmacia',
    descAr: 'إدارة مخزون الفرع، تواريخ الصلاحية، تأكيد الطلبات، وإدارة فريق الصيدلية',
    descEn: 'Manage branch stock, expiry dates, order confirmation, and branch staff',
    badge: 'PHARMACY MANAGER',
    tier: 'pharmacy',
  },
  pharmacist: {
    ar: 'صيدلي معتمد (Licensed Pharmacist)',
    en: 'Licensed Clinical Pharmacist',
    de: 'Approbierter Apotheker',
    fr: 'Pharmacien Agréé',
    es: 'Farmacéutico Colegiado',
    descAr: 'مراجعة وتأكيد طلبات الأدوية وصرف البدائل وتحديث حالة توفر الأصناف والتشغيلات',
    descEn: 'Verify and confirm customer medication orders, update stock availability and batch numbers',
    badge: 'PHARMACIST',
    tier: 'pharmacy',
  },
  employee: {
    ar: 'موظف صيدلية / تجهيز طلبات (Pharmacy Staff)',
    en: 'Pharmacy Operations & Delivery Staff',
    de: 'Apothekenmitarbeiter',
    fr: 'Employé de Pharmacie',
    es: 'Empleado de Farmacia',
    descAr: 'تجهيز الطلبات المعتمدة ومتابعة حالة التوصيل والعمليات اليومية داخل الصيدلية',
    descEn: 'Prepare confirmed orders and update delivery fulfillment stages',
    badge: 'PHARMACY STAFF',
    tier: 'pharmacy',
  },
  viewer: {
    ar: 'مشاهد تقارير فقط (Read-Only Viewer)',
    en: 'Read-Only Administrative Viewer',
    de: 'Schreibgeschützter Betrachter',
    fr: 'Lecteur seul',
    es: 'Lector de solo lectura',
    descAr: 'صلاحية قراءة ومطالعة فقط للوحة الإدارة والإحصائيات دون تعديل البيانات',
    descEn: 'Read-only access to administrative dashboards and analytics without write permissions',
    badge: 'VIEWER',
    tier: 'clinical',
  },
  customer: {
    ar: 'عميل / مريض مسجل (Registered Customer)',
    en: 'Registered Customer & Patient',
    de: 'Registrierter Kunde / Patient',
    fr: 'Client / Patient inscrit',
    es: 'Cliente / Paciente registrado',
    descAr: 'طلب الأدوية من الصيدليات المعتمدة ومتابعة حالة الطلب والجواز الطبي الذكي',
    descEn: 'Order medicines from verified pharmacies, track 8-stage orders, and manage Smart Medical Passport',
    badge: 'CUSTOMER',
    tier: 'public',
  },
  user: {
    ar: 'مستخدم عام (Standard User)',
    en: 'Standard Platform User',
    de: 'Standardbenutzer',
    fr: 'Utilisateur standard',
    es: 'Usuario estándar',
    descAr: 'استخدام أدوات الفحص الدوائي والجواز الطبي ودليل الأدوية',
    descEn: 'Access clinical safety tools, drug directory, and personal health profile',
    badge: 'USER',
    tier: 'public',
  },
};

export default function UsersTab({ myUid }: { myUid: string }) {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { user: currentUser, role: myCurrentRole } = useAuth();
  const [users, setUsers] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUid, setNewUid] = useState('');
  const [newRole, setNewRole] = useState<Role>('pharmacy_owner');
  const [searchFilter, setSearchFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'platform' | 'clinical' | 'pharmacy' | 'public'>('all');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadRolesAndLoggedUsers() {
    setLoading(true);
    const map = new Map<string, UserRoleRow>();

    const upsertRow = (uid: string, partial: Partial<UserRoleRow>) => {
      if (!uid) return;
      const prev = map.get(uid) || {
        uid,
        role: 'customer' as Role,
        email: '',
        displayName: '',
        photoURL: '',
        lastLoginAt: '',
        hasExplicitRoleDoc: false,
      };
      const email = (partial.email || prev.email || '').trim().toLowerCase();
      const displayName =
        partial.displayName ||
        prev.displayName ||
        (email ? formatDisplayNameFromEmail(email) : '');
      const photoURL =
        partial.photoURL ||
        prev.photoURL ||
        (email ? resolveGoogleAvatarUrl(email) : '');

      map.set(uid, {
        ...prev,
        ...partial,
        uid,
        email,
        displayName,
        photoURL,
      });
    };

    // 1. Seed current logged-in user
    if (currentUser?.uid) {
      upsertRow(currentUser.uid, {
        role: (myCurrentRole || 'customer') as Role,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || '',
        lastLoginAt: new Date().toISOString(),
      });
    }

    // 2. Seed saved device accounts so existing accounts appear with photos/names immediately
    try {
      const savedAccounts = getSavedDeviceGoogleAccounts();
      savedAccounts.forEach((acc) => {
        upsertRow(acc.uid, {
          email: acc.email,
          displayName: acc.displayName,
          photoURL: acc.photoURL || '',
          lastLoginAt: acc.lastUsedAt ? new Date(acc.lastUsedAt).toISOString() : '',
        });
      });
    } catch {
      /* ignore */
    }

    if (configured && db) {
      // 3. Load all signed-in users from `customerProfiles`
      try {
        const profSnap = await getDocs(collection(db, 'customerProfiles'));
        profSnap.forEach((d) => {
          const data = d.data();
          upsertRow(d.id, {
            email: data.email || '',
            displayName: data.displayName || '',
            photoURL: data.photoURL || '',
            lastLoginAt: data.lastLoginAt || data.updatedAt || data.createdAt || '',
          });
        });
      } catch {
        /* ignore */
      }

      // 4. Load assigned roles from `roles`
      try {
        const snap = await getDocs(collection(db, 'roles'));
        snap.forEach((d) => {
          const data = d.data();
          if (data && data.role) {
            upsertRow(d.id, {
              role: data.role as Role,
              email: data.email || '',
              displayName: data.displayName || '',
              lastLoginAt: data.updatedAt || '',
              hasExplicitRoleDoc: true,
            });
          }
        });
      } catch {
        /* ignore */
      }
    }

    const sorted = Array.from(map.values()).sort((a, b) => {
      if (a.uid === myUid) return -1;
      if (b.uid === myUid) return 1;
      return (b.lastLoginAt || '').localeCompare(a.lastLoginAt || '');
    });

    setUsers(sorted);
    setLoading(false);
  }

  useEffect(() => {
    void loadRolesAndLoggedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveRole(uid: string, role: Role, targetRow?: UserRoleRow) {
    if (!uid.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      await setDoc(
        doc(db, 'roles', uid.trim()),
        {
          role,
          email: targetRow?.email || '',
          displayName: targetRow?.displayName || '',
          updatedAt: new Date().toISOString(),
          updatedBy: myUid,
        },
        { merge: true }
      );
      setMsg(t('saved') || tr(lang, 'تم حفظ وتحديث الرتبة الوظيفية بنجاح ✓', 'Role saved and updated successfully ✓'));
      await loadRolesAndLoggedUsers();
      setNewUid('');
    } catch (e: unknown) {
      const errObj = e as { message?: string };
      setMsg(errObj?.message || t('actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRole(uid: string) {
    if (uid === myUid) {
      alert(tr(lang, 'لا يمكنك حذف صلاحية الأدمن الخاصة بحسابك الحالي.', 'Cannot delete your own admin role.'));
      return;
    }
    if (!confirm(t('confirmDel') || tr(lang, 'هل أنت متأكد من إزالة هذه الصلاحية وإرجاعه لمستخدم عادي؟', 'Reset this user role to standard customer?'))) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'roles', uid));
      await loadRolesAndLoggedUsers();
    } catch (e: unknown) {
      const errObj = e as { message?: string };
      alert(errObj?.message || t('actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  const getRoleLabel = (r: Role) => {
    const info = ROLE_LABELS[r];
    if (!info) return r;
    if (lang === 'ar') return info.ar;
    if (lang === 'de') return info.de;
    if (lang === 'fr') return info.fr;
    if (lang === 'es') return info.es;
    return info.en;
  };

  const getRoleDescription = (r: Role) => {
    const info = ROLE_LABELS[r];
    if (!info) return '';
    return lang === 'ar' ? info.descAr : info.descEn;
  };

  const roleSelectOptions: SmartChoiceOption[] = useMemo(() => {
    return ROLES.map((r) => {
      const info = ROLE_LABELS[r];
      return {
        value: r,
        label: getRoleLabel(r),
        description: getRoleDescription(r),
        badge: info?.badge || r.toUpperCase(),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const meta = ROLE_LABELS[u.role] || ROLE_LABELS.customer;
      if (tierFilter !== 'all' && meta?.tier !== tierFilter) return false;
      const q = searchFilter.trim().toLowerCase();
      if (!q) return true;
      return (
        u.uid.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (meta?.ar && meta.ar.toLowerCase().includes(q)) ||
        (meta?.en && meta.en.toLowerCase().includes(q))
      );
    });
  }, [users, tierFilter, searchFilter]);

  const selectedNewRoleMeta = ROLE_LABELS[newRole] || ROLE_LABELS.user;

  return (
    <div className="card stack" style={{ marginTop: '0.5rem', gap: '1.1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UnslopIcon name="shield" size={22} color="#059669" />
            {tr(
              lang,
              'إدارة المستخدمين المسجلين والرتب الوظيفية (RBAC)',
              'Registered Users & Roles Management (RBAC)'
            )}
          </h2>
          <p className="small muted" style={{ margin: 0 }}>
            {tr(
              lang,
              'يظهر هنا تلقائياً كل شخص سجل دخول في الموقع أو التطبيق بصورته واسمه وإيميله، ويمكنك تغيير صلاحيته مباشرة من القائمة بدون نسخ الـ UID.',
              'Automatically lists everyone who signed in with their photo, name, and email so you can assign roles directly without copying UIDs.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge approved" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            {tr(lang, `إجمالي الحسابات المسجلة: ${users.length}`, `Registered Accounts: ${users.length}`)}
          </span>
        </div>
      </div>

      {/* Current User UID Card */}
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
          <b>{tr(lang, 'معرّف حسابك الحالي (Your UID):', 'Your Account UID:')}</b>
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
        </div>
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

      {/* Grant / Update Role Form with SmartChoiceSelect Popup */}
      <div className="subcard stack" style={{ gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <b>
            {tr(
              lang,
              'منح أو تحديث صلاحية مستخدم بالـ UID (أو اختره مباشرة من الجدول بالأسفل):',
              'Grant or Update User Role by UID (or select directly from the table below):'
            )}
          </b>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#047857',
            }}
          >
            {selectedNewRoleMeta.badge}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            dir="ltr"
            placeholder={t('uid') || 'Firebase User UID (e.g. xK9p2...)'}
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0.65rem 0.95rem',
              borderRadius: '999px',
              border: '1.5px solid var(--line)',
              boxSizing: 'border-box',
            }}
          />

          <SmartChoiceSelect
            value={newRole}
            onChange={(val) => setNewRole(val as Role)}
            options={roleSelectOptions}
            modalTitle={tr(lang, 'اختر الرتبة الوظيفية والصلاحية', 'Select Role & Permission Tier')}
            modalSubtitle={tr(
              lang,
              'كل رتبة تحدد الصلاحيات المسموحة بدقة داخل لوحة الإدارة أو بوابة الصيدلية',
              'Each role defines exact access permissions across Admin & Pharmacy Portals'
            )}
          />

          <button
            type="button"
            className="btn"
            disabled={!newUid.trim() || busy}
            onClick={() => handleSaveRole(newUid, newRole)}
            style={{
              minHeight: '44px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 800,
            }}
          >
            <UnslopIcon name="check" size={18} color="#ffffff" />
            <span>{t('grant') || tr(lang, 'حفظ وتعيين الصلاحية', 'Assign Role')}</span>
          </button>
        </div>

        {/* Live Role Capabilities Preview Banner */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'var(--card-bg)',
            border: '1px solid var(--line)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <b style={{ color: '#059669' }}>{getRoleLabel(newRole)}: </b>
            <span className="muted">{getRoleDescription(newRole)}</span>
          </div>
        </div>
      </div>

      {/* Search & Tier Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: tr(lang, 'الكل', 'All Users') },
            { id: 'platform', label: tr(lang, 'إدارة المنصة والأقاليم', 'Platform & Regional') },
            { id: 'pharmacy', label: tr(lang, 'شبكة الصيدليات', 'Pharmacy Network') },
            { id: 'clinical', label: tr(lang, 'المراجعة والمحتوى', 'Clinical & Content') },
            { id: 'public', label: tr(lang, 'العملاء والمرضى المسجلين', 'Signed-In Customers') },
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
          placeholder={tr(lang, 'بحث بالاسم أو الإيميل أو الـ UID أو الصلاحية...', 'Search by name, email, UID, or role...')}
          style={{
            minWidth: '240px',
            padding: '8px 14px',
            borderRadius: '999px',
            border: '1px solid var(--line)',
            fontSize: '0.85rem',
          }}
        />
      </div>

      {loading ? (
        <p>{t('loading')}</p>
      ) : filteredUsers.length === 0 ? (
        <p className="muted">
          {tr(
            lang,
            'لا توجد حسابات مطابقة للبحث الحالي.',
            'No matching user accounts found.'
          )}
        </p>
      ) : (
        <div className="tablewrap">
          <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>{tr(lang, 'المستخدم (الصورة / الاسم / الإيميل)', 'User (Photo / Name / Email)')}</th>
                <th>{t('uid')}</th>
                <th>{t('role')}</th>
                <th>{tr(lang, 'نطاق الصلاحية وآخر ظهور', 'Scope & Last Seen')}</th>
                <th>{tr(lang, 'إجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS.customer;
                return (
                  <tr key={u.uid}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            border: '2px solid #10b981',
                            background: '#0D1F38',
                            color: '#CFD29D',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName || 'User'}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>{(u.displayName || u.email || u.uid || 'U').slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                            {u.displayName || (isAr ? 'مستخدم مسجل' : 'Registered User')}{' '}
                            {u.uid === myUid && (
                              <span className="badge approved" style={{ marginInlineStart: 6 }}>
                                {tr(lang, 'أنت (You)', 'You')}
                              </span>
                            )}
                          </div>
                          {u.email && (
                            <div className="small muted" dir="ltr" style={{ fontSize: '0.78rem' }}>
                              {u.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>
                      {u.uid}
                    </td>
                    <td style={{ minWidth: '250px' }}>
                      <SmartChoiceSelect
                        value={u.role}
                        disabled={busy || u.uid === myUid}
                        options={roleSelectOptions}
                        modalTitle={tr(
                          lang,
                          `تعديل صلاحية (${u.displayName || u.email || u.uid})`,
                          `Update Role (${u.displayName || u.email || u.uid})`
                        )}
                        modalSubtitle={tr(
                          lang,
                          'اختر الصلاحية الجديدة ليتم تحديثها فوراً في قاعدة البيانات',
                          'Select a new role to update immediately in Firestore'
                        )}
                        onChange={(val) => handleSaveRole(u.uid, val as Role, u)}
                      />
                    </td>
                    <td className="small muted" style={{ maxWidth: '280px' }}>
                      <div>{roleMeta ? (lang === 'ar' ? roleMeta.descAr : roleMeta.descEn) : u.role}</div>
                      {u.lastLoginAt && (
                        <div dir="ltr" style={{ fontSize: '0.73rem', color: '#059669', marginTop: '3px', fontWeight: 700 }}>
                          {isAr ? 'آخر ظهور: ' : 'Last seen: '}
                          {u.lastLoginAt.slice(0, 16).replace('T', ' ')}
                        </div>
                      )}
                    </td>
                    <td>
                      {u.uid !== myUid && u.hasExplicitRoleDoc && (
                        <button
                          type="button"
                          className="btn small danger"
                          disabled={busy}
                          onClick={() => handleDeleteRole(u.uid)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <UnslopIcon name="trash" size={14} color="currentColor" />
                          <span>{t('remove') || tr(lang, 'إلغاء الصلاحية', 'Remove Role')}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
