/**
 * Video Prompt Engine v4 — Scene-DNA Powered, Intent-Driven
 *
 * Changes from v3:
 * 1. Accepts optional `sceneDNA` (rich image analysis prose) — when provided,
 *    prompts use it as the visual anchor instead of generic templates.
 * 2. MANDATORY RULES appended to every prompt:
 *    - Facial Expression Guard (anti-overemotion/melotot)
 *    - Product Continuity (product must not morph/disappear)
 *    - Text Ban (zero rendered text in video)
 *    - Technical Specs (duration, shot type, camera, audio)
 * 3. Beat INTENTS instead of choreographed actions — we describe WHAT should
 *    happen, and let the AI decide natural body language.
 * 4. Talking Head prompts: rich scene anchor → beat intent → dialogue → rules
 */

export type VideoModelType = "grok" | "kling_std" | "kling_pro" | "veo_fast" | "veo_quality";

// ══════════════════════════════════════════════════════════════════
// MANDATORY RULES — appended to EVERY video prompt
// ══════════════════════════════════════════════════════════════════

const SAFETY_PREFIX = "Casual product review video by a content creator for social media. ";

function getMandatorySuffix(category?: string): string {
  const isFashion = category === "fashion";

  const productInteraction = isFashion
    ? "The product (clothing, bag, shoes, or accessories) is worn or carried naturally on the body. Show the fit, drape, texture, and movement authentically. The product must remain visually identical throughout — same color, fabric, design details, stitching, and accessories. It must NOT change shape, color, pattern, or fit during the video."
    : "One hand holds or uses the product naturally. The product must remain visually identical throughout: same shape, color, proportions, logo orientation, material appearance. The product must NOT morph, stretch, shrink, change color, or lose detail during any movement.";

  return [
    "Facial expressions must stay within natural conversational range — small smile, slight eyebrow raise at most. No wide-open mouth, no exaggerated surprise, no bug eyes, no dramatic gasps. Mouth opening during speech stays proportional and natural.",
    productInteraction,
    "Zero rendered text in the video. No text overlay, no captions, no subtitles, no watermarks, no brand text, no step numbers, no on-screen graphics. Product labels appear as visual shapes only — do NOT render readable text.",
    "Shot type: handheld selfie. Camera: front-facing perspective with subtle natural shake. The phone/camera must NEVER appear in frame.",
  ].join(" ");
}

// ══════════════════════════════════════════════════════════════════
// MOTION PROMPTS (Quick single-clip from generated image)
// ══════════════════════════════════════════════════════════════════

export interface MotionPromptParams {
  beat: string;
  model: VideoModelType;
  character: string;
  product: string;
  productColor: string;
  productPackaging: string;
  environment: string;
  skinTone?: string;
  expression?: string;
  dialogue?: string;
  productInteraction?: string;
  /** Rich scene description from SceneDNA — overrides generic template when provided */
  sceneDNA?: string;
  /** Product category for fashion-aware suffix */
  productCategory?: string;
}

// ── Beat Intents — WHAT should happen, not HOW ──

const BEAT_INTENTS: Record<string, (p: MotionPromptParams) => string> = {
  hook: (p) =>
    `Calling out a common relatable frustration about ${p.product || "the product category"}, speaking directly to camera in a casual venting tone.`,
  problem: (p) =>
    `Expressing relatable frustration — failed attempts, wasted money — while the ${p.product} remains nearby in frame.`,
  demo: (p) =>
    `Demonstrating or using the ${p.product} naturally, showing how it works or feels. The product must remain clearly visible throughout.`,
  result: (p) => `Reacting genuinely to the result after using ${p.product} — subtle satisfaction, honest impression.`,
  cta: (p) =>
    `Delivering a warm, friendly closing recommendation for ${p.product}, maintaining direct eye contact with camera.`,
};

// ── Scene-DNA powered prompt builder (all models) ──

