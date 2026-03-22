/**
 * Video Storyboard Beat Definitions
 * Each template has its own narrative stages — NOT forced into a rigid 5-role system.
 * Beats describe NARRATIVE DIRECTION and EMOTIONAL STATE — Gemini adapts specific
 * product actions based on product DNA at generation time.
 */

import type { ContentTemplateKey } from "./content-templates";

export interface StoryboardBeat {
  label: string;
  beat: string;
  /** Flexible narrative role — each template defines its own roles */
  storyRole: string;
  description: string;
  /** Constraints for this beat — e.g. noProductUsage means product must NOT be shown being used */
  constraints?: {
    noProductUsage?: boolean;
  };
}

export interface StoryboardTemplate {
  templateKey: ContentTemplateKey;
  beats: [StoryboardBeat, StoryboardBeat, StoryboardBeat, StoryboardBeat, StoryboardBeat];
}

const STORYBOARDS: Record<ContentTemplateKey, StoryboardBeat[]> = {
  problem_solution: [
    { label: "Problem", beat: "0-2s", storyRole: "Problem", description: "Frustrated expression, showing the problem or pain point. Looking slightly away from camera with visible discomfort. Product not yet visible or just at edge of frame." },
    { label: "Pain + Discovery", beat: "2-4s", storyRole: "Pain Amplification", description: "Amplifying the frustration — touching problem area, sighing. Then eyes shift to product nearby. Hand reaches out with curiosity, beginning of hope. Transition from pain to discovery." },
    { label: "Demo", beat: "4-6s", storyRole: "Demo", description: "Actively using/applying the product. Hands-on demonstration, product label visible. Focused expression, mid-action moment." },
    { label: "Result", beat: "6-8s", storyRole: "Result", description: "Satisfied reaction, genuine impressed look. Touching the result area or looking at product with approval. Eyes slightly wider, subtle smile forming." },
    { label: "CTA", beat: "8-10s", storyRole: "CTA", description: "Direct eye contact with camera, warm confident smile. Holding product at chest level, label angled toward camera. Slight lean forward, intimate connection." },
  ],
  review_jujur: [
    { label: "Casual Hook", beat: "0-2s", storyRole: "Hook", description: "Casually picking up product from table, glancing at camera like starting a conversation with a friend. Slight eyebrow raise, relaxed body language." },
    { label: "Personal Experience", beat: "2-4s", storyRole: "Personal", description: "Sharing personal context — why they tried this product, what they were looking for. Animated hand gestures, conversational energy. Rotating product, pointing at details." },
    { label: "Product Usage", beat: "4-6s", storyRole: "Usage", description: "Hands-on demo — opening, applying or using product. Natural mid-action moment, both face reaction and hands visible." },
    { label: "Honest Reaction", beat: "6-8s", storyRole: "Reaction", description: "Genuine impressed reaction — eyes widen slightly, slow approving nod. Natural micro-expression, not exaggerated." },
    { label: "Soft CTA", beat: "8-10s", storyRole: "Soft CTA", description: "Direct eye contact, warm smile, holding product casually. Expression says 'you should try this' — recommendation, not hard sell." },
  ],
  unboxing: [
    { label: "Anticipation", beat: "0-2s", storyRole: "Anticipation", description: "Hands on sealed package, excited anticipation expression. Package on table or lap, leaning forward with curiosity." },
    { label: "Opening", beat: "2-4s", storyRole: "Reveal", description: "Mid-opening the package, pulling product out. Fingers on packaging, reveal moment. Curious and excited expression." },
    { label: "Discovery", beat: "4-6s", storyRole: "Discovery", description: "Examining product up close for first time. Turning it around, touching texture, reading label. Genuine discovery." },
    { label: "First Try", beat: "6-8s", storyRole: "First Try", description: "First use moment — applying, wearing, or activating. Initial reaction visible on face, surprise or delight." },
    { label: "Verdict", beat: "8-10s", storyRole: "Verdict", description: "Looking at camera with satisfied expression, product in hand. Impressed nod or happy smile. Product label visible." },
  ],
  before_after: [
    { label: "Before State", beat: "0-2s", storyRole: "Before", description: "Showing the before condition — frustrated or disappointed expression, pointing at or displaying the problem area. Product must NOT be visible or used yet.", constraints: { noProductUsage: true } },
    { label: "Introduce Product", beat: "2-4s", storyRole: "Introduce", description: "Picking up product with hopeful expression. Looking at product then at camera, suggesting this might be the solution." },
    { label: "Application", beat: "4-6s", storyRole: "Application", description: "Carefully applying or using the product. Focused, deliberate motion. Showing the process clearly." },
    { label: "After Reveal", beat: "6-8s", storyRole: "After Reveal", description: "Revealing the after result — amazed expression, touching improved area. Genuine surprise at the difference." },
    { label: "Confidence", beat: "8-10s", storyRole: "Confidence", description: "Confident smile at camera, product visible. Transformed energy — from frustrated to confident." },
  ],
  daily_routine: [
    { label: "Morning Start", beat: "0-2s", storyRole: "Morning", description: "Natural morning moment — just starting routine, reaching for product on nightstand or shelf. Relaxed start-of-day energy." },
    { label: "Grab Product", beat: "2-4s", storyRole: "Routine", description: "Picking up product naturally as part of routine. Familiar comfortable grip. Calm, habitual — this is everyday." },
    { label: "Use in Routine", beat: "4-6s", storyRole: "Usage", description: "Using product in natural context — comfortable, practiced movement. Not a demo, just routine." },
    { label: "Enjoy Moment", beat: "6-8s", storyRole: "Enjoyment", description: "Content expression, enjoying the product effect. Small satisfied smile, peaceful. Product still visible in scene." },
    { label: "Ready to Go", beat: "8-10s", storyRole: "Ready", description: "Natural glance at camera with confident smile, product visible nearby. Ready for the day." },
  ],
  quick_haul: [
    { label: "Excited Grab", beat: "0-2s", storyRole: "Excitement", description: "High energy grab of product, excited expression. Product just picked up from shopping bag or package." },
    { label: "Quick Show", beat: "2-4s", storyRole: "Showcase", description: "Rapidly showing product from multiple angles — turning, flipping. Energetic hand movements." },
    { label: "Speed Demo", beat: "4-6s", storyRole: "Speed Demo", description: "Quick use or try-on demonstration. Fast and confident, not dwelling. Action-focused." },
    { label: "Impressed", beat: "6-8s", storyRole: "Impressed", description: "Impressed reaction — enthusiastic nodding, wide eyes. High energy approval." },
    { label: "Show Off", beat: "8-10s", storyRole: "Show Off", description: "Product held up to camera with excited expression. Proud display energy." },
  ],
  asmr_aesthetic: [
    { label: "Texture Close-up", beat: "0-2s", storyRole: "Texture", description: "Extreme close-up of product texture, satisfying visual detail. Fingers gently touching surface." },
    { label: "Slow Open", beat: "2-4s", storyRole: "Slow Reveal", description: "Slowly opening product — cap twist, unboxing, peeling. Deliberate slow motion energy. Focus on hands and product." },
    { label: "Sensory Moment", beat: "4-6s", storyRole: "Sensory", description: "Squeezing, pouring, or dispensing product. Satisfying visual — texture, flow, consistency visible." },
    { label: "Application", beat: "6-8s", storyRole: "Application", description: "Smooth deliberate application on skin. Slow, gentle spreading motion. Product texture visible on skin." },
    { label: "Serene Reveal", beat: "8-10s", storyRole: "Serene", description: "Pull back to reveal person with satisfied serene expression. Calm, peaceful. Product visible." },
  ],
  pov_style: [
    { label: "POV Reach", beat: "0-2s", storyRole: "POV Reach", description: "First-person POV — hands reaching toward product on surface." },
    { label: "POV Pickup", beat: "2-4s", storyRole: "POV Inspect", description: "POV picking up product, examining from first-person view. Turning product, reading label." },
    { label: "POV Use", beat: "4-6s", storyRole: "POV Use", description: "Using product from close POV angle — applying, opening, activating. Hands and product dominate frame." },
    { label: "POV Result", beat: "6-8s", storyRole: "POV Result", description: "POV looking at result — mirror reflection, looking down at hands, checking outcome." },
    { label: "Face Reveal", beat: "8-10s", storyRole: "Face Reveal", description: "Camera shifts to reveal the person's face with product. Breaking POV to show the person. Satisfied expression." },
  ],
  grwm: [
    { label: "Just Woke Up", beat: "0-2s", storyRole: "Morning", description: "Morning shot — slightly messy hair, stretching or rubbing eyes. Soft golden light from window. Authentic 'baru bangun' energy. No product yet.", constraints: { noProductUsage: true } },
    { label: "Start Routine", beat: "2-4s", storyRole: "Routine Start", description: "Moving to vanity/bathroom, reaching for product among daily items on counter. Natural morning routine beginning." },
    { label: "Apply/Use Product", beat: "4-6s", storyRole: "Product Step", description: "Using product as natural step in morning routine. Comfortable practiced movement. Looking in mirror or at camera." },
    { label: "Almost Ready", beat: "6-8s", storyRole: "Almost Ready", description: "Checking result in mirror with satisfied expression. Quick hair/outfit adjustment. Confidence building, product visible on counter." },
    { label: "Ready & Go", beat: "8-10s", storyRole: "Ready", description: "Final mirror check, warm smile, grabs bag or phone. Product visible in routine lineup. 'Siap jalan' energy." },
  ],
  tiga_alasan: [
    { label: "Hook — 3 Alasan", beat: "0-2s", storyRole: "Hook", description: "Direct eye contact, holds up product with excited expression. Slight lean forward. 'Aku mau kasih tau 3 alasan' energy." },
    { label: "Alasan 1", beat: "2-4s", storyRole: "Alasan 1", description: "Demonstrates first feature/benefit. Points at specific product detail, animated explaining gesture. Genuine enthusiasm." },
    { label: "Alasan 2", beat: "4-6s", storyRole: "Alasan 2", description: "Shows second benefit through use/application. Hands active on product. Impressed nodding, 'ini yang bikin beda' expression." },
    { label: "Alasan 3", beat: "6-8s", storyRole: "Alasan 3", description: "Final most convincing reason. Shows result or comparison. Wide eyes, emphatic gesture. The 'killer reason' moment." },
    { label: "Summary CTA", beat: "8-10s", storyRole: "Summary", description: "Holds product to camera with confident smile. Slow nod, direct eye contact. 'Trust me on this' energy. Label clearly visible." },
  ],
  expectation_reality: [
    { label: "Skeptical Look", beat: "0-2s", storyRole: "Skeptical", description: "Skeptical expression, examining product packaging. Raised eyebrow, slight doubt. 'Hmm, beneran nih?' energy. Holding product at arm's length." },
    { label: "Expectation", beat: "2-4s", storyRole: "Expectation", description: "Points at label claims or packaging promises. Exaggerated doubtful expression. 'Let's see' shrug. Product details visible." },
    { label: "Try It", beat: "4-6s", storyRole: "Try", description: "Tries the product with curious expression. Face begins shifting from doubt to surprise. Natural transition." },
    { label: "Reality Reveal", beat: "6-8s", storyRole: "Reality", description: "Genuine surprised reaction — 'Wait, this actually works?' Eyes widen, jaw drops. Touches result, new respect for product." },
    { label: "Converted", beat: "8-10s", storyRole: "Converted", description: "Converted believer smile at camera. Holds product proudly. 'Okay I was wrong' slight laugh. Warm direct eye contact." },
  ],
  tutorial_singkat: [
    { label: "Setup", beat: "0-2s", storyRole: "Setup", description: "Hands and product on clean surface. Person enters frame, picks up product. Calm focused expression, tutorial-mode. 'Let me show you' energy." },
    { label: "Step 1", beat: "2-4s", storyRole: "Step 1", description: "First step shown clearly. Slow deliberate hand movements, product details visible. Glances at camera checking viewer follows." },
    { label: "Step 2", beat: "4-6s", storyRole: "Step 2", description: "Main application/usage step. Close-up on hands working. Shows correct way to use. Teaching energy, controlled pace." },
    { label: "Step 3 Result", beat: "6-8s", storyRole: "Result", description: "Finishing step showing result. Steps back to show full result. Approving nod, satisfied with demonstration." },
    { label: "Easy Right?", beat: "8-10s", storyRole: "Wrap Up", description: "Final result display — warm smile at camera, product visible. 'See? Easy!' expression. Inviting, helpful energy." },
  ],
  day_in_my_life: [
    { label: "Morning", beat: "0-2s", storyRole: "Morning", description: "Morning establishing — stretching in bed, soft light, peaceful start. Authentic 'just another day' vibe. No product yet.", constraints: { noProductUsage: true } },
    { label: "Midday Activity", beat: "2-4s", storyRole: "Midday", description: "Midday scene — at desk, cafe, or errands. Product appears naturally as part of the activity. Not staged." },
    { label: "Product Moment", beat: "4-6s", storyRole: "Product Moment", description: "Natural point in the day when they use the product. Casual integration, not a demo. Lunch, afternoon routine, or workout break." },
    { label: "Enjoying Benefit", beat: "6-8s", storyRole: "Benefit", description: "Enjoying the product's benefit. Relaxed, content expression. Product visible but not centered — it's part of life." },
    { label: "End of Day", beat: "8-10s", storyRole: "Evening", description: "Cozy evening setting, soft warm light. Product on nightstand/table. Peaceful satisfied expression, looking at camera." },
  ],
  first_impression: [
    { label: "First Look", beat: "0-2s", storyRole: "First Look", description: "Holding sealed/new product for first time. Curious expression, examining packaging. 'Never tried this before' energy." },
    { label: "First Open", beat: "2-4s", storyRole: "First Open", description: "Opens product for first time — careful unpeeling, cap twist. Reaction to smell/texture. 'Oh interesting...' moment." },
    { label: "First Try", beat: "4-6s", storyRole: "First Try", description: "First use/application — tentative at first, then adjusting. Learning the product in real-time. Honest facial reactions." },
    { label: "Assessment", beat: "6-8s", storyRole: "Assessment", description: "Processing the result — touching, checking, comparing to expectations. Building genuine opinion. Mix of impressed and analytical." },
    { label: "Honest Verdict", beat: "8-10s", storyRole: "Verdict", description: "Final honest verdict — direct eye contact, genuine opinion. Authentic not forced. Product visible, natural close." },
  ],
  // ── COMMERCIAL TEMPLATES ──
  hero_product: [
    { label: "Hero Angle", beat: "0-2s", storyRole: "Hero", description: "Product held elegantly at eye level, clean studio lighting, confident neutral expression. Full product visibility with brand label facing camera." },
    { label: "Detail Close-up", beat: "2-4s", storyRole: "Detail", description: "Macro close-up on product texture, finish, key design element. Shallow depth of field, product fills frame. No person needed." },
    { label: "Lifestyle Context", beat: "4-6s", storyRole: "Lifestyle", description: "Product in curated environment, model interacting naturally. Medium shot, balanced composition, premium feel." },
    { label: "Feature Highlight", beat: "6-8s", storyRole: "Feature", description: "Demonstrating key benefit or unique mechanism. Hands active, controlled lighting, functional beauty." },
    { label: "Brand Statement", beat: "8-10s", storyRole: "Brand", description: "Product centered, clean background, logo visible. Aspirational packshot, memorable final frame." },
  ],
  brand_campaign: [
    { label: "Brand Mood", beat: "0-2s", storyRole: "Mood", description: "Atmospheric establishing shot, cinematic lighting, model in aspirational setting. Emotion-first, product secondary." },
    { label: "Identity Shot", beat: "2-4s", storyRole: "Identity", description: "Model embodies brand persona, confident editorial pose. Wardrobe and styling aligned with brand identity." },
    { label: "Product Integration", beat: "4-6s", storyRole: "Integration", description: "Natural product use in elevated lifestyle context. Seamless integration, not forced placement." },
    { label: "Aspirational Moment", beat: "6-8s", storyRole: "Aspiration", description: "The 'after' feeling — elevated confidence, glowing result, emotional peak of the narrative." },
    { label: "Brand Lockup", beat: "8-10s", storyRole: "Lockup", description: "Product hero with brand elements, clean premium composition, memorable closing frame." },
  ],
  katalog_produk: [
    { label: "Clean Product", beat: "0-2s", storyRole: "Clean Shot", description: "White or neutral background, product centered, even soft lighting. E-commerce hero angle, all details visible." },
    { label: "Variant Display", beat: "2-4s", storyRole: "Variant", description: "Product from different angle or showing color variant. Clean consistent lighting maintained throughout." },
    { label: "Scale / Size", beat: "4-6s", storyRole: "Scale", description: "Product held in hand or next to common object for size reference. Clean background, functional context." },
    { label: "Texture Detail", beat: "6-8s", storyRole: "Texture", description: "Extreme close-up on material, finish, craftsmanship quality. Shallow DOF, tactile feel conveyed visually." },
    { label: "Styled Flat Lay", beat: "8-10s", storyRole: "Flat Lay", description: "Product with complementary props, overhead angle, curated arrangement. Lifestyle-catalog hybrid." },
  ],
  studio_editorial: [
    { label: "Editorial Pose", beat: "0-2s", storyRole: "Editorial", description: "Model in dramatic editorial pose with product, controlled studio lighting, fashion magazine framing." },
    { label: "Fashion Detail", beat: "2-4s", storyRole: "Fashion Detail", description: "Close-up on styling detail, product as accessory or in active use. Dramatic shadow play, high contrast." },
    { label: "Environment Mood", beat: "4-6s", storyRole: "Environment", description: "Model in curated set, atmospheric lighting, editorial color grading. Product integrated into the scene naturally." },
    { label: "Dynamic Movement", beat: "6-8s", storyRole: "Dynamic", description: "Model mid-motion, hair flowing or fabric draping. Product visible, kinetic energy, editorial action shot." },
    { label: "Magazine Cover", beat: "8-10s", storyRole: "Cover", description: "Final editorial pose, product prominent, aspirational composition. Print-ready, magazine cover quality framing." },
  ],
};

