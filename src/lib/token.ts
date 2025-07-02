import { randomBytes, createHash } from "crypto";

// Generate a random token
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Hash a token for secure storage in the database
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Validate token expiration
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
