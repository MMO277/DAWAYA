import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import { useSyncedHealthProfile } from './allergyData';
import { formatTime12Hour, useSyncedSchedules } from './trackerData';
import {
  getSmartClinicalRegimenForMedicine,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';
import Disclaimer from './Disclaimer';

export type DrugFamilyKey =
  | 'birth_control'
  | 'antibiotic'
  | 'blood_pressure'
  | 'insulin_diabetes'
  | 'thyroid_eltroxin'
  | 'steroid_cortisone'
  | 'anticoagulant_blood_thinner';

export interface DrugFamilyData {
  id: DrugFamilyKey;
  icon: string;
  nameAr: string;
  nameEn: string;
  badgeAr: string;
  commonBrandsAr: string;
  timingCriticality: 'extreme_minutes' | 'high_hours' | 'moderate';
  scenarios: Array<{
    id: string;
    hoursLateLabelAr: string;
    actionBadgeAr: string;
    severityColor: string;
    actionTitleAr: string;
    immediateStepAr: string;
    strictlyForbiddenAr: string;
    whenToWorryAr: string;
  }>;
}

export const MISSED_DOSE_FAMILIES: Record<DrugFamilyKey, DrugFamilyData> = {
  birth_control: {
    id: 'birth_control',
    icon: '🌸',
    nameAr: 'حبوب منع الحمل (المركبة وأحادية الرضاعة)',
    nameEn: 'Birth Control Pills',
    badgeAr: 'حساسة جداً للموعد لمنع حدوث حمل غير مخطط له',
    commonBrandsAr: 'ياسمين (Yasmin)، جينيرا (Gynera)، مارفيلون، سيرازيت (Cerazette)، ميكرولوت',
    timingCriticality: 'extreme_minutes',
    scenarios: [
      {
        id: 'bc-under-12',
        hoursLateLabelAr: 'تأخرتِ أقل من 12 ساعة (أو أقل من 24 ساعة في الحبوب المركبة)',
        actionBadgeAr: '🟢 الحماية مستمرة — خذيها فوراً',
        severityColor: '#16a34a',
        actionTitleAr: 'خذي الحبة المنسية فور تذكرها فوراً الآن',
        immediateStepAr: 'ابلعي الحبة المنسية فوراً بمجرد تذكرها، وخذي الحبة القادمة في ميعادها الطبيعي كالمعتاد (حتى لو هذا يعني أخذ حبتين في نفس اليوم). الحماية لا تزال قائمة ولا تحتاجين لوسيلة إضافية.',
        strictlyForbiddenAr: 'ممنوع إهمال الحبة أو تأجيلها لميعاد الغد.',
        whenToWorryAr: 'إذا كانت حبوب رضاعة أحادية (ميكرولوت) وتأخرتِ أكثر من 3 ساعات، يجب استخدام واقي ذكري لمدة 48 ساعة.',
      },
      {
        id: 'bc-over-24-two',
        hoursLateLabelAr: 'تأخرتِ أكثر من 24–48 ساعة (نسيان حبتين أو أكثر)',
        actionBadgeAr: '🔴 خطر فقدان الحماية — خطة الطوارئ',
        severityColor: '#dc2626',
        actionTitleAr: 'خذي آخر حبة منسية فوراً + وسيلة عازلة إضافية 7 أيام',
        immediateStepAr: 'خذي آخر حبة نسيتيها فوراً الآن واتركي الحبات السابقة، واستمري في باقي الشريط. **يجب استخدام وسيلة حماية إضافية (واقي ذكري) لمدة 7 أيام متواصلة**!',
        strictlyForbiddenAr: 'ممنوع إقامة علاقة زوجية بدون وسيلة عازلة إضافية خلال الأيام الـ 7 القادمة.',
        whenToWorryAr: 'إذا حدثت علاقة زوجية خلال الـ 5 أيام الماضية، استشيري الطبيبة أو الصيدلي فوراً بخصوص وسيلة الطوارئ (كونترابلان).',
      },
    ],
  },

  antibiotic: {
    id: 'antibiotic',
    icon: '💊',
    nameAr: 'المضادات الحيوية والمطهرات المعوية (أقراص وشراب وكبسول)',
    nameEn: 'Antibiotics & Antimicrobials',
    badgeAr: 'الحفاظ على تركيز الدواء في الدم لقتل البكتيريا ومنع المناعة',
    commonBrandsAr: 'أوجمنتين (Augmentin)، هاي بيوتك، كيورام، زيثروماكس، سيبروفار، فلاجيل (Flagyl)',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'abx-few-hours',
        hoursLateLabelAr: 'تأخرت ساعتين إلى 4 ساعات عن ميعاد الجرعة',
        actionBadgeAr: '🟢 خذ الجرعة الآن واضبط مواعيدك القادمة',
        severityColor: '#16a34a',
        actionTitleAr: 'خذ الجرعة فوراً وواصل كل 12 أو 8 ساعات',
        immediateStepAr: 'تناول الجرعة المنسية فوراً الآن مع كوب ماء كامل، ثم اضبط ميعاد الجرعة التالية بحيث تفصل بينها وبين هذه الجرعة بالمدة المقررة (مثلاً 8 ساعات لو 3 مرات يومياً أو 12 ساعة لو مرتين يومياً).',
        strictlyForbiddenAr: 'ممنوع تماماً مضاعفة الجرعة القادمة بأخذ قرصين معاً لتعويض الجرعة المنسية!',
        whenToWorryAr: 'لو حدث قيء خلال 30 دقيقة من بلع القرص، يُعاد تناول الجرعة مرة أخرى.',
      },
      {
        id: 'abx-close-next',
        hoursLateLabelAr: 'تذكرت الجرعة في وقت اقتراب الجرعة التالية جداً (باقي أقل من ساعتين)',
        actionBadgeAr: '🟡 تخطَّ الجرعة المنسية وخذ القادمة في ميعادها',
        severityColor: '#d97706',
        actionTitleAr: 'تخطَّ الجرعة المنسية ولا تأخذ جرعتين معاً',
        immediateStepAr: 'تجاوز الجرعة الفائتة، وخذ جرعتك القادمة في ميعادها المعتاد بدقة، وأكمل كورس المضاد الحيوي ليوم إضافي حتى ينتهي الكورس بالكامل.',
        strictlyForbiddenAr: 'إياك وأخذ جرعتين متقاربتين حتى لا يحدث تسمم أو إسهال ومغص حاد.',
        whenToWorryAr: 'إذا نسيت أكثر من جرعتين متتاليتين، راجع الصيدلي لتقييم فاعلية الكورس.',
      },
    ],
  },

  blood_pressure: {
    id: 'blood_pressure',
    icon: '🫀',
    nameAr: 'أدوية ضغط الدم والقلب والكوليسترول والمعدة',
    nameEn: 'Blood Pressure, Heart & Daily Chronic Medications',
    badgeAr: 'منع الارتداد المفاجئ لضغط الدم أو ضربات القلب',
    commonBrandsAr: 'كونكور (Concor)، إكسفورج (Exforge)، تريتايس، أملوديبين، كابتوبريل، ناتريليكس',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'bp-same-day',
        hoursLateLabelAr: 'تذكرت الجرعة في نفس اليوم وباقي أكثر من 6 ساعات على الجرعة القادمة',
        actionBadgeAr: '🟢 قس الضغط أولاً ثم خذ الجرعة فوراً',
        severityColor: '#16a34a',
        actionTitleAr: 'قس ضغط دمك وتناول الجرعة المنسية',
        immediateStepAr: 'قس ضغط الدم بجهاز رقمي موثوق؛ إذا كان طبيعياً أو مرتفعاً خذ القرص المنسي فوراً واشرب ماءً كافياً، وخذ جرعة الغد في ميعادها الطبيعي.',
        strictlyForbiddenAr: 'ممنوع منعاً باتاً أخذ قرصين معاً غداً في حالة النسيان، لأن مضاعفة دواء الضغط تسبب هبوطاً حاداً وإغماءً!',
        whenToWorryAr: 'إذا شعرت بصداع شديد في مؤخرة الرأس أو زغللة أو نغزة بالصدر، توجه للطوارئ فوراً.',
      },
    ],
  },

  thyroid_eltroxin: {
    id: 'thyroid_eltroxin',
    icon: '🦋',
    nameAr: 'هرمون الغدة الدرقية (ليفوثيروكسين / إلتروكسين)',
    nameEn: 'Levothyroxine (Eltroxin)',
    badgeAr: 'يُؤخذ على معدة فارغة تماماً بالماء فقط',
    commonBrandsAr: 'إلتروكسين (Eltroxin 50 / 100)، إيثيروكس (Euthyrox)',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'thyroid-late-morning',
        hoursLateLabelAr: 'أفطرت وشربت الشاي أو القهوة ونسيت القرص الصباحي',
        actionBadgeAr: '🟡 خذه بعد صيام 3 إلى 4 ساعات عن الأكل',
        severityColor: '#d97706',
        actionTitleAr: 'صم 3 ساعات عن الطعام ثم خذ القرص بالماء',
        immediateStepAr: 'امتنع عن الأكل والشاي والقهوة لمدة 3 إلى 4 ساعات كاملة بعد الفطار أو الغداء، ثم خذ القرص بكوب ماء، وانتظر 30 دقيقة قبل تناول أي طعام آخر.',
        strictlyForbiddenAr: 'ممنوع بلع قرص الغدة مع الأكل أو مع مكملات الحديد والكالسيوم لأن امتصاصه يتدمر تماماً.',
        whenToWorryAr: 'إذا فات اليوم بالكامل ولم تستطع، خذ قرصك غداً في موعده كالمعتاد ولا تقلق، فهرمون الغدة يظل في الدم لعدة أيام.',
      },
    ],
  },

  insulin_diabetes: {
    id: 'insulin_diabetes',
    icon: '🩸',
    nameAr: 'الأنسولين وأدوية السكري (أقراص وحقن)',
    nameEn: 'Insulin & Diabetes Medications',
    badgeAr: 'خطر هبوط السكر الحاد — الحذر التام مع مواعيد الوجبات',
    commonBrandsAr: 'أنسولين ميكستارد، لانتوس، نوفورابيد، دياميكرون، أماريل، جانوفيا، جلوكوفاج',
    timingCriticality: 'extreme_minutes',
    scenarios: [
      {
        id: 'insulin-rapid-missed',
        hoursLateLabelAr: 'أنسولين سريع أو مخلوط قبل الوجبة: تذكرته بعد الانتهاء من الأكل',
        actionBadgeAr: '🟡 قس السكر فوراً ولا تأخذ الجرعة كاملة عشوائياً',
        severityColor: '#d97706',
        actionTitleAr: 'قس السكر أولاً واستشر الطبيب',
        immediateStepAr: 'قس مستوى السكر بجهاز التحليل المنزلي فوراً. إذا كان السكر سريع المفعول وفاتت الوجبة بأكثر من 30 دقيقة، قد تحتاج لتعديل الجرعة لتفادي هبوط السكر الحاد.',
        strictlyForbiddenAr: 'ممنوع تماماً حقن جرعة الأنسولين السريع إذا لم تكن ستأكل وجبة نشويات فوراً، لأن ذلك يسبب غيبوبة هبوط سكر قاتلة!',
        whenToWorryAr: 'إذا ظهرت أعراض الهبوط (عرق بارد، رعشة باليدين، دوخة، زغللة)، تناول نصف كوب عصير محلى أو 3 ملاعق سكر فوراً (قاعدة 15-15).',
      },
      {
        id: 'insulin-basal-missed',
        hoursLateLabelAr: 'أنسولين قاعدي طويل المفعول (لانتوس / ليفيمير / تريسيبا) أو أقراص جلوكوفاج',
        actionBadgeAr: '🟢 خذه فور تذكره أو عدّل موعد الغد تدريجياً',
        severityColor: '#16a34a',
        actionTitleAr: 'خذ الجرعة فوراً وتابع قياس السكر',
        immediateStepAr: 'في حالة أقراص الجلوكوفاج (الميتفورمين) خذ القرص مع الوجبة الحالية؛ وفي الأنسولين القاعدي احقن الجرعة المعتادة فور تذكرها لو باقي أكثر من 8 ساعات على موعدها القادم.',
        strictlyForbiddenAr: 'ممنوع مضاعفة الجرعة تحت أي ظرف.',
        whenToWorryAr: 'راقب قراءات السكر كل 4 ساعات.',
      },
    ],
  },

  anticoagulant_blood_thinner: {
    id: 'anticoagulant_blood_thinner',
    icon: '🩸',
    nameAr: 'أدوية السيولة ومميعات الدم (NOACs وماريفان)',
    nameEn: 'Blood Thinners & Anticoagulants',
    badgeAr: 'التوازن الدقيق بين منع الجلطات وتجنب النزيف',
    commonBrandsAr: 'إليكويس (Eliquis)، زاريلتو (Xarelto)، براداكسا، ماريفان (Marevan)',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'eliquis-twice-missed',
        hoursLateLabelAr: 'دواء سيولة مرتين يومياً (مثل إليكويس / براداكسا): تأخرت أقل من 6 ساعات',
        actionBadgeAr: '🟢 خذ القرص فوراً ولا تضاعف الجرعة القادمة',
        severityColor: '#16a34a',
        actionTitleAr: 'تناول القرص فوراً وتابع جدولك',
        immediateStepAr: 'إذا كان باقي أكثر من 6 ساعات على الجرعة القادمة، خذ القرص المنسي فوراً الآن، وخذ الجرعة التالية في موعدها الطبيعي.',
        strictlyForbiddenAr: 'إذا كان باقي أقل من 6 ساعات، تخطَّ الجرعة المنسية نهائياً ولا تأخذ قرصين معاً حتى لا يحدث نزيف حاد!',
        whenToWorryAr: 'إذا ظهرت أي كدمات زرقاء مفاجئة، نزيف أنف مستمر، أو بول مدمم، راجع طوارئ المستشفى فوراً.',
      },
    ],
  },

  steroid_cortisone: {
    id: 'steroid_cortisone',
    icon: '🛡️',
    nameAr: 'أقراص الكورتيزون (بريدسولون / ديكساميثازون)',
    nameEn: 'Oral Corticosteroids',
    badgeAr: 'ممنوع إيقافه فجأة لتجنب كسل الغدة الكظرية',
    commonBrandsAr: 'بريدسول (Predsol)، هوستيكورتين، سولوبريد، ديكسازون',
    timingCriticality: 'high_hours',
    scenarios: [
      {
        id: 'steroid-morning-missed',
        hoursLateLabelAr: 'نسيت الجرعة الصباحية للكورتيزون وتذكرتها بعد الظهر أو المساء',
        actionBadgeAr: '🟢 خذ الجرعة بعد الأكل مباشرة اليوم',
        severityColor: '#16a34a',
        actionTitleAr: 'تناول الجرعة فوراً بعد وجبة طعام',
        immediateStepAr: 'تناول جرعتك اليومية المقررة فوراً بعد تناول وجبة طعام كاملة لحماية جدار المعدة، ثم عد لجدولك الصباحي غداً كالمعتاد.',
        strictlyForbiddenAr: 'ممنوع تماماً إيقاف الكورتيزون فجأة لو نسيت جرعة، وممنوع أخذه على معدة فارغة على الريق!',
        whenToWorryAr: 'إذا كنت تتبع جدول سحب تدريجي للكورتيزون، استشر طبيبك هاتفياً لإعادة ضبط الأيام.',
      },
    ],
  },
};

