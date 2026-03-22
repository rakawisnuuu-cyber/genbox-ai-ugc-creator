import { useState, useRef, useCallback, useMemo } from "react";
import {
  ImagePlus,
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
  PanelRightOpen,
  RotateCw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
  getImageCost,
  formatRupiah,
  SHOT_TYPES,
  type ContentMode,
  type ImageModelType,
  type RealismLevel,
  type ImageShotPlan,
  type GenerationConfig,
  type ShotTypeKey,
} from "@/lib/image-generation-engine";
import { supabase } from "@/integrations/supabase/client";
import { fileToBase64 } from "@/lib/image-utils";
import { generateVideoAndWait, type VideoModel } from "@/lib/kie-video-generation";
import { getMotionPrompt, type MotionVideoModel } from "@/lib/image-to-video-prompts";

/* ─── Icon Map ───────────────────────────────────────────────── */
const SHOT_ICONS: Record<string, React.ComponentType<any>> = {
  Star,
  Search,
  Hand,
  Smile,
  Coffee,
  Eye,
};

/* ─── Constants ──────────────────────────────────────────────── */
const MODEL_INFO: Record<ImageModelType, { label: string; desc: string }> = {
  "nano-banana": { label: "Nano Banana (Cepat)", desc: "~Rp 310" },
  "nano-banana-2": { label: "Nano Banana 2 (Seimbang)", desc: "~Rp 620" },
  "nano-banana-pro": { label: "Nano Banana Pro (Terbaik)", desc: "~Rp 1.400" },
};
const ASPECT_RATIOS = ["9:16", "1:1", "4:5", "16:9"];
const RESOLUTIONS = ["1K", "2K", "4K"] as const;
const VIDEO_MODELS: {
  id: MotionVideoModel;
  label: string;
  cost: number;
  minDur: number;
  maxDur: number;
  step: number;
}[] = [
  { id: "grok", label: "Grok (Cepat)", cost: 1240, minDur: 6, maxDur: 10, step: 4 },
  { id: "kling_std", label: "Kling 3.0 Std", cost: 1860, minDur: 3, maxDur: 15, step: 1 },
  { id: "kling_pro", label: "Kling 3.0 Pro", cost: 3560, minDur: 3, maxDur: 15, step: 1 },
  { id: "veo_fast", label: "Veo 3.1 Fast", cost: 4960, minDur: 8, maxDur: 8, step: 1 },
  { id: "veo_quality", label: "Veo 3.1 Quality", cost: 24800, minDur: 8, maxDur: 8, step: 1 },
];

/* ═══════════════════════════════════════════════════════════════ */

