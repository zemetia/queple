import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma as client } from "@/lib/prismadb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      levelRange = { min: 1, max: 3 },
      excludeIds = [],
      targetGender = "BOTH", // MALE, FEMALE, BOTH
      allow18Plus = false,
      limit = 5,
      category,
    } = body;

    // 1. Database Lookup
    const minLevel = Math.max(1, levelRange.min || 1);
    const maxLevel = Math.min(10, levelRange.max || 10);

    const genderFilter =
      targetGender === "BOTH" ? undefined : { in: [targetGender, "BOTH"] };

    const is18PlusFilter = allow18Plus ? undefined : false;

    // Fetch from DB
    const dbQuestions = await client.question.findMany({
      where: {
        level: {
          gte: minLevel,
          lte: maxLevel,
        },
        id: {
          notIn: excludeIds,
        },
        forGender: genderFilter,
        is18Plus: is18PlusFilter,
        categoryId: category ? category : undefined,
      },
      take: limit * 2,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
      },
    });

    // Simple Shuffle
    const shuffledDbQuestions = dbQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);

    // 2. Decide if we need GenAI
    const needsMore = shuffledDbQuestions.length < limit;
    const randomTrigger = Math.random() < 0.2; // 20% chance to inject fresh content

    if (!needsMore && !randomTrigger) {
      return NextResponse.json({
        source: "database",
        questions: shuffledDbQuestions,
      });
    }

    // calculate how many to generate
    const countToGenerate = needsMore ? limit - shuffledDbQuestions.length : 1;

    // 3. GenAI Generation
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set. Returning DB questions only.");
      return NextResponse.json({
        source: "database_fallback",
        questions: shuffledDbQuestions,
      });
    }

    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
      You are an expert conversationalist/therapist designing questions for a couple's deep-talk card game called 'Queple'.

      **Task**: Generate ${countToGenerate} unique, engaging questions based exclusively on the provided criteria.

      **Criteria**:
      - **Target Audience**: Couples (dating or married).
      - **Target Gender**: ${targetGender} (The question is directed AT this gender or BOTH).
        - IF MALE: Question is for him to answer.
        - IF FEMALE: Question is for her to answer.
        - IF BOTH: Question is for both to discuss.
      - **Content Rating**: ${allow18Plus ? "Mature/Spicy allowed (IF level is high)" : "Strictly PG-13 (No sexual content)"}
        - IF ALLOW_18_PLUS=FALSE: Strictly PG-13. No explicit sexual content.
        - IF ALLOW_18_PLUS=TRUE: Can include spicy, intimate, or sexually explicit topics if the level is high (8-10).
      - **Level Range**: ${minLevel} to ${maxLevel}
        - Level 1-3: Fun, lighthearted, ice-breakers.
        - Level 4-7: Relationship values, future goals, emotional vulnerability.
        - Level 8-10: Deep intimacy, secrets, sexual preferences (if 18+), critical analysis.
      - **Category**: ${category ? "Specific Category ID provided (try to match implicit context)" : "General / Mixed"}
      - **Tone**: Empathetic, curiosity-inducing, non-judgmental.

      **Output Format**: JSON Array.
      Ensure the 'content' is under 30 words.
    `;

    // Updated SDK Call for @google/genai
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
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
              suggested_category: { type: "STRING" },
            },
            required: ["content", "level", "forGender", "is18Plus"],
          },
        },
      },
      contents: prompt,
    });

    let generatedQuestions: any[] = [];
    try {
      if (response.text) {
        generatedQuestions = JSON.parse(response.text);
      }
    } catch (e) {
      console.error("Failed to parse GenAI response", e);
    }

    // 4. Save to Database
    const savedQuestions = [];

    let defaultCategoryId = category;

    if (!defaultCategoryId) {
      const anyCat = await client.category.findFirst();
      if (anyCat) defaultCategoryId = anyCat.id;
      else {
        const newCat = await client.category.create({
          data: { name: "General" },
        });
        defaultCategoryId = newCat.id;
      }
    }

    if (Array.isArray(generatedQuestions)) {
      for (const q of generatedQuestions) {
        try {
          const newQ = await client.question.create({
            data: {
              content: q.content,
              level: q.level,
              forGender: q.forGender,
              is18Plus: q.is18Plus,
              categoryId: defaultCategoryId,
            },
          });
          savedQuestions.push(newQ);
        } catch (e) {
          console.error("Failed to save generated question", e);
        }
      }
    }

    const finalMix = [...shuffledDbQuestions, ...savedQuestions].slice(
      0,
      limit,
    );

    return NextResponse.json({
      source: "hybrid",
      questions: finalMix,
    });
  } catch (error) {
    console.error("Recommendation API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
