import React, { useEffect, useMemo, useState } from 'react';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';
import { speakText, stopSpeech } from './speechService';

export type PregnancyTab =
  | 'encyclopedia'
  | 'roadmap'
  | 'kicks'
  | 'weight'
  | 'discomforts'
  | 'labor_bag';

export type PregnancyCategory = 'all' | 'food' | 'medication' | 'supplement' | 'beverage' | 'lifestyle';
export type SafetyLevel = 'all' | 'safe' | 'caution' | 'forbidden';
export type TrimesterFilter = 'all' | 'first' | 'second' | 'third' | 'lactation';

export interface PregnancyItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'food' | 'medication' | 'supplement' | 'beverage' | 'lifestyle';
  safetyStatus: 'safe' | 'caution' | 'forbidden';
  trimesterImpact: {
    first: 'safe' | 'caution' | 'forbidden';
    second: 'safe' | 'caution' | 'forbidden';
    third: 'safe' | 'caution' | 'forbidden';
    lactation: 'safe' | 'caution' | 'forbidden';
  };
  fdaCategory?: 'A' | 'B' | 'C' | 'D' | 'X';
  commonEgyptianExamples: string;
  riskPhysiologyAr: string;
  riskPhysiologyEn: string;
  safeConditionOrDoseAr: string;
  safeConditionOrDoseEn: string;
  recommendedAlternativeAr: string;
  recommendedAlternativeEn: string;
  specialistTipAr: string;
  specialistTipEn: string;
}

