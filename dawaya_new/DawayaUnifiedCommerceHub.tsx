import React, { useMemo, useState } from 'react';
import { useAuth } from './authContext';
import { SmartChoiceSelect } from './SmartChoiceSelect';
import { UnslopIcon } from './UnslopIcons';
import {
  COMMERCE_CATALOG_SEED,
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

  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'rx' | 'inbox'>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [unitSelections, setUnitSelections] = useState<Record<string, { unit: RetailUnit; qty: number }>>({});
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
    () => state.pharmacies.find((p) => p.id === state.selectedPharmacyId) || state.pharmacies[0],
    [state.pharmacies, state.selectedPharmacyId]
  );

  const filteredMeds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COMMERCE_CATALOG_SEED;
    return COMMERCE_CATALOG_SEED.filter(
      (m) => m.nameAr.includes(q) || m.nameEn.toLowerCase().includes(q) || m.ing.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const cartSummary = useMemo(() => {
    const rows = state.cart.map((ci) => {
      const calc = computeUnitPricing(state, selectedPh.id, ci.medId);
      const unitPrice = ci.unit === 'box' ? calc.boxPrice : ci.unit === 'strip' ? calc.stripPrice : calc.tabletPrice;
      const lineTotal = Math.round(unitPrice * ci.qty * 100) / 100;
      return { ...ci, unitPrice, lineTotal };
    });
    const subtotal = Math.round(rows.reduce((s, r) => s + r.lineTotal, 0) * 100) / 100;
    const promo =
      flags.promoCodesEnabled && appliedCode
        ? state.promoCodes.find(
            (p) => p.code === appliedCode && p.active && (p.scope === 'all' || p.scope === selectedPh.id)
          )
        : null;
    const discount = promo ? Math.round(((subtotal * promo.discountPct) / 100) * 100) / 100 : 0;
    const deliveryFee = rows.length > 0 ? selectedPh.deliveryFee : 0;
    const grandTotal = Math.max(0, Math.round((subtotal - discount + deliveryFee) * 100) / 100);
    return { rows, subtotal, discount, deliveryFee, grandTotal, promo };
  }, [state, selectedPh, appliedCode, flags.promoCodesEnabled]);

  const addrValid = state.customerAddress.trim().length >= 6;
  const phoneValid = isValidEgyptianMobile(state.customerPhone);
  const canCheckout =
    cartSummary.rows.length > 0 && (!flags.mandatoryContactAutoReveal || (addrValid && phoneValid));

  const addToCart = (medId: string, medName: string, requestedUnit?: RetailUnit, qtyOverride?: number) => {
    const calc = computeUnitPricing(state, selectedPh.id, medId);
    const sel = unitSelections[medId] || { unit: 'box' as RetailUnit, qty: 1 };
    let unit: RetailUnit = flags.unitRetailEnabled ? requestedUnit || sel.unit : 'box';
    if (unit === 'tablet' && !calc.allowTablet) unit = calc.allowStrip ? 'strip' : 'box';
    if (unit === 'strip' && !calc.allowStrip) unit = 'box';
    const qty = qtyOverride || sel.qty;
    const cartKey = `${medId}__${unit}`;

    updateState((prev) => {
      const existing = prev.cart.find((c) => c.cartKey === cartKey);
      const nextCart = existing
        ? prev.cart.map((c) => (c.cartKey === cartKey ? { ...c, qty: c.qty + qty } : c))
        : [...prev.cart, { cartKey, medId, medName, unit, qty }];
      return { ...prev, cart: nextCart };
    });
    notify(`تمت إضافة ${qty} ${COMMERCE_UNIT_LABELS[unit]} من ${medName} إلى العربة`);
  };

  const handleConfirmPurchase = () => {
    if (!canCheckout) return;
    const newOrderId = `DW-${9050 + state.orders.length}`;
    const defaultCourier = state.couriers.find((c) => c.pharmacyId === selectedPh.id)?.id || '';
    const patientName = user?.displayName || user?.email?.split('@')[0] || 'عميل دوايا';

    updateState((prev) => {
      const updatedPromos = cartSummary.promo
        ? prev.promoCodes.map((p) => (p.code === cartSummary.promo!.code ? { ...p, usedCount: p.usedCount + 1 } : p))
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
      <main className="wrap" dir="rtl" style={{ paddingBlock: '24px' }}>
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
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>دليل دوايا الشامل للأدوية والبدائل</h1>
          </div>
          <p style={{ margin: 0, color: '#CBD5E1', fontSize: '0.9rem' }}>
            الطلب والشراء أونلاين موقوفان حاليًا من إعدادات إدارة المنصة. يمكنك تصفح الأدوية والأسعار والبدائل بحرية.
          </p>
        </div>
      </main>
    );
  }

  const rx = state.rxThreads[0];
  const rxActiveLines = rx.items.filter((ln) => ln.included);
  const rxTotal = rxActiveLines.reduce((sum, ln) => {
    const m = COMMERCE_CATALOG_SEED.find((x) => x.id === ln.medId);
    return sum + (m ? m.basePrice * ln.qty : 0);
  }, 0);

  return (
    <main className="wrap" dir="rtl" style={{ paddingBlock: '20px', maxWidth: '1220px' }}>
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

      {/* Header Banner */}
      <section
        style={{
          background: '#0D1F38',
          color: '#FFFFFF',
          borderRadius: '22px',
          padding: '22px',
          borderBottom: '4px solid #138866',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>العربة والطلبات والشات المباشر مع الصيدلية</h1>
            <p style={{ margin: '4px 0 0', color: '#CBD5E1', fontSize: '0.84rem' }}>
              جمّع أدويتك بالعلبة أو الشريط أو الحباية في العربة، وأكّد الشراء كاش عند الاستلام مع خصوصية تامة لعنوانك ورقمك.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(
              [
                { id: 'shop', label: `الأدوية والعربة (${state.cart.length})`, icon: 'cart' },
                { id: 'orders', label: `طلباتي (${state.orders.length})`, icon: 'filetext' },
                ...(flags.rxChatEnabled ? [{ id: 'rx', label: 'شات وتسعير الروشتة', icon: 'camera' }] : []),
                ...(flags.promoCodesEnabled ? [{ id: 'inbox', label: `رسائلي (${state.customerInbox.length})`, icon: 'bell' }] : []),
              ] as Array<{ id: 'shop' | 'orders' | 'rx' | 'inbox'; label: string; icon: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: activeTab === tab.id ? '1.5px solid #CFD29D' : '1px solid rgba(255,255,255,0.18)',
                  background: activeTab === tab.id ? '#138866' : 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <UnslopIcon name={tab.icon} size={15} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTab === 'shop' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', alignItems: 'start' }}>
          {/* Catalog + Pharmacy Picker */}
          <div style={{ display: 'grid', gap: '14px' }}>
            <div className="card" style={{ padding: '14px', display: 'grid', gap: '10px', borderRadius: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '6px 12px', background: '#FFFFFF' }}>
                <UnslopIcon name="search" size={16} color="#138866" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الدواء أو المادة الفعالة..."
                  style={{ width: '100%', border: 'none', outline: 'none', fontWeight: 700, fontSize: '0.88rem', color: '#0D1F38' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  اختر الصيدلية لمتابعة الأسعار والتوصيل والتوفر:
                </label>
                <SmartChoiceSelect
                  value={selectedPh.id}
                  onChange={(val) => updateState((prev) => ({ ...prev, selectedPharmacyId: val }))}
                  options={state.pharmacies.map((p) => ({
                    value: p.id,
                    label: `${p.name} — ${p.city} (توصيل ${p.deliveryFee === 0 ? 'مجاني' : `${p.deliveryFee} ج.م`})`,
                  }))}
                  modalTitle="اختر الصيدلية"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredMeds.map((med) => {
                const inv = state.inventories[selectedPh.id]?.[med.id] || { outOfStock: false };
                const alt = med.altId ? COMMERCE_CATALOG_SEED.find((x) => x.id === med.altId) : null;
                const calc = computeUnitPricing(state, selectedPh.id, med.id, med.basePrice);
                const sel = unitSelections[med.id] || { unit: 'box' as RetailUnit, qty: 1 };
                let activeUnit: RetailUnit = flags.unitRetailEnabled ? sel.unit : 'box';
                if (activeUnit === 'tablet' && !calc.allowTablet) activeUnit = calc.allowStrip ? 'strip' : 'box';
                if (activeUnit === 'strip' && !calc.allowStrip) activeUnit = 'box';
                const unitPrice = activeUnit === 'box' ? calc.boxPrice : activeUnit === 'strip' ? calc.stripPrice : calc.tabletPrice;

                return (
                  <div
                    key={med.id}
                    className="card"
                    style={{
                      padding: '16px',
                      borderRadius: '18px',
                      border: inv.outOfStock ? '1.5px solid #FDA4AF' : '1px solid #E2E8F0',
                      background: inv.outOfStock ? '#FFF1F2' : '#FFFFFF',
                      display: 'grid',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0D1F38', fontSize: '0.96rem' }}>{med.nameAr}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          {med.nameEn} — {med.ing} ({calc.stripsPerBox} شريط × {calc.tabsPerStrip} حباية)
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          background: inv.outOfStock ? '#FFE4E6' : '#ECFEFF',
                          color: inv.outOfStock ? '#9F1239' : '#0E7490',
                        }}
                      >
                        {inv.outOfStock ? 'غير متوفر حاليًا' : `العلبة ${calc.boxPrice} ج.م`}
                      </span>
                    </div>

                    {inv.outOfStock ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#FFFFFF', padding: '10px', borderRadius: '12px', border: '1px solid #FECDD3' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9F1239' }}>
                          هذا الصنف غير متوفر حاليًا في {selectedPh.name}
                        </span>
                        {alt && (
                          <button
                            type="button"
                            onClick={() => addToCart(alt.id, alt.nameAr, 'box', 1)}
                            style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '7px 12px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            أضف البديل المتوفر: {alt.nameAr} ({alt.basePrice} ج.م)
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                          {(
                            [
                              { id: 'box' as RetailUnit, label: `علبة (${calc.boxPrice} ج.م)`, ok: true },
                              { id: 'strip' as RetailUnit, label: `شريط (${calc.stripPrice} ج.م)`, ok: flags.unitRetailEnabled && calc.allowStrip },
                              { id: 'tablet' as RetailUnit, label: `حباية (${calc.tabletPrice} ج.م)`, ok: flags.unitRetailEnabled && calc.allowTablet },
                            ]
                          ).map((u) =>
                            u.ok ? (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => setUnitSelections((p) => ({ ...p, [med.id]: { unit: u.id, qty: sel.qty } }))}
                                style={{
                                  padding: '7px 6px',
                                  borderRadius: '10px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  border: activeUnit === u.id ? '1.5px solid #138866' : '1px solid #CBD5E1',
                                  background: activeUnit === u.id ? '#138866' : '#F8FAFC',
                                  color: activeUnit === u.id ? '#FFFFFF' : '#0D1F38',
                                }}
                              >
                                {u.label}
                              </button>
                            ) : (
                              <div key={u.id} style={{ padding: '7px 6px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: '#F1F5F9', color: '#94A3B8', textAlign: 'center' }}>
                                غير متاح
                              </div>
                            )
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setUnitSelections((p) => ({ ...p, [med.id]: { unit: activeUnit, qty: Math.max(1, sel.qty - 1) } }))}
                              style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                            >
                              -
                            </button>
                            <span style={{ minWidth: '58px', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                              {sel.qty} {COMMERCE_UNIT_LABELS[activeUnit]}
                            </span>
                            <button
                              type="button"
                              onClick={() => setUnitSelections((p) => ({ ...p, [med.id]: { unit: activeUnit, qty: sel.qty + 1 } }))}
                              style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(med.id, med.nameAr, activeUnit, sel.qty)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#0D1F38',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '11px',
                              padding: '9px 14px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            <UnslopIcon name="cart" size={14} />
                            <span>أضف للعربة ({Math.round(unitPrice * sel.qty * 100) / 100} ج.م)</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unified Cart & Mandatory Contact Gate */}
          <aside className="card" style={{ padding: 0, borderRadius: '20px', overflow: 'hidden', border: '2px solid #0D1F38', position: 'sticky', top: '86px' }}>
            <div style={{ background: '#0D1F38', color: '#FFFFFF', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.94rem' }}>
                <UnslopIcon name="cart" size={17} color="#CFD29D" />
                <span>عربة التسوق ({cartSummary.rows.length} صنف)</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#CFD29D', fontWeight: 700 }}>الدفع كاش عند الاستلام</span>
            </div>

            <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
              {cartSummary.rows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 8px', color: '#64748B', fontSize: '0.84rem', fontWeight: 700 }}>
                  العربة فارغة حاليًا — أضف الأدوية التي تحتاجها من القائمة لتأكيد الشراء مرة واحدة.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {cartSummary.rows.map((r) => (
                    <div key={r.cartKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0D1F38' }}>{r.medName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                          {r.qty} {COMMERCE_UNIT_LABELS[r.unit]} × {r.unitPrice} ج.م = <strong style={{ color: '#0097A7' }}>{r.lineTotal} ج.م</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateState((prev) => ({ ...prev, cart: prev.cart.filter((x) => x.cartKey !== r.cartKey) }))}
                        style={{ border: 'none', background: '#FFE4E6', color: '#BE123C', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        aria-label="حذف من العربة"
                      >
                        <UnslopIcon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {flags.promoCodesEnabled && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="كود الخصم (مثال: VIP15 أو DAWAYA10)"
                    style={{ flex: 1, border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem', fontWeight: 800 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const code = promoInput.trim().toUpperCase();
                      const match = state.promoCodes.find((p) => p.code === code && p.active && (p.scope === 'all' || p.scope === selectedPh.id));
                      if (!match) {
                        notify('كود الخصم غير صالح لهذه الصيدلية');
                        return;
                      }
                      if (match.usedCount >= match.maxUsesPerUser) {
                        notify(`انتهى الحد الأقصى لاستخدام الكود ${code}`);
                        return;
                      }
                      setAppliedCode(match.code);
                      notify(`تم تفعيل الكود ${match.code} بخصم ${match.discountPct}%`);
                    }}
                    style={{ background: '#0D1F38', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    تطبيق
                  </button>
                </div>
              )}

              {/* Mandatory Address & Phone Block */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  border: addrValid && phoneValid ? '1.5px solid #A7F3D0' : '1.5px solid #FDA4AF',
                  background: addrValid && phoneValid ? '#ECFDF5' : '#FFF1F2',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#0D1F38' }}>
                  <UnslopIcon name="map_pin" size={14} color="#138866" />
                  <span>العنوان ورقم الموبايل (إلزامي لإتمام الشراء)</span>
                </div>
                <input
                  type="text"
                  value={state.customerAddress}
                  onChange={(e) => updateState((prev) => ({ ...prev, customerAddress: e.target.value }))}
                  placeholder="المنطقة والشارع ورقم العمارة والدور..."
                  style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem', fontWeight: 700, background: '#FFFFFF' }}
                />
                <input
                  type="tel"
                  dir="ltr"
                  value={state.customerPhone}
                  onChange={(e) => updateState((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="010xxxxxxxx"
                  style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem', fontWeight: 700, background: '#FFFFFF' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: addrValid && phoneValid ? '#065F46' : '#9F1239' }}>
                  <UnslopIcon name="lock" size={13} />
                  <span>
                    {addrValid && phoneValid
                      ? 'بياناتك محمية بالخصوصية ولا تظهر للصيدلية أو المندوب إلا أوتوماتيك عند موافقة الصيدلية.'
                      : 'لا يمكن إتمام الطلب بدون إدخال العنوان بالتفصيل ورقم موبايل مصري صحيح (11 رقم).'}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', display: 'grid', gap: '6px', fontSize: '0.82rem' }}>
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
                  <span>التوصيل ({selectedPh.name})</span>
                  <span>{cartSummary.deliveryFee === 0 ? 'مجاني' : `${cartSummary.deliveryFee} ج.م`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#0D1F38', paddingTop: '4px' }}>
                  <span>الصافي كاش</span>
                  <span style={{ color: '#0097A7' }}>{cartSummary.grandTotal} ج.م</span>
                </div>

                <button
                  type="button"
                  disabled={!canCheckout}
                  onClick={handleConfirmPurchase}
                  style={{
                    marginTop: '6px',
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: canCheckout ? 'pointer' : 'not-allowed',
                    background: canCheckout ? '#138866' : '#E2E8F0',
                    color: canCheckout ? '#FFFFFF' : '#64748B',
                  }}
                >
                  {cartSummary.rows.length === 0
                    ? 'أضف أدوية للعربة أولاً'
                    : !canCheckout
                      ? 'أكمل العنوان ورقم الموبايل لتأكيد الشراء'
                      : `تأكيد الشراء وإرسال الطلب (${cartSummary.grandTotal} ج.م كاش)`}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          {state.orders.length === 0 ? (
            <div className="card" style={{ padding: '28px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
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
                        placeholder="اكتب رسالة للصيدلية حول هذا الطلب..."
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

      {activeTab === 'rx' && flags.rxChatEnabled && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px', borderRadius: '18px', display: 'grid', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#0D1F38' }}>تسعيرة الروشتة التفصيلية ({rx.id}) — بدّل أي صنف للأوفر</h2>
            {rx.items.map((ln) => {
              const med = COMMERCE_CATALOG_SEED.find((x) => x.id === ln.medId);
              const alt = med?.altId ? COMMERCE_CATALOG_SEED.find((x) => x.id === med.altId) : null;
              if (!med) return null;
              const sav = alt ? med.basePrice - alt.basePrice : 0;
              return (
                <div key={ln.lineId} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', opacity: ln.included ? 1 : 0.5, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{med.nameAr}</div>
                    {alt && ln.included && rx.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            rxThreads: prev.rxThreads.map((t, i) =>
                              i === 0 ? { ...t, items: t.items.map((it) => (it.lineId === ln.lineId ? { ...it, medId: alt.id } : it)) } : t
                            ),
                          }))
                        }
                        style={{ marginTop: '4px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '4px 8px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        {sav > 0 ? `بدّل للأوفر: ${alt.nameAr} (${alt.basePrice} ج.م — وفر ${sav} ج.م)` : `العودة إلى: ${alt.nameAr}`}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#0097A7' }}>{med.basePrice} ج.م</strong>
                    {rx.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            rxThreads: prev.rxThreads.map((t, i) =>
                              i === 0 ? { ...t, items: t.items.map((it) => (it.lineId === ln.lineId ? { ...it, included: !it.included } : it)) } : t
                            ),
                          }))
                        }
                        style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 8px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', background: '#FFFFFF' }}
                      >
                        {ln.included ? 'إلغاء' : 'إعادة'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
              <strong>الإجمالي: {rxTotal} ج.م</strong>
              {rx.status !== 'approved' ? (
                <button
                  type="button"
                  onClick={() => {
                    rxActiveLines.forEach((ln) => {
                      const m = COMMERCE_CATALOG_SEED.find((x) => x.id === ln.medId);
                      if (m) addToCart(m.id, m.nameAr, 'box', ln.qty);
                    });
                    updateState((prev) => ({
                      ...prev,
                      rxThreads: prev.rxThreads.map((t, i) => (i === 0 ? { ...t, status: 'approved' } : t)),
                    }));
                    setActiveTab('shop');
                    notify('تمت إضافة أصناف الروشتة المعتمدة إلى العربة لإتمام الشراء');
                  }}
                  style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  موافق — أضف الروشتة للعربة
                </button>
              ) : (
                <span style={{ color: '#138866', fontWeight: 800, fontSize: '0.82rem' }}>تمت الموافقة ونقلها للعربة</span>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '18px', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ fontWeight: 800, color: '#0D1F38' }}>شات مباشر مع الصيدلي</div>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
              {rx.messages.map((m, idx) => (
                <div key={idx} style={{ padding: '10px', borderRadius: '12px', fontSize: '0.8rem', background: m.sender === 'patient' ? '#138866' : '#F1F5F9', color: m.sender === 'patient' ? '#FFFFFF' : '#0D1F38' }}>
                  <strong>{m.sender === 'patient' ? 'أنت:' : 'الصيدلي:'}</strong> {m.text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={rxChatDraft}
                onChange={(e) => setRxChatDraft(e.target.value)}
                placeholder="اكتب للصيدلي..."
                style={{ flex: 1, border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem' }}
              />
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
        </div>
      )}

      {activeTab === 'inbox' && flags.promoCodesEnabled && (
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
                    setActiveTab('shop');
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
      )}
    </main>
  );
}
