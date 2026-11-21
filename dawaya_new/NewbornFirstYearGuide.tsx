import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';
import { speakText, stopSpeech } from './speechService';

export type NewbornTab =
  | 'forbidden_safe'
  | 'vaccines'
  | 'weaning'
  | 'stool_decoder'
  | 'growth_milestones'
  | 'emergencies_fever';

export interface BabySafetyItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'food_drink' | 'medication' | 'habit_care';
  status: 'forbidden_under_1y' | 'caution_age_specific' | 'safe_recommended';
  allowedAgeAr: string;
  allowedAgeEn: string;
  dangerMechanismAr: string;
  dangerMechanismEn: string;
  safeAlternativeAr: string;
  safeAlternativeEn: string;
  consultantPearlAr: string;
  consultantPearlEn: string;
}

export const BABY_SAFETY_ITEMS: BabySafetyItem[] = [
  {
    id: 'honey-botulism',
    nameAr: 'عسل النحل الطبيعي أو المصنع (بأي كمية حتى لو لحسة)',
    nameEn: 'Honey (Raw or Pasteurized)',
    category: 'food_drink',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'ممنوع منعاً باتاً قبل إتمام عمر سنة كاملة (12 شهراً)',
    allowedAgeEn: 'Strictly forbidden before 12 months of age',
    dangerMechanismAr: 'يحتوي العسل على أبواغ بكتيريا كلوستريديوم بوتولينوم (Clostridium botulinum). أمعاء الرضيع قبل عمر سنة تفتقر للأحماض والبكتيريا النافعة القادرة على قتل هذه الأبواغ، فتتكاثر وتفرز سماً عصبياً قاتلاً يسبب شلل الرضيع الرخو (Infant Botulism)، ارتخاء الرقبة، وفشل عضلات التنفس.',
    dangerMechanismEn: 'Contains Clostridium botulinum spores. An infant’s immature gut flora (<12m) cannot inhibit spore germination, producing botulinum neurotoxin that causes flaccid paralysis and respiratory arrest.',
    safeAlternativeAr: 'لتهدئة السعال أو تحلية طعام الرضيع بعد 6 أشهر: مهروس التفاح أو الكمثرى المطهو على البخار أو الموز المهروس.',
    safeAlternativeEn: 'For natural sweetness after 6 months: steamed apple puree, mashed banana, or pear puree.',
    consultantPearlAr: 'أكبر كارثة بشوفها في العيادة: الجدة تحط لحسة عسل نحل على التتينة عشان البيبي يسكت! الأبواغ دي مبتتقتلش حتى لو العسل أصلي أو اتغلى على النار. ممنوع العسل نهائياً قبل شمعة عيد ميلاده الأول.',
    consultantPearlEn: 'Never dip a pacifier in honey. Even boiled or organic honey retains heat-resistant botulinum spores.',
  },
  {
    id: 'cow-buffalo-milk',
    nameAr: 'اللبن البقري أو الجاموسي السائل أو المعلب كشراب أساسي',
    nameEn: 'Whole Cow or Buffalo Milk as Main Drink',
    category: 'food_drink',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'ممنوع كشراب قبل إتمام عمر سنة كاملة (مسموح الزبادي المبستر بكميات صغيرة بعد الشهر السادس)',
    allowedAgeEn: 'Forbidden as a beverage before 12 months (pasteurized yogurt is allowed after 6m)',
    dangerMechanismAr: 'يحتوي اللبن البقري والجاموسي على تركيزات عالية جداً من البروتين المعقد والمعادن (الصوديوم والبوتاسيوم) التي ترهق كليتي الرضيع غير الناضجة، ويفتقر للحديد القابل للامتصاص، كما يسبب نزيفاً ميكروسكوبياً خفياً في جدار أمعاء الرضيع يؤدي لأنيميا نقص الحديد الشديدة.',
    dangerMechanismEn: 'High renal solute load strains immature infant kidneys, causes occult gastrointestinal micro-bleeding, and induces severe iron-deficiency anemia.',
    safeAlternativeAr: 'لبن الأم الطبيعي أو حليب الأطفال الصناعي المخصص (مرحلة 1 من 0-6 أشهر، ومرحلة 2 من 6-12 شهراً).',
    safeAlternativeEn: 'Breastmilk or iron-fortified infant formula (Stage 1 & Stage 2).',
    consultantPearlAr: 'اللبن البقري أو الجاموسي تقيل جداً على كلى ومعدة الرضيع وبيعمل أنيميا شديدة ونزيف خفي في البراز. لكن الزبادي البلدي المبستر بعد الشهر السادس ممتاز لأن التخمير بيكسر البروتين التقيل.',
    consultantPearlEn: 'Liquid cow milk causes occult gut bleeding under 1 year, whereas fermented yogurt after 6 months is safe and digestible.',
  },
  {
    id: 'salt-sugar-under1',
    nameAr: 'إضافة الملح أو السكر الأبيض لطعام ومشروبات الرضيع',
    nameEn: 'Added Salt & Refined White Sugar',
    category: 'food_drink',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'ممنوع تماماً قبل عمر سنة (وبأقل كمية ممكنة بعد السنة)',
    allowedAgeEn: 'Strictly forbidden under 12 months',
    dangerMechanismAr: 'كليتا الرضيع لا تستطيعان التعامل مع أكثر من 0.4 جرام صوديوم يومياً (وهو موجود طبيعياً في لبن الأم). إضافة الملح ترفع عبء الكلى وتؤدي لارتفاع ضغط الدم مستقبلاً. السكر الأبيض يسبب تسوس الأسنان اللبنية المبكر ويبرمج دماغ الطفل على رفض الخضروات.',
    dangerMechanismEn: 'Immature kidneys cannot excrete excess sodium (>0.4g/day), risking hypernatremia and future hypertension. Sugar causes early caries and taste distortion.',
    safeAlternativeAr: 'تحسين طعم أكل الطفل بعد الشهر السادس برشة خفيفة من الكمون، القرفة الخفيفة، أو الفواكه الطبيعية المهروسة.',
    safeAlternativeEn: 'Flavor baby food after 6 months naturally with mild cumin, cinnamon pinch, or fruit purees.',
    consultantPearlAr: 'الطفل مولود معندوش فكرة يعني إيه مالح أو مسكر! إنتِ اللي بتعوديه. لو دوقتي شوربة الخضار ولقيتيها عادمة، هي بالنسبة لحلمات تذوقه طعمها غني وجميل جداً.',
    consultantPearlEn: 'Babies have ultra-sensitive taste buds; plain steamed vegetables taste naturally flavorful to them without salt.',
  },
  {
    id: 'herbal-decoctions-newborn',
    nameAr: 'مغلي الأعشاب للرضع في الشهور الأولى (ينسون، كراوية، نعناع، ماء غريب غير مرخص)',
    nameEn: 'Boiled Herbal Teas in Early Infancy (Anise, Caraway, Gripe Water)',
    category: 'food_drink',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'ممنوع تماماً في أول 6 أشهر من العمر',
    allowedAgeEn: 'Strictly forbidden during the first 6 months',
    dangerMechanismAr: 'معدة الرضيع بحجم قبضة يده؛ ملؤها بمغلي الأعشاب يضيع عليه رضعات الحليب المشبعة فيقل وزنه، ويسبب نقص صوديوم الدم التخفيفي (Water Intoxication) الذي قد يؤدي لتشنجات. كما أن الينسون النجمي الملوث يحتوي على سموم عصبية.',
    dangerMechanismEn: 'Displaces nutrient-dense milk feeds causing failure to thrive, risks hyponatremic water intoxication seizures, and exposes the liver to unregulated herbal alkaloids.',
    safeAlternativeAr: 'لعلاج المغص والغازات: تكريع الطفل جيداً في وسط وآخر الرضعة، تمرين البدال (العجلة) للرجلين، نوم البطن على ذراع الأم الدافئ، ونقط سيميثيكون (Simethicone) الآمنة.',
    safeAlternativeEn: 'For colic: proper burping, bicycle leg exercises, tummy time under supervision, and safe Simethicone drops.',
    consultantPearlAr: 'الأولاد في أول 4 شهور مش محتاجين نقطة واحدة غير لبن الأم أو اللبن الصناعي وفيتامين د! ببرونة الينسون بالليل بتشبع بطنه مية فينام جعان ووزنه يثبت.',
    consultantPearlEn: 'During the first 6 months, infants need zero liquids other than breastmilk or formula plus Vitamin D drops.',
  },
  {
    id: 'water-under-4m',
    nameAr: 'شرب الماء العادي للرضيع قبل بداية الطعام (أول 4-6 أشهر)',
    nameEn: 'Plain Water Before Solids (0-4 Months)',
    category: 'food_drink',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'يبدأ تقديم رشفات ماء معقمة مع بداية إدخال الطعام الصلب (بعد الشهر الرابع إلى السادس)',
    allowedAgeEn: 'Introduce small sips of boiled cooled water only when starting solids (4-6m)',
    dangerMechanismAr: 'لبن الأم يتكون من 88% ماء نقي حتى في أشد أيام الصيف حرارة! إعطاء الماء للرضيع في أول 3 أشهر يخفف صوديوم الدم (Hyponatremia) مما يسبب تورم خلايا المخ، الخمول، وانخفاض حرارة الجسم.',
    dangerMechanismEn: 'Breastmilk is 88% water. Giving extra plain water to young infants dilutes serum sodium, risking hyponatremic encephalopathy.',
    safeAlternativeAr: 'زيادة عدد مرات الرضاعة الطبيعية في الجو الحار؛ فلبن أول الرضعة (Foremilk) خفيف ومائي ويروي العطش تماماً.',
    safeAlternativeEn: 'Increase breastfeeding frequency in hot weather; foremilk quenches thirst completely.',
    consultantPearlAr: 'في الصيف الحر لو حسيتي إن البيبي عطشان، رضعيه دقيقتين تلاتة؛ اللبن اللي بينزل في أول الرضعة كله مية ومعادن مضبوطة بالمللي على مقاس كليته.',
    consultantPearlEn: 'Early-feed foremilk is naturally watery and isotonic, hydrating your baby safely without electrolyte dilution.',
  },
  {
    id: 'whole-nuts-popcorn-choking',
    nameAr: 'المكسرات الكاملة، الفشار، العنب الكامل، وقطع الجزر الصلبة',
    nameEn: 'Whole Nuts, Popcorn, Whole Grapes & Raw Hard Carrot Chunks',
    category: 'food_drink',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'ممنوعة بشكلها الصلب الكامل حتى عمر 4 سنوات (المكسرات المطحونة كالبودرة والزبدة الناعمة مسموحة بعد 6 أشهر)',
    allowedAgeEn: 'Forbidden whole until age 4 years (finely ground nut powders/smooth pastes are safe after 6m)',
    dangerMechanismAr: 'السبب الأول عالمياً للاختناق القاتل وانسداد القصبة الهوائية لدى الأطفال! قشور الفشار وحبات الفول السوداني تستقر في الشعب الهوائية وتحتاج لمنظار رئوي طارئ تحت التخدير الكلي لاستخراجها.',
    dangerMechanismEn: 'Leading cause of fatal pediatric airway obstruction and foreign body aspiration requiring emergency rigid bronchoscopy.',
    safeAlternativeAr: 'طحن المكسرات ناعماً جداً وخلطها بالزبادي أو الشوفان، تقطيع العنب بالطول إلى 4 أرباع، وسلق الجزر والتفاح حتى يصبح طرياً يذوب بين الأصابع.',
    safeAlternativeEn: 'Grind nuts into fine powder mixed into porridge, quarter grapes lengthwise, and steam hard veggies until soft.',
    consultantPearlAr: 'الفول السوداني واللب والفشار ممنوعين يدخلوا إيد طفل أقل من 4 سنين! والعنب لازم يتقطع بالطول أربع تربع مش بالعرض عشان لو بلعه ميقفلش مجرى النفس.',
    consultantPearlEn: 'Always slice grapes lengthwise into quarters and never offer popcorn or whole peanuts to toddlers.',
  },
  {
    id: 'aspirin-reye-syndrome',
    nameAr: 'الأسبرين ومشتقات الساليسيلات للأطفال (أسبوسيد أطفال، ريفو) أثناء السخونة',
    nameEn: 'Aspirin / Salicylates During Viral Fever in Children',
    category: 'medication',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'ممنوع تماماً كخافض حرارة أو مسكن للأطفال والمراهقين تحت 16 سنة',
    allowedAgeEn: 'Strictly contraindicated for fever/viral illnesses under age 16',
    dangerMechanismAr: 'إعطاء الأسبرين لطفل مصاب بعدوى فيروسية (أنفلونزا، نزلة برد، جديري مائي) يسبب متلازمة راي (Reye Syndrome)، وهي حالة قاتلة تسبب فشل الكبد الحاد وتورم المخ السريع والغيبوبة.',
    dangerMechanismEn: 'Triggers Reye Syndrome during viral infections, causing acute microvesicular hepatic steatosis and fatal cerebral edema.',
    safeAlternativeAr: 'نقط أو شراب الباراسيتامول (سيتال، أبيمول، بانادول بيبي) من أول يوم، أو الإيبوبروفين (بروفين، كونتافيفر) بعد إتمام 6 أشهر فقط.',
    safeAlternativeEn: 'Paracetamol drops/syrup from birth, or Ibuprofen suspension after 6 months of age.',
    consultantPearlAr: 'اسمه التجاري "أسبوسيد أطفال" بس ده بيتكتب بس بمعرفة دكتور قلب أطفال لحالات خاصة جداً في شرايين القلب، لكن أوعي تديه أبداً لطفل سخن أو عنده برد!',
    consultantPearlEn: 'Despite being called "Baby Aspirin", it is only prescribed by pediatric cardiologists for specific conditions like Kawasaki disease, never for routine fever.',
  },
  {
    id: 'ibuprofen-under-6m',
    nameAr: 'شراب أو لبوس البروفين والكتافلام والدولفين للرضع أقل من 6 أشهر',
    nameEn: 'Ibuprofen & Diclofenac Suppositories Under 6 Months',
    category: 'medication',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'البروفين مسموح بعد إتمام 6 أشهر (مع شرب سوائل كافية)، والدولفين/الكتافلام بعد عمر سنة بإشراف طبي',
    allowedAgeEn: 'Ibuprofen allowed after 6 months; Diclofenac suppositories only after 1 year under physician order',
    dangerMechanismAr: 'كليتا الرضيع في أول 6 أشهر حساستان جداً لنقص السوائل؛ مضادات الالتهاب (البروفين والدولفين) تقلل التروية الدموية للكلى وقد تسبب فشلاً كلوياً حاداً أو قرحاً ونزيفاً في المعدة خاصة لو الطفل يعاني من قيء أو إسهال.',
    dangerMechanismEn: 'NSAIDs inhibit renal prostaglandins, risking acute kidney injury (AKI) in infants under 6m or any dehydrated child.',
    safeAlternativeAr: 'نقط الباراسيتامول (مثل سيتال نقط: نقطتين لكل كيلو من وزن الطفل) مع كمادات المياه الفاترة على الرقبة وتحت الإبط وبين الفخذين.',
    safeAlternativeEn: 'Paracetamol drops (10-15 mg/kg/dose) combined with lukewarm sponging on high-perfusion zones.',
    consultantPearlAr: 'لبوس دولفين في أول شهور خطير جداً على الكلى وبيعمل هبوط مفاجئ في الحرارة! خافض الحرارة الوحيد الآمن في أول 6 شهور هو الباراسيتامول النقي.',
    consultantPearlEn: 'Never use diclofenac suppositories in young infants; stick strictly to weight-calculated paracetamol.',
  },
  {
    id: 'cough-cold-syrups-under4',
    nameAr: 'أدوية الكحة والبرد الطاردة والمهدئة ومضادات الاحتقان تحت 4 سنوات',
    nameEn: 'OTC Cough & Cold Syrups Under 4 Years',
    category: 'medication',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'تحذر هيئة الـ FDA من أدوية البرد والكحة الكيميائية المركبة للأطفال أقل من 4-6 سنوات',
    allowedAgeEn: 'FDA warns against OTC chemical cough and cold syrups in children under 4 years',
    dangerMechanismAr: 'لا تعالج سبب البرد الفيروسي، وتسبب آثاراً جانبية خطيرة للرضع مثل تسارع ضربات القلب، التشنجات، الهياج العصبي أو الخمول الشديد وتثبيط مركز التنفس.',
    dangerMechanismEn: 'Lack efficacy in infants and carry high risks of tachycardia, respiratory depression, seizures, and accidental overdose.',
    safeAlternativeAr: 'غسيل الأنف بمحلول الملح أو بخاخ ماء البحر (Physiomer Baby) مع شفاط الأنف قبل الرضاعة والنوم، جلسات بخار محلول ملح، وسوائل دافئة.',
    safeAlternativeEn: 'Isotonic saline nasal drops with bulb suction before feeds, nebulized saline mist, and upright head elevation.',
    consultantPearlAr: 'الرضيع بيتنفس من منخيره بس وهو بيرضع؛ لما منخيره تتسد بيعيط ويرفض الرضاعة. السر كله في تسليك الأنف بنقط محلول الملح والشفاط قبل كل رضعة مش شراب الكحة!',
    consultantPearlEn: 'Infants are obligate nasal breathers. Clearing nasal passages with saline before feeds is the safest, most effective cold treatment.',
  },
  {
    id: 'vitamin-d-drops-essential',
    nameAr: 'نقط فيتامين د3 (فـيدروب Vidrop) من أول يوم ولادة',
    nameEn: 'Vitamin D3 Oral Drops (Vidrop) From Birth',
    category: 'medication',
    status: 'safe_recommended',
    allowedAgeAr: 'إلزامي من اليوم الأول للولادة وحتى عمر سنتين',
    allowedAgeEn: 'Mandatory from Day 1 of life through at least 2 years',
    dangerMechanismAr: 'لبن الأم فقير طبيعياً في فيتامين د؛ وعدم إعطاء النقط اليومية يؤدي للين العظام والكساح (Rickets)، تأخر قفل فتحة اليافوخ، تقوس الساقين، وتأخر التسنين والمشي.',
    dangerMechanismEn: 'Breastmilk has low vitamin D levels; omitting supplementation leads to nutritional rickets, delayed fontanelle closure, and hypocalcemic seizures.',
    safeConditionOrDoseAr: '',
    safeAlternativeAr: '4 نقط فيدروب يومياً (400 وحدة دولية) في أول سنة، ثم 6 نقط يومياً (600 وحدة دولية) في السنة الثانية.',
    safeAlternativeEn: '400 IU (4 drops of Vidrop) daily from 0-12 months, increasing to 600 IU (6 drops) daily from 12-24 months.',
    consultantPearlAr: 'نقط فيتامين د هي الصديق اليومي لطفلك من أول أسبوع ولادة! ثبتي ميعادها كل يوم الصبح عشان متتنسيش.',
    consultantPearlEn: 'Administer 400 IU of Vitamin D3 daily without fail starting in the first days of life.',
  } as any,
  {
    id: 'shaking-baby- walker',
    nameAr: 'هز الرضيع بعنف لإسكاته أو تنويمه + المشاية الدائرية بعجل (Baby Walker)',
    nameEn: 'Vigorous Shaking & Wheeled Baby Walkers',
    category: 'habit_care',
    status: 'forbidden_under_1y',
    allowedAgeAr: 'ممنوعان قطعاً في جميع الأعمار',
    allowedAgeEn: 'Strictly forbidden at all ages',
    dangerMechanismAr: 'عضلات رقبة الرضيع ضعيفة ورأسه ثقيل ومخه طري؛ الهز القوي يسبب تمزق أوردة المخ ونزيف الشبكية وتلفاً دماغياً دائماً (Shaken Baby Syndrome). والمشاية الدائرية تؤخر المشي الطبيعي وتجعل الطفل يمشي على أطراف أصابعه وتسبب حوادث الانقلاب على السلالم.',
    dangerMechanismEn: 'Shaking shears bridging cerebral veins causing subdural hematomas and retinal hemorrhage. Walkers delay independent gait and cause severe fall/burn injuries.',
    safeAlternativeAr: 'التقميط الآمن للذراعين فقط مع ترك الوركين حرين، الضوضاء البيضاء (White Noise)، وترك الطفل يتدحرج ويزحف على سجادة لعب آمنة على الأرض (Floor Play).',
    safeAlternativeEn: 'Gentle rocking, white noise, hip-safe swaddling, and supervised floor tummy/crawl time.',
    consultantPearlAr: 'أوعي تنططي الرضيع لفوق أو تهزيه جامد لما يعيط! والمشاية اللي بعجل ممنوعة طبياً في كندا وأوروبا لأنها بتأخر المشي وبتخلي الطفل يقف على طراطيف صوابعه.',
    consultantPearlEn: 'Never shake an infant, and skip wheeled walkers in favor of stationary activity centers or floor mats.',
  },
];

