import { useState, useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { geminiFetch } from "@/lib/gemini-fetch";
import { buildVideoDirectorInstruction } from "@/lib/frame-lock-prompt";
import { getActionChips, getShuffledChips } from "@/lib/action-chips";
import { generateVideoAndWait } from "@/lib/kie-video-generation";
import { fileToBase64 } from "@/lib/image-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useToast } from "@/hooks/use-toast";

import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CONTENT_TEMPLATES,
  type ContentTemplateKey,
  getContentTemplate,
  isRecommendedForCategory,
} from "@/lib/content-templates";
import { getStoryboardBeats, getStoryRoleColor, type StoryboardBeat } from "@/lib/storyboard-angles";
import { getRandomHooks, getRandomBodyScripts } from "@/lib/tiktok-hooks";
import {
  Upload,
  X,
  Film,
  Sparkles,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
  Play,
  Lock,
  Link2,
  Unlink,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Clapperboard,
  ArrowRight,
} from "lucide-react";

type VideoModel = "grok" | "veo_fast" | "veo_quality" | "kling_std" | "kling_pro";
type FrameStatus = "idle" | "generating" | "completed" | "failed";

interface FrameState {
  sourceImageUrl: string | null;
  dialogue: string;
  action: string;
  actionChips: string[];
  prompt: string;
  model: VideoModel;
  duration: number;
  skipped: boolean;
  status: FrameStatus;
  videoUrl: string | null;
  errorMsg: string;
  elapsed: number;
  expanded: boolean;
  /** Indices of frames combined INTO this one (e.g. [1] means F0+F1) */
  mergedFrames: number[];
  /** If this frame is absorbed into another, store the parent index */
  mergedInto: number | null;
  endFrameUrl: string | null;
  showGalleryPicker?: boolean;
  showStartGallery?: boolean;
  showEndGallery?: boolean;
  scriptGenerating?: boolean;
  promptGenerating?: boolean;
  suggestedModel?: VideoModel;
  suggestedReason?: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

const MODEL_COSTS: Record<VideoModel, number> = {
  grok: 1600,
  kling_std: 2300,
  kling_pro: 4600,
  veo_fast: 6400,
  veo_quality: 32000,
};

const MODEL_LABELS: Record<VideoModel, { label: string; badge: string; badgeColor: string; audio: boolean; cost: string }> = {
  grok: { label: "Grok", badge: "HEMAT", badgeColor: "bg-green-500/20 text-green-400", audio: false, cost: "~Rp 1.600" },
  kling_std: { label: "Kling", badge: "VALUE", badgeColor: "bg-cyan-500/20 text-cyan-400", audio: true, cost: "~Rp 2.300" },
  kling_pro: { label: "Kling Pro", badge: "PRO", badgeColor: "bg-teal-500/20 text-teal-400", audio: true, cost: "~Rp 4.600" },
  veo_fast: { label: "Veo Fast", badge: "STANDARD", badgeColor: "bg-blue-500/20 text-blue-400", audio: true, cost: "~Rp 6.400" },
  veo_quality: { label: "Veo Quality", badge: "PREMIUM", badgeColor: "bg-primary/20 text-primary", audio: true, cost: "~Rp 32.000" },
};

const MODEL_DURATIONS: Record<VideoModel, number[]> = {
  grok: [6, 10],
  kling_std: [5, 8, 10],
  kling_pro: [5, 8, 10, 15],
  veo_fast: [8],
  veo_quality: [8],
};

function analyzePromptForModel(prompt: string, hasDialog: boolean): { model: VideoModel; reason: string } {
  const lower = prompt.toLowerCase();
  
  // Detect complex motion indicators in the generated prompt
  const complexMotion = /eat|chew|bite|swallow|cooking|stir|pour|running|dancing|jumping|spinning|tears? open|rips? open/i.test(lower);
  const cameraMove = /dolly|orbit|truck|tracking|pan_left|pan_right|tilt_up|tilt_down|zoom_in|pull back|camera moves|camera shifts/i.test(lower);
  const keyframeCount = (lower.match(/at \d+(\.\d+)?s:/g) || []).length;
  const manyActions = keyframeCount >= 6;
  
  // Detect simple/static scenes
  const isStatic = /asmr|texture close|extreme close-up|slow reveal|serene|no dialog|ambient only|no speaking/i.test(lower);
  const noDialog = !hasDialog;
  
  // Detect dialog length
  const dialogMatches = lower.match(/"[^"]+"/g) || [];
  const totalDialogWords = dialogMatches.join(" ").split(/\s+/).length;
  const longDialog = totalDialogWords > 15;
  
  // Decision: based on what the prompt actually needs
  
  // Complex motion or many keyframe actions → Kling Pro
  if (complexMotion || manyActions) {
    return { model: "kling_pro", reason: "Complex motion detected — Kling handles this with less glitching" };
  }
  
  // Advanced camera moves → Kling Std
  if (cameraMove) {
    return { model: "kling_std", reason: "Camera movement detected — Kling supports dolly, orbit, tilt natively" };
  }
  
  // Static/ASMR/no dialog → Grok
  if (isStatic || noDialog) {
    return { model: "grok", reason: "Visual-only frame — no audio needed, Grok is cheapest" };
  }
  
  // Long dialog → Veo Fast (best lip sync)
  if (longDialog) {
    return { model: "veo_fast", reason: "Long dialog — Veo has best Indonesian lip sync" };
  }
  
  // Standard scene with short dialog → Kling Std (decent lip sync, cheaper)
  return { model: "kling_std", reason: "Standard scene — good lip sync at lower cost than Veo" };
}

/** Position-based role colors — works with any flexible storyRole string */
const POSITION_ROLE_COLORS = [
  "bg-red-500/20 text-red-400 border-red-500/30",
  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-green-500/20 text-green-400 border-green-500/30",
  "bg-purple-500/20 text-purple-400 border-purple-500/30",
];

function getRoleColor(beatIndex: number): string {
  return POSITION_ROLE_COLORS[beatIndex % POSITION_ROLE_COLORS.length];
}

function BeatPreviewCard({ beat, index }: { beat: StoryboardBeat; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = beat.description.length > 50 || beat.label.length > 20;
  return (
    <div
      className={`border border-border rounded-lg p-2 bg-muted/10 min-w-0 cursor-pointer transition-all ${expanded ? "col-span-5 sm:col-span-2" : ""}`}
      onClick={() => isLong && setExpanded(!expanded)}
    >
      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${getStoryRoleColor(beat.storyRole, index)}`}>
        {beat.storyRole}
      </span>
      <p className={`text-[10px] font-semibold text-foreground mt-1 ${expanded ? "" : "truncate"}`}>{beat.label}</p>
      <p className="text-[8px] text-muted-foreground/60">{beat.beat}</p>
      <p className={`text-[8px] text-muted-foreground mt-1 ${expanded ? "" : "line-clamp-3"}`}>{beat.description}</p>
      {isLong && (
        <span className="text-[7px] text-primary mt-1 inline-flex items-center gap-0.5">
          {expanded ? "Sembunyikan" : "Selengkapnya"}
        </span>
      )}
    </div>
  );
}

/** Templates with heavy dialog → recommend Veo all */
const DIALOG_HEAVY_TEMPLATES: ContentTemplateKey[] = ["problem_solution", "review_jujur", "quick_haul"];
/** Templates mostly visual → mixed recommendation */
const VISUAL_HEAVY_TEMPLATES: ContentTemplateKey[] = ["asmr_aesthetic", "pov_style"];

function getModelRecommendation(template: ContentTemplateKey): { text: string; variant: "dialog" | "visual" | "hemat" } {
  if (DIALOG_HEAVY_TEMPLATES.includes(template)) {
    return {
      text: "Rekomendasi: Veo Fast untuk semua frame (audio + lip sync) — ~Rp 24.000 total",
      variant: "dialog",
    };
  }
  if (VISUAL_HEAVY_TEMPLATES.includes(template)) {
    return {
      text: "Rekomendasi: Grok untuk frame tanpa dialog, Veo untuk frame dengan dialog — ~Rp 12.000 total",
      variant: "visual",
    };
  }
  return {
    text: "Hemat: Grok semua frame (tanpa audio) — ~Rp 8.000 total",
    variant: "hemat",
  };
}

/** Smart dialog suggestions — maps flexible storyRoles to casual Indonesian dialog */
const ROLE_DIALOG_MAP: Record<string, (productCategory?: string) => string> = {
  // Opening / Hook roles
  "Problem": () => "Ini nih yang bikin aku kesel. Udah coba banyak tapi ga works.",
  "Hook": (cat) => { const hooks = getRandomHooks("problem_solution" as ContentTemplateKey, 1); return hooks[0] || "Ini tuh ternyata sebagus ini. Awalnya ragu tapi setelah coba sendiri..."; },
  "Skeptical": () => "Beneran nih ini bagus? Aku ragu awalnya. Tapi yaudah coba dulu aja.",
  "Morning": () => "Pagi-pagi langsung skincare-an dulu dong. Ini udah jadi rutinitas wajib aku.",
  "First Look": () => "Baru pertama kali liat produk ini. Penasaran banget, kita liat ya.",
  "Excitement": () => "GUYS! Akhirnya dateng yang aku tunggu-tunggu! Kita unboxing bareng ya!",
  "Anticipation": () => "Penasaran banget sama ini. Banyak yang bilang bagus, aku mau buktiin sendiri.",
  "Setup": () => "Oke jadi aku mau tunjukin cara pakainya. Simpel banget sebenernya.",
  "POV Reach": () => "",
  "Texture": () => "",

  // Mid roles
  "Pain Amplification": () => "Capek banget ngerasain kayak gini terus. Makanya aku cari solusinya.",
  "Personal": () => "Aku udah pake ini seminggu. Honestly mulai kerasa bedanya.",
  "Routine Start": () => "Langsung ambil produknya, udah jadi daily routine. Gampang banget.",
  "Expectation": () => "Di packaging bilang bisa gini gitu. Penasaran apa beneran, kita buktiin.",
  "Alasan 1": () => "Alasan pertama kenapa aku suka. Hasilnya kerasa cepet banget.",
  "Midday": () => "Siang-siang gini tetep fresh. Ga perlu touch up sama sekali.",
  "First Open": () => "Wah packaging-nya bagus juga ya. Keliatan premium buat harga segini.",
  "Reveal": () => "Ini nih isinya, cakep banget. Desainnya minimalis tapi keliatan mahal.",
  "Step 1": () => "Pertama ambil secukupnya dulu. Ga perlu banyak, dikit aja cukup.",

  // Demo / Usage roles  
  "Demo": (cat) => {
    const demos: Record<string, string> = {
      skincare: "Cobain langsung di kulit aku. Teksturnya ringan, cepet nyerep. Ga lengket.",
      fashion: "Aku pake langsung ya. Jatuhnya bagus, bahannya adem. Fit-nya pas.",
      food: "Langsung cobain ya. Enak banget, rasanya pas. Ga terlalu manis.",
      electronics: "Nyalain dulu nih. Responsif banget, smooth. Fitur ini yang bikin worth it.",
      health: "Langsung minum kayak biasa. Rasanya ga aneh, gampang banget.",
      home: "Pasang langsung ya. Bagus kan jadinya. Kualitasnya oke buat harga segini.",
    };
    return demos[(cat || "").toLowerCase()] || "Langsung cobain ya. Cara pakainya gampang. Hasilnya langsung keliatan.";
  },
  "Usage": (cat) => ROLE_DIALOG_MAP["Demo"]?.(cat) || "Aku pake langsung, gampang banget. Simpel dan kelar.",
  "Product Step": () => "Ini step paling penting. Jangan di-skip, ini yang bikin hasilnya maksimal.",
  "Application": () => "Apply-nya gampang, tinggal ratain aja. Siapa aja bisa.",
  "Try": () => "Oke cobain langsung ya. Biar kalian liat sendiri. Simpel banget.",
  "First Try": () => "Pertama kali pake nih, deg-degan. Tapi ternyata gampang banget.",
  "Product Moment": () => "Siang hari gini aku selalu pake ini. Udah jadi kebiasaan.",
  "Alasan 2": () => "Alasan kedua, ini tahan lama banget. Pagi sampe malem masih oke.",
  "Step 2": () => "Step kedua, ratain pelan-pelan. Ga usah buru-buru. Gampang kan?",
  "Speed Demo": () => "Cepet banget cara makenya. Cuma butuh beberapa detik. Praktis.",
  "Sensory": () => "",
  "Slow Reveal": () => "",
  "POV Inspect": () => "",
  "POV Use": () => "",
  "Discovery": () => "Wah, ini ternyata bagus banget ya. Aku ga expect sama sekali. Beneran surprised sih aku.",

  // Result / Proof roles
  "Result": () => "Beneran kerasa bedanya. Ga expect secepet ini hasilnya. Worth it.",
  "After Reveal": () => "Kerasa bedanya sih. Liat sendiri before after-nya. Gila hasilnya.",
  "Reality": () => "Wait, ini beneran bagus dong?! Aku kira biasa aja ternyata engga.",
  "Alasan 3": () => "Alasan ketiga, harganya worth it banget sama kualitasnya. Ga nyesel.",
  "Almost Ready": () => "Tinggal finishing touch aja. Bentar lagi kelar. Ga sabar liat hasilnya.",
  "Benefit": () => "Kerasa banget benefitnya setelah rutin pake. Beneran recommended.",
  "Assessment": () => "Overall menurutku worth it. Plus minusnya lebih banyak plusnya.",
  "Impressed": () => "Aku kaget, hasilnya sebagus ini. Ga expect sama sekali. Harus coba.",
  "Initial Result": () => "Baru pertama pake udah kerasa bedanya. Cepet banget keliatan.",
  "POV Result": () => "",
  "Serene": () => "",

  // CTA / Close roles
  "CTA": () => "Pokoknya ini harus punya. Udah recommend ke temen-temen juga. Coba deh!",
  "Soft CTA": () => "Menurutku worth it banget. Harganya segitu dapet kualitas gini. Coba deh.",
  "Confidence": () => "Pede banget jadinya setelah pake ini. Game changer. Kalian harus coba.",
  "Ready": () => "Siap jalan! Produk ini ngebantu banget. Ga bisa balik ke yang lain.",
  "Converted": () => "Oke tarik kata-kata aku, ini bagus banget. Sekarang jadi langganan. Worth it!",
  "Summary": () => "Kesimpulannya, worth it banget. Bakal repurchase pasti. Kalian harus coba.",
  "Verdict": () => "Honest opinion, ini recommended banget. Ga bakal nyesel. Coba aja.",
  "Evening": () => "Malam-malam gini masih kerasa efeknya. Awet banget. Aku impressed.",
  "Wrap Up": () => "Gampang kan ternyata? Simpel tapi hasilnya kerasa. Coba deh!",
  "Show Off": () => "Ini harus punya, serius. Beneran bagus. Must have banget.",
  "Face Reveal": () => "Tadaaa! Hasilnya kayak gini. Gimana menurut kalian? Bagus kan?",
};

function getSmartDialogSuggestion(
  role: string,
  templateKey: ContentTemplateKey,
  productCategory?: string,
): string {
  // Try exact role match first
  const generator = ROLE_DIALOG_MAP[role];
  if (generator) return generator(productCategory);
  
  // Fallback: try to find via template hooks
  const hooks = getRandomHooks(templateKey, 1);
  if (hooks[0]) return hooks[0];
  
  return "";
}

import { imageUrlToBase64WithMime as imageUrlToBase64 } from "@/lib/image-utils";

const VideoPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { kieApiKey, geminiKey, keys } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { toast } = useToast();

  // Navigation state from storyboard
  const navState = location.state as any;
  const [fromStoryboard, setFromStoryboard] = useState(navState?.fromStoryboard === true);
  const [storyboardImages, setStoryboardImages] = useState<string[]>(navState?.storyboardImages || []);

  // ─── First-class product info state ───
  interface ProductInfo {
    category: string;
    sub_category: string;
    product_description: string;
  }
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    category: "",
    sub_category: "",
    product_description: "",
  });
  const [detectingProduct, setDetectingProduct] = useState(false);

  // Load productInfo from storyboard navigation state
  useEffect(() => {
    const dna = navState?.productDNA || navState?.productDna;
    if (dna && (dna.category || dna.product_description)) {
      setProductInfo({
        category: dna.category || "",
        sub_category: dna.sub_category || "",
        product_description: dna.product_description || "",
      });
    } else if (navState?.productCategory) {
      setProductInfo((prev) => ({ ...prev, category: navState.productCategory }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived values from productInfo
  const productCategory = productInfo.category || "other";
  const productContextLine = productInfo.product_description
    ? `Product: ${productInfo.product_description} (category: ${productInfo.category || "other"}/${productInfo.sub_category || "general"}). Dialog and prompt MUST reference THIS specific product only. Do NOT mention other product types.`
    : productInfo.category
      ? `Product category: ${productInfo.category}. Reference this product type specifically.`
      : "";

  /** Auto-detect product from image via Gemini — uses stored base64 or falls back to URL */
  const detectProductFromImage = async (b64Override?: { mimeType: string; data: string } | null) => {
    if (!geminiKey || keys.gemini.status !== "valid") return;
    const b64 = b64Override || imageAsBase64;
    if (!b64) { return; }
    setDetectingProduct(true);
    try {
      const json = await geminiFetch(promptModel, geminiKey!, {
        contents: [{
          parts: [
            { inlineData: { mimeType: b64.mimeType, data: b64.data } },
            { text: `What product is in this image? Return JSON only, no explanation: { "category": "skincare|fashion|food|electronics|health|home|other", "sub_category": "specific type like kebaya, face serum, sneakers", "product_description": "detailed visual description of the product" }` },
          ],
        }],
      });
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.category || parsed.product_description) {
        setProductInfo({
          category: (parsed.category || "other").toLowerCase(),
          sub_category: parsed.sub_category || "",
          product_description: parsed.product_description || "",
        });
      }
    } catch (e) {
      console.error("Product detection failed:", e);
    }
    setDetectingProduct(false);
  };

  // Source image (standalone mode)
  const [sourceUrl, setSourceUrl] = useState<string | null>(navState?.sourceImage || null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(navState?.sourceImage || null);
  const [uploading, setUploading] = useState(false);
  // Stored base64 from FileReader (CORS-free) for Gemini calls
  const [imageAsBase64, setImageAsBase64] = useState<{ mimeType: string; data: string } | null>(null);

  // Template
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplateKey>(
    navState?.template || "problem_solution"
  );

  // Gallery
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);

  // Aspect ratio
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");

  // Frame states
  const [frames, setFrames] = useState<FrameState[]>([]);
  const [setupDone, setSetupDone] = useState(false);
  const [planningStoryboard, setPlanningStoryboard] = useState(false);
  const [storyboardPlanned, setStoryboardPlanned] = useState(false);
  const [environmentDesc, setEnvironmentDesc] = useState<string>("");

  // Batch generation
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchCurrentFrame, setBatchCurrentFrame] = useState(-1);
  const batchCancelRef = useRef(false);

  // Per-frame timers
  const frameTimersRef = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  const beats = getStoryboardBeats(selectedTemplate);
  // storyboardImages is now state (synced via keep-alive useEffect)
  const modelRec = getModelRecommendation(selectedTemplate);

  // Load gallery
  useEffect(() => {
    if (!user || galleryLoaded) return;
    supabase
      .from("generations")
      .select("id, image_url")
      .eq("user_id", user.id)
      .not("image_url", "is", null)
      .neq("type", "video")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setGalleryImages((data || []).filter((d) => d.image_url) as GalleryImage[]);
        setGalleryLoaded(true);
      });
  }, [user, galleryLoaded]);

  // Initialize frames when template changes or setup begins
  const initializeFrames = useCallback(() => {
    const newFrames: FrameState[] = beats.map((beat, i) => {
      // Smart dialog suggestion based on story role + product category
      const defaultDialogue = getSmartDialogSuggestion(beat.storyRole, selectedTemplate, productCategory);
      const hasDialogue = !!defaultDialogue.trim();
      const defaultModel: VideoModel = hasDialogue ? "kling_std" : "grok";
      const defaultDuration = MODEL_DURATIONS[defaultModel]?.[Math.min(1, MODEL_DURATIONS[defaultModel].length - 1)] || 8;

      // Source image: storyboard image if available, else source image
      const frameSource = fromStoryboard && storyboardImages[i]
        ? storyboardImages[i]
        : sourceUrl;

      return {
        sourceImageUrl: frameSource,
        dialogue: defaultDialogue,
        action: beat.description,
        actionChips: getActionChips(beat.storyRole, productCategory),
        prompt: "",
        model: defaultModel,
        duration: defaultDuration,
        skipped: false,
        status: "idle" as FrameStatus,
        videoUrl: null,
        errorMsg: "",
        elapsed: 0,
        expanded: i === 0,
        mergedFrames: [],
        mergedInto: null,
        endFrameUrl: null,
      };
    });
    setFrames(newFrames);
    setSetupDone(true);
  }, [beats, selectedTemplate, fromStoryboard, storyboardImages, sourceUrl, productCategory]);

  // Auto-init from storyboard
  useEffect(() => {
    if (fromStoryboard && !setupDone && sourceUrl) {
      initializeFrames();
    }
  }, [fromStoryboard, setupDone, sourceUrl, initializeFrames]);

  // Keep-alive state sync: when location.state changes (re-navigation), re-sync all state
  useEffect(() => {
    const state = location.state as any;
    if (state?.fromStoryboard && state?.sourceImage) {
      setFromStoryboard(true);
      setSourceUrl(state.sourceImage);
      setSourcePreview(state.sourceImage);
      if (state.storyboardImages) setStoryboardImages(state.storyboardImages);
      if (state.template) setSelectedTemplate(state.template);
      const dna = state.productDNA || state.productDna;
      if (dna && (dna.category || dna.product_description)) {
        setProductInfo({
          category: dna.category || "",
          sub_category: dna.sub_category || "",
          product_description: dna.product_description || "",
        });
      } else if (state.productCategory) {
        setProductInfo((prev) => ({ ...prev, category: state.productCategory }));
      }
      // Reset frames so initializeFrames runs again with new data
      setSetupDone(false);
      setFrames([]);
      setStoryboardPlanned(false);
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Plan Storyboard — ONE Gemini call to detect product + plan all 5 frames */
  const planStoryboard = async () => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", variant: "destructive" });
      return;
    }
    // Initialize empty frames first (for skeleton display)
    initializeFrames();
    setPlanningStoryboard(true);

    try {
      const template = getContentTemplate(selectedTemplate);
      const beatDescriptions = beats.map((b, i) =>
        `Frame ${i + 1} (${b.storyRole}): ${b.label} — ${b.description}`
      ).join("\n");

      const contentParts: any[] = [];

      // Use stored base64 from FileReader (CORS-free), fall back to URL fetch
      let imageIncluded = false;
      if (imageAsBase64) {
        contentParts.push({ inlineData: { mimeType: imageAsBase64.mimeType, data: imageAsBase64.data } });
        imageIncluded = true;
      } else if (sourceUrl) {
        const b64 = await imageUrlToBase64(sourceUrl);
        if (b64) {
          contentParts.push({ inlineData: { mimeType: b64.mimeType, data: b64.data } });
          imageIncluded = true;
        }
      }

      contentParts.push({
        text: `${imageIncluded ? "Analyze this product image." : "No image available."} Then create a complete 5-frame video storyboard plan for a '${template?.label}' UGC TikTok video.

Template: ${template?.label} — ${template?.desc}

The 5 story beats are:
${beatDescriptions}

Return JSON only, no explanation:
{
  "product": {
    "category": "skincare | fashion | food | electronics | health | home | other",
    "sub_category": "specific type like kebaya, face serum, sneakers",
    "description": "detailed visual description of the product"
  },
  "environment": "Detailed description of the setting/environment visible in the reference image: room type, wall color/texture, floor material, furniture, props, decorations, lighting direction, light color temperature, shadow placement, overall mood. Be very specific.",
  "frames": [
    {
      "beat": "Hook",
      "action": "Physical movement/action description in Indonesian casual style",
      "dialog": "1-2 sentence TikTok dialog in casual Indonesian (bahasa gaul)",
      "prompt": "Detailed 8-second video prompt in English describing the scene, movement, lighting, camera angle, and subject behavior. Must match the reference image person/outfit/environment exactly."
    },
    ... (all 5 frames)
  ]
}

Rules:
- Each action must be specific to THIS product (not generic)
- Dialog must be natural casual Indonesian (bahasa gaul TikTok)
- Prompts must describe continuous 8-second scenes with natural movement
- Each frame's prompt should create visual continuity with the previous frame
- The subject behaves like a TikTok content creator — spontaneous, casual, not posed
- ${imageIncluded ? "Match the person, outfit, and environment from the reference image in all prompts" : "Describe a young Indonesian female content creator in a clean, well-lit room"}`
      });

      const json = await geminiFetch(promptModel, geminiKey!, {
        contents: [{ parts: contentParts }],
      });

      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // Set product info from plan
      if (parsed.product) {
        setProductInfo({
          category: (parsed.product.category || "other").toLowerCase(),
          sub_category: parsed.product.sub_category || "",
          product_description: parsed.product.description || parsed.product.product_description || "",
        });
      }

      // Set environment description from plan
      if (parsed.environment) {
        setEnvironmentDesc(parsed.environment);
      }

      // Fill all frames from plan
      if (parsed.frames && Array.isArray(parsed.frames)) {
        setFrames((prev) =>
          prev.map((frame, i) => {
            const planned = parsed.frames[i];
            if (!planned) return frame;
            const hasDialog = !!planned.dialog?.trim();
            const defaultModel: VideoModel = hasDialog ? "kling_std" : "grok";
            const dur = MODEL_DURATIONS[defaultModel]?.[Math.min(1, MODEL_DURATIONS[defaultModel].length - 1)] || 8;
            return {
              ...frame,
              action: planned.action || frame.action,
              dialogue: planned.dialog || frame.dialogue,
              prompt: planned.prompt || frame.prompt,
              model: defaultModel,
              duration: dur,
              actionChips: getActionChips(
                beats[i]?.storyRole || "Hook",
                (parsed.product?.category || productCategory).toLowerCase()
              ),
            };
          })
        );
      }

      setStoryboardPlanned(true);
      toast({ title: "Storyboard berhasil direncanakan!", description: "Edit setiap frame sesuai kebutuhan." });
    } catch (e: any) {
      console.error("Plan storyboard failed:", e);
      toast({
        title: "Gagal merencanakan storyboard",
        description: e?.message || "Coba lagi",
        variant: "destructive",
      });
      // Frames are still initialized (with defaults), user can still edit manually
      setStoryboardPlanned(true);
    }
    setPlanningStoryboard(false);
  };

  const updateFrame = (idx: number, patch: Partial<FrameState>) => {
    setFrames((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  // Combine frame idx with the next available frame
  const combineWithNext = (idx: number) => {
    setFrames((prev) => {
      const next = prev.slice();
      const parentFrame = next[idx];
      // Check: max 3 frames combined total
      const currentMergedCount = parentFrame.mergedFrames.length + 1; // +1 for self
      if (currentMergedCount >= 3) return prev;

      // Find the next available frame (after all currently merged ones)
      const lastIdx = parentFrame.mergedFrames.length > 0
        ? Math.max(...parentFrame.mergedFrames)
        : idx;
      const targetIdx = lastIdx + 1;

      if (targetIdx >= next.length) return prev;
      if (next[targetIdx].mergedInto !== null) return prev;
      if (next[targetIdx].mergedFrames.length > 0) return prev;

      // Merge target into parent
      next[idx] = {
        ...parentFrame,
        mergedFrames: [...parentFrame.mergedFrames, targetIdx],
        sourceImageUrl: storyboardImages[idx] || parentFrame.sourceImageUrl,
        endFrameUrl: storyboardImages[targetIdx] || null,
        dialogue: [parentFrame.dialogue, next[targetIdx].dialogue].filter(Boolean).join(" "),
        prompt: "", // clear prompt so it regenerates with combined context
        status: "idle",
        videoUrl: null,
      };
      next[targetIdx] = {
        ...next[targetIdx],
        mergedInto: idx,
        skipped: true,
      };
      return next;
    });
  };

  // Split a combined frame — restore all merged frames
  const splitFrame = (idx: number) => {
    setFrames((prev) => {
      const next = prev.slice();
      const parent = next[idx];
      const mergedIndices = parent.mergedFrames;

      // Restore each merged frame
      for (const mi of mergedIndices) {
        const beat = beats[mi];
        next[mi] = {
          ...next[mi],
          mergedInto: null,
          skipped: false,
          dialogue: getSmartDialogSuggestion(beat.storyRole, selectedTemplate, productCategory),
          action: beat.description,
          actionChips: getActionChips(beat.storyRole, productCategory),
          status: "idle",
          videoUrl: null,
          prompt: "",
        };
      }
      // Restore parent
      next[idx] = {
        ...parent,
        mergedFrames: [],
        dialogue: getSmartDialogSuggestion(beats[idx].storyRole, selectedTemplate, productCategory),
        action: beats[idx].description,
        actionChips: getActionChips(beats[idx].storyRole, productCategory),
        prompt: "",
        status: "idle",
        videoUrl: null,
      };
      return next;
    });
  };

  // Upload handler
  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10MB", variant: "destructive" });
      return;
    }
    setSourcePreview(URL.createObjectURL(file));
    setUploading(true);

    // Convert File to base64 immediately (CORS-free) using shared utility
    const b64Data = await fileToBase64(file);
    const mimeType = file.type || "image/jpeg";
    const b64 = { mimeType, data: b64Data };
    setImageAsBase64(b64);

    const ext = file.name.split(".").pop();
    const path = `${user!.id}/video-sources/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setSourceUrl(urlData.publicUrl);
    setUploading(false);
    // Auto-detect product using the locally-captured base64
    if (!productInfo.product_description && b64) {
      detectProductFromImage(b64);
    }
  };

  // Generate script AI per frame
  const generateFrameScript = async (idx: number) => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", variant: "destructive" });
      return;
    }
    const frame = frames[idx];
    const beat = beats[idx];
    const template = getContentTemplate(selectedTemplate);
    const prevDialog = idx > 0 ? frames[idx - 1]?.dialogue : "";
    const mergedBeats = frame.mergedFrames.map((mi) => beats[mi]).filter(Boolean);
    const isCombined = mergedBeats.length > 0;

    updateFrame(idx, { dialogue: "...", scriptGenerating: true });
    try {
      let systemText: string;
      let contentText: string;

      if (isCombined) {
        const allBeats = [beat, ...mergedBeats];
        const combinedDuration = allBeats.length * 8;
        const beatDescList = allBeats.map((b) => `'${b.label}' — ${b.description}`).join(", then naturally flowing into ");
        systemText = `You are a TikTok content script writer specializing in Indonesian casual/gaul language.
${productContextLine}
Write a short spoken dialog covering ${allBeats.length} beats in one natural flow. Maximum 25-30 words total (this is still only ${combinedDuration} seconds of video). 2-3 sentences max. Do NOT write more — the person speaks at normal pace, not rushing.
Beats: first ${beatDescList}.
Previous frame's dialog was: '${prevDialog}'.
Casual Indonesian. Output ONLY the script text.`;
        contentText = `Combined beats for a '${template?.label}' video:\n${allBeats.map((b, i) => `Beat ${i + 1}: ${b.storyRole} — ${b.description}`).join("\n")}`;
      } else {
        const duration = frames[idx]?.duration || 8;
        systemText = `You are a TikTok content script writer specializing in Indonesian casual/gaul language.
${productContextLine}
Write a short spoken dialog for the '${beat.label}' part. Maximum 20-25 words (about ${duration} seconds of natural speech). 2 sentences max. Do NOT write more.
Previous frame's dialog was: '${prevDialog}'.
This should flow naturally as the next thing the person would say. Casual Indonesian.
Output ONLY the script text.`;
        contentText = `Beat: ${beat.storyRole} — ${beat.description}`;
      }

      const json = await geminiFetch(promptModel, geminiKey!, {
        systemInstruction: { parts: [{ text: systemText }] },
        contents: [{ parts: [{ text: contentText }] }],
      });
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      updateFrame(idx, { dialogue: text || frame.dialogue, scriptGenerating: false });
    } catch {
      updateFrame(idx, { dialogue: frame.dialogue === "..." ? "" : frame.dialogue, scriptGenerating: false });
      toast({ title: "Gagal generate script", variant: "destructive" });
    }
  };

