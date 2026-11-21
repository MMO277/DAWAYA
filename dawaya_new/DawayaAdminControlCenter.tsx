import React, { useState } from 'react';
import { SmartChoiceSelect } from './SmartChoiceSelect';
import { UnslopIcon } from './UnslopIcons';
import { DawayaFeatureFlags, useDawayaCommerce } from './dawayaCommerceStore';

const MASTER_SWITCHES: Array<{ key: keyof DawayaFeatureFlags; title: string; desc: string }> = [
  { key: 'shoppingAndCartEnabled', title: 'العربة والشراء أونلاين بالموقع', desc: 'إغلاقه يخفي العربة وكل أزرار الشراء ويحول الموقع لدليل أدوية فقط لحين الإطلاق.' },
  { key: 'mandatoryContactAutoReveal', title: 'إلزام العنوان والرقم + الإظهار التلقائي عند الموافقة', desc: 'يمنع الطلب بدون عنوان وموبايل مصري، ويكشفهما للصيدلية والمندوب فور الموافقة.' },
  { key: 'unitRetailEnabled', title: 'البيع بالتجزئة (علبة / شريط / حباية)', desc: 'إظهار أو إخفاء خيارات الشريط والحباية للعملاء.' },
  { key: 'retailMarkupEnabled', title: 'السماح بزيادة سعر التجزئة / الفرط (مثل 130 بدل 120)', desc: 'تمكين الصيدليات المصرح لها من ضبط سعر أعلى للفرط ضمن السقف الأقصى.' },
  { key: 'autoRoundCashEnabled', title: 'تقريب كسور الفرط تلقائيًا لأقرب 0.5 ج.م', desc: 'يمنع القروش الكسرية في الكاش عند المندوب.' },
  { key: 'deliveryAndCourierEnabled', title: 'نظام المناديب وشاشة التوصيل والمرتجعات', desc: 'إظهار أو إخفاء بوابة مناديب التوصيل بالكامل.' },
  { key: 'rxChatEnabled', title: 'شات الروشتة والتسعير التفصيلي بالبدائل', desc: 'إظهار أو إخفاء تصوير الروشتة والتفاوض على البدائل.' },
  { key: 'promoCodesEnabled', title: 'أكواد الخصم ورسائل العملاء الدائمين', desc: 'إظهار أو إخفاء الكوبونات وصندوق رسائل العروض.' },
];

