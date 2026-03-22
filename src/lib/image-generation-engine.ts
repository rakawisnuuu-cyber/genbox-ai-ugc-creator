/**
 * Image Generation Engine v2 — Shot Type System + Realism Directives
 * Simplified: user picks 1-3 shot TYPES, each generates one high-quality image.
 * Mode (UGC vs Commercial) determines the visual grammar.
 *
 * Key rule: mode defines realism system, shot_type defines composition behavior.
 */

import type { ProductDNA, ProductCategory } from "./product-dna";
import { buildProductConsistencyBlock, getCategoryPromptInstruction, getProductContext } from "./product-dna";

/* ─── Types ─────────────────────────────────────────────────── */

export type ContentMode = "ugc" | "commercial";
export type ImageModelType = "nano-banana" | "nano-banana-2" | "nano-banana-pro";
export type ImageModel = ImageModelType;
export type RealismLevel = "standard" | "ultra" | "raw_phone";

export type ShotTypeKey = "hero" | "product_detail" | "usage" | "reaction" | "lifestyle" | "face_closeup";

export interface ShotTypeDefinition {
  key: ShotTypeKey;
  name: { en: string; id: string };
  purpose: string;
  icon: string;
  whenToUse: string[];
  ugc: ShotStyleConfig;
  commercial: ShotStyleConfig;
}

interface ShotStyleConfig {
  camera: string;
  distance: string;
  angle: string;
  lens: string;
  lighting: string;
  composition: string;
  expression: string;
  environment: string;
  promptFragment: string;
}

export interface ImageShotPlan {
  shotIndex: number;
  shotType: ShotTypeKey;
  shotLabel: string;
  prompt: string;
}

export interface GenerationConfig {
  mode: ContentMode;
  selectedShots: ShotTypeKey[];
  productDNA: ProductDNA;
  characterDescription: string;
  characterImageUrl: string;
  productImageUrl: string;
  environment: { label: string; description: string };
  realismLevel: RealismLevel;
  aspectRatio: string;
  imageModel: ImageModelType;
  resolution: string;
}

/* ─── Cost ───────────────────────────────────────────────────── */

export const IMAGE_COST_IDR: Record<ImageModelType, Record<string, number>> = {
  "nano-banana": { "1K": 310, "2K": 310, "4K": 310 },
  "nano-banana-2": { "1K": 620, "2K": 620, "4K": 620 },
  "nano-banana-pro": { "1K": 1400, "2K": 1400, "4K": 1860 },
};

export function getImageCost(model: ImageModelType, resolution: string): number {
  return IMAGE_COST_IDR[model]?.[resolution] ?? 1400;
}

export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}

/* ─── Shot Type Definitions ──────────────────────────────────── */