  // Generate video prompt per frame
  const generateFramePrompt = async (idx: number): Promise<string> => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      return frames[idx].prompt;
    }
    updateFrame(idx, { promptGenerating: true });
    const frame = frames[idx];
    const beat = beats[idx];
    const template = getContentTemplate(selectedTemplate);
    const prevPrompt = idx > 0 ? frames[idx - 1]?.prompt : undefined;

    const sysText = buildVideoDirectorInstruction({
      shotIndex: idx,
      totalShots: 5,
      duration: frame.duration || 8,
      moduleType: beat.storyRole.toLowerCase(),
      previousPrompt: prevPrompt,
      withDialogue: !!frame.dialogue.trim(),
      dialogueText: frame.dialogue.trim() || null,
      audioDirection: frame.dialogue.trim() ? "natural spoken dialogue, clear and intimate" : "ambient sounds only",
      contentTemplate: selectedTemplate,
      model: frame.model,
      environmentDescription: environmentDesc || undefined,
    });

    const contentParts: any[] = [];
    // Use stored base64 (CORS-free) for visual reference, fall back to URL fetch
    if (imageAsBase64) {
      contentParts.push({ inlineData: { mimeType: imageAsBase64.mimeType, data: imageAsBase64.data } });
      contentParts.push({ text: "This is the reference image. Match the person, outfit, environment, and lighting EXACTLY. Do NOT reinterpret any visual element." });
    } else {
      const imgUrl = frame.sourceImageUrl || sourceUrl;
      if (imgUrl) {
        const b64 = await imageUrlToBase64(imgUrl);
        if (b64) {
          contentParts.push({ inlineData: { mimeType: b64.mimeType, data: b64.data } });
          contentParts.push({ text: "This is the reference image. Match the person, outfit, environment, and lighting EXACTLY. Do NOT reinterpret any visual element." });
        }
      }
    }

    const prevBeatDesc = idx > 0 ? beats[idx - 1]?.description : "";
    const productDesc = productInfo.product_description || productInfo.category || "consumer product";
    const mergedBeats = frame.mergedFrames.map((mi) => beats[mi]).filter(Boolean);
    const isCombined = mergedBeats.length > 0;

    if (isCombined) {
      const allBeats = [beat, ...mergedBeats];
      const beatDescriptions = allBeats.map((b, i) => `Beat ${i + 1} (${b.storyRole}): ${b.description}`).join("\n");
      contentParts.push({
        text: `Create a single 8-second continuous video prompt covering ${allBeats.length} story beats in sequence for a '${template?.label}' UGC video.
Reference image is attached — match the person, outfit, environment, and lighting exactly.

${beatDescriptions}

The person naturally transitions from the first action to the next within one take. No cuts, one flowing scene.
Primary movement/action: ${frame.action.trim() || allBeats.map((b) => b.description).join("; ")}
${frame.dialogue.trim() ? `Dialog: '${frame.dialogue.trim()}'` : "No dialog."}
Product: ${productDesc}
The subject behaves like a TikTok content creator — spontaneous, casual, not posed.`,
      });
    } else {
      contentParts.push({
        text: `Generate a video prompt for frame ${idx + 1} (${beat.label}) of a '${template?.label}' UGC video.
Reference image is attached — match the person, outfit, environment, and lighting exactly.
Beat description: ${beat.description}
Primary movement/action: ${frame.action.trim() || beat.description}
${frame.dialogue.trim() ? `Dialog to include: '${frame.dialogue.trim()}'` : "No dialog for this frame."}
Product: ${productDesc}
${idx > 0 ? `This frame follows frame ${idx} which showed: '${prevBeatDesc}'. Create natural continuity.` : "This is the opening frame."}
The subject behaves like a TikTok content creator — spontaneous, casual, not posed.
Storyboard beat timing: ${beat.beat}
Content template: ${template?.label}`,
      });
    }

    try {
      const json = await geminiFetch(promptModel, geminiKey!, {
        systemInstruction: { parts: [{ text: sysText }] },
        contents: [{ parts: contentParts }],
      });
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      if (text) {
        updateFrame(idx, { prompt: text, promptGenerating: false });
        return text;
      }
    } catch (e: any) {
      console.error("Prompt gen failed:", e);
    }
    updateFrame(idx, { promptGenerating: false });
    return frame.prompt;
  };

  // Per-frame cancel ref for individual and batch generation
  const frameCancelRef = useRef(false);

  // Generate single frame video
  const generateFrame = async (idx: number) => {
    if (!kieApiKey || keys.kie_ai.status !== "valid") {
      toast({ title: "Kie AI API key belum di-setup", variant: "destructive" });
      return;
    }
    const frame = frames[idx];
    const imgUrl = frame.sourceImageUrl || sourceUrl;
    if (!imgUrl) {
      toast({ title: "Source image belum di-upload", variant: "destructive" });
      return;
    }

    frameCancelRef.current = false;
    updateFrame(idx, { status: "generating", videoUrl: null, errorMsg: "", elapsed: 0 });

    // Start timer
    frameTimersRef.current[idx] = setInterval(() => {
      setFrames((prev) => prev.map((f, i) => (i === idx ? { ...f, elapsed: f.elapsed + 1 } : f)));
    }, 1000);

    try {
      // Auto-generate prompt if empty
      let usedPrompt = frame.prompt;
      if (!usedPrompt.trim()) {
        usedPrompt = await generateFramePrompt(idx);
      }
      if (!usedPrompt.trim()) {
        throw new Error("Tidak bisa generate prompt. Periksa Gemini API key.");
      }

      const beat = beats[idx];
      const duration = frame.duration || 8;

      // Build image URLs — use dual input for combined Veo frames (start + end frame)
      const isVeo = frame.model === "veo_fast" || frame.model === "veo_quality";
      const isCombined = frame.mergedFrames.length > 0;

      let videoImageUrls: string[];
      if (isVeo && isCombined) {
        // Combined frames: use start + end frame images
        const startImg = frame.sourceImageUrl || storyboardImages[idx] || imgUrl;
        const endFrameRemoved = frame.endFrameUrl === "__none__";
        const endImg = endFrameRemoved ? null : (frame.endFrameUrl || storyboardImages[frame.mergedFrames[frame.mergedFrames.length - 1]]);
        videoImageUrls = (endImg && startImg !== endImg) ? [startImg, endImg] : [startImg];
      } else {
        // Single frame or Grok: one image only
        videoImageUrls = [imgUrl];
      }

      const result = await generateVideoAndWait(
        {
          model: frame.model,
          prompt: usedPrompt,
          imageUrls: videoImageUrls,
          duration,
          aspectRatio,
          apiKey: kieApiKey,
        },
        () => frameCancelRef.current || batchCancelRef.current,
      );

      clearInterval(frameTimersRef.current[idx]);
      updateFrame(idx, { status: "completed", videoUrl: result.videoUrl });

      // Save to gallery
      await supabase.from("generations").insert({
        user_id: user!.id,
        type: "video",
        image_url: result.videoUrl,
        prompt: usedPrompt,
        model: frame.model === "grok" ? "grok-imagine" : frame.model === "kling_std" ? "kling-3.0-std" : frame.model === "kling_pro" ? "kling-3.0-pro" : frame.model === "veo_fast" ? "veo3_fast" : "veo3",
        provider: "kie_ai",
        status: "completed",
        metadata: {
          storyboard_frame: idx + 1,
          beat_label: beat.label,
          story_role: beat.storyRole,
          content_template: selectedTemplate,
        },
      });
    } catch (err: any) {
      clearInterval(frameTimersRef.current[idx]);
      updateFrame(idx, { status: "failed", errorMsg: err?.message || "Gagal" });
    }
  };

  // Batch generate all
  const generateAll = async () => {
    batchCancelRef.current = false;
    setBatchGenerating(true);

    const batchFrames = frames.map((f, i) => ({ ...f, idx: i })).filter((f) => !f.skipped && f.mergedInto === null);

    for (let n = 0; n < batchFrames.length; n++) {
      if (batchCancelRef.current) break;
      const { idx } = batchFrames[n];
      setBatchCurrentFrame(idx);
      await generateFrame(idx);
      // 3s delay between frames
      if (n < batchFrames.length - 1 && !batchCancelRef.current) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    setBatchGenerating(false);
    setBatchCurrentFrame(-1);
  };

  const cancelBatch = () => {
    batchCancelRef.current = true;
  };

  // Computed — exclude merged-into frames from active
  const anyGenerating = frames.some((f) => f.status === "generating");
  const activeFrames = frames.filter((f) => !f.skipped && f.mergedInto === null);
  const totalCost = activeFrames.reduce((s, f) => s + MODEL_COSTS[f.model], 0);
  const completedFrames = frames.filter((f) => f.status === "completed" && f.mergedInto === null);
  const skippedCount = frames.filter((f) => f.skipped && f.mergedInto === null).length;
  const mergedCount = frames.filter((f) => f.mergedInto !== null).length;
  const failedCount = frames.filter((f) => f.status === "failed" && f.mergedInto === null).length;
  const allDone = frames.length > 0 && frames.every((f) => f.skipped || f.mergedInto !== null || f.status === "completed");
  const totalDuration = activeFrames.reduce((s, f) => {
    if (f.status !== "completed") return s;
    return s + (f.duration || 8);
  }, 0);
  const actualCost = completedFrames.reduce((s, f) => s + MODEL_COSTS[f.model], 0);

  // Sequential player
  const [playingAll, setPlayingAll] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const playerRef = useRef<HTMLVideoElement>(null);

  const completedVideos = frames
    .map((f, i) => ({ ...f, idx: i, beat: beats[i] }))
    .filter((f) => !f.skipped && f.status === "completed" && f.videoUrl);

  const handlePlayAll = () => {
    if (completedVideos.length === 0) return;
    setPlayIndex(0);
    setPlayingAll(true);
  };

  const handleVideoEnded = () => {
    if (playIndex < completedVideos.length - 1) {
      setPlayIndex((p) => p + 1);
    } else {
      setPlayingAll(false);
    }
  };

  useEffect(() => {
    if (playingAll && playerRef.current) {
      playerRef.current.load();
      playerRef.current.play().catch(() => {});
    }
  }, [playIndex, playingAll]);

  // Download all
  const downloadAll = () => {
    completedVideos.forEach((v) => {
      const a = document.createElement("a");
      a.href = v.videoUrl!;
      a.download = `${v.beat?.storyRole.toLowerCase() || `frame_${v.idx + 1}`}.mp4`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    });
  };

  const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Show gate screen if no storyboard data
  if (!fromStoryboard || !sourceUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-120px)] lg:min-h-[calc(100dvh-60px)] text-center px-6">
        <Film className="h-14 w-14 text-muted-foreground/10 mb-6" />
        <h2 className="text-[20px] font-satoshi font-bold text-foreground mb-3">Create a storyboard first</h2>
        <p className="text-[14px] text-muted-foreground/40 max-w-[420px] leading-relaxed mb-6">
          Generate your image storyboard in the Image Studio, then come back to turn frames into video.
        </p>
        <Link
          to="/generate"
          className="rounded-xl bg-primary text-primary-foreground px-6 py-3 text-[14px] font-semibold inline-flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          Go to Image Studio <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-[12px] text-muted-foreground/25 mt-4">
          Storyboard images will flow into the video editor automatically
        </p>
      </div>
    );
  }

  // Status pill helper
  const getStatusPill = (status: FrameStatus) => {
    switch (status) {
      case "completed": return <span className="bg-emerald-500/10 text-emerald-400 rounded-md px-2 py-0.5 text-[10px] font-medium">Done</span>;
      case "failed": return <span className="bg-red-500/10 text-red-400 rounded-md px-2 py-0.5 text-[10px] font-medium">Failed</span>;
      case "generating": return <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px] font-medium flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Generating</span>;
      default: return <span className="bg-white/[0.04] text-muted-foreground/40 rounded-md px-2 py-0.5 text-[10px] font-medium">Idle</span>;
    }
  };

  // Main frame editor
  return (
    <div className="space-y-3 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase text-foreground">Buat Video</h1>
          <p className="text-xs text-muted-foreground/40 mt-0.5">
            {getContentTemplate(selectedTemplate)?.label} • {activeFrames.length} frame • Est. {formatRupiah(totalCost)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-white/[0.06]">
            {(["9:16", "16:9"] as const).map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`text-[10px] px-2.5 py-1 transition-colors ${
                  aspectRatio === ar
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/[0.03] text-muted-foreground hover:text-foreground"
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
          <button
            onClick={planStoryboard}
            disabled={planningStoryboard}
            className="text-[11px] text-primary hover:underline flex items-center gap-1 disabled:opacity-40"
          >
            {planningStoryboard ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Plan ulang
          </button>
        </div>
      </div>

      {/* Product Info Banner */}
      {productInfo.product_description && (
        <div className="rounded-xl px-4 py-2 border border-white/[0.06] bg-white/[0.02] text-[11px] flex items-center gap-2">
          <span>🏷️</span>
          <span className="font-medium text-foreground">{productInfo.product_description}</span>
          <span className="text-muted-foreground/40">({productInfo.category}/{productInfo.sub_category || "general"})</span>
        </div>
      )}

      {/* Model recommendation */}
      <div className={`rounded-xl px-4 py-2.5 border text-[11px] ${
        modelRec.variant === "dialog"
          ? "bg-blue-500/5 border-blue-500/20 text-blue-400"
          : modelRec.variant === "visual"
          ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
          : "bg-green-500/5 border-green-500/20 text-green-400"
      }`}>
        <Lightbulb className="inline h-3.5 w-3.5 mr-1" /> {modelRec.text}
      </div>

      {/* Planning loading */}
      {planningStoryboard && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div>
            <p className="text-xs font-medium text-foreground">Merencanakan storyboard...</p>
            <p className="text-[10px] text-muted-foreground/40">Menganalisis produk & membuat rencana 5 frame</p>
          </div>
        </div>
      )}

      {/* 5 Frame Cards — Accordion Style */}
      <div className="space-y-2">
        {frames.map((frame, idx) => {
          const beat = beats[idx];
          if (!beat) return null;

          // Skeleton during planning
          if (planningStoryboard) {
            return (
              <div key={idx} className="border border-white/[0.06] rounded-xl p-4 space-y-3 animate-pulse bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            );
          }

          // Merged-into indicator
          if (frame.mergedInto !== null) {
            return (
              <div key={idx} className="border border-dashed border-white/[0.06] rounded-xl px-4 py-2 opacity-40 flex items-center gap-2">
                <Link2 className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/40">
                  F{idx + 1} ({beat.label}) — digabungkan ke F{frame.mergedInto + 1}
                </span>
              </div>
            );
          }

          const mergedBeats = frame.mergedFrames.map((mi) => beats[mi]).filter(Boolean);
          const isCombined = mergedBeats.length > 0;
          const allBeatLabels = [beat, ...mergedBeats];
          const canCombineMore = frame.mergedFrames.length + 1 < 3;

          return (
            <div
              key={idx}
              className={`border rounded-xl overflow-hidden transition-all ${
                frame.skipped ? "opacity-40 border-white/[0.04]" :
                frame.status === "completed" ? "border-emerald-500/20 bg-white/[0.02]" :
                isCombined ? "border-primary/20 bg-white/[0.02]" :
                "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              {/* Collapsed Header — ~56px */}
              <div
                className="h-14 px-4 flex items-center justify-between cursor-pointer"
                onClick={() => updateFrame(idx, { expanded: !frame.expanded })}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Thumbnail if completed */}
                  {frame.status === "completed" && frame.videoUrl && (
                    <video
                      src={frame.videoUrl}
                      muted
                      className="h-10 w-8 rounded-md object-cover shrink-0 border border-white/[0.06]"
                    />
                  )}
                  <span className="text-[13px] font-bold text-muted-foreground/30 shrink-0">
                    {isCombined ? `#${idx + 1}+${frame.mergedFrames.map((m) => m + 1).join("+")}` : `#${idx + 1}`}
                  </span>
                  <span className="text-[13px] font-medium text-foreground truncate">
                    {isCombined ? allBeatLabels.map((b) => b.label.split("—")[0].trim()).join(" + ") : beat.label}
                  </span>
                  {allBeatLabels.map((b, bi) => {
                    const actualIdx = bi === 0 ? idx : frame.mergedFrames[bi - 1];
                    return (
                      <span key={bi} className={`text-[9px] px-2 py-0.5 rounded-md font-medium shrink-0 ${getRoleColor(actualIdx)}`}>
                        {b.storyRole}
                      </span>
                    );
                  })}
                  {isCombined && <Link2 className="h-3 w-3 text-primary shrink-0" />}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusPill(frame.status)}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[9px] text-muted-foreground/30">Skip</span>
                    <Switch
                      checked={frame.skipped}
                      onCheckedChange={(v) => updateFrame(idx, { skipped: v })}
                      className="scale-75"
                    />
                  </div>
                  {frame.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground/30" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/30" />}
                </div>
              </div>

              {/* Expanded Content */}
              {frame.expanded && !frame.skipped && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
                  {/* Beat descriptions */}
                  {isCombined ? (
                    <div className="space-y-1">
                      {allBeatLabels.map((b, bi) => (
                        <p key={bi} className="text-[10px] text-muted-foreground/40 italic">
                          <span className="font-medium text-foreground not-italic">{b.storyRole}:</span> {b.description}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/40 italic">{beat.description}</p>
                  )}

                  {/* Split button */}
                  {isCombined && (
                    <button
                      onClick={() => splitFrame(idx)}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Unlink className="h-3 w-3" /> Pisahkan kembali
                    </button>
                  )}

                  {/* Source image */}
                  <div>
                    <label className="text-[10px] text-muted-foreground/30 font-medium block mb-1">Referensi gambar</label>
                    <div className="flex items-center gap-2">
                      {(frame.sourceImageUrl || sourceUrl) ? (
                        <img
                          src={frame.sourceImageUrl || sourceUrl!}
                          alt={`Frame ${idx + 1} ref`}
                          className="h-14 w-14 rounded-lg object-cover border border-white/[0.06]"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg border border-dashed border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            const inp = document.createElement("input");
                            inp.type = "file";
                            inp.accept = "image/jpeg,image/png,image/webp";
                            inp.onchange = async (e) => {
                              const f = (e.target as HTMLInputElement).files?.[0];
                              if (!f) return;
                              const preview = URL.createObjectURL(f);
                              updateFrame(idx, { sourceImageUrl: preview });
                              const ext = f.name.split(".").pop();
                              const path = `${user!.id}/video-sources/${Date.now()}.${ext}`;
                              const { error } = await supabase.storage.from("product-images").upload(path, f);
                              if (!error) {
                                const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
                                updateFrame(idx, { sourceImageUrl: urlData.publicUrl });
                              }
                            };
                            inp.click();
                          }}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1"
                        >
                          <Upload className="h-3 w-3" /> Upload
                        </button>
                        {galleryImages.length > 0 && (
                          <button
                            onClick={() => updateFrame(idx, { showGalleryPicker: !frame.showGalleryPicker })}
                            className="text-[10px] text-primary hover:underline flex items-center gap-1"
                          >
                            <ImageIcon className="h-3 w-3" /> Dari gallery
                          </button>
                        )}
                      </div>
                    </div>
                    {frame.showGalleryPicker && galleryImages.length > 0 && (
                      <div className="mt-2 p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <p className="text-[10px] text-muted-foreground/30 mb-1.5">Pilih dari gallery:</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {galleryImages.slice(0, 12).map((img) => (
                            <button
                              key={img.id}
                              onClick={() => updateFrame(idx, { sourceImageUrl: img.image_url, showGalleryPicker: false })}
                              className="flex-shrink-0 h-14 w-14 rounded-md overflow-hidden border border-white/[0.06] hover:border-primary/30 transition-colors"
                            >
                              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Start + End frame picker for combined Veo frames */}
                    {isCombined && (frame.model === "veo_fast" || frame.model === "veo_quality") && (
                      <>
                      <div className="mt-2 flex items-center gap-3">
                        {/* Start frame — clickable to upload */}
                        <div className="text-center">
                          <p className="text-[9px] text-muted-foreground mb-1">Start</p>
                          <button
                            className="relative group h-20 w-14 rounded-lg overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-colors"
                            onClick={() => {
                              const inp = document.createElement("input");
                              inp.type = "file";
                              inp.accept = "image/jpeg,image/png,image/webp";
                              inp.onchange = async (e) => {
                                const f = (e.target as HTMLInputElement).files?.[0];
                                if (!f) return;
                                const preview = URL.createObjectURL(f);
                                updateFrame(idx, { sourceImageUrl: preview });
                                const ext = f.name.split(".").pop();
                                const path = `${user!.id}/video-sources/${Date.now()}-start.${ext}`;
                                const { error } = await supabase.storage.from("product-images").upload(path, f);
                                if (!error) {
                                  const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
                                  updateFrame(idx, { sourceImageUrl: urlData.publicUrl });
                                }
                              };
                              inp.click();
                            }}
                          >
                            {(frame.sourceImageUrl || storyboardImages[idx]) ? (
                              <img src={frame.sourceImageUrl || storyboardImages[idx]} alt="Start frame" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-white/[0.02] flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-4 w-4 text-white" />
                            </div>
                          </button>
                          <p className="text-[8px] text-muted-foreground mt-0.5">F{idx + 1}</p>
                          {galleryImages.length > 0 && (
                            <button
                              onClick={() => updateFrame(idx, { showStartGallery: !frame.showStartGallery, showEndGallery: false })}
                              className="text-[10px] text-primary hover:underline mt-0.5"
                            >
                              From gallery
                            </button>
                          )}
                        </div>

                        <span className="text-muted-foreground/30 text-lg">→</span>

                        {/* End frame — clickable to upload, with remove button */}
                        <div className="text-center">
                          <p className="text-[9px] text-muted-foreground mb-1">End</p>
                          {frame.endFrameUrl === "__none__" ? (
                            /* Removed state — show empty dashed card */
                            <button
                              className="relative group h-20 w-14 rounded-lg border-2 border-dashed border-white/[0.12] hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-1"
                              onClick={() => {
                                const inp = document.createElement("input");
                                inp.type = "file";
                                inp.accept = "image/jpeg,image/png,image/webp";
                                inp.onchange = async (e) => {
                                  const f = (e.target as HTMLInputElement).files?.[0];
                                  if (!f) return;
                                  const preview = URL.createObjectURL(f);
                                  updateFrame(idx, { endFrameUrl: preview });
                                  const ext = f.name.split(".").pop();
                                  const path = `${user!.id}/video-sources/${Date.now()}-end.${ext}`;
                                  const { error } = await supabase.storage.from("product-images").upload(path, f);
                                  if (!error) {
                                    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
                                    updateFrame(idx, { endFrameUrl: urlData.publicUrl });
                                  }
                                };
                                inp.click();
                              }}
                            >
                              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/30" />
                              <span className="text-[7px] text-muted-foreground/40 leading-tight">Add end<br/>frame</span>
                            </button>
                          ) : (
                            /* Normal state — show image with remove X */
                            <div className="relative">
                              <button
                                className="relative group h-20 w-14 rounded-lg overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-colors"
                                onClick={() => {
                                  const inp = document.createElement("input");
                                  inp.type = "file";
                                  inp.accept = "image/jpeg,image/png,image/webp";
                                  inp.onchange = async (e) => {
                                    const f = (e.target as HTMLInputElement).files?.[0];
                                    if (!f) return;
                                    const preview = URL.createObjectURL(f);
                                    updateFrame(idx, { endFrameUrl: preview });
                                    const ext = f.name.split(".").pop();
                                    const path = `${user!.id}/video-sources/${Date.now()}-end.${ext}`;
                                    const { error } = await supabase.storage.from("product-images").upload(path, f);
                                    if (!error) {
                                      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
                                      updateFrame(idx, { endFrameUrl: urlData.publicUrl });
                                    }
                                  };
                                  inp.click();
                                }}
                              >
                                {(frame.endFrameUrl || storyboardImages[frame.mergedFrames[frame.mergedFrames.length - 1]]) ? (
                                  <img src={frame.endFrameUrl || storyboardImages[frame.mergedFrames[frame.mergedFrames.length - 1]]} alt="End frame" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full bg-white/[0.02] flex items-center justify-center">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground/20" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Upload className="h-4 w-4 text-white" />
                                </div>
                              </button>
                              {/* Remove end frame button */}
                              {(frame.endFrameUrl || storyboardImages[frame.mergedFrames[frame.mergedFrames.length - 1]]) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateFrame(idx, { endFrameUrl: "__none__" }); }}
                                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] z-10"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                          <p className="text-[8px] text-muted-foreground mt-0.5">F{frame.mergedFrames[frame.mergedFrames.length - 1] + 1}</p>
                          {galleryImages.length > 0 && (
                            <button
                              onClick={() => updateFrame(idx, { showEndGallery: !frame.showEndGallery, showStartGallery: false })}
                              className="text-[10px] text-primary hover:underline mt-0.5"
                            >
                              From gallery
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Inline gallery picker for Start */}
                      {frame.showStartGallery && galleryImages.length > 0 && (
                        <div className="mt-2 p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                          <p className="text-[10px] text-muted-foreground/30 mb-1.5">Pilih start frame dari gallery:</p>
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {galleryImages.slice(0, 12).map((img) => (
                              <button
                                key={img.id}
                                onClick={() => updateFrame(idx, { sourceImageUrl: img.image_url, showStartGallery: false })}
                                className="flex-shrink-0 h-14 w-14 rounded-md overflow-hidden border border-white/[0.06] hover:border-primary/30 transition-colors"
                              >
                                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Inline gallery picker for End */}
                      {frame.showEndGallery && galleryImages.length > 0 && (
                        <div className="mt-2 p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                          <p className="text-[10px] text-muted-foreground/30 mb-1.5">Pilih end frame dari gallery:</p>
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {galleryImages.slice(0, 12).map((img) => (
                              <button
                                key={img.id}
                                onClick={() => updateFrame(idx, { endFrameUrl: img.image_url, showEndGallery: false })}
                                className="flex-shrink-0 h-14 w-14 rounded-md overflow-hidden border border-white/[0.06] hover:border-primary/30 transition-colors"
                              >
                                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      </>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground/30 font-medium block mb-1">Gerakan:</label>
                    <Textarea
                      value={frame.action}
                      onChange={(e) => updateFrame(idx, { action: e.target.value })}
                      rows={2}
                      placeholder="Deskripsi gerakan/aksi untuk frame ini..."
                      className="bg-white/[0.02] border-white/[0.06] rounded-xl text-[11px] placeholder:text-muted-foreground/20 mb-2"
                    />
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {frame.actionChips.map((chip, ci) => (
                        <button
                          key={ci}
                          onClick={() => updateFrame(idx, { action: chip })}
                          className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
                            frame.action === chip
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-white/[0.04] border-white/[0.06] text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                      <button
                        onClick={() => updateFrame(idx, { actionChips: getShuffledChips(beat.storyRole, productCategory) })}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-muted-foreground/30 hover:text-foreground transition-colors flex items-center gap-0.5"
                      >
                        <RefreshCw className="h-2.5 w-2.5" /> Acak
                      </button>
                    </div>
                  </div>

                  {/* Dialog */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-muted-foreground/30 font-medium">Dialog</label>
                      <button
                        onClick={() => generateFrameScript(idx)}
                        disabled={frame.scriptGenerating || frame.dialogue === "..."}
                        className="text-[9px] text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {frame.scriptGenerating ? (
                          <><Loader2 className="h-2.5 w-2.5 animate-spin" /> Generating script...</>
                        ) : (
                          <><Sparkles className="h-2.5 w-2.5" /> Generate Script AI</>
                        )}
                      </button>
                    </div>
                    <Textarea
                      value={frame.dialogue}
                      onChange={(e) => {
                        updateFrame(idx, { dialogue: e.target.value });
                        if (e.target.value.trim() && frame.model === "grok") {
                          const dur = MODEL_DURATIONS["veo_fast"]?.[0] || 8;
                          updateFrame(idx, { model: "veo_fast", duration: dur });
                        } else if (!e.target.value.trim() && (frame.model === "veo_fast" || frame.model === "kling_std")) {
                          const dur = MODEL_DURATIONS["grok"]?.[1] || 10;
                          updateFrame(idx, { model: "grok", duration: dur });
                        }
                      }}
                      rows={2}
                      placeholder="Dialog untuk frame ini..."
                      className="bg-white/[0.02] border-white/[0.06] rounded-xl text-[11px] placeholder:text-muted-foreground/20"
                    />
                  </div>

                  {/* Prompt */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-muted-foreground/30 font-medium">Video Prompt</label>
                      <button
                        onClick={() => generateFramePrompt(idx)}
                        disabled={frame.promptGenerating}
                        className="text-[9px] text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {frame.promptGenerating ? (
                          <><Loader2 className="h-2.5 w-2.5 animate-spin" /> Generating prompt...</>
                        ) : (
                          <><Sparkles className="h-2.5 w-2.5" /> Generate Prompt</>
                        )}
                      </button>
                    </div>
                    <Textarea
                      value={frame.prompt}
                      onChange={(e) => updateFrame(idx, { prompt: e.target.value })}
                      rows={3}
                      placeholder="Auto-generate saat Generate Frame, atau tulis manual..."
                      className="bg-white/[0.02] border-white/[0.06] rounded-xl text-[11px] placeholder:text-muted-foreground/20"
                    />
                  </div>

                  {/* Model selector — inline radio pills */}
                  <div>
                    <label className="text-[10px] text-muted-foreground/30 font-medium block mb-1.5">Model</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(MODEL_LABELS) as VideoModel[]).map((m) => {
                        const info = MODEL_LABELS[m];
                        const isSelected = frame.model === m;
                        return (
                          <button
                            key={m}
                            onClick={() => {
                              const dur = MODEL_DURATIONS[m]?.[Math.min(1, MODEL_DURATIONS[m].length - 1)] || 8;
                              updateFrame(idx, { model: m, duration: dur });
                            }}
                            className={`flex-1 min-w-[100px] text-[10px] py-2 rounded-lg border text-center transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border/30 text-muted-foreground/50 hover:border-border"
                            }`}
                          >
                            <span className="font-medium">{info.label}</span>
                            <span className="text-muted-foreground/30 ml-1">{info.cost}</span>
                            {info.audio && <span className="ml-1 text-[8px]">🔊</span>}
                          </button>
                        );
                      })}
                    </div>
                    {/* Duration selector */}
                    {MODEL_DURATIONS[frame.model].length > 1 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9px] text-muted-foreground/40">Duration:</span>
                        {MODEL_DURATIONS[frame.model].map((d) => (
                          <button
                            key={d}
                            onClick={() => updateFrame(idx, { duration: d })}
                            className={`text-[10px] px-2.5 py-1 rounded-md border transition-colors ${
                              frame.duration === d
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border/30 text-muted-foreground/50 hover:border-border"
                            }`}
                          >
                            {d}s
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Prompt-based model suggestion */}
                    {frame.suggestedModel && frame.suggestedModel !== frame.model && (
                      <button
                        onClick={() => {
                          const newModel = frame.suggestedModel!;
                          const dur = MODEL_DURATIONS[newModel]?.[Math.min(1, MODEL_DURATIONS[newModel].length - 1)] || 8;
                          updateFrame(idx, {
                            model: newModel,
                            duration: dur,
                            prompt: "",
                            status: "idle",
                            videoUrl: null,
                            suggestedModel: undefined,
                            suggestedReason: undefined,
                          });
                        }}
                        className="w-full mt-1.5 text-[10px] text-primary/50 hover:text-primary flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-primary/10 hover:border-primary/20 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" /> Switch to {MODEL_LABELS[frame.suggestedModel!].label}? {frame.suggestedReason}
                      </button>
                    )}
                  </div>

                  {/* Generate / Result */}
                  {frame.status === "completed" && frame.videoUrl ? (
                    <div className="space-y-2">
                      <video
                        src={frame.videoUrl}
                        controls
                        playsInline
                        className={`w-full rounded-xl border border-white/[0.06] ${aspectRatio === "9:16" ? "aspect-[9/16] max-w-[200px] mx-auto" : "aspect-[16/9]"} object-cover`}
                      />
                      <div className="flex gap-2">
                        <a
                          href={frame.videoUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-xs py-2 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-1"
                        >
                          <Download className="h-3 w-3" /> Download
                        </a>
                        <button
                          onClick={() => { updateFrame(idx, { status: "idle", videoUrl: null }); generateFrame(idx); }}
                          className="text-xs py-2 px-3 rounded-xl border border-white/[0.06] text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <RefreshCw className="h-3 w-3" /> Retry
                        </button>
                      </div>
                    </div>
                  ) : frame.status === "generating" ? (
                    <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div>
                        <p className="text-xs text-foreground font-medium">Generating Frame {idx + 1}...</p>
                        <p className="text-[10px] text-muted-foreground/40 font-mono">{formatTime(frame.elapsed)}</p>
                      </div>
                    </div>
                  ) : frame.status === "failed" ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        {frame.errorMsg?.includes("SAFETY_BLOCKED") ? (
                          <div className="space-y-1">
                            <p className="text-[10px] text-red-400 font-medium">Blocked by Google safety filter</p>
                            <p className="text-[10px] text-muted-foreground/40">Try editing the prompt to be less specific about body/face, or switch to Kling (no safety filter).</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-red-400">{frame.errorMsg || "Gagal"}</p>
                        )}
                      </div>
                      {anyGenerating ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30 p-2">
                          <Lock className="h-3 w-3" /> Tunggu frame lain selesai...
                        </div>
                      ) : (
                        <button
                          onClick={() => generateFrame(idx)}
                          className="text-xs py-2 px-4 rounded-xl bg-primary text-primary-foreground"
                        >
                          Coba Lagi
                        </button>
                      )}
                    </div>
                  ) : (
                    anyGenerating ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30 p-2 rounded-xl bg-white/[0.02]">
                        <Lock className="h-3 w-3" /> Tunggu frame sebelumnya selesai...
                      </div>
                    ) : (
                      <button
                        onClick={() => generateFrame(idx)}
                        disabled={batchGenerating}
                        className="w-full text-xs py-2.5 rounded-xl border border-primary/30 text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        <Film className="h-3.5 w-3.5" />
                        Generate Frame {idx + 1} ({MODEL_LABELS[frame.model].cost})
                      </button>
                    )
                  )}

                  {/* Combine links */}
                  {!isCombined && idx < frames.length - 1 && frames[idx + 1]?.mergedInto === null && !frames[idx + 1]?.mergedFrames.length && !frame.skipped && frame.status !== "generating" && (
                    <button
                      onClick={() => combineWithNext(idx)}
                      className="text-[10px] text-muted-foreground/30 hover:text-primary flex items-center gap-1 transition-colors mt-1"
                    >
                      <Link2 className="h-3 w-3" /> Gabungkan dengan frame berikutnya ↓
                    </button>
                  )}
                  {isCombined && canCombineMore && (() => {
                    const lastMerged = frame.mergedFrames[frame.mergedFrames.length - 1];
                    const nextAfterMerged = lastMerged + 1;
                    if (nextAfterMerged < frames.length && frames[nextAfterMerged]?.mergedInto === null && !frames[nextAfterMerged]?.mergedFrames.length) {
                      return (
                        <button
                          onClick={() => combineWithNext(idx)}
                          className="text-[10px] text-muted-foreground/30 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                          <Link2 className="h-3 w-3" /> Gabungkan frame berikutnya juga ↓
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview & Combine Section */}
      {allDone && completedVideos.length > 0 && (
        <div className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.02] space-y-4">
          <div>
            <p className="text-sm font-bold text-foreground flex items-center gap-1.5"><Clapperboard className="h-4 w-4" /> Semua Frame Selesai!</p>
            <p className="text-[11px] text-muted-foreground/40">
              Total: {totalDuration}s ({completedVideos.length} × {completedVideos.length > 0 ? (completedVideos[0].model === "grok" ? "10s" : "8s") : "8s"})
            </p>
          </div>

          {/* Sequential player with filmstrip */}
          {playingAll && completedVideos[playIndex] && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground/40 text-center">
                Frame {completedVideos[playIndex].idx + 1} — {completedVideos[playIndex].beat?.label} ({playIndex + 1}/{completedVideos.length})
              </p>
              <video
                ref={playerRef}
                src={completedVideos[playIndex].videoUrl!}
                autoPlay
                playsInline
                onEnded={handleVideoEnded}
                className={`w-full rounded-xl border border-white/[0.06] mx-auto ${aspectRatio === "9:16" ? "aspect-[9/16] max-w-[220px]" : "aspect-[16/9]"} object-cover`}
              />
              {/* Filmstrip thumbnails */}
              <div className="flex gap-1.5 justify-center">
                {completedVideos.map((v, vi) => (
                  <button
                    key={vi}
                    onClick={() => setPlayIndex(vi)}
                    className={`h-12 w-9 rounded-md overflow-hidden border-2 transition-all ${
                      vi === playIndex ? "ring-2 ring-primary border-primary" : "border-white/[0.06] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <video src={v.videoUrl!} muted className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handlePlayAll}
              className="flex-1 min-w-[140px] text-xs py-2.5 rounded-xl border border-primary/30 text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5" /> Preview Full Video
            </button>
            <button
              onClick={downloadAll}
              className="flex-1 min-w-[140px] text-xs py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-3.5 w-3.5" /> Download Semua
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/20 text-center">
            Edit dan gabungkan clip di CapCut atau InShot untuk hasil terbaik
          </p>
        </div>
      )}

      {/* Sticky Bottom Bar — Batch Controls */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[232px] bg-background/80 backdrop-blur-xl border-t border-white/[0.04] px-6 py-3 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-muted-foreground/40">
              {completedFrames.length}/{activeFrames.length} frames
            </span>
            <span className="bg-white/[0.04] text-muted-foreground/50 rounded-md px-2 py-0.5 text-[10px] font-medium">
              Est. {formatRupiah(totalCost)}
            </span>
            {batchGenerating && batchCurrentFrame >= 0 && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                F{batchCurrentFrame + 1} — {formatTime(frames[batchCurrentFrame]?.elapsed || 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {batchGenerating && (
              <button onClick={cancelBatch} className="text-[11px] text-red-400 hover:underline px-3 py-1.5">Cancel</button>
            )}
            <button
              onClick={generateAll}
              disabled={batchGenerating || !kieApiKey || activeFrames.length === 0}
              className="bg-primary text-primary-foreground font-bold text-[12px] px-5 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-40 hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.3)] hover:-translate-y-0.5"
            >
              {batchGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />}
              {batchGenerating ? "Generating..." : "Generate all frames"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
