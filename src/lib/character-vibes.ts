// ═══════════════════════════════════════════════════════════════
// GENBOX Character Creation — Form Options & Prompt Mappings
// ═══════════════════════════════════════════════════════════════

// ── SKIN TONE (Indonesian-specific) ──────────────────────────
export const SKIN_TONES = [
  { value: "cerah", label: "Cerah", hex: "#F5D5B8", prompt: "light fair skin with warm undertone" },
  { value: "kuning_langsat", label: "Kuning Langsat", hex: "#E8C69A", prompt: "light warm golden-tan skin" },
  { value: "sawo_matang", label: "Sawo Matang", hex: "#B8885C", prompt: "warm medium-brown skin tone" },
  { value: "tan", label: "Tan", hex: "#A0724C", prompt: "warm tan complexion with golden undertone" },
  { value: "gelap", label: "Gelap", hex: "#5C3A1E", prompt: "deep warm dark-brown skin" },
];

// ── FACE TYPE ────────────────────────────────────────────────
export const FACE_TYPES = [
  { value: "bulat", label: "Bulat", prompt: "round face shape with soft jawline and full cheeks" },
  { value: "oval", label: "Oval", prompt: "oval face shape with balanced proportions and gently curved jawline" },
  { value: "tirus", label: "Tirus", prompt: "slim elongated face with defined cheekbones and narrow jawline" },
  { value: "kotak", label: "Kotak", prompt: "square face shape with strong jawline and wide forehead" },
  { value: "chubby", label: "Chubby", prompt: "full rounded face with soft plump cheeks and gentle jawline" },
];

// ── HAIR STYLE + COLOR (merged, gender-aware) ────────────────
export const HAIR_STYLES_FEMALE = [
  {
    value: "hitam_lurus",
    label: "Hitam Lurus Panjang",
    prompt: "straight black hair falling past shoulders, smooth and sleek",
  },
  { value: "hitam_sebahu", label: "Hitam Sebahu", prompt: "straight black hair at shoulder length, clean cut" },
  { value: "hitam_bob", label: "Bob Pendek Hitam", prompt: "short black bob haircut, chin-length, neat" },
  {
    value: "hitam_wavy",
    label: "Hitam Bergelombang",
    prompt: "natural wavy black hair, loose soft waves, medium length",
  },
  {
    value: "coklat_lurus",
    label: "Coklat / Highlight",
    prompt: "dark brown hair with subtle caramel highlights, straight or slight wave",
  },
  { value: "ash_brown", label: "Ash Brown", prompt: "cool-toned ash brown dyed hair, trendy Korean-inspired color" },
  {
    value: "ponytail",
    label: "Ponytail Rapi",
    prompt: "black hair pulled back in a neat low ponytail, face fully visible",
  },
  { value: "bun", label: "Bun / Cepol", prompt: "black hair in a neat casual bun, stray wisps framing face" },
];

export const HAIR_STYLES_MALE = [
  { value: "pendek_rapi", label: "Pendek Rapi", prompt: "short neat black hair, clean-cut sides, well-groomed" },
  { value: "undercut", label: "Undercut", prompt: "undercut hairstyle with longer top swept to one side, black hair" },
  { value: "side_part", label: "Side Part", prompt: "classic side-parted black hair, neatly combed, professional" },
  {
    value: "messy_textured",
    label: "Messy Textured",
    prompt: "textured messy black hair, casually styled, trendy volume",
  },
  { value: "buzz_cut", label: "Buzz Cut", prompt: "very short buzz cut black hair, clean and minimal" },
  {
    value: "comma_hair",
    label: "Comma Hair",
    prompt: "Korean-style comma hair, black, fringe falling softly to one side",
  },
];

// ── KONDISI KULIT (skin condition — REALISM CORE) ────────────
export const SKIN_CONDITIONS = [
  {
    value: "mulus",
    label: "Mulus (Sehat & Bersih)",
    prompt:
      "clear healthy skin with natural texture and minimal visible pores, clean even complexion with subtle natural glow",
  },
  {
    value: "jerawat_aktif",
    label: "Jerawat Aktif",
    prompt:
      "realistic acne-prone skin with several active small pimples on cheeks and chin area, visible redness around breakouts, natural oily sheen on affected areas, real and not hidden",
  },
  {
    value: "bekas_jerawat",
    label: "Bekas Jerawat",
    prompt:
      "post-acne skin with visible dark spots and shallow pitted scars on cheeks, uneven skin texture, hyperpigmentation marks in various stages of fading",
  },
  {
    value: "flek_hitam",
    label: "Flek Hitam / Hiperpigmentasi",
    prompt:
      "skin with visible dark spots and hyperpigmentation patches, uneven skin tone especially on cheeks and forehead, common sun damage marks",
  },
  {
    value: "berminyak",
    label: "Berminyak (T-Zone)",
    prompt:
      "visibly oily skin with noticeable shine on forehead, nose, and chin (T-zone), larger visible pores on nose and cheeks, dewy but clearly oily not glowing",
  },
  {
    value: "kering",
    label: "Kering / Kusam",
    prompt:
      "dry dull skin with visible flaky patches, lacks natural glow, slight tightness visible around mouth and cheeks, matte appearance without healthy sheen",
  },
  {
    value: "kombinasi",
    label: "Kombinasi",
    prompt:
      "combination skin — oily and shiny on T-zone (forehead, nose, chin) but dry and slightly flaky on cheeks, visible pore size difference between zones",
  },
];

