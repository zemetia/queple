// 1. Imports
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prismadb";
import { Question } from "@prisma/client";
import { getFallbackQuestions } from "@/data/fallback-questions";
import { LEVEL_DESCRIPTIONS } from "@/data/level-desc";

// helper to clean JSON
const cleanJson = (text: string) => {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
};

// 3. Main POST Handler
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Parse Body Params
    let userId: string = body.userId;
    const firebaseUid: string = body.firebaseUid;
    const mode: string = body.mode || "zigzag";
    const minLevel: number = parseInt(body.minLevel || "1");
    const maxLevel: number = parseInt(body.maxLevel || "3");
    const allow18Plus: boolean = body.allow18Plus;
    const categoryId: string = body.category;
    const clientExcludeIds: string[] = body.excludeIds || [];

    // Resolve userId
    if (!userId && firebaseUid) {
      const user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
      });
      if (user) userId = user.id;
    }

    // 1. Get Seen Questions
    const excludeIds = new Set<string>(clientExcludeIds);
    if (userId) {
      const userHistory = await prisma.userQuestion.findMany({
        where: {
          userId,
          reaction: {
            in: ["UPVOTE", "DOWNVOTE"],
          },
        },
        select: { questionId: true },
      });
      userHistory.forEach((h) => excludeIds.add(h.questionId));
    }

    // 2. Fetch Helper
    const fetchQuestions = async (
      gender: string | undefined,
      count: number,
      excludeSet: Set<string>,
    ) => {
      const whereClause: any = {
        level: { gte: minLevel, lte: maxLevel },
        id: { notIn: Array.from(excludeSet) },
        is18Plus: allow18Plus ? undefined : false,
        categoryId: categoryId || undefined,
      };
      if (gender) whereClause.forGender = gender;

      const questions = await prisma.question.findMany({
        where: whereClause,
        take: 30, // Fetch more to allow shuffling
      });

      return questions.sort(() => 0.5 - Math.random()).slice(0, count);
    };

    // 3. Logic
    let questions: Question[] = [];
    let neededMap: { gender: string; count: number }[] = [];

    const processMode = async () => {
      if (mode === "zigzag") {
        const [males, females] = await Promise.all([
          fetchQuestions("MALE", 3, excludeIds),
          fetchQuestions("FEMALE", 3, excludeIds),
        ]);
        if (males.length < 3)
          neededMap.push({ gender: "MALE", count: 3 - males.length });
        if (females.length < 3)
          neededMap.push({ gender: "FEMALE", count: 3 - females.length });
        return [...males, ...females];
      } else if (mode === "all_both") {
        const both = await fetchQuestions("BOTH", 6, excludeIds);
        if (both.length < 6)
          neededMap.push({ gender: "BOTH", count: 6 - both.length });
        return both;
      } else {
        // zigzag_both
        const [m, f, b] = await Promise.all([
          fetchQuestions("MALE", 2, excludeIds),
          fetchQuestions("FEMALE", 2, excludeIds),
          fetchQuestions("BOTH", 2, excludeIds),
        ]);
        if (m.length < 2)
          neededMap.push({ gender: "MALE", count: 2 - m.length });
        if (f.length < 2)
          neededMap.push({ gender: "FEMALE", count: 2 - f.length });
        if (b.length < 2)
          neededMap.push({ gender: "BOTH", count: 2 - b.length });
        return [...m, ...f, ...b];
      }
    };

    questions = await processMode();

    // 4. GenAI Generation (fallback)
    if (neededMap.length > 0) {
      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          console.log("Triggering GenAI for:", JSON.stringify(neededMap));

          const results = await Promise.all(
            neededMap.map(async (req) => {
              let adultProgression = "";
              if (allow18Plus) {
                adultProgression = `
                18+ INTIMACY PROGRESSION (MANDATORY):
                - Level 1-2: NOT 18+. Keep it light and non-sexual.
                - Level 3-4: Light physical intimacy (kissing, cuddling, touch, physical attraction).
                - Level 5-6: Moderate sexual intimacy (oral sex, detailed preferences, foreplay).
                - Level 7-8: Intense sexual exploration (anal sex, kinks, adventurous physical acts).
                - Level 10: EXTREMELY 21+. The most raw, naked sexual truths, deepest sexual fantasies, and "no-filter" physical questions.
                `;
              }
              const prompt = `You are a world-class relationship therapist and connection expert.
              Goal: Generate ONE unique, deep question for a couple.
              Generate ${req.count} unique questions.
              
              Target Audience: The question is specifically for the ${req.gender === "BOTH" ? "COUPLE to answer together" : req.gender + " partner to answer"}.
              
              Gender Nuance Rules:
              - If MALE: Focus on masculine psychology, logic-based scenarios, hobbies/gadgets, protective instincts, or communication styles associated with men.
              - If FEMALE: Focus on feminine psychology, emotional nuances, care rituals, beauty/self-image, or specific female experiences (like cycles or emotional safety).
              - If BOTH: Focus on shared experiences and mutual growth.
              
              Scale: 1 (Surface) to 10 (Naked Truth).
              Selected Level: ${minLevel} (${LEVEL_DESCRIPTIONS[minLevel]}) to ${maxLevel} (${LEVEL_DESCRIPTIONS[maxLevel]})
              Category: ${categoryId ? "Matching provided ID" : "Varied"}
              18+ Intimacy Mode: ${allow18Plus ? "ENABLED" : "DISABLED"}
              
              ${adultProgression}
              
              Rules:
              - Return ONLY the question text.
              - BE COMPACT: Keep the question to 1-3 sentences maximum. Get straight to the point.
              - EXCEPTION: 'Case Study' questions can be longer (3-5 sentences) to properly set up the scenario.
              - If adult mode is enabled, the question MUST strictly follow the INTIMACY PROGRESSION listed above for Level maximum ${maxLevel}.
              - If adult mode is disabled, keep it purely emotional or psychological.
              - Level 10 must always be "shattering" in its transparency, regardless of adult mode.`;

              try {
                const response = await genAI.models.generateContent({
                  model: "gemini-2.5-flash-preview-09-2025",
                  config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          content: { type: "STRING" },
                          level: { type: "INTEGER" },
                          forGender: {
                            type: "STRING",
                            enum: ["MALE", "FEMALE", "BOTH"],
                          },
                          is18Plus: { type: "BOOLEAN" },
                        },
                        required: ["content", "level", "forGender", "is18Plus"],
                      },
                    },
                  },
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                });

                if (response.text) {
                  // Robust text access
                  const rawText = response.text;
                  console.log("GenAI Raw Response:", rawText); // Debug log
                  const cleanText = cleanJson(rawText);

                  try {
                    const data = JSON.parse(cleanText);
                    if (Array.isArray(data)) {
                      // Save and return
                      const saved = [];
                      const catId = await getCategoryId(categoryId);

                      for (const q of data) {
                        try {
                          const newQ = await prisma.question.create({
                            data: {
                              content: q.content,
                              level: Number(q.level) || 1,
                              forGender: q.forGender || req.gender,
                              is18Plus: !!q.is18Plus,
                              categoryId: catId,
                              creatorId: userId || "0000000000000000000000000",
                            },
                          });
                          saved.push(newQ);
                        } catch (e) {
                          console.error("DB Save error", e);
                        }
                      }
                      return saved;
                    } else {
                      console.error("GenAI Response is not an array:", data);
                    }
                  } catch (parseError) {
                    console.error(
                      "JSON Parse Error:",
                      parseError,
                      "Cleaned Text:",
                      cleanText,
                    );
                  }
                } else {
                  console.error("GenAI Response .text is empty");
                }
              } catch (e) {
                console.error("GenAI inner error (API call failed):", e);
              }
              return [];
            }),
          );

          results.flat().forEach((q) => questions.push(q));
        } catch (err) {
          console.error("GenAI Global Error:", err);
        }
      } else {
        console.warn("No GEMINI_API_KEY found, skipping AI generation.");
      }
    }

    // 5. Final Fallback (Using High Quality Static List)
    for (const req of neededMap) {
      const has = questions.filter((q) => q.forGender === req.gender).length;
      const target = mode === "zigzag" ? 3 : mode === "all_both" ? 6 : 2;
      if (has < target) {
        const missing = target - has;
        if (missing > 0) {
          console.warn(`Using ${missing} STATIC FALLBACKS for ${req.gender}`);
          const fallbackQs = getFallbackQuestions(
            req.gender,
            missing,
            excludeIds,
          );
          questions.push(...fallbackQs);
        }
      }
    }

    // 6. Sort
    let sortedQuestions: Question[] = [];
    const usedIds = new Set<string>();

    const pop = (gender: string) => {
      const idx = questions.findIndex(
        (q) => q.forGender === gender && !usedIds.has(q.id),
      );
      if (idx >= 0) {
        const q = questions[idx];
        usedIds.add(q.id);
        return q;
      }
      return null;
    };

    if (mode === "zigzag") {
      for (let i = 0; i < 3; i++) {
        const m = pop("MALE");
        if (m) sortedQuestions.push(m);
        const f = pop("FEMALE");
        if (f) sortedQuestions.push(f);
      }
    } else {
      // Simple shuffle for others
      questions.forEach((q) => {
        if (!usedIds.has(q.id)) {
          sortedQuestions.push(q);
          usedIds.add(q.id);
        }
      });
      sortedQuestions.sort(() => 0.5 - Math.random());
    }

    // Last ditch fill
    if (sortedQuestions.length < 6) {
      questions.forEach((q) => {
        if (!usedIds.has(q.id)) sortedQuestions.push(q);
      });
    }

    return NextResponse.json(sortedQuestions.slice(0, 6));
  } catch (error) {
    console.error("POST /api/question Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

async function getCategoryId(preferred?: string) {
  if (preferred) return preferred;
  const cat = await prisma.category.findFirst();
  return cat?.id || "c7";
}
