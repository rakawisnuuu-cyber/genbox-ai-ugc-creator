/**
 * Image Generation Engine v2 — Shot Type System + Realism Directives
 * Simplified: user picks 1-3 shot TYPES, each generates one high-quality image.
 * Mode (UGC vs Commercial) determines the visual grammar.
 */

import type { ProductDNA, ProductCategory } from "./product-dna";
import { buildProductConsistencyBlock, getCategoryPromptInstruction, getProductContext } from "./product-dna";

// ── Types ───────────────────────────────────────────────────────
export type ContentMode = "ugc" | "commercial";
export type ImageModel = "nano-banana" | "nano-banana-2" | "nano-banana-pro";
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
  storyRole: string;
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
  imageModel: ImageModel;
  resolution: string;
}

// ── Shot Type Definitions ──────────────────────────────────────
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

// ── Realism Directives ──────────────────────────────────────────
const UGC_REALISM = `PHOTOREALISM — UGC SMARTPHONE CAPTURE:
Shot on smartphone camera (iPhone 13 equivalent), 24-28mm lens, f/1.8-f/2.4 computational aperture.
Natural daylight only — window side-light or front-light, 5000K-6500K, uneven exposure allowed.
Skin: visible pores, acne texture, slight oiliness, blemishes, redness, uneven tone. Non-retouched real skin.
Composition: slightly off-center, imperfect framing, handheld micro-shake, awkward crop allowed.
Color: neutral to slightly warm, low-medium contrast, natural unsaturated, slightly inconsistent white balance.
Environment: real Indonesian living space, imperfect background, personal items visible.
NEGATIVE: overly smooth skin, studio lighting, perfect symmetry, cinematic depth of field, DSLR look, CGI, 3D render, airbrushed skin.`;

const COMMERCIAL_REALISM = `PHOTOREALISM — EDITORIAL STUDIO PHOTOGRAPHY:
Shot on full-frame DSLR, 85mm or 50mm prime lens, f/1.8-f/2.8.
Studio lighting: soft diffused key light + subtle fill bounce + soft rim separation. 5200K-5600K.
Skin: visible pores but refined, matte finish, controlled highlights, minimal imperfections present.
Composition: intentional balanced framing, controlled asymmetry, tripod-stable.
Color: clean premium tone, medium contrast, slightly warm or neutral luxury, high consistency.
Environment: real but curated space, minimal clutter, intentional props.
NEGATIVE: CGI render, 3D product, plastic skin, over-retouched, fake reflections, hyper HDR, cartoon lighting.`;

const REALISM_BOOST: Record<RealismLevel, string> = {
  standard: "",
  ultra: "ULTRA-REALISM: Every skin pore visible, micro-blemishes, oil sheen, flyaway hairs, fabric grain, 8K detail.",
  raw_phone:
    "RAW PHONE FEEL: Digital noise, slight compression, uneven white balance, imperfect exposure, fingerprint on lens edge.",
};

const CATEGORY_DETAILS: Record<ProductCategory, string> = {
  skincare: "cream texture, moisture reflection, pores visible, serum droplets",
  fashion: "fabric wrinkles, natural folds, stitching, movement in clothing",
  food: "steam, oil shine, crumbs, sauce drip, condensation, appetizing texture",
  electronics: "fingerprints on glass, screen reflections, subtle smudges, LED glow",
  health: "supplement texture, pill detail, powder dissolving, wellness packaging",
  home: "wood grain, fabric weave, proportional to room, natural shadows",
  other: "natural material texture, realistic scale, authentic packaging",
};

const SKIN_TONES = ["sawo matang natural skin", "kuning langsat tone", "healthy Indonesian complexion"];

// ── Shot Planner ────────────────────────────────────────────────
export function planImageShots(config: GenerationConfig): ImageShotPlan[] {
  const { mode, selectedShots, productDNA, characterDescription, environment, realismLevel } = config;
  const realism = mode === "ugc" ? UGC_REALISM : COMMERCIAL_REALISM;
  const boost = REALISM_BOOST[realismLevel];
  const productBlock = buildProductConsistencyBlock(productDNA);
  const catDetail = CATEGORY_DETAILS[productDNA.category] || CATEGORY_DETAILS.other;
  const skin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];

  return selectedShots.map((shotKey, idx) => {
    const def = SHOT_TYPES.find((s) => s.key === shotKey)!;
    const style = mode === "ugc" ? def.ugc : def.commercial;

    const parts: string[] = [realism];
    if (boost) parts.push(boost);
    parts.push(`SCENE: ${style.promptFragment}`);
    if (!style.expression.includes("N/A")) {
      parts.push(`CHARACTER: ${characterDescription}. Skin tone: ${skin}. Expression: ${style.expression}.`);
    }
    parts.push(`CAMERA: ${style.camera}, ${style.lens} lens, ${style.distance} distance, ${style.angle} angle.`);
    parts.push(`LIGHTING: ${style.lighting}`);
    parts.push(`COMPOSITION: ${style.composition}`);
    parts.push(`ENVIRONMENT: ${environment.description || environment.label}`);
    parts.push(productBlock);
    parts.push(`PRODUCT DETAILS: ${catDetail}`);

    return {
      shotIndex: idx,
      shotType: shotKey,
      shotLabel: def.name.id,
      storyRole: def.name.en,
      prompt: parts.join("\n\n"),
    };
  });
}

// ── Cost ─────────────────────────────────────────────────────────
const COST_PER_IMAGE: Record<ImageModel, number> = {
  "nano-banana": 310,
  "nano-banana-2": 620,
  "nano-banana-pro": 1400,
};

export function estimateCost(model: ImageModel, count: number): number {
  return (COST_PER_IMAGE[model] || 1400) * count;
}

export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}
