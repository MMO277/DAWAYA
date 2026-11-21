import React, { useMemo, useState } from 'react';

export interface EdaSpecificCounterfeitAlert {
  keywords: string[];
  titleAr: string;
  titleEn: string;
  originalSignsAr: string[];
  originalSignsEn: string[];
  counterfeitRedFlagsAr: string[];
  counterfeitRedFlagsEn: string[];
}

export const EDA_SPECIFIC_COUNTERFEIT_ALERTS: EdaSpecificCounterfeitAlert[] = [
  {
    keywords: ['augmentin', 'اوجمنتين', 'أوجمنتين', 'curam', 'كورام', 'hibiotic', 'هايبوتك', 'megamox', 'ميجاموكس', 'amoxicillin'],
    titleAr: 'تنبيه فحص الأصالة لمضادات الأموكسيسيلين وكلافولانيك (معايير هيئة الدواء المصرية)',
    titleEn: 'EDA Authenticity Inspection for Amoxicillin/Clavulanate Packages',
    originalSignsAr: [
      'الأقراص محفوظة داخل كيس ألومنيوم عازل للرطوبة (Foil Pouch) محكم الغلق ومعه كيس مجفف (Desiccant) في العبوات الأصلية.',
      'رقم التشغيلة (Batch) وتاريخ الصلاحية محفوران بالليزر/الحفر البارز على الكرتونة ومطابقان تماماً للمطبوع على شريط الألومنيوم.',
      'الأقراص صلبة متجانسة اللون، أو بودرة الشراب بيضاء انسيابية غير متكتلة قبل الحل بالماء.',
    ],
    originalSignsEn: [
      'Tablets are sealed inside a moisture-barrier aluminum foil pouch with a desiccant sachet in original packs.',
      'Batch number and expiry date are laser-etched/embossed on the outer carton and match the inner blister strip.',
      'Tablets are firm and uniform; suspension powder is free-flowing and unclumped prior to reconstitution.',
    ],
    counterfeitRedFlagsAr: [
      'اختلاف رقم التشغيلة بين العلبة الخارجية والشريط الداخلي (علامة إعادة تعبئة أو غش تجاري).',
      'انتفاخ شريط الألومنيوم أو تفتت القرص أو اصفرار البودرة نتيجة تسرب الرطوبة.',
      'بهتان حبر تاريخ الصلاحية عند مسحه بقطنة مبللة بالكحول الطبي.',
    ],
    counterfeitRedFlagsEn: [
      'Mismatch between outer carton batch number and inner blister strip batch number.',
      'Swollen blister pockets, crumbling tablets, or yellowed clumped powder.',
      'Expiry date ink smudges easily when wiped with an alcohol swab.',
    ],
  },
  {
    keywords: ['zithromax', 'زيثروماكس', 'azithromycin', 'ازيثرومايسين', 'أزيثرومايسين', 'zithrone', 'زيثرون', 'delzosin', 'دلزوسين'],
    titleAr: 'فحص علامات العبوة الأصلية لمستحضرات الأزيثرومايسين (Zithromax & Generics)',
    titleEn: 'EDA Authenticity Check for Azithromycin Preparations',
    originalSignsAr: [
      'العلبة الأصلية تتميز بطباعة حادة وعلامة المثلث الفضي/الفسفوري اللامع (في زيثروماكس الأصلي) مع حروف برايل بارزة.',
      'تطابق تام لرقم التشغيلة (Lot) وتاريخ الانتهاء بين الكرتونة وشريط الكبسولات/الأقراص أو زجاجة الشراب.',
    ],
    originalSignsEn: [
      'Crisp carton printing with metallic/lime triangle emblem (on original Zithromax) and raised Braille dots.',
      'Exact match of Lot number and expiry date between outer carton and inner blister/bottle.',
    ],
    counterfeitRedFlagsAr: [
      'طباعة باهتة أو غياب البروز الملموس لحروف البرايل على وجه العلبة.',
      'وجود كشط أو ملصق ورقي فوق تاريخ الصلاحية الأصلي.',
    ],
    counterfeitRedFlagsEn: [
      'Blurry carton print or flat, non-embossed Braille dots.',
      'Scratched-out expiry dates or paper stickers pasted over original batch numbers.',
    ],
  },
  {
    keywords: ['rocephin', 'روسيفين', 'ceftriaxone', 'سيفترياكسون', 'unasyn', 'يوناسين', 'cefotax', 'سيفوتاكس', 'سيلبيرازون', 'sulperazon'],
    titleAr: 'فحص صارم لأمبولات وفيالات الحقن (منشورات يقظة هيئة الدواء المصرية)',
    titleEn: 'Strict Vial & Ampoule Authenticity Check (EDA Pharmacovigilance)',
    originalSignsAr: [
      'غطاء الفيال البلاستيكي/المعدني (Flip-off Cap) مختوم بإحكام من المصنع ولم يسبق فتحه أو إعادة كبسه.',
      'تطابق رقم التشغيلة على ملصق زجاجة الفيال وأمبول المذيب (الليدوكايين/الماء) مع الكرتونة الخارجية.',
      'المسحوق الجاف داخل الفيال متجانس وخالٍ من أي شوائب، وبعد الحل يكون المحلول رائقاً تماماً.',
    ],
    originalSignsEn: [
      'Factory flip-off cap is tightly sealed with zero signs of tampering or re-crimping.',
      'Batch number on vial label and solvent ampoule matches the outer box.',
      'Dry powder is uniform and free of foreign particles; reconstituted solution is crystal clear.',
    ],
    counterfeitRedFlagsAr: [
      'تحذير خطير: وجود عكارة أو رواسب بعد الحل، أو اختلاف رقم التشغيلة بين الزجاجة والعلبة.',
      'سهولة دوران الغطاء المعدني للفيال أو وجود آثار خدوش حول عنق الزجاجة.',
    ],
    counterfeitRedFlagsEn: [
      'Critical warning: Cloudiness/precipitates after mixing, or mismatched batch numbers between vial and box.',
      'Loose metal crimp ring or scratch marks around the vial neck.',
    ],
  },
  {
    keywords: ['concor', 'كونكور', 'plavix', 'بلافيكس', 'lipitor', 'ليبيتور', 'crestor', 'كريستور', 'nexium', 'نيكسيوم', 'controloc', 'كونترولوك', 'panadol', 'بانادول', 'cataflam', 'كتافلام'],
    titleAr: 'فحص أصالة أدوية الأمراض المزمنة والأصناف واسعة الانتشار بالسوق المصري',
    titleEn: 'Authenticity Inspection for High-Demand Chronic & OTC Medications',
    originalSignsAr: [
      'سماكة شريط الألومنيوم متينة والطباعة الخلفية لاسم الدواء والتركيز واضحة وحادة غير متقطعة.',
      'لون القرص وحفر العلامة الدوائية عليه (مثل شكل القلب في كونكور) متطابقان بدقة في كل الأقراص.',
    ],
    originalSignsEn: [
      'Blister foil has sturdy gauge thickness with sharp, unbroken back-print of drug name and strength.',
      'Tablet color and debossed scoring (e.g. heart shape on Concor) are identical across all pills.',
    ],
    counterfeitRedFlagsAr: [
      'اختلاف درجة لون الأقراص داخل نفس الشريط أو غياب خط التقسيم المحفور بدقة.',
      'رقائق ألومنيوم خفيفة جداً تتمزق بسهولة أو مطبوع عليها بحبر يبهت باليد.',
    ],
    counterfeitRedFlagsEn: [
      'Inconsistent tablet tint within the same strip or missing precision score lines.',
      'Flimsy foil backing or ink that rubs off on fingers.',
    ],
  },
];

