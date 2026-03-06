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
  start: number;
  end: number;
  action: string;
}

export interface ContentTemplate {
  key: ContentTemplateKey;
  label: string;
  desc: string;
  icon: string;
  fullTiming: TimingBeat[];
  compressedTiming: TimingBeat[];
  fullDuration: number;
  compressedDuration: number;
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
      { start: 0, end: 3, action: "Medium close-up on face. Person looks frustrated, sighs, touches problem area with fingers. Slight head shake, furrowed brows. Camera holds steady on face and upper body" },
      { start: 3, end: 7, action: "Eyes shift to product nearby on table. Hand reaches out, picks up product with curiosity. Tilts it to read label, camera slowly pushes in on product in hand. Eyebrows lift with interest" },
      { start: 7, end: 13, action: "Opens product cap with deliberate motion. Applies/uses product — hands actively working. Medium shot captures both face and hands. Expression shifts from focused concentration to pleasant surprise. Camera holds steady" },
      { start: 13, end: 17, action: "Pulls back slightly. Eyes widen with genuine surprise, slow approving nod. Touches result area gently with fingertips. Lips curve into satisfied smile. Camera stays on face for authentic reaction" },
      { start: 17, end: 20, action: "Direct eye contact with camera. Warm confident smile, holds product at chest level angled toward lens. Slight lean forward for intimacy. Slow subtle zoom in on face and product together" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Close-up frustrated expression, touches problem area, quick head shake. Camera tight on face" },
      { start: 2, end: 4, action: "Hand grabs product from table, tilts to show label. Quick camera push-in on product" },
      { start: 4, end: 7, action: "Opens and applies product with focused hands. Medium shot, face shows concentration then surprise" },
      { start: 7, end: 9, action: "Eyes widen, approving nod, touches result. Genuine satisfied smile" },
      { start: 9, end: 10, action: "Eye contact, holds product to camera, warm smile. Slight lean forward" },
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
      { start: 0, end: 3, action: "Medium close-up. Person casually picks up product from table, glances at camera like starting a conversation with a friend. Slight eyebrow raise, relaxed posture" },
      { start: 3, end: 8, action: "Slow rotation of product in hand, camera subtly pushes in. Points at key feature on label with index finger, tilts product toward camera to show detail. Natural hand gestures while 'explaining'" },
      { start: 8, end: 13, action: "Hands-on demo — opens cap, applies/uses product with deliberate motion. Camera holds steady medium shot capturing both face reaction and hands working. Expression shifts from neutral to pleasantly surprised" },
      { start: 13, end: 17, action: "Genuine reaction beat — eyes widen slightly, slow approving nod, touches result area with fingertips. Camera stays on face for authentic emotion. Lips press together in impressed expression" },
      { start: 17, end: 20, action: "Direct eye contact, warm confident smile, holds product at chest level angled toward camera. Slight lean forward for intimacy. Slow nod as if recommending to a friend" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Picks up product casually from table, glances at camera with friendly eyebrow raise. Medium close-up" },
      { start: 2, end: 5, action: "Rotates product, points at feature with index finger, tilts toward camera. Subtle push-in" },
      { start: 5, end: 8, action: "Opens and demonstrates product. Hands active, face shifts from neutral to surprised. Steady medium shot" },
      { start: 8, end: 10, action: "Impressed nod to camera, holds product up with confident smile. Slight lean forward" },
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
      { start: 0, end: 3, action: "Close-up on hands resting on sealed package on table. Fingers tap package with anticipation. Camera slightly overhead angle. Face shows excited anticipation, biting lip" },
      { start: 3, end: 8, action: "Hands carefully tear open packaging, pulling flaps apart. Peels back tissue paper. Camera pushes in as product is revealed. Hands lift product out slowly, eyes widen with genuine surprise" },
      { start: 8, end: 13, action: "Holds product at eye level, examines up close. Fingers run along texture, turns it to see all sides. Camera follows product rotation. Impressed expression, slight 'wow' mouth shape" },
      { start: 13, end: 17, action: "First use moment — opens product, applies/tries it. Camera widens to medium shot. Hands work deliberately, face shows focused concentration then delight" },
      { start: 17, end: 20, action: "Satisfied reaction looking at camera, holds product beside face. Beaming smile, slow nod. Camera holds steady on face and product together" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Overhead close-up, hands on sealed package, excited expression. Fingers tap with anticipation" },
      { start: 2, end: 5, action: "Tears open package, lifts product out. Camera pushes in on reveal moment. Eyes widen" },
      { start: 5, end: 8, action: "Examines product closely, fingers touch texture, rotates it. Impressed expression" },
      { start: 8, end: 10, action: "Quick first use, then holds product to camera with beaming smile" },
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
      { start: 0, end: 3, action: "Close-up showing 'before' state clearly. Person looks frustrated/disappointed, touches problem area. Camera tight on affected zone. Slight sigh, furrowed brows" },
      { start: 3, end: 7, action: "Hand reaches for product with hopeful expression. Picks it up, reads label. Camera widens to medium shot. Eyebrows lift, nods slightly as if deciding to try" },
      { start: 7, end: 13, action: "Applies/uses product carefully with deliberate hand movements. Close-up on application area, then widens to show face concentration. Methodical, focused motion" },
      { start: 13, end: 17, action: "Time-skip feel — person touches result area with amazement. Eyes widen, jaw drops slightly. Camera pushes in on 'after' reveal. Genuine shock and delight on face" },
      { start: 17, end: 20, action: "Confident radiant smile at camera. Product held beside face at chest level. Slow nod of approval. Camera holds on the transformed look" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Close-up before state, frustrated expression touching problem area. Tight camera" },
      { start: 2, end: 4, action: "Reaches for product hopefully, picks it up. Camera widens" },
      { start: 4, end: 7, action: "Applies product with focused deliberate hands. Close-up on application" },
      { start: 7, end: 9, action: "After reveal — eyes widen, amazed expression. Camera pushes in on result" },
      { start: 9, end: 10, action: "Confident smile at camera with product. Slow nod" },
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
      { start: 0, end: 3, action: "Natural morning/activity establishing shot. Person stretches or begins routine, soft morning light. Camera wide then slowly pushes in. Relaxed, authentic energy" },
      { start: 3, end: 8, action: "Hand reaches for product naturally on counter/table as part of routine. Picks it up without fanfare, familiar motion. Camera follows hand to product in smooth pan" },
      { start: 8, end: 13, action: "Uses product in natural context — comfortable, practiced movements. Medium shot shows both face and hands. Relaxed expression, eyes half-closed in enjoyment" },
      { start: 13, end: 17, action: "Enjoys the moment — content serene expression. Touches face/skin/result area with gentle satisfaction. Camera stays medium, warm lighting. Slight smile building" },
      { start: 17, end: 20, action: "Natural glance at camera with warm knowing smile. Product visible in scene, not held up aggressively. Relaxed lean, intimate 'sharing a secret' energy" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Morning light, person begins routine naturally. Soft warm establishing shot" },
      { start: 2, end: 5, action: "Hand reaches for product on counter, picks up with practiced familiarity. Camera pans to follow" },
      { start: 5, end: 8, action: "Uses product with comfortable relaxed movements. Medium shot, gentle expression" },
      { start: 8, end: 10, action: "Content smile, glances at camera warmly. Product visible, intimate energy" },
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
      { start: 0, end: 2, action: "High energy grab — hand snatches product from bag/table with excited motion. Close-up on hand and product. Wide eyes, excited expression. Quick camera snap" },
      { start: 2, end: 5, action: "Rapid product showcase — turns product fast showing front, back, side. Camera follows rotation closely. Points at key details with finger. Enthusiastic energy" },
      { start: 5, end: 9, action: "Quick use/try-on demo — swift application or wearing. Hands move with confidence. Medium shot captures reaction — eyebrows up, impressed nod mid-action" },
      { start: 9, end: 12, action: "Enthusiastic reaction — fast nod, wide smile, maybe a small excited gesture. Camera tightens on face for genuine emotion beat" },
      { start: 12, end: 15, action: "Product held up to camera at face level with big smile. Energetic final pose. Slight tilt of product to catch light" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Excited grab from bag/table. Close-up hand snatch, wide eyes. Quick energy" },
      { start: 2, end: 4, action: "Rapid rotation showing all angles, points at detail. Camera follows close" },
      { start: 4, end: 7, action: "Swift use/try-on. Confident hands, impressed mid-action expression" },
      { start: 7, end: 9, action: "Fast enthusiastic nod, wide smile. Camera tight on face" },
      { start: 9, end: 10, action: "Product up to camera, big smile, energetic pose" },
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
      { start: 0, end: 3, action: "Extreme macro close-up of product texture/surface. Camera barely moving, shallow depth of field. Every pore, grain, shimmer visible. Satisfying visual ASMR feel" },
      { start: 3, end: 7, action: "Slow deliberate interaction — fingers opening cap, gentle squeeze releasing product, slow pour. Camera stays tight. Every motion unhurried and intentional. Tactile satisfaction" },
      { start: 7, end: 11, action: "Slow-motion application — product spreading on skin/surface with smooth deliberate strokes. Close-up on texture meeting skin. Dreamy, meditative pacing" },
      { start: 11, end: 15, action: "Gradual pull back revealing person with serene satisfied expression. Eyes peacefully closed then slowly opening. Soft lighting wraps around face. Camera eases to medium shot" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "Macro close-up on product texture, shallow depth of field. Satisfying detail" },
      { start: 2, end: 5, action: "Slow deliberate open/squeeze/pour. Camera tight, every motion unhurried" },
      { start: 5, end: 8, action: "Slow-motion application, smooth strokes. Close-up texture meeting skin" },
      { start: 8, end: 10, action: "Pull back to reveal serene face, eyes open slowly. Soft lighting" },
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
      { start: 0, end: 3, action: "First-person POV — hands reach toward product sitting on surface. Camera IS the eyes. Fingers extend, slight tremor of anticipation. Product fills center of frame" },
      { start: 3, end: 7, action: "POV hands pick up product, bring it close to examine. Fingers rotate it, thumb runs across label. Camera tilts down following the hands. Detail inspection from personal angle" },
      { start: 7, end: 11, action: "POV using product — hands open cap, apply/interact from first-person view. Close angle on hands working. Immediate personal connection to the action" },
      { start: 11, end: 15, action: "Camera lifts to mirror/reflection revealing the person's face with product. Or pulls back to third-person showing person holding product with satisfied smile. Transition from POV to reveal" },
    ],
    compressedTiming: [
      { start: 0, end: 2, action: "POV hands reaching toward product on surface. First-person angle, fingers extend" },
      { start: 2, end: 5, action: "Picks up product, rotates in POV. Thumb on label, close examination" },
      { start: 5, end: 8, action: "POV using product, hands open and apply. First-person intimate angle" },
      { start: 8, end: 10, action: "Pull back revealing face with product, satisfied smile. POV to third-person transition" },
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

  let scaledTiming = timing;
  let scaledDuration = duration;
  if (model === "veo_quality" && template.fullDuration <= 20) {
    const scale = 1.25;
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
    if (template.fullDuration <= 15) {
      return { label: "Recommended", variant: "recommended" };
    }
    if (template.fullDuration >= 20) {
      return { label: "Padat", variant: "compact" };
    }
  }
  return { label: "", variant: "none" };
}
