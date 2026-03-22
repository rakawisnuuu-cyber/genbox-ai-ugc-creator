/**
 * Product DNA — deep product intelligence via Gemini Vision.
 * Detects category, sub-category, usage type, and full visual description.
 */

import { geminiFetch } from "./gemini-fetch";

export type ProductCategory =
  | "skincare"
  | "fashion"
  | "food"
  | "electronics"
  | "health"
  | "home"
  | "other";

export interface ProductDNA {
  category: ProductCategory;
  sub_category: string;
  usage_type: string;
  product_description: string;
  dominant_color: string;
  material: string;
  key_features: string;
  brand_name: string;
  packaging_type: string;
}

export const EMPTY_DNA: ProductDNA = {
  category: "other",
  sub_category: "",
  usage_type: "handheld",
  product_description: "",
  dominant_color: "",
  material: "",
  key_features: "",
  brand_name: "unknown",
  packaging_type: "other",
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  skincare: "Skincare",
  fashion: "Fashion",
  food: "Food & Beverage",
  electronics: "Electronics",
  health: "Health & Supplement",
  home: "Home & Living",
  other: "Lainnya",
};

export const ALL_CATEGORIES: { value: ProductCategory; label: string }[] =
  Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as ProductCategory,
    label,
  }));

/** Detect Product DNA from image via Gemini Vision */
export async function detectProductDNA(
  imageBase64: string,
  model: string,
  apiKey: string,
): Promise<ProductDNA> {
  const genConfig: Record<string, any> = {};
  if (model !== "gemini-3.1-pro-preview") {
    genConfig.responseMimeType = "application/json";
  }

  const json = await geminiFetch(model, apiKey, {
    contents: [
      {
        parts: [
          {
            inlineData: { mimeType: "image/jpeg", data: imageBase64 },
          },
          {
            text: `Analyze this product image. Return JSON only, no explanation:
{
  "category": "skincare | fashion | food | electronics | health | home | other",
  "sub_category": "specific type like laptop bag, face serum, hoodie, bluetooth earbuds, protein powder, sofa",
  "usage_type": "wearable | handheld | consumable | furniture | cosmetic | supplement | device | decor",
  "product_description": "detailed visual description of exact shape color size material packaging brand text",
  "dominant_color": "main color",
  "material": "material type",
  "key_features": "comma separated visible features",
  "brand_name": "brand if visible or unknown",
  "packaging_type": "bottle | tube | box | bag | pouch | can | jar | loose | device | garment | furniture | other"
}`,
          },
        ],
      },
    ],
    generationConfig: genConfig,
  });

  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!rawText) return { ...EMPTY_DNA };

  try {
    // Handle possible markdown code blocks
    const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      category: parsed.category?.toLowerCase() || "other",
      sub_category: parsed.sub_category || "",
      usage_type: parsed.usage_type || "handheld",
      product_description: parsed.product_description || "",
      dominant_color: parsed.dominant_color || "",
      material: parsed.material || "",
      key_features: parsed.key_features || "",
      brand_name: parsed.brand_name || "unknown",
      packaging_type: parsed.packaging_type || "other",
    } as ProductDNA;
  } catch {
    return { ...EMPTY_DNA };
  }
}

/* ─── Category-Aware Prompt Instructions ─────────────────────── */

const CATEGORY_PROMPTS: Record<ProductCategory, string> = {
  skincare:
    "Person applying the skincare product, holding it near face, showing texture on skin. Close-up of product application, natural bathroom/vanity lighting.",
  fashion:
    "Person wearing the fashion item, showing fit and silhouette, styling naturally. Full body or detail shot highlighting fabric, cut, and design.",
  food:
    "Appetizing food presentation, person about to eat or drink, warm inviting lighting. Show texture, steam, freshness. Kitchen or dining setting.",
  electronics:
    "Person using the electronic device, screen or main feature visible, hands-on demo interaction. Clean desk or modern environment.",
  health:
    "Daily routine integration with the health product, active lifestyle context, morning ritual energy. Fresh, energetic, wellness-focused.",
  home:
    "Product placed naturally in room setting with visible scale, lifestyle context. Person interacting with or admiring the home item.",
  other:
    "Person showcasing the product naturally, holding or using it with genuine interest. Well-lit, clean background.",
};

