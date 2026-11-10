with open("WomensHealthClinic.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "١. ما هو نوع شريط منع الحمل الذي تستخدمينه؟" in line:
        new_lines.append("""            <div>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '8px' }}>١. ما هو نوع شريط منع الحمل الذي تستخدمينه؟</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'combined', icon: '🌸', title: 'أقراص مركبة عادية', sub: 'ياسمين، جينيرا، مارفيلون، سيلست' },
                  { id: 'mini_lactation', icon: '🍼', title: 'أقراص الرضاعة الأحادية', sub: 'سيرازيت، ميكرولوت، لاكتينور (أمان الرضاعة)' },
                ].map((item) => {
                  const active = pillType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPillType(item.id as any)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: active ? '2.5px solid #ec4899' : '1.5px solid rgba(255, 255, 255, 0.2)',
                        background: active ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textAlign: 'start',
                        boxShadow: active ? '0 0 14px rgba(236, 72, 153, 0.35)' : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: '0.92rem', display: 'block', color: active ? '#f472b6' : '#f8fafc' }}>{item.title}</b>
                        <span style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'block' }}>{item.sub}</span>
                      </div>
                      {active && <span style={{ color: '#ec4899', fontWeight: 900 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="small" style={{ fontWeight: 800, display: 'block', marginBottom: '8px' }}>٢. كم ساعة مرت على ميعاد الحبة المنسية؟</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'under_12', icon: '⚡', title: 'أقل من 12 ساعة', sub: 'تذكرتِ في نفس اليوم' },
                  { id: '12_to_24', icon: '⏳', title: 'بين 12 إلى 24 ساعة', sub: 'حبة واحدة منسية' },
                  { id: 'over_24_two_pills', icon: '🚨', title: 'أكثر من 24-48 ساعة', sub: 'حبتين أو أكثر منسية' },
                ].map((item) => {
                  const active = hoursLate === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHoursLate(item.id as any)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: active ? '2.5px solid #0284c7' : '1.5px solid rgba(255, 255, 255, 0.2)',
                        background: active ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        textAlign: 'start',
                        boxShadow: active ? '0 0 12px rgba(2, 132, 199, 0.35)' : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.icon}</span>
                        {active && <span style={{ color: '#38bdf8', fontWeight: 900 }}>✓</span>}
                      </div>
                      <b style={{ fontSize: '0.88rem', color: active ? '#38bdf8' : '#f8fafc' }}>{item.title}</b>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
""")
        skip = True
    elif skip:
        if '<div style={{ background: missedPillAction.bg' in line:
            skip = False
            new_lines.append(line)
    else:
        new_lines.append(line)

with open("WomensHealthClinic.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Updated WomensHealthClinic.tsx successfully")
