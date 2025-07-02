"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { GlowButton } from "@/components/GlowButton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("Invalid or missing reset token");
      router.push("/auth/forgot-password");
    } else {
      setToken(token);
    }
  }, [searchParams, router]);

  const validateForm = () => {
    const result = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset password");
      }

      // Success state
      setIsSuccess(true);
      toast.success("Password reset successfully");

      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Card className="w-full max-w-md p-8 space-y-6 bg-black/60 backdrop-blur-lg border border-white/10">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Reset your password
          </h1>
          {!isSuccess ? (
            <p className="text-gray-400">
              Create a new password for your account
            </p>
          ) : (
            <p className="text-gray-400">
              Your password has been reset successfully. Redirecting to login...
            </p>
          )}
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="password"
                placeholder="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-black/50 border-white/20"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="confirmPassword"
                placeholder="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="bg-black/50 border-white/20"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <GlowButton
              className="w-full"
              onClick={() =>
                handleSubmit(new Event("click") as unknown as React.FormEvent)
              }
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset password"}
            </GlowButton>
          </form>
        ) : (
          <div className="flex justify-center">
            <GlowButton onClick={() => router.push("/auth/signin")}>
              Go to sign in
            </GlowButton>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
