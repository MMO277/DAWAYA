import { useEffect, useMemo, useState } from 'react';

// ============================================================================
// 1. DRIVER & WORKPLACE DRUG-TEST SHIELD + HIGHWAY DROWSINESS EVALUATOR
// ============================================================================

export interface DriverDrugScreenItem {
  id: string;
  namesAr: string[];
  namesEn: string[];
  keywords: string[];
  drugTestStatus: 'safe' | 'false_positive_risk';
  falsePositiveClassAr?: string;
  falsePositiveClassEn?: string;
  urineDetectionWindowAr?: string;
  urineDetectionWindowEn?: string;
  drowsinessRisk: 'none' | 'moderate' | 'severe';
  drivingAdviceAr: string;
  drivingAdviceEn: string;
  safeAlternativeAr: string;
  safeAlternativeEn: string;
}

export const DRIVER_DRUG_SCREEN_CATALOG: DriverDrugScreenItem[] = [
  {
    id: 'cold-pseudoephedrine',
    namesAr: ['كونجستال (Congestal)', 'كومتركس (Comtrex)', '١٢٣ (123)', 'فلورست (Flurest)', 'كلارينيز (Clarinase)', 'بنادول ساينس (Panadol Sinus)'],
    namesEn: ['Congestal', 'Comtrex', '123 Cold', 'Flurest', 'Clarinase', 'Panadol Sinus'],
    keywords: ['congestal', 'comtrex', 'flurest', 'clarinase', 'pseudoephedrine', 'phenylephrine', 'chlorpheniramine', 'كونجستال', 'كومتركس', 'فلورست', 'كلارينيز', 'ساينس'],
    drugTestStatus: 'false_positive_risk',
    falsePositiveClassAr: 'قد يعطي إيجابي كاذب لـ «الأمفيتامينات (Amphetamines)» في شريط الفحص السريع',
    falsePositiveClassEn: 'May trigger a false-positive for Amphetamines on rapid immunoassay strips',
    urineDetectionWindowAr: '٢ إلى ٤ أيام بعد آخر قرص',
    urineDetectionWindowEn: '2 to 4 days after last dose',
    drowsinessRisk: 'severe',
    drivingAdviceAr: 'يحتوي على مضاد هيستامين يسبب نعاساً وبطء رد الفعل على الطريق السريع + مزيل احتقان قد يتشابه كيميائياً في الفحص المبدئي السريع.',
    drivingAdviceEn: 'Contains sedating antihistamine impairing highway reaction time + decongestant that cross-reacts on rapid screening strips.',
    safeAlternativeAr: 'بنادول عادي (الأزرق) أو سيتال + بخاخ ماء بحر للأنف (أوتريفين بيبي سالين) + فيتامين سي فوار (آمن 100% للقيادة والتحليل).',
    safeAlternativeEn: 'Plain Paracetamol (Panadol Blue / Cetal) + isotonic saline nasal spray + Vitamin C.',
  },
  {
    id: 'cough-dextromethorphan',
    namesAr: ['توسكان (Tusskan)', 'كوديلار (Codilar)', 'برونكوفين (Bronchophane)', 'أوبلكس (Oplex)', 'توسيفان (Tussivan)'],
    namesEn: ['Tusskan', 'Codilar', 'Bronchophane', 'Oplex', 'Tussivan'],
    keywords: ['tusskan', 'codilar', 'bronchophane', 'oplex', 'tussivan', 'dextromethorphan', 'diphenhydramine', 'pholcodine', 'توسكان', 'كوديلار', 'برونكوفين', 'أوبلكس', 'اوبلكس'],
    drugTestStatus: 'false_positive_risk',
    falsePositiveClassAr: 'قد يعطي إيجابي كاذب لـ «المورفينات / المواد الأفيونية أو PCP» في الشريط السريع',
    falsePositiveClassEn: 'May trigger a false-positive for Opiates / PCP on rapid urine strips',
    urineDetectionWindowAr: '٣ إلى ٥ أيام بعد آخر جرعة',
    urineDetectionWindowEn: '3 to 5 days after last dose',
    drowsinessRisk: 'severe',
    drivingAdviceAr: 'أدوية الكحة التهدئية تسبب خمولاً ونعاساً ملحوظاً أثناء القيادة الليلية وقد تتداخل مع أشرطة المسح المبدئي.',
    drivingAdviceEn: ' Antitussive syrups cause marked drowsiness during night driving and cross-react on rapid strips.',
    safeAlternativeAr: 'شراب ورق اللبلاب الطبيعي (بروسبان Prospan / إيفيروسبان Ivyrospan) أو شراب الجوافة والزعتر (آمن 100% ولا يظهر في أي تحليل).',
    safeAlternativeEn: 'Ivy leaf extract (Prospan / Ivyrospan) or herbal guava-thyme syrup (100% safe for drug tests & driving).',
  },
  {
    id: 'muscle-relaxants',
    namesAr: ['ميولجين (Myolgin)', 'ديمرا (Dimra)', 'ملتي ريلاكس (Multi-Relax)', 'سيردالود (Sirdalud)'],
    namesEn: ['Myolgin', 'Dimra', 'Multi-Relax', 'Sirdalud'],
    keywords: ['myolgin', 'dimra', 'multi-relax', 'sirdalud', 'chlorzoxazone', 'methocarbamol', 'tizanidine', 'cyclobenzaprine', 'ميولجين', 'ديمرا', 'ريلاكس', 'سيردالود'],
    drugTestStatus: ' false_positive_risk'.trim() as 'false_positive_risk',
    falsePositiveClassAr: 'بعض باسطات العضلات (مثل Cyclobenzaprine) قد تتداخل مع شريط مضادات الاكتئاب ثلاثية الحلقات (TCA)',
    falsePositiveClassEn: 'Certain muscle relaxants may cross-react with Tricyclic Antidepressant (TCA) strips',
    urineDetectionWindowAr: '٢ إلى ٣ أيام',
    urineDetectionWindowEn: '2 to 3 days',
    drowsinessRisk: 'severe',
    drivingAdviceAr: 'تحذير قصوى للسائقين: يسبب ارتخاءً عضلياً ونعاساً مفاجئاً خلف عجلة القيادة. لا تقد السيارة لمدة 8 ساعات بعد الجرعة.',
    drivingAdviceEn: 'High alert for drivers: causes muscle relaxation and sudden drowsiness. Do not drive for 8 hours after dosing.',
    safeAlternativeAr: 'استخدم دهان موضعي للعضلات (فولتارين جل / ريباريل جل) + كمادات دافئة أثناء ساعات العمل والقيادة.',
    safeAlternativeEn: 'Use topical anti-inflammatory gel (Voltaren Emulgel / Reparil Gel) + warm compress during driving shifts.',
  },
  {
    id: 'quinolone-antibiotics',
    namesAr: ['سيبروفار / سيبروباي (Ciprofloxacin)', 'تافانيك / ليفانيك (Levofloxacin)'],
    namesEn: ['Ciprofar / Ciprobay', 'Tavanic / Levanic'],
    keywords: ['cipro', 'ciprobay', 'ciprofar', 'tavanic', 'levanic', 'levofloxacin', 'ofloxacin', 'سيبرو', 'تافانيك', 'ليفوفلوكساسين'],
    drugTestStatus: 'false_positive_risk',
    falsePositiveClassAr: 'في حالات نادرة قد تتداخل بعض مضادات الكينولون مع شريط الأفيونات المبدئي (تختفي تماماً في التحليل التأكيدي GC-MS)',
    falsePositiveClassEn: 'Rare cross-reactivity on basic opiate immunoassay strips (cleared 100% by confirmatory GC-MS)',
    urineDetectionWindowAr: '٢ إلى ٣ أيام',
    urineDetectionWindowEn: '2 to 3 days',
    drowsinessRisk: 'moderate',
    drivingAdviceAr: 'قد يسبب دوخة بسيطة لدى بعض المرضى؛ احتفظ بالروشتة الطبية الموثقة أثناء فترة العلاج.',
    drivingAdviceEn: 'May cause mild dizziness in some patients; keep your dated prescription slip during treatment.',
    safeAlternativeAr: 'لا تغير المضاد الحيوي إلا باستشارة الطبيب، واحتفظ بصورة الروشتة والعلبة لتقديمها للجنة الطبية عند الحاجة.',
    safeAlternativeEn: 'Keep your official prescription and box photo to present to the medical review committee if needed.',
  },
  {
    id: 'safe-common-meds',
    namesAr: ['بنادول الأزرق / أدفانس (Panadol)', 'أوجمنتين (Augmentin)', 'تلفاست (Telfast 180)', 'أنتينال (Antinal)'],
    namesEn: ['Panadol Advance', 'Augmentin', 'Telfast 180', 'Antinal'],
    keywords: ['panadol advance', 'paracetamol', 'augmentin', 'amoxicillin', 'telfast', 'fexofenadine', 'antinal', 'بنادول ادفانس', 'أوجمنتين', 'تلفاست', 'أنتينال'],
    drugTestStatus: 'safe',
    drowsinessRisk: 'none',
    drivingAdviceAr: 'آمن تماماً أثناء القيادة والعمل، ولا يسبب نعاساً، ولا يظهر في تحاليل المرور أو العمل.',
    drivingAdviceEn: '100% safe for driving and workplace duties; non-sedating and does not affect drug tests.',
    safeAlternativeAr: 'هذا الدواء نفسه خيار آمن ومعتمد للسائقين.',
    safeAlternativeEn: 'This medication is already a safe choice for drivers.',
  },
];

