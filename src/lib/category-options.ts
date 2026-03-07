/**
 * Category-aware rich options for Environment, Pose, and Mood.
 * Each option has a short label (UI) and rich description (sent to Gemini).
 */

import type { ProductCategory } from "./product-dna";

export interface RichOption {
  label: string;
  description: string;
}

/* ─── ENVIRONMENTS ────────────────────────────────────────────── */

const ENV_SKINCARE: RichOption[] = [
  { label: "Bathroom Mewah", description: "High-end modern bathroom with polished marble walls, warm ambient lighting, and multiple rectangular mirrors with soft LED backlighting creating depth and repetition. A used hand towel slightly folded on the counter, a toothbrush in a ceramic cup, partially used soap dispenser with a small water droplet on the nozzle" },
  { label: "Vanity Setup", description: "Elegant vanity table with round Hollywood mirror, soft warm bulbs, organized skincare bottles, rose gold accents, cotton pads and small plants. A few cotton pads scattered near the mirror base, one skincare bottle cap left open, phone laying face-down nearby with charging cable visible" },
  { label: "Kamar Pagi", description: "Bright airy bedroom in morning golden hour light streaming through sheer white curtains, crisp white bedding, minimal nightstand with a glass of water. Pillow slightly dented from sleeping, phone on nightstand with charger cable visible, a half-full glass of water with slight condensation" },
  { label: "Spa Vibes", description: "Zen spa-inspired setting with warm wood tones, rolled white towels, eucalyptus branches, soft candlelight, natural stone surfaces. One towel slightly unrolled at the edge, a candle with wax drip visible, small water droplets on the stone surface near a recently used bowl" },
  { label: "Minimalist Studio", description: "Clean white cyclorama studio with soft diffused lighting from both sides, professional product photography feel. A small equipment case visible at the edge of frame, a reflector stand slightly tilted, tape mark on the floor where subject should stand" },
];

const ENV_FASHION: RichOption[] = [
  { label: "Walk-in Closet", description: "Spacious modern walk-in closet with warm wood shelving, soft recessed lighting, neatly organized clothing racks, full-length mirror with brass frame. One hanger slightly crooked on the rack, a pair of shoes not perfectly aligned on the shelf, a tote bag hanging from a hook on the door" },
  { label: "Urban Street", description: "Busy city sidewalk with modern glass buildings, tropical street trees, warm humid overcast daylight, other pedestrians blurred in background, wide pedestrian path, natural street photography feel with real urban energy. A parked motorcycle partially visible at frame edge, a street vendor cart blurred in the distance, other pedestrians softly blurred walking past" },
  { label: "Cafe Kekinian", description: "Trendy modern cafe with terrazzo or concrete tables, tropical plants as decor, neon signage on wall, iced drink on table, warm interior lighting mixed with window daylight, Instagram-worthy spot that feels authentic. Other customers blurred in background, a used napkin on the next table, condensation on iced drink glass, a phone charging cable on the table" },
  { label: "Coffee Shop", description: "Trendy industrial coffee shop interior with exposed brick, warm pendant lighting, wooden tables, large windows with natural light. Other customers blurred in background, a used napkin on the next table, condensation on an iced drink glass left behind, a laptop charger plugged into a wall outlet" },
  { label: "Mirror Studio", description: "Large floor-to-ceiling mirror in a bright minimal room, natural daylight from side windows, clean white or light gray walls. A small smudge on the mirror surface, tape marks on floor from previous photoshoot, a water bottle sitting on the floor near the wall" },
  { label: "Rooftop Golden Hour", description: "City rooftop terrace during golden hour, warm backlit glow, blurred skyline background, modern railing and potted plants. One potted plant with a slightly wilted leaf, a forgotten coffee cup on the ledge, some dried leaves collected in a corner near the railing" },
];

const ENV_FOOD: RichOption[] = [
  { label: "Dapur Modern", description: "Bright modern kitchen with white marble countertops, warm pendant lighting, copper utensils hanging, fresh herbs in small pots, steam-friendly warm atmosphere. A few crumbs near the cutting board, a slightly stained kitchen towel draped over the oven handle, an open recipe book propped against the backsplash" },
  { label: "Dining Table", description: "Beautifully set wooden dining table with linen napkins, ceramic plates, soft overhead pendant light, cozy dinner party atmosphere. A water glass with lip mark on the rim, a bread crumb trail near one plate, a slightly pushed-back chair suggesting someone just got up" },
  { label: "Outdoor Brunch", description: "Sun-dappled outdoor terrace with wrought iron bistro table, fresh flowers, dappled tree shade, Mediterranean brunch aesthetic. A fallen petal from the flower arrangement on the table, a slightly tilted glass, a bird visible blurred in the distant sky" },
  { label: "Street Food Stall", description: "Vibrant Indonesian street food stall with warm tungsten bulbs, steam rising, colorful ingredients displayed, authentic night market feel. Plastic stools slightly uneven on the ground, a stack of used plates near the wash area, hand-written price signs with slightly smudged marker" },
  { label: "Minimal Flat Lay", description: "Clean marble or light wood surface shot from directly above, styled with minimal props like a fork, linen cloth, and fresh herb sprig. A tiny sauce splatter near the plate edge, the linen cloth with a natural wrinkle fold, a fingerprint smudge on the marble surface" },
];

