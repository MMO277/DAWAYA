import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, configured } from './firebase';

export type CampaignVisualKind =
  | 'ramadan'
  | 'eid_fitr'
  | 'eid_adha'
  | 'pink_ribbon'
  | 'heart_ecg'
  | 'diabetes_ring'
  | 'kidney_care'
  | 'lungs_breath'
  | 'baby_mom'
  | 'brain_mental'
  | 'shield_health';

export interface WhoHealthCampaign {
  id: string;
  visualKind: CampaignVisualKind;
  titleAr: string;
  titleEn: string;
  greetingAr: string;
  greetingEn: string;
  messageAr: string;
  messageEn: string;
  badgeAr: string;
  badgeEn: string;
  basketTitleAr: string;
  basketTitleEn: string;
  tipsAr: string[];
  tipsEn: string[];
  icon: string;
  targetRoute: string;
  ctaAr: string;
  ctaEn: string;
  accentColor: string;
  heroGradient: string;
  /** Gregorian calendar match (month 1..12, startDay..endDay) */
  month?: number;
  startDay?: number;
  endDay?: number;
  /** Hijri calendar match (hijriMonth 1..12, startDay..endDay) - auto-updates every year! */
  hijriMonth?: number;
  hijriStartDay?: number;
  hijriEndDay?: number;
}