const GeneratePage = () => {
  const { user } = useAuth();
  const { kieApiKey, geminiKey } = useApiKeys();
  const { model: promptModel } = usePromptModel();
  const { customChars } = useCustomCharacters();
  const { upscale, getState: getUpscaleState } = useUpscale();

  // ── Step ───────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // ── Character ──────────────────────────────────────────────
  const allChars = useMemo(() => [...(customChars || []), ...PRESETS], [customChars]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const selectedChar = useMemo(() => allChars.find((c) => c.id === selectedCharId) || null, [allChars, selectedCharId]);
  const [ownPhotoUrl, setOwnPhotoUrl] = useState<string | null>(null);
  const [ownPhotoUploading, setOwnPhotoUploading] = useState(false);

  // ── Product ────────────────────────────────────────────────
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [productDNA, setProductDNA] = useState<ProductDNA | null>(null);
  const [detectingDNA, setDetectingDNA] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Mode ───────────────────────────────────────────────────
  const [contentMode, setContentMode] = useState<ContentMode>("ugc");

  // ── Shot types ─────────────────────────────────────────────
  const [selectedShots, setSelectedShots] = useState<ShotTypeKey[]>(["hero"]);

  // ── Environment ────────────────────────────────────────────
  const envOptions = useMemo(() => getEnvironments(productDNA?.category || "other"), [productDNA?.category]);
  const [selectedEnv, setSelectedEnv] = useState<RichOption>(envOptions[0]);

  // ── Settings ───────────────────────────────────────────────
  const [imageModel, setImageModel] = useState<ImageModelType>("nano-banana-pro");
  const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("2K");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [realismLevel, setRealismLevel] = useState<RealismLevel>("standard");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ── Generation ─────────────────────────────────────────────
  const [shotPlans, setShotPlans] = useState<ImageShotPlan[]>([]);
  const imgGen = useImageGeneration({
    shots: shotPlans,
    imageModel,
    resolution,
    aspectRatio,
    kieApiKey: kieApiKey || "",
    characterImageUrl: selectedCharId === "own-photo" ? ownPhotoUrl || "" : selectedChar?.hero_image_url || "",
    productImageUrl: productUrl || "",
  });

  // ── Video panel ────────────────────────────────────────────
  const [videoPanelOpen, setVideoPanelOpen] = useState(false);
  const [videoImageIdx, setVideoImageIdx] = useState<number | null>(null);
  const [videoModel, setVideoModel] = useState<MotionVideoModel>("kling_std");
  const [videoDuration, setVideoDuration] = useState(6);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoScript, setVideoScript] = useState("");
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);

  // ── Lightbox ───────────────────────────────────────────────
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // ── Refs ───────────────────────────────────────────────────
  const productInputRef = useRef<HTMLInputElement>(null);
  const ownPhotoInputRef = useRef<HTMLInputElement>(null);

  // ── Computed ───────────────────────────────────────────────
  const totalCost = getImageCost(imageModel, resolution) * selectedShots.length;
  const canGenerate = !!selectedChar && !!productUrl && !!productDNA && !!kieApiKey && selectedShots.length > 0;
  const canProceedStep1 = !!selectedChar && !!productUrl && !!productDNA;
  const isGenerating = imgGen.progress.status === "generating";
  const isCompleted = imgGen.progress.status === "completed";
  const completedResults = imgGen.progress.results.filter(Boolean);
  const currentVideoModelInfo = VIDEO_MODELS.find((m) => m.id === videoModel) || VIDEO_MODELS[1];

  // ── Toggle shot type ───────────────────────────────────────
  const toggleShot = (key: ShotTypeKey) => {
    setSelectedShots((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        return prev.filter((s) => s !== key);
      }
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  // ── Generate motion prompt ─────────────────────────────────
  const generateMotionPrompt = useCallback(
    (idx: number) => {
      if (!shotPlans[idx]) return "";
      return getMotionPrompt({
        beat: "hook" as any,
        model: videoModel,
        character: selectedChar?.description || "",
        product: productDNA?.product_description || "",
        productColor: productDNA?.dominant_color || "",
        productPackaging: productDNA?.packaging_type || "",
        environment: selectedEnv.description,
        skinTone: "sawo matang",
        expression: "natural",
        dialogue: videoScript || undefined,
        productInteraction: "holding product naturally",
      });
    },
    [shotPlans, videoModel, selectedChar, productDNA, selectedEnv, videoScript],
  );

  // ── Handlers ───────────────────────────────────────────────
  const handleProductUpload = useCallback(
    async (file: File) => {
      if (!user || !geminiKey) {
        toast({ title: "API key Gemini belum di-setup", variant: "destructive" });
        return;
      }
      setUploading(true);
      setProductDNA(null);
      try {
        setProductPreview(URL.createObjectURL(file));
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: pubData } = supabase.storage.from("product-images").getPublicUrl(path);
        setProductUrl(pubData.publicUrl);
        setUploading(false);
        setDetectingDNA(true);
        const base64 = await fileToBase64(file);
        const dna = await detectProductDNA(base64, promptModel, geminiKey);
        setProductDNA(dna);
        setSelectedEnv(getEnvironments(dna.category)[0]);
      } catch (e: any) {
        toast({ title: "Upload gagal", description: e.message, variant: "destructive" });
      } finally {
        setUploading(false);
        setDetectingDNA(false);
      }
    },
    [user, geminiKey, promptModel],
  );

  const handleOwnPhotoUpload = useCallback(
    async (file: File) => {
      if (!user) return;
      setOwnPhotoUploading(true);
      try {
        const path = `${user.id}/own-photo-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("character-packs").upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data } = supabase.storage.from("character-packs").getPublicUrl(path);
        setOwnPhotoUrl(data.publicUrl);
        setSelectedCharId("own-photo");
      } catch (e: any) {
        toast({ title: "Upload gagal", description: e.message, variant: "destructive" });
      } finally {
        setOwnPhotoUploading(false);
      }
    },
    [user],
  );

  const handleGenerate = useCallback(() => {
    if (!canGenerate || !selectedChar || !productDNA || !productUrl) return;
    const charImageUrl = selectedCharId === "own-photo" ? ownPhotoUrl || "" : selectedChar.hero_image_url || "";
    const config: GenerationConfig = {
      mode: contentMode,
      selectedShots,
      productDNA,
      characterDescription: selectedChar.description,
      characterImageUrl: charImageUrl,
      productImageUrl: productUrl,
      environment: selectedEnv,
      realismLevel,
      aspectRatio,
      imageModel,
      resolution,
    };
    const plans = planImageShots(config);
    setShotPlans(plans);
    setCurrentStep(2);
    setTimeout(() => imgGen.start(), 50);
  }, [
    canGenerate,
    selectedChar,
    selectedCharId,
    ownPhotoUrl,
    productDNA,
    productUrl,
    contentMode,
    selectedShots,
    selectedEnv,
    realismLevel,
    aspectRatio,
    imageModel,
    resolution,
    kieApiKey,
  ]);

  const handleVideoGenerate = useCallback(async () => {
    if (videoImageIdx === null || !completedResults[videoImageIdx]) return;
    if (!kieApiKey) {
      toast({ title: "Kie AI API key belum di-setup", variant: "destructive" });
      return;
    }
    setVideoGenerating(true);
    setVideoResult(null);
    try {
      const result = await generateVideoAndWait({
        model: videoModel as VideoModel,
        prompt: videoPrompt,
        imageUrls: [completedResults[videoImageIdx]!.imageUrl],
        duration: videoDuration,
        aspectRatio,
        apiKey: kieApiKey,
      });
      setVideoResult(result.videoUrl);
      toast({ title: "Video berhasil di-generate!" });
    } catch (e: any) {
      toast({ title: "Video gagal", description: e.message, variant: "destructive" });
    } finally {
      setVideoGenerating(false);
    }
  }, [videoImageIdx, completedResults, kieApiKey, videoModel, videoPrompt, videoDuration, aspectRatio]);

  const openVideoPanel = useCallback(
    (idx: number) => {
      setVideoImageIdx(idx);
      setVideoResult(null);
      setVideoPanelOpen(true);
      // Auto-generate prompt
      const prompt = generateMotionPrompt(idx);
      setVideoPrompt(prompt);
    },
    [generateMotionPrompt],
  );

  const handleRegeneratePrompt = useCallback(() => {
    if (videoImageIdx === null) return;
    const prompt = generateMotionPrompt(videoImageIdx);
    setVideoPrompt(prompt);
    toast({ title: "Prompt di-regenerate" });
  }, [videoImageIdx, generateMotionPrompt]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) handleProductUpload(file);
    },
    [handleProductUpload],
  );

  /* ═══════════════════════════════════════════════════════════ */
  /*  RENDER                                                    */
  /* ═══════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-[calc(100vh-48px)] lg:min-h-screen -mx-4 -my-4 lg:-mx-6 lg:-my-8">
      {/* ══════════════════════════════════════════════════════ */}
      {/* ══ STEP 1: Setup ════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
          <div>
            <h1 className="text-lg font-semibold">Image Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">Pilih karakter, upload produk, pilih jenis shot</p>
          </div>

          {/* A. Character */}
          <Section label="Pilih Karakter">
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
              {allChars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCharId(c.id)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedCharId === c.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent opacity-60 hover:opacity-80"
                    }`}
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
              {/* Upload own */}
              <button onClick={() => ownPhotoInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center ${
                    selectedCharId === "own-photo"
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  {ownPhotoUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : ownPhotoUrl ? (
                    <img src={ownPhotoUrl} alt="Own" className="w-full h-full rounded-[10px] object-cover" />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">Upload</span>
              </button>
              <input
                ref={ownPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleOwnPhotoUpload(f);
                }}
              />
            </div>
          </Section>

          {/* B. Product */}
          <Section label="Upload Produk">
            {!productPreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => productInputRef.current?.click()}
                className="h-[140px] border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-border transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Drop foto produk di sini</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden border border-border/40 flex-shrink-0">
                  <img src={productPreview} alt="Product" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setProductPreview(null);
                      setProductUrl(null);
                      setProductDNA(null);
                    }}
                    className="absolute top-1.5 right-1.5 bg-black/60 rounded-lg p-1 hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {detectingDNA && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>
                {productDNA && <DNACard dna={productDNA} />}
              </div>
            )}
            <input
              ref={productInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleProductUpload(f);
              }}
            />
          </Section>

          {/* C. Content Mode */}
          <Section label="Mode Konten">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  mode: "ugc" as const,
                  icon: Smartphone,
                  title: "UGC / Affiliate",
                  desc: "Smartphone-feel, authentic, TikTok-style",
                },
                {
                  mode: "commercial" as const,
                  icon: CameraIcon,
                  title: "Commercial / Iklan",
                  desc: "Editorial, cinematic, brand-quality",
                },
              ].map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => setContentMode(opt.mode)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    contentMode === opt.mode
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/40 hover:border-border/60"
                  }`}
                >
                  <opt.icon
                    className={`w-5 h-5 mb-2 ${contentMode === opt.mode ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p className="text-sm font-medium">{opt.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* D. Shot Types */}
          <Section label="Pilih Jenis Shot (1-3)">
            <div className="grid grid-cols-2 gap-2.5">
              {SHOT_TYPES.map((shot) => {
                const selected = selectedShots.includes(shot.key);
                const Icon = SHOT_ICONS[shot.icon] || Star;
                return (
                  <button
                    key={shot.key}
                    onClick={() => toggleShot(shot.key)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      selected ? "border-primary/30 bg-primary/5" : "border-border/30 hover:border-border/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{shot.name.id}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{shot.purpose}</p>
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{selectedShots.length}/3 shot dipilih</p>
          </Section>

          {/* E. Environment */}
          <Section label="Environment">
            <Select
              value={selectedEnv.label}
              onValueChange={(val) => {
                const f = envOptions.find((e) => e.label === val);
                if (f) setSelectedEnv(f);
              }}
            >
              <SelectTrigger className="bg-background/50 border-border/40 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {envOptions.map((e) => (
                  <SelectItem key={e.label} value={e.label}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          {/* F. Advanced Settings */}
          <div>
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan Lanjutan</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </button>
            {advancedOpen && (
              <div className="mt-4 space-y-4 p-4 rounded-xl border border-border/30 bg-white/[0.01]">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Image Model</label>
                  <Select value={imageModel} onValueChange={(v) => setImageModel(v as ImageModelType)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(MODEL_INFO) as [ImageModelType, { label: string; desc: string }][]).map(
                        ([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v.label} — {v.desc}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Resolution</label>
                  <div className="flex gap-2">
                    {RESOLUTIONS.map((r) => (
                      <button
                        key={r}
                        disabled={r === "4K" && imageModel === "nano-banana"}
                        onClick={() => setResolution(r)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                          resolution === r
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border/30 text-muted-foreground hover:border-border/50"
                        } ${r === "4K" && imageModel === "nano-banana" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar}
                        onClick={() => setAspectRatio(ar)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                          aspectRatio === ar
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border/30 text-muted-foreground"
                        }`}
                      >
                        {ar}
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
                      ...(contentMode === "ugc" ? [{ v: "raw_phone" as const, l: "Raw Phone" }] : []),
                    ].map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setRealismLevel(o.v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                          realismLevel === o.v
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border/30 text-muted-foreground"
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* G. Generate */}
          <div className="pt-2">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full h-12 text-sm font-semibold gap-2"
            >
              <Zap className="w-4 h-4" />
              Generate {selectedShots.length} Gambar
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">Estimasi: {formatRupiah(totalCost)}</p>
            {!canProceedStep1 && (
              <p className="text-[10px] text-destructive/60 text-center mt-1">Pilih karakter dan upload produk dulu</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ══ STEP 2: Output ═══════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="flex h-[calc(100vh-48px)] lg:h-screen">
          {/* Main output area */}
          <div className={`flex-1 overflow-y-auto transition-all ${videoPanelOpen ? "lg:mr-[400px]" : ""}`}>
            <div className="max-w-4xl mx-auto px-5 py-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      imgGen.cancel();
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h1 className="text-lg font-semibold">Hasil Generate</h1>
                    <p className="text-xs text-muted-foreground">
                      {contentMode === "ugc" ? "UGC" : "Commercial"} — {selectedShots.length} shot
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isGenerating && (
                    <Button variant="ghost" size="sm" onClick={imgGen.cancel} className="text-xs h-8">
                      Cancel
                    </Button>
                  )}
                  {videoPanelOpen && (
                    <button
                      onClick={() => setVideoPanelOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.05]"
                      title="Tutup panel video"
                    >
                      <PanelRightClose className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>
                    Membuat gambar {imgGen.progress.currentShot + 1} dari {imgGen.progress.totalShots}
                    {shotPlans[imgGen.progress.currentShot] && (
                      <> — {shotPlans[imgGen.progress.currentShot].shotLabel}</>
                    )}
                  </span>
                  <span className="text-muted-foreground/40">{imgGen.progress.totalElapsed}s</span>
                </div>
              )}

              {/* Grid */}
              <div
                className={`grid gap-4 ${
                  selectedShots.length === 1
                    ? "grid-cols-1 max-w-md mx-auto"
                    : selectedShots.length === 2
                      ? "grid-cols-2 max-w-2xl mx-auto"
                      : "grid-cols-3"
                }`}
              >
                {Array.from({ length: imgGen.progress.totalShots || selectedShots.length }).map((_, i) => {
                  const result = imgGen.progress.results[i];
                  const isCurrent = isGenerating && imgGen.progress.currentShot === i;
                  const isFailed = imgGen.progress.failedShots.includes(i);
                  const shot = shotPlans[i];
                  const upState = result ? getUpscaleState(`gen-${i}`) : null;
                  const ar =
                    aspectRatio === "9:16"
                      ? "aspect-[9/16]"
                      : aspectRatio === "1:1"
                        ? "aspect-square"
                        : aspectRatio === "4:5"
                          ? "aspect-[4/5]"
                          : "aspect-video";

                  return (
                    <div
                      key={i}
                      className={`relative rounded-xl overflow-hidden border transition-all group ${ar} ${
                        result ? "border-border/30" : isCurrent ? "border-primary/20" : "border-white/[0.04]"
                      }`}
                    >
                      {result ? (
                        <>
                          <img
                            src={upState?.resultUrl || result.imageUrl}
                            alt={shot?.shotLabel || `Shot ${i + 1}`}
                            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                            onClick={() => setLightboxIdx(i)}
                          />
                          {shot && (
                            <span className="absolute bottom-2 left-2 text-[9px] px-2 py-0.5 rounded-md font-medium bg-black/50 text-white/80">
                              {shot.shotLabel}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <ActionBtn icon={RefreshCw} label="Regenerate" onClick={() => imgGen.retryShot(i)} />
                            <ActionBtn
                              icon={ArrowUpRight}
                              label="Upscale"
                              loading={upState?.loading}
                              onClick={() => upscale(`gen-${i}`, result.imageUrl, 2)}
                            />
                            <ActionBtn icon={Film} label="Video" onClick={() => openVideoPanel(i)} />
                          </div>
                        </>
                      ) : isCurrent ? (
                        <div className="absolute inset-0 bg-white/[0.02] flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
                          {shot && <span className="text-[10px] text-muted-foreground">{shot.shotLabel}</span>}
                        </div>
                      ) : isFailed ? (
                        <div className="absolute inset-0 bg-destructive/5 flex flex-col items-center justify-center gap-1">
                          <X className="w-4 h-4 text-destructive/60" />
                          <span className="text-[10px] text-destructive/60">Gagal</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom bar */}
              {isCompleted && completedResults.length > 0 && (
                <div className="flex items-center justify-between gap-3 py-3 mt-4 border-t border-border/30">
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      Download Semua
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                      <Save className="w-3.5 h-3.5" />
                      Simpan ke Gallery
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => setCurrentStep(1)}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Buat Lagi
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                    Total: {formatRupiah(totalCost)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ══ Video Side Panel (collapsible) ═══════════════ */}
          {videoPanelOpen && videoImageIdx !== null && (
            <div className="fixed inset-y-0 right-0 w-full lg:w-[400px] bg-card border-l border-border/40 z-40 overflow-y-auto shadow-2xl">
              <div className="p-5 space-y-5">
                {/* Panel header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">Generate Video</h3>
                  </div>
                  <button
                    onClick={() => setVideoPanelOpen(false)}
                    className="p-1.5 hover:bg-white/[0.05] rounded-lg"
                    title="Tutup"
                  >
                    <PanelRightClose className="w-4 h-4" />
                  </button>
                </div>

                {/* Source image */}
                {completedResults[videoImageIdx] && (
                  <div className="relative aspect-[9/16] max-h-[220px] rounded-xl overflow-hidden border border-border/30 mx-auto w-fit">
                    {videoResult ? (
                      <video src={videoResult} controls className="h-full w-auto" autoPlay />
                    ) : (
                      <img
                        src={completedResults[videoImageIdx]!.imageUrl}
                        alt="Source"
                        className="h-full w-auto object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Video Model */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">
                    Video Model
                  </label>
                  <Select
                    value={videoModel}
                    onValueChange={(v) => {
                      setVideoModel(v as MotionVideoModel);
                      const m = VIDEO_MODELS.find((x) => x.id === v);
                      if (m) setVideoDuration(m.minDur);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span>{m.label}</span>
                          <span className="text-muted-foreground ml-2">— {formatRupiah(m.cost)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Duration
                    </label>
                    <span className="text-xs text-foreground font-medium">{videoDuration}s</span>
                  </div>
                  {currentVideoModelInfo.minDur !== currentVideoModelInfo.maxDur ? (
                    <Slider
                      value={[videoDuration]}
                      onValueChange={([v]) => setVideoDuration(v)}
                      min={currentVideoModelInfo.minDur}
                      max={currentVideoModelInfo.maxDur}
                      step={currentVideoModelInfo.step}
                    />
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      Fixed {currentVideoModelInfo.minDur}s untuk model ini
                    </p>
                  )}
                </div>

                {/* Script (dialogue) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Script / Dialogue
                    </label>
                    <span className="text-[9px] text-muted-foreground/60">Opsional</span>
                  </div>
                  <Textarea
                    value={videoScript}
                    onChange={(e) => setVideoScript(e.target.value)}
                    className="text-xs min-h-[60px] bg-background/50 border-border/40"
                    placeholder="Contoh: Guys kalian harus coba ini, sumpah game changer banget..."
                  />
                  <p className="text-[9px] text-muted-foreground/50 mt-1">
                    Untuk Veo 3.1: karakter akan "berbicara" teks ini
                  </p>
                </div>

                {/* Motion Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Motion Prompt
                    </label>
                    <button
                      onClick={handleRegeneratePrompt}
                      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                      title="Generate ulang prompt"
                    >
                      <RotateCw className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                  <Textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="text-xs min-h-[120px] bg-background/50 border-border/40 font-mono text-[10px] leading-relaxed"
                    placeholder="Motion prompt akan di-generate otomatis..."
                  />
                </div>

                {/* Generate Video button */}
                <Button
                  onClick={handleVideoGenerate}
                  disabled={videoGenerating || !videoPrompt}
                  className="w-full h-10 text-xs font-semibold"
                >
                  {videoGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Generating Video...
                    </>
                  ) : (
                    <>Generate Video — {formatRupiah(currentVideoModelInfo.cost)}</>
                  )}
                </Button>

                {/* Video result actions */}
                {videoResult && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                      <a href={videoResult} download target="_blank" rel="noreferrer">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setVideoResult(null)}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Buat Lagi
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Lightbox ════════════════════════════════════════ */}
      {lightboxIdx !== null && imgGen.progress.results[lightboxIdx] && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <img
            src={imgGen.progress.results[lightboxIdx]!.imageUrl}
            alt="Full"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-xl hover:bg-black/70"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Helper Components ──────────────────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{label}</h3>
      {children}
    </div>
  );
}

function DNACard({ dna }: { dna: ProductDNA }) {
  const colors: Record<string, string> = {
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
        <span className={`text-[9px] px-2 py-0.5 rounded-md font-medium ${colors[dna.category] || colors.other}`}>
          {dna.category}
        </span>
        <span className="text-[10px] text-muted-foreground">{dna.sub_category}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm border border-border/40" style={{ backgroundColor: dna.dominant_color }} />
        <span className="text-[10px] text-muted-foreground">{dna.brand_name}</span>
      </div>
      {dna.ugc_hook && <p className="text-[10px] text-muted-foreground/80 italic">"{dna.ugc_hook}"</p>}
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  loading,
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
        onClick();
      }}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
      title={label}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

export default GeneratePage;