export const EGYPT_VACCINE_SCHEDULE = [
  {
    ageAr: 'عند الولادة (خلال أول 24 ساعة)',
    ageEn: 'At Birth (Within first 24 hours)',
    color: '#e11d48',
    vaccines: [
      {
        nameAr: 'تطعيم الالتهاب الكبدي الفيروسي (ب) الصفري (HBV Birth Dose)',
        nameEn: 'Hepatitis B Birth Dose',
        siteAr: 'حقنة بالعضل في الفخذ الأمامي الخارجي (يجب أخذها خلال أول 24 ساعة من الولادة في المستشفى أو مكتب الصحة).',
        siteEn: 'Intramuscular injection in anterolateral thigh within 24h of birth.',
      },
      {
        nameAr: 'تطعيم شلل الأطفال الصفري (OPV 0) + تطعيم الدرن (BCG)',
        nameEn: 'Zero-Dose Oral Polio + BCG Tuberculosis Vaccine',
        siteAr: 'نقطتان بالفم لشلل الأطفال + حقنة في الطبقة الأولى من جلد الكتف الأيسر للدرن (تظهر بعدها حبة صغيرة وندبة بعد 4-6 أسابيع وهذا طبيعي جداً ولا يوضع عليها أي مطهر).',
        siteEn: '2 oral drops for Polio + intradermal left deltoid BCG injection (forms a normal small pustule/scar after 4-6 weeks).',
      },
    ],
    careTipAr: 'لا يتسبب تطعيم الولادة أو الدرن في سخونة فورية. تنبيه هام: لا تنسي عمل تحليل كعب القدم لحديثي الولادة (الغدة الدرقية والتمثيل الغذائي) من اليوم الثالث للسابع في مكتب الصحة!',
    careTipEn: 'Remember to perform the mandatory Newborn Heel-Prick Screening (Thyroid TSH & PKU) between days 3 and 7 at the health office.',
  },
  {
    ageAr: 'عمر شهرين (60 يوماً)',
    ageEn: '2 Months Old',
    color: '#0284c7',
    vaccines: [
      {
        nameAr: 'التطعيم الخماسي الجرعة الأولى (Pentavalent 1: دفتيريا، تيتانوس، سعال ديكي، كبدي ب، إنفلونزا بكتيرية)',
        nameEn: 'Pentavalent Vaccine (Dose 1: DTP-HepB-Hib)',
        siteAr: 'حقنة بالعضل في الفخذ + نقطتان بالفم لتطعيم شلل الأطفال (OPV 1).',
        siteEn: 'IM thigh injection + 2 oral Polio drops.',
      },
      {
        nameAr: '🌟 تطعيمات إضافية هامة جداً (المصل واللقاح / العيادات): تطعيم الروتا (Rota) + المكورات الرئوية (Prevenar 13)',
        nameEn: 'Crucial Extra Vaccines: Rotavirus (Oral) + Pneumococcal Conjugate (PCV13)',
        siteAr: 'الروتا نقط بالفم تحمي من النزلات المعوية والجفاف القاتل، والمكورات الرئوية حقنة بالعضل تحمي من الالتهاب الرئوي والتهاب الأذن الوسطى والحمى الشوكية.',
        siteEn: 'Oral Rotavirus vaccine prevents severe dehydrating gastroenteritis; PCV13 prevents pneumonia and meningitis.',
      },
    ],
    careTipAr: 'التطعيم الخماسي يسبب سخونة وورم مكان الحقنة في الفخذ. أعطي سيتال نقط حسب الوزن بعد التطعيم، واعملي كمادات مياه فاترة ونشا أو لاصقة جل باردة على الفخذ (ممنوع كمادات المياه الساخنة على مكان الحقنة!).',
    careTipEn: 'Pentavalent often causes fever and thigh soreness. Use weight-based paracetamol drops and cool compresses on the injection site (never hot compresses).',
  },
  {
    ageAr: 'عمر 4 أشهر',
    ageEn: '4 Months Old',
    color: '#138866',
    vaccines: [
      {
        nameAr: 'التطعيم الخماسي الجرعة الثانية + شلل الأطفال الفموي والعضلي (IPV)',
        nameEn: 'Pentavalent Dose 2 + Oral & Inactivated Polio (OPV2 + IPV)',
        siteAr: 'حقنتان في الفخذين (الخماسي + شلل الأطفال بالحقن سولك) + نقطتان بالفم.',
        siteEn: 'Two thigh injections (Pentavalent + IPV) + 2 oral drops.',
      },
      {
        nameAr: '🌟 الجرعة الثانية من تطعيم الروتا والمكورات الرئوية',
        nameEn: 'Dose 2 of Rotavirus & Pneumococcal (PCV13)',
        siteAr: 'يُؤخذ في المصل واللقاح أو عيادة طبيب الأطفال.',
        siteEn: 'Administered at Vacsera or pediatric clinic.',
      },
    ],
    careTipAr: 'لا تُرضعي الطفل قبل وبعد تطعيم نقط الفم بنصف ساعة حتى لا يتقيأ النقط. إذا تقيأ خلال 10 دقائق من أخذ النقط أخبري ممرضة التطعيم لإعادتها.',
    careTipEn: 'Hold feeding for 30 minutes before and after oral vaccine drops to prevent regurgitation.',
  },
  {
    ageAr: 'عمر 6 أشهر',
    ageEn: '6 Months Old',
    color: '#d97706',
    vaccines: [
      {
        nameAr: 'التطعيم الخماسي الجرعة الثالثة + شلل الأطفال الفموي (OPV 3)',
        nameEn: 'Pentavalent Dose 3 + Oral Polio (OPV 3)',
        siteAr: 'حقنة بالعضل في الفخذ + نقطتان بالفم.',
        siteEn: 'IM thigh injection + 2 oral drops.',
      },
      {
        nameAr: '🌟 الجرعة الثالثة من الروتا (Rotateq) والمكورات الرئوية + تطعيم الإنفلونزا الموسمية',
        nameEn: 'Dose 3 Rotavirus & PCV13 + Seasonal Influenza Vaccine',
        siteAr: 'من عمر 6 أشهر يُسمح بإعطاء تطعيم الإنفلونزا الموسمية لحماية صدر الطفل في الشتاء.',
        siteEn: 'Seasonal flu vaccine becomes eligible starting at 6 months of age.',
      },
    ],
    careTipAr: 'في هذا الشهر يبدأ إدخال الطعام الصلب، ويتم فحص نسبة الهيموجلوبين للاطمئنان على مخزون الحديد.',
    careTipEn: 'Milestone month to introduce iron-rich complementary foods and check hemoglobin levels.',
  },
  {
    ageAr: 'عمر 9 أشهر',
    ageEn: '9 Months Old',
    color: '#7c3aed',
    vaccines: [
      {
        nameAr: 'تطعيم شلل الأطفال الفموي (الجرعة الرابعة) + كبسولة فيتامين أ',
        nameEn: 'Oral Polio Dose 4 + Vitamin A Mega-Dose Capsule',
        siteAr: 'نقط بالفم فقط في مكتب الصحة (بدون حقن ولا يسبب سخونة).',
        siteEn: 'Oral drops only at the health office; causes zero fever.',
      },
    ],
    careTipAr: 'تطعيم خفيف جداً بدون أي حقن أو ارتفاع في الحرارة.',
    careTipEn: 'Easy visit—oral drops only with no fever or leg pain.',
  },
  {
    ageAr: 'عمر 12 شهراً (سنة كاملة)',
    ageEn: '12 Months (1 Year Old)',
    color: '#4f46e5',
    vaccines: [
      {
        nameAr: 'تطعيم الثلاثي الفيروسي الجرعة الأولى (MMR 1: الحصبة، النكاف، الحصبة الألماني) + شلل الأطفال',
        nameEn: 'MMR Dose 1 (Measles, Mumps, Rubella) + Oral Polio',
        siteAr: 'حقنة تحت الجلد في الذراع الأيمن + نقط بالفم.',
        siteEn: 'Subcutaneous injection in right upper arm + oral drops.',
      },
      {
        nameAr: '🌟 تطعيم الجديري المائي (Varicella) + الكبدي أ (Hepatitis A)',
        nameEn: 'Extra Vaccines: Varicella (Chickenpox) & Hepatitis A',
        siteAr: 'متوفرة في المصل واللقاح لحماية الطفل قبل دخول الحضانة والاختلاط.',
        siteEn: 'Highly recommended at 1 year to protect against chickenpox and foodborne Hepatitis A.',
      },
    ],
    careTipAr: 'ملاحظة طبية مهمة: سخونة تطعيم السنة (MMR) لا تظهر في نفس اليوم! بل تظهر بعد 5 إلى 10 أيام من التطعيم مع طفح وردي خفيف غير معدي ويختفي وحده.',
    careTipEn: 'Clinical Pearl: MMR vaccine fever typically appears 5 to 10 days AFTER the shot, sometimes with a mild transient pink rash.',
  },
  {
    ageAr: 'عمر 18 شهراً (سنة ونصف)',
    ageEn: '18 Months Old',
    color: '#059669',
    vaccines: [
      {
        nameAr: 'الجرعة المنشطة للثلاثي البكتيري (DTP) + الثلاثي الفيروسي (MMR 2) + شلل الأطفال + كبسولتي فيتامين أ',
        nameEn: 'DTP Booster + MMR Dose 2 + Oral Polio + Vitamin A',
        siteAr: 'حقنة بالعضل في الفخذ + حقنة تحت الجلد بالذراع + نقط بالفم.',
        siteEn: 'IM thigh booster + subcutaneous arm MMR + oral drops.',
      },
    ],
    careTipAr: 'أقوى جرعة منشطة؛ جهزي خافض الحرارة والكمادات الباردة على الفخذ لمدة 48 ساعة، وهو ختام تطعيمات مكتب الصحة الأساسية قبل المدرسة.',
    careTipEn: 'Strongest booster session; keep paracetamol and cool thigh compresses ready for 48 hours.',
  },
];

