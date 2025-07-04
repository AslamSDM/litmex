"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { status, data: session } = useSession();
  const [isIOS, setIsIOS] = useState<boolean>(false);
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      // Check for mobile devices
      const isMobile =
        /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(
          navigator.userAgent
        );

      // Check specifically for iOS devices
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsIOS(isIOS);
      // Check for memory limitations (simple heuristic)

      console.log(
        `Device detected: ${isMobile ? "Mobile" : "Desktop"}, iOS: ${isIOS}, Memory limited: `
      );
    }
  }, []);
  useEffect(() => {
    if (status === "authenticated") {
      if (isIOS) {
        router.push("/presale-ios");
      } else {
        router.push("/presale");
      }
    }
  }, [status, router, session, isIOS]);

  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setNeedsVerification(false);

    try {
      const result = await signIn("email-password", {
        email,
        password,
        redirect: true,
        callbackUrl: isIOS ? "/presale-ios" : "/presale",
      });

      if (result?.error === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
      } else if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.url) {
        if (isIOS) {
          router.push("/presale-ios");
        } else {
          router.push("/presale");
        }
      }
    } catch (error: any) {
      if (error.message === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="mb-6"></div>
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-black/60 p-8 shadow-xl backdrop-blur-xl">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">
          Sign In
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/30 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {needsVerification && (
          <div className="mb-6 rounded-md bg-yellow-900/30 p-4 text-sm text-yellow-400 border border-yellow-900/30">
            <h3 className="font-medium mb-1">Email Verification Required</h3>
            <p>Your email needs to be verified before you can sign in.</p>
            <p className="mt-2">
              Please check your inbox for a verification link or click below to
              resend it.
            </p>
            <button
              onClick={() => {
                fetch("/api/auth/send-verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                })
                  .then((res) => {
                    if (res.ok) {
                      return res.json();
                    }
                    throw new Error("Failed to send verification email");
                  })
                  .then(() => {
                    alert("Verification email sent! Please check your inbox.");
                  })
                  .catch((error) => {
                    console.error("Error:", error);
                    alert(
                      "Failed to send verification email. Please try again."
                    );
                  });
              }}
              className="mt-3 text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Resend verification email
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-black/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-black/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2 text-white hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-700"></div>
          <div className="px-3 text-xs text-gray-500">OR</div>
          <div className="flex-1 border-t border-gray-700"></div>
        </div>

        {/* <button
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center rounded-md border border-gray-700 bg-black/30 px-4 py-2 text-white hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button> */}

        <div className="mt-6 text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-blue-400 hover:text-blue-300"
          >
            Sign up
          </Link>
          <div className="mt-2">
            <Link
              href="/auth/forgot-password"
              className="text-blue-400 hover:text-blue-300"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
