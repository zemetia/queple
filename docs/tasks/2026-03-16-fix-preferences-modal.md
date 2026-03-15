# Task: Fix Preferences Modal Re-rendering and Mature Content Visibility
- **Date**: 2026-03-16
- **Status**: Completed
- **Source**: User Request

## 🎯 Goal
1. Fix the bug where clicking "intensity level range" or "deck type" causes the settings modal to re-render and re-trigger its entrance animation.
2. Hide the "Allow Mature Content" toggle for users who are under 21 years old.

## 📋 Implementation Checklist
- [x] **Phase 1: Fix Settings Modal Re-rendering**
    - [x] Inline the `SettingsModal` JSX directly into `GamePage` OR move the component definition outside of `GamePage` and pass down state as props. (Inlining is simpler since it uses a lot of local state like `settings`, `setSettings`, `gameStarted`, `fetchQuestions`).
    - [x] Verify that changing settings no longer causes the modal to run its entrance animation.
- [x] **Phase 2: Add Database User to Auth Context**
    - [x] Update `src/components/AuthProvider.tsx` to include a `dbUser` state.
    - [x] Update the `AuthContextType` interface to include `dbUser: any | null` (or proper Prisma User type).
    - [x] In the `onAuthStateChanged` callback, when `/api/auth/check` returns `data.user`, set it to the `dbUser` state.
    - [x] Expose `dbUser` via the `AuthContext.Provider` value.
- [x] **Phase 3: Conditionally Render "Allow Mature Content"**
    - [x] In `src/app/page.tsx`, retrieve `dbUser` from `useAuth()`.
    - [x] Create a helper function inside or outside `GamePage` (e.g., `calculateAge(birthday: string | Date | null)`) to calculate the user's age based on `dbUser?.birthday`.
    - [x] Wrap the "18+ Toggle" section in the settings modal with `{userAge >= 21 && (...)}`.
- [x] **Phase 4: Testing & Verification**
    - [x] Test the settings modal UI interactions (deck type, level range) to ensure no re-renders.
    - [x] Verify the "Allow Mature Content" toggle visibility logic with mock user data (age > 21 and age < 21).

## 🛠️ Technical Details
- Files affected: `src/app/page.tsx`, `src/components/AuthProvider.tsx`
- Dependencies: None added

## 📝 Notes & Discoveries