export const WEANING_GUIDE_STAGES = [
  {
    stageAr: 'المرحلة الأولى: بداية التذوق والبلع (نهاية الشهر الرابع إلى السادس)',
    stageEn: 'Stage 1: First Tastes & Smooth Purees (4 - 6 Months)',
    signsAr: 'شروط البدء الإلزامية: أن يصلب الطفل رأسه ورقبته جيداً، يجلس بمسند، يفتح فمه عند تقريب الملعقة، وتختفي حركة دفع اللسان للطعام للخارج.',
    signsEn: 'Readiness signs: steady head control, sitting with support, curiosity toward food, and loss of tongue-thrust reflex.',
    foodsAr: 'خضروات مسلوقة ومهروسة ناعماً بدون ملح: (كوسة، جزر، بطاطا حلوة، قرع عسلي) + حبوب أرز أو شوفان مدعمة بالحديد + فواكه مطهوة على البخار (تفاح، كمثرى) أو موز وأفوكادو مهروس.',
    foodsEn: 'Smooth single-ingredient purees: steamed zucchini, carrots, sweet potato, iron-fortified rice/oat cereal, steamed apple/pear, mashed avocado.',
    goldenRuleAr: 'قاعدة الـ 3 أيام الذهبية: جربي كل صنف جديد بمفرده لمدة 3 أيام متتالية في الصباح لمراقبة أي حساسية (طفح جلدي، إسهال، قيء، أو مغص شديد) قبل إدخال صنف جديد.',
    goldenRuleEn: '3-Day Allergy Rule: Introduce one new food every 3 days in the morning to easily spot any allergic rash or GI reaction.',
  },
  {
    stageAr: 'المرحلة الثانية: إدخال البروتين والزبادي (الشهر السابع والثامن)',
    stageEn: 'Stage 2: Proteins, Iron & Mashed Textures (7 - 8 Months)',
    signsAr: 'الطفل يبدأ في تحريك الفكين للمضغ الخفيف حتى قبل ظهور الأسنان، ويحتاج لمصادر حديد وزنك طبيعية لبناء الدم والمناعة.',
    signsEn: 'Baby begins rhythmic mashing motions with gums and requires rich bioavailable iron and zinc.',
    foodsAr: 'صفار البيض المسلوق جيداً (تدريجياً)، صدور دجاج مفرومة ناعماً مع شوربة الخضار، لحم أحمر مفروم، عدس أصفر مقشور ومهروس، زبادي مبستر كامل الدسم، شوفان بالفواكه.',
    foodsEn: 'Hard-boiled egg yolk, finely minced chicken breast and lean beef in veggie soup, red lentils, full-fat pasteurized plain yogurt.',
    goldenRuleAr: 'قوام الطعام يتحول من السائل تماماً إلى المهروس بالشوكة (خشن قليلاً) لتدريب عضلات اللسان والفك على المضغ والنطق السليم لاحقاً.',
    goldenRuleEn: 'Transition from silky purees to fork-mashed textures to stimulate oral-motor and speech development.',
  },
  {
    stageAr: 'المرحلة الثالثة: طعام الأصابع والمشاركة (الشهر التاسع إلى الثاني عشر)',
    stageEn: 'Stage 3: Finger Foods & Family Table Prep (9 - 12 Months)',
    signsAr: 'يمسك الطفل قطع الطعام الصغيرة بين الإبهام والسبابة (Pincer Grasp) ويضعها في فمه بنفسه.',
    signsEn: 'Develops pincer grasp to pick up bite-sized soft pieces independently.',
    foodsAr: 'سمك مشوي خالي تماماً من الشوك (سلمون، بلطي)، مكرونة مسلوقة صغيرة، أصابع بطاطس وكوسة وجزر مسلوقة طرية، جبن قريش مبستر قليل الملح، فواكه طرية مقطعة.',
    foodsEn: 'Boneless flaked fish (salmon/tilapia), soft pasta shapes, steamed veggie sticks, pasteurized cottage cheese, soft diced fruits.',
    goldenRuleAr: 'قدمي 3 وجبات رئيسية + وجبتين خفيفتين (سناك) يومياً، مع استمرار الرضاعة، وشرب الماء في كوب مخصص للأطفال.',
    goldenRuleEn: 'Offer 3 structured meals + 2 healthy snacks daily alongside breastmilk/formula, plus water from an open/straw cup.',
  },
];

