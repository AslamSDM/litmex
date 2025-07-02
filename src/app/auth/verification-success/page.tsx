"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { GlowButton } from "@/components/GlowButton";
import { useRouter } from "next/navigation";

export default function VerificationSuccess() {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/auth/signin");
    }, 5000);

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Card className="w-full max-w-md p-8 space-y-6 bg-black/60 backdrop-blur-lg border border-white/10">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Email Verified!
          </h1>
          <p className="text-gray-400">
            Your email has been successfully verified.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-400">
            Redirecting to login in {countdown} seconds...
          </p>
          <GlowButton onClick={() => router.push("/auth/signin")}>
            Sign In Now
          </GlowButton>
        </div>
      </Card>
    </div>
  );
}
