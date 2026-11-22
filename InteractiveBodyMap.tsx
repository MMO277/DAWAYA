import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';
import { ANATOMY_IMAGES } from './anatomyImagesData';

export type BodySide = 'front' | 'back';
export type PatientPersona = 'male' | 'female' | 'child';

export type AnatomicalRegionId =
  | 'head_brain'
  | 'eyes_sinus'
  | 'neck_thyroid'
  | 'heart_chest'
  | 'lungs_chest'
  | 'breast_female'
  | 'breast_male'
  | 'liver_ruq'
  | 'stomach_epigastric'
  | 'lower_abdomen_rlq'
  | 'pelvis_gyn'
  | 'intestines_abdomen'
  | 'kidneys_flanks'
  | 'lower_back_spine'
  | 'upper_back'
  | 'shoulders_arms'
  | 'hips_thighs'
  | 'knees'
  | 'legs_calves'
  | 'ankles_feet'
  | 'skin_surface';

interface SymptomItem {
  id: string;
  label: string;
  danger: boolean;
}

interface ZoneProtocol {
  shortChoice: string;
  title: string;
  organs: string;
  qualities: string[];
  femaleExtraQualities?: string[];
  symptoms: SymptomItem[];
  femaleExtraSymptoms?: SymptomItem[];
  clinic: string;
  causes: string[];
  advice: string;
}

interface ActivePinState {
  side: BodySide;
  x: number;
  y: number;
  zoneId: AnatomicalRegionId;
  choices: AnatomicalRegionId[];
  sideLabel: string;
  areaName: string;
}

