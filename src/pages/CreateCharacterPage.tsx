import { useState, useRef } from "react";
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
} from "lucide-react";
import UpscaleButton from "@/components/UpscaleButton";

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
const REALISM_BASE = "Ultra-realistic photographic portrait, commercial photography, real-world studio photography, cinematic realism, lifelike details, true-to-life textures.";

const LIGHTING_BLOCK = "Professional studio lighting setup: soft key light from 45 degrees creating gentle modeling on the face, fill light reducing harsh shadows, subtle rim light separating subject from background. Warm neutral tones that complement Southeast Asian skin. No harsh directional shadows, no artificial color cast. Clean, professional, flattering but natural.";

const SKIN_BLOCK = "Skin is realistic and natural with soft visible texture — subtle pores visible at close inspection but not exaggerated, healthy even complexion with gentle natural variation, slight natural oil sheen on forehead and nose, realistic but not gritty. Minimal natural makeup: soft even base, subtle lip tint, natural brow grooming, fresh and awake-looking. No heavy contouring, no Instagram filter look, no plastic smoothing, no beauty app retouching — but also not raw or unflattering. Think: how a real person looks after light makeup and good lighting at a professional photo session.";

const QUALITY_BLOCK = "8K resolution, ultra-high detail, photographic realism, sharp focus, natural color grading, realistic contrast, clean studio image quality.";

const NEGATIVE_BLOCK = "No cartoon, no anime, no CGI, no 3D render, no plastic skin, no over-smoothing, no glamour filter, no artificial glow, no fantasy lighting, no neon, no watermark, no text overlay, no distorted features, no extra fingers, no warped proportions, no game engine look, no hyper-saturated colors, no beauty app filter, no Instagram filter.";

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
    camera: "Shot on a full-frame mirrorless camera, 50mm lens, f/2.0 aperture, shallow depth of field.",
    framing: "Head and shoulders, turned 45 degrees to the right, looking slightly past camera. Expression is calm, natural, thoughtful. Background is a smooth soft grey studio gradient, same as hero shot.",
    icon: RotateCcw,
  },
  talking: {
    label: "Talking", model: "nano-banana-2",
    camera: "Shot on a full-frame mirrorless camera, 50mm lens, f/1.8 aperture.",
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
    camera: "Shot on a full-frame mirrorless camera, 85mm portrait lens, f/1.8 aperture, extreme close-up, face fills entire frame.",
    framing: "Face filling the entire frame from forehead to chin. Direct calm gaze, neutral relaxed expression. Background is completely blurred out of focus. Focus on realistic skin texture, pore detail, natural skin quality.",
    icon: Search,
  },
  product_interaction: {
    label: "Product", model: "nano-banana-2",
    camera: "Shot on a full-frame mirrorless camera, 50mm lens, f/2.0 aperture, sharp focus on face and hands.",
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
};

// ── HELPER: Convert image URL to base64 ──
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

