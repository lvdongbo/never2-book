import path from "path";
import fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL || "";

function isPostgres(): boolean {
  return (
    DATABASE_URL.startsWith("postgres://") ||
    DATABASE_URL.startsWith("postgresql://")
  );
}

export async function getDb() {
  if (isPostgres()) {
    const pgSchema = await import("./schema.pg");

    try {
      const { neon } = await import("@neondatabase/serverless");
      const { drizzle } = await import("drizzle-orm/neon-http");
      const sql = neon(DATABASE_URL);
      return drizzle(sql, { schema: pgSchema });
    } catch {
      const { drizzle } = await import("drizzle-orm/node-postgres");
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: DATABASE_URL });
      return drizzle(pool, { schema: pgSchema });
    }
  }

  // SQLite (local)
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqliteSchema = await import("./schema");

  const dbPath =
    DATABASE_URL || path.join(process.cwd(), "data", "never2.db");
  const dataDir = path.dirname(
    dbPath.startsWith("./") ? path.join(process.cwd(), dbPath) : dbPath
  );
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const resolvedPath = dbPath.startsWith("./")
    ? path.join(process.cwd(), dbPath)
    : dbPath;

  const sqlite = new Database(resolvedPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema: sqliteSchema });
}
