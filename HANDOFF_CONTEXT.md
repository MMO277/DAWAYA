# DAWAYA (دوايا) — Project Handoff & Continuity Brief

> **كيف تكمل العمل مع Gemini على حساب جديد بنفس السياق:**
> ارفع ملف `dawaya.zip` + هذا الملف `HANDOFF_CONTEXT.md` في المحادثة الجديدة وقل له:
> *"أنت بتكمل شغلنا على منصة دوايا من ملف dawaya.zip وملف HANDOFF_CONTEXT.md، احترم كل المميزات القديمة وما تبوظش أي حاجة شغالة واكلمني بالمصري (يا باشا)."*

## 1. هوية المشروع والروابط الرسمية
- **اسم المنصة:** دوايا | DAWAYA (`com.dawaya.health`)
- **المطور / المالك:** مصطفى محمود (طالب تمريض — مصر، الدقهلية)
- **المستودع على GitHub:** `https://github.com/MMO277/DAWAYA`
- **رابط الموقع السريع على Cloudflare Pages:** `https://dawaya.pages.dev`
- **الكود المصدري الكامل:** مرفق في `dawaya.zip` (مبني بـ React + TypeScript + Vite + Firebase + Capacitor Android).

## 2. إعدادات الأندرويد و Firebase الثابتة (ممنوع تغييرها!)
- **الـ Keystore الدائم في `.github/workflows/build-apk.yml`:**
  - `SHA-1`: `05:8F:CA:48:3C:FF:28:A9:B6:28:6B:95:CC:D1:32:8F:7D:CC:82:5F`
  - `SHA-256`: `B7:32:38:AD:34:CB:8E:D3:FE:6B:5E:44:D0:D5:90:06:DC:A3:ED:72:11:78:71:4B:39:67:AA:A4:37:50:F3:23`
  - مسجل في Firebase Console لتشغيل تسجيل الدخول بجوجل (1-Tap Google Sign-In) داخل تطبيق الأندرويد.
- **ربط التطبيق بالسيرفر:** `LIVE_OTA_URL = "https://dawaya.pages.dev/"`
- **أذونات الأندرويد المفعلة:** `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `ACCESS_FINE_LOCATION`, `READ_MEDIA_IMAGES`, `POST_NOTIFICATIONS`, Native Android Speech Recognizer & Arabic TTS.

## 3. المميزات المكتملة والشغالة 100% (لا تُعدل إلا بطلب صريح)
1. **قاعدة الأدوية الضخمة وسرعة 0 ثانية:** `26,572+` دواء في `public/data/dawaya_medicines_search_index.json` مخزنة ومفروزة مسبقاً في `IndexedDB` (`dawayaDrugDatabaseService.ts`) + تحميل مسبق لصفحات `App.tsx`.
2. **تسعير الروشتة بالكامل + البدائل المصرية الأرخص:** عند رفع صورة الروشتة (`aiDocumentProcessor.ts`) يتم استخراج الأصناف، تسعيرها بالجنيه، جلب أرخص بديل مصري مطابق 100%، وحساب صافي التوفير.
3. **المساعد الذكي والمكالمة الصوتية (`VoiceDoctorCallModal.tsx`, `aiConversationContext.ts`):** تشخيص الأعراض بالعامية المصرية (`evaluateComprehensiveSymptomAndClinicTriage`) وتوجيه المريض للعيادة المختصة مع أزرار انتقال مباشرة وتنقية النص من علامات `**`.
4. **أطلس مصر الكامل (3 مستويات):** `27` محافظة ← `88` مركز وقسم ← `1,249` قرية وحي (`partnerTypes.ts`)، محفوظة في Firebase Firestore (`allergyData.ts`) ومربوطة تلقائياً عبر `HealthProfile.tsx`, `PartnersDirectory.tsx`, `FindMedicationPanel.tsx`.
5. **نطاق توصيل الصيدليات للقرى المجاورة:** تسجيل وتصفية الفروع حسب القرى المغطاة بالتوصيل (`PharmacyOwnerDashboard.tsx`, `PartnerBranchAndCategoryModals.tsx`, `partnerService.ts`).
6. **الابتكارات المصرية والأمان:** درع السائقين وتحليل المخدرات، مخفّض فاتورة الصيدلية، عداد صلاحية الدواء بعد الفتح، توقيت الشاي والأكل، حارس خلط الحقن، قارئ الشرائط المقطوعة بالكاميرا، والاختبار الآمن عبر `node scripts/securityAndIntegrityTestSuite.mjs`.

## 4. قواعد العمل المتفق عليها مع مصطفى
- أسلوب الكلام: مصري ودود ومباشر ("يا باشا") بدون حشو.
- الحفاظ التام على كل ما يعمل مسبقاً وعدم إفساد القديم عند إضافة ميزة جديدة.
- تشغيل `node scripts/securityAndIntegrityTestSuite.mjs` والتأكد من `10 passed, 0 failed` قبل تسليم `dawaya.zip`.
- طريقة التسليم: ملف `dawaya.zip` جاهز لرفعه مباشرة على GitHub (مع الحفاظ على الـ Keystore وإعدادات الأندرويد).
