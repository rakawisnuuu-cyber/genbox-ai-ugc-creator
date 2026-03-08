export interface VibePackConfig {
  hijab: string;
  expression: string;
  outfit: string;
  skinDetail: string;
  lighting: string;
  setting: string;
  hairStyle?: string;
  ageRange?: string;
  bodyType?: string;
  imperfection?: string;
  environment?: string;
}

export interface VibePack {
  id: string;
  name: string;
  description: string;
  tags: string[];
  previewGradient: string;
  config: VibePackConfig;
}

export const VIBE_PACKS: VibePack[] = [
  {
    id: "hijab_casual",
    name: "Hijab Casual",
    description: "Gaya hijab modern yang santai dan relatable untuk UGC",
    tags: ["Hijab Modern", "Outfit Kasual", "Natural Light", "Warm Tone"],
    previewGradient: "linear-gradient(135deg, hsl(30 40% 72%) 0%, hsl(25 50% 55%) 100%)",
    config: {
      hijab: "modern pastel hijab, loosely draped, contemporary style",
      expression: "natural friendly smile, approachable, relaxed",
      outfit: "oversized sage/cream cotton t-shirt, casual jeans or wide pants",
      skinDetail: "natural Indonesian medium brown skin, minimal makeup, natural texture",
      lighting: "warm natural daylight, soft golden undertones",
      setting: "lifestyle indoor, cozy warm environment",
      hairStyle: "Hijab Modern",
      ageRange: "20-28",
      imperfection: "natural",
      environment: "indoor_home",
      bodyType: "average",
    },
  },
  {
    id: "clean_girl",
    name: "Clean Girl",
    description: "Tampilan natural fresh dengan makeup minimal dan lighting lembut",
    tags: ["Natural Beauty", "Minimal Makeup", "Soft Light", "Fresh"],
    previewGradient: "linear-gradient(135deg, hsl(40 30% 85%) 0%, hsl(20 25% 75%) 100%)",
    config: {
      hijab: "none, hair visible",
      expression: "soft confident, subtle gentle smile, serene",
      outfit: "clean minimal basics — white or beige tee, simple gold necklace",
      skinDetail: "natural dewy skin, no-makeup makeup look, healthy glow",
      lighting: "soft diffused natural light, window light feel",
      setting: "clean minimalist interior, neutral tones",
      hairStyle: "Lurus Panjang",
      ageRange: "20-28",
      imperfection: "natural",
      environment: "simple",
      bodyType: "petite",
    },
  },
  {
    id: "professional",
    name: "Professional",
    description: "Tampilan formal dan polished untuk konten bisnis dan corporate",
    tags: ["Formal", "Studio", "Polished", "Corporate"],
    previewGradient: "linear-gradient(135deg, hsl(220 15% 45%) 0%, hsl(210 20% 30%) 100%)",
    config: {
      hijab: "optional — can be with or without hijab",
      expression: "confident approachable, poised professional smile",
      outfit: "business casual blazer or formal blouse, earthy or navy tones",
      skinDetail: "polished natural skin, well-groomed, professional makeup",
      lighting: "studio softbox lighting, professional portrait setup",
      setting: "office environment or studio backdrop, clean professional",
      ageRange: "25-35",
      imperfection: "perfect",
      environment: "studio",
      bodyType: "average",
    },
  },
  {
    id: "street_style",
    name: "Street Style",
    description: "Gaya urban trendy untuk konten lifestyle dan streetwear",
    tags: ["Urban", "Trendy", "Outdoor", "Bold"],
    previewGradient: "linear-gradient(135deg, hsl(200 20% 40%) 0%, hsl(280 25% 35%) 100%)",
    config: {
      hijab: "optional — modern turban style or no hijab",
      expression: "confident bold, edgy attitude, slight smirk or serious",
      outfit: "streetwear trendy — oversized hoodie, graphic tee, sneakers, layered accessories",
      skinDetail: "natural skin with edge, healthy urban look",
      lighting: "outdoor golden hour or urban neon-tinted ambient",
      setting: "city street, graffiti wall, urban environment",
      hairStyle: "Messy Textured",
      ageRange: "18-25",
      imperfection: "natural",
      environment: "outdoor_urban",
      bodyType: "athletic",
    },
  },
  {
    id: "aesthetic_minimalis",
    name: "Aesthetic Minimalis",
    description: "Tampilan soft dan dreamy dengan palet warna earth tone",
    tags: ["Soft", "Muted Tones", "Dreamy", "Clean"],
    previewGradient: "linear-gradient(135deg, hsl(30 15% 80%) 0%, hsl(15 20% 70%) 100%)",
    config: {
      hijab: "optional — if yes, neutral earth tone hijab",
      expression: "serene gentle, calm peaceful, slight dreamy look",
      outfit: "monochrome earth tones — beige cardigan, cream knit, minimal jewelry",
      skinDetail: "smooth natural, soft-focus quality, gentle porcelain-like",
      lighting: "window light, soft diffused, slightly warm",
      setting: "minimalist interior, clean space, neutral palette room",
      ageRange: "20-30",
      imperfection: "natural",
      environment: "simple",
      bodyType: "petite",
    },
  },
  {
    id: "ibu_muda",
    name: "Ibu Muda",
    description: "Tampilan hangat dan relatable untuk konten parenting dan rumah tangga",
    tags: ["Mom Vibes", "Approachable", "Warm", "Home"],
    previewGradient: "linear-gradient(135deg, hsl(340 25% 65%) 0%, hsl(20 35% 60%) 100%)",
    config: {
      hijab: "optional — if yes, comfortable casual hijab",
      expression: "warm motherly, genuine caring smile, approachable",
      outfit: "comfortable casual — soft cardigan, cotton dress, gentle fabrics",
      skinDetail: "natural relatable skin, minimal makeup, warm natural glow",
      lighting: "warm home lighting, soft tungsten feel",
      setting: "home environment — kitchen, living room, or cozy interior",
      hairStyle: "Ponytail Rapi",
      ageRange: "28-38",
      bodyType: "average",
      imperfection: "natural",
      environment: "indoor_home",
    },
  },
  {
    id: "cowok_urban",
    name: "Cowok Urban",
    description: "Gaya streetwear kasual untuk konten lifestyle cowok",
    tags: ["Male", "Streetwear", "Urban", "Casual"],
    previewGradient: "linear-gradient(135deg, hsl(210 25% 35%) 0%, hsl(180 20% 25%) 100%)",
    config: {
      hijab: "none, male character",
      expression: "relaxed confident, slight smirk, laid-back attitude",
      outfit: "oversized graphic tee or flannel shirt, jogger pants, sneakers, simple watch",
      skinDetail: "natural Indonesian medium brown skin, slight stubble possible, realistic male skin texture",
      lighting: "outdoor golden hour, warm directional light",
      setting: "urban street, coffee shop exterior, city park bench",
      hairStyle: "textured crop or messy comma hair",
      ageRange: "20-28",
      imperfection: "natural",
      environment: "outdoor_urban",
      bodyType: "athletic",
    },
  },
  {
    id: "bapak_profesional",
    name: "Bapak Profesional",
    description: "Tampilan mature dan polished untuk konten bisnis pria",
    tags: ["Male", "Professional", "Mature", "Formal"],
    previewGradient: "linear-gradient(135deg, hsl(220 20% 30%) 0%, hsl(200 15% 20%) 100%)",
    config: {
      hijab: "none, male character",
      expression: "confident warm, professional trustworthy smile, composed",
      outfit: "smart casual blazer over polo shirt or crisp button-down, chinos, leather watch",
      skinDetail: "mature Indonesian male skin, well-groomed, clean-shaven or neat beard",
      lighting: "studio softbox or office ambient, professional portrait lighting",
      setting: "modern office, co-working space, or clean studio backdrop",
      hairStyle: "neat side part or short clean cut",
      ageRange: "35-50",
      imperfection: "natural",
      environment: "studio",
      bodyType: "average",
    },
  },
  {
    id: "cowok_gym",
    name: "Cowok Gym",
    description: "Tampilan atletis energik untuk konten fitness dan sportswear",
    tags: ["Male", "Athletic", "Fitness", "Energetic"],
    previewGradient: "linear-gradient(135deg, hsl(150 30% 35%) 0%, hsl(170 25% 25%) 100%)",
    config: {
      hijab: "none, male character",
      expression: "energetic determined, strong focused gaze, motivated",
      outfit: "fitted dri-fit tank top or compression shirt, training shorts, sport shoes, wristband",
      skinDetail: "toned Indonesian male skin, slight sweat sheen, healthy athletic glow",
      lighting: "bright natural outdoor light or gym interior lighting, high contrast",
      setting: "outdoor running track, gym interior, or park workout area",
      hairStyle: "buzz cut or short swept back",
      ageRange: "22-30",
      imperfection: "natural",
      environment: "outdoor_urban",
      bodyType: "athletic",
    },
  },
];

