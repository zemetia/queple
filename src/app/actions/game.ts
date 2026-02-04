"use server";

import { prisma } from "@/lib/prismadb";

// In a real app, we would get the userId from the session.
// For now, we'll use the system user ID or a fallback.
const SYSTEM_USER_ID = "0000000000000000000000000";

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

    // Fallback to System User if still no ID
    if (!validUserId) {
      validUserId = SYSTEM_USER_ID;
    }

    // Ensure the user actually exists (to prevent FK errors) specifically for the fallback
    // or if we trust the resolved ID, we can skip. But let's be safe.
    // If we resolved from DB above, we know it exists.
    // If passed as arg, we might want to check.
    // If System User, we assume it exists (seeded).

    // Safety check mostly for direct userId arg usage or System User integrity
    if (validUserId === userId || validUserId === SYSTEM_USER_ID) {
      const userExists = await prisma.user.findUnique({
        where: { id: validUserId },
        select: { id: true },
      });

      if (!userExists) {
        if (validUserId !== SYSTEM_USER_ID) {
          console.warn(`User ${validUserId} not found. Fallback to system.`);
        }
        validUserId = SYSTEM_USER_ID;
      }
    }

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
          timeSpent: timeSpent, // Overwrite time spent based on latest interaction
        },
        create: {
          userId: validUserId!,
          questionId: questionId,
          reaction: reaction,
          timeSpent: timeSpent,
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
