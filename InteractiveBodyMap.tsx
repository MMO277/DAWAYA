import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import Disclaimer from './Disclaimer';

export type BodySide = 'front' | 'back';
export type PatientPersona = 'male' | 'female' | 'child';

export type AnatomicalRegionId =
  | 'head_brain'
  | 'eyes'
  | 'ent_teeth'
  | 'neck_thyroid'
  | 'chest_heart_lungs'
  | 'upper_abdomen'
  | 'lower_abdomen_pelvis'
  | 'flanks_kidneys'
  | 'lower_back_sciatica'
  | 'shoulders_arms'
  | 'knees_legs'
  | 'feet_heels'
  | 'skin_hair';

export interface SubSymptomPattern {
  id: string;
  labelAr: string;
  urgency: 'emergency_er' | 'urgent_24h' | 'routine_care';
  likelyDiagnosisAr: string;
  immediateFirstAidAr: string;
  strictlyAvoidAr: string;
  suggestedTestsAr: string;
  specialtyDoctorAr: string;
  clinicRoute: string;
  clinicLabelAr: string;
  aiFollowUpQueryAr: string;
}

export interface AnatomicalRegionData {
  id: AnatomicalRegionId;
  side: 'front' | 'back' | 'both';
  icon: string;
  nameAr: string;
  nameEn: string;
  subtitleAr: string;
  redFlagQuestionAr: string;
  redFlagWarningAr: string;
  patterns: SubSymptomPattern[];
}

