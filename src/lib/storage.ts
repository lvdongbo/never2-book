import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import crypto from "crypto";

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
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
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
    return key;
  }

  getUrl(key: string): string {
    return `/api/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filepath = path.join(this.baseDir, path.basename(key));
    try {
      await fs.unlink(filepath);
    } catch {
      // File may not exist, ignore
    }
  }
}

// Use local storage by default. Swap this for OSS implementation
// when VOLCANO_ACCESS_KEY is configured.
let storageInstance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!storageInstance) {
    // Check for OSS configuration
    const accessKey = process.env.VOLCANO_ACCESS_KEY;
    if (accessKey) {
      // TODO: Implement VolcanoEngineOSS provider
      // import { VolcanoOSSProvider } from "./oss";
      // storageInstance = new VolcanoOSSProvider({ ... });
      console.warn(
        "OSS config detected but provider not implemented, falling back to local storage"
      );
    }
    storageInstance = new LocalStorage();
  }
  return storageInstance;
}

export async function saveImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  const storage = getStorage();
  const key = await storage.save(buffer, originalName, mimeType);
  return storage.getUrl(key);
}

export async function deleteImage(url: string): Promise<void> {
  // Extract key from URL: /api/uploads/filename.ext -> filename.ext
  const key = url.split("/").pop();
  if (key) {
    const storage = getStorage();
    await storage.delete(key);
  }
}