// ── LEVEL MAKEUP ─────────────────────────────────────────────
export const MAKEUP_LEVELS = [
  {
    value: "tanpa",
    label: "Tanpa Makeup",
    prompt:
      "completely bare face with zero makeup, natural skin texture fully visible, natural lip color, no brow filling, no concealer — raw real skin",
  },
  {
    value: "natural",
    label: "Natural (No-Makeup Look)",
    prompt:
      "barely-there makeup: very light concealer under eyes only, soft tinted lip balm, natural brows lightly groomed, no visible foundation — looks like naturally good skin",
  },
  {
    value: "daily",
    label: "Daily Makeup",
    prompt:
      "everyday casual makeup: light foundation or BB cream, subtle blush on cheeks, soft brown eyeshadow, natural lip tint, filled but natural-looking brows — polished but not overdone",
  },
  {
    value: "glam",
    label: "Glam / Full Makeup",
    prompt:
      "full makeup look: visible foundation with good coverage, defined brows, winged eyeliner, false lash effect, contoured cheekbones, bold lip color, highlighted cheekbones — TikTok beauty creator level",
  },
];

// ── HIJAB STYLE (female only) ────────────────────────────────
export const HIJAB_STYLES = [
  { value: "tanpa", label: "Tanpa Hijab", prompt: "no hijab, hair fully visible and styled" },
  {
    value: "pashmina",
    label: "Pashmina",
    prompt: "pashmina hijab loosely draped, soft fabric, covers chest, shows face shape clearly, casual everyday style",
  },
  {
    value: "casual_modern",
    label: "Casual Modern",
    prompt:
      "modern casual hijab style, slightly pulled back to show more face, contemporary look with volume at the crown, trendy styling",
  },
  {
    value: "syari",
    label: "Syar'i",
    prompt:
      "full coverage syar'i hijab extending below chest, modest draping, neat and clean, no hair visible, only face oval exposed",
  },
];

// ── VIBE / PERSONALITY ───────────────────────────────────────
export const VIBES = [
  {
    value: "ceria",
    label: "Ceria",
    prompt:
      "cheerful bright energy, genuine wide smile, eyes slightly crinkled with joy, approachable and enthusiastic — like someone excited to share a product they love",
  },
  {
    value: "kalem",
    label: "Kalem",
    prompt:
      "calm composed energy, soft gentle expression, slight closed-mouth smile, relaxed eyes, serene and trustworthy — like someone giving honest quiet recommendation",
  },
  {
    value: "ramah",
    label: "Ramah / Hangat",
    prompt:
      "warm friendly energy, genuine welcoming smile, open expression, soft approachable eyes — like a friend recommending their favorite product",
  },
  {
    value: "profesional",
    label: "Profesional",
    prompt:
      "confident professional energy, composed poised expression, subtle confident smile, direct assured gaze — like a beauty consultant or brand expert",
  },
  {
    value: "cool",
    label: "Cool / Santai",
    prompt:
      "laid-back cool energy, relaxed half-smile or neutral expression, slightly narrowed confident eyes, effortless attitude — like someone who doesn't try hard but looks great",
  },
];

// ── BODY TYPE ────────────────────────────────────────────────
export const BODY_TYPES = [
  { value: "petite", label: "Petite / Slim", prompt: "petite slim body frame, slender proportions" },
  { value: "average", label: "Average", prompt: "average medium body build, natural proportions" },
  { value: "curvy", label: "Curvy", prompt: "curvy body type with fuller proportions, soft rounded figure" },
  { value: "athletic", label: "Athletic / Fit", prompt: "athletic fit body build, toned and defined" },
];