export const PREGNANCY_ITEMS: PregnancyItem[] = [
  // 1. Food & Diet
  {
    id: 'liver-retinol',
    nameAr: 'الكبدة (كبدة بقر، كبدة دجاج، كبدة إسكندراني)',
    nameEn: 'Liver (Beef, Chicken & Calf Liver)',
    category: 'food',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'caution', third: 'caution', lactation: 'safe' },
    commonEgyptianExamples: 'سندوتشات الكبدة الإسكندراني، كبدة دجاج، كبد وقوانص، طاجن كبدة بالردة',
    riskPhysiologyAr: 'تحتوي الكبدة على مستويات فائقة وشديدة التركيز من فيتامين أ النشط (Retinol). الجرعات العالية منه تعبر المشيمة مباشرة وتصنف علمياً كمشوه قوي للأجنة (Teratogenic)، وتسبب تشوهات خطيرة في الجمجمة، الوجه، والقلب والأوعية الدموية في الأشهر الثلاثة الأولى.',
    riskPhysiologyEn: 'Liver contains extremely dense preformed Vitamin A (Retinol). Excessive retinol readily crosses placenta and is a proven teratogen causing craniofacial, cardiac, and central nervous system malformations, especially in the first trimester.',
    safeConditionOrDoseAr: 'ممنوعة تماماً في الثلث الأول (أول 3 أشهر). بعد الشهر الرابع: مسموح بكمية ضئيلة جداً (أقل من 50 جرام مرة واحدة كل أسبوعين إلى شهر) ومطهية جيداً.',
    safeConditionOrDoseEn: 'Strictly avoid in Trimester 1. In Trimester 2 and 3, limit to less than 50g once every 2-4 weeks, thoroughly cooked.',
    recommendedAlternativeAr: 'قطع اللحم البقري الأحمر الصافي، صدور الدجاج المطهوة جيداً، ومكملات الحديد الآمنة المصرح بها للحوامل بعد استشارة الطبيب.',
    recommendedAlternativeEn: 'Lean cuts of beef, well-cooked chicken breasts, and prenatal iron supplements under physician guidance.',
    specialistTipAr: 'الحديد في الكبدة ممتاز، لكن فيتامين أ فيها قنبلة موقوتة للطفل في بداية تكوين أعضائه! خذي الحديد من اللحم الأحمر والسبانخ والتفاح مع فيتامين سي لزيادة الامتصاص بأمان.',
    specialistTipEn: 'Iron in liver is rich, but its retinol load is dangerous during organogenesis. Rely on lean red meat and prenatal iron instead.',
  },
  {
    id: 'tuna-mercury',
    nameAr: 'التونة المعلبة وأسماك الماكريل الملكي والقرش',
    nameEn: 'Canned Tuna & High-Mercury Predatory Fish',
    category: 'food',
    safetyStatus: 'caution',
    trimesterImpact: { first: 'caution', second: 'caution', third: 'caution', lactation: 'caution' },
    commonEgyptianExamples: 'علب التونة (مفتتة/قطع)، سمك القرش، سمك الماكريل الكبير، سمك السيف (أبو سيف)',
    riskPhysiologyAr: 'الأسماك المفترسة الكبيرة تراكم في عضلاتها مستويات عالية من ميثيل الزئبق (Methylmercury) العضوي السام. الزئبق يخترق الحاجز المشيمي والدموي الدماغي للجنين مسبباً تلفاً في نمو الجهاز العصبي والقدرات البصرية والإدراكية.',
    riskPhysiologyEn: 'Predatory fish bioaccumulate toxic methylmercury which easily crosses the placenta and blood-brain barrier, harming fetal neurodevelopment, cognition, and retinal development.',
    safeConditionOrDoseAr: 'مسموح فقط بعلبة واحدة صغيرة (120-140 جم) أسبوعياً من تونة قطع خفيفة (Light Canned Tuna). تجنبي تماماً التونة البيضاء (Albacore) وأسماك القرش والماكريل الملكي.',
    safeConditionOrDoseEn: 'Limit to at most 1 small can (120-140g) per week of light canned tuna. Avoid Albacore white tuna, swordfish, and king mackerel entirely.',
    recommendedAlternativeAr: 'سمك السلمون المطهو، الجمبري، سمك البلطي الطازج، والسردين الصغير (غنية جداً بأوميجا 3 ومنخفضة الزئبق تماماً).',
    recommendedAlternativeEn: 'Cooked salmon, shrimp, fresh tilapia, and canned small sardines (rich in DHA, very low mercury).',
    specialistTipAr: 'السمك مطلوب ومهم لمخ الجنين، لكن القاعدة الذهبية: (سمكة صغيرة عمرها قصير = زئبق منخفض وأمان عالي). اختاري السلمون والبلطي وابتعدي عن الأسماك الضخمة.',
    specialistTipEn: 'Fish is vital for fetal brain DHA, but stick to smaller species with shorter lifespans like wild salmon, tilapia, and shrimp.',
  },
  {
    id: 'salmon-shrimp-safe',
    nameAr: 'السلمون، البلطي، الجمبري، والسردين (المطهو جيداً)',
    nameEn: 'Cooked Salmon, Tilapia, Shrimp & Sardines',
    category: 'food',
    safetyStatus: 'safe',
    trimesterImpact: { first: 'safe', second: 'safe', third: 'safe', lactation: 'safe' },
    commonEgyptianExamples: 'سمك بلطي مشوي أو في الفرن، فيليه سلمون مشوي، جمبري مقشر مسلوق أو مشوي، علبة سردين',
    riskPhysiologyAr: 'هذه الأسماك قليلة الزئبق وغنية جداً بأحماض أوميجا-3 الدهنية (DHA و EPA) الضرورية لتكوين القشرة المخية وشبكية العين والوقاية من اكتئاب ما بعد الولادة والولادة المبكرة.',
    riskPhysiologyEn: 'Low in mercury and exceptionally rich in DHA omega-3 fatty acids, crucial for fetal neocortex and retinal synthesis, and lowers premature birth risks.',
    safeConditionOrDoseAr: 'مسموح وموصى به مرتين إلى 3 مرات أسبوعياً (250-350 جم أسبوعياً)، بشرط الطهي الكامل حتى ينضج اللحم تماماً (حرارة 63° مئوية فأكثر).',
    safeConditionOrDoseEn: 'Recommended 2-3 servings (250-350g) weekly, provided it is cooked thoroughly to an internal temperature of at least 63°C.',
    recommendedAlternativeAr: 'أساس ممتاز للبروتين وأوميجا-3.',
    recommendedAlternativeEn: 'Excellent gold-standard seafood.',
    specialistTipAr: 'تناول وجبتين سمك مشوي في الأسبوع يرفع معدل ذكاء طفلك ويقوي شبكية عينه، فقط تأكدي من نضج اللحم وعدم وجود أي جزء نيء.',
    specialistTipEn: 'Two servings of well-cooked salmon or grilled tilapia weekly optimize fetal brain architecture safely.',
  },
  {
    id: 'deli-cold-cuts',
    nameAr: 'اللحوم المصنعة والباردة (لانشون، بسطرمة، بلوبيف، سلامي، هوت دوج)',
    nameEn: 'Processed Deli Meats & Cold Cuts',
    category: 'food',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'forbidden', third: 'forbidden', lactation: 'caution' },
    commonEgyptianExamples: 'لانشون لحم وفراخ، بسطرمة نية، سجق شرقي نص سوا، هوت دوج ميني، بلوبيف معلب بارد',
    riskPhysiologyAr: 'اللحوم الباردة والمصنعة هي المأوى الرئيسي لبكتيريا الليستيريا (Listeria monocytogenes) وطفيلي التوكسوبلازما. الليستيريا تستطيع النمو حتى داخل الثلاجة، وتخترق المشيمة مسببة تسمم دم جنيني، إجهاض مفاجئ، أو ولادة مبكرة.',
    riskPhysiologyEn: 'Cold cuts harbor Listeria monocytogenes and Toxoplasma. Listeria survives refrigerator temperatures and crosses the placental membrane, triggering miscarriage, stillbirth, or systemic fetal sepsis.',
    safeConditionOrDoseAr: 'ممنوعة تماماً كطعام بارد أو نيء. مسموحة فقط وبشرط صارم: تسخينها حتى الغليان الشديد وظهور البخار المتصاعد (Steaming Hot) للقضاء على البكتيريا.',
    safeConditionOrDoseEn: 'Forbidden cold. Only acceptable if heated until steaming hot (above 74°C) throughout right before consumption.',
    recommendedAlternativeAr: 'قطع لحم طازجة أو فراخ مشوية ومطهوة منزلياً في نفس اليوم ومحفوظة ساخنة.',
    recommendedAlternativeEn: 'Fresh home-cooked roast beef, oven-baked chicken slices served steaming hot.',
    specialistTipAr: 'بسطرمة على البيض بدون ما تتقلى كويس في السمنة لدرجة النضج الكامل ممنوعة قطيعاً! الليستيريا ملهاش ريحة ولا طعم مختلف، والحرارة العالية هي الحامي الوحيد.',
    specialistTipEn: 'Never consume raw pastrami or unheated luncheon. Listeria is invisible and odorless; only steaming heat destroys it.',
  },
  {
    id: 'fesikh-salted-herring',
    nameAr: 'الفسيخ والرنجة والملوحة والأسماك المملحة',
    nameEn: 'Fesikh, Salted & Fermented Fish',
    category: 'food',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'forbidden', third: 'forbidden', lactation: 'forbidden' },
    commonEgyptianExamples: 'فسيخ شم النسيم، ملوحة أسواني، رنجة مدخنة نيئة، سردين مملح بلدي',
    riskPhysiologyAr: 'الفسيخ يحمل خطر بكتيريا الكلوستريديوم بوتولينوم (Clostridium botulinum) التي تفرز أخطر سم عصبي بيولوجي يسبب شلل عضلات التنفس والوفاة. بالإضافة إلى أن نسب الصوديوم الهائلة تسبب ارتفاعاً حاداً في ضغط الدم، تسمم الحمل (Preeclampsia)، وانفصال المشيمة.',
    riskPhysiologyEn: 'Fesikh carries extreme risk of lethal Botulinum neurotoxin. Massive sodium load triggers malignant hypertension, preeclampsia, and placental abruption.',
    safeConditionOrDoseAr: 'الفسيخ والملوحة: ممنوعان قطعاً وبلا استثناء طوال أشهر الحمل! الرنجة: يُفضل تجنبها، وإذا لزم الأمر قطعة صغيرة جداً مغسولة بالماء والليمون ومشوية على النار لنصف ساعة ومطهية تماماً.',
    safeConditionOrDoseEn: 'Fesikh is absolutely contraindicated. Herring should be avoided; if eaten, only a tiny piece thoroughly grilled on direct flame.',
    recommendedAlternativeAr: 'تونا خفيفة مطهية أو سمك مشوي طازج غني بالليمون والكمون وبدون أملاح مفرطة.',
    recommendedAlternativeEn: 'Fresh grilled fish seasoned with lemon and herbs without excessive sodium.',
    specialistTipAr: 'الفسيخ في الحمل انتحار طبي للجنين! حتى الرنجة لو ملحها عالي ممكن ترفع ضغطك وتدخلك في تسمم حمل في ساعات معدودة.',
    specialistTipEn: 'Fesikh during pregnancy is a medical emergency waiting to happen. The sodium and anaerobic toxins put fetal life at immediate risk.',
  },
  {
    id: 'unpasteurized-cheeses',
    nameAr: 'الأجبان غير المبسترة (الجبنة القريش الفلاحي غير المغلية، الريكفورد، الرومي القديمة)',
    nameEn: 'Unpasteurized Cheeses & Soft Cheeses',
    category: 'food',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'forbidden', third: 'forbidden', lactation: 'caution' },
    commonEgyptianExamples: 'جبنة قريش فلاحي من مصادر مجهولة، جبنة رومي قديمة ومعفنة، جبنة ريكفورد زرقاء، جبنة فيتا غير معقمة',
    riskPhysiologyAr: 'الحليب والأجبان غير المبسترة بيئة مثالية لنمو بكتيريا الليستيريا وبكتيريا البروسيلا. تصيب الجنين دون أن تشعر الأم بأعراض قوية (فقط شبه إنفلونزا خفيفة)، وتؤدي للإجهاض الصامت وموت الجنين في الرحم.',
    riskPhysiologyEn: 'Unpasteurized milk and soft cheeses carry Listeria and Brucella. Infection can be asymptomatic in mothers while devastating the placenta and fetus, causing stillbirth.',
    safeConditionOrDoseAr: 'ممنوعة تماماً إلا إذا كانت الجبنة القريش مصنوعة من لبن مغلي ومبستر جيداً، أو تم غليها وطبخها في الفرن حتى درجة الفوران.',
    safeConditionOrDoseEn: 'Forbidden unless labeled as made from pasteurized milk or thoroughly cooked/melted at boiling temperatures in baked meals.',
    recommendedAlternativeAr: 'الأجبان المبسترة المعبأة آلياً (جبنة شيدر، موتزاريلا مبسترة، جبن مثلثات معتمدة، لبن معقم ومغلي).',
    recommendedAlternativeEn: 'Commercially pasteurized cheddar, pasteurized mozzarella, hard Swiss cheese, and UHT pasteurized milk.',
    specialistTipAr: 'عايزة تاكلي قريش فلاحي؟ اقطعيها واطبخيها في طاسة مع طماطم وزيت زيتون لحد ما تغلي وتبقلل على النار، الغليان بيقتل أي بكتيريا فوراً.',
    specialistTipEn: 'If craving artisanal cottage cheese, simmer it thoroughly on the stovetop with tomatoes and olive oil until bubbling hot.',
  },
  {
    id: 'raw-eggs-salmonella',
    nameAr: 'البيض النيئ والبيض العيون غير المكتمل والمايونيز البيتي',
    nameEn: 'Raw or Undercooked Eggs & Homemade Mayonnaise',
    category: 'food',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'forbidden', third: 'forbidden', lactation: 'caution' },
    commonEgyptianExamples: 'بيض عيون سائل الصفار، بيض مسلوق نص سوا (برشت)، مايونيز وسلطة سيزر منزلية، عجينة كيك نية',
    riskPhysiologyAr: 'البيض غير كامل الطهي قد يتلوث ببكتيريا السالمونيلا (Salmonella enterica). التسمم بالسالمونيلا يسبب قيئاً وإسهالاً حاداً وجفافاً شديداً وانقباضات رحمية مبكرة تؤدي للإجهاض.',
    riskPhysiologyEn: 'Undercooked eggs harbor Salmonella. Acute salmonellosis causes systemic dehydration, electrolyte collapse, and severe uterine cramping threatening premature labor.',
    safeConditionOrDoseAr: 'البيض آمن وممتاز بشرط: طهي الصفار والبياض حتى يتماسكا تماماً ويصبحا صلبين وغير سائلين.',
    safeConditionOrDoseEn: 'Safe and beneficial ONLY when both yolk and white are cooked until firm with no liquid core.',
    recommendedAlternativeAr: 'بيض مسلوق ناضج تماماً (Hard-boiled)، أومليت مطهو جيداً من الجانبين، مايونيز تجاري مبستر معلب.',
    recommendedAlternativeEn: 'Hard-boiled eggs, fully cooked omelettes, and commercially bottled pasteurized mayonnaise.',
    specialistTipAr: 'البيض من أعظم مصادر الكولين والبروتين لبناء دماغ الجنين، بس بلاش البيض النص سوا أبداً لحد ما تقومي بالسلامة.',
    specialistTipEn: 'Eggs provide crucial choline for fetal brain development, but always ensure the yolk is completely solidified.',
  },

  // 2. Medications
  {
    id: 'paracetamol-safe',
    nameAr: 'الباراسيتامول / بنادول أزرق / نوفالدول (خافض ومسكن)',
    nameEn: 'Paracetamol / Acetaminophen',
    category: 'medication',
    safetyStatus: 'safe',
    fdaCategory: 'B',
    trimesterImpact: { first: 'safe', second: 'safe', third: 'safe', lactation: 'safe' },
    commonEgyptianExamples: 'بانادول الأزرق العادي، بارامول، سيتال، نوفالدول 1000، أدول',
    riskPhysiologyAr: 'الباراسيتامول النقي هو خط الأمان الأول المعتمد عالمياً لتسكين الصداع وخفض الحرارة أثناء الحمل. لا يسبب تشوهات ولا يؤثر على سيولة الدم ولا يغلق القناة الشريانية.',
    riskPhysiologyEn: 'Pure acetaminophen is the globally accepted first-line analgesic and antipyretic in all trimesters; it does not impair renal perfusion or close the ductus arteriosus.',
    safeConditionOrDoseAr: 'قرص 500 إلى 1000 مجم عند اللزوم، بحد أقصى 3 جرام في اليوم، ولأقصر فترة ممكنة. تجنبي تماماً الأنواع المضاف إليها كافيين (مثل بانادول إكسترا الأحمر).',
    safeConditionOrDoseEn: '500-1000mg as needed, maximum 3g/day for short durations. Avoid formulations containing caffeine (e.g. Panadol Extra).',
    recommendedAlternativeAr: 'الخيار الأول والآمن تماماً.',
    recommendedAlternativeEn: 'First-line therapy for maternal pain and fever.',
    specialistTipAr: 'الحرارة العالية فوق 38.5° أخطر على الجنين من البنادول! خدي قرصين بنادول أزرق عادي فوراً لتنزيل الحرارة وكمادات مية دافية.',
    specialistTipEn: 'A high maternal fever (>38.5°C) is far more dangerous to fetal neural tubes than paracetamol. Treat fevers promptly.',
  },
  {
    id: 'nsaids-brufen-voltaren',
    nameAr: 'البروفين، الفولتارين، الكتافلام، والكيتوفان (مضادات الالتهاب اللاستيرويدية)',
    nameEn: 'NSAIDs (Ibuprofen, Diclofenac, Ketoprofen)',
    category: 'medication',
    safetyStatus: 'forbidden',
    fdaCategory: 'D',
    trimesterImpact: { first: 'caution', second: 'caution', third: 'forbidden', lactation: 'safe' },
    commonEgyptianExamples: 'بروفين 400/600، فولتارين، كتافلام، أنتيفلام، كيتوفان، باى الكوفان، ديكلاك',
    riskPhysiologyAr: 'كارثة كبرى خاصة بعد الأسبوع 20 والثلث الثالث: تثبط إنزيم البروستاجلاندين مما يؤدي للإغلاق المبكر للقناة الشريانية في قلب الجنين (Premature closure of Ductus Arteriosus)، ويسبب فشل كلوي حاد للجنين وجفاف السائل الأمنيوسي المحيط به (Oligohydramnios).',
    riskPhysiologyEn: 'NSAIDs block prostaglandins, causing premature constriction of the fetal ductus arteriosus, pulmonary hypertension, fetal renal impairment, and severe oligohydramnios.',
    safeConditionOrDoseAr: 'ممنوع منعاً باتاً وقاطعاً في الثلث الثالث (من الشهر السابع حتى الولادة). في الشهور الأولى لا يُستخدم إلا بأمر كتابي من الطبيب في أضيق الحدود.',
    safeConditionOrDoseEn: 'Strictly contraindicated in the third trimester. Avoid in trimesters 1 and 2 unless specifically directed by your obstetrician.',
    recommendedAlternativeAr: 'الباراسيتامول النقي، والكمادات الدافئة أو الباردة الموضعية.',
    recommendedAlternativeEn: 'Pure paracetamol and localized non-pharmacological hot/cold compresses.',
    specialistTipAr: 'لو عندك مغص أو وجع ضهر في الشهر الثامن، أوعي تاخدي كتافلام أو بروفين! القرص ده ممكن يقفل شريان قلب الجنين في ساعات ويسبب ولادة قيصرية طارئة.',
    specialistTipEn: 'Never take Voltaren or Brufen for late pregnancy backache. It can trigger irreversible fetal pulmonary hypertension within hours.',
  },
  {
    id: 'pseudoephedrine-cold-combo',
    nameAr: 'أدوية البرد المركبة (كونجستال، كومتركس، باور كابس، 123)',
    nameEn: 'Combo Cold Medicines (Pseudoephedrine / Phenylephrine)',
    category: 'medication',
    safetyStatus: 'forbidden',
    fdaCategory: 'C',
    trimesterImpact: { first: 'forbidden', second: 'caution', third: 'caution', lactation: 'caution' },
    commonEgyptianExamples: 'كونجستال، كومتركس، فلورست، باور كابس، 123، بنادول كولد آند فلو',
    riskPhysiologyAr: 'تحتوي على مادة قابضة للأوعية الدموية (سودوإيفيدرين أو فينيليفرين). تسبب انقباض شرايين المشيمة مما يقلل تدفق الدم والأكسجين للطفل، وترفع ضغط دم الأم، وترتبط بعيوب جدار البطن الجنيني (Gastroschisis) في أول 3 أشهر.',
    riskPhysiologyEn: 'Vasoconstrictors constrict uterine and placental arteries, reducing fetal perfusion, spiking maternal BP, and are linked to first-trimester fetal gastroschisis.',
    safeConditionOrDoseAr: 'ممنوعة تماماً في الثلث الأول، ومحظورة لمن تعاني من ضغط دم مرتفع طوال الحمل.',
    safeConditionOrDoseEn: 'Avoid completely in the first trimester and whenever maternal blood pressure is elevated.',
    recommendedAlternativeAr: 'بخاخات ماء البحر المعقمة (Physiomer / Sinomarin)، استنشاق بخار النعناع، وباراسيتامول للصداع.',
    recommendedAlternativeEn: 'Hypertonic seawater sprays, steam inhalation, and pure paracetamol.',
    specialistTipAr: 'البرد في الحمل علاجه: شوربة فراخ دافية، ليمون، بخاخ ماء بحر للأنف، وبنادول أزرق للصداع. ابعدي عن كبسولات البرد المركبة تماماً.',
    specialistTipEn: 'Manage colds with saline nasal flushes, warm broths, vitamin C rich lemon, and plain paracetamol.',
  },
  {
    id: 'isotretinoin-acne',
    nameAr: 'أدوية حب الشباب الرتينويدية (نت لوك، كوراكني، رواكوتان)',
    nameEn: 'Oral Isotretinoin (Roaccutane, Netlook, Curacne)',
    category: 'medication',
    safetyStatus: 'forbidden',
    fdaCategory: 'X',
    trimesterImpact: { first: 'forbidden', second: 'forbidden', third: 'forbidden', lactation: 'forbidden' },
    commonEgyptianExamples: 'نت لوك كبسول، كوراكني، رواكوتان، إيزوتريتينوين',
    riskPhysiologyAr: 'أخطر دواء ماسخ للأجنة في تاريخ الطب الحديث (Category X بنسبة تشوه تتجاوز 35%). يسبب استسقاء الدماغ، تخلف عقلي، تشوه صوان الأذن، وعيوب خلقية مدمرة في القلب والأوعية الكبرى.',
    riskPhysiologyEn: 'One of the most potent teratogens known. Induces embryopathy in >35% of exposed fetuses: microcephaly, hydrocephalus, external ear absence, and conotruncal heart defects.',
    safeConditionOrDoseAr: 'ممنوع منعاً قاطعاً! يجب إيقافه قبل التفكير في الحمل بشهر كامل على الأقل، وإجراء فحص حمل سلبي مرتين.',
    safeConditionOrDoseEn: 'Strictly prohibited. Must be discontinued at least 1-3 months prior to conception under strict contraceptive protocols.',
    recommendedAlternativeAr: 'غسول حمض الأزيليك (Azelaic acid) الموضعي الآمن، أو محلول إريثروميسين موضعي بوصفة الطبيب.',
    recommendedAlternativeEn: 'Topical azelaic acid cream or topical erythromycin solution under dermatological supervision.',
    specialistTipAr: 'لو بتاخدي نت لوك واكتشفتي إنك حامل لازم تتصلي بطبيبك في نفس اليوم! ممنوع نهائياً لمسه أثناء الحمل.',
    specialistTipEn: 'Notify your obstetrician immediately if pregnancy occurs while on oral isotretinoin.',
  },
  {
    id: 'antacids-reflux',
    nameAr: 'أدوية الحموضة والارتجاع (جافيسكون، مالوكس، إبيكوغل)',
    nameEn: 'Antacids & Reflux Suspensions (Gaviscon, Maalox)',
    category: 'medication',
    safetyStatus: 'safe',
    fdaCategory: 'B',
    trimesterImpact: { first: 'safe', second: 'safe', third: 'safe', lactation: 'safe' },
    commonEgyptianExamples: 'جافيسكون شراب أو أقراص مضغ، مالوكس، إبيكوغل، ميكوجيل',
    riskPhysiologyAr: 'مستحضرات الألجينات وهيدروكسيد الألومنيوم والماغنسيوم تعمل موضعياً داخل المعدة بعمل طبقة رغوية واقية لمنع ارتجاع الحمض دون امتصاص جهازي للمشيمة.',
    riskPhysiologyEn: 'Alginates and non-systemic magnesium/aluminum salts create a physical raft over gastric contents without crossing the placental barrier.',
    safeConditionOrDoseAr: 'آمنة ومصرح بها بعد الوجبات وقبل النوم عند اللزوم. تجنبي الفوارات المحتوية على بيكربونات الصوديوم (مثل فوار راني أو فوار فواكه) لأنها ترفع الصوديوم وتسبب تورم القدمين.',
    safeConditionOrDoseEn: 'Safe after meals and at bedtime. Avoid sodium bicarbonate powders which promote fluid retention and edema.',
    recommendedAlternativeAr: 'تقسيم الوجبات لوجبات صغيرة متفرقة، عدم الاستلقاء بعد الأكل مباشرة، ورفع المخدة 15 سم.',
    recommendedAlternativeEn: 'Small frequent meals, avoiding supine position for 2 hours postprandial, and head-of-bed elevation.',
    specialistTipAr: 'الحموضة بتزيد لأن هرمون الحمل بيرخي صمام المعدة. خدي معلقة جافيسكون بعد الأكل واشربي لبن ساقع متقطع هترتاحي جداً.',
    specialistTipEn: 'Pregnancy progesterone relaxes the esophageal sphincter. Gaviscon after meals combined with small sips of cold milk offers rapid safe relief.',
  },

  // 3. Supplements
  {
    id: 'folic-acid-essential',
    nameAr: 'حمض الفوليك (فوليك أسيد 400-500 ميكروجرام)',
    nameEn: 'Folic Acid (400-500 mcg daily)',
    category: 'supplement',
    safetyStatus: 'safe',
    fdaCategory: 'A',
    trimesterImpact: { first: 'safe', second: 'safe', third: 'safe', lactation: 'safe' },
    commonEgyptianExamples: 'فوليك أسيد 500 ميكروجرام، فوليكاب، فولفيت، أقراص حمض الفوليك المصرية',
    riskPhysiologyAr: 'العنصر الأكثر إنقاذاً للأجنة؛ ضروري لانقسام الخلايا وبناء الحمض النووي (DNA). نقصه يسبب عيوب الأنبوب العصبي القاتلة مثل الصلب المشقوق (Spina Bifida) وانعدام الدماغ (Anencephaly).',
    riskPhysiologyEn: 'Essential co-factor for nucleotide synthesis and neural tube closure by embryonic day 28. Deficiency precipitates spina bifida and anencephaly.',
    safeConditionOrDoseAr: 'قرص يومياً (400 إلى 500 ميكروجرام) من قبل الحمل وحتى نهاية الأسبوع 12 (نهاية الشهر الثالث). مريضات السكري أو من لديهن تاريخ عيوب خلقية يحتجن 4-5 مجم بوصفة الطبيب.',
    safeConditionOrDoseEn: '400-500 mcg daily preconception through week 12. High-risk mothers (diabetic/epileptic) require 4-5 mg under medical guidance.',
    recommendedAlternativeAr: 'الفوليك أسيد إلزامي ولا غنى عنه.',
    recommendedAlternativeEn: 'Indispensable gold-standard prenatal supplement.',
    specialistTipAr: 'الأنبوب العصبي للجنين بيقفل في اليوم الـ 28، يعني قبل ما أمهات كتير تعرف إنها حامل! الفوليك أسيد لازم يتاخد من أول يوم زواج وتخطيط للحمل.',
    specialistTipEn: 'The fetal neural tube closes around day 28 of gestation. Take folic acid starting preconception.',
  },
  {
    id: 'iron-calcium-timing',
    nameAr: 'حبوب الحديد والكالسيوم (قواعد التوقيت والامتصاص)',
    nameEn: 'Iron & Calcium Prenatal Supplements',
    category: 'supplement',
    safetyStatus: 'safe',
    fdaCategory: 'A',
    trimesterImpact: { first: 'caution', second: 'safe', third: 'safe', lactation: 'safe' },
    commonEgyptianExamples: 'فيروجلوبين، فيروترون، كالسيترون، أوستيوكير، برافوتين أكياس',
    riskPhysiologyAr: 'حجم دم الأم يزداد بنسبة 40-50% لتغذية الجنين، مما يستهلك مخزون الحديد ويسبب أنيميا شديدة تعرض الأم لنزيف الولادة والطفل لنقص الوزن. الكالسيوم ضروري لبناء عظام وأسنان الجنين وحماية عظام الأم.',
    riskPhysiologyEn: 'Maternal blood volume expands by ~50%, requiring substantial iron to avoid perinatal anemia and fetal growth restriction. Calcium prevents maternal bone demineralization.',
    safeConditionOrDoseAr: 'يبدأ الحديد بعد انتهاء الثلث الأول (الأسبوع 13). القاعدة الذهبية الطبية: (افصلي ساعتين كاملتين بين قرص الحديد وقرص الكالسيوم أو منتجات الألبان والشاي) لأن الكالسيوم والتانين يمنعان امتصاص الحديد بنسبة 80%!',
    safeConditionOrDoseEn: 'Start after week 12. Crucial rule: separate iron from calcium supplements, tea, and dairy by at least 2 full hours to avoid severe absorption inhibition.',
    recommendedAlternativeAr: 'خذي قرص الحديد مع كوب عصير برتقال طازج (فيتامين C يضاعف امتصاص الحديد 3 أضعاف).',
    recommendedAlternativeEn: 'Take iron with a glass of fresh orange juice; ascorbic acid triples iron bioavailability.',
    specialistTipAr: 'أكبر غلطة بتعملها الحوامل: تاخد قرص الحديد مع كوباية لبن أو بعد الغدا مع كوباية شاي! كده كأنها رمت القرص في الأرض لأن الحديد مبيتمصش. خدي الحديد الصبح بالعصير، والكالسيوم بالليل قبل النوم.',
    specialistTipEn: 'Never take iron with milk or tea. Take iron in the morning with vitamin C, and calcium at night before sleep.',
  },

  // 4. Beverages & Herbs
  {
    id: 'cinnamon-danger',
    nameAr: 'مغلي القرفة المركزة وقرنفل الأعشاب',
    nameEn: 'Concentrated Cinnamon & Herbal Infusions',
    category: 'beverage',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'caution', third: 'caution', lactation: 'safe' },
    commonEgyptianExamples: 'كوب قرفة باللبن مغلي، مشروب قرفة مركز، عيدان قرفة مغلية على الريق',
    riskPhysiologyAr: 'القرفة تحتوي على مركبات سينامالدهيد والكومارين بتركيزات منشطة، وهي محفز قوي لانقباضات عضلات الرحم (Uterine contractions) ومدرة للحيض، وتزيد احتمالية النزيف المهبلي والإسقاط في أول 12 أسبوع.',
    riskPhysiologyEn: 'Cinnamaldehyde stimulates uterine smooth muscle contractions and pelvic blood flow, substantially elevating early pregnancy bleeding and spontaneous abortion hazards.',
    safeConditionOrDoseAr: 'ممنوع شرب مغلي القرفة المركز في الثلث الأول والثاني. رشة خفيفة جداً من القرفة المطحونة على الحلويات أو الشوربة كتوابل طعام آمنة تماماً.',
    safeConditionOrDoseEn: 'Avoid concentrated cinnamon infusions in trimesters 1 and 2. Minimal pinches used as a culinary food spice are safe.',
    recommendedAlternativeAr: 'النعناع الدافئ، الينسون الخفيف، أو مغلي الزنجبيل الطازج الخفيف.',
    recommendedAlternativeEn: 'Warm mint tea, mild aniseed, or light fresh ginger tea.',
    specialistTipAr: 'القرفة زمان كانوا بيشربوها للست لما يجيلها الطلق عشان تحمي الوجع، متجيش إنتِ في أول شهر تشربيها كل يوم! رشة خفيفة على الأكل تمام، لكن كوباية مغلية مركزة ممنوعة.',
    specialistTipEn: 'Cinnamon has historically been used to stimulate stalled labor. Do not consume concentrated boiled cinnamon during early pregnancy.',
  },
  {
    id: 'caffeine-coffee-tea',
    nameAr: 'القهوة، الشاي، النسكافيه، والكولا (الكافيين)',
    nameEn: 'Caffeine (Coffee, Black Tea & Colas)',
    category: 'beverage',
    safetyStatus: 'caution',
    trimesterImpact: { first: 'caution', second: 'caution', third: 'caution', lactation: 'caution' },
    commonEgyptianExamples: 'فنجان قهوة تركي، شاي كشري ثقيل، مج نسكافيه 3×1، علبة كولا، مشروبات دايت كولا',
    riskPhysiologyAr: 'الكافيين يعبر المشيمة بحرية وسرعة، لكن كبد الجنين النامي يفتقر للإنزيمات اللازمة لتكسيره فيبقى في دمه لساعات طويلة. يسبب تضيق الأوعية المشيمية، تسارع ضربات قلب الجنين، وانخفاض وزن الولادة.',
    riskPhysiologyEn: 'Caffeine crosses placenta readily while fetal hepatic CYP1A2 enzymes are immature. Elevated doses constrict placental vessels and correlate with intrauterine growth restriction.',
    safeConditionOrDoseAr: 'الحد الأقصى الطبي العالمي الصارم: 200 مجم كافيين يومياً (ما يعادل فنجان قهوة تركي صغير، أو كوبين شاي متوسطين، أو مج نسكافيه كلاسيك واحد). ممنوع تجاوز هذا الحد.',
    safeConditionOrDoseEn: 'Strict safe threshold is under 200mg total caffeine daily (roughly 1 small cup of brewed coffee or 2 moderate cups of black tea).',
    recommendedAlternativeAr: 'القهوة منزوعة الكافيين (Decaf)، شاي الأعشاب المسموح (نعناع، بابونج)، والمياه الفوارة بنكهات طبيعية.',
    recommendedAlternativeEn: 'Decaffeinated coffee, rooibos tea, mint, and naturally infused lemon water.',
    specialistTipAr: 'بتحبي تفوقي الصبح؟ فنجان قهوتك الصغير كفاية جداً، وباقي اليوم اشربي مية وعصاير فرش. متنسيش إن الشوكولاتة والكولا فيهم كافيين محسوب من الـ 200 مجم!',
    specialistTipEn: 'One small morning coffee is fine, but remember that chocolate, soda, and teas also count toward your 200mg daily ceiling.',
  },
  {
    id: 'energy-drinks-danger',
    nameAr: 'مشروبات الطاقة (ريد بول، ستينج، مونستر)',
    nameEn: 'Commercial Energy Drinks (Red Bull, Sting, Monster)',
    category: 'beverage',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'forbidden', third: 'forbidden', lactation: 'forbidden' },
    commonEgyptianExamples: 'ريد بول، ستينج، بايسون، مونستر، مشروبات طاقة محلية',
    riskPhysiologyAr: 'تحتوي على قنابل كافيين تتجاوز 300 مجم مضافاً إليها التورين (Taurine) والجينسنج والجوارانا والسكريات الفائقة. تسبب خفقاناً وارتفاعاً حاداً في ضغط الأم، ونقص تروية الجنين.',
    riskPhysiologyEn: 'Packed with extreme caffeine doses plus synthetic taurine, guarana, and glucuronolactone, triggering maternal cardiac arrhythmias, acute hypertension, and placental hypoperfusion.',
    safeConditionOrDoseAr: 'ممنوعة منعاً باتاً ومطلقاً طوال شهور الحمل والرضاعة.',
    safeConditionOrDoseEn: 'Completely forbidden throughout all pregnancy and lactation stages.',
    recommendedAlternativeAr: 'سموذي فواكه طازجة مع زبادي، عصائر برتقال وموز طبيعية لمنح طاقة حقيقية ونظيفة.',
    recommendedAlternativeEn: 'Fresh whole-fruit smoothies blended with Greek yogurt for sustained clean energy.',
    specialistTipAr: 'مشروبات الطاقة بتعمل خفقان سريع لقلب طفلك وبترفع ضغطك وتزود فرصة تسمم الحمل. ابعدي عنها تماماً.',
    specialistTipEn: 'Energy drinks trigger fetal tachycardia and maternal blood pressure spikes; they have zero place in pregnancy.',
  },
  {
    id: 'ginger-safe-nausea',
    nameAr: 'الزنجبيل الطازج والمغلي الخفيف (علاج غثيان الصباح)',
    nameEn: 'Fresh Ginger (Gold-Standard Morning Sickness Remedy)',
    category: 'beverage',
    safetyStatus: 'safe',
    trimesterImpact: { first: 'safe', second: 'safe', third: 'safe', lactation: 'safe' },
    commonEgyptianExamples: 'شريحة زنجبيل طازج في ماء دافئ مع ليمون وعسل، زنجبيل بودرة خفيف، شاي زنجبيل',
    riskPhysiologyAr: 'مركبات الجينجيرول (Gingerols) في الزنجبيل تهدئ مستقبلات السيروتونين في المعدة والجهاز العصبي، وتعد الخيار العشبي الأول عالمياً المثبت أمانه في علاج قياء وغثيان الثلث الأول.',
    riskPhysiologyEn: 'Gingerols modulate gastric motility and antagonize central 5-HT3 receptors, clinically proven to quell first-trimester nausea without teratogenic risks.',
    safeConditionOrDoseAr: 'آمن وموصى به بجرعة معتدلة: حتى 1000 مجم زنجبيل يومياً (ما يعادل كوب إلى كوبين شاي زنجبيل خفيف). تجنبي كبسولات الزنجبيل شديدة التركيز في الشهور الأخيرة.',
    safeConditionOrDoseEn: 'Safe up to 1000mg dried root daily (or 1-2 cups of freshly steeped mild tea). Avoid mega-dose concentrated ginger extract capsules.',
    recommendedAlternativeAr: 'العلاج الطبيعي الأفضل لغثيان الحمل.',
    recommendedAlternativeEn: 'Top natural remedy for pregnancy hyperemesis and morning sickness.',
    specialistTipAr: 'قومي الصبح خدي بسكوتة مالحة مع رشفات من شاي زنجبيل دافي عليه نقطتين ليمون، الغثيان هيهدى في خلال 10 دقايق بأمان تام.',
    specialistTipEn: 'Nibble on a dry cracker upon waking and sip warm mild ginger lemon tea to settle morning nausea within minutes.',
  },

  // 5. Lifestyle, Habits & Beauty
  {
    id: 'cat-litter-toxoplasmosis',
    nameAr: 'تنظيف صندوق فضلات القطط والتعامل مع البراز (داء القطط)',
    nameEn: 'Cat Litter Box Cleaning (Toxoplasmosis Risk)',
    category: 'lifestyle',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'forbidden', third: 'forbidden', lactation: 'safe' },
    commonEgyptianExamples: 'تغيير رمل القطط في المنزل، تنظيف الحمام، لمس مخلفات القطط باليد',
    riskPhysiologyAr: 'براز القطط المصابة يحتوي على حويصلات طفيل التوكسوبلازما (Toxoplasma gondii). إذا التقطت الأم العدوى لأول مرة أثناء الحمل، يعبر الطفيل المشيمة مسبباً تشوهات دماغية خطيرة (Hydrocephalus)، تكلسات في المخ، وفقداناً دائماً للبصر لدى الجنين.',
    riskPhysiologyEn: 'Feline feces harbor Toxoplasma gondii oocysts. Primary maternal infection during pregnancy crosses to the fetus, causing chorioretinitis, hydrocephalus, and cerebral calcifications.',
    safeConditionOrDoseAr: 'ممنوع منعاً باتاً أن تنظف الحامل صندوق فضلات القطط بنفسها! يجب أن يقوم به شخص آخر يومياً. إذا اضطرت لذلك في ظروف قاهرة: ارتداء قفازات سميكة وقناع وغسل اليدين بالماء والصابون جيداً.',
    safeConditionOrDoseEn: 'Strictly delegate litter box duties to someone else. If unavoidable, wear heavy disposable gloves, FFP2 mask, and disinfect hands thoroughly.',
    recommendedAlternativeAr: 'تكليف الزوج أو أحد أفراد الأسرة بتغيير الرمل يومياً، وإبقاء القطة داخل المنزل مع إطعامها طعاماً جافاً ومطهياً فقط.',
    recommendedAlternativeEn: 'Have family members clean the litter daily; feed cats only commercial dry food and keep them indoors.',
    specialistTipAr: 'مش لازم تتخلصي من قطتك، بس الرمل ممنوع تلمسيه نهائياً! وخلي الزوج يغيره كل 24 ساعة لأن حويصلة الطفيل بتحتاج يومين عشان تبقى معدية.',
    specialistTipEn: 'You do not need to give away your cat, but never handle the litter box yourself. Cleaning it daily prevents oocysts from sporulating.',
  },
  {
    id: 'sauna-hot-tubs',
    nameAr: 'الساونا، الجاكوزي الساخن، والحمامات البخارية (>39° مئوية)',
    nameEn: 'Saunas, Hot Tubs & Steam Baths (>39°C)',
    category: 'lifestyle',
    safetyStatus: 'forbidden',
    trimesterImpact: { first: 'forbidden', second: 'caution', third: 'caution', lactation: 'safe' },
    commonEgyptianExamples: 'غرف الساونا والبخار في الجيم والسبا، الحمام المغربي شديد السخونة، حوض الجاكوزي الحار',
    riskPhysiologyAr: 'التعرض لحرارة عالية لفترة طويلة يرفع درجة حرارة جسم الأم المركزية فوق 39° مئوية (Maternal Hyperthermia). هذه السخونة في الأسابيع الأولى تدمر خلايا الأنبوب العصبي للجنين وتضاعف خطر العيوب الخلقية في الحبل الشوكي والمخ.',
    riskPhysiologyEn: 'Prolonged external heat elevates maternal core temperature above 39°C. First-trimester hyperthermia halts neuroblast mitotic division and doubles neural tube defect rates.',
    safeConditionOrDoseAr: 'ممنوع الجلوس في الساونا أو أحواض الجاكوزي الحارة. الاستحمام بالماء الدافئ العادي آمن طالما لا يسبب احمرار الجلد أو التعرق الشديد.',
    safeConditionOrDoseEn: 'Avoid hot tubs and steam saunas. Warm showers and temperate baths that do not raise core body temperature are completely fine.',
    recommendedAlternativeAr: 'حمامات دافئة لطيفة بدرجة حرارة الغرفة (أقل من 37° مئوية) لتهدئة عضلات الظهر.',
    recommendedAlternativeEn: 'Comfortable warm baths kept below 37°C for relaxing maternal lumbar musculature.',
    specialistTipAr: 'أي حمام يخليكي تعرقي أو وشك يحمر جامد معناه إن حرارة دمك رفعت ووصلت للبيبي. الدش يكون دافي خفيف ومريح مش مسلوق.',
    specialistTipEn: 'If a bath causes profuse sweating or skin flushing, it is dangerously hot for your baby. Keep water comfortably temperate.',
  },
  {
    id: 'hair-dye-bleach',
    nameAr: 'صبغات الشعر الكيميائية وسحب اللون (الأمونيا والتشقير)',
    nameEn: 'Chemical Hair Dyes & Bleaching',
    category: 'lifestyle',
    safetyStatus: 'caution',
    trimesterImpact: { first: 'caution', second: 'safe', third: 'safe', lactation: 'safe' },
    commonEgyptianExamples: 'صبغة شعر بالأمونيا، بودرة تفتيح وسحب لون، بروتين وكيراتين الشعر الكيميائي',
    riskPhysiologyAr: 'الامتصاص الجلدي لصبغات الشعر ضئيل جداً، لكن الأبخرة الكيميائية المستنشقة (خاصة في صالونات التجميل المغلقة) قد تسبب تحسساً واختناقاً. التحذير الأهم هو من مستحضرات فرد الشعر (البروتين والكيراتين) التي تحتوي على الفورمالين المسرطن والمشوه.',
    riskPhysiologyEn: 'Systemic transdermal dye absorption is minimal, but aerosol inhalation in poorly ventilated salons is hazardous. Brazilian blowouts containing formaldehyde are strictly contraindicated.',
    safeConditionOrDoseAr: 'يُفضل تأجيل صبغ الشعر لما بعد الأسبوع 13 (نهاية الثلث الأول). استخدام صبغات خالية من الأمونيا، وتطبيقها في مكان مفتوح جيد التهوية، وعدم ترك الصبغة على الفروة أكثر من الوقت المحدد.',
    safeConditionOrDoseEn: 'Defer hair coloring until after week 13. Choose ammonia-free formulas, apply in an airy ventilated space, and wear gloves.',
    recommendedAlternativeAr: 'الحناء الطبيعية النقية 100% الخالية من الرصاص والمعادن الثقيلة، وتقنية الهايلايت (بعيداً عن فروة الرأس).',
    recommendedAlternativeEn: 'Pure certified organic henna without metallic salts, or foil highlights kept strictly off the scalp.',
    specialistTipAr: 'استني أول 3 شهور يعدوا على خير وبعد كدة اصبغي بصبغة زيرو أمونيا في مكان شباكه مفتوح. وبروتين الشعر اللي بريحته نفاذة ممنوع منعاً باتاً طوال الحمل!',
    specialistTipEn: 'Wait until the second trimester, opt for ammonia-free tints with good ventilation, and never use formaldehyde-based keratin smoothing.',
  },
  {
    id: 'supine-sleep-third-trimester',
    nameAr: 'وضعية النوم على الظهر في الثلث الأخير (بعد الشهر السادس)',
    nameEn: 'Supine Sleep Position in the Third Trimester',
    category: 'lifestyle',
    safetyStatus: 'caution',
    trimesterImpact: { first: 'safe', second: 'safe', third: 'caution', lactation: 'safe' },
    commonEgyptianExamples: 'النوم مفرودة على الظهر لساعات طويلة أثناء النوم ليلاً بعد الأسبوع 28',
    riskPhysiologyAr: 'في الشهور الأخيرة، يزن الرحم والجنين والمشيمة عدة كيلوجرامات. النوم على الظهر يجعل هذا الوزن يضغط مباشرة على الوريد الأجوف السفلي (IVC Compression) مما يعيق عودة الدم لقلب الأم ويقلل تدفق الأكسجين للمشيمة ونبض الجنين.',
    riskPhysiologyEn: 'A heavy late-gestation uterus compresses the maternal inferior vena cava when supine, diminishing cardiac preload, cardiac output, and uteroplacental perfusion by up to 25%.',
    safeConditionOrDoseAr: 'بعد الشهر السادس: الوضعية الطبية المثالية والموصى بها هي النوم على الجانب (ويُفضل الجانب الأيسر - Left Lateral) مع وضع مخدة بين الركبتين وتحت البطن.',
    safeConditionOrDoseEn: 'From week 28 onward, sleep on your side—ideally the left lateral position—using a supportive pillow between knees and under the abdomen.',
    recommendedAlternativeAr: 'النوم على الجانب الأيسر يمنح المشيمة والكليتين أقصى تدفق دموي وأكسجين ويقلل تورم القدمين.',
    recommendedAlternativeEn: 'Left side sleeping optimizes placental vascular perfusion, maternal renal clearance, and prevents postural hypotension.',
    specialistTipAr: 'لو صحيتي ولقيتي نفسك نايمة على ضهرك متقلقيش ومتخافيش! فقط لفي براحة ونامي على جنبك الشمال وحطي مخدة بين رجليكي لدعم ضهرك.',
    specialistTipEn: 'Do not panic if you awaken on your back; simply roll gently onto your left side with a supportive pillow.',
  },
  {
    id: 'air-travel-flying',
    nameAr: 'السفر وركوب الطائرات (Air Travel)',
    nameEn: 'Air Travel & Flying during Pregnancy',
    category: 'lifestyle',
    safetyStatus: 'safe',
    trimesterImpact: { first: 'safe', second: 'safe', third: 'caution', lactation: 'safe' },
    commonEgyptianExamples: 'رحلات الطيران للعمل أو السياحة، السفر لأداء العمرة في الحمل',
    riskPhysiologyAr: 'السفر بالطائرة آمن للحوامل الأصحاء. الخطر الأساسي ينبع من الجلوس الطويل والجفاف في كابينة الطائرة، حيث تزداد لزوجة دم الحامل لستة أضعاف، مما يرفع خطر الجلطات الوريدية العميقة (DVT).',
    riskPhysiologyEn: 'Air travel itself is safe for uncomplicated pregnancies. The chief hazard is prolonged seated immobility and cabin dehydration accelerating deep vein thrombosis (DVT).',
    safeConditionOrDoseAr: 'الفترة الذهبية الأكثر أماناً وراحة: من الأسبوع 14 إلى الأسبوع 28. مسموح حتى الأسبوع 36 (أو 32 في التوأم) مع ارتداء جوارب ضاغطة، شرب ماء كل ساعة، والمشي في ممر الطائرة كل 45 دقيقة.',
    safeConditionOrDoseEn: 'The safest window is weeks 14 to 28. Permitted up to week 36 (or 32 for multiples) with compression stockings, hourly hydration, and leg calf stretches.',
    recommendedAlternativeAr: 'استشارة الطبيب للحصول على تقرير اللياقة للطيران (Fit to Fly) بعد الأسبوع 28.',
    recommendedAlternativeEn: 'Obtain an obstetrician "Fit to Fly" letter after week 28 and verify individual airline policies.',
    specialistTipAr: 'لو مسافرة طيارة: احجزي كرسي على الممر عشان تقومي تمشي كل ساعة، واشربي لتر مية في الرحلة والبسي شراب دوالي مريح لحماية رجلك من التورم والجلطات.',
    specialistTipEn: 'Book an aisle seat, drink plenty of water, do ankle pump exercises, and walk the aisle every hour.',
  },
];