// ── Advanced mode new option lists ──
export const IMPERFECTION_LEVELS = [
  { value: "perfect", label: "Sempurna", prompt: "clean flawless skin, minimal imperfections, studio-perfect complexion" },
  { value: "natural", label: "Natural", prompt: "subtle natural pores, minor skin texture, realistic skin quality" },
  { value: "very_natural", label: "Sangat Natural", prompt: "visible pores, small moles possible, light undereye circles, very realistic human skin" },
  { value: "raw", label: "Raw/Candid", prompt: "highly realistic skin texture, visible pores, minor blemishes, freckles, undereye circles — raw candid photography feel" },
];

export const ENVIRONMENT_DETAILS = [
  { value: "simple", label: "Simple/Clean", prompt: "minimal background, focus on person, clean studio backdrop" },
  { value: "indoor_home", label: "Indoor Rumah", prompt: "home interior — bedroom, living room, kitchen details, warm homey environment" },
  { value: "indoor_cafe", label: "Indoor Cafe/Restaurant", prompt: "aesthetic cafe interior, warm ambient lighting, cozy restaurant setting" },
  { value: "outdoor_urban", label: "Outdoor Urban", prompt: "city street background, urban buildings, outdoor urban environment" },
  { value: "outdoor_nature", label: "Outdoor Nature", prompt: "garden, park, beach, or mountain backdrop, natural outdoor environment" },
  { value: "studio", label: "Studio", prompt: "professional studio backdrop, controlled lighting setup, seamless background" },
];

export const MICRO_DETAIL_LEVELS = [
  { value: "standard", label: "Standard", prompt: "" },
  { value: "high", label: "Tinggi", prompt: "fine individual hair strands visible, fabric texture detail, subtle jewelry reflection, enhanced material textures" },
  { value: "ultra", label: "Ultra", prompt: "vellus hair visible on skin, individual skin pore detail, individual eyelashes, thread count visible on fabric, micro-texture on every surface" },
];

export const BODY_TYPES = [
  { value: "petite", label: "Petite/Slim", prompt: "petite slim body frame" },
  { value: "average", label: "Average/Medium", prompt: "average medium body build" },
  { value: "curvy", label: "Curvy/Plus-size", prompt: "curvy plus-size body type, full-figured" },
  { value: "athletic", label: "Athletic/Fit", prompt: "athletic fit body build, toned" },
];

export const AGE_RANGES = [
  { value: "teen", label: "Teen (16-19)", prompt: "16-19 years old teenager" },
  { value: "young_adult", label: "Young Adult (20-28)", prompt: "20-28 years old young adult" },
  { value: "adult", label: "Adult (29-38)", prompt: "29-38 years old adult" },
  { value: "mature", label: "Mature (39-50)", prompt: "39-50 years old mature adult" },
];
