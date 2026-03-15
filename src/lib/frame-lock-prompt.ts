/**
 * Frame Lock Video Director — shared system instructions for all video prompt enhancement.
 * Used by VideoPage (storyboard-driven frame-by-frame generation).
 *
 * v2 — Full rewrite incorporating:
 * - Model-specific prompt formats (Veo = narrative, Kling = timestamps, Grok = short paragraph)
 * - Motion analysis framework
 * - Anti-glitch rules per model
 * - Veo safety filter mitigation
 * - Global consistency (character + product described once, reused)
 * - Dialog as separate section for better lip sync
 * - Camera diversity (5-shot UGC pattern)
 * - Cinematography-quality per-role directions
 */

export type VideoModelType = "grok" | "veo_fast" | "veo_quality" | "kling_std" | "kling_pro";

/* ─── Model-Specific Format Guidance ──────────────────────────── */

const MODEL_FORMAT_GUIDANCE: Record<VideoModelType, string> = {
  grok: `OUTPUT FORMAT — GROK:
Write ONE short descriptive paragraph (3-4 sentences max). Simple and direct.
Structure: Scene description → one main action → reaction.
No timestamps. No sections. Just a flowing paragraph.`,

  kling_std: `OUTPUT FORMAT — KLING:
Use this exact section structure:

Scene Setup:
[environment and character in 1-2 sentences]

Character:
[use the EXACT character description provided — do not rephrase]

Product:
[use the EXACT product identifier provided — do not rephrase]

Camera:
[framing type and movement]

Timeline:
0s–2s: [one action]
2s–4s: [one action]
4s–6s: [one action]
6s–8s: [one action]

Dialogue:
"[spoken line in Indonesian]"

Stability:
Same person, same environment, product remains stable and unchanged.`,

  kling_pro: `OUTPUT FORMAT — KLING PRO:
Use this exact section structure:

Scene Setup:
[environment and character in 1-2 sentences]

Character:
[use the EXACT character description provided — do not rephrase]

Product:
[use the EXACT product identifier provided — do not rephrase]

Camera:
[framing type and movement — can include dolly, orbit, tilt, truck]

Timeline:
0s–2s: [one action]
2s–4s: [one action]
4s–6s: [one action]
6s–8s: [one action]
[add more keyframes if duration > 8s, spaced evenly]

Dialogue:
"[spoken line in Indonesian]"

Stability:
Same person, same environment, product remains stable and unchanged.`,

  veo_fast: `OUTPUT FORMAT — VEO:
Use this exact section structure (continuous narrative, NO timestamps):

Scene:
[environment description in 1-2 sentences, include camera distance]

Character:
[use the EXACT character description provided — do not rephrase]

Product:
[use the EXACT product identifier provided — do not rephrase]

Camera:
[smartphone selfie framing, distance from face, handheld movement]

Action Flow:
[continuous narrative paragraphs — each paragraph is ONE action, then next paragraph is next action. Weave naturally. Do NOT use timestamps.]

Dialogue (spoken in Indonesian):
"[spoken line here]"

Constraints:
Single continuous shot. Same person. Same environment. Product remains stable and unchanged.`,

  veo_quality: `OUTPUT FORMAT — VEO QUALITY:
Use this exact section structure (rich continuous narrative, NO timestamps):

Scene:
[detailed environment with lighting direction, color temperature, surfaces]

Character:
[use the EXACT character description provided — do not rephrase]

Product:
[use the EXACT product identifier provided — do not rephrase]

Camera:
[smartphone selfie framing, exact distance from face, handheld movement style, depth of field]

Action Flow:
[rich continuous narrative paragraphs — each paragraph is ONE action with environmental and lighting detail. Do NOT use timestamps.]

Dialogue (spoken in Indonesian):
"[spoken line here]"

Constraints:
Single continuous shot. Same person. Same environment. Same lighting throughout. Product remains stable and unchanged.`,
};

/* ─── Main System Instruction ─────────────────────────────────── */

