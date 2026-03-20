import { sanitizeForPrompt } from "@/lib/utils";
import { SKIN_BLOCK, QUALITY_BLOCK, NEGATIVE_BLOCK, ENV_REALISM_BLOCK, UGC_STYLE_BLOCK } from "@/lib/prompt-blocks";
import type { GenState, ShotStatus } from "@/lib/generate-types";
import ProductUploadStep from "@/components/generate/ProductUploadStep";
import CharacterSelectStep from "@/components/generate/CharacterSelectStep";
import TemplateSelectStep from "@/components/generate/TemplateSelectStep";
import SceneSettingsStep from "@/components/generate/SceneSettingsStep";
import StoryboardPanel from "@/components/generate/StoryboardPanel";
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
import { getEnvironments, getPoses, getMoods, findOption } from "@/lib/category-options";
import { CONTENT_TEMPLATES, type ContentTemplateKey } from "@/lib/content-templates";
import { getStoryboardBeats } from "@/lib/storyboard-angles";
import {
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useUpscale } from "@/hooks/useUpscale";
import { useToast } from "@/hooks/use-toast";
import UpscaleButton from "@/components/UpscaleButton";
import GenerationLoading from "@/components/GenerationLoading";

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

/* Realism blocks imported from @/lib/prompt-blocks */

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

