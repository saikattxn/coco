import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  "image/avif": { ext: "avif", magic: (b) => b.subarray(4, 12).toString().startsWith("ftypavi") },
};

export class UploadError extends Error {}

export function storageMode(): "cloudinary" | "local" | "none" {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) return "cloudinary";
  if (process.env.NODE_ENV !== "production") return "local";
  return "none";
}

/** Validate and store an uploaded image. Returns its public URL and dimensions when known. */
export async function storeImage(file: File, folder: string): Promise<{ url: string; width?: number; height?: number }> {
  if (!file || file.size === 0) throw new UploadError("Choose an image to upload.");
  if (file.size > MAX_BYTES) throw new UploadError("Images must be 8 MB or smaller.");
  const kind = TYPES[file.type];
  const buf = Buffer.from(await file.arrayBuffer());
  if (!kind || !kind.magic(buf)) throw new UploadError("Upload a JPEG, PNG, WebP or AVIF image.");

  const mode = storageMode();
  if (mode === "cloudinary") {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { folder: `coco-tamarind/${folder}`, timestamp: String(timestamp) };
    const toSign = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");
    const signature = createHash("sha1").update(toSign + process.env.CLOUDINARY_API_SECRET).digest("hex");
    const form = new FormData();
    form.append("file", new Blob([buf], { type: file.type }));
    form.append("api_key", process.env.CLOUDINARY_API_KEY!);
    form.append("timestamp", params.timestamp);
    form.append("folder", params.folder);
    form.append("signature", signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
    if (!res.ok) throw new UploadError(`Image upload failed (${res.status}). Please try again.`);
    const data = (await res.json()) as { secure_url: string; width: number; height: number };
    return { url: data.secure_url, width: data.width, height: data.height };
  }
  if (mode === "local") {
    const name = `${randomUUID()}.${kind.ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf);
    return { url: `/uploads/${folder}/${name}` };
  }
  throw new UploadError("Image storage is awaiting configuration (Cloudinary). You can paste an image URL instead.");
}

/** Accept only https URLs on hosts the site is allowed to load images from, or local uploads. */
export function allowedImageUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ["res.cloudinary.com", "cocotamarindhp27.co.uk"].includes(u.hostname);
  } catch {
    return false;
  }
}
