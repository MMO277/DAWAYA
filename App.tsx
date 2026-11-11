import { ComponentType, lazy, Suspense, useEffect } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { configured } from './firebase';
import { useLang } from './i18n';
import Layout from './Layout';
import { AuthProvider } from './authContext';
import { EmergencyLocationProvider } from './emergencyLocation';
import AuthModal from './AuthModal';
import Home from './Home';
import { startPartnerEcosystemSync } from './partnerService';
import { ensureDawayaDatabaseLoaded } from './dawayaDrugDatabaseService';

/**
 * Offline-safe & OTA-safe lazy loader.
 * Splits the bundle into small chunks for 5x faster initial startup while avoiding infinite reload loops when offline.
 */
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err) => {
      if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
        const key = 'aa_chunk_retry_reloaded';
        const hasReloaded = sessionStorage.getItem(key) === '1';
        if (!hasReloaded) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem(key);
      }
      throw err;
    })
  );
}

// Lazy-loaded clinical tools, directories & pages
const HomeMedicineCabinet = lazyWithRetry(() => import('./HomeMedicineCabinet'));
const RamadanFastingClock = lazyWithRetry(() => import('./RamadanFastingClock'));
const TravelMedKit = lazyWithRetry(() => import('./TravelMedKit'));
const PatientDashboard = lazyWithRetry(() => import('./PatientDashboard'));
const OneClickCheckup = lazyWithRetry(() => import('./OneClickCheckup'));
const PrescriptionRadar = lazyWithRetry(() => import('./PrescriptionRadar'));
const AwarenessWeek = lazyWithRetry(() => import('./AwarenessWeek'));
const GreenPrescription = lazyWithRetry(() => import('./GreenPrescription'));
const CompareDrugs = lazyWithRetry(() => import('./CompareDrugs'));
const SafeDisposal = lazyWithRetry(() => import('./SafeDisposal'));
const PediatricHelper = lazyWithRetry(() => import('./PediatricHelper'));
const HealthProfile = lazyWithRetry(() => import('./HealthProfile'));
const AllergyChecker = lazyWithRetry(() => import('./AllergyChecker'));
const ListenLearn = lazyWithRetry(() => import('./ListenLearn'));
const Tracker = lazyWithRetry(() => import('./Tracker'));
const SideEffectsGuide = lazyWithRetry(() => import('./SideEffectsGuide'));
const Interactions = lazyWithRetry(() => import('./Interactions'));
const CostSaver = lazyWithRetry(() => import('./CostSaver'));
const ColdShotWarning = lazyWithRetry(() => import('./ColdShotWarning'));
const DailyScheduleGenerator = lazyWithRetry(() => import('./DailyScheduleGenerator'));
const SmartPassport = lazyWithRetry(() => import('./SmartPassport'));
const PassportView = lazyWithRetry(() => import('./PassportView'));
const Medicines = lazyWithRetry(() => import('./Medicines'));
const MedicinePage = lazyWithRetry(() => import('./MedicinePage'));
const Articles = lazyWithRetry(() => import('./Articles'));
const ArticlePage = lazyWithRetry(() =>
  import('./Articles').then((m) => ({ default: m.ArticlePage }))
);
const Quiz = lazyWithRetry(() => import('./Quiz'));
const Scan = lazyWithRetry(() => import('./Scan'));
const Learn = lazyWithRetry(() => import('./Learn'));
const Assistant = lazyWithRetry(() => import('./Assistant'));
const MythFact = lazyWithRetry(() => import('./MythFact'));
const ClinicalNutritionClinic = lazyWithRetry(() => import('./ClinicalNutritionClinic'));
const WomensHealthClinic = lazyWithRetry(() => import('./WomensHealthClinic'));
const GeriatricCareClinic = lazyWithRetry(() => import('./GeriatricCareClinic'));
const HairSkincareClinic = lazyWithRetry(() => import('./HairSkincareClinic'));
const ChestRespiratoryClinic = lazyWithRetry(() => import('./ChestRespiratoryClinic'));
const InteractiveBodyMap = lazyWithRetry(() => import('./InteractiveBodyMap'));
const FoodDrugInteractionChecker = lazyWithRetry(() => import('./FoodDrugInteractionChecker'));
const SmartLabAndRxPhotoScanner = lazyWithRetry(() => import('./SmartLabAndRxPhotoScanner'));
const VisualBodyDrugSimulator = lazyWithRetry(() => import('./VisualBodyDrugSimulator'));
const ChronicMealPlanner = lazyWithRetry(() => import('./ChronicMealPlanner'));
const ComprehensiveMedicalReport = lazyWithRetry(() => import('./ComprehensiveMedicalReport'));
const MissedDoseRescueSolver = lazyWithRetry(() => import('./MissedDoseRescueSolver'));
const DoctorVisitPrep = lazyWithRetry(() => import('./DoctorVisitPrep'));
const EgyptianVaccineTracker = lazyWithRetry(() => import('./EgyptianVaccineTracker'));

