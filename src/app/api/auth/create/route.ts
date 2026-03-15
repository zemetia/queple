import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { uid, email, name, image, birthday, ip, location } = body;

  if (!uid || !email) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const birthdayDate = birthday ? new Date(birthday) : null;
  const locationStr = location || "Unknown";
  const updatePayload = {
    email,
    name,
    image,
    birthday: birthdayDate,
    ipAddress: ip,
    location: locationStr,
  };

  try {
    // Primary path: upsert on firebaseUid (handles brand-new users and re-runs)
    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      create: { firebaseUid: uid, ...updatePayload },
      update: updatePayload,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[/api/auth/create] Primary upsert error:", JSON.stringify(error, null, 2));

    // P2002 = unique constraint failed — email already belongs to a different firebaseUid.
    // Fallback: find the existing account by email and update it to link the new firebaseUid.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      try {
        const user = await prisma.user.update({
          where: { email },
          data: { firebaseUid: uid, ...updatePayload },
        });
        return NextResponse.json({ user });
      } catch (fallbackError) {
        console.error("[/api/auth/create] Fallback update error:", JSON.stringify(fallbackError, null, 2));
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

