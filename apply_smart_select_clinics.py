# 1. WomensHealthClinic.tsx
with open("WomensHealthClinic.tsx", "r", encoding="utf-8") as f:
    w_lines = f.readlines()

has_imp = any("SmartChoiceSelect" in l for l in w_lines[:20])
w_new = []
if not has_imp:
    w_new.append("import SmartChoiceSelect from './SmartChoiceSelect';\n")

skip = False
for i, line in enumerate(w_lines):
    if "💊 المساعد التفاعلي الفوري: «نسيت آخذ حبة منع الحمل، أتصرف إزاي؟»" in line:
        w_new.append(line)
        w_new.append("          </h2>\n")
        w_new.append("""          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>١. ما هو نوع شريط منع الحمل الذي تستخدمينه؟</label>
              <SmartChoiceSelect
                value={pillType}
                onChange={(val) => setPillType(val as any)}
                modalTitle="💊 نوع شريط منع الحمل"
                modalSubtitle="اختاري نوع الأقراص لتحديد بروتوكول التصرف الصحيح"
                options={[
                  { value: 'combined', icon: '🌸', label: 'أقراص مركبة عادية', description: 'ياسمين، جينيرا، مارفيلون، سيلست (تحتوي على هرمونين)', badge: 'الأكثر شيوعاً' },
                  { value: 'mini_lactation', icon: '🍼', label: 'أقراص الرضاعة الأحادية', description: 'سيرازيت، ميكرولوت، لاكتينور (تتطلب دقة صارمة في الميعاد)', badge: 'آمنة مع الرضاعة' },
                ]}
              />
            </div>

            <div>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '6px' }}>٢. كم ساعة مرت على ميعاد الحبة المنسية؟</label>
              <SmartChoiceSelect
                value={hoursLate}
                onChange={(val) => setHoursLate(val as any)}
                modalTitle="⏰ مدة تأخر الحبة المنسية"
                modalSubtitle="حددي عدد الساعات التي مرت منذ الموعد المعتاد للحبة"
                options={[
                  { value: 'under_12', icon: '⚡', label: 'أقل من 12 ساعة (تذكرت في نفس اليوم)', description: 'تأخير بسيط في نفس اليوم', badge: 'أمان عالٍ' },
                  { value: '12_to_24', icon: '⏳', label: 'بين 12 إلى 24 ساعة (حبة واحدة منسية)', description: 'مرت أكثر من 12 ساعة على حبة واحدة فقط', badge: 'انتباه مطلوب' },
                  { value: 'over_24_two_pills', icon: '🚨', label: 'أكثر من 24 - 48 ساعة (نسيت حبتين أو أكثر)', description: 'نسيان يومين متتاليين أو أكثر من الشريط', badge: 'تحذير هام' },
                ]}
              />
            </div>
          </div>
""")
        skip = True
    elif skip:
        if "<div style={{ background: missedPillAction.bg" in line:
            skip = False
            w_new.append(line)
    else:
        w_new.append(line)

with open("WomensHealthClinic.tsx", "w", encoding="utf-8") as f:
    f.writelines(w_new)
print("1. Updated WomensHealthClinic.tsx with SmartChoiceSelect")

# 2. UrologyRenalClinic.tsx
with open("UrologyRenalClinic.tsx", "r", encoding="utf-8") as f:
    u_lines = f.readlines()

u_new = []
if not any("SmartChoiceSelect" in l for l in u_lines[:20]):
    u_new.append("import SmartChoiceSelect from './SmartChoiceSelect';\n")

skip_u = False
for i, line in enumerate(u_lines):
    if '<label className="small" style={{ fontWeight: 700, display: \'block\', marginBottom: \'6px\' }}>النوع:</label>' in line or '<label className="small" style={{ fontWeight: 700, display: \'block\', marginBottom: \'4px\' }}>النوع:</label>' in line:
        u_new.append("              <label className=\"small\" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>النوع:</label>\n")
        u_new.append("""              <SmartChoiceSelect
                value={sex}
                onChange={(val) => setSex(val as any)}
                modalTitle="👤 اختر النوع لحساب كفاءة الكلى"
                options={[
                  { value: 'male', icon: '👨', label: 'ذكر (Male)', description: 'معامل Cockcroft-Gault القياسي للرجال (1.0)' },
                  { value: 'female', icon: '👩', label: 'أنثى (Female)', description: 'معامل الكتلة العضلية للسيدات (× 0.85)' },
                ]}
              />
            </div>
          </div>
""")
        skip_u = True
    elif skip_u:
        if "<div style={{ background: 'var(--tint)'" in line:
            skip_u = False
            u_new.append(line)
    else:
        u_new.append(line)

with open("UrologyRenalClinic.tsx", "w", encoding="utf-8") as f:
    f.writelines(u_new)
print("2. Updated UrologyRenalClinic.tsx with SmartChoiceSelect")

# 3. ClinicalNutritionClinic.tsx
with open("ClinicalNutritionClinic.tsx", "r", encoding="utf-8") as f:
    c_lines = f.readlines()

c_new = []
if not any("SmartChoiceSelect" in l for l in c_lines[:20]):
    c_new.append("import SmartChoiceSelect from './SmartChoiceSelect';\n")

skip_c = False
for i, line in enumerate(c_lines):
    if "العمر (سنة):" in line:
        c_new.append(line)
        c_new.append(c_lines[i+1])  # input
        c_new.append(c_lines[i+2])  # </div>
        c_new.append("""            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>النوع:</label>
              <SmartChoiceSelect
                value={gender}
                onChange={(val) => setGender(val as any)}
                modalTitle="👤 اختر النوع لحساب السعرات"
                options={[
                  { value: 'male', icon: '👨', label: 'ذكر', description: 'معدل الحرق الأساسي للرجال' },
                  { value: 'female', icon: '👩', label: 'أنثى', description: 'معدل الحرق الأساسي للسيدات' },
                ]}
              />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>مستوى النشاط اليومي:</label>
              <SmartChoiceSelect
                value={activity}
                onChange={(val) => setActivity(val)}
                modalTitle="🏃‍♂️ مستوى النشاط البدني اليومي"
                options={[
                  { value: '1.2', icon: '💻', label: 'قليل الحركة (عمل مكتبي)', description: 'جلوس معظم اليوم بدون تمارين رياضية' },
                  { value: '1.375', icon: '🚶‍♂️', label: 'نشاط خفيف (مشي 3 أيام/أسبوع)', description: 'حركة يومية معتدلة أو مشي خفيف' },
                  { value: '1.55', icon: '🏋️‍♂️', label: 'نشاط متوسط أو عالٍ (رياضة 4-5 أيام)', description: 'مجهود بدني منتظم أو عمل ميداني' },
                ]}
              />
            </div>
          </div>
""")
        skip_c = True
    elif skip_c:
        if "سعرات ثبات الوزن (TDEE):" in line:
            skip_c = False
            # Add back the two preceding divs
            c_new.append("          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>\n")
            c_new.append("            <div style={{ background: 'var(--tint)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>\n")
            c_new.append(line)
    else:
        c_new.append(line)

with open("ClinicalNutritionClinic.tsx", "w", encoding="utf-8") as f:
    f.writelines(c_new)
print("3. Updated ClinicalNutritionClinic.tsx with SmartChoiceSelect")

