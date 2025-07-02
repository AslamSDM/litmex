import { NextRequest, NextResponse } from "next/server";
import { hashToken, isTokenExpired } from "@/lib/token";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing verification token" },
        { status: 400 }
      );
    }

    // Hash the token to compare with the stored one
    const hashedToken = hashToken(token);

    // Look up the token in the database
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: hashedToken,
        type: "EMAIL_VERIFICATION",
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (isTokenExpired(verificationToken.expires)) {
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: {
        id: verificationToken.userId,
      },
      data: {
        verified: true,
      },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        id: verificationToken.id,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/auth/verification-success", request.url)
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
