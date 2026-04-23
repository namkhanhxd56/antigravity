/**
 * Alpha-channel post-processing for background-removed images.
 *
 * After PiAPI removes the background there is usually a semi-transparent
 * fringe around the subject.  This module provides a thin pipeline:
 *
 *   1. **Erode** – shrink the opaque region inward by `erosionPx` pixels
 *      using a circular structuring element so that the fringe is eaten away.
 *   2. **Smooth** – apply a small box-blur on the alpha channel so that
 *      the hard binary edge becomes a gentle anti-aliased falloff.
 *
 * RGB channels are left untouched.
 */

/**
 * Load an image URL (data-URL or http) into an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Post-process the alpha channel of a transparent PNG.
 *
 * @param imageUrl  – data-URL or remote URL of the RGBA image
 * @param erosionPx – how many pixels to erode inward (default 3)
 * @param blurPx    – radius of the smoothing pass (default 1)
 * @returns data-URL of the processed image (PNG)
 */
export async function refineAlpha(
  imageUrl: string,
  erosionPx = 3,
  blurPx = 1
): Promise<string> {
  const img = await loadImage(imageUrl);
  const { naturalWidth: w, naturalHeight: h } = img;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;
  const len = w * h;

  // ── 1. Extract alpha into a float buffer ──────────────────────────────
  const alpha = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    alpha[i] = data[i * 4 + 3] / 255;
  }

  // ── 2. Erosion (min-filter with circular kernel) ──────────────────────
  const eroded = new Float32Array(len);
  const ePx = erosionPx;
  const eR2 = ePx * ePx;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let minA = 1;
      for (let dy = -ePx; dy <= ePx; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) { minA = 0; continue; }
        for (let dx = -ePx; dx <= ePx; dx++) {
          if (dx * dx + dy * dy > eR2) continue; // circular
          const nx = x + dx;
          if (nx < 0 || nx >= w) { minA = 0; continue; }
          const a = alpha[ny * w + nx];
          if (a < minA) minA = a;
        }
      }
      eroded[y * w + x] = minA;
    }
  }

  // ── 3. Box-blur on eroded alpha (anti-alias) ──────────────────────────
  const smoothed = new Float32Array(len);
  const bPx = blurPx;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let cnt = 0;
      for (let dy = -bPx; dy <= bPx; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -bPx; dx <= bPx; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          sum += eroded[ny * w + nx];
          cnt++;
        }
      }
      smoothed[y * w + x] = sum / cnt;
    }
  }

  // ── 4. Write smoothed alpha back (preserve RGB) ───────────────────────
  for (let i = 0; i < len; i++) {
    data[i * 4 + 3] = Math.round(smoothed[i] * 255);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