function buildSceneDNAMotionPrompt(p: MotionPromptParams, beatIntent: string): string {
  const dial = p.dialogue || "";
  const dialLine = dial ? `\nDialogue (spoken in casual Indonesian): "${dial}"` : "";
  const duration = p.model === "grok" ? "6-10" : "8";

  return `${SAFETY_PREFIX}

REFERENCE IMAGE DESCRIPTION (the video MUST look exactly like this):
${p.sceneDNA}

The video is this exact image coming to life. The FIRST FRAME must visually match the reference image with zero deviation — same character, same outfit, same environment, same lighting, same product position, same camera angle.

WHAT HAPPENS IN THIS SEGMENT:
${beatIntent}
${dialLine}

The character's body language, gestures, and expressions should feel natural and spontaneous — like a real person casually filming themselves. Let the movement emerge naturally from the intent above.

Duration: ${duration} seconds. ${getMandatorySuffix(p.productCategory)}`.trim();
}

// ── Veo ──

function getVeoPrompt(p: MotionPromptParams): string {
  if (p.sceneDNA) {
    const intentFn = BEAT_INTENTS[p.beat] || BEAT_INTENTS.demo;
    return buildSceneDNAMotionPrompt(p, intentFn(p));
  }

  // Fallback: no sceneDNA
  const skin = p.skinTone || "natural Indonesian";
  const dial = p.dialogue || "";
  const dialSuffix = dial ? ` The creator says, "${dial}" in a natural conversational tone.` : "";

  const suffix = getMandatorySuffix(p.productCategory);
  const templates: Record<string, string> = {
    hook: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} holds a ${p.productColor} ${p.productPackaging} of ${p.product} naturally. The character begins speaking casually to camera, calling out a common relatable frustration.${dialSuffix} The character's body language should feel natural and spontaneous. Duration ~8 seconds. ${suffix}`,
    problem: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} speaks to camera expressing relatable frustration — failed attempts, wasted money. The ${p.product} remains visible nearby. Natural spontaneous body language.${dialSuffix} Duration ~8 seconds. ${suffix}`,
    demo: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} demonstrates ${p.product} naturally, showing how it works or feels — ${p.productInteraction || "examining and using it"}. The product stays clearly visible throughout. Natural body language.${dialSuffix} Duration ~8 seconds. ${suffix}`,
    result: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} reacts genuinely after using ${p.product} — subtle satisfaction, honest impression. Natural spontaneous body language.${dialSuffix} Duration ~8 seconds. ${suffix}`,
    cta: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} delivers a warm friendly closing recommendation for ${p.product}, maintaining direct eye contact with camera. Natural spontaneous energy.${dialSuffix} Duration ~8 seconds. ${suffix}`,
  };

  return templates[p.beat] || templates.demo;
}

// ── Kling ──

function getKlingPrompt(p: MotionPromptParams): string {
  if (p.sceneDNA) {
    const intentFn = BEAT_INTENTS[p.beat] || BEAT_INTENTS.demo;
    const dial = p.dialogue || "";
    const dialLine = dial ? `\nDialogue: "${dial}"` : "";
    return `Scene Setup:\n${p.sceneDNA}\n\nCamera: Handheld selfie, slight natural shake, medium shot\n\nWhat happens:\n${intentFn(p)}${dialLine}\n\nThe character's body language should feel natural and spontaneous. Let the movement emerge naturally from the intent above.\n\nStability: Same person, same product, same environment, same lighting throughout. ${getMandatorySuffix(p.productCategory)}`;
  }

  // Fallback
  const skin = p.skinTone || "natural Indonesian";
  const cameraMap: Record<string, string> = {
    hook: "Close-up, slightly above eye level, slow push-in 0.3m",
    problem: "Medium close-up, eye level, gentle handheld drift",
    demo: "Medium shot, eye level, steady with subtle handheld motion",
    result: "Close-up, eye level, subtle push-in 0.3m on face",
    cta: "Medium close-up, eye level, slow push-in on product",
  };

  const intentFn = BEAT_INTENTS[p.beat] || BEAT_INTENTS.demo;

  return `Scene Setup: ${p.environment}, natural indoor lighting
Character: ${p.character}, ${skin}
Product: ${p.product}, ${p.productColor}, ${p.productPackaging}
Camera: ${cameraMap[p.beat] || cameraMap.demo}
What happens: ${intentFn(p)}
Body language should feel natural and spontaneous.
Stability: Same person, same product, same environment. ${getMandatorySuffix(p.productCategory)}`;
}

