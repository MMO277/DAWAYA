import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './authContext';
import SmartChoiceSelect from './SmartChoiceSelect';
import { UnslopIcon } from './UnslopIcons';
import {
  COMMERCE_UNIT_LABELS,
  computeUnitPricing,
  isValidEgyptianMobile,
  RetailUnit,
  useDawayaCommerce,
} from './dawayaCommerceStore';

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'طلب جديد — بانتظار موافقة الصيدلية', bg: '#FEF3C7', color: '#92400E' },
  ready: { label: 'تم التجهيز — ظهر العنوان تلقائيًا للمندوب', bg: '#E0F2FE', color: '#075985' },
  picked_up: { label: 'استلمه المندوب — في الطريق إليك', bg: '#CFFAFE', color: '#155E75' },
  delivered: { label: 'تم التوصيل والاستلام بالكامل', bg: '#D1FAE5', color: '#065F46' },
  partial_return: { label: 'تم التسليم مع مرتجع للرف', bg: '#F3E8FF', color: '#6B21A8' },
  returned: { label: 'مرتجع بالكامل للرف', bg: '#FFE4E6', color: '#9F1239' },
};

export default function DawayaUnifiedCommerceHub() {
  const { user } = useAuth();
  const { state, updateState } = useDawayaCommerce();
  const flags = state.featureFlags;

  const [activeTab, setActiveTab] = useState<'cart' | 'orders' | 'rx' | 'inbox'>('cart');
  const [promoInput, setPromoInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [orderChatDraft, setOrderChatDraft] = useState('');
  const [rxChatDraft, setRxChatDraft] = useState('');
  const [toast, setToast] = useState<string>('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3600);
  };

  const selectedPh = useMemo(
    () =>
      state.pharmacies.find((p) => p.id === state.selectedPharmacyId) ||
      state.pharmacies[0] ||
      null,
    [state.pharmacies, state.selectedPharmacyId]
  );

  const cartSummary = useMemo(() => {
    const phId = selectedPh?.id || '';
    const rows = state.cart.map((ci) => {
      const calc = computeUnitPricing(state, phId, ci.medId, ci.customBoxPrice || 50);
      const unitPrice =
        ci.unit === 'box' ? calc.boxPrice : ci.unit === 'strip' ? calc.stripPrice : calc.tabletPrice;
      const lineTotal = Math.round(unitPrice * ci.qty * 100) / 100;
      return { ...ci, calc, unitPrice, lineTotal };
    });
    const subtotal = Math.round(rows.reduce((s, r) => s + r.lineTotal, 0) * 100) / 100;
    const promo =
      flags.promoCodesEnabled && appliedCode
        ? state.promoCodes.find(
            (p) => p.code === appliedCode && p.active && (p.scope === 'all' || p.scope === phId)
          )
        : null;
    const discount = promo ? Math.round(((subtotal * promo.discountPct) / 100) * 100) / 100 : 0;
    const deliveryFee = rows.length > 0 && selectedPh ? selectedPh.deliveryFee : 0;
    const grandTotal = Math.max(0, Math.round((subtotal - discount + deliveryFee) * 100) / 100);
    return { rows, subtotal, discount, deliveryFee, grandTotal, promo };
  }, [state, selectedPh, appliedCode, flags.promoCodesEnabled]);

  const addrValid = state.customerAddress.trim().length >= 6;
  const phoneValid = isValidEgyptianMobile(state.customerPhone);
  const canCheckout =
    Boolean(selectedPh) &&
    cartSummary.rows.length > 0 &&
    (!flags.mandatoryContactAutoReveal || (addrValid && phoneValid));

  const updateCartItem = (cartKey: string, patch: { qty?: number; unit?: RetailUnit }) => {
    updateState((prev) => ({
      ...prev,
      cart: prev.cart
        .map((c) => {
          if (c.cartKey !== cartKey) return c;
          const nextQty = patch.qty !== undefined ? patch.qty : c.qty;
          const nextUnit = patch.unit !== undefined ? patch.unit : c.unit;
          return { ...c, qty: nextQty, unit: nextUnit, cartKey: `${c.medId}__${nextUnit}` };
        })
        .filter((c) => c.qty > 0),
    }));
  };

  const handleConfirmPurchase = () => {
    if (!canCheckout || !selectedPh) return;
    const newOrderId = `DW-${9050 + state.orders.length}`;
    const defaultCourier = state.couriers.find((c) => c.pharmacyId === selectedPh.id)?.id || '';
    const patientName = user?.displayName || user?.email?.split('@')[0] || 'عميل دوايا';

    updateState((prev) => {
      const updatedPromos = cartSummary.promo
        ? prev.promoCodes.map((p) =>
            p.code === cartSummary.promo!.code ? { ...p, usedCount: p.usedCount + 1 } : p
          )
        : prev.promoCodes;

      const newOrder = {
        id: newOrderId,
        patientName,
        patientUid: user?.uid,
        pharmacyId: selectedPh.id,
        pharmacyName: selectedPh.name,
        courierId: defaultCourier,
        items: cartSummary.rows.map((r) => ({
          medId: r.medId,
          medName: r.medName,
          unit: r.unit,
          qty: r.qty,
          unitPrice: r.unitPrice,
          returnedQty: 0,
        })),
        total: cartSummary.grandTotal,
        collectedCash: cartSummary.grandTotal,
        status: 'pending' as const,
        deducted: false,
        savedAddress: prev.customerAddress.trim(),
        savedPhone: prev.customerPhone.trim(),
        locationRevealed: false,
        returnNote: '',
        time: 'الآن',
        chat: [
          {
            sender: 'patient' as const,
            text: `تم إرسال الطلب من العربة بإجمالي ${cartSummary.grandTotal} ج.م كاش. سيظهر العنوان ورقم الموبايل تلقائيًا عند موافقة الصيدلية.`,
            time: 'الآن',
          },
        ],
      };

      return {
        ...prev,
        cart: [],
        promoCodes: updatedPromos,
        orders: [newOrder, ...prev.orders],
      };
    });
    setAppliedCode('');
    setPromoInput('');
    setActiveTab('orders');
    notify(`تم تأكيد الشراء وإرسال الطلب ${newOrderId} بنجاح`);
  };

  if (!flags.shoppingAndCartEnabled) {
    return (
      <main className="wrap narrow" dir="rtl" style={{ paddingBlock: '24px' }}>
        <div
          className="card"
          style={{
            background: '#0D1F38',
            color: '#FFFFFF',
            borderRadius: '20px',
            padding: '28px',
            borderBottom: '4px solid #138866',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <UnslopIcon name="lock" size={20} color="#CFD29D" />
            <h1 style={{ margin: 0, fontSize: '1.2rem' }}>الطلب والشراء أونلاين غير مفعّل حاليًا</h1>
          </div>
          <p style={{ margin: '0 0 14px', color: '#CBD5E1', fontSize: '0.88rem' }}>
            يمكنك تصفح موسوعة الأدوية والبدائل والأسعار الرسمية بحرية.
          </p>
          <Link
            to="/medicines"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#138866',
              color: '#FFFFFF',
              padding: '9px 16px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '0.84rem',
            }}
          >
            <UnslopIcon name="pill" size={15} />
            <span>الانتقال إلى موسوعة الأدوية</span>
          </Link>
        </div>
      </main>
    );
  }

  const rx = state.rxThreads[0] || null;

  return (
    <main className="wrap" dir="rtl" style={{ paddingBlock: '20px', maxWidth: '920px' }}>
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 90,
            background: '#0D1F38',
            color: '#FFFFFF',
            borderRight: '4px solid #138866',
            padding: '12px 18px',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 14px 30px rgba(0,0,0,0.28)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Clean Header */}
      <section
        style={{
          background: '#0D1F38',
          color: '#FFFFFF',
          borderRadius: '22px',
          padding: '20px',
          borderBottom: '4px solid #138866',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>عربة التسوق وطلباتي</h1>
            <p style={{ margin: '4px 0 0', color: '#CBD5E1', fontSize: '0.82rem' }}>
              تظهر هنا فقط الأدوية التي أضفتها من موسوعة الأدوية — الدفع كاش عند الاستلام.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(
              [
                { id: 'cart', label: `العربة (${state.cart.length})`, icon: 'cart' },
                { id: 'orders', label: `طلباتي (${state.orders.length})`, icon: 'filetext' },
                ...(flags.rxChatEnabled ? [{ id: 'rx', label: 'الروشتات', icon: 'camera' }] : []),
                ...(flags.promoCodesEnabled ? [{ id: 'inbox', label: `رسائلي (${state.customerInbox.length})`, icon: 'bell' }] : []),
              ] as Array<{ id: 'cart' | 'orders' | 'rx' | 'inbox'; label: string; icon: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 13px',
                  borderRadius: '12px',
                  border: activeTab === tab.id ? '1.5px solid #CFD29D' : '1px solid rgba(255,255,255,0.18)',
                  background: activeTab === tab.id ? '#138866' : 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <UnslopIcon name={tab.icon} size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TAB 1: PURE CART ONLY (ZERO SAMPLE MEDICINES) */}
      {activeTab === 'cart' && (
        <section className="card" style={{ padding: '20px', borderRadius: '20px', display: 'grid', gap: '16px' }}>
          {/* Pharmacy Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              الصيدلية المختارة لتنفيذ الطلب:
            </label>
            {state.pharmacies.length > 0 ? (
              <SmartChoiceSelect
                value={selectedPh?.id || ''}
                onChange={(val) => updateState((prev) => ({ ...prev, selectedPharmacyId: val }))}
                options={state.pharmacies.map((p) => ({
                  value: p.id,
                  label: `${p.name} — ${p.city} (توصيل ${p.deliveryFee === 0 ? 'مجاني' : `${p.deliveryFee} ج.م`})`,
                }))}
                modalTitle="اختر الصيدلية"
              />
            ) : (
              <div style={{ padding: '12px', borderRadius: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: '0.82rem', fontWeight: 700 }}>
                لم يتم إضافة صيدليات شريكة بعد — يمكنك تجميع أدويتك في العربة لحين تفعيل أول صيدلية من لوحة الأدمن.
              </div>
            )}
          </div>

          {/* Cart Items */}
          {cartSummary.rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: '#F8FAFC', borderRadius: '16px', border: '1.5px dashed #CBD5E1', display: 'grid', gap: '12px', justifyItems: 'center' }}>
              <UnslopIcon name="cart" size={32} color="#94A3B8" />
              <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0D1F38' }}>عربة التسوق فارغة حاليًا</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                ابحث عن الأدوية التي تحتاجها واضغط «أضف للعربة» لتظهر هنا تلقائيًا.
              </div>
              <Link
                to="/medicines"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: '#138866',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                }}
              >
                <UnslopIcon name="search" size={15} />
                <span>تصفح الأدوية وإضافة للعربة</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {cartSummary.rows.map((r) => (
                <div
                  key={r.cartKey}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0D1F38' }}>{r.medName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {r.qty} {COMMERCE_UNIT_LABELS[r.unit]} × {r.unitPrice} ج.م ={' '}
                        <strong style={{ color: '#0097A7' }}>{r.lineTotal} ج.م</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateCartItem(r.cartKey, { qty: 0 })}
                      style={{ border: 'none', background: '#FFE4E6', color: '#BE123C', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
                      aria-label="حذف"
                    >
                      <UnslopIcon name="trash" size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(
                        [
                          { id: 'box' as RetailUnit, ok: true },
                          { id: 'strip' as RetailUnit, ok: flags.unitRetailEnabled && r.calc.allowStrip },
                          { id: 'tablet' as RetailUnit, ok: flags.unitRetailEnabled && r.calc.allowTablet },
                        ]
                      )
                        .filter((u) => u.ok)
                        .map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => updateCartItem(r.cartKey, { unit: u.id })}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: r.unit === u.id ? '1.5px solid #138866' : '1px solid #CBD5E1',
                              background: r.unit === u.id ? '#138866' : '#FFFFFF',
                              color: r.unit === u.id ? '#FFFFFF' : '#0D1F38',
                            }}
                          >
                            {COMMERCE_UNIT_LABELS[u.id]}
                          </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => updateCartItem(r.cartKey, { qty: r.qty - 1 })}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <strong style={{ minWidth: '28px', textAlign: 'center', fontSize: '0.84rem' }}>{r.qty}</strong>
                      <button
                        type="button"
                        onClick={() => updateCartItem(r.cartKey, { qty: r.qty + 1 })}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Promo Code */}
          {flags.promoCodesEnabled && cartSummary.rows.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="أدخل كود الخصم إن وجد..."
                style={{ flex: 1, border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '9px 12px', fontSize: '0.82rem', fontWeight: 800 }}
              />
              <button
                type="button"
                onClick={() => {
                  const code = promoInput.trim().toUpperCase();
                  const match = state.promoCodes.find(
                    (p) => p.code === code && p.active && (p.scope === 'all' || p.scope === selectedPh?.id)
                  );
                  if (!match) {
                    notify('كود الخصم غير صالح');
                    return;
                  }
                  if (match.usedCount >= match.maxUsesPerUser) {
                    notify(`انتهى الحد الأقصى لاستخدام الكود ${code}`);
                    return;
                  }
                  setAppliedCode(match.code);
                  notify(`تم تفعيل الكود ${match.code} بخصم ${match.discountPct}%`);
                }}
                style={{ background: '#0D1F38', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
              >
                تطبيق
              </button>
            </div>
          )}

          {/* Mandatory Address & Mobile Phone */}
          {cartSummary.rows.length > 0 && (
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                border: addrValid && phoneValid ? '1.5px solid #A7F3D0' : '1.5px solid #FDA4AF',
                background: addrValid && phoneValid ? '#ECFDF5' : '#FFF1F2',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.82rem', color: '#0D1F38' }}>
                <UnslopIcon name="map_pin" size={15} color="#138866" />
                <span>العنوان ورقم الموبايل (إلزامي لإتمام الشراء)</span>
              </div>
              <input
                type="text"
                value={state.customerAddress}
                onChange={(e) => updateState((prev) => ({ ...prev, customerAddress: e.target.value }))}
                placeholder="المنطقة والشارع ورقم العمارة والدور..."
                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '9px 12px', fontSize: '0.82rem', fontWeight: 700, background: '#FFFFFF' }}
              />
              <input
                type="tel"
                dir="ltr"
                value={state.customerPhone}
                onChange={(e) => updateState((prev) => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="010xxxxxxxx"
                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '9px 12px', fontSize: '0.82rem', fontWeight: 700, background: '#FFFFFF' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: addrValid && phoneValid ? '#065F46' : '#9F1239' }}>
                <UnslopIcon name="lock" size={13} />
                <span>
                  {addrValid && phoneValid
                    ? 'بياناتك محمية بالخصوصية ولا تظهر للصيدلية أو المندوب إلا أوتوماتيك عند موافقة الصيدلية.'
                    : 'لا يمكن إتمام الطلب بدون إدخال العنوان بالتفصيل ورقم موبايل مصري صحيح (11 رقم).'}
                </span>
              </div>
            </div>
          )}

          {/* Totals & Confirm Button */}
          {cartSummary.rows.length > 0 && (
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'grid', gap: '6px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: 700 }}>
                <span>إجمالي الأدوية</span>
                <span>{cartSummary.subtotal} ج.م</span>
              </div>
              {cartSummary.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#138866', fontWeight: 800 }}>
                  <span>خصم الكوبون ({cartSummary.promo?.code})</span>
                  <span>-{cartSummary.discount} ج.م</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: 700 }}>
                <span>التوصيل</span>
                <span>{cartSummary.deliveryFee === 0 ? 'مجاني' : `${cartSummary.deliveryFee} ج.م`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: '#0D1F38', paddingTop: '4px' }}>
                <span>الصافي كاش</span>
                <span style={{ color: '#0097A7' }}>{cartSummary.grandTotal} ج.م</span>
              </div>
              <button
                type="button"
                disabled={!canCheckout}
                onClick={handleConfirmPurchase}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: canCheckout ? 'pointer' : 'not-allowed',
                  background: canCheckout ? '#138866' : '#E2E8F0',
                  color: canCheckout ? '#FFFFFF' : '#64748B',
                }}
              >
                {!selectedPh
                  ? 'لا توجد صيدلية شريكة مفعّلة بعد'
                  : !canCheckout
                    ? 'أكمل العنوان ورقم الموبايل لتأكيد الشراء'
                    : `تأكيد الشراء وإرسال الطلب (${cartSummary.grandTotal} ج.م كاش)`}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: REAL ORDERS ONLY */}
      {activeTab === 'orders' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          {state.orders.length === 0 ? (
            <div className="card" style={{ padding: '28px', textAlign: 'center', color: '#64748B', fontWeight: 700, borderRadius: '18px' }}>
              لا توجد طلبات مسجلة حتى الآن.
            </div>
          ) : (
            state.orders.map((ord) => {
              const badge = STATUS_BADGE[ord.status] || STATUS_BADGE.pending;
              return (
                <div key={ord.id} className="card" style={{ padding: '18px', borderRadius: '18px', display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0D1F38' }}>
                        {ord.id} — {ord.pharmacyName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {ord.items.map((i) => `${i.medName} (${i.qty} ${COMMERCE_UNIT_LABELS[i.unit]})`).join(' + ')}
                      </div>
                    </div>
                    <span style={{ padding: '5px 12px', borderRadius: '10px', fontWeight: 800, fontSize: '0.76rem', background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', fontWeight: 700, padding: '10px 12px', borderRadius: '12px', background: ord.locationRevealed ? '#ECFDF5' : '#FFFBEB', color: ord.locationRevealed ? '#065F46' : '#92400E' }}>
                    {ord.locationRevealed
                      ? `تم إظهار عنوانك ورقمك تلقائيًا فور موافقة الصيدلية: ${ord.savedAddress} — ${ord.savedPhone}`
                      : 'عنوانك ورقم موبايلك محفوظان بخصوصية وسيظهران تلقائيًا فور موافقة الصيدلية.'}
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '10px', border: '1px solid #E2E8F0', display: 'grid', gap: '6px' }}>
                    {ord.chat.map((m, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', color: '#0D1F38' }}>
                        <strong>{m.sender === 'patient' ? 'أنت:' : 'الصيدلية:'}</strong> {m.text}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <input
                        type="text"
                        value={orderChatDraft}
                        onChange={(e) => setOrderChatDraft(e.target.value)}
                        placeholder="اكتب رسالة للصيدلية..."
                        style={{ flex: 1, border: '1px solid #CBD5E1', borderRadius: '10px', padding: '7px 10px', fontSize: '0.8rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const txt = orderChatDraft.trim();
                          if (!txt) return;
                          updateState((prev) => ({
                            ...prev,
                            orders: prev.orders.map((o) =>
                              o.id === ord.id ? { ...o, chat: [...o.chat, { sender: 'patient', text: txt, time: 'الآن' }] } : o
                            ),
                          }));
                          setOrderChatDraft('');
                        }}
                        style={{ background: '#0D1F38', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '7px 14px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        إرسال
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: REAL RX THREADS ONLY */}
      {activeTab === 'rx' && flags.rxChatEnabled && (
        !rx ? (
          <div className="card" style={{ padding: '28px', textAlign: 'center', color: '#64748B', fontWeight: 700, borderRadius: '18px' }}>
            لا توجد روشتات مرسلة للتسعير حاليًا.
          </div>
        ) : (
          <div className="card" style={{ padding: '18px', borderRadius: '18px', display: 'grid', gap: '10px' }}>
            <strong style={{ color: '#0D1F38' }}>شات الروشتة ({rx.id})</strong>
            <div style={{ display: 'grid', gap: '6px' }}>
              {rx.messages.map((m, idx) => (
                <div key={idx} style={{ padding: '9px 12px', borderRadius: '10px', fontSize: '0.8rem', background: m.sender === 'patient' ? '#138866' : '#F1F5F9', color: m.sender === 'patient' ? '#FFFFFF' : '#0D1F38' }}>
                  <strong>{m.sender === 'patient' ? 'أنت:' : 'الصيدلي:'}</strong> {m.text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" value={rxChatDraft} onChange={(e) => setRxChatDraft(e.target.value)} placeholder="اكتب للصيدلي..." style={{ flex: 1, border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem' }} />
              <button
                type="button"
                onClick={() => {
                  const txt = rxChatDraft.trim();
                  if (!txt) return;
                  updateState((prev) => ({
                    ...prev,
                    rxThreads: prev.rxThreads.map((t, i) => (i === 0 ? { ...t, messages: [...t.messages, { sender: 'patient', text: txt, time: 'الآن' }] } : t)),
                  }));
                  setRxChatDraft('');
                }}
                style={{ background: '#0D1F38', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                إرسال
              </button>
            </div>
          </div>
        )
      )}

      {/* TAB 4: REAL VIP INBOX ONLY */}
      {activeTab === 'inbox' && flags.promoCodesEnabled && (
        state.customerInbox.length === 0 ? (
          <div className="card" style={{ padding: '28px', textAlign: 'center', color: '#64748B', fontWeight: 700, borderRadius: '18px' }}>
            لا توجد رسائل أو أكواد خصم جديدة حاليًا.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {state.customerInbox.map((msg) => (
              <div key={msg.id} className="card" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', border: '1px solid #A7F3D0' }}>
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#138866' }}>{msg.from} — {msg.time}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0D1F38' }}>{msg.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>{msg.body}</div>
                </div>
                {msg.code && (
                  <button
                    type="button"
                    onClick={() => {
                      setPromoInput(msg.code!);
                      setAppliedCode(msg.code!);
                      setActiveTab('cart');
                      notify(`تم تطبيق كود الخصم ${msg.code} في العربة`);
                    }}
                    style={{ background: '#0D1F38', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    تطبيق الكود {msg.code} في العربة
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </main>
  );
}
