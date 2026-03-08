import { useState, useRef } from "react";
import { geminiFetch } from "@/lib/gemini-fetch";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useUpscale } from "@/hooks/useUpscale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Camera, RotateCcw, Mic, PersonStanding, Search, Hand,
  Zap, CheckCircle2, Loader2, AlertCircle, X, Download, Upload, ImageIcon,
  Sparkles,
} from "lucide-react";
import UpscaleButton from "@/components/UpscaleButton";
import {
  VIBE_PACKS,
  IMPERFECTION_LEVELS,
  ENVIRONMENT_DETAILS,
  MICRO_DETAIL_LEVELS,
  BODY_TYPES,
  AGE_RANGES,
  type VibePack,
} from "@/lib/character-vibes";

// ── TYPES ──
type Gender = "female" | "male";

interface FormData {
  name: string;
  gender: Gender;
  age_range: string;
  skin_tone: string;
  face_shape: string;
  eye_color: string;
  hair_style: string;
  hair_color: string;
  expression: string;
  outfit_style: string;
  skin_condition: string;
  custom_notes: string;
  // New advanced fields
  imperfection: string;
  environment: string;
  microDetail: string;
  bodyType: string;
  ageRangeNew: string;
}

type ShotKey = "hero_portrait" | "profile_3_4" | "talking" | "full_body" | "skin_detail" | "product_interaction";
type ShotStatus = "idle" | "generating" | "success" | "failed";

interface ShotResult {
  status: ShotStatus;
  url?: string;
  taskId?: string;
  model: string;
}

// ── GENBOX PROMPT SYSTEM CONSTANTS ──

const QUALITY_BLOCK = "Ultra-realistic photographic portrait, 8K resolution, photographic realism, natural shallow depth of field, tack-sharp focus on subject, natural color grading with warm tones complementing Southeast Asian skin, realistic contrast.";

const NEGATIVE_BLOCK = "No cartoon, no anime, no CGI, no 3D render, no over-smoothing, no glamour filter, no artificial glow, no fantasy lighting, no neon, no watermark, no text overlay, no distorted features, no extra fingers, no warped proportions, no game engine look, no hyper-saturated colors.";

const FACIAL_REALISM_BLOCK = "Face must have slight natural asymmetry — one eye marginally narrower, subtle lip unevenness, natural brow variation. Expression should have micro-tension — not a perfectly relaxed or perfectly smiling face, but the natural in-between states real faces hold. Avoid: perfectly symmetrical features, identical eye shapes, unnaturally even smile, doll-like proportions. NOTE: If a reference photo is provided, prioritize matching the reference face over these general asymmetry guidelines.";

const HAIR_GROOMING_BLOCK = "Hair should look casually groomed — brushed and shaped with controlled volume and natural movement, as if the person prepared before filming but didn't visit a salon. Good: soft straight hair tucked behind ear, loose controlled waves, low ponytail, half-tied hair, light blow-dry look. Avoid: messy unbrushed bed-hair, frizzy uncontrolled volume, AND also avoid editorial salon-perfect styling. Hair should signal 'I look presentable for camera' — not 'I just woke up' and not 'I came from a photoshoot.'";

// ── Dynamic skin block based on imperfection level ──
function getSkinBlock(imperfection: string): string {
  switch (imperfection) {
    case "perfect":
      return "Skin is clean, breathable, and healthy. Balanced complexion with natural warmth. Minimal natural makeup. No exaggerated texture, no gritty detail, no beauty filter smoothing. Skin looks real but flattering.";
    case "very_natural":
      return "Skin shows real human texture — visible pores under close inspection, possible small moles or beauty marks, light natural undereye circles, minor tone variation. Minimal or no makeup. No editorial beauty realism exaggeration. Skin looks healthy and real.";
    case "raw":
      return "Highly realistic skin — clearly visible pores, minor blemishes, possible acne marks, natural undereye circles, uneven skin tone areas. No makeup. Raw candid photography feel. Real, imperfect, human.";
    default: // "natural"
      return "Skin is clean, breathable, and healthy with soft visible texture under good lighting. Balanced complexion with gentle natural variation. Slight natural oil sheen on T-zone. Minimal makeup: soft base, subtle lip tint. No hyper-textured skin, no over-sharpened pores, no beauty filter. Think: real person who takes care of their skin.";
  }
}

// ── Dynamic lighting block based on environment ──
function getLightingBlock(environment: string): string {
  switch (environment) {
    case "indoor_home":
      return "Warm natural indoor lighting — mix of window daylight and warm room lights, soft natural shadows, cozy warm color temperature. Natural light falloff from windows. Lighting must keep face clearly visible.";
    case "indoor_cafe":
      return "Warm ambient cafe lighting — pendant lights overhead, warm tungsten tones, soft mixed lighting from windows and interior lights. Natural shadow direction.";
    case "outdoor_urban":
      return "Natural outdoor daylight — warm overcast or golden hour light, natural shadows from surroundings, ambient light bounce.";
    case "outdoor_nature":
      return "Natural outdoor light — soft diffused daylight, warm golden tones, natural dappled light through trees.";
    default: // "simple" or "studio"
      return "Professional studio lighting setup: soft key light from 45 degrees creating gentle modeling on the face, fill light reducing harsh shadows, subtle rim light separating subject from background. Warm neutral tones that complement Southeast Asian skin. No harsh directional shadows, no artificial color cast. Clean, professional, flattering but natural.";
  }
}

