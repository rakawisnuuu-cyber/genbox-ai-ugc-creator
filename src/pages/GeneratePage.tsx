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
  ChevronDown,
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
  const maxPolls = 80;
  let consecutive404s = 0;
  const MAX_404_RETRIES = 5;
  const poll = async (): Promise<string> => {
    if (abortCheck()) throw new Error("Cancelled");
    const r = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${kieApiKey}` },
    });
    if (r.status === 404) {
      consecutive404s++;
      console.warn(`[kie-img] Poll 404 (${consecutive404s}/${MAX_404_RETRIES})`);
      if (consecutive404s >= MAX_404_RETRIES) {
        throw new Error("Task not found after multiple retries");
      }
      await new Promise((r) => setTimeout(r, 3000));
      return poll();
    }
    consecutive404s = 0;
    const j = await r.json();
    const state = j.data?.state;
    if (state === "success") {
      const rj = typeof j.data.resultJson === "string" ? JSON.parse(j.data.resultJson) : j.data.resultJson;
      const url = rj?.resultUrls?.[0] || rj?.url || "";
      if (!url) throw new Error("No image URL in result");
      return url;
    }
    if (state === "fail") throw new Error(j.data?.msg || j.data?.message || "Generation failed");
    polls++;
    if (polls >= maxPolls) throw new Error("Timeout — generation took too long (~4 min)");
    await new Promise((r) => setTimeout(r, 3000));
    return poll();
  };

  return poll();
}

import { PRESETS } from "@/lib/character-presets";

type GenState = "idle" | "loading" | "completed" | "failed";

// Per-shot status for multi-angle
interface ShotStatus {
  state: "pending" | "prompt_ready" | "prompting" | "generating" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
  prompt?: string;
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
  const [storyboardTemplate, setStoryboardTemplate] = useState<ContentTemplateKey>("problem_solution");
  const [storyboardActive, setStoryboardActive] = useState(false);
  const [shotStatuses, setShotStatuses] = useState<ShotStatus[]>([]);
  const [storyboardElapsed, setStoryboardElapsed] = useState(0);
  const storyboardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storyboardAbortRef = useRef(false);

  // Prompt-first state
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);

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

      // Send character reference image(s) to Gemini FIRST
      const hasCharImage = selectedChar.hero_image_url || selectedChar.reference_photo_url;
      if (selectedChar.hero_image_url) {
        try {
          const charBase64 = await imageUrlToBase64(selectedChar.hero_image_url);
          parts.push({ inlineData: { mimeType: "image/jpeg", data: charBase64 } });
          parts.push({ text: "This is the CHARACTER reference image. Describe this EXACT person's appearance in your prompt — their face, skin tone, hair, body type, ethnicity, and any distinctive features. The final prompt MUST recreate this exact person." });
        } catch (e) {
          console.warn("Failed to convert character hero image to base64:", e);
        }
      }
      if (selectedChar.reference_photo_url && selectedChar.reference_photo_url !== selectedChar.hero_image_url) {
        try {
          const refBase64 = await imageUrlToBase64(selectedChar.reference_photo_url);
          parts.push({ inlineData: { mimeType: "image/jpeg", data: refBase64 } });
          parts.push({ text: "This is an additional CHARACTER reference photo. Use it together with the previous image to accurately describe this person." });
        } catch (e) {
          console.warn("Failed to convert character reference photo to base64:", e);
        }
      }

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

      const charImageInstruction = hasCharImage
        ? `\n\nCRITICAL — CHARACTER REFERENCE IMAGE ATTACHED: A reference image of the character has been provided above. You MUST describe this EXACT person's appearance in detail (ethnicity, skin tone, face shape, hair style/color/length, body type, any distinctive features). The "character_appearance" field must capture this person precisely, and the "final_prompt" MUST BEGIN with the exact character appearance description so the AI image generator recreates this specific person.`
        : "";

      parts.push({
        text: `You are an expert UGC (user-generated content) prompt builder for AI image generation. Create a structured JSON prompt for a realistic product UGC photo.

STYLE DIRECTION: This is UGC (user-generated content) for TikTok/Instagram affiliate marketing. The photo should look like it was taken by the person themselves with a phone camera — natural, relatable, not professionally art-directed. Think content creator, not fashion magazine. Shot on smartphone, casual angle, slightly imperfect framing. The person is a real affiliate marketer or content creator reviewing/using a product in their daily life.

Character: ${selectedChar.name}
Character Identity: ${characterIdentity}
Background: ${bgRich || "not specified"}
Pose: ${poseRich || "not specified"}
Mood: ${moodRich || "not specified"}
${charImageInstruction}

CATEGORY-SPECIFIC DIRECTION:
${categoryInstruction}

Respond ONLY with valid JSON:
{
  "character_appearance": "Extremely detailed description of the character's EXACT physical appearance — ethnicity, skin tone, face shape, eye shape/color, nose, lips, hair style/color/length, body type, any distinctive features. If a character reference image was provided, describe THAT exact person.",
  "product_description": "Exact description of the product from the image — shape, color, packaging, label text if visible, size",
  "scene_description": "Full scene description combining character + product + setting — must feel like UGC, not editorial",
  "character_action": "Specific action with the product matching the category direction above — natural, not posed",
  "product_placement": "Exactly how the product appears — which hand holds it, position relative to face, angle of label",
  "lighting": "Natural lighting — phone camera HDR, daylight from windows, warm ambient. NOT studio lighting",
  "background": "Background/environment details — must feel like a REAL lived-in space, not a 3D render",
  "environment_details": "Specific lived-in details and imperfections in the environment that make it feel real — e.g. phone charger on nightstand, half-drunk glass of water, slightly wrinkled fabric, visible power outlet, a bag on a chair",
  "camera": "Smartphone camera angle — selfie, tripod, or friend-holding-phone. Natural shallow depth of field",
  "final_prompt": "Complete combined prompt ready for image generation. MUST BEGIN with the exact character appearance description, then include: exact product description, scene details, lighting, camera, AND environment realism details. The photo must look like authentic UGC content shot on a phone by a content creator, NOT a professional photoshoot or stock photo."
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
        const enhancedPrompt = `${parsed.final_prompt}\n\n${NEGATIVE_BLOCK}`;
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
      if (selectedChar?.hero_image_url) imageInputs.push(selectedChar.hero_image_url);
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

  /* ── Step 1: Generate Prompts via Gemini (single call → 5 prompts) ─── */
  const generatePrompts = async () => {
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({ title: "Gemini API key belum di-setup", variant: "destructive" });
      return;
    }
    if (!productUrl || !selectedChar || !storyboardTemplate) return;

    const dna = productDNA || EMPTY_DNA;
    const beats = getStoryboardBeats(storyboardTemplate);
    const templateObj = CONTENT_TEMPLATES.find((t) => t.key === storyboardTemplate);
    const characterIdentity = selectedChar.identity_prompt || selectedChar.description;
    const consistencyBlock = buildProductConsistencyBlock(dna);

    setPromptsLoading(true);
    setGeneratedPrompts([]);
    setShotStatuses(beats.map(() => ({ state: "pending" as const })));

    try {
      const geminiParts: any[] = [];

      const charRefUrl = selectedChar?.hero_image_url || selectedChar?.reference_photo_url;
      if (charRefUrl) {
        try {
          const charBase64 = await imageUrlToBase64(charRefUrl);
          geminiParts.push({ inlineData: { mimeType: "image/jpeg", data: charBase64 } });
          geminiParts.push({ text: "CHARACTER REFERENCE — recreate this EXACT person in all frames." });
        } catch (e) { console.warn("Failed char image b64", e); }
      }

      try {
        const productBase64 = await imageUrlToBase64(productUrl!);
        geminiParts.push({ inlineData: { mimeType: "image/jpeg", data: productBase64 } });
        geminiParts.push({ text: "PRODUCT REFERENCE — match this exact product." });
      } catch (e) { console.warn("Failed product image b64", e); }

      const envOption = findOption(envOptions, background);
      const bgRich = background === "Custom" ? customBg : (envOption?.description || background || "not specified");

      const beatsDesc = beats.map((b, i) =>
        `Frame ${i + 1}: [${b.storyRole}] "${b.label}" — ${b.description}${b.constraints?.noProductUsage ? " (⚠️ NO product usage shown yet)" : ""}`
      ).join("\n");

      geminiParts.push({ text: `You are a UGC storyboard prompt expert. Generate ${beats.length} image prompts for a TikTok UGC storyboard.

Template: "${templateObj?.label || storyboardTemplate}"
Character: ${selectedChar!.name} — ${characterIdentity}
Product: ${dna.category}/${dna.sub_category} — ${dna.product_description}
${consistencyBlock}
Environment: ${bgRich}

NARRATIVE BEATS:
${beatsDesc}

RULES:
- Each prompt is a COMPLETE image generation prompt — character appearance, product, scene, lighting, camera
- Frame 1 is the ESTABLISHING shot — describe character and environment in full detail
- Frames 2-${beats.length} MUST reference "same person, same outfit, same room" for consistency
- Realistic skin, natural pores, phone camera quality, UGC style
- No cartoon, no CGI, no 3D render, no watermark
- Prompts should be 80-150 words each
- Add "No cartoon, no anime, no CGI, no 3D render, no plastic skin, no watermark, no text overlay." at the end of each prompt

Return a JSON array of ${beats.length} prompt strings. Example:
["prompt for frame 1", "prompt for frame 2", ...]

Output ONLY the JSON array. No explanation.` });

      const genConfig: Record<string, any> = {};
      if (promptModel !== "gemini-3.1-pro-preview") {
        genConfig.responseMimeType = "application/json";
      }

      const json = await geminiFetch(promptModel, geminiKey!, {
        contents: [{ parts: geminiParts }],
        generationConfig: genConfig,
      });

      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length < beats.length) {
        throw new Error("Invalid response — expected array of prompts");
      }

      const prompts = parsed.slice(0, beats.length).map((p: any) => String(p));
      setGeneratedPrompts(prompts);
      setShotStatuses(prompts.map((p: string) => ({ state: "prompt_ready" as const, prompt: p })));
      toast({ title: "Prompts siap!", description: `${prompts.length} prompt berhasil di-generate. Review & edit, lalu Generate.` });
    } catch (err: any) {
      console.error("Generate prompts error:", err);
      toast({ title: "Gagal generate prompts", description: err.message, variant: "destructive" });
      setShotStatuses([]);
    } finally {
      setPromptsLoading(false);
    }
  };

  /* ── Step 2: Generate single frame from prompt ─── */
  const generateSingleFrame = async (idx: number) => {
    if (!kieApiKey || keys.kie_ai.status !== "valid") {
      toast({ title: "Kie AI API key belum di-setup", variant: "destructive" });
      return;
    }
    const currentPrompt = generatedPrompts[idx];
    if (!currentPrompt) return;

    storyboardAbortRef.current = false;
    setShotStatuses((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], state: "generating", prompt: currentPrompt };
      return next;
    });

    try {
      const imageInputs: string[] = [];
      if (selectedChar?.reference_photo_url) imageInputs.push(selectedChar.reference_photo_url);
      if (selectedChar?.hero_image_url) imageInputs.push(selectedChar.hero_image_url);
      if (productUrl) imageInputs.push(productUrl);

      if (idx > 0) {
        const frame0Url = shotStatuses[0]?.imageUrl;
        if (frame0Url) imageInputs.unshift(frame0Url);
      }

      const imageUrl = await generateKieImage(
        kieApiKey,
        currentPrompt,
        imageInputs,
        () => storyboardAbortRef.current,
      );

      setShotStatuses((prev) => {
        const next = [...prev];
        next[idx] = { state: "completed", imageUrl, prompt: currentPrompt };
        return next;
      });

      await supabase.from("generations").insert({
        user_id: user!.id,
        type: "ugc_storyboard",
        prompt: currentPrompt,
        image_url: imageUrl,
        character_id: selectedChar?.id?.startsWith("p") ? null : selectedChar?.id || null,
        provider: "kie_ai",
        model: "nano-banana-pro",
        status: "completed",
        metadata: { productDNA: productDNA || null, template: storyboardTemplate, frameIndex: idx } as any,
      });
    } catch (err: any) {
      if (!storyboardAbortRef.current) {
        setShotStatuses((prev) => {
          const next = [...prev];
          next[idx] = { state: "failed", error: err.message, prompt: currentPrompt };
          return next;
        });
      }
    }
  };

  /* ── Generate All Frames sequentially ─── */
  const generateAllFrames = async () => {
    if (!kieApiKey || generatedPrompts.length === 0) return;

    storyboardAbortRef.current = false;
    setStoryboardActive(true);
    setStoryboardElapsed(0);
    storyboardTimerRef.current = setInterval(() => setStoryboardElapsed((p) => p + 1), 1000);

    for (let i = 0; i < generatedPrompts.length; i++) {
      if (storyboardAbortRef.current) break;
      if (shotStatuses[i]?.state === "completed") continue;
      await generateSingleFrame(i);
      if (i < generatedPrompts.length - 1 && !storyboardAbortRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (storyboardTimerRef.current) clearInterval(storyboardTimerRef.current);
    storyboardTimerRef.current = null;
    setStoryboardActive(false);
  };

  const cancelStoryboard = () => {
    storyboardAbortRef.current = true;
    if (storyboardTimerRef.current) clearInterval(storyboardTimerRef.current);
    storyboardTimerRef.current = null;
    setStoryboardActive(false);
  };

  const resetStoryboard = () => {
    setStoryboardActive(false);
    setShotStatuses([]);
    setGeneratedPrompts([]);
    setStoryboardElapsed(0);
  };

  const updatePromptText = (idx: number, text: string) => {
    setGeneratedPrompts((prev) => {
      const next = [...prev];
      next[idx] = text;
      return next;
    });
    setShotStatuses((prev) => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx], prompt: text };
      return next;
    });
  };

  // Computed
  const hasPrompts = generatedPrompts.length > 0;
  const completedShots = shotStatuses.filter((s) => s.state === "completed").length;
  const failedShots = shotStatuses.filter((s) => s.state === "failed").length;
  const totalShots = shotStatuses.length;
  const storyboardDone = totalShots > 0 && !storyboardActive && !promptsLoading && completedShots > 0 && (completedShots + failedShots === totalShots);
  const currentBeats = storyboardTemplate ? getStoryboardBeats(storyboardTemplate) : [];

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-48px)] lg:min-h-[calc(100dvh-0px)] -mx-4 -my-4 lg:-mx-6 lg:-my-8">
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

          {/* Pakai Foto Sendiri */}
          {!ownPhotoPreview ? (
            <button
              type="button"
              onClick={() => {
                const inp = document.createElement("input");
                inp.type = "file";
                inp.accept = "image/jpeg,image/png,image/webp";
                inp.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleOwnPhotoSelect(f);
                };
                inp.click();
              }}
              className="w-full border-2 border-dashed border-border rounded-xl p-4 bg-background hover:border-primary/30 transition-colors flex items-center gap-3 cursor-pointer mb-3"
            >
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Pakai Foto Sendiri</p>
                <p className="text-[11px] text-muted-foreground">Upload foto kamu — AI akan analisis & cocokkan</p>
              </div>
            </button>
          ) : (
            <div className="border border-border rounded-xl p-3 bg-card mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={ownPhotoPreview} alt="Foto sendiri" className="h-12 w-12 rounded-full object-cover shrink-0" />
                  {(ownPhotoUploading || ownPhotoAnalyzing) && (
                    <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {ownPhotoUploading ? (
                    <p className="text-xs text-muted-foreground">Mengupload foto...</p>
                  ) : ownPhotoAnalyzing ? (
                    <p className="text-xs text-muted-foreground">AI sedang menganalisis...</p>
                  ) : selectedChar?.id === "__own_photo__" ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">{selectedChar.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[selectedChar.type, selectedChar.age_range, selectedChar.style].filter(Boolean).join(" • ")}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Foto terupload</p>
                  )}
                </div>
                <button onClick={removeOwnPhoto} className="p-1 rounded-md hover:bg-secondary transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">atau pilih karakter</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Select value={selectedCharId === "__own_photo__" ? "" : selectedCharId} onValueChange={onCharSelect}>
            <SelectTrigger className="bg-[hsl(0_0%_10%)] border-border">
              <SelectValue placeholder="Pilih karakter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Preset</SelectLabel>
                {PRESETS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.hero_image_url ? (
                        <img src={c.hero_image_url} alt={c.name} className="h-5 w-5 rounded-full object-cover shrink-0" />
                      ) : (
                        <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
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

        {/* Pilih Gaya Konten (Template) */}
        <div className="animate-fade-up" style={{ animationDelay: "175ms" }}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium block mb-2.5">Pilih Gaya Konten</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CONTENT_TEMPLATES.map((t) => {
              const isSelected = storyboardTemplate === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setStoryboardTemplate(t.key)}
                  className={`text-left rounded-lg px-3 py-2.5 transition-all ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/10"
                      : "bg-card border border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <p className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{t.label}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{t.desc}</p>
                </button>
              );
            })}
          </div>
          {/* Beat preview */}
          {storyboardTemplate && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {currentBeats.map((beat, i) => (
                <div key={i} className="shrink-0 w-[90px] border border-border rounded-lg p-1.5 bg-muted/10">
                  <span className={`text-[7px] px-1 py-0.5 rounded-full font-medium ${getStoryRoleColor(beat.storyRole, i)}`}>
                    {beat.storyRole}
                  </span>
                  <p className="text-[9px] font-semibold text-foreground mt-0.5 truncate">{beat.label}</p>
                  <p className="text-[7px] text-muted-foreground line-clamp-2 mt-0.5">{beat.description}</p>
                </div>
              ))}
            </div>
          )}
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

        {/* Generate Prompts */}
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          {!hasPrompts && (
            <div className="flex items-start gap-2 bg-card border border-border rounded-lg p-3 mb-4">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Step 1: Generate prompts, review & edit. Step 2: Generate gambar per frame.</p>
              </div>
            </div>
          )}
          <button
            onClick={generatePrompts}
            disabled={!productUrl || !selectedChar || !storyboardTemplate || promptsLoading || storyboardActive}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40 animate-cta-glow disabled:animate-none"
          >
            {promptsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {promptsLoading ? "Generating Prompts..." : hasPrompts ? "Regenerate Prompts" : "Generate Prompts"}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[45%] bg-[hsl(0_0%_5%)] border-t lg:border-t-0 lg:border-l border-border flex flex-col items-start justify-start p-6 lg:p-8 min-h-[400px] lg:min-h-0 overflow-y-auto">

        {/* State A: Empty — no prompts yet */}
        {!hasPrompts && !promptsLoading && (
          <div className="flex flex-col items-center text-center w-full animate-fade-in mt-8">
            <Film className="h-16 w-16 text-foreground/10 mb-4" />
            <p className="text-sm text-muted-foreground">Storyboard akan muncul di sini</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Upload produk, pilih karakter & template, lalu Generate Prompts</p>
            {storyboardTemplate && (
              <div className="mt-6 w-full">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2 text-left">Preview Beats — {CONTENT_TEMPLATES.find(t => t.key === storyboardTemplate)?.label}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {currentBeats.map((beat, i) => (
                    <div key={i} className="border border-border rounded-lg p-1.5 bg-muted/10">
                      <span className={`text-[7px] px-1 py-0.5 rounded-full font-medium ${getStoryRoleColor(beat.storyRole, i)}`}>
                        {beat.storyRole}
                      </span>
                      <p className="text-[8px] font-semibold text-foreground mt-0.5 truncate">{beat.label}</p>
                      <p className="text-[7px] text-muted-foreground line-clamp-2 mt-0.5">{beat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading prompts */}
        {promptsLoading && (
          <div className="flex flex-col items-center text-center w-full animate-fade-in mt-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Generating prompts...</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Gemini sedang membuat {currentBeats.length} prompt untuk storyboard</p>
          </div>
        )}

        {/* State B: Prompts ready — editable cards with per-frame Generate */}
        {hasPrompts && !promptsLoading && (
          <div className="w-full space-y-4 animate-fade-in">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                {storyboardDone ? (
                  <><CheckCircle2 className="inline h-3.5 w-3.5 text-green-500 mr-1" />{completedShots} selesai{failedShots > 0 && <> • <XCircle className="inline h-3.5 w-3.5 text-destructive mr-1" />{failedShots} gagal</>}</>
                ) : storyboardActive ? (
                  <>Generating... <span className="text-primary">({completedShots}/{totalShots})</span></>
                ) : (
                  <>Review & Edit Prompts ({generatedPrompts.length} beats)</>
                )}
              </p>
              <div className="flex items-center gap-2">
                {storyboardActive && (
                  <>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {Math.floor(storyboardElapsed / 60)}:{String(storyboardElapsed % 60).padStart(2, "0")}
                    </span>
                    <button onClick={cancelStoryboard} className="text-[10px] text-destructive hover:underline">Cancel</button>
                  </>
                )}
                {!storyboardActive && !storyboardDone && (
                  <button
                    onClick={generateAllFrames}
                    disabled={!kieApiKey || storyboardActive}
                    className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <Film className="h-3 w-3" /> Generate All
                  </button>
                )}
              </div>
            </div>

            {/* Prompt cards — vertical list */}
            <div className="space-y-3">
              {generatedPrompts.map((promptText, i) => {
                const beat = currentBeats[i];
                const shot = shotStatuses[i];
                const isGenerating = shot?.state === "generating";
                const isCompleted = shot?.state === "completed";
                const isFailed = shot?.state === "failed";

                return (
                  <div key={i} className={`border rounded-lg p-3 transition-all ${
                    isCompleted ? "border-green-500/30 bg-green-500/5" :
                    isFailed ? "border-destructive/30 bg-destructive/5" :
                    isGenerating ? "border-primary/30 bg-primary/5" :
                    "border-border bg-card"
                  }`}>
                    {/* Header: badge + status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
                        {beat && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getStoryRoleColor(beat.storyRole, i)}`}>
                            {beat.storyRole}
                          </span>
                        )}
                        <span className="text-[10px] text-foreground font-medium">{beat?.label || `Frame ${i + 1}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        {isFailed && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        {isGenerating && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
                      </div>
                    </div>

                    {/* Completed image thumbnail */}
                    {isCompleted && shot.imageUrl && (
                      <div className="mb-2 flex items-start gap-2">
                        <img src={shot.imageUrl} alt={beat?.label} className="h-20 w-15 rounded-md object-cover border border-border" />
                        <div className="flex flex-col gap-1">
                          <a href={shot.imageUrl} download target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary hover:underline flex items-center gap-1">
                            <Download className="h-3 w-3" /> Download
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Editable prompt textarea */}
                    <Textarea
                      value={promptText}
                      onChange={(e) => updatePromptText(i, e.target.value)}
                      disabled={isGenerating || storyboardActive}
                      className="text-[11px] min-h-[60px] bg-background/50 border-border/50 resize-y"
                      rows={3}
                    />

                    {/* Per-frame generate button */}
                    {!isGenerating && !storyboardActive && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => generateSingleFrame(i)}
                          disabled={!kieApiKey || isGenerating}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
                            isCompleted
                              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {isCompleted ? <RefreshCw className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                          {isCompleted ? "Regenerate" : "Generate Frame"}
                        </button>
                        {isFailed && shot.error && (
                          <span className="text-[9px] text-destructive">{shot.error}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions after all frames done */}
            {storyboardDone && (
              <div className="space-y-2 pt-2">
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
                        sourceImage: storyboardImgs[0] || null,
                        baseImageUrl: storyboardImgs[0] || null,
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
                  <RefreshCw className="h-3 w-3" /> Mulai Ulang
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratePage;
