import PartnerManagementCenter from './PartnerManagementCenter';
import PharmacyOwnerDashboard from './PharmacyOwnerDashboard';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Role, useAuth } from './auth';
import { useLang } from './i18n';
import { fetchAll, removeMedicine, seedStarter, setStatus, validateForApproval } from './medicinesApi';
import { Medicine, pick, Status, STATUSES, tr } from './types';
import StatusBadge from './StatusBadge';
import UsersTab from './UsersTab';
import ResearchTab from './ResearchTab';
import { LearningImpactDashboard } from './LearningImpactDashboard';
import QuizResultsTab from './QuizResultsTab';
import CommercialCatalogTab from './CommercialCatalogEditor';
import SurveyQuizManagerTab from './SurveyQuizEditor';
import { SmartNativeSelect } from './SmartChoiceSelect';
import { UnslopIcon } from './UnslopIcons';
import { RoleModeSwitcher } from './RoleSwitcherAndGuard';
import { ROLE_DEFINITIONS } from './rbacEngine';
import {
  DawayaMedicineAdminManager,
  DawayaContentAndArticlesAdmin,
  DawayaSystemAiDataSourcesAndAuditAdmin,
} from './DawayaAdminSuite';

function Login() {
  const { t } = useLang();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(email.trim(), pw);
    } catch {
      setErr(t('signInFail'));
    }
    setBusy(false);
  }
  return (
    <main className="wrap narrow">
      <form className="card form" onSubmit={submit}>
        <h1>{t('adminTitle')}</h1>
        <label htmlFor="em">{t('email')}</label>
        <input id="em" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="pw">{t('password')}</label>
        <input id="pw" type="password" dir="ltr" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="alert">{err}</p>}
        <button className="btn" disabled={busy}>{t('signIn')}</button>
      </form>
    </main>
  );
}

