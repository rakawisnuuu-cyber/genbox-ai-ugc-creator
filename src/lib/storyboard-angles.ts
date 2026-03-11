/**
 * Video Storyboard Beat Definitions
 * Each template has 5 narrative beats that serve as keyframes for video generation.
 * Beats describe NARRATIVE DIRECTION and EMOTIONAL STATE — Gemini adapts specific
 * product actions based on product DNA at generation time.
 */

import type { ContentTemplateKey } from "./content-templates";

export interface StoryboardBeat {
  label: string;
  beat: string;
  storyRole: "Hook" | "Build" | "Demo" | "Proof" | "Convert";
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
    { label: "Hook — Problem", beat: "0-2s", storyRole: "Hook", description: "Frustrated expression, showing the problem or pain point. Looking slightly away from camera with visible discomfort. Product not yet visible or just at edge of frame." },
    { label: "Discovery", beat: "2-4s", storyRole: "Build", description: "Noticing the product, picking it up from nearby surface with curious expression. Eyes shifting from problem area to product. Beginning of hope." },
    { label: "Demo", beat: "4-6s", storyRole: "Demo", description: "Actively using/applying the product. Hands-on demonstration, product label visible. Focused expression, mid-action moment." },
    { label: "Result", beat: "6-8s", storyRole: "Proof", description: "Satisfied reaction, genuine impressed look. Touching the result area or looking at product with approval. Eyes slightly wider, subtle smile forming." },
    { label: "CTA", beat: "8-10s", storyRole: "Convert", description: "Direct eye contact with camera, warm confident smile. Holding product at chest level, label angled toward camera. Slight lean forward, intimate connection." },
  ],
  review_jujur: [
    { label: "Hook — Casual Pickup", beat: "0-2s", storyRole: "Hook", description: "Casually picking up product from table, glancing at camera like starting a conversation with a friend. Slight eyebrow raise, relaxed body language." },
    { label: "Show Details", beat: "2-4s", storyRole: "Build", description: "Rotating product in hand, pointing at key feature on label with index finger. Camera slightly closer, product details readable." },
    { label: "Try It", beat: "4-6s", storyRole: "Demo", description: "Hands-on demo — opening, applying or using product. Natural mid-action moment, both face reaction and hands visible." },
    { label: "Honest Reaction", beat: "6-8s", storyRole: "Proof", description: "Genuine impressed reaction — eyes widen slightly, slow approving nod. Natural micro-expression, not exaggerated." },
    { label: "Recommend", beat: "8-10s", storyRole: "Convert", description: "Direct eye contact, confident smile, holding product at chest level toward camera. Expression says 'you should try this'." },
  ],
  unboxing: [
    { label: "Hook — Package", beat: "0-2s", storyRole: "Hook", description: "Hands on sealed package, excited anticipation expression. Package on table or lap, leaning forward with curiosity." },
    { label: "Opening", beat: "2-4s", storyRole: "Build", description: "Mid-opening the package, pulling product out. Fingers on packaging, reveal moment. Curious and excited expression." },
    { label: "First Look", beat: "4-6s", storyRole: "Demo", description: "Examining product up close for first time. Turning it around, touching texture, reading label. Genuine discovery." },
    { label: "First Try", beat: "6-8s", storyRole: "Proof", description: "First use moment — applying, wearing, or activating. Initial reaction visible on face, surprise or delight." },
    { label: "Verdict", beat: "8-10s", storyRole: "Convert", description: "Looking at camera with satisfied expression, product in hand. Impressed nod or happy smile. Product label visible." },
  ],
  before_after: [
    { label: "Before State", beat: "0-2s", storyRole: "Hook", description: "Showing the before condition — frustrated or disappointed expression, pointing at or displaying the problem area. Product must NOT be visible or used yet.", constraints: { noProductUsage: true } },
    { label: "Introduce Product", beat: "2-4s", storyRole: "Build", description: "Picking up product with hopeful expression. Looking at product then at camera, suggesting this might be the solution." },
    { label: "Application", beat: "4-6s", storyRole: "Demo", description: "Carefully applying or using the product. Focused, deliberate motion. Showing the process clearly." },
    { label: "After Reveal", beat: "6-8s", storyRole: "Proof", description: "Revealing the after result — amazed expression, touching improved area. Genuine surprise at the difference." },
    { label: "Confidence", beat: "8-10s", storyRole: "Convert", description: "Confident smile at camera, product visible. Transformed energy — from frustrated to confident." },
  ],
  daily_routine: [
    { label: "Morning Start", beat: "0-2s", storyRole: "Hook", description: "Natural morning moment — just starting routine, reaching for product on nightstand or shelf. Relaxed start-of-day energy." },
    { label: "Grab Product", beat: "2-4s", storyRole: "Build", description: "Picking up product naturally as part of routine. Familiar comfortable grip. Calm, habitual — this is everyday." },
    { label: "Use in Routine", beat: "4-6s", storyRole: "Demo", description: "Using product in natural context — comfortable, practiced movement. Not a demo, just routine." },
    { label: "Enjoy Moment", beat: "6-8s", storyRole: "Proof", description: "Content expression, enjoying the product effect. Small satisfied smile, peaceful. Product still visible in scene." },
    { label: "Ready to Go", beat: "8-10s", storyRole: "Convert", description: "Natural glance at camera with confident smile, product visible nearby. Ready for the day." },
  ],
  quick_haul: [
    { label: "Excited Grab", beat: "0-2s", storyRole: "Hook", description: "High energy grab of product, excited expression. Product just picked up from shopping bag or package." },
    { label: "Quick Show", beat: "2-4s", storyRole: "Build", description: "Rapidly showing product from multiple angles — turning, flipping. Energetic hand movements." },
    { label: "Speed Demo", beat: "4-6s", storyRole: "Demo", description: "Quick use or try-on demonstration. Fast and confident, not dwelling. Action-focused." },
    { label: "Impressed", beat: "6-8s", storyRole: "Proof", description: "Impressed reaction — enthusiastic nodding, wide eyes. High energy approval." },
    { label: "Show Off", beat: "8-10s", storyRole: "Convert", description: "Product held up to camera with excited expression. Proud display energy." },
  ],
  asmr_aesthetic: [
    { label: "Texture Close-up", beat: "0-2s", storyRole: "Hook", description: "Extreme close-up of product texture, satisfying visual detail. Fingers gently touching surface." },
    { label: "Slow Open", beat: "2-4s", storyRole: "Build", description: "Slowly opening product — cap twist, unboxing, peeling. Deliberate slow motion energy. Focus on hands and product." },
    { label: "Sensory Moment", beat: "4-6s", storyRole: "Demo", description: "Squeezing, pouring, or dispensing product. Satisfying visual — texture, flow, consistency visible." },
    { label: "Application", beat: "6-8s", storyRole: "Proof", description: "Smooth deliberate application on skin. Slow, gentle spreading motion. Product texture visible on skin." },
    { label: "Serene Reveal", beat: "8-10s", storyRole: "Convert", description: "Pull back to reveal person with satisfied serene expression. Calm, peaceful. Product visible." },
  ],
  pov_style: [
    { label: "POV Reach", beat: "0-2s", storyRole: "Hook", description: "First-person POV — hands reaching toward product on surface." },
    { label: "POV Pickup", beat: "2-4s", storyRole: "Build", description: "POV picking up product, examining from first-person view. Turning product, reading label." },
    { label: "POV Use", beat: "4-6s", storyRole: "Demo", description: "Using product from close POV angle — applying, opening, activating. Hands and product dominate frame." },
    { label: "POV Result", beat: "6-8s", storyRole: "Proof", description: "POV looking at result — mirror reflection, looking down at hands, checking outcome." },
    { label: "Face Reveal", beat: "8-10s", storyRole: "Convert", description: "Camera shifts to reveal the person's face with product. Breaking POV to show the person. Satisfied expression." },
  ],
  // ── NEW TEMPLATES ──
  grwm: [
    { label: "Just Woke Up", beat: "0-2s", storyRole: "Hook", description: "Morning shot — slightly messy hair, stretching or rubbing eyes. Soft golden light from window. Authentic 'baru bangun' energy. No product yet.", constraints: { noProductUsage: true } },
    { label: "Start Routine", beat: "2-4s", storyRole: "Build", description: "Moving to vanity/bathroom, reaching for product among daily items on counter. Natural morning routine beginning." },
    { label: "Apply/Use Product", beat: "4-6s", storyRole: "Demo", description: "Using product as natural step in morning routine. Comfortable practiced movement. Looking in mirror or at camera." },
    { label: "Almost Ready", beat: "6-8s", storyRole: "Proof", description: "Checking result in mirror with satisfied expression. Quick hair/outfit adjustment. Confidence building, product visible on counter." },
    { label: "Ready & Go", beat: "8-10s", storyRole: "Convert", description: "Final mirror check, warm smile, grabs bag or phone. Product visible in routine lineup. 'Siap jalan' energy." },
  ],
  tiga_alasan: [
    { label: "Hook — 3 Alasan", beat: "0-2s", storyRole: "Hook", description: "Direct eye contact, holds up product with excited expression. Slight lean forward. 'Aku mau kasih tau 3 alasan' energy." },
    { label: "Alasan 1", beat: "2-4s", storyRole: "Build", description: "Demonstrates first feature/benefit. Points at specific product detail, animated explaining gesture. Genuine enthusiasm." },
    { label: "Alasan 2", beat: "4-6s", storyRole: "Demo", description: "Shows second benefit through use/application. Hands active on product. Impressed nodding, 'ini yang bikin beda' expression." },
    { label: "Alasan 3", beat: "6-8s", storyRole: "Proof", description: "Final most convincing reason. Shows result or comparison. Wide eyes, emphatic gesture. The 'killer reason' moment." },
    { label: "Summary CTA", beat: "8-10s", storyRole: "Convert", description: "Holds product to camera with confident smile. Slow nod, direct eye contact. 'Trust me on this' energy. Label clearly visible." },
  ],
  expectation_reality: [
    { label: "Skeptical Look", beat: "0-2s", storyRole: "Hook", description: "Skeptical expression, examining product packaging. Raised eyebrow, slight doubt. 'Hmm, beneran nih?' energy. Holding product at arm's length." },
    { label: "Expectation", beat: "2-4s", storyRole: "Build", description: "Points at label claims or packaging promises. Exaggerated doubtful expression. 'Let's see' shrug. Product details visible." },
    { label: "Try It", beat: "4-6s", storyRole: "Demo", description: "Tries the product with curious expression. Face begins shifting from doubt to surprise. Natural transition." },
    { label: "Reality Reveal", beat: "6-8s", storyRole: "Proof", description: "Genuine surprised reaction — 'Wait, this actually works?' Eyes widen, jaw drops. Touches result, new respect for product." },
    { label: "Converted", beat: "8-10s", storyRole: "Convert", description: "Converted believer smile at camera. Holds product proudly. 'Okay I was wrong' slight laugh. Warm direct eye contact." },
  ],
  tutorial_singkat: [
    { label: "Setup", beat: "0-2s", storyRole: "Hook", description: "Hands and product on clean surface. Person enters frame, picks up product. Calm focused expression, tutorial-mode. 'Let me show you' energy." },
    { label: "Step 1", beat: "2-4s", storyRole: "Build", description: "First step shown clearly. Slow deliberate hand movements, product details visible. Glances at camera checking viewer follows." },
    { label: "Step 2", beat: "4-6s", storyRole: "Demo", description: "Main application/usage step. Close-up on hands working. Shows correct way to use. Teaching energy, controlled pace." },
    { label: "Step 3 Result", beat: "6-8s", storyRole: "Proof", description: "Finishing step showing result. Steps back to show full result. Approving nod, satisfied with demonstration." },
    { label: "Easy Right?", beat: "8-10s", storyRole: "Convert", description: "Final result display — warm smile at camera, product visible. 'See? Easy!' expression. Inviting, helpful energy." },
  ],
  day_in_my_life: [
    { label: "Morning", beat: "0-2s", storyRole: "Hook", description: "Morning establishing — stretching in bed, soft light, peaceful start. Authentic 'just another day' vibe. No product yet.", constraints: { noProductUsage: true } },
    { label: "Midday Activity", beat: "2-4s", storyRole: "Build", description: "Midday scene — at desk, cafe, or errands. Product appears naturally as part of the activity. Not staged." },
    { label: "Product Moment", beat: "4-6s", storyRole: "Demo", description: "Natural point in the day when they use the product. Casual integration, not a demo. Lunch, afternoon routine, or workout break." },
    { label: "Enjoying Benefit", beat: "6-8s", storyRole: "Proof", description: "Enjoying the product's benefit. Relaxed, content expression. Product visible but not centered — it's part of life." },
    { label: "End of Day", beat: "8-10s", storyRole: "Convert", description: "Cozy evening setting, soft warm light. Product on nightstand/table. Peaceful satisfied expression, looking at camera." },
  ],
  first_impression: [
    { label: "First Look", beat: "0-2s", storyRole: "Hook", description: "Holding sealed/new product for first time. Curious expression, examining packaging. 'Never tried this before' energy." },
    { label: "First Open", beat: "2-4s", storyRole: "Build", description: "Opens product for first time — careful unpeeling, cap twist. Reaction to smell/texture. 'Oh interesting...' moment." },
    { label: "First Try", beat: "4-6s", storyRole: "Demo", description: "First use/application — tentative at first, then adjusting. Learning the product in real-time. Honest facial reactions." },
    { label: "Assessment", beat: "6-8s", storyRole: "Proof", description: "Processing the result — touching, checking, comparing to expectations. Building genuine opinion. Mix of impressed and analytical." },
    { label: "Honest Verdict", beat: "8-10s", storyRole: "Convert", description: "Final honest verdict — direct eye contact, genuine opinion. Authentic not forced. Product visible, natural close." },
  ],
};

/** Get storyboard beats for a content template */
export function getStoryboardBeats(templateKey: ContentTemplateKey): StoryboardBeat[] {
  return STORYBOARDS[templateKey] || STORYBOARDS.problem_solution;
}

/** Role colors for badges */
export function getStoryRoleColor(role: StoryboardBeat["storyRole"]): string {
  switch (role) {
    case "Hook": return "bg-red-500/20 text-red-400";
    case "Build": return "bg-amber-500/20 text-amber-400";
    case "Demo": return "bg-blue-500/20 text-blue-400";
    case "Proof": return "bg-green-500/20 text-green-400";
    case "Convert": return "bg-purple-500/20 text-purple-400";
  }
}
