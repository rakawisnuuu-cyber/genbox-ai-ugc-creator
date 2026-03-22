/**
 * Image Generation Engine v2.1 — Category-Aware Shot Type System
 * Each shot type now varies by product category + random pose selection.
 * Mode (UGC vs Commercial) determines the visual grammar.
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
    ugc: {
      camera: "smartphone (iPhone 13), handheld",
      distance: "40-70cm",
      angle: "slightly high selfie angle",
      lens: "24-26mm equivalent",
      lighting: "natural window light, uneven exposure, slight highlight blowout",
      composition: "off-center, imperfect crop, slight tilt",
      expression: "casual, friendly, slightly exaggerated",
      environment: "kost room / bedroom, visible clutter",
      promptFragment:
        "selfie style, holding product near face, uneven daylight, off-center framing, real skin texture, casual Indonesian room",
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
    ugc: {
      camera: "smartphone",
      distance: "15-25cm",
      angle: "slightly top-down or handheld tilt",
      lens: "24mm",
      lighting: "window light, slightly harsh, uneven shadows",
      composition: "tight crop, imperfect alignment",
      expression: "N/A — product only",
      environment: "desk, bed, or random surface",
      promptFragment:
        "handheld close-up product shot, uneven daylight, slight blur, natural shadow, real surface texture",
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
    ugc: {
      camera: "smartphone handheld",
      distance: "30-60cm",
      angle: "selfie or mirror angle",
      lens: "24mm",
      lighting: "natural daylight, uneven shadows",
      composition: "tight, imperfect crop",
      expression: "focused, natural",
      environment: "bathroom, bedroom, casual space",
      promptFragment: "applying product, visible pores, handheld camera feel, uneven lighting, mirror selfie style",
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
    ugc: {
      camera: "smartphone",
      distance: "30-50cm",
      angle: "slightly low or eye-level selfie",
      lens: "24mm",
      lighting: "soft daylight, slightly inconsistent",
      composition: "natural framing, slight crop",
      expression: "excited, impressed, relatable",
      environment: "same casual room",
      promptFragment: "natural smile, touching face, real skin texture, casual lighting, genuine reaction",
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
    ugc: {
      camera: "smartphone",
      distance: "80-120cm",
      angle: "eye-level or slightly tilted",
      lens: "24mm",
      lighting: "ambient daylight, mixed sources",
      composition: "loose framing, clutter visible",
      expression: "natural, candid",
      environment: "warung, mall, bedroom, street",
      promptFragment:
        "casual daily life, product visible in scene, natural lighting, candid feel, real Indonesian environment",
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
    ugc: {
      camera: "smartphone",
      distance: "20-30cm",
      angle: "selfie extreme close",
      lens: "24mm",
      lighting: "window side light, uneven exposure",
      composition: "tight crop, partial face allowed",
      expression: "raw, unfiltered, natural",
      environment: "bedroom/bathroom",
      promptFragment: "extreme close-up face, visible pores, acne, uneven lighting, handheld feel, raw skin texture",
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

// ── Realism Directives ──────────────────────────────────────────
const UGC_REALISM = `PHOTOREALISM — UGC SMARTPHONE CAPTURE:
Shot on smartphone camera (iPhone 13 equivalent), 24-28mm lens, f/1.8-f/2.4 computational aperture.
Natural daylight only — window side-light or front-light, 5000K-6500K, uneven exposure allowed.
Skin: visible pores, acne texture, slight oiliness, blemishes, redness, uneven tone. Non-retouched real skin.
Composition: slightly off-center, imperfect framing, handheld micro-shake, awkward crop allowed.
Color: neutral to slightly warm, low-medium contrast, natural unsaturated, slightly inconsistent white balance.
Environment: real Indonesian living space, imperfect background, personal items visible.
NEGATIVE: overly smooth skin, studio lighting, perfect symmetry, cinematic depth of field, DSLR look, CGI, 3D render, airbrushed skin.`;

const COMMERCIAL_REALISM = `PHOTOREALISM — EDITORIAL STUDIO PHOTOGRAPHY:
Shot on full-frame DSLR, 85mm or 50mm prime lens, f/1.8-f/2.8.
Studio lighting: soft diffused key light + subtle fill bounce + soft rim separation. 5200K-5600K.
Skin: visible pores but refined, matte finish, controlled highlights, minimal imperfections present.
Composition: intentional balanced framing, controlled asymmetry, tripod-stable.
Color: clean premium tone, medium contrast, slightly warm or neutral luxury, high consistency.
Environment: real but curated space, minimal clutter, intentional props.
NEGATIVE: CGI render, 3D product, plastic skin, over-retouched, fake reflections, hyper HDR, cartoon lighting.`;

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

// ── Category × Shot Type Fragments ─────────────────────────────
// Each cell has multiple pose variants separated by "|".
// planImageShots picks ONE randomly per generation for variety.

type CategoryFragments = Record<ShotTypeKey, { ugc: string; commercial: string }>;

const CATEGORY_SHOT_FRAGMENTS: Record<ProductCategory, CategoryFragments> = {
  skincare: {
    hero: {
      ugc: "holding serum bottle near cheek, 3/4 mirror selfie in bright bathroom, real skin pores visible, LED ring light reflection in eyes, organized vanity behind | POV looking down at own hands, dropper hovering above open palm, soft bed sheets visible, morning window light, creator's lap and legs in frame | product extended toward camera lens, face slightly blurred behind, shallow phone DOF, bathroom tiles background | over-shoulder mirror angle, applying product near jawline, mirror reflection showing full face, natural daylight glow through window",
      commercial:
        "model holding serum beside cheek, centered bust composition, soft diffused key light, clean gradient backdrop, label facing camera | product resting on open palm at eye-level, controlled studio lighting, shallow depth with product sharp | dropper mid-air releasing single droplet, macro focus on liquid, soft bokeh behind | symmetrical portrait, bottle aligned with jawline, controlled rim highlights, editorial skin finish",
    },
    product_detail: {
      ugc: "POV hand holding bottle, label crisp and sharp, bedroom blur behind, morning light on packaging | top-down flat lay on clean white vanity, sunlight streaks across products, organized skincare routine layout | fingers squeezing cream swatch onto back of hand, texture clearly visible, bathroom counter | handheld close-up, condensation droplets on glass bottle, real surface texture beneath",
      commercial:
        "macro shot of serum droplet on glass surface, perfect studio reflection, controlled caustics | top-down minimal layout on marble, precise spacing between items, soft directional shadow | cream smear on clear acrylic slab, hyper-detailed texture, clinical beauty | bottle isolated on seamless, crisp label typography, soft gradient shadow",
    },
    usage: {
      ugc: "applying serum to cheek with fingertips, mirror selfie angle, bathroom vanity visible, natural skin texture | POV dropper hovering above own palm, sitting cross-legged on bed, soft morning light | over-shoulder at vanity, mirror reflection showing application, products lined up | side profile pressing cream into cheekbone, warm window light catching dewy skin",
      commercial:
        "model applying cream to cheek with ring finger, diffused softbox lighting, controlled catch-light in eyes | macro of droplet touching skin surface, pore-level detail, studio precision | symmetrical front-facing application, both hands visible, clean minimal studio | controlled side profile, product blending into skin, editorial lighting revealing texture",
    },
    reaction: {
      ugc: "touching own cheek in happy disbelief, mirror selfie, soft smile, dewy skin catching light | close POV both hands feeling own skin texture, looking down, genuine wonder | over-shoulder grinning at mirror reflection, bathroom context | soft laugh with fingers gently tapping glowing cheek, phone-angle selfie",
      commercial:
        "model gently touching cheek, subtle closed-lip smile, studio beauty lighting | eyes softly closed, appreciating own skin texture, serene expression | soft satisfied expression, hand gliding across cheek, shallow focus | minimal portrait framing, radiant skin emphasis, warm tone",
    },
    lifestyle: {
      ugc: "product on bedside table with water glass, warm morning sunlight through blinds, unmade bed edge visible | flat lay arrangement of full skincare routine on clean bathroom shelf, natural light | product sitting on bathroom shelf beside folded towel, toothbrush holder nearby | beside open laptop in cozy bedroom, daily routine casual vibe",
      commercial:
        "product on white marble surface, precise shadow, single dried flower as prop | curated vanity scene with balanced props, neutral earthy tones | minimal bathroom shelf composition, product centered, soft ambient light | product beside neatly folded white towel, luxury spa hotel aesthetic",
    },
    face_closeup: {
      ugc: "tight crop on cheekbone, individual pores visible, slight dewy glow from serum, real skin texture | lips and nose bridge detail, natural unretouched skin, slight oiliness | extreme close on under-eye and cheek, dewy serum finish catching window light | chin to eyebrow framing, fingertips touching skin edge, natural bathroom light",
      commercial:
        "macro facial landscape, pore-level clarity and precision, controlled highlight on cheekbone | glossy cheek highlight from serum, studio ring-light catch, editorial beauty | lips and surrounding skin detail, soft gradient studio light, refined texture | extreme close symmetrical crop, flawless editorial skin finish, warm neutral tone",
    },
  },
  fashion: {
    hero: {
      ugc: "full-length mirror selfie showing complete outfit, one hand adjusting hijab, phone visible, bedroom behind | walking past camera mid-stride, outfit in natural motion, mall corridor or apartment hallway | holding bag extended toward lens with body softly blurred behind, outdoor cafe wall | over-shoulder mirror shot checking outfit fit, wardrobe rack partially visible",
      commercial:
        "full-body standing pose, outfit as centerpiece, clean studio backdrop, controlled even lighting | walking stride frozen mid-step, fabric flowing naturally, directional light | model holding bag at hip level, eye-level framing, minimal background | symmetrical confident stance, clean white or neutral backdrop, editorial posture",
    },
    product_detail: {
      ugc: "POV fingers touching fabric texture, stitching detail visible, natural bedroom light | top-down neatly folded garment on white bed sheet, morning light | close-up of zipper being slowly pulled, metal detail sharp | hand holding accessory close to phone camera, blurred room behind",
      commercial:
        "macro stitching detail on fabric, perfect directional lighting showing thread texture | flat lay outfit arrangement, symmetrical layout, controlled shadows on clean surface | fabric drape on form or hanger, soft studio shadows revealing material weight | accessory isolated on reflective surface, crisp detail, premium feel",
    },
    usage: {
      ugc: "adjusting hijab in front of bedroom mirror, morning light, personal space visible | walking through apartment hallway adjusting sleeve or hem | POV looking down tying own shoelaces, legs and floor visible | over-shoulder shot, bag being positioned on shoulder, mirror edge visible",
      commercial:
        "model in dressing sequence, controlled directional light, clean background | side profile adjusting sleeve cuff, fabric detail visible, studio | footwear worn, walking on clean studio floor, movement blur on edges | bag placement on shoulder from 3/4 angle, minimal lifestyle set",
    },
    reaction: {
      ugc: "checking outfit in mirror with satisfied small smile, hands on hips or adjusting collar | slight playful spin enjoying how outfit moves, room context | over-shoulder pleased glance at own reflection, natural expression | subtle approving nod to mirror, confident relaxed posture",
      commercial:
        "model with confident calm gaze, slight closed-lip smile, editorial stance | controlled graceful turn, fabric catching movement, studio light | poised standing pose with approval expression, balanced composition | elegant sideways glance toward mirror, editorial grace",
    },
    lifestyle: {
      ugc: "outfit laid flat on white bed with accessories arranged nearby, morning natural light | sitting at aesthetic cafe table wearing the outfit, drink nearby, candid angle | walking through clean mall corridor, natural environment | hanging on clothes rack in tidy room, curated but personal",
      commercial:
        "outfit styled in curated flat lay set with color-coordinated props | model seated in cafe-inspired studio set, editorial pose | minimal urban street set with controlled light, fashion editorial posture | clothing rack styled with color harmony, aspirational wardrobe",
    },
    face_closeup: {
      ugc: "tight face crop showing hijab drape detail and skin, natural expression, soft light | lips and sunglasses reflection detail, outdoor light | cheek and earring detail, warm side light | eye-level close genuine smile, fabric of collar visible at edge",
      commercial:
        "editorial tight face crop, sharp hijab or accessory detail framing face | accessory-centered face composition, controlled catch-light | beauty lighting on face with fashion context at edges | symmetrical close portrait, editorial precision, accessory as accent",
    },
  },
  food: {
    hero: {
      ugc: "holding iced drink toward camera, condensation droplets on cup, excited expression behind, cafe table | fork lifting noodles mid-air with surprised face, food steaming, casual dining table | POV looking down at own hands grabbing snack from packet, table and lap visible | over-shoulder showing beautifully plated meal on table, natural restaurant light",
      commercial:
        "hero plate perfectly centered, steam rising, dramatic side light, clean surface | glass drink with perfect condensation beading, studio backlight through liquid | fork lifting single bite of food upward, macro detail on texture, controlled lighting | symmetrical overhead composition on clean styled dining set",
    },
    product_detail: {
      ugc: "close-up of sauce dripping off spoon, handheld angle, kitchen counter | top-down snack arrangement on plate, packet visible, natural table light | fingers breaking crispy snack in half, crumbs scattering, real texture | drink glass with condensation, ice cubes visible through glass, cafe table",
      commercial:
        "macro texture of food surface showing grain and moisture, studio precision | flat lay symmetrical meal arrangement, props perfectly placed | sauce drip frozen mid-air above food, dramatic studio side-light | glass condensation with studio rim lighting, liquid clarity visible",
    },
    usage: {
      ugc: "eating noodles with chopsticks mid-lift, steam visible, casual table setting | sipping drink through straw from side profile, cafe window light | POV holding loaded spoon toward own mouth, plate visible below | over-shoulder at dining table, hands actively eating, food visible",
      commercial:
        "model taking composed bite, controlled lighting on face and food equally | elegant side-profile sip from glass, studio rim light on liquid | utensil interaction with food in sharp focus, blurred model behind | composed dining scene, model and food in balanced editorial frame",
    },
    reaction: {
      ugc: "eyes closed savoring first taste, slight head tilt, genuine pleasure expression | surprised delighted smile right after first bite, mouth slightly open | nodding slowly with approving expression, still chewing, casual setting | laughing mid-chew candid moment, relatable joy",
      commercial:
        "subtle refined smile enjoying complex flavor, controlled studio expression | elegant tasting expression, eyes gently downcast, editorial composure | controlled delight reaction, chin slightly raised, premium feel | serene savoring moment, soft light on face, food blurred foreground",
    },
    lifestyle: {
      ugc: "food and drink on aesthetic cafe table, blurred cafe interior behind, natural afternoon light | meal on bed tray with laptop open beside, cozy weekend morning vibe | snack packets beside laptop on desk, casual work-snacking context | drinks on apartment balcony table railing, city or greenery behind",
      commercial:
        "curated cafe table scene, styled props, controlled overhead light, editorial food styling | styled breakfast tray on clean linen, warm morning light, magazine-worthy | snack arrangement with workspace aesthetic, clean minimalist desk | drink in lifestyle set with plants and natural material props",
    },
    face_closeup: {
      ugc: "tight crop of face while chewing, natural genuine expression, food-stained lips, real moment | lips approaching straw for sip, drink in foreground blur | cheeks puffed slightly reacting to spicy or sour taste, expressive | eyes closed in close crop, savoring flavor, bliss expression",
      commercial:
        "beauty-grade close-up of tasting moment, controlled light on lips and cheeks | lips and drink glass in sharp dual-focus, editorial precision | refined chewing expression, composed and attractive, studio | macro face with food element in soft foreground, editorial food-beauty hybrid",
    },
  },
  electronics: {
    hero: {
      ugc: "holding phone toward camera showing screen content, screen glow on face, desk background | earbuds in ear, mirror selfie, confident expression, bedroom behind | POV holding gadget above desk setup, own hands and keyboard visible below | over-shoulder showing laptop screen with UI visible, home office context",
      commercial:
        "device centered in frame, controlled screen glow, clean studio backdrop | model holding phone beside face, studio lighting, screen visible | earbuds detail shot on ear, shallow DOF, clean neutral light | gadget isolated with controlled reflections, premium product photography",
    },
    product_detail: {
      ugc: "POV close-up of cable texture and connector, desk surface visible | top-down desk setup flat lay with device centered among peripherals | LED indicator light glowing in macro, slight ambient darkness | finger pressing button in extreme close-up, haptic detail visible",
      commercial:
        "macro of port and connector detail, sharp directional studio light | flat lay symmetrical tech arrangement, minimal clean surface | LED glow with controlled exposure, dramatic low-key lighting | button press freeze frame, studio precision, mechanical detail",
    },
    usage: {
      ugc: "thumb scrolling on phone screen mid-action, face partially visible, casual posture on sofa | POV plugging charger cable into device, own hands and desk visible | earbuds being inserted into ear, fingers adjusting fit, mirror angle | over-shoulder at desk, gaming or working on screen, ambient room light",
      commercial:
        "clean hand interaction with device, finger on screen, studio light on both hand and device | cable being plugged in, studio macro, controlled focus pull | earbud placement in ear, macro detail on fit, soft background | staged tech usage scene, model and device in balanced composition",
    },
    reaction: {
      ugc: "impressed face looking at phone screen, eyebrows raised, casual room setting | showing phone screen to camera while smiling, excited energy | nodding appreciatively at sound quality with earbuds in, eyes closed | raised eyebrows discovering feature, genuine surprise expression",
      commercial:
        "subtle impressed expression at device, controlled studio portrait | elegant device showcase pose, model presenting screen to camera | composed satisfied reaction, earbuds in, studio beauty light | soft editorial smile discovering tech feature, premium feel",
    },
    lifestyle: {
      ugc: "phone and earbuds on desk beside coffee mug, morning workspace context | earbuds case beside open laptop, casual work-from-home desk | charger plugged in on bedside table, nighttime ambient light | gaming setup desk with peripherals arranged, LED accent light",
      commercial:
        "minimal curated desk layout with device as hero, controlled overhead light | styled workspace scene, device among premium accessories | bedside tech arrangement, soft warm ambient studio light | clean gaming or productivity setup, editorial workspace photography",
    },
    face_closeup: {
      ugc: "screen glow illuminating face in close-up, blue-white light on skin, dark room ambient | earbuds in-ear detail with ear and jawline visible, natural side light | eyes intensely focused on screen just out of frame, concentrated expression | low-light phone glow portrait, natural skin texture visible",
      commercial:
        "dramatic screen light portrait, controlled blue-white accent on face, studio dark | earbud fit macro with ear detail, shallow DOF, beauty lighting | focused gaze at screen, sharp eye detail, editorial studio | controlled device-glow lighting on face, cinematic tech portrait",
    },
  },
  health: {
    hero: {
      ugc: "holding supplement bottle post-workout, towel on shoulder, gym mirror selfie, slight sweat, bright overhead light | shaker bottle extended toward camera lens, energetic expression, kitchen morning light | POV looking down at own palm with pills, sitting on bed edge, morning light through blinds | over-shoulder at kitchen counter mixing powder into glass, morning routine context",
      commercial:
        "supplement bottle centered, fit model in frame, controlled studio light, clean health aesthetic | shaker bottle mid-shake frozen in action, dynamic pose, studio | pill detail resting on open palm, macro focus, soft bokeh behind model | clean supplement hero shot, product and wellness props, editorial precision",
    },
    product_detail: {
      ugc: "powder scoop macro with granule texture visible, kitchen counter surface | pills arranged in palm close-up, hand detail, natural window light | top-down supplement bottle with other wellness items on tray | water glass with powder dissolving, swirl visible, handheld above counter",
      commercial:
        "macro powder texture on scoop, individual granules visible, studio precision | pill arrangement on clean surface, symmetrical, soft shadow | flat lay supplement set with fruits and water, curated health aesthetic | liquid mixing in glass, controlled slow-motion effect, studio backlight through liquid",
    },
    usage: {
      ugc: "drinking protein shake after workout, gym towel visible, slightly sweaty, bright fluorescent | taking pill with glass of water, morning bathroom mirror behind | POV scooping powder into shaker, own hands and kitchen counter visible | over-shoulder at gym bench, opening supplement container, workout context",
      commercial:
        "fit model drinking shake, controlled warm light, clean gym-inspired studio | pill intake posed cleanly, glass of water, soft light, health editorial | powder scooping in controlled studio, clean measuring precision | gym environment, staged workout context, editorial fitness photography",
    },
    reaction: {
      ugc: "energized morning smile with supplement in hand, bright kitchen window light behind | post-workout satisfied glow, slightly flushed, holding shaker, gym mirror | content nodding while drinking morning supplement, calm energy | refreshed relieved expression after taking supplement, natural light",
      commercial:
        "subtle energized expression, warm morning studio light, wellness editorial | clean fitness glow portrait, post-exercise radiance, controlled | composed satisfied smile holding supplement, balanced lighting | serene wellness satisfaction pose, editorial warmth, health magazine aesthetic",
    },
    lifestyle: {
      ugc: "supplement bottle on bedside table next to phone and water glass, morning light | gym bag open with shaker and supplements visible, ready-to-go context | morning kitchen counter with supplement, coffee, and fruit, daily routine | kitchen counter health setup with blender and ingredients, prep context",
      commercial:
        "clean wellness lifestyle layout, supplement among curated health props | gym scene styled with towel and bottle, editorial fitness | morning routine editorial, supplement in balanced breakfast scene | minimal kitchen set with supplement as hero, warm natural studio light",
    },
    face_closeup: {
      ugc: "fresh face in morning light, energized expression, just-taken-supplement glow | slight sweat detail on forehead and temples, post-workout, real skin texture | lips on shaker bottle rim about to drink, action close-up | bright energized eyes, awake and alert morning expression, natural light",
      commercial:
        "fitness glow close-up, controlled warm highlight on cheekbone, studio | refined post-exercise sweat detail, editorial precision, not excessive | drinking macro, lips and shaker in sharp focus, studio | sharp energized eye detail, editorial vitality portrait, health magazine quality",
    },
  },
  home: {
    hero: {
      ugc: "holding decor item in room context, standing beside shelf, natural light from window | sitting on bed or sofa with home product in lap, relaxed posture, warm ambient | POV placing item onto shelf, own hands and room visible, arranging moment | over-shoulder shot surveying room with product freshly placed, satisfied posture",
      commercial:
        "product centered in beautifully styled room scene, balanced interior composition | model interacting with furniture piece, studio-controlled interior light | home decor hero shot, product as focal point with lifestyle context | clean interior photography, product placement with editorial precision",
    },
    product_detail: {
      ugc: "texture close-up of fabric weave or wood grain, fingers touching surface, natural light | top-down organizer interior layout, compartments visible, items inside | hand running along material surface, tactile detail, warm side light | macro of stitching or joinery detail, craftsmanship visible, handheld angle",
      commercial:
        "material macro with studio directional light, wood grain or fabric thread visible | flat lay interior items arrangement, symmetrical, clean surface | texture isolated on neutral surface, studio shadow play | detailed craftsmanship macro, editorial precision, premium quality emphasis",
    },
    usage: {
      ugc: "placing decorative item on wall shelf, reaching up, room context visible | sitting comfortably on or using furniture product, relaxed natural posture | POV organizing items into drawer or container, own hands visible, satisfying arrangement | over-shoulder making bed or arranging pillows, morning routine context",
      commercial:
        "model interacting with furniture in styled interior, controlled natural light | clean usage scene, product being used as intended, editorial composition | organized layout demonstration, staged but natural, interior magazine aesthetic | interior styling moment, editorial home photography",
    },
    reaction: {
      ugc: "stepping back to admire freshly arranged room, satisfied hands-on-hips moment | relaxed smile sitting on new furniture, cozy comfortable expression | approving nod looking at organized shelf, pride in arrangement | sinking into comfortable product with relieved relaxed expression",
      commercial:
        "subtle satisfaction pose admiring interior styling result, editorial composure | model seated comfortably, serene expression, controlled warm light | calm appreciation expression viewing arranged space, balanced frame | composed relaxation pose, editorial comfort and wellness",
    },
    lifestyle: {
      ugc: "room wide shot showing product in natural context, morning warm light, lived-in feel | bed setup with product visible, morning sunlight through curtains, soft cozy | kitchen scene with home product in use, daily life context | living room cozy evening setup, warm lamp light, comfortable atmosphere",
      commercial:
        "editorial interior scene, product in styled room, magazine-worthy composition | styled bedroom with controlled warm light, aspirational living | minimal kitchen set with product, clean editorial interior | living room composition with balanced props, controlled lifestyle lighting",
    },
    face_closeup: {
      ugc: "face resting on pillow with cozy relaxed expression, soft natural light, comfort visible | relaxed genuine smile while using home product, warm lighting | eyes gently closed enjoying comfort moment, peaceful expression | soft morning expression, just-woke-up warmth, natural bedroom light",
      commercial:
        "comfort close portrait, serene expression, soft studio warmth | peaceful relaxation face, editorial controlled light, luxury comfort | soft diffused light on resting face, editorial tranquility | warm editorial close-up, comfort and satisfaction expressed, premium home aesthetic",
    },
  },
  other: {
    hero: {
      ugc: "holding product toward camera with confident expression, room background blurred | mirror selfie showing product in hand, full context visible, natural light | POV hands presenting product from own perspective, desk or table visible | over-shoulder displaying product, face partially visible, casual setting",
      commercial:
        "product centered with model in frame, clean studio backdrop, balanced composition | model holding item at chest level, editorial pose, controlled light | clean studio product hero shot with human context | minimal composition, product and model in harmonic balance",
    },
    product_detail: {
      ugc: "close-up hand holding product, label visible, natural desk light | top-down product layout with related items on clean surface | texture and material detail macro, handheld angle | product rotated showing different angle, real surface beneath",
      commercial:
        "macro detail with studio directional light, texture emphasis | flat lay symmetrical product arrangement, minimal clean surface | product isolated on seamless, controlled shadow play | texture highlight macro, editorial product photography",
    },
    usage: {
      ugc: "using product naturally in intended context, casual posture, real environment | POV interacting with product, own hands visible, first-person perspective | over-shoulder usage shot, product function visible | side profile actively using product, natural light, candid moment",
      commercial:
        "clean usage scene, model and product in balanced frame, studio | controlled product interaction, editorial precision | staged usage, minimal background, focus on product function | composed action shot, product usage with editorial quality",
    },
    reaction: {
      ugc: "genuine smiling reaction after using product, natural expression, casual setting | surprised pleased look discovering product feature | approving nod with product in hand, relaxed posture | casual laugh holding product, authentic enjoyment moment",
      commercial:
        "subtle composed reaction, editorial expression, studio control | refined discovery expression, controlled lighting | elegant approval pose, product visible, balanced frame | minimal emotion portrait, product satisfaction conveyed through eyes",
    },
    lifestyle: {
      ugc: "product placed in daily life setup on desk or table, natural context | product beside everyday items, casual environment, natural light | product in use-context environment, relaxed daily life | natural placement in living space, personal but tidy",
      commercial:
        "styled lifestyle set with product as hero, controlled composition | minimal scene, product among curated complementary props | curated environment, product in editorial lifestyle context | balanced lifestyle composition, controlled ambient lighting",
    },
    face_closeup: {
      ugc: "tight face with genuine expression related to product use, natural light | natural reaction close-up, real skin texture, casual lighting | eye-level tight crop, authentic emotion, phone-angle feel | close expression detail, relatable and genuine moment",
      commercial:
        "editorial close-up, controlled lighting on expression | refined portrait, product-appropriate emotion, studio | minimal face crop, sharp detail, editorial precision | composed close portrait, expression matching product context",
    },
  },
};

// ── Shot-Specific AI Direction ─────────────────────────────────
const SHOT_DIRECTION: Record<ShotTypeKey, string> = {
  hero: "DIRECTION: Main hero shot. Character holding product confidently, product label clearly visible facing camera. Both character face and product must be prominent in frame.",
  product_detail:
    "DIRECTION: Creator showing product to camera close-up. Product fills 60-70% of frame, label and texture razor sharp. Creator's face and body visible BEHIND the product but naturally out of focus — shallow depth of field from phone focusing on the near object. Like a TikTok creator holding product toward the lens saying 'coba liat ini'. One hand holding product, other hand may point at label or feature. NOT a flat lay, NOT product-on-table — this is handheld toward camera.",
  usage:
    "DIRECTION: Natural usage moment. Character actively USING the product in its intended way — not just holding it. Show the ACTION of application/consumption/interaction. Hands and product interaction must be the focal point.",
  reaction:
    "DIRECTION: Post-use genuine reaction. Character's face and expression are the hero — product can be secondary or out of frame. Show authentic emotion: surprise, satisfaction, delight.",
  lifestyle:
    "DIRECTION: Environmental context shot. Wider framing showing product naturally placed in daily life setting. Character may or may not be in frame. Product should feel like part of the scene, not posed.",
  face_closeup:
    "DIRECTION: Extreme tight face crop. Only face fills the frame — chin to forehead or tighter. Show skin texture, pores, expression detail. Product should NOT be in frame. This is about intimacy and trust.",
};

// ── Helpers ─────────────────────────────────────────────────────

/** Pick one random pose variant from a "|" separated string */
function pickRandomVariant(fragmentString: string): string {
  const variants = fragmentString
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
  return variants[Math.floor(Math.random() * variants.length)];
}