export const STOOL_COLORS_DECODER = [
  {
    id: 'mustard-yellow',
    colorHex: '#eab308',
    bgHex: '#fefce8',
    titleAr: 'أصفر خردلي بحبيبات صغيرة (شبه المستردة وبذر التين)',
    titleEn: 'Mustard Yellow & Seedy',
    statusBadgeAr: '✅ طبيعي ومثالي 100%',
    statusBadgeEn: '100% Normal (Breastfed)',
    meaningAr: 'البراز المثالي للرضيع الذي يعتمد على الرضاعة الطبيعية. الحبيبات البيضاء الصغيرة هي دهون الحليب الطبيعية غير المهضومة بالكامل وهذا صحي تماماً.',
    meaningEn: 'Gold-standard stool for breastfed babies. Tiny white curds are harmless milk fat globules.',
    actionAr: 'لا يحتاج لأي دواء أو قلق حتى لو تبرز الطفل بعد كل رضعة (من 5 إلى 8 مرات يومياً في أول شهرين) أو مرة كل 4-5 أيام طالما البراز لين والطفل يرضع بنشاط.',
    actionEn: 'Completely healthy. Breastfed babies may stool after every feed or once every 4-5 days as long as stool is soft.',
  },
  {
    id: 'greenish-frothy',
    colorHex: '#16a34a',
    bgHex: '#f0fdf4',
    titleAr: 'أخضر عشبي أو أخضر برغوة / أو غامق مع الحديد',
    titleEn: 'Greenish / Frothy or Dark Green',
    statusBadgeAr: '🟡 غالباً طبيعي (يحتاج ضبط رضاعة)',
    statusBadgeEn: 'Usually Benign / Foremilk Imbalance',
    meaningAr: 'له 3 أسباب شائعة غير مقلقة: (1) الطفل يشرب لبن أول الرضعة المائي الخفيف (Foremilk) وينقل للثدي الآخر قبل أن يصل للبن آخر الرضعة الدسم، (2) تناول حليب صناعي مدعم بالحديد أو نقط حديد، (3) نزلة برد خفيفة.',
    meaningEn: 'Commonly caused by foremilk/hindmilk imbalance (switching breasts too quickly), iron-fortified formula, or mild viral colds.',
    actionAr: 'أكملي الرضاعة من ثدي واحد لمدة 15-20 دقيقة كاملة حتى يفرغ تماماً ويحصل الطفل على اللبن الدسم قبل نقله للثدي الآخر.',
    actionEn: 'Allow the baby to fully empty the first breast (15-20 mins) to get rich hindmilk before offering the second breast.',
  },
  {
    id: 'red-bloody-mucus',
    colorHex: '#dc2626',
    bgHex: '#fef2f2',
    titleAr: 'براز مدمم (خيوط دم حمراء مع مخاط) أو أحمر هلامي كالجلي',
    titleEn: 'Blood-Streaked Mucus or Red Currant Jelly Stool',
    statusBadgeAr: '🔴 تحذير طبي (استشيري الطبيب)',
    statusBadgeEn: 'Medical Evaluation Required',
    meaningAr: 'وجود خيوط دم ومخاط في رضيع بصحة جيدة غالباً علامة على «حساسية بروتين لبن الأبقار CMPA» أو شرخ شرجي بسيط من الإمساك. أما البراز الأحمر الهلامي (شبه جيلي الفراولة) المصحوب بصراخ متقطع وضم الرجلين للبطن فهو طوارئ جراحية (تداخل أمعاء Intussusception)!',
    meaningEn: 'Blood streaks with mucus often indicate Cow’s Milk Protein Allergy (CMPA) or anal fissure. Currant-jelly stool with episodic screaming indicates emergency intussusception!',
    actionAr: 'إذا كان مصحوباً بقيء أو صراخ شديد وخمول توجهي للطوارئ فوراً. إذا كان خيوط دم بسيطة راجعي طبيب الأطفال لمنع منتجات الألبان عن الأم المرضعة أو تغيير الحليب.',
    actionEn: 'Go to ER immediately if accompanied by vomiting, lethargy, or severe colicky pain. Otherwise consult pediatrician for CMPA evaluation.',
  },
  {
    id: 'chalky-white-clay',
    colorHex: '#94a3b8',
    bgHex: '#f8fafc',
    titleAr: 'أبيض طباشيري أو رمادي باهت جداً (شبه الطحينة الفاتحة)',
    titleEn: 'Chalky White or Pale Clay-Colored Stool',
    statusBadgeAr: '🚨 طوارئ كبد وقنوات مرارية فوراً!',
    statusBadgeEn: 'Urgent Hepatobiliary Alert!',
    meaningAr: 'اللون البني أو الأصفر للبراز يأتي من العصارة الصفراوية التي يفرزها الكبد. البراز الأبيض الطباشيري في أول شهرين من العمر مع استمرار صفراء العين يعني انسداد القنوات المرارية الخلقي (Biliary Atresia).',
    meaningEn: 'Pale/acholic stool indicates absence of bile pigment reaching the intestine, a classic warning sign of neonatal biliary atresia.',
    actionAr: 'صوري الحفاضة وتوجهي لطبيب الأطفال أو وحدة كبد الأطفال فوراً ودون تأخير، لأن التدخل قبل عمر 60 يوماً ينقذ كبد الطفل تماماً.',
    actionEn: 'Photograph the diaper and seek urgent pediatric hepatology evaluation; early diagnosis before 60 days of life is critical.',
  },
  {
    id: 'black-meconium-melena',
    colorHex: '#1e293b',
    bgHex: '#f1f5f9',
    titleAr: 'أسود قاتم (كالقطران)',
    titleEn: 'Black Tarry Stool',
    statusBadgeAr: '⚠️ طبيعي أول 3 أيام فقط / بعدها يحتاج فحص',
    statusBadgeEn: 'Normal Days 1-3 Only (Meconium)',
    meaningAr: 'في أول 3 أيام بعد الولادة هو «العقي - Meconium» وهو طبيعي تماماً. بعد الأسبوع الأول: اللون الأسود قد ينتج عن نقط الحديد، أو بلع الطفل لدم من تشققات حلمة ثدي الأم، أو نزيف بالجهاز الهضمي العلوي.',
    meaningEn: 'Normal meconium in the first 72 hours of life. Later on, caused by iron drops, swallowed maternal nipple blood, or upper GI bleeding.',
    actionAr: 'إذا لم يكن الطفل يأخذ حديداً ولم تكن حلمة الأم متشققة، يجب فحص الطفل فوراً لدى الطبيب.',
    actionEn: 'If not taking iron supplements and maternal nipples are intact, seek prompt medical evaluation.',
  },
];

