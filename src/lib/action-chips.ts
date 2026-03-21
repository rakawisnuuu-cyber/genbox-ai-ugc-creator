/**
 * Action chip library organized by beat role × product category.
 * Provides smart action suggestions for each video frame.
 */

export type BeatRole = "Hook" | "Build" | "Demo" | "Proof" | "Convert";
export type ActionCategory = "universal" | "fashion" | "skincare" | "electronics" | "food" | "health" | "home";

const ACTIONS: Record<BeatRole, Record<ActionCategory, string[]>> = {
  Hook: {
    universal: [
      "Liat produk sambil bingung", "Pegang produk ke kamera", "Shock reaction lihat produk",
      "Close-up produk ke lens", "Tunjukin produk dari belakang", "Pull produk dari tas",
      "Reveal produk dari meja", "Angkat produk tiba-tiba", "Tap produk ke meja",
    ],
    fashion: [
      "Mirror selfie sambil pegang baju", "Buka shopping bag excited", "Tunjukin outfit ke kamera",
      "Throw outfit ke bahu", "Hold hanger depan kamera", "Reveal outfit dari belakang",
      "Snap pose depan mirror", "Flip baju ke depan kamera", "Quick shoulder pose", "Liat outfit sambil senyum",
    ],
    skincare: [
      "Ambil produk dari meja rias", "Liat produk penasaran", "Selfie sebelum pake",
      "Shake bottle dekat kamera", "Close-up label produk", "Tap jar dengan jari",
      "Put bottle next to face", "Turn bottle to show label", "Unbox produk cepat", "Smell produk reaction",
    ],
    electronics: [
      "Ambil gadget dari box", "Turn device to camera", "Tap screen nyalain device",
      "Hold gadget near lens", "Flip gadget di tangan", "Open case reveal device",
      "Close-up tombol gadget", "Slide device keluar box", "Turn gadget slowly", "React to first look",
    ],
    food: [], health: [], home: [],
  },
  Demo: {
    universal: [
      "Tunjukin produk ke kamera", "Rotate produk pelan", "Close-up detail produk",
      "Tap produk sambil jelasin", "Point ke fitur produk", "Hold produk di tangan",
      "Compare sebelum sesudah", "Show texture / material", "Move produk closer to lens",
    ],
    fashion: [
      "Pakai baju di depan mirror", "Adjust outfit detail", "Putar badan tunjukin fit",
      "Tuck baju ke celana", "Smooth outfit ke bawah", "Step back tunjukin full fit",
      "Walk pose ke kamera", "Fix sleeve / collar", "Show pocket detail", "Flip hemline",
    ],
    skincare: [
      "Apply ke pipi pelan-pelan", "Buka tutup produk", "Tunjukin tekstur di tangan",
      "Dot cream ke wajah", "Blend produk di pipi", "Pump produk ke tangan",
      "Close-up skin application", "Spread serum di tangan", "Tap wajah setelah apply", "Compare before/after",
    ],
    electronics: [
      "Swipe layar device", "Tap fitur di screen", "Show device dari samping",
      "Rotate gadget pelan", "Press button demo", "Plug in device",
      "Zoom in ke screen", "Scroll menu device", "Flip gadget back side", "Hold gadget while explaining",
    ],
    food: [], health: [], home: [],
  },
  Build: {
    // Build uses same as Demo
    universal: [],
    fashion: [], skincare: [], electronics: [],
    food: [], health: [], home: [],
  },
  Proof: {
    universal: [
      "Senyum sambil pegang produk", "Nodding sambil hold produk", "Thumbs up ke kamera",
      "Show produk sambil excited", "React happy lihat hasil", "Look impressed ke kamera",
      "Tap produk sambil senyum", "Laugh small reaction", "Raise eyebrow impressed",
    ],
    fashion: [
      "Pose outfit confident", "Spin kecil pakai outfit", "Walk pose depan kamera",
      "Show mirror reflection", "Hands in pocket pose", "Adjust hair with outfit",
      "Small runway walk", "Turn shoulder pose",
    ],
    skincare: [
      "Touch cheek after apply", "Smile lihat hasil di mirror", "Glow reaction",
      "Compare skin dekat kamera", "Tap cheek satisfied", "Look surprised at result",
      "Point ke wajah glow", "Happy nod to camera",
    ],
    electronics: [
      "React impressed lihat layar", "Nod while holding gadget", "Point ke fitur keren",
      "Show device with smile", "Tap screen confidently", "Thumbs up with gadget",
      "Look amazed at feature", "Show gadget working",
    ],
    food: [], health: [], home: [],
  },
  Convert: {
    universal: [
      "Pegang produk ke kamera sambil senyum", "Angkat produk setinggi dada", "Thumbs up sambil hold produk",
      "Point ke produk sambil ngomong", "Hold produk dekat lens", "Show produk steady ke kamera",
      "Nod sambil pegang produk", "Present produk dua tangan",
    ],
    fashion: [
      "Show outfit full body", "Point ke outfit sambil smile", "Hold hanger ke kamera",
      "Turn body tunjukin fit", "Pose outfit confident", "Walk toward camera",
    ],
    skincare: [
      "Hold bottle next to face", "Show texture close-up", "Point ke produk di tangan",
      "Smile sambil hold jar", "Raise bottle ke kamera", "Close-up product reveal",
    ],
    electronics: [
      "Hold gadget ke kamera", "Point ke screen", "Show device confidently",
      "Raise gadget to lens", "Tap gadget sambil nod", "Present gadget dua tangan", "Flip gadget then smile",
    ],
    food: [], health: [], home: [],
  },
};