/* GenState & ShotStatus imported from @/lib/generate-types */

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
  const prevTemplateRef = useRef<ContentTemplateKey>("problem_solution");
  const pendingTemplateRef = useRef<ContentTemplateKey | null>(null);
  const [templateChangeOpen, setTemplateChangeOpen] = useState(false);
  const [regenAfterTemplateChange, setRegenAfterTemplateChange] = useState(0);
  const [storyboardActive, setStoryboardActive] = useState(false);
  const [shotStatuses, setShotStatuses] = useState<ShotStatus[]>([]);
  const [storyboardElapsed, setStoryboardElapsed] = useState(0);
  const storyboardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storyboardAbortRef = useRef(false);

  // Prompt-first state
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dnaExpanded, setDnaExpanded] = useState(false);

  // Auto-regenerate after template change confirmation
  useEffect(() => {
    if (regenAfterTemplateChange > 0) {
      generatePrompts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenAfterTemplateChange]);

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
            })),
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
        contents: [
          {
            parts: [
              { inlineData: { mimeType: file.type || "image/jpeg", data: base64 } },
              {
                text: `You are a casting director writing notes to find a photo double for this exact person. The identity_prompt must be detailed enough that a DIFFERENT AI system can generate images of this SAME person and they would be recognizable.

Return JSON only:
{
  "name": "2-3 word Indonesian descriptor based on their vibe (e.g. 'Hijab Casual', 'Cowok Gym', 'Ibu Muda')",
  "gender": "Pria or Wanita",
  "age_range": "estimated range like 25-30",
  "style": "one word: Modern, Casual, Sporty, Elegant, Professional, Edgy",
  "identity_prompt": "Casting notes for this EXACT person — not an idealized version: Ethnicity/heritage appearance. Skin undertone (warm olive / cool beige / medium brown / deep brown / fair pink). Face shape (oval/round/square/heart) and distinctive features (high cheekbones, wide-set eyes, dimples, mole placement). Eyes (shape, single/double eyelid). Hair (exact color, approximate length, texture straight/wavy/curly, current style). Body build (petite/slim/average/athletic/curvy). Current outfit visible in photo. Do NOT beautify — describe exactly what you see."
}`,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      });
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
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
      toast({
        title: `Produk terdeteksi: ${dna.category}/${dna.sub_category}`,
        description: dna.product_description.slice(0, 80),
      });
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
      toast({
        title: "Gemini API key belum di-setup",
        description: "Buka Settings untuk setup API key.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedChar) {
      toast({ title: "Pilih karakter dulu", variant: "destructive" });
      return;
    }
    setGeneratingPrompt(true);
    try {
      const envOption = findOption(envOptions, background);
      const bgRich = background === "Custom" ? sanitizeForPrompt(customBg) : envOption?.description || background;
      const poseOption = findOption(poseOptions, pose);
      const poseRich = poseOption?.description || pose;
      const moodOption = findOption(moodOptions, mood);
      const moodRich = moodOption?.description || mood;
      const characterIdentity = sanitizeForPrompt(selectedChar.identity_prompt || selectedChar.description);

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
          parts.push({
            text: "This is the CHARACTER reference image. Describe this EXACT person's appearance in your prompt — their face, skin tone, hair, body type, ethnicity, and any distinctive features. The final prompt MUST recreate this exact person.",
          });
        } catch (e) {
          console.warn("Failed to convert character hero image to base64:", e);
        }
      }
      if (selectedChar.reference_photo_url && selectedChar.reference_photo_url !== selectedChar.hero_image_url) {
        try {
          const refBase64 = await imageUrlToBase64(selectedChar.reference_photo_url);
          parts.push({ inlineData: { mimeType: "image/jpeg", data: refBase64 } });
          parts.push({
            text: "This is an additional CHARACTER reference photo. Use it together with the previous image to accurately describe this person.",
          });
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
        const cleaned = rawText
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
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

        if (
          productDNA &&
          parsed.product_description &&
          parsed.product_description.length > (productDNA.product_description?.length || 0)
        ) {
          setProductDNA((prev) => (prev ? { ...prev, product_description: parsed.product_description } : prev));
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
      toast({
        title: "Kie AI API key belum di-setup",
        description: "Buka Settings untuk setup API key.",
        variant: "destructive",
      });
      return;
    }
    if (!geminiKey || keys.gemini.status !== "valid") {
      toast({
        title: "Gemini API key belum di-setup",
        description: "Buka Settings untuk setup API key.",
        variant: "destructive",
      });
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
      // Collect character reference images — prioritize multi-angle shots
      const shotMeta = (selectedChar as any)?.shot_metadata;
      if (shotMeta && typeof shotMeta === "object") {
        const priorityKeys = ["hero_portrait", "neutral_identity", "profile_45"];
        for (const key of priorityKeys) {
          if (shotMeta[key]?.url) imageInputs.push(shotMeta[key].url);
        }
      }
      // Fallback if no shot_metadata
      if (imageInputs.length === 0) {
        if (selectedChar?.hero_image_url) imageInputs.push(selectedChar.hero_image_url);
        if (selectedChar?.reference_photo_url && selectedChar.reference_photo_url !== selectedChar.hero_image_url) {
          imageInputs.push(selectedChar.reference_photo_url);
        }
      }
      if (productUrl) imageInputs.push(productUrl);

      const imageUrl = await generateKieImage(kieApiKey, prompt, imageInputs, () => abortRef.current);
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
    const characterIdentity = sanitizeForPrompt(selectedChar.identity_prompt || selectedChar.description);
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
        } catch (e) {
          console.warn("Failed char image b64", e);
        }
      }

      try {
        const productBase64 = await imageUrlToBase64(productUrl!);
        geminiParts.push({ inlineData: { mimeType: "image/jpeg", data: productBase64 } });
        geminiParts.push({ text: "PRODUCT REFERENCE — match this exact product." });
      } catch (e) {
        console.warn("Failed product image b64", e);
      }

      const envOption = findOption(envOptions, background);
      const bgRich = background === "Custom" ? customBg : envOption?.description || background || "not specified";

      const beatsDesc = beats
        .map(
          (b, i) =>
            `Frame ${i + 1}: [${b.storyRole}] "${b.label}" — ${b.description}${b.constraints?.noProductUsage ? " (⚠️ NO product usage shown yet)" : ""}`,
        )
        .join("\n");

      geminiParts.push({
        text: `You are a UGC storyboard prompt expert. Generate ${beats.length} image prompts for a TikTok UGC storyboard.

Template: "${templateObj?.label || storyboardTemplate}"
Character: ${selectedChar!.name} — ${characterIdentity}
Product: ${dna.category}/${dna.sub_category} — ${dna.product_description}
${consistencyBlock}
Environment: ${bgRich}

NARRATIVE BEATS:
${beatsDesc}

RULES:
- Each prompt is a COMPLETE image generation prompt — character appearance, product, scene, lighting, camera
- Frame 1: describe character and environment in full detail
- Frames 2-${beats.length}: reference "same person, same outfit, same room"
- Each frame uses a DIFFERENT camera angle (selfie, medium, POV, close-up, hero shot)
- Prompts should be 60-90 words each — concise and focused
- Do NOT add negative prompts — they will be appended separately
- Photorealistic, UGC style, phone camera quality

Return a JSON array of ${beats.length} prompt strings. Example:
["prompt for frame 1", "prompt for frame 2", ...]

Output ONLY the JSON array. No explanation.`,
      });

      const genConfig: Record<string, any> = {};
      if (promptModel !== "gemini-3.1-pro-preview") {
        genConfig.responseMimeType = "application/json";
      }

      const json = await geminiFetch(promptModel, geminiKey!, {
        contents: [{ parts: geminiParts }],
        generationConfig: genConfig,
      });

      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length < beats.length) {
        throw new Error("Invalid response — expected array of prompts");
      }

      const prompts = parsed.slice(0, beats.length).map((p: any) => String(p));
      setGeneratedPrompts(prompts);
      setShotStatuses(prompts.map((p: string) => ({ state: "prompt_ready" as const, prompt: p })));
      toast({
        title: "Prompts siap!",
        description: `${prompts.length} prompt berhasil di-generate. Review & edit, lalu Generate.`,
      });
      prevTemplateRef.current = storyboardTemplate;
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

      const enhancedFramePrompt = `${currentPrompt}\n\n${SKIN_BLOCK}\n\n${QUALITY_BLOCK}\n\n${NEGATIVE_BLOCK}`;
      const imageUrl = await generateKieImage(
        kieApiKey,
        enhancedFramePrompt,
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
  const storyboardDone =
    totalShots > 0 &&
    !storyboardActive &&
    !promptsLoading &&
    completedShots > 0 &&
    completedShots + failedShots === totalShots;
  const currentBeats = storyboardTemplate ? getStoryboardBeats(storyboardTemplate) : [];

  /* ── helpers for step indicators ──────────────────────────── */
  const stepDone = (n: number) => {
    if (n === 1) return !!productUrl;
    if (n === 2) return !!selectedChar;
    if (n === 3) return !!storyboardTemplate;
    if (n === 4) return !!background;
    return false;
  };

  const StepLabel = ({ num, label }: { num: number; label: string }) => (
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`flex items-center gap-2 border-l-[3px] pl-3 py-0.5 ${stepDone(num) ? "border-primary" : "border-white/[0.06]"}`}
      >
        <span
          className={`text-[10px] font-mono font-bold ${stepDone(num) ? "text-primary" : "text-muted-foreground/25"}`}
        >
          {String(num).padStart(2, "0")}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/30">{label}</span>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-48px)] lg:min-h-[calc(100dvh-0px)] -mx-4 -my-4 lg:-mx-6 lg:-my-8">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[55%] overflow-y-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase text-foreground">Generate Gambar</h1>
          <p className="text-xs text-muted-foreground/50 mt-1">Buat konten UGC realistis dengan AI</p>
        </div>

        {/* Step 01 — Upload Produk */}
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <StepLabel num={1} label="Upload Produk" />
          <ProductUploadStep
            productPreview={productPreview}
            productUrl={productUrl}
            productDNA={productDNA}
            detectingDNA={detectingDNA}
            uploading={uploading}
            dnaExpanded={dnaExpanded}
            setDnaExpanded={setDnaExpanded}
            setProductDNA={setProductDNA}
            handleFileSelect={handleFileSelect}
            removeProduct={removeProduct}
            onDrop={onDrop}
          />
        </div>

        {/* Step 02 — Pilih Karakter */}
        <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
          <StepLabel num={2} label="Pilih Karakter" />

          <CharacterSelectStep
            selectedCharId={selectedCharId}
            selectedChar={selectedChar}
            customChars={customChars}
            ownPhotoPreview={ownPhotoPreview}
            ownPhotoUploading={ownPhotoUploading}
            ownPhotoAnalyzing={ownPhotoAnalyzing}
            onCharSelect={onCharSelect}
            handleOwnPhotoSelect={handleOwnPhotoSelect}
            removeOwnPhoto={removeOwnPhoto}
            navigate={navigate}
          />
        </div>

        {/* Step 03 — Pilih Gaya Konten */}
        <div className="animate-fade-up" style={{ animationDelay: "175ms" }}>
          <StepLabel num={3} label="Content Template" />
          <TemplateSelectStep
            storyboardTemplate={storyboardTemplate}
            productCategory={productDNA?.category}
            hasPrompts={hasPrompts}
            onSelect={(key) => setStoryboardTemplate(key)}
            onConfirmChange={(key) => {
              pendingTemplateRef.current = key;
              setTemplateChangeOpen(true);
            }}
          />
        </div>

        {/* Step 04 — Scene Settings */}
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <StepLabel num={4} label="Scene Settings" />
          <SceneSettingsStep
            background={background}
            setBackground={setBackground}
            customBg={customBg}
            setCustomBg={setCustomBg}
            pose={pose}
            setPose={setPose}
            mood={mood}
            setMood={setMood}
            envOptions={envOptions}
            poseOptions={poseOptions}
            moodOptions={moodOptions}
            advancedOpen={advancedOpen}
            setAdvancedOpen={setAdvancedOpen}
          />
        </div>

        {/* Generate Prompts CTA */}
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          {!hasPrompts && (
            <div className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 mb-4">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground/40">
                  Step 1: Generate prompts, review & edit. Step 2: Generate gambar per frame.
                </p>
              </div>
            </div>
          )}
          <button
            onClick={generatePrompts}
            disabled={!productUrl || !selectedChar || !storyboardTemplate || promptsLoading || storyboardActive}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.3)] hover:-translate-y-0.5"
          >
            {promptsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {promptsLoading ? "Generating prompts..." : hasPrompts ? "Regenerate prompts" : "Generate prompts"}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[45%] bg-white/[0.015] border-t lg:border-t-0 lg:border-l border-white/[0.04] flex flex-col items-start justify-start p-6 lg:p-8 min-h-[400px] lg:min-h-0 overflow-y-auto">
        <StoryboardPanel
          hasPrompts={hasPrompts}
          promptsLoading={promptsLoading}
          storyboardActive={storyboardActive}
          storyboardTemplate={storyboardTemplate}
          currentBeats={currentBeats}
          generatedPrompts={generatedPrompts}
          shotStatuses={shotStatuses}
          storyboardElapsed={storyboardElapsed}
          completedShots={completedShots}
          failedShots={failedShots}
          totalShots={totalShots}
          storyboardDone={storyboardDone}
          selectedChar={selectedChar}
          productDNA={productDNA}
          updatePromptText={updatePromptText}
          generateSingleFrame={generateSingleFrame}
          generateAllFrames={generateAllFrames}
          cancelStoryboard={cancelStoryboard}
          resetStoryboard={resetStoryboard}
          navigate={navigate}
          kieApiKey={kieApiKey}
        />
      </div>
      {/* Template change confirmation dialog */}
      <AlertDialog open={templateChangeOpen} onOpenChange={setTemplateChangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will regenerate all prompts. Any edits you made will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                pendingTemplateRef.current = null;
              }}
            >
              Keep current
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingTemplateRef.current) {
                  setStoryboardTemplate(pendingTemplateRef.current);
                  pendingTemplateRef.current = null;
                }
                setRegenAfterTemplateChange((c) => c + 1);
              }}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GeneratePage;
