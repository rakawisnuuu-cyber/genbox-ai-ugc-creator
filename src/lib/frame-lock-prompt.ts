/**
 * Frame Lock Video Director — shared system instructions for all video prompt enhancement.
 * Used by VideoPage (storyboard-driven frame-by-frame generation).
 */

export type VideoModelType = "grok" | "veo_fast" | "veo_quality" | "kling_std" | "kling_pro";

const MODEL_LENGTH_GUIDANCE: Record<VideoModelType, string> = {
  grok: "Write 60-100 words. Focus on ONE key action sequence. Be direct.",
  kling_std: "Write 80-120 words. Include key action sequences and product interaction details.",
  kling_pro: "Write 120-180 words. Include per-beat motion detail, camera movement, and product interaction.",
  veo_fast: "Write 120-180 words. Include per-beat motion detail, camera movement, and facial expressions.",
  veo_quality: "Write 180-250 words. Full cinematic detail — second-by-second actions, specific hand movements with the product, camera pans/zooms, lighting shifts, micro-expressions, and emotional arc.",
};

export const FRAME_LOCK_SYSTEM = `You are an expert AI Video Director specializing in hyper-realistic TikTok UGC content.

=== VISUAL CONSISTENCY (MANDATORY — ZERO TOLERANCE) ===
The FIRST FRAME must visually match the reference image EXACTLY. Across the ENTIRE video, maintain:
- Character: identical face shape, skin tone, features, hairstyle, hair color, expression style, body proportions
- Outfit: exact clothing items, colors, patterns, accessories, jewelry, fit — no changes
- Environment: identical setting, background, props, surfaces, materials, wall colors, furniture — nothing added/removed
- Lighting: same direction, softness, shadow placement, color temperature — no auto-exposure shifts
- Product: identical shape, color, logo placement, proportions, material — no morphing during movement
NO visual reinterpretation is allowed. The subject, outfit, environment, and lighting MUST be identical from first frame to final frame.

=== PROMPT OUTPUT RULES ===
- Output in English. Focus on MOTION, ACTION, CAMERA MOVEMENT — describe what CHANGES, not what's static
- Include audio/dialogue direction naturally if provided
- NO brackets, placeholders, or template markers. Output ONLY the final prompt text

=== UGC STYLE ===
TikTok UGC by an Indonesian content creator. Shot on smartphone, casual self-filmed feel, natural phone HDR, warm lighting, slight camera sway acceptable. Authentic and relatable — NOT a commercial or cinematic production. Real lived-in environment, not a set.`;

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
  environmentDescription?: string;
}) {
  const {
    shotIndex, totalShots, duration, moduleType,
    previousPrompt, withDialogue, dialogueText,
    audioDirection, characterDescription,
    contentTemplate, templateStructure,
    model, environmentDescription,
  } = opts;

  const lengthGuidance = model
    ? MODEL_LENGTH_GUIDANCE[model]
    : "Write 120-180 words. Include per-beat motion detail, camera movement, and facial expressions.";

  // Flexible role-based direction — handles both legacy module types and new narrative roles
  const moduleDirections: Record<string, string> = {
    // Legacy module types
    hook: "HOOK shot — stop the scroll. High energy, dramatic first impression. Close-up face, wide eyes, sudden motion. The viewer must feel compelled to watch.",
    problem: "PROBLEM shot — show relatable frustration. Subtle head shake, sigh, looking at product with doubt. Candid, real-world energy. Build empathy.",
    demo: "DEMO shot — the money shot. Hands actively using the product. Clear, well-lit product interaction. Medium shot showing both face reaction and product usage.",
    proof: "PROOF shot — show satisfaction and results. Genuine smile, nodding, touching improved area. Before/after energy. Credibility moment.",
    cta: "CTA shot — direct eye contact with camera. Warm, confident smile. Hold product toward camera. Intimate, personal connection. Drive action.",
    convert: "CTA shot — direct eye contact with camera. Warm, confident smile. Hold product toward camera. Intimate, personal connection. Drive action.",
    transition: "TRANSITION shot — smooth scene change. Slow camera movement, product flat lay or environment establishing shot. Pace reset.",
    broll: "B-ROLL shot — supplementary lifestyle footage. Aesthetic environment, morning routine energy. No direct product focus.",
    // New flexible narrative roles
    "pain amplification": "PAIN shot — amplify the frustration. Show the real struggle, the discomfort, the 'I need a solution' energy.",
    "personal": "PERSONAL shot — sharing genuine experience. Conversational, intimate, like talking to a friend.",
    "usage": "USAGE shot — product in action. Natural, practiced use — not a demo, just real life.",
    "reaction": "REACTION shot — honest response. Micro-expressions, genuine surprise or satisfaction.",
    "soft cta": "SOFT CTA — gentle recommendation. Not pushy, just sharing what works. Friend-to-friend energy.",
    "anticipation": "ANTICIPATION — excited before the reveal. Building tension, curiosity, can't wait energy.",
    "reveal": "REVEAL — the big moment. Unwrapping, opening, first look. Eyes widen, genuine surprise.",
    "discovery": "DISCOVERY — examining something new. Curious exploration, touching, turning, learning.",
    "first try": "FIRST TRY — initial use moment. Tentative then adjusting. Real-time learning reactions.",
    "verdict": "VERDICT — final honest opinion. Direct eye contact, genuine assessment, authentic closure.",
    "before": "BEFORE shot — showing the problem state. Frustrated, disappointed. NO product visible yet.",
    "introduce": "INTRODUCE — presenting the solution. Hopeful expression, picking up product with curiosity.",
    "application": "APPLICATION — using the product carefully. Focused, deliberate motion. Process clearly shown.",
    "after reveal": "AFTER REVEAL — showing the transformation. Amazed expression, genuine surprise at results.",
    "confidence": "CONFIDENCE — transformed energy. From frustrated to radiant. Product visible, proud moment.",
    "morning": "MORNING shot — start of day energy. Soft light, stretching, peaceful routine beginning.",
    "routine": "ROUTINE — habitual product use. Comfortable, familiar, everyday natural integration.",
    "enjoyment": "ENJOYMENT — savoring the benefit. Content, peaceful, satisfied. Small genuine smile.",
    "ready": "READY — prepared for the day. Confident, energized, grabbing bag or checking mirror.",
    "texture": "TEXTURE — extreme close-up. Satisfying visual detail, ASMR energy. Fingers on product.",
    "sensory": "SENSORY — satisfying dispensing or pouring. Visual pleasure, flow, consistency visible.",
    "serene": "SERENE — calm revelation. Pull back to show peaceful, satisfied person. Dreamy energy.",
    "skeptical": "SKEPTICAL — doubtful first look. Raised eyebrow, 'hmm really?' expression. Examining claims.",
    "expectation": "EXPECTATION — pointing at promises. Exaggerated doubt, 'let's see' energy.",
    "reality": "REALITY — surprised by results. 'Wait this actually works?' Jaw drop, new respect.",
    "converted": "CONVERTED — believer moment. 'Okay I was wrong.' Holds product proudly, warm smile.",
    "setup": "SETUP — tutorial beginning. Clean surface, calm focus, 'let me show you' energy.",
    "step 1": "STEP 1 — first instruction. Clear, deliberate movement. Teaching pace.",
    "step 2": "STEP 2 — main process step. Hands active, showing correct technique.",
    "result": "RESULT — finished outcome. Step back, show what was achieved. Approving nod.",
    "wrap up": "WRAP UP — 'See? Easy!' expression. Warm smile, inviting, helpful closing energy.",
  };

  const moduleDir = moduleDirections[moduleType.toLowerCase()] || `${moduleType} shot — follow the narrative direction naturally. Match the emotional tone of this story beat.`;

  const dialogueSection = withDialogue && dialogueText
    ? `\n\nInclude natural spoken dialogue: "${dialogueText}"\nAudio direction: ${audioDirection || "natural ambient"}`
    : `\nNo dialogue. Audio: ${audioDirection || "ambient sounds only"}`;

  const continuitySection = shotIndex > 0 && previousPrompt
    ? `\n\n=== CONTINUITY FROM PREVIOUS SHOT (MANDATORY) ===
Previous shot: ${previousPrompt.substring(0, 200)}
You MUST maintain EXACT visual continuity:
- Same person with identical face, skin, hair, body proportions
- Same outfit, accessories, jewelry — no changes
- Same environment, room, background, props — no changes
- Same lighting direction, color temperature, shadow placement
- Same product appearance if visible
DO NOT reinterpret or "refresh" any visual element.`
    : "";

  const charSection = characterDescription
    ? `\nCharacter: ${characterDescription}`
    : "";

  const envSection = environmentDescription
    ? `\n\n=== ENVIRONMENT ANCHOR (DO NOT CHANGE) ===\n${environmentDescription}\nThis environment description MUST be maintained exactly across all frames. No reinterpretation allowed.`
    : "";

  const templateSection = contentTemplate && templateStructure
    ? `\n\n=== CONTENT TEMPLATE: ${contentTemplate.toUpperCase()} ===\n${templateStructure}\nCreate ONE continuous flowing scene covering this full narrative arc. No separate shots or cuts.`
    : "";

  return `${FRAME_LOCK_SYSTEM}

=== PROMPT LENGTH ===
${lengthGuidance}

=== SHOT CONTEXT ===
Shot #${shotIndex + 1} of ${totalShots}. Duration: ${duration}s.
${moduleDir}${charSection}${envSection}${continuitySection}${dialogueSection}${templateSection}`;
}
