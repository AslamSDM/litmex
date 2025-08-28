import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma?.user.findUnique({
      where: {
        email: session.user.email,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has admin privileges
    // For now, we'll check if the user has an isAdmin field, otherwise default to false
    let isAdmin = false;

    try {
      // Try to access isAdmin field if it exists
      isAdmin = (user as any).isAdmin || false;
    } catch (error) {
      // If field doesn't exist yet, we'll allow all authenticated users for testing
      // Remove this fallback once the admin field is properly added
      console.warn(
        "isAdmin field not found, allowing all authenticated users for testing"
      );
      isAdmin = true; // TEMPORARY: Remove this line once admin field is added
    }

    return NextResponse.json({
      isAdmin,
      user: {
        id: user.id,
      },
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
