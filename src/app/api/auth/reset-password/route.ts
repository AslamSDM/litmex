import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken, isTokenExpired } from "@/lib/token";
import bcrypt from "bcrypt";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedFields = resetPasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validatedFields.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { token, password } = validatedFields.data;

    // Hash the token to compare with the stored one
    const hashedToken = hashToken(token);

    // Look up the token in the database
    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: {
        token: hashedToken,
      },
      include: {
        user: true,
      },
    });

    if (!passwordResetToken) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (isTokenExpired(passwordResetToken.expires)) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with new password
    await db.user.update({
      where: {
        id: passwordResetToken.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    // Delete the used token
    await db.passwordResetToken.delete({
      where: {
        id: passwordResetToken.id,
      },
    });

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
