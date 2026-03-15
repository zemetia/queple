# Task: Invisible Architect Agent Flow Implementation
- **Date**: 2026-03-16
- **Status**: In Progress
- **Source**: User request for "overpower gemini flash, please plan task research analyze... comprehensive recommendation for agent flow"

## 🎯 Goal
Transform the Queple experience from static question sets to a self-adapting "Invisible Architect" flow that intelligently adjusts difficulty and topical focus based on silent user engagement metrics (swiping behavior and time-on-card).

## 📋 Implementation Checklist

- [x] **Phase 1: Foundation & Data Layer**
    - [x] Step 1.1: Update `prisma/schema.prisma` to add `score` (Float) and `isHighEngagement` (Boolean) to `UserQuestion` model.
    - [x] Step 1.2: Add `sessionStart` (DateTime) to `User` or handle session-based tracking via an optional `sessionId` in `UserQuestion`. (Decision: Keep it simple, use timestamps for "recent" calculation).
    - [x] Step 1.3: Run `npx prisma generate` and `npx prisma db push` (or migration).
    - [x] Step 1.4: Update `recordInteraction` server action to calculate the Engagement Score: `(Reaction Weight) * (Duration Factor)`.

- [x] **Phase 2: Intelligent API Layer**
    - [x] Step 2.1: Create a "Vibe Service" utility (e.g., in `src/lib/agent.ts`) that calculates the **Rolling Average Engagement (RAE)** for the last session interactions.
    - [x] Step 2.2: Update `POST /api/question` to ingest this "Vibe Profile".
    - [x] Step 2.3: Implement "Level Drifting": If RAE > 2.0, allow one card in the batch to exceed `maxLevel`. If RAE < 0.8, force a Level 1/2 "Reset" card.
    - [x] Step 2.4: Implement "Topic Locking": If a category receives high engagement scores, increase its weight in the next batch select.

- [x] **Phase 3: AI Augmentation (Gemini JIT)**
    - [x] Step 3.1: Enhance the Gemini prompt in `/api/question` to include the "Current Session Context" (e.g., "The couple is very engaged in deep emotional topics, proceed with Level 6 curiosity").
    - [x] Step 3.2: Add a guardrail component to prevent "Emotional Exhaustion" (never more than 2 high-intensity cards).

- [x] **Phase 4: Frontend Integration & Polish**
    - [x] Step 4.1: Ensure `page.tsx` captures duration accurately across all card states (Front vs Back).
    - [ ] Step 4.2: Add subtle visual reinforcement (optional) or keep it "Invisible" as requested.
    - [ ] Step 4.3: Final full-flow verification.

## 🛠️ Technical Details
- **Files affected**:
    - `prisma/schema.prisma`
    - `src/app/actions/game.ts`
    - `src/app/api/question/route.ts`
    - `src/app/page.tsx`
- **Dependencies**:
    - `@prisma/client`
    - `@google/genai`

## 📝 Notes & Discoveries
- Current `recordInteraction` already takes `timeSpent`.
- Most fallback questions are currently static; the Agent should prioritize triggering GenAI when engagement is high to keep things fresh.