const ENV_ELECTRONICS: RichOption[] = [
  { label: "Desk Setup", description: "Clean modern desk setup with ultrawide monitor, mechanical keyboard, warm desk lamp, cable-managed workspace, dark wood or white minimal aesthetic. A sticky note on monitor edge, slightly tangled cable near keyboard, coffee mug with ring stain on a coaster" },
  { label: "Sofa Casual", description: "Modern living room with comfortable gray sofa, soft ambient lighting, coffee table with a mug, relaxed casual tech-use environment. A throw blanket bunched up on one side of the sofa, a remote control between cushions, a pair of slippers on the floor nearby" },
  { label: "Commuter", description: "Public transit or airport lounge setting, modern seating, natural overhead lighting, person using device while traveling. A backpack leaning against the seat leg, earphone case on the armrest, a boarding pass or ticket peeking from a jacket pocket" },
  { label: "Studio Unboxing", description: "Clean tabletop with plain dark background, dramatic top-down key light, product packaging visible, YouTube-style unboxing setup. Packaging foam peanuts scattered near the box, a box cutter laid on the table, the shipping label partially peeled off" },
  { label: "Outdoor Active", description: "Park bench or outdoor setting with natural daylight, trees blurred in background, casual on-the-go tech usage. A water bottle next to the person on the bench, fallen leaves near the bench legs, a jogger softly blurred passing in the background" },
];

const ENV_HEALTH: RichOption[] = [
  { label: "Gym Locker", description: "Modern gym locker room with clean wooden bench, natural light from high windows, gym bag visible, post-workout energy feel. A slightly damp towel draped over the bench end, an open locker with shoes visible inside, a water bottle with condensation droplets" },
  { label: "Dapur Sehat", description: "Bright clean kitchen with fruits on counter, blender visible, morning sunlight, healthy lifestyle aesthetic. A banana peel near the blender base, a few drops of smoothie on the counter, a phone propped up showing a recipe" },
  { label: "Jogging Path", description: "Scenic outdoor jogging path with morning mist, trees lining both sides, soft golden morning light, active lifestyle setting. A few fallen leaves on the path, another jogger blurred far in the distance, a park bench with a forgotten water bottle" },
  { label: "Kamar Pagi Routine", description: "Minimal bright bedroom nightstand with water glass, supplements neatly arranged, morning light through window, daily habit feel. Phone on nightstand with alarm visible, slightly rumpled pillow behind, a book with a bookmark sticking out on the nightstand" },
  { label: "Yoga Studio", description: "Calm yoga studio with light wood floor, large windows, green plants, soft natural light, wellness and balance atmosphere. A yoga mat slightly unrolled at one corner, a water bottle and towel near the mat edge, natural scuff marks on the wooden floor" },
];

const ENV_HOME: RichOption[] = [
  { label: "Living Room Modern", description: "Contemporary living room with neutral tones, large windows with sheer curtains, modular sofa, indoor plants, warm afternoon light. A TV remote on the sofa armrest, a magazine left open on the coffee table, one throw pillow slightly askew" },
  { label: "Kamar Kost", description: "Small but tidy Indonesian kost room with white walls, single bed, small desk, warm string lights, relatable young adult space. Some clothes draped over desk chair, a charger plugged into wall, instant noodle cup on desk corner, slightly messy but real" },
  { label: "Apartment Balcony", description: "Small apartment balcony with potted plants, city view blurred in background, afternoon golden light, cozy urban living. A dried leaf in one of the pots, a coffee cup left on the railing ledge, flip-flops by the balcony door threshold" },
  { label: "Ruang Kerja", description: "Home office corner with floating shelf, small desk, laptop, warm desk lamp, organized and productive aesthetic. A few sticky notes on the wall, a pen left uncapped on the desk, phone charger cable draped from desk edge" },
  { label: "Kamar Anak", description: "Bright cheerful kids room with pastel colors, toys neatly arranged, soft carpet, playful but organized. One toy car slightly out of place on the carpet, a crayon left on the floor, a small blanket half-draped off the bed" },
];

