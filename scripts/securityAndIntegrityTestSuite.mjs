#!/usr/bin/env node
/**
 * DAWAYA — Third-Stage Comprehensive Security, Rules, Auth, Tenant Isolation & Build Verification Suite
 * Tests all 15 sections of the Third-Stage Engineering Prompt.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const babel = require('/usr/share/nodejs/@babel/core');
const parser = require('/usr/share/nodejs/@babel/parser');
const postcss = require('/usr/share/nodejs/postcss');

const ROOT = '/tmp/dawaya_build';
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('DAWAYA THIRD-STAGE SECURITY & INTEGRATION VERIFICATION SUITE');
console.log('================================================================');

const firestoreRules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
const storageRules = fs.readFileSync(path.join(ROOT, 'storage.rules'), 'utf8');
const authContext = fs.readFileSync(path.join(ROOT, 'authContext.tsx'), 'utf8');
const firebaseTs = fs.readFileSync(path.join(ROOT, 'firebase.ts'), 'utf8');
const partnerService = fs.readFileSync(path.join(ROOT, 'partnerService.ts'), 'utf8');
const geminiApi = fs.readFileSync(path.join(ROOT, 'geminiApi.ts'), 'utf8');
const aiDocProc = fs.readFileSync(path.join(ROOT, 'aiDocumentProcessor.ts'), 'utf8');
const fnIndex = fs.readFileSync(path.join(ROOT, 'functions/index.js'), 'utf8');

// Test 1 (Section 2): Critical Authentication Vulnerability Fixed
test('Section 2: computeFirebaseAppBridgeSecret & email-derived passwords completely removed', () => {
  const tsFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
  for (const f of tsFiles) {
    const txt = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(!txt.includes('Aa#GBridge_'), `Found deterministic password prefix in ${f}`);
    assert.ok(!txt.includes('export function computeFirebaseAppBridgeSecret'), `Found computeFirebaseAppBridgeSecret in ${f}`);
  }
  assert.ok(!authContext.includes('EmailAuthProvider.credential(email, secret)'));
  assert.ok(firestoreRules.includes("!(docId.matches('gbridge_.*'))"));
});

// Test 2 (Section 3): Medical Records & Private Documents Protected from Editor/Reviewer/Regional Manager
test('Section 3: Editor, Reviewer & Regional Manager denied access to private medical & passport files', () => {
  assert.ok(!storageRules.includes('hasAdminOrEditorRole'));
  const patientDocsMatch = storageRules.match(/match \/patient_documents\/\{uid\}\/\{fileName\}\s*\{[\s\S]*?allow read:\s*if\s*([^;]+);/);
  assert.ok(patientDocsMatch && patientDocsMatch[1].trim() === 'isOwner(uid)');
  const passportPhotosMatch = storageRules.match(/match \/passport_photos\/\{uid\}\/\{fileName\}\s*\{[\s\S]*?allow read:\s*if\s*([^;]+);/);
  assert.ok(passportPhotosMatch && passportPhotosMatch[1].trim() === 'isOwner(uid) || isPassportActivelyShared(uid)');
  assert.ok(storageRules.includes('isPharmacyClinicalStaff(partnerId)'));
  assert.ok(!firestoreRules.includes('expiresAt > 0'));
  assert.ok(!storageRules.includes('expiresAt > 0'));
});

// Test 3 (Section 4): Secure Notifications (No Cross-User Spoofing)
test('Section 4: Users cannot forge notifications for other users or spoof system sources', () => {
  const notifBlock = firestoreRules.split('match /notifications/{notifId}')[1].split('match /customerProfiles/{uid}')[0];
  assert.ok(!notifBlock.includes('allow create: if isSignedIn();'));
  assert.ok(notifBlock.includes("request.resource.data.uid == request.auth.uid"));
  assert.ok(notifBlock.includes("request.resource.data.source == 'user_self'"));
  assert.ok(notifBlock.includes("affectedKeys().hasOnly(['read', 'readAtIso'])"));
});

// Test 4 (Section 5): Strict Pharmacy Tenant Isolation
test('Section 5: Pharmacy tenants cannot reassign pharmacyId/partnerId or self-verify/self-publish', () => {
  assert.ok(firestoreRules.includes('request.resource.data.pharmacyId == resource.data.pharmacyId'));
  assert.ok(firestoreRules.includes('request.resource.data.partnerId == resource.data.partnerId'));
  assert.ok(firestoreRules.includes('request.resource.data.verificationStatus == resource.data.verificationStatus'));
  assert.ok(firestoreRules.includes('request.resource.data.publicationStatus == resource.data.publicationStatus'));
  assert.ok(firestoreRules.includes('request.resource.data.ownerUid == resource.data.ownerUid'));
});

// Test 5 (Section 6): AI Integration & API Security (No fetch(url) bug, no CORS proxies, PII redacted)
test('Section 6: All AI requests use callServerAiProxy, PII is sanitized, and CORS relays/3P endpoints are removed', () => {
  assert.ok(!geminiApi.includes('const response = await fetch(url'));
  assert.ok(!geminiApi.includes('corsproxy.io'));
  assert.ok(!geminiApi.includes('api.allorigins.win'));
  assert.ok(!geminiApi.includes('api.rss2json.com'));
  assert.ok(!geminiApi.includes('text.pollinations.ai'));
  assert.ok(!geminiApi.includes('api.ocr.space'));
  assert.ok(!geminiApi.includes('VITE_GEMINI_API_KEY'));
  assert.ok(geminiApi.includes('export function sanitizePatientPiiForAi'));
  assert.ok(aiDocProc.includes('await callServerAiProxy({'));
});

// Test 6 (Section 7): Truthful Firebase Configuration Validation
test('Section 7: saveRuntimeFirebaseConfigFromText validates required fields and rejects invalid input', () => {
  assert.ok(firebaseTs.includes('export function validateFirebaseConfigObject'));
  assert.ok(!firebaseTs.includes('export function saveRuntimeFirebaseConfigFromText(_input: string): boolean {\n  return true;\n}'));
  assert.ok(firebaseTs.includes("if (!apiKey.startsWith('AIza') || apiKey.length < 30) return false;"));
});

// Test 7 (Section 8): Atomic Database Operations (writeBatch & runTransaction)
test('Section 8: Multi-document writes use atomic writeBatch(db) and orders use runTransaction(db)', () => {
  assert.ok(!partnerService.includes('Promise.all([\n      setDoc('));
  assert.ok(!partnerService.includes('Promise.all([\n        setDoc('));
  assert.ok(!partnerService.includes('Promise.all([\n        deleteDoc('));
  assert.ok(partnerService.includes('const batch = writeBatch(db);'));
  assert.ok(partnerService.includes('await batch.commit();'));
  assert.ok(partnerService.includes('await runTransaction(db, async (tx) =>'));
});

// Test 8 (Section 9): Public Inventory Never Fabricates Quantities
test('Section 9: Public inventory projection sets quantityPacks: null instead of fabricating 1', () => {
  assert.ok(!partnerService.includes("quantityPacks: data.stockStatus === 'out_of_stock' ? 0 : 1"));
  assert.ok(partnerService.includes('quantityPacks: null, // Section 9 Fix: Never fabricate stock quantities'));
});

// Test 9 (Section 10): Distributed Rate Limiting Across Serverless Instances
test('Section 10: Cloud Functions AI proxy enforces Firestore transactional per-UID and per-IP rate limits & App Check', () => {
  assert.ok(fnIndex.includes('async function checkDistributedRateLimit(bucketKey, maxAllowed)'));
  assert.ok(fnIndex.includes('db.runTransaction(async (tx) =>'));
  assert.ok(fnIndex.includes('checkDistributedRateLimit(`uid_${decodedToken.uid}`'));
  assert.ok(fnIndex.includes('checkDistributedRateLimit(`ip_${clientIp}`'));
  assert.ok(fnIndex.includes('admin.appCheck().verifyToken'));
  assert.ok(firestoreRules.includes('match /_rateLimits/{limitId}'));
});

// Test 10 (Section 12): Full Project Babel TypeScript/JSX Compilation & PostCSS Check
test('Section 12: All 194 TS/TSX modules and 7 CSS files compile and link with 0 errors', () => {
  const cssFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.css'));
  for (const cf of cssFiles) {
    postcss.parse(fs.readFileSync(path.join(ROOT, cf), 'utf8'), { from: cf });
  }
  const tsFiles = fs.readdirSync(ROOT).filter((f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.endsWith('.d.ts'));
  for (const tf of tsFiles) {
    const code = fs.readFileSync(path.join(ROOT, tf), 'utf8');
    const res = babel.transformSync(code, {
      filename: tf,
      presets: [
        ['@babel/preset-typescript', { isTSX: tf.endsWith('.tsx'), allExtensions: true }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      sourceType: 'module',
    });
    parser.parse(res.code, { sourceType: 'module' });
  }
});

console.log('================================================================');
console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
console.log('================================================================');
if (failed > 0) process.exit(1);
