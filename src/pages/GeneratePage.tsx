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
import { CONTENT_TEMPLATES, type ContentTemplateKey } from "@/lib/content-templates";
import { getStoryboardBeats, getStoryRoleColor, type StoryboardBeat } from "@/lib/storyboard-angles";
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
  Film,
  ScanSearch,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  Camera,
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

import { imageUrlToBase64, fileToBase64 } from "@/lib/image-utils";

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

import { PRESETS } from "@/lib/character-presets";

type GenState = "idle" | "loading" | "completed" | "failed";

// Per-shot status for multi-angle
interface ShotStatus {
  state: "pending" | "prompting" | "generating" | "completed" | "failed";
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

  // Own photo state
  const [ownPhotoPreview, setOwnPhotoPreview] = useState<string | null>(null);
  const [ownPhotoUrl, setOwnPhotoUrl] = useState<string | null>(null);
  const [ownPhotoUploading, setOwnPhotoUploading] = useState(false);
  const [ownPhotoAnalyzing, setOwnPhotoAnalyzing] = useState(false);

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

  // Storyboard state
  const [storyboardTemplate, setStoryboardTemplate] = useState<ContentTemplateKey | null>(null);
  const [storyboardActive, setStoryboardActive] = useState(false);
  const [shotStatuses, setShotStatuses] = useState<ShotStatus[]>([]);
  const [storyboardElapsed, setStoryboardElapsed] = useState(0);
  const storyboardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storyboardAbortRef = useRef(false);

  // Navigation blocker: warn on browser close/refresh
  const isGenerating = genState === "loading" || storyboardActive;

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
    // Clear own photo when selecting from dropdown
    setOwnPhotoPreview(null);
    setOwnPhotoUrl(null);
    setOwnPhotoUploading(false);
    setOwnPhotoAnalyzing(false);
    setSelectedCharId(id);
    const found = [...PRESETS, ...customChars].find((c) => c.id === id) || null;
    setSelectedChar(found);
  };

  // Remove own photo
  const removeOwnPhoto = () => {
    setOwnPhotoPreview(null);
    setOwnPhotoUrl(null);
    setOwnPhotoUploading(false);
    setOwnPhotoAnalyzing(false);
    if (selectedChar?.id === "__own_photo__") {
      setSelectedCharId("");
      setSelectedChar(null);
    }
  };

  // Handle own photo upload
  const handleOwnPhotoSelect = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10MB", variant: "destructive" });
      return;
    }
    setOwnPhotoPreview(URL.createObjectURL(file));
    setOwnPhotoUploading(true);
    setOwnPhotoAnalyzing(false);

    // Clear dropdown selection
    setSelectedCharId("__own_photo__");

    const ext = file.name.split(".").pop();
    const path = `${user.id}/own-photo/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("character-packs").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      setOwnPhotoUploading(false);
      removeOwnPhoto();
      return;
    }
    const { data: urlData } = supabase.storage.from("character-packs").getPublicUrl(path);
    const uploadedUrl = urlData.publicUrl;
    setOwnPhotoUrl(uploadedUrl);
    setOwnPhotoUploading(false);

    // Analyze with Gemini Vision
    setOwnPhotoAnalyzing(true);
    let charData: CharacterData;
    try {
      if (!geminiKey || keys.gemini.status !== "valid") throw new Error("No Gemini key");
      const base64 = await fileToBase64(file);
      const json = await geminiFetch(promptModel, geminiKey!, {
        contents: [{
          parts: [
            { inlineData: { mimeType: file.type || "image/jpeg", data: base64 } },
            { text: `Analyze this person's photo for a UGC character profile. Return JSON only:
{
  "name": "Short descriptive name based on their look, e.g. 'Hijab Modern', 'Cowok Casual', 'Ibu Muda' (2-3 words max, Indonesian)",
  "gender": "Pria or Wanita",
  "age_range": "estimated age range like 20-25",
  "style": "one word style descriptor like Modern, Casual, Sporty, Elegant",
  "identity_prompt": "Detailed description of this EXACT person: ethnicity, skin tone, face shape, eye shape, nose, lips, hair style/color/length, any distinctive features. Be very specific so AI can recreate this exact person."
}` },
          ],
        }],
        generationConfig: { responseMimeType: "application/json" },
      });
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      charData = {
        id: "__own_photo__",
        name: parsed.name || "Foto Saya",
        type: parsed.gender || "Pria/Wanita",
        age_range: parsed.age_range || "20-30",
        style: parsed.style || "Natural",
        description: parsed.identity_prompt || "Karakter dari foto upload",
        gradient_from: "from-violet-900/40",
        gradient_to: "to-purple-900/40",
        is_preset: false,
        hero_image_url: uploadedUrl,
        reference_photo_url: uploadedUrl,
        identity_prompt: parsed.identity_prompt || undefined,
      };
    } catch (err) {
      console.warn("Gemini analysis failed, using fallback:", err);
      charData = {
        id: "__own_photo__",
        name: "Foto Saya",
        type: "Pria/Wanita",
        age_range: "20-30",
        style: "Natural",
        description: "Karakter dari foto upload pengguna",
        gradient_from: "from-violet-900/40",
        gradient_to: "to-purple-900/40",
        is_preset: false,
        hero_image_url: uploadedUrl,
        reference_photo_url: uploadedUrl,
      };
    }
    setOwnPhotoAnalyzing(false);
    setSelectedChar(charData);
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

  /* ── Storyboard: 5 Narrative Shots ──────────────────────────── */
  const generateStoryboard = async () => {
    if (!kieApiKey || !geminiKey || !resultUrl || !selectedChar || !storyboardTemplate) return;
    const dna = productDNA || EMPTY_DNA;
    const beats = getStoryboardBeats(storyboardTemplate);
    const templateObj = CONTENT_TEMPLATES.find((t) => t.key === storyboardTemplate);

    storyboardAbortRef.current = false;
    setStoryboardActive(true);
    setShotStatuses(beats.map(() => ({ state: "pending" as const })));
    setStoryboardElapsed(0);
    storyboardTimerRef.current = setInterval(() => setStoryboardElapsed((p) => p + 1), 1000);

    const characterIdentity = selectedChar.identity_prompt || selectedChar.description;
    const consistencyBlock = buildProductConsistencyBlock(dna);

    // Image inputs are now built per-frame inside generateSingleBeat
    // (base image + previous frame + product — no character hero/reference URLs needed)

    const consistencyLock = baseSceneFields
      ? `VISUAL CONSISTENCY LOCK — Every detail must match the base image (Frame 0):
