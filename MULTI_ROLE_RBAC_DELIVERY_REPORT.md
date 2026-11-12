# DAWAYA — COMPLETE USER ROLES, PERMISSIONS & MULTI-INTERFACE SYSTEM REPORT

## A. Codebase Audit
- **Existing Architecture:** React 18 + TypeScript + Vite SPA/PWA with HashRouter, Three.js 3D medical simulations, 26,562+ Egyptian medications index, and Firebase Authentication + Cloud Firestore.
- **Previous Role System:** Single-string `role` in `roles/{uid}` with basic role-name comparisons.
- **Upgraded Architecture:** Unified multi-role, permission-driven authorization engine (`rbacEngine.ts`) with scoped `pharmacyMemberships` and `regionalMemberships`, dynamic `RoleModeSwitcher` (`تغيير الوضع / Switch Mode`), role-adapted layouts/navigation (`Patient Mode`, `Pharmacy Mode`, `Admin/Regional/Content Mode`), and 100% Firebase Spark (Free Plan) server-side enforcement via `firestore.rules`.

## B. Key Files Created or Modified
- `rbacEngine.ts` *(New)*: Core Multi-Role, Scoped Membership, and Granular Permission Engine (11 canonical roles, 21 permissions, `hasRole`, `hasPermission`, `canAccessPharmacy`, `canAccessBranch`, `canAccessRegion`, `getActiveMembership`, `getAuthorizedRoles`, `assignUserRoleWithScope`, `revokeUserRoleWithAudit`, `setUserAccountStatusWithAudit`).
- `RoleSwitcherAndGuard.tsx` *(New)*: Interactive `RoleModeSwitcher` (`تغيير الوضع / Switch Mode`), `ProtectedRoute`, and `PermissionGuard` components.
- `authContext.tsx` & `auth.tsx` *(Upgraded)*: Automatic default `"patient"` role registration, multi-role state hydration, active role/mode switching without sign-out, and permission refresh.
- `UsersTab.tsx` *(Upgraded)*: Complete Central Admin **User & Role Management** control center with user search, multi-role assignment, mandatory pharmacy/governorate linking, granular permission checkboxes, one-click role revocation (with safe fallback to `patient`), account suspension/restoration, RBAC Matrix viewer, and immutable `auditLogs` viewer.
- `Dashboard.tsx` *(Upgraded)*: Role-adapted Central Admin, Regional Manager (governorate-scoped), and Content Editor/Reviewer interfaces with zero access to private patient medical records.
- `PharmacyOwnerDashboard.tsx` *(Upgraded)*: Role-adapted Pharmacy Owner, Branch Manager, Pharmacist, and Pharmacy Employee interfaces governed by granular permissions (`inventory.manage`, `orders.manage`, `employees.manage`, `reports.view`) and multi-pharmacy membership switching.
- `Layout.tsx` & `App.tsx` *(Upgraded)*: Header and drawer `RoleModeSwitcher`, role-aware bottom navigation dock, route-level `ProtectedRoute` enforcement, and 1-swipe native screen-edge back navigation.
- `firestore.rules` & `firestore.indexes.json` *(Upgraded)*: Server-side enforcement for `roles`, `userRoles`, `pharmacyMemberships`, `regionalMemberships`, `roleDefinitions`, `auditLogs`, `customerProfiles`, regional scoping, and pharmacy tenant isolation on the Firebase Free Plan.
- `scripts/securityAndIntegrityTestSuite.mjs` *(Upgraded)*: Automated functional test suite verifying registration, role assignment, multi-role mode switching, role revocation, pharmacy isolation, regional scoping, and full AST compilation.

## C. Database Schema & Indexes
- `customerProfiles/{uid}`: `{ uid, email, displayName, photoURL, accountStatus: 'active' | 'suspended', defaultRole: 'patient', activeRole, createdAt, updatedAt }`
- `roles/{uid}`: `{ uid, role, canonicalRole, roles: CanonicalRole[], status, accountStatus, pharmacyId, regionId, permissions, updatedAt, updatedBy }`
- `userRoles/{uid}_{role}`: `{ id, uid, role, status: 'active' | 'revoked', pharmacyId, regionId, permissions, assignedBy, assignedAt }`
- `pharmacyMemberships/{uid}_{pharmacyId}`: `{ id, uid, pharmacyId, pharmacyNameAr, branchIds, role, permissions, status, assignedBy, assignedAt }`
- `regionalMemberships/{uid}_{regionId}`: `{ id, uid, regionId, regionNameAr, role: 'regional_manager', permissions, status, assignedBy, assignedAt }`
- `auditLogs/{logId}`: `{ id, actorUid, actorEmail, targetUid, action, previousValue, newValue, timestamp, reason, relevantResourceId }`

## D. Role & Permission Matrix
| Role ID | Interface Mode | Default Permissions |
| :--- | :--- | :--- |
| `patient` | `patient` | `patient.access`, `medications.view` |
| `pharmacy_employee` | `pharmacy` | `patient.access`, `inventory.view`, `orders.view`, `orders.manage`, `medications.view` |
| `pharmacist` | `pharmacy` | `patient.access`, `pharmacies.view`, `inventory.view`, `inventory.manage`, `orders.view`, `orders.manage`, `medications.view` |
| `pharmacy_manager` | `pharmacy` | `patient.access`, `pharmacies.view`, `inventory.view`, `inventory.manage`, `orders.view`, `orders.manage`, `employees.manage`, `reports.view`, `medications.view` |
| `pharmacy_owner` | `pharmacy` | `patient.access`, `pharmacies.view`, `pharmacies.manage`, `inventory.view`, `inventory.manage`, `orders.view`, `orders.manage`, `employees.manage`, `reports.view`, `medications.view` |
| `content_editor` | `admin` | `patient.access`, `medications.view`, `medications.manage`, `content.manage` *(Zero access to private patient files)* |
| `content_reviewer` | `admin` | `patient.access`, `medications.view`, `medications.manage`, `medications.approve`, `content.manage`, `content.review` *(Zero access to private patient files)* |
| `regional_manager` | `admin` | `patient.access`, `pharmacies.view`, `pharmacies.approve`, `pharmacies.manage`, `regions.manage`, `reports.view`, `medications.view` *(Scoped to assigned `regionId`; zero access to private patient files)* |
| `central_admin` | `admin` | All operational, user/role, pharmacy, content, and audit permissions |
| `super_admin` | `admin` | Full executive permissions including `system.settings.manage` and assigning `central_admin` / `super_admin` |
