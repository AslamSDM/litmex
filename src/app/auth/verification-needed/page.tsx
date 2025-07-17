"use client";

import { useState, Suspense } from "react";
import { signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useReferralStore } from "@/components/hooks/useReferralHandling";

function VerificationNeededContent() {
  const { data: session } = useSession({ required: true });
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || session?.user?.email || "";
  const [isSending, setIsSending] = useState(false);
  const { setReferralCode } = useReferralStore();

  const handleResendVerification = async () => {
    if (isSending) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send verification email");
      }

      toast.success("Verification email sent. Please check your inbox.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send verification email"
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-black/60 p-8 shadow-xl backdrop-blur-xl">
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

        <h1 className="mb-4 text-center text-2xl font-bold text-white">
          Email Verification Required
        </h1>

        <p className="mb-6 text-center text-gray-300">
          Your email address needs to be verified before you can access this
          page.
        </p>

        <div className="mb-6 rounded-md bg-yellow-900/30 p-4 text-sm text-yellow-400">
          <p>
            We&apos;ve sent a verification email to <strong>{email}</strong>.
            Please check your inbox and click on the verification link.
          </p>
          <p className="mt-2">
            If you didn&apos;t receive the email, check your spam folder or
            click the button below to resend it.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={isSending}
            className="w-full rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2 text-white hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Resend Verification Email"}
          </button>

          <button
            onClick={() => {
              setReferralCode(""); // Clear referral code on logout
              signOut({ callbackUrl: "/" }); // Redirect to home after logout
            }}
            className="w-full rounded-md border border-gray-700 bg-transparent px-4 py-2 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerificationNeeded() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerificationNeededContent />
    </Suspense>
  );
}