// ── AGE RANGE ────────────────────────────────────────────────
export const AGE_RANGES = [
  { value: "teen", label: "18–22", prompt: "18-22 years old, youthful fresh face, smooth skin" },
  { value: "young_adult", label: "23–27", prompt: "23-27 years old young adult, early career energy" },
  { value: "adult", label: "28–35", prompt: "28-35 years old adult, mature but youthful" },
  { value: "mature", label: "36–45", prompt: "36-45 years old, mature with visible laugh lines and natural aging" },
];

// ── OUTFIT STYLE ─────────────────────────────────────────────
export const OUTFIT_STYLES = [
  {
    value: "casual",
    label: "Casual Sehari-hari",
    prompt: "casual everyday clothing — oversized t-shirt or simple blouse, comfortable pants or jeans, relaxed fit",
  },
  {
    value: "trendy",
    label: "Trendy TikTok",
    prompt:
      "trendy TikTok-style outfit — cropped top or oversized hoodie, high-waisted pants, layered accessories, Instagram-worthy",
  },
  {
    value: "feminine",
    label: "Feminine / Soft",
    prompt: "feminine soft clothing — flowy dress or skirt, pastel colors, delicate fabric, romantic style",
  },
  {
    value: "streetwear",
    label: "Streetwear",
    prompt: "streetwear urban style — graphic tee, cargo pants or joggers, sneakers, bold accessories, layered look",
  },
  {
    value: "semiformal",
    label: "Semi-formal",
    prompt:
      "semi-formal smart casual — blazer over simple top, tailored pants or neat skirt, polished but not corporate",
  },
];

// ── ACCESSORIES ──────────────────────────────────────────────
export const ACCESSORIES = [
  { value: "tidak_ada", label: "Tidak Ada", prompt: "" },
  {
    value: "kacamata",
    label: "Kacamata",
    prompt: "wearing stylish prescription glasses or clear lens glasses, modern frame shape",
  },
  { value: "anting", label: "Anting", prompt: "wearing small simple earrings, subtle and elegant" },
  { value: "kalung", label: "Kalung", prompt: "wearing a simple thin necklace, minimal and delicate" },
];

// ── TEMPLATE PRESETS (quick-fill templates) ──────────────────

export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  gender: "female" | "male";
  previewGradient: string;
  config: Partial<CharacterFormData>;
}

export interface CharacterFormData {
  name: string;
  gender: "female" | "male";
  ageRange: string;
  skinTone: string;
  faceType: string;
  hairStyle: string;
  skinCondition: string;
  makeupLevel: string;
  hijabStyle: string;
  vibe: string;
  bodyType: string;
  outfitStyle: string;
  accessories: string;
  customNotes: string;
}

export const DEFAULT_FORM: CharacterFormData = {
  name: "",
  gender: "female",
  ageRange: "young_adult",
  skinTone: "sawo_matang",
  faceType: "",
  hairStyle: "",
  skinCondition: "mulus",
  makeupLevel: "natural",
  hijabStyle: "tanpa",
  vibe: "ramah",
  bodyType: "average",
  outfitStyle: "casual",
  accessories: "tidak_ada",
  customNotes: "",
};

