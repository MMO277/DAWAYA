import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import { speakText } from './speechService';
import {
  analyzeUploadedMedicalDocument,
  compressMedicalImageFile,
  validateMedicalUploadFile,
} from './aiDocumentProcessor';
import Disclaimer from './Disclaimer';

export interface LabMetricDef {
  id: string;
  code: string;
  nameAr: string;
  unit: string;
  minNormal: number;
  maxNormal: number;
  criticalLow: number;
  criticalHigh: number;
  lowMeaningAr: string;
  highMeaningAr: string;
  normalMeaningAr: string;
  targetClinicRoute: string;
  targetClinicLabelAr: string;
}

export const LAB_METRICS_CATALOG: LabMetricDef[] = [
  {
    id: 'hb',
    code: 'Hemoglobin (Hb)',
    nameAr: 'نسبة الهيموجلوبين بالدم (الأنيميا)',
    unit: 'g/dL',
    minNormal: 12.0,
    maxNormal: 16.5,
    criticalLow: 7.5,
    criticalHigh: 19.0,
    lowMeaningAr: 'يدل على وجود أنيميا؛ افحص مخزون الحديد (Ferritin) وحجم الكرات (MCV) لتحديد نوع الأنيميا قبل أخذ الحديد.',
    highMeaningAr: 'ارتفاع الهيموجلوبين قد ينتج عن التدخين، الجفاف، أو نقص الأكسجين المزمن.',
    normalMeaningAr: 'نسبة الهيموجلوبين ممتازة وتنقل الأكسجين لأنسجة الجسم بكفاءة.',
    targetClinicRoute: '/lab-clinic',
    targetClinicLabelAr: '🔬 عيادة التحاليل والأنيميا',
  },
  {
    id: 'ferritin',
    code: 'Serum Ferritin',
    nameAr: 'مخزون الحديد الاستراتيجي (Ferritin)',
    unit: 'ng/mL',
    minNormal: 30,
    maxNormal: 200,
    criticalLow: 10,
    criticalHigh: 500,
    lowMeaningAr: 'نقص مخزون الحديد هو السبب الأول لسقوط الشعر الغزير، الإرهاق، والدوخة حتى لو كان الهيموجلوبين طبيعياً!',
    highMeaningAr: 'ارتفاع الفيريتين قد يحدث مع الالتهابات النشطة أو تشبع الحديد.',
    normalMeaningAr: 'مخزون الحديد مثالي لبصيلات الشعر والنشاط البدني (أفضل رقم للشعر فوق 50).',
    targetClinicRoute: '/hair-clinic',
    targetClinicLabelAr: '💇‍♀️ عيادة الشعر ومخزون الحديد',
  },
  {
    id: 'hba1c',
    code: 'HbA1c',
    nameAr: 'السكر التراكمي لآخر 3 شهور (HbA1c)',
    unit: '%',
    minNormal: 4.0,
    maxNormal: 5.6,
    criticalLow: 3.5,
    criticalHigh: 9.0,
    lowMeaningAr: 'منخفض (تأكد من عدم حدوث نوبات هبوط سكر متكررة أو أنيميا تكسيرية).',
    highMeaningAr: 'من 5.7% إلى 6.4% مرحلة ما قبل السكري ومقاومة أنسولين؛ ومن 6.5% فأكثر يشخص السكري ويحتاج ضبط العلاج والغذاء.',
    normalMeaningAr: 'مستوى السكر التراكمي طبيعي تماماً ولا يوجد سكري.',
    targetClinicRoute: '/chronic-clinic',
    targetClinicNameAr: '',
    targetClinicLabelAr: '🫀 عيادة السكر والباطنة',
  } as any,
  {
    id: 'tsh',
    code: 'TSH',
    nameAr: 'هرمون الغدة الدرقية المحفز (TSH)',
    unit: 'mIU/L',
    minNormal: 0.4,
    maxNormal: 4.5,
    criticalLow: 0.1,
    criticalHigh: 10.0,
    lowMeaningAr: 'انخفاض TSH يشير إلى «فرط نشاط الغدة الدرقية» (خفقان، عصبية، نقص وزن) أو جرعة إلتروكسين زائدة.',
    highMeaningAr: 'ارتفاع TSH يشير إلى «كسل وخمول الغدة الدرقية» (زيادة وزن، خمول، برودة، إمساك، سقوط شعر).',
    normalMeaningAr: 'نشاط الغدة الدرقية متوازن ومثالي.',
    targetClinicRoute: '/chronic-clinic',
    targetClinicLabelAr: '🦋 عيادة الغدة الدرقية والباطنة',
  },
  {
    id: 'creatinine',
    code: 'Serum Creatinine',
    nameAr: 'وظائف الكلى (الكرياتينين بالدم)',
    unit: 'mg/dL',
    minNormal: 0.6,
    maxNormal: 1.2,
    criticalLow: 0.3,
    criticalHigh: 2.5,
    lowMeaningAr: 'طبيعي أو ناتج عن ضعف الكتلة العضلية أو الحمل.',
    highMeaningAr: 'ارتفاع الكرياتينين يدل على إجهاد أو قصور في وظائف الكلى؛ أوقف المسكنات فوراً واحسب معدل فلترة الكلى (eGFR).',
    normalMeaningAr: 'وظيفة فلترة الكلى في النطاق الطبيعي الآمن.',
    targetClinicRoute: '/urology-clinic',
    targetClinicLabelAr: '🧪 عيادة الكلى وحاسبة eGFR',
  },
  {
    id: 'uric_acid',
    code: 'Serum Uric Acid',
    nameAr: 'حمض اليوريك بالدم (النقرس)',
    unit: 'mg/dL',
    minNormal: 3.4,
    maxNormal: 7.0,
    criticalLow: 2.0,
    criticalHigh: 9.5,
    lowMeaningAr: 'في النطاق المنخفض الآمن.',
    highMeaningAr: 'ارتفاع حمض اليوريك يترسب في مفصل إصبع القدم الأكبر والكعب والكلى؛ اشرب 3 لتر ماء وقلل اللحوم الحمراء والمياه الغازية.',
    normalMeaningAr: 'مستوى حمض اليوريك طبيعي ومثالي للمفاصل والكلى.',
    targetClinicRoute: '/ortho-clinic',
    targetClinicLabelAr: '🦴 عيادة العظام والنقرس',
  },
  {
    id: 'vit_d',
    code: '25-OH Vitamin D',
    nameAr: 'مستوى فيتامين د بالدم (Vitamin D)',
    unit: 'ng/mL',
    minNormal: 30,
    maxNormal: 100,
    criticalLow: 12,
    criticalHigh: 120,
    lowMeaningAr: 'نقص فيتامين د يسبب آلام العظام والعضلات والخمول وضعف المناعة؛ يحتاج جرعة تعويضية تُؤخذ بعد وجبة تحتوي على دهون صحية.',
    highMeaningAr: 'ارتفاع زائد في فيتامين د (أوقف المكملات حتى لا يرتفع الكالسيوم في الدم والكلى).',
    normalMeaningAr: 'مستوى فيتامين د ممتاز لصحة العظام والمناعة.',
    targetClinicRoute: '/ortho-clinic',
    targetClinicLabelAr: '🦴 عيادة العظام وفيتامين د',
  },
  {
    id: 'alt',
    code: 'ALT (SGPT)',
    nameAr: 'إنزيم الكبد الأساسي (ALT / SGPT)',
    unit: 'U/L',
    minNormal: 7,
    maxNormal: 45,
    criticalLow: 0,
    criticalHigh: 150,
    lowMeaningAr: 'إنزيمات الكبد هادئة وطبيعية.',
    highMeaningAr: 'ارتفاع إنزيم الكبد يدل على إجهاد خلايا الكبد (بسبب الكبد الدهني، بعض الأدوية والمسكنات، أو التهاب فيروسي).',
    normalMeaningAr: 'خلايا الكبد سليمة وإنزيماتها في المعدل الطبيعي.',
    targetClinicRoute: '/gastro-clinic',
    targetClinicLabelAr: '🦠 عيادة الجهاز الهضمي والكبد',
  },
];