const ENV_OTHER: RichOption[] = [
  { label: "Studio Putih", description: "Clean white cyclorama studio with soft diffused lighting, professional product photography feel. A small tape mark on the floor, equipment cable visible at the very edge of frame, a reflector slightly tilted in the background" },
  { label: "Outdoor Cafe", description: "Trendy outdoor cafe with warm natural light, blurred greenery background, wooden furniture. A used sugar packet on the table, slight condensation on a glass, another patron blurred walking past in the background" },
  { label: "Kamar Tidur", description: "Cozy bedroom with warm lighting, clean bedding, natural window light. A phone charging on the nightstand, pillow with a slight indent, a pair of socks near the bed edge" },
  { label: "Dapur Modern", description: "Bright modern kitchen with marble countertops, warm pendant lighting, clean aesthetic. A kitchen towel hanging slightly off the oven handle, a fruit bowl with one overripe banana, a small water ring on the counter" },
  { label: "Taman", description: "Beautiful garden setting with lush greenery, natural daylight, flowers and plants. A garden hose coiled near a pot, a few fallen petals on the stone path, a small watering can left near the flowers" },
];

const ENV_MAP: Record<ProductCategory, RichOption[]> = {
  skincare: ENV_SKINCARE,
  fashion: ENV_FASHION,
  food: ENV_FOOD,
  electronics: ENV_ELECTRONICS,
  health: ENV_HEALTH,
  home: ENV_HOME,
  other: ENV_OTHER,
};

const CUSTOM_ENV: RichOption = { label: "Custom", description: "" };

export function getEnvironments(category: ProductCategory): RichOption[] {
  return [...(ENV_MAP[category] || ENV_OTHER), CUSTOM_ENV];
}

/* ─── POSES ───────────────────────────────────────────────────── */

const POSE_SKINCARE: RichOption[] = [
  { label: "Memegang Dekat Wajah", description: "holding product near face, gentle smile, product label facing camera" },
  { label: "Mengaplikasikan", description: "applying product on cheek/hand, mid-application moment" },
  { label: "Selfie dengan Produk", description: "phone-angle selfie, one hand holding product" },
  { label: "Before Skincare", description: "looking at product curiously, about to start routine" },
  { label: "Showing Hasil", description: "touching face proudly, glowing skin result pose" },
];

const POSE_FASHION: RichOption[] = [
  { label: "Full Outfit Reveal", description: "standing confident, hands slightly away, showing full outfit" },
  { label: "Mirror Check", description: "looking at reflection, adjusting outfit naturally" },
  { label: "Walking Confident", description: "mid-stride, natural movement, street style pose" },
  { label: "Detail Styling", description: "adjusting sleeve, collar, or accessory with one hand" },
  { label: "Sitting Casual", description: "seated cross-legged or on chair, relaxed showing outfit drape" },
];

const POSE_FOOD: RichOption[] = [
  { label: "Memegang Appetizing", description: "holding food/drink at chest level, appetizing presentation" },
  { label: "First Bite", description: "about to take first bite, excited expression" },
  { label: "Cooking Action", description: "stirring, pouring, plating in kitchen" },
  { label: "Cheers/Toast", description: "holding drink up, celebratory casual moment" },
  { label: "Taste Reaction", description: "mid-chew or just tasted, genuine satisfied expression" },
];

const POSE_ELECTRONICS: RichOption[] = [
  { label: "Hands-on Demo", description: "holding device, actively using, screen visible" },
  { label: "Unboxing Reveal", description: "opening package, showing device for first time" },
  { label: "Casual Usage", description: "relaxed using device on couch or desk" },
  { label: "Size Comparison", description: "holding device next to hand, face, or another object for scale" },
  { label: "Feature Showcase", description: "pointing at specific feature, demonstrating functionality" },
];

const POSE_HEALTH: RichOption[] = [
  { label: "Morning Routine", description: "holding supplement with glass of water, fresh morning energy" },
  { label: "Post Workout", description: "gym context, towel on shoulder, holding product confidently" },
  { label: "Mixing/Preparing", description: "shaking bottle or mixing powder, preparation moment" },
  { label: "Taking Supplement", description: "about to drink or swallow, daily ritual moment" },
  { label: "Active Lifestyle", description: "outdoor or gym setting, product as part of active life" },
];