const ZONES: Record<AnatomicalRegionId, ZoneProtocol> = {
  breast_female: {
    shortChoice: 'الثدي نفسه (ألم / تكتل / جلد الثدي)',
    title: 'الثدي والجلد الخارجي (أنثى)',
    organs: 'نسيج الثدي، الغدد اللبنية، الحلمة، الجلد السطحي',
    qualities: ['ألم أو ثِقل وتحجر بالثدي', 'كتلة أو تكتل موضعي محسوس', 'احمرار وسخونة وتورم بالجلد', 'حكة أو طفح جلدي أو تشقق'],
    symptoms: [
      { id: 'hard_lump', label: 'كتلة صلبة غير مؤلمة أو تغير بشكل الجلد/الحلمة', danger: true },
      { id: 'blood_discharge', label: 'إفرازات دموية من الحلمة أو قرحة لا تلتئم', danger: true },
      { id: 'mastitis_fever', label: 'احمرار وسخونة شديدة مع ارتفاع حرارة (التهاب ثدي)', danger: true },
      { id: 'cycle_tender', label: 'الألم يزداد قبل موعد الدورة الشهرية ويخف بعدها', danger: false },
      { id: 'lactation', label: 'مرتبط بالرضاعة الطبيعية', danger: false },
    ],
    clinic: 'عيادة صحة المرأة وجراحة الثدي',
    causes: ['تغيرات هرمونية طبيعية مرتبطة بالدورة الشهرية', 'التهاب الغدد اللبنية أو كيس حميد', 'كتلة تحتاج فحص سونار للاطمئنان المبكر'],
    advice: 'الألم المرتبط بموعد الدورة شائع وطبيعي غالبًا، لكن أي كتلة محسوسة أو تغير بالجلد أو إفرازات دموية يستلزم فحصًا مبكرًا في عيادة صحة المرأة.',
  },
  breast_male: {
    shortChoice: 'الثدي أو عضلة وجلد الصدر من بره',
    title: 'الثدي وجدار الصدر الخارجي (ذكر)',
    organs: 'نسيج الثدي الذكري، الحلمة، العضلة الصدرية، الجلد السطحي',
    qualities: ['ألم أو تورم خلف الحلمة (تثدي)', 'شد بعضلة الصدر يزداد بالضغط أو التمرين', 'كتلة صلبة موضعية تحت الجلد', 'طفح جلدي أو حكة أو حبوب'],
    symptoms: [
      { id: 'male_lump', label: 'كتلة صلبة ثابتة أو إفرازات/انكماش بالحلمة', danger: true },
      { id: 'red_hot_chest', label: 'احمرار وسخونة متزايدة مع صديد أو حرارة', danger: true },
      { id: 'gym_strain', label: 'بدأ بعد تمرين رياضي أو مجهود بدني', danger: false },
      { id: 'med_gyno', label: 'تورم خفيف مع استخدام أدوية معينة أو مكملات', danger: false },
    ],
    clinic: 'عيادة الجراحة العامة / الجلدية',
    causes: ['شد عضلي بجدار الصدر أو التهاب غضاريف الضلوع', 'تثدي هرموني أو دوائي', 'التهاب جلدي أو كتلة سطحية تحتاج فحص جراحي'],
    advice: 'إذا كان الألم يزداد بالضغط بإصبعك على العضلة فهو غالبًا سطحي/عضلي، أما وجود كتلة صلبة خلف الحلمة فيستدعي فحصًا بعيادة الجراحة.',
  },
  skin_surface: {
    shortChoice: 'الجلد أو الجزء الخارجي فقط (طفح / تورم / جرح)',
    title: 'الجلد والأنسجة الخارجية',
    organs: 'البشرة، الأدمة، بصيلات الشعر، الأنسجة السطحية تحت الجلد',
    qualities: ['طفح جلدي أو احمرار مع حكة', 'تورم أو دُمّل أو سخونة موضعية', 'جرح أو حرق أو كدمة سطحية', 'لسعة حشرة أو حساسية تلامسية', 'ألم حارق سطحي بالجلد (حزام ناري)'],
    symptoms: [
      { id: 'allergy_swell', label: 'تورم مفاجئ بالوجه أو الشفاه أو ضيق تنفس', danger: true },
      { id: 'cellulitis', label: 'احمرار وسخونة تنتشر بسرعة مع ارتفاع حرارة', danger: true },
      { id: 'diabetic_skin', label: 'جرح أو التهاب بجلد القدم لمريض سكري', danger: true },
      { id: 'itch_dry', label: 'جفاف أو قشور أو حكة مزعجة', danger: false },
      { id: 'pus_boil', label: 'تجمع صديدي أو حبة مؤلمة تحت الجلد', danger: false },
    ],
    clinic: 'عيادة الأمراض الجلدية / الجراحة',
    causes: ['حساسية جلدية أو إكزيما تلامسية', 'التهاب بكتيري سطحي أو دُمّل', 'جرح/كدمة سطحية أو حزام ناري'],
    advice: 'تجنب حك المنطقة أو فتح أي دُمّل باليد، ولا تضع كريمات كورتيزون بدون وصفة. عند انتشار الاحمرار بسرعة مع حرارة توجه للطوارئ فورًا.',
  },
  head_brain: {
    shortChoice: 'الصداع والمخ من الداخل',
    title: 'الرأس والمخ والجمجمة',
    organs: 'المخ، السحايا، الأوعية الدماغية',
    qualities: ['صداع نابض بنصف الرأس', 'ضغط وثِقل حول الرأس', 'ألم مفاجئ وحاد جدًا', 'دوخة وعدم اتزان'],
    symptoms: [
      { id: 'slurred', label: 'تلعثم بالكلام أو تنميل بنصف الوجه', danger: true },
      { id: 'thunder', label: 'أعنف صداع مفاجئ في حياتي', danger: true },
      { id: 'nausea', label: 'غثيان أو حساسية للضوء', danger: false },
      { id: 'vision', label: 'زغللة أو تشوش بالرؤية', danger: false },
    ],
    femaleExtraSymptoms: [{ id: 'hormonal_mig', label: 'يزداد مع اقتراب الدورة الشهرية أو مع الحمل', danger: false }],
    clinic: 'عيادة المخ والأعصاب',
    causes: ['الصداع النصفي (الشقيقة) أو التوتري', 'ارتفاع ضغط الدم المفاجئ', 'إجهاد شديد أو صداع هرموني'],
    advice: 'قم بقياس ضغط الدم فورًا، استرح في إضاءة هادئة واشرب ماء، وتوجّه للطوارئ عند وجود أي تنميل أو تلعثم.',
  },
  eyes_sinus: {
    shortChoice: 'العينين والجيوب الأنفية',
    title: 'العينين والجيوب الأنفية والوجه',
    organs: 'العينان، الجيوب الأنفية، العصب الخامس',
    qualities: ['ضغط وامتلاء حول العين والأنف', 'ألم يزداد عند الانحناء للأمام', 'حرقة أو احمرار بالعين', 'ألم كهربائي بالوجه'],
    symptoms: [
      { id: 'sudden_loss', label: 'فقدان مفاجئ أو تشوش حاد بالرؤية', danger: true },
      { id: 'congestion', label: 'انسداد أو إفرازات بالأنف', danger: false },
      { id: 'fever', label: 'ارتفاع درجة الحرارة', danger: false },
    ],
    clinic: 'عيادة الأنف والأذن / الرمد',
    causes: ['التهاب الجيوب الأنفية الحاد', 'إجهاد العين أو جفافها', 'التهاب العصب الوجهي أو حساسية الأنف'],
    advice: 'استخدم غسول محلول ملحي للأنف وراجع طبيب الرمد فورًا لو كان الألم داخل العين مع ضعف رؤية.',
  },
  neck_thyroid: {
    shortChoice: 'الحلق والغدة والفقرات العنقية',
    title: 'الرقبة والحلق والغدة الدرقية',
    organs: 'القصبة الهوائية، الحنجرة، الغدة الدرقية، الفقرات العنقية',
    qualities: ['شد وتيبس بعضلات الرقبة', 'ألم وحرقان مع البلع', 'ألم يمتد للكتف والذراع', 'تورم أو ضغط بمقدمة الرقبة'],
    symptoms: [
      { id: 'airway', label: 'صعوبة في التنفس أو البلع', danger: true },
      { id: 'stiff_fever', label: 'تيبس شديد بالرقبة مع حرارة عالية', danger: true },
      { id: 'hoarse', label: 'بحة بالصوت أو احتقان حلق', danger: false },
    ],
    clinic: 'عيادة الأنف والأذن / الغدد الصماء',
    causes: ['إجهاد عضلات الرقبة أو خشونة الفقرات العنقية', 'التهاب الحلق واللوزتين', 'تضخم أو نشاط الغدة الدرقية'],
    advice: 'تجنب ثني الرقبة طويلاً أمام الهاتف، وتوجه للطوارئ فورًا لو شعرت بصعوبة تنفس أو بلع.',
  },
  heart_chest: {
    shortChoice: 'القلب ومنتصف الصدر من الداخل',
    title: 'القلب ومنتصف الصدر الداخلي',
    organs: 'القلب، الشرايين التاجية، الشريان الأورطي، التامور',
    qualities: ['ألم ضاغط أو ثِقل عاصر بالصدر', 'خفقان وتسارع ضربات القلب', 'نغزة حادة تزيد مع النفس', 'حرقان يمتد لأعلى الحلق'],
    symptoms: [
      { id: 'radiate_arm', label: 'يمتد للذراع اليسرى أو الفك أو الظهر', danger: true },
      { id: 'cold_sweat', label: 'تعرق بارد أو دوخة وإغماء', danger: true },
      { id: 'sob', label: 'نهجان وضيق تنفس شديد', danger: true },
      { id: 'after_meal', label: 'يزداد بعد الأكل أو الاستلقاء', danger: false },
    ],
    clinic: 'عيادة القلب والأوعية الدموية',
    causes: ['الذبحة الصدرية أو قصور الشرايين التاجية', 'اضطراب نظم القلب أو ارتفاع الضغط', 'ارتجاع المريء'],
    advice: 'لا تتجاهل أي ألم ضاغط بداخل الصدر: عند وجود عرق بارد أو امتداد للذراع اتصل بالإسعاف 123 فورًا، وإلا اعمل رسم قلب (ECG).',
  },
  lungs_chest: {
    shortChoice: 'الرئتين والتنفس من الداخل',
    title: 'الصدر الداخلي والرئتين',
    organs: 'الرئتان، الشعب الهوائية، الغشاء البلوري',
    qualities: ['نغزة عميقة تزيد مع الشهيق', 'ضيق وصفير أثناء التنفس', 'ألم مع الكحة المستمرة'],
    symptoms: [
      { id: 'severe_sob', label: 'نهجان شديد أو زرقة بالشفاه', danger: true },
      { id: 'cough_blood', label: 'كحة مصحوبة بدم', danger: true },
      { id: 'cough_phlegm', label: 'كحة ببلغم أو حساسية صدر', danger: false },
      { id: 'fever_chest', label: 'ارتفاع درجة الحرارة', danger: false },
    ],
    clinic: 'عيادة الصدر والجهاز التنفسي',
    causes: ['التهاب الشعب الهوائية أو حساسية الصدر (الربو)', 'التهاب الغشاء البلوري أو الالتهاب الرئوي'],
    advice: 'تجنب التدخين والأتربة، راقب نسبة الأكسجين، ولا تأخذ مضادًا حيويًا بدون فحص طبيب الصدر.',
  },
  liver_ruq: {
    shortChoice: 'الكبد والمرارة من الداخل',
    title: 'أعلى يمين البطن — الكبد والمرارة',
    organs: 'الكبد، الحوصلة المرارية، القنوات المرارية',
    qualities: ['مغص حاد بعد الأكل الدسم', 'ثِقل وألم مستمر أسفل الضلوع اليمنى', 'ألم يمتد للكتف الأيمن'],
    symptoms: [
      { id: 'jaundice', label: 'اصفرار بالعينين أو الجلد', danger: true },
      { id: 'high_fever', label: 'حرارة عالية مع رعشة شديدة', danger: true },
      { id: 'fatty_trigger', label: 'يزداد بعد الوجبات الدسمة', danger: false },
    ],
    clinic: 'عيادة الكبد والجهاز الهضمي',
    causes: ['المغص المراري أو حصوات المرارة', 'الكبد الدهني أو التهاب الكبد'],
    advice: 'تجنب الدهون والمقليات، وراجع أدويتك عبر فاحص أمان الأدوية في دوايا.',
  },
  stomach_epigastric: {
    shortChoice: 'المعدة وفم المعدة من الداخل',
    title: 'فم المعدة وأعلى يسار البطن',
    organs: 'المعدة، أسفل المريء، الاثني عشر، البنكرياس',
    qualities: ['حرقان وحموضة بفم المعدة', 'ألم حاد بعد المسكنات أو الجوع', 'ألم يمتد للظهر بعد الأكل'],
    symptoms: [
      { id: 'blood_vomit', label: 'قيء دموي أو براز أسود قاتم', danger: true },
      { id: 'rigid_belly', label: 'تحجر شديد بالبطن وألم لا يُحتمل', danger: true },
      { id: 'acid_reflux', label: 'طعم مر أو ارتجاع للحلق', danger: false },
    ],
    clinic: 'عيادة الباطنة والجهاز الهضمي',
    causes: ['التهاب المعدة أو ارتجاع المريء', 'جرثومة المعدة أو قرحة المعدة'],
    advice: 'أوقف المسكنات على معدة فارغة، قلل المنبهات والتوابل، وتجنب الاستلقاء فور الأكل.',
  },
  lower_abdomen_rlq: {
    shortChoice: 'القولون والزائدة من الداخل',
    title: 'أسفل يمين البطن — القولون والزائدة الدودية',
    organs: 'الزائدة الدودية، القولون الصاعد، الحالب الأيمن',
    qualities: ['ألم بدأ حول السرة ثم استقر أسفل اليمين', 'مغص متقطع مع غازات', 'ألم حاد يزداد مع الحركة'],
    femaleExtraQualities: ['ألم حاد بجهة المبيض الأيمن'],
    symptoms: [
      { id: 'rebound', label: 'الألم يزيد بشدة مع الحركة أو الضغط', danger: true },
      { id: 'fever_vomit', label: 'ارتفاع حرارة مع قيء وفقدان شهية', danger: true },
      { id: 'bloating', label: 'انتفاخ وتراكم غازات', danger: false },
    ],
    femaleExtraSymptoms: [{ id: 'ectopic_risk', label: 'تأخر الدورة الشهرية أو احتمالية حمل', danger: true }],
    clinic: 'عيادة الجراحة العامة / النساء والتوليد',
    causes: ['اشتباه التهاب الزائدة الدودية', 'القولون العصبي أو مغص الحالب', 'أسباب المبيض والحمل (للإناث)'],
    advice: 'لا تأخذ مسكنات قوية ولا ملينات قبل استبعاد التهاب الزائدة الدودية عند الطبيب.',
  },
  pelvis_gyn: {
    shortChoice: 'الرحم والمبايض / الدورة الشهرية',
    title: 'أسفل البطن والحوض — الرحم والمبايض والمثانة',
    organs: 'الرحم، المبيضان، قناتا فالوب، المثانة البولية',
    qualities: ['تقلصات دورة شهرية (عسر طمث)', 'ألم حاد مفاجئ بجانب واحد من الحوض', 'ثِقل وضغط بأسفل الحوض والظهر', 'حرقان مع التبول'],
    symptoms: [
      { id: 'preg_delay', label: 'تأخر الدورة الشهرية أو احتمالية وجود حمل', danger: true },
      { id: 'heavy_bleed', label: 'نزيف مهبلي غزير أو غير معتاد مع دوخة', danger: true },
      { id: 'period_now', label: 'الألم متزامن مع موعد الدورة الشهرية حاليًا', danger: false },
      { id: 'gyn_fever', label: 'ارتفاع حرارة أو إفرازات غير طبيعية', danger: false },
    ],
    clinic: 'عيادة النساء والتوليد',
    causes: ['عسر الطمث وتقلصات الدورة الشهرية', 'أكياس المبايض أو التهاب الحوض', 'التهاب المسالك البولية أو اشتباه حمل خارج الرحم'],
    advice: 'في حال تقلصات الدورة المعتادة تفيد الكمادات الدافئة، أما عند تأخر الدورة مع ألم حاد أو نزيف غزير فتوجّهي لطوارئ النساء والتوليد فورًا.',
  },
  intestines_abdomen: {
    shortChoice: 'القولون والأمعاء من الداخل',
    title: 'وسط وأسفل البطن — القولون والأمعاء',
    organs: 'الأمعاء الدقيقة، القولون المستعرض والنازل، المثانة',
    qualities: ['مغص وتقلصات متقطعة', 'انتفاخ وغازات واضحة', 'حرقان أو ضغط أسفل البطن'],
    symptoms: [
      { id: 'blood_stool', label: 'وجود دم بالبراز أو إسهال شديد مع جفاف', danger: true },
      { id: 'urine_burn', label: 'حرقان أو صعوبة في التبول', danger: false },
      { id: 'stress_ibs', label: 'يزداد مع التوتر أو أطعمة معينة', danger: false },
    ],
    clinic: 'عيادة الباطنة والجهاز الهضمي',
    causes: ['متلازمة القولون العصبي', 'نزلة معوية أو عسر هضم', 'التهاب المسالك البولية'],
    advice: 'أكثر من السوائل الدافئة وقلل البقوليات والدهون مؤقتًا.',
  },
  kidneys_flanks: {
    shortChoice: 'الكليتين والحالبين من الداخل',
    title: 'الجانبين — منطقة الكليتين والحالبين',
    organs: 'الكلية، حوض الكلى، الحالب',
    qualities: ['مغص كلوي حاد ومفاجئ بالجنب', 'ألم يمتد من الجنب لأسفل البطن', 'ألم عميق ومستمر بالجنب'],
    symptoms: [
      { id: 'kidney_fever', label: 'حرارة عالية مع رعشة (اشتباه التهاب كلوي)', danger: true },
      { id: 'blood_urine', label: 'دم واضح بالبول أو انحباس البول', danger: true },
      { id: 'burn_urine', label: 'حرقان أو تكرار التبول', danger: false },
    ],
    clinic: 'عيادة المسالك البولية والكلى',
    causes: ['حصوات أو أملاح الكلى والحالب', 'التهاب حوض الكلى أو المسالك البولية'],
    advice: 'اشرب ماء بكثرة وتجنب الإفراط في المسكنات لأنها تضر الكلى.',
  },
  lower_back_spine: {
    shortChoice: 'الفقرات القطنية والعضلات',
    title: 'أسفل الظهر — الفقرات القطنية والعمود الفقري',
    organs: 'الفقرات القطنية، الغضاريف، العصب الوركي',
    qualities: ['ألم يمتد من الظهر لأسفل الساق (عرق نسا)', 'شد وتيبس عضلي بأسفل الظهر', 'ألم حاد بعد حمل وزن ثقيل'],
    symptoms: [
      { id: 'cauda', label: 'فقدان التحكم في البول أو تنميل شديد بالساقين', danger: true },
      { id: 'foot_drop', label: 'ضعف مفاجئ في رفع القدم أو المشي', danger: true },
      { id: 'sciatica', label: 'تنميل أو كهرباء خلف الفخذ', danger: false },
    ],
    femaleExtraSymptoms: [{ id: 'period_back', label: 'الألم متزامن مع الدورة الشهرية أو الحمل', danger: false }],
    clinic: 'عيادة العظام والعمود الفقري',
    causes: ['شد عضلي حاد بأسفل الظهر', 'انزلاق غضروفي ضاغط على العصب الوركي', 'ألم محوّل من الحوض أو الدورة الشهرية'],
    advice: 'تجنب الانحناء المفاجئ وحمل الأوزان، وتوجّه للطوارئ فورًا لو ظهر ضعف بالساقين.',
  },
  upper_back: {
    shortChoice: 'الفقرات الصدرية والعضلات',
    title: 'أعلى الظهر والفقرات الصدرية ولوح الكتف',
    organs: 'الفقرات الصدرية، لوح الكتف، العضلة شبه المنحرفة',
    qualities: ['شد وعُقد عضلية بين الكتفين', 'ألم حارق مع الجلوس أمام الشاشات', 'ألم يمتد من الصدر للظهر'],
    symptoms: [
      { id: 'chest_back', label: 'ألم مفاجئ ممزق يمتد من الصدر للظهر مع نهجان', danger: true },
      { id: 'posture', label: 'جلوس طويل أمام الشاشات', danger: false },
    ],
    clinic: 'عيادة العظام والعلاج الطبيعي',
    causes: ['إجهاد عضلات أعلى الظهر', 'التهاب مفاصل الفقرات الصدرية'],
    advice: 'عدّل وضعية الجلوس وقم بتمارين إطالة لطيفة مع كمادات دافئة.',
  },
  shoulders_arms: {
    shortChoice: 'المفصل والعضلات والأعصاب',
    title: 'مفصل الكتف والذراع والمرفق',
    organs: 'مفصل الكتف، أوتار الكفة المدورة، عظمة العضد، أعصاب الذراع',
    qualities: ['ألم عند رفع الذراع لأعلى', 'تنميل ووخز يمتد للأصابع', 'شد عضلي بعد مجهود'],
    symptoms: [
      { id: 'left_arm_heart', label: 'ألم بالذراع اليسرى مع ضيق صدر أو عرق بارد', danger: true },
      { id: 'trauma', label: 'سقوط أو إصابة مباشرة مع عدم قدرة على التحريك', danger: true },
    ],
    clinic: 'عيادة العظام والمفاصل',
    causes: ['التهاب أوتار الكتف أو المرفق', 'إجهاد عضلي أو ضغط أعصاب الرقبة'],
    advice: 'أرح الذراع وتجنب رفع الأوزان فوق الرأس.',
  },
  hips_thighs: {
    shortChoice: 'مفصل الورك وعضلات الفخذ',
    title: 'مفصل الحوض والفخذ',
    organs: 'مفصل الورك، عظمة الفخذ، عضلات الفخذ',
    qualities: ['ألم عميق بالمفصل مع المشي', 'شد عضلي بالفخذ', 'ألم ممتد من أسفل الظهر'],
    symptoms: [
      { id: 'cant_walk', label: 'عدم القدرة على التحميل على الساق بعد إصابة', danger: true },
      { id: 'swollen_thigh', label: 'تورم وسخونة واحمرار بفخذ واحد فقط', danger: true },
    ],
    clinic: 'عيادة العظام والمفاصل',
    causes: ['شد عضلي بالفخذ', 'خشونة أو التهاب مفصل الورك'],
    advice: 'أرح المفصل واستخدم كمادات باردة أول 24 ساعة في حال الإصابة.',
  },
  knees: {
    shortChoice: 'مفصل الركبة والغضاريف',
    title: 'مفصل الركبة والغضاريف',
    organs: 'مفصل الركبة، الصابونة، الغضروف الهلالي، الأربطة',
    qualities: ['ألم مع صعود السلم أو الثني', 'طقطقة وخشونة بالمفصل', 'تورم وتجمع سوائل بالركبة'],
    symptoms: [
      { id: 'locked_knee', label: 'تورم شديد مفاجئ أو تعليق كامل بالمفصل', danger: true },
      { id: 'hot_red', label: 'احمرار وسخونة بالركبة مع حرارة بالجسم', danger: true },
    ],
    clinic: 'عيادة العظام والمفاصل',
    causes: ['خشونة مفصل الركبة', 'إجهاد الأربطة أو الغضروف الهلالي'],
    advice: 'تجنب الثني الكامل للركبة والوقوف الطويل.',
  },
  legs_calves: {
    shortChoice: 'العضلات والأوردة والعظام',
    title: 'الساق وعضلة السمانة والأوردة',
    organs: 'عظمة القصبة، عضلة السمانة، الأوردة العميقة، وتر أكيليس',
    qualities: ['شد عضلي مفاجئ بالسمانة', 'تورم وثِقل وألم بالساق', 'ألم بوتر الكعب الخلفي'],
    symptoms: [
      { id: 'dvt_sign', label: 'تورم واحمرار وسخونة بساق واحدة فقط', danger: true },
      { id: 'sob_leg', label: 'تورم بالساق مع نهجان مفاجئ', danger: true },
    ],
    clinic: 'عيادة الأوعية الدموية / العظام',
    causes: ['شد عضلي أو دوالي الساقين', 'اشتباه جلطة وريدية عميقة (عند تورم ساق واحدة)'],
    advice: 'عند تورم وسخونة ساق واحدة فقط، لا تقم بتدليكها وتوجّه فورًا لعمل دوبلر للأوردة.',
  },
  ankles_feet: {
    shortChoice: 'المفصل والأربطة والكعب',
    title: 'مفصل الكاحل والقدم والكعب',
    organs: 'مفصل الكاحل، أربطة القدم، اللفافة الأخمصية',
    qualities: ['التواء وتورم بالكاحل', 'ألم حاد بالكعب عند أول خطوة صباحًا', 'تنميل وحرقان بأطراف القدم'],
    symptoms: [
      { id: 'no_weight', label: 'عدم القدرة على الوقوف بعد التواء شديد', danger: true },
      { id: 'diabetic_wound', label: 'جرح أو احمرار متزايد مع وجود سكر', danger: true },
    ],
    clinic: 'عيادة العظام / القدم السكري',
    causes: ['التواء أربطة الكاحل', 'التهاب اللفافة الأخمصية (شوكة الكعب)', 'التهاب أعصاب طرفية أو نقرس'],
    advice: 'ارفع القدم للراحة وراجع الطبيب فورًا لمرضى السكري عند أي احمرار أو جرح.',
  },
};

