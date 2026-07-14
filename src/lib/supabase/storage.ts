// Binary-safe image uploads to Supabase Storage.
import "server-only";
import sharp from "sharp";
import { supabaseAdmin, STORAGE_BUCKET, publicStorageUrl } from "./admin";

/**
 * Upload image bytes and return the public URL.
 *
 * The body MUST be a Blob, never a Node Buffer. The deployed fetch layer does not treat a Buffer as
 * a binary BodyInit and coerces it with String(), which UTF-8-decodes the bytes and replaces every
 * invalid sequence with U+FFFD — destroying roughly two thirds of a WebP. A Blob is a standard
 * BodyInit, and storage-js sends it as multipart, so no fetch implementation can stringify it.
 */
export async function uploadImage(key: string, buf: Buffer, contentType: string): Promise<string> {
  const body = new Blob([new Uint8Array(buf)], { type: contentType });
  const { error } = await supabaseAdmin()
    .storage.from(STORAGE_BUCKET)
    .upload(key, body, { contentType, cacheControl: "31536000", upsert: true });
  if (error) throw new Error(error.message);
  return publicStorageUrl(key);
}

/**
 * Re-download an object and assert it still decodes as an image. Guards against transport-level
 * corruption, which is otherwise silent — the upload "succeeds" and the garbage only surfaces when
 * a browser refuses to render it.
 */
export async function assertStoredImageValid(key: string): Promise<void> {
  const { data, error } = await supabaseAdmin().storage.from(STORAGE_BUCKET).download(key);
  if (error || !data) throw new Error(`Upload verification failed for ${key}: ${error?.message ?? "no data"}`);
  try {
    await sharp(Buffer.from(await data.arrayBuffer())).metadata();
  } catch {
    throw new Error(`Uploaded object ${key} is not a valid image — the upload was corrupted in transit`);
  }
}