function inferFamilyFromMedicineText(text: string): DrugFamilyKey {
  const low = text.toLowerCase();
  if (/yasmin|gynera|marvelon|cerazette|microlut|contracep|desogestrel|ethinyl|levonorgestrel|ياسمين|جينيرا|مارفيلون|سيرازيت|ميكرولوت|منع الحمل/.test(low)) {
    return 'birth_control';
  }
  if (/eltroxin|euthyrox|levothyroxine|thyroid|التروكسين|إلتروكسين|ايثيروكس|غدة|ليـفوثيروكسين/.test(low)) {
    return 'thyroid_eltroxin';
  }
  if (/eliquis|xarelto|pradaxa|marevan|warfarin|apixaban|rivaroxaban|dabigatran|clopidogrel|plavix|اليكويس|إليكويس|زاريلتو|ماريفان|وارفارين|سيولة|بلافيكس/.test(low)) {
    return 'anticoagulant_blood_thinner';
  }
  if (/predsol|prednisolone|prednisone|dexamethasone|hydrocortisone|betamethasone|solupred|hostacortin|بريدسول|بريدنيزولون|ديكساميثازون|كورتيزون|سولوبريد/.test(low)) {
    return 'steroid_cortisone';
  }
  if (/insulin|lantus|mixtard|novorapid|humalog|glargine|metformin|glucophage|amaryl|glimepiride|gliclazide|diamicron|januvia|forxiga|jardiance|انسولين|أنسولين|جلوكوفاج|ميتفورمين|اماريل|أماريل|دياميكرون|جانوفيا|فورسيجا|جارديانس|سكر/.test(low)) {
    return 'insulin_diabetes';
  }
  if (/amoxicillin|augmentin|hibiotic|curam|azithromycin|zithromax|ciprofloxacin|cipro|levofloxacin|tavanic|metronidazole|flagyl|ceftriaxone|cefotax|cefuroxime|zinnat|doxycycline|vibramycin|linezolid|تافانيك|سيبرو|فلاجيل|اوجمنتين|أوجمنتين|هاي بيوتك|كيورام|زيثروماكس|مضاد/.test(low)) {
    return 'antibiotic';
  }
  return 'blood_pressure';
}

