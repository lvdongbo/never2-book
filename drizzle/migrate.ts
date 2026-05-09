import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH =
  process.env.DATABASE_URL || path.join(process.cwd(), "data", "never2.db");

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

console.log("Running migrations...");

// Read and execute SQL migration
const migrationsDir = path.join(__dirname, "migrations");
if (fs.existsSync(migrationsDir)) {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`  Running ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    // Split by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      sqlite.exec(stmt);
    }
  }
}

console.log("Migrations completed successfully!");
sqlite.close();
