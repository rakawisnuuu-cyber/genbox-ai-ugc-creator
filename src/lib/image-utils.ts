/**
 * Shared image conversion utilities.
 * Single source of truth — do NOT duplicate these in page files.
 *
 * EGRESS NOTE: Canvas-based conversion is preferred because it uses the
 * browser's image cache (the image was already downloaded to display on screen).
 * fetch()-based conversion re-downloads the image from storage, doubling egress.
 */

/** Convert an image URL to base64 via canvas (uses browser cache — zero extra egress). */
async function imageUrlToBase64ViaCanvas(
  url: string,
  outputMime: string = "image/jpeg",
  quality: number = 0.95,
): Promise<{ mimeType: string; data: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL(outputMime, quality);
        const base64 = dataUrl.split(",")[1];
        resolve(base64 ? { mimeType: outputMime, data: base64 } : null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Convert via fetch (fallback — causes extra egress, only used when canvas fails). */
async function imageUrlToBase64ViaFetch(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || "image/jpeg";
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const r = reader.result as string;
        const base64 = r.split(",")[1];
        resolve(base64 ? { mimeType, data: base64 } : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Convert an image URL to base64 with its detected mimeType.
 *  Tries canvas first (browser cache), then fetch fallback. */
export async function imageUrlToBase64WithMime(url: string): Promise<{ mimeType: string; data: string } | null> {
  // Canvas first — uses browser cache, zero extra network egress
  const canvasResult = await imageUrlToBase64ViaCanvas(url);
  if (canvasResult) return canvasResult;

  // Fetch fallback — only if canvas fails (e.g. tainted canvas, CORS issue)
  return imageUrlToBase64ViaFetch(url);
}

/** Convert an image URL to raw base64 string (no mimeType).
 *  Uses canvas (browser cache) first, fetch as fallback. */
export async function imageUrlToBase64(url: string): Promise<string> {
  // Try canvas first — avoids re-downloading the image
  const canvasResult = await imageUrlToBase64ViaCanvas(url);
  if (canvasResult) return canvasResult.data;

  // Fetch fallback
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Convert a File object to raw base64 string. */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
