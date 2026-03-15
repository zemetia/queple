import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { Prisma } from "@prisma/client";

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

    const birthdayDate = birthday ? new Date(birthday) : null;
    const locationStr = location || "Unknown";

    // Use upsert so that if a partial record already exists (same firebaseUid
    // or email), we update it instead of throwing a P2002 unique constraint error.
    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      create: {
        firebaseUid: uid,
        email,
        name,
        image,
        birthday: birthdayDate,
        ipAddress: ip,
        location: locationStr,
      },
      update: {
        email,
        name,
        image,
        birthday: birthdayDate,
        ipAddress: ip,
        location: locationStr,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    // Log the full error so Vercel Function Logs show the real cause
    console.error("[/api/auth/create] Error:", JSON.stringify(error, null, 2));

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = unique constraint failed (e.g. duplicate email)
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
