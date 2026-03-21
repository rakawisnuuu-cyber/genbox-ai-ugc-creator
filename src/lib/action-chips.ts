/**
 * Action chip library — static fallback + dynamic Gemini-powered suggestions.
 * Static chips provide instant suggestions while dynamic ones are product-aware.
 */

import { geminiFetch } from "./gemini-fetch";
import type { ProductDNA } from "./product-dna";

export type ActionCategory = "universal" | "fashion" | "skincare" | "electronics" | "food" | "health" | "home";

/* ── Static Fallback Chips ─────────────────────────────────── */

const STATIC_CHIPS: Record<ActionCategory, string[]> = {
  universal: [
    "Pegang produk ke kamera", "Tunjukin produk sambil senyum", "Close-up detail produk",
    "Rotate produk pelan", "Tap produk sambil jelasin", "Thumbs up ke kamera",
    "React happy lihat hasil", "Hold produk dekat lens", "Point ke fitur produk",
    "Compare sebelum sesudah", "Nod sambil pegang produk", "Present produk dua tangan",
  ],
  fashion: [
    "Mirror selfie sambil pegang baju", "Pakai baju di depan mirror", "Putar badan tunjukin fit",
    "Walk pose ke kamera", "Show outfit full body", "Adjust outfit detail",
    "Snap pose depan mirror", "Tuck baju ke celana", "Step back tunjukin full fit",
    "Spin kecil pakai outfit", "Show pocket detail", "Hands in pocket pose",
  ],
  skincare: [
    "Apply ke pipi pelan-pelan", "Tunjukin tekstur di tangan", "Dot cream ke wajah",
    "Blend produk di pipi", "Pump produk ke tangan", "Touch cheek after apply",
    "Close-up skin application", "Spread serum di tangan", "Tap wajah setelah apply",
    "Shake bottle dekat kamera", "Compare skin dekat kamera", "Glow reaction",
  ],
  electronics: [
    "Swipe layar device", "Tap fitur di screen", "Rotate gadget pelan",
    "Press button demo", "Show device dari samping", "Hold gadget near lens",
    "Flip gadget di tangan", "Zoom in ke screen", "Plug in device",
    "React impressed lihat layar", "Show gadget working", "Unbox device excited",
  ],
  food: [
    "Ambil makanan dari piring", "First bite reaction", "Tunjukin tekstur close-up",
    "Tuang minuman pelan", "Aduk di mangkok", "Cium aroma sambil tutup mata",
    "Potong makanan tunjukin isi", "Suap ke mulut pelan", "Angkat gelas toast",
    "Tunjukin packaging makanan", "Buka bungkus snack", "Steam rising close-up",
  ],
  health: [
    "Ambil suplemen dari botol", "Minum dengan air putih", "Shake bottle protein",
    "Buka sachet supplement", "Campur ke dalam air", "Morning routine ambil vitamin",
    "Post-workout minum", "Baca label nutrisi", "Tunjukin kapsul di tangan",
    "Energized reaction setelah minum", "Stretch sambil hold produk", "Happy morning energy",
  ],
  home: [
    "Letakkan produk di meja", "Tunjukin detail material", "Arrange di rak",
    "Sentuh tekstur pelan", "Show fitur unik produk", "Reveal dari box",
    "Pasang/install produk", "Step back lihat hasil", "Compare sebelum sesudah ruangan",
    "Cozy setup moment", "Touch fabric/surface", "Adjust position styling",
  ],
};