export const ANATOMICAL_REGIONS: AnatomicalRegionData[] = [
  {
    id: 'head_brain',
    side: 'both',
    icon: '🧠',
    nameAr: 'الرأس والمخ والجبهة',
    nameEn: 'Head, Brain & Forehead',
    subtitleAr: 'الصداع النصفي، التوتري، الدوخة، وطوارئ جلطة المخ',
    redFlagQuestionAr: 'هل يصاحب الصداع ثقل في اللسان، ميل في الفم، تنميل في ذراع واحدة، أو قيء نافوري مفاجئ؟',
    redFlagWarningAr: '🚨 طوارئ مخ وأعصاب فورية (اشتباه جلطة دماغية FAST أو نزيف): توجه لأقرب مستشفى لعمل أشعة مقطعية على المخ خلال الساعة الذهبية ولا تعطِ أسبرين في المنزل قبل الأشعة!',
    patterns: [
      {
        id: 'head-migraine',
        labelAr: 'صداع نابض في نصف الرأس أو خلف عين واحدة يزداد مع النور والصوت ومعاه غثيان',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'نوبة صداع نصفي / شقيقة (Migraine Attack)',
        immediateFirstAidAr: 'اجلس في غرفة مظلمة وهادئة تماماً، ضع كمادة باردة على الجبهة، وخذ مسكن الشقيقة في أول 15 دقيقة من بداية النوبة.',
        strictlyAvoidAr: 'تجنب الجبن القديم، الشوكولاتة، السهر، والإفراط في المسكنات أكثر من يومين أسبوعياً.',
        suggestedTestsAr: 'قياس ضغط الدم، صورة دم كاملة (CBC)، ومخزون الحديد (Ferritin) وفيتامين د.',
        specialtyDoctorAr: 'استشاري المخ والأعصاب',
        clinicRoute: '/neuro-clinic',
        clinicLabelAr: '🧠 افتح عيادة المخ والأعصاب والصداع النصفي',
        aiFollowUpQueryAr: 'عندي صداع نصفي نابض مع زغللة وغثيان، إيه أفضل تصرف؟',
      },
      {
        id: 'head-tension-bp',
        labelAr: 'صداع كالحزام الضاغط حول الرأس كلها أو في المؤخرة والرقبة بعد توتر أو قلة نوم',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'صداع توتري عضلي أو صداع مرتبط بارتفاع ضغط الدم أو الإجهاد',
        immediateFirstAidAr: 'قس ضغط الدم أولاً قبل أخذ أي مسكن، وطبق كمادات دافئة على عضلات الرقبة والأكتاف مع شرب كوبين ماء.',
        strictlyAvoidAr: 'لا تأخذ مسكنات فوارة مالحة (مثل كتافاست أو سولبادين فوار) إذا كان ضغطك مرتفعاً لأن الصوديوم يرفع الضغط!',
        suggestedTestsAr: 'قياس ضغط الدم الرقمي على مدار 3 أيام، وفحص النظر.',
        specialtyDoctorAr: 'طبيب الباطنة أو المخ والأعصاب',
        clinicRoute: '/neuro-clinic',
        clinicLabelAr: '🧠 افتح عيادة المخ والأعصاب',
        aiFollowUpQueryAr: 'عندي صداع في مؤخرة الرأس والرقبة، هل ده من الضغط ولا التوتر؟',
      },
      {
        id: 'head-sinus',
        labelAr: 'ثقل وألم في الجبهة وبين العينين والخدين يزداد بشدة عند السجود أو الميل للأمام',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'التهاب واحتقان الجيوب الأنفية الحاد (Acute Sinusitis)',
        immediateFirstAidAr: 'اغسل الأنف بمحلول ملح دافئ أو بخاخ ماء بحر 4 مرات يومياً مع استنشاق بخار ماء دافئ.',
        strictlyAvoidAr: 'ممنوع استخدام نقط الأوتريفين لأكثر من 3 إلى 5 أيام كحد أقصى حتى لا يحدث احتقان ارتدادي مزمن.',
        suggestedTestsAr: 'فحص منظار أنف بعيادة الأنف والأذن إذا استمر أكثر من 10 أيام.',
        specialtyDoctorAr: 'استشاري الأنف والأذن والحنجرة',
        clinicRoute: '/ent-clinic',
        clinicLabelAr: '👂 افتح عيادة الأنف والأذن والجيوب الأنفية',
        aiFollowUpQueryAr: 'عندي صداع جيوب أنفية بيزيد مع السجود، أعالجه إزاي؟',
      },
    ],
  },
  {
    id: 'eyes',
    side: 'front',
    icon: '👁️',
    nameAr: 'العينان والجفون',
    nameEn: 'Eyes & Vision',
    subtitleAr: 'احمرار العين، الزغللة، دخول كيماويات أو رايش، وجفاف الشاشات',
    redFlagQuestionAr: 'هل دخل في العين كلور/منظف كيميائي أو رايش معدن، أو يوجد فقدان مفاجئ للرؤية أو ألم شديد مع النور؟',
    redFlagWarningAr: '🚨 طوارئ عيون فورية: لو مادة كيميائية اغسل العين بماء جارٍ لمدة 15 دقيقة متواصلة، ولو رايش لا تدعك العين نهائياً وتوجه لطوارئ الرمد!',
    patterns: [
      {
        id: 'eye-red-discharge',
        labelAr: 'احمرار في بياض العين مع إفرازات صفراء/عماص يغلق الجفون صباحاً',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'التهاب ملتحمة بكتيري / رمد صديدي (Bacterial Conjunctivitis)',
        immediateFirstAidAr: 'امسح الجفن من الداخل للخارج بقطنة مبللة بماء دافئ معقم، وافصل الفوطة والمخدة عن باقي الأسرة.',
        strictlyAvoidAr: 'ممنوع تماماً شراء قطرة تحتوي على كورتيزون (مثل توبرادكس أو ديكسافرين) من الصيدلية بدون فحص قرنية بالصبغة!',
        suggestedTestsAr: 'فحص المصباح الشقي (Slit Lamp) لدى طبيب العيون.',
        specialtyDoctorAr: 'استشاري طب وجراحة العيون',
        clinicRoute: '/eye-clinic',
        clinicLabelAr: '👁️ افتح عيادة العيون وطوارئ القرنية',
        aiFollowUpQueryAr: 'عيني حمرا وبتطلع عماص أصفر، إيه القطرة الآمنة؟',
      },
      {
        id: 'eye-dry-screen',
        labelAr: 'حرقان وشكشكة كأن في رمل في العين مع زغللة مؤقتة تتحسن بالرمش (مع الموبايل والكمبيوتر)',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'متلازمة جفاف العين الرقمي وإجهاد الشاشات (Dry Eye Syndrome)',
        immediateFirstAidAr: 'طبق قاعدة 20-20-20 واستخدم قطرات الدموع الصناعية المرطبة الخالية من المواد الحافظة (Single-use vials).',
        strictlyAvoidAr: 'تجنب توجيه هواء التكييف أو المروحة مباشرة للوجه، ولا تستخدم قطرات تبييض العين القابضة للأوعية.',
        suggestedTestsAr: 'اختبار جفاف العين (Schirmer / TBUT) وفحص مقاس النظارة.',
        specialtyDoctorAr: 'طبيب العيون والبصريات',
        clinicRoute: '/eye-clinic',
        clinicLabelAr: '👁️ افتح عيادة العيون وجفاف الشاشات',
        aiFollowUpQueryAr: 'عيني فيها حرقان وجفاف من الشاشات، إيه أفضل قطرة مرطبة؟',
      },
    ],
  },
  {
    id: 'ent_teeth',
    side: 'front',
    icon: '🦷',
    nameAr: 'الأذن والأنف والحلق والأسنان',
    nameEn: 'ENT, Throat & Teeth',
    subtitleAr: 'نزيف الأنف، الدوار، اللوز، وخراج وعصب الأسنان',
    redFlagQuestionAr: 'هل يوجد ورم في الخد يمتد للعين أو الرقبة مع صعوبة بلع اللعاب أو ضيق تنفس؟',
    redFlagWarningAr: '🚨 طوارئ فورية: التورم الممتد للرقبة أو العين مع صعوبة البلع أو التنفس يستلزم دخول المستشفى فوراً!',
    patterns: [
      {
        id: 'dental-pulpitis',
        labelAr: 'ألم ضرس نابض يوقظك من النوم ويزداد مع المشروبات الساخنة والباردة والاستلقاء',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'التهاب عصب الضرس الحاد (Irreversible Pulpitis)',
        immediateFirstAidAr: 'ارفع رأسك على مخدتين، تمضمض بماء دافئ وملح، واستخدم مسكناً مناسباً لحالتك الصحية لحين فتح العصب عند طبيب الأسنان.',
        strictlyAvoidAr: 'لا تضع قرص أسبرين أو ثوم أو قرنفل خام على اللثة مباشرة (يسبب حرقاً كيميائياً)، ولا تأخذ مضاداً حيوياً لأن المضاد لا يعالج عصب الضرس بدون تورم!',
        suggestedTestsAr: 'أشعة ذروية صغيرة (Periapical X-Ray) أو بانوراما أسنان.',
        specialtyDoctorAr: 'طبيب جراحة الفم والأسنان وعلاج الجذور',
        clinicRoute: '/dental-clinic',
        clinicLabelAr: '🦷 افتح عيادة طوارئ الأسنان واللثة',
        aiFollowUpQueryAr: 'ضرسي بيوجعني جداً بالليل ومش عارف أنام، أعمل إيه فوراً؟',
      },
      {
        id: 'ent-vertigo',
        labelAr: 'دوار شديد (الأوضة بتلف بيك) لمدة ثوانٍ أو دقيقة عند التقلب في السرير أو رفع الرأس',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'دوار الوضعة الانتيابي الحميد بسبب كريستالات الأذن الداخلية (BPPV)',
        immediateFirstAidAr: 'اجلس فوراً وثبّت نظرك على نقطة ثابتة أمامك، وتجنب الحركات الفجائية للرقبة.',
        strictlyAvoidAr: 'لا تعتمد على أقراص البيتاسيرك لشهور بدون عمل مناورة إيبلي (Epley Maneuver) لإرجاع الكريستالات.',
        suggestedTestsAr: 'اختبار اتزان (Dix-Hallpike) بعيادة السمعيات والاتزان.',
        specialtyDoctorAr: 'استشاري الأنف والأذن والاتزان',
        clinicRoute: '/ent-clinic',
        clinicLabelAr: '👂 افتح عيادة الأنف والأذن والدوار',
        aiFollowUpQueryAr: 'عندي دوخة والدنيا بتلف بيا لما بتقلب في السرير، إيه السبب؟',
      },
      {
        id: 'ent-tonsils',
        labelAr: 'ألم شديد في الحلق عند البلع مع سخونة عالية وبقع صديد بيضاء على اللوزتين بدون كحة',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'التهاب اللوزتين البكتيري الصديدي (Bacterial Tonsillitis)',
        immediateFirstAidAr: 'غرغرة بماء دافئ وملح، سوائل دافئة، وخافض حرارة (باراسيتامول)، ومراجعة الطبيب لوصف المضاد المناسب وإكمال 10 أيام.',
        strictlyAvoidAr: 'ممنوع إيقاف المضاد الحيوي بعد يومين لمجرد نزول الحرارة حتى لا تحدث مضاعفات الحمى الروماتيزمية.',
        suggestedTestsAr: 'فحص الحلق السريري، مسحة حلق أو CBC عند اللزوم.',
        specialtyDoctorAr: 'طبيب الأنف والأذن أو الأطفال',
        clinicRoute: '/ent-clinic',
        clinicLabelAr: '👂 افتح عيادة الأنف والأذن والحنجرة',
        aiFollowUpQueryAr: 'زوري واجعني وفيه صديد على اللوز مع سخونة، محتاج مضاد حيوي؟',
      },
    ],
  },
  {
    id: 'neck_thyroid',
    side: 'both',
    icon: '🦋',
    nameAr: 'الرقبة والغدة الدرقية',
    nameEn: 'Neck & Thyroid',
    subtitleAr: 'خمول أو نشاط الغدة الدرقية، وغضروف الفقرات العنقية',
    redFlagQuestionAr: 'هل يصاحب ألم الرقبة سخونة شديدة مع عدم القدرة على ثني الذقن نحو الصدر، أو ضعف في حركة اليدين؟',
    redFlagWarningAr: '🚨 طوارئ فورية: تيبس الرقبة مع الحمى العالية أو ضعف الذراعين يستلزم تقييم مستشفى عاجل!',
    patterns: [
      {
        id: 'thyroid-hypo',
        labelAr: 'خمول وتعب مستمر، زيادة وزن رغم قلة الأكل، شعور بالبرد، تساقط شعر، أو انتفاخ أسفل الرقبة',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'اشتباه كسل/خمول الغدة الدرقية (Hypothyroidism)',
        immediateFirstAidAr: 'اعمل تحليل الغدة الدرقية (TSH, Free T4)، ولو تتناول الإلتروكسين خذه على الريق قبل الفطار بـ 60 دقيقة بالماء فقط.',
        strictlyAvoidAr: 'ممنوع تناول الحديد أو الكالسيوم أو اللبن أو القهوة مع قرص الغدة الدرقية في نفس الوقت (افصل 4 ساعات عن الحديد والكالسيوم).',
        suggestedTestsAr: 'تحليل TSH و Free T4 و Anti-TPO وسونار على الغدة الدرقية.',
        specialtyDoctorAr: 'استشاري الباطنة والغدد الصماء',
        clinicRoute: '/chronic-clinic',
        clinicLabelAr: '🫀 افتح عيادة الباطنة والغدة الدرقية',
        aiFollowUpQueryAr: 'عندي خمول وزيادة وزن وسقوط شعر، إزاي أقرأ تحليل الغدة الدرقية؟',
      },
      {
        id: 'cervical-disc',
        labelAr: 'ألم في الرقبة يمتد للكتف والذراع مع تنميل أو كهرباء في أصابع اليد',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'انزلاق غضروفي عنقي أو خشونة فقرات الرقبة (Cervical Radiculopathy)',
        immediateFirstAidAr: 'ارفع شاشة الموبايل لمستوى العين، ضع كمادة دافئة على الرقبة، وتجنب حمل أشياء ثقيلة أو طقطقة الرقبة.',
        strictlyAvoidAr: 'ممنوع طقطقة الرقبة باليد لأنها قد تضغط على الحبل الشوكي أو الشرايين العنقية!',
        suggestedTestsAr: 'رنين مغناطيسي على الفقرات العنقية (Cervical MRI) عند استمرار التنميل.',
        specialtyDoctorAr: 'استشاري جراحة العظام والعمود الفقري أو المخ والأعصاب',
        clinicRoute: '/ortho-clinic',
        clinicLabelAr: '🦴 افتح عيادة العظام والعمود الفقري',
        aiFollowUpQueryAr: 'رقبتي بتوجعني وفيه تنميل نازل في ذراعي وصوابعي، أعمل إيه؟',
      },
    ],
  },
  {
    id: 'chest_heart_lungs',
    side: 'front',
    icon: '🫁',
    nameAr: 'الصدر والقلب والرئتين',
    nameEn: 'Chest, Heart & Lungs',
    subtitleAr: 'ألم الصدر والذبحة، الكحة، حساسية الصدر والربو، والخفقان',
    redFlagQuestionAr: 'هل تشعر بضغط ثقيل كالصخرة في منتصف الصدر يمتد للكتف الأيسر أو الفك مع عرق بارد أو نهجان شديد؟',
    redFlagWarningAr: '🚨 طوارئ قلب فورية (اشتباه ذبحة صدرية أو جلطة بالقلب): توقف عن أي مجهود، اجلس نصف جالس، وتوجه فوراً لأقرب طوارئ قلب لعمل رسم قلب وإنزيمات تروبونين!',
    patterns: [
      {
        id: 'chest-angina',
        labelAr: 'ثقل أو عصرة أو حرقان في منتصف الصدر يزداد مع المشي أو السلم ويهدأ بالراحة',
        urgency: 'emergency_er',
        likelyDiagnosisAr: 'اشتباه قصور بالشريان التاجي / ذبحة صدرية (Angina Pectoris)',
        immediateFirstAidAr: 'توقف عن المجهود فوراً، اجلس في وضع مريح، وتوجه لطوارئ القلب لعمل رسم قلب (ECG) وإيكو.',
        strictlyAvoidAr: 'لا تشخّص ألم منتصف الصدر على أنه «شوية غازات أو قولون أو برد في الضلوع» خاصة لو مريض ضغط أو سكر أو مدخن!',
        suggestedTestsAr: 'رسم قلب كهربائي (ECG)، إنزيمات القلب (Troponin I/T)، وإيكو على القلب.',
        specialtyDoctorAr: 'استشاري القلب والأوعية الدموية',
        clinicRoute: '/chronic-clinic',
        clinicLabelAr: '🫀 افتح عيادة القلب والضغط والباطنة',
        aiFollowUpQueryAr: 'حاسس بثقل في نص صدري مع المجهود، إزاي أفرق بين القلب والمعدة؟',
      },
      {
        id: 'chest-asthma-cough',
        labelAr: 'كحة مستمرة تشتد بالليل والفجر مع تزييق في الصدر أو بلغم كثيف',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'حساسية صدر / ربو شعبي أو التهاب شعب هوائية (Asthma / Bronchitis)',
        immediateFirstAidAr: 'اشرب سوائل دافئة بكثرة لإذابة البلغم، واستخدم البخاخ الموسع للشعب أو جلسة بخار بمحلول الملح حسب إرشاد الطبيب.',
        strictlyAvoidAr: 'ممنوع إعطاء أدوية مثبطة للكحة الجافة لمريض صدره ممتلئ بالبلغم أو مريض حساسية الصدر حتى لا يحتبس البلغم في الرئة!',
        suggestedTestsAr: 'فحص سماعة الصدر، قياس الأكسجين (SpO2)، أو وظائف التنفس.',
        specialtyDoctorAr: 'استشاري الأمراض الصدرية والحساسية',
        clinicRoute: '/chest-clinic',
        clinicLabelAr: '🫁 افتح عيادة الصدر والربو وجلسات البخار',
        aiFollowUpQueryAr: 'عندي كحة ببلغم وتزييق في الصدر بيزيد بالليل، آخد دواء كحة إيه؟',
      },
    ],
  },
  {
    id: 'upper_abdomen',
    side: 'front',
    icon: '🔥',
    nameAr: 'فم المعدة وأعلى البطن والمرارة',
    nameEn: 'Upper Abdomen, Stomach & Gallbladder',
    subtitleAr: 'الحموضة وارتجاع المريء، جرثومة المعدة، ومغص المرارة',
    redFlagQuestionAr: 'هل يصاحب ألم المعدة قيء دموي (أحمر أو كالقهوة)، أو براز أسود كالفحم، أو اصفرار في بياض العين؟',
    redFlagWarningAr: '🚨 طوارئ جهاز هضمي فورية: القيء المدمم أو البراز الأسود القطراني يدل على نزيف معدي معوي ويستلزم التوجه للمستشفى فوراً!',
    patterns: [
      {
        id: 'stomach-gerd-ulcer',
        labelAr: 'حرقان ونار في فم المعدة تطلع للصدر والزور بعد الأكل أو عند النوم مع طعم مر',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'ارتجاع المريء أو التهاب جدار المعدة وجرثومة المعدة (GERD / Gastritis)',
        immediateFirstAidAr: 'افصل بين العشاء والنوم بـ 3 ساعات كاملة، نم على الجانب الأيسر مع رفع الرأس، وخذ دواء المعدة قبل الفطار بـ 30 دقيقة.',
        strictlyAvoidAr: 'تجنب المسكنات (فولتارين، كتافلام، بروفين، أسبرين)، المسبكات، القهوة على الريق، والنعناع لو عندك ارتجاع.',
        suggestedTestsAr: 'تحليل جرثومة المعدة في البراز (H. pylori Stool Ag) بشرط إيقاف أدوية المعدة أسبوعين قبل التحليل.',
        specialtyDoctorAr: 'استشاري الجهاز الهضمي والكبد والمناظير',
        clinicRoute: '/gastro-clinic',
        clinicLabelAr: '🦠 افتح عيادة الجهاز الهضمي والجرثومة',
        aiFollowUpQueryAr: 'عندي حموضة وحرقان في فم المعدة بيزيد لما أنام، أعمل إيه؟',
      },
      {
        id: 'gallbladder-biliary',
        labelAr: 'مغص شديد أعلى البطن جهة اليمين تحت الضلوع بعد أكلة دسمة أو مقليات ويسمّع في الكتف الأيمن',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'مغص مراري أو حصوات والتهاب بالمرارة (Biliary Colic / Cholecystitis)',
        immediateFirstAidAr: 'امتنع تماماً عن الدهون والمقليات والبيض والسمن، وتوجه لعمل سونار على البطن والمرارة.',
        strictlyAvoidAr: 'لا تهمل المغص لو صاحبه سخونة أو اصفرار في العين أو غمقان لون البول كالشاي.',
        suggestedTestsAr: 'موجات فوق صوتية (سونار) على البطن والمرارة، وإنزيمات الكبد والصفراء.',
        specialtyDoctorAr: 'استشاري الجهاز الهضمي أو الجراحة العامة',
        clinicRoute: '/gastro-clinic',
        clinicLabelAr: '🦠 افتح عيادة الجهاز الهضمي والكبد',
        aiFollowUpQueryAr: 'عندي وجع تحت الضلوع اليمين بعد الأكل الدسم بيسمع في كتفي اليمين، ده مرارة؟',
      },
    ],
  },
  {
    id: 'lower_abdomen_pelvis',
    side: 'front',
    icon: '🦠',
    nameAr: 'أسفل البطن والقولون والحوض',
    nameEn: 'Lower Abdomen, Colon & Pelvis',
    subtitleAr: 'القولون العصبي، الزائدة الدودية، التهاب المسالك، وآلام الحوض',
    redFlagQuestionAr: 'هل الألم يتركز في الجنب الأيمن السفلي ويزداد بشدة مع الكحة أو المشي مع سخونة وفقدان شهية؟',
    redFlagWarningAr: '🚨 طوارئ جراحة فورية (اشتباه التهاب الزائدة الدودية الحاد): لا تأخذ مسكنات قوية أو ملينات وتوجه لأقرب مستشفى لفحص الجراحة وعمل سونار!',
    patterns: [
      {
        id: 'appendix-warning',
        labelAr: 'ألم بدأ حول السرة ثم استقر أسفل البطن جهة اليمين ويزداد مع الحركة والكحة مع سخونة وغثيان',
        urgency: 'emergency_er',
        likelyDiagnosisAr: 'اشتباه التهاب الزائدة الدودية الحاد (Acute Appendicitis)',
        immediateFirstAidAr: 'امتنع عن الأكل والشرب والمسكنات وتوجه فوراً لطوارئ الجراحة العامة.',
        strictlyAvoidAr: 'ممنوع أخذ مسكنات تخفي الألم أو حقنة شرجية/ملين لأنها قد تؤدي لانفجار الزائدة الملتهبة!',
        suggestedTestsAr: 'فحص جراحي سريري، صورة دم كاملة (CBC)، وسونار على البطن والحوض.',
        specialtyDoctorAr: 'استشاري الجراحة العامة والطوارئ',
        clinicRoute: '/gastro-clinic',
        clinicLabelAr: '🦠 افتح عيادة الجهاز الهضمي والطوارئ',
        aiFollowUpQueryAr: 'عندي وجع في الجنب اليمين من تحت البطن بيزيد لما أكح، إزاي أعرف لو زائدة؟',
      },
      {
        id: 'ibs-colon',
        labelAr: 'انتفاخ وغازات وتقلصات في البطن تزداد مع الزعل أو البقوليات وتهدأ بعد دخول الحمام',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'متلازمة القولون العصبي الهضمي (Irritable Bowel Syndrome - IBS)',
        immediateFirstAidAr: 'اشرب يانسون أو شمر دافئ، امشِ 20 دقيقة، واستخدم مضادات التقلصات المخصصة للقولون قبل الأكل بـ 20 دقيقة.',
        strictlyAvoidAr: 'تجنب البقوليات غير المنقوعة، الكرنب، المشروبات الغازية، والأكل السريع في وقت التوتر.',
        suggestedTestsAr: 'تحليل براز كامل واستبعاد حساسية القمح أو التهاب القولون.',
        specialtyDoctorAr: 'استشاري الجهاز الهضمي والباطنة',
        clinicRoute: '/gastro-clinic',
        clinicLabelAr: '🦠 افتح عيادة الجهاز الهضمي والقولون',
        aiFollowUpQueryAr: 'عندي انتفاخ وغازات وقولون عصبي، إيه الأكل الممنوع والعلاج المريح؟',
      },
      {
        id: 'uti-pelvic',
        labelAr: 'ثقل أسفل البطن فوق المثانة مع حرقان شديد في البول وتكرار دخول الحمام كل قليل',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'التهاب حاد في المثانة ومجرى البول (Urinary Tract Infection - UTI)',
        immediateFirstAidAr: 'اشرب 2 إلى 3 لتر ماء يومياً، واعمل تحليل ومزرعة بول قبل البدء في أي مضاد حيوي.',
        strictlyAvoidAr: 'لا تأخذ كورس مضاد حيوي عشوائي لمدة يومين وتوقفه لأن البكتيريا تكتسب مناعة شرسة وتعود أقوى!',
        suggestedTestsAr: 'تحليل بول كامل (Complete Urine Analysis) ومزرعة وحساسية بول (Urine Culture).',
        specialtyDoctorAr: 'استشاري المسالك البولية أو النساء',
        clinicRoute: '/urology-clinic',
        clinicLabelAr: '🧪 افتح عيادة المسالك البولية والكلى',
        aiFollowUpQueryAr: 'عندي حرقان شديد في البول ووجع أسفل البطن، أعمل تحليل إيه الأول؟',
      },
    ],
  },
  {
    id: 'flanks_kidneys',
    side: 'back',
    icon: '🫘',
    nameAr: 'الجانبان والكليتان (المغص الكلوي)',
    nameEn: 'Flanks & Kidneys',
    subtitleAr: 'المغص الكلوي، حصوات الحالب، وأملاح وصديد الكلى',
    redFlagQuestionAr: 'هل يصاحب ألم الجنب انقطاع كامل للبول لأكثر من 12 ساعة، أو سخونة ورعشة شديدة؟',
    redFlagWarningAr: '🚨 طوارئ مسالك فورية: المغص الكلوي مع سخونة ورعشة أو انقطاع البول يعني انسداد الحالب ويستلزم التوجه للمستشفى فوراً!',
    patterns: [
      {
        id: 'kidney-stone-colic',
        labelAr: 'ألم حاد جداً في الجنب (اليمين أو الشمال) يمسك الظهر وينزل للحوض والفخذ مع تغير لون البول أو غثيان',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'مغص كلوي حاد بسبب تحرك حصوة أو أملاح بالحالب (Renal Colic / Ureteric Stone)',
        immediateFirstAidAr: 'ضع قربة ماء دافئ على الجنب المؤلم، وتجنب شرب كميات مياه ضخمة أثناء ذروة المغص الحاد حتى تهدأ النوبة.',
        strictlyAvoidAr: 'احذر من تكرار حقن الفولتارين والكتافلام بكثرة لأنها قد تؤذي الكلى، ولا تأخذ فوار أملاح عشوائياً قبل معرفة نوع الأملاح في التحليل!',
        suggestedTestsAr: 'تحليل بول كامل، وظائف كلى (Creatinine)، وسونار أو أشعة مقطعية على المسالك بدون صبغة.',
        specialtyDoctorAr: 'استشاري الكلى والمسالك البولية',
        clinicRoute: '/urology-clinic',
        clinicLabelAr: '🧪 افتح عيادة الكلى والمسالك والحصوات',
        aiFollowUpQueryAr: 'جنبي بيوجعني جداً وبيسمع في ضهري ومغص كلوي، أتصرف إزاي؟',
      },
    ],
  },
  {
    id: 'lower_back_sciatica',
    side: 'back',
    icon: '🦴',
    nameAr: 'أسفل الظهر والعمود الفقري وعرق النسا',
    nameEn: 'Lower Back, Spine & Sciatica',
    subtitleAr: 'الانزلاق الغضروفي القطني، عرق النسا، والشد العضلي',
    redFlagQuestionAr: 'هل يصاحب ألم الظهر عدم تحكم في البول، أو تنميل في منطقة المقعدة، أو سقوط في مشط القدم أثناء المشي؟',
    redFlagWarningAr: '🚨 طوارئ عمود فقري فورية (متلازمة ذيل الفرس): فقدان التحكم في البول أو سقوط القدم يستلزم تقييم جراحة مخ وأعصاب فوراً!',
    patterns: [
      {
        id: 'lumbar-sciatica',
        labelAr: 'ألم أسفل الظهر يمتد كالكهرباء أو السيخ الساخن خلف الفخذ والسمانة حتى القدم ويزداد مع الكحة والجلوس',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'انزلاق غضروفي قطني وعرق النسا (Lumbar Disc Prolapse & Sciatica)',
        immediateFirstAidAr: 'استلقِ على ظهرك على مرتبة طبية متماسكة مع وضع مخدة عالية تحت ركبتيك لتقليل الضغط على الغضروف بنسبة 50%.',
        strictlyAvoidAr: 'ممنوع الانحناء للأمام لالتقاط أي شيء من الأرض، وممنوع النوم في الفراش بلا حركة لأكثر من يومين.',
        suggestedTestsAr: 'أشعة رنين مغناطيسي على الفقرات القطنية والعجزية (Lumbar Spine MRI).',
        specialtyDoctorAr: 'استشاري العظام والعمود الفقري أو المخ والأعصاب',
        clinicRoute: '/ortho-clinic',
        clinicLabelAr: '🦴 افتح عيادة العظام والغضروف وعرق النسا',
        aiFollowUpQueryAr: 'ضهري واجعني والوجع نازل كهرباء في رجلي (عرق النسا)، أعمل إيه؟',
      },
    ],
  },
  {
    id: 'shoulders_arms',
    side: 'both',
    icon: '💪',
    nameAr: 'الكتف والذراع واليد والأصابع',
    nameEn: 'Shoulders, Arms & Hands',
    subtitleAr: 'التهاب أوتار الكتف، اختناق عصب اليد، وتنميل الأطراف',
    redFlagQuestionAr: 'هل الألم في الكتف الأيسر والذراع اليسرى ظهر فجأة مع ضيق تنفس أو ثقل بالصدر وعرق بارد؟',
    redFlagWarningAr: '🚨 طوارئ قلب فورية: ألم الكتف والذراع الأيسر المفاجئ مع عرق أو نهجان قد يكون عرضاً لجلطة القلب!',
    patterns: [
      {
        id: 'carpal-neuropathy',
        labelAr: 'تنميل وشكشكة وكهرباء في أصابع اليد تشتد بالليل وعند مسك الموبايل أو у مرضى السكر',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'اختناق عصب اليد الأوسط (Carpal Tunnel) أو التهاب الأعصاب الطرفية ونقص فيتامين B12',
        immediateFirstAidAr: 'استخدم دعامة رسغ اليد أثناء النوم، واضبط مستوى السكر التراكمي، وعوّض نقص فيتامين B12.',
        strictlyAvoidAr: 'تجنب ثني رسغ اليد لفترات طويلة أثناء الكتابة أو استخدام الموبايل.',
        suggestedTestsAr: 'تحليل فيتامين B12، السكر التراكمي (HbA1c)، ورسم عصب وعضلات (EMG/NCV).',
        specialtyDoctorAr: 'طبيب المخ والأعصاب أو جراحة العظام واليد',
        clinicRoute: '/ortho-clinic',
        clinicLabelAr: '🦴 افتح عيادة العظام والأعصاب الطرفية',
        aiFollowUpQueryAr: 'عندي تنميل وشكشكة في صوابع إيدي بتزيد بالليل، إيه السبب والعلاج؟',
      },
    ],
  },
  {
    id: 'knees_legs',
    side: 'both',
    icon: '🦵',
    nameAr: 'الفخذ والركبة والسمانة والساق',
    nameEn: 'Knees, Thighs & Calves',
    subtitleAr: 'خشونة الركبة، جلطة الساق (DVT)، والشد العضلي الليلي',
    redFlagQuestionAr: 'هل يوجد تورم وانتفاخ وسخونة واحمرار في سمانة رجل واحدة فقط (خاصة بعد عملية أو سفر أو رقود)؟',
    redFlagWarningAr: '🚨 طوارئ أوعية دموية فورية (اشتباه جلطة وريدية بالساق DVT): ممنوع تماماً تدليك الساق المتورمة حتى لا تتحرك الجلطة للرئة، وتوجه فوراً لعمل دوبلر أوردة!',
    patterns: [
      {
        id: 'leg-dvt-warning',
        labelAr: 'تورم مفاجئ وألم وسخونة في ساق واحدة فقط (السمانة) يزداد عند الوقوف أو ثني القدم',
        urgency: 'emergency_er',
        likelyDiagnosisAr: 'اشتباه جلطة بالأوردة العميقة للساق (Deep Vein Thrombosis - DVT)',
        immediateFirstAidAr: 'ارفع الساق قليلاً، لا تدلكها إطلاقاً، وتوجه فوراً لعمل أشعة دوبلر ملون على أوردة الساق.',
        strictlyAvoidAr: 'تحذير قاتل: إياك وتدليك السمانة المتورمة بالمراهم لأن التدليك قد يفصل الجلطة ويرسلها للشريان الرئوي!',
        suggestedTestsAr: 'أشعة دوبلر ملون على أوردة الطرف السفلي (Venous Duplex) وتحليل D-Dimer.',
        specialtyDoctorAr: 'استشاري جراحة الأوعية الدموية',
        clinicRoute: '/chronic-clinic',
        clinicLabelAr: '🫀 افتح عيادة القلب والأوعية والسيولة',
        aiFollowUpQueryAr: 'رجل واحدة وارمة وسخنة وبتوجع في السمانة، هل دي جلطة؟',
      },
      {
        id: 'knee-osteoarthritis',
        labelAr: 'ألم وطقطقة وتيبس في الركبة يزداد عند طلوع ونزول السلم أو القيام من الجلوس',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'خشونة مفصل الركبة وتآكل الغضروف (Knee Osteoarthritis)',
        immediateFirstAidAr: 'مارس تمرين تقوية عضلة الفخذ الأمامية وأنت جالس، استخدم دهاناً موضعياً، وأنقص الوزن لتخفيف الحمل على الركبة.',
        strictlyAvoidAr: 'تجنب الجلوس في وضع التربيع على الأرض أو القرفصاء، وتجنب المسكنات الفموية اليومية المستمرة.',
        suggestedTestsAr: 'أشعة عادية على الركبتين في الوضع واقفاً (Standing Knee X-Ray) وفيتامين د.',
        specialtyDoctorAr: 'استشاري جراحة العظام والمفاصل والعلاج الطبيعي',
        clinicRoute: '/ortho-clinic',
        clinicLabelAr: '🦴 افتح عيادة العظام وخشونة الركبة',
        aiFollowUpQueryAr: 'ركبتي بتوجعني وبتطقطق مع السلم، إيه علاج الخشونة بدون مسكنات؟',
      },
    ],
  },
  {
    id: 'feet_heels',
    side: 'both',
    icon: '🦶',
    nameAr: 'القدم والكعب وإصبع القدم الأكبر',
    nameEn: 'Feet, Heels & Big Toe',
    subtitleAr: 'النقرس الحاد، الشوكة العظمية بالكعب، والقدم السكري',
    redFlagQuestionAr: 'هل أنت مريض سكر وتلاحظ جرحاً أو قرحة لا تلتئم أو اسوداداً أو تغيراً في لون أصابع القدم؟',
    redFlagWarningAr: '🚨 طوارئ قدم سكري: أي جرح أو تغير لون في قدم مريض السكر يستلزم فحص جراحة أوعية وقدم سكري خلال 24 ساعة!',
    patterns: [
      {
        id: 'foot-gout',
        labelAr: 'تورم واحمرار وسخونة وألم شديد في مفصل إصبع القدم الأكبر أو الكعب يشتد الفجر',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'نوبة نقرس حادة وارتفاع حمض اليوريك (Acute Gouty Arthritis)',
        immediateFirstAidAr: 'ارفع القدم وضع كمادات باردة، اشرب 3 لتر ماء يومياً، وأوقف اللحوم الحمراء والكبدة والمياه الغازية.',
        strictlyAvoidAr: 'ممنوع البدء في دواء خفض اليوريك (زيلوريك / فيبيوريك) لأول مرة أثناء النوبة الحادة لأنه يهيّج الألم أكثر؛ نعالج الالتهاب الحاد أولاً!',
        suggestedTestsAr: 'تحليل حمض اليوريك في الدم (Serum Uric Acid) ووظائف الكلى.',
        specialtyDoctorAr: 'استشاري العظام أو الروماتيزم والباطنة',
        clinicRoute: '/ortho-clinic',
        clinicLabelAr: '🦴 افتح عيادة العظام والنقرس',
        aiFollowUpQueryAr: 'صباع رجلي الكبير وارم وأحمر وبيوجع جداً، إزاي أعالج نوبة النقرس؟',
      },
      {
        id: 'foot-plantar',
        labelAr: 'ألم كالمسمار في باطن الكعب عند أول خطوات تخطوها على الأرض فور الاستيقاظ صباحاً',
        urgency: 'routine_care',
        likelyDiagnosisAr: 'التهاب اللفافة الأخمصية / الشوكة العظمية بالكعب (Plantar Fasciitis)',
        immediateFirstAidAr: 'دلك باطن القدم على زجاجة ماء مثلجة لمدة 10 دقائق، وارتدِ فرشة كعب سيليكون طبية داخل الحذاء.',
        strictlyAvoidAr: 'ممنوع المشي حافي القدمين على السيراميك أو الرخام الصلب في المنزل نهائياً.',
        suggestedTestsAr: 'فحص سريري بعيادة العظام وحمض اليوريك وفيتامين د.',
        specialtyDoctorAr: 'طبيب جراحة العظام والعلاج الطبيعي',
        clinicRoute: '/ortho-clinic',
        clinicLabelAr: '🦴 افتح عيادة العظام والشوكة العظمية',
        aiFollowUpQueryAr: 'كعب رجلي بيوجعني جداً أول ما أصحى من النوم، إيه علاج الشوكة العظمية؟',
      },
    ],
  },
  {
    id: 'skin_hair',
    side: 'both',
    icon: '🩹',
    nameAr: 'الجلد والحروق والشعر',
    nameEn: 'Skin, Burns & Hair',
    subtitleAr: 'الحروق، الحساسية والطفح، الحزام الناري، وتساقط الشعر',
    redFlagQuestionAr: 'هل يصاحب الطفح الجلدي تورم في الشفاه واللسان أو ضيق تنفس بعد أخذ دواء أو أكلة؟',
    redFlagWarningAr: '🚨 طوارئ حساسية مفرطة (Anaphylaxis): تورم الشفاه أو ضيق النفس بعد دواء أو طعام يستلزم التوجه لأقرب طوارئ فوراً!',
    patterns: [
      {
        id: 'skin-shingles',
        labelAr: 'ألم حارق كالكهرباء في جهة واحدة من الجسم يليه ظهور حبوب مائية مؤلمة كالحزام',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'الحزام الناري / الهربس العصبي (Herpes Zoster / Shingles)',
        immediateFirstAidAr: 'راجع طبيب الجلدية فوراً لبدء مضاد الفيروسات خلال أول 72 ساعة من ظهور الطفح لمنع ألم الأعصاب المزمن.',
        strictlyAvoidAr: 'ممنوع وضع كورتيزون موضعي أو فتح الفقاعات المائية، وابتعد عن الحوامل والرضع.',
        suggestedTestsAr: 'تشخيص سريري بعيادة الجلدية وفحص السكر العشوائي.',
        specialtyDoctorAr: 'استشاري الأمراض الجلدية',
        clinicRoute: '/derma-clinic',
        clinicLabelAr: '🩹 افتح عيادة الجلدية والحروق',
        aiFollowUpQueryAr: 'عندي حبوب مائية مؤلمة في جنب واحد من جسمي (حزام ناري)، إيه العلاج؟',
      },
      {
        id: 'skin-burn',
        labelAr: 'حرق بمياه مغلية أو زيت ساخن أو فرن مع احمرار وفقاعات مائية على الجلد',
        urgency: 'urgent_24h',
        likelyDiagnosisAr: 'حرق حراري سطحي أو من الدرجة الثانية (Thermal Burn)',
        immediateFirstAidAr: 'ضع الجزء المحروق تحت ماء الحنفية الجاري الفاتر لمدة 20 دقيقة متواصلة فوراً وغطه بشاش فازلين معقم.',
        strictlyAvoidAr: 'ممنوع وضع معجون أسنان أو بن أو دقيق أو بيض أو ثلج مباشر، وممنوع فقء فقاعات الحرق!',
        suggestedTestsAr: 'تقييم عمق ومساحة الحرق بعيادة الجلدية أو الجراحة.',
        specialtyDoctorAr: 'طبيب الجلدية أو جراحة التجميل والحروق',
        clinicRoute: '/derma-clinic',
        clinicLabelAr: '🩹 افتح عيادة الجلدية وإسعاف الحروق',
        aiFollowUpQueryAr: 'اتلسعت بمية مغلية، إيه الإسعاف الصح وإيه الكريم المناسب؟',
      },
    ],
  },
];