// Build inherits from Demo
ACTIONS.Build = { ...ACTIONS.Demo };

/** Normalize category string to ActionCategory */
function normalizeCategory(cat?: string): ActionCategory {
  if (!cat) return "universal";
  const lower = cat.toLowerCase();
  if (lower.includes("fashion") || lower.includes("baju") || lower.includes("outfit")) return "fashion";
  if (lower.includes("skincare") || lower.includes("skin") || lower.includes("beauty") || lower.includes("kecantikan")) return "skincare";
  if (lower.includes("electron") || lower.includes("gadget") || lower.includes("tech")) return "electronics";
  if (lower.includes("food") || lower.includes("makan")) return "food";
  if (lower.includes("health") || lower.includes("kesehatan")) return "health";
  if (lower.includes("home") || lower.includes("rumah")) return "home";
  return "universal";
}

function getPool(role: BeatRole, category: ActionCategory): string[] {
  const catActions = ACTIONS[role]?.[category] || [];
  const universalActions = ACTIONS[role]?.universal || [];
  // If category has no specific actions, use universal
  return catActions.length > 0 ? catActions : universalActions;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_ROLES: BeatRole[] = ["Hook", "Build", "Demo", "Proof", "Convert"];

/**
 * Get action chips: 2 category-specific, 1 universal, 1 wildcard from different beat.
 */
export function getActionChips(
  beatRole: string,
  category?: string,
  count: number = 4,
): string[] {
  const role = (beatRole as BeatRole) || "Hook";
  const cat = normalizeCategory(category);

  const catPool = shuffle(getPool(role, cat));
  const uniPool = shuffle(ACTIONS[role]?.universal || []);
  
  // Wildcard: pick from a different beat's category actions
  const otherRoles = ALL_ROLES.filter((r) => r !== role);
  const wildcardRole = otherRoles[Math.floor(Math.random() * otherRoles.length)];
  const wildcardPool = shuffle(getPool(wildcardRole, cat));

  const result: string[] = [];
  const used = new Set<string>();

  const addFrom = (pool: string[], max: number) => {
    for (const item of pool) {
      if (result.length >= count) return;
      if (max <= 0) return;
      if (!used.has(item)) {
        used.add(item);
        result.push(item);
        max--;
      }
    }
  };

  // 2 from category-specific
  addFrom(catPool, 2);
  // 1 from universal (avoid dupes if cat === universal)
  addFrom(uniPool.filter((u) => !used.has(u)), 1);
  // 1 wildcard
  addFrom(wildcardPool.filter((w) => !used.has(w)), 1);

  // Fill remaining if needed
  if (result.length < count) {
    addFrom([...shuffle(catPool), ...shuffle(uniPool)].filter((x) => !used.has(x)), count - result.length);
  }

  return result.slice(0, count);
}

/**
 * Same as getActionChips but guaranteed fresh randomization each call.
 */
export function getShuffledChips(
  beatRole: string,
  category?: string,
  count: number = 4,
): string[] {
  return getActionChips(beatRole, category, count);
}
