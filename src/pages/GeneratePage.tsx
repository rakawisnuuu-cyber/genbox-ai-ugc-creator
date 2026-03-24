import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Upload,
  X,
  Loader2,
  ChevronDown,
  ChevronLeft,
  Camera,
  Smartphone,
  CameraIcon,
  RefreshCw,
  ArrowUpRight,
  Film,
  Download,
  Save,
  Plus,
  Zap,
  Star,
  Search,
  Hand,
  Smile,
  Coffee,
  Eye,
  Check,
  Settings,
  PanelRightClose,
  RotateCw,
  MessageSquare,
  ImagePlus,
  Play,
  Mic,
  Layers,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { useCustomCharacters } from "@/hooks/useCustomCharacters";
import { useUpscale } from "@/hooks/useUpscale";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { PRESETS } from "@/lib/character-presets";
import { getEnvironments, type RichOption } from "@/lib/category-options";
import { detectProductDNA, type ProductDNA } from "@/lib/product-dna";
import {
  planImageShots,
  estimateCost,
  formatRupiah,
  SHOT_TYPES,
  type ContentMode,
  type ImageModel,
  type RealismLevel,
  type ImageShotPlan,
  type GenerationConfig,
  type ShotTypeKey,
} from "@/lib/image-generation-engine";
import { supabase } from "@/integrations/supabase/client";
import { fileToBase64, imageUrlToBase64WithMime } from "@/lib/image-utils";
import { analyzeSceneForVideo } from "@/lib/scene-dna";
import { generateVideoAndWait, extendVeoVideo, type VideoModel } from "@/lib/kie-video-generation";
import { geminiFetch } from "@/lib/gemini-fetch";
import {
  getMotionPrompt,
  getTalkingHeadPrompts,
  buildTalkingHeadPrompts,
  getBeatsForDuration,
  getBeatDefinition,
  getMotionPresetsForCategory,
  type VideoModelType as MotionVideoModel,
  type TalkingHeadBeatKey,
  type MotionStyleKey,
} from "@/lib/image-to-video-prompts";

/* ─── Constants ──────────────────────────────────────────────── */
const SHOT_ICONS: Record<string, React.ComponentType<any>> = { Star, Search, Hand, Smile, Coffee, Eye };
type VideoMode = "motion" | "talking" | "story";

const MOTION_MODELS = [
  { id: "grok", label: "Grok (Cepat)", cost: 1240, durations: [6, 10] },
  { id: "kling_std", label: "Kling 3.0 Std", cost: 1860, durations: [3, 5, 8, 10, 12, 15] },
  { id: "kling_pro", label: "Kling 3.0 Pro", cost: 3560, durations: [3, 5, 8, 10, 12, 15] },
  { id: "veo_fast", label: "Veo 3.1 Fast", cost: 4960, durations: [8] },
  { id: "veo_quality", label: "Veo 3.1 Quality", cost: 24800, durations: [8] },
];

const TALK_VEO_MODELS = [
  { id: "veo_fast", label: "Veo 3.1 Fast", costBase: 4960, costExtend: 3720 },
  { id: "veo_quality", label: "Veo 3.1 Quality", costBase: 24800, costExtend: 18600 },
];

const MODEL_INFO: Record<ImageModel, { label: string; desc: string }> = {
  "nano-banana": { label: "Nano Banana (Cepat)", desc: "~Rp 310" },
  "nano-banana-2": { label: "Nano Banana 2", desc: "~Rp 620" },
  "nano-banana-pro": { label: "Nano Banana Pro", desc: "~Rp 1.400" },
};
const ASPECT_RATIOS = ["9:16", "1:1", "4:5", "16:9"];
const RESOLUTIONS = ["1K", "2K", "4K"] as const;

function getTalkCost(veoId: string, dur: number) {
  const m = TALK_VEO_MODELS.find((x) => x.id === veoId) || TALK_VEO_MODELS[1];
  const ext = Math.max(0, Math.floor((dur - 8) / 8));
  return m.costBase + ext * m.costExtend;
}

/* ═══════════════════════════════════════════════════════════════ */

