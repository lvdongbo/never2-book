// Database adapter: SQLite (local) ↔ PostgreSQL (Vercel)

const DATABASE_URL = process.env.DATABASE_URL || "";

const isPostgres =
  DATABASE_URL.startsWith("postgres://") ||
  DATABASE_URL.startsWith("postgresql://");

let db: any;
let schema: any;

if (isPostgres) {
  // PostgreSQL — Vercel production
  const pgSchema = await import("../../drizzle/schema.pg");
  schema = pgSchema;

  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const sql = neon(DATABASE_URL);
    db = drizzle(sql);
  } catch {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: DATABASE_URL });
    db = drizzle(pool);
  }
} else {
  // SQLite — local development
  const sqliteModule = await import("../../drizzle/index.sqlite");
  db = sqliteModule.db;
  schema = sqliteModule.schema;
}

export { db, schema };
export const {
  users,
  mistakes,
  practiceSessions,
  practiceSessionItems,
  dictationWords,
  dictationSessions,
  dictationSessionItems,
  grades,
  subjects,
  units,
} = schema;
