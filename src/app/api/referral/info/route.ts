import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { use } from "react";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        walletAddress: true,
        evmAddress: true,
        referrerId: true,
        referrer: true,
        referralCode: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If the user already has a referrer, return that information
    // Uncomment the following block if you want to return existing referrer info
    // if (user?.referrer || user?.referrerId) {
    //   return NextResponse.json({
    //     success: true,
    //     referrerId: user.referrerId || user.referrer?.id || null,
    //     walletAddress: user.walletAddress || user.evmAddress || null,
    //     username: user.referrer?.username || null,

    //     verified: user.referrer?.verified || false,
    //   });
    // }

    // Extract the referral code from the URL query parameters
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing referral code" },
        { status: 400 }
      );
    }
    if (user.referralCode === code) {
      return NextResponse.json(
        { error: "You cannot refer yourself" },
        { status: 400 }
      );
    }

    // Look up the referral code in the database to get user details
    const referrer = await prisma.user.findFirst({
      where: { referralCode: code },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        verified: true,
      },
    });

    if (!referrer) {
      return NextResponse.json({
        success: false,
        message: "Invalid referral code",
      });
    }

    // Add the referrer ID to the current user's record
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: {
          referrer: {
            connect: { id: referrer.id },
          },
        },
      }),
      prisma.user.update({
        where: { id: referrer.id },
        data: {
          referrerId: user.id, // Set the referrerId on the referrer
        },
      }),
    ]);

    // Return information about the referrer (excluding sensitive data)
    return NextResponse.json({
      success: true,
      referrerId: referrer.id,
      walletAddress: referrer.walletAddress || null,
      username: referrer.username,
      verified: referrer.verified,
    });
  } catch (error) {
    console.error("Error fetching referrer info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
