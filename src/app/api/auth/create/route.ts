import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, name, image, birthday, ip, location } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid: uid,
        email,
        name,
        image,
        birthday: birthday ? new Date(birthday) : null,
        ipAddress: ip,
        location: location || "Unknown",
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
