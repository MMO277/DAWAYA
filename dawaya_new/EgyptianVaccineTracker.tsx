import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import Disclaimer from './Disclaimer';

export interface VaccineDose {
  ageLabelAr: string;
  ageDaysOffset: number;
  vaccineNameAr: string;
  targetDiseasesAr: string;
  adminRouteAr: string;
  mandatoryStatus: 'mandatory_free' | 'optional_recommended';
  expectedFeverCareAr: string;
  dangerSignsAr: string;
}

export const EGYPTIAN_MANDATORY_VACCINES: VaccineDose[] = [
  {
    ageLabelAr: 'عند الولادة فوراً (خلال أول 24-48 ساعة)',
    ageDaysOffset: 0,
    vaccineNameAr: 'تطعيم الدرن (BCG) + شلل الأطفال سابين (نقط) + كبدي ب للرضع',
    targetDiseasesAr: 'السل الرئوي والدرن، شلل الأطفال، وفيروس التهاب الكبد B',
    adminRouteAr: 'حقن داخل الجلد بالكتف الأيسر (درن) + نقطتين بالفم + حقنة بالفخذ',
    mandatoryStatus: 'mandatory_free',
    expectedFeverCareAr: 'ظهور حبة صغيرة تتحول لدرنة وقشرة بالكتف الأيسر طبيعي تماماً بعد أسبوعين؛ ممنوع وضع مطهر أو لمسها.',
    dangerSignsAr: 'سخونة عالية نادرة؛ ممنوع إعطاء دواء خافض بدون حرارة.',
  },
  {
    ageLabelAr: 'عند إتمام شهرين (الشهر الثاني)',
    ageDaysOffset: 60,
    vaccineNameAr: 'الخماسي (DPT + كبدي ب + هيب) + شلل الأطفال سابين وسولك (حقن ونقط)',
    targetDiseasesAr: 'الدفتيريا، التيتانوس، السعال الديكي، كبدي ب، والإنفلونزا البكتيرية',
    adminRouteAr: 'حقنتان بعضلة الفخذ الأمامية اليمنى واليسرى + نقطتين بالفم',
    mandatoryStatus: 'mandatory_free',
    expectedFeverCareAr: 'سخونة وتورم وألم بمكان الحقنة متوقع لـ 24-48 ساعة؛ كمادات ماء فاتر على الفخذ وباراسيتامول محسوب بالوزن.',
    dangerSignsAr: 'بكاء مستمر صراخي لأكثر من 3 ساعات أو حرارة تتجاوز 39 درجة تستلزم فحص الطبيب.',
  },
  {
    ageLabelAr: 'عند إتمام 4 شهور (الشهر الرابع)',
    ageDaysOffset: 120,
    vaccineNameAr: 'الجرعة الثانية من الخماسي + شلل الأطفال (حقن ونقط)',
    targetDiseasesAr: 'الوقاية الممتدة من الأمراض الخمسة وشلل الأطفال',
    adminRouteAr: 'حقنة بالفخذ الأيمن وحقنة بالفخذ الأيسر + نقط بالفم',
    mandatoryStatus: 'mandatory_free',
    expectedFeverCareAr: 'نفس بروتوكول الشهرين: كمادات فاتر ودواء باراسيتامول حسب وزن الطفل بالسنتي.',
    dangerSignsAr: 'تشنجات حرارية نادرة إذا تُركت الحرارة تتجاوز 39.5 دون خافض.',
  },
  {
    ageLabelAr: 'عند إتمام 6 شهور (الشهر السادس)',
    ageDaysOffset: 180,
    vaccineNameAr: 'الجرعة الثالثة من الخماسي + شلل الأطفال + فيتامين أ (كبسولة 100 ألف وحدة)',
    targetDiseasesAr: 'تثبيت المناعة ضد الأمراض الخمسة وتقوية شبكية العين والمناعة بفيتامين أ',
    adminRouteAr: 'حقنتان بالفخذ + نقط بالفم + إفراغ كبسولة فيتامين أ بالملعقة',
    mandatoryStatus: 'mandatory_free',
    expectedFeverCareAr: 'حرارة خفيفة تهدأ خلال 24 ساعة.',
    dangerSignsAr: 'قيء مستمر يمنع الرضاعة.',
  },
  {
    ageLabelAr: 'عند إتمام 9 شهور (الشهر التاسع)',
    ageDaysOffset: 270,
    vaccineNameAr: 'جرعة شلل الأطفال الفموي (سابين نقط بالفم)',
    targetDiseasesAr: 'شلل الأطفال وتنشيط المناعة المعوية',
    adminRouteAr: 'نقطتان بالفم فقط (بدون أي حقن!)',
    mandatoryStatus: 'mandatory_free',
    expectedFeverCareAr: 'لا يسبب أي سخونة أو ألم إطلاقاً؛ تجنبي الرضاعة الطبيعية فقط نصف ساعة قبل وبعد النقط لضمان الامتصاص.',
    dangerSignsAr: 'لا توجد أعراض جانبية ملحوظة.',
  },
  {
    ageLabelAr: 'عند إتمام 12 شهراً (السنة الأولى)',
    ageDaysOffset: 365,
    vaccineNameAr: 'تطعيم الحصبة والحصبة الألمانية والنكاف (MMR) + شلل الأطفال',
    targetDiseasesAr: 'الحصبة، النكاف (أبو كعب)، والحصبة الألمانية',
    adminRouteAr: 'حقنة تحت الجلد بالذراع الأيمن + نقط بالفم',
    mandatoryStatus: 'mandatory_free',
    expectedFeverCareAr: 'ملاحظة ذهبية: السخونة وطفح خفيف قد يظهران متأخراً بعد 7 إلى 10 أيام من التطعيم وهذا طبيعي جداً.',
    dangerSignsAr: 'صعوبة تنفس أو حساسية شديدة تستلزم استشارة الطبيب.',
  },
  {
    ageLabelAr: 'عند إتمام 18 شهراً (سنة ونصف)',
    ageDaysOffset: 548,
    vaccineNameAr: 'الجرعة المنشطة: الثلاثي البكتيري (DPT) + شلل الأطفال + MMR + فيتامين أ (200 ألف وحدة)',
    targetDiseasesAr: 'تثبيت المناعة طويلة الأمد حتى سن المدرسة',
    adminRouteAr: 'حقنتان + نقط بالفم + كبسولتان فيتامين أ',
    mandatoryStatus: 'mandatory_free',
    expectedFeverCareAr: 'سخونة وتورم مكان الحقنة؛ كمادات ماء فاتر وخافض حرارة.',
    dangerSignsAr: 'تورم يمتد للركبة يستلزم فحص جراحة أطفال.',
  },
];