- Environment: ${baseSceneFields.background}
- Outfit & appearance: ${baseSceneFields.scene_description}
- Lighting: ${baseSceneFields.lighting}
- Product: ${baseSceneFields.product_placement}
Only the POSE, EXPRESSION, and PRODUCT INTERACTION change per frame. Everything else — room, clothing, accessories, hair, lighting direction, color palette — must remain identical to the base image.`
      : "";

    // Convert base image to base64 once for Gemini vision
    let baseImageBase64 = "";
    try {
      baseImageBase64 = await imageUrlToBase64(resultUrl);
      console.log("[storyboard] Base image converted to base64 for Gemini vision");
    } catch (e) {
      console.warn("[storyboard] Failed to convert base image to base64, falling back to text-only", e);
    }

    // Track completed frame URLs for chaining into subsequent Kie AI calls
    const completedFrameUrls: (string | null)[] = beats.map(() => null);

    const generateSingleBeat = async (beat: StoryboardBeat, idx: number) => {
      try {
        setShotStatuses((prev) => {
          const next = [...prev];
          next[idx] = { state: "prompting" };
          return next;
        });

        const prevBeat = idx > 0 ? beats[idx - 1] : null;
        let beatPrompt: string;

        try {
          // Build Gemini parts: base image (vision) + text prompt
          const geminiParts: any[] = [];

          // Include base image as inlineData so Gemini can SEE it
          if (baseImageBase64) {
            geminiParts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: baseImageBase64,
              },
            });
          }

          geminiParts.push({ text: `You are a UGC storyboard prompt expert. Create a SINGLE image prompt for this narrative beat.