export function getCategoryPromptInstruction(dna: ProductDNA): string {
  const base = CATEGORY_PROMPTS[dna.category] || CATEGORY_PROMPTS.other;
  return `${base}

PRODUCT TO SHOW: ${dna.product_description}
Category: ${dna.category} / ${dna.sub_category}
Color: ${dna.dominant_color} | Material: ${dna.material} | Packaging: ${dna.packaging_type}
Key features: ${dna.key_features}`;
}

/* ─── Category-Specific Multi-Angle Definitions ──────────────── */

export interface AngleDefinition {
  label: string;
  description: string;
  storyRole: string; // narrative purpose
}

function getSubCategoryAngles(sub: string): AngleDefinition[] | null {
  const lower = sub.toLowerCase();
  if (lower.includes("bag") || lower.includes("tas")) {
    return [
      { label: "Hero Carrying", description: "Carrying bag, full body confident pose", storyRole: "Attention" },
      { label: "Compartment Detail", description: "Opening bag showing compartments and capacity", storyRole: "Trust" },
      { label: "Packing Demo", description: "Putting laptop/items inside, demonstrating use", storyRole: "Value" },
      { label: "Walking Context", description: "Walking with bag, coffee shop or commute context", storyRole: "USP" },
      { label: "Hardware Close-up", description: "Strap and hardware detail close-up", storyRole: "Aspiration" },
      { label: "Outfit Coord", description: "Outfit coordination with bag as accessory", storyRole: "Social Proof" },
    ];
  }
  if (lower.includes("shoe") || lower.includes("sepatu") || lower.includes("sneaker")) {
    return [
      { label: "Standing Pose", description: "Standing pose showing shoes with full outfit", storyRole: "Attention" },
      { label: "Walking Action", description: "Walking mid-stride action shot", storyRole: "Trust" },
      { label: "Sole Detail", description: "Sole and grip detail close-up", storyRole: "Value" },
      { label: "Tying Moment", description: "Tying or adjusting moment", storyRole: "USP" },
      { label: "Outfit Pairing", description: "Outfit coordination from ankle down", storyRole: "Aspiration" },
      { label: "Side Profile", description: "Side profile clean angle", storyRole: "Social Proof" },
    ];
  }
  return null;
}

