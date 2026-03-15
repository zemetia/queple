# Task: Mandatory Login Implementation
- **Date**: 2026-03-16
- **Status**: In Progress
- **Source**: User request "make the login is mandatory (no guest / anonym)"

## 🎯 Goal
Ensure that the application is only accessible and usable by authenticated users. Remove all support for guest or anonymous sessions, including transient "shadow users" and system-level fallbacks for interactions.

## 📋 Implementation Checklist
- [x] **Phase 1: Research & Discovery**
    - [x] Step 1.1: Analyze `src/app/page.tsx` for front-end authentication gates.
    - [x] Step 1.2: Analyze `src/app/actions/game.ts` for guest/shadow user logic.
    - [x] Step 1.3: Analyze `src/app/api/question/route.ts` for existing mandatory login checks.
    - [x] Step 1.4: Search for any other occurrences of "guest" or "anonym" in the codebase.

- [x] **Phase 2: Backend Logic Cleanup**
    - [x] Step 2.1: Remove "shadow user" creation logic from `src/app/actions/game.ts`.
    - [x] Step 2.2: Remove `SYSTEM_USER_ID` fallback in `recordInteraction`. Throw an error or return early if no valid user is found.
    - [x] Step 2.3: Update `POST /api/question` to ensure it doesn't allow any bypass (already looks fairly strict, but double-check).
    - [x] Step 2.4: Update reaction API to return 401 for unauthenticated users.

- [x] **Phase 3: Frontend Enforcement**
    - [x] Step 3.1: Modify `src/app/page.tsx` to strictly redirect or show a login screen if the user is not authenticated.
    - [x] Step 3.2: Remove the "Preferences" or other features that might be accessible without login if they should be restricted.
    - [x] Step 3.3: Handle authentication loading state in the main entry point.

- [ ] **Phase 4: Testing & Verification**
    - [ ] Step 4.1: Verify blocked access to game without login.
    - [ ] Step 4.2: Verify no "guest_" records are created in DB.
    - [ ] Step 4.3: Verify interactions are correctly linked to authenticated users only.
    - [ ] Step 4.4: Verify `SYSTEM_USER_ID` is no longer used for user interactions.

## 🛠️ Technical Details
- Files affected:
    - `src/app/actions/game.ts`
    - `src/app/page.tsx`
    - `src/app/api/question/route.ts`
- Dependencies: Firebase Auth, Prisma

## 📝 Notes & Discoveries
- `recordInteraction` currently creates a "shadow user" for `guest_` firebaseUids.
- `recordInteraction` falls back to a hardcoded `SYSTEM_USER_ID`.
- `POST /api/question` already has a 401 check for `!userId`.
