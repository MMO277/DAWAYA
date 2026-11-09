import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

export interface SpecialtyClinicCard {
  id: string;
  to: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  consultantBadgeAr: string;
  consultantBadgeEn: string;
  color: string;
  gradient: string;
  descriptionAr: string;
  descriptionEn: string;
  modulesAr: string[];
  modulesEn: string[];
  subTools?: Array<{ to: string; labelAr: string; labelEn: string; icon: string }>;
}

export const SPECIALTY_CLINICS_LIST: SpecialtyClinicCard[] = [
  {
    id: 'interactive-body-map',
    to: '/body-map',
    icon: '🧍‍♂️',
    titleAr: 'خريطة جسم الإنسان التفاعلية (اضغط بإيدك على مكان الوجع في الجسم!)',
    titleEn: 'Interactive Front/Back Human Body Symptom Map',
    consultantBadgeAr: 'التشخيص البصري التفاعلي باللمس',
    consultantBadgeEn: 'Interactive Touch Anatomy Triage',
    color: '#0f766e',
    gradient: 'linear-gradient(135deg, #0D1F38 0%, #0f766e 100%)',
    descriptionAr: 'مجسم تشريحي تفاعلي لجسم الإنسان من الأمام والخلف (رجل، سيدة، طفل)؛ اضغط مباشرة على النقطة المضيئة مكان الألم ليبدأ حوار الطبيب الذكي وفحص علامات الخطورة.',
    descriptionEn: 'Interactive front and back anatomical map: tap any glowing body zone for red-flag screening, first-aid steps, and instant clinic routing.',
    modulesAr: [
      '١. منظر أمامي وخلفي تفاعلي للجسم مع إضاءة الأعضاء الداخلية',
      '٢. فلتر فوري لعلامات الطوارئ الحرجة (Red Flags) لكل عضو',
      '٣. خطوات الإسعاف الفوري والممنوعات والتحاليل المقترحة بالصوت',
    ],
    modulesEn: [
      '1. Interactive Front & Back body silhouette with organ hotspots',
      '2. Immediate Red-Flag emergency screening per anatomical region',
      '3. Voice-enabled first-aid guidance and suggested lab workup',
    ],
  },
  {
    id: 'food-drug-interaction-checker',
    to: '/food-drug-checker',
    icon: '☕',
    titleAr: 'فاحص «الأكل والشرب مع دوائك» (الشاي، القهوة، اللبن، العرقسوس، الملوخية)',
    titleEn: 'Egyptian Food, Drink & Timing vs. Medication Checker',
    consultantBadgeAr: 'استشاري الصيدلة الإكلينيكية والتغذية العلاجية',
    consultantBadgeEn: 'Clinical Pharmacy & Food-Drug Interactions',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #0D1F38 0%, #b45309 100%)',
    descriptionAr: 'اعرف فوراً إيه الأكلات والمشروبات اللي بتبطل مفعول أدويتك (الحديد، التروكسين الغدة، المضادات، السيولة، والضغط) وتفصل بينهم بكام ساعة بالضبط.',
    descriptionEn: 'Discover which common foods and drinks block drug absorption or spike blood pressure, with exact hour-by-hour separation rules.',
    modulesAr: [
      '١. الشاي والقهوة مع الحديد وإلتروكسين الغدة الدرقية',
      '٢. اللبن والجبنة والكالسيوم مع المضادات الحيوية',
      '٣. العرقسوس، الملوخية والسبانخ، الجريب فروت، وملح الدايت مع أدوية القلب والضغط والسيولة',
    ],
    modulesEn: [
      '1. Tea & coffee vs. iron supplements and levothyroxine',
      '2. Dairy & calcium vs. fluoroquinolone and tetracycline antibiotics',
      '3. Licorice, leafy greens, grapefruit, and potassium salt substitutes vs. cardiovascular meds',
    ],
  },
  {
    id: 'smart-lab-photo-scanner',
    to: '/lab-photo-scanner',
    icon: '📸',
    titleAr: 'الماسح الذكي لورق التحاليل والروشتات بالكاميرا والمؤشرات الملونة',
    titleEn: 'AI Lab Report & Prescription Photo Scanner with Visual Gauges',
    consultantBadgeAr: 'محرك الذكاء الاصطناعي لقراءة التحاليل والروشتات',
    consultantBadgeEn: 'AI Medical Vision & Lab Gauge Decoder',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #0D1F38 0%, #1d4ed8 100%)',
    descriptionAr: 'صوّر ورقة التحليل أو الروشتة بالكاميرا أو حرك المؤشرات التفاعلية لترى نتيجتك بالألوان (أخضر، أصفر، أحمر) مع التفسير الطبي البسيط بالعربي.',
    descriptionEn: 'Snap a photo of your lab report or prescription or test values on interactive color-coded gauges.',
    modulesAr: [
      '١. قراءة صور التحاليل الطبية والروشتات بالكاميرا واستخراج الأدوية',
      '٢. مؤشرات بصرية ملونة لأهم 8 تحاليل (Hb, Ferritin, HbA1c, TSH, Creatinine, Uric Acid, Vit D, ALT)',
      '٣. أمثلة تفاعلية جاهزة بضغطة زر وشرح صوتي ناطق للنتائج',
    ],
    modulesEn: [
      '1. Camera photo scanning for lab sheets and handwritten/printed prescriptions',
      '2. Live color-coded visual gauges for 8 essential blood biomarkers',
      '3. 1-tap clinical presets and Arabic voice narration',
    ],
  },
  {
    id: 'visual-organ-drug-simulator',
    to: '/organ-simulator',
    icon: '🫀',
    titleAr: 'محاكي الأثر البصري للدواء والتفاعلات داخل أعضاء الجسم',
    titleEn: 'Interactive Visual Organ & Drug Reaction Simulator',
    consultantBadgeAr: 'محاكاة الفسيولوجيا وعلم الأدوية المرئي',
    consultantBadgeEn: 'Visual Pharmacology & Organ Safety Simulator',
    color: '#4f46e5',
    gradient: 'linear-gradient(135deg, #0D1F38 0%, #4338ca 100%)',
    descriptionAr: 'شاهد بعينك داخل الكلى والمعدة والرئتين كيف تحدث «الضربة الثلاثية للكلى» و«كارثة حقنة البرد»، وكيف يفتح البخاخ الشعب الهوائية وتحمي كبسولة المعدة جدارها.',
    descriptionEn: 'Step inside human organs to visualize Triple-Whammy kidney injury, 3-in-1 cold shot damage, and therapeutic inhaler/PPI action.',
    modulesAr: [
      '١. محاكاة الضربة الثلاثية للكلى (مسكن + دواء ضغط + مدر بول)',
      '٢. محاكاة كارثة حقنة البرد ونزيف المعدة مع أدوية السيولة',
      '٣. محاكاة عمل بخاخ الربو في 5 دقائق والتوقيت الذهبي لكبسولة المعدة',
    ],
    modulesEn: [
      '1. Triple-Whammy acute kidney injury hemodynamic simulation',
      '2. 3-in-1 cold shot and NSAID + anticoagulant GI bleed visualization',
      '3. Asthma inhaler bronchodilation and PPI acid-pump timing simulation',
    ],
  },
  {
    id: 'smart-symptom-triage',
    to: '/symptom-triage',
    icon: '🩺',
    titleAr: 'مشخص الأعراض الذكي: اكشف عند أنهي دكتور؟ وهل الحالة طوارئ؟',
    titleEn: 'Smart Symptom Triage & Medical Specialty Finder',
    consultantBadgeAr: 'استشاري الفرز الإكلينيكي والطوارئ',
    consultantBadgeEn: 'Senior Clinical Triage & ER',
    color: '#138866',
    gradient: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
    descriptionAr: 'محتار تكشف عند تخصص إيه؟ اختر مكان الوجع من الجسم ليحدد لك النظام التشخيص الأقرب، درجة الخطورة (طوارئ أم عيادة)، ويحولك للعيادة المختصة فوراً.',
    descriptionEn: 'Not sure which specialist to visit? Select your symptom zone to get clinical urgency triage, exact specialty recommendation, and direct clinic routing.',
    modulesAr: [
      '١. فرز أعراض الرأس، الدوخة، ثقل اللسان، والصداع النصفي',
      '٢. فرز آلام الصدر، الذبحة الصدرية مقابل نوبة الهلع، والنهجان',
      '٣. فرز آلام البطن (الزائدة الدودية مقابل المرارة والقولون)',
      '٤. فرز آلام الجنب، المغص الكلوي، وتغير لون البول',
      '٥. فرز آلام أسفل الظهر، عرق النسا، والنقرس والمفاصل',
      '٦. تحويل ذكي ومباشر للعيادة المختصة من الـ 20 عيادة بالموقع',
    ],
    modulesEn: [
      '1. Head, Vertigo, Stroke FAST & Migraine Triage',
      '2. Chest Pain: Acute Angina vs Panic Attack & Asthma',
      '3. Abdominal Pain: Appendicitis vs Gallbladder & IBS',
      '4. Flank Pain, Renal Colic & Hemolytic Urine Triage',
      '5. Lower Back, Sciatica & Acute Gouty Arthritis Triage',
      '6. Instant One-Click Routing to Target Specialty Clinic',
    ],
  },
  {
    id: 'obgyn-pregnancy',
    to: '/pregnancy-guide',
    icon: '🤰',
    titleAr: 'عيادة النساء والتوليد ومتابعة الحمل والرضاعة',
    titleEn: 'Obstetrics, Pregnancy & Lactation Clinic',
    consultantBadgeAr: 'استشاري نساء وتوليد (40 سنة خبرة)',
    consultantBadgeEn: 'Senior Ob-Gyn Consultant (40y Exp)',
    color: '#e11d48',
    gradient: 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)',
    descriptionAr: 'رعاية شاملة للحامل من اليوم الأول حتى الولادة والرضاعة: الممنوع والمسموح بالأدلة العلمية، حساب أسابيع الحمل وموعد الولادة، وعلامات الخطر الفورية.',
    descriptionEn: 'Comprehensive maternal care from conception to delivery: safe vs. forbidden foods/meds, trimester labs, fetal kick counter, and labor prep.',
    modulesAr: [
      '١. موسوعة الممنوع والمسموح (أكلات، أدوية، أعشاب وعادات)',
      '٢. خريطة التحاليل والسونار الرباعي والتطعيمات وحقنة الـ RH',
      '٣. عداد حركات وركلات الجنين التفاعلي (قاعدة الـ 10 حركات)',
      '٤. حاسبة زيادة الوزن المثالية أثناء الحمل (بروتوكول IOM)',
      '٥. روشتة متاعب الحمل اليومية (الشد العضلي، الإمساك، التورم)',
      '٦. قائمة تحضير «شنطة الولادة» الذكية + مؤقت الطلق الحقيقي والكاذب',
    ],
    modulesEn: [
      '1. Safe vs Forbidden Foods, Meds & Habits Encyclopedia',
      '2. Trimester Labs, 4D Anomaly Scan & Anti-D Roadmap',
      '3. Interactive Count-to-10 Fetal Kick Counter',
      '4. IOM Pregnancy Weight Gain Calculator',
      '5. Common Pregnancy Discomforts Solver',
      '6. Smart Hospital Bag Checklist & Contraction Timer',
    ],
  },
  {
    id: 'pediatrics-newborn',
    to: '/baby-first-year',
    icon: '👶',
    titleAr: 'عيادة طب الأطفال وحديثي الولادة وأول سنة',
    titleEn: 'Pediatrics, Neonatology & First-Year Clinic',
    consultantBadgeAr: 'استشاري طب الأطفال وحديثي الولادة',
    consultantBadgeEn: 'Senior Neonatology & Pediatrics',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
    descriptionAr: 'الدليل الكامل للأم مع رضيعها: الممنوعات القاتلة قبل عمر سنة، التطعيمات، إدخال الطعام، ألوان البراز، منحنى النمو، وحاسبات الجرعات والألبان.',
    descriptionEn: 'Complete infant care hub: under-1 forbidden items, Egypt immunization tracker, weaning guide, stool color decoder, and emergency rescue.',
    modulesAr: [
      '١. كاشف الممنوعات القاتلة قبل سنة (العسل، اللبن البقري، المشاية)',
      '٢. جدول تطعيمات وزارة الصحة المصرية + الروتا والمكورات الرئوية',
      '٣. خريطة إدخال الطعام الصلب شهر بشهر وقاعدة الـ 3 أيام للحساسية',
      '٤. كاشف ومترجم ألوان وقوام براز الرضيع (دليل الحفاضة الطبي)',
      '٥. منحنى زيادة الوزن والتطور الحركي والذهني وعلامات التأخر',
      '٦. طوارئ الرضيع الحرجة: الصفراء، السخونة، السرة، وإسعاف الشرقة (5×5)',
    ],
    modulesEn: [
      '1. Under-1 Forbidden Foods, Meds & Gear Scanner',
      '2. Egypt MOH + Extra Vaccines Interactive Tracker',
      '3. Step-by-Step Solid Food Weaning Guide',
      '4. Baby Stool Color & Texture Clinical Decoder',
      '5. First-Year Weight & Motor Milestones',
      '6. Jaundice, Fever, Umbilical Cord & Choking Rescue',
    ],
    subTools: [
      { to: '/pediatric-helper', labelAr: 'حاسبة جرعات أشربة الأطفال بالوزن والسرنجة', labelEn: 'Weight-Based Syrup Calculator', icon: '💉' },
      { to: '/baby-milk', labelAr: 'دليل وبدائل حليب الأطفال والألبان العلاجية', labelEn: 'Baby Milk Formula Navigator', icon: '🍼' },
    ],
  },
  {
    id: 'orthopedics-gout',
    to: '/ortho-clinic',
    icon: '🦴',
    titleAr: 'عيادة العظام والمفاصل والعمود الفقري والنقرس',
    titleEn: 'Orthopedics, Spine, Sciatica & Gout Clinic',
    consultantBadgeAr: 'استشاري جراحة العظام والعمود الفقري والروماتيزم',
    consultantBadgeEn: 'Senior Orthopedics & Spine Consultant',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    descriptionAr: 'تشخيص وتدبير آلام الظهر والغضروف وعرق النسا، خشونة الركبة، نوبات النقرس والأملاح (اليورات والأوكسالات)، وحماية المعدة والكلى من المسكنات.',
    descriptionEn: 'Clinical management of lower back pain, sciatica, knee osteoarthritis, gout & urinary crystals, NSAID safety, and acute sprains.',
    modulesAr: [
      '١. المفرّق الإكلينيكي: ألم الظهر العضلي مقابل الانزلاق الغضروفي وعرق النسا',
      '٢. كاشف النقرس والأملاح (يورات مقابل أوكسالات): الأكلات والفوارات الصحيحة',
      '٣. بروتوكول خشونة الركبة وكبار السن وتمارين تقوية العضلة الرباعية',
      '٤. دليل أمان مسكنات العظام (NSAIDs) وحماية الكلى والمعدة من القرح',
      '٥. إسعاف التواء الكاحل والكدمات والتمزق العضلي (بروتوكول PRICE)',
      '٦. فيتامين د والكالسيوم والماغنسيوم وهشاشة العظام',
    ],
    modulesEn: [
      '1. Mechanical Back Pain vs. Herniated Disc & Sciatica Triage',
      '2. Gout & Crystals (Urate vs. Oxalate) Diet & Effervescent Guide',
      '3. Knee Osteoarthritis Protocol & Quadriceps Exercises',
      '4. Orthopedic NSAIDs Renal & Gastric Protection Rules',
      '5. Acute Ankle Sprain & Trauma PRICE First-Aid',
      '6. Vitamin D, Calcium & Osteoporosis Prevention',
    ],
  },
  {
    id: 'gastro-ibs-hpylori',
    to: '/gastro-clinic',
    icon: '🦠',
    titleAr: 'عيادة الجهاز الهضمي والقولون وجرثومة المعدة',
    titleEn: 'Gastroenterology, H. Pylori, IBS & Reflux Clinic',
    consultantBadgeAr: 'استشاري الجهاز الهضمي والكبد والمناظير',
    consultantBadgeEn: 'Senior Gastroenterology Consultant',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    descriptionAr: 'البروتوكول النهائي للقضاء على جرثومة المعدة ومنع انتكاستها، خريطة أكلات القولون العصبي والانتفاخ، علاج ارتجاع المريء، وإدارة النزلات المعوية.',
    descriptionEn: 'Complete GI care: H. Pylori eradication rules, Egyptian FODMAP diet for IBS, GERD reflux management, and acute food poisoning.',
    modulesAr: [
      '١. بروتوكول القضاء على «جرثومة المعدة» وشروط تحليل البراز الصحيح',
      '٢. خريطة أكلات القولون العصبي والانتفاخ (الأكلات المهيجة والبدائل المريحة)',
      '٣. عيادة ارتجاع المريء والحموضة المزمنة وقواعد مثبطات الحموضة (PPIs)',
      '٤. طوارئ النزلة المعوية والتسمم الغذائي (متى يمنع دواء إيقاف الإسهال؟)',
      '٥. علاج الإمساك المزمن والشرخ الشرجي والبواسير بدون ملينات مخرشة',
      '٦. علامات الإنذار في الجهاز الهضمي التي تستلزم منظاراً عاجلاً',
    ],
    modulesEn: [
      '1. H. Pylori Eradication & Stool Antigen Testing Rules',
      '2. Egyptian IBS & Bloating Food Trigger Map (FODMAP)',
      '3. GERD, Acid Reflux & PPI Timing Guide',
      '4. Acute Gastroenteritis & Food Poisoning Triage',
      '5. Chronic Constipation, Fissures & Hemorrhoids Protocol',
      '6. GI Red Flags Requiring Urgent Endoscopy',
    ],
  },
  {
    id: 'derma-burns-wounds',
    to: '/derma-clinic',
    icon: '🩹',
    titleAr: 'عيادة الجلدية والحروق والعناية بالجروح',
    titleEn: 'Dermatology, Burns & Wound Care Clinic',
    consultantBadgeAr: 'استشاري الأمراض الجلدية والتجميل والحروق',
    consultantBadgeEn: 'Senior Dermatology & Burn Specialist',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
    descriptionAr: 'كاشف مصيدة مراهم الكورتيزون والخلطات الشعبية، طوارئ الحروق والسمط بالماء المغلي، التفرقة بين الفطريات والإكزيما، والغيار الطبي الصحيح على الجروح.',
    descriptionEn: 'Topical steroid safety, emergency thermal/chemical burn care, fungal vs. eczema rash differentiation, diaper rash, and wound dressing.',
    modulesAr: [
      '١. كاشف مصيدة «مراهم الكورتيزون والخلطات الشعبية» ودرجات قوتها',
      '٢. طوارئ الحروق والسمط بالماء المغلي أو الزيت (تصحيح كوارث المعجون والبن)',
      '٣. المفرّق البصري: الفطريات (التينيا) مقابل الإكزيما والحمونيل والحزام الناري',
      '٤. بروتوكول تسلخات الحفاضة العنيدة (الالتهاب البكتيري والفطري الكانديدا)',
      '٥. الدليل الصحيح للغيار على الجروح والغرز والقدم السكري (محلول الملح والبيتادين)',
      '٦. روشتة حب الشباب الآمنة والتحذير الصارم من الرواكوتان/نت لوك',
    ],
    modulesEn: [
      '1. Topical Corticosteroid Potency & Misuse Trap Scanner',
      '2. Acute Burn & Scald First-Aid (Debunking Toothpaste/Coffee Myths)',
      '3. Fungal Tinea vs. Eczema, Heat Rash & Shingles Differentiation',
      '4. Stubborn Fungal (Candida) vs. Irritant Diaper Rash Protocol',
      '5. Surgical Wound, Ulcer & Diabetic Foot Dressing Guide',
      '6. Safe Acne Protocol & Isotretinoin Safety Rules',
    ],
  },
  {
    id: 'dental-emergency',
    to: '/dental-clinic',
    icon: '🦷',
    titleAr: 'عيادة طوارئ الأسنان واللثة وجراحة الفم',
    titleEn: 'Dental Emergency, Endodontics & Oral Surgery Clinic',
    consultantBadgeAr: 'استشاري طب وجراحة الفم والأسنان',
    consultantBadgeEn: 'Senior Dental & Oral Surgery Consultant',
    color: '#0891b2',
    gradient: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)',
    descriptionAr: 'بروتوكول إنقاذ ألم عصب الضرس الليلي، طوارئ خراج الأسنان وتورم الوجه، إعادة زرع السنة الدائمة المكسورة، وتعليمات الـ 24 ساعة بعد الخلع.',
    descriptionEn: '3 AM pulpitis pain relief, dental abscess & facial swelling triage, avulsed permanent tooth rescue, and post-extraction dry-socket prevention.',
    modulesAr: [
      '١. بروتوكول تسكين «ألم عصب الضرس الليلي» الحاد حتى الصباح',
      '٢. طوارئ خراج الأسنان وتورم الوجه (لماذا تمنع الكمادات الساخنة قطعاً؟)',
      '٣. إنقاذ السنة الدائمة الساقطة بالكامل في الحوادث خلال 60 دقيقة (حفظها في الحليب)',
      '٤. تعليمات الـ 24 ساعة الذهبية بعد خلع الضرس لمنع نزيف والتهاب السنخ الجاف',
      '٥. علاج قرح الفم المؤلمة، فطريات اللسان، ونزيف اللثة',
      '٦. أمان بنج الأسنان والأدوية لمرضى القلب والسكر والسيولة والحوامل',
    ],
    modulesEn: [
      '1. 3 AM Acute Pulpitis & Nerve Pain Relief Protocol',
      '2. Dental Abscess & Facial Cellulitis Emergency Triage',
      '3. Knocked-Out (Avulsed) Permanent Tooth 60-Min Milk Rescue',
      '4. Post-Extraction 24h Rules to Prevent Bleeding & Dry Socket',
      '5. Aphthous Mouth Ulcers, Oral Thrush & Gingivitis Care',
      '6. Dental Anesthesia Safety in Pregnancy, Cardiac & Anticoagulant Patients',
    ],
  },
  {
    id: 'g6pd-favism',
    to: '/g6pd-clinic',
    icon: '🫘',
    titleAr: 'عيادة أمراض الدم وأنيميا الفول الشاملة (G6PD)',
    titleEn: 'Hematology & G6PD Deficiency (Favism) Clinic',
    consultantBadgeAr: 'استشاري أمراض الدم والمناعة للأطفال والكبار',
    consultantBadgeEn: 'Senior Hematology Consultant',
    color: '#dc2626',
    gradient: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
    descriptionAr: 'المرجع الأول في مصر لمرضى أنيميا الفول: كاشف الأدوية الممنوعة والآمنة، البقوليات والمواد الكيميائية المحظورة، وطوارئ نوبة تكسير الدم الحادة.',
    descriptionEn: 'Egypt’s definitive G6PD deficiency hub: forbidden vs. safe medications scanner, hidden legume/chemical triggers, and acute hemolysis rescue.',
    modulesAr: [
      '١. محرك فحص الأدوية الممنوعة قطعاً في أنيميا الفول (السلفا، الأسبرين، الكينولون)',
      '٢. دليل بدائل خافضات الحرارة والمسكنات والمضادات الآمنة 100% لمريض أنيميا الفول',
      '٣. موسوعة الأكلات والبقوليات الممنوعة والخفية (الفول، الطعمية، الصويا، البصارة)',
      '٤. المحظورات الكيميائية غير الغذائية (الحنة، النفتالين، المنثول المركز، فيتامين C العالي)',
      '٥. رادار «نوبة تكسير الدم الحادة» (لون البول الداكن والشحوب) وخطة الطوارئ',
      '٦. كارت تحذير أنيميا الفول الرقمي الجاهز للمدرسة والحضانة والصيدلي',
    ],
    modulesEn: [
      '1. Contraindicated Drugs Scanner (Sulfa, Aspirin, Nitrofurantoin, Dapsone)',
      '2. 100% Safe Antipyretics, Analgesics & Antibiotics in G6PD',
      '3. Forbidden Legumes & Hidden Soya/Bean Derivatives Guide',
      '4. Chemical Triggers (Henna, Naphthalene Mothballs, High-Dose Vit C)',
      '5. Acute Hemolytic Crisis Radar (Cola-Colored Urine & Pallor) & ER Protocol',
      '6. Shareable Digital G6PD School & Pharmacy Emergency Alert Card',
    ],
  },
  {
    id: 'chronic-cardio-endo',
    to: '/chronic-clinic',
    icon: '🫀',
    titleAr: 'عيادة الباطنة والغدد (السكر، الضغط، القلب، والسيولة)',
    titleEn: 'Internal Medicine, Diabetes, Hypertension & Anticoagulation Clinic',
    consultantBadgeAr: 'استشاري الباطنة والغدد الصماء والقلب',
    consultantBadgeEn: 'Senior Internal Medicine & Cardiology Consultant',
    color: '#4f46e5',
    gradient: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)',
    descriptionAr: 'إدارة السكري ومقاومة الإنسولين والقدم السكري، قراءات الضغط والأدوية والأكلات الخفية التي ترفعه، وضوابط أدوية السيولة (الماريفان) والغدة الدرقية.',
    descriptionEn: 'Complete chronic care: Egyptian Glycemic Index & insulin storage, BP crisis triage & hidden pressors, Warfarin/Eliquis rules, and thyroid timing.',
    modulesAr: [
      '١. خريطة الأكلات المصرية لمرضى السكر وترتيب تناول الوجبة لمنع قفزة السكر',
      '٢. دليل حفظ وحقن الإنسولين الصحيح والعناية اليومية بالقدم السكري',
      '٣. مترجم قراءات ضغط الدم وطوارئ الضغط المرتفع (>180/120) وخطورة قرص تحت اللسان',
      '٤. كاشف الأدوية والمشروبات الخفية التي ترفع الضغط (العرقسوس، الفوارات، الكونجستال)',
      '٥. دستور أدوية السيولة (ماريفان، إليكويس، زاريلتو) وتعارض الملوخية والسبانخ (فيتامين K)',
      '٦. قواعد تناول دواء الغدة الدرقية (التروكسين / إيوثيروكس) لضمان الامتصاص الكامل',
    ],
    modulesEn: [
      '1. Egyptian Glycemic Index & Meal-Sequencing Protocol',
      '2. Insulin Pen Storage (28-Day Rule), Rotation & Diabetic Foot Care',
      '3. Blood Pressure Reading Decoder & Hypertensive Crisis Triage',
      '4. Hidden BP Spikers (Licorice/Erk-Sous, Effervescents, Decongestants)',
      '5. Anticoagulants (Warfarin vs. DOACs) & Vitamin K Leafy Greens Guide',
      '6. Levothyroxine (Eltroxin/Euthyrox) Strict Fasting Absorption Rules',
    ],
    subTools: [
      { to: '/hypo-rescue', labelAr: 'خطة إنقاذ هبوط السكر الحاد (قاعدة 15)', labelEn: 'Hypoglycemia Rescue (Rule of 15)', icon: '🚨' },
      { to: '/steroid-taper', labelAr: 'حاسبة سحب الكورتيزون التدريجي الآمن', labelEn: 'Safe Steroid Tapering Calculator', icon: '📉' },
      { to: '/inhaler-counter', labelAr: 'عداد رصيد بخاخات الصدر والربو', labelEn: 'Inhaler Dose Counter', icon: '🫁' },
    ],
  },
  {
    id: 'ophthalmology-eye',
    to: '/eye-clinic',
    icon: '👁️',
    titleAr: 'عيادة طب وجراحة العيون والبصريات وطوارئ القرنية',
    titleEn: 'Ophthalmology, Cornea & Eye Emergency Clinic',
    consultantBadgeAr: 'استشاري طب وجراحة العيون والقرنية',
    consultantBadgeEn: 'Senior Ophthalmology & Cornea',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
    descriptionAr: 'التحذير من فخ قطرات الكورتيزون وتبييض العين، إسعاف دخول الكلور أو رايش الحديد بالعين في 60 ثانية، دستور العدسات اللاصقة، وجفاف الشاشات.',
    descriptionEn: 'Topical steroid eye drop hazards, 60-sec chemical burn irrigation, contact lens keratitis rules, dry eye 20-20-20 protocol, and 28-day expiry.',
    modulesAr: [
      '١. فخ قطرات الكورتيزون (توبرادكس) والمخدر الموضعي وتبييض العين',
      '٢. طوارئ دخول كلور أو منظفات أو رايش حديد بالعين (قاعدة الـ 15 دقيقة)',
      '٣. دستور مستخدمي العدسات اللاصقة لمنع قرحة الأكانثاميبا الخطيرة',
      '٤. علاج جفاف العين وإجهاد الشاشات والموبايل (قاعدة 20-20-20)',
      '٥. التفرقة بين الرمد الصديدي، الحساسية، والدمّل والكيس الدهني (الكمادات)',
      '٦. قانون الـ 28 يوماً لانتهاء صلاحية قطرات العين بعد فتحها',
    ],
    modulesEn: [
      '1. Steroid & Anesthetic Eye Drop Hazards Scanner',
      '2. Chemical Splash & Metallic Foreign Body 15-Min Rescue',
      '3. Contact Lens Hygiene & Acanthamoeba Keratitis Prevention',
      '4. Digital Eye Strain (20-20-20 Rule) & Artificial Tears',
      '5. Bacterial vs Allergic Conjunctivitis & Stye/Chalazion Care',
      '6. The 28-Day Post-Opening Eye Drop Expiry Rule',
    ],
  },
  {
    id: 'ent-sinus-vertigo',
    to: '/ent-clinic',
    icon: '👂',
    titleAr: 'عيادة الأنف والأذن والحنجرة، الجيوب الأنفية، والدوار',
    titleEn: 'ENT, Sinusitis, Epistaxis & Vertigo Clinic',
    consultantBadgeAr: 'استشاري الأنف والأذن والحنجرة والاتزان',
    consultantBadgeEn: 'Senior ENT & Vestibular Consultant',
    color: '#0f766e',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    descriptionAr: 'بروتوكول إيقاف نزيف الأنف (الرعاف)، علاج إدمان نقط الأنف (الأوتريفين)، مناورة الدوار والأذن الوسطى، التفرقة بين لوز الفيروس والصديد، وأضرار الودانات.',
    descriptionEn: 'Nosebleed Trotter position, Otrivin rebound addiction weaning, BPPV vertigo maneuver, viral vs bacterial tonsillitis, and earwax care.',
    modulesAr: [
      '١. طوارئ نزيف الأنف (الرعاف): تصحيح خطأ إرجاع الرأس للخلف والوضعية الصحيحة',
      '٢. مصيدة إدمان نقط الأنف (الأوتريفين) وخطة الفطام منها في 7 أيام',
      '٣. عيادة الدوار والدوخة الكذابة (BPPV) ومناورة إيبلي لكريستالات الأذن',
      '٤. التفرقة الحاسمة بين التهاب اللوز الفيروسي والتهاب اللوز الصديدي البكتيري',
      '٥. شمع الأذن وكارثة أعواد القطن (الودانات) وطريقة إذابة الشمع بأمان',
      '٦. طوارئ دخول حشرة حية أو خرزة أو بطارية في أذن أو أنف الطفل',
    ],
    modulesEn: [
      '1. Nosebleed (Epistaxis) First-Aid & Trotter Position',
      '2. Decongestant Nasal Spray (Otrivin) Rebound Cure',
      '3. BPPV Positional Vertigo vs Central Vertigo & Epley Maneuver',
      '4. Viral Pharyngitis vs Bacterial Strep Tonsillitis (Centor Score)',
      '5. Earwax Impaction & Why Cotton Swabs Are Dangerous',
      '6. Live Insect, Bead or Button Battery in Ear/Nose Emergency',
    ],
  },
  {
    id: 'lab-test-decoder',
    to: '/lab-clinic',
    icon: '🔬',
    titleAr: 'عيادة ترجمة وقراءة التحاليل الطبية وشروط السحب',
    titleEn: 'Smart Lab Test Decoder & Pre-Test Preparation Clinic',
    consultantBadgeAr: 'استشاري الباثولوجيا الإكلينيكية والتحاليل الطبية',
    consultantBadgeEn: 'Senior Clinical Pathology Consultant',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    descriptionAr: 'مترجم أرقام التحاليل التفاعلي، ساعات الصيام الصحيحة لكل تحليل (وهل الماء مسموح؟)، الأدوية التي تزيف نتائج المعمل، وشروط مزرعة البول والهرمونات.',
    descriptionEn: 'Interactive lab value interpreter, fasting hours & water rules, biotin/drug interference alerts, urine culture prep, and cycle-day hormone guide.',
    modulesAr: [
      '١. مترجم أرقام التحاليل التفاعلي (الهيموجلوبين، الفيريتين، الغدة TSH، فيتامين د)',
      '٢. دستور ساعات الصيام قبل التحاليل (السكر والدهون) وحقيقة شرب الماء الصافي',
      '٣. كاشف الفيتامينات والأدوية التي تزيّف نتائج المعمل (خدعة البيوتين والكورتيزون)',
      '٤. الشروط القياسية لعينة «مزرعة البول» لمنع التلوث البكتيري الكاذب',
      '٥. جدول أيام الدورة الشهرية المحددة لتحاليل هرمونات الخصوبة للسيدات',
      '٦. أرقام الطوارئ الحرجة في ورقة التحاليل (السيولة INR، البوتاسيوم، الصفائح)',
    ],
    modulesEn: [
      '1. Interactive Lab Value Decoder (Hb, Ferritin, TSH, Vitamin D)',
      '2. Fasting Hours Protocol & Why Plain Water Is Encouraged',
      '3. Biotin & Medication Lab Assay Interference Warnings',
      '4. Mid-Stream Urine Culture Collection Rules',
      '5. Female Fertility Hormones Day-3 vs Day-21 Schedule',
      '6. Panic/Critical Lab Values Requiring Urgent Action',
    ],
  },
  {
    id: 'urology-renal-stones',
    to: '/urology-clinic',
    icon: '🧪',
    titleAr: 'عيادة الكلى، المسالك البولية، الحصوات، والبروستاتا',
    titleEn: 'Nephrology, Kidney Stones, UTI & Prostate Clinic',
    consultantBadgeAr: 'استشاري الكلى والمسالك البولية',
    consultantBadgeEn: 'Senior Nephrology & Urology Consultant',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
    descriptionAr: 'حاسبة كفاءة الكلى وتعديل جرعات الأدوية بالكرياتينين، بروتوكول طرد حصوات الحالب والمغص الكلوي، مترجم ألوان البول، وأدوية البرد التي تحبس البول لمرضى البروستاتا.',
    descriptionEn: 'Cockcroft-Gault CrCl renal calculator, ureteric stone expulsion protocol, urine color/foam decoder, BPH retention warnings, and nephrotoxic drugs.',
    modulesAr: [
      '١. حاسبة تصفية الكرياتينين وكفاءة الكلى (CrCl) لتعديل جرعات الأدوية',
      '٢. بروتوكول المغص الكلوي الحاد وطرد حصوات الحالب وعلامات الخطر الجراحية',
      '٣. مترجم ألوان ورغوة البول الطبي (زلال البول، الأدوية الملونة، والدم)',
      '٤. تحذير كبار السن ومرضى البروستاتا: أدوية البرد والمغص التي تسبب احتباس بول فوري!',
      '٥. الوقاية النهائية من التهابات مجرى البول المتكررة للسيدات',
      '٦. «الضربة الثلاثية القاتلة للكلى (Triple Whammy)» التي تدمر الكلى السليمة',
    ],
    modulesEn: [
      '1. Cockcroft-Gault Creatinine Clearance (CrCl) Dose Calculator',
      '2. Acute Renal Colic & Medical Expulsive Therapy for Stones',
      '3. Clinical Urine Color & Proteinuria Foam Decoder',
      '4. BPH Prostate Warning: Cold Meds That Trigger Urinary Retention',
      '5. Recurrent UTI Prevention Protocol in Women',
      '6. The Nephrotoxic "Triple Whammy" Drug Combination Alert',
    ],
  },
  {
    id: 'neurology-migraine-stroke',
    to: '/neuro-clinic',
    icon: '🧠',
    titleAr: 'عيادة المخ والأعصاب، الصداع النصفي، الجلطات، والأرق',
    titleEn: 'Neurology, Migraine, Stroke Rescue & Sleep Clinic',
    consultantBadgeAr: 'استشاري المخ والأعصاب والطب النفسي',
    consultantBadgeEn: 'Senior Neurology & Sleep Consultant',
    color: '#6d28d9',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
    descriptionAr: 'المفرّق الذكي لأنواع الصداع، رادار الساعة الذهبية لإنقاذ جلطة المخ (FAST)، إسعاف نوبة التشنج والصرع، العصب السابع، ونوبة الهلع مقابل الذبحة.',
    descriptionEn: 'Migraine vs tension headache, FAST stroke golden-hour radar, seizure first-aid, Bell’s palsy eye protection, panic attack vs heart attack, and sleep.',
    modulesAr: [
      '١. مفرّق أنواع الصداع (الشقيقة، التوتري، العنقي، وصداع المسكنات الارتدادي)',
      '٢. رادار اكتشاف الجلطة الدماغية في أول 60 دقيقة (قاعدة FAST) وتحذير الأسبرين!',
      '٣. إسعاف نوبة التشنج والصرع (تصحيح كارثة فتح الفم بالملعقة ووضع الإفاقة)',
      '٤. بروتوكول التهاب العصب السابع (أول 72 ساعة وحماية قرنية العين أثناء النوم)',
      '٥. التفرقة بين «نوبة الهلع Panic Attack» والذبحة الصدرية وتمرين التنفس (4-7-8)',
      '٦. علاج الأرق واضطراب الساعة البيولوجية بدون منومات إدمانية',
    ],
    modulesEn: [
      '1. Migraine, Tension & Medication-Overuse Headache Triage',
      '2. F.A.S.T. Stroke Golden-Hour Radar & Aspirin Warning',
      '3. Acute Seizure First-Aid & Recovery Position (No Spoon in Mouth!)',
      '4. Bell’s Palsy 72-Hour Steroid Window & Corneal Protection',
      '5. Panic Attack vs Acute Angina Differentiation & 4-7-8 Breathing',
      '6. Non-Habit-Forming Insomnia & Sleep Hygiene Protocol',
    ],
  },
  {
    id: 'poison-first-aid-er',
    to: '/poison-clinic',
    icon: '🚑',
    titleAr: 'عيادة طوارئ السموم، الكاويات، العقر، والإسعافات الأولية',
    titleEn: 'Poison Control, Animal Bites & Emergency First-Aid Clinic',
    consultantBadgeAr: 'استشاري السموم الإكلينيكية وطب الطوارئ',
    consultantBadgeEn: 'Senior Toxicology & Emergency ER',
    color: '#dc2626',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
    descriptionAr: 'طوارئ شرب الكلور والبطاس والجاز، بلع الأطفال للأدوية والبطارية، جدول الـ 5 حقن لعضة الكلب والسعار، لسعة قنديل البحر والعقرب، واختناق غاز السخان.',
    descriptionEn: 'Caustic bleach/kerosene ingestion rules, pediatric pill/battery overdose, dog bite 5-dose rabies schedule, jellyfish/scorpion stings, and CO gas.',
    modulesAr: [
      '١. طوارئ شرب الكلور والبطاس والفلاش والجاز (لماذا يُمنع التقيؤ قطعاً؟)',
      '٢. بلع الطفل للأدوية أو بطارية الساعة المسطحة (الفحم النشط وإسعاف العسل)',
      '٣. بروتوكول عضة الكلب أو القطة (غسيل الـ 15 دقيقة وجدول الـ 5 حقن للسعار)',
      '٤. إسعاف لسعة قنديل البحر بالخل وقرصة العقرب والثعبان',
      '٥. القاتل الصامت: اختناق غاز السخان وكارثة خلط «الكلور مع الفلاش»!',
      '٦. إسعاف ضربة الشمس الحادة والصعق الكهربائي في الثواني الأولى',
    ],
    modulesEn: [
      '1. Bleach, Drain Opener & Kerosene Ingestion (Never Induce Vomiting!)',
      '2. Pediatric Pill Overdose & Button Battery Ingestion Protocol',
      '3. Dog/Cat Bite 15-Min Soap Wash & 5-Dose Rabies Vaccine Schedule',
      '4. Jellyfish Vinegar Wash & Scorpion/Snake Bite First-Aid',
      '5. Silent Killer: Water Heater CO Poisoning & Bleach-Acid Chlorine Gas',
      '6. Heatstroke Cooling & Electrical Shock Emergency Rescue',
    ],
  },
  {
    id: 'clinical-nutrition-glp1',
    to: '/nutrition-clinic',
    icon: '🥗',
    titleAr: 'عيادة التغذية العلاجية، حقن التخسيس (GLP-1)، والصيام المتقطع',
    titleEn: 'Clinical Nutrition, GLP-1 Weight Loss & Metabolic Clinic',
    consultantBadgeAr: 'استشاري التغذية العلاجية والسمنة',
    consultantBadgeEn: 'Senior Clinical Nutrition Consultant',
    color: '#16a34a',
    gradient: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
    descriptionAr: 'حاسبة السعرات والبروتين لحماية العضلات والشعر، الدليل الطبي الآمن لحقن التخسيس (أوزيمبيك، مونجارو، ساكسندا)، الأورليستات، وعلاج مقاومة الإنسولين والنحافة.',
    descriptionEn: 'TDEE & protein calculator, safe GLP-1 injection rules (Ozempic/Mounjaro), Orlistat vitamin protocol, intermittent fasting, and healthy weight gain.',
    modulesAr: [
      '١. حاسبة السعرات الحرارية اليومية (TDEE) والاحتياج الدقيق من البروتين والماء',
      '٢. الدستور الطبي لحقن التخسيس (أوزيمبيك، مونجارو) والممنوعين منها وشروط البنج',
      '٣. قواعد كبسولات عزل الدهون (أورليستات) وتعويض فيتامينات A, D, E, K',
      '٤. بروتوكول الصيام المتقطع (16/8 و 14/10 للسيدات) لتنشيط حرق الدهون العنيدة',
      '٥. علاج مقاومة الإنسولين (اسمرار الرقبة ودهون البطن) وخل التفاح',
      '٦. علاج النحافة الصحية والتحذير القاتل من «خلطة التسمين بالديكسازون والكورتيزون»!',
    ],
    modulesEn: [
      '1. TDEE Calorie, Muscle-Saving Protein & Hydration Calculator',
      '2. GLP-1 Injections (Ozempic/Mounjaro) Contraindications & Pre-Op Stop Rule',
      '3. Orlistat Fat-Blocker Rules & Fat-Soluble Vitamin Replacement',
      '4. Intermittent Fasting (16/8 & 14/10) Autophagy Protocol',
      '5. Insulin Resistance (HOMA-IR) & Acanthosis Nigricans Cure',
      '6. Healthy Weight Gain & Warning Against Dexamethasone Abuse',
    ],
  },
  {
    id: 'womens-health-pcos',
    to: '/women-clinic',
    icon: '🌸',
    titleAr: 'عيادة صحة المرأة، تكيس المبايض (PCOS)، الدورة، ومنع الحمل',
    titleEn: 'Women’s Health, PCOS, Menstrual Care & Contraception Clinic',
    consultantBadgeAr: 'استشاري صحة المرأة والغدد التناسلية',
    consultantBadgeEn: 'Senior Women’s Health Consultant',
    color: '#db2777',
    gradient: 'linear-gradient(135deg, #9d174d 0%, #db2777 100%)',
    descriptionAr: 'المساعد التفاعلي عند نسيان حبة منع الحمل، مقارنة اللولب والكبسولة والأقراص، بروتوكول علاج تكيس المبايض والشعر الزائد، تسكين آلام الدورة، والفحص الذاتي للثدي.',
    descriptionEn: 'Interactive missed-pill solver, IUD vs implant comparison, PCOS & hirsutism protocol, menstrual cramps relief, and monthly breast self-exam.',
    modulesAr: [
      '١. المساعد التفاعلي الفوري: «نسيت حبة منع الحمل، أتصرف إزاي حسب نوع الشريط؟»',
      '٢. مقارنة وسائل منع الحمل في مصر (اللولب النحاسي والهرموني، الكبسولة، والأقراص)',
      '٣. بروتوكول متلازمة تكيس المبايض (PCOS) والإينوزيتول وعلاج الشعر الزائد',
      '٤. التغلب على مغص وآلام الدورة الشهرية الشديدة وعلامات بطانة الرحم المهاجرة',
      '٥. خطوات وموعد الفحص الذاتي للثدي شهرياً (اليوم 7-10 من الدورة) للاطمئنان',
      '٦. علاج غزارة الطمث ونزيف الدورة والأنيميا الخفية للسيدات',
    ],
    modulesEn: [
      '1. Interactive Missed Contraceptive Pill Action Solver',
      '2. Copper IUD vs Hormonal Mirena vs Implanon Arm Implant Guide',
      '3. PCOS Insulin Sensitization, Inositol & Hirsutism Protocol',
      '4. Severe Dysmenorrhea Relief & Endometriosis Red Flags',
      '5. Monthly Breast Self-Exam (Days 7-10) Step-by-Step Guide',
      '6. Heavy Menstrual Bleeding (Menorrhagia) & Iron Recovery',
    ],
  },
  {
    id: 'geriatric-care-bedsores',
    to: '/geriatric-clinic',
    icon: '👴',
    titleAr: 'عيادة رعاية المسنين، قرح الفراش، الزهايمر، ومنع الكسور',
    titleEn: 'Geriatric Care, Bedsore Prevention, Alzheimer’s & Fall Safety Clinic',
    consultantBadgeAr: 'استشاري طب المسنين والرعاية المنزلية',
    consultantBadgeEn: 'Senior Geriatric Medicine Consultant',
    color: '#b45309',
    gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
    descriptionAr: 'الدليل العملي لرعاية الأجداد وكبار السن بالمنزل: منع وعلاج قرح الفراش، تأمين الحمام لمنع كسر مفصل الحوض، التعامل مع شرقة الماء، والزهايمر والهذيان المفاجئ.',
    descriptionEn: 'Home care for seniors: pressure ulcer prevention, hip fracture fall proofing, dysphagia water choking, and acute delirium vs dementia.',
    modulesAr: [
      '١. بروتوكول منع وعلاج «قرح الفراش» والمرتبة الهوائية وساعة التقليب كل ساعتين',
      '٢. حماية الجد والجدة من «كسر مفصل الحوض» ليلاً (قاعدة الـ 3 دقائق وتأمين الحمام)',
      '٣. التعامل مع «شرقة الماء وصعوبة البلع» بعد الجلطات لحماية الرئة من الالتهاب',
      '٤. الفرق الحاسم بين «الزهايمر التدريجي» و«الهذيان المفاجئ في يوم وليلة (Delirium)»!',
      '٥. العناية بالحفاضات للكبار وقواعد كيس القسطرة البولية لمنع تسمم الدم',
      '٦. قائمة الأدوية الخطرة والمحظورة على كبار السن فوق 65 عاماً (Beers Criteria)',
    ],
    modulesEn: [
      '1. Bedsore Prevention, Air Mattress & 2-Hour Repositioning Protocol',
      '2. Nocturnal Hip Fracture & Orthostatic Hypotension Prevention',
      '3. Post-Stroke Dysphagia & Water Choking (Chin-Tuck Technique)',
      '4. Gradual Alzheimer’s vs Sudden Overnight Delirium (Hidden UTI/Sepsis)',
      '5. Urinary Catheter Bag Positioning & Incontinence Skin Care',
      '6. Beers Criteria: High-Risk Medications to Avoid in Seniors',
    ],
    subTools: [
      { to: '/senior-pills', labelAr: 'مساعد كبار السن بالصوت وفاحص شكل ولون الحبة', labelEn: 'Senior Pill Visual ID & Voice', icon: '👵' },
    ],
  },
  {
    id: 'hair-skincare-trichology',
    to: '/hair-clinic',
    icon: '💇‍♀️',
    titleAr: 'عيادة سقوط الشعر، الصلع الوراثي، المينوكسيديل، وروتين البشرة',
    titleEn: 'Hair Loss, Minoxidil Protocol & Clinical Skincare Clinic',
    consultantBadgeAr: 'استشاري علاج الشعر والصلع الوراثي والبشرة',
    consultantBadgeEn: 'Senior Trichology & Skincare Consultant',
    color: '#86198f',
    gradient: 'linear-gradient(135deg, #701a75 0%, #c026d3 100%)',
    descriptionAr: 'التفرقة بين سقوط الشعر التفاعلي والصلع الوراثي، دستور استخدام وسحب المينوكسيديل بأمان، التحاليل الـ 5 الأساسية للشعر، وروتين البشرة الصيدلاني.',
    descriptionEn: 'Telogen effluvium vs androgenetic alopecia, safe Minoxidil rules, the 5 essential hair labs, and pharmacy skincare routines.',
    modulesAr: [
      '١. المفرّق الطبي: التساقط التفاعلي (بعد دايت أو ولادة) مقابل الصلع الوراثي',
      '٢. دستور المينوكسيديل (سر تساقط أول شهرين، منع شعر الوجه، وطريقة السحب التدريجي)',
      '٣. التحاليل الـ 5 الإلزامية لسقوط الشعر (لماذا يجب رفع الفيريتين فوق 70؟)',
      '٤. روتين العناية الصيدلاني الاقتصادي حسب نوع البشرة (الدهنية، الجافة، والمختلطة)',
      '٥. خلطات تدمر حاجز البشرة (تعارض الأكرتين/الريتينول مع فيتامين C والأحماض)',
      '٦. الطريقة الصحيحة لاستخدام شامبو القشرة الطبي (ترك الرغوة 5 دقائق كاملة)',
    ],
    modulesEn: [
      '1. Telogen Effluvium vs Androgenetic Alopecia Differentiation',
      '2. Minoxidil Masterclass: Dread Shed, Facial Hair Prevention & Tapering',
      '3. The 5 Essential Hair Labs (Why Ferritin Must Exceed 50-70 ng/mL)',
      '4. Customized Pharmacy Routine for Oily, Dry & Combination Skin',
      '5. Dangerous Skincare Mixes (Retinoids + Vitamin C / Acids)',
      '6. Medicated Dandruff Shampoo 5-Minute Contact Time Rule',
    ],
  },
  {
    id: 'chest-asthma-nebulizer',
    to: '/chest-clinic',
    icon: '🫁',
    titleAr: 'عيادة الصدر، حساسية الربو، جلسات البخار، والكحة المزمنة',
    titleEn: 'Pulmonology, Nebulizer Masterclass, Asthma & Smoking Cessation Clinic',
    consultantBadgeAr: 'استشاري الأمراض الصدرية والحساسية والتنفس',
    consultantBadgeEn: 'Senior Pulmonology & Asthma Consultant',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    descriptionAr: 'الدليل العملي لتحضير جلسات البخار المنزلية بأمان، مفرّق الكحة المزمنة (الصدر مقابل المعدة ودواء الضغط)، تقنية البخاخات الصحيحة، وخطة الإقلاع عن التدخين.',
    descriptionEn: 'Home nebulizer dilution rules, chronic cough differentiator, inhaler rinsing rules, and smoking/vape cessation timeline.',
    modulesAr: [
      '١. دستور جلسات البخار (النيبولايزر): الفاركولين والبالميكورت وتحذير الماء المقطر!',
      '٢. مفرّق الكحة المزمنة (>3 أسابيع): كحة الربو، كحة الارتجاع، وكحة دواء الضغط!',
      '٣. خطوات بخاخ الصدر الصحيحة (حبس النفس 10 ثوانٍ والمضمضة الإلزامية بعده)',
      '٤. الأدوية التي تهيج أزمة ربو فورية وقاتلة (الأسبرين، البروفين، الفولتارين، الإندرال)',
      '٥. جدول تعافي الرئة بالساعة واليوم بعد إيقاف السجائر والفيب (Vape)',
      '٦. علامات الخطر لتحول نزلة البرد إلى التهاب رئوي ونقص أكسجين',
    ],
    modulesEn: [
      '1. Home Nebulizer Rules (Normal Saline Only—Never Distilled Water!)',
      '2. Chronic Cough Decoder: Asthma vs GERD vs ACE-Inhibitor BP Meds',
      '3. Proper Inhaler Technique (10-Sec Breath Hold & Mouth Rinsing)',
      '4. Drugs That Trigger Acute Asthma Attacks (NSAIDs & Beta-Blockers)',
      '5. Hour-by-Hour Lung Recovery Timeline After Quitting Smoking/Vaping',
      '6. Pneumonia & Hypoxia Red Flags (Oximeter <92% & Chest Retractions)',
    ],
    subTools: [
      { to: '/inhaler-counter', labelAr: 'عداد الرصيد المتبقي لبخاخات الصدر والربو', labelEn: 'Inhaler Dose Counter', icon: '🫁' },
    ],
  },
];