const CATEGORY_ANGLES: Record<ProductCategory, AngleDefinition[]> = {
  skincare: [
    { label: "Hero Holding", description: "Front-facing holding product near face", storyRole: "Attention" },
    { label: "Label Detail", description: "Close-up texture/label detail, dropper or applicator visible", storyRole: "Trust" },
    { label: "Applying", description: "Applying on skin, showing texture spread", storyRole: "Value" },
    { label: "Selfie Style", description: "Selfie style holding product, phone camera angle", storyRole: "USP" },
    { label: "Flat Lay Beauty", description: "Flat lay with beauty props (towel, mirror, flowers)", storyRole: "Aspiration" },
    { label: "First Impression", description: "Unboxing or first impression reaction", storyRole: "Social Proof" },
  ],
  fashion: [
    { label: "Outfit Reveal", description: "Full outfit reveal, confident standing pose head to toe", storyRole: "Attention" },
    { label: "Fabric Detail", description: "Fabric texture and stitching detail close-up", storyRole: "Trust" },
    { label: "In Motion", description: "Styling in motion — adjusting, turning, showing movement", storyRole: "Value" },
    { label: "Mirror Selfie", description: "Mirror selfie wearing the item", storyRole: "USP" },
    { label: "Silhouette", description: "Back or side angle showing silhouette and fit", storyRole: "Aspiration" },
    { label: "Complete Look", description: "Complete look with accessories pairing", storyRole: "Social Proof" },
  ],
  food: [
    { label: "Hero Presentation", description: "Holding product with appetizing presentation", storyRole: "Attention" },
    { label: "Texture Close-up", description: "Texture close-up, steam, condensation, ingredients visible", storyRole: "Trust" },
    { label: "Preparing", description: "Preparing, cooking, or mixing moment", storyRole: "Value" },
    { label: "First Bite", description: "First bite or sip genuine reaction", storyRole: "USP" },
    { label: "Flat Lay Plating", description: "Overhead flat lay with plating and utensils", storyRole: "Aspiration" },
    { label: "Serving Shot", description: "Pouring or serving to camera", storyRole: "Social Proof" },
  ],
  electronics: [
    { label: "Hero Holding", description: "Holding device showing screen or main feature", storyRole: "Attention" },
    { label: "Build Quality", description: "Close-up ports, buttons, build quality, hand scale", storyRole: "Trust" },
    { label: "Real Usage", description: "Real usage scenario (typing, browsing, listening)", storyRole: "Value" },
    { label: "Unboxing", description: "Unboxing reveal, first power on", storyRole: "USP" },
    { label: "Setup Context", description: "Desk or carry setup in context", storyRole: "Aspiration" },
    { label: "Feature Demo", description: "Feature demonstration, screen interface visible", storyRole: "Social Proof" },
  ],
  health: [
    { label: "Morning Routine", description: "Morning routine holding product, fresh and energetic", storyRole: "Attention" },
    { label: "Label Close-up", description: "Nutrition label and packaging close-up", storyRole: "Trust" },
    { label: "Taking/Mixing", description: "Taking or mixing the supplement", storyRole: "Value" },
    { label: "Active Context", description: "Post-workout or active context with product", storyRole: "USP" },
    { label: "Health Flat Lay", description: "Flat lay with health props (water, fruits, gym gear)", storyRole: "Aspiration" },
    { label: "Energy Reaction", description: "Energy reaction, feeling good moment", storyRole: "Social Proof" },
  ],
  home: [
    { label: "Room Placement", description: "Product placed in room showing scale and style", storyRole: "Attention" },
    { label: "Craftsmanship", description: "Material and craftsmanship detail close-up", storyRole: "Trust" },
    { label: "In Use", description: "Actively using or interacting with item", storyRole: "Value" },
    { label: "Styling Moment", description: "Room styling or transformation moment", storyRole: "USP" },
    { label: "Feature Detail", description: "Unique feature or mechanism detail", storyRole: "Aspiration" },
    { label: "Cozy Lifestyle", description: "Cozy lifestyle moment, comfort reaction", storyRole: "Social Proof" },
  ],
  other: [
    { label: "Hero Shot", description: "Hero front-facing showcase", storyRole: "Attention" },
    { label: "Close-up Detail", description: "Detail close-up", storyRole: "Trust" },
    { label: "Lifestyle In-Use", description: "In-use lifestyle", storyRole: "Value" },
    { label: "Selfie Style", description: "Selfie style with product", storyRole: "USP" },
    { label: "Alt Angle", description: "Alternative angle", storyRole: "Aspiration" },
    { label: "Reaction", description: "Reaction or unboxing", storyRole: "Social Proof" },
  ],
};

export function getAnglesByCategory(
  category: ProductCategory,
  sub_category?: string,
): AngleDefinition[] {
  // Check sub-category specialization first
  if (sub_category) {
    const special = getSubCategoryAngles(sub_category);
    if (special) return special;
  }
  return CATEGORY_ANGLES[category] || CATEGORY_ANGLES.other;
}

/** Build the strict product consistency block for multi-angle prompts */
export function buildProductConsistencyBlock(dna: ProductDNA): string {
  return `CRITICAL PRODUCT CONSISTENCY RULE: Every panel must show THIS EXACT product:
${dna.product_description}
Category: ${dna.category} / ${dna.sub_category}
Color: ${dna.dominant_color}
Material: ${dna.material}
Packaging: ${dna.packaging_type}

All 6 panels must show visually IDENTICAL product:
- Same shape, same color, same material, same size
- Same brand markings, same packaging, same accessories
- Do NOT substitute with different product type
- Do NOT change category (if product is a ${dna.sub_category || dna.category}, show a ${dna.sub_category || dna.category})
- Before finalizing, verify all 6 panels contain the identical product`;
}
