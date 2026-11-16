import { FormEvent, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, configured } from './firebase';
import { useAuth } from './authContext';

export interface SubscriptionPlanCard {
  id: string;
  nameAr: string;
  nameEn: string;
  priceAr: string;
  priceEn: string;
  badgeAr?: string;
  badgeEn?: string;
  accent: string;
  featuresAr: string[];
  featuresEn: string[];
  isPaid: boolean;
}

const USER_PLANS: SubscriptionPlanCard[] = [
  {
    id: 'user_free',
    nameAr: 'الباقة الأساسية (مجاناً للأبد)',
    nameEn: 'Basic Plan (Free Forever)',
    priceAr: '0 ج.م',
    priceEn: '0 EGP',
    accent: '#0f766e',
    isPaid: false,
    featuresAr: [
      'البحث الفوري في 26,572+ دواء والبدائل الأرخص',
      'الكارت الطبي الذكي (QR) لملفك الشخصي',
      'فحص الحساسية وتعارضات الأدوية الأساسية',
      'مؤقت صيام رمضان ودليل العيادات الـ 20',
    ],
    featuresEn: [
      'Instant search across 26,572+ medicines & cheaper generics',
      'Personal Smart Medical ID (QR)',
      'Core drug allergy & interaction screening',
      'Ramadan fasting clock & 20 interactive clinics',
    ],
  },
  {
    id: 'user_plus_family',
    nameAr: 'باقة العائلة والذكاء المتقدم (DAWAYA Plus)',
    nameEn: 'DAWAYA Plus Family Plan',
    priceAr: '29 ج.م / شهرياً',
    priceEn: '29 EGP / month',
    badgeAr: 'الأكثر توفيراً للأسرة',
    badgeEn: 'Best for Families',
    accent: '#0284c7',
    isPaid: true,
    featuresAr: [
      'إضافة ملفات طبية مستقلة للأب والأم والأطفال في حساب واحد',
      'قراءة غير محدودة للروشتات والتحاليل بالذكاء الاصطناعي',
      'تقارير PDF شاملة جاهزة للعرض على الطبيب في أي وقت',
      'أولوية التنبيهات الدوائية وحفظ السجل العلاجي الكامل',
    ],
    featuresEn: [
      'Separate medical profiles for parents & kids in one account',
      'Unlimited AI prescription & lab report analysis',
      'Downloadable clinical PDF reports for doctor visits',
      'Priority medication alerts & full treatment timeline',
    ],
  },
];

const PHARMACY_PLANS: SubscriptionPlanCard[] = [
  {
    id: 'pharmacy_free_pilot',
    nameAr: 'باقة الانطلاق التجريبية (مجاناً)',
    nameEn: 'Launch Pilot Plan (Free)',
    priceAr: '0 ج.م (فترة الانطلاق)',
    priceEn: '0 EGP (Launch Period)',
    accent: '#138866',
    isPaid: false,
    featuresAr: [
      'إدراج الصيدلية في دليل القرية والمركز والمحافظة',
      'استقبال اتصالات المرضى ورسائل الواتساب مباشرة',
      'تحديد القرى والعزب التي تغطيها الصيدلية بالتوصيل',
    ],
    featuresEn: [
      'Listed in village, markaz, and governorate directory',
      'Direct phone calls & pre-filled WhatsApp medicine inquiries',
      'Multi-village delivery coverage selection',
    ],
  },
  {
    id: 'pharmacy_pro_featured',
    nameAr: 'باقة الصيدلية الشريكة المميزة (Pro)',
    nameEn: 'Featured Partner Pharmacy (Pro)',
    priceAr: '199 ج.م / شهرياً',
    priceEn: '199 EGP / month',
    badgeAr: 'ظهور أول في منطقتك',
    badgeEn: 'Top Local Ranking',
    accent: '#d97706',
    isPaid: true,
    featuresAr: [
      'ظهور الصيدلية في أول نتائج البحث في مركزك وقريتك بوسم (شريك مميز)',
      'تفعيل استقبال طلبات الروشتات داخل المنصة مع إشعارات فورية',
      'لوحة إحصائيات الطلبات وتحديث أسعار وعروض الصيدلية مباشرة',
    ],
    featuresEn: [
      'Top featured placement in your markaz & villages',
      'In-platform Rx order workflow with instant alerts',
      'Pharmacy analytics, custom offers & live stock highlights',
    ],
  },
];

