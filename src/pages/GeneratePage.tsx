import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { geminiFetch } from "@/lib/gemini-fetch";
import {
  detectProductDNA,
  getCategoryPromptInstruction,
  getAnglesByCategory,
  buildProductConsistencyBlock,
  ALL_CATEGORIES,
  EMPTY_DNA,
  type ProductDNA,
  type ProductCategory,
} from "@/lib/product-dna";
import {
  getEnvironments,
  getPoses,
  getMoods,
  findOption,
  type RichOption,
} from "@/lib/category-options";
import {
  Upload,
  X,
  Sparkles,
  Paintbrush,
  Image as ImageIcon,
  AlertTriangle,
  Download,
  RefreshCw,
  UserCircle,
  Loader2,
  Link as LinkIcon,
  Grid3X3,
  ScanSearch,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useUpscale } from "@/hooks/useUpscale";
import { useToast } from "@/hooks/use-toast";
import UpscaleButton from "@/components/UpscaleButton";
import GenerationLoading from "@/components/GenerationLoading";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CharacterData } from "@/components/CharacterCard";

/* ── GENBOX Realism Blocks ──────────────────────────────────── */
const SKIN_BLOCK = "Skin is realistic and natural with soft visible texture — subtle pores visible at close inspection but not exaggerated, healthy even complexion with gentle natural variation, slight natural oil sheen on forehead and nose, realistic but not gritty. Minimal natural makeup: soft even base, subtle lip tint, natural brow grooming, fresh and awake-looking. No heavy contouring, no Instagram filter look, no plastic smoothing, no beauty app retouching — but also not raw or unflattering. Think: how a real person looks after light makeup and good lighting at a professional photo session.";
const QUALITY_BLOCK = "High resolution photo, shot on smartphone camera, photographic realism, natural shallow depth of field, natural color grading with warm daylight tint, realistic contrast, slight natural grain. Looks like a real content creator's photo, not a studio shot.";
const NEGATIVE_BLOCK = "No cartoon, no anime, no CGI, no 3D render, no plastic skin, no over-smoothing, no glamour filter, no artificial glow, no fantasy lighting, no neon, no watermark, no text overlay, no distorted features, no extra fingers, no warped proportions, no game engine look, no hyper-saturated colors, no beauty app filter, no Instagram filter, no perfectly symmetrical rooms, no impossibly clean environments, no plastic-looking surfaces, no floating objects without shadows, no uniform flat lighting across entire scene, no AI-typical repeated patterns on walls or floors, no sterile empty rooms, no professional studio lighting setup, no editorial fashion photography, no stock photo composition.";
const ENV_REALISM_BLOCK = "Environment must look like a REAL lived-in space photographed with a phone or mirrorless camera. Include subtle signs of real life: a phone charger on a nightstand, a half-drunk glass of water, slightly wrinkled bedsheet corner, a book left open, shoes by the door, a bag on a chair. Background should have natural depth of field — slightly soft/blurred behind the subject, not everything in razor-sharp focus. Walls should have subtle natural texture variation, not perfectly flat rendered surfaces. Lighting should have natural falloff — brighter near windows, gradually darker in corners. No unnaturally symmetrical rooms, no impossibly clean surfaces, no repeated tile patterns, no plastic-looking materials, no floating furniture, no missing shadows.";
const UGC_STYLE_BLOCK = "Shot on iPhone 15 or Samsung Galaxy S24, casual selfie or tripod angle, slight phone camera lens characteristics, natural phone HDR processing. This is UGC content by a content creator or affiliate marketer, NOT a professional photoshoot. The person looks like they're filming/photographing themselves for TikTok or Instagram — natural, relatable, slightly imperfect framing. Think: how a real affiliate marketer photographs themselves reviewing a product in their daily life. Not overly composed or art-directed.";

