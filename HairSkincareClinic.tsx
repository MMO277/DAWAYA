import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export type HairTab = 'hair_diff' | 'minoxidil_rules' | 'hair_labs' | 'skin_type_routine' | 'forbidden_mixes' | 'dandruff_nails';

export default function HairSkincareClinic() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<HairTab>('hair_diff');
  const [selectedSkinType, setSelectedSkinType] = useState<'oily' | 'dry' | 'combination'>('oily');

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #86198f 55%, #c026d3 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 700, color: '#fae8ff' }}>
            💇‍♀️ {tr(lang, 'عيادة واستشاري علاج الشعر والصلع الوراثي والبشرة (خبرة 40 عاماً)', 'Senior Trichology, Hair Loss & Clinical Skincare Clinic')}
          </span>
          <Link to="/clinics" className="btn small" style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
            🏥 {tr(lang, 'العودة لمجمع العيادات (20 عيادة)', 'Back to Clinics Hub')}
          </Link>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff' }}>
          {tr(lang, 'عيادة سقوط الشعر، الصلع الوراثي، المينوكسيديل، والروتين العلاجي للبشرة', 'Complete Hair Loss, Minoxidil Protocol & Clinical Skincare Clinic')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.6, maxWidth: '860px' }}>
          {tr(
            lang,
            'التفرقة بين سقوط الشعر التفاعلي والصلع الوراثي، دستور استخدام وسحب المينوكسيديل بأمان، التحاليل الـ 5 الأساسية للشعر، وروتين البشرة الصيدلاني.',
            'Telogen effluvium vs androgenetic alopecia, safe Minoxidil application & weaning, the 5 essential hair labs, and pharmacy skincare routines.'
          )}
        </p>
      </section>

      {/* 6 Navigation Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { id: 'hair_diff', icon: '💇‍♀️', titleAr: '١. مفرّق سقوط الشعر', subAr: 'التفاعلي مقابل الصلع الوراثي' },
          { id: 'minoxidil_rules', icon: '🧴', titleAr: '٢. دستور المينوكسيديل', subAr: 'تساقط أول شهرين وطريقة السحب' },
          { id: 'hair_labs', icon: '🩸', titleAr: '٣. تحاليل الشعر الـ 5', subAr: 'لماذا الفيريتين أهم من الهيموجلوبين؟' },
          { id: 'skin_type_routine', icon: '✨', titleAr: '٤. روتين البشرة الصيدلاني', subAr: 'للدهنية والجافة والمختلطة' },
          { id: 'forbidden_mixes', icon: '⛔', titleAr: '٥. خلطات تدمر البشرة', subAr: 'تعارض الأكرتين وفيتامين C' },
          { id: 'dandruff_nails', icon: '❄️', titleAr: '٦. القشرة الدهنية والثعلبة', subAr: 'الشامبو الطبي وبروتوكول العلاج' },
        ].map((t) => {
          const sel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as HairTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: sel ? '2px solid #c026d3' : '1px solid var(--line)',
                background: sel ? 'linear-gradient(135deg, #0D1F38 0%, #86198f 100%)' : '#ffffff',
                color: sel ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{t.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{t.titleAr}</div>
              <div style={{ fontSize: '0.75rem', opacity: sel ? 0.9 : 0.65 }}>{t.subAr}</div>
            </button>
          );
        })}
      </section>

      {activeTab === 'hair_diff' && (
        <section style={{ display: 'grid', gap: '14px', marginBottom: '28px' }}>
          <div className="card" style={{ borderRadius: '16px', padding: '18px', borderLeft: '5px solid #16a34a' }}>
            <h3 style={{ margin: '0 0 6px', color: '#0D1F38' }}>١. التساقط التفاعلي الكربي (Telogen Effluvium - يعود بالكامل!)</h3>
            <p className="small" style={{ margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
              • **الوصف:** سقوط كثيف ومفاجئ للشعر من كل الرأس بملء المشط واليد، يبدأ دائماً **بعد 3 أشهر من حدث معين**: (بعد الولادة، بعد رجيم قاسٍ، بعد سخونة أو كورونا، بعد صدمة نفسية، أو نقص مخزون الحديد).<br />
              • **الخبر المطمئن:** البصيلات حية تماماً ولا يسبب صلعاً! يعود الشعر لكثافته خلال 4-6 أشهر بمجرد تعويض مخزون الحديد والفيتامينات دون الحاجة للمينوكسيديل مدى الحياة.
            </p>
          </div>
          <div className="card" style={{ borderRadius: '16px', padding: '18px', borderLeft: '5px solid #d97706' }}>
            <h3 style={{ margin: '0 0 6px', color: '#0D1F38' }}>٢. الصلع الوراثي للرجال والسيدات (Androgenetic Alopecia)</h3>
            <p className="small" style={{ margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
              • **الوصف:** لا يقع الشعر فجأة بكثافة، بل **ترق الشعرة وتضعف تدريجياً وتظهر فروة الرأس في مقدمة الرأس وفرق الشعر (Christmas-tree pattern في السيدات)** بينما يظل شعر مؤخرة الرأس الخلفي كثيفاً وقوياً.<br />
              • **العلاج الأساسي:** المينوكسيديل الموضعي + مضادات الأندروجين الموضعية أو الفموية (مثل سبيرونولاكتون للسيدات أو فيناسترايد للرجال بإشراف الطبيب) + جلسات الديرمابن والبلازما.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'minoxidil_rules' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #c026d3' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#86198f' }}>
            🧴 الدستور الكامل للمينوكسيديل (Minoxidil 5% & 2%): أسرار النجاح ومنع تساقط الوجه
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700, color: '#1e293b' }}>
            <li>**١. سر «تساقط أول 4 أسابيع (Dread Shed)»:** في أول شهر من رش المينوكسيديل يزداد سقوط الشعر الضعيف! إياك أن تتوقف وتظن أن البخاخ أضر شعرك؛ المينوكسيديل يدفع الشعرة الميتة لتسقط حتى تخرج مكانها شعرة سميكة قوية في الشهر الثالث!</li>
            <li>**٢. كيف تمنعين ظهور شعر زائد في الجبهة والوجه؟** ضعي 6 بخات على **جلد فروة الرأس الجافة فقط** (وليس على الشعر نفسه)، ودلكي بأصابعك، واغسلي يديكِ بالماء والصابون فوراً، **واستخدمي المينوكسيديل قبل النوم بـ 2 ساعة كاملة** حتى يجف ولا ينتقل للمخدة ثم لوجهكِ أثناء النوم!</li>
            <li>**٣. لو اضطررت لسحب وإيقاف المينوكسيديل (في التساقط غير الوراثي):** ممنوع قطعه فجأة! اسحبه تدريجياً على مدار شهرين (مرة يومياً لمدة أسبوعين ← ثم يوم بعد يوم لمدة أسبوعين ← ثم مرتين أسبوعياً مع استبداله بسيروم كافيين وروزماري وبيبتيد).</li>
          </ul>
        </section>
      )}

      {activeTab === 'hair_labs' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            🩸 التحاليل الـ 5 الإلزامية قبل شراء أي أمبولات أو فيتامينات للشعر
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            ١. **مخزون الحديد (Serum Ferritin):** أهم رقم للشعر على الإطلاق! المعمل يكتب أن الطبيعي من 15، لكن **بصيلة الشعر لا تتوقف عن السقوط وتنبت إلا إذا وصل الفيريتين فوق 50 إلى 70 ng/mL!**<br />
            ٢. **فيتامين د (25-OH Vitamin D):** يجب أن يكون فوق 40 ng/mL.<br />
            ٣. **هرمون الغدة الدرقية (TSH):** كسل أو نشاط الغدة يسبب تساقطاً وتقصفاً شديداً.<br />
            ٤. **مستوى الزنك بالدم (Serum Zinc) وصورة الدم الكاملة (CBC).**
          </p>
        </section>
      )}

      {activeTab === 'skin_type_routine' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            ✨ روتين العناية الطبي الاقتصادي حسب نوع بشرتكِ
          </h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setSelectedSkinType('oily')} className="btn small" style={{ background: selectedSkinType === 'oily' ? '#86198f' : '#fff', color: selectedSkinType === 'oily' ? '#fff' : '#0f172a', fontWeight: 800 }}>البشرة الدهنية والمعرضة للحبوب</button>
            <button type="button" onClick={() => setSelectedSkinType('dry')} className="btn small" style={{ background: selectedSkinType === 'dry' ? '#86198f' : '#fff', color: selectedSkinType === 'dry' ? '#fff' : '#0f172a', fontWeight: 800 }}>البشرة الجافة والحساسة</button>
            <button type="button" onClick={() => setSelectedSkinType('combination')} className="btn small" style={{ background: selectedSkinType === 'combination' ? '#86198f' : '#fff', color: selectedSkinType === 'combination' ? '#fff' : '#0f172a', fontWeight: 800 }}>البشرة المختلطة</button>
          </div>

          {selectedSkinType === 'oily' && (
            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.7 }}>
              • **الغسول:** غسول جل يحتوي على حمض الساليسيليك (Salicylic Acid) لتنظيف المسام الدهنية مرتين يومياً.<br />
              • **المرطب:** أكبر خطأ هو عدم ترطيب البشرة الدهنية فتفرز دهوناً أكثر! استخدمي **جل مائي خفيف خالي من الزيوت (Oil-Free Gel Moisturizer مثل شانه جيل أو سيرافي لوشن أو بانثينول خفيف)**.<br />
              • **واقي الشمس:** نوع **Fluid أو Dry-Touch Gel-Cream** غير لامع.
            </div>
          )}
          {selectedSkinType === 'dry' && (
            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.7 }}>
              • **الغسول:** غسول كريمي خالٍ من الصابون والسلفيت (Hydrating Cream Cleanser).<br />
              • **المرطب:** كريم غني بالسيراميد، الهيالورونيك أسيد، والبانثينول أو زبدة الشيا يوضع على بشرة منداة بالماء.<br />
              • **واقي الشمس:** واقي شمس كريمي مرطب (Cream SPF 50+).
            </div>
          )}
          {selectedSkinType === 'combination' && (
            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.7 }}>
              • منطقة الجبهة والأنف (T-Zone) تعامل معاملة البشرة الدهنية، والخدود تعامل معاملة البشرة العادية/الجافة باستخدام غسول رغوي متوازن ومرطب لوشن خفيف.
            </div>
          )}
        </section>
      )}

      {activeTab === 'forbidden_mixes' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px', border: '2px solid #dc2626', background: '#fef2f2' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
            ⛔ 3 أخطاء تحرق حاجز البشرة عند استخدام كريمات التقشير (الأكرتين / الأدابالين)
          </h2>
          <ul className="small" style={{ margin: 0, paddingRight: '20px', lineHeight: 1.8, fontWeight: 700, color: '#7f1d1d' }}>
            <li>**١. خلط الريتينول (أكرتين أو ديفرين أو ماربالين) مع سيروم فيتامين C أو مقشر أحماض (AHA/BHA) في نفس الوقت:** يسبب التهاباً وحرقاً كيميائياً وتصبغات عكسية! (فيتامين C صباحاً مع واقي الشمس، والأكرتين ليلاً).</li>
            <li>**٢. وضع الأكرتين حول العين أو حول زوايا الفم والأنف أو الخروج به في الشمس أو حرارة فرن المطبخ:** توضع كمية بحجم «حبة البسلة فقط» للوجه كله ليلاً في الظلام وتغسل صباحاً مع وضع مرطب وواقي شمس.</li>
          </ul>
        </section>
      )}

      {activeTab === 'dandruff_nails' && (
        <section className="card" style={{ borderRadius: '16px', padding: '22px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
            ❄️ الطريقة الصحيحة لاستخدام شامبو القشرة الطبي (نيزورال / نيزابكس / سيلينجينا)
          </h2>
          <p className="small" style={{ fontWeight: 600, lineHeight: 1.7 }}>
            • **لماذا لا يعمل شامبو القشرة الطبي مع معظم الناس؟** لأنهم يضعونه ويغسلونه فوراً! الشامبو الطبي المحتوي على (Ketoconazole أو Selenium Sulfide) هو دواء مضاد لفطر الملاسيزيا؛ **يجب تدليك رغوته على جلدة الرأس وتركه لمدة 5 دقائق كاملة بالساعة** قبل شطفه بالماء، مع عدم وضع حمام كريم أو زيوت على فروة الرأس لأن الزيوت تتغذى عليها فطريات القشرة!
          </p>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