export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    id: "hijab_casual",
    name: "Hijab Casual",
    description: "Gaya hijab modern, santai, cocok untuk skincare & lifestyle",
    gender: "female",
    previewGradient: "linear-gradient(135deg, hsl(30 40% 72%) 0%, hsl(25 50% 55%) 100%)",
    config: {
      skinTone: "sawo_matang",
      faceType: "oval",
      hairStyle: "hitam_lurus",
      skinCondition: "mulus",
      makeupLevel: "natural",
      hijabStyle: "casual_modern",
      vibe: "ramah",
      bodyType: "average",
      outfitStyle: "casual",
      accessories: "tidak_ada",
      ageRange: "young_adult",
    },
  },
  {
    id: "beauty_reviewer",
    name: "Beauty Reviewer",
    description: "Tampilan glowing untuk konten skincare & beauty",
    gender: "female",
    previewGradient: "linear-gradient(135deg, hsl(340 30% 70%) 0%, hsl(320 25% 55%) 100%)",
    config: {
      skinTone: "kuning_langsat",
      faceType: "oval",
      hairStyle: "hitam_lurus",
      skinCondition: "mulus",
      makeupLevel: "daily",
      hijabStyle: "tanpa",
      vibe: "ceria",
      bodyType: "petite",
      outfitStyle: "feminine",
      accessories: "anting",
      ageRange: "young_adult",
    },
  },
  {
    id: "ibu_muda",
    name: "Ibu Muda",
    description: "Hangat dan relatable untuk konten parenting & rumah tangga",
    gender: "female",
    previewGradient: "linear-gradient(135deg, hsl(340 25% 65%) 0%, hsl(20 35% 60%) 100%)",
    config: {
      skinTone: "sawo_matang",
      faceType: "bulat",
      hairStyle: "ponytail",
      skinCondition: "kombinasi",
      makeupLevel: "natural",
      hijabStyle: "pashmina",
      vibe: "ramah",
      bodyType: "average",
      outfitStyle: "casual",
      accessories: "tidak_ada",
      ageRange: "adult",
    },
  },
  {
    id: "cowok_urban",
    name: "Cowok Urban",
    description: "Gaya streetwear kasual untuk lifestyle & tech review",
    gender: "male",
    previewGradient: "linear-gradient(135deg, hsl(210 25% 35%) 0%, hsl(180 20% 25%) 100%)",
    config: {
      skinTone: "sawo_matang",
      faceType: "kotak",
      hairStyle: "messy_textured",
      skinCondition: "berminyak",
      makeupLevel: "tanpa",
      hijabStyle: "tanpa",
      vibe: "cool",
      bodyType: "athletic",
      outfitStyle: "streetwear",
      accessories: "tidak_ada",
      ageRange: "young_adult",
    },
  },
  {
    id: "cowok_gym",
    name: "Cowok Gym",
    description: "Atletis dan energik untuk suplemen & sportswear",
    gender: "male",
    previewGradient: "linear-gradient(135deg, hsl(150 30% 35%) 0%, hsl(170 25% 25%) 100%)",
    config: {
      skinTone: "tan",
      faceType: "kotak",
      hairStyle: "buzz_cut",
      skinCondition: "mulus",
      makeupLevel: "tanpa",
      hijabStyle: "tanpa",
      vibe: "profesional",
      bodyType: "athletic",
      outfitStyle: "casual",
      accessories: "tidak_ada",
      ageRange: "young_adult",
    },
  },
];

// ── HELPER: Build prompt from form data ──────────────────────
export function buildCharacterPromptContext(form: CharacterFormData): string {
  const parts: string[] = [];

  const skinTone = SKIN_TONES.find((s) => s.value === form.skinTone);
  const faceType = FACE_TYPES.find((f) => f.value === form.faceType);
  const hairStyles = form.gender === "female" ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE;
  const hairStyle = hairStyles.find((h) => h.value === form.hairStyle);
  const skinCondition = SKIN_CONDITIONS.find((s) => s.value === form.skinCondition);
  const makeup = MAKEUP_LEVELS.find((m) => m.value === form.makeupLevel);
  const hijab = HIJAB_STYLES.find((h) => h.value === form.hijabStyle);
  const vibe = VIBES.find((v) => v.value === form.vibe);
  const body = BODY_TYPES.find((b) => b.value === form.bodyType);
  const age = AGE_RANGES.find((a) => a.value === form.ageRange);
  const outfit = OUTFIT_STYLES.find((o) => o.value === form.outfitStyle);
  const accessory = ACCESSORIES.find((a) => a.value === form.accessories);

  if (age) parts.push(`Age: ${age.prompt}`);
  if (skinTone) parts.push(`Skin: ${skinTone.prompt}`);
  if (faceType) parts.push(`Face: ${faceType.prompt}`);
  if (hairStyle) parts.push(`Hair: ${hairStyle.prompt}`);
  if (form.gender === "female" && hijab && hijab.value !== "tanpa") {
    parts.push(`Hijab: ${hijab.prompt}`);
  }
  if (body) parts.push(`Body: ${body.prompt}`);
  if (skinCondition) parts.push(`Skin condition: ${skinCondition.prompt}`);
  if (makeup) parts.push(`Makeup: ${makeup.prompt}`);
  if (vibe) parts.push(`Expression/vibe: ${vibe.prompt}`);
  if (outfit) parts.push(`Outfit: ${outfit.prompt}`);
  if (accessory && accessory.value !== "tidak_ada") parts.push(`Accessory: ${accessory.prompt}`);
  if (form.customNotes) parts.push(`Additional notes: ${form.customNotes}`);

  return parts.join("\n");
}

// ── FIELDS HIDDEN WHEN REFERENCE PHOTO EXISTS ────────────────
export const FIELDS_HIDDEN_WITH_REFERENCE = ["skinTone", "faceType", "hairStyle", "bodyType"] as const;

// These fields are ALWAYS shown (user might want different style than their photo)
export const FIELDS_ALWAYS_SHOWN = [
  "name",
  "gender",
  "ageRange",
  "skinCondition",
  "makeupLevel",
  "hijabStyle",
  "vibe",
  "outfitStyle",
  "accessories",
  "customNotes",
] as const;
