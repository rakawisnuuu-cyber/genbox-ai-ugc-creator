/**
 * Frame Lock Video Director — shared system instructions for all video prompt enhancement.
 * Used by VideoPage (storyboard-driven frame-by-frame generation).
 */

export type VideoModelType = "grok" | "veo_fast" | "veo_quality" | "kling_std" | "kling_pro";

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
TikTok UGC by an Indonesian content creator. Shot on smartphone, casual self-filmed feel, natural phone HDR, warm lighting, slight camera sway acceptable. Authentic and relatable — NOT a commercial or cinematic production. Real lived-in environment, not a set. 

=== CAMERA DIVERSITY (CRITICAL — ENFORCED) ===
Real TikTok UGC never repeats the same shot type. Follow this 5-shot visual pattern:

Shot 1 (Opening): selfie close-up or side profile — FACE focus
Shot 2 (Introduction): tabletop medium or product close-up — OBJECT focus
Shot 3 (Interaction): POV hands or over-shoulder — ACTION focus
Shot 4 (Reaction): reaction close-up or side shot — EMOTION focus
Shot 5 (Closing): medium hero shot or front-facing present — PROOF focus

RULES:
- NEVER use the same camera angle two frames in a row
- Product must MOVE through space across frames: off-screen → table → hands → near face → toward camera
- Each frame must show a DIFFERENT physical action — not just different expressions
- Vary camera distance: some frames tight (30 cm), some medium (80 cm), some wide (1.2 m)
- Include at least ONE POV or top-down shot in the 5 frames
- Include at least ONE shot where the product is the primary subject, not the face`;

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
    shotIndex,
    totalShots,
    duration,
    moduleType,
    previousPrompt,
    withDialogue,
    dialogueText,
    audioDirection,
    characterDescription,
    contentTemplate,
    templateStructure,
    model,
    environmentDescription,
  } = opts;

  // Flexible role-based direction — handles both legacy module types and new narrative roles
  const moduleDirections: Record<string, string> = {
    // ─── OPENING ROLES (Shot 1 pattern: FACE) ───
    hook: "HOOK — Tight close-up selfie angle from slightly below eye level, camera about 35 cm from face. Product sits blurred on table in foreground, not yet picked up. Creator leans toward camera with alert eyes and playful half-whisper energy.",
    problem:
      "PROBLEM — Medium shot from across the table, camera about 80 cm away. Creator rests chin on one hand while product sits ignored beside them. They gesture slightly with other hand in mild frustration, relatable annoyance.",
    skeptical:
      "SKEPTICAL — Over-shoulder angle looking down at product on table. Creator picks it up with two fingers, holding it away from body as if inspecting critically. Raised eyebrows and curious doubt.",
    morning:
      "MORNING — Wide shot in natural window light, camera on counter about 1.2 m away. Creator stretches slightly while reaching toward product sitting next to coffee cup. Relaxed, sleepy start-of-day energy.",
    "first look":
      "FIRST LOOK — POV shot looking down as creator lifts product toward camera with both hands. Product fills center frame about 20 cm from lens. Creator tilts it slightly, studying with quiet curiosity.",
    excitement:
      "EXCITEMENT — Handheld selfie medium close-up, camera around 40 cm away. Creator suddenly raises product beside their cheek, shaking it slightly. Eyes widen with bright contagious enthusiasm.",
    anticipation:
      "ANTICIPATION — Side profile shot from about 90 cm away. Product sits sealed on table, creator slowly reaches toward it with dramatic hesitation. Lips pressed in suspenseful anticipation.",
    before:
      "BEFORE — Wide tabletop shot with creator sitting behind table. Product remains centered on table UNTOUCHED — creator gestures around it explaining the situation. Explanatory, reflective tone. NO product usage.",
    "pov reach":
      "POV REACH — POV angle from creator's eyes, hand reaching forward toward product on table. Fingers wrap around package and pull it closer to camera. Spontaneous, curious movement.",
    setup:
      "SETUP — Tripod medium shot from slightly above table height. Creator places product upright at center of table, adjusting position with both hands. Focused, intentional, preparing the scene.",

    // ─── MID / PERSONAL ROLES (Shot 2 pattern: OBJECT) ───
    personal:
      "PERSONAL — Medium selfie shot, camera held casually about 45 cm away. Product rests in one hand at chest level, creator gestures toward themselves with other hand. Sincere, conversational tone.",
    "pain amplification":
      "PAIN — Close-up leaning toward camera, elbows on table. Product pushed slightly aside while creator gestures emphatically with both hands. Animated expression emphasizing the problem.",
    "routine start":
      "ROUTINE START — Wide shot from the side, camera about 1 m away. Creator picks product from bag or shelf and places it on table. Casual daily routine beginning.",
    routine:
      "ROUTINE — Medium shot over table, product already in hand. Creator casually interacts with it while talking, occasionally glancing at it mid-sentence. Natural, habitual motion.",
    "alasan 1":
      "ALASAN 1 — Chest-level medium close-up, product held next to face angled toward camera. Creator taps packaging with finger to emphasize the point. Confident, informative energy.",
    expectation:
      "EXPECTATION — Front-facing close-up, camera steady about 40 cm away. Creator holds product just below chin, staring at it thoughtfully. Hopeful curiosity.",
    midday:
      "MIDDAY — Wide daylight shot near window or desk. Product sits next to laptop or notebook, creator casually reaches for it mid-task. Busy but relaxed energy.",
    "product step":
      "PRODUCT STEP — Top-down tabletop shot. Creator's hands move product into center frame and rotate it slightly. Deliberate, preparing to demonstrate.",
    "first open":
      "FIRST OPEN — Tight close-up on hands, product held about 25 cm from camera. Creator grips seal with both hands and begins opening. Curious, slightly excited mood.",

    // ─── DEMO / USAGE ROLES (Shot 3 pattern: ACTION) ───
    demo: "DEMO — Medium side shot, camera about 80 cm away. Creator actively uses product, demonstrating function with both hands. Body leans slightly forward in focused explanation. Both face and product interaction clearly visible.",
    usage:
      "USAGE — Over-shoulder perspective showing creator interacting with product. Product sits between creator and camera, clearly visible. Natural, practical movements.",
    application:
      "APPLICATION — Close-up of hands, product applied or handled directly in frame. Creator performs action slowly so viewers see each step. Calm, instructional energy.",
    try: "TRY — Front selfie close-up, product brought close to mouth or face as they try it. Creator pauses briefly, eyes widening slightly. Emotion shifts from curiosity to discovery.",
    "first try":
      "FIRST TRY — Medium shot from side, camera about 70 cm away. Creator cautiously uses product while watching it closely. Curiosity mixed with mild skepticism.",
    "speed demo":
      "SPEED DEMO — Fast handheld shot, camera slightly above table. Creator quickly performs several steps with product in rapid motion. Energetic, confident movements.",
    "step 1":
      "STEP 1 — Top-down shot, product placed neatly at center. Creator's hands enter frame and start first step clearly. Controlled, instructional pacing.",
    "step 2":
      "STEP 2 — Angle shifts to side medium shot. Creator continues process with product closer to chest level. Body leans forward to focus on task.",
    "product moment":
      "PRODUCT MOMENT — Hero-style close-up, product held directly toward camera about 15 cm away. Creator rotates it slowly so front label is clear. Proud, enthusiastic.",
    "pov inspect":
      "POV INSPECT — POV camera angle, creator's hands turning product slowly. Fingers trace along packaging or features. Curious, exploratory movement.",
    "pov use":
      "POV USE — POV shot, product used directly in front of lens. Creator's hands perform action naturally. Immersive, personal feel.",
    texture:
      "TEXTURE — Extreme close-up macro shot. Creator breaks or opens product slightly to reveal texture. Hand gently moves it closer to lens. ASMR energy.",
    sensory:
      "SENSORY — Close-up reaction shot, product near nose or mouth. Creator inhales slightly or reacts to smell/taste. Eyes soften with sensory appreciation.",
    "slow reveal":
      "SLOW REVEAL — Low angle shot from table height. Creator slowly lifts product from below frame into the light. Dramatic, deliberate motion.",
    showcase:
      "SHOWCASE — Clean medium shot, product placed upright center of table. Creator frames it with both hands like presenting to viewers. Confident, promotional energy.",

    // ─── RESULT / REACTION ROLES (Shot 4 pattern: REACTION) ───
    result:
      "RESULT — Medium close-up selfie, product held beside face. Creator nods slowly while smiling. Satisfied approval expression.",
    reaction:
      "REACTION — Tight reaction close-up, camera about 30 cm away. Creator pauses mid-use and looks surprised. Product remains visible in one hand near chin.",
    "after reveal":
      "AFTER REVEAL — Medium shot, product placed back on table. Creator leans back slightly while gesturing toward it. Impressed reflection.",
    reality:
      "REALITY — Casual side shot, product resting naturally on table. Creator shrugs lightly, explaining honest impression. Calm, realistic tone.",
    impressed:
      "IMPRESSED — Close-up angled slightly from below. Creator raises product toward camera while nodding enthusiastically. Genuine, excited smile.",
    assessment:
      "ASSESSMENT — Medium seated shot, product placed between both hands on table. Creator gestures thoughtfully while evaluating. Analytical but positive.",
    "alasan 2":
      "ALASAN 2 — Medium close-up, product tilted toward camera. Creator taps a specific feature or label with finger. Confident, persuasive.",
    "alasan 3":
      "ALASAN 3 — Side shot, creator holds product slightly outward. They gesture with other hand to emphasize another benefit. Explanatory, convincing energy.",
    benefit:
      "BENEFIT — Front medium shot, creator lifts product higher in frame. Body leans slightly forward explaining usefulness. Upbeat, confident.",
    discovery:
      "DISCOVERY — POV shot, creator looks down at product then back to camera. They point to something on packaging excitedly. Small discovery moment.",
    "pov result":
      "POV RESULT — POV camera angle, creator holds finished result in hands. They tilt it slightly to show clearly. Proud, satisfying movement.",
    "initial result":
      "INITIAL RESULT — Medium reaction shot, creator looks at product after trying it. Expression softens into pleased smile. Product near chest level.",
    enjoyment:
      "ENJOYMENT — Relaxed medium shot, creator casually continues using product. They lean back slightly while smiling comfortably. Natural enjoyment vibe.",
    "almost ready":
      "ALMOST READY — Top-down tabletop shot, creator finishes final step. Product sits center frame, hands adjust neatly. Anticipation building.",

    // ─── CLOSING ROLES (Shot 5 pattern: PROOF) ───
    cta: "CTA — Front-facing medium close-up, product held directly toward camera. Creator points at it with free hand. Enthusiastic, inviting tone.",
    "soft cta":
      "SOFT CTA — Relaxed selfie angle, camera about 45 cm away. Creator holds product loosely near shoulder while smiling gently. Friendly, low-pressure recommendation.",
    confidence:
      "CONFIDENCE — Medium shot from slightly below, creator sits upright. Product rests confidently in hand at chest level. Posture communicates certainty.",
    converted:
      "CONVERTED — Casual side shot, creator adds product to bag or places it beside them. They nod approvingly to camera. Satisfied commitment.",
    verdict:
      "VERDICT — Centered medium shot, product placed upright on table. Creator gestures toward it with both hands delivering conclusion. Decisive expression.",
    summary:
      "SUMMARY — Medium close-up, creator counts points on fingers while holding product. Camera steady and clear. Concise, informative.",
    "show off":
      "SHOW OFF — Dynamic handheld shot, creator holds product up high and rotates slightly. Camera moves subtly. Energetic, celebratory vibe.",
    ready:
      "READY — Wide shot, creator grabs product from table and stands slightly. Motion feels like about to leave with it. Practical, prepared energy.",
    evening:
      "EVENING — Soft lighting wide shot, product beside lamp or cozy setting. Creator leans comfortably holding it casually. Calm, satisfied mood.",
    "wrap up":
      "WRAP UP — Front medium shot, creator places product down on table gently. They look back to camera with final smile. Complete, relaxed tone.",
    "face reveal":
      "FACE REVEAL — Start with product covering face in close-up. Creator lowers it slowly to reveal a smile. Playful, engaging moment.",
    serene:
      "SERENE — Side profile shot, creator calmly holds product while looking out window. Minimal movement, relaxed. Peaceful satisfaction.",
    introduce:
      "INTRODUCE — Medium shot, creator lifts product into frame from below camera. They hold steady and present clearly. Welcoming, confident.",
    reveal:
      "REVEAL — Low angle shot from table height, product rises slowly into frame in creator's hand. Creator smiles knowingly at camera. Dramatic, satisfying.",
  };

  const moduleDir =
    moduleDirections[moduleType.toLowerCase()] ||
    `${moduleType} shot — follow the narrative direction naturally. Match the emotional tone of this story beat.`;

  const dialogueSection =
    withDialogue && dialogueText
      ? `\n\nInclude natural spoken dialogue: "${dialogueText}"\nAudio direction: ${audioDirection || "natural ambient"}`
      : `\nNo dialogue. Audio: ${audioDirection || "ambient sounds only"}`;

  const continuitySection =
    shotIndex > 0 && previousPrompt
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

  const charSection = characterDescription ? `\nCharacter: ${characterDescription}` : "";

  const envSection = environmentDescription
    ? `\n\n=== ENVIRONMENT ANCHOR (DO NOT CHANGE) ===\n${environmentDescription}\nThis environment description MUST be maintained exactly across all frames. No reinterpretation allowed.`
    : "";

  const templateSection =
    contentTemplate && templateStructure
      ? `\n\n=== CONTENT TEMPLATE: ${contentTemplate.toUpperCase()} ===\n${templateStructure}\nCreate ONE continuous flowing scene covering this full narrative arc. No separate shots or cuts.`
      : "";

  return `${FRAME_LOCK_SYSTEM}

=== PROMPT QUALITY ===
Write the best possible cinematic video prompt. Space keyframes evenly across the video duration (~2s apart). Focus on vivid, specific visual details — subject action, camera movement, lighting, mood, environment. Be detailed but avoid filler words.

=== SHOT CONTEXT ===
Shot #${shotIndex + 1} of ${totalShots}. Duration: ${duration}s.
${moduleDir}${charSection}${envSection}${continuitySection}${dialogueSection}${templateSection}`;
}
