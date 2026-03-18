/**
 * Category-aware rich options for Environment, Pose, and Mood.
 * Each option has a short label (UI) and rich description (sent to Gemini).
 * Environment descriptions kept under ~40 words per Indonesian UGC doc.
 */

import type { ProductCategory } from "./product-dna";

export interface RichOption {
  label: string;
  description: string;
}

/* ─── ENVIRONMENTS (Indonesian Micro-Environments) ────────── */

const ENV_SKINCARE: RichOption[] = [
  { label: "Bathroom Vanity", description: "Compact Indonesian bathroom with ceramic tile walls, mirror cabinet above sink, warm indoor lighting, skincare products near sink." },
  { label: "Morning Routine Sink", description: "Simple home bathroom sink with toothbrush holder and skincare bottles, bright daylight from small window." },
  { label: "Bedroom Vanity", description: "Cozy Indonesian bedroom with small vanity table near window, soft natural daylight through sheer curtains." },
  { label: "Spa Style Bathroom", description: "Minimal bathroom with stone sink, folded towels, warm lighting, skincare on small wooden tray." },
];

const ENV_FASHION: RichOption[] = [
  { label: "Bedroom Mirror Selfie", description: "Minimal bedroom with standing mirror, tile flooring, neutral walls, clothes rack visible in background." },
  { label: "Closet Area", description: "Open wardrobe with hanging clothes, wooden wardrobe cabinet typical of Indonesian homes." },
  { label: "Apartment Hallway", description: "Modern apartment hallway with neutral wall paint and warm ceiling lighting." },
  { label: "Balcony Outfit Shot", description: "Apartment balcony with railing, potted plants, and tropical daylight." },
];

const ENV_FOOD: RichOption[] = [
  { label: "Kitchen Counter", description: "Indonesian kitchen with tiled backsplash, gas stove and rice cooker visible, ingredients on counter." },
  { label: "Breakfast Table", description: "Wood dining table with coffee mug and breakfast plate, natural morning daylight." },
  { label: "Kitchen Island", description: "Modern kitchen counter setup with food preparation items and warm pendant lighting." },
  { label: "Snack Table", description: "Coffee table with snacks and drinks placed casually, living room background." },
];

const ENV_ELECTRONICS: RichOption[] = [
  { label: "Creator Desk Setup", description: "Simple wooden desk with laptop open, phone tripod nearby, charging cables visible, natural daylight from window." },
  { label: "Bedroom Work Desk", description: "Compact workspace in bedroom with laptop and minimal tech accessories." },
  { label: "Gaming Setup", description: "Desk with gaming chair, monitor, keyboard, subtle RGB lighting." },
  { label: "Coffee Table Review", description: "Living room coffee table with gadget placed on top, creator sitting nearby on sofa." },
];

const ENV_HEALTH: RichOption[] = [
  { label: "Living Room Workout", description: "Living room with tile flooring, yoga mat near sofa, daylight from window." },
  { label: "Home Yoga Corner", description: "Small workout space with yoga mat and dumbbells, minimal decor." },
  { label: "Balcony Workout", description: "Apartment balcony with plants and city view, bright tropical sunlight." },
  { label: "Home Gym Corner", description: "Compact workout corner with basic equipment, rubber mat flooring." },
];

const ENV_HOME: RichOption[] = [
  { label: "Couch Talk Setup", description: "Living room sofa with throw pillows and coffee table, relaxed casual environment." },
  { label: "Bed Talk Scene", description: "Creator sitting on bed with pillows and blanket, daylight from window." },
  { label: "Desk Chat Setup", description: "Creator sitting at desk holding product while talking to camera." },
  { label: "Balcony Vlog Scene", description: "Creator leaning on balcony railing with plants and city view behind." },
  { label: "Kamar Kost", description: "Small tidy Indonesian kost room with white walls, single bed, small desk, warm string lights." },
];

const ENV_OTHER: RichOption[] = [
  { label: "Bathroom Vanity", description: "Compact Indonesian bathroom with ceramic tile walls, mirror cabinet above sink, warm indoor lighting." },
  { label: "Bedroom Vanity", description: "Cozy bedroom with small vanity table near window, soft natural daylight through sheer curtains." },
  { label: "Creator Desk Setup", description: "Simple wooden desk with laptop, phone tripod, charging cables, natural daylight." },
  { label: "Coffee Table Review", description: "Living room coffee table with product, creator sitting nearby on sofa." },
  { label: "Balcony Scene", description: "Apartment balcony with railing, potted plants, tropical daylight and city view." },
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
  { label: "Record Skincare Routine", description: "applying product while looking at phone camera propped on tripod, tutorial-style recording" },
  { label: "Tunjukin Produk ke Kamera", description: "holding product next to face angled toward phone camera, close-up showcase" },
];