export function EdaCounterfeitRadarCard({
  medicineNameAr,
  medicineNameEn,
  genericName,
  officialBarcode,
  isAr,
}: {
  medicineNameAr: string;
  medicineNameEn: string;
  genericName?: string;
  officialBarcode?: string | null;
  isAr: boolean;
}) {
  const [boxBatch, setBoxBatch] = useState('');
  const [stripBatch, setStripBatch] = useState('');
  const [inkPassed, setInkPassed] = useState<boolean | null>(null);
  const [sealPassed, setSealPassed] = useState<boolean | null>(null);

  const matchedSpecificAlert = useMemo(() => {
    const hay = `${medicineNameAr} ${medicineNameEn} ${genericName || ''}`.toLowerCase();
    return (
      EDA_SPECIFIC_COUNTERFEIT_ALERTS.find((alert) =>
        alert.keywords.some((kw) => hay.includes(kw.toLowerCase()))
      ) || null
    );
  }, [medicineNameAr, medicineNameEn, genericName]);

  const batchComparisonResult = useMemo(() => {
    const b1 = boxBatch.trim().toUpperCase().replace(/[\s-]/g, '');
    const b2 = stripBatch.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!b1 || !b2) return null;
    return b1 === b2 ? 'match' : 'mismatch';
  }, [boxBatch, stripBatch]);

  const hasRedFlag =
    batchComparisonResult === 'mismatch' || inkPassed === false || sealPassed === false;
  const allVerifiedGreen =
    batchComparisonResult === 'match' && inkPassed === true && sealPassed === true;

  return (
    <section
      className="card stack"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        borderRadius: '18px',
        border: hasRedFlag
          ? '2px solid #dc2626'
          : allVerifiedGreen
          ? '2px solid #10b981'
          : '1.5px solid #0D1F38',
        background: hasRedFlag
          ? 'rgba(220, 38, 38, 0.04)'
          : 'var(--card-bg)',
        padding: '18px 20px',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#0D1F38',
              color: '#CFD29D',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              flexShrink: 0,
            }}
          >
            🛡️
          </div>
          <div>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#059669',
                display: 'block',
              }}
            >
              {isAr
                ? 'رادار هيئة الدواء المصرية لكشف الغش التجاري وفحص العبوة'
                : 'EDA Counterfeit & Package Authenticity Radar'}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.08rem' }}>
              {isAr
                ? `إزاي تتأكد إن عبوة (${medicineNameAr}) أصلية 100% ومش مغشوشة؟`
                : `How to verify (${medicineNameEn}) is 100% authentic`}
            </h2>
          </div>
        </div>

        {officialBarcode && (
          <span
            dir="ltr"
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#047857',
              fontWeight: 800,
              fontSize: '0.78rem',
            }}
          >
            Barcode: {officialBarcode}
          </span>
        )}
      </div>

      {/* Drug-Specific EDA Inspection Guide (if matched) or Universal Guide */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.28)',
          }}
        >
          <b className="small" style={{ color: '#047857', display: 'block', marginBottom: '6px' }}>
            ✅ {isAr ? 'علامات العبوة الأصلية المعتمدة:' : 'Signs of an Authentic Package:'}
          </b>
          <ul className="small" style={{ margin: 0, paddingInlineStart: '18px', lineHeight: 1.6 }}>
            {(matchedSpecificAlert
              ? isAr
                ? matchedSpecificAlert.originalSignsAr
                : matchedSpecificAlert.originalSignsEn
              : isAr
              ? [
                  'تطابق رقم التشغيلة (Batch/Lot) وتاريخ الانتهاء بين الكرتونة الخارجية وحافة شريط الألومنيوم الداخلي.',
                  'حفر تاريخ الصلاحية بالليزر أو البروز الغائر غير القابل للمسح بالكحول.',
                  'وضوح نقاط البرايل البارزة وجودة ألوان الطباعة على الكرتونة.',
                ]
              : [
                  'Exact match of Batch/Lot number and expiry date between outer carton and inner blister strip.',
                  'Laser-etched or embossed expiry date that never smudges with alcohol.',
                  'Crisp printing and raised Braille embossing on the outer box.',
                ]
            ).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'rgba(220, 38, 38, 0.05)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
          }}
        >
          <b className="small" style={{ color: '#b91c1c', display: 'block', marginBottom: '6px' }}>
            🚨 {isAr ? 'علامات الغش التجاري أو إعادة التعبئة (احذرها):' : 'Counterfeit or Repackaging Red Flags:'}
          </b>
          <ul className="small" style={{ margin: 0, paddingInlineStart: '18px', lineHeight: 1.6 }}>
            {(matchedSpecificAlert
              ? isAr
                ? matchedSpecificAlert.counterfeitRedFlagsAr
                : matchedSpecificAlert.counterfeitRedFlagsEn
              : isAr
              ? [
                  'اختلاف رقم التشغيلة المطبوع على الشريط الداخلي عن الرقم الموجود على العلبة من الخارج.',
                  'مسح أو بهتان حبر تاريخ الصلاحية بسهولة باليد أو بمسحة كحول.',
                  'وجود كشط أو ملصق ورقي يغطي السعر أو تاريخ الانتهاء الأصلي.',
                ]
              : [
                  'Different Batch/Lot number on the inner blister strip vs. the outer box.',
                  'Expiry ink rubs off easily with a finger or alcohol wipe.',
                  'Scratched-out areas or paper stickers covering original dates.',
                ]
            ).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interactive 30-Second Box vs. Strip Authenticity Verifier */}
      <div
        style={{
          padding: '14px',
          borderRadius: '14px',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          display: 'grid',
          gap: '10px',
        }}
      >
        <b className="small" style={{ color: 'var(--text)' }}>
          🔍 {isAr ? 'اختبار فحص العبوة التفاعلي في 30 ثانية (قارن العلبة بالشريط الداخلي):' : '30-Second Interactive Box vs. Blister Strip Check:'}
        </b>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          <input
            dir="ltr"
            value={boxBatch}
            onChange={(e) => setBoxBatch(e.target.value)}
            placeholder={isAr ? 'رقم التشغيلة على العلبة (Batch)...' : 'Outer Box Batch #...'}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '0.84rem' }}
          />
          <input
            dir="ltr"
            value={stripBatch}
            onChange={(e) => setStripBatch(e.target.value)}
            placeholder={isAr ? 'رقم التشغيلة على الشريط الداخلي...' : 'Inner Strip Batch #...'}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '0.84rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className={inkPassed === true ? 'btn small' : 'btn small ghost'}
            onClick={() => setInkPassed(true)}
            style={{ borderRadius: '999px', fontSize: '0.78rem' }}
          >
            ✓ {isAr ? 'التاريخ محفور بالليزر ولا يُمسح' : 'Laser date does not smudge'}
          </button>
          <button
            type="button"
            className={inkPassed === false ? 'btn small danger' : 'btn small ghost'}
            onClick={() => setInkPassed(false)}
            style={{ borderRadius: '999px', fontSize: '0.78rem' }}
          >
            ✕ {isAr ? 'الحبر يبهت أو ممسوح' : 'Ink smudges'}
          </button>
          <button
            type="button"
            className={sealPassed === true ? 'btn small' : 'btn small ghost'}
            onClick={() => setSealPassed(true)}
            style={{ borderRadius: '999px', fontSize: '0.78rem' }}
          >
            ✓ {isAr ? 'الشريط والأقراص سليمة' : 'Blister & pills intact'}
          </button>
          <button
            type="button"
            className={sealPassed === false ? 'btn small danger' : 'btn small ghost'}
            onClick={() => setSealPassed(false)}
            style={{ borderRadius: '999px', fontSize: '0.78rem' }}
          >
            ✕ {isAr ? 'الشريط منتفخ أو تالف' : 'Blister damaged'}
          </button>
        </div>

        {hasRedFlag && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#fee2e2',
              border: '1.5px solid #dc2626',
              color: '#991b1b',
              fontWeight: 800,
              fontSize: '0.84rem',
            }}
          >
            🚨{' '}
            {batchComparisonResult === 'mismatch'
              ? isAr
                ? 'تحذير خطير: رقم التشغيلة على الشريط الداخلي مختلف عن العلبة الخارجية! هذه علامة قوية على إعادة التعبئة أو الغش التجاري. لا تتناول الدواء وارجع للصيدلية أو تواصل مع الخط الساخن لهيئة الدواء المصرية (15301).'
                : 'Critical Alert: Inner strip batch number does NOT match outer box! Do not take this medication; report to EDA hotline (15301).'
              : isAr
              ? 'تحذير: وجود بهتان في حبر الصلاحية أو تلف في الشريط يستدعي عدم تناول الدواء ومراجعة الصيدلي أو الخط الساخن لهيئة الدواء المصرية (15301).'
              : 'Warning: Smudged expiry ink or damaged blister detected. Do not use; consult your pharmacist or EDA hotline (15301).'}
          </div>
        )}

        {!hasRedFlag && (batchComparisonResult === 'match' || allVerifiedGreen) && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#dcfce7',
              border: '1.5px solid #10b981',
              color: '#166534',
              fontWeight: 800,
              fontSize: '0.84rem',
            }}
          >
            ✅{' '}
            {isAr
              ? 'تطابق سليم لرقم التشغيلة بين العلبة والشريط الداخلي مع سلامة علامات الفحص الظاهري.'
              : 'Batch numbers match between box and inner strip, and visual authenticity checks passed.'}
          </div>
        )}
      </div>
    </section>
  );
}
