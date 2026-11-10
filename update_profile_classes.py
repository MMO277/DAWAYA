with open("HealthProfile.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update Gender button to use dawaya-choice-pill
old_gender_btn = """                      <button
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
                      >"""

new_gender_btn = """                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGenderInput(g.id)}
                        className={`dawaya-choice-pill ${active ? 'selected' : ''}`}
                      >"""

if old_gender_btn in code:
    code = code.replace(old_gender_btn, new_gender_btn, 1)
    print("1. Updated Gender buttons to dawaya-choice-pill")
else:
    print("1. Could not find old_gender_btn")

# 2. Update Kidneys button to use dawaya-organ-pill
old_renal_btn = """                      <button
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
                      </button>"""

new_renal_btn = """                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            renalStatus: r.id as any,
                          }))
                        }
                        className={`dawaya-organ-pill ${active ? 'selected' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
                          <b>{r.labelAr}</b>
                        </div>
                        <span className="sub">{r.descAr}</span>
                      </button>"""

if old_renal_btn in code:
    code = code.replace(old_renal_btn, new_renal_btn, 1)
    print("2. Updated Renal buttons to dawaya-organ-pill")
else:
    print("2. Could not find old_renal_btn")

# 3. Update Hepatic button to use dawaya-organ-pill
old_hepatic_btn = """                      <button
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
                      </button>"""

new_hepatic_btn = """                      <button
                        key={h.id}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            hepaticStatus: h.id as any,
                          }))
                        }
                        className={`dawaya-organ-pill ${active ? 'selected' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{h.icon}</span>
                          <b>{h.labelAr}</b>
                        </div>
                        <span className="sub">{h.descAr}</span>
                      </button>"""

if old_hepatic_btn in code:
    code = code.replace(old_hepatic_btn, new_hepatic_btn, 1)
    print("3. Updated Hepatic buttons to dawaya-organ-pill")
else:
    print("3. Could not find old_hepatic_btn")

# 4. Update Occupation Card to use dawaya-choice-card
old_occ_card = """                      <button
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
                      </button>"""

new_occ_card = """                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setOccupationInput(card.id)}
                        className={`dawaya-choice-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontSize: '1.8rem' }}>{card.icon}</span>
                          {isSelected ? (
                            <span className="dawaya-choice-check">✓</span>
                          ) : (
                            <span className="dawaya-choice-uncheck" />
                          )}
                        </div>
                        <div>
                          <b className="choice-title">
                            {isAr ? card.titleAr : card.titleEn}
                          </b>
                          <span className="choice-desc">
                            {card.descAr}
                          </span>
                        </div>
                        <span className="choice-badge">
                          {card.badgeAr}
                        </span>
                      </button>"""

if old_occ_card in code:
    code = code.replace(old_occ_card, new_occ_card, 1)
    print("4. Updated Occupation cards to dawaya-choice-card with high contrast")
else:
    print("4. Could not find old_occ_card")

with open("HealthProfile.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated HealthProfile.tsx successfully!")
