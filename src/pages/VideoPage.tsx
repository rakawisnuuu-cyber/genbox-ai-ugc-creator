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

type VideoModel = "grok" | "veo_fast" | "veo_quality";
type FrameStatus = "idle" | "generating" | "completed" | "failed";

interface FrameState {
  sourceImageUrl: string | null;
  dialogue: string;
  action: string;
  actionChips: string[];
  prompt: string;
  model: VideoModel;
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
  showGalleryPicker?: boolean;
  scriptGenerating?: boolean;
  promptGenerating?: boolean;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

const MODEL_COSTS: Record<VideoModel, number> = {
  grok: 1600,
  veo_fast: 6400,
  veo_quality: 32000,
};

const MODEL_LABELS: Record<VideoModel, { label: string; badge: string; badgeColor: string; audio: boolean; cost: string }> = {
  grok: { label: "Grok", badge: "HEMAT", badgeColor: "bg-green-500/20 text-green-400", audio: false, cost: "~Rp 1.600" },
  veo_fast: { label: "Veo Fast", badge: "STANDARD", badgeColor: "bg-blue-500/20 text-blue-400", audio: true, cost: "~Rp 6.400" },
  veo_quality: { label: "Veo Quality", badge: "PREMIUM", badgeColor: "bg-primary/20 text-primary", audio: true, cost: "~Rp 32.000" },
};

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
  "Problem": () => "Guys, kalian pernah ngalamin ini nggak sih...",
  "Hook": (cat) => { const hooks = getRandomHooks("problem_solution" as ContentTemplateKey, 1); return hooks[0] || "Eh guys, ini sih harus cobain..."; },
  "Skeptical": () => "Hmm, beneran nih ini bagus? Aku agak ragu sih...",
  "Morning": () => "Pagi-pagi gini langsung skincare-an dulu dong...",
  "First Look": () => "Baru pertama kali nih liat produk ini...",
  "Excitement": () => "GUYS! Akhirnya dateng juga nih!",
  "Anticipation": () => "Aku udah penasaran banget sama ini...",
  "Setup": () => "Oke jadi aku mau tunjukin cara pakainya ya...",
  "POV Reach": () => "",
  "Texture": () => "",

  // Mid roles
  "Pain Amplification": () => "Udah capek banget sih ngerasain kayak gini terus...",
  "Personal": () => "Jadi aku udah pake ini sekitar seminggu...",
  "Routine Start": () => "Langsung ambil produknya, udah jadi daily routine...",
  "Expectation": () => "Di packaging-nya sih bilang bisa gini gitu ya...",
  "Alasan 1": () => "Alasan pertama, ini tuh...",
  "Midday": () => "Siang-siang gini tetep fresh karena...",
  "First Open": () => "Wah, packaging-nya ternyata...",
  "Reveal": () => "Ini nih isinya, cakep banget...",
  "Step 1": () => "Pertama, kalian ambil secukupnya...",

  // Demo / Usage roles  
  "Demo": (cat) => {
    const demos: Record<string, string> = {
      skincare: "Aku coba pake langsung ya di kulit aku...",
      fashion: "Aku coba pakai nih, liat deh hasilnya...",
      food: "Kita cobain rasanya langsung ya...",
      electronics: "Aku nyalain dulu nih, kita liat fiturnya...",
      health: "Aku minum langsung ya, biasa tiap pagi...",
      home: "Aku coba pasang langsung ya...",
    };
    return demos[(cat || "").toLowerCase()] || "Aku coba langsung ya biar kalian liat...";
  },
  "Usage": (cat) => ROLE_DIALOG_MAP["Demo"]?.(cat) || "Aku pake langsung nih...",
  "Product Step": () => "Nah ini step paling penting nih...",
  "Application": () => "Apply-nya gampang banget, tinggal...",
  "Try": () => "Oke aku cobain langsung ya...",
  "First Try": () => "Pertama kali pake nih, deg-degan...",
  "Product Moment": () => "Nah di siang hari gini aku selalu pake ini...",
  "Alasan 2": () => "Alasan kedua yang bikin aku suka...",
  "Step 2": () => "Terus step kedua, kalian tinggal...",
  "Speed Demo": () => "Cepet banget nih cara makenya...",
  "Sensory": () => "",
  "Slow Reveal": () => "",
  "POV Inspect": () => "",
  "POV Use": () => "",
  "Discovery": () => "Wah, ini ternyata...",

  // Result / Proof roles
  "Result": () => "Hasilnya ternyata beneran kerasa bedanya...",
  "After Reveal": () => "Wah beneran kerasa bedanya sih ini...",
  "Reality": () => "Wait, ini beneran bagus dong?!",
  "Alasan 3": () => "Dan alasan ketiga yang paling bikin yakin...",
  "Almost Ready": () => "Tinggal finishing touch aja...",
  "Benefit": () => "Kerasa banget sih benefitnya...",
  "Assessment": () => "Hmm, overall menurutku sih...",
  "Impressed": () => "Oke aku kaget sih, hasilnya sebagus ini...",
  "Initial Result": () => "Baru pertama pake udah kerasa bedanya...",
  "POV Result": () => "",
  "Serene": () => "",

