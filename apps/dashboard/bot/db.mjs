import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// The worker is a separate process from the Next.js server, so it owns its own
// client rather than reusing the dashboard request-scoped singleton.
export const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL }),
  log: ["error"],
});
