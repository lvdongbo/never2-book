import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import crypto from "crypto";

// --- Local filesystem storage (development) ---

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");

function getUploadDir(): string {
  const dir = UPLOAD_DIR.startsWith("./")
    ? path.join(process.cwd(), UPLOAD_DIR)
    : UPLOAD_DIR;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export interface StorageProvider {
  save(file: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(url: string): Promise<void>;
}

class LocalStorage implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = getUploadDir();
  }

  async save(
    file: Buffer,
    filename: string,
    _mimeType: string
  ): Promise<string> {
    const ext = path.extname(filename) || ".png";
    const key = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(this.baseDir, key);
    await fs.writeFile(filepath, file);
    return `/api/uploads/${key}`;
  }

  async delete(url: string): Promise<void> {
    const key = url.split("/").pop();
    if (!key) return;
    const filepath = path.join(this.baseDir, path.basename(key));
    try {
      await fs.unlink(filepath);
    } catch {
      // File may not exist, ignore
    }
  }
}

// --- Vercel Blob storage (production) ---

class VercelBlobStorage implements StorageProvider {
  async save(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    const { put } = await import("@vercel/blob");
    const ext = path.extname(filename) || ".png";
    const key = `uploads/${crypto.randomUUID()}${ext}`;

    const blob = await put(key, file, {
      access: "public",
      contentType: mimeType,
    });

    return blob.url;
  }

  async delete(url: string): Promise<void> {
    const { del } = await import("@vercel/blob");
    try {
      await del(url);
    } catch {
      // Already deleted or doesn't exist, ignore
    }
  }
}

// --- Factory ---

let storageInstance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!storageInstance) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      storageInstance = new VercelBlobStorage();
    } else {
      storageInstance = new LocalStorage();
    }
  }
  return storageInstance;
}

export async function saveImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  const storage = getStorage();
  return storage.save(buffer, originalName, mimeType);
}

export async function deleteImage(url: string): Promise<void> {
  const storage = getStorage();
  await storage.delete(url);
}
