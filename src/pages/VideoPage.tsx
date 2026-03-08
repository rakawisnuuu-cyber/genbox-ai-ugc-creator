import { useState, useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, useNavigate } from "react-router-dom";
import { geminiFetch } from "@/lib/gemini-fetch";
import { buildVideoDirectorInstruction } from "@/lib/frame-lock-prompt";
import { getActionChips, getShuffledChips } from "@/lib/action-chips";
import { generateVideoAndWait } from "@/lib/kie-video-generation";
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

const ROLE_COLORS: Record<string, string> = {
  Hook: "bg-red-500/20 text-red-400 border-red-500/30",
  Build: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Demo: "bg-green-500/20 text-green-400 border-green-500/30",
  Proof: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Convert: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function BeatPreviewCard({ beat, index }: { beat: StoryboardBeat; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = beat.description.length > 50 || beat.label.length > 20;
  return (
    <div
      className={`border border-border rounded-lg p-2 bg-muted/10 min-w-0 cursor-pointer transition-all ${expanded ? "col-span-5 sm:col-span-2" : ""}`}
      onClick={() => isLong && setExpanded(!expanded)}
    >
      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${getStoryRoleColor(beat.storyRole)}`}>
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

/** Smart dialog suggestions per frame role and product category */
const DEMO_DIALOGS: Record<string, string> = {
  skincare: "Aku coba pake langsung ya di kulit aku...",
  fashion: "Aku coba pakai nih, liat deh hasilnya...",
  food: "Kita cobain rasanya langsung ya...",
  electronics: "Aku nyalain dulu nih, kita liat fiturnya...",
  health: "Aku minum langsung ya, biasa tiap pagi...",
  home: "Aku coba pasang langsung ya...",
  other: "Aku coba langsung ya biar kalian liat...",
};

const PROOF_DIALOGS = [
  "Hasilnya ternyata beneran kerasa bedanya...",
  "Wah beneran kerasa bedanya sih ini...",
  "Oke aku kaget sih, hasilnya sebagus ini...",
  "Ini beneran di luar ekspektasi aku...",
];

const CTA_DIALOGS = [
  "Worth it sih, kalian coba deh!",
  "Link di bio ya! Cobain deh.",
  "Aku recommend banget sih ini. Cek link di bio!",
  "Kalian harus coba ini sih, worth it banget.",
];

function getSmartDialogSuggestion(
  role: string,
  templateKey: ContentTemplateKey,
  productCategory?: string,
): string {
  switch (role) {
    case "Hook": {
      const hooks = getRandomHooks(templateKey, 1);
      return hooks[0] || "";
    }
    case "Build": {
      const bodies = getRandomBodyScripts(templateKey, 1);
      return bodies[0] || "";
    }
    case "Demo": {
      const cat = (productCategory || "other").toLowerCase();
      return DEMO_DIALOGS[cat] || DEMO_DIALOGS.other;
    }
    case "Proof": {
      return PROOF_DIALOGS[Math.floor(Math.random() * PROOF_DIALOGS.length)];
    }
    case "Convert": {
      return CTA_DIALOGS[Math.floor(Math.random() * CTA_DIALOGS.length)];
    }
    default:
      return "";
  }
}

/** Convert image URL to base64 for Gemini */
async function imageUrlToBase64(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || "image/jpeg";
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64 ? { mimeType, data: base64 } : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const VideoPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { kieApiKey, geminiKey, keys } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { toast } = useToast();

  // Navigation state from storyboard
  const navState = location.state as any;
  const fromStoryboard = navState?.fromStoryboard === true;

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

  // Batch generation
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchCurrentFrame, setBatchCurrentFrame] = useState(-1);
  const batchCancelRef = useRef(false);

  // Per-frame timers
  const frameTimersRef = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  const beats = getStoryboardBeats(selectedTemplate);
  const storyboardImages: string[] = navState?.storyboardImages || [];
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

    // Convert File to base64 immediately (CORS-free)
    const b64 = await new Promise<{ mimeType: string; data: string } | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const mimeType = result.split(",")[0].split(":")[1].split(";")[0];
        const data = result.split(",")[1];
        resolve(data ? { mimeType, data } : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
    if (b64) setImageAsBase64(b64);

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
    });

    const contentParts: any[] = [];
    // Use stored base64 (CORS-free) for visual reference, fall back to URL fetch
    if (imageAsBase64) {
      contentParts.push({ inlineData: { mimeType: imageAsBase64.mimeType, data: imageAsBase64.data } });
      contentParts.push({ text: "This is the reference image. Match the person, outfit, environment, and lighting EXACTLY." });
    } else {
      const imgUrl = frame.sourceImageUrl || sourceUrl;
      if (imgUrl) {
        const b64 = await imageUrlToBase64(imgUrl);
        if (b64) {
          contentParts.push({ inlineData: { mimeType: b64.mimeType, data: b64.data } });
          contentParts.push({ text: "This is the reference image. Match the person, outfit, environment, and lighting EXACTLY." });
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
        updateFrame(idx, { prompt: text });
        return text;
      }
    } catch (e: any) {
      console.error("Prompt gen failed:", e);
    }
    return frame.prompt;
  };

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

      const result = await generateVideoAndWait(
        {
          model: frame.model,
          prompt: usedPrompt,
          imageUrls: [imgUrl],
          duration,
          aspectRatio,
          apiKey: kieApiKey,
        },
        () => false,
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

  // Show setup if not done
  if (!setupDone) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase text-foreground">Buat Video</h1>
          <p className="text-xs text-muted-foreground mt-1">Generate video UGC frame-by-frame dari storyboard</p>
        </div>

        {/* Source Image */}
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Source Image</label>
          {sourcePreview ? (
            <div className="relative inline-block">
              <img src={sourcePreview} alt="Source" className="max-w-[180px] rounded-xl object-cover border border-border" />
              <button onClick={() => { setSourcePreview(null); setSourceUrl(null); }} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file";
                  inp.accept = "image/jpeg,image/png,image/webp";
                  inp.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleFileSelect(f);
                  };
                  inp.click();
                }}
                className="border-2 border-dashed border-border rounded-xl p-6 bg-background hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload gambar</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Detection Banner */}
        {(productInfo.product_description || detectingProduct) && (
          <div className={`rounded-xl px-4 py-2.5 border text-[11px] flex items-center gap-2 ${
            detectingProduct
              ? "bg-muted/30 border-border text-muted-foreground"
              : "bg-primary/5 border-primary/20 text-foreground"
          }`}>
            {detectingProduct ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>Mendeteksi produk...</span>
              </>
            ) : (
              <>
                <span>🏷️</span>
                <span>
                  <span className="font-medium">Produk:</span> {productInfo.product_description}
                  {productInfo.category && (
                    <span className="text-muted-foreground"> ({productInfo.category}/{productInfo.sub_category || "general"})</span>
                  )}
                </span>
              </>
            )}
          </div>
        )}

        {/* Template Selector */}
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Template Konten</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CONTENT_TEMPLATES.map((t) => {
              const isSelected = selectedTemplate === t.key;
              const isRecommended = productInfo.category ? isRecommendedForCategory(t, productInfo.category) : false;
              return (
                <button
                  key={t.key}
                  onClick={() => setSelectedTemplate(t.key)}
                  className={`text-left rounded-xl p-3 transition-all relative ${
                    isSelected
                      ? "border-2 border-primary bg-primary/5 ring-1 ring-primary/20"
                      : isRecommended
                        ? "border border-primary/40 bg-primary/5 hover:border-primary/60"
                        : "border border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {isRecommended && !isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 text-[7px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                      ✦ REC
                    </span>
                  )}
                  <p className="text-[11px] font-bold text-foreground">{t.label}</p>
                  <p className={`text-[9px] text-muted-foreground mt-0.5 ${isSelected ? "" : "line-clamp-2"}`}>{t.desc}</p>
                  {!isSelected && t.desc.length > 60 && (
                    <span className="text-[8px] text-primary mt-0.5 inline-block">Selengkapnya</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Beat preview */}
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Storyboard Preview</label>
          <div className="grid grid-cols-5 gap-2">
            {beats.map((beat, i) => (
              <BeatPreviewCard key={i} beat={beat} index={i} />
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2">Aspect Ratio</label>
          <div className="flex gap-2">
            {(["9:16", "16:9"] as const).map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`text-xs px-4 py-2 rounded-lg transition-colors ${
                  aspectRatio === ar
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {ar === "9:16" ? "9:16 Portrait" : "16:9 Landscape"}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button — Plan Storyboard */}
        <button
          onClick={planStoryboard}
          disabled={!sourceUrl || planningStoryboard}
          className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {planningStoryboard ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {planningStoryboard ? "MERENCANAKAN STORYBOARD..." : "PLAN STORYBOARD"}
        </button>
        <p className="text-[10px] text-muted-foreground text-center -mt-3">
          Satu panggilan AI untuk mendeteksi produk & merencanakan semua 5 frame sekaligus
        </p>
      </div>
    );
  }

  // Main frame editor
  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase text-foreground">Buat Video</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getContentTemplate(selectedTemplate)?.label} • {activeFrames.length} frame • Est. {formatRupiah(totalCost)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSetupDone(false); setFrames([]); setStoryboardPlanned(false); }}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Kembali
          </button>
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

      {/* Product Info Banner (compact) */}
      {productInfo.product_description && (
        <div className="rounded-xl px-4 py-2 border border-primary/20 bg-primary/5 text-[11px] flex items-center gap-2">
          <span>🏷️</span>
          <span className="font-medium text-foreground">{productInfo.product_description}</span>
          <span className="text-muted-foreground">({productInfo.category}/{productInfo.sub_category || "general"})</span>
        </div>
      )}

      <div className={`rounded-xl px-4 py-3 border text-[11px] ${
        modelRec.variant === "dialog"
          ? "bg-blue-500/5 border-blue-500/20 text-blue-400"
          : modelRec.variant === "visual"
          ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
          : "bg-green-500/5 border-green-500/20 text-green-400"
      }`}>
        <Lightbulb className="inline h-3.5 w-3.5 mr-1" /> {modelRec.text}
      </div>

      {/* Dialog Tip */}
      <div className="rounded-xl px-4 py-2.5 border border-border bg-muted/20">
        <p className="text-[10px] text-muted-foreground">
          <MessageSquare className="inline h-3 w-3 mr-1" /> <span className="font-medium text-foreground">Tip:</span> Tulis dialog per frame, atau gabungkan cerita di satu frame dan skip frame lainnya. Setiap frame = 8 detik.
        </p>
      </div>

      {/* Planning loading state */}
      {planningStoryboard && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div>
            <p className="text-xs font-medium text-foreground">Merencanakan storyboard...</p>
            <p className="text-[10px] text-muted-foreground">Menganalisis produk & membuat rencana 5 frame</p>
          </div>
        </div>
      )}

      {/* 5 Frame Cards */}
      {frames.map((frame, idx) => {
        const beat = beats[idx];
        if (!beat) return null;

        // Show skeleton during planning
        if (planningStoryboard) {
          return (
            <div key={idx} className="border border-border rounded-xl p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          );
        }

        // If this frame is merged into another, show collapsed indicator
        if (frame.mergedInto !== null) {
          return (
            <div key={idx} className="border border-dashed border-border rounded-xl px-4 py-2 opacity-40 flex items-center gap-2">
              <Link2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                F{idx + 1} ({beat.label}) — digabungkan ke F{frame.mergedInto + 1}
              </span>
            </div>
          );
        }

        const roleColor = ROLE_COLORS[beat.storyRole] || "bg-muted text-muted-foreground";
        const modelInfo = MODEL_LABELS[frame.model];
        const mergedBeats = frame.mergedFrames.map((mi) => beats[mi]).filter(Boolean);
        const isCombined = mergedBeats.length > 0;
        const allBeatLabels = [beat, ...mergedBeats];
        const canCombineMore = frame.mergedFrames.length + 1 < 3; // max 3

        return (
          <div
            key={idx}
            className={`border rounded-xl overflow-hidden transition-all ${
              frame.skipped ? "opacity-40 border-border" : frame.status === "completed" ? "border-green-500/30 bg-green-500/5" : isCombined ? "border-primary/30 bg-primary/5" : "border-border bg-card"
            }`}
          >
            {/* Frame Header */}
            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer"
              onClick={() => updateFrame(idx, { expanded: !frame.expanded })}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-bold text-foreground shrink-0">
                  {isCombined ? `F${idx + 1}+${frame.mergedFrames.map((m) => m + 1).join("+")}` : `F${idx + 1}`}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {isCombined ? allBeatLabels.map((b) => b.label.split("—")[0].trim()).join(" + ") : beat.label}
                </span>
                {allBeatLabels.map((b, bi) => (
                  <span key={bi} className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${ROLE_COLORS[b.storyRole] || roleColor}`}>
                    {b.storyRole}
                  </span>
                ))}
                {frame.status === "completed" && <span className="text-[9px] text-green-400 font-medium shrink-0">✓</span>}
                {frame.status === "generating" && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
                {frame.status === "failed" && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                {isCombined && <Link2 className="h-3 w-3 text-primary shrink-0" />}
              </div>
              <div className="flex items-center gap-2">
                {/* Skip toggle */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[9px] text-muted-foreground">Skip</span>
                  <Switch
                    checked={frame.skipped}
                    onCheckedChange={(v) => updateFrame(idx, { skipped: v })}
                    className="scale-75"
                  />
                </div>
                {frame.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            {/* Expanded content */}
            {frame.expanded && !frame.skipped && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                {/* Beat description(s) */}
                {isCombined ? (
                  <div className="space-y-1">
                    {allBeatLabels.map((b, bi) => (
                      <p key={bi} className="text-[10px] text-muted-foreground italic">
                        <span className="font-medium text-foreground not-italic">{b.storyRole}:</span> {b.description}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">{beat.description}</p>
                )}

                {/* Split button for combined frames */}
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
                  <label className="text-[10px] text-muted-foreground font-medium block mb-1">Referensi gambar</label>
                  <div className="flex items-center gap-2">
                    {(frame.sourceImageUrl || sourceUrl) ? (
                      <img
                        src={frame.sourceImageUrl || sourceUrl!}
                        alt={`Frame ${idx + 1} ref`}
                        className="h-16 w-16 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
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
                  {/* Inline gallery picker */}
                  {frame.showGalleryPicker && galleryImages.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg border border-border bg-muted/20">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Pilih dari gallery:</p>
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {galleryImages.slice(0, 12).map((img) => (
                          <button
                            key={img.id}
                            onClick={() => {
                              updateFrame(idx, { sourceImageUrl: img.image_url, showGalleryPicker: false });
                            }}
                            className="flex-shrink-0 h-14 w-14 rounded-md overflow-hidden border border-border hover:border-primary/50 transition-colors"
                          >
                            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Gerakan / Action */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-1">Gerakan:</label>
                  <Textarea
                    value={frame.action}
                    onChange={(e) => updateFrame(idx, { action: e.target.value })}
                    rows={2}
                    placeholder="Deskripsi gerakan/aksi untuk frame ini..."
                    className="bg-muted/30 border-border text-[11px] mb-2"
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {frame.actionChips.map((chip, ci) => (
                      <button
                        key={ci}
                        onClick={() => updateFrame(idx, { action: chip })}
                        className="text-[9px] px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                    <button
                      onClick={() => updateFrame(idx, { actionChips: getShuffledChips(beat.storyRole, productCategory) })}
                      className="text-[9px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors flex items-center gap-0.5"
                    >
                      <RefreshCw className="h-2.5 w-2.5" /> Acak
                    </button>
                  </div>
                </div>

                {/* Dialog */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Dialog</label>
                    <button
                      onClick={() => generateFrameScript(idx)}
                      disabled={frame.dialogue === "..."}
                      className="text-[9px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="h-2.5 w-2.5" /> Generate Script AI
                    </button>
                  </div>
                  <Textarea
                    value={frame.dialogue}
                    onChange={(e) => {
                      updateFrame(idx, { dialogue: e.target.value });
                      // Auto-switch model based on dialog
                      if (e.target.value.trim() && frame.model === "grok") {
                        updateFrame(idx, { model: "veo_fast" });
                      } else if (!e.target.value.trim() && frame.model === "veo_fast") {
                        updateFrame(idx, { model: "grok" });
                      }
                    }}
                    rows={2}
                    placeholder="Dialog untuk frame ini..."
                    className="bg-muted/30 border-border text-[11px]"
                  />
                </div>

                {/* Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Video Prompt</label>
                    <button
                      onClick={() => generateFramePrompt(idx)}
                      className="text-[9px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="h-2.5 w-2.5" /> Generate Prompt
                    </button>
                  </div>
                  <Textarea
                    value={frame.prompt}
                    onChange={(e) => updateFrame(idx, { prompt: e.target.value })}
                    rows={3}
                    placeholder="Auto-generate saat Generate Frame, atau tulis manual..."
                    className="bg-muted/30 border-border text-[11px]"
                  />
                </div>

                {/* Model selector */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-1.5">Model</label>
                  <div className="flex gap-2">
                    {(["grok", "veo_fast", "veo_quality"] as VideoModel[]).map((m) => {
                      const mi = MODEL_LABELS[m];
                      const selected = frame.model === m;
                      return (
                        <button
                          key={m}
                          onClick={() => updateFrame(idx, { model: m })}
                          className={`flex-1 text-left rounded-lg p-2 transition-all text-[10px] ${
                            selected
                              ? "border-2 border-primary bg-primary/5"
                              : "border border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${mi.badgeColor}`}>
                            {mi.badge}
                          </span>
                          <p className="font-semibold text-foreground mt-1">{mi.label}</p>
                          <p className="text-muted-foreground/60">
                            {mi.audio ? "🔊 Audio + Lip Sync" : "🔇 No audio"} • {mi.cost}
                          </p>
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
                      className={`w-full rounded-lg border border-border ${aspectRatio === "9:16" ? "aspect-[9/16] max-w-[200px] mx-auto" : "aspect-[16/9]"} object-cover`}
                    />
                    <div className="flex gap-2">
                      <a
                        href={frame.videoUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs py-2 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-1"
                      >
                        <Download className="h-3 w-3" /> Download
                      </a>
                      <button
                        onClick={() => { updateFrame(idx, { status: "idle", videoUrl: null }); generateFrame(idx); }}
                        className="text-xs py-2 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    </div>
                  </div>
                ) : frame.status === "generating" ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div>
                      <p className="text-xs text-foreground font-medium">Generating Frame {idx + 1}...</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{formatTime(frame.elapsed)}</p>
                    </div>
                  </div>
                ) : frame.status === "failed" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-[10px] text-destructive">{frame.errorMsg || "Gagal"}</p>
                    </div>
                    {anyGenerating ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground p-2">
                        <Lock className="h-3 w-3" /> Tunggu frame lain selesai...
                      </div>
                    ) : (
                      <button
                        onClick={() => generateFrame(idx)}
                        className="text-xs py-2 px-4 rounded-lg bg-primary text-primary-foreground"
                      >
                        Coba Lagi
                      </button>
                    )}
                  </div>
                ) : (
                  anyGenerating ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/20">
                      <Lock className="h-3 w-3" /> Tunggu frame sebelumnya selesai...
                    </div>
                  ) : (
                    <button
                      onClick={() => generateFrame(idx)}
                      disabled={batchGenerating}
                      className="w-full text-xs py-2.5 rounded-lg border border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <Film className="h-3.5 w-3.5" />
                      Generate Frame {idx + 1} ({MODEL_LABELS[frame.model].cost})
                    </button>
                  )
                )}

                {/* Combine with next frame link */}
                {!isCombined && idx < frames.length - 1 && frames[idx + 1]?.mergedInto === null && !frames[idx + 1]?.mergedFrames.length && !frame.skipped && frame.status !== "generating" && (
                  <button
                    onClick={() => combineWithNext(idx)}
                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors mt-1"
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
                        className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
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

      {/* Batch Generate */}
      <div className="border border-border rounded-xl p-4 bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-foreground">Generate Semua Frame</p>
            <p className="text-[10px] text-muted-foreground">
              {activeFrames.length} frame aktif • Total est. {formatRupiah(totalCost)}
            </p>
          </div>
          {batchGenerating && (
            <button onClick={cancelBatch} className="text-[10px] text-destructive hover:underline">Cancel</button>
          )}
        </div>

        {batchGenerating && batchCurrentFrame >= 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">
              Generating Frame {batchCurrentFrame + 1}/{activeFrames.length} — {beats[batchCurrentFrame]?.storyRole}... ({formatTime(frames[batchCurrentFrame]?.elapsed || 0)})
            </p>
            <Progress value={(completedFrames.length / activeFrames.length) * 100} className="h-1.5" />
          </div>
        )}

        {!batchGenerating && completedFrames.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {completedFrames.length}/{frames.length} selesai ✓
            {skippedCount > 0 ? ` · ${skippedCount} di-skip` : ""}
            {failedCount > 0 ? ` · ${failedCount} gagal` : ""}
            {` · ${formatRupiah(actualCost)} total`}
          </p>
        )}

        <button
          onClick={generateAll}
          disabled={batchGenerating || !kieApiKey || activeFrames.length === 0}
          className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {batchGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Film className="h-4 w-4" />
          )}
          GENERATE SEMUA FRAME
        </button>
      </div>

      {/* Preview & Combine Section */}
      {allDone && completedVideos.length > 0 && (
        <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 space-y-4">
          <div>
            <p className="text-sm font-bold text-foreground flex items-center gap-1.5"><Clapperboard className="h-4 w-4" /> Semua Frame Selesai!</p>
            <p className="text-[11px] text-muted-foreground">
              Total: {totalDuration}s ({completedVideos.length} × {completedVideos.length > 0 ? (completedVideos[0].model === "grok" ? "10s" : "8s") : "8s"})
            </p>
          </div>

          {/* Sequential player */}
          {playingAll && completedVideos[playIndex] && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground text-center">
                Playing: Frame {completedVideos[playIndex].idx + 1} — {completedVideos[playIndex].beat?.label} ({playIndex + 1}/{completedVideos.length})
              </p>
              <video
                ref={playerRef}
                src={completedVideos[playIndex].videoUrl!}
                autoPlay
                playsInline
                onEnded={handleVideoEnded}
                className={`w-full rounded-lg border border-border mx-auto ${aspectRatio === "9:16" ? "aspect-[9/16] max-w-[220px]" : "aspect-[16/9]"} object-cover`}
              />
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handlePlayAll}
              className="flex-1 min-w-[140px] text-xs py-2.5 rounded-lg border border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5" /> Preview Full Video
            </button>
            <button
              onClick={downloadAll}
              className="flex-1 min-w-[140px] text-xs py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-3.5 w-3.5" /> Download Semua
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Edit dan gabungkan clip di CapCut atau InShot untuk hasil terbaik. Trim bagian yang tidak diperlukan.
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoPage;