// ── SKIN TONE PROMPT MAPPING ──
const SKIN_TONE_PROMPTS: Record<string, string> = {
  "Kuning Langsat": "light warm golden-tan Southeast Asian skin",
  "Sawo Terang": "warm light-brown Southeast Asian complexion",
  "Sawo Matang": "warm medium-brown Indonesian skin tone",
  "Sawo Gelap": "rich warm brown Southeast Asian complexion",
  "Coklat Gelap": "deep warm dark-brown Indonesian skin",
};

// ── CONSTANTS ──
const SKIN_TONES = [
  { label: "Kuning Langsat", hex: "#F5D5B8" },
  { label: "Sawo Terang", hex: "#D4A574" },
  { label: "Sawo Matang", hex: "#B8885C" },
  { label: "Sawo Gelap", hex: "#8B6342" },
  { label: "Coklat Gelap", hex: "#5C3A1E" },
];

const HAIR_STYLES: Record<Gender, string[]> = {
  female: ["Hijab Modern", "Hijab Syar'i", "Lurus Panjang", "Bob Pendek", "Wavy Natural", "Ponytail Rapi", "Bun/Cepol Rapi"],
  male: ["Pendek Rapi", "Undercut", "Side Part", "Messy Textured", "Buzz Cut"],
};

const SHOT_CONFIGS: Record<ShotKey, { label: string; model: string; camera: string; framing: string; icon: typeof Camera }> = {
  hero_portrait: {
    label: "Hero Portrait", model: "nano-banana-pro",
    camera: "Shot on a full-frame mirrorless camera, 50mm lens, f/2.0 aperture, shallow depth of field, tack-sharp focus on face.",
    framing: "Chest-up centered portrait, facing directly toward camera, making warm direct eye contact. Expression is a genuine warm smile — friendly, approachable, and confident, like a brand ambassador introduction photo. Posture is upright and natural, shoulders relaxed. Background is a smooth soft grey studio gradient, clean and distraction-free.",
    icon: Camera,
  },
  profile_3_4: {
    label: "3/4 Profile", model: "nano-banana-2",
    camera: "Shot on a full-frame mirrorless camera, 50mm lens, f/2.8 aperture, shallow depth of field.",
    framing: "Head and shoulders, turned 45 degrees to the right, looking slightly past camera. Expression is calm, natural, thoughtful. Background is a smooth soft grey studio gradient, same as hero shot.",
    icon: RotateCcw,
  },
  talking: {
    label: "Talking", model: "nano-banana-2",
    camera: "Shot on a full-frame mirrorless camera, 50mm lens, f/2.8 aperture.",
    framing: "Chest-up direct angle, making direct eye contact. Expression is mid-sentence, mouth slightly open, animated, conversational — like speaking to camera in a product review. Background is the same smooth soft grey studio gradient.",
    icon: Mic,
  },
  full_body: {
    label: "Full Body", model: "nano-banana-2",
    camera: "Shot on a full-frame mirrorless camera, 35mm lens, f/2.8 aperture, full body in focus, natural perspective.",
    framing: "Full body standing shot, head to toe visible. Relaxed natural posture, hands visible — relaxed at sides or one in pocket. Direct eye contact, relaxed expression. Background is the same smooth soft grey studio gradient, slightly wider.",
    icon: PersonStanding,
  },
  skin_detail: {
    label: "Skin Detail", model: "nano-banana-pro",
    camera: "Shot on a full-frame mirrorless camera, 85mm portrait lens, f/2.4 aperture, extreme close-up, face fills entire frame.",
    framing: "Face filling the entire frame from forehead to chin. Direct calm gaze, neutral relaxed expression. Background is completely blurred out of focus. Focus on realistic skin texture, pore detail, natural skin quality.",
    icon: Search,
  },
  product_interaction: {
    label: "Product", model: "nano-banana-2",
    camera: "Shot on a full-frame mirrorless camera, 50mm lens, f/2.8 aperture, sharp focus on face and hands.",
    framing: "Chest-up with hands visible in frame, holding a generic small product (bottle or box shape). Natural engaged expression, looking at product or toward camera. Background is the same smooth soft grey studio gradient.",
    icon: Hand,
  },
};

const SHOT_KEYS: ShotKey[] = ["hero_portrait", "profile_3_4", "talking", "full_body", "skin_detail", "product_interaction"];
const REMAINING_KEYS: ShotKey[] = ["profile_3_4", "talking", "full_body", "skin_detail", "product_interaction"];

const DEFAULT_FORM: FormData = {
  name: "", gender: "female", age_range: "", skin_tone: "Sawo Terang",
  face_shape: "", eye_color: "", hair_style: "", hair_color: "",
  expression: "", outfit_style: "", skin_condition: "", custom_notes: "",
  imperfection: "natural", environment: "simple", microDetail: "standard",
  bodyType: "average", ageRangeNew: "young_adult",
};

import { imageUrlToBase64 } from "@/lib/image-utils";

