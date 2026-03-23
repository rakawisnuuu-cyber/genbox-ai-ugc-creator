/**
 * Video Prompt Engine v2 — Beat-Based Story System for Talking Head
 * Motion prompts with category-aware presets.
 * Model-specific formats for Veo 3.1, Kling 3.0, and Grok.
 */

export type VideoModelType = "grok" | "kling_std" | "kling_pro" | "veo_fast" | "veo_quality";

// ── Motion Prompt (unchanged API) ─────────────────────────────────

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
}

const SAFETY_PREFIX = "Casual product review video by a content creator for social media. ";

function getVeoPrompt(p: MotionPromptParams): string {
  const skin = p.skinTone || "natural Indonesian";
  const expr = p.expression || "natural";
  const dial = p.dialogue || "";
  const dialSuffix = dial ? ` The creator says, "${dial}" in a natural tone.` : "";

  const templates: Record<string, string> = {
    hook: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} reacts with ${expr} while picking up a ${p.productColor} ${p.productPackaging} of ${p.product}. The camera starts close on the face and slowly pulls back about 0.3 meters, revealing the product in hand. The expression shifts gradually from curiosity to surprise.${dialSuffix}`,
    problem: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} shows a ${expr} while examining a problem area and lightly touching it. The ${p.product} remains nearby in frame. The camera uses a gentle handheld drift with about 0.2 meters of movement.${dialSuffix}`,
    demo: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} demonstrates ${p.product} by ${p.productInteraction || "opening and applying it carefully"}, opening the ${p.productPackaging} and applying it carefully. The camera holds a medium shot and slowly pushes in about 0.4 meters, capturing both face and hands. The expression becomes ${expr}.${dialSuffix}`,
    result: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} reacts with ${expr} after using ${p.product}, gently touching the result area and giving a slow approving nod. The camera moves into a close-up with a subtle push-in of about 0.3 meters.${dialSuffix}`,
    cta: `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} faces the camera with a warm ${expr}, holding a ${p.productColor} ${p.productPackaging} of ${p.product} toward the lens. The camera performs a slow push-in of about 0.3 meters. The creator maintains eye contact.${dialSuffix}`,
  };

  return templates[p.beat] || templates.demo;
}

function getKlingPrompt(p: MotionPromptParams): string {
  const skin = p.skinTone || "natural Indonesian";
  const expr = p.expression || "natural";

  const cameraMap: Record<string, string> = {
    hook: "Close-up, slightly above eye level, slow push-in 0.3m",
    problem: "Medium close-up, eye level, gentle handheld drift",
    demo: "Medium shot, eye level, slow push-in 0.4m on hands",
    result: "Close-up, eye level, subtle push-in 0.3m on face",
    cta: "Medium close-up, eye level, slow push-in on product",
  };

  const timelineMap: Record<string, string> = {
    hook: `0s-2s: Picks up ${p.product} with curious expression\n  2s-4s: Examines product, expression shifts to surprise`,
    problem: `0s-2s: Touches problem area with frustrated expression\n  2s-4s: Sighs, notices ${p.product} nearby`,
    demo: `0s-2s: Opens ${p.productPackaging}, begins applying\n  2s-4s: Focused application, hands active on product`,
    result: `0s-2s: Touches result area with surprise\n  2s-4s: Slow approving nod, satisfied smile`,
    cta: `0s-2s: Holds ${p.product} toward camera\n  2s-4s: Warm smile, confident eye contact`,
  };

  return `Scene Setup: ${p.environment}, natural indoor lighting
Character: ${p.character}, ${skin}, ${expr}
Product: ${p.product}, ${p.productColor}, ${p.productPackaging}
Camera: ${cameraMap[p.beat] || cameraMap.demo}
Timeline:
  ${timelineMap[p.beat] || timelineMap.demo}
Stability: Same person, same product, same environment.`;
}

function getGrokPrompt(p: MotionPromptParams): string {
  const skin = p.skinTone || "natural Indonesian";
  const expr = p.expression || "natural";

  const templates: Record<string, string> = {
    hook: `A ${p.character} with ${skin} skin picks up a ${p.productColor} ${p.productPackaging} of ${p.product} in ${p.environment}. Expression shifts from curiosity to surprise as they examine it. Camera slowly pulls back revealing the product in hand.`,
    problem: `A ${p.character} with ${skin} skin in ${p.environment} looks ${expr} while touching a problem area. The ${p.product} sits nearby on a surface. Gentle camera drift captures the frustrated moment.`,
    demo: `A ${p.character} with ${skin} skin in ${p.environment} opens and applies ${p.product} with focused ${expr}. Hands move deliberately, camera stays steady on the demonstration.`,
    result: `A ${p.character} with ${skin} skin in ${p.environment} reacts with ${expr} after using ${p.product}. Touches result area approvingly, slow satisfied nod. Camera pushes in slightly.`,
    cta: `A ${p.character} with ${skin} skin in ${p.environment} holds ${p.product} toward camera with ${expr}. Confident eye contact, warm smile, slight lean forward.`,
  };

  return templates[p.beat] || templates.demo;
}