export const OPTIONAL_RECOMMENDED_VACCINES: Array<{
  nameAr: string;
  recommendedAgeAr: string;
  diseasesAr: string;
  whyCrucialAr: string;
}> = [
  {
    nameAr: 'تطعيم الروتا (Rotavirus)',
    recommendedAgeAr: 'جرعتان أو 3 جرعات بالفم بدءاً من عمر 6 أسابيع حتى 8 شهور',
    diseasesAr: 'فيروس الروتا (السبب الأول للنزلة المعوية الشديدة والجفاف عند الرضع)',
    whyCrucialAr: 'يحمي الطفل من دخول المستشفيات والمحاليل بنسبة تفوق 90%.',
  },
  {
    nameAr: 'تطعيم المكورات الرئوية (Prevenar 13 / Synflorix)',
    recommendedAgeAr: 'عند عمر شهرين، 4 شهور، 6 شهور، وجرعة منشطة عند سنة',
    diseasesAr: 'الالتهاب الرئوي، تسمم الدم، والتهاب السحايا والحمى الشوكية',
    whyCrucialAr: 'يحمي الجهاز التنفسي والأذن الوسطى من البكتيريا الرئوية الشرسة.',
  },
  {
    nameAr: 'تطعيم الجديري المائي (Varicella)',
    recommendedAgeAr: 'جرعة أولى عند عمر سنة، وجرعة ثانية بعد عمر 4 سنوات',
    diseasesAr: 'الجديري المائي والفقاعات المؤلمة والندبات الجلدية',
    whyCrucialAr: 'يمنع العدوى في الحضانة والمدرسة ومضاعفات الجلد.',
  },
  {
    nameAr: 'تطعيم الإنفلونزا الموسمية الرباعي (Flu Vaccine)',
    recommendedAgeAr: 'سنوياً في شهري سبتمبر وأكتوبر لكل الأعمار فوق 6 شهور وكبار السن',
    diseasesAr: 'سلالات الإنفلونزا الشتوية الأربعة ومضاعفات حساسية الصدر',
    whyCrucialAr: 'يقلل دور البرد الشديد ودخول الطوارئ بنسبة 70% لمرضى حساسية الصدر والقلب.',
  },
];

