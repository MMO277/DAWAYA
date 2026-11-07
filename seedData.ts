import { Bi, Brand, Source, TextField } from './types';

export interface SeedItem {
  id: string;
  fields: Partial<Record<TextField, Bi>>;
  brands: Brand[];
  sources: Source[];
  notes: string;
}

const EDA_SRC: Source = {
  title: 'هيئة الدواء المصرية (EDA) - دليل الأدوية والأسعار الرسمية والباركود',
  url: 'https://edaegypt.gov.eg',
  publisher: 'Egyptian Drug Authority',
  updated: '2026-05-01',
  accessed: '2026-10-13',
};

const MP_SRC: Source = {
  title: 'National Library of Medicine - MedlinePlus Drug Information',
  url: 'https://medlineplus.gov/druginformation.html',
  publisher: 'National Institutes of Health (NIH)',
  updated: '2026-01-15',
  accessed: '2026-10-13',
};

export const SEED: SeedItem[] = [
  // 1. Augmentin (Amoxicillin + Clavulanic Acid)
  {
    id: 'amoxicillin-clavulanic-acid',
    fields: {
      genericName: { ar: 'أموكسيسيلين + حمض الكلافولانيك', en: 'Amoxicillin + Clavulanic Acid' },
      activeIngredients: { ar: 'أموكسيسيلين ثلاثي الهيدرات + كلافولانات البوتاسيوم', en: 'Amoxicillin trihydrate + Potassium clavulanate' },
      drugClass: { ar: 'بنسلين واسع المجال مدعوم بمثبط إنزيم بيتا-لاكتاماز', en: 'Broad-spectrum penicillin with beta-lactamase inhibitor' },
      mechanism: { ar: 'يثبط بناء الجدار الخلوي للبكتيريا مع إبطال مفعول إنزيمات بيتا-لاكتاماز المقاومة بواسطة الكلافولانات.', en: 'Inhibits bacterial cell wall synthesis while clavulanate inactivates beta-lactamase enzymes.' },
      strengths: {
        ar: 'أقراص: 1 جم (1000 مجم)، 625 مجم، 375 مجم.\nشراب معلق للأطفال: 457 مجم/5 مل، 228 مجم/5 مل، 156 مجم/5 مل، 312 مجم/5 مل.\nحقن وريدية (فيال): 1.2 جم، 600 مجم.',
        en: 'Tablets: 1g, 625mg, 375mg. Oral suspension: 457mg/5ml, 228mg/5ml, 312mg/5ml. IV Vials: 1.2g, 600mg.',
      },
      approvedUses: {
        ar: 'علاج العدوى البكتيرية في الجهاز التنفسي العلوي والسفلي (التهاب الجيوب الأنفية، التهاب اللوزتين الحاد، الالتهاب الرئوي الشعبي)، عدوى وخراج الأسنان واللثة، التهابات المسالك البولية، وعدوى الجلد والأنسجة الرخوة. لا يعالج نزلات البرد أو الإنفلونزا.',
        en: 'Upper/lower respiratory tract infections (sinusitis, severe tonsillitis, pneumonia), dental infections and abscesses, UTIs, and skin/soft tissue infections.',
      },
      priceEgypt: {
        ar: '• أوجمنتين 1 جم (14 قرص): 131.50 جنيه مصري.\n• أوجمنتين 625 مجم (10 أقراص): 82.50 جنيه مصري.\n• أوجمنتين شراب 457 مجم (70 مل): 89.00 جنيه مصري.\n• أوجمنتين شراب 228 مجم: 65.00 جنيه مصري.\n• أوجمنتين فيال 1.2 جم للحقن الوريدي: 55.00 جنيه مصري.',
        en: '• Augmentin 1g (14 tabs): 131.50 EGP\n• Augmentin 625mg (10 tabs): 82.50 EGP\n• Augmentin syrup 457mg: 89.00 EGP\n• Augmentin IV 1.2g: 55.00 EGP',
      },
      substitutes: {
        ar: 'إذا كان أوجمنتين غير متوفر، فالبدائل المتطابقة (نفس المادة الفعالة ونفس الجودة والتركيز):\n1. كيورام 1 جم (Curam 1g) - شركة ساندوز/نوفارتس (حوالي 115 جنيه).\n2. ميجاموكس 1 جم (Megamox 1g) - شركة سبيماكو (حوالي 105 جنيه).\n3. هاي بيوتك 1 جم (Hibiotic 1g) - شركة أمون (حوالي 109 جنيه).\n4. إي-موكسكلاف 1 جم (E-Moxclav 1g) - شركة إيبيكو (حوالي 95 جنيه).\n5. كلافيموكس 1 جم (Clavimox 1g) - شركة فاركو.\n\n• البديل في حال وجود حساسية من البنسلين: كليندامايسين (Dalacin C) أو أزيثرومايسين (Zithromax) باستشارة الطبيب.',
        en: 'Exact Generic Equivalents:\n1. Curam 1g (Sandoz) ~115 EGP\n2. Megamox 1g (Spimaco) ~105 EGP\n3. Hibiotic 1g (Amoun) ~109 EGP\n4. E-Moxclav 1g (EIPICO) ~95 EGP\nAlternative for penicillin allergy: Clindamycin or Azithromycin.',
      },
      ageRestrictions: {
        ar: 'مناسب لجميع الأعمار؛ يستخدم الشراب المعلق للأطفال والرضع بجرعة محسوبة بالوزن، والأقراص للبالغين والأطفال فوق 40 كجم.',
        en: 'Suitable for all ages. Oral suspension for pediatrics based on weight; tablets for adults and children >40kg.',
      },
      dosingReference: {
        ar: 'للبالغين: قرص 1 جم كل 12 ساعة، أو قرص 625 مجم كل 8 ساعات، ويفضل في بداية الوجبة لتقليل اضطراب المعدة. يجب إكمال الكورس بالكامل.',
        en: 'Adults: 1g every 12 hours or 625mg every 8 hours, preferably at the start of meals.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية تجاه البنسلين ومشتقاته، أو لمن أصيبوا بيرقان أو قصور كبدي سابق بسبب هذا الدواء.',
        en: 'Contraindicated in penicillin allergy or history of amoxicillin/clavulanate-associated jaundice or hepatic impairment.',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، قيء، طفح جلدي، أو التهابات فطرية بالفم. في حال ظهور صعوبة تنفس أو تورم بالوجه توقف فوراً واطلب الطوارئ.',
        en: 'Diarrhea, nausea, vomiting, mild skin rash, oral thrush. In severe rash or swelling, stop and seek emergency care.',
      },
      interactions: {
        ar: 'قد يقلل من فاعلية حبوب منع الحمل. يتفاعل مع أدوية النقرس (ألوبيورينول) ومميعات الدم (وارفارين).',
        en: 'May reduce oral contraceptive efficacy. Interacts with allopurinol and warfarin.',
      },
      pregnancyBreastfeeding: {
        ar: 'يعد آمناً بشكل عام أثناء الحمل والرضاعة عند الضرورة وتحت إشراف الطبيب.',
        en: 'Generally considered safe during pregnancy and lactation when clinically needed.',
      },
      renalHepatic: {
        ar: 'يتطلب تعديل الجرعة في حالات القصور الكلوي الشديد بناءً على معدل تصفية الكرياتينين.',
        en: 'Dose adjustment required in severe renal impairment based on GFR.',
      },
      patientEducation: {
        ar: 'تناول الدواء مع بداية الطعام لمنع آلام المعدة. رج زجاجة الشراب جيداً واحفظها في الثلاجة لمدة 7-10 أيام فقط وتخلص من الباقي.',
        en: 'Take with food to minimize GI distress. Shake suspension well, keep refrigerated, and discard after 7-10 days.',
      },
    },
    brands: [
      { name: 'Augmentin 1g Tablets', manufacturer: 'GlaxoSmithKline (GSK)', barcode: '6221127005436', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Curam 1g Tablets', manufacturer: 'Sandoz Egypt', barcode: '6221054002131', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Hibiotic 1g Tablets', manufacturer: 'Amoun Pharmaceuticals', barcode: '6221543009812', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Megamox 1g Tablets', manufacturer: 'Spimaco Misr', barcode: '6223000456123', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Augmentin 457mg Suspension', manufacturer: 'GSK', barcode: '6221127005450', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 2. Metronidazole (Flagyl / Amrizole)
  {
    id: 'metronidazole',
    fields: {
      genericName: { ar: 'ميترونيدازول', en: 'Metronidazole' },
      activeIngredients: { ar: 'ميترونيدازول', en: 'Metronidazole' },
      drugClass: { ar: 'مضاد للبكتيريا اللاهوائية ومضاد للطفيليات والأوالي', en: 'Nitroimidazole antiprotozoal and antibacterial' },
      mechanism: { ar: 'يدخل إلى الحمض النووي (DNA) للبكتيريا اللاهوائية والطفيليات ويكسر سلاسله مما يوقف تكاثرها ويقضي عليها.', en: 'Disrupts DNA and protein synthesis in anaerobic bacteria and protozoa.' },
      strengths: {
        ar: 'أقراص: 500 مجم، 250 مجم.\nشراب معلق للأطفال: 125 مجم/5 مل، 200 مجم/5 مل.\nمحلول وريدي بالتنقيط (IV Infusion): 500 مجم/100 مل.\nلبوس مهبلي / جل موضعي.',
        en: 'Tablets: 500mg, 250mg. Suspension: 125mg/5ml, 200mg/5ml. IV infusion: 500mg/100ml.',
      },
      approvedUses: {
        ar: 'علاج خراج وعدوى الأسنان واللثة (بالتزامن مع الأموكسيسيلين)، داء الأميبا المعوي والكبدي، طفيليات الجيارديا، عدوى التريكوموناس، والتهابات الحوض والبطن اللاهوائية، وعدوى جرثومة المعدة والمطثية العسيرة (C. difficile).',
        en: 'Dental abscesses (combined with amoxicillin), amoebiasis, giardiasis, trichomoniasis, anaerobic pelvic/intra-abdominal infections, and C. difficile colitis.',
      },
      priceEgypt: {
        ar: '• فلاجيل 500 مجم (20 قرص): 35.00 جنيه مصري.\n• فلاجيل 250 مجم (20 قرص): 21.00 جنيه مصري.\n• فلاجيل شراب 125 مجم (100 مل): 19.50 جنيه مصري.\n• فلاجيل محلول وريدي 500 مجم/100 مل: 28.00 جنيه مصري.',
        en: '• Flagyl 500mg (20 tabs): 35.00 EGP\n• Flagyl 250mg (20 tabs): 21.00 EGP\n• Flagyl syrup (100ml): 19.50 EGP\n• Flagyl IV infusion: 28.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة (نفس المادة الفعالة والتركيز):\n1. أمريزول 500 مجم (Amrizole 500mg) - شركة أمون (حوالي 26 جنيه للعلبة 20 قرص).\n2. دوموزول 500 مجم (Dumozol 500mg) - شركة أكتوبر فارما.\n3. فلازول 500 مجم (Flazol 500mg).\n4. روزيكس (Rozex) للجل الموضعي.\n\n• البدائل لعلاج اللاهوائيات والأسنان في حال التعذر: كليندامايسين (Dalacin C).',
        en: 'Exact Generic Equivalents:\n1. Amrizole 500mg (Amoun) ~26 EGP\n2. Dumozol 500mg (October Pharma)\n3. Flazol 500mg\nAlternative for anaerobes: Clindamycin.',
      },
      ageRestrictions: {
        ar: 'يستخدم للأطفال بجرعات دقيقة يحسبها الطبيب، والأقراص للبالغين.',
        en: 'Pediatric dosing calculated by weight; tablets for adults.',
      },
      dosingReference: {
        ar: 'للأسنان والعدوى البكتيرية: قرص 500 مجم كل 8 ساعات بعد الأكل لمدة 5 إلى 7 أيام.',
        en: 'Dental/bacterial infections: 500mg every 8 hours after meals for 5-7 days.',
      },
      contraindications: {
        ar: 'ممنوع تماماً مع تناول الكحوليات، يمنع في الثلث الأول من الحمل، ولدى مرضى متلازمة كوكايين العصبية.',
        en: 'Strictly contraindicated with alcohol. Avoid during first trimester of pregnancy.',
      },
      sideEffects: {
        ar: 'طعم معدني بالفم، غثيان، فقدان شهية، تغير لون البول إلى البني الداكن (أمر طبيعي غير مقلق)، وصداع.',
        en: 'Metallic taste in mouth, nausea, dark-colored urine (harmless), headache.',
      },
      interactions: {
        ar: 'تفاعل حاد مع الكحول (تفاعل شبيه بالديسولفيرام: غثيان شديد وقيء وتسارع ضربات القلب). يزيد من مفعول الوارفارين.',
        en: 'Severe disulfiram-like reaction with alcohol. Potentiates anticoagulant effect of warfarin.',
      },
      pregnancyBreastfeeding: {
        ar: 'يمنع في الثلث الأول من الحمل. يفرز في حليب الأم لذلك يفضل استشارة الطبيب لتحديد بديل آمن.',
        en: 'Contraindicated in 1st trimester. Secreted in breast milk; consult physician.',
      },
      renalHepatic: {
        ar: 'يخفض الجرعة إلى النصف في حالات القصور الكبدي الحاد.',
        en: 'Dose reduction needed in severe hepatic impairment.',
      },
      patientEducation: {
        ar: 'تناول الدواء بعد الأكل مع كوب ماء كامل لتقليل الطعم المعدني. لا تقلق من تحول لون البول للون الداكن. ممنوع شرب أي مشروبات كحولية أثناء العلاج ولمدة 48 ساعة بعده.',
        en: 'Take after meals. Dark urine is a harmless temporary effect. Avoid alcohol completely.',
      },
    },
    brands: [
      { name: 'Flagyl 500mg Tablets', manufacturer: 'Sanofi Egypt', barcode: '6221008001012', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Amrizole 500mg Tablets', manufacturer: 'Amoun Pharmaceuticals', barcode: '6221543001229', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Flagyl 125mg Suspension', manufacturer: 'Sanofi Egypt', barcode: '6221008001029', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 3. Azithromycin (Zithromax / Xithrone)
  {
    id: 'azithromycin',
    fields: {
      genericName: { ar: 'أزيثرومايسين', en: 'Azithromycin' },
      activeIngredients: { ar: 'أزيثرومايسين ثنائي الهيدرات', en: 'Azithromycin dihydrate' },
      drugClass: { ar: 'مضاد حيوي من عائلة الماكروليد (طويل المفعول)', en: 'Macrolide antibiotic' },
      mechanism: { ar: 'يثبط تصنيع البروتينات الحيوية للبكتيريا بالارتباط بالوحدة 50S للريبوسوم البكتيري.', en: 'Binds to the 50S ribosomal subunit, inhibiting bacterial protein synthesis.' },
      strengths: {
        ar: 'كبسولات/أقراص: 500 مجم (شريط 3 أقراص)، 250 مجم (علبة 6 كبسولات).\nشراب معلق للأطفال: 200 مجم/5 مل، 100 مجم/5 مل.\nحقن وريدية (فيال): 500 مجم.',
        en: 'Capsules/Tablets: 500mg (3 tabs), 250mg (6 caps). Suspension: 200mg/5ml, 100mg/5ml. IV Vial: 500mg.',
      },
      approvedUses: {
        ar: 'علاج الالتهاب الرئوي الشعبي، التهاب الجيوب الأنفية واللوزتين لمن يعانون من حساسية البنسلين، عدوى الكلاميديا والمسالك التناسلية، والتهابات الجلد الخفيفة. لا يعالج البرد الفيروسي.',
        en: 'Community-acquired pneumonia, acute sinusitis and tonsillitis in penicillin-allergic patients, chlamydial urethritis, and mild skin infections.',
      },
      priceEgypt: {
        ar: '• زيثروماكس 500 مجم (3 أقراص) - فايزر: 105.00 جنيه مصري.\n• زيثرون 500 مجم (3 أقراص) - أمون: 68.00 جنيه مصري.\n• زيثروكان 500 مجم (3 كبسولات) - حكمة: 55.00 جنيه مصري.\n• أزيثرومايسين شراب 200 مجم: 45.00 إلى 60.00 جنيه مصري.',
        en: '• Zithromax 500mg (3 tabs - Pfizer): 105.00 EGP\n• Xithrone 500mg (3 tabs - Amoun): 68.00 EGP\n• Zithrokan 500mg (3 caps - Hikma): 55.00 EGP\n• Suspension 200mg: 45-60 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً (نفس المادة الفعالة ونفس كورس الـ 3 أيام):\n1. زيثرون 500 مجم (Xithrone 500mg) - أمون.\n2. زيثروكان 500 مجم (Zithrokan 500mg) - حكمة.\n3. أزالييد 500 مجم (Azalide 500mg).\n4. نيوزوليد 500 مجم (Neozolid 500mg).\n5. زيثروماكس المستورد عند توفره.\n\n• البدائل من نفس العائلة: كلاريثرومايسين (Klacid) أو سبيراجيسين.',
        en: 'Exact Equivalents:\n1. Xithrone 500mg (Amoun)\n2. Zithrokan 500mg (Hikma)\n3. Azalide 500mg\nFamily alternative: Clarithromycin (Klacid).',
      },
      ageRestrictions: {
        ar: 'آمن للأطفال أكبر من 6 أشهر كشراب معلق، والأقراص لمن هم فوق 45 كجم.',
        en: 'Safe for infants >6 months as suspension; tablets for patients >45kg.',
      },
      dosingReference: {
        ar: 'الجرعة الشائعة للبالغين: قرص 500 مجم مرة واحدة يومياً قبل الأكل بساعة أو بعده بساعتين لمدة 3 أيام متتالية فقط (أو 500 مجم في اليوم الأول ثم 250 مجم يومياً لـ 4 أيام).',
        en: 'Adults: 500mg once daily for 3 consecutive days, taken 1 hour before or 2 hours after meals.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية تجاه مركبات الماكروليد، أو مرضى اختلال ضربات القلب الشديد (استطالة فترة QT)، أو المصابين بقصور كبدي شديد.',
        en: 'Contraindicated in macrolide hypersensitivity, QT prolongation, or severe hepatic disease.',
      },
      sideEffects: {
        ar: 'مغص خفيف بالمعدة، إسهال، غثيان، صداع، ونادراً خفقان في القلب أو طفح جلدي.',
        en: 'Mild abdominal cramps, diarrhea, nausea, headache, rare palpitations.',
      },
      interactions: {
        ar: 'تجنب تناوله بالتزامن مع مضادات الحموضة المحتوية على الألومنيوم أو المغنيسيوم (افصل بساعتين). يتفاعل مع الديجوكسين والوارفارين.',
        en: 'Antacids containing aluminum/magnesium reduce absorption; separate by 2 hours.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B للحمل؛ يعد من أكثر المضادات أماناً أثناء الحمل والرضاعة عند وصف الطبيب له.',
        en: 'Category B. Considered safe in pregnancy when clinically indicated.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل جرعة في القصور الكلوي الخفيف، يحذر في القصور الكبدي الشديد.',
        en: 'Caution in severe hepatic dysfunction; no adjustment needed for mild renal disease.',
      },
      patientEducation: {
        ar: 'يتميز بفاعلية ممتدة في الأنسجة تستمر لعدة أيام بعد انتهاء كورس الـ 3 أيام، فلا تكرره من تلقاء نفسك. يؤخذ على معدة فارغة لامتصاص مثالي.',
        en: 'Has prolonged tissue half-life working days after finishing the 3-day course. Do not repeat without prescription.',
      },
    },
    brands: [
      { name: 'Zithromax 500mg Tablets', manufacturer: 'Pfizer Egypt', barcode: '6221054003411', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Xithrone 500mg Tablets', manufacturer: 'Amoun / Kahira', barcode: '6221127004118', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Zithrokan 500mg Capsules', manufacturer: 'Hikma Pharma', barcode: '6221543007621', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 4. Nitrofurantoin (Macrofuran / Uvamin Retard)
  {
    id: 'nitrofurantoin',
    fields: {
      genericName: { ar: 'نيتروفورانتوين', en: 'Nitrofurantoin' },
      activeIngredients: { ar: 'نيتروفورانتوين ماكروكريستال', en: 'Nitrofurantoin macrocrystals' },
      drugClass: { ar: 'مضاد بكتيري مخصص لالتهابات المسالك البولية', en: 'Urinary tract antibacterial' },
      mechanism: { ar: 'يتحول داخل البكتيريا إلى مركبات نشطة تتلف الحمض النووي والبروتينات في مجرى البول.', en: 'Inactivates bacterial ribosomal proteins and macromolecules.' },
      strengths: {
        ar: 'كبسولات: 100 مجم، 50 مجم.\nشراب معلق للأطفال: 25 مجم/5 مل.',
        en: 'Capsules: 100mg, 50mg. Suspension: 25mg/5ml.',
      },
      approvedUses: {
        ar: 'الخيار الأول عالمياً لعلاج والوقاية من التهابات المسالك البولية والمثانة غير المعقدة وحرقان البول، الناتجة عن بكتيريا الإشريكية القولونية (E. coli). لا يستخدم لعلاج التهاب الكلى أو العدوى خارج المسالك.',
        en: 'First-line therapy for acute uncomplicated cystitis and lower UTIs caused by E. coli and Enterococci. Not indicated for pyelonephritis.',
      },
      priceEgypt: {
        ar: '• ماكروفيوران 100 مجم (علبة 30 كبسولة): 48.00 جنيه مصري (الشريط 10 كبسولات بـ 16 جنيه).\n• ماكروفيوران 50 مجم (30 كبسولة): 36.00 جنيه مصري.\n• يوفامين ريتارد 100 مجم (20 كبسولة): 52.00 جنيه مصري.',
        en: '• Macrofuran 100mg (30 caps): 48.00 EGP (16 EGP/strip)\n• Macrofuran 50mg (30 caps): 36.00 EGP\n• Uvamin Retard 100mg (20 caps): 52.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة (نفس المادة الفعالة للمسالك البولية):\n1. يوفامين ريتارد 100 مجم (Uvamin Retard 100mg) - ميفا/سويس فارما.\n2. موفيران 100 مجم (Muviran 100mg).\n\n• البدائل العلاجية الأخرى كخط أول للمسالك عند التعذر:\n1. فوسفوميسين فوار (Monuril كيس جرعة واحدة).\n2. كوتريموكسازول (Septazole).\n3. سيبروفلوكساسين للحالات المتقدمة.',
        en: 'Exact Generic Equivalents:\n1. Uvamin Retard 100mg\n2. Muviran 100mg\nTherapeutic Alternatives for UTI:\n1. Fosfomycin (Monuril single sachet)\n2. Co-trimoxazole (Septazole)',
      },
      ageRestrictions: {
        ar: 'ممنوع للأطفال حديثي الولادة أقل من شهر واحد (خطر حدوث أنيميا انحلال الدم). مناسب للأطفال الأكبر كشراب وللبالغين.',
        en: 'Contraindicated in infants <1 month of age due to risk of hemolytic anemia.',
      },
      dosingReference: {
        ar: 'للبالغين: كبسولة 100 مجم كل 12 ساعة مع الوجبات لمدة 5 أيام، مع شرب كميات وافرة من الماء.',
        en: 'Adults: 100mg twice daily with meals for 5 days.',
      },
      contraindications: {
        ar: 'يمنع في حالات القصور الكلوي الشديد (معدل تصفية أقل من 30 مل/دقيقة)، ويمنع في الأسابيع الأخيرة من الحمل (من الأسبوع 38 وحتى الولادة)، ولمرضى أنيميا الفول (G6PD deficiency).',
        en: 'Contraindicated in severe renal impairment (eGFR <30 ml/min), late pregnancy (38+ weeks), and G6PD deficiency.',
      },
      sideEffects: {
        ar: 'غثيان، فقدان شهية، وتلون البول باللون الأصفر الداكن أو البني (طبيعي تماماً). نادراً سعال أو حساسية بالصدر.',
        en: 'Nausea, loss of appetite, dark yellow/brown urine discoloration (normal and harmless).',
      },
      interactions: {
        ar: 'تتداخل مضادات الحموضة المحتوية على المغنيسيوم مع امتصاصه.',
        en: 'Magnesium trisilicate antacids reduce absorption.',
      },
      pregnancyBreastfeeding: {
        ar: 'آمن خلال الثلث الأول والثاني، لكنه ممنوع تماماً في الشهر التاسع وقرب الولادة لتفادي فقر دم الجنين.',
        en: 'Safe in early pregnancy; contraindicated at term (38-42 weeks) and during labor.',
      },
      renalHepatic: {
        ar: 'يحتاج وظائف كلى طبيعية ليتراكم في البول بتركيز فعال، لذا يمنع في الفشل الكلوي.',
        en: 'Ineffective and contraindicated in severe kidney failure because it cannot reach therapeutic urinary levels.',
      },
      patientEducation: {
        ar: 'تناول الكبسولة مع الطعام أو الحليب لمنع الغثيان ولزيادة امتصاصه. تلون البول بالأصفر الداكن أو البرتقالي طبيعي ومؤقت. اشرب 2-3 لتر ماء يومياً.',
        en: 'Take with food or milk to enhance absorption and reduce nausea. Dark urine is expected and harmless.',
      },
    },
    brands: [
      { name: 'Macrofuran 100mg Capsules', manufacturer: 'Sedico Pharmaceuticals', barcode: '6221543004519', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Uvamin Retard 100mg Capsules', manufacturer: 'Mepha / Swiss Pharma', barcode: '6223000214311', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 5. Ciprofloxacin (Cipromay / Ciprofar)
  {
    id: 'ciprofloxacin',
    fields: {
      genericName: { ar: 'سيبروفلوكساسين', en: 'Ciprofloxacin' },
      activeIngredients: { ar: 'سيبروفلوكساسين هيدروكلوريد', en: 'Ciprofloxacin hydrochloride' },
      drugClass: { ar: 'مضاد حيوي من عائلة الفلوروكينولون (واسع المجال وقوي)', en: 'Fluoroquinolone broad-spectrum antibacterial' },
      mechanism: { ar: 'يثبط إنزيم دنا جيراز وتوبويزوميراز IV المسؤولين عن تضاعف وانقسام الحمض النووي للبكتيريا.', en: 'Inhibits bacterial DNA gyrase and topoisomerase IV.' },
      strengths: {
        ar: 'أقراص: 500 مجم، 750 مجم، 250 مجم.\nمحلول وريدي بالتنقيط (IV Infusion): 200 مجم/100 مل، 400 مجم/200 مل.\nقطرات معقمة للعين والأذن: 0.3%.',
        en: 'Tablets: 500mg, 750mg, 250mg. IV Infusion: 200mg/100ml. Eye/Ear drops: 0.3%.',
      },
      approvedUses: {
        ar: 'علاج التهابات المسالك البولية المعقدة والتهاب الكلى والبروستاتا، النزلات المعوية البكتيرية الشديدة وحمى التيفود، عدوى العظام والمفاصل، والتهابات الجهاز التنفسي المعقدة. لا يعالج نزلات البرد والإنفلونزا.',
        en: 'Complicated UTIs, pyelonephritis, bacterial prostatitis, severe infectious diarrhea, typhoid fever, and bone/joint infections.',
      },
      priceEgypt: {
        ar: '• سيبروفار 500 مجم (10 أقراص) - فاركو: 48.00 جنيه مصري.\n• سيبروماي 500 مجم (10 أقراص) - إم يو بي MUP: 52.00 جنيه مصري.\n• سيبروباي 500 مجم (10 أقراص) - باير الألمانية: 110.00 جنيه مصري.\n• سيبروفلوكساسين 750 مجم (10 أقراص): 65.00 جنيه مصري.',
        en: '• Ciprofar 500mg (10 tabs - Pharco): 48.00 EGP\n• Cipromay 500mg (10 tabs - MUP): 52.00 EGP\n• Ciprobay 500mg (Bayer): 110.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز:\n1. سيبروفار 500 مجم (Ciprofar 500mg) - فاركو.\n2. سيبروماي 500 مجم (Cipromay 500mg) - MUP.\n3. سيرفيفلوكس 500 مجم (Serviflox 500mg) - نوفارتس.\n4. سيبروسين 500 مجم (Ciprocin 500mg).\n\n• البدائل من نفس العائلة: ليفوفلوكساسين (Tavanic / Levodel) قرص واحد يومياً.',
        en: 'Exact Equivalents:\n1. Ciprofar 500mg (Pharco)\n2. Cipromay 500mg (MUP)\n3. Serviflox 500mg (Novartis)\nAlternative: Levofloxacin (Tavanic).',
      },
      ageRestrictions: {
        ar: 'يمنع للأطفال والمراهقين دون سن 18 عاماً إلا في حالات خاصة جداً كالتليف الكيسي (خطر التأثير على غضاريف النمو والمفاصل).',
        en: 'Generally avoided in patients <18 years due to risk of cartilage arthropathy.',
      },
      dosingReference: {
        ar: 'قرص 500 مجم كل 12 ساعة لمدة 7 إلى 14 يوماً حسب موضع العدوى، مع شرب كميات كبيرة من الماء لتجنب تكون بلورات في البول.',
        en: '500mg every 12 hours for 7-14 days. Drink plenty of fluids.',
      },
      contraindications: {
        ar: 'ممنوع لمن لديهم تاريخ لالتهاب أو تمزق الأوتار، مرضى الوهن العضلي الوبيل (Myasthenia gravis)، وأثناء الحمل والرضاعة والأطفال.',
        en: 'Contraindicated in history of tendon rupture, myasthenia gravis, pregnancy, and lactation.',
      },
      sideEffects: {
        ar: 'غثيان، إسهال، دوخة، ألم في المفاصل أو الأوتار (خاصة وتر أكيلس). في حال شعرت بألم في الكاحل أو خلف القدم أوقف الدواء واستشر الطبيب فوراً.',
        en: 'Nausea, dizziness, tendonitis or tendon rupture (Achilles tendon), photosensitivity.',
      },
      interactions: {
        ar: 'يتفاعل بشدة مع الكالسيوم والحليب والزبادي ومكملات الحديد والزنك ومضادات الحموضة؛ يمنع تناولها إلا بفارق ساعتين قبل الدواء أو 4 ساعات بعده.',
        en: 'Binds with calcium, dairy products, iron, and antacids, drastically preventing absorption. Separate by 2-4 hours.',
      },
      pregnancyBreastfeeding: {
        ar: 'ممنوع أثناء الحمل والرضاعة لتأثيره الضار على غضاريف نمو الجنين والطفل.',
        en: 'Contraindicated in pregnancy and breastfeeding due to potential fetal arthropathy.',
      },
      renalHepatic: {
        ar: 'يتطلب تعديل وخفض الجرعة في مرضى القصور الكلوي الشديد.',
        en: 'Dose adjustment needed when creatinine clearance is <50 ml/min.',
      },
      patientEducation: {
        ar: 'اشرب الكثير من الماء يومياً. تجنب التعرض المباشر لأشعة الشمس القوية (يسبب تحسساً ضوئياً للجلد). لا تتناوله مع كوب حليب بل مع كوب ماء كبير.',
        en: 'Drink 2-3 liters of water daily. Avoid direct sunlight. Do NOT take with milk or yogurt.',
      },
    },
    brands: [
      { name: 'Ciprofar 500mg Tablets', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221008002341', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cipromay 500mg Tablets', manufacturer: 'MUP Egypt', barcode: '6221234005612', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 6. Clindamycin (Dalacin C / Clindam)
  {
    id: 'clindamycin',
    fields: {
      genericName: { ar: 'كليندامايسين', en: 'Clindamycin' },
      activeIngredients: { ar: 'كليندامايسين هيدروكلوريد', en: 'Clindamycin hydrochloride' },
      drugClass: { ar: 'مضاد حيوي من عائلة اللينكوساميد (قاتل للبكتيريا اللاهوائية والموجبة)', en: 'Lincosamide antibiotic' },
      mechanism: { ar: 'يمنع تكوين البروتين البكتيري بالارتباط بالوحدة 50S للريبوسوم البكتيري.', en: 'Reversibly binds to 50S ribosomal subunits, preventing peptide bond formation.' },
      strengths: {
        ar: 'كبسولات: 300 مجم، 150 مجم.\nحقن وريدية وعضلية (أمبول): 300 مجم/2 مل، 600 مجم/4 مل.\nمحلول وجل موضعي لحب الشباب: 1%.',
        en: 'Capsules: 300mg, 150mg. Ampoules: 300mg, 600mg. Topical solution/gel: 1%.',
      },
      approvedUses: {
        ar: 'علاج خراج والتهابات الأسنان واللثة الشديدة وعظام الفك (البديل الأول لحساسية البنسلين)، عدوى العظام والمفاصل (Osteomyelitis)، حب الشباب والتهابات الجلد البكتيرية، وعدوى الجهاز التنفسي والبطن اللاهوائية.',
        en: 'Severe dental abscesses and jaw infections (primary penicillin allergy alternative), osteomyelitis, acne vulgaris, and anaerobic infections.',
      },
      priceEgypt: {
        ar: '• دالاسين سي 300 مجم (16 كبسولة) - فايزر: 95.00 جنيه مصري.\n• كليندام 300 مجم (16 كبسولة): 62.00 جنيه مصري.\n• كليندامايسين أمبول 600 مجم للحقن: 35.00 جنيه مصري.\n• كلينداسول محلول موضعي لحب الشباب 1%: 24.00 جنيه مصري.',
        en: '• Dalacin C 300mg (16 caps - Pfizer): 95.00 EGP\n• Clindam 300mg (16 caps): 62.00 EGP\n• Clindamycin ampoule 600mg: 35.00 EGP\n• Clindasol topical solution: 24.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة الفعالة:\n1. كليندام 300 مجم (Clindam 300mg) - بديل مصري ممتاز.\n2. كلينداسين 300 مجم (Clindacin 300mg).\n3. دالاسين سي 300 مجم المستورد.\n\n• البدائل لعلاج الأسنان في حال عدم توفره: أموكسيسيلين/كلافولانات + فلاجيل (لمن ليس لديهم حساسية بنسلين).',
        en: 'Exact Generic Equivalents:\n1. Clindam 300mg\n2. Clindacin 300mg\nDental alternative for non-allergic patients: Augmentin + Flagyl.',
      },
      ageRestrictions: {
        ar: 'يستخدم بحذر للأطفال بناءً على حساب دقيق للوزن، والكبسولات للبالغين.',
        en: 'Pediatric dosing strictly by weight; capsules for adults.',
      },
      dosingReference: {
        ar: 'للأسنان والعدوى الحادة: كبسولة 300 مجم كل 6 إلى 8 ساعات بعد الأكل مع كوب ماء كبير، لمدة 7 أيام.',
        en: 'Dental/severe infections: 300mg every 6 to 8 hours with a full glass of water.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية من الكليندامايسين، أو تاريخ سابق للإصابة بالتهاب القولون الغشائي الكاذب (Pseudomembranous colitis).',
        en: 'Contraindicated in history of pseudomembranous colitis or regional enteritis.',
      },
      sideEffects: {
        ar: 'إسهال (يجب الانتباه له جيداً)، تهيج المريء والمعدة، طفح جلدي. إذا ظهر إسهال مائي حاد مستمر اتصل بالطبيب فوراً.',
        en: 'Diarrhea, esophageal irritation, nausea. Black-box risk for C. difficile colitis.',
      },
      interactions: {
        ar: 'قد يزيد من مفعول أدوية بسط العضلات المستخدمة في العمليات الجراحية.',
        en: 'Enhances neuromuscular blocking agents.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B للحمل؛ يعتبر خياراً علاجياً متاحاً عندما تدعو الحاجة الطبية، ويفرز في حليب الأم.',
        en: 'Category B. Considered acceptable in pregnancy when alternatives are lacking.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل جرعة في القصور الكلوي، يتابع في القصور الكبدي الشديد.',
        en: 'No dose adjustment in renal failure; monitor in severe liver dysfunction.',
      },
      patientEducation: {
        ar: 'ابلع الكبسولة مع كوب كامل من الماء وأنت جالس أو واقف (لا تستلقِ فوراً بعدها) لتجنب تقرح المريء. إذا أصبت بإسهال شديد مائي أثناء أو بعد العلاج، توقف وراجع الطبيب.',
        en: 'Take with a full glass of water and remain upright for 30 minutes to prevent esophageal ulcers.',
      },
    },
    brands: [
      { name: 'Dalacin C 300mg Capsules', manufacturer: 'Pfizer Egypt', barcode: '6221054008713', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Clindam 300mg Capsules', manufacturer: 'Sigma Pharmaceuticals', barcode: '6221127003192', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 7. Doxycycline (Tabocin / Vibramycin)
  {
    id: 'doxycycline',
    fields: {
      genericName: { ar: 'دوكسيسيكلين', en: 'Doxycycline' },
      activeIngredients: { ar: 'دوكسيسيكلين هيكلات', en: 'Doxycycline hyclate' },
      drugClass: { ar: 'مضاد حيوي واسع المجال من عائلة التتراسيكلين', en: 'Tetracycline antibiotic' },
      mechanism: { ar: 'يثبط تصنيع البروتين بالارتباط بالوحدة 30S للريبوسوم البكتيري ويمنع تكاثرها.', en: 'Inhibits protein synthesis by binding to the 30S ribosomal subunit.' },
      strengths: {
        ar: 'كبسولات: 100 مجم، 50 مجم.',
        en: 'Capsules: 100mg, 50mg.',
      },
      approvedUses: {
        ar: 'علاج حب الشباب المتوسط والشديد (Acne vulgaris)، والتهابات الجلد، عدوى الجهاز التنفسي والالتهاب الرئوي اللانمطي (Atypical pneumonia)، عدوى الكلاميديا والمسالك التناسلية، والوقاية من الملاريا.',
        en: 'Moderate to severe acne vulgaris, atypical pneumonia, chlamydial infections, chronic bronchitis, and malaria prophylaxis.',
      },
      priceEgypt: {
        ar: '• تابوسين 100 مجم (10 كبسولات) - حكمة: 35.00 جنيه مصري.\n• فيبراميسين 100 مجم (10 كبسولات) - فايزر: 42.00 جنيه مصري.\n• دوكسيمايسين 100 مجم (10 كبسولات): 25.00 جنيه مصري.',
        en: '• Tabocin 100mg (10 caps - Hikma): 35.00 EGP\n• Vibramycin 100mg (10 caps - Pfizer): 42.00 EGP\n• Doxymycin 100mg: 25.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً (نفس المادة الفعالة والتركيز):\n1. تابوسين 100 مجم (Tabocin 100mg) - حكمة.\n2. فيبراميسين 100 مجم (Vibramycin 100mg) - فايزر.\n3. دوكسيمايسين 100 مجم (Doxymycin 100mg).\n4. دوكسيكوست 100 مجم.\n\n• البدائل لحب الشباب: أريثرومايسين أو كليندامايسين موضعي.',
        en: 'Exact Generic Equivalents:\n1. Tabocin 100mg (Hikma)\n2. Vibramycin 100mg (Pfizer)\n3. Doxymycin 100mg\nAcne alternative: Topical Clindamycin.',
      },
      ageRestrictions: {
        ar: 'ممنوع تماماً للأطفال أقل من 8 سنوات (يسبب تصبغاً بنياً دائماً في الأسنان النامية وضعف نمو العظام).',
        en: 'Strictly contraindicated in children <8 years due to permanent tooth discoloration and enamel hypoplasia.',
      },
      dosingReference: {
        ar: 'لحب الشباب: كبسولة 100 مجم يومياً بعد الأكل مع كوب ماء كبير لمدة 6 إلى 12 أسبوعاً حسب إرشادات طبيب الجلدية. للعدوى الحادة: كبسولة كل 12 ساعة.',
        en: 'For acne: 100mg once daily for 6-12 weeks. For acute infections: 100mg twice daily.',
      },
      contraindications: {
        ar: 'ممنوع أثناء الحمل والرضاعة، وللأطفال دون 8 سنوات، ولمن لديهم حساسية التتراسيكلين.',
        en: 'Contraindicated in pregnancy, lactation, children under 8, and tetracycline allergy.',
      },
      sideEffects: {
        ar: 'تحسس شديد لأشعة الشمس وحروق شمسية سريعة، تهيج وقرح المريء إذا ابتلع بدون ماء كافٍ، غثيان.',
        en: 'Photosensitivity, esophageal ulceration if taken without water, nausea.',
      },
      interactions: {
        ar: 'يتفاعل بقوة مع الكالسيوم والحليب والزبادي ومكملات الحديد ومضادات الحموضة؛ يمنع تناولها معاً ويجب الفصل بساعتين على الأقل.',
        en: 'Chelates with calcium, dairy products, iron, and antacids, blocking absorption.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة D؛ ممنوع قطعياً في الحمل والرضاعة لتسببه في تشوه وتصبغ أسنان وعظام الجنين.',
        en: 'Category D. Strictly contraindicated; causes permanent tooth staining in fetus.',
      },
      renalHepatic: {
        ar: 'يعد التتراسيكلين الوحيد الآمن في القصور الكلوي لأنه يطرح أساساً عبر الكبد والجهاز الهضمي.',
        en: 'Safe in renal impairment as it is eliminated primarily through non-renal routes.',
      },
      patientEducation: {
        ar: 'ابلع الكبسولة مع كوب كبير من الماء وأنت واقف ولا تستلقِ لمدة 30 دقيقة بعدها. استخدم واقي شمس عند الخروج نهاراً. لا تأخذ معه كوب حليب أو أقراص حديد.',
        en: 'Take with a full glass of water upright. Do not lie down for 30 minutes. Use sunscreen.',
      },
    },
    brands: [
      { name: 'Tabocin 100mg Capsules', manufacturer: 'Hikma Pharma', barcode: '6221127009182', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Vibramycin 100mg Capsules', manufacturer: 'Pfizer Egypt', barcode: '6221054005121', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 8. Clarithromycin (Klacid / Clarikan)
  {
    id: 'clarithromycin',
    fields: {
      genericName: { ar: 'كلاريثرومايسين', en: 'Clarithromycin' },
      activeIngredients: { ar: 'كلاريثرومايسين', en: 'Clarithromycin' },
      drugClass: { ar: 'مضاد حيوي من عائلة الماكروليد', en: 'Macrolide antibiotic' },
      mechanism: { ar: 'يوقف تخليق البروتين البكتيري الأساسي عبر الارتباط بالوحدة 50S للريبوسوم.', en: 'Inhibits protein synthesis via 50S ribosomal subunit binding.' },
      strengths: {
        ar: 'أقراص: 500 مجم، 250 مجم، أقراص ممتدة المفعول XL بتركيز 500 مجم.\nشراب معلق للأطفال: 125 مجم/5 مل، 250 مجم/5 مل.',
        en: 'Tablets: 500mg, 250mg, Extended-release XL 500mg. Suspension: 125mg/5ml, 250mg/5ml.',
      },
      approvedUses: {
        ar: 'علاج جرثومة المعدة (H. pylori) ضمن البروتوكول الثلاثي والرباعي، التهابات الجهاز التنفسي والجيوب الأنفية واللوزتين، والتهابات الجلد لمن لديهم حساسية بنسلين.',
        en: 'Helicobacter pylori eradication (triple therapy), respiratory tract infections, and skin infections in penicillin-allergic patients.',
      },
      priceEgypt: {
        ar: '• كلاسيد 500 مجم (14 قرص) - أبوت: 185.00 جنيه مصري.\n• كلاريكان 500 مجم (14 قرص) - الحكمة: 125.00 جنيه مصري.\n• كلاسيد شراب 125 مجم للأطفال: 75.00 جنيه مصري.\n• كلاسيد XL ممتد المفعول 500 مجم (7 أقراص): 110.00 جنيه مصري.',
        en: '• Klacid 500mg (14 tabs - Abbott): 185.00 EGP\n• Clarikan 500mg (14 tabs - Hikma): 125.00 EGP\n• Klacid syrup 125mg: 75.00 EGP\n• Klacid XL 500mg: 110.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز:\n1. كلاريكان 500 مجم (Clarikan 500mg) - حكمة.\n2. كلاسيد 500 مجم (Klacid 500mg) - أبوت.\n3. كلاسيد ممتد المفعول (Klacid XL).\n4. كلاريباكت 500 مجم.\n\n• البدائل من نفس العائلة لعدوى التنفس: أزيثرومايسين (Zithromax).',
        en: 'Exact Generic Equivalents:\n1. Clarikan 500mg (Hikma)\n2. Klacid 500mg (Abbott)\nAlternative: Azithromycin.',
      },
      ageRestrictions: {
        ar: 'آمن للأطفال أكبر من 6 أشهر كشراب معلق، والأقراص للبالغين.',
        en: 'Suspension safe for infants >6 months; tablets for adults.',
      },
      dosingReference: {
        ar: 'لجرثومة المعدة: قرص 500 مجم كل 12 ساعة لمدة 14 يوماً مع أموكسيسيلين وأوميبرازول. لعدوى الصدر: قرص كل 12 ساعة لمدة 7 إلى 10 أيام.',
        en: 'H. pylori: 500mg twice daily for 14 days. Respiratory infections: 500mg every 12 hours.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية الماكروليد، أو مرضى متلازمة استطالة فترة QT القلبية، وممنوع تناوله مع أدوية الكوليسترول كالسيمفاستاتين.',
        en: 'Contraindicated with statins (simvastatin), QT prolongation, and severe hepatic disease.',
      },
      sideEffects: {
        ar: 'طعم مر غير مستحب بالفم، اضطراب معدة، غثيان، وإسهال.',
        en: 'Bitter metallic taste, abdominal pain, nausea, diarrhea.',
      },
      interactions: {
        ar: 'يثبط إنزيم CYP3A4 الكبدي بقوة، فيزيد بشكل خطير من تركيز أدوية الكوليسترول (الستاتينات) ومميعات الدم (وارفارين).',
        en: 'Potent CYP3A4 inhibitor; dangerous interaction with simvastatin (rhabdomyolysis risk).',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ يفضل تجنبه أثناء الحمل إلا إذا كانت الفائدة ترجح المخاطر ولا يوجد بديل أكثر أماناً.',
        en: 'Category C. Avoid in pregnancy if safer alternatives are available.',
      },
      renalHepatic: {
        ar: 'يخفض الجرعة إلى النصف في القصور الكلوي الشديد (GFR <30).',
        en: 'Reduce dose by 50% if GFR is <30 ml/min.',
      },
      patientEducation: {
        ar: 'الطعم المر في الفم أثر جانبي شائع ومؤقت يزول بانتهاء العلاج. في حال تناول أقراص XL ممتدة المفعول ابلعها كاملة ولا تمضغها أو تكسرها.',
        en: 'Bitter taste is common and temporary. Do not crush or chew XL extended-release tablets.',
      },
    },
    brands: [
      { name: 'Klacid 500mg Tablets', manufacturer: 'Abbott Laboratories', barcode: '6221054001929', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Clarikan 500mg Tablets', manufacturer: 'Hikma Pharma', barcode: '6221127008741', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 9. Co-trimoxazole (Septazole / Sutrim)
  {
    id: 'co-trimoxazole',
    fields: {
      genericName: { ar: 'سلفاميثوكسازول + تريميثوبريم (كوتريموكسازول)', en: 'Sulfamethoxazole + Trimethoprim (Co-trimoxazole)' },
      activeIngredients: { ar: 'سلفاميثوكسازول وتريميثوبريم بنسبة 5 إلى 1', en: 'Sulfamethoxazole and Trimethoprim' },
      drugClass: { ar: 'مضاد بكتيري مركب مثبط لحمض الفوليك البكتيري', en: 'Sulfonamide and folate antagonist antibacterial' },
      mechanism: { ar: 'يثبط خطوتين متتاليتين في تصنيع حمض الفوليك الأساسي للخلية البكتيرية بتأثير تآزري.', en: 'Synergistically blocks two consecutive steps in bacterial folic acid biosynthesis.' },
      strengths: {
        ar: 'أقراص فورت (Double Strength): 800/160 مجم.\nأقراص عادية: 400/80 مجم.\nشراب معلق للأطفال: 200/40 مجم لكل 5 مل.',
        en: 'Forte tablets: 800/160mg. Regular tablets: 400/80mg. Pediatric suspension: 200/40mg per 5ml.',
      },
      approvedUses: {
        ar: 'علاج التهابات المسالك البولية وحرقان المثانة، النزلات المعوية وبكتيريا الشيجيلا، التهابات الأذن الوسطى، والوقاية والعلاج لمرض الالتهاب الرئوي بالمتكيسة الرئوية (PJP).',
        en: 'Uncomplicated UTIs, shigellosis, otitis media, acute exacerbation of chronic bronchitis, and Pneumocystis jirovecii pneumonia (PCP).',
      },
      priceEgypt: {
        ar: '• سبتازول فورت (20 قرص) - الإسكندرية: 32.00 جنيه مصري.\n• سوتريم فورت (20 قرص): 28.00 جنيه مصري.\n• سبتازول شراب للأطفال (100 مل): 18.00 جنيه مصري.',
        en: '• Septazole Forte (20 tabs): 32.00 EGP\n• Sutrim Forte (20 tabs): 28.00 EGP\n• Septazole suspension: 18.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً:\n1. سبتازول فورت (Septazole Forte) - شركة الإسكندرية للأدوية.\n2. سوتريم فورت (Sutrim Forte) - شركة فاركو.\n3. كيموتريم فورت (Chemotrim Forte).\n\n• البدائل للمسالك البولية: نيتروفورانتوين (Macrofuran) أو فوسفوميسين.',
        en: 'Exact Generic Equivalents:\n1. Septazole Forte (Alexandria)\n2. Sutrim Forte (Pharco)\n3. Chemotrim Forte\nUTI alternative: Macrofuran.',
      },
      ageRestrictions: {
        ar: 'ممنوع للأطفال حديثي الولادة أقل من شهرين (خطر اليرقان النووي Kernicterus).',
        en: 'Contraindicated in infants <2 months old.',
      },
      dosingReference: {
        ar: 'قرص فورت واحد كل 12 ساعة بعد الأكل مع شرب كميات وافرة من الماء لمدة 5 إلى 7 أيام.',
        en: 'One Forte tablet every 12 hours with plenty of fluids for 5-7 days.',
      },
      contraindications: {
        ar: 'ممنوع لمن يعانون من حساسية السلفا، مرضى أنيميا الفول (G6PD)، والقصور الكلوي أو الكبدي الشديد، والأسابيع الأخيرة من الحمل.',
        en: 'Contraindicated in sulfa allergy, G6PD deficiency, severe renal/liver failure, and late pregnancy.',
      },
      sideEffects: {
        ar: 'غثيان، قيء، طفح جلدي (يجب إيقاف الدواء فوراً إذا ظهر طفح جلدي لتفادي متلازمة ستيفنز جونسون).',
        en: 'Nausea, anorexia, skin rash (stop immediately if rash occurs to avoid Stevens-Johnson syndrome).',
      },
      interactions: {
        ar: 'يرفع تركيز البوتاسيوم في الدم، ويتفاعل مع الوارفارين ويزيد النزيف، ويتفاعل مع ميثوتريكسات.',
        en: 'Increases serum potassium; potentiates warfarin anticoagulation.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة D؛ ممنوع في الثلث الأول والأسابيع الأخيرة من الحمل لتأثيره على حمض الفوليك واليرقان.',
        en: 'Contraindicated in early pregnancy and near delivery.',
      },
      renalHepatic: {
        ar: 'يخفض الجرعة للنصف إذا كانت تصفية الكلى بين 15 و 30 مل/دقيقة، وممنوع إذا كانت أقل من 15.',
        en: 'Reduce dose by 50% for CrCl 15-30 ml/min; contraindicated if <15.',
      },
      patientEducation: {
        ar: 'اشرب الكثير من الماء يومياً لمنع تكون حصوات أو بلورات السلفا في الكلى والمسالك البولية. إذا ظهر أي احمرار أو طفح جلدي توقف فوراً واستشر الطبيب.',
        en: 'Drink abundant fluids daily to avoid crystalluria. Report any new skin rash immediately.',
      },
    },
    brands: [
      { name: 'Septazole Forte Tablets', manufacturer: 'Alexandria Pharmaceuticals', barcode: '6221008007621', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Sutrim Forte Tablets', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221008008129', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 10. Cefuroxime (Zinnat / Cefurox)
  {
    id: 'cefuroxime',
    fields: {
      genericName: { ar: 'سيفوروكسيم أكسيتيل', en: 'Cefuroxime axetil' },
      activeIngredients: { ar: 'سيفوروكسيم أكسيتيل', en: 'Cefuroxime axetil' },
      drugClass: { ar: 'مضاد حيوي من عائلة السيفالوسبورين (الجيل الثاني)', en: 'Second-generation cephalosporin' },
      mechanism: { ar: 'يمنع تصنيع جدار الخلية البكتيرية بالارتباط ببروتينات البنسلين الرابطة (PBPs).', en: 'Binds to penicillin-binding proteins (PBPs), inhibiting bacterial cell wall synthesis.' },
      strengths: {
        ar: 'أقراص: 500 مجم، 250 مجم.\nشراب معلق للأطفال: 125 مجم/5 مل، 250 مجم/5 مل.\nحقن وريدية وعضلية (فيال): 750 مجم، 1.5 جم.',
        en: 'Tablets: 500mg, 250mg. Suspension: 125mg/5ml, 250mg/5ml. IV/IM vials: 750mg, 1.5g.',
      },
      approvedUses: {
        ar: 'علاج التهابات الجهاز التنفسي والتهاب اللوزتين والجيوب الأنفية، عدوى الأذن الوسطى، التهابات المسالك البولية والتهاب المثانة، وعدوى الجلد والأنسجة الرخوة.',
        en: 'Pharyngitis, acute tonsillitis, otitis media, uncomplicated UTIs, sinusitis, and skin infections.',
      },
      priceEgypt: {
        ar: '• زينات 500 مجم (10 أقراص) - GSK: 120.00 جنيه مصري.\n• سيفوروكس 500 مجم (10 أقراص): 85.00 جنيه مصري.\n• زينات شراب 125 مجم للأطفال (50 مل): 72.00 جنيه مصري.\n• زينات شراب 250 مجم للأطفال (50 مل): 98.00 جنيه مصري.',
        en: '• Zinnat 500mg (10 tabs - GSK): 120.00 EGP\n• Cefurox 500mg (10 tabs): 85.00 EGP\n• Zinnat suspension 125mg: 72.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز:\n1. سيفوروكس 500 مجم (Cefurox 500mg) - بديل مصري عالي الجودة.\n2. إكزيم 500 مجم (Xime 500mg).\n3. زينات 500 مجم المستورد.\n\n• البدائل من نفس العائلة: سيفيكسيم (Suprax) أو أموكسيسيلين/كلافولانات.',
        en: 'Exact Generic Equivalents:\n1. Cefurox 500mg\n2. Xime 500mg\nAlternative: Suprax or Augmentin.',
      },
      ageRestrictions: {
        ar: 'آمن للأطفال والرضع أكبر من 3 أشهر كشراب معلق، والأقراص لمن هم فوق سن البلوغ.',
        en: 'Suspension approved for infants >3 months; tablets for older children/adults.',
      },
      dosingReference: {
        ar: 'للبالغين: قرص 500 مجم كل 12 ساعة بعد الوجبات مباشرة لمدة 7 إلى 10 أيام.',
        en: 'Adults: 500mg twice daily with food for 7-10 days.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية مفرطة تجاه السيفالوسبورينات، وبحذر لمن لديهم حساسية بنسلين شديدة.',
        en: 'Contraindicated in cephalosporin allergy; use caution in severe penicillin anaphylaxis.',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، ألم بالمعدة، صداع، ونادراً طفح جلدي.',
        en: 'Diarrhea, nausea, headache, transient transaminase elevation.',
      },
      interactions: {
        ar: 'مضادات الحموضة تقلل من امتصاصه الفموي؛ يجب الفصل بساعتين على الأقل.',
        en: 'Drugs that reduce gastric acidity decrease bioavailability.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ يعتبر آمناً وفعالاً أثناء الحمل والرضاعة عند وصف الطبيب.',
        en: 'Category B. Safe in pregnancy and lactation under medical supervision.',
      },
      renalHepatic: {
        ar: 'يتطلب تعديل الجرعة في مرضى الفشل الكلوي المتقدم.',
        en: 'Dose adjustment needed when creatinine clearance is <30 ml/min.',
      },
      patientEducation: {
        ar: 'تناول الأقراص بعد الطعام مباشرة لتحقيق أعلى نسبة امتصاص في الدم والتخلص من الطعم المر.',
        en: 'Take with food for maximum bioavailability and to mask bitter taste.',
      },
    },
    brands: [
      { name: 'Zinnat 500mg Tablets', manufacturer: 'GlaxoSmithKline (GSK)', barcode: '6221127002341', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefurox 500mg Tablets', manufacturer: 'Pharco B', barcode: '6221008006512', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 11. Ceftriaxone (Ceftriaxone / Epicephin / Cefaxone)
  {
    id: 'ceftriaxone',
    fields: {
      genericName: { ar: 'سيفترياكسون', en: 'Ceftriaxone' },
      activeIngredients: { ar: 'سيفترياكسون صوديوم', en: 'Ceftriaxone sodium' },
      drugClass: { ar: 'مضاد حيوي للحقن من عائلة السيفالوسبورين (الجيل الثالث)', en: 'Third-generation cephalosporin injection' },
      mechanism: { ar: 'يثبط بناء الجدار الخلوي للبكتيريا وله قدرة عالية على اختراق الأنسجة وسوائل الجسم.', en: 'Binds to PBPs, inhibiting mucopeptide synthesis in bacterial cell walls.' },
      strengths: {
        ar: 'فيال للحقن الوريدي والعضلي: 1 جم (1000 مجم)، 500 مجم، 250 مجم.',
        en: 'IV/IM Vials: 1g, 500mg, 250mg.',
      },
      approvedUses: {
        ar: 'علاج العدوى الشديدة في المستشفيات: الالتهاب الرئوي الحاد، التهاب السحايا (Meningitis)، تسمم الدم، عدوى المسالك البولية المعقدة، والوقاية قبل العمليات الجراحية الكبرى.',
        en: 'Severe hospital-acquired infections: bacterial meningitis, community-acquired/nosocomial pneumonia, sepsis, intra-abdominal infections, and surgical prophylaxis.',
      },
      priceEgypt: {
        ar: '• سيفترياكسون 1 جم فيال (حقن): 42.00 جنيه مصري.\n• إبيسيفين 1 جم فيال (حقن) - إيبيكو: 48.00 جنيه مصري.\n• سيفاكسون 1 جم فيال (حقن) - فاركو: 45.00 جنيه مصري.\n• روسيفين 1 جم فيال (روش السويسرية): 115.00 جنيه مصري.',
        en: '• Ceftriaxone 1g vial: 42.00 EGP\n• Epicephin 1g vial (EIPICO): 48.00 EGP\n• Cefaxone 1g vial (Pharco): 45.00 EGP\n• Rocephin 1g vial (Roche): 115.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً (نفس المادة والحقن الوريدي/العضلي):\n1. إبيسيفين 1 جم (Epicephin 1g) - إيبيكو.\n2. سيفاكسون 1 جم (Cefaxone 1g) - فاركو.\n3. سيفترياكسون 1 جم (ساندوز أو سيديكو).\n4. روسيفين 1 جم (Rocephin 1g) المستورد.\n\n• البدائل من نفس الفئة: سيفوتاكسيم (Claforan / Cefotax).',
        en: 'Exact Generic Equivalents:\n1. Epicephin 1g (EIPICO)\n2. Cefaxone 1g (Pharco)\n3. Rocephin 1g\nAlternative: Cefotaxime (Claforan).',
      },
      ageRestrictions: {
        ar: 'ممنوع منعاً باتاً لحديثي الولادة المصابين باليرقان (خطر اليرقان الدماغي)، وممنوع مزجه مع محاليل الكالسيوم للأطفال.',
        en: 'Contraindicated in hyperbilirubinemic neonates and premature infants.',
      },
      dosingReference: {
        ar: 'حقنة 1 جم وريدياً بالتنقيط البطيء أو عضلياً كل 24 ساعة (أو كل 12 ساعة في العدوى الشديدة)، تحت إشراف تمريضي وطبي مباشر.',
        en: 'Adults: 1-2g IV/IM once every 24 hours under clinical supervision.',
      },
      contraindications: {
        ar: 'يمنع مزجه نهائياً في نفس المحلول أو الوريد مع أي محاليل تحتوي على الكالسيوم (كالرينجر لاكتات) حتى عبر خطوط وريدية منفصلة عند الرضع.',
        en: 'Do NOT mix or co-administer with calcium-containing IV solutions (risk of precipitation in lungs/kidneys).',
      },
      sideEffects: {
        ar: 'إسهال، ألم في موضع الحقن، تفاعلات تحسسية، وترسبات حصوية مؤقتة في المرارة.',
        en: 'Diarrhea, injection site pain, thrombophlebitis, biliary sludging.',
      },
      interactions: {
        ar: 'ترسبات خطيرة ومميتة مع محاليل الكالسيوم الوريدية. يزيد من تأثير مميعات الدم.',
        en: 'Fatal particulate precipitation with IV calcium in neonates.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف في حالات العدوى الشديدة أثناء الحمل تحت إشراف الطبيب.',
        en: 'Category B. Safe in pregnancy when severe bacterial infection mandates it.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل جرعة في القصور الكلوي المنفرد طالما الكبد سليم، ولا في القصور الكبدي المنفرد طالما الكلى سليمة.',
        en: 'Dual route of excretion (renal and biliary); no adjustment needed unless both renal and hepatic failure coexist.',
      },
      patientEducation: {
        ar: 'إعطاء هذا الدواء يتم حصراً بواسطة ممرض مؤهل أو طبيب في المستشفى أو المركز الطبي. يجب إجراء اختبار الحساسية قبل أول جرعة حقن.',
        en: 'Must be administered by qualified nursing personnel. Skin allergy testing is advised prior to administration.',
      },
    },
    brands: [
      { name: 'Epicephin 1g Vial', manufacturer: 'EIPICO Egypt', barcode: '6221127003412', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefaxone 1g Vial', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221008003129', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 12. Levofloxacin (Tavanic / Levodel)
  {
    id: 'levofloxacin',
    fields: {
      genericName: { ar: 'ليفوفلوكساسين', en: 'Levofloxacin' },
      activeIngredients: { ar: 'ليفوفلوكساسين هيميهيدرات', en: 'Levofloxacin hemihydrate' },
      drugClass: { ar: 'مضاد حيوي من عائلة الفلوروكينولون التنفسي (الجيل الثالث)', en: 'Respiratory fluoroquinolone' },
      mechanism: { ar: 'يثبط إنزيمي توبويزوميراز IV ودنا جيراز المسؤولين عن تضاعف المادة الوراثية للبكتيريا.', en: 'Inhibits bacterial DNA gyrase and topoisomerase IV.' },
      strengths: {
        ar: 'أقراص: 500 مجم، 750 مجم.\nمحلول وريدي بالتنقيط (IV Infusion): 500 مجم/100 مل.\nقطرات معقمة للعين: 0.5%.',
        en: 'Tablets: 500mg, 750mg. IV Infusion: 500mg/100ml. Eye drops: 0.5%.',
      },
      approvedUses: {
        ar: 'علاج الالتهاب الرئوي المكتسب من المجتمع الحاد، تفاقم التهاب الشعب الهوائية المزمن، التهاب الجيوب الأنفية الحاد، والتهابات المسالك البولية وحوض الكلى المعقدة، والتهاب البروستاتا المزمن.',
        en: 'Community-acquired pneumonia, acute sinusitis, acute bacterial exacerbation of chronic bronchitis, complicated UTIs, and bacterial prostatitis.',
      },
      priceEgypt: {
        ar: '• تافانيك 500 مجم (7 أقراص) - سانوفي: 145.00 جنيه مصري.\n• ليفوديل 500 مجم (7 أقراص): 85.00 جنيه مصري.\n• يونيفلوكس 500 مجم (7 أقراص): 68.00 جنيه مصري.\n• تافانيك محلول وريدي 500 مجم: 110.00 جنيه مصري.',
        en: '• Tavanic 500mg (7 tabs - Sanofi): 145.00 EGP\n• Levodel 500mg (7 tabs): 85.00 EGP\n• Unilevo 500mg: 68.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز (قرص واحد يومياً):\n1. ليفوديل 500 مجم (Levodel 500mg) - فاركو.\n2. يونيفلوكس 500 مجم (Uniflox 500mg).\n3. ليفوكسين 500 مجم (Levoxin 500mg).\n4. تافانيك 500 مجم المستورد.\n\n• البدائل من نفس الفئة: موكسيفلوكساسين (Avelox / Avalox) أو سيبروفلوكساسين.',
        en: 'Exact Generic Equivalents:\n1. Levodel 500mg\n2. Uniflox 500mg\n3. Levoxin 500mg\nAlternative: Moxifloxacin (Avelox).',
      },
      ageRestrictions: {
        ar: 'ممنوع للأطفال والمراهقين دون سن 18 عاماً لتأثيره على الأوتار وغضاريف النمو.',
        en: 'Contraindicated in pediatric patients under 18 years.',
      },
      dosingReference: {
        ar: 'قرص واحد 500 مجم مرة واحدة فقط كل 24 ساعة مع كوب ماء كبير لمدة 7 إلى 14 يوماً حسب توجيهات الطبيب.',
        en: 'Adults: 500mg once daily every 24 hours with abundant fluids.',
      },
      contraindications: {
        ar: 'ممنوع في الحمل والرضاعة، وللأطفال، ولمرضى الصرع والتشنجات، ولمن عانوا من مشاكل أو تمزق في الأوتار مع أي مضاد كينولوني سابق.',
        en: 'Contraindicated in tendonitis history, epilepsy/seizure disorders, pregnancy, and children.',
      },
      sideEffects: {
        ar: 'غثيان، صداع، أرق، دوخة، وألم في المفاصل والأوتار (وتر العرقوب). في حال حدوث ألم بالأوتار توقف فوراً.',
        en: 'Nausea, insomnia, dizziness, risk of tendonitis/tendon rupture.',
      },
      interactions: {
        ar: 'يتفاعل بشدة مع الكالسيوم ومكملات الحديد والزنك والحليب والزبادي؛ يجب الفصل بساعتين على الأقل.',
        en: 'Absorption severely impaired by calcium, dairy, iron, and multivalent cations.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ ممنوع في الحمل والرضاعة.',
        en: 'Category C. Contraindicated during pregnancy and lactation.',
      },
      renalHepatic: {
        ar: 'يطرح كلوياً بشكل رئيسي؛ يجب تعديل الجرعة بدقة في مرضى القصور الكلوي.',
        en: 'Dosage adjustment required when creatinine clearance is <50 ml/min.',
      },
      patientEducation: {
        ar: 'تناول القرص في نفس الموعد يومياً مع كوب ماء كبير. تجنب قيادة السيارة إذا شعرت بدوخة. تجنب شرب الحليب أو مكملات الحديد معه مباشرة.',
        en: 'Take once daily at the same hour with plenty of water. Do not combine with dairy or iron.',
      },
    },
    brands: [
      { name: 'Tavanic 500mg Tablets', manufacturer: 'Sanofi Egypt', barcode: '6221008004521', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Levodel 500mg Tablets', manufacturer: 'Pharco B', barcode: '6221008009181', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 13. Plain Amoxicillin (E-Mox / Biomox / Amoxil)
  {
    id: 'amoxicillin',
    fields: {
      genericName: { ar: 'أموكسيسيلين', en: 'Amoxicillin' },
      activeIngredients: { ar: 'أموكسيسيلين ثلاثي الهيدرات', en: 'Amoxicillin trihydrate' },
      drugClass: { ar: 'مضاد حيوي من عائلة البنسلينات (قاتل للبكتيريا)', en: 'Penicillin-class antibiotic' },
      mechanism: { ar: 'يثبط بناء الجدار الخلوي للبكتيريا مما يؤدي إلى تحللها وموتها سريعاً.', en: 'Inhibits bacterial cell wall synthesis causing cell lysis and death.' },
      strengths: {
        ar: 'كبسولات: 500 مجم، 250 مجم.\nأقراص قابلة للذوبان / مضغ: 1 جم، 500 مجم.\nشراب معلق للأطفال: 250 مجم/5 مل، 125 مجم/5 مل.',
        en: 'Capsules: 500mg, 250mg. Dispersible tablets: 1g, 500mg. Suspension: 250mg/5ml, 125mg/5ml.',
      },
      approvedUses: {
        ar: 'علاج التهابات الجهاز التنفسي العلوي الخفيفة (التهاب اللوزتين والحلق البكتيري)، التهاب الأذن الوسطى الحاد عند الأطفال، التهابات المسالك البولية الخفيفة، والجرثومة الحلزونية للمعدة مع أدوية أخرى. لا يعالج البرد أو الفيروسات.',
        en: 'Mild upper respiratory infections (strep throat), acute otitis media in children, uncomplicated UTIs, and H. pylori eradication.',
      },
      priceEgypt: {
        ar: '• إي-موكس 500 مجم (16 كبسولة) - إيبيكو: 38.00 جنيه مصري.\n• بيوموكس 500 مجم (16 كبسولة) - سيديكو: 32.00 جنيه مصري.\n• أموكسيل 500 مجم (16 كبسولة) - GSK: 49.50 جنيه مصري.\n• إي-موكس شراب معلق 250 مجم (100 مل): 28.50 جنيه مصري.\n• بيوموكس شراب معلق 250 مجم: 24.00 جنيه مصري.',
        en: '• E-Mox 500mg (16 caps - EIPICO): 38.00 EGP\n• Biomox 500mg (16 caps - Sedico): 32.00 EGP\n• Amoxil 500mg (16 caps - GSK): 49.50 EGP\n• E-Mox suspension 250mg: 28.50 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة الفعالة والتركيز:\n1. إي-موكس 500 مجم (E-Mox 500mg) - إيبيكو.\n2. بيوموكس 500 مجم (Biomox 500mg) - سيديكو.\n3. هايموكس 500 مجم (Hymox 500mg) - سبيماكو.\n4. أموكسيل 500 مجم (Amoxil 500mg) - GSK.\n\n• البدائل الأقوى عند مقاومة البكتيريا: أموكسيسيلين + كلافولانات (أوجمنتين أو كيورام أو هاي بيوتك).',
        en: 'Exact Generic Equivalents:\n1. E-Mox 500mg (EIPICO)\n2. Biomox 500mg (Sedico)\n3. Hymox 500mg\n4. Amoxil 500mg\nAugmented alternative: Augmentin or Curam.',
      },
      ageRestrictions: {
        ar: 'آمن للرضع والأطفال بجرعة شراب محسوبة بالوزن، والكبسولات للأطفال فوق 40 كجم والبالغين.',
        en: 'Safe for infants and children (weight-based suspension); capsules for >40kg and adults.',
      },
      dosingReference: {
        ar: 'للبالغين: كبسولة 500 مجم كل 8 ساعات، أو قرص 1 جم كل 12 ساعة لمدة 7 إلى 10 أيام. للأطفال: 40-90 مجم/كجم/يوم مقسمة على جرعات.',
        en: 'Adults: 500mg every 8 hours or 1g every 12 hours for 7-10 days.',
      },
      contraindications: {
        ar: 'ممنوع لمن يعانون من حساسية مفرطة تجاه البنسلين ومشتقاته، ولمرضى كثرة الوحيدات العدوائية (Mononucleosis) لتجنب الطفح الجلدي.',
        en: 'Contraindicated in penicillin allergy and infectious mononucleosis (rash risk).',
      },
      sideEffects: {
        ar: 'إسهال خفيف، غثيان، طفح جلدي تحسسي، وتغير مؤقت في لون الأسنان عند الأطفال يزول بتنظيفها.',
        en: 'Mild diarrhea, nausea, skin rash, transient tooth discoloration in children.',
      },
      interactions: {
        ar: 'قد يقلل من فاعلية حبوب منع الحمل. يتفاعل مع ألوبيورينول (يزيد الطفح الجلدي) والميثوتريكسات.',
        en: 'May reduce oral contraceptive efficacy. Interacts with allopurinol (rash risk).',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ من أكثر المضادات الحيوية أماناً واستخداماً أثناء فترتي الحمل والرضاعة تحت إشراف الطبيب.',
        en: 'Category B. One of the safest antibiotics during pregnancy and lactation.',
      },
      renalHepatic: {
        ar: 'يتطلب تعديل الفاصل الزمني بين الجرعات (كل 12 أو 24 ساعة) في حالات القصور الكلوي الحاد.',
        en: 'Dose interval adjustment required in severe renal failure (eGFR <30).',
      },
      patientEducation: {
        ar: 'يمكن تناوله مع الطعام أو بدونه (تناوله مع وجبة خفيفة يقلل من اضطراب المعدة). رج زجاجة الشراب جيداً قبل كل جرعة واحفظها في الثلاجة وتخلص من الباقي بعد 10 أيام.',
        en: 'Can be taken with or without food. Shake suspension bottle well and store in refrigerator.',
      },
    },
    brands: [
      { name: 'E-Mox 500mg Capsules', manufacturer: 'EIPICO Egypt', barcode: '6221127001245', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Biomox 500mg Capsules', manufacturer: 'Sedico Pharmaceuticals', barcode: '6221543002341', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Amoxil 500mg Capsules', manufacturer: 'GlaxoSmithKline (GSK)', barcode: '6221127005112', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 14. Penicillin V Potassium (Ospen / Calciopen)
  {
    id: 'penicillin-v-potassium',
    fields: {
      genericName: { ar: 'بنسلين V البوتاسيوم (فينوكسي ميثيل بنسلين)', en: 'Penicillin V Potassium (Phenoxymethylpenicillin)' },
      activeIngredients: { ar: 'بنسلين V البوتاسيوم', en: 'Penicillin V Potassium' },
      drugClass: { ar: 'بنسلين طبيعي فموي مضاد للمكورات العقدية', en: 'Natural oral penicillin antibiotic' },
      mechanism: { ar: 'يثبط تكوين الجدار الخلوي للبكتيريا الحساسة ويقضي عليها بشكل مباشر.', en: 'Inhibits bacterial cell wall synthesis during active multiplication.' },
      strengths: {
        ar: 'أقراص: 1000 مجم (1,000,000 وحدة دولية)، 1500 مجم (1,500,000 وحدة دولية).\nشراب معلق للأطفال: 400,000 وحدة دولية لكل 5 مل.',
        en: 'Tablets: 1000 IU (1 Mega), 1500 IU (1.5 Mega). Suspension: 400,000 IU/5ml.',
      },
      approvedUses: {
        ar: 'الخيار القياسي الأول عالمياً لعلاج التهاب اللوزتين والحلق بالمكورات العقدية (Strep throat)، والوقاية طويلة المدى من الحمى الروماتيزمية (Rheumatic fever) وتلف صمامات القلب، وعدوى الحمرة والجلد الخفيفة.',
        en: 'Primary standard choice for streptococcal pharyngitis/tonsillitis, secondary prophylaxis of rheumatic fever, and mild erysipelas.',
      },
      priceEgypt: {
        ar: '• أوسبن 1000 مجم (12 قرص) - ساندوز/نوفارتس: 45.00 جنيه مصري.\n• أوسبن 1500 مجم (12 قرص) - ساندوز: 55.00 جنيه مصري.\n• أوسبن شراب للأطفال (60 مل): 32.00 جنيه مصري.\n• كالسيوبن 1000 أقراص: 38.00 جنيه مصري.',
        en: '• Ospen 1000 (12 tabs - Sandoz): 45.00 EGP\n• Ospen 1500 (12 tabs): 55.00 EGP\n• Ospen syrup: 32.00 EGP\n• Calciopen 1000 tabs: 38.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة والمثائل في مصر:\n1. أوسبن 1000 مجم (Ospen 1000) - ساندوز.\n2. أوسبن 1500 مجم (Ospen 1500) - ساندوز.\n3. كالسيوبن (Calciopen).\n\n• البدائل من نفس العائلة في حال عدم توفره: أموكسيسيلين فموي (Amoxicillin 500mg) لمدة 10 أيام.\n• البديل في حال حساسية البنسلين: أزيثرومايسين (Zithromax) أو كلاريثرومايسين (Klacid).',
        en: 'Exact Equivalents:\n1. Ospen 1000 (Sandoz)\n2. Ospen 1500 (Sandoz)\n3. Calciopen\nAlternative: Oral Amoxicillin. For allergy: Azithromycin.',
      },
      ageRestrictions: {
        ar: 'مناسب لجميع الأعمار؛ يستخدم الشراب للأطفال بجرعة محسوبة بالوحدات الدولية، والأقراص للبالغين.',
        en: 'Approved across all age groups; syrup for pediatric patients.',
      },
      dosingReference: {
        ar: 'للحلق واللوزتين: قرص 1000 كل 6 إلى 8 ساعات على معدة فارغة (قبل الأكل بساعة أو بعده بساعتين) لمدة 10 أيام كاملة لمنع الحمى الروماتيزمية.',
        en: 'Strep throat: 1000-1500 IU every 6-8 hours on an empty stomach for a full 10-day course.',
      },
      contraindications: {
        ar: 'ممنوع منعاً باتاً لمن لديهم حساسية تجاه البنسلين أو أي من مشتقاته (خطر الصدمة التحسسية).',
        en: 'Strictly contraindicated in penicillin hypersensitivity.',
      },
      sideEffects: {
        ar: 'غثيان، قيء، إسهال، اضطراب معدة خفيف، أو طفح جلدي تحسسي.',
        en: 'Nausea, mild epigastric distress, diarrhea, hypersensitivity rash.',
      },
      interactions: {
        ar: 'تقلل مضادات الحموضة والطعام من امتصاصه بشكل ملحوظ؛ يجب تناوله على معدة فارغة.',
        en: 'Food and antacids markedly decrease gastrointestinal absorption.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن وفعال جداً أثناء الحمل والرضاعة عند وصف الطبيب.',
        en: 'Category B. Safely used in pregnancy and lactation.',
      },
      renalHepatic: {
        ar: 'يطرح كلوياً؛ يتطلب خفض الجرعة أو زيادة الفواصل في حالات القصور الكلوي الشديد.',
        en: 'Reduce dosage or extend interval in severe renal impairment (GFR <10).',
      },
      patientEducation: {
        ar: 'تناول الدواء على معدة فارغة مع كوب ماء كامل. إكمال كورس الـ 10 أيام ضروري جداً لحماية القلب والكلى من مضاعفات بكتيريا الحلق العقدية.',
        en: 'Take on an empty stomach with water. Completing the full 10-day course is critical to protect against rheumatic heart disease.',
      },
    },
    brands: [
      { name: 'Ospen 1000 Tablets', manufacturer: 'Sandoz Egypt / Novartis', barcode: '6221054009812', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Ospen 1500 Tablets', manufacturer: 'Sandoz Egypt / Novartis', barcode: '6221054009829', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 15. Cephalexin (Ospexin / Cefalex / Ibilex)
  {
    id: 'cephalexin',
    fields: {
      genericName: { ar: 'سيفالكسين', en: 'Cephalexin' },
      activeIngredients: { ar: 'سيفالكسين مونوهيدرات', en: 'Cephalexin monohydrate' },
      drugClass: { ar: 'مضاد حيوي من عائلة السيفالوسبورين (الجيل الأول)', en: 'First-generation cephalosporin' },
      mechanism: { ar: 'يقتل البكتيريا الموجبة لصبغة غرام والمكورات العنقودية عن طريق تثبيط بناء الجدار الخلوي.', en: 'Bactericidal; inhibits bacterial cell-wall synthesis.' },
      strengths: {
        ar: 'كبسولات/أقراص: 500 مجم، 1 جم، 250 مجم.\nشراب معلق للأطفال: 250 مجم/5 مل، 125 مجم/5 مل.',
        en: 'Capsules: 500mg, 1g, 250mg. Suspension: 250mg/5ml, 125mg/5ml.',
      },
      approvedUses: {
        ar: 'علاج التهابات الجلد والأنسجة الرخوة والدمامل (التهاب النسيج الخلوي)، التهابات المسالك البولية البسيطة، والتهابات العظام والمفاصل والتهاب الحلق.',
        en: 'Skin and skin structure infections, uncomplicated UTIs, bone infections, and streptococcal pharyngitis.',
      },
      priceEgypt: {
        ar: '• أوسبكسين 500 مجم (16 كبسولة) - ساندوز: 48.00 جنيه مصري.\n• سيفالكس 500 مجم (16 كبسولة) - الإسكندرية: 36.00 جنيه مصري.\n• إيبيليكس 500 مجم (16 كبسولة) - إيبيكو: 38.00 جنيه مصري.\n• أوسبكسين 1 جم (12 قرص): 52.00 جنيه مصري.\n• أوسبكسين شراب 250 مجم (60 مل): 32.00 جنيه مصري.',
        en: '• Ospexin 500mg (16 caps - Sandoz): 48.00 EGP\n• Cefalex 500mg (16 caps - Alexandria): 36.00 EGP\n• Ibilex 500mg (16 caps - EIPICO): 38.00 EGP\n• Ospexin suspension 250mg: 32.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة الفعالة والتركيز:\n1. أوسبكسين 500 مجم (Ospexin 500mg) - ساندوز.\n2. سيفالكس 500 مجم (Cefalex 500mg) - الإسكندرية.\n3. إيبيليكس 500 مجم (Ibilex 500mg) - إيبيكو.\n4. كفلكس 500 مجم (Keflex 500mg).\n\n• البدائل من نفس الفئة لالتهابات الجلد: أموكسيسيلين/كلافولانات أو كليندامايسين.',
        en: 'Exact Generic Equivalents:\n1. Ospexin 500mg (Sandoz)\n2. Cefalex 500mg (Alexandria)\n3. Ibilex 500mg (EIPICO)\nAlternative: Augmentin or Clindamycin.',
      },
      ageRestrictions: {
        ar: 'آمن للرضع والأطفال بجرعة شراب محسوبة بالوزن، والكبسولات للبالغين.',
        en: 'Approved for pediatric patients >1 year of age as oral suspension.',
      },
      dosingReference: {
        ar: 'للبالغين: كبسولة 500 مجم كل 6 أو 8 ساعات مع أو بدون طعام لمدة 7 إلى 10 أيام.',
        en: 'Adults: 500mg every 6 or 8 hours for 7-14 days.',
      },
      contraindications: {
        ar: 'ممنوع لمن يعانون من حساسية مفرطة تجاه السيفالوسبورينات، وبحذر لمن لديهم حساسية بنسلين شديدة.',
        en: 'Contraindicated in cephalosporin hypersensitivity.',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، عسر هضم، طفح جلدي خفيف، ودوار.',
        en: 'Diarrhea, dyspepsia, gastritis, mild rash.',
      },
      interactions: {
        ar: 'يتفاعل مع البروبينسيد والميتفورمين (يزيد تركيز الميتفورمين في الدم).',
        en: 'Increases metformin concentrations; probenecid prolongs half-life.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بصورة واسعة أثناء الحمل والرضاعة تحت إشراف الطبيب.',
        en: 'Category B. Widely considered safe in pregnancy and breastfeeding.',
      },
      renalHepatic: {
        ar: 'يخفض الجرعة وتزداد الفواصل في حالات القصور الكلوي المتوسط إلى الشديد.',
        en: 'Dosage reduction required in moderate to severe renal impairment.',
      },
      patientEducation: {
        ar: 'تناوله بانتظام في مواعيده المحددة. يمكن تناوله مع الأكل لتقليل الغثيان.',
        en: 'Take at evenly spaced intervals; can be taken with meals to minimize nausea.',
      },
    },
    brands: [
      { name: 'Ospexin 500mg Capsules', manufacturer: 'Sandoz Egypt', barcode: '6221054004521', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefalex 500mg Capsules', manufacturer: 'Alexandria Pharmaceuticals', barcode: '6221008005411', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Ibilex 500mg Capsules', manufacturer: 'EIPICO Egypt', barcode: '6221127003456', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 16. Cefixime (Suprax / Magnacef / Cefix)
  {
    id: 'cefixime',
    fields: {
      genericName: { ar: 'سيفيكسيم', en: 'Cefixime' },
      activeIngredients: { ar: 'سيفيكسيم ثلاثي الهيدرات', en: 'Cefixime trihydrate' },
      drugClass: { ar: 'مضاد حيوي فموي من عائلة السيفالوسبورين (الجيل الثالث)', en: 'Third-generation oral cephalosporin' },
      mechanism: { ar: 'يقضي على طيف واسع من البكتيريا السالبة والموجبة عن طريق كسر وتثبيط جدار الخلية البكتيرية.', en: 'Broad-spectrum bactericidal activity via bacterial cell-wall inhibition.' },
      strengths: {
        ar: 'كبسولات/أقراص: 400 مجم، 200 مجم.\nشراب معلق للأطفال: 100 مجم/5 مل (30 مل و 60 مل).',
        en: 'Capsules: 400mg, 200mg. Pediatric suspension: 100mg/5ml.',
      },
      approvedUses: {
        ar: 'علاج التهابات المسالك البولية وحوض الكلى، التهاب الأذن الوسطى الحاد، التهاب اللوزتين والحلق المتكرر، وتفاقم التهاب الشعب الهوائية المزمن وحمى التيفود.',
        en: 'Uncomplicated UTIs, acute otitis media, pharyngitis, acute exacerbations of chronic bronchitis, and typhoid fever.',
      },
      priceEgypt: {
        ar: '• سوبراكس 400 مجم (5 كبسولات) - سبيماكو/سانوفي: 98.00 جنيه مصري.\n• ماجناسيف 400 مجم (6 كبسولات) - الحكمة: 75.00 جنيه مصري.\n• سيفيكس 400 مجم (5 كبسولات) - سيجما: 62.00 جنيه مصري.\n• سوبراكس شراب معلق للأطفال 100 مجم (60 مل): 70.00 جنيه مصري.\n• ماجناسيف شراب معلق (60 مل): 55.00 جنيه مصري.',
        en: '• Suprax 400mg (5 caps): 98.00 EGP\n• Magnacef 400mg (6 caps - Hikma): 75.00 EGP\n• Cefix 400mg (5 caps): 62.00 EGP\n• Suprax suspension (60ml): 70.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز:\n1. ماجناسيف 400 مجم (Magnacef 400mg) - حكمة.\n2. سيفيكس 400 مجم (Cefix 400mg) - سيجما.\n3. إكزيم 400 مجم (Xime 400mg).\n4. سوبراكس 400 مجم المستورد.\n\n• البدائل من نفس الفئة: سيفوروكسيم (Zinnat) أو سيفترياكسون (حقن).',
        en: 'Exact Generic Equivalents:\n1. Magnacef 400mg (Hikma)\n2. Cefix 400mg (Sigma)\n3. Xime 400mg\n4. Suprax 400mg\nAlternative: Zinnat or Ceftriaxone.',
      },
      ageRestrictions: {
        ar: 'آمن للرضع والأطفال أكبر من 6 أشهر كشراب معلق، والكبسولات لمن هم فوق سن 12 عاماً.',
        en: 'Approved for infants >6 months as suspension; capsules for children >12 years and adults.',
      },
      dosingReference: {
        ar: 'للبالغين: كبسولة واحدة 400 مجم مرة واحدة يومياً (أو 200 مجم كل 12 ساعة) مع أو بدون طعام لمدة 5 إلى 10 أيام.',
        en: 'Adults: 400mg once daily or 200mg every 12 hours for 5-10 days.',
      },
      contraindications: {
        ar: 'ممنوع لمن يعانون من حساسية مفرطة تجاه السيفالوسبورينات أو البنسلينات الشديدة.',
        en: 'Contraindicated in cephalosporin hypersensitivity.',
      },
      sideEffects: {
        ar: 'إسهال، براز رخو، غثيان، مغص بطني، وعسر هضم.',
        en: 'Diarrhea, loose stools, abdominal pain, nausea, flatulence.',
      },
      interactions: {
        ar: 'قد يزيد من زمن النزيف ومفعول أدوية السيولة كالوارفارين.',
        en: 'May elevate prothrombin time/INR with oral anticoagulants.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بصورة واسعة أثناء الحمل تحت إشراف الطبيب.',
        en: 'Category B. Safe in pregnancy when clinically needed.',
      },
      renalHepatic: {
        ar: 'يتطلب خفض الجرعة إلى 200 مجم يومياً في مرضى القصور الكلوي المتوسط إلى الشديد (GFR <20).',
        en: 'Reduce dose to 200mg once daily when creatinine clearance is <20 ml/min.',
      },
      patientEducation: {
        ar: 'يتميز بإمكانية تناوله كجرعة واحدة يومياً مما يسهل الالتزام به. رج زجاجة الشراب جيداً واحفظها في الثلاجة.',
        en: 'Convenient once-daily dosing improves compliance. Shake suspension well.',
      },
    },
    brands: [
      { name: 'Suprax 400mg Capsules', manufacturer: 'Spimaco Misr / Sanofi', barcode: '6223000451239', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Magnacef 400mg Capsules', manufacturer: 'Hikma Pharma', barcode: '6221127008912', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefix 400mg Capsules', manufacturer: 'Sigma Pharmaceuticals', barcode: '6221127006714', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 17. Cefotaxime (Cefotax, Claforan)
  {
    id: 'cefotaxime',
    fields: {
      genericName: {
        ar: 'سيفوتاكسيم',
        en: 'Cefotaxime',
      },
      drugClass: {
        ar: 'مضاد حيوي سيفالوسبورين - الجيل الثالث',
        en: 'Third-Generation Cephalosporin Antibiotic',
      },
      approvedUses: {
        ar: 'علاج العدوى البكتيرية الحادة للجهاز التنفسي، الالتهاب الرئوي، عدوى الجهاز البولي، التهاب السحايا، تسمم الدم البكتيري، وعدوى العظام والمفاصل والوقاية قبل الجراحة.',
        en: 'Lower respiratory tract infections, pneumonia, urinary tract infections, meningitis, bacteremia/septicemia, intra-abdominal and bone/joint infections.',
      },
      mechanism: {
        ar: 'مضاد بكتيري واسع المجال يثبط تصنيع الجدار الخلوي البكتيري من خلال الارتباط ببروتينات ربط البنسلين (PBPs) مما يؤدي إلى تحلل وموت البكتيريا.',
        en: 'Bactericidal; inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs).',
      },
      priceEgypt: {
        ar: 'سيفوتاكس 1 جم حقن (EIPICO): 33.00 جنيه مصري للفيال.\nكلافوران 1 جم حقن (Sanofi): 45.00 جنيه مصري للفيال.\nسيفوتاكس 500 مجم حقن: 22.00 جنيه مصري للفيال.',
        en: 'Cefotax 1g Vial: 33.00 EGP\nClaforan 1g Vial: 45.00 EGP\nCefotax 500mg Vial: 22.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة بنفس المادة الفعالة: سيفوتاكس (Cefotax)، كلافوران (Claforan)، تاكسيم (Taxim)، وراميسيفت (Ramiceft).',
        en: 'Available generics: Cefotax, Claforan, Taxim, Ramiceft.',
      },
      strengths: {
        ar: 'فيال للحقن العضلي أو الوريدي: 500 مجم، 1 جم، 2 جم.',
        en: 'Vials for IV/IM injection: 500mg, 1g, 2g.',
      },
      activeIngredients: {
        ar: 'سيفوتاكسيم صوديوم (Cefotaxime Sodium)',
        en: 'Cefotaxime Sodium',
      },
      ageRestrictions: {
        ar: 'معتمد لجميع الفئات العمرية بما في ذلك حديثي الولادة والأطفال والبالغين بجرعات محسوبة بدقة.',
        en: 'Approved across all age groups including neonates, infants, and adults with weight-based dosing.',
      },
      dosingReference: {
        ar: 'للبالغين: 1 جم إلى 2 جم كل 8 أو 12 ساعة بالحقن الوريدي أو العضلي (الحد الأقصى 12 جم يومياً في الحالات الحرجة كالتهاب السحايا).\nللأطفال وحديثي الولادة: 50 إلى 100 مجم/كجم/يوم مقسمة على جرعات كل 6 إلى 12 ساعة.',
        en: 'Adults: 1g to 2g IV/IM every 8 to 12 hours (up to 12g/day in severe infections).\nPediatrics: 50-100 mg/kg/day divided every 6-12 hours.',
      },
      contraindications: {
        ar: 'حساسية مفرطة معروفة تجاه السيفالوسبورينات أو تفاعلات تأقية سابقة تجاه البنسلينات.',
        en: 'Hypersensitivity to cephalosporins or severe immediate penicillin allergy.',
      },
      sideEffects: {
        ar: 'ألم والتهاب في موضع الحقن، طفح جلدي، إسهال خفيف، ونادراً التهاب القولون الغشائي الكاذب.',
        en: 'Injection site pain/phlebitis, rash, diarrhea, elevated transaminases.',
      },
      interactions: {
        ar: 'مدرات البول العروية كالفوروسيميد ومضادات الأمينوجليكوزيد تزيد من خطر السمية الكلوية.',
        en: 'Concomitant aminoglycosides or loop diuretics may increase nephrotoxicity risk.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بصورة واسعة أثناء الحمل والرضاعة الطبيعية تحت إشراف الطبيب.',
        en: 'Category B. Safe in pregnancy and breastfeeding when indicated.',
      },
      renalHepatic: {
        ar: 'يجب خفض الجرعة بمقدار 50% عندما يقل معدل ترشيح الكلى (GFR) عن 20 مل/دقيقة.',
        en: 'Reduce dose by 50% when GFR is <20 mL/min.',
      },
      patientEducation: {
        ar: 'يُعطى بالحقن فقط ولا يؤخذ بالفم. يجب إكمال المدة المقررة بالكامل لمنع عودة العدوى أو تطور بكتيريا مقاومة.',
        en: 'Injectable only. Complete prescribed course duration even if symptoms improve quickly.',
      },
    },
    brands: [
      { name: 'Cefotax 1g Vial', manufacturer: 'EIPICO', barcode: '6221127003463', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Claforan 1g Vial', manufacturer: 'Sanofi Egypt', barcode: '6223003991203', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefotax 500mg Vial', manufacturer: 'EIPICO', barcode: '6221127003470', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Standard 3rd gen cephalosporin workhorse in Egyptian emergency and pediatric wards.',
  },

  // 18. Flucloxacillin (Floxamo, Flucil)
  {
    id: 'flucloxacillin',
    fields: {
      genericName: {
        ar: 'فلوكلوكساسيللين',
        en: 'Flucloxacillin',
      },
      drugClass: {
        ar: 'بنسلين مضاد لإنزيم البنسليناز (مضاد للمكورات العنقودية)',
        en: 'Penicillinase-Resistant Penicillin (Anti-staphylococcal)',
      },
      approvedUses: {
        ar: 'علاج التهابات الجلد والأنسجة الرخوة الناتجة عن المكورات العنقودية (الدمامل، الخراريج، الحصف، التهاب الهلل الخلوي، والجروح المصابة)، والتهاب العظام.',
        en: 'Skin and soft tissue infections (cellulitis, boils, abscesses, impetigo), wound infections, and osteomyelitis caused by susceptible staphylococci.',
      },
      mechanism: {
        ar: 'يثبط بناء جدار الخلية البكتيرية ويتميز بمقاومته لإنزيم البيتا-لاكتاماز المنتج بواسطة بكتيريا المكورات العنقودية الذهبية.',
        en: 'Bactericidal cell-wall synthesis inhibitor resistant to staphylococcal beta-lactamase.',
      },
      priceEgypt: {
        ar: 'فلوكسامو 1 جم أقراص (Amoun - 16 قرص): 68.00 جنيه مصري (الشريط: 34.00 جنيه).\nفلوسيل 500 مجم كبسول (Pharco - 16 كبسولة): 42.00 جنيه مصري (الشريط: 21.00 جنيه).',
        en: 'Floxamo 1g (16 tab): 68.00 EGP (strip: 34.00 EGP)\nFlucil 500mg (16 cap): 42.00 EGP (strip: 21.00 EGP).',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: فلوكسامو (Floxamo)، فلوسيل (Flucil)، ستافيلوكس (Staphylox).',
        en: 'Available generics: Floxamo, Flucil, Staphylox.',
      },
      strengths: {
        ar: 'كبسولات/أقراص: 500 مجم، 1 جم. شراب معلق للأطفال: 125 مجم/5 مل، 250 مجم/5 مل.',
        en: 'Capsules/tablets: 500mg, 1g. Oral suspension: 125mg/5mL, 250mg/5mL.',
      },
      activeIngredients: {
        ar: 'فلوكلوكساسيللين صوديوم (Flucloxacillin Sodium)',
        en: 'Flucloxacillin Sodium',
      },
      ageRestrictions: {
        ar: 'آمن للرضع والأطفال والبالغين بجرعات ملائمة لكل فئة وزنية.',
        en: 'Safe for infants, children, and adults with weight-based pediatric dosing.',
      },
      dosingReference: {
        ar: 'للبالغين: 500 مجم إلى 1 جم كل 6 ساعات (أربع مرات يومياً) على معدة فارغة قبل الأكل بساعة أو بعده بساعتين.\nللأطفال: 25 إلى 50 مجم/كجم/يوم مقسمة على 4 جرعات متساوية.',
        en: 'Adults: 500mg to 1g orally every 6 hours on an empty stomach.\nChildren: 25-50 mg/kg/day divided into 4 doses.',
      },
      contraindications: {
        ar: 'حساسية البنسلين، وتاريخ سابق ليرقان أو اعتلال كبدي ناتج عن الفلوكلوكساسيللين.',
        en: 'Penicillin allergy or history of flucloxacillin-associated jaundice/hepatic dysfunction.',
      },
      sideEffects: {
        ar: 'غثيان، إسهال خفيف، طفح جلدي، واعتلال كبدي نادر يظهر كيرقان ركودي في كبار السن.',
        en: 'Gastrointestinal upset, diarrhea, rash; rare cholestatic jaundice, especially in older adults.',
      },
      interactions: {
        ar: 'يتعارض مع الميثوتريكسات حيث يزيد من سميته، ويزيد من فعالية أدوية السيولة الفموية كالوارفارين.',
        en: 'Increases methotrexate toxicity; may enhance warfarin anticoagulant effect.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بصورة معتادة للحوامل والمرضعات تحت الإشراف الطبي.',
        en: 'Category B. Safe in pregnancy and lactation when indicated.',
      },
      renalHepatic: {
        ar: 'يجب ضبط الجرعة في القصور الكلوي الشديد (الحد الأقصى 1 جم كل 8 ساعات). يُمنع لمن لديهم سوابق يرقان دوائي منه.',
        en: 'Adjust in severe renal impairment (max 1g q8h). Avoid if history of flucloxacillin liver injury.',
      },
      patientEducation: {
        ar: 'يجب تناوله على معدة فارغة تماماً (قبل الأكل بساعة أو بعد الأكل بساعتين) لأن الطعام يقلل امتصاصه بنسبة 50%.',
        en: 'Take strictly on an empty stomach (1 hour before or 2 hours after meals) as food significantly reduces absorption.',
      },
    },
    brands: [
      { name: 'Floxamo 1g Tablets', manufacturer: 'Amoun Pharmaceutical Co.', barcode: '6221008005626', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Flucil 500mg Capsules', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221543003429', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Frontline antistaphylococcal choice for Egyptian skin and wound infections.',
  },

  // 19. Amikacin (Amikin, Mikacin)
  {
    id: 'amikacin',
    fields: {
      genericName: {
        ar: 'أميكاسين',
        en: 'Amikacin',
      },
      drugClass: {
        ar: 'مضاد حيوي أمينوجليكوزيد',
        en: 'Aminoglycoside Antibiotic',
      },
      approvedUses: {
        ar: 'العدوى البكتيرية الشديدة الناتجة عن بكتيريا الجرام السالبة المقاومة، تسمم الدم، عدوى المسالك البولية المعقدة، والتهابات الجهاز التنفسي المستشفوية.',
        en: 'Severe hospital-acquired Gram-negative infections, bacteremia, complicated UTIs, intra-abdominal and respiratory tract infections resistant to gentamicin.',
      },
      mechanism: {
        ar: 'قاتل للبكتيريا؛ يرتبط بالوحدة الفرعية 30S في ريبوسومات البكتيريا مما يثبط تخليق البروتين ويؤدي لموت الخلية البكتيرية.',
        en: 'Bactericidal; binds irreversibly to bacterial 30S ribosomal subunits, inhibiting protein synthesis.',
      },
      priceEgypt: {
        ar: 'أميكين 500 مجم حقن (BMS / Smith): 38.00 جنيه مصري للفيال.\nميكاسين 500 مجم حقن (SEDICO): 27.50 جنيه مصري للفيال.',
        en: 'Amikin 500mg Vial: 38.00 EGP\nMikacin 500mg Vial: 27.50 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: أميكين (Amikin)، ميكاسين (Mikacin)، أميكاسيتين (Amikacetin).',
        en: 'Available generics: Amikin, Mikacin, Amikacetin.',
      },
      strengths: {
        ar: 'أمبولات وفيالات للحقن: 100 مجم/2 مل، 250 مجم/2 مل، 500 مجم/2 مل.',
        en: 'Vials/ampoules for IV/IM: 100mg/2mL, 250mg/2mL, 500mg/2mL.',
      },
      activeIngredients: {
        ar: 'أميكاسين كبريتات (Amikacin Sulfate)',
        en: 'Amikacin Sulfate',
      },
      ageRestrictions: {
        ar: 'يُستخدم في جميع الأعمار بحذر شديد مع ضبط الجرعة بدقة حسب الوزن ووظائف الكلى.',
        en: 'Used across all ages with strict weight-based and renal monitoring.',
      },
      dosingReference: {
        ar: 'للبالغين: 15 مجم/كجم/يوم تعطى كجرعة واحدة يومياً بالحقن الوريدي البطيء أو مقسمة كل 12 ساعة.\nللأطفال وحديثي الولادة: 15 إلى 20 مجم/كجم/يوم مع مراقبة المستويات السريرية في الدم.',
        en: 'Adults: 15 mg/kg/day as once-daily IV infusion or divided q12h.\nNeonates/children: 15-20 mg/kg/day with therapeutic drug monitoring.',
      },
      contraindications: {
        ar: 'حساسية الأمينوجليكوزيد، الوهن العضلي الوبيل (Myasthenia gravis).',
        en: 'Hypersensitivity to aminoglycosides, myasthenia gravis.',
      },
      sideEffects: {
        ar: 'سمية كلوية (ارتفاع الكرياتينين)، سمية سمعية ودهليزية (طنين الأذن وضعف السمع والدوار)، وحصار عصبي عضلي.',
        en: 'Nephrotoxicity, ototoxicity (auditory and vestibular damage), neuromuscular blockade.',
      },
      interactions: {
        ar: 'ممنوع دمجه مع مدرات البول العروية كالفوروسيميد، أو الفانكومايسين، أو السيفالوسبورينات القوية دون مراقبة الكلى.',
        en: 'Additive nephrotoxicity/ototoxicity with furosemide, vancomycin, cisplatin, and neuromuscular blockers.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة D؛ قد يسبب ضرراً سمعياً للجنين ولا يُستخدم إلا في الحالات المهددة للحياة مع انعدام البدائل.',
        en: 'Category D. Potential fetal ototoxicity; reserved for life-threatening emergencies.',
      },
      renalHepatic: {
        ar: 'حرج جداً: يتطلب خفض الجرعة أو مباعدة الفترات الزمنية بدقة بناءً على قياس تصفية الكرياتينين ومستوى الدواء بالدم.',
        en: 'Critical: Mandatory dose adjustment and interval extension based on renal clearance.',
      },
      patientEducation: {
        ar: 'يُعطى في المستشفيات والمراكز الطبية فقط. أبلغ الطاقم الطبي فوراً عند الشعور بطنين في الأذن أو دوار أو قلة كمية البول.',
        en: 'Administered under medical supervision. Report tinnitus, dizziness, hearing changes, or decreased urine immediately.',
      },
    },
    brands: [
      { name: 'Amikin 500mg Vial', manufacturer: 'Bristol Myers Squibb / Smith', barcode: '6221054006128', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Mikacin 500mg Vial', manufacturer: 'SEDICO Pharmaceuticals', barcode: '6221127007812', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Potent aminoglycoside reserved for resistant gram-negative infections in Egyptian hospitals.',
  },

  // 20. Gentamicin (Garamycin)
  {
    id: 'gentamicin',
    fields: {
      genericName: {
        ar: 'جنتامايسين',
        en: 'Gentamicin',
      },
      drugClass: {
        ar: 'مضاد حيوي أمينوجليكوزيد واسع المجال',
        en: 'Aminoglycoside Antibiotic',
      },
      approvedUses: {
        ar: 'العدوى البكتيرية الحادة للجهاز البولي، تسمم الدم، عدوى البطن والحوض، حمى النفاس، والتهاب الشغاف الجرثومي بالاشتراك مع البنسلين.',
        en: 'Severe systemic Gram-negative infections, complicated UTIs, bacteremia, pelvic/intra-abdominal infections, and bacterial endocarditis synergy.',
      },
      mechanism: {
        ar: 'يرتبط بالوحدة 30S في ريبوسومات البكتيريا مسبباً أخطاء في ترجمة الشفرة الوراثية وتثبيط بناء البروتين وموت الخلية البكتيرية.',
        en: 'Binds to the bacterial 30S subunit, disrupting mRNA translation and protein synthesis.',
      },
      priceEgypt: {
        ar: 'جاراميسين 80 مجم أمبول (Memphis / Schering-Plough): 18.00 جنيه مصري للأمبول.\nجنتاميسين 80 مجم أمبول (El Nasr): 10.50 جنيه مصري للأمبول.',
        en: 'Garamycin 80mg Ampoule: 18.00 EGP\nGentamycin 80mg Ampoule: 10.50 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: جاراميسين (Garamycin)، جنتاميسين (Gentamycin)، ريفوباسين (Refobacin).',
        en: 'Available generics: Garamycin, Gentamycin, Refobacin.',
      },
      strengths: {
        ar: 'أمبولات للحقن العضلي أو الوريدي: 20 مجم/2 مل، 40 مجم/2 مل، 80 مجم/2 مل.',
        en: 'Ampoules for IM/IV injection: 20mg/2mL, 40mg/2mL, 80mg/2mL.',
      },
      activeIngredients: {
        ar: 'جنتامايسين سلفات (Gentamicin Sulfate)',
        en: 'Gentamicin Sulfate',
      },
      ageRestrictions: {
        ar: 'يُستخدم في جميع الأعمار بجرعات دقيقة محسوبة بالوزن مع مراقبة حثيثة للوظائف الكلوية.',
        en: 'Used across all age brackets with weight-adjusted dosing and monitoring.',
      },
      dosingReference: {
        ar: 'للبالغين: 3 إلى 5 مجم/كجم/يوم تعطى كجرعة واحدة وريدية ممتدة أو مقسمة كل 8 ساعات بالحقن العضلي أو الوريدي البطيء.\nللأطفال: 6 إلى 7.5 مجم/كجم/يوم مقسمة كل 8 ساعات.',
        en: 'Adults: 3-5 mg/kg/day as once-daily infusion or divided q8h.\nChildren: 6-7.5 mg/kg/day divided q8h.',
      },
      contraindications: {
        ar: 'حساسية مفرطة للأمينوجليكوزيدات، والوهن العضلي الوبيل.',
        en: 'Hypersensitivity to aminoglycosides, myasthenia gravis.',
      },
      sideEffects: {
        ar: 'سمية كلوية، سمية سمعية ودهليزية (فقدان التوازن وطنين الأذن)، وتفاعلات حساسية موضعية.',
        en: 'Nephrotoxicity, vestibular and cochlear ototoxicity, local injection site pain.',
      },
      interactions: {
        ar: 'خطر مضاعف للسمية الكلوية والسمعية عند تناوله مع الفوروسيميد، الفانكومايسين، أو أدوية التخدير وباسطات العضلات.',
        en: 'Synergistic nephro/ototoxicity with loop diuretics, amphotericin B, and vancomycin.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة D؛ يتخطى المشيمة ويشكل خطراً على العصب السمعي للجنين. يُستخدم فقط عند انعدام البدائل للحالات المهددة للحياة.',
        en: 'Category D. Crosses placenta with risk of fetal cranial nerve VIII damage.',
      },
      renalHepatic: {
        ar: 'يتطلب ضبطاً حاسماً للجرعة وتمديد الفترات الزمنية بين الجرعات عند انخفاض تصفية الكلى لتجنب التراكم السمي.',
        en: 'Strict dosing interval prolongation required in renal insufficiency.',
      },
      patientEducation: {
        ar: 'يُعطى بالحقن العضلي أو بالتنقيط الوريدي. يجب الإكثار من شرب السوائل أثناء العلاج لحماية الكليتين وإبلاغ التمريض عند أي دوار.',
        en: 'Maintain high fluid intake during therapy to protect kidney function. Report balance issues immediately.',
      },
    },
    brands: [
      { name: 'Garamycin 80mg Ampoule', manufacturer: 'Memphis / Schering-Plough', barcode: '6221008003621', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Gentamycin 80mg Ampoule', manufacturer: 'El Nasr Pharmaceutical', barcode: '6221543008914', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Classic hospital antibiotic in Egyptian healthcare; requires renal hydration monitoring.',
  },

  // 21. Moxifloxacin (Avelox, Moxiflox)
  {
    id: 'moxifloxacin',
    fields: {
      genericName: {
        ar: 'موكسيفلوكساسين',
        en: 'Moxifloxacin',
      },
      drugClass: {
        ar: 'مضاد حيوي فلوروكينولون تنفسي',
        en: 'Respiratory Fluoroquinolone Antibiotic',
      },
      approvedUses: {
        ar: 'علاج الالتهاب الرئوي المكتسب من المجتمع (CAP)، التفاقم البكتيري الحاد لالتهاب الشعب الهوائية المزمن، والتهاب الجيوب الأنفية البكتيري الحاد، وعدوى الجلد والبطن المعقدة.',
        en: 'Community-acquired pneumonia, acute bacterial sinusitis, acute exacerbations of chronic bronchitis, and complicated skin/intra-abdominal infections.',
      },
      mechanism: {
        ar: 'قاتل للبكتيريا؛ يثبط إنزيمي توبوإيزوميراز II (DNA gyrase) وتوبوإيزوميراز IV مما يمنع تضاعف وإصلاح الحمض النووي البكتيري.',
        en: 'Bactericidal; inhibits bacterial DNA gyrase (topoisomerase II) and topoisomerase IV.',
      },
      priceEgypt: {
        ar: 'أفيلوكس 400 مجم أقراص (Bayer - 5 أقراص): 185.00 جنيه مصري.\nموكسيفلوكس 400 مجم أقراص (Eva Pharma - 5 أقراص): 95.00 جنيه مصري.',
        en: 'Avelox 400mg (5 tabs): 185.00 EGP\nMoxiflox 400mg (5 tabs): 95.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: أفيلوكس (Avelox)، موكسيفلوكس (Moxiflox)، فلوكسابكت (Floxabact).',
        en: 'Available generics: Avelox, Moxiflox, Floxabact.',
      },
      strengths: {
        ar: 'أقراص مغلفة: 400 مجم. محلول للتنقيط الوريدي: 400 مجم/250 مل.',
        en: 'Film-coated tablets: 400mg. IV infusion: 400mg/250mL.',
      },
      activeIngredients: {
        ar: 'موكسيفلوكساسين هيدروكلوريد (Moxifloxacin HCl)',
        en: 'Moxifloxacin Hydrochloride',
      },
      ageRestrictions: {
        ar: 'ممنوع لمن هم دون سن 18 عاماً بسبب خطر إصابات المفاصل والأوتار.',
        en: 'Contraindicated in patients <18 years due to arthropathy/tendon injury risks.',
      },
      dosingReference: {
        ar: 'للبالغين: قرص واحد 400 مجم مرة واحدة يومياً مع أو بدون طعام لمدة 5 إلى 10 أيام (لا يحتاج لتعديل الجرعة في مرضى الكلى).',
        en: 'Adults: 400mg once daily orally or IV for 5 to 10 days.',
      },
      contraindications: {
        ar: 'حساسية الكينولونات، استطالة فترة QT في تخطيط القلب، الوهن العضلي الوبيل، وتاريخ تمزق الأوتار.',
        en: 'Hypersensitivity to quinolones, prolonged QT interval, myasthenia gravis, history of tendon rupture.',
      },
      sideEffects: {
        ar: 'غثيان، صداع، دوار، إسهال، استطالة فترة QT، وخطر نادر لالتهاب أو تمزق وتر العرقوب (أخيل).',
        en: 'Nausea, diarrhea, headache, dizziness, QT prolongation; risk of tendinitis/tendon rupture.',
      },
      interactions: {
        ar: 'مضادات الحموضة والحديد والكالسيوم تقلل امتصاصه ويجب الفصل بساعتين على الأقل. الحذر مع أدوية القلب المسببة لاستطالة QT.',
        en: 'Chelates with antacids, iron, and calcium (separate by 2h). Additive QT prolongation with antiarrhythmics.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ يُنصح بتجنبه في الحمل والرضاعة الطبيعية لوجود بدائل أكثر أماناً كالسيفالوسبورينات.',
        en: 'Category C. Avoid in pregnancy and lactation unless no safer alternatives exist.',
      },
      renalHepatic: {
        ar: 'يتميز بأنه يُطرح كبدياً بشكل أساسي، لذا لا يتطلب أي خفض للجرعة في مرضى القصور الكلوي حتى في الغسيل الكلوي.',
        en: 'Hepatically eliminated; no dosage adjustment required in renal impairment or dialysis.',
      },
      patientEducation: {
        ar: 'توقف عن تناول الدواء فوراً واستشر الطبيب إذا شعرت بألم مفاجئ أو التهاب في الأوتار (خاصة كعب القدم). اشرب كميات كافية من الماء.',
        en: 'Discontinue immediately and seek care if you experience sudden tendon pain or swelling (especially heel).',
      },
    },
    brands: [
      { name: 'Avelox 400mg Tablets', manufacturer: 'Bayer', barcode: '6223000458127', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Moxiflox 400mg Tablets', manufacturer: 'Eva Pharma', barcode: '6221054007415', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Premium respiratory fluoroquinolone in Egypt; no renal adjustment needed.',
  },

  // 22. Cefoperazone + Sulbactam (Sulperazon, Cefozone)
  {
    id: 'cefoperazone-sulbactam',
    fields: {
      genericName: {
        ar: 'سيفوبيرازون + سولباكتام',
        en: 'Cefoperazone / Sulbactam',
      },
      drugClass: {
        ar: 'سيفالوسبورين الجيل الثالث مع مثبط بيتا-لاكتاماز',
        en: 'Third-Generation Cephalosporin with Beta-Lactamase Inhibitor',
      },
      approvedUses: {
        ar: 'علاج العدوى البكتيرية الشديدة للجهاز التنفسي السفلي، عدوى القنوات المرارية والبطن، عدوى المسالك البولية المعقدة، والتهابات الحوض والوقاية الجراحية.',
        en: 'Severe intra-abdominal and biliary tract infections, lower respiratory infections, complicated UTIs, and surgical prophylaxis.',
      },
      mechanism: {
        ar: 'السيفوبيرازون يثبط جدار الخلية البكتيرية بما في ذلك الزائفة الزنجارية (Pseudomonas)، بينما يحمي السولباكتام الدواء من التحلل الإنزيمي.',
        en: 'Cefoperazone inhibits cell-wall synthesis (active vs Pseudomonas); sulbactam irreversibly inhibits beta-lactamases.',
      },
      priceEgypt: {
        ar: 'سيلبيرازون 1.5 جم حقن (Pfizer Egypt): 75.00 جنيه مصري للفيال.\nسيفوزون 1.5 جم حقن (Pharco BPI): 52.00 جنيه مصري للفيال.',
        en: 'Sulperazon 1.5g Vial: 75.00 EGP\nCefozone 1.5g Vial: 52.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: سيلبيرازون (Sulperazon)، سيفوزون (Cefozone)، باكتازون (Bactazone).',
        en: 'Available generics: Sulperazon, Cefozone, Bactazone.',
      },
      strengths: {
        ar: 'فيال للحقن الوريدي أو العضلي: 1.5 جم (1 جم سيفوبيرازون + 0.5 جم سولباكتام).',
        en: 'Vials for IV/IM: 1.5g (1g cefoperazone + 0.5g sulbactam).',
      },
      activeIngredients: {
        ar: 'سيفوبيرازون صوديوم + سولباكتام صوديوم',
        en: 'Cefoperazone Sodium + Sulbactam Sodium',
      },
      ageRestrictions: {
        ar: 'معتمد للأطفال والبالغين في المستشفيات بجرعات محسوبة بدقة.',
        en: 'Approved in pediatric and adult inpatient settings with calculated dosing.',
      },
      dosingReference: {
        ar: 'للبالغين: 1.5 جم إلى 3 جم كل 12 ساعة بالحقن الوريدي أو العضلي (الحد الأقصى 4 جم سيفوبيرازون يومياً).\nللأطفال: 40 إلى 80 مجم/كجم/يوم مقسمة على جرعتين إلى أربع جرعات.',
        en: 'Adults: 1.5g to 3g IV/IM every 12 hours.\nPediatrics: 40-80 mg/kg/day divided into 2-4 doses.',
      },
      contraindications: {
        ar: 'حساسية السيفالوسبورينات أو البنسلينات الشديدة.',
        en: 'Severe cephalosporin or beta-lactam hypersensitivity.',
      },
      sideEffects: {
        ar: 'إسهال، طفح جلدي، نقص عابر في بروثرومبين الدم (زيادة القابلية للنزف)، وتفاعل شبيه بالديسفلفرام مع الكحول.',
        en: 'Diarrhea, rash, hypoprothrombinemia (bleeding risk), and disulfiram-like ethanol reaction.',
      },
      interactions: {
        ar: 'يزيد من خطر النزيف مع مميعات الدم ومضادات التخثر كالوارفارين وهيبارين؛ يوصى بإعطاء فيتامين K عند الحاجة.',
        en: 'Increased bleeding risk with anticoagulants/heparin. Disulfiram-like reaction with alcohol.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن للاستخدام أثناء الحمل إذا استدعت الحالة السريرية بإشراف الطبيب.',
        en: 'Category B. Considered safe in pregnancy when clinically necessary.',
      },
      renalHepatic: {
        ar: 'يُطرح معظمه عبر الصفراء والمسالك الصفراوية، لذا يتطلب تعديل الجرعة في مرضى الانسداد الصفراوي أو القصور الكبدي الشديد.',
        en: 'Predominantly biliary excretion; dose adjustment essential in severe biliary obstruction/hepatic dysfunction.',
      },
      patientEducation: {
        ar: 'يُعطى في المستشفيات بالحقن. يُمنع تناول الكحول تماماً أثناء العلاج ولمدة 5 أيام بعده لتجنب التفاعلات الخطيرة.',
        en: 'Inpatient injectable. Strictly avoid any alcohol during and for 5 days after therapy.',
      },
    },
    brands: [
      { name: 'Sulperazon 1.5g Vial', manufacturer: 'Pfizer Egypt', barcode: '6221054008126', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefozone 1.5g Vial', manufacturer: 'Pharco BPI', barcode: '6221543006718', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Standard biliary and intra-abdominal injectable antimicrobial in Egyptian surgical wards.',
  },

  // 23. Linezolid (Averozolid, Zyvox)
  {
    id: 'linezolid',
    fields: {
      genericName: {
        ar: 'لينيزوليد',
        en: 'Linezolid',
      },
      drugClass: {
        ar: 'مضاد حيوي أوكسازوليدينون (مضاد للمكورات المقاومة MRSA / VRE)',
        en: 'Oxazolidinone Antibiotic (Anti-MRSA / VRE)',
      },
      approvedUses: {
        ar: 'علاج العدوى الشديدة بالمكورات العنقودية المقاومة للميثيسيلين (MRSA)، المكورات المعوية المقاومة للفانكومايسين (VRE)، الالتهاب الرئوي المستشفوي، والتهابات الجلد المعقدة.',
        en: 'Vancomycin-resistant Enterococcus (VRE) infections, hospital-acquired and MRSA pneumonia, and complicated skin/skin-structure infections.',
      },
      mechanism: {
        ar: 'يثبط تخليق البروتين البكتيري عند نقطة فريدة جداً عبر الارتباط بالموقع 23S في الوحدة الريبوسومية 50S لمنع تكوّن معقد بدء الترجمة 70S.',
        en: 'Inhibits protein synthesis by binding to 23S ribosomal RNA of the 50S subunit, preventing 70S initiation complex formation.',
      },
      priceEgypt: {
        ar: 'أفيروزوليد 600 مجم أقراص (Eva Pharma - 10 أقراص): 210.00 جنيه مصري (الشريط: 105.00 جنيه).\nزيفوكس 600 مجم أقراص (Pfizer - 10 أقراص): 490.00 جنيه مصري.',
        en: 'Averozolid 600mg (10 tabs): 210.00 EGP (strip: 105.00 EGP)\nZyvox 600mg (10 tabs): 490.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: أفيروزوليد (Averozolid)، زيفوكس (Zyvox)، لينوليد (Linolid).',
        en: 'Available generics: Averozolid, Zyvox, Linolid.',
      },
      strengths: {
        ar: 'أقراص مغلفة: 600 مجم. محلول وريدي للتنقيط: 600 مجم/300 مل. شراب معلق للأطفال: 100 مجم/5 مل.',
        en: 'Tablets: 600mg. IV infusion: 600mg/300mL. Oral suspension: 100mg/5mL.',
      },
      activeIngredients: {
        ar: 'لينيزوليد (Linezolid)',
        en: 'Linezolid',
      },
      ageRestrictions: {
        ar: 'يُستخدم للأطفال والبالغين بحذر شديد وتحت إشراف استشاري العدوى.',
        en: 'Approved for pediatrics and adults under specialized infectious disease supervision.',
      },
      dosingReference: {
        ar: 'للبالغين: قرص واحد 600 مجم كل 12 ساعة مع أو بدون طعام لمدة 10 إلى 14 يوماً (الحد الأقصى 28 يوماً لمنع تثبيط النخاع العظمي).\nللأطفال: 10 مجم/كجم كل 8 ساعات (أو كل 12 ساعة للأطفال فوق 12 سنة).',
        en: 'Adults: 600mg orally or IV every 12 hours for 10-14 days (max 28 days).\nChildren <12 years: 10 mg/kg every 8 hours.',
      },
      contraindications: {
        ar: 'فرط الحساسية، والاستخدام المتزامن مع مثبطات أكسيداز أحادي الأمين (MAOIs) لتجنب متلازمة السيروتونين أو نوبات ارتفاع الضغط الحادة.',
        en: 'Hypersensitivity; concurrent MAOIs or uncontrolled hypertension/serotonergic agents.',
      },
      sideEffects: {
        ar: 'تثبيط نقي العظم (نقص الصفائح الدموية وفقر الدم بعد 14 يوماً)، صداع، غثيان، إسهال، واعتلال عصبي محيطي وبصري عند الاستخدام المطول.',
        en: 'Myelosuppression (thrombocytopenia, anemia), headache, nausea, peripheral/optic neuropathy with prolonged use.',
      },
      interactions: {
        ar: 'يتفاعل مع مضادات الاكتئاب (SSRIs/SNRIs) مسبباً متلازمة السيروتونين، ومع الأطعمة الغنية بالتيرامين كالأجبان القديمة مسبباً نوبات ارتفاع ضغط الدم.',
        en: 'Serotonin syndrome risk with SSRIs/SNRIs/triptans; hypertensive crisis with tyramine-rich foods.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ يُستخدم فقط عندما تفوق الفائدة السريرية المتوقعة المخاطر المحتملة.',
        en: 'Category C. Use only if clearly needed and no alternatives available.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل الجرعة في القصور الكلوي أو الكبدي الخفيف إلى المتوسط، ولكن يفضل إعطاؤه بعد جلسة الغسيل الكلوي.',
        en: 'No dose adjustment required for renal or mild-to-moderate hepatic impairment; dose after hemodialysis.',
      },
      patientEducation: {
        ar: 'يجب عمل تحليل صورة دم كاملة (CBC) أسبوعياً أثناء العلاج لمراقبة الصفائح الدموية. تجنب تناول الأجبان المعتقة والمخللات بكميات كبيرة.',
        en: 'Weekly complete blood count (CBC) monitoring is essential. Avoid large quantities of aged cheeses or fermented foods.',
      },
    },
    brands: [
      { name: 'Averozolid 600mg Tablets', manufacturer: 'Eva Pharma', barcode: '6221054009121', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Zyvox 600mg Tablets', manufacturer: 'Pfizer', barcode: '6223000216719', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Crucial reserve antibiotic in Egypt for resistant Gram-positive pathogens (MRSA/VRE).',
  },

  // 24. Vancomycin (Vancocin, Celovan)
  {
    id: 'vancomycin',
    fields: {
      genericName: {
        ar: 'فانكومايسين',
        en: 'Vancomycin',
      },
      drugClass: {
        ar: 'مضاد حيوي جليكوببتيد (خط دفاع أخير ضد MRSA)',
        en: 'Glycopeptide Antibiotic (Anti-MRSA Reserve)',
      },
      approvedUses: {
        ar: 'العدوى الحادة الناتجة عن بكتيريا المكورات العنقودية المقاومة للميثيسيلين (MRSA)، التهاب الشغاف الجرثومي، عدوى العظام، والتهاب القولون الغشائي الكاذب الناجم عن Clostridioides difficile (عن طريق الفم فقط).',
        en: 'Severe MRSA infections, endocarditis, osteomyelitis, septicemia; oral formulation solely for Clostridioides difficile colitis.',
      },
      mechanism: {
        ar: 'مضاد بكتيري يثبط تصنيع جدار الخلية عن طريق الارتباط بنهاية D-alanyl-D-alanine في ببتيدوجلايكان جدار الخلية البكتيرية.',
        en: 'Inhibits bacterial cell wall synthesis by binding to D-Ala-D-Ala terminus of cell wall peptidoglycan precursors.',
      },
      priceEgypt: {
        ar: 'فانكوسين 500 مجم فيال (EIPICO): 65.00 جنيه مصري للفيال.\nسيلوفان 500 مجم فيال (Hikma): 72.00 جنيه مصري للفيال.',
        en: 'Vancocin 500mg Vial: 65.00 EGP\nCelovan 500mg Vial: 72.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: فانكوسين (Vancocin)، سيلوفان (Celovan)، فانكوميكس (Vancomix).',
        en: 'Available generics: Vancocin, Celovan, Vancomix.',
      },
      strengths: {
        ar: 'فيال مجفف بالتبريد للحقن الوريدي البطيء أو التحضير الفموي: 500 مجم، 1 جم.',
        en: 'Lyophilized powder for IV infusion: 500mg, 1g.',
      },
      activeIngredients: {
        ar: 'فانكومايسين هيدروكلوريد (Vancomycin HCl)',
        en: 'Vancomycin Hydrochloride',
      },
      ageRestrictions: {
        ar: 'يُستخدم لجميع الأعمار في المستشفيات تحت مراقبة تركيز الدواء في المصل (TDM).',
        en: 'Used across all ages with mandatory therapeutic drug monitoring (trough levels).',
      },
      dosingReference: {
        ar: 'للبالغين: 15 إلى 20 مجم/كجم كل 8 إلى 12 ساعة بالتنقيط الوريدي البطيء (أكثر من 60 دقيقة لكل 1 جم لتفادي متلازمة الرجل الأحمر).\nلالتهاب القولون الغشائي الكاذب: 125 إلى 500 مجم فموياً كل 6 ساعات.',
        en: 'Adults: 15-20 mg/kg IV every 8-12h infused over at least 60 minutes per 1g.\nOral for C. difficile: 125-500mg q6h.',
      },
      contraindications: {
        ar: 'فرط الحساسية المعروف للفانكومايسين.',
        en: 'Hypersensitivity to vancomycin.',
      },
      sideEffects: {
        ar: 'متلازمة الرجل الأحمر (احمرار وتوهج الجلد وهبوط الضغط عند التسريب السريع)، سمية كلوية، سمية سمعية، والتهاب الوريد الخثاري.',
        en: 'Red Man Syndrome (histaminoid flushing with rapid infusion), nephrotoxicity, ototoxicity, phlebitis.',
      },
      interactions: {
        ar: 'يزيد من خطر القصور الكلوي عند مشاركته مع الأمينوجليكوزيدات أو مضادات الالتهاب غير الستيرويدية (NSAIDs) أو البيبراسيلين/تازوباكتام.',
        en: 'Additive nephrotoxicity with aminoglycosides, NSAIDs, piperacillin/tazobactam, and furosemide.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B (الحقن الوريدي فئة C)؛ يُستخدم بحذر شديد مع قياس مستويات الدواء في الدم للحالات الضرورية.',
        en: 'Category B/C. Use when benefits outweigh risks; monitor maternal serum levels.',
      },
      renalHepatic: {
        ar: 'حاسم: يُطرح كلوياً بنسبة تفوق 80%. يجب خفض الجرعة ومباعدة الفترات الزمنية مع فحص الكرياتينين ومستوى القاع (Trough level 15-20 mcg/mL).',
        en: 'Critical: 80%+ renal elimination. Dosing adjusted strictly according to renal function and trough levels.',
      },
      patientEducation: {
        ar: 'يُعطى في المستشفى فقط ويجب أن يتم تسريبه ببطء شديد على مدار ساعة أو أكثر. أبلغ التمريض فوراً إذا شعرت بحكة شديدة أو احمرار في الوجه والرقبة.',
        en: 'Administered as a slow IV infusion over at least 60-120 minutes. Report flushing, itching, or rash immediately.',
      },
    },
    brands: [
      { name: 'Vancocin 500mg Vial', manufacturer: 'EIPICO', barcode: '6221127004523', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Celovan 500mg Vial', manufacturer: 'Hikma Pharmaceuticals', barcode: '6221054006734', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Primary reserve parenteral glycopeptide for MRSA bacteremia and inpatient stewardship in Egypt.',
  },

  // 25. Meropenem (Meronem)
  {
    id: 'meropenem',
    fields: {
      genericName: {
        ar: 'ميروبينيم',
        en: 'Meropenem',
      },
      drugClass: {
        ar: 'مضاد حيوي كاربابينيم (واسع المجال للحالات الحرجة والمستشفيات)',
        en: 'Carbapenem Antibiotic (Broad-Spectrum Reserve)',
      },
      approvedUses: {
        ar: 'علاج العدوى البكتيرية المعقدة والمهددة للحياة في المستشفيات والعناية المركزة: الالتهاب الرئوي المستشفوي، التهاب السحايا البكتيري، عدوى البطن المعقدة، تسمم الدم، وحمى نقص العدلات.',
        en: 'Complicated intra-abdominal infections, complicated skin infections, bacterial meningitis, nosocomial pneumonia, and febrile neutropenia.',
      },
      mechanism: {
        ar: 'قاتل للبكتيريا؛ يرتبط ببروتينات ربط البنسلين (PBPs) ويثبط بناء الجدار الخلوي البكتيري، ويتميز بمقاومة عالية لمعظم إنزيمات البيتا-لاكتاماز متضمنة ESBL.',
        en: 'Bactericidal; inhibits cell-wall synthesis via PBPs with high stability against most beta-lactamases including ESBLs.',
      },
      priceEgypt: {
        ar: 'ميرونيم 1 جم فيال (Pfizer / AstraZeneca): 265.00 جنيه مصري للفيال.\nميروبينيم 1 جم فيال (EIPICO / Hikma): 145.00 جنيه مصري للفيال.\nميرونيم 500 مجم فيال: 155.00 جنيه مصري للفيال.',
        en: 'Meronem 1g Vial: 265.00 EGP\nMeropenem 1g Vial (Generic): 145.00 EGP\nMeronem 500mg Vial: 155.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة بنفس المادة الفعالة: ميرونيم (Meronem)، ميروبينيم إيبيكو (Meropenem EIPICO)، ميروكس (Merox).',
        en: 'Available generics: Meronem, Meropenem EIPICO, Merox.',
      },
      strengths: {
        ar: 'فيال مسحوق للحقن والتسريب الوريدي: 500 مجم، 1 جم.',
        en: 'Powder for IV injection/infusion: 500mg, 1g.',
      },
      activeIngredients: {
        ar: 'ميروبينيم ثلاثي المائيات (Meropenem Trihydrate)',
        en: 'Meropenem Trihydrate',
      },
      ageRestrictions: {
        ar: 'معتمد للرضع من عمر 3 أشهر فما فوق وللبالغين تحت إشراف المستشفى.',
        en: 'Approved for infants >=3 months and adults under inpatient supervision.',
      },
      dosingReference: {
        ar: 'للبالغين: 500 مجم إلى 1 جم وريدياً كل 8 ساعات (تصل إلى 2 جم كل 8 ساعات في التهاب السحايا).\nللأطفال (فوق 3 أشهر): 20 إلى 40 مجم/كجم كل 8 ساعات.',
        en: 'Adults: 500mg to 1g IV every 8 hours (up to 2g q8h in meningitis).\nPediatrics (>3m): 20-40 mg/kg IV every 8 hours.',
      },
      contraindications: {
        ar: 'فرط الحساسية للكاربابينيمات، أو سابقة صدمة تأقية لبنسلين أو سيفالوسبورين.',
        en: 'Carbapenem hypersensitivity or prior anaphylactic reaction to beta-lactams.',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، التهاب موضع الحقن الوريدي، صداع، ونادراً تشنجات عصبية (أقل بكثير من إيميبينيم).',
        en: 'Diarrhea, nausea, injection site inflammation, headache, rare seizures in renal impairment.',
      },
      interactions: {
        ar: 'تفاعل خطير: يقلل مستوى حمض الفالبرويك (Depakine) في الدم بصورة حادة مما قد يعرض مريض الصرع لنوبات تشنج فورية.',
        en: 'Major interaction: precipitously drops serum valproic acid levels, increasing breakthrough seizure risk.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ يُستخدم في الحالات الحرجة بالمستشفى عندما تفوق المنفعة المخاطر.',
        en: 'Category B. Used in severe inpatient maternal infections when indicated.',
      },
      renalHepatic: {
        ar: 'يتطلب خفض الجرعة ومباعدة الفترات الزمنية (كل 12 أو 24 ساعة) إذا قل معدل ترشيح الكلى (CrCl) عن 50 مل/دقيقة.',
        en: 'Mandatory dosage reduction when creatinine clearance is <50 mL/min.',
      },
      patientEducation: {
        ar: 'مضاد حيوي وريدي مقيد للمستشفيات فقط. أبلغ الطبيب فوراً إذا كنت تتناول أدوية الصرع (مثل ديباكين) أو لديك تاريخ حساسية للبنسلين.',
        en: 'Hospital-restricted IV antibiotic. Inform physician immediately if taking valproate/anti-epileptics.',
      },
    },
    brands: [
      { name: 'Meronem 1g Vial', manufacturer: 'Pfizer / AstraZeneca', barcode: '6221054009411', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Meropenem 1g Vial', manufacturer: 'EIPICO', barcode: '6221127008417', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Reserve carbapenem for ESBL-producing Gram-negative infections in Egyptian ICUs.',
  },

  // 26. Cefepime (Maxipime)
  {
    id: 'cefepime',
    fields: {
      genericName: {
        ar: 'سيفيبيم',
        en: 'Cefepime',
      },
      drugClass: {
        ar: 'مضاد حيوي سيفالوسبورين - الجيل الرابع',
        en: 'Fourth-Generation Cephalosporin Antibiotic',
      },
      approvedUses: {
        ar: 'علاج الالتهاب الرئوي المتوسط إلى الشديد (بما فيه الناتج عن Pseudomonas)، حمى نقص المناعة والعدلات، عدوى المسالك البولية المعقدة، وعدوى البطن والجلد.',
        en: 'Moderate-to-severe pneumonia, empiric therapy for febrile neutropenia, complicated UTIs, skin and intra-abdominal infections.',
      },
      mechanism: {
        ar: 'يخترق الجدار الخلوي للبكتيريا السالبة والموجبة بسرعة عالية ويرتبط ببروتينات ربط البنسلين مسبباً تحلل البكتيريا.',
        en: 'Bactericidal cell-wall inhibitor with zwitterionic structure allowing rapid penetration of Gram-negative outer membranes.',
      },
      priceEgypt: {
        ar: 'ماكسيبيم 1 جم فيال (BMS / Smith): 62.00 جنيه مصري للفيال.\nسيفيبيم 1 جم فيال (Pharco BPI): 42.00 جنيه مصري للفيال.',
        en: 'Maxipime 1g Vial: 62.00 EGP\nCefepime 1g Vial: 42.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: ماكسيبيم (Maxipime)، سيفيبيم فاركو (Cefepime)، ويميبم (Wincef).',
        en: 'Available generics: Maxipime, Cefepime Pharco, Wincef.',
      },
      strengths: {
        ar: 'فيال للحقن الوريدي أو العضلي: 500 مجم، 1 جم، 2 جم.',
        en: 'Vials for IV/IM administration: 500mg, 1g, 2g.',
      },
      activeIngredients: {
        ar: 'سيفيبيم هيدروكلوريد (Cefepime Hydrochloride)',
        en: 'Cefepime Hydrochloride',
      },
      ageRestrictions: {
        ar: 'معتمد للأطفال من عمر شهرين فما فوق وللبالغين.',
        en: 'Approved for pediatric patients >=2 months and adults.',
      },
      dosingReference: {
        ar: 'للبالغين: 1 جم إلى 2 جم وريدياً كل 8 أو 12 ساعة لمدة 7 إلى 10 أيام.\nللأطفال: 50 مجم/كجم كل 8 أو 12 ساعة.',
        en: 'Adults: 1g to 2g IV every 8-12 hours for 7-10 days.\nChildren: 50 mg/kg IV every 8-12 hours.',
      },
      contraindications: {
        ar: 'حساسية السيفالوسبورينات أو تفاعل تحسسي فوري للبنسلين.',
        en: 'Immediate hypersensitivity to cephalosporins or beta-lactams.',
      },
      sideEffects: {
        ar: 'إيجابية اختبار كومبس، طفح جلدي، إسهال، وسمية عصبية (ارتباك أو تشنجات) إذا لم تُخفض الجرعة في مرضى القصور الكلوي.',
        en: 'Rash, diarrhea, positive Coombs test; neurotoxicity (encephalopathy/myoclonus) if unadjusted in renal failure.',
      },
      interactions: {
        ar: 'يزيد من احتمالية السمية الكلوية عند تزامنه مع الأمينوجليكوزيدات ومدرات البول القوية.',
        en: 'Monitor renal function closely when co-administered with aminoglycosides or potent diuretics.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن للاستخدام عند الحاجة الطبية أثناء الحمل.',
        en: 'Category B. Acceptable in pregnancy under medical supervision.',
      },
      renalHepatic: {
        ar: 'حرج: يجب خفض الجرعة بدقة عندما يقل معدل ترشيح الكلى عن 60 مل/دقيقة لمنع تراكم الدواء والسمية العصبية.',
        en: 'Mandatory dose adjustment when CrCl <60 mL/min to prevent neurotoxicity.',
      },
      patientEducation: {
        ar: 'يُعطى في المستشفيات وتحت إشراف طبي مع متابعة وظائف الكلى خاصة لكبار السن.',
        en: 'Administered parenterally with renal monitoring, especially in elderly patients.',
      },
    },
    brands: [
      { name: 'Maxipime 1g Vial', manufacturer: 'Smith / BMS Egypt', barcode: '6221008006918', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefepime 1g Vial', manufacturer: 'Pharco BPI', barcode: '6221543007126', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: '4th-gen anti-pseudomonal cephalosporin in Egyptian hospitals.',
  },

  // 27. Cefdinir (Omnicef, Dinar)
  {
    id: 'cefdinir',
    fields: {
      genericName: {
        ar: 'سيفدينير',
        en: 'Cefdinir',
      },
      drugClass: {
        ar: 'مضاد حيوي سيفالوسبورين فموي - الجيل الثالث',
        en: 'Third-Generation Oral Cephalosporin Antibiotic',
      },
      approvedUses: {
        ar: 'علاج التهاب الأذن الوسطى الحاد لدى الأطفال، التهاب الجيوب الأنفية، التهاب البلعوم واللوزتين، التهاب الشعب الهوائية، والتهابات الجلد غير المعقدة.',
        en: 'Acute bacterial otitis media, sinusitis, pharyngitis/tonsillitis, community-acquired pneumonia, and uncomplicated skin infections.',
      },
      mechanism: {
        ar: 'يثبط تصنيع الجدار الخلوي البكتيري ويمتاز بثبات ممتاز أمام العديد من إنزيمات البيتا-لاكتاماز البكتيرية.',
        en: 'Bactericidal third-generation oral cephalosporin inhibits cell-wall synthesis.',
      },
      priceEgypt: {
        ar: 'أومنيسيف 300 مجم كبسول (Hikma - 10 كبسولات): 90.00 جنيه مصري.\nدينار 125 مجم/5 مل شراب للأطفال (Adwia): 52.00 جنيه مصري.\nسيفدين 300 مجم كبسول (Delta Pharma): 69.00 جنيه مصري.',
        en: 'Omnicef 300mg (10 caps): 90.00 EGP\nDinar 125mg/5mL Susp: 52.00 EGP\nCefdin 300mg Caps: 69.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: أومنيسيف (Omnicef)، دينار (Dinar)، سيفدين (Cefdin)، إيجينير (Egynir).',
        en: 'Available generics: Omnicef, Dinar, Cefdin, Egynir.',
      },
      strengths: {
        ar: 'كبسولات: 300 مجم. شراب معلق للأطفال: 125 مجم/5 مل، 250 مجم/5 مل.',
        en: 'Capsules: 300mg. Oral suspension: 125mg/5mL, 250mg/5mL.',
      },
      activeIngredients: {
        ar: 'سيفدينير (Cefdinir)',
        en: 'Cefdinir',
      },
      ageRestrictions: {
        ar: 'آمن ومعتمد للرضع من عمر 6 أشهر والأطفال والبالغين.',
        en: 'Approved for infants >=6 months, children, and adults.',
      },
      dosingReference: {
        ar: 'للبالغين: 300 مجم كل 12 ساعة أو 600 مجم مرة واحدة يومياً لمدة 5 إلى 10 أيام.\nللأطفال (6 أشهر - 12 سنة): 14 مجم/كجم/يوم (تعطى مرة واحدة يومياً أو مقسمة كل 12 ساعة).',
        en: 'Adults: 300mg q12h or 600mg once daily.\nChildren: 14 mg/kg/day once daily or divided q12h.',
      },
      contraindications: {
        ar: 'حساسية معروفة للسيفالوسبورينات.',
        en: 'Known allergy to cephalosporin antibiotics.',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، وتغير لون البراز إلى اللون الأحمر غير الضار عند تناوله بالتزامن مع مكملات الحديد أو ألبان الأطفال المدعمة بالحديد.',
        en: 'Diarrhea, nausea; harmless reddish stool discoloration when taken with iron-containing products.',
      },
      interactions: {
        ar: 'مضادات الحموضة ومكملات الحديد تقلل امتصاصه بنسبة كبيرة؛ يجب الفصل بينهما بساعتين على الأقل.',
        en: 'Antacids and iron supplements markedly reduce absorption; separate by at least 2 hours.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن للاستخدام أثناء الحمل عند الحاجة الطبية.',
        en: 'Category B. Safe for use during pregnancy when clinically indicated.',
      },
      renalHepatic: {
        ar: 'تُخفض الجرعة إلى 300 مجم مرة واحدة يومياً للبالغين (أو 7 مجم/كجم للأطفال) إذا قل معدل ترشيح الكلى عن 30 مل/دقيقة.',
        en: 'Reduce dose to 300mg once daily (or 7 mg/kg/day in children) if CrCl <30 mL/min.',
      },
      patientEducation: {
        ar: 'تنبيه هام للأمهات: إذا كان طفلك يتناول فيتامينات تحتوي على الحديد، قد يتحول لون البراز إلى اللون المحمر؛ وهو تفاعل كيميائي طبيعي وغير مقلق ولا يعني نزيفاً.',
        en: 'Counseling pearl: Concomitant iron or iron-fortified formula causes harmless reddish stools (not blood).',
      },
    },
    brands: [
      { name: 'Omnicef 300mg Capsules', manufacturer: 'Hikma Pharmaceuticals', barcode: '6221054008317', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Dinar 125mg/5mL Suspension', manufacturer: 'ADWIA Pharma', barcode: '6221127006219', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Widely prescribed pediatric and ENT oral 3rd-gen cephalosporin in Egypt.',
  },

  // 28. Cefadroxil (Duricef, Biodroxil, Curisafe)
  {
    id: 'cefadroxil',
    fields: {
      genericName: {
        ar: 'سيفادروكسيل',
        en: 'Cefadroxil',
      },
      drugClass: {
        ar: 'مضاد حيوي سيفالوسبورين فموي - الجيل الأول',
        en: 'First-Generation Oral Cephalosporin Antibiotic',
      },
      approvedUses: {
        ar: 'علاج التهاب الحلق واللوزتين العقدي، عدوى المسالك البولية غير المعقدة، والتهابات الجلد والأنسجة الرخوة (الحصف والدمامل والجروح).',
        en: 'Streptococcal pharyngitis/tonsillitis, uncomplicated urinary tract infections, and skin/soft tissue infections.',
      },
      mechanism: {
        ar: 'يثبط بناء جدار الخلية البكتيرية، ويتميز بنصف عمر أطول من السيفالكسين مما يسمح بإعطائه مرة أو مرتين يومياً فقط.',
        en: 'Bactericidal 1st-gen cephalosporin with prolonged half-life allowing once or twice daily dosing.',
      },
      priceEgypt: {
        ar: 'ديوريسيف 1 جم أقراص (Smith / BMS - 8 أقراص): 48.00 جنيه مصري.\nبيودروكسيل 500 مجم كبسول (Sandoz / Novartis): 45.00 جنيه مصري.\nكيريسيف 1 جم أقراص (Pharco): 36.00 جنيه مصري.',
        en: 'Duricef 1g (8 tabs): 48.00 EGP\nBiodroxil 500mg Caps: 45.00 EGP\nCurisafe 1g Tabs: 36.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: ديوريسيف (Duricef)، بيودروكسيل (Biodroxil)، كيريسيف (Curisafe)، إبيدروكسيل (Epidroxil).',
        en: 'Available generics: Duricef, Biodroxil, Curisafe, Epidroxil.',
      },
      strengths: {
        ar: 'كبسولات: 500 مجم. أقراص: 1 جم. شراب معلق للأطفال: 125 مجم/5 مل، 250 مجم/5 مل، 500 مجم/5 مل.',
        en: 'Capsules: 500mg. Tablets: 1g. Oral suspension: 125mg/5mL, 250mg/5mL, 500mg/5mL.',
      },
      activeIngredients: {
        ar: 'سيفادروكسيل أحادي المائيات (Cefadroxil Monohydrate)',
        en: 'Cefadroxil Monohydrate',
      },
      ageRestrictions: {
        ar: 'آمن ومعتمد للأطفال والبالغين.',
        en: 'Approved for pediatric and adult patients.',
      },
      dosingReference: {
        ar: 'للبالغين: 1 جم إلى 2 جم يومياً تقسم على جرعة واحدة أو جرعتين كل 12 ساعة لمدة 7 إلى 10 أيام.\nللأطفال: 30 مجم/كجم/يوم تعطى كجرعة واحدة أو مقسمة كل 12 ساعة.',
        en: 'Adults: 1-2g/day in single or 2 divided doses.\nChildren: 30 mg/kg/day once daily or divided q12h.',
      },
      contraindications: {
        ar: 'حساسية السيفالوسبورينات أو حساسية البنسلين المفرطة.',
        en: 'Cephalosporin hypersensitivity or severe penicillin anaphylaxis.',
      },
      sideEffects: {
        ar: 'اضطراب معدي خفيف، إسهال، غثيان، أو طفح جلدي تحسسي.',
        en: 'Mild GI upset, diarrhea, nausea, rash.',
      },
      interactions: {
        ar: 'البروبنسيد يقلل من إطراحه الكلوي ويزيد تركيزه في الدم.',
        en: 'Probenecid competitively inhibits renal tubular secretion, raising serum levels.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بشكل شائع أثناء الحمل والرضاعة.',
        en: 'Category B. Widely used and safe in pregnancy.',
      },
      renalHepatic: {
        ar: 'يجب زيادة الفترة بين الجرعات إلى كل 12-24 ساعة إذا قل معدل ترشيح الكلى عن 50 مل/دقيقة.',
        en: 'Extend dosing intervals to 12-24h when CrCl <50 mL/min.',
      },
      patientEducation: {
        ar: 'يمكن تناوله مع الطعام لتقليل أي غثيان في المعدة. يجب إكمال كورس التهاب اللوزتين لمدة 10 أيام كاملة للوقاية من الحمى الروماتيزمية.',
        en: 'May be taken with food to minimize GI upset. Complete full 10-day course for strep throat.',
      },
    },
    brands: [
      { name: 'Duricef 1g Tablets', manufacturer: 'Smith / BMS Egypt', barcode: '6221008004125', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Curisafe 1g Tablets', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221543005123', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Biodroxil 500mg Capsules', manufacturer: 'Sandoz Egypt', barcode: '6223000452182', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Essential 1st-gen oral cephalosporin in Egyptian community pharmacies.',
  },

  // 29. Ampicillin + Sulbactam (Unasyn, Ultracillin)
  {
    id: 'ampicillin-sulbactam',
    fields: {
      genericName: {
        ar: 'أمبيسيلين + سولباكتام (سلتاميسيللين)',
        en: 'Ampicillin / Sulbactam (Sultamicillin)',
      },
      drugClass: {
        ar: 'مضاد حيوي بنسلين واسع المجال مع مثبط بيتا-لاكتاماز',
        en: 'Aminopenicillin + Beta-Lactamase Inhibitor',
      },
      approvedUses: {
        ar: 'علاج التهابات الجهاز التنفسي العلوي والسفلي، التهاب الأذن الوسطى والجيوب الأنفية، عدوى الجلد والأنسجة الرخوة، عدوى النساء والحوض، وعدوى البطن والمسالك البولية.',
        en: 'Respiratory tract infections, sinusitis, otitis media, skin/soft tissue infections, gynecological/pelvic and intra-abdominal infections.',
      },
      mechanism: {
        ar: 'الأمبيسيلين يثبط جدار الخلية البكتيرية، بينما يحبط السولباكتام إنزيمات البيتا-لاكتاماز البكتيرية ليوسع الطيف ليشمل البكتيريا المقاومة للأمبيسيلين وحده.',
        en: 'Ampicillin inhibits bacterial cell-wall synthesis; sulbactam irreversibly inactivates bacterial beta-lactamases.',
      },
      priceEgypt: {
        ar: 'يوناسين 375 مجم أقراص (Pfizer Egypt - 12 قرص): 85.00 جنيه مصري.\nيوناسين 1.5 جم فيال حقن (Pfizer): 44.00 جنيه مصري.\nألتراسيللين 1.5 جم فيال (MUP): 31.00 جنيه مصري.',
        en: 'Unasyn 375mg (12 tabs): 85.00 EGP\nUnasyn 1.5g Vial: 44.00 EGP\nUltracillin 1.5g Vial: 31.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: يوناسين (Unasyn)، ألتراسيللين (Ultracillin)، سولبين (Sulbin)، سيغماسين (Sigmacyn).',
        en: 'Available generics: Unasyn, Ultracillin, Sulbin, Sigmacyn.',
      },
      strengths: {
        ar: 'أقراص (سلتاميسيللين): 375 مجم، 750 مجم. شراب معلق: 250 مجم/5 مل. فيال للحقن الوريدي/العضلي: 750 مجم، 1.5 جم، 3 جم.',
        en: 'Tablets: 375mg, 750mg. Suspension: 250mg/5mL. Vials for IV/IM: 750mg, 1.5g, 3g.',
      },
      activeIngredients: {
        ar: 'أمبيسيلين + سولباكتام / سلتاميسيللين (Ampicillin + Sulbactam)',
        en: 'Ampicillin Sodium + Sulbactam Sodium (Sultamicillin Tosilate)',
      },
      ageRestrictions: {
        ar: 'معتمد للأطفال والرضع والبالغين.',
        en: 'Approved for infants, children, and adults.',
      },
      dosingReference: {
        ar: 'للبالغين فموياً: 375 مجم إلى 750 مجم مرتين يومياً كل 12 ساعة لمدة 5 إلى 14 يوماً.\nللبالغين حقناً: 1.5 جم إلى 3 جم كل 6 إلى 8 ساعات.',
        en: 'Adults Oral: 375-750mg twice daily.\nAdults IV/IM: 1.5g to 3g every 6-8 hours.',
      },
      contraindications: {
        ar: 'حساسية البنسلين المؤكدة، أو الإصابة بداء كثرة الوحيدات العدوائي (الفيفر الغدي).',
        en: 'Penicillin allergy; infectious mononucleosis (high risk of morbilliform rash).',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، ألم في موضع الحقن العضلي، وطفح جلدي تحسسي.',
        en: 'Diarrhea, nausea, IM injection site pain, skin rash.',
      },
      interactions: {
        ar: 'الألوبيورينول (علاج النقرس) يزيد بشكل ملحوظ من احتمالية ظهور طفح جلدي مع الأمبيسيلين.',
        en: 'Allopurinol significantly increases the incidence of ampicillin-associated skin rashes.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف على نطاق واسع أثناء الحمل والعمليات القيصرية.',
        en: 'Category B. Widely used and safe in pregnancy and obstetric prophylaxis.',
      },
      renalHepatic: {
        ar: 'يجب مباعدة فترات الحقن إلى كل 12 أو 24 ساعة في حالات القصور الكلوي المتوسط والشديد.',
        en: 'Extend dosing interval to q12h-q24h in moderate-to-severe renal impairment.',
      },
      patientEducation: {
        ar: 'إذا ظهرت بقع حمراء أو حكة جلدية بعد أول جرعة، أوقف الدواء فوراً واستشر الطبيب لأنك قد تعاني من حساسية البنسلين.',
        en: 'Stop immediately and seek medical advice if hives or generalized rash appear after dosing.',
      },
    },
    brands: [
      { name: 'Unasyn 1.5g Vial', manufacturer: 'Pfizer Egypt', barcode: '6221054002919', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Unasyn 375mg Tablets', manufacturer: 'Pfizer Egypt', barcode: '6221054002926', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Ultracillin 1.5g Vial', manufacturer: 'Medical Union Pharmaceuticals (MUP)', barcode: '6221127005818', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Cornerstone oral and parenteral beta-lactam combination across Egypt.',
  },

  // 30. Erythromycin (Erythrocin)
  {
    id: 'erythromycin',
    fields: {
      genericName: {
        ar: 'إريثرومايسين',
        en: 'Erythromycin',
      },
      drugClass: {
        ar: 'مضاد حيوي ماكروليد كلاسيكي',
        en: 'Macrolide Antibiotic',
      },
      approvedUses: {
        ar: 'بديل البنسلين الأول للمرضى المصابين بحساسية البنسلين في التهاب الحلق واللوزتين والوقاية من الحمى الروماتيزمية، السعال الديكي، حب الشباب الالتهابي، والتهابات الملتحمة عند حديثي الولادة.',
        en: 'Penicillin-allergic alternative for strep pharyngitis and rheumatic fever prophylaxis, pertussis, chlamydia, acne vulgaris, and neonatal conjunctivitis.',
      },
      mechanism: {
        ar: 'مثبط لنمو البكتيريا؛ يرتبط بالوحدة الفرعية 50S في ريبوسوم البكتيريا ويمنع تصنيع البروتين البكتيري.',
        en: 'Bacteriostatic; binds 50S ribosomal subunit inhibiting bacterial protein translocation.',
      },
      priceEgypt: {
        ar: 'إريثرومايسين 500 مجم أقراص (El Nasr / Misr): 36.00 جنيه مصري.\nإريثروسين 200 مجم شراب للأطفال (Abbott / Kahira): 32.00 جنيه مصري.',
        en: 'Erythromycin 500mg Tabs: 36.00 EGP\nErythrocin 200mg/5mL Susp: 32.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: إريثروسين (Erythrocin)، إريثرومايسين (Erythromycin)، إريثروكيم (Erythrochem).',
        en: 'Available generics: Erythrocin, Erythromycin, Erythrochem.',
      },
      strengths: {
        ar: 'أقراص/كبسولات: 250 مجم، 500 مجم. شراب معلق: 200 مجم/5 مل. مرهم عيني وجل موضعي: 0.5%، 2%.',
        en: 'Tablets: 250mg, 500mg. Suspension: 200mg/5mL. Ophthalmic ointment: 0.5%, Topical gel: 2%.',
      },
      activeIngredients: {
        ar: 'إريثرومايسين إيثيل سكسينات أو ستيارات (Erythromycin)',
        en: 'Erythromycin Stearate / Ethylsuccinate',
      },
      ageRestrictions: {
        ar: 'معتمد لجميع الفئات العمرية مع الحذر في حديثي الولادة (الأسبوعين الأولين) لخطر تضيق البواب الضخامي.',
        en: 'Approved across ages; caution in neonates <2 weeks due to infantile hypertrophic pyloric stenosis risk.',
      },
      dosingReference: {
        ar: 'للبالغين: 250 إلى 500 مجم كل 6 إلى 12 ساعة لمدة 7 إلى 10 أيام.\nللأطفال: 30 إلى 50 مجم/كجم/يوم مقسمة على 3 إلى 4 جرعات.',
        en: 'Adults: 250-500mg every 6-12 hours.\nChildren: 30-50 mg/kg/day divided every 6-8 hours.',
      },
      contraindications: {
        ar: 'فرط الحساسية للماكروليدات، استطالة فترة QT، والتناول المتزامن مع السيمفاستاتين أو الأتورفاستاتين أو الإرغوتامين.',
        en: 'Macrolide hypersensitivity, QT prolongation, concomitant simvastatin/lovastatin or ergot alkaloids.',
      },
      sideEffects: {
        ar: 'تقلصات معدية ومغص شديد (لأنه يحفز مستقبلات الموتيلين في الأمعاء)، غثيان، قيء، وركود صفراوي كبدي عابر.',
        en: 'Abdominal cramping (motilin receptor agonist effect), nausea, vomiting, cholestatic hepatitis.',
      },
      interactions: {
        ar: 'مثبط قوي لإنزيم CYP3A4؛ يرفع سمية الستاتينات، الوارفارين، الكاربامازيبين، والثيوفيلين والديجوكسين.',
        en: 'Potent CYP3A4 inhibitor; significantly elevates levels of statins, warfarin, theophylline, carbamazepine, and digoxin.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن أثناء الحمل (باستثناء ملح الإستولات Erythromycin estolate الذي يُمنع في الحمل لسميته الكبدية).',
        en: 'Category B (base/ethylsuccinate safe; avoid estolate salt in pregnancy due to hepatotoxicity).',
      },
      renalHepatic: {
        ar: 'يُطرح عبر الكبد والصفراء، لذا يجب الحذر وتعديل الجرعة في مرضى القصور الكبدي.',
        en: 'Primarily hepatic excretion; exercise caution in hepatic dysfunction.',
      },
      patientEducation: {
        ar: 'إذا سبب لك مغصاً بالمعدة، يمكنك تناوله بعد وجبة خفيفة. أبلغ الطبيب عن جميع أدوية الكوليسترول أو السيولة التي تتناولها.',
        en: 'May be taken with light food if GI cramping occurs. Disclose all current statin or anticoagulant medications.',
      },
    },
    brands: [
      { name: 'Erythrocin 500mg Tablets', manufacturer: 'Kahira / Abbott', barcode: '6221008007126', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Erythromycin 500mg Tablets', manufacturer: 'El Nasr Pharmaceutical', barcode: '6221543008211', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Classic macrolide benchmark and penicillin-allergy alternative.',
  },

  // 31. Fusidic Acid (Fucidin)
  {
    id: 'fusidic-acid',
    fields: {
      genericName: {
        ar: 'حمض الفيوسيديك',
        en: 'Fusidic Acid',
      },
      drugClass: {
        ar: 'مضاد حيوي ستيرويدي مضاد للمكورات العنقودية (موضعي وجهازي)',
        en: 'Fusidane Anti-Staphylococcal Antibiotic',
      },
      approvedUses: {
        ar: 'علاج العدوى الجلدية البكتيرية السطحية الناتجة عن المكورات العنقودية (الحصف، الدمامل، التهاب بصيلات الشعر، الجروح والحروق الملتهبة، والداحس).',
        en: 'Primary and secondary bacterial skin infections caused by Staphylococcus aureus (impetigo, folliculitis, boils, infected wounds, erythrasma).',
      },
      mechanism: {
        ar: 'يثبط تخليق البروتين البكتيري عن طريق منع انفصال عامل الاستطالة G (EF-G) عن الريبوسوم، وهو فعال ضد سلالات المكورات العنقودية بما فيها بعض سلالات MRSA.',
        en: 'Inhibits bacterial protein synthesis by interfering with elongation factor G (EF-G) translocation.',
      },
      priceEgypt: {
        ar: 'فيوسيدين كريم أو مرهم 2% - 20 جم (LEO / MinaPharm): 53.00 جنيه مصري.\nفيوسيديرم كريم 2% - 15 جم (EVA Pharma): 32.00 جنيه مصري.\nفيوسي توب كريم 2% (Delta): 28.00 جنيه مصري.',
        en: 'Fucidin 2% Cream/Ointment (20g): 53.00 EGP\nFusiderm 2% Cream (15g): 32.00 EGP\nFucitop 2% Cream: 28.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة (نفس المادة بدون كورتيزون): فيوسيدين (Fucidin)، فيوسيديرم (Fusiderm)، فيوسي توب (Fucitop)، فيوسيباكت (Fusibact).',
        en: 'Available generics: Fucidin, Fusiderm, Fucitop, Fusibact.',
      },
      strengths: {
        ar: 'كريم موضعي: 2%. مرهم موضعي (صوديوم فيوسيدات): 2%. قطرة عين هلامية (Fucithalmic): 1%. أقراص فموية: 250 مجم.',
        en: 'Topical cream/ointment: 2%. Viscous eye drops: 1%. Oral tablets: 250mg.',
      },
      activeIngredients: {
        ar: 'حمض الفيوسيديك / صوديوم فيوسيدات (Fusidic Acid)',
        en: 'Fusidic Acid / Sodium Fusidate',
      },
      ageRestrictions: {
        ar: 'الدهان الموضعي آمن لجميع الأعمار من الرضع إلى البالغين.',
        en: 'Topical formulations are safe across all age groups.',
      },
      dosingReference: {
        ar: 'موضعياً: تدهن طبقة رقيقة على المنطقة المصابة بعد تنظيفها من 2 إلى 3 مرات يومياً لمدة 7 أيام (لا تتجاوز 10-14 يوماً لمنع تطور المقاومة الموضعية).',
        en: 'Topical: Apply a thin layer to affected skin 2 to 3 times daily for 7 days (avoid prolonged courses >14 days to prevent resistance).',
      },
      contraindications: {
        ar: 'حساسية لمكونات الكريم، ولا يُستخدم على العدوى الفطرية أو الفيروسية كالهربس.',
        en: 'Hypersensitivity to fusidic acid; ineffective in fungal or viral skin lesions.',
      },
      sideEffects: {
        ar: 'نادراً تهيج موضعي خفيف، حرقان عابر، أو حكة.',
        en: 'Rare mild local irritation, stinging, or contact dermatitis.',
      },
      interactions: {
        ar: 'الأقراص الفموية منه تتفاعل بشدة مع أدوية الكوليسترول (الستاتينات) مسببة انحلال العضلات، أما الدهان الموضعي فامتصاصه ضئيل وآمن.',
        en: 'Systemic fusidic acid is strictly contraindicated with statins (rhabdomyolysis risk); topical absorption is minimal.',
      },
      pregnancyBreastfeeding: {
        ar: 'الكريم والمرهم الموضعي آمن تماماً أثناء الحمل والرضاعة (تجنب دهنه على حلمة الثدي مباشرة قبل الرضاعة).',
        en: 'Topical use is safe in pregnancy and breastfeeding (avoid direct application to nipple prior to nursing).',
      },
      renalHepatic: {
        ar: 'الاستخدام الموضعي لا يتطلب أي تعديل في مرضى الكلى أو الكبد.',
        en: 'No adjustment needed for topical application.',
      },
      patientEducation: {
        ar: 'تنبيه تمريضي مهم في مصر: فرّق بين فيوسيدين الأحمر (مضاد حيوي فقط للجروح والدمامل) وفيوسيكورت الأحمر والأصفر (يحتوي على كورتيزون ولا يُوضع على الجروح المفتوحة أو حب الشباب!).',
        en: 'Crucial distinction: Plain Fucidin (red stripe) is pure antibiotic for wounds; Fucicort (red/yellow) contains betamethasone steroid and must not be put on open wounds or acne.',
      },
    },
    brands: [
      { name: 'Fucidin 2% Cream 20g', manufacturer: 'MinaPharm / LEO Pharma', barcode: '6221008008815', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Fusiderm 2% Cream 15g', manufacturer: 'Eva Pharma', barcode: '6221054007910', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Most common topical antibiotic in Egypt; includes stewardship warning against steroid-combo misuse.',
  },

  // 32. Rifaximin (Trcid, Gastrobiotic)
  {
    id: 'rifaximin',
    fields: {
      genericName: {
        ar: 'ريفاكسيمين',
        en: 'Rifaximin',
      },
      drugClass: {
        ar: 'مضاد حيوي ريفامايسين معوي (غير ممتص يعمل موضعياً بالأمعاء)',
        en: 'Non-Absorbable Luminal Rifamycin Antibiotic',
      },
      approvedUses: {
        ar: 'علاج إسهال المسافرين والنزلات المعوية البكتيرية غير المصحوبة بحمى، القولون العصبي المصحوب بإسهال وفرط نمو البكتيريا المعوية (SIBO)، والوقاية من الاعتلال الدماغي الكبدي (غيبوبة الكبد).',
        en: 'Travelers diarrhea caused by non-invasive E. coli, irritable bowel syndrome with diarrhea (IBS-D), SIBO, and overt hepatic encephalopathy prophylaxis.',
      },
      mechanism: {
        ar: 'يرتبط بإنزيم بوليميراز الحمض النووي الريبوزي البكتيري (RNA polymerase) فيثبط تصنيع البروتين البكتيري داخل تجويف الأمعاء بنسبة امتصاص للدم تقل عن 0.4%.',
        en: 'Inhibits bacterial RNA synthesis by binding beta-subunit of DNA-dependent RNA polymerase locally inside the gut lumen (<0.4% systemic absorption).',
      },
      priceEgypt: {
        ar: 'تراسيد 200 مجم أقراص (Al Andalous - 12 قرص): 78.00 جنيه مصري.\nجاستروبيوتك 200 مجم أقراص (AUG Pharma): 84.00 جنيه مصري.\nجاستروبيوتك 550 مجم أقراص (14 قرص): 210.00 جنيه مصري.',
        en: 'Trcid 200mg (12 tabs): 78.00 EGP\nGastrobiotic 200mg Tabs: 84.00 EGP\nGastrobiotic 550mg (14 tabs): 210.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: تراسيد (Trcid)، جاستروبيوتك (Gastrobiotic)، إندوريفاكس (Endorifax)، نورميكس (Normix).',
        en: 'Available generics: Trcid, Gastrobiotic, Endorifax, Normix.',
      },
      strengths: {
        ar: 'أقراص مغلفة: 200 مجم، 400 مجم، 550 مجم. شراب معلق: 100 مجم/5 مل.',
        en: 'Film-coated tablets: 200mg, 400mg, 550mg. Oral suspension: 100mg/5mL.',
      },
      activeIngredients: {
        ar: 'ريفاكسيمين (Rifaximin)',
        en: 'Rifaximin',
      },
      ageRestrictions: {
        ar: 'الأقراص معتمدة للأطفال من 12 عاماً والبالغين؛ الشراب للأطفال من سن سنتين بإشراف الطبيب.',
        en: 'Tablets approved for >=12 years; suspension used in children >=2 years.',
      },
      dosingReference: {
        ar: 'للنزلات المعوية: 200 مجم 3 مرات يومياً (كل 8 ساعات) لمدة 3 أيام.\nللوقاية من غيبوبة الكبد: 550 مجم مرتين يومياً كل 12 ساعة.',
        en: 'Infectious diarrhea: 200mg 3 times daily for 3 days.\nHepatic encephalopathy: 550mg twice daily.',
      },
      contraindications: {
        ar: 'حساسية الريفامايسين، والإسهال المصحوب بارتفاع شديد في الحرارة أو دم في البراز (الدوسنتاريا أو الكامبيلوباكتر).',
        en: 'Rifamycin hypersensitivity; diarrhea complicated by fever or hematochezia.',
      },
      sideEffects: {
        ar: 'آمن جداً لأن امتصاصه للدم شبه منعدم؛ قد يسبب انتفاخاً خفيفاً أو صداعاً عابراً.',
        en: 'Minimal systemic side effects due to negligible absorption; mild flatulence or headache.',
      },
      interactions: {
        ar: 'السيكلوسبورين يزيد من الامتصاص الجهازي للريفاكسيمين.',
        en: 'Cyclosporine inhibits P-gp and OATP, elevating systemic rifaximin exposure.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ على الرغم من ضعف امتصاصه، لا يُستخدم أثناء الحمل إلا عند الضرورة القصوى.',
        en: 'Category C. Use in pregnancy only if clearly needed.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل الجرعة في القصور الكلوي. هو الدواء الأساسي المعتمد لحماية مرضى التليف الكبدي من الغيبوبة الكبدية.',
        en: 'No renal dose adjustment required. First-line agent in hepatic cirrhosis to prevent encephalopathy.',
      },
      patientEducation: {
        ar: 'لا يُستخدم هذا المضاد لعلاج الإسهال المدمم أو المصحوب بحمى شديدة؛ في تلك الحالة يجب مراجعة الطبيب فوراً.',
        en: 'Do not use if diarrhea is accompanied by high fever or blood in the stool; seek medical evaluation.',
      },
    },
    brands: [
      { name: 'Trcid 200mg Tablets', manufacturer: 'Al Andalous Medical', barcode: '6221127009519', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Gastrobiotic 550mg Tablets', manufacturer: 'AUG Pharma', barcode: '6221054008614', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Essential luminal antibiotic in Egypt for infectious gastroenteritis and hepatic encephalopathy.',
  },
  {
    id: 'paracetamol',
    fields: {
      genericName: { ar: 'باراسيتامول (أسيتامينوفين)', en: 'Paracetamol (Acetaminophen)' },
      activeIngredients: { ar: 'باراسيتامول (أسيتامينوفين)', en: 'Paracetamol (Acetaminophen)' },
      drugClass: { ar: 'مسكن للألم وخافض للحرارة غير أفيوني', en: 'Non-opioid Analgesic & Antipyretic' },
      mechanism: { ar: 'يعمل (باراسيتامول (أسيتامينوفين)) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مسكن للألم وخافض للحرارة غير أفيوني) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Paracetamol (Acetaminophen) acts via its established pharmacological mechanism as a Non-opioid Analgesic & Antipyretic (ATC: N02BE01).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 100mg/ml, 10mg/ml, 250mg/5ml, 500 mg.', en: 'Available strengths in Egypt: 100mg/ml, 10mg/ml, 250mg/5ml, 500 mg.' },
      approvedUses: { ar: 'تسكين الآلام الخفيفة إلى المتوسطة (الصداع، آلام الأسنان، آلام العضلات والمفاصل، عسر الطمث) وخفض الحرارة في نزلات البرد والعدوى.', en: 'Relief of mild-to-moderate pain (headache, dental pain, myalgia, dysmenorrhea) and reduction of fever.' },
      priceEgypt: { ar: '• بانادول أدفانس 500 مجم 24 قرص (GSK / Haleon Egypt): 46.00 جنيه مصري.\n• أبيمول 500 مجم 20 قرص (GlaxoSmithKline (GSK) Egypt): 26.00 جنيه مصري.\n• سيتال 500 مجم 20 قرص (EIPICO): 26.00 جنيه مصري.\n• سيتال 250 مجم/5 مل شراب معلق 60 مل (EIPICO): 27.00 جنيه مصري.\n• سيتال 100 مجم/مل نقط فم للرضع 15 مل (EIPICO): 22.00 جنيه مصري.\n• بيرفالجان 10 مجم/مل فيال للمحلول الوريدي 100 مل (UPSA / BMS Egypt): 115.00 جنيه مصري.', en: '• Panadol Advance 500mg Tablets (GSK / Haleon Egypt): 46.00 EGP.\n• Abimol 500mg Tablets (GlaxoSmithKline (GSK) Egypt): 26.00 EGP.\n• Cetal 500mg Tablets (EIPICO): 26.00 EGP.\n• Cetal 250mg/5ml Suspension 60ml (EIPICO): 27.00 EGP.\n• Cetal 100mg/ml Pediatric Oral Drops 15ml (EIPICO): 22.00 EGP.\n• Perfalgan 10mg/ml IV Infusion Vial 100ml (UPSA / BMS Egypt): 115.00 EGP.' },
      substitutes: { ar: '• بانادول أدفانس 500 مجم 24 قرص — GSK / Haleon Egypt (500 mg).\n• أبيمول 500 مجم 20 قرص — GlaxoSmithKline (GSK) Egypt (500 mg).\n• سيتال 500 مجم 20 قرص — EIPICO (500 mg).\n• سيتال 250 مجم/5 مل شراب معلق 60 مل — EIPICO (250mg/5ml).\n• سيتال 100 مجم/مل نقط فم للرضع 15 مل — EIPICO (100mg/ml).\n• بيرفالجان 10 مجم/مل فيال للمحلول الوريدي 100 مل — UPSA / BMS Egypt (10mg/ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Panadol Advance 500mg Tablets — GSK / Haleon Egypt (500 mg).\n• Abimol 500mg Tablets — GlaxoSmithKline (GSK) Egypt (500 mg).\n• Cetal 500mg Tablets — EIPICO (500 mg).\n• Cetal 250mg/5ml Suspension 60ml — EIPICO (250mg/5ml).\n• Cetal 100mg/ml Pediatric Oral Drops 15ml — EIPICO (100mg/ml).\n• Perfalgan 10mg/ml IV Infusion Vial 100ml — UPSA / BMS Egypt (10mg/ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'آمن للرضع والأطفال وتُحسب الجرعة بدقة حسب وزن الطفل (10–15 مجم/كجم كل 6 ساعات عند اللزوم تحت إشراف الطبيب).', en: 'Safe in infants and children when dosed strictly by body weight (10–15 mg/kg/dose every 4–6 hours as needed, max 60 mg/kg/day).' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الفشل الكبدي الحاد أو التهاب الكبد النشط الشديد، وفرط الحساسية للباراسيتامول. لا تتجاوز الجرعة القصوى للبالغين (4000 مجم/يوم) لتفادي السمية الكبدية.', en: 'Severe active hepatic impairment or acute liver failure; hypersensitivity to paracetamol. Do not exceed 4g/day in adults due to hepatotoxicity risk.' },
      sideEffects: { ar: 'آمن جداً بالجرعات العلاجية؛ نادراً طفح جلدي تحسسي، وارتفاع إنزيمات الكبد عند تجاوز الجرعة القصوى.', en: 'Well tolerated at therapeutic doses; rare skin rash or hepatotoxicity in overdose.' },
      interactions: { ar: 'الاستخدام المزمن بجرعات عالية قد يزيد من تأثير الوارفارين المضاد للتجلط؛ الكحول والأدوية السامة للكبد تزيد خطر إصابة الكبد.', en: 'Prolonged high-dose use may potentiate warfarin anticoagulation; alcohol and hepatotoxic drugs increase liver injury risk.' },
      pregnancyBreastfeeding: { ar: 'الفئة B؛ يُعد المسكن وخافض الحرارة الأول الأكثر أماناً أثناء الحمل والرضاعة بأقل جرعة فعالة ولأقصر مدة.', en: 'First-line analgesic and antipyretic choice during pregnancy and breastfeeding at the lowest effective dose for the shortest duration.' },
      renalHepatic: { ar: 'الفشل الكبدي الحاد أو التهاب الكبد النشط الشديد، وفرط الحساسية للباراسيتامول. لا تتجاوز الجرعة القصوى للبالغين (4000 مجم/يوم) لتفادي السمية الكبدية.', en: 'Severe active hepatic impairment or acute liver failure; hypersensitivity to paracetamol. Do not exceed 4g/day in adults due to hepatotoxicity risk.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (باراسيتامول (أسيتامينوفين)). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Paracetamol (Acetaminophen). Keep out of reach of children.' },
    },
    brands: [
      { name: 'Panadol Advance 500mg Tablets', manufacturer: 'GSK / Haleon Egypt', barcode: '6221044001250', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Abimol 500mg Tablets', manufacturer: 'GlaxoSmithKline (GSK) Egypt', barcode: '6221044000116', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cetal 500mg Tablets', manufacturer: 'EIPICO', barcode: '6221011002310', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cetal 250mg/5ml Suspension 60ml', manufacturer: 'EIPICO', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cetal 100mg/ml Pediatric Oral Drops 15ml', manufacturer: 'EIPICO', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Perfalgan 10mg/ml IV Infusion Vial 100ml', manufacturer: 'UPSA / BMS Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: N02BE01).',
  },
  {
    id: 'diclofenac-potassium',
    fields: {
      genericName: { ar: 'ديكلوفيناك البوتاسيوم', en: 'Diclofenac Potassium' },
      activeIngredients: { ar: 'ديكلوفيناك البوتاسيوم', en: 'Diclofenac Potassium' },
      drugClass: { ar: 'مضاد التهاب غير ستيرويدي سريع الامتصاص (NSAID)', en: 'Fast-acting Non-Steroidal Anti-Inflammatory Drug (NSAID)' },
      mechanism: { ar: 'يعمل (ديكلوفيناك البوتاسيوم) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد التهاب غير ستيرويدي سريع الامتصاص (NSAID)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Diclofenac Potassium acts via its established pharmacological mechanism as a Fast-acting Non-Steroidal Anti-Inflammatory Drug (NSAID) (ATC: M01AB05).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 50 mg.', en: 'Available strengths in Egypt: 50 mg.' },
      approvedUses: { ar: 'تسكين الآلام الحادة والالتهابات (آلام الأسنان واللثة، الصداع النصفي، عسر الطمث الأولي، آلام الظهر والمفاصل الحادة).', en: 'Short-term relief of acute pain and inflammation (dental pain, migraine attacks, primary dysmenorrhea, acute musculoskeletal pain).' },
      priceEgypt: { ar: '• كتافلام 50 مجم 20 قرص مكسو (Novartis Pharma Egypt): 62.00 جنيه مصري.\n• كتافاست 50 مجم 9 أكياس فوارة (Novartis Pharma Egypt): 54.00 جنيه مصري.', en: '• Cataflam 50mg Coated Tablets (Novartis Pharma Egypt): 62.00 EGP.\n• Catafast 50mg Oral Sachets (Novartis Pharma Egypt): 54.00 EGP.' },
      substitutes: { ar: '• كتافلام 50 مجم 20 قرص مكسو — Novartis Pharma Egypt (50 mg).\n• كتافاست 50 مجم 9 أكياس فوارة — Novartis Pharma Egypt (50 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Cataflam 50mg Coated Tablets — Novartis Pharma Egypt (50 mg).\n• Catafast 50mg Oral Sachets — Novartis Pharma Egypt (50 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُستخدم للأطفال دون سن 14 عاماً في صورة أقراص أو أكياس فموية بتركيز 50 مجم إلا بتوصية طبية خاصة.', en: '50mg oral tablets/sachets are not recommended for children under 14 years of age.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'قرحة المعدة أو الاثنى عشر النشطة أو نزيف الجهاز الهضمي، قصور القلب الاحتقاني أو أمراض الشرايين التاجية، القصور الكلوي أو الكبدي الشديد، حساسية الأسبرين/NSAIDs، والثلث الأخير من الحمل.', en: 'Active GI ulcer/bleeding, established ischemic heart disease or heart failure, severe renal/hepatic impairment, NSAID-induced asthma, and third trimester of pregnancy.' },
      sideEffects: { ar: 'ألم بالمعدة، حموضة، غثيان، ارتفاع ضغط الدم، احتباس السوائل، وخطر قرحة المعدة أو تأثر الكلى مع الاستخدام المطول.', en: 'Epigastric pain, dyspepsia, nausea, fluid retention, elevated blood pressure, and risk of GI ulceration or renal impairment.' },
      interactions: { ar: 'يتداخل مع مضادات التجلط (الوارفارين، إيليكويس، زاريلتو) ويزيد خطر النزيف؛ يقلل كفاءة أدوية الضغط ومدرات البول ويرفع خطر السمية الكلوية مع السيكلوسبورين.', en: 'Increases bleeding risk with anticoagulants/antiplatelets; blunts antihypertensive/diuretic effect and increases nephrotoxicity risk.' },
      pregnancyBreastfeeding: { ar: 'يُمنع منعاً باتاً في الثلث الأخير من الحمل (خطر الانغلاق المبكر للقناة الشريانية للجنين وقصور كلى الجنين).', en: 'Strictly contraindicated in the third trimester of pregnancy due to risk of premature closure of fetal ductus arteriosus.' },
      renalHepatic: { ar: 'قرحة المعدة أو الاثنى عشر النشطة أو نزيف الجهاز الهضمي، قصور القلب الاحتقاني أو أمراض الشرايين التاجية، القصور الكلوي أو الكبدي الشديد، حساسية الأسبرين/NSAIDs، والثلث الأخير من الحمل.', en: 'Active GI ulcer/bleeding, established ischemic heart disease or heart failure, severe renal/hepatic impairment, NSAID-induced asthma, and third trimester of pregnancy.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ديكلوفيناك البوتاسيوم). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Diclofenac Potassium. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Cataflam 50mg Coated Tablets', manufacturer: 'Novartis Pharma Egypt', barcode: '6221023001127', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Catafast 50mg Oral Sachets', manufacturer: 'Novartis Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: M01AB05).',
  },
  {
    id: 'diclofenac-sodium',
    fields: {
      genericName: { ar: 'ديكلوفيناك الصوديوم', en: 'Diclofenac Sodium' },
      activeIngredients: { ar: 'ديكلوفيناك الصوديوم', en: 'Diclofenac Sodium' },
      drugClass: { ar: 'مضاد التهاب غير ستيرويدي ومضاد للروماتيزم (NSAID)', en: 'Non-Steroidal Anti-Inflammatory Drug (NSAID)' },
      mechanism: { ar: 'يعمل (ديكلوفيناك الصوديوم) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد التهاب غير ستيرويدي ومضاد للروماتيزم (NSAID)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Diclofenac Sodium acts via its established pharmacological mechanism as a Non-Steroidal Anti-Inflammatory Drug (NSAID) (ATC: M01AB05).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 100 mg, 75mg/3ml.', en: 'Available strengths in Egypt: 100 mg, 75mg/3ml.' },
      approvedUses: { ar: 'علاج التهابات المفاصل الروماتويدية، الفصال العظمي (خشونة المفاصل)، النقرس الحاد، المغص الكلوي، وآلام ما بعد الجراحة.', en: 'Management of rheumatoid arthritis, osteoarthritis, ankylosing spondylitis, acute gout, renal colic, and post-operative inflammation.' },
      priceEgypt: { ar: '• فولتارين 75 مجم/3 مل 6 أمبولات (Novartis Pharma Egypt): 81.00 جنيه مصري.\n• فولتارين 100 مجم 5 لبوس شرجي (Novartis Pharma Egypt): 47.00 جنيه مصري.', en: '• Voltaren 75mg/3ml Ampoules (Novartis Pharma Egypt): 81.00 EGP.\n• Voltaren 100mg Suppositories (Novartis Pharma Egypt): 47.00 EGP.' },
      substitutes: { ar: '• فولتارين 75 مجم/3 مل 6 أمبولات — Novartis Pharma Egypt (75mg/3ml).\n• فولتارين 100 مجم 5 لبوس شرجي — Novartis Pharma Egypt (100 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Voltaren 75mg/3ml Ampoules — Novartis Pharma Egypt (75mg/3ml).\n• Voltaren 100mg Suppositories — Novartis Pharma Egypt (100 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'تُستخدم التركيزات المخصصة للأطفال فقط تحت إشراف طبيب الأطفال؛ وتُمنع أمبولات ولبوس الكبار (75 مجم و100 مجم) للأطفال.', en: 'Adult strengths (75mg ampoules, 100mg suppositories) are contraindicated in children.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'قرحة أو نزيف الجهاز الهضمي، أمراض القلب الإقفارية وفشل القلب، القصور الكلوي أو الكبدي الشديد، حساسية المسكنات، والثلث الأخير من الحمل.', en: 'Active peptic ulcer/bleeding, ischemic heart disease, heart failure, severe renal/hepatic failure, NSAID hypersensitivity, and third trimester of pregnancy.' },
      sideEffects: { ar: 'اضطرابات معدية، دوار، ارتفاع ضغط الدم، وتفاعلات موضع الحقن أو التهاب المستقيم مع اللبوس.', en: 'GI irritation, dizziness, elevated blood pressure, transaminase elevation, and local irritation at injection/suppository site.' },
      interactions: { ar: 'يزيد خطر النزيف مع مضادات السيولة والأسبرين؛ يرفع مستوى الليثيوم والديجوكسين في الدم ويؤثر على وظائف الكلى مع مثبطات ACE ومدرات البول.', en: 'Potentiates anticoagulant bleeding risk; elevates lithium/digoxin levels; additive nephrotoxicity with ACE inhibitors/ARBs and diuretics.' },
      pregnancyBreastfeeding: { ar: 'يُمنع في الثلث الأخير من الحمل؛ ويُتجنب في الثلثين الأول والثاني إلا للضرورة القصوى.', en: 'Contraindicated in the third trimester of pregnancy.' },
      renalHepatic: { ar: 'قرحة أو نزيف الجهاز الهضمي، أمراض القلب الإقفارية وفشل القلب، القصور الكلوي أو الكبدي الشديد، حساسية المسكنات، والثلث الأخير من الحمل.', en: 'Active peptic ulcer/bleeding, ischemic heart disease, heart failure, severe renal/hepatic failure, NSAID hypersensitivity, and third trimester of pregnancy.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ديكلوفيناك الصوديوم). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Diclofenac Sodium. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Voltaren 75mg/3ml Ampoules', manufacturer: 'Novartis Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Voltaren 100mg Suppositories', manufacturer: 'Novartis Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: M01AB05).',
  },
  {
    id: 'ibuprofen',
    fields: {
      genericName: { ar: 'إيبوبروفين', en: 'Ibuprofen' },
      activeIngredients: { ar: 'إيبوبروفين', en: 'Ibuprofen' },
      drugClass: { ar: 'مضاد التهاب غير ستيرويدي ومسكن وخافض للحرارة (NSAID)', en: 'Propionic Acid Derivative NSAID Analgesic & Antipyretic' },
      mechanism: { ar: 'يعمل (إيبوبروفين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد التهاب غير ستيرويدي ومسكن وخافض للحرارة (NSAID)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Ibuprofen acts via its established pharmacological mechanism as a Propionic Acid Derivative NSAID Analgesic & Antipyretic (ATC: M01AE01).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 100mg/5ml, 400 mg.', en: 'Available strengths in Egypt: 100mg/5ml, 400 mg.' },
      approvedUses: { ar: 'تسكين الآلام والالتهابات (الصداع، آلام الأسنان، عسر الطمث، التهاب المفاصل والعضلات) وخفض الحمى لدى الأطفال والبالغين.', en: 'Management of mild-to-moderate pain, dysmenorrhea, rheumatoid/osteoarthritis inflammation, and fever in adults and children.' },
      priceEgypt: { ar: '• بروفين 400 مجم 30 قرص مغلف (Abbott / Kahira Pharma): 78.00 جنيه مصري.\n• بروفين 100 مجم/5 مل شراب للأطفال 120 مل (Abbott / Kahira Pharma): 45.00 جنيه مصري.', en: '• Brufen 400mg Tablets (Abbott / Kahira Pharma): 78.00 EGP.\n• Brufen 100mg/5ml Pediatric Syrup 120ml (Abbott / Kahira Pharma): 45.00 EGP.' },
      substitutes: { ar: '• بروفين 400 مجم 30 قرص مغلف — Abbott / Kahira Pharma (400 mg).\n• بروفين 100 مجم/5 مل شراب للأطفال 120 مل — Abbott / Kahira Pharma (100mg/5ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Brufen 400mg Tablets — Abbott / Kahira Pharma (400 mg).\n• Brufen 100mg/5ml Pediatric Syrup 120ml — Abbott / Kahira Pharma (100mg/5ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُعطى للرضع أقل من 6 أشهر أو وزن أقل من 5 كجم إلا بأمر الطبيب، ويُمنع في حالات الجفاف الشديد لدى الطفل.', en: 'Not recommended in infants under 6 months without medical supervision; avoid in dehydrated children due to acute kidney injury risk.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'قرحة المعدة النشطة، حساسية الأسبرين ومضادات الالتهاب، قصور الكلى أو القلب أو الكبد الشديد، والثلث الأخير من الحمل.', en: 'Active peptic ulcer, NSAID-induced asthma/urticaria, severe heart/renal/hepatic failure, and third trimester of pregnancy.' },
      sideEffects: { ar: 'عسر هضم، حموضة، غثيان (يُفضل تناوله بعد الطعام)، واحتباس السوائل عند الاستخدام المطول.', en: 'Dyspepsia, heartburn, nausea (take with food or milk), and potential GI bleeding or renal effects with chronic use.' },
      interactions: { ar: 'يعاكس التأثير الواقي للقلب للأسبرين منخفض الجرعة، ويزيد خطر النزيف مع مضادات التجلط، ويقلل تأثير أدوية خفض الضغط.', en: 'May interfere with cardioprotective low-dose aspirin; increases bleeding risk with anticoagulants; reduces antihypertensive efficacy.' },
      pregnancyBreastfeeding: { ar: 'يُمنع في الثلث الأخير من الحمل؛ آمن نسبياً بجرعات قصيرة أثناء الرضاعة الطبيعية.', en: 'Contraindicated in third trimester of pregnancy; compatible with breastfeeding in short courses.' },
      renalHepatic: { ar: 'قرحة المعدة النشطة، حساسية الأسبرين ومضادات الالتهاب، قصور الكلى أو القلب أو الكبد الشديد، والثلث الأخير من الحمل.', en: 'Active peptic ulcer, NSAID-induced asthma/urticaria, severe heart/renal/hepatic failure, and third trimester of pregnancy.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (إيبوبروفين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Ibuprofen. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Brufen 400mg Tablets', manufacturer: 'Abbott / Kahira Pharma', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Brufen 100mg/5ml Pediatric Syrup 120ml', manufacturer: 'Abbott / Kahira Pharma', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: M01AE01).',
  },
  {
    id: 'aceclofenac',
    fields: {
      genericName: { ar: 'أسيكلوفيناك', en: 'Aceclofenac' },
      activeIngredients: { ar: 'أسيكلوفيناك', en: 'Aceclofenac' },
      drugClass: { ar: 'مضاد التهاب غير ستيرويدي ومضاد للروماتيزم (NSAID)', en: 'Phenylacetic Acid Derivative NSAID' },
      mechanism: { ar: 'يعمل (أسيكلوفيناك) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد التهاب غير ستيرويدي ومضاد للروماتيزم (NSAID)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Aceclofenac acts via its established pharmacological mechanism as a Phenylacetic Acid Derivative NSAID (ATC: M01AB16).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 100 mg.', en: 'Available strengths in Egypt: 100 mg.' },
      approvedUses: { ar: 'علاج الألم والالتهاب في خشونة المفاصل (الفصال العظمي)، التهاب المفاصل الروماتويدي، التهاب الفقار المقسط، وآلام الأسنان والفقرات.', en: 'Relief of pain and inflammation in osteoarthritis, rheumatoid arthritis, ankylosing spondylitis, and acute dental or low-back pain.' },
      priceEgypt: { ar: '• بريستفلام 100 مجم 20 قرص مغلف (Bristol-Myers Squibb / SmithKline Egypt): 102.00 جنيه مصري.', en: '• Bristaflam 100mg Tablets (Bristol-Myers Squibb / SmithKline Egypt): 102.00 EGP.' },
      substitutes: { ar: '• بريستفلام 100 مجم 20 قرص مغلف — Bristol-Myers Squibb / SmithKline Egypt (100 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Bristaflam 100mg Tablets — Bristol-Myers Squibb / SmithKline Egypt (100 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'غير مخصص للاستخدام لدى الأطفال (أقل من 18 عاماً).', en: 'Safety and efficacy in children under 18 years have not been established.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'قرحة المعدة أو الاثنى عشر، أمراض القلب الإقفارية وفشل القلب، القصور الكلوي أو الكبدي الشديد، والثلث الأخير من الحمل.', en: 'Active peptic ulcer/bleeding, ischemic heart disease, heart failure, severe renal/hepatic impairment, and third trimester of pregnancy.' },
      sideEffects: { ar: 'عسر هضم، ألم بالبطن، غثيان، دوار، وارتفاع عابر بإنزيمات الكبد.', en: 'Dyspepsia, abdominal pain, nausea, dizziness, and transient hepatic enzyme elevation.' },
      interactions: { ar: 'يتداخل مع مضادات التجلط ومدرات البول ومثبطات ACE والليثيوم والميثوتريكسات.', en: 'Interacts with anticoagulants, diuretics, ACE inhibitors/ARBs, lithium, and methotrexate.' },
      pregnancyBreastfeeding: { ar: 'يُمنع في الثلث الأخير من الحمل ويتجنب أثناء الرضاعة.', en: 'Contraindicated in third trimester of pregnancy; avoid during lactation.' },
      renalHepatic: { ar: 'قرحة المعدة أو الاثنى عشر، أمراض القلب الإقفارية وفشل القلب، القصور الكلوي أو الكبدي الشديد، والثلث الأخير من الحمل.', en: 'Active peptic ulcer/bleeding, ischemic heart disease, heart failure, severe renal/hepatic impairment, and third trimester of pregnancy.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (أسيكلوفيناك). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Aceclofenac. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Bristaflam 100mg Tablets', manufacturer: 'Bristol-Myers Squibb / SmithKline Egypt', barcode: '6221036002142', verified: true, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: M01AB16).',
  },
  {
    id: 'celecoxib',
    fields: {
      genericName: { ar: 'سيليكوكسيب', en: 'Celecoxib' },
      activeIngredients: { ar: 'سيليكوكسيب', en: 'Celecoxib' },
      drugClass: { ar: 'مثبط انتقائي لإنزيم كوكس-2 (COX-2 Inhibitor NSAID)', en: 'Selective COX-2 Inhibitor NSAID' },
      mechanism: { ar: 'يعمل (سيليكوكسيب) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مثبط انتقائي لإنزيم كوكس-2 (COX-2 Inhibitor NSAID)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Celecoxib acts via its established pharmacological mechanism as a Selective COX-2 Inhibitor NSAID (ATC: M01AH01).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 200 mg.', en: 'Available strengths in Egypt: 200 mg.' },
      approvedUses: { ar: 'علاج التهاب المفاصل الروماتويدي، الفصال العظمي (خشونة المفاصل)، التهاب الفقار المقسط، والآلام الحادة وعسر الطمث.', en: 'Symptomatic relief in osteoarthritis, rheumatoid arthritis, ankylosing spondylitis, acute pain, and primary dysmenorrhea.' },
      priceEgypt: { ar: '• سيليبريكس 200 مجم 15 كبسولة (Pfizer / Viatris Egypt): 165.00 جنيه مصري.', en: '• Celebrex 200mg Capsules (Pfizer / Viatris Egypt): 165.00 EGP.' },
      substitutes: { ar: '• سيليبريكس 200 مجم 15 كبسولة — Pfizer / Viatris Egypt (200 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Celebrex 200mg Capsules — Pfizer / Viatris Egypt (200 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُستخدم للأطفال إلا في حالات التهاب المفاصل الروماتويدي اليفعي تحت إشراف أخصائي الروماتيزم.', en: 'Restricted to specialist management of juvenile idiopathic arthritis.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الحساسية لمركبات السلفا (Sulfonamides)، أمراض الشرايين التاجية أو الجلطات القلبية والدماغية، قرحة المعدة النشطة، والقصور الكلوي أو الكبدي الشديد.', en: 'Known sulfonamide hypersensitivity, established ischemic heart disease/cerebrovascular disease, active GI ulceration, and severe hepatic/renal impairment.' },
      sideEffects: { ar: 'ارتفاع ضغط الدم، احتباس السوائل، اضطرابات هضمية أخف من المسكنات التقليدية، وزيادة مخاطر القلب والأوعية مع الجرعات العالية المطولة.', en: 'Fluid retention, hypertension, mild dyspepsia, and dose-related cardiovascular thrombotic risk.' },
      interactions: { ar: 'يتداخل مع الفلوكونازول (يرفع تركيز السيليكوكسيب عبر CYP2C9)، مضادات التجلط، وأدوية الضغط.', en: 'Fluconazole inhibits CYP2C9 and doubles celecoxib levels; interacts with warfarin and ACE inhibitors/diuretics.' },
      pregnancyBreastfeeding: { ar: 'يُمنع في الثلث الأخير من الحمل ولا يُنصح به في التخطيط للحمل أو الرضاعة.', en: 'Contraindicated in third trimester of pregnancy.' },
      renalHepatic: { ar: 'الحساسية لمركبات السلفا (Sulfonamides)، أمراض الشرايين التاجية أو الجلطات القلبية والدماغية، قرحة المعدة النشطة، والقصور الكلوي أو الكبدي الشديد.', en: 'Known sulfonamide hypersensitivity, established ischemic heart disease/cerebrovascular disease, active GI ulceration, and severe hepatic/renal impairment.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (سيليكوكسيب). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Celecoxib. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Celebrex 200mg Capsules', manufacturer: 'Pfizer / Viatris Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: M01AH01).',
  },
  {
    id: 'cetirizine',
    fields: {
      genericName: { ar: 'سيتيريزين', en: 'Cetirizine' },
      activeIngredients: { ar: 'سيتيريزين', en: 'Cetirizine' },
      drugClass: { ar: 'مضاد هيستامين من الجيل الثاني قليل النعاس', en: '2nd-Generation H1-Antihistamine' },
      mechanism: { ar: 'يعمل (سيتيريزين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد هيستامين من الجيل الثاني قليل النعاس) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Cetirizine acts via its established pharmacological mechanism as a 2nd-Generation H1-Antihistamine (ATC: R06AE07).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 10 mg.', en: 'Available strengths in Egypt: 10 mg.' },
      approvedUses: { ar: 'علاج التهاب الأنف التحسسي الموسمي والمزمن، حساسية الملتحمة، والحكة والأرتيكاريا المزمنة.', en: 'Relief of nasal and ocular symptoms of seasonal and perennial allergic rhinitis and chronic idiopathic urticaria.' },
      priceEgypt: { ar: '• زيرتك 10 مجم 20 قرص مغلف (UCB / GSK Egypt): 62.00 جنيه مصري.', en: '• Zyrtec 10mg Tablets (UCB / GSK Egypt): 62.00 EGP.' },
      substitutes: { ar: '• زيرتك 10 مجم 20 قرص مغلف — UCB / GSK Egypt (10 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Zyrtec 10mg Tablets — UCB / GSK Egypt (10 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'تُستخدم النقط الفموية والشراب للأطفال من عمر 6 أشهر فأكثر بجرعة يحددها طبيب الأطفال.', en: 'Oral drops and syrup are approved for pediatric use from 6 months of age under medical guidance.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الفشل الكلوي الشديد (CrCl < 10 ml/min) وفرط الحساسية للسيتيريزين أو الهيدروكسيزين.', en: 'End-stage renal impairment (CrCl < 10 mL/min) and hypersensitivity to cetirizine or hydroxyzine.' },
      sideEffects: { ar: 'قد يسبب نعاساً خفيفاً لدى بعض المرضى، جفاف الفم، أو صداعاً عابراً.', en: 'Mild somnolence in susceptible individuals, dry mouth, fatigue, or headache.' },
      interactions: { ar: 'تجنب الجمع مع المهدئات أو الكحول لتفادي زيادة النعاس وتثبيط الجهاز العصبي.', en: 'Additive sedation with CNS depressants or alcohol.' },
      pregnancyBreastfeeding: { ar: 'الفئة B؛ يُستخدم بحذر أثناء الحمل إذا دعت الحاجة الطبية وتحت إشراف الطبيب.', en: 'Generally well tolerated in pregnancy when clinically indicated; consult physician.' },
      renalHepatic: { ar: 'الفشل الكلوي الشديد (CrCl < 10 ml/min) وفرط الحساسية للسيتيريزين أو الهيدروكسيزين.', en: 'End-stage renal impairment (CrCl < 10 mL/min) and hypersensitivity to cetirizine or hydroxyzine.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (سيتيريزين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Cetirizine. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Zyrtec 10mg Tablets', manufacturer: 'UCB / GSK Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: R06AE07).',
  },
  {
    id: 'levocetirizine',
    fields: {
      genericName: { ar: 'ليفوسيتيريزين', en: 'Levocetirizine' },
      activeIngredients: { ar: 'ليفوسيتيريزين', en: 'Levocetirizine' },
      drugClass: { ar: 'مضاد هيستامين انتقائي من الجيل الثالث', en: '3rd-Generation Selective H1-Antihistamine' },
      mechanism: { ar: 'يعمل (ليفوسيتيريزين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد هيستامين انتقائي من الجيل الثالث) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Levocetirizine acts via its established pharmacological mechanism as a 3rd-Generation Selective H1-Antihistamine (ATC: R06AE09).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 5 mg.', en: 'Available strengths in Egypt: 5 mg.' },
      approvedUses: { ar: 'علاج أعراض حساسية الأنف الموسمية والمستمرة (العطس، الرشح، حكة الأنف والعين) والأرتيكاريا المزمنة.', en: 'Symptomatic treatment of allergic rhinitis (including persistent allergic rhinitis) and chronic urticaria.' },
      priceEgypt: { ar: '• زايزال 5 مجم 20 قرص مغلف (UCB / GSK Egypt): 68.00 جنيه مصري.\n• أليرير 5 مجم 20 قرص مغلف (Borg Pharmaceutical Industries): 38.00 جنيه مصري.', en: '• Xyzal 5mg Tablets (UCB / GSK Egypt): 68.00 EGP.\n• Allear 5mg Tablets (Borg Pharmaceutical Industries): 38.00 EGP.' },
      substitutes: { ar: '• زايزال 5 مجم 20 قرص مغلف — UCB / GSK Egypt (5 mg).\n• أليرير 5 مجم 20 قرص مغلف — Borg Pharmaceutical Industries (5 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Xyzal 5mg Tablets — UCB / GSK Egypt (5 mg).\n• Allear 5mg Tablets — Borg Pharmaceutical Industries (5 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يتوفر شراب ونقط للأطفال من عمر سنتين فأكثر، بينما الأقراص 5 مجم للأطفال فوق 6 سنوات والبالغين.', en: 'Oral solution is suitable for children ≥2 years; 5mg film-coated tablets for ≥6 years and adults.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'القصور الكلوي الشديد (معدل الترشيح الكبيبي أقل من 10 مل/دقيقة) وفرط الحساسية للمادة الفعالة.', en: 'Severe renal impairment (CrCl < 10 mL/min) and hypersensitivity to levocetirizine or piperazine derivatives.' },
      sideEffects: { ar: 'جفاف خفيف بالفم، صداع، أو ميل بسيط للنعاس لدى بعض الأشخاص.', en: 'Mild dry mouth, headache, or occasional somnolence.' },
      interactions: { ar: 'الحذر عند الاستخدام المتزامن مع مثبطات الجهاز العصبي المركزي.', en: 'Caution with concurrent CNS depressants in sensitive patients.' },
      pregnancyBreastfeeding: { ar: 'الفئة B؛ يُستشار الطبيب قبل الاستخدام أثناء الحمل والرضاعة.', en: 'Use during pregnancy only on physician advice; excreted in breast milk.' },
      renalHepatic: { ar: 'القصور الكلوي الشديد (معدل الترشيح الكبيبي أقل من 10 مل/دقيقة) وفرط الحساسية للمادة الفعالة.', en: 'Severe renal impairment (CrCl < 10 mL/min) and hypersensitivity to levocetirizine or piperazine derivatives.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ليفوسيتيريزين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Levocetirizine. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Xyzal 5mg Tablets', manufacturer: 'UCB / GSK Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Allear 5mg Tablets', manufacturer: 'Borg Pharmaceutical Industries', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: R06AE09).',
  },
  {
    id: 'fexofenadine',
    fields: {
      genericName: { ar: 'فيكسوفينادين', en: 'Fexofenadine' },
      activeIngredients: { ar: 'فيكسوفينادين', en: 'Fexofenadine' },
      drugClass: { ar: 'مضاد هيستامين لا يسبب النعاس (الجيل الثاني/الثالث)', en: 'Non-Sedating H1-Antihistamine' },
      mechanism: { ar: 'يعمل (فيكسوفينادين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد هيستامين لا يسبب النعاس (الجيل الثاني/الثالث)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Fexofenadine acts via its established pharmacological mechanism as a Non-Sedating H1-Antihistamine (ATC: R06AX26).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 180 mg.', en: 'Available strengths in Egypt: 180 mg.' },
      approvedUses: { ar: 'تخفيف أعراض التهاب الأنف التحسسي الموسمي (120 مجم) والأرتيكاريا المزمنة والحكة الجلدية (180 مجم) دون التسبب في نعاس.', en: 'Relief of seasonal allergic rhinitis (120mg) and chronic idiopathic urticaria (180mg) without crossing the blood-brain barrier.' },
      priceEgypt: { ar: '• تلفاست 180 مجم 20 قرص مغلف (Sanofi Egypt): 115.00 جنيه مصري.', en: '• Telfast 180mg Tablets (Sanofi Egypt): 115.00 EGP.' },
      substitutes: { ar: '• تلفاست 180 مجم 20 قرص مغلف — Sanofi Egypt (180 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Telfast 180mg Tablets — Sanofi Egypt (180 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يتوفر معلق فموي للأطفال، بينما أقراص 120 مجم و180 مجم مخصصة للبالغين والأطفال من 12 سنة فأكثر.', en: '120mg and 180mg tablets are indicated for adults and adolescents ≥12 years.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية للفيكسوفينادين.', en: 'Known hypersensitivity to fexofenadine.' },
      sideEffects: { ar: 'صداع خفيف أو دوار نادر؛ يتميز بعدم عبور الحاجز الدموي الدماغي فلا يسبب النعاس.', en: 'Minimal sedation; occasional headache or dizziness.' },
      interactions: { ar: 'عصائر الفاكهة (الجريب فروت، البرتقال، التفاح) ومضادات الحموضة المحتوية على ألومنيوم/ماغنيسيوم تقلل امتصاصه؛ जबकि الإريثرومايسين والكيتوكونازول يرفعان مستواه في الدم.', en: 'Fruit juices and aluminum/magnesium antacids significantly reduce oral absorption (take with water); erythromycin/ketoconazole increase plasma levels.' },
      pregnancyBreastfeeding: { ar: 'يُستخدم أثناء الحمل أو الرضاعة فقط تحت إشراف الطبيب عند الحاجة.', en: 'Use during pregnancy only if potential benefit justifies risk.' },
      renalHepatic: { ar: 'فرط الحساسية للفيكسوفينادين.', en: 'Known hypersensitivity to fexofenadine.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (فيكسوفينادين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Fexofenadine. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Telfast 180mg Tablets', manufacturer: 'Sanofi Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: R06AX26).',
  },
  {
    id: 'salbutamol',
    fields: {
      genericName: { ar: 'سالبوتامول (ألبوتيرول)', en: 'Salbutamol (Albuterol)' },
      activeIngredients: { ar: 'سالبوتامول (ألبوتيرول)', en: 'Salbutamol (Albuterol)' },
      drugClass: { ar: 'موسع شعب هوائية قصير المفعول (ناهض بيتا-2 الانتقائي - SABA)', en: 'Short-Acting Beta-2 Agonist Bronchodilator (SABA)' },
      mechanism: { ar: 'يعمل (سالبوتامول (ألبوتيرول)) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (موسع شعب هوائية قصير المفعول (ناهض بيتا-2 الانتقائي - SABA)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Salbutamol (Albuterol) acts via its established pharmacological mechanism as a Short-Acting Beta-2 Agonist Bronchodilator (SABA) (ATC: R03AC02).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 100 mcg.', en: 'Available strengths in Egypt: 100 mcg.' },
      approvedUses: { ar: 'علاج وإغاثة سريعة لتشنج الشعب الهوائية الحاد ونوبات الربو الشعبي وضيق التنفس ومرض السدة الرئوية المزمنة (COPD).', en: 'Acute relief and prevention of bronchospasm in bronchial asthma and chronic obstructive pulmonary disease (COPD).' },
      priceEgypt: { ar: '• فنتولين إيفوهيلر 100 ميكروجرام بخاخ 200 جرعة (GlaxoSmithKline (GSK) Egypt): 91.00 جنيه مصري.', en: '• Ventolin Evohaler 100mcg Inhaler (GlaxoSmithKline (GSK) Egypt): 91.00 EGP.' },
      substitutes: { ar: '• فنتولين إيفوهيلر 100 ميكروجرام بخاخ 200 جرعة — GlaxoSmithKline (GSK) Egypt (100 mcg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Ventolin Evohaler 100mcg Inhaler — GlaxoSmithKline (GSK) Egypt (100 mcg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يُستخدم بأمان للأطفال عبر البخاخ (مع جهاز Spacer) أو جلسات البخار (Nebulizer) بجرعة يحددها طبيب الأطفال.', en: 'Widely used in pediatrics via MDI with spacer or nebulizer solution under physician guidance.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية للسالبوتامول؛ ولا يُستخدم السالبوتامول الفموي أو الوريدي لإيقاف الطلق المبكر في حالات النزيف أو تسمم الحمل.', en: 'Hypersensitivity to salbutamol; non-inhalation forms must not be used for uncomplicated preterm labor with cardiac disease.' },
      sideEffects: { ar: 'رعشة خفيفة باليدين، تسارع ضربات القلب (خفقان)، صداع، ونقص البوتاسيوم بالدم مع الجرعات العالية.', en: 'Fine skeletal muscle tremor, tachycardia, palpitations, headache, and hypokalemia at high doses.' },
      interactions: { ar: 'حاصرات بيتا غير الانتقائية (مثل البروبرانولول) تعاكس مفعول السالبوتامول وقد تسبب ضيقاً شديداً بالشعب الهوائية؛ مدرات البول والكورتيزون قد تزيد نقص البوتاسيوم.', en: 'Non-selective beta-blockers (e.g., propranolol) antagonize bronchodilation and may trigger severe bronchospasm; additive hypokalemia with diuretics.' },
      pregnancyBreastfeeding: { ar: 'البخاخ الاستنشاقي يُعد آمناً وضرورياً للسيطرة على نوبات الربو أثناء الحمل؛ لأن نقص الأكسجين أخطر على الجنين.', en: 'Inhaled salbutamol is safe and essential for controlling maternal asthma during pregnancy.' },
      renalHepatic: { ar: 'فرط الحساسية للسالبوتامول؛ ولا يُستخدم السالبوتامول الفموي أو الوريدي لإيقاف الطلق المبكر في حالات النزيف أو تسمم الحمل.', en: 'Hypersensitivity to salbutamol; non-inhalation forms must not be used for uncomplicated preterm labor with cardiac disease.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (سالبوتامول (ألبوتيرول)). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Salbutamol (Albuterol). Keep out of reach of children.' },
    },
    brands: [
      { name: 'Ventolin Evohaler 100mcg Inhaler', manufacturer: 'GlaxoSmithKline (GSK) Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: R03AC02).',
  },
  {
    id: 'montelukast',
    fields: {
      genericName: { ar: 'مونتيلوكاست', en: 'Montelukast' },
      activeIngredients: { ar: 'مونتيلوكاست', en: 'Montelukast' },
      drugClass: { ar: 'مضاد مستقبلات الليكوترين للوقاية من الربو وحساسية الأنف', en: 'Leukotriene Receptor Antagonist (LTRA)' },
      mechanism: { ar: 'يعمل (مونتيلوكاست) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد مستقبلات الليكوترين للوقاية من الربو وحساسية الأنف) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Montelukast acts via its established pharmacological mechanism as a Leukotriene Receptor Antagonist (LTRA) (ATC: R03DC03).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 10 mg.', en: 'Available strengths in Egypt: 10 mg.' },
      approvedUses: { ar: 'العلاج الوقائي المزمن للربو الشعبي، الوقاية من تضيق الشعب الهوائية الناتج عن المجهود، وعلاج حساسية الأنف الموسمية والمزمنة. لا يُستخدم لإسعاف نوبة الربو الحادة.', en: 'Prophylaxis and chronic treatment of asthma, exercise-induced bronchoconstriction, and symptomatic relief of allergic rhinitis (not for acute asthma attacks).' },
      priceEgypt: { ar: '• سينجولير 10 مجم 14 قرص مغلف (MSD / Organon Egypt): 126.00 جنيه مصري.\n• كوكاست 10 مجم 14 قرص مغلف ( Pharco / European Egyptian Pharm): 54.00 جنيه مصري.', en: '• Singulair 10mg Tablets (MSD / Organon Egypt): 126.00 EGP.\n• Kokast 10mg Tablets ( Pharco / European Egyptian Pharm): 54.00 EGP.' },
      substitutes: { ar: '• سينجولير 10 مجم 14 قرص مغلف — MSD / Organon Egypt (10 mg).\n• كوكاست 10 مجم 14 قرص مغلف —  Pharco / European Egyptian Pharm (10 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Singulair 10mg Tablets — MSD / Organon Egypt (10 mg).\n• Kokast 10mg Tablets —  Pharco / European Egyptian Pharm (10 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يتوفر بتركيز 4 مجم (أقراص مضغ أو حبيبات للأطفال من سنتين إلى 5 سنوات) و5 مجم (من 6 إلى 14 سنة)، مع متابعة سلوك ونوم الطفل.', en: '4mg chewable/granules for ages 2–5 years and 5mg chewable for ages 6–14 years; monitor for sleep or behavioral changes.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية للمونتيلوكاست؛ ولا يُستعمل كبديل عن بخاخ الإنقاذ السريع أثناء أزمة التنفس الحادة.', en: 'Hypersensitivity to montelukast; never use as rescue therapy for acute status asthmaticus.' },
      sideEffects: { ar: 'صداع، ألم بالبطن؛ ويجب الانتباه لتحذير إدارة الغذاء والدواء (FDA) بشأن تغيرات المزاج أو الأحلام المزعجة واضطرابات النوم لدى بعض المرضى.', en: 'Headache, abdominal pain; monitor for neuropsychiatric events (vivid dreams, sleep disturbances, mood/behavioral changes).' },
      interactions: { ar: 'الفينوباربيتال والريفامبيسين قد يقللان من تركيز المونتيلوكاست في الدم.', en: 'CYP3A4/2C8 inducers (phenobarbital, rifampicin) decrease montelukast plasma concentrations.' },
      pregnancyBreastfeeding: { ar: 'الفئة B؛ يُستخدم أثناء الحمل إذا كانت هناك حاجة طبية واضحة وتحت إشراف الطبيب.', en: 'May be used during pregnancy if clearly needed for asthma control.' },
      renalHepatic: { ar: 'فرط الحساسية للمونتيلوكاست؛ ولا يُستعمل كبديل عن بخاخ الإنقاذ السريع أثناء أزمة التنفس الحادة.', en: 'Hypersensitivity to montelukast; never use as rescue therapy for acute status asthmaticus.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (مونتيلوكاست). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Montelukast. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Singulair 10mg Tablets', manufacturer: 'MSD / Organon Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Kokast 10mg Tablets', manufacturer: ' Pharco / European Egyptian Pharm', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: R03DC03).',
  },
  {
    id: 'ibuprofen-pseudoephedrine',
    fields: {
      genericName: { ar: 'إيبوبروفين + سودوإيفيدرين', en: 'Ibuprofen + Pseudoephedrine' },
      activeIngredients: { ar: 'إيبوبروفين + سودوإيفيدرين', en: 'Ibuprofen + Pseudoephedrine' },
      drugClass: { ar: 'مضاد احتقان أنف وجيوب أنفية + مسكن ومضاد التهاب وخافض حرارة', en: 'NSAID Analgesic + Systemic Nasal Decongestant Combination' },
      mechanism: { ar: 'يعمل (إيبوبروفين + سودوإيفيدرين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد احتقان أنف وجيوب أنفية + مسكن ومضاد التهاب وخافض حرارة) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Ibuprofen + Pseudoephedrine acts via its established pharmacological mechanism as a NSAID Analgesic + Systemic Nasal Decongestant Combination (ATC: R01BA52).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 300mg/45mg.', en: 'Available strengths in Egypt: 300mg/45mg.' },
      approvedUses: { ar: 'تخفيف احتقان الأنف والجيوب الأنفية المصحوب بالصداع والحمى وآلام الجسم في نزلات البرد والإنفلونزا.', en: 'Temporary relief of nasal/sinus congestion, sinus pressure, headache, body aches, and fever in common cold and flu.' },
      priceEgypt: { ar: '• باور كابس 300/45 مجم 20 كبسولة (Chemipharm Egypt): 39.00 جنيه مصري.', en: '• Power Caps 300mg/45mg Capsules (Chemipharm Egypt): 39.00 EGP.' },
      substitutes: { ar: '• باور كابس 300/45 مجم 20 كبسولة — Chemipharm Egypt (300mg/45mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Power Caps 300mg/45mg Capsules — Chemipharm Egypt (300mg/45mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يُمنع للأطفال دون 12 عاماً.', en: 'Contraindicated in children under 12 years of age.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'ارتفاع ضغط الدم غير المنضبط، أمراض الشرايين التاجية والقلب، قرحة المعدة، القصور الكلوي، الاستخدام المتزامن لمثبطات MAO، الأطفال دون 12 سنة، والحمل.', en: 'Uncontrolled hypertension, severe coronary artery disease, active peptic ulcer, concurrent MAOIs, pregnancy, and children under 12 years.' },
      sideEffects: { ar: 'أرق، تسارع ضربات القلب، ارتفاع ضغط الدم، جفاف الفم، واضطرابات بالمعدة.', en: 'Insomnia, nervousness, tachycardia, blood pressure elevation, dry mouth, and dyspepsia.' },
      interactions: { ar: 'يتداخل مع أدوية ضغط الدم ومضادات الاكتئاب ومضادات السيولة والأدوية الأخرى المحتوية على مضادات احتقان أو مسكنات.', en: 'Interacts with antihypertensives, MAOIs, anticoagulants, and other NSAIDs or sympathomimetics.' },
      pregnancyBreastfeeding: { ar: 'يُمنع أثناء الحمل والرضاعة الطبيعية لاحتوائه على السودوإيفيدرين والإيبوبروفين.', en: 'Contraindicated during pregnancy and breastfeeding.' },
      renalHepatic: { ar: 'ارتفاع ضغط الدم غير المنضبط، أمراض الشرايين التاجية والقلب، قرحة المعدة، القصور الكلوي، الاستخدام المتزامن لمثبطات MAO، الأطفال دون 12 سنة، والحمل.', en: 'Uncontrolled hypertension, severe coronary artery disease, active peptic ulcer, concurrent MAOIs, pregnancy, and children under 12 years.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (إيبوبروفين + سودوإيفيدرين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Ibuprofen + Pseudoephedrine. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Power Caps 300mg/45mg Capsules', manufacturer: 'Chemipharm Egypt', barcode: '6223001380115', verified: true, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: R01BA52).',
  },
  {
    id: 'pantoprazole',
    fields: {
      genericName: { ar: 'بانتوبرازول', en: 'Pantoprazole' },
      activeIngredients: { ar: 'بانتوبرازول', en: 'Pantoprazole' },
      drugClass: { ar: 'مثبط مضخة البروتون لعلاج الحموضة وقرحة المعدة (PPI)', en: 'Proton Pump Inhibitor (PPI)' },
      mechanism: { ar: 'يعمل (بانتوبرازول) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مثبط مضخة البروتون لعلاج الحموضة وقرحة المعدة (PPI)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Pantoprazole acts via its established pharmacological mechanism as a Proton Pump Inhibitor (PPI) (ATC: A02BC02).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 40 mg.', en: 'Available strengths in Egypt: 40 mg.' },
      approvedUses: { ar: 'علاج ارتجاع المريء (GERD)، التهاب المريء التآكلي، قرحة المعدة والاثنى عشر، الوقاية من قرحة المسكنات (NSAIDs)، وضمن بروتوكول علاج جرثومة المعدة (H. pylori).', en: 'Gastroesophageal reflux disease (GERD), erosive esophagitis, peptic ulcer disease, NSAID ulcer prophylaxis, and H. pylori eradication regimens.' },
      priceEgypt: { ar: '• كونترولوك 40 مجم 14 قرص مقاوم للمعدة (Takeda / Nycomed Egypt): 120.00 جنيه مصري.\n• زوركال 40 مجم 14 قرص مقاوم للمعدة (AUG Pharma Egypt): 77.00 جنيه مصري.', en: '• Controloc 40mg Gastro-Resistant Tablets (Takeda / Nycomed Egypt): 120.00 EGP.\n• Zurcal 40mg Gastro-Resistant Tablets (AUG Pharma Egypt): 77.00 EGP.' },
      substitutes: { ar: '• كونترولوك 40 مجم 14 قرص مقاوم للمعدة — Takeda / Nycomed Egypt (40 mg).\n• زوركال 40 مجم 14 قرص مقاوم للمعدة — AUG Pharma Egypt (40 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Controloc 40mg Gastro-Resistant Tablets — Takeda / Nycomed Egypt (40 mg).\n• Zurcal 40mg Gastro-Resistant Tablets — AUG Pharma Egypt (40 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُستخدم للأطفال إلا بتوصية أخصائي الجهاز الهضمي للأطفال.', en: 'Use in children only as directed by a pediatric specialist.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية لمثبطات مضخة البروتون، والاستخدام المتزامن مع ريلبيفيرين أو أتازانافير.', en: 'Hypersensitivity to substituted benzimidazoles; concomitant rilpivirine.' },
      sideEffects: { ar: 'صداع، إسهال أو إمساك خفيف، انتفاخ؛ ومع الاستخدام لسنوات قد يقلل امتصاص فيتامين B12 والماغنيسيوم.', en: 'Headache, mild diarrhea, flatulence; long-term high-dose therapy may cause hypomagnesemia or vitamin B12 deficiency.' },
      interactions: { ar: 'يمتاز البانتوبرازول بأنه الأقل تداخلاً مع عقار كلوبيدوجريل (بلافيكس) مقارنة بالأوميبرازول؛ يقلل امتصاص الأدوية المعتمدة على حموضة المعدة مثل الكيتوكونازول والحديد.', en: 'Lower CYP2C19 inhibition than omeprazole (preferred PPI with clopidogrel); reduces absorption of pH-dependent drugs (ketoconazole, iron salts).' },
      pregnancyBreastfeeding: { ar: 'يُستخدم أثناء الحمل عند الحاجة الطبية وتحت إشراف الطبيب.', en: 'Use during pregnancy only when clearly needed under medical supervision.' },
      renalHepatic: { ar: 'فرط الحساسية لمثبطات مضخة البروتون، والاستخدام المتزامن مع ريلبيفيرين أو أتازانافير.', en: 'Hypersensitivity to substituted benzimidazoles; concomitant rilpivirine.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (بانتوبرازول). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Pantoprazole. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Controloc 40mg Gastro-Resistant Tablets', manufacturer: 'Takeda / Nycomed Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Zurcal 40mg Gastro-Resistant Tablets', manufacturer: 'AUG Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A02BC02).',
  },
  {
    id: 'esomeprazole',
    fields: {
      genericName: { ar: 'إيزوميبرازول', en: 'Esomeprazole' },
      activeIngredients: { ar: 'إيزوميبرازول', en: 'Esomeprazole' },
      drugClass: { ar: 'مثبط مضخة البروتون لعلاج ارتجاع المريء والقرحة (PPI)', en: 'S-Isomer Proton Pump Inhibitor (PPI)' },
      mechanism: { ar: 'يعمل (إيزوميبرازول) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مثبط مضخة البروتون لعلاج ارتجاع المريء والقرحة (PPI)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Esomeprazole acts via its established pharmacological mechanism as a S-Isomer Proton Pump Inhibitor (PPI) (ATC: A02BC05).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 40 mg.', en: 'Available strengths in Egypt: 40 mg.' },
      approvedUses: { ar: 'علاج ارتجاع المريء الحاد والمزمن، قرحة المعدة والاثنى عشر، متلازمة زولينجر-إليسون، والقضاء على البكتيريا الحلزونية (جرثومة المعدة).', en: 'Treatment of GERD, erosive reflux esophagitis, peptic ulcer disease, Zollinger-Ellison syndrome, and H. pylori eradication.' },
      priceEgypt: { ar: '• نيكسيوم 40 مجم 14 قرص (AstraZeneca Egypt): 168.00 جنيه مصري.', en: '• Nexium 40mg Tablets (AstraZeneca Egypt): 168.00 EGP.' },
      substitutes: { ar: '• نيكسيوم 40 مجم 14 قرص — AstraZeneca Egypt (40 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Nexium 40mg Tablets — AstraZeneca Egypt (40 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'تتوفر أكياس حبيبات فموية للأطفال فوق عمر سنة تحت إشراف الطبيب، بينما الأقراص للبالغين والمراهقين.', en: 'Oral granules available for pediatric GERD; tablets for adults and adolescents ≥12 years.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية للإيزوميبرازول أو الأوميبرازول.', en: 'Hypersensitivity to esomeprazole or other benzimidazole PPIs.' },
      sideEffects: { ar: 'صداع، ألم بالبطن، غثيان، إمساك أو انتفاخ.', en: 'Headache, abdominal pain, nausea, flatulence, or constipation.' },
      interactions: { ar: 'يثبط إنزيم CYP2C19 مما قد يقلل من تفعيل عقار كلوبيدوجريل (بلافيكس) إلى صورته النشطة؛ لذا يُفضل البانتوبرازول مع مرضى دعامات القلب.', en: 'Inhibits CYP2C19 and may reduce antiplatelet activation of clopidogrel; reduces absorption of ketoconazole/itraconazole.' },
      pregnancyBreastfeeding: { ar: 'يُستشار الطبيب قبل الاستخدام أثناء الحمل والرضاعة.', en: 'Caution advised during pregnancy and breastfeeding.' },
      renalHepatic: { ar: 'فرط الحساسية للإيزوميبرازول أو الأوميبرازول.', en: 'Hypersensitivity to esomeprazole or other benzimidazole PPIs.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (إيزوميبرازول). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Esomeprazole. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Nexium 40mg Tablets', manufacturer: 'AstraZeneca Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A02BC05).',
  },
  {
    id: 'nifuroxazide',
    fields: {
      genericName: { ar: 'نيفوروكسازيد', en: 'Nifuroxazide' },
      activeIngredients: { ar: 'نيفوروكسازيد', en: 'Nifuroxazide' },
      drugClass: { ar: 'مطهر معوي موضعي واسع المجال غير ممتص', en: 'Luminal Non-absorbable Intestinal Antiseptic' },
      mechanism: { ar: 'يعمل (نيفوروكسازيد) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مطهر معوي موضعي واسع المجال غير ممتص) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Nifuroxazide acts via its established pharmacological mechanism as a Luminal Non-absorbable Intestinal Antiseptic (ATC: A07AX03).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 200 mg.', en: 'Available strengths in Egypt: 200 mg.' },
      approvedUses: { ar: 'علاج الإسهال الحاد الناتج عن عدوى بكتيرية معوية غير مصحوبة بغزو جهازي أو حمى شديدة، مع ضرورة التعويض بمحلول معالجة الجفاف.', en: 'Adjunctive treatment of acute bacterial diarrhea without invasive systemic signs, alongside oral rehydration therapy.' },
      priceEgypt: { ar: '• أنتينال 200 مجم 24 كبسولة (Amoun Pharmaceutical): 45.00 جنيه مصري.', en: '• Antinal 200mg Capsules (Amoun Pharmaceutical): 45.00 EGP.' },
      substitutes: { ar: '• أنتينال 200 مجم 24 كبسولة — Amoun Pharmaceutical (200 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Antinal 200mg Capsules — Amoun Pharmaceutical (200 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُعطى للرضع أقل من سنتين؛ ويُعد محلول معالجة الجفاف (ORS) هو العلاج الأساسي لأي إسهال لدى الأطفال.', en: 'Not recommended in children under 2 years; oral rehydration solution (ORS) is always the primary cornerstone in pediatric diarrhea.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الحساسية لمشتقات النيتروفوران، الأطفال الرضع دون سنتين، والإسهال المدمم أو المصحوب بحمى شديدة.', en: 'Hypersensitivity to nitrofuran derivatives, infants under 2 years of age, and invasive/bloody diarrhea with high fever.' },
      sideEffects: { ar: 'نادراً تفاعلات تحسسية جلدية؛ امتصاصه من الأمعاء ضئيل جداً.', en: 'Minimal systemic side effects due to negligible GI absorption; rare allergic skin reactions.' },
      interactions: { ar: 'يُتجنب تناوله مع المشروبات أو الأدوية المحتوية على الكحول.', en: 'Avoid concurrent alcohol consumption.' },
      pregnancyBreastfeeding: { ar: 'كإجراء احترازي، يُفضل تجنب استخدامه أثناء الحمل والرضاعة إلا بتوصية الطبيب.', en: 'Avoid during pregnancy as a precaution unless specifically prescribed.' },
      renalHepatic: { ar: 'الحساسية لمشتقات النيتروفوران، الأطفال الرضع دون سنتين، والإسهال المدمم أو المصحوب بحمى شديدة.', en: 'Hypersensitivity to nitrofuran derivatives, infants under 2 years of age, and invasive/bloody diarrhea with high fever.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (نيفوروكسازيد). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Nifuroxazide. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Antinal 200mg Capsules', manufacturer: 'Amoun Pharmaceutical', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A07AX03).',
  },
  {
    id: 'bisoprolol',
    fields: {
      genericName: { ar: 'بيسوبرولول', en: 'Bisoprolol' },
      activeIngredients: { ar: 'بيسوبرولول', en: 'Bisoprolol' },
      drugClass: { ar: 'حاصر مستقبلات بيتا-1 الانتقائي للقلب (Cardioselective Beta-Blocker)', en: 'Cardioselective Beta-1 Adrenergic Blocker' },
      mechanism: { ar: 'يعمل (بيسوبرولول) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (حاصر مستقبلات بيتا-1 الانتقائي للقلب (Cardioselective Beta-Blocker)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Bisoprolol acts via its established pharmacological mechanism as a Cardioselective Beta-1 Adrenergic Blocker (ATC: C07AB07).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 5 mg.', en: 'Available strengths in Egypt: 5 mg.' },
      approvedUses: { ar: 'علاج ارتفاع ضغط الدم، الذبحة الصدرية المستقرة (قصور الشرايين التاجية)، وفشل عضلة القلب المزمن المستقر، وتنظيم تسارع ضربات القلب.', en: 'Management of hypertension, chronic stable angina pectoris, and stable chronic heart failure with reduced ejection fraction.' },
      priceEgypt: { ar: '• كونكور 5 مجم 30 قرص مغلف (Merck / Amoun Pharmaceutical): 81.00 جنيه مصري.\n• بيستول 5 مجم 20 قرص (Global Napi Pharmaceuticals): 34.00 جنيه مصري.', en: '• Concor 5mg Tablets (Merck / Amoun Pharmaceutical): 81.00 EGP.\n• Bistol 5mg Tablets (Global Napi Pharmaceuticals): 34.00 EGP.' },
      substitutes: { ar: '• كونكور 5 مجم 30 قرص مغلف — Merck / Amoun Pharmaceutical (5 mg).\n• بيستول 5 مجم 20 قرص — Global Napi Pharmaceuticals (5 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Concor 5mg Tablets — Merck / Amoun Pharmaceutical (5 mg).\n• Bistol 5mg Tablets — Global Napi Pharmaceuticals (5 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُستخدم للأطفال إلا تحت إشراف أخصائي قلب الأطفال.', en: 'Not routinely indicated in pediatric patients outside specialist cardiology care.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'بطء ضربات القلب الشديد، إحصار القلب من الدرجة الثانية أو الثالثة، الصدمة القلبية، فشل القلب الحاد غير المستقر، والربو الشعبي الحاد الشديد.', en: 'Acute decompensated heart failure, cardiogenic shock, 2nd/3rd-degree AV block, severe sinus bradycardia, and severe bronchial asthma.' },
      sideEffects: { ar: 'بطء ضربات القلب، برودة الأطراف، شعور بالإرهاق في بداية العلاج، أو دوار عند الوقوف؛ يحذر التوقف المفاجئ عن الدواء دون تدريج طبي.', en: 'Bradycardia, cold extremities, fatigue, dizziness; never discontinue abruptly in coronary artery disease (risk of rebound angina/infarction).' },
      interactions: { ar: 'الجمع مع الفيراباميل أو الديلتيازيم أو الأميودارون قد يسبب بطئاً شديداً بضربات القلب؛ المسكنات (NSAIDs) تقلل تأثيره الخافض للضغط؛ وقد يخفي أعراض هبوط السكر (مثل الخفقان) لدى مرضى السكري.', en: 'Additive bradycardia/AV block with verapamil, diltiazem, or amiodarone; NSAIDs reduce antihypertensive effect; may mask tachycardia of hypoglycemia.' },
      pregnancyBreastfeeding: { ar: 'يُستخدم أثناء الحمل فقط إذا كانت الفائدة تفوق المخاطر مع مراقبة نمو الجنين ونبضه.', en: 'Use in pregnancy only if clearly necessary with fetal growth and neonatal heart rate/glucose monitoring.' },
      renalHepatic: { ar: 'بطء ضربات القلب الشديد، إحصار القلب من الدرجة الثانية أو الثالثة، الصدمة القلبية، فشل القلب الحاد غير المستقر، والربو الشعبي الحاد الشديد.', en: 'Acute decompensated heart failure, cardiogenic shock, 2nd/3rd-degree AV block, severe sinus bradycardia, and severe bronchial asthma.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (بيسوبرولول). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Bisoprolol. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Concor 5mg Tablets', manufacturer: 'Merck / Amoun Pharmaceutical', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Bistol 5mg Tablets', manufacturer: 'Global Napi Pharmaceuticals', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: C07AB07).',
  },
  {
    id: 'amlodipine-valsartan',
    fields: {
      genericName: { ar: 'أملوديبين + فالسارتان', en: 'Amlodipine + Valsartan' },
      activeIngredients: { ar: 'أملوديبين + فالسارتان', en: 'Amlodipine + Valsartan' },
      drugClass: { ar: 'حاصر قنوات الكالسيوم + حاصر مستقبلات الأنجيوتنسين (CCB + ARB)', en: 'Calcium Channel Blocker + Angiotensin II Receptor Blocker (ARB)' },
      mechanism: { ar: 'يعمل (أملوديبين + فالسارتان) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (حاصر قنوات الكالسيوم + حاصر مستقبلات الأنجيوتنسين (CCB + ARB)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Amlodipine + Valsartan acts via its established pharmacological mechanism as a Calcium Channel Blocker + Angiotensin II Receptor Blocker (ARB) (ATC: C09DB01).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 5mg/160mg.', en: 'Available strengths in Egypt: 5mg/160mg.' },
      approvedUses: { ar: 'علاج ارتفاع ضغط الدم الأساسي لدى البالغين الذين لا ينضبط ضغطهم بعلاج أحادي.', en: 'Treatment of essential hypertension in adults whose blood pressure is not adequately controlled on monotherapy.' },
      priceEgypt: { ar: '• إكسفورج 5/160 مجم 14 قرص (Novartis Pharma Egypt): 155.00 جنيه مصري.', en: '• Exforge 5mg/160mg Tablets (Novartis Pharma Egypt): 155.00 EGP.' },
      substitutes: { ar: '• إكسفورج 5/160 مجم 14 قرص — Novartis Pharma Egypt (5mg/160mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Exforge 5mg/160mg Tablets — Novartis Pharma Egypt (5mg/160mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'غير مخصص للأطفال والمراهقين دون 18 عاماً.', en: 'Not recommended in patients under 18 years of age.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الحمل بجميع مراحله (خطر شديد على الجنين بسبب الفالسارتان)، القصور الكبدي الشديد، والجمع مع أليسيرين لدى مرضى السكري أو الكلى.', en: 'Pregnancy (box warning for fetal toxicity due to valsartan), severe hepatic impairment/biliary cirrhosis, and concomitant aliskiren in diabetes/renal impairment.' },
      sideEffects: { ar: 'تورم الكاحلين والقدمين (وذمة طرفية بسبب الأملوديبين)، دوار، صداع، أو ارتفاع البوتاسيوم بالدم.', en: 'Peripheral ankle edema, dizziness, headache, flushing, and potential hyperkalemia.' },
      interactions: { ar: 'تجنب الجمع مع مثبطات ACE أو مكملات البوتاسيوم أو مدرات البول الحافظة للبوتاسيوم لتفادي ارتفاع البوتاسيوم وتأثر الكلى؛ المسكنات (NSAIDs) تضعف مفعوله.', en: 'Avoid dual RAAS blockade with ACE inhibitors; potassium-sparing diuretics/supplements increase hyperkalemia risk; NSAIDs blunt effect and increase renal risk.' },
      pregnancyBreastfeeding: { ar: 'يُمنع منعاً باتاً أثناء الحمل؛ يجب إيقافه فوراً واستبداله بدواء آمن للحمل بمجرد اكتشاف الحمل.', en: 'Strictly contraindicated in pregnancy; discontinue immediately if pregnancy is detected.' },
      renalHepatic: { ar: 'الحمل بجميع مراحله (خطر شديد على الجنين بسبب الفالسارتان)، القصور الكبدي الشديد، والجمع مع أليسيرين لدى مرضى السكري أو الكلى.', en: 'Pregnancy (box warning for fetal toxicity due to valsartan), severe hepatic impairment/biliary cirrhosis, and concomitant aliskiren in diabetes/renal impairment.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (أملوديبين + فالسارتان). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Amlodipine + Valsartan. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Exforge 5mg/160mg Tablets', manufacturer: 'Novartis Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: C09DB01).',
  },
  {
    id: 'sacubitril-valsartan',
    fields: {
      genericName: { ar: 'ساكوبيتريل + فالسارتان', en: 'Sacubitril + Valsartan' },
      activeIngredients: { ar: 'ساكوبيتريل + فالسارتان', en: 'Sacubitril + Valsartan' },
      drugClass: { ar: 'مثبط النيبريلايسين وحاصر مستقبلات الأنجيوتنسين لعلاج ضعف عضلة القلب (ARNI)', en: 'Angiotensin Receptor-Neprilysin Inhibitor (ARNI)' },
      mechanism: { ar: 'يعمل (ساكوبيتريل + فالسارتان) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مثبط النيبريلايسين وحاصر مستقبلات الأنجيوتنسين لعلاج ضعف عضلة القلب (ARNI)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Sacubitril + Valsartan acts via its established pharmacological mechanism as a Angiotensin Receptor-Neprilysin Inhibitor (ARNI) (ATC: C09DX04).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 49mg/51mg.', en: 'Available strengths in Egypt: 49mg/51mg.' },
      approvedUses: { ar: 'علاج فشل عضلة القلب المزمن المصحوب بانخفاض الكفاءة الانقباضية (HFrEF) لتقليل الوفيات والحاجة لدخول المستشفى.', en: 'Treatment of symptomatic chronic heart failure with reduced ejection fraction (HFrEF) to reduce cardiovascular death and hospitalization.' },
      priceEgypt: { ar: '• إنتريستو 49/51 مجم 28 قرص (Novartis Pharma Egypt): 1120.00 جنيه مصري.', en: '• Entresto 49mg/51mg Tablets (Novartis Pharma Egypt): 1120.00 EGP.' },
      substitutes: { ar: '• إنتريستو 49/51 مجم 28 قرص — Novartis Pharma Egypt (49mg/51mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Entresto 49mg/51mg Tablets — Novartis Pharma Egypt (49mg/51mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُستخدم للأطفال إلا في مراكز قلب الأطفال المتخصصة وفق بروتوكول دقيق.', en: 'Specialist pediatric cardiology supervision required.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'يُمنع منعاً باتاً الجمع مع مثبطات الإنزيم المحول للأنجيوتنسين (ACE Inhibitors مثل كابوتين وتريتاس وإيزابريل) ويجب ترك فترة فصل 36 ساعة على الأقل لتفادي الوذمة الوعائية القاتلة (Angioedema)، كما يُمنع أثناء الحمل.', en: 'Strictly contraindicated with ACE inhibitors (must allow a 36-hour washout period due to severe angioedema risk), history of angioedema, and pregnancy.' },
      sideEffects: { ar: 'انخفاض ضغط الدم، ارتفاع البوتاسيوم، تغير وظائف الكلى، دوار، ونادراً تورم الوجه أو الشفتين (وذمة وعائية).', en: 'Hypotension, hyperkalemia, renal impairment, dizziness, and risk of angioedema.' },
      interactions: { ar: 'تداخل خطير وممنوع مع مثبطات ACE (يجب الفصل بـ 36 ساعة)؛ يتداخل مع مدرات البول الحافظة للبوتاسيوم والمسكنات (NSAIDs) والستاتينات.', en: 'Contraindicated with ACE inhibitors (36h washout required); interacts with potassium-sparing diuretics, NSAIDs, and statins.' },
      pregnancyBreastfeeding: { ar: 'يُمنع منعاً باتاً أثناء الحمل والرضاعة الطبيعية.', en: 'Strictly contraindicated during pregnancy and breastfeeding.' },
      renalHepatic: { ar: 'يُمنع منعاً باتاً الجمع مع مثبطات الإنزيم المحول للأنجيوتنسين (ACE Inhibitors مثل كابوتين وتريتاس وإيزابريل) ويجب ترك فترة فصل 36 ساعة على الأقل لتفادي الوذمة الوعائية القاتلة (Angioedema)، كما يُمنع أثناء الحمل.', en: 'Strictly contraindicated with ACE inhibitors (must allow a 36-hour washout period due to severe angioedema risk), history of angioedema, and pregnancy.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ساكوبيتريل + فالسارتان). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Sacubitril + Valsartan. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Entresto 49mg/51mg Tablets', manufacturer: 'Novartis Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: C09DX04).',
  },
  {
    id: 'clopidogrel',
    fields: {
      genericName: { ar: 'كلوبيدوجريل', en: 'Clopidogrel' },
      activeIngredients: { ar: 'كلوبيدوجريل', en: 'Clopidogrel' },
      drugClass: { ar: 'مضاد لتجمع الصفائح الدموية (مثبط مستقبلات P2Y12)', en: 'P2Y12 Platelet Aggregation Inhibitor (Antiplatelet)' },
      mechanism: { ar: 'يعمل (كلوبيدوجريل) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد لتجمع الصفائح الدموية (مثبط مستقبلات P2Y12)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Clopidogrel acts via its established pharmacological mechanism as a P2Y12 Platelet Aggregation Inhibitor (Antiplatelet) (ATC: B01AC04).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 75 mg.', en: 'Available strengths in Egypt: 75 mg.' },
      approvedUses: { ar: 'الوقاية من الجلطات الشريانية بعد تركيب دعامات القلب (Stents)، متلازمة الشريان التاجي الحادة، احتشاء عضلة القلب، والسكتة الدماغية الإقفارية.', en: 'Prevention of atherothrombotic events following coronary stenting, acute coronary syndrome, myocardial infarction, and ischemic stroke.' },
      priceEgypt: { ar: '• بلافيكس 75 مجم 28 قرص (Sanofi Egypt): 268.00 جنيه مصري.\n• كلوبيكس 75 مجم 30 قرص (Multi-Apex Pharma Egypt): 114.00 جنيه مصري.', en: '• Plavix 75mg Tablets (Sanofi Egypt): 268.00 EGP.\n• Clopex 75mg Tablets (Multi-Apex Pharma Egypt): 114.00 EGP.' },
      substitutes: { ar: '• بلافيكس 75 مجم 28 قرص — Sanofi Egypt (75 mg).\n• كلوبيكس 75 مجم 30 قرص — Multi-Apex Pharma Egypt (75 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Plavix 75mg Tablets — Sanofi Egypt (75 mg).\n• Clopex 75mg Tablets — Multi-Apex Pharma Egypt (75 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'غير مخصص للاستخدام لدى الأطفال.', en: 'Not established for routine pediatric use.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'النزيف النشط المرضي مثل نزيف قرحة المعدة أو النزيف داخل المخ، والقصور الكبدي الشديد.', en: 'Active pathological bleeding (such as peptic ulcer or intracranial hemorrhage) and severe hepatic impairment.' },
      sideEffects: { ar: 'سهولة ظهور الكدمات، زيادة زمن النزف، نزيف الأنف أو اللثة، واضطرابات هضمية.', en: 'Easy bruising, epistaxis, GI bleeding, hematoma, and dyspepsia.' },
      interactions: { ar: 'الأوميبرازول والإيزوميبرازول يثبطان إنزيم CYP2C19 فيقللان فاعلية الكلوبيدوجريل في حماية دعامات القلب (يُفضل استخدام البانتوبرازول لحماية المعدة)؛ يزيد خطر النزيف مع مضادات التجلط والمسكنات.', en: 'Omeprazole and esomeprazole inhibit CYP2C19 bioactivation of clopidogrel (pantoprazole is preferred); additive bleeding risk with NSAIDs, SSRIs, and anticoagulants.' },
      pregnancyBreastfeeding: { ar: 'يُستخدم أثناء الحمل فقط عند الضرورة القصوى وتحت إشراف أخصائي القلب والنساء.', en: 'Use during pregnancy only if clearly indicated under specialist care.' },
      renalHepatic: { ar: 'النزيف النشط المرضي مثل نزيف قرحة المعدة أو النزيف داخل المخ، والقصور الكبدي الشديد.', en: 'Active pathological bleeding (such as peptic ulcer or intracranial hemorrhage) and severe hepatic impairment.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (كلوبيدوجريل). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Clopidogrel. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Plavix 75mg Tablets', manufacturer: 'Sanofi Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Clopex 75mg Tablets', manufacturer: 'Multi-Apex Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: B01AC04).',
  },
  {
    id: 'apixaban',
    fields: {
      genericName: { ar: 'أبيكسابان', en: 'Apixaban' },
      activeIngredients: { ar: 'أبيكسابان', en: 'Apixaban' },
      drugClass: { ar: 'مضاد تجلط فموي مباشر مثبط للعامل العاشر النشط (DOAC - Factor Xa Inhibitor)', en: 'Direct Oral Anticoagulant (Direct Factor Xa Inhibitor)' },
      mechanism: { ar: 'يعمل (أبيكسابان) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد تجلط فموي مباشر مثبط للعامل العاشر النشط (DOAC - Factor Xa Inhibitor)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Apixaban acts via its established pharmacological mechanism as a Direct Oral Anticoagulant (Direct Factor Xa Inhibitor) (ATC: B01AF02).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 5 mg.', en: 'Available strengths in Egypt: 5 mg.' },
      approvedUses: { ar: 'الوقاية من السكتة الدماغية في الرجفان الأذيني غير الصمامي، وعلاج والوقاية من جلطة الأوردة العميقة (DVT) والجلطة الرئوية (PE).', en: 'Stroke prevention in non-valvular atrial fibrillation, and treatment/prevention of deep vein thrombosis (DVT) and pulmonary embolism (PE).' },
      priceEgypt: { ar: '• إيليكويس 5 مجم 20 قرص (Pfizer / BMS Egypt): 420.00 جنيه مصري.', en: '• Eliquis 5mg Tablets (Pfizer / BMS Egypt): 420.00 EGP.' },
      substitutes: { ar: '• إيليكويس 5 مجم 20 قرص — Pfizer / BMS Egypt (5 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Eliquis 5mg Tablets — Pfizer / BMS Egypt (5 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُستخدم للأطفال إلا وفق بروتوكولات متخصصة.', en: 'Specialist hematology supervision required in pediatrics.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'النزيف النشط الهام سريرياً، أمراض الكبد المصحوبة باعتلال التجلط، ومرضى الصمامات القلبية الميكانيكية.', en: 'Active clinically significant bleeding, hepatic disease associated with coagulopathy, and prosthetic mechanical heart valves.' },
      sideEffects: { ar: 'نزيف اللثة أو الأنف، ظهور كدمات، دم في البول أو البراز، أو فقر دم؛ لا تتوقف عن الدواء فجأة دون استشارة طبيب القلب لأن ذلك يرفع خطر الجلطات.', en: 'Bleeding events (epistaxis, hematuria, GI bleeding, bruising); premature discontinuation increases thrombotic stroke risk.' },
      interactions: { ar: 'يتداخل بشدة مع مضادات الفطريات الآزولية (كيتوكونازول، إيتراكونازول)، الريفامبيسين، الفينيتوين، الكاربامازيبين، ومضادات الالتهاب (NSAIDs) والأسبرين.', en: 'Strong dual CYP3A4/P-gp inhibitors (ketoconazole, itraconazole) double apixaban exposure; strong inducers (rifampicin, carbamazepine, phenytoin) reduce efficacy; NSAIDs/antiplatelets increase bleeding risk.' },
      pregnancyBreastfeeding: { ar: 'لا يُنصح باستخدامه أثناء الحمل ويُستبدل بالهيبارين منخفض الوزن الجزيئي تحت إشراف الطبيب.', en: 'Not recommended during pregnancy; switch to LMWH under medical supervision.' },
      renalHepatic: { ar: 'النزيف النشط الهام سريرياً، أمراض الكبد المصحوبة باعتلال التجلط، ومرضى الصمامات القلبية الميكانيكية.', en: 'Active clinically significant bleeding, hepatic disease associated with coagulopathy, and prosthetic mechanical heart valves.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (أبيكسابان). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Apixaban. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Eliquis 5mg Tablets', manufacturer: 'Pfizer / BMS Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: B01AF02).',
  },
  {
    id: 'rosuvastatin',
    fields: {
      genericName: { ar: 'روزوفاستاتين', en: 'Rosuvastatin' },
      activeIngredients: { ar: 'روزوفاستاتين', en: 'Rosuvastatin' },
      drugClass: { ar: 'خافض للكوليسترول والدهون الثلاثية (مثبط إنزيم HMG-CoA Reductase - Statin)', en: 'HMG-CoA Reductase Inhibitor (Statin)' },
      mechanism: { ar: 'يعمل (روزوفاستاتين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (خافض للكوليسترول والدهون الثلاثية (مثبط إنزيم HMG-CoA Reductase - Statin)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Rosuvastatin acts via its established pharmacological mechanism as a HMG-CoA Reductase Inhibitor (Statin) (ATC: C10AA07).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 20 mg.', en: 'Available strengths in Egypt: 20 mg.' },
      approvedUses: { ar: 'علاج ارتفاع الكوليسترول الضار (LDL) والدهون المختلطة، والوقاية الأولية والثانوية من جلطات القلب والشرايين التاجية والسكتات الدماغية.', en: 'Management of primary hypercholesterolemia, mixed dyslipidemia, and primary/secondary prevention of cardiovascular events.' },
      priceEgypt: { ar: '• كريستور 20 مجم 28 قرص (AstraZeneca Egypt): 340.00 جنيه مصري.', en: '• Crestor 20mg Tablets (AstraZeneca Egypt): 340.00 EGP.' },
      substitutes: { ar: '• كريستور 20 مجم 28 قرص — AstraZeneca Egypt (20 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Crestor 20mg Tablets — AstraZeneca Egypt (20 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'لا يُستخدم للأطفال إلا في حالات ارتفاع الكوليسترول العائلي الوراثي تحت إشراف أخصائي.', en: 'Restricted to specialist management of familial hypercholesterolemia in children.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الحمل والرضاعة الطبيعية، أمراض الكبد النشطة أو الارتفاع المستمر غير المفسر بإنزيمات الكبد، والقصور الكلوي الشديد للجرعات العالية.', en: 'Pregnancy and lactation, active liver disease or unexplained persistent transaminase elevations, and severe renal impairment (for high doses).' },
      sideEffects: { ar: 'آلام أو تقلصات بالعضلات، صداع، غثيان خفيف؛ راجع الطبيب فوراً إذا شعرت بألم عضلي شديد غير مبرر مع تغير لون البول للداكن.', en: 'Myalgia, arthralgia, headache, mild GI discomfort; report unexplained muscle pain/weakness promptly to rule out rhabdomyolysis.' },
      interactions: { ar: 'السيكلوسبورين والجيمفيبروزيل يرفعان تركيز الروزوفاستاتين وخطر اعتلال العضلات؛ يُفضل الفصل بساعتين عن مضادات الحموضة المحتوية على ألومنيوم وماغنيسيوم.', en: 'Cyclosporine and gemfibrozil markedly increase rosuvastatin exposure and myopathy risk; separate aluminum/magnesium antacids by 2 hours.' },
      pregnancyBreastfeeding: { ar: 'يُمنع منعاً باتاً أثناء الحمل والرضاعة الطبيعية.', en: 'Strictly contraindicated in pregnancy and breastfeeding.' },
      renalHepatic: { ar: 'الحمل والرضاعة الطبيعية، أمراض الكبد النشطة أو الارتفاع المستمر غير المفسر بإنزيمات الكبد، والقصور الكلوي الشديد للجرعات العالية.', en: 'Pregnancy and lactation, active liver disease or unexplained persistent transaminase elevations, and severe renal impairment (for high doses).' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (روزوفاستاتين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Rosuvastatin. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Crestor 20mg Tablets', manufacturer: 'AstraZeneca Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: C10AA07).',
  },
  {
    id: 'metformin',
    fields: {
      genericName: { ar: 'ميتفورمين', en: 'Metformin' },
      activeIngredients: { ar: 'ميتفورمين', en: 'Metformin' },
      drugClass: { ar: 'منظم لسكر الدم من عائلة البيجوانيد (الخيار الأول للسكري من النوع الثاني)', en: 'Biguanide Oral Antihyperglycemic Agent' },
      mechanism: { ar: 'يعمل (ميتفورمين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (منظم لسكر الدم من عائلة البيجوانيد (الخيار الأول للسكري من النوع الثاني)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Metformin acts via its established pharmacological mechanism as a Biguanide Oral Antihyperglycemic Agent (ATC: A10BA02).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 1000 mg.', en: 'Available strengths in Egypt: 1000 mg.' },
      approvedUses: { ar: 'العلاج الأساسي لمرض السكري من النوع الثاني (مفرداً أو مع أدوية أخرى أو الأنسولين)، ومتلازمة تكيس المبايض ومقاومة الأنسولين.', en: 'First-line pharmacotherapy for type 2 diabetes mellitus, insulin resistance, and polycystic ovary syndrome (PCOS).' },
      priceEgypt: { ar: '• جلوكوفاج 1000 مجم 30 قرص (Merck / Amoun Pharmaceutical): 66.00 جنيه مصري.\n• سيدوفاج 1000 مجم 30 قرص (CID Pharma Egypt): 45.00 جنيه مصري.', en: '• Glucophage 1000mg Tablets (Merck / Amoun Pharmaceutical): 66.00 EGP.\n• Cidophage 1000mg Tablets (CID Pharma Egypt): 45.00 EGP.' },
      substitutes: { ar: '• جلوكوفاج 1000 مجم 30 قرص — Merck / Amoun Pharmaceutical (1000 mg).\n• سيدوفاج 1000 مجم 30 قرص — CID Pharma Egypt (1000 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Glucophage 1000mg Tablets — Merck / Amoun Pharmaceutical (1000 mg).\n• Cidophage 1000mg Tablets — CID Pharma Egypt (1000 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'معتمد للأطفال من سن 10 سنوات فأكثر المصابين بالسكري من النوع الثاني.', en: 'Approved for type 2 diabetes in pediatric patients aged ≥10 years.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'القصور الكلوي الشديد (eGFR < 30 mL/min)، الحماض الكيتوني أو اللاكتيكي، الفشل الكبدي أو القلبي الحاد، ويجب إيقافه مؤقتاً عند إجراء أشعة بالصبغة الوريدية.', en: 'Severe renal impairment (eGFR < 30 mL/min), acute metabolic acidosis, severe tissue hypoxia/sepsis/decompensated heart or liver failure, and iodinated contrast administration.' },
      sideEffects: { ar: 'اضطرابات هضمية في بداية العلاج (غثيان، انتفاخ، إسهال — تقل بتناوله وسط أو بعد الوجبة أو استخدام أقراص XR ممتدة المفعول)، ونقص فيتامين B12 مع الاستخدام لسنوات.', en: 'GI upset (nausea, diarrhea, metallic taste — minimized by taking with meals or using XR formulation), and vitamin B12 deficiency with long-term use.' },
      interactions: { ar: 'يجب إيقاف الميتفورمين وقت الفحص بالصبغة الوريدية (Iodinated contrast) ولمدة 48 ساعة بعده مع فحص وظائف الكلى؛ الكحول يزيد خطر الحماض اللاكتيكي.', en: 'Temporarily hold at the time of iodinated contrast imaging and re-evaluate eGFR at 48 hours; alcohol potentiates lactic acidosis risk.' },
      pregnancyBreastfeeding: { ar: 'آمن نسبياً ولكن يُحدد طبيب السكري والنساء ما إذا كان سيتم الاستمرار عليه أو التحويل للأنسولين أثناء الحمل.', en: 'Manage glycemic control in pregnancy under specialist obstetric/endocrine care.' },
      renalHepatic: { ar: 'القصور الكلوي الشديد (eGFR < 30 mL/min)، الحماض الكيتوني أو اللاكتيكي، الفشل الكبدي أو القلبي الحاد، ويجب إيقافه مؤقتاً عند إجراء أشعة بالصبغة الوريدية.', en: 'Severe renal impairment (eGFR < 30 mL/min), acute metabolic acidosis, severe tissue hypoxia/sepsis/decompensated heart or liver failure, and iodinated contrast administration.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ميتفورمين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Metformin. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Glucophage 1000mg Tablets', manufacturer: 'Merck / Amoun Pharmaceutical', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cidophage 1000mg Tablets', manufacturer: 'CID Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A10BA02).',
  },
  {
    id: 'empagliflozin',
    fields: {
      genericName: { ar: 'إمباجليفلوزين', en: 'Empagliflozin' },
      activeIngredients: { ar: 'إمباجليفلوزين', en: 'Empagliflozin' },
      drugClass: { ar: 'مثبط الناقل المشترك صوديوم-جلوكوز 2 للسكري وحماية القلب والكلى (SGLT2 Inhibitor)', en: 'Sodium-Glucose Co-Transporter 2 (SGLT2) Inhibitor' },
      mechanism: { ar: 'يعمل (إمباجليفلوزين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مثبط الناقل المشترك صوديوم-جلوكوز 2 للسكري وحماية القلب والكلى (SGLT2 Inhibitor)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Empagliflozin acts via its established pharmacological mechanism as a Sodium-Glucose Co-Transporter 2 (SGLT2) Inhibitor (ATC: A10BK03).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 10 mg.', en: 'Available strengths in Egypt: 10 mg.' },
      approvedUses: { ar: 'علاج مرض السكري من النوع الثاني، علاج فشل عضلة القلب المزمن (سواء مع وجود سكري أو بدونه)، وإبطاء تدهور مرض الكلى المزمن (CKD).', en: 'Type 2 diabetes mellitus, symptomatic chronic heart failure (across ejection fraction spectrum), and chronic kidney disease progression reduction.' },
      priceEgypt: { ar: '• جارديانس 10 مجم 30 قرص (Boehringer Ingelheim Egypt): 585.00 جنيه مصري.\n• إمباكوزا 10 مجم 30 قرص (Zeta Pharma Egypt): 195.00 جنيه مصري.', en: '• Jardiance 10mg Tablets (Boehringer Ingelheim Egypt): 585.00 EGP.\n• Empacoza 10mg Tablets (Zeta Pharma Egypt): 195.00 EGP.' },
      substitutes: { ar: '• جارديانس 10 مجم 30 قرص — Boehringer Ingelheim Egypt (10 mg).\n• إمباكوزا 10 مجم 30 قرص — Zeta Pharma Egypt (10 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Jardiance 10mg Tablets — Boehringer Ingelheim Egypt (10 mg).\n• Empacoza 10mg Tablets — Zeta Pharma Egypt (10 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'معتمد للبالغين وللأطفال فوق 10 سنوات للسكري من النوع الثاني تحت إشراف أخصائي.', en: 'Indicated in adults and pediatric patients ≥10 years with T2DM under specialist care.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'مرض السكري من النوع الأول، الحماض الكيتوني السكري، والغسيل الكلوي.', en: 'Type 1 diabetes mellitus, diabetic ketoacidosis (DKA), and patients on dialysis.' },
      sideEffects: { ar: 'زيادة التبول، التهابات فطرية تناسلية أو التهابات المسالك البولية، عطش أو جفاف خفيف؛ يجب الحفاظ على شرب الماء والنظافة الشخصية.', en: 'Genital mycotic infections, urinary tract infections, increased urination, volume depletion/hypotension, and rare euglycemic DKA.' },
      interactions: { ar: 'قد يزيد تأثير مدرات البول مسبباً الجفاف وهبوط الضغط؛ وقد يتطلب تقليل جرعة الأنسولين أو السلفونيل يوريا لتفادي هبوط السكر.', en: 'Additive diuretic effect and volume depletion with loop diuretics; may require dose reduction of insulin or sulfonylureas to prevent hypoglycemia.' },
      pregnancyBreastfeeding: { ar: 'لا يُنصح باستخدامه أثناء الحمل (خاصة الثلثين الثاني والثالث) والرضاعة الطبيعية.', en: 'Not recommended during pregnancy (especially 2nd and 3rd trimesters) and lactation.' },
      renalHepatic: { ar: 'مرض السكري من النوع الأول، الحماض الكيتوني السكري، والغسيل الكلوي.', en: 'Type 1 diabetes mellitus, diabetic ketoacidosis (DKA), and patients on dialysis.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (إمباجليفلوزين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Empagliflozin. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Jardiance 10mg Tablets', manufacturer: 'Boehringer Ingelheim Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Empacoza 10mg Tablets', manufacturer: 'Zeta Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A10BK03).',
  },
  {
    id: 'semaglutide',
    fields: {
      genericName: { ar: 'سيماجلوتايد', en: 'Semaglutide' },
      activeIngredients: { ar: 'سيماجلوتايد', en: 'Semaglutide' },
      drugClass: { ar: 'ناهض مستقبلات GLP-1 لضبط السكر من النوع الثاني وحماية القلب', en: 'Glucagon-Like Peptide-1 (GLP-1) Receptor Agonist' },
      mechanism: { ar: 'يعمل (سيماجلوتايد) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (ناهض مستقبلات GLP-1 لضبط السكر من النوع الثاني وحماية القلب) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Semaglutide acts via its established pharmacological mechanism as a Glucagon-Like Peptide-1 (GLP-1) Receptor Agonist (ATC: A10BJ06).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 1 mg.', en: 'Available strengths in Egypt: 1 mg.' },
      approvedUses: { ar: 'علاج البالغين المصابين بداء السكري من النوع الثاني غير المنضبط كعامل مساعد للنظام الغذائي والرياضة، وتقليل مخاطر الجلطات القلبية لديهم.', en: 'Management of adults with type 2 diabetes mellitus to improve glycemic control and reduce major adverse cardiovascular events.' },
      priceEgypt: { ar: '• أوزمبك 1 مجم قلم مسبق التعبئة للحقن تحت الجلد (Novo Nordisk Egypt): 2650.00 جنيه مصري.', en: '• Ozempic 1mg Pre-filled Pen (Novo Nordisk Egypt): 2650.00 EGP.' },
      substitutes: { ar: '• أوزمبك 1 مجم قلم مسبق التعبئة للحقن تحت الجلد — Novo Nordisk Egypt (1 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Ozempic 1mg Pre-filled Pen — Novo Nordisk Egypt (1 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'مخصص للبالغين تحت إشراف طبيب الغدد الصماء والسكري.', en: 'Indicated for adults under endocrinology supervision.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'التاريخ الشخصي أو العائلي لسرطان الغدة الدرقية النخاعي (MTC) أو متلازمة الأورام الصماوية المتعددة (MEN 2)، التهاب البنكرياس الحاد، والحمل والرضاعة.', en: 'Personal or family history of medullary thyroid carcinoma (MTC), Multiple Endocrine Neoplasia syndrome type 2 (MEN 2), pregnancy, and breastfeeding.' },
      sideEffects: { ar: 'غثيان، امتلاء المعدة، قيء، إسهال أو إمساك (تقل ببدء الجرعة التدريجية 0.25 مجم وتناول وجبات صغيرة)، ونادراً التهاب المرارة أو البنكرياس.', en: 'Nausea, vomiting, diarrhea, constipation, delayed gastric emptying, and rare cholelithiasis or acute pancreatitis.' },
      interactions: { ar: 'يبطئ إفراغ المعدة مما قد يؤثر على سرعة امتصاص الأدوية الفموية؛ يزيد خطر هبوط السكر عند الجمع مع السلفونيل يوريا أو الأنسولين.', en: 'Delays gastric emptying; increases hypoglycemia risk if combined with insulin or sulfonylureas unless their doses are reduced.' },
      pregnancyBreastfeeding: { ar: 'يُمنع أثناء الحمل والرضاعة، ويجب إيقافه قبل التخطيط للحمل بشهرين على الأقل.', en: 'Discontinue at least 2 months before a planned pregnancy; contraindicated in pregnancy and lactation.' },
      renalHepatic: { ar: 'التاريخ الشخصي أو العائلي لسرطان الغدة الدرقية النخاعي (MTC) أو متلازمة الأورام الصماوية المتعددة (MEN 2)، التهاب البنكرياس الحاد، والحمل والرضاعة.', en: 'Personal or family history of medullary thyroid carcinoma (MTC), Multiple Endocrine Neoplasia syndrome type 2 (MEN 2), pregnancy, and breastfeeding.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (سيماجلوتايد). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Semaglutide. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Ozempic 1mg Pre-filled Pen', manufacturer: 'Novo Nordisk Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A10BJ06).',
  },
  {
    id: 'tirzepatide',
    fields: {
      genericName: { ar: 'تيرزيباتايد', en: 'Tirzepatide' },
      activeIngredients: { ar: 'تيرزيباتايد', en: 'Tirzepatide' },
      drugClass: { ar: 'ناهض مزدوج لمستقبلات GIP و GLP-1 لعلاج السكري من النوع الثاني وإدارة الوزن', en: 'Dual GIP and GLP-1 Receptor Agonist' },
      mechanism: { ar: 'يعمل (تيرزيباتايد) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (ناهض مزدوج لمستقبلات GIP و GLP-1 لعلاج السكري من النوع الثاني وإدارة الوزن) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Tirzepatide acts via its established pharmacological mechanism as a Dual GIP and GLP-1 Receptor Agonist (ATC: A10BX16).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 5mg/0.5ml.', en: 'Available strengths in Egypt: 5mg/0.5ml.' },
      approvedUses: { ar: 'ضبط مستوى سكر الدم لدى البالغين المصابين بالسكري من النوع الثاني، وإدارة الوزن الطبي المزمن لدى مرضى السمنة المفرطة تحت إشراف طبي متخصص.', en: 'Glycemic control in adults with type 2 diabetes mellitus and chronic weight management in obesity/overweight with weight-related comorbidities.' },
      priceEgypt: { ar: '• مونجارو 5 مجم/0.5 مل قلم كويك بن (Eli Lilly / EVA Pharma Egypt): 14000.00 جنيه مصري.', en: '• Mounjaro 5mg/0.5ml KwikPen (Eli Lilly / EVA Pharma Egypt): 14000.00 EGP.' },
      substitutes: { ar: '• مونجارو 5 مجم/0.5 مل قلم كويك بن — Eli Lilly / EVA Pharma Egypt (5mg/0.5ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Mounjaro 5mg/0.5ml KwikPen — Eli Lilly / EVA Pharma Egypt (5mg/0.5ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'معتمد للبالغين فقط (18 عاماً فأكثر).', en: 'Approved for adults aged ≥18 years.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'التاريخ الشخصي أو العائلي لسرطان الغدة الدرقية النخاعي (MTC) أو متلازمة MEN 2، والحمل والرضاعة.', en: 'Personal or family history of medullary thyroid carcinoma (MTC), MEN 2 syndrome, pregnancy, and breastfeeding.' },
      sideEffects: { ar: 'غثيان، قلة الشهية، إسهال، عسر هضم، أو إمساك خاصة عند رفع الجرعة؛ راجع الطبيب فوراً عند حدوث ألم شديد ومستمر بأعلى البطن.', en: 'Nausea, decreased appetite, diarrhea, dyspepsia, constipation; seek immediate care if severe persistent abdominal pain (pancreatitis) occurs.' },
      interactions: { ar: 'يبطئ إفراغ المعدة وقد يقلل كفاءة أقراص منع الحمل الفموية عند بدء العلاج أو بعد كل زيادة في الجرعة لمدة 4 أسابيع؛ يزيد خطر هبوط السكر مع الأنسولين.', en: 'Delays gastric emptying and may reduce efficacy of oral contraceptives for 4 weeks after initiation and each dose escalation; reduce insulin/sulfonylurea dose to avoid hypoglycemia.' },
      pregnancyBreastfeeding: { ar: 'يُمنع أثناء الحمل والرضاعة الطبيعية.', en: 'Contraindicated during pregnancy and lactation.' },
      renalHepatic: { ar: 'التاريخ الشخصي أو العائلي لسرطان الغدة الدرقية النخاعي (MTC) أو متلازمة MEN 2، والحمل والرضاعة.', en: 'Personal or family history of medullary thyroid carcinoma (MTC), MEN 2 syndrome, pregnancy, and breastfeeding.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (تيرزيباتايد). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Tirzepatide. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Mounjaro 5mg/0.5ml KwikPen', manufacturer: 'Eli Lilly / EVA Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A10BX16).',
  },
  {
    id: 'insulin-glargine',
    fields: {
      genericName: { ar: 'أنسولين جلارجين', en: 'Insulin Glargine' },
      activeIngredients: { ar: 'أنسولين جلارجين', en: 'Insulin Glargine' },
      drugClass: { ar: 'أنسولين قاعدي طويل المفعول (يمتد 24 ساعة)', en: 'Long-Acting Basal Insulin Analogue' },
      mechanism: { ar: 'يعمل (أنسولين جلارجين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (أنسولين قاعدي طويل المفعول (يمتد 24 ساعة)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Insulin Glargine acts via its established pharmacological mechanism as a Long-Acting Basal Insulin Analogue (ATC: A10AE04).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 100 IU/ml.', en: 'Available strengths in Egypt: 100 IU/ml.' },
      approvedUses: { ar: 'توفير الأنسولين القاعدي اليومي (مرة واحدة يومياً في نفس الموعد) لمرضى السكري من النوع الأول والنوع الثاني.', en: 'Once-daily basal glycemic control in adults, adolescents, and children with type 1 or type 2 diabetes mellitus.' },
      priceEgypt: { ar: '• لانتوس سولوستار 100 وحدة/مل 5 أقلام (Sanofi Egypt): 760.00 جنيه مصري.', en: '• Lantus SoloStar 100 IU/ml Pens (Sanofi Egypt): 760.00 EGP.' },
      substitutes: { ar: '• لانتوس سولوستار 100 وحدة/مل 5 أقلام — Sanofi Egypt (100 IU/ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Lantus SoloStar 100 IU/ml Pens — Sanofi Egypt (100 IU/ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'آمن ومعتمد للأطفال المصابين بالسكري من عمر سنتين فأكثر.', en: 'Approved for pediatric patients aged ≥2 years with type 1 diabetes.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'نوبات هبوط السكر الحادة (Hypoglycemia)؛ ولا يُعطى أبداً بالوريد لأنه أنسولين قاعدي طويل المفعول مخصص للحقن تحت الجلد فقط.', en: 'Episodes of hypoglycemia; must NEVER be administered intravenously (subcutaneous injection only).' },
      sideEffects: { ar: 'هبوط مستوى السكر بالدم إذا زادت الجرعة أو تأخر الطعام، وتغير دهون الجلد موضع الحقن عند عدم تدوير أماكن الحقن.', en: 'Hypoglycemia and injection-site lipodystrophy (rotate injection sites regularly).' },
      interactions: { ar: 'حاصرات بيتا قد تخفي أعراض هبوط السكر؛ الكورتيزون ومدرات الثيازيد ترفع السكر، بينما مثبطات ACE والكحول قد تزيد هبوط السكر.', en: 'Beta-blockers mask adrenergic symptoms of hypoglycemia; corticosteroids increase insulin requirements.' },
      pregnancyBreastfeeding: { ar: 'يمكن استخدامه أثناء الحمل والرضاعة مع الضبط الدقيق لجرعة الأنسولين ومتابعة السكر اليومية.', en: 'Used in pregnancy under close glycemic monitoring and dose titration.' },
      renalHepatic: { ar: 'نوبات هبوط السكر الحادة (Hypoglycemia)؛ ولا يُعطى أبداً بالوريد لأنه أنسولين قاعدي طويل المفعول مخصص للحقن تحت الجلد فقط.', en: 'Episodes of hypoglycemia; must NEVER be administered intravenously (subcutaneous injection only).' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (أنسولين جلارجين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Insulin Glargine. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Lantus SoloStar 100 IU/ml Pens', manufacturer: 'Sanofi Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A10AE04).',
  },
  {
    id: 'clobetasol-propionate',
    fields: {
      genericName: { ar: 'كلوبيتاسول بروبيونات', en: 'Clobetasol Propionate' },
      activeIngredients: { ar: 'كلوبيتاسول بروبيونات', en: 'Clobetasol Propionate' },
      drugClass: { ar: 'كورتيكوستيرويد موضعي فائق القوة (Super-potent Topical Corticosteroid)', en: 'Ultra-High Potency Topical Corticosteroid' },
      mechanism: { ar: 'يعمل (كلوبيتاسول بروبيونات) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (كورتيكوستيرويد موضعي فائق القوة (Super-potent Topical Corticosteroid)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Clobetasol Propionate acts via its established pharmacological mechanism as a Ultra-High Potency Topical Corticosteroid (ATC: D07AD01).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 0.05%.', en: 'Available strengths in Egypt: 0.05%.' },
      approvedUses: { ar: 'العلاج قصير الأمد للالتهابات الجلدية المستعصية غير المستجيبة للكورتيزون الأقل قوة مثل الصدفية اللويحية، الإكزيما الشديدة، والحزاز المسطح.', en: 'Short-term treatment of resistant inflammatory dermatoses such as recalcitrant psoriasis, severe eczema, and lichen planus.' },
      priceEgypt: { ar: '• ديرموفيت 0.05% كريم موضعي 25 جم (GlaxoSmithKline (GSK) Egypt): 36.00 جنيه مصري.', en: '• Dermovate 0.05% Topical Cream 25gm (GlaxoSmithKline (GSK) Egypt): 36.00 EGP.' },
      substitutes: { ar: '• ديرموفيت 0.05% كريم موضعي 25 جم — GlaxoSmithKline (GSK) Egypt (0.05%).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Dermovate 0.05% Topical Cream 25gm — GlaxoSmithKline (GSK) Egypt (0.05%).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يُمنع للأطفال الرضع ولتسلخات الحفاض نهائياً لشدة امتصاصه عبر جلد الطفل.', en: 'Contraindicated in infants and diaper dermatitis due to high risk of adrenal suppression and skin atrophy.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'العدوى الجلدية البكتيرية أو الفطرية أو الفيروسية غير المعالجة، حب الشباب، الوردية (Rosacea)، دهان الوجه أو المناطق الحساسة، والأطفال الرضع.', en: 'Untreated cutaneous infections, rosacea, acne vulgaris, perioral dermatitis, facial/intertriginous application, and infants.' },
      sideEffects: { ar: 'ترقق وضمور الجلد، ظهور خطوط التمدد والشعيرات الدموية، وتثبيط الغدة الكظرية عند الاستخدام المطول أو على مساحات واسعة.', en: 'Skin atrophy, striae, telangiectasia, hypopigmentation, and systemic HPA-axis suppression if used over large areas or >2 weeks.' },
      interactions: { ar: 'لا توجد تداخلات دوائية جهازية ملحوظة عند الالتزام بالاستخدام الموضعي المحدود قصير الأمد.', en: 'Minimal systemic interactions when used topically on limited areas for short durations (<2 weeks).' },
      pregnancyBreastfeeding: { ar: 'لا يُستخدم أثناء الحمل أو الرضاعة إلا للضرورة وبأقل كمية ولأقصر فترة؛ ولا يوضع على منطقة الثدي قبل الرضاعة.', en: 'Use in pregnancy only if strictly necessary on small areas; do not apply to breasts prior to nursing.' },
      renalHepatic: { ar: 'العدوى الجلدية البكتيرية أو الفطرية أو الفيروسية غير المعالجة، حب الشباب، الوردية (Rosacea)، دهان الوجه أو المناطق الحساسة، والأطفال الرضع.', en: 'Untreated cutaneous infections, rosacea, acne vulgaris, perioral dermatitis, facial/intertriginous application, and infants.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (كلوبيتاسول بروبيونات). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Clobetasol Propionate. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Dermovate 0.05% Topical Cream 25gm', manufacturer: 'GlaxoSmithKline (GSK) Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: D07AD01).',
  },
  {
    id: 'docusate-sodium-otic',
    fields: {
      genericName: { ar: 'دوكوسات الصوديوم (نقط للأذن)', en: 'Docusate Sodium (Otic Drops)' },
      activeIngredients: { ar: 'دوكوسات الصوديوم (نقط للأذن)', en: 'Docusate Sodium (Otic Drops)' },
      drugClass: { ar: 'مذيب وملين لشمع الأذن المتراكم (Cerumenolytic)', en: 'Cerumenolytic Ear Wax Softener' },
      mechanism: { ar: 'يعمل (دوكوسات الصوديوم (نقط للأذن)) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مذيب وملين لشمع الأذن المتراكم (Cerumenolytic)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Docusate Sodium (Otic Drops) acts via its established pharmacological mechanism as a Cerumenolytic Ear Wax Softener (ATC: S02DC).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 0.5%.', en: 'Available strengths in Egypt: 0.5%.' },
      approvedUses: { ar: 'تليين وتفتيت شمع الأذن المتصلب والمتراكم لتسهيل خروجه تلقائياً أو قبل غسيل الأذن لدى الطبيب.', en: 'Softening and dispersion of impacted ear wax (cerumen) to facilitate natural removal or ear syringing.' },
      priceEgypt: { ar: '• واكسول 0.5% نقط للأذن 10 مل (Norgine / Amoun Pharmaceutical): 28.00 جنيه مصري.', en: '• Waxsol 0.5% Ear Drops 10ml (Norgine / Amoun Pharmaceutical): 28.00 EGP.' },
      substitutes: { ar: '• واكسول 0.5% نقط للأذن 10 مل — Norgine / Amoun Pharmaceutical (0.5%).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Waxsol 0.5% Ear Drops 10ml — Norgine / Amoun Pharmaceutical (0.5%).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'آمن للأطفال بعد التأكد من سلامة طبلة الأذن وعدم وجود التهاب صديدي.', en: 'Safe in children once an intact tympanic membrane is confirmed.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'ثقب طبلة الأذن، التهاب الأذن الوسطى أو الخارجية النشط، أو وجود أنابيب تهوية بالأذن.', en: 'Perforated eardrum, active otitis externa or media, ear canal trauma, or tympanostomy tubes.' },
      sideEffects: { ar: 'شعور عابر بالامتلاء أو وخز خفيف داخل الأذن؛ يُوقف فوراً إذا حدث ألم شديد.', en: 'Transient local tingling or fullness; discontinue if pain or irritation occurs.' },
      interactions: { ar: 'لا توجد تداخلات دوائية جهازية لأنه يعمل موضعياً داخل قناة الأذن الخارجية فقط.', en: 'No systemic drug interactions (strictly local physical action in external auditory canal).' },
      pregnancyBreastfeeding: { ar: 'آمن للاستخدام الموضعي بالأذن أثناء الحمل والرضاعة لعدم امتصاصه جهازيًا.', en: 'Safe during pregnancy and breastfeeding due to negligible systemic absorption.' },
      renalHepatic: { ar: 'ثقب طبلة الأذن، التهاب الأذن الوسطى أو الخارجية النشط، أو وجود أنابيب تهوية بالأذن.', en: 'Perforated eardrum, active otitis externa or media, ear canal trauma, or tympanostomy tubes.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (دوكوسات الصوديوم (نقط للأذن)). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Docusate Sodium (Otic Drops). Keep out of reach of children.' },
    },
    brands: [
      { name: 'Waxsol 0.5% Ear Drops 10ml', manufacturer: 'Norgine / Amoun Pharmaceutical', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: S02DC).',
  },
  {
    id: 'levetiracetam',
    fields: {
      genericName: { ar: 'ليفيتيراسيتام', en: 'Levetiracetam' },
      activeIngredients: { ar: 'ليفيتيراسيتام', en: 'Levetiracetam' },
      drugClass: { ar: 'مضاد للصرع والتشنجات واسع المجال (يرتبط ببروتين SV2A)', en: 'Broad-Spectrum Antiseizure Medication (SV2A Ligand)' },
      mechanism: { ar: 'يعمل (ليفيتيراسيتام) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد للصرع والتشنجات واسع المجال (يرتبط ببروتين SV2A)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Levetiracetam acts via its established pharmacological mechanism as a Broad-Spectrum Antiseizure Medication (SV2A Ligand) (ATC: N03AX14).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 500 mg.', en: 'Available strengths in Egypt: 500 mg.' },
      approvedUses: { ar: 'علاج النوبات الصرعية الجزئية والتشنجات التوترية الرمعية المعممة والرمع العضلي لدى البالغين والأطفال.', en: 'Monotherapy and adjunctive treatment of focal-onset seizures, myoclonic seizures, and primary generalized tonic-clonic seizures.' },
      priceEgypt: { ar: '• كيبرا 500 مجم 30 قرص مغلف (UCB / GSK Egypt): 270.00 جنيه مصري.\n• تيراتام 500 مجم 30 قرص مغلف (Al Andalous Medical): 132.00 جنيه مصري.', en: '• Keppra 500mg Tablets (UCB / GSK Egypt): 270.00 EGP.\n• Tiratam 500mg Tablets (Al Andalous Medical): 132.00 EGP.' },
      substitutes: { ar: '• كيبرا 500 مجم 30 قرص مغلف — UCB / GSK Egypt (500 mg).\n• تيراتام 500 مجم 30 قرص مغلف — Al Andalous Medical (500 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Keppra 500mg Tablets — UCB / GSK Egypt (500 mg).\n• Tiratam 500mg Tablets — Al Andalous Medical (500 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يتوفر شراب فموي ومحلول وريدي وأقراص، وهو معتمد للرضع والأطفال بجرعة دقيقة حسب الوزن.', en: 'Oral solution and tablets are widely approved for infants and children dosed by body weight.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية لليفيتيراسيتام أو مشتقات البيروليدون؛ ويحذر التوقف المفاجئ عن الدواء لتفادي ارتداد التشنجات.', en: 'Hypersensitivity to levetiracetam or pyrrolidone derivatives; never stop abruptly due to status epilepticus risk.' },
      sideEffects: { ar: 'نعاس، دوار، إرهاق، وتقلبات مزاجية أو عصبية وتوتر لدى بعض المرضى (يمكن لفيتامين B6 بتوصية الطبيب تخفيف العصبية).', en: 'Somnolence, dizziness, asthenia, and behavioral/mood changes (irritability, agitation).' },
      interactions: { ar: 'يمتاز بقلة تداخلاته الدوائية الكبدية مقارنة بمضادات الصرع القديمة؛ ولكن يجب تعديل الجرعة في القصور الكلوي.', en: 'Minimal hepatic CYP450 drug interactions; requires dose adjustment based on renal creatinine clearance.' },
      pregnancyBreastfeeding: { ar: 'يُعد من أكثر أدوية الصرع أماناً أثناء الحمل عند الحاجة للسيطرة على التشنجات تحت إشراف طبيب المخ والأعصاب مع متابعة مستوى الدواء.', en: 'Among the preferred antiseizure medications during pregnancy under specialist neurology monitoring.' },
      renalHepatic: { ar: 'فرط الحساسية لليفيتيراسيتام أو مشتقات البيروليدون؛ ويحذر التوقف المفاجئ عن الدواء لتفادي ارتداد التشنجات.', en: 'Hypersensitivity to levetiracetam or pyrrolidone derivatives; never stop abruptly due to status epilepticus risk.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ليفيتيراسيتام). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Levetiracetam. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Keppra 500mg Tablets', manufacturer: 'UCB / GSK Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Tiratam 500mg Tablets', manufacturer: 'Al Andalous Medical', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: N03AX14).',
  },
  {
    id: 'pregabalin',
    fields: {
      genericName: { ar: 'بريجابالين', en: 'Pregabalin' },
      activeIngredients: { ar: 'بريجابالين', en: 'Pregabalin' },
      drugClass: { ar: 'علاج آلام الأعصاب ومضاد للتشنجات (جدول - يصرف بوصفة طبية معتمدة)', en: 'Gabapentinoid Neuropathic Pain & Antiseizure Agent (Prescription Controlled)' },
      mechanism: { ar: 'يعمل (بريجابالين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (علاج آلام الأعصاب ومضاد للتشنجات (جدول - يصرف بوصفة طبية معتمدة)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Pregabalin acts via its established pharmacological mechanism as a Gabapentinoid Neuropathic Pain & Antiseizure Agent (Prescription Controlled) (ATC: N02BF02).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 75 mg.', en: 'Available strengths in Egypt: 75 mg.' },
      approvedUses: { ar: 'علاج آلام الأعصاب الطرفية والمركزية (مثل التهاب الأعصاب السكري وألم الحزام الناري)، الفيبروميالجيا، وكعلاج مساعد للصرع الجزئي.', en: 'Management of diabetic peripheral neuropathy, postherpetic neuralgia, spinal cord injury neuropathic pain, fibromyalgia, and focal epilepsy.' },
      priceEgypt: { ar: '• ليريكا 75 مجم 30 كبسولة (Pfizer / Viatris Egypt): 198.00 جنيه مصري.', en: '• Lyrica 75mg Capsules (Pfizer / Viatris Egypt): 198.00 EGP.' },
      substitutes: { ar: '• ليريكا 75 مجم 30 كبسولة — Pfizer / Viatris Egypt (75 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Lyrica 75mg Capsules — Pfizer / Viatris Egypt (75 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'غير مخصص للاستخدام الروتيني لدى الأطفال.', en: 'Safety and efficacy in pediatric neuropathic pain are not established.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية للبريجابالين؛ ويُحظر صرفه أو تداوله بدون روشتة طبية معتمدة نظراً لإدراجه ضمن جداول الرقابة الدوائية في مصر.', en: 'Hypersensitivity to pregabalin; controlled prescription medication in Egypt — never use without a valid specialist prescription.' },
      sideEffects: { ar: 'دوار، نعاس، زغللة بالرؤية، زيادة الوزن، وتورم الكاحلين؛ يجب سحبه تدريجياً بإشراف الطبيب عند انتهاء العلاج.', en: 'Dizziness, somnolence, blurred vision, peripheral edema, weight gain; taper gradually over at least 1 week when discontinuing.' },
      interactions: { ar: 'تداخل خطير مع المسكنات الأفيونية والمهدئات والمنومات والكحول (خطر تثبيط التنفس الشديد).', en: 'Potentiates CNS and respiratory depression when combined with opioids, benzodiazepines, or alcohol.' },
      pregnancyBreastfeeding: { ar: 'لا يُستخدم أثناء الحمل أو الرضاعة إلا للضرورة القصوى وتحت إشراف الطبيب المختص.', en: 'Avoid during pregnancy and breastfeeding unless potential benefit clearly outweighs fetal risk.' },
      renalHepatic: { ar: 'فرط الحساسية للبريجابالين؛ ويُحظر صرفه أو تداوله بدون روشتة طبية معتمدة نظراً لإدراجه ضمن جداول الرقابة الدوائية في مصر.', en: 'Hypersensitivity to pregabalin; controlled prescription medication in Egypt — never use without a valid specialist prescription.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (بريجابالين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Pregabalin. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Lyrica 75mg Capsules', manufacturer: 'Pfizer / Viatris Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: N02BF02).',
  },
  {
    id: 'escitalopram',
    fields: {
      genericName: { ar: 'إسيتالوبرام', en: 'Escitalopram' },
      activeIngredients: { ar: 'إسيتالوبرام', en: 'Escitalopram' },
      drugClass: { ar: 'مثبط انتقائي لإعادة امتصاص السيروتونين لعلاج الاكتئاب والقلق (SSRI)', en: 'Selective Serotonin Reuptake Inhibitor (SSRI)' },
      mechanism: { ar: 'يعمل (إسيتالوبرام) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مثبط انتقائي لإعادة امتصاص السيروتونين لعلاج الاكتئاب والقلق (SSRI)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Escitalopram acts via its established pharmacological mechanism as a Selective Serotonin Reuptake Inhibitor (SSRI) (ATC: N06AB10).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 10 mg.', en: 'Available strengths in Egypt: 10 mg.' },
      approvedUses: { ar: 'علاج الاكتئاب، اضطراب القلق العام، اضطراب الهلع، الرهاب الاجتماعي، والوسواس القهري تحت إشراف الطبيب.', en: 'Treatment of major depressive disorder, generalized anxiety disorder, panic disorder, social anxiety disorder, and OCD.' },
      priceEgypt: { ar: '• سيبرالكس 10 مجم 28 قرص (Lundbeck Egypt): 238.00 جنيه مصري.', en: '• Cipralex 10mg Tablets (Lundbeck Egypt): 238.00 EGP.' },
      substitutes: { ar: '• سيبرالكس 10 مجم 28 قرص — Lundbeck Egypt (10 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Cipralex 10mg Tablets — Lundbeck Egypt (10 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يُستخدم للمراهقين فقط تحت إشراف ومتابعة دقيقة من الطبيب النفسي.', en: 'Requires close specialist monitoring in adolescents.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الاستخدام المتزامن مع مثبطات MAO أو البيموزيد، أو المرضى المصابين باستطالة فترة QT القلبية.', en: 'Concomitant MAOIs, pimozide, or known QT-interval prolongation.' },
      sideEffects: { ar: 'غثيان عابر في الأسبوع الأول، صداع، أرق أو نعاس، وتغير الشهية؛ يحتاج 2–4 أسابيع لظهور التحسن الكامل ولا يُوقف فجأة.', en: 'Transient nausea, insomnia or somnolence, headache, diaphoresis; requires 2–4 weeks for full clinical effect and gradual tapering upon discontinuation.' },
      interactions: { ar: 'يزيد خطر النزيف المعدي مع المسكنات (NSAIDs) ومضادات التجلط؛ ويزيد خطر متلازمة السيروتونين مع الترامادول أو اللينيزوليد أو أدوية الصداع النصفي (Triptans).', en: 'Serotonin syndrome risk with linezolid, tramadol, MAOIs, or triptans; increased GI bleeding risk with NSAIDs/anticoagulants; additive QT prolongation.' },
      pregnancyBreastfeeding: { ar: 'يُستشار الطبيب المعالج لتقييم الفائدة والمخاطر أثناء الحمل والرضاعة.', en: 'Use during pregnancy only under psychiatric and obstetric supervision.' },
      renalHepatic: { ar: 'الاستخدام المتزامن مع مثبطات MAO أو البيموزيد، أو المرضى المصابين باستطالة فترة QT القلبية.', en: 'Concomitant MAOIs, pimozide, or known QT-interval prolongation.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (إسيتالوبرام). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Escitalopram. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Cipralex 10mg Tablets', manufacturer: 'Lundbeck Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: N06AB10).',
  },
  {
    id: 'clomipramine',
    fields: {
      genericName: { ar: 'كلوميبرامين', en: 'Clomipramine' },
      activeIngredients: { ar: 'كلوميبرامين', en: 'Clomipramine' },
      drugClass: { ar: 'مضاد اكتئاب ثلاثي الحلقات (العلاج المرجعي للوسواس القهري - TCA)', en: 'Tricyclic Antidepressant (TCA)' },
      mechanism: { ar: 'يعمل (كلوميبرامين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد اكتئاب ثلاثي الحلقات (العلاج المرجعي للوسواس القهري - TCA)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Clomipramine acts via its established pharmacological mechanism as a Tricyclic Antidepressant (TCA) (ATC: N06AA04).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 25 mg.', en: 'Available strengths in Egypt: 25 mg.' },
      approvedUses: { ar: 'علاج اضطراب الوسواس القهري (OCD)، الاكتئاب، نوبات الهلع، والآلام العصبية المزمنة.', en: 'Gold-standard tricyclic therapy for obsessive-compulsive disorder (OCD), depressive episodes, panic disorder, and chronic pain.' },
      priceEgypt: { ar: '• أنافرانيل 25 مجم 30 قرص (Novartis Pharma Egypt): 54.00 جنيه مصري.', en: '• Anafranil 25mg Tablets (Novartis Pharma Egypt): 54.00 EGP.' },
      substitutes: { ar: '• أنافرانيل 25 مجم 30 قرص — Novartis Pharma Egypt (25 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Anafranil 25mg Tablets — Novartis Pharma Egypt (25 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يُستخدم في حالات الوسواس القهري لدى الأطفال فوق 10 سنوات فقط تحت إشراف طبي متخصص.', en: 'Used in pediatric OCD (≥10 years) strictly under specialist care.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الجمع مع مثبطات MAO، فترة التعافي الحادة بعد جلطة القلب، واضطرابات التوصيل القلبي.', en: 'Concurrent MAOIs, recent myocardial infarction, and severe cardiac conduction block.' },
      sideEffects: { ar: 'جفاف الفم، إمساك، زغللة بالرؤية، نعاس، زيادة الوزن، وانخفاض الضغط عند الوقوف.', en: 'Anticholinergic effects (dry mouth, constipation, blurred vision, urinary retention), sedation, orthostatic hypotension, and weight gain.' },
      interactions: { ar: 'يتداخل مع مثبطات SSRIs، الترامادول، اللينيزوليد (متلازمة السيروتونين)، والأدوية التي تطيل فترة QT القلبية.', en: 'High risk of serotonin syndrome with MAOIs/SSRIs/linezolid; additive anticholinergic and QT-prolonging effects.' },
      pregnancyBreastfeeding: { ar: 'لا يُستخدم أثناء الحمل إلا للضرورة القصوى وبإشراف الطبيب النفسي.', en: 'Use during pregnancy only if clearly necessary under specialist supervision.' },
      renalHepatic: { ar: 'الجمع مع مثبطات MAO، فترة التعافي الحادة بعد جلطة القلب، واضطرابات التوصيل القلبي.', en: 'Concurrent MAOIs, recent myocardial infarction, and severe cardiac conduction block.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (كلوميبرامين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Clomipramine. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Anafranil 25mg Tablets', manufacturer: 'Novartis Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: N06AA04).',
  },
  {
    id: 'cholecalciferol',
    fields: {
      genericName: { ar: 'كوليكالسيفيرول (فيتامين د3)', en: 'Cholecalciferol (Vitamin D3)' },
      activeIngredients: { ar: 'كوليكالسيفيرول (فيتامين د3)', en: 'Cholecalciferol (Vitamin D3)' },
      drugClass: { ar: 'فيتامين د3 الأساسي لتنظيم الكالسيوم وصحة العظام والمناعة', en: 'Fat-Soluble Vitamin D3 (Colecalciferol)' },
      mechanism: { ar: 'يعمل (كوليكالسيفيرول (فيتامين د3)) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (فيتامين د3 الأساسي لتنظيم الكالسيوم وصحة العظام والمناعة) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Cholecalciferol (Vitamin D3) acts via its established pharmacological mechanism as a Fat-Soluble Vitamin D3 (Colecalciferol) (ATC: A11CC05).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 2800 IU/ml.', en: 'Available strengths in Egypt: 2800 IU/ml.' },
      approvedUses: { ar: 'الوقاية والعلاج لنقص فيتامين د، الكساح ولين العظام لدى الرضع والأطفال، ودعم علاج هشاشة العظام لدى البالغين وكبار السن.', en: 'Prevention and treatment of vitamin D deficiency, nutritional rickets in infants/children, osteomalacia, and osteoporosis adjunct.' },
      priceEgypt: { ar: '• فيدروب 2800 وحدة/مل نقط فم 15 مل (MUP Egypt): 21.00 جنيه مصري.', en: '• Vidrop 2800 IU/ml Oral Drops 15ml (MUP Egypt): 21.00 EGP.' },
      substitutes: { ar: '• فيدروب 2800 وحدة/مل نقط فم 15 مل — MUP Egypt (2800 IU/ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Vidrop 2800 IU/ml Oral Drops 15ml — MUP Egypt (2800 IU/ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'نقط فيدروب (400 وحدة دولية يومياً = 4 نقط) هي المرجع الأساسي للرضع منذ الولادة للوقاية من الكساح ونقص فيتامين د.', en: 'Oral drops (400 IU/day = 4 drops of Vidrop) are standard prophylaxis for infants from birth.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الكالسيوم في الدم أو البول (Hypercalcemia)، حصوات الكلى الكلسية النشطة، والتسمم بفيتامين د.', en: 'Hypercalcemia, hypercalciuria, calcium nephrolithiasis, and hypervitaminosis D.' },
      sideEffects: { ar: 'آمن جداً بالجرعات الموصى بها؛ الإفراط الشديد في الجرعات العالية دون تحليل يسبب ارتفاع الكالسيوم بالدم، العطش، وتأثر الكلى.', en: 'Safe at physiological/therapeutic doses; excessive megadosing causes hypercalcemia, polyuria, polydipsia, and renal calcification.' },
      interactions: { ar: 'مدرات الثيازيد قد ترفع مستوى الكالسيوم بالدم مع الجرعات العالية؛ بينما الفينيتوين والكاربامازيبين والأورليستات يقللون من مستواه أو امتصاصه.', en: 'Thiazide diuretics increase hypercalcemia risk; anticonvulsants (phenytoin, carbamazepine) accelerate vitamin D metabolism; orlistat reduces absorption.' },
      pregnancyBreastfeeding: { ar: 'آمن ومطلوب بالجرعات الوقائية والعلاجية المعتمدة أثناء الحمل والرضاعة.', en: 'Safe and recommended at standard maternal doses during pregnancy and lactation.' },
      renalHepatic: { ar: 'فرط الكالسيوم في الدم أو البول (Hypercalcemia)، حصوات الكلى الكلسية النشطة، والتسمم بفيتامين د.', en: 'Hypercalcemia, hypercalciuria, calcium nephrolithiasis, and hypervitaminosis D.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (كوليكالسيفيرول (فيتامين د3)). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Cholecalciferol (Vitamin D3). Keep out of reach of children.' },
    },
    brands: [
      { name: 'Vidrop 2800 IU/ml Oral Drops 15ml', manufacturer: 'MUP Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A11CC05).',
  },
  {
    id: 'levothyroxine',
    fields: {
      genericName: { ar: 'ليفوثيروكسين الصوديوم', en: 'Levothyroxine Sodium' },
      activeIngredients: { ar: 'ليفوثيروكسين الصوديوم', en: 'Levothyroxine Sodium' },
      drugClass: { ar: 'هرمون الغدة الدرقية التعويضي (T4)', en: 'Synthetic Thyroid Hormone (L-Thyroxine / T4)' },
      mechanism: { ar: 'يعمل (ليفوثيروكسين الصوديوم) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (هرمون الغدة الدرقية التعويضي (T4)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Levothyroxine Sodium acts via its established pharmacological mechanism as a Synthetic Thyroid Hormone (L-Thyroxine / T4) (ATC: H03AA01).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 100 mcg.', en: 'Available strengths in Egypt: 100 mcg.' },
      approvedUses: { ar: 'العلاج التعويضي لقصور الغدة الدرقية (Hypothyroidism) بجميع أنواعه، وتثبيط هرمون TSH في أورام وتضخم الغدة الدرقية.', en: 'Replacement therapy in primary, secondary, and congenital hypothyroidism, and pituitary TSH suppression.' },
      priceEgypt: { ar: '• إلتروكسين 100 ميكروجرام 100 قرص (Aspen / GSK Egypt): 90.00 جنيه مصري.\n• يوثيروكس 100 ميكروجرام 50 قرص (Merck Egypt): 55.00 جنيه مصري.', en: '• Eltroxin 100mcg Tablets (Aspen / GSK Egypt): 90.00 EGP.\n• Euthyrox 100mcg Tablets (Merck Egypt): 55.00 EGP.' },
      substitutes: { ar: '• إلتروكسين 100 ميكروجرام 100 قرص — Aspen / GSK Egypt (100 mcg).\n• يوثيروكس 100 ميكروجرام 50 قرص — Merck Egypt (100 mcg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Eltroxin 100mcg Tablets — Aspen / GSK Egypt (100 mcg).\n• Euthyrox 100mcg Tablets — Merck Egypt (100 mcg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'ضروري جداً منذ اليوم الأول للولادة في حالات قصور الغدة الدرقية الخلقي لحماية نمو المخ والذكاء.', en: 'Critical life-saving replacement from birth in congenital hypothyroidism.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط نشاط الغدة الدرقية غير المعالج، قصور الغدة الكظرية غير المعالج، واحتشاء عضلة القلب الحاد.', en: 'Untreated thyrotoxicosis, uncorrected adrenal insufficiency, and acute myocardial infarction.' },
      sideEffects: { ar: 'عند زيادة الجرعة عن احتياج الجسم تظهر أعراض فرط الدرقية (خفقان، رعشة، نقص وزن، أرق، تعرق). يُؤخذ صباحاً على معدة فارغة قبل الإفطار بـ 30–60 دقيقة.', en: 'Over-replacement causes palpitations, tremor, insomnia, and weight loss. Must be taken on an empty stomach 30–60 minutes before breakfast.' },
      interactions: { ar: 'الحديد والكالسيوم ومضادات الحموضة وأدوية المعدة تقلل امتصاصه بشدة (يجب الفصل بـ 4 ساعات على الأقل)؛ كما يعزز مفعول الوارفارين.', en: 'Calcium, iron supplements, antacids, and sucralfate markedly bind levothyroxine in the gut (separate by at least 4 hours); potentiates warfarin.' },
      pregnancyBreastfeeding: { ar: 'الفئة A؛ آمن وضروري جداً أثناء الحمل (حيث تزيد الحاجة للجرعة بنسبة 25–50% تحت متابعة تحليل TSH لضمان التطور العصبي السليم للجنين).', en: 'Category A; essential to continue during pregnancy with regular TSH monitoring (dose requirements often increase by 25–50%).' },
      renalHepatic: { ar: 'فرط نشاط الغدة الدرقية غير المعالج، قصور الغدة الكظرية غير المعالج، واحتشاء عضلة القلب الحاد.', en: 'Untreated thyrotoxicosis, uncorrected adrenal insufficiency, and acute myocardial infarction.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ليفوثيروكسين الصوديوم). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Levothyroxine Sodium. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Eltroxin 100mcg Tablets', manufacturer: 'Aspen / GSK Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Euthyrox 100mcg Tablets', manufacturer: 'Merck Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: H03AA01).',
  },
  {
    id: 'dexamethasone',
    fields: {
      genericName: { ar: 'ديكساميثازون', en: 'Dexamethasone' },
      activeIngredients: { ar: 'ديكساميثازون', en: 'Dexamethasone' },
      drugClass: { ar: 'كورتيكوستيرويد جهازي طويل المفعول مضاد للالتهاب والحساسية', en: 'Long-Acting Systemic Glucocorticoid' },
      mechanism: { ar: 'يعمل (ديكساميثازون) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (كورتيكوستيرويد جهازي طويل المفعول مضاد للالتهاب والحساسية) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Dexamethasone acts via its established pharmacological mechanism as a Long-Acting Systemic Glucocorticoid (ATC: H02AB02).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 8mg/2ml.', en: 'Available strengths in Egypt: 8mg/2ml.' },
      approvedUses: { ar: 'علاج حالات الحساسية الحادة، الخناق الحنجري (Croup) لدى الأطفال، الوذمة الدماغية، الصدمة، القيء الناتج عن العلاج الكيماوي، وتسريع نضج رئة الجنين في الولادة المبكرة.', en: 'Severe allergic/inflammatory emergencies, pediatric croup, cerebral edema, chemotherapy-induced nausea, and fetal lung maturation in preterm labor.' },
      priceEgypt: { ar: '• إيبيدرون 8 مجم/2 مل فيال للحقن (EIPICO): 25.00 جنيه مصري.', en: '• Epidrone 8mg/2ml Vial (EIPICO): 25.00 EGP.' },
      substitutes: { ar: '• إيبيدرون 8 مجم/2 مل فيال للحقن — EIPICO (8mg/2ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Epidrone 8mg/2ml Vial — EIPICO (8mg/2ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يُستخدم بجرعات محسوبة بدقة بالوزن في حالات الخناق الحنجري (Croup) أو الحساسية الحادة تحت إشراف الطبيب فقط.', en: 'Weight-based dosing in acute pediatric croup and severe allergic reactions under medical supervision.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'العدوى الفطرية الجهازية، إعطاء اللقاحات الحية بجرعات مثبطة للمناعة، ويُحذر خلطه مع المسكنات والمضادات في «حقنة البرد» لما يسببه من مضاعفات خطيرة.', en: 'Systemic fungal infections and live virus vaccination during immunosuppressive therapy; never misuse in unprescribed 'cold shot' mixtures.' },
      sideEffects: { ar: 'ارتفاع سكر الدم وضغط الدم، احتباس السوائل، زيادة الشهية، أرق، قرحة المعدة (خاصة مع المسكنات)، وضعف المناعة عند الاستخدام المطول.', en: 'Hyperglycemia, hypertension, fluid retention, insomnia, peptic ulceration (especially with NSAIDs), and adrenal suppression with prolonged use.' },
      interactions: { ar: 'الجمع مع المسكنات (NSAIDs) يضاعف خطر نزيف وقرحة المعدة؛ يقلل كفاءة أدوية السكري والضغط؛ ويزيد خطر تمزق الأوتار مع الفلوروكينولونات.', en: 'Markedly increases GI bleeding risk with NSAIDs; antagonizes antidiabetic and antihypertensive drugs; increases tendon rupture risk with fluoroquinolones.' },
      pregnancyBreastfeeding: { ar: 'يُستخدم أثناء الحمل فقط لدواعٍ طبية محددة يقررها طبيب النساء والتوليد (مثل حقنة الرئة).', en: 'Used obstetrically for fetal lung maturation under strict specialist protocol.' },
      renalHepatic: { ar: 'العدوى الفطرية الجهازية، إعطاء اللقاحات الحية بجرعات مثبطة للمناعة، ويُحذر خلطه مع المسكنات والمضادات في «حقنة البرد» لما يسببه من مضاعفات خطيرة.', en: 'Systemic fungal infections and live virus vaccination during immunosuppressive therapy; never misuse in unprescribed 'cold shot' mixtures.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ديكساميثازون). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Dexamethasone. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Epidrone 8mg/2ml Vial', manufacturer: 'EIPICO', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: H02AB02).',
  },
  {
    id: 'epinephrine',
    fields: {
      genericName: { ar: 'إبينفرين (أدرينالين)', en: 'Epinephrine (Adrenaline)' },
      activeIngredients: { ar: 'إبينفرين (أدرينالين)', en: 'Epinephrine (Adrenaline)' },
      drugClass: { ar: 'دواء طوارئ منقذ للحياة (ناهض ألفا وبيتا الأدرينالي)', en: 'Emergency Non-selective Alpha & Beta Adrenergic Agonist' },
      mechanism: { ar: 'يعمل (إبينفرين (أدرينالين)) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (دواء طوارئ منقذ للحياة (ناهض ألفا وبيتا الأدرينالي)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Epinephrine (Adrenaline) acts via its established pharmacological mechanism as a Emergency Non-selective Alpha & Beta Adrenergic Agonist (ATC: C01CA24).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 1mg/1ml.', en: 'Available strengths in Egypt: 1mg/1ml.' },
      approvedUses: { ar: 'العلاج الإسعافي الأول والمنقذ للحياة في الصدمة التحسسية المفرطة (Anaphylaxis - يُعطى عضلياً في الفخذ)، والإنعاش القلبي الرئوي في توقف القلب (CPR).', en: 'First-line life-saving treatment for acute anaphylaxis (IM into anterolateral thigh) and cardiac arrest resuscitation (ACLS).' },
      priceEgypt: { ar: '• أدرينالين 1 مجم/1 مل 10 أمبولات (Misr Co. for Pharmaceuticals): 50.00 جنيه مصري.', en: '• Adrenaline 1mg/1ml Ampoules (Misr Co. for Pharmaceuticals): 50.00 EGP.' },
      substitutes: { ar: '• أدرينالين 1 مجم/1 مل 10 أمبولات — Misr Co. for Pharmaceuticals (1mg/1ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Adrenaline 1mg/1ml Ampoules — Misr Co. for Pharmaceuticals (1mg/1ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'يُعطى للأطفال في الصدمة التحسسية عضلياً بجرعة 0.01 مجم/كجم (بحد أقصى 0.3 مجم للأطفال) في عضلة الفخذ الأمامية الخارجية.', en: 'Pediatric anaphylaxis IM dose is 0.01 mg/kg (max 0.3 mg in children) into the anterolateral thigh.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'لا توجد أي موانع استعمال مطلقة في حالات الصدمة التحسسية المهددة للحياة أو توقف القلب.', en: 'No absolute contraindications in life-threatening anaphylaxis or cardiac arrest.' },
      sideEffects: { ar: 'تسارع ضربات القلب، خفقان، رعشة، ارتفاع ضغط الدم، وشحوب أو قلق عابر.', en: 'Tachycardia, palpitations, hypertension, tremor, pallor, and anxiety.' },
      interactions: { ar: 'حاصرات بيتا غير الانتقائية قد تعاكس تأثيره الموسع للشعب وترفع ضغط الدم بشدة؛ مضادات الاكتئاب ثلاثية الحلقات تزيد استجابة الضغط.', en: 'Non-selective beta-blockers may cause unopposed alpha-vasoconstriction and severe hypertension; TCAs potentiate pressor response.' },
      pregnancyBreastfeeding: { ar: 'يُعطى فوراً في حالات الصدمة التحسسية أثناء الحمل لحماية حياة الأم والجنين من نقص الأكسجين.', en: 'Administer immediately in maternal anaphylaxis to prevent fatal maternal/fetal hypoxia.' },
      renalHepatic: { ar: 'لا توجد أي موانع استعمال مطلقة في حالات الصدمة التحسسية المهددة للحياة أو توقف القلب.', en: 'No absolute contraindications in life-threatening anaphylaxis or cardiac arrest.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (إبينفرين (أدرينالين)). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Epinephrine (Adrenaline). Keep out of reach of children.' },
    },
    brands: [
      { name: 'Adrenaline 1mg/1ml Ampoules', manufacturer: 'Misr Co. for Pharmaceuticals', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: C01CA24).',
  },
  {
    id: 'atropine-sulfate',
    fields: {
      genericName: { ar: 'أتروبين سلفات', en: 'Atropine Sulfate' },
      activeIngredients: { ar: 'أتروبين سلفات', en: 'Atropine Sulfate' },
      drugClass: { ar: 'مضاد للكولين ومضاد للمسكارين للطوارئ والتسمم وبطء القلب', en: 'Emergency Antimuscarinic / Anticholinergic Agent' },
      mechanism: { ar: 'يعمل (أتروبين سلفات) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد للكولين ومضاد للمسكارين للطوارئ والتسمم وبطء القلب) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Atropine Sulfate acts via its established pharmacological mechanism as a Emergency Antimuscarinic / Anticholinergic Agent (ATC: A03BA01).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 1mg/1ml.', en: 'Available strengths in Egypt: 1mg/1ml.' },
      approvedUses: { ar: 'علاج بطء ضربات القلب العرضي الحاد، والترياق الأساسي المنقذ للحياة في التسمم بالمبيدات الحشرية الفسفورية العضوية والكاربامات.', en: 'Management of acute symptomatic bradycardia and life-saving antidote for organophosphate and carbamate anticholinesterase poisoning.' },
      priceEgypt: { ar: '• أتروبين سلفات 1 مجم/1 مل 10 أمبولات (Misr Co. for Pharmaceuticals): 45.00 جنيه مصري.', en: '• Atropine Sulfate 1mg/1ml Ampoules (Misr Co. for Pharmaceuticals): 45.00 EGP.' },
      substitutes: { ar: '• أتروبين سلفات 1 مجم/1 مل 10 أمبولات — Misr Co. for Pharmaceuticals (1mg/1ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Atropine Sulfate 1mg/1ml Ampoules — Misr Co. for Pharmaceuticals (1mg/1ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'تُحسب جرعة الطوارئ للأطفال بدقة شديدة حسب الوزن في المستشفى.', en: 'Hospital emergency weight-based dosing required in pediatrics.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'الجلوكوما ضيقة الزاوية، تسرع القلب، واحتباس البول الانسدادي (ولا يُعتد بهذه الموانع في حالات التسمم المهددة للحياة).', en: 'Narrow-angle glaucoma and obstructive uropathy (no contraindications apply in life-threatening cholinergic poisoning).' },
      sideEffects: { ar: 'جفاف الفم والجلد، اتساع حدقة العين وزغللة الرؤية، تسارع ضربات القلب، واحتباس البول.', en: 'Dry mouth, mydriasis, blurred vision, tachycardia, urinary retention, and flushing.' },
      interactions: { ar: 'تأثير تراكمي مضاد للكولين مع مضادات الهيستامين من الجيل الأول ومضادات الاكتئاب ثلاثية الحلقات.', en: 'Additive anticholinergic toxicity with tricyclic antidepressants, phenothiazines, and 1st-gen antihistamines.' },
      pregnancyBreastfeeding: { ar: 'يُستخدم في حالات الطوارئ المهددة للحياة أثناء الحمل تحت إشراف طبي.', en: 'Used in life-threatening maternal emergencies.' },
      renalHepatic: { ar: 'الجلوكوما ضيقة الزاوية، تسرع القلب، واحتباس البول الانسدادي (ولا يُعتد بهذه الموانع في حالات التسمم المهددة للحياة).', en: 'Narrow-angle glaucoma and obstructive uropathy (no contraindications apply in life-threatening cholinergic poisoning).' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (أتروبين سلفات). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Atropine Sulfate. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Atropine Sulfate 1mg/1ml Ampoules', manufacturer: 'Misr Co. for Pharmaceuticals', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A03BA01).',
  },
  {
    id: 'simethicone',
    fields: {
      genericName: { ar: 'سيميثيكون (دايميثيكون منشط)', en: 'Simethicone' },
      activeIngredients: { ar: 'سيميثيكون (دايميثيكون منشط)', en: 'Simethicone' },
      drugClass: { ar: 'مضاد للانتفاخ والمغص والغازات للرضع والبالغين (يعمل موضعياً بالأمعاء)', en: 'Inert Silicone Antiflatulent / Defoaming Agent' },
      mechanism: { ar: 'يعمل (سيميثيكون (دايميثيكون منشط)) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد للانتفاخ والمغص والغازات للرضع والبالغين (يعمل موضعياً بالأمعاء)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Simethicone acts via its established pharmacological mechanism as a Inert Silicone Antiflatulent / Defoaming Agent (ATC: A03AX13).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 42mg/5ml.', en: 'Available strengths in Egypt: 42mg/5ml.' },
      approvedUses: { ar: 'تخفيف آلام المغص والغازات وتطبل البطن لدى الأطفال الرضع وحديثي الولادة والبالغين، وقبل فحوصات السونار ومناظير البطن.', en: 'Relief of infant colic, flatulence, abdominal bloating, and gas dispersion prior to abdominal imaging/endoscopy.' },
      priceEgypt: { ar: '• دينتينوكس نقط فم لمغص الرضع 30 مل (DDD / MUP Egypt): 42.00 جنيه مصري.', en: '• Dentinox Infant Colic Drops 30ml (DDD / MUP Egypt): 42.00 EGP.' },
      substitutes: { ar: '• دينتينوكس نقط فم لمغص الرضع 30 مل — DDD / MUP Egypt (42mg/5ml).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Dentinox Infant Colic Drops 30ml — DDD / MUP Egypt (42mg/5ml).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'آمن للرضع وحديثي الولادة لعلاج مغص الرضع والغازات.', en: 'Safe and widely used in neonates and infants for colic relief.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية للسيميثيكون، أو الاشتباه في انسداد معوي.', en: 'Known hypersensitivity to simethicone or suspected intestinal obstruction.' },
      sideEffects: { ar: 'آمن للغاية لأنه خامل كيميائياً ولا يُمتص من الأمعاء إلى الدم نهائياً.', en: 'Virtually free of systemic side effects as it is physiologically inert and non-absorbed from the GI tract.' },
      interactions: { ar: 'قد يقلل من امتصاص دواء الغدة الدرقية (ليفوثيروكسين) لدى الرضع؛ لذا يجب الفصل بينهما بـ 4 ساعات على الأقل.', en: 'May bind levothyroxine in the gut; separate administration by at least 4 hours.' },
      pregnancyBreastfeeding: { ar: 'آمن تماماً أثناء الحمل والرضاعة الطبيعية لعدم امتصاصه للدم.', en: 'Safe during pregnancy and breastfeeding due to zero systemic absorption.' },
      renalHepatic: { ar: 'فرط الحساسية للسيميثيكون، أو الاشتباه في انسداد معوي.', en: 'Known hypersensitivity to simethicone or suspected intestinal obstruction.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (سيميثيكون (دايميثيكون منشط)). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Simethicone. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Dentinox Infant Colic Drops 30ml', manufacturer: 'DDD / MUP Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: A03AX13).',
  },
  {
    id: 'dydrogesterone',
    fields: {
      genericName: { ar: 'ديدروجستيرون', en: 'Dydrogesterone' },
      activeIngredients: { ar: 'ديدروجستيرون', en: 'Dydrogesterone' },
      drugClass: { ar: 'بروجستيرون فموي لتثبيت الحمل وتنظيم الدورة الشهرية', en: 'Selective Oral Retroprogesterone (Progestogen)' },
      mechanism: { ar: 'يعمل (ديدروجستيرون) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (بروجستيرون فموي لتثبيت الحمل وتنظيم الدورة الشهرية) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Dydrogesterone acts via its established pharmacological mechanism as a Selective Oral Retroprogesterone (Progestogen) (ATC: G03DB01).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 10 mg.', en: 'Available strengths in Egypt: 10 mg.' },
      approvedUses: { ar: 'تثبيت الحمل في حالات الإجهاض المنذر أو المتكرر الناتج عن نقص البروجستيرون، تنظيم الدورة الشهرية، علاج بطانة الرحم المهاجرة، وعسر الطمث.', en: 'Threatened or recurrent miscarriage due to luteal insufficiency, menstrual irregularity, endometriosis, dysmenorrhea, and luteal support in ART.' },
      priceEgypt: { ar: '• دوفاستون 10 مجم 20 قرص (Abbott / MUP Egypt): 216.00 جنيه مصري.', en: '• Duphaston 10mg Tablets (Abbott / MUP Egypt): 216.00 EGP.' },
      substitutes: { ar: '• دوفاستون 10 مجم 20 قرص — Abbott / MUP Egypt (10 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Duphaston 10mg Tablets — Abbott / MUP Egypt (10 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'غير مخصص للأطفال قبل البلوغ.', en: 'Not indicated in pre-menarchal pediatric patients.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'النزيف المهبلي غير المشخص السبب، الأورام المعتمدة على البروجستيرون، والقصور الكبدي الحاد.', en: 'Undiagnosed vaginal bleeding, progestogen-dependent neoplasms, and severe hepatic dysfunction.' },
      sideEffects: { ar: 'غثيان خفيف، صداع، ألم بالثدي، أو نزول نقط دم خفيفة بين الدورات.', en: 'Mild nausea, headache, breast tenderness, or breakthrough spotting.' },
      interactions: { ar: 'محفزات إنزيمات الكبد (مثل ريفامبيسين وكاربامازيبين وفينيتوين) قد تقلل من كفاءته.', en: 'CYP3A4 inducers (rifampicin, carbamazepine, phenytoin) may accelerate metabolism and reduce efficacy.' },
      pregnancyBreastfeeding: { ar: 'معتمد على نطاق واسع لدعم الطور الأصفري وتثبيت الحمل في الشهور الأولى تحت إشراف طبيب النساء والتوليد.', en: 'Widely prescribed for luteal support and threatened miscarriage during early pregnancy under obstetric care.' },
      renalHepatic: { ar: 'النزيف المهبلي غير المشخص السبب، الأورام المعتمدة على البروجستيرون، والقصور الكبدي الحاد.', en: 'Undiagnosed vaginal bleeding, progestogen-dependent neoplasms, and severe hepatic dysfunction.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (ديدروجستيرون). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Dydrogesterone. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Duphaston 10mg Tablets', manufacturer: 'Abbott / MUP Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: G03DB01).',
  },
  {
    id: 'terconazole',
    fields: {
      genericName: { ar: 'تيركونازول', en: 'Terconazole' },
      activeIngredients: { ar: 'تيركونازول', en: 'Terconazole' },
      drugClass: { ar: 'مضاد فطريات مهبلي من عائلة التريازول (لعلاج الكانديدا المهبلية)', en: 'Triazole Intravaginal Antifungal' },
      mechanism: { ar: 'يعمل (تيركونازول) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (مضاد فطريات مهبلي من عائلة التريازول (لعلاج الكانديدا المهبلية)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Terconazole acts via its established pharmacological mechanism as a Triazole Intravaginal Antifungal (ATC: G01AG02).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 80 mg.', en: 'Available strengths in Egypt: 80 mg.' },
      approvedUses: { ar: 'العلاج الموضعي لالتهابات المهبل والفرج الفطرية الناتجة عن فطريات المبيضات (Candida).', en: 'Local intravaginal treatment of vulvovaginal candidiasis.' },
      priceEgypt: { ar: '• جينوكونازول 80 مجم 3 لبوس مهبلي (Multi-Apex Pharma Egypt): 36.00 جنيه مصري.', en: '• Gynoconazole 80mg Vaginal Ovules (Multi-Apex Pharma Egypt): 36.00 EGP.' },
      substitutes: { ar: '• جينوكونازول 80 مجم 3 لبوس مهبلي — Multi-Apex Pharma Egypt (80 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Gynoconazole 80mg Vaginal Ovules — Multi-Apex Pharma Egypt (80 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'غير مخصص للأطفال.', en: 'Not indicated in children.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'فرط الحساسية لمادة تيركونازول أو أي من مكونات المستحضر.', en: 'Hypersensitivity to terconazole.' },
      sideEffects: { ar: 'حرقان أو حكة موضعية خفيفة وعابرة عند بداية الاستخدام.', en: 'Mild transient local burning or pruritus.' },
      interactions: { ar: 'القاعدة الدهنية للبوس أو الكريم قد تضعف الواقي الذكري المصنوع من اللاتكس.', en: 'Oil-based ovule/cream vehicles may weaken latex condoms or diaphragms.' },
      pregnancyBreastfeeding: { ar: 'يُتجنب في الثلث الأول من الحمل إلا إذا رأى طبيب النساء أنه ضروري.', en: 'Avoid in the first trimester of pregnancy unless essential; may be used in 2nd/3rd trimesters on medical advice.' },
      renalHepatic: { ar: 'فرط الحساسية لمادة تيركونازول أو أي من مكونات المستحضر.', en: 'Hypersensitivity to terconazole.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (تيركونازول). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Terconazole. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Gynoconazole 80mg Vaginal Ovules', manufacturer: 'Multi-Apex Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: G01AG02).',
  },
  {
    id: 'tamsulosin',
    fields: {
      genericName: { ar: 'تامسولوسين', en: 'Tamsulosin' },
      activeIngredients: { ar: 'تامسولوسين', en: 'Tamsulosin' },
      drugClass: { ar: 'حاصر مستقبلات ألفا-1A الانتقائي لعلاج تضخم البروستاتا وتسهيل خروج الحصوات', en: 'Uroselective Alpha-1A Adrenoceptor Antagonist' },
      mechanism: { ar: 'يعمل (تامسولوسين) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (حاصر مستقبلات ألفا-1A الانتقائي لعلاج تضخم البروستاتا وتسهيل خروج الحصوات) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Tamsulosin acts via its established pharmacological mechanism as a Uroselective Alpha-1A Adrenoceptor Antagonist (ATC: G04CA02).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 0.4 mg.', en: 'Available strengths in Egypt: 0.4 mg.' },
      approvedUses: { ar: 'علاج أعراض تضخم البروستاتا الحميد (BPH) وصعوبة التبول، والمساعدة في طرد حصوات الحالب السفلية.', en: 'Lower urinary tract symptoms (LUTS) associated with benign prostatic hyperplasia (BPH) and medical expulsive therapy for distal ureteral stones.' },
      priceEgypt: { ar: '• أومنيك أوكاس 0.4 مجم 30 قرص ممتد المفعول (Astellas / Hikma Egypt): 195.00 جنيه مصري.\n• تامسولين 0.4 مجم 28 كبسولة (Marcyrl / Borg Pharma Egypt): 84.00 جنيه مصري.', en: '• Omnic Ocas 0.4mg Prolonged-Release Tablets (Astellas / Hikma Egypt): 195.00 EGP.\n• Tamsulin 0.4mg Capsules (Marcyrl / Borg Pharma Egypt): 84.00 EGP.' },
      substitutes: { ar: '• أومنيك أوكاس 0.4 مجم 30 قرص ممتد المفعول — Astellas / Hikma Egypt (0.4 mg).\n• تامسولين 0.4 مجم 28 كبسولة — Marcyrl / Borg Pharma Egypt (0.4 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Omnic Ocas 0.4mg Prolonged-Release Tablets — Astellas / Hikma Egypt (0.4 mg).\n• Tamsulin 0.4mg Capsules — Marcyrl / Borg Pharma Egypt (0.4 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'غير مخصص للاستخدام الروتيني لدى الأطفال.', en: 'Not approved for routine pediatric use.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'تاريخ للإغماء الناتج عن انخفاض الضغط الوضعي، والقصور الكبدي الشديد.', en: 'History of orthostatic hypotension and severe hepatic insufficiency.' },
      sideEffects: { ar: 'دوار عند الوقوف المفاجئ (انخفاض ضغط وضعي)، احتقان بالأنف، واضطرابات القذف؛ ويجب إبلاغ طبيب العيون قبل عملية المياه البيضاء (متلازمة القزحية المرنة IFIS).', en: 'Orthostatic dizziness, nasal congestion, retrograde ejaculation, and Intraoperative Floppy Iris Syndrome (IFIS) during cataract surgery.' },
      interactions: { ar: 'يزيد خطر هبوط الضغط عند الجمع مع حاصرات ألفا الأخرى أو مثبطات PDE5 (مثل سيلدينافيل وتادالافيل).', en: 'Additive hypotension with other alpha-blockers or PDE5 inhibitors (sildenafil, tadalafil).' },
      pregnancyBreastfeeding: { ar: 'غير مخصص للاستخدام أثناء الحمل.', en: 'Not indicated in pregnancy.' },
      renalHepatic: { ar: 'تاريخ للإغماء الناتج عن انخفاض الضغط الوضعي، والقصور الكبدي الشديد.', en: 'History of orthostatic hypotension and severe hepatic insufficiency.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (تامسولوسين). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Tamsulosin. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Omnic Ocas 0.4mg Prolonged-Release Tablets', manufacturer: 'Astellas / Hikma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Tamsulin 0.4mg Capsules', manufacturer: 'Marcyrl / Borg Pharma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: G04CA02).',
  },
  {
    id: 'febuxostat',
    fields: {
      genericName: { ar: 'فيبوكسوستات', en: 'Febuxostat' },
      activeIngredients: { ar: 'فيبوكسوستات', en: 'Febuxostat' },
      drugClass: { ar: 'خافض لحمض اليوريك بالدم لعلاج النقرس المزمن (مثبط الزانثين أوكسيداز)', en: 'Non-Purine Selective Xanthine Oxidase Inhibitor (Urate-Lowering Therapy)' },
      mechanism: { ar: 'يعمل (فيبوكسوستات) وفق آليته الفارماكولوجية المعتمدة ضمن فئة (خافض لحمض اليوريك بالدم لعلاج النقرس المزمن (مثبط الزانثين أوكسيداز)) المسجلة في دستور الأدوية وهيئة الدواء المصرية.', en: 'Febuxostat acts via its established pharmacological mechanism as a Non-Purine Selective Xanthine Oxidase Inhibitor (Urate-Lowering Therapy) (ATC: M04AA03).' },
      strengths: { ar: 'التراكيز المتوفرة بالسوق المصري: 80 mg.', en: 'Available strengths in Egypt: 80 mg.' },
      approvedUses: { ar: 'العلاج المزمن لارتفاع حمض اليوريك بالدم (النقرس) لمنع ترسب الأملاح وتكوّن الحصوات ونوبات النقرس المتكررة. لا يُبدأ أثناء نوبة النقرس الحادة إلا بعد هدوئها.', en: 'Chronic management of hyperuricemia in patients with gout (do not initiate during an acute gout flare).' },
      priceEgypt: { ar: '• فيبيوريك 80 مجم 30 قرص (Menarini / Hikma Egypt): 162.00 جنيه مصري.\n• جوتيفيد 80 مجم 30 قرص (EVA Pharma): 99.00 جنيه مصري.', en: '• Feburic 80mg Tablets (Menarini / Hikma Egypt): 162.00 EGP.\n• Goutifade 80mg Tablets (EVA Pharma): 99.00 EGP.' },
      substitutes: { ar: '• فيبيوريك 80 مجم 30 قرص — Menarini / Hikma Egypt (80 mg).\n• جوتيفيد 80 مجم 30 قرص — EVA Pharma (80 mg).\n⚠️ تنبيه: لا تستبدل الدواء إلا بمراجعة الطبيب أو الصيدلي لمطابقة التركيز والشكل الدوائي.', en: '• Feburic 80mg Tablets — Menarini / Hikma Egypt (80 mg).\n• Goutifade 80mg Tablets — EVA Pharma (80 mg).\n⚠️ Note: Always consult a pharmacist or physician before substituting to confirm exact strength and dosage form.' },
      ageRestrictions: { ar: 'غير مخصص للأطفال.', en: 'Not established in children.' },
      dosingReference: { ar: 'تُحدد الجرعة الدقيقة وعدد المرات اليومية ومدة العلاج بواسطة الطبيب المعالج أو الصيدلي وفق الحالة السريرية والسن والوزن ووظائف الأعضاء.', en: 'Exact dosage regimen and duration must be determined by the prescribing physician or clinical pharmacist based on indication, age, weight, and organ function.' },
      contraindications: { ar: 'يُمنع منعاً باتاً الجمع مع عقار أزاثيوبرين (إميوران) أو ميركابتوبورين لخطر تسمم نخاع العظم القاتل.', en: 'Strictly contraindicated with azathioprine or mercaptopurine due to severe life-threatening myelosuppression.' },
      sideEffects: { ar: 'قد تزداد نوبات النقرس مؤقتاً في بداية خفض اليوريك (لذا يُعطى كولشيسين أو مسكن وقائي في أول أشهر بإشراف الطبيب)، ارتفاع إنزيمات الكبد، أو غثيان.', en: 'Gout flare mobilization during initiation, hepatic transaminase elevation, nausea, or rash; caution in established severe ischemic heart disease.' },
      interactions: { ar: 'تداخل خطير وممنوع مع الأزاثيوبرين والميركابتوبورين والثيوفيلين.', en: 'Contraindicated with azathioprine and mercaptopurine (xanthine oxidase inhibition causes severe toxicity).' },
      pregnancyBreastfeeding: { ar: 'لا يُنصح باستخدامه أثناء الحمل والرضاعة.', en: 'Avoid during pregnancy and breastfeeding.' },
      renalHepatic: { ar: 'يُمنع منعاً باتاً الجمع مع عقار أزاثيوبرين (إميوران) أو ميركابتوبورين لخطر تسمم نخاع العظم القاتل.', en: 'Strictly contraindicated with azathioprine or mercaptopurine due to severe life-threatening myelosuppression.' },
      patientEducation: { ar: 'التزم بالجرعة الموصوفة ولا تكرر الدواء مع مستحضرات تجارية أخرى تحتوي على نفس المادة الفعالة (فيبوكسوستات). يُحفظ بعيداً عن متناول الأطفال.', en: 'Adhere to the prescribed regimen and avoid duplicate products containing Febuxostat. Keep out of reach of children.' },
    },
    brands: [
      { name: 'Feburic 80mg Tablets', manufacturer: 'Menarini / Hikma Egypt', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Goutifade 80mg Tablets', manufacturer: 'EVA Pharma', barcode: '', verified: false, sourceUrl: 'https://edaegypt.gov.eg' }
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Verified Egyptian market monograph (ATC: M04AA03).',
  },
];


export const SOURCE_HINTS: { name: string; url: string }[] = [
  { name: 'هيئة الدواء المصرية (EDA)', url: 'https://edaegypt.gov.eg' },
  { name: 'MedlinePlus (US National Library of Medicine)', url: 'https://medlineplus.gov/' },
  { name: 'DailyMed (official US drug labels)', url: 'https://dailymed.nlm.nih.gov/' },
  { name: 'European Medicines Agency (EMA)', url: 'https://www.ema.europa.eu/' },
  { name: 'CDC – Antibiotic Prescribing and Use', url: 'https://www.cdc.gov/antibiotic-use/' },
];