  // CTA / Close roles
  "CTA": () => ["Worth it sih, kalian coba deh!", "Link di bio ya! Cobain deh.", "Aku recommend banget sih ini."][Math.floor(Math.random() * 3)],
  "Soft CTA": () => ["Kalian harus coba ini sih.", "Recommended banget deh!", "Cek link di bio ya!"][Math.floor(Math.random() * 3)],
  "Confidence": () => "Pede banget jadinya, coba deh!",
  "Ready": () => "Siap jalan! Makasih produk ini sih...",
  "Converted": () => "Oke aku tarik kata-kata aku, ini bagus banget!",
  "Summary": () => "Jadi kesimpulannya, ini worth it banget!",
  "Verdict": () => "Honest opinion aku sih, ini recommended!",
  "Evening": () => "Malam-malam gini masih kerasa efeknya...",
  "Wrap Up": () => "Gampang kan? Kalian coba deh!",
  "Show Off": () => "Ini sih harus punya, serius!",
  "Face Reveal": () => "Tadaaa! Hasilnya kayak gini...",
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
      const defaultModel: VideoModel = hasDialogue ? "veo_fast" : "grok";

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
        skipped: false,
        status: "idle" as FrameStatus,
        videoUrl: null,
        errorMsg: "",
        elapsed: 0,
        expanded: i === 0,
        mergedFrames: [],
        mergedInto: null,
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
            return {
              ...frame,
              action: planned.action || frame.action,
              dialogue: planned.dialog || frame.dialogue,
              prompt: planned.prompt || frame.prompt,
              model: hasDialog ? "veo_fast" as VideoModel : "grok" as VideoModel,
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
        const beatDescList = allBeats.map((b) => `'${b.label}' — ${b.description}`).join(", then naturally flowing into ");
        systemText = `You are a TikTok content script writer specializing in Indonesian casual/gaul language.
${productContextLine}
Write a 2-3 sentence TikTok dialog covering ${allBeats.length} story beats in sequence: first ${beatDescList}.
The dialog should transition smoothly between all beats in one natural spoken flow.
Keep it under 30 words total, casual Indonesian.
Output ONLY the script text.`;
        contentText = `Combined beats for a '${template?.label}' video:\n${allBeats.map((b, i) => `Beat ${i + 1}: ${b.storyRole} — ${b.description}`).join("\n")}`;
      } else {
        systemText = `You are a TikTok content script writer specializing in Indonesian casual/gaul language.
${productContextLine}
Write a 1-2 sentence TikTok dialog in casual Indonesian for the '${beat.label}' part of a '${template?.label}' video.
Previous frame's dialog was: '${prevDialog}'.
This should flow naturally as the next thing the person would say.
Keep it under 20 words, punchy and natural.
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
      duration: frame.model === "grok" ? 10 : 8,
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
      const duration = frame.model === "grok" ? 10 : 8;

      // Build image URLs — use dual input for combined Veo frames (start + end frame)
      const isVeo = frame.model === "veo_fast" || frame.model === "veo_quality";
      const isCombined = frame.mergedFrames.length > 0;

      let videoImageUrls: string[];
      if (isVeo && isCombined && storyboardImages.length > 0) {
        // Combined frames: use first and last beat's storyboard images as start + end frame
        const startImg = frame.sourceImageUrl || storyboardImages[idx] || imgUrl;
        const lastMergedIdx = frame.mergedFrames[frame.mergedFrames.length - 1];
        const endImg = storyboardImages[lastMergedIdx] || startImg;
        videoImageUrls = startImg !== endImg ? [startImg, endImg] : [startImg];
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
        model: frame.model === "grok" ? "grok-imagine" : frame.model === "veo_fast" ? "veo3_fast" : "veo3",
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
    return s + (f.model === "grok" ? 10 : 8);
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
                  </div>

                  {/* Action / Gerakan */}
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
                          updateFrame(idx, { model: "veo_fast" });
                        } else if (!e.target.value.trim() && frame.model === "veo_fast") {
                          updateFrame(idx, { model: "grok" });
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
                    <div className="flex gap-2">
                      {(["grok", "veo_fast", "veo_quality"] as VideoModel[]).map((m) => {
                        const mi = MODEL_LABELS[m];
                        const selected = frame.model === m;
                        return (
                          <button
                            key={m}
                            onClick={() => updateFrame(idx, { model: m })}
                            className={`flex-1 rounded-lg px-3 py-2 text-[11px] transition-all text-center ${
                              selected
                                ? "border border-primary/20 bg-primary/[0.04] text-primary font-semibold"
                                : "border border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span className="font-medium">{mi.label}</span>
                            <span className="text-[9px] opacity-60 ml-1">{mi.cost}</span>
                          </button>
                        );
                      })}
                    </div>
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
                      <div className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        <p className="text-[10px] text-red-400">{frame.errorMsg || "Gagal"}</p>
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
