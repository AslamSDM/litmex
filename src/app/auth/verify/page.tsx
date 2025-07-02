"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "invalid" | "expired"
  >("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("invalid");
        setErrorMessage("Missing verification token");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);

        if (response.redirected) {
          // If the API redirected, go to that URL
          window.location.href = response.url;
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          if (data.error === "Verification token has expired") {
            setStatus("expired");
          } else if (data.error === "Invalid verification token") {
            setStatus("invalid");
          } else {
            setStatus("error");
            setErrorMessage(
              data.error || "An error occurred during verification"
            );
          }
          return;
        }

        setStatus("success");

        // Auto-redirect to success page after verification
        setTimeout(() => {
          router.push("/auth/verification-success");
        }, 2000);
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-black/60 p-8 shadow-xl backdrop-blur-xl">
        {status === "verifying" && (
          <div className="text-center">
            <div className="mb-6 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent align-[-0.125em]"></div>
            <h1 className="mb-4 text-2xl font-bold text-white">
              Verifying Your Email
            </h1>
            <p className="text-gray-300">
              Please wait while we verify your email address...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-500/20 p-3">
                <svg
                  className="h-12 w-12 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="mb-4 text-2xl font-bold text-white">
              Email Verified!
            </h1>
            <p className="mb-6 text-gray-300">
              Your email has been successfully verified. Redirecting you
              shortly...
            </p>
          </div>
        )}

        {status === "expired" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-yellow-500/20 p-3">
                <svg
                  className="h-12 w-12 text-yellow-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="mb-4 text-2xl font-bold text-white">
              Verification Link Expired
            </h1>
            <p className="mb-4 text-gray-300">
              This verification link has expired. Please request a new
              verification email.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/verification-needed"
                className="rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-2 text-white hover:from-blue-700 hover:to-blue-900"
              >
                Request New Link
              </Link>
            </div>
          </div>
        )}

        {status === "invalid" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-500/20 p-3">
                <svg
                  className="h-12 w-12 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h1 className="mb-4 text-2xl font-bold text-white">
              Invalid Verification Link
            </h1>
            <p className="mb-4 text-gray-300">
              This verification link is invalid. Please try again or request a
              new verification email.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/verification-needed"
                className="rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-2 text-white hover:from-blue-700 hover:to-blue-900"
              >
                Request New Link
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-500/20 p-3">
                <svg
                  className="h-12 w-12 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="mb-4 text-2xl font-bold text-white">
              Verification Error
            </h1>
            <p className="mb-4 text-gray-300">
              {errorMessage ||
                "An error occurred during verification. Please try again."}
            </p>
            <div className="mt-6 space-y-4">
              <Link
                href="/auth/verification-needed"
                className="block rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-2 text-center text-white hover:from-blue-700 hover:to-blue-900"
              >
                Request New Link
              </Link>
              <Link
                href="/auth/signin"
                className="block text-blue-400 hover:text-blue-300"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-800 bg-black/60 p-8 shadow-xl backdrop-blur-xl">
            <div className="text-center">
              <div className="mb-6 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent align-[-0.125em]"></div>
              <h1 className="mb-4 text-2xl font-bold text-white">Loading...</h1>
              <p className="text-gray-300">Please wait...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