// ── HELPER: Assemble prompt for a shot ──
function assemblePrompt(
  shotKey: ShotKey,
  identityBlock: string,
  consistencyAnchors: string[],
) {
  const cfg = SHOT_CONFIGS[shotKey];
  return [
    REALISM_BASE,
    cfg.camera,
    identityBlock,
    `MANDATORY consistency anchors: ${consistencyAnchors.join(", ")}`,
    cfg.framing,
    LIGHTING_BLOCK,
    SKIN_BLOCK,
    QUALITY_BLOCK,
    NEGATIVE_BLOCK,
  ].join("\n\n");
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

export default function CreateCharacterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { kieApiKey, geminiKey } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { upscale, getState: getUpscaleState } = useUpscale();

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

  // Reference photo state
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [refUrl, setRefUrl] = useState<string | null>(null);
  const [refUploading, setRefUploading] = useState(false);

  const set = (key: keyof FormData, val: string) => setForm((p) => ({ ...p, [key]: val }));

  // ── Reference photo upload ──
  const handleRefUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 5MB", variant: "destructive" });
      return;
    }
    setRefFile(file);
    setRefPreview(URL.createObjectURL(file));
    setRefUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user!.id}/references/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("character-packs").upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      setRefUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("character-packs").getPublicUrl(path);
    setRefUrl(urlData.publicUrl);
    setRefUploading(false);
  };

  const removeRef = () => {
    setRefFile(null);
    setRefPreview(null);
    setRefUrl(null);
  };

  // ── GENERATION FLOW (GENBOX Sequential) ──
  const handleGenerate = async () => {
    if (!form.name.trim()) { toast({ title: "Nama wajib diisi", variant: "destructive" }); return; }
    if (!kieApiKey || !geminiKey) {
      toast({ title: "Setup API keys dulu di Settings", description: "Buka Settings → API Keys untuk memasukkan key Kie AI dan Gemini.", variant: "destructive" });
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

      // Build multimodal parts for Gemini
      const geminiParts: any[] = [];

      // If reference photo exists, include it as vision input
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
        text: `Based on these attributes, create an extremely detailed identity description for a realistic Indonesian person for AI image generation.\n\nAttributes:\n- Gender: ${form.gender === "female" ? "Female" : "Male"}\n- Age range: ${form.age_range}\n- Skin tone: ${skinToneEnglish}\n- Face shape: ${form.face_shape}\n- Eye color: ${form.eye_color}\n- Hair style: ${form.hair_style}\n- Hair color: ${form.hair_color}\n- Expression tendency: ${form.expression}\n- Outfit style: ${form.outfit_style}\n- Skin condition: ${form.skin_condition}\n- Additional notes: ${form.custom_notes || "none"}\n${refUrl ? "\nIMPORTANT: A reference photo was provided. Your identity_block MUST describe the person in the photo as accurately as possible. Use the form attributes as supplementary styling guidance only." : ""}\n\nRespond ONLY with valid JSON, no markdown:\n{\n  "identity_block": "A single detailed paragraph in English describing the EXACT physical appearance — face shape, specific nose type, lip shape, jawline, skin details, exact hair description with color and style, exact outfit with specific colors and materials. Include 3-5 distinctive anchor features (like a beauty mark, specific nose shape, dimples, etc) that should appear in every image.",\n  "hair_description": "Detailed hair description",\n  "outfit_description": "Specific outfit with exact colors and materials",\n  "consistency_anchors": ["anchor1", "anchor2", "anchor3"]\n}`,
      });

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${promptModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: "You are an expert at writing hyper-specific physical descriptions of people for AI image generation. Your descriptions must be extremely detailed and specific to ensure visual consistency across multiple generated images." }],
            },
            contents: [{ parts: geminiParts }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      const geminiData = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Gagal generate identity prompt dari Gemini");
      const identityJson = JSON.parse(rawText);
      const identityBlock: string = identityJson.identity_block;
      const consistencyAnchors: string[] = identityJson.consistency_anchors || [];

      // ── STEP 2: Generate hero portrait ──
      setGenPhase("hero");
      setShots((p) => ({ ...p, hero_portrait: { status: "generating", model: SHOT_CONFIGS.hero_portrait.model } }));

      const heroPrompt = assemblePrompt("hero_portrait", identityBlock, consistencyAnchors);
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

      // ── STEP 3: Generate remaining 5 shots using hero as reference (parallel) ──
      setGenPhase("variations");
      REMAINING_KEYS.forEach((k) => {
        setShots((p) => ({ ...p, [k]: { status: "generating", model: SHOT_CONFIGS[k].model } }));
      });

      let done = 1;
      const finalResults: Record<string, { url: string; taskId: string; model: string }> = {
        hero_portrait: { url: heroUrl, taskId: heroTaskId, model: SHOT_CONFIGS.hero_portrait.model },
      };

      // Build image_input for remaining shots
      const remainingImageInput: string[] = refUrl ? [refUrl, heroUrl] : [heroUrl];

      await Promise.all(
        REMAINING_KEYS.map(async (key) => {
          const cfg = SHOT_CONFIGS[key];
          const shotPrompt = assemblePrompt(key, identityBlock, consistencyAnchors);

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

      if (timerRef.current) clearInterval(timerRef.current);

      // ── STEP 4: Save ──
      setGenPhase("saving");
      if (finalResults.hero_portrait?.url) {
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
          hero_image_url: finalResults.hero_portrait.url,
          thumbnail_url: finalResults.hero_portrait.url,
          reference_images: SHOT_KEYS.map((k) => finalResults[k]?.url || "").filter(Boolean),
          shot_metadata: finalResults as any,
          gradient_from: "emerald-900/40",
          gradient_to: "teal-900/40",
          is_preset: false,
          reference_photo_url: refUrl || "",
        } as any).select("id").single();

        if (!error && data) {
          setSavedId(data.id);
          toast({ title: "Karakter berhasil dibuat!" });
        }
      } else {
        toast({ title: "Hero portrait gagal", description: "Coba lagi.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      if (timerRef.current) clearInterval(timerRef.current);
    } finally {
      setIsGenerating(false);
      setGenPhase("idle");
    }
  };

  // ── SUMMARY PILLS ──
  const pills = [
    form.gender === "female" ? "Wanita" : "Pria",
    form.age_range, form.skin_tone, form.face_shape, form.eye_color,
    form.hair_style, form.hair_color, form.expression, form.outfit_style, form.skin_condition,
  ].filter(Boolean);

  // ── Progress label ──
  const progressLabel = (() => {
    switch (genPhase) {
      case "identity": return "Membuat identity prompt...";
      case "hero": return "Membuat hero portrait... (1/6)";
      case "variations": return `Generating variasi... (${completedCount}/6)`;
      case "saving": return "Menyimpan karakter...";
      default: return "";
    }
  })();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── LEFT COLUMN: FORM ── */}
        <div className="flex-1 min-w-0 space-y-6 animate-fade-up">
          <div>
            <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase mb-1">Buat Karakter Baru</h1>
            <p className="text-sm text-muted-foreground mb-6">Kustomisasi karakter AI untuk konten UGC kamu</p>
          </div>

          {/* Reference Photo Upload */}
          <FormGroup label="Referensi Wajah (Opsional)">
            {refPreview ? (
              <div className="relative inline-block">
                <img src={refPreview} alt="Reference" className="h-[120px] w-[120px] rounded-xl object-cover border border-border" />
                <button
                  onClick={removeRef}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
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
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleRefUpload(file);
                }}
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file";
                  inp.accept = "image/jpeg,image/png,image/webp";
                  inp.onchange = (ev) => {
                    const f = (ev.target as HTMLInputElement).files?.[0];
                    if (f) handleRefUpload(f);
                  };
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
              Upload foto close-up wajah untuk hasil karakter yang lebih mirip. Tips: 1 orang, wajah terlihat jelas, pencahayaan bagus, menghadap kamera.
            </p>
            <p className="text-[11px] text-primary/70 mt-1 italic">
              Tanpa foto referensi, AI akan membuat wajah baru dari deskripsi form.
            </p>
          </FormGroup>

          {/* Name */}
          <FormGroup label="Nama Karakter">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Contoh: Sarah Hijab" className="bg-[#1A1A1A] border-border" />
          </FormGroup>

          {/* Gender */}
          <FormGroup label="Gender">
            <div className="flex gap-2">
              {(["female", "male"] as Gender[]).map((g) => (
                <button key={g} onClick={() => set("gender", g)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${form.gender === g ? "bg-primary text-primary-foreground" : "bg-[#1A1A1A] border border-border text-muted-foreground hover:text-foreground"}`}>
                  {g === "female" ? "Wanita" : "Pria"}
                </button>
              ))}
            </div>
          </FormGroup>

          {/* Age Range */}
          <FormGroup label="Rentang Usia">
            <Select value={form.age_range} onValueChange={(v) => set("age_range", v)}>
              <SelectTrigger className="bg-[#1A1A1A] border-border"><SelectValue placeholder="Pilih usia" /></SelectTrigger>
              <SelectContent>
                {["17-22 tahun", "20-25 tahun", "25-30 tahun", "30-40 tahun", "40-50 tahun"].map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Skin Tone */}
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

          {/* Face Shape */}
          <FormGroup label="Bentuk Wajah">
            <Select value={form.face_shape} onValueChange={(v) => set("face_shape", v)}>
              <SelectTrigger className="bg-[#1A1A1A] border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {["Oval", "Bulat", "Kotak", "Hati", "Lonjong"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Eye Color */}
          <FormGroup label="Warna Mata">
            <Select value={form.eye_color} onValueChange={(v) => set("eye_color", v)}>
              <SelectTrigger className="bg-[#1A1A1A] border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {["Coklat Tua", "Coklat Madu", "Hitam", "Coklat Terang"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Hair Style */}
          <FormGroup label="Gaya Rambut">
            <Select value={form.hair_style} onValueChange={(v) => set("hair_style", v)}>
              <SelectTrigger className="bg-[#1A1A1A] border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {HAIR_STYLES[form.gender].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Hair Color */}
          <FormGroup label="Warna Rambut">
            <Select value={form.hair_color} onValueChange={(v) => set("hair_color", v)}>
              <SelectTrigger className="bg-[#1A1A1A] border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {["Hitam", "Coklat Tua", "Coklat Madu", "Highlighted"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Expression */}
          <FormGroup label="Ekspresi">
            <Select value={form.expression} onValueChange={(v) => set("expression", v)}>
              <SelectTrigger className="bg-[#1A1A1A] border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {["Hangat & Ramah", "Percaya Diri", "Kalem Profesional", "Energik Ceria", "Lembut Natural"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Outfit Style */}
          <FormGroup label="Gaya Outfit">
            <Select value={form.outfit_style} onValueChange={(v) => set("outfit_style", v)}>
              <SelectTrigger className="bg-[#1A1A1A] border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {["Casual Modern", "Smart Casual", "Hijab Modern", "Streetwear", "Athletic", "Professional", "Beauty/Glam"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Skin Condition */}
          <FormGroup label="Kondisi Kulit">
            <Select value={form.skin_condition} onValueChange={(v) => set("skin_condition", v)}>
              <SelectTrigger className="bg-[#1A1A1A] border-border"><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {["Bersih Natural", "Sedikit Freckles", "Glowing Sehat", "Matte Clean"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Custom Notes */}
          <FormGroup label="Catatan Tambahan (Opsional)">
            <Textarea value={form.custom_notes} onChange={(e) => set("custom_notes", e.target.value)} rows={3} placeholder="Detail tambahan..." className="bg-[#1A1A1A] border-border" />
          </FormGroup>
        </div>

        {/* ── RIGHT COLUMN: PREVIEW ── */}
        <div className="w-full lg:w-[480px] shrink-0 lg:sticky lg:top-8 self-start animate-fade-up" style={{ animationDelay: "100ms" }}>
          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-5 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Preview Karakter</p>

            {/* Reference photo thumbnail */}
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
          {isGenerating && (
            <div className="mb-4 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  {genPhase === "hero" && <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  {progressLabel}
                </span>
                <span>{elapsed}s</span>
              </div>
              <Progress value={(completedCount / 6) * 100} className="h-2 bg-[#2A2A2A]" />
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
              return (
                <div key={key} className={`relative aspect-[3/4] bg-[#1A1A1A] border rounded-xl flex flex-col items-center justify-center gap-2 overflow-hidden ${isHero && shot.status === "success" ? "border-primary/50 ring-1 ring-primary/20" : "border-[#2A2A2A]"}`}>
                  {shot.status === "success" && shot.url ? (
                    <img src={shot.url} alt={cfg.label} className="absolute inset-0 w-full h-full object-cover animate-fade-in cursor-pointer" onClick={() => setZoomedShot({url: shot.url!, label: cfg.label})} />
                  ) : shot.status === "generating" ? (
                    <div className="absolute inset-0 generation-mesh flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-primary/60 animate-spin" />
                    </div>
                  ) : shot.status === "failed" ? (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  ) : (
                    <Icon className="w-6 h-6 text-[#555]" />
                  )}
                  {shot.status !== "success" && (
                    <span className="text-[11px] text-[#555] uppercase tracking-wider text-center px-1">{cfg.label}</span>
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
                  {/* Model badge */}
                  <span className={`absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded font-medium ${isPro ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"}`}>
                    {isPro ? "PRO" : "FAST"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cost indicator */}
          <div className="flex items-start gap-2 bg-card border border-border rounded-lg p-3 mb-4 text-xs text-muted-foreground">
            <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p>Estimasi: ~64 credits (~Rp 5.120) untuk 6 gambar</p>
              <p className="text-[11px] text-[#555] mt-0.5">2x Nano Banana Pro (hero + detail) + 4x Nano Banana 2 (sisanya)</p>
            </div>
          </div>

          {/* Generate / success buttons */}
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
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {progressLabel || "Generating..."}</> : "Generate Karakter"}
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
          <button className="fixed top-4 right-4 text-white/70 hover:text-white z-[101]" onClick={() => setZoomedShot(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={zoomedShot.url} alt={zoomedShot.label} className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          <p className="text-white/70 text-sm mt-3">{zoomedShot.label}</p>
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