export const GROWTH_MILESTONES_YEAR1 = [
  {
    monthAr: 'الشهر 1 إلى 2',
    monthEn: 'Months 1 - 2',
    weightRuleAr: 'يزيد الوزن بمعدل 150 إلى 200 جرام أسبوعياً (حوالي 750-900 جم في الشهر).',
    weightRuleEn: 'Gains 150-200g per week (~800g/month).',
    motorSocialAr: 'يرفع رأسه لثوانٍ عند وضعه على بطنه، يتابع وجه الأم بعينيه، يبتسم ابتسامة اجتماعية حقيقية عند ملاطفته (نهاية الشهر الثاني)، وينتبه للأصوات العالية.',
    motorSocialEn: 'Lifts head briefly during tummy time, tracks faces, shows first social smile by 8 weeks, startles to loud sounds.',
    redFlagAr: 'علامة تستوجب الفحص: لا يرمش للضوء القوي، لا ينتبه للأصوات، أو جسمه مرتخٍ تماماً كالدمية، أو لم يبتسم حتى نهاية الشهر الثالث.',
    redFlagEn: 'Red Flag: Does not react to loud sounds, fails to track moving eyes, or extreme floppy muscle tone.',
  },
  {
    monthAr: 'الشهر 3 إلى 4',
    monthEn: 'Months 3 - 4',
    weightRuleAr: 'عند الشهر الرابع إلى الخامس: يتضاعف وزن الولادة (مثلاً لو ولد 3 كجم يصبح 6 كجم).',
    weightRuleEn: 'Birth weight doubles by 4-5 months of age.',
    motorSocialAr: 'يصلب رأسه ورقبته بثبات عند حمله، يرفع صدره مستنداً على ساعديه وهو على بطنه، يضحك بصوت عالٍ، ويمد يده ليمسك الألعاب ويضعها في فمه.',
    motorSocialEn: 'Steady head control, pushes up on forearms during tummy time, laughs out loud, reaches for and mouths toys.',
    redFlagAr: 'علامة تستوجب الفحص: سقوط الرأس للخلف تماماً وعدم القدرة على تثبيتها بعد إتمام 4 أشهر، أو بقاء قبضة اليد مغلقة بقوة طوال الوقت.',
    redFlagEn: 'Red Flag: Persistent head lag after 4 months or constantly tightly fisted hands.',
  },
  {
    monthAr: 'الشهر 6 (نصف سنة)',
    monthEn: '6 Months Old',
    weightRuleAr: 'يزيد بمعدل 400 إلى 500 جرام شهرياً بداية من النصف الثاني للسنة الأولى.',
    weightRuleEn: 'Gains 400-500g per month during the second half of year 1.',
    motorSocialAr: 'يتقلب من بطنه لظهره والعكس، يجلس بمسند خفيف ثم بدون مسند، ينقل اللعبة من يد للأخرى، يعرف اسمه ويميز الوجوه الغريبة، وتبدأ بوادر التسنين (اللعاب الغزير).',
    motorSocialEn: 'Rolls both ways, sits with minimal support, transfers objects hand-to-hand, recognizes own name, begins teething.',
    redFlagAr: 'علامة تستوجب الفحص: لا يستطيع التقلب، أو يستخدم يداً واحدة فقط ويتجاهل اليد الأخرى تماماً (يجب فحص الأعصاب فوراً).',
    redFlagEn: 'Red Flag: Cannot roll over, or shows strong hand preference (using only one hand) before 1 year.',
  },
  {
    monthAr: 'الشهر 9 إلى 12 (إتمام السنة الأولى)',
    monthEn: 'Months 9 - 12',
    weightRuleAr: 'عند إتمام السنة الأولى: يصل وزن الطفل إلى 3 أضعاف وزن ولادته (حوالي 9 إلى 10.5 كجم) وطوله حوالي 75 سم.',
    weightRuleEn: 'Birth weight triples by 12 months (~9.5-10 kg); length reaches ~75 cm.',
    motorSocialAr: 'يجلس بمفرده بثبات، يحبو أو يزحف، يقف ممسكاً بالأثاث، يشير بإصبعه لما يريده، يلوح بيده (باي باي)، وينطق كلمات بسيطة مقصودة (ماما، بابا، تاتا).',
    motorSocialEn: 'Sits independently, crawls, pulls to stand, uses pincer grasp, waves bye-bye, points to objects, says "mama/dada".',
    redFlagAr: 'علامة تستوجب الفحص: لا يستطيع الجلوس بمفرده في الشهر التاسع، لا يتواصل بصرياً، أو لا يلتفت عند مناداته باسمه.',
    redFlagEn: 'Red Flag: Unable to sit unsupported by 9 months, lack of eye contact, or loss of previously acquired skills.',
  },
];