export const SHOT_TYPES: ShotTypeDefinition[] = [
  {
    key: "hero",
    name: { en: "Hero Shot", id: "Shot Utama" },
    purpose: "Foto utama karakter + produk untuk thumbnail atau cover",
    icon: "Star",
    whenToUse: ["all"],
    ugc: {
      camera: "smartphone (iPhone 13), handheld",
      distance: "40-70cm",
      angle: "slightly high selfie angle",
      lens: "24-26mm equivalent",
      lighting: "natural window light, uneven exposure, slight highlight blowout",
      composition: "off-center, imperfect crop, slight tilt",
      expression: "casual, friendly, slightly exaggerated",
      environment: "kost room / bedroom, visible clutter",
      promptFragment:
        "selfie style, holding product near face, uneven daylight, off-center framing, real skin texture, casual Indonesian room",
    },
    commercial: {
      camera: "full-frame DSLR, tripod",
      distance: "120-150cm",
      angle: "eye-level",
      lens: "85mm",
      lighting: "soft diffused key + subtle rim light, 5600K",
      composition: "balanced, intentional asymmetry",
      expression: "calm, confident, minimal",
      environment: "minimal studio or modern apartment",
      promptFragment:
        "editorial portrait, holding product elegantly, soft studio lighting, shallow depth of field, premium feel",
    },
  },
  {
    key: "product_detail",
    name: { en: "Product Detail", id: "Detail Produk" },
    purpose: "Close-up produk untuk highlight kualitas, tekstur, dan packaging",
    icon: "Search",
    whenToUse: ["skincare", "food", "electronics"],
    ugc: {
      camera: "smartphone",
      distance: "15-25cm",
      angle: "slightly top-down or handheld tilt",
      lens: "24mm",
      lighting: "window light, slightly harsh, uneven shadows",
      composition: "tight crop, imperfect alignment",
      expression: "N/A — product only",
      environment: "desk, bed, or random surface",
      promptFragment:
        "handheld close-up product shot, uneven daylight, slight blur, natural shadow, real surface texture",
    },
    commercial: {
      camera: "full-frame DSLR / macro lens",
      distance: "20-40cm",
      angle: "controlled diagonal or top-down",
      lens: "85mm macro",
      lighting: "controlled highlights, softbox reflections",
      composition: "clean minimal, centered or grid-aligned",
      expression: "N/A — product only",
      environment: "clean surface, curated minimal set",
      promptFragment: "macro product shot, soft reflections, premium lighting, clean background, catalog quality",
    },
  },
  {
    key: "usage",
    name: { en: "Usage Shot", id: "Shot Pemakaian" },
    purpose: "Tunjukkan cara pakai produk secara natural",
    icon: "Hand",
    whenToUse: ["skincare", "food", "electronics", "health"],
    ugc: {
      camera: "smartphone handheld",
      distance: "30-60cm",
      angle: "selfie or mirror angle",
      lens: "24mm",
      lighting: "natural daylight, uneven shadows",
      composition: "tight, imperfect crop",
      expression: "focused, natural",
      environment: "bathroom, bedroom, casual space",
      promptFragment: "applying product, visible pores, handheld camera feel, uneven lighting, mirror selfie style",
    },
    commercial: {
      camera: "full-frame DSLR",
      distance: "100-130cm",
      angle: "slightly low cinematic",
      lens: "50mm",
      lighting: "window + soft fill, controlled shadows",
      composition: "rule of thirds, both face and hands visible",
      expression: "calm, elegant, focused",
      environment: "minimal lifestyle setting, near window",
      promptFragment: "applying product near window, soft shadows, editorial lifestyle, rule of thirds composition",
    },
  },
  {
    key: "reaction",
    name: { en: "Reaction Shot", id: "Shot Reaksi" },
    purpose: "Ekspresi setelah pakai produk — trust builder",
    icon: "Smile",
    whenToUse: ["skincare", "health", "food"],
    ugc: {
      camera: "smartphone",
      distance: "30-50cm",
      angle: "slightly low or eye-level selfie",
      lens: "24mm",
      lighting: "soft daylight, slightly inconsistent",
      composition: "natural framing, slight crop",
      expression: "excited, impressed, relatable",
      environment: "same casual room",
      promptFragment: "natural smile, touching face, real skin texture, casual lighting, genuine reaction",
    },
    commercial: {
      camera: "full-frame DSLR",
      distance: "100-140cm",
      angle: "eye-level",
      lens: "85mm",
      lighting: "soft warm key light",
      composition: "balanced portrait, shallow depth",
      expression: "subtle satisfaction, refined smile",
      environment: "clean lifestyle interior",
      promptFragment: "soft smile, glowing skin, premium lighting, shallow depth of field, editorial beauty",
    },
  },
  {
    key: "lifestyle",
    name: { en: "Lifestyle Context", id: "Shot Lifestyle" },
    purpose: "Produk dalam konteks kehidupan sehari-hari",
    icon: "Coffee",
    whenToUse: ["fashion", "food", "electronics", "home"],
    ugc: {
      camera: "smartphone",
      distance: "80-120cm",
      angle: "eye-level or slightly tilted",
      lens: "24mm",
      lighting: "ambient daylight, mixed sources",
      composition: "loose framing, clutter visible",
      expression: "natural, candid",
      environment: "warung, mall, bedroom, street",
      promptFragment:
        "casual daily life, product visible in scene, natural lighting, candid feel, real Indonesian environment",
    },
    commercial: {
      camera: "full-frame DSLR",
      distance: "150-250cm",
      angle: "cinematic eye-level or slightly low",
      lens: "35-50mm",
      lighting: "controlled natural + bounce fill",
      composition: "wide balanced composition, foreground/background separation",
      expression: "effortless, aspirational",
      environment: "modern apartment, cafe, curated lifestyle setting",
      promptFragment:
        "wide lifestyle shot, cinematic composition, natural light, premium environment, aspirational feel",
    },
  },
  {
    key: "face_closeup",
    name: { en: "Face Close-Up", id: "Close-Up Wajah" },
    purpose: "Detail wajah dan kulit untuk trust dan intimacy",
    icon: "Eye",
    whenToUse: ["skincare", "health"],
    ugc: {
      camera: "smartphone",
      distance: "20-30cm",
      angle: "selfie extreme close",
      lens: "24mm",
      lighting: "window side light, uneven exposure",
      composition: "tight crop, partial face allowed",
      expression: "raw, unfiltered, natural",
      environment: "bedroom/bathroom",
      promptFragment: "extreme close-up face, visible pores, acne, uneven lighting, handheld feel, raw skin texture",
    },
    commercial: {
      camera: "full-frame DSLR",
      distance: "50-70cm",
      angle: "frontal or slight 3/4",
      lens: "85mm",
      lighting: "soft diffused beauty light",
      composition: "tight clean framing, centered",
      expression: "calm, serene, minimal",
      environment: "studio or minimal set",
      promptFragment: "beauty close-up, visible pores but refined, soft light, shallow depth of field, editorial skin",
    },
  },
];