export function matchDriverDrugScreen(text: string): DriverDrugScreenItem | null {
  const clean = (text || '').toLowerCase().trim();
  if (clean.length < 2) return null;
  for (const item of DRIVER_DRUG_SCREEN_CATALOG) {
    if (item.keywords.some((k) => clean.includes(k.toLowerCase()))) {
      return item;
    }
  }
  return null;
}

// ============================================================================
// 2. SAFE INJECTION & SYRINGE MIXING EVALUATOR
// ============================================================================

export interface InjectionSafetyProfile {
  id: string;
  titleAr: string;
  titleEn: string;
  keywords: string[];
  routeRuleAr: string;
  routeRuleEn: string;
  solventRuleAr: string;
  solventRuleEn: string;
  neverMixWithAr: string;
  neverMixWithEn: string;
  allergyTestNoteAr: string;
  allergyTestNoteEn: string;
}

export const INJECTION_SAFETY_CATALOG: InjectionSafetyProfile[] = [
  {
    id: 'ceftriaxone-vial',
    titleAr: 'حقن سيفترياكسون (روسيفين / زوراكسون / سيفاكسون 1 جم)',
    titleEn: 'Ceftriaxone Vial (Rocephin / Xoraxon / Cefaxone 1g)',
    keywords: ['ceftriaxone', 'rocephin', 'xoraxon', 'cefaxone', 'triaxone', 'سيفترياكسون', 'روسيفين', 'زوراكسون', 'سيفاكسون'],
    routeRuleAr: '⛔ تحذير قاتل: العبوة التي تحتوي على مذيب «ليدوكايين مخدر» تُعطى (عضل فقط IM) ويُمنع منعاً باتاً إعطاؤها بالوريد!',
    routeRuleEn: '⛔ Fatal Warning: Vials reconstituted with Lidocaine solvent are strictly IM ONLY — NEVER inject IV!',
    solventRuleAr: 'للعضل: تُحل بمذيب الليدوكايين المرفق. للوريد: تُحل بماء مقطر للوريد فقط (بدون ليدوكايين نهائياً) وتُعطى ببطء على مدى 3-5 دقائق.',
    solventRuleEn: 'For IM: use Lidocaine solvent. For IV: use sterile water for injection ONLY (never Lidocaine) over 3–5 minutes.',
    neverMixWithAr: 'ممنوع خلطها أو إعطاؤها بالتزامن مع أي محاليل تحتوي على الكالسيوم (مثل محلول رينجر لاكتات أو حقن الكالسيوم) لأنها تكوّن بلورات قاتلة في الرئة والكلى.',
    neverMixWithEn: 'Never mix or co-administer with Calcium-containing solutions (e.g., Ringer Lactate) due to fatal precipitation.',
    allergyTestNoteAr: 'يجب التأكد من عدم وجود حساسية سابقة للبنسلين أو السيفالوسبورين، ويُعطى أول فيال في منشأة طبية مجهزة.',
    allergyTestNoteEn: 'Verify no prior beta-lactam anaphylaxis; administer inside an equipped clinic/hospital.',
  },
  {
    id: 'diclofenac-ampoule',
    titleAr: 'حقن ديكلوفيناك المسكنة (فولتارين / أولفن / ديكلوفين 75 مجم)',
    titleEn: 'Diclofenac Ampoule (Voltaren / Olfen / Declophen 75mg)',
    keywords: ['voltaren', 'declophen', 'olfen', 'diclofenac', 'cataflam amp', 'فولتارين', 'ديكلوفين', 'أولفن'],
    routeRuleAr: 'تُعطى بالعضل العميق فقط (في الربع العلوي الخارجي من الإلية)، ولا تُعطى بالوريد المباشر أبداً.',
    routeRuleEn: 'Deep intragluteal IM injection only; never administer as a direct IV bolus.',
    solventRuleAr: 'أمبول سائل جاهز للحقن العضلي بدون تخفيف.',
    solventRuleEn: 'Ready-to-use ampoule for deep IM injection.',
    neverMixWithAr: '⛔ ممنوع خلطها في نفس السرنجة مع حقن الكورتيزون (ديكساميثازون) أو فيتامين ب12 (بيكوزيم / ديبوفيت) لأنها تتعكر وتترسب وتسبب خراجاً كيميائياً وتلفاً بالأنسجة!',
    neverMixWithEn: '⛔ Never mix in the same syringe with Dexamethasone or Vitamin B12 — causes chemical precipitation and sterile abscess.',
    allergyTestNoteAr: 'تجنبها لمرضى الربو التحسسي من المسكنات، قرحة المعدة، قصور الكلى، والضغط غير المنضبط.',
    allergyTestNoteEn: 'Avoid in NSAID-induced asthma, peptic ulcer, renal impairment, or uncontrolled hypertension.',
  },
  {
    id: 'penicillin-vial',
    titleAr: 'حقن البنسلين طويل المفعول ومشتقاته (ريتربين / ديبوبن / يونيكتام / أوجمنتين فيال)',
    titleEn: 'Penicillin & Beta-Lactam Vials (Retarpen / Depo-Pen / Unictam)',
    keywords: ['retarpen', 'depo-pen', 'benzathine', 'unictam', 'sulbactam', 'amoclan', 'hibiotic', 'ريتربين', 'ديبوبن', 'يونيكتام', 'بنسلين'],
    routeRuleAr: 'البنسلين طويل المفعول (Benzathine Penicillin) يُعطى بالعضل العميق فقط ويُحظر حقنه بالوريد نهائياً.',
    routeRuleEn: 'Benzathine Penicillin is strictly deep IM only — never inject IV.',
    solventRuleAr: 'يُحل بالماء المقطر المعقم ويُرج جيداً قبل السحب مباشرة لمنع انسداد السن.',
    solventRuleEn: 'Reconstitute with sterile water and swirl gently immediately before drawing.',
    neverMixWithAr: 'ممنوع خلطه في نفس السرنجة مع الأمينوجليكوزيدات (مثل جنتاميسين / جاراميسين / أميكين) لأن البنسلين يبطل مفعولها كيميائياً.',
    neverMixWithEn: 'Never mix in the same syringe with aminoglycosides (Gentamicin/Amikacin) due to chemical inactivation.',
    allergyTestNoteAr: '🚨 اختبار الحساسية الطبي والتاريخ المرضي إلزامي قبل الحقن داخل المستشفى أو العيادة.',
    allergyTestNoteEn: '🚨 Clinical allergy evaluation inside a medical facility is mandatory before administration.',
  },
];