/** Normalize category string to ActionCategory */
function normalizeCategory(cat?: string): ActionCategory {
  if (!cat) return "universal";
  const lower = cat.toLowerCase();
  if (lower.includes("fashion") || lower.includes("baju") || lower.includes("outfit")) return "fashion";
  if (lower.includes("skincare") || lower.includes("skin") || lower.includes("beauty") || lower.includes("kecantikan")) return "skincare";
  if (lower.includes("electron") || lower.includes("gadget") || lower.includes("tech")) return "electronics";
  if (lower.includes("food") || lower.includes("makan")) return "food";
  if (lower.includes("health") || lower.includes("kesehatan")) return "health";
  if (lower.includes("home") || lower.includes("rumah")) return "home";
  return "universal";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Get static action chips — instant, no API call.
 * Returns mix of category-specific and universal chips.
 */
export function getActionChips(
  beatRole: string,
  category?: string,
  count: number = 4,
): string[] {
  const cat = normalizeCategory(category);
  const catPool = shuffle(STATIC_CHIPS[cat] || []);
  const uniPool = shuffle(STATIC_CHIPS.universal);

  const result: string[] = [];
  const used = new Set<string>();

  const addFrom = (pool: string[], max: number) => {
    for (const item of pool) {
      if (result.length >= count || max <= 0) return;
      if (!used.has(item)) {
        used.add(item);
        result.push(item);
        max--;
      }
    }
  };

  // 3 from category, 1 from universal
  addFrom(catPool, 3);
  addFrom(uniPool.filter((u) => !used.has(u)), 1);

  // Fill remaining
  if (result.length < count) {
    addFrom([...catPool, ...uniPool].filter((x) => !used.has(x)), count - result.length);
  }

  return result.slice(0, count);
}

/** Alias for backward compatibility */
export function getShuffledChips(
  beatRole: string,
  category?: string,
  count: number = 4,
): string[] {
  return getActionChips(beatRole, category, count);
}

/* ── Dynamic Gemini-Powered Suggestions ────────────────────── */

/** Cache key for dynamic suggestions */
function cacheKey(templateKey: string, beatLabel: string, category: string): string {
  return `${templateKey}::${beatLabel}::${category}`;
}

const dynamicCache = new Map<string, string[]>();

/**
 * Generate product-aware, context-specific action/motion suggestions via Gemini.
 * Returns 4 suggestions tailored to the specific product, beat, and template.
 * Falls back to static chips on failure.
 */
export async function generateDynamicChips(opts: {
  geminiKey: string;
  model: string;
  templateKey: string;
  templateLabel: string;
  beatLabel: string;
  beatDescription: string;
  beatIndex: number;
  productDNA?: ProductDNA | null;
  count?: number;
}): Promise<string[]> {
  const {
    geminiKey, model, templateKey, templateLabel,
    beatLabel, beatDescription, beatIndex,
    productDNA, count = 4,
  } = opts;

  const category = productDNA?.category || "other";
  const key = cacheKey(templateKey, beatLabel, category);

  // Check cache
  if (dynamicCache.has(key)) return dynamicCache.get(key)!;

  try {
    const productContext = productDNA
      ? `Product: ${productDNA.product_description || productDNA.sub_category || productDNA.category}
Category: ${productDNA.category}/${productDNA.sub_category}
Packaging: ${productDNA.packaging_type} | Material: ${productDNA.material}
Usage type: ${productDNA.usage_type}`
      : `Product category: ${category}`;

    const json = await geminiFetch(model, geminiKey, {
      contents: [{
        parts: [{
          text: `You are a TikTok UGC video director specializing in Indonesian content.

Generate exactly ${count} specific motion/action suggestions for a video frame.

Template: "${templateLabel}"
Frame ${beatIndex + 1}: "${beatLabel}" — ${beatDescription}
${productContext}

Each suggestion should be:
- In casual Indonesian (bahasa gaul)
- Specific to THIS product type (not generic)
- Describe a physical movement/action with camera direction
- 8-15 words max
- Feel like what a real Indonesian TikTok creator would do

Example format for a face serum:
"Teteskan serum ke ujung jari, close-up macro shot"
"Tepuk-tepuk pipi lembut, POV angle dari atas"

Return JSON array of ${count} strings only, no explanation:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`,
        }],
      }],
    });

    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length >= count) {
      const result = parsed.slice(0, count).map(String);
      dynamicCache.set(key, result);
      return result;
    }
  } catch (e) {
    console.warn("[action-chips] Dynamic generation failed, using static fallback:", e);
  }

  // Fallback to static
  return getActionChips(beatLabel, category, count);
}

/** Clear the dynamic chips cache */
export function clearDynamicChipsCache() {
  dynamicCache.clear();
}
