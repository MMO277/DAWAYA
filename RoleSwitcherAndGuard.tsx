import React, { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';
import { useLang } from './i18n';
import { tr } from './types';
import {
  CanonicalRole,
  InterfaceMode,
  PermissionId,
  ROLE_DEFINITIONS,
} from './rbacEngine';
import { UnslopIcon } from './UnslopIcons';

/**
 * Header & Drawer "Switch Mode / تغيير الوضع" Control (Section 5)
 * Appears whenever a user has multiple authorized roles or memberships.
 */
export function RoleModeSwitcher({ compact = false }: { compact?: boolean }) {
  const {
    user,
    activeMode,
    activeRole,
    authorizedRoles,
    availableModes,
    pharmacyMemberships,
    regionalMemberships,
    activePharmacyId,
    activeRegionId,
    effectivePermissions,
    switchMode,
  } = useAuth();
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);

  if (!user) return null;

  // Show switcher if user has more than 1 role or more than 1 mode
  const hasMultipleRoles = authorizedRoles.length > 1 || availableModes.length > 1;
  if (!hasMultipleRoles && !compact) return null;

  const currentRoleDef = ROLE_DEFINITIONS[activeRole] || ROLE_DEFINITIONS.patient;

  const modeColor =
    activeMode === 'admin'
      ? '#7c3aed'
      : activeMode === 'pharmacy'
      ? '#0d9488'
      : '#059669';

  const handleSelectRole = (
    targetRole: CanonicalRole,
    targetRoute: string,
    options?: { pharmacyId?: string; regionId?: string }
  ) => {
    const ok = switchMode(targetRole, options);
    if (ok) {
      setOpenModal(false);
      navigate(targetRoute);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenModal(true)}
        title={tr(
          lang,
          'تغيير الوضع والتبديل بين واجهة المريض والصيدلية والإدارة بدون تسجيل خروج',
          'Switch Mode between Patient, Pharmacy, and Admin interfaces without signing out'
        )}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '5px 10px' : '6px 12px',
          borderRadius: '999px',
          border: '1.5px solid rgba(207, 210, 157, 0.55)',
          background:
            activeMode === 'admin'
              ? 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)'
              : activeMode === 'pharmacy'
              ? 'linear-gradient(135deg, #065f46 0%, #0f766e 100%)'
              : 'rgba(15, 118, 110, 0.35)',
          color: '#ffffff',
          fontSize: compact ? '0.74rem' : '0.78rem',
          fontWeight: 800,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)',
        }}
      >
        <span aria-hidden="true">
          {activeMode === 'admin' ? '🛡️' : activeMode === 'pharmacy' ? '🏥' : '👤'}
        </span>
        <span>
          {isAr ? 'تغيير الوضع:' : 'Mode:'}{' '}
          <strong style={{ color: '#CFD29D' }}>{currentRoleDef.badge}</strong>
        </span>
        <span aria-hidden="true" style={{ fontSize: '0.7rem', opacity: 0.85 }}>▾</span>
      </button>

      {openModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isAr ? 'تغيير الوضع النشط (Switch Mode)' : 'Switch Active Interface Mode'}
          onClick={() => setOpenModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999990,
            background: 'rgba(13, 31, 56, 0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            dir={isAr ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '88vh',
              overflowY: 'auto',
              background: 'var(--card-bg, #ffffff)',
              color: 'var(--text, #0f172a)',
              borderRadius: '22px',
              border: `2px solid ${modeColor}`,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UnslopIcon name="shield" size={24} color="#059669" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem' }}>
                    {isAr ? 'تغيير الوضع والواجهة النشطة (Switch Mode)' : 'Switch Active Interface Mode'}
                  </h3>
                  <small className="muted">
                    {isAr
                      ? 'تنقّل فوراً بين أدوارك المصرح بها على نفس الحساب بدون تسجيل خروج'
                      : 'Switch between your authorized roles on the same account without signing out'}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="dawaya-smart-select-close"
                onClick={() => setOpenModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            {/* Primary Interface Mode Cards */}
            <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
              {availableModes.map((item) => {
                const isSelected = activeMode === item.mode && activeRole === item.role;
                return (
                  <button
                    key={`${item.mode}_${item.role}`}
                    type="button"
                    onClick={() => handleSelectRole(item.role, item.targetRoute)}
                    style={{
                      width: '100%',
                      textAlign: isAr ? 'right' : 'left',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #059669' : '1.5px solid var(--line)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>
                          {item.mode === 'admin' ? '🛡️' : item.mode === 'pharmacy' ? '🏥' : '👤'}
                        </span>
                        <span>{isAr ? item.labelAr : item.labelEn}</span>
                      </div>
                      <div className="small muted" style={{ marginTop: '4px' }}>
                        {isAr
                          ? ROLE_DEFINITIONS[item.role]?.descriptionAr
                          : ROLE_DEFINITIONS[item.role]?.descriptionEn}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: isSelected ? '#059669' : 'rgba(15, 23, 42, 0.08)',
                        color: isSelected ? '#ffffff' : 'var(--text)',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected ? (isAr ? 'الوضع النشط ✓' : 'Active ✓') : item.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* All Individual Authorized Roles (if user has multiple specific roles) */}
            {authorizedRoles.length > 1 && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  marginBottom: '12px',
                }}
              >
                <div className="small" style={{ fontWeight: 800, marginBottom: '8px' }}>
                  {isAr ? 'جميع الأدوار المفعلة لحسابك:' : 'All Authorized Roles on Your Account:'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {authorizedRoles.map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    const active = activeRole === r;
                    const targetRoute =
                      def.interfaceMode === 'admin'
                        ? '/admin'
                        : def.interfaceMode === 'pharmacy'
                        ? '/pharmacy-portal'
                        : '/';
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSelectRole(r, targetRoute)}
                        className={active ? 'btn small' : 'btn small ghost'}
                        style={{ borderRadius: '999px', fontSize: '0.78rem' }}
                      >
                        {isAr ? def.nameAr : def.nameEn} {active ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scoped Pharmacy Memberships Selector */}
            {pharmacyMemberships.length > 0 && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(13, 148, 136, 0.06)',
                  border: '1px solid rgba(13, 148, 136, 0.25)',
                  marginBottom: '12px',
                }}
              >
                <div className="small" style={{ fontWeight: 800, marginBottom: '6px', color: '#0f766e' }}>
                  🏥 {isAr ? 'عضويات الصيدليات المعتمدة لحسابك:' : 'Authorized Pharmacy Memberships:'}
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {pharmacyMemberships.map((mem) => {
                    const isCurrentPharm = activePharmacyId === mem.pharmacyId && activeMode === 'pharmacy';
                    return (
                      <button
                        key={mem.id}
                        type="button"
                        onClick={() =>
                          handleSelectRole(mem.role, '/pharmacy-portal', { pharmacyId: mem.pharmacyId })
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: isCurrentPharm ? '1.5px solid #0d9488' : '1px solid var(--line)',
                          background: 'var(--card-bg)',
                          cursor: 'pointer',
                          textAlign: isAr ? 'right' : 'left',
                        }}
                      >
                        <span className="small">
                          <b>{mem.pharmacyNameAr || mem.pharmacyId}</b> —{' '}
                          <span className="muted">{ROLE_DEFINITIONS[mem.role]?.badge}</span>
                        </span>
                        <span className="badge approved" style={{ fontSize: '0.7rem' }}>
                          {isCurrentPharm ? (isAr ? 'نشط' : 'Active') : isAr ? 'فتح الصيدلية' : 'Open'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scoped Regional Memberships Selector */}
            {regionalMemberships.length > 0 && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(124, 58, 237, 0.06)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  marginBottom: '12px',
                }}
              >
                <div className="small" style={{ fontWeight: 800, marginBottom: '6px', color: '#6d28d9' }}>
                  🗺️ {isAr ? 'النطاق الجغرافي المعين (Regional Scope):' : 'Assigned Regional Scope:'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {regionalMemberships.map((rm) => (
                    <button
                      key={rm.id}
                      type="button"
                      onClick={() =>
                        handleSelectRole('regional_manager', '/admin', { regionId: rm.regionId })
                      }
                      className={activeRegionId === rm.regionId ? 'btn small' : 'btn small ghost'}
                      style={{ borderRadius: '999px' }}
                    >
                      {rm.regionNameAr || rm.regionId}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Effective Permissions Summary */}
            <div className="small muted" style={{ fontSize: '0.76rem', lineHeight: 1.5 }}>
              <b>{isAr ? 'الصلاحيات المفعلة في هذا الوضع:' : 'Active Permissions in Current Mode:'}</b>{' '}
              <span dir="ltr">{effectivePermissions.join(' • ')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Route-Level Authorization & Mode Enforcement Guard (Section 12 & 13)
 */
export function ProtectedRoute({
  children,
  requiredMode,
  requiredRoles,
  requiredPermissions,
}: {
  children: ReactNode;
  requiredMode?: InterfaceMode;
  requiredRoles?: CanonicalRole[];
  requiredPermissions?: PermissionId[];
}) {
  const {
    user,
    loading,
    accountStatus,
    activeMode,
    authorizedRoles,
    hasRole,
    hasPermission,
    switchMode,
    openAuthModal,
  } = useAuth();
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <main className="wrap narrow">
        <div className="card center" style={{ padding: '32px 20px' }}>
          <b>{isAr ? 'جارٍ التحقق من الصلاحيات والأمان...' : 'Verifying security & permissions...'}</b>
        </div>
      </main>
    );
  }

  if (accountStatus === 'suspended') {
    return (
      <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card stack" style={{ border: '2px solid #dc2626' }}>
          <h2 style={{ color: '#dc2626', margin: 0 }}>
            🚫 {isAr ? 'تم إيقاف الحساب مؤقتاً' : 'Account Suspended'}
          </h2>
          <p className="muted">
            {isAr
              ? 'تم تقييد صلاحيات هذا الحساب بواسطة الإدارة المركزية لمنصة دوايا. يرجى التواصل مع الدعم الفني لمراجعة حالة الحساب.'
              : 'This account has been suspended by DAWAYA Central Administration. Please contact support.'}
          </p>
          <Link to="/" className="btn ghost">
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card stack">
          <h2 style={{ margin: 0 }}>
            🔒 {isAr ? 'تسجيل الدخول مطلوب للوصول لهذه البوابة' : 'Sign-In Required'}
          </h2>
          <p className="muted">
            {isAr
              ? 'هذه الصفحة مخصصة للمستخدمين المسجلين وأصحاب الصلاحيات المعتمدة في منصة دوايا.'
              : 'This portal requires an authenticated DAWAYA account with authorized permissions.'}
          </p>
          <div className="row wrapRow" style={{ gap: '10px' }}>
            <button type="button" className="btn" onClick={() => openAuthModal('login')}>
              {isAr ? 'تسجيل الدخول الآن' : 'Sign In Now'}
            </button>
            <Link to="/" className="btn ghost">
              {isAr ? 'العودة لواجهة المريض' : 'Return to Patient Home'}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Check if user owns at least one of the requiredRoles
  if (requiredRoles && requiredRoles.length > 0) {
    const ownsAnyRequiredRole = requiredRoles.some((r) => hasRole(r));
    if (!ownsAnyRequiredRole) {
      // Allow Pharmacy Portal onboarding registration tab ONLY if user is visiting /pharmacy-portal to submit an application
      if (location.pathname === '/pharmacy-portal' || location.pathname === '/pharmacy-dashboard') {
        return <>{children}</>;
      }
      return (
        <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="card stack" style={{ border: '1.5px solid #f59e0b' }}>
            <h2 style={{ margin: 0, color: '#b45309' }}>
              🛡️ {isAr ? 'غير مصرح بالوصول لهذه الواجهة' : 'Access Restricted'}
            </h2>
            <p className="muted">
              {isAr
                ? 'حسابك الحالي يعمل بصلاحية المريض الافتراضية (Patient)، ولا يمتلك الصلاحية المطلوبة لفتح هذه اللوحة الإدارية.'
                : 'Your account currently holds the default Patient role and is not authorized to access this dashboard.'}
            </p>
            <div className="row wrapRow" style={{ gap: '10px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  switchMode('patient');
                  navigate('/');
                }}
              >
                {isAr ? 'العودة لوضع المريض (Patient Mode)' : 'Return to Patient Mode'}
              </button>
            </div>
          </div>
        </main>
      );
    }
  }

  // Check if user has required granular permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const missingPerm = requiredPermissions.find((p) => !hasPermission(p));
    if (missingPerm) {
      // Check if user owns a role that has this permission but is currently in 'patient' mode
      if (requiredMode && activeMode !== requiredMode && authorizedRoles.length > 1) {
        return (
          <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="card stack" style={{ border: '1.5px solid #0d9488' }}>
              <h2 style={{ margin: 0, color: '#0f766e' }}>
                🔄 {isAr ? 'تبديل الوضع مطلوب' : 'Mode Switch Required'}
              </h2>
              <p className="muted">
                {isAr
                  ? 'أنت تتصفح المنصة حالياً في "وضع المريض". لفتح هذه اللوحة، اضغط الزر بالأسفل للتبديل إلى وضع العمل المصرح لحسابك.'
                  : 'You are currently browsing in Patient Mode. Switch to your authorized work mode to access this dashboard.'}
              </p>
              <div className="row wrapRow" style={{ gap: '10px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    switchMode(requiredMode);
                  }}
                >
                  {isAr ? 'تفعيل الوضع المخصص الآن ✓' : 'Switch Mode Now ✓'}
                </button>
                <Link to="/" className="btn ghost">
                  {isAr ? 'البقاء في وضع المريض' : 'Stay in Patient Mode'}
                </Link>
              </div>
            </div>
          </main>
        );
      }
    }
  }

  return <>{children}</>;
}

/**
 * Component-Level Permission Guard (Section 12)
 */
export function PermissionGuard({
  permission,
  pharmacyId,
  regionId,
  fallback = null,
  children,
}: {
  permission: PermissionId;
  pharmacyId?: string;
  regionId?: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission, { pharmacyId, regionId })) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
