import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already verified
    if (user.verified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate token with 24-hour expiration
    const token = generateToken();
    const hashedToken = hashToken(token);
    const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    // Check for existing token and delete it
    const existingToken = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: "EMAIL_VERIFICATION",
      },
    });

    if (existingToken) {
      await prisma.verificationToken.delete({
        where: {
          id: existingToken.id,
        },
      });
    }

    // Store token in the database
    await prisma.verificationToken.create({
      data: {
        token: hashedToken,
        expires,
        userId: user.id,
        type: "EMAIL_VERIFICATION", // Add the required type field
      },
    });

    // Send verification email
    await sendVerificationEmail({
      email: user.email || "",
      name: user.username || "",
      token,
    });

    return NextResponse.json(
      { message: "Verification email sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification email error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
