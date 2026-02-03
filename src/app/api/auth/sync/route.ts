import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, name, image, location } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updateData: any = { name, image, email };
    if (location) updateData.location = location;

    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: updateData,
      create: {
        firebaseUid: uid,
        email,
        name,
        image,
        location: location || "Unknown",
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Auth Sync Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
