import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

export async function POST(req: Request) {
  // 1. Get User ID
  const uid = req.headers.get("X-Firebase-UID");

  // Note: Guest reactions are currently ignored in this API endpoint.
  // To track guest reactions, a persistent session ID should be passed
  // or a fallback strategy (like System User) implemented here.
  if (!uid) {
    return NextResponse.json({
      success: true,
      message: "Guest reaction ignored (No User ID provided)",
    });
  }

  try {
    const { questionId, reaction } = await req.json();

    if (!questionId || !reaction) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Find User ID by firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // Transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Get previous interaction
      const existing = await tx.userQuestion.findUnique({
        where: {
          userId_questionId: {
            userId,
            questionId,
          },
        },
      });

      // 2. Upsert Interaction
      await tx.userQuestion.upsert({
        where: {
          userId_questionId: {
            userId,
            questionId,
          },
        },
        update: {
          reaction: reaction,
          // We don't have timeSpent in API payload currently?
          // If body has it, use it. But existing code didn't.
          // Defaulting to keeping existing or 0 if not provided is tricky in upsert.
          // Let's assume this API is simple toggle.
        },
        create: {
          userId,
          questionId,
          reaction,
        },
      });

      // 3. Update Counters
      const updates: any = {};
      let needsUpdate = false;

      if (!existing) {
        // New One!
        needsUpdate = true;
        updates.viewersCount = { increment: 1 };
        if (reaction === "UPVOTE") updates.upvotes = { increment: 1 };
        if (reaction === "DOWNVOTE") updates.downvotes = { increment: 1 };
      } else {
        // Existing One!
        if (existing.reaction !== reaction) {
          needsUpdate = true;
          // Decrement old stats
          if (existing.reaction === "UPVOTE") {
            updates.upvotes = { decrement: 1 };
          }
          if (existing.reaction === "DOWNVOTE") {
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
      }

      if (needsUpdate) {
        await tx.question.update({
          where: { id: questionId },
          data: updates,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reaction Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
