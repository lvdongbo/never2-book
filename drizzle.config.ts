import type { Config } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";
import { loadLocalDataConfig } from "./drizzle/local-data.mjs";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
loadLocalDataConfig();

const dbUrl = process.env.DATABASE_URL || "";

const isPostgres =
  dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

export default {
  schema: isPostgres ? "./drizzle/schema.pg.ts" : "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres
    ? { url: dbUrl }
    : { url: dbUrl || "./data/never2.db" },
} satisfies Config;
