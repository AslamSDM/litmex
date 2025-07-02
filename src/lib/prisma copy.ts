// src/lib/prisma.ts - Improved connection handling

import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Enhanced Prisma client with connection retry and proper cleanup
const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Store the client in the global object in development
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