// ── Shot Planner ────────────────────────────────────────────────
export function planImageShots(config: GenerationConfig): ImageShotPlan[] {
  const { mode, selectedShots, productDNA, characterDescription, environment, realismLevel } = config;
  const realism = mode === "ugc" ? UGC_REALISM : COMMERCIAL_REALISM;
  const boost = REALISM_BOOST[realismLevel];
  const productBlock = buildProductConsistencyBlock(productDNA);
  const catDetail = CATEGORY_DETAILS[productDNA.category] || CATEGORY_DETAILS.other;
  const skin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];

  // Rich product context — interaction guide, emotional angle, target user
  const productCtx = getProductContext(productDNA);

  // Category-specific fragment lookup (fallback to "other")
  const catFragments = CATEGORY_SHOT_FRAGMENTS[productDNA.category] || CATEGORY_SHOT_FRAGMENTS.other;

  return selectedShots.map((shotKey, idx) => {
    const def = SHOT_TYPES.find((s) => s.key === shotKey)!;
    const style = mode === "ugc" ? def.ugc : def.commercial;

    // Pick ONE random pose from category-specific variants
    const catFragment = catFragments[shotKey];
    const chosenPose = catFragment
      ? pickRandomVariant(mode === "ugc" ? catFragment.ugc : catFragment.commercial)
      : style.promptFragment;

    const parts: string[] = [realism];
    if (boost) parts.push(boost);

    // Category-aware scene direction (replaces generic promptFragment)
    parts.push(`SCENE: ${chosenPose}`);
    parts.push(SHOT_DIRECTION[shotKey]);

    if (!style.expression.includes("N/A")) {
      parts.push(`CHARACTER: ${characterDescription}. Skin tone: ${skin}. Expression: ${style.expression}.`);
    }
    parts.push(`CAMERA: ${style.camera}, ${style.lens} lens, ${style.distance} distance, ${style.angle} angle.`);
    parts.push(`LIGHTING: ${style.lighting}`);
    parts.push(`COMPOSITION: ${style.composition}`);
    parts.push(`ENVIRONMENT: ${environment.description || environment.label}`);

    // Product consistency
    parts.push(productBlock);
    parts.push(`PRODUCT DETAILS: ${catDetail}`);

    // Rich product context — interaction + emotion
    parts.push(`INTERACTION: ${productCtx.interactionGuide}`);
    parts.push(`EMOTIONAL CONTEXT: ${productCtx.emotionalAngle}`);

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
  "nano-banana": 310,
  "nano-banana-2": 620,
  "nano-banana-pro": 1400,
};

export function estimateCost(model: ImageModel, count: number): number {
  return (COST_PER_IMAGE[model] || 1400) * count;
}

export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}