/** Get storyboard beats for a content template */
export function getStoryboardBeats(templateKey: ContentTemplateKey): StoryboardBeat[] {
  return STORYBOARDS[templateKey] || STORYBOARDS.problem_solution;
}

/** Position-based role colors for badges. Works with any storyRole string. */
const POSITION_COLORS = [
  "bg-red-500/20 text-red-400",
  "bg-amber-500/20 text-amber-400",
  "bg-blue-500/20 text-blue-400",
  "bg-green-500/20 text-green-400",
  "bg-purple-500/20 text-purple-400",
];

/** Legacy role-to-color mapping for backward compatibility */
const LEGACY_ROLE_COLORS: Record<string, string> = {
  Hook: POSITION_COLORS[0],
  Build: POSITION_COLORS[1],
  Demo: POSITION_COLORS[2],
  Proof: POSITION_COLORS[3],
  Convert: POSITION_COLORS[4],
};

/**
 * Get color class for a story role badge.
 * Supports both legacy fixed roles and new flexible roles via beatIndex.
 */
export function getStoryRoleColor(role: string, beatIndex?: number): string {
  // If beatIndex provided, use position-based coloring
  if (beatIndex !== undefined && beatIndex >= 0 && beatIndex < POSITION_COLORS.length) {
    return POSITION_COLORS[beatIndex];
  }
  // Legacy role mapping
  if (LEGACY_ROLE_COLORS[role]) return LEGACY_ROLE_COLORS[role];
  // Fallback: hash the role string to pick a color
  let hash = 0;
  for (let i = 0; i < role.length; i++) hash = ((hash << 5) - hash + role.charCodeAt(i)) | 0;
  return POSITION_COLORS[Math.abs(hash) % POSITION_COLORS.length];
}
