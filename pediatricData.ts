import { Bi } from './types';

export interface PediatricSuspension {
  id: string;
  tradeName: Bi;
  genericName: Bi;
  concentrationMgPer5ml: number; // e.g. 457, 250, 120, 100
  mgPerMl: number; // e.g. 80, 50, 24, 20
  standardDoseMgPerKgPerDay: number; // total daily mg/kg
  highDoseMgPerKgPerDay?: number;
  dosesPerDay: number; // 1, 2, 3, or 4
  frequencyHours: number; // 24, 12, 8, or 6
  shelfLifeDays: number; // 7, 10, 14, 30, 90
  storageCondition: 'fridge' | 'room_temp';
  storageNote: Bi;
  reconstitutionWaterVolMl: number; // 0 for ready-made syrups
  specialNursingTip: Bi;
}

export const PEDIATRIC_SUSPENSIONS: PediatricSuspension[] = [
  {
    id: 'cetal_250_syrup',
    tradeName: { ar: 'سيتال 250 مجم/5 مل شراب خافض للحرارة ومسكن (Cetal 250 Syrup)', en: 'Cetal 250mg/5ml Suspension (Paracetamol)' },
    genericName: { ar: 'باراسيتامول (خافض حرارة ومسكن آمن)', en: 'Paracetamol (Antipyretic & Analgesic)' },
    concentrationMgPer5ml: 250,
    mgPerMl: 50,
    standardDoseMgPerKgPerDay: 45, // ~10-15 mg/kg per dose every 6-8h (3-4 times daily)
    highDoseMgPerKgPerDay: 60,
    dosesPerDay: 3,
    frequencyHours: 8,
    shelfLifeDays: 180,
    storageCondition: 'room_temp',
    storageNote: {
      ar: 'شراب جاهز يحفظ في درجة حرارة الغرفة (أقل من 30 مئوية) بعيداً عن ضوء الشمس المباشر.',
      en: 'Ready-to-use suspension; store at room temperature (<30°C) away from direct sunlight.',
    },
    reconstitutionWaterVolMl: 0,
    specialNursingTip: {
      ar: 'الجرعة القياسية للطفل هي 10 إلى 15 مجم لكل كجم في المرة الواحدة (بحد أقصى 4 مرات يومياً). احذري إعطاء لبوس أو نقط باراسيتامول في نفس الوقت لتجنب تكرار المادة الفعالة!',
      en: 'Standard single dose is 10-15 mg/kg every 6-8 hours (max 4 doses/24h). Avoid combining with other paracetamol drops or suppositories.',
    },
  },
  {
    id: 'abimol_cetal_120',
    tradeName: { ar: 'أبيمول / سيتال 120 مجم/5 مل شراب للأطفال (Abimol / Cetal 120)', en: 'Abimol / Cetal 120mg/5ml Pediatric Syrup' },
    genericName: { ar: 'باراسيتامول (تركيز خفيف للرضع والأطفال)', en: 'Paracetamol 120mg/5ml' },
    concentrationMgPer5ml: 120,
    mgPerMl: 24,
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 60,
    dosesPerDay: 3,
    frequencyHours: 8,
    shelfLifeDays: 180,
    storageCondition: 'room_temp',
    storageNote: {
      ar: 'يحفظ في درجة حرارة الغرفة ولا يحتاج إلى حل بالماء.',
      en: 'Store at controlled room temperature; ready-to-use liquid.',
    },
    reconstitutionWaterVolMl: 0,
    specialNursingTip: {
      ar: 'انتبهي للفرق بين تركيز 120 مجم وتركيز 250 مجم عند حساب السنتيمتر بالسيرنجة.',
      en: 'Always verify whether your bottle is 120mg/5ml or 250mg/5ml before drawing the syringe volume.',
    },
  },
  {
    id: 'brufen_100_syrup',
    tradeName: { ar: 'بروفين 100 مجم/5 مل شراب خافض للحرارة ومضاد للالتهاب (Brufen Syrup)', en: 'Brufen 100mg/5ml Pediatric Syrup (Ibuprofen)' },
    genericName: { ar: 'إيبوبروفين (خافض حرارة ومسكن ومضاد التهاب)', en: 'Ibuprofen 100mg/5ml' },
    concentrationMgPer5ml: 100,
    mgPerMl: 20,
    standardDoseMgPerKgPerDay: 24, // 8 mg/kg every 8 hours
    highDoseMgPerKgPerDay: 30, // 10 mg/kg every 8 hours
    dosesPerDay: 3,
    frequencyHours: 8,
    shelfLifeDays: 180,
    storageCondition: 'room_temp',
    storageNote: {
      ar: 'شراب جاهز يحفظ في درجة حرارة الغرفة ويرج جيداً قبل الاستخدام.',
      en: 'Ready-made suspension; shake well before each dose and store at room temperature.',
    },
    reconstitutionWaterVolMl: 0,
    specialNursingTip: {
      ar: 'يُعطى بعد الرضاعة أو الطعام لحماية المعدة. لا يُستخدم للرضع أقل من 6 أشهر أو في حالات الجفاف الشديد إلا بأمر الطبيب.',
      en: 'Administer after food or milk to protect the stomach. Avoid in infants under 6 months or during dehydration unless directed by a pediatrician.',
    },
  },
  {
    id: 'zyrtec_syrup',
    tradeName: { ar: 'زيرتك 5 مجم/5 مل شراب للحساسية والرشح (Zyrtec Syrup)', en: 'Zyrtec 5mg/5ml Oral Solution (Cetirizine)' },
    genericName: { ar: 'سيتيريزين (مضاد للهستامين والحساسية)', en: 'Cetirizine 1mg/ml' },
    concentrationMgPer5ml: 5,
    mgPerMl: 1,
    standardDoseMgPerKgPerDay: 0.25, // ~0.25 mg/kg/day (~2.5-5mg daily)
    dosesPerDay: 1,
    frequencyHours: 24,
    shelfLifeDays: 180,
    storageCondition: 'room_temp',
    storageNote: {
      ar: 'شراب جاهز يحفظ في درجة حرارة الغرفة.',
      en: 'Ready-to-use solution; store at room temperature.',
    },
    reconstitutionWaterVolMl: 0,
    specialNursingTip: {
      ar: 'يفضل إعطاؤه مساءً قبل النوم لأنه قد يسبب ميلاً خفيفاً للنعاس عند بعض الأطفال.',
      en: 'Best given in the evening as it may cause mild drowsiness.',
    },
  },
  {
    id: 'augmentin_457',
    tradeName: { ar: 'أوجمنتين 457 مجم شراب معلق (Augmentin 457)', en: 'Augmentin 457mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين + كلافولانات (مضاد حيوي)', en: 'Amoxicillin + Clavulanate' },
    concentrationMgPer5ml: 457,
    mgPerMl: 80,
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 7,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يجب حفظه في باب الثلاجة (2 إلى 8 درجات مئوية) وصلاحيته 7 أيام فقط بعد الحل بالماء!',
      en: 'Store strictly in the refrigerator (2-8°C). Discard after 7 days.',
    },
    reconstitutionWaterVolMl: 64,
    specialNursingTip: {
      ar: 'يعطى مع بداية وجبة طعام خفيفة لتقليل اضطرابات المعدة والإسهال. رج الزجاجة جيداً قبل كل جرعة.',
      en: 'Give at the start of a meal to reduce nausea and diarrhea. Shake bottle vigorously before each dose.',
    },
  },
  {
    id: 'curam_457',
    tradeName: { ar: 'كيورام 457 مجم شراب معلق (Curam 457)', en: 'Curam 457mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين + كلافولانات (مضاد حيوي)', en: 'Amoxicillin + Clavulanate' },
    concentrationMgPer5ml: 457,
    mgPerMl: 80,
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 7,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ في الثلاجة (2 إلى 8 درجات مئوية) وصلاحيته 7 أيام فقط بعد الحل.',
      en: 'Refrigerate (2-8°C); strictly discard after 7 days.',
    },
    reconstitutionWaterVolMl: 64,
    specialNursingTip: {
      ar: 'عند نسيان جرعة الطفل، لا تضاعف الجرعة أبداً؛ استشر الطبيب أو الصيدلي لمعرفة التصرف الآمن المخصص لوزن الطفل ودوائه.',
      en: 'If a dose is missed, never double the dose; consult the prescribing doctor or pharmacist.',
    },
  },
  {
    id: 'hibiotic_457',
    tradeName: { ar: 'هاي بيوتك 457 مجم شراب معلق (Hibiotic 457)', en: 'Hibiotic 457mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين + كلافولانات (مضاد حيوي)', en: 'Amoxicillin + Clavulanate' },
    concentrationMgPer5ml: 457,
    mgPerMl: 80,
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 7,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ في الثلاجة لمدة 7 أيام فقط بعد حله بالماء المقطر.',
      en: 'Store in refrigerator; valid for 7 days post-reconstitution.',
    },
    reconstitutionWaterVolMl: 64,
    specialNursingTip: {
      ar: 'استخدم سرنجة القياس المدرجة بالملليلتر، وممنوع استخدام ملاعق الطعام المنزلية.',
      en: 'Always use an oral dosing syringe marked in milliliters. Never use kitchen spoons.',
    },
  },
  {
    id: 'augmentin_228',
    tradeName: { ar: 'أوجمنتين 228 مجم شراب معلق (Augmentin 228)', en: 'Augmentin 228mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين + كلافولانات', en: 'Amoxicillin + Clavulanate' },
    concentrationMgPer5ml: 228,
    mgPerMl: 40,
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 7,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ في الثلاجة لمدة 7 إلى 10 أيام فقط.',
      en: 'Keep refrigerated; discard after 7-10 days.',
    },
    reconstitutionWaterVolMl: 64,
    specialNursingTip: {
      ar: 'مناسب للأوزان الخفيفة والأطفال الصغار لضبط كمية السائل بسهولة.',
      en: 'Ideal for younger infants to achieve manageable dosing volume.',
    },
  },
  {
    id: 'zithromax_200',
    tradeName: { ar: 'زيثروماكس / زيثرون 200 مجم/5 مل شراب (Zithromax 200)', en: 'Zithromax / Xithrone 200mg/5ml Suspension' },
    genericName: { ar: 'أزيثرومايسين', en: 'Azithromycin' },
    concentrationMgPer5ml: 200,
    mgPerMl: 40,
    standardDoseMgPerKgPerDay: 10,
    dosesPerDay: 1,
    frequencyHours: 24,
    shelfLifeDays: 10,
    storageCondition: 'room_temp',
    storageNote: {
      ar: 'يحفظ في درجة حرارة الغرفة المعتدلة وصلاحيته 5 إلى 10 أيام بعد الحل.',
      en: 'Store at controlled room temperature; valid for 5-10 days after reconstitution.',
    },
    reconstitutionWaterVolMl: 15,
    specialNursingTip: {
      ar: 'يعطى مرة واحدة يومياً لمدة 3 إلى 5 أيام حسب توجيه الطبيب.',
      en: 'Given once daily for 3 to 5 days as prescribed.',
    },
  },
  {
    id: 'suprax_100',
    tradeName: { ar: 'سوبراكس 100 مجم/5 مل شراب معلق (Suprax 100)', en: 'Suprax 100mg/5ml Suspension' },
    genericName: { ar: 'سيفيكسيم', en: 'Cefixime' },
    concentrationMgPer5ml: 100,
    mgPerMl: 20,
    standardDoseMgPerKgPerDay: 8,
    dosesPerDay: 1,
    frequencyHours: 24,
    shelfLifeDays: 14,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يمكن حفظه في الثلاجة أو بحرارة الغرفة المعتدلة وصلاحيته 14 يوماً بعد الحل.',
      en: 'Store in refrigerator or controlled room temperature; valid for 14 days.',
    },
    reconstitutionWaterVolMl: 40,
    specialNursingTip: {
      ar: 'يتميز بإمكانية إعطائه كجرعة واحدة يومياً مما يسهل التزام الطفل بالعلاج.',
      en: 'Convenient single daily dose significantly improves pediatric compliance.',
    },
  },
];

