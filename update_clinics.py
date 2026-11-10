import re

# 1. UrologyRenalClinic.tsx: Sex choice cards
with open("UrologyRenalClinic.tsx", "r", encoding="utf-8") as f:
    uro_code = f.read()

old_sex = """            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>النوع:</label>
              <select value={sex} onChange={(e) => setSex(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }}>
                <option value="male">ذكر (Male)</option>
                <option value="female">أنثى (Female)</option>
              </select>
            </div>"""

new_sex = """            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>النوع:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'male', icon: '👨', label: 'ذكر' },
                  { id: 'female', icon: '👩', label: 'أنثى' },
                ].map((item) => {
                  const active = sex === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSex(item.id as any)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: active ? '2px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.2)',
                        background: active ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: active ? '0 0 10px rgba(2, 132, 199, 0.35)' : 'none',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      {active && <span style={{ color: '#38bdf8' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>"""

if old_sex in uro_code:
    uro_code = uro_code.replace(old_sex, new_sex, 1)
    with open("UrologyRenalClinic.tsx", "w", encoding="utf-8") as f:
        f.write(uro_code)
    print("1. Updated UrologyRenalClinic.tsx")
else:
    print("1. Could not find old_sex in UrologyRenalClinic.tsx")

# 2. ClinicalNutritionClinic.tsx: Gender & Activity choice cards
with open("ClinicalNutritionClinic.tsx", "r", encoding="utf-8") as f:
    nut_code = f.read()

old_nut_gender = """            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>النوع:</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 800 }}>
                <option value="female">أنثى</option>
                <option value="male">ذكر</option>
              </select>
            </div>"""

new_nut_gender = """            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>النوع:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'male', icon: '👨', label: 'ذكر' },
                  { id: 'female', icon: '👩', label: 'أنثى' },
                ].map((item) => {
                  const active = gender === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGender(item.id as any)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: active ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                        background: active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: active ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      {active && <span style={{ color: '#10b981' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>"""

if old_nut_gender in nut_code:
    nut_code = nut_code.replace(old_nut_gender, new_nut_gender, 1)
    with open("ClinicalNutritionClinic.tsx", "w", encoding="utf-8") as f:
        f.write(nut_code)
    print("2. Updated ClinicalNutritionClinic.tsx")
else:
    print("2. Could not find old_nut_gender")

# 3. SteroidTaperingCalendar.tsx: Tablet strength and starting dose chips
with open("SteroidTaperingCalendar.tsx", "r", encoding="utf-8") as f:
    st_code = f.read()

old_tablet_strength = """          <div>
            <label className="small" style={{ fontWeight: 700, color: '#CFD29D', display: 'block', marginBottom: '4px' }}>
              💊 {isAr ? 'تركيز القرص الذي اشتريته من الصيدلية:' : 'Your Tablet Strength:'}
            </label>
            <select
              className="select-input"
              value={tabletStrengthMg}
              onChange={(e) => setTabletStrengthMg(Number(e.target.value))}
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid #CFD29D' }}
            >
              <option value={20} style={{ color: '#000' }}>{isAr ? 'قرص 20 مجم (سولوبريد 20)' : '20mg Tablet (Solupred 20)'}</option>
              <option value={5} style={{ color: '#000' }}>{isAr ? 'قرص 5 مجم (بريدسول / هوستيكورتين)' : '5mg Tablet'}</option>
            </select>
          </div>"""

new_tablet_strength = """          <div>
            <label className="small" style={{ fontWeight: 700, color: '#CFD29D', display: 'block', marginBottom: '6px' }}>
              💊 {isAr ? 'تركيز القرص الذي اشتريته من الصيدلية:' : 'Your Tablet Strength:'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { val: 20, labelAr: 'قرص 20 مجم', subAr: 'سولوبريد 20' },
                { val: 5, labelAr: 'قرص 5 مجم', subAr: 'بريدسول / هوستيكورتين' },
              ].map((item) => {
                const active = tabletStrengthMg === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTabletStrengthMg(item.val)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: active ? '2.5px solid #CFD29D' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: active ? 'rgba(207, 210, 157, 0.28)' : 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      boxShadow: active ? '0 0 12px rgba(207, 210, 157, 0.35)' : 'none',
                    }}
                  >
                    <b style={{ fontSize: '0.88rem', color: active ? '#CFD29D' : '#f8fafc' }}>{item.labelAr}</b>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.subAr}</span>
                  </button>
                );
              })}
            </div>
          </div>"""

if old_tablet_strength in st_code:
    st_code = st_code.replace(old_tablet_strength, new_tablet_strength, 1)
    with open("SteroidTaperingCalendar.tsx", "w", encoding="utf-8") as f:
        f.write(st_code)
    print("3. Updated SteroidTaperingCalendar.tsx")
else:
    print("3. Could not find old_tablet_strength")

