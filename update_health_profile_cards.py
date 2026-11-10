with open("HealthProfile.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Replace Gender select with Choice Cards
old_gender = """              <div className="form-group">
                <label><b>{isAr ? 'النوع:' : 'Gender:'}</b></label>
                <select value={genderInput} onChange={(e) => setGenderInput(e.target.value)}>
                  <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
                  <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                </select>
              </div>"""

new_gender = """              <div className="form-group">
                <label><b>{isAr ? 'النوع:' : 'Gender:'}</b></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'male', icon: '👨', labelAr: 'ذكر', labelEn: 'Male' },
                    { id: 'female', icon: '👩', labelAr: 'أنثى', labelEn: 'Female' },
                  ].map((g) => {
                    const active = genderInput === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGenderInput(g.id)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: active ? '2.5px solid #10b981' : '1.5px solid rgba(255, 255, 255, 0.2)',
                          background: active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          boxShadow: active ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{g.icon}</span>
                        <span>{isAr ? g.labelAr : g.labelEn}</span>
                        {active && <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>"""

if old_gender in code:
    code = code.replace(old_gender, new_gender, 1)
    print("1. Replaced Gender select with Choice Cards")
else:
    print("1. Could not find old_gender")

# 2. Replace Renal Function select with Choice Cards
old_renal = """              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكلى:' : 'Renal Function:'}</b></label>
                <select
                  value={profile.renalStatus || 'unknown'}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      renalStatus: e.target.value as 'normal' | 'impaired' | 'unknown',
                    }))
                  }
                >
                  <option value="unknown">{isAr ? 'غير محدد' : 'Unknown'}</option>
                  <option value="normal">{isAr ? 'طبيعية (Normal)' : 'Normal'}</option>
                  <option value="impaired">{isAr ? 'قصور كلوي يحتاج تعديل جرعة' : 'Impaired (Renal Adjustment)'}</option>
                </select>
              </div>"""

new_renal = """              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكلى:' : 'Renal Function:'}</b></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px' }}>
                  {[
                    { id: 'normal', icon: '✅', labelAr: 'طبيعية', descAr: 'سليمة' },
                    { id: 'impaired', icon: '⚠️', labelAr: 'قصور كلوي', descAr: 'تعديل جرعة' },
                    { id: 'unknown', icon: '❓', labelAr: 'غير محدد', descAr: 'بلا فحص' },
                  ].map((r) => {
                    const active = (profile.renalStatus || 'unknown') === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            renalStatus: r.id as any,
                          }))
                        }
                        style={{
                          padding: '8px 6px',
                          borderRadius: '12px',
                          border: active ? '2.5px solid #0284c7' : '1.5px solid rgba(255, 255, 255, 0.2)',
                          background: active ? 'rgba(2, 132, 199, 0.28)' : 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          boxShadow: active ? '0 0 12px rgba(2, 132, 199, 0.35)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '1rem' }}>{r.icon}</span>
                          <b style={{ fontSize: '0.8rem', color: active ? '#38bdf8' : '#f8fafc' }}>{r.labelAr}</b>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{r.descAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>"""

if old_renal in code:
    code = code.replace(old_renal, new_renal, 1)
    print("2. Replaced Renal select with Choice Cards")
else:
    print("2. Could not find old_renal")

# 3. Replace Hepatic Function select with Choice Cards
old_hepatic = """              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكبد:' : 'Hepatic Function:'}</b></label>
                <select
                  value={profile.hepaticStatus || 'unknown'}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      hepaticStatus: e.target.value as 'normal' | 'impaired' | 'unknown',
                    }))
                  }
                >
                  <option value="unknown">{isAr ? 'غير محدد' : 'Unknown'}</option>
                  <option value="normal">{isAr ? 'طبيعية (Normal)' : 'Normal'}</option>
                  <option value="impaired">{isAr ? 'قصور كبدي' : 'Impaired'}</option>
                </select>
              </div>"""

new_hepatic = """              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكبد:' : 'Hepatic Function:'}</b></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px' }}>
                  {[
                    { id: 'normal', icon: '✅', labelAr: 'طبيعية', descAr: 'سليمة' },
                    { id: 'impaired', icon: '⚠️', labelAr: 'قصور كبدي', descAr: 'حذر دوائي' },
                    { id: 'unknown', icon: '❓', labelAr: 'غير محدد', descAr: 'بلا فحص' },
                  ].map((h) => {
                    const active = (profile.hepaticStatus || 'unknown') === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            hepaticStatus: h.id as any,
                          }))
                        }
                        style={{
                          padding: '8px 6px',
                          borderRadius: '12px',
                          border: active ? '2.5px solid #f59e0b' : '1.5px solid rgba(255, 255, 255, 0.2)',
                          background: active ? 'rgba(245, 158, 11, 0.28)' : 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          boxShadow: active ? '0 0 12px rgba(245, 158, 11, 0.35)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '1rem' }}>{h.icon}</span>
                          <b style={{ fontSize: '0.8rem', color: active ? '#fbbf24' : '#f8fafc' }}>{h.labelAr}</b>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{h.descAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>"""

if old_hepatic in code:
    code = code.replace(old_hepatic, new_hepatic, 1)
    print("3. Replaced Hepatic select with Choice Cards")
else:
    print("3. Could not find old_hepatic")

# 4. Replace Allergy Severity in Allergy Modal
old_allergy_sev = """                <div className="form-group">
                  <label><b>{isAr ? 'درجة الخطورة:' : 'Severity:'}</b></label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value as AllergySeverity)}>
                    <option value="life_threatening">{isAr ? 'مهددة للحياة (صدمة تحسسية وإغماء)' : 'Life Threatening'}</option>
                    <option value="severe">{isAr ? 'شديدة (تورم وضيق تنفس)' : 'Severe'}</option>
                    <option value="moderate">{isAr ? 'متوسطة (طفح جلدي واسع)' : 'Moderate'}</option>
                    <option value="mild">{isAr ? 'خفيفة (حكة خفيفة)' : 'Mild'}</option>
                  </select>
                </div>"""

new_allergy_sev = """                <div className="form-group">
                  <label><b>{isAr ? 'درجة الخطورة:' : 'Severity:'}</b></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {[
                      { id: 'life_threatening', icon: '🚨', labelAr: 'مهددة للحياة', descAr: 'صدمة تحسسية' },
                      { id: 'severe', icon: '🔴', labelAr: 'شديدة', descAr: 'تورم وضيق تنفس' },
                      { id: 'moderate', icon: '🟠', labelAr: 'متوسطة', descAr: 'طفح جلدي واسع' },
                      { id: 'mild', icon: '🟢', labelAr: 'خفيفة', descAr: 'حكة طفيفة' },
                    ].map((s) => {
                      const active = severity === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSeverity(s.id as AllergySeverity)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '12px',
                            border: active ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                            background: active ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            textAlign: 'start',
                            boxShadow: active ? '0 0 10px rgba(239, 68, 68, 0.35)' : 'none',
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                          <div>
                            <b style={{ fontSize: '0.8rem', display: 'block', color: active ? '#fca5a5' : '#f8fafc' }}>{s.labelAr}</b>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{s.descAr}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>"""

if old_allergy_sev in code:
    code = code.replace(old_allergy_sev, new_allergy_sev, 1)
    print("4. Replaced Allergy Severity select with Choice Cards")
else:
    print("4. Could not find old_allergy_sev")

with open("HealthProfile.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Finished updating HealthProfile.tsx with choice cards!")