// ── Grok ──

function getGrokPrompt(p: MotionPromptParams): string {
  if (p.sceneDNA) {
    const intentFn = BEAT_INTENTS[p.beat] || BEAT_INTENTS.demo;
    return `${p.sceneDNA}\n\n${intentFn(p)} The character's body language should feel natural and spontaneous. ${getMandatorySuffix(p.productCategory)}`;
  }

  // Fallback
  const skin = p.skinTone || "natural Indonesian";
  const intentFn = BEAT_INTENTS[p.beat] || BEAT_INTENTS.demo;

  return `A ${p.character} with ${skin} skin in ${p.environment} with ${p.productColor} ${p.productPackaging} of ${p.product}. ${intentFn(p)} Natural spontaneous body language. ${getMandatorySuffix(p.productCategory)}`;
}

export function getMotionPrompt(params: MotionPromptParams): string {
  const isVeo = params.model === "veo_fast" || params.model === "veo_quality";
  const isKling = params.model === "kling_std" || params.model === "kling_pro";

  if (isVeo) return getVeoPrompt(params);
  if (isKling) return getKlingPrompt(params);
  return getGrokPrompt(params);
}

// ══════════════════════════════════════════════════════════════════
// MOTION STYLE PRESETS
// ══════════════════════════════════════════════════════════════════

export type MotionStyleKey = "natural_review" | "asmr_texture" | "reveal_drama" | "first_use" | "lifestyle_candid";

export interface MotionStylePreset {
  key: MotionStyleKey;
  name: string;
  description: string;
  categories: string[];
  buildPrompt: (p: MotionPromptParams) => string;
}

export const MOTION_STYLE_PRESETS: MotionStylePreset[] = [
  {
    key: "natural_review",
    name: "Natural Review",
    description: "Casual pick-up and examine — classic TikTok review motion",
    categories: ["all"],
    buildPrompt: (p) => getMotionPrompt({ ...p, beat: "hook" }),
  },
  {
    key: "asmr_texture",
    name: "ASMR Texture",
    description: "Slow close-up manipulation — opening, squeezing, pouring",
    categories: ["skincare", "food", "health"],
    buildPrompt: (p) => {
      if (p.sceneDNA) {
        return buildSceneDNAMotionPrompt(
          p,
          `Slow, satisfying ASMR-style moment. Close-up on hands interacting with ${p.product} — ${p.productInteraction || "opening, revealing texture inside"}. Soft ambient sound emphasis. Deliberate, gentle movements. The focus is on tactile product interaction, not the face.`,
        );
      }
      const skin = p.skinTone || "natural Indonesian";
      return `${SAFETY_PREFIX}Extreme close-up shot. A ${p.character} with ${skin} skin slowly interacts with the ${p.productPackaging} of ${p.product} — ${p.productInteraction || "opening lid, revealing texture inside"}. Slow, deliberate, satisfying ASMR energy. Focus on hands and product. ${getMandatorySuffix(p.productCategory)}`;
    },
  },
  {
    key: "reveal_drama",
    name: "Dramatic Reveal",
    description: "Product rises into frame — low angle dramatic entrance",
    categories: ["electronics", "fashion", "home"],
    buildPrompt: (p) => {
      if (p.sceneDNA) {
        return buildSceneDNAMotionPrompt(
          p,
          `A dramatic reveal moment — the ${p.product} enters the frame from below, catching the light. The character's expression shifts subtly from neutral to mild appreciation as the product comes into full view.`,
        );
      }
      const skin = p.skinTone || "natural Indonesian";
      return `${SAFETY_PREFIX}Low angle shot from table height. A ${p.character} with ${skin} skin slowly lifts ${p.product} from below frame into the light. The ${p.productColor} ${p.productPackaging} catches the light as it rises. A dramatic reveal moment. ${getMandatorySuffix(p.productCategory)}`;
    },
  },
  {
    key: "first_use",
    name: "First Use Reaction",
    description: "Opening/using for first time — genuine discovery moment",
    categories: ["skincare", "food", "electronics", "health"],
    buildPrompt: (p) => {
      if (p.sceneDNA) {
        return buildSceneDNAMotionPrompt(
          p,
          `First time opening or using the ${p.product} — a genuine discovery moment. The character ${p.productInteraction || "opens and examines it for the first time"}, with curiosity shifting to pleasant surprise. Natural, unscripted energy.`,
        );
      }
      const skin = p.skinTone || "natural Indonesian";
      return `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} opens ${p.product} for the first time. A genuine discovery moment — curiosity shifting to pleasant surprise. Natural, unscripted energy. ${getMandatorySuffix(p.productCategory)}`;
    },
  },
  {
    key: "lifestyle_candid",
    name: "Lifestyle Candid",
    description: "Natural daily-life usage — caught in the moment",
    categories: ["fashion", "food", "home"],
    buildPrompt: (p) => {
      if (p.sceneDNA) {
        return buildSceneDNAMotionPrompt(
          p,
          `A candid daily-life moment with the ${p.product} — the character uses it naturally as part of their routine, not performing for camera. The moment feels caught, not staged. Relaxed, authentic energy.`,
        );
      }
      const skin = p.skinTone || "natural Indonesian";
      return `${SAFETY_PREFIX}A ${p.character} with ${skin} skin casually uses ${p.product} in ${p.environment}. Relaxed, natural movement — not performing for camera. The moment feels caught, not staged. ${getMandatorySuffix(p.productCategory)}`;
    },
  },
];

