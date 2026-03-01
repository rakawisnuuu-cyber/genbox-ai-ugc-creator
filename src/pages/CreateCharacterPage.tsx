import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
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
  Zap, CheckCircle2, Loader2, AlertCircle,
} from "lucide-react";

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

const SHOT_CONFIGS: Record<ShotKey, { label: string; model: string; framing: string; icon: typeof Camera }> = {
  hero_portrait: {
    label: "Hero Portrait", model: "nano-banana-pro",
    framing: "Close-up portrait headshot, soft studio lighting, shallow depth of field, looking at camera with warm expression, clean neutral background",
    icon: Camera,
  },
  profile_3_4: {
    label: "3/4 Profile", model: "nano-banana-2",
    framing: "Three-quarter angle portrait, natural side lighting, gentle smile, soft bokeh background, editorial style",
    icon: RotateCcw,
  },
  talking: {
    label: "Talking", model: "nano-banana-2",
    framing: "Mid-shot of person talking naturally, candid moment, hand gesturing, casual indoor setting, natural window light",
    icon: Mic,
  },
  full_body: {
    label: "Full Body", model: "nano-banana-2",
    framing: "Full body standing shot, head to toe visible, relaxed confident pose, minimal clean background, fashion editorial style",
    icon: PersonStanding,
  },
  skin_detail: {
    label: "Skin Detail", model: "nano-banana-pro",
    framing: "Extreme close-up of face showing skin texture and detail, macro photography style, soft even lighting, focus on natural skin quality",
    icon: Search,
  },
  product_interaction: {
    label: "Product", model: "nano-banana-2",
    framing: "Person holding a small product box near face level, natural smile, product clearly visible, clean studio background, UGC style photo",
    icon: Hand,
  },
};

const SHOT_KEYS: ShotKey[] = ["hero_portrait", "profile_3_4", "talking", "full_body", "skin_detail", "product_interaction"];

const DEFAULT_FORM: FormData = {
  name: "", gender: "female", age_range: "", skin_tone: "Sawo Terang",
  face_shape: "", eye_color: "", hair_style: "", hair_color: "",
  expression: "", outfit_style: "", skin_condition: "", custom_notes: "",
};