export default function EgyptianVaccineTracker() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [babyBirthDate, setBabyBirthDate] = useState<string>('2026-06-01');
  const [activeTab, setActiveTab] = useState<'mandatory' | 'optional'>('mandatory');

  // Calculate exact calendar dates based on baby birth date
  const calculatedMandatoryDoses = useMemo(() => {
    const base = new Date(babyBirthDate);
    if (isNaN(base.getTime())) return EGYPTIAN_MANDATORY_VACCINES;

    return EGYPTIAN_MANDATORY_VACCINES.map((v) => {
      const targetDate = new Date(base.getTime() + v.ageDaysOffset * 24 * 60 * 60 * 1000);
      const formattedDate = targetDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const now = Date.now();
      const isPast = targetDate.getTime() < now;
      const isDueSoon = !isPast && targetDate.getTime() - now < 14 * 24 * 60 * 60 * 1000;

      return {
        ...v,
        formattedDate,
        isPast,
        isDueSoon,
      };
    });
  }, [babyBirthDate, isAr]);

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #047857 55%, #10b981 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '20px',
          boxShadow: '0 14px 34px rgba(13, 31, 56, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#d1fae5' }}>
            💉 {tr(lang, 'رادار وحاسبة مواعيد تطعيمات وزارة الصحة المصرية الإلزامية والإضافية', 'Egyptian Ministry of Health Mandatory & Optional Vaccine Tracker')}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/baby-first-year" className="btn small" style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
              👶 {tr(lang, 'دليل أول سنة مع طفلك', 'Baby 1st Year Guide')}
            </Link>
            <Link to="/pediatric-helper" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
              ⚖️ {tr(lang, 'حاسبة جرعات الأطفال بالوزن', 'Pediatric Doser')}
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
          {tr(lang, 'احسبي مواعيد تطعيمات طفلك باليوم والساعة 👈 مع خطة إسعاف السخونية والتورم!', 'Calculate Exact Vaccine Dates by Child Birthdate + Fever Care Protocols')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
          {tr(
            lang,
            'أدخلي تاريخ ميلاد طفلك ليحسب لك النظام فوراً مواعيد جميع تطعيمات مكاتب الصحة الإلزامية المجانية حتى عمر 18 شهراً، مع التطعيمات الإضافية الهامة (الروتا والمكورات) وكيفية التعامل مع الحرارة بأمان.',
            'Enter your baby’s birth date to calculate exact calendar dates for all Egyptian Ministry of Health vaccines through 18 months, with fever management and optional vaccines.'
          )}
        </p>
      </section>

      {/* Date Picker Input Card */}
      <section
        className="card"
        style={{
          borderRadius: '20px',
          background: '#ffffff',
          border: '2px solid #10b981',
          padding: '22px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <label style={{ display: 'block', color: '#0D1F38', fontWeight: 900, fontSize: '1.1rem', marginBottom: '4px' }}>
            📅 اختاري تاريخ ميلاد طفلك:
          </label>
          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
            سيتم حساب تاريخ كل تطعيم باليوم والشهر والسنة في الجدول بالأسفل
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="date"
            value={babyBirthDate}
            onChange={(e) => setBabyBirthDate(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '2px solid #0f766e',
              fontSize: '1.05rem',
              fontWeight: 900,
              color: '#0D1F38',
            }}
          />
        </div>
      </section>

      {/* Tab Switcher: Mandatory vs Optional */}
      <section style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('mandatory')}
          style={{
            flex: '1 1 240px',
            padding: '14px 18px',
            borderRadius: '16px',
            border: activeTab === 'mandatory' ? '2.5px solid #059669' : '1.5px solid #cbd5e1',
            background: activeTab === 'mandatory' ? 'linear-gradient(135deg, #0D1F38 0%, #059669 100%)' : '#ffffff',
            color: activeTab === 'mandatory' ? '#ffffff' : '#0D1F38',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          🏛️ ١. جدول تطعيمات مكاتب الصحة الإلزامية المجانية (7 جرعات حتى 18 شهراً)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('optional')}
          style={{
            flex: '1 1 240px',
            padding: '14px 18px',
            borderRadius: '16px',
            border: activeTab === 'optional' ? '2.5px solid #059669' : '1.5px solid #cbd5e1',
            background: activeTab === 'optional' ? 'linear-gradient(135deg, #0D1F38 0%, #059669 100%)' : '#ffffff',
            color: activeTab === 'optional' ? '#ffffff' : '#0D1F38',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          🛡️ ٢. التطعيمات الإضافية الهامة الموصى بها (الروتا، المكورات، الإنفلونزا)
        </button>
      </section>

      {/* Mandatory Vaccines View */}
      {activeTab === 'mandatory' && (
        <section style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          {calculatedMandatoryDoses.map((dose, idx) => (
            <article
              key={idx}
              className="card"
              style={{
                borderRadius: '20px',
                border: dose.isDueSoon ? '2.5px solid #f59e0b' : '1.5px solid #cbd5e1',
                padding: '20px',
                background: dose.isPast ? '#f8fafc' : '#ffffff',
                boxShadow: '0 6px 18px rgba(13, 31, 56, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>💉</span>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e' }}>{dose.ageLabelAr}</span>
                    <h3 style={{ margin: '2px 0 0', color: '#0D1F38', fontSize: '1.2rem', fontWeight: 900 }}>
                      {dose.vaccineNameAr}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: '14px',
                      background: dose.isPast ? '#e2e8f0' : dose.isDueSoon ? '#fef3c7' : '#dcfce7',
                      color: dose.isPast ? '#475569' : dose.isDueSoon ? '#92400e' : '#166534',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                    }}
                  >
                    📅 التاريخ المحسوب: {dose.formattedDate}
                  </span>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => speakText(`${dose.ageLabelAr}. ${dose.vaccineNameAr}. ${dose.expectedFeverCareAr}`, lang)}
                  >
                    🔊 استمع
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>
                <div style={{ background: '#f0fdf4', borderRight: '4px solid #10b981', padding: '12px 14px', borderRadius: '12px' }}>
                  <strong style={{ color: '#065f46', fontSize: '0.88rem', display: 'block', marginBottom: '4px' }}>
                    🌡️ خطة التعامل مع السخونية ومكان الحقنة:
                  </strong>
                  <span style={{ color: '#1e293b', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {dose.expectedFeverCareAr}
                  </span>
                </div>

                <div style={{ background: '#fef2f2', borderRight: '4px solid #ef4444', padding: '12px 14px', borderRadius: '12px' }}>
                  <strong style={{ color: '#991b1b', fontSize: '0.88rem', display: 'block', marginBottom: '4px' }}>
                    🚨 علامات خطر غير طبيعية:
                  </strong>
                  <span style={{ color: '#7f1d1d', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {dose.dangerSignsAr}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: '#475569' }}>
                <span>طريقة الإعطاء: <b>{dose.adminRouteAr}</b></span>
                <span style={{ color: '#0f766e', fontWeight: 800 }}>الأمراض المستهدفة: {dose.targetDiseasesAr}</span>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Optional Vaccines View */}
      {activeTab === 'optional' && (
        <section style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          {OPTIONAL_RECOMMENDED_VACCINES.map((op, i) => (
            <article
              key={i}
              className="card"
              style={{
                borderRadius: '20px',
                border: '1.5px solid #93c5fd',
                padding: '20px',
                background: '#ffffff',
                boxShadow: '0 6px 18px rgba(13, 31, 56, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.2rem', fontWeight: 900 }}>
                  🛡️ {op.nameAr}
                </h3>
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: 800 }}>
                  {op.recommendedAgeAr}
                </span>
              </div>
              <p style={{ margin: '0 0 10px', color: '#334155', fontSize: '0.92rem', lineHeight: 1.65 }}>
                <b>الأمراض التي يقي منها:</b> {op.diseasesAr}
              </p>
              <div style={{ background: '#eff6ff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #bfdbfe', fontSize: '0.88rem', color: '#1e3a8a' }}>
                💡 <b>لماذا يُوصى به بشدة؟</b> {op.whyCrucialAr}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Pediatric Dose Alarm Quick Link */}
      <section
        className="card"
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e3a5f 100%)',
          color: '#ffffff',
          padding: '22px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 900, color: '#fde047' }}>
              ⚖️ طفلك سخن بعد التطعيم؟ احسبي جرعة السيتال والباراسيتامول بدقة!
            </h3>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              ممنوع إعطاء خافض حرارة بالبركة؛ استخدمي حاسبة دوايا لحساب الجرعة بالسنتي (مل) بالسرنجة الفموية حسب وزن طفلك بدقة.
            </p>
          </div>
          <Link
            to="/pediatric-helper"
            className="btn"
            style={{
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 900,
              borderRadius: '14px',
              textDecoration: 'none',
              padding: '10px 18px',
            }}
          >
            ⚖️ افتحي حاسبة جرعات الأطفال بالوزن ←
          </Link>
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
