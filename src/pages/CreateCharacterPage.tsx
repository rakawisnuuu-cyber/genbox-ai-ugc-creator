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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Camera,
  RotateCcw,
  Mic,
  PersonStanding,
  Search,
  Hand,
  Zap,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Download,
  Upload,
  ImageIcon,
  Sparkles,
  User,
  ArrowRight,
  Film,
} from "lucide-react";
import UpscaleButton from "@/components/UpscaleButton";
import {
  SKIN_TONES,
  FACE_TYPES,
  HAIR_STYLES_FEMALE,
  HAIR_STYLES_MALE,
  SKIN_CONDITIONS,
  MAKEUP_LEVELS,
  HIJAB_STYLES,
  VIBES,
  BODY_TYPES,
  AGE_RANGES,
  OUTFIT_STYLES,
  ACCESSORIES,
  CHARACTER_TEMPLATES,
  DEFAULT_FORM,
  buildCharacterPromptContext,
  type CharacterFormData,
  type CharacterTemplate,
} from "@/lib/character-vibes";

// ── TYPES ──
type ShotKey =
  | "hero_portrait"
  | "neutral_identity"
  | "profile_45"
  | "profile_90"
  | "full_body"
  | "talking_product"
  | "motion_transition"
  | "skin_macro";
type ShotStatus = "idle" | "generating" | "success" | "failed";

interface ShotResult {
  status: ShotStatus;
  url?: string;
  taskId?: string;
  model: string;
}

// ── GENBOX PROMPT SYSTEM CONSTANTS ──

const QUALITY_BLOCK =
  "Ultra-realistic photographic portrait, 8K resolution, photographic realism, natural shallow depth of field, tack-sharp focus on subject, natural color grading with warm tones complementing Southeast Asian skin, realistic contrast.";

const NEGATIVE_BLOCK =
  "No cartoon, no anime, no CGI, no 3D render, no over-smoothing, no glamour filter, no artificial glow, no fantasy lighting, no neon, no watermark, no text overlay, no distorted features, no extra fingers, no warped proportions, no game engine look, no hyper-saturated colors.";

const FACIAL_REALISM_BLOCK =
  "Face must have slight natural asymmetry — one eye marginally narrower, subtle lip unevenness, natural brow variation. Expression should have micro-tension — not a perfectly relaxed or perfectly smiling face, but the natural in-between states real faces hold. Avoid: perfectly symmetrical features, identical eye shapes, unnaturally even smile, doll-like proportions. NOTE: If a reference photo is provided, prioritize matching the reference face over these general asymmetry guidelines.";

const HAIR_GROOMING_BLOCK =
  "Hair should look casually groomed — brushed and shaped with controlled volume and natural movement, as if the person prepared before filming but didn't visit a salon. Good: soft straight hair tucked behind ear, loose controlled waves, low ponytail, half-tied hair, light blow-dry look. Avoid: messy unbrushed bed-hair, frizzy uncontrolled volume, AND also avoid editorial salon-perfect styling. Hair should signal 'I look presentable for camera' — not 'I just woke up' and not 'I came from a photoshoot.'";