export const PREGNANCY_CHECKUP_ROADMAP = [
  {
    stageAr: 'الزيارة الأولى والثلث الأول (الأسبوع 1 إلى 12)',
    stageEn: 'First Trimester & Initial Booking (Weeks 1 - 12)',
    badgeAr: 'تأسيس الأعضاء والاطمئنان الأولي',
    badgeEn: 'Organogenesis & Baseline Labs',
    color: '#0284c7',
    items: [
      {
        titleAr: 'تحليل فصيلة الدم وعامل الريسس (ABO & Rh Factor)',
        titleEn: 'Blood Group & Rh Typing',
        descAr: 'حاسم جداً: إذا كانت فصيلة الأم سالبة (Rh-) والزوج موجباً (Rh+)، يجب أخذ حقنة Anti-D في الأسبوع 28 وبعد الولادة لمنع تكسير دم الجنين.',
        descEn: 'Crucial to identify Rh-negative mothers who will require Anti-D immunoglobulin prophylaxis at week 28 and postpartum.',
      },
      {
        titleAr: 'صورة دم كاملة (CBC) ومخزون الحديد (Ferritin)',
        titleEn: 'Complete Blood Count (CBC) & Serum Ferritin',
        descAr: 'للكشف المبكر عن الأنيميا وتحديد جرعة الحديد المناسبة بعد الشهر الثالث.',
        descEn: 'Screens for baseline maternal anemia and iron reserves prior to plasma volume expansion.',
      },
      {
        titleAr: 'تحليل هرمون الغدة الدرقية (TSH) والسكر الصائم',
        titleEn: 'Thyroid Function (TSH) & Fasting Blood Glucose',
        descAr: 'قصور الغدة الدرقية غير المعالج يؤثر على نمو مخ الجنين وقد يسبب الإجهاض المبكر.',
        descEn: 'Maternal hypothyroidism impairs fetal neurodevelopment and elevates miscarriage risk.',
      },
      {
        titleAr: 'تحليل بول كامل ومزرعة بول (Urine Analysis & Culture)',
        titleEn: 'Urinalysis & Urine Culture',
        descAr: 'للكشف عن البكتيريا الصامتة (Asymptomatic Bacteriuria) التي تسبب التهابات الكلى والولادة المبكرة.',
        descEn: 'Detects asymptomatic bacteriuria which can progress to pyelonephritis and preterm labor.',
      },
      {
        titleAr: 'سونار قياس شفافية قفا الجنين (NT Scan - الأسبوع 11 إلى 13)',
        titleEn: 'Nuchal Translucency Scan (Weeks 11 - 13)',
        descAr: 'للاطمئنان المبكر على سلامة الكروموسومات وعدم وجود متلازمة داون وقياس نبض الجنين.',
        descEn: 'Assesses chromosomal integrity and early cardiac structure.',
      },
    ],
  },
  {
    stageAr: 'الثلث الثاني من الحمل (الأسبوع 13 إلى 27)',
    stageEn: 'Second Trimester (Weeks 13 - 27)',
    badgeAr: 'السونار التفصيلي ومنحنى السكر والتطعيمات',
    badgeEn: 'Anomaly Scan, OGTT & Vaccines',
    color: '#138866',
    items: [
      {
        titleAr: 'السونار التفصيلي رباعي الأبعاد (Anomaly Scan - الأسبوع 18 إلى 22)',
        titleEn: 'Detailed Fetal Anomaly Scan (Weeks 18 - 22)',
        descAr: 'أهم سونار في الحمل بالكامل! يفحص حجرات قلب الجنين، المخ، الكليتين، العمود الفقري، ومكان المشيمة بدقة عالية.',
        descEn: 'Gold-standard mid-pregnancy ultrasound evaluating fetal cardiac chambers, CNS anatomy, kidneys, and placental location.',
      },
      {
        titleAr: 'اختبار تحدي ومنحنى سكر الحمل (OGTT - الأسبوع 24 إلى 28)',
        titleEn: 'Oral Glucose Tolerance Test (Weeks 24 - 28)',
        descAr: 'فحص إلزامي لاكتشاف سكر الحمل الكامن الذي يظهر بسبب هرمونات المشيمة في الشهر السادس.',
        descEn: 'Mandatory screening for gestational diabetes mellitus induced by placental anti-insulin hormones.',
      },
      {
        titleAr: 'تطعيم التيتانوس للحامل (Tetanus Toxoid - الجرعة الأولى والثانية)',
        titleEn: 'Maternal Tetanus Toxoid Vaccination',
        descAr: 'يُؤخذ في الشهر الخامس والسادس (بينهما 4 أسابيع) لحماية الأم والمولود من تيتانوس الحبل السري أثناء الولادة.',
        descEn: 'Administered to prevent neonatal and maternal tetanus during umbilical cord cutting.',
      },
    ],
  },
  {
    stageAr: 'الثلث الثالث والاستعداد للولادة (الأسبوع 28 إلى 40)',
    stageEn: 'Third Trimester & Pre-Delivery (Weeks 28 - 40)',
    badgeAr: 'حقنة الـ RH، السيولة، وتخطيط نبض الجنين',
    badgeEn: 'Anti-D, Coagulation & CTG Monitoring',
    color: '#4f46e5',
    items: [
      {
        titleAr: 'حقنة الـ RH الوقائية (Anti-D Immunoglobulin - الأسبوع 28)',
        titleEn: 'Prophylactic Anti-D Injection (Week 28)',
        descAr: 'إلزامية للأم ذات الفصيلة السالبة (Rh-) في الأسبوع 28، وتُكرر خلال 72 ساعة من الولادة إذا كان المولود موجباً.',
        descEn: 'Essential at 28 weeks for Rh-negative mothers, repeated within 72h post-delivery if newborn is Rh-positive.',
      },
      {
        titleAr: 'متابعة ضغط الدم وزلال البول أسبوعياً',
        titleEn: 'Weekly Blood Pressure & Urine Dipstick Protein',
        descAr: 'للكشف المبكر عن أي بوادر لتسمم الحمل (Preeclampsia) في الشهور الأخيرة.',
        descEn: 'Vigilant monitoring to detect late-onset preeclampsia before complications arise.',
      },
      {
        titleAr: 'تحاليل ما قبل الولادة (الأسبوع 36): صورة دم + سيولة الدم (PT, PTT, INR)',
        titleEn: 'Pre-Delivery Panel (Week 36): CBC & Coagulation Profile',
        descAr: 'لتأمين الأم ضد نزيف الولادة وتجهيز ملف التخدير النصفي (Epidural/Spinal) بأمان.',
        descEn: 'Ensures safe maternal hemoglobin and normal clotting cascades prior to spinal anesthesia or delivery.',
      },
      {
        titleAr: 'تخطيط نبض الجنين والطلق (CTG / Non-Stress Test)',
        titleEn: 'Cardiotocography (CTG / Non-Stress Test)',
        descAr: 'يُجرى في الشهر التاسع للاطمئنان على كفاءة المشيمة واستجابة قلب الجنين مع كل حركة.',
        descEn: 'Monitors fetal heart rate reactivity in response to fetal movements and uterine contractions.',
      },
    ],
  },
];

