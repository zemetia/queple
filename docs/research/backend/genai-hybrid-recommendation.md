# Hybrid GenAI Question Recommendation System

## Overview

This feature implements a hybrid recommendation system for the "Queple" card game. It combines existing database content with on-demand Generative AI (Gemini) generation to ensure users always have fresh, relevant questions. The system adapts to user-selected "depth levels" (1-3, 2-6, or 1-10) and learns from implicit feedback (reappearing skipped cards, suppressing read cards).

## Recommended Libraries

1.  **`@google/genai`**: Official SDK for Gemini.
    - _Reason_: Most reliable integration for the specified model (Gemini 1.5 Flash).
    - _Action_: `npm install @google/genai` (Not yet installed).

## Implementation Strategy

### 1. User Flow & State Management

- **Frontend State**:
  - `viewedQuestions`: Array of strings (UUIDs) stored in `localStorage`. Only "Flipped" or "Read" cards are added here.
  - `levelPreference`: User-selectable range (e.g., 1-3 for Light, 2-6 for Moderate, 1-10 for All).
  - `genderMode`: Current user view mode (e.g., "MALE" implies questions for him, "FEMALE" for her, or "BOTH" for couples/joint).
  - `allow18Plus`: Boolean toggle for "Spicy Mode".

- **Request Payload**:
  ```json
  {
    "levelRange": { "min": 1, "max": 6 },
    "excludeIds": ["uuid-1", "uuid-2"],
    "category": "optional-category-id",
    "targetGender": "MALE", // "MALE", "FEMALE", "BOTH"
    "allow18Plus": true,
    "limit": 5 // Support for bulk requests (5-10 cards)
  }
  ```

### 2. Backend Logic (Hybrid Approach)

The backend (`/api/recommendations`) will execute the following logic:

1.  **Database Lookup**:
    - Query `Question` table.
    - **Filters**:
      - `level`: >= min AND <= max.
      - `id`: NOT IN `excludeIds`.
      - `forGender`:
        - If request is `MALE`: include `forGender` IN ['MALE', 'BOTH'].
        - If request is `FEMALE`: include `forGender` IN ['FEMALE', 'BOTH'].
        - If request is `BOTH`: include all (or focus on 'BOTH' depending on game mode logic).
      - `is18Plus`:
        - If `allow18Plus` is false: `is18Plus` MUST be false.
        - If `allow18Plus` is true: include both true and false.
    - **Limit**: `limit` (default 5).
    - _Optimization_: Use raw SQL `RANDOM()` or sample larger set in Prisma and shuffle in JS.

2.  **GenAI Fallback/Injection**:
    - **Trigger**: If database returns < `limit` questions OR (Random Probability ~20% to keep content fresh).
    - **Action**: Call Gemini API with the **Backend Prompt** (defined below), passing dynamic gender and 18+ constraints.
    - **Persistence**: Save valid AI-generated questions to DB immediately with `creatorId: "0000000000000000000000000"`.
    - **Return**: Combine DB questions + AI questions in response.

### 3. Database Changes

- **No Schema Changes Required**:
  - `level`: Already exists (Int).
  - `forGender`: Already exists (String).
  - `is18Plus`: Already exists (Boolean).
  - `creatorId`: Already has a default zero-UUID for AI/System questions.

## Backend Prompt Design

This is the core prompt to be used with the Gemini API.

**Context**: Function strings provided dynamically based on user request.

````text
You are an expert conversationalist/therapist designing questions for a couple's deep-talk card game called 'Queple'.

**Task**: Generate {LIMIT} unique, engaging questions based exclusively on the provided criteria.

**Criteria**:
- **Target Audience**: Couples (dating or married).
- **Target Gender**: {TARGET_GENDER} (The question is directed AT this gender or BOTH).
  - IF MALE: Question is for him to answer.
  - IF FEMALE: Question is for her to answer.
  - IF BOTH: Question is for both to discuss.
- **Content Rating**: {RATING_CONTEXT}
  - IF ALLOW_18_PLUS=FALSE: Strictly PG-13. No explicit sexual content.
  - IF ALLOW_18_PLUS=TRUE: Can include spicy, intimate, or sexually explicit topics if the level is high (8-10).
- **Level Range**: {MIN_LEVEL} to {MAX_LEVEL}
  - Level 1-3: Fun, lighthearted, ice-breakers, childhood memories.
  - Level 4-7: Relationship values, future goals, emotional vulnerability.
  - Level 8-10: Deep intimacy, secrets, sexual preferences (only if 18+ allowed), critical relationship analysis.
- **Category**: {CATEGORY_NAME} (e.g., "Future", "Privacy", "Personality").
- **Tone**: Empathetic, curiosity-inducing, non-judgmental.

**Constraints**:
- Output MUST be a valid JSON array.
- Do NOT include any markdown formatting (like ```json).
- Questions must be concise (under 30 words).

**Output Format**:
[
  {
    "content": "Question text here...",
    "level": <Integer between {MIN_LEVEL} and {MAX_LEVEL}>,
    "forGender": "{TARGET_GENDER}", // "MALE", "FEMALE", or "BOTH"
    "is18Plus": <Boolean>, // True only if content is explicit/mature
    "suggested_category": "{CATEGORY_NAME}"
  }
]
````

### 4. Recommendation Algorithm (Future)

- **Inputs**: Last 5 `UserQuestion` entries where reaction='UPVOTE'.
- **Adaptation**: If user upvotes "Deep" questions, skew random selection towards higher levels within their selected range.

## Security Considerations

- **Rate Limiting**: GenAI calls are expensive/limited. Implement strict rate limiting on the generation endpoint.
- **Content Safety**:
  - If `allow18Plus` is TRUE: Set Gemini Safety Settings to `BLOCK_NONE` or `BLOCK_ONLY_HIGH` for Sexually Explicit category.
  - If `allow18Plus` is FALSE: Set Gemini Safety Settings to `BLOCK_MEDIUM_AND_ABOVE` (Strict).