export default function InteractiveBodyMap({ embedded = false }: { embedded?: boolean }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [side, setSide] = useState<BodySide>('front');
  const [persona, setPersona] = useState<PatientPersona>('male');
  const [selectedRegionId, setSelectedRegionId] = useState<AnatomicalRegionId>('upper_abdomen');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('stomach-gerd-ulcer');
  const [hasRedFlag, setHasRedFlag] = useState<boolean>(false);

  const selectedRegion =
    ANATOMICAL_REGIONS.find((r) => r.id === selectedRegionId) || ANATOMICAL_REGIONS[0];

  const selectedPattern =
    selectedRegion.patterns.find((p) => p.id === selectedPatternId) || selectedRegion.patterns[0];

  const handleSelectRegion = (regId: AnatomicalRegionId) => {
    setSelectedRegionId(regId);
    const reg = ANATOMICAL_REGIONS.find((r) => r.id === regId);
    if (reg && reg.patterns.length > 0) {
      setSelectedPatternId(reg.patterns[0].id);
    }
    setHasRedFlag(false);
  };

  // Hotspots on the 280x520 SVG human silhouette
  const frontHotspots: Array<{
    id: AnatomicalRegionId;
    cx: number;
    cy: number;
    r: number;
    label: string;
  }> = [
    { id: 'head_brain', cx: 140, cy: 42, r: 16, label: '🧠 الرأس والمخ' },
    { id: 'eyes', cx: 124, cy: 56, r: 10, label: '👁️ العينان' },
    { id: 'ent_teeth', cx: 140, cy: 76, r: 12, label: '🦷 الأنف والفم والأسنان' },
    { id: 'neck_thyroid', cx: 140, cy: 105, r: 12, label: '🦋 الرقبة والغدة' },
    { id: 'chest_heart_lungs', cx: 140, cy: 155, r: 22, label: '🫁 الصدر والقلب' },
    { id: 'shoulders_arms', cx: 76, cy: 175, r: 16, label: '💪 الكتف والذراع' },
    { id: 'upper_abdomen', cx: 140, cy: 210, r: 18, label: '🔥 فم المعدة والمرارة' },
    { id: 'lower_abdomen_pelvis', cx: 140, cy: 262, r: 20, label: '🦠 القولون وأسفل البطن' },
    { id: 'knees_legs', cx: 116, cy: 375, r: 18, label: '🦵 الركبة والساق' },
    { id: 'feet_heels', cx: 116, cy: 478, r: 15, label: '🦶 القدم والكعب' },
    { id: 'skin_hair', cx: 215, cy: 235, r: 15, label: '🩹 الجلد والشعر' },
  ];

  const backHotspots: Array<{
    id: AnatomicalRegionId;
    cx: number;
    cy: number;
    r: number;
    label: string;
  }> = [
    { id: 'head_brain', cx: 140, cy: 48, r: 16, label: '🧠 مؤخرة الرأس' },
    { id: 'neck_thyroid', cx: 140, cy: 100, r: 14, label: '🦴 فقرات الرقبة' },
    { id: 'chest_heart_lungs', cx: 140, cy: 155, r: 20, label: '🫁 أعلى الظهر والرئتين' },
    { id: 'flanks_kidneys', cx: 112, cy: 215, r: 17, label: '🫘 الجنب والكليتان' },
    { id: 'lower_back_sciatica', cx: 140, cy: 258, r: 20, label: '🦴 أسفل الظهر وعرق النسا' },
    { id: 'shoulders_arms', cx: 204, cy: 175, r: 16, label: '💪 الكتف والذراع' },
    { id: 'knees_legs', cx: 164, cy: 385, r: 18, label: '🦵 السمانة وباطن الركبة' },
    { id: 'feet_heels', cx: 164, cy: 478, r: 15, label: '🦶 الكعب ووتر أكيلس' },
  ];

  const activeHotspots = side === 'front' ? frontHotspots : backHotspots;

  return (
    <div className={embedded ? '' : 'wrap'} style={embedded ? {} : { maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      {!embedded && (
        <section
          className="card"
          style={{
            background: 'linear-gradient(135deg, #0D1F38 0%, #0f766e 50%, #138866 100%)',
            color: '#ffffff',
            borderRadius: '22px',
            padding: '26px 24px',
            marginBottom: '20px',
            boxShadow: '0 14px 32px rgba(13, 31, 56, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <span style={{ background: 'rgba(207, 210, 157, 0.22)', border: '1px solid #CFD29D', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#CFD29D' }}>
              🧍‍♂️ {tr(lang, 'خريطة جسم الإنسان التفاعلية لتشخيص الأعراض باللمس', 'Interactive 3D/SVG Human Body Symptom Map')}
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link to="/symptom-triage" className="btn small" style={{ background: 'rgba(255,255,255,0.16)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
                🩺 {tr(lang, 'البحث النصي للأعراض', 'Text Symptom Search')}
              </Link>
              <Link to="/clinics" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
                🏥 {tr(lang, 'مجمع الـ 20 عيادة', '20 Specialty Clinics')}
              </Link>
            </div>
          </div>

          <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
            {tr(lang, 'اضغط على مكان الوجع في جسم الإنسان 👈 لتشخيص حالتك فوراً!', 'Tap Where It Hurts on the Human Body for Instant Clinical Triage')}
          </h1>
          <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
            {tr(
              lang,
              'اختر المنظر الأمامي أو الخلفي واضغط مباشرة على النقطة المضيئة مكان الألم في الجسم (الرأس، الصدر، فم المعدة، الجنب والكلى، أسفل الظهر، الركبة، أو الكعب) ليرشدك الطبيب الذكي خطوة بخطوة.',
              'Switch between Front and Back views and tap any glowing anatomical region to launch a guided clinical interview, red-flag check, and direct specialty routing.'
            )}
          </p>
        </section>
      )}

      {/* Main Split Grid: Interactive Body Silhouette + Clinical Interview Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: SVG ANATOMICAL BODY MAP */}
        <section
          className="card"
          style={{
            borderRadius: '22px',
            border: '2px solid #cbd5e1',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          {/* Controls: Front/Back + Persona */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.08)', padding: '4px', borderRadius: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  setSide('front');
                  handleSelectRegion('upper_abdomen');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: side === 'front' ? '#138866' : 'transparent',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                }}
              >
                👀 من الأمام (Front)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSide('back');
                  handleSelectRegion('flanks_kidneys');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: side === 'back' ? '#138866' : 'transparent',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                }}
              >
                🔄 من الخلف (Back)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.08)', padding: '4px', borderRadius: '14px' }}>
              {[
                { id: 'male' as PatientPersona, lbl: '👨 رجل' },
                { id: 'female' as PatientPersona, lbl: '👩 سيدة' },
                { id: 'child' as PatientPersona, lbl: '👶 طفل' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: persona === p.id ? '#CFD29D' : 'transparent',
                    color: persona === p.id ? '#0D1F38' : '#cbd5e1',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  {p.lbl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 700 }}>
            👇 اضغط على أي دائرة مضيئة على الجسم لتحديد مكان الشكوى:
          </div>

          {/* Interactive SVG Human Silhouette */}
          <div style={{ position: 'relative', maxWidth: '300px', margin: '0 auto' }}>
            <svg
              viewBox="0 0 280 520"
              style={{ width: '100%', height: 'auto', maxHeight: '470px', filter: 'drop-shadow(0 8px 24px rgba(19, 136, 102, 0.25))' }}
              role="img"
              aria-label="خريطة جسم الإنسان التفاعلية"
            >
              <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="50%" stopColor="#134e4a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <radialGradient id="activeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                  <stop offset="65%" stopColor="#f97316" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Subtle anatomical grid lines */}
              <line x1="140" y1="10" x2="140" y2="505" stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
              <line x1="30" y1="155" x2="250" y2="155" stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
              <line x1="30" y1="260" x2="250" y2="260" stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />

              {/* Human Body Silhouette Path */}
              <g fill="url(#bodyGrad)" stroke="#38bdf8" strokeWidth="2" opacity="0.92">
                {/* Head */}
                <ellipse cx="140" cy="54" rx="28" ry="34" />
                {/* Neck */}
                <rect x="128" y="86" width="24" height="24" rx="6" />
                {/* Torso */}
                <path d="M 92 110 Q 140 104 188 110 L 196 185 L 180 285 Q 140 295 100 285 L 84 185 Z" />
                {/* Left Arm (Viewer Left) */}
                <path d="M 92 112 L 62 175 L 48 255 Q 46 268 58 270 L 72 190 L 94 145 Z" />
                {/* Right Arm (Viewer Right) */}
                <path d="M 188 112 L 218 175 L 232 255 Q 234 268 222 270 L 208 190 L 186 145 Z" />
                {/* Left Leg */}
                <path d="M 102 284 L 98 385 L 102 475 Q 102 492 122 492 L 130 475 L 134 385 L 136 290 Z" />
                {/* Right Leg */}
                <path d="M 178 284 L 182 385 L 178 475 Q 178 492 158 492 L 150 475 L 146 385 L 144 290 Z" />
              </g>

              {/* Internal Organ Hints */}
              {side === 'front' ? (
                <g opacity="0.35" stroke="#99f6e4" strokeWidth="1.5" fill="none">
                  {/* Lungs */}
                  <ellipse cx="122" cy="152" rx="16" ry="24" />
                  <ellipse cx="158" cy="152" rx="16" ry="24" />
                  {/* Stomach */}
                  <path d="M 132 200 Q 158 195 156 220 Q 142 232 126 218 Z" />
                  {/* Intestines */}
                  <rect x="114" y="238" width="52" height="36" rx="12" />
                </g>
              ) : (
                <g opacity="0.4" stroke="#fcd34d" strokeWidth="1.5" fill="none">
                  {/* Spine */}
                  <line x1="140" y1="90" x2="140" y2="280" strokeWidth="4" strokeDasharray="6 4" />
                  {/* Kidneys */}
                  <ellipse cx="116" cy="215" rx="10" ry="15" />
                  <ellipse cx="164" cy="215" rx="10" ry="15" />
                </g>
              )}

              {/* Interactive Clickable Hotspots */}
              {activeHotspots.map((hs) => {
                const isSelected = selectedRegionId === hs.id;
                return (
                  <g
                    key={hs.id + side}
                    onClick={() => handleSelectRegion(hs.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {isSelected && (
                      <circle cx={hs.cx} cy={hs.cy} r={hs.r + 12} fill="url(#activeGlow)" />
                    )}
                    <circle
                      cx={hs.cx}
                      cy={hs.cy}
                      r={hs.r}
                      fill={isSelected ? '#ef4444' : 'rgba(20, 184, 166, 0.35)'}
                      stroke={isSelected ? '#ffffff' : '#5eead4'}
                      strokeWidth={isSelected ? '3' : '2'}
                    />
                    <circle
                      cx={hs.cx}
                      cy={hs.cy}
                      r="4.5"
                      fill="#ffffff"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Region Selector Pills below SVG for accessibility */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
            {ANATOMICAL_REGIONS.map((reg) => {
              const active = selectedRegionId === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => {
                    if (reg.side === 'back' && side !== 'back') setSide('back');
                    if (reg.side === 'front' && side !== 'front') setSide('front');
                    handleSelectRegion(reg.id);
                  }}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '16px',
                    border: active ? '2px solid #CFD29D' : '1px solid rgba(255,255,255,0.2)',
                    background: active ? '#138866' : 'rgba(255,255,255,0.07)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {reg.icon} {reg.nameAr}
                </button>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: GUIDED CLINICAL INTERVIEW FOR SELECTED BODY PART */}
        <section style={{ display: 'grid', gap: '16px' }}>
          {/* Selected Body Part Banner */}
          <div
            className="card"
            style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
              border: '2px solid #138866',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2.4rem' }}>{selectedRegion.icon}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e' }}>
                    📍 المنطقة المختارة الآن على الجسم:
                  </div>
                  <h2 style={{ margin: '2px 0 4px', color: '#0D1F38', fontSize: '1.35rem', fontWeight: 900 }}>
                    {isAr ? selectedRegion.nameAr : selectedRegion.nameEn}
                  </h2>
                  <p className="small muted" style={{ margin: 0 }}>
                    {selectedRegion.subtitleAr}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn small"
                onClick={() =>
                  speakText(
                    `${selectedRegion.nameAr}. ${selectedPattern.likelyDiagnosisAr}. ${selectedPattern.immediateFirstAidAr}`,
                    lang
                  )
                }
                style={{ background: '#0D1F38', color: '#ffffff', borderRadius: '18px', fontWeight: 800 }}
              >
                🔊 استمع للتشخيص صوتياً
              </button>
            </div>
          </div>

          {/* Step 1: Red Flag Emergency Filter */}
          <div
            className="card"
            style={{
              borderRadius: '18px',
              border: hasRedFlag ? '2.5px solid #dc2626' : '1.5px solid #fecaca',
              background: hasRedFlag ? '#fef2f2' : '#fff5f5',
              padding: '16px 18px',
            }}
          >
            <div style={{ fontWeight: 900, color: '#991b1b', fontSize: '0.96rem', marginBottom: '8px' }}>
              🚨 الخطوة ١ (فحص الأمان الفوري): {selectedRegion.redFlagQuestionAr}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setHasRedFlag(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: !hasRedFlag ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  background: !hasRedFlag ? '#dcfce7' : '#ffffff',
                  color: '#166534',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                🟢 لا، لا توجد هذه العلامات الخطرة
              </button>
              <button
                type="button"
                onClick={() => setHasRedFlag(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: hasRedFlag ? '2px solid #dc2626' : '1px solid #cbd5e1',
                  background: hasRedFlag ? '#dc2626' : '#ffffff',
                  color: hasRedFlag ? '#ffffff' : '#991b1b',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                🚨 نعم، توجد إحدى هذه العلامات!
              </button>
            </div>

            {hasRedFlag && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  lineHeight: 1.65,
                }}
              >
                {selectedRegion.redFlagWarningAr}
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a href="tel:123" className="btn small" style={{ background: '#ffffff', color: '#dc2626', fontWeight: 900, textDecoration: 'none', borderRadius: '10px' }}>
                    🚑 اتصال فوري بالإسعاف (123)
                  </a>
                  <Link to={selectedPattern.clinicRoute} className="btn small" style={{ background: '#0D1F38', color: '#CFD29D', fontWeight: 900, textDecoration: 'none', borderRadius: '10px' }}>
                    {selectedPattern.clinicLabelAr}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Choose Exact Symptom Pattern */}
          <div className="card" style={{ borderRadius: '18px', border: '1.5px solid #cbd5e1', padding: '18px' }}>
            <h3 style={{ margin: '0 0 10px', color: '#0D1F38', fontSize: '1.05rem', fontWeight: 900 }}>
              🩺 الخطوة ٢: اختر الوصف الأقرب لما تشعر به في «{selectedRegion.nameAr}»:
            </h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {selectedRegion.patterns.map((pat) => {
                const isSel = selectedPattern.id === pat.id;
                return (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => setSelectedPatternId(pat.id)}
                    style={{
                      textAlign: 'right',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: isSel ? '2px solid #138866' : '1px solid #cbd5e1',
                      background: isSel ? '#f0fdf4' : '#ffffff',
                      color: '#0D1F38',
                      fontWeight: isSel ? 900 : 700,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{isSel ? '✅' : '⚪'}</span>
                    <span>{pat.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Pinpoint Clinical Output & Action Plan */}
          <div
            className="card"
            style={{
              borderRadius: '20px',
              border: '2px solid #0D1F38',
              background: '#ffffff',
              padding: '20px',
              boxShadow: '0 10px 24px rgba(13, 31, 56, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#138866' }}>
                📋 التقييم الإكلينيكي المبدئي وخطة التصرف الذكية:
              </span>
              <span
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  background:
                    selectedPattern.urgency === 'emergency_er'
                      ? '#fee2e2'
                      : selectedPattern.urgency === 'urgent_24h'
                      ? '#fef3c7'
                      : '#dcfce7',
                  color:
                    selectedPattern.urgency === 'emergency_er'
                      ? '#991b1b'
                      : selectedPattern.urgency === 'urgent_24h'
                      ? '#92400e'
                      : '#166534',
                }}
              >
                {selectedPattern.urgency === 'emergency_er'
                  ? '🚨 طوارئ فورية'
                  : selectedPattern.urgency === 'urgent_24h'
                  ? '⚠️ يفضل فحص طبيب خلال 24 ساعة'
                  : '🟢 رعاية منزلية وكشف روتيني'}
              </span>
            </div>

            <h3 style={{ margin: '0 0 12px', color: '#0D1F38', fontSize: '1.2rem', fontWeight: 900 }}>
              🎯 السبب المحتمل: {selectedPattern.likelyDiagnosisAr}
            </h3>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#f0fdf4', borderRight: '4px solid #16a34a', padding: '12px 14px', borderRadius: '10px' }}>
                <strong style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>
                  ✅ الإسعاف والتصرف الصحيح الآن:
                </strong>
                <span style={{ color: '#1e293b', lineHeight: 1.65, fontSize: '0.92rem' }}>
                  {selectedPattern.immediateFirstAidAr}
                </span>
              </div>

              <div style={{ background: '#fef2f2', borderRight: '4px solid #dc2626', padding: '12px 14px', borderRadius: '10px' }}>
                <strong style={{ color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                  ⛔ خطأ شائع ممنوع تماماً:
                </strong>
                <span style={{ color: '#7f1d1d', lineHeight: 1.65, fontSize: '0.92rem', fontWeight: 700 }}>
                  {selectedPattern.strictlyAvoidAr}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '10px' }}>
                  <strong style={{ color: '#0D1F38', fontSize: '0.84rem', display: 'block' }}>
                    🔬 التحاليل أو الأشعة المقترحة:
                  </strong>
                  <span style={{ color: '#475569', fontSize: '0.86rem' }}>{selectedPattern.suggestedTestsAr}</span>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '10px' }}>
                  <strong style={{ color: '#0D1F38', fontSize: '0.84rem', display: 'block' }}>
                    👨‍⚕️ التخصص الطبي المناسب:
                  </strong>
                  <span style={{ color: '#0f766e', fontSize: '0.88rem', fontWeight: 800 }}>
                    {selectedPattern.specialtyDoctorAr}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <Link
                to={selectedPattern.clinicRoute}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  textDecoration: 'none',
                  borderRadius: '14px',
                  padding: '10px 18px',
                }}
              >
                {selectedPattern.clinicLabelAr} ←
              </Link>
              <Link
                to="/assistant"
                className="btn"
                style={{
                  background: '#f0fdf4',
                  color: '#138866',
                  border: '1.5px solid #138866',
                  fontWeight: 800,
                  textDecoration: 'none',
                  borderRadius: '14px',
                  padding: '10px 16px',
                }}
              >
                🤖 ناقش حالتك مع الطبيب المحاور الذكي
              </Link>
              <Link
                to="/lab-photo-scanner"
                className="btn"
                style={{
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1.5px solid #93c5fd',
                  fontWeight: 800,
                  textDecoration: 'none',
                  borderRadius: '14px',
                  padding: '10px 16px',
                }}
              >
                📸 افحص صورة تحليلك أو روشتتك
              </Link>
            </div>
          </div>
        </section>
      </div>

      {!embedded && (
        <div style={{ marginTop: '22px' }}>
          <Disclaimer />
        </div>
      )}
    </div>
  );
}
