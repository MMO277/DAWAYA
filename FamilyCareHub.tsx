import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, configured } from './firebase';
import { useAuth } from './authContext';
import { useLang } from './i18n';
import { SubscriptionAndPlansPanel } from './SubscriptionAndPlansPanel';

interface FamilyLinkDoc {
  id: string;
  caregiverUid: string;
  caregiverName: string;
  patientUid: string;
  patientName: string;
  patientEmail: string;
  relation: string;
  allowRemoteEdit: boolean;
  createdAtIso: string;
}

interface RemoteMedDose {
  id: string;
  linkId: string;
  patientUid: string;
  caregiverUid: string;
  drugName: string;
  dosage: string;
  timeSlot: string;
  mealNote: string;
  takenTodayDate: string; // YYYY-MM-DD
  addedByName: string;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function FamilyCareHub() {
  const { user, openAuthModal } = useAuth();
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'caregiver' | 'my_code'>('caregiver');
  const [linkedPatients, setLinkedPatients] = useState<FamilyLinkDoc[]>([]);
  const [myCaregivers, setMyCaregivers] = useState<FamilyLinkDoc[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [remoteMeds, setRemoteMeds] = useState<RemoteMedDose[]>([]);
  const [myIncomingMeds, setMyIncomingMeds] = useState<RemoteMedDose[]>([]);

  // Invite code generation (Patient side)
  const [generatedCode, setGeneratedCode] = useState('');
  const [allowEditOnInvite, setAllowEditOnInvite] = useState(true);
  const [inviteBusy, setInviteBusy] = useState(false);

  // Claim code (Caregiver side)
  const [claimCode, setClaimCode] = useState('');
  const [relationLabel, setRelationLabel] = useState('أمي');
  const [claimBusy, setClaimBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Add remote medication form
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('08:00');
  const [medNote, setMedNote] = useState('بعد الأكل');
  const [medBusy, setMedBusy] = useState(false);

  const today = todayKey();

  // Subscribe to family links where current user is Caregiver or Patient
  useEffect(() => {
    if (!configured || !db || !user?.uid) return;
    const qCaregiver = query(collection(db, 'family_links'), where('caregiverUid', '==', user.uid));
    const unsub1 = onSnapshot(
      qCaregiver,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FamilyLinkDoc, 'id'>) }));
        setLinkedPatients(list);
        if (list.length > 0 && !selectedLinkId) setSelectedLinkId(list[0].id);
      },
      () => {}
    );

