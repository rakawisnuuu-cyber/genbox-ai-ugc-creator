/**
 * Product DNA — deep product intelligence via Gemini Vision.
 * Detects category, sub-category, usage type, and full visual description.
 */

import { geminiFetch } from "./gemini-fetch";

export type ProductCategory = "skincare" | "fashion" | "food" | "electronics" | "health" | "home" | "other";

export interface ProductDNA {
  category: ProductCategory;
  sub_category: string;
  usage_type: string;
  product_description: string;
  dominant_color: string;
  material: string;
  key_features: string;
  key_benefits: string;
  brand_name: string;
  packaging_type: string;
  ugc_hook: string;
}

export const EMPTY_DNA: ProductDNA = {
  category: "other",
  sub_category: "",
  usage_type: "handheld",
  product_description: "",
  dominant_color: "",
  material: "",
  key_features: "",
  key_benefits: "",
  brand_name: "unknown",
  packaging_type: "other",
  ugc_hook: "",
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

export const ALL_CATEGORIES: { value: ProductCategory; label: string }[] = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({
    value: value as ProductCategory,
    label,
  }),
);

/** Detect Product DNA from image via Gemini Vision */
export async function detectProductDNA(imageBase64: string, model: string, apiKey: string): Promise<ProductDNA> {
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
            text: `You are a product photographer's assistant AND content strategist preparing reference notes for an AI UGC content generation system.

Analyze this product image. Return JSON only:
{
  "category": "skincare | fashion | food | electronics | health | home | other",
  "sub_category": "specific product type (e.g., face serum, wireless earbuds, protein bar, tote bag)",
  "usage_type": "wearable | handheld | consumable | furniture | cosmetic | supplement | device | decor",
  "product_description": "Write exactly what a person would see holding this product: exact shape (cylinder/rectangle/pouch/etc), approximate size relative to an adult hand, main colors with specifics (e.g. matte white body with coral pink gradient label), any text or logo visible on packaging, cap or lid type, whether contents are visible through packaging",
  "dominant_color": "primary color as seen from 1 meter away",
  "material": "what the packaging appears to be made of (glass/plastic/cardboard/fabric/metal)",
  "key_features": "2-4 visually distinctive features separated by commas",
  "key_benefits": "2-3 likely product benefits based on packaging claims, product type, and visible text (e.g. hydrating, anti-aging, noise-cancelling, high-protein). If no claims visible, infer from product category",
  "brand_name": "brand name if text is visible, otherwise unknown",
  "packaging_type": "bottle | tube | box | bag | pouch | can | jar | loose | device | garment | furniture | other",
  "ugc_hook": "One short sentence a content creator would say about this product in Indonesian (e.g. 'Serum ini bikin kulit glowing dalam 7 hari!' or 'Earbuds paling worth it di bawah 500rb')"
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
    const cleaned = rawText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      category: parsed.category?.toLowerCase() || "other",
      sub_category: parsed.sub_category || "",
      usage_type: parsed.usage_type || "handheld",
      product_description: parsed.product_description || "",
      dominant_color: parsed.dominant_color || "",
      material: parsed.material || "",
      key_features: parsed.key_features || "",
      key_benefits: parsed.key_benefits || "",
      brand_name: parsed.brand_name || "unknown",
      packaging_type: parsed.packaging_type || "other",
      ugc_hook: parsed.ugc_hook || "",
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
  food: "Appetizing food presentation, person about to eat or drink, warm inviting lighting. Show texture, steam, freshness. Kitchen or dining setting.",
  electronics:
    "Person using the electronic device, screen or main feature visible, hands-on demo interaction. Clean desk or modern environment.",
  health:
    "Daily routine integration with the health product, active lifestyle context, morning ritual energy. Fresh, energetic, wellness-focused.",
  home: "Product placed naturally in room setting with visible scale, lifestyle context. Person interacting with or admiring the home item.",
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
  storyRole: string;
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
    {
      label: "Label Detail",
      description: "Close-up texture/label detail, dropper or applicator visible",
      storyRole: "Trust",
    },
    { label: "Applying", description: "Applying on skin, showing texture spread", storyRole: "Value" },
    { label: "Selfie Style", description: "Selfie style holding product, phone camera angle", storyRole: "USP" },
    {
      label: "Flat Lay Beauty",
      description: "Flat lay with beauty props (towel, mirror, flowers)",
      storyRole: "Aspiration",
    },
    { label: "First Impression", description: "Unboxing or first impression reaction", storyRole: "Social Proof" },
  ],
  fashion: [
    {
      label: "Outfit Reveal",
      description: "Full outfit reveal, confident standing pose head to toe",
      storyRole: "Attention",
    },
    { label: "Fabric Detail", description: "Fabric texture and stitching detail close-up", storyRole: "Trust" },
    { label: "In Motion", description: "Styling in motion — adjusting, turning, showing movement", storyRole: "Value" },
    { label: "Mirror Selfie", description: "Mirror selfie wearing the item", storyRole: "USP" },
    { label: "Silhouette", description: "Back or side angle showing silhouette and fit", storyRole: "Aspiration" },
    { label: "Complete Look", description: "Complete look with accessories pairing", storyRole: "Social Proof" },
  ],
  food: [
    { label: "Hero Presentation", description: "Holding product with appetizing presentation", storyRole: "Attention" },
    {
      label: "Texture Close-up",
      description: "Texture close-up, steam, condensation, ingredients visible",
      storyRole: "Trust",
    },
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
    {
      label: "Feature Demo",
      description: "Feature demonstration, screen interface visible",
      storyRole: "Social Proof",
    },
  ],
  health: [
    {
      label: "Morning Routine",
      description: "Morning routine holding product, fresh and energetic",
      storyRole: "Attention",
    },
    { label: "Label Close-up", description: "Nutrition label and packaging close-up", storyRole: "Trust" },
    { label: "Taking/Mixing", description: "Taking or mixing the supplement", storyRole: "Value" },
    { label: "Active Context", description: "Post-workout or active context with product", storyRole: "USP" },
    {
      label: "Health Flat Lay",
      description: "Flat lay with health props (water, fruits, gym gear)",
      storyRole: "Aspiration",
    },
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

export function getAnglesByCategory(category: ProductCategory, sub_category?: string): AngleDefinition[] {
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

All panels must show visually IDENTICAL product:
- Same shape, same color, same material, same size
- Same brand markings, same packaging, same accessories
- Do NOT substitute with different product type
- Do NOT change category (if product is a ${dna.sub_category || dna.category}, show a ${dna.sub_category || dna.category})`;
}

