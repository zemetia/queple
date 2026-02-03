import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const uid = req.headers.get("X-Firebase-UID");

  // if (!uid) {
  //   return NextResponse.json(
  //     { error: "Unauthorized, missing header" },
  //     { status: 401 },
  //   );
  // }

  try {
    let whereClause = {};
    if (uid) {
      whereClause = {
        reactions: {
          none: {
            user: { firebaseUid: uid },
          },
        },
      };
    }

    // Get a random question
    const count = await prisma.question.count({
      where: whereClause,
    });

    if (count === 0) {
      return NextResponse.json(null);
    }

    const skip = Math.floor(Math.random() * count);

    const question = await prisma.question.findFirst({
      where: whereClause,
      skip: skip,
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Next Question Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
