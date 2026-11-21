import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export default function HypoRescuePlan() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [currentGlucose, setCurrentGlucose] = useState<string>('60');
  const [isConscious, setIsConscious] = useState<boolean>(true);

  const glucoseNum = parseFloat(currentGlucose) || 0;
  const isHypo = glucoseNum > 0 && glucoseNum < 70;
  const isSevereHypo = glucoseNum > 0 && glucoseNum < 54;

  return (
    <main className="wrap stack" style={{ paddingTop: '10px' }}>
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #1A2E4C 55%, #dc2626 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #CFD29D',
          boxShadow: '0 12px 34px rgba(13, 31, 56, 0.4)',
        }}
      >
        <div className="head" style={{ marginBottom: '8px' }}>
          <div>
            <span
              className="badge"
              style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 800, marginBottom: '6px' }}
            >
              🚨 {tr(lang, 'خطة طوارئ وإنقاذ لمرضى السكري في مصر', 'Emergency Hypoglycemia Rescue Protocol')}
            </span>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.38rem' }}>
              🩸 {tr(lang, 'خطة إنقاذ هبوط السكر الحاد وقاعدة الـ 15 الذهبية', 'Hypoglycemia Rescue Plan & The Rule of 15')}
            </h1>
          </div>
          <a href="tel:123" className="btn small" style={{ background: '#dc2626', color: '#fff', fontWeight: 800 }}>
            📞 {isAr ? 'الإسعاف (123)' : 'Ambulance (123)'}
          </a>
        </div>

        <p className="small" style={{ color: '#E2E8F0', maxWidth: '78ch', margin: '4px 0 14px' }}>
          {tr(
            lang,
            'إنقاذ حياة فوري لمنع غيبوبة السكر: هبوط السكر (أقل من 70 مجم/دل) أخطر من ارتفاعه وقد يودي بالحياة في دقائق؛ تعلم قاعدة الـ 15 الذهبية والتصرف الصحيح في حال فقدان الوعي.',
            'Hypoglycemia (< 70 mg/dL) is a medical emergency that can lead to coma within minutes. Master the Rule of 15 and life-saving unconscious patient protocols.'
          )}
        </p>

        {/* Glucose Input */}
        <div className="row wrapRow" style={{ gap: '10px', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(207, 210, 157, 0.25)' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="small" style={{ color: '#CFD29D', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              📟 {isAr ? 'قراءة جهاز السكر الحالية (مجم/دل):' : 'Current Blood Glucose (mg/dL):'}
            </label>
            <input
              type="number"
              value={currentGlucose}
              onChange={(e) => setCurrentGlucose(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #CFD29D' }}
            />
          </div>
          <div className="row" style={{ gap: '8px', alignSelf: 'flex-end' }}>
            <button
              type="button"
              className={`btn small ${isConscious ? '' : 'ghost'}`}
              style={isConscious ? { background: '#138866', color: '#fff' } : { color: '#fff', borderColor: '#fff' }}
              onClick={() => setIsConscious(true)}
            >
              👤 {isAr ? 'المريض واعي ويتحدث' : 'Conscious'}
            </button>
            <button
              type="button"
              className={`btn small ${!isConscious ? '' : 'ghost'}`}
              style={!isConscious ? { background: '#dc2626', color: '#fff' } : { color: '#fff', borderColor: '#dc2626' }}
              onClick={() => setIsConscious(false)}
            >
              🚨 {isAr ? 'المريض مغمى عليه / فاقد الوعي' : 'Unconscious'}
            </button>
          </div>
        </div>
      </section>

      {/* Protocol Display */}
      {isConscious ? (
        <section className="card stack" style={{ borderInlineStart: '6px solid #d97706' }}>
          <h2>⚡ {isAr ? 'قاعدة الـ 15 الذهبية لإسعاف المريض الواعي (السكر أقل من 70):' : 'The Golden Rule of 15 (Conscious Patient):'}</h2>
          <div className="grid">
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
              <b style={{ color: '#b45309', fontSize: '1rem' }}>🥤 الخطوة 1: تناول 15 جرام سكر سريع فوراً</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'نصف كوب عصير محلى (تفاح / برتقال) أو 3 ملاعق سكر مذابة بنصف كوب ماء أو نصف علبة مشروب غازي عادي أو 4 أقراص جلوكوز. (تجنب الشوكولاتة لأن دهونها تبطئ امتصاص السكر!).'
                  : '1/2 cup fruit juice, 3 tsp sugar in water, or 1/2 can regular soda. Avoid chocolate as fat delays glucose absorption.'}
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
              <b style={{ color: '#0369a1', fontSize: '1rem' }}>⏱️ الخطوة 2: انتظر 15 دقيقة وأعد القياس</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'استرح تماماً بدون أي حركة لمدة 15 دقيقة ثم قس السكر بالجهاز. إذا كان لا يزال أقل من 70 مجم/دل، كرر الخطوة 1 بتناول 15 جرام سكر أخرى.'
                  : 'Rest for 15 minutes, then re-check blood glucose. If still under 70 mg/dL, repeat Step 1.'}
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
              <b style={{ color: '#15803d', fontSize: '1rem' }}>🥪 الخطوة 3: وجبة خفيفة معقدة لتثبيت السكر</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'بمجرد أن يرتفع السكر فوق 70 مجم/دل، تناول شطيرة صغيرة (جبن وعيش بلدي) لتثبيت السكر ومنع هبوطه مرة أخرى بعد نفاد السكر السريع.'
                  : 'Once glucose rises above 70 mg/dL, eat a small complex carb/protein snack to maintain stable levels.'}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="card stack" style={{ borderInlineStart: '6px solid #dc2626', background: '#fef2f2' }}>
          <h2 style={{ color: '#991b1b', margin: 0 }}>
            🚨 {isAr ? 'بروتوكول الطوارئ الحاسم للمريض فاقد الوعي (غيبوبة هبوط سكر):' : 'Emergency Coma Protocol (Unconscious Patient):'}
          </h2>
          <div className="stack" style={{ gap: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: '#fee2e2', border: '1px solid #fecaca' }}>
              <b style={{ color: '#7f1d1d' }}>⛔ تحذير قاتل: ممنوع تماماً إعطاء أي سوائل أو عصير أو ماء في فم المريض!</b>
              <p className="small" style={{ margin: '4px 0 0', color: '#991b1b' }}>
                {isAr
                  ? 'إعطاء السوائل لشخص فاقد الوعي يتسبب في دخول العصير إلى الرئتين والاختناق والموت الفوري!'
                  : 'Never pour liquids into an unconscious person mouth—it will aspirate into the lungs causing fatal suffocation!'}
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#fff', border: '1px solid #fca5a5' }}>
              <b style={{ color: '#991b1b' }}>💉 1. حقنة الجلوكاجون (GlucaGen HypoKit) في العضل أو الفخذ فوراً</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'إذا كانت متوفرة بالثلاجة، احقن إبرة الجلوكاجون في عضلة الفخذ فوراً لرفع السكر الكبدي خلال 10 دقائق.'
                  : 'Administer Glucagon injection into the thigh muscle immediately if available.'}
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#fff', border: '1px solid #fca5a5' }}>
              <b style={{ color: '#991b1b' }}>🍯 2. دهن عسل نحل أو جل جلوكوز في باطن الخد من الداخل</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'ضع المريض على جنبه (وضع الإفاقة) وافرك ملعقة عسل نحل في باطن الخد واللثة ليمتص من الغشاء المخاطي دون بلع.'
                  : 'Place patient in recovery position and rub honey or glucose gel on the inside of the cheek.'}
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#fee2e2' }}>
              <a href="tel:123" className="btn" style={{ background: '#dc2626', color: '#fff', fontWeight: 800, width: '100%', textAlign: 'center' }}>
                📞 {isAr ? 'اتصل بالإسعاف المصري فوراً (123)' : 'Call Ambulance 123'}
              </a>
            </div>
          </div>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
