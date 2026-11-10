# 1. SteroidTaperingCalendar.tsx
with open("SteroidTaperingCalendar.tsx", "r", encoding="utf-8") as f:
    s_lines = f.readlines()

s_new = []
if not any("SmartChoiceSelect" in l for l in s_lines[:20]):
    s_new.append("import SmartChoiceSelect from './SmartChoiceSelect';\n")

skip_s = False
for i, line in enumerate(s_lines):
    if "الجرعة الابتدائية الحالية (مجم/يوم):" in line:
        s_new.append(line)
        s_new.append("            </label>\n")
        s_new.append("""            <SmartChoiceSelect
              value={String(startingDoseMg)}
              onChange={(val) => setStartingDoseMg(Number(val))}
              modalTitle="💉 الجرعة الابتدائية الحالية (مجم/يوم)"
              options={[60, 40, 30, 20, 15, 10].map((d) => ({
                value: String(d),
                icon: '💊',
                label: `${d} مجم يومياً`,
                description: `بدء جدول السحب التدريجي من جرعة ${d} مجم`,
              }))}
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, color: '#CFD29D', display: 'block', marginBottom: '4px' }}>
              💊 {isAr ? 'تركيز القرص الذي اشتريته من الصيدلية:' : 'Your Tablet Strength:'}
            </label>
            <SmartChoiceSelect
              value={String(tabletStrengthMg)}
              onChange={(val) => setTabletStrengthMg(Number(val))}
              modalTitle="💊 تركيز القرص المستخدم"
              options={[
                { value: '20', icon: '💊', label: 'قرص 20 مجم (سولوبريد 20)', description: 'أقراص سولوبريد 20 مجم سريعة الذوبان' },
                { value: '5', icon: '💊', label: 'قرص 5 مجم (بريدسول / هوستيكورتين)', description: 'أقراص تركيز 5 مجم للتدرج الدقيق' },
              ]}
            />
          </div>
        </div>
      </section>
""")
        skip_s = True
    elif skip_s:
        if "{/* Tapering Steps Cards */}" in line:
            skip_s = False
            s_new.append("\n")
            s_new.append(line)
    else:
        s_new.append(line)

with open("SteroidTaperingCalendar.tsx", "w", encoding="utf-8") as f:
    f.writelines(s_new)
print("1. Updated SteroidTaperingCalendar.tsx with SmartChoiceSelect")

# 2. HealthProfile.tsx Allergy & Med Modals
with open("HealthProfile.tsx", "r", encoding="utf-8") as f:
    hp_code = f.read()

# Replace Allergen Family select
old_all_fam = """                <select value={allergenKey} onChange={(e) => setAllergenKey(e.target.value)}>
                  {ALLERGEN_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {pick(c.name, lang)} ({pick(c.examples, lang)})
                    </option>
                  ))}
                </select>"""

new_all_fam = """                <SmartChoiceSelect
                  value={allergenKey}
                  onChange={(val) => setAllergenKey(val)}
                  modalTitle={isAr ? '🛡️ اختر العائلة الدوائية المسببة للحساسية' : 'Select Allergen Family'}
                  options={ALLERGEN_CATEGORIES.map((c) => ({
                    value: c.id,
                    icon: '💊',
                    label: pick(c.name, lang),
                    description: pick(c.examples, lang),
                  }))}
                />"""

if old_all_fam in hp_code:
    hp_code = hp_code.replace(old_all_fam, new_all_fam, 1)
    print("2a. Updated Allergen Family in HealthProfile.tsx")

# Replace Evidence Status select
old_ev = """                  <select value={evidence} onChange={(e) => setEvidence(e.target.value as EvidenceStatus)}>
                    <option value="patient_reported">{isAr ? 'أبلغ عنها المريض' : 'Patient-Reported'}</option>
                    <option value="clinically_verified">{isAr ? 'مؤكدة سريرياً باختبار جلد' : 'Clinically Verified'}</option>
                    <option value="suspected">{isAr ? 'مشتبه بها فقط' : 'Suspected'}</option>
                  </select>"""

new_ev = """                  <SmartChoiceSelect
                    value={evidence}
                    onChange={(val) => setEvidence(val as EvidenceStatus)}
                    modalTitle={isAr ? '📋 حالة توثيق الحساسية' : 'Evidence Status'}
                    options={[
                      { value: 'patient_reported', icon: '🗣️', label: isAr ? 'أبلغ عنها المريض' : 'Patient-Reported', description: isAr ? 'ظهرت أعراض سابقة عند تناول الدواء' : 'Previous reaction reported' },
                      { value: 'clinically_verified', icon: '🔬', label: isAr ? 'مؤكدة سريرياً باختبار جلد' : 'Clinically Verified', description: isAr ? 'مثبتة باختبار حساسية أو تقرير طبي' : 'Verified by skin test' },
                      { value: 'suspected', icon: '❓', label: isAr ? 'مشتبه بها فقط' : 'Suspected', description: isAr ? 'أعراض غير مؤكدة وتحتاج حذر' : 'Uncertain reaction' },
                    ]}
                  />"""

if old_ev in hp_code:
    hp_code = hp_code.replace(old_ev, new_ev, 1)
    print("2b. Updated Evidence Status in HealthProfile.tsx")

with open("HealthProfile.tsx", "w", encoding="utf-8") as f:
    f.write(hp_code)

