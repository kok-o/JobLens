import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// =============================================================================
// Prisma Singleton (Prisma 7 + pg driver adapter)
//
// Prisma 7's "client" engine requires an explicit driver adapter.
// We use @prisma/adapter-pg which wraps node-postgres (pg).
//
// The DATABASE_URL is read from the environment, supporting:
//   - Local dev: plain PostgreSQL URL
//   - Supabase: transaction pooler URL (port 6543) for runtime
//   - Migrations: DIRECT_URL (port 5432) via prisma.config.ts
//
// In Next.js dev, HMR re-executes modules causing connection leaks.
// The global singleton pattern prevents this.
// =============================================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
