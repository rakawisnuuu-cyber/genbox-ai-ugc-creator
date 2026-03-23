/**
 * Image Generation Engine v3 — Shot Director + Smart Prompt Compiler
 *
 * Architecture:
 *   Layer 1 (Tier 1): Realism + Product Anchor + Character Anchor + Anti-grid (~150 words)
 *   Layer 2 (Tier 2): Shot Director Knowledge — category × shot-specific direction (~80 words)
 *   Layer 3 (Tier 3): Conditional — UGC Behavior / Affiliate Priority / First-Frame (~50 words)
 *   Target: 250-280 words per prompt (sweet spot for Nano Banana Pro)
 */

import type { ProductDNA, ProductCategory } from "./product-dna";
import { buildProductConsistencyBlock } from "./product-dna";

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

// ── Shot Type Definitions (UI-only metadata) ────────────────────
export const SHOT_TYPES: ShotTypeDefinition[] = [
  {
    key: "hero",
    name: { en: "Hero Shot", id: "Shot Utama" },
    purpose: "Foto utama karakter + produk untuk thumbnail atau cover",
    icon: "Star",
    whenToUse: ["all"],
  },
  {
    key: "product_detail",
    name: { en: "Product Detail", id: "Detail Produk" },
    purpose: "Close-up produk untuk highlight kualitas, tekstur, dan packaging",
    icon: "Search",
    whenToUse: ["skincare", "food", "electronics"],
  },
  {
    key: "usage",
    name: { en: "Usage Shot", id: "Shot Pemakaian" },
    purpose: "Tunjukkan cara pakai produk secara natural",
    icon: "Hand",
    whenToUse: ["skincare", "food", "electronics", "health"],
  },
  {
    key: "reaction",
    name: { en: "Reaction Shot", id: "Shot Reaksi" },
    purpose: "Ekspresi setelah pakai produk — trust builder",
    icon: "Smile",
    whenToUse: ["skincare", "health", "food"],
  },
  {
    key: "lifestyle",
    name: { en: "Lifestyle Context", id: "Shot Lifestyle" },
    purpose: "Produk dalam konteks kehidupan sehari-hari",
    icon: "Coffee",
    whenToUse: ["fashion", "food", "electronics", "home"],
  },
  {
    key: "face_closeup",
    name: { en: "Face Close-Up", id: "Close-Up Wajah" },
    purpose: "Detail wajah dan kulit untuk trust dan intimacy",
    icon: "Eye",
    whenToUse: ["skincare", "health"],
  },
];

// ── Shot Director Knowledge Base (42 combos: 7 categories × 6 shot types) ──

interface ShotDirectionStyle {
  camera_angle: string;
  distance: string;
  product_interaction: string;
  composition_trick: string;
  environment_detail: string;
  expression_direction: string;
  common_mistake: string;
}

type ShotDirectorDB = Record<
  ProductCategory,
  Record<ShotTypeKey, { ugc: ShotDirectionStyle; commercial: ShotDirectionStyle }>
>;

