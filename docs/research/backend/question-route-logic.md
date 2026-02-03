# Smart Question Retrieval Route (`GET /api/question`)

## Overview

This research outlines the implementation of a smart, state-aware `GET /api/question` route. Unlike the previous stateless `POST` endpoint, this route utilizes server-side logic to track user history ("seen" questions), handles advanced display modes (Zigzag), and integrates on-demand Generative AI when database content is exhausted.

## 1. Request Interface

The route will accept configuration via Query Parameters.

**Endpoint**: `GET /api/question`

| Parameter     | Type      | Default  | Description                                      |
| :------------ | :-------- | :------- | :----------------------------------------------- |
| `mode`        | `string`  | `zigzag` | Layout mode: `all_both`, `zigzag`, `zigzag_both` |
| `minLevel`    | `int`     | `1`      | Minimum depth level (1-10)                       |
| `maxLevel`    | `int`     | `3`      | Maximum depth level (1-10)                       |
| `allow18Plus` | `boolean` | `false`  | Enable mature content                            |
| `category`    | `string`  | `null`   | Optional Category ID filter                      |

## 2. Implementation Strategy

### A. Authentication & State Lookup

Instead of the client sending a list of excluded IDs (which grows indefinitely), the server will look up the user's history.

1. Identify User via Session/Auth Token.
2. Query `UserQuestion` table: `SELECT questionId FROM UserQuestion WHERE userId = {currentUserId}`.
3. Use this list as the `NOT IN` filter for subsequent question queries.

### B. Mode Handling & Fetching Logic

To satisfy the request for 6 questions in specific modes, we must construct tailored database queries. A single random query is insufficient for "Zigzag" patterns.

#### Mode 1: `all_both`

- **Goal**: 6 questions for "Both".
- **Query**: `findMany({ where: { forGender: 'BOTH', id: { notIn: seenIds } }, take: 6 })`

#### Mode 2: `zigzag` (Male-Female)

- **Goal**: Alternating M-F-M-F-M-F (3 Male, 3 Female).
- **Query**: Two parallel queries are required.
  - Q1: Fetch 3 interactions where `forGender: 'MALE'`
  - Q2: Fetch 3 interactions where `forGender: 'FEMALE'`
- **Assembly**: Interleave results: `[M[0], F[0], M[1], F[1], M[2], F[2]]`.

#### Mode 3: `zigzag_both` (Randomly Appear)

- **Goal**: A mix of Male, Female, and Both, maintaining a zigzag flow or random injection.
- **Approach**: Fetch 2 Male, 2 Female, 2 Both.
- **Assembly**: Shuffle or Interleave (e.g., M-B-F-M-B-F).

### C. GenAI Fallback Strategy

Use the **Hybrid Logic** established in previous research. If the DB queries return fewer items than needed, trigger Gemini.

**Example for Zigzag Mode**:

- Need: 3 Male, 3 Female.
- Found: 1 Male, 3 Female.
- **Action**: Generate 2 Male questions using Gemini.
- **Prompt Adjustment**: The prompt must explicitly request the _missing_ gender and count.

### D. Response Format

Returns an array of 6 Question objects, pre-sorted according to the requested mode.

```json
[
  { "id": "...", "content": "Question for Him...", "forGender": "MALE", "type": "database" },
  { "id": "...", "content": "Question for Her...", "forGender": "FEMALE", "type": "generated" },
  ...
]
```

## 3. Database & Performance Considerations

- **`excludeIds` Scaling**: As a user plays hundreds of cards, `UserQuestion` grows.
  - _Current Scale_: Fine for < 10,000 cards.
  - _Future Optimization_: Use a Bloom Filter or check usually "latest" interactions if checking all history becomes slow, though PostgreSQL handles `NOT IN` reasonably well for moderate sets (up to thousands).
- **Concurrency**: Parallelizing the DB queries (Male/Female) using `Promise.all` is recommended for latency.

## 4. Proposed Questions Logic Flow

```typescript
// Pseudo-code for Route Handler
export async function GET(req) {
  const user = await getUser();
  const seenIds = await prisma.userQuestion.findMany({
    select: { questionId: true },
    where: { userId: user.id },
  });

  const mode = req.nextUrl.searchParams.get("mode");
  let questions = [];

  if (mode === "zigzag") {
    const [males, females] = await Promise.all([
      fetchQuestions("MALE", 3, seenIds),
      fetchQuestions("FEMALE", 3, seenIds),
    ]);
    // Check lengths, if males.length < 3 -> GenAI(count: 3-len, gender: 'MALE')
    questions = interleave(males, females);
  }
  // ... other modes

  return NextResponse.json(questions);
}
```
