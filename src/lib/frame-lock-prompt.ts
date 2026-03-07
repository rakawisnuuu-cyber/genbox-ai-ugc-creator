/**
 * Frame Lock Video Director — shared system instructions for all video prompt enhancement.
 * Used by VideoPage (storyboard-driven frame-by-frame generation).
 */

export type VideoModelType = "grok" | "veo_fast" | "veo_quality";

const MODEL_LENGTH_GUIDANCE: Record<VideoModelType, string> = {
  grok: "Write 60-100 words. Focus on ONE key action sequence. Be direct.",
  veo_fast: "Write 120-180 words. Include per-beat motion detail, camera movement, and facial expressions.",
  veo_quality: "Write 180-250 words. Full cinematic detail — second-by-second actions, specific hand movements with the product, camera pans/zooms, lighting shifts, micro-expressions, and emotional arc.",
};

export const FRAME_LOCK_SYSTEM = `You are an expert AI Video Director specializing in hyper-realistic TikTok UGC content.

=== FRAME LOCK WITH REFERENCE IMAGE (MANDATORY) ===
The first frame of the generated video MUST visually match the reference/start image EXACTLY:
- Same character: identical face, skin tone, facial features, hairstyle, hair color
- Same outfit: exact clothing, colors, patterns, accessories, jewelry
- Same environment: identical setting, background, props, surfaces, furniture
- Same lighting: direction, softness, shadow placement, color temperature
- Same color palette, mood, and overall aesthetic
- Same product position, hand grip, orientation if product is visible
- NO visual reinterpretation allowed — the first frame IS the reference image, alive

=== FRAME STABILITY (MANDATORY) ===
- Facial structure, skin texture, body proportions MUST stay perfectly consistent across ALL frames
- No face reshaping, no skin smoothing, no hair shifts, no makeup changes during the clip
- Subject must be visually identical from frame 1 to the final frame
- Eye color, lip shape, nose structure — locked

=== PRODUCT CONTINUITY (MANDATORY) ===
- Product must remain visually identical during all movement
- Preserve exact shape, color, logo placement, proportions, material appearance
- No morphing, stretching, color shifting as hand moves or camera changes angle
- Product label/text must remain legible and stable

=== LIGHTING STABILITY (MANDATORY) ===
- No auto-exposure shifts, no white balance changes, no color temperature drift
- Lighting must feel locked to the original scene throughout the entire clip
- Shadow direction and softness remain constant

=== PROMPT OUTPUT RULES ===
- Output MUST be in English
- Focus on MOTION, ACTION, CAMERA MOVEMENT — describe what CHANGES, not what's static
- Include audio/dialogue direction naturally if provided
- NO brackets, NO placeholders, NO template markers
- Output ONLY the final prompt text, no explanation`;

/** Build context-aware system instruction for a specific shot */
export function buildVideoDirectorInstruction(opts: {
  shotIndex: number;
  totalShots: number;
  duration: number;
  moduleType: string;
  previousPrompt?: string;
  withDialogue: boolean;
  dialogueText?: string | null;
  audioDirection?: string | null;
  characterDescription?: string;
  contentTemplate?: string;
  templateStructure?: string;
  model?: VideoModelType;
}) {
  const {
    shotIndex, totalShots, duration, moduleType,
    previousPrompt, withDialogue, dialogueText,
    audioDirection, characterDescription,
    contentTemplate, templateStructure,
    model,
  } = opts;

  const lengthGuidance = model
    ? MODEL_LENGTH_GUIDANCE[model]
    : "Write 120-180 words. Include per-beat motion detail, camera movement, and facial expressions.";

  const moduleDirections: Record<string, string> = {
    hook: "HOOK shot — stop the scroll. High energy, dramatic first impression. Close-up face, wide eyes, sudden motion. The viewer must feel compelled to watch.",
    problem: "PROBLEM shot — show relatable frustration. Subtle head shake, sigh, looking at product with doubt. Candid, real-world energy. Build empathy.",
    demo: "DEMO shot — the money shot. Hands actively using the product. Clear, well-lit product interaction. Medium shot showing both face reaction and product usage.",
    proof: "PROOF shot — show satisfaction and results. Genuine smile, nodding, touching improved area. Before/after energy. Credibility moment.",
    cta: "CTA shot — direct eye contact with camera. Warm, confident smile. Hold product toward camera. Intimate, personal connection. Drive action.",
    transition: "TRANSITION shot — smooth scene change. Slow camera movement, product flat lay or environment establishing shot. Pace reset.",
    broll: "B-ROLL shot — supplementary lifestyle footage. Aesthetic environment, morning routine energy. No direct product focus.",
  };

  const moduleDir = moduleDirections[moduleType] || "Standard shot.";

  const dialogueSection = withDialogue && dialogueText
    ? `\n\nInclude natural spoken dialogue: "${dialogueText}"\nAudio direction: ${audioDirection || "natural ambient"}`
    : `\nNo dialogue. Audio: ${audioDirection || "ambient sounds only"}`;

  const continuitySection = shotIndex > 0 && previousPrompt
    ? `\nPrevious shot: ${previousPrompt.substring(0, 120)}\nMaintain EXACT visual continuity — same outfit, same appearance, same setting.`
    : "";

  const charSection = characterDescription
    ? `\nCharacter: ${characterDescription}`
    : "";

  const templateSection = contentTemplate && templateStructure
    ? `\n\n=== CONTENT TEMPLATE: ${contentTemplate.toUpperCase()} ===\n${templateStructure}\nCreate ONE continuous flowing scene covering this full narrative arc. No separate shots or cuts.`
    : "";

  return `${FRAME_LOCK_SYSTEM}

=== PROMPT LENGTH ===
${lengthGuidance}

=== SHOT CONTEXT ===
Shot #${shotIndex + 1} of ${totalShots}. Duration: ${duration}s.
${moduleDir}${charSection}${continuitySection}${dialogueSection}${templateSection}`;
}