const SD: ShotDirectorDB = {
  skincare: {
    hero: {
      ugc: {
        camera_angle: "slightly low angle, 15cm below chin, tilted upward 10°",
        distance: "0.7m",
        product_interaction: "holding serum bottle between thumb and index at cheek level, dropper angled 45°",
        composition_trick: "product on rule-of-thirds intersection, face off-center",
        environment_detail: "kamar kos, meja skincare berantakan ringan, kaca kecil, lampu warm",
        expression_direction: "confident soft smile, relaxed eyes",
        common_mistake: "product floating or too large, dropper liquid unrealistic",
      },
      commercial: {
        camera_angle: "eye-level straight-on symmetrical",
        distance: "2.2m",
        product_interaction: "holds bottle centered at chest, label facing camera flat",
        composition_trick: "perfect symmetry, negative space above head",
        environment_detail: "clean pastel seamless backdrop, subtle gradient",
        expression_direction: "neutral luxury gaze",
        common_mistake: "over-retouched skin, no pores",
      },
    },
    product_detail: {
      ugc: {
        camera_angle: "top-down 90° flat lay",
        distance: "0.35m",
        product_interaction: "hand squeezing cleanser creating foam spread",
        composition_trick: "messy but intentional spill pattern",
        environment_detail: "meja wastafel kamar mandi, noda air real",
        expression_direction: "no face",
        common_mistake: "texture looks plastic not creamy",
      },
      commercial: {
        camera_angle: "macro 45° side angle",
        distance: "0.5m",
        product_interaction: "serum drop suspended mid-air above glass surface",
        composition_trick: "reflection symmetry on glossy surface",
        environment_detail: "studio acrylic reflective base",
        expression_direction: "no face",
        common_mistake: "liquid physics incorrect, no surface tension",
      },
    },
    usage: {
      ugc: {
        camera_angle: "mirror selfie slightly above eye level",
        distance: "0.6m via mirror",
        product_interaction: "one hand applying moisturizer circular motion on cheek",
        composition_trick: "half face visible, half blocked by phone",
        environment_detail: "kamar mandi kecil, kaca agak buram",
        expression_direction: "focused, slightly open mouth",
        common_mistake: "hand unnatural, cream not blending into skin",
      },
      commercial: {
        camera_angle: "side profile 30°",
        distance: "1.8m",
        product_interaction: "gently pressing serum into cheek with fingertips",
        composition_trick: "clean negative space behind profile",
        environment_detail: "neutral studio, soft shadow falloff",
        expression_direction: "calm ritualistic",
        common_mistake: "no visible skin texture during application",
      },
    },
    reaction: {
      ugc: {
        camera_angle: "front camera selfie slightly shaky",
        distance: "0.5m",
        product_interaction: "holding product loosely near chin after use",
        composition_trick: "face dominates 80% frame",
        environment_detail: "kasur kamar, natural window light",
        expression_direction: "surprised glow, raised eyebrows",
        common_mistake: "expression too posed, not spontaneous",
      },
      commercial: {
        camera_angle: "eye-level tight portrait",
        distance: "1.5m",
        product_interaction: "product resting near collarbone",
        composition_trick: "glow highlight on cheekbone",
        environment_detail: "studio soft key + bounce fill",
        expression_direction: "subtle satisfied smile",
        common_mistake: "skin glow looks oily not radiant",
      },
    },
    lifestyle: {
      ugc: {
        camera_angle: "wide angle slightly tilted handheld",
        distance: "1.8m",
        product_interaction: "product on meja belajar, user in background doing skincare",
        composition_trick: "foreground product blurred, background action visible",
        environment_detail: "meja belajar, laptop, buku, skincare scattered",
        expression_direction: "not looking at camera, candid",
        common_mistake: "depth of field unrealistic, everything too sharp",
      },
      commercial: {
        camera_angle: "wide symmetrical",
        distance: "3m",
        product_interaction: "product on marble counter, model walking behind",
        composition_trick: "foreground sharp, background soft motion blur",
        environment_detail: "luxury bathroom set",
        expression_direction: "natural off-camera movement",
        common_mistake: "model looks pasted into background",
      },
    },
    face_closeup: {
      ugc: {
        camera_angle: "extreme close selfie slightly below eye",
        distance: "0.25m",
        product_interaction: "no product, focus on skin",
        composition_trick: "skin fills entire frame",
        environment_detail: "window light one side of face",
        expression_direction: "relaxed neutral",
        common_mistake: "over-smoothed skin, no pores",
      },
      commercial: {
        camera_angle: "macro beauty straight-on",
        distance: "0.8m crop",
        product_interaction: "tiny product edge near jawline",
        composition_trick: "sharp focus on pores and highlights",
        environment_detail: "studio beauty dish",
        expression_direction: "still, composed",
        common_mistake: "plastic skin effect",
      },
    },
  },
  fashion: {
    hero: {
      ugc: {
        camera_angle: "mirror full-body slightly tilted",
        distance: "2.5m",
        product_interaction: "adjusting bag strap or pulling shirt hem",
        composition_trick: "mirror frame visible",
        environment_detail: "kamar kos, cermin berdiri",
        expression_direction: "casual confident",
        common_mistake: "limbs distorted in mirror",
      },
      commercial: {
        camera_angle: "low angle full-body fashion stance",
        distance: "4m",
        product_interaction: "weight shift emphasizing silhouette",
        composition_trick: "elongated legs perspective",
        environment_detail: "clean studio cyc wall",
        expression_direction: "editorial serious",
        common_mistake: "fabric stiff and unrealistic",
      },
    },
    product_detail: {
      ugc: {
        camera_angle: "top-down 70°",
        distance: "0.5m",
        product_interaction: "hand touching fabric texture or zipper",
        composition_trick: "focus on stitching detail",
        environment_detail: "kasur dengan sprei kusut",
        expression_direction: "no face",
        common_mistake: "fabric lacks texture",
      },
      commercial: {
        camera_angle: "macro side lighting",
        distance: "0.7m",
        product_interaction: "fabric stretched to show weave",
        composition_trick: "shadow reveals texture",
        environment_detail: "studio directional light",
        expression_direction: "none",
        common_mistake: "over-smooth material",
      },
    },
    usage: {
      ugc: {
        camera_angle: "mirror selfie above eye level, 10° downward",
        distance: "1.8m via mirror",
        product_interaction: "adjusting outfit detail (pulling sleeve, fixing hijab, tightening strap)",
        composition_trick: "phone blocking 30-40% face, outfit visible",
        environment_detail: "kamar kos, cermin berdiri, lantai agak berantakan",
        expression_direction: "focused mid-action, not at camera",
        common_mistake: "fabric stiff, no natural fold",
      },
      commercial: {
        camera_angle: "side 25° full-body",
        distance: "3.2m",
        product_interaction: "mid-motion adjusting clothing (walking + fixing)",
        composition_trick: "freeze-frame with fabric movement",
        environment_detail: "clean studio runway-style",
        expression_direction: "neutral editorial",
        common_mistake: "pose frozen instead of mid-action",
      },
    },
    reaction: {
      ugc: {
        camera_angle: "front selfie slightly below eye (5cm)",
        distance: "0.6m",
        product_interaction: "lightly holding outfit edge or bag strap",
        composition_trick: "face 70%, outfit partially visible",
        environment_detail: "di kamar, natural window light",
        expression_direction: "'feeling cute' smile, playful",
        common_mistake: "too posed, outfit barely visible",
      },
      commercial: {
        camera_angle: "tight portrait chest-up",
        distance: "1.6m",
        product_interaction: "hands relaxed, outfit naturally worn",
        composition_trick: "fabric drapes cleanly across frame",
        environment_detail: "studio neutral backdrop",
        expression_direction: "soft confident gaze",
        common_mistake: "too flat, looks like catalog",
      },
    },
    lifestyle: {
      ugc: {
        camera_angle: "wide handheld tilted 7°",
        distance: "2.8m",
        product_interaction: "sitting or walking casually, outfit worn naturally",
        composition_trick: "environment 60% frame, outfit integrated",
        environment_detail: "cafe, kampus, jalan kompleks",
        expression_direction: "candid, not at camera",
        common_mistake: "outfit blends into background",
      },
      commercial: {
        camera_angle: "wide cinematic",
        distance: "4m",
        product_interaction: "walking through scene, outfit flowing",
        composition_trick: "foreground-background depth layers",
        environment_detail: "architectural location or styled set",
        expression_direction: "editorial detached",
        common_mistake: "scene overpowers outfit",
      },
    },
    face_closeup: {
      ugc: {
        camera_angle: "extreme close selfie above eye 3cm",
        distance: "0.3m",
        product_interaction: "subtle fashion element (earring, hijab texture, collar)",
        composition_trick: "face fills frame, fashion detail secondary",
        environment_detail: "window light from side",
        expression_direction: "soft natural relaxed",
        common_mistake: "no visible fabric detail",
      },
      commercial: {
        camera_angle: "macro portrait straight-on",
        distance: "0.9m",
        product_interaction: "fabric (collar/hijab) framing face",
        composition_trick: "sharp skin + fabric texture contrast",
        environment_detail: "studio beauty lighting",
        expression_direction: "still editorial",
        common_mistake: "skin over-retouched, fabric flat",
      },
    },
  },
  food: {
    hero: {
      ugc: {
        camera_angle: "slightly high 20° downward handheld",
        distance: "0.6m",
        product_interaction: "holding drink cup with condensation, straw tilted 30° toward lips",
        composition_trick: "product centered, face partially cropped top",
        environment_detail: "warung kopi pinggir jalan, motor blur background",
        expression_direction: "excited anticipatory smile",
        common_mistake: "drink looks plastic, no condensation",
      },
      commercial: {
        camera_angle: "front eye-level symmetrical",
        distance: "2.5m",
        product_interaction: "product on table, model framing with hands without touching",
        composition_trick: "centered hero, clean spacing",
        environment_detail: "studio cafe minimal set",
        expression_direction: "inviting calm smile",
        common_mistake: "liquid lacks depth or layering",
      },
    },
    product_detail: {
      ugc: {
        camera_angle: "top-down 90°",
        distance: "0.35m",
        product_interaction: "hand breaking snack revealing inside texture",
        composition_trick: "crumbs scattered naturally",
        environment_detail: "meja belajar, buku dan laptop",
        expression_direction: "no face",
        common_mistake: "inside texture hollow or fake",
      },
      commercial: {
        camera_angle: "macro 45° side",
        distance: "0.5m",
        product_interaction: "food sliced with clean edge",
        composition_trick: "sharp highlight on texture layers",
        environment_detail: "studio food set",
        expression_direction: "none",
        common_mistake: "over-perfect, no crumbs",
      },
    },
    usage: {
      ugc: {
        camera_angle: "POV slightly downward",
        distance: "0.5m",
        product_interaction: "hand lifting spoon toward camera mid-motion",
        composition_trick: "slight motion blur on spoon",
        environment_detail: "meja makan kos sederhana",
        expression_direction: "mouth slightly open, ready to eat",
        common_mistake: "motion blur fake or absent",
      },
      commercial: {
        camera_angle: "side 30°",
        distance: "1.8m",
        product_interaction: "sipping drink elegantly",
        composition_trick: "liquid line visible through glass",
        environment_detail: "clean dining setup",
        expression_direction: "refined enjoyment",
        common_mistake: "no realism between lips and straw",
      },
    },
    reaction: {
      ugc: {
        camera_angle: "front selfie",
        distance: "0.5m",
        product_interaction: "holding snack wrapper loosely",
        composition_trick: "face dominates frame",
        environment_detail: "di atas kasur sambil nonton",
        expression_direction: "surprised 'enak banget' face",
        common_mistake: "expression too exaggerated or uncanny",
      },
      commercial: {
        camera_angle: "tight portrait",
        distance: "1.5m",
        product_interaction: "product subtle in frame edge",
        composition_trick: "focus on emotional glow",
        environment_detail: "studio warm tone",
        expression_direction: "soft satisfaction",
        common_mistake: "emotion too flat",
      },
    },
    lifestyle: {
      ugc: {
        camera_angle: "wide handheld slight tilt",
        distance: "2.2m",
        product_interaction: "product on table, user chatting with friend",
        composition_trick: "product foreground, people background",
        environment_detail: "angkringan malam",
        expression_direction: "laughing candid",
        common_mistake: "background feels staged",
      },
      commercial: {
        camera_angle: "wide cinematic",
        distance: "3.5m",
        product_interaction: "product integrated in dining scene",
        composition_trick: "balanced composition layers",
        environment_detail: "styled cafe interior",
        expression_direction: "natural conversation",
        common_mistake: "subjects disconnected from product",
      },
    },
    face_closeup: {
      ugc: {
        camera_angle: "extreme close selfie",
        distance: "0.25m",
        product_interaction: "slight food residue on lips",
        composition_trick: "texture-focused",
        environment_detail: "window light side",
        expression_direction: "satisfied bite expression",
        common_mistake: "skin over-smoothed",
      },
      commercial: {
        camera_angle: "macro beauty",
        distance: "0.8m",
        product_interaction: "clean lips, subtle gloss",
        composition_trick: "highlight lip texture",
        environment_detail: "studio beauty lighting",
        expression_direction: "minimal",
        common_mistake: "plastic lips",
      },
    },
  },
  electronics: {
    hero: {
      ugc: {
        camera_angle: "low angle 15°",
        distance: "0.7m",
        product_interaction: "holding earbuds case open toward camera",
        composition_trick: "device closest to lens, face slightly blurred",
        environment_detail: "meja kerja, kabel berantakan",
        expression_direction: "tech excitement",
        common_mistake: "scale mismatch, device too big",
      },
      commercial: {
        camera_angle: "front symmetrical",
        distance: "2m",
        product_interaction: "product floating illusion",
        composition_trick: "center focus minimalism",
        environment_detail: "dark gradient studio",
        expression_direction: "none or neutral",
        common_mistake: "fake floating shadow",
      },
    },
    product_detail: {
      ugc: {
        camera_angle: "extreme macro 30° side",
        distance: "0.3m",
        product_interaction: "finger tapping surface or opening case hinge",
        composition_trick: "micro details: charging pins, texture",
        environment_detail: "meja kerja, debu halus, goresan ringan",
        expression_direction: "no face",
        common_mistake: "edges too smooth, plastic/metal confusion",
      },
      commercial: {
        camera_angle: "macro straight-on with rim light",
        distance: "0.6m",
        product_interaction: "device aligned, ports visible",
        composition_trick: "edges highlighted with light strip",
        environment_detail: "black glossy studio surface",
        expression_direction: "none",
        common_mistake: "reflections unrealistic or missing",
      },
    },
    usage: {
      ugc: {
        camera_angle: "POV slightly downward",
        distance: "0.5m",
        product_interaction: "plugging charger into phone mid-motion",
        composition_trick: "motion blur on cable",
        environment_detail: "di kasur sambil rebahan",
        expression_direction: "focused",
        common_mistake: "cable not aligned with port",
      },
      commercial: {
        camera_angle: "side 25°",
        distance: "1.8m",
        product_interaction: "inserting earbuds smoothly",
        composition_trick: "clean silhouette profile",
        environment_detail: "minimal tech studio",
        expression_direction: "calm precision",
        common_mistake: "device floating or misaligned",
      },
    },
    reaction: {
      ugc: {
        camera_angle: "front selfie",
        distance: "0.5m",
        product_interaction: "holding device loosely near face",
        composition_trick: "face dominant",
        environment_detail: "meja belajar malam, lampu laptop",
        expression_direction: "impressed surprise",
        common_mistake: "screen content fake or blank",
      },
      commercial: {
        camera_angle: "tight portrait",
        distance: "1.5m",
        product_interaction: "device subtle in hand",
        composition_trick: "facial glow from screen light",
        environment_detail: "dark studio, screen illumination",
        expression_direction: "immersed focus",
        common_mistake: "lighting mismatch with screen",
      },
    },
    lifestyle: {
      ugc: {
        camera_angle: "wide handheld slight tilt",
        distance: "2.2m",
        product_interaction: "device on table while working",
        composition_trick: "foreground device, background activity",
        environment_detail: "meja kerja + kopi + laptop",
        expression_direction: "not at camera",
        common_mistake: "device scale off vs environment",
      },
      commercial: {
        camera_angle: "wide cinematic",
        distance: "3.5m",
        product_interaction: "device in workspace",
        composition_trick: "layered composition depth",
        environment_detail: "designed tech workspace",
        expression_direction: "natural productivity",
        common_mistake: "scene feels staged",
      },
    },
    face_closeup: {
      ugc: {
        camera_angle: "extreme close selfie",
        distance: "0.25m",
        product_interaction: "earbud visible in ear",
        composition_trick: "focus ear + skin texture",
        environment_detail: "window light",
        expression_direction: "relaxed listening",
        common_mistake: "earbud scale wrong",
      },
      commercial: {
        camera_angle: "macro profile",
        distance: "0.8m",
        product_interaction: "device perfectly seated in ear",
        composition_trick: "sharp edge lighting",
        environment_detail: "studio beauty-tech light",
        expression_direction: "calm",
        common_mistake: "no skin pores",
      },
    },
  },
  health: {
    hero: {
      ugc: {
        camera_angle: "eye-level selfie",
        distance: "0.6m",
        product_interaction: "holding supplement bottle near cheek, lid open",
        composition_trick: "label facing camera imperfectly",
        environment_detail: "meja dapur pagi hari",
        expression_direction: "fresh morning energy",
        common_mistake: "label warped or unreadable",
      },
      commercial: {
        camera_angle: "eye-level centered",
        distance: "2.3m",
        product_interaction: "product upright, model behind slightly blurred",
        composition_trick: "product priority focus",
        environment_detail: "clean wellness studio",
        expression_direction: "calm vitality",
        common_mistake: "no hierarchy between model and product",
      },
    },
    product_detail: {
      ugc: {
        camera_angle: "top-down 90°",
        distance: "0.4m",
        product_interaction: "capsules spilled from bottle",
        composition_trick: "random scatter pattern",
        environment_detail: "meja dapur pagi",
        expression_direction: "none",
        common_mistake: "capsules identical clones",
      },
      commercial: {
        camera_angle: "macro 45°",
        distance: "0.6m",
        product_interaction: "capsule split open showing powder",
        composition_trick: "clean symmetry",
        environment_detail: "studio white surface",
        expression_direction: "none",
        common_mistake: "powder texture unrealistic",
      },
    },
    usage: {
      ugc: {
        camera_angle: "POV",
        distance: "0.5m",
        product_interaction: "hand taking capsule toward mouth",
        composition_trick: "mid-action freeze",
        environment_detail: "di dapur pagi",
        expression_direction: "focused routine",
        common_mistake: "capsule floating",
      },
      commercial: {
        camera_angle: "side profile",
        distance: "1.8m",
        product_interaction: "drinking supplement drink",
        composition_trick: "clean silhouette",
        environment_detail: "wellness studio",
        expression_direction: "refreshing",
        common_mistake: "liquid physics wrong",
      },
    },
    reaction: {
      ugc: {
        camera_angle: "selfie",
        distance: "0.5m",
        product_interaction: "holding bottle casually",
        composition_trick: "face dominant",
        environment_detail: "kamar pagi hari",
        expression_direction: "energized fresh",
        common_mistake: "fake smile",
      },
      commercial: {
        camera_angle: "portrait",
        distance: "1.5m",
        product_interaction: "product near chest",
        composition_trick: "glow highlight",
        environment_detail: "clean studio",
        expression_direction: "subtle vitality",
        common_mistake: "too posed",
      },
    },
    lifestyle: {
      ugc: {
        camera_angle: "wide",
        distance: "2.5m",
        product_interaction: "product on table during breakfast",
        composition_trick: "foreground + background life",
        environment_detail: "meja makan rumah",
        expression_direction: "natural",
        common_mistake: "product ignored visually",
      },
      commercial: {
        camera_angle: "wide clean",
        distance: "3.5m",
        product_interaction: "product styled in wellness setup",
        composition_trick: "balanced composition",
        environment_detail: "minimal kitchen studio",
        expression_direction: "none",
        common_mistake: "too sterile",
      },
    },
    face_closeup: {
      ugc: {
        camera_angle: "extreme close",
        distance: "0.25m",
        product_interaction: "none",
        composition_trick: "skin + energy focus",
        environment_detail: "natural light",
        expression_direction: "fresh awake",
        common_mistake: "plastic skin",
      },
      commercial: {
        camera_angle: "macro portrait",
        distance: "0.8m",
        product_interaction: "subtle bottle edge",
        composition_trick: "glow skin",
        environment_detail: "studio",
        expression_direction: "calm vitality",
        common_mistake: "over retouch",
      },
    },
  },
  home: {
    hero: {
      ugc: {
        camera_angle: "slightly high angle",
        distance: "1.2m",
        product_interaction: "hand adjusting decor (candle, organizer)",
        composition_trick: "messy-real arrangement",
        environment_detail: "kamar tidur aesthetic sederhana",
        expression_direction: "calm satisfaction",
        common_mistake: "scene too perfect, not lived-in",
      },
      commercial: {
        camera_angle: "wide interior shot",
        distance: "3.5m",
        product_interaction: "product as centerpiece",
        composition_trick: "balanced interior styling",
        environment_detail: "designed living room set",
        expression_direction: "none",
        common_mistake: "product blends into background",
      },
    },
    product_detail: {
      ugc: {
        camera_angle: "top-down",
        distance: "0.6m",
        product_interaction: "hand touching surface (fabric/wood)",
        composition_trick: "texture focus",
        environment_detail: "kasur / meja real",
        expression_direction: "none",
        common_mistake: "no texture realism",
      },
      commercial: {
        camera_angle: "macro side light",
        distance: "0.8m",
        product_interaction: "static",
        composition_trick: "shadow reveals texture",
        environment_detail: "studio",
        expression_direction: "none",
        common_mistake: "flat lighting",
      },
    },
    usage: {
      ugc: {
        camera_angle: "POV",
        distance: "0.7m",
        product_interaction: "lighting candle / arranging organizer",
        composition_trick: "mid-action",
        environment_detail: "kamar malam",
        expression_direction: "focused",
        common_mistake: "fire/light unrealistic",
      },
      commercial: {
        camera_angle: "side",
        distance: "2m",
        product_interaction: "placing object precisely",
        composition_trick: "clean lines",
        environment_detail: "styled interior",
        expression_direction: "calm",
        common_mistake: "too static",
      },
    },
    reaction: {
      ugc: {
        camera_angle: "selfie",
        distance: "0.6m",
        product_interaction: "background decor visible",
        composition_trick: "face focus",
        environment_detail: "bedroom cozy",
        expression_direction: "satisfied",
        common_mistake: "disconnect from product",
      },
      commercial: {
        camera_angle: "portrait",
        distance: "1.5m",
        product_interaction: "subtle",
        composition_trick: "soft lighting",
        environment_detail: "studio interior",
        expression_direction: "calm",
        common_mistake: "emotion flat",
      },
    },
    lifestyle: {
      ugc: {
        camera_angle: "wide",
        distance: "3m",
        product_interaction: "product in room context",
        composition_trick: "environment dominant",
        environment_detail: "kamar aesthetic",
        expression_direction: "none",
        common_mistake: "product too hidden",
      },
      commercial: {
        camera_angle: "wide symmetrical",
        distance: "4m",
        product_interaction: "centerpiece",
        composition_trick: "interior design balance",
        environment_detail: "designed set",
        expression_direction: "none",
        common_mistake: "too catalog-like",
      },
    },
    face_closeup: {
      ugc: {
        camera_angle: "close",
        distance: "0.3m",
        product_interaction: "none",
        composition_trick: "emotion focus",
        environment_detail: "soft light",
        expression_direction: "relaxed",
        common_mistake: "irrelevant to product",
      },
      commercial: {
        camera_angle: "portrait close",
        distance: "1m",
        product_interaction: "subtle hint",
        composition_trick: "clean",
        environment_detail: "studio",
        expression_direction: "calm",
        common_mistake: "no context",
      },
    },
  },
  other: {
    hero: {
      ugc: {
        camera_angle: "front handheld slight tilt",
        distance: "0.8m",
        product_interaction: "holding product toward lens with energy",
        composition_trick: "forced perspective enlargement",
        environment_detail: "random real-life background",
        expression_direction: "high energy",
        common_mistake: "distortion unnatural",
      },
      commercial: {
        camera_angle: "clean frontal",
        distance: "2.5m",
        product_interaction: "product isolated and centered",
        composition_trick: "minimalist composition",
        environment_detail: "studio neutral",
        expression_direction: "neutral",
        common_mistake: "boring flat lighting",
      },
    },
    product_detail: {
      ugc: {
        camera_angle: "macro",
        distance: "0.4m",
        product_interaction: "touching surface",
        composition_trick: "detail focus",
        environment_detail: "real table",
        expression_direction: "none",
        common_mistake: "no scale reference",
      },
      commercial: {
        camera_angle: "macro clean",
        distance: "0.6m",
        product_interaction: "static",
        composition_trick: "isolated",
        environment_detail: "studio",
        expression_direction: "none",
        common_mistake: "too generic",
      },
    },
    usage: {
      ugc: {
        camera_angle: "POV",
        distance: "0.6m",
        product_interaction: "using product naturally",
        composition_trick: "mid-action",
        environment_detail: "daily setting",
        expression_direction: "focused",
        common_mistake: "unclear usage",
      },
      commercial: {
        camera_angle: "side",
        distance: "2m",
        product_interaction: "clean demonstration",
        composition_trick: "clear visibility",
        environment_detail: "studio",
        expression_direction: "neutral",
        common_mistake: "too staged",
      },
    },
    reaction: {
      ugc: {
        camera_angle: "selfie",
        distance: "0.5m",
        product_interaction: "holding casually",
        composition_trick: "face dominant",
        environment_detail: "any real space",
        expression_direction: "honest reaction",
        common_mistake: "fake expression",
      },
      commercial: {
        camera_angle: "portrait",
        distance: "1.5m",
        product_interaction: "subtle",
        composition_trick: "emotion clean",
        environment_detail: "studio",
        expression_direction: "controlled",
        common_mistake: "too polished",
      },
    },
    lifestyle: {
      ugc: {
        camera_angle: "wide",
        distance: "2.5m",
        product_interaction: "in context",
        composition_trick: "environment story",
        environment_detail: "daily Indonesian life",
        expression_direction: "natural",
        common_mistake: "no focus",
      },
      commercial: {
        camera_angle: "wide styled",
        distance: "3.5m",
        product_interaction: "placed in set",
        composition_trick: "balanced",
        environment_detail: "studio set",
        expression_direction: "none",
        common_mistake: "generic catalog feel",
      },
    },
    face_closeup: {
      ugc: {
        camera_angle: "close",
        distance: "0.3m",
        product_interaction: "minimal",
        composition_trick: "face focus",
        environment_detail: "natural light",
        expression_direction: "real",
        common_mistake: "irrelevant",
      },
      commercial: {
        camera_angle: "portrait close",
        distance: "1m",
        product_interaction: "subtle",
        composition_trick: "clean",
        environment_detail: "studio",
        expression_direction: "neutral",
        common_mistake: "no link to product",
      },
    },
  },
};

