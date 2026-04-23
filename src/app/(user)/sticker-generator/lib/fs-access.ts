/**
 * File System Access API utilities for Sticker Library.
 *
 * Uses the modern File System Access API (Chrome/Edge only) to read/write
 * image files directly from a user-chosen local directory.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LibraryImage {
  name: string;
  /** Object URL for display in <img> tags — must be revoked when done */
  url: string;
  width: number;
  height: number;
  fileHandle: FileSystemFileHandle;
  /** True if max(width, height) < 2048 and needs upscaling before processing */
  needsUpscale: boolean;
}

// ─── Feature Detection ───────────────────────────────────────────────────────

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

// ─── Directory Picker ────────────────────────────────────────────────────────

/**
 * Open the native directory picker and return a handle.
 * Must be called from a user-gesture handler (button click).
 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  // @ts-expect-error — showDirectoryPicker not in all TS lib defs
  return await window.showDirectoryPicker({ mode: "readwrite" });
}

// ─── Read Images ─────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function isImageFile(name: string): boolean {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Load image dimensions from a blob.
 */
function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image dimensions"));
    };
    img.src = url;
  });
}

/**
 * Read all image files from a directory handle.
 * Returns an array of LibraryImage objects sorted by name.
 */
export async function readImageFiles(
  dir: FileSystemDirectoryHandle
): Promise<LibraryImage[]> {
  const images: LibraryImage[] = [];

  for await (const [name, handle] of dir as any) {
    if (handle.kind !== "file" || !isImageFile(name)) continue;

    const fileHandle = handle as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const url = URL.createObjectURL(blob);
    const { width, height } = await getImageDimensions(blob);

    images.push({
      name,
      url,
      width,
      height,
      fileHandle,
      needsUpscale: Math.max(width, height) < 2048,
    });
  }

  images.sort((a, b) => a.name.localeCompare(b.name));
  return images;
}

// ─── Write Files ─────────────────────────────────────────────────────────────

/**
 * Get or create a subdirectory within a parent directory.
 */
export async function getOrCreateSubdir(
  parent: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return await parent.getDirectoryHandle(name, { create: true });
}

/**
 * Write a PNG blob to a file in the given directory.
 * Overwrites if the file already exists.
 */
export async function writeImageFile(
  dir: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob
): Promise<void> {
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/**
 * Convert a data URL to a Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}
