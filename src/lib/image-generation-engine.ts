/**
 * Image Generation Engine — shot planner + realism directives.
 * Takes setup inputs and produces an array of structured prompts.
 */

import type { ProductDNA } from "./product-dna";
import { buildProductConsistencyBlock, getCategoryPromptInstruction } from "./product-dna";
import { getStoryboardBeats, type StoryboardBeat } from "./storyboard-angles";
import type { ContentTemplateKey } from "./content-templates";

// ── Types ───────────────────────────────────────────────────────
export type ContentMode = "ugc" | "commercial";
export type ImageModel = "nano-banana" | "nano-banana-2" | "nano-banana-pro";
export type RealismLevel = "standard" | "ultra" | "raw_phone";

export interface ImageShotPlan {
  shotIndex: number;
  shotLabel: string;
  storyRole: string;
  distance: "close-up" | "medium" | "wide" | "macro";
  angle: "eye-level" | "slightly-above" | "slightly-below" | "3/4-profile" | "overhead";
  lens: string;
  expression: string;
  productInteraction: string;
  prompt: string;
}

export interface GenerationConfig {
  mode: ContentMode;
  templateKey: ContentTemplateKey;
  productDNA: ProductDNA;
  characterDescription: string;
  characterImageUrl: string;
  productImageUrl: string;
  environment: { label: string; description: string };
  imageCount: 3 | 6 | 9;
  realismLevel: RealismLevel;
  aspectRatio: string;
  imageModel: ImageModel;
  resolution: string;
}

// ── Realism Directives ──────────────────────────────────────────
export const UGC_REALISM_DIRECTIVE = `PHOTOREALISM — UGC SMARTPHONE CAPTURE: Shot on smartphone camera (iPhone 13 equivalent), 24-28mm lens, f/1.8-f/2.4 computational aperture. Natural daylight only — window side-light or front-light, 5000K-6500K, uneven exposure allowed. Skin: visible pores, acne texture, slight oiliness, blemishes, redness, uneven tone. Non-retouched real skin. Composition: slightly off-center, imperfect framing, handheld micro-shake, awkward crop allowed. Color: neutral to slightly warm, low-medium contrast, natural unsaturated, slightly inconsistent white balance. Environment: real Indonesian living space, imperfect background, personal items visible. Quality: slightly soft focus allowed, subtle motion blur, authentic phone camera noise. NEGATIVE: overly smooth skin, studio lighting, perfect symmetry, cinematic depth of field, professional DSLR look, CGI render, 3D lighting, perfect product placement, luxury set design, airbrushed skin, beauty retouch.`;

export const COMMERCIAL_REALISM_DIRECTIVE = `PHOTOREALISM — EDITORIAL STUDIO PHOTOGRAPHY: Shot on full-frame DSLR or medium format camera, 85mm or 50mm prime lens, f/1.8-f/2.8. Studio lighting: soft diffused key light + subtle fill bounce + soft rim separation. 5200K-5600K. Skin: visible pores but refined, matte finish, controlled highlights, minimal imperfections present. Composition: intentional balanced framing, controlled asymmetry, tripod-stable, eye-level or cinematic low. Color: clean premium tone, medium contrast, slightly warm or neutral luxury, high consistency. Environment: real but curated space, minimal clutter, intentional props. Quality: tack sharp on subject, shallow depth of field, professional clarity. NEGATIVE: CGI render, 3D product, plastic skin, over-retouched, unreal reflections, hyper HDR, fake shadows, cartoon lighting, flat lighting, harsh flash.`;

// ── Shot Architecture Tables ────────────────────────────────────
interface ShotSpec {
  distance: ImageShotPlan["distance"];
  angle: ImageShotPlan["angle"];
  lens: string;
  expression: string;
  interaction: string;
}

const UGC_SHOTS: ShotSpec[] = [
  { distance: "close-up", angle: "slightly-above", lens: "24mm", expression: "surprised/curious", interaction: "holding product near face" },
  { distance: "close-up", angle: "eye-level", lens: "24mm", expression: "concerned/frustrated", interaction: "touching problem area" },
  { distance: "medium", angle: "eye-level", lens: "26mm", expression: "casual neutral", interaction: "holding product loosely" },
  { distance: "close-up", angle: "3/4-profile", lens: "24mm", expression: "focused", interaction: "applying product" },
  { distance: "close-up", angle: "slightly-below", lens: "24mm", expression: "subtle satisfaction", interaction: "touching face lightly" },
  { distance: "medium", angle: "eye-level", lens: "26mm", expression: "friendly confident", interaction: "holding product to camera" },
  { distance: "close-up", angle: "slightly-above", lens: "24mm", expression: "genuine delight", interaction: "examining product up close" },
  { distance: "medium", angle: "3/4-profile", lens: "26mm", expression: "relaxed natural", interaction: "using product casually" },
  { distance: "close-up", angle: "eye-level", lens: "24mm", expression: "impressed nodding", interaction: "pointing at product feature" },
];