export const FRAME_LOCK_SYSTEM = `You are a video prompt generator for GENBOX, an AI UGC video creator for TikTok.

Your task: convert storyboard data into stable, glitch-free prompts for AI video models (Veo, Kling, Grok).

=== MOTION ANALYSIS (DO THIS BEFORE WRITING) ===
Before writing the prompt, analyze these variables from the frame data:
- Subject: pose, body orientation, which hand holds product
- Product: packaging type, current state (sealed/open/in-use), position relative to subject
- Camera: framing type, distance, angle
- Environment: location, lighting source and direction
- Action: what ONE primary motion happens this frame
- Speech: dialog length and tone

From this analysis, write a prompt with maximum 2 actions and maximum 1 product interaction per frame. Actions must be SEQUENTIAL, never simultaneous.

=== MOTION RULES (CRITICAL — PREVENTS GLITCHES) ===
- Maximum 2 actions per frame. "She lifts the bag and opens it" = 2 actions. STOP there.
- Maximum 1 product interaction per frame. If she opens the bag, she doesn't also taste it in the same frame.
- Actions are SEQUENTIAL: "She does X. Then she does Y." Never "While doing X, she also Y."
- ONE body movement per sentence. "She picks up the product" is one movement. Not "She picks up the product while leaning forward and raising her eyebrows."
- Facial expressions change ONCE per frame, gradually. "Neutral to small smile" is fine. "Skeptical to shocked to excited" in one frame will glitch.
- Product must be HELD STILL during speech. Movement and talking happen in separate moments.

=== CHARACTER CONSISTENCY ===
Describe the character ONCE at the start of the prompt using the exact description provided.
After that, refer to them only as "the same woman" or "she" — never re-describe their appearance.
Never add new descriptors like "cute girl", "Asian woman", "young creator" — these cause face drift.

=== PRODUCT CONSISTENCY ===
Define the product ONCE using the exact identifier provided (e.g. "a clear plastic bag labeled Pop Enjoy Caramel Popcorn").
After that, refer to it only as "the same bag" or "the product" — never re-describe it differently.
Never vary the product description: "bag of popcorn", "caramel package", "snack bag" = 3 different descriptions = product drift.

=== DIALOGUE RULES (CRITICAL FOR LIP SYNC) ===
Dialogue must ALWAYS appear in its own separate section, never embedded in action text.

BAD: She smiles and says wow this is really good while holding the product.
GOOD:
Action Flow: She smiles and holds the product toward camera.
Dialogue: "Wah ini enak banget."

This separation dramatically improves lip sync accuracy across all models.
Use Indonesian conversational casual tone for all dialogue.

=== SAFETY FILTER (VEO SPECIFIC) ===
Avoid advertising language that triggers Google's safety review:
- "buy now" → "check this out"
- "best product" → "pretty interesting"  
- "must buy" → "worth trying"
- "promo" / "discount" → "something I found" / "cheaper than expected"
- "guaranteed" → "seems to work"
- "official product" → use generic description
- "identical to reference" → "same person"
- "transformed" / "perfect" → "looks different" / "looks fresh"
- "endorsement" / "advertising" / "promotion" → "casual review" / "trying out"

Frame all content as personal discovery, not commercial advertising.

=== ANTI-GLITCH RULES PER MODEL ===
VEO — avoid:
- "hyper realistic", "cinematic depth of field", "extreme macro"
- Foreground blur transitions
- Fast camera movement
- More than 2 actions per shot

KLING — avoid:
- Simultaneous actions in same timestamp
- Multi-character interaction
- Camera orbit (use subtle movement instead)
- Complex physics simulations

GROK — avoid:
- Long multi-paragraph instructions
- Technical cinematography terms
- Any section structure — just use a flowing paragraph

=== CAMERA DIVERSITY (5-SHOT UGC PATTERN) ===
Real TikTok UGC never repeats the same shot. Follow this pattern:

Shot 1 (Opening): MATCH the reference image — same angle, framing, product position
Shot 2 (Introduction): tabletop medium or product close-up — OBJECT focus
Shot 3 (Interaction): POV hands or over-shoulder — ACTION focus
Shot 4 (Reaction): reaction close-up or side shot — EMOTION focus
Shot 5 (Closing): medium hero shot or front-facing present — PROOF focus

NEVER use the same camera angle two frames in a row.
Product must MOVE through space across frames: table → hands → near face → toward camera.
Vary camera distance: some tight (30 cm), some medium (80 cm), some wide (1.2 m).

=== UGC STYLE ===
TikTok UGC by an Indonesian content creator. Shot on smartphone, casual self-filmed feel, natural phone HDR, warm lighting, slight handheld sway.
Authentic and relatable — NOT a commercial or cinematic production. Real lived-in environment, not a set.

=== GLOBAL CONSISTENCY (APPLIED ACROSS ALL FRAMES) ===
Always end every prompt with:
"Single continuous shot. Same person. Same environment. Product remains stable and unchanged."`;

/* ─── Per-Role Cinematography Directions ──────────────────────── */