/* ─── Product Context Generator ──────────────────────────────── */

/** Usage context suggestions per category */
const USAGE_CONTEXTS: Record<ProductCategory, string[]> = {
  skincare: ["bathroom vanity", "morning skincare routine", "bedroom mirror", "nighttime routine"],
  fashion: ["getting dressed", "outfit of the day", "mirror selfie moment", "going out preparation"],
  food: ["kitchen counter", "breakfast table", "snack time", "cooking preparation"],
  electronics: ["desk setup", "unboxing moment", "daily use", "productivity flow"],
  health: ["morning routine", "post-workout", "daily supplement ritual", "wellness moment"],
  home: ["room styling", "home organization", "cozy setup", "decor placement"],
  other: ["daily life", "product showcase", "lifestyle moment"],
};

/** Emotional angles per category */
const EMOTIONAL_ANGLES: Record<ProductCategory, string[]> = {
  skincare: ["self-care ritual", "pampering moment", "confidence boost", "skin transformation joy"],
  fashion: ["self-expression", "confidence in style", "outfit satisfaction", "personal identity"],
  food: ["comfort and indulgence", "healthy choice satisfaction", "sharing joy", "taste discovery"],
  electronics: ["tech excitement", "productivity empowerment", "problem solved", "future-ready feeling"],
  health: ["wellness commitment", "energy boost", "self-improvement", "body care ritual"],
  home: ["nesting comfort", "space transformation pride", "cozy satisfaction", "aesthetic achievement"],
  other: ["discovery excitement", "daily improvement", "lifestyle enhancement"],
};

/**
 * Generate rich product context for prompt enrichment.
 * Combines DNA fields with category intelligence to produce
 * a deep context block that makes prompts feel native and specific.
 */
export function getProductContext(dna: ProductDNA): {
  usageContext: string;
  emotionalAngle: string;
  interactionGuide: string;
  targetUser: string;
  contextBlock: string;
} {
  const contexts = USAGE_CONTEXTS[dna.category] || USAGE_CONTEXTS.other;
  const emotions = EMOTIONAL_ANGLES[dna.category] || EMOTIONAL_ANGLES.other;
  const usageContext = contexts[Math.floor(Math.random() * contexts.length)];
  const emotionalAngle = emotions[Math.floor(Math.random() * emotions.length)];

  // Generate interaction guide based on packaging type + usage type
  const interactionGuides: Record<string, string> = {
    "bottle+cosmetic": "Hold dropper above palm, dispense 2-3 drops, pat gently into skin",
    "tube+cosmetic": "Squeeze small amount onto fingertips, dot onto face, blend outward",
    "jar+cosmetic": "Scoop with fingertip, warm between palms, press into skin",
    "garment+wearable": "Hold up to body, try on and adjust, check fit in mirror",
    "device+device": "Unbox carefully, power on, navigate features on screen",
    "box+handheld": "Open packaging, lift product out, examine from multiple angles",
    "pouch+consumable": "Tear open corner, pour into cup/bowl, mix or prepare",
    "can+consumable": "Pop open tab, pour or drink directly, reaction to taste",
    "bottle+consumable": "Twist cap, pour into glass, first sip reaction",
  };

  const guideKey = `${dna.packaging_type}+${dna.usage_type}`;
  const interactionGuide =
    interactionGuides[guideKey] ||
    `Interact naturally with the ${dna.sub_category || dna.category} — pick up, examine, use as intended`;

  // Target user inference
  const targetUsers: Record<ProductCategory, string> = {
    skincare: "Indonesian women 18-35 who care about skincare routine and natural beauty",
    fashion: "Style-conscious Indonesian youth 18-30 who follow trends on TikTok",
    food: "Indonesian foodies and snack lovers who enjoy discovering new products",
    electronics: "Tech-savvy Indonesian consumers 20-35 who research before buying",
    health: "Health-conscious Indonesians 20-40 focused on wellness and fitness",
    home: "Indonesian homeowners/renters 22-35 who enjoy decorating and organizing",
    other: "Indonesian consumers 18-35 who discover products through social media",
  };
  const targetUser = targetUsers[dna.category] || targetUsers.other;

  const contextBlock = `This product is a ${dna.sub_category || dna.category} (${dna.product_description}).
Target user: ${targetUser}.
Usage context: ${usageContext}.
Emotional angle: ${emotionalAngle}.
Brand: ${dna.brand_name !== "unknown" ? dna.brand_name : "visible on packaging"}.

For interaction with this product, the creator should:
- ${interactionGuide}
- Show the ${dna.dominant_color} ${dna.packaging_type} clearly with label facing camera
- The ${dna.material} texture should be visible and natural
- Key features to highlight: ${dna.key_features || "overall quality and design"}`;

  return { usageContext, emotionalAngle, interactionGuide, targetUser, contextBlock };
}