const COMMERCIAL_SHOTS: ShotSpec[] = [
  { distance: "medium", angle: "eye-level", lens: "85mm", expression: "confident neutral", interaction: "product held elegantly" },
  { distance: "macro", angle: "overhead", lens: "85mm macro", expression: "N/A", interaction: "product only, clean" },
  { distance: "medium", angle: "slightly-below", lens: "50mm", expression: "calm luxurious", interaction: "using naturally" },
  { distance: "close-up", angle: "eye-level", lens: "85mm", expression: "relaxed", interaction: "touching skin" },
  { distance: "medium", angle: "eye-level", lens: "50mm", expression: "genuine smile", interaction: "casual holding" },
  { distance: "close-up", angle: "overhead", lens: "85mm", expression: "N/A", interaction: "product centered" },
  { distance: "medium", angle: "slightly-above", lens: "50mm", expression: "aspirational", interaction: "product in lifestyle" },
  { distance: "close-up", angle: "3/4-profile", lens: "85mm", expression: "editorial poise", interaction: "product near face" },
  { distance: "medium", angle: "eye-level", lens: "50mm", expression: "warm confident", interaction: "presenting product" },
];

// ── Indonesian Context Modifiers ────────────────────────────────
const INDONESIAN_SKIN = "Indonesian skin tone, sawo matang or kuning langsat natural complexion";

function getRealismModifier(level: RealismLevel, mode: ContentMode): string {
  if (level === "ultra") {
    return "MAXIMUM REALISM: Every skin pore visible, micro-blemishes, slight oil sheen, unretouched imperfections. Hyper-photographic.";
  }
  if (level === "raw_phone" && mode === "ugc") {
    return "RAW PHONE CAMERA FEEL: Slightly noisy, uneven white balance, lens flare from window, fingerprint smudge on lens edge, imperfect exposure. Real smartphone capture, not cleaned up.";
  }
  return "";
}

// ── Shot Planner ────────────────────────────────────────────────
export function planImageShots(config: GenerationConfig): ImageShotPlan[] {
  const beats = getStoryboardBeats(config.templateKey);
  const shotTable = config.mode === "ugc" ? UGC_SHOTS : COMMERCIAL_SHOTS;
  const realism = config.mode === "ugc" ? UGC_REALISM_DIRECTIVE : COMMERCIAL_REALISM_DIRECTIVE;
  const realismMod = getRealismModifier(config.realismLevel, config.mode);

  // Select beats based on imageCount
  let selectedBeats: StoryboardBeat[] = [];
  if (config.imageCount <= beats.length) {
    // Evenly space
    const step = beats.length / config.imageCount;
    for (let i = 0; i < config.imageCount; i++) {
      selectedBeats.push(beats[Math.min(Math.floor(i * step), beats.length - 1)]);
    }
  } else {
    // Repeat beats with variations
    selectedBeats = [...beats];
    let extra = config.imageCount - beats.length;
    let idx = 0;
    while (extra > 0) {
      selectedBeats.push(beats[idx % beats.length]);
      idx++;
      extra--;
    }
  }

  const productBlock = buildProductConsistencyBlock(config.productDNA);
  const categoryInstruction = getCategoryPromptInstruction(config.productDNA);

  return selectedBeats.map((beat, i) => {
    const spec = shotTable[i % shotTable.length];
    const shotLabel = beat.label;
    const storyRole = beat.storyRole;

    const shotDetails = `Shot composition: ${spec.distance}, ${spec.angle} angle, ${spec.lens} lens.
Expression: ${spec.expression}.
Product interaction: ${spec.interaction}.
Narrative moment: ${beat.description}`;

    const prompt = [
      realism,
      realismMod,
      "",
      productBlock,
      "",
      categoryInstruction,
      "",
      `Character: ${config.characterDescription}. ${INDONESIAN_SKIN}.`,
      "",
      `Environment: ${config.environment.description || config.environment.label}`,
      "",
      shotDetails,
      "",
      beat.constraints?.noProductUsage
        ? "CONSTRAINT: Product must NOT be shown being used in this shot."
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      shotIndex: i,
      shotLabel,
      storyRole,
      distance: spec.distance,
      angle: spec.angle,
      lens: spec.lens,
      expression: spec.expression,
      productInteraction: spec.interaction,
      prompt,
    };
  });
}

// ── Cost Estimation ─────────────────────────────────────────────
const COST_PER_IMAGE: Record<ImageModel, number> = {
  "nano-banana": 310,
  "nano-banana-2": 620,
  "nano-banana-pro": 1400,
};

export function estimateCost(model: ImageModel, count: number): number {
  return COST_PER_IMAGE[model] * count;
}

export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}
