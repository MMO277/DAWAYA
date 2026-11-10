
// ── Egyptian Carb & Rapid Insulin Calculator (Embedded inside Meal Planner) ──
function EgyptianCarbCalculatorView() {
  const [selectedFood, setSelectedFood] = useState('baladi_bread');
  const [portions, setPortions] = useState<number>(1);
  const [carbRatio, setCarbRatio] = useState<number>(15); // 1 unit per 15g carbs default

  const EGYPTIAN_CARB_FOODS: Record<string, { nameAr: string; carbsPerUnit: number; unitAr: string; glycemicIndexAr: string }> = {
    baladi_bread: { nameAr: 'رغيف عيش بلدي بالردة كامل', carbsPerUnit: 60, unitAr: 'رغيف', glycemicIndexAr: 'متوسط (ألياف صحية)' },
    half_baladi: { nameAr: 'نصف رغيف بلدي بالردة', carbsPerUnit: 30, unitAr: 'نصف رغيف', glycemicIndexAr: 'متوسط' },
    fino_bread: { nameAr: 'رغيف عيش فينو أبيض', carbsPerUnit: 28, unitAr: 'رغيف', glycemicIndexAr: 'مرتفع جداً (يرفع السكر سريعاً)' },
    cooked_rice: { nameAr: 'أرز مصري مطبوخ (4 ملاعق كبيرة)', carbsPerUnit: 30, unitAr: 'طبق صغير', glycemicIndexAr: 'مرتفع' },
    pasta: { nameAr: 'مكرونة مسلوقة (4 ملاعق كبيرة)', carbsPerUnit: 30, unitAr: 'طبق صغير', glycemicIndexAr: 'متوسط' },
    koshary: { nameAr: 'علبة كشري مصري متوسطة', carbsPerUnit: 85, unitAr: 'علبة متوسطة', glycemicIndexAr: 'مرتفع' },
    taameya: { nameAr: 'قرص طعمية مقلي متوسط', carbsPerUnit: 6, unitAr: 'قرص', glycemicIndexAr: 'منخفض (بروتين نباتي ودهن)' },
    foul: { nameAr: 'طبق فول مدمس (4 ملاعق كبيرة)', carbsPerUnit: 18, unitAr: 'طبق', glycemicIndexAr: 'منخفض جداً (صديق السكر)' },
    potatoes_boiled: { nameAr: 'حبة بطاطس مسلوقة متوسطة', carbsPerUnit: 30, unitAr: 'حبة', glycemicIndexAr: 'متوسط' },
  };

  const foodInfo = EGYPTIAN_CARB_FOODS[selectedFood] || EGYPTIAN_CARB_FOODS.baladi_bread;
  const totalCarbs = Math.round(foodInfo.carbsPerUnit * portions);
  const calculatedInsulinUnits = (totalCarbs / (carbRatio || 15)).toFixed(1);

  return (
    <div
      style={{
        borderRadius: '20px',
        border: '2px solid #0f766e',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
        padding: '22px',
        marginBottom: '22px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, color: '#0D1F38', fontSize: '1.25rem', fontWeight: 900 }}>
          🍞 حاسبة النشويات ومعامل السكر للأكلات المصرية المدمجة
        </h3>
        <span style={{ background: '#0f766e', color: '#ffffff', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 800 }}>
          لحساب جرعة الأنسولين السريع بدقة
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
            اختر الأكلة المصرية:
          </label>
          <select
            value={selectedFood}
            onChange={(e) => setSelectedFood(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '0.92rem' }}
          >
            {Object.entries(EGYPTIAN_CARB_FOODS).map(([k, f]) => (
              <option key={k} value={k}>
                {f.nameAr} (~{f.carbsPerUnit} جم نشويات)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
            الكمية المتناولة:
          </label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={portions}
            onChange={(e) => setPortions(Math.max(0.5, parseFloat(e.target.value) || 1))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '0.92rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
            معامل الكارب للطبيب (1 وحدة لكل كم جرام؟):
          </label>
          <input
            type="number"
            min="5"
            max="30"
            value={carbRatio}
            onChange={(e) => setCarbRatio(Math.max(5, parseFloat(e.target.value) || 15))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '0.92rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1.5px solid #99f6e4' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>إجمالي النشويات في الوجبة:</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f766e' }}>
            {totalCarbs} <span style={{ fontSize: '0.9rem' }}>جرام كارب</span>
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>جرعة الأنسولين السريع المقترحة:</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#b91c1c' }}>
            ~{calculatedInsulinUnits} <span style={{ fontSize: '0.9rem' }}>وحدة أنسولين سريع</span>
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>المؤشر السكري للوجبة:</span>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0D1F38', marginTop: '4px' }}>
            {foodInfo.glycemicIndexAr}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import Disclaimer from './Disclaimer';

export type ChronicConditionKey =
  | 'diabetes'
  | 'hypertension'
  | 'kidney_disease'
  | 'cholesterol_heart'
  | 'gout_uric';

export interface MealItem {
  nameAr: string;
  nameEn: string;
  portionAr: string;
  caloriesApprox: number;
  carbsGrams: number;
  sodiumLevel: 'low' | 'moderate' | 'high';
  benefitNoteAr: string;
  whySafeAr: string;
}

export interface DayMealPlan {
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
  snack: MealItem;
  drinkAdviceAr: string;
  goldenRuleAr: string;
  strictlyForbiddenAr: string[];
}

export interface ConditionMealProfile {
  id: ChronicConditionKey;
  icon: string;
  titleAr: string;
  titleEn: string;
  badgeAr: string;
  accentColor: string;
  summaryAr: string;
  allowedHeroFoodsAr: string[];
  forbiddenFoodsAr: string[];
  samplePlans: DayMealPlan[];
}

export const CHRONIC_MEAL_PROFILES: Record<ChronicConditionKey, ConditionMealProfile> = {
  diabetes: {
    id: 'diabetes',
    icon: '🩸',
    titleAr: 'مرضى السكري (النوع 1 والنوع 2 ومقاومة الأنسولين)',
    titleEn: 'Diabetes & Insulin Resistance',
    badgeAr: 'ضبط المؤشر السكري ومنع ارتفاع السكر بعد الأكل',
    accentColor: '#0f766e',
    summaryAr: 'التركيز على الألياف المعقدة والبروتين الخالي من الدهون مع تقييد النشويات البسيطة (العيش الأبيض، السكر، والمقليات) لتفادي القفزات المفاجئة للسكر.',
    allowedHeroFoodsAr: [
      'العيش البلدي بالردة (نصف رغيف)',
      'البيض المسلوق وزيت الزيتون البكر',
      'الجبن القريش والزبادي الطبيعي',
      'الفول المدمس بالليمون والكمون',
      'السلطة الخضراء بخل التفاح',
      'الأسماك المشوية والصدور',
      'القرفة والحلبة بدون سكر',
    ],
    forbiddenFoodsAr: [
      'العيش الفينو والمخبوزات البيضاء',
      'المياه الغازية والعصائر المحلاة',
      'الحلويات الشرقية والجاتوه',
      'الأرز الأبيض والمكرونة بكميات كبيرة',
      'الفواكه عالية السكر (العنب والمانجو والبلح بكثرة)',
    ],
    samplePlans: [
      {
        breakfast: {
          nameAr: 'فول مدمس بالليمون والكمون وزيت الزيتون + نصف رغيف بلدي بالردة + طبق خيار وخس',
          nameEn: 'Fava beans with olive oil, cumin & lemon + 1/2 whole-wheat Egyptian pita + cucumber salad',
          portionAr: '4 ملاعق فول كبيرة + نصف رغيف',
          caloriesApprox: 320,
          carbsGrams: 35,
          sodiumLevel: 'low',
          benefitNoteAr: 'الألياف في الفول والردة تبطئ امتصاص السكر بنسبة 50% وتمنع قفزة السكر الصباحية.',
          whySafeAr: 'مؤشر جلايسيمي منخفض ودهون صحية غير مشبعة.',
        },
        lunch: {
          nameAr: 'سمك بلطي مشوي بالردة + 4 ملاعق أرز بني أو حبة وحبة + طبق سلطة خضراء كبير بليمون وخل',
          nameEn: 'Grilled tilapia fish + 4 spoons brown rice + large fresh garden salad',
          portionAr: 'سمكة متوسطة مشوية + 4 ملاعق أرز',
          caloriesApprox: 450,
          carbsGrams: 32,
          sodiumLevel: 'low',
          benefitNoteAr: 'البروتين الصافي والأوميجا 3 يحسنان حساسية خلايا الجسم للأنسولين.',
          whySafeAr: 'خالٍ من الزيوت المهدرجة ونشويات معقدة بطيئة الامتصاص.',
        },
        dinner: {
          nameAr: 'قطعة جبن قريش بزيت الزيتون وحبة البركة + طبق سلطة طماطم وخيار وخس + ربع رغيف بلدي',
          nameEn: 'Cottage cheese with nigella seeds & olive oil + fresh salad + 1/4 pita',
          portionAr: '100 جرام جبن قريش',
          caloriesApprox: 220,
          carbsGrams: 18,
          sodiumLevel: 'low',
          benefitNoteAr: 'بروتين كازين بطيء الامتصاص يحافظ على استقرار السكر طوال ساعات النوم ويمنع هبوط الفجر.',
          whySafeAr: 'كالسيوم طبيعي وبروتين نقي بدون دهون مهدرجة.',
        },
        snack: {
          nameAr: 'علبة زبادي بلدي أو حفنة صغيرة ترمس مسلوق أو خيارتين',
          nameEn: 'Greek/plain yogurt or a handful of boiled lupini beans or cucumbers',
          portionAr: 'كوب زبادي صغير',
          caloriesApprox: 90,
          carbsGrams: 6,
          sodiumLevel: 'low',
          benefitNoteAr: 'بروبيوتيك طبيعي يقوي بكتيريا الأمعاء النافعة المسؤولة عن تنظيم حرق الجلوكوز.',
          whySafeAr: 'سناك لا يرفع سكر الدم إطلاقاً.',
        },
        drinkAdviceAr: 'اشرب 8 إلى 10 أكواب ماء يومياً، مع كوب شاي أخضر أو قرفة مغلية بدون سكر بعد الوجبات الرئيسية.',
        goldenRuleAr: 'قاعدة الطبق الصحي: نصف الطبق خضروات وسلطة، ربعه بروتين صافٍ، وربعه فقط نشويات معقدة.',
        strictlyForbiddenAr: ['المياه الغازية العادية', 'العصائر المعلبة حتى لو بدون سكر مضاف', 'المخبوزات بالدقيق الأبيض'],
      },
    ],
  },

  hypertension: {
    id: 'hypertension',
    icon: '🫀',
    titleAr: 'مرضى ضغط الدم المرتفع وأمراض القلب',
    titleEn: 'Hypertension & Heart Care',
    badgeAr: 'نظام DASH المصري وخفض الصوديوم وحماية الشرايين',
    accentColor: '#b91c1c',
    summaryAr: 'حمية قليلة الصوديوم وغنية بالبوتاسيوم والماغنسيوم الطبيعي (الخضار الورقي وزيت الزيتون والثوم والكركديه البارد) لارتخاء جدران الشرايين وتخفيف الحمل على القلب.',
    allowedHeroFoodsAr: [
      'الكركديه البارد المنقوع (بدون سكر)',
      'الثوم الطازج وزيت الزيتون البكر',
      'الموز والتمر باعتدال (بوتاسيوم طبيعي)',
      'الخضار الورقي (الجرجير والخس والبقدونس)',
      'الزبادي قليل الدسم والشوفان',
      'الصدور والأسماك المشوية بدون ملح زائد',
    ],
    forbiddenFoodsAr: [
      'العرقسوس بجميع أشكاله (يرفع الضغط فوراً)',
      'المخللات والفسيخ والرنجة والجبن الرومي والقديم',
      'الفوارات الطبية المالحة (كتافاست / سولبادين فوار)',
      'مكعبات مرقة الدجاج الجاهزة والصويا صوص',
      'المقليات والشيبسي والأغذية المحفوظة',
    ],
    samplePlans: [
      {
        breakfast: {
          nameAr: 'طبق شوفان بالحليب قليل الدسم وشرائح موز مع ملعقة بذور كتان + بيضة مسلوقة بدون ملح',
          nameEn: 'Oatmeal with low-fat milk, banana slices, and flaxseeds + boiled egg without salt',
          portionAr: '4 ملاعق شوفان + بيضة',
          caloriesApprox: 340,
          carbsGrams: 42,
          sodiumLevel: 'low',
          benefitNoteAr: 'البوتاسيوم والماغنسيوم في الشوفان والموز يطردان الصوديوم الزائد ويوسعان الشرايين.',
          whySafeAr: 'صوديوم شبه منعدم ودهون نباتية صحية.',
        },
        lunch: {
          nameAr: 'صدر دجاجة مشوي متبل بالليمون والكمون والزعتر والثوم + خضار سوتيه كوسة وجزر وفاصوليا + أرز أبيض مسلوق بدون سمن',
          nameEn: 'Herb-grilled chicken breast + steamed zucchini and green beans + steamed rice',
          portionAr: '150 جم صدر دجاج + طبق خضار',
          caloriesApprox: 420,
          carbsGrams: 30,
          sodiumLevel: 'low',
          benefitNoteAr: 'الثوم والليمون يعطيان طعماً لذيذاً كبديل للملح ويحفزان إفراز أكسيد النيتريك الموسع للأوعية.',
          whySafeAr: 'بدون دهون مشبعة وبأقل من 300 مجم صوديوم.',
        },
        dinner: {
          nameAr: 'طبق سلطة يونانية بقطع الجبن القريش والجرجير وزيت الزيتون ورشة زعتر + شريحة توست بني',
          nameEn: 'Arugula and cottage cheese salad with olive oil and oregano + 1 whole-wheat toast',
          portionAr: 'طبق سلطة كبير + توست',
          caloriesApprox: 210,
          carbsGrams: 16,
          sodiumLevel: 'low',
          benefitNoteAr: 'النترات الطبيعية في الجرجير تخفض ضغط الدم الانقباضي بمقدار 4 إلى 8 درجات.',
          whySafeAr: 'خفيف على القلب قبل النوم وخالٍ من الملح المخفي.',
        },
        snack: {
          nameAr: 'حفنة صغيرة لوز أو سوداني غير مملح + كوب كركديه منقوع بارد',
          nameEn: 'Unsalted raw almonds + cold steeped hibiscus tea',
          portionAr: '10 حبات لوز + كوب كركديه',
          caloriesApprox: 130,
          carbsGrams: 5,
          sodiumLevel: 'low',
          benefitNoteAr: 'الكركديه البارد مثبت علمياً في خفض ضغط الدم الانقباضي والانبساطي.',
          whySafeAr: 'مضادات أكسدة قوية بدون صوديوم.',
        },
        drinkAdviceAr: 'كوبان من الكركديه المنقوع البارد يومياً، وممنوع العرقسوس منعاً باتاً لمرضى الضغط.',
        goldenRuleAr: 'استبدل الملاحة في المطبخ بـ: الليمون، الكمون، الزعتر، الكزبرة، وبودرة الثوم.',
        strictlyForbiddenAr: ['العرقسوس', 'المخلل والطرشي', 'الفوارات المالحة المسكنة'],
      },
    ],
  },

  kidney_disease: {
    id: 'kidney_disease',
    icon: '🧪',
    titleAr: 'مرضى القصور الكلوي وضعف فلترة الكلى (eGFR)',
    titleEn: 'Chronic Kidney Disease (CKD)',
    badgeAr: 'حماية فلتر الكلى وضبط البروتين والبوتاسيوم والفوسفور',
    accentColor: '#b45309',
    summaryAr: 'تخفيف الحمل عن فلاتر الكلى عبر ضبط كمية البروتين (حسب الوزن)، والسيطرة على الأطعمة الغنية بالبوتاسيوم والفوسفور لتفادي تراكم السموم بالدم.',
    allowedHeroFoodsAr: [
      'بياض البيض المسلوق (بروتين نقي بأقل فوسفور)',
      'الخضروات منقوعة ومسلوقة ومصفاة من الماء (لتقليل البوتاسيوم)',
      'التفاح والكمثرى والعنب والتوت (فواكه منخفضة البوتاسيوم)',
      'الخيار والكوسة المسلوقة بدون قشر',
      'زيت الزيتون البكر وعسل النحل بكمية محسوبة',
    ],
    forbiddenFoodsAr: [
      'الأطعمة المصنعة واللحوم المعلبة والمياه الغازية الداكنة (فوسفور كيميائي يضر الكلى)',
      'الموز والبرتقال والتمر والبطاطس غير المسلوقة (غنية جداً بالبوتاسيوم)',
      'المكسرات والبقوليات بكميات ضخمة (فوسفور وبوتاسيوم عالي)',
      'ملح الدايت أو بدائل الملح الطبية (تحتوي على كلوريد البوتاسيوم القاتل للكلى)',
      'الإفراط في اللحوم الحمراء (تزيد البولينا والكرياتينين)',
    ],
    samplePlans: [
      {
        breakfast: {
          nameAr: 'بياض 2 بيضة مسلوقة (بدون صفار) + نصف رغيف عيش مصري أبيض خفيف + شرائح تفاح مقشر',
          nameEn: '2 boiled egg whites + 1/2 white pita + peeled apple slices',
          portionAr: '2 بياض بيض + نصف رغيف',
          caloriesApprox: 260,
          carbsGrams: 34,
          sodiumLevel: 'low',
          benefitNoteAr: 'بياض البيض يعطي أعلى جودة بروتين للجسم مع أقل نسبة فوسفور تحمي وظائف الكلى.',
          whySafeAr: 'منخفض البوتاسيوم والفوسفور والصوديوم.',
        },
        lunch: {
          nameAr: 'شريحة سمك فيليه أبيض مشوي (أو 80 جم صدر دجاج) + أرز أبيض مسلوق + كوسة وجزر مسلوقين ومصفي ماؤهم',
          nameEn: 'Grilled white fish fillet (80g) + steamed white rice + boiled peeled zucchini',
          portionAr: '80 جم بروتين صافٍ + 4 ملاعق أرز',
          caloriesApprox: 380,
          carbsGrams: 38,
          sodiumLevel: 'low',
          benefitNoteAr: 'سلق الخضار وتصفية ماء السلق يتخلص من 50% من البوتاسيوم الزائد المرهق للكلى.',
          whySafeAr: 'بروتين مضبوط الغرامات لحماية النفرونات الكلوية.',
        },
        dinner: {
          nameAr: 'قطعة جبن قريش مغسولة من الملح مع ملعقة زيت زيتون + شرائح خيار مقشر + ربع رغيف',
          nameEn: 'Washed low-salt cottage cheese + olive oil + peeled cucumber + 1/4 bread',
          portionAr: '60 جم جبن مغسول',
          caloriesApprox: 180,
          carbsGrams: 14,
          sodiumLevel: 'low',
          benefitNoteAr: 'غسل الجبن يتخلص من الملح السطحي ويمنع احتباس السوائل وتورم القدمين.',
          whySafeAr: 'سهل الهضم ومنخفض العبء الكلوي.',
        },
        snack: {
          nameAr: 'نصف تفاحة مقشرة أو طبق صغير عنب أحمر',
          nameEn: '1/2 peeled apple or small cluster of grapes',
          portionAr: 'نصف ثمرة تفاح',
          caloriesApprox: 60,
          carbsGrams: 15,
          sodiumLevel: 'low',
          benefitNoteAr: 'فاكهة آمنة لا ترفع بوتاسيوم الدم لمرضى القصور الكلوي.',
          whySafeAr: 'آمنة للكلى وخالية من الفوسفور.',
        },
        drinkAdviceAr: 'التزم بكمية السوائل التي حددها استشاري الكلى (عادة 1 إلى 1.5 لتر يومياً عند وجود تورم بالقدمين).',
        goldenRuleAr: 'قاعدة سلق الخضار للكلى: انقع الخضار وقطعه واسلقه في ماء وفير ثم ارمِ ماء السلق للتخلص من البوتاسيوم.',
        strictlyForbiddenAr: ['ملح الدايت البوتاسيومي', 'المياه الغازية الداكنة', 'المسكنات كالفولتارين'],
      },
    ],
  },

  cholesterol_heart: {
    id: 'cholesterol_heart',
    icon: '🥑',
    titleAr: 'مرضى الكوليسترول والدهون الثلاثية والكبد الدهني',
    titleEn: 'Cholesterol, Triglycerides & Fatty Liver',
    badgeAr: 'تطهير الشرايين وخفض LDL والدهون الثلاثية',
    accentColor: '#1d4ed8',
    summaryAr: 'منع الزيوت المهدرجة والسمن النباتي، واستبدالها بزيت الزيتون والأوميجا 3 والألياف الذائبة (الشوفان وبذور الشيا وبذر الكتان) التي تكنس الكوليسترول الضار من الدم.',
    allowedHeroFoodsAr: [
      'الشوفان الكامل وبذور الشيا والكتان',
      'الأسماك الدهنية (التونة والسلمون والسردين والماكريل)',
      'زيت الزيتون البكر الممتاز معصور على البارد',
      'المكسرات النيئة (عين الجمل واللوز)',
      'الخرشوف والبروكلي والثوم الطازج',
    ],
    forbiddenFoodsAr: [
      'السمن النباتي والمسلى الصناعي والزيوت المهدرجة',
      'المقليات (البطاطس المقلية، الطعمية المقلية، البانيه)',
      'اللحوم المصنعة (اللانشون والبلوبيف والسجق والبرجر)',
      'الحلويات والمخبوزات المليئة بالسمن والسكر',
      'الجلد والدهن والأحشاء (الممبار والكوارع والمخ)',
    ],
    samplePlans: [
      {
        breakfast: {
          nameAr: 'طبق شوفان مطبوخ بالماء أو حليب قليل الدسم + ملعقة بذور شيا + 3 حبات عين جمل + نصف تفاحة',
          nameEn: 'Oatmeal cooked with chia seeds, 3 walnuts & apple slices',
          portionAr: '5 ملاعق شوفان + مكسرات',
          caloriesApprox: 320,
          carbsGrams: 36,
          sodiumLevel: 'low',
          benefitNoteAr: 'ألياف البيتا جلوكان في الشوفان تلتصق بالكوليسترول في الأمعاء وتطرده خارج الجسم.',
          whySafeAr: 'أوميجا 3 نباتية بدون ذرة دهون متحولة.',
        },
        lunch: {
          nameAr: 'علبة تونة مصفاة ومغسولة بالخل والليمون (أو سمك ماكريل مشوي) + طبق سلطة خضراء غني بزيت الزيتون + نصف رغيف بلدي',
          nameEn: 'Drained light tuna with lemon & olive oil + green salad + 1/2 whole-wheat pita',
          portionAr: 'علبة تونة 140 جم + سلطة',
          caloriesApprox: 390,
          carbsGrams: 28,
          sodiumLevel: 'low',
          benefitNoteAr: 'أوميجا 3 البحرية تخفض الدهون الثلاثية بالدم بنسبة 25% إلى 30% خلال 8 أسابيع.',
          whySafeAr: 'تحمي بطانة الشرايين وتزيد الكوليسترول النافع HDL.',
        },
        dinner: {
          nameAr: 'كوب زبادي قليل الدسم بملعقة بذور كتان مطحونة وعصرة ليمون + طبق سلطة خيار وخس',
          nameEn: 'Low-fat yogurt with ground flaxseed & lemon + cucumber salad',
          portionAr: 'كوب زبادي كبير',
          caloriesApprox: 170,
          carbsGrams: 12,
          sodiumLevel: 'low',
          benefitNoteAr: 'بذور الكتان المطحونة غنية بـ Lignans التي تدعم صحة الكبد وتمنع ترسب الدهون.',
          whySafeAr: 'وجبة عشاء خفيفة ومثالية للكبد الدهني.',
        },
        snack: {
          nameAr: 'تفاحة بقشرها أو جزرتان طازجتان أو كوب شاي أخضر بالنعناع',
          nameEn: '1 fresh apple or raw carrots with green tea',
          portionAr: 'ثمرة واحدة',
          caloriesApprox: 80,
          carbsGrams: 18,
          sodiumLevel: 'low',
          benefitNoteAr: 'البكتين في التفاح ينظف الجهاز الهضمي والشرايين.',
          whySafeAr: 'سعرات منخفضة ومضادات أكسدة عالية.',
        },
        drinkAdviceAr: 'كوبان من الشاي الأخضر بالليمون يومياً بين الوجبات لزيادة أكسدة الدهون الضارة.',
        goldenRuleAr: 'اقرأ ملصق أي منتج: إذا وجدت كلمة «دهون مهدرجة أو زيت نخيل»، اتركه فوراً على الرف!',
        strictlyForbiddenAr: ['السمن النباتي', 'المقليات بالزيت المتكرر', 'اللانشون واللحوم المصنعة'],
      },
    ],
  },

  gout_uric: {
    id: 'gout_uric',
    icon: '🦶',
    titleAr: 'مرضى النقرس وارتفاع حمض اليوريك وأملاح اليورات',
    titleEn: 'Gout & High Uric Acid',
    badgeAr: 'خفض البيورينات وإذابة البلورات من المفاصل والكلى',
    accentColor: '#7c3aed',
    summaryAr: 'حمية قليلة البيورين وغنية بالماء والليمون والكرز والبروتينات النباتية الخفيفة، لمنع ترسب بلورات حمض اليوريك المؤلمة في إصبع القدم الأكبر والكلى.',
    allowedHeroFoodsAr: [
      'الماء الوفير (3 لتر يومياً حجر الزاوية)',
      'الكرز والفراولة والليمون (تساعد في طرد اليوريك)',
      'البيض والجبن القريش والألبان قليلة الدسم (بروتينات منخفضة البيورين تماماً)',
      'الخيار والخس والكوسة والقرنبيط',
      'فيتامين سي الطبيعي وزيت الزيتون',
    ],
    forbiddenFoodsAr: [
      'الكبدة والكلاوي والمخ والأحشاء الداخلية (أعلى نسبة بيورين)',
      'اللحوم الحمراء والبط والوز والحمام',
      'البطروخ والفسيخ والرنجة والسردين والجمبري',
      'البقوليات بكثرة في النوبة الحادة (الفول والعدس والبصارة)',
      'المشروبات المحلاة بشراب الذرة عالي الفركتوز والمياه الغازية',
    ],
    samplePlans: [
      {
        breakfast: {
          nameAr: '2 بيضة مسلوقة + قطعة جبن قريش بزيت الزيتون والخيار + نصف رغيف بلدي + كوب ماء كبير بليمون',
          nameEn: '2 boiled eggs + cottage cheese with olive oil + 1/2 pita + lemon water',
          portionAr: '2 بيضة + جبن قريش',
          caloriesApprox: 310,
          carbsGrams: 24,
          sodiumLevel: 'low',
          benefitNoteAr: 'البيض والألبان هي أفضل مصادر البروتين للنقرس لأنها خالية تماماً من مادة البيورين.',
          whySafeAr: 'صفر بيورين ويقوي العضلات بدون رفع حمض اليوريك.',
        },
        lunch: {
          nameAr: 'صدر دجاج مشوي صغير (100 جم) أو سمك فيليه أبيض مشوي + طبق خضار سوتيه كوسة وجزر + أرز مسلوق + طبق سلطة بليمون',
          nameEn: 'Small grilled chicken breast (100g) + steamed zucchini & carrots + rice + lemon salad',
          portionAr: '100 جم صدر دجاج + طبق خضار',
          caloriesApprox: 380,
          carbsGrams: 34,
          sodiumLevel: 'low',
          benefitNoteAr: 'فيتامين سي والليمون يساعدان الكلى على طرح حمض اليوريك في البول.',
          whySafeAr: 'بيورين منخفض جداً مقارنة باللحوم الحمراء والبط.',
        },
        dinner: {
          nameAr: 'كوب زبادي قليل الدسم بقطع الفراولة أو التوت + خيار وخس + ربع رغيف بلدي',
          nameEn: 'Low-fat yogurt with strawberries + fresh greens + 1/4 pita',
          portionAr: 'كوب زبادي كبير',
          caloriesApprox: 190,
          carbsGrams: 20,
          sodiumLevel: 'low',
          benefitNoteAr: 'مضادات الأكسدة في التوت والفراولة تثبط التهاب المفاصل وتهدئ النوبة.',
          whySafeAr: 'خفيف ومرطب للجسم ولا يرسب أملاحاً.',
        },
        snack: {
          nameAr: 'كوب ماء دافئ بعصير نصف ليمونة + حفنة صغيرة كرز أو فراولة',
          nameEn: 'Warm water with lemon juice + fresh cherries or strawberries',
          portionAr: 'كوب ماء + كرز',
          caloriesApprox: 70,
          carbsGrams: 14,
          sodiumLevel: 'low',
          benefitNoteAr: 'الكرز مثبت طبياً في خفض نوبات النقرس الحادة بنسبة 35%.',
          whySafeAr: 'قلوي للجسم ويمنع تكون حصوات اليورات.',
        },
        drinkAdviceAr: 'اشرب زجاجة ماء كل ساعتين (إجمالي 3 إلى 3.5 لتر يومياً) لإذابة بلورات اليوريك ومنع حصوات الكلى.',
        goldenRuleAr: 'الماء هو العلاج الطبيعي الأول للنقرس؛ كلما كان البول شفافاً وفاتحاً، كلما كانت مفاصلك وكليتك في أمان.',
        strictlyForbiddenAr: ['الكبدة والأحشاء', 'اللحم الضاني والبط', 'المياه الغازية وعصائر الفركتوز'],
      },
    ],
  },
};

export default function ChronicMealPlanner() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedCondition, setSelectedCondition] = useState<ChronicConditionKey>('diabetes');
  const [activePlanIdx, setActivePlanIdx] = useState<number>(0);
  const [activeMealTab, setActiveMealTab] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');

  const profile = CHRONIC_MEAL_PROFILES[selectedCondition];
  const plan = profile.samplePlans[activePlanIdx] || profile.samplePlans[0];

  const totalCalories =
    plan.breakfast.caloriesApprox +
    plan.lunch.caloriesApprox +
    plan.dinner.caloriesApprox +
    plan.snack.caloriesApprox;

  const totalCarbs =
    plan.breakfast.carbsGrams +
    plan.lunch.carbsGrams +
    plan.dinner.carbsGrams +
    plan.snack.carbsGrams;

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🥗 خطة وجبات يومية لـ ${profile.titleAr} من منصة دوايا:\n` +
        `• الفطار: ${plan.breakfast.nameAr}\n` +
        `• الغداء: ${plan.lunch.nameAr}\n` +
        `• العشاء: ${plan.dinner.nameAr}\n` +
        `• السناك: ${plan.snack.nameAr}\n` +
        `💡 القاعدة الذهبية: ${plan.goldenRuleAr}\n` +
        `تصفح التفاصيل عبر: https://mmo277.github.io/DAWAYA/#/meal-planner`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <main className="wrap" style={{ maxWidth: '1180px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Banner */}
      <section
        className="card no-print"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #065f46 55%, #059669 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '20px',
          boxShadow: '0 14px 34px rgba(13, 31, 56, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#d1fae5' }}>
            🥗 {tr(lang, 'مُولّد وجبات الأمراض المزمنة المصري الذكي', 'Egyptian Chronic Disease Smart Meal Planner')}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/nutrition-clinic" className="btn small" style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
              🥑 {tr(lang, 'عيادة التغذية وحقن التخسيس', 'Clinical Nutrition Clinic')}
            </Link>
            <Link to="/food-drug-checker" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
              ☕ {tr(lang, 'فاحص الأكل والشرب مع الأدوية', 'Food-Drug Checker')}
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
          {tr(lang, 'مُولّد وجبات مرضى السكر والضغط والكلى والدهون والنقرس بأكلات مصرية متوفرة في بيتك!', 'Egyptian Meal Planner for Diabetes, Hypertension, Kidney, Cholesterol & Gout')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
          {tr(
            lang,
            'اختر حالتك الصحية ليولد لك النظام فوراً خطة وجبات متوازنة ليوم كامل (فطار، غداء، عشاء، وسناك) بأكلات مصرية محسوبة النشويات والأملاح مع جدول الممنوعات والبديل الآمن وإمكانية الطباعة والمشاركة.',
            'Select your medical condition to instantly generate an authentic, affordable Egyptian daily meal plan (breakfast, lunch, dinner & snack) with counted carbs, sodium limits, and WhatsApp sharing.'
          )}
        </p>
      </section>

      {/* Condition Selector Tabs */}
      <section className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {(Object.keys(CHRONIC_MEAL_PROFILES) as ChronicConditionKey[]).map((key) => {
          const item = CHRONIC_MEAL_PROFILES[key];
          const isSel = item.id === selectedCondition;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedCondition(item.id);
                setActivePlanIdx(0);
              }}
              style={{
                textAlign: 'right',
                padding: '14px 16px',
                borderRadius: '18px',
                border: isSel ? `2.5px solid ${item.accentColor}` : '1.5px solid #cbd5e1',
                background: isSel ? 'linear-gradient(135deg, #0D1F38 0%, #134e4a 100%)' : '#ffffff',
                color: isSel ? '#ffffff' : '#0D1F38',
                cursor: 'pointer',
                boxShadow: isSel ? '0 8px 22px rgba(13, 31, 56, 0.16)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                <span style={{ fontWeight: 900, fontSize: '0.94rem' }}>{item.titleAr}</span>
              </div>
              <div style={{ fontSize: '0.74rem', opacity: isSel ? 0.92 : 0.7, color: isSel ? '#CFD29D' : '#64748b', fontWeight: 700 }}>
                {item.badgeAr}
              </div>
            </button>
          );
        })}
      </section>

      {/* Embedded Egyptian Carb & Insulin Calculator */}
      <EgyptianCarbCalculatorView />

            {/* Selected Condition Hero & Nutrition Snapshot */}
      <section
        className="card"
        style={{
          borderRadius: '22px',
          border: `2px solid ${profile.accentColor}`,
          background: '#ffffff',
          padding: '22px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '5px 12px',
                borderRadius: '20px',
                background: '#f0fdf4',
                color: profile.accentColor,
                fontWeight: 900,
                fontSize: '0.8rem',
                border: `1px solid ${profile.accentColor}`,
                marginBottom: '6px',
              }}
            >
              🎯 {profile.badgeAr}
            </span>
            <h2 style={{ margin: '2px 0 6px', color: '#0D1F38', fontSize: '1.45rem', fontWeight: 900 }}>
              {profile.icon} خطة وجبات اليوم لـ: {profile.titleAr}
            </h2>
            <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, maxWidth: '820px', fontSize: '0.95rem' }}>
              {profile.summaryAr}
            </p>
          </div>

          {/* Actions: Print & Share & Voice */}
          <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn small"
              onClick={() =>
                speakText(
                  `خطة وجبات ${profile.titleAr}. الفطار: ${plan.breakfast.nameAr}. الغداء: ${plan.lunch.nameAr}. العشاء: ${plan.dinner.nameAr}. ${plan.goldenRuleAr}`,
                  lang
                )
              }
              style={{ background: '#0D1F38', color: '#ffffff', borderRadius: '14px', fontWeight: 800 }}
            >
              🔊 استمع للخطة صوتياً
            </button>
            <button
              type="button"
              className="btn small"
              onClick={handleShareWhatsApp}
              style={{ background: '#16a34a', color: '#ffffff', borderRadius: '14px', fontWeight: 900 }}
            >
              📲 واتساب
            </button>
            <button
              type="button"
              className="btn small"
              onClick={handlePrint}
              style={{ background: '#f1f5f9', color: '#0D1F38', border: '1px solid #cbd5e1', borderRadius: '14px', fontWeight: 800 }}
            >
              🖨️ طباعة الوجبات
            </button>
          </div>
        </div>

        {/* Nutrition KPI Badges for the Day */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>إجمالي السعرات لليوم:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0D1F38', marginTop: '2px' }}>
              ~{totalCalories} <span style={{ fontSize: '0.85rem' }}>سعر حراري</span>
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>إجمالي النشويات (Carbs):</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f766e', marginTop: '2px' }}>
              ~{totalCarbs} <span style={{ fontSize: '0.85rem' }}>جرام</span>
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>مستوى الصوديوم / الأملاح:</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
              🟢 قليل ومضبوط
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>توصية السوائل والمشروبات:</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e40af', marginTop: '4px', lineHeight: 1.4 }}>
              💧 {plan.drinkAdviceAr.slice(0, 48)}...
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Meals of the Day */}
      <section style={{ display: 'grid', gap: '16px', marginBottom: '22px' }}>
        {[
          { key: 'breakfast', tagAr: '🍳 ١. وجبة الإفطار الصحية', item: plan.breakfast, icon: '🌅' },
          { key: 'lunch', tagAr: '🍲 ٢. وجبة الغداء المتكاملة', item: plan.lunch, icon: '☀️' },
          { key: 'dinner', tagAr: '🌙 ٣. وجبة العشاء الخفيفة', item: plan.dinner, icon: '🌜' },
          { key: 'snack', tagAr: '🍎 ٤. السناك الصحي بين الوجبات', item: plan.snack, icon: '🥗' },
        ].map(({ key, tagAr, item, icon }) => (
          <article
            key={key}
            className="card"
            style={{
              borderRadius: '20px',
              border: '1.5px solid #cbd5e1',
              padding: '20px',
              background: '#ffffff',
              boxShadow: '0 6px 18px rgba(13, 31, 56, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                <strong style={{ color: '#0D1F38', fontSize: '1.15rem' }}>{tagAr}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
                  🔥 ~{item.caloriesApprox} سعر
                </span>
                <span style={{ background: '#ecfdf5', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, color: '#065f46' }}>
                  🍞 {item.carbsGrams} جم نشويات
                </span>
                <span style={{ background: '#f0fdf4', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, color: '#166534' }}>
                  🧂 ملح خفيف
                </span>
              </div>
            </div>

            <h3 style={{ margin: '0 0 8px', color: '#065f46', fontSize: '1.15rem', fontWeight: 900 }}>
              {item.nameAr}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: '#f0fdf4', borderRight: '4px solid #10b981', padding: '10px 14px', borderRadius: '10px' }}>
                <strong style={{ color: '#065f46', fontSize: '0.86rem', display: 'block', marginBottom: '3px' }}>
                  💡 الفائدة الصحية المباشرة:
                </strong>
                <span style={{ color: '#1e293b', fontSize: '0.88rem', lineHeight: 1.55 }}>
                  {item.benefitNoteAr}
                </span>
              </div>
              <div style={{ background: '#eff6ff', borderRight: '4px solid #3b82f6', padding: '10px 14px', borderRadius: '10px' }}>
                <strong style={{ color: '#1e40af', fontSize: '0.86rem', display: 'block', marginBottom: '3px' }}>
                  🛡️ سر الأمان لحالتك:
                </strong>
                <span style={{ color: '#1e293b', fontSize: '0.88rem', lineHeight: 1.55 }}>
                  {item.whySafeAr}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>
              📏 الكمية الموصى بها: <span style={{ color: '#0D1F38' }}>{item.portionAr}</span>
            </div>
          </article>
        ))}
      </section>

      {/* Allowed Heroes vs. Strictly Forbidden Table */}
      <section
        className="card"
        style={{
          borderRadius: '22px',
          border: '2px solid #cbd5e1',
          padding: '22px',
          marginBottom: '22px',
          background: '#ffffff',
        }}
      >
        <h2 style={{ margin: '0 0 14px', color: '#0D1F38', fontSize: '1.28rem', fontWeight: 900 }}>
          ⚖️ جدول «المسموح اللذيذ» مقابل «الممنوع الخطير» لـ {profile.titleAr}:
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {/* Allowed */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 10px', color: '#166534', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span> الأكلات الصديقة المفضلة (احرص عليها):
            </h3>
            <ul style={{ margin: 0, paddingRight: '20px', color: '#1e293b', lineHeight: 1.8, fontSize: '0.92rem', fontWeight: 700 }}>
              {profile.allowedHeroFoodsAr.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          {/* Forbidden */}
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '16px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 10px', color: '#991b1b', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⛔</span> الممنوعات التي ترفع الأرقام فجأة (تجنبها):
            </h3>
            <ul style={{ margin: 0, paddingRight: '20px', color: '#7f1d1d', lineHeight: 1.8, fontSize: '0.92rem', fontWeight: 700 }}>
              {profile.forbiddenFoodsAr.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Golden Rule Callout */}
        <div
          style={{
            marginTop: '16px',
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
            border: '1.5px solid #eab308',
            color: '#713f12',
            fontWeight: 800,
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}
        >
          🌟 <b>القاعدة الذهبية لأطباء التغذية:</b> {plan.goldenRuleAr}
        </div>
      </section>

      {/* Connected Clinics & Smart Assistant Bar */}
      <section
        className="card no-print"
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e3a5f 100%)',
          color: '#ffffff',
          padding: '22px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
              🤖 عايز تضبط وجبة معينة حسب أكلك النهاردة؟
            </h3>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              اسأل المساعد الذكي الصيدلاني فوراً عن أي وجبة مصرية (كشري، طعمية، محشي، سمك) وهيقولك إزاي تاكلها بأمان بدون ما تضر سكرك أو ضغطك!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/assistant"
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 900,
                borderRadius: '14px',
                textDecoration: 'none',
                padding: '10px 18px',
              }}
            >
              💬 اسأل المساعد عن وجبتك الآن ←
            </Link>
            <Link
              to="/food-drug-checker"
              className="btn"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: '14px',
                textDecoration: 'none',
                padding: '10px 16px',
              }}
            >
              ☕ فاحص الشاي والأكل مع الدواء
            </Link>
          </div>
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
