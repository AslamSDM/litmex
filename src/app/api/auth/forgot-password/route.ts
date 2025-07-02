import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    // For security reasons, don't reveal whether a user exists
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If your email is registered, you will receive a password reset link",
        },
        { status: 200 }
      );
    }

    // Generate token with 1-hour expiration
    const token = generateToken();
    const hashedToken = hashToken(token);
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    // Store token in the database
    await db.passwordResetToken.create({
      data: {
        token: hashedToken,
        expires,
        userId: user.id,
      },
    });

    // Send password reset email
    await sendPasswordResetEmail({
      email: email,
      name: user.username || "User",
      token,
    });

    return NextResponse.json(
      {
        message:
          "If your email is registered, you will receive a password reset link",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