export function getMotionPrompt(params: MotionPromptParams): string {
  const isVeo = params.model === "veo_fast" || params.model === "veo_quality";
  const isKling = params.model === "kling_std" || params.model === "kling_pro";

  if (isVeo) return getVeoPrompt(params);
  if (isKling) return getKlingPrompt(params);
  return getGrokPrompt(params);
}

// ── Motion Style Presets (NEW) ──────────────────────────────────
export type MotionStyleKey = "natural_review" | "asmr_texture" | "reveal_drama" | "first_use" | "lifestyle_candid";

export interface MotionStylePreset {
  key: MotionStyleKey;
  name: string;
  description: string;
  categories: string[]; // which categories this fits best
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
      const skin = p.skinTone || "natural Indonesian";
      return `${SAFETY_PREFIX}Extreme close-up shot. A ${p.character} with ${skin} skin slowly opens the ${p.productPackaging} of ${p.product}. Hands move deliberately and gently. Camera holds tight on the product as it's manipulated — ${p.productInteraction || "opening lid, revealing texture inside"}. Soft ambient sound emphasis. Minimal face visible, focus on hands and product. Slow, satisfying, ASMR energy.`;
    },
  },
  {
    key: "reveal_drama",
    name: "Dramatic Reveal",
    description: "Product rises into frame — low angle dramatic entrance",
    categories: ["electronics", "fashion", "home"],
    buildPrompt: (p) => {
      const skin = p.skinTone || "natural Indonesian";
      return `${SAFETY_PREFIX}Low angle shot from table height. A ${p.character} with ${skin} skin slowly lifts ${p.product} from below frame into the light. The ${p.productColor} ${p.productPackaging} catches the light as it rises. Camera stays low and steady, creating a dramatic reveal. Expression shifts from neutral to impressed as the product comes fully into view.`;
    },
  },
  {
    key: "first_use",
    name: "First Use Reaction",
    description: "Opening/using for first time — genuine discovery moment",
    categories: ["skincare", "food", "electronics", "health"],
    buildPrompt: (p) => {
      const skin = p.skinTone || "natural Indonesian";
      return `${SAFETY_PREFIX}A ${p.character} with ${skin} skin in ${p.environment} opens ${p.product} for the first time. Curious expression as they examine it. Then begins ${p.productInteraction || "using it carefully"}. Expression shifts from curiosity to pleasant surprise. Camera holds medium-close with gentle handheld drift. Natural, spontaneous energy.`;
    },
  },
  {
    key: "lifestyle_candid",
    name: "Lifestyle Candid",
    description: "Natural daily-life usage — caught in the moment",
    categories: ["fashion", "food", "home"],
    buildPrompt: (p) => {
      const skin = p.skinTone || "natural Indonesian";
      return `${SAFETY_PREFIX}A ${p.character} with ${skin} skin casually uses ${p.product} in ${p.environment}. Relaxed, natural movement — not performing for camera. Camera observes from medium distance with gentle drift. The moment feels caught, not staged. ${p.product} is naturally integrated into the scene.`;
    },
  },
];

export function getMotionPresetsForCategory(category: string): MotionStylePreset[] {
  return MOTION_STYLE_PRESETS.filter((p) => p.categories.includes("all") || p.categories.includes(category));
}

