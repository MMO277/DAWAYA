with open("WomensHealthClinic.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Replace color of active / inactive in WomensHealthClinic.tsx
code = code.replace("color: active ? '#f472b6' : '#f8fafc'", "color: active ? '#db2777' : 'inherit'")
code = code.replace("color: '#cbd5e1'", "color: 'var(--muted, #64748b)'")
code = code.replace("color: active ? '#38bdf8' : '#f8fafc'", "color: active ? '#0284c7' : 'inherit'")
code = code.replace("color: '#94a3b8'", "color: 'var(--muted, #64748b)'")

# Replace backgrounds for active / inactive
code = code.replace("background: active ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)'", "background: active ? 'rgba(236, 72, 153, 0.15)' : 'var(--card-bg, #ffffff)'")
code = code.replace("border: active ? '2.5px solid #ec4899' : '1.5px solid rgba(255, 255, 255, 0.2)'", "border: active ? '2.5px solid #ec4899' : '1.5px solid var(--line, #cbd5e1)'")

code = code.replace("background: active ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.05)'", "background: active ? 'rgba(2, 132, 199, 0.15)' : 'var(--card-bg, #ffffff)'")
code = code.replace("border: active ? '2.5px solid #0284c7' : '1.5px solid rgba(255, 255, 255, 0.2)'", "border: active ? '2.5px solid #0284c7' : '1.5px solid var(--line, #cbd5e1)'")

with open("WomensHealthClinic.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated WomensHealthClinic.tsx contrast")
