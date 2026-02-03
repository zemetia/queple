"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// In a real app, we would get the userId from the session.
// For now, we'll use the system user ID or a fallback.
const SYSTEM_USER_ID = "0000000000000000000000000";

export async function recordInteraction(
  questionId: string,
  reaction: "UPVOTE" | "DOWNVOTE" | "SKIP",
  timeSpent: number,
  userId?: string,
) {
  // 1. Skip if this is a transient fallback question (not in DB)
  if (questionId.startsWith("fallback-") || questionId.startsWith("mock-")) {
    // console.log("Skipping persistence for fallback question:", questionId);
    return { success: true };
  }

  try {
    const activeUserId = userId || SYSTEM_USER_ID;

    // Ensure user exists (sanity check for dev environment)
    const userExists = await prisma.user.findUnique({
      where: { id: activeUserId },
    });

    if (!userExists) {
      if (activeUserId !== SYSTEM_USER_ID) {
        console.warn(`User ${activeUserId} not found. Using system user.`);
      }
    }

    // We use the fallback logic again just to be sure we are using a valid ID for the query
    const validUserId = userExists ? activeUserId : SYSTEM_USER_ID;

    await prisma.userQuestion.upsert({
      where: {
        userId_questionId: {
          userId: validUserId,
          questionId: questionId,
        },
      },
      update: {
        reaction: reaction,
        timeSpent: timeSpent,
      },
      create: {
        userId: validUserId,
        questionId: questionId,
        reaction: reaction,
        timeSpent: timeSpent,
      },
    });

    // Update the aggregate counters on the Question model
    if (reaction === "UPVOTE") {
      await prisma.question.update({
        where: { id: questionId },
        data: {
          upvotes: { increment: 1 },
          viewersCount: { increment: 1 },
        },
      });
    } else if (reaction === "DOWNVOTE") {
      await prisma.question.update({
        where: { id: questionId },
        data: {
          downvotes: { increment: 1 },
          viewersCount: { increment: 1 },
        },
      });
    } else {
      // Just skipped
      await prisma.question.update({
        where: { id: questionId },
        data: {
          viewersCount: { increment: 1 },
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to record interaction:", error);
    return { success: false, error: "Failed to record interaction" };
  }
}
