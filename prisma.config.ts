// =============================================================================
// Prisma 7 Configuration
//
// Load env vars from .env.local (default for Next.js) using dotenv.
// For CLI operations (migrate, db push), we must connect directly (port 5432)
// to bypass transaction pooling (PgBouncer) which blocks DDL commands.
// =============================================================================

const path = require("path");
// Load Next.js environment variables from .env.local
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    // The CLI tool must connect directly to the database via DIRECT_URL
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
