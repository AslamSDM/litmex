import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // For now, only allow if user is authenticated
    // TODO: Add admin check once field is available
    // if (!user.isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Not authorized' },
    //     { status: 403 }
    //   );
    // }

    const { userId, isAdmin } = await req.json();

    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // For now, we'll return success but won't actually update
    // Once the admin field is available in the database, uncomment this:
    /*
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
    */

    return NextResponse.json({
      success: true,
      message:
        "Admin status update will be available once the admin field is added to the database",
    });
  } catch (error) {
    console.error("Error updating admin status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