// ── Dynamic skin block based on skin condition ──
function getSkinBlock(skinCondition: string): string {
  const condition = SKIN_CONDITIONS.find((s) => s.value === skinCondition);
  if (condition) {
    return `Skin condition: ${condition.prompt}. Skin must look real — no beauty filter smoothing, no glamour retouching. Natural texture visible under good lighting.`;
  }
  // fallback
  return "Skin is clean, breathable, and healthy with soft visible texture under good lighting. Balanced complexion with gentle natural variation. Slight natural oil sheen on T-zone. Minimal makeup: soft base, subtle lip tint. No hyper-textured skin, no over-sharpened pores, no beauty filter. Think: real person who takes care of their skin.";
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

// ── CONSTANTS ──

const SHOT_CONFIGS: Record<
  ShotKey,
  { label: string; model: string; camera: string; framing: string; icon: typeof Camera }
> = {
  hero_portrait: {
    label: "Hero Portrait",
    model: "nano-banana-pro",
    camera:
      "Shot on a full-frame mirrorless camera, 50mm lens, f/2.0 aperture, shallow depth of field, tack-sharp focus on face. Subject distance 2.2 meters.",
    framing:
      "Chest-up centered portrait, facing directly toward camera at 0 degrees, making warm direct eye contact. Expression is a genuine soft smile — friendly, approachable, and confident, like a brand ambassador introduction photo. Posture is upright and natural, shoulders relaxed and visible, neck fully exposed. Background is a smooth light grey studio gradient, clean and distraction-free. Natural skin texture with visible pores under close inspection, slight natural oil sheen on forehead. No beauty filter, no over-smoothing, no glamour retouching. This is the primary identity anchor — every detail of this face must be preservable across other angles.",
    icon: Camera,
  },
  neutral_identity: {
    label: "Neutral Anchor",
    model: "nano-banana-2",
    camera:
      "Shot on a full-frame mirrorless camera, 50mm lens, f/2.8 aperture, shallow depth of field. Subject distance 2.2 meters.",
    framing:
      "Chest-up centered portrait, facing directly toward camera at 0 degrees. Expression is completely neutral — no smile, lips softly closed, jaw relaxed, eyes calm and direct with no squinting. This is NOT a posed photo — it is a clinical identity reference. Posture upright, shoulders relaxed and visible, neck fully exposed. Background is a smooth mid-grey seamless studio, slightly darker than hero shot. Flat frontal lighting with diffused softbox, minimal shadow contrast, 5600K color temperature. Visible pores, natural skin texture, slight under-eye tone variation, minor natural asymmetry preserved. No stylization, no expression bias, no retouching. Exact facial proportions from reference image must be preserved — this is the identity baseline.",
    icon: User,
  },
  profile_45: {
    label: "3/4 Profile",
    model: "nano-banana-2",
    camera:
      "Shot on a full-frame mirrorless camera, 50mm lens, f/2.8 aperture, shallow depth of field. Subject distance 2.4 meters.",
    framing:
      "Head and shoulders, body and face turned 45 degrees to the right, eyes looking slightly past camera. Expression is calm, natural, thoughtful — slight hint of a closed-mouth smile. Cheekbone and jaw transition clearly visible. Ear partially visible. Neck fully exposed showing natural jawline contour. Background is a smooth soft grey studio gradient, same tone as hero shot. Same person as hero portrait — identical facial structure, skin tone, hair style, and outfit. Natural skin texture maintained, no smoothing.",
    icon: RotateCcw,
  },
  profile_90: {
    label: "Side Profile",
    model: "nano-banana-2",
    camera:
      "Shot on a medium-format camera, 85mm lens, f/4 aperture, shallow depth of field. Subject distance 2.8 meters.",
    framing:
      "Head and upper shoulders in strict 90-degree left profile — face perfectly perpendicular to camera. Only one eye visible. Expression is neutral, relaxed jaw, lips gently closed, chin level. Nose bridge length, forehead slope, chin projection, and eye socket depth must match the reference photo exactly. Clean silhouette separation from background — no blending. Neck fully visible showing natural contour. Hair in natural fall following gravity, visible hairline and ear structure. Background is a light grey seamless studio. Orthographic facial consistency — no reinterpretation of identity, strict profile extraction from the same person as hero portrait. Natural skin texture on visible cheek, no smoothing.",
    icon: ArrowRight,
  },
  full_body: {
    label: "Full Body",
    model: "nano-banana-2",
    camera:
      "Shot on a full-frame mirrorless camera, 35mm lens, f/2.8 aperture, full body in focus, natural perspective. Subject distance 4.5 meters.",
    framing:
      "Full body standing shot, head to toe visible with small margin above and below. Relaxed natural posture — weight on one leg, hands relaxed at sides or one hand in pocket. Direct eye contact, relaxed confident expression. Same person, same outfit, same hair as hero portrait. Body proportions must be natural and consistent with reference. Background is the same smooth soft grey studio gradient, slightly wider framing. Natural skin visible on face and arms, same texture quality as closer shots. Full outfit clearly visible from head to shoes.",
    icon: PersonStanding,
  },
  talking_product: {
    label: "Talking + Product",
    model: "nano-banana-2",
    camera:
      "Shot on a full-frame mirrorless camera, 50mm lens, f/2.8 aperture, sharp focus on face and hands. Subject distance 2.3 meters.",
    framing:
      "Chest-up with both hands visible in frame. One hand holds a generic small white cylindrical product (like a serum bottle or small box) at chest height, angled slightly toward camera. Expression is mid-sentence — mouth slightly open, animated and conversational, like speaking to camera in a product review video. Eyes looking directly at camera with engaged energy. Other hand gesturing naturally. Background is a soft real environment — clean modern desk or kitchen counter with subtle everyday objects (a mug, a phone, a small plant). Warm natural indoor lighting from a window, 5200K. Same person, same hair, same skin texture as hero portrait. UGC content creator energy — natural, not editorial.",
    icon: Hand,
  },
  motion_transition: {
    label: "Motion Turn",
    model: "nano-banana-2",
    camera:
      "Shot on a full-frame mirrorless camera, 50mm lens, f/2.8 aperture, slight motion capture feel. Subject distance 2.3 meters.",
    framing:
      "Chest-up portrait captured mid-movement. Body rotated approximately 20 degrees to the left, head turning back toward camera at 10-degree offset from body — creating natural body-vs-head twist. One shoulder slightly forward, subtle torso twist, neck engaged in turning motion. Expression is neutral-focused — lips relaxed, eyes mid-engagement, caught between poses. Slight hair displacement suggesting movement — strands not perfectly settled, natural motion blur on trailing hair edge. Fabric tension visible at shoulder seam from the twist. Background is mid-grey studio gradient. Same person, same outfit as hero portrait. This shot provides rotational geometry data for video model consistency — the transitional state between front-facing and profile.",
    icon: Film,
  },
  skin_macro: {
    label: "Skin Macro",
    model: "nano-banana-pro",
    camera:
      "Shot on a full-frame mirrorless camera, 100mm macro lens, f/2.4 aperture, extreme close-up with razor-sharp focus on skin surface. Subject distance 0.8 meters.",
    framing:
      "Face filling the entire frame from mid-forehead to chin. Direct calm gaze, neutral relaxed expression with lips softly closed. Background completely dissolved into smooth bokeh. CRITICAL: Focus on hyperrealistic skin surface — individual pores clearly visible across nose, cheeks, and forehead. Natural sebum sheen on T-zone. Subtle peach fuzz visible on cheeks in light. Fine expression lines around eyes. Natural undereye color variation. Any moles, beauty marks, or minor imperfections from reference photo must be preserved. No retouching, no smoothing, no beauty filter, no glamour processing. This is a dermatological-quality skin reference — raw, real, and detailed. Same person as hero portrait.",
    icon: Search,
  },
};

const SHOT_KEYS: ShotKey[] = [
  "hero_portrait",
  "neutral_identity",
  "profile_45",
  "profile_90",
  "full_body",
  "talking_product",
  "motion_transition",
  "skin_macro",
];
const REMAINING_KEYS: ShotKey[] = [
  "neutral_identity",
  "profile_45",
  "profile_90",
  "full_body",
  "talking_product",
  "motion_transition",
  "skin_macro",
];

import { imageUrlToBase64 } from "@/lib/image-utils";

// ── HELPER: Assemble prompt for a shot ──
function assemblePrompt(
  shotKey: ShotKey,
  identityBlock: string,
  consistencyAnchors: string[],
  options?: {
    skinCondition?: string;
    advancedContext?: string;
    hasReferencePhoto?: boolean;
    faceLock?: string;
    styleBlock?: string;
  },
) {
  const cfg = SHOT_CONFIGS[shotKey];
  const skinCondition = options?.skinCondition || "mulus";
  const hasRef = options?.hasReferencePhoto || false;

  const parts: string[] = [];

  // When reference photo exists, use split face_lock + style_block
  if (hasRef && options?.faceLock) {
    parts.push(
      "CRITICAL: A reference photo is attached. The generated face MUST closely match the reference. Facial resemblance is the #1 priority above all other instructions.",
    );
    parts.push(QUALITY_BLOCK);
    parts.push(cfg.camera);
    parts.push(`[FACE IDENTITY — DO NOT MODIFY] ${options.faceLock}`);
    parts.push(`MANDATORY consistency anchors: ${consistencyAnchors.join(", ")}`);
    if (options.styleBlock) {
      parts.push(`[STYLE — apply on top of the face above, do NOT change facial features] ${options.styleBlock}`);
    }
    parts.push(HAIR_GROOMING_BLOCK);
    if (options?.advancedContext) parts.push(options.advancedContext);
    parts.push(cfg.framing);
    parts.push(getLightingBlock("simple"));
    parts.push(getSkinBlock(skinCondition));
    parts.push(NEGATIVE_BLOCK);
  } else {
    // No reference photo — use combined identity_block as before
    parts.push(QUALITY_BLOCK);
    parts.push(cfg.camera);
    parts.push(identityBlock);
    parts.push(`MANDATORY consistency anchors: ${consistencyAnchors.join(", ")}`);
    parts.push(FACIAL_REALISM_BLOCK);
    parts.push(HAIR_GROOMING_BLOCK);
    if (options?.advancedContext) parts.push(options.advancedContext);
    parts.push(cfg.framing);
    parts.push(getLightingBlock("simple"));
    parts.push(getSkinBlock(skinCondition));
    parts.push(NEGATIVE_BLOCK);
  }

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
      } catch {
        return "";
      }
    }
    if (state === "fail") throw new Error("Generation failed");
  }
  throw new Error("Timeout");
}

