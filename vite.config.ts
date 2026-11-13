import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Set to true whenever you want the next deployed update to be MANDATORY (إجباري) for all users
const IS_MANDATORY_UPDATE = false;
const APP_VERSION = '3.0.0';

/**
 * Generates both:
 * 1) precache-manifest.json (all compiled JS/CSS chunks for 0ms offline mode)
 * 2) app-version.json (unique buildId + version + mandatory flag so installed apps automatically
 *    detect new deployments and show the In-App Update prompt!)
 */
function offlineAndInAppUpdatePlugin(): Plugin {
  return {
    name: 'offline-and-in-app-update-manifest',
    generateBundle(_options, bundle) {
      const coreAssets: string[] = [];
      const deferred3DAssets: string[] = [];

      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith('.js') || fileName.endsWith('.css')) {
          const normalized = './' + fileName.replace(/^\/+/, '');
          if (
            fileName.includes('vendor-three') ||
            fileName.includes('OpenWorld') ||
            fileName.includes('MedicalSimulator') ||
            fileName.includes('Cartoon3D')
          ) {
            deferred3DAssets.push(normalized);
          } else {
            coreAssets.push(normalized);
          }
        }
      }

      const nowTs = Date.now();

      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(
          {
            version: nowTs,
            coreAssets,
            deferred3DAssets,
          },
          null,
          2
        ),
      });

      this.emitFile({
        type: 'asset',
        fileName: 'app-version.json',
        source: JSON.stringify(
          {
            buildId: `build-${APP_VERSION}-${nowTs}`,
            version: APP_VERSION,
            mandatory: IS_MANDATORY_UPDATE,
            requiresNewApk: false,
            titleAr: IS_MANDATORY_UPDATE
              ? `⚠️ تحديث هام وإجباري لمنصة دوايا | DAWAYA (v${APP_VERSION})`
              : `🚀 تحديث شامل جديد متاح لمنصة دوايا | DAWAYA (v${APP_VERSION})`,
            titleEn: IS_MANDATORY_UPDATE
              ? `⚠️ Critical Mandatory DAWAYA Update (v${APP_VERSION})`
              : `🚀 Comprehensive New DAWAYA Update (v${APP_VERSION})`,
            notesAr: [
              '💊 دمج موسوعة الأدوية المصرية الشاملة (26,562+ مستحضر دوائي) مع البدائل والأسعار والتحذيرات السريرية الـ 7.',
              '🛡️ محرك الأمان الدوائي المركزي لفحص الحساسية وتكرار المادة الفعالة والتداخلات الدوائية.',
              '📊 لوحة المريض الموحدة (Patient Dashboard) ورادار الروشتات الذكي والروشتة الخضراء.',
              '⏰ منبه جرعات ذكي ومزامنة سحابية آمنة لحسابك الصحي.',
            ],
            notesEn: [
              '💊 Full Egyptian medicine database (26,562+ medicines) with equivalents, official prices, and 7-condition warnings.',
              '🛡️ Central Medication Safety Engine for allergy, duplicate ingredient, and interaction screening.',
              '📊 Unified Patient Dashboard, Smart Prescription Radar, and expanded Green Prescription.',
              '⏰ Smart dose alarm clock and secure cloud health profile sync.',
            ],
            publishedAt: new Date().toISOString().slice(0, 10),
          },
          null,
          2
        ),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineAndInAppUpdatePlugin()],
  base: './',
  esbuild: {
    drop: ['debugger'],
    legalComments: 'none',
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    modulePreload: {
      polyfill: false,
    },
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('html5-qrcode') || id.includes('qrcode')) return 'vendor-qr';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('react')) return 'vendor-react';
          }
          if (
            id.includes('seedData') ||
            id.includes('seedMore') ||
            id.includes('seedExtra') ||
            id.includes('egyptianDrugDatabase')
          ) {
            return 'dawaya-drug-db';
          }
          if (
            id.includes('medicationSafetyEngine') ||
            id.includes('interactionsData') ||
            id.includes('trackerData') ||
            id.includes('allergyData')
          ) {
            return 'dawaya-clinical-data';
          }
        },
      },
    },
  },
});