const SmartSymptomTriage = lazyWithRetry(() => import('./SmartSymptomTriage'));
const OphthalmologyClinic = lazyWithRetry(() => import('./OphthalmologyClinic'));
const EntClinic = lazyWithRetry(() => import('./EntClinic'));
const LabTestDecoderClinic = lazyWithRetry(() => import('./LabTestDecoderClinic'));
const UrologyRenalClinic = lazyWithRetry(() => import('./UrologyRenalClinic'));
const NeurologyClinic = lazyWithRetry(() => import('./NeurologyClinic'));
const PoisonFirstAidClinic = lazyWithRetry(() => import('./PoisonFirstAidClinic'));
const SpecialtyClinicsHub = lazyWithRetry(() => import('./SpecialtyClinicsHub'));
const OrthopedicsClinic = lazyWithRetry(() => import('./OrthopedicsClinic'));
const GastroClinic = lazyWithRetry(() => import('./GastroClinic'));
const DermatologyClinic = lazyWithRetry(() => import('./DermatologyClinic'));
const DentalEmergencyClinic = lazyWithRetry(() => import('./DentalEmergencyClinic'));
const G6pdFavismClinic = lazyWithRetry(() => import('./G6pdFavismClinic'));
const ChronicCareClinic = lazyWithRetry(() => import('./ChronicCareClinic'));
const NewbornFirstYearGuide = lazyWithRetry(() => import('./NewbornFirstYearGuide'));
const PregnancySafetyNavigator = lazyWithRetry(() => import('./PregnancySafetyNavigator'));
const AirportBannedMedsScanner = lazyWithRetry(() => import('./AirportBannedMedsScanner'));
const BabyMilkFormulaNavigator = lazyWithRetry(() => import('./BabyMilkFormulaNavigator'));
const SeniorPillVisualIdentifier = lazyWithRetry(() => import('./SeniorPillVisualIdentifier'));
const SteroidTaperingCalendar = lazyWithRetry(() => import('./SteroidTaperingCalendar'));
const HypoRescuePlan = lazyWithRetry(() => import('./HypoRescuePlan'));
const InhalerDoseCounter = lazyWithRetry(() => import('./InhalerDoseCounter'));
const Methodology = lazyWithRetry(() => import('./Methodology'));
const Research = lazyWithRetry(() => import('./Research'));
const Dashboard = lazyWithRetry(() => import('./Dashboard'));
const Editor = lazyWithRetry(() => import('./Editor'));
const PartnersDirectoryPage = lazyWithRetry(() => import('./PartnersDirectory'));
const PharmacyOwnerDashboard = lazyWithRetry(() => import('./PharmacyOwnerDashboard'));
const PartnerPublicProfilePage = lazyWithRetry(() =>
  import('./PartnersDirectory').then((m) => ({ default: m.PartnerPublicProfilePage }))
);

