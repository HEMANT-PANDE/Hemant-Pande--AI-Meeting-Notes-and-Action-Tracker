import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across ts-node-dev hot reloads in
// development to avoid exhausting the Neon connection pool.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
