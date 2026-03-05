/**
 * Quick Video Content Templates — "Gaya Konten"
 * Each template defines a full UGC narrative arc for single-clip generation.
 */

export type ContentTemplateKey =
  | "problem_solution"
  | "review_jujur"
  | "unboxing"
  | "before_after"
  | "daily_routine"
  | "quick_haul"
  | "asmr_aesthetic"
  | "pov_style";

export interface TimingBeat {
  start: number;   // seconds
  end: number;
  action: string;  // what happens in this beat
}

export interface ContentTemplate {
  key: ContentTemplateKey;
  label: string;
  desc: string;
  icon: string; // lucide icon name
  fullTiming: TimingBeat[];    // for veo (15-20s+)
  compressedTiming: TimingBeat[]; // for grok (10s)
  fullDuration: number;        // total seconds full
  compressedDuration: number;  // total seconds compressed
  /** Product categories this template excels at */
  recommendedFor: string[];
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    key: "problem_solution",
    label: "Problem > Solution",
    desc: "Tunjukkan masalah, lalu produk sebagai solusi. Format paling converting untuk TikTok Shop.",
    icon: "Zap",
    fullDuration: 20,
    compressedDuration: 10,
    fullTiming: [
      { start: 0, end: 3, action: "Frustration/pain point expression, showing the problem clearly" },
      { start: 3, end: 7, action: "Discovers product nearby, picks it up with curiosity, reads label" },
      { start: 7, end: 13, action: "Uses/applies product, demonstrating it actively" },
      { start: 13, end: 17, action: "Satisfied reaction, touches result area, genuine impressed look" },
      { start: 17, end: 20, action: "Holds product toward camera with confident warm smile, CTA moment" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Quick frustration/pain point" },
      { start: 2, end: 4, action: "Discovers product, picks it up" },
      { start: 4, end: 7, action: "Uses/applies product" },
      { start: 7, end: 9, action: "Result reaction, satisfied" },
      { start: 9, end: 10, action: "Product to camera CTA" },
    ],
    recommendedFor: ["skincare", "electronics", "health", "home"],
  },
  {
    key: "review_jujur",
    label: "Review Jujur",
    desc: "Review authentic kayak ngomong ke temen. Trust builder paling kuat.",
    icon: "MessageCircle",
    fullDuration: 20,
    compressedDuration: 10,
    fullTiming: [
      { start: 0, end: 3, action: "Looks at camera like talking to a friend, picks up product casually" },
      { start: 3, end: 8, action: "Shows product details, turns it around, points at features" },
      { start: 8, end: 13, action: "Uses/demonstrates the product actively" },
      { start: 13, end: 17, action: "Genuine impressed reaction, nodding approvingly" },
      { start: 17, end: 20, action: "Holds up product with confident smile to camera" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Picks up product casually, looks at camera" },
      { start: 2, end: 5, action: "Shows product details" },
      { start: 5, end: 8, action: "Demonstrates product" },
      { start: 8, end: 10, action: "Impressed nod to camera" },
    ],
    recommendedFor: ["fashion", "food", "health"],
  },
  {
    key: "unboxing",
    label: "Unboxing",
    desc: "Buka packaging, reveal produk. Excitement dan first impression genuine.",
    icon: "Package",
    fullDuration: 20,
    compressedDuration: 10,
    fullTiming: [
      { start: 0, end: 3, action: "Hands on sealed package, building anticipation, excited expression" },
      { start: 3, end: 8, action: "Opening package carefully, pulling product out, revealing it" },
      { start: 8, end: 13, action: "Examining product up close, touching texture, turning it around" },
      { start: 13, end: 17, action: "First use moment, applying/trying the product" },
      { start: 17, end: 20, action: "Satisfied reaction looking at camera, holds product up" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Sealed package, anticipation" },
      { start: 2, end: 5, action: "Opening reveal" },
      { start: 5, end: 8, action: "Examining product closely" },
      { start: 8, end: 10, action: "First use + satisfied reaction" },
    ],
    recommendedFor: ["fashion", "electronics"],
  },
  {
    key: "before_after",
    label: "Before > After",
    desc: "Tunjukkan kondisi sebelum dan sesudah. Bukti visual yang powerful.",
    icon: "ArrowRightLeft",
    fullDuration: 20,
    compressedDuration: 10,
    fullTiming: [
      { start: 0, end: 3, action: "Show before state clearly, frustrated/disappointed expression" },
      { start: 3, end: 7, action: "Introduce product with hope, pick it up and examine" },
      { start: 7, end: 13, action: "Apply/use product carefully, showing the process" },
      { start: 13, end: 17, action: "Reveal after result, amazed reaction, touching improved area" },
      { start: 17, end: 20, action: "Confident smile at camera, product visible" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Before state, frustrated" },
      { start: 2, end: 4, action: "Picks up product" },
      { start: 4, end: 7, action: "Uses product" },
      { start: 7, end: 9, action: "After reveal, amazed" },
      { start: 9, end: 10, action: "Smile CTA" },
    ],
    recommendedFor: ["skincare", "fashion", "health", "home"],
  },
  {
    key: "daily_routine",
    label: "Daily Routine",
    desc: "Produk sebagai bagian dari rutinitas harian. Natural dan relatable.",
    icon: "Sun",
    fullDuration: 20,
    compressedDuration: 10,
    fullTiming: [
      { start: 0, end: 3, action: "Morning/activity start, natural waking up or beginning routine" },
      { start: 3, end: 8, action: "Reaches for product naturally as part of routine" },
      { start: 8, end: 13, action: "Uses product in natural context, comfortable and relaxed" },
      { start: 13, end: 17, action: "Enjoys the moment, content expression, product effect visible" },
      { start: 17, end: 20, action: "Glance at camera with natural smile, product visible in scene" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Morning/activity start" },
      { start: 2, end: 5, action: "Reaches for product naturally" },
      { start: 5, end: 8, action: "Uses product" },
      { start: 8, end: 10, action: "Enjoying + camera glance" },
    ],
    recommendedFor: ["skincare", "food", "health"],
  },
  {
    key: "quick_haul",
    label: "Quick Haul",
    desc: "Showcase cepat beberapa angle produk. Energik dan snappy.",
    icon: "ShoppingBag",
    fullDuration: 15,
    compressedDuration: 10,
    fullTiming: [
      { start: 0, end: 2, action: "Excited grab of product, high energy" },
      { start: 2, end: 5, action: "Rapid show from multiple angles, turning product" },
      { start: 5, end: 9, action: "Quick use/try-on demonstration" },
      { start: 9, end: 12, action: "Impressed reaction, nodding enthusiastically" },
      { start: 12, end: 15, action: "Product held to camera, excited expression" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Excited grab" },
      { start: 2, end: 4, action: "Show angles rapidly" },
      { start: 4, end: 7, action: "Quick use" },
      { start: 7, end: 9, action: "Impressed reaction" },
      { start: 9, end: 10, action: "Product up to camera" },
    ],
    recommendedFor: ["fashion", "food"],
  },
  {
    key: "asmr_aesthetic",
    label: "ASMR Aesthetic",
    desc: "Close-up satisfying, texture detail, slow motion vibes.",
    icon: "Waves",
    fullDuration: 15,
    compressedDuration: 10,
    fullTiming: [
      { start: 0, end: 3, action: "Extreme close-up of product texture, satisfying visual detail" },
      { start: 3, end: 7, action: "Slow interaction — opening, squeezing, pouring, satisfying sounds implied" },
      { start: 7, end: 11, action: "Application in slow motion, smooth deliberate movements" },
      { start: 11, end: 15, action: "Pull back to reveal person with satisfied serene expression" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Close-up texture detail" },
      { start: 2, end: 5, action: "Slow interaction, opening" },
      { start: 5, end: 8, action: "Application moment" },
      { start: 8, end: 10, action: "Reveal person, satisfied" },
    ],
    recommendedFor: ["skincare", "food"],
  },
  {
    key: "pov_style",
    label: "POV Style",
    desc: "Sudut pandang orang pertama. Immersive.",
    icon: "Eye",
    fullDuration: 15,
    compressedDuration: 10,
    fullTiming: [
      { start: 0, end: 3, action: "POV hands reaching toward product on surface" },
      { start: 3, end: 7, action: "Picking up product, examining from first-person view" },
      { start: 7, end: 11, action: "Using product from close POV angle" },
      { start: 11, end: 15, action: "Pull back to show face/person with product" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Hands reaching for product" },
      { start: 2, end: 5, action: "Pick up, examine" },
      { start: 5, end: 8, action: "Using product" },
      { start: 8, end: 10, action: "Reveal face" },
    ],
    recommendedFor: ["electronics", "home"],
  },
];

/** Get template by key */
export function getContentTemplate(key: ContentTemplateKey): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find((t) => t.key === key);
}

/** Build timing description for Gemini prompt based on model */
export function buildTimingDescription(
  template: ContentTemplate,
  model: "grok" | "veo_fast" | "veo_quality",
): { timing: TimingBeat[]; duration: number; description: string } {
  const useCompressed = model === "grok";
  const timing = useCompressed ? template.compressedTiming : template.fullTiming;
  const duration = useCompressed ? template.compressedDuration : template.fullDuration;

  // For veo_quality, extend timing proportionally
  let scaledTiming = timing;
  let scaledDuration = duration;
  if (model === "veo_quality" && template.fullDuration <= 20) {
    const scale = 1.25; // 25% more breathing room
    scaledDuration = Math.round(duration * scale);
    scaledTiming = timing.map((b) => ({
      start: Math.round(b.start * scale),
      end: Math.round(b.end * scale),
      action: b.action,
    }));
  }

  const lines = scaledTiming.map(
    (b) => `  ${b.start}s-${b.end}s: ${b.action}`
  );
  const description = `Content template: "${template.label}" (${scaledDuration}s total)\nNarrative arc in ONE continuous take:\n${lines.join("\n")}`;

  return { timing: scaledTiming, duration: scaledDuration, description };
}

/** Category-based recommendation check */
export function isRecommendedForCategory(
  template: ContentTemplate,
  category: string | null | undefined,
): boolean {
  if (!category) return false;
  const cat = category.toLowerCase();
  return template.recommendedFor.some((r) => cat.includes(r));
}

/** Model-specific badges for templates */
export function getModelBadge(
  template: ContentTemplate,
  model: "grok" | "veo_fast" | "veo_quality",
): { label: string; variant: "recommended" | "compact" | "none" } {
  if (model === "grok") {
    // Short templates work better with Grok
    if (template.fullDuration <= 15) {
      return { label: "Recommended", variant: "recommended" };
    }
    if (template.fullDuration >= 20) {
      return { label: "Padat", variant: "compact" };
    }
  }
  return { label: "", variant: "none" };
}
