// Storage abstraction — uploads bytes and returns a PUBLIC HTTPS URL.
// Priority: Cloudflare R2 (production) → local ./public/uploads (dev fallback).
// Meta's Graph API requires publicly reachable URLs, so we must upload somewhere.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const R2_ENDPOINT = process.env.R2_ENDPOINT; // e.g. https://<account>.r2.cloudflarestorage.com
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://cdn.yourdomain.com or https://pub-<id>.r2.dev

const useR2 = !!(R2_ENDPOINT && R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL);

let _r2: S3Client | null = null;
function r2(): S3Client {
  if (_r2) return _r2;
  _r2 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
  return _r2;
}

export type UploadInput = {
  bytes: Buffer | Uint8Array;
  contentType: string;
  extension: string; // e.g. "png", "mp4", "jpg"
  folder?: string; // e.g. "ads/images", "ads/videos"
};

/**
 * Uploads a file and returns a PUBLIC HTTPS URL that social APIs can fetch.
 */
export async function uploadToStorage(input: UploadInput): Promise<string> {
  const { bytes, contentType, extension, folder = "uploads" } = input;
  const id = crypto.randomBytes(12).toString("hex");
  const key = `${folder}/${id}.${extension}`;

  if (useR2) {
    await r2().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET!,
        Key: key,
        Body: bytes as Buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  }

  // Local fallback — writes to ./public/uploads and returns a URL served by Next.js.
  // For Meta to fetch this, the dev server must be tunneled via ngrok.
  const publicDir = path.join(process.cwd(), "public", folder);
  fs.mkdirSync(publicDir, { recursive: true });
  const filePath = path.join(publicDir, `${id}.${extension}`);
  fs.writeFileSync(filePath, bytes as Buffer);

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${publicUrl.replace(/\/$/, "")}/${folder}/${id}.${extension}`;
}

/**
 * Convenience: takes a data URL or https URL, normalizes to a publicly-hosted URL.
 * If it's already an https:// URL hosted somewhere Meta can reach, return as-is.
 * If it's a data URL, upload to storage and return the new URL.
 */
export async function ensurePublicUrl(urlOrDataUrl: string, folder = "ads/images"): Promise<string> {
  if (urlOrDataUrl.startsWith("data:")) {
    const match = urlOrDataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL");
    const [, mime, b64] = match;
    const ext = mime.split("/")[1]?.split(";")[0] ?? "png";
    return uploadToStorage({
      bytes: Buffer.from(b64, "base64"),
      contentType: mime,
      extension: ext,
      folder,
    });
  }

  // Already an HTTP(S) URL — check if it's on localhost and warn
  if (urlOrDataUrl.includes("localhost") || urlOrDataUrl.includes("127.0.0.1")) {
    // Not publicly reachable; caller needs ngrok. Return as-is but social API will fail.
    return urlOrDataUrl;
  }
  return urlOrDataUrl;
}

export function isStorageConfigured(): boolean {
  return useR2;
}