export const WHO_HEALTH_CAMPAIGNS: WhoHealthCampaign[] = [
  // ── 1. Auto-Updating Islamic Occasions (Hijri Calendar) ──
  {
    id: 'ramadan_kareem',
    visualKind: 'ramadan',
    hijriMonth: 9,
    hijriStartDay: 1,
    hijriEndDay: 30,
    titleAr: 'رمضان كريم — ساعة الصيام الذكية وتنظيم الأدوية',
    titleEn: 'Ramadan Kareem — Safe Fasting & Medication Timing',
    greetingAr: 'رمضان كريم! كل عام وأنتم بخير',
    greetingEn: 'Ramadan Kareem! Wishing you health & peace',
    messageAr: 'دوايا معاك من الفطار للسحور لتنظيم مواعيد أدوية الضغط والسكر والغدة بأمان.',
    messageEn: 'DAWAYA helps reschedule BP, diabetes, and thyroid medications safely between Iftar & Suhur.',
    badgeAr: '🌙 رمضان كريم (يتجدد تلقائياً كل عام)',
    badgeEn: '🌙 Ramadan Kareem',
    basketTitleAr: '🧺 سلة وعي الصائم في رمضان:',
    basketTitleEn: '🧺 Ramadan Fasting Wellness Basket:',
    tipsAr: [
      '1️⃣ دواء الغدة الدرقية (إلتروكسين): يُؤخذ على معدة فاضية مع أذان المغرب بكوب ماء، ثم الإفطار بعد 45–60 دقيقة.',
      '2️⃣ مريض السكر: قِس السكر لو حسيت بدوخة أو عرق بارد، ولو أقل من 70 افطر فوراً لحماية حياتك.',
      '3️⃣ اشرب 8–10 أكواب ماء مقسمة بين الإفطار والسحور لحماية الكلى خاصة مع أدوية الضغط.',
    ],
    tipsEn: [
      '1. Thyroid pills (Eltroxin): Take with water at Maghrib on empty stomach, eat 45-60 min later.',
      '2. Diabetes safety: Test blood sugar if dizzy; break fast immediately if below 70 mg/dL.',
      '3. Drink 8-10 glasses of water between Iftar and Suhur to protect kidneys.',
    ],
    icon: '🌙',
    targetRoute: '/ramadan-clock',
    ctaAr: '🕌 افتح ساعة الصيام وجدول أدويتك ←',
    ctaEn: '🕌 Open Ramadan Clock →',
    accentColor: '#b45309',
    heroGradient: 'linear-gradient(145deg, #101E36 0%, #311042 48%, #b45309 100%)',
  },
  {
    id: 'eid_al_fitr',
    visualKind: 'eid_fitr',
    hijriMonth: 10,
    hijriStartDay: 1,
    hijriEndDay: 3,
    titleAr: 'عيد فطر سعيد — كل عام وأنتم بخير وصحة',
    titleEn: 'Eid Al-Fitr Mubarak — Wishing You Health & Joy',
    greetingAr: 'عيد فطر سعيد ومبارك!',
    greetingEn: 'Eid Al-Fitr Mubarak!',
    messageAr: 'استمتع بفرحة العيد مع إرشادات طبية سريعة تحمي معدتك وضغطك وسكرك.',
    messageEn: 'Celebrate safely with quick tips to protect your stomach, blood pressure & glucose.',
    badgeAr: '🎉 عيد فطر سعيد (3 أيام العيد)',
    badgeEn: '🎉 Eid Al-Fitr Mubarak',
    basketTitleAr: '🧺 سلة وعي عيد الفطر:',
    basketTitleEn: '🧺 Eid Al-Fitr Health Basket:',
    tipsAr: [
      '1️⃣ الكحك والبسكويت: قطعة أو اتنين كفاية بعد الفطار بساعة عشان متعملش ارتفاع حاد في السكر.',
      '2️⃣ مريض الضغط والكلى: قلل الفسيخ والرنجة جداً، واشرب مية كتير مع خيار وبقدونس لتقليل الصوديوم.',
      '3️⃣ لو جالك حموضة أو تلبك معدي، افتح عيادة الجهاز الهضمي فوراً.',
    ],
    tipsEn: [
      '1. Limit Eid pastries (Kahk) to 1-2 pieces to avoid sudden blood sugar spikes.',
      '2. High BP/Kidney patients: avoid high-salt cured fish and drink plenty of water.',
      '3. Visit the Gastro Clinic for quick relief if acidity or bloating occurs.',
    ],
    icon: '🎉',
    targetRoute: '/gastro-clinic',
    ctaAr: '🦠 افتح عيادة الجهاز الهضمي والقولون ←',
    ctaEn: '🦠 Open Gastro Clinic →',
    accentColor: '#059669',
    heroGradient: 'linear-gradient(145deg, #064e3b 0%, #047857 52%, #10b981 100%)',
  },
  {
    id: 'eid_al_adha',
    visualKind: 'eid_adha',
    hijriMonth: 12,
    hijriStartDay: 10,
    hijriEndDay: 13,
    titleAr: 'عيد أضحى مبارك — أضحية مقبولة وصحة دايمة',
    titleEn: 'Eid Al-Adha Mubarak — Health & Blessings',
    greetingAr: 'عيد أضحى مبارك! كل سنة وأنتم طيبين',
    greetingEn: 'Eid Al-Adha Mubarak!',
    messageAr: 'توجيهات ذهبية لمرضى النقرس والضغط والكوليسترول والمرارة خلال أيام العيد.',
    messageEn: 'Essential guidance for gout, hypertension, cholesterol & gallbladder care during Eid.',
    badgeAr: '🐑 عيد أضحى مبارك (4 أيام العيد)',
    badgeEn: '🐑 Eid Al-Adha Mubarak',
    basketTitleAr: '🧺 سلة وعي عيد الأضحى:',
    basketTitleEn: '🧺 Eid Al-Adha Health Basket:',
    tipsAr: [
      '1️⃣ مريض النقرس والأملاح: اللحوم الحمراء والكبدة بترفع اليوريك أسيد؛ اشرب 3 لتر مية يومياً وقلل الكمية.',
      '2️⃣ مريض المرارة والكوليسترول: تجنب الفتة الدسمة والمقليات، وابدأ وجبتك بطبق السلطة الخضراء.',
      '3️⃣ بلاش شاي بعد الأكل مباشرة عشان ما يمنعش امتصاص الحديد؛ استنى ساعة ونص.',
    ],
    tipsEn: [
      '1. Gout/Uric Acid: Limit red meat & organ meats; drink 3L of water daily.',
      '2. Gallbladder/Cholesterol: Avoid heavy fried fatty meals and start with green salad.',
      '3. Wait 90 minutes after meals before drinking tea so iron absorption is not blocked.',
    ],
    icon: '🐑',
    targetRoute: '/ortho-clinic',
    ctaAr: '🦴 افتح عيادة النقرس والأملاح ←',
    ctaEn: '🦴 Open Gout & Ortho Clinic →',
    accentColor: '#0d9488',
    heroGradient: 'linear-gradient(145deg, #0f172a 0%, #0f766e 52%, #14b8a6 100%)',
  },

  // ── 2. Full WHO Global Health Calendar (Visible ONLY on their exact official days!) ──
  {
    id: 'world_cancer_day',
    visualKind: 'pink_ribbon',
    month: 2, startDay: 4, endDay: 4,
    titleAr: 'اليوم العالمي للسرطان (WHO) — الوقاية والكشف المبكر',
    titleEn: 'World Cancer Day (WHO)',
    greetingAr: 'نحيي اليوم العالمي للسرطان — معاً للوقاية والكشف المبكر',
    greetingEn: 'World Cancer Day — Early Detection Saves Lives',
    messageAr: 'الفحص الدوري والبعد عن التدخين والغذاء الصحي يقللون المخاطر بنسبة كبيرة.',
    messageEn: 'Routine screening, smoke-free living & healthy diet cut risks.',
    badgeAr: '🎗️ اليوم العالمي للسرطان (4 فبراير)',
    badgeEn: '🎗️ World Cancer Day',
    basketTitleAr: '🧺 سلة وعي اليوم العالمي للسرطان:',
    basketTitleEn: '🧺 World Cancer Day Awareness Basket:',
    tipsAr: [
      '1️⃣ الكشف الدوري السنوي يرفع نسب الشفاء لأكثر من 90% عند الاكتشاف المبكر.',
      '2️⃣ الإقلاع عن التدخين وتقليل اللحوم المصنعة يحمي الرئة والقولون.',
      '3️⃣ المشي 30 دقيقة يومياً يدعم مناعة الجسم الطبيعية.',
    ],
    tipsEn: ['1. Annual screening saves lives.', '2. Quit smoking & limit processed meats.', '3. Walk 30 min daily.'],
    icon: '🎗️', targetRoute: '/clinics', ctaAr: '🏥 تصفح العيادات التخصصية ←', ctaEn: 'Browse Clinics →',
    accentColor: '#7c3aed', heroGradient: 'linear-gradient(145deg, #2e1065 0%, #5b21b6 52%, #7c3aed 100%)',
  },
  {
    id: 'world_hearing_day',
    visualKind: 'shield_health',
    month: 3, startDay: 3, endDay: 3,
    titleAr: 'اليوم العالمي للسمع والأذن (WHO) — احمِ سمعك',
    titleEn: 'World Hearing Day (WHO)',
    greetingAr: 'اليوم العالمي للسمع وصحة الأذن',
    greetingEn: 'World Hearing Day',
    messageAr: 'أوعى تحط أي نقط في ودنك أو تستخدم ودانة قطن جوه القناة السمعية من غير فحص طبلة الأذن.',
    messageEn: 'Never insert cotton swabs or unprescribed ear drops without checking the eardrum.',
    badgeAr: '👂 اليوم العالمي للسمع (3 مارس)',
    badgeEn: '👂 World Hearing Day',
    basketTitleAr: '🧺 سلة وعي صحة الأذن والسمع:',
    basketTitleEn: '🧺 Ear & Hearing Care Basket:',
    tipsAr: [
      '1️⃣ حافظ على مستوى صوت السماعات أقل من 60% ولا تزيد عن ساعة متواصلة.',
      '2️⃣ ممنوع إدخال أعواد القطن أو المفاتيح داخل الأذن لأنها تدفع الشمع للطبلة.',
      '3️⃣ عند وجود ألم أو طنين أو دوار، راجع عيادة الأنف والأذن والحنجرة.',
    ],
    tipsEn: ['1. Keep headphone volume under 60%.', '2. Avoid cotton swabs inside ear canal.', '3. Visit ENT Clinic for pain/vertigo.'],
    icon: '👂', targetRoute: '/ent-clinic', ctaAr: '👂 افتح عيادة الأنف والأذن ←', ctaEn: 'Open ENT Clinic →',
    accentColor: '#0284c7', heroGradient: 'linear-gradient(145deg, #0c4a6e 0%, #0369a1 52%, #0284c7 100%)',
  },
  {
    id: 'world_kidney_day',
    visualKind: 'kidney_care',
    month: 3, startDay: 12, endDay: 12,
    titleAr: 'اليوم العالمي للكلى (WHO) — احمِ كليتيك من المسكنات',
    titleEn: 'World Kidney Day (WHO)',
    greetingAr: 'اليوم العالمي للكلى — كليتك أمانة',
    greetingEn: 'World Kidney Day — Protect Your Kidneys',
    messageAr: 'احذر الضربة الثلاثية للكلى: خلط المسكنات القوية مع أدوية الضغط ومدرات البول بدون إشراف.',
    messageEn: 'Beware the Kidney Triple Whammy: NSAIDs + ACEi/ARB + Diuretics.',
    badgeAr: '🫘 اليوم العالمي للكلى (12 مارس)',
    badgeEn: '🫘 World Kidney Day',
    basketTitleAr: '🧺 سلة وعي حماية الكلى:',
    basketTitleEn: '🧺 Kidney Protection Basket:',
    tipsAr: [
      '1️⃣ اشرب 2.5 إلى 3 لتر ماء يومياً لمنع ترسيب الأملاح والحصوات.',
      '2️⃣ لا تفرط في المسكنات (فولتارين، كتافلام، بروفين) لأنها تضعف تروية الكلى.',
      '3️⃣ راقب تحليل الكرياتينين واحسب كفاءة كليتك من عيادة الكلى في دوايا.',
    ],
    tipsEn: ['1. Drink 2.5-3L water daily.', '2. Avoid chronic NSAID painkillers.', '3. Check creatinine & eGFR regularly.'],
    icon: '🫘', targetRoute: '/urology-clinic', ctaAr: '🧪 افتح عيادة الكلى والمسالك ←', ctaEn: 'Open Kidney Clinic →',
    accentColor: '#0d9488', heroGradient: 'linear-gradient(145deg, #0f172a 0%, #115e59 52%, #0d9488 100%)',
  },
  {
    id: 'world_oral_health_day',
    visualKind: 'shield_health',
    month: 3, startDay: 20, endDay: 20,
    titleAr: 'اليوم العالمي لصحة الفم والأسنان (WHO)',
    titleEn: 'World Oral Health Day',
    greetingAr: 'اليوم العالمي لصحة الفم والأسنان',
    greetingEn: 'World Oral Health Day',
    messageAr: 'وجع الضرس واللثة يحتاج طبيب أسنان، والمضاد الحيوي لوحده مش بيسكن عصب الضرس.',
    messageEn: 'Toothache needs dental care; antibiotics alone do not cure pulpitis.',
    badgeAr: '🦷 يوم صحة الفم والأسنان (20 مارس)',
    badgeEn: '🦷 Oral Health Day',
    basketTitleAr: '🧺 سلة وعي الأسنان واللثة:',
    basketTitleEn: '🧺 Oral & Dental Care Basket:',
    tipsAr: [
      '1️⃣ اغسل أسنانك مرتين يومياً بمعجون فلورايد لمدة دقيقتين وخصوصاً قبل النوم.',
      '2️⃣ أوعى تحط قرص أسبرين أو قرنفل خام على اللثة مباشرة لأنه بيعمل حرق كيميائي.',
      '3️⃣ عند وجود تورم في الخد أو خراج، توجه لعيادة طوارئ الأسنان فوراً.',
    ],
    tipsEn: ['1. Brush twice daily with fluoride.', '2. Never place aspirin directly on gums.', '3. Visit Dental ER for swelling/abscess.'],
    icon: '🦷', targetRoute: '/dental-clinic', ctaAr: '🦷 افتح عيادة الأسنان ←', ctaEn: 'Open Dental Clinic →',
    accentColor: '#0284c7', heroGradient: 'linear-gradient(145deg, #0c4a6e 0%, #0284c7 52%, #0ea5e9 100%)',
  },
  {
    id: 'world_health_day',
    visualKind: 'shield_health',
    month: 4, startDay: 7, endDay: 7,
    titleAr: 'يوم الصحة العالمي (WHO) — صحتك.. بذكاء أكتر',
    titleEn: 'World Health Day (WHO)',
    greetingAr: 'يوم الصحة العالمي — صحتك هي أغلى ما تملك',
    greetingEn: 'World Health Day — Your Health, Smarter',
    messageAr: 'راجع أدويتك الحالية، سجّل حساسيتك في الكارت الطبي الذكي، واطمن على صحتك.',
    messageEn: 'Review your medications and update your Smart Medical ID.',
    badgeAr: '🌍 يوم الصحة العالمي (7 أبريل)',
    badgeEn: '🌍 World Health Day',
    basketTitleAr: '🧺 سلة وعي يوم الصحة العالمي:',
    basketTitleEn: '🧺 World Health Day Basket:',
    tipsAr: [
      '1️⃣ افحص تفاعلات أدويتك مع الشاي والقهوة واللبن قبل ما تاخدها.',
      '2️⃣ احتفظ بالكارت الطبي الذكي QR على موبايلك لأي طوارئ لا قدر الله.',
      '3️⃣ لا تأخذ أي دواء بوصفة صديق أو جار بدون مراجعة طبيبك أو الصيدلي.',
    ],
    tipsEn: ['1. Check food & drink drug interactions.', '2. Keep your QR Medical ID updated.', '3. Never take someone else’s prescription.'],
    icon: '🌍', targetRoute: '/clinics', ctaAr: '🏥 تصفح العيادات الـ 20 ←', ctaEn: 'Browse 20 Clinics →',
    accentColor: '#059669', heroGradient: 'linear-gradient(145deg, #064e3b 0%, #047857 52%, #10b981 100%)',
  },
  {
    id: 'world_immunization_week',
    visualKind: 'baby_mom',
    month: 4, startDay: 24, endDay: 30,
    titleAr: 'أسبوع التطعيمات العالمي (WHO) — احمِ طفلك باليوم والساعة',
    titleEn: 'World Immunization Week (WHO)',
    greetingAr: 'أسبوع التطعيمات العالمي — تطعيم طفلك درع أمانه',
    greetingEn: 'World Immunization Week',
    messageAr: 'احسب مواعيد تطعيمات مكتب الصحة والتطعيمات الإضافية لطفلك باليوم في ثانية.',
    messageEn: 'Track mandatory Ministry of Health and optional vaccines by exact date.',
    badgeAr: '💉 أسبوع التطعيمات العالمي (24–30 أبريل)',
    badgeEn: '💉 Immunization Week',
    basketTitleAr: '🧺 سلة وعي التطعيمات:',
    basketTitleEn: '🧺 Child Vaccination Basket:',
    tipsAr: [
      '1️⃣ التزم بمواعيد تطعيمات الشهرين و4 و6 و9 و12 و18 شهراً في مكتب الصحة.',
      '2️⃣ بعد التطعيم، استخدم كمادات ماء فاتر (وليس ثلج مباشر) وجرعة باراسيتامول بالوزن عند السخونية.',
      '3️⃣ سجّل كل تطعيم في متابع التطعيمات لحماية طفلك.',
    ],
    tipsEn: ['1. Follow 2, 4, 6, 9, 12, 18-month schedules.', '2. Use lukewarm compresses post-shot.', '3. Track every dose in Vaccine Tracker.'],
    icon: '💉', targetRoute: '/vaccine-tracker', ctaAr: '💉 افتح رادار التطعيمات ←', ctaEn: 'Open Vaccine Tracker →',
    accentColor: '#0284c7', heroGradient: 'linear-gradient(145deg, #0c4a6e 0%, #0369a1 52%, #38bdf8 100%)',
  },
  {
    id: 'world_asthma_day',
    visualKind: 'lungs_breath',
    month: 5, startDay: 5, endDay: 5,
    titleAr: 'اليوم العالمي للربو وحساسية الصدر (WHO)',
    titleEn: 'World Asthma Day (WHO)',
    greetingAr: 'اليوم العالمي للربو — تنفّس بأمان',
    greetingEn: 'World Asthma Day',
    messageAr: 'تابع رصيد بخاخة الصدر واتأكد من الجرعة الآمنة لجلسات البخار (النيبولايزر).',
    messageEn: 'Track rescue inhaler puffs and check safe nebulizer protocols.',
    badgeAr: '🫁 اليوم العالمي للربو (5 مايو)',
    badgeEn: '🫁 World Asthma Day',
    basketTitleAr: '🧺 سلة وعي مرضى الصدر والربو:',
    basketTitleEn: '🧺 Asthma & Respiratory Basket:',
    tipsAr: [
      '1️⃣ تمضمض بالماء جيداً بعد استخدام بخاخات الكورتيزون لمنع فطريات الفم.',
      '2️⃣ تأكد من عدد البخات المتبقية في بخاخة الطوارئ (فنتولين) قبل الخروج.',
      '3️⃣ تجنب الأتربة والبخور والتدخين السلبي واستخدم عيادة الصدر للمتابعة.',
    ],
    tipsEn: ['1. Rinse mouth after steroid inhalers.', '2. Track remaining puffs in rescue inhalers.', '3. Avoid smoke and dust triggers.'],
    icon: '🫁', targetRoute: '/chest-clinic', ctaAr: '🫁 افتح عيادة الصدر والربو ←', ctaEn: 'Open Chest Clinic →',
    accentColor: '#0f766e', heroGradient: 'linear-gradient(145deg, #134e4a 0%, #0f766e 52%, #14b8a6 100%)',
  },
  {
    id: 'world_hypertension_day',
    visualKind: 'heart_ecg',
    month: 5, startDay: 17, endDay: 17,
    titleAr: 'اليوم العالمي لارتفاع ضغط الدم (WHO) — قِس ضغطك بانتظام',
    titleEn: 'World Hypertension Day (WHO)',
    greetingAr: 'اليوم العالمي لضغط الدم — القاتل الصامت تحت السيطرة',
    greetingEn: 'World Hypertension Day',
    messageAr: 'احذر المسكنات القوية والعرقسوس وأدوية البرد المزيلة للاحتقان لأنها ترفع الضغط فجأة.',
    messageEn: 'Avoid NSAIDs, licorice & decongestants that spike blood pressure.',
    badgeAr: '🩺 اليوم العالمي للضغط (17 مايو)',
    badgeEn: '🩺 World Hypertension Day',
    basketTitleAr: '🧺 سلة وعي مريض الضغط:',
    basketTitleEn: '🧺 Hypertension Care Basket:',
    tipsAr: [
      '1️⃣ لا توقف دواء الضغط من نفسك حتى لو القراءة بقت 120/80 — الدواء هو اللي ظابطه.',
      '2️⃣ ابعد عن العرقسوس والمخللات وكونجستال (سودوإيفيدرين) لأنها ترفع الضغط.',
      '3️⃣ استخدم منبه الجرعات لتثبيت ميعاد قرص الضغط يومياً.',
    ],
    tipsEn: ['1. Never stop BP pills abruptly.', '2. Avoid licorice, excess salt & decongestants.', '3. Set a daily alarm for your BP dose.'],
    icon: '🩺', targetRoute: '/chronic-clinic', ctaAr: '🫀 افتح عيادة الضغط والقلب ←', ctaEn: 'Open BP Clinic →',
    accentColor: '#7c3aed', heroGradient: 'linear-gradient(145deg, #2e1065 0%, #5b21b6 52%, #7c3aed 100%)',
  },
  {
    id: 'world_no_tobacco_day',
    visualKind: 'lungs_breath',
    month: 5, startDay: 31, endDay: 31,
    titleAr: 'اليوم العالمي للامتناع عن التدخين (WHO) — تنفّس بحرية',
    titleEn: 'World No Tobacco Day (WHO)',
    greetingAr: 'اليوم العالمي للامتناع عن التدخين — صحتك تستحق',
    greetingEn: 'World No Tobacco Day',
    messageAr: 'رئتك تبدأ تتعافى خلال أيام من التوقف عن التدخين والفيب والشيشة.',
    messageEn: 'Your lungs begin healing within days of quitting smoking and vaping.',
    badgeAr: '🚭 يوم الامتناع عن التدخين (31 مايو)',
    badgeEn: '🚭 World No Tobacco Day',
    basketTitleAr: '🧺 سلة وعي الإقلاع عن التدخين:',
    basketTitleEn: '🧺 Smoke-Free Wellness Basket:',
    tipsAr: [
      '1️⃣ أول 72 ساعة هي الأصعب؛ اشرب ماء دافئ وعلكة خالية من السكر عند الرغبة.',
      '2️⃣ التدخين يبطل مفعول بعض أدوية الصدر والضغط ويزيد خطر الجلطات.',
      '3️⃣ استشر عيادة الصدر والباطنة لخطة تعافي الرئتين.',
    ],
    tipsEn: ['1. Hydrate well in the first 72h.', '2. Smoking increases clot risks.', '3. Check Chest Clinic for lung recovery.'],
    icon: '🚭', targetRoute: '/chest-clinic', ctaAr: '🫁 افتح عيادة الصدر ←', ctaEn: 'Open Chest Clinic →',
    accentColor: '#0f766e', heroGradient: 'linear-gradient(145deg, #134e4a 0%, #0f766e 52%, #2dd4bf 100%)',
  },
  {
    id: 'world_blood_donor_day',
    visualKind: 'heart_ecg',
    month: 6, startDay: 14, endDay: 14,
    titleAr: 'اليوم العالمي للمتبرعين بالدم (WHO) — تبرعك حياة',
    titleEn: 'World Blood Donor Day (WHO)',
    greetingAr: 'اليوم العالمي للتبرع بالدم — نقطة دم تنقذ حياة',
    greetingEn: 'World Blood Donor Day',
    messageAr: 'تأكد من نسبة الهيموجلوبين وفصيلة دمك في كارتك الطبي الذكي واطمن على صحتك.',
    messageEn: 'Verify your hemoglobin & blood type in your Smart Medical ID.',
    badgeAr: '🩸 يوم التبرع بالدم (14 يونيو)',
    badgeEn: '🩸 Blood Donor Day',
    basketTitleAr: '🧺 سلة وعي التبرع والأنيميا:',
    basketTitleEn: '🧺 Blood Health & Anemia Basket:',
    tipsAr: [
      '1️⃣ التبرع بالدم ينشط نخاع العظم ويجدد خلايا الدم الحمراء.',
      '2️⃣ بعد التبرع أو لعلاج الأنيميا، افصل أقراص الحديد عن الشاي والقهوة واللبن بساعتين.',
      '3️⃣ سجّل فصيلة دمك في الكارت الطبي الذكي للطوارئ.',
    ],
    tipsEn: ['1. Donation renews red blood cells.', '2. Separate iron pills from tea & dairy by 2h.', '3. Save your blood type in Smart ID.'],
    icon: '🩸', targetRoute: '/passport', ctaAr: '🪪 حدّث كارتك الطبي الذكي ←', ctaEn: 'Update Medical ID →',
    accentColor: '#dc2626', heroGradient: 'linear-gradient(145deg, #450a0a 0%, #991b1b 52%, #dc2626 100%)',
  },
  {
    id: 'world_hepatitis_day',
    visualKind: 'shield_health',
    month: 7, startDay: 28, endDay: 28,
    titleAr: 'اليوم العالمي لالتهاب الكبد (WHO) — احمِ كبدك',
    titleEn: 'World Hepatitis Day (WHO)',
    greetingAr: 'اليوم العالمي لالتهاب الكبد — كبد سليم لحياة سليمة',
    greetingEn: 'World Hepatitis Day',
    messageAr: 'انتبه لجرعات الباراسيتامول والأدوية الكبدية، وفعّل حماية الكبد في ملفك الصحي.',
    messageEn: 'Monitor paracetamol ceiling doses and enable Hepatic Guard in your Health Profile.',
    badgeAr: '🛡️ اليوم العالمي للكبد (28 يوليو)',
    badgeEn: '🛡️ World Hepatitis Day',
    basketTitleAr: '🧺 سلة وعي حماية الكبد:',
    basketTitleEn: '🧺 Liver Protection Basket:',
    tipsAr: [
      '1️⃣ الجرعة القصوى للباراسيتامول أقل من 2 جم/يوم لمرضى الكبد لتجنب الإجهاد الكبدي.',
      '2️⃣ لا تستخدم أدوية أو أعشاب تخسيس مجهولة المصدر لأنها قد تسبب تسمم كبدي.',
      '3️⃣ راجع تحاليل إنزيمات الكبد (ALT / AST) عبر قارئ التحاليل.',
    ],
    tipsEn: ['1. Cap paracetamol under 2g/day if liver impaired.', '2. Avoid unverified weight-loss herbs.', '3. Check ALT/AST via Lab Decoder.'],
    icon: '🛡️', targetRoute: '/lab-clinic', ctaAr: '🔬 افتح عيادة قراءة التحاليل ←', ctaEn: 'Open Lab Decoder →',
    accentColor: '#0d9488', heroGradient: 'linear-gradient(145deg, #0f172a 0%, #0f766e 52%, #14b8a6 100%)',
  },
  {
    id: 'world_breastfeeding_week',
    visualKind: 'baby_mom',
    month: 8, startDay: 1, endDay: 7,
    titleAr: 'الأسبوع العالمي للرضاعة الطبيعية (WHO) — بداية صحية لطفلك',
    titleEn: 'World Breastfeeding Week (WHO)',
    greetingAr: 'الأسبوع العالمي للرضاعة الطبيعية',
    greetingEn: 'World Breastfeeding Week',
    messageAr: 'اعرفي الأدوية الآمنة أثناء الرضاعة الطبيعية ودليل أول سنة مع طفلك.',
    messageEn: 'Check medication safety during breastfeeding and first-year infant care.',
    badgeAr: '🤱 أسبوع الرضاعة الطبيعية (1–7 أغسطس)',
    badgeEn: '🤱 Breastfeeding Week',
    basketTitleAr: '🧺 سلة وعي الأم المرضعة والطفل:',
    basketTitleEn: '🧺 Breastfeeding Safety Basket:',
    tipsAr: [
      '1️⃣ الرضاعة الطبيعية في أول 6 شهور تحمي الطفل من العدوى وتقوي مناعته.',
      '2️⃣ راجعي دائماً أمان أي مضاد حيوي أو مسكن في الرضاعة قبل تناوله.',
      '3️⃣ ممنوع العسل الأبيض واللبن البقري للرضيع قبل إتمام عمر سنة.',
    ],
    tipsEn: ['1. Exclusive breastfeeding for 6 months boosts immunity.', '2. Verify meds safety while nursing.', '3. No honey before 1 year old.'],
    icon: '🤱', targetRoute: '/baby-first-year', ctaAr: '👶 افتحي عيادة الرضيع والأم ←', ctaEn: 'Open Baby Clinic →',
    accentColor: '#0284c7', heroGradient: 'linear-gradient(145deg, #0c4a6e 0%, #0284c7 52%, #38bdf8 100%)',
  },
  {
    id: 'world_patient_safety_day',
    visualKind: 'shield_health',
    month: 9, startDay: 17, endDay: 17,
    titleAr: 'اليوم العالمي لسلامة المرضى والدواء (WHO) — دواء بلا أضرار',
    titleEn: 'World Patient Safety Day (WHO)',
    greetingAr: 'اليوم العالمي لسلامة المرضى والدواء',
    greetingEn: 'World Patient Safety Day',
    messageAr: 'استخدم محرك الأمان الدوائي لفحص الحساسية وتكرار المادة الفعالة قبل أخذ أي روشتة.',
    messageEn: 'Screen allergies and duplicate active ingredients before taking any prescription.',
    badgeAr: '💊 يوم سلامة المرضى (17 سبتمبر)',
    badgeEn: '💊 Patient Safety Day',
    basketTitleAr: '🧺 سلة وعي أمان الدواء:',
    basketTitleEn: '🧺 Medication Without Harm Basket:',
    tipsAr: [
      '1️⃣ تأكد إن مفيش اسمين تجاريين مختلفين ليهم نفس المادة الفعالة في نفس الروشتة.',
      '2️⃣ افحص تاريخ انتهاء الصلاحية بعد الفتح (القطرة 28 يوم، شراب المضاد 7–10 أيام).',
      '3️⃣ اقرأ التحذيرات الـ 7 لكل دواء في موسوعة دوايا.',
    ],
    tipsEn: ['1. Check for duplicate active ingredients.', '2. Track post-opening expiry dates.', '3. Review 7 clinical warnings per drug.'],
    icon: '💊', targetRoute: '/interactions', ctaAr: '🛡️ افتح فاحص التداخلات ←', ctaEn: 'Open Interaction Checker →',
    accentColor: '#059669', heroGradient: 'linear-gradient(145deg, #064e3b 0%, #047857 52%, #10b981 100%)',
  },
  {
    id: 'world_alzheimers_day',
    visualKind: 'brain_mental',
    month: 9, startDay: 21, endDay: 21,
    titleAr: 'اليوم العالمي للزهايمر ورعاية المسنين (WHO)',
    titleEn: 'World Alzheimer’s Day (WHO)',
    greetingAr: 'اليوم العالمي للزهايمر — رعاية آبائنا وكبار السن',
    greetingEn: 'World Alzheimer’s Day',
    messageAr: 'استخدم فاحص الحبة بالصوت واللون لكبار السن وعيادة المسنين وقرح الفراش.',
    messageEn: 'Use Senior Pill Visual & Voice Identifier and Geriatric Care Clinic.',
    badgeAr: '👴 اليوم العالمي للزهايمر (21 سبتمبر)',
    badgeEn: '👴 World Alzheimer’s Day',
    basketTitleAr: '🧺 سلة وعي رعاية كبار السن:',
    basketTitleEn: '🧺 Geriatric & Memory Care Basket:',
    tipsAr: [
      '1️⃣ رتب أدوية كبار السن في منظم أسبوعي وفعل منبه الجرعات الصوتي.',
      '2️⃣ فاحص الحبة باللون والشكل في دوايا يقرأ التعليمات بصوت واضح وخط كبير.',
      '3️⃣ راقب التغذية والسوائل وتجنب المهدئات التي تزيد الدوخة والسقوط.',
    ],
    tipsEn: ['1. Use pill organizers & voice alarms.', '2. Use Senior Pill Visual Identifier.', '3. Prevent falls by avoiding unneeded sedatives.'],
    icon: '👴', targetRoute: '/geriatric-clinic', ctaAr: '👴 افتح عيادة كبار السن ←', ctaEn: 'Open Geriatric Clinic →',
    accentColor: '#4f46e5', heroGradient: 'linear-gradient(145deg, #1e1b4b 0%, #3730a3 52%, #6366f1 100%)',
  },
  {
    id: 'world_heart_day',
    visualKind: 'heart_ecg',
    month: 9, startDay: 29, endDay: 29,
    titleAr: 'اليوم العالمي للقلب (WHO) — حافظ على قلبك وضغطك',
    titleEn: 'World Heart Day (WHO)',
    greetingAr: 'اليوم العالمي للقلب — نبضك حياة',
    greetingEn: 'World Heart Day — Use Heart for Every Heart',
    messageAr: 'افحص تداخلات أدوية القلب والسيولة والكوليسترول، وخطط وجباتك بنظام DASH.',
    messageEn: 'Screen heart & anticoagulant interactions and follow heart-healthy DASH meals.',
    badgeAr: '❤️ اليوم العالمي للقلب (29 سبتمبر)',
    badgeEn: '❤️ World Heart Day',
    basketTitleAr: '🧺 سلة وعي صحة القلب:',
    basketTitleEn: '🧺 Heart Health Basket:',
    tipsAr: [
      '1️⃣ لو بتاخد أدوية سيولة (ماريفان/إليكويس)، احذر خلطها مع الأسبرين أو المسكنات.',
      '2️⃣ قلل الملح والدهون المشبعة وامشِ 30 دقيقة يومياً.',
      '3️⃣ 🚨 في حالة ثقل منتصف الصدر الممتد للكتف الشمال، اتصل بالطوارئ 123 فوراً.',
    ],
    tipsEn: ['1. Never mix anticoagulants with NSAIDs.', '2. Cut salt & walk 30 min daily.', '3. Call 123 for central radiating chest pressure.'],
    icon: '❤️', targetRoute: '/chronic-clinic', ctaAr: '🫀 افتح عيادة القلب والباطنة ←', ctaEn: 'Open Heart Clinic →',
    accentColor: '#dc2626', heroGradient: 'linear-gradient(145deg, #450a0a 0%, #991b1b 52%, #dc2626 100%)',
  },
  {
    id: 'pink_october_breast_cancer',
    visualKind: 'pink_ribbon',
    month: 10, startDay: 1, endDay: 31,
    titleAr: 'أكتوبر الوردي — حملة التوعية بسرطان الثدي والكشف المبكر',
    titleEn: 'Pink October — Breast Cancer Awareness',
    greetingAr: 'أكتوبر الوردي — الكشف المبكر ينقذ الحياة',
    greetingEn: 'Pink October — Early Detection Saves Lives',
    messageAr: 'تعرفي على خطوات الفحص الذاتي الشهري وأهمية المتابعة الدورية لصحة المرأة.',
    messageEn: 'Learn monthly self-exam steps and routine women’s screening.',
    badgeAr: '🎀 أكتوبر الوردي (1–31 أكتوبر)',
    badgeEn: '🎀 Pink October',
    basketTitleAr: '🧺 سلة وعي أكتوبر الوردي:',
    basketTitleEn: '🧺 Pink October Awareness Basket:',
    tipsAr: [
      '1️⃣ الفحص الذاتي الشهري بعد انتهاء الدورة بـ 5 أيام يرفع نسب الشفاء فوق 95%.',
      '2️⃣ المتابعة الدورية بالسونار أو الماموجرام فوق سن 40 سنة ضرورة سنوية مطمئنة.',
      '3️⃣ استشيري عيادة صحة المرأة في دوايا لأي استفسار عن الهرمونات أو منع الحمل.',
    ],
    tipsEn: ['1. Monthly self-exam 5 days after period.', '2. Annual screening above 40.', '3. Open Women’s Clinic for guidance.'],
    icon: '🎀', targetRoute: '/women-clinic', ctaAr: '🌸 افتحي عيادة صحة المرأة ←', ctaEn: 'Open Women’s Clinic →',
    accentColor: '#db2777', heroGradient: 'linear-gradient(145deg, #4c0519 0%, #831843 52%, #db2777 100%)',
  },
  {
    id: 'world_diabetes_day',
    visualKind: 'diabetes_ring',
    month: 11, startDay: 14, endDay: 14,
    titleAr: 'اليوم العالمي للسكري (WHO) — تحكم في سكرك واحمِ كليتك وعينك',
    titleEn: 'World Diabetes Day (WHO)',
    greetingAr: 'اليوم العالمي للسكري — صحتك بين إيديك',
    greetingEn: 'World Diabetes Day',
    messageAr: 'راقب السكر التراكمي، احفظ قاعدة 15 للهبوط، واستخدم مُولّد وجبات السكري.',
    messageEn: 'Track HbA1c, Rule of 15 hypo rescue, and diabetic meal planning.',
    badgeAr: '🔵 اليوم العالمي للسكري (14 نوفمبر)',
    badgeEn: '🔵 World Diabetes Day',
    basketTitleAr: '🧺 سلة وعي اليوم العالمي للسكري:',
    basketTitleEn: '🧺 World Diabetes Day Basket:',
    tipsAr: [
      '1️⃣ السكر التراكمي (HbA1c) المستهدف لمعظم المرضى أقل من 7% لحماية الأعصاب والكلى.',
      '2️⃣ قاعدة 15 للهبوط: لو السكر أقل من 70 خد نص كوب عصير فوراً وقِس بعد 15 دقيقة.',
      '3️⃣ تجنب المسكنات القوية (فولتارين/كتافلام) لحماية الكلى وخليك في الباراسيتامول عند اللزوم.',
    ],
    tipsEn: ['1. Target HbA1c < 7%.', '2. Rule of 15 for low blood sugar.', '3. Avoid nephrotoxic NSAIDs.'],
    icon: '🩸', targetRoute: '/chronic-clinic', ctaAr: '🫀 افتح عيادة السكر والباطنة ←', ctaEn: 'Open Diabetes Clinic →',
    accentColor: '#0284c7', heroGradient: 'linear-gradient(145deg, #0c4a6e 0%, #0369a1 52%, #0284c7 100%)',
  },
  {
    id: 'waaw_antibiotic_week',
    visualKind: 'shield_health',
    month: 11, startDay: 18, endDay: 24,
    titleAr: 'الأسبوع العالمي للتوعية بمضادات الميكروبات (WHO)',
    titleEn: 'World AMR Awareness Week (WAAW)',
    greetingAr: 'الأسبوع العالمي للتوعية بالمضادات الحيوية',
    greetingEn: 'World AMR Awareness Week',
    messageAr: 'المضاد الحيوي مش للبرد ولا للسخونية! استعمله بوصفة طبية وكمل الكورس للآخر.',
    messageEn: 'Antibiotics do not treat colds! Use responsibly only with prescription.',
    badgeAr: '🦠 أسبوع التوعية بالمضادات (18–24 نوفمبر)',
    badgeEn: '🦠 WAAW Week',
    basketTitleAr: '🧺 سلة وعي الاستخدام الرشيد للمضادات:',
    basketTitleEn: '🧺 Antibiotic Stewardship Basket:',
    tipsAr: [
      '1️⃣ البرد والإنفلونزا فيروسات — المضاد الحيوي ملوش أي تأثير عليها.',
      '2️⃣ لا توقف المضاد الحيوي بمجرد تحسنك عشان البكتيريا ما تقاومهوش.',
      '3️⃣ افصل سيبروفلوكساسين وتافانيك عن اللبن والجبنة بساعتين.',
    ],
    tipsEn: ['1. Colds/flu are viral.', '2. Complete the full prescribed course.', '3. Separate quinolones from dairy by 2h.'],
    icon: '🛡️', targetRoute: '/awareness-week', ctaAr: '🌍 افتح صفحة الحملة ←', ctaEn: 'Open Campaign →',
    accentColor: '#0d9488', heroGradient: 'linear-gradient(145deg, #0f172a 0%, #115e59 52%, #0d9488 100%)',
  },
];