THIS IS THE BASE IMAGE (attached above). Your prompt MUST match this EXACT person, outfit, room, and product. Study every detail: face shape, skin tone, hair style/color, clothing colors and patterns, accessories, room layout, furniture, wall color, lighting direction, product shape and packaging.

${consistencyLock}

This is storyboard frame ${idx + 1}/5 for a '${templateObj?.label || storyboardTemplate}' video.
${prevBeat ? `Previous beat was: '${prevBeat.label}' — ${prevBeat.description}` : "This is the first storyboard frame after the base image."}
This frame should feel like the natural next moment in the sequence.

Character: ${selectedChar!.name} — ${characterIdentity}
Beat: ${beat.label} (${beat.beat})
Story Role: ${beat.storyRole}
Direction: ${beat.description}

Product DNA:
Category: ${dna.category} / ${dna.sub_category}
Product: ${dna.product_description}
${consistencyBlock}

ADAPT the beat action to this specific product type. For example, 'Demo' with skincare means applying serum on cheek, with fashion means trying on the item, with electronics means pressing buttons and showing screen. The narrative beat stays the same, the specific product interaction changes.

RULES:
- Describe the EXACT same person you see in the attached base image — same face, skin, hair, body type
- Describe the EXACT same outfit, accessories, and jewelry
- Describe the EXACT same room/environment and lighting
- Show the EXACT same product
- Only the POSE, EXPRESSION, and PRODUCT INTERACTION change
- ${SKIN_BLOCK}
- ${UGC_STYLE_BLOCK}
- ${QUALITY_BLOCK}
- ${NEGATIVE_BLOCK}

