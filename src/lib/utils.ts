/**
 * Utility Functions
 *
 * Shared helper functions for image processing, text formatting,
 * and other common operations used across the application.
 */

/**
 * Converts a File object to a base64-encoded string.
 * Resizes the image to a maximum of 1024x1024 to prevent huge payloads
 * that crash the server/API routes.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 1024;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Use webp for better compression, fallback to jpeg if unsupported
        const dataUrl = canvas.toDataURL("image/webp", 0.8) || canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Truncates text to a maximum length, appending ellipsis if needed.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

/**
 * Formats a hex color code to ensure it starts with '#'.
 */
export function normalizeHexColor(color: string): string {
  const cleaned = color.replace(/^#/, "");
  return `#${cleaned}`;
}
