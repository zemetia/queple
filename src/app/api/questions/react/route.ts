import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

export async function POST(req: Request) {
  const uid = req.headers.get("X-Firebase-UID");
  if (!uid) {
    // Guest mode: just return success to not break UI, but don't save reaction
    return NextResponse.json({
      success: true,
      message: "Guest reaction ignored",
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already reacted
    const existing = await prisma.userQuestion.findUnique({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId: questionId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already reacted" }, { status: 200 });
    }

    // Transaction to ensure consistency
    await prisma.$transaction(async (tx: any) => {
      await tx.userQuestion.create({
        data: {
          userId: user.id,
          questionId: questionId,
          reaction: reaction,
        },
      });

      if (reaction === "UPVOTE") {
        await tx.question.update({
          where: { id: questionId },
          data: { upvotes: { increment: 1 } },
        });
      } else if (reaction === "DOWNVOTE") {
        await tx.question.update({
          where: { id: questionId },
          data: { downvotes: { increment: 1 } },
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
