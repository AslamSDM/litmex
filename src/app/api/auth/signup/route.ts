import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import { generateToken, hashToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Generate a referral code
    const referralCode = nanoid(10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        username: username || email.split("@")[0],
        password: hashedPassword,
        referralCode,
        verified: false, // Make sure the user starts as unverified
      },
    });

    // Generate verification token
    const verificationToken = generateToken();
    const hashedToken = hashToken(verificationToken);
    const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    // Store token in database
    await prisma.verificationToken.create({
      data: {
        token: hashedToken,
        expires,
        userId: user.id,
        type: "EMAIL_VERIFICATION",
      },
    });

    // Send verification email
    await sendVerificationEmail({
      email: user.email || "",
      name: user.username || "",
      token: verificationToken,
    });

    // Omit password from the response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