export const NEWBORN_EMERGENCIES_PROTOCOLS = [
  {
    id: 'neonatal-jaundice',
    icon: '🟡',
    titleAr: 'صفراء حديثي الولادة (متى تكون طبيعية ومتى تكون خطراً؟)',
    titleEn: 'Neonatal Jaundice (Physiological vs. Pathological)',
    dangerSignsAr: '🚨 علامات الخطر الفورية: (1) ظهور الصفراء في أول 24 ساعة من الولادة، (2) وصول اللون الأصفر للبطن والفخذين وباطن القدمين، (3) خمول الطفل وصعوبة إيقاظه للرضاعة أو بكاء حاد، (4) براز أبيض طباشيري.',
    dangerSignsEn: 'Red Flags: Jaundice appearing in the first 24 hours of life, yellow tint reaching palms/soles, lethargy/poor feeding, or chalky white stools.',
    correctProtocolAr: 'الحل الطبي الصحيح: قياس نسبة الصفراء بالجهاز الجلدي أو تحليل الدم ومقارنتها بعمر الطفل بالساعات. العلاج الوحيد الفعال لصفراء التكسير أو الصفراء العالية هو حضّانة العلاج الضوئي الطبية (Phototherapy) مع تكثيف الرضاعة كل ساعتين لطرد الصفراء في البراز.',
    correctProtocolEn: 'Plot transcutaneous/serum bilirubin against hour-specific nomograms. Frequent breastfeeding every 2 hours + medical phototherapy when indicated.',
    wrongMythAr: '❌ خرافة خطيرة جداً: «حطي البيبي تحت لمبة نيون بيضا في الصالة واديله مية بسكر أو جلوكوز!» — لمبة النيون المنزلية لا تعالج الصفراء بل تخدع عين الأم وتسبب برداً للطفل وتأخيراً قد يرفع الصفراء للمخ (Kernicterus)!',
    wrongMythEn: 'Myth: Household fluorescent bulbs and sugar water cure jaundice. Reality: Home bulbs lack the 460nm blue wavelength and delay life-saving hospital phototherapy!',
  },
  {
    id: 'infant-fever-rules',
    icon: '🌡️',
    titleAr: 'بروتوكول السخونة والحرارة عند الرضع والأطفال',
    titleEn: 'Infant Fever Clinical Triage & Sponging Protocol',
    dangerSignsAr: '🚨 قاعدة ذهبية صارمة: أي رضيع عمره أقل من 3 أشهر (90 يوماً) ترتفع حرارته إلى 38.0° مئوية أو أكثر بالترمومتر يجب فحصه في المستشفى فوراً في نفس اليوم حتى لو يرضع جيداً!',
    dangerSignsEn: 'Strict Rule: Any infant under 90 days old with a rectal temperature ≥38.0°C (100.4°F) requires immediate medical evaluation to rule out occult sepsis.',
    correctProtocolAr: 'لخفض الحرارة بأمان: (1) خففي ملابس الطفل لطبقة قطنية واحدة في غرفة معتدلة، (2) أعطي جرعة الباراسيتامول المحسوبة بالوزن، (3) ضعي كمادات مياه فاترة من الحنفية على أماكن مرور الأوعية الدموية الكبرى: جبهة الرأس، جانبي الرقبة، تحت الإبطين، وبين الفخذين، أو حمام ماء فاتر لنصف الجسم السفلي.',
    correctProtocolEn: 'Undress to a single light layer, administer weight-calculated paracetamol, and apply lukewarm water compresses to neck, axillae, and groin.',
    wrongMythAr: '❌ كوارث ممنوعة في السخونة: ممنوع تماماً وضع كحول أو سبرتو أو خل على جلد الطفل (يُمتص عبر الجلد ويسبب تسمماً وهبوطاً حاداً)، وممنوع الماء المثلج لأنه يسبب رعشة ترفع حرارة الأعضاء الداخلية أكثر!',
    wrongMythEn: 'Never rub alcohol, vinegar, or ice-cold water on a feverish baby; cold water induces shivering which spikes core temperature further.',
  },
  {
    id: 'umbilical-cord-care',
    icon: '🩹',
    titleAr: 'العناية بالسرة للرضيع وموعد سقوطها',
    titleEn: 'Umbilical Cord Stump Care & Infection Signs',
    dangerSignsAr: '🚨 علامات التهاب السرة (Omphalitis): احمرار وتورم الجلد المحيط بالسرة، خروج صديد أصفر ذو رائحة كريهة، أو نزيف مستمر لا يتوقف بالضغط الخفيف.',
    dangerSignsEn: 'Danger signs: Spreading redness/warmth on abdominal skin around the base, foul-smelling purulent discharge, or active bleeding.',
    correctProtocolAr: 'تسقط السرة طبيعياً بين اليوم 5 إلى اليوم 15 (وقد تتأخر لأسبوعين). اثني طرف الحفاضة لأسفل بعيداً عن السرة لتبقى معرضة للهواء وجافة تماماً، ونظفي قاعدتها وحول المشبك بمسحة كحول طبي 70% عند كل غيار.',
    correctProtocolEn: 'Fold diaper below the stump to keep it dry and exposed to air. Clean the base gently with 70% alcohol swabs.',
    wrongMythAr: '❌ ممنوع شد السرة باليد حتى لو متعلقة بطرف خيط رفيع! وممنوع وضع كحل أو بن أو بودرة أو عملة معدنية عليها.',
    wrongMythEn: 'Never pull a hanging stump off manually, and never apply powders, kohl, or coins over the umbilicus.',
  },
  {
    id: 'infant-choking-rescue',
    icon: '🫁',
    titleAr: 'إسعاف شرقة واختناق الرضيع (أقل من سنة) في 30 ثانية',
    titleEn: 'Infant Choking Emergency Rescue (5 Back Blows + 5 Chest Thrusts)',
    dangerSignsAr: '🚨 متى تتدخلين فوراً؟ إذا شرق الطفل وكان يسعل بصوت عالٍ ويبكي، اتركيه يسعل ولا تضربيه على ظهره وهو جالس. أما إذا ازرقّ لونه، فتح فمه بدون صوت، ولم يستطع البكاء أو التنفس، ابدئي الإنقاذ فوراً!',
    dangerSignsEn: 'If the baby is coughing loudly, let them cough. If silent, turning blue, or unable to cry/breathe, act immediately!',
    correctProtocolAr: 'خطوات الإنقاذ القياسية (5 × 5): (1) اقلبي الرضيع على بطنه فوق ساعدكِ بحيث يكون رأسه منخفضاً عن صدره مع تثبيت فكه بأصابعك، (2) وجهي 5 ضربات حاسمة بكعب يدكِ بين لوحي الكتف، (3) اقلبيه على ظهره ورأسه منخفض، واضغطي بإصبعين في منتصف عظمة الصدر (تحت خط الحلمتين) 5 ضغطات، وكرري حتى يخرج الجسم الغريب.',
    correctProtocolEn: '5-and-5 Protocol: Lay infant face-down along your forearm with head lower than chest; deliver 5 firm back blows between shoulder blades, then turn face-up and deliver 5 two-finger chest thrusts.',
    wrongMythAr: '❌ خطأ قاتل: أوعي تدخلي صباعك جوه زور الطفل وهو مش باين قدامك (Blind Finger Sweep) لأنك هتزقي الحاجة اللي واقفة لتحت وتقفلي القصبة الهوائية بالكامل!',
    wrongMythEn: 'Never perform a blind finger sweep in an infant’s mouth—you will push the foreign object deeper into the larynx!',
  },
];