// ── HELPER: Assemble prompt for a shot ──
function assemblePrompt(
  shotKey: ShotKey,
  identityBlock: string,
  consistencyAnchors: string[],
  options?: { imperfection?: string; environment?: string; advancedContext?: string },
) {
  const cfg = SHOT_CONFIGS[shotKey];
  const imperfection = options?.imperfection || "natural";
  const environment = options?.environment || "simple";
  const parts = [
    QUALITY_BLOCK,
    cfg.camera,
    identityBlock,
    `MANDATORY consistency anchors: ${consistencyAnchors.join(", ")}`,
    FACIAL_REALISM_BLOCK,
    HAIR_GROOMING_BLOCK,
  ];
  if (options?.advancedContext) parts.push(options.advancedContext);
  parts.push(cfg.framing);
  parts.push(getLightingBlock(environment));
  parts.push(getSkinBlock(imperfection));
  parts.push(NEGATIVE_BLOCK);
  return parts.join("\n\n");
}

// ── HELPER: Poll a Kie AI task ──
async function pollTask(taskId: string, kieApiKey: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${kieApiKey}` },
    });
    const json = await res.json();
    const state = json?.data?.state;
    if (state === "success") {
      try {
        const resultJson = JSON.parse(json.data.resultJson);
        return resultJson?.resultUrls?.[0] || resultJson?.url || "";
      } catch { return ""; }
    }
    if (state === "fail") throw new Error("Generation failed");
  }
  throw new Error("Timeout");
}

// ── HELPER: Build extra prompt context from advanced fields ──
function buildAdvancedContext(form: FormData): string {
  const parts: string[] = [];
  const imp = IMPERFECTION_LEVELS.find((l) => l.value === form.imperfection);
  if (imp?.prompt) parts.push(`Skin imperfection level: ${imp.prompt}`);
  const env = ENVIRONMENT_DETAILS.find((e) => e.value === form.environment);
  if (env?.prompt) parts.push(`Environment: ${env.prompt}`);
  const micro = MICRO_DETAIL_LEVELS.find((m) => m.value === form.microDetail);
  if (micro?.prompt) parts.push(`Micro detail: ${micro.prompt}`);
  const body = BODY_TYPES.find((b) => b.value === form.bodyType);
  if (body?.prompt) parts.push(`Body type: ${body.prompt}`);
  const age = AGE_RANGES.find((a) => a.value === form.ageRangeNew);
  if (age?.prompt) parts.push(`Age: ${age.prompt}`);
  return parts.join("\n");
}

export default function CreateCharacterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { kieApiKey, geminiKey } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { upscale, getState: getUpscaleState } = useUpscale();

  // Preset tracking
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [presetEdited, setPresetEdited] = useState(false);

  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shots, setShots] = useState<Record<ShotKey, ShotResult>>(() => {
    const init: any = {};
    SHOT_KEYS.forEach((k) => (init[k] = { status: "idle" as ShotStatus, model: SHOT_CONFIGS[k].model }));
    return init;
  });
  const [completedCount, setCompletedCount] = useState(0);
  const [genPhase, setGenPhase] = useState<"idle" | "identity" | "hero" | "variations" | "saving">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [zoomedShot, setZoomedShot] = useState<{url: string, label: string} | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hero-first: store identity data for later variation generation
  const [identityData, setIdentityData] = useState<{ identityBlock: string; consistencyAnchors: string[]; advancedContext: string } | null>(null);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [generatingSingleShot, setGeneratingSingleShot] = useState<ShotKey | null>(null);

  // Reference photo state (multi-photo, up to 5)
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const [refUrls, setRefUrls] = useState<string[]>([]);
  const [refUploading, setRefUploading] = useState(false);

  const set = (key: keyof FormData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (selectedVibe) setPresetEdited(true);
  };

  // ── Apply vibe pack to form (pre-fills all fields, keeps them visible) ──
  const applyVibePack = (pack: VibePack) => {
    setSelectedVibe(pack.id);
    setPresetEdited(false);
    setForm((prev) => ({
      ...prev,
      expression: pack.config.expression,
      outfit_style: pack.config.outfit,
      skin_condition: pack.config.skinDetail,
      hair_style: pack.config.hairStyle || prev.hair_style,
      custom_notes: `[Vibe: ${pack.name}] Hijab: ${pack.config.hijab}. Lighting: ${pack.config.lighting}. Setting: ${pack.config.setting}.`,
      imperfection: pack.config.imperfection || prev.imperfection,
      environment: pack.config.environment || prev.environment,
      bodyType: pack.config.bodyType || prev.bodyType,
    }));
  };

  // ── Reference photo upload (multi) ──
  const handleRefUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 5MB per foto", variant: "destructive" });
      return;
    }
    if (refPreviews.length >= 5) {
      toast({ title: "Maksimal 5 foto", variant: "destructive" });
      return;
    }
    const preview = URL.createObjectURL(file);
    setRefPreviews((p) => [...p, preview]);
    setRefUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user!.id}/references/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage.from("character-packs").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      setRefPreviews((p) => p.filter((u) => u !== preview));
      setRefUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("character-packs").getPublicUrl(path);
    setRefUrls((p) => [...p, urlData.publicUrl]);
    setRefUploading(false);
  };

  const handleMultiRefUpload = async (files: FileList) => {
    const remaining = 5 - refPreviews.length;
    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      await handleRefUpload(file);
    }
  };

  const removeRef = (index: number) => {
    setRefPreviews((p) => p.filter((_, i) => i !== index));
    setRefUrls((p) => p.filter((_, i) => i !== index));
  };

  // ── GENERATION FLOW — HERO ONLY ──
  const handleGenerate = async () => {
    if (!form.name.trim()) { toast({ title: "Nama wajib diisi", variant: "destructive" }); return; }
    if (!kieApiKey || !geminiKey) {
      toast({ title: "Setup API keys dulu di Settings", description: "Buka Settings — API Keys untuk memasukkan key Kie AI dan Gemini.", variant: "destructive" });
      navigate("/settings");
      return;
    }

    setIsGenerating(true);
    setCompletedCount(0);
    setElapsed(0);
    setSavedId(null);
    setGenPhase("identity");
    const resetShots: any = {};
    SHOT_KEYS.forEach((k) => (resetShots[k] = { status: "idle", model: SHOT_CONFIGS[k].model }));
    setShots(resetShots);

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    try {
      // ── STEP 1: Gemini structured identity prompt ──
      const skinToneEnglish = SKIN_TONE_PROMPTS[form.skin_tone] || form.skin_tone;
      const advancedContext = buildAdvancedContext(form);

      const geminiParts: any[] = [];

      if (refUrl) {
        try {
          const base64Ref = await imageUrlToBase64(refUrl);
          geminiParts.push({
            inlineData: { mimeType: "image/jpeg", data: base64Ref },
          });
          geminiParts.push({
            text: "REFERENCE PHOTO ANALYSIS: A reference photo of the target person is attached above. Analyze it carefully. Describe the EXACT facial features you see: face shape, nose type, lip shape, eye shape, jawline, skin tone, skin texture, any distinctive marks (moles, dimples, scars), eyebrow shape, forehead size. Your identity_block MUST accurately describe this specific person's face — do not generalize or idealize. The form selections below are supplementary guidance, but the reference photo takes priority for facial features.",
          });
        } catch (e) {
          console.warn("Failed to convert reference photo to base64:", e);
        }
      }

      geminiParts.push({
        text: `Based on these attributes, create an extremely detailed identity description for a realistic Indonesian person for AI image generation.\n\nAttributes:\n- Gender: ${form.gender === "female" ? "Female" : "Male"}\n- Age range: ${form.age_range}\n- Skin tone: ${skinToneEnglish}\n- Face shape: ${form.face_shape}\n- Eye color: ${form.eye_color}\n- Hair style: ${form.hair_style}\n- Hair color: ${form.hair_color}\n- Expression tendency: ${form.expression}\n- Outfit style: ${form.outfit_style}\n- Skin condition: ${form.skin_condition}\n- Additional notes: ${form.custom_notes || "none"}\n${advancedContext ? `\nAdvanced styling context:\n${advancedContext}` : ""}\n${refUrl ? "\nIMPORTANT: A reference photo was provided. Your identity_block MUST describe the person in the photo as accurately as possible. Use the form attributes as supplementary styling guidance only." : ""}\n\nRespond ONLY with valid JSON, no markdown:\n{\n  "identity_block": "A single detailed paragraph in English describing the EXACT physical appearance — face shape, specific nose type, lip shape, jawline, skin details, exact hair description with color and style, exact outfit with specific colors and materials. Include 3-5 distinctive anchor features (like a beauty mark, specific nose shape, dimples, etc) that should appear in every image.",\n  "hair_description": "Detailed hair description",\n  "outfit_description": "Specific outfit with exact colors and materials",\n  "consistency_anchors": ["anchor1", "anchor2", "anchor3"]\n}`,
      });

      const genConfig: Record<string, any> = {};
      if (promptModel !== "gemini-3.1-pro-preview") {
        genConfig.responseMimeType = "application/json";
      }

      const geminiData = await geminiFetch(promptModel, geminiKey!, {
        systemInstruction: {
          parts: [{ text: "You are an expert at writing hyper-specific physical descriptions of people for AI image generation. Your descriptions must be extremely detailed and specific to ensure visual consistency across multiple generated images. HAIR GROOMING GUIDANCE: Always describe hair as casually groomed — brushed and shaped with controlled volume and natural movement, as if the person prepared before filming but didn't visit a salon. Avoid describing messy unbrushed hair AND also avoid editorial salon-perfect styling. Hair should signal 'presentable for camera.'" }],
        },
        contents: [{ parts: geminiParts }],
        generationConfig: genConfig,
      });
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Gagal generate identity prompt dari Gemini");
      const identityJson = JSON.parse(rawText);
      const identityBlock: string = identityJson.identity_block;
      const consistencyAnchors: string[] = identityJson.consistency_anchors || [];

      // Store identity data for later variation generation
      setIdentityData({ identityBlock, consistencyAnchors, advancedContext });

      // ── STEP 2: Generate hero portrait ONLY ──
      setGenPhase("hero");
      setShots((p) => ({ ...p, hero_portrait: { status: "generating", model: SHOT_CONFIGS.hero_portrait.model } }));

      const heroPrompt = assemblePrompt("hero_portrait", identityBlock, consistencyAnchors, { imperfection: form.imperfection, environment: form.environment, advancedContext });
      const heroImageInput: string[] = refUrl ? [refUrl] : [];

      const heroCreateRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: SHOT_CONFIGS.hero_portrait.model,
          input: { prompt: heroPrompt, image_input: heroImageInput, aspect_ratio: "3:4", resolution: "2K", output_format: "jpg" },
        }),
      });
      const heroCreateJson = await heroCreateRes.json();
      if (heroCreateJson.code !== 200) throw new Error("Failed to create hero task");
      const heroTaskId = heroCreateJson.data.taskId as string;

      const heroUrl = await pollTask(heroTaskId, kieApiKey);
      if (!heroUrl) throw new Error("Hero portrait gagal — tidak ada URL");

      setShots((p) => ({ ...p, hero_portrait: { status: "success", url: heroUrl, taskId: heroTaskId, model: SHOT_CONFIGS.hero_portrait.model } }));
      setCompletedCount(1);

      if (timerRef.current) clearInterval(timerRef.current);

      // ── STEP 3: Save character immediately with hero only ──
      setGenPhase("saving");
      const { data, error } = await supabase.from("characters").insert({
        user_id: user!.id,
        name: form.name,
        gender: form.gender,
        type: form.gender === "female" ? "Wanita" : "Pria",
        age_range: form.age_range,
        style: form.outfit_style,
        tags: [form.gender === "female" ? "Wanita" : "Pria", form.age_range, form.outfit_style],
        description: identityBlock.substring(0, 200),
        config: form as any,
        identity_prompt: identityBlock,
        hero_image_url: heroUrl,
        thumbnail_url: heroUrl,
        reference_images: [heroUrl],
        shot_metadata: { hero_portrait: { url: heroUrl, taskId: heroTaskId, model: SHOT_CONFIGS.hero_portrait.model } } as any,
        gradient_from: "emerald-900/40",
        gradient_to: "teal-900/40",
        is_preset: false,
        reference_photo_url: refUrl || "",
      } as any).select("id").single();

      if (!error && data) {
        setSavedId(data.id);
        toast({ title: "Karakter berhasil dibuat!", description: "Hero portrait siap digunakan. Generate variasi kapan saja." });
      } else {
        toast({ title: "Gagal menyimpan", description: error?.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      if (timerRef.current) clearInterval(timerRef.current);
    } finally {
      setIsGenerating(false);
      setGenPhase("idle");
    }
  };

  // ── GENERATE ALL 5 VARIATIONS ──
  const handleGenerateVariations = async () => {
    if (!kieApiKey || !identityData || !savedId) return;
    const heroUrl = shots.hero_portrait.url;
    if (!heroUrl) return;

    setIsGeneratingVariations(true);
    setGenPhase("variations");
    setCompletedCount(1);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    REMAINING_KEYS.forEach((k) => {
      setShots((p) => ({ ...p, [k]: { status: "generating", model: SHOT_CONFIGS[k].model } }));
    });

    let done = 1;
    const finalResults: Record<string, { url: string; taskId: string; model: string }> = {};
    const remainingImageInput: string[] = refUrl ? [refUrl, heroUrl] : [heroUrl];

    const batches: ShotKey[][] = [];
    for (let i = 0; i < REMAINING_KEYS.length; i += 2) {
      batches.push(REMAINING_KEYS.slice(i, i + 2));
    }

    try {
      for (const batch of batches) {
        await Promise.all(
          batch.map(async (key) => {
            const cfg = SHOT_CONFIGS[key];
            const shotPrompt = assemblePrompt(key, identityData.identityBlock, identityData.consistencyAnchors, {
              imperfection: form.imperfection, environment: form.environment, advancedContext: identityData.advancedContext,
            });
            try {
              const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
                method: "POST",
                headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: cfg.model,
                  input: { prompt: shotPrompt, image_input: remainingImageInput, aspect_ratio: "3:4", resolution: "2K", output_format: "jpg" },
                }),
              });
              const json = await res.json();
              if (json.code !== 200) throw new Error(`Task creation failed for ${key}`);
              const taskId = json.data.taskId as string;
              const imageUrl = await pollTask(taskId, kieApiKey);
              setShots((p) => ({ ...p, [key]: { status: "success", url: imageUrl, taskId, model: cfg.model } }));
              finalResults[key] = { url: imageUrl, taskId, model: cfg.model };
            } catch {
              setShots((p) => ({ ...p, [key]: { status: "failed", model: cfg.model } }));
            }
            done++;
            setCompletedCount(done);
          })
        );
        if (batch !== batches[batches.length - 1]) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      if (timerRef.current) clearInterval(timerRef.current);

      // Update existing character with variation data
      const allUrls = [heroUrl, ...REMAINING_KEYS.map((k) => finalResults[k]?.url).filter(Boolean)];
      const allMetadata = {
        hero_portrait: { url: heroUrl, taskId: shots.hero_portrait.taskId, model: SHOT_CONFIGS.hero_portrait.model },
        ...finalResults,
      };

      await supabase.from("characters").update({
        reference_images: allUrls,
        shot_metadata: allMetadata as any,
      } as any).eq("id", savedId);

      toast({ title: "Variasi selesai!", description: `${Object.keys(finalResults).length} variasi berhasil di-generate.` });
    } catch (e: any) {
      toast({ title: "Error variasi", description: e.message, variant: "destructive" });
      if (timerRef.current) clearInterval(timerRef.current);
    } finally {
      setIsGeneratingVariations(false);
      setGenPhase("idle");
    }
  };

  // ── GENERATE SINGLE SHOT ──
  const handleGenerateSingleShot = async (key: ShotKey) => {
    if (!kieApiKey || !identityData || !savedId) return;
    const heroUrl = shots.hero_portrait.url;
    if (!heroUrl) return;

    setGeneratingSingleShot(key);
    setShots((p) => ({ ...p, [key]: { status: "generating", model: SHOT_CONFIGS[key].model } }));

    const imageInput: string[] = refUrl ? [refUrl, heroUrl] : [heroUrl];
    const shotPrompt = assemblePrompt(key, identityData.identityBlock, identityData.consistencyAnchors, {
      imperfection: form.imperfection, environment: form.environment, advancedContext: identityData.advancedContext,
    });

    try {
      const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: SHOT_CONFIGS[key].model,
          input: { prompt: shotPrompt, image_input: imageInput, aspect_ratio: "3:4", resolution: "2K", output_format: "jpg" },
        }),
      });
      const json = await res.json();
      if (json.code !== 200) throw new Error("Task creation failed");
      const taskId = json.data.taskId as string;
      const imageUrl = await pollTask(taskId, kieApiKey);

      setShots((p) => ({ ...p, [key]: { status: "success", url: imageUrl, taskId, model: SHOT_CONFIGS[key].model } }));

      // Update character record
      const currentShots = { ...shots };
      currentShots[key] = { status: "success", url: imageUrl, taskId, model: SHOT_CONFIGS[key].model };
      const allUrls = SHOT_KEYS.map((k) => currentShots[k]?.url).filter(Boolean) as string[];
      const shotMeta: any = {};
      SHOT_KEYS.forEach((k) => {
        if (currentShots[k]?.url) {
          shotMeta[k] = { url: currentShots[k].url, taskId: currentShots[k].taskId, model: currentShots[k].model };
        }
      });

      await supabase.from("characters").update({
        reference_images: allUrls,
        shot_metadata: shotMeta,
      } as any).eq("id", savedId);

      toast({ title: `${SHOT_CONFIGS[key].label} selesai!` });
    } catch (e: any) {
      setShots((p) => ({ ...p, [key]: { status: "failed", model: SHOT_CONFIGS[key].model } }));
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingSingleShot(null);
    }
  };

  // ── SUMMARY PILLS ──
  const vibeSelected = VIBE_PACKS.find((v) => v.id === selectedVibe);
  const pills = [
    form.gender === "female" ? "Wanita" : "Pria",
    form.age_range, form.skin_tone, form.face_shape, form.eye_color,
    form.hair_style, form.hair_color, form.expression, form.outfit_style, form.skin_condition,
  ].filter(Boolean);

  // ── Progress label ──
  const progressLabel = (() => {
    switch (genPhase) {
      case "identity": return "Membuat identity prompt...";
      case "hero": return "Membuat hero portrait...";
      case "variations": return `Generating variasi... (${completedCount - 1}/5)`;
      case "saving": return "Menyimpan karakter...";
      default: return "";
    }
  })();

  const heroDone = shots.hero_portrait.status === "success";
  const allVariationsDone = REMAINING_KEYS.every((k) => shots[k].status === "success");
  const anyVariationGenerating = REMAINING_KEYS.some((k) => shots[k].status === "generating");
  const variationsDoneCount = REMAINING_KEYS.filter((k) => shots[k].status === "success").length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── LEFT COLUMN: FORM ── */}
        <div className="flex-1 min-w-0 space-y-6 animate-fade-up">
          <div>
            <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase mb-1">Buat Karakter Baru</h1>
            <p className="text-sm text-muted-foreground mb-4">Kustomisasi karakter AI untuk konten UGC kamu</p>
          </div>

          {/* Reference Photo Upload */}
          <FormGroup label="Referensi Wajah (Opsional)">
            {refPreview ? (
              <div className="relative inline-block">
                <img src={refPreview} alt="Reference" className="h-[120px] w-[120px] rounded-xl object-cover border border-border" />
                <button onClick={removeRef} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
                {refUploading && (
                  <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleRefUpload(file); }}
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file"; inp.accept = "image/jpeg,image/png,image/webp";
                  inp.onchange = (ev) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) handleRefUpload(f); };
                  inp.click();
                }}
                className="border-2 border-dashed border-border rounded-xl p-6 bg-background hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop foto wajah</p>
                <p className="text-xs text-muted-foreground/60">JPEG, PNG, WebP — Maks 5MB</p>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground/60 mt-2 leading-relaxed">
              Upload foto close-up wajah untuk hasil karakter yang lebih mirip.
            </p>
            {refPreview && selectedVibe && (
              <p className="text-[11px] text-primary/70 mt-1">
                Preset sebagai styling guide — wajah akan dicocokkan dengan foto referensi.
              </p>
            )}
          </FormGroup>

          {/* Name */}
          <FormGroup label="Nama Karakter">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Contoh: Sarah Hijab" className="bg-muted/50 border-border" />
          </FormGroup>

          {/* Gender */}
          <FormGroup label="Gender">
            <div className="flex gap-2">
              {(["female", "male"] as Gender[]).map((g) => (
                <button key={g} onClick={() => set("gender", g)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${form.gender === g ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border text-muted-foreground hover:text-foreground"}`}>
                  {g === "female" ? "Wanita" : "Pria"}
                </button>
              ))}
            </div>
          </FormGroup>

          {/* ── QUICK PRESETS ── */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground font-medium">Quick Preset</label>
            {selectedVibe && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Preset: {vibeSelected?.name} {presetEdited ? "(edited)" : "✓"}
                </span>
                <button onClick={() => { setSelectedVibe(null); setPresetEdited(false); }} className="text-[11px] text-muted-foreground hover:text-foreground">✕ Reset</button>
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {VIBE_PACKS.map((pack) => {
                const isSelected = selectedVibe === pack.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => applyVibePack(pack)}
                    className={`shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 transition-all text-left ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/10"
                        : "bg-muted/50 border border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md shrink-0" style={{ background: pack.previewGradient }} />
                    <div>
                      <p className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{pack.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[100px]">{pack.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── ALL FORM FIELDS (always visible) ── */}
          <div className="space-y-6">
            <FormGroup label="Rentang Usia">
              <Select value={form.ageRangeNew} onValueChange={(v) => set("ageRangeNew", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{AGE_RANGES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Warna Kulit">
              <div className="flex gap-4">
                {SKIN_TONES.map((t) => (
                  <button key={t.hex} onClick={() => set("skin_tone", t.label)} className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full transition-all ${form.skin_tone === t.label ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`} style={{ backgroundColor: t.hex }} />
                    <span className="text-[11px] text-muted-foreground">{t.label}</span>
                  </button>
                ))}
              </div>
            </FormGroup>

            <FormGroup label="Bentuk Wajah">
              <Select value={form.face_shape} onValueChange={(v) => set("face_shape", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{["Oval", "Bulat", "Kotak", "Hati", "Lonjong"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Warna Mata">
              <Select value={form.eye_color} onValueChange={(v) => set("eye_color", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{["Coklat Tua", "Coklat Madu", "Hitam", "Coklat Terang"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Gaya Rambut">
              <Select value={form.hair_style} onValueChange={(v) => set("hair_style", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{HAIR_STYLES[form.gender].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Warna Rambut">
              <Select value={form.hair_color} onValueChange={(v) => set("hair_color", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{["Hitam", "Coklat Tua", "Coklat Madu", "Highlighted"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Ekspresi">
              <Select value={form.expression} onValueChange={(v) => set("expression", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{["Hangat & Ramah", "Percaya Diri", "Kalem Profesional", "Energik Ceria", "Lembut Natural"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Gaya Outfit">
              <Select value={form.outfit_style} onValueChange={(v) => set("outfit_style", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{["Casual Modern", "Smart Casual", "Hijab Modern", "Streetwear", "Athletic", "Professional", "Beauty/Glam"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Kondisi Kulit">
              <Select value={form.skin_condition} onValueChange={(v) => set("skin_condition", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{["Bersih Natural", "Sedikit Freckles", "Glowing Sehat", "Matte Clean"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </FormGroup>

            {/* ── DETAIL LANJUTAN ── */}
            <div className="border-t border-border pt-6 space-y-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Detail Lanjutan</p>

              <FormGroup label="Tipe Tubuh">
                <Select value={form.bodyType} onValueChange={(v) => set("bodyType", v)}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{BODY_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </FormGroup>

              <FormGroup label="Level Imperfeksi Kulit">
                <Select value={form.imperfection} onValueChange={(v) => set("imperfection", v)}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{IMPERFECTION_LEVELS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </FormGroup>

              <FormGroup label="Lingkungan Detail">
                <Select value={form.environment} onValueChange={(v) => set("environment", v)}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{ENVIRONMENT_DETAILS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </FormGroup>

              <FormGroup label="Micro Detail">
                <Select value={form.microDetail} onValueChange={(v) => set("microDetail", v)}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{MICRO_DETAIL_LEVELS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </FormGroup>
            </div>

            <FormGroup label="Catatan Tambahan (Opsional)">
              <Textarea value={form.custom_notes} onChange={(e) => set("custom_notes", e.target.value)} rows={3} placeholder="Detail tambahan..." className="bg-muted/50 border-border" />
            </FormGroup>
          </div>
        </div>

        {/* ── RIGHT COLUMN: PREVIEW ── */}
        <div className="w-full lg:w-[480px] shrink-0 lg:sticky lg:top-8 self-start animate-fade-up" style={{ animationDelay: "100ms" }}>
          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-5 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Preview Karakter</p>

            {refPreview && (
              <div className="flex items-center gap-3 mb-3">
                <img src={refPreview} alt="Ref" className="h-16 w-16 rounded-full object-cover border border-border" />
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Foto Referensi</p>
                  <p className="text-[11px] text-primary/70">Wajah akan dicocokkan</p>
                </div>
              </div>
            )}

            {form.name && <p className="font-bold font-satoshi mb-2">{form.name}</p>}
            <div className="flex flex-wrap gap-1.5">
              {pills.map((p) => (
                <span key={p} className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          </div>

          {/* Progress */}
          {(isGenerating || isGeneratingVariations) && (
            <div className="mb-4 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  {(genPhase === "hero" || genPhase === "variations") && <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  {progressLabel}
                </span>
                <span>{elapsed}s</span>
              </div>
              <Progress value={isGeneratingVariations ? ((completedCount - 1) / 5) * 100 : genPhase === "hero" ? 50 : genPhase === "saving" ? 90 : 10} className="h-2 bg-secondary" />
            </div>
          )}

          {/* 6-shot grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {SHOT_KEYS.map((key) => {
              const cfg = SHOT_CONFIGS[key];
              const shot = shots[key];
              const Icon = cfg.icon;
              const isPro = cfg.model === "nano-banana-pro";
              const isHero = key === "hero_portrait";
              const isVariation = !isHero;
              const canClickToGenerate = isVariation && heroDone && savedId && shot.status === "idle" && !isGeneratingVariations && !generatingSingleShot;

              return (
                <div
                  key={key}
                  className={`relative aspect-[3/4] bg-muted/50 border rounded-xl flex flex-col items-center justify-center gap-2 overflow-hidden transition-all ${
                    isHero && shot.status === "success" ? "border-primary/50 ring-1 ring-primary/20" :
                    canClickToGenerate ? "border-dashed border-muted-foreground/20 hover:border-primary/40 cursor-pointer" :
                    "border-border"
                  }`}
                  onClick={canClickToGenerate ? () => handleGenerateSingleShot(key) : undefined}
                >
                  {shot.status === "success" && shot.url ? (
                    <img src={shot.url} alt={cfg.label} className="absolute inset-0 w-full h-full object-cover animate-fade-in cursor-pointer" onClick={(e) => { e.stopPropagation(); setZoomedShot({url: shot.url!, label: cfg.label}); }} />
                  ) : shot.status === "generating" ? (
                    <div className="absolute inset-0 generation-mesh flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-primary/60 animate-spin" />
                    </div>
                  ) : shot.status === "failed" ? (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  ) : (
                    <Icon className={`w-6 h-6 ${canClickToGenerate ? "text-muted-foreground/50" : "text-muted-foreground/30"}`} />
                  )}
                  {shot.status !== "success" && (
                    <span className={`text-[11px] uppercase tracking-wider text-center px-1 ${canClickToGenerate ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}>
                      {cfg.label}
                    </span>
                  )}
                  {canClickToGenerate && (
                    <span className="text-[9px] text-primary/60 mt-1">Klik untuk generate</span>
                  )}
                  {shot.status === "success" && shot.url && (
                    <>
                      <CheckCircle2 className="absolute top-1.5 right-1.5 w-4 h-4 text-green-500 drop-shadow" />
                      {getUpscaleState(key).factor && (
                        <span className="absolute top-1.5 left-1.5 bg-primary/20 text-primary text-[9px] rounded-full px-1.5 font-medium">{getUpscaleState(key).factor}x</span>
                      )}
                      <div className="absolute bottom-1.5 right-1.5">
                        <UpscaleButton
                          imageUrl={getUpscaleState(key).resultUrl || shot.url}
                          imageKey={key}
                          loading={getUpscaleState(key).loading}
                          currentFactor={getUpscaleState(key).factor}
                          onUpscale={(k, u, f) => upscale(k, u, f)}
                        />
                      </div>
                    </>
                  )}
                  <span className={`absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded font-medium ${isPro ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"}`}>
                    {isPro ? "PRO" : "FAST"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cost indicator — dynamic */}
          <div className="flex items-start gap-2 bg-card border border-border rounded-lg p-3 mb-4 text-xs text-muted-foreground">
            <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              {!heroDone ? (
                <>
                  <p>Estimasi: ~Rp 1.440 untuk hero portrait</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">1x Nano Banana Pro (2K) • Variasi opsional setelahnya</p>
                </>
              ) : allVariationsDone ? (
                <>
                  <p>Hero ✓ • {variationsDoneCount} variasi ✓</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">Semua shot selesai</p>
                </>
              ) : (
                <>
                  <p>Hero ✓ {variationsDoneCount > 0 ? `• ${variationsDoneCount}/5 variasi ✓` : ""}</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                    {5 - variationsDoneCount} variasi tersisa (+~Rp {((5 - variationsDoneCount) * 700).toLocaleString("id-ID")})
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Generate 5 variations button */}
          {heroDone && savedId && !allVariationsDone && !isGeneratingVariations && (
            <Button
              onClick={handleGenerateVariations}
              variant="outline"
              disabled={!!generatingSingleShot}
              className="w-full py-3 font-bold uppercase tracking-wider mb-3 border-primary/30 text-primary hover:bg-primary/10"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Generate {5 - variationsDoneCount} Variasi (+~Rp {((5 - variationsDoneCount) * 700).toLocaleString("id-ID")})
            </Button>
          )}

          {/* Main action buttons */}
          {savedId ? (
            <div className="space-y-2 animate-fade-in">
              <Button onClick={() => navigate(`/generate?characterId=${savedId}`)} className="w-full py-3.5 font-bold uppercase tracking-wider">
                Gunakan Untuk Generate
              </Button>
              <Button variant="outline" onClick={() => navigate("/characters")} className="w-full py-3.5 font-bold uppercase tracking-wider">
                Lihat Semua Karakter
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3.5 font-bold uppercase tracking-wider animate-cta-glow">
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {progressLabel || "Generating..."}</> : "Generate Karakter (~Rp 1.440)"}
            </Button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {zoomedShot && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedShot(null)}
          onKeyDown={(e) => e.key === "Escape" && setZoomedShot(null)}
          tabIndex={0}
        >
          <button className="fixed top-4 right-4 text-foreground/70 hover:text-foreground z-[101]" onClick={() => setZoomedShot(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={zoomedShot.url} alt={zoomedShot.label} className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          <p className="text-foreground/70 text-sm mt-3">{zoomedShot.label}</p>
          <a
            href={zoomedShot.url}
            download={`${zoomedShot.label}.jpg`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" /> Download
          </a>
        </div>
      )}
    </div>
  );
}

// ── FORM GROUP COMPONENT ──
function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2.5">{label}</label>
      {children}
    </div>
  );
}
