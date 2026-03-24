/**
 * Shared image conversion utilities.
 * Single source of truth — do NOT duplicate these in page files.
 */

/** Convert an image URL to base64 via canvas (bypasses CORS issues with fetch). */
async function imageUrlToBase64ViaCanvas(
  url: string,
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
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const base64 = dataUrl.split(",")[1];
        resolve(base64 ? { mimeType: "image/jpeg", data: base64 } : null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Convert an image URL to base64 with its detected mimeType. Tries fetch first, then canvas fallback. */
export async function imageUrlToBase64WithMime(
  url: string,
): Promise<{ mimeType: string; data: string } | null> {
  // Try fetch first
  try {
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      const mimeType = blob.type || "image/jpeg";
      const result = await new Promise<{ mimeType: string; data: string } | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const r = reader.result as string;
          const base64 = r.split(",")[1];
          resolve(base64 ? { mimeType, data: base64 } : null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (result) return result;
    }
  } catch {
    // fetch failed (likely CORS) — fall through to canvas
  }

  // Canvas fallback
  return imageUrlToBase64ViaCanvas(url);
}

/** Convert an image URL to raw base64 string (no mimeType). */
export async function imageUrlToBase64(url: string): Promise<string> {
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
