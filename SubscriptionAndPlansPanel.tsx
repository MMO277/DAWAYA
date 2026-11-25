import { FormEvent, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, configured } from './firebase';
import { useAuth } from './authContext';
import {
  DEFAULT_SUBSCRIPTION_CATALOG,
  DynamicPlanPricing,
  PromoCodeRule,
  SubscriptionCatalogConfig,
  computeFinalPrice,
  loadSubscriptionCatalog,
  saveSubscriptionCatalog,
} from './subscriptionConfigService';

export function SubscriptionAndPlansPanel({
  audience = 'user',
  vodafoneCashNumber = '01098478954',
  instaPayHandle = 'dawaya@instapay',
  isAr = true,
  adminManage = false,
}: {
  audience?: 'user' | 'pharmacy';
  vodafoneCashNumber?: string;
  instaPayHandle?: string;
  isAr?: boolean;
  adminManage?: boolean;
}) {
  const { user, role } = useAuth();
  const isAdmin = adminManage || role === 'admin';

  const [catalog, setCatalog] = useState<SubscriptionCatalogConfig>(DEFAULT_SUBSCRIPTION_CATALOG);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<DynamicPlanPricing | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay'>('vodafone_cash');
  const [senderPhoneOrAccount, setSenderPhoneOrAccount] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [entityName, setEntityName] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeRule | null>(null);
  const [promoFeedback, setPromoFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  // Admin editor states
  const [showAdminEditor, setShowAdminEditor] = useState(adminManage);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoPct, setNewPromoPct] = useState('25');
  const [newPromoScope, setNewPromoScope] = useState<'all' | 'user' | 'pharmacy'>('all');
  const [adminSaveMsg, setAdminSaveMsg] = useState('');

  useEffect(() => {
    void loadSubscriptionCatalog().then((loaded) => setCatalog(loaded));
  }, []);

  const plans = useMemo(
    () => catalog.plans.filter((p) => p.audience === audience),
    [catalog.plans, audience]
  );

  const handleApplyPromo = () => {
    const clean = promoInput.trim().toUpperCase();
    if (!clean) {
      setAppliedPromo(null);
      setPromoFeedback('');
      return;
    }
    const found = catalog.promos.find(
      (p) =>
        p.active &&
        p.code.trim().toUpperCase() === clean &&
        (p.appliesTo === 'all' || p.appliesTo === audience)
    );
    if (!found) {
      setAppliedPromo(null);
      setPromoFeedback(isAr ? 'كود الخصم غير صحيح أو غير مفعّل.' : 'Promo code is invalid or inactive.');
      return;
    }
    setAppliedPromo(found);
    setPromoFeedback(
      isAr
        ? `تم تطبيق كود (${found.code}) بخصم ${found.discountPercent}% بنجاح.`
        : `Promo code ${found.code} applied (${found.discountPercent}% OFF).`
    );
  };

  const handleAdminPriceChange = (planId: string, field: 'monthlyEgp' | 'annualEgp', value: string) => {
    const num = Math.max(0, Number(value) || 0);
    setCatalog((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => (p.id === planId ? { ...p, [field]: num } : p)),
    }));
  };

  const handleAdminAddPromo = () => {
    const code = newPromoCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const pct = Math.min(100, Math.max(1, Number(newPromoPct) || 10));
    if (!code) return;
    const rule: PromoCodeRule = {
      code,
      discountPercent: pct,
      active: true,
      appliesTo: newPromoScope,
      createdAtIso: new Date().toISOString(),
    };
    setCatalog((prev) => ({
      ...prev,
      promos: [rule, ...prev.promos.filter((p) => p.code !== code)],
    }));
    setNewPromoCode('');
  };

  const handleAdminTogglePromo = (code: string) => {
    setCatalog((prev) => ({
      ...prev,
      promos: prev.promos.map((p) => (p.code === code ? { ...p, active: !p.active } : p)),
    }));
  };

  const handleAdminDeletePromo = (code: string) => {
    setCatalog((prev) => ({
      ...prev,
      promos: prev.promos.filter((p) => p.code !== code),
    }));
  };

  const handleAdminSaveAll = async () => {
    setAdminSaveMsg('');
    try {
      await saveSubscriptionCatalog(catalog);
      setAdminSaveMsg(isAr ? 'تم حفظ الأسعار وأكواد الخصم وتحديثها للمستخدمين فوراً.' : 'Pricing & promo codes saved live.');
    } catch {
      setAdminSaveMsg(isAr ? 'تم الحفظ محلياً (تحقق من صلاحيات الأدمن السحابية).' : 'Saved locally.');
    }
  };

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !senderPhoneOrAccount.trim()) return;
    setSubmitting(true);
    setDoneMsg('');
    try {
      const basePrice = billingCycle === 'annual' ? selectedPlan.annualEgp : selectedPlan.monthlyEgp;
      const pricing = computeFinalPrice(basePrice, appliedPromo);
      const payload = {
        audience,
        planId: selectedPlan.id,
        planName: selectedPlan.nameAr,
        billingCycle,
        originalEgp: pricing.original,
        finalEgp: pricing.final,
        promoCode: appliedPromo?.code || '',
        discountPercent: appliedPromo?.discountPercent || 0,
        amountLabel: `${pricing.final} ج.م (${billingCycle === 'annual' ? 'سنوي' : 'شهري'})`,
        paymentMethod,
        senderPhoneOrAccount: senderPhoneOrAccount.trim(),
        transferRef: transferRef.trim(),
        entityName: entityName.trim() || user?.displayName || 'مستخدم دوايا',
        uid: user?.uid || 'guest',
        status: 'pending_verification',
        createdAtIso: new Date().toISOString(),
      };
      try {
        const prev = JSON.parse(localStorage.getItem('dawaya_subscription_requests_v1') || '[]');
        localStorage.setItem('dawaya_subscription_requests_v1', JSON.stringify([payload, ...prev].slice(0, 30)));
      } catch {}

      if (configured && db) {
        await addDoc(collection(db, 'subscription_requests'), {
          ...payload,
          createdAt: serverTimestamp(),
        }).catch(() => {});
      }

      setDoneMsg(
        isAr
          ? 'تم تسجيل طلب الاشتراك بنجاح! سيتم مراجعة التحويل وتفعيل الباقة خلال ساعات.'
          : 'Subscription request logged! Activation will complete after verification.'
      );
      setSenderPhoneOrAccount('');
      setTransferRef('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="card stack"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        border: '1.5px solid #0F7659',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, rgba(240, 250, 247, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%)',
        gap: '14px',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div>
          <span className="badge" style={{ background: '#081B26', color: '#CFD29D', fontWeight: 800 }}>
            {audience === 'pharmacy'
              ? isAr ? 'باقات الصيدليات الشريكة' : 'Partner Pharmacy Plans'
              : isAr ? 'باقات دوايا بلس والعائلة' : 'DAWAYA Plus & Family Plans'}
          </span>
          <h2 style={{ margin: '6px 0 2px', fontSize: '1.15rem', color: '#081B26' }}>
            {audience === 'pharmacy'
              ? isAr ? 'خطط الظهور المميز للصيدليات (شهري / سنوي)' : 'Pharmacy Visibility Plans'
              : isAr ? 'اشترك في الرعاية العائلية والذكاء المتقدم' : 'Unlock Family Care & Unlimited AI'}
          </h2>
        </div>

        {/* Monthly / Annual Billing Switcher */}
        <div
          className="row"
          style={{
            background: '#E6F2EE',
            padding: '4px',
            borderRadius: '999px',
            border: '1px solid #C5E2D8',
            gap: '4px',
          }}
        >
          <button
            type="button"
            className="btn small"
            style={{
              borderRadius: '999px',
              background: billingCycle === 'monthly' ? '#081B26' : 'transparent',
              color: billingCycle === 'monthly' ? '#FFFFFF' : '#0F172A',
              border: 'none',
              padding: '6px 14px',
            }}
            onClick={() => setBillingCycle('monthly')}
          >
            {isAr ? 'شهري' : 'Monthly'}
          </button>
          <button
            type="button"
            className="btn small"
            style={{
              borderRadius: '999px',
              background: billingCycle === 'annual' ? '#0F7659' : 'transparent',
              color: billingCycle === 'annual' ? '#FFFFFF' : '#0F172A',
              border: 'none',
              padding: '6px 14px',
            }}
            onClick={() => setBillingCycle('annual')}
          >
            {isAr ? 'سنوي (وفّر 20%)' : 'Annual (Save 20%)'}
          </button>
        </div>
      </div>

      {/* Admin Control Toggle */}
      {isAdmin && (
        <div>
          <button
            type="button"
            className="btn small"
            style={{ background: '#081B26', color: '#CFD29D', borderColor: '#081B26' }}
            onClick={() => setShowAdminEditor((v) => !v)}
          >
            {showAdminEditor
              ? isAr ? 'إخفاء إدارة الأسعار وأكواد الخصم' : 'Hide Pricing & Promo Manager'
              : isAr ? 'تعديل الأسعار وإدارة أكواد الخصم (الأدمن)' : 'Edit Prices & Promo Codes (Admin)'}
          </button>
        </div>
      )}

      {/* Admin Dynamic Pricing & Promo Code Manager */}
      {isAdmin && showAdminEditor && (
        <div
          className="card stack"
          style={{ background: '#071923', color: '#F8FAFC', border: '1.5px solid #CFD29D', gap: '12px' }}
        >
          <strong style={{ color: '#CFD29D', fontSize: '1rem' }}>
            {isAr ? 'لوحة التحكم في أسعار الباقات وأكواد الخصم' : 'Admin Pricing & Promo Code Manager'}
          </strong>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {catalog.plans
              .filter((p) => p.isPaid)
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '12px',
                    padding: '10px',
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: '8px', fontSize: '0.88rem' }}>{p.nameAr}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label className="small" style={{ color: '#9FB4C4', display: 'block', marginBottom: '3px' }}>
                        {isAr ? 'شهري (ج.م)' : 'Monthly (EGP)'}
                      </label>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        value={p.monthlyEgp}
                        onChange={(e) => handleAdminPriceChange(p.id, 'monthlyEgp', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="small" style={{ color: '#9FB4C4', display: 'block', marginBottom: '3px' }}>
                        {isAr ? 'سنوي (ج.م)' : 'Annual (EGP)'}
                      </label>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        value={p.annualEgp}
                        onChange={(e) => handleAdminPriceChange(p.id, 'annualEgp', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Add Promo Code */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '10px' }}>
            <div style={{ fontWeight: 800, marginBottom: '8px', color: '#5EEAD4', fontSize: '0.9rem' }}>
              {isAr ? 'إضافة كود خصم جديد:' : 'Create Discount Code:'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 1fr auto', gap: '8px', alignItems: 'center' }}>
              <input
                className="input"
                placeholder={isAr ? 'الكود (مثل: RAMADAN50)' : 'Code (e.g. SAVE50)'}
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                style={{ direction: 'ltr' }}
              />
              <input
                className="input"
                type="number"
                min={1}
                max={100}
                placeholder="%"
                value={newPromoPct}
                onChange={(e) => setNewPromoPct(e.target.value)}
              />
              <select
                className="input"
                value={newPromoScope}
                onChange={(e) => setNewPromoScope(e.target.value as 'all' | 'user' | 'pharmacy')}
              >
                <option value="all">{isAr ? 'كل الباقات' : 'All Plans'}</option>
                <option value="user">{isAr ? 'باقة العائلة فقط' : 'Family Only'}</option>
                <option value="pharmacy">{isAr ? 'الصيدليات فقط' : 'Pharmacy Only'}</option>
              </select>
              <button type="button" className="btn small" onClick={handleAdminAddPromo}>
                {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>

          {/* Existing Promo Codes List */}
          {catalog.promos.length > 0 && (
            <div className="stack" style={{ gap: '6px' }}>
              {catalog.promos.map((pr) => (
                <div
                  key={pr.code}
                  className="row wrapRow"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    gap: '8px',
                  }}
                >
                  <div>
                    <strong style={{ color: '#CFD29D', fontFamily: 'monospace' }}>{pr.code}</strong>
                    <span className="small" style={{ color: '#CBD5E1', marginInlineStart: '8px' }}>
                      {pr.discountPercent}% ({pr.appliesTo === 'all' ? 'الكل' : pr.appliesTo === 'user' ? 'العائلة' : 'الصيدليات'})
                    </span>
                  </div>
                  <div className="row" style={{ gap: '6px' }}>
                    <button
                      type="button"
                      className="btn small"
                      style={{
                        background: pr.active ? '#0F7659' : '#334155',
                        color: '#FFFFFF',
                        border: 'none',
                      }}
                      onClick={() => handleAdminTogglePromo(pr.code)}
                    >
                      {pr.active ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'متوقف' : 'Paused')}
                    </button>
                    <button
                      type="button"
                      className="btn small"
                      style={{ background: '#7F1D1D', color: '#FECACA', border: 'none' }}
                      onClick={() => handleAdminDeletePromo(pr.code)}
                    >
                      {isAr ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn"
            style={{ background: '#CFD29D', color: '#071923', borderColor: '#CFD29D', fontWeight: 800 }}
            onClick={() => void handleAdminSaveAll()}
          >
            {isAr ? 'حفظ وتطبيق الأسعار والأكواد الآن' : 'Save Pricing & Promos Live'}
          </button>
          {adminSaveMsg && <div className="small" style={{ color: '#5EEAD4', fontWeight: 700 }}>{adminSaveMsg}</div>}
        </div>
      )}

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
        {plans.map((plan) => {
          const base = billingCycle === 'annual' ? plan.annualEgp : plan.monthlyEgp;
          const pricing = computeFinalPrice(base, plan.isPaid ? appliedPromo : null);
          const annualSavePct =
            plan.monthlyEgp > 0 && plan.annualEgp > 0
              ? Math.max(0, Math.round((1 - plan.annualEgp / (plan.monthlyEgp * 12)) * 100))
              : 0;
          return (
            <div
              key={plan.id}
              className="card stack"
              style={{
                borderTop: `4px solid ${plan.accent}`,
                background: '#FFFFFF',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div>
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ color: '#081B26', fontSize: '1rem' }}>
                    {isAr ? plan.nameAr : plan.nameEn}
                  </strong>
                  {plan.badgeAr && (
                    <span className="badge" style={{ background: `${plan.accent}18`, color: plan.accent, fontWeight: 800 }}>
                      {isAr ? plan.badgeAr : plan.badgeEn}
                    </span>
                  )}
                </div>

                <div style={{ margin: '10px 0' }}>
                  {pricing.saved > 0 && (
                    <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontSize: '0.9rem', marginInlineEnd: '8px' }}>
                      {pricing.original} ج.م
                    </span>
                  )}
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: plan.accent }}>
                    {pricing.final === 0
                      ? isAr ? '0 ج.م' : '0 EGP'
                      : `${pricing.final} ${isAr ? 'ج.م' : 'EGP'} / ${billingCycle === 'annual' ? (isAr ? 'سنوياً' : 'yr') : (isAr ? 'شهرياً' : 'mo')}`}
                  </span>
                  {billingCycle === 'annual' && annualSavePct > 0 && (
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F7659', marginTop: '2px' }}>
                      {isAr ? `وفّر ${annualSavePct}% مع الاشتراك السنوي` : `Save ${annualSavePct}% annually`}
                    </div>
                  )}
                </div>

                <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '0.84rem', lineHeight: 1.7, color: '#334155' }}>
                  {(isAr ? plan.featuresAr : plan.featuresEn).map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>

              {plan.isPaid ? (
                <button
                  type="button"
                  className="btn small"
                  style={{ background: plan.accent, borderColor: plan.accent, color: '#FFFFFF', fontWeight: 800 }}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setDoneMsg('');
                  }}
                >
                  {isAr ? 'اشترك الآن (فودافون كاش / InstaPay)' : 'Subscribe Now'}
                </button>
              ) : (
                <span className="badge" style={{ background: '#ECFDF5', color: '#065F46', textAlign: 'center', padding: '8px', fontWeight: 800 }}>
                  {isAr ? 'مفعّلة لك حالياً مجاناً' : 'Active Free Plan'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Promo Code Bar */}
      <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: '180px', direction: 'ltr' }}
          placeholder={isAr ? 'هل لديك كود خصم؟ (مثل: DAWAYA25)' : 'Have a promo code?'}
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
        />
        <button type="button" className="btn small" onClick={handleApplyPromo}>
          {isAr ? 'تطبيق الخصم' : 'Apply Code'}
        </button>
        {promoFeedback && (
          <span className="small" style={{ fontWeight: 700, color: appliedPromo ? '#0F7659' : '#DC2626' }}>
            {promoFeedback}
          </span>
        )}
      </div>

      {/* Checkout Transfer Form */}
      {selectedPlan && (
        <form
          onSubmit={handleSubmitPayment}
          className="card stack"
          style={{ background: '#FFFFFF', border: `2px solid ${selectedPlan.accent}`, gap: '10px' }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: selectedPlan.accent }}>
              {isAr
                ? `تفعيل: ${selectedPlan.nameAr} (${billingCycle === 'annual' ? 'سنوي' : 'شهري'})`
                : selectedPlan.nameEn}
            </strong>
            <button type="button" className="btn small" onClick={() => setSelectedPlan(null)}>
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn small"
              style={{
                background: paymentMethod === 'vodafone_cash' ? '#DC2626' : '#F1F5F9',
                color: paymentMethod === 'vodafone_cash' ? '#FFFFFF' : '#0F172A',
                border: 'none',
              }}
              onClick={() => setPaymentMethod('vodafone_cash')}
            >
              {isAr ? `فودافون كاش: ${vodafoneCashNumber}` : `Vodafone Cash: ${vodafoneCashNumber}`}
            </button>
            <button
              type="button"
              className="btn small"
              style={{
                background: paymentMethod === 'instapay' ? '#4F46E5' : '#F1F5F9',
                color: paymentMethod === 'instapay' ? '#FFFFFF' : '#0F172A',
                border: 'none',
              }}
              onClick={() => setPaymentMethod('instapay')}
            >
              {isAr ? `InstaPay: ${instaPayHandle}` : `InstaPay: ${instaPayHandle}`}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            <input
              className="input"
              placeholder={isAr ? 'الاسم الكامل / اسم الصيدلية' : 'Full Name / Pharmacy'}
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
            />
            <input
              className="input"
              placeholder={isAr ? 'الرقم أو الحساب المحوّل منه' : 'Sender Phone / InstaPay'}
              value={senderPhoneOrAccount}
              onChange={(e) => setSenderPhoneOrAccount(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder={isAr ? 'رقم العملية / المرجع (اختياري)' : 'Reference ID (optional)'}
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
            />
          </div>

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? (isAr ? 'جاري التسجيل...' : 'Submitting...') : isAr ? 'تأكيد طلب التفعيل' : 'Confirm Activation Request'}
          </button>

          {doneMsg && (
            <div className="small" style={{ color: '#065F46', fontWeight: 700 }}>
              {doneMsg}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
