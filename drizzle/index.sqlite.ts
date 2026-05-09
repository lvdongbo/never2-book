import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH =
  process.env.DATABASE_URL || path.join(process.cwd(), "data", "never2.db");

// Ensure data directory exists
const dataDir = path.dirname(
  DB_PATH.startsWith("./") ? path.join(process.cwd(), DB_PATH) : DB_PATH
);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const resolvedPath = DB_PATH.startsWith("./")
  ? path.join(process.cwd(), DB_PATH)
  : DB_PATH;

const sqlite = new Database(resolvedPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