function detectRegionAndChoices(
  sex: 'male' | 'female',
  side: BodySide,
  x: number,
  y: number
): { primary: AnatomicalRegionId; choices: AnatomicalRegionId[]; sideLabel: string; areaName: string } {
  let sideLabel = 'المنتصف';
  if (x < 46.5) sideLabel = side === 'front' ? 'الجهة اليمنى' : 'الجهة اليسرى';
  else if (x > 53.5) sideLabel = side === 'front' ? 'الجهة اليسرى' : 'الجهة اليمنى';

  const breastKey: AnatomicalRegionId = sex === 'female' ? 'breast_female' : 'breast_male';

  if (side === 'front') {
    if (y < 12.5) return { primary: 'head_brain', choices: ['head_brain', 'skin_surface'], sideLabel, areaName: 'الرأس' };
    if (y < 18.0) return { primary: 'eyes_sinus', choices: ['eyes_sinus', 'skin_surface'], sideLabel, areaName: 'الوجه والعينين' };
    if (y < 23.0) return { primary: 'neck_thyroid', choices: ['neck_thyroid', 'skin_surface'], sideLabel, areaName: 'الرقبة' };
    if (y < 35.5) {
      if (x < 35 || x > 65) return { primary: 'shoulders_arms', choices: ['shoulders_arms', 'skin_surface'], sideLabel, areaName: 'الكتف والذراع' };
      if (x >= 47.5 && x <= 57.5) {
        return { primary: 'heart_chest', choices: ['heart_chest', 'lungs_chest', breastKey, 'skin_surface'], sideLabel: 'منطقة الصدر والثدي', areaName: 'الصدر' };
      }
      return { primary: 'lungs_chest', choices: ['lungs_chest', 'heart_chest', breastKey, 'skin_surface'], sideLabel: `منطقة الصدر والثدي (${sideLabel})`, areaName: 'الصدر' };
    }
    if (y < 59.0 && (x < 34 || x > 66)) return { primary: 'shoulders_arms', choices: ['shoulders_arms', 'skin_surface'], sideLabel, areaName: 'الذراع واليد' };
    if (y < 42.5) {
      if (x < 49.5) return { primary: 'liver_ruq', choices: ['liver_ruq', 'skin_surface'], sideLabel: 'أعلى اليمين', areaName: 'أعلى يمين البطن' };
      return { primary: 'stomach_epigastric', choices: ['stomach_epigastric', 'skin_surface'], sideLabel: 'أعلى اليسار / المنتصف', areaName: 'أعلى البطن' };
    }
    if (sex === 'female' && y >= 47.0 && y <= 56.0 && x >= 38 && x <= 62) {
      return { primary: 'pelvis_gyn', choices: ['pelvis_gyn', 'intestines_abdomen', 'skin_surface'], sideLabel: 'أسفل البطن والحوض', areaName: 'الحوض' };
    }
    if (y < 52.5) {
      if (x < 46.5) return { primary: 'lower_abdomen_rlq', choices: ['lower_abdomen_rlq', 'skin_surface'], sideLabel: 'أسفل اليمين', areaName: 'أسفل يمين البطن' };
      return { primary: 'intestines_abdomen', choices: ['intestines_abdomen', 'skin_surface'], sideLabel, areaName: 'البطن' };
    }
    if (y < 67.5) return { primary: 'hips_thighs', choices: ['hips_thighs', 'skin_surface'], sideLabel, areaName: 'الفخذ والحوض' };
    if (y < 76.0) return { primary: 'knees', choices: ['knees', 'skin_surface'], sideLabel, areaName: 'الركبة' };
    if (y < 89.5) return { primary: 'legs_calves', choices: ['legs_calves', 'skin_surface'], sideLabel, areaName: 'الساق' };
    return { primary: 'ankles_feet', choices: ['ankles_feet', 'skin_surface'], sideLabel, areaName: 'الكاحل والقدم' };
  }

  if (y < 18.0) return { primary: 'head_brain', choices: ['head_brain', 'skin_surface'], sideLabel: 'مؤخرة الرأس', areaName: 'مؤخرة الرأس' };
  if (y < 23.5) return { primary: 'neck_thyroid', choices: ['neck_thyroid', 'skin_surface'], sideLabel: 'خلف الرقبة', areaName: 'خلف الرقبة' };
  if (y < 59.0 && (x < 34 || x > 66)) return { primary: 'shoulders_arms', choices: ['shoulders_arms', 'skin_surface'], sideLabel, areaName: 'الذراع الخلفي' };
  if (y < 36.5) return { primary: 'upper_back', choices: ['upper_back', 'skin_surface'], sideLabel, areaName: 'أعلى الظهر' };
  if (y < 45.0) {
    if (x < 45.5 || x > 54.5) return { primary: 'kidneys_flanks', choices: ['kidneys_flanks', 'lower_back_spine', 'skin_surface'], sideLabel, areaName: 'الجانب والكلى' };
    return { primary: 'lower_back_spine', choices: ['lower_back_spine', 'kidneys_flanks', 'skin_surface'], sideLabel: 'العمود الفقري', areaName: 'الظهر' };
  }
  if (y < 53.0) return { primary: 'lower_back_spine', choices: ['lower_back_spine', 'skin_surface'], sideLabel, areaName: 'أسفل الظهر' };
  if (y < 67.5) return { primary: 'hips_thighs', choices: ['hips_thighs', 'skin_surface'], sideLabel, areaName: 'الحوض والفخذ الخلفي' };
  if (y < 76.0) return { primary: 'knees', choices: ['knees', 'skin_surface'], sideLabel: `خلف الركبة (${sideLabel})`, areaName: 'خلف الركبة' };
  if (y < 90.0) return { primary: 'legs_calves', choices: ['legs_calves', 'skin_surface'], sideLabel, areaName: 'السمانة' };
  return { primary: 'ankles_feet', choices: ['ankles_feet', 'skin_surface'], sideLabel, areaName: 'الكعب والقدم' };
}

