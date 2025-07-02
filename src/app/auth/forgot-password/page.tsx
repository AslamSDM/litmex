"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { GlowButton } from "@/components/GlowButton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Something went wrong");
      }

      // Success state
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reset email. Please try again.");
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
          {!submitted ? (
            <p className="text-gray-400">
              Enter your email address and we will send you a link to reset your
              password.
            </p>
          ) : (
            <p className="text-gray-400">
              If an account exists with this email, we have sent you a password
              reset link. Please check your inbox.
            </p>
          )}
        </div>

        {!submitted ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                {...form.register("email")}
                className="bg-black/50 border-white/20"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <GlowButton className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset link"}
            </GlowButton>
          </form>
        ) : (
          <div className="flex justify-center">
            <GlowButton className="mt-4" onClick={() => setSubmitted(false)}>
              Back to reset password
            </GlowButton>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