function computeNextDoseHoursRemaining(doseTimes: string[]): { nextSlot: string; hoursRemaining: number } | null {
  if (!Array.isArray(doseTimes) || doseTimes.length === 0) return null;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let bestSlot = doseTimes[0];
  let minDiffMinutes = 24 * 60 + 1;

  for (const slot of doseTimes) {
    const [hh, mm] = slot.split(':').map((n) => parseInt(n, 10));
    if (isNaN(hh)) continue;
    const slotMinutes = hh * 60 + (isNaN(mm) ? 0 : mm);
    let diff = slotMinutes - nowMinutes;
    if (diff <= 0) diff += 24 * 60;
    if (diff < minDiffMinutes) {
      minDiffMinutes = diff;
      bestSlot = slot;
    }
  }

  return {
    nextSlot: bestSlot,
    hoursRemaining: Math.round((minDiffMinutes / 60) * 10) / 10,
  };
}

export default function MissedDoseRescueSolver() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { schedules } = useSyncedSchedules();
  const { profile } = useSyncedHealthProfile();
  const { indexItems } = useDawayaDrugDatabase();

  const [selectedFamilyId, setSelectedFamilyId] = useState<DrugFamilyKey>('birth_control');
  const [medSearchQuery, setMedSearchQuery] = useState<string>('');
  const [selectedMedContext, setSelectedMedContext] = useState<{
    name: string;
    doseTimes: string[];
    frequencyKey: string;
  } | null>(null);

  const family = MISSED_DOSE_FAMILIES[selectedFamilyId];

  const searchMatches = useMemo(() => {
    if (!medSearchQuery.trim()) return [];
    return searchDawayaIndex(indexItems, { query: medSearchQuery }, isAr).slice(0, 6);
  }, [medSearchQuery, indexItems, isAr]);

  const userSavedMeds = useMemo(() => {
    const list: Array<{ name: string; doseTimes: string[]; frequencyKey: string; rawText: string }> = [];
    const seen = new Set<string>();

    for (const sch of schedules || []) {
      const k = sch.medicineName.trim().toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const reg = getSmartClinicalRegimenForMedicine(sch.medicineName);
      list.push({
        name: sch.medicineName,
        doseTimes: Array.isArray(sch.doseTimes) && sch.doseTimes.length > 0 ? sch.doseTimes : reg.defaultDoseTimes,
        frequencyKey: sch.frequency || reg.frequencyKey,
        rawText: `${sch.medicineName} ${sch.antibioticId || ''}`,
      });
    }

    for (const pm of profile.medications || []) {
      if (pm.status && pm.status !== 'active') continue;
      const k = (pm.drugName || '').trim().toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const reg = getSmartClinicalRegimenForMedicine(pm.drugName);
      list.push({
        name: pm.drugName,
        doseTimes: reg.defaultDoseTimes,
        frequencyKey: pm.frequency || reg.frequencyKey,
        rawText: `${pm.drugName} ${pm.activeIngredients || ''}`,
      });
    }

    return list;
  }, [schedules, profile.medications]);

  const handleSelectMedicineForRescue = (name: string, rawText: string, doseTimes: string[], frequencyKey: string) => {
    const detectedFam = inferFamilyFromMedicineText(rawText);
    setSelectedFamilyId(detectedFam);
    setSelectedMedContext({ name, doseTimes, frequencyKey });
    setMedSearchQuery('');
  };

  const nextDoseCalc = useMemo(
    () => (selectedMedContext ? computeNextDoseHoursRemaining(selectedMedContext.doseTimes) : null),
    [selectedMedContext]
  );

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #7f1d1d 55%, #b91c1c 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '20px',
          boxShadow: '0 14px 34px rgba(13, 31, 56, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#fecaca' }}>
            🚨 {tr(lang, 'دليل وموجه إنقاذ الجرعة المنسية السريري الفوري', 'Clinical Missed Dose Emergency Protocol')}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/daily-schedule" className="btn small" style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
              🗓️ {tr(lang, 'جدول مواعيد الأدوية', 'Dose Schedule')}
            </Link>
            <Link to="/clinics" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
              🏥 {tr(lang, 'مجمع العيادات', 'Clinics Hub')}
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
          {tr(lang, 'نسيت ميعاد جرعة الدواء؟ 👈 اعرف فوراً التصرف الطبي الصحيح والممنوعات!', 'Missed Your Medication Dose? Exact Action Protocol & Contraindications')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
          {tr(
            lang,
            'اختر دواءك من جدولك الحالي أو ابحث باسمه من 26,562 دواء مصري، ليحسب لك الموقع كم ساعة متبقية على جرعتك القادمة ويحدد لك فوراً: هل تبلعها الآن أم تتخطاها بأمان.',
            'Select your medication from your active schedule or search 26,562 Egyptian drugs to calculate hours remaining to your next dose and get instant clinical guidance.'
          )}
        </p>
      </section>

      {/* Personal Active Medications & 26,562 Medicine Search Bar */}
      <section
        className="card"
        style={{
          borderRadius: '20px',
          border: '1.5px solid #cbd5e1',
          background: '#ffffff',
          padding: '18px 20px',
          marginBottom: '20px',
        }}
      >
        {userSavedMeds.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0D1F38', marginBottom: '8px' }}>
              ⏰ {isAr ? 'أدويتك ومنبهاتك المسجلة حالياً — اضغط على الدواء الذي نسيت جرعته:' : 'Your Active Scheduled Medications — Tap the missed medicine:'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {userSavedMeds.map((um, idx) => {
                const isSelectedMed = selectedMedContext?.name === um.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectMedicineForRescue(um.name, um.rawText, um.doseTimes, um.frequencyKey)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: isSelectedMed ? '2px solid #dc2626' : '1.5px solid #138866',
                      background: isSelectedMed ? '#fef2f2' : '#f0fdf4',
                      color: isSelectedMed ? '#991b1b' : '#065f46',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    💊 {um.name}{' '}
                    <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>
                      ({um.doseTimes.map((t) => formatTime12Hour(t, isAr)).join(' • ')})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900, color: '#0D1F38', marginBottom: '6px' }}>
            🔍 {isAr ? 'أو ابحث باسم أي دواء في مصر (26,562+ دواء) لمعرفة قاعدة نسيان جرعته:' : 'Or search any medicine in Egypt (26,562+ drugs) to check its missed-dose rule:'}
          </label>
          <input
            type="search"
            value={medSearchQuery}
            onChange={(e) => setMedSearchQuery(e.target.value)}
            placeholder={isAr ? 'مثال: فلاجيل، أوجمنتين، كونكور، إلتروكسين، جلوكوفاج، ماريفان، ياسمين...' : 'e.g., Flagyl, Augmentin, Concor, Eltroxin, Glucophage...'}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '12px',
              border: '1.5px solid #94a3b8',
              fontSize: '0.92rem',
              fontWeight: 700,
            }}
          />
          {searchMatches.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {searchMatches.map((it) => {
                const reg = getSmartClinicalRegimenForMedicine(it);
                return (
                  <button
                    key={it.i}
                    type="button"
                    className="chip"
                    onClick={() =>
                      handleSelectMedicineForRescue(
                        isAr ? `${it.a || it.n} (${it.s})` : `${it.n} (${it.s})`,
                        `${it.n} ${it.a} ${it.g} ${it.d}`,
                        reg.defaultDoseTimes,
                        reg.frequencyKey
                      )
                    }
                  >
                    💊 {isAr ? it.a || it.n : it.n} ({it.s})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Personalized Real-Time Clock Calculation Box when a specific medicine is selected */}
        {selectedMedContext && nextDoseCalc && (
          <div
            style={{
              marginTop: '14px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: nextDoseCalc.hoursRemaining >= 3 ? '#f0fdf4' : '#fffbeb',
              border: nextDoseCalc.hoursRemaining >= 3 ? '2px solid #16a34a' : '2px solid #d97706',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <strong style={{ color: '#0D1F38', fontSize: '0.98rem', display: 'block', marginBottom: '4px' }}>
                ⏱️ حساب التوقيت الفوري لدواء «{selectedMedContext.name}»:
              </strong>
              <span style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 700, display: 'block' }}>
                مواعيد الجرعات اليومية: <b>{selectedMedContext.doseTimes.map((t) => formatTime12Hour(t, isAr)).join(' • ')}</b> — الجرعة القادمة الساعة{' '}
                <b>{formatTime12Hour(nextDoseCalc.nextSlot, isAr)}</b> (متبقي حوالي <b>{nextDoseCalc.hoursRemaining} ساعة</b>).
              </span>
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  color: nextDoseCalc.hoursRemaining >= 3 ? '#166534' : '#b45309',
                  display: 'block',
                  marginTop: '4px',
                }}
              >
                {nextDoseCalc.hoursRemaining >= 3
                  ? '🟢 القرار السريري: باقي وقت كافٍ على الجرعة التالية — يمكنك أخذ الجرعة المنسية الآن (مع مراعاة تعليمات الأكل بالأسفل).'
                  : '🟡 القرار السريري: الجرعة التالية قريبة جداً (أقل من 3 ساعات) — تخطَّ الجرعة المنسية وخذ القادمة في موعدها دون مضاعفة!'}
              </span>
            </div>
            <button
              type="button"
              className="btn small ghost"
              onClick={() => setSelectedMedContext(null)}
            >
              ✕ {isAr ? 'مسح' : 'Clear'}
            </button>
          </div>
        )}
      </section>

      {/* Drug Family Selector Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {(Object.keys(MISSED_DOSE_FAMILIES) as DrugFamilyKey[]).map((key) => {
          const item = MISSED_DOSE_FAMILIES[key];
          const isSel = item.id === selectedFamilyId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedFamilyId(item.id)}
              style={{
                textAlign: 'right',
                padding: '14px 16px',
                borderRadius: '18px',
                border: isSel ? '2.5px solid #dc2626' : '1.5px solid #cbd5e1',
                background: isSel ? 'linear-gradient(135deg, #0D1F38 0%, #450a0a 100%)' : '#ffffff',
                color: isSel ? '#ffffff' : '#0D1F38',
                cursor: 'pointer',
                boxShadow: isSel ? '0 8px 22px rgba(220, 38, 38, 0.2)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                <span style={{ fontWeight: 900, fontSize: '0.94rem' }}>{item.nameAr}</span>
              </div>
              <div style={{ fontSize: '0.74rem', opacity: isSel ? 0.92 : 0.7, color: isSel ? '#fca5a5' : '#64748b', fontWeight: 700 }}>
                {item.badgeAr}
              </div>
            </button>
          );
        })}
      </section>

      {/* Active Drug Family Hero Details */}
      <section
        className="card"
        style={{
          borderRadius: '22px',
          border: '2px solid #b91c1c',
          background: '#ffffff',
          padding: '24px',
          marginBottom: '22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '5px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 900 }}>
              🎯 {family.badgeAr}
            </span>
            <h2 style={{ margin: '4px 0 6px', color: '#0D1F38', fontSize: '1.45rem', fontWeight: 900 }}>
              {family.icon} بروتوكول إنقاذ جرعة: {family.nameAr}
            </h2>
            <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
              💊 أشهر الأدوية والأسماء التجارية في مصر: <span style={{ color: '#0f766e' }}>{family.commonBrandsAr}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn small"
            onClick={() =>
              speakText(
                `بروتوكول إنقاذ جرعة ${family.nameAr}. ${family.scenarios[0].actionTitleAr}. ${family.scenarios[0].immediateStepAr}`,
                lang
              )
            }
            style={{ background: '#0D1F38', color: '#ffffff', borderRadius: '14px', fontWeight: 800 }}
          >
            🔊 استمع للتوجيه الصوتي
          </button>
        </div>

        {/* Scenarios according to hours late */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {family.scenarios.map((sc) => (
            <div
              key={sc.id}
              style={{
                borderRadius: '18px',
                border: `2px solid ${sc.severityColor}`,
                background: '#fafafa',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0D1F38' }}>
                  ⏱️ سيناريو الوقت: {sc.hoursLateLabelAr}
                </span>
                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: '14px',
                    background: sc.severityColor,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                  }}
                >
                  {sc.actionBadgeAr}
                </span>
              </div>

              <h3 style={{ margin: '0 0 10px', color: sc.severityColor, fontSize: '1.18rem', fontWeight: 900 }}>
                👉 {sc.actionTitleAr}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f0fdf4', borderRight: '4px solid #16a34a', padding: '12px 14px', borderRadius: '12px' }}>
                  <strong style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>
                    ✅ التصرف السريري الفوري المطلوب:
                  </strong>
                  <span style={{ color: '#1e293b', fontSize: '0.92rem', lineHeight: 1.65 }}>
                    {sc.immediateStepAr}
                  </span>
                </div>

                <div style={{ background: '#fef2f2', borderRight: '4px solid #dc2626', padding: '12px 14px', borderRadius: '12px' }}>
                  <strong style={{ color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                    ⛔ خطأ كارثي ممنوع تماماً:
                  </strong>
                  <span style={{ color: '#7f1d1d', fontSize: '0.92rem', lineHeight: 1.65, fontWeight: 700 }}>
                    {sc.strictlyForbiddenAr}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.86rem', color: '#1e40af' }}>
                ⚠️ <b>متى يجب القلق أو استشارة الطبيب؟</b> {sc.whenToWorryAr}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Universal Golden Rule Banner */}
      <section
        className="card"
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '22px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 900, color: '#fde047' }}>
              🌟 القاعدة الذهبية لجميع أدوية العالم عند نسيان الجرعة:
            </h3>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.65, maxWidth: '780px' }}>
              «إياك ومضاعفة الجرعة أبداً بأخذ حبتين لتعويض حبة منسية، إلا إذا كان ذلك وارداً بنص صريح في بروتوكول حبوب منع الحمل فقط! مضاعفة المسكنات أو أدوية الضغط أو الأنسولين أو الغدة قد تسبب تسمماً دوائياً أو هبوطاً حاداً يهدد الحياة.»
            </p>
          </div>
          <Link
            to="/assistant"
            className="btn"
            style={{
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 900,
              borderRadius: '14px',
              textDecoration: 'none',
              padding: '10px 18px',
            }}
          >
            💬 اسأل دكتور دوايا عن دوائك المنسي الآن ←
          </Link>
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
