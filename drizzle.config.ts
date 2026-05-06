import type { Config } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL || "";

const isPostgres =
  dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

export default {
  schema: isPostgres ? "./drizzle/schema.pg.ts" : "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres
    ? { url: dbUrl }
    : { url: "./data/never2.db" },
} satisfies Config;