export const COMMON_DISCOMFORTS = [
  {
    id: 'leg-cramps',
    icon: '🦵',
    titleAr: 'الشد العضلي المؤلم في السمانة أثناء النوم ليلاً',
    titleEn: 'Nocturnal Calf Muscle Cramps',
    causeAr: 'نقص الماغنسيوم والكالسيوم، مع ضغط الرحم على أوعية وأعصاب الساقين.',
    causeEn: 'Magnesium/calcium depletion combined with venous stasis in lower extremities.',
    solutionAr: 'اثني مشط قدمكِ فوراً لأعلى باتجاه ركبتكِ (وليس لأسفل!) مع تدليك السمانة بماء دافئ. تناولي موزة يومياً ومكمل الماغنسيوم قبل النوم.',
    solutionEn: 'Immediately dorsiflex your foot upward toward your shin (never point toes down). Take evening magnesium supplements.',
    safeMedsAr: 'أقراص أو فوار ماغنسيوم (Magnesium Citrate / Oxide) آمنة تماماً، مع شرب 3 لتر ماء.',
    safeMedsEn: 'Oral Magnesium supplements and adequate daytime hydration.',
  },
  {
    id: 'constipation-hemorrhoids',
    icon: '🚽',
    titleAr: 'الإمساك المزمن والبواسير في الحمل',
    titleEn: 'Pregnancy Constipation & Hemorrhoids',
    causeAr: 'هرمون البروجستيرون يبطئ حركة الأمعاء، بالإضافة إلى أن أقراص الحديد تزيد صلابة البراز.',
    causeEn: 'Progesterone slows gastrointestinal transit time, compounded by oral iron supplementation.',
    solutionAr: 'تناول الخيار والخس والشوفان والبرقوق المجفف (القراصيا) يومياً، وشرب كوب ماء دافئ صباحاً، وعدم الحزق الشديد.',
    solutionEn: 'High-fiber diet (oats, prunes, leafy greens), warm morning water, and avoiding straining.',
    safeMedsAr: 'شراب لاكتيلوز (Lactulose / Duphalac) آمن تماماً لأنه لا يُمتص للدم. ⚠️ ممنوع منعاً باتاً أخذ السنامكي أو زيت الخروع لأنها تسبب انقباضات رحمية وولادة مبكرة!',
    safeMedsEn: 'Lactulose syrup is completely safe. Strictly avoid castor oil and senna stimulant laxatives as they trigger uterine contractions.',
  },
  {
    id: 'edema-swelling',
    icon: '🦶',
    titleAr: 'تورم القدمين والكاحلين في الشهور الأخيرة',
    titleEn: 'Ankle & Foot Edema',
    causeAr: 'احتباس السوائل الفسيولوجي وضغط الرحم على أوردة الحوض.',
    causeEn: 'Physiological fluid retention and gravid uterine pressure on pelvic veins.',
    solutionAr: 'ارفعي قدميكِ على مخدة عالية عند الجلوس، قللي المخللات، نامي على جنبك الأيسر، وارتدي حذاءً مريحاً.',
    solutionEn: 'Elevate legs above heart level when resting, sleep on your left side, and avoid tight footwear.',
    safeMedsAr: '⚠️ تنبيه خطير: التورم التدريجي الخفيف في القدمين طبيعي، لكن إذا حدث تورم مفاجئ في الوجه وحول العينين واليدين مع صداع، قيسي ضغطك فوراً لاستبعاد تسمم الحمل!',
    safeMedsEn: 'Warning: Sudden swelling of the face, eyelids, and hands accompanied by headache warrants immediate blood pressure check for preeclampsia.',
  },
  {
    id: 'vaginal-uti',
    icon: '🦠',
    titleAr: 'الإفرازات المهبلية وحرقان البول',
    titleEn: 'Vaginal Discharge & Urinary Tract Infections',
    causeAr: 'تغير حموضة المهبل وركود البول نتيجة ارتخاء الحالبين.',
    causeEn: 'Altered vaginal pH and urinary stasis from ureteral smooth muscle relaxation.',
    solutionAr: 'الإفرازات البيضاء الكريمية بدون رائحة أو حكة طبيعية. أما الإفرازات المجينة كالجبن أو ذات الرائحة الكريهة أو حرقان البول فتستلزم علاجاً فورياً لأن إهمالها يسبب انفجار كيس الماء المبكر!',
    solutionEn: 'Odorless milky discharge is normal. Itchy, foul-smelling discharge or dysuria must be treated promptly to prevent premature membrane rupture.',
    safeMedsAr: 'لبوس مهبلي مضاد للفطريات (مثل جينو-دكتارين أو كلوتريمازول) ومضاد حيوي آمن للبول بوصفة الطبيب + تشطيف خارجي فقط وتجفيف جيد.',
    safeMedsEn: 'Topical clotrimazole/miconazole ovules or pregnancy-safe oral antibiotics (e.g., amoxicillin-clavulanate/fosfomycin) per doctor prescription.',
  },
  {
    id: 'stretch-marks',
    icon: '🧴',
    titleAr: 'علامات تمدد البطن والحكة الجلدية (Stretch Marks)',
    titleEn: 'Abdominal Stretch Marks & Pruritus',
    causeAr: 'تمدد ألياف الكولاجين والإيلاستين السريع مع كبر حجم البطن.',
    causeEn: 'Rapid dermal collagen and elastin stretching alongside cortisol elevation.',
    solutionAr: 'الترطيب العميق مرتين يومياً بعد الاستحمام بداية من الشهر الرابع.',
    solutionEn: 'Consistent twice-daily emollient application starting early in the second trimester.',
    safeMedsAr: 'زيت اللوز الحلو، زبدة الشيا النقية، البانثينول، وزيت جوز الهند. ⚠️ ممنوع تماماً كريمات التفتيح المحتوية على الريتينول (الأكرتين، الديفرين) أو الهيدروكينون!',
    safeMedsEn: 'Sweet almond oil, pure shea butter, panthenol, and hyaluronic acid. Strictly avoid topical retinoids (Acretin, Differin) and hydroquinone.',
  },
  {
    id: 'back-pelvic-pain',
    icon: '🦴',
    titleAr: 'آلام أسفل الظهر وعرق النسا والحوض',
    titleEn: 'Lower Backache & Pelvic Girdle Pain',
    causeAr: 'إفراز هرمون الريلاكسين (Relaxin) الذي يرخي أربطة الحوض وتغير مركز ثقل الجسم للأمام.',
    causeEn: 'Relaxin hormone loosens sacroiliac ligaments while shifting maternal center of gravity.',
    solutionAr: 'النوم على الجانب مع مخدة بين الركبتين، كمادات ماء دافئ على أسفل الظهر، وتجنب الوقوف الطويل أو الكعب العالي.',
    solutionEn: 'Sleep with a pillow between knees, apply warm compresses, wear flat orthopedic shoes, and bend at the knees when lifting.',
    safeMedsAr: 'أقراص باراسيتامول عند اللزوم ودهان موضعي خفيف خالي من الساليسيلات أو الفولتارين في الشهور الأخيرة.',
    safeMedsEn: 'Oral paracetamol and warm physical therapy compresses; avoid NSAID gels in the third trimester.',
  },
];