export interface ReconstitutionStep {
  stepNumber: number;
  title: Bi;
  instruction: Bi;
  nursingWarning: Bi;
  icon: string;
}

export const RECONSTITUTION_STEPS: ReconstitutionStep[] = [
  {
    stepNumber: 1,
    title: { ar: 'رج الزجاجة أو تفكيك البودرة الجافة أولاً', en: 'Shake Bottle or Loosen Dry Powder' },
    instruction: {
      ar: 'للأدوية الجاهزة (مثل خافض الحرارة والكحة) رجي الزجاجة جيداً قبل كل جرعة. أما لبودرة الشراب الجاف، اقلبي الزجاجة ورجيها بلطف وهي جافة لتفكيك البودرة قبل إضافة الماء.',
      en: 'For ready-made syrups, shake well before each dose. For dry powder suspensions, tap the bottle to loosen powder before adding water.',
    },
    nursingWarning: {
      ar: 'خطأ شائع: عدم رج الشراب المعلق قبل السحب بالسيرنجة يجعل الجرعة الأولى خفيفة والأخيرة مركزة جداً.',
      en: 'Common Error: Failing to shake suspensions leads to uneven concentration.',
    },
    icon: '🌪️',
  },
  {
    stepNumber: 2,
    title: { ar: 'استخدام الماء المقطر الفاتر فقط (للأدوية البودرة)', en: 'Use Room-Temperature Distilled Water (For Powders)' },
    instruction: {
      ar: 'للأدوية التي تحتاج إلى حل بالماء، استخدمي فقط الماء المقطر المرفق أو ماء سبق غليه وتبريده تماماً لدرجة حرارة الغرفة على مرحلتين حتى العلامة.',
      en: 'For dry powder suspensions, use only room-temperature distilled water in two stages up to the line mark.',
    },
    nursingWarning: {
      ar: 'تحذير تمريضي: الماء الساخن يفسد المادة الفعالة للدواء تماماً!',
      en: 'Critical Alert: Hot water chemically degrades active medication molecules!',
    },
    icon: '💧',
  },
  {
    stepNumber: 3,
    title: { ar: 'القياس بسرنجة الفم المدرجة بالملليلتر (ml)', en: 'Measure Strictly with an Oral Syringe (ml)' },
    instruction: {
      ar: 'اسحبي الجرعة المحسوبة بالملليلتر (السنتي) باستخدام سرنجة الفم المدرجة، ووجهي السائل ببطء نحو باطن خد الطفل وليس مباشرة للحلق لمنع الشرقة.',
      en: 'Draw the exact volume in mL using an oral syringe and squirt gently against the inside of the child’s cheek.',
    },
    nursingWarning: {
      ar: 'ممنوع استخدام ملاعق الطعام أو الشاي المنزلية لأن حجمها يختلف من 2 مل إلى 7 مل وقد يسبب جرعة زائدة.',
      en: 'Never use household teaspoons as their volume varies widely and causes dosing errors.',
    },
    icon: '📏',
  },
  {
    stepNumber: 4,
    title: { ar: 'تدوين تاريخ الفتح ومكان الحفظ الصحيح', en: 'Record Opening Date & Proper Storage' },
    instruction: {
      ar: 'اكتبي تاريخ فتح الزجاجة أو حلها بالقلم على الملصق الخارجي، وتحققي مما إذا كان الدواء يحفظ في باب الثلاجة (2-8°C) أو في درجة حرارة الغرفة.',
      en: 'Write the opening/reconstitution date on the label and verify whether it requires refrigeration or room temperature.',
    },
    nursingWarning: {
      ar: 'لا تضعي الأدوية على الرف العلوي المجاور للفريزر حتى لا تتجمد وتفقد فعاليتها.',
      en: 'Never freeze liquid medications.',
    },
    icon: '🧊',
  },
];
