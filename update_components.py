import re

# 1. Update Layout.tsx with SmartWelcomeOnboardingBanner
with open("Layout.tsx", "r", encoding="utf-8") as f:
    layout_code = f.read()

banner_component = """
function SmartWelcomeOnboardingBanner() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile } = useSyncedHealthProfile();
  const [dismissed, setDismissed] = useState(false);

  // Only show if user is signed in, has not set an occupation yet (or it is 'general'), and hasn't dismissed
  if (!user || (profile?.occupation && profile.occupation !== 'general') || dismissed) {
    return null;
  }

  const patientFirstName = user.displayName ? user.displayName.split(' ')[0] : (isAr ? 'يا فندم' : 'there');

  return (
    <div
      className="wrap"
      style={{
        marginTop: '10px',
        marginBottom: '4px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f766e 100%)',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(6, 78, 59, 0.35)',
          border: '1.5px solid #34d399',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.9rem' }}>🌟</span>
          <div>
            <strong style={{ fontSize: '0.98rem', display: 'block', color: '#ffffff', marginBottom: '2px' }}>
              {isAr
                ? `أهلاً بك يا ${patientFirstName} في دوايا 👋 خطوة واحدة لتأمين صحتك!`
                : `Welcome ${patientFirstName}! One quick step to secure your health:`}
            </strong>
            <span style={{ fontSize: '0.84rem', color: '#d1fae5', lineHeight: 1.4, display: 'block' }}>
              {isAr
                ? 'حدد مهنتك (سائق، مصنع، طالب، ربت منزل...) بكروت تفاعلية ليفحص الذكاء الاصطناعي أمان أي دواء تبحث عنه ضد النعاس والدوخة وحساسية الصدر.'
                : 'Select your occupation so AI can screen your medicines for driving safety, alertness, and workplace lung hazards.'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link
            to="/health-profile"
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: '1.5px solid #ffffff',
              fontWeight: 800,
              fontSize: '0.88rem',
              borderRadius: '999px',
              padding: '7px 18px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🚗⚙️</span>
            <span>{isAr ? 'اختر مهنتك الآن' : 'Set Occupation'}</span>
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isAr ? 'إغلاق' : 'Dismiss'}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
"""

if "function SmartWelcomeOnboardingBanner" not in layout_code:
    # Insert before SmartCrossClinicSafetyBanner
    layout_code = layout_code.replace("function SmartCrossClinicSafetyBanner() {", banner_component + "\nfunction SmartCrossClinicSafetyBanner() {", 1)
    # Insert in JSX above children
    layout_code = layout_code.replace("<SmartCrossClinicSafetyBanner />", "<SmartCrossClinicSafetyBanner />\n      <SmartWelcomeOnboardingBanner />", 1)
    with open("Layout.tsx", "w", encoding="utf-8") as f:
        f.write(layout_code)
    print("1. Added SmartWelcomeOnboardingBanner to Layout.tsx")
else:
    print("1. SmartWelcomeOnboardingBanner already present in Layout.tsx")

# 2. Update VoiceDoctorCallModal.tsx with factory and custom occupation context
with open("VoiceDoctorCallModal.tsx", "r", encoding="utf-8") as f:
    voice_code = f.read()

old_occ_voice = """        const occNotice = profile.occupation ? `وظيفة المريض الحالية: "${profile.occupation}".` : '';"""

new_occ_voice = """        const occTitle = profile.occupation === 'other' ? (profile.customOccupationTitle || 'مهنة خاصة')
          : profile.occupation === 'driver_transport' ? 'سائق طريق ومواصلات'
          : profile.occupation === 'machinery_factory' ? 'عامل مصنع وماكينات'
          : profile.occupation === 'office_desk' ? 'عمل مكتبي'
          : profile.occupation === 'student' ? 'طالب'
          : profile.occupation === 'homemaker' ? 'ربت منزل'
          : 'عام';

        const factoryNotice = (profile.occupation === 'machinery_factory' && (profile.factoryEnvironmentHazards?.length || profile.workEnvironmentNotes))
          ? `بيئة عمل المريض في المصنع: يتعرض لـ (${profile.factoryEnvironmentHazards?.map((h: string) => h === 'dust_powder' ? 'أتربة وبودرة وغبار (تأثير على الصدر والربو)' : h === 'chemicals_fumes' ? 'كيماويات وأبخرة' : h === 'textile_cotton' ? 'ألياف قطن' : h).join('، ')}). تفاصيل: "${profile.workEnvironmentNotes || ''}". نبّهه صراحة إذا كان الدواء يسبب سعالاً أو ضيق تنفس أو يتعارض مع حساسية الصدر والربو.`
          : '';

        const occNotice = `وظيفة المريض: "${occTitle}". ${factoryNotice}`;"""

if old_occ_voice in voice_code:
    voice_code = voice_code.replace(old_occ_voice, new_occ_voice, 1)
    with open("VoiceDoctorCallModal.tsx", "w", encoding="utf-8") as f:
        f.write(voice_code)
    print("2. Updated VoiceDoctorCallModal.tsx with factory hazards context")
else:
    print("2. Could not find old_occ_voice in VoiceDoctorCallModal.tsx")

# 3. Update PassportView.tsx with custom occupation & factory hazards
with open("PassportView.tsx", "r", encoding="utf-8") as f:
    pass_code = f.read()

old_pass_occ = """                  : profile.occupation === 'homemaker'
                  ? (isAr ? '🏡 ربت منزل / رعاية أسرية' : 'Homemaker')
                  : (isAr ? 'عام' : 'General')}
              </div>
            </div>
          </div>
        )}"""

new_pass_occ = """                  : profile.occupation === 'homemaker'
                  ? (isAr ? '🏡 ربت منزل / رعاية أسرية' : 'Homemaker')
                  : profile.occupation === 'other'
                  ? (isAr ? `✍️ ${profile.customOccupationTitle || 'مهنة خاصة'}` : `✍️ ${profile.customOccupationTitle || 'Custom'}`)
                  : (isAr ? 'فحص عام اعتيادي' : 'General')}
              </div>
              {profile.occupation === 'machinery_factory' && ((profile.factoryEnvironmentHazards && profile.factoryEnvironmentHazards.length > 0) || profile.workEnvironmentNotes) && (
                <div style={{ fontSize: '0.74rem', marginTop: 4, opacity: 0.9 }}>
                  🏭 {profile.factoryEnvironmentHazards?.map((h: string) => h === 'dust_powder' ? 'أتربة وبودرة' : h === 'chemicals_fumes' ? 'كيماويات وأبخرة' : h === 'textile_cotton' ? 'ألياف قطن' : h).join('، ')}
                  {profile.workEnvironmentNotes ? ` (${profile.workEnvironmentNotes})` : ''}
                </div>
              )}
            </div>
          </div>
        )}"""

if old_pass_occ in pass_code:
    pass_code = pass_code.replace(old_pass_occ, new_pass_occ, 1)
    with open("PassportView.tsx", "w", encoding="utf-8") as f:
        f.write(pass_code)
    print("3. Updated PassportView.tsx with custom occupation & factory hazards")
else:
    print("3. Could not find old_pass_occ in PassportView.tsx")

