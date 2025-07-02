import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import prisma from "./prisma";
import { validateReferralCode, applyReferral } from "./referral-utils";
import { getCookie } from "@/lib/cookies";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcrypt";
import { nanoid } from "nanoid";

// Extend the session types to include user ID and wallet addresses
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      walletAddress?: string | null;
      solanaAddress?: string | null;
      evmAddress?: string | null;
      referralCode?: string | null;
      verified?: boolean;
    };
  }

  // Create a User type that matches what our app needs
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    walletAddress?: string | null;
    solanaAddress?: string | null;
    evmAddress?: string | null;
    referralCode?: string | null;
    referrerId?: string | null;
    walletType?: string | null;
    verified?: boolean;
  }
}

// Add verified status to JWT
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    walletAddress?: string | null;
    walletType?: string | null;
    solanaAddress?: string | null;
    evmAddress?: string | null;
    referralCode?: string | null;
    verified?: boolean;
  }
}

// Use type assertion to avoid adapter compatibility issues
const adapter = PrismaAdapter(prisma) as any;

export const authOptions: NextAuthOptions = {
  adapter: adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
  },
  providers: [
    // Email/Password Authentication
    CredentialsProvider({
      id: "email-password",
      name: "Email & Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              password: true,
              username: true,
              referralCode: true,
              solanaAddress: true,
              evmAddress: true,
              walletAddress: true,
              walletType: true,
              verified: true,
              referrerId: true,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const passwordMatches = await compare(
            credentials.password,
            user.password
          );

          if (!passwordMatches) {
            return null;
          }

          // Check if email is verified using the verified field

          return {
            id: user.id,
            email: user.email,
            name: user.username || user.email?.split("@")[0],
            referralCode: user.referralCode || null,
            solanaAddress: user.solanaAddress,
            evmAddress: user.evmAddress,
            walletAddress: user.walletAddress,
            walletType: user.walletType,
            verified: user.verified,
            referrerId: user.referrerId || null,
            referrer: user.referrerId ? { id: user.referrerId } : null,
          };
        } catch (error) {
          console.error("Email/Password authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        // Set the user ID from the token
        session.user.id = token.sub!;

        // console.log(`Setting up session for user: ${token.sub}`);

        // Include wallet data from token if available
        if (token.walletAddress)
          session.user.walletAddress = token.walletAddress as string;
        if (token.solanaAddress)
          session.user.solanaAddress = token.solanaAddress as string;
        if (token.evmAddress)
          session.user.evmAddress = token.evmAddress as string;
        if (token.referralCode)
          session.user.referralCode = token.referralCode as string;
        if (typeof token.verified !== "undefined")
          session.user.verified = token.verified;

        // If we don't have complete wallet data in the token, fetch it from the database
        if (!token.walletAddress || !token.walletType) {
          if (token.sub) {
            try {
              console.log(
                `Fetching additional user data for session: ${token.sub}`
              );
              const userData = await prisma.user.findUnique({
                where: { id: token.sub },
                select: {
                  username: true,
                  walletAddress: true,
                  walletType: true,
                  solanaAddress: true,
                  evmAddress: true,
                  referralCode: true,
                  verified: true,
                },
              });

              if (userData) {
                // Update session with fresh data
                if (userData.username) session.user.name = userData.username;
                if (userData.walletAddress)
                  session.user.walletAddress = userData.walletAddress;
                if (userData.solanaAddress)
                  session.user.solanaAddress = userData.solanaAddress;
                if (userData.evmAddress)
                  session.user.evmAddress = userData.evmAddress;
                if (userData.referralCode)
                  session.user.referralCode = userData.referralCode;
                if (typeof userData.verified !== "undefined")
                  session.user.verified = userData.verified;

                console.log("Session updated with database user data");
              }
            } catch (error) {
              console.error(
                "Error fetching user wallet data for session:",
                error
              );
            }
          }
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add userId and wallet addresses to the token if available from sign-in
      if (user) {
        console.log(`Setting JWT token data for user: ${user.id}`);
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.walletType = user.walletType;
        token.solanaAddress = user.solanaAddress;
        token.evmAddress = user.evmAddress;
        token.referralCode = user.referralCode;
        token.verified = user.verified;
      }
      return token;
    },
    async signIn({ user }) {
      // Check if there's a referral code in the cookie and apply it
      try {
        if (user?.id) {
          // Get referral code from cookie - since we can't access request headers here,
          // we'll use another approach to handle referral application
          // The actual automatic referral application will happen in client-side hooks
        }
      } catch (error) {
        console.error("Error handling referrals during sign in:", error);
        // Don't block the sign-in process if referral handling fails
      }

      return true;
    },
  },
  events: {
    async signIn({ user }) {
      // This event can be used to trigger server-side referral application
      // when needed, but we'll primarily handle this on the client side
      console.log(`User signed in: ${user.id}`);
    },
  },
};
