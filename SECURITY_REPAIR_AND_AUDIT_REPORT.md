# DAWAYA — Security & Data Integrity Repair Report

**Target Repository:** [MMO277/DAWAYA](https://github.com/MMO277/DAWAYA)  
**Live Deployment:** [https://mmo277.github.io/DAWAYA/](https://mmo277.github.io/DAWAYA/)  

---

## 1. Finding Matrix & Repair Status (Sections 2–9)

| Section | Original Security / Data Integrity Finding | Status | Modified Files | Verification / Proof |
| :--- | :--- | :--- | :--- | :--- |
| **Section 2** | **Pharmacy Onboarding Self-Approval:** `pharmacyApplications` update rule allowed applicants in `draft`/`pending_review` to modify `status` to `approved` or alter reviewer fields. | **Fixed** | `firestore.rules`, `partnerService.ts` | Added `validApplicantApplicationUpdate()` enforcing `affectedKeys().hasOnly(...)`, immutable `applicantUid`, and `request.resource.data.status in ['draft', 'pending_review']`. Only `isAdmin() \|\| isRegionalManager()` can transition to `approved`/`rejected`. Verified in `Section 2.1` & `2.2` automated tests. |
| **Section 3** | **Medical-File Share Expiration (`expiresAt > 0`) & Private User Doc Exposure:** `expiresAt > 0` allowed expired epoch timestamps to remain readable; `/users/{uid}` was exposed via `isPassportActivelyShared(uid)`; `prescription_.*` in Storage was readable by any signed-in user. | **Fixed** | `firestore.rules`, `storage.rules`, `passportService.ts`, `PassportView.tsx` | Replaced `expiresAt > 0` with `revoked != true && expiresAt > request.time.toMillis()` in both Firestore and Storage rules; removed `isPassportActivelyShared(uid)` from `/users/{uid}`; restricted `prescription_.*` in Storage to uploader (`metadata.ownerUid`), pharmacy staff, or admins. Verified in `Section 3.1–3.3` tests. |
| **Section 4** | **Order Update Permissions & State Machine:** Customers could cancel delivered orders or tamper with prices/quantities; pharmacy staff could skip/reverse states or mutate immutable fields. | **Fixed** | `firestore.rules`, `partnerService.ts` | Implemented `isValidOrderTransition(oldStatus, newStatus)` in `firestore.rules` and `isValidOrderStateTransition` in `partnerService.ts`; locked `userId`, `partnerId`, `medicationId`, `quantity`, and `createdAtIso` as immutable; restricted customer updates strictly to `status == 'cancelled'` from initial pending states. Verified in `Section 4.1` test. |
| **Section 5** | **Swallowed Firestore Write Errors & False Cloud Success:** `partnerService.ts` updated `localStorage` first and wrapped `setDoc` in `try { ... } catch { /* ignore */ }`, showing fake cloud confirmation when writes failed. | **Fixed** | `partnerService.ts`, `PharmacyOwnerDashboard.tsx` | All write functions now validate inputs, await Firestore `setDoc`/`deleteDoc` before committing, track `lastPersistenceError`, and re-throw errors so the UI displays an honest error toast when cloud persistence fails. Verified in `Section 5 & 6` test. |
| **Section 6** | **Incomplete Multi-Device Synchronization:** `pharmacyApplications`, `pharmacyInventory`, `pharmacyEmployees`, `franchiseContracts`, `partnerOrders`, and `egypt_geography_hierarchy` lacked real-time `onSnapshot` listeners. | **Fixed** | `partnerService.ts` | Implemented `startDawayaNetworkRealtimeSync()` attaching real-time `onSnapshot` listeners to all 6 enterprise collections in addition to the 4 partner collections. Verified in `Section 5 & 6` test. |
| **Section 7** | **Gemini/AI Key Exposure in Frontend Bundle:** `geminiApi.ts` read `VITE_GEMINI_API_KEY`, queried `settings/ai_config`, called `generativelanguage.googleapis.com?key=` directly from the browser, and hardcoded `hasApiKey() = true`. | **Fixed** | `geminiApi.ts`, `aiDocumentProcessor.ts`, `functions/index.js`, `functions/package.json`, `firebase.json` | Removed `VITE_GEMINI_API_KEY` and direct `?key=` URLs from all frontend files; created Firebase Cloud Function `dawayaAiProxy` (`/api/ai/status` & `/api/ai/generate`) using `defineSecret('GEMINI_API_KEY')`, Firebase ID token verification, rate limiting (20 req/min), and input size caps; updated `hasApiKey()` to reflect actual `/api/ai/status` readiness. Verified in `Section 7` test. |
| **Section 8** | **Forged Admin Audit Logs:** `adminAuditLogs` had `allow create: if isSignedIn();`, permitting any user to forge administrative audit events. | **Fixed** | `firestore.rules` | Restricted `adminAuditLogs` creation to `isEditor() \|\| isReviewer() \|\| isRegionalManager() \|\| isAdmin() \|\| isPharmacyMember(partnerId)` with `request.resource.data.adminUid == request.auth.uid` and `allow update, delete: if false;`. Verified in `Section 8 & 9` test. |
| **Section 9** | **Public Exposure of Private Inventory Fields & Unvalidated Stock/Price:** `pharmacyInventory` exposed batch/threshold/staff fields publicly and lacked `quantityPacks >= 0` / `pharmacyPriceEgp > 0` validation. | **Fixed** | `firestore.rules`, `partnerService.ts` | Restricted `pharmacyInventory` reads to authorized pharmacy members/admins; created `pharmacyPublicInventory` exposing only public availability fields (`keys().hasOnly(...)`); enforced `quantityPacks >= 0` and `pharmacyPriceEgp > 0`. Verified in `Section 8 & 9` test. |

---

## 2. File-by-File Change Summary

1. **`firestore.rules`**:
   - Added `isPassportShareDocValid(shareData)` requiring `revoked != true` and `expiresAt > request.time.toMillis()`.
   - Removed `isPassportActivelyShared(uid)` from `/users/{uid}` read rule so private user documents are never exposed during emergency card sharing.
   - Added `validApplicantApplicationUpdate()` with `affectedKeys().hasOnly(...)` and `status in ['draft', 'pending_review']`.
   - Added `isValidOrderTransition(oldStatus, newStatus)` and immutable field locks on `/partnerOrders/{orderId}` and `/orders/{orderId}`.
   - Restricted `/adminAuditLogs/{logId}` `create` to authorized roles with `adminUid == request.auth.uid`.
   - Restricted `/pharmacyInventory/{invId}` reads to authorized pharmacy staff/admins and added `/pharmacyPublicInventory/{invId}` for public availability projections with `quantityPacks >= 0` and `pharmacyPriceEgp > 0`.
2. **`storage.rules`**:
   - Updated `isPassportActivelyShared(uid)` to enforce `revoked != true` and `expiresAt > request.time.toMillis()`.
   - Restricted `prescription_.*` inside `/partner_assets/{partnerId}/{fileName}` to the uploading patient (`resource.metadata.ownerUid == request.auth.uid`), authorized pharmacy staff (`isPharmacyMember(partnerId)`), or admins.
3. **`partnerService.ts`**:
   - Added `isValidOrderStateTransition` and enforced it in `updatePartnerOrderStatus`.
   - Added `startDawayaNetworkRealtimeSync()` with real-time `onSnapshot` listeners across `partnerOrders`, `pharmacyApplications`, `pharmacyInventory`, `pharmacyPublicInventory`, `pharmacyEmployees`, `franchiseContracts`, and `systemSettings/egypt_geography_hierarchy`.
   - Updated write functions (`submitPharmacyRegistrationApplication`, `reviewPharmacyApplicationDecision`, `upsertPharmacyInventoryItem`, `deletePharmacyInventoryItem`, `savePharmacyEmployee`, `saveFranchiseContract`, `saveDynamicGovernorates`) to await Firestore acknowledgment before committing and re-throw errors instead of silently swallowing them.
   - Split inventory writes into `pharmacyInventory` (private operational data) and `pharmacyPublicInventory` (public availability projection).
4. **`geminiApi.ts` & `aiDocumentProcessor.ts`**:
   - Removed `VITE_GEMINI_API_KEY`, `VITE_FIREBASE_API_KEY`, `settings/ai_config` key reads/writes, and direct `generativelanguage.googleapis.com?key=` browser calls.
   - Added `callServerAiProxy()` and `/api/ai/status` health check so `hasApiKey()` reflects actual server proxy readiness without exposing secrets.
5. **`functions/index.js`, `functions/package.json` & `firebase.json`**:
   - Added Firebase Cloud Function `dawayaAiProxy` using `defineSecret('GEMINI_API_KEY')`, Firebase ID token verification (`admin.auth().verifyIdToken`), per-UID rate limiting, and payload size validation, wired to `/api/ai/**` in `firebase.json`.
6. **`passportService.ts` & `PassportView.tsx`**:
   - Added `revoked: true` on `revokePassport(uid)`, updated `isPassportValid()` to check `!share.revoked && Date.now() < share.expiresAt`, and removed the `/users/{uid}` fallback read in `PassportView.tsx`.
7. **`PharmacyOwnerDashboard.tsx`**:
   - Fixed declaration order of `lowStockItems` and `expiringSoonItems` before `filteredRadarInventory` and added honest `try / catch` error toast feedback on all cloud writes.
8. **`scripts/securityAndIntegrityTestSuite.mjs`**:
   - Added automated verification test suite covering all security rules, state machine transitions, secret scanning, and full Babel TypeScript/JSX + PostCSS compilation across all 194 modules.

---

## 3. Exact Test Commands & Actual Results

### Executed in Verification Environment:
1. **Automated Security, Rules, State Machine & Full AST Compilation Suite:**
   - **Command:** `NODE_PATH=/usr/share/nodejs node scripts/securityAndIntegrityTestSuite.mjs`
   - **Result:** `10 passed, 0 failed` (All 194 `.ts`/`.tsx` files compiled via `@babel/core` with `@babel/preset-typescript` + `@babel/preset-react`; all 7 `.css` files parsed via `postcss`; all 10 security & data integrity assertions passed).
2. **Reachable Dependency Graph & Rollup Link Verification:**
   - **Command:** `NODE_PATH=/usr/share/nodejs node` dependency graph traversal from `main.tsx`
   - **Result:** `Reachable modules from main.tsx: 193, Errors: 0`.
3. **Tests Requiring External Network / Java Runtime (Firebase Emulator CLI):**
   - Live `firebase emulators:exec` requires outbound network download of the Firestore/Storage Java emulator binaries, which is disabled in the offline build container. All rule invariants (`validApplicantApplicationUpdate`, `isPassportShareDocValid`, `isValidOrderTransition`, `adminAuditLogs`, and `pharmacyPublicInventory`) were verified structurally and logically via `scripts/securityAndIntegrityTestSuite.mjs`. To run live emulator tests on your workstation:
     ```bash
     firebase emulators:start --only firestore,storage,functions
     ```

---

## 4. Safe Deployment Checklist, Required Secrets & Rollback Plan

### Required Secrets & Firebase Configuration (Before Enabling Server AI Proxy)
1. Set the Gemini API key in Google Cloud Secret Manager for Firebase Cloud Functions:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
2. Deploy Cloud Functions and Security Rules:
   ```bash
   cd functions && npm install && cd ..
   firebase deploy --only functions,firestore:rules,storage:rules
   ```
   *(Note: When hosted on static GitHub Pages at `https://mmo277.github.io/DAWAYA/` without Firebase Hosting rewrites, `/api/ai/status` safely returns `configured: false` and the app automatically uses its deterministic local clinical engine without exposing any API key).*

### Backwards-Compatible Migration & Rollback Plan
1. **Inventory Public Projection Backfill:** Existing `pharmacyInventory` documents can be synced to `pharmacyPublicInventory` simply by re-saving items in the Pharmacy Owner Portal or running `node scripts/firestoreMigrationAndImport.mjs --dry-run`.
2. **Rollback Instructions:** Keep a copy of the prior `firestore.rules` and `storage.rules` commit in Git history (`git revert HEAD` followed by `firebase deploy --only firestore:rules,storage:rules`).
