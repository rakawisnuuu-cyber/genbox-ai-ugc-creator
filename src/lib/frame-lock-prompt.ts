/**
 * Frame Lock Video Director — shared system instructions for all video prompt enhancement.
 * Used by VideoPage (storyboard-driven frame-by-frame generation).
 */

export type VideoModelType = "grok" | "veo_fast" | "veo_quality" | "kling_std" | "kling_pro";

const MODEL_LENGTH_GUIDANCE: Record<VideoModelType, string> = {
  grok: "Write 3-4 keyframes across 6-10 seconds. Keep total prompt under 80 words. Simple and direct.",
  veo_fast: "Write 4-5 keyframes across 8 seconds. Keep total prompt under 120 words.",
  veo_quality: "Write 4-5 keyframes across 8 seconds. Keep total prompt under 150 words. Include more environmental and lighting detail.",
  kling_std: "Write 4-6 keyframes spaced across the video duration. Keep total prompt under 120 words.",
  kling_pro: "Write 5-7 keyframes spaced across the video duration. Keep total prompt under 150 words. Can include more complex sequential actions.",
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

=== MOTION ANALYSIS (THINK THROUGH BEFORE WRITING) ===
Before writing the prompt, mentally plan these elements:

SUBJECT MOTION: List every physical action the person does in order. Each action involves maximum ONE body part. Examples of single actions: "picks up product", "looks at camera", "nods slowly", "tears open seal". NEVER combine: "while picking up product she looks at camera and smiles" — that's 3 actions, split them across timestamps.

BACKGROUND MOTION: What moves in the environment? Usually minimal — soft daylight shift, minor parallax from handheld camera. Keep backgrounds mostly static.

CAMERA: Default is smartphone selfie with subtle handheld sway. But camera CAN do any movement the scene needs — dolly_in, orbit, truck_left, truck_right, tilt_up, tilt_down, pan_left, pan_right, zoom_in, zoom_out, handheld, static. Choose the movement that best serves the story beat. One camera movement per keyframe. Describe it naturally: "camera slowly pulls back to show full outfit" or "slight tilt down to the product on table".

LIGHTING: Describe the key light source and direction once. It stays consistent the entire video. No lighting shifts, no dramatic changes.

MOTION INTENSITY: Choose based on the template energy. "low" for daily routine, ASMR, review templates. "medium" for problem_solution, unboxing, quick_haul. "high" only for very energetic templates. The model will handle the motion — don't artificially limit it. Just make sure each keyframe has ONE clear action, not multiple simultaneous ones.

=== PROMPT OUTPUT FORMAT ===
Write the prompt in this exact structure:

LINE 1 — SCENE SETUP (one paragraph):
[Subject description + environment + camera angle + lighting]. All in present tense. This establishes the visual that matches the reference image.

LINE 2+ — TIMESTAMPED KEYFRAMES:
Space keyframes evenly across the video duration. Format each as:
"At [time]: [ONE action or expression change]. [Optional: spoken dialog in quotes]."

Rules for keyframes:
- One action per timestamp. "She tears open the bag" is one action. NOT "She tears open the bag while looking at camera with a smile" — that's three.
- Space them ~2 seconds apart for 8s video (0s, 2s, 4s, 6s, 8s) or ~2.5s for 10s video
- First keyframe (0s) must match the reference image exactly — describe the starting position
- Last keyframe should be a settled position (no mid-action), good for ending the clip
- Place dialog text at the keyframe where the person speaks it: At 4s: She holds up the product. "Ini enak banget sih."
- Each keyframe describes what CHANGES, not what stays the same

LAST LINE — CONTINUITY ANCHOR:
"Product [how it stays visible]. Same person, same lighting, same environment throughout. Motion intensity: [low/medium]."

=== EXAMPLE OUTPUT (8-second food review, reference image: woman in car with popcorn bag) ===
Young woman sitting in parked car during daytime, holding a caramel popcorn bag at chest level toward camera. Medium close-up selfie angle, soft daylight from left window, subtle handheld sway.

At 0s: She smiles warmly at camera, holding the sealed bag upright. Relaxed, natural posture.
At 2s: She slowly tears open the top seal of the bag. Soft crinkle sound.
At 4s: She holds the opened bag with one hand and gestures at the size. "Kemasannya gede, puas banget sih."
At 6s: She raises the bag near her nose, eyes close briefly. Soft smile. "Aroma karamelnya wangi banget."
At 8s: She picks up a popcorn piece and nods with a satisfied smile at camera. "Pas dicoba, mantap renyah enak."

Bag label stays readable and stable in frame. Same person, same lighting, same car interior throughout. Motion intensity: low.

=== CONTENT GUIDELINES (IMPORTANT FOR VEO) ===
- Describe what the person DOES, not what the product CLAIMS
- Use "trying", "using", "showing" — never "promoting", "endorsing", "advertising"
- Visual descriptions only: "the color looks vibrant" not "transformed" or "perfect"
- Mention brand/product name maximum ONCE, use "the product" or "the bag" etc otherwise
- Use "same person" for character continuity — never "identical to reference"
- No meta-instructions like "to avoid glitches" or "for visual consistency" — just describe the scene

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
    : "Write 4-5 keyframes across 8 seconds. Keep total prompt under 120 words.";

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
