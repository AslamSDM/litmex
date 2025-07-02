"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

// Create a Zod schema for signup form validation
const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    username: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      console.log("User is authenticated, redirecting to presale");
      router.push("/presale");
    }
  }, [status, router]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setValidationErrors({});

    // Validate with Zod
    const validationResult = signupSchema.safeParse(formData);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const formattedErrors: Record<string, string> = {};

      Object.entries(errors).forEach(([key, value]) => {
        if (value && value.length > 0) {
          formattedErrors[key] = value[0];
        }
      });

      setValidationErrors(formattedErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Submit to our API route
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username || undefined, // Don't send empty string
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      setSignupSuccess(true);

      // Instead of auto-signing in, show verification instructions
      // We won't redirect automatically so user can see the verification message
    } catch (error: any) {
      setError(error.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn("google", { callbackUrl: "/presale" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="mb-6"></div>
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-black/60 p-8 shadow-xl backdrop-blur-xl">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">
          Create an Account
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/30 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {signupSuccess && (
          <div className="mb-4 rounded-md bg-green-900/30 p-4 text-center text-sm space-y-2">
            <p className="text-green-400 font-medium">
              Account created successfully!
            </p>
            <div className="text-green-300/80">
              <p>Please check your email for a verification link.</p>
              <p className="mt-1">
                You need to verify your email before you can sign in.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/auth/signin"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Go to sign in
              </Link>
            </div>
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
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.email ? "border-red-500" : "border-gray-700"
              } bg-black/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="your@email.com"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300"
            >
              Username (optional)
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.username ? "border-red-500" : "border-gray-700"
              } bg-black/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="username"
            />
            {validationErrors.username && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.username}
              </p>
            )}
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
              value={formData.password}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.password ? "border-red-500" : "border-gray-700"
              } bg-black/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="••••••••"
            />
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.confirmPassword
                  ? "border-red-500"
                  : "border-gray-700"
              } bg-black/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="••••••••"
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2 text-white hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-700"></div>
          <div className="px-3 text-xs text-gray-500">OR</div>
          <div className="flex-1 border-t border-gray-700"></div>
        </div>

        {/* <button
          onClick={handleGoogleSignUp}
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
          Sign up with Google
        </button> */}

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-blue-400 hover:text-blue-300"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