// ── Compressed Realism Directives ───────────────────────────────
const UGC_REALISM = `PHOTOREALISM — SMARTPHONE UGC:
Smartphone 24-28mm f/1.8. Natural daylight only, uneven exposure allowed.
Skin: visible pores, blemishes, uneven tone, non-retouched.
Color: neutral-warm, low contrast, inconsistent white balance.
NEGATIVE: smooth skin, studio lighting, symmetry, DSLR, CGI, 3D, airbrushed.`;

const COMMERCIAL_REALISM = `PHOTOREALISM — EDITORIAL STUDIO:
Full-frame DSLR 85mm f/2.0. Soft key + subtle rim, 5400K.
Skin: visible pores refined, matte, controlled highlights.
Color: clean premium, medium contrast, warm luxury.
NEGATIVE: CGI, 3D, plastic skin, over-retouched, hyper HDR, cartoon.`;

const REALISM_BOOST: Record<RealismLevel, string> = {
  standard: "",
  ultra: "ULTRA: Every pore, micro-blemishes, oil sheen, flyaway hairs, fabric grain.",
  raw_phone: "RAW PHONE: Digital noise, compression, uneven white balance, fingerprint on lens.",
};

// ── Behavior & Business Rule Directives ─────────────────────────
const UGC_BEHAVIOR = `UGC BEHAVIOR: Casual TikTok review feel. Mid-sentence expression. Natural hand grip shifts. Slight posture imbalance. Attention split between product and camera. Spontaneous not posed.`;