export default function CreateCharacterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { kieApiKey, geminiKey } = useApiKeys();

  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shots, setShots] = useState<Record<ShotKey, ShotResult>>(() => {
    const init: any = {};
    SHOT_KEYS.forEach((k) => (init[k] = { status: "idle" as ShotStatus, model: SHOT_CONFIGS[k].model }));
    return init;
  });
  const [completedCount, setCompletedCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const set = (key: keyof FormData, val: string) => setForm((p) => ({ ...p, [key]: val }));

  // ── GENERATION FLOW ──
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
    const resetShots: any = {};
    SHOT_KEYS.forEach((k) => (resetShots[k] = { status: "generating", model: SHOT_CONFIGS[k].model }));
    setShots(resetShots);

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    try {
      // Step 2 — Gemini identity prompt
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert character identity prompt builder for AI image generation. Based on these attributes, create a SINGLE detailed English identity description paragraph for a realistic Indonesian person. Include physical appearance, skin tone, facial features, hair, expression, and outfit. Be specific and visual.\n\nAttributes:\n- Gender: ${form.gender}\n- Age: ${form.age_range}\n- Skin tone: ${form.skin_tone}\n- Face shape: ${form.face_shape}\n- Eye color: ${form.eye_color}\n- Hair style: ${form.hair_style}\n- Hair color: ${form.hair_color}\n- Expression: ${form.expression}\n- Outfit: ${form.outfit_style}\n- Skin condition: ${form.skin_condition}\n- Custom notes: ${form.custom_notes}\n\nRespond ONLY with the identity description, no explanations.`,
              }],
            }],
          }),
        }
      );
      const geminiData = await geminiRes.json();
      const identityPrompt = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!identityPrompt) throw new Error("Gagal generate identity prompt dari Gemini");

      // Step 4 — Create all 6 tasks in parallel
      const taskResults = await Promise.all(
        SHOT_KEYS.map(async (key) => {
          const cfg = SHOT_CONFIGS[key];
          const finalPrompt = `${identityPrompt}\n\n${cfg.framing}\n\nHyper-realistic photography, shot on iPhone 15 Pro, natural lighting, 8K detail.`;
          const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: "POST",
            headers: { Authorization: `Bearer ${kieApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: cfg.model,
              input: { prompt: finalPrompt, image_input: [], aspect_ratio: "3:4", resolution: "2K", output_format: "jpg", google_search: false },
            }),
          });
          const json = await res.json();
          if (json.code !== 200) throw new Error(`Task creation failed for ${key}`);
          return { key, taskId: json.data.taskId as string };
        })
      );

      // Step 5 — Poll each task
      let done = 0;
      const finalResults: Record<string, { url: string; taskId: string; model: string }> = {};

      await Promise.all(
        taskResults.map(async ({ key, taskId }) => {
          const cfg = SHOT_CONFIGS[key];
          for (let i = 0; i < 40; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const res = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
              headers: { Authorization: `Bearer ${kieApiKey}` },
            });
            const json = await res.json();
            const state = json?.data?.state;
            if (state === "success") {
              let imageUrl = "";
              try {
                const resultJson = JSON.parse(json.data.resultJson);
                imageUrl = resultJson?.resultUrls?.[0] || resultJson?.url || "";
              } catch { imageUrl = ""; }
              setShots((p) => ({ ...p, [key]: { status: "success", url: imageUrl, taskId, model: cfg.model } }));
              finalResults[key] = { url: imageUrl, taskId, model: cfg.model };
              done++;
              setCompletedCount(done);
              return;
            }
            if (state === "fail") {
              setShots((p) => ({ ...p, [key]: { status: "failed", taskId, model: cfg.model } }));
              done++;
              setCompletedCount(done);
              return;
            }
          }
          // timeout
          setShots((p) => ({ ...p, [key]: { status: "failed", taskId, model: cfg.model } }));
          done++;
          setCompletedCount(done);
        })
      );

      if (timerRef.current) clearInterval(timerRef.current);

      // Step 6 — Save
      if (finalResults.hero_portrait?.url) {
        const { data, error } = await supabase.from("characters").insert({
          user_id: user!.id,
          name: form.name,
          gender: form.gender,
          type: form.gender === "female" ? "Wanita" : "Pria",
          age_range: form.age_range,
          style: form.outfit_style,
          tags: [form.gender === "female" ? "Wanita" : "Pria", form.age_range, form.outfit_style],
          description: identityPrompt.substring(0, 200),
          config: form as any,
          identity_prompt: identityPrompt,
          hero_image_url: finalResults.hero_portrait.url,
          thumbnail_url: finalResults.hero_portrait.url,
          reference_images: SHOT_KEYS.map((k) => finalResults[k]?.url || "").filter(Boolean),
          shot_metadata: finalResults as any,
          gradient_from: "emerald-900/40",
          gradient_to: "teal-900/40",
          is_preset: false,
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
    }
  };

  // ── SUMMARY PILLS ──
  const pills = [
    form.gender === "female" ? "Wanita" : "Pria",
    form.age_range, form.skin_tone, form.face_shape, form.eye_color,
    form.hair_style, form.hair_color, form.expression, form.outfit_style, form.skin_condition,
  ].filter(Boolean);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── LEFT COLUMN: FORM ── */}
        <div className="flex-1 min-w-0 space-y-6 animate-fade-up">
          <div>
            <h1 className="text-xl font-bold font-satoshi tracking-wider uppercase mb-1">Buat Karakter Baru</h1>
            <p className="text-sm text-muted-foreground mb-6">Kustomisasi karakter AI untuk konten UGC kamu</p>
          </div>

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
        <div className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-8 self-start animate-fade-up" style={{ animationDelay: "100ms" }}>
          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-5 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Preview Karakter</p>
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
                <span>Generating karakter... {completedCount}/6</span>
                <span>{elapsed}s</span>
              </div>
              <Progress value={(completedCount / 6) * 100} className="h-2 bg-[#2A2A2A]" />
            </div>
          )}

          {/* 6-shot grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {SHOT_KEYS.map((key) => {
              const cfg = SHOT_CONFIGS[key];
              const shot = shots[key];
              const Icon = cfg.icon;
              const isPro = cfg.model === "nano-banana-pro";
              return (
                <div key={key} className="relative aspect-[3/4] bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl flex flex-col items-center justify-center gap-2 overflow-hidden">
                  {shot.status === "success" && shot.url ? (
                    <img src={shot.url} alt={cfg.label} className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
                  ) : shot.status === "generating" ? (
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  ) : shot.status === "failed" ? (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  ) : (
                    <Icon className="w-6 h-6 text-[#555]" />
                  )}
                  {shot.status !== "success" && (
                    <span className="text-[11px] text-[#555] uppercase tracking-wider text-center px-1">{cfg.label}</span>
                  )}
                  {shot.status === "success" && shot.url && (
                    <CheckCircle2 className="absolute top-1.5 right-1.5 w-4 h-4 text-green-500 drop-shadow" />
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
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : "Generate Karakter"}
            </Button>
          )}
        </div>
      </div>
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