export interface DawayaSiteVisibilityConfig {
  campaignMode: string;
  showAntibioticLegacySections: boolean;
  showSurveySection: boolean;
  showVillagePharmaciesShortcut?: boolean;
  showPharmacySubscriptions?: boolean;
  showUserSubscriptions?: boolean;
  vodafoneCashNumber?: string;
  instaPayHandle?: string;
}

const LOCAL_VISIBILITY_KEY = 'dawaya_site_visibility_config_v1';
const VISIBILITY_EVENT = 'dawaya-site-visibility-changed';

const DEFAULT_VISIBILITY: DawayaSiteVisibilityConfig = {
  campaignMode: 'auto',
  showAntibioticLegacySections: false,
  showSurveySection: false,
  showVillagePharmaciesShortcut: false,
  showPharmacySubscriptions: false,
  showUserSubscriptions: false,
  vodafoneCashNumber: '01098478954',
  instaPayHandle: 'dawaya@instapay',
};

export function getHijriMonthDay(now = new Date()): { month: number; day: number } | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      month: 'numeric',
      day: 'numeric',
    });
    const parts = fmt.formatToParts(now);
    const mPart = parts.find((p) => p.type === 'month')?.value;
    const dPart = parts.find((p) => p.type === 'day')?.value;
    const month = mPart ? parseInt(mPart, 10) : 0;
    const day = dPart ? parseInt(dPart, 10) : 0;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
  } catch {
    /* ignore if Intl Islamic calendar unavailable */
  }
  return null;
}