// Lazy-loaded 2D & 3D WebGL Games (keeps Three.js 650KB out of the initial startup bundle)
const GameCenter = lazyWithRetry(() => import('./GameCenter'));
const BacteriaHunter = lazyWithRetry(() => import('./BacteriaHunter'));
const OpenWorldGame = lazyWithRetry(() => import('./OpenWorldGame'));
const MedicalSimulator = lazyWithRetry(() => import('./MedicalSimulator'));
const NurseAcademy = lazyWithRetry(() => import('./NurseAcademy'));
const MedicalMystery = lazyWithRetry(() => import('./MedicalMystery'));
const BacteriaLab = lazyWithRetry(() => import('./BacteriaLab'));
const EmergencyShift = lazyWithRetry(() => import('./EmergencyShift'));
const EscapeTheLab = lazyWithRetry(() => import('./EscapeTheLab'));

function ConfigMissing() {
  const { t } = useLang();
  return (
    <main className="wrap narrow">
      <div className="card">
        <h1>Firebase is not configured</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code>, paste your Firebase web app values, then restart{' '}
          <code>npm run dev</code>.
        </p>
        <p dir="rtl">
          لوحة الإدارة تتطلب إعدادات Firebase. انسخ الملف <code>.env.example</code> إلى <code>.env.local</code> وأدخل القيم ثم أعد التشغيل.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn">{t('navHome')}</Link>
        </p>
      </div>
    </main>
  );
}

function PageLoadingFallback() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="card center" style={{ padding: '32px 20px', opacity: 0.9 }}>
        <div style={{ fontSize: '1.9rem', marginBottom: '8px' }} aria-hidden="true">⚡</div>
        <b style={{ display: 'block', marginBottom: '4px' }}>
          {isAr ? 'جارٍ فتح الصفحة في دوايا...' : 'Loading DAWAYA page...'}
        </b>
      </div>
    </main>
  );
}

function SimulatorLoadingFallback() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="card center" style={{ padding: '42px 20px' }}>
        <div style={{ fontSize: '2.4rem', marginBottom: '10px' }} aria-hidden="true">🏥</div>
        <h2 style={{ marginBottom: '6px' }}>
          {isAr ? 'جارٍ تجهيز المشهد التفاعلي ثلاثي الأبعاد (3D)...' : 'Loading 3D Interactive Game Scene...'}
        </h2>
        <p className="small muted" style={{ margin: 0 }}>
          {isAr
            ? 'يتم الآن تحميل المشهد ثلاثي الأبعاد والشخصيات والمحطات التفاعلية.'
            : 'Initializing WebGL 3D scene, cartoon avatars, and interactive stations.'}
        </p>
      </div>
    </main>
  );
}

function NotFound() {
  const { t } = useLang();
  return (
    <main className="wrap narrow">
      <p>{t('notFound')}</p>
      <Link to="/">{t('navHome')}</Link>
    </main>
  );
}

