// Note: This is a basic implementation. For production, you'll want to use
// a proper authentication system like NextAuth.js or Auth.js

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { JwtPayload, sign, verify } from "jsonwebtoken";

const prisma = new PrismaClient();

// JWT secret key (should be in .env)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-change-this";

// JWT expiration time
const JWT_EXPIRES_IN = "7d";

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string): string {
  return sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET);
    return decoded as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Get the current user from the request
 */
export async function getCurrentUser(req: NextRequest) {
  // Get the token from the cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  // Verify the token
  const payload = verifyToken(token);
  if (!payload || !payload.sub) {
    return null;
  }

  // Get the user from the database
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}

/**
 * Set the authentication cookie
 */
export function setAuthCookie(
  userId: string,
  response: NextResponse
): NextResponse {
  const token = generateToken(userId);

  // Set the cookie
  response.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
}