export function getLocalVisibilityConfig(): DawayaSiteVisibilityConfig {
  if (typeof window === 'undefined') return DEFAULT_VISIBILITY;
  try {
    const raw = localStorage.getItem(LOCAL_VISIBILITY_KEY);
    if (!raw) return DEFAULT_VISIBILITY;
    const parsed = JSON.parse(raw);
    return {
      campaignMode: typeof parsed.campaignMode === 'string' ? parsed.campaignMode : 'auto',
      showAntibioticLegacySections: Boolean(parsed.showAntibioticLegacySections),
      showSurveySection: Boolean(parsed.showSurveySection),
      showVillagePharmaciesShortcut: Boolean(parsed.showVillagePharmaciesShortcut),
      showPharmacySubscriptions: Boolean(parsed.showPharmacySubscriptions),
      showUserSubscriptions: Boolean(parsed.showUserSubscriptions),
      vodafoneCashNumber: typeof parsed.vodafoneCashNumber === 'string' && parsed.vodafoneCashNumber.trim() ? parsed.vodafoneCashNumber.trim() : '01098478954',
      instaPayHandle: typeof parsed.instaPayHandle === 'string' && parsed.instaPayHandle.trim() ? parsed.instaPayHandle.trim() : 'dawaya@instapay',
    };
  } catch {
    return DEFAULT_VISIBILITY;
  }
}

