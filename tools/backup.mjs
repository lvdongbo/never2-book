import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const dbPath = path.resolve(
  process.env.DATABASE_URL || path.join(process.cwd(), "data", "never2.db")
);
const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads")
);

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace("T", "-")
  .slice(0, 15);
const destRoot =
  process.argv[2] ||
  path.join(path.dirname(dbPath), "..", "never2-book-backups");
const dest = path.join(path.resolve(destRoot), `never2-${stamp}`);

fs.mkdirSync(dest, { recursive: true });

const db = new Database(dbPath, { readonly: true });
await db.backup(path.join(dest, "never2.db"));
db.close();

if (fs.existsSync(uploadDir)) {
  fs.cpSync(uploadDir, path.join(dest, "uploads"), { recursive: true });
}

console.log(`数据库: ${dbPath}`);
console.log(`图片目录: ${uploadDir}`);
console.log(`备份完成: ${dest}`);
