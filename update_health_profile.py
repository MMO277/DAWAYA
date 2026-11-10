with open("HealthProfile.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip_select = False
skip_display = False

for i, line in enumerate(lines):
    if "background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'" in line:
        # replace from the preceding <div className="form-group form-group-full"
        # We need to drop the last added line if it was <div className="form-group form-group-full"
        if new_lines and '<div' in new_lines[-1] and 'form-group-full' in new_lines[-1]:
            new_lines.pop()
        
        new_lines.append("""              <div
                className="form-group form-group-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 95, 70, 0.12) 100%)',
                  padding: '16px 18px',
                  borderRadius: '18px',
                  border: '2px solid #10b981',
                  marginTop: '10px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: '#10b981' }}>
                    <span style={{ fontSize: '1.4rem' }}>🚗⚙️</span>
                    <strong style={{ fontSize: '1.05rem', color: '#10b981' }}>
                      {isAr
                        ? 'المهنة وطبيعة العمل (ذكاء فحص أمان الدواء واليقظة وحماية الصدر):'
                        : 'Occupation & Daily Work Safety Category:'}
                    </strong>
                  </label>
                  <p className="small" style={{ margin: 0, opacity: 0.85 }}>
                    {isAr
                      ? 'اختر طبيعة عملك بكروت تفاعلية؛ ليفحص الذكاء الاصطناعي أي دواء تبحث عنه تلقائياً ويحميك من الدوخة وحساسية الصدر المهنية:'
                      : 'Tap to select your occupation. DAWAYA AI will automatically screen all your medications against occupational hazards:'}
                  </p>
                </div>

                {/* Interactive Choice Cards Grid matching Design 1 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                    gap: '10px',
                    marginBottom: '14px',
                  }}
                >
                  {[
                    {
                      id: 'driver_transport',
                      icon: '🚗',
                      titleAr: 'سائق طريق ومواصلات',
                      titleEn: 'Driver & Transport',
                      descAr: 'سيارة، تاكسي، نقل، حافلات، سفر دائم',
                      badgeAr: '🚨 فحص حرج للنعاس والدوخة',
                    },
                    {
                      id: 'machinery_factory',
                      icon: '⚙️',
                      titleAr: 'عامل مصنع وماكينات',
                      titleEn: 'Factory & Machinery',
                      descAr: 'تشغيل آلات حادة، غبار، بودرة، كيماويات',
                      badgeAr: '🏭 فحص أمان الصدر والرئتين',
                    },
                    {
                      id: 'office_desk',
                      icon: '💻',
                      titleAr: 'عمل مكتبي أو إداري',
                      titleEn: 'Office & Desk Job',
                      descAr: 'كمبيوتر، شاشات، أعمال إدارية وهندسية',
                      badgeAr: '🧠 فحص الإجهاد الذهني',
                    },
                    {
                      id: 'student',
                      icon: '🎓',
                      titleAr: 'طالب / دراسة وامتحانات',
                      titleEn: 'Student & Academics',
                      descAr: 'مذاكرة، مدرسة، جامعة، امتحانات مكثفة',
                      badgeAr: '📚 فحص التركيز والذاكرة',
                    },
                    {
                      id: 'homemaker',
                      icon: '🏡',
                      titleAr: 'ربت منزل / رعاية أسرية',
                      titleEn: 'Homemaker & Caregiver',
                      descAr: 'رعاية أطفال، أعمال منزلية، مجهود يومي',
                      badgeAr: '🛡️ أمان التفاعل الأسري',
                    },
                    {
                      id: 'general',
                      icon: '🩺',
                      titleAr: 'فحص عام اعتيادي',
                      titleEn: 'General Health',
                      descAr: 'رعاية صحية دورية دون متطلبات مهنية خاصة',
                      badgeAr: '✅ فحص سريري قياسي',
                    },
                    {
                      id: 'other',
                      icon: '✍️',
                      titleAr: 'غير ذلك (مهنة خاصة)',
                      titleEn: 'Other Occupation',
                      descAr: 'اكتب اسم وظيفتك وطبيعة عملك بنفسك',
                      badgeAr: '✨ تخصيص مهني كامل',
                    },
                  ].map((card) => {
                    const isSelected = occupationInput === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setOccupationInput(card.id)}
                        style={{
                          textAlign: 'start',
                          padding: '12px 14px',
                          borderRadius: '14px',
                          border: isSelected ? '2.5px solid #10b981' : '1.5px solid rgba(255, 255, 255, 0.22)',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(6, 95, 70, 0.45) 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '6px',
                          transition: 'all 0.18s ease',
                          boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontSize: '1.75rem' }}>{card.icon}</span>
                          {isSelected ? (
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: '#10b981',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 900,
                              }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                                display: 'inline-block',
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <b style={{ fontSize: '0.94rem', display: 'block', color: isSelected ? '#10b981' : '#f8fafc', marginBottom: '2px' }}>
                            {isAr ? card.titleAr : card.titleEn}
                          </b>
                          <span style={{ fontSize: '0.76rem', color: isSelected ? '#e2e8f0' : '#94a3b8', lineHeight: 1.35, display: 'block' }}>
                            {card.descAr}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: isSelected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                            color: isSelected ? '#34d399' : '#cbd5e1',
                            alignSelf: 'flex-start',
                            marginTop: '4px',
                          }}
                        >
                          {card.badgeAr}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Panel: When "عامل مصنع وماكينات" is selected */}
                {occupationInput === 'machinery_factory' && (
                  <div
                    style={{
                      background: 'rgba(2, 132, 199, 0.16)',
                      borderRadius: '14px',
                      border: '1.5px solid #0284c7',
                      padding: '14px 16px',
                      marginBottom: '12px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '0.92rem', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>🏭</span>
                      <span>
                        {isAr
                          ? 'طبيعة بيئة المصنع والمواد التي تتعرض لها (لحماية الصدر والرئتين):'
                          : 'Factory Environment & Airborne Exposure (Lung Safety):'}
                      </span>
                    </label>
                    <p style={{ fontSize: '0.8rem', color: '#bae6fd', margin: '0 0 10px', lineHeight: 1.4 }}>
                      {isAr
                        ? 'اختر المواد التي تتعرض لها داخل المصنع ليقوم الذكاء الاصطناعي بتحذيرك من أي دواء يسبب ضيق تنفس أو ربو مهني:'
                        : 'Select materials you are exposed to so AI flags bronchospasm or respiratory-risk drugs:'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {[
                        { id: 'dust_powder', icon: '💨', labelAr: 'أتربة وغبار وبودرة (أسمنت، جبس، سيراميك)' },
                        { id: 'chemicals_fumes', icon: '🧪', labelAr: 'كيماويات وأبخرة ومذيبات عضوية' },
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
                              border: isChecked ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.25)',
                              background: isChecked ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                              color: '#ffffff',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
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
                          ? 'تفاصيل إضافية عن بيئة العمل (مثلاً: مصنع سيراميك وفيه بودرة وأتربة دايماً، أو مصنع كيماويات)...'
                          : 'Additional workplace environment details...'
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '0.86rem',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        background: 'rgba(0, 0, 0, 0.25)',
                        color: '#ffffff',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Sub-Panel: When "غير ذلك (وظيفة أخرى)" is selected */}
                {occupationInput === 'other' && (
                  <div
                    style={{
                      background: 'rgba(139, 92, 246, 0.16)',
                      borderRadius: '14px',
                      border: '1.5px solid #8b5cf6',
                      padding: '14px 16px',
                      marginBottom: '12px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c4b5fd', fontWeight: 800, fontSize: '0.92rem', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.25rem' }}>✍️</span>
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
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        border: '1.5px solid #8b5cf6',
                        background: 'rgba(0, 0, 0, 0.25)',
                        color: '#ffffff',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <div style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💡</span>
                  <span>
                    {isAr
                      ? 'سيقوم الذكاء الاصطناعي وطبيب المكالمة الصوتية بفحص أدويتك لحظياً ضد متطلبات وظيفتك وحماية صدرك من التفاعلات المهنية!'
                      : 'DAWAYA AI & Voice Doctor will automatically screen your medications against your occupation and lung safety!'}
                  </span>
                </div>
              </div>
""")
        skip_select = True
    elif skip_select:
        if '<button type="submit" className="btn"' in line:
            skip_select = False
            new_lines.append(line)
    elif "<b style={{ color: '#065f46' }}>🚗⚙️" in line or "<b style={{ color: '#065f46' }}>🚗" in line:
        # replace the display row
        # pop the preceding <div className="profile-detail-full"
        if new_lines and 'profile-detail-full' in new_lines[-1]:
            new_lines.pop()
        new_lines.append("""            <div className="profile-detail-full" style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <b style={{ color: '#065f46' }}>🚗⚙️ {isAr ? 'المهنة وطبيعة العمل:' : 'Occupation:'}</b>{' '}
                  <strong style={{ color: '#0D1F38' }}>
                    {profile.occupation === 'driver_transport'
                      ? (isAr ? '🚗 سائق (فحص أمان السواقة والنعاس مفعل)' : 'Driver (Driving & Drowsiness Guard Active)')
                      : profile.occupation === 'machinery_factory'
                      ? (isAr ? '⚙️ عامل مصنع وماكينات (فحص الصدر والتركيز مفعل)' : 'Machinery Operator')
                      : profile.occupation === 'office_desk'
                      ? (isAr ? '💻 عمل مكتبي وإداري' : 'Office Desk')
                      : profile.occupation === 'student'
                      ? (isAr ? '🎓 طالب / دراسة وامتحانات' : 'Student')
                      : profile.occupation === 'homemaker'
                      ? (isAr ? '🏡 ربت منزل / رعاية أسرية' : 'Homemaker')
                      : profile.occupation === 'other'
                      ? (isAr ? `✍️ ${profile.customOccupationTitle || 'مهنة خاصة'}` : `✍️ ${profile.customOccupationTitle || 'Custom Occupation'}`)
                      : (isAr ? 'فحص عام اعتيادي' : 'General')}
                  </strong>
                </div>
              </div>
              {profile.occupation === 'machinery_factory' && ((profile.factoryEnvironmentHazards && profile.factoryEnvironmentHazards.length > 0) || profile.workEnvironmentNotes) && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(16, 185, 129, 0.4)', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 800, color: '#047857' }}>
                    🏭 {isAr ? 'بيئة المصنع المحذورة للصدر والرئتين:' : 'Factory Hazards:'}
                  </span>{' '}
                  {profile.factoryEnvironmentHazards && profile.factoryEnvironmentHazards.map((h) => (
                    <span key={h} className="badge" style={{ marginInlineEnd: '4px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '0.75rem' }}>
                      {h === 'dust_powder' ? '💨 أتربة وغبار وبودرة'
                        : h === 'chemicals_fumes' ? '🧪 أبخرة وكيماويات'
                        : h === 'textile_cotton' ? '🧵 ألياف وغزل قطني'
                        : h === 'paints_solvents' ? '🎨 دهانات ورش دوكو'
                        : h === 'sharp_machinery' ? '🔨 ماكينات حادة ثقيلة'
                        : h}
                    </span>
                  ))}
                  {profile.workEnvironmentNotes && (
                    <div style={{ color: '#065f46', marginTop: '4px', fontStyle: 'italic' }}>
                      📝 {profile.workEnvironmentNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
""")
        skip_display = True
    elif skip_display:
        if '</div>' in line and i > 730:
            skip_display = False
    else:
        new_lines.append(line)

with open("HealthProfile.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("update_health_profile.py completed successfully")