/* ─── Realism Directives ─────────────────────────────────────── */

const UGC_REALISM_DIRECTIVE = `PHOTOREALISM — UGC SMARTPHONE CAPTURE:
Shot on smartphone camera (iPhone 13 equivalent), 24-28mm lens, f/1.8-f/2.4 computational aperture.
Natural daylight only — window side-light or front-light, 5000K-6500K, uneven exposure allowed.
Skin: visible pores, acne texture, slight oiliness, blemishes, redness, uneven tone. Non-retouched real skin.
Composition: slightly off-center, imperfect framing, handheld micro-shake, awkward crop allowed.
Color: neutral to slightly warm, low-medium contrast, natural unsaturated, slightly inconsistent white balance.
Environment: real Indonesian living space, imperfect background, personal items visible.
Quality: slightly soft focus allowed, subtle motion blur, authentic phone camera noise.
NEGATIVE: overly smooth skin, studio lighting, perfect symmetry, cinematic depth of field, professional DSLR look, CGI render, 3D lighting, perfect product placement, luxury set design, airbrushed skin, beauty retouch, centered composition, symmetrical framing.`;

const COMMERCIAL_REALISM_DIRECTIVE = `PHOTOREALISM — EDITORIAL STUDIO PHOTOGRAPHY:
Shot on full-frame DSLR or medium format camera, 85mm or 50mm prime lens, f/1.8-f/2.8.
Studio lighting: soft diffused key light + subtle fill bounce + soft rim separation. 5200K-5600K.
Skin: visible pores but refined, matte finish, controlled highlights, minimal imperfections present.
Composition: intentional balanced framing, controlled asymmetry, tripod-stable, eye-level or cinematic low.
Color: clean premium tone, medium contrast, slightly warm or neutral luxury, high consistency.
Environment: real but curated space, minimal clutter, intentional props.
Quality: tack sharp on subject, shallow depth of field, professional clarity.
NEGATIVE: CGI render, 3D product, plastic skin, over-retouched, unreal reflections, hyper HDR, fake shadows, cartoon lighting, flat lighting, harsh flash.`;

const REALISM_LEVEL_MODIFIERS: Record<RealismLevel, string> = {
  standard: "",
  ultra: `ULTRA-REALISM BOOST: Extreme skin micro-detail — visible individual pores, natural oil sheen reflecting light, micro-hairs on cheeks and forehead, subtle freckles, faint redness around nose and cheeks. Hair shows individual strand separation with flyaways. Eyes have realistic light reflections in pupils. Fabric shows grain and natural wrinkles. 8K resolution, extreme photographic detail.`,
  raw_phone: `RAW PHONE CAMERA FEEL: Must look like a real smartphone capture posted to TikTok or Instagram Stories. Slight digital noise, subtle compression artifacts, natural phone camera sharpness with edge softness. Imperfect composition, slightly tilted frame. Visible room clutter in background — charger cables, kipas angin, scattered skincare. Indistinguishable from a real selfie.`,
};

/* ─── Indonesian Context ──────────────────────────────────────── */

