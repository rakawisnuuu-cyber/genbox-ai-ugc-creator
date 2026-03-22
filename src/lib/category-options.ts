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
  { label: "White Vanity Setup", description: "White vanity table with round LED mirror, skincare bottles organized in acrylic organizer, warm soft lighting, clean neutral wall behind." },
  { label: "Bathroom Mirror", description: "Clean bathroom, large mirror, white or light tile, single shelf with neatly placed products, bright even overhead light." },
  { label: "Bedroom Side Table", description: "Sitting on bed edge, products on white side table, morning light through blinds casting soft stripes, minimal background." },
  { label: "Ring Light Close-Up", description: "Ring light visible in eye reflection, perfectly lit face, neutral wall behind, creator setup feel, professional UGC lighting." },
  { label: "Night Routine Mood", description: "Dim bedroom, warm bedside lamp, candle on tray with products, soft golden ambient light, cozy intimate feel." },
  { label: "Korean Vanity Desk", description: "Small wooden desk with standing mirror, organized product tray, warm desk lamp, pastel wall or shelf with small plants." },
  { label: "Hotel Bathroom Luxury", description: "Marble countertop, large frameless mirror, bright white professional lighting, clean towels, upscale feel." },
  { label: "Towel Wrap Fresh", description: "Just-showered look, towel on head, bathroom mirror behind, dewy face, bright clean lighting, authentic morning moment." },
  { label: "Balcony Golden Glow", description: "Soft sunset backlight on balcony, skincare in hand, warm golden rim light on face, greenery bokeh behind." },
];

const ENV_FASHION: RichOption[] = [
  { label: "Full Mirror Bedroom", description: "Full-length standing mirror, white or cream wall, wooden floor or light tile, natural daylight from side window, clean minimal room." },
  { label: "Closet / Wardrobe", description: "Open wardrobe visible, hanging clothes as backdrop, standing in front showing outfit, warm bedroom lighting." },
  { label: "Ring Light OOTD", description: "Ring light on tripod, neutral wall, full body visible in phone camera setup, bright even studio-like lighting at home." },
  { label: "Fitting Room", description: "Mall fitting room mirror, warm overhead spotlights, curtain edge visible, close and intimate framing." },
  { label: "Kost Room Mirror", description: "Small tidy kost room, mounted mirror on door or wall, clothes rack visible, warm natural light from single window." },
  { label: "Clean White Wall", description: "Plain white wall backdrop, soft even lighting, all focus on outfit, minimal distraction, studio look at home." },
  { label: "Apartment Hallway", description: "Modern apartment corridor, warm recessed ceiling lights, neutral walls, clean background for walking shots." },
  { label: "Cafe Entrance", description: "Standing outside minimalist cafe, concrete or brick wall, tropical plants, warm afternoon outdoor light." },
  { label: "Street Style Walk", description: "Clean urban sidewalk, neutral building wall, afternoon light with soft shadows, city context." },
];

const ENV_FOOD: RichOption[] = [
  { label: "Aesthetic Cafe Table", description: "Marble or terrazzo table, warm pendant light above, latte or glass nearby, blurred cafe interior behind." },
  { label: "Kitchen Counter Morning", description: "Clean white kitchen counter, morning light from window, coffee maker visible, fresh and bright." },
  { label: "Dining Table Warm", description: "Wooden dining table, warm overhead pendant, minimal table setting, cozy evening indoor mood." },
  { label: "Bed Snacking", description: "Sitting cross-legged on bed with snack or drink, laptop nearby, blanket, casual content creator vibe, warm lamp." },
  { label: "Desk Mukbang", description: "Product on desk, camera facing front, monitor or laptop edge visible, overhead snack review setup." },
  { label: "Car Eating", description: "Inside car, food in hand or on lap, dashboard visible, natural daylight through windshield, casual honest review feel." },
  { label: "Outdoor Brunch", description: "Cafe terrace table, tropical greenery, bright natural daylight, plate styled for overhead shot." },
  { label: "Street Food Stall", description: "Standing at colorful food stall, warm tungsten night market lighting, authentic street food context." },
];