// ── Talking Head Beat System (NEW) ──────────────────────────────

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
    motion:
      "hands gesturing empty (no product yet), touching problem area, expressive head movements, slight lean toward camera",
    camera: "tight face close-up, slight handheld shake, 30cm distance, selfie angle",
    productVisibility: "NOT visible yet — or barely visible at edge of frame",
    dialogueTone: "Conversational complaint, rhetorical question",
    defaultDialogueId: (_p, _h) => "Guys, jujur ya... capek gak sih sama masalah ini?",
  },
  {
    key: "relatable",
    name: "Make It Relatable",
    nameId: "Relatable",
    description: "Escalate frustration — wasted money, failed attempts, shared experience",
    energy: "escalating frustration, 'been there done that' vibe, knowing eye roll",
    motion: "counting on fingers, shaking head, eye roll, hand waving dismissively, shifting posture",
    camera: "pulls back slightly to medium-close, gentle handheld sway, more body visible",
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
    energy: "pause, soften, anticipation, 'but wait' moment",
    motion: "slows down, leans in slightly, reaches toward something off-frame, finger up in 'wait' gesture",
    camera: "holds steady, creates tension, slight push-in 0.2m",
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
    motion:
      "picks up product with one hand, holds toward camera at chest level, points at specific feature with other hand, rotates to show label",
    camera: "push-in on product, then back to face, medium shot, stable",
    productVisibility: "HERO MOMENT — front and center, label visible, well-lit, dominant in frame",
    dialogueTone: "Enthusiastic feature callout",
    defaultDialogueId: (p, h) => h || `Ini nih, ${p}! Yang bikin beda tuh formulanya...`,
  },
  {
    key: "social_proof",
    name: "Social Proof / Urgency",
    nameId: "Social Proof",
    description: "Build trust — reviews, sold out history, visible results",
    energy: "convincing, testimonial energy, nodding while talking",
    motion: "nods while holding product, maybe shows result on face/skin/area, one hand gestures for emphasis",
    camera: "medium shot, stable, trust-building framing, eye-level",
    productVisibility: "still visible but secondary to face/result demonstration",
    dialogueTone: "Proof and credibility",
    defaultDialogueId: (p, _h) => `Review-nya udah 4.9 guys, ${p} ini sold out 3x bulan lalu... bukan kaleng-kaleng`,
  },
  {
    key: "cta",
    name: "Call to Action",
    nameId: "CTA",
    description: "Warm direct push — link in bio, limited stock, go get it",
    energy: "warm, direct, friendly push, leaning in",
    motion: "holds product toward camera with both hands, points at it, slight lean forward, nods encouragingly",
    camera: "slow push-in 0.3m, intimate close-up, stable",
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
  // Find the closest config
  const keys = Object.keys(BEAT_CONFIGS)
    .map(Number)
    .sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) => (Math.abs(curr - seconds) < Math.abs(prev - seconds) ? curr : prev));
  return BEAT_CONFIGS[closest] || BEAT_CONFIGS[8];
}

export function getBeatDefinition(key: TalkingHeadBeatKey): TalkingHeadBeat {
  return TALKING_HEAD_BEATS.find((b) => b.key === key)!;
}

// ── Talking Head Tech Specs (constant block) ───────────────────────
const TALKING_HEAD_TECH_SPECS = `TECHNICAL SPECIFICATIONS:
- Audio: direct casual talking to camera, natural conversational Indonesian
- No text overlay, subtitles, logos, or watermarks anywhere in the video
- Natural body motion — slight sway, hand gestures, head movement
- Single continuous shot per segment
- Same person, same environment, same lighting throughout
- Product must remain physically consistent (same color, shape, label)`;

// ── Build Talking Head Prompts (NEW API) ─────────────────────────

export interface TalkingHeadConfig {
  character: string;
  product: string;
  productColor: string;
  productPackaging: string;
  environment: string;
  skinTone?: string;
  duration: number; // total seconds
  beatDialogues: Record<TalkingHeadBeatKey, string>; // user-editable dialogue per beat
  productInteraction?: string;
}

export function buildTalkingHeadPrompts(config: TalkingHeadConfig): {
  beats: TalkingHeadBeatKey[];
  prompts: string[];
} {
  const skin = config.skinTone || "natural Indonesian";
  const beats = getBeatsForDuration(config.duration);
  const secondsPerBeat = 8; // each beat = 1 Veo segment

  const prompts = beats.map((beatKey, idx) => {
    const beat = getBeatDefinition(beatKey);
    const dialogue = config.beatDialogues[beatKey] || beat.defaultDialogueId(config.product, "");

    const isFirstBeat = idx === 0;
    const continuity = !isFirstBeat
      ? `CONTINUITY: Continue from previous segment. Same person, same environment, same lighting. The scene flows naturally.`
      : "";

    return `${SAFETY_PREFIX}

BEAT: ${beat.name} (${beat.description})
ENERGY: ${beat.energy}

CHARACTER: ${config.character}, ${skin} skin tone.
PRODUCT: ${config.product}, ${config.productColor} ${config.productPackaging}.
ENVIRONMENT: ${config.environment}

MOTION: ${beat.motion}
CAMERA: ${beat.camera}
PRODUCT VISIBILITY: ${beat.productVisibility}

DIALOGUE (spoken in casual Indonesian):
"${dialogue}"

${TALKING_HEAD_TECH_SPECS}

${continuity}`.trim();
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
  // Map legacy dialogueSegments to beat dialogues
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