function MedsTab({ role, uid }: { role: Role; uid: string }) {
  const { t, lang } = useLang();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<Medicine[] | null>(null);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [err, setErr] = useState('');
  const isSuperOrAdmin =
    role === 'super_admin' ||
    role === 'central_admin' ||
    role === 'owner' ||
    role === 'admin' ||
    hasPermission('system.settings.manage');
  const reviewer =
    role === 'reviewer' ||
    role === 'content_reviewer' ||
    isSuperOrAdmin ||
    hasPermission('medications.approve');
  const canEditMeds =
    reviewer ||
    role === 'editor' ||
    role === 'content_editor' ||
    hasPermission('medications.manage');

  const [showUn, setShowUn] = useState(true);
  useEffect(() => {
    getDoc(doc(db, 'settings', 'public'))
      .then((s) => {
        if (s.exists()) setShowUn(s.data().showUnreviewed !== false);
      })
      .catch(() => {});
  }, []);
  async function saveShowUn(v: boolean) {
    setShowUn(v);
    try {
      await setDoc(doc(db, 'settings', 'public'), { showUnreviewed: v }, { merge: true });
    } catch {
      setShowUn(!v);
      alert(t('actionFailed'));
    }
  }

  const load = () =>
    fetchAll().then(setItems).catch(() => setErr(t('loadError')));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(m: Medicine, status: Status) {
    if (status === 'approved') {
      const problems = validateForApproval(m);
      if (problems.length) {
        alert(`${t('cannotApprove')}\n- ${problems.join('\n- ')}`);
        return;
      }
    }
    try {
      await setStatus(m, status, uid);
      await load();
    } catch {
      alert(t('actionFailed'));
    }
  }
  async function remove(m: Medicine) {
    if (!confirm(`${t('confirmDel')} ${m.id}`)) return;
    try {
      await removeMedicine(m.id);
      await load();
    } catch {
      alert(t('actionFailed'));
    }
  }
  async function starter() {
    try {
      const n = await seedStarter(uid);
      alert(`${t('starterDone')} ${n}`);
      await load();
    } catch {
      alert(t('actionFailed'));
    }
  }

  const shown = (items ?? []).filter((m) => filter === 'all' || m.status === filter);

  return (
    <div className="stack">
      {isSuperOrAdmin && (
        <div className="card form">
          <label className="check">
            <input type="checkbox" checked={showUn} onChange={(e) => saveShowUn(e.target.checked)} />
            {t('previewToggle')}
          </label>
          <p className="small muted">{t('previewToggleHelp')}</p>
        </div>
      )}
      <div className="row wrapRow">
        {canEditMeds && <Link to="/admin/new" className="btn">{t('newMed')}</Link>}
        {canEditMeds && <button className="btn ghost" onClick={starter}>{t('starter')}</button>}
        <div style={{ minWidth: '220px' }}>
          <SmartNativeSelect value={filter} onChange={(e) => setFilter(e.target.value as Status | 'all')} aria-label={t('status')}>
            <option value="all">{t('all')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`st_${s}`)}</option>)}
          </SmartNativeSelect>
        </div>
      </div>
      {err && <p className="alert">{err}</p>}
      {items === null && !err && <p>{t('loading')}</p>}
      {shown.map((m) => (
        <div key={m.id} className="card rowcard">
          <div>
            <b>{pick(m.genericName, lang) || m.id}</b> <StatusBadge status={m.status} />
            <div className="small muted" dir="ltr">{m.id}</div>
          </div>
          <div className="row wrapRow">
            {canEditMeds && <Link className="btn small" to={`/admin/medicine/${m.id}`}>{t('edit')}</Link>}
            <Link className="btn small ghost" to={`/medicine/${m.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <UnslopIcon name="eye" size={15} />
            </Link>
            {canEditMeds && m.status === 'draft' && <button className="btn small ghost" onClick={() => act(m, 'pending_review')}>{t('submitReview')}</button>}
            {reviewer && m.status === 'pending_review' && <button className="btn small" onClick={() => act(m, 'approved')}>{t('approve')}</button>}
            {reviewer && m.status !== 'archived' && <button className="btn small ghost" onClick={() => act(m, 'archived')}>{t('archive')}</button>}
            {reviewer && m.status === 'archived' && <button className="btn small ghost" onClick={() => act(m, 'draft')}>{t('restore')}</button>}
            {isSuperOrAdmin && <button className="btn small danger" onClick={() => remove(m)}>{t('del')}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

type AdminTab =
  | 'dawaya_db'
  | 'partners'
  | 'pharmacy_portal'
  | 'users'
  | 'content_articles'
  | 'system_ai_audit'
  | 'catalog'
  | 'meds'
  | 'survey_bank'
  | 'research'
  | 'impact'
  | 'quiz';

export default function Dashboard() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const navigate = useNavigate();
  const {
    user,
    role,
    canonicalRole,
    activeRole,
    authorizedRoles,
    regionalMemberships,
    activeRegionId,
    hasPermission,
    switchMode,
    loading,
    logout,
  } = useAuth();

  const isSuperOrCentralAdmin =
    canonicalRole === 'super_admin' ||
    canonicalRole === 'central_admin' ||
    hasPermission('roles.assign');

  const isRegionalManager =
    activeRole === 'regional_manager' || canonicalRole === 'regional_manager';

  const isContentRole =
    activeRole === 'content_editor' ||
    activeRole === 'content_reviewer' ||
    canonicalRole === 'content_editor' ||
    canonicalRole === 'content_reviewer';

  const isAuthorizedForAdminPanel =
    isSuperOrCentralAdmin ||
    isRegionalManager ||
    isContentRole ||
    canonicalRole === 'viewer' ||
    hasPermission('pharmacies.approve') ||
    hasPermission('medications.manage') ||
    hasPermission('content.manage');

  const [tab, setTab] = useState<AdminTab>(() =>
    isRegionalManager ? 'partners' : 'dawaya_db'
  );

  useEffect(() => {
    if (isRegionalManager && tab === 'dawaya_db') {
      setTab('partners');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegionalManager]);

  if (loading) return <main className="wrap"><p>{t('loading')}</p></main>;
  if (!user) return <Login />;

  // Section 6 & 12: Reject unauthorized users (e.g. standard Patient or Pharmacy-only accounts) from Central Admin
  if (!isAuthorizedForAdminPanel) {
    const hasPharmacyAccess = authorizedRoles.some((r) =>
      ['pharmacy_owner', 'pharmacy_manager', 'pharmacist', 'pharmacy_employee'].includes(r)
    );
    return (
      <main className="wrap narrow stack" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card stack" style={{ border: '2px solid #f59e0b' }}>
          <h2 style={{ margin: 0, color: '#b45309' }}>
            🛡️ {tr(lang, 'لوحة الإدارة مخصصة للأدوار الإدارية والعلمية فقط', 'Central Admin Restricted')}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {tr(
              lang,
              'حسابك يعمل حالياً بصلاحية المريض الافتراضية (Patient). لا يُسمح للمرضى أو الحسابات غير المخولة بالوصول لإعدادات الإدارة المركزية.',
              'Your account currently holds the default Patient role and is not authorized to access Central Administration.'
            )}
          </p>
          <div className="card" style={{ background: 'var(--bg)' }}>
            <p className="small" style={{ margin: '0 0 4px' }}>
              <b>{t('yourUid')}:</b> <code dir="ltr">{user.uid}</code>
            </p>
            <p className="small muted" style={{ margin: 0 }} dir="ltr">
              {user.email} — Role: {ROLE_DEFINITIONS[canonicalRole]?.badge || 'PATIENT'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '10px' }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                switchMode('patient');
                navigate('/');
              }}
            >
              👤 {tr(lang, 'العودة لواجهة المريض (Patient Mode)', 'Return to Patient Mode')}
            </button>
            {hasPharmacyAccess && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  switchMode('pharmacy');
                  navigate('/pharmacy-portal');
                }}
              >
                🏥 {tr(lang, 'الانتقال لبوابة الصيدلية (Pharmacy Mode)', 'Open Pharmacy Portal')}
              </button>
            )}
            <button type="button" className="btn ghost" onClick={logout}>
              {t('signOut')}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const activeRoleDef = ROLE_DEFINITIONS[activeRole] || ROLE_DEFINITIONS[canonicalRole] || ROLE_DEFINITIONS.patient;

  return (
    <main className="wrap stack">
      <div className="head" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0 }}>
            {isRegionalManager
              ? tr(lang, 'لوحة الإدارة الإقليمية للمحافظات — دوايا', 'DAWAYA Regional Governorate Portal')
              : isContentRole
              ? tr(lang, 'منصة التحرير والمراجعة العلمية — دوايا', 'DAWAYA Clinical & Content Editorial Studio')
              : t('adminTitle')}
          </h1>
          <div className="small muted">
            {isRegionalManager
              ? tr(
                  lang,
                  `النطاق الجغرافي المصرح به: ${regionalMemberships.map((m) => m.regionNameAr || m.regionId).join(' ، ') || activeRegionId || 'المحافظات المعينة'} — مع عزل تام للسجلات الطبية الخاصة بالمرضى`,
                  `Authorized Regional Scope: ${activeRegionId || 'Assigned Governorates'} — Zero access to private patient medical records`
                )
              : isContentRole
              ? tr(
                  lang,
                  'إدارة وتدقيق قاعدة الأدوية والمونوجرافات والمقالات العلمية (بدون أي وصول لبيانات أو ملفات المرضى الخاصة)',
                  'Manage & review medications, monographs, and scientific articles (zero access to private patient records)'
                )
              : tr(
                  lang,
                  'منصة دوايا | DAWAYA — مركز الإدارة الموحد لقاعدة الأدوية (26,562+) والشركاء والفرنشايز والصلاحيات',
                  'DAWAYA Admin Control Center — Unified Medicine DB (26,562+), Partners, Franchise & RBAC'
                )}
          </div>
        </div>
        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <RoleModeSwitcher />
          <span className="badge approved">{activeRoleDef.badge}</span>
          <button className="btn small ghost" onClick={logout}>{t('signOut')}</button>
        </div>
      </div>

      {/* Role-Specific Privacy & Scope Assurance Banner (Sections 6E & 6F) */}
      {(isRegionalManager || isContentRole) && (
        <div
          className="subcard"
          style={{
            background: 'rgba(13, 148, 136, 0.08)',
            border: '1px solid rgba(13, 148, 136, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div className="small">
            🛡️ <b>{isAr ? activeRoleDef.nameAr : activeRoleDef.nameEn}:</b>{' '}
            <span className="muted">
              {isAr ? activeRoleDef.descriptionAr : activeRoleDef.descriptionEn}
            </span>
          </div>
          <span className="badge approved" style={{ fontSize: '0.72rem' }}>
            {tr(lang, 'حماية خصوصية المرضى مفعّلة ✓', 'Patient Privacy Isolation Active ✓')}
          </span>
        </div>
      )}

      <div
        className="tabs"
        role="tablist"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '10px',
        }}
      >
        {(hasPermission('medications.view') || hasPermission('medications.manage')) && (
          <button
            className={tab === 'dawaya_db' ? 'on' : ''}
            onClick={() => setTab('dawaya_db')}
            style={{
              borderRadius: '10px',
              border: tab === 'dawaya_db' ? '2px solid var(--teal)' : '1px solid var(--line)',
              background: tab === 'dawaya_db' ? 'var(--tint)' : 'var(--card-bg)',
              padding: '8px 14px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UnslopIcon name="pill" size={16} color="#059669" />
            <span>{tr(lang, 'قاعدة أدوية دوايا الشاملة (26,562+)', 'DAWAYA Full Medicine DB (26,562+)')}</span>
          </button>
        )}

        {(isSuperOrCentralAdmin || isRegionalManager || hasPermission('pharmacies.view') || hasPermission('pharmacies.approve')) && (
          <button
            className={tab === 'partners' ? 'on' : ''}
            onClick={() => setTab('partners')}
            style={{
              borderRadius: '10px',
              border: tab === 'partners' ? '2px solid var(--teal)' : '1px solid var(--line)',
              background: tab === 'partners' ? 'var(--tint)' : 'var(--card-bg)',
              padding: '8px 14px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UnslopIcon name="hospital" size={16} color="#059669" />
            <span>{tr(lang, 'إدارة الشركاء والفرنشايز والتوثيق', 'Partners, Franchise & Verification')}</span>
          </button>
        )}

        {(isSuperOrCentralAdmin || hasPermission('inventory.view')) && (
          <button
            className={tab === 'pharmacy_portal' ? 'on' : ''}
            onClick={() => setTab('pharmacy_portal')}
            style={{
              borderRadius: '10px',
              border: tab === 'pharmacy_portal' ? '2px solid var(--teal)' : '1px solid var(--line)',
              background: tab === 'pharmacy_portal' ? 'var(--tint)' : 'var(--card-bg)',
              padding: '8px 14px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UnslopIcon name="package" size={16} color="#059669" />
            <span>{tr(lang, 'بوابة الصيدلية والمخزون والطلبات', 'Pharmacy Owner & Inventory Portal')}</span>
          </button>
        )}

        {isSuperOrCentralAdmin && (
          <button
            className={tab === 'users' ? 'on' : ''}
            onClick={() => setTab('users')}
            style={{
              borderRadius: '10px',
              border: tab === 'users' ? '2px solid var(--teal)' : '1px solid var(--line)',
              background: tab === 'users' ? 'var(--tint)' : 'var(--card-bg)',
              padding: '8px 12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UnslopIcon name="users" size={16} color="#059669" />
            <span>{tr(lang, 'إدارة المستخدمين والأدوار (User & Role Management)', 'User & Role Management (RBAC)')}</span>
          </button>
        )}

        {(isSuperOrCentralAdmin || isContentRole || hasPermission('content.manage') || hasPermission('content.review')) && (
          <button
            className={tab === 'content_articles' ? 'on' : ''}
            onClick={() => setTab('content_articles')}
            style={{
              borderRadius: '10px',
              border: tab === 'content_articles' ? '2px solid var(--teal)' : '1px solid var(--line)',
              background: tab === 'content_articles' ? 'var(--tint)' : 'var(--card-bg)',
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UnslopIcon name="book" size={16} color="#059669" />
            <span>{tr(lang, 'إدارة المحتوى والمقالات الطبية', 'Content & Medical Articles')}</span>
          </button>
        )}

        {(isSuperOrCentralAdmin || hasPermission('audit.view') || hasPermission('system.settings.manage')) && (
          <button
            className={tab === 'system_ai_audit' ? 'on' : ''}
            onClick={() => setTab('system_ai_audit')}
            style={{
              borderRadius: '10px',
              border: tab === 'system_ai_audit' ? '2px solid var(--teal)' : '1px solid var(--line)',
              background: tab === 'system_ai_audit' ? 'var(--tint)' : 'var(--card-bg)',
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UnslopIcon name="cpu" size={16} color="#059669" />
            <span>{tr(lang, 'الإحصائيات والذكاء الاصطناعي وسجل المراجعة', 'Analytics, AI Config & Audit Logs')}</span>
          </button>
        )}

        {(isSuperOrCentralAdmin || isContentRole || hasPermission('medications.manage')) && (
          <>
            <button
              className={tab === 'catalog' ? 'on' : ''}
              onClick={() => setTab('catalog')}
              style={{
                borderRadius: '10px',
                border: tab === 'catalog' ? '2px solid var(--teal)' : '1px solid var(--line)',
                background: tab === 'catalog' ? 'var(--tint)' : 'var(--card-bg)',
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UnslopIcon name="flask" size={16} color="#059669" />
              <span>{tr(lang, 'العبوات الدوائية المرجعية (267+)', 'Reference Packages (267+)')}</span>
            </button>

            <button
              className={tab === 'meds' ? 'on' : ''}
              onClick={() => setTab('meds')}
              style={{
                borderRadius: '10px',
                border: tab === 'meds' ? '2px solid var(--teal)' : '1px solid var(--line)',
                background: tab === 'meds' ? 'var(--tint)' : 'var(--card-bg)',
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UnslopIcon name="fileText" size={16} color="#059669" />
              <span>{tr(lang, 'المونوجرافات السريرية (32)', 'Clinical Monographs (32)')}</span>
            </button>

            <button
              className={tab === 'survey_bank' ? 'on' : ''}
              onClick={() => setTab('survey_bank')}
              style={{
                borderRadius: '10px',
                border: tab === 'survey_bank' ? '2px solid var(--teal)' : '1px solid var(--line)',
                background: tab === 'survey_bank' ? 'var(--tint)' : 'var(--card-bg)',
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UnslopIcon name="clipboard" size={16} color="#059669" />
              <span>{tr(lang, 'تعديل أسئلة الاستبيان والكويز', 'Edit Survey & Quiz Questions')}</span>
            </button>
          </>
        )}

        {(isSuperOrCentralAdmin || hasPermission('reports.view')) && (
          <>
            <button
              className={tab === 'research' ? 'on' : ''}
              onClick={() => setTab('research')}
              style={{
                borderRadius: '10px',
                border: tab === 'research' ? '2px solid var(--teal)' : '1px solid var(--line)',
                background: tab === 'research' ? 'var(--tint)' : 'var(--card-bg)',
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UnslopIcon name="chart" size={16} color="#059669" />
              <span>{t('tabResearch')}</span>
            </button>

            <button
              className={tab === 'impact' ? 'on' : ''}
              onClick={() => setTab('impact')}
              style={{
                borderRadius: '10px',
                border: tab === 'impact' ? '2px solid var(--teal)' : '1px solid var(--line)',
                background: tab === 'impact' ? 'var(--tint)' : 'var(--card-bg)',
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UnslopIcon name="activity" size={16} color="#059669" />
              <span>{tr(lang, 'قياس الأثر والتعلم', 'Learning Impact')}</span>
            </button>

            <button
              className={tab === 'quiz' ? 'on' : ''}
              onClick={() => setTab('quiz')}
              style={{
                borderRadius: '10px',
                border: tab === 'quiz' ? '2px solid var(--teal)' : '1px solid var(--line)',
                background: tab === 'quiz' ? 'var(--tint)' : 'var(--card-bg)',
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UnslopIcon name="award" size={16} color="#059669" />
              <span>{tr(lang, 'نتائج الكويز', 'Quiz Results')}</span>
            </button>
          </>
        )}
      </div>

      {tab === 'dawaya_db' && <DawayaMedicineAdminManager uid={user.uid} role={(role || 'viewer') as Role} />}
      {tab === 'partners' && <PartnerManagementCenter adminUid={user.uid} adminRole={(role || 'regional_manager') as Role} />}
      {tab === 'pharmacy_portal' && <PharmacyOwnerDashboard />}
      {tab === 'users' && isSuperOrCentralAdmin && <UsersTab myUid={user.uid} />}
      {tab === 'content_articles' && <DawayaContentAndArticlesAdmin uid={user.uid} role={(role || 'editor') as Role} />}
      {tab === 'system_ai_audit' && isSuperOrCentralAdmin && <DawayaSystemAiDataSourcesAndAuditAdmin uid={user.uid} role={(role || 'admin') as Role} />}
      {tab === 'catalog' && <CommercialCatalogTab uid={user.uid} />}
      {tab === 'meds' && <MedsTab role={(role || 'editor') as Role} uid={user.uid} />}
      {tab === 'survey_bank' && <SurveyQuizManagerTab uid={user.uid} />}
      {tab === 'research' && <ResearchTab />}
      {tab === 'impact' && <LearningImpactDashboard />}
      {tab === 'quiz' && <QuizResultsTab />}
    </main>
  );
}