const POSE_FASHION: RichOption[] = [
  { label: "Full Outfit Reveal", description: "standing confident, hands slightly away, showing full outfit" },
  { label: "Mirror Check", description: "looking at reflection, adjusting outfit naturally" },
  { label: "Walking Confident", description: "mid-stride, natural movement, street style pose" },
  { label: "Detail Styling", description: "adjusting sleeve, collar, or accessory with one hand" },
  { label: "Sitting Casual", description: "seated cross-legged or on chair, relaxed showing outfit drape" },
  { label: "Mirror Selfie OOTD", description: "classic mirror selfie with phone visible, showing full outfit head to toe" },
  { label: "Tunjukin ke Kamera", description: "holding clothing item toward camera at arm's length, excited expression" },
];

const POSE_FOOD: RichOption[] = [
  { label: "Memegang Appetizing", description: "holding food/drink at chest level, appetizing presentation" },
  { label: "First Bite", description: "about to take first bite, excited expression" },
  { label: "Cooking Action", description: "stirring, pouring, plating in kitchen" },
  { label: "Cheers/Toast", description: "holding drink up, celebratory casual moment" },
  { label: "Taste Reaction", description: "mid-chew or just tasted, genuine satisfied expression" },
  { label: "Foto Sebelum Makan", description: "phone held above food in typical overhead food photo pose" },
  { label: "Nyobain Sambil Record", description: "eating or drinking while glancing at phone camera, casual review moment" },
];

const POSE_ELECTRONICS: RichOption[] = [
  { label: "Hands-on Demo", description: "holding device, actively using, screen visible" },
  { label: "Unboxing Reveal", description: "opening package, showing device for first time" },
  { label: "Casual Usage", description: "relaxed using device on couch or desk" },
  { label: "Size Comparison", description: "holding device next to hand, face, or another object for scale" },
  { label: "Feature Showcase", description: "pointing at specific feature, demonstrating functionality" },
  { label: "Unboxing di Meja", description: "sitting at desk opening package, camera from front, packaging materials scattered" },
  { label: "Tunjukin Fitur", description: "pointing at feature on device with index finger, tutorial pose" },
];

const POSE_HEALTH: RichOption[] = [
  { label: "Morning Routine", description: "holding supplement with glass of water, fresh morning energy" },
  { label: "Post Workout", description: "gym context, towel on shoulder, holding product confidently" },
  { label: "Mixing/Preparing", description: "shaking bottle or mixing powder, preparation moment" },
  { label: "Taking Supplement", description: "about to drink or swallow, daily ritual moment" },
  { label: "Active Lifestyle", description: "outdoor or gym setting, product as part of active life" },
  { label: "Selfie Pagi Routine", description: "morning selfie holding supplement with glass of water, bathroom mirror behind" },
  { label: "Gym Selfie", description: "gym mirror selfie post-workout, holding product, slightly sweaty" },
];

const POSE_HOME: RichOption[] = [
  { label: "Room Reveal", description: "standing next to product in room, gesturing toward it proudly" },
  { label: "Using Comfort", description: "sitting on furniture, lying on pillow, comfort demonstration" },
  { label: "Styling Placement", description: "arranging product in room, interior styling moment" },
  { label: "Before/After", description: "showing messy then organized space transformation" },
  { label: "Detail Touch", description: "touching material, opening drawer, showing craftsmanship" },
  { label: "Before After Record", description: "standing next to product, phone on tripod, gesturing like presenting" },
  { label: "Review Santai", description: "sitting on floor or sofa with product, talking-to-camera casual angle" },
];

const POSE_OTHER: RichOption[] = [
  { label: "Memegang Produk", description: "holding product naturally, product label facing camera" },
  { label: "Selfie dengan Produk", description: "phone-angle selfie, one hand holding product" },
  { label: "Menggunakan Produk", description: "actively using product in natural context" },
  { label: "Unboxing", description: "opening package, first impression reaction" },
  { label: "Review", description: "examining product closely, reviewer pose" },
  { label: "Record Review", description: "sitting with product, phone on tripod, talking-to-camera angle" },
  { label: "Tunjukin ke Kamera", description: "holding product up toward camera, excited expression" },
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