export default function SpecialtyClinicsHub() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClinics = useMemo(() => {
    if (!searchTerm.trim()) return SPECIALTY_CLINICS_LIST;
    const q = searchTerm.toLowerCase().trim();
    return SPECIALTY_CLINICS_LIST.filter(
      (c) =>
        c.titleAr.toLowerCase().includes(q) ||
        c.titleEn.toLowerCase().includes(q) ||
        c.descriptionAr.toLowerCase().includes(q) ||
        c.modulesAr.some((m) => m.toLowerCase().includes(q))
    );
  }, [searchTerm]);

  return (
    <main className="wrap" style={{ maxWidth: '1180px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Banner */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e3a5f 50%, #138866 100%)',
          color: '#ffffff',
          borderRadius: '22px',
          padding: '32px 26px',
          boxShadow: '0 14px 40px rgba(13, 31, 56, 0.28)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span
            style={{
              background: 'rgba(207, 210, 157, 0.2)',
              color: '#CFD29D',
              border: '1px solid rgba(207, 210, 157, 0.45)',
              padding: '6px 16px',
              borderRadius: '30px',
              fontWeight: 800,
              fontSize: '0.86rem',
            }}
          >
            🏥 {tr(lang, 'مجمع عيادات دوايا التخصصية المتكاملة (20 عيادة وأداة استشارية شاملة)', 'DAWAYA Integrated Specialty Clinics Hub (20 Full Clinics)')}
          </span>
          <span
            style={{
              background: 'rgba(19, 136, 102, 0.45)',
              color: '#dcfce7',
              padding: '6px 14px',
              borderRadius: '30px',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            🩺 {tr(lang, 'خبرة استشارية 40 عاماً في كل تخصص طبي', '40-Year Senior Consultant Protocols')}
          </span>
        </div>

        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, margin: '4px 0 12px', color: '#ffffff', lineHeight: 1.3 }}>
          {tr(lang, 'بوابة العيادات الطبية التخصصية الشاملة', 'Specialty Medical Clinics & Patient Care Hub')}
        </h1>
        <p style={{ fontSize: '1.05rem', opacity: 0.94, maxWidth: '880px', lineHeight: 1.65, margin: '0 0 20px' }}>
          {tr(
            lang,
            'اختر العيادة التخصصية المناسبة لحالتك أو حالة أسرتك؛ كل عيادة مصممة كمنظومة متكاملة تضم 6 أقسام إكلينيكية مفصلة، قوائم الممنوع والمسموح، حاسبات طبية، وبروتوكولات الطوارئ المعتمدة عالمياً.',
            'Select a specialty clinic below. Each clinic operates as a complete 6-module medical department featuring safe vs. forbidden lists, interactive calculators, and emergency triage protocols.'
          )}
        </p>

        {/* Search Input */}
        <div style={{ maxWidth: '680px', position: 'relative' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={tr(
              lang,
              'ابحث عن عيادة أو حالة طبية (مثال: حمل، رضيع، عظام، نقرس، قولون، جرثومة، حروق، أسنان، أنيميا الفول، سكر، ضغط)...',
              'Search any clinic or condition (e.g. pregnancy, newborn, gout, sciatica, H. pylori, burns, dental, G6PD, diabetes)...'
            )}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '2px solid #CFD29D',
              fontSize: '1rem',
              fontWeight: 600,
              background: '#ffffff',
              color: '#0f172a',
              outline: 'none',
            }}
          />
        </div>
      </section>

      {/* Clinics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {filteredClinics.map((clinic) => (
          <article
            key={clinic.id}
            className="card"
            style={{
              borderRadius: '20px',
              padding: '0',
              overflow: 'hidden',
              border: `2px solid ${clinic.color}33`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#ffffff',
              boxShadow: '0 8px 26px rgba(13, 31, 56, 0.07)',
            }}
          >
            <div>
              {/* Card Top Colored Header */}
              <div
                style={{
                  background: clinic.gradient,
                  color: '#ffffff',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{clinic.icon}</span>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    🩺 {isAr ? clinic.consultantBadgeAr : clinic.consultantBadgeEn}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.32rem', fontWeight: 900, margin: 0, color: '#ffffff', lineHeight: 1.35 }}>
                  {isAr ? clinic.titleAr : clinic.titleEn}
                </h2>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px' }}>
                <p className="small" style={{ margin: '0 0 14px', color: '#334155', lineHeight: 1.55, fontWeight: 600, fontSize: '0.92rem' }}>
                  {isAr ? clinic.descriptionAr : clinic.descriptionEn}
                </p>

                <div
                  style={{
                    background: 'var(--tint)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    border: '1px solid var(--line)',
                    marginBottom: '14px',
                  }}
                >
                  <b style={{ fontSize: '0.84rem', color: '#0D1F38', display: 'block', marginBottom: '8px' }}>
                    📋 {tr(lang, 'الأقسام الـ 6 داخل هذه العيادة:', '6 Clinical Modules Inside:')}
                  </b>
                  <ul
                    style={{
                      margin: 0,
                      padding: 0,
                      listStyle: 'none',
                      display: 'grid',
                      gap: '5px',
                    }}
                  >
                    {(isAr ? clinic.modulesAr : clinic.modulesEn).map((mod, mIdx) => (
                      <li
                        key={mIdx}
                        style={{
                          fontSize: '0.81rem',
                          color: '#1e293b',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <span style={{ color: clinic.color, fontWeight: 900 }}>•</span>
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Companion Sub-Tools if any */}
                {clinic.subTools && clinic.subTools.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span className="small muted" style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.78rem' }}>
                      🔗 {tr(lang, 'أدوات وحاسبات ملحقة بالعيادة:', 'Attached Specialty Calculators:')}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {clinic.subTools.map((st, sIdx) => (
                        <Link
                          key={sIdx}
                          to={st.to}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '5px 10px',
                            borderRadius: '8px',
                            background: '#f1f5f9',
                            color: '#0D1F38',
                            textDecoration: 'none',
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          {st.icon} {isAr ? st.labelAr : st.labelEn}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action Button */}
            <div style={{ padding: '0 20px 20px' }}>
              <Link
                to={clinic.to}
                className="btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: clinic.gradient,
                  color: '#ffffff',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '0.96rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                }}
              >
                <span>🚪 {tr(lang, 'دخول العيادة التخصصية الكاملة', 'Enter Complete Specialty Clinic')}</span>
                <span>{isAr ? '←' : '→'}</span>
              </Link>
            </div>
          </article>
        ))}
      </div>

      <Disclaimer />
    </main>
  );
}
