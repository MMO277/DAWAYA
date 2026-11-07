import { useMemo, useState } from 'react';
import { useLang } from './i18n';
import { Link } from 'react-router-dom';
import {
  DawayaMedicineRecord,
  fetchFullDawayaMedicineById,
  searchDawayaIndex,
  useDawayaDrugDatabase,
} from './dawayaDrugDatabaseService';

type DosageForm = 'suspension' | 'tablets' | 'injections' | 'topicals';

export default function SafeDisposal() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { indexItems } = useDawayaDrugDatabase();

  const [selectedForm, setSelectedForm] = useState<DosageForm>('tablets');
  const [storageQuery, setStorageQuery] = useState('');
  const [selectedMed, setSelectedMed] = useState<DawayaMedicineRecord | null>(null);

  const storageMatches = useMemo(() => {
    if (!storageQuery.trim()) return [];
    return searchDawayaIndex(indexItems, { query: storageQuery }, isAr).slice(0, 8);
  }, [storageQuery, indexItems, isAr]);

  return (
    <main className="wrap stack">
      <Link to="/">← {isAr ? 'الرئيسية' : 'Home'}</Link>

      <header className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2.5rem' }}>♻️</span>
          <div>
            <h1>
              {isAr
                ? 'دليل الحفظ الصحيح والتخلص الآمن من جميع الأدوية المنزلية (26,562+ دواء)'
                : 'Safe Medication Storage & Household Drug Disposal Guide (26,562+ DB)'}
            </h1>
            <p className="muted">
              {isAr
                ? 'ابحث عن شروط الحفظ والتخزين لأي دواء في صيدلية منزلك، وتعرّف على الطريقة الآمنة للتخلص من الأدوية منتهية الصلاحية لحماية أطفالك والبيئة.'
                : 'Look up exact storage instructions for any medicine in your home cabinet and learn safe disposal steps for expired medications.'}
            </p>
          </div>
        </div>
      </header>

      {/* Live 26,562-Medicine Storage Finder */}
      <section className="card stack highlight-card">
        <h2>🧊 {isAr ? 'ابحث عن درجة وطريقة الحفظ الصحيحة لأي دواء (26,562+ دواء):' : 'Check Storage Conditions for Any Medicine (26,562+ DB):'}</h2>
        <input
          type="search"
          value={storageQuery}
          onChange={(e) => setStorageQuery(e.target.value)}
          placeholder={isAr ? 'اكتب اسم الدواء لمعرفة شروط حفظه وتخزينه...' : 'Type medicine name to check its storage rules...'}
        />
        {storageMatches.length > 0 && (
          <div className="row wrapRow" style={{ gap: '8px' }}>
            {storageMatches.map((it) => (
              <button
                key={it.i}
                type="button"
                className="chip"
                onClick={async () => {
                  const full = await fetchFullDawayaMedicineById(it.i);
                  if (full) setSelectedMed(full);
                  setStorageQuery('');
                }}
              >
                {isAr ? it.a || it.n : it.n} ({it.s})
              </button>
            ))}
          </div>
        )}
        {selectedMed && (
          <div className="subcard stack" style={{ borderInlineStart: '4px solid #00BFD0' }}>
            <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{selectedMed.brandNameAr} ({selectedMed.brandNameEn})</b>
              <Link to={`/medicine/${selectedMed.id}`} className="btn small ghost">
                📖 {isAr ? 'تفاصيل الدواء' : 'Drug Details'}
              </Link>
            </div>
            <p className="small" style={{ margin: 0 }}>
              <b>🌡️ {isAr ? 'تعليمات الحفظ والتخزين:' : 'Storage Instructions:'}</b>{' '}
              {isAr ? selectedMed.storageInfoAr : selectedMed.storageInfoEn}
            </p>
          </div>
        )}
      </section>

      {/* Interactive Disposal Navigator */}
      <section className="card stack">
        <h2>🛠️ {isAr ? 'الطريقة الصحيحة للتخلص من الأدوية منتهية الصلاحية حسب شكلها:' : 'Step-by-Step Safe Disposal by Dosage Form:'}</h2>
        <div className="row wrapRow" style={{ gap: '8px', margin: '8px 0 14px' }}>
          <button
            className={`btn ${selectedForm === 'tablets' ? '' : 'ghost'}`}
            onClick={() => setSelectedForm('tablets')}
          >
            💊 {isAr ? 'الأقراص والكبسولات' : 'Tablets & Capsules'}
          </button>
          <button
            className={`btn ${selectedForm === 'suspension' ? '' : 'ghost'}`}
            onClick={() => setSelectedForm('suspension')}
          >
            🍼 {isAr ? 'أدوية الشراب والنقط' : 'Syrups & Suspensions'}
          </button>
          <button
            className={`btn ${selectedForm === 'injections' ? '' : 'ghost'}`}
            onClick={() => setSelectedForm('injections')}
          >
            💉 {isAr ? 'الحقن والأنسولين والسرنجات' : 'Injections, Insulin & Sharps'}
          </button>
          <button
            className={`btn ${selectedForm === 'topicals' ? '' : 'ghost'}`}
            onClick={() => setSelectedForm('topicals')}
          >
            🧴 {isAr ? 'المراهم وقطرات العيون' : 'Ointments & Eye Drops'}
          </button>
        </div>

        {selectedForm === 'tablets' && (
          <div className="subcard stack">
            <h3>💊 {isAr ? 'بروتوكول التخلص من الأقراص والكبسولات (أدوية الضغط، السكر، المسكنات، الفيتامينات):' : 'Protocol for Tablets & Capsules:'}</h3>
            <ul>
              <li>{isAr ? 'لا تلقِ الأقراص مكشوفة في سلة المهملات حتى لا يبتلعها الأطفال أو الحيوانات الأليفة.' : 'Never throw loose pills into open trash.'}</li>
              <li>{isAr ? 'أفرغ الأقراص في كيس مغلق مع بقايا تفل القهوة أو الشاي المستعمل وأغلقه بإحكام.' : 'Mix pills in a sealed plastic bag with used coffee grounds or tea leaves.'}</li>
              <li>{isAr ? 'اطمس أي بيانات شخصية للمريض على العبوة الخارجية قبل إلقائها.' : 'Scratch out personal patient information on prescription boxes.'}</li>
            </ul>
          </div>
        )}

        {selectedForm === 'suspension' && (
          <div className="subcard stack">
            <h3>🍼 {isAr ? 'بروتوكول أدوية الشراب والنقط:' : 'Protocol for Syrups & Drops:'}</h3>
            <ul>
              <li>{isAr ? 'الأدوية البودرة التي تُحل بالماء تنتهي صلاحيتها خلال 7 إلى 14 يوماً من الحل، والشراب الجاهز خلال 1 إلى 6 أشهر من الفتح حسب المدون على العبوة.' : 'Reconstituted suspensions expire in 7-14 days; opened syrups expire in 1-6 months.'}</li>
              <li>{isAr ? 'تجنب سكب الأدوية المركزة في الحوض؛ فرّغها في كيس به مادة ماصة وأغلقه جيداً.' : 'Avoid pouring concentrated medicines down the sink; absorb in a sealed bag.'}</li>
            </ul>
          </div>
        )}

        {selectedForm === 'injections' && (
          <div className="subcard stack">
            <h3>💉 {isAr ? 'بروتوكول الحقن وأقلام الأنسولين والسرنجات:' : 'Protocol for Injections, Insulin Pens & Needles:'}</h3>
            <ul>
              <li>{isAr ? 'يُحفظ الأنسولين غير المفتوح في باب الثلاجة (2-8°C) ولا يُجمد أبداً.' : 'Store unopened insulin in the refrigerator door (2-8°C); never freeze.'}</li>
              <li>{isAr ? 'ضع السنون والإبر المستعملة داخل علبة بلاستيكية سميكة محكمة الغلق (Sharps Container) قبل التخلص منها لمنع وخز عمال النظافة.' : 'Place used needles and lancets inside a rigid puncture-resistant plastic container.'}</li>
            </ul>
          </div>
        )}

        {selectedForm === 'topicals' && (
          <div className="subcard stack">
            <h3>🧴 {isAr ? 'بروتوكول قطرات العيون والمراهم:' : 'Protocol for Eye Drops & Ointments:'}</h3>
            <ul>
              <li>{isAr ? 'جميع قطرات ومراهم العيون تنتهي صلاحيتها بعد 28 يوماً من فتح الزجاجة لمنع تلوث العين بالبكتيريا.' : 'All eye drops and ophthalmic ointments expire strictly 28 days after opening.'}</li>
              <li>{isAr ? 'دوّن تاريخ الفتح بالقلم على زجاجة القطرة فور استخدامها لأول مرة.' : 'Always write the opening date directly on the eye drop bottle.'}</li>
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
