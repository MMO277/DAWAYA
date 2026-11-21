import React, { useState } from 'react';
import { UnslopIcon } from './UnslopIcons';
import {
  COMMERCE_UNIT_LABELS,
  DawayaCommerceOrder,
  unitsToBaseTablets,
  useDawayaCommerce,
} from './dawayaCommerceStore';

export default function DawayaCourierPortal() {
  const { state, updateState } = useDawayaCommerce();
  const [returnOrder, setReturnOrder] = useState<DawayaCommerceOrder | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('العميل أرجع جزء من الطلب عند التسليم');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3400);
  };

  if (!state.featureFlags.deliveryAndCourierEnabled) {
    return (
      <main className="wrap narrow" dir="rtl" style={{ paddingBlock: '28px' }}>
        <div className="card" style={{ padding: '24px', borderRadius: '18px', textAlign: 'center' }}>
          <UnslopIcon name="lock" size={24} color="#64748B" />
          <h2 style={{ margin: '10px 0 6px' }}>نظام المناديب متوقف حاليًا</h2>
          <p className="small muted">تم إخفاء شاشة مناديب التوصيل مؤقتًا من لوحة تحكم الأدمن.</p>
        </div>
      </main>
    );
  }

  const deliveries = state.orders.filter((o) => o.status !== 'pending');

  const confirmReturn = () => {
    if (!returnOrder) return;
    let totalRet = 0;
    let totalOrd = 0;
    let retVal = 0;
    const labels: string[] = [];

    updateState((prev) => {
      const nextInventories = { ...prev.inventories };
      const phInv = { ...(nextInventories[returnOrder.pharmacyId] || {}) };
      const nextLedger = [...(prev.stockLedger[returnOrder.pharmacyId] || [])];

      const updatedItems = returnOrder.items.map((it) => {
        totalOrd += it.qty;
        const rq = Math.min(it.qty, Math.max(0, Number(returnQtys[it.medId]) || 0));
        if (rq > 0) {
          totalRet += rq;
          retVal += it.unitPrice * rq;
          labels.push(`${it.medName} (${rq} ${COMMERCE_UNIT_LABELS[it.unit]})`);
          const existing = phInv[it.medId] || { shelfUnits: 0, warehouseBoxes: 0, outOfStock: false };
          const addTabs = unitsToBaseTablets(prev, returnOrder.pharmacyId, it.medId, it.unit, rq);
          phInv[it.medId] = { ...existing, shelfUnits: existing.shelfUnits + addTabs, outOfStock: false };
          nextLedger.unshift({
            id: `mv-ret-${Date.now()}-${it.medId}`,
            type: 'return',
            medName: it.medName,
            delta: `+${rq} ${COMMERCE_UNIT_LABELS[it.unit]} (مرتجع)`,
            note: `مرتجع طلب ${returnOrder.id}: ${returnReason}`,
            time: 'الآن',
          });
        }
        return { ...it, returnedQty: rq };
      });

      if (totalRet === 0) return prev;
      nextInventories[returnOrder.pharmacyId] = phInv;
      const netCash = Math.max(0, Math.round((returnOrder.total - retVal) * 100) / 100);
      const nextStatus = totalRet >= totalOrd ? 'returned' : 'partial_return';

      return {
        ...prev,
        inventories: nextInventories,
        stockLedger: { ...prev.stockLedger, [returnOrder.pharmacyId]: nextLedger },
        orders: prev.orders.map((o) =>
          o.id === returnOrder.id
            ? {
                ...o,
                items: updatedItems,
                collectedCash: netCash,
                status: nextStatus,
                returnNote: `${labels.join(' + ')} — ${returnReason}`,
              }
            : o
        ),
      };
    });

    setReturnOrder(null);
    notify('تم تسجيل المرتجع وردّ الكمية تلقائيًا إلى رصيد الرف بالصيدلية');
  };

  return (
    <main className="wrap narrow" dir="rtl" style={{ paddingBlock: '22px', maxWidth: '860px' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 90, background: '#0D1F38', color: '#FFFFFF', borderRight: '4px solid #0097A7', padding: '12px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '0.84rem' }}>
          {toast}
        </div>
      )}

      <div style={{ background: '#0D1F38', color: '#FFFFFF', borderRadius: '20px', padding: '20px', borderBottom: '4px solid #0097A7', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <UnslopIcon name="truck" size={24} color="#CFD29D" />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>شاشة مندوب التوصيل</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#CBD5E1' }}>
            تظهر هنا الطلبات المعتمدة من الصيدلية مع عنوان ورقم العميل تلقائيًا لتسهيل الاستلام والتوصيل والمرتجعات.
          </p>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontWeight: 700, borderRadius: '18px' }}>
          لا توجد طلبات جاهزة للتوصيل حاليًا — سيظهر الطلب هنا فور موافقة الصيدلية وتجهيزه.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {deliveries.map((o) => (
            <div key={o.id} className="card" style={{ padding: '18px', borderRadius: '18px', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0D1F38' }}>
                    {o.id} — العميل: {o.patientName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {o.items.map((it) => `${it.medName} (${it.qty} ${COMMERCE_UNIT_LABELS[it.unit]})`).join(' + ')}
                  </div>
                </div>
                <strong style={{ color: '#0097A7', fontSize: '1rem' }}>{o.collectedCash} ج.م كاش</strong>
              </div>

              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#065F46' }}>
                  العنوان: {o.savedAddress || 'غير متوفر'}
                </div>
                {o.savedPhone && (
                  <a
                    href={`tel:${o.savedPhone}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0D1F38', color: '#FFFFFF', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem' }}
                  >
                    <UnslopIcon name="phone" size={14} />
                    <span dir="ltr">{o.savedPhone}</span>
                  </a>
                )}
              </div>

              {o.returnNote && (
                <div style={{ background: '#F3E8FF', color: '#6B21A8', padding: '8px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  تفاصيل المرتجع: {o.returnNote}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {o.status === 'ready' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateState((prev) => ({
                        ...prev,
                        orders: prev.orders.map((ord) => (ord.id === o.id ? { ...ord, status: 'picked_up' } : ord)),
                      }));
                      notify(`تم تسجيل استلام الطلب ${o.id} من الصيدلية`);
                    }}
                    style={{ flex: 1, background: '#0097A7', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '11px', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer' }}
                  >
                    تم استلام الطلب من الصيدلية
                  </button>
                )}

                {o.status === 'picked_up' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        updateState((prev) => ({
                          ...prev,
                          orders: prev.orders.map((ord) => (ord.id === o.id ? { ...ord, status: 'delivered' } : ord)),
                        }));
                        notify(`تم التوصيل والاستلام الكامل للطلب ${o.id}`);
                      }}
                      style={{ flex: 1, background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '11px', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      تم التوصيل بالكامل ({o.collectedCash} ج.م)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnOrder(o);
                        const init: Record<string, number> = {};
                        o.items.forEach((it, idx) => { init[it.medId] = idx === 0 ? 1 : 0; });
                        setReturnQtys(init);
                      }}
                      style={{ flex: 1, background: '#FFF1F2', color: '#BE123C', border: '1.5px solid #FDA4AF', borderRadius: '12px', padding: '11px', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      يوجد مرتجع (علبة أو أكثر)
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {returnOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.72)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '20px', borderRadius: '20px', display: 'grid', gap: '12px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#BE123C' }}>تسجيل مرتجع للطلب {returnOrder.id}</strong>
              <button type="button" onClick={() => setReturnOrder(null)} style={{ border: 'none', background: 'transparent', fontWeight: 800, cursor: 'pointer' }}>✕</button>
            </div>
            {returnOrder.items.map((it) => (
              <div key={it.medId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem' }}>{it.medName}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>المطلوب: {it.qty} {COMMERCE_UNIT_LABELS[it.unit]}</div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={it.qty}
                  value={returnQtys[it.medId] ?? 0}
                  onChange={(e) => setReturnQtys((p) => ({ ...p, [it.medId]: Math.max(0, Number(e.target.value) || 0) }))}
                  style={{ width: '64px', textAlign: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '6px', fontWeight: 800 }}
                />
              </div>
            ))}
            <input
              type="text"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="سبب المرتجع..."
              style={{ border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.82rem', fontWeight: 700 }}
            />
            <button
              type="button"
              onClick={confirmReturn}
              style={{ background: '#BE123C', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '11px', fontWeight: 800, cursor: 'pointer' }}
            >
              تأكيد المرتجع وردّ الكمية للمخزون تلقائيًا
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