export default function NewbornFirstYearGuide() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<NewbornTab>('forbidden_safe');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<'all' | 'food_drink' | 'medication' | 'habit_care'>('all');

  // Baby Age Calculator State
  const [birthDate, setBirthDate] = useState('');
  const [babyAgeResult, setBabyAgeResult] = useState<{ months: number; days: number; adviceAr: string } | null>(null);

  // Vaccine Checklist State
  const [completedVaccines, setCompletedVaccines] = useState<Record<string, boolean>>({});

  // Audio State
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dawaya_baby_vaccines_v1');
      if (saved) setCompletedVaccines(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const toggleVaccineDone = (key: string) => {
    setCompletedVaccines((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('dawaya_baby_vaccines_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCalculateBabyAge = () => {
    if (!birthDate) return;
    const bDate = new Date(birthDate);
    const today = new Date();
    const diffMs = today.getTime() - bDate.getTime();
    if (diffMs < 0) return;

    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30.4375);
    const days = Math.floor(totalDays % 30.4375);

    let adviceAr = '';
    if (months < 4) {
      adviceAr = 'رضاعة طبيعية أو صناعية فقط + 4 نقط فيدروب يومياً. ممنوع الماء والأعشاب والطعام.';
    } else if (months < 6) {
      adviceAr = 'مرحلة الاستعداد للتذوق في حال صلب الرقبة، مع التحضير لتطعيم الـ 4 و 6 أشهر.';
    } else if (months < 12) {
      adviceAr = 'مرحلة الطعام التكميلي الغني بالحديد والزبادي وصفار البيض، مع استمرار منع العسل واللبن البقري والملح.';
    } else {
      adviceAr = 'أتم طفلكِ عامه الأول! مسموح الآن بعسل النحل واللبن البقري المبستر وبياض البيض وتطعيم السنة (MMR).';
    }

    setBabyAgeResult({ months, days, adviceAr });
  };

  const filteredSafetyItems = useMemo(() => {
    return BABY_SAFETY_ITEMS.filter((it) => {
      if (selectedCat !== 'all' && it.category !== selectedCat) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          it.nameAr.toLowerCase().includes(q) ||
          it.nameEn.toLowerCase().includes(q) ||
          it.dangerMechanismAr.toLowerCase().includes(q) ||
          it.safeAlternativeAr.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCat]);

  const handleSpeakItem = (it: BabySafetyItem) => {
    if (speakingId === it.id) {
      stopSpeech();
      setSpeakingId(null);
      return;
    }
    const text = isAr
      ? `${it.nameAr}. السن المسموح: ${it.allowedAgeAr}. السبب الطبي: ${it.dangerMechanismAr}. البديل الآمن: ${it.safeAlternativeAr}. نصيحة الاستشاري: ${it.consultantPearlAr}`
      : `${it.nameEn}. Allowed age: ${it.allowedAgeEn}. Mechanism: ${it.dangerMechanismEn}`;
    setSpeakingId(it.id);
    speakText(text, lang, () => setSpeakingId(null));
  };

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Banner */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #0369a1 50%, #138866 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          boxShadow: '0 12px 36px rgba(13, 31, 56, 0.25)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              padding: '6px 14px',
              borderRadius: '30px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#CFD29D',
              border: '1px solid rgba(207, 210, 157, 0.4)',
            }}
          >
            👶 {tr(lang, 'عيادة واستشاري طب الأطفال وحديثي الولادة (خبرة 40 عاماً)', 'Senior Neonatology & Pediatrics Clinic (40y Experience)')}
          </span>
          <span
            style={{
              background: 'rgba(19, 136, 102, 0.45)',
              padding: '6px 14px',
              borderRadius: '30px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#dcfce7',
            }}
          >
            🛡️ {tr(lang, 'بروتوكولات الأكاديمية الأمريكية لطب الأطفال AAP & WHO', 'AAP & WHO Pediatric Guidelines')}
          </span>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 10px', color: '#ffffff', lineHeight: 1.3 }}>
          🍼 {tr(lang, 'موسوعة وعيادة «أول سنة مع طفلك»: الدليل الشامل للأم من يوم الولادة', 'First-Year Baby & Newborn Complete Clinical Guide')}
        </h1>
        <p style={{ fontSize: '1rem', opacity: 0.94, margin: '0 0 18px', maxWidth: '880px', lineHeight: 1.6 }}>
          {tr(
            lang,
            'كل ما تحتار فيه الأم في مكان واحد: (١) الممنوعات القاتلة للرضيع قبل سنة، (٢) جدول التطعيمات الأساسية والإضافية، (٣) جدول إدخال الأكل شهر بشهر، (٤) كاشف ألوان البراز، (٥) منحنى النمو والتطور، و(٦) طوارئ الصفراء والسخونة والشرقة.',
            'Everything a mother needs in one clinic: (1) Under-1 Forbidden Foods & Meds, (2) Egypt Vaccine Schedule, (3) Month-by-Month Weaning, (4) Baby Stool Color Decoder, (5) Growth Milestones, and (6) Jaundice, Fever & Choking Rescue.'
          )}
        </p>

        {/* Quick Baby Age Calculator & Quick Links to Sibling Pediatric Tools */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', flex: '1 1 380px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#f8fafc' }}>
                🎂 {tr(lang, 'تاريخ ميلاد طفلكِ لحساب عمره وتوصياته:', 'Baby Birth Date:')}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 700,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleCalculateBabyAge}
              className="btn"
              style={{
                background: '#CFD29D',
                color: '#0D1F38',
                fontWeight: 800,
                padding: '9px 16px',
                border: 'none',
                borderRadius: '8px',
                alignSelf: 'flex-end',
                cursor: 'pointer',
              }}
            >
              ✨ {tr(lang, 'احسبي عمر الطفل', 'Calculate Age')}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link
              to="/pediatric-helper"
              className="btn small"
              style={{ background: '#ffffff', color: '#0D1F38', fontWeight: 800, textDecoration: 'none', borderRadius: '10px' }}
            >
              💉 {tr(lang, 'حاسبة جرعات أشربة الأطفال بالوزن', 'Pediatric Dose Calculator')}
            </Link>
            <Link
              to="/baby-milk"
              className="btn small"
              style={{ background: '#138866', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              🍼 {tr(lang, 'دليل وبدائل حليب الأطفال', 'Baby Formula Guide')}
            </Link>
          </div>

          {babyAgeResult && (
            <div
              style={{
                width: '100%',
                background: 'rgba(13, 31, 56, 0.75)',
                padding: '10px 14px',
                borderRadius: '10px',
                marginTop: '6px',
                border: '1px solid #CFD29D',
              }}
            >
              <b style={{ color: '#CFD29D' }}>
                👶 {tr(lang, `عمر طفلكِ الآن: ${babyAgeResult.months} شهر و ${babyAgeResult.days} يوم`, `Age: ${babyAgeResult.months}m ${babyAgeResult.days}d`)}
              </b>
              <div className="small" style={{ color: '#ffffff', marginTop: '3px' }}>
                📌 {babyAgeResult.adviceAr}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6 Navigation Tabs */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
          marginBottom: '22px',
        }}
      >
        {[
          { id: 'forbidden_safe', icon: '⛔', titleAr: '١. ممنوعات قبل سنة', subAr: 'العسل، اللبن، الأدوية، المشاية', titleEn: '1. Under-1 Forbidden', subEn: 'Honey, Cow Milk & Meds' },
          { id: 'vaccines', icon: '💉', titleAr: '٢. جدول التطعيمات', subAr: 'الصحة + الروتا والمكورات', titleEn: '2. Vaccine Schedule', subEn: 'MOH + Extra Vaccines' },
          { id: 'weaning', icon: '🥣', titleAr: '٣. إدخال الطعام', subAr: 'جدول الأكل من 4 لـ 12 شهر', titleEn: '3. Weaning Guide', subEn: 'Solids Month by Month' },
          { id: 'stool_decoder', icon: '🧷', titleAr: '٤. ألوان براز الرضيع', subAr: 'الطبيعي مقابل علامات الخطر', titleEn: '4. Stool Decoder', subEn: 'Color & Texture Guide' },
          { id: 'growth_milestones', icon: '📈', titleAr: '٥. النمو والتطور والتسنين', subAr: 'الوزن، الحبو، الجلوس والنطق', titleEn: '5. Growth & Milestones', subEn: 'Weight & Motor Skills' },
          { id: 'emergencies_fever', icon: '🚑', titleAr: '٦. الصفراء والسخونة والشرقة', subAr: 'طوارئ الرضيع والكمادات والسرة', titleEn: '6. Infant Emergencies', subEn: 'Jaundice, Fever & Choking' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as NewbornTab)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                padding: '14px',
                borderRadius: '14px',
                border: isSelected ? '2px solid #0284c7' : '1px solid var(--line)',
                background: isSelected ? 'linear-gradient(135deg, #0D1F38 0%, #0284c7 100%)' : '#ffffff',
                color: isSelected ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 8px 20px rgba(2, 132, 199, 0.22)' : '0 2px 6px rgba(0,0,0,0.03)',
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
      {/* TAB 1: FORBIDDEN VS SAFE UNDER 1 YEAR                                 */}
      {/* ===================================================================== */}
      {activeTab === 'forbidden_safe' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ background: 'var(--tint)', padding: '16px', borderRadius: '16px', marginBottom: '18px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr(
                lang,
                'ابحثي عن أي طعام أو دواء للرضيع (مثال: عسل، لبن بقري، ينسون، مية، بروفين، أسبرين، مشاية، فيدروب)...',
                'Search baby foods, meds, or habits (e.g. honey, cow milk, water, brufen, aspirin, walker)...'
              )}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid rgba(2, 132, 199, 0.3)',
                fontSize: '0.98rem',
                fontWeight: 600,
                marginBottom: '12px',
                background: '#ffffff',
              }}
            />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', labelAr: '🌟 كل العناصر', labelEn: 'All Items' },
                { id: 'food_drink', labelAr: '🍼 أطعمة ومشروبات', labelEn: 'Foods & Drinks' },
                { id: 'medication', labelAr: '💊 أدوية وفيتامينات', labelEn: 'Medications' },
                { id: 'habit_care', labelAr: '🏡 عادات وممارسات', labelEn: 'Habits & Gear' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCat(c.id as any)}
                  className="btn small"
                  style={{
                    background: selectedCat === c.id ? '#0D1F38' : '#ffffff',
                    color: selectedCat === c.id ? '#ffffff' : '#334155',
                    borderRadius: '20px',
                    fontWeight: 700,
                  }}
                >
                  {isAr ? c.labelAr : c.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {filteredSafetyItems.map((it) => {
              const isForbidden = it.status === 'forbidden_under_1y';
              return (
                <article
                  key={it.id}
                  className="card"
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    border: isForbidden ? '2px solid #f87171' : '2px solid #4ade80',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <span
                        style={{
                          background: isForbidden ? '#fee2e2' : '#dcfce7',
                          color: isForbidden ? '#991b1b' : '#166534',
                          fontWeight: 900,
                          fontSize: '0.82rem',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          display: 'inline-block',
                          marginBottom: '6px',
                        }}
                      >
                        {isForbidden ? tr(lang, '⛔ ممنوع وخطير قبل عمر سنة', 'Forbidden Under 1 Year') : tr(lang, '✅ إلزامي وآمن للرضيع', 'Safe & Essential')}
                      </span>
                      <h3 style={{ margin: '2px 0', fontSize: '1.25rem', fontWeight: 900, color: '#0D1F38' }}>
                        {isAr ? it.nameAr : it.nameEn}
                      </h3>
                      <div className="small" style={{ color: '#0284c7', fontWeight: 800 }}>
                        🗓️ {tr(lang, 'السن المسموح طبياً: ', 'Allowed Age: ')}{isAr ? it.allowedAgeAr : it.allowedAgeEn}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpeakItem(it)}
                      className="btn small ghost"
                      style={{ fontWeight: 700, color: '#138866' }}
                    >
                      {speakingId === it.id ? '⏹️ إيقاف' : '🔊 نطق الشرح'}
                    </button>
                  </div>

                  <div
                    style={{
                      background: isForbidden ? '#fff1f2' : '#f0fdf4',
                      border: isForbidden ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                      padding: '12px',
                      borderRadius: '12px',
                      marginBottom: '10px',
                    }}
                  >
                    <b style={{ color: isForbidden ? '#991b1b' : '#14532d', fontSize: '0.88rem' }}>
                      🔬 {tr(lang, 'التفسير العلمي وتأثيره على أعضاء الرضيع:', 'Clinical Mechanism in Infants:')}
                    </b>
                    <p className="small" style={{ margin: '4px 0 0', color: '#1e293b', lineHeight: 1.55, fontSize: '0.9rem' }}>
                      {isAr ? it.dangerMechanismAr : it.dangerMechanismEn}
                    </p>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <b className="small" style={{ color: '#138866' }}>
                      🔄 {tr(lang, 'البديل الآمن والتصرف السليم: ', 'Safe Alternative: ')}
                    </b>
                    <span className="small" style={{ fontWeight: 700, color: '#0f172a' }}>
                      {isAr ? it.safeAlternativeAr : it.safeAlternativeEn}
                    </span>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      borderRight: isAr ? '4px solid #0D1F38' : 'none',
                      borderLeft: !isAr ? '4px solid #0D1F38' : 'none',
                    }}
                  >
                    <b style={{ fontSize: '0.84rem', color: '#0D1F38', display: 'block' }}>
                      💬 {tr(lang, 'نصيحة استشاري طب الأطفال:', 'Pediatric Consultant Pearl:')}
                    </b>
                    <span className="small" style={{ fontStyle: 'italic', color: '#334155' }}>
                      «{isAr ? it.consultantPearlAr : it.consultantPearlEn}»
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: EGYPT VACCINATION SCHEDULE + EXTRA VACCINES                    */}
      {/* ===================================================================== */}
      {activeTab === 'vaccines' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ marginBottom: '18px', background: '#f8fafc' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
              💉 {tr(lang, 'جدول تطعيمات الطفل في مصر (الإجبارية بمكتب الصحة + الإضافية بالمصل واللقاح)', 'Egypt Pediatric Immunization Schedule (Mandatory MOH + Extra Vaccines)')}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'علّمي بعلامة ( صح ) أمام كل تطعيم أتمه طفلكِ لحفظ سجل تطعيماته على هاتفكِ، مع قراءة تعليمات التعامل مع السخونة ومكان الحقنة:',
                'Check off completed vaccine visits and follow post-vaccine fever and injection-site protocols:'
              )}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {EGYPT_VACCINE_SCHEDULE.map((st, idx) => {
              const vKey = `vac-${idx}`;
              const isDone = !!completedVaccines[vKey];
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    borderRadius: '16px',
                    borderTop: `5px solid ${st.color}`,
                    padding: '20px',
                    background: isDone ? '#f0fdf4' : '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 900, color: '#0D1F38' }}>
                      🗓️ {isAr ? st.ageAr : st.ageEn}
                    </h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, color: '#138866' }}>
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleVaccineDone(vKey)}
                        style={{ width: '18px', height: '18px', accentColor: '#138866' }}
                      />
                      <span>{isDone ? tr(lang, '✅ تم التطعيم', 'Completed') : tr(lang, 'تحديد كمكتمل', 'Mark Done')}</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gap: '10px', marginBottom: '12px' }}>
                    {st.vaccines.map((v, vIdx) => (
                      <div key={vIdx} style={{ background: 'var(--tint)', padding: '12px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                        <b style={{ color: '#0D1F38', fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>
                          {isAr ? v.nameAr : v.nameEn}
                        </b>
                        <span className="small" style={{ color: '#475569' }}>
                          📍 {isAr ? v.siteAr : v.siteEn}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '10px' }}>
                    <b style={{ color: '#92400e', fontSize: '0.85rem' }}>
                      💡 {tr(lang, 'إرشادات ما بعد التطعيم للأم: ', 'Post-Vaccine Care: ')}
                    </b>
                    <span className="small" style={{ color: '#78350f', fontWeight: 600 }}>
                      {isAr ? st.careTipAr : st.careTipEn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: MONTH-BY-MONTH WEANING & SOLID FOOD INTRODUCTION               */}
      {/* ===================================================================== */}
      {activeTab === 'weaning' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ marginBottom: '18px', background: '#f8fafc' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
              🥣 {tr(lang, 'خريطة إدخال الطعام الصلب للرضيع خطوة بخطوة (من الشهر الرابع حتى السنة)', 'Step-by-Step Solid Food Introduction & Weaning Protocol')}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'كيف تبدئين إطعام طفلكِ بأمان دون التسبب في حساسية الطعام أو الإمساك أو الشرقة:',
                'How to safely transition your infant to solid meals while preventing allergies and choking:'
              )}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {WEANING_GUIDE_STAGES.map((wg, idx) => (
              <div key={idx} className="card" style={{ borderRadius: '16px', padding: '20px', borderLeft: !isAr ? '5px solid #138866' : undefined, borderRight: isAr ? '5px solid #138866' : undefined }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 900, color: '#0D1F38' }}>
                  🥄 {isAr ? wg.stageAr : wg.stageEn}
                </h3>

                <div style={{ background: 'var(--tint)', padding: '12px', borderRadius: '10px', marginBottom: '10px' }}>
                  <b style={{ color: '#0284c7', fontSize: '0.88rem', display: 'block', marginBottom: '3px' }}>
                    👶 {tr(lang, 'علامات استعداد الطفل في هذه المرحلة:', 'Developmental Readiness Signs:')}
                  </b>
                  <span className="small" style={{ color: '#334155', fontWeight: 600 }}>
                    {isAr ? wg.signsAr : wg.signsEn}
                  </span>
                </div>

                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '10px' }}>
                  <b style={{ color: '#166534', fontSize: '0.88rem', display: 'block', marginBottom: '3px' }}>
                    🥦 {tr(lang, 'الأطعمة المسموحة والموصى بها:', 'Recommended Foods & Textures:')}
                  </b>
                  <span className="small" style={{ color: '#14532d', fontWeight: 700, lineHeight: 1.5 }}>
                    {isAr ? wg.foodsAr : wg.foodsEn}
                  </span>
                </div>

                <div style={{ background: '#fffbeb', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <b style={{ color: '#92400e', fontSize: '0.86rem' }}>
                    ⭐ {tr(lang, 'القاعدة الذهبية: ', 'Golden Rule: ')}
                  </b>
                  <span className="small" style={{ color: '#78350f', fontWeight: 600 }}>
                    {isAr ? wg.goldenRuleAr : wg.goldenRuleEn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: BABY STOOL COLOR DECODER                                       */}
      {/* ===================================================================== */}
      {activeTab === 'stool_decoder' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ marginBottom: '18px', background: '#f8fafc' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
              🧷 {tr(lang, 'كاشف ومترجم ألوان وقوام براز الرضيع (دليل الحفاضة الطبي)', 'Baby Stool Color & Consistency Clinical Decoder')}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'لون براز الرضيع هو المرآة الأولى لصحة جهازه الهضمي وكبده؛ تعرفي على الفرق بين الألوان الطبيعية والألوان التي تستلزم الطوارئ:',
                'Identify normal breastfed/formula stool variations versus urgent gastrointestinal and biliary red flags:'
              )}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '16px' }}>
            {STOOL_COLORS_DECODER.map((sc) => (
              <div
                key={sc.id}
                className="card"
                style={{
                  borderRadius: '16px',
                  padding: '18px',
                  background: sc.bgHex,
                  border: `2px solid ${sc.colorHex}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: sc.colorHex,
                      display: 'inline-block',
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      flexShrink: 0,
                    }}
                  />
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 900, color: '#0D1F38' }}>
                    {isAr ? sc.titleAr : sc.titleEn}
                  </h3>
                </div>

                <span
                  style={{
                    display: 'inline-block',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  {isAr ? sc.statusBadgeAr : sc.statusBadgeEn}
                </span>

                <p className="small" style={{ margin: '0 0 10px', color: '#1e293b', lineHeight: 1.5, fontWeight: 600 }}>
                  <b>🔬 {isAr ? 'التفسير الطبي: ' : 'Meaning: '}</b>
                  {isAr ? sc.meaningAr : sc.meaningEn}
                </p>

                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <b style={{ color: '#0D1F38', fontSize: '0.82rem', display: 'block', marginBottom: '2px' }}>
                    🩺 {isAr ? 'ماذا تفعلين؟' : 'Recommended Action:'}
                  </b>
                  <span className="small" style={{ color: '#334155', lineHeight: 1.45 }}>
                    {isAr ? sc.actionAr : sc.actionEn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: GROWTH, WEIGHT & MOTOR MILESTONES                              */}
      {/* ===================================================================== */}
      {activeTab === 'growth_milestones' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ marginBottom: '18px', background: '#f8fafc' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, color: '#0D1F38' }}>
              📈 {tr(lang, 'معدلات زيادة الوزن والتطور الحركي والذهني في السنة الأولى', 'First-Year Weight Gain & Neurodevelopmental Milestones')}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'متى يصلب الطفل رأسه؟ متى يجلس ويحبو؟ وما هي علامات التأخر الحركي التي تستوجب العرض على طبيب الأطفال؟',
                'Expected weight trajectories, motor achievements, and early neurological warning signs:'
              )}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {GROWTH_MILESTONES_YEAR1.map((gm, idx) => (
              <div key={idx} className="card" style={{ borderRadius: '16px', padding: '20px', border: '1px solid var(--line)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '1.22rem', fontWeight: 900, color: '#0284c7' }}>
                  👶 {isAr ? gm.monthAr : gm.monthEn}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <b style={{ color: '#166534', fontSize: '0.86rem', display: 'block', marginBottom: '4px' }}>
                      ⚖️ {isAr ? 'معدل الوزن الطبيعي:' : 'Expected Weight Gain:'}
                    </b>
                    <span className="small" style={{ color: '#14532d', fontWeight: 700 }}>
                      {isAr ? gm.weightRuleAr : gm.weightRuleEn}
                    </span>
                  </div>

                  <div style={{ background: 'var(--tint)', padding: '12px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                    <b style={{ color: '#0D1F38', fontSize: '0.86rem', display: 'block', marginBottom: '4px' }}>
                      🤸 {isAr ? 'المهارات الحركية والحسية:' : 'Motor & Social Skills:'}
                    </b>
                    <span className="small" style={{ color: '#334155', fontWeight: 600 }}>
                      {isAr ? gm.motorSocialAr : gm.motorSocialEn}
                    </span>
                  </div>

                  <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                    <b style={{ color: '#991b1b', fontSize: '0.86rem', display: 'block', marginBottom: '4px' }}>
                      🚨 {isAr ? 'علامة خطر تستوجب الفحص:' : 'Developmental Red Flag:'}
                    </b>
                    <span className="small" style={{ color: '#7f1d1d', fontWeight: 600 }}>
                      {isAr ? gm.redFlagAr : gm.redFlagEn}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: NEWBORN EMERGENCIES (JAUNDICE, FEVER, CORD & CHOKING)          */}
      {/* ===================================================================== */}
      {activeTab === 'emergencies_fever' && (
        <section style={{ marginBottom: '28px' }}>
          <div className="card" style={{ marginBottom: '18px', background: '#fef2f2', border: '1px solid #fecaca' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, color: '#991b1b' }}>
              🚑 {tr(lang, 'طوارئ الرضيع الحرجة: الصفراء، السخونة، السرة، وإسعاف الشرقة', 'Critical Infant Protocols: Jaundice, Fever, Umbilicus & Choking Rescue')}
            </h2>
            <p className="small" style={{ margin: 0, color: '#7f1d1d' }}>
              {tr(
                lang,
                'تصحيح الأخطاء الشعبية الشائعة وبروتوكول التصرف الطبي السليم لإنقاذ طفلكِ في المواقف الحرجة:',
                'Evidence-based emergency management and debunking dangerous traditional myths:'
              )}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            {NEWBORN_EMERGENCIES_PROTOCOLS.map((em) => (
              <div key={em.id} className="card" style={{ borderRadius: '16px', padding: '20px', border: '2px solid #0D1F38' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>{em.icon}</span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0D1F38' }}>
                    {isAr ? em.titleAr : em.titleEn}
                  </h3>
                </div>

                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '10px' }}>
                  <span className="small" style={{ color: '#991b1b', fontWeight: 700, lineHeight: 1.5, display: 'block' }}>
                    {isAr ? em.dangerSignsAr : em.dangerSignsEn}
                  </span>
                </div>

                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '10px' }}>
                  <span className="small" style={{ color: '#14532d', fontWeight: 700, lineHeight: 1.55, display: 'block' }}>
                    ✅ {isAr ? em.correctProtocolAr : em.correctProtocolEn}
                  </span>
                </div>

                <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <span className="small" style={{ color: '#92400e', fontWeight: 700, lineHeight: 1.5, display: 'block' }}>
                    {isAr ? em.wrongMythAr : em.wrongMythEn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}