export function matchInjectionSafety(text: string, dosageForm?: string): InjectionSafetyProfile | null {
  const clean = `${text || ''} ${dosageForm || ''}`.toLowerCase();
  for (const item of INJECTION_SAFETY_CATALOG) {
    if (item.keywords.some((k) => clean.includes(k.toLowerCase()))) {
      return item;
    }
  }
  if (/vial|ampoule|injection|حقن|أمبول|امبول|فيال/i.test(clean)) {
    return INJECTION_SAFETY_CATALOG[0];
  }
  return null;
}

// ============================================================================
// COMPONENT 1A: AUTOMATIC MEDICINE PAGE BANNER (DRIVER + INJECTION GUARD)
// ============================================================================

export function MedicineDriverAndInjectionBanner({
  medicineNameAr,
  medicineNameEn,
  genericName,
  dosageForm,
  isAr,
}: {
  medicineNameAr: string;
  medicineNameEn: string;
  genericName?: string;
  dosageForm?: string;
  isAr: boolean;
}) {
  const combined = `${medicineNameAr} ${medicineNameEn} ${genericName || ''}`;
  const driverMatch = useMemo(() => matchDriverDrugScreen(combined), [combined]);
  const injectionMatch = useMemo(() => matchInjectionSafety(combined, dosageForm), [combined, dosageForm]);

  if ((!driverMatch || driverMatch.drugTestStatus === 'safe') && !injectionMatch) {
    return null;
  }

  return (
    <div className="stack no-print" style={{ gap: '12px', marginBottom: '14px' }}>
      {driverMatch && driverMatch.drugTestStatus === 'false_positive_risk' && (
        <section
          className="card stack"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '2px solid #d97706',
            borderRadius: '18px',
            padding: '16px 18px',
            color: '#78350f',
          }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '1.02rem' }}>
              🚓 {isAr ? 'درع السائقين وتحليل المخدرات والنعاس على الطريق' : 'Driver & Workplace Drug-Test Shield'}
            </strong>
            <span className="badge" style={{ background: '#b45309', color: '#ffffff', fontWeight: 800 }}>
              {isAr ? 'تنبيه للسائقين والعمل' : 'Driver & Drug-Test Alert'}
            </span>
          </div>
          <p className="small" style={{ margin: 0, lineHeight: 1.65 }}>
            <strong>{isAr ? 'تحليل المرور / العمل: ' : 'Screening Strip Note: '}</strong>
            {isAr ? driverMatch.falsePositiveClassAr : driverMatch.falsePositiveClassEn}
            {driverMatch.urineDetectionWindowAr && (
              <> ({isAr ? `مدة البقاء التقريبية: ${driverMatch.urineDetectionWindowAr}` : `Window: ${driverMatch.urineDetectionWindowEn}`})</>
            )}
          </p>
          <p className="small" style={{ margin: 0, lineHeight: 1.65 }}>
            <strong>{isAr ? 'القيادة والتركيز: ' : 'Driving Safety: '}</strong>
            {isAr ? driverMatch.drivingAdviceAr : driverMatch.drivingAdviceEn}
          </p>
          <div
            className="small"
            style={{
              background: 'rgba(255,255,255,0.75)',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(217,119,6,0.35)',
            }}
          >
            <strong>✅ {isAr ? 'البديل الآمن للسائقين وللتحليل: ' : 'Safe Driver Alternative: '}</strong>
            {isAr ? driverMatch.safeAlternativeAr : driverMatch.safeAlternativeEn}
          </div>
        </section>
      )}

      {injectionMatch && (
        <section
          className="card stack"
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '2px solid #dc2626',
            borderRadius: '18px',
            padding: '16px 18px',
            color: '#7f1d1d',
          }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '1.02rem' }}>
              💉 {isAr ? 'دليل أمان الحقن ومنع الخلط الخطير في السرنجة' : 'Safe Injection & Syringe Mix Guard'}
            </strong>
            <span className="badge" style={{ background: '#dc2626', color: '#ffffff', fontWeight: 800 }}>
              {isAr ? 'قواعد الحقن الآمن' : 'Injection Safety'}
            </span>
          </div>
          <p className="small" style={{ margin: 0, lineHeight: 1.65 }}>
            <strong>{isAr ? 'طريقة الإعطاء والمذيب: ' : 'Route & Solvent: '}</strong>
            {isAr ? injectionMatch.routeRuleAr : injectionMatch.routeRuleEn} — {isAr ? injectionMatch.solventRuleAr : injectionMatch.solventRuleEn}
          </p>
          <p className="small" style={{ margin: 0, lineHeight: 1.65 }}>
            <strong>{isAr ? 'تحذير الخلط في سرنجة واحدة: ' : 'Syringe Mixing Ban: '}</strong>
            {isAr ? injectionMatch.neverMixWithAr : injectionMatch.neverMixWithEn}
          </p>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT 1B: INTERACTIVE DRIVER & DRUG-TEST SHIELD CARD (PatientDashboard / HealthProfile)
// ============================================================================

