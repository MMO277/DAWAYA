import React, { useState } from 'react';
import SmartChoiceSelect from './SmartChoiceSelect';
import { UnslopIcon } from './UnslopIcons';
import {
  COMMERCE_CATALOG_SEED,
  COMMERCE_UNIT_LABELS,
  computeUnitPricing,
  formatShelfBreakdown,
  unitsToBaseTablets,
  useDawayaCommerce,
} from './dawayaCommerceStore';

export interface DawayaPharmacyOpsSuiteProps {
  /** Strictly isolated pharmacy ID for this tenant (owners see only their bound pharmacy). */
  pharmacyId?: string;
}

export default function DawayaPharmacyOpsSuite({ pharmacyId }: DawayaPharmacyOpsSuiteProps) {
  const { state, updateState } = useDawayaCommerce();
  const activePhId = pharmacyId || state.pharmacies[0]?.id || 'ph-a';
  const ph = state.pharmacies.find((p) => p.id === activePhId) || state.pharmacies[0];

  const [tab, setTab] = useState<'orders' | 'couriers' | 'stock' | 'formula' | 'coupons' | 'settings'>('orders');
  const [formulaMedId, setFormulaMedId] = useState(COMMERCE_CATALOG_SEED[0].id);
  const [receiveMedId, setReceiveMedId] = useState(COMMERCE_CATALOG_SEED[0].id);
  const [receiveQty, setReceiveQty] = useState('10');
  const [receiveDest, setReceiveDest] = useState<'shelf' | 'warehouse'>('shelf');
  const [offlineMedId, setOfflineMedId] = useState(COMMERCE_CATALOG_SEED[0].id);
  const [offlineQty, setOfflineQty] = useState('1');
  const [newCurName, setNewCurName] = useState('');
  const [newCurPhone, setNewCurPhone] = useState('');
  const [newCurArea, setNewCurArea] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoPct, setPromoPct] = useState('10');
  const [promoMax, setPromoMax] = useState('1');
  const [deliveryDraft, setDeliveryDraft] = useState(String(ph?.deliveryFee ?? 0));
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3400);
  };

  if (!ph) return null;

  const myOrders = state.orders.filter((o) => o.pharmacyId === ph.id);
  const myCouriers = state.couriers.filter((c) => c.pharmacyId === ph.id);
  const myLedger = state.stockLedger[ph.id] || [];
  const myPromos = state.promoCodes.filter((p) => p.scope === ph.id);
  const medOptions = COMMERCE_CATALOG_SEED.map((m) => ({ value: m.id, label: m.nameAr }));

  const approveAndRevealOrder = (orderId: string) => {
    updateState((prev) => {
      const target = prev.orders.find((o) => o.id === orderId);
      if (!target) return prev;
      const nextInvs = { ...prev.inventories };
      const phInv = { ...(nextInvs[ph.id] || {}) };
      const nextLedger = [...(prev.stockLedger[ph.id] || [])];

      if (!target.deducted) {
        target.items.forEach((it) => {
          const cur = phInv[it.medId] || { shelfUnits: 0, warehouseBoxes: 0, outOfStock: false };
          const tabs = unitsToBaseTablets(prev, ph.id, it.medId, it.unit, it.qty);
          phInv[it.medId] = { ...cur, shelfUnits: Math.max(0, cur.shelfUnits - tabs) };
          nextLedger.unshift({
            id: `mv-on-${Date.now()}-${it.medId}`,
            type: 'online',
            medName: it.medName,
            delta: `-${it.qty} ${COMMERCE_UNIT_LABELS[it.unit]}`,
            note: `خصم تلقائي — تجهيز طلب ${orderId}`,
            time: 'الآن',
          });
        });
      }
      nextInvs[ph.id] = phInv;

      return {
        ...prev,
        inventories: nextInvs,
        stockLedger: { ...prev.stockLedger, [ph.id]: nextLedger },
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'ready',
                deducted: true,
                locationRevealed: true,
                chat: [
                  ...o.chat,
                  { sender: 'pharmacist', text: 'تم تأكيد وتجهيز الطلب بنجاح وإظهار العنوان للمندوب.', time: 'الآن' },
                ],
              }
            : o
        ),
      };
    });
    notify(`تمت الموافقة على ${orderId} وخصم المخزون وإظهار العنوان والرقم تلقائيًا`);
  };

  const calc = computeUnitPricing(state, ph.id, formulaMedId);

  return (
    <section
      dir="rtl"
      className="card"
      style={{
        padding: '20px',
        borderRadius: '20px',
        border: '1.5px solid #0D1F38',
        background: '#F8FAFC',
        display: 'grid',
        gap: '16px',
        marginBottom: '20px',
      }}
    >
      {toast && (
        <div style={{ background: '#0D1F38', color: '#FFFFFF', borderRight: '4px solid #138866', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.08rem', color: '#0D1F38' }}>
            <UnslopIcon name="building" size={18} color="#138866" />
            <span>جناح تشغيل الصيدلية الموحد — {ph.name}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
            معزول بالكامل على صيدليتك وإشعاراتها فقط (الطلبات، المناديب، الجرد الدقيق، معادلة التجزئة والفرط، الأكواد).
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(
            [
              { id: 'orders', label: `الطلبات (${myOrders.length})`, icon: 'filetext' },
              { id: 'couriers', label: `المناديب (${myCouriers.length})`, icon: 'truck' },
              { id: 'stock', label: 'الجرد والنواقص', icon: 'barcode' },
              { id: 'formula', label: 'معادلة التجزئة والفرط', icon: 'calc' },
              { id: 'coupons', label: 'الأكواد و VIP', icon: 'tag' },
              { id: 'settings', label: 'التوصيل', icon: 'settings' },
            ] as Array<{ id: typeof tab; label: string; icon: string }>
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: tab === t.id ? '1.5px solid #138866' : '1px solid #CBD5E1',
                background: tab === t.id ? '#138866' : '#FFFFFF',
                color: tab === t.id ? '#FFFFFF' : '#0D1F38',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              <UnslopIcon name={t.icon} size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'orders' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {myOrders.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontWeight: 700, background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              لا توجد طلبات أونلاين واردة لصيدليتك حاليًا.
            </div>
          ) : (
            myOrders.map((o) => (
              <div key={o.id} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <strong style={{ color: '#0D1F38' }}>{o.id} — {o.patientName}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {o.items.map((it) => `${it.medName} (${it.qty} ${COMMERCE_UNIT_LABELS[it.unit]})`).join(' + ')} — <strong style={{ color: '#0097A7' }}>{o.collectedCash} ج.م</strong>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: '#F1F5F9', color: '#0D1F38' }}>
                    {o.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', fontWeight: 700, padding: '8px 12px', borderRadius: '10px', background: o.locationRevealed ? '#ECFDF5' : '#F8FAFC', color: o.locationRevealed ? '#065F46' : '#475569', border: '1px solid #E2E8F0' }}>
                  {o.locationRevealed
                    ? `العنوان والرقم (ظهر تلقائيًا): ${o.savedAddress} — موبايل: ${o.savedPhone}`
                    : 'العنوان ورقم العميل مخفيان للخصوصية — يظهران تلقائيًا فور ضغطك موافقة وتجهيز الطلب.'}
                </div>

                {o.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => approveAndRevealOrder(o.id)}
                    style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', width: 'fit-content' }}
                  >
                    موافقة وتجهيز الطلب (خصم تلقائي + إظهار العنوان والرقم)
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'couriers' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #A7F3D0', display: 'grid', gap: '10px' }}>
            <strong style={{ fontSize: '0.88rem', color: '#0D1F38' }}>إضافة مندوب توصيل جديد لصيدليتك</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <input type="text" value={newCurName} onChange={(e) => setNewCurName(e.target.value)} placeholder="اسم المندوب" style={{ border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem' }} />
              <input type="tel" dir="ltr" value={newCurPhone} onChange={(e) => setNewCurPhone(e.target.value)} placeholder="010xxxxxxxx" style={{ border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem' }} />
              <input type="text" value={newCurArea} onChange={(e) => setNewCurArea(e.target.value)} placeholder="نطاق التغطية" style={{ border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem' }} />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!newCurName.trim() || !newCurPhone.trim()) return;
                updateState((prev) => ({
                  ...prev,
                  couriers: [
                    ...prev.couriers,
                    { id: `cur-${Date.now()}`, pharmacyId: ph.id, name: newCurName.trim(), phone: newCurPhone.trim(), area: newCurArea.trim() || ph.city, active: true },
                  ],
                }));
                setNewCurName('');
                setNewCurPhone('');
                setNewCurArea('');
                notify('تمت إضافة المندوب لقائمة الصيدلية بنجاح');
              }}
              style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px 16px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', width: 'fit-content' }}
            >
              إضافة المندوب
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {myCouriers.map((c) => (
              <div key={c.id} style={{ background: '#FFFFFF', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#0097A7', fontWeight: 700 }} dir="ltr">{c.phone}</div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{c.area}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'stock' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #A7F3D0', display: 'grid', gap: '8px' }}>
              <strong style={{ fontSize: '0.84rem' }}>إدخال كميات واردة (توريد علب)</strong>
              <SmartChoiceSelect value={receiveMedId} onChange={setReceiveMedId} options={medOptions} modalTitle="اختر الدواء للتوريد" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" min={1} value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)} style={{ width: '90px', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', fontWeight: 800 }} />
                <SmartChoiceSelect value={receiveDest} onChange={(v) => setReceiveDest(v as 'shelf' | 'warehouse')} options={[{ value: 'shelf', label: 'للرف' }, { value: 'warehouse', label: 'للمخزن' }]} />
              </div>
              <button
                type="button"
                onClick={() => {
                  const qty = Math.max(1, Number(receiveQty) || 1);
                  const med = COMMERCE_CATALOG_SEED.find((m) => m.id === receiveMedId);
                  updateState((prev) => {
                    const c = computeUnitPricing(prev, ph.id, receiveMedId);
                    const cur = prev.inventories[ph.id]?.[receiveMedId] || { shelfUnits: 0, warehouseBoxes: 0, outOfStock: false };
                    const updated = receiveDest === 'shelf' ? { ...cur, shelfUnits: cur.shelfUnits + qty * c.totalTabs, outOfStock: false } : { ...cur, warehouseBoxes: cur.warehouseBoxes + qty, outOfStock: false };
                    return {
                      ...prev,
                      inventories: { ...prev.inventories, [ph.id]: { ...(prev.inventories[ph.id] || {}), [receiveMedId]: updated } },
                      stockLedger: {
                        ...prev.stockLedger,
                        [ph.id]: [{ id: `mv-in-${Date.now()}`, type: 'receive', medName: med?.nameAr || receiveMedId, delta: `+${qty} علبة`, note: 'توريد جديد', time: 'الآن' }, ...(prev.stockLedger[ph.id] || [])],
                      },
                    };
                  });
                  notify(`تم تسجيل توريد +${qty} علبة بنجاح`);
                }}
                style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                تسجيل التوريد
              </button>
            </div>

            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'grid', gap: '8px' }}>
              <strong style={{ fontSize: '0.84rem' }}>خصم بيع أوفلاين (كاشير الصيدلية)</strong>
              <SmartChoiceSelect value={offlineMedId} onChange={setOfflineMedId} options={medOptions} modalTitle="اختر الدواء للخصم الأوفلاين" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" min={1} value={offlineQty} onChange={(e) => setOfflineQty(e.target.value)} style={{ width: '90px', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', fontWeight: 800 }} />
                <button
                  type="button"
                  onClick={() => {
                    const qty = Math.max(1, Number(offlineQty) || 1);
                    const med = COMMERCE_CATALOG_SEED.find((m) => m.id === offlineMedId);
                    updateState((prev) => {
                      const tabs = unitsToBaseTablets(prev, ph.id, offlineMedId, 'strip', qty);
                      const cur = prev.inventories[ph.id]?.[offlineMedId] || { shelfUnits: 0, warehouseBoxes: 0, outOfStock: false };
                      return {
                        ...prev,
                        inventories: { ...prev.inventories, [ph.id]: { ...(prev.inventories[ph.id] || {}), [offlineMedId]: { ...cur, shelfUnits: Math.max(0, cur.shelfUnits - tabs) } } },
                        stockLedger: {
                          ...prev.stockLedger,
                          [ph.id]: [{ id: `mv-off-${Date.now()}`, type: 'offline', medName: med?.nameAr || offlineMedId, delta: `-${qty} شريط`, note: 'بيع أوفلاين (كاشير)', time: 'الآن' }, ...(prev.stockLedger[ph.id] || [])],
                        },
                      };
                    });
                    notify(`تم خصم ${qty} شريط (بيع أوفلاين)`);
                  }}
                  style={{ flex: 1, background: '#0D1F38', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  خصم بيع أوفلاين (شريط)
                </button>
              </div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px' }}>الدواء</th>
                  <th style={{ padding: '10px' }}>رصيد الرف الدقيق</th>
                  <th style={{ padding: '10px' }}>حالة التوفر للعملاء</th>
                </tr>
              </thead>
              <tbody>
                {COMMERCE_CATALOG_SEED.slice(0, 6).map((m) => {
                  const inv = state.inventories[ph.id]?.[m.id] || { shelfUnits: 0, warehouseBoxes: 0, outOfStock: false };
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px', fontWeight: 800 }}>{m.nameAr}</td>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#138866' }}>{formatShelfBreakdown(state, ph.id, m.id)}</td>
                      <td style={{ padding: '10px' }}>
                        <button
                          type="button"
                          onClick={() =>
                            updateState((prev) => ({
                              ...prev,
                              inventories: {
                                ...prev.inventories,
                                [ph.id]: {
                                  ...(prev.inventories[ph.id] || {}),
                                  [m.id]: { ...inv, outOfStock: !inv.outOfStock },
                                },
                              },
                            }))
                          }
                          style={{
                            border: 'none',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            background: inv.outOfStock ? '#FFE4E6' : '#ECFDF5',
                            color: inv.outOfStock ? '#9F1239' : '#065F46',
                          }}
                        >
                          {inv.outOfStock ? 'غير متوفر (نقص)' : 'متوفر للطلب'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {myLedger.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '12px', display: 'grid', gap: '6px' }}>
              <strong style={{ fontSize: '0.82rem' }}>آخر حركات المخزون (توريد / أونلاين / أوفلاين / مرتجع)</strong>
              {myLedger.slice(0, 6).map((mv) => (
                <div key={mv.id} style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '8px', background: '#F8FAFC' }}>
                  <span><strong>{mv.medName}</strong> — {mv.note}</span>
                  <strong style={{ color: mv.type === 'receive' || mv.type === 'return' ? '#138866' : '#0D1F38' }}>{mv.delta}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'formula' && (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #A7F3D0', padding: '16px', display: 'grid', gap: '12px' }}>
          <strong style={{ fontSize: '0.9rem' }}>معادلة التجزئة وزيادة الفرط (الحد الأقصى من الأدمن +{state.maxMarkupCapPct}%)</strong>
          <SmartChoiceSelect value={formulaMedId} onChange={setFormulaMedId} options={medOptions} modalTitle="اختر الدواء" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>سعر العلبة (ج.م)</label>
              <input
                type="number"
                value={calc.boxPrice}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  updateState((prev) => ({
                    ...prev,
                    unitRules: { ...prev.unitRules, [ph.id]: { ...(prev.unitRules[ph.id] || {}), [formulaMedId]: { ...calc, boxPrice: val } } },
                  }));
                }}
                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', fontWeight: 800 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: calc.markupActive ? '#B45309' : '#94A3B8' }}>
                أساس سعر الفرط (حد أقصى {calc.maxAllowedBase})
              </label>
              <input
                type="number"
                disabled={!calc.markupActive}
                value={calc.looseBoxBase}
                onChange={(e) => {
                  const val = Math.max(calc.boxPrice, Number(e.target.value) || calc.boxPrice);
                  updateState((prev) => ({
                    ...prev,
                    unitRules: { ...prev.unitRules, [ph.id]: { ...(prev.unitRules[ph.id] || {}), [formulaMedId]: { ...calc, looseBoxBase: val } } },
                  }));
                }}
                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', fontWeight: 800, background: calc.markupActive ? '#FFFBEB' : '#F1F5F9' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>عدد الشرائط</label>
              <input
                type="number"
                value={calc.stripsPerBox}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  updateState((prev) => ({
                    ...prev,
                    unitRules: { ...prev.unitRules, [ph.id]: { ...(prev.unitRules[ph.id] || {}), [formulaMedId]: { ...calc, stripsPerBox: val } } },
                  }));
                }}
                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', fontWeight: 800 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>حبوب في الشريط</label>
              <input
                type="number"
                value={calc.tabsPerStrip}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  updateState((prev) => ({
                    ...prev,
                    unitRules: { ...prev.unitRules, [ph.id]: { ...(prev.unitRules[ph.id] || {}), [formulaMedId]: { ...calc, tabsPerStrip: val } } },
                  }));
                }}
                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', fontWeight: 800 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#0D1F38', color: '#FFFFFF', padding: '14px', borderRadius: '14px', textAlign: 'center' }}>
            <div><div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>العلبة</div><strong>{calc.boxPrice} ج.م</strong></div>
            <div><div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>الشريط</div><strong style={{ color: '#6EE7B7' }}>{calc.stripPrice} ج.م</strong></div>
            <div><div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>الحباية</div><strong style={{ color: '#67E8F9' }}>{calc.tabletPrice} ج.م</strong></div>
          </div>
        </div>
      )}

      {tab === 'coupons' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'grid', gap: '8px' }}>
            <strong style={{ fontSize: '0.86rem' }}>إنشاء كود خصم خاص بصيدليتك</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px', gap: '6px' }}>
              <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="الكود" style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '7px', fontWeight: 800 }} />
              <input type="number" value={promoPct} onChange={(e) => setPromoPct(e.target.value)} placeholder="%" style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '7px', fontWeight: 800 }} />
              <input type="number" value={promoMax} onChange={(e) => setPromoMax(e.target.value)} placeholder="حد" style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '7px', fontWeight: 800 }} />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!promoCode.trim()) return;
                updateState((prev) => ({
                  ...prev,
                  promoCodes: [...prev.promoCodes, { code: promoCode.trim(), scope: ph.id, ownerLabel: ph.name, discountPct: Math.max(1, Number(promoPct) || 10), maxUsesPerUser: Math.max(1, Number(promoMax) || 1), usedCount: 0, active: true }],
                }));
                setPromoCode('');
                notify('تم إنشاء كود الخصم الخاص بصيدليتك');
              }}
              style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              إنشاء الكود
            </button>
            {myPromos.map((p) => (
              <div key={p.code} style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', borderRadius: '8px' }}>
                <strong>{p.code} ({p.discountPct}%)</strong>
                <span>حد {p.maxUsesPerUser} مرة/عميل</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'grid', gap: '8px', alignContent: 'start' }}>
            <strong style={{ fontSize: '0.86rem' }}>إرسال رسالة كود خصم للعملاء الدائمين (VIP)</strong>
            <button
              type="button"
              onClick={() => {
                const code = myPromos[0]?.code || 'VIP15';
                updateState((prev) => ({
                  ...prev,
                  customerInbox: [{ id: `msg-${Date.now()}`, from: ph.name, title: 'هدية خاصة لعميلنا الدائم', body: `استخدم الكود ${code} في طلبك القادم من ${ph.name}.`, code, time: 'الآن', read: false }, ...prev.customerInbox],
                }));
                notify(`تم إرسال رسالة الكود ${code} إلى صندوق رسائل العملاء الدائمين`);
              }}
              style={{ background: '#0D1F38', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              إرسال كود خصم للعميل الدائم
            </button>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', maxWidth: '420px', display: 'grid', gap: '10px' }}>
          <strong style={{ fontSize: '0.88rem' }}>سعر التوصيل الخاص بـ {ph.name}</strong>
          <input type="number" min={0} value={deliveryDraft} onChange={(e) => setDeliveryDraft(e.target.value)} style={{ border: '1px solid #CBD5E1', borderRadius: '10px', padding: '9px', fontWeight: 800 }} />
          <button
            type="button"
            onClick={() => {
              const fee = Math.max(0, Number(deliveryDraft) || 0);
              updateState((prev) => ({
                ...prev,
                pharmacies: prev.pharmacies.map((x) => (x.id === ph.id ? { ...x, deliveryFee: fee } : x)),
              }));
              notify(`تم تحديث سعر التوصيل إلى ${fee === 0 ? 'مجاني' : `${fee} ج.م`}`);
            }}
            style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            حفظ سعر التوصيل
          </button>
        </div>
      )}
    </section>
  );
}