export async function saveVisibilityConfig(next: DawayaSiteVisibilityConfig): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_VISIBILITY_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(VISIBILITY_EVENT, { detail: next }));
    } catch { /* ignore */ }
  }
  if (configured && db) {
    try {
      await setDoc(doc(db, 'settings', 'public'), next, { merge: true });
    } catch { /* ignore */ }
  }
}

export function resolveActiveWhoCampaign(mode: string, now = new Date()): WhoHealthCampaign | null {
  if (mode === 'none') return null;
  if (mode !== 'auto') {
    return WHO_HEALTH_CAMPAIGNS.find((c) => c.id === mode) || null;
  }

  // 1) Check Auto-Updating Hijri Occasions (Ramadan, Eid Al-Fitr, Eid Al-Adha)
  const hijri = getHijriMonthDay(now);
  if (hijri) {
    const hijriHit = WHO_HEALTH_CAMPAIGNS.find(
      (c) =>
        c.hijriMonth === hijri.month &&
        c.hijriStartDay !== undefined &&
        c.hijriEndDay !== undefined &&
        hijri.day >= c.hijriStartDay &&
        hijri.day <= c.hijriEndDay
    );
    if (hijriHit) return hijriHit;
  }

  // 2) Check Exact Gregorian WHO Health Day/Week/Month
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return (
    WHO_HEALTH_CAMPAIGNS.find(
      (c) =>
        c.month === m &&
        c.startDay !== undefined &&
        c.endDay !== undefined &&
        d >= c.startDay &&
        d <= c.endDay
    ) || null
  );
}