export function getMotionPresetsForCategory(category: string): MotionStylePreset[] {
  return MOTION_STYLE_PRESETS.filter((p) => p.categories.includes("all") || p.categories.includes(category));
}

// ══════════════════════════════════════════════════════════════════
// TALKING HEAD BEAT SYSTEM
// ══════════════════════════════════════════════════════════════════

export type TalkingHeadBeatKey = "hook" | "relatable" | "shift" | "product_reveal" | "social_proof" | "cta";

export interface TalkingHeadBeat {
  key: TalkingHeadBeatKey;
  name: string;
  nameId: string;
  description: string;
  energy: string;
  motion: string;
  camera: string;
  productVisibility: string;
  dialogueTone: string;
  defaultDialogueId: (productName: string, hook: string) => string;
}

const TALKING_HEAD_BEATS: TalkingHeadBeat[] = [
  {
    key: "hook",
    name: "Hook / Pain Point",
    nameId: "Hook",
    description: "Call out a relatable problem or pain point to grab attention",
    energy: "frustrated, relatable, casual venting",
    motion: "hands gesturing empty, touching problem area, expressive head movements, slight lean toward camera",
    camera: "tight face close-up, slight handheld shake, selfie angle",
    productVisibility: "NOT visible yet — or barely visible at edge of frame",
    dialogueTone: "Conversational complaint, rhetorical question",
    defaultDialogueId: (_p, _h) => "Guys, jujur ya... capek gak sih sama masalah ini?",
  },
  {
    key: "relatable",
    name: "Make It Relatable",
    nameId: "Relatable",
    description: "Escalate frustration — wasted money, failed attempts, shared experience",
    energy: "escalating frustration, 'been there done that' vibe",
    motion: "counting on fingers, shaking head, eye roll, hand waving dismissively",
    camera: "pulls back slightly to medium-close, gentle handheld sway",
    productVisibility: "still hidden or in background, not the focus",
    dialogueTone: "Shared frustration, listing past failures",
    defaultDialogueId: (_p, _h) =>
      "Udah coba ini itu, buang duit... yang satu bikin breakout, yang satu gak ngefek sama sekali",
  },
  {
    key: "shift",
    name: "Emotional Shift",
    nameId: "Plot Twist",
    description: "The 'but then...' moment — pace slows, anticipation builds",
    energy: "pause, soften, anticipation",
    motion: "slows down, leans in slightly, reaches toward something, finger up in 'wait' gesture",
    camera: "holds steady, slight push-in",
    productVisibility: "hand reaches toward product but doesn't fully reveal yet",
    dialogueTone: "Transitional, building suspense",
    defaultDialogueId: (_p, _h) => "Sampe akhirnya temen gue rekomendasiin sesuatu... dan honestly, game changer sih",
  },
  {
    key: "product_reveal",
    name: "Product Reveal + Feature",
    nameId: "Reveal Produk",
    description: "Pick up product, show it to camera, mention one key feature",
    energy: "excited, confident, showing off with pride",
    motion: "picks up product, holds toward camera, points at specific feature, rotates to show label",
    camera: "push-in on product, then back to face, medium shot",
    productVisibility: "HERO MOMENT — front and center, label visible, dominant in frame",
    dialogueTone: "Enthusiastic feature callout",
    defaultDialogueId: (p, h) => h || `Ini nih, ${p}! Yang bikin beda tuh formulanya...`,
  },
  {
    key: "social_proof",
    name: "Social Proof / Urgency",
    nameId: "Social Proof",
    description: "Build trust — reviews, sold out history, visible results",
    energy: "convincing, testimonial, nodding while talking",
    motion: "nods while holding product, shows result on face/skin, one hand gestures for emphasis",
    camera: "medium shot, stable, trust-building framing",
    productVisibility: "still visible but secondary to face/result",
    dialogueTone: "Proof and credibility",
    defaultDialogueId: (p, _h) => `Review-nya udah 4.9 guys, ${p} ini sold out 3x bulan lalu... bukan kaleng-kaleng`,
  },
  {
    key: "cta",
    name: "Call to Action",
    nameId: "CTA",
    description: "Warm direct push — link in bio, limited stock, go get it",
    energy: "warm, direct, friendly push",
    motion: "holds product toward camera, points at it, slight lean forward, nods encouragingly",
    camera: "slow push-in, intimate close-up",
    productVisibility: "dominant in frame, held toward camera",
    dialogueTone: "Direct friendly recommendation",
    defaultDialogueId: (p, _h) => `Langsung cek link di bio ya! ${p} ini worth it banget, sebelum habis lagi!`,
  },
];

