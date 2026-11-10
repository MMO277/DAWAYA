with open("HealthProfile.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Ensure SmartChoiceSelect is imported at the top
has_import = any("SmartChoiceSelect" in l for l in lines[:30])
new_lines = []
if not has_import:
    new_lines.append("import SmartChoiceSelect from './SmartChoiceSelect';\n")

# Find where "فصيلة الدم:" ends and where "<button type=\"submit\"" begins
start_replace = -1
end_replace = -1

for i, line in enumerate(lines):
    if "placeholder=\"A+, O+, B-...\"" in line:
        start_replace = i + 2  # right after the closing </div> of Blood Type
    if start_replace != -1 and '<button type="submit" className="btn"' in line:
        end_replace = i - 1  # right before </div> that closes form-row
        break

print("Replacing lines:", start_replace, "to", end_replace)

replacement_block = """              <div className="form-group">
                <label><b>{isAr ? 'النوع:' : 'Gender:'}</b></label>
                <SmartChoiceSelect
                  value={genderInput}
                  onChange={(val) => setGenderInput(val)}
                  placeholder={isAr ? '— اختر النوع —' : '— Select Gender —'}
                  modalTitle={isAr ? '👤 اختر النوع (الجنس)' : 'Select Gender'}
                  options={[
                    { value: 'male', icon: '👨', label: isAr ? 'ذكر' : 'Male', description: isAr ? 'حساب الجرعات القياسية للرجال' : 'Standard male clinical dosing' },
                    { value: 'female', icon: '👩', label: isAr ? 'أنثى' : 'Female', description: isAr ? 'تفعيل فحص أمان الأدوية مع الحمل والرضاعة' : 'Enables pregnancy & lactation safety checks' },
                  ]}
                />
              </div>

              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكلى:' : 'Renal Function:'}</b></label>
                <SmartChoiceSelect
                  value={profile.renalStatus || 'unknown'}
                  onChange={(val) =>
                    setProfile((prev) => ({
                      ...prev,
                      renalStatus: val as 'normal' | 'impaired' | 'unknown',
                    }))
                  }
                  modalTitle={isAr ? '🫘 حالة كفاءة وظائف الكلى' : 'Renal Function Status'}
                  modalSubtitle={isAr ? 'يستخدمها الذكاء الاصطناعي لتعديل جرعات الأدوية التي تفرز عبر الكلى' : 'Used to adjust renally cleared medications'}
                  options={[
                    { value: 'normal', icon: '✅', label: isAr ? 'طبيعية (Normal)' : 'Normal', description: isAr ? 'وظائف الكلى سليمة ولا تحتاج لتخفيض الجرعات' : 'Normal kidney clearance', badge: isAr ? 'جرعة قياسية آمنة' : 'Standard dose' },
                    { value: 'impaired', icon: '⚠️', label: isAr ? 'قصور كلوي يحتاج تعديل جرعة' : 'Impaired (Dose Adjustment)', description: isAr ? 'تنبيه إلزامي لتقليل جرعات المضادات الحيوية والمسكنات الكلوية' : 'Requires renal dose adjustment', badge: isAr ? '🚨 حماية الكلى مفعلة' : 'Renal guard active' },
                    { value: 'unknown', icon: '❓', label: isAr ? 'غير محدد' : 'Unknown', description: isAr ? 'لم يتم إجراء تحليل كرياتينين مؤخراً' : 'No recent lab test' },
                  ]}
                />
              </div>

              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكبد:' : 'Hepatic Function:'}</b></label>
                <SmartChoiceSelect
                  value={profile.hepaticStatus || 'unknown'}
                  onChange={(val) =>
                    setProfile((prev) => ({
                      ...prev,
                      hepaticStatus: val as 'normal' | 'impaired' | 'unknown',
                    }))
                  }
                  modalTitle={isAr ? '🛡️ حالة كفاءة وظائف الكبد' : 'Hepatic Function Status'}
                  modalSubtitle={isAr ? 'لحمايتك من الأدوية التي تسبب إجهاداً أو سمية لخلايا الكبد' : 'Screens for hepatotoxic medications'}
                  options={[
                    { value: 'normal', icon: '✅', label: isAr ? 'طبيعية (Normal)' : 'Normal', description: isAr ? 'إنزيمات ووظائف الكبد طبيعية' : 'Normal liver enzymes', badge: isAr ? 'تمثيل دوائي سليم' : 'Normal metabolism' },
                    { value: 'impaired', icon: '⚠️', label: isAr ? 'قصور كبدي' : 'Impaired Hepatic Function', description: isAr ? 'تحذير فوري من الجرعات العالية للباراسيتامول والأدوية الكبدية' : 'Alerts on hepatotoxic drugs', badge: isAr ? '🚨 حماية الكبد مفعلة' : 'Liver guard active' },
                    { value: 'unknown', icon: '❓', label: isAr ? 'غير محدد' : 'Unknown', description: isAr ? 'لم يتم إجراء فحص وظائف كبد مؤخراً' : 'Not tested recently' },
                  ]}
                />
              </div>

              <div className="form-group form-group-full">
                <label><b>{isAr ? 'رقم هاتف الطوارئ:' : 'Emergency Contact:'}</b></label>
                <input value={contactInput} onChange={(e) => setContactInput(e.target.value)} placeholder="01xxxxxxxxx" />
              </div>

              <div
                className="form-group form-group-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 95, 70, 0.12) 100%)',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '2px solid #10b981',
                  marginTop: '6px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#059669' }}>
                  <span style={{ fontSize: '1.3rem' }}>🚗⚙️</span>
                  <strong style={{ fontSize: '0.98rem' }}>
                    {isAr
                      ? 'المهنة وطبيعة العمل (ذكاء فحص أمان الدواء مع السواقة والتركيز والماكينات):'
                      : 'Occupation & Daily Work Safety Category:'}
                  </strong>
                </label>

                <SmartChoiceSelect
                  value={occupationInput}
                  onChange={(val) => setOccupationInput(val)}
                  modalTitle={isAr ? '🚗⚙️ اختر مهنتك لتأمين دوائك' : 'Select Your Occupation'}
                  modalSubtitle={isAr ? 'يقوم الذكاء الاصطناعي بفحص أي دواء تبحث عنه ضد النعاس والدوخة وحساسية الصدر المهنية' : 'AI automatically screens your medications against workplace hazards'}
                  options={[
                    {
                      value: 'driver_transport',
                      icon: '🚗',
                      label: isAr ? 'سائق طريق ومواصلات' : 'Driver & Transport',
                      description: isAr ? 'سيارة، تاكسي، نقل ثقيل، سفر دائم — تحذير إلزامي من النعاس والدوخة' : 'Alert for drowsiness and blurred vision',
                      badge: isAr ? '🚨 فحص حرج للنعاس والدوخة' : 'Critical Drowsiness Check',
                    },
                    {
                      value: 'machinery_factory',
                      icon: '⚙️',
                      label: isAr ? 'عامل مصنع وماكينات' : 'Factory & Machinery Operator',
                      description: isAr ? 'تشغيل آلات حادة، غبار، بودرة، كيماويات — فحص سرعة الاستجابة وحماية الصدر' : 'Alert for reaction speed and respiratory dust hazards',
                      badge: isAr ? '🏭 فحص أمان الصدر والماكينات' : 'Lung & Machinery Guard',
                    },
                    {
                      value: 'office_desk',
                      icon: '💻',
                      label: isAr ? 'عمل مكتبي أو إداري' : 'Office & Desk Job',
                      description: isAr ? 'كمبيوتر، شاشات، أعمال إدارية وهندسية ومحاسبية' : 'Computer and administrative work',
                      badge: isAr ? '🧠 فحص الإجهاد الذهني' : 'Mental Focus Check',
                    },
                    {
                      value: 'student',
                      icon: '🎓',
                      label: isAr ? 'طالب / دراسة وامتحانات' : 'Student & Academics',
                      description: isAr ? 'مذاكرة، مدرسة، جامعة — فحص تأثير الدواء على التركيز والذاكرة والاستيعاب' : 'Alert for memory and cognitive focus',
                      badge: isAr ? '📚 فحص التركيز والذاكرة' : 'Cognitive Alertness',
                    },
                    {
                      value: 'homemaker',
                      icon: '🏡',
                      label: isAr ? 'ربت منزل / رعاية أسرية' : 'Homemaker & Caregiver',
                      description: isAr ? 'رعاية أطفال وأعمال منزلية ومجهود يومي مستمر' : 'Child care and daily household tasks',
                      badge: isAr ? '🛡️ أمان التفاعل الأسري' : 'Family Care Safety',
                    },
                    {
                      value: 'general',
                      icon: '🩺',
                      label: isAr ? 'فحص عام اعتيادي' : 'General Health',
                      description: isAr ? 'رعاية صحية دورية دون متطلبات مهنية خاصة' : 'Standard clinical safety checks',
                      badge: isAr ? '✅ فحص سريري قياسي' : 'Standard Check',
                    },
                    {
                      value: 'other',
                      icon: '✍️',
                      label: isAr ? 'غير ذلك (مهنة خاصة)' : 'Other Occupation',
                      description: isAr ? 'اكتب اسم وظيفتك وطبيعة عملك بنفسك لتخصيص الفحص' : 'Type your custom occupation title',
                      badge: isAr ? '✨ تخصيص مهني كامل' : 'Custom Occupation',
                    },
                  ]}
                />

                {/* Sub-Panel: When "عامل مصنع وماكينات" is selected */}
                {occupationInput === 'machinery_factory' && (
                  <div
                    style={{
                      background: 'rgba(2, 132, 199, 0.12)',
                      borderRadius: '14px',
                      border: '1.5px solid #0284c7',
                      padding: '12px 14px',
                      marginTop: '10px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 800, fontSize: '0.9rem', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏭</span>
                      <span>
                        {isAr
                          ? 'طبيعة بيئة المصنع والمواد التي تتعرض لها (لحماية الصدر والرئتين):'
                          : 'Factory Environment & Airborne Exposure (Lung Safety):'}
                      </span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {[
                        { id: 'dust_powder', icon: '💨', labelAr: 'أتربة وغبار وبودرة (أسمنت، جبس، سيراميك)' },
                        { id: 'chemicals_fumes', icon: '🧪', labelAr: 'كيماويات وأبخرة ومذيبات' },
                        { id: 'textile_cotton', icon: '🧵', labelAr: 'غزل ونسيج وألياف قطن' },
                        { id: 'paints_solvents', icon: '🎨', labelAr: 'دهانات ورش دوكو وصبغات' },
                        { id: 'sharp_machinery', icon: '🔨', labelAr: 'ماكينات حادة وضوضاء ثقيلة' },
                      ].map((item) => {
                        const isChecked = factoryHazardsInput.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setFactoryHazardsInput((prev) => prev.filter((x) => x !== item.id));
                              } else {
                                setFactoryHazardsInput((prev) => [...prev, item.id]);
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: isChecked ? '1.5px solid #0284c7' : '1px solid #94a3b8',
                              background: isChecked ? '#0284c7' : 'var(--card-bg, #ffffff)',
                              color: isChecked ? '#ffffff' : 'var(--ink, #0D1F38)',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>{item.icon}</span>
                            <span>{item.labelAr}</span>
                            {isChecked && <span>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      rows={2}
                      value={workEnvironmentNotesInput}
                      onChange={(e) => setWorkEnvironmentNotesInput(e.target.value)}
                      placeholder={
                        isAr
                          ? 'تفاصيل إضافية عن بيئة العمل (مثلاً: مصنع سيراميك وفيه بودرة وأتربة دايماً)...'
                          : 'Additional workplace environment details...'
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                )}

                {/* Sub-Panel: When "غير ذلك (وظيفة أخرى)" is selected */}
                {occupationInput === 'other' && (
                  <div
                    style={{
                      background: 'rgba(139, 92, 246, 0.12)',
                      borderRadius: '14px',
                      border: '1.5px solid #8b5cf6',
                      padding: '12px 14px',
                      marginTop: '10px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 800, fontSize: '0.9rem', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>✍️</span>
                      <span>
                        {isAr ? 'اكتب اسم وظيفتك وطبيعة عملك بالتفصيل:' : 'Type Your Custom Occupation Title:'}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={customOccupationInput}
                      onChange={(e) => setCustomOccupationInput(e.target.value)}
                      placeholder={
                        isAr
                          ? 'مثال: طيار مدني، غطاس بحري، نجار مسلح، شيف مطبخ ساخن، كهربائي ضغط عالي...'
                          : 'e.g. Airline pilot, Deep sea diver, Construction worker, Chef...'
                      }
                    />
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '8px', fontWeight: 700 }}>
                  💡 {isAr
                    ? 'اضغط على الخانة أعلاه لتفتح لك نافذة اختيار المهنة بالكروت التفاعلية!'
                    : 'Tap the field above to open the interactive occupation choice cards!'}
                </div>
              </div>
"""

new_lines.extend(lines[:start_replace])
new_lines.append(replacement_block)
new_lines.extend(lines[end_replace:])

with open("HealthProfile.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Successfully updated HealthProfile.tsx with SmartChoiceSelect!")