export default function SmartLabAndRxPhotoScanner() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Interactive Lab Values State
  const [values, setValues] = useState<Record<string, string>>({
    hb: '10.4',
    ferritin: '14',
    hba1c: '6.8',
    tsh: '5.9',
    creatinine: '1.1',
    uric_acid: '7.8',
    vit_d: '16',
    alt: '32',
  });

  // Camera / Photo Upload State
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(null);
  const [extractedMeds, setExtractedMeds] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const applyPreset = (preset: 'anemia_thyroid' | 'diabetes_kidney' | 'all_normal') => {
    if (preset === 'anemia_thyroid') {
      setValues({
        hb: '10.2',
        ferritin: '11',
        hba1c: '5.2',
        tsh: '6.4',
        creatinine: '0.8',
        uric_acid: '5.1',
        vit_d: '14',
        alt: '24',
      });
    } else if (preset === 'diabetes_kidney') {
      setValues({
        hb: '12.8',
        ferritin: '65',
        hba1c: '8.1',
        tsh: '2.1',
        creatinine: '1.7',
        uric_acid: '8.6',
        vit_d: '22',
        alt: '58',
      });
    } else {
      setValues({
        hb: '13.8',
        ferritin: '75',
        hba1c: '5.1',
        tsh: '1.9',
        creatinine: '0.9',
        uric_acid: '5.2',
        vit_d: '45',
        alt: '22',
      });
    }
  };

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validateMedicalUploadFile(file);
    if (!validation.valid) {
      setPhotoError(isAr ? validation.errorAr : validation.errorEn);
      return;
    }

    setPhotoError(null);
    setScanningPhoto(true);
    try {
      const compressed = await compressMedicalImageFile(file);
      setPhotoPreviewUrl(compressed.previewDataUrl);
      const analysis = await analyzeUploadedMedicalDocument({
        base64Data: compressed.base64Data,
        previewDataUrl: compressed.previewDataUrl,
        fileName: validation.sanitizedFileName,
        mimeType: compressed.mimeType,
        fileSize: compressed.compressedSize,
        lang,
      });
      setAiSummaryText(isAr ? analysis.extractedSummaryAr : analysis.extractedSummaryEn);
      setExtractedMeds(
        (analysis.extractedPrescriptions || []).map(
          (rx) => `${rx.medicineName} ${rx.dosageText ? `(${rx.dosageText})` : ''}`
        )
      );
    } catch {
      setPhotoError(
        isAr
          ? 'تم عرض الصورة بنجاح؛ يمكنك مراجعة الأرقام في المؤشرات التفاعلية بالأسفل أو إعادة التصوير في إضاءة أوضح.'
          : 'Image loaded. You can enter or verify any numeric lab values in the interactive gauges below.'
      );
    } finally {
      setScanningPhoto(false);
    }
  }

  const evaluatedMetrics = useMemo(() => {
    return LAB_METRICS_CATALOG.map((m) => {
      const raw = parseFloat(values[m.id] || '');
      const val = isNaN(raw) ? m.minNormal : raw;
      let status: 'normal' | 'borderline' | 'critical' = 'normal';
      if (val < m.criticalLow || val > m.criticalHigh) {
        status = 'critical';
      } else if (val < m.minNormal || val > m.maxNormal) {
        status = 'borderline';
      }
      const isLow = val < m.minNormal;
      const isHigh = val > m.maxNormal;
      const meaningAr = isLow ? m.lowMeaningAr : isHigh ? m.highMeaningAr : m.normalMeaningAr;

      // Gauge percentage (0 to 100%)
      const span = m.criticalHigh - m.criticalLow || 10;
      const pct = Math.max(4, Math.min(96, Math.round(((val - m.criticalLow) / span) * 100)));

      return {
        ...m,
        val,
        status,
        isLow,
        isHigh,
        meaningAr,
        pct,
      };
    });
  }, [values]);

  const abnormalCount = evaluatedMetrics.filter((m) => m.status !== 'normal').length;

  return (
    <main className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
      {/* Hero Header */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0D1F38 0%, #1e40af 55%, #2563eb 100%)',
          color: '#ffffff',
          borderRadius: '22px',
          padding: '28px 24px',
          marginBottom: '20px',
          boxShadow: '0 14px 32px rgba(13, 31, 56, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800, color: '#dbeafe' }}>
            📸 {tr(lang, 'الماسح الذكي لورق التحاليل والروشتات بالمؤشرات الملونة', 'Smart AI Lab Report & Prescription Photo Scanner')}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/lab-clinic" className="btn small" style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 800, textDecoration: 'none', borderRadius: '20px' }}>
              🔬 {tr(lang, 'عيادة التحاليل الكاملة', 'Full Lab Clinic')}
            </Link>
            <Link to="/prescription-radar" className="btn small" style={{ background: '#CFD29D', color: '#0D1F38', fontWeight: 900, textDecoration: 'none', borderRadius: '20px' }}>
              📡 {tr(lang, 'رادار الروشتات', 'Prescription Radar')}
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '6px 0 8px', color: '#ffffff' }}>
          {tr(lang, 'صوّر ورقة التحليل أو الروشتة بالكاميرا 👈 أو أدخل أرقامك لقراءتها بالألوان فوراً!', 'Snap Your Lab Report or Prescription — Or Enter Values for Instant Color-Coded Gauges')}
        </h1>
        <p style={{ margin: 0, opacity: 0.94, lineHeight: 1.65, maxWidth: '880px' }}>
          {tr(
            lang,
            'يقوم المحرك الذكي بقراءة صورة ورقة التحليل أو الروشتة، ويحول الأرقام المعقدة إلى مؤشرات بصرية ملونة (أخضر طبيعي، أصفر يحتاج متابعة، أحمر يستلزم تدخلاً طبياً) مع شرح كل رقم باللغة العربية البسيطة.',
            'Upload a photo of your lab report or prescription or adjust the live sliders below to get instant visual gauges, plain-Arabic interpretations, and specialty clinic links.'
          )}
        </p>
      </section>

      {/* Camera / Image Upload Card */}
      <section
        className="card"
        style={{
          borderRadius: '20px',
          border: '2px dashed #3b82f6',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          padding: '22px',
          marginBottom: '22px',
          textAlign: 'center',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />

        <div style={{ fontSize: '2.6rem', marginBottom: '6px' }}>📷📄</div>
        <h2 style={{ margin: '0 0 6px', color: '#0D1F38', fontSize: '1.25rem', fontWeight: 900 }}>
          {tr(lang, 'الخطوة ١: صوّر ورقة التحليل الطبي أو الروشتة بالموبايل', 'Step 1: Snap or Upload a Lab Report / Prescription Photo')}
        </h2>
        <p className="small muted" style={{ maxWidth: '640px', margin: '0 auto 14px' }}>
          يدعم قراءة صور تحاليل الدم (CBC, TSH, HbA1c, Ferritin, Creatinine) وصور الروشتات الطبية واستخراج الأدوية منها تلقائياً.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={scanningPhoto}
            onClick={() => fileInputRef.current?.click()}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #138866 100%)',
              color: '#ffffff',
              fontWeight: 900,
              padding: '12px 24px',
              borderRadius: '16px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            {scanningPhoto ? '⏳ جارٍ قراءة وتحليل الصورة بالذكاء الاصطناعي...' : '📸 افتح الكاميرا أو ارفع صورة التحليل / الروشتة'}
          </button>
        </div>

        {photoError && (
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
            ℹ️ {photoError}
          </div>
        )}

        {photoPreviewUrl && (
          <div style={{ marginTop: '18px', textAlign: 'right', background: '#ffffff', padding: '18px', borderRadius: '16px', border: '1.5px solid #93c5fd' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'start' }}>
              <div>
                <img
                  src={photoPreviewUrl}
                  alt="صورة المستند المرفوع"
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#0D1F38', fontWeight: 900 }}>
                  ✨ نتيجة القراءة الذكية للصورة:
                </h3>
                {aiSummaryText ? (
                  <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: '#1e293b', margin: '0 0 12px' }}>
                    {aiSummaryText}
                  </p>
                ) : (
                  <p className="muted">جارٍ استخراج البيانات...</p>
                )}

                {extractedMeds.length > 0 && (
                  <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', border: '1px solid #86efac' }}>
                    <strong style={{ color: '#166534', display: 'block', marginBottom: '6px' }}>
                      💊 الأدوية المستخرجة من الصورة:
                    </strong>
                    <ul style={{ margin: 0, paddingRight: '18px', color: '#0D1F38', fontWeight: 700 }}>
                      {extractedMeds.map((med, i) => (
                        <li key={i}>{med}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Interactive Color-Coded Lab Gauges */}
      <section className="card" style={{ borderRadius: '20px', padding: '22px', border: '1.5px solid #cbd5e1', marginBottom: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', color: '#0D1F38', fontSize: '1.3rem', fontWeight: 900 }}>
              📊 المؤشرات البصرية الملونة لأهم 8 تحاليل طبية (غيّر أي رقم لترى النتيجة فوراً!)
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              ملخص تقريرك الحالي: يوجد <b>{abnormalCount}</b> مؤشرات خارج النطاق الطبيعي تحتاج انتباهك.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyPreset('anemia_thyroid')}
              className="chip"
              style={{ fontWeight: 800, background: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5' }}
            >
              🧪 مثال ١: أنيميا + خمول غدة + نقص فيتامين د
            </button>
            <button
              type="button"
              onClick={() => applyPreset('diabetes_kidney')}
              className="chip"
              style={{ fontWeight: 800, background: '#fffbeb', color: '#92400e', borderColor: '#fcd34d' }}
            >
              🧪 مثال ٢: سكر تراكمي + إجهاد كلى ونقرس
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all_normal')}
              className="chip"
              style={{ fontWeight: 800, background: '#f0fdf4', color: '#166534', borderColor: '#86efac' }}
            >
              🟢 مثال ٣: تحاليل مثالية بالكامل
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {evaluatedMetrics.map((m) => {
            const badgeBg =
              m.status === 'critical' ? '#fee2e2' : m.status === 'borderline' ? '#fef3c7' : '#dcfce7';
            const badgeColor =
              m.status === 'critical' ? '#991b1b' : m.status === 'borderline' ? '#92400e' : '#166534';
            const barColor =
              m.status === 'critical' ? '#dc2626' : m.status === 'borderline' ? '#f59e0b' : '#16a34a';

            return (
              <div
                key={m.id}
                style={{
                  borderRadius: '16px',
                  border: `2px solid ${m.status === 'normal' ? '#bbf7d0' : m.status === 'borderline' ? '#fde68a' : '#fecaca'}`,
                  background: '#ffffff',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b' }}>{m.code}</div>
                    <strong style={{ color: '#0D1F38', fontSize: '0.98rem' }}>{m.nameAr}</strong>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '14px',
                      background: badgeBg,
                      color: badgeColor,
                      fontWeight: 900,
                      fontSize: '0.76rem',
                    }}
                  >
                    {m.status === 'normal'
                      ? '🟢 طبيعي'
                      : m.isLow
                      ? '🔴 منخفض عن الطبيعي'
                      : '🔴 مرتفع عن الطبيعي'}
                  </span>
                </div>

                {/* Numeric Input + Normal Range */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="0.1"
                      value={values[m.id] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      style={{
                        width: '90px',
                        padding: '7px 10px',
                        borderRadius: '10px',
                        border: `2px solid ${barColor}`,
                        fontWeight: 900,
                        fontSize: '1.05rem',
                        color: '#0D1F38',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569' }}>{m.unit}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                    المعدل الطبيعي: <b>{m.minNormal} – {m.maxNormal}</b> {m.unit}
                  </div>
                </div>

                {/* Visual Color Gauge Bar */}
                <div
                  style={{
                    position: 'relative',
                    height: '12px',
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #fca5a5 0%, #86efac 30%, #86efac 70%, #fca5a5 100%)',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: `${m.pct}%`,
                      transform: 'translateX(-50%)',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: barColor,
                      border: '3px solid #ffffff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}
                    title={`${m.val} ${m.unit}`}
                  />
                </div>

                <p style={{ margin: '0 0 10px', fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.6 }}>
                  {m.meaningAr}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link
                    to={m.targetClinicRoute}
                    style={{ fontSize: '0.82rem', fontWeight: 900, color: '#138866', textDecoration: 'none' }}
                  >
                    {m.targetClinicLabelAr} ←
                  </Link>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => speakText(`${m.nameAr}: الرقم ${m.val} ${m.unit}. ${m.meaningAr}`, lang)}
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                  >
                    🔊
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