const ENV_ELECTRONICS: RichOption[] = [
  { label: "Clean Desk Setup", description: "Minimal desk, monitor or laptop, mechanical keyboard, warm desk lamp, small plant, clean cable management." },
  { label: "Sofa Unboxing", description: "Sitting on sofa, package on coffee table, scissors and packaging material, warm living room light." },
  { label: "Bed Scrolling", description: "Lying or sitting on bed, device in hand, white bedding, warm side lamp, relaxed evening scroll." },
  { label: "Ring Light Review", description: "Ring light setup, holding device to camera, neutral wall, bright even lighting, professional review look." },
  { label: "WFH Desk", description: "Home office corner, laptop open, coffee cup, natural daylight from window, productive casual setup." },
  { label: "Kitchen Counter Tech", description: "Standing at kitchen counter, device on counter, overhead lighting, quick casual review between activities." },
  { label: "Car Dashboard", description: "Inside car, device on dashboard mount or in hand, steering wheel visible, natural daylight, on-the-go review." },
  { label: "Cafe Table", description: "Laptop and device on cafe table, coffee nearby, blurred cafe background, ambient warm lighting." },
];

const ENV_HEALTH: RichOption[] = [
  { label: "Morning Kitchen Ritual", description: "Bright kitchen counter, glass of water and supplement, fresh morning sunlight, clean energetic start." },
  { label: "Bathroom Mirror Morning", description: "Standing at bathroom mirror, supplement in hand, just-woke-up fresh face, bright overhead light." },
  { label: "Bedroom Nightstand", description: "Supplement bottle on nightstand next to water, sitting on bed edge, morning light through blinds." },
  { label: "Gym Mirror", description: "Gym mirror selfie, workout clothes, slight sweat, holding shaker or supplement, bright gym fluorescent lighting." },
  { label: "Yoga Mat Corner", description: "Rolled yoga mat, water bottle, small plant, soft natural light from window, calm wellness corner at home." },
  { label: "Kitchen Smoothie", description: "Kitchen counter with blender, cut fruits, supplement powder, bright overhead lighting, active morning prep." },
  { label: "WFH Desk Supplement", description: "Office desk, supplement bottle next to laptop and water, midday work break moment." },
  { label: "Outdoor Morning Run", description: "Jogging path with trees, golden morning light, holding supplement or water, fresh air athletic context." },
  { label: "Balcony Sunrise", description: "Apartment balcony, early morning sky, holding supplement, city view behind, aspirational morning routine." },
];

const ENV_HOME: RichOption[] = [
  { label: "Minimalist Living Room", description: "Clean sofa with throw pillows, coffee table, warm afternoon light, curated but cozy." },
  { label: "Aesthetic Bedroom", description: "White bedding, dried flowers on nightstand, warm fairy string lights, soft inviting mood." },
  { label: "Tidy Kost Room", description: "Small room with wall shelves, organized decor, warm string lights, personal cozy space." },
  { label: "Bathroom Shelf", description: "Organized bathroom shelf, matching containers, small plant, bright white lighting, clean transformation." },
  { label: "Kitchen Shelf Styling", description: "Open kitchen shelving, organized containers and jars, hanging plants, warm pendant lighting." },
  { label: "WFH Corner", description: "Home office nook, monitor and supplies, warm desk lamp, organized productive aesthetic." },
  { label: "Teras Rumah", description: "Indonesian terrace, rattan chair, potted plants, afternoon tropical light, relaxed outdoor-indoor living." },
  { label: "Ruang Tamu Setup", description: "Sitting on floor or sofa, product on coffee table, ring light or phone on tripod, talking-to-camera angle." },
];

const ENV_OTHER: RichOption[] = [
  { label: "Ring Light Setup", description: "Ring light on tripod, neutral wall behind, bright even lighting, professional creator setup feel." },
  { label: "Clean White Wall", description: "Plain white wall backdrop, soft even lighting, minimal distraction, studio look at home." },
  { label: "Sofa Review", description: "Sitting on sofa, product on coffee table, warm living room light, relaxed casual review." },
  { label: "Bed Casual", description: "Sitting or lying on bed, product in hand, white bedding, warm side lamp, relaxed feel." },
  { label: "Desk Setup", description: "Minimal desk, laptop or monitor, warm desk lamp, small plant, clean organized workspace." },
  { label: "Kitchen Counter", description: "Clean kitchen counter, overhead lighting, bright and practical, quick product review setting." },
  { label: "Car Interior", description: "Inside car, product in hand, dashboard visible, natural daylight through windshield, on-the-go review." },
  { label: "Cafe Table", description: "Cafe table with coffee nearby, blurred cafe background, ambient warm lighting, lifestyle feel." },
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
