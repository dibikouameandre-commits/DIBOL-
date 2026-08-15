import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Storage for downloadable product files, with two backends selected
// automatically via environment:
//
// - Vercel Blob, **private** store (when BLOB_READ_WRITE_TOKEN is set) —
//   required in production on Vercel, whose filesystem is read-only/
//   ephemeral outside of /tmp. Private storage means blobs are never
//   publicly fetchable by URL — every read goes through the authenticated
//   `get()` SDK call, which itself requires OIDC or BLOB_READ_WRITE_TOKEN.
// - Local filesystem (fallback) — zero-config for local dev.
//
// Every caller only depends on saveProductFile / readProductFile /
// deleteProductFile, so the rest of the app never needs to know which
// backend is active. Downloads are always streamed through our own
// authenticated route (never a raw redirect to the storage URL), so gating
// stays correct regardless of backend — this is on top of, not instead of,
// Blob's own private-storage authentication.

const STORAGE_ROOT = path.join(process.cwd(), "storage", "products");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

async function ensureStorageRoot() {
  await mkdir(STORAGE_ROOT, { recursive: true });
}

export async function saveProductFile(file: File) {
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";

  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const pathname = `products/${randomUUID()}${extension}`;
    await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
    });
    return { key: pathname, originalName: file.name };
  }

  await ensureStorageRoot();
  const key = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(STORAGE_ROOT, key), buffer);

  return { key, originalName: file.name };
}

export async function readProductFile(key: string): Promise<Buffer> {
  if (useBlob) {
    const { get } = await import("@vercel/blob");
    const result = await get(key, { access: "private" });

    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error(`Failed to read blob "${key}": not found`);
    }

    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  return readFile(path.join(STORAGE_ROOT, key));
}

export async function deleteProductFile(key: string) {
  try {
    if (useBlob) {
      const { del } = await import("@vercel/blob");
      await del(key);
      return;
    }
    await unlink(path.join(STORAGE_ROOT, key));
  } catch {
    // File already missing — nothing to clean up.
  }
}