export const HOSPITAL_BAG_ITEMS = [
  { id: 'doc-1', cat: 'docs', labelAr: 'بطاقة الرقم القومي للأم والزوج + قسيمة الزواج (لاستخراج شهادة الميلاد)', labelEn: 'National ID cards for mother & father + Marriage certificate' },
  { id: 'doc-2', cat: 'docs', labelAr: 'ملف متابعة الحمل: آخر صورة دم، تحليل السيولة (PT/PTT)، فصيلة الدم (RH)، وآخر سونار', labelEn: 'Medical file: Latest CBC, Coagulation profile, Blood group/Rh, and recent Ultrasound' },
  { id: 'doc-3', cat: 'docs', labelAr: 'كارت التأمين الصحي أو خطاب تحويل المستشفى وأرقام طوارئ طبيب التوليد', labelEn: 'Insurance card, hospital admission letter, and Obstetrician emergency contact' },
  { id: 'mom-1', cat: 'mom', labelAr: '2-3 قمصان نوم قطنية واسعة مفتوحة من الأمام (مخصصة للرضاعة الطبيعية)', labelEn: '2-3 loose front-buttoned cotton nightgowns for easy breastfeeding' },
  { id: 'mom-2', cat: 'mom', labelAr: 'فوط صحية كبيرة مخصصة لما بعد الولادة (Maternity Pads) عالية الامتصاص', labelEn: 'Heavy-duty maternity postpartum sanitary pads' },
  { id: 'mom-3', cat: 'mom', labelAr: 'كريم لانولين نقي (Lanolin) لترطيب وحماية حلمة الثدي من التشققات منذ اليوم الأول', labelEn: 'Pure Lanolin nipple cream to prevent breastfeeding fissures' },
  { id: 'mom-4', cat: 'mom', labelAr: 'حمالات صدر قطنية للرضاعة + غيارات داخلية قطنية مريحة وعالية الخصر (بعيداً عن جرح القيصرية)', labelEn: 'Nursing bras & high-waisted cotton underwear (sits above C-section incision)' },
  { id: 'mom-5', cat: 'mom', labelAr: 'شبشب مريح مانع للانزلاق للمشي في ممر المستشفى (المشي المبكر يمنع الجلطات ويحرك الأمعاء)', labelEn: 'Non-slip comfortable slippers for early post-op hallway ambulation' },
  { id: 'baby-1', cat: 'baby', labelAr: '3 أطقم ملابس داخلية قطنية 100% للمولود (سلوبيتات بكباسين) مغسولة مسبقاً بدون معطرات', labelEn: '3 pre-washed 100% cotton newborn bodysuits and sleepsuits' },
  { id: 'baby-2', cat: 'baby', labelAr: 'عبوة حفاضات مولود جديد (Newborn Size 1) ذات فتحة مخصصة للسرة + مناديل مبللة مائية (Water Wipes)', labelEn: 'Newborn Size 1 diapers (with umbilical cord notch) + pure water wipes' },
  { id: 'baby-3', cat: 'baby', labelAr: 'بطانية ناعمة وكوفرتة قطنية، طاقية قطنية للرأس، وجوارب للمولود', labelEn: 'Soft cotton receiving blanket, newborn beanie hat, and mittens/socks' },
  { id: 'baby-4', cat: 'baby', labelAr: 'كحول طبي 70% أو بخاخ مطهر للعناية بنظافة وجفاف سرة المولود حسب تعليمات طبيب الأطفال', labelEn: '70% medical alcohol swabs for umbilical cord stump care' },
];

export const PREGNANCY_MYTHS = [
  {
    mythAr: 'الحامل لازم تاكل لشخصين وتضاعف كميات أكلها!',
    mythEn: 'A pregnant woman must eat for two and double her food intake!',
    factAr: 'حقيقة علمية: في أول 3 أشهر لا يحتاج جسمك لأي سعرات إضافية على الإطلاق! في الثلث الثاني والثالث تحتاجين فقط 300 إلى 450 سعراً حرارياً إضافياً يومياً (ما يعادل ساندوتش جبنة وكوب حليب). الإفراط في الأكل يسبب سكر الحمل، تسمم الحمل، وصعوبة الولادة.',
    factEn: 'Clinical Fact: Zero additional calories are needed in Trimester 1. In Trimesters 2 and 3, only 300-450 extra kcal/day are required (like a sandwich and milk glass). Excessive weight gain triggers gestational diabetes and macrosomia.',
  },
  {
    mythAr: 'الليمون والكركديه الساقع والنعناع بيسقطوا الحمل!',
    mythEn: 'Lemon, cold hibiscus, and mint cause miscarriages!',
    factAr: 'حقيقة علمية: لا يوجد أي دليل علمي يربط الليمون أو النعناع بالإجهاض. الليمون مصدر رائع لفيتامين C لتعزيز مناعتك وامتصاص الحديد، والكركديه باعتدال آمن تماماً، والنعناع يهدئ تقلصات الأمعاء والانتفاخ.',
    factEn: 'Clinical Fact: Zero evidence links lemons or culinary mint to miscarriage. Lemons deliver vital vitamin C that enhances iron absorption, and mild mint eases bloating.',
  },
  {
    mythAr: 'شكل البطن وحموضة المعدة تحدد نوع الجنين (ولد ولا بنت)!',
    mythEn: 'Belly shape and heartburn severity reveal the baby’s gender!',
    factAr: 'حقيقة علمية: شكل البطن يحدده قوة عضلات جدار بطن الأم، ووضعية الجنين داخل الرحم، وعدد مرات الحمل السابقة. والحموضة سببها ارتخاء صمام المريء بفعل هرمون البروجستيرون وضغط الرحم، ولا علاقة لها بشعر الجنين أو نوعه.',
    factEn: 'Clinical Fact: Abdominal contour reflects maternal abdominal wall tone, parity, and fetal presentation. Reflux is caused by progesterone-mediated lower esophageal sphincter relaxation.',
  },
  {
    mythAr: 'شرب الحليب والمياه بكثرة بيكبر رأس الجنين ويعسر الولادة!',
    mythEn: 'Drinking lots of milk and water enlarges the fetal head and complicates delivery!',
    factAr: 'حقيقة علمية: خرافة شائعة شديدة الخطورة! شرب 2.5 إلى 3 لترات من الماء يومياً يحمي الجنين من نقص السائل الأمنيوسي (مياه الجنين)، ويحمي الأم من التهابات مجرى البول الصامتة والولادة المبكرة وتكون الجلطات.',
    factEn: 'Clinical Fact: Dangerous myth. Drinking 2.5-3 liters of water daily maintains healthy amniotic fluid levels, prevents urinary tract infections, and staves off preterm contractions.',
  },
];

export const RED_FLAG_EMERGENCIES = [
  {
    signAr: 'نزيف مهبلي أو قطرات دم مستمرة (أحمر فاتح أو بني داكن)',
    signEn: 'Vaginal bleeding or continuous brown/bright red spotting',
    actionAr: 'توجهي لطوارئ النساء فوراً؛ قد يكون علامة إجهاض منذر، انفصال مشيمة، أو مشيمة منزاحة.',
    actionEn: 'Immediate emergency obstetric visit; rules out threatened abortion or placental abruption.',
  },
  {
    signAr: 'صداع حاد لا يستجيب للبنادول مع زغللة في الرؤية وتورم مفاجئ في الوجه واليدين',
    signEn: 'Severe persistent headache with blurred vision and sudden facial/hand edema',
    actionAr: 'طوارئ فورية! هذه هي العلامات الكلاسيكية لتسمم الحمل (Preeclampsia) وارتفاع الضغط الخبيث.',
    actionEn: 'Immediate emergency! Classic triad of preeclampsia requiring urgent BP control and urine protein testing.',
  },
  {
    signAr: 'تسرب مستمر لمياه دافئة شفافة من المهبل (انفجار كيس الماء)',
    signEn: 'Continuous leaking or gush of clear warm fluid (Membrane rupture)',
    actionAr: 'توجهي للمستشفى دون تأخير لتجنب حدوث عدوى داخل الرحم للجنين.',
    actionEn: 'Proceed to labor triage to evaluate premature rupture of membranes (PROM) and prevent chorioamnionitis.',
  },
  {
    signAr: 'نقص مفاجئ أو توقف حركة الجنين (أقل من 10 حركات خلال ساعتين بعد الأسبوع 28)',
    signEn: 'Drastic reduction or cessation of fetal movement (<10 kicks in 2 hours post week 28)',
    actionAr: 'اشربي عصيراً بارداً ونامي على جنبك الأيسر لنصف ساعة، وإذا لم يتحرك الجنين اذهبي لعمل رسم قلب جنين (CTG) وسونار فوراً.',
    actionEn: 'Drink cold juice, lie on your left side; if no kicks occur, immediately get a non-stress cardiotocography (CTG).',
  },
];

