import { prisma } from "./prismadb";

export type SessionVibe = {
  rae: number; // Rolling Average Engagement
  intensity: "LIGHT" | "MODERATE" | "DEEP" | "EXHAUSTED";
  recommendedLevelShift: number;
  topCategoryId?: string;
  topCategoryName?: string;
};

/**
 * Calculates the "Vibe" of the current session for a user.
 * Analyzes the last 5 interactions to determine if the agent should push deeper or pull back.
 */
export async function getSessionVibe(userId: string): Promise<SessionVibe> {
  // 1. Fetch last 5 interactions
  const recentInteractions = await prisma.userQuestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { 
      score: true, 
      question: { 
        select: { 
          categoryId: true, 
          level: true,
          category: { select: { name: true } }
        } 
      } 
    },
  });

  if (recentInteractions.length === 0) {
    return { rae: 1.0, intensity: "LIGHT", recommendedLevelShift: 0 };
  }

  // 2. Average Score
  const totalScore = recentInteractions.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const rae = totalScore / recentInteractions.length;

  // 3. Determine Intensity & Shift
  let intensity: SessionVibe["intensity"] = "LIGHT";
  let recommendedLevelShift = 0;

  // Check for "Depth Fatigue" (e.g., consecutive high-level questions)
  const recentLevels = recentInteractions.map(i => i.question?.level || 0);
  const deepCount = recentLevels.filter(l => l >= 7).length;
  
  if (rae >= 2.0) {
    intensity = "DEEP";
    recommendedLevelShift = 2;
    
    // Guardrail: If we've had 2+ deep questions in the last 5, and the vibe is still deep, 
    // maybe it's time to cool down soon? Or if they just had 2 in a row.
    if (deepCount >= 2) {
       intensity = "MODERATE"; // Cap it
       recommendedLevelShift = 0; // Don't push deeper
    }
  } else if (rae >= 1.2) {
    intensity = "MODERATE";
    recommendedLevelShift = 1;
  } else if (rae < 0.6) {
    intensity = "EXHAUSTED";
    recommendedLevelShift = -1;
  }

  // Extreme Guardrail: If the last 2 were Level 8+, force a cooldown regardless of RAE
  if (recentLevels.slice(0, 2).every(l => l >= 8)) {
    intensity = "EXHAUSTED";
    recommendedLevelShift = -2;
  }

  // 4. Find Top Category (most frequently engaged category in recent history)
  const categoryStats: Record<string, { count: number, name: string }> = {};
  recentInteractions.forEach((inter) => {
    const q = inter.question;
    if (q && q.categoryId) {
      if (!categoryStats[q.categoryId]) {
        categoryStats[q.categoryId] = { count: 0, name: q.category?.name || "Unknown" };
      }
      categoryStats[q.categoryId].count++;
    }
  });

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1].count - a[1].count);
  const topCategoryId = sortedCategories[0]?.[0];
  const topCategoryName = sortedCategories[0]?.[1]?.name;

  return {
    rae,
    intensity,
    recommendedLevelShift,
    topCategoryId,
    topCategoryName,
  };
}