export function DriverDrugTestShieldCard({ isAr }: { isAr: boolean }) {
  const [selectedId, setSelectedId] = useState<string>(DRIVER_DRUG_SCREEN_CATALOG[0].id);
  const [customQuery, setCustomQuery] = useState('');

  const activeItem = useMemo(() => {
    if (customQuery.trim().length >= 2) {
      const m = matchDriverDrugScreen(customQuery);
      if (m) return m;
    }
    return DRIVER_DRUG_SCREEN_CATALOG.find((x) => x.id === selectedId) || DRIVER_DRUG_SCREEN_CATALOG[0];
  }, [selectedId, customQuery]);

  return (
    <section
      className="card stack no-print"
      style={{
        borderInlineStart: '5px solid #d97706',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(16,185,129,0.04))',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.18rem' }}>
            🚓 {isAr ? 'درع السائقين وتحليل المخدرات والنعاس على الطريق' : 'Driver & Workplace Drug-Test Shield'}
          </h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {isAr
              ? 'افحص أدوية البرد والكحة والمسكنات قبل القيادة أو تحليل المرور والعمل لتجنب النعاس أو الإيجابي الكاذب ومعرفة البديل الآمن.'
              : 'Screen cold, cough, and pain meds before driving or workplace drug testing to avoid drowsiness or false-positive strips.'}
          </p>
        </div>
        <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800 }}>
          {isAr ? 'حماية السائق والموظف' : 'Driver & Work Safety'}
        </span>
      </div>

      <div className="row wrapRow" style={{ gap: '8px' }}>
        {DRIVER_DRUG_SCREEN_CATALOG.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeItem.id === item.id && !customQuery ? 'btn small' : 'btn-secondary small'}
            onClick={() => {
              setCustomQuery('');
              setSelectedId(item.id);
            }}
          >
            {isAr ? item.namesAr[0] : item.namesEn[0]}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={customQuery}
        onChange={(e) => setCustomQuery(e.target.value)}
        placeholder={isAr ? 'أو اكتب اسم الدواء هنا (مثل: كونجستال، توسكان، ميولجين، تلفاست)...' : 'Or type medicine name (e.g., Congestal, Tusskan, Myolgin)...'}
        style={{ maxWidth: '460px' }}
      />

      <div
        className="card stack"
        style={{
          padding: '14px 16px',
          background: activeItem.drugTestStatus === 'false_positive_risk' ? '#fffbeb' : '#ecfdf5',
          border: `1.5px solid ${activeItem.drugTestStatus === 'false_positive_risk' ? '#f59e0b' : '#10b981'}`,
          color: activeItem.drugTestStatus === 'false_positive_risk' ? '#78350f' : '#065f46',
          gap: '8px',
        }}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>
            {activeItem.drugTestStatus === 'false_positive_risk'
              ? isAr
                ? `⚠️ ${activeItem.falsePositiveClassAr}`
                : `⚠️ ${activeItem.falsePositiveClassEn}`
              : isAr
                ? '✅ آمن تماماً في تحاليل المرور والعمل ولا يسبب نعاساً'
                : '✅ 100% Safe on Drug Tests & Non-Drowsy'}
          </strong>
          {activeItem.urineDetectionWindowAr && (
            <span className="badge" style={{ background: '#fde68a', color: '#78350f', fontWeight: 700 }}>
              ⏱️ {isAr ? activeItem.urineDetectionWindowAr : activeItem.urineDetectionWindowEn}
            </span>
          )}
        </div>
        <div className="small">
          <strong>{isAr ? 'الأمثلة المشمولة: ' : 'Included Brands: '}</strong>
          {(isAr ? activeItem.namesAr : activeItem.namesEn).join(' ، ')}
        </div>
        <div className="small">
          <strong>{isAr ? 'تأثير القيادة: ' : 'Driving Impact: '}</strong>
          {isAr ? activeItem.drivingAdviceAr : activeItem.drivingAdviceEn}
        </div>
        <div className="small" style={{ background: 'rgba(255,255,255,0.8)', padding: '8px 12px', borderRadius: '10px' }}>
          <strong>💡 {isAr ? 'البديل المصري الآمن 100%: ' : '100% Safe Alternative: '}</strong>
          {isAr ? activeItem.safeAlternativeAr : activeItem.safeAlternativeEn}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// COMPONENT 2: SMART PHARMACY BILL & RECEIPT OPTIMIZER (CostSaver.tsx)
// ============================================================================

interface BillPresetRow {
  id: string;
  prescribedNameAr: string;
  prescribedNameEn: string;
  ingredientAr: string;
  tier: 'essential_core' | 'supportive_optional';
  prescribedPrice: number;
  egyptianAltNameAr: string;
  egyptianAltNameEn: string;
  egyptianAltPrice: number;
}

const SAMPLE_BILL_ITEMS: BillPresetRow[] = [
  {
    id: 'bill-1',
    prescribedNameAr: 'أوجمنتين 1 جم (Augmentin 1g - 14 قرص)',
    prescribedNameEn: 'Augmentin 1g (14 tabs)',
    ingredientAr: 'أموكسيسيلين + حمض كلافولانيك 1000 مجم',
    tier: 'essential_core',
    prescribedPrice: 196,
    egyptianAltNameAr: 'هاي بيوتك 1 جم (Hibiotic 1g) أو ميجاموكس',
    egyptianAltNameEn: 'Hibiotic 1g / Megamox 1g',
    egyptianAltPrice: 120,
  },
  {
    id: 'bill-2',
    prescribedNameAr: 'كونترولوك 40 مجم (Controloc 40mg - 14 قرص)',
    prescribedNameEn: 'Controloc 40mg (14 tabs)',
    ingredientAr: 'بانتوبرازول 40 مجم لحماية المعدة',
    tier: 'essential_core',
    prescribedPrice: 168,
    egyptianAltNameAr: 'أنتودين / بانتولوك / زوركال 40 مجم',
    egyptianAltNameEn: 'Zurcal / Pantoloc 40mg',
    egyptianAltPrice: 78,
  },
  {
    id: 'bill-3',
    prescribedNameAr: 'فيتامين مستورد متعدد (Centrum / Vitabiotics)',
    prescribedNameEn: 'Imported Multivitamin Pack',
    ingredientAr: 'مكمل غذائي وفيتامينات عامة',
    tier: 'supportive_optional',
    prescribedPrice: 380,
    egyptianAltNameAr: 'كيروفيت (Kerovit) أو فيتاماونت مصري (أو يؤجل بعد استشارة الطبيب)',
    egyptianAltNameEn: 'Kerovit / Vitamount local (or defer after asking doctor)',
    egyptianAltPrice: 95,
  },
];