export default function PregnancySafetyNavigator() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<PregnancyTab>('encyclopedia');

  // Encyclopedia states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PregnancyCategory>('all');
  const [selectedSafety, setSelectedSafety] = useState<SafetyLevel>('all');
  const [selectedTrimester, setSelectedTrimester] = useState<TrimesterFilter>('all');

  // Calculator states
  const [lmpDate, setLmpDate] = useState('');
  const [calculatedWeek, setCalculatedWeek] = useState<number | null>(null);
  const [dueDateStr, setDueDateStr] = useState<string>('');

  // Kick Counter states
  const [kickCount, setKickCount] = useState<number>(0);
  const [kickStartTime, setKickStartTime] = useState<string | null>(null);
  const [kickLogs, setKickLogs] = useState<string[]>([]);

  // Weight Tracker states
  const [preWeight, setPreWeight] = useState<string>('65');
  const [currentWeight, setCurrentWeight] = useState<string>('72');
  const [heightCm, setHeightCm] = useState<string>('162');
  const [pregWeekForWeight, setPregWeekForWeight] = useState<string>('24');

  // Hospital Bag & Contraction Timer states
  const [checkedBagItems, setCheckedBagItems] = useState<Record<string, boolean>>({});
  const [contractionActive, setContractionActive] = useState<boolean>(false);
  const [contractionStartMs, setContractionStartMs] = useState<number | null>(null);
  const [contractionHistory, setContractionHistory] = useState<Array<{ startTime: string; durationSec: number; intervalMin: number | null }>>([]);
  const [lastContractionStartMs, setLastContractionStartMs] = useState<number | null>(null);

  // Audio state
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedBag = localStorage.getItem('dawaya_hospital_bag_v1');
      if (savedBag) setCheckedBagItems(JSON.parse(savedBag));
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleBagItem = (id: string) => {
    setCheckedBagItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('dawaya_hospital_bag_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCalculateTrimester = () => {
    if (!lmpDate) return;
    const lmp = new Date(lmpDate);
    const today = new Date();
    const diffTime = today.getTime() - lmp.getTime();
    if (diffTime < 0) return;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    setCalculatedWeek(weeks);
    setPregWeekForWeight(String(Math.min(40, Math.max(1, weeks))));

    // Naegele's rule: LMP + 280 days
    const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
    setDueDateStr(edd.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    if (weeks <= 12) setSelectedTrimester('first');
    else if (weeks <= 27) setSelectedTrimester('second');
    else setSelectedTrimester('third');
  };

  const handleRecordKick = () => {
    const nowStr = new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (kickCount === 0) {
      setKickStartTime(nowStr);
    }
    setKickCount((c) => c + 1);
    setKickLogs((prev) => [nowStr, ...prev]);
  };

  const handleResetKicks = () => {
    setKickCount(0);
    setKickStartTime(null);
    setKickLogs([]);
  };

  const handleToggleContraction = () => {
    const now = Date.now();
    if (!contractionActive) {
      setContractionActive(true);
      setContractionStartMs(now);
    } else {
      setContractionActive(false);
      if (contractionStartMs) {
        const durationSec = Math.max(1, Math.round((now - contractionStartMs) / 1000));
        const intervalMin = lastContractionStartMs ? Math.round(((contractionStartMs - lastContractionStartMs) / 60000) * 10) / 10 : null;
        const startTimeStr = new Date(contractionStartMs).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        setContractionHistory((prev) => [{ startTime: startTimeStr, durationSec, intervalMin }, ...prev.slice(0, 9)]);
        setLastContractionStartMs(contractionStartMs);
      }
      setContractionStartMs(null);
    }
  };

  // Weight Gain Calculation
  const weightEvaluation = useMemo(() => {
    const pre = parseFloat(preWeight) || 65;
    const cur = parseFloat(currentWeight) || 70;
    const hM = (parseFloat(heightCm) || 160) / 100;
    const wk = parseInt(pregWeekForWeight, 10) || 20;

    const bmi = pre / (hM * hM);
    const gained = Math.round((cur - pre) * 10) / 10;

    let bmiCategoryAr = 'وزن طبيعي';
    let bmiCategoryEn = 'Normal Weight';
    let totalRecMin = 11.5;
    let totalRecMax = 16.0;
    let weeklyRate = 0.42;

    if (bmi < 18.5) {
      bmiCategoryAr = 'نحافة (Underweight)';
      bmiCategoryEn = 'Underweight';
      totalRecMin = 12.5;
      totalRecMax = 18.0;
      weeklyRate = 0.51;
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategoryAr = 'زيادة وزن (Overweight)';
      bmiCategoryEn = 'Overweight';
      totalRecMin = 7.0;
      totalRecMax = 11.5;
      weeklyRate = 0.28;
    } else if (bmi >= 30) {
      bmiCategoryAr = 'سمنة (Obese)';
      bmiCategoryEn = 'Obese';
      totalRecMin = 5.0;
      totalRecMax = 9.0;
      weeklyRate = 0.22;
    }

    // Expected gain by current week (first 12 weeks: 0.5 - 2 kg total)
    let expectedMinAtWeek = 0;
    let expectedMaxAtWeek = 2.0;
    if (wk > 12) {
      const weeksPast12 = wk - 12;
      expectedMinAtWeek = Math.round((0.5 + weeksPast12 * (weeklyRate * 0.75)) * 10) / 10;
      expectedMaxAtWeek = Math.round((2.0 + weeksPast12 * (weeklyRate * 1.25)) * 10) / 10;
    }

    let status: 'ideal' | 'low' | 'high' = 'ideal';
    if (gained < expectedMinAtWeek) status = 'low';
    else if (gained > expectedMaxAtWeek) status = 'high';

    return {
      bmi: Math.round(bmi * 10) / 10,
      bmiCategoryAr,
      bmiCategoryEn,
      gained,
      totalRecMin,
      totalRecMax,
      expectedMinAtWeek,
      expectedMaxAtWeek,
      status,
    };
  }, [preWeight, currentWeight, heightCm, pregWeekForWeight]);

  const filteredItems = useMemo(() => {
    return PREGNANCY_ITEMS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedSafety !== 'all' && item.safetyStatus !== selectedSafety) {
        return false;
      }
      if (selectedTrimester !== 'all') {
        const stageSafety = item.trimesterImpact[selectedTrimester];
        if (selectedSafety === 'forbidden' && stageSafety !== 'forbidden') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.nameAr.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q);
        const matchExamples = item.commonEgyptianExamples.toLowerCase().includes(q);
        const matchRisk = item.riskPhysiologyAr.toLowerCase().includes(q) || item.riskPhysiologyEn.toLowerCase().includes(q);
        const matchAlt = item.recommendedAlternativeAr.toLowerCase().includes(q);
        if (!matchName && !matchExamples && !matchRisk && !matchAlt) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedSafety, selectedTrimester]);

  const handleSpeak = (item: PregnancyItem) => {
    if (speakingId === item.id) {
      stopSpeech();
      setSpeakingId(null);
      return;
    }
    const textToSpeak = isAr
      ? `${item.nameAr}. الموقف الطبي: ${
          item.safetyStatus === 'forbidden' ? 'ممنوع تماماً' : item.safetyStatus === 'caution' ? 'بحذر وشروط' : 'آمن وموصى به'
        }. سبب المنع أو التحذير: ${item.riskPhysiologyAr}. البديل الآمن: ${item.recommendedAlternativeAr}. نصيحة الطبيب: ${item.specialistTipAr}`
      : `${item.nameEn}. Clinical Status: ${item.safetyStatus}. Medical explanation: ${item.riskPhysiologyEn}. Safe alternative: ${item.recommendedAlternativeEn}`;

    setSpeakingId(item.id);
    speakText(textToSpeak, lang, () => {
      setSpeakingId(null);
    });
  };

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Header Banner */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e3a5f 50%, #138866 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          boxShadow: '0 12px 36px rgba(13, 31, 56, 0.25)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#CFD29D',
                border: '1px solid rgba(207, 210, 157, 0.4)',
              }}
            >
              🩺 {tr(lang, 'عيادة واستشاري النساء والتوليد المتكاملة (خبرة 40 عاماً)', 'Complete Ob-Gyn Clinical Suite (40y Experience)')}
            </span>
            <span
              style={{
                background: 'rgba(225, 29, 72, 0.3)',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#fecdd3',
              }}
            >
              🛡️ {tr(lang, 'الأدلة الإكلينيكية المعتمدة ACOG & RCOG & FDA', 'Clinical Guidelines ACOG & FDA')}
            </span>
          </div>

          <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff', lineHeight: 1.3 }}>
            🤰 {tr(lang, 'موسوعة وعيادة متابعة الحامل الشاملة: من اليوم الأول حتى الولادة', 'Complete Pregnancy Safety & Maternal Care Clinic')}
          </h1>
          <p style={{ fontSize: '1rem', opacity: 0.94, margin: '0 0 18px', maxWidth: '880px', lineHeight: 1.6 }}>
            {tr(
              lang,
              'منظومة طبية متكاملة تجمع: (١) كاشف الممنوع والمسموح من الأكلات والأدوية، (٢) خريطة التحاليل والسونار والتطعيمات، (٣) عداد حركات الجنين، (٤) حاسبة الوزن المثالي، (٥) روشتة المتاعب اليومية، و(٦) شنطة الولادة ومؤقت الطلق.',
              'All-in-one obstetric companion: (1) Food & Drug Safety Encyclopedia, (2) Trimester Labs & Ultrasound Roadmap, (3) Fetal Kick Counter, (4) Weight Gain Calculator, (5) Discomforts Solver, and (6) Hospital Bag & Contraction Timer.'
            )}
          </p>

          {/* Quick Trimester & Due Date Calculator */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ flex: '1 1 240px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px', color: '#f8fafc' }}>
                📅 {tr(lang, 'احسبي أسبوع حملكِ وموعد ولادتكِ المتوقع (أول يوم في آخر دورة):', 'Calculate Gestational Age & Due Date (First day of LMP):')}
              </label>
              <input
                type="date"
                value={lmpDate}
                onChange={(e) => setLmpDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleCalculateTrimester}
              className="btn"
              style={{
                background: '#CFD29D',
                color: '#0D1F38',
                fontWeight: 800,
                padding: '9px 18px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                alignSelf: 'flex-end',
              }}
            >
              ✨ {tr(lang, 'احسبي أسبوع الحمل وموعد الولادة', 'Calculate Week & Due Date')}
            </button>

            {calculatedWeek !== null && (
              <div
                style={{
                  background: '#138866',
                  color: '#ffffff',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <div>
                  👶 {tr(lang, `أنتِ في الأسبوع ${calculatedWeek} (${
                    calculatedWeek <= 12 ? 'الثلث الأول: تكوّن الأعضاء' : calculatedWeek <= 27 ? 'الثلث الثاني: النمو والاستقرار' : 'الثلث الثالث: الاستعداد للولادة'
                  })`, `Week ${calculatedWeek}`)}
                </div>
                {dueDateStr && (
                  <div style={{ fontSize: '0.82rem', color: '#CFD29D', marginTop: '2px' }}>
                    🎉 {tr(lang, `موعد الولادة المتوقع بإذن الله: ${dueDateStr}`, `Estimated Due Date: ${dueDateStr}`)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Emergency Red-Flags Warning Banner */}
      <section
        className="card"
        style={{
          background: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '16px',
          padding: '16px 18px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '1.35rem' }}>🚨</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#991b1b', margin: 0 }}>
            {tr(lang, 'علامات الخطر الطارئة: توجهي للمستشفى فوراً دون انتظار!', 'Obstetric Red Flags: Seek Immediate Emergency Care')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginTop: '10px' }}>
          {RED_FLAG_EMERGENCIES.map((rf, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #fee2e2',
                borderRight: isAr ? '4px solid #dc2626' : '1px solid #fee2e2',
                borderLeft: !isAr ? '4px solid #dc2626' : '1px solid #fee2e2',
              }}
            >
              <b style={{ color: '#991b1b', fontSize: '0.85rem', display: 'block', marginBottom: '3px' }}>
                ⚠️ {isAr ? rf.signAr : rf.signEn}
              </b>
              <span className="small" style={{ color: '#4b5563', lineHeight: 1.4, display: 'block', fontSize: '0.8rem' }}>
                {isAr ? rf.actionAr : rf.actionEn}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6-Part Navigation Tabs */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
          marginBottom: '22px',
        }}
      >
        {[
          { id: 'encyclopedia', icon: '🛑', titleAr: '١. الممنوع والمسموح', subAr: 'أكلات، أدوية، أعشاب وعادات', titleEn: '1. Safe vs Forbidden', subEn: 'Foods, Meds & Habits' },
          { id: 'roadmap', icon: '🗓️', titleAr: '٢. التحاليل والسونار', subAr: 'خريطة المتابعة والتطعيمات', titleEn: '2. Labs & Scans', subEn: 'Checkups & Vaccines' },
          { id: 'kicks', icon: '👣', titleAr: '٣. عداد حركات الجنين', subAr: 'قاعدة الـ 10 ركلات للاطمئنان', titleEn: '3. Kick Counter', subEn: 'Rule of 10 Fetal Monitor' },
          { id: 'weight', icon: '⚖️', titleAr: '٤. حاسبة وزن الحامل', subAr: 'الزيادة المثالية حسب أسبوعك', titleEn: '4. Weight Tracker', subEn: 'Ideal BMI Gain Calculator' },
          { id: 'discomforts', icon: '🩺', titleAr: '٥. روشتة متاعب الحمل', subAr: 'الشد العضلي، الإمساك، التورم', titleEn: '5. Symptom Solver', subEn: 'Cramps, Reflux & Edema' },
          { id: 'labor_bag', icon: '🎒', titleAr: '٦. شنطة الولادة والطلق', subAr: 'قائمة المستشفى ومؤقت الطلق', titleEn: '6. Labor & Bag', subEn: 'Checklist & Contractions' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as PregnancyTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: isSelected ? '2px solid #138866' : '1px solid var(--line)',
                background: isSelected ? 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)' : '#ffffff',
                color: isSelected ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 8px 20px rgba(19, 136, 102, 0.22)' : '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{tab.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{isAr ? tab.titleAr : tab.titleEn}</div>
              <div style={{ fontSize: '0.75rem', opacity: isSelected ? 0.9 : 0.65, marginTop: '2px' }}>
                {isAr ? tab.subAr : tab.subEn}
              </div>
            </button>
          );
        })}
      </section>

      {/* ===================================================================== */}
      {/* TAB 1: ENCYCLOPEDIA OF SAFE VS FORBIDDEN FOODS, MEDS & HABITS        */}
      {/* ===================================================================== */}
      {activeTab === 'encyclopedia' && (
        <>
          <section
            className="card"
            style={{
              background: 'var(--tint)',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '20px',
              border: '1px solid var(--line)',
            }}
          >
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <span style={{ position: 'absolute', right: isAr ? '14px' : 'auto', left: !isAr ? '14px' : 'auto', top: '12px', fontSize: '1.2rem' }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr(
                  lang,
                  'ابحثي عن أي أكلة، مشروب، أو دواء (مثال: كبده، بنادول، تونة، قرفة، قطط، بروفين، رنجة، صبغة)...',
                  'Search any food, medicine, or drink (e.g. liver, panadol, tuna, cinnamon, cats, brufen, hair dye)...'
                )}
                style={{
                  width: '100%',
                  padding: isAr ? '12px 44px 12px 14px' : '12px 14px 12px 44px',
                  borderRadius: '12px',
                  border: '2px solid rgba(19, 136, 102, 0.3)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            {/* Trimester Buttons */}
            <div style={{ marginBottom: '12px' }}>
              <span className="small muted" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                ⏳ {tr(lang, 'المرحلة الزمنية للحمل:', 'Pregnancy Stage / Trimester:')}
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', ar: 'كامل فترة الحمل', en: 'All Stages' },
                  { id: 'first', ar: 'الثلث الأول (شهر 1-3)', en: 'Trimester 1 (W 1-12)' },
                  { id: 'second', ar: 'الثلث الثاني (شهر 4-6)', en: 'Trimester 2 (W 13-27)' },
                  { id: 'third', ar: 'الثلث الثالث (شهر 7-9)', en: 'Trimester 3 (W 28-40)' },
                  { id: 'lactation', ar: 'الرضاعة الطبيعية', en: 'Breastfeeding' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedTrimester(st.id as TrimesterFilter)}
                    className="btn small"
                    style={{
                      background: selectedTrimester === st.id ? '#0D1F38' : '#ffffff',
                      color: selectedTrimester === st.id ? '#ffffff' : '#334155',
                      borderColor: selectedTrimester === st.id ? '#0D1F38' : 'rgba(0,0,0,0.15)',
                      fontWeight: selectedTrimester === st.id ? 800 : 600,
                      borderRadius: '20px',
                      padding: '6px 14px',
                    }}
                  >
                    {isAr ? st.ar : st.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Tabs */}
            <div style={{ marginBottom: '12px' }}>
              <span className="small muted" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                📂 {tr(lang, 'التصنيف والمجال:', 'Category Filter:')}
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', icon: '🌟', ar: 'كل المجالات', en: 'All' },
                  { id: 'food', icon: '🥗', ar: 'الأطعمة والأكلات', en: 'Foods & Diet' },
                  { id: 'medication', icon: '💊', ar: 'الأدوية والمسكنات', en: 'Medications' },
                  { id: 'supplement', icon: '🍊', ar: 'الفيتامينات والمكملات', en: 'Supplements' },
                  { id: 'beverage', icon: '☕', ar: 'المشروبات والأعشاب', en: 'Herbs & Drinks' },
                  { id: 'lifestyle', icon: '🏡', ar: 'العادات والأنشطة والجمال', en: 'Lifestyle & Habits' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as PregnancyCategory)}
                    className="btn small"
                    style={{
                      background: selectedCategory === cat.id ? '#138866' : '#ffffff',
                      color: selectedCategory === cat.id ? '#ffffff' : '#334155',
                      borderColor: selectedCategory === cat.id ? '#138866' : 'rgba(0,0,0,0.15)',
                      fontWeight: selectedCategory === cat.id ? 800 : 600,
                      borderRadius: '20px',
                      padding: '6px 14px',
                    }}
                  >
                    {cat.icon} {isAr ? cat.ar : cat.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Safety Level Radio Filter */}
            <div>
              <span className="small muted" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                🚦 {tr(lang, 'درجة الأمان والموقف الطبي:', 'Clinical Safety Rating:')}
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', ar: 'الكل', en: 'All Ratings', bg: '#ffffff', color: '#334155' },
                  { id: 'forbidden', ar: '🔴 ممنوع تماماً وخطير', en: 'Forbidden / High Risk', bg: '#fee2e2', color: '#991b1b' },
                  { id: 'caution', ar: '🟡 بحذر وشروط مقننة', en: 'Caution / Limited', bg: '#fef3c7', color: '#92400e' },
                  { id: 'safe', ar: '🟢 آمن وموصى به', en: 'Safe & Recommended', bg: '#dcfce7', color: '#166534' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedSafety(lvl.id as SafetyLevel)}
                    className="btn small"
                    style={{
                      background: selectedSafety === lvl.id ? lvl.bg : '#ffffff',
                      color: selectedSafety === lvl.id ? lvl.color : '#475569',
                      borderColor: selectedSafety === lvl.id ? lvl.color : 'rgba(0,0,0,0.15)',
                      fontWeight: selectedSafety === lvl.id ? 900 : 600,
                      borderRadius: '20px',
                      padding: '6px 14px',
                      borderWidth: selectedSafety === lvl.id ? '2px' : '1px',
                    }}
                  >
                    {isAr ? lvl.ar : lvl.en}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px', marginBottom: '32px' }}>
            {filteredItems.map((item) => {
              const isForbidden = item.safetyStatus === 'forbidden';
              const isCaution = item.safetyStatus === 'caution';

              const cardBorderColor = isForbidden ? '#f87171' : isCaution ? '#fbbf24' : '#4ade80';
              const statusBg = isForbidden ? '#fee2e2' : isCaution ? '#fef3c7' : '#dcfce7';
              const statusTextColor = isForbidden ? '#991b1b' : isCaution ? '#92400e' : '#166534';
              const statusBadgeText = isForbidden
                ? tr(lang, '⛔ ممنوع ومحظور طبياً', 'Forbidden')
                : isCaution
                ? tr(lang, '⚠️ مسموح بحذر وشروط صارمة', 'Caution Required')
                : tr(lang, '✅ آمن وموصى به طبياً', 'Safe & Recommended');

              return (
                <article
                  key={item.id}
                  className="card"
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    border: `2px solid ${cardBorderColor}`,
                    background: '#ffffff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span
                          style={{
                            background: statusBg,
                            color: statusTextColor,
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            padding: '4px 12px',
                            borderRadius: '20px',
                          }}
                        >
                          {statusBadgeText}
                        </span>
                        {item.fdaCategory && (
                          <span
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            FDA Category: <b>{item.fdaCategory}</b>
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.28rem', fontWeight: 900, color: '#0D1F38', margin: '4px 0' }}>
                        {isAr ? item.nameAr : item.nameEn}
                      </h3>
                      <div className="small muted" style={{ fontWeight: 600 }}>
                        {isAr ? item.commonEgyptianExamples : item.nameEn}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpeak(item)}
                      className="btn small ghost"
                      style={{
                        borderColor: speakingId === item.id ? '#dc2626' : 'rgba(19, 136, 102, 0.4)',
                        color: speakingId === item.id ? '#dc2626' : '#138866',
                        fontWeight: 700,
                      }}
                    >
                      {speakingId === item.id ? '⏹️ إيقاف الصوت' : '🔊 استمع للشرح'}
                    </button>
                  </div>

                  {/* Trimester Safety Breakdown Badges */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '6px',
                      margin: '14px 0',
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'var(--tint)',
                    }}
                  >
                    {[
                      { labelAr: 'الثلث 1 (شهر 1-3)', labelEn: 'Trimester 1', status: item.trimesterImpact.first },
                      { labelAr: 'الثلث 2 (شهر 4-6)', labelEn: 'Trimester 2', status: item.trimesterImpact.second },
                      { labelAr: 'الثلث 3 (شهر 7-9)', labelEn: 'Trimester 3', status: item.trimesterImpact.third },
                      { labelAr: 'الرضاعة الطبيعية', labelEn: 'Lactation', status: item.trimesterImpact.lactation },
                    ].map((stg, i) => {
                      const sColor = stg.status === 'forbidden' ? '#dc2626' : stg.status === 'caution' ? '#d97706' : '#16a34a';
                      const sIcon = stg.status === 'forbidden' ? '⛔' : stg.status === 'caution' ? '⚠️' : '✅';
                      return (
                        <div
                          key={i}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: sColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 8px',
                            background: '#ffffff',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                          }}
                        >
                          <span style={{ color: '#475569' }}>{isAr ? stg.labelAr : stg.labelEn}</span>
                          <span>
                            {sIcon} {stg.status === 'forbidden' ? 'ممنوع' : stg.status === 'caution' ? 'بحذر' : 'آمن'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clinical Explanation */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: isForbidden ? '#fff1f2' : isCaution ? '#fffbeb' : '#f0fdf4',
                      border: isForbidden ? '1px solid #fecdd3' : isCaution ? '1px solid #fde68a' : '1px solid #bbf7d0',
                      marginBottom: '10px',
                    }}
                  >
                    <b style={{ color: isForbidden ? '#991b1b' : isCaution ? '#854d0e' : '#14532d', fontSize: '0.88rem' }}>
                      🔬 {tr(lang, 'الآلية العلمية والتأثير الفسيولوجي على المشيمة والجنين:', 'Physiological Mechanism & Placental Impact:')}
                    </b>
                    <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.55 }}>
                      {isAr ? item.riskPhysiologyAr : item.riskPhysiologyEn}
                    </p>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <span className="small muted" style={{ fontWeight: 800, color: '#0D1F38' }}>
                      ⚖️ {tr(lang, 'الشرط الطبي أو الحد الأقصى المسموح به:', 'Safe Condition / Daily Limit:')}
                    </span>
                    <div style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                      {isAr ? item.safeConditionOrDoseAr : item.safeConditionOrDoseEn}
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <span className="small muted" style={{ fontWeight: 800, color: '#138866' }}>
                      🔄 {tr(lang, 'البديل الطبي الآمن الموصى به:', 'Recommended Safe Alternative:')}
                    </span>
                    <div style={{ fontSize: '0.88rem', color: '#0f766e', fontWeight: 700, marginTop: '2px' }}>
                      {isAr ? item.recommendedAlternativeAr : item.recommendedAlternativeEn}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      borderRight: isAr ? '4px solid #0D1F38' : 'none',
                      borderLeft: !isAr ? '4px solid #0D1F38' : 'none',
                      borderTop: '1px solid var(--line)',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <b style={{ color: '#0D1F38', fontSize: '0.86rem', display: 'block', marginBottom: '3px' }}>
                      💬 {tr(lang, 'رأي وخبرة الاستشاري (٤٠ عاماً في طب النساء):', 'Senior Ob-Gyn 40y Clinical Pearl:')}
                    </b>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.5 }}>
                      «{isAr ? item.specialistTipAr : item.specialistTipEn}»
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Myths vs Facts Section */}
          <section
            className="card"
            style={{
              borderRadius: '16px',
              padding: '22px',
              background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
              border: '1px solid #bbf7d0',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#166534', margin: '0 0 12px' }}>
              💡 {tr(lang, 'خرافات شائعة في البيوت المصرية تحت المجهر الطبي', 'Common Pregnancy Myths vs Clinical Evidence')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {PREGNANCY_MYTHS.map((m, idx) => (
                <div key={idx} style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                  <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.88rem', marginBottom: '6px' }}>
                    ❌ {tr(lang, 'الخرافة: ', 'Myth: ')}{isAr ? m.mythAr : m.mythEn}
                  </div>
                  <div style={{ color: '#166534', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.45 }}>
                    ✅ {isAr ? m.factAr : m.factEn}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CHECKUPS, LABS, ULTRASOUND & VACCINES ROADMAP                  */}
      {/* ===================================================================== */}
      {activeTab === 'roadmap' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ marginBottom: '18px', background: '#f8fafc', border: '1px solid var(--line)' }}>
            <h2 style={{ margin: '0 0 6px', color: '#0D1F38', fontSize: '1.35rem', fontWeight: 900 }}>
              🗓️ {tr(lang, 'خريطة التحاليل والسونار والتطعيمات الإلزامية شهر بشهر', 'Month-by-Month Prenatal Checkups, Scans & Vaccines Roadmap')}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'جدول المتابعة القياسي المعتمد لمنع مضاعفات الحمل المفاجئة (مثل تسمم الحمل، سكر الحمل، عدم توافق فصيلة الدم RH، والولادة المبكرة).',
                'Standard clinical prenatal schedule to prevent gestational complications, Rh isoimmunization, and undetected anomalies.'
              )}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px' }}>
            {PREGNANCY_CHECKUP_ROADMAP.map((stage, sIdx) => (
              <div
                key={sIdx}
                className="card"
                style={{
                  borderRadius: '16px',
                  borderTop: `5px solid ${stage.color}`,
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 900, color: '#0D1F38' }}>
                    {isAr ? stage.stageAr : stage.stageEn}
                  </h3>
                  <span
                    style={{
                      background: stage.color,
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '20px',
                    }}
                  >
                    {isAr ? stage.badgeAr : stage.badgeEn}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {stage.items.map((it, iIdx) => (
                    <div
                      key={iIdx}
                      style={{
                        background: 'var(--tint)',
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <b style={{ color: '#0D1F38', fontSize: '0.92rem', display: 'block', marginBottom: '6px' }}>
                        ✔️ {isAr ? it.titleAr : it.titleEn}
                      </b>
                      <p className="small" style={{ margin: 0, color: '#334155', lineHeight: 1.5 }}>
                        {isAr ? it.descAr : it.descEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: FETAL KICK COUNTER (RULE OF 10)                                */}
      {/* ===================================================================== */}
      {activeTab === 'kicks' && (
        <section className="card" style={{ borderRadius: '18px', padding: '24px', marginBottom: '28px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <span
              style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '5px 14px',
                borderRadius: '20px',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              👣 {tr(lang, 'قاعدة الـ 10 حركات الذهبية (من الأسبوع 28 حتى الولادة)', 'Cardiff Count-to-10 Fetal Kick Protocol (Week 28+)')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0D1F38', margin: '10px 0 8px' }}>
              {tr(lang, 'عداد حركات وركلات الجنين اليومي التفاعلي', 'Interactive Daily Fetal Kick Counter')}
            </h2>
            <p className="small muted" style={{ marginBottom: '20px', lineHeight: 1.6 }}>
              {tr(
                lang,
                'المعدل الطبيعي لسلامة الجنين وكفاءة المشيمة هو الشعور بـ 10 حركات على الأقل خلال ساعتين (أثناء استلقائكِ على جانبكِ الأيسر بعد تناول وجبة). اضغطي على الزر مع كل ركلة أو لفة للجنين:',
                'A healthy fetus should register at least 10 distinct movements within a 2-hour window when resting on your left side after a meal.'
              )}
            </p>

            {/* Big Interactive Kick Button */}
            <div style={{ margin: '24px 0' }}>
              <button
                type="button"
                onClick={handleRecordKick}
                style={{
                  width: '190px',
                  height: '190px',
                  borderRadius: '50%',
                  background: kickCount >= 10
                    ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                    : 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
                  color: '#ffffff',
                  border: '6px solid #CFD29D',
                  boxShadow: '0 14px 34px rgba(19, 136, 102, 0.35)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease',
                }}
              >
                <span style={{ fontSize: '2.8rem' }}>👶</span>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.1 }}>{kickCount} / 10</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#CFD29D', marginTop: '4px' }}>
                  {tr(lang, 'اضغطي عند كل حركة', 'Tap on Every Kick')}
                </span>
              </button>
            </div>

            {kickStartTime && (
              <div style={{ marginBottom: '16px', fontWeight: 700, color: '#334155' }}>
                ⏱️ {tr(lang, `بدأتِ جلسة العد الساعة: ${kickStartTime}`, `Session started at: ${kickStartTime}`)}
              </div>
            )}

            {kickCount >= 10 && (
              <div
                style={{
                  background: '#dcfce7',
                  border: '2px solid #22c55e',
                  borderRadius: '14px',
                  padding: '16px',
                  color: '#14532d',
                  fontWeight: 700,
                  marginBottom: '18px',
                }}
              >
                🎉 {tr(
                  lang,
                  'ممتاز ومطمئن جداً! أكمل جنينكِ 10 حركات نشطة، مما يدل على تدفق الأكسجين والدم عبر المشيمة بكفاءة ممتازة.',
                  'Reassuring result! Your baby completed 10 active movements, indicating healthy uteroplacental oxygenation.'
                )}
              </div>
            )}

            {kickCount > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <button type="button" onClick={handleResetKicks} className="btn small ghost">
                  🔄 {tr(lang, 'تصفير العداد وبدء جلسة جديدة', 'Reset Counter')}
                </button>
              </div>
            )}

            {/* Kick Timestamps Log */}
            {kickLogs.length > 0 && (
              <div
                style={{
                  background: 'var(--tint)',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: isAr ? 'right' : 'left',
                  marginBottom: '18px',
                }}
              >
                <b style={{ display: 'block', marginBottom: '8px', color: '#0D1F38', fontSize: '0.88rem' }}>
                  📝 {tr(lang, 'سجل توقيت الحركات المسجلة اليوم:', 'Recorded Movement Timestamps:')}
                </b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {kickLogs.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--line)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      #{kickLogs.length - idx}: {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor Advice on Waking Baby */}
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '14px',
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              <b style={{ color: '#92400e', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                💡 {tr(lang, 'ماذا تفعلين إذا كان الجنين نائماً ولم يتحرك؟', 'What if the baby is sleeping and quiet?')}
              </b>
              <p className="small" style={{ margin: 0, color: '#78350f', lineHeight: 1.5 }}>
                {tr(
                  lang,
                  'ينام الجنين لفترات تتراوح بين 20 إلى 40 دقيقة. لإيقاظه بأمان: اشربي كوب عصير فواكه بارد أو ماء بارد، استلقي في غرفة هادئة على جانبكِ الأيسر، وركزي في العد لمدة ساعتين. إذا لم يكتمل 10 حركات خلال ساعتين كاملتين، توجهي للطبيب فوراً لعمل تخطيط نبض (CTG).',
                  'Fetuses sleep in 20-40 minute cycles. Drink a glass of cold juice, lie quietly on your left side, and count for 2 hours. If fewer than 10 movements occur in 2 hours, contact your obstetrician for a CTG trace.'
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PREGNANCY WEIGHT GAIN CALCULATOR (IOM GUIDELINES)              */}
      {/* ===================================================================== */}
      {activeTab === 'weight' && (
        <section className="card" style={{ borderRadius: '18px', padding: '24px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0D1F38', margin: '0 0 8px' }}>
            ⚖️ {tr(lang, 'حاسبة زيادة الوزن المثالية أثناء الحمل (بروتوكول IOM العالمي)', 'Pregnancy Weight Gain Calculator (IOM Clinical Guidelines)')}
          </h2>
          <p className="small muted" style={{ marginBottom: '20px' }}>
            {tr(
              lang,
              'أدخلي وزنكِ قبل الحمل ووزنكِ الحالي وأسبوع الحمل لمعرفة ما إذا كانت زيادتكِ صحية ومثالية أم تحتاج لضبط غذائي:',
              'Enter your pre-pregnancy weight, current weight, height, and gestational week to evaluate your weight trajectory:'
            )}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                {tr(lang, 'الوزن قبل الحمل (كجم):', 'Pre-Pregnancy Weight (kg):')}
              </label>
              <input
                type="number"
                value={preWeight}
                onChange={(e) => setPreWeight(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 700 }}
              />
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                {tr(lang, 'الوزن الحالي (كجم):', 'Current Weight (kg):')}
              </label>
              <input
                type="number"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 700 }}
              />
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                {tr(lang, 'الطول (سم):', 'Height (cm):')}
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 700 }}
              />
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                {tr(lang, 'أسبوع الحمل الحالي (1 - 40):', 'Current Pregnancy Week (1-40):')}
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={pregWeekForWeight}
                onChange={(e) => setPregWeekForWeight(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 700 }}
              />
            </div>
          </div>

          {/* Results Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <span className="small muted">{tr(lang, 'مؤشر كتلة الجسم قبل الحمل (BMI):', 'Pre-Pregnancy BMI:')}</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0D1F38', margin: '4px 0' }}>
                {weightEvaluation.bmi} kg/m²
              </div>
              <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                {isAr ? weightEvaluation.bmiCategoryAr : weightEvaluation.bmiCategoryEn}
              </span>
            </div>

            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <span className="small muted">{tr(lang, 'مقدار زيادتكِ حتى الآن:', 'Your Gain So Far:')}</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#138866', margin: '4px 0' }}>
                {weightEvaluation.gained > 0 ? `+${weightEvaluation.gained}` : weightEvaluation.gained} {isAr ? 'كجم' : 'kg'}
              </div>
              <span className="small muted">
                {tr(
                  lang,
                  `المتوقع في الأسبوع ${pregWeekForWeight}: من ${weightEvaluation.expectedMinAtWeek} إلى ${weightEvaluation.expectedMaxAtWeek} كجم`,
                  `Expected at Week ${pregWeekForWeight}: ${weightEvaluation.expectedMinAtWeek} - ${weightEvaluation.expectedMaxAtWeek} kg`
                )}
              </span>
            </div>

            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <span className="small muted">{tr(lang, 'إجمالي الزيادة المسموحة لنهاية التاسع:', 'Total Recommended 9-Month Gain:')}</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4f46e5', margin: '4px 0' }}>
                {weightEvaluation.totalRecMin} – {weightEvaluation.totalRecMax} {isAr ? 'كجم' : 'kg'}
              </div>
              <span className="small muted">{tr(lang, 'شاملة وزن البيبي والمشيمة والمياه', 'Includes baby, placenta & amniotic fluid')}</span>
            </div>
          </div>

          {/* Clinical Interpretation */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background:
                weightEvaluation.status === 'ideal' ? '#dcfce7' : weightEvaluation.status === 'high' ? '#fef3c7' : '#e0f2fe',
              border:
                weightEvaluation.status === 'ideal'
                  ? '1px solid #4ade80'
                  : weightEvaluation.status === 'high'
                  ? '1px solid #fbbf24'
                  : '1px solid #7dd3fc',
              color: '#0f172a',
            }}
          >
            <b style={{ display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>
              🩺 {tr(lang, 'التقييم الطبي لوزنكِ:', 'Clinical Weight Assessment:')}
            </b>
            <p className="small" style={{ margin: 0, lineHeight: 1.55, fontWeight: 600 }}>
              {weightEvaluation.status === 'ideal'
                ? tr(
                    lang,
                    '✅ وزنكِ في النطاق المثالي والصحي تماماً لأسبوع حملكِ الحالي! استمري على البروتينات الصحية، الخضروات، وشرب 3 لتر ماء يومياً.',
                    'Your weight gain is right within the healthy target zone for your gestational week! Maintain balanced protein and hydration.'
                  )
                : weightEvaluation.status === 'high'
                ? tr(
                    lang,
                    '⚠️ زيادتكِ أعلى من المعدل الموصى به لهذا الأسبوع. لا تتبعي رجيم قاسي أثناء الحمل، ولكن أوقفي الحلويات والمخبوزات البيضاء والمشروبات الغازية، وافحصي سكر الحمل وضغط الدم.',
                    'Your weight gain is above the target range for this week. Do not crash-diet, but cut out refined sugars and pastries and screen for gestational diabetes.'
                  )
                : tr(
                    lang,
                    'ℹ️ زيادتكِ أقل قليلاً من المتوقع لهذا الأسبوع (شائع مع غثيان الشهور الأولى). ركزي على وجبات صغيرة عالية القيمة الغذائية مثل البيض المسلوق، المكسرات، الأفوكادو، والزبادي.',
                    'Your weight gain is slightly below the expected range. Focus on nutrient-dense small meals like boiled eggs, nuts, yogurt, and lean meats.'
                  )}
            </p>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: COMMON PREGNANCY DISCOMFORTS SOLVER                            */}
      {/* ===================================================================== */}
      {activeTab === 'discomforts' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ marginBottom: '18px', background: '#f8fafc', border: '1px solid var(--line)' }}>
            <h2 style={{ margin: '0 0 6px', color: '#0D1F38', fontSize: '1.35rem', fontWeight: 900 }}>
              🩺 {tr(lang, 'روشتة المتاعب اليومية الشائعة في الحمل والحلول الدوائية والمنزلية الآمنة', 'Safe Clinical Solutions for Common Pregnancy Discomforts')}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'كيف تتعاملين مع الأعراض المزعجة بأمان تام دون تناول أدوية تضر الجنين:',
                'How to safely relieve frequent maternal symptoms without risking fetal harm:'
              )}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {COMMON_DISCOMFORTS.map((disc) => (
              <div key={disc.id} className="card" style={{ borderRadius: '16px', padding: '18px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{disc.icon}</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0D1F38' }}>
                    {isAr ? disc.titleAr : disc.titleEn}
                  </h3>
                </div>

                <div className="small muted" style={{ marginBottom: '8px', fontWeight: 600 }}>
                  <b>🔬 {isAr ? 'السبب الفسيولوجي: ' : 'Cause: '}</b>
                  {isAr ? disc.causeAr : disc.causeEn}
                </div>

                <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '8px' }}>
                  <b style={{ color: '#166534', fontSize: '0.84rem', display: 'block', marginBottom: '2px' }}>
                    🏡 {isAr ? 'التصرف المنزلي الفوري:' : 'Immediate Home Relief:'}
                  </b>
                  <span className="small" style={{ color: '#14532d', lineHeight: 1.45, display: 'block' }}>
                    {isAr ? disc.solutionAr : disc.solutionEn}
                  </span>
                </div>

                <div style={{ background: 'var(--tint)', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <b style={{ color: '#0D1F38', fontSize: '0.84rem', display: 'block', marginBottom: '2px' }}>
                    💊 {isAr ? 'العلاج الدوائي الآمن والتحذيرات:' : 'Safe Medication & Warnings:'}
                  </b>
                  <span className="small" style={{ color: '#334155', lineHeight: 1.45, display: 'block', fontWeight: 600 }}>
                    {isAr ? disc.safeMedsAr : disc.safeMedsEn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: HOSPITAL BAG CHECKLIST & CONTRACTION TIMER                     */}
      {/* ===================================================================== */}
      {activeTab === 'labor_bag' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '28px' }}>
          {/* True Labor vs Braxton Hicks & Contraction Timer */}
          <section className="card" style={{ borderRadius: '18px', padding: '22px', border: '2px solid #0D1F38' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38', margin: '0 0 10px' }}>
              ⏱️ {tr(lang, 'مؤقت حساب الطلق والتفرقة بين الطلق الحقيقي والكاذب', 'Contraction Timer & True vs. False Labor Guide')}
            </h2>

            {/* Comparison Table */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <b style={{ color: '#92400e', display: 'block', marginBottom: '6px' }}>
                  🟡 {tr(lang, 'الطلق الكاذب (تقلصات براكستون هيكس):', 'False Labor (Braxton Hicks):')}
                </b>
                <ul className="small" style={{ margin: 0, paddingRight: isAr ? '18px' : 0, paddingLeft: !isAr ? '18px' : 0, color: '#78350f', lineHeight: 1.6 }}>
                  <li>{tr(lang, 'تقلصات غير منتظمة ومتباعدة ولا تزيد قوتها مع الوقت.', 'Irregular intervals; does not get progressively stronger.')}</li>
                  <li>{tr(lang, 'تتركز في مقدمة البطن فقط وتختفي عند المشي أو تغيير وضعيتكِ أو شرب الماء.', 'Felt mostly in front of abdomen; subsides when walking or resting.')}</li>
                </ul>
              </div>

              <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <b style={{ color: '#991b1b', display: 'block', marginBottom: '6px' }}>
                  🔴 {tr(lang, 'الطلق الحقيقي (ولادة فعلية - قاعدة 5-1-1):', 'True Active Labor (5-1-1 Rule):')}
                </b>
                <ul className="small" style={{ margin: 0, paddingRight: isAr ? '18px' : 0, paddingLeft: !isAr ? '18px' : 0, color: '#7f1d1d', lineHeight: 1.6 }}>
                  <li>{tr(lang, 'منتظم جداً: يأتي كل 5 دقائق، وتستمر الطلقة الواحدة لمدة دقيقة كاملة (60 ثانية).', 'Regular: comes every 5 minutes, lasting 1 full minute each.')}</li>
                  <li>{tr(lang, 'يبدأ من أسفل الظهر ويلف للبطن، ولا يهدأ بتغيير الوضعية، وقد يصاحبه نزول العلامة المدممة أو الماء.', 'Radiates from lower back to front; intensifies despite movement.')}</li>
                </ul>
              </div>
            </div>

            {/* Interactive Contraction Stopwatch */}
            <div style={{ textAlign: 'center', padding: '18px', background: 'var(--tint)', borderRadius: '14px' }}>
              <button
                type="button"
                onClick={handleToggleContraction}
                style={{
                  padding: '14px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  borderRadius: '30px',
                  border: 'none',
                  cursor: 'pointer',
                  background: contractionActive ? '#dc2626' : '#138866',
                  color: '#ffffff',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                }}
              >
                {contractionActive
                  ? tr(lang, '⏹️ انتهت الطلقة الآن (اضغطي لإيقاف وحساب المدة)', 'Stop Contraction (Calculate Duration)')
                  : tr(lang, '▶️ بدأت الطلقة الآن (اضغطي لبدء الحساب)', 'Start Contraction Timer')}
              </button>

              {contractionHistory.length > 0 && (
                <div style={{ marginTop: '16px', textAlign: isAr ? 'right' : 'left' }}>
                  <b className="small" style={{ display: 'block', marginBottom: '8px', color: '#0D1F38' }}>
                    📊 {tr(lang, 'سجل التقلصات المسجلة:', 'Recorded Contractions:')}
                  </b>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {contractionHistory.map((ch, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>🕒 {ch.startTime}</span>
                        <span style={{ color: '#138866' }}>
                          {tr(lang, `مدة الطلقة: ${ch.durationSec} ثانية`, `Duration: ${ch.durationSec}s`)}
                        </span>
                        <span style={{ color: '#0284c7' }}>
                          {ch.intervalMin !== null
                            ? tr(lang, `الفاصل عن السابقة: ${ch.intervalMin} دقيقة`, `Interval: ${ch.intervalMin}m`)
                            : tr(lang, 'أول طلقة مسجلة', 'First recorded')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Hospital Bag Interactive Checklist */}
          <section className="card" style={{ borderRadius: '18px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38', margin: '0 0 4px' }}>
                  🎒 {tr(lang, 'قائمة تحضير «شنطة الولادة» الذكية للأم والمولود', 'Interactive Hospital Delivery Bag Checklist')}
                </h2>
                <p className="small muted" style={{ margin: 0 }}>
                  {tr(lang, 'يُفضل تجهيز الشنطة بداية من الأسبوع 35 (الشهر الثامن). يتم حفظ علاماتكِ تلقائياً على جهازك:', 'Prepare by week 35. Your checkmarks are saved automatically:')}
                </p>
              </div>
              <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '0.9rem', padding: '6px 14px' }}>
                ✅ {Object.values(checkedBagItems).filter(Boolean).length} / {HOSPITAL_BAG_ITEMS.length} {tr(lang, 'مكتمل', 'Packed')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {HOSPITAL_BAG_ITEMS.map((item) => {
                const isChecked = !!checkedBagItems[item.id];
                return (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isChecked ? '#f0fdf4' : 'var(--tint)',
                      border: isChecked ? '1px solid #86efac' : '1px solid var(--line)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleBagItem(item.id)}
                      style={{ width: '20px', height: '20px', accentColor: '#138866', cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: isChecked ? '#166534' : '#0f172a',
                        textDecoration: isChecked ? 'line-through' : 'none',
                      }}
                    >
                      {isAr ? item.labelAr : item.labelEn}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <Disclaimer />
    </main>
  );
}