export default function App() {
  useEffect(() => {
    // ⚡ Ultra-Fast 0-Second Startup: Render Home UI instantly, defer heavy database load until idle!
    const scheduleIdle = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback
      : (cb: () => void) => window.setTimeout(cb, 2200);

    const idleHandle = scheduleIdle(() => {
      void ensureDawayaDatabaseLoaded();
      startPartnerEcosystemSync();
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'WARMUP_OFFLINE_CACHE' });
        }
      } catch {
        /* ignore */
      }
    });

    const prewarmTimer = window.setTimeout(() => {
      void import('./PatientDashboard');
      void import('./Medicines');
      void import('./Assistant');
      void import('./InteractiveBodyMap');
      void import('./SpecialtyClinicsHub');
      void import('./ChronicMealPlanner');
    }, 4500);

    return () => {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      window.clearTimeout(prewarmTimer);
    };
  }, []);

  return (
    <AuthProvider>
      <EmergencyLocationProvider>
        <Layout>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              <Route path="/dashboard" element={<PatientDashboard />} />
              <Route path="/medicines" element={<Medicines />} />
              <Route path="/partners" element={<PartnersDirectoryPage />} />
              <Route path="/pharmacies" element={<PartnersDirectoryPage />} />
              <Route path="/pharmacy-portal" element={<PharmacyOwnerDashboard />} />
              <Route path="/pharmacy-dashboard" element={<PharmacyOwnerDashboard />} />
              <Route path="/partner/:id" element={<PartnerPublicProfilePage />} />
              <Route path="/cost-saver" element={<CostSaver />} />
              <Route path="/cold-shot-warning" element={<ColdShotWarning />} />
                            <Route path="/home-cabinet" element={<HomeMedicineCabinet />} />
              <Route path="/cabinet" element={<HomeMedicineCabinet />} />
              <Route path="/ramadan-clock" element={<RamadanFastingClock />} />
              <Route path="/fasting-clock" element={<RamadanFastingClock />} />
              <Route path="/travel-kit" element={<TravelMedKit />} />
              <Route path="/travel" element={<TravelMedKit />} />
              <Route path="/daily-schedule" element={<DailyScheduleGenerator />} />
              <Route path="/green-prescription" element={<GreenPrescription />} />
              <Route path="/awareness-week" element={<AwarenessWeek />} />
              <Route path="/compare" element={<CompareDrugs />} />
              <Route path="/complete-checkup" element={<OneClickCheckup />} />
              <Route path="/prescription-radar" element={<PrescriptionRadar />} />
              <Route path="/interactions" element={<Interactions />} />
              <Route path="/safe-disposal" element={<SafeDisposal />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/side-effects" element={<SideEffectsGuide />} />
              <Route path="/listen" element={<ListenLearn />} />
              <Route path="/health-profile" element={<HealthProfile />} />
              <Route path="/allergy-checker" element={<AllergyChecker />} />
              <Route path="/pediatric-helper" element={<PediatricHelper />} />
              <Route path="/medicine/:id" element={<MedicinePage />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:id" element={<ArticlePage />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/myth" element={<MythFact />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/research" element={<Research />} />
                                                                                                  <Route path="/nutrition-clinic" element={<ClinicalNutritionClinic />} />
              <Route path="/women-clinic" element={<WomensHealthClinic />} />
              <Route path="/geriatric-clinic" element={<GeriatricCareClinic />} />
              <Route path="/hair-clinic" element={<HairSkincareClinic />} />
              <Route path="/chest-clinic" element={<ChestRespiratoryClinic />} />
              <Route path="/body-map" element={<InteractiveBodyMap />} />
              <Route path="/food-drug-checker" element={<FoodDrugInteractionChecker />} />
              <Route path="/lab-photo-scanner" element={<SmartLabAndRxPhotoScanner />} />
              <Route path="/organ-simulator" element={<VisualBodyDrugSimulator />} />
              <Route path="/meal-planner" element={<ChronicMealPlanner />} />
              <Route path="/medical-report" element={<ComprehensiveMedicalReport />} />
              <Route path="/missed-dose-rescue" element={<MissedDoseRescueSolver />} />
              <Route path="/missed-dose" element={<MissedDoseRescueSolver />} />
              <Route path="/doctor-visit-prep" element={<DoctorVisitPrep />} />
              <Route path="/doctor-prep" element={<DoctorVisitPrep />} />
              <Route path="/vaccine-tracker" element={<EgyptianVaccineTracker />} />
              <Route path="/vaccines" element={<EgyptianVaccineTracker />} />

              <Route path="/symptom-triage" element={<SmartSymptomTriage />} />
<Route path="/eye-clinic" element={<OphthalmologyClinic />} />
              <Route path="/ent-clinic" element={<EntClinic />} />
              <Route path="/lab-clinic" element={<LabTestDecoderClinic />} />
              <Route path="/urology-clinic" element={<UrologyRenalClinic />} />
              <Route path="/neuro-clinic" element={<NeurologyClinic />} />
              <Route path="/poison-clinic" element={<PoisonFirstAidClinic />} />
<Route path="/clinics" element={<SpecialtyClinicsHub />} />
              <Route path="/specialty-clinics" element={<SpecialtyClinicsHub />} />
              <Route path="/ortho-clinic" element={<OrthopedicsClinic />} />
              <Route path="/gastro-clinic" element={<GastroClinic />} />
              <Route path="/derma-clinic" element={<DermatologyClinic />} />
              <Route path="/dental-clinic" element={<DentalEmergencyClinic />} />
              <Route path="/g6pd-clinic" element={<G6pdFavismClinic />} />
              <Route path="/chronic-clinic" element={<ChronicCareClinic />} />
<Route path="/baby-first-year" element={<NewbornFirstYearGuide />} />
              <Route path="/newborn-guide" element={<NewbornFirstYearGuide />} />
              <Route path="/infant-care" element={<NewbornFirstYearGuide />} />
<Route path="/pregnancy-guide" element={<PregnancySafetyNavigator />} />
              <Route path="/pregnancy" element={<PregnancySafetyNavigator />} />
              <Route path="/pregnant" element={<PregnancySafetyNavigator />} />
<Route path="/airport-banned-meds" element={<AirportBannedMedsScanner />} />
              <Route path="/banned-meds" element={<AirportBannedMedsScanner />} />
              <Route path="/baby-milk" element={<BabyMilkFormulaNavigator />} />
              <Route path="/milk-formula" element={<BabyMilkFormulaNavigator />} />
              <Route path="/senior-pills" element={<SeniorPillVisualIdentifier />} />
              <Route path="/pill-identifier" element={<SeniorPillVisualIdentifier />} />
              <Route path="/steroid-taper" element={<SteroidTaperingCalendar />} />
              <Route path="/cortisone-taper" element={<SteroidTaperingCalendar />} />
              <Route path="/hypo-rescue" element={<HypoRescuePlan />} />
              <Route path="/hypoglycemia-rescue" element={<HypoRescuePlan />} />
              <Route path="/inhaler-counter" element={<InhalerDoseCounter />} />
              <Route path="/asthma-counter" element={<InhalerDoseCounter />} />
<Route path="/games" element={<GameCenter />} />
              <Route
                path="/open-world"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <OpenWorldGame />
                  </Suspense>
                }
              />
              <Route
                path="/medical-simulator"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <MedicalSimulator />
                  </Suspense>
                }
              />
              <Route
                path="/nurse-academy"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <NurseAcademy />
                  </Suspense>
                }
              />
              <Route
                path="/medical-mystery"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <MedicalMystery />
                  </Suspense>
                }
              />
              <Route
                path="/bacteria-lab"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <BacteriaLab />
                  </Suspense>
                }
              />
              <Route
                path="/emergency-shift"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <EmergencyShift />
                  </Suspense>
                }
              />
              <Route
                path="/escape-the-lab"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <EscapeTheLab />
                  </Suspense>
                }
              />
              <Route path="/game" element={<BacteriaHunter />} />
              <Route path="/admin" element={configured ? <Dashboard /> : <ConfigMissing />} />
              <Route path="/admin/new" element={configured ? <Editor /> : <ConfigMissing />} />
              <Route path="/admin/medicine/:id" element={configured ? <Editor /> : <ConfigMissing />} />
              <Route path="/passport" element={<SmartPassport />} />
              <Route path="/smart-passport" element={<SmartPassport />} />
              <Route path="/passport/:uid" element={<PassportView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
        <AuthModal />
      </EmergencyLocationProvider>
    </AuthProvider>
  );
}
