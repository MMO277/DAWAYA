import PartnerManagementCenter from './PartnerManagementCenter';
import PharmacyOwnerDashboard from './PharmacyOwnerDashboard';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import {
  DawayaMedicineAdminManager,
  DawayaContentAndArticlesAdmin,
  DawayaSystemAiDataSourcesAndAuditAdmin,
} from './DawayaAdminSuite';

function diagText(status: string, t: (k: string) => string): string {
  if (status === 'missing') return t('diagMissing');
  if (status.startsWith('invalid:')) return t('diagInvalid');
  if (status === 'error:permission-denied') return t('diagRules');
  if (status.startsWith('error:')) return t('diagOther');
  return '';
}

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
  const [items, setItems] = useState<Medicine[] | null>(null);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [err, setErr] = useState('');
  const isSuperOrAdmin = role === 'super_admin' || role === 'owner' || role === 'admin';
  const reviewer = role === 'reviewer' || isSuperOrAdmin || role === 'editor';
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
        <Link to="/admin/new" className="btn">{t('newMed')}</Link>
        <button className="btn ghost" onClick={starter}>{t('starter')}</button>
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
            <Link className="btn small" to={`/admin/medicine/${m.id}`}>{t('edit')}</Link>
            <Link className="btn small ghost" to={`/medicine/${m.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <UnslopIcon name="eye" size={15} />
            </Link>
            {m.status === 'draft' && <button className="btn small ghost" onClick={() => act(m, 'pending_review')}>{t('submitReview')}</button>}
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
  const { user, role, roleStatus, loading, logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>('dawaya_db');
  const isSuperOrAdmin = role === 'super_admin' || role === 'owner' || role === 'admin';

  if (loading) return <main className="wrap"><p>{t('loading')}</p></main>;
  if (!user) return <Login />;
  if (!role)
    return (
      <main className="wrap narrow stack">
        <p className="alert">{t('noRole')}</p>
        <div className="card">
          <p className="small">{t('yourUid')}</p>
          <p dir="ltr" className="uidbox">{user.uid}</p>
          <p className="small muted" dir="ltr">{user.email}</p>
          <p className="small"><b>{t('diagTitle')}</b> <span dir="ltr">{roleStatus}</span></p>
          <p className="small">{diagText(roleStatus, t)}</p>
        </div>
        <button className="btn ghost" onClick={logout}>{t('signOut')}</button>
      </main>
    );

  return (
    <main className="wrap stack">
      <div className="head" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('adminTitle')}</h1>
          <div className="small muted">
            {tr(
              lang,
              'منصة دوايا | DAWAYA — مركز الإدارة الموحد لقاعدة الأدوية (26,562+) والشركاء والفرنشايز والصلاحيات',
              'DAWAYA Admin Control Center — Unified Medicine DB (26,562+), Partners, Franchise & RBAC',
              'Centre d’administration DAWAYA',
              'Centro de administración DAWAYA',
              'DAWAYA Admin-Kontrollzentrum'
            )}
          </div>
        </div>
        <div className="row" style={{ gap: '8px' }}>
          <span className="badge approved">{role.toUpperCase()}</span>
          <button className="btn small ghost" onClick={logout}>{t('signOut')}</button>
        </div>
      </div>

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
          <span>{tr(lang, 'قاعدة أدوية دوايا الشاملة (26,562+)', 'DAWAYA Full Medicine DB (26,562+)', 'Base de Médicaments (26 562+)', 'Base de Medicamentos (26.562+)', 'DAWAYA Arzneimittel-DB (26.562+)')}</span>
        </button>

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
          <span>{tr(lang, 'إدارة الشركاء والفرنشايز والتوثيق', 'Partners, Franchise & Verification', 'Gestion des Partenaires', 'Socios y Farmacias', 'Partner & Apotheken')}</span>
        </button>

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

        {isSuperOrAdmin && (
          <button
            className={tab === 'users' ? 'on' : ''}
            onClick={() => setTab('users')}
            style={{
              borderRadius: '10px',
              border: tab === 'users' ? '2px solid var(--teal)' : '1px solid var(--line)',
              background: tab === 'users' ? 'var(--tint)' : 'var(--card-bg)',
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UnslopIcon name="users" size={16} color="#059669" />
            <span>{tr(lang, 'المستخدمون والصلاحيات (RBAC)', 'Users & Roles (RBAC)', 'Utilisateurs & Rôles', 'Usuarios y Roles', 'Benutzer & Rollen')}</span>
          </button>
        )}

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
          <span>{tr(lang, 'إدارة المحتوى والمقالات الطبية', 'Content & Medical Articles', 'Contenu & Articles', 'Contenido y Artículos', 'Inhalte & Artikel')}</span>
        </button>

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
          <span>{tr(lang, 'الإحصائيات والذكاء الاصطناعي وسجل المراجعة', 'Analytics, AI Config, Data Sources & Audit Logs', 'IA, Sources & Audit', 'IA, Fuentes y Auditoría', 'KI, Datenquellen & Audit')}</span>
        </button>

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
          <span>{tr(lang, 'العبوات الدوائية المرجعية (267+)', 'Reference Packages (267+)', 'Antibiotiques Commerciaux', 'Antibióticos Comerciales', 'Antibiotika-Katalog (206+)')}</span>
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
          <span>{tr(lang, 'المونوجرافات السريرية (32)', 'Clinical Monographs (32)', 'Monographies Cliniques (32)', 'Monografías Clínicas (32)', 'Klinische Monographien (32)')}</span>
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
          <span>{tr(lang, 'تعديل أسئلة الاستبيان والكويز', 'Edit Survey & Quiz Questions', 'Modifier Questions Quiz/Enquête', 'Editar Preguntas de Encuesta/Quiz', 'Umfrage- & Quizfragen bearbeiten')}</span>
        </button>

        {isSuperOrAdmin && (
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
        )}

        {isSuperOrAdmin && (
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
            <span>{tr(lang, 'قياس الأثر والتعلم', 'Learning Impact', 'Impact d’Apprentissage', 'Impacto de Aprendizaje', 'Lernwirkung')}</span>
          </button>
        )}

        {isSuperOrAdmin && (
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
            <span>{tr(lang, 'نتائج الكويز', 'Quiz Results', 'Résultats du Quiz', 'Resultados del Quiz', 'Quiz-Ergebnisse')}</span>
          </button>
        )}
      </div>

      {tab === 'dawaya_db' && <DawayaMedicineAdminManager uid={user.uid} role={role} />}
      {tab === 'partners' && <PartnerManagementCenter adminUid={user.uid} adminRole={role} />}
      {tab === 'pharmacy_portal' && <PharmacyOwnerDashboard />}
      {tab === 'users' && isSuperOrAdmin && <UsersTab myUid={user.uid} />}
      {tab === 'content_articles' && <DawayaContentAndArticlesAdmin uid={user.uid} role={role} />}
      {tab === 'system_ai_audit' && <DawayaSystemAiDataSourcesAndAuditAdmin uid={user.uid} role={role} />}
      {tab === 'catalog' && <CommercialCatalogTab uid={user.uid} />}
      {tab === 'meds' && <MedsTab role={role} uid={user.uid} />}
      {tab === 'survey_bank' && <SurveyQuizManagerTab uid={user.uid} />}
      {tab === 'research' && isSuperOrAdmin && <ResearchTab />}
      {tab === 'impact' && isSuperOrAdmin && <LearningImpactDashboard />}
      {tab === 'quiz' && isSuperOrAdmin && <QuizResultsTab />}
    </main>
  );
}