export function useWhoCampaignAndVisibility() {
  const [config, setConfig] = useState<DawayaSiteVisibilityConfig>(() => getLocalVisibilityConfig());

  useEffect(() => {
    const onLocalChange = (e: Event) => {
      const detail = (e as CustomEvent<DawayaSiteVisibilityConfig>).detail;
      if (detail) setConfig(detail);
      else setConfig(getLocalVisibilityConfig());
    };
    window.addEventListener(VISIBILITY_EVENT, onLocalChange);

    let unsub = () => {};
    if (configured && db) {
      unsub = onSnapshot(
        doc(db, 'settings', 'public'),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          const merged: DawayaSiteVisibilityConfig = {
            campaignMode: typeof data.campaignMode === 'string' ? data.campaignMode : 'auto',
            showAntibioticLegacySections: Boolean(data.showAntibioticLegacySections),
            showSurveySection: Boolean(data.showSurveySection),
            showVillagePharmaciesShortcut: Boolean(data.showVillagePharmaciesShortcut),
            showPharmacySubscriptions: Boolean(data.showPharmacySubscriptions),
            showUserSubscriptions: Boolean(data.showUserSubscriptions),
            vodafoneCashNumber: typeof data.vodafoneCashNumber === 'string' && data.vodafoneCashNumber.trim() ? data.vodafoneCashNumber.trim() : '01098478954',
            instaPayHandle: typeof data.instaPayHandle === 'string' && data.instaPayHandle.trim() ? data.instaPayHandle.trim() : 'dawaya@instapay',
          };
          setConfig(merged);
          try {
            localStorage.setItem(LOCAL_VISIBILITY_KEY, JSON.stringify(merged));
          } catch { /* ignore */ }
        },
        () => {}
      );
    }

    return () => {
      window.removeEventListener(VISIBILITY_EVENT, onLocalChange);
      unsub();
    };
  }, []);

  const activeCampaign = resolveActiveWhoCampaign(config.campaignMode);
  // If we are in auto mode and activeCampaign is a Hijri occasion (like Ramadan), also check if today is a Gregorian WHO health day so both can be celebrated!
  const secondaryWhoCampaign = (() => {
    if (config.campaignMode !== 'auto' || !activeCampaign?.hijriMonth) return null;
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    return (
      WHO_HEALTH_CAMPAIGNS.find(
        (c) =>
          c.month === m &&
          c.startDay !== undefined &&
          c.endDay !== undefined &&
          d >= c.startDay &&
          d <= c.endDay
      ) || null
    );
  })();
  return { config, activeCampaign, secondaryWhoCampaign };
}
