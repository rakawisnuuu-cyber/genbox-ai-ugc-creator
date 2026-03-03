/**
 * Split a 2×3 grid image (2 columns, 3 rows = 6 panels) into individual images.
 * Returns array of 6 blob URLs.
 */
export async function splitGridImage(imageUrl: string): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const cols = 2;
      const rows = 3;
      const cellW = Math.floor(img.width / cols);
      const cellH = Math.floor(img.height / rows);
      const blobs: Promise<Blob>[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement("canvas");
          canvas.width = cellW;
          canvas.height = cellH;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH);
          blobs.push(
            new Promise<Blob>((res, rej) => {
              canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.92);
            }),
          );
        }
      }

      Promise.all(blobs).then(resolve).catch(reject);
    };
    img.onerror = () => reject(new Error("Failed to load grid image"));
    img.src = imageUrl;
  });
}

export const ANGLE_LABELS = [
  "Hero Shot",
  "Close-up Detail",
  "Lifestyle In-Use",
  "Selfie with Product",
  "Flat Lay",
  "Unboxing",
];
