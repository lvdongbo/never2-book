// Default: SQLite (local development)
// For PostgreSQL (Vercel), set DATABASE_URL to a postgres:// URL
// and use getDb() from drizzle/db.ts for async initialization.
export { db, schema } from "./index.sqlite";
