"use server";

import { prisma } from "@/lib/prismadb";

// In a real app, we would get the userId from the session.

export async function recordInteraction(
  questionId: string,
  reaction: "UPVOTE" | "DOWNVOTE" | "SKIP",
  timeSpent: number,
  userId?: string,
  firebaseUid?: string,
) {
  // 1. Skip if this is a transient fallback question (not in DB)
  if (questionId.startsWith("fallback-") || questionId.startsWith("mock-")) {
    return { success: true };
  }

  try {
    let validUserId = userId;

    // If no direct DB ID, try resolving from Firebase UID
    if (!validUserId && firebaseUid) {
      const user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
      });

      if (user) {
        validUserId = user.id;
      }
    }

    // MANDATORY: If still no user ID, we DO NOT fall back to system.
    // We strictly require an authenticated user.
    if (!validUserId) {
      console.warn(`Attempted interaction without valid user (UID: ${firebaseUid}). Rejected.`);
      return { success: false, error: "Authentication required" };
    }

    // Calculate Intelligence Score
    // Formula: (Reaction Weight) * (Duration Factor)
    let reactionWeight = 0.5; // Default for SKIP
    if (reaction === "UPVOTE") reactionWeight = 1.5;
    if (reaction === "DOWNVOTE") reactionWeight = -1.0;

    let durationFactor = 1.0;
    if (timeSpent < 5) durationFactor = 0.2; // Boredom
    if (timeSpent > 30) durationFactor = 2.5; // Deep conversation

    const score = Number((reactionWeight * durationFactor).toFixed(2));
    const isHighEngagement = score >= 2.0;

    await prisma.$transaction(async (tx) => {
      // 1. Get previous interaction state
      const existingInteraction = await tx.userQuestion.findUnique({
        where: {
          userId_questionId: {
            userId: validUserId!, // asserted non-null by logic above
            questionId: questionId,
          },
        },
      });

      // 2. Update or Create the interaction
      await tx.userQuestion.upsert({
        where: {
          userId_questionId: {
            userId: validUserId!,
            questionId: questionId,
          },
        },
        update: {
          reaction: reaction,
          timeSpent: timeSpent,
          score: score,
          isHighEngagement: isHighEngagement,
        },
        create: {
          userId: validUserId!,
          questionId: questionId,
          reaction: reaction,
          timeSpent: timeSpent,
          score: score,
          isHighEngagement: isHighEngagement,
        },
      });

      // 3. Update Question Counters atomically based on state change
      const updates: any = {};
      let needsUpdate = false;

      if (!existingInteraction) {
        // New One!
        needsUpdate = true;
        updates.viewersCount = { increment: 1 };
        if (reaction === "UPVOTE") updates.upvotes = { increment: 1 };
        if (reaction === "DOWNVOTE") updates.downvotes = { increment: 1 };
      } else {
        // Existing One!
        if (existingInteraction.reaction !== reaction) {
          needsUpdate = true;
          // Decrement old stats
          if (existingInteraction.reaction === "UPVOTE") {
            updates.upvotes = { decrement: 1 };
          }
          if (existingInteraction.reaction === "DOWNVOTE") {
            updates.downvotes = { decrement: 1 };
          }

          // Increment new stats
          if (reaction === "UPVOTE") {
            updates.upvotes = updates.upvotes
              ? { ...updates.upvotes, increment: 1 }
              : { increment: 1 };
          }
          if (reaction === "DOWNVOTE") {
            updates.downvotes = updates.downvotes
              ? { ...updates.downvotes, increment: 1 }
              : { increment: 1 };
          }
        }
        // If reaction didn't change, we do nothing to counters.
        // We also do NOT increment viewersCount again.
      }

      if (needsUpdate) {
        await tx.question.update({
          where: { id: questionId },
          data: updates,
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to record interaction:", error);
    // Return success: false but usually frontend doesn't block on this
    return { success: false, error: "Failed to record interaction" };
  }
}