const GeneratePage = () => {
  const { user } = useAuth();
  const { kieApiKey, geminiKey } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { customChars } = useCustomCharacters();
  const { upscale, getState: getUpscaleState } = useUpscale();
  const imgGen = useImageGeneration();

  const [step, setStep] = useState<1 | 2>(1);
  const allChars = useMemo(() => [...(customChars || []), ...PRESETS], [customChars]);
  const [charId, setCharId] = useState<string | null>(null);
  const char = useMemo(() => allChars.find((c) => c.id === charId) || null, [allChars, charId]);
  const [ownUrl, setOwnUrl] = useState<string | null>(null);
  const [ownUploading, setOwnUploading] = useState(false);
  const [prodUrl, setProdUrl] = useState<string | null>(null);
  const [prodPreview, setProdPreview] = useState<string | null>(null);
  const [dna, setDna] = useState<ProductDNA | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<ContentMode>("ugc");
  const [selShots, setSelShots] = useState<ShotTypeKey[]>(["hero"]);
  const envOpts = useMemo(() => getEnvironments(dna?.category || "other"), [dna?.category]);
  const [env, setEnv] = useState<RichOption>(envOpts[0]);
  const [imgModel, setImgModel] = useState<ImageModel>("nano-banana-pro");
  const [imgRes, setImgRes] = useState<"1K" | "2K" | "4K">("2K");
  const [ar, setAr] = useState("9:16");
  const [realism, setRealism] = useState<RealismLevel>("standard");
  const [advOpen, setAdvOpen] = useState(false);
  const [plans, setPlans] = useState<ImageShotPlan[]>([]);
  const [promptPreview, setPromptPreview] = useState<number | null>(null);

  // Video panel state
  const [vpOpen, setVpOpen] = useState(false);
  const [vMode, setVMode] = useState<VideoMode>("motion");
  const [vIdx, setVIdx] = useState<number | null>(null);
  const [mModel, setMModel] = useState("kling_std");
  const [mDur, setMDur] = useState(5);
  const [mPrompt, setMPrompt] = useState("");
  const [tVeo, setTVeo] = useState("veo_quality");
  const [tDur, setTDur] = useState(8);
  const [tScript, setTScript] = useState("");
  const [tPrompt, setTPrompt] = useState("");
  const [vGen, setVGen] = useState(false);
  const [vResults, setVResults] = useState<string[]>([]);
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  const [sPerShotDur, setSPerShotDur] = useState<number[]>([]);

  // Beat dialogue state for talking head
  const [beatDialogues, setBeatDialogues] = useState<Record<TalkingHeadBeatKey, string>>({} as any);
  const [activeMotionPreset, setActiveMotionPreset] = useState<MotionStyleKey | null>(null);

  // Scene DNA cache — keyed by image index to avoid re-analyzing
  const [sceneDNACache, setSceneDNACache] = useState<Record<number, string>>({});
  const [analyzingScene, setAnalyzingScene] = useState(false);

  const prodRef = useRef<HTMLInputElement>(null);
  const ownRef = useRef<HTMLInputElement>(null);

  const cost = estimateCost(imgModel, selShots.length);
  const canGen = !!char && !!prodUrl && !!dna && !!kieApiKey && selShots.length > 0;
  const genning = imgGen.progress.status === "generating";
  const isDone = imgGen.progress.status === "completed";
  const results = imgGen.progress.results.filter(Boolean);
  const charImg = charId === "own-photo" ? ownUrl || "" : char?.hero_image_url || "";
  const arClass =
    ar === "9:16" ? "aspect-[9/16]" : ar === "1:1" ? "aspect-square" : ar === "4:5" ? "aspect-[4/5]" : "aspect-video";
  const mModelInfo = MOTION_MODELS.find((m) => m.id === mModel) || MOTION_MODELS[1];
  const talkCost = getTalkCost(tVeo, tDur);

  const toggle = (k: ShotTypeKey) =>
    setSelShots((p) =>
      p.includes(k) ? (p.length <= 1 ? p : p.filter((s) => s !== k)) : p.length >= 6 ? p : [...p, k],
    );

  // ── Prompt builders ────────────────────────────────────────
  const buildMotionPrompt = useCallback(
    (idx: number) => {
      return getMotionPrompt({
        beat: "hook",
        model: (mModel as MotionVideoModel) || "kling_std",
        character: char?.description || "",
        product: dna?.product_description || "",
        productColor: dna?.dominant_color || "",
        productPackaging: dna?.packaging_type || "",
        environment: env.description,
        skinTone: "sawo matang",
        expression: "natural",
      });
    },
    [mModel, char, dna, env],
  );

  const buildTalkPrompt = useCallback(() => {
    const result = buildTalkingHeadPrompts({
      character: char?.description || "",
      product: dna?.product_description || "",
      productColor: dna?.dominant_color || "",
      productPackaging: dna?.packaging_type || "",
      environment: env.description,
      skinTone: "sawo matang",
      duration: tDur,
      beatDialogues,
      productInteraction: "holding product naturally",
    });
    return result.prompts.join("\n\n---EXTEND---\n\n");
  }, [char, dna, env, tDur, beatDialogues]);

  // ── Open panel handlers ────────────────────────────────────
  const openMotion = useCallback(
    (idx: number) => {
      setVIdx(idx);
      setVMode("motion");
      setVResults([]);
      setVpOpen(true);
      setActiveMotionPreset(null);
      setMPrompt(buildMotionPrompt(idx));
    },
    [buildMotionPrompt],
  );

  const openTalking = useCallback(
    (idx: number) => {
      setVIdx(idx);
      setVMode("talking");
      setVResults([]);
      setVpOpen(true);
      const beats = getBeatsForDuration(tDur);
      const defaults: Record<string, string> = {};
      beats.forEach((bk) => {
        const b = getBeatDefinition(bk);
        defaults[bk] = b.defaultDialogueId(dna?.product_description || "produk ini", dna?.ugc_hook || "");
      });
      setBeatDialogues(defaults as Record<TalkingHeadBeatKey, string>);
      setTScript(dna?.ugc_hook || "");
    },
    [dna, tDur],
  );

  const openStory = useCallback(() => {
    setVIdx(0);
    setVMode("story");
    setVResults([]);
    setVpOpen(true);
    setSPerShotDur(results.map(() => 5));
  }, [results]);

  // Auto-rebuild talking head prompt when beat dialogues or duration change
  useEffect(() => {
    if (vMode === "talking" && vpOpen) {
      setTPrompt(buildTalkPrompt());
    }
  }, [beatDialogues, tDur, vMode, vpOpen, buildTalkPrompt]);

  // ── AI Script Generation ───────────────────────────────────
  const generateBeatScript = useCallback(
    async (beatKey: TalkingHeadBeatKey, beatIdx: number) => {
      if (!geminiKey || !dna) {
        toast({ title: "Setup Gemini API key dulu", variant: "destructive" });
        return;
      }
      const beat = getBeatDefinition(beatKey);
      const prevBeatKey = getBeatsForDuration(tDur)[beatIdx - 1];
      const prevScript = prevBeatKey ? beatDialogues[prevBeatKey] || "" : "";
      const productContext = dna.product_description
        ? `Product: ${dna.product_description} (${dna.category}/${dna.sub_category}). Brand: ${dna.brand_name}. Key benefits: ${dna.key_benefits}. UGC hook: "${dna.ugc_hook}"`
        : "";

      setBeatDialogues((prev) => ({ ...prev, [beatKey]: "..." }));
      try {
        const systemText = `You are a TikTok content script writer specializing in Indonesian casual/gaul language.\n${productContext}\nWrite a short spoken dialog for the '${beat.name}' beat of a UGC product review video.\nBeat purpose: ${beat.description}\nEnergy: ${beat.energy}\nProduct visibility: ${beat.productVisibility}\n\nMaximum 20-25 words (about 8 seconds of natural speech). 2 sentences max. Do NOT write more.\n${prevScript ? `Previous beat's dialog was: '${prevScript}'. This should flow naturally as the next thing the person would say.` : "This is the opening line — make it attention-grabbing."}\nCasual Indonesian (gaul style, like real TikTok). Output ONLY the script text, no quotes.`;
        const json = await geminiFetch(promptModel, geminiKey, {
          systemInstruction: { parts: [{ text: systemText }] },
          contents: [{ parts: [{ text: `Beat: ${beat.nameId} — ${beat.description}` }] }],
        });
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        setBeatDialogues((prev) => ({ ...prev, [beatKey]: text || prev[beatKey] }));
      } catch {
        setBeatDialogues((prev) => ({ ...prev, [beatKey]: prev[beatKey] === "..." ? "" : prev[beatKey] }));
        toast({ title: "Gagal generate script", variant: "destructive" });
      }
    },
    [geminiKey, dna, tDur, beatDialogues, promptModel],
  );

  const generateAllScripts = useCallback(async () => {
    const beats = getBeatsForDuration(tDur);
    for (let i = 0; i < beats.length; i++) {
      await generateBeatScript(beats[i], i);
    }
  }, [tDur, generateBeatScript]);

  // ── Upload handlers ────────────────────────────────────────
  const uploadProd = useCallback(
    async (f: File) => {
      if (!user || !geminiKey) {
        toast({ title: "Setup API key Gemini dulu", variant: "destructive" });
        return;
      }
      setUploading(true);
      setDna(null);
      try {
        setProdPreview(URL.createObjectURL(f));
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("product-images").upload(path, f, { contentType: f.type });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        setProdUrl(data.publicUrl);
        setUploading(false);
        setDetecting(true);
        const b64 = await fileToBase64(f);
        const d = await detectProductDNA(b64, promptModel, geminiKey);
        setDna(d);
        setEnv(getEnvironments(d.category)[0]);
      } catch (e: any) {
        toast({ title: "Upload gagal", description: e.message, variant: "destructive" });
      } finally {
        setUploading(false);
        setDetecting(false);
      }
    },
    [user, geminiKey, promptModel],
  );

  const uploadOwn = useCallback(
    async (f: File) => {
      if (!user) return;
      setOwnUploading(true);
      try {
        const path = `${user.id}/own-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("character-packs").upload(path, f, { contentType: f.type });
        if (error) throw error;
        const { data } = supabase.storage.from("character-packs").getPublicUrl(path);
        setOwnUrl(data.publicUrl);
        setCharId("own-photo");
      } catch (e: any) {
        toast({ title: "Upload gagal", description: e.message, variant: "destructive" });
      } finally {
        setOwnUploading(false);
      }
    },
    [user],
  );

  // ── Generate image ─────────────────────────────────────────
  const generate = useCallback(() => {
    if (!canGen || !char || !dna || !prodUrl) return;
    const cfg: GenerationConfig = {
      mode,
      selectedShots: selShots,
      productDNA: dna,
      characterDescription: char.description,
      characterImageUrl: charImg,
      productImageUrl: prodUrl,
      environment: env,
      realismLevel: realism,
      aspectRatio: ar,
      imageModel: imgModel,
      resolution: imgRes,
    };
    const p = planImageShots(cfg);
    setPlans(p);
    setStep(2);
    imgGen.start({
      shots: p,
      imageModel: imgModel,
      resolution: imgRes,
      aspectRatio: ar,
      kieApiKey: kieApiKey!,
      characterImageUrl: charImg,
      productImageUrl: prodUrl,
    });
  }, [canGen, char, dna, prodUrl, mode, selShots, env, realism, ar, imgModel, imgRes, kieApiKey, charImg]);

  const retry = useCallback(
    (i: number) => {
      if (!plans[i]) return;
      imgGen.retryShot({
        shotIndex: i,
        shot: plans[i],
        imageModel: imgModel,
        resolution: imgRes,
        aspectRatio: ar,
        kieApiKey: kieApiKey!,
        characterImageUrl: charImg,
        productImageUrl: prodUrl || "",
      });
    },
    [plans, imgModel, imgRes, ar, kieApiKey, charImg, prodUrl],
  );

  const downloadFile = useCallback(async (url: string, filename: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast({ title: "Download gagal", variant: "destructive" });
    }
  }, []);

  const saveToGallery = useCallback(async () => {
    if (!user) return;
    let saved = 0;
    for (const [i, r] of results.entries()) {
      if (!r) continue;
      try {
        await supabase
          .from("generations")
          .insert({
            user_id: user.id,
            image_url: r.imageUrl,
            prompt: plans[i]?.prompt?.substring(0, 5000) || null,
            type: "image",
            model: imgModel,
            provider: "kie_ai",
            status: "completed",
            character_id: charId !== "own-photo" ? charId : null,
          });
        saved++;
      } catch (e: any) {
        console.error("Save failed:", e);
      }
    }
    toast({ title: `${saved} gambar disimpan ke Gallery` });
  }, [user, results, plans, imgModel, charId]);

  // ── Generate video ─────────────────────────────────────────
  const genVideo = useCallback(async () => {
    if (!kieApiKey) {
      toast({ title: "Setup Kie API key dulu", variant: "destructive" });
      return;
    }
    setVGen(true);
    setVResults([]);
    try {
      if (vMode === "motion" && vIdx !== null && results[vIdx]) {
        const r = await generateVideoAndWait({
          model: mModel as VideoModel,
          prompt: mPrompt,
          imageUrls: [results[vIdx]!.imageUrl],
          duration: mDur,
          aspectRatio: ar,
          apiKey: kieApiKey,
        });
        setVResults([r.videoUrl]);
      } else if (vMode === "talking" && vIdx !== null && results[vIdx]) {
        const promptParts = tPrompt.split("\n\n---EXTEND---\n\n");
        const initialPrompt = promptParts[0] || tPrompt;
        const first = await generateVideoAndWait({
          model: tVeo as VideoModel,
          prompt: initialPrompt,
          imageUrls: [results[vIdx]!.imageUrl],
          duration: 8,
          aspectRatio: ar,
          apiKey: kieApiKey,
        });
        const segments: string[] = [first.videoUrl];
        const extCount = Math.max(0, Math.floor((tDur - 8) / 8));
        for (let e = 0; e < extCount; e++) {
          const extPrompt =
            promptParts[e + 1] ||
            `Continue the scene naturally. The character keeps speaking and demonstrating the product.`;
          toast({ title: `Extending video... (${e + 1}/${extCount})` });
          const ext = await extendVeoVideo({
            taskId: first.taskId,
            prompt: extPrompt,
            model: tVeo === "veo_fast" ? "fast" : "quality",
            apiKey: kieApiKey,
          });
          segments.push(ext.videoUrl);
        }
        setVResults(segments);
      } else if (vMode === "story" && results.length >= 2) {
        toast({ title: "Multi-shot story coming soon", description: "Fitur ini sedang dikembangkan" });
        setVGen(false);
        return;
      }
      toast({ title: "Video berhasil di-generate!" });
    } catch (e: any) {
      toast({ title: "Video gagal", description: e.message, variant: "destructive" });
    } finally {
      setVGen(false);
    }
  }, [vMode, vIdx, results, mModel, mPrompt, mDur, tVeo, tPrompt, tDur, ar, kieApiKey]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f?.type.startsWith("image/")) uploadProd(f);
    },
    [uploadProd],
  );

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-[calc(100vh-48px)] lg:min-h-screen -mx-4 -my-4 lg:-mx-6 lg:-my-8">
      {step === 1 && (
        <div className="max-w-2xl lg:max-w-6xl mx-auto px-5 py-8 lg:px-8">
          <div className="mb-8">
            <h1 className="text-lg font-semibold">Image Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">Pilih karakter, upload produk, pilih jenis shot</p>
          </div>

          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-3 space-y-8">

          <Sec l="Pilih Karakter">
            <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-8 gap-3">
              {allChars.map((c) => (
                <button key={c.id} onClick={() => setCharId(c.id)} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${charId === c.id ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-60 hover:opacity-80"}`}
                  >
                    {c.hero_image_url ? (
                      <img src={c.hero_image_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Camera className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[64px] text-center">{c.name}</span>
                </button>
              ))}
              <button onClick={() => ownRef.current?.click()} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center ${charId === "own-photo" ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}
                >
                  {ownUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : ownUrl ? (
                    <img src={ownUrl} alt="Own" className="w-full h-full rounded-[10px] object-cover" />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">Upload</span>
              </button>
              <input
                ref={ownRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadOwn(f);
                }}
              />
            </div>
          </Sec>

          <Sec l="Upload Produk">
            {!prodPreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => prodRef.current?.click()}
                className="h-[140px] border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-border"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Drop foto produk</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden border border-border/40 flex-shrink-0">
                  <img src={prodPreview} alt="P" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setProdPreview(null);
                      setProdUrl(null);
                      setDna(null);
                    }}
                    className="absolute top-1.5 right-1.5 bg-black/60 rounded-lg p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {detecting && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>
                {dna && <DnaC d={dna} />}
              </div>
            )}
            <input
              ref={prodRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadProd(f);
              }}
            />
          </Sec>

          <Sec l="Mode Konten">
            <div className="grid grid-cols-2 gap-3">
              {[
                { m: "ugc" as const, i: Smartphone, t: "UGC / Affiliate", d: "Smartphone, authentic" },
                { m: "commercial" as const, i: CameraIcon, t: "Commercial / Iklan", d: "Editorial, cinematic" },
              ].map((o) => (
                <button
                  key={o.m}
                  onClick={() => setMode(o.m)}
                  className={`p-4 rounded-xl border text-left ${mode === o.m ? "border-primary/30 bg-primary/5" : "border-border/40 hover:border-border/60"}`}
                >
                  <o.i className={`w-5 h-5 mb-2 ${mode === o.m ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-medium">{o.t}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{o.d}</p>
                </button>
              ))}
            </div>
          </Sec>

          </div>{/* end left column */}

          <div className="lg:col-span-2 space-y-8 lg:sticky lg:top-8 lg:self-start mt-8 lg:mt-0">
          <Sec l="Pilih Jenis Shot (1-6)">
            <div className="grid grid-cols-2 gap-2.5">
              {SHOT_TYPES.map((s) => {
                const sel = selShots.includes(s.key);
                const Ic = SHOT_ICONS[s.icon] || Star;
                return (
                  <button
                    key={s.key}
                    onClick={() => toggle(s.key)}
                    className={`p-3.5 rounded-xl border text-left relative ${sel ? "border-primary/30 bg-primary/5" : "border-border/30 hover:border-border/50"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Ic className={`w-4 h-4 ${sel ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{s.name.id}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{s.purpose}</p>
                    {sel && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{selShots.length}/6 dipilih</p>
          </Sec>

          <Sec l="Environment">
            <Select
              value={env.label}
              onValueChange={(v) => {
                const f = envOpts.find((e) => e.label === v);
                if (f) setEnv(f);
              }}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {envOpts.map((e) => (
                  <SelectItem key={e.label} value={e.label}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Sec>

          <div>
            <button
              onClick={() => setAdvOpen(!advOpen)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-3.5 h-3.5" />
              Pengaturan Lanjutan
              <ChevronDown className={`w-3 h-3 transition-transform ${advOpen ? "rotate-180" : ""}`} />
            </button>
            {advOpen && (
              <div className="mt-4 space-y-4 p-4 rounded-xl border border-border/30 bg-white/[0.01]">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Image Model</label>
                  <Select value={imgModel} onValueChange={(v) => setImgModel(v as ImageModel)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(MODEL_INFO) as [ImageModel, { label: string; desc: string }][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label} — {v.desc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Resolution</label>
                  <div className="flex gap-2">
                    {RESOLUTIONS.map((r) => (
                      <button
                        key={r}
                        disabled={r === "4K" && imgModel === "nano-banana"}
                        onClick={() => setImgRes(r)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border ${imgRes === r ? "border-primary/30 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground"} ${r === "4K" && imgModel === "nano-banana" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {ASPECT_RATIOS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAr(a)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border ${ar === a ? "border-primary/30 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground"}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Realism</label>
                  <div className="flex gap-2">
                    {[
                      { v: "standard" as const, l: "Standard" },
                      { v: "ultra" as const, l: "Ultra" },
                      ...(mode === "ugc" ? [{ v: "raw_phone" as const, l: "Raw Phone" }] : []),
                    ].map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setRealism(o.v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border ${realism === o.v ? "border-primary/30 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground"}`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button onClick={generate} disabled={!canGen} className="w-full h-12 text-sm font-semibold gap-2">
              <Zap className="w-4 h-4" />
              Generate {selShots.length} Gambar
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">Estimasi: {formatRupiah(cost)}</p>
          </div>
          </div>{/* end right column */}
          </div>{/* end grid */}
        </div>
      )}

      {/* ══ STEP 2 ═══════════════════════════════════════════ */}
      {step === 2 && (
        <div className="flex h-[calc(100vh-48px)] lg:h-screen">
          <div className={`flex-1 overflow-y-auto transition-all ${vpOpen ? "lg:mr-[400px]" : ""}`}>
            <div className="max-w-4xl xl:max-w-6xl mx-auto px-5 py-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setStep(1);
                      imgGen.cancel();
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h1 className="text-lg font-semibold">Hasil Generate</h1>
                    <p className="text-xs text-muted-foreground">
                      {mode === "ugc" ? "UGC" : "Commercial"} — {selShots.length} shot
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {genning && (
                    <Button variant="ghost" size="sm" onClick={imgGen.cancel} className="text-xs h-8">
                      Cancel
                    </Button>
                  )}
                  {isDone && results.length >= 2 && (
                    <Button variant="outline" size="sm" onClick={openStory} className="text-xs h-8 gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Full Story Video
                    </Button>
                  )}
                </div>
              </div>

              {genning && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Membuat gambar {imgGen.progress.currentShot + 1} dari {imgGen.progress.totalShots}
                  {plans[imgGen.progress.currentShot] && <> — {plans[imgGen.progress.currentShot].shotLabel}</>}
                  <span className="text-muted-foreground/40 ml-2">{imgGen.progress.totalElapsed}s</span>
                </div>
              )}

              <div
                className={`grid gap-4 ${selShots.length === 1 ? "grid-cols-1 max-w-md mx-auto" : selShots.length === 2 ? "grid-cols-2 max-w-2xl mx-auto" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}
              >
                {Array.from({ length: imgGen.progress.totalShots || selShots.length }).map((_, i) => {
                  const r = imgGen.progress.results[i];
                  const cur = genning && imgGen.progress.currentShot === i;
                  const fail = imgGen.progress.failedShots.includes(i);
                  const s = plans[i];
                  const up = r ? getUpscaleState(`gen-${i}`) : null;
                  return (
                    <div
                      key={i}
                      className={`relative rounded-xl overflow-hidden border group ${arClass} ${r ? "border-border/30" : cur ? "border-primary/20" : "border-white/[0.04]"}`}
                    >
                      {r ? (
                        <>
                          <img
                            src={up?.resultUrl || r.imageUrl}
                            alt={s?.shotLabel || `Shot ${i + 1}`}
                            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                            onClick={() => setLbIdx(i)}
                          />
                          {s && (
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <span className="text-[9px] px-2 py-0.5 rounded-md font-medium bg-black/50 text-white/80">
                                {s.shotLabel}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPromptPreview(promptPreview === i ? null : i);
                                }}
                                className="ml-1.5 text-[8px] px-1.5 py-0.5 rounded bg-black/40 text-white/60 hover:text-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Prompt
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(s.prompt);
                                  toast({ title: "Prompt di-copy!" });
                                }}
                                className="ml-1 text-[8px] px-1.5 py-0.5 rounded bg-black/40 text-white/60 hover:text-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="w-2.5 h-2.5 inline" />
                              </button>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <ActBtn icon={RefreshCw} label="Retry" onClick={() => retry(i)} />
                            <ActBtn
                              icon={ArrowUpRight}
                              label="Upscale"
                              loading={up?.loading}
                              onClick={() => upscale(`gen-${i}`, r.imageUrl, 2)}
                            />
                            <ActBtn icon={Play} label="Motion" onClick={() => openMotion(i)} />
                            <ActBtn icon={Mic} label="Talk" onClick={() => openTalking(i)} />
                            <ActBtn
                              icon={Download}
                              label="Save"
                              onClick={() => downloadFile(r.imageUrl, `genbox-${s?.shotType || "shot"}-${i + 1}.png`)}
                            />
                          </div>
                          {promptPreview === i && s && (
                            <div className="absolute inset-0 bg-black/85 z-10 p-3 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-semibold text-white/90">{s.shotLabel} — Prompt</span>
                                <button onClick={() => setPromptPreview(null)} className="text-white/60 hover:text-white">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <pre className="text-[8px] text-white/70 font-mono leading-relaxed whitespace-pre-wrap">{s.prompt}</pre>
                            </div>
                          )}
                        </>
                      ) : cur ? (
                        <div className="absolute inset-0 bg-white/[0.02] flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
                          {s && <span className="text-[10px] text-muted-foreground">{s.shotLabel}</span>}
                        </div>
                      ) : fail ? (
                        <div className="absolute inset-0 bg-destructive/5 flex flex-col items-center justify-center gap-2">
                          <X className="w-4 h-4 text-destructive/60" />
                          <span className="text-[10px] text-destructive/60">Gagal</span>
                          <button
                            onClick={() => retry(i)}
                            className="text-[9px] px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>


              {isDone && results.length > 0 && (
                <div className="flex items-center justify-between gap-3 py-3 mt-4 border-t border-border/30">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={async () => {
                        for (const [i, r] of results.entries()) {
                          if (!r) continue;
                          await downloadFile(r.imageUrl, `genbox-${plans[i]?.shotType || "shot"}-${i + 1}.png`);
                        }
                        toast({ title: `${results.filter(Boolean).length} gambar di-download` });
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download All
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={saveToGallery}>
                      <Save className="w-3.5 h-3.5" />
                      Save to Gallery
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => {
                        imgGen.reset();
                        setStep(1);
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Buat Lagi
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground whitespace-nowrap">Total: {formatRupiah(cost)}</p>
                </div>
              )}
            </div>
          </div>

          {/* ══ Video Side Panel ═══════════════════════════════ */}
          {vpOpen && (
            <div className="fixed inset-y-0 right-0 w-full lg:w-[400px] bg-card border-l border-border/40 z-40 overflow-y-auto shadow-2xl">
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {vMode === "motion" && <Play className="w-4 h-4 text-primary" />}
                    {vMode === "talking" && <Mic className="w-4 h-4 text-primary" />}
                    {vMode === "story" && <Layers className="w-4 h-4 text-primary" />}
                    <h3 className="text-sm font-semibold">
                      {vMode === "motion" ? "Quick Motion" : vMode === "talking" ? "Talking Head" : "Full Story"}
                    </h3>
                  </div>
                  <button onClick={() => setVpOpen(false)} className="p-1.5 hover:bg-white/[0.05] rounded-lg">
                    <PanelRightClose className="w-4 h-4" />
                  </button>
                </div>

                {vIdx !== null && results[vIdx] && (
                  <div className="relative aspect-[9/16] max-h-[200px] rounded-xl overflow-hidden border border-border/30 mx-auto w-fit">
                    {vResults.length === 1 ? (
                      <video src={vResults[0]} controls className="h-full w-auto" autoPlay />
                    ) : (
                      <img src={results[vIdx]!.imageUrl} alt="Src" className="h-full w-auto object-cover" />
                    )}
                  </div>
                )}

                {/* QUICK MOTION */}
                {vMode === "motion" && (
                  <>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">
                        Video Model
                      </label>
                      <Select
                        value={mModel}
                        onValueChange={(v) => {
                          setMModel(v);
                          const m = MOTION_MODELS.find((x) => x.id === v);
                          if (m) setMDur(m.durations[0]);
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOTION_MODELS.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.label} — {formatRupiah(m.cost)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">
                        Duration
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {mModelInfo.durations.map((d) => (
                          <button
                            key={d}
                            onClick={() => setMDur(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${mDur === d ? "border-primary/30 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-border/50"}`}
                          >
                            {d}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">
                        Motion Style
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {getMotionPresetsForCategory(dna?.category || "other").map((preset) => (
                          <button
                            key={preset.key}
                            onClick={() => {
                              setActiveMotionPreset(preset.key);
                              setMPrompt(
                                preset.buildPrompt({
                                  beat: "hook",
                                  model: (mModel as any) || "kling_std",
                                  character: char?.description || "",
                                  product: dna?.product_description || "",
                                  productColor: dna?.dominant_color || "",
                                  productPackaging: dna?.packaging_type || "",
                                  environment: env.description,
                                  skinTone: "sawo matang",
                                  expression: "natural",
                                }),
                              );
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border ${activeMotionPreset === preset.key ? "border-primary/30 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-border/50"}`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                      {activeMotionPreset && (
                        <p className="text-[8px] text-muted-foreground/50 mt-1">
                          {
                            getMotionPresetsForCategory(dna?.category || "other").find(
                              (p) => p.key === activeMotionPreset,
                            )?.description
                          }
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Motion Prompt
                        </label>
                        <button
                          onClick={() => setMPrompt(buildMotionPrompt(vIdx || 0))}
                          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
                        >
                          <RotateCw className="w-3 h-3" />
                          Regenerate
                        </button>
                      </div>
                      <Textarea
                        value={mPrompt}
                        onChange={(e) => setMPrompt(e.target.value)}
                        className="text-[10px] min-h-[100px] font-mono leading-relaxed"
                      />
                    </div>
                    <Button
                      onClick={genVideo}
                      disabled={vGen || !mPrompt}
                      className="w-full h-10 text-xs font-semibold"
                    >
                      {vGen ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Generating...
                        </>
                      ) : (
                        <>Generate Motion — {formatRupiah(mModelInfo.cost)}</>
                      )}
                    </Button>
                  </>
                )}

                {/* TALKING HEAD */}
                {vMode === "talking" && (
                  <>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">
                        Veo Model
                      </label>
                      <div className="flex gap-2">
                        {TALK_VEO_MODELS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setTVeo(m.id)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium border ${tVeo === m.id ? "border-primary/30 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground"}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">
                        Duration
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([8, 16, 24, 32] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              setTDur(d);
                              const beats = getBeatsForDuration(d);
                              const defaults: Record<string, string> = {};
                              beats.forEach((bk) => {
                                const b = getBeatDefinition(bk);
                                defaults[bk] =
                                  beatDialogues[bk as TalkingHeadBeatKey] ||
                                  b.defaultDialogueId(dna?.product_description || "produk ini", dna?.ugc_hook || "");
                              });
                              setBeatDialogues(defaults as Record<TalkingHeadBeatKey, string>);
                            }}
                            className={`py-2.5 rounded-lg border text-center ${tDur === d ? "border-primary/30 bg-primary/10" : "border-border/30 hover:border-border/50"}`}
                          >
                            <span
                              className={`text-xs font-medium block ${tDur === d ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {d}s
                            </span>
                            <span className="text-[9px] text-muted-foreground/60 block mt-0.5">
                              {formatRupiah(getTalkCost(tVeo, d))}
                            </span>
                          </button>
                        ))}
                      </div>
                      {tDur > 8 && (
                        <p className="text-[9px] text-muted-foreground/50 mt-1.5">
                          {getBeatsForDuration(tDur).length} beat × 8s segment ({Math.floor((tDur - 8) / 8)}x extend)
                        </p>
                      )}
                    </div>

                    {/* Beat Cards with AI Script */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Story Beats & Script
                        </label>
                        <button
                          onClick={generateAllScripts}
                          className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 font-medium"
                        >
                          <Zap className="w-3 h-3" />
                          Auto-Generate All
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {getBeatsForDuration(tDur).map((beatKey, idx) => {
                          const beat = getBeatDefinition(beatKey);
                          const isLoading = beatDialogues[beatKey] === "...";
                          return (
                            <div
                              key={beatKey}
                              className="p-3 rounded-xl border border-border/30 bg-white/[0.02] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    {idx + 1}
                                  </span>
                                  <span className="text-[11px] font-semibold">{beat.nameId}</span>
                                </div>
                                <span className="text-[9px] text-muted-foreground/60">
                                  {idx * 8}s–{(idx + 1) * 8}s
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground leading-relaxed">{beat.description}</p>
                              <div className="flex gap-2 text-[8px]">
                                <span className="px-1.5 py-0.5 rounded bg-primary/5 text-primary/70">
                                  {beat.energy.split(",")[0]}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground/70">
                                  Produk:{" "}
                                  {beat.productVisibility.includes("NOT")
                                    ? "hidden"
                                    : beat.productVisibility.includes("HERO")
                                      ? "hero"
                                      : "visible"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[9px] text-muted-foreground">Script</span>
                                <button
                                  onClick={() => generateBeatScript(beatKey, idx)}
                                  disabled={isLoading}
                                  className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Zap className="w-2.5 h-2.5" />
                                  )}
                                  AI Script
                                </button>
                              </div>
                              <Textarea
                                value={isLoading ? "" : beatDialogues[beatKey] || ""}
                                onChange={(e) => setBeatDialogues((prev) => ({ ...prev, [beatKey]: e.target.value }))}
                                disabled={isLoading}
                                className="text-[10px] min-h-[50px]"
                                placeholder={
                                  isLoading
                                    ? "Generating..."
                                    : beat.defaultDialogueId(dna?.product_description || "produk", dna?.ugc_hook || "")
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Full Video Prompt
                        </label>
                        <button
                          onClick={() => setTPrompt(buildTalkPrompt())}
                          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
                        >
                          <RotateCw className="w-3 h-3" />
                          Regenerate
                        </button>
                      </div>
                      <Textarea
                        value={tPrompt}
                        onChange={(e) => setTPrompt(e.target.value)}
                        className="text-[10px] min-h-[100px] font-mono leading-relaxed"
                      />
                    </div>
                    <Button
                      onClick={genVideo}
                      disabled={vGen || !tPrompt}
                      className="w-full h-10 text-xs font-semibold"
                    >
                      {vGen ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Generating{tDur > 8 ? " + Extending" : ""}...
                        </>
                      ) : (
                        <>Generate Talking Head — {formatRupiah(talkCost)}</>
                      )}
                    </Button>
                  </>
                )}

                {/* FULL STORY */}
                {vMode === "story" && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Gabungkan semua gambar jadi 1 video menggunakan Kling 3.0 Multi-Shot.
                    </p>
                    <div className="space-y-2">
                      {results.map(
                        (r, i) =>
                          r && (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border/30">
                              <img
                                src={r.imageUrl}
                                alt={`Shot ${i + 1}`}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <p className="text-xs font-medium">{plans[i]?.shotLabel || `Shot ${i + 1}`}</p>
                                <p className="text-[10px] text-muted-foreground">Duration per shot:</p>
                              </div>
                              <div className="flex gap-1">
                                {[3, 5, 8].map((d) => (
                                  <button
                                    key={d}
                                    onClick={() => {
                                      const n = [...sPerShotDur];
                                      n[i] = d;
                                      setSPerShotDur(n);
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-medium border ${(sPerShotDur[i] || 5) === d ? "border-primary/30 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground"}`}
                                  >
                                    {d}s
                                  </button>
                                ))}
                              </div>
                            </div>
                          ),
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => setPromptPreview(promptPreview === -1 ? null : -1)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {promptPreview === -1 ? "Hide" : "View"} Shot Prompts
                      </button>
                      {promptPreview === -1 && (
                        <div className="mt-2 space-y-2">
                          {plans.map((p, i) => (
                            <div key={i} className="p-2 rounded-lg border border-border/20 bg-white/[0.01]">
                              <p className="text-[9px] font-semibold text-muted-foreground mb-1">{p.shotLabel}</p>
                              <pre className="text-[8px] text-muted-foreground/70 font-mono whitespace-pre-wrap max-h-[80px] overflow-y-auto">
                                {p.prompt.substring(0, 300)}...
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Total: {sPerShotDur.reduce((a, b) => a + b, 0) || results.length * 5}s</span>
                      <span>Model: Kling 3.0 Pro</span>
                    </div>
                    <Button onClick={genVideo} disabled={vGen} className="w-full h-10 text-xs font-semibold">
                      {vGen ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Generating...
                        </>
                      ) : (
                        <>Generate Story Video — {formatRupiah(3560)}</>
                      )}
                    </Button>
                  </>
                )}

                {/* Video Results — multi-segment aware */}
                {vResults.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-border/30">
                    {vResults.map((url, i) => {
                      const beats = vMode === "talking" ? getBeatsForDuration(tDur) : [];
                      const beatDef = beats[i] ? getBeatDefinition(beats[i]) : null;
                      const label = beatDef ? `${beatDef.nameId} (${i * 8}–${(i + 1) * 8}s)` : `Clip ${i + 1}`;
                      return (
                        <div key={i} className="space-y-2">
                          {vResults.length > 1 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium">{label}</span>
                              <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" asChild>
                                <a href={url} download target="_blank" rel="noreferrer">
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          )}
                          <video src={url} controls className="w-full rounded-lg" />
                        </div>
                      );
                    })}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={async () => {
                          for (const [i, url] of vResults.entries()) {
                            await downloadFile(url, `genbox-video-${i + 1}.mp4`);
                          }
                          toast({ title: `${vResults.length} video di-download` });
                        }}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        {vResults.length > 1 ? `Download All (${vResults.length})` : "Download Video"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setVResults([])}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Lagi
                      </Button>
                    </div>
                    {vResults.length > 1 && (
                      <p className="text-[9px] text-muted-foreground/50 text-center">
                        Gabungkan video di CapCut / VN untuk hasil final
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {lbIdx !== null && imgGen.progress.results[lbIdx] && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLbIdx(null)}
        >
          <img
            src={imgGen.progress.results[lbIdx]!.imageUrl}
            alt="Full"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute top-4 right-4 p-2 bg-black/50 rounded-xl" onClick={() => setLbIdx(null)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

function Sec({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{l}</h3>
      {children}
    </div>
  );
}
function DnaC({ d }: { d: ProductDNA }) {
  const c: Record<string, string> = {
    skincare: "bg-pink-500/15 text-pink-400",
    fashion: "bg-purple-500/15 text-purple-400",
    food: "bg-orange-500/15 text-orange-400",
    electronics: "bg-blue-500/15 text-blue-400",
    health: "bg-green-500/15 text-green-400",
    home: "bg-amber-500/15 text-amber-400",
    other: "bg-gray-500/15 text-gray-400",
  };
  return (
    <div className="flex-1 p-3 rounded-xl border border-border/30 bg-white/[0.02] space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={`text-[9px] px-2 py-0.5 rounded-md font-medium ${c[d.category] || c.other}`}>
          {d.category}
        </span>
        <span className="text-[10px] text-muted-foreground">{d.sub_category}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm border border-border/40" style={{ backgroundColor: d.dominant_color }} />
        <span className="text-[10px] text-muted-foreground">{d.brand_name}</span>
      </div>
      {d.ugc_hook && <p className="text-[10px] text-muted-foreground/80 italic">"{d.ugc_hook}"</p>}
    </div>
  );
}
function ActBtn({
  icon: I,
  label: l,
  onClick: o,
  loading: ld,
}: {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        o();
      }}
      className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-white/10"
      title={l}
    >
      {ld ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <I className="w-3.5 h-3.5" />}
      <span className="text-[8px]">{l}</span>
    </button>
  );
}

export default GeneratePage;