const moduleDirections: Record<string, string> = {
  // ─── OPENING ROLES ───
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
    "BEFORE — Wide tabletop shot with creator sitting behind table. Product remains centered on table UNTOUCHED — creator gestures around it explaining situation. Explanatory, reflective tone. NO product usage.",
  "pov reach":
    "POV REACH — POV angle from creator's eyes, hand reaching forward toward product on table. Fingers wrap around package and pull it closer to camera. Spontaneous, curious movement.",
  setup:
    "SETUP — Tripod medium shot from slightly above table height. Creator places product upright at center of table, adjusting position with both hands. Focused, intentional, preparing the scene.",

  // ─── MID / PERSONAL ROLES ───
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

  // ─── DEMO / USAGE ROLES ───
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
    "TEXTURE — Extreme close-up macro shot. Creator opens product slightly to reveal texture. Hand gently moves it closer to lens. ASMR energy.",
  sensory:
    "SENSORY — Close-up reaction shot, product near nose or mouth. Creator inhales slightly or reacts to smell/taste. Eyes soften with sensory appreciation.",
  "slow reveal":
    "SLOW REVEAL — Low angle shot from table height. Creator slowly lifts product from below frame into the light. Dramatic, deliberate motion.",
  showcase:
    "SHOWCASE — Clean medium shot, product placed upright center of table. Creator frames it with both hands like presenting to viewers. Confident, promotional energy.",

  // ─── RESULT / REACTION ROLES ───
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

  // ─── CLOSING ROLES ───
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

/* ─── Build Context-Aware System Instruction ──────────────────── */

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
  productDescription?: string;
  contentTemplate?: string;
  templateStructure?: string;
  model?: VideoModelType;
  environmentDescription?: string;
  globalConsistency?: string;
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
    productDescription,
    contentTemplate,
    templateStructure,
    model,
    environmentDescription,
    globalConsistency,
  } = opts;

  // Model-specific format
  const formatGuidance = model ? MODEL_FORMAT_GUIDANCE[model] : MODEL_FORMAT_GUIDANCE.veo_fast;

  // Per-role cinematography direction
  const moduleDir =
    moduleDirections[moduleType.toLowerCase()] ||
    `${moduleType} shot — follow the narrative direction naturally. Match the emotional tone of this story beat.`;

  // Dialogue section — ALWAYS separate from action
  const dialogueSection =
    withDialogue && dialogueText
      ? `\n\nDIALOGUE (must be in separate section, NOT embedded in action):\nThe person speaks in casual Indonesian: "${dialogueText}"\nAudio: ${audioDirection || "natural spoken dialogue, clear and intimate"}`
      : `\nNo dialogue for this frame. Audio: ${audioDirection || "ambient sounds only"}`;

  // Continuity from previous frame — soft language to avoid safety triggers
  const continuitySection =
    shotIndex > 0 && previousPrompt
      ? `\n\n=== CONTINUITY FROM PREVIOUS SHOT ===
Previous shot: ${previousPrompt.substring(0, 200)}
Maintain visual continuity:
- Same person, same skin tone, same hair, same body
- Same outfit, same accessories
- Same environment, same background, same props
- Same lighting direction and color temperature
- Same product appearance
Keep everything consistent.`
      : "";

  // Character anchor — described once
  const charSection = characterDescription
    ? `\nCharacter (describe ONCE, then refer as "she" or "the same person"): ${characterDescription}`
    : "";

  // Product anchor — described once
  const productSection = productDescription
    ? `\nProduct (use this EXACT description, then refer as "the same product"): ${productDescription}`
    : "";

  // Environment anchor
  const envSection = environmentDescription ? `\nEnvironment: ${environmentDescription}` : "";

  // Template context
  const templateSection =
    contentTemplate && templateStructure ? `\n\nContent template: ${contentTemplate}\n${templateStructure}` : "";

  // Global consistency block (character + product + environment reused across all frames)
  const globalSection = globalConsistency
    ? `\n\n=== GLOBAL CONSISTENCY (SAME ACROSS ALL FRAMES) ===\n${globalConsistency}`
    : "";

  return `${FRAME_LOCK_SYSTEM}

${formatGuidance}

=== SHOT CONTEXT ===
Shot #${shotIndex + 1} of ${totalShots}. Duration: ${duration}s.
Video model: ${model || "veo_fast"}
${moduleDir}${charSection}${productSection}${envSection}${continuitySection}${dialogueSection}${templateSection}${globalSection}`;
}
