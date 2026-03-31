/**
 * Image Generation Engine v3 — Category-Aware Shot System + UGC Behavioral Intelligence
 * Each shot type generates UNIQUE actions per product category.
 * Integrates: UGC Behavior Logic, Affiliate Priority Rule, First-Frame Conversion Rule.
 * v3.1: Phone/selfie decontamination — no device in frame, per-shot glitch mitigation.
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
  commonMistakes: string; // per-shot AI glitch mitigation
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
    commonMistakes:
      "Do NOT show a phone or camera device in the character's hands. Do NOT render the character taking a selfie with a visible phone. Both hands should be free to interact with the product or pose naturally. Do NOT add a second copy of the product.",
    ugc: {
      camera: "front-facing camera perspective, natural slight motion feel",
      distance: "40-70cm",
      angle: "slightly high angle, looking down at subject",
      lens: "24-26mm equivalent wide angle",
      lighting: "natural window light, uneven exposure, slight highlight blowout",
      composition: "off-center, imperfect crop, slight tilt",
      expression: "casual, friendly, slightly exaggerated",
      environment: "kost room / bedroom, visible clutter",
      promptFragment:
        "front-facing camera angle, character holds product near face with both hands free, uneven daylight, off-center framing, real skin texture, casual Indonesian room. No phone visible in frame.",
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
    commonMistakes:
      "Do NOT show a person's face — this is a product-only shot. Do NOT morph the product shape or change the label text. Do NOT create a grid or multi-panel layout. Keep the product proportions accurate to real life. Do NOT add random objects that aren't described.",
    ugc: {
      camera: "close-up perspective, slightly unsteady framing",
      distance: "15-25cm",
      angle: "slightly top-down or tilted",
      lens: "24mm equivalent",
      lighting: "window light, slightly harsh, uneven shadows",
      composition: "tight crop, imperfect alignment",
      expression: "N/A — product only",
      environment: "desk, bed, or random surface",
      promptFragment:
        "close-up product shot, uneven daylight, slight blur edge, natural shadow, real surface texture. Product only — no person's face visible.",
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
    commonMistakes:
      "Do NOT show a phone or camera in the character's hands — both hands must be interacting with the product. Do NOT render the character looking at a phone screen. The product must remain the SAME product throughout — do NOT morph it into a different item. Hands must have exactly 5 fingers each.",
    ugc: {
      camera: "front-facing camera perspective, close framing",
      distance: "30-60cm",
      angle: "eye-level or slightly above",
      lens: "24mm equivalent",
      lighting: "natural daylight, uneven shadows",
      composition: "tight, slightly imperfect crop",
      expression: "focused, natural",
      environment: "bathroom, bedroom, casual space",
      promptFragment:
        "character applying/using product with both hands, natural lighting, close framing, real skin texture. No phone or device in hands.",
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
    commonMistakes:
      "Do NOT show the character holding a phone. Expression must be genuine and natural — not exaggerated or theatrical. Do NOT smooth or airbrush the skin. The product should be visible nearby but NOT the main focus. Do NOT duplicate the character or show multiple people.",
    ugc: {
      camera: "front-facing camera perspective",
      distance: "30-50cm",
      angle: "slightly low or eye-level",
      lens: "24mm equivalent",
      lighting: "soft daylight, slightly inconsistent",
      composition: "natural framing, slight crop",
      expression: "excited, impressed, relatable",
      environment: "same casual room",
      promptFragment:
        "natural smile, touching face or product area, real skin texture, casual lighting, genuine reaction. No device in hands.",
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
    commonMistakes:
      "Do NOT shrink the product too small — it must be clearly recognizable even in a wider shot. Do NOT blur the product. The environment should feel real and lived-in, not a studio. Do NOT add branded items or logos that weren't described. Character should look candid, not posed.",
    ugc: {
      camera: "wider perspective, natural framing",
      distance: "80-120cm",
      angle: "eye-level or slightly tilted",
      lens: "24mm equivalent",
      lighting: "ambient daylight, mixed sources",
      composition: "loose framing, real environment visible",
      expression: "natural, candid",
      environment: "warung, mall, bedroom, street",
      promptFragment:
        "casual daily life scene, product clearly visible in the scene, natural lighting, candid feel, real Indonesian environment. No phone visible.",
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
    commonMistakes:
      "Do NOT smooth or beautify the skin — visible pores, texture, and minor imperfections are intentional. Do NOT show hands holding a phone near the face. The product should be partially visible or recently applied, not the main subject. Do NOT over-saturate skin color. Do NOT crop out too much — at least eyes to chin should be visible.",
    ugc: {
      camera: "extreme close-up perspective",
      distance: "20-30cm",
      angle: "frontal or slight angle",
      lens: "24mm equivalent",
      lighting: "window side light, uneven exposure",
      composition: "tight crop, partial face allowed",
      expression: "raw, unfiltered, natural",
      environment: "bedroom/bathroom",
      promptFragment:
        "extreme close-up of face, visible pores, natural skin texture, uneven lighting, raw authentic feel. No device in frame.",
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
const CATEGORY_SHOT_ACTIONS: Record<ProductCategory, Record<ShotTypeKey, string>> = {
  skincare: {
    hero: "FRAMING: Medium close-up, face and product both prominent, cover photo energy.\nCharacter holds serum/cream bottle near cheek with one hand, other hand lightly touching jawline. Product label clearly visible and facing camera. Mid-sentence expression like casually reviewing for TikTok. Slight head tilt. Both hands are free — no phone.",
    product_detail:
      "FRAMING: First-person POV looking down — viewer sees character's hands holding/examining the product from their own perspective. No face visible.\nPOV shot looking down at hands holding the product. One hand holds the bottle/tube steady, other hand opens the cap or squeezes product onto fingertips. The product label faces up toward camera. Surface below (desk, palm, bed) visible. Character's lap or clothing edge visible at bottom of frame for context. Intimate, personal perspective.",
    usage:
      "FRAMING: Hands-focused medium shot, both hands actively doing something with the product.\nCharacter applying product to face with fingertips — dotting on cheeks and forehead, or spreading serum across skin. Both hands on face/product. Face and product both visible. Natural application motion captured from front.",
    reaction:
      "FRAMING: Face-dominant close-up, emotion is the subject, product secondary in background.\nCharacter just finished applying — one hand touching cheek with surprised/pleased expression, checking skin texture. Product resting on nearby surface. 'Wow it actually works' energy. No device in hands.",
    lifestyle:
      "FRAMING: Wide shot pulled back, character smaller in scene, environment tells the story.\nBathroom counter or vanity scene — product placed among other skincare items. Character in the middle of morning/night routine, relaxed and natural. Product stands out as the hero item.",
    face_closeup:
      "FRAMING: Extreme tight crop on face, eyes-to-chin only, skin texture is the subject.\nExtreme close-up of face after product application. Visible skin texture — pores, slight dewiness from product. Natural, unretouched look. One hand gently touching product-applied area.",
  },
  fashion: {
    hero: "FRAMING: Full body shot, head to toe visible, outfit is the hero — 'This is the look.'\nFull OOTD pose — character wearing the fashion item, standing confidently. Full body visible head to toe. One hand on hip or adjusting clothing, other hand relaxed at side. The fashion item is clearly the star of the image. No phone or device visible.",
    product_detail:
      "FRAMING: Extreme close-up on material — 'This is the material.'\nTight close-up of fabric texture, stitching detail, or hardware (zipper, button, strap). Character's hand touching/pinching the fabric to show quality and weight. Natural light catching the material grain. Focus on craftsmanship. No face visible.",
    usage:
      "FRAMING: Mid-body movement shot — 'This is how it moves on a body.'\nCharacter mid-motion — walking, turning, reaching, sitting down. The fashion item flows, stretches, or drapes naturally with the body movement. Shows how the fabric reacts to real movement. Not posed — caught in motion. Arms and legs active.",
    reaction:
      "FRAMING: Upper body emotional close-up — 'This is how it makes you feel.'\nCharacter looking at themselves with genuine confidence. Slight smile, shoulders back, chin slightly up. The outfit is visible but the emotion is the subject — self-assurance, pride, 'I look good' energy. Hands adjusting collar or sleeve as a confidence gesture.",
    lifestyle:
      "FRAMING: Wide environmental shot — 'This is where you wear it.'\nCharacter in a real destination wearing the outfit naturally — cafe, street, mall, park, commute. The environment matches the outfit's vibe. Character mid-activity, not posing for camera. The outfit belongs in this scene.",
    face_closeup:
      "FRAMING: Tight face + neckline crop — 'This is your identity wearing it.'\nCharacter's face and upper chest, showing how the neckline/collar/accessory frames their face. The fashion item creates a visual identity around the person. Confident, personal expression. The clothing becomes part of who they are.",
  },
  food: {
    hero: "FRAMING: Medium close-up, face and food product both prominent, appetizing energy.\nCharacter holding food/drink product with appetizing presentation. Product positioned between face and camera. Excited/hungry expression. Package or plate clearly visible and appealing. Both hands on food/drink — no device.",
    product_detail:
      "FRAMING: First-person POV looking down — viewer sees hands interacting with food/packaging from their own perspective. No face visible.\nPOV shot looking down at food product on table or in hands. One hand opens packaging, other hand ready to eat/drink. Steam, texture, condensation visible up close. The table surface and other items visible around the edges. ASMR-level food detail from personal perspective.",
    usage:
      "FRAMING: Hands-focused medium shot, hands actively eating/drinking/preparing.\nCharacter taking first bite or first sip. Mouth approaching food, chopsticks/spoon lifting food, or tilting drink. The anticipation moment. Authentic eating/drinking action.",
    reaction:
      "FRAMING: Face-dominant close-up, tasting reaction is the subject, food secondary.\nMid-chew or post-sip reaction — eyes widening, slow nod of approval, satisfied chewing expression. Product still in hand or on table. Genuine 'this is so good' face.",
    lifestyle:
      "FRAMING: Wide shot pulled back, food product in daily life context.\nProduct on cafe table or kitchen counter with lifestyle props (coffee cup, book, small plant). Character casually snacking/eating in natural context. Relaxed daily life integration.",
    face_closeup:
      "FRAMING: Extreme tight crop on face, sensory reaction is the subject.\nCharacter's face right after tasting — close-up reaction of enjoyment. Eyes closed savoring, or wide eyes surprise at flavor. Authentic sensory reaction.",
  },
  electronics: {
    hero: "FRAMING: Medium close-up, character and device both prominent, unboxing/first-impression energy.\nCharacter holding device up to camera showing screen or main feature. Clean first-impression energy. Device angled so key features visible. Impressed/curious expression. Both hands on device — no other device visible.",
    product_detail:
      "FRAMING: First-person POV looking down — viewer sees hands holding/examining device from their own perspective. No face visible.\nPOV shot looking down at device in hands. Fingers exploring buttons, ports, screen. Device fills most of the frame. Desk or lap visible below. Fingerprints on glass for realism. The 'just unboxed and inspecting' moment from personal perspective.",
    usage:
      "FRAMING: Hands-focused medium shot, hands actively operating the device.\nCharacter actively using device — typing on keyboard, wearing earbuds, using camera features. Real usage scenario showing the device integrated into workflow. Hands on the product only.",
    reaction:
      "FRAMING: Face-dominant close-up, impressed expression is the subject, device secondary.\nCharacter just discovered a cool feature — looking at device then looking toward camera with impressed nod. 'Wait this actually can do this?' energy. No second device in hands.",
    lifestyle:
      "FRAMING: Wide shot pulled back, device in work/life context, environment tells the story.\nDesk setup or on-the-go context — device naturally placed in work/life environment. Character using it as part of daily flow. WFH desk, commute, cafe table.",
    face_closeup:
      "FRAMING: Tight face crop, screen-lit expression, immersion is the subject.\nCharacter face illuminated by device screen light. Focused engaged expression. Shows the 'lost in using this device' moment. Screen glow visible on face.",
  },
  health: {
    hero: "FRAMING: Medium close-up, character and supplement both prominent, morning energy.\nCharacter holding supplement bottle/pack with morning energy expression. Glass of water nearby. Fresh-faced, motivated vibe. Product label clearly readable. Both hands free to hold product.",
    product_detail:
      "FRAMING: First-person POV looking down — viewer sees hands holding supplement/dosage from their own perspective. No face visible.\nPOV shot looking down at supplement in palm or being poured from bottle. One hand holds the bottle, other hand catches pills/powder. Label readable from this angle. Kitchen counter or desk visible below.",
    usage:
      "FRAMING: Hands-focused medium shot, hands actively taking/mixing supplement.\nCharacter taking supplement — swallowing with water, mixing powder into shaker, opening packet. Active consumption moment. Kitchen or gym context. Hands on product/glass only.",
    reaction:
      "FRAMING: Face-dominant close-up, energized expression is the subject, product secondary.\nPost-supplement energized expression — stretching, deep breath, ready-to-go body language. Product on counter nearby. 'I can feel the difference' energy. No device in hands.",
    lifestyle:
      "FRAMING: Wide shot pulled back, supplement in active lifestyle context.\nMorning routine or post-workout context — supplement bottle part of active healthy lifestyle setup. Gym bag, yoga mat, or kitchen smoothie ingredients visible.",
    face_closeup:
      "FRAMING: Extreme tight crop on face, wellness glow is the subject.\nFresh energized face close-up — glowing, healthy skin, bright eyes. Suggesting the wellness benefit. Post-workout or morning freshness.",
  },
  home: {
    hero: "FRAMING: Medium-wide shot, character and home product both visible, presenter energy.\nCharacter standing next to home product in room setting — showing scale and placement. Proud presenter energy. Product is the focal point of the room/area. Hands free or gesturing toward product.",
    product_detail:
      "FRAMING: First-person POV looking down — viewer sees hands touching/examining the home product from their own perspective.\nPOV shot looking down at hands running across the product surface — feeling the wood grain, fabric texture, or mechanism. The product sits on its surface (table, shelf, floor). Fingers trace the material quality. No face visible. The 'inspecting the craftsmanship' moment from personal perspective.",
    usage:
      "FRAMING: Hands-focused medium shot, character actively interacting with home product.\nCharacter actively using the home product — sitting on furniture, adjusting organizer, lighting candle, arranging decor. Functional demonstration. Hands on product only.",
    reaction:
      "FRAMING: Face-dominant medium shot, satisfaction is the subject, product in background.\nCharacter stepping back to admire the product in place — hands on hips or clasped, satisfied head tilt. 'Room transformation complete' energy.",
    lifestyle:
      "FRAMING: Wide shot pulled back, product in full room context, cozy atmosphere.\nCozy lifestyle moment — product naturally integrated into daily living. Reading on new chair, drinking tea with new mug, organized shelf in background.",
    face_closeup:
      "FRAMING: Tight face crop, comfort/satisfaction is the subject.\nCharacter's comfortable relaxed face in context of home product — comfort and satisfaction. The 'finally my space feels right' expression.",
  },
  other: {
    hero: "FRAMING: Medium close-up, face and product both prominent, reviewer energy.\nCharacter showcasing product to camera with genuine interest. Product held clearly at chest level with label visible. Friendly reviewer energy. Both hands on product.",
    product_detail:
      "FRAMING: Extreme close-up, product fills 70% of frame, hand for scale.\nClose-up of product key feature, packaging detail, or unique selling point. Hand for scale. Natural lighting highlighting material quality. Product only.",
    usage:
      "FRAMING: Hands-focused medium shot, hands actively using the product.\nCharacter using or interacting with product in its natural context. Authentic demonstration of the product's purpose. Hands on product only.",
    reaction:
      "FRAMING: Face-dominant close-up, honest expression is the subject.\nHonest review expression after using — nodding approval, examining result, sharing genuine impression toward camera. No device in hands.",
    lifestyle:
      "FRAMING: Wide shot pulled back, product in daily context.\nProduct integrated into daily life scene. Natural, unforced placement showing how it fits into real routines.",
    face_closeup:
      "FRAMING: Extreme tight crop on face, authentic expression.\nClose-up of character engaging with or reacting to the product. Natural expression, honest energy.",
  },
};

// ── UGC Behavioral Intelligence ──────────────────────────────────
const UGC_BEHAVIOR_BLOCK = `UGC BEHAVIOR LOGIC — Subject behaves like someone casually reviewing a product on TikTok.
Favor: mid-sentence expressions or micro reactions, natural hand adjustments and grip shifts, slight posture imbalance or casual leaning, attention split between product and camera.
Allow: slight framing imperfection, minor natural blur.
The subject must feel spontaneous, not posed.`;

const AFFILIATE_PRIORITY_BLOCK = `AFFILIATE PRIORITY RULE — The product is ALWAYS the visual priority.
Ensure: product clearly visible and readable, logo or key feature unobstructed, pose naturally showcases product, lighting supports product clarity.
Avoid: wide shots shrinking the product, busy backgrounds distracting from product, hands blocking branding.
The viewer must instantly understand what is being promoted.`;

const FIRST_FRAME_RULE = `FIRST-FRAME CONVERSION RULE — The image must communicate the product instantly, even at thumbnail scale.
Ensure: product silhouette readable small, product placed within central viewing zone, branding visible without zooming, clear contrast between product and background.
Recognition must occur within 0.5 seconds.`;

const SINGLE_IMAGE_RULE = `OUTPUT RULE: Generate EXACTLY ONE single image. Do NOT create a grid, collage, multi-panel, split-screen, side-by-side, before/after comparison, or any multi-image layout. ONE image, ONE scene, ONE frame only.`;

const GLOBAL_DEVICE_RULE = `CRITICAL — NO DEVICE IN FRAME: The camera/phone is the viewer's perspective. It must NEVER appear in the image. The character's hands are free to hold and interact with the product ONLY. No phone, smartphone, camera, tripod, or recording device visible anywhere in the scene. The "selfie" or "front-facing" feel comes from the camera angle and distance, not from showing a device.`;

const ANTI_GLITCH_BLOCK = `NEGATIVE CONSTRAINTS (DO NOT generate any of these):
- Phone, smartphone, camera, or recording device visible in the character's hands or anywhere in frame
- Extra fingers, deformed hands, merged fingers, missing fingers (each hand must have exactly 5 fingers)
- Text overlay, watermark, subtitle, logo stamp, UI elements
- Split image, grid layout, collage, multi-panel, triptych
- Blurry face, morphed product, duplicate objects, floating objects
- CGI render, 3D product mockup, plastic/waxy skin, airbrushed perfection
- Different product than described (do NOT substitute with another item)
- Multiple people unless explicitly requested
- Product label text that doesn't match the reference image`;

// ── Realism Directives ──────────────────────────────────────────
const UGC_REALISM = `PHOTOREALISM — UGC FRONT-FACING CAMERA CAPTURE:
Captured from front-facing camera perspective (24-28mm equivalent lens, f/1.8-f/2.4 computational aperture).
Natural daylight only — window side-light or front-light, 5000K-6500K, uneven exposure allowed.
Skin: visible pores, acne texture, slight oiliness, blemishes, redness, uneven tone. Non-retouched real skin.
Composition: slightly off-center, imperfect framing, natural micro-shake feel, awkward crop allowed.
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

    // 2. Single image + no device + anti-glitch
    parts.push(SINGLE_IMAGE_RULE);
    if (mode === "ugc") parts.push(GLOBAL_DEVICE_RULE);
    parts.push(ANTI_GLITCH_BLOCK);

    // 3. Per-shot common mistakes
    parts.push(`COMMON MISTAKES TO AVOID FOR THIS SHOT TYPE (${def.name.en}):\n${def.commonMistakes}`);

    // 4. Realism base
    parts.push(realism);
    if (boost) parts.push(boost);

    // 5. UGC behavioral intelligence (only for UGC mode)
    if (mode === "ugc") {
      parts.push(UGC_BEHAVIOR_BLOCK);
      parts.push(AFFILIATE_PRIORITY_BLOCK);
      if (idx === 0) parts.push(FIRST_FRAME_RULE);
    }

    // 6. Category-specific action (THE KEY DIFFERENTIATOR)
    parts.push(`SPECIFIC ACTION FOR THIS SHOT:\n${action}`);

    // 7. Scene setup
    parts.push(`SCENE: ${style.promptFragment}`);
    if (!style.expression.includes("N/A")) {
      parts.push(`CHARACTER: ${characterDescription}. Skin tone: ${skin}. Expression: ${style.expression}.`);
    }
    parts.push(`CAMERA: ${style.camera}, ${style.lens} lens, ${style.distance} distance, ${style.angle} angle.`);
    parts.push(`LIGHTING: ${style.lighting}`);
    parts.push(`COMPOSITION: ${style.composition}`);
    parts.push(`ENVIRONMENT: ${environment.description || environment.label}`);

    // 8. Product consistency
    parts.push(productBlock);
    parts.push(`PRODUCT DETAILS: ${catDetail}`);

    // 9. Product interaction guide from DNA
    parts.push(`PRODUCT INTERACTION: ${productCtx.interactionGuide}`);

    // 10. Environment consistency (same across all shots)
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
  "nano-banana": 640,
  "nano-banana-2": 640,
  "nano-banana-pro": 1440,
};

export function estimateCost(model: ImageModel, count: number): number {
  return (COST_PER_IMAGE[model] || 1400) * count;
}

export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}
