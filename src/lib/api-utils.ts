import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Handles API errors in a consistent way
 * @param error The error object
 * @returns A formatted error response
 */
export function handleApiError(error: unknown) {
  console.error("API error:", error);

  // Handle validation errors from Zod
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    // Handle unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A record with this data already exists" },
        { status: 409 }
      );
    }

    // Handle record not found
    if (error.code === "P2001" || error.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
  }

  // Generic error for everything else
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}