Output ONLY the final prompt text, no JSON, no explanation.` });

          const promptResult = await geminiFetch(promptModel, geminiKey!, {
            contents: [{ parts: geminiParts }],
          });
          beatPrompt = promptResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        } catch {
          beatPrompt = `${consistencyLock}\n\nPhotorealistic UGC photo. ${beat.description}. Character: ${characterIdentity}. ${consistencyBlock} ${QUALITY_BLOCK} ${NEGATIVE_BLOCK}`;
        }

        if (storyboardAbortRef.current) throw new Error("Cancelled");

        // Switch to "generating" state now that prompt is ready
        setShotStatuses((prev) => {
          const next = [...prev];
          next[idx] = { state: "generating" };
          return next;
        });

        // Build image inputs: base image + previous frame (if exists) + product image
        // Max 3 images, no character hero/reference — base image already has the character
        const frameImages: string[] = [resultUrl];
        // Chain previous completed frame for visual continuity
        const prevFrameUrl = idx > 0 ? completedFrameUrls[idx - 1] : null;
        if (prevFrameUrl) frameImages.push(prevFrameUrl);
        if (productUrl && frameImages.length < 3) frameImages.push(productUrl);

        const imageUrl = await generateKieImage(
          kieApiKey!,
          beatPrompt,
          frameImages.slice(0, 3),
          () => storyboardAbortRef.current,
        );

        const path = `${user!.id}/storyboard/${Date.now()}_${idx}.jpg`;
        await supabase.storage.from("product-images").upload(path, await (await fetch(imageUrl)).blob(), { contentType: "image/jpeg" });
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);

        // Store completed URL for chaining
        completedFrameUrls[idx] = urlData.publicUrl;

        await supabase.from("generations").insert({
          user_id: user!.id,
          type: "ugc_image",
          prompt: `Storyboard: ${beat.label}`,
          image_url: urlData.publicUrl,
          character_id: selectedChar!.id.startsWith("p") ? null : selectedChar!.id,
          provider: "kie_ai",
          model: "nano-banana-pro",
          status: "completed",
          metadata: {
            beat: beat.label,
            storyRole: beat.storyRole,
            template: storyboardTemplate,
            frameIndex: idx + 1,
            source: "storyboard",
            productDNA: dna.category !== "other" ? dna : undefined,
          } as any,
        });

        setShotStatuses((prev) => {
          const next = [...prev];
          next[idx] = { state: "completed", imageUrl: urlData.publicUrl };
          return next;
        });
      } catch (err: any) {
        if (storyboardAbortRef.current) return;
        setShotStatuses((prev) => {
          const next = [...prev];
          next[idx] = { state: "failed", error: err?.message || "Failed" };
          return next;
        });
      }
    };

    // Sequential generation with 2s delay between frames (avoid rate limits)
    for (let i = 0; i < beats.length; i++) {
      if (storyboardAbortRef.current) break;
      await generateSingleBeat(beats[i], i);
      // 2 second delay between frames to avoid Kie AI rate limiting
      if (i < beats.length - 1 && !storyboardAbortRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (storyboardTimerRef.current) clearInterval(storyboardTimerRef.current);
    setStoryboardActive(false);
  };

  const cancelStoryboard = () => {
    storyboardAbortRef.current = true;
    if (storyboardTimerRef.current) clearInterval(storyboardTimerRef.current);
    setStoryboardActive(false);
  };

  const resetStoryboard = () => {
    setStoryboardActive(false);
    setShotStatuses([]);
    setStoryboardElapsed(0);
    setStoryboardTemplate(null);
  };

  // Computed storyboard progress
  const completedShots = shotStatuses.filter((s) => s.state === "completed").length;
  const failedShots = shotStatuses.filter((s) => s.state === "failed").length;
  const totalShots = shotStatuses.length;
  const storyboardDone = totalShots > 0 && !storyboardActive && (completedShots + failedShots === totalShots);

  // Current beats for selected template
  const currentBeats = storyboardTemplate ? getStoryboardBeats(storyboardTemplate) : [];

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
                onClick={() => { setGenState("idle"); setResultUrl(null); resetStoryboard(); }}
                className="border border-border text-muted-foreground text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Video Storyboard Section */}
            <div className="w-full border-t border-border pt-4 mt-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Video Storyboard</p>

              {/* Template picker */}
              {!storyboardActive && shotStatuses.length === 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {CONTENT_TEMPLATES.map((t) => {
                      const isSelected = storyboardTemplate === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setStoryboardTemplate(t.key)}
                          className={`shrink-0 text-left rounded-lg px-3 py-2 transition-all ${
                            isSelected
                              ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/10"
                              : "bg-muted/30 border border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <p className={`text-[11px] font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{t.label}</p>
                          <p className="text-[9px] text-muted-foreground line-clamp-1 max-w-[90px]">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Beat preview */}
                  {storyboardTemplate && (
                    <div className="space-y-2">
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {currentBeats.map((beat, i) => (
                          <div key={i} className="shrink-0 w-[100px] border border-border rounded-lg p-2 bg-muted/10">
                            <div className="flex items-center gap-1 mb-1">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${getStoryRoleColor(beat.storyRole)}`}>
                                {beat.storyRole}
                              </span>
                            </div>
                            <p className="text-[10px] font-semibold text-foreground">{beat.label}</p>
                            <p className="text-[8px] text-muted-foreground/60">{beat.beat}</p>
                            <p className="text-[8px] text-muted-foreground line-clamp-3 mt-1">{beat.description}</p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={generateStoryboard}
                        className="w-full border border-primary text-primary font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Film className="h-4 w-4" />
                        Generate Storyboard (5 shots ~Rp 2.400)
                      </button>
                      <p className="text-[10px] text-muted-foreground/60 text-center">5 API calls paralel • Base image sebagai referensi visual</p>
                    </div>
                  )}

                  {!storyboardTemplate && (
                    <p className="text-[10px] text-muted-foreground/60 text-center">Pilih template video untuk generate storyboard</p>
                  )}
                </div>
              )}

              {/* Active or completed — horizontal timeline */}
              {shotStatuses.length > 0 && (
                <div className="space-y-3">
                  {storyboardActive && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Generating storyboard... <span className="text-primary font-bold">({completedShots}/5 selesai)</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {Math.floor(storyboardElapsed / 60)}:{String(storyboardElapsed % 60).padStart(2, "0")}
                        </span>
                        <button onClick={cancelStoryboard} className="text-[10px] text-destructive hover:underline">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {storyboardDone && (
                    <p className="text-xs text-muted-foreground text-center">
                      <CheckCircle2 className="inline h-3.5 w-3.5 text-green-400 mr-1" /> {completedShots} selesai{failedShots > 0 ? <> • <XCircle className="inline h-3.5 w-3.5 text-destructive mr-1" /> {failedShots} gagal</> : ""} — {storyboardElapsed}s
                    </p>
                  )}

                  {/* Timeline: Base + 5 beats */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {/* Base frame */}
                    <div className="shrink-0 w-[90px]">
                      <img
                        src={resultUrl!}
                        alt="Base"
                        className="w-full aspect-[3/4] object-cover rounded-lg border-2 border-primary/30"
                      />
                      <p className="text-[9px] text-primary font-semibold text-center mt-1">Base</p>
                      <p className="text-[8px] text-muted-foreground/60 text-center">Frame 0</p>
                    </div>

                    {/* Beat frames */}
                    {shotStatuses.map((shot, i) => {
                      const beat = currentBeats[i];
                      return (
                        <div key={i} className="shrink-0 w-[90px] relative group">
                          {shot.state === "completed" && shot.imageUrl ? (
                            <>
                              <img
                                src={shot.imageUrl}
                                alt={beat?.label || `Frame ${i + 1}`}
                                className="w-full aspect-[3/4] object-cover rounded-lg border border-border"
                              />
                              <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a href={shot.imageUrl} download target="_blank" rel="noopener noreferrer" className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                  <Download className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="absolute top-1 right-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /></div>
                            </>
                          ) : shot.state === "failed" ? (
                            <div className="w-full aspect-[3/4] rounded-lg border border-destructive/30 bg-destructive/5 flex items-center justify-center">
                              <XCircle className="h-4 w-4 text-destructive/60" />
                            </div>
                          ) : shot.state === "generating" ? (
                            <div className="w-full aspect-[3/4] rounded-lg border border-border bg-muted/30 flex flex-col items-center justify-center gap-1.5">
                              <Loader2 className="h-4 w-4 text-primary animate-spin" />
                              <span className="text-[7px] text-primary/70 font-medium">Generating...</span>
                            </div>
                          ) : shot.state === "prompting" ? (
                            <div className="w-full aspect-[3/4] rounded-lg border border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-1.5">
                              <Sparkles className="h-4 w-4 text-primary/60 animate-pulse" />
                              <span className="text-[7px] text-primary/70 font-medium">Building prompt...</span>
                            </div>
                          ) : (
                            <div className="w-full aspect-[3/4] rounded-lg border border-dashed border-border bg-muted/10 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                            </div>
                          )}
                          <div className="mt-1 text-center">
                            {beat && (
                              <span className={`text-[7px] px-1 py-0.5 rounded-full font-medium ${getStoryRoleColor(beat.storyRole)}`}>
                                {beat.storyRole}
                              </span>
                            )}
                            <p className="text-[9px] text-foreground font-medium mt-0.5 truncate">{beat?.label || `Frame ${i + 1}`}</p>
                            <p className="text-[7px] text-muted-foreground/60">{beat?.beat}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {storyboardDone && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground/60 text-center">
                        Storyboard ini bisa langsung dijadikan video di Buat Video — pilih template yang sama
                      </p>
                      <button
                        onClick={() => {
                          const storyboardImgs = shotStatuses
                            .filter((s) => s.state === "completed" && s.imageUrl)
                            .map((s) => s.imageUrl!);
                          navigate("/video", {
                            state: {
                              fromStoryboard: true,
                              template: storyboardTemplate,
                              storyboardImages: storyboardImgs,
                              sourceImage: resultUrl || storyboardImgs[0],
                              baseImageUrl: resultUrl,
                              productDNA: productDNA || null,
                              productCategory: productDNA?.category || "other",
                              characterId: selectedChar?.id?.startsWith("p") ? null : selectedChar?.id || null,
                              characterIdentity: selectedChar?.identity_prompt || selectedChar?.description || null,
                            },
                          });
                        }}
                        className="w-full bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Buat Video dari Storyboard <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={resetStoryboard}
                        className="w-full border border-border text-muted-foreground text-xs py-2 rounded-lg hover:text-foreground transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="h-3 w-3" /> Generate lagi
                      </button>
                    </div>
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
