/**
 * Motion prompt templates for converting generated images to video.
 * Model-specific formats for Veo 3.1, Kling 3.0, and Grok.
 */

export type VideoModelType = "grok" | "kling_std" | "kling_pro" | "veo_fast" | "veo_quality";

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

// ── Veo 3.1 Templates ──────────────────────────────────────────
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

// ── Kling 3.0 Templates ────────────────────────────────────────
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

// ── Grok Templates ──────────────────────────────────────────────
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

// ── Public API ──────────────────────────────────────────────────
export function getMotionPrompt(params: MotionPromptParams): string {
  const isVeo = params.model === "veo_fast" || params.model === "veo_quality";
  const isKling = params.model === "kling_std" || params.model === "kling_pro";

  if (isVeo) return getVeoPrompt(params);
  if (isKling) return getKlingPrompt(params);
  return getGrokPrompt(params);
}

// ── Talking Head Extended Prompts (Veo 3.1 only) ────────────────
export function getTalkingHeadPrompts(params: {
  character: string;
  product: string;
  productColor: string;
  productPackaging: string;
  environment: string;
  skinTone?: string;
  expression?: string;
  dialogueSegments: string[]; // 1 per 8s segment
  productInteraction?: string;
}): string[] {
  const skin = params.skinTone || "natural Indonesian";
  const expr = params.expression || "relaxed engaged";

  const templates = [
    // Initial (0-8s)
    `${SAFETY_PREFIX}A ${params.character} with ${skin} skin sits naturally in ${params.environment}, holding ${params.product} and speaking directly to camera with a ${expr} expression. The camera is a medium close-up with a gentle handheld drift of about 0.2 meters. The creator gestures slightly with the product and says, "${params.dialogueSegments[0] || ""}" in a casual, relatable tone.`,
    // Extend 1 (8-16s)
    `${SAFETY_PREFIX}Continuing from the previous moment, the ${params.character} maintains eye contact and lightly rotates the ${params.productPackaging} to show details. The camera keeps a subtle handheld drift. The expression remains engaged as they continue speaking, "${params.dialogueSegments[1] || ""}".`,
    // Extend 2 (16-24s)
    `${SAFETY_PREFIX}The ${params.character} continues the explanation, briefly demonstrating ${params.productInteraction || "the product"} with controlled hand movement. The camera maintains the same framing and motion. Their tone stays natural as they say, "${params.dialogueSegments[2] || ""}".`,
    // Extend 3 (24-32s)
    `${SAFETY_PREFIX}The ${params.character} concludes while holding the ${params.product} steadily near chest level, giving a small nod and warm smile. The camera gently pushes in about 0.2 meters. They finish with, "${params.dialogueSegments[3] || ""}".`,
  ];

  return templates.slice(0, Math.ceil(params.dialogueSegments.length));
}