const INDONESIAN_CONTEXT: Record<ContentMode, { skinTones: string[]; styling: string }> = {
  ugc: {
    skinTones: ["sawo matang natural skin", "kuning langsat tone", "slightly uneven tropical skin texture"],
    styling: "casual home wear, no heavy makeup, natural messy hair, sandal rumah",
  },
  commercial: {
    skinTones: ["sawo matang glowing skin", "kuning langsat smooth tone", "healthy tropical skin"],
    styling: "neutral palette outfit, linen cotton textures, minimal accessories, clean makeup natural glow",
  },
};

/* ─── Category Modifiers ──────────────────────────────────────── */

const CATEGORY_MODIFIERS: Record<ProductCategory, string> = {
  skincare: "cream texture visible, moisture reflection, skin absorption detail, serum droplets",
  fashion: "fabric wrinkles, natural folds, stitching detail, movement in clothing",
  food: "steam rising, oil shine, crumbs, sauce drip, condensation on glass, appetizing texture",
  electronics: "fingerprints on glass, screen reflections, subtle smudges, cable textures, LED indicators",
  health: "supplement texture, pill detail, powder dissolving, clean wellness packaging",
  home: "wood grain, fabric weave, proportional to room, natural shadows, material texture",
  other: "natural material texture, realistic scale, authentic packaging detail",
};

/* ─── Main Planner ────────────────────────────────────────────── */

export function planImageShots(config: GenerationConfig): ImageShotPlan[] {
  const { mode, selectedShots, productDNA, characterDescription, environment, realismLevel } = config;

  const realismDirective = mode === "ugc" ? UGC_REALISM_DIRECTIVE : COMMERCIAL_REALISM_DIRECTIVE;
  const realismBoost = REALISM_LEVEL_MODIFIERS[realismLevel];
  const productBlock = buildProductConsistencyBlock(productDNA);
  const categoryMod = CATEGORY_MODIFIERS[productDNA.category] || CATEGORY_MODIFIERS.other;
  const idContext = INDONESIAN_CONTEXT[mode];
  const skinTone = idContext.skinTones[Math.floor(Math.random() * idContext.skinTones.length)];

  return selectedShots.map((shotKey, idx) => {
    const shotDef = SHOT_TYPES.find((s) => s.key === shotKey);
    if (!shotDef) throw new Error(`Unknown shot type: ${shotKey}`);

    const style = mode === "ugc" ? shotDef.ugc : shotDef.commercial;

    const prompt = buildPrompt({
      realismDirective,
      realismBoost,
      style,
      characterDescription,
      skinTone,
      styling: idContext.styling,
      environment: environment.description,
      productBlock,
      categoryMod,
      shotDef,
      mode,
    });

    return {
      shotIndex: idx,
      shotType: shotKey,
      shotLabel: shotDef.name.id,
      prompt,
    };
  });
}

/* ─── Prompt Assembly ─────────────────────────────────────────── */

function buildPrompt(params: {
  realismDirective: string;
  realismBoost: string;
  style: ShotStyleConfig;
  characterDescription: string;
  skinTone: string;
  styling: string;
  environment: string;
  productBlock: string;
  categoryMod: string;
  shotDef: ShotTypeDefinition;
  mode: ContentMode;
}): string {
  const {
    realismDirective,
    realismBoost,
    style,
    characterDescription,
    skinTone,
    styling,
    environment,
    productBlock,
    categoryMod,
    shotDef,
    mode,
  } = params;

  const parts: string[] = [];

  // 1. Realism system
  parts.push(realismDirective);
  if (realismBoost) parts.push(realismBoost);

  // 2. Scene description from shot type
  parts.push(`SCENE: ${style.promptFragment}`);

  // 3. Character (skip for product-only shots)
  if (!style.expression.includes("N/A")) {
    parts.push(
      `CHARACTER: ${characterDescription}. Skin tone: ${skinTone}. Expression: ${style.expression}. Styling: ${styling}.`,
    );
  }

  // 4. Camera technical
  parts.push(`CAMERA: ${style.camera}, ${style.lens} lens, ${style.distance} distance, ${style.angle} angle.`);

  // 5. Lighting
  parts.push(`LIGHTING: ${style.lighting}`);

  // 6. Composition
  parts.push(`COMPOSITION: ${style.composition}`);

  // 7. Environment
  parts.push(`ENVIRONMENT: ${environment}`);

  // 8. Product consistency
  parts.push(productBlock);

  // 9. Category-specific details
  parts.push(`PRODUCT DETAILS TO SHOW: ${categoryMod}`);

  return parts.join("\n\n");
}