// ── HELPER: Build extra prompt context from new form fields ──
function buildAdvancedContext(form: CharacterFormData): string {
  return buildCharacterPromptContext(form);
}

export default function CreateCharacterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { kieApiKey, geminiKey } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { upscale, getState: getUpscaleState } = useUpscale();

  // Template tracking
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateEdited, setTemplateEdited] = useState(false);

  const [form, setForm] = useState<CharacterFormData>(DEFAULT_FORM);
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
  const [zoomedShot, setZoomedShot] = useState<{ url: string; label: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hero-first: store identity data for later variation generation
  const [identityData, setIdentityData] = useState<{
    identityBlock: string;
    faceLock: string;
    styleBlock: string;
    consistencyAnchors: string[];
    advancedContext: string;
  } | null>(null);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [generatingSingleShot, setGeneratingSingleShot] = useState<ShotKey | null>(null);

  // Reference photo state (multi-photo, up to 5)
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const [refUrls, setRefUrls] = useState<string[]>([]);
  const [refUploading, setRefUploading] = useState(false);

  const hasRef = refUrls.length > 0;

  const set = (key: keyof CharacterFormData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (selectedTemplate) setTemplateEdited(true);
  };

  // ── Apply template to form ──
  const applyTemplate = (tmpl: CharacterTemplate) => {
    setSelectedTemplate(tmpl.id);
    setTemplateEdited(false);
    setForm((prev) => ({
      ...prev,
      ...tmpl.config,
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
    if (!form.name.trim()) {
      toast({ title: "Nama wajib diisi", variant: "destructive" });
      return;
    }
    if (!kieApiKey || !geminiKey) {
      toast({
        title: "Setup API keys dulu di Settings",
        description: "Buka Settings — API Keys untuk memasukkan key Kie AI dan Gemini.",
        variant: "destructive",
      });
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
      const advancedContext = buildAdvancedContext(form);

      const geminiParts: any[] = [];

      if (refUrls.length > 0) {
        try {
          for (const url of refUrls) {
            const base64Ref = await imageUrlToBase64(url);
            geminiParts.push({
              inlineData: { mimeType: "image/jpeg", data: base64Ref },
            });
          }
          geminiParts.push({
            text:
              refUrls.length > 1
                ? `REFERENCE PHOTO ANALYSIS: ${refUrls.length} reference photos of the target person are attached above. Cross-reference ALL photos to identify consistent facial features.`
                : "REFERENCE PHOTO ANALYSIS: A reference photo of the target person is attached above. Analyze it carefully.",
          });
        } catch (e) {
          console.warn("Failed to convert reference photo(s) to base64:", e);
        }
      }

      // Build Gemini prompt — different structure based on whether ref photo exists
      const hasRefPhotos = refUrls.length > 0;

      if (hasRefPhotos) {
        // WITH reference photo: ask for split face_lock + style_block
        geminiParts.push({
          text: `You must output TWO separate descriptions for this person:

1. face_lock: Describe ONLY the physical face and body from the reference photo. Include: face shape, nose bridge width, nostril shape, lip fullness (upper vs lower), eye shape and spacing, brow arch, jawline, chin shape, skin color (describe the actual color you see — do NOT use ethnic labels like "Indonesian" or "Southeast Asian"), skin texture, any moles/dimples/scars, ear shape, forehead size, hair color and texture as seen in photo, body build. This block must NEVER change regardless of styling.

2. style_block: Describe the DESIRED styling that the user wants applied ON TOP of this person's face. This is SEPARATE from their physical identity.

User's desired styling:
- Gender: ${form.gender === "female" ? "Female" : "Male"}
- Age: ${AGE_RANGES.find((a) => a.value === form.ageRange)?.prompt || form.ageRange}
- Hijab: ${form.gender === "female" ? HIJAB_STYLES.find((h) => h.value === form.hijabStyle)?.prompt || "none" : "N/A"}
- Skin condition: ${SKIN_CONDITIONS.find((s) => s.value === form.skinCondition)?.prompt || "natural"}
- Makeup: ${MAKEUP_LEVELS.find((m) => m.value === form.makeupLevel)?.prompt || "natural"}
- Vibe/expression: ${VIBES.find((v) => v.value === form.vibe)?.prompt || "natural"}
- Outfit: ${OUTFIT_STYLES.find((o) => o.value === form.outfitStyle)?.prompt || "casual"}
- Accessories: ${ACCESSORIES.find((a) => a.value === form.accessories)?.prompt || "none"}
- Additional notes: ${form.customNotes || "none"}

CRITICAL RULES:
- face_lock must describe ONLY what you SEE in the photo — physical features that cannot change
- style_block must describe ONLY changeable styling — outfit, makeup, expression, hijab, accessories
- Do NOT put outfit, makeup, or hijab info in face_lock
- Do NOT put face shape, nose type, or skin color in style_block
- identity_block should be face_lock + style_block combined (for backward compatibility)

Respond ONLY with valid JSON, no markdown:
{
  "face_lock": "Detailed paragraph describing ONLY the immutable physical face and body from the reference photo.",
  "style_block": "Detailed paragraph describing ONLY the desired styling — outfit, makeup, expression, hijab, accessories.",
  "identity_block": "Combined face_lock + style_block as one paragraph (for backward compatibility).",
  "hair_description": "Hair as seen in photo",
  "outfit_description": "Desired outfit with colors and materials",
  "consistency_anchors": ["anchor1", "anchor2", "anchor3", "anchor4", "anchor5"]
}`,
        });
      } else {
        // WITHOUT reference photo: use original single identity_block approach
        geminiParts.push({
          text: `Based on these attributes, create an extremely detailed identity description for a realistic person for AI image generation.

Attributes:
- Gender: ${form.gender === "female" ? "Female" : "Male"}
- Age: ${AGE_RANGES.find((a) => a.value === form.ageRange)?.prompt || form.ageRange}
- Skin tone: ${SKIN_TONES.find((s) => s.value === form.skinTone)?.prompt || form.skinTone}
- Face type: ${FACE_TYPES.find((f) => f.value === form.faceType)?.prompt || "not specified"}
- Hair: ${(form.gender === "female" ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE).find((h) => h.value === form.hairStyle)?.prompt || "not specified"}
- Hijab: ${form.gender === "female" ? HIJAB_STYLES.find((h) => h.value === form.hijabStyle)?.prompt || "none" : "N/A"}
- Body type: ${BODY_TYPES.find((b) => b.value === form.bodyType)?.prompt || "average"}
- Skin condition: ${SKIN_CONDITIONS.find((s) => s.value === form.skinCondition)?.prompt || "natural"}
- Makeup: ${MAKEUP_LEVELS.find((m) => m.value === form.makeupLevel)?.prompt || "natural"}
- Vibe/expression: ${VIBES.find((v) => v.value === form.vibe)?.prompt || "natural"}
- Outfit: ${OUTFIT_STYLES.find((o) => o.value === form.outfitStyle)?.prompt || "casual"}
- Accessories: ${ACCESSORIES.find((a) => a.value === form.accessories)?.prompt || "none"}
- Additional notes: ${form.customNotes || "none"}

Respond ONLY with valid JSON, no markdown:
{
  "identity_block": "A single detailed paragraph describing the EXACT physical appearance — face shape, nose type, lip shape, jawline, skin details, exact hair description, makeup level, exact outfit with colors. Include 3-5 distinctive anchor features that should appear in every image.",
  "hair_description": "Detailed hair description including color, style, length",
  "outfit_description": "Specific outfit with exact colors and materials",
  "consistency_anchors": ["anchor1", "anchor2", "anchor3", "anchor4", "anchor5"]
}`,
        });
      }

      const genConfig: Record<string, any> = {};
      if (promptModel !== "gemini-3.1-pro-preview") {
        genConfig.responseMimeType = "application/json";
      }

      const geminiData = await geminiFetch(promptModel, geminiKey!, {
        systemInstruction: {
          parts: [
            {
              text: "You are an expert at writing hyper-specific physical descriptions of people for AI image generation. Your descriptions must be extremely detailed and specific to ensure visual consistency across multiple generated images. HAIR GROOMING GUIDANCE: Always describe hair as casually groomed — brushed and shaped with controlled volume and natural movement, as if the person prepared before filming but didn't visit a salon. Avoid describing messy unbrushed hair AND also avoid editorial salon-perfect styling. Hair should signal 'presentable for camera.'",
            },
          ],
        },
        contents: [{ parts: geminiParts }],
        generationConfig: genConfig,
      });
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Gagal generate identity prompt dari Gemini");
      const identityJson = JSON.parse(rawText);
      const identityBlock: string = identityJson.identity_block;
      const faceLock: string = identityJson.face_lock || "";
      const styleBlock: string = identityJson.style_block || "";
      const consistencyAnchors: string[] = identityJson.consistency_anchors || [];

      // Store identity data for later variation generation
      setIdentityData({ identityBlock, faceLock, styleBlock, consistencyAnchors, advancedContext });

      // ── STEP 2: Generate hero portrait ONLY ──
      setGenPhase("hero");
      setShots((p) => ({ ...p, hero_portrait: { status: "generating", model: SHOT_CONFIGS.hero_portrait.model } }));

      const heroPrompt = assemblePrompt("hero_portrait", identityBlock, consistencyAnchors, {
        skinCondition: form.skinCondition,
        advancedContext,
        hasReferencePhoto: hasRef,
        faceLock,
        styleBlock,
      });
      const heroImageInput: string[] = refUrls.length > 0 ? [refUrls[0]] : [];

      const heroCreateRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: SHOT_CONFIGS.hero_portrait.model,
          input: {
            prompt: heroPrompt,
            image_input: heroImageInput,
            aspect_ratio: "3:4",
            resolution: "2K",
            output_format: "jpg",
          },
        }),
      });
      const heroCreateJson = await heroCreateRes.json();
      if (heroCreateJson.code !== 200) throw new Error("Failed to create hero task");
      const heroTaskId = heroCreateJson.data.taskId as string;

      const heroUrl = await pollTask(heroTaskId, kieApiKey);
      if (!heroUrl) throw new Error("Hero portrait gagal — tidak ada URL");

      setShots((p) => ({
        ...p,
        hero_portrait: { status: "success", url: heroUrl, taskId: heroTaskId, model: SHOT_CONFIGS.hero_portrait.model },
      }));
      setCompletedCount(1);

      if (timerRef.current) clearInterval(timerRef.current);

      // ── STEP 3: Save character immediately with hero only ──
      setGenPhase("saving");
      const ageLabel = AGE_RANGES.find((a) => a.value === form.ageRange)?.label || form.ageRange;
      const outfitLabel = OUTFIT_STYLES.find((o) => o.value === form.outfitStyle)?.label || form.outfitStyle;
      const { data, error } = await supabase
        .from("characters")
        .insert({
          user_id: user!.id,
          name: form.name,
          gender: form.gender,
          type: form.gender === "female" ? "Wanita" : "Pria",
          age_range: ageLabel,
          style: outfitLabel,
          tags: [form.gender === "female" ? "Wanita" : "Pria", ageLabel, outfitLabel],
          description: identityBlock.substring(0, 200),
          config: form as any,
          identity_prompt: identityBlock,
          hero_image_url: heroUrl,
          thumbnail_url: heroUrl,
          reference_images: [heroUrl],
          shot_metadata: {
            hero_portrait: { url: heroUrl, taskId: heroTaskId, model: SHOT_CONFIGS.hero_portrait.model },
          } as any,
          gradient_from: "emerald-900/40",
          gradient_to: "teal-900/40",
          is_preset: false,
          reference_photo_url: refUrls[0] || "",
        } as any)
        .select("id")
        .single();

      if (!error && data) {
        setSavedId(data.id);
        toast({
          title: "Karakter berhasil dibuat!",
          description: "Hero portrait siap digunakan. Generate variasi kapan saja.",
        });
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
    const remainingImageInput: string[] = refUrls.length > 0 ? [...refUrls, heroUrl] : [heroUrl];

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
              skinCondition: form.skinCondition,
              advancedContext: identityData.advancedContext,
              hasReferencePhoto: hasRef,
              faceLock: identityData.faceLock,
              styleBlock: identityData.styleBlock,
            });
            try {
              const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
                method: "POST",
                headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: cfg.model,
                  input: {
                    prompt: shotPrompt,
                    image_input: remainingImageInput,
                    aspect_ratio: "3:4",
                    resolution: "2K",
                    output_format: "jpg",
                  },
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
          }),
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

      await supabase
        .from("characters")
        .update({
          reference_images: allUrls,
          shot_metadata: allMetadata as any,
        } as any)
        .eq("id", savedId);

      toast({
        title: "Variasi selesai!",
        description: `${Object.keys(finalResults).length} variasi berhasil di-generate.`,
      });
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

    const imageInput: string[] = refUrls.length > 0 ? [...refUrls, heroUrl] : [heroUrl];
    const shotPrompt = assemblePrompt(key, identityData.identityBlock, identityData.consistencyAnchors, {
      skinCondition: form.skinCondition,
      advancedContext: identityData.advancedContext,
      hasReferencePhoto: hasRef,
      faceLock: identityData.faceLock,
      styleBlock: identityData.styleBlock,
    });

    try {
      const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: SHOT_CONFIGS[key].model,
          input: {
            prompt: shotPrompt,
            image_input: imageInput,
            aspect_ratio: "3:4",
            resolution: "2K",
            output_format: "jpg",
          },
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

      await supabase
        .from("characters")
        .update({
          reference_images: allUrls,
          shot_metadata: shotMeta,
        } as any)
        .eq("id", savedId);

      toast({ title: `${SHOT_CONFIGS[key].label} selesai!` });
    } catch (e: any) {
      setShots((p) => ({ ...p, [key]: { status: "failed", model: SHOT_CONFIGS[key].model } }));
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingSingleShot(null);
    }
  };

  // ── SUMMARY PILLS ──
  const pills = [
    form.gender === "female" ? "Wanita" : "Pria",
    AGE_RANGES.find((a) => a.value === form.ageRange)?.label,
    SKIN_TONES.find((s) => s.value === form.skinTone)?.label,
    VIBES.find((v) => v.value === form.vibe)?.label,
    OUTFIT_STYLES.find((o) => o.value === form.outfitStyle)?.label,
    form.gender === "female" && form.hijabStyle !== "tanpa"
      ? HIJAB_STYLES.find((h) => h.value === form.hijabStyle)?.label
      : null,
  ].filter(Boolean);

  // ── Progress label ──
  const progressLabel = (() => {
    switch (genPhase) {
      case "identity":
        return "Membuat identity prompt...";
      case "hero":
        return "Membuat hero portrait...";
      case "variations":
        return `Generating variasi... (${completedCount - 1}/5)`;
      case "saving":
        return "Menyimpan karakter...";
      default:
        return "";
    }
  })();

  const heroDone = shots.hero_portrait.status === "success";
  const allVariationsDone = REMAINING_KEYS.every((k) => shots[k].status === "success");
  const anyVariationGenerating = REMAINING_KEYS.some((k) => shots[k].status === "generating");
  const variationsDoneCount = REMAINING_KEYS.filter((k) => shots[k].status === "success").length;

  // Templates filtered by gender
  const filteredTemplates = CHARACTER_TEMPLATES.filter((t) => t.gender === form.gender);
  const selectedTmpl = CHARACTER_TEMPLATES.find((t) => t.id === selectedTemplate);

  // Hair styles based on gender
  const hairStyles = form.gender === "female" ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── LEFT COLUMN: FORM ── */}
        <div className="flex-1 min-w-0 space-y-6 animate-fade-up">
          <div>
            <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase mb-1">Buat Karakter Baru</h1>
            <p className="text-sm text-muted-foreground mb-4">Kustomisasi karakter AI untuk konten UGC kamu</p>
          </div>

          {/* Reference Photo Upload (Multi) */}
          <FormGroup label={`Referensi Wajah (${refPreviews.length}/5)`}>
            <div className="grid grid-cols-3 gap-2">
              {refPreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Ref ${i + 1}`}
                    className="w-full h-full rounded-xl object-cover border border-border"
                  />
                  <button
                    onClick={() => removeRef(i)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {refPreviews.length < 5 && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length) handleMultiRefUpload(e.dataTransfer.files);
                  }}
                  onClick={() => {
                    const inp = document.createElement("input");
                    inp.type = "file";
                    inp.accept = "image/jpeg,image/png,image/webp";
                    inp.multiple = true;
                    inp.onchange = (ev) => {
                      const files = (ev.target as HTMLInputElement).files;
                      if (files?.length) handleMultiRefUpload(files);
                    };
                    inp.click();
                  }}
                  className="aspect-square border-2 border-dashed border-border rounded-xl bg-background hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  {refUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Tambah</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/60 mt-2 leading-relaxed">
              Upload 1-5 foto dari berbagai sudut (depan, samping, 3/4) untuk hasil lebih akurat
            </p>
          </FormGroup>

          {/* ── QUICK TEMPLATES ── */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Quick Template
            </label>
            {selectedTemplate && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Template: {selectedTmpl?.name} {templateEdited ? "(edited)" : "✓"}
                </span>
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateEdited(false);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  ✕ Reset
                </button>
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {filteredTemplates.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => applyTemplate(tmpl)}
                    className={`shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 transition-all text-left ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/10"
                        : "bg-muted/50 border border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md shrink-0" style={{ background: tmpl.previewGradient }} />
                    <div>
                      <p className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {tmpl.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[100px]">{tmpl.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* ── SECTION: IDENTITAS DASAR ── */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="space-y-5">
            <SectionHeader>Identitas Dasar</SectionHeader>

            <FormGroup label="Nama Karakter">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Contoh: Sarah, Andi, Mbak Dewi"
                className="bg-muted/50 border-border"
              />
            </FormGroup>

            <FormGroup label="Gender">
              <div className="flex gap-2">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => set("gender", g)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${form.gender === g ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {g === "female" ? "Wanita" : "Pria"}
                  </button>
                ))}
              </div>
            </FormGroup>

            <FormGroup label="Rentang Umur">
              <Select value={form.ageRange} onValueChange={(v) => set("ageRange", v)}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormGroup>
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* ── SECTION: PENAMPILAN (conditionally hidden) ── */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="space-y-5">
            <SectionHeader>Penampilan</SectionHeader>

            {hasRef ? (
              <div className="flex items-center gap-2 text-xs text-primary/60 bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Auto-detected dari foto referensi</span>
              </div>
            ) : (
              <>
                <FormGroup label="Warna Kulit">
                  <div className="flex gap-4 flex-wrap">
                    {SKIN_TONES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => set("skinTone", t.value)}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={`w-9 h-9 rounded-full transition-all ${form.skinTone === t.value ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                          style={{ backgroundColor: t.hex }}
                        />
                        <span className="text-[11px] text-muted-foreground">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </FormGroup>

                <FormGroup label="Tipe Wajah">
                  <Select value={form.faceType} onValueChange={(v) => set("faceType", v)}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACE_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormGroup>

                <FormGroup label="Warna & Gaya Rambut">
                  <Select value={form.hairStyle} onValueChange={(v) => set("hairStyle", v)}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {hairStyles.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormGroup>

                <FormGroup label="Tipe Badan">
                  <Select value={form.bodyType} onValueChange={(v) => set("bodyType", v)}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormGroup>
              </>
            )}
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* ── SECTION: DETAIL REALISME ── */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="space-y-5">
            <SectionHeader>Detail Realisme</SectionHeader>

            <FormGroup label="Kondisi Kulit">
              <Select value={form.skinCondition} onValueChange={(v) => set("skinCondition", v)}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKIN_CONDITIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Level Makeup">
              <Select value={form.makeupLevel} onValueChange={(v) => set("makeupLevel", v)}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAKEUP_LEVELS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormGroup>
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* ── SECTION: STYLE ── */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="space-y-5">
            <SectionHeader>Style</SectionHeader>

            {form.gender === "female" && (
              <FormGroup label="Hijab Style">
                <Select value={form.hijabStyle} onValueChange={(v) => set("hijabStyle", v)}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HIJAB_STYLES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormGroup>
            )}

            <FormGroup label="Gaya Outfit">
              <Select value={form.outfitStyle} onValueChange={(v) => set("outfitStyle", v)}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTFIT_STYLES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Aksesoris">
              <Select value={form.accessories} onValueChange={(v) => set("accessories", v)}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESSORIES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Vibe / Karakter">
              <Select value={form.vibe} onValueChange={(v) => set("vibe", v)}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIBES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormGroup>

            <FormGroup label="Catatan Tambahan (Opsional)">
              <Textarea
                value={form.customNotes}
                onChange={(e) => set("customNotes", e.target.value)}
                rows={3}
                placeholder="Detail tambahan..."
                className="bg-muted/50 border-border"
              />
            </FormGroup>
          </div>
        </div>

        {/* ── RIGHT COLUMN: PREVIEW ── */}
        <div
          className="w-full lg:w-[480px] shrink-0 lg:sticky lg:top-8 self-start animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-5 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Preview Karakter</p>

            {refPreviews.length > 0 && (
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  {refPreviews.slice(0, 3).map((p, i) => (
                    <img
                      key={i}
                      src={p}
                      alt={`Ref ${i + 1}`}
                      className="h-10 w-10 rounded-full object-cover border-2 border-card"
                    />
                  ))}
                  {refPreviews.length > 3 && (
                    <div className="h-10 w-10 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                      +{refPreviews.length - 3}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                    {refPreviews.length} Foto Referensi
                  </p>
                  <p className="text-[11px] text-primary/70">Wajah akan dicocokkan</p>
                </div>
              </div>
            )}

            {form.name && <p className="font-bold font-satoshi mb-2">{form.name}</p>}
            <div className="flex flex-wrap gap-1.5">
              {pills.map((p) => (
                <span key={p} className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Progress */}
          {(isGenerating || isGeneratingVariations) && (
            <div className="mb-4 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  {(genPhase === "hero" || genPhase === "variations") && (
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                  {progressLabel}
                </span>
                <span>{elapsed}s</span>
              </div>
              <Progress
                value={
                  isGeneratingVariations
                    ? ((completedCount - 1) / 5) * 100
                    : genPhase === "hero"
                      ? 50
                      : genPhase === "saving"
                        ? 90
                        : 10
                }
                className="h-2 bg-secondary"
              />
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
              const canClickToGenerate =
                isVariation &&
                heroDone &&
                savedId &&
                shot.status === "idle" &&
                !isGeneratingVariations &&
                !generatingSingleShot;

              return (
                <div
                  key={key}
                  className={`relative aspect-[3/4] bg-muted/50 border rounded-xl flex flex-col items-center justify-center gap-2 overflow-hidden transition-all ${
                    isHero && shot.status === "success"
                      ? "border-primary/50 ring-1 ring-primary/20"
                      : canClickToGenerate
                        ? "border-dashed border-muted-foreground/20 hover:border-primary/40 cursor-pointer"
                        : "border-border"
                  }`}
                  onClick={canClickToGenerate ? () => handleGenerateSingleShot(key) : undefined}
                >
                  {shot.status === "success" && shot.url ? (
                    <img
                      src={shot.url}
                      alt={cfg.label}
                      className="absolute inset-0 w-full h-full object-cover animate-fade-in cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedShot({ url: shot.url!, label: cfg.label });
                      }}
                    />
                  ) : shot.status === "generating" ? (
                    <div className="absolute inset-0 generation-mesh flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-primary/60 animate-spin" />
                    </div>
                  ) : shot.status === "failed" ? (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  ) : (
                    <Icon
                      className={`w-6 h-6 ${canClickToGenerate ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}
                    />
                  )}
                  {shot.status !== "success" && (
                    <span
                      className={`text-[11px] uppercase tracking-wider text-center px-1 ${canClickToGenerate ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}
                    >
                      {cfg.label}
                    </span>
                  )}
                  {canClickToGenerate && <span className="text-[9px] text-primary/60 mt-1">Klik untuk generate</span>}
                  {shot.status === "success" && shot.url && (
                    <>
                      <CheckCircle2 className="absolute top-1.5 right-1.5 w-4 h-4 text-green-500 drop-shadow" />
                      {getUpscaleState(key).factor && (
                        <span className="absolute top-1.5 left-1.5 bg-primary/20 text-primary text-[9px] rounded-full px-1.5 font-medium">
                          {getUpscaleState(key).factor}x
                        </span>
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
                  <span
                    className={`absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded font-medium ${isPro ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"}`}
                  >
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
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                    1x Nano Banana Pro (2K) • Variasi opsional setelahnya
                  </p>
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
                    {5 - variationsDoneCount} variasi tersisa (+~Rp{" "}
                    {((5 - variationsDoneCount) * 700).toLocaleString("id-ID")})
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
              Generate {5 - variationsDoneCount} Variasi (+~Rp{" "}
              {((5 - variationsDoneCount) * 700).toLocaleString("id-ID")})
            </Button>
          )}

          {/* Main action buttons */}
          {savedId ? (
            <div className="space-y-2 animate-fade-in">
              <Button
                onClick={() => navigate(`/generate?characterId=${savedId}`)}
                className="w-full py-3.5 font-bold uppercase tracking-wider"
              >
                Gunakan Untuk Generate
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/characters")}
                className="w-full py-3.5 font-bold uppercase tracking-wider"
              >
                Lihat Semua Karakter
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 font-bold uppercase tracking-wider animate-cta-glow"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> {progressLabel || "Generating..."}
                </>
              ) : (
                "Generate Karakter (~Rp 1.440)"
              )}
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
          <button
            className="fixed top-4 right-4 text-foreground/70 hover:text-foreground z-[101]"
            onClick={() => setZoomedShot(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={zoomedShot.url}
            alt={zoomedShot.label}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
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

// ── SECTION HEADER COMPONENT ──
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{children}</p>
    </div>
  );
}

// ── FORM GROUP COMPONENT ──
function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2.5">
        {label}
      </label>
      {children}
    </div>
  );
}
