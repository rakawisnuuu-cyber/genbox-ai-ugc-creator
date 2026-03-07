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
    { label: "Before State", beat: "0-2s", storyRole: "Hook", description: "Showing the before condition — frustrated or disappointed expression, pointing at or displaying the problem area." },
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
