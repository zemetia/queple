# Task: Fix `/api/auth/create` 500 Internal Server Error on New User Onboarding

- **Date**: 2026-03-16
- **Status**: In Progress
- **Source**: User report — "Found an issue: Internal Server Error" after Google login and filling onboarding form

---

## 🎯 Goal

Fix the `POST /api/auth/create` endpoint that returns a 500 error when a new user completes onboarding (birthday + location). The fix must be complete — the user must land on the game page with a valid `dbUser` state after onboarding.

---

## 🔍 Root Cause Analysis (3-Pass Verified)

| # | Root Cause | Location | Impact |
|---|-----------|----------|--------|
| 1 | **`prisma.user.create()` throws on duplicate** — if the user's email or `firebaseUid` already exists (edge case: re-registering, previous partial DB state), Prisma throws a `P2002` unique constraint error which is caught and swallowed as a generic 500. Should use `upsert` on `firebaseUid`. | `src/app/api/auth/create/route.ts` | **Critical** — causes the 500 |
| 2 | **`onComplete` never updates `dbUser` state** — after successful onboarding, `AuthProvider` calls `onComplete(data.user)` but the callback only does `setNeedsOnboarding(false)` and does NOT call `setDbUser(userData)`. So `dbUser` stays `null` for new users until page refresh. | `src/components/AuthProvider.tsx` line 117-120 | **High** — new user has no `dbUser` after completing onboarding |
| 3 | **Generic error swallowing** — the `catch` block in `create/route.ts` discards the real Prisma error message. Need to surface it in dev and handle known Prisma errors gracefully. | `src/app/api/auth/create/route.ts` line 29-34 | **Medium** — makes debugging impossible |

---

## 📋 Implementation Checklist

### Phase 1: Fix the API Route (`create/route.ts`)
- [x] **1.1** Switch from `prisma.user.create()` to `prisma.user.upsert()` using `firebaseUid` as the where clause
  - `create:` block stays the same
  - `update:` block updates `email`, `name`, `image`, `birthday`, `ipAddress`, `location` (so re-runs are idempotent)
- [x] **1.2** Add specific Prisma error handling for `P2002` (unique constraint) to return a cleaner 409 response
- [x] **1.3** Log the full error object, not just a string, so Vercel logs show the actual Prisma error details

### Phase 2: Fix `AuthProvider` Post-Onboarding State
- [x] **2.1** Update the `onComplete` callback in `AuthProvider` — call `setDbUser(userData)` so the returned DB user is stored in context immediately after onboarding

### Phase 3: Verify & Test
- [ ] **3.1** Deploy or test locally — sign in with a brand new Google account (use incognito)
- [ ] **3.2** Complete the onboarding form and verify no 500 error
- [ ] **3.3** Verify that `dbUser` is populated immediately after onboarding (check Settings panel shows user age properly, 18+ toggle visible if age >= 21)
- [ ] **3.4** Test with an existing user (re-onboarding edge case) — should still succeed with upsert

---

## 🛠️ Technical Details

**Files changed:**
- `src/app/api/auth/create/route.ts` — switch to `upsert`, improve error handling
- `src/components/AuthProvider.tsx` — call `setDbUser` in `onComplete` callback

**Prisma note:** `upsert` on `firebaseUid` is safe because `firebaseUid` is `@unique` in the schema. The `update` block should update all mutable fields so re-running onboarding is idempotent.

**No schema changes needed.**

---

## 📝 Notes & Discoveries

- The `sync` route already uses `upsert` correctly — `create` should follow the same pattern.
- The `check` route works fine (returning `exists: false`) so the DB connection itself is not the problem.
- The error being caught is almost certainly a Prisma `P2002` unique constraint violation on `email` or `firebaseUid`.
