import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, level, forGender, creatorId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    let categoryId = body.categoryId;

    if (!categoryId) {
      const defaultCategory = await prisma.category.findFirst();
      if (defaultCategory) {
        categoryId = defaultCategory.id;
      } else {
        // Fallback: Create a default category if none exists
        const newCat = await prisma.category.create({
          data: { name: "General" },
        });
        categoryId = newCat.id;
      }
    }

    const question = await prisma.question.create({
      data: {
        content,
        level: level ?? 1,
        forGender: forGender || "BOTH",
        creatorId: creatorId || "0000000000000000000000000",
        categoryId,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Create Question Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