export { TALKING_HEAD_BEATS };

// ── Beat Selection by Duration ────────────────────────────────────
const BEAT_CONFIGS: Record<number, TalkingHeadBeatKey[]> = {
  8: ["product_reveal"],
  16: ["hook", "product_reveal"],
  24: ["hook", "product_reveal", "cta"],
  32: ["hook", "shift", "product_reveal", "cta"],
  40: ["hook", "relatable", "shift", "product_reveal", "cta"],
  48: ["hook", "relatable", "shift", "product_reveal", "social_proof", "cta"],
};

export function getBeatsForDuration(seconds: number): TalkingHeadBeatKey[] {
  const keys = Object.keys(BEAT_CONFIGS)
    .map(Number)
    .sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) => (Math.abs(curr - seconds) < Math.abs(prev - seconds) ? curr : prev));
  return BEAT_CONFIGS[closest] || BEAT_CONFIGS[8];
}

export function getBeatDefinition(key: TalkingHeadBeatKey): TalkingHeadBeat {
  return TALKING_HEAD_BEATS.find((b) => b.key === key)!;
}

// ══════════════════════════════════════════════════════════════════
// TALKING HEAD NARRATIVE PROMPT BUILDER
// ══════════════════════════════════════════════════════════════════

function beatToNarrative(beat: TalkingHeadBeat, config: TalkingHeadConfig, dialogue: string, isFirst: boolean): string {
  const skin = config.skinTone || "natural Indonesian";

  // ── Scene description: rich (SceneDNA) or generic ──
  let sceneAnchor: string;
  if (config.sceneDNA) {
    sceneAnchor = isFirst
      ? `REFERENCE IMAGE DESCRIPTION (the video MUST look exactly like this):\n${config.sceneDNA}\n\nThe video is this exact image coming to life. The FIRST FRAME must visually match the reference image with zero deviation.`
      : `Continuation seamless from the previous segment. The same character, outfit, posture, and exact environment remain unchanged with identical lighting, camera angle, focus, and handheld selfie movement.`;
  } else {
    sceneAnchor = isFirst
      ? `Scene opens identical to the reference image. A ${config.character} with ${skin} skin tone is in ${config.environment}, filmed in a vertical selfie-style handheld shot.`
      : `Continuation seamless from the previous segment. The same character, outfit, posture, and exact environment remain unchanged with identical lighting, camera angle, focus, and handheld selfie movement.`;
  }

  // ── Beat INTENT — WHAT should happen, not HOW ──
  const intentMap: Record<TalkingHeadBeatKey, string> = {
    hook: `Calling out a common relatable frustration or pain point, speaking directly to camera in casual venting tone. The product is ${beat.productVisibility.includes("NOT") ? "not the focus yet" : "visible but secondary"}.`,
    relatable: `Making the frustration relatable — sharing failed attempts, wasted money, shared experience. Energy escalates naturally.`,
    shift: `The emotional shift moment — pace slows, anticipation builds, transitioning from frustration toward discovering the solution.`,
    product_reveal: `Introducing ${config.product} as the solution, highlighting one key feature naturally. This is the hero moment — the product should be front and center, clearly visible.`,
    social_proof: `Adding soft social proof — hinting at satisfaction, credibility, or urgency. The product remains visible while speaking convincingly.`,
    cta: `Delivering the closing recommendation for ${config.product} with warm, direct energy. Ending with a clear call to action.`,
  };

  const intent = intentMap[beat.key] || intentMap.product_reveal;

  const dialogueLine = dialogue ? `\nDialogue (spoken in casual Indonesian, natural pacing): "${dialogue}"` : "";

  return `${SAFETY_PREFIX}${sceneAnchor}

WHAT HAPPENS IN THIS SEGMENT:
${intent}
${dialogueLine}

The character's body language, gestures, and expressions should feel natural and spontaneous — like a real person casually filming themselves. Let the movement emerge naturally from the intent above.

Duration: ~8 seconds. ${MANDATORY_SUFFIX}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Build Talking Head Prompts (Main API) ─────────────────────────

export interface TalkingHeadConfig {
  character: string;
  product: string;
  productColor: string;
  productPackaging: string;
  environment: string;
  skinTone?: string;
  duration: number;
  beatDialogues: Record<TalkingHeadBeatKey, string>;
  productInteraction?: string;
  /** Rich scene description from SceneDNA — overrides generic template when provided */
  sceneDNA?: string;
}

export function buildTalkingHeadPrompts(config: TalkingHeadConfig): {
  beats: TalkingHeadBeatKey[];
  prompts: string[];
} {
  const beats = getBeatsForDuration(config.duration);

  const prompts = beats.map((beatKey, idx) => {
    const beat = getBeatDefinition(beatKey);
    const dialogue = config.beatDialogues[beatKey] || beat.defaultDialogueId(config.product, "");
    const isFirst = idx === 0;

    return beatToNarrative(beat, config, dialogue, isFirst);
  });

  return { beats, prompts };
}

// ── Legacy API (backward compat) ──────────────────────────────────
export function getTalkingHeadPrompts(params: {
  character: string;
  product: string;
  productColor: string;
  productPackaging: string;
  environment: string;
  skinTone?: string;
  expression?: string;
  dialogueSegments: string[];
  productInteraction?: string;
}): string[] {
  const duration = params.dialogueSegments.length * 8;
  const beats = getBeatsForDuration(duration);
  const beatDialogues: Record<TalkingHeadBeatKey, string> = {} as any;
  beats.forEach((beat, i) => {
    beatDialogues[beat] = params.dialogueSegments[i] || "";
  });

  const result = buildTalkingHeadPrompts({
    character: params.character,
    product: params.product,
    productColor: params.productColor,
    productPackaging: params.productPackaging,
    environment: params.environment,
    skinTone: params.skinTone,
    duration,
    beatDialogues,
    productInteraction: params.productInteraction,
  });

  return result.prompts;
}