    const qPatient = query(collection(db, 'family_links'), where('patientUid', '==', user.uid));
    const unsub2 = onSnapshot(
      qPatient,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FamilyLinkDoc, 'id'>) }));
        setMyCaregivers(list);
      },
      () => {}
    );

    const qMyMeds = query(collection(db, 'family_med_schedules'), where('patientUid', '==', user.uid));
    const unsub3 = onSnapshot(
      qMyMeds,
      (snap) => {
        setMyIncomingMeds(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RemoteMedDose, 'id'>) })));
      },
      () => {}
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user?.uid, selectedLinkId]);

  // Subscribe to selected patient's remote medication schedule
  useEffect(() => {
    if (!configured || !db || !selectedLinkId) {
      setRemoteMeds([]);
      return;
    }
    const qMeds = query(collection(db, 'family_med_schedules'), where('linkId', '==', selectedLinkId));
    const unsub = onSnapshot(
      qMeds,
      (snap) => {
        setRemoteMeds(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RemoteMedDose, 'id'>) })));
      },
      () => {}
    );
    return () => unsub();
  }, [selectedLinkId]);

  const selectedLink = useMemo(
    () => linkedPatients.find((l) => l.id === selectedLinkId) || null,
    [linkedPatients, selectedLinkId]
  );

  const handleGenerateInvite = async () => {
    if (!user?.uid || !db) return;
    setInviteBusy(true);
    setErrMsg('');
    setStatusMsg('');
    try {
      const code = generateSixDigitCode();
      await setDoc(doc(db, 'family_link_invites', code), {
        code,
        patientUid: user.uid,
        patientName: user.displayName || user.email?.split('@')[0] || 'مستخدم دوايا',
        patientEmail: user.email || '',
        allowRemoteEdit: allowEditOnInvite,
        expiresAtMs: Date.now() + 15 * 60 * 1000,
        createdAt: serverTimestamp(),
      });
      setGeneratedCode(code);
      setStatusMsg(
        isAr
          ? 'تم توليد كود الربط العائلي بنجاح! شاركه مع الشخص الذي سيتابع أدويتك (صالح لمدة 15 دقيقة).'
          : 'Family link code generated! Share it with your caregiver (valid for 15 minutes).'
      );
    } catch {
      setErrMsg(isAr ? 'تعذر توليد الكود. تأكد من الاتصال بالإنترنت.' : 'Could not generate invite code.');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleClaimInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !db) return;
    const clean = claimCode.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) {
      setErrMsg(isAr ? 'أدخل كود الربط المكوّن من 6 أرقام.' : 'Enter the 6-digit link code.');
      return;
    }
    setClaimBusy(true);
    setErrMsg('');
    setStatusMsg('');
    try {
      const inviteRef = doc(db, 'family_link_invites', clean);
      const snap = await getDoc(inviteRef);
      if (!snap.exists()) {
        setErrMsg(isAr ? 'كود الربط غير صحيح أو منتهي الصلاحية.' : 'Invalid or expired link code.');
        return;
      }
      const inv = snap.data() as any;
      if (Date.now() > Number(inv.expiresAtMs || 0)) {
        setErrMsg(isAr ? 'انتهت صلاحية الكود. اطلب كوداً جديداً.' : 'Code expired. Please request a new one.');
        return;
      }
      if (inv.patientUid === user.uid) {
        setErrMsg(isAr ? 'لا يمكنك ربط حسابك بنفسك. استخدم كود من حساب فرد آخر.' : 'Cannot link to your own account.');
        return;
      }
      const linkId = `${user.uid}_${inv.patientUid}`;
      await setDoc(doc(db, 'family_links', linkId), {
        caregiverUid: user.uid,
        caregiverName: user.displayName || user.email?.split('@')[0] || 'المتابع',
        patientUid: inv.patientUid,
        patientName: inv.patientName || 'فرد العائلة',
        patientEmail: inv.patientEmail || '',
        relation: relationLabel.trim() || 'فرد من العائلة',
        allowRemoteEdit: Boolean(inv.allowRemoteEdit),
        createdAtIso: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      await deleteDoc(inviteRef).catch(() => {});
      setSelectedLinkId(linkId);
      setClaimCode('');
      setStatusMsg(
        isAr
          ? `تم ربط حساب (${inv.patientName}) بنجاح! يمكنك الآن المتابعة وإضافة الجرعات عن بُعد.`
          : `Successfully linked to ${inv.patientName}!`
      );
    } catch {
      setErrMsg(isAr ? 'حدث خطأ أثناء الربط. حاول مرة أخرى.' : 'Link failed. Please try again.');
    } finally {
      setClaimBusy(false);
    }
  };

  const handleAddRemoteMed = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !db || !selectedLink || !medName.trim()) return;
    setMedBusy(true);
    try {
      await addDoc(collection(db, 'family_med_schedules'), {
        linkId: selectedLink.id,
        patientUid: selectedLink.patientUid,
        caregiverUid: user.uid,
        drugName: medName.trim(),
        dosage: medDosage.trim() || 'قرص واحد',
        timeSlot: medTime,
        mealNote: medNote,
        takenTodayDate: '',
        addedByName: user.displayName || 'المتابع',
        createdAt: serverTimestamp(),
      });
      setMedName('');
      setMedDosage('');
    } finally {
      setMedBusy(false);
    }
  };

  const handleToggleTakenToday = async (med: RemoteMedDose) => {
    if (!db) return;
    const nextDate = med.takenTodayDate === today ? '' : today;
    await updateDoc(doc(db, 'family_med_schedules', med.id), { takenTodayDate: nextDate });
  };

  const handleDeleteMed = async (medId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'family_med_schedules', medId));
  };

  const handleUnlink = async (linkId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'family_links', linkId));
    if (selectedLinkId === linkId) setSelectedLinkId('');
  };

  if (!user) {
    return (
      <div className="wrap stack" style={{ padding: '24px 0', maxWidth: '640px' }} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card stack" style={{ textAlign: 'center', padding: '32px 24px', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '1.45rem' }}>
            {isAr ? 'الرعاية العائلية والمتابعة عن بُعد' : 'Family Care & Remote Monitoring'}
          </h1>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {isAr
              ? 'اربط حساب والدك أو والدتك بحسابك لمتابعة مواعيد أدويتهم وإضافة الجرعات عن بُعد بدون مشاركة كلمات المرور.'
              : 'Link your parents or family accounts to monitor adherence and manage dose schedules remotely.'}
          </p>
          <button type="button" className="btn" onClick={() => openAuthModal('login')} style={{ margin: '8px auto 0' }}>
            {isAr ? 'تسجيل الدخول لتفعيل الربط العائلي' : 'Sign In to Enable Family Care'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap stack" style={{ padding: '18px 0 36px', maxWidth: '880px', gap: '16px' }} dir={isAr ? 'rtl' : 'ltr'}>
      <header
        className="card"
        style={{
          background: 'linear-gradient(135deg, #071923 0%, #0F5E49 100%)',
          color: '#FFFFFF',
          border: '1px solid rgba(207, 210, 157, 0.35)',
          padding: '22px 24px',
        }}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <span
              className="badge"
              style={{ background: 'rgba(207, 210, 157, 0.18)', color: '#CFD29D', border: '1px solid rgba(207, 210, 157, 0.45)' }}
            >
              DAWAYA Family Link
            </span>
            <h1 style={{ margin: '8px 0 4px', fontSize: '1.45rem', color: '#FFFFFF' }}>
              {isAr ? 'الرعاية العائلية والمتابعة عن بُعد' : 'Family Care & Remote Monitoring'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#CBE4DC' }}>
              {isAr
                ? 'تابع أدوية أهلك لحظياً وأضف لهم مواعيد الجرعات من موبايلك بدون الدخول لحسابهم.'
                : 'Track family medications live and manage their dose schedules from your device.'}
            </p>
          </div>
          <button
            type="button"
            className="btn small"
            style={{ background: '#CFD29D', color: '#071923', borderColor: '#CFD29D', fontWeight: 800 }}
            onClick={() => setShowUpgradePrompt((v) => !v)}
          >
            {isAr ? 'باقة العائلة (DAWAYA Plus)' : 'DAWAYA Plus Plan'}
          </button>
        </div>
      </header>

      {showUpgradePrompt && <SubscriptionAndPlansPanel audience="user" />}

      {/* Mode Switcher Tabs */}
      <div className="row" style={{ gap: '8px' }}>
        <button
          type="button"
          className="btn"
          style={{
            flex: 1,
            background: activeTab === 'caregiver' ? '#0F7659' : 'var(--card-bg)',
            color: activeTab === 'caregiver' ? '#FFFFFF' : 'var(--ink)',
            borderColor: activeTab === 'caregiver' ? '#0F7659' : 'var(--line)',
          }}
          onClick={() => setActiveTab('caregiver')}
        >
          {isAr ? `متابعة أهلي (${linkedPatients.length})` : `My Family (${linkedPatients.length})`}
        </button>
        <button
          type="button"
          className="btn"
          style={{
            flex: 1,
            background: activeTab === 'my_code' ? '#0F7659' : 'var(--card-bg)',
            color: activeTab === 'my_code' ? '#FFFFFF' : 'var(--ink)',
            borderColor: activeTab === 'my_code' ? '#0F7659' : 'var(--line)',
          }}
          onClick={() => setActiveTab('my_code')}
        >
          {isAr ? 'كود الربط لحسابي وجرعاتي' : 'My Link Code & Doses'}
        </button>
      </div>

      {statusMsg && (
        <div className="card" style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', fontWeight: 700 }}>
          {statusMsg}
        </div>
      )}
      {errMsg && (
        <div className="card" style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', fontWeight: 700 }}>
          {errMsg}
        </div>
      )}

      {activeTab === 'caregiver' && (
        <div className="stack" style={{ gap: '14px' }}>
          {/* Link a New Family Member via 6-Digit Code */}
          <form className="card stack" onSubmit={handleClaimInvite} style={{ gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.08rem' }}>
              {isAr ? 'ربط حساب فرد جديد من الأسرة بكود (6 أرقام)' : 'Link a Family Member with 6-Digit Code'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  {isAr ? 'كود الربط من موبايلهم:' : '6-Digit Code:'}
                </label>
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ direction: 'ltr', textAlign: 'center', fontWeight: 800, letterSpacing: '4px' }}
                  required
                />
              </div>
              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  {isAr ? 'صلة القرابة:' : 'Relationship:'}
                </label>
                <select className="input" value={relationLabel} onChange={(e) => setRelationLabel(e.target.value)}>
                  <option value="أمي">{isAr ? 'أمي' : 'Mother'}</option>
                  <option value="أبي">{isAr ? 'أبي' : 'Father'}</option>
                  <option value="ابني / ابنتي">{isAr ? 'ابني / ابنتي' : 'Child'}</option>
                  <option value="الزوج / الزوجة">{isAr ? 'الزوج / الزوجة' : 'Spouse'}</option>
                  <option value="أخ / أخت">{isAr ? 'أخ / أخت' : 'Sibling'}</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn" disabled={claimBusy}>
              {claimBusy ? (isAr ? 'جاري الربط...' : 'Linking...') : isAr ? 'ربط الحساب الآن' : 'Link Account Now'}
            </button>
          </form>

          {/* Linked Family Members Selector */}
          {linkedPatients.length > 0 && (
            <div className="row wrapRow" style={{ gap: '8px' }}>
              {linkedPatients.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="btn small"
                  style={{
                    background: selectedLinkId === link.id ? '#081B26' : 'var(--card-bg)',
                    color: selectedLinkId === link.id ? '#CFD29D' : 'var(--ink)',
                    borderColor: selectedLinkId === link.id ? '#081B26' : 'var(--line)',
                  }}
                  onClick={() => setSelectedLinkId(link.id)}
                >
                  {link.relation} — {link.patientName}
                </button>
              ))}
            </div>
          )}

          {/* Selected Family Member Live Board */}
          {selectedLink && (
            <div className="card stack" style={{ gap: '14px', borderTop: '4px solid #0F7659' }}>
              <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedLink.relation} ({selectedLink.patientName})</h3>
                  <span className="small muted">
                    {selectedLink.allowRemoteEdit
                      ? isAr ? 'متابعة لايف + صلاحية إضافة وتعديل المواعيد مفعّلة' : 'Live view + remote schedule editing enabled'
                      : isAr ? 'متابعة للقراءة فقط' : 'Read-only monitoring'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn small"
                  style={{ background: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }}
                  onClick={() => void handleUnlink(selectedLink.id)}
                >
                  {isAr ? 'فك الربط' : 'Unlink'}
                </button>
              </div>

              {/* Remote Dose Schedule List */}
              <div className="stack" style={{ gap: '8px' }}>
                {remoteMeds.length === 0 ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    {isAr ? 'لا توجد جرعات مضافة بعد لهذا الحساب. أضف أول دواء بالأسفل.' : 'No doses scheduled yet.'}
                  </p>
                ) : (
                  remoteMeds.map((m) => {
                    const taken = m.takenTodayDate === today;
                    return (
                      <div
                        key={m.id}
                        className="row wrapRow"
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: taken ? '#ECFDF5' : 'var(--tint)',
                          border: `1px solid ${taken ? '#10B981' : 'var(--line)'}`,
                          gap: '8px',
                        }}
                      >
                        <div>
                          <strong style={{ display: 'block' }}>{m.drugName} — {m.dosage}</strong>
                          <span className="small muted">
                            {isAr ? `الموعد: ${m.timeSlot} • ${m.mealNote}` : `Time: ${m.timeSlot} • ${m.mealNote}`}
                          </span>
                        </div>
                        <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                          <span
                            className="badge"
                            style={{
                              background: taken ? '#0F7659' : '#FEF3C7',
                              color: taken ? '#FFFFFF' : '#92400E',
                              fontWeight: 800,
                            }}
                          >
                            {taken ? (isAr ? 'أخذ الجرعة اليوم' : 'Taken Today') : (isAr ? 'لم تؤخذ بعد' : 'Pending')}
                          </span>
                          {selectedLink.allowRemoteEdit && (
                            <button
                              type="button"
                              className="btn small"
                              style={{ background: 'transparent', color: '#DC2626', borderColor: '#FCA5A5' }}
                              onClick={() => void handleDeleteMed(m.id)}
                            >
                              {isAr ? 'حذف' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Medication Remotely */}
              {selectedLink.allowRemoteEdit && (
                <form onSubmit={handleAddRemoteMed} className="stack" style={{ gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {isAr ? `إضافة دواء وموعد جرعة لـ (${selectedLink.relation}):` : `Add Dose for ${selectedLink.patientName}:`}
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                    <input
                      className="input"
                      placeholder={isAr ? 'اسم الدواء (مثل: Concor 5mg)' : 'Medicine name'}
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      required
                    />
                    <input
                      className="input"
                      placeholder={isAr ? 'الجرعة (مثل: قرص واحد)' : 'Dosage'}
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                    />
                    <input className="input" type="time" value={medTime} onChange={(e) => setMedTime(e.target.value)} />
                    <select className="input" value={medNote} onChange={(e) => setMedNote(e.target.value)}>
                      <option value="قبل الأكل">{isAr ? 'قبل الأكل' : 'Before meal'}</option>
                      <option value="بعد الأكل">{isAr ? 'بعد الأكل' : 'After meal'}</option>
                      <option value="قبل النوم">{isAr ? 'قبل النوم' : 'Before sleep'}</option>
                      <option value="على الريق">{isAr ? 'على الريق' : 'Empty stomach'}</option>
                    </select>
                  </div>
                  <button type="submit" className="btn small" disabled={medBusy}>
                    {medBusy ? (isAr ? 'جاري الإضافة...' : 'Adding...') : isAr ? 'إرسال الدواء لجدولهم الآن' : 'Add to Their Schedule'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my_code' && (
        <div className="stack" style={{ gap: '14px' }}>
          {/* Generate 6-digit invite code for Caregiver */}
          <div className="card stack" style={{ gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              {isAr ? 'السماح لأحد أفراد أسرتي بمتابعة أدويتي' : 'Allow a Family Caregiver to Monitor Me'}
            </h2>
            <label className="row" style={{ gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={allowEditOnInvite}
                onChange={(e) => setAllowEditOnInvite(e.target.checked)}
              />
              <span className="small" style={{ fontWeight: 700 }}>
                {isAr ? 'السماح للمتابِع بإضافة وتعديل مواعيد أدويتي عن بُعد' : 'Allow caregiver to add & edit my medication times'}
              </span>
            </label>
            <button type="button" className="btn" onClick={handleGenerateInvite} disabled={inviteBusy}>
              {inviteBusy ? (isAr ? 'جاري التوليد...' : 'Generating...') : isAr ? 'توليد كود ربط عائلي (6 أرقام)' : 'Generate 6-Digit Link Code'}
            </button>

            {generatedCode && (
              <div
                style={{
                  background: '#071923',
                  color: '#CFD29D',
                  borderRadius: '16px',
                  padding: '18px',
                  textAlign: 'center',
                  border: '1.5px solid #24C8B8',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#8FDAC3', marginBottom: '6px' }}>
                  {isAr ? 'أعطِ هذا الكود للمتابِع لربط الحساب (صالح 15 دقيقة):' : 'Share this code with your caregiver (valid 15 min):'}
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '10px', direction: 'ltr', fontFamily: 'monospace' }}>
                  {generatedCode}
                </div>
              </div>
            )}
          </div>

          {/* Patient's own live checklist of doses added by caregiver */}
          <div className="card stack" style={{ gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
              {isAr ? 'جرعاتي المجدولة عبر الرعاية العائلية اليوم' : 'My Family-Managed Doses Today'}
            </h3>
            {myIncomingMeds.length === 0 ? (
              <p className="small muted" style={{ margin: 0 }}>
                {isAr ? 'لا توجد جرعات مضافة لحسابك عن بُعد حتى الآن.' : 'No remotely scheduled doses yet.'}
              </p>
            ) : (
              myIncomingMeds.map((m) => {
                const taken = m.takenTodayDate === today;
                return (
                  <div
                    key={m.id}
                    className="row wrapRow"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: taken ? '#ECFDF5' : 'var(--tint)',
                      border: `1px solid ${taken ? '#10B981' : 'var(--line)'}`,
                      gap: '10px',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block' }}>{m.drugName} — {m.dosage}</strong>
                      <span className="small muted">
                        {isAr ? `الساعة ${m.timeSlot} • ${m.mealNote}` : `${m.timeSlot} • ${m.mealNote}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn small"
                      style={{
                        background: taken ? '#0F7659' : '#081B26',
                        borderColor: taken ? '#0F7659' : '#081B26',
                        color: '#FFFFFF',
                        fontWeight: 800,
                      }}
                      onClick={() => void handleToggleTakenToday(m)}
                    >
                      {taken ? (isAr ? 'تم أخذ الجرعة ✓' : 'Taken ✓') : (isAr ? 'اضغط عند أخذ الجرعة' : 'Mark as Taken')}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Connected Caregivers List with 1-Click Revoke */}
          {myCaregivers.length > 0 && (
            <div className="card stack" style={{ gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                {isAr ? 'المتابِعون المرتبطون بحسابي:' : 'Caregivers Linked to My Account:'}
              </h3>
              {myCaregivers.map((cg) => (
                <div key={cg.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><strong>{cg.caregiverName}</strong> ({cg.relation})</span>
                  <button
                    type="button"
                    className="btn small"
                    style={{ background: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }}
                    onClick={() => void handleUnlink(cg.id)}
                  >
                    {isAr ? 'إلغاء الربط' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