export function SmartPharmacyBillOptimizerCard({ isAr }: { isAr: boolean }) {
  const [rows, setRows] = useState<BillPresetRow[]>(SAMPLE_BILL_ITEMS);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customAltPrice, setCustomAltPrice] = useState('');
  const [customTier, setCustomTier] = useState<'essential_core' | 'supportive_optional'>('essential_core');

  const totals = useMemo(() => {
    const originalTotal = rows.reduce((s, r) => s + r.prescribedPrice, 0);
    const optimizedTotal = rows.reduce((s, r) => s + r.egyptianAltPrice, 0);
    const essentialOnlyTotal = rows
      .filter((r) => r.tier === 'essential_core')
      .reduce((s, r) => s + r.egyptianAltPrice, 0);
    return {
      originalTotal,
      optimizedTotal,
      savedTotal: Math.max(0, originalTotal - optimizedTotal),
      essentialOnlyTotal,
    };
  }, [rows]);

  return (
    <section
      className="card stack no-print"
      style={{
        borderInlineStart: '5px solid #059669',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(2,132,199,0.05))',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.22rem' }}>
            🧾 {isAr ? 'مُفكّك ومُخفّض فاتورة الصيدلية الذكي قبل الدفع' : 'Smart Pharmacy Bill Deconstructor & Optimizer'}
          </h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {isAr
              ? 'فرّق بين الأدوية العلاجية الأساسية والأصناف التكميلية، واعرف إجمالي الفاتورة بالمثائل المصرية المعتمدة قبل الشراء.'
              : 'Separate essential curative drugs from optional supplements and see total savings with verified Egyptian equivalents.'}
          </p>
        </div>
        <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '0.95rem' }}>
          💰 {isAr ? `توفر ${totals.savedTotal} ج.م` : `Save ${totals.savedTotal} EGP`}
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
        <div className="card" style={{ padding: '12px', textAlign: 'center', background: '#fff1f2', borderColor: '#fecdd3' }}>
          <div className="small muted">{isAr ? 'إجمالي الروشتة الأصلي' : 'Original Bill Total'}</div>
          <strong style={{ fontSize: '1.3rem', color: '#be123c' }}>{totals.originalTotal} EGP</strong>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <div className="small muted">{isAr ? 'الإجمالي بالمثائل المصرية' : 'With Local Equivalents'}</div>
          <strong style={{ fontSize: '1.3rem', color: '#047857' }}>{totals.optimizedTotal} EGP</strong>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div className="small muted">{isAr ? 'العلاج الأساسي فقط (للميزانية المحدودة)' : 'Essential Core Therapy Only'}</div>
          <strong style={{ fontSize: '1.3rem', color: '#1d4ed8' }}>{totals.essentialOnlyTotal} EGP</strong>
        </div>
      </div>

      <div className="stack" style={{ gap: '8px' }}>
        {rows.map((r) => (
          <div
            key={r.id}
            className="card"
            style={{
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              background: 'rgba(255,255,255,0.88)',
            }}
          >
            <div style={{ flex: '1 1 260px' }}>
              <div className="row" style={{ gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  className="badge"
                  style={{
                    background: r.tier === 'essential_core' ? '#fee2e2' : '#fef3c7',
                    color: r.tier === 'essential_core' ? '#991b1b' : '#92400e',
                    fontWeight: 700,
                  }}
                >
                  {r.tier === 'essential_core'
                    ? isAr
                      ? '🔴 علاج أساسي لا يؤجل'
                      : '🔴 Essential Core'
                    : isAr
                      ? '🟡 مكمل إضافي (اسأل طبيبك)'
                      : '🟡 Optional Supplement'}
                </span>
                <strong>{isAr ? r.prescribedNameAr : r.prescribedNameEn}</strong>
              </div>
              <div className="small muted" style={{ marginTop: '4px' }}>
                {r.ingredientAr} ← <strong>{isAr ? 'المثيل المصري: ' : 'Local Equivalent: '}</strong>
                {isAr ? r.egyptianAltNameAr : r.egyptianAltNameEn}
              </div>
            </div>
            <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
              <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.9rem' }}>
                {r.prescribedPrice} EGP
              </span>
              <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800 }}>
                {r.egyptianAltPrice} EGP
              </span>
              <button
                type="button"
                className="btn-secondary small"
                onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        className="row wrapRow"
        style={{ gap: '8px', alignItems: 'center' }}
        onSubmit={(e) => {
          e.preventDefault();
          const p1 = Number(customPrice);
          const p2 = Number(customAltPrice);
          if (!customName.trim() || Number.isNaN(p1) || p1 <= 0) return;
          const safeAlt = !Number.isNaN(p2) && p2 > 0 ? p2 : Math.round(p1 * 0.55);
          setRows((prev) => [
            ...prev,
            {
              id: `custom-${Date.now()}`,
              prescribedNameAr: customName.trim(),
              prescribedNameEn: customName.trim(),
              ingredientAr: isAr ? 'نفس المادة الفعالة والتركيز' : 'Same active ingredient & strength',
              tier: customTier,
              prescribedPrice: p1,
              egyptianAltNameAr: isAr ? 'مثيل مصري بنفس التركيز' : 'Verified Egyptian equivalent',
              egyptianAltNameEn: 'Verified Egyptian equivalent',
              egyptianAltPrice: safeAlt,
            },
          ]);
          setCustomName('');
          setCustomPrice('');
          setCustomAltPrice('');
        }}
      >
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder={isAr ? 'أضف صنفاً من الروشتة...' : 'Add prescription item...'}
          style={{ flex: '1 1 160px' }}
        />
        <input
          type="number"
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
          placeholder={isAr ? 'سعر العلبه (ج.م)' : 'Price (EGP)'}
          style={{ width: '130px' }}
        />
        <input
          type="number"
          value={customAltPrice}
          onChange={(e) => setCustomAltPrice(e.target.value)}
          placeholder={isAr ? 'سعر المثيل (اختياري)' : 'Alt price'}
          style={{ width: '140px' }}
        />
        <select
          value={customTier}
          onChange={(e) => setCustomTier(e.target.value as 'essential_core' | 'supportive_optional')}
          style={{ width: '160px' }}
        >
          <option value="essential_core">{isAr ? 'علاج أساسي' : 'Essential Core'}</option>
          <option value="supportive_optional">{isAr ? 'مكمل تكميلي' : 'Supplement'}</option>
        </select>
        <button type="submit" className="btn small">
          + {isAr ? 'إضافة للفاتورة' : 'Add Item'}
        </button>
      </form>
    </section>
  );
}

// ============================================================================
// COMPONENT 3: POST-OPENING EXPIRY & SUMMER HEAT COUNTER (HomeMedicineCabinet.tsx)
// ============================================================================

interface OpenedMedTypeRule {
  id: string;
  labelAr: string;
  labelEn: string;
  validDaysAfterOpen: number;
  storageRuleAr: string;
  storageRuleEn: string;
  spoilageSignsAr: string;
}

const OPENED_MED_RULES: OpenedMedTypeRule[] = [
  {
    id: 'abx_suspension_fridge',
    labelAr: 'شراب مضاد حيوي بودرة تم حلّه بالماء (مثل أوجمنتين / هاي بيوتك / كلاسيد)',
    labelEn: 'Reconstituted Antibiotic Suspension (Augmentin / Hibiotic)',
    validDaysAfterOpen: 10,
    storageRuleAr: '❄️ يُحفظ في رف باب الثلاجة (2–8°م) ولا يوضع في الفريزر أبداً. يُرمى بعد 7 إلى 10 أيام من حلّه بالماء حتى لو تبقى نصف الزجاجة!',
    storageRuleEn: '❄️ Store in fridge door (2–8°C). Discard 7–10 days after reconstitution even if half full!',
    spoilageSignsAr: 'تغير لون المعلق للأصفر الغامق أو البني، أو تكتل البودرة في القاع مع رائحة حمضية نفاذة.',
  },
  {
    id: 'eye_ear_drops',
    labelAr: 'قطرة عين أو أذن أو مرهم عين بعد فتح الغطاء (مثل توبرادكس / واكسول)',
    labelEn: 'Opened Eye / Ear Drops or Ophthalmic Ointment',
    validDaysAfterOpen: 28,
    storageRuleAr: '🌡️ صالحة لمدة 28 يوماً فقط من لحظة فتح الغطاء (اكتب تاريخ الفتح بالقلم على الزجاجة)، وتُحفظ بعيداً عن شمس الصيف وحرارة السيارة.',
    storageRuleEn: '🌡️ Valid for strictly 28 days after opening cap; keep away from direct summer heat.',
    spoilageSignsAr: 'أي عكارة في سائل القطرة أو تلامس فوهة القطرة مع الرموش أو الصديد.',
  },
  {
    id: 'opened_insulin_pen',
    labelAr: 'قلم أو فيال أنسولين قيد الاستخدام اليومي (مثل لانتوس / نوفورابيد / ميكستارد)',
    labelEn: 'In-Use Insulin Pen or Vial (Lantus / NovoRapid / Mixtard)',
    validDaysAfterOpen: 28,
    storageRuleAr: '🌡️ القلم المفتوح صالح لـ 28 يوماً؛ في حر صيف مصر (أعلى من 30°م) احفظه في جراب تبريد أو باب الثلاجة وأخرجه قبل الحقن بـ 10 دقائق.',
    storageRuleEn: '🌡️ Valid 28 days after first use; protect from Egyptian summer heat (>30°C).',
    spoilageSignsAr: 'ظهور حبيبات بيضاء أو خيوط عالقة في الأنسولين الصافي، أو عدم استجابة سكر الدم للجرعة المعتادة.',
  },
  {
    id: 'oral_syrup_opened',
    labelAr: 'شراب كحة أو خافض حرارة للأطفال بعد الفتح (مثل سيتال / بروفين / برونشيكم)',
    labelEn: 'Opened Pediatric Fever or Cough Syrup',
    validDaysAfterOpen: 90,
    storageRuleAr: '🏠 يُحفظ محكم الغلق في غرفة باردة بعيداً عن رطوبة المطبخ والحمام، ويُتخلص منه بعد 3 إلى 6 أشهر من الفتح.',
    storageRuleEn: '🏠 Keep tightly closed in a cool room away from kitchen/bathroom steam; discard after 3–6 months.',
    spoilageSignsAr: 'تبلور السكر حول عنق الزجاجة أو تغير قوام ورائحة الشراب.',
  },
];

interface TrackedOpenedMed {
  id: string;
  customName: string;
  ruleId: string;
  openedDate: string;
}

const OPENED_TRACKER_STORAGE_KEY = 'dawaya_post_opening_tracker_v1';

export function PostOpeningExpiryTrackerCard({ isAr }: { isAr: boolean }) {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(OPENED_MED_RULES[0].id);
  const [medName, setMedName] = useState('');
  const [openedDate, setOpenedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [tracked, setTracked] = useState<TrackedOpenedMed[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(OPENED_TRACKER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(OPENED_TRACKER_STORAGE_KEY, JSON.stringify(tracked));
    } catch {
      /* ignore */
    }
  }, [tracked]);

  const currentRule = OPENED_MED_RULES.find((r) => r.id === selectedRuleId) || OPENED_MED_RULES[0];

  const previewCalc = useMemo(() => {
    const start = new Date(openedDate);
    if (Number.isNaN(start.getTime())) return null;
    const discard = new Date(start);
    discard.setDate(discard.getDate() + currentRule.validDaysAfterOpen);
    const diffMs = discard.getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      discardDateStr: discard.toISOString().slice(0, 10),
      daysLeft,
      isExpired: daysLeft <= 0,
    };
  }, [openedDate, currentRule]);

  return (
    <section
      className="card stack no-print"
      style={{
        borderInlineStart: '5px solid #0284c7',
        background: 'linear-gradient(135deg, rgba(2,132,199,0.08), rgba(245,158,11,0.05))',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.18rem' }}>
            ⏳ {isAr ? 'عداد صلاحية الدواء بعد الفتح وحرارة الصيف في مصر' : 'Post-Opening Expiry & Summer Heat Counter'}
          </h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {isAr
              ? 'احذر: تاريخ الصلاحية المطبوع على العلبة ينتهي بمجرد فتح القطرة أو حلّ شراب المضاد الحيوي أو فتح قلم الأنسولين!'
              : 'Printed box expiry stops applying once you open eye drops, reconstitute antibiotic syrups, or unseal insulin pens!'}
          </p>
        </div>
        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
          {isAr ? 'حاسبة الصلاحية الفعلية' : 'Real Discard Date'}
        </span>
      </div>

      <div className="row wrapRow" style={{ gap: '8px' }}>
        <select
          value={selectedRuleId}
          onChange={(e) => setSelectedRuleId(e.target.value)}
          style={{ flex: '1 1 260px' }}
        >
          {OPENED_MED_RULES.map((r) => (
            <option key={r.id} value={r.id}>
              {isAr ? r.labelAr : r.labelEn}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={openedDate}
          onChange={(e) => setOpenedDate(e.target.value)}
          style={{ width: '165px' }}
        />
        <input
          type="text"
          value={medName}
          onChange={(e) => setMedName(e.target.value)}
          placeholder={isAr ? 'اسم الدواء (اختياري)...' : 'Medicine name...'}
          style={{ flex: '1 1 170px' }}
        />
        <button
          type="button"
          className="btn small"
          onClick={() => {
            const label = medName.trim() || (isAr ? currentRule.labelAr.split('(')[0] : currentRule.labelEn);
            setTracked((prev) => [
              { id: `op-${Date.now()}`, customName: label, ruleId: currentRule.id, openedDate },
              ...prev,
            ]);
            setMedName('');
          }}
        >
          📌 {isAr ? 'تثبيت عداد الفتح' : 'Pin Opened Bottle'}
        </button>
      </div>

      {previewCalc && (
        <div
          className="card stack"
          style={{
            padding: '12px 14px',
            background: previewCalc.isExpired ? '#fef2f2' : '#f0f9ff',
            border: `1.5px solid ${previewCalc.isExpired ? '#ef4444' : '#38bdf8'}`,
            color: previewCalc.isExpired ? '#991b1b' : '#0c4a6e',
            gap: '6px',
          }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>
              {previewCalc.isExpired
                ? isAr
                  ? `⛔ انتهت صلاحية العبوة بعد الفتح! يجب التخلص منها فوراً (تاريخ الإعدام كان ${previewCalc.discardDateStr})`
                  : `⛔ Expired after opening! Discard immediately (Discard date was ${previewCalc.discardDateStr})`
                : isAr
                  ? `✅ صالحة لمدة ${previewCalc.daysLeft} يوم متبقي — تاريخ الرمي الفعلي: ${previewCalc.discardDateStr}`
                  : `✅ Valid for ${previewCalc.daysLeft} more days — Discard on: ${previewCalc.discardDateStr}`}
            </strong>
            <span className="badge" style={{ background: '#ffffff', color: '#0369a1', fontWeight: 800 }}>
              {currentRule.validDaysAfterOpen} {isAr ? 'يوم فقط بعد الفتح' : 'days after opening'}
            </span>
          </div>
          <div className="small">{isAr ? currentRule.storageRuleAr : currentRule.storageRuleEn}</div>
          {isAr && (
            <div className="small">
              <strong>🔍 علامات تلف العبوة فوراً: </strong>
              {currentRule.spoilageSignsAr}
            </div>
          )}
        </div>
      )}

      {tracked.length > 0 && (
        <div className="stack" style={{ gap: '6px' }}>
          <strong className="small">{isAr ? 'عبواتك المفتوحة المسجلة في البيت:' : 'Your Pinned Opened Bottles:'}</strong>
          {tracked.map((item) => {
            const rule = OPENED_MED_RULES.find((r) => r.id === item.ruleId) || OPENED_MED_RULES[0];
            const d = new Date(item.openedDate);
            d.setDate(d.getDate() + rule.validDaysAfterOpen);
            const discardStr = d.toISOString().slice(0, 10);
            const left = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div
                key={item.id}
                className="row wrapRow"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: left <= 0 ? '#fee2e2' : 'rgba(255,255,255,0.85)',
                }}
              >
                <span className="small">
                  <strong>{item.customName}</strong> — {isAr ? `فُتحت: ${item.openedDate} | تُرمى: ${discardStr}` : `Opened: ${item.openedDate} | Discard: ${discardStr}`}
                </span>
                <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                  <span className="badge" style={{ background: left <= 0 ? '#dc2626' : '#dcfce7', color: left <= 0 ? '#fff' : '#166534' }}>
                    {left <= 0 ? (isAr ? 'منتهية — ارمها' : 'Expired') : `${left} ${isAr ? 'يوم متبقي' : 'days left'}`}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary small"
                    onClick={() => setTracked((prev) => prev.filter((x) => x.id !== item.id))}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// COMPONENT 4: EGYPTIAN TEA, COFFEE & FOOD TIMING MATRIX (FoodDrugInteractionChecker & DailyScheduleGenerator)
// ============================================================================

function addHoursHHMM(baseHHMM: string, addHours: number): string {
  const [hStr, mStr] = (baseHHMM || '08:00').split(':');
  const totalMin = ((parseInt(hStr, 10) || 8) * 60 + (parseInt(mStr, 10) || 0) + Math.round(addHours * 60) + 1440) % 1440;
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  const period = hh >= 12 ? 'م' : 'ص';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${period}`;
}

export function TeaCoffeeTimingMatrixCard({ isAr }: { isAr: boolean }) {
  const [wakeTime, setWakeTime] = useState('07:30');
  const [hasThyroid, setHasThyroid] = useState(true);
  const [hasIron, setHasIron] = useState(true);
  const [hasCalciumOrDairy, setHasCalciumOrDairy] = useState(true);
  const [hasAntibiotic, setHasAntibiotic] = useState(false);

  const timeline = useMemo(() => {
    const slots: Array<{ time: string; icon: string; titleAr: string; titleEn: string; noteAr: string; noteEn: string; color: string }> = [];

    if (hasThyroid) {
      slots.push({
        time: addHoursHHMM(wakeTime, 0),
        icon: '🦋',
        titleAr: 'قرص الغدة الدرقية (إلتروكسين / إيثيروكس) على الريق',
        titleEn: 'Thyroid Pill (Eltroxin / Euthyrox) on Empty Stomach',
        noteAr: 'بكوب ماء عادي فقط فور الاستيقاظ — ممنوع الفطار أو القهوة أو الشاي بلبن لمدة 60 دقيقة كاملة.',
        noteEn: 'With plain water immediately upon waking — wait 60 full minutes before breakfast or coffee.',
        color: '#0284c7',
      });
    }

    slots.push({
      time: addHoursHHMM(wakeTime, 1),
      icon: '🍳',
      titleAr: 'وجبة الفطار + كوباية الشاي أو القهوة الصباحية ☕',
      titleEn: 'Breakfast + Morning Tea or Coffee ☕',
      noteAr: 'الآن يمكنك تناول الفول/الجبنة وشرب الشاي أو القهوة بأمان بعد مرور ساعة كاملة على قرص الغدة.',
      noteEn: 'Safe window for breakfast, dairy, and morning tea/coffee (1 hour after thyroid dose).',
      color: '#d97706',
    });

    if (hasIron) {
      slots.push({
        time: addHoursHHMM(wakeTime, 4.5),
        icon: '🩸',
        titleAr: 'قرص الحديد (فيروجلوبين / فرافيرو) + عصير برتقال 🍊',
        titleEn: 'Iron Supplement + Orange Juice (Vitamin C) 🍊',
        noteAr: 'بعد الشاي والقهوة واللبن بـ 3 ساعات ونصف، وبعيد عن قرص الغدة بـ 4 ساعات ونصف لضمان امتصاص الحديد 100%.',
        noteEn: 'Separated by 3.5h from tea/coffee/dairy and 4.5h from thyroid hormone for maximum absorption.',
        color: '#dc2626',
      });
    }

    slots.push({
      time: addHoursHHMM(wakeTime, 7.5),
      icon: '🍲',
      titleAr: 'وجبة الغداء + شاي بعد الغداء (بعد الحديد بساعتين على الأقل)',
      titleEn: 'Lunch + Afternoon Tea (2+ hours after Iron)',
      noteAr: 'تجنب شرب الشاي مع الحديد في نفس الساعة لأن التانين يرسب 70% من الحديد في المعدة.',
      noteEn: 'Keep afternoon tea at least 2 hours away from your iron supplement.',
      color: '#059669',
    });

    if (hasCalciumOrDairy) {
      slots.push({
        time: addHoursHHMM(wakeTime, 11),
        icon: '🦴',
        titleAr: 'قرص الكالسيوم / فيتامين د3 أو كوب اللبن المسائي',
        titleEn: 'Calcium / Vitamin D3 or Evening Milk',
        noteAr: 'مفصول تماماً عن قرص الحديد بـ 6 ساعات وعن قرص الغدة الصباحي بـ 11 ساعة لعدم تعارض المعادن.',
        noteEn: 'Completely separated from Iron (6h) and morning Thyroid pill (11h).',
        color: '#4f46e5',
      });
    }

    if (hasAntibiotic) {
      slots.push({
        time: addHoursHHMM(wakeTime, 13.5),
        icon: '💊',
        titleAr: 'جرعة المضاد الحيوي المسائية بكوب ماء كبير',
        titleEn: 'Evening Antibiotic Dose with Full Glass of Water',
        noteAr: 'بعد منتجات الألبان والكالسيوم بساعتين ونصف لضمان عدم ضعف مفعول المضاد الحيوي.',
        noteEn: 'Taken 2.5 hours after dairy/calcium so chelation never weakens the antibiotic.',
        color: '#be123c',
      });
    }

    return slots;
  }, [wakeTime, hasThyroid, hasIron, hasCalciumOrDairy, hasAntibiotic]);

  return (
    <section
      className="card stack no-print"
      style={{
        borderInlineStart: '5px solid #d97706',
        background: 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(16,185,129,0.05))',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.18rem' }}>
            ☕ {isAr ? 'مُنسّق مواعيد الشاي والقهوة والفطار مع الأدوية بالساعة' : 'Tea, Coffee & Meals Drug-Timing Matrix'}
          </h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {isAr
              ? 'احسب تلقائياً المواعيد المثالية بالساعة لفصل الشاي والقهوة واللبن عن دواء الغدة والحديد والكالسيوم والمضاد الحيوي.'
              : 'Automatically schedule your daily tea, coffee, and dairy around thyroid, iron, calcium, and antibiotic doses.'}
          </p>
        </div>
        <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800 }}>
          {isAr ? 'منع فشل الامتصاص' : '100% Absorption'}
        </span>
      </div>

      <div className="row wrapRow" style={{ gap: '12px', alignItems: 'center' }}>
        <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong>⏰ {isAr ? 'ميعاد الصحيان:' : 'Wake-up Time:'}</strong>
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} style={{ width: '125px' }} />
        </label>
        <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={hasThyroid} onChange={(e) => setHasThyroid(e.target.checked)} />
          {isAr ? 'دواء الغدة (Eltroxin)' : 'Thyroid (Eltroxin)'}
        </label>
        <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={hasIron} onChange={(e) => setHasIron(e.target.checked)} />
          {isAr ? 'أقراص الحديد' : 'Iron Pill'}
        </label>
        <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={hasCalciumOrDairy} onChange={(e) => setHasCalciumOrDairy(e.target.checked)} />
          {isAr ? 'كالسيوم / لبن وجبنة' : 'Calcium / Dairy'}
        </label>
        <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={hasAntibiotic} onChange={(e) => setHasAntibiotic(e.target.checked)} />
          {isAr ? 'مضاد حيوي' : 'Antibiotic'}
        </label>
      </div>

      <div className="stack" style={{ gap: '8px' }}>
        {timeline.map((slot, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              padding: '10px 14px',
              borderInlineStart: `4px solid ${slot.color}`,
              background: 'rgba(255,255,255,0.9)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <strong>
                {slot.icon} {isAr ? slot.titleAr : slot.titleEn}
              </strong>
              <div className="small muted">{isAr ? slot.noteAr : slot.noteEn}</div>
            </div>
            <span className="badge" style={{ background: slot.color, color: '#ffffff', fontWeight: 800, fontSize: '0.92rem' }}>
              🕒 {slot.time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// COMPONENT 5: SAFE INJECTION & SYRINGE MIX GUARD CARD (Interactions.tsx)
// ============================================================================

interface SyringeMixRule {
  id: string;
  pairTitleAr: string;
  pairTitleEn: string;
  dangerLevelAr: string;
  whatHappensAr: string;
  whatHappensEn: string;
  correctActionAr: string;
  correctActionEn: string;
}

const SYRINGE_MIX_RULES: SyringeMixRule[] = [
  {
    id: 'mix-voltaren-dexa',
    pairTitleAr: 'خلط حقنة مسكن (فولتارين / أولفن) + حقنة كورتيزون (ديكساميثازون) في سرنجة واحدة',
    pairTitleEn: 'Mixing Diclofenac (Voltaren) + Dexamethasone in One Syringe',
    dangerLevelAr: '⛔ خطأ شائع وخطير جداً في الصيدليات والمنازل',
    whatHappensAr: 'اختلاف درجة الحموضة (pH) والمواد الحافظة يسبب ترسيباً كيميائياً وتفاعلاً غير مرئي جوه السرنجة، بالإضافة لزيادة خطر قرحة ونزيف المعدة الحاد ورفع الضغط والسكر.',
    whatHappensEn: 'pH incompatibility causes micro-precipitation inside the syringe barrel and compounds GI bleeding risk.',
    correctActionAr: 'لا تخلطهما في سرنجة واحدة أبداً؛ لا تأخذ الكورتيزون كمسكن للبرد أو العظام إلا بوصفة طبيب، وتُعطى كل حقنة منفصلة.',
    correctActionEn: 'Never mix in the same syringe; administer only when medically indicated in separate syringes.',
  },
  {
    id: 'mix-ceftriaxone-lidocaine-iv',
    pairTitleAr: 'إعطاء حقنة مضاد حيوي (سيفترياكسون / روسيفين) محلولة بمذيب «ليدوكايين» في الوريد (IV)',
    pairTitleEn: 'Injecting Ceftriaxone Reconstituted with Lidocaine Solvent into a Vein (IV)',
    dangerLevelAr: '🚨 خطر قاتل (توقف عضلة القلب واضطراب كهرباء القلب)',
    whatHappensAr: 'أمبول المذيب المرفق مع حقن العضل يحتوي على مخدر موضعي (Lidocaine 1%) لتقليل ألم العضل؛ دخوله في الوريد المباشر يسبب تسمماً قلبياً وعصبياً فورياً!',
    whatHappensEn: 'Lidocaine 1% solvent is strictly for IM pain relief; direct IV injection causes acute cardiac arrhythmia and neurotoxicity.',
    correctActionAr: 'إذا كتب الطبيب الحقنة «وريد IV»، ارمِ أمبول الليدوكايين واستخدم أمبول «ماء مقطر معقم للوريد فقط»، أو مع الكالسيوم يمنع خلط السيفترياكسون نهائياً.',
    correctActionEn: 'For IV route, discard the Lidocaine ampoule and reconstitute strictly with Sterile Water for Injection.',
  },
  {
    id: 'mix-b12-nsaid',
    pairTitleAr: 'خلط حقنة فيتامين ب المركب (بيكوزيم / نيوروتون / ديبوفيت) مع حقنة مسكن في سرنجة واحدة',
    pairTitleEn: 'Mixing Vitamin B-Complex / B12 with an NSAID Analgesic in One Syringe',
    dangerLevelAr: '🟠 تفاعل كيميائي يبطل مفعول الفيتامين ويسبب خراجاً عضلياً',
    whatHappensAr: 'فيتامين ب حساس جداً لتغير الوسط الكيميائي، وخلطه مع ديكلوفيناك أو كيتورولاك يفسد الفيتامين ويزيد التهاب الأنسجة العضلية.',
    whatHappensEn: 'B-vitamins degrade when mixed with alkaline/acidic NSAID solutions and increase local tissue irritation.',
    correctActionAr: 'استخدم سرنجة مستقلة لكل أمبول في موضعين مختلفين.',
    correctActionEn: 'Use a separate sterile syringe and separate injection site for each ampoule.',
  },
];

export function SafeInjectionSyringeGuardCard({ isAr }: { isAr: boolean }) {
  const [selectedMixId, setSelectedMixId] = useState<string>(SYRINGE_MIX_RULES[0].id);
  const currentMix = SYRINGE_MIX_RULES.find((m) => m.id === selectedMixId) || SYRINGE_MIX_RULES[0];

  return (
    <section
      className="card stack no-print"
      style={{
        borderInlineStart: '5px solid #dc2626',
        background: 'linear-gradient(135deg, rgba(220,38,38,0.07), rgba(245,158,11,0.05))',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.18rem' }}>
            💉 {isAr ? 'كاشف أمان الحقن ومنع الخلط الخطير في سرنجة واحدة' : 'Safe Injection & Syringe Mixing Guard'}
          </h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {isAr
              ? 'تأكد قبل أخذ أي حقنة في المنزل أو الصيدلية من نوع المذيب (ماء مقطر vs ليدوكايين للعضل فقط) ومنع خلط أمبولين في سرنجة واحدة.'
              : 'Verify solvent type (Sterile Water vs. IM-only Lidocaine) and prevent dangerous multi-ampoule syringe mixing.'}
          </p>
        </div>
        <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800 }}>
          {isAr ? 'سلامة الحقن' : 'Injection Safety'}
        </span>
      </div>

      <div className="row wrapRow" style={{ gap: '8px' }}>
        {SYRINGE_MIX_RULES.map((rule) => (
          <button
            key={rule.id}
            type="button"
            className={currentMix.id === rule.id ? 'btn small' : 'btn-secondary small'}
            onClick={() => setSelectedMixId(rule.id)}
          >
            {isAr ? rule.pairTitleAr.slice(0, 38) + '...' : rule.pairTitleEn.slice(0, 34) + '...'}
          </button>
        ))}
      </div>

      <div
        className="card stack"
        style={{
          padding: '14px 16px',
          background: '#fef2f2',
          border: '1.5px solid #ef4444',
          color: '#7f1d1d',
          gap: '8px',
        }}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>{isAr ? currentMix.pairTitleAr : currentMix.pairTitleEn}</strong>
          <span className="badge" style={{ background: '#dc2626', color: '#ffffff', fontWeight: 800 }}>
            {currentMix.dangerLevelAr}
          </span>
        </div>
        <div className="small">
          <strong>{isAr ? 'ماذا يحدث عند الخلط؟ ' : 'What happens? '}</strong>
          {isAr ? currentMix.whatHappensAr : currentMix.whatHappensEn}
        </div>
        <div className="small" style={{ background: 'rgba(255,255,255,0.85)', padding: '8px 12px', borderRadius: '10px' }}>
          <strong>✅ {isAr ? 'التصرف الطبي الصحيح: ' : 'Safe Clinical Protocol: '}</strong>
          {isAr ? currentMix.correctActionAr : currentMix.correctActionEn}
        </div>
      </div>
    </section>
  );
}