const AFFILIATE_PRIORITY = `PRODUCT VISIBILITY: Product clearly visible and readable. Logo unobstructed. Pose showcases product. Lighting supports product clarity.`;

const FIRST_FRAME = `THUMBNAIL: Product readable at small scale. Central zone placement. Branding visible without zoom. Clear product-background contrast.`;

// ── Texture hints per category ──────────────────────────────────
const CAT_TEXTURE: Record<ProductCategory, string> = {
  skincare: "cream texture, moisture, serum droplets",
  fashion: "fabric wrinkles, folds, stitching",
  food: "steam, oil shine, crumbs, condensation",
  electronics: "fingerprints on glass, screen reflections, LED",
  health: "supplement texture, pill detail",
  home: "wood grain, fabric weave, shadows",
  other: "natural texture, realistic scale",
};

// ── Skin tone (session-locked) ──────────────────────────────────
const SKIN_TONES = ["sawo matang natural Indonesian skin", "kuning langsat tone", "healthy warm Indonesian complexion"];
export function pickSessionSkinTone(): string {
  return SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
}

// ═══ SMART PROMPT COMPILER ═════════════════════════════════════
// Target: 250-280 words. Merges + deduplicates layers.

function compilePrompt(opts: {
  mode: ContentMode;
  shotType: ShotTypeKey;
  shotLabel: string;
  productDNA: ProductDNA;
  characterDescription: string;
  environment: { label: string; description: string };
  realismLevel: RealismLevel;
  skinTone: string;
  shotIndex: number;
  totalShots: number;
}): string {
  const {
    mode,
    shotType,
    productDNA,
    characterDescription,
    environment,
    realismLevel,
    skinTone,
    shotIndex,
    totalShots,
  } = opts;
  const cat = productDNA.category || "other";
  const dir = (SD[cat]?.[shotType] || SD.other.hero)[mode === "ugc" ? "ugc" : "commercial"];
  const isHero = shotType === "hero";
  const isProdOnly = shotType === "product_detail";
  const isUGC = mode === "ugc";

  const p: string[] = [];

  // TIER 1: Realism + Anti-grid + Anchors
  p.push(isUGC ? UGC_REALISM : COMMERCIAL_REALISM);
  const boost = REALISM_BOOST[realismLevel];
  if (boost) p.push(boost);

  if (!isProdOnly && characterDescription) {
    p.push(
      `CHARACTER (identical all shots): ${characterDescription}. Skin: ${skinTone}. Expression: ${dir.expression_direction}.`,
    );
  }

  p.push(
    `PRODUCT: ${productDNA.product_description}. ${productDNA.dominant_color} ${productDNA.packaging_type}. ${CAT_TEXTURE[cat] || ""}.`,
  );

  // TIER 2: Shot Director
  p.push(`SHOT: ${opts.shotLabel}. Camera: ${dir.camera_angle}, ${dir.distance}. ${dir.composition_trick}.`);
  p.push(`INTERACTION: ${dir.product_interaction}.`);

  const envDesc = environment.description || dir.environment_detail;
  p.push(`ENVIRONMENT: ${envDesc}.`);

  // TIER 3: Conditional
  if (isUGC && !isProdOnly) p.push(UGC_BEHAVIOR);
  p.push(AFFILIATE_PRIORITY);
  if (isHero) p.push(FIRST_FRAME);

  if (dir.common_mistake) p.push(`AVOID: ${dir.common_mistake}.`);

  if (totalShots > 1) {
    p.push(
      `CONSISTENCY: Shot ${shotIndex + 1}/${totalShots}. Same person, product, skin tone. Only angle and interaction change.`,
    );
  }

  return p.join("\n\n");
}

// ── Public API: Plan Shots ──────────────────────────────────────
export function planImageShots(config: GenerationConfig): ImageShotPlan[] {
  const { mode, selectedShots, productDNA, characterDescription, environment, realismLevel } = config;
  const skinTone = pickSessionSkinTone();

  return selectedShots.map((shotKey, idx) => {
    const def = SHOT_TYPES.find((s) => s.key === shotKey)!;
    const prompt = compilePrompt({
      mode,
      shotType: shotKey,
      shotLabel: def.name.id,
      productDNA,
      characterDescription,
      environment,
      realismLevel,
      skinTone,
      shotIndex: idx,
      totalShots: selectedShots.length,
    });

    return { shotIndex: idx, shotType: shotKey, shotLabel: def.name.id, storyRole: def.name.en, prompt };
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