const POSE_HOME: RichOption[] = [
  { label: "Room Reveal", description: "standing next to product in room, gesturing toward it proudly" },
  { label: "Using Comfort", description: "sitting on furniture, lying on pillow, comfort demonstration" },
  { label: "Styling Placement", description: "arranging product in room, interior styling moment" },
  { label: "Before/After", description: "showing messy then organized space transformation" },
  { label: "Detail Touch", description: "touching material, opening drawer, showing craftsmanship" },
];

const POSE_OTHER: RichOption[] = [
  { label: "Memegang Produk", description: "holding product naturally, product label facing camera" },
  { label: "Selfie dengan Produk", description: "phone-angle selfie, one hand holding product" },
  { label: "Menggunakan Produk", description: "actively using product in natural context" },
  { label: "Unboxing", description: "opening package, first impression reaction" },
  { label: "Review", description: "examining product closely, reviewer pose" },
];

const POSE_MAP: Record<ProductCategory, RichOption[]> = {
  skincare: POSE_SKINCARE,
  fashion: POSE_FASHION,
  food: POSE_FOOD,
  electronics: POSE_ELECTRONICS,
  health: POSE_HEALTH,
  home: POSE_HOME,
  other: POSE_OTHER,
};

export function getPoses(category: ProductCategory): RichOption[] {
  return POSE_MAP[category] || POSE_OTHER;
}

/* ─── MOODS ───────────────────────────────────────────────────── */

const MOOD_MAP: Record<ProductCategory, RichOption[]> = {
  skincare: [
    { label: "Glowing Confident", description: "Confident radiant glow, self-assured beauty" },
    { label: "Relaxed Self-Care", description: "Calm relaxed self-care moment, peaceful pampering" },
    { label: "Fresh Morning Energy", description: "Fresh energized morning routine, bright and awake" },
    { label: "Excited Discovery", description: "Excited discovering a new product, genuine curiosity" },
  ],
  fashion: [
    { label: "Street Style Cool", description: "Cool effortless street style attitude, urban confidence" },
    { label: "Effortless Chic", description: "Sophisticated effortless elegance, understated luxury" },
    { label: "Playful Trendy", description: "Playful fun trendy energy, youthful and expressive" },
    { label: "Elegant Minimal", description: "Clean elegant minimalism, refined and polished" },
  ],
  food: [
    { label: "Comfort Craving", description: "Warm comfort food craving, cozy indulgent mood" },
    { label: "Excited First Taste", description: "Excited anticipation of first taste, eyes lit up" },
    { label: "Warm Homemade", description: "Warm homemade cooking atmosphere, nurturing and inviting" },
    { label: "Vibrant Fresh", description: "Vibrant fresh healthy energy, colorful and alive" },
  ],
  electronics: [
    { label: "Tech Enthusiast", description: "Passionate tech enthusiast energy, genuinely impressed" },
    { label: "Casual Daily Use", description: "Relaxed everyday tech use, natural and integrated" },
    { label: "Impressed Unboxing", description: "Impressed unboxing reaction, wow factor discovery" },
    { label: "Productive Focus", description: "Focused productive work mode, deep concentration" },
  ],
  health: [
    { label: "Morning Motivated", description: "Motivated morning energy, ready to conquer the day" },
    { label: "Post-Workout Glow", description: "Post-workout endorphin glow, accomplished and strong" },
    { label: "Calm Wellness", description: "Calm balanced wellness moment, inner peace" },
    { label: "Energized Active", description: "Energized active lifestyle, vibrant and dynamic" },
  ],
  home: [
    { label: "Cozy Homebody", description: "Cozy comfortable homebody vibes, warm and content" },
    { label: "Proud Room Makeover", description: "Proud room transformation reveal, accomplished decorator" },
    { label: "Minimal Aesthetic", description: "Clean minimal aesthetic appreciation, curated simplicity" },
    { label: "Warm Inviting", description: "Warm inviting hosting atmosphere, welcoming and open" },
  ],
  other: [
    { label: "Happy Review", description: "Happy genuine product review, satisfied customer" },
    { label: "Excited Unboxing", description: "Excited unboxing moment, first impression joy" },
    { label: "Casual Lifestyle", description: "Casual relaxed lifestyle integration, everyday natural" },
    { label: "Professional", description: "Professional polished presentation, trustworthy review" },
  ],
};

export function getMoods(category: ProductCategory): RichOption[] {
  return MOOD_MAP[category] || MOOD_MAP.other;
}

/** Find a rich option by label from a list */
export function findOption(options: RichOption[], label: string): RichOption | undefined {
  return options.find((o) => o.label === label);
}