export function SubscriptionAndPlansPanel({
  audience,
  isAr,
  vodafoneCashNumber = '01098478954',
  instaPayHandle = 'dawaya@instapay',
}: {
  audience: 'user' | 'pharmacy';
  isAr: boolean;
  vodafoneCashNumber?: string;
  instaPayHandle?: string;
}) {
  const { user } = useAuth();
  const plans = audience === 'pharmacy' ? PHARMACY_PLANS : USER_PLANS;
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanCard | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay'>('vodafone_cash');
  const [senderPhoneOrAccount, setSenderPhoneOrAccount] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [entityName, setEntityName] = useState(user?.displayName || '');
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !senderPhoneOrAccount.trim() || !transferRef.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        audience,
        planId: selectedPlan.id,
        planNameAr: selectedPlan.nameAr,
        amountLabel: selectedPlan.priceAr,
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
      } catch { /* ignore */ }

      if (configured && db) {
        await addDoc(collection(db, 'subscription_requests'), {
          ...payload,
          createdAt: serverTimestamp(),
        }).catch(() => {});
      }

      setDoneMsg(
        isAr
          ? 'تم تسجيل طلب الاشتراك بنجاح! سيتم مراجعة التحويل وتفعيل الباقة خلال ساعات.'
          : 'Subscription request logged! Activation will complete after transfer verification.'
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
        border: '2px solid #0284c7',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(236, 253, 245, 0.95) 100%)',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div>
          <span className="badge" style={{ background: '#0284c7', color: '#fff', fontWeight: 800 }}>
            💳 {audience === 'pharmacy'
              ? (isAr ? 'باقات اشتراك الصيدليات الشريكة' : 'Partner Pharmacy Plans')
              : (isAr ? 'باقات دوايا بلس والعائلة' : 'DAWAYA Plus & Family Plans')}
          </span>
          <h2 style={{ margin: '6px 0 2px', fontSize: '1.15rem', color: '#0f172a' }}>
            {audience === 'pharmacy'
              ? (isAr ? 'خطط الظهور المميز للصيدليات (InstaPay / فودافون كاش)' : 'Pharmacy Visibility Plans (InstaPay / Vodafone Cash)')
              : (isAr ? 'اشترك في مزايا العائلة والذكاء الاصطناعي المتقدم' : 'Unlock Family Profiles & Unlimited AI Rx')}
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="card stack"
            style={{
              borderTop: `4px solid ${plan.accent}`,
              background: '#ffffff',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div>
              <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                <strong style={{ color: '#0f172a', fontSize: '1rem' }}>
                  {isAr ? plan.nameAr : plan.nameEn}
                </strong>
                {plan.badgeAr && (
                  <span className="badge" style={{ background: `${plan.accent}20`, color: plan.accent, fontWeight: 800 }}>
                    ⭐ {isAr ? plan.badgeAr : plan.badgeEn}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: plan.accent, margin: '8px 0' }}>
                {isAr ? plan.priceAr : plan.priceEn}
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
                style={{ background: plan.accent, borderColor: plan.accent, color: '#fff', fontWeight: 800 }}
                onClick={() => {
                  setSelectedPlan(plan);
                  setDoneMsg('');
                }}
              >
                🚀 {isAr ? 'اشترك الآن (فودافون كاش / InstaPay)' : 'Subscribe via Vodafone Cash / InstaPay'}
              </button>
            ) : (
              <span className="badge" style={{ background: '#dcfce7', color: '#166534', textAlign: 'center', padding: '8px', fontWeight: 800 }}>
                ✅ {isAr ? 'مفعّلة لك حالياً مجاناً' : 'Active Free Plan'}
              </span>
            )}
          </div>
        ))}
      </div>

      {selectedPlan && (
        <form
          onSubmit={handleSubmitPayment}
          className="card stack"
          style={{ background: '#ffffff', border: `2px solid ${selectedPlan.accent}`, gap: '10px' }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: selectedPlan.accent }}>
              💳 {isAr ? `تفعيل: ${selectedPlan.nameAr} (${selectedPlan.priceAr})` : selectedPlan.nameEn}
            </strong>
            <button type="button" className="btn ghost small" onClick={() => setSelectedPlan(null)}>
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('vodafone_cash')}
              style={{
                flex: '1 1 160px',
                padding: '10px',
                borderRadius: '10px',
                border: paymentMethod === 'vodafone_cash' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                background: paymentMethod === 'vodafone_cash' ? '#fef2f2' : '#f8fafc',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              📱 فودافون كاش ({vodafoneCashNumber})
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('instapay')}
              style={{
                flex: '1 1 160px',
                padding: '10px',
                borderRadius: '10px',
                border: paymentMethod === 'instapay' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                background: paymentMethod === 'instapay' ? '#f5f3ff' : '#f8fafc',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              🏦 إنستا باي InstaPay ({instaPayHandle})
            </button>
          </div>

          {doneMsg ? (
            <div className="notice" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800 }}>
              ✅ {doneMsg}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <input
                className="input"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder={audience === 'pharmacy' ? (isAr ? 'اسم الصيدلية *' : 'Pharmacy Name *') : (isAr ? 'الاسم الكامل *' : 'Full Name *')}
                required
              />
              <input
                className="input"
                value={senderPhoneOrAccount}
                onChange={(e) => setSenderPhoneOrAccount(e.target.value)}
                placeholder={isAr ? 'الرقم أو الحساب المحوّل منه *' : 'Sender Phone / IPA *'}
                required
              />
              <input
                className="input"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder={isAr ? 'رقم العملية / المرجع *' : 'Transaction Reference *'}
                required
              />
              <button type="submit" className="btn small" disabled={submitting} style={{ background: selectedPlan.accent, color: '#fff', fontWeight: 800 }}>
                {submitting ? '...' : (isAr ? 'إرسال تأكيد التحويل ✅' : 'Submit Payment Confirmation')}
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