export default function DawayaAdminControlCenter() {
  const { state, updateState } = useDawayaCommerce();
  const [subTab, setSubTab] = useState<'switches' | 'roles' | 'promos'>('switches');
  const [bindEmail, setBindEmail] = useState('');
  const [bindName, setBindName] = useState('');
  const [bindPhId, setBindPhId] = useState(state.pharmacies[0]?.id || 'ph-a');
  const [newPhName, setNewPhName] = useState('');
  const [newPhCity, setNewPhCity] = useState('المنصورة');
  const [admCode, setAdmCode] = useState('');
  const [admPct, setAdmPct] = useState('10');
  const [admMax, setAdmMax] = useState('1');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3400);
  };

  return (
    <section
      dir="rtl"
      className="card"
      style={{
        background: '#0B172A',
        color: '#F1F5F9',
        borderRadius: '22px',
        padding: '20px',
        border: '1.5px solid #1E293B',
        marginBottom: '20px',
        display: 'grid',
        gap: '16px',
      }}
    >
      {toast && (
        <div style={{ background: '#138866', color: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UnslopIcon name="shield" size={20} color="#CFD29D" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.08rem', color: '#CFD29D' }}>التحكم المركزي للمالك — مفاتيح الميزات وربط الصيدليات</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
              أظهر أو اركن أي ميزة قبل الإطلاق، وعيّن صلاحية كل صاحب صيدلية على صيدليته وإشعاراتها فقط.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'switches', label: 'مفاتيح الميزات (8)' },
              { id: 'roles', label: 'ربط صلاحيات الصيدليات' },
              { id: 'promos', label: 'أكواد الأدمن العامة' },
            ] as Array<{ id: typeof subTab; label: string }>
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              style={{
                padding: '8px 13px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                background: subTab === t.id ? '#138866' : '#1E293B',
                color: '#FFFFFF',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'switches' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            {MASTER_SWITCHES.map((sw) => {
              const on = state.featureFlags[sw.key];
              return (
                <div
                  key={sw.key}
                  style={{
                    background: '#0F172A',
                    border: on ? '1.5px solid #138866' : '1px solid #334155',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#FFFFFF' }}>{sw.title}</div>
                    <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>{sw.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateState((prev) => ({
                        ...prev,
                        featureFlags: { ...prev.featureFlags, [sw.key]: !prev.featureFlags[sw.key] },
                      }), true);
                      notify(`تم ${on ? 'إخفاء / ركن' : 'تفعيل'} الميزة على المنصة`);
                    }}
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      background: on ? '#138866' : '#334155',
                      color: '#FFFFFF',
                    }}
                  >
                    {on ? 'مفعّل' : 'مركون / مخفي'}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '16px', display: 'grid', gap: '12px', alignContent: 'start' }}>
            <strong style={{ color: '#CFD29D', fontSize: '0.9rem' }}>تخصيص زيادة الفرط لكل صيدلية</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', padding: '10px 12px', borderRadius: '10px', fontSize: '0.8rem' }}>
              <span>سقف زيادة الفرط الأقصى (%):</span>
              <input
                type="number"
                min={0}
                max={50}
                value={state.maxMarkupCapPct}
                onChange={(e) => updateState((prev) => ({ ...prev, maxMarkupCapPct: Math.max(0, Number(e.target.value) || 0) }), true)}
                style={{ width: '64px', textAlign: 'center', borderRadius: '8px', border: '1px solid #475569', background: '#0B172A', color: '#FFFFFF', fontWeight: 800, padding: '4px' }}
              />
            </div>

            {state.pharmacies.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', background: '#1E293B', padding: '10px 12px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{p.allowLooseMarkup ? 'مسموح بزيادة الفرط' : 'قسمة العلبة فقط'}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateState((prev) => ({
                      ...prev,
                      pharmacies: prev.pharmacies.map((x) => (x.id === p.id ? { ...x, allowLooseMarkup: !x.allowLooseMarkup } : x)),
                    }))
                  }
                  style={{ border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer', background: p.allowLooseMarkup ? '#138866' : '#334155', color: '#FFFFFF' }}
                >
                  {p.allowLooseMarkup ? 'مفعّل' : 'مقفول'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '16px', display: 'grid', gap: '10px' }}>
            <strong style={{ color: '#CFD29D', fontSize: '0.88rem' }}>إعطاء رول «صاحب صيدلية» معزول بصيدليته فقط</strong>
            <input type="text" value={bindName} onChange={(e) => setBindName(e.target.value)} placeholder="اسم صاحب الصيدلية" style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem' }} />
            <input type="email" dir="ltr" value={bindEmail} onChange={(e) => setBindEmail(e.target.value)} placeholder="email@pharmacy.eg" style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '10px', padding: '8px 10px', fontSize: '0.8rem' }} />
            <div style={{ color: '#0D1F38' }}>
              <SmartChoiceSelect
                value={bindPhId}
                onChange={setBindPhId}
                options={[
                  ...state.pharmacies.map((p) => ({ value: p.id, label: `${p.name} (${p.city})` })),
                  { value: '__new__', label: '+ إنشاء صيدلية جديدة وربط الحساب بها الآن' },
                ]}
                modalTitle="اختر الصيدلية المرتبطة"
              />
            </div>
            {bindPhId === '__new__' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px' }}>
                <input type="text" value={newPhName} onChange={(e) => setNewPhName(e.target.value)} placeholder="اسم الصيدلية الجديدة" style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #138866', borderRadius: '10px', padding: '8px', fontSize: '0.8rem' }} />
                <input type="text" value={newPhCity} onChange={(e) => setNewPhCity(e.target.value)} placeholder="المدينة" style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #138866', borderRadius: '10px', padding: '8px', fontSize: '0.8rem' }} />
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (!bindEmail.trim() || !bindName.trim()) {
                  notify('أدخل اسم وإيميل صاحب الصيدلية أولاً');
                  return;
                }
                let targetId = bindPhId;
                if (targetId === '__new__') {
                  if (!newPhName.trim()) {
                    notify('اكتب اسم الصيدلية الجديدة أولاً');
                    return;
                  }
                  targetId = `ph-${Date.now()}`;
                }
                updateState((prev) => ({
                  ...prev,
                  pharmacies:
                    bindPhId === '__new__'
                      ? [...prev.pharmacies, { id: targetId, name: newPhName.trim(), ownerName: bindName.trim(), city: newPhCity.trim() || 'المنصورة', deliveryFee: 10, allowLooseMarkup: true }]
                      : prev.pharmacies,
                  roleBindings: [
                    ...prev.roleBindings,
                    { id: `acc-${Date.now()}`, name: bindName.trim(), email: bindEmail.trim().toLowerCase(), role: 'pharmacy_owner', pharmacyId: targetId },
                  ],
                }));
                setBindName('');
                setBindEmail('');
                setNewPhName('');
                notify('تم ربط الحساب بصيدليته فقط بعزل كامل للإشعارات والبيانات');
              }}
              style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              حفظ الصلاحية وربط الحساب بالصيدلية
            </button>
          </div>

          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '16px', display: 'grid', gap: '8px', alignContent: 'start' }}>
            <strong style={{ fontSize: '0.88rem' }}>سجل الحسابات المرتبطة بالصيدليات</strong>
            {state.roleBindings.map((rb) => {
              const p = state.pharmacies.find((x) => x.id === rb.pharmacyId);
              return (
                <div key={rb.id} style={{ background: '#1E293B', borderRadius: '10px', padding: '10px 12px', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 800 }}>{rb.name} <span style={{ color: '#94A3B8', fontWeight: 500 }}>({rb.email})</span></div>
                  <div style={{ fontSize: '0.74rem', color: '#6EE7B7' }}>معزول على: {p ? p.name : rb.pharmacyId} فقط</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'promos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '16px', display: 'grid', gap: '10px' }}>
            <strong style={{ color: '#CFD29D', fontSize: '0.88rem' }}>إنشاء كود خصم عام لكل الصيدليات</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px', gap: '6px' }}>
              <input type="text" value={admCode} onChange={(e) => setAdmCode(e.target.value.toUpperCase())} placeholder="الكود" style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '8px', padding: '8px', fontWeight: 800 }} />
              <input type="number" value={admPct} onChange={(e) => setAdmPct(e.target.value)} placeholder="%" style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '8px', padding: '8px', fontWeight: 800 }} />
              <input type="number" value={admMax} onChange={(e) => setAdmMax(e.target.value)} placeholder="حد" style={{ background: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '8px', padding: '8px', fontWeight: 800 }} />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!admCode.trim()) return;
                updateState((prev) => ({
                  ...prev,
                  promoCodes: [...prev.promoCodes, { code: admCode.trim(), scope: 'all', ownerLabel: 'الأدمن (كل الصيدليات)', discountPct: Math.max(1, Number(admPct) || 10), maxUsesPerUser: Math.max(1, Number(admMax) || 1), usedCount: 0, active: true }],
                }));
                setAdmCode('');
                notify('تم تفعيل كود الخصم العام على كل الصيدليات');
              }}
              style={{ background: '#138866', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              تفعيل الكود على الكل
            </button>
          </div>
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignContent: 'center', textAlign: 'center' }}>
            <div style={{ background: '#1E293B', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>إجمالي الطلبات</div>
              <strong style={{ fontSize: '1.3rem', color: '#6EE7B7' }}>{state.orders.length}</strong>
            </div>
            <div style={{ background: '#1E293B', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>إجمالي المبيعات</div>
              <strong style={{ fontSize: '1.3rem', color: '#CFD29D' }}>{state.orders.reduce((s, o) => s + o.collectedCash, 0)} ج.م</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
