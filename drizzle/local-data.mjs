import fs from "node:fs";
import path from "node:path";
import * as util from "node:util";

const sharedSettings = [
  "JWT_SECRET",
  "LLM_API_KEY",
  "LLM_BASE_URL",
  "LLM_MODEL",
  "BLOB_READ_WRITE_TOKEN",
];

export function loadLocalDataConfig() {
  const dataDir = process.env.NEVER2_DATA_DIR;
  if (!dataDir) return;
  if (!path.isAbsolute(dataDir)) {
    throw new Error("NEVER2_DATA_DIR 必须是绝对路径");
  }

  const configPath = path.join(dataDir, ".env.local");
  let config;
  try {
    config = fs.readFileSync(configPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (config !== undefined) {
    if (!util.parseEnv) {
      throw new Error("读取共享配置文件需要 Node.js 20.12 或更高版本");
    }
    const settings = util.parseEnv(config);
    for (const name of sharedSettings) {
      if (settings[name] !== undefined) process.env[name] ??= settings[name];
    }
  }

  process.env.DATABASE_URL = path.join(dataDir, "never2.db");
  process.env.UPLOAD_DIR = path.join(dataDir, "uploads");
}
