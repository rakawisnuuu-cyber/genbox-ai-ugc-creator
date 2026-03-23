/**
 * Image Generation Engine v3 — Category-Aware Shot System + UGC Behavioral Intelligence
 * Each shot type generates UNIQUE actions per product category.
 * Integrates: UGC Behavior Logic, Affiliate Priority Rule, First-Frame Conversion Rule.
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

// ── Category-Specific Shot Actions ─────────────────────────────
// This is the KEY differentiator — each shot type does something UNIQUE per category
const CATEGORY_SHOT_ACTIONS: Record<ProductCategory, Record<ShotTypeKey, string>> = {
  skincare: {
    hero: "Character holds serum/cream bottle near cheek with one hand, other hand lightly touching jawline. Product label clearly visible. Mid-sentence expression like casually reviewing for TikTok. Slight head tilt.",
    product_detail:
      "Close-up of hand squeezing serum drops onto open palm. Droplets catching light, product texture visible — gel/cream/liquid consistency. Product bottle stands upright nearby with label facing camera.",
    usage:
      "Character applying product to face with fingertips — dotting on cheeks and forehead, or spreading serum across skin. Mirror or selfie POV. Both product and face visible. Natural application motion.",
    reaction:
      "Character just finished applying — touching cheek with surprised/pleased expression, checking skin texture. Product resting on nearby surface. 'Wow it actually works' energy.",
    lifestyle:
      "Bathroom counter or vanity scene — product placed among other skincare items. Character in the middle of morning/night routine, relaxed and natural. Product stands out as the hero item.",
    face_closeup:
      "Extreme close-up of face after product application. Visible skin texture — pores, slight dewiness from product. Natural, unretouched look. Character touching face near product-applied area.",
  },
  fashion: {
    hero: "Full OOTD mirror selfie — character wearing the fashion item, confident standing pose. Full body visible head to toe. One hand holding phone, other naturally at side or on hip. Product (clothing/accessory) is the star.",
    product_detail:
      "Close-up of fabric texture, stitching detail, or hardware (zipper, button, strap). Character's hand touching/pinching the fabric to show quality. Natural light catching the material grain.",
    usage:
      "Character trying on the item — adjusting fit, pulling collar, rolling sleeves. Mid-motion styling shot. Shows how the item looks when actually being worn and moved in.",
    reaction:
      "Character looking in mirror checking the outfit, pleasantly surprised expression. Head tilted, slight smile. The 'this actually looks good on me' moment.",
    lifestyle:
      "Walking or seated in real environment (cafe, street, mall) wearing the item naturally. Product visible as part of complete outfit. Candid 'caught in daily life' energy.",
    face_closeup:
      "Upper body shot focusing on how the fashion item frames the face/neck area. Neckline, collar, or accessory detail near face. Character with relaxed confident expression.",
  },
  food: {
    hero: "Character holding food/drink product with appetizing presentation. Product positioned between face and camera. Excited/hungry expression. Package or plate clearly visible and appealing.",
    product_detail:
      "Macro shot of food texture — sauce drip, steam rising, condensation on cold drink, crumb detail, oil shine. Product packaging with brand visible nearby. ASMR-level detail.",
    usage:
      "Character taking first bite or first sip. Mouth approaching food, chopsticks/spoon lifting food, or tilting drink. The anticipation moment. Authentic eating/drinking action.",
    reaction:
      "Mid-chew or post-sip reaction — eyes widening, slow nod of approval, satisfied chewing expression. Product still in hand or on table. Genuine 'this is so good' face.",
    lifestyle:
      "Product on cafe table or kitchen counter with lifestyle props (coffee, phone, laptop). Character casually snacking/eating in natural context. Relaxed daily life integration.",
    face_closeup:
      "Character's face right after tasting — close-up reaction of enjoyment. Eyes closed savoring, or wide eyes surprise at flavor. Authentic sensory reaction.",
  },
  electronics: {
    hero: "Character holding device up to camera showing screen or main feature. Clean unboxing energy. Device angled so key features visible. Impressed/curious expression.",
    product_detail:
      "Close-up of ports, buttons, screen quality, build material. Character's hand for scale reference. Fingerprint on glass for realism. LED indicator or screen content visible.",
    usage:
      "Character actively using device — typing on keyboard, scrolling phone, wearing earbuds, using camera. Real usage scenario showing the device integrated into workflow.",
    reaction:
      "Character just discovered a cool feature — looking at device then looking at camera with impressed nod. 'Wait this actually can do this?' energy.",
    lifestyle:
      "Desk setup or on-the-go context — device naturally placed in work/life environment. Character using it as part of daily flow. WFH desk, car, cafe table.",
    face_closeup:
      "Character face illuminated by device screen light. Focused engaged expression. Shows the 'lost in using this device' moment. Screen glow visible on face.",
  },
  health: {
    hero: "Character holding supplement bottle/pack with morning energy expression. Glass of water nearby. Fresh-faced, motivated vibe. Product label clearly readable.",
    product_detail:
      "Close-up of nutrition label, supplement texture, pill/capsule/powder detail. Character's hand pouring or displaying dosage. Clean, trust-building detail shot.",
    usage:
      "Character taking supplement — swallowing with water, mixing powder into shaker, opening packet. Active consumption moment. Kitchen or gym context.",
    reaction:
      "Post-supplement energized expression — stretching, deep breath, ready-to-go body language. Product on counter nearby. 'I can feel the difference' energy.",
    lifestyle:
      "Morning routine or post-workout context — supplement bottle part of active healthy lifestyle setup. Gym bag, yoga mat, or kitchen smoothie ingredients visible.",
    face_closeup:
      "Fresh energized face close-up — glowing, healthy skin, bright eyes. Suggesting the wellness benefit. Post-workout or morning freshness.",
  },
  home: {
    hero: "Character standing next to home product in room setting — showing scale and placement. Proud presenter energy. Product is the focal point of the room/area.",
    product_detail:
      "Material and craftsmanship close-up — wood grain, fabric weave, stitching, mechanism detail. Character's hand touching surface to show texture quality.",
    usage:
      "Character actively using the home product — sitting on furniture, adjusting organizer, lighting candle, arranging decor. Functional demonstration.",
    reaction:
      "Character stepping back to admire the product in place — hands on hips, satisfied head tilt. 'Room transformation complete' energy.",
    lifestyle:
      "Cozy lifestyle moment — product naturally integrated into daily living. Reading on new chair, drinking tea with new mug, organized shelf in background.",
    face_closeup:
      "Character's comfortable relaxed face in context of home product — comfort and satisfaction. The 'finally my space feels right' expression.",
  },
  other: {
    hero: "Character showcasing product to camera with genuine interest. Product held clearly at chest level with label visible. Friendly reviewer energy.",
    product_detail:
      "Close-up of product key feature, packaging detail, or unique selling point. Hand for scale. Natural lighting highlighting material quality.",
    usage:
      "Character using or interacting with product in its natural context. Authentic demonstration of the product's purpose.",
    reaction:
      "Honest review expression after using — nodding approval, examining result, sharing genuine impression with camera.",
    lifestyle:
      "Product integrated into daily life scene. Natural, unforced placement showing how it fits into real routines.",
    face_closeup: "Close-up of character engaging with or reacting to the product. Natural expression, honest energy.",
  },
};

// ── UGC Behavioral Intelligence ──────────────────────────────────
const UGC_BEHAVIOR_BLOCK = `UGC BEHAVIOR LOGIC — Subject behaves like someone casually reviewing a product on TikTok.
Favor: mid-sentence expressions or micro reactions, natural hand adjustments and grip shifts, slight posture imbalance or casual leaning, attention split between product and camera.
Allow: slight handheld framing feel, minor natural motion blur.
The subject must feel spontaneous, not posed.`;

const AFFILIATE_PRIORITY_BLOCK = `AFFILIATE PRIORITY RULE — The product is ALWAYS the visual priority.
Ensure: product clearly visible and readable, logo or key feature unobstructed, pose naturally showcases product, lighting supports product clarity.
Avoid: wide shots shrinking the product, busy backgrounds distracting from product, hands blocking branding.
The viewer must instantly understand what is being promoted.`;

const FIRST_FRAME_RULE = `FIRST-FRAME CONVERSION RULE — The image must communicate the product instantly, even at thumbnail scale.
Ensure: product silhouette readable small, product placed within central viewing zone, branding visible without zooming, clear contrast between product and background.
Recognition must occur within 0.5 seconds.`;

const SINGLE_IMAGE_RULE = `OUTPUT RULE: Generate EXACTLY ONE single image. Do NOT create a grid, collage, multi-panel, split-screen, side-by-side, before/after comparison, or any multi-image layout. ONE image, ONE scene, ONE frame only.`;

const ANTI_GLITCH_BLOCK = `NEGATIVE CONSTRAINTS (DO NOT generate any of these):
- Extra fingers, deformed hands, merged fingers, missing fingers
- Text overlay, watermark, subtitle, logo stamp, UI elements
- Split image, grid layout, collage, multi-panel, triptych
- Blurry face, morphed product, duplicate objects, floating objects
- CGI render, 3D product mockup, plastic/waxy skin, airbrushed perfection
- Different product than described (do NOT substitute with another item)
- Multiple people unless explicitly requested`;

// ── Realism Directives ──────────────────────────────────────────
const UGC_REALISM = `PHOTOREALISM — UGC SMARTPHONE CAPTURE:
Shot on smartphone camera (iPhone 13 equivalent), 24-28mm lens, f/1.8-f/2.4 computational aperture.
Natural daylight only — window side-light or front-light, 5000K-6500K, uneven exposure allowed.
Skin: visible pores, acne texture, slight oiliness, blemishes, redness, uneven tone. Non-retouched real skin.
Composition: slightly off-center, imperfect framing, handheld micro-shake, awkward crop allowed.
Color: neutral to slightly warm, low-medium contrast, natural unsaturated, slightly inconsistent white balance.
Environment: real Indonesian living space, imperfect background, personal items visible.`;

const COMMERCIAL_REALISM = `PHOTOREALISM — EDITORIAL STUDIO PHOTOGRAPHY:
Shot on full-frame DSLR, 85mm or 50mm prime lens, f/1.8-f/2.8.
Studio lighting: soft diffused key light + subtle fill bounce + soft rim separation. 5200K-5600K.
Skin: visible pores but refined, matte finish, controlled highlights, minimal imperfections present.
Composition: intentional balanced framing, controlled asymmetry, tripod-stable.
Color: clean premium tone, medium contrast, slightly warm or neutral luxury, high consistency.
Environment: real but curated space, minimal clutter, intentional props.`;

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
  const categoryActions = CATEGORY_SHOT_ACTIONS[productDNA.category] || CATEGORY_SHOT_ACTIONS.other;
  const productCtx = getProductContext(productDNA);

  return selectedShots.map((shotKey, idx) => {
    const def = SHOT_TYPES.find((s) => s.key === shotKey)!;
    const style = mode === "ugc" ? def.ugc : def.commercial;
    const action = categoryActions[shotKey] || categoryActions.hero;

    const parts: string[] = [];

    // 1. Image reference anchoring
    parts.push(`IMAGE REFERENCE ANCHORING:
- Image 1 (character reference): This is the EXACT person to depict. Match their face shape, skin tone, facial features, hairstyle, body type, and clothing EXACTLY. Do not alter, beautify, or reimagine.
- Image 2 (product reference): This is the EXACT product to show. Match its shape, color, label, packaging, and size EXACTLY. Do not substitute with a different product.`);

    // 2. Single image + anti-glitch
    parts.push(SINGLE_IMAGE_RULE);
    parts.push(ANTI_GLITCH_BLOCK);

    // 3. Realism base
    parts.push(realism);
    if (boost) parts.push(boost);

    // 4. UGC behavioral intelligence (only for UGC mode)
    if (mode === "ugc") {
      parts.push(UGC_BEHAVIOR_BLOCK);
      parts.push(AFFILIATE_PRIORITY_BLOCK);
      if (idx === 0) parts.push(FIRST_FRAME_RULE); // first shot = thumbnail
    }

    // 5. Category-specific action (THE KEY DIFFERENTIATOR)
    parts.push(`SPECIFIC ACTION FOR THIS SHOT:\n${action}`);

    // 6. Scene setup
    parts.push(`SCENE: ${style.promptFragment}`);
    if (!style.expression.includes("N/A")) {
      parts.push(`CHARACTER: ${characterDescription}. Skin tone: ${skin}. Expression: ${style.expression}.`);
    }
    parts.push(`CAMERA: ${style.camera}, ${style.lens} lens, ${style.distance} distance, ${style.angle} angle.`);
    parts.push(`LIGHTING: ${style.lighting}`);
    parts.push(`COMPOSITION: ${style.composition}`);
    parts.push(`ENVIRONMENT: ${environment.description || environment.label}`);

    // 7. Product consistency
    parts.push(productBlock);
    parts.push(`PRODUCT DETAILS: ${catDetail}`);

    // 8. Product interaction guide from DNA
    parts.push(`PRODUCT INTERACTION: ${productCtx.interactionGuide}`);

    // 9. Environment consistency (same across all shots)
    if (idx > 0) {
      parts.push(
        `ENVIRONMENT CONSISTENCY: This shot takes place in the SAME location as all other shots. Same room, same wall color, same furniture, same lighting direction. Do not change the setting.`,
      );
    }

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
