/**
 * Image Generation Engine v4 — Lean Prompt System
 * Reduced token usage ~65% while maintaining output quality.
 * Keeps: SHOT_TYPES, estimateCost, formatRupiah, all type exports.
 */

import type { ProductDNA, ProductCategory } from "./product-dna";
import { buildProductConsistencyBlock } from "./product-dna";

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
  commonMistakes: string;
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
    commonMistakes:
      "Do NOT show a phone or camera device in the character's hands. Do NOT render the character taking a selfie with a visible phone. Both hands should be free to interact with the product or pose naturally. Do NOT add a second copy of the product.",
    ugc: {
      camera: "front-facing camera perspective, natural slight motion feel",
      distance: "40-70cm",
      angle: "slightly high angle, looking down at subject",
      lens: "24-26mm equivalent wide angle",
      lighting: "natural window light, uneven exposure, slight highlight blowout",
      composition: "off-center, imperfect crop, slight tilt",
      expression: "casual, friendly, slightly exaggerated",
      environment: "kost room / bedroom, visible clutter",
      promptFragment:
        "front-facing camera angle, character holds product near face with both hands free, uneven daylight, off-center framing, real skin texture, casual Indonesian room. No phone visible in frame.",
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
    commonMistakes:
      "Do NOT show a person's face — this is a product-only shot. Do NOT morph the product shape or change the label text. Do NOT create a grid or multi-panel layout. Keep the product proportions accurate to real life. Do NOT add random objects that aren't described.",
    ugc: {
      camera: "close-up perspective, slightly unsteady framing",
      distance: "15-25cm",
      angle: "slightly top-down or tilted",
      lens: "24mm equivalent",
      lighting: "window light, slightly harsh, uneven shadows",
      composition: "tight crop, imperfect alignment",
      expression: "N/A — product only",
      environment: "desk, bed, or random surface",
      promptFragment:
        "close-up product shot, uneven daylight, slight blur edge, natural shadow, real surface texture. Product only — no person's face visible.",
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
    commonMistakes:
      "Do NOT show a phone or camera in the character's hands — both hands must be interacting with the product. Do NOT render the character looking at a phone screen. The product must remain the SAME product throughout — do NOT morph it into a different item. Hands must have exactly 5 fingers each.",
    ugc: {
      camera: "front-facing camera perspective, close framing",
      distance: "30-60cm",
      angle: "eye-level or slightly above",
      lens: "24mm equivalent",
      lighting: "natural daylight, uneven shadows",
      composition: "tight, slightly imperfect crop",
      expression: "focused, natural",
      environment: "bathroom, bedroom, casual space",
      promptFragment:
        "character applying/using product with both hands, natural lighting, close framing, real skin texture. No phone or device in hands.",
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
    commonMistakes:
      "Do NOT show the character holding a phone. Expression must be genuine and natural — not exaggerated or theatrical. Do NOT smooth or airbrush the skin. The product should be visible nearby but NOT the main focus. Do NOT duplicate the character or show multiple people.",
    ugc: {
      camera: "front-facing camera perspective",
      distance: "30-50cm",
      angle: "slightly low or eye-level",
      lens: "24mm equivalent",
      lighting: "soft daylight, slightly inconsistent",
      composition: "natural framing, slight crop",
      expression: "excited, impressed, relatable",
      environment: "same casual room",
      promptFragment:
        "natural smile, touching face or product area, real skin texture, casual lighting, genuine reaction. No device in hands.",
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
    commonMistakes:
      "Do NOT shrink the product too small — it must be clearly recognizable even in a wider shot. Do NOT blur the product. The environment should feel real and lived-in, not a studio. Do NOT add branded items or logos that weren't described. Character should look candid, not posed.",
    ugc: {
      camera: "wider perspective, natural framing",
      distance: "80-120cm",
      angle: "eye-level or slightly tilted",
      lens: "24mm equivalent",
      lighting: "ambient daylight, mixed sources",
      composition: "loose framing, real environment visible",
      expression: "natural, candid",
      environment: "warung, mall, bedroom, street",
      promptFragment:
        "casual daily life scene, product clearly visible in the scene, natural lighting, candid feel, real Indonesian environment. No phone visible.",
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
    commonMistakes:
      "Do NOT smooth or beautify the skin — visible pores, texture, and minor imperfections are intentional. Do NOT show hands holding a phone near the face. The product should be partially visible or recently applied, not the main subject. Do NOT over-saturate skin color. Do NOT crop out too much — at least eyes to chin should be visible.",
    ugc: {
      camera: "extreme close-up perspective",
      distance: "20-30cm",
      angle: "frontal or slight angle",
      lens: "24mm equivalent",
      lighting: "window side light, uneven exposure",
      composition: "tight crop, partial face allowed",
      expression: "raw, unfiltered, natural",
      environment: "bedroom/bathroom",
      promptFragment:
        "extreme close-up of face, visible pores, natural skin texture, uneven lighting, raw authentic feel. No device in frame.",
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

// ── Lean System Blocks ─────────────────────────────────────────
const LEAN_SYSTEM_BASE = (mode: ContentMode): string => `
You generate hyper-realistic ${mode === "ugc" ? "Indonesian UGC smartphone" : "editorial commercial"} photos.
SUBJECT: Match the character reference EXACTLY — face, skin tone, hair, body type. Do not beautify or alter.
PRODUCT: Match the product reference EXACTLY — shape, color, label, logo, proportions. No redesign.
${mode === "ugc" ? `CAPTURE FEEL: Front-facing smartphone camera (24-28mm). Natural daylight only. Slightly off-center framing. Real skin — pores, tone variation, no filter. Subject feels mid-review, spontaneous, not posed. No phone or device visible in frame — the camera IS the viewer's POV.` : `CAPTURE FEEL: Full-frame DSLR, 85mm. Soft diffused studio light. Intentional balanced composition. Refined skin — natural but controlled. Clean curated environment.`}
PRODUCT VISIBILITY: Logo unobstructed. Readable at thumbnail scale. Lighting supports product clarity.
OUTPUT: ONE single image only. No grid, no collage, no split-screen.
HANDS: Exactly 5 fingers each. No phone or device in hands.
`.trim();

const NEGATIVE_BLOCK = `Avoid: CGI, 3D render, cartoon, airbrushed skin, plastic texture, extra fingers, product redesign, altered logo, color-shifted packaging, phone or device in frame, grid layout, watermark, duplicate objects.`;

const REALISM_BOOST: Record<RealismLevel, string> = {
  standard: "",
  ultra: "Ultra realism: every skin pore visible, micro-blemishes, oil sheen, flyaway hairs, 8K detail.",
  raw_phone: "Raw phone feel: digital noise, slight compression, uneven white balance, imperfect exposure.",
};

// ── Category-Specific Shot Actions (Lean) ──────────────────────
const CATEGORY_SHOT_ACTIONS: Record<ProductCategory, Record<ShotTypeKey, string>> = {
  skincare: {
    hero: "Medium close-up. Character holds product near cheek, label facing camera. Mid-review expression, slight head tilt.",
    product_detail: "POV looking down. Hands hold product, cap open or product on fingertips. Label faces up. No face.",
    usage: "Both hands applying product to face — dotting serum on cheeks, spreading cream. Face and product both visible.",
    reaction: "Face close-up, one hand touching cheek. Genuine impressed expression. Product resting nearby.",
    lifestyle: "Bathroom or vanity scene. Product among other skincare items. Character mid morning-routine, relaxed.",
    face_closeup: "Extreme tight crop eyes-to-chin. Visible pores, slight dewiness from product. One hand touching skin.",
  },
  fashion: {
    hero: "Full body head-to-toe. Character wearing the item, standing confident. One hand on hip. Outfit is the hero.",
    product_detail: "Extreme close-up on fabric — texture, stitching, hardware detail. Character hand touching or pinching material. No face visible.",
    usage: "Mid-motion — walking, turning, or reaching. Fashion item moves naturally with body. Caught-in-motion feel, not posed.",
    reaction: "Upper body. Character looking at themselves with confidence — shoulders back, slight smile. Hand adjusting collar or sleeve.",
    lifestyle: "Wide shot. Character in real destination (cafe, street, mall) wearing outfit naturally. Mid-activity, not posing for camera.",
    face_closeup: "Face and neckline or collar framing. How the clothing frames their identity. Confident personal expression.",
  },
  food: {
    hero: "Medium close-up. Character holding food or drink, product between face and camera. Hungry or excited expression.",
    product_detail: "POV looking down at food on table. Hands interacting — opening packaging, chopsticks lifting, steam or condensation visible. No face.",
    usage: "First bite or first sip moment. Mouth approaching food. Authentic eating or drinking action.",
    reaction: "Face close-up mid-chew or post-sip. Eyes widening, satisfied nod. Product still in hand.",
    lifestyle: "Product on cafe table or kitchen counter with lifestyle props. Character casually snacking in natural context.",
    face_closeup: "Face right after tasting. Eyes closed savoring or wide-eye surprise at flavor. Sensory reaction close-up.",
  },
  electronics: {
    hero: "Medium close-up. Character holding device up, screen or main feature visible. Impressed or curious expression.",
    product_detail: "POV looking down at device. Fingers exploring buttons, ports, screen surface. Fingerprints on glass for realism. No face.",
    usage: "Character actively using device — typing, wearing earbuds, using camera feature. Real usage scenario.",
    reaction: "Character discovers cool feature — impressed nod toward camera. 'Wait this actually works' energy.",
    lifestyle: "Desk setup or on-the-go. Device in natural work or life environment — WFH desk, commute, or cafe table.",
    face_closeup: "Face lit by device screen glow. Focused immersed expression. Lost-in-the-device moment.",
  },
  health: {
    hero: "Medium close-up. Character holding supplement bottle, glass of water nearby. Fresh-faced morning energy.",
    product_detail: "POV looking down at supplement in palm or being poured from bottle. Label readable. Kitchen or desk surface below.",
    usage: "Character swallowing pill with water, mixing powder into shaker, or opening packet. Active consumption moment.",
    reaction: "Post-supplement energized expression — stretching, deep breath. Ready-to-go body language. Product on counter nearby.",
    lifestyle: "Morning routine or post-workout setup. Supplement beside gym bag, yoga mat, or smoothie ingredients.",
    face_closeup: "Fresh energized face — glowing healthy skin, bright eyes. Post-workout or morning freshness.",
  },
  home: {
    hero: "Medium-wide shot. Character standing beside home product in room. Proud presenter energy. Hands free or gesturing toward it.",
    product_detail: "POV hands running across product surface — feeling wood grain, fabric weave, or mechanism. No face visible.",
    usage: "Character actively using product — sitting on furniture, adjusting organizer, lighting candle, arranging decor.",
    reaction: "Character stepping back to admire product in place. Hands on hips, satisfied head tilt. Room transformation energy.",
    lifestyle: "Product naturally in daily living scene — reading on new chair, cozy room corner, organized shelf in background.",
    face_closeup: "Comfortable relaxed face in context of home product. Comfort and satisfaction expression.",
  },
  other: {
    hero: "Medium close-up. Character showcasing product to camera. Product at chest level, label clearly visible.",
    product_detail: "Close-up of product key feature or packaging detail. Hand for scale. Natural lighting on material.",
    usage: "Character using product in its natural context. Authentic functional demonstration.",
    reaction: "Honest review expression — nodding approval, examining result, sharing genuine impression toward camera.",
    lifestyle: "Product integrated into daily life. Natural unforced placement in real routine.",
    face_closeup: "Close-up of character engaging with or reacting to product. Natural honest energy.",
  },
};

// ── Shot Planner ────────────────────────────────────────────────
export function planImageShots(config: GenerationConfig): ImageShotPlan[] {
  const {
    mode,
    selectedShots,
    productDNA,
    characterDescription,
    environment,
    realismLevel,
  } = config;

  const systemBlock = LEAN_SYSTEM_BASE(mode);
  const realismBoost = REALISM_BOOST[realismLevel];
  const productBlock = buildProductConsistencyBlock(productDNA);
  const categoryActions = CATEGORY_SHOT_ACTIONS[productDNA.category] || CATEGORY_SHOT_ACTIONS.other;
  const environmentLine = `Environment: ${environment.description || environment.label}`;

  return selectedShots.map((shotKey, idx) => {
    const def = SHOT_TYPES.find((s) => s.key === shotKey)!;
    const style = mode === "ugc" ? def.ugc : def.commercial;
    const action = categoryActions[shotKey] || categoryActions.hero;

    const parts: string[] = [
      systemBlock,
      ...(realismBoost ? [realismBoost] : []),
      `SHOT: ${def.name.en} — ${action}`,
      `CHARACTER: ${characterDescription}. Expression: ${style.expression}.`,
      `CAMERA: ${style.lens} lens, ${style.distance} distance, ${style.angle} angle.`,
      `LIGHTING: ${style.lighting}`,
      environmentLine,
      productBlock,
      ...(idx > 0
        ? [`CONSISTENCY: Same location as all previous shots — same room, wall color, lighting direction.`]
        : []),
      NEGATIVE_BLOCK,
    ];

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
  "nano-banana": 640,
  "nano-banana-2": 640,
  "nano-banana-pro": 1440,
};

export function estimateCost(model: ImageModel, count: number): number {
  return (COST_PER_IMAGE[model] || 1400) * count;
}

export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}
