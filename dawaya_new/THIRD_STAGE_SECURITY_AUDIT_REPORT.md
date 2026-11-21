# DAWAYA — Third-Stage Critical Security & Integration Audit Report

**Repository:** [MMO277/DAWAYA](https://github.com/MMO277/DAWAYA)  
**Frontend Deployment:** [https://mmo277.github.io/DAWAYA/](https://mmo277.github.io/DAWAYA/)  

---

## A. Executive Summary

This third-stage engineering audit inspected the complete DAWAYA source repository and remediated 9 critical and high-severity vulnerabilities spanning authentication credential derivation, medical document privacy across content-management roles, cross-user notification spoofing, cross-pharmacy tenant isolation, AI proxy routing and public CORS relays, truthful runtime Firebase configuration validation, atomic multi-document Firestore writes, non-fabricated public inventory quantities, and distributed cross-instance serverless rate limiting. All existing clinical, educational, and pharmacy features remain intact and verified across 194 TypeScript/React modules.

---

## B. Security Findings (Classified by Severity)

### 1. [CRITICAL] Deterministic Email-Derived Password & Public Firestore Auth Bridge
* **Status:** Fixed
* **Affected Files:** `authContext.tsx`, `firestore.rules`
* **Root Cause:** `computeFirebaseAppBridgeSecret(email)` generated a predictable password (`Aa#GBridge_${hex1}_${hex2}!2026`) solely from a user's email address, linked it via `EmailAuthProvider.credential(email, secret)`, and allowed `loginWithGoogleDeviceBridge()` to call `signInWithEmailAndPassword` using that derived secret or read OAuth tokens from `settings/gbridge_{email}`. Knowing any user's email address was sufficient to compute their password secret.
* **Implemented Fix:** Completely removed `computeFirebaseAppBridgeSecret()` and `getEmailBridgeDocId()` from `authContext.tsx`, eliminated deterministic password linking and `signInWithEmailAndPassword` bridge fallback, enforced verified Google OAuth (`signInWithCredential` / `signInWithPopup`), and blocked `gbridge_.*` and `google_app_accounts_list` reads in `firestore.rules`.
* **Test Evidence:** Verified in `Test 1 (Section 2)` of `scripts/securityAndIntegrityTestSuite.mjs`.

### 2. [CRITICAL] Over-Privileged Content Role Access to Private Patient Medical & Identity Files
* **Status:** Fixed
* **Affected Files:** `storage.rules`, `firestore.rules`, `PassportView.tsx`
* **Root Cause:** `storage.rules` used a shared `hasAdminOrEditorRole()` helper that included `editor`, `reviewer`, and `regional_manager`, granting content-management roles read/delete access to `patient_documents/{uid}/{fileName}`, `passport_photos/{uid}/{fileName}`, and `prescription_.*` inside `partner_assets/{partnerId}/{fileName}`.
* **Implemented Fix:** Restricted `patient_documents/{uid}` and `/users/{uid}/medicalDocuments` strictly to `isOwner(uid)`; restricted `passport_photos/{uid}` strictly to `isOwner(uid) || isPassportActivelyShared(uid)` (where `revoked != true && expiresAt > request.time.toMillis()`); restricted `prescription_.*` in Storage to the uploading patient (`resource.metadata.ownerUid == request.auth.uid`) or clinical pharmacy staff of that specific pharmacy (`isPharmacyClinicalStaff(partnerId)`); restricted `pharmacy_verification_docs` to `isOwner(applicantUid) || isLicenseVerifier()`.
* **Test Evidence:** Verified in `Test 2 (Section 3)` of `scripts/securityAndIntegrityTestSuite.mjs`.

### 3. [CRITICAL] Broken AI Proxy Variable (`fetch(url)`), Direct Browser Provider Calls & Public CORS Relays
* **Status:** Fixed
* **Affected Files:** `geminiApi.ts`, `aiDocumentProcessor.ts`, `functions/index.js`
* **Root Cause:** In `geminiApi.ts`, `askGemini` defined `const proxyUrl = '/api/ai/generate'` but still called `fetch(url)` (an undeclared reference), fell back to third-party keyless gateways (`groq.com`, `ovh.net`, `kilo.ai`, `llm7.io`) relayed via `https://corsproxy.io`, used `allorigins.win` / `rss2json.com`, and sent prescription/medicine images directly from the browser to `text.pollinations.ai` and `api.ocr.space`.
* **Implemented Fix:** Fixed `askGemini`, `analyzeMedicineImageWithVision`, `analyzePrescriptionImageWithVision`, and `aiDocumentProcessor.ts` to route all AI requests exclusively through `callServerAiProxy()` (`${AI_PROXY_BASE_URL}/api/ai/generate`), added client-side and server-side PII scrubbing (`sanitizePatientPiiForAi` / `sanitizePromptPii`), and removed all direct browser calls to external AI/OCR providers and public CORS proxies.
* **Test Evidence:** Verified in `Test 5 (Section 6)` of `scripts/securityAndIntegrityTestSuite.mjs`.

### 4. [HIGH] Cross-Pharmacy Tenant Reassignment & Self-Verification on Partner/Inventory Updates
* **Status:** Fixed
* **Affected Files:** `firestore.rules`
* **Root Cause:** Update rules on `partners`, `partnerBranches`, `pharmacyEmployees`, `pharmacyInventory`, `pharmacyPublicInventory`, and `partnerMedicationMappings` checked ownership of the target `pharmacyId`/`partnerId` without locking `resource.data.pharmacyId == request.resource.data.pharmacyId` or restricting pharmacy owners from modifying `verificationStatus`, `publicationStatus`, `partnershipStatus`, or `ownerUid`.
* **Implemented Fix:** Enforced immutability of `pharmacyId`, `partnerId`, `ownerUid`, `verificationStatus`, `partnershipStatus`, and `publicationStatus` on tenant updates, and applied strict `affectedKeys().hasOnly(...)` allowlists on `partners` and `pharmacies`.
* **Test Evidence:** Verified in `Test 4 (Section 5)` of `scripts/securityAndIntegrityTestSuite.mjs`.

### 5. [HIGH] Cross-User Notification Spoofing (`/users/{uid}/notifications/{notifId}`)
* **Status:** Fixed
* **Affected Files:** `firestore.rules`
* **Root Cause:** `allow create: if isSignedIn();` on `/users/{uid}/notifications/{notifId}` allowed any authenticated user to inject fake system, payment, or pharmacy notifications into another user's inbox.
* **Implemented Fix:** Restricted client notification creation to `isOwner(uid) && request.resource.data.uid == request.auth.uid && request.resource.data.source == 'user_self' && request.resource.data.type in ['dose_reminder', 'appointment_note', 'personal_alert']` with strict key allowlists, reserving system notifications for `isAdmin()` or Admin SDK backend functions.
* **Test Evidence:** Verified in `Test 3 (Section 4)` of `scripts/securityAndIntegrityTestSuite.mjs`.

### 6. [HIGH] Non-Atomic Multi-Document Writes (`Promise.all`) & Duplicate Order Race Conditions
* **Status:** Fixed
* **Affected Files:** `partnerService.ts`
* **Root Cause:** Multi-document writes in `savePartnerFullRecord`, `reviewPharmacyApplicationDecision`, `upsertPharmacyInventoryItem`, and `deletePharmacyInventoryItem` used `Promise.all([setDoc(...), setDoc(...)])`, which could leave partial state if one write failed. `createPartnerOrder` and `updatePartnerOrderStatus` lacked transactional state checks and idempotency keys.
* **Implemented Fix:** Replaced `Promise.all` multi-doc writes with atomic `writeBatch(db)` commits, and upgraded `createPartnerOrder` (with deterministic idempotency keys) and `updatePartnerOrderStatus` to use `runTransaction(db, ...)`.
* **Test Evidence:** Verified in `Test 7 (Section 8)` of `scripts/securityAndIntegrityTestSuite.mjs`.

### 7. [MEDIUM] Fabricated Public Inventory Quantity (`quantityPacks: 1`)
* **Status:** Fixed
* **Affected Files:** `partnerService.ts`, `partnerTypes.ts`, `PharmacyOwnerDashboard.tsx`
* **Root Cause:** When hydrating public availability records from `pharmacyPublicInventory`, `partnerService.ts` mapped `available` status to a synthetic `quantityPacks: 1`.
* **Implemented Fix:** Updated `PharmacyInventoryItem.quantityPacks` type to `number | null` and set `quantityPacks: null` on public availability projections so public views display only the verified availability label without inventing stock counts.
* **Test Evidence:** Verified in `Test 8 (Section 9)` of `scripts/securityAndIntegrityTestSuite.mjs`.

### 8. [MEDIUM] In-Memory Serverless Rate Limiter in Cloud Functions
* **Status:** Fixed
* **Affected Files:** `functions/index.js`, `firestore.rules`
* **Root Cause:** `functions/index.js` stored rate-limit counters in a process-local `Map()`, which resets across cold starts and does not coordinate across concurrent Cloud Function instances.
* **Implemented Fix:** Implemented `checkDistributedRateLimit()` in `functions/index.js` using atomic Firestore transactions (`db.runTransaction`) on `_rateLimits/{bucketKey}` (locked with `allow read, write: if false;` in `firestore.rules`), enforcing both per-UID (20 req/min) and per-IP (40 req/min) limits plus App Check header support.
* **Test Evidence:** Verified in `Test 9 (Section 10)` of `scripts/securityAndIntegrityTestSuite.mjs`.

### 9. [MEDIUM] Unconditional `return true` in `saveRuntimeFirebaseConfigFromText()`
* **Status:** Fixed
* **Affected Files:** `firebase.ts`
* **Root Cause:** `saveRuntimeFirebaseConfigFromText(_input: string)` returned `true` without parsing, validating, or saving the provided configuration.
* **Implemented Fix:** Implemented `validateFirebaseConfigObject()` and `saveRuntimeFirebaseConfigFromText()` in `firebase.ts` to parse JSON/JS config text, verify `apiKey`, `authDomain`, `projectId`, and `appId`, persist valid configs to `localStorage`, and return `false` on invalid input.
* **Test Evidence:** Verified in `Test 6 (Section 7)` of `scripts/securityAndIntegrityTestSuite.mjs`.

---

## C. Modified & Created Files

* **`authContext.tsx`**: Removed `computeFirebaseAppBridgeSecret` and `getEmailBridgeDocId`; secured Google OAuth sign-in flow.
* **`firebase.ts`**: Implemented `validateFirebaseConfigObject`, truthful `saveRuntimeFirebaseConfigFromText`, and `VITE_APP_ENV` / `VITE_DISABLE_DEFAULT_FIREBASE_CONFIG` support.
* **`firestore.rules`**: Hardened `/users/{uid}`, `/users/{uid}/medicalDocuments`, `/users/{uid}/notifications`, `/settings/{docId}`, `/_rateLimits/{limitId}`, `/pharmacyApplications`, `/pharmacies`, `/pharmacyEmployees`, `/pharmacyInventory`, `/pharmacyPublicInventory`, `/partners`, `/partnerBranches`, and `/partnerMedicationMappings`.
* **`storage.rules`**: Separated `isSystemAdmin()`, `isLicenseVerifier()`, and `isPharmacyClinicalStaff(partnerId)` so `editor`, `reviewer`, and `regional_manager` cannot access private patient medical records or passport photos.
* **`geminiApi.ts` & `aiDocumentProcessor.ts`**: Fixed `fetch(url)` bug, removed all direct browser AI/OCR calls and CORS proxies, added `sanitizePatientPiiForAi()`, and routed all AI calls through `callServerAiProxy()` with `VITE_AI_PROXY_BASE_URL` support.
* **`functions/index.js`**: Upgraded `dawayaAiProxy` with Firestore transactional rate limiting (`_rateLimits`), per-UID and per-IP enforcement, App Check verification, model allowlist, and PII redaction.
* **`partnerService.ts` & `partnerTypes.ts`**: Replaced `Promise.all` multi-document writes with atomic `writeBatch(db)` and `runTransaction(db)`, added order idempotency protection, and set `quantityPacks: null` on public inventory projections.
* **`PharmacyOwnerDashboard.tsx`**: Updated inventory table rendering to handle `quantityPacks: number | null` cleanly.
* **`scripts/securityAndIntegrityTestSuite.mjs`**: Expanded automated test suite to 10 comprehensive test groups covering all 15 sections of the Third-Stage prompt.

---

## D. Test Results

1. **Automated Security, Rules, State Machine, Config & AST Compilation Suite:**
   * **Command:** `NODE_PATH=/usr/share/nodejs node scripts/securityAndIntegrityTestSuite.mjs`
   * **Result:** `10 passed, 0 failed` (All 10 test groups and all 194 TypeScript/JSX + 7 CSS files compiled and passed with zero errors).
2. **Firebase Emulator Live Execution Note:**
   * **Blocker in Offline Container:** Running `firebase emulators:exec` requires downloading the Firestore/Storage Java JAR binaries from Google servers, which is blocked in the offline sandbox VM. Execute `firebase emulators:start --only firestore,storage,functions` on a networked machine before production rule rollout.

---

## E. Manual Actions Required from Project Owner

1. **Publish Updated Security Rules in Firebase Console:**
   * Paste the updated `firestore.rules` into **Firebase Console -> Firestore Database -> Rules** and click **Publish**.
   * Paste the updated `storage.rules` into **Firebase Console -> Storage -> Rules** and click **Publish**.
2. **Configure Cloud Functions AI Proxy (When Enabling Cloud AI):**
   * Run `firebase functions:secrets:set GEMINI_API_KEY` and `firebase deploy --only functions`.
   * Since the frontend is hosted on GitHub Pages (`https://mmo277.github.io/DAWAYA/`), set `VITE_AI_PROXY_BASE_URL` in your GitHub Actions secrets/variables to your deployed Cloud Function URL (otherwise the app safely uses its built-in deterministic clinical engine without exposing any keys).
3. **Existing Users Migration Note:**
   * Any user who previously signed in with Google continues to sign in seamlessly via Google OAuth (`signInWithPopup` / `signInWithCredential`). Standard email/password users can use **Forgot Password** (`sendPasswordResetEmail`) if they need to reset their password.

---

## F. Deployment Status

* **Current Classification:** **READY FOR STAGING** (and ready for production deployment once `firestore.rules` and `storage.rules` are published in the Firebase Console and live Firebase Emulator tests are run in a networked CI environment).