function getScoreColor(score: number): string {
  if (score >= 7) return '#EF4444';
  if (score >= 4) return '#F59E0B';
  return '#10B981';
}

export default function InteractiveBodyMap({ embedded = false }: { embedded?: boolean }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [activeSex, setActiveSex] = useState<'male' | 'female'>('male');
  const [activeSide, setActiveSide] = useState<BodySide>('front');
  const [organReveal, setOrganReveal] = useState<number>(65);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const [activePin, setActivePin] = useState<ActivePinState | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<'acute' | 'subacute' | 'chronic'>('subacute');
  const [painScore, setPainScore] = useState<number>(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [stageNotice, setStageNotice] = useState<string>('');

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const bodyBoxRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const totalMovedRef = useRef<number>(0);
  const lastPinchDistRef = useRef<number | null>(null);

  const clampPanCoords = (nx: number, ny: number, z: number) => {
    const vw = viewportRef.current?.clientWidth || 500;
    const vh = viewportRef.current?.clientHeight || 580;
    const maxX = Math.max(0, (z - 1) * vw * 0.45);
    const maxY = Math.max(0, (z - 1) * vh * 0.48);
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    };
  };

  const updateZoom = (nextZoom: number) => {
    const z = Math.max(1, Math.min(3.2, nextZoom));
    setZoom(z);
    setPan((prev) => clampPanCoords(prev.x, prev.y, z));
  };

  const resetForPin = (pin: ActivePinState, sexForCalc: 'male' | 'female') => {
    const z = ZONES[pin.zoneId];
    const quals = sexForCalc === 'female' && z.femaleExtraQualities ? [...z.qualities, ...z.femaleExtraQualities] : z.qualities;
    setActivePin(pin);
    setSelectedQuality(quals[0] || '');
    setSelectedDuration('subacute');
    setSelectedSymptoms([]);
    setShowReport(false);
    setStageNotice('');
  };

  const handleSexSwitch = (sex: 'male' | 'female') => {
    setActiveSex(sex);
    if (activePin) {
      const re = detectRegionAndChoices(sex, activePin.side, activePin.x, activePin.y);
      resetForPin(
        {
          side: activePin.side,
          x: activePin.x,
          y: activePin.y,
          zoneId: re.primary,
          choices: re.choices,
          sideLabel: re.sideLabel,
          areaName: re.areaName,
        },
        sex
      );
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('label')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      totalMovedRef.current = 0;
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      lastPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      dragStartRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDistRef.current && dist > 10) {
        updateZoom(zoom * (dist / lastPinchDistRef.current));
      }
      lastPinchDistRef.current = dist;
      totalMovedRef.current = 999;
      return;
    }

    if (dragStartRef.current && pointersRef.current.size === 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      totalMovedRef.current = Math.max(totalMovedRef.current, Math.hypot(dx, dy));
      if (totalMovedRef.current > 6 && zoom > 1.02) {
        setIsPanning(true);
        setPan(clampPanCoords(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy, zoom));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    setIsPanning(false);
    if (pointersRef.current.size < 2) lastPinchDistRef.current = null;

    if (dragStartRef.current && totalMovedRef.current < 8 && bodyBoxRef.current) {
      const rect = bodyBoxRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      const relY = ((e.clientY - rect.top) / rect.height) * 100;

      if (relX >= 18 && relX <= 82 && relY >= 4 && relY <= 98) {
        const det = detectRegionAndChoices(activeSex, activeSide, relX, relY);
        resetForPin(
          {
            side: activeSide,
            x: relX,
            y: relY,
            zoneId: det.primary,
            choices: det.choices,
            sideLabel: det.sideLabel,
            areaName: det.areaName,
          },
          activeSex
        );
      } else {
        setStageNotice('اضغط مباشرة على الجسم نفسه لتحديد مكان الألم');
      }
    }
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) < 2) return;
    if (zoom > 1 || e.deltaY < 0) {
      e.preventDefault();
      updateZoom(zoom - e.deltaY * 0.002);
    }
  };

  const activeZone = activePin ? ZONES[activePin.zoneId] : null;
  const effectiveQualities = activeZone
    ? activeSex === 'female' && activeZone.femaleExtraQualities
      ? [...activeZone.qualities, ...activeZone.femaleExtraQualities]
      : activeZone.qualities
    : [];
  const effectiveSymptoms = activeZone
    ? activeSex === 'female' && activeZone.femaleExtraSymptoms
      ? [...activeZone.symptoms, ...activeZone.femaleExtraSymptoms]
      : activeZone.symptoms
    : [];

  const hasDangerSymptom = effectiveSymptoms.some((s) => s.danger && selectedSymptoms.includes(s.id));
  const isEmergency =
    Boolean(activePin) &&
    (hasDangerSymptom ||
      (painScore >= 8 &&
        selectedDuration === 'acute' &&
        (activePin!.zoneId === 'heart_chest' ||
          activePin!.zoneId === 'lower_abdomen_rlq' ||
          activePin!.zoneId === 'head_brain' ||
          activePin!.zoneId === 'pelvis_gyn')));
  const isUrgent = Boolean(activePin) && !isEmergency && (painScore >= 7 || selectedDuration === 'acute');

  const displayTitle =
    activePin && activeZone
      ? activePin.zoneId === 'skin_surface'
        ? `الجلد والأنسجة الخارجية — ${activePin.areaName}`
        : activeZone.title
      : '';

  const durText =
    selectedDuration === 'acute' ? 'مفاجئ (منذ ساعات)' : selectedDuration === 'subacute' ? 'منذ أيام' : 'مستمر / متكرر';

  const selectedSymptomLabels = effectiveSymptoms
    .filter((s) => selectedSymptoms.includes(s.id))
    .map((s) => s.label);

  const assistantQuery = activePin && activeZone
    ? `أنا ${activeSex === 'female' ? 'أنثى' : 'ذكر'} وعندي ألم في ${displayTitle} (${activePin.sideLabel})، طبيعة الشكوى: ${selectedQuality}، المدة: ${durText}، الشدة: ${painScore}/10${selectedSymptomLabels.length ? `، والأعراض المصاحبة: ${selectedSymptomLabels.join('، ')}` : ''}. عايز أعرف التقييم المبدئي والعيادة المناسبة.`
    : '';

  const auraColor = getScoreColor(painScore);
  const auraDuration = painScore >= 7 ? '0.85s' : painScore >= 4 ? '1.25s' : '1.65s';
  const skinOpacity = Number(((100 - organReveal) / 100).toFixed(2));

  const frontOrgansSrc = activeSex === 'female' ? ANATOMY_IMAGES.femaleFrontOrgans : ANATOMY_IMAGES.maleFrontOrgans;
  const frontSkinSrc = activeSex === 'female' ? ANATOMY_IMAGES.femaleFrontSkin : ANATOMY_IMAGES.maleFrontSkin;
  const backOrgansSrc = activeSex === 'female' ? ANATOMY_IMAGES.femaleBackOrgans : ANATOMY_IMAGES.maleBackOrgans;

  return (
    <section
      className="dawaya-bm-shell"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        width: '100%',
        margin: embedded ? '0' : '0 auto',
        maxWidth: embedded ? '100%' : '1240px',
        padding: embedded ? '0' : '18px 14px 36px',
      }}
    >
      <style>{`
        .dawaya-bm-card {
          background: #FFFFFF;
          border-radius: 22px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 18px 44px rgba(13, 31, 56, 0.08);
          overflow: hidden;
        }
        .dawaya-bm-topbar {
          background: #0D1F38;
          color: #FFFFFF;
          padding: 16px 20px;
          border-bottom: 3px solid #138866;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .dawaya-bm-seg {
          display: inline-flex;
          gap: 4px;
          padding: 4px;
          border-radius: 12px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.16);
        }
        .dawaya-bm-seg button {
          border: none;
          border-radius: 9px;
          padding: 7px 14px;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          background: transparent;
          color: #CBD5E1;
          transition: all 0.16s ease;
        }
        .dawaya-bm-seg button.active {
          background: #138866;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(19, 136, 102, 0.4);
        }
        .dawaya-bm-grid {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
          gap: 18px;
          padding: 18px;
          background: #F8FAFC;
          align-items: start;
        }
        @media (max-width: 960px) {
          .dawaya-bm-grid {
            grid-template-columns: 1fr;
            padding: 12px;
          }
        }
        .dawaya-bm-viewport {
          position: relative;
          width: 100%;
          height: 600px;
          border-radius: 18px;
          overflow: hidden;
          background: radial-gradient(ellipse at 50% 42%, #132A46 0%, #071222 68%, #040A14 100%);
          border: 1px solid rgba(207, 210, 157, 0.28);
          touch-action: none;
          user-select: none;
          cursor: crosshair;
        }
        .dawaya-bm-viewport.panning { cursor: grabbing; }
        @media (max-width: 768px) {
          .dawaya-bm-viewport { height: 470px; }
        }
        .dawaya-bm-pan {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
          will-change: transform;
        }
        .dawaya-bm-box {
          position: relative;
          height: 94%;
          aspect-ratio: 2 / 3;
          max-width: 94%;
        }
        .dawaya-bm-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          display: block;
        }
        .dawaya-bm-ctrl {
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(13, 31, 56, 0.88);
          color: #E2E8F0;
          border-radius: 11px;
          padding: 7px 13px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dawaya-bm-ctrl.active {
          background: #138866;
          color: #FFFFFF;
          border-color: #24C8B8;
        }
        .dawaya-bm-zoombtn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(13, 31, 56, 0.9);
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .dawaya-bm-zoombtn:hover { background: #138866; }
        .dawaya-bm-aura {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 15;
        }
        .dawaya-bm-aura-core {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 2.5px solid #FFFFFF;
          position: relative;
        }
        .dawaya-bm-aura-heat {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 82px;
          height: 82px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          filter: blur(8px);
          opacity: 0.65;
          animation: dawayaBmHeat 1.3s ease-in-out infinite;
        }
        .dawaya-bm-aura-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 32px;
          height: 32px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          border: 2px solid #FFFFFF;
          animation: dawayaBmRipple 1.45s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes dawayaBmHeat {
          0%, 100% { transform: translate(-50%, -50%) scale(0.88); opacity: 0.55; }
          50% { transform: translate(-50%, -50%) scale(1.18); opacity: 0.85; }
        }
        @keyframes dawayaBmRipple {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        .dawaya-bm-chip {
          border: 1px solid #CBD5E1;
          background: #F8FAFC;
          color: #1E293B;
          border-radius: 10px;
          padding: 7px 11px;
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.14s ease;
          text-align: right;
        }
        .dawaya-bm-chip:hover { background: #F1F5F9; }
        .dawaya-bm-chip.sel-navy { background: #0D1F38; color: #FFFFFF; border-color: #0D1F38; }
        .dawaya-bm-chip.sel-teal { background: #138866; color: #FFFFFF; border-color: #138866; }
        .dawaya-bm-chip.sel-danger { background: #BE123C; color: #FFFFFF; border-color: #FB7185; }
      `}</style>

      <div className="dawaya-bm-card">
        {/* Top Unslop Header */}
        <div className="dawaya-bm-topbar">
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#CFD29D', marginBottom: '2px' }}>
              {tr(lang, 'خريطة تحديد الألم التفاعلية — دوايا', 'DAWAYA Interactive Pain Locator')}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#FFFFFF' }}>
              {tr(lang, 'شاور على مكان الألم على الجسم الكامل للتقييم الطبي الفوري', 'Tap Directly on the Body for Instant Clinical Triage')}
            </h2>
          </div>

          <div className="dawaya-bm-seg" role="group" aria-label="اختيار الجنس">
            <button
              type="button"
              className={activeSex === 'male' ? 'active' : ''}
              onClick={() => handleSexSwitch('male')}
            >
              {tr(lang, 'ذكر', 'Male')}
            </button>
            <button
              type="button"
              className={activeSex === 'female' ? 'active' : ''}
              onClick={() => handleSexSwitch('female')}
            >
              {tr(lang, 'أنثى', 'Female')}
            </button>
          </div>
        </div>

        {/* Main 2-Col Grid */}
        <div className="dawaya-bm-grid">
          {/* Interactive Full-Body Stage */}
          <div
            ref={viewportRef}
            className={`dawaya-bm-viewport${isPanning ? ' panning' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Front / Back & Clear Controls */}
            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', zIndex: 20 }}>
              <button
                type="button"
                className={`dawaya-bm-ctrl${activeSide === 'front' ? ' active' : ''}`}
                onClick={() => setActiveSide('front')}
              >
                {tr(lang, 'الوجه الأمامي', 'Front')}
              </button>
              <button
                type="button"
                className={`dawaya-bm-ctrl${activeSide === 'back' ? ' active' : ''}`}
                onClick={() => setActiveSide('back')}
              >
                {tr(lang, 'الظهر والخلف', 'Back')}
              </button>
              {activePin && (
                <button
                  type="button"
                  className="dawaya-bm-ctrl"
                  style={{ background: '#BE123C', borderColor: '#FB7185', color: '#FFFFFF' }}
                  onClick={() => {
                    setActivePin(null);
                    setShowReport(false);
                  }}
                >
                  {tr(lang, 'مسح التحديد', 'Clear')}
                </button>
              )}
            </div>

            {/* Patient Zoom Controls */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 20 }}>
              <button type="button" className="dawaya-bm-zoombtn" title="تكبير" onClick={() => updateZoom(zoom + 0.35)}>+</button>
              <div style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#CFD29D', background: 'rgba(13,31,56,0.85)', borderRadius: '7px', padding: '3px 0' }}>
                {Math.round(zoom * 100)}%
              </div>
              <button type="button" className="dawaya-bm-zoombtn" title="تصغير" onClick={() => updateZoom(zoom - 0.35)}>-</button>
              <button
                type="button"
                className="dawaya-bm-zoombtn"
                style={{ fontSize: '0.66rem', color: '#CFD29D' }}
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                ضبط
              </button>
            </div>

            {/* Zoomable & Pannable Full-Body Canvas */}
            <div
              className="dawaya-bm-pan"
              style={{
                transform: `translate3d(${pan.x.toFixed(1)}px, ${pan.y.toFixed(1)}px, 0) scale(${zoom.toFixed(2)})`,
              }}
            >
              <div ref={bodyBoxRef} className="dawaya-bm-box">
                {activeSide === 'front' ? (
                  <>
                    <img src={frontOrgansSrc} alt="الأعضاء الداخلية للجسم" className="dawaya-bm-img" />
                    <img
                      src={frontSkinSrc}
                      alt="الطبقة الخارجية للجسم"
                      className="dawaya-bm-img"
                     
                      style={{ opacity: skinOpacity }}
                    />
                  </>
                ) : (
                  <img src={backOrgansSrc} alt="الظهر والعمود الفقري والكليتين" className="dawaya-bm-img" />
                )}

                {activePin && activePin.side === activeSide && (
                  <div
                    className="dawaya-bm-aura"
                    style={{ left: `${activePin.x.toFixed(2)}%`, top: `${activePin.y.toFixed(2)}%` }}
                  >
                    <div
                      className="dawaya-bm-aura-heat"
                      style={{
                        background: `radial-gradient(circle, ${auraColor} 0%, transparent 72%)`,
                        animationDuration: auraDuration,
                      }}
                    />
                    <div
                      className="dawaya-bm-aura-ring"
                      style={{ borderColor: auraColor, animationDuration: auraDuration }}
                    />
                    <div
                      className="dawaya-bm-aura-core"
                      style={{ backgroundColor: auraColor, boxShadow: `0 0 16px ${auraColor}` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Transparency Slider + Live Status */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                zIndex: 20,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                background: 'rgba(13, 31, 56, 0.92)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '14px',
                padding: '9px 14px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  opacity: activeSide === 'front' ? 1 : 0.4,
                }}
              >
                <span style={{ color: '#CFD29D', whiteSpace: 'nowrap' }}>كشف الأعضاء الداخلية</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={organReveal}
                  disabled={activeSide !== 'front'}
                  onChange={(e) => setOrganReveal(Number(e.target.value))}
                  style={{ width: '115px', accentColor: '#24C8B8' }}
                />
                <span style={{ color: '#6EE7B7', fontWeight: 800, minWidth: '32px' }}>{organReveal}%</span>
              </label>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#E2E8F0' }}>
                {stageNotice ||
                  (activePin
                    ? `تم رصد: ${displayTitle} (${activePin.sideLabel})`
                    : 'اضغط مباشرة على مكان الوجع • كبّر واسحب للتنقل')}
              </div>
            </div>
          </div>

          {/* Right/Left Clinical Interview Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {!activePin || !activeZone ? (
              <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto 14px',
                    borderRadius: '16px',
                    background: '#0D1F38',
                    color: '#CFD29D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="2" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800, color: '#0D1F38' }}>
                  حدّد مكان الألم بنفسك على المجسم
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.7 }}>
                  اختر <strong>ذكر</strong> أو <strong>أنثى</strong> من الأعلى، كبّر الجسم براحتك واضغط مباشرة على مكان الوجع. سيقوم <strong>دوايا</strong> باكتشاف المنطقة وسؤالك فورًا إذا كانت المشكلة في العضو الداخلي أم في الثدي أو الجلد من الخارج.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#0D1F38' }}>
                  <div style={{ padding: '10px 6px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>1. شاور على المكان</div>
                  <div style={{ padding: '10px 6px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>2. داخلي أم جلدي/ثدي؟</div>
                  <div style={{ padding: '10px 6px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>3. توجيه طبي فوري</div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#0D1F38', color: '#FFFFFF', padding: '14px 16px', borderBottom: '3px solid #138866' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px', borderRadius: '999px', background: 'rgba(19,136,102,0.3)', border: '1px solid rgba(36,200,184,0.45)', color: '#99F6E4' }}>
                      تقييم سريري مخصص — {activeSex === 'female' ? 'أنثى' : 'ذكر'}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#CFD29D' }}>
                      {activePin.side === 'front' ? 'الأمام' : 'الخلف'} — {activePin.sideLabel}
                    </span>
                  </div>
                  <h3 style={{ margin: '8px 0 3px', fontSize: '1.02rem', fontWeight: 800, color: '#FFFFFF' }}>{displayTitle}</h3>
                  <div style={{ fontSize: '0.74rem', color: '#CBD5E1' }}>الأنسجة/الأعضاء المستهدفة: {activeZone.organs}</div>
                </div>

                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Contextual Organ vs Breast vs Skin Selector */}
                  <div style={{ padding: '11px 12px', borderRadius: '13px', background: '#F0FDF9', border: '1px solid rgba(19,136,102,0.32)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0D1F38', marginBottom: '8px' }}>
                      المشكلة في المكان ده تخص إيه بالظبط؟
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {activePin.choices.map((cid) => {
                        const targetObj = ZONES[cid];
                        const isSel = cid === activePin.zoneId;
                        return (
                          <button
                            key={cid}
                            type="button"
                            className={`dawaya-bm-chip${isSel ? ' sel-teal' : ''}`}
                            onClick={() => {
                              if (cid === 'skin_surface' || cid === 'breast_female' || cid === 'breast_male') {
                                setOrganReveal(10);
                              } else if (organReveal < 35) {
                                setOrganReveal(65);
                              }
                              resetForPin({ ...activePin, zoneId: cid }, activeSex);
                            }}
                          >
                            {targetObj.shortChoice}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 1: Quality */}
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0D1F38', marginBottom: '7px' }}>
                      1. اوصف لنا طبيعة الألم أو الشكوى:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {effectiveQualities.map((q) => (
                        <button
                          key={q}
                          type="button"
                          className={`dawaya-bm-chip${selectedQuality === q ? ' sel-navy' : ''}`}
                          onClick={() => {
                            setSelectedQuality(q);
                            setShowReport(false);
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Duration & Severity */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0D1F38', marginBottom: '7px' }}>
                      2. بدأت إمتى، وشدتها كام من 10؟
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '9px' }}>
                      {[
                        { id: 'acute' as const, label: 'مفاجئ (ساعات)' },
                        { id: 'subacute' as const, label: 'منذ أيام' },
                        { id: 'chronic' as const, label: 'مستمر / متكرر' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={`dawaya-bm-chip${selectedDuration === d.id ? ' sel-navy' : ''}`}
                          style={{ textAlign: 'center' }}
                          onClick={() => {
                            setSelectedDuration(d.id);
                            setShowReport(false);
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '11px', padding: '8px 12px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>شدة الألم:</span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={painScore}
                        onChange={(e) => {
                          setPainScore(Number(e.target.value));
                          setShowReport(false);
                        }}
                        style={{ flex: 1, accentColor: '#138866' }}
                      />
                      <span style={{ padding: '2px 9px', borderRadius: '8px', background: auraColor, color: '#FFFFFF', fontSize: '0.76rem', fontWeight: 800 }}>
                        {painScore} / 10
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Associated Symptoms */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0D1F38', marginBottom: '7px' }}>
                      3. هل فيه أي أعراض مصاحبة؟ (اختر كل ما ينطبق)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {effectiveSymptoms.map((s) => {
                        const isSel = selectedSymptoms.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className={`dawaya-bm-chip${isSel ? (s.danger ? ' sel-danger' : ' sel-navy') : ''}`}
                            onClick={() => {
                              setSelectedSymptoms((prev) =>
                                prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                              );
                              setShowReport(false);
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Adaptive Triage Box */}
                  <div
                    style={{
                      padding: '13px',
                      borderRadius: '14px',
                      border: isEmergency ? '2px solid #E11D48' : isUrgent ? '1px solid #F59E0B' : '1px solid rgba(19,136,102,0.35)',
                      background: isEmergency ? '#FFF1F2' : isUrgent ? '#FFFBEB' : '#F0FDF9',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          background: isEmergency ? '#E11D48' : isUrgent ? '#D97706' : '#138866',
                        }}
                      >
                        {isEmergency
                          ? 'طوارئ فورية — اتصل بـ 123 أو توجّه للاستقبال'
                          : isUrgent
                          ? 'يُنصح بفحص طبي عاجل خلال 24 ساعة'
                          : 'حجز متابعة في العيادة المختصة'}
                      </span>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0D1F38' }}>{activeZone.clinic}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#1E293B', lineHeight: 1.65, marginBottom: '6px' }}>
                      <strong>التوجيه السريري:</strong> {activeZone.advice}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#475569', lineHeight: 1.55 }}>
                      <strong>الاحتمالات المبدئية:</strong> {activeZone.causes.join(' • ')}
                    </div>
                  </div>

                  {/* DAWAYA Action Links + Doctor Brief */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Link
                      to={`/assistant?q=${encodeURIComponent(assistantQuery)}`}
                      style={{
                        textAlign: 'center',
                        textDecoration: 'none',
                        padding: '10px 10px',
                        borderRadius: '11px',
                        background: '#138866',
                        color: '#FFFFFF',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                      }}
                    >
                      استشر المساعد الذكي بحالتي
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowReport((v) => !v)}
                      style={{
                        border: 'none',
                        padding: '10px 10px',
                        borderRadius: '11px',
                        background: '#0D1F38',
                        color: '#FFFFFF',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {showReport ? 'إخفاء تقرير الطبيب' : 'تجهيز تقرير للطبيب'}
                    </button>
                  </div>

                  {showReport && (
                    <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#0D1F38', color: '#F1F5F9', fontSize: '0.76rem', lineHeight: 1.7, border: '1px solid rgba(36,200,184,0.45)' }}>
                      <div style={{ fontWeight: 800, color: '#CFD29D', marginBottom: '4px' }}>تقرير دوايا المبدئي الجاهز للعرض على الطبيب:</div>
                      <div>• <strong>الجنس:</strong> {activeSex === 'female' ? 'أنثى' : 'ذكر'}</div>
                      <div>• <strong>المنطقة المرصودة:</strong> {displayTitle} ({activePin.sideLabel})</div>
                      <div>• <strong>طبيعة الشكوى:</strong> {selectedQuality}</div>
                      <div>• <strong>المدة والشدة:</strong> {durText} — شدة {painScore} من 10</div>
                      <div>• <strong>أعراض مصاحبة:</strong> {selectedSymptomLabels.length ? selectedSymptomLabels.join('، ') : 'لا توجد أعراض إضافية محددة'}</div>
                      <div>• <strong>العيادة المقترحة:</strong> {activeZone.clinic}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!embedded && (
        <div style={{ marginTop: '16px' }}>
          <Disclaimer />
        </div>
      )}
    </section>
  );
}