/* ── Helper: convert image URL to base64 ────────────────────── */
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/* ── Helper: convert File to base64 ─────────────────────────── */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Kie AI single image generation helper ──────────────────── */
async function generateKieImage(
  kieApiKey: string,
  prompt: string,
  imageInputs: string[],
  abortCheck: () => boolean,
): Promise<string> {
  const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nano-banana-pro",
      input: {
        prompt,
        image_input: [...new Set(imageInputs.filter(Boolean))],
        aspect_ratio: "3:4",
        resolution: "2K",
        output_format: "jpg",
        google_search: false,
      },
    }),
  });
  const createJson = await createRes.json();
  if (createJson.code !== 200 || !createJson.data?.taskId) {
    throw new Error(createJson.message || "Failed to create task");
  }
  const taskId = createJson.data.taskId;

  let polls = 0;
  const maxPolls = 50;
  const poll = async (): Promise<string> => {
    if (abortCheck()) throw new Error("Cancelled");
    const r = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${kieApiKey}` },
    });
    const j = await r.json();
    const state = j.data?.state;
    if (state === "success") {
      const rj = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
      const url = rj?.resultUrls?.[0] || rj?.url || "";
      if (!url) throw new Error("No image URL in result");
      return url;
    }
    if (state === "fail") throw new Error("Generation failed");
    polls++;
    if (polls >= maxPolls) throw new Error("Timeout — generation took too long");
    await new Promise((r) => setTimeout(r, 3000));
    return poll();
  };

  return poll();
}

/* ── preset characters (same as CharactersPage) ─────────────── */
const PRESETS: CharacterData[] = [
  { id: "p1", name: "Hijab Casual", type: "Wanita", age_range: "20-25", style: "Modern", description: "Wanita muda dengan hijab modern pastel, ekspresi hangat dan ramah.", gradient_from: "from-emerald-900/40", gradient_to: "to-teal-900/40", is_preset: true },
  { id: "p2", name: "Urban Trendy", type: "Pria", age_range: "22-28", style: "Streetwear", description: "Pria muda urban dengan gaya streetwear, percaya diri dan modern.", gradient_from: "from-blue-900/40", gradient_to: "to-indigo-900/40", is_preset: true },
  { id: "p3", name: "Ibu Muda", type: "Wanita", age_range: "25-35", style: "Friendly", description: "Ibu muda yang relatable dan ramah.", gradient_from: "from-rose-900/40", gradient_to: "to-pink-900/40", is_preset: true },
  { id: "p4", name: "Mahasiswa", type: "Pria/Wanita", age_range: "18-22", style: "Energik", description: "Mahasiswa energik dan ceria.", gradient_from: "from-amber-900/40", gradient_to: "to-orange-900/40", is_preset: true },
  { id: "p5", name: "Beauty Enthusiast", type: "Wanita", age_range: "20-30", style: "Glowing", description: "Pecinta kecantikan dengan kulit glowing.", gradient_from: "from-fuchsia-900/40", gradient_to: "to-purple-900/40", is_preset: true },
  { id: "p6", name: "Bapak UMKM", type: "Pria", age_range: "35-50", style: "Profesional", description: "Bapak pengusaha yang terpercaya.", gradient_from: "from-slate-800/40", gradient_to: "to-zinc-800/40", is_preset: true },
  { id: "p7", name: "Gen-Z Creator", type: "Pria/Wanita", age_range: "17-22", style: "Trendy", description: "Content creator Gen-Z yang trendy.", gradient_from: "from-cyan-900/40", gradient_to: "to-sky-900/40", is_preset: true },
  { id: "p8", name: "Office Worker", type: "Pria/Wanita", age_range: "25-35", style: "Smart Casual", description: "Pekerja kantor yang rapi.", gradient_from: "from-gray-800/40", gradient_to: "to-neutral-800/40", is_preset: true },
  { id: "p9", name: "Ibu PKK", type: "Wanita", age_range: "35-50", style: "Ramah", description: "Ibu komunitas yang hangat.", gradient_from: "from-green-900/40", gradient_to: "to-lime-900/40", is_preset: true },
  { id: "p10", name: "Cowok Gym", type: "Pria", age_range: "22-30", style: "Athletic", description: "Pria atletis dan percaya diri.", gradient_from: "from-red-900/40", gradient_to: "to-orange-900/40", is_preset: true },
];

type GenState = "idle" | "loading" | "completed" | "failed";

// Per-shot status for multi-angle
interface ShotStatus {
  state: "pending" | "generating" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
}

const GeneratePage = () => {
  const { user } = useAuth();
  const { kieApiKey, geminiKey, keys } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { upscale, getState: getUpscaleState } = useUpscale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Form state
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Product DNA state
  const [productDNA, setProductDNA] = useState<ProductDNA | null>(null);
  const [detectingDNA, setDetectingDNA] = useState(false);

  const [selectedCharId, setSelectedCharId] = useState<string>("");
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [customChars, setCustomChars] = useState<CharacterData[]>([]);

  const [background, setBackground] = useState("");
  const [customBg, setCustomBg] = useState("");
  const [pose, setPose] = useState("");
  const [mood, setMood] = useState("");

  // Compute category-aware options
  const currentCategory: ProductCategory = productDNA?.category || "other";
  const envOptions = getEnvironments(currentCategory);
  const poseOptions = getPoses(currentCategory);
  const moodOptions = getMoods(currentCategory);

  // Reset selections when category changes
  const [prevCategory, setPrevCategory] = useState<ProductCategory>("other");
  useEffect(() => {
    if (currentCategory !== prevCategory) {
      setBackground("");
      setCustomBg("");
      setPose("");
      setMood("");
      setPrevCategory(currentCategory);
    }
  }, [currentCategory, prevCategory]);

  const [prompt, setPrompt] = useState("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  // Stored fields from generatePrompt JSON for visual consistency in multi-angle
  const [baseSceneFields, setBaseSceneFields] = useState<{
    scene_description: string;
    background: string;
    lighting: string;
    character_action: string;
    product_placement: string;
  } | null>(null);

  // Generation state
  const [genState, setGenState] = useState<GenState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  // Multi-angle state (6 individual shots)
  const [multiAngleActive, setMultiAngleActive] = useState(false);
  const [shotStatuses, setShotStatuses] = useState<ShotStatus[]>([]);
  const [multiAngleElapsed, setMultiAngleElapsed] = useState(0);
  const multiAngleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const multiAngleAbortRef = useRef(false);

  // Navigation blocker: warn on browser close/refresh
  const isGenerating = genState === "loading" || multiAngleActive;
  const [showNavWarning, setShowNavWarning] = useState(false);

  useEffect(() => {
    if (!isGenerating) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isGenerating]);

  // Fetch custom characters
  useEffect(() => {
    if (!user) return;
    supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_preset", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setCustomChars(
            data.map((d) => ({
              id: d.id,
              name: d.name,
              type: d.type,
              age_range: d.age_range,
              style: d.style,
              description: d.description,
              gradient_from: d.gradient_from,
              gradient_to: d.gradient_to,
              is_preset: false,
              hero_image_url: d.hero_image_url ?? undefined,
              reference_images: d.reference_images ?? undefined,
              identity_prompt: d.identity_prompt ?? undefined,
              reference_photo_url: d.reference_photo_url ?? undefined,
            }))
          );
        }
      });
  }, [user]);

  // Pre-select character from navigation state or search params
  useEffect(() => {
    const stateChar = (location.state as any)?.character as CharacterData | undefined;
    const paramId = searchParams.get("characterId");
    if (stateChar) {
      setSelectedCharId(stateChar.id);
      setSelectedChar(stateChar);
    } else if (paramId) {
      const found = [...PRESETS, ...customChars].find((c) => c.id === paramId);
      if (found) {
        setSelectedCharId(found.id);
        setSelectedChar(found);
      }
    }
  }, [location.state, searchParams, customChars]);

  // Handle character select change
  const onCharSelect = (id: string) => {
    setSelectedCharId(id);
    const found = [...PRESETS, ...customChars].find((c) => c.id === id) || null;
    setSelectedChar(found);
  };

  /* ── Product DNA Detection ───────────────────────────────────── */
  const runDNADetection = async (file: File) => {
    if (!geminiKey || keys.gemini.status !== "valid") return;
    setDetectingDNA(true);
    try {
      const base64 = await fileToBase64(file);
      const dna = await detectProductDNA(base64, promptModel, geminiKey!);
      setProductDNA(dna);
      toast({ title: `Produk terdeteksi: ${dna.category}/${dna.sub_category}`, description: dna.product_description.slice(0, 80) });
    } catch (err: any) {
      console.error("DNA detection failed:", err);
    } finally {
      setDetectingDNA(false);
    }
  };

  /* ── Product Upload ───────────────────────────────────────── */
  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10MB", variant: "destructive" });
      return;
    }
    setProductFile(file);
    setProductPreview(URL.createObjectURL(file));
    setProductDNA(null);
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setProductUrl(urlData.publicUrl);
    setUploading(false);

    // Auto-detect DNA
    runDNADetection(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const removeProduct = () => {
    setProductFile(null);
    setProductPreview(null);
    setProductUrl(null);
    setProductDNA(null);
  };

  /* ── Prompt Generation via Gemini (Category-Aware) ───────── */
  const generatePrompt = async () => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", description: "Buka Settings untuk setup API key.", variant: "destructive" });
      return;
    }
    if (!selectedChar) {
      toast({ title: "Pilih karakter dulu", variant: "destructive" });
      return;
    }
    setGeneratingPrompt(true);
    try {
      const envOption = findOption(envOptions, background);
      const bgRich = background === "Custom" ? customBg : (envOption?.description || background);
      const poseOption = findOption(poseOptions, pose);
      const poseRich = poseOption?.description || pose;
      const moodOption = findOption(moodOptions, mood);
      const moodRich = moodOption?.description || mood;
      const characterIdentity = selectedChar.identity_prompt || selectedChar.description;

      const categoryInstruction = productDNA
        ? getCategoryPromptInstruction(productDNA)
        : "Analyze the product image above — describe its exact shape, color, size, packaging, label, and type.";

      const parts: any[] = [];

      if (productUrl) {
        try {
          const base64 = await imageUrlToBase64(productUrl);
          parts.push({
            inlineData: { mimeType: "image/jpeg", data: base64 },
          });
          parts.push({ text: "This is the product image. Use it as primary visual reference." });
        } catch (e) {
          console.warn("Failed to convert product image to base64:", e);
        }
      }

      parts.push({
        text: `You are an expert UGC (user-generated content) prompt builder for AI image generation. Create a structured JSON prompt for a realistic product UGC photo.

STYLE DIRECTION: This is UGC (user-generated content) for TikTok/Instagram affiliate marketing. The photo should look like it was taken by the person themselves with a phone camera — natural, relatable, not professionally art-directed. Think content creator, not fashion magazine. Shot on smartphone, casual angle, slightly imperfect framing. The person is a real affiliate marketer or content creator reviewing/using a product in their daily life.

Character: ${selectedChar.name}
Character Identity: ${characterIdentity}
Background: ${bgRich || "not specified"}
Pose: ${poseRich || "not specified"}
Mood: ${moodRich || "not specified"}

CATEGORY-SPECIFIC DIRECTION:
${categoryInstruction}

Respond ONLY with valid JSON:
{
  "product_description": "Exact description of the product from the image — shape, color, packaging, label text if visible, size",
  "scene_description": "Full scene description combining character + product + setting — must feel like UGC, not editorial",
  "character_action": "Specific action with the product matching the category direction above — natural, not posed",
  "product_placement": "Exactly how the product appears — which hand holds it, position relative to face, angle of label",
  "lighting": "Natural lighting — phone camera HDR, daylight from windows, warm ambient. NOT studio lighting",
  "background": "Background/environment details — must feel like a REAL lived-in space, not a 3D render",
  "environment_details": "Specific lived-in details and imperfections in the environment that make it feel real — e.g. phone charger on nightstand, half-drunk glass of water, slightly wrinkled fabric, visible power outlet, a bag on a chair",
  "camera": "Smartphone camera angle — selfie, tripod, or friend-holding-phone. Natural shallow depth of field",
  "final_prompt": "Complete combined prompt ready for image generation. MUST include: exact product description, exact character appearance, scene details, lighting, camera, AND environment realism details. The photo must look like authentic UGC content shot on a phone by a content creator, NOT a professional photoshoot or stock photo."
}

ENVIRONMENT REALISM RULE: The background must look like a REAL space, not a 3D render. Include 2-3 small everyday objects or imperfections that make it feel lived-in (phone charger, half-drunk glass, slightly wrinkled fabric, visible power outlet). Use natural depth of field — background slightly blurred. No perfectly symmetrical rooms.`,
      });

      console.log("=== GEMINI PROMPT GENERATE ===");
      console.log("Model:", promptModel, "| Key length:", geminiKey?.length, "| DNA:", productDNA?.category);

      const genConfig: Record<string, any> = {};
      if (promptModel !== "gemini-3.1-pro-preview") {
        genConfig.responseMimeType = "application/json";
      }

      const json = await geminiFetch(promptModel, geminiKey!, {
        contents: [{ parts }],
        generationConfig: genConfig,
      });

      console.log("Gemini response status: OK", JSON.stringify(json).length, "bytes");

      if (json.promptFeedback?.blockReason) {
        throw new Error(`Prompt blocked: ${json.promptFeedback.blockReason}`);
      }

      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) {
        const finishReason = json.candidates?.[0]?.finishReason;
        throw new Error(`Empty response from Gemini${finishReason ? ` (${finishReason})` : ""}`);
      }
      try {
        const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const enhancedPrompt = `${parsed.final_prompt}\n\n${SKIN_BLOCK}\n\n${ENV_REALISM_BLOCK}\n\n${UGC_STYLE_BLOCK}\n\n${QUALITY_BLOCK}\n\n${NEGATIVE_BLOCK}`;
        setPrompt(enhancedPrompt);

        // Store scene fields for visual consistency in multi-angle
        setBaseSceneFields({
          scene_description: parsed.scene_description || "",
          background: parsed.background || "",
          lighting: parsed.lighting || "",
          character_action: parsed.character_action || "",
          product_placement: parsed.product_placement || "",
        });

        if (productDNA && parsed.product_description && parsed.product_description.length > (productDNA.product_description?.length || 0)) {
          setProductDNA((prev) => prev ? { ...prev, product_description: parsed.product_description } : prev);
        }
      } catch {
        setPrompt(rawText.trim());
      }
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      console.error("Generate prompt error:", msg);
      toast({ title: "Gagal generate prompt", description: msg, variant: "destructive" });
    } finally {
      setGeneratingPrompt(false);
    }
  };

  /* ── Image Generation via Kie AI ──────────────────────────── */
  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const generate = async () => {
    if (!kieApiKey || keys.kie_ai.status !== "valid") {
      toast({ title: "Kie AI API key belum di-setup", description: "Buka Settings untuk setup API key.", variant: "destructive" });
      return;
    }
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", description: "Buka Settings untuk setup API key.", variant: "destructive" });
      return;
    }
    if (!productUrl || !selectedChar || !prompt.trim()) return;

    abortRef.current = false;
    setGenState("loading");
    setResultUrl(null);
    setErrorMsg("");
    startTimer();

    try {
      const imageInputs: string[] = [];
      if (selectedChar?.reference_photo_url) imageInputs.push(selectedChar.reference_photo_url);
      if (selectedChar && !selectedChar.id.startsWith("p") && selectedChar.hero_image_url) imageInputs.push(selectedChar.hero_image_url);
      if (productUrl) imageInputs.push(productUrl);

      const imageUrl = await generateKieImage(
        kieApiKey,
        prompt,
        imageInputs,
        () => abortRef.current,
      );
      stopTimer();
      setResultUrl(imageUrl);
      setGenState("completed");

      await supabase.from("generations").insert({
        user_id: user!.id,
        type: "ugc_image",
        prompt,
        image_url: imageUrl,
        character_id: selectedChar.id.startsWith("p") ? null : selectedChar.id,
        provider: "kie_ai",
        model: "nano-banana-pro",
        status: "completed",
        metadata: (productDNA ? { productDNA } : {}) as any,
      });
    } catch (err: any) {
      stopTimer();
      if (!abortRef.current) {
        setGenState("failed");
        setErrorMsg(err.message || "Terjadi kesalahan");
      }
    }
  };

  const cancelGeneration = () => {
    abortRef.current = true;
    stopTimer();
    setGenState("idle");
  };

  const canGenerate = !!productUrl && !!selectedChar && !!prompt.trim() && genState !== "loading";

  /* ── Multi-Angle: 6 Parallel Individual API Calls ─────────── */
  const generateMultiAngle = async () => {
    if (!kieApiKey || !geminiKey || !resultUrl || !selectedChar) return;
    const dna = productDNA || EMPTY_DNA;
    const angles = getAnglesByCategory(dna.category, dna.sub_category);

    multiAngleAbortRef.current = false;
    setMultiAngleActive(true);
    setShotStatuses(angles.map(() => ({ state: "pending" as const })));
    setMultiAngleElapsed(0);
    multiAngleTimerRef.current = setInterval(() => setMultiAngleElapsed((p) => p + 1), 1000);

    const characterIdentity = selectedChar.identity_prompt || selectedChar.description;
    const consistencyBlock = buildProductConsistencyBlock(dna);

    // Build image inputs shared by all shots
    const sharedImages: string[] = [];
    if (resultUrl) sharedImages.push(resultUrl); // Base generated result as PRIMARY
    if (productUrl) sharedImages.push(productUrl); // Original product photo
    if (selectedChar.reference_photo_url) sharedImages.push(selectedChar.reference_photo_url);
    if (selectedChar.hero_image_url && !selectedChar.id.startsWith("p")) sharedImages.push(selectedChar.hero_image_url);

    // Generate per-shot prompts via Gemini in parallel, then generate images
    const generateSingleAngle = async (angle: ReturnType<typeof getAnglesByCategory>[0], idx: number) => {
      try {
        // Update status to generating
        setShotStatuses((prev) => {
          const next = [...prev];
          next[idx] = { state: "generating" };
          return next;
        });

        // Build angle-specific prompt via Gemini
        let anglePrompt: string;
        // Build visual consistency lock from stored base scene fields
        const consistencyLock = baseSceneFields
          ? `VISUAL CONSISTENCY LOCK — Every detail must match the base image:
- Environment: ${baseSceneFields.background}
- Outfit & appearance: ${baseSceneFields.scene_description}
- Lighting: ${baseSceneFields.lighting}
- Product: ${baseSceneFields.product_placement}
Only the CAMERA ANGLE and POSE change per shot. Everything else — room, clothing, accessories, hair, lighting direction, color palette — must remain identical to the base image.`
          : "";

        try {
          const promptResult = await geminiFetch(promptModel, geminiKey!, {
            contents: [{ parts: [{ text: `You are a UGC photo prompt expert. Create a SINGLE image prompt for this specific angle.

${consistencyLock}

Character: ${selectedChar!.name} — ${characterIdentity}
Angle: ${angle.label} — ${angle.description}
Story Role: ${angle.storyRole}

${consistencyBlock}

RULES:
- Show the EXACT same person as in the base image (same face, hair, skin tone, outfit)
- Show the EXACT same product (matching description above)
- The base image is the FIRST image input — match its environment, outfit, and lighting exactly
- Photorealistic, 8K quality, natural lighting
- ${SKIN_BLOCK}
- ${QUALITY_BLOCK}
- ${NEGATIVE_BLOCK}

Output ONLY the final prompt text, no JSON, no explanation.` }] }],
          });
          anglePrompt = promptResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        } catch {
          // Fallback: use a simple constructed prompt
          anglePrompt = `${consistencyLock}\n\nPhotorealistic UGC photo. ${angle.description}. Character: ${characterIdentity}. ${consistencyBlock} ${QUALITY_BLOCK} ${NEGATIVE_BLOCK}`;
        }

        if (multiAngleAbortRef.current) throw new Error("Cancelled");

        // Generate image via Kie AI
        const imageUrl = await generateKieImage(
          kieApiKey!,
          anglePrompt,
          sharedImages,
          () => multiAngleAbortRef.current,
        );

        // Save to gallery immediately
        const path = `${user!.id}/multi-angle/${Date.now()}_${idx}.jpg`;
        await supabase.storage.from("product-images").upload(path, await (await fetch(imageUrl)).blob(), { contentType: "image/jpeg" });
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);

        await supabase.from("generations").insert({
          user_id: user!.id,
          type: "ugc_image",
          prompt: `Multi-angle: ${angle.label}`,
          image_url: urlData.publicUrl,
          character_id: selectedChar!.id.startsWith("p") ? null : selectedChar!.id,
          provider: "kie_ai",
          model: "nano-banana-pro",
          status: "completed",
          metadata: {
            angle: angle.label,
            storyRole: angle.storyRole,
            source: "multi_angle",
            productDNA: dna.category !== "other" ? dna : undefined,
          } as any,
        });

        setShotStatuses((prev) => {
          const next = [...prev];
          next[idx] = { state: "completed", imageUrl: urlData.publicUrl };
          return next;
        });
      } catch (err: any) {
        if (multiAngleAbortRef.current) return;
        setShotStatuses((prev) => {
          const next = [...prev];
          next[idx] = { state: "failed", error: err?.message || "Failed" };
          return next;
        });
      }
    };

    // Run all 6 in parallel
    await Promise.allSettled(angles.map((angle, idx) => generateSingleAngle(angle, idx)));

    if (multiAngleTimerRef.current) clearInterval(multiAngleTimerRef.current);
    if (multiAngleAbortRef.current) {
      setMultiAngleActive(false);
    }
    // Keep multiAngleActive false only after all done — shots remain visible
    setMultiAngleActive(false);
  };

  const cancelMultiAngle = () => {
    multiAngleAbortRef.current = true;
    if (multiAngleTimerRef.current) clearInterval(multiAngleTimerRef.current);
    setMultiAngleActive(false);
  };

  const resetMultiAngle = () => {
    setMultiAngleActive(false);
    setShotStatuses([]);
    setMultiAngleElapsed(0);
  };

  // Computed multi-angle progress
  const completedShots = shotStatuses.filter((s) => s.state === "completed").length;
  const failedShots = shotStatuses.filter((s) => s.state === "failed").length;
  const totalShots = shotStatuses.length;
  const multiAngleDone = totalShots > 0 && !multiAngleActive && (completedShots + failedShots === totalShots);
  const multiAngleHasResults = shotStatuses.some((s) => s.state === "completed");

  // Get current angle labels based on DNA
  const currentAngles = productDNA
    ? getAnglesByCategory(productDNA.category, productDNA.sub_category)
    : getAnglesByCategory("other");

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-0px)] -mx-4 -my-4 lg:-mx-6 lg:-my-8">
      {/* Navigation blocker is handled via beforeunload */}

      {/* LEFT PANEL */}
      <div className="w-full lg:w-[55%] overflow-y-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase text-foreground">Generate Gambar</h1>
          <p className="text-xs text-muted-foreground mt-1">Buat konten UGC realistis dengan AI</p>
        </div>

        {/* Upload Produk */}
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Upload Produk</label>
          {productPreview ? (
            <div className="space-y-2">
              <div className="relative inline-block">
                <img src={productPreview} alt="Product" className="h-32 w-32 rounded-xl object-cover border border-border" />
                <button
                  onClick={removeProduct}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* Product DNA Badge */}
              {detectingDNA && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ScanSearch className="h-3.5 w-3.5 animate-pulse" />
                  <span>Mendeteksi produk...</span>
                </div>
              )}
              {productDNA && !detectingDNA && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Select
                    value={productDNA.category}
                    onValueChange={(val) =>
                      setProductDNA((prev) => prev ? { ...prev, category: val as ProductCategory } : prev)
                    }
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs bg-primary/10 border-primary/20 text-primary font-semibold px-2.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-xs">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {productDNA.sub_category && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                      {productDNA.sub_category}
                    </Badge>
                  )}
                  {productDNA.dominant_color && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                      {productDNA.dominant_color}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
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
              className="border-2 border-dashed border-border rounded-xl p-8 bg-background hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drag & drop foto produk</p>
              <p className="text-xs text-muted-foreground">atau klik untuk pilih file</p>
              <p className="text-[11px] text-muted-foreground/60">JPEG, PNG, WebP — Maks 10MB</p>
            </div>
          )}
        </div>

        {/* Pilih Karakter */}
        <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Pilih Karakter</label>
          <Select value={selectedCharId} onValueChange={onCharSelect}>
            <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border">
              <SelectValue placeholder="Pilih karakter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Preset</SelectLabel>
                {PRESETS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
              {customChars.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Karakter Saya</SelectLabel>
                  {customChars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {c.hero_image_url ? (
                          <img src={c.hero_image_url} alt={c.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <UserCircle className="h-4 w-4 text-primary shrink-0" />
                        )}
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>

          {selectedChar && (
            <div className="mt-3 flex items-center gap-3 bg-card border border-border rounded-lg p-3">
              {selectedChar.hero_image_url ? (
                <img src={selectedChar.hero_image_url} alt={selectedChar.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{selectedChar.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[selectedChar.type, selectedChar.age_range, selectedChar.style].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/characters/create")}
            className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            Buat karakter baru <LinkIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Pengaturan Scene */}
        <div className="animate-fade-up space-y-6" style={{ animationDelay: "200ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block">Pengaturan Scene</label>

          <div>
            <label className="text-xs text-muted-foreground block mb-2.5">Background / Environment</label>
            <Select value={background} onValueChange={setBackground}>
              <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border"><SelectValue placeholder="Pilih environment..." /></SelectTrigger>
              <SelectContent>
                {envOptions.map((opt) => (
                  <SelectItem key={opt.label} value={opt.label}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      {opt.description && <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">{opt.description.slice(0, 55)}…</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {background === "Custom" && (
              <Input
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                placeholder="Deskripsikan environment secara detail..."
                className="mt-2 bg-[hsl(0_0%_10%)] border-border"
              />
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2.5">Pose</label>
            <Select value={pose} onValueChange={setPose}>
              <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border"><SelectValue placeholder="Pilih pose..." /></SelectTrigger>
              <SelectContent>
                {poseOptions.map((opt) => (
                  <SelectItem key={opt.label} value={opt.label}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">{opt.description.slice(0, 55)}…</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2.5">Mood</label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border"><SelectValue placeholder="Pilih mood..." /></SelectTrigger>
              <SelectContent>
                {moodOptions.map((opt) => (
                  <SelectItem key={opt.label} value={opt.label}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">{opt.description.slice(0, 55)}…</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prompt */}
        <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Prompt</label>
          <button
            onClick={generatePrompt}
            disabled={generatingPrompt || !selectedChar}
            className="mb-3 inline-flex items-center gap-2 border border-primary text-primary text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {generatingPrompt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            GENERATE PROMPT
          </button>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Prompt akan di-generate otomatis atau tulis manual..."
            className="bg-[hsl(0_0%_10%)] border-border text-sm"
          />
          <p className="text-[11px] text-muted-foreground/60 mt-1.5">Edit prompt untuk hasil yang lebih baik</p>
        </div>

        {/* Generate */}
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-start gap-2 bg-card border border-border rounded-lg p-3 mb-4">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Estimasi biaya: ~Rp 150-500 dari API key kamu</p>
              <p className="text-[11px] text-muted-foreground/60">Output tanpa watermark</p>
            </div>
          </div>
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40 animate-cta-glow disabled:animate-none"
          >
            <Paintbrush className="h-4 w-4" />
            Generate Gambar
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[45%] bg-[hsl(0_0%_5%)] border-t lg:border-t-0 lg:border-l border-border flex flex-col items-center justify-start p-6 lg:p-10 min-h-[400px] lg:min-h-0 overflow-y-auto">
        {genState === "idle" && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <ImageIcon className="h-16 w-16 text-foreground/10 mb-4" />
            <p className="text-sm text-muted-foreground">Hasil generasi akan muncul di sini</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Upload produk dan pilih karakter untuk mulai</p>
          </div>
        )}

        {genState === "loading" && (
          <GenerationLoading
            model="image"
            elapsed={elapsed}
            aspectRatio="3:4"
            prompt={prompt}
            modelLabel="nano-banana-pro"
            badgeColor="bg-primary/20 text-primary"
            onCancel={cancelGeneration}
          />
        )}

        {genState === "completed" && resultUrl && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in">
            <img
              src={resultUrl}
              alt="Generated UGC"
              className="w-full rounded-xl border-2 border-primary/20 shadow-lg object-cover"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>nano-banana-pro</span>
              <span>•</span>
              <span>{elapsed}s</span>
              {productDNA && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {productDNA.category}
                  </Badge>
                </>
              )}
            </div>
            <div className="flex gap-2 w-full">
              <a
                href={getUpscaleState("ugc_result").resultUrl || resultUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
              <UpscaleButton
                imageUrl={resultUrl}
                imageKey="ugc_result"
                loading={getUpscaleState("ugc_result").loading}
                currentFactor={getUpscaleState("ugc_result").factor}
                onUpscale={(k, u, f) => upscale(k, u, f)}
              />
              <button
                onClick={() => { setGenState("idle"); setResultUrl(null); resetMultiAngle(); }}
                className="border border-border text-muted-foreground text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Multi-Angle Section */}
            <div className="w-full border-t border-border pt-4 mt-2">
              {/* Idle — no shots yet */}
              {!multiAngleActive && shotStatuses.length === 0 && (
                <div className="space-y-3">
                  <button
                    onClick={generateMultiAngle}
                    className="w-full border border-primary text-primary font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Generate Multi-Angle (6 shots)
                  </button>
                  {productDNA && (
                    <div className="grid grid-cols-3 gap-1">
                      {currentAngles.map((a, i) => (
                        <div key={i} className="text-[9px] text-muted-foreground/60 text-center truncate" title={a.description}>
                          {a.label}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 text-center">6 API calls paralel = 6 shots individual • ~Rp 900-3000</p>
                </div>
              )}

              {/* Active or completed — show shot grid */}
              {shotStatuses.length > 0 && (
                <div className="space-y-3">
                  {/* Progress header */}
                  {multiAngleActive && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Generating 6 angles... <span className="text-primary font-bold">({completedShots}/6 selesai)</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {Math.floor(multiAngleElapsed / 60)}:{String(multiAngleElapsed % 60).padStart(2, "0")}
                        </span>
                        <button onClick={cancelMultiAngle} className="text-[10px] text-destructive hover:underline">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {multiAngleDone && (
                    <p className="text-xs text-muted-foreground text-center">
                      ✅ {completedShots} selesai{failedShots > 0 ? ` • ❌ ${failedShots} gagal` : ""} — {multiAngleElapsed}s
                    </p>
                  )}

                  {/* Shot grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {shotStatuses.map((shot, i) => (
                      <div key={i} className="relative group">
                        {shot.state === "completed" && shot.imageUrl ? (
                          <>
                            <img
                              src={shot.imageUrl}
                              alt={currentAngles[i]?.label || `Shot ${i + 1}`}
                              className="w-full aspect-[3/4] object-cover rounded-lg border border-border"
                            />
                            <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <a
                                href={shot.imageUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                              <span className="text-[9px] text-white/80">{currentAngles[i]?.label}</span>
                              <span className="text-[8px] text-white/50">{currentAngles[i]?.storyRole}</span>
                            </div>
                            <div className="absolute top-1 right-1">
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                            </div>
                          </>
                        ) : shot.state === "failed" ? (
                          <div className="w-full aspect-[3/4] rounded-lg border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-1">
                            <XCircle className="h-5 w-5 text-destructive/60" />
                            <span className="text-[8px] text-destructive/60 text-center px-1">{currentAngles[i]?.label}</span>
                          </div>
                        ) : shot.state === "generating" ? (
                          <div className="w-full aspect-[3/4] rounded-lg border border-border bg-muted/30 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            <span className="text-[8px] text-muted-foreground text-center px-1">{currentAngles[i]?.label}</span>
                          </div>
                        ) : (
                          <div className="w-full aspect-[3/4] rounded-lg border border-border bg-muted/10 flex flex-col items-center justify-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                            <span className="text-[8px] text-muted-foreground/40 text-center px-1">{currentAngles[i]?.label}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {multiAngleDone && (
                    <>
                      <p className="text-[10px] text-muted-foreground/60 text-center">
                        Semua shot tersimpan di Gallery — bisa jadi Start Image di Buat Video
                      </p>
                      <button
                        onClick={resetMultiAngle}
                        className="w-full border border-border text-muted-foreground text-xs py-2 rounded-lg hover:text-foreground transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="h-3 w-3" /> Generate lagi
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {genState === "failed" && (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs animate-fade-in">
            <div className="w-full border border-destructive/30 bg-destructive/5 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{errorMsg || "Terjadi kesalahan"}</p>
            </div>
            <button
              onClick={generate}
              className="bg-primary text-primary-foreground font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratePage;
